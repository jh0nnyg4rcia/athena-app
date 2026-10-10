/**
 * Metadados da validação jurídica.
 * Só códigos e contagens. Excerpt, Markdown, prompt e resposta bruta não entram aqui.
 */

export const VALIDATION_REASON_CODES = [
  "RESPONSE_ERROR",
  "RESPONSE_INCOMPLETE",
  "RESPONSE_FAILED",
  "EMPTY_OUTPUT",
  "JSON_PARSE_FAILED",
  "SCHEMA_INVALID",
  "INVALID_LENGTH",
  "TOO_MANY_CHANGES",
  "EXCERPT_NOT_FOUND",
  "EXCERPT_AMBIGUOUS",
  "PATCH_OVERLAP",
  "HTML_VIOLATION",
  "MARKER_VIOLATION",
  "PATCH_SIZE_INVALID",
  "EVIDENCE_INSUFFICIENT",
  "SOURCE_SPECIFICITY_FAILED",
  "COURT_FAMILY_FAILED",
  "DIPLOMA_EVIDENCE_FAILED",
  "NORMATIVE_INVENTION",
  "MODEL_UNCONFIRMED",
  "UNREADABLE_CHANGE",
  "MISSING_REQUIRED_SEARCH",
  "NO_APPLICABLE_PATCH",
  "COLLATERAL_DELETION_FAILED",
  "DUAL_CHECK_FAILED",
  "INCOMPLETE_ENUMERATION_FAILED",
  "UNSUPPORTED_PROPOSITION_FAILED",
  "INSTITUTIONAL_PROVENANCE_FAILED",
  "NORMATIVE_DRIFT_FAILED",
  "REASON_EMPTY",
  "REASON_TOO_LONG",
  "EDITORIAL_INTEGRITY_INCOMPLETE",
  "TAXONOMY_VALIDATION_FAILED",
] as const;

export type ValidationReasonCode = (typeof VALIDATION_REASON_CODES)[number];

export type ValidationOutcome = "accepted" | "rejected";
export type ValidationAuditStatus = "ALTERACOES_NECESSARIAS" | "SEM_ALTERACOES_RELEVANTES";
export type ValidationLevel = "VERIFICADO_COM_FONTES" | "VERIFICACAO_PARCIAL" | "FALHA_NA_VERIFICACAO";
export type ValidationResponseStatus = "completed" | "incomplete" | "failed" | "absent";
export type ValidationIncompleteReason = "max_output_tokens" | "content_filter" | "unlisted";

const STATE_COURT_SIGLAS = [
  "TJAC", "TJAL", "TJAM", "TJAP", "TJBA", "TJCE", "TJDFT", "TJES", "TJGO", "TJMA",
  "TJMG", "TJMS", "TJMT", "TJPA", "TJPB", "TJPE", "TJPI", "TJPR", "TJRJ", "TJRN",
  "TJRO", "TJRR", "TJRS", "TJSC", "TJSE", "TJSP", "TJTO",
] as const;

export const DIAGNOSTIC_SOURCE_FAMILIES = [
  "LEGISLACAO_FEDERAL",
  "STF",
  "STJ",
  "CNJ",
  "TSE",
  "TST",
  "STM",
  "DIARIO_OFICIAL",
  ...STATE_COURT_SIGLAS,
  ...Array.from({ length: 6 }, (_, index) => `TRF${index + 1}`),
  ...Array.from({ length: 24 }, (_, index) => `TRT${index + 1}`),
] as const;

export type DiagnosticSourceFamily = (typeof DIAGNOSTIC_SOURCE_FAMILIES)[number];
export type DiagnosticHostFamily = DiagnosticSourceFamily | "OTHER";

export const DIAGNOSTIC_SOURCE_TYPES = [
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
  "OTHER",
] as const;

export type DiagnosticSourceType = (typeof DIAGNOSTIC_SOURCE_TYPES)[number];

