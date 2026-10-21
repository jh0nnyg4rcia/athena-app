import { auth } from '../lib/firebase';
import type { HighlightColor, PersonalHighlight } from '../types';
import { getApiUrl } from './geminiService';

export const HIGHLIGHT_COLORS: Record<HighlightColor, { name: string; hex: string; bgClass: string; borderClass: string; textClass: string }> = {
  yellow: {
    name: 'Amarelo',
    hex: '#eab308',
    bgClass: 'bg-amber-400/30',
    borderClass: 'border-b-amber-400',
    textClass: 'text-amber-200'
  },
  red: {
    name: 'Vermelho',
    hex: '#ef4444',
    bgClass: 'bg-rose-500/30',
    borderClass: 'border-b-rose-500',
    textClass: 'text-rose-200'
  },
  green: {
    name: 'Verde',
    hex: '#22c55e',
    bgClass: 'bg-emerald-500/30',
    borderClass: 'border-b-emerald-500',
    textClass: 'text-emerald-200'
  },
  pink: {
    name: 'Rosa',
    hex: '#ec4899',
    bgClass: 'bg-pink-500/30',
    borderClass: 'border-b-pink-500',
    textClass: 'text-pink-200'
  },
  blue: {
    name: 'Azul',
    hex: '#3b82f6',
    bgClass: 'bg-sky-500/30',
    borderClass: 'border-b-sky-500',
    textClass: 'text-sky-200'
  }
};

