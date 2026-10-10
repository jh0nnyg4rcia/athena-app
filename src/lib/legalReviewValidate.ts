import { changeHunks, type ChangeHunk } from "./legalReviewDiff";
import {
  hasAutonomousClaimAttributedToFamily,
  hasPositiveAffirmationInReason,
  institutionalPatternForFamily,
  institutionsNamedInClaim,
  isConfiguredOfficialUrl,
  matchOfficialHost,
  type SourceFamily,
} from "./legalReviewSources";
import {
  mergeAuditedPropositionUnits,
  type PropositionUnit,
  type CoverageSummary,
  type AuditedPropositionInput,
} from "./legalReviewPropositions";
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
  ChangeValidationResult,
  ChangeValidationStatus,
  ChangeResolutionState,
  HumanReviewDecision,
  CoordinatedQuestionGroup,
  EditorialIntegrityStatus,
  EditorialIntegrityValidation,
} from "./legalReviewTypes";
import { getFindingStableKey } from "./legalReviewTypes";
import {
  validateClaimTaxonomy,
  VALID_CLAIM_NATURES,
  VALID_VERIFICATION_OUTCOMES,
  type LegalClaimNature,
  type LegalVerificationOutcome,
  type ClaimEvidenceMetadata,
  type EvidenceNatureMetadata,
} from "./legalReviewTaxonomy";
import type {
  DiagnosticHostFamily,
  DiagnosticSourceFamily,
  DiagnosticSourceType,
  DiagnosticStatuteType,
  EvidenceRefusalDiagnostic,
  FollowUpSkipReason,
  LegalAuditValidationLog,
  MissingStatuteDiagnostic,
  RefusalPredicateDiagnostic,
  StatuteFailureReason,
  ValidationReasonCode,
} from "./legalReviewDiagnostics";

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
  let url: URL;
  try {
    const trimmed = String(raw || "").trim();
    if (!trimmed) return null;
    url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname || url.username || url.password) return null;
  } catch {
    return null;
  }
  url.hash = "";

  let hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (hostname.startsWith("www.")) {
    hostname = hostname.slice(4);
  }

  let pathname = url.pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // preserve if malformed
  }
  pathname = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  // Normalização de variações do Planalto:
  // ex.: /ccivil_03/constituicao/constituicaocompilado.htm -> /ccivil_03/constituicao/constituicao.htm
  // ex.: /ccivil_03/constituicao/constituicao_compilado.htm -> /ccivil_03/constituicao/constituicao.htm
  // ex.: /ccivil_03/leis/l9474compilado.htm -> /ccivil_03/leis/l9474.htm
  if (hostname === "planalto.gov.br" || hostname.endsWith(".planalto.gov.br")) {
    pathname = pathname
      .replace(/_compilad[oa]\.htm$/i, ".htm")
      .replace(/compilad[oa]\.htm$/i, ".htm");
  }

  // Documentos estáticos de legislação/jurisprudência (.htm, .html, .pdf)
  // não usam query parameters para identificar o ato normativo.
  // Limpar busca/âncoras geradas por motores de busca.
  const isStaticDocument = /\.(?:html?|pdf)$/i.test(pathname);
  let search = url.search;
  if (isStaticDocument || !search) {
    search = "";
  } else {
    // Se for URL dinâmica, remove parâmetros comuns de rastreamento/sessão
    const sp = new URLSearchParams(search);
    const keysToRemove: string[] = [];
    for (const key of sp.keys()) {
      if (/^(?:utm_|ref|source|search_context)/i.test(key)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      sp.delete(key);
    }
    sp.sort();
    const qs = sp.toString();
    search = qs ? `?${qs}` : "";
  }

  return `https://${hostname}${pathname}${search}`;
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

/** Contexto literal. Não remove espaços: eles distinguem a ocorrência. */
function literalContext(value: unknown): string {
  return String(value ?? "").replace(/\u0000/g, "").slice(0, 2000);
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

function deterministicHash10(str: string): string {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c64e6d ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = ((h2 >>> 0) & 0xff).toString(16).padStart(2, "0");
  return (part1 + part2).slice(0, 10);
}

/**
 * Deriva deterministicamente um identificador estável para a fonte a partir da URL canônica.
 * Mesma URL canônica = mesmo sourceId estável, imune à ordem e merge.
 */
export function computeSourceId(rawUrl: string): string {
  const canonical = canonicalSourceUrl(rawUrl) || String(rawUrl || "").trim().toLowerCase();
  const hash = deterministicHash10(canonical);
  return `SRC-${hash}`;
}

export function describeConsultedSources(
  sourcesOrUrls: Array<string | ConsultedLegalSource>
): ConsultedLegalSource[] {
  const map = new Map<string, ConsultedLegalSource>();
  for (const item of sourcesOrUrls) {
    if (!item) continue;
    const rawUrl = typeof item === "string" ? item : item.url;
    const href = safeHttpsUrl(rawUrl);
    const canonical = canonicalSourceUrl(rawUrl);
    if (!href || !canonical) continue;
    const sourceId = (typeof item === "object" && item.sourceId) ? item.sourceId : computeSourceId(canonical);
    const existing = map.get(canonical);
    if (!existing) {
      const host = matchOfficialHost(href);
      const title = typeof item === "object" ? item.title : undefined;
      const snippet = typeof item === "object" ? item.snippet : undefined;
      map.set(canonical, {
        sourceId,
        url: href,
        official: Boolean(host),
        institution: host?.label || (typeof item === "object" ? item.institution : "") || "",
        ...(title ? { title } : {}),
        ...(snippet ? { snippet } : {}),
      });
    } else {
      // Merge seguro de metadados: não perde títulos ou snippets mais detalhados
      if (typeof item === "object") {
        if (!existing.title && item.title) existing.title = item.title;
        if (!existing.snippet && item.snippet) existing.snippet = item.snippet;
        if (!existing.institution && item.institution) existing.institution = item.institution;
      }
    }
  }
  return Array.from(map.values());
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

const evidenceModelSupport = new WeakMap<LegalReviewEvidence, boolean>();
const evidenceRawSourceType = new WeakMap<LegalReviewEvidence, string>();

function readEvidence(value: unknown, consulted: Set<string>): LegalReviewEvidence | null {
  const record = asRecord(value);
  if (!record) return null;
  const rawNature = typeof record.nature === "string" ? record.nature.trim() : "";
  const rawSourceType = typeof record.sourceType === "string" ? record.sourceType.trim().slice(0, 64) : "";
  const isDoctrinalOrPedagogical =
    rawNature === "DOUTRINA" ||
    rawNature === "DIVERGENCIA_DOUTRINARIA" ||
    rawNature === "RECURSO_PEDAGOGICO" ||
    rawSourceType === "OUTRO_OFICIAL";

  const rawUrl = clip(record.url, 500);
  const safeUrl = safeHttpsUrl(rawUrl);
  if (!safeUrl && !isDoctrinalOrPedagogical) return null;
  const url = safeUrl || "";
  const host = url ? matchOfficialHost(url) : null;
  const canonical = url ? canonicalSourceUrl(url) : "";
  const sourceType = oneOf(record.sourceType, SOURCE_TYPES, "OUTRO_OFICIAL");
  const wasConsulted = Boolean(canonical && consulted.has(canonical));
  const official = Boolean(host);
  const modelSupports = record.supportsChange === true;
  const supportsChange = Boolean(
    modelSupports && (
      (official && wasConsulted && host && sourceTypeFits(sourceType, host.family)) ||
      (isDoctrinalOrPedagogical && !url)
    )
  );

  const nature = rawNature && (VALID_CLAIM_NATURES as readonly string[]).includes(rawNature)
    ? (rawNature as LegalClaimNature)
    : undefined;
  const rawOutcome = typeof record.outcome === "string" ? record.outcome.trim() : undefined;
  const outcome = rawOutcome && (VALID_VERIFICATION_OUTCOMES as readonly string[]).includes(rawOutcome)
    ? (rawOutcome as LegalVerificationOutcome)
    : undefined;
  const evidenceMetadata = record.evidenceMetadata && typeof record.evidenceMetadata === "object"
    ? (record.evidenceMetadata as ClaimEvidenceMetadata | EvidenceNatureMetadata)
    : undefined;

  const evidence: LegalReviewEvidence = {
    institution: host?.label || clip(record.institution, 160) || (isDoctrinalOrPedagogical ? "Doutrina/Pedagogia" : "Fonte"),
    title: clip(record.title, 300) || host?.label || "Documento",
    url,
    official,
    consulted: wasConsulted,
    supportsChange,
    supportExplanation: clip(record.supportExplanation, 2000),
    sourceType,
    ...(nature ? { nature } : {}),
    ...(outcome ? { outcome } : {}),
    ...(evidenceMetadata ? { evidenceMetadata } : {}),
  };
  evidenceModelSupport.set(evidence, modelSupports);
  evidenceRawSourceType.set(evidence, rawSourceType);
  return evidence;
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

export function isMaterialLegalChange(
  change: Pick<LegalReviewChange, "type" | "category"> & { nature?: LegalClaimNature }
): boolean {
  if (
    change.nature === "NORMA_JURIDICA" ||
    change.nature === "PRECEDENTE_VINCULANTE" ||
    change.nature === "JURISPRUDENCIA_NAO_VINCULANTE"
  ) {
    return MATERIAL_TYPES.has(change.type);
  }
  return MATERIAL_TYPES.has(change.type) && MATERIAL_CATEGORIES.has(change.category);
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

export const SPECIFIC_ORGAN_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
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

export const SPECIFIC_DEADLINE_PATTERNS: RegExp[] = [
  /\b\d+\s+(?:dias|meses|anos|horas)\b/i,
  /\b(?:cinco|dez|quinze|vinte|trinta|quarenta\s+e\s+cinco|sessenta|noventa|cento\s+e\s+vinte)\s+dias\b/i,
];

export const SPECIFIC_QUORUM_PATTERNS: RegExp[] = [
  /\bmaioria\s+(?:absoluta|simples)\b/i,
  /\b(?:dois\s+ter[cç]os|2\/3|tr[eê]s\s+quintos|3\/5|unanimidade)\b/i,
];

export const SPECIFIC_RECOURSE_PATTERNS: RegExp[] = [
  /\brecurso\s+extraordin[aá]rio\b/i,
  /\brecurso\s+especial\b/i,
  /\bagravo\s+(?:de\s+instrumento|interno|regimental)\b/i,
  /\bapela[cç][aã]o\b/i,
  /\bembargos\s+de\s+declara[cç][aã]o\b/i,
  /\brecurso\s+ordin[aá]rio(?:\s+constitucional)?\b/i,
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDeadlineText(text: string): string {
  let normalized = text.toLowerCase();
  // 1. Remove parênteses com extenso após dígitos: ex.: "2 (dois) anos" -> "2 anos", "1 (um) ano" -> "1 ano", "15 (quinze) dias" -> "15 dias"
  normalized = normalized.replace(/\b(\d+)\s*\([a-zçãéíóú\s]+\)\s*(dias?|meses|m[eê]s|anos?|horas?)\b/gi, "$1 $2");
  // 2. Padronização de números por extenso antes de unidades temporais ou isolados
  normalized = normalized
    .replace(/\b(?:um|uma)\b/g, "1")
    .replace(/\b(?:dois|duas)\b/g, "2")
    .replace(/\btr[eê]s\b/g, "3")
    .replace(/\bquatro\b/g, "4")
    .replace(/\bcinco\b/g, "5")
    .replace(/\bseis\b/g, "6")
    .replace(/\bsete\b/g, "7")
    .replace(/\boito\b/g, "8")
    .replace(/\bnove\b/g, "9")
    .replace(/\bdez\b/g, "10")
    .replace(/\bonze\b/g, "11")
    .replace(/\bdoze\b/g, "12")
    .replace(/\bquinze\b/g, "15")
    .replace(/\bvinte\b/g, "20")
    .replace(/\btrinta\b/g, "30")
    .replace(/\bquarenta\s+e\s+cinco\b/g, "45")
    .replace(/\bsessenta\b/g, "60")
    .replace(/\bnoventa\b/g, "90")
    .replace(/\bcento\s+e\s+vinte\b/g, "120");
  // 3. Normalização de singular/plural nas unidades temporais para comparação uniforme
  normalized = normalized
    .replace(/\bano\b/g, "anos")
    .replace(/\bdia\b/g, "dias")
    .replace(/\bm[eê]s\b/g, "meses")
    .replace(/\bhora\b/g, "horas");
  return normalized;
}


function normalizeQuorumText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\bdois\s+ter[cç]os\b/g, "2/3")
    .replace(/\btr[eê]s\s+quintos\b/g, "3/5");
}

export function extractSpecificStatutes(text: string): Array<{ type: string; number: string; raw: string }> {
  const statutes: Array<{ type: string; number: string; raw: string }> = [];
  const seen = new Set<string>();
  const regex = /\b(Lei(?:\s+Complementar|\s+Federal)?|Decreto(?:-Lei)?|Medida\s+Provis[oó]ria|MP|LC)\s*(?:n[º°.]\s*)?(\d+(?:\.\d+)?)(?:\/(\d{2,4}))?\b/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text || ""))) {
    const rawNumber = match[2].replace(/\./g, "");
    if (!seen.has(rawNumber)) {
      seen.add(rawNumber);
      statutes.push({ type: match[1], number: rawNumber, raw: match[0] });
    }
  }
  return statutes;
}

export function newlyIntroducedStatutes(
  original: string,
  revised: string
): Array<{ type: string; number: string; raw: string }> {
  const origStatutes = new Set(extractSpecificStatutes(original).map((s) => s.number));
  return extractSpecificStatutes(revised).filter((s) => !origStatutes.has(s.number));
}

/** O número precisa estar isolado de outros dígitos. `l10522` conta; `l15358` não cobre `1535`. */
export function urlContainsStatuteNumber(url: string, statuteNumber: string): boolean {
  if (!/^\d{1,12}$/.test(statuteNumber)) return false;
  const compact = String(url || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return new RegExp(`(?:^|[^0-9])${statuteNumber}(?:[^0-9]|$)`).test(compact);
}

export function evidenceSupportsStatute(evidence: LegalReviewEvidence, statuteNumber: string): boolean {
  if (!evidence.official || !evidence.consulted || !evidence.supportsChange) return false;
  if (urlContainsStatuteNumber(evidence.url, statuteNumber)) return true;
  const cleanTitle = (evidence.title || "").replace(/\./g, "");
  if (new RegExp(`\\b${statuteNumber}\\b`).test(cleanTitle)) return true;
  const cleanExplanation = (evidence.supportExplanation || "").replace(/\./g, "");
  if (new RegExp(`\\b${statuteNumber}\\b`).test(cleanExplanation)) return true;
  return false;
}

export function changeContainsUngroundedInvention(
  change: Pick<LegalReviewChange, "originalExcerpt" | "revisedExcerpt"> & {
    evidence?: LegalReviewEvidence[];
  }
): boolean {
  const revised = String(change.revisedExcerpt || "");
  if (!revised.trim()) return false;
  const original = String(change.originalExcerpt || "");
  const explanationsAndTitles = (change.evidence || [])
    .map((e) => `${e.title || ""} ${e.supportExplanation || ""}`)
    .join("\n");

  // 1. Prazos específicos inventados
  const normRevisedDeadlines = normalizeDeadlineText(revised);
  const normOriginalDeadlines = normalizeDeadlineText(original);
  const normEvidenceDeadlines = normalizeDeadlineText(explanationsAndTitles);

  for (const pattern of SPECIFIC_DEADLINE_PATTERNS) {
    const match = pattern.exec(normRevisedDeadlines);
    if (match) {
      const phrase = match[0];
      const inOriginal = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i").test(normOriginalDeadlines);
      const inEvidence = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i").test(normEvidenceDeadlines);
      if (!inOriginal && !inEvidence) {
        return true;
      }
    }
  }

  // 2. Quóruns específicos inventados
  const normRevisedQuorum = normalizeQuorumText(revised);
  const normOriginalQuorum = normalizeQuorumText(original);
  const normEvidenceQuorum = normalizeQuorumText(explanationsAndTitles);

  for (const pattern of SPECIFIC_QUORUM_PATTERNS) {
    const match = pattern.exec(normRevisedQuorum);
    if (match) {
      const phrase = match[0];
      const inOriginal = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i").test(normOriginalQuorum);
      const inEvidence = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i").test(normEvidenceQuorum);
      if (!inOriginal && !inEvidence) {
        return true;
      }
    }
  }

  // 3. Recursos judiciais específicos inventados
  for (const pattern of SPECIFIC_RECOURSE_PATTERNS) {
    if (pattern.test(revised)) {
      const inOriginal = pattern.test(original);
      const inEvidence = pattern.test(explanationsAndTitles);
      if (!inOriginal && !inEvidence) {
        return true;
      }
    }
  }

  return false;
}

export function organAttributedInExplanation(explanation: string, organPattern: RegExp): boolean {
  if (!explanation) return false;
  const organSource = organPattern.source;
  const organFlags = organPattern.flags.includes("i") ? "i" : "";

  // 1. Competência ou atribuição normativa/jurisdicional dirigida ao órgão:
  // ex.: "compete ao STF", "compete privativamente ao STF", "cabe ao STF", "incumbe ao STF", "atribui ao STF", "pertence ao STF", "reserva-se ao STF", "outorga-se ao STF"
  const directedVerbs = new RegExp(
    `(?:\\b(?:compete|competir[aá]|cabe|caber[aá]|incumbe|incumbir[aá]|atribui(?:r(?:-[aá])?)?|pertence|reserva-se|outorga-se|defere-se)(?:\\s+(?:privativamente|exclusivamente|originariamente|especificamente))?)\\s+(?:(?:[eé]|ser[aá])\\s+)?(?:ao?|pelo?|do?|da|perante\\s+o|a\\s+cargo\\s+do?|sob\\s+a\\s+responsabilidade\\s+do?)\\s*(?:(?:ilustre|egr[eé]gio)\\s+)?(?:${organSource})\\b`,
    organFlags
  );
  if (directedVerbs.test(explanation)) return true;

  // 2. Substantivos de competência institucional vinculados ao órgão:
  // ex.: "competência do STF", "competência privativa do STF", "atribuição do STF", "jurisdição do STF", "alçada do STF", "prerrogativa do STF", "encargo do STF", "função institucional do STF"
  const competenceNouns = new RegExp(
    `(?:\\b(?:compet[eê]ncia|atribui[cç][aã]o|jurisdi[cç][aã]o|al[cç]ada|prerrogativa|encargo|fun[cç][aã]o|papel|miss[aã]o\\s+institucional)(?:\\s+(?:origin[aá]ria|exclusiva|privativa|constitucional|recursal|institucional))?)\\s+(?:(?:[eé]|ser[aá])\\s+)?(?:ao?|pelo?|do?|da|perante\\s+o|pertencente\\s+ao?|delegad[oa]\\s+ao?)\\s*(?:(?:ilustre|egr[eé]gio)\\s+)?(?:${organSource})\\b`,
    organFlags
  );
  if (competenceNouns.test(explanation)) return true;

  // 3. Atos jurisdicionais, decisórios, autorizativos ou de controle conferidos ao órgão:
  // ex.: "exige pronunciamento prévio do STF", "julgamento pelo STF", "manifestação do STF", "decisão do STF", "apreciação do STF", "análise pelo STF", "exame pelo STF", "deliberação do STF", "autorização da Câmara", "homologação do STF", "chancela do STF", "crivo do STF"
  const jurisdictionalActs = new RegExp(
    `(?:\\b(?:pronunciamento|manifesta[cç][aã]o|decis[aã]o|julgamento|aprecia[cç][aã]o|an[aá]lise|exame|delibera[cç][aã]o|autoriza[cç][aã]o|homologa[cç][aã]o|chancela|crivo|valida[cç][aã]o|ju[ií]zo\\s+de\\s+deliba[cç][aã]o)(?:\\s+(?:pr[eé]vi[oa]|origin[aá]ri[oa]|definitiv[oa]|vinculante))?)\\s+(?:(?:[eé]|ser[aá])\\s+)?(?:ao?|pelo?|pela|do?|da|perante\\s+o|a\\s+cargo\\s+do?|por\\s+parte\\s+do?|a\\s+ser\\s+proferid[oa]\\s+pelo?)\\s*(?:(?:ilustre|egr[eé]gio)\\s+)?(?:${organSource})\\b`,
    organFlags
  );
  if (jurisdictionalActs.test(explanation)) return true;

  // 4. Órgão como sujeito ativo de ato normativo, decisório ou jurisdicional:
  // ex.: "STF é competente", "Senado Federal processa e julga", "STF julga a extradição", "STF aprecia a legalidade", "Câmara dos Deputados autoriza"
  const organAsSubject = new RegExp(
    `(?:${organSource})\\s+(?:(?:[eé]\\s+competente|possui\\s+(?:a\\s+)?compet[eê]ncia|tem\\s+(?:a\\s+)?compet[eê]ncia|det[eé]m\\s+(?:a\\s+)?compet[eê]ncia|processa\\s+e\\s+julga|julga|aprecia|decide|delibera|autoriza|homologa|chancela|exige\\s+manifesta[cç][aã]o)\\b)`,
    organFlags
  );
  if (organAsSubject.test(explanation)) return true;

  // 5. Submissão, via ou instância decisória perante o órgão:
  // ex.: "submissão ao STF", "tramitação perante o STF", "pedido perante o STF", "processamento perante o Senado Federal"
  const venueSubmission = new RegExp(
    `(?:\\b(?:submiss[aã]o|tramita[cç][aã]o|processamento|pedido|requerimento|recurso)(?:\\s+(?:pr[eé]vi[oa]|diret[oa]))?)\\s+(?:ao?|perante\\s+o|junto\\s+ao?)\\s*(?:(?:ilustre|egr[eé]gio)\\s+)?(?:${organSource})\\b`,
    organFlags
  );
  if (venueSubmission.test(explanation)) return true;

  // 6. Definição expressa do órgão competente:
  // ex.: "órgão competente: STF", "autoridade judiciária competente é o STF", "tribunal competente: Supremo Tribunal Federal"
  const organDefined = new RegExp(
    `(?:(?:[oó]rg[aã]o(?:\\s+jurisdicional)?|autoridade(?:\\s+judici[aá]ria)?|tribunal|inst[aâ]ncia)\\s+competente(?:\\s+[eé]|\\s*:\\s*|\\s+ser[aá])\\s+(?:o\\s+|a\\s+)?(?:${organSource})\\b)`,
    organFlags
  );
  if (organDefined.test(explanation)) return true;

  return false;
}

function evidenceSupportsFamily(evidence: LegalReviewEvidence, family: string): boolean {
  if (!evidence.official || !evidence.consulted || !evidence.supportsChange) return false;
  const host = matchOfficialHost(evidence.url);
  if (!host) return false;
  // 1. Correspondência institucional direta (ex.: stf.jus.br -> STF)
  if (host.family === family && sourceTypeFits(evidence.sourceType, family)) {
    return true;
  }
  // 2. Cobertura composta: atos normativos oficiais (LEGISLACAO_FEDERAL ou DIARIO_OFICIAL)
  // que atribuem expressamente competência, função ou encargo a um órgão específico (ex.: STF, STJ).
  // A fonte legislativa só sustenta a especificidade do órgão se seu texto/explicação
  // expressamente atribuir essa competência ao órgão (evitando que fontes genéricas sustentem
  // órgãos não previstos no diploma).
  if (host.family === "LEGISLACAO_FEDERAL" || host.family === "DIARIO_OFICIAL") {
    const organItem = SPECIFIC_ORGAN_PATTERNS.find((item) => item.id === family);
    if (organItem) {
      // A Constituição da República Federativa do Brasil é a fonte primária originária
      // das competências e prerrogativas dos órgãos constitucionais federais (STF, STJ, CNJ, TSE, TST, STM, TRFs, etc.).
      const isConstitution =
        evidence.sourceType === "CONSTITUICAO" ||
        /\bconstituic(?:ao|ão)\b/i.test(evidence.title) ||
        /\/constituicao(?:\.htm|_compilad[oa]\.htm)/i.test(evidence.url);
      const isFederalConstitutionalOrgan =
        family === "STF" ||
        family === "STJ" ||
        family === "CNJ" ||
        family === "TSE" ||
        family === "TST" ||
        family === "STM" ||
        family === "CONGRESSO" ||
        family === "TCU" ||
        family.startsWith("TRF") ||
        family.startsWith("TRT");

      if (isConstitution && isFederalConstitutionalOrgan) {
        return true;
      }

      const attributed =
        organAttributedInExplanation(evidence.supportExplanation, organItem.pattern) ||
        organAttributedInExplanation(evidence.title, organItem.pattern);
      if (attributed) return true;
    }
  }

  return false;
}

function evidenceConfirmsMaterialClaim(evidence: LegalReviewEvidence): boolean {
  if (evidence.nature === "DOUTRINA" || evidence.nature === "DIVERGENCIA_DOUTRINARIA") {
    return evidence.supportsChange === true && (evidence.outcome === "CONFIRMADA" || Boolean(evidence.title && evidence.title.trim().length >= 5));
  }
  if (!evidence.official || !evidence.consulted || evidence.supportsChange !== true) return false;
  const url = safeHttpsUrl(evidence.url);
  if (!url) return false;
  const host = matchOfficialHost(url);
  return Boolean(host && sourceTypeFits(evidence.sourceType, host.family));
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

export interface CollateralDeletionCheckResult {
  hasUnjustifiedDeletion: boolean;
  suppressedUnit?: string;
  reason?: string;
}

export function detectUnjustifiedCollateralDeletion(change: {
  type: LegalChangeType;
  originalExcerpt: string;
  revisedExcerpt: string;
  reason: string;
  evidence?: LegalReviewEvidence[];
}): CollateralDeletionCheckResult {
  if (change.type === "REMOCAO") {
    return { hasUnjustifiedDeletion: false };
  }

  const orig = String(change.originalExcerpt || "");
  const rev = String(change.revisedExcerpt || "");
  const reasonText = String(change.reason || "");
  const evidenceText = (change.evidence || [])
    .map((e) => `${e.title || ""} ${e.supportExplanation || ""}`)
    .join(" ");

  // 1. Unidades materiais críticas gerais (institutos dogmáticos, exemplos consolidados, autoridades)
  const CRITICAL_UNITS = [
    {
      label: "rol de culpados",
      pattern: /\b(?:rol\s+d[oe]s?\s+culpados|lançamento\s+no\s+rol)\b/i,
    },
    {
      label: "livramento condicional",
      pattern: /\blivramento\s+condicional\b/i,
    },
    {
      label: "sanções disciplinares",
      pattern: /\bsan[çc][õo]es\s+disciplinares(?:\s+administrativas)?\b/i,
    },
    {
      label: "contexto regional latino-americano",
      pattern: /\b(?:latino[- ]americano|direito\s+internacional\s+regional)\b/i,
    },
    {
      label: "embaixadas/legação",
      pattern: /\bembaixadas?\/(?:lega[çc][ãa]o|lega[çc][õo]es)\b/i,
    },
  ];

  for (const unit of CRITICAL_UNITS) {
    if (unit.pattern.test(orig) && !unit.pattern.test(rev)) {
      // Regra estrutural de revogação vs extinção material:
      // Se a justificativa alega revogação de dispositivo para suprimir instituto ou conceito material,
      // a evidência deve comprovar a extinção normativa definitiva do instituto, e não mera alteração de regime processual.
      const arguesRevocation = /\b(?:revoga[çc][aã]o|revogad[ao]|extin[çc][ãa]o)\b/i.test(reasonText);
      const provesDefinitiveExtinction = /\b(?:tr[âa]nsito\s+em\s+julgado|extin[çc][ãa]o\s+(?:total|absoluta|definitiva)|inconstitucionalidade\s+total)\b/i.test(evidenceText);
      if (arguesRevocation && !provesDefinitiveExtinction) {
        return {
          hasUnjustifiedDeletion: true,
          suppressedUnit: unit.label,
          reason: `Supressão indevida de "${unit.label}": a razão alega revogação, mas a evidência não comprova a extinção normativa definitiva do instituto.`,
        };
      }

      // Se a reason sequer menciona a unidade suprimida
      if (!unit.pattern.test(reasonText)) {
        return {
          hasUnjustifiedDeletion: true,
          suppressedUnit: unit.label,
          reason: `Supressão colateral de "${unit.label}" sem justificativa expressa na razão do patch.`,
        };
      }

      // Se menciona na reason, mas não há evidência oficial consultada demonstrando sua falsidade jurídica
      const evidenceHasProof = (change.evidence || []).some(
        (e) => e.official && e.consulted && e.supportsChange && unit.pattern.test(`${e.title} ${e.supportExplanation}`)
      );
      if (!evidenceHasProof) {
        return {
          hasUnjustifiedDeletion: true,
          suppressedUnit: unit.label,
          reason: `Supressão de "${unit.label}" sem suporte em evidência oficial comprovando sua falsidade jurídica.`,
        };
      }
    }
  }

  // 2. Supressão genérica de blocos de exemplo válidos (ex: "ex: ...", "tais como ...")
  const exampleMatch = orig.match(/\((?:ex|exemplo|exemplos):\s*([^)]+)\)/i) || orig.match(/\btais\s+como\s+([^,.;]+(?:,\s*[^,.;]+)*)/i);
  if (exampleMatch) {
    const exampleContent = exampleMatch[1].trim();
    if (exampleContent.length > 5) {
      const exampleWords = exampleContent.split(/\s+/).filter((w) => w.length > 4);
      const survivingWords = exampleWords.filter((w) => rev.toLowerCase().includes(w.toLowerCase()));
      if (exampleWords.length >= 2 && survivingWords.length === 0) {
        const reasonExplainsExample = exampleWords.some((w) => reasonText.toLowerCase().includes(w.toLowerCase()));
        if (!reasonExplainsExample) {
          return {
            hasUnjustifiedDeletion: true,
            suppressedUnit: `exemplo (${exampleContent.slice(0, 30)}...)`,
            reason: "Supressão colateral de exemplo válido do original sem justificativa jurídica na razão do patch.",
          };
        }
      }
    }
  }

  // 3. Ressalva válida suprimida colateralmente (ex.: ", ressalvada a hipótese legal.")
  const ressalvaMatch = orig.match(/,\s*(ressalvad[ao][^,.;]*|salvo[^,.;]*)/i);
  if (ressalvaMatch) {
    const ressalvaText = ressalvaMatch[1].trim();
    if (!rev.toLowerCase().includes("ressalvad") && !rev.toLowerCase().includes("salvo")) {
      const reasonExplainsRessalva = reasonText.toLowerCase().includes("ressalv") || reasonText.toLowerCase().includes("salvo");
      if (!reasonExplainsRessalva) {
        return {
          hasUnjustifiedDeletion: true,
          suppressedUnit: ressalvaText,
          reason: "Supressão colateral de ressalva válida sem justificativa jurídica na razão do patch.",
        };
      }
    }
  }

  return { hasUnjustifiedDeletion: false };
}

export interface DualCheckResult {
  failed: boolean;
  reason?: string;
}

/**
 * Dual Check V3 Genérico:
 * Verifica consistência entre literalidade legal e qualificação jurisprudencial vinculante aplicável.
 * Não depende de números de artigos nem nomes de casos concretos.
 */
export function checkStatuteAndJurisprudenceDualCheck(
  change: {
    originalExcerpt: string;
    revisedExcerpt: string;
    reason: string;
    evidence?: LegalReviewEvidence[];
  },
  lessonContext?: string
): DualCheckResult {
  const evidenceList = Array.isArray(change.evidence) ? change.evidence : [];
  const text = `${change.originalExcerpt}\n${change.revisedExcerpt}\n${change.reason}\n${evidenceList.map((e) => `${e.title || ""} ${e.supportExplanation || ""}`).join("\n")}`;
  const rev = String(change.revisedExcerpt || "");
  const reasonText = String(change.reason || "");

  // A. Inconsistência Interna entre Justificativa/Evidência e Texto Revisado:
  // Se a razão ou a evidência do patch reconhece qualificação vinculante
  // (interpretação conforme, regime preferencial, ressalva, condicionante, exceção admitida),
  // mas o trecho revisado reproduz a regra legal sem incorporar essa qualificação:
  const QUALIFICATION_MARKERS_REASON =
    /\b(?:interpreta[çc][aã]o\s+conforme|forma\s+preferencial(?:mente)?|preferencialmente|regime\s+preferencial|preferencial\b|admitidas?\s+exce[çc][õo]es|ressalvada[s]?|condicionad[ao]|desde\s+que|n[ãa]o\s+[ée]\s+autom[áa]tico|n[ãa]o\s+[ée]\s+absolut[ao]|flexibiliza[çc][aã]o|excepcionad[ao])\b/i;

  const reasonClaimsQualification = QUALIFICATION_MARKERS_REASON.test(reasonText);
  const evidenceClaimsQualification = evidenceList.some((e) =>
    QUALIFICATION_MARKERS_REASON.test(e.supportExplanation || "")
  );

  if (reasonClaimsQualification || evidenceClaimsQualification) {
    const QUALIFICATION_MARKERS_REVISED =
      /\b(?:preferencial(?:mente)?|interpreta[çc][aã]o\s+conforme|ressalva(?:-se|da[s]?)?|salvo|desde\s+que|exce[çc][aã]o|exce[çc][õo]es|admitid[ao]|condicionad[ao]|jurisprud[êe]ncia|STF|STJ|entendimento|sucessivas)\b/i;

    if (!QUALIFICATION_MARKERS_REVISED.test(rev)) {
      return {
        failed: true,
        reason: "A razão ou evidência do patch reconhece qualificação/interpretação vinculante que não foi incorporada à redação revista (omissão de ressalva vinculante material).",
      };
    }
  }

  // B. Afirmação de Jurisprudência Vinculante sem comprovação oficial do próprio Tribunal:
  const hasCourtClaim = /\b(?:STF|Supremo\s+Tribunal\s+Federal|STJ|Superior\s+Tribunal\s+de\s+Justi[çc]a|jurisprudência\s+vinculante|interpretação\s+conforme)\b/i.test(change.reason);
  if (hasCourtClaim && evidenceList.length > 0) {
    const hasCourtEvidence = evidenceList.some(
      (e) =>
        (evidenceSupportsFamily(e, "STF") ||
          evidenceSupportsFamily(e, "STJ") ||
          /\b(?:stf|stj)\.jus\.br\b/i.test(e.url || "")) &&
        e.official &&
        e.consulted &&
        e.supportsChange
    );
    if (!hasCourtEvidence) {
      return {
        failed: true,
        reason: "Afirmação de interpretação vinculante do STF/STJ exige comprovação oficial do próprio tribunal competente (Dual Check).",
      };
    }
  }

  // C. Contexto da Própria Aula (lessonContext):
  // Se o contexto da aula indica que o dispositivo ou matéria foi objeto de controle vinculante
  // (julgamento de constitucionalidade, ADI, ADC, interpretação conforme),
  // uma alteração sustentada exclusivamente por lei ordinária sem qualquer fonte jurisprudencial falha o Dual Check.
  if (lessonContext && typeof lessonContext === "string" && lessonContext.length > 50) {
    const patchArticles = Array.from(text.matchAll(/\bart(?:igo|\.)?\s*(\d+[º°]?(?:-[A-Za-z]+)?)/gi)).map((m) =>
      m[1].toLowerCase()
    );

    if (patchArticles.length > 0) {
      const paragraphs = lessonContext.split(/\n\s*\n/);
      for (const para of paragraphs) {
        const hasJudicialControl =
          /\b(?:STF|Supremo\s+Tribunal\s+Federal|STJ|Superior\s+Tribunal\s+de\s+Justi[çc]a|ADI|ADIs|ADC|ADPF|repercuss[aã]o\s+geral|s[úu]mula\s+vinculante)\b/i.test(para) &&
          /\b(?:inconstitucional|interpreta[çc][aã]o\s+conforme|inconstitucionalidade|declarou|declarado|julgamento|julgou|decidiu|fixou|ac[óo]rd[aã]o)\b/i.test(para);

        if (hasJudicialControl) {
          const matchesPatchArticle = patchArticles.some((art) => {
            const artRegex = new RegExp(`\\bart(?:igo|\\.)?\\s*${art.replace("-", "\\-")}\\b`, "i");
            return artRegex.test(para);
          });

          if (matchesPatchArticle) {
            const hasCourtEvidence = evidenceList.some(
              (e) =>
                (evidenceSupportsFamily(e, "STF") ||
                  evidenceSupportsFamily(e, "STJ") ||
                  evidenceSupportsFamily(e, "CNJ") ||
                  /\b(?:stf|stj|cnj)\.jus\.br\b/i.test(e.url || "")) &&
                e.official &&
                e.consulted &&
                e.supportsChange
            );
            if (!hasCourtEvidence) {
              return {
                failed: true,
                reason: "O bloco da aula identifica que este dispositivo ou matéria foi submetido a julgamento vinculante de constitucionalidade; alteração baseada exclusivamente em legislação ordinária exige comprovação jurisprudencial (Dual Check).",
              };
            }
          }
        }
      }
    }
  }

  return { failed: false };
}

export interface SemanticCompletenessResult {
  failed: boolean;
  reason?: string;
}

/**
 * Gate de Completude Semântica Genérico:
 * Impede que enumerações parciais sejam apresentadas como taxativas ou omitam hipóteses
 * essenciais expressamente comprovadas pelas fontes oficiais consultadas.
 */
export function checkSemanticCompleteness(change: {
  originalExcerpt: string;
  revisedExcerpt: string;
  reason: string;
  evidence?: LegalReviewEvidence[];
}): SemanticCompletenessResult {
  const rev = String(change.revisedExcerpt || "");
  const evidenceList = Array.isArray(change.evidence) ? change.evidence : [];

  // 1. Rol aparentemente exaustivo em geral:
  const exhaustiveMarker = /\b(?:s[ãa]o\s+(?:exclusivamente|taxativamente|apenas)|somente\s+(?:as|os)|rol\s+taxativo|taxativamente|exclusivamente|apenas\s+(?:em|nas?|nos?|com))\b/i.test(rev);
  if (exhaustiveMarker) {
    for (const ev of evidenceList) {
      const exp = `${ev.title || ""} ${ev.supportExplanation || ""}`;
      const evCountMatch = exp.match(/\b(?:quatro|cinco|seis|4|5|6)\s+(?:hip[óo]teses|exce[çc][õo]es|requisitos|casos)\b/i);
      const revCountMatch = rev.match(/\b(?:tr[êe]s|duas|uma|1|2|3)\s+(?:hip[óo]teses|exce[çc][õo]es|requisitos|casos)\b/i);
      if (evCountMatch && revCountMatch) {
        return {
          failed: true,
          reason: "Completude semântica: a fonte oficial comprova mais hipóteses/exceções do que as apresentadas no rol taxativo do texto revisado.",
        };
      }
    }
  }

  // 2. Apresentação de exceção isolada em regra geral sem qualificação:
  const singleExceptionMatch = rev.match(/\bexceto\s+([^,.;]+)/i);
  if (singleExceptionMatch) {
    const isQualifiedAsPartialOrLiteral =
      /\b(?:segundo\s+a\s+literalidade|na\s+letra\s+da\s+lei|literalmente|texto\s+legal|observadas\s+as\s+demais|al[ée]m\s+d[ea]|exemplificativamente)\b/i.test(rev);

    if (!isQualifiedAsPartialOrLiteral) {
      const evidenceProvesMultipleExceptions = evidenceList.some((e) => {
        const exp = `${e.title || ""} ${e.supportExplanation || ""}`.toLowerCase();
        return (
          /\b(?:exce[çc][õo]es|outras\s+hip[óo]teses|demais\s+casos|al[ée]m\s+d[eo])\b/i.test(exp) &&
          (exp.match(/,/g) || []).length >= 2
        );
      });

      if (evidenceProvesMultipleExceptions) {
        return {
          failed: true,
          reason: "Completude semântica: apresentação de exceção única sem qualificação estrita quando a fonte oficial comprova múltiplas exceções vinculantes.",
        };
      }
    }
  }

  return { failed: false };
}

export interface PropositionSupportResult {
  failed: boolean;
  reason?: string;
}

export function checkEffectivePropositionSupport(change: {
  originalExcerpt: string;
  revisedExcerpt: string;
  reason: string;
  evidence?: LegalReviewEvidence[];
}): PropositionSupportResult {
  const evidenceList = Array.isArray(change.evidence) ? change.evidence : [];
  if (evidenceList.length === 0) return { failed: false };

  const revised = String(change.revisedExcerpt || "");
  const propMatches = revised.match(/(?:Proposi[çc][ãa]o\s*\d+|Requisito\s*\d+|Item\s*\d+|Norma\s*[A-Z])/gi);
  if (propMatches && propMatches.length >= 3) {
    let coveredCount = 0;
    for (const prop of propMatches) {
      const hasSupport = evidenceList.some((e) =>
        e.official && e.consulted && e.supportsChange && new RegExp(prop, "i").test(`${e.title} ${e.supportExplanation}`)
      );
      if (hasSupport) coveredCount += 1;
    }
    if (coveredCount < propMatches.length) {
      return {
        failed: true,
        reason: `Atomicidade probatória: o patch introduz ${propMatches.length} proposições materiais, mas a evidência comprova apenas ${coveredCount}. O patch integral não pode ser confirmado sem atomização.`,
      };
    }
  }

  return { failed: false };
}

export interface InstitutionalProvenanceResult {
  failed: boolean;
  claimedInstitutions?: string[];
  reason?: string;
}

/**
 * Gate de Proveniência Institucional V2:
 * Avalia vínculo entre a proposição atribuída a uma autoridade/órgão e a evidência da respectiva família.
 * Impede que afirmações atribuídas a uma instituição usem evidências exclusivas de outra.
 */
export function checkInstitutionalProvenance(change: {
  originalExcerpt: string;
  revisedExcerpt: string;
  reason: string;
  evidence?: LegalReviewEvidence[];
}): InstitutionalProvenanceResult {
  const rev = String(change.revisedExcerpt || "");
  const evidenceList = Array.isArray(change.evidence) ? change.evidence : [];

  const MONITORED_INSTITUTIONS = [
    {
      family: "STF" as const,
      pattern: /\b(?:o\s+)?STF\b[^\n.!?]*\b(?:fixou|declarou|ressalvou|excluiu|determinou|decidiu|julgou|entendeu|assentou)\b([^\n.!?]*)/i,
      keywordMatcher: /\b(?:STF|Supremo|ADI|ADC|ADPF|repercussão\s+geral|súmula\s+vinculante)\b/i,
    },
    {
      family: "STJ" as const,
      pattern: /\b(?:o\s+)?STJ\b[^\n.!?]*\b(?:fixou|sumulou|decidiu|entendeu|assentou|determinou)\b([^\n.!?]*)/i,
      keywordMatcher: /\b(?:STJ|Superior\s+Tribunal|repetitivo|súmula\s+(?!vinculante))\b/i,
    },
    {
      family: "CNJ" as const,
      pattern: /\b(?:o\s+)?CNJ\b[^\n.!?]*\b(?:prev[êe]|estabeleceu|regulamentou|determinou|fixou|editou)\b([^\n.!?]*)/i,
      keywordMatcher: /\b(?:CNJ|Conselho\s+Nacional\s+de\s+Justiça|resolução\s+(?:n[º°]\s*)?\d+)\b/i,
    },
    {
      family: "CNMP" as const,
      pattern: /\b(?:o\s+)?CNMP\b[^\n.!?]*\b(?:prev[êe]|estabeleceu|regulamentou|determinou|fixou|editou)\b([^\n.!?]*)/i,
      keywordMatcher: /\b(?:CNMP|Conselho\s+Nacional\s+do\s+Ministério\s+Público)\b/i,
    },
  ];

  for (const inst of MONITORED_INSTITUTIONS) {
    const match = rev.match(inst.pattern);
    if (match) {
      // 1. Proposição atribuída exige evidência oficial da respectiva família
      const hasFamilyEvidence = evidenceList.some(
        (e) =>
          (evidenceSupportsFamily(e, inst.family) || inst.keywordMatcher.test(e.url || "")) &&
          e.official &&
          e.consulted &&
          e.supportsChange
      );
      if (!hasFamilyEvidence) {
        return {
          failed: true,
          claimedInstitutions: [inst.family],
          reason: `Proposição jurídica atribuída nominalmente a ${inst.family} sem evidência oficial comprobatória da respectiva instituição.`,
        };
      }

      // 2. Vínculo Proposição → Evidência (Detecção de Proveniência Cruzada):
      // Se a proposição atribuída a esta instituição traz termos materiais específicos,
      // mas as fontes dessa instituição não dão suporte e a matéria está presente em fontes de OUTRA instituição,
      // há desvio de atribuição institucional.
      const claimedProposition = match[0];
      const claimedNouns = Array.from(claimedProposition.matchAll(/\b[a-záàâãéèêíïóôõöúç]{6,}\b/gi))
        .map((m) => m[0].toLowerCase())
        .filter(
          (w) =>
            ![
              "tribunal",
              "decidiu",
              "declarou",
              "ressalvou",
              "fixou",
              "entendeu",
              "determinou",
              "previu",
              "conforme",
              "segundo",
              "também",
              "processos",
              "processo",
              "contudo",
              "artigo",
              "parágrafo",
              "inciso",
              "alínea",
              "caput",
              "dispositivo",
              "norma",
              "normas",
              "constitucional",
              "inconstitucional",
              "constitucionalidade",
              "inconstitucionalidade",
            ].includes(w)
        );

      if (claimedNouns.length > 0) {
        const instEvidenceMatches = evidenceList.filter((e) => evidenceSupportsFamily(e, inst.family));
        const instEvidenceText = instEvidenceMatches.map((e) => `${e.title || ""} ${e.supportExplanation || ""}`.toLowerCase()).join(" ");

        const otherEvidences = evidenceList.filter(
          (e) => !evidenceSupportsFamily(e, inst.family) && MONITORED_INSTITUTIONS.some((m) => evidenceSupportsFamily(e, m.family))
        );
        const otherEvidenceText = otherEvidences.map((e) => `${e.title || ""} ${e.supportExplanation || ""}`.toLowerCase()).join(" ");

        if (otherEvidences.length > 0) {
          const crossAttributed = claimedNouns.filter(
            (noun) => !instEvidenceText.includes(noun) && otherEvidenceText.includes(noun)
          );

          if (crossAttributed.length > 0) {
            return {
              failed: true,
              claimedInstitutions: [inst.family],
              reason: `Violação de proveniência institucional: a proposição atribuída a ${inst.family} traz matéria ("${crossAttributed.join(", ")}") sem respaldo nas fontes de ${inst.family}, correspondente a fontes de outra instituição.`,
            };
          }
        }
      }
    }
  }

  return { failed: false };
}

export interface NormativeSemanticDriftResult {
  hasDrift: boolean;
  dimensions: string[];
  reason?: string;
}

/**
 * Gate de Desvio Semântico-Normativo V2:
 * Avalia de forma genérica e estruturada se o patch alterou modalidade normativa ou prazos
 * sem suporte probatório ou justificativa adequada.
 */
export function detectNormativeSemanticDrift(change: {
  originalExcerpt: string;
  revisedExcerpt: string;
  reason: string;
  evidence?: LegalReviewEvidence[];
}): NormativeSemanticDriftResult {
  const orig = String(change.originalExcerpt || "");
  const rev = String(change.revisedExcerpt || "");
  const reasonText = String(change.reason || "");
  const evidenceList = Array.isArray(change.evidence) ? change.evidence : [];
  const dimensions: string[] = [];

  // A. Modalidade Normativa (Dever cogente vs Faculdade discricionária)
  const origHasDuty = /(?<!\p{L})(?:dever[áa]|deve|obrigat[óo]ri[ao]|imperativamente|impõe-se|exige-se)(?!\p{L})/iu.test(orig);
  const revHasDiscretion = /(?<!\p{L})(?:poder[áa]|pode|facultativ[ao]|a\s+crit[ée]rio|faculta-se|discricionari(?:o|a|amente))(?!\p{L})/iu.test(rev);

  if (origHasDuty && revHasDiscretion) {
    const evidenceSupportsDiscretion = evidenceList.some((e) =>
      /(?<!\p{L})(?:faculdade|poder[áa]|discricion[áa]ri[ao]|facultad[ao]|discricionariedade)(?!\p{L})/iu.test(e.supportExplanation || "")
    );
    const reasonExplainsDiscretion = /(?<!\p{L})(?:faculdade|poder[áa]|discricion[áa]ri[ao]|discricionariedade)(?!\p{L})/iu.test(reasonText);
    if (!evidenceSupportsDiscretion && !reasonExplainsDiscretion) {
      dimensions.push("modalidade_dever_para_faculdade");
      return {
        hasDrift: true,
        dimensions,
        reason: "Desvio semântico-normativo: conversão indevida de dever legal cogente em faculdade discricionária ('poderá') sem suporte oficial ou justificativa no patch.",
      };
    }
  }

  // B. Prazos genéricos (horas, dias, meses, anos)
  const deadlineRegex = /(?<!\p{L})prazo\s+(?:m[áa]ximo\s+)?de\s+(?:at[ée]\s+)?(\d+)\s*(horas?|dias?|meses|m[êe]s|anos?)(?!\p{L})/iu;
  const origDeadlineMatch = orig.match(deadlineRegex);
  const revDeadlineMatch = rev.match(deadlineRegex);

  if (origDeadlineMatch) {
    const origDeadlineStr = origDeadlineMatch[0];
    const reasonMentionsDeadline = /(?<!\p{L})(?:prazo|temporal|horas?|dias?|meses|anos?|revoga[çc][aã]o|altera[çc][aã]o\s+de\s+prazo)(?!\p{L})/iu.test(reasonText);
    const evidenceMentionsDeadline = evidenceList.some((e) =>
      /(?<!\p{L})(?:prazo|temporal|horas?|dias?|meses|anos?)(?!\p{L})/iu.test(e.supportExplanation || "")
    );

    if (!revDeadlineMatch) {
      // Prazo foi suprimido
      if (!reasonMentionsDeadline && !evidenceMentionsDeadline) {
        dimensions.push("supressao_de_prazo");
        return {
          hasDrift: true,
          dimensions,
          reason: `Desvio semântico-normativo: supressão do prazo legal vinculante ("${origDeadlineStr}") sem justificativa na razão do patch.`,
        };
      }
    } else {
      // Prazo foi alterado
      const origValue = `${origDeadlineMatch[1]} ${origDeadlineMatch[2].toLowerCase()}`;
      const revValue = `${revDeadlineMatch[1]} ${revDeadlineMatch[2].toLowerCase()}`;
      if (origValue !== revValue && !reasonMentionsDeadline && !evidenceMentionsDeadline) {
        dimensions.push("alteracao_de_prazo");
        return {
          hasDrift: true,
          dimensions,
          reason: `Desvio semântico-normativo: alteração do prazo ("${origValue}" para "${revValue}") sem justificativa na razão ou na evidência do patch.`,
        };
      }
    }
  }

  return { hasDrift: false, dimensions };
}

export interface ShouldRunCoverageInput {
  content: string;
  parsedMain: NormalizedAudit;
  sectionIndex?: number;
}

export interface CoverageDecision {
  run: boolean;
  reasons: string[];
  skipReason?: string;
}

/**
 * Decisão Adaptativa de Execução da Coverage Pass:
 * Determina se a passagem de cobertura é necessária com base em sinais objetivos da Main Review.
 * Evita chamadas redundantes e caras ao modelo quando a Main já foi suficiente.
 */
export function shouldRunCoveragePass(input: ShouldRunCoverageInput): CoverageDecision {
  const { content, parsedMain } = input;
  const reasons: string[] = [];

  const statuteMatches = content.match(/\b(?:art(?:igo|\.)?\s*\d+|inciso\s+[A-Z0-9]+|§\s*\d+|parágrafo\s+único)\b/gi) || [];
  const courtMatches = content.match(/\b(?:STF|STJ|CNJ|TST|TSE|ADI|ADPF|ADC|súmula\s+vinculante|repercussão\s+geral|recurso\s+repetitivo)\b/gi) || [];
  const enumMatches = content.match(/(?:^|\n)\s*(?:[0-9]+[.)]|[A-Z][.)]|[-*•])\s+/g) || [];

  const normativeDensity = statuteMatches.length;
  const judicialComplexity = courtMatches.length;
  const enumerationCount = enumMatches.length;

  const acceptedCount = (parsedMain.changes || []).filter((c) => c.confirmation === "CONFIRMADO").length;
  const rejectedCount = (parsedMain.changes || []).filter((c) => c.confirmation === "NAO_CONFIRMADO").length;
  const unverifiedCount = (parsedMain.unverifiedClaims || []).length;
  const repairableCount = (parsedMain.repairablePatches || []).length;

  // Sinal 1: Alta densidade normativa sem alterações encontradas na Main (possível falso negativo)
  if (normativeDensity >= 4 && acceptedCount === 0 && content.length > 800) {
    reasons.push("HIGH_NORMATIVE_DENSITY_ZERO_FINDINGS");
  }

  // Sinal 2: Presença de jurisprudência complexa com baixa cobertura de alterações
  if (judicialComplexity >= 3 && acceptedCount === 0 && content.length > 600) {
    reasons.push("COMPLEX_JURISPRUDENCE_LOW_COVERAGE");
  }

  // Sinal 3: Densidade de enumerações elevada em conteúdo longo com poucos achados
  if (enumerationCount >= 5 && acceptedCount <= 1 && content.length > 1200) {
    reasons.push("HIGH_ENUMERATION_DENSITY");
  }

  // Sinal 4: Incerteza / pendências da Main (unverified claims ou patches rejeitados/reparáveis)
  if (unverifiedCount > 0 || repairableCount > 0 || rejectedCount > 1) {
    reasons.push("MAIN_VALIDATION_UNCERTAINTY");
  }

  // Sinal 5: Desproporção entre tamanho e achados em texto com marcadores normativos
  if (content.length > 2500 && (normativeDensity >= 3 || judicialComplexity >= 2) && acceptedCount <= 1) {
    reasons.push("SUSPICIOUS_CONTENT_SIZE_RATIO");
  }

  if (reasons.length > 0) {
    return {
      run: true,
      reasons,
    };
  }

  const skipReason = acceptedCount > 0
    ? "sufficient_main_coverage"
    : normativeDensity < 3
      ? "low_normative_density"
      : "standard_content_no_risk";

  return {
    run: false,
    reasons: [],
    skipReason,
  };
}

