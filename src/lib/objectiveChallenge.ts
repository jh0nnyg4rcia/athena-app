import type { ChallengeData, Question } from '../types';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function optionText(opt: unknown): string {
  if (typeof opt === 'string') return opt.trim();
  const rec = asRecord(opt);
  if (!rec) return '';
  const raw = rec.text ?? rec.label ?? rec.option ?? rec.conteudo ?? rec.content;
  return typeof raw === 'string' ? raw.trim() : '';
}

function toCorrectIndex(value: unknown, optionCount: number): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const n = Math.trunc(value);
    if (n >= 0 && n < optionCount) return n;
    if (n >= 1 && n <= optionCount) return n - 1;
    return null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (/^[0-4]$/.test(trimmed)) {
    const n = Number(trimmed);
    return n < optionCount ? n : null;
  }
  if (/^[1-5]$/.test(trimmed)) {
    const n = Number(trimmed);
    if (n >= 1 && n <= optionCount && n >= optionCount) return n - 1;
  }
  const letter = trimmed.toUpperCase().replace(/[^A-E]/g, '');
  if (letter.length === 1) {
    const idx = LETTERS.indexOf(letter);
    if (idx >= 0 && idx < optionCount) return idx;
  }
  return null;
}

function questionList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const rec = asRecord(raw);
  if (!rec) return [];
  const list = rec.questions ?? rec.questoes ?? rec.itens ?? rec.items;
  return Array.isArray(list) ? list : [];
}

/** Mantém só múltipla escolha com gabarito 0–4. Descarta discursiva e oral. */
export function normalizeObjectiveChallenge(raw: unknown): ChallengeData | undefined {
  const questions: Question[] = [];
  for (const item of questionList(raw)) {
    const rec = asRecord(item);
    if (!rec) continue;
    const text = String(rec.text ?? rec.enunciado ?? rec.question ?? '').trim();
    const options = (Array.isArray(rec.options) ? rec.options : Array.isArray(rec.alternativas) ? rec.alternativas : [])
      .map(optionText)
      .filter(Boolean)
      .slice(0, 5);
    if (!text || options.length < 2) continue;
    const correctIndex = toCorrectIndex(
      rec.correctIndex ?? rec.correctAnswer ?? rec.gabarito ?? rec.answer ?? rec.resposta,
      options.length
    );
    if (correctIndex === null || correctIndex < 0) continue;
    questions.push({
      text,
      options,
      correctIndex,
      explanation: String(rec.explanation ?? rec.explicacao ?? rec.comment ?? '').trim()
    });
  }
  if (!questions.length) return undefined;
  return { questions };
}

export function extractBalancedJson(text: string, fromIndex = 0): { json: string; end: number } | null {
  const start = text.indexOf('{', fromIndex);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return { json: text.slice(start, i + 1), end: i + 1 };
    }
  }
  return null;
}

function parseJsonLoose(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    try {
      return JSON.parse(json.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      return undefined;
    }
  }
}

/** Tira o JSON do desafio do texto sem apagar o bloco seguinte. */
export function extractChallengeFromText(text: string): { challenge?: ChallengeData; content: string } {
  const source = text || '';
  const match = /\[ATHENA_CHALLENGE\]/i.exec(source);
  if (!match) return { content: source };
  const balanced = extractBalancedJson(source, match.index + match[0].length);
  if (!balanced) return { content: source };
  const challenge = normalizeObjectiveChallenge(parseJsonLoose(balanced.json));
  const content = `${source.slice(0, match.index)}${source.slice(balanced.end)}`.replace(/\n{3,}/g, '\n\n');
  return { challenge, content };
}

export function parseChallengeModelOutput(text: string): ChallengeData | undefined {
  const source = (text || '').trim();
  if (!source) return undefined;
  const tagged = /\[ATHENA_CHALLENGE\]/i.test(source) ? source : `[ATHENA_CHALLENGE]\n${source}`;
  return extractChallengeFromText(tagged).challenge;
}

function objectiveIntro(existing: string): string {
  const cleaned = existing
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*---\s*$/gm, '')
    .trim();
  const discursive = /discursiv|argui[cç][aã]o oral|prova oral|peça pr[aá]tica|caso pr[aá]tico/i.test(cleaned);
  const objective = /m[uú]ltipla escolha|quest[õo]es objetiv/i.test(cleaned);
  if (!cleaned || cleaned.length < 40 || (discursive && !objective)) {
    return '### Desafio ATHENA\n\nResolva as questões objetivas de múltipla escolha abaixo. Cada item tem uma única alternativa correta.';
  }
  return cleaned;
}

/** Coloca o JSON das questões dentro do [BLOCK_5], preservando os outros blocos. */
export function embedChallengeInContent(content: string, challenge: ChallengeData): string {
  const normalized = normalizeObjectiveChallenge(challenge);
  if (!normalized) return content || '';
  const stripped = extractChallengeFromText(content || '').content;
  const payload = `\n\n[ATHENA_CHALLENGE]\n${JSON.stringify({ questions: normalized.questions })}\n`;
  const marker = '[BLOCK_5]';
  const start = stripped.indexOf(marker);
  if (start === -1) {
    const block = `${marker}\n### Desafio ATHENA\n${payload}\n`;
    const b6 = stripped.indexOf('[BLOCK_6]');
    if (b6 === -1) return `${stripped.trim()}\n\n${block}`;
    return `${stripped.slice(0, b6)}${block}${stripped.slice(b6)}`;
  }
  const contentStart = start + marker.length;
  const b6 = stripped.indexOf('[BLOCK_6]', contentStart);
  const end = b6 === -1 ? stripped.length : b6;
  const intro = objectiveIntro(stripped.slice(contentStart, end));
  return `${stripped.slice(0, start)}${marker}\n${intro}${payload}\n${stripped.slice(end)}`;
}

export function findChallengeBlockIndex(blocks: string[] | undefined): number {
  if (!blocks?.length) return -1;
  const idx = blocks.findIndex((block) => /desafio\s+athena/i.test(block || ''));
  if (idx >= 0) return idx;
  if (blocks.length >= 5) return 4;
  return blocks.length - 1;
}

export function resolveDisplayedChallenge(input: {
  messageChallenge?: unknown;
  messageContent?: string;
  officialChallenge?: unknown;
  officialContent?: string;
}): ChallengeData | undefined {
  return (
    normalizeObjectiveChallenge(input.messageChallenge) ||
    extractChallengeFromText(input.messageContent || '').challenge ||
    normalizeObjectiveChallenge(input.officialChallenge) ||
    extractChallengeFromText(input.officialContent || '').challenge
  );
}
