import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { HighlightColor, PersonalHighlight } from '../types';
import {
  fetchPersonalHighlights,
  persistPersonalHighlight,
  changePersonalHighlightColor,
  removePersonalHighlight,
  reconcileHighlightsWithBlock,
  HIGHLIGHT_COLORS
} from '../services/personalHighlightsClient';
import { HighlightToolbar } from './HighlightToolbar';
import { emphasizeStudyMarkdown } from '../lib/emphasizeStudyMarkdown';
import { presentSavedLesson } from '../lib/presentSavedLesson';
import { auth } from '../lib/firebase';

interface HighlightableContentProps {
  content: string;
  lessonId: string;
  blockIndex?: number;
  lessonVersion?: number;
  lessonSha256?: string;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Função pura que insere elementos <mark> nos trechos com correspondência inequívoca.
 * Preserva nós React filhos (links, negrito, itálico) e a estrutura sintática.
 */
function injectHighlightsIntoNode(
  node: React.ReactNode,
  activeHighlights: PersonalHighlight[],
  onHighlightClick: (h: PersonalHighlight, e: React.MouseEvent) => void
): React.ReactNode {
  if (typeof node === 'string') {
    if (!node || activeHighlights.length === 0) return node;

    type MatchSegment = { start: number; end: number; highlight: PersonalHighlight };
    const matches: MatchSegment[] = [];

    for (const h of activeHighlights) {
      const text = h.selectedText.trim();
      if (!text) continue;

      // 1. Busca literal exata
      let pos = 0;
      while ((pos = node.indexOf(text, pos)) !== -1) {
        const overlaps = matches.some(m => Math.max(m.start, pos) < Math.min(m.end, pos + text.length));
        if (!overlaps) {
          matches.push({ start: pos, end: pos + text.length, highlight: h });
        }
        pos += text.length;
      }

      // 2. Busca flexível por palavras (tolera quebras de linha e múltiplos espaços na renderização)
      const words = text.split(/\s+/).filter(Boolean).map(escapeRegExp);
      if (words.length > 0) {
        const pattern = new RegExp(words.join('\\s+'), 'g');
        let regMatch: RegExpExecArray | null;
        while ((regMatch = pattern.exec(node)) !== null) {
          const start = regMatch.index;
          const end = start + regMatch[0].length;
          const overlaps = matches.some(m => Math.max(m.start, start) < Math.min(m.end, end));
          if (!overlaps) {
            matches.push({ start, end, highlight: h });
          }
        }
      }

      // 3. Correspondência de nós filhos adjacentes (ex: nó dentro de <strong> ou <em> contido na seleção)
      const trimmedNode = node.trim();
      if (trimmedNode.length >= 3 && text.includes(trimmedNode)) {
        const start = node.indexOf(trimmedNode);
        if (start !== -1) {
          const end = start + trimmedNode.length;
          const overlaps = matches.some(m => Math.max(m.start, start) < Math.min(m.end, end));
          if (!overlaps) {
            matches.push({ start, end, highlight: h });
          }
        }
      }
    }

    if (matches.length === 0) return node;

    // Ordenar por posição inicial
    matches.sort((a, b) => a.start - b.start);

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((m, idx) => {
      if (m.start > lastIndex) {
        elements.push(node.slice(lastIndex, m.start));
      }

      const h = m.highlight;
      const colorCfg = HIGHLIGHT_COLORS[h.color];
      elements.push(
        <mark
          key={`mark-${h.id}-${idx}`}
          data-highlight-id={h.id}
          tabIndex={0}
          role="mark"
          aria-label={`Marcação pessoal em ${colorCfg.name}: ${h.selectedText}`}
          className={`athena-highlight athena-highlight-${h.color}`}
          onClick={(e) => {
            e.stopPropagation();
            onHighlightClick(h, e);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onHighlightClick(h, e as any);
            }
          }}
        >
          {node.slice(m.start, m.end)}
        </mark>
      );
      lastIndex = m.end;
    });

    if (lastIndex < node.length) {
      elements.push(node.slice(lastIndex));
    }

    return elements;
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    if (element.props.children) {
      return React.cloneElement(element, {
        children: injectHighlightsIntoNode(element.props.children, activeHighlights, onHighlightClick)
      });
    }
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>
        {injectHighlightsIntoNode(child, activeHighlights, onHighlightClick)}
      </React.Fragment>
    ));
  }

  return node;
}