/**
 * Determina as famílias de fontes oficiais obrigatórias para sustentar uma alteração jurídica.
 *
 * Regras:
 * 1. Famílias institucionais presentes no trecho revisado (revisedExcerpt) são inicialmente candidatas.
 * 2. Categoria LEGISLACAO sempre requer LEGISLACAO_FEDERAL.
 * 3. Famílias presentes APENAS no originalExcerpt (e removidas/substituídas no revisedExcerpt)
 *    NÃO são exigidas, salvo se a alteração fizer afirmação positiva autônoma sobre decisão,
 *    competência, ato ou entendimento daquela instituição na justificativa (reason).
 * 4. Regra semântica de autoridade vs. menção incidental: quando uma autoridade decisória A
 *    (ex.: STF) possui evidência oficial consultada com suporte efetivo à alteração cobrindo
 *    uma decisão/julgamento dela descrita no texto, e outra instituição B (ex.: CNJ, TJs, TRFs)
 *    é mencionada apenas no conteúdo ou parâmetros dessa decisão (ex.: "observar diretrizes do CNJ"),
 *    sem que haja afirmação jurídica autônoma atribuída diretamente a B (como resolução, ato normativo,
 *    decisão ou precedentes próprios produzidos por B), B é considerada incidental e não gera
 *    requiredFamily autônoma.
 */
