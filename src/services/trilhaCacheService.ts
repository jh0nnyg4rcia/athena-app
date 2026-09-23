import { TrilhaPartCache } from '../types';
import {
  getRememberedTrilhaPart,
  hydrateLessonVault,
  persistLocalStorageSafe,
  putVaultTrilhaPart,
  listRememberedTrilhaParts,
  trilhaVaultId
} from './lessonVault';

const CACHE_PREFIX = 'athena_trilha_cache_';

void hydrateLessonVault();

/**
 * Retorna o conteúdo em cache de uma parte específica da Trilha Jurídica se já foi gerado.
 */
export function getCachedTrilhaPart(
  dayNum: number,
  partIndex: number,
  style: string = 'teorico'
): TrilhaPartCache | null {
  const id = trilhaVaultId(dayNum, partIndex, style);
  const mem = getRememberedTrilhaPart(id);
  if (mem?.text?.trim()) {
    return { text: mem.text, model: mem.model, timestamp: mem.timestamp };
  }
  try {
    const key = `${CACHE_PREFIX}${id}`;
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
    persistLocalStorageSafe(key, JSON.stringify(entry));
    void putVaultTrilhaPart({
      id: trilhaVaultId(dayNum, partIndex, style),
      day: dayNum,
      part: partIndex,
      style,
      ...entry
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('athena-trilha-cached', {
        detail: { day: dayNum, part: partIndex, style, text: entry.text, timestamp: entry.timestamp }
      }));
    }
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

export function listCachedTrilhaParts(): Array<{ day: number; part: number; style: string; text: string; timestamp: number }> {
  const byId = new Map<string, { day: number; part: number; style: string; text: string; timestamp: number }>();
  if (typeof window === 'undefined') {
    for (const part of listRememberedTrilhaParts()) {
      if (!part?.text) continue;
      byId.set(part.id, {
        day: part.day,
        part: part.part,
        style: part.style,
        text: part.text,
        timestamp: part.timestamp || Date.now()
      });
    }
    return Array.from(byId.values());
  }
  try {
    const re = new RegExp(`^${CACHE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}d(\\d+)_p(\\d+)_(.+)$`);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(CACHE_PREFIX)) continue;
      const match = key.match(re);
      if (!match) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as TrilhaPartCache;
        if (parsed?.text) {
          byId.set(key, {
            day: Number(match[1]),
            part: Number(match[2]),
            style: match[3],
            text: parsed.text,
            timestamp: parsed.timestamp || Date.now()
          });
        }
      } catch {
        /* ignore broken cache entries */
      }
    }
  } catch (err) {
    console.warn('[TrilhaCache] Erro ao listar cache:', err);
  }
  for (const part of listRememberedTrilhaParts()) {
    if (!part?.text) continue;
    byId.set(part.id, {
      day: part.day,
      part: part.part,
      style: part.style,
      text: part.text,
      timestamp: part.timestamp || Date.now()
    });
  }
  return Array.from(byId.values());
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

/**
 * Sanitiza o cache local para cursos de 1ª Fase (Objetiva):
 * remove apenas caches de subjetiva/oral. Nunca apaga partes teóricas já geradas.
 */
export function sanitizeTrilhaCacheForObjectivePhase(): void {
  try {
    const keysToProcess: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToProcess.push(key);
      }
    }

    let purgedCount = 0;

    for (const key of keysToProcess) {
      if (key.endsWith('_subjetiva') || key.endsWith('_oral')) {
        localStorage.removeItem(key);
        purgedCount++;
      }
    }

    if (purgedCount > 0) {
      console.log(`[TrilhaCache] Sanitização 1ª Fase: ${purgedCount} caches subjetiva/oral removidos. Cache teórico preservado.`);
    }
  } catch (err) {
    console.warn('[TrilhaCache] Erro geral ao sanitizar cache para 1ª fase:', err);
  }
}

