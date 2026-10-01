import type {
  LegalChangeCategory,
  LegalChangeType,
  LegalConfirmation,
  LegalReviewChange,
  LegalReviewConfidence,
  LegalReviewOutcome,
  LegalReviewSource,
  LegalReviewSummary,
  LegalSeverity,
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

const OFFICIAL_SUFFIXES = ["gov.br", "jus.br", "leg.br", "mil.br"];

export function isOfficialLegalUrl(raw: string): boolean {
  const href = safeHttpUrl(raw);
  if (!href) return false;
  try {
    const host = new URL(href).hostname.toLowerCase().replace(/\.$/, "");
    return OFFICIAL_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

export function safeHttpUrl(raw: string): string | null {
  try {
    const url = new URL(String(raw || "").trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
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

function readSource(value: unknown): LegalReviewSource | null {
  const record = asRecord(value);
  if (!record) return null;
  const url = safeHttpUrl(clip(record.url, 500));
  if (!url) return null;
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  return {
    title: clip(record.title, 300) || host || "Fonte",
    url,
    official: isOfficialLegalUrl(url),
    institution: clip(record.institution, 160) || host,
  };
}

function readChange(value: unknown, index: number): LegalReviewChange | null {
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
  const official = sources.some((source) => source.official);
  const category = oneOf(record.category, CATEGORIES, "CONCEITO");
  let confirmation: LegalConfirmation = record.confirmation === "NAO_CONFIRMADO" || record.verified === false
    ? "NAO_CONFIRMADO"
    : "CONFIRMADO";
  if (category !== "DIDATICA" && !official) confirmation = "NAO_CONFIRMADO";
  return {
    id: clip(record.id, 40) || `change-${index + 1}`,
    type,
    severity: oneOf(record.severity, SEVERITIES, "MEDIA"),
    category,
    originalExcerpt,
    revisedExcerpt,
    reason: clip(record.reason, 4000),
    verified: confirmation === "CONFIRMADO" && (category === "DIDATICA" || official),
    confirmation,
    sources,
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

export function enforceVerificationLevel(input: {
  modelLevel: LegalVerificationLevel;
  webSearchCompleted: boolean;
  hasOfficialSource: boolean;
  hasUnverified: boolean;
}): LegalVerificationLevel {
  if (!input.webSearchCompleted) return "FALHA_NA_VERIFICACAO";
  if (input.modelLevel === "FALHA_NA_VERIFICACAO") return "FALHA_NA_VERIFICACAO";
  if (!input.hasOfficialSource || input.hasUnverified || input.modelLevel === "VERIFICACAO_PARCIAL") {
    return "VERIFICACAO_PARCIAL";
  }
  return "VERIFICADO_COM_FONTES";
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
}

export function normalizeLegalAudit(
  raw: unknown,
  originalMarkdown: string,
  search: { webSearchCompleted: boolean }
): NormalizedAudit | null {
  const record = asRecord(raw);
  if (!record) return null;
  const original = String(originalMarkdown || "");
  if (original.trim().length < 20) return null;

  const changes = (Array.isArray(record.changes) ? record.changes : [])
    .slice(0, 40)
    .map((item, index) => readChange(item, index))
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

  const hasOfficialSource = changes.some((change) => change.sources.some((source) => source.official));
  const verificationLevel = enforceVerificationLevel({
    modelLevel: oneOf(record.verificationLevel, LEVELS, "VERIFICACAO_PARCIAL"),
    webSearchCompleted: search.webSearchCompleted,
    hasOfficialSource,
    hasUnverified: unverifiedClaims.length > 0,
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
  };
}

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