export const DIAGNOSTIC_STATUTE_TYPES = ["LEI", "LC", "DECRETO", "DECRETO_LEI", "MP", "OTHER"] as const;
export type DiagnosticStatuteType = (typeof DIAGNOSTIC_STATUTE_TYPES)[number];

export const FOLLOW_UP_SKIP_REASONS = [
  "none",
  "no_repairable_patch",
  "insufficient_remaining",
] as const;

export type FollowUpSkipReason = (typeof FOLLOW_UP_SKIP_REASONS)[number];

export const STATUTE_FAILURE_REASONS = [
  "identifier_without_support",
  "support_without_identifier",
  "split_support_and_identifier",
  "neither",
] as const;

export type StatuteFailureReason = (typeof STATUTE_FAILURE_REASONS)[number];

export interface EvidenceRefusalDiagnostic {
  evidenceIndex: number;
  hostFamily: DiagnosticHostFamily;
  sourceType: DiagnosticSourceType;
  official: boolean;
  consulted: boolean;
  modelSupportsChange: boolean;
  effectiveSupportsChange: boolean;
}

export interface StatuteEvidenceMatchDiagnostic {
  url: boolean;
  title: boolean;
  explanation: boolean;
  effectiveSupportsChange: boolean;
  hasIdentifierWithoutSupport: boolean;
  hasSupportWithoutIdentifier: boolean;
  failureReason: StatuteFailureReason;
}

export interface MissingStatuteDiagnostic {
  statuteType: DiagnosticStatuteType;
  evidenceMatch: StatuteEvidenceMatchDiagnostic;
}

export interface RefusalPredicateDiagnostic {
  changeId: string;
  requiredFamilies?: DiagnosticSourceFamily[];
  missingFamilies?: DiagnosticSourceFamily[];
  evidenceDiagnostics?: EvidenceRefusalDiagnostic[];
  introducedStatuteCount?: number;
  coveredStatuteCount?: number;
  missingStatutes?: MissingStatuteDiagnostic[];
}

export interface RejectedPatchDiagnostic {
  changeId: string;
  reasonCodes: ValidationReasonCode[];
  requiredFamilies?: DiagnosticSourceFamily[];
  missingFamilies?: DiagnosticSourceFamily[];
  evidenceDiagnostics?: EvidenceRefusalDiagnostic[];
  introducedStatuteCount?: number;
  coveredStatuteCount?: number;
  missingStatutes?: MissingStatuteDiagnostic[];
}

export interface LegalAuditValidationLog {
  validationOutcome: ValidationOutcome;
  validationReasonCodes: ValidationReasonCode[];
  rawChangeCount: number;
  acceptedPatchCount: number;
  rejectedPatchCount: number;
  unverifiedClaimCount: number;
  status?: ValidationAuditStatus;
  verificationLevel?: ValidationLevel;
  hasConsultedSources: boolean;
  consultedSourceCount: number;
  repairablePatchCount: number;
  followUpEligible: boolean;
  followUpSkipReason?: FollowUpSkipReason;
  remainingMs?: number;
  requiredRemainingMs?: number;
  mainCallElapsedMs?: number;
  validationElapsedMs?: number;
  responseStatus?: ValidationResponseStatus;
  incompleteReason?: ValidationIncompleteReason;
  rejectedPatches: RejectedPatchDiagnostic[];
  /** Só o log. Ausente quando nenhum predicado de tribunal ou diploma foi avaliado. */
  predicateDiagnostics?: RefusalPredicateDiagnostic[];
  coverageEligible?: boolean;
  coverageExecuted?: boolean;
  coverageSkipReason?: string;
  coverageReasonCodes?: string[];
  mainCallCount?: number;
  coverageCallCount?: number;
  repairCallCount?: number;
  totalModelCalls?: number;
  propositionCount?: number;
  highRiskPropositionCount?: number;
  auditedCorrectCount?: number;
  auditedIncorrectCount?: number;
  notAuditedCount?: number;
  indeterminateCount?: number;
  coverageRate?: number;
  highRiskCoverageRate?: number;
  directedCoverageEligible?: boolean;
  directedCoverageBatchCount?: number;
  coverageCompletenessPassed?: boolean;
  pendingByType?: Record<string, number>;
  pendingByRisk?: Record<string, number>;
}