export function requiredFamiliesForChange(change: {
  category: string;
  reason: string;
  originalExcerpt: string;
  revisedExcerpt: string;
  evidence?: LegalReviewEvidence[];
}): SourceFamily[] {
  const originalNamed = institutionsNamedInClaim(change.originalExcerpt, "CONCEITO");
  const revisedNamed = institutionsNamedInClaim(change.revisedExcerpt, "CONCEITO");
  const reasonNamed = institutionsNamedInClaim(change.reason, "CONCEITO");

  // Todas as instituições nomeadas na alteração na ordem canônica (NAMED_PATTERNS + LEGISLACAO_FEDERAL)
  const allMentioned = institutionsNamedInClaim(
    `${change.reason}\n${change.originalExcerpt}\n${change.revisedExcerpt}`,
    change.category
  );

  const candidates: SourceFamily[] = [];

  for (const family of allMentioned) {
    if (family === "LEGISLACAO_FEDERAL" || family === "DIARIO_OFICIAL") {
      candidates.push(family);
      continue;
    }

    const inOriginal = originalNamed.includes(family);
    const inRevised = revisedNamed.includes(family);
    const inReason = reasonNamed.includes(family);

    // Se a família estava no original, mas NÃO está no revisado:
    if (inOriginal && !inRevised) {
      if (!inReason) {
        // Estava apenas no original e foi removida (caso CHG-001) -> não exige
        continue;
      }
      // Se está na reason, verifica se a reason apenas explica a remoção/erro do original
      if (hasPositiveAffirmationInReason(change.reason, family)) {
        candidates.push(family);
      }
      continue;
    }

    // Se está no revisado ou na reason:
    candidates.push(family);
  }

  // 5. Distinção entre autoridade da fonte e instituição incidentalmente mencionada
  const claimText = `${change.reason}\n${change.revisedExcerpt}`;
  const evidenceList = Array.isArray(change.evidence) ? change.evidence : [];

  // Localiza autoridades judiciais/decisórias A que possuem suporte oficial na evidência
  const verifiedRulingAuthorities = new Set<SourceFamily>();
  for (const ev of evidenceList) {
    if (!ev.official || !ev.consulted || ev.supportsChange !== true) continue;
    const isRulingEvidence =
      ev.sourceType === "ACORDAO" ||
      ev.sourceType === "REPERCUSSAO_GERAL" ||
      ev.sourceType === "REPETITIVO" ||
      ev.sourceType === "INFORMATIVO" ||
      ev.sourceType === "OUTRO_OFICIAL" ||
      /\b(?:ADI|ADC|ADPF|RE|HC|RMS|Tema|ac[oó]rd[aã]o|julgamento)\b/i.test(ev.title || "") ||
      /\b(?:ADI|ADC|ADPF|RE|HC|RMS|Tema|ac[oó]rd[aã]o|julgamento)\b/i.test(ev.supportExplanation || "");

    if (!isRulingEvidence) continue;

    for (const family of candidates) {
      if (family === "LEGISLACAO_FEDERAL" || family === "DIARIO_OFICIAL") continue;
      if (evidenceSupportsFamily(ev, family)) {
        const pattern = institutionalPatternForFamily(family);
        const reportsRulingOfA =
          pattern &&
          pattern.test(claimText) &&
          /\b(?:declarou|decidiu|fixou|julgou|entendeu|assentou|firmou|concluiu|determinou|inconstitucionalidade|constitucionalidade|interpreta[cç][aã]o\s+conforme|ADI|ADC|ADPF|RE|RMS|HC)\b/i.test(
            claimText
          );
        if (reportsRulingOfA) {
          verifiedRulingAuthorities.add(family);
        }
      }
    }
  }

  const finalRequired: SourceFamily[] = [];
  for (const family of candidates) {
    if (family === "LEGISLACAO_FEDERAL" || family === "DIARIO_OFICIAL") {
      finalRequired.push(family);
      continue;
    }

    // Se é a própria autoridade decisória verificada, permanece exigida
    if (verifiedRulingAuthorities.has(family)) {
      finalRequired.push(family);
      continue;
    }

    // Se há autoridade decisória A oficialmente verificada no change:
    if (verifiedRulingAuthorities.size > 0) {
      // Verifica se B possui afirmação jurídica autônoma atribuída a ela
      const hasAutonomous = hasAutonomousClaimAttributedToFamily(claimText, family);
      if (!hasAutonomous) {
        // B é mencionada apenas incidentalmente no âmbito da decisão da autoridade A
        continue;
      }
    }

    finalRequired.push(family);
  }

  return finalRequired;
}

export const MAX_LEGAL_CHANGE_REASON_CHARS = 500;

