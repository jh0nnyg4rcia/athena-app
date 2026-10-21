import type { ChallengeData, HomologatedLesson } from '../types';
import { extractBalancedJson, extractChallengeFromText, normalizeObjectiveChallenge } from './objectiveChallenge';

/** The editor owns the original Markdown; display parsing must never rewrite it. */
export function readCeoMarkdown(content: string): { content: string; challenge?: ChallengeData; blocks: string[] } {
  const tags = [...content.matchAll(/\[ATHENA_CHALLENGE\]/gi)];
  if (tags.length > 1) throw new Error('JSON de questões duplicado.');
  let challenge: ChallengeData | undefined;
  if (tags.length) {
    const tag = tags[0];
    const balanced = extractBalancedJson(content, tag.index! + tag[0].length);
    if (!balanced || content.slice(tag.index! + tag[0].length, content.indexOf('{', tag.index!)).trim()) throw new Error('JSON de questões inválido.');
    try { challenge = JSON.parse(balanced.json); } catch { throw new Error('JSON de questões inválido.'); }
    if (!challenge || !Array.isArray(challenge.questions) || !challenge.questions.length || challenge.questions.some(q =>
      !q || typeof q.text !== 'string' || !q.text.trim() || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5 ||
      q.options.some(o => typeof o !== 'string' || !o.trim()) || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length || typeof q.explanation !== 'string'
    )) throw new Error('Formato das questões incompatível.');
  }
  const markers = [...content.matchAll(/\[BLOCK_(\d+)\]/g)];
  if (markers.length !== 6 || markers.some((m, i) => Number(m[1]) !== i + 1)) throw new Error('A aula deve conter os seis blocos únicos e ordenados.');
  const display = extractChallengeFromText(content).content;
  const positions = [...display.matchAll(/\[BLOCK_(\d+)\]/g)];
  const blocks = positions.map((m, i) => display.slice(m.index! + m[0].length, positions[i + 1]?.index ?? display.length).trim());
  return { content, challenge, blocks };
}

export function ceoEditorMarkdown(message: { content: string; challenge?: ChallengeData | null }, original?: HomologatedLesson | null): string {
  if (/\[ATHENA_CHALLENGE\]/i.test(message.content) || !message.challenge) return message.content;
  if (original && extractChallengeFromText(original.content).content === message.content &&
      JSON.stringify(normalizeObjectiveChallenge(original.challenge)) === JSON.stringify(normalizeObjectiveChallenge(message.challenge))) return original.content;
  const end = message.content.indexOf('[BLOCK_6]');
  const payload = `\n[ATHENA_CHALLENGE]\n${JSON.stringify(message.challenge)}\n\n`;
  return end < 0 ? message.content + payload : message.content.slice(0, end) + payload + message.content.slice(end);
}

export function exactPublishedLesson(lesson: HomologatedLesson): HomologatedLesson {
  const parsed = readCeoMarkdown(lesson.content);
  if (lesson.challenge && !parsed.challenge) throw new Error('O Markdown não contém as questões estruturadas.');
  if (lesson.challenge && JSON.stringify(lesson.challenge) !== JSON.stringify(parsed.challenge)) throw new Error('Questões divergentes entre Markdown e challenge.');
  const result = { ...lesson, ...(parsed.challenge ? { challenge: parsed.challenge } : {}) };
  if (lesson.blocks !== undefined) {
    if (!Array.isArray(lesson.blocks) || lesson.blocks.length !== 6 || lesson.blocks.some(b => typeof b !== 'string')) throw new Error('Formato de blocks incompatível.');
    const raw = [...lesson.content.matchAll(/\[BLOCK_(\d+)\]/g)].map((m, i, all) => lesson.content.slice(m.index! + m[0].length, all[i + 1]?.index ?? lesson.content.length).trim());
    result.blocks = lesson.blocks.some(b => /\[ATHENA_CHALLENGE\]/i.test(b)) ? raw : parsed.blocks;
  }
  if (JSON.stringify(result).length > 900000 || new TextEncoder().encode(JSON.stringify(result)).length > 900000) throw new Error('A aula excede o limite seguro de gravação; nenhum conteúdo foi truncado.');
  return result;
}