const REASONS = new Set<string>(VALIDATION_REASON_CODES);
const OUTCOMES = new Set<string>(["accepted", "rejected"]);
const AUDIT_STATUSES = new Set<string>(["ALTERACOES_NECESSARIAS", "SEM_ALTERACOES_RELEVANTES"]);
const LEVELS = new Set<string>(["VERIFICADO_COM_FONTES", "VERIFICACAO_PARCIAL", "FALHA_NA_VERIFICACAO"]);
const RESPONSE_STATUSES = new Set<string>(["completed", "incomplete", "failed", "absent"]);
const INCOMPLETE_REASONS = new Set<string>(["max_output_tokens", "content_filter", "unlisted"]);
const SOURCE_FAMILIES = new Set<string>(DIAGNOSTIC_SOURCE_FAMILIES);
const SOURCE_TYPES = new Set<string>(DIAGNOSTIC_SOURCE_TYPES);
const STATUTE_TYPES = new Set<string>(DIAGNOSTIC_STATUTE_TYPES);

export function safeDiagnosticChangeId(value: unknown, index: number): string {
  if (typeof value !== "string") return `index-${index}`;
  const token = value.trim();
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(token)) return `index-${index}`;
  return token;
}

function finiteCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000) return 0;
  return Math.round(value);
}

function reasonCodes(value: unknown): ValidationReasonCode[] {
  if (!Array.isArray(value)) return [];
  const found: ValidationReasonCode[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !REASONS.has(item) || found.includes(item as ValidationReasonCode)) continue;
    found.push(item as ValidationReasonCode);
    if (found.length >= 24) break;
  }
  return found;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function familyList(value: unknown): DiagnosticSourceFamily[] {
  if (!Array.isArray(value)) return [];
  const found: DiagnosticSourceFamily[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !SOURCE_FAMILIES.has(item) || found.includes(item as DiagnosticSourceFamily)) continue;
    found.push(item as DiagnosticSourceFamily);
    if (found.length >= 40) break;
  }
  return found;
}

function hostFamily(value: unknown): DiagnosticHostFamily {
  if (value === "OTHER") return "OTHER";
  if (typeof value === "string" && SOURCE_FAMILIES.has(value)) return value as DiagnosticSourceFamily;
  return "OTHER";
}

function sourceType(value: unknown): DiagnosticSourceType {
  if (typeof value === "string" && SOURCE_TYPES.has(value)) return value as DiagnosticSourceType;
  return "OTHER";
}

function statuteType(value: unknown): DiagnosticStatuteType {
  if (typeof value === "string" && STATUTE_TYPES.has(value)) return value as DiagnosticStatuteType;
  return "OTHER";
}

function evidenceDiagnostics(value: unknown): EvidenceRefusalDiagnostic[] {
  if (!Array.isArray(value)) return [];
  const found: EvidenceRefusalDiagnostic[] = [];
  for (const item of value) {
    if (found.length >= 6) break;
    const record = asRecord(item);
    if (!record) continue;
    const evidenceIndex = record.evidenceIndex;
    if (typeof evidenceIndex !== "number" || !Number.isInteger(evidenceIndex) || evidenceIndex < 0 || evidenceIndex > 20) {
      continue;
    }
    found.push({
      evidenceIndex,
      hostFamily: hostFamily(record.hostFamily),
      sourceType: sourceType(record.sourceType),
      official: record.official === true,
      consulted: record.consulted === true,
      modelSupportsChange: record.modelSupportsChange === true,
      effectiveSupportsChange: record.effectiveSupportsChange === true,
    });
  }
  return found;
}

