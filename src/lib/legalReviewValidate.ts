import { changeHunks, type ChangeHunk } from "./legalReviewDiff";
import {
  institutionsNamedInClaim,
  isConfiguredOfficialUrl,
  matchOfficialHost,
} from "./legalReviewSources";
import type {
  ConsultedLegalSource,
  LegalChangeCategory,
  LegalChangeType,
  LegalConfirmation,
  LegalReviewChange,
  LegalReviewConfidence,
  LegalReviewEvidence,
  LegalReviewOutcome,
  LegalReviewSource,
  LegalReviewSummary,
  LegalSeverity,
  LegalSourceType,
  LegalUnverifiedClaim,
  LegalVerificationLevel,
} from "./legalReviewTypes";

const CHANGE_TYPES: LegalChangeType[] = [
  "CORRECAO",
  "ATUALIZACAO",
  "ACRESCIMO",
  "REMOCAO",
  "PRECISAO",
  "REESTRUTURACAO",
];
const CATEGORIES: LegalChangeCategory[] = [
  "LEGISLACAO",
  "JURISPRUDENCIA",
  "SUMULA",
  "DOUTRINA",
  "CONCEITO",
  "ATUALIZACAO",
  "OMISSAO_RELEVANTE",
  "DIDATICA",
];
const SEVERITIES: LegalSeverity[] = ["ALTA", "MEDIA", "BAIXA"];
const OUTCOMES: LegalReviewOutcome[] = ["ALTERACOES_NECESSARIAS", "SEM_ALTERACOES_RELEVANTES"];
const CONFIDENCE: LegalReviewConfidence[] = ["ALTA", "MEDIA", "BAIXA"];
const LEVELS: LegalVerificationLevel[] = [
  "VERIFICADO_COM_FONTES",
  "VERIFICACAO_PARCIAL",
  "FALHA_NA_VERIFICACAO",
];
const SOURCE_TYPES: LegalSourceType[] = [
  "LEI",
  "CONSTITUICAO",
  "DECRETO",
  "RESOLUCAO",
  "SUMULA",
  "ACORDAO",
  "REPERCUSSAO_GERAL",
  "REPETITIVO",
  "INFORMATIVO",
  "ATO_NORMATIVO",
  "OUTRO_OFICIAL",
];
const MATERIAL_TYPES = new Set<LegalChangeType>(["CORRECAO", "ATUALIZACAO", "REMOCAO", "ACRESCIMO", "PRECISAO"]);
const MATERIAL_CATEGORIES = new Set<LegalChangeCategory>([
  "LEGISLACAO",
  "JURISPRUDENCIA",
  "SUMULA",
  "ATUALIZACAO",
  "OMISSAO_RELEVANTE",
  "CONCEITO",
]);