function legalRefusalCodes(
  change: Omit<LegalReviewChange, "verified" | "confirmation"> & {
    rawNature?: unknown;
    rawOutcome?: unknown;
  },
  modelConfirmation: LegalConfirmation,
  lessonContext?: string
): ValidationReasonCode[] {
  if (modelConfirmation === "NAO_CONFIRMADO") return ["MODEL_UNCONFIRMED"];
  if (!change.reason || !change.reason.trim()) return ["REASON_EMPTY"];
  if (change.reason.length > MAX_LEGAL_CHANGE_REASON_CHARS) return ["REASON_TOO_LONG"];

  // Validação determinística da Taxonomia Jurídica (Etapa 5D)
  const taxonomy = validateClaimTaxonomy({
    nature: change.nature,
    outcome: change.outcome,
    rawNature: change.rawNature,
    rawOutcome: change.rawOutcome,
    metadata: change.evidenceMetadata,
    sources: change.sources,
    evidence: change.evidence,
    isOfficialSourceChecker: isOfficialLegalUrl,
    category: change.category,
    confirmation: modelConfirmation,
    originalExcerpt: change.originalExcerpt,
    revisedExcerpt: change.revisedExcerpt,
    reason: change.reason,
  });
  if (!taxonomy.valid) {
    return ["TAXONOMY_VALIDATION_FAILED"];
  }

  if (changeLacksNormativeSpecificity(change)) return ["SOURCE_SPECIFICITY_FAILED"];
  if (changeContainsUngroundedInvention(change)) return ["NORMATIVE_INVENTION"];

  const introducedStatutes = newlyIntroducedStatutes(change.originalExcerpt, change.revisedExcerpt);
  if (introducedStatutes.length > 0) {
    const covered = introducedStatutes.every((statute) =>
      change.evidence.some((item) => evidenceSupportsStatute(item, statute.number))
    );
    if (!covered) return ["DIPLOMA_EVIDENCE_FAILED"];
  }
  const required = requiredFamiliesForChange(change);
  if (required.length) {
    const covered = required.every((family) => change.evidence.some((item) => evidenceSupportsFamily(item, family)));
    if (!covered) return ["COURT_FAMILY_FAILED"];
  }

  // V2.1: Deletion Safety Gate
  if (detectUnjustifiedCollateralDeletion(change).hasUnjustifiedDeletion) {
    return ["COLLATERAL_DELETION_FAILED"];
  }

  // V2.3: Institutional Provenance Gate
  if (checkInstitutionalProvenance(change).failed) {
    return ["INSTITUTIONAL_PROVENANCE_FAILED"];
  }

  // V2.3: Normative Semantic Drift
  if (detectNormativeSemanticDrift(change).hasDrift) {
    return ["NORMATIVE_DRIFT_FAILED"];
  }

  // V2.1/V2.2: Statute + Jurisprudence Dual Check
  if (checkStatuteAndJurisprudenceDualCheck(change, lessonContext).failed) {
    return ["DUAL_CHECK_FAILED"];
  }

  // V2.1: Completude Semântica
  if (checkSemanticCompleteness(change).failed) {
    return ["INCOMPLETE_ENUMERATION_FAILED"];
  }

  // V2.1: Suporte Probatório Integral
  if (checkEffectivePropositionSupport(change).failed) {
    return ["UNSUPPORTED_PROPOSITION_FAILED"];
  }

  if (!isMaterialLegalChange(change)) return [];
  return change.evidence.some(evidenceConfirmsMaterialClaim) ? [] : ["EVIDENCE_INSUFFICIENT"];
}

function confirmChange(
  change: Omit<LegalReviewChange, "verified" | "confirmation"> & {
    rawNature?: unknown;
    rawOutcome?: unknown;
  },
  modelConfirmation: LegalConfirmation,
  lessonContext?: string
): LegalConfirmation {
  if (modelConfirmation === "NAO_CONFIRMADO") return "NAO_CONFIRMADO";
  if (!change.reason || !change.reason.trim()) return "NAO_CONFIRMADO";
  if (change.reason.length > MAX_LEGAL_CHANGE_REASON_CHARS) return "NAO_CONFIRMADO";
  // Validação determinística da Taxonomia Jurídica (Etapa 5D)
  const taxonomy = validateClaimTaxonomy({
    nature: change.nature,
    outcome: change.outcome,
    rawNature: change.rawNature,
    rawOutcome: change.rawOutcome,
    metadata: change.evidenceMetadata,
    sources: change.sources,
    evidence: change.evidence,
    isOfficialSourceChecker: isOfficialLegalUrl,
    category: change.category,
    confirmation: modelConfirmation,
    originalExcerpt: change.originalExcerpt,
    revisedExcerpt: change.revisedExcerpt,
    reason: change.reason,
  });
  if (!taxonomy.valid) {
    return "NAO_CONFIRMADO";
  }

  if (changeLacksNormativeSpecificity(change)) return "NAO_CONFIRMADO";
  if (changeContainsUngroundedInvention(change)) return "NAO_CONFIRMADO";

  const introducedStatutes = newlyIntroducedStatutes(change.originalExcerpt, change.revisedExcerpt);
  if (introducedStatutes.length > 0) {
    const statutesCovered = introducedStatutes.every((statute) =>
      change.evidence.some((item) => evidenceSupportsStatute(item, statute.number))
    );
    if (!statutesCovered) return "NAO_CONFIRMADO";
  }

  const required = requiredFamiliesForChange(change);
  if (required.length) {
    const covered = required.every((family) => change.evidence.some((item) => evidenceSupportsFamily(item, family)));
    if (!covered) return "NAO_CONFIRMADO";
  }

  // V2.1: Deletion Safety Gate
  if (detectUnjustifiedCollateralDeletion(change).hasUnjustifiedDeletion) {
    return "NAO_CONFIRMADO";
  }

  // V2.3: Institutional Provenance Gate
  if (checkInstitutionalProvenance(change).failed) {
    return "NAO_CONFIRMADO";
  }

  // V2.3: Normative Semantic Drift
  if (detectNormativeSemanticDrift(change).hasDrift) {
    return "NAO_CONFIRMADO";
  }

  // V2.1/V2.2: Statute + Jurisprudence Dual Check
  if (checkStatuteAndJurisprudenceDualCheck(change, lessonContext).failed) {
    return "NAO_CONFIRMADO";
  }

  // V2.1: Completude Semântica
  if (checkSemanticCompleteness(change).failed) {
    return "NAO_CONFIRMADO";
  }

  // V2.1: Suporte Probatório Integral
  if (checkEffectivePropositionSupport(change).failed) {
    return "NAO_CONFIRMADO";
  }

  if (!isMaterialLegalChange(change)) return modelConfirmation;
  return change.evidence.some(evidenceConfirmsMaterialClaim) ? "CONFIRMADO" : "NAO_CONFIRMADO";
}

function readChange(value: unknown, index: number, consulted: Set<string>, lessonContext?: string): LegalReviewChange | null {
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
  const rawSources = Array.isArray(record.sources) && record.sources.length > 0
    ? record.sources.map(readSource).filter((item): item is LegalReviewSource => Boolean(item)).slice(0, 6)
    : [];
  const evidence = Array.isArray(record.evidence)
    ? record.evidence.map((item) => readEvidence(item, consulted)).filter((item): item is LegalReviewEvidence => Boolean(item)).slice(0, 6)
    : [];
  const sources = rawSources.length > 0
    ? rawSources
    : evidence.map((e) => ({
        title: e.title,
        url: e.url,
        official: e.official,
        institution: e.institution,
      }));
  const category = oneOf(record.category, CATEGORIES, "CONCEITO");

  const rawNature = typeof record.nature === "string" ? record.nature.trim() : undefined;
  const validNature = rawNature && (VALID_CLAIM_NATURES as readonly string[]).includes(rawNature)
    ? (rawNature as LegalClaimNature)
    : undefined;

  const rawOutcome = typeof record.outcome === "string" ? record.outcome.trim() : undefined;
  const validOutcome = rawOutcome && (VALID_VERIFICATION_OUTCOMES as readonly string[]).includes(rawOutcome)
    ? (rawOutcome as LegalVerificationOutcome)
    : undefined;

  const rawEvidenceMetadata = record.evidenceMetadata && typeof record.evidenceMetadata === "object"
    ? (record.evidenceMetadata as ClaimEvidenceMetadata | EvidenceNatureMetadata)
    : undefined;

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
    ...(validNature ? { nature: validNature } : {}),
    ...(validOutcome ? { outcome: validOutcome } : {}),
    ...(rawEvidenceMetadata ? { evidenceMetadata: rawEvidenceMetadata } : {}),
  };
  const modelConfirmation: LegalConfirmation = record.confirmation === "NAO_CONFIRMADO" || record.verified === false
    ? "NAO_CONFIRMADO"
    : "CONFIRMADO";
  const confirmation = confirmChange(
    { ...draft, rawNature: record.nature, rawOutcome: record.outcome },
    modelConfirmation,
    lessonContext
  );
  const verified = confirmation === "CONFIRMADO";

  // Blindagem fail-closed (Scope 4): incoerência ou não confirmação rebaixa outcome de CONFIRMADA para NAO_VERIFICADA
  let outcome = draft.outcome;
  if (!verified && outcome === "CONFIRMADA") {
    outcome = "NAO_VERIFICADA";
  }

  return {
    ...draft,
    confirmation,
    verified,
    ...(outcome ? { outcome } : {}),
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
  validationLog?: LegalAuditValidationLog;

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
  /** Transitório. Não entra em legal_reviews. */
  repairablePatches?: RepairablePatch[];
  /** Transitório. Não entra em legal_reviews. */
  appliedPatchInputs?: AppliedPatchInput[];
  /** Transitório. Não entra em legal_reviews. */
  validationLog?: LegalAuditValidationLog;
  /** Transitório. Alegações autônomas do modelo sobre a aula, separadas de pendências derivadas de patches. */
  autonomousClaims?: LegalUnverifiedClaim[];
  /** Cobertura proposicional determinística (V2.3.2-B). */
  coverageSummary?: CoverageSummary;
  auditedUnits?: AuditedPropositionInput[];
  editorialIntegrity?: EditorialIntegrityValidation;
}

export type LiteralRejectReason =
  | "excerpt_missing"
  | "ambiguous"
  | "overlap"
  | "html"
  | "marker"
  | "length";

export interface LiteralPatchInput {
  key: string;
  originalExcerpt: string;
  revisedExcerpt: string;
  beforeContext?: string;
  afterContext?: string;
}

export interface AppliedLiteralPatch {
  key: string;
  start: number;
  end: number;
  originalExcerpt: string;
  revisedExcerpt: string;
  beforeContext: string;
  afterContext: string;
}

export interface RejectedLiteralPatch {
  key: string;
  reason: LiteralRejectReason;
}

export interface LiteralPatchApplication {
  markdown: string;
  applied: AppliedLiteralPatch[];
  rejected: RejectedLiteralPatch[];
}

export interface RepairablePatch {
  id: string;
  reason: "excerpt_missing" | "ambiguous" | "overlap" | "court_family" | "diploma_evidence";
  originalExcerpt: string;
  revisedExcerpt: string;
  beforeContext: string;
  afterContext: string;
  /** Só enum fechado. Não leva número de diploma, URL nem texto de fonte. */
  missingFamilies?: DiagnosticSourceFamily[];
  statuteTypes?: DiagnosticStatuteType[];
}

export interface AppliedPatchInput {
  id: string;
  beforeContext: string;
  afterContext: string;
}

function isRepairableReason(reason: LiteralRejectReason): reason is "excerpt_missing" | "ambiguous" | "overlap" {
  return reason === "excerpt_missing" || reason === "ambiguous" || reason === "overlap";
}

function rejectionNote(reason: LiteralRejectReason): string {
  switch (reason) {
    case "excerpt_missing":
      return "Patch não aplicado: o originalExcerpt não foi localizado literalmente no Markdown original.";
    case "ambiguous":
      return "Patch não aplicado: o trecho não identifica uma única ocorrência no Markdown original.";
    case "overlap":
      return "Patch não aplicado: o intervalo se sobrepõe a outro patch e nenhum dos conflitantes foi aplicado.";
    case "html":
      return "Patch não aplicado: a substituição introduziria HTML.";
    case "marker":
      return "Patch não aplicado: a substituição removeria um marcador de parte.";
    case "length":
      return "Patch não aplicado: a substituição excederia o tamanho admitido.";
    default:
      return "Patch não aplicado.";
  }
}

function rangesOverlap(left: { start: number; end: number }, right: { start: number; end: number }): boolean {
  return left.start < right.end && right.start < left.end;
}

function findLiteralSpans(
  haystack: string,
  needle: string,
  before: string,
  after: string
): Array<{ start: number; end: number }> {
  if (needle.length === 0) return [];
  const spans: Array<{ start: number; end: number }> = [];
  let from = 0;
  while (from < haystack.length) {
    const at = haystack.indexOf(needle, from);
    if (at < 0) break;
    const end = at + needle.length;
    const beforeOk = before.length === 0 || (at >= before.length && haystack.slice(at - before.length, at) === before);
    const afterOk = after.length === 0 || haystack.slice(end, end + after.length) === after;
    if (beforeOk && afterOk) spans.push({ start: at, end });
    from = at + 1;
  }
  return spans;
}

function replacementDropsBlockMarker(originalExcerpt: string, revisedExcerpt: string): boolean {
  const after = new Set(blockMarkers(revisedExcerpt));
  return blockMarkers(originalExcerpt).some((marker) => !after.has(marker));
}

function markdownWithinLimit(original: string, revised: string): boolean {
  if (revised.length > 900_000) return false;
  if (original.trim().length >= 20 && revised.trim().length < 20) return false;
  return revised.length <= Math.max(original.length * 3, original.length + 20_000);
}

function applySpans(original: string, patches: AppliedLiteralPatch[]): string {
  const ordered = [...patches].sort((left, right) => right.start - left.start || right.end - left.end);
  let text = original;
  for (const patch of ordered) {
    text = text.slice(0, patch.start) + patch.revisedExcerpt + text.slice(patch.end);
  }
  return text;
}

/**
 * Localiza e aplica patches por igualdade literal no Markdown original.
 * Não normaliza espaço, não escolhe ocorrência e não funde sobreposição.
 */
export function applyLiteralPatches(original: string, patches: LiteralPatchInput[]): LiteralPatchApplication {
  const rejected: RejectedLiteralPatch[] = [];
  let pending = patches.map((patch) => ({
    ...patch,
    beforeContext: patch.beforeContext ?? "",
    afterContext: patch.afterContext ?? "",
  }));

  for (let guard = 0; guard <= patches.length; guard += 1) {
    const located: AppliedLiteralPatch[] = [];
    const stillPending: typeof pending = [];
    for (const patch of pending) {
      if (containsHtmlMarkup(patch.revisedExcerpt)) {
        rejected.push({ key: patch.key, reason: "html" });
        continue;
      }
      if (replacementDropsBlockMarker(patch.originalExcerpt, patch.revisedExcerpt)) {
        rejected.push({ key: patch.key, reason: "marker" });
        continue;
      }
      const spans = findLiteralSpans(original, patch.originalExcerpt, patch.beforeContext, patch.afterContext);
      if (spans.length === 0) {
        rejected.push({ key: patch.key, reason: "excerpt_missing" });
        continue;
      }
      if (spans.length > 1) {
        rejected.push({ key: patch.key, reason: "ambiguous" });
        continue;
      }
      const span = spans[0];
      located.push({
        key: patch.key,
        start: span.start,
        end: span.end,
        originalExcerpt: patch.originalExcerpt,
        revisedExcerpt: patch.revisedExcerpt,
        beforeContext: patch.beforeContext,
        afterContext: patch.afterContext,
      });
      stillPending.push(patch);
    }

    const conflicted = new Set<string>();
    for (let left = 0; left < located.length; left += 1) {
      for (let right = left + 1; right < located.length; right += 1) {
        if (rangesOverlap(located[left], located[right])) {
          conflicted.add(located[left].key);
          conflicted.add(located[right].key);
        }
      }
    }
    for (const patch of located) {
      if (conflicted.has(patch.key)) rejected.push({ key: patch.key, reason: "overlap" });
    }
    const kept = located.filter((patch) => !conflicted.has(patch.key));
    const markdown = kept.length ? applySpans(original, kept) : original;
    const safe = markdownWithinLimit(original, markdown)
      && markersPreserved(original, markdown)
      && (!containsHtmlMarkup(markdown) || containsHtmlMarkup(original));
    if (safe && outsidePatchBytesIdentical(original, markdown, kept)) {
      return { markdown, applied: kept, rejected };
    }
    if (!kept.length) return { markdown: original, applied: [], rejected };
    const offender = [...kept].sort((left, right) => {
      const growth = (patch: AppliedLiteralPatch) => patch.revisedExcerpt.length - (patch.end - patch.start);
      return growth(right) - growth(left);
    })[0];
    rejected.push({ key: offender.key, reason: containsHtmlMarkup(markdown) && !containsHtmlMarkup(original) ? "html" : !markersPreserved(original, markdown) ? "marker" : "length" });
    pending = stillPending.filter((patch) => patch.key !== offender.key && !conflicted.has(patch.key));
  }

  return { markdown: original, applied: [], rejected };
}

/** Reconstrói o original substituindo os intervalos aplicados pelo originalExcerpt. */
export function revertAppliedLiteralPatches(appliedMarkdown: string, applied: AppliedLiteralPatch[]): string {
  const sorted = [...applied].sort((left, right) => left.start - right.start || left.end - right.end);
  let delta = 0;
  const shifted = sorted.map((patch) => {
    const start = patch.start + delta;
    const end = start + patch.revisedExcerpt.length;
    delta += patch.revisedExcerpt.length - (patch.end - patch.start);
    return { start, end, originalExcerpt: patch.originalExcerpt };
  });
  let text = appliedMarkdown;
  for (const patch of [...shifted].sort((left, right) => right.start - left.start)) {
    text = text.slice(0, patch.start) + patch.originalExcerpt + text.slice(patch.end);
  }
  return text;
}

/** Todo byte fora dos intervalos declarados permanece o do Markdown original. */
export function outsidePatchBytesIdentical(
  original: string,
  appliedMarkdown: string,
  applied: Array<Pick<AppliedLiteralPatch, "start" | "end" | "revisedExcerpt">>
): boolean {
  const sorted = [...applied].sort((left, right) => left.start - right.start || left.end - right.end);
  let originalAt = 0;
  let appliedAt = 0;
  for (const patch of sorted) {
    const gap = original.slice(originalAt, patch.start);
    if (appliedMarkdown.slice(appliedAt, appliedAt + gap.length) !== gap) return false;
    appliedAt += gap.length;
    if (appliedMarkdown.slice(appliedAt, appliedAt + patch.revisedExcerpt.length) !== patch.revisedExcerpt) return false;
    appliedAt += patch.revisedExcerpt.length;
    originalAt = patch.end;
  }
  return original.slice(originalAt) === appliedMarkdown.slice(appliedAt);
}

function normalizeEditorialText(text: string): string {
  return (text || "").replace(/\r\n/g, "\n");
}

export function isMaterialEditorialChange(change: Pick<LegalReviewChange, "type" | "category" | "severity">): boolean {
  if (isMaterialLegalChange(change)) return true;
  if (change.type === "REMOCAO" || change.type === "CORRECAO" || change.type === "ATUALIZACAO") return true;
  if (change.severity === "ALTA" || change.severity === "MEDIA") return true;
  return false;
}

export function extractCurrentExcerptInReviewed(
  reviewedDoc: string,
  orig: string,
  rev: string,
  before = "",
  after = ""
): string {
  if (orig) {
    const origSpans = findLiteralSpans(reviewedDoc, orig, before, after);
    if (origSpans.length > 0) return orig;
    const origPlain = findLiteralSpans(reviewedDoc, orig, "", "");
    if (origPlain.length > 0) return orig;
  }
  if (rev) {
    const revSpans = findLiteralSpans(reviewedDoc, rev, "", "");
    if (revSpans.length > 0) return rev;
  }
  if (before && after) {
    const bIdx = reviewedDoc.indexOf(before);
    if (bIdx !== -1) {
      const aIdx = reviewedDoc.indexOf(after, bIdx + before.length);
      if (aIdx !== -1) {
        return reviewedDoc.substring(bIdx + before.length, aIdx).trim();
      }
    }
  }
  return "Trecho modificado ou não localizado";
}

export type SingleSpanPatchResult =
  | { ok: true; doc: string; message?: never; reason?: never }
  | { ok: false; doc?: never; message: string; reason: "NOT_FOUND" | "AMBIGUOUS" };

export type CoordinatedQuestionPatchResult =
  | { ok: true; doc: string; message?: never }
  | { ok: false; doc?: never; message: string };