export function computeFollowUpEligibility(params: {
  repairablePatchCount: number;
  lacksSources?: boolean;
  remainingMs: number;
  requiredRemainingMs: number;
}): {
  followUpEligible: boolean;
  followUpSkipReason: FollowUpSkipReason;
} {
  const needsFollowUp = params.repairablePatchCount > 0 || Boolean(params.lacksSources);
  if (!needsFollowUp) {
    return {
      followUpEligible: false,
      followUpSkipReason: "no_repairable_patch",
    };
  }
  if (params.remainingMs < params.requiredRemainingMs) {
    return {
      followUpEligible: false,
      followUpSkipReason: "insufficient_remaining",
    };
  }
  return {
    followUpEligible: true,
    followUpSkipReason: "none",
  };
}

const STATUTE_FAILURE_REASONS_SET = new Set<string>(STATUTE_FAILURE_REASONS);
const SKIP_REASONS_SET = new Set<string>(FOLLOW_UP_SKIP_REASONS);

function missingStatutes(value: unknown): MissingStatuteDiagnostic[] {
  if (!Array.isArray(value)) return [];
  const found: MissingStatuteDiagnostic[] = [];
  for (const item of value) {
    if (found.length >= 24) break;
    const record = asRecord(item);
    if (!record) continue;
    const match = asRecord(record.evidenceMatch) ?? {};
    const failureReason = typeof match.failureReason === "string" && STATUTE_FAILURE_REASONS_SET.has(match.failureReason)
      ? (match.failureReason as StatuteFailureReason)
      : "neither";
    found.push({
      statuteType: statuteType(record.statuteType),
      evidenceMatch: {
        url: match.url === true,
        title: match.title === true,
        explanation: match.explanation === true,
        effectiveSupportsChange: match.effectiveSupportsChange === true,
        hasIdentifierWithoutSupport: match.hasIdentifierWithoutSupport === true,
        hasSupportWithoutIdentifier: match.hasSupportWithoutIdentifier === true,
        failureReason,
      },
    });
  }
  return found;
}

function courtMetadata(record: Record<string, unknown>): Pick<
  RejectedPatchDiagnostic,
  "requiredFamilies" | "missingFamilies" | "evidenceDiagnostics"
> | undefined {
  if (!Array.isArray(record.requiredFamilies) && !Array.isArray(record.evidenceDiagnostics)) return undefined;
  const requiredFamilies = familyList(record.requiredFamilies);
  return {
    requiredFamilies,
    missingFamilies: familyList(record.missingFamilies).filter((family) => requiredFamilies.includes(family)),
    evidenceDiagnostics: evidenceDiagnostics(record.evidenceDiagnostics),
  };
}

function diplomaMetadata(record: Record<string, unknown>): Pick<
  RejectedPatchDiagnostic,
  "introducedStatuteCount" | "coveredStatuteCount" | "missingStatutes"
> | undefined {
  if (typeof record.introducedStatuteCount !== "number" && !Array.isArray(record.missingStatutes)) return undefined;
  return {
    introducedStatuteCount: finiteCount(record.introducedStatuteCount),
    coveredStatuteCount: finiteCount(record.coveredStatuteCount),
    missingStatutes: missingStatutes(record.missingStatutes),
  };
}

