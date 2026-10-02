/**
 * Telemetria da auditoria jurídica.
 * Cada linha é JSON só com campos permitidos. Não recebe aula, prompt, Markdown, raciocínio nem segredo.
 */

export const LEGAL_REVIEW_LOG_EVENTS = [
  "LEGAL_REVIEW_START",
  "LEGAL_REVIEW_OPENAI_START",
  "LEGAL_REVIEW_OPENAI_END",
  "LEGAL_REVIEW_VALIDATION_START",
  "LEGAL_REVIEW_VALIDATION_END",
  "LEGAL_REVIEW_FIRESTORE_START",
  "LEGAL_REVIEW_FIRESTORE_END",
  "LEGAL_REVIEW_SUCCESS",
  "LEGAL_REVIEW_ERROR",
  "LEGAL_REVIEW_RETRY",
] as const;

export type LegalReviewLogEvent = (typeof LEGAL_REVIEW_LOG_EVENTS)[number];
export type LegalReviewFirestoreStep = "begin" | "complete" | "fail";
export type LegalReviewRetryReason = "timeout" | "invalid_audit" | "missing_sources";

export interface SafeLegalReviewError {
  name?: string;
  code?: string;
  status?: number;
  type?: string;
  message: string;
  stage: string;
}

export interface LegalReviewTraceCounts {
  servedModel?: string;
  verificationLevel?: string;
  consultedSources?: number;
  changes?: number;
  unverifiedClaims?: number;
}

export interface LegalReviewTrace {
  start(): void;
  openaiStart(): void;
  openaiEnd(servedModel?: string): void;
  retry(reason: LegalReviewRetryReason): void;
  validationStart(): void;
  validationEnd(counts?: LegalReviewTraceCounts, failure?: unknown): void;
  firestoreStart(step: LegalReviewFirestoreStep): void;
  firestoreEnd(): void;
  success(counts: LegalReviewTraceCounts): void;
  noteFailure(error: unknown, stage: string): void;
  clearFailure(): void;
  error(error: unknown): void;
  stage(): string;
}

