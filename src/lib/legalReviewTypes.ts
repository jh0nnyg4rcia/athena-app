/** Tipos da auditoria jurídica. Sem chave, sem prompt e sem Firestore. */

export const LEGAL_REVIEW_CONFLICT_MESSAGE =
  "A aula foi modificada após o início desta revisão. Gere uma nova revisão ou compare as versões antes de publicar.";

export const LEGAL_REVIEW_ALREADY_MESSAGE = "Esta versão já foi revisada.";

export const MAX_REVIEWABLE_CHARS = 180_000;

export type LegalReviewRecordStatus =
  | "processing"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "failed";

export type LegalReviewOutcome = "ALTERACOES_NECESSARIAS" | "SEM_ALTERACOES_RELEVANTES";

export type LegalReviewConfidence = "ALTA" | "MEDIA" | "BAIXA";

export type LegalVerificationLevel =
  | "VERIFICADO_COM_FONTES"
  | "VERIFICACAO_PARCIAL"
  | "FALHA_NA_VERIFICACAO";

export type LegalChangeType =
  | "CORRECAO"
  | "ATUALIZACAO"
  | "ACRESCIMO"
  | "REMOCAO"
  | "PRECISAO"
  | "REESTRUTURACAO";

export type LegalChangeCategory =
  | "LEGISLACAO"
  | "JURISPRUDENCIA"
  | "SUMULA"
  | "DOUTRINA"
  | "CONCEITO"
  | "ATUALIZACAO"
  | "OMISSAO_RELEVANTE"
  | "DIDATICA";

export type LegalSeverity = "ALTA" | "MEDIA" | "BAIXA";

export type LegalConfirmation = "CONFIRMADO" | "NAO_CONFIRMADO";

export type LegalSourceType =
  | "LEI"
  | "CONSTITUICAO"
  | "DECRETO"
  | "RESOLUCAO"
  | "SUMULA"
  | "ACORDAO"
  | "REPERCUSSAO_GERAL"
  | "REPETITIVO"
  | "INFORMATIVO"
  | "ATO_NORMATIVO"
  | "OUTRO_OFICIAL";

export interface LegalReviewSource {
  title: string;
  url: string;
  official: boolean;
  institution: string;
}

/** Fonte devolvida pela ferramenta. Consultada não significa que comprova a alteração. */
export interface ConsultedLegalSource {
  url: string;
  official: boolean;
  institution: string;
}

export interface LegalReviewEvidence {
  institution: string;
  title: string;
  url: string;
  official: boolean;
  consulted: boolean;
  supportsChange: boolean;
  supportExplanation: string;
  sourceType: LegalSourceType;
}

export interface LegalSourceHistoryEntry {
  at: number;
  verificationLevel: LegalVerificationLevel;
  consultedSources: ConsultedLegalSource[];
  note: string;
}

export interface LegalReviewChange {
  id: string;
  type: LegalChangeType;
  severity: LegalSeverity;
  category: LegalChangeCategory;
  originalExcerpt: string;
  revisedExcerpt: string;
  reason: string;
  verified: boolean;
  confirmation: LegalConfirmation;
  sources: LegalReviewSource[];
  evidence: LegalReviewEvidence[];
}

export interface LegalUnverifiedClaim {
  excerpt: string;
  reason: string;
}

export interface LegalReviewSummary {
  totalChanges: number;
  corrections: number;
  additions: number;
  removals: number;
  updates: number;
  precisions: number;
  restructures: number;
}

export interface LegalReviewUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface LegalReviewView {
  id: string;
  lessonId: string;
  day: number;
  part: number;
  subject: string;
  topic: string;
  originalHash: string;
  originalApprovedAt: number | null;
  originalContent: string;
  reviewedMarkdown: string;
  changes: LegalReviewChange[];
  unverifiedClaims: LegalUnverifiedClaim[];
  summary: LegalReviewSummary;
  reviewNotes: string;
  verificationLevel: LegalVerificationLevel;
  confidence: LegalReviewConfidence;
  outcome: LegalReviewOutcome;
  status: LegalReviewRecordStatus;
  model: string;
  reviewDate: string;
  requestedByUid: string;
  requestedAt: number;
  approvedByUid?: string;
  approvedAt?: number;
  rejectedByUid?: string;
  rejectedAt?: number;
  webSearchUsed: boolean;
  usage?: LegalReviewUsage;
  consultedSources: ConsultedLegalSource[];
  manuallyEdited: boolean;
  manuallyEditedAt?: number;
  candidateHash: string;
  auditedCandidateHash: string;
  sourceHistory: LegalSourceHistoryEntry[];
}

export interface StoredCatalogLesson {
  id: string;
  day: number;
  part: number;
  subject: string;
  topic?: string;
  content: string;
  challenge?: unknown;
  status?: string;
  approvedBy?: string;
  approvedAt?: number;
  modelUsed?: string;
  version?: number;
  review?: string;
}

export interface LegalReviewIndex {
  lessonId: string;
  processingReviewId: string | null;
  processingStartedAt: number | null;
  approvedHash: string | null;
  approvedReviewId: string | null;
  approvedReviewDate: string | null;
  latestReviewId: string | null;
  latestStatus: string | null;
}

export function emptyReviewIndex(lessonId: string): LegalReviewIndex {
  return {
    lessonId,
    processingReviewId: null,
    processingStartedAt: null,
    approvedHash: null,
    approvedReviewId: null,
    approvedReviewDate: null,
    latestReviewId: null,
    latestStatus: null,
  };
}

export function legalReviewButtonVisible(isCeo: boolean, lessonSaved: boolean): boolean {
  return Boolean(isCeo && lessonSaved);
}

export function formatReviewDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(now);
  const day = parts.find((part) => part.type === "day")?.value || "01";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const year = parts.find((part) => part.type === "year") || { value: "2026" };
  return `${day}/${month}/${year.value}`;
}