/** Copia só o contrato de diagnóstico. Qualquer outro campo é descartado. */
export function sanitizeValidationLog(value: unknown): LegalAuditValidationLog | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.validationOutcome !== "string" || !OUTCOMES.has(record.validationOutcome)) return undefined;
  const rejectedPatches: RejectedPatchDiagnostic[] = [];
  if (Array.isArray(record.rejectedPatches)) {
    for (let index = 0; index < record.rejectedPatches.length && rejectedPatches.length < 40; index += 1) {
      const item = record.rejectedPatches[index];
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const patch = item as Record<string, unknown>;
      const codes = reasonCodes(patch.reasonCodes);
      if (!codes.length) continue;
      const diagnostic: RejectedPatchDiagnostic = {
        changeId: safeDiagnosticChangeId(patch.changeId, index),
        reasonCodes: codes,
      };
      if (codes.includes("COURT_FAMILY_FAILED")) {
        const court = courtMetadata(patch);
        if (court) Object.assign(diagnostic, court);
      }
      if (codes.includes("DIPLOMA_EVIDENCE_FAILED")) {
        const diploma = diplomaMetadata(patch);
        if (diploma) Object.assign(diagnostic, diploma);
      }
      rejectedPatches.push(diagnostic);
    }
  }
  const predicateDiagnostics: RefusalPredicateDiagnostic[] = [];
  if (Array.isArray(record.predicateDiagnostics)) {
    for (let index = 0; index < record.predicateDiagnostics.length && predicateDiagnostics.length < 40; index += 1) {
      const item = asRecord(record.predicateDiagnostics[index]);
      if (!item) continue;
      const court = courtMetadata(item);
      const diploma = diplomaMetadata(item);
      if (!court && !diploma) continue;
      predicateDiagnostics.push({
        changeId: safeDiagnosticChangeId(item.changeId, index),
        ...court,
        ...diploma,
      });
    }
  }
  const log: LegalAuditValidationLog = {
    validationOutcome: record.validationOutcome as ValidationOutcome,
    validationReasonCodes: reasonCodes(record.validationReasonCodes),
    rawChangeCount: finiteCount(record.rawChangeCount),
    acceptedPatchCount: finiteCount(record.acceptedPatchCount),
    rejectedPatchCount: finiteCount(record.rejectedPatchCount),
    unverifiedClaimCount: finiteCount(record.unverifiedClaimCount),
    hasConsultedSources: record.hasConsultedSources === true,
    consultedSourceCount: finiteCount(record.consultedSourceCount),
    repairablePatchCount: finiteCount(record.repairablePatchCount),
    followUpEligible: record.followUpEligible === true,
    rejectedPatches,
    ...(predicateDiagnostics.length ? { predicateDiagnostics } : {}),
  };
  if (typeof record.followUpSkipReason === "string" && SKIP_REASONS_SET.has(record.followUpSkipReason)) {
    log.followUpSkipReason = record.followUpSkipReason as FollowUpSkipReason;
  }
  if (typeof record.remainingMs === "number" && Number.isFinite(record.remainingMs)) {
    log.remainingMs = finiteCount(record.remainingMs);
  }
  if (typeof record.requiredRemainingMs === "number" && Number.isFinite(record.requiredRemainingMs)) {
    log.requiredRemainingMs = finiteCount(record.requiredRemainingMs);
  }
  if (typeof record.mainCallElapsedMs === "number" && Number.isFinite(record.mainCallElapsedMs)) {
    log.mainCallElapsedMs = finiteCount(record.mainCallElapsedMs);
  }
  if (typeof record.validationElapsedMs === "number" && Number.isFinite(record.validationElapsedMs)) {
    log.validationElapsedMs = finiteCount(record.validationElapsedMs);
  }
  if (typeof record.status === "string" && AUDIT_STATUSES.has(record.status)) {
    log.status = record.status as ValidationAuditStatus;
  }
  if (typeof record.verificationLevel === "string" && LEVELS.has(record.verificationLevel)) {
    log.verificationLevel = record.verificationLevel as ValidationLevel;
  }
  if (typeof record.responseStatus === "string" && RESPONSE_STATUSES.has(record.responseStatus)) {
    log.responseStatus = record.responseStatus as ValidationResponseStatus;
  }
  if (typeof record.incompleteReason === "string" && INCOMPLETE_REASONS.has(record.incompleteReason)) {
    log.incompleteReason = record.incompleteReason as ValidationIncompleteReason;
  }
  if (record.coverageEligible !== undefined) {
    log.coverageEligible = record.coverageEligible === true;
  }
  if (record.coverageExecuted !== undefined) {
    log.coverageExecuted = record.coverageExecuted === true;
  }
  if (typeof record.coverageSkipReason === "string") {
    log.coverageSkipReason = record.coverageSkipReason.slice(0, 100);
  }
  if (Array.isArray(record.coverageReasonCodes)) {
    log.coverageReasonCodes = record.coverageReasonCodes.map(String).slice(0, 20);
  }
  if (typeof record.mainCallCount === "number" && Number.isFinite(record.mainCallCount)) {
    log.mainCallCount = finiteCount(record.mainCallCount);
  }
  if (typeof record.coverageCallCount === "number" && Number.isFinite(record.coverageCallCount)) {
    log.coverageCallCount = finiteCount(record.coverageCallCount);
  }
  if (typeof record.repairCallCount === "number" && Number.isFinite(record.repairCallCount)) {
    log.repairCallCount = finiteCount(record.repairCallCount);
  }
  if (typeof record.totalModelCalls === "number" && Number.isFinite(record.totalModelCalls)) {
    log.totalModelCalls = finiteCount(record.totalModelCalls);
  }
  if (typeof record.propositionCount === "number" && Number.isFinite(record.propositionCount)) {
    log.propositionCount = finiteCount(record.propositionCount);
  }
  if (typeof record.highRiskPropositionCount === "number" && Number.isFinite(record.highRiskPropositionCount)) {
    log.highRiskPropositionCount = finiteCount(record.highRiskPropositionCount);
  }
  if (typeof record.auditedCorrectCount === "number" && Number.isFinite(record.auditedCorrectCount)) {
    log.auditedCorrectCount = finiteCount(record.auditedCorrectCount);
  }
  if (typeof record.auditedIncorrectCount === "number" && Number.isFinite(record.auditedIncorrectCount)) {
    log.auditedIncorrectCount = finiteCount(record.auditedIncorrectCount);
  }
  if (typeof record.notAuditedCount === "number" && Number.isFinite(record.notAuditedCount)) {
    log.notAuditedCount = finiteCount(record.notAuditedCount);
  }
  if (typeof record.indeterminateCount === "number" && Number.isFinite(record.indeterminateCount)) {
    log.indeterminateCount = finiteCount(record.indeterminateCount);
  }
  if (typeof record.coverageRate === "number" && Number.isFinite(record.coverageRate)) {
    log.coverageRate = Math.max(0, Math.min(1, record.coverageRate));
  }
  if (typeof record.highRiskCoverageRate === "number" && Number.isFinite(record.highRiskCoverageRate)) {
    log.highRiskCoverageRate = Math.max(0, Math.min(1, record.highRiskCoverageRate));
  }
  if (record.directedCoverageEligible !== undefined) {
    log.directedCoverageEligible = record.directedCoverageEligible === true;
  }
  if (typeof record.directedCoverageBatchCount === "number" && Number.isFinite(record.directedCoverageBatchCount)) {
    log.directedCoverageBatchCount = finiteCount(record.directedCoverageBatchCount);
  }
  if (record.coverageCompletenessPassed !== undefined) {
    log.coverageCompletenessPassed = record.coverageCompletenessPassed === true;
  }
  if (record.pendingByType && typeof record.pendingByType === "object" && !Array.isArray(record.pendingByType)) {
    log.pendingByType = record.pendingByType as Record<string, number>;
  }
  if (record.pendingByRisk && typeof record.pendingByRisk === "object" && !Array.isArray(record.pendingByRisk)) {
    log.pendingByRisk = record.pendingByRisk as Record<string, number>;
  }
  return log;
}

