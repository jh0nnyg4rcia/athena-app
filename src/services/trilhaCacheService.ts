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

/**
 * Sanitiza o cache local para cursos de 1ª Fase (Objetiva):
 * 1. Remove qualquer cache derivado de fases subjetiva/oral gerado pelo antigo módulo híbrido.
 * 2. Purga questões discursivas (correctIndex: -1) e orais (correctIndex: -2) de lições salvas.
 * 3. Se uma lição salva continha apenas questões discursivas/orais, invalida o cache para permitir geração 100% nova com 10 questões objetivas.
 */
export function sanitizeTrilhaCacheForObjectivePhase(): void {
  try {
    const challengeKey = "[ATHENA_CHALLENGE]";
    const keysToProcess: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToProcess.push(key);
      }
    }

    let sanitizedCount = 0;
    let purgedCount = 0;

    for (const key of keysToProcess) {
      // Se for cache de subjetiva ou oral na trilha, purga diretamente
      if (key.endsWith('_subjetiva') || key.endsWith('_oral')) {
        localStorage.removeItem(key);
        purgedCount++;
        continue;
      }

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as TrilhaPartCache;
        if (!parsed || !parsed.text || !parsed.text.includes(challengeKey)) continue;

        const parts = parsed.text.split(challengeKey);
        const afterTag = parts[1].trim();
        const firstBrace = afterTag.indexOf("{");
        const lastBrace = afterTag.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = afterTag.substring(firstBrace, lastBrace + 1);
          const challenge = JSON.parse(jsonStr);

          if (challenge && Array.isArray(challenge.questions)) {
            const hasSubjetivaOrOral = challenge.questions.some(
              (q: any) => q.correctIndex === -1 || q.correctIndex === -2 || q.correctIndex < 0
            );

            if (hasSubjetivaOrOral) {
              const objectiveQuestions = challenge.questions.filter(
                (q: any) => q.correctIndex !== -1 && q.correctIndex !== -2 && q.correctIndex >= 0
              );

              if (objectiveQuestions.length === 0) {
                // Lição continha apenas discursiva/oral: remove cache para regeneração limpa de 1ª fase
                localStorage.removeItem(key);
                purgedCount++;
              } else {
                challenge.questions = objectiveQuestions;
                const newJsonStr = JSON.stringify(challenge, null, 2);
                const remainder = afterTag.substring(lastBrace + 1);
                parsed.text = `${parts[0]}${challengeKey}\n${newJsonStr}${remainder}`;
                localStorage.setItem(key, JSON.stringify(parsed));
                sanitizedCount++;
              }
            }
          }
        }
      } catch (e) {
        console.warn(`[TrilhaCache] Erro ao sanitizar chave ${key}:`, e);
      }
    }

    if (purgedCount > 0 || sanitizedCount > 0) {
      console.log(`[TrilhaCache] Sanitização 1ª Fase concluída: ${purgedCount} caches purgados, ${sanitizedCount} lições sanitizadas.`);
    }
  } catch (err) {
    console.warn('[TrilhaCache] Erro geral ao sanitizar cache para 1ª fase:', err);
  }
}

