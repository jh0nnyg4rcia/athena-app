import React, { useEffect, useRef } from 'react';
import { Trash2, X, Check } from 'lucide-react';
import type { HighlightColor, PersonalHighlight } from '../types';
import { HIGHLIGHT_COLORS } from '../services/personalHighlightsClient';

interface HighlightToolbarProps {
  position: { top: number; left: number } | null;
  selectedText?: string;
  activeHighlight?: PersonalHighlight | null;
  onApplyColor: (color: HighlightColor) => void;
  onRemoveHighlight?: (id: string) => void;
  onClose: () => void;
}

const COLOR_ORDER: HighlightColor[] = ['yellow', 'red', 'green', 'pink', 'blue'];

export const HighlightToolbar: React.FC<HighlightToolbarProps> = ({
  position,
  selectedText,
  activeHighlight,
  onApplyColor,
  onRemoveHighlight,
  onClose
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!position) return null;

  // Clamping de coordenadas para manter dentro do viewport do celular e desktop
  const clampedTop = Math.max(10, position.top);
  const clampedLeft = Math.max(16, Math.min(window.innerWidth - 240, position.left));

  const isEditingExisting = Boolean(activeHighlight);

  return (
    <div
      ref={toolbarRef}
      style={{
        top: `${clampedTop}px`,
        left: `${clampedLeft}px`,
        position: 'fixed',
        zIndex: 9999
      }}
      role="dialog"
      aria-label={isEditingExisting ? 'Opções da marcação pessoal' : 'Marcar texto selecionado'}
      className="athena-highlight-floating-toolbar bg-slate-900/95 text-slate-100 border border-brand-gold/30 rounded-2xl shadow-2xl p-2.5 backdrop-blur-md flex items-center gap-2 select-none"
    >
      <div className="flex items-center gap-1.5" role="group" aria-label="Escolher cor de destaque">
        {COLOR_ORDER.map((colorKey) => {
          const cfg = HIGHLIGHT_COLORS[colorKey];
          const isSelected = activeHighlight?.color === colorKey;

          return (
            <button
              key={colorKey}
              type="button"
              onClick={() => onApplyColor(colorKey)}
              aria-label={`Marcar em ${cfg.name}`}
              title={`Marcar em ${cfg.name}`}
              style={{ backgroundColor: cfg.hex }}
              className="w-7 h-7 rounded-full transition-transform hover:scale-115 active:scale-95 flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              {isSelected && <Check size={14} className="text-slate-950 font-black stroke-[3]" />}
            </button>
          );
        })}
      </div>

      {isEditingExisting && onRemoveHighlight && activeHighlight && (
        <>
          <div className="w-px h-5 bg-white/20 mx-0.5" />
          <button
            type="button"
            onClick={() => onRemoveHighlight(activeHighlight.id)}
            aria-label="Remover marcação"
            title="Remover marcação"
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <Trash2 size={15} />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar menu de marcação"
        title="Fechar"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all focus:outline-none"
      >
        <X size={14} />
      </button>
    </div>
  );
};