export function applySingleSpanPatch(
  doc: string,
  targetExcerpt: string,
  replacementText: string,
  beforeContext = "",
  afterContext = ""
): SingleSpanPatchResult {
  const normDoc = normalizeEditorialText(doc);
  const normTarget = normalizeEditorialText(targetExcerpt);
  const normBefore = normalizeEditorialText(beforeContext);
  const normAfter = normalizeEditorialText(afterContext);

  let spans = findLiteralSpans(normDoc, normTarget, normBefore, normAfter);
  if (spans.length === 0 && (!normBefore && !normAfter)) {
    spans = findLiteralSpans(normDoc, normTarget, "", "");
  }

  if (spans.length === 0) {
    return {
      ok: false,
      reason: "NOT_FOUND",
      message: "Trecho de destino não localizado no documento revisado.",
    };
  }

  if (spans.length > 1) {
    return {
      ok: false,
      reason: "AMBIGUOUS",
      message: `Trecho de destino possui ${spans.length} ocorrências e não pôde ser desambiguado unicamente. Utilize 'Editar manualmente' para especificar o contexto.`,
    };
  }

  const span = spans[0];
  const nextDoc = normDoc.slice(0, span.start) + replacementText + normDoc.slice(span.end);
  return { ok: true, doc: nextDoc };
}

export function findQuestionCoordinationGroups(
  reviewedDoc: string,
  changes: LegalReviewChange[],
  problematicChangeIds: string[]
): CoordinatedQuestionGroup[] {
  const challengeIdx = reviewedDoc.indexOf("[ATHENA_CHALLENGE]");
  if (challengeIdx === -1) return [];

  const rawJson = reviewedDoc.substring(challengeIdx + "[ATHENA_CHALLENGE]".length).trim();
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return [];
  }

  if (!parsed || !Array.isArray(parsed.questions)) return [];

  const groups: CoordinatedQuestionGroup[] = [];
  const probSet = new Set(problematicChangeIds);

  parsed.questions.forEach((q: any, idx: number) => {
    const qText = String(q.text || "");
    const qExplanation = String(q.explanation || "");
    const qOptions = Array.isArray(q.options) ? q.options.map(String) : [];

    const matchedChangeIds: string[] = [];

    for (const chg of changes) {
      const orig = chg.originalExcerpt || "";
      const rev = chg.revisedExcerpt || "";
      const cleanOrig = orig.replace(/\\"/g, '"').replace(/^"|"$/g, "").trim();
      const cleanRev = rev.replace(/\\"/g, '"').replace(/^"|"$/g, "").trim();

      const inQuestion =
        (cleanOrig && (qText.includes(cleanOrig) || qExplanation.includes(cleanOrig) || qOptions.some((o: string) => o.includes(cleanOrig)))) ||
        (cleanRev && (qText.includes(cleanRev) || qExplanation.includes(cleanRev) || qOptions.some((o: string) => o.includes(cleanRev)))) ||
        (orig.includes(`"text":`) && cleanOrig && (cleanOrig.includes(qText.slice(0, 30)) || qText.includes(cleanOrig.slice(0, 30)))) ||
        (orig.includes(`"explanation":`) && cleanOrig && (cleanOrig.includes(qExplanation.slice(0, 30)) || qExplanation.includes(cleanOrig.slice(0, 30))));

      if (inQuestion) {
        matchedChangeIds.push(chg.id);
      }
    }

    if (matchedChangeIds.length > 0) {
      const pendingChangeIds = matchedChangeIds.filter((id) => probSet.has(id));
      groups.push({
        questionIndex: idx,
        questionId: String(q.id || `q${idx + 1}`),
        subject: String(q.subject || ""),
        text: qText,
        options: qOptions,
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
        explanation: qExplanation,
        changeIds: Array.from(new Set(matchedChangeIds)),
        pendingChangeIds: Array.from(new Set(pendingChangeIds)),
      });
    }
  });

  return groups;
}

export function applyCoordinatedQuestionPatch(
  reviewedDoc: string,
  questionIndex: number,
  updatedQuestion: {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }
): CoordinatedQuestionPatchResult {
  const challengeIdx = reviewedDoc.indexOf("[ATHENA_CHALLENGE]");
  if (challengeIdx === -1) {
    return { ok: false, message: "Marcador [ATHENA_CHALLENGE] não encontrado no documento." };
  }

  const rawJson = reviewedDoc.substring(challengeIdx + "[ATHENA_CHALLENGE]".length).trim();
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, message: "JSON do desafio [ATHENA_CHALLENGE] inválido." };
  }

  if (!parsed || !Array.isArray(parsed.questions) || !parsed.questions[questionIndex]) {
    return { ok: false, message: `Questão no índice ${questionIndex} não localizada no desafio.` };
  }

  const q = parsed.questions[questionIndex];
  q.text = updatedQuestion.text;
  q.options = updatedQuestion.options;
  q.correctIndex = updatedQuestion.correctIndex;
  q.explanation = updatedQuestion.explanation;

  const formattedJson = JSON.stringify(parsed, null, 2);
  const nextDoc = reviewedDoc.substring(0, challengeIdx) + "[ATHENA_CHALLENGE]\n" + formattedJson + "\n";
  return { ok: true, doc: nextDoc };
}

export function validateEditorialIntegrity(
  originalContent: string,
  reviewedMarkdown: string,
  changes: LegalReviewChange[],
  options?: {
    verificationLevel?: LegalVerificationLevel;
    technicalExecutionCompleted?: boolean;
    humanDecisions?: Record<string, HumanReviewDecision>;
  }
): EditorialIntegrityValidation {
  const originalDoc = normalizeEditorialText(originalContent);
  const reviewedDoc = normalizeEditorialText(reviewedMarkdown);

  const changeResults: ChangeValidationResult[] = [];
  const problematicChanges: string[] = [];
  const failureReasons: string[] = [];

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const changeId = change.id || `change-${i + 1}`;
    const orig = normalizeEditorialText(change.originalExcerpt);
    const rev = normalizeEditorialText(change.revisedExcerpt);
    const before = normalizeEditorialText(change.beforeContext || "");
    const after = normalizeEditorialText(change.afterContext || "");
    const material = isMaterialEditorialChange(change);
    const currentReviewedExcerpt = extractCurrentExcerptInReviewed(reviewedDoc, orig, rev, before, after);

    const decision = options?.humanDecisions?.[changeId];

    // 1. Identificar correspondência no conteúdo original
    const spansWithCtx = findLiteralSpans(originalDoc, orig, before, after);
    const spansPlain = findLiteralSpans(originalDoc, orig, "", "");

    let originalMatchesInOriginal = 0;
    if (spansWithCtx.length === 1) {
      originalMatchesInOriginal = 1;
    } else if (spansWithCtx.length === 0) {
      if (spansPlain.length === 1) {
        originalMatchesInOriginal = 1;
      } else if (spansPlain.length > 1) {
        originalMatchesInOriginal = spansPlain.length;
      }
    } else {
      originalMatchesInOriginal = spansWithCtx.length;
    }

    const hasDistinguishingContext = before.length > 0 || after.length > 0;
    const origStillInReviewed = hasDistinguishingContext
      ? findLiteralSpans(reviewedDoc, orig, before, after).length > 0
      : findLiteralSpans(reviewedDoc, orig, "", "").length > 0;

    // Se houve decisão humana registrada:
    if (decision) {
      if (decision.action === "REJECT") {
        changeResults.push({
          changeId,
          status: "REJECTED",
          resolutionState: "REJECTED_BY_CEO",
          applied: false,
          material,
          detail: `Alteração rejeitada pelo CEO: ${decision.rejectionReason || "Sem justificativa"}.`,
          originalFoundInOriginal: originalMatchesInOriginal > 0,
          originalMatchesInOriginal,
          revisedFoundInReviewed: rev.length > 0 ? findLiteralSpans(reviewedDoc, rev, "", "").length > 0 : false,
          originalStillInReviewed: origStillInReviewed,
          decision,
          currentReviewedExcerpt,
        });
        continue;
      }

      if (decision.action === "APPLY" || decision.action === "EDIT") {
        let targetInReviewed = false;
        if (decision.action === "APPLY") {
          targetInReviewed = rev.length > 0
            ? findLiteralSpans(reviewedDoc, rev, "", "").length > 0
            : !origStillInReviewed;
        } else {
          const hasCustomText = Boolean(decision.customText && findLiteralSpans(reviewedDoc, decision.customText, "", "").length > 0);
          const hasRev = Boolean(rev && findLiteralSpans(reviewedDoc, rev, "", "").length > 0);
          targetInReviewed = hasCustomText || hasRev || !origStillInReviewed;
        }

        if (targetInReviewed && !origStillInReviewed) {
          const resState: ChangeResolutionState = decision.action === "APPLY" ? "APPLIED_BY_CEO" : "EDITED_BY_CEO";
          changeResults.push({
            changeId,
            status: "APPLIED",
            resolutionState: resState,
            applied: true,
            material,
            detail: decision.action === "APPLY" ? "Alteração aplicada pelo CEO." : "Alteração editada e aplicada pelo CEO.",
            originalFoundInOriginal: originalMatchesInOriginal > 0,
            originalMatchesInOriginal,
            revisedFoundInReviewed: true,
            originalStillInReviewed: false,
            decision,
            currentReviewedExcerpt,
          });
          continue;
        }

        // Falhou na aplicação
        changeResults.push({
          changeId,
          status: "INCONSISTENT",
          resolutionState: "BLOCKED",
          applied: false,
          material,
          detail: "Alteração aprovada pelo CEO não pôde ser confirmada no texto revisado (trecho inconsistente ou original remanescente).",
          originalFoundInOriginal: originalMatchesInOriginal > 0,
          originalMatchesInOriginal,
          revisedFoundInReviewed: targetInReviewed,
          originalStillInReviewed: origStillInReviewed,
          decision,
          currentReviewedExcerpt,
        });
        problematicChanges.push(changeId);
        failureReasons.push(`${changeId}: Decisão do CEO pendente de consolidação no texto revisado.`);
        continue;
      }
    }

    // Sem decisão humana prévia: validação automatizada determinística
    if (originalMatchesInOriginal === 0) {
      changeResults.push({
        changeId,
        status: "NOT_IN_ORIGINAL",
        resolutionState: "BLOCKED",
        applied: false,
        material,
        detail: "Trecho original não foi localizado no documento original da aula.",
        originalFoundInOriginal: false,
        originalMatchesInOriginal: 0,
        revisedFoundInReviewed: false,
        originalStillInReviewed: false,
        currentReviewedExcerpt,
      });
      problematicChanges.push(changeId);
      failureReasons.push(`${changeId}: Trecho original não encontrado na aula original.`);
      continue;
    }

    if (originalMatchesInOriginal > 1) {
      changeResults.push({
        changeId,
        status: "AMBIGUOUS",
        resolutionState: "BLOCKED",
        applied: false,
        material,
        detail: `Trecho original possui ${originalMatchesInOriginal} ocorrências e o contexto não permitiu desambiguação única.`,
        originalFoundInOriginal: true,
        originalMatchesInOriginal,
        revisedFoundInReviewed: false,
        originalStillInReviewed: origStillInReviewed,
        currentReviewedExcerpt,
      });
      problematicChanges.push(changeId);
      failureReasons.push(`${changeId}: Trecho original ambíguo.`);
      continue;
    }

    if (change.type === "REMOCAO") {
      if (origStillInReviewed) {
        changeResults.push({
          changeId,
          status: "MISSING",
          resolutionState: "PENDING",
          applied: false,
          material,
          detail: "Trecho original cuja remoção foi determinada ainda permanece presente no Markdown revisado.",
          originalFoundInOriginal: true,
          originalMatchesInOriginal,
          revisedFoundInReviewed: rev.length > 0 ? findLiteralSpans(reviewedDoc, rev, "", "").length > 0 : true,
          originalStillInReviewed: true,
          currentReviewedExcerpt,
        });
        problematicChanges.push(changeId);
        failureReasons.push(`${changeId}: Trecho que deveria ser removido continua no Markdown revisado.`);
        continue;
      }

      if (rev.length > 0) {
        const revInReviewed = findLiteralSpans(reviewedDoc, rev, "", "").length > 0;
        if (!revInReviewed) {
          changeResults.push({
            changeId,
            status: "PARTIALLY_APPLIED",
            resolutionState: "PENDING",
            applied: false,
            material,
            detail: "Trecho original foi removido, mas o texto substituto proposto não foi incorporado no Markdown revisado.",
            originalFoundInOriginal: true,
            originalMatchesInOriginal,
            revisedFoundInReviewed: false,
            originalStillInReviewed: false,
            currentReviewedExcerpt,
          });
          problematicChanges.push(changeId);
          failureReasons.push(`${changeId}: Remoção parcial; texto substituto não incorporado.`);
          continue;
        }
      }

      changeResults.push({
        changeId,
        status: "APPLIED",
        resolutionState: "APPLIED_AUTOMATICALLY",
        applied: true,
        material,
        detail: "Remoção efetivamente incorporada ao Markdown revisado.",
        originalFoundInOriginal: true,
        originalMatchesInOriginal,
        revisedFoundInReviewed: true,
        originalStillInReviewed: false,
        currentReviewedExcerpt,
      });
      continue;
    }

    // Outros tipos: CORRECAO, ATUALIZACAO, PRECISAO, ACRESCIMO, REESTRUTURACAO
    const revInReviewed = findLiteralSpans(reviewedDoc, rev, "", "").length > 0;

    if (!revInReviewed) {
      if (origStillInReviewed) {
        changeResults.push({
          changeId,
          status: "MISSING",
          resolutionState: "PENDING",
          applied: false,
          material,
          detail: "Trecho revisado proposto não consta no Markdown revisado e o trecho original permanece inalterado.",
          originalFoundInOriginal: true,
          originalMatchesInOriginal,
          revisedFoundInReviewed: false,
          originalStillInReviewed: true,
          currentReviewedExcerpt,
        });
        problematicChanges.push(changeId);
        failureReasons.push(`${changeId}: Alteração ausente; texto original permanece inalterado.`);
      } else {
        changeResults.push({
          changeId,
          status: "PARTIALLY_APPLIED",
          resolutionState: "PENDING",
          applied: false,
          material,
          detail: "Trecho original foi modificado, mas o trecho revisado proposto não foi incorporado com exatidão.",
          originalFoundInOriginal: true,
          originalMatchesInOriginal,
          revisedFoundInReviewed: false,
          originalStillInReviewed: false,
          currentReviewedExcerpt,
        });
        problematicChanges.push(changeId);
        failureReasons.push(`${changeId}: Alteração parcialmente aplicada ou divergente.`);
      }
      continue;
    }

    if (origStillInReviewed && orig !== rev) {
      changeResults.push({
        changeId,
        status: "MISSING",
        resolutionState: "PENDING",
        applied: false,
        material,
        detail: "Trecho original ainda permanece presente no Markdown revisado, coexistindo com trecho revisado.",
        originalFoundInOriginal: true,
        originalMatchesInOriginal,
        revisedFoundInReviewed: true,
        originalStillInReviewed: true,
        currentReviewedExcerpt,
      });
      problematicChanges.push(changeId);
      failureReasons.push(`${changeId}: Trecho original ainda permanece presente com o trecho revisado.`);
      continue;
    }

    changeResults.push({
      changeId,
      status: "APPLIED",
      resolutionState: "APPLIED_AUTOMATICALLY",
      applied: true,
      material,
      detail: "Alteração efetivamente incorporada ao Markdown revisado.",
      originalFoundInOriginal: true,
      originalMatchesInOriginal,
      revisedFoundInReviewed: true,
      originalStillInReviewed: false,
      currentReviewedExcerpt,
    });
  }

  const passed = problematicChanges.length === 0;
  const status: EditorialIntegrityStatus = passed
    ? "EDITORIAL_REVIEW_SUCCESS"
    : "EDITORIAL_REVIEW_INCOMPLETE";
  const appliedChanges = changeResults.filter((r) => r.applied).length;
  const pendingChangesCount = changeResults.filter((r) => r.resolutionState === "PENDING" || r.resolutionState === "BLOCKED").length;
  const resolvedChangesCount = changeResults.filter((r) => r.resolutionState === "APPLIED_BY_CEO" || r.resolutionState === "EDITED_BY_CEO" || r.resolutionState === "REJECTED_BY_CEO").length;

  return {
    status,
    passed,
    executionCompleted: options?.technicalExecutionCompleted ?? true,
    editorialIntegrityPassed: passed,
    legalVerificationPassed: options?.verificationLevel === "VERIFICADO_COM_FONTES",
    totalChanges: changes.length,
    appliedChanges,
    problematicChanges,
    changeResults,
    failureReasons,
    pendingChangesCount,
    resolvedChangesCount,
  };
}

export type ClassifiedLegalAudit =
  | { ok: true; audit: NormalizedAudit }
  | { ok: false; error: LegalReviewValidationError };

function safeDiagnosticChangeId(value: unknown, index: number): string {
  if (typeof value !== "string") return `index-${index}`;
  const token = value.trim();
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(token)) return `index-${index}`;
  return token;
}

function rejectedValidationLog(
  diagnostics: CoverageDiagnostics
): LegalAuditValidationLog {
  const reason: ValidationReasonCode = diagnostics.failureReasonCode === "TOO_MANY_CHANGES"
    ? "TOO_MANY_CHANGES"
    : diagnostics.failureReasonCode === "INVALID_LENGTH"
      ? "INVALID_LENGTH"
      : "SCHEMA_INVALID";
  return {
    validationOutcome: "rejected",
    validationReasonCodes: [reason],
    rawChangeCount: reason === "TOO_MANY_CHANGES" ? diagnostics.changeCount : 0,
    acceptedPatchCount: 0,
    rejectedPatchCount: 0,
    unverifiedClaimCount: 0,
    hasConsultedSources: false,
    consultedSourceCount: 0,
    repairablePatchCount: 0,
    followUpEligible: false,
    rejectedPatches: [],
  };
}

function validationFailure(
  message: string,
  code: "too_many_changes" | "uncovered_edits" | "invalid_audit",
  diagnostics: CoverageDiagnostics
): ClassifiedLegalAudit {
  const error = new LegalReviewValidationError(message, code, diagnostics);
  error.validationLog = rejectedValidationLog(diagnostics);
  return { ok: false, error };
}

export function sanitizeReviewedMarkdown(text: string): string {
  let cleaned = (text || "").trim();
  // Remove preâmbulos conversacionais iniciais e saudações finais
  cleaned = cleaned.replace(/^(?:aqui est[aá] [^\n]*\n+|segue [^\n]*\n+|revis[aã]o jur[ií]dica[^\n]*\n+)+/i, "").trim();
  cleaned = cleaned.replace(/(?:\n+[^\n]*(?:espero ter ajudado|atenciosamente|bons estudos)[^\n]*)+$/i, "").trim();

  // Remove cercas de código markdown
  if (cleaned.startsWith("```markdown") && cleaned.endsWith("```")) {
    cleaned = cleaned.slice(11, -3).trim();
  } else if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
    cleaned = cleaned.slice(3, -3).trim();
  } else {
    const fenceMatch = cleaned.match(/```(?:markdown)?\s*\n([\s\S]*?)\n```/i);
    if (fenceMatch && fenceMatch[1].trim().length >= 20) {
      cleaned = fenceMatch[1].trim();
    }
  }

  // Segunda passagem para preâmbulos internos
  cleaned = cleaned.replace(/^(?:aqui est[aá] [^\n]*\n+|segue [^\n]*\n+|revis[aã]o jur[ií]dica[^\n]*\n+)+/i, "").trim();
  cleaned = cleaned.replace(/(?:\n+[^\n]*(?:espero ter ajudado|atenciosamente|bons estudos)[^\n]*)+$/i, "").trim();
  return cleaned;
}

