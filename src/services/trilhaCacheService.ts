import { TrilhaPartCache } from '../types';

const CACHE_PREFIX = 'athena_trilha_cache_';

/**
 * Retorna o conteúdo em cache de uma parte específica da Trilha Jurídica se já foi gerado.
 */
export function getCachedTrilhaPart(
  dayNum: number,
  partIndex: number,
  style: string = 'teorico'
): TrilhaPartCache | null {
  try {
    const key = `${CACHE_PREFIX}d${dayNum}_p${partIndex}_${style}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrilhaPartCache;
    if (parsed && typeof parsed.text === 'string' && parsed.text.trim()) {
      return parsed;
    }
  } catch (err) {
    console.warn('[TrilhaCache] Erro ao ler cache local:', err);
  }
  return null;
}

/**
 * Salva o conteúdo gerado de uma parte da Trilha Jurídica no cache local.
 */
export function setCachedTrilhaPart(
  dayNum: number,
  partIndex: number,
  style: string = 'teorico',
  textOrEntry: string | TrilhaPartCache,
  model: string = 'gemini-3.5-flash-lite'
): void {
  try {
    const key = `${CACHE_PREFIX}d${dayNum}_p${partIndex}_${style}`;
    let entry: TrilhaPartCache;
    if (typeof textOrEntry === 'string') {
      const trimmed = textOrEntry.trim();
      if (!trimmed) return;
      entry = {
        text: trimmed,
        model,
        timestamp: Date.now()
      };
    } else if (textOrEntry && typeof textOrEntry === 'object') {
      entry = {
        text: (textOrEntry.text || '').trim(),
        model: textOrEntry.model || model,
        timestamp: textOrEntry.timestamp || Date.now()
      };
    } else {
      return;
    }
    localStorage.setItem(key, JSON.stringify(entry));
    console.log(`[TrilhaCache] Parte ${partIndex + 1} do Dia ${dayNum} (${style}) armazenada em cache com sucesso.`);
  } catch (err) {
    console.warn('[TrilhaCache] Falha ao persistir no cache local:', err);
  }
}

/**
 * Verifica se uma parte da trilha já está em cache.
 */
export function hasCachedTrilhaPart(
  dayNum: number,
  partIndex: number,
  style: string = 'teorico'
): boolean {
  return getCachedTrilhaPart(dayNum, partIndex, style) !== null;
}

/**
 * Limpa o cache da trilha (se o usuário desejar resetar).
 */
export function clearTrilhaCache(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    console.log(`[TrilhaCache] Cache limpo (${toRemove.length} partes removidas).`);
  } catch (err) {
    console.warn('[TrilhaCache] Erro ao limpar cache:', err);
  }
}
