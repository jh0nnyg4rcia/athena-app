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
] as const;

export type ValidationReasonCode = (typeof VALIDATION_REASON_CODES)[number];

export type ValidationOutcome = "accepted" | "rejected";
export type ValidationAuditStatus = "ALTERACOES_NECESSARIAS" | "SEM_ALTERACOES_RELEVANTES";
export type ValidationLevel = "VERIFICADO_COM_FONTES" | "VERIFICACAO_PARCIAL" | "FALHA_NA_VERIFICACAO";
export type ValidationResponseStatus = "completed" | "incomplete" | "failed" | "absent";
export type ValidationIncompleteReason = "max_output_tokens" | "content_filter" | "unlisted";

export interface RejectedPatchDiagnostic {
  changeId: string;
  reasonCodes: ValidationReasonCode[];
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
  responseStatus?: ValidationResponseStatus;
  incompleteReason?: ValidationIncompleteReason;
  rejectedPatches: RejectedPatchDiagnostic[];
}

const REASONS = new Set<string>(VALIDATION_REASON_CODES);
const OUTCOMES = new Set<string>(["accepted", "rejected"]);
const AUDIT_STATUSES = new Set<string>(["ALTERACOES_NECESSARIAS", "SEM_ALTERACOES_RELEVANTES"]);
const LEVELS = new Set<string>(["VERIFICADO_COM_FONTES", "VERIFICACAO_PARCIAL", "FALHA_NA_VERIFICACAO"]);
const RESPONSE_STATUSES = new Set<string>(["completed", "incomplete", "failed", "absent"]);
const INCOMPLETE_REASONS = new Set<string>(["max_output_tokens", "content_filter", "unlisted"]);

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
      rejectedPatches.push({
        changeId: safeDiagnosticChangeId(patch.changeId, index),
        reasonCodes: codes,
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
  };
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
  return log;
}

export function validationLogFromUnknown(error: unknown): LegalAuditValidationLog | undefined {
  if (!error || typeof error !== "object" || !("validationLog" in error)) return undefined;
  return sanitizeValidationLog((error as { validationLog?: unknown }).validationLog);
}