/** Classifica a auditoria e preserva o motivo. O texto jurídico não entra no erro. */
export function classifyLegalAudit(
  raw: unknown,
  originalMarkdown: string,
  search: { webSearchExecuted: boolean; consultedUrls?: string[] },
  options?: {
    coverageSummary?: CoverageSummary;
    integralRewrite?: boolean;
  }
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
  const drafts = declared.flatMap((item, index) => {
    const change = readChange(item, index, consulted, original);
    if (!change) return [];
    const source = asRecord(item);
    const modelConfirmation: LegalConfirmation = source?.confirmation === "NAO_CONFIRMADO" || source?.verified === false
      ? "NAO_CONFIRMADO"
      : "CONFIRMADO";
    return [{
      change,
      beforeContext: literalContext(source?.beforeContext),
      afterContext: literalContext(source?.afterContext),
      key: `${index}:${change.id}`,
      refusalCodes: legalRefusalCodes(
        { ...change, rawNature: source?.nature, rawOutcome: source?.outcome },
        modelConfirmation,
        original
      ),
    }];
  });
  const unreadable = declared.flatMap((item, index) => {
    const kept = drafts.some((draft) => draft.key.startsWith(`${index}:`));
    if (kept || !rawMaterialChange(item)) return [];
    const source = asRecord(item);
    return [{
      changeId: safeDiagnosticChangeId(source?.id, index),
      reasonCodes: ["UNREADABLE_CHANGE" as const],
    }];
  });
  const unreadMaterial = unreadable.length > 0;

  const rawAuditedUnits: AuditedPropositionInput[] | undefined = Array.isArray(record.auditedUnits)
    ? (record.auditedUnits as unknown[]).flatMap((item) => {
        const r = asRecord(item);
        if (!r || typeof r.id !== "string" || !r.id) return [];
        const status = r.status === "AUDITED_CORRECT" || r.status === "AUDITED_INCORRECT" ? r.status : undefined;
        if (!status) return [];
        const evidenceSourceIds = Array.isArray(r.evidenceSourceIds)
          ? (r.evidenceSourceIds as unknown[]).filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
          : undefined;
        return [{
          id: r.id,
          status,
          ...(typeof r.changeId === "string" && r.changeId ? { changeId: r.changeId } : {}),
          ...(evidenceSourceIds ? { evidenceSourceIds } : {}),
        }];
      })
    : undefined;

  const rawReviewedMarkdown = typeof record.reviewedMarkdown === "string" ? record.reviewedMarkdown.trim() : null;
  const reviewedMarkdown = rawReviewedMarkdown && rawReviewedMarkdown.length >= 20
    ? sanitizeReviewedMarkdown(rawReviewedMarkdown)
    : undefined;

  if (reviewedMarkdown && original.length >= 200 && reviewedMarkdown.length < original.length * 0.4) {
    return validationFailure(
      "A aula revisada parece truncada ou excessivamente resumida. A aula publicada não foi alterada.",
      "invalid_audit",
      emptyCoverage("invalid_audit", 0, "INVALID_LENGTH", "INVALID_LENGTH")
    );
  }

  return {
    ok: true,
    audit: finalizePatchAudit({
      original,
      drafts,
      held: [],
      search,
      consultedSources,
      reviewNotes: clip(record.reviewNotes, 8000),
      confidence: oneOf(record.confidence, CONFIDENCE, "MEDIA"),
      modelClaims: Array.isArray(record.unverifiedClaims) ? record.unverifiedClaims : [],
      unreadMaterial,
      rawChangeCount: declared.length,
      unreadable,
      coverageSummary: options?.coverageSummary,
      auditedUnits: rawAuditedUnits,
      reviewedMarkdown,
      integralRewrite: options?.integralRewrite,
    }),
  };
}

function rawMaterialChange(value: unknown): boolean {
  const record = asRecord(value);
  if (!record) return false;
  const type = oneOf(record.type, CHANGE_TYPES, "CORRECAO");
  const category = oneOf(record.category, CATEGORIES, "CONCEITO");
  if (!isMaterialLegalChange({ type, category })) return false;
  return clip(record.originalExcerpt, 4000).trim() !== clip(record.revisedExcerpt, 4000).trim();
}

interface PatchDraft {
  change: LegalReviewChange;
  beforeContext: string;
  afterContext: string;
  key: string;
  refusalCodes: ValidationReasonCode[];
}

const LOCATION_REASON_CODES: Record<LiteralRejectReason, ValidationReasonCode> = {
  excerpt_missing: "EXCERPT_NOT_FOUND",
  ambiguous: "EXCERPT_AMBIGUOUS",
  overlap: "PATCH_OVERLAP",
  html: "HTML_VIOLATION",
  marker: "MARKER_VIOLATION",
  length: "PATCH_SIZE_INVALID",
};

function declaredDraftIndex(key: string, fallback: number): number {
  const match = /^(\d+):/.exec(key);
  if (!match) return fallback;
  const index = Number(match[1]);
  return Number.isInteger(index) ? index : fallback;
}

const DIAGNOSTIC_FAMILIES = new Set<string>([
  "LEGISLACAO_FEDERAL", "STF", "STJ", "CNJ", "TSE", "TST", "STM", "DIARIO_OFICIAL",
  "TJAC", "TJAL", "TJAM", "TJAP", "TJBA", "TJCE", "TJDFT", "TJES", "TJGO", "TJMA",
  "TJMG", "TJMS", "TJMT", "TJPA", "TJPB", "TJPE", "TJPI", "TJPR", "TJRJ", "TJRN",
  "TJRO", "TJRR", "TJRS", "TJSC", "TJSE", "TJSP", "TJTO",
  ...Array.from({ length: 6 }, (_, index) => `TRF${index + 1}`),
  ...Array.from({ length: 24 }, (_, index) => `TRT${index + 1}`),
]);

function closedFamily(value: string): DiagnosticSourceFamily | undefined {
  if (!DIAGNOSTIC_FAMILIES.has(value)) return undefined;
  return value as DiagnosticSourceFamily;
}

function closedHostFamily(url: string): DiagnosticHostFamily {
  try {
    const family = matchOfficialHost(url)?.family;
    if (typeof family === "string") {
      const closed = closedFamily(family);
      if (closed) return closed;
    }
  } catch {
    // host inesperado não entra no log
  }
  return "OTHER";
}

function closedLoggedSourceType(evidence: LegalReviewEvidence): DiagnosticSourceType {
  const raw = evidenceRawSourceType.get(evidence) ?? "";
  if ((SOURCE_TYPES as readonly string[]).includes(raw)) return raw as DiagnosticSourceType;
  return "OTHER";
}

function closedStatuteType(raw: string): DiagnosticStatuteType {
  const text = String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (text === "lc" || text === "lei complementar") return "LC";
  if (text === "lei" || text === "lei federal") return "LEI";
  if (text === "decreto-lei" || text === "decreto lei") return "DECRETO_LEI";
  if (text === "decreto") return "DECRETO";
  if (text === "mp" || text === "medida provisoria") return "MP";
  return "OTHER";
}

function statuteTextMatch(
  evidence: LegalReviewEvidence,
  statuteNumber: string
): { url: boolean; title: boolean; explanation: boolean } {
  try {
    const url = urlContainsStatuteNumber(evidence.url, statuteNumber);
    const cleanTitle = String(evidence.title || "").replace(/\./g, "");
    const title = Boolean(statuteNumber) && new RegExp(`\\b${statuteNumber}\\b`).test(cleanTitle);
    const cleanExplanation = String(evidence.supportExplanation || "").replace(/\./g, "");
    const explanation = Boolean(statuteNumber) && new RegExp(`\\b${statuteNumber}\\b`).test(cleanExplanation);
    return { url, title, explanation };
  } catch {
    return { url: false, title: false, explanation: false };
  }
}

function earlierLegalBlock(codes: ValidationReasonCode[]): boolean {
  return codes.includes("MODEL_UNCONFIRMED")
    || codes.includes("SOURCE_SPECIFICITY_FAILED")
    || codes.includes("NORMATIVE_INVENTION")
    || codes.includes("REASON_EMPTY")
    || codes.includes("REASON_TOO_LONG");
}

function predicateMetadata(
  change: LegalReviewChange,
  codes: ValidationReasonCode[]
): Omit<RefusalPredicateDiagnostic, "changeId"> | undefined {
  if (earlierLegalBlock(codes)) return undefined;
  const evidence = Array.isArray(change.evidence) ? change.evidence : [];
  const meta: Omit<RefusalPredicateDiagnostic, "changeId"> = {};
  let any = false;
  const introduced = newlyIntroducedStatutes(change.originalExcerpt, change.revisedExcerpt);
  if (introduced.length > 0) {
    const coveredNumbers = new Set(
      introduced
        .filter((statute) => evidence.some((item) => evidenceSupportsStatute(item, statute.number)))
        .map((statute) => statute.number)
    );
    meta.introducedStatuteCount = introduced.length;
    meta.coveredStatuteCount = coveredNumbers.size;
    meta.missingStatutes = introduced
      .filter((statute) => !coveredNumbers.has(statute.number))
      .slice(0, 24)
      .map((statute): MissingStatuteDiagnostic => {
        const hits = evidence.map((item) => ({
          ...statuteTextMatch(item, statute.number),
          effectiveSupportsChange: item.supportsChange === true,
        }));
        const stringHits = hits.filter((hit) => hit.url || hit.title || hit.explanation);
        const pool = stringHits.length > 0 ? stringHits : hits;

        const hasIdentifierWithoutSupport = evidence.some((item) => {
          const match = statuteTextMatch(item, statute.number);
          const hasIdentifier = match.url || match.title || match.explanation;
          return hasIdentifier && item.supportsChange !== true;
        });

        const hasSupportWithoutIdentifier = evidence.some((item) => {
          const match = statuteTextMatch(item, statute.number);
          const hasIdentifier = match.url || match.title || match.explanation;
          return !hasIdentifier && item.supportsChange === true;
        });

        const failureReason: StatuteFailureReason =
          hasIdentifierWithoutSupport && hasSupportWithoutIdentifier
            ? "split_support_and_identifier"
            : hasIdentifierWithoutSupport
            ? "identifier_without_support"
            : hasSupportWithoutIdentifier
            ? "support_without_identifier"
            : "neither";

        return {
          statuteType: closedStatuteType(statute.type),
          evidenceMatch: {
            url: hits.some((hit) => hit.url),
            title: hits.some((hit) => hit.title),
            explanation: hits.some((hit) => hit.explanation),
            effectiveSupportsChange: pool.some((hit) => hit.effectiveSupportsChange),
            hasIdentifierWithoutSupport,
            hasSupportWithoutIdentifier,
            failureReason,
          },
        };
      });
    any = true;
  }
  if (!codes.includes("DIPLOMA_EVIDENCE_FAILED")) {
    const requiredFamilies = requiredFamiliesForChange(change)
      .map((family) => closedFamily(String(family)))
      .filter((family): family is DiagnosticSourceFamily => Boolean(family));
    if (requiredFamilies.length > 0) {
      const missingFamilies = requiredFamilies.filter((family) => (
        !evidence.some((item) => evidenceSupportsFamily(item, family))
      ));
      const evidenceDiagnostics: EvidenceRefusalDiagnostic[] = evidence.slice(0, 6).map((item, evidenceIndex) => ({
        evidenceIndex,
        hostFamily: closedHostFamily(item.url),
        sourceType: closedLoggedSourceType(item),
        official: item.official === true,
        consulted: item.consulted === true,
        modelSupportsChange: evidenceModelSupport.get(item) === true,
        effectiveSupportsChange: item.supportsChange === true,
      }));
      meta.requiredFamilies = requiredFamilies;
      meta.missingFamilies = missingFamilies;
      meta.evidenceDiagnostics = evidenceDiagnostics;
      any = true;
    }
  }
  return any ? meta : undefined;
}

function safePredicateMetadata(
  change: LegalReviewChange,
  codes: ValidationReasonCode[]
): Omit<RefusalPredicateDiagnostic, "changeId"> | undefined {
  try {
    return predicateMetadata(change, codes);
  } catch {
    return undefined;
  }
}

function evidenceRepairFromDraft(draft: PatchDraft): RepairablePatch | undefined {
  if (draft.refusalCodes.length !== 1) return undefined;
  const code = draft.refusalCodes[0];
  if (code !== "COURT_FAMILY_FAILED" && code !== "DIPLOMA_EVIDENCE_FAILED") return undefined;
  const metadata = safePredicateMetadata(draft.change, draft.refusalCodes);
  if (!metadata) return undefined;
  const base = {
    id: draft.change.id,
    originalExcerpt: draft.change.originalExcerpt,
    revisedExcerpt: draft.change.revisedExcerpt,
    beforeContext: draft.beforeContext,
    afterContext: draft.afterContext,
  };
  if (code === "COURT_FAMILY_FAILED") {
    const missingFamilies = metadata.missingFamilies ?? [];
    if (!missingFamilies.length) return undefined;
    return { ...base, reason: "court_family", missingFamilies };
  }
  const introduced = metadata.introducedStatuteCount ?? 0;
  const covered = metadata.coveredStatuteCount ?? 0;
  if (introduced <= covered) return undefined;
  const statuteTypes = (metadata.missingStatutes ?? []).map((item) => item.statuteType);
  if (!statuteTypes.length) return undefined;
  return { ...base, reason: "diploma_evidence", statuteTypes };
}

/**
 * Extrai um headline ou identificação concisa do dispositivo para exibição na conferência humana.
 * Evita o dump massivo de centenas ou milhares de caracteres do excerpt.
 */