export const HighlightableContent: React.FC<HighlightableContentProps> = memo(({
  content,
  lessonId,
  blockIndex = 0,
  lessonVersion,
  lessonSha256
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<PersonalHighlight[]>([]);
  const [showPendingDrawer, setShowPendingDrawer] = useState(false);

  // Estado da Toolbar flutuante para nova seleção
  const [selectionToolbar, setSelectionToolbar] = useState<{
    position: { top: number; left: number };
    selectedText: string;
    prefix: string;
    suffix: string;
  } | null>(null);

  // Estado da Toolbar flutuante para editar marcação existente
  const [editToolbar, setEditToolbar] = useState<{
    position: { top: number; left: number };
    highlight: PersonalHighlight;
  } | null>(null);

  // Carregar marcações da aula
  useEffect(() => {
    let isMounted = true;
    if (!lessonId) return;

    fetchPersonalHighlights(lessonId).then((loaded) => {
      if (isMounted) {
        setHighlights(loaded);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  const processedContent = emphasizeStudyMarkdown(presentSavedLesson(content));

  // Reconciliação inequívoca de marcações com o conteúdo deste bloco
  const { activeHighlights, pendingHighlights } = reconcileHighlightsWithBlock(
    highlights,
    processedContent,
    blockIndex,
    lessonVersion,
    lessonSha256
  );

  // Monitorar seleções de texto (Mouse e Touch)
  const handleSelectionCheck = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) {
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length === 0) {
      return;
    }

    // Verificar se a seleção está dentro deste bloco
    if (!containerRef.current.contains(selection.anchorNode) || !containerRef.current.contains(selection.focusNode)) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Extrair contexto de prefixo e sufixo a partir do texto completo do container
    const fullContainerText = containerRef.current.innerText || '';
    const startOffset = Math.max(0, fullContainerText.indexOf(text));
    const prefix = fullContainerText.slice(Math.max(0, startOffset - 30), startOffset);
    const suffix = fullContainerText.slice(startOffset + text.length, startOffset + text.length + 30);

    setSelectionToolbar({
      position: {
        top: rect.top - 52,
        left: rect.left + rect.width / 2 - 110
      },
      selectedText: text,
      prefix,
      suffix
    });
    setEditToolbar(null);
  }, []);

  // Aplicar cor em texto recém-selecionado
  const handleApplyColor = async (color: HighlightColor) => {
    if (!selectionToolbar) return;

    const newHighlight: PersonalHighlight = {
      id: crypto.randomUUID(),
      uid: auth.currentUser?.uid || 'local_user',
      lessonId,
      blockIndex,
      selectedText: selectionToolbar.selectedText,
      prefix: selectionToolbar.prefix,
      suffix: selectionToolbar.suffix,
      color,
      lessonVersion,
      lessonSha256,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active'
    };

    setHighlights((prev) => [...prev, newHighlight]);
    setSelectionToolbar(null);

    // Limpar seleção nativa
    window.getSelection()?.removeAllRanges();

    await persistPersonalHighlight(newHighlight);
  };

  // Alterar cor de marcação existente
  const handleChangeExistingColor = async (color: HighlightColor) => {
    if (!editToolbar) return;
    const targetId = editToolbar.highlight.id;

    setHighlights((prev) =>
      prev.map((h) => (h.id === targetId ? { ...h, color, updatedAt: Date.now() } : h))
    );
    setEditToolbar(null);

    await changePersonalHighlightColor(targetId, color, lessonId);
  };

  // Remover marcação existente
  const handleRemoveExisting = async (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setEditToolbar(null);

    await removePersonalHighlight(id, lessonId);
  };

  // Clique sobre marcação existente para abrir menu de edição
  const handleHighlightClick = useCallback((h: PersonalHighlight, e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    setEditToolbar({
      position: {
        top: rect.top - 52,
        left: rect.left + rect.width / 2 - 110
      },
      highlight: h
    });
    setSelectionToolbar(null);
  }, []);

  // Componentes customizados do ReactMarkdown para injetar <mark> preservando HTML semântico
  const markdownComponents = {
    p: ({ children }: any) => <p>{injectHighlightsIntoNode(children, activeHighlights, handleHighlightClick)}</p>,
    li: ({ children }: any) => <li>{injectHighlightsIntoNode(children, activeHighlights, handleHighlightClick)}</li>,
    blockquote: ({ children }: any) => (
      <blockquote>{injectHighlightsIntoNode(children, activeHighlights, handleHighlightClick)}</blockquote>
    ),
    h1: ({ children }: any) => <h1>{injectHighlightsIntoNode(children, activeHighlights, handleHighlightClick)}</h1>,
    h2: ({ children }: any) => <h2>{injectHighlightsIntoNode(children, activeHighlights, handleHighlightClick)}</h2>,
    h3: ({ children }: any) => <h3>{injectHighlightsIntoNode(children, activeHighlights, handleHighlightClick)}</h3>,
    strong: ({ children }: any) => <strong>{injectHighlightsIntoNode(children, activeHighlights, handleHighlightClick)}</strong>,
    em: ({ children }: any) => <em>{injectHighlightsIntoNode(children, activeHighlights, handleHighlightClick)}</em>
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleSelectionCheck}
      onTouchEnd={handleSelectionCheck}
      className="athena-highlightable-container relative"
    >
      <ReactMarkdown components={markdownComponents}>
        {emphasizeStudyMarkdown(presentSavedLesson(content))}
      </ReactMarkdown>

      {/* Toolbar flutuante para nova marcação */}
      {selectionToolbar && (
        <HighlightToolbar
          position={selectionToolbar.position}
          selectedText={selectionToolbar.selectedText}
          onApplyColor={handleApplyColor}
          onClose={() => setSelectionToolbar(null)}
        />
      )}

      {/* Toolbar flutuante para editar ou remover marcação existente */}
      {editToolbar && (
        <HighlightToolbar
          position={editToolbar.position}
          activeHighlight={editToolbar.highlight}
          onApplyColor={handleChangeExistingColor}
          onRemoveHighlight={handleRemoveExisting}
          onClose={() => setEditToolbar(null)}
        />
      )}

      {/* Notificação discreta de marcações pendentes de reconciliação */}
      {pendingHighlights.length > 0 && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
          <button
            type="button"
            onClick={() => setShowPendingDrawer(!showPendingDrawer)}
            className="w-full flex items-center justify-between font-semibold text-left"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-400 shrink-0" />
              <span>
                {pendingHighlights.some(ph => ph.isLessonUpdated)
                  ? (pendingHighlights.length === 1
                      ? '1 marcação pessoal pendente de conferência após atualização desta aula.'
                      : `${pendingHighlights.length} marcações pessoais pendentes de conferência após atualização desta aula.`)
                  : (pendingHighlights.length === 1
                      ? '1 marcação pessoal pendente de correspondência inequívoca no trecho.'
                      : `${pendingHighlights.length} marcações pessoais pendentes de correspondência inequívoca no trecho.`)}
              </span>
            </div>
            {showPendingDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showPendingDrawer && (
            <div className="mt-3 pt-2 border-t border-amber-500/20 space-y-2">
              <p className="text-[11px] text-slate-400">
                {pendingHighlights.some(ph => ph.isLessonUpdated)
                  ? 'O texto da aula foi atualizado pelo catálogo e os trechos abaixo não puderam ser ancorados de forma inequívoca:'
                  : 'Os trechos abaixo possuem múltiplas ocorrências ou não puderam ser ancorados de forma inequívoca:'}
              </p>
              {pendingHighlights.map((ph) => (
                <div
                  key={ph.id}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-900/60 rounded-lg border border-white/5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      style={{ backgroundColor: HIGHLIGHT_COLORS[ph.color].hex }}
                      className="w-3 h-3 rounded-full shrink-0"
                    />
                    <span className="truncate italic font-mono text-[11px] text-slate-300">
                      "{ph.selectedText}"
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExisting(ph.id)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline shrink-0"
                  >
                    Descartar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

HighlightableContent.displayName = 'HighlightableContent';