export function validationLogFromUnknown(error: unknown): LegalAuditValidationLog | undefined {
  if (!error || typeof error !== "object" || !("validationLog" in error)) return undefined;
  return sanitizeValidationLog((error as { validationLog?: unknown }).validationLog);
}

export interface LegalReviewFailureDiagnostic {
  responseId?: string | null;
  responseStatus?: string | null;
  responseModel?: string | null;
  incompleteDetails?: { reason?: string } | null;
  responseError?: unknown;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null;
  outputItemCount?: number;
  outputItemTypes?: string[];
  webSearchCallCount?: number;
  outputTextLength?: number;
  rejectionReason: string;
  rejectionDetail?: string | null;
  validationReasonCodes?: string[];
  validationLog?: LegalAuditValidationLog;
  elapsedMs?: number | null;
  configuredTimeoutMs?: number | null;
  configuredBudgetMs?: number | null;
  rawOutputSample?: string | null;
  rawOutputText?: string | null;
  parseError?: string | null;
}

export function sanitizeDiagnosticText(text: string): string {
  if (!text) return "";
  let clean = String(text);
  if (typeof process !== "undefined" && process?.env) {
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey && envKey.length > 5) {
      clean = clean.split(envKey).join("[REDACTED_ENV_OPENAI_KEY]");
    }
  }
  clean = clean.replace(/sk-[A-Za-z0-9_-]{10,}/g, "[REDACTED_OPENAI_KEY]");
  clean = clean.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED_TOKEN]");
  clean = clean.replace(/aiza[0-9A-Za-z\-_]{20,}/gi, "[REDACTED_GOOGLE_KEY]");
  clean = clean.replace(/password\s*[:=]\s*["'][^"']+["']/gi, 'password: "[REDACTED]"');
  return clean;
}