export function safeHttpsUrl(raw: string): string | null {
  try {
    const url = new URL(String(raw || "").trim());
    if (url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** @deprecated Use safeHttpsUrl. Mantido para chamadas antigas; só aceita https. */
export function safeHttpUrl(raw: string): string | null {
  return safeHttpsUrl(raw);
}

export function canonicalSourceUrl(raw: string): string | null {
  const href = safeHttpsUrl(raw);
  if (!href) return null;
  const url = new URL(href);
  url.hash = "";
  const path = url.pathname.replace(/\/+$/, "") || "/";
  return `${url.protocol}//${url.hostname.toLowerCase()}${path}${url.search}`;
}

export function isOfficialLegalUrl(raw: string): boolean {
  return isConfiguredOfficialUrl(raw);
}

export function blockMarkers(text: string): number[] {
  const found = new Set<number>();
  const re = /\[BLOCK_(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text || ""))) found.add(Number(match[1]));
  return [...found].sort((a, b) => a - b);
}

export function markersPreserved(original: string, revised: string): boolean {
  const before = blockMarkers(original);
  return before.every((marker) => blockMarkers(revised).includes(marker));
}

export function containsHtmlMarkup(text: string): boolean {
  return /<\/?(?:p|div|br|span|html|body|script|style|table|h[1-6]|a)\b/i.test(text || "");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function clip(value: unknown, max: number): string {
  return String(value ?? "").replace(/\u0000/g, "").slice(0, max);
}

function oneOf<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  const text = String(value ?? "").trim() as T;
  return allowed.includes(text) ? text : fallback;
}

export function consultedUrlSet(urls: string[]): Set<string> {
  const found = new Set<string>();
  for (const raw of urls) {
    const canonical = canonicalSourceUrl(raw);
    if (canonical) found.add(canonical);
  }
  return found;
}

export function describeConsultedSources(urls: string[]): ConsultedLegalSource[] {
  const seen = new Set<string>();
  const out: ConsultedLegalSource[] = [];
  for (const raw of urls) {
    const href = safeHttpsUrl(raw);
    const canonical = canonicalSourceUrl(raw);
    if (!href || !canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    const host = matchOfficialHost(href);
    out.push({
      url: href,
      official: Boolean(host),
      institution: host?.label || "",
    });
  }
  return out;
}

function sourceTypeFits(sourceType: LegalSourceType, family: string): boolean {
  if (sourceType === "REPERCUSSAO_GERAL") return family === "STF";
  if (sourceType === "REPETITIVO") return family === "STJ";
  if (sourceType === "LEI" || sourceType === "CONSTITUICAO" || sourceType === "DECRETO") {
    return family === "LEGISLACAO_FEDERAL" || family === "DIARIO_OFICIAL";
  }
  if (sourceType === "SUMULA" || sourceType === "ACORDAO" || sourceType === "INFORMATIVO") {
    return family !== "LEGISLACAO_FEDERAL" && family !== "DIARIO_OFICIAL";
  }
  return true;
}

function readEvidence(value: unknown, consulted: Set<string>): LegalReviewEvidence | null {
  const record = asRecord(value);
  if (!record) return null;
  const url = safeHttpsUrl(clip(record.url, 500));
  if (!url) return null;
  const host = matchOfficialHost(url);
  const canonical = canonicalSourceUrl(url);
  const sourceType = oneOf(record.sourceType, SOURCE_TYPES, "OUTRO_OFICIAL");
  const wasConsulted = Boolean(canonical && consulted.has(canonical));
  const official = Boolean(host);
  const modelSupports = record.supportsChange === true;
  const supportsChange = Boolean(
    modelSupports && official && wasConsulted && host && sourceTypeFits(sourceType, host.family)
  );
  return {
    institution: host?.label || clip(record.institution, 160) || "Fonte",
    title: clip(record.title, 300) || host?.label || "Documento",
    url,
    official,
    consulted: wasConsulted,
    supportsChange,
    supportExplanation: clip(record.supportExplanation, 2000),
    sourceType,
  };
}

function readSource(value: unknown): LegalReviewSource | null {
  const record = asRecord(value);
  if (!record) return null;
  const url = safeHttpsUrl(clip(record.url, 500));
  if (!url) return null;
  const host = matchOfficialHost(url);
  return {
    title: clip(record.title, 300) || host?.label || "Fonte",
    url,
    official: Boolean(host),
    institution: host?.label || clip(record.institution, 160) || "Fonte",
  };
}

export function isMaterialLegalChange(change: Pick<LegalReviewChange, "type" | "category">): boolean {
  return MATERIAL_TYPES.has(change.type) && MATERIAL_CATEGORIES.has(change.category);
}

function evidenceSupportsFamily(evidence: LegalReviewEvidence, family: string): boolean {
  if (!evidence.official || !evidence.consulted || !evidence.supportsChange) return false;
  const host = matchOfficialHost(evidence.url);
  return Boolean(host && host.family === family && sourceTypeFits(evidence.sourceType, family));
}

function evidenceConfirmsMaterialClaim(evidence: LegalReviewEvidence): boolean {
  if (!evidence.official || !evidence.consulted || evidence.supportsChange !== true) return false;
  const url = safeHttpsUrl(evidence.url);
  if (!url) return false;
  const host = matchOfficialHost(url);
  return Boolean(host && sourceTypeFits(evidence.sourceType, host.family));
}

const GENERIC_NORMATIVE_PATTERNS: Array<{
  type: "organ" | "deadline" | "quorum";
  pattern: RegExp;
}> = [
  {
    type: "organ",
    pattern: /\b(?:autoridade(?:\s+judici[aá]ria)?|[oó]rg[aã]o(?:\s+(?:p[uú]blico|judici[aá]rio))?|tribunal|ju[ií]zo|foro|inst[aâ]ncia)\s+competente\b/i,
  },
  {
    type: "deadline",
    pattern: /\b(?:no\s+)?prazo\s+(?:legal|regimental|previsto\s+em\s+lei|da\s+lei)\b/i,
  },
  {
    type: "quorum",
    pattern: /\b(?:maioria\s+exigida|qu[oó]rum\s+(?:legal|exigido|qualificado))\b/i,
  },
];

const SPECIFIC_ORGAN_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "STF", pattern: /\bSTF\b|Supremo Tribunal Federal/i },
  { id: "STJ", pattern: /\bSTJ\b|Superior Tribunal de Justi[cç]a/i },
  { id: "CNJ", pattern: /\bCNJ\b|Conselho Nacional de Justi[cç]a/i },
  { id: "TSE", pattern: /\bTSE\b|Tribunal Superior Eleitoral/i },
  { id: "TST", pattern: /\bTST\b|Tribunal Superior do Trabalho/i },
  { id: "STM", pattern: /\bSTM\b|Superior Tribunal Militar/i },
  { id: "TRF", pattern: /\bTRF(?:-?\d)?\b|\bTribuna(?:l|is) Regiona(?:l|is) Federa(?:l|is)\b/i },
  { id: "TRT", pattern: /\bTRT(?:-?\d{1,2})?\b|\bTribuna(?:l|is) Regiona(?:l|is) do Trabalho\b/i },
  { id: "TJ", pattern: /\bTJ(?:-[A-Z]{2}|[A-Z]{2,3})\b|\bTribuna(?:l|is) de Justi[cç]a\b/i },
  { id: "MP", pattern: /\bMinist[eé]rio P[uú]blico\b|\bPGR\b|\bPGJ\b|\bProcurador(?:a)?-Geral\b/i },
  { id: "DP", pattern: /\bDefensoria P[uú]blica\b|\bDefensor(?:a)?\s+P[uú]blico\b/i },
  { id: "CONGRESSO", pattern: /\bCongresso Nacional\b|\bSenado Federal\b|\bC[aâ]mara dos Deputados\b/i },
  { id: "TCU", pattern: /\bTCU\b|\bTribuna(?:l|is) de Contas\b/i },
];

const SPECIFIC_DEADLINE_PATTERNS: RegExp[] = [
  /\b\d+\s+(?:dias|meses|anos|horas)\b/i,
  /\b(?:cinco|dez|quinze|vinte|trinta|quarenta\s+e\s+cinco|sessenta|noventa|cento\s+e\s+vinte)\s+dias\b/i,
];

const SPECIFIC_QUORUM_PATTERNS: RegExp[] = [
  /\bmaioria\s+(?:absoluta|simples)\b/i,
  /\b(?:dois\s+ter[cç]os|2\/3|tr[eê]s\s+quintos|3\/5|unanimidade)\b/i,
];

function organAttributedInExplanation(explanation: string, organPattern: RegExp): boolean {
  if (!explanation) return false;
  const organSource = organPattern.source;
  const organFlags = organPattern.flags.includes("i") ? "i" : "";

  // 1. Competência ou atribuição dirigida ao órgão específico:
  // ex.: "compete ao STF", "cabe ao Supremo Tribunal Federal", "atribuição do STF", "competência privativa do STF"
  const directedToOrgan = new RegExp(
    `(?:\\bcompete|\\bcompet[eê]ncia(?:\\s+(?:origin[aá]ria|exclusiva|privativa|recursal))?|\\bcaber[aá]|\\bcabe|\\batribui[cç][aã]o|\\bincumbe|\\bjulgamento\\s+(?:privativo|origin[aá]rio)?|\\baprecia[cç][aã]o)\\s+(?:ao?|pelo?|do?|da)?\\s*(?:(?:ilustre|egr[eé]gio)\\s+)?(?:${organSource})\\b`,
    organFlags
  );
  if (directedToOrgan.test(explanation)) return true;

  // 2. Órgão como sujeito com competência ou encargo jurisdicional direto:
  // ex.: "STF é competente", "Supremo Tribunal Federal possui competência", "STF deve apreciar"
  const organAsSubject = new RegExp(
    `(?:${organSource})\\s+(?:(?:[eé]\\s+competente|possui\\s+compet[eê]ncia|tem\\s+compet[eê]ncia|det[eé]m\\s+compet[eê]ncia|deve\\s+apreciar|deve\\s+julgar|aprecia\\s+o\\s+car[aá]ter|julga\\s+(?:o|a|os|as))\\b)`,
    organFlags
  );
  if (organAsSubject.test(explanation)) return true;

  // 3. Definição expressa do órgão competente:
  // ex.: "órgão competente: STF", "autoridade competente é o STF"
  const organDefined = new RegExp(
    `(?:(?:[oó]rg[aã]o|autoridade|tribunal)\\s+competente(?:\\s+[eé]|\\s*:\\s*|\\s+ser[aá])\\s+(?:o\\s+)?(?:${organSource})\\b)`,
    organFlags
  );
  if (organDefined.test(explanation)) return true;

  return false;
}

export function changeLacksNormativeSpecificity(
  change: Pick<LegalReviewChange, "originalExcerpt" | "revisedExcerpt" | "reason" | "category"> & {
    evidence?: LegalReviewEvidence[];
  }
): boolean {
  const revised = String(change.revisedExcerpt || "");
  if (!revised.trim()) return false;

  const original = String(change.originalExcerpt || "");
  const explanations = (change.evidence || []).map((e) => String(e.supportExplanation || "")).join("\n");

  for (const item of GENERIC_NORMATIVE_PATTERNS) {
    if (!item.pattern.test(revised)) continue;

    if (item.type === "organ") {
      for (const organ of SPECIFIC_ORGAN_PATTERNS) {
        const inOriginal = organ.pattern.test(original);
        const affirmedInEvidence = organAttributedInExplanation(explanations, organ.pattern);

        if ((inOriginal || affirmedInEvidence) && !organ.pattern.test(revised)) {
          return true;
        }
      }
    }

    if (item.type === "deadline") {
      for (const deadline of SPECIFIC_DEADLINE_PATTERNS) {
        const inOriginal = deadline.test(original);
        const inEvidence = deadline.test(explanations);
        if ((inOriginal || inEvidence) && !deadline.test(revised)) {
          return true;
        }
      }
    }

    if (item.type === "quorum") {
      for (const quorum of SPECIFIC_QUORUM_PATTERNS) {
        const inOriginal = quorum.test(original);
        const inEvidence = quorum.test(explanations);
        if ((inOriginal || inEvidence) && !quorum.test(revised)) {
          return true;
        }
      }
    }
  }

  return false;
}

function confirmChange(change: Omit<LegalReviewChange, "verified" | "confirmation">, modelConfirmation: LegalConfirmation): LegalConfirmation {
  if (modelConfirmation === "NAO_CONFIRMADO") return "NAO_CONFIRMADO";
  if (changeLacksNormativeSpecificity(change)) return "NAO_CONFIRMADO";
  const claim = `${change.reason}\n${change.originalExcerpt}\n${change.revisedExcerpt}`;
  const required = institutionsNamedInClaim(claim, change.category);
  if (required.length) {
    const covered = required.every((family) => change.evidence.some((item) => evidenceSupportsFamily(item, family)));
    return covered ? "CONFIRMADO" : "NAO_CONFIRMADO";
  }
  if (!isMaterialLegalChange(change)) return modelConfirmation;
  return change.evidence.some(evidenceConfirmsMaterialClaim) ? "CONFIRMADO" : "NAO_CONFIRMADO";
}

function readChange(value: unknown, index: number, consulted: Set<string>): LegalReviewChange | null {
  const record = asRecord(value);
  if (!record) return null;
  const type = oneOf(record.type, CHANGE_TYPES, "CORRECAO");
  const originalExcerpt = clip(record.originalExcerpt, 4000);
  const revisedExcerpt = clip(record.revisedExcerpt, 4000);
  if (type === "ACRESCIMO" && !revisedExcerpt.trim()) return null;
  if (type === "REMOCAO" && !originalExcerpt.trim()) return null;
  if (type !== "ACRESCIMO" && type !== "REMOCAO" && originalExcerpt.trim() === revisedExcerpt.trim()) {
    return null;
  }
  const sources = Array.isArray(record.sources)
    ? record.sources.map(readSource).filter((item): item is LegalReviewSource => Boolean(item)).slice(0, 6)
    : [];
  const evidence = Array.isArray(record.evidence)
    ? record.evidence.map((item) => readEvidence(item, consulted)).filter((item): item is LegalReviewEvidence => Boolean(item)).slice(0, 6)
    : [];
  const category = oneOf(record.category, CATEGORIES, "CONCEITO");
  const draft = {
    id: clip(record.id, 40) || `change-${index + 1}`,
    type,
    severity: oneOf(record.severity, SEVERITIES, "MEDIA"),
    category,
    originalExcerpt,
    revisedExcerpt,
    reason: clip(record.reason, 4000),
    sources,
    evidence,
  };
  const modelConfirmation: LegalConfirmation = record.confirmation === "NAO_CONFIRMADO" || record.verified === false
    ? "NAO_CONFIRMADO"
    : "CONFIRMADO";
  const confirmation = confirmChange(draft, modelConfirmation);
  return {
    ...draft,
    confirmation,
    verified: confirmation === "CONFIRMADO",
  };
}

export function summarizeChanges(changes: LegalReviewChange[]): LegalReviewSummary {
  const count = (type: LegalChangeType) => changes.filter((change) => change.type === type).length;
  return {
    totalChanges: changes.length,
    corrections: count("CORRECAO"),
    additions: count("ACRESCIMO"),
    removals: count("REMOCAO"),
    updates: count("ATUALIZACAO"),
    precisions: count("PRECISAO"),
    restructures: count("REESTRUTURACAO"),
  };
}

/**
 * Máximo de changes conferíveis. Acima disso a auditoria é recusada por inteiro.
 * Não há descarte silencioso: um item além do teto poderia ser justamente a alteração jurídica.
 * O schema não limita o array; o teto fica aqui para o erro ser explícito.
 */
export const MAX_DECLARED_CHANGES = 40;

const TOKEN_LCS_CELL_LIMIT = 250_000;
const STRUCTURAL_LINE = /^(#{1,6}\s+|(?:[-*+]|\d+[.)])\s+)/;
/**
 * § é token próprio. Vírgula, ponto e demais pontuação comum continuam fora.
 * Número com ponto interno (9.605, 999.999) e ordinal (5º) permanecem um token.
 */
const TOKEN_PATTERN = /§|[\p{L}\p{N}]+(?:[.-][\p{L}\p{N}]+)*[ºª]?/gu;

export interface CoverageHunkDiagnostic {
  kind: ChangeHunk["kind"];
  chars: number;
}

export const AUDIT_FAILURE_CODES = [
  "UNDECLARED_ADDITION",
  "UNDECLARED_REMOVAL",
  "INCOMPLETE_ADDITION_EXCERPT",
  "INCOMPLETE_REMOVAL_EXCERPT",
  "STRUCTURAL_CHANGE_UNDECLARED",
  "CHANGE_WRONG_HUNK",
  "CHANGE_WRONG_SIDE",
  "TOO_MANY_CHANGES",
  "MARKER_MISMATCH",
  "INVALID_SCHEMA",
  "HTML_REJECTED",
  "INVALID_LENGTH",
  "COVERAGE_FAILURE",
  "EMPTY_SOURCE",
] as const;

export type AuditFailureCode = (typeof AUDIT_FAILURE_CODES)[number];

export interface CoverageDiagnostics {
  reason: "ok" | "uncovered_edits" | "too_many_changes" | "invalid_audit";
  hunks: number;
  covered: number;
  uncovered: number;
  add: number;
  remove: number;
  replace: number;
  changeCount: number;
  limit: number;
  uncoveredChars: number[];
  uncoveredKinds: Array<ChangeHunk["kind"]>;
  totalHunks: number;
  coveredHunks: number;
  uncoveredHunks: number;
  totalChanges: number;
  usedChanges: number;
  unusedChanges: number;
  uncoveredRemovedTokenCount: number;
  uncoveredAddedTokenCount: number;
  uncoveredStructuralCount: number;
  maxUncoveredRemovedTokens: number;
  maxUncoveredAddedTokens: number;
  failureReasonCode?: AuditFailureCode;
  auditFailure?: AuditFailureCode;
}

export class LegalReviewValidationError extends Error {
  readonly code: "too_many_changes" | "uncovered_edits" | "invalid_audit";
  readonly auditFailure: AuditFailureCode;
  readonly diagnostics: CoverageDiagnostics;

  constructor(
    message: string,
    code: "too_many_changes" | "uncovered_edits" | "invalid_audit",
    diagnostics: CoverageDiagnostics
  ) {
    super(message);
    this.name = "LegalReviewValidationError";
    this.code = code;
    this.diagnostics = diagnostics;
    this.auditFailure = diagnostics.auditFailure || "INVALID_SCHEMA";
  }
}

/** Normaliza só o que não altera palavra, número, data, negação ou marcador estrutural. */
export function normalizeCoverageComparable(value: string): string {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function stripDecorativeMarkdown(line: string): string {
  const heading = line.match(/^(#{1,6}\s+)([\s\S]*)$/);
  const list = line.match(/^((?:[-*+]|\d+[.)])\s+)([\s\S]*)$/);
  const prefix = heading?.[1] || list?.[1] || "";
  let body = heading?.[2] ?? list?.[2] ?? line;
  body = body.replace(/\*\*([^*]+)\*\*/g, "$1");
  body = body.replace(/__([^_]+)__/g, "$1");
  body = body.replace(/`([^`]+)`/g, "$1");
  body = body.replace(/(^|\s)\*(\S(?:.*?\S)?)\*(?=\s|$)/g, "$1$2");
  body = body.replace(/(^|\s)_(\S(?:.*?\S)?)_(?=\s|$)/g, "$1$2");
  return `${prefix}${body}`.replace(/[ \t]+/g, " ").trim();
}

/** Assinatura editorial. Heading e lista permanecem; ênfase pareada sai. */
export function editorialSignature(value: string): string {
  return normalizeCoverageComparable(value)
    .split("\n")
    .map(stripDecorativeMarkdown)
    .join("\n")
    .toLocaleLowerCase("pt-BR");
}

export function coverageTokens(value: string): string[] {
  return editorialSignature(value).match(TOKEN_PATTERN) || [];
}

/** Cada token removido ou acrescentado precisa aparecer no excerpt daquele lado. */
function requiredTokenMatches(deltaLength: number): number {
  return deltaLength;
}

function orderedMatchCount(delta: string[], excerpt: string[]): number {
  let matched = 0;
  for (const token of excerpt) {
    if (matched < delta.length && token === delta[matched]) matched += 1;
  }
  return matched;
}

function coversTokens(delta: string[], excerpt: string): boolean {
  if (!delta.length) return true;
  return orderedMatchCount(delta, coverageTokens(excerpt)) >= requiredTokenMatches(delta.length);
}

function coversStructural(side: string, excerpt: string): boolean {
  const hunkSignature = editorialSignature(side);
  if (!hunkSignature) return true;
  return editorialSignature(excerpt).includes(hunkSignature);
}

export interface TokenDeltaResult {
  removed: string[];
  added: string[];
  removedMap: Map<number, number>;
  addedMap: Map<number, number>;
  commonCount: number;
}

export function tokenDeltaWithPositions(before: string[], after: string[]): TokenDeltaResult {
  if (!before.length && !after.length) {
    return { removed: [], added: [], removedMap: new Map(), addedMap: new Map(), commonCount: 0 };
  }
  if (before.length * after.length > TOKEN_LCS_CELL_LIMIT) {
    const removedMap = new Map<number, number>();
    for (let i = 0; i < before.length; i += 1) removedMap.set(i, i);
    const addedMap = new Map<number, number>();
    for (let j = 0; j < after.length; j += 1) addedMap.set(j, j);
    return { removed: before, added: after, removedMap, addedMap, commonCount: 0 };
  }
  const n = before.length;
  const m = after.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    const row = dp[i];
    const next = dp[i + 1];
    for (let j = m - 1; j >= 0; j -= 1) {
      row[j] = before[i] === after[j] ? next[j + 1] + 1 : Math.max(next[j], row[j + 1]);
    }
  }
  const removed: string[] = [];
  const added: string[] = [];
  const removedMap = new Map<number, number>();
  const addedMap = new Map<number, number>();
  let commonCount = 0;
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (before[i] === after[j]) {
      commonCount += 1;
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      removedMap.set(i, removed.length);
      removed.push(before[i]);
      i += 1;
    } else {
      addedMap.set(j, added.length);
      added.push(after[j]);
      j += 1;
    }
  }
  while (i < n) {
    removedMap.set(i, removed.length);
    removed.push(before[i]);
    i += 1;
  }
  while (j < m) {
    addedMap.set(j, added.length);
    added.push(after[j]);
    j += 1;
  }
  return { removed, added, removedMap, addedMap, commonCount };
}

function tokenDelta(before: string[], after: string[]): { removed: string[]; added: string[] } {
  const result = tokenDeltaWithPositions(before, after);
  return { removed: result.removed, added: result.added };
}

function grounded(excerpt: string, side: string): boolean {
  const excerptTokens = coverageTokens(excerpt);
  const sideTokens = coverageTokens(side);
  if (!excerptTokens.length || !sideTokens.length) return false;
  return orderedMatchCount(excerptTokens, sideTokens) === excerptTokens.length;
}

function findExcerptSideIndices(excerptTokens: string[], sideTokens: string[]): number[] | null {
  if (!excerptTokens.length || !sideTokens.length) return null;
  for (let start = 0; start <= sideTokens.length - excerptTokens.length; start += 1) {
    let matches = true;
    for (let k = 0; k < excerptTokens.length; k += 1) {
      if (sideTokens[start + k] !== excerptTokens[k]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return Array.from({ length: excerptTokens.length }, (_, k) => start + k);
    }
  }

  const matchedIndices: number[] = [];
  let eIdx = 0;
  for (let sIdx = 0; sIdx < sideTokens.length && eIdx < excerptTokens.length; sIdx += 1) {
    if (sideTokens[sIdx] === excerptTokens[eIdx]) {
      matchedIndices.push(sIdx);
      eIdx += 1;
    }
  }
  if (eIdx === excerptTokens.length) {
    return matchedIndices;
  }
  return null;
}

function coveredDeltaPositionsForChange(
  hunk: ChangeHunk,
  change: Pick<LegalReviewChange, "originalExcerpt" | "revisedExcerpt">,
  deltaInfo: TokenDeltaResult
): { coveredRemoved: Set<number>; coveredAdded: Set<number> } | null {
  const origTokens = coverageTokens(hunk.original);
  const revTokens = coverageTokens(hunk.revised);
  const chOrigTokens = coverageTokens(change.originalExcerpt);
  const chRevTokens = coverageTokens(change.revisedExcerpt);

  if (chOrigTokens.length > 0 && !grounded(change.originalExcerpt, hunk.original)) {
    return null;
  }
  if (chRevTokens.length > 0 && !grounded(change.revisedExcerpt, hunk.revised)) {
    return null;
  }
  if (chOrigTokens.length === 0 && chRevTokens.length === 0) {
    return null;
  }

  const coveredRemoved = new Set<number>();
  const coveredAdded = new Set<number>();

  if (chOrigTokens.length > 0) {
    const sideIndices = findExcerptSideIndices(chOrigTokens, origTokens);
    if (!sideIndices) return null;
    for (const idx of sideIndices) {
      const deltaIdx = deltaInfo.removedMap.get(idx);
      if (deltaIdx !== undefined) {
        coveredRemoved.add(deltaIdx);
      }
    }
  }

  if (chRevTokens.length > 0) {
    const sideIndices = findExcerptSideIndices(chRevTokens, revTokens);
    if (!sideIndices) return null;
    for (const idx of sideIndices) {
      const deltaIdx = deltaInfo.addedMap.get(idx);
      if (deltaIdx !== undefined) {
        coveredAdded.add(deltaIdx);
      }
    }
  }

  return { coveredRemoved, coveredAdded };
}

function evaluateHunkCompositeCoverage(
  hunk: ChangeHunk,
  candidateChanges: Array<{ change: Pick<LegalReviewChange, "originalExcerpt" | "revisedExcerpt">; originalIndex: number }>,
  deltaInfo: TokenDeltaResult
): { covered: boolean; usedChangeIndices: number[] } {
  if (deltaInfo.removed.length === 0 && deltaInfo.added.length === 0) {
    return { covered: false, usedChangeIndices: [] };
  }
  if (deltaInfo.commonCount === 0 && deltaInfo.removed.length > 0 && deltaInfo.added.length > 0) {
    return { covered: false, usedChangeIndices: [] };
  }
  if (!candidateChanges.length) {
    return { covered: false, usedChangeIndices: [] };
  }

  const allCoveredRemoved = new Set<number>();
  const allCoveredAdded = new Set<number>();
  const usedChangeIndices: number[] = [];

  for (const item of candidateChanges) {
    const pos = coveredDeltaPositionsForChange(hunk, item.change, deltaInfo);
    if (!pos) continue;

    let contributes = false;
    for (const r of pos.coveredRemoved) {
      if (!allCoveredRemoved.has(r)) contributes = true;
      allCoveredRemoved.add(r);
    }
    for (const a of pos.coveredAdded) {
      if (!allCoveredAdded.has(a)) contributes = true;
      allCoveredAdded.add(a);
    }

    if (contributes) {
      usedChangeIndices.push(item.originalIndex);
    }
  }

  const removed100 = allCoveredRemoved.size === deltaInfo.removed.length;
  const added100 = allCoveredAdded.size === deltaInfo.added.length;
  const ok = removed100 && added100 && usedChangeIndices.length > 0;

  return {
    covered: ok,
    usedChangeIndices: ok ? usedChangeIndices : [],
  };
}

function changeCoversHunk(
  hunk: ChangeHunk,
  change: Pick<LegalReviewChange, "originalExcerpt" | "revisedExcerpt">
): boolean {
  const delta = tokenDelta(coverageTokens(hunk.original), coverageTokens(hunk.revised));
  if (delta.removed.length === 0 && delta.added.length === 0) {
    if (hunk.kind === "add") return coversStructural(hunk.revised, change.revisedExcerpt);
    if (hunk.kind === "remove") return coversStructural(hunk.original, change.originalExcerpt);
    return coversStructural(hunk.original, change.originalExcerpt) && coversStructural(hunk.revised, change.revisedExcerpt);
  }
  if (hunk.kind === "add") {
    return grounded(change.revisedExcerpt, hunk.revised) && coversTokens(delta.added, change.revisedExcerpt);
  }
  if (hunk.kind === "remove") {
    return grounded(change.originalExcerpt, hunk.original) && coversTokens(delta.removed, change.originalExcerpt);
  }
  if (!grounded(change.originalExcerpt, hunk.original) || !grounded(change.revisedExcerpt, hunk.revised)) return false;
  const originalOk = delta.removed.length === 0 || coversTokens(delta.removed, change.originalExcerpt);
  const revisedOk = delta.added.length === 0 || coversTokens(delta.added, change.revisedExcerpt);
  return originalOk && revisedOk;
}

function sidePrefix(delta: string[], excerpt: string, side: string): number {
  if (!delta.length || !excerpt.trim()) return 0;
  if (!grounded(excerpt, side)) return 0;
  return orderedMatchCount(delta, coverageTokens(excerpt));
}

function classifyUncoveredHunk(
  hunk: ChangeHunk,
  changes: Array<Pick<LegalReviewChange, "originalExcerpt" | "revisedExcerpt">>,
  others: ChangeHunk[]
): { reason: AuditFailureCode; removed: number; added: number; structural: boolean } {
  const deltaInfo = tokenDeltaWithPositions(coverageTokens(hunk.original), coverageTokens(hunk.revised));
  const delta = { removed: deltaInfo.removed, added: deltaInfo.added };
  const removed = delta.removed.length;
  const added = delta.added.length;
  if (removed === 0 && added === 0) {
    return { reason: "STRUCTURAL_CHANGE_UNDECLARED", removed: 0, added: 0, structural: true };
  }
  let bestRemoval = 0;
  let bestAddition = 0;
  let wrongSide = false;
  for (const change of changes) {
    const removal = sidePrefix(delta.removed, change.originalExcerpt, hunk.original);
    const addition = sidePrefix(delta.added, change.revisedExcerpt, hunk.revised);
    const pos = coveredDeltaPositionsForChange(hunk, change, deltaInfo);
    const posRemoval = pos ? pos.coveredRemoved.size : 0;
    const posAddition = pos ? pos.coveredAdded.size : 0;
    bestRemoval = Math.max(bestRemoval, removal, posRemoval);
    bestAddition = Math.max(bestAddition, addition, posAddition);
    const removedOnRevised = sidePrefix(delta.removed, change.revisedExcerpt, hunk.original);
    const addedOnOriginal = sidePrefix(delta.added, change.originalExcerpt, hunk.revised);
    if ((removed > 0 && removedOnRevised > removal) || (added > 0 && addedOnOriginal > addition)) wrongSide = true;
  }
  if (removed > 0 && bestRemoval > 0 && bestRemoval < removed) {
    return { reason: "INCOMPLETE_REMOVAL_EXCERPT", removed, added, structural: false };
  }
  if (added > 0 && bestAddition > 0 && bestAddition < added) {
    return { reason: "INCOMPLETE_ADDITION_EXCERPT", removed, added, structural: false };
  }
  if (wrongSide && bestRemoval < removed && bestAddition < added) {
    return { reason: "CHANGE_WRONG_SIDE", removed, added, structural: false };
  }
  const misplaced = changes.some((change) => others.some((other) => {
    if (other === hunk || changeCoversHunk(other, change)) return false;
    const otherDelta = tokenDelta(coverageTokens(other.original), coverageTokens(other.revised));
    return sidePrefix(otherDelta.removed, change.originalExcerpt, other.original) > 0
      || sidePrefix(otherDelta.added, change.revisedExcerpt, other.revised) > 0;
  }));
  if (misplaced && bestRemoval === 0 && bestAddition === 0) {
    return { reason: "CHANGE_WRONG_HUNK", removed, added, structural: false };
  }
  if (removed > 0 && bestRemoval === 0) return { reason: "UNDECLARED_REMOVAL", removed, added, structural: false };
  return { reason: "UNDECLARED_ADDITION", removed, added, structural: false };
}

function emptyCoverage(
  reason: CoverageDiagnostics["reason"],
  changeCount = 0,
  failureReasonCode?: AuditFailureCode,
  auditFailure?: AuditFailureCode
): CoverageDiagnostics {
  return {
    reason,
    hunks: 0,
    covered: 0,
    uncovered: 0,
    add: 0,
    remove: 0,
    replace: 0,
    changeCount,
    limit: MAX_DECLARED_CHANGES,
    uncoveredChars: [],
    uncoveredKinds: [],
    totalHunks: 0,
    coveredHunks: 0,
    uncoveredHunks: 0,
    totalChanges: changeCount,
    usedChanges: 0,
    unusedChanges: changeCount,
    uncoveredRemovedTokenCount: 0,
    uncoveredAddedTokenCount: 0,
    uncoveredStructuralCount: 0,
    maxUncoveredRemovedTokens: 0,
    maxUncoveredAddedTokens: 0,
    ...(failureReasonCode ? { failureReasonCode } : {}),
    ...(auditFailure ? { auditFailure } : {}),
  };
}

function paragraphReflowOnly(before: string, after: string): boolean {
  const left = editorialSignature(before);
  const right = editorialSignature(after);
  if (left.split("\n").some((line) => STRUCTURAL_LINE.test(line))) return false;
  if (right.split("\n").some((line) => STRUCTURAL_LINE.test(line))) return false;
  const fold = (value: string) => value.replace(/\n/g, " ").replace(/[ \t]+/g, " ").trim();
  return fold(left) === fold(right);
}

function requiresDeclaredChange(hunk: ChangeHunk): boolean {
  if (editorialSignature(hunk.original) === editorialSignature(hunk.revised)) return false;
  return !paragraphReflowOnly(hunk.original, hunk.revised);
}

export function assessSubstantiveCoverage(
  original: string,
  revised: string,
  changes: Array<Pick<LegalReviewChange, "originalExcerpt" | "revisedExcerpt">>
): CoverageDiagnostics {
  const substantive = changeHunks(original, revised).filter(requiresDeclaredChange);
  const used = new Set<number>();
  const uncovered: CoverageHunkDiagnostic[] = [];
  const uncoveredHunks: ChangeHunk[] = [];
  let covered = 0;
  for (const hunk of substantive) {
    const index = changes.findIndex((change, changeIndex) => !used.has(changeIndex) && changeCoversHunk(hunk, change));
    if (index >= 0) {
      used.add(index);
      covered += 1;
    } else {
      const deltaInfo = tokenDeltaWithPositions(coverageTokens(hunk.original), coverageTokens(hunk.revised));
      const candidates = changes
        .map((change, originalIndex) => ({ change, originalIndex }))
        .filter((item) => !used.has(item.originalIndex));
      const composite = evaluateHunkCompositeCoverage(hunk, candidates, deltaInfo);
      if (composite.covered) {
        for (const idx of composite.usedChangeIndices) {
          used.add(idx);
        }
        covered += 1;
      } else {
        const chars = normalizeCoverageComparable(hunk.original).length + normalizeCoverageComparable(hunk.revised).length;
        uncovered.push({ kind: hunk.kind, chars });
        uncoveredHunks.push(hunk);
      }
    }
  }
  const details = uncoveredHunks.map((hunk) => classifyUncoveredHunk(hunk, changes, substantive));
  const removedCounts = details.map((item) => item.removed);
  const addedCounts = details.map((item) => item.added);
  return {
    reason: uncovered.length ? "uncovered_edits" : "ok",
    hunks: substantive.length,
    covered,
    uncovered: uncovered.length,
    add: substantive.filter((hunk) => hunk.kind === "add").length,
    remove: substantive.filter((hunk) => hunk.kind === "remove").length,
    replace: substantive.filter((hunk) => hunk.kind === "replace").length,
    changeCount: changes.length,
    limit: MAX_DECLARED_CHANGES,
    uncoveredChars: uncovered.map((hunk) => hunk.chars),
    uncoveredKinds: uncovered.map((hunk) => hunk.kind),
    totalHunks: substantive.length,
    coveredHunks: covered,
    uncoveredHunks: uncovered.length,
    totalChanges: changes.length,
    usedChanges: used.size,
    unusedChanges: Math.max(0, changes.length - used.size),
    uncoveredRemovedTokenCount: removedCounts.reduce((sum, count) => sum + count, 0),
    uncoveredAddedTokenCount: addedCounts.reduce((sum, count) => sum + count, 0),
    uncoveredStructuralCount: details.filter((item) => item.structural).length,
    maxUncoveredRemovedTokens: removedCounts.reduce((max, count) => Math.max(max, count), 0),
    maxUncoveredAddedTokens: addedCounts.reduce((max, count) => Math.max(max, count), 0),
    ...(details[0] ? { failureReasonCode: details[0].reason, auditFailure: "COVERAGE_FAILURE" as const } : {}),
  };
}

/**
 * Blocos materiais ainda sem change. O retorno é só tipo e tamanho, nunca o texto jurídico.
 * Cada change cobre no máximo um bloco.
 */
export function uncoveredSubstantiveEdits(
  original: string,
  revised: string,
  changes: Array<Pick<LegalReviewChange, "originalExcerpt" | "revisedExcerpt">>
): string[] {
  const report = assessSubstantiveCoverage(original, revised, changes);
  return report.uncoveredChars.map((chars, index) => `${report.uncoveredKinds[index] || "replace"}:${chars}`);
}

export function enforceVerificationLevel(input: {
  webSearchExecuted: boolean;
  officialSourcesConsulted: boolean;
  allMaterialChangesConfirmed: boolean;
  hasUnverified: boolean;
  diffConsistent: boolean;
  manuallyEdited: boolean;
}): LegalVerificationLevel {
  if (!input.webSearchExecuted || !input.officialSourcesConsulted) return "FALHA_NA_VERIFICACAO";
  if (input.manuallyEdited) return "VERIFICACAO_PARCIAL";
  if (!input.diffConsistent || !input.allMaterialChangesConfirmed || input.hasUnverified) {
    return "VERIFICACAO_PARCIAL";
  }
  return "VERIFICADO_COM_FONTES";
}

export function evidenceMayBeShownAsProof(evidence: Pick<LegalReviewEvidence, "url" | "official" | "consulted">): boolean {
  return Boolean(evidence.official && evidence.consulted && safeHttpsUrl(evidence.url) && matchOfficialHost(evidence.url));
}

export interface NormalizedAudit {
  outcome: LegalReviewOutcome;
  confidence: LegalReviewConfidence;
  verificationLevel: LegalVerificationLevel;
  summary: LegalReviewSummary;
  changes: LegalReviewChange[];
  unverifiedClaims: LegalUnverifiedClaim[];
  reviewedMarkdown: string;
  reviewNotes: string;
  consultedSources: ConsultedLegalSource[];
}

export type ClassifiedLegalAudit =
  | { ok: true; audit: NormalizedAudit }
  | { ok: false; error: LegalReviewValidationError };

function validationFailure(
  message: string,
  code: "too_many_changes" | "uncovered_edits" | "invalid_audit",
  diagnostics: CoverageDiagnostics
): ClassifiedLegalAudit {
  return { ok: false, error: new LegalReviewValidationError(message, code, diagnostics) };
}

/** Classifica a auditoria e preserva o motivo. O texto jurídico não entra no erro. */
export function classifyLegalAudit(
  raw: unknown,
  originalMarkdown: string,
  search: { webSearchExecuted: boolean; consultedUrls?: string[] }
): ClassifiedLegalAudit {
  const record = asRecord(raw);
  if (!record) {
    return validationFailure(
      INVALID_AUDIT_MESSAGE,
      "invalid_audit",
      emptyCoverage("invalid_audit", 0, "INVALID_SCHEMA", "INVALID_SCHEMA")
    );
  }
  const original = String(originalMarkdown || "");
  if (original.trim().length < 20) {
    return validationFailure(
      INVALID_AUDIT_MESSAGE,
      "invalid_audit",
      emptyCoverage("invalid_audit", 0, "INVALID_LENGTH", "INVALID_LENGTH")
    );
  }

  const consulted = consultedUrlSet(search.consultedUrls || []);
  const consultedSources = describeConsultedSources(search.consultedUrls || []);
  const declared = Array.isArray(record.changes) ? record.changes : [];
  if (declared.length > MAX_DECLARED_CHANGES) {
    return validationFailure(
      TOO_MANY_CHANGES_MESSAGE,
      "too_many_changes",
      emptyCoverage("too_many_changes", declared.length, "TOO_MANY_CHANGES", "TOO_MANY_CHANGES")
    );
  }
  const changes = declared
    .map((item, index) => readChange(item, index, consulted))
    .filter((item): item is LegalReviewChange => Boolean(item));

  const unverifiedClaims: LegalUnverifiedClaim[] = [];
  const seen = new Set<string>();
  const pushClaim = (excerpt: string, reason: string) => {
    const key = `${excerpt.slice(0, 180)}|${reason.slice(0, 180)}`;
    if (!excerpt.trim() || seen.has(key)) return;
    seen.add(key);
    unverifiedClaims.push({ excerpt: excerpt.slice(0, 2000), reason: reason.slice(0, 2000) });
  };
  if (Array.isArray(record.unverifiedClaims)) {
    for (const item of record.unverifiedClaims) {
      const claim = asRecord(item);
      if (!claim) continue;
      pushClaim(clip(claim.excerpt, 2000), clip(claim.reason, 2000) || "Não confirmado em fonte oficial.");
    }
  }
  for (const change of changes) {
    if (change.confirmation === "NAO_CONFIRMADO") {
      const reason = changeLacksNormativeSpecificity(change)
        ? "Perda de especificidade normativa: informação específica confirmada por fonte oficial foi substituída por expressão genérica."
        : (change.reason || "NAO_CONFIRMADO");
      pushClaim(change.revisedExcerpt || change.originalExcerpt, reason);
    }
  }

  let reviewedMarkdown = clip(record.reviewedMarkdown, 900_000);
  let outcome = oneOf(record.outcome || record.status, OUTCOMES, "ALTERACOES_NECESSARIAS");
  if (containsHtmlMarkup(reviewedMarkdown)) {
    return validationFailure(
      INVALID_AUDIT_MESSAGE,
      "invalid_audit",
      emptyCoverage("invalid_audit", changes.length, "HTML_REJECTED", "HTML_REJECTED")
    );
  }
  if (!markersPreserved(original, reviewedMarkdown)) {
    return validationFailure(
      INVALID_AUDIT_MESSAGE,
      "invalid_audit",
      emptyCoverage("invalid_audit", changes.length, "MARKER_MISMATCH", "MARKER_MISMATCH")
    );
  }
  if (reviewedMarkdown.trim().length < 20 || reviewedMarkdown.length > Math.max(original.length * 3, original.length + 20_000)) {
    return validationFailure(
      INVALID_AUDIT_MESSAGE,
      "invalid_audit",
      emptyCoverage("invalid_audit", changes.length, "INVALID_LENGTH", "INVALID_LENGTH")
    );
  }
  const coverage = assessSubstantiveCoverage(original, reviewedMarkdown, changes);
  if (coverage.uncovered > 0) {
    return validationFailure(UNCOVERED_AUDIT_MESSAGE, "uncovered_edits", {
      ...coverage,
      auditFailure: "COVERAGE_FAILURE",
      failureReasonCode: coverage.failureReasonCode || "COVERAGE_FAILURE",
    });
  }
  if (!changes.length) {
    reviewedMarkdown = original;
    outcome = "SEM_ALTERACOES_RELEVANTES";
  }

  const material = changes.filter(isMaterialLegalChange);
  const officialSourcesConsulted = consultedSources.some((source) => source.official);
  const verificationLevel = enforceVerificationLevel({
    webSearchExecuted: search.webSearchExecuted && consultedSources.length > 0,
    officialSourcesConsulted,
    allMaterialChangesConfirmed: material.every((change) => change.confirmation === "CONFIRMADO"),
    hasUnverified: unverifiedClaims.length > 0,
    diffConsistent: true,
    manuallyEdited: false,
  });

  return {
    ok: true,
    audit: {
      outcome,
      confidence: oneOf(record.confidence, CONFIDENCE, "MEDIA"),
      verificationLevel,
      summary: summarizeChanges(changes),
      changes,
      unverifiedClaims: unverifiedClaims.slice(0, 40),
      reviewedMarkdown,
      reviewNotes: clip(record.reviewNotes, 8000),
      consultedSources,
    },
  };
}

export function normalizeLegalAudit(
  raw: unknown,
  originalMarkdown: string,
  search: { webSearchExecuted: boolean; consultedUrls?: string[] }
): NormalizedAudit | null {
  const classified = classifyLegalAudit(raw, originalMarkdown, search);
  return classified.ok ? classified.audit : null;
}

const UNCOVERED_AUDIT_MESSAGE =
  "A revisão não descreveu todas as alterações do texto. A aula publicada não foi alterada.";
const TOO_MANY_CHANGES_MESSAGE =
  "A revisão declarou mais de 40 alterações. Nenhuma foi descartada e a auditoria não foi aceita. A aula publicada não foi alterada.";
const INVALID_AUDIT_MESSAGE =
  "A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.";

/** Motivo seguro da recusa. Não devolve aula, excerpt nem Markdown. */
export function explainLegalAuditFailure(raw: unknown, originalMarkdown: string): LegalReviewValidationError {
  const classified = classifyLegalAudit(raw, originalMarkdown, { webSearchExecuted: false });
  if (classified.ok === false) return classified.error;
  return new LegalReviewValidationError(
    INVALID_AUDIT_MESSAGE,
    "invalid_audit",
    emptyCoverage("invalid_audit", 0, "INVALID_SCHEMA", "INVALID_SCHEMA")
  );
}

const evidenceSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "institution",
    "title",
    "url",
    "official",
    "consulted",
    "supportsChange",
    "supportExplanation",
    "sourceType",
  ],
  properties: {
    institution: { type: "string" },
    title: { type: "string" },
    url: { type: "string" },
    official: { type: "boolean" },
    consulted: { type: "boolean" },
    supportsChange: { type: "boolean" },
    supportExplanation: { type: "string" },
    sourceType: { type: "string", enum: SOURCE_TYPES },
  },
};

export const LEGAL_REVIEW_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "status",
    "confidence",
    "verificationLevel",
    "summary",
    "changes",
    "unverifiedClaims",
    "reviewedMarkdown",
    "reviewNotes",
  ],
  properties: {
    status: { type: "string", enum: OUTCOMES },
    confidence: { type: "string", enum: CONFIDENCE },
    verificationLevel: { type: "string", enum: LEVELS },
    summary: {
      type: "object",
      additionalProperties: false,
      required: ["totalChanges", "corrections", "additions", "removals", "updates", "precisions", "restructures"],
      properties: {
        totalChanges: { type: "integer" },
        corrections: { type: "integer" },
        additions: { type: "integer" },
        removals: { type: "integer" },
        updates: { type: "integer" },
        precisions: { type: "integer" },
        restructures: { type: "integer" },
      },
    },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "type",
          "severity",
          "category",
          "originalExcerpt",
          "revisedExcerpt",
          "reason",
          "verified",
          "confirmation",
          "sources",
          "evidence",
        ],
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: CHANGE_TYPES },
          severity: { type: "string", enum: SEVERITIES },
          category: { type: "string", enum: CATEGORIES },
          originalExcerpt: { type: "string" },
          revisedExcerpt: { type: "string" },
          reason: { type: "string" },
          verified: { type: "boolean" },
          confirmation: { type: "string", enum: ["CONFIRMADO", "NAO_CONFIRMADO"] },
          sources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "url", "official", "institution"],
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                official: { type: "boolean" },
                institution: { type: "string" },
              },
            },
          },
          evidence: {
            type: "array",
            items: evidenceSchema,
          },
        },
      },
    },
    unverifiedClaims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["excerpt", "reason"],
        properties: {
          excerpt: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    reviewedMarkdown: { type: "string" },
    reviewNotes: { type: "string" },
  },
};