const STAGES = new Set(["start", "openai", "validation", "firestore", "http", "success", "sanitizer"]);
const LEVELS = new Set(["VERIFICADO_COM_FONTES", "VERIFICACAO_PARCIAL", "FALHA_NA_VERIFICACAO"]);
const FIRESTORE_STEPS = new Set<LegalReviewFirestoreStep>(["begin", "complete", "fail"]);
const RETRY_REASONS = new Set<LegalReviewRetryReason>(["timeout", "invalid_audit", "missing_sources"]);
const UNSAFE_MESSAGE =
  /sk-[A-Za-z0-9_-]{6,}|bearer\s+[A-Za-z0-9\-._~+/]+=*|authorization\s*[:=]|cookie\s*[:=]|set-cookie|aiza[0-9A-Za-z\-_]{8,}|gocspx-|\[block_|```|<aula|output_text|\breasoning\b|eyJ[A-Za-z0-9_-]{10,}|x-goog-|signature=/i;
const LEAK = /sk-|bearer\s|authorization|openai_api_key|gemini_api_key|aiza|gocspx-/i;

function clock(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
  return Date.now();
}

function safeIdentifier(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const token = value.trim();
  if (!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(token)) return undefined;
  if (/sk-|secret|password|bearer/i.test(token)) return undefined;
  return token;
}

function safeCode(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  if (typeof value !== "string") return undefined;
  const code = value.trim();
  if (!/^[A-Za-z0-9_.:-]{1,64}$/.test(code)) return undefined;
  if (/sk-|bearer|secret/i.test(code)) return undefined;
  return code;
}

export function safeReviewModel(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const model = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(model)) return undefined;
  if (/sk-|bearer|secret|key|token/i.test(model)) return undefined;
  return model;
}

function safeCount(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return Math.min(1_000_000, Math.round(value));
}

function safeStage(stage: string): string {
  return STAGES.has(stage) ? stage : "openai";
}

export function sanitizeLegalReviewMessage(raw: string): string {
  const collapsed = raw.replace(/\s+/g, " ").trim();
  if (!collapsed || collapsed.length > 240 || UNSAFE_MESSAGE.test(collapsed)) {
    return "Falha sem mensagem segura.";
  }
  if (/openai_api_key|gemini_api_key/i.test(collapsed)) {
    return "A credencial do provedor não está disponível no servidor.";
  }
  return collapsed;
}

export function sanitizeLegalReviewError(error: unknown, stage: string): SafeLegalReviewError {
  const record = error && typeof error === "object" ? (error as Record<string, unknown>) : undefined;
  const nested = record?.error;
  const nestedType = nested && typeof nested === "object" ? (nested as { type?: unknown }).type : undefined;
  const statusValue = record?.status;
  const safe: SafeLegalReviewError = {
    message: sanitizeLegalReviewMessage(
      error instanceof Error ? error.message : typeof record?.message === "string" ? record.message : ""
    ),
    stage: safeStage(stage),
  };
  const name = error instanceof Error ? safeIdentifier(error.name) : safeIdentifier(record?.name);
  const code = safeCode(record?.code);
  const type = safeCode(record?.type) || safeCode(nestedType);
  if (name) safe.name = name;
  if (code) safe.code = code;
  if (typeof statusValue === "number" && Number.isInteger(statusValue) && statusValue >= 100 && statusValue <= 599) {
    safe.status = statusValue;
  }
  if (type) safe.type = type;
  return safe;
}

function defaultWrite(line: string): void {
  console.log(line);
}

const COVERAGE_REASONS = new Set(["uncovered_edits", "too_many_changes", "invalid_audit"]);
const HUNK_KINDS = new Set(["add", "remove", "replace"]);

function finiteCount(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000) return undefined;
  return Math.round(value);
}

/** Copia só contagens e códigos. Ignora texto jurídico que tenha vindo junto do erro. */
export function coverageFromUnknown(error: unknown): Record<string, unknown> | undefined {
  if (!error || typeof error !== "object" || !("diagnostics" in error)) return undefined;
  const diagnostics = (error as { diagnostics?: unknown }).diagnostics;
  if (!diagnostics || typeof diagnostics !== "object") return undefined;
  const record = diagnostics as Record<string, unknown>;
  const reason = typeof record.reason === "string" && COVERAGE_REASONS.has(record.reason) ? record.reason : undefined;
  if (!reason) return undefined;
  const coverage: Record<string, unknown> = { reason };
  for (const key of ["hunks", "covered", "uncovered", "add", "remove", "replace", "changeCount", "limit"]) {
    const value = finiteCount(record[key]);
    if (value !== undefined) coverage[key] = value;
  }
  if (Array.isArray(record.uncoveredChars)) {
    coverage.uncoveredChars = record.uncoveredChars
      .map((item) => finiteCount(item))
      .filter((item): item is number => item !== undefined)
      .slice(0, 40);
  }
  if (Array.isArray(record.uncoveredKinds)) {
    coverage.uncoveredKinds = record.uncoveredKinds
      .filter((item) => typeof item === "string" && HUNK_KINDS.has(item))
      .slice(0, 40);
  }
  return coverage;
}

export function createLegalReviewTrace(input: {
  testMode: boolean;
  requestedModel: string;
  write?: (line: string) => void;
}): LegalReviewTrace {
  const started = clock();
  let last = started;
  let attempt = 0;
  let stage = "start";
  let servedModel: string | undefined;
  let verificationLevel: string | undefined;
  let consultedSources: number | undefined;
  let changes: number | undefined;
  let unverifiedClaims: number | undefined;
  let pending: SafeLegalReviewError | undefined;
  let coverageLog: Record<string, unknown> | undefined;
  const testMode = input.testMode === true;
  const requestedModel = safeReviewModel(input.requestedModel) || "gpt-5.6";
  const write = input.write ?? defaultWrite;

  function applyCounts(counts?: LegalReviewTraceCounts) {
    if (!counts) return;
    const model = safeReviewModel(counts.servedModel);
    if (model) servedModel = model;
    if (typeof counts.verificationLevel === "string" && LEVELS.has(counts.verificationLevel)) {
      verificationLevel = counts.verificationLevel;
    }
    const sources = safeCount(counts.consultedSources);
    if (sources !== undefined) consultedSources = sources;
    const changeCount = safeCount(counts.changes);
    if (changeCount !== undefined) changes = changeCount;
    const unverified = safeCount(counts.unverifiedClaims);
    if (unverified !== undefined) unverifiedClaims = unverified;
  }

  function emit(
    event: LegalReviewLogEvent,
    extra?: {
      firestoreStep?: LegalReviewFirestoreStep;
      retryReason?: LegalReviewRetryReason;
      error?: SafeLegalReviewError;
    }
  ) {
    const now = clock();
    const payload: Record<string, unknown> = {
      severity: event === "LEGAL_REVIEW_ERROR" ? "ERROR" : event === "LEGAL_REVIEW_RETRY" ? "WARNING" : "INFO",
      message: event,
      at: new Date().toISOString(),
      elapsedMs: Math.max(0, Math.round(now - started)),
      stageMs: Math.max(0, Math.round(now - last)),
      testMode,
      requestedModel,
      attempt,
    };
    last = now;
    if (servedModel) payload.servedModel = servedModel;
    if (verificationLevel) payload.verificationLevel = verificationLevel;
    if (consultedSources !== undefined) payload.consultedSources = consultedSources;
    if (changes !== undefined) payload.changes = changes;
    if (unverifiedClaims !== undefined) payload.unverifiedClaims = unverifiedClaims;
    if (extra?.firestoreStep && FIRESTORE_STEPS.has(extra.firestoreStep)) payload.firestoreStep = extra.firestoreStep;
    if (extra?.retryReason && RETRY_REASONS.has(extra.retryReason)) payload.retryReason = extra.retryReason;
    if (
      coverageLog
      && (event === "LEGAL_REVIEW_VALIDATION_END" || event === "LEGAL_REVIEW_ERROR")
    ) {
      payload.coverage = coverageLog;
    }
    if (extra?.error) {
      payload.error = {
        message: extra.error.message,
        stage: extra.error.stage,
        ...(extra.error.name ? { name: extra.error.name } : {}),
        ...(extra.error.code ? { code: extra.error.code } : {}),
        ...(extra.error.status !== undefined ? { status: extra.error.status } : {}),
        ...(extra.error.type ? { type: extra.error.type } : {}),
      };
    }
    const line = JSON.stringify(payload);
    if (LEAK.test(line)) {
      write(JSON.stringify({
        severity: "ERROR",
        message: "LEGAL_REVIEW_ERROR",
        at: new Date().toISOString(),
        elapsedMs: payload.elapsedMs,
        stageMs: payload.stageMs,
        testMode,
        requestedModel: "gpt-5.6",
        attempt,
        error: { message: "Falha sem mensagem segura.", stage: "sanitizer" },
      }));
      return;
    }
    write(line);
  }

  return {
    start() {
      stage = "start";
      emit("LEGAL_REVIEW_START");
    },
    openaiStart() {
      stage = "openai";
      attempt += 1;
      coverageLog = undefined;
      emit("LEGAL_REVIEW_OPENAI_START");
    },
    openaiEnd(model) {
      stage = "openai";
      const safe = safeReviewModel(model);
      if (safe) servedModel = safe;
      pending = undefined;
      emit("LEGAL_REVIEW_OPENAI_END");
    },
    retry(reason) {
      const error = pending;
      pending = undefined;
      emit("LEGAL_REVIEW_RETRY", {
        retryReason: RETRY_REASONS.has(reason) ? reason : "timeout",
        error,
      });
    },
    validationStart() {
      stage = "validation";
      emit("LEGAL_REVIEW_VALIDATION_START");
    },
    validationEnd(counts, failure) {
      stage = "validation";
      applyCounts(counts);
      coverageLog = coverageFromUnknown(failure);
      emit("LEGAL_REVIEW_VALIDATION_END");
    },
    firestoreStart(step) {
      stage = "firestore";
      emit("LEGAL_REVIEW_FIRESTORE_START", { firestoreStep: step });
    },
    firestoreEnd() {
      stage = "firestore";
      emit("LEGAL_REVIEW_FIRESTORE_END");
    },
    success(counts) {
      stage = "success";
      applyCounts(counts);
      pending = undefined;
      emit("LEGAL_REVIEW_SUCCESS");
    },
    noteFailure(error, failedStage) {
      stage = safeStage(failedStage);
      pending = sanitizeLegalReviewError(error, stage);
      const safeCoverage = coverageFromUnknown(error);
      if (safeCoverage) coverageLog = safeCoverage;
    },
    clearFailure() {
      pending = undefined;
    },
    error(error) {
      const safe = pending ?? sanitizeLegalReviewError(error, stage);
      pending = undefined;
      emit("LEGAL_REVIEW_ERROR", { error: safe });
    },
    stage() {
      return stage;
    },
  };
}
