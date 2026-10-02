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

function confirmChange(change: Omit<LegalReviewChange, "verified" | "confirmation">, modelConfirmation: LegalConfirmation): LegalConfirmation {
  if (modelConfirmation === "NAO_CONFIRMADO") return "NAO_CONFIRMADO";
  const claim = `${change.reason}\n${change.originalExcerpt}\n${change.revisedExcerpt}`;
  const required = institutionsNamedInClaim(claim, change.category);
  if (required.length) {
    const covered = required.every((family) => change.evidence.some((item) => evidenceSupportsFamily(item, family)));
    return covered ? "CONFIRMADO" : "NAO_CONFIRMADO";
  }
  if (!isMaterialLegalChange(change)) return modelConfirmation;
  return "NAO_CONFIRMADO";
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
}

export class LegalReviewValidationError extends Error {
  readonly code: "too_many_changes" | "uncovered_edits" | "invalid_audit";
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

function tokenDelta(before: string[], after: string[]): { removed: string[]; added: string[] } {
  if (!before.length && !after.length) return { removed: [], added: [] };
  if (before.length * after.length > TOKEN_LCS_CELL_LIMIT) {
    return { removed: before, added: after };
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
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (before[i] === after[j]) {
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      removed.push(before[i]);
      i += 1;
    } else {
      added.push(after[j]);
      j += 1;
    }
  }
  while (i < n) {
    removed.push(before[i]);
    i += 1;
  }
  while (j < m) {
    added.push(after[j]);
    j += 1;
  }
  return { removed, added };
}

function grounded(excerpt: string, side: string): boolean {
  const excerptTokens = coverageTokens(excerpt);
  const sideTokens = coverageTokens(side);
  if (!excerptTokens.length || !sideTokens.length) return false;
  return orderedMatchCount(excerptTokens, sideTokens) === excerptTokens.length;
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

function emptyCoverage(reason: CoverageDiagnostics["reason"], changeCount = 0): CoverageDiagnostics {
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
  let covered = 0;
  for (const hunk of substantive) {
    const index = changes.findIndex((change, changeIndex) => !used.has(changeIndex) && changeCoversHunk(hunk, change));
    if (index >= 0) {
      used.add(index);
      covered += 1;
    } else {
      const chars = normalizeCoverageComparable(hunk.original).length + normalizeCoverageComparable(hunk.revised).length;
      uncovered.push({ kind: hunk.kind, chars });
    }
  }
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

export function normalizeLegalAudit(
  raw: unknown,
  originalMarkdown: string,
  search: { webSearchExecuted: boolean; consultedUrls?: string[] }
): NormalizedAudit | null {
  const record = asRecord(raw);
  if (!record) return null;
  const original = String(originalMarkdown || "");
  if (original.trim().length < 20) return null;

  const consulted = consultedUrlSet(search.consultedUrls || []);
  const consultedSources = describeConsultedSources(search.consultedUrls || []);
  const declared = Array.isArray(record.changes) ? record.changes : [];
  if (declared.length > MAX_DECLARED_CHANGES) return null;
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
      pushClaim(change.revisedExcerpt || change.originalExcerpt, change.reason || "NAO_CONFIRMADO");
    }
  }

  let reviewedMarkdown = clip(record.reviewedMarkdown, 900_000);
  let outcome = oneOf(record.outcome || record.status, OUTCOMES, "ALTERACOES_NECESSARIAS");
  if (!changes.length) {
    reviewedMarkdown = original;
    outcome = "SEM_ALTERACOES_RELEVANTES";
  }
  if (containsHtmlMarkup(reviewedMarkdown)) return null;
  if (!markersPreserved(original, reviewedMarkdown)) return null;
  if (reviewedMarkdown.trim().length < 20) return null;
  if (reviewedMarkdown.length > Math.max(original.length * 3, original.length + 20_000)) return null;
  if (assessSubstantiveCoverage(original, reviewedMarkdown, changes).uncovered > 0) return null;

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
    outcome,
    confidence: oneOf(record.confidence, CONFIDENCE, "MEDIA"),
    verificationLevel,
    summary: summarizeChanges(changes),
    changes,
    unverifiedClaims: unverifiedClaims.slice(0, 40),
    reviewedMarkdown,
    reviewNotes: clip(record.reviewNotes, 8000),
    consultedSources,
  };
}

const UNCOVERED_AUDIT_MESSAGE =
  "A revisão não descreveu todas as alterações do texto. A aula publicada não foi alterada.";
const TOO_MANY_CHANGES_MESSAGE =
  "A revisão declarou mais de 40 alterações. Nenhuma foi descartada e a auditoria não foi aceita. A aula publicada não foi alterada.";
const INVALID_AUDIT_MESSAGE =
  "A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.";

/** Motivo seguro da recusa. Não devolve aula, excerpt nem Markdown. */
export function explainLegalAuditFailure(raw: unknown, originalMarkdown: string): LegalReviewValidationError {
  const invalid = (diagnostics = emptyCoverage("invalid_audit")) =>
    new LegalReviewValidationError(INVALID_AUDIT_MESSAGE, "invalid_audit", diagnostics);
  const record = asRecord(raw);
  if (!record) return invalid();
  const original = String(originalMarkdown || "");
  const declared = Array.isArray(record.changes) ? record.changes : [];
  if (declared.length > MAX_DECLARED_CHANGES) {
    return new LegalReviewValidationError(
      TOO_MANY_CHANGES_MESSAGE,
      "too_many_changes",
      emptyCoverage("too_many_changes", declared.length)
    );
  }
  const changes = declared
    .map((item, index) => readChange(item, index, new Set<string>()))
    .filter((item): item is LegalReviewChange => Boolean(item));
  let reviewed = clip(record.reviewedMarkdown, 900_000);
  if (!changes.length) reviewed = original;
  if (
    containsHtmlMarkup(reviewed)
    || !markersPreserved(original, reviewed)
    || reviewed.trim().length < 20
    || reviewed.length > Math.max(original.length * 3, original.length + 20_000)
  ) {
    return invalid();
  }
  const coverage = assessSubstantiveCoverage(original, reviewed, changes);
  if (coverage.reason === "uncovered_edits") {
    return new LegalReviewValidationError(UNCOVERED_AUDIT_MESSAGE, "uncovered_edits", coverage);
  }
  return invalid(emptyCoverage("invalid_audit", changes.length));
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