export function buildFailureDiagnostic(
  input: Partial<LegalReviewFailureDiagnostic> & { rejectionReason: string }
): LegalReviewFailureDiagnostic {
  const sample = input.rawOutputSample || (input.rawOutputText ? input.rawOutputText.slice(0, 2000) : null);
  return {
    responseId: input.responseId ? sanitizeDiagnosticText(String(input.responseId)) : null,
    responseStatus: input.responseStatus ? String(input.responseStatus) : null,
    responseModel: input.responseModel ? String(input.responseModel) : null,
    incompleteDetails: input.incompleteDetails ? { reason: input.incompleteDetails.reason ? String(input.incompleteDetails.reason) : undefined } : null,
    responseError: input.responseError ? JSON.parse(sanitizeDiagnosticText(JSON.stringify(input.responseError))) : null,
    usage: input.usage ? {
      input_tokens: typeof input.usage.input_tokens === "number" ? input.usage.input_tokens : undefined,
      output_tokens: typeof input.usage.output_tokens === "number" ? input.usage.output_tokens : undefined,
      total_tokens: typeof input.usage.total_tokens === "number" ? input.usage.total_tokens : undefined,
    } : null,
    outputItemCount: typeof input.outputItemCount === "number" ? input.outputItemCount : 0,
    outputItemTypes: Array.isArray(input.outputItemTypes) ? input.outputItemTypes.map(String) : [],
    webSearchCallCount: typeof input.webSearchCallCount === "number" ? input.webSearchCallCount : 0,
    outputTextLength: typeof input.outputTextLength === "number" ? input.outputTextLength : 0,
    rejectionReason: String(input.rejectionReason),
    rejectionDetail: input.rejectionDetail ? sanitizeDiagnosticText(String(input.rejectionDetail)) : null,
    validationReasonCodes: Array.isArray(input.validationReasonCodes) ? input.validationReasonCodes.map(String) : [],
    validationLog: input.validationLog ? sanitizeValidationLog(input.validationLog) : undefined,
    elapsedMs: typeof input.elapsedMs === "number" ? input.elapsedMs : null,
    configuredTimeoutMs: typeof input.configuredTimeoutMs === "number" ? input.configuredTimeoutMs : null,
    configuredBudgetMs: typeof input.configuredBudgetMs === "number" ? input.configuredBudgetMs : null,
    rawOutputSample: sample ? sanitizeDiagnosticText(sample) : null,
    rawOutputText: input.rawOutputText ? sanitizeDiagnosticText(input.rawOutputText) : null,
    parseError: input.parseError ? sanitizeDiagnosticText(String(input.parseError)) : null,
  };
}