function storageKey(uid: string, lessonId: string): string {
  return `athena_highlights_${uid}_${lessonId}`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const current = auth.currentUser;
  if (!current) return { 'Content-Type': 'application/json' };
  const token = await current.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export function loadLocalHighlights(uid: string, lessonId: string): PersonalHighlight[] {
  try {
    const raw = localStorage.getItem(storageKey(uid, lessonId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLocalHighlights(uid: string, lessonId: string, list: PersonalHighlight[]): void {
  try {
    localStorage.setItem(storageKey(uid, lessonId), JSON.stringify(list));
  } catch {
    /* storage indisponível */
  }
}

/**
 * Carrega as marcações da aula: primeiro do cache local, sincronizando com a API do servidor.
 */
export async function fetchPersonalHighlights(lessonId: string): Promise<PersonalHighlight[]> {
  const user = auth.currentUser;
  const uid = user?.uid || 'local_anonymous';
  const cached = loadLocalHighlights(uid, lessonId);

  if (!user) {
    return cached;
  }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(getApiUrl(`/api/study/personal-highlights?lessonId=${encodeURIComponent(lessonId)}`), { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.highlights)) {
        // Mesclar garantindo os mais recentes por updatedAt
        const map = new Map<string, PersonalHighlight>();
        cached.forEach(h => map.set(h.id, h));
        data.highlights.forEach((h: PersonalHighlight) => {
          const prev = map.get(h.id);
          if (!prev || (h.updatedAt || 0) >= (prev.updatedAt || 0)) {
            map.set(h.id, h);
          }
        });
        const merged = Array.from(map.values());
        saveLocalHighlights(uid, lessonId, merged);
        return merged;
      }
    }
  } catch (e) {
    console.warn('[PersonalHighlights] Falha ao sincronizar marcações com o servidor. Usando local.', e);
  }

  return cached;
}

/**
 * Salva uma nova marcação ou atualiza uma existente.
 */
export async function persistPersonalHighlight(highlight: PersonalHighlight): Promise<PersonalHighlight> {
  const user = auth.currentUser;
  const uid = user?.uid || 'local_anonymous';
  const list = loadLocalHighlights(uid, highlight.lessonId);
  const idx = list.findIndex(h => h.id === highlight.id);
  if (idx >= 0) {
    list[idx] = highlight;
  } else {
    list.push(highlight);
  }
  saveLocalHighlights(uid, highlight.lessonId, list);

  if (user) {
    try {
      const headers = await getAuthHeaders();
      await fetch(getApiUrl('/api/study/personal-highlights'), {
        method: 'POST',
        headers,
        body: JSON.stringify(highlight)
      });
    } catch (e) {
      console.warn('[PersonalHighlights] Falha ao sincronizar salvamento no servidor.', e);
    }
  }

  return highlight;
}

/**
 * Altera a cor de uma marcação existente.
 */
export async function changePersonalHighlightColor(
  highlightId: string,
  color: HighlightColor,
  lessonId: string
): Promise<PersonalHighlight | null> {
  const user = auth.currentUser;
  const uid = user?.uid || 'local_anonymous';
  const list = loadLocalHighlights(uid, lessonId);
  const target = list.find(h => h.id === highlightId);
  if (!target) return null;

  const updated: PersonalHighlight = {
    ...target,
    color,
    updatedAt: Date.now()
  };

  return persistPersonalHighlight(updated);
}

/**
 * Remove uma marcação pessoal.
 */
export async function removePersonalHighlight(highlightId: string, lessonId: string): Promise<boolean> {
  const user = auth.currentUser;
  const uid = user?.uid || 'local_anonymous';
  const list = loadLocalHighlights(uid, lessonId);
  const filtered = list.filter(h => h.id !== highlightId);
  saveLocalHighlights(uid, lessonId, filtered);

  if (user) {
    try {
      const headers = await getAuthHeaders();
      await fetch(getApiUrl(`/api/study/personal-highlights/${encodeURIComponent(highlightId)}`), {
        method: 'DELETE',
        headers
      });
    } catch (e) {
      console.warn('[PersonalHighlights] Falha ao sincronizar remoção no servidor.', e);
    }
  }

  return true;
}

/**
 * Normaliza trechos para conciliação robusta ignorando diferenças mecânicas
 * de markdown (negrito, itálico, cabeçalhos, quebras de linha e múltiplos espaços).
 */
export function cleanTextForMatching(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/[*_#`>~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reconciliação inequívoca de marcações com o conteúdo da aula:
 * - Caso 1: O trecho ocorre exatamente uma vez no bloco -> correspondência inequívoca (active).
 * - Caso 2: O trecho ocorre mais de uma vez, mas o contexto (prefixo/sufixo) é único -> inequívoco (active).
 * - Caso 3: O trecho não ocorre ou permanece ambíguo -> preservado como pendente (pending_match).
 */
export function reconcileHighlightsWithBlock(
  highlights: PersonalHighlight[],
  blockText: string,
  blockIndex: number,
  currentLessonVersion?: number,
  currentLessonSha256?: string
): {
  activeHighlights: PersonalHighlight[];
  pendingHighlights: Array<PersonalHighlight & { isLessonUpdated?: boolean }>;
} {
  const activeHighlights: PersonalHighlight[] = [];
  const pendingHighlights: Array<PersonalHighlight & { isLessonUpdated?: boolean }> = [];

  const blockHighlights = highlights.filter(h => (h.blockIndex ?? 0) === blockIndex);
  const cleanBlock = cleanTextForMatching(blockText);

  for (const h of blockHighlights) {
    const rawText = h.selectedText.trim();
    if (!rawText) continue;

    // 1. Tentar busca literal direta
    let count = 0;
    let pos = 0;
    const rawIndices: number[] = [];
    while ((pos = blockText.indexOf(rawText, pos)) !== -1) {
      count++;
      rawIndices.push(pos);
      pos += rawText.length;
    }

    if (count === 1) {
      activeHighlights.push({ ...h, status: 'active' });
      continue;
    }

    // 2. Se a busca direta não foi unívoca, conciliar via texto normalizado
    // (elimina divergências de negrito, itálico e espaçamento no markdown)
    const cleanTarget = cleanTextForMatching(rawText);
    if (!cleanTarget) continue;

    let normCount = 0;
    let normPos = 0;
    const normIndices: number[] = [];
    while ((normPos = cleanBlock.indexOf(cleanTarget, normPos)) !== -1) {
      normCount++;
      normIndices.push(normPos);
      normPos += cleanTarget.length;
    }

    const hasUpdateEvidence = Boolean(
      (h.lessonVersion !== undefined && currentLessonVersion !== undefined && currentLessonVersion > h.lessonVersion) ||
      (h.lessonSha256 && currentLessonSha256 && h.lessonSha256 !== currentLessonSha256)
    );

    if (normCount === 1) {
      // Correspondência inequívoca via normalização de formatação
      activeHighlights.push({ ...h, status: 'active' });
    } else if (normCount > 1) {
      // Múltiplas ocorrências: verificar contexto de prefixo e sufixo normalizados
      const cleanPrefix = cleanTextForMatching(h.prefix || '');
      const cleanSuffix = cleanTextForMatching(h.suffix || '');
      let contextualMatches = 0;

      for (const idx of normIndices) {
        const rawPrefix = h.prefix || '';
        const rawSuffix = h.suffix || '';
        const pSlice = cleanBlock.slice(Math.max(0, idx - (rawPrefix.length || 20)), idx);
        const sSlice = cleanBlock.slice(idx + cleanTarget.length, idx + cleanTarget.length + (rawSuffix.length || 20));

        const prefixOk = !cleanPrefix || pSlice === rawPrefix || pSlice.trim().endsWith(cleanPrefix) || cleanPrefix.endsWith(pSlice.trim());
        const suffixOk = !cleanSuffix || sSlice === rawSuffix || sSlice.trim().startsWith(cleanSuffix) || cleanSuffix.startsWith(sSlice.trim());

        if (prefixOk && suffixOk) {
          contextualMatches++;
        }
      }

      if (contextualMatches === 1) {
        activeHighlights.push({ ...h, status: 'active' });
      } else {
        // Ambiguidade não resolvida: preserva sem descartar
        pendingHighlights.push({
          ...h,
          status: 'pending_match',
          isLessonUpdated: hasUpdateEvidence
        });
      }
    } else {
      // Trecho não localizado no bloco: preserva como pendente
      pendingHighlights.push({
        ...h,
        status: 'pending_match',
        isLessonUpdated: hasUpdateEvidence
      });
    }
  }

  return { activeHighlights, pendingHighlights };
}