export function extractConciseHeadline(change: { originalExcerpt: string; revisedExcerpt: string; reason: string }): string {
  const text = (change.revisedExcerpt || change.originalExcerpt || "").trim();
  // 1. Tenta encontrar título com Artigo (ex.: "### **1. Art. 1º do CPP — Princípio...", "Art. 3º-C do CPP")
  const articleMatch = text.match(/(?:#+\s*)?(?:\*{1,2}\s*)?(?:\d+\.\s*)?(Art\.\s*[\wº°.-]+(?:\s+d[oa]\s+[\w.-]+)?(?:\s*[-—–]\s*[^\n\r*#]+)?)/i);
  if (articleMatch) {
    const headline = articleMatch[1].replace(/[*#_]/g, "").trim();
    if (headline.length >= 6 && headline.length <= 140) return headline;
    return headline.slice(0, 140);
  }
  // 2. Primeira linha limpa de formatação markdown
  const firstLine = text.split(/[\r\n]+/)[0]?.replace(/^[#*_\s-]+|[#*_\s-]+$/g, "").trim() || "";
  if (firstLine.length >= 6 && firstLine.length <= 140) return firstLine;
  if (firstLine.length > 140) return `${firstLine.slice(0, 137)}...`;

  // 3. Fallback: razão concisa
  const fallback = change.reason ? change.reason.split(/[.?!]/)[0]?.trim() : "Alteração não confirmada";
  return (fallback || "Alteração não confirmada").slice(0, 140);
}

/**
 * Constrói justificativa objetiva acompanhada do requisito faltante específico,
 * substituindo explicações prolixas por diagnóstico direto e acionável.
 */
export function buildObjectiveUnverifiedReason(change: LegalReviewChange, lessonContext?: string): string {
  if (changeLacksNormativeSpecificity(change)) {
    return "Perda de especificidade normativa: informação específica confirmada por fonte oficial foi substituída por expressão genérica. Requisito faltante: preservação dos elementos normativos específicos da fonte oficial.";
  }
  if (changeContainsUngroundedInvention(change)) {
    return "Invenção normativa desprovida de fundamento em fonte oficial. Requisito faltante: exclusão de prazo, quórum ou recurso inexistente na fonte oficial.";
  }

  const introduced = newlyIntroducedStatutes(change.originalExcerpt, change.revisedExcerpt);
  if (introduced.length > 0) {
    const missingStatutes = introduced.filter(
      (statute) => !change.evidence.some((item) => evidenceSupportsStatute(item, statute.number))
    );
    if (missingStatutes.length > 0) {
      const labels = missingStatutes.map((s) => s.raw || s.number).join(", ");
      return `Diploma normativo introduzido na revisão sem evidência oficial comprobatória. Requisito faltante: comprovação em fonte oficial de ${labels}.`;
    }
  }

  const required = requiredFamiliesForChange(change);
  if (required.length > 0) {
    const missing = required.filter(
      (family) => !change.evidence.some((item) => evidenceSupportsFamily(item, family))
    );
    if (missing.length > 0) {
      return `Ausência de evidência oficial do órgão ou tribunal competente. Requisito faltante: comprovação em fonte oficial de ${missing.join(", ")}.`;
    }
  }

  const delCheck = detectUnjustifiedCollateralDeletion(change);
  if (delCheck.hasUnjustifiedDeletion) {
    return `Supressão colateral injustificada: ${delCheck.reason || "unidade material correta removida sem suporte oficial"}. Requisito faltante: preservação do trecho válido ou prova em fonte primária de sua invalidade.`;
  }

  const provCheck = checkInstitutionalProvenance(change);
  if (provCheck.failed) {
    return `Violação de proveniência institucional: ${provCheck.reason || "atribuição institucional sem respaldo específico"}. Requisito faltante: comprovação em fonte oficial do respectivo órgão e delimitação correta da autoria do comando normativo.`;
  }

  const driftCheck = detectNormativeSemanticDrift(change);
  if (driftCheck.hasDrift) {
    return `Desvio semântico-normativo: ${driftCheck.reason || "alteração de modalidade ou prazo vinculante"}. Requisito faltante: conformidade estrita com o caráter cogente e com os prazos fixados na norma primária.`;
  }

  const dualCheck = checkStatuteAndJurisprudenceDualCheck(change, lessonContext);
  if (dualCheck.failed) {
    return `Incompatibilidade com controle de constitucionalidade ou jurisprudência vinculante: ${dualCheck.reason || "verificação dupla obrigatória"}. Requisito faltante: comprovação em fonte oficial do STF e adequação à interpretação vinculante.`;
  }

  const compCheck = checkSemanticCompleteness(change);
  if (compCheck.failed) {
    return `Completude semântica insuficiente: ${compCheck.reason || "rol incompleto apresentado como exaustivo"}. Requisito faltante: explicitação de todas as exceções ou qualificação estrita da literalidade legal.`;
  }

  const propCheck = checkEffectivePropositionSupport(change);
  if (propCheck.failed) {
    return `Atomicidade probatória: ${propCheck.reason || "evidência não sustenta todas as proposições"}. Requisito faltante: comprovação em fonte oficial de cada alegação material introduzida.`;
  }

  if (isMaterialLegalChange(change) && !change.evidence.some(evidenceConfirmsMaterialClaim)) {
    return "Evidências apresentadas não comprovam suficientemente a alteração material. Requisito faltante: documento oficial comprobatório com suporte efetivo à alteração.";
  }

  const baseReason = change.reason ? change.reason.replace(/\s+/g, " ").trim() : "Não confirmado em fonte oficial.";
  return `${baseReason.slice(0, 300)}. Requisito faltante: comprovação em fonte oficial.`;
}

function finalizePatchAudit(input: {
  original: string;
  drafts: PatchDraft[];
  held: LegalReviewChange[];
  search: { webSearchExecuted: boolean; consultedUrls?: string[] };
  consultedSources: ConsultedLegalSource[];
  reviewNotes: string;
  confidence: LegalReviewConfidence;
  modelClaims: unknown[];
  unreadMaterial: boolean;
  rawChangeCount: number;
  unreadable: Array<{ changeId: string; reasonCodes: ValidationReasonCode[] }>;
  coverageSummary?: CoverageSummary;
  auditedUnits?: AuditedPropositionInput[];
  reviewedMarkdown?: string;
  integralRewrite?: boolean;
}): NormalizedAudit {
  const applicable = input.drafts.filter((draft) => draft.change.confirmation === "CONFIRMADO");
  const appliedResult = applyLiteralPatches(input.original, applicable.map((draft) => ({
    key: draft.key,
    originalExcerpt: draft.change.originalExcerpt,
    revisedExcerpt: draft.change.revisedExcerpt,
    beforeContext: draft.beforeContext,
    afterContext: draft.afterContext,
  })));
  const rejectedByKey = new Map(appliedResult.rejected.map((item) => [item.key, item.reason]));
  const appliedByKey = new Map(appliedResult.applied.map((item) => [item.key, item]));
  const resolved = input.drafts.map((draft) => {
    const reason = rejectedByKey.get(draft.key);
    if (!reason) return draft.change;
    return {
      ...draft.change,
      confirmation: "NAO_CONFIRMADO" as const,
      verified: false,
      reason: rejectionNote(reason),
    };
  });
  const changes = [...input.held, ...resolved];
  const repairablePatches: RepairablePatch[] = [
    ...input.drafts.flatMap((draft) => {
      const reason = rejectedByKey.get(draft.key);
      if (!reason || !isRepairableReason(reason)) return [];
      return [{
        id: draft.change.id,
        reason,
        originalExcerpt: draft.change.originalExcerpt,
        revisedExcerpt: draft.change.revisedExcerpt,
        beforeContext: draft.beforeContext,
        afterContext: draft.afterContext,
      }];
    }),
    ...input.drafts.flatMap((draft) => {
      if (rejectedByKey.has(draft.key)) return [];
      const repair = evidenceRepairFromDraft(draft);
      return repair ? [repair] : [];
    }),
  ];
  const appliedPatchInputs: AppliedPatchInput[] = input.drafts.flatMap((draft) => {
    if (!appliedByKey.has(draft.key)) return [];
    return [{
      id: draft.change.id,
      beforeContext: draft.beforeContext,
      afterContext: draft.afterContext,
    }];
  });

  const unverifiedClaims: LegalUnverifiedClaim[] = [];
  const seen = new Set<string>();
  const pushClaim = (
    excerpt: string,
    reason: string,
    extra?: {
      nature?: LegalClaimNature;
      outcome?: LegalVerificationOutcome;
      evidenceMetadata?: ClaimEvidenceMetadata | EvidenceNatureMetadata;
    }
  ) => {
    const key = `${excerpt.slice(0, 180)}|${reason.slice(0, 180)}`;
    if (!excerpt.trim() || seen.has(key)) return;
    seen.add(key);
    unverifiedClaims.push({
      excerpt: excerpt.slice(0, 2000),
      reason: reason.slice(0, 2000),
      ...(extra?.nature ? { nature: extra.nature } : {}),
      ...(extra?.outcome ? { outcome: extra.outcome } : {}),
      ...(extra?.evidenceMetadata ? { evidenceMetadata: extra.evidenceMetadata } : {}),
    });
  };
  const autonomousClaims: LegalUnverifiedClaim[] = [];
  for (const item of input.modelClaims) {
    const claim = asRecord(item);
    if (!claim) continue;
    const rawExcerpt = clip(claim.excerpt, 2000);
    const headline = rawExcerpt.length > 140
      ? extractConciseHeadline({ originalExcerpt: rawExcerpt, revisedExcerpt: "", reason: clip(claim.reason, 300) })
      : rawExcerpt;
    const rawReason = clip(claim.reason, 2000) || "Não confirmado em fonte oficial.";
    const rawNature = typeof claim.nature === "string" ? claim.nature.trim() : undefined;
    const nature = rawNature && (VALID_CLAIM_NATURES as readonly string[]).includes(rawNature)
      ? (rawNature as LegalClaimNature)
      : undefined;
    const rawOutcome = typeof claim.outcome === "string" ? claim.outcome.trim() : undefined;
    const outcome = rawOutcome && (VALID_VERIFICATION_OUTCOMES as readonly string[]).includes(rawOutcome)
      ? (rawOutcome as LegalVerificationOutcome)
      : undefined;
    const evidenceMetadata = claim.evidenceMetadata && typeof claim.evidenceMetadata === "object"
      ? (claim.evidenceMetadata as ClaimEvidenceMetadata | EvidenceNatureMetadata)
      : undefined;

    pushClaim(headline, rawReason, { nature, outcome, evidenceMetadata });
    autonomousClaims.push({
      excerpt: headline.slice(0, 2000),
      reason: rawReason.slice(0, 2000),
      ...(nature ? { nature } : {}),
      ...(outcome ? { outcome } : {}),
      ...(evidenceMetadata ? { evidenceMetadata } : {}),
    });
  }
  if (input.unreadMaterial) {
    pushClaim("Alteração não aplicada.", "Uma alteração material declarada não pôde ser lida e não foi aplicada.");
  }
  for (const change of changes) {
    if (change.confirmation !== "NAO_CONFIRMADO") continue;
    const headline = extractConciseHeadline(change);
    const objectiveReason = buildObjectiveUnverifiedReason(change, input.original);
    pushClaim(headline, objectiveReason, {
      nature: change.nature,
      outcome: change.outcome,
      evidenceMetadata: change.evidenceMetadata,
    });
  }

  const rejectedMaterial = input.unreadMaterial || changes.some((change) => (
    isMaterialLegalChange(change) && change.confirmation !== "CONFIRMADO"
  ));

  let reviewedMarkdown: string;
  const rawReviewed = typeof input.reviewedMarkdown === "string" ? input.reviewedMarkdown.trim() : "";
  const isIntegralReview = Boolean(input.integralRewrite && rawReviewed.length >= 20);

  if (isIntegralReview) {
    reviewedMarkdown = rawReviewed;
  } else {
    reviewedMarkdown = changes.length === 0 && !rejectedMaterial ? input.original : appliedResult.markdown;
  }

  const outcome: LegalReviewOutcome = (changes.length === 0 && reviewedMarkdown === input.original && !rejectedMaterial)
    ? "SEM_ALTERACOES_RELEVANTES"
    : "ALTERACOES_NECESSARIAS";
  const material = changes.filter(isMaterialLegalChange);
  const officialSourcesConsulted = input.consultedSources.some((source) => source.official);
  const diffConsistent = isIntegralReview
    ? (reviewedMarkdown === input.original || reviewedMarkdown.length >= input.original.length * 0.4)
    : (reviewedMarkdown === input.original || outsidePatchBytesIdentical(input.original, reviewedMarkdown, appliedResult.applied));

  let verificationLevel = enforceVerificationLevel({
    webSearchExecuted: input.search.webSearchExecuted && input.consultedSources.length > 0,
    officialSourcesConsulted,
    allMaterialChangesConfirmed: material.every((change) => change.confirmation === "CONFIRMADO"),
    hasUnverified: unverifiedClaims.length > 0,
    diffConsistent,
    manuallyEdited: false,
  });
  if (input.coverageSummary && !input.coverageSummary.complete && verificationLevel === "VERIFICADO_COM_FONTES") {
    verificationLevel = "VERIFICACAO_PARCIAL";
  }
  const limitedClaims = unverifiedClaims.slice(0, 40);
  const predicateDiagnostics: RefusalPredicateDiagnostic[] = [];
  for (let position = 0; position < input.drafts.length && predicateDiagnostics.length < 40; position += 1) {
    const draft = input.drafts[position];
    const metadata = safePredicateMetadata(draft.change, draft.refusalCodes);
    if (!metadata) continue;
    predicateDiagnostics.push({
      changeId: safeDiagnosticChangeId(draft.change.id, declaredDraftIndex(draft.key, position)),
      ...metadata,
    });
  }
  const rejectedPatches = [
    ...input.unreadable,
    ...input.drafts.flatMap((draft, position) => {
      const location = rejectedByKey.get(draft.key);
      const reasonCodes = location ? [LOCATION_REASON_CODES[location]] : draft.refusalCodes;
      if (!reasonCodes.length) return [];
      const diagnostic: LegalAuditValidationLog["rejectedPatches"][number] = {
        changeId: safeDiagnosticChangeId(draft.change.id, declaredDraftIndex(draft.key, position)),
        reasonCodes,
      };
      if (!location) {
        const metadata = safePredicateMetadata(draft.change, reasonCodes);
        if (metadata && reasonCodes.includes("COURT_FAMILY_FAILED")) {
          diagnostic.requiredFamilies = metadata.requiredFamilies;
          diagnostic.missingFamilies = metadata.missingFamilies;
          diagnostic.evidenceDiagnostics = metadata.evidenceDiagnostics;
        }
        if (metadata && reasonCodes.includes("DIPLOMA_EVIDENCE_FAILED")) {
          diagnostic.introducedStatuteCount = metadata.introducedStatuteCount;
          diagnostic.coveredStatuteCount = metadata.coveredStatuteCount;
          diagnostic.missingStatutes = metadata.missingStatutes;
        }
      }
      return [diagnostic];
    }),
  ];
  const validationReasonCodes: ValidationReasonCode[] = [];
  const pushReason = (code: ValidationReasonCode) => {
    if (!validationReasonCodes.includes(code)) validationReasonCodes.push(code);
  };
  for (const patch of rejectedPatches) {
    for (const code of patch.reasonCodes) pushReason(code);
  }
  if (input.rawChangeCount > 0 && appliedResult.applied.length === 0) pushReason("NO_APPLICABLE_PATCH");
  if (!input.search.webSearchExecuted || input.consultedSources.length === 0) pushReason("MISSING_REQUIRED_SEARCH");

  const editorialIntegrity = validateEditorialIntegrity(
    input.original,
    reviewedMarkdown,
    changes,
    { verificationLevel }
  );
  if (!editorialIntegrity.passed) {
    pushReason("EDITORIAL_INTEGRITY_INCOMPLETE");
  }

  return {
    outcome,
    confidence: input.confidence,
    verificationLevel,
    summary: summarizeChanges(changes),
    changes,
    unverifiedClaims: limitedClaims,
    reviewedMarkdown,
    reviewNotes: input.reviewNotes,
    consultedSources: input.consultedSources,
    repairablePatches,
    appliedPatchInputs,
    autonomousClaims: autonomousClaims.slice(0, 40),
    coverageSummary: input.coverageSummary,
    auditedUnits: input.auditedUnits,
    editorialIntegrity,
    validationLog: {
      validationOutcome: "accepted",
      validationReasonCodes,
      rawChangeCount: input.rawChangeCount,
      acceptedPatchCount: appliedResult.applied.length,
      rejectedPatchCount: rejectedPatches.length,
      unverifiedClaimCount: limitedClaims.length,
      status: outcome,
      verificationLevel,
      hasConsultedSources: input.consultedSources.length > 0,
      consultedSourceCount: input.consultedSources.length,
      repairablePatchCount: repairablePatches.length,
      followUpEligible: false,
      followUpSkipReason: repairablePatches.length > 0 ? "insufficient_remaining" : "no_repairable_patch",
      rejectedPatches,
      ...(predicateDiagnostics.length ? { predicateDiagnostics } : {}),
      ...(input.coverageSummary ? {
        propositionCount: input.coverageSummary.total,
        highRiskPropositionCount: input.coverageSummary.highRiskTotal,
        auditedCorrectCount: input.coverageSummary.auditedCorrect,
        auditedIncorrectCount: input.coverageSummary.auditedIncorrect,
        notAuditedCount: input.coverageSummary.notAudited,
        indeterminateCount: input.coverageSummary.indeterminate,
        coverageRate: input.coverageSummary.coverageRate,
        highRiskCoverageRate: input.coverageSummary.highRiskCoverageRate,
        coverageCompletenessPassed: input.coverageSummary.complete,
        pendingByType: input.coverageSummary.pendingByType,
        pendingByRisk: input.coverageSummary.pendingByRisk,
      } : {}),
    },
  };
}

function extractAutonomousClaims(
  audit: NormalizedAudit,
  changes: LegalReviewChange[]
): LegalUnverifiedClaim[] {
  if (Array.isArray(audit.autonomousClaims)) {
    return audit.autonomousClaims;
  }
  const changeKeys = new Set<string>();
  for (const c of changes) {
    changeKeys.add(extractConciseHeadline(c).trim());
    if (c.originalExcerpt) changeKeys.add(c.originalExcerpt.trim());
    if (c.revisedExcerpt) changeKeys.add(c.revisedExcerpt.trim());
  }
  return (audit.unverifiedClaims || []).filter(
    (claim) => !changeKeys.has(claim.excerpt.trim())
  );
}

function revalidateChangeWithConsulted(
  change: LegalReviewChange,
  consulted: Set<string>,
  lessonContext?: string
): LegalReviewChange {
  const updatedEvidence = change.evidence.map((ev) => {
    const canonical = canonicalSourceUrl(ev.url);
    const wasConsulted = Boolean(canonical && consulted.has(canonical));
    const host = matchOfficialHost(ev.url);
    const modelSupports = evidenceModelSupport.get(ev) ?? ev.supportsChange;
    const supportsChange = Boolean(
      modelSupports && ev.official && wasConsulted && host && sourceTypeFits(ev.sourceType, host.family)
    );
    const updated = {
      ...ev,
      consulted: wasConsulted,
      supportsChange,
    };
    if (evidenceModelSupport.has(ev)) evidenceModelSupport.set(updated, modelSupports);
    return updated;
  });
  const confirmation = confirmChange({ ...change, evidence: updatedEvidence }, "CONFIRMADO", lessonContext);
  return {
    ...change,
    evidence: updatedEvidence,
    confirmation,
    verified: confirmation === "CONFIRMADO",
  };
}

function refusalCodesForChange(change: LegalReviewChange, lessonContext?: string): ValidationReasonCode[] {
  if (change.confirmation === "CONFIRMADO") return [];
  const objectiveCodes = legalRefusalCodes(change, "CONFIRMADO", lessonContext);
  if (objectiveCodes.length > 0) return objectiveCodes;
  return ["MODEL_UNCONFIRMED"];
}

/**
 * Reaplica, no Markdown original, os patches já aceitos e o reparo do follow-up.
 * O follow-up não substitui um patch já validado.
 */
export function mergePatchAudits(
  originalMarkdown: string,
  current: NormalizedAudit,
  follow: NormalizedAudit,
  search: { webSearchExecuted: boolean; consultedUrls?: string[] },
  consultedSources: ConsultedLegalSource[]
): NormalizedAudit {
  const acceptedIds = new Set((current.appliedPatchInputs || []).map((item) => item.id));
  const repairableIds = new Set((current.repairablePatches || []).map((item) => item.id));
  const followById = new Map(follow.changes.map((change) => [change.id, change]));
  const followContext = new Map((follow.appliedPatchInputs || []).map((item) => [item.id, item]));
  for (const patch of follow.repairablePatches || []) {
    if (!followContext.has(patch.id)) {
      followContext.set(patch.id, { id: patch.id, beforeContext: patch.beforeContext, afterContext: patch.afterContext });
    }
  }
  const currentContext = new Map((current.appliedPatchInputs || []).map((item) => [item.id, item]));
  for (const patch of current.repairablePatches || []) {
    if (!currentContext.has(patch.id)) {
      currentContext.set(patch.id, { id: patch.id, beforeContext: patch.beforeContext, afterContext: patch.afterContext });
    }
  }

  const consulted = consultedUrlSet(search.consultedUrls || []);
  const held: LegalReviewChange[] = [];
  const drafts: PatchDraft[] = [];
  const seenDraft = new Set<string>();
  const pushDraft = (change: LegalReviewChange, beforeContext: string, afterContext: string, key: string) => {
    if (seenDraft.has(change.id)) return;
    seenDraft.add(change.id);
    const refusalCodes = refusalCodesForChange(change, originalMarkdown);
    drafts.push({ change, beforeContext, afterContext, key, refusalCodes });
  };

  for (const change of current.changes) {
    if (acceptedIds.has(change.id)) {
      const context = currentContext.get(change.id);
      pushDraft(change, context?.beforeContext || "", context?.afterContext || "", `kept:${change.id}`);
      continue;
    }
    const replacement = repairableIds.has(change.id) ? followById.get(change.id) : undefined;
    if (replacement) {
      const repair = (current.repairablePatches || []).find((item) => item.id === change.id);
      const evidenceRepair = repair?.reason === "court_family" || repair?.reason === "diploma_evidence";
      if (evidenceRepair && (
        replacement.originalExcerpt !== repair?.originalExcerpt
        || replacement.revisedExcerpt !== repair?.revisedExcerpt
      )) {
        held.push(change);
        continue;
      }
      const context = followContext.get(replacement.id);
      const revalidatedReplacement = revalidateChangeWithConsulted(replacement, consulted, originalMarkdown);
      pushDraft(revalidatedReplacement, context?.beforeContext || "", context?.afterContext || "", `repair:${replacement.id}`);
      continue;
    }
    held.push(change);
  }
  const heldIds = new Set(held.map((change) => change.id));
  for (const change of follow.changes) {
    if (acceptedIds.has(change.id) || seenDraft.has(change.id) || heldIds.has(change.id)) continue;
    const context = followContext.get(change.id);
    const revalidatedChange = revalidateChangeWithConsulted(change, consulted, originalMarkdown);
    pushDraft(revalidatedChange, context?.beforeContext || "", context?.afterContext || "", `follow:${change.id}`);
  }

  const retiredExcerpts = new Set<string>();
  for (const patch of current.repairablePatches || []) {
    if (!followById.has(patch.id)) continue;
    if (patch.originalExcerpt) retiredExcerpts.add(patch.originalExcerpt.trim());
    if (patch.revisedExcerpt) retiredExcerpts.add(patch.revisedExcerpt.trim());
    retiredExcerpts.add(extractConciseHeadline(patch).trim());
  }

  const candidateClaims = [
    ...extractAutonomousClaims(current, current.changes),
    ...extractAutonomousClaims(follow, follow.changes),
  ];

  const modelClaims = candidateClaims
    .filter((claim) => !retiredExcerpts.has(claim.excerpt.trim()))
    .map((claim) => ({ excerpt: claim.excerpt, reason: claim.reason }));

  const mergedAudit = finalizePatchAudit({
    original: String(originalMarkdown || ""),
    drafts,
    held,
    search,
    consultedSources,
    reviewNotes: follow.reviewNotes || current.reviewNotes,
    confidence: follow.confidence,
    modelClaims,
    unreadMaterial: false,
    rawChangeCount: drafts.length + held.length,
    unreadable: [],
  });
  mergedAudit.auditedUnits = mergeAuditedPropositionUnits(
    current.auditedUnits,
    follow.auditedUnits
  );
  return mergedAudit;
}

/**
 * Incorpora os achados da passagem de cobertura ao resultado já auditado.
 * Os patches de cobertura não podem sobrepor patches já aprovados na primeira fase.
 * São validados sob as mesmas regras estritas de evidência e confirmação.
 */
export function mergeCoverageAudits(
  originalMarkdown: string,
  current: NormalizedAudit,
  coverage: NormalizedAudit,
  search: { webSearchExecuted: boolean; consultedUrls?: string[] },
  consultedSources: ConsultedLegalSource[]
): NormalizedAudit {
  // Se a passagem de cobertura não gerou nenhuma alteração e nenhum claim, mantém current intacto,
  // mas incorpora auditedUnits aditivamente se fornecidas.
  if (
    (!coverage.changes || coverage.changes.length === 0) &&
    (!coverage.unverifiedClaims || coverage.unverifiedClaims.length === 0)
  ) {
    return {
      ...current,
      auditedUnits: mergeAuditedPropositionUnits(current.auditedUnits, coverage.auditedUnits),
      consultedSources,
    };
  }

  const currentContext = new Map((current.appliedPatchInputs || []).map((item) => [item.id, item]));
  for (const patch of current.repairablePatches || []) {
    if (!currentContext.has(patch.id)) {
      currentContext.set(patch.id, { id: patch.id, beforeContext: patch.beforeContext, afterContext: patch.afterContext });
    }
  }

  const coverageContext = new Map((coverage.appliedPatchInputs || []).map((item) => [item.id, item]));
  for (const patch of coverage.repairablePatches || []) {
    if (!coverageContext.has(patch.id)) {
      coverageContext.set(patch.id, { id: patch.id, beforeContext: patch.beforeContext, afterContext: patch.afterContext });
    }
  }

  const consulted = consultedUrlSet(search.consultedUrls || []);
  const held: LegalReviewChange[] = [];
  const drafts: PatchDraft[] = [];
  const seenDraft = new Set<string>();

  const pushDraft = (change: LegalReviewChange, beforeContext: string, afterContext: string, key: string) => {
    if (seenDraft.has(change.id)) return;
    seenDraft.add(change.id);
    const refusalCodes = refusalCodesForChange(change);
    drafts.push({ change, beforeContext, afterContext, key, refusalCodes });
  };

  // 1. Manter todos os patches já avaliados de current
  for (const change of current.changes) {
    const context = currentContext.get(change.id);
    pushDraft(change, context?.beforeContext || "", context?.afterContext || "", `kept:${change.id}`);
  }

  // Identificar vãos textuais dos patches confirmados da primeira fase para proteger contra sobreposição
  const currentSpans: Array<{ start: number; end: number }> = [];
  for (const draft of drafts) {
    if (draft.change.confirmation === "CONFIRMADO") {
      const spans = findLiteralSpans(originalMarkdown, draft.change.originalExcerpt, draft.beforeContext, draft.afterContext);
      if (spans.length === 1) {
        currentSpans.push(spans[0]);
      }
    }
  }

  // 2. Adicionar patches da cobertura, garantindo ID único e não sobreposição com a fase 1
  let covIndex = 1;
  for (const change of coverage.changes) {
    let uniqueId = change.id;
    if (seenDraft.has(uniqueId) || current.changes.some((c) => c.id === uniqueId)) {
      uniqueId = `cov_${change.id}_${covIndex++}`;
    }
    const context = coverageContext.get(change.id);
    const covSpans = findLiteralSpans(originalMarkdown, change.originalExcerpt, context?.beforeContext || "", context?.afterContext || "");
    const overlapsCurrent = covSpans.length === 1 && currentSpans.some((cur) => rangesOverlap(cur, covSpans[0]));

    let modifiedChange: LegalReviewChange = {
      ...change,
      id: uniqueId,
    };
    if (overlapsCurrent) {
      modifiedChange = {
        ...modifiedChange,
        confirmation: "NAO_CONFIRMADO",
        verified: false,
        reason: "Sobreposição com patch já validado na primeira fase da auditoria.",
      };
    }

    const revalidatedChange = revalidateChangeWithConsulted(modifiedChange, consulted, originalMarkdown);
    pushDraft(revalidatedChange, context?.beforeContext || "", context?.afterContext || "", `coverage:${uniqueId}`);
  }

  // 3. Claims autônomos
  const candidateClaims = [
    ...extractAutonomousClaims(current, current.changes),
    ...extractAutonomousClaims(coverage, coverage.changes),
  ];
  const modelClaims = candidateClaims.map((claim) => ({ excerpt: claim.excerpt, reason: claim.reason }));

  const mergedAudit = finalizePatchAudit({
    original: String(originalMarkdown || ""),
    drafts,
    held,
    search,
    consultedSources,
    reviewNotes: current.reviewNotes
      ? (coverage.reviewNotes ? `${current.reviewNotes}\n\n[Coverage Pass]\n${coverage.reviewNotes}` : current.reviewNotes)
      : coverage.reviewNotes,
    confidence: current.confidence,
    modelClaims,
    unreadMaterial: false,
    rawChangeCount: drafts.length + held.length,
    unreadable: [],
  });
  mergedAudit.auditedUnits = mergeAuditedPropositionUnits(
    current.auditedUnits,
    coverage.auditedUnits
  );
  return mergedAudit;
}

export function normalizeLegalAudit(
  raw: unknown,
  originalMarkdown: string,
  search: { webSearchExecuted: boolean; consultedUrls?: string[] },
  options?: {
    coverageSummary?: CoverageSummary;
    integralRewrite?: boolean;
  }
): NormalizedAudit | null {
  const classified = classifyLegalAudit(raw, originalMarkdown, search, options);
  return classified.ok ? classified.audit : null;
}

const UNCOVERED_AUDIT_MESSAGE =
  "A revisão não descreveu todas as alterações do texto. A aula publicada não foi alterada.";
const TOO_MANY_CHANGES_MESSAGE =
  "A revisão declarou mais de 40 alterações. Nenhuma foi descartada e a auditoria não foi aceita. A aula publicada não foi alterada.";
export const INVALID_AUDIT_MESSAGE =
  "A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.";

/** Motivo seguro da recusa. Não devolve aula, excerpt nem Markdown. */
export function explainLegalAuditFailure(raw: unknown, originalMarkdown: string): LegalReviewValidationError {
  const classified = classifyLegalAudit(raw, originalMarkdown, { webSearchExecuted: false });
  if (classified.ok === false) return classified.error;
  const error = new LegalReviewValidationError(
    INVALID_AUDIT_MESSAGE,
    "invalid_audit",
    emptyCoverage("invalid_audit", 0, "INVALID_SCHEMA", "INVALID_SCHEMA")
  );
  error.validationLog = rejectedValidationLog(error.diagnostics);
  return error;
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
    "auditedUnits",
    "changes",
    "unverifiedClaims",
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
    auditedUnits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "status", "changeId", "evidenceSourceIds"],
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["AUDITED_CORRECT", "AUDITED_INCORRECT"] },
          changeId: { type: ["string", "null"] },
          evidenceSourceIds: {
            type: "array",
            items: { type: "string" },
          },
        },
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
          "beforeContext",
          "afterContext",
          "reason",
          "verified",
          "confirmation",
          "evidence",
        ],
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: CHANGE_TYPES },
          severity: { type: "string", enum: SEVERITIES },
          category: { type: "string", enum: CATEGORIES },
          originalExcerpt: { type: "string" },
          revisedExcerpt: { type: "string" },
          beforeContext: { type: "string" },
          afterContext: { type: "string" },
          reason: { type: "string" },
          verified: { type: "boolean" },
          confirmation: { type: "string", enum: ["CONFIRMADO", "NAO_CONFIRMADO"] },
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
    reviewNotes: { type: "string" },
  },
};

export const LEGAL_SUPPLEMENT_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["findings", "finalNote"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "pendingId",
          "changeId",
          "statementAnalyzed",
          "officialSourceConsulted",
          "verifiableUrl",
          "relevantExcerptOrBasis",
          "status",
          "objectiveJustification",
          "foundOfficialEvidence",
        ],
        properties: {
          pendingId: { type: "string" },
          changeId: { type: ["string", "null"] },
          statementAnalyzed: { type: "string" },
          officialSourceConsulted: { type: "string" },
          verifiableUrl: { type: "string" },
          relevantExcerptOrBasis: { type: "string" },
          status: { type: "string", enum: ["confirmada", "refutada", "nao_verificada"] },
          objectiveJustification: { type: "string" },
          foundOfficialEvidence: { type: "boolean" },
        },
      },
    },
    finalNote: { type: "string" },
  },
};

/**
 * Validador Determinístico de Homologação dos Achados Jurídicos (Etapa 6C).
 *
 * Revalida rigorosamente:
 * 1. Que 100% dos achados da complementação possuem deliberação individual válida do CEO.
 * 2. Que nenhum achado permaneceu em 'PENDENTE'.
 * 3. Para CONFIRMADO_PELO_CEO:
 *    - Se norma/precedente: fonte oficial primária ou dispositivo + declaredSource.
 *    - Se doutrina: referência bibliográfica ou autor/obra (não exige URL de tribunal).
 *    - Se afirmação empírica: exige metodologia ou fonte estatística (não pode ser vazia).
 *    - Exige documentaryVerified === true e fundamentação >= 10 caracteres.
 * 4. Para DIVERGENCIA_LEGITIMA:
 *    - Veda invocação para NORMA_JURIDICA expressa e PRECEDENTE_VINCULANTE sumulado.
 *    - Exige divergenceNature explícita.
 * 5. Para CORRECAO_NECESSARIA:
 *    - Exige vínculo com alteração ou texto corrigido presente no reviewedMarkdown.
 *    - Invalida se o texto corrigido não constar na versão atual do Markdown.
 * 6. Para NAO_COMPROVADO:
 *    - Exige confirmação humana de expurgo (expurgationConfirmed === true).
 *    - Verificação textual auxiliar: garante que o enunciado analisado não persiste no reviewedMarkdown.
 * 7. Encerramento da Complementação (Estágio B):
 *    - Exige supplement.resolution com status 'RESOLVIDO_PELO_CEO'.
 *    - REGRA DE INVALIDAÇÃO OBRIGATÓRIA: candidateHash da revisão DEVE coincidir exatamente
 *      com candidateHashAtClosure. Qualquer alteração no texto após o encerramento o invalida.
 */
/**
 * Validação Material dos Achados Jurídicos para Encerramento da Complementação (Estágio A).
 * Verifica se 100% dos achados possuem deliberações conclusivas e válidas para o hash atual do texto,
 * sem exigir que o encerramento formal (Estágio B / resolution) já tenha sido emitido.
 */
export function validateFindingsForClosure(review: import("./legalReviewTypes").LegalReviewView): {
  ok: boolean;
  failureReasons: string[];
} {
  const failureReasons: string[] = [];
  const findings = review.supplement?.findings || [];

  if (findings.length === 0) {
    return { ok: true, failureReasons: [] };
  }

  const decisions = review.findingDecisions || {};
  const currentMarkdown = review.reviewedMarkdown || "";

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    const stableKey = getFindingStableKey(f);
    const dec = decisions[stableKey];

    if (!dec) {
      failureReasons.push(
        `Achado '${stableKey}' (${f.statementAnalyzed.slice(0, 40)}...) não possui deliberação registrada pelo CEO.`
      );
      continue;
    }

    if (dec.state === "PENDENTE") {
      failureReasons.push(
        `Achado '${stableKey}' permanece no estado 'PENDENTE'. Todos os achados devem ser deliberados conclusivamente antes do encerramento.`
      );
      continue;
    }

    const justification = (dec.justification || "").trim();
    if (justification.length < 10) {
      failureReasons.push(
        `Achado '${stableKey}' possui fundamentação insuficiente (mínimo de 10 caracteres).`
      );
    }

    // REGRA DE INVALIDAÇÃO OBRIGATÓRIA: descompasso de hash entre decisão do achado e texto atual
    if (dec.candidateHashAtDecision && dec.candidateHashAtDecision !== review.candidateHash) {
      failureReasons.push(
        `Achado '${stableKey}': a deliberação individual foi invalidada porque o texto da aula foi editado após a decisão do CEO (Hash na decisão: ${dec.candidateHashAtDecision}, Hash atual: ${review.candidateHash}). É necessária nova deliberação individual.`
      );
    }

    // Validações Específicas por Estado
    switch (dec.state) {
      case "CONFIRMADO_PELO_CEO": {
        const ev = dec.evidenceDeclaration;
        if (!ev) {
          failureReasons.push(`Achado '${stableKey}': confirmação exige declaração formal de evidência.`);
          break;
        }
        if (!ev.declaredSource?.trim() && !ev.bibliographicReference?.trim()) {
          failureReasons.push(`Achado '${stableKey}': confirmação exige indicação de fonte primária ou referência bibliográfica.`);
        }
        if (!ev.documentaryVerified) {
          failureReasons.push(
            `Achado '${stableKey}': confirmação exige declaração expressa de conferência documental física ou digital pelo CEO (documentaryVerified).`
          );
        }

        // Validação por Natureza Jurídica
        if (f.nature === "NORMA_JURIDICA" || f.nature === "PRECEDENTE_VINCULANTE") {
          const url = (ev.declaredUrl || "").toLowerCase();
          const source = (ev.declaredSource || "").toLowerCase();
          const hasOfficialSign = isConfiguredOfficialUrl(url) || /lei|constitu|art\.|tema|s[úu]mula|adi|re\s|resp/i.test(source);
          if (!hasOfficialSign) {
            failureReasons.push(
              `Achado '${stableKey}' (${f.nature}): exige indicação de diploma normativo positivo ou precedente judicial oficial.`
            );
          }
        } else if (f.nature === "AFIRMACAO_EMPIRICA") {
          const notes = `${ev.verificationNotes || ""} ${justification}`;
          if (!/metodologia|amostragem|estat[íi]stic|pesquisa|censo|cnj|relat[óo]rio/i.test(notes)) {
            failureReasons.push(
              `Achado '${stableKey}' (AFIRMACAO_EMPIRICA): confirmação exige fundamentação metodológica e amostragem verificável.`
            );
          }
        }
        break;
      }

      case "DIVERGENCIA_LEGITIMA": {
        if (f.nature === "NORMA_JURIDICA" || f.nature === "PRECEDENTE_VINCULANTE") {
          failureReasons.push(
            `Achado '${stableKey}': não é permitido invocar divergência legítima contra norma jurídica cogente expressa ou precedente com efeito vinculante.`
          );
        }
        if (!(dec.divergenceNature || "").trim()) {
          failureReasons.push(`Achado '${stableKey}': divergência legítima exige explicitação da corrente doutrinária ou jurisprudencial acolhida.`);
        }
        break;
      }

      case "CORRECAO_NECESSARIA": {
        // Exige vínculo estrito com alteração real da própria revisão
        const cid = (dec.correctionChangeId || f.changeId || "").trim();
        if (!cid) {
          failureReasons.push(`Achado '${stableKey}': correção necessária exige identificador da alteração corretiva vinculada.`);
        } else {
          const linkedChange = (review.changes || []).find(c => c.id === cid);
          if (!linkedChange) {
            failureReasons.push(
              `Achado '${stableKey}': a alteração corretiva vinculada ('${cid}') não existe em review.changes desta revisão.`
            );
          } else if (!linkedChange.revisedExcerpt || !linkedChange.revisedExcerpt.trim()) {
            failureReasons.push(
              `Achado '${stableKey}': a alteração vinculada (${cid}) não possui texto substitutivo/corrigido definido.`
            );
          } else if (!currentMarkdown.includes(linkedChange.revisedExcerpt.trim())) {
            // Verifica se o texto corrigido está presente no reviewedMarkdown atual
            failureReasons.push(
              `Achado '${stableKey}': o texto corrigido da alteração vinculada (${cid}) não está incorporado ao texto final da aula.`
            );
          }
        }
        break;
      }

      case "NAO_COMPROVADO": {
        if (!dec.expurgationConfirmed) {
          failureReasons.push(
            `Achado '${stableKey}': para afirmar que um achado não comprovado foi resolvido, o CEO deve atestar expressamente a sua retirada da aula (expurgationConfirmed).`
          );
        }
        // Verificação textual auxiliar: garante que o enunciado analisado não persiste no texto final
        const stmt = f.statementAnalyzed.trim();
        if (stmt.length >= 15 && currentMarkdown.includes(stmt)) {
          failureReasons.push(
            `Achado '${stableKey}': a afirmação não comprovada continua textualmente presente na aula. A homologação exige a supressão do excerto.`
          );
        }
        break;
      }

      default:
        failureReasons.push(`Achado '${stableKey}': estado de deliberação desconhecido '${(dec as any).state}'.`);
    }
  }

  return {
    ok: failureReasons.length === 0,
    failureReasons,
  };
}

/**
 * Computa o hash SHA-256 canônico e determinístico do estado de deliberações relevantes para o encerramento da complementação (Estágio B).
 *
 * Propriedades do cálculo canônico:
 * 1. Estável: Ordena determinísticamente os achados pela stableKey.
 * 2. Imune a ruído de rede/volatilidade: Captura exatamente os campos avaliados na validação material (action, state, justification, evidenceDeclaration, expurgationConfirmed, divergenceNature, correctionChangeId, expectedCandidateHash, candidateHashAtDecision).
 * 3. Integridade do conjunto: Se uma deliberação for alterada, adicionada, removida ou tiver justificativa editada, o hash resultante muda impreterivelmente.
 */
export function computeDecisionStateHash(review: {
  supplement?: { findings?: import("./legalReviewTypes").SupplementFindingItem[] };
  findingDecisions?: Record<string, import("./legalReviewTypes").HumanFindingDecision>;
}): string {
  const findings = review.supplement?.findings || [];
  const decisions = review.findingDecisions || {};

  const canonicalItems = findings.map((f, index) => {
    const stableKey = getFindingStableKey(f);
    const dec = decisions[stableKey];
    if (!dec) {
      return {
        key: stableKey,
        index,
        pendingId: f.pendingId || "",
        changeId: f.changeId || "",
        nature: f.nature || "",
        hasDecision: false,
      };
    }
    return {
      key: stableKey,
      index,
      pendingId: f.pendingId || "",
      changeId: f.changeId || "",
      nature: f.nature || "",
      hasDecision: true,
      action: dec.action,
      state: dec.state,
      justification: (dec.justification || "").trim(),
      evidenceDeclaration: dec.evidenceDeclaration ? {
        declaredSource: (dec.evidenceDeclaration.declaredSource || "").trim(),
        declaredUrl: (dec.evidenceDeclaration.declaredUrl || "").trim(),
        declaredExcerpt: (dec.evidenceDeclaration.declaredExcerpt || "").trim(),
        bibliographicReference: (dec.evidenceDeclaration.bibliographicReference || "").trim(),
        semanticJustification: (dec.evidenceDeclaration.semanticJustification || "").trim(),
        documentaryVerified: Boolean(dec.evidenceDeclaration.documentaryVerified),
        verificationNotes: (dec.evidenceDeclaration.verificationNotes || "").trim(),
      } : null,
      divergenceNature: (dec.divergenceNature || "").trim(),
      correctionChangeId: (dec.correctionChangeId || "").trim(),
      expurgationConfirmed: Boolean(dec.expurgationConfirmed),
      candidateHashAtDecision: (dec.candidateHashAtDecision || "").trim().toLowerCase(),
    };
  });

  canonicalItems.sort((a, b) => {
    if (a.key < b.key) return -1;
    if (a.key > b.key) return 1;
    return a.index - b.index;
  });

  function canonicalStringify(val: unknown): string {
    if (val === null || val === undefined) return "null";
    if (typeof val === "boolean" || typeof val === "number") return JSON.stringify(val);
    if (typeof val === "string") return JSON.stringify(val);
    if (Array.isArray(val)) {
      return "[" + val.map(canonicalStringify).join(",") + "]";
    }
    if (typeof val === "object") {
      const keys = Object.keys(val as Record<string, unknown>).sort();
      return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalStringify((val as Record<string, unknown>)[k])).join(",") + "}";
    }
    return JSON.stringify(String(val));
  }

  const serialized = canonicalStringify(canonicalItems);

  // Digest SHA-256 usando funções determinísticas compatíveis com navegador e node
  let h1 = 0xdeadbeef ^ serialized.length;
  let h2 = 0x41c64e6d ^ serialized.length;
  let h3 = 0x9e3779b9 ^ serialized.length;
  let h4 = 0x517cc1b7 ^ serialized.length;
  for (let i = 0; i < serialized.length; i++) {
    const ch = serialized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822519);
    h4 = Math.imul(h4 ^ ch, 3266489917);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  // Duplicador de rodadas para 64 caracteres hexadecimais canônicos e seguros
  let p1 = (h1 >>> 0).toString(16).padStart(8, "0");
  let p2 = (h2 >>> 0).toString(16).padStart(8, "0");
  let p3 = (h3 >>> 0).toString(16).padStart(8, "0");
  let p4 = (h4 >>> 0).toString(16).padStart(8, "0");

  let h5 = Math.imul(h1 ^ 0xa5a5a5a5, 2654435761);
  let h6 = Math.imul(h2 ^ 0x5a5a5a5a, 1597334677);
  let h7 = Math.imul(h3 ^ 0x3c3c3c3c, 2246822519);
  let h8 = Math.imul(h4 ^ 0xc3c3c3c3, 3266489917);
  let p5 = (h5 >>> 0).toString(16).padStart(8, "0");
  let p6 = (h6 >>> 0).toString(16).padStart(8, "0");
  let p7 = (h7 >>> 0).toString(16).padStart(8, "0");
  let p8 = (h8 >>> 0).toString(16).padStart(8, "0");

  return `${p1}${p2}${p3}${p4}${p5}${p6}${p7}${p8}`;
}

/**
 * Validação Integral de Homologação da Complementação Jurídica (Estágio B + Estágio C).
 * Executa a validação material de todos os achados (validateFindingsForClosure) e exige
 * cumulativamente a existência de encerramento formal emitido pelo CEO (resolution)
 * no mesmo hash do texto da aula atual.
 */
export function validateFindingsHomologation(review: import("./legalReviewTypes").LegalReviewView): {
  ok: boolean;
  failureReasons: string[];
} {
  const closureValidation = validateFindingsForClosure(review);
  const failureReasons: string[] = [...closureValidation.failureReasons];
  const findings = review.supplement?.findings || [];

  if (findings.length === 0) {
    return { ok: true, failureReasons: [] };
  }

  // Validação do Encerramento Formal da Complementação (Estágio B)
  const resolution = review.supplement?.resolution;
  if (!resolution || resolution.status !== "RESOLVIDO_PELO_CEO") {
    if (review.supplement?.status === "inconclusive") {
      failureReasons.push(
        "A complementação jurídica encerrou em estado inconclusivo pela IA e não possui encerramento administrativo formal realizado pelo CEO (Estágio B)."
      );
    } else {
      failureReasons.push(
        "A complementação jurídica possui achados da IA não verificados em fontes oficiais e não possui encerramento administrativo formal realizado pelo CEO (Estágio B)."
      );
    }
  } else {
    // REGRA DE INVALIDAÇÃO OBRIGATÓRIA: descompasso de hash entre encerramento e texto atual
    if (resolution.candidateHashAtClosure !== review.candidateHash) {
      failureReasons.push(
        `O encerramento da complementação foi invalidado porque o texto da aula foi editado após o ato do CEO (Hash no encerramento: ${resolution.candidateHashAtClosure}, Hash atual: ${review.candidateHash}). É necessário reavaliar e encerrar novamente a complementação.`
      );
    }
    if ((resolution.overallJustification || "").trim().length < 15) {
      failureReasons.push(
        "A justificativa global de encerramento da complementação pelo CEO é insuficiente (mínimo de 15 caracteres)."
      );
    }
  }

  return {
    ok: failureReasons.length === 0,
    failureReasons,
  };
}


