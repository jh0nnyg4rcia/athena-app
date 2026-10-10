/**
 * Chamada OpenAI da auditoria. A chave fica só em OPENAI_API_KEY no processo.
 * Este módulo não pode ser importado pelo cliente.
 */
import OpenAI from "openai";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  INVALID_AUDIT_MESSAGE,
  LEGAL_REVIEW_JSON_SCHEMA,
  LEGAL_SUPPLEMENT_JSON_SCHEMA,
  canonicalSourceUrl,
  describeConsultedSources,
  explainLegalAuditFailure,
  isOfficialLegalUrl,
  mergePatchAudits,
  mergeCoverageAudits,
  normalizeLegalAudit,
  shouldRunCoveragePass,
  type NormalizedAudit,
  type RepairablePatch,
} from "../lib/legalReviewValidate";
import {
  extractPropositionUnits,
  formatPropositionsForPrompt,
  validateAuditedUnits,
  evaluateCoverageCompleteness,
  prepareDirectedCoverageBatches,
  coverageEvidenceSatisfied,
  mergeAuditedPropositionUnits,
  DIRECTED_COVERAGE_BATCH_SIZE,
  DIRECTED_COVERAGE_JSON_SCHEMA,
  type DirectedCoverageAuditItem,
  type AuditedPropositionInput,
  type PropositionUnit,
  type PropositionAuditStatus,
  type CoverageSummary,
} from "../lib/legalReviewPropositions";
import {
  computeFollowUpEligibility,
  type FollowUpSkipReason,
  type LegalAuditValidationLog,
  type ValidationIncompleteReason,
  type ValidationReasonCode,
  type ValidationResponseStatus,
  type LegalReviewFailureDiagnostic,
  buildFailureDiagnostic,
  sanitizeDiagnosticText,
} from "../lib/legalReviewDiagnostics";
import { searchDomainsForLesson } from "../lib/legalReviewSources";
import type {
  LegalReviewChange,
  LegalSupplementExecutor,
  SupplementFindingItem,
  SupplementPendingItem,
} from "../lib/legalReviewTypes";
import {
  buildLegalReviewInstructions,
  buildUntrustedLessonInput,
  buildCoverageReviewInstructions,
  buildCoverageUntrustedInput,
  buildDirectedCoverageInstructions,
  buildDirectedCoverageUntrustedInput,
} from "./legalReviewPrompt";
import { redactProviderError } from "./openaiServerService";
import { createLegalReviewTrace, type LegalReviewTrace, type LegalReviewTraceCounts } from "./legalReviewTrace";

const DEFAULT_OPENAI_REVIEW_MODEL = "gpt-5.6";
/** A Function tem 600s. Este orçamento deixa validação, Firestore e a resposta HTTP de fora da espera da OpenAI. */
export const OPENAI_AUDIT_BUDGET_MS = 420_000;
export const OPENAI_ATTEMPT_TIMEOUT_MS = 360_000;
/** Nova geração só começa se ainda houver orçamento para outra tentativa de 200s. */
export const MIN_GENERATION_RETRY_REMAINING_MS = 200_000;
/** Follow-up só começa se ainda houver pelo menos 75s. */
export const MIN_FOLLOW_UP_REMAINING_MS = 75_000;
/** O laço da auditoria continua capaz de repetir. O SDK não repete por conta própria. */
export const OPENAI_REVIEW_SDK_MAX_RETRIES = 0;
const MISSING_KEY =
  "OPENAI_API_KEY ausente no servidor. A chave da OpenAI fica só na Cloud Function, nunca no aplicativo.";

export const OFFICIAL_FILTER_REJECTED_MESSAGE =
  "Não foi possível executar a verificação em fontes oficiais. A revisão não foi concluída.";

export const MODEL_UNAVAILABLE_MESSAGE =
  "O modelo configurado para a auditoria jurídica não está disponível. A revisão não foi concluída. A aula publicada não foi alterada.";

export const REASONING_REJECTED_MESSAGE =
  "A auditoria jurídica não pôde manter o raciocínio exigido. A revisão não foi concluída. A aula publicada não foi alterada.";

export const OPENAI_TIMEOUT_MESSAGE =
  "A revisão jurídica excedeu o tempo disponível para esta tentativa. Tente novamente.";

/** Segunda chamada de geração, depois que a primeira também estourou o tempo. */
export const OPENAI_TIMEOUT_GENERATION_RETRY = "openai_timeout_generation_retry";

/** Único follow-up de reparo ou de fonte ausente. */
export const OPENAI_TIMEOUT_FOLLOW_UP = "openai_timeout_follow_up";

export function reviewModelName(): string {
  const configured = (process.env.OPENAI_REVIEW_MODEL || "").trim();
  return configured || DEFAULT_OPENAI_REVIEW_MODEL;
}

export interface AuditLessonInput {
  reviewDate: string;
  lessonId: string;
  day: number;
  part: number;
  subject: string;
  topic: string;
  content: string;
  publishedContent?: string;
  /** Índice zero-based da parte interna. Ausente na revisão do documento inteiro. */
  sectionIndex?: number;
  trace?: LegalReviewTrace;
  /** Controle da passagem de cobertura. Se omitido, ativo em produção e inativo em testes locais com callModel. */
  enableCoveragePass?: boolean;
  /** Só testes locais. Produção usa a Responses API. */
  callModel?: (input: {
    model: string;
    instructions: string;
    userInput: string;
    lessonText: string;
    timeoutMs: number;
    schema?: Record<string, unknown>;
  }) => Promise<ReviewModelResponse>;
}

export interface AuditLessonResult extends NormalizedAudit {
  model: string;
  webSearchUsed: boolean;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  coverageEligible?: boolean;
  coverageExecuted?: boolean;
  coverageSkipReason?: string;
  coverageReasonCodes?: string[];
  mainCallCount?: number;
  coverageCallCount?: number;
  repairCallCount?: number;
  totalModelCalls?: number;
  coverageSummary?: CoverageSummary;
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

export interface ReviewModelResponse {
  id?: string;
  model?: string;
  output_text?: string | null;
  output?: unknown;
  status?: string;
  error?: unknown;
  incomplete_details?: { reason?: string } | null;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null;
}

function responseStatusOf(status: unknown): ValidationResponseStatus {
  if (status === "completed" || status === "incomplete" || status === "failed") return status;
  return "absent";
}

function incompleteReasonOf(response: ReviewModelResponse): ValidationIncompleteReason | undefined {
  const reason = response.incomplete_details?.reason;
  if (typeof reason !== "string" || !reason.trim()) return undefined;
  if (reason === "max_output_tokens" || reason === "content_filter") return reason;
  return "unlisted";
}

function rejectedResponseLog(
  code: ValidationReasonCode,
  response: ReviewModelResponse,
  incompleteReason?: ValidationIncompleteReason
): LegalAuditValidationLog {
  return {
    validationOutcome: "rejected",
    validationReasonCodes: [code],
    rawChangeCount: 0,
    acceptedPatchCount: 0,
    rejectedPatchCount: 0,
    unverifiedClaimCount: 0,
    hasConsultedSources: false,
    consultedSourceCount: 0,
    repairablePatchCount: 0,
    followUpEligible: false,
    responseStatus: responseStatusOf(response.status),
    ...(incompleteReason ? { incompleteReason } : {}),
    rejectedPatches: [],
  };
}

function invalidAuditError(log: LegalAuditValidationLog, extra?: { diagnostic?: LegalReviewFailureDiagnostic }): Error {
  return Object.assign(new Error(INVALID_AUDIT_MESSAGE), { validationLog: log, ...extra });
}

export function buildFailureDiagnosticFromResponse(
  response: ReviewModelResponse,
  extra: {
    rejectionReason: string;
    rejectionDetail?: string | null;
    validationLog?: LegalAuditValidationLog;
    parseError?: string | null;
    rawParsed?: unknown;
  }
): LegalReviewFailureDiagnostic {
  const outputItems = Array.isArray(response.output) ? response.output : [];
  const outputTypes = outputItems.map((item: any) => item?.type || typeof item);
  const webSearchCalls = outputItems.filter((item: any) => item?.type === "web_search_call" || item?.action?.sources).length;
  const rawText = typeof response.output_text === "string" ? response.output_text : "";

  return buildFailureDiagnostic({
    responseId: response.id || null,
    responseStatus: response.status || null,
    responseModel: response.model || null,
    incompleteDetails: response.incomplete_details || null,
    responseError: response.error || null,
    usage: response.usage || null,
    outputItemCount: outputItems.length,
    outputItemTypes: outputTypes,
    webSearchCallCount: webSearchCalls,
    outputTextLength: rawText.length,
    rawOutputText: rawText,
    rejectionReason: extra.rejectionReason,
    rejectionDetail: extra.rejectionDetail || null,
    validationReasonCodes: extra.validationLog?.validationReasonCodes || [],
    validationLog: extra.validationLog,
    parseError: extra.parseError || null,
  });
}

export function persistDiagnosticFiles(
  diagnostic: LegalReviewFailureDiagnostic,
  rawOutputText?: string | null,
  targetDir?: string
): { errorFile: string; outputFile?: string } {
  const tmpDir = targetDir || path.join(process.cwd(), "tmp");
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch {
    // Ignore error
  }
  const errorFile = path.join(tmpDir, "last-legal-review-error.json");
  const outputFile = path.join(tmpDir, "last-legal-review-output.txt");

  try {
    const sanitizedDiag = JSON.parse(sanitizeDiagnosticText(JSON.stringify(diagnostic, null, 2)));
    if (sanitizedDiag.rawOutputText && sanitizedDiag.rawOutputText.length > 4000) {
      sanitizedDiag.rawOutputText = sanitizedDiag.rawOutputText.slice(0, 4000) + "... [TRUNCATED_IN_JSON_SEE_OUTPUT_TXT]";
    }
    fs.writeFileSync(errorFile, JSON.stringify(sanitizedDiag, null, 2), "utf8");
  } catch {
    // Falha silenciosa para respeitar contrato do servidor sem log desestruturado
  }

  const textToSave = rawOutputText || diagnostic.rawOutputText;
  if (typeof textToSave === "string") {
    try {
      fs.writeFileSync(outputFile, sanitizeDiagnosticText(textToSave), "utf8");
    } catch {
      // Falha silenciosa para respeitar contrato do servidor
    }
    return { errorFile, outputFile };
  }

  return { errorFile };
}

function requireKey(): string {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error(MISSING_KEY);
  return apiKey;
}

export function isTimeout(error: unknown): boolean {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error || "");
  return name === "AbortError" || name === "APIConnectionTimeoutError" || /timeout|timed out|aborted/i.test(message);
}

function errorStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : undefined;
}

function providerMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || "");
  }
  return String(error || "");
}

function openAiTimeoutDiagnostic(code: string): Error {
  return Object.assign(new Error(code), {
    name: "APIConnectionTimeoutError",
    code,
  });
}

/** Falha fechada. Não troca o modelo nem remove o filtro de domínio. */
export function reviewFailureForOpenAIError(error: unknown): Error {
  if (isTimeout(error)) return new Error(OPENAI_TIMEOUT_MESSAGE);
  const message = redactProviderError(new Error(providerMessage(error)), "");
  const status = errorStatus(error);
  if (/allowed_domains|filters|domain/i.test(message)) {
    return new Error(OFFICIAL_FILTER_REJECTED_MESSAGE);
  }
  if (status === 404 || /model.*(not found|does not exist|invalid)|invalid model|model_not_found/i.test(message)) {
    return new Error(MODEL_UNAVAILABLE_MESSAGE);
  }
  if (/reasoning|effort/i.test(message)) {
    return new Error(REASONING_REJECTED_MESSAGE);
  }
  if (/tool_choice/i.test(message)) {
    return new Error(OFFICIAL_FILTER_REJECTED_MESSAGE);
  }
  return new Error(redactProviderError(error, "A OpenAI não concluiu a auditoria. A aula publicada não foi alterada."));
}

export function servedModelAccepted(requested: string, actual: string | undefined): boolean {
  const served = (actual || "").trim();
  if (!served) return false;
  if (served === requested) return true;
  if (requested === "gpt-5.6" && served.startsWith("gpt-5.6")) return true;
  return false;
}

export function extractConsultedSourceUrls(output: unknown): string[] {
  if (!Array.isArray(output)) return [];
  const urls: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const action = record.action as Record<string, unknown> | undefined;

    if (action) {
      if (Array.isArray(action.sources)) {
        for (const source of action.sources) {
          if (source && typeof source === "object" && typeof (source as Record<string, unknown>).url === "string") {
            urls.push((source as Record<string, unknown>).url as string);
          }
        }
      }
      if (typeof action.url === "string" && action.url) {
        urls.push(action.url);
      }
    }

    if (Array.isArray(record.sources)) {
      for (const source of record.sources) {
        if (source && typeof source === "object" && typeof (source as Record<string, unknown>).url === "string") {
          urls.push((source as Record<string, unknown>).url as string);
        } else if (typeof source === "string" && source) {
          urls.push(source);
        }
      }
    }

    if (typeof record.url === "string" && record.url) {
      urls.push(record.url);
    }
  }
  return urls;
}

export function buildReviewCreateParams(input: {
  model: string;
  instructions: string;
  userInput: string;
  lessonText: string;
  /** Só o follow-up informa "high". A chamada principal permanece em medium. */
  reasoningEffort?: "medium" | "high";
  /** Só o follow-up informa 12000. A chamada principal permanece em 16000. */
  maxOutputTokens?: number;
  schema?: Record<string, unknown>;
  schemaName?: string;
}) {
  return {
    model: input.model,
    instructions: input.instructions,
    input: input.userInput,
    store: false as const,
    include: ["web_search_call.action.sources" as const],
    tools: [
      {
        type: "web_search" as const,
        external_web_access: true,
        search_context_size: "high" as const,
        user_location: {
          type: "approximate" as const,
          country: "BR",
          timezone: "America/Sao_Paulo",
        },
        filters: { allowed_domains: searchDomainsForLesson(input.lessonText) },
      },
    ],
    tool_choice: "required" as const,
    reasoning: { effort: input.reasoningEffort ?? "medium" },
    max_output_tokens: input.maxOutputTokens ?? 16000,
    text: {
      format: {
        type: "json_schema" as const,
        name: input.schemaName ?? "auditoria_juridica",
        strict: true,
        schema: input.schema ?? LEGAL_REVIEW_JSON_SCHEMA,
      },
    },
  };
}

function readUsage(usage: ReviewModelResponse["usage"]) {
  if (!usage) return undefined;
  return {
    inputTokens: Number(usage.input_tokens || 0),
    outputTokens: Number(usage.output_tokens || 0),
    totalTokens: Number(usage.total_tokens || 0),
  };
}

export function interpretReviewResponse(
  response: ReviewModelResponse,
  originalMarkdown: string,
  requestedModel: string
): AuditLessonResult {
  if (!servedModelAccepted(requestedModel, response.model)) {
    const error = new Error(
      `O modelo que respondeu (${response.model || "desconhecido"}) não é o modelo solicitado (${requestedModel}). A revisão não foi concluída. A aula publicada não foi alterada.`
    );
    const diagnostic = buildFailureDiagnosticFromResponse(response, {
      rejectionReason: "MODEL_MISMATCH",
      rejectionDetail: error.message,
    });
    (error as any).diagnostic = diagnostic;
    throw error;
  }
  if (response.error) {
    const log = rejectedResponseLog("RESPONSE_ERROR", response);
    const diagnostic = buildFailureDiagnosticFromResponse(response, {
      rejectionReason: "RESPONSE_ERROR",
      validationLog: log,
      rejectionDetail: typeof response.error === "object" ? JSON.stringify(response.error) : String(response.error),
    });
    throw invalidAuditError(log, { diagnostic });
  }
  if (response.status === "incomplete") {
    const incompleteReason = incompleteReasonOf(response);
    const log = rejectedResponseLog("RESPONSE_INCOMPLETE", response, incompleteReason);
    const diagnostic = buildFailureDiagnosticFromResponse(response, {
      rejectionReason: "RESPONSE_INCOMPLETE",
      validationLog: log,
      rejectionDetail: `Status incomplete: reason=${incompleteReason || "unspecified"}`,
    });
    throw invalidAuditError(log, { diagnostic });
  }
  if (response.status === "failed") {
    const log = rejectedResponseLog("RESPONSE_FAILED", response);
    const diagnostic = buildFailureDiagnosticFromResponse(response, {
      rejectionReason: "RESPONSE_FAILED",
      validationLog: log,
      rejectionDetail: "Response status failed",
    });
    throw invalidAuditError(log, { diagnostic });
  }
  const text = (response.output_text || "").trim();
  if (!text) {
    const log = rejectedResponseLog("EMPTY_OUTPUT", response);
    const diagnostic = buildFailureDiagnosticFromResponse(response, {
      rejectionReason: "EMPTY_OUTPUT",
      validationLog: log,
      rejectionDetail: "output_text vazio ou contendo apenas espaços em branco",
    });
    throw invalidAuditError(log, { diagnostic });
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (parseErr) {
    const log = rejectedResponseLog("JSON_PARSE_FAILED", response);
    const diagnostic = buildFailureDiagnosticFromResponse(response, {
      rejectionReason: "JSON_PARSE_FAILED",
      validationLog: log,
      parseError: parseErr instanceof Error ? parseErr.message : String(parseErr),
      rejectionDetail: `JSON.parse falhou: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
    });
    throw invalidAuditError(log, { diagnostic });
  }
  const consultedUrls = extractConsultedSourceUrls(response.output);
  const audit = normalizeLegalAudit(raw, originalMarkdown, {
    webSearchExecuted: consultedUrls.length > 0,
    consultedUrls,
  });
  if (!audit) {
    const error = explainLegalAuditFailure(raw, originalMarkdown);
    if (error.validationLog) {
      error.validationLog = { ...error.validationLog, responseStatus: responseStatusOf(response.status) };
    }
    const diagnostic = buildFailureDiagnosticFromResponse(response, {
      rejectionReason: "AUDIT_CONTRACT_INVALID",
      validationLog: error.validationLog,
      rejectionDetail: "Classificação da auditoria falhou perante contrato do ATHENA",
      rawParsed: raw,
    });
    (error as any).diagnostic = diagnostic;
    throw error;
  }
  return {
    ...audit,
    model: response.model || requestedModel,
    webSearchUsed: consultedUrls.length > 0,
    usage: readUsage(response.usage),
  };
}

async function createResponse(
  client: OpenAI,
  model: string,
  instructions: string,
  userInput: string,
  lessonText: string,
  timeoutMs: number,
  reasoningEffort: "medium" | "high" = "medium",
  maxOutputTokens = 16000,
  schema?: Record<string, unknown>,
  schemaName?: string
) {
  return client.responses.create(
    buildReviewCreateParams({
      model,
      instructions,
      userInput,
      lessonText,
      reasoningEffort,
      maxOutputTokens,
      schema,
      schemaName,
    }),
    { timeout: timeoutMs, maxRetries: OPENAI_REVIEW_SDK_MAX_RETRIES }
  );
}

const COVERAGE_REPAIR_FOLLOW_UP = [
  "A resposta anterior teve patches recusados.",
  "Reenvie somente os patches recusados.",
  "Não refaça patches já validados.",
  "Não devolva o texto integral da aula.",
  "Não reescreva a aula.",
  "originalExcerpt deve ser cópia literal do Markdown original.",
  "beforeContext e afterContext só desambiguam a ocorrência e não fazem parte do texto substituído.",
  "Não normalize espaços e não escolha a primeira ocorrência.",
  "Preserve literalmente todo texto que não necessite correção.",
  "Devolva somente o JSON do schema.",
  "Não invente URLs.",
  "Se não houver comprovação, use NAO_CONFIRMADO.",
  "Preserve os marcadores [BLOCK_n].",
].join(" ");

const TOO_MANY_FOLLOW_UP = [
  "A resposta anterior declarou mais de 40 alterações.",
  "Não descarte uma correção jurídica para caber no limite: reduza reescritas editoriais e mantenha cada mudança material descrita.",
  "originalExcerpt deve corresponder ao texto original e revisedExcerpt ao texto revisado.",
  "Não reescreva trechos que não precisem de correção.",
  "Preserve ao máximo o texto original fora das correções necessárias.",
  "Devolva somente o JSON do schema.",
  "Não invente URLs.",
  "Se não houver comprovação, use NAO_CONFIRMADO.",
  "Preserve os marcadores [BLOCK_n].",
].join(" ");

const GENERIC_FOLLOW_UP = [
  "A resposta anterior não pôde ser aceita.",
  "Pesquise de novo nas fontes oficiais permitidas.",
  "Devolva somente o JSON do schema.",
  "Cada trecho substancialmente diferente do original precisa de um item em changes, com originalExcerpt e revisedExcerpt.",
  "Preserve a especificidade da fonte oficial: nunca substitua órgão, autoridade, tribunal, prazo ou quórum específico por expressões genéricas como 'autoridade competente' ou 'prazo legal'.",
  "Não invente URLs.",
  "Se não houver comprovação, use NAO_CONFIRMADO.",
  "Preserve os marcadores [BLOCK_n].",
].join(" ");

export function isCoverageFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; auditFailure?: unknown; diagnostics?: { auditFailure?: unknown; reason?: unknown } };
  if (record.auditFailure === "COVERAGE_FAILURE" || record.code === "uncovered_edits") return true;
  return record.diagnostics?.auditFailure === "COVERAGE_FAILURE" || record.diagnostics?.reason === "uncovered_edits";
}

export function reviewFollowUpInstruction(error: unknown): string {
  if (isCoverageFailure(error)) return COVERAGE_REPAIR_FOLLOW_UP;
  const code = error && typeof error === "object" && "code" in error ? (error as { code?: unknown }).code : "";
  if (code === "too_many_changes") return TOO_MANY_FOLLOW_UP;
  return GENERIC_FOLLOW_UP;
}

/** Follow-up enxuto: só patches recusados e o contexto literal já enviado. */
export function buildRejectedPatchFollowUp(input: {
  repairable: RepairablePatch[];
  acceptedIds: string[];
}): string {
  const lines = [
    "A resposta anterior teve patches recusados pelo servidor.",
    "Reenvie somente os patches recusados abaixo.",
    "Não refaça patches já validados.",
    "Não devolva o texto integral da aula.",
    "Não reescreva a aula.",
    "originalExcerpt, beforeContext e afterContext precisam ser literais e identificar uma única ocorrência no Markdown original.",
    "Não normalize espaços e não escolha a primeira ocorrência.",
    "Devolva somente o JSON do schema, com changes contendo apenas o reparo.",
    "Não invente URLs.",
    "Se não houver comprovação, use NAO_CONFIRMADO.",
    "Preserve os marcadores [BLOCK_n].",
  ];
  if (input.repairable.some((patch) => patch.reason === "court_family" || patch.reason === "diploma_evidence")) {
    lines.push(
      "Para patch de evidência, conserve originalExcerpt e revisedExcerpt byte a byte.",
      "Não retire tribunal, súmula, tema ou diploma para contornar a validação.",
      "Não troque órgão, prazo ou quórum específico por fórmula genérica.",
      "A evidência nova precisa estar no evidence[] deste change.",
      "Não aproveite sources[] de outro change nem a lista geral de fontes.",
      "A fonte precisa ser oficial e ter sido consultada nesta pesquisa.",
      "Se a fonte não comprovar este change, devolva NAO_CONFIRMADO."
    );
  }
  if (input.acceptedIds.length) {
    lines.push(`Patches já validados, que não devem ser reenviados: ${input.acceptedIds.join(", ")}.`);
  }
  for (const patch of input.repairable) {
    const parts = [
      `Patch recusado ${patch.id}.`,
      `Motivo: ${patch.reason}.`,
      `originalExcerpt: ${JSON.stringify(patch.originalExcerpt)}`,
      `revisedExcerpt: ${JSON.stringify(patch.revisedExcerpt)}`,
      `beforeContext: ${JSON.stringify(patch.beforeContext)}`,
      `afterContext: ${JSON.stringify(patch.afterContext)}`,
    ];
    if (patch.reason === "court_family" && patch.missingFamilies?.length) {
      parts.push(`Famílias sem evidência oficial neste change: ${patch.missingFamilies.join(", ")}.`);
    }
    if (patch.reason === "diploma_evidence" && patch.statuteTypes?.length) {
      parts.push(`Tipos de diploma ainda sem vínculo inequívoco neste change: ${patch.statuteTypes.join(", ")}.`);
    }
    lines.push(parts.join(" "));
  }
  return lines.join("\n");
}

function traceCounts(audit: AuditLessonResult): LegalReviewTraceCounts {
  return {
    servedModel: audit.model,
    verificationLevel: audit.verificationLevel,
    consultedSources: audit.consultedSources.length,
    changes: audit.changes.length,
    unverifiedClaims: audit.unverifiedClaims.length,
  };
}

export async function auditLessonWithOpenAI(input: AuditLessonInput): Promise<AuditLessonResult> {
  const client = input.callModel
    ? undefined
    : new OpenAI({ apiKey: requireKey(), maxRetries: OPENAI_REVIEW_SDK_MAX_RETRIES });
  const requestedModel = reviewModelName();
  const trace = input.trace ?? createLegalReviewTrace({ testMode: false, requestedModel, write: () => {} });
  const instructions = buildLegalReviewInstructions(input.reviewDate);
  const baseline = input.publishedContent || input.content;
  const propositionInventory = extractPropositionUnits(input.content);
  const propositionsFormatted = formatPropositionsForPrompt(propositionInventory);
  let userInput = buildUntrustedLessonInput({
    reviewDate: input.reviewDate,
    lessonId: input.lessonId,
    day: input.day,
    part: input.part,
    subject: input.subject,
    topic: input.topic,
    content: input.content,
    publishedContent: input.publishedContent,
    sectionIndex: input.sectionIndex,
    propositionsFormatted,
  });
  const startedAt = Date.now();
  const remaining = () => OPENAI_AUDIT_BUDGET_MS - (Date.now() - startedAt);

  const read = (current: ReviewModelResponse, timings?: { mainCallElapsedMs?: number }) => {
    const valStart = Date.now();
    trace.validationStart();
    try {
      const audit = interpretReviewResponse(current, baseline, requestedModel);
      const valElapsed = Date.now() - valStart;
      const remMs = remaining();
      const repairableCount = audit.repairablePatches?.length || 0;
      const lacksSources = !audit.webSearchUsed;
      const eligibility = computeFollowUpEligibility({
        repairablePatchCount: repairableCount,
        lacksSources,
        remainingMs: remMs,
        requiredRemainingMs: MIN_FOLLOW_UP_REMAINING_MS,
      });
      const validation: LegalAuditValidationLog | undefined = audit.validationLog
        ? {
          ...audit.validationLog,
          followUpEligible: eligibility.followUpEligible,
          followUpSkipReason: eligibility.followUpSkipReason,
          remainingMs: Math.max(0, remMs),
          requiredRemainingMs: MIN_FOLLOW_UP_REMAINING_MS,
          repairablePatchCount: repairableCount,
          ...(timings?.mainCallElapsedMs !== undefined ? { mainCallElapsedMs: timings.mainCallElapsedMs } : {}),
          validationElapsedMs: valElapsed,
        }
        : undefined;
      trace.validationEnd(traceCounts(audit), undefined, validation);
      delete audit.validationLog;
      return audit;
    } catch (error) {
      trace.validationEnd(undefined, error);
      trace.noteFailure(error, "validation");
      return error instanceof Error ? error : new Error("A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.");
    }
  };

  let response: ReviewModelResponse | null = null;
  let mainCallElapsedMs = 0;
  for (let tryNumber = 0; tryNumber < 2; tryNumber += 1) {
    if (tryNumber > 0 && remaining() < MIN_GENERATION_RETRY_REMAINING_MS) break;
    const timeoutMs = Math.min(OPENAI_ATTEMPT_TIMEOUT_MS, remaining());
    if (timeoutMs < 15_000) break;
    trace.openaiStart();
    const callStart = Date.now();
    try {
      response = input.callModel
        ? await input.callModel({ model: requestedModel, instructions, userInput, lessonText: input.content, timeoutMs })
        : await createResponse(client as OpenAI, requestedModel, instructions, userInput, input.content, timeoutMs);
      mainCallElapsedMs = Date.now() - callStart;
      trace.openaiEnd(response.model);
      break;
    } catch (error) {
      if (tryNumber === 0 && isTimeout(error) && remaining() >= MIN_GENERATION_RETRY_REMAINING_MS) {
        trace.noteFailure(error, "openai");
        trace.retry("timeout");
        continue;
      }
      if (isTimeout(error) && tryNumber > 0) trace.noteFailure(openAiTimeoutDiagnostic(OPENAI_TIMEOUT_GENERATION_RETRY), "openai");
      else trace.noteFailure(error, "openai");
      const failureErr = reviewFailureForOpenAIError(error);
      const diagnostic = buildFailureDiagnostic({
        rejectionReason: isTimeout(error) ? "OPENAI_TIMEOUT" : "OPENAI_REQUEST_FAILED",
        rejectionDetail: error instanceof Error ? error.message : String(error),
        elapsedMs: Date.now() - callStart,
        configuredTimeoutMs: timeoutMs,
        configuredBudgetMs: OPENAI_AUDIT_BUDGET_MS,
      });
      (failureErr as any).diagnostic = diagnostic;
      persistDiagnosticFiles(diagnostic);
      throw failureErr;
    }
  }
  if (!response) {
    const failure = new Error("A OpenAI não concluiu a auditoria. A aula publicada não foi alterada.");
    const diagnostic = buildFailureDiagnostic({
      rejectionReason: "OPENAI_NO_RESPONSE",
      rejectionDetail: "Nenhuma resposta retornada após esgotar tentativas",
      elapsedMs: Date.now() - startedAt,
      configuredTimeoutMs: Math.min(OPENAI_ATTEMPT_TIMEOUT_MS, remaining()),
      configuredBudgetMs: OPENAI_AUDIT_BUDGET_MS,
    });
    (failure as any).diagnostic = diagnostic;
    persistDiagnosticFiles(diagnostic);
    trace.noteFailure(failure, "openai");
    throw failure;
  }

  let parsed = read(response, { mainCallElapsedMs });
  if (parsed instanceof Error) {
    if ((parsed as any).diagnostic) {
      (parsed as any).diagnostic.elapsedMs = mainCallElapsedMs;
      (parsed as any).diagnostic.configuredTimeoutMs = Math.min(OPENAI_ATTEMPT_TIMEOUT_MS, remaining());
      (parsed as any).diagnostic.configuredBudgetMs = OPENAI_AUDIT_BUDGET_MS;
      persistDiagnosticFiles((parsed as any).diagnostic, (parsed as any).diagnostic.rawOutputText);
    }
    trace.noteFailure(parsed, "validation");
    throw parsed;
  }
  const repairable = parsed.repairablePatches ?? [];
  const lacksSources = !parsed.webSearchUsed;
  let repairCallCount = 0;
  const firstUrls = extractConsultedSourceUrls(response.output);
  // No máximo um follow-up. Patches já validados não são refeitos.
  if ((repairable.length > 0 || lacksSources) && remaining() >= MIN_FOLLOW_UP_REMAINING_MS) {
    const followUpTimeoutMs = Math.min(OPENAI_ATTEMPT_TIMEOUT_MS, remaining());
    const patchFollowUp = repairable.length > 0;
    trace.retry(patchFollowUp ? "rejected_patches" : "missing_sources");
    const followUser = patchFollowUp
      ? buildRejectedPatchFollowUp({
        repairable,
        acceptedIds: (parsed.appliedPatchInputs ?? []).map((item) => item.id),
      })
      : `${userInput}\n\n${reviewFollowUpInstruction(parsed)}`;
    trace.openaiStart();
    repairCallCount = 1;
    try {
      response = input.callModel
        ? await input.callModel({
          model: requestedModel,
          instructions,
          userInput: followUser,
          lessonText: input.content,
          timeoutMs: followUpTimeoutMs,
        })
        : await createResponse(
        client as OpenAI,
        requestedModel,
        instructions,
        followUser,
        input.content,
        followUpTimeoutMs,
        "high",
        12000
      );
      trace.openaiEnd(response.model);
      const followParsed = read(response);
      if (!(followParsed instanceof Error)) {
        if (patchFollowUp) {
          const followUrls = extractConsultedSourceUrls(response.output);
          const consultedUrls = [...firstUrls, ...followUrls];
          const merged = mergePatchAudits(
            baseline,
            parsed,
            followParsed,
            { webSearchExecuted: consultedUrls.length > 0, consultedUrls },
            describeConsultedSources(consultedUrls)
          );
          parsed = {
            ...parsed,
            ...merged,
            auditedUnits: merged.auditedUnits,
            model: response.model || parsed.model,
            webSearchUsed: consultedUrls.length > 0,
            usage: readUsage(response.usage) ?? parsed.usage,
          };
        } else {
          parsed = followParsed;
        }
      }
    } catch (error) {
      if (isTimeout(error)) trace.noteFailure(openAiTimeoutDiagnostic(OPENAI_TIMEOUT_FOLLOW_UP), "openai");
      else trace.noteFailure(error, "openai");
      throw reviewFailureForOpenAIError(error);
    }
  }

  // Validação proposicional determinística (V2.3.2-B)
  const initialValidation = validateAuditedUnits(
    propositionInventory,
    parsed.auditedUnits || [],
    parsed.changes,
    parsed.consultedSources
  );
  const unitStatuses = new Map<string, PropositionAuditStatus>(initialValidation.unitStatuses);
  let pendingUnits = initialValidation.pendingUnits;

  // Passagem de Cobertura Adaptativa / Dirigida:
  const coverageDecision = shouldRunCoveragePass({
    content: input.content,
    parsedMain: parsed,
    sectionIndex: input.sectionIndex,
  });

  const shouldRunCoverage = input.enableCoveragePass !== undefined
    ? input.enableCoveragePass
    : input.callModel
      ? false
      : (pendingUnits.length > 0 || coverageDecision.run);

  let coverageExecuted = false;
  let coverageCallCount = 0;
  let coverageSkipReason: string | undefined = undefined;
  let directedBatchesCount = 0;

  if (!shouldRunCoverage) {
    coverageSkipReason = input.callModel && input.enableCoveragePass === undefined
      ? "disabled_in_test_mode"
      : (pendingUnits.length === 0 ? "all_propositions_resolved" : coverageDecision.skipReason || "sufficient_main_coverage");
  } else if (remaining() < MIN_FOLLOW_UP_REMAINING_MS) {
    coverageSkipReason = "insufficient_remaining";
  } else if (pendingUnits.length > 0) {
    // COVERAGE DIRIGIDA: lotes compactos apenas para pendências
    const directedBatches = prepareDirectedCoverageBatches(pendingUnits, DIRECTED_COVERAGE_BATCH_SIZE);
    directedBatchesCount = directedBatches.length;
    const acceptedPatchesForCoverage = (parsed.changes || [])
      .filter((c) => c.confirmation === "CONFIRMADO")
      .map((c) => ({
        id: c.id,
        type: c.type,
        originalExcerpt: c.originalExcerpt,
        revisedExcerpt: c.revisedExcerpt,
        reason: c.reason,
      }));
    const directedInstructions = buildDirectedCoverageInstructions(input.reviewDate);

    for (const batch of directedBatches) {
      if (remaining() < MIN_FOLLOW_UP_REMAINING_MS) {
        break; // unidades pendentes continuam NOT_AUDITED / INDETERMINATE
      }
      coverageExecuted = true;
      coverageCallCount += 1;
      const coverageTimeoutMs = Math.min(OPENAI_ATTEMPT_TIMEOUT_MS, remaining());
      const directedUser = buildDirectedCoverageUntrustedInput({
        reviewDate: input.reviewDate,
        lessonId: input.lessonId,
        day: input.day,
        part: input.part,
        subject: input.subject,
        topic: input.topic,
        batchPayload: batch.formattedPayload,
        acceptedPatches: acceptedPatchesForCoverage,
      });

      trace.openaiStart();
      try {
        const coverageResponse = input.callModel
          ? await input.callModel({
              model: requestedModel,
              instructions: directedInstructions,
              userInput: directedUser,
              lessonText: input.content,
              timeoutMs: coverageTimeoutMs,
              schema: DIRECTED_COVERAGE_JSON_SCHEMA,
            })
          : await createResponse(
              client as OpenAI,
              requestedModel,
              directedInstructions,
              directedUser,
              input.content,
              coverageTimeoutMs,
              "high",
              8000,
              DIRECTED_COVERAGE_JSON_SCHEMA,
              "coverage_dirigida"
            );
        trace.openaiEnd(coverageResponse.model);

        const covUrls = extractConsultedSourceUrls(coverageResponse.output);
        const currentUrls = (parsed.consultedSources || []).map((s) => s.url);
        const combinedUrls = [...currentUrls, ...covUrls];
        const covConsulted = describeConsultedSources(combinedUrls);

        const text = (coverageResponse.output_text || "").trim();
        let covData: { coverageAudits?: DirectedCoverageAuditItem[]; reviewNotes?: string; changes?: unknown[] } | null = null;
        try {
          covData = JSON.parse(text);
        } catch {
          const contentText = (coverageResponse.output as any)?.find?.((i: any) => i.type === "message")?.content?.find?.((c: any) => c.type === "text")?.text;
          if (contentText) {
            try { covData = JSON.parse(contentText); } catch {}
          }
        }

        if (covData && Array.isArray((covData as any).changes) && !Array.isArray(covData.coverageAudits)) {
          const coverageParsed = read(coverageResponse);
          if (!(coverageParsed instanceof Error) && coverageParsed.changes && coverageParsed.changes.length > 0) {
            const merged = mergeCoverageAudits(
              baseline,
              parsed,
              coverageParsed,
              { webSearchExecuted: combinedUrls.length > 0, consultedUrls: combinedUrls },
              describeConsultedSources(combinedUrls)
            );
            parsed = {
              ...parsed,
              ...merged,
              model: coverageResponse.model || parsed.model,
              webSearchUsed: combinedUrls.length > 0,
            };
          }
        } else if (covData && Array.isArray(covData.coverageAudits)) {
          const newCoverageChanges: LegalReviewChange[] = [];
          const incomingCoverageUnits: AuditedPropositionInput[] = [];

          for (const item of covData.coverageAudits) {
            const unit = propositionInventory.find((u) => u.id === item.id);
            if (!unit) continue;
            if (item.status === "AUDITED_CORRECT") {
              let evidenceOk = true;
              if (unit.riskLevel === "HIGH") {
                const rawEvidenceIds = Array.isArray(item.evidenceSourceIds)
                  ? item.evidenceSourceIds.filter((id) => typeof id === "string" && Boolean(id.trim()))
                  : [];
                if (rawEvidenceIds.length === 0) {
                  evidenceOk = false;
                } else {
                  const resolvedSources = covConsulted.filter((s) =>
                    rawEvidenceIds.some(
                      (ref) => ref === s.sourceId || canonicalSourceUrl(ref) === canonicalSourceUrl(s.url)
                    )
                  );
                  evidenceOk = resolvedSources.length > 0 && coverageEvidenceSatisfied(unit, resolvedSources);
                }
              }
              unitStatuses.set(unit.id, evidenceOk ? "AUDITED_CORRECT" : "INDETERMINATE");
              incomingCoverageUnits.push({
                id: unit.id,
                status: "AUDITED_CORRECT",
                changeId: null,
                evidenceSourceIds: Array.isArray(item.evidenceSourceIds) ? item.evidenceSourceIds : [],
              });
            } else if (item.status === "AUDITED_INCORRECT") {
              if (item.change && item.change.originalExcerpt && item.change.revisedExcerpt) {
                const evidenceUrl = item.change.evidenceUrl;
                const isOfficial = evidenceUrl ? isOfficialLegalUrl(evidenceUrl) : false;
                const evidenceItem = evidenceUrl ? [{
                  institution: item.change.institution || "OFICIAL",
                  title: item.change.evidenceTitle || "Fonte oficial",
                  url: evidenceUrl,
                  official: isOfficial,
                  consulted: true,
                  supportsChange: true,
                  supportExplanation: item.change.reason || "Correção proposicional na passagem de cobertura.",
                  sourceType: (unit.type === "PRECEDENT_MAPPING" || unit.type === "SUMULA_MAPPING" || unit.type === "THEME_MAPPING" ? "ACORDAO" : "LEI") as any,
                }] : [];
                const sourceItem = evidenceUrl ? [{
                  title: item.change.evidenceTitle || "Fonte oficial",
                  url: evidenceUrl,
                  official: isOfficial,
                  institution: item.change.institution || "OFICIAL",
                }] : [];
                const ch: LegalReviewChange = {
                  id: `cov_${unit.id}`,
                  type: "CORRECAO",
                  severity: unit.riskLevel === "HIGH" ? "ALTA" : "MEDIA",
                  category: (unit.type === "PRECEDENT_MAPPING" || unit.type === "SUMULA_MAPPING" || unit.type === "THEME_MAPPING" ? "JURISPRUDENCIA" : "LEGISLACAO") as any,
                  originalExcerpt: item.change.originalExcerpt,
                  revisedExcerpt: item.change.revisedExcerpt,
                  reason: item.change.reason || "Correção na passagem de cobertura dirigida.",
                  verified: isOfficial,
                  confirmation: isOfficial ? "CONFIRMADO" : "NAO_CONFIRMADO",
                  sources: sourceItem,
                  evidence: evidenceItem,
                };
                newCoverageChanges.push(ch);
                unitStatuses.set(unit.id, isOfficial ? "AUDITED_INCORRECT" : "INDETERMINATE");
                incomingCoverageUnits.push({
                  id: unit.id,
                  status: "AUDITED_INCORRECT",
                  changeId: ch.id,
                  evidenceSourceIds: [],
                });
              } else {
                unitStatuses.set(unit.id, "INDETERMINATE");
                incomingCoverageUnits.push({
                  id: unit.id,
                  status: "AUDITED_INCORRECT",
                  changeId: null,
                  evidenceSourceIds: [],
                });
              }
            }
          }

          // Incorpora auditedUnits de cobertura aditivamente por ID
          parsed.auditedUnits = mergeAuditedPropositionUnits(
            parsed.auditedUnits,
            incomingCoverageUnits,
            propositionInventory
          );

          if (newCoverageChanges.length > 0) {
            const syntheticCoverageAudit: NormalizedAudit = {
              outcome: "ALTERACOES_NECESSARIAS",
              confidence: parsed.confidence,
              verificationLevel: "VERIFICADO_COM_FONTES",
              summary: { totalChanges: newCoverageChanges.length, corrections: newCoverageChanges.length, additions: 0, removals: 0, updates: 0, precisions: 0, restructures: 0 },
              changes: newCoverageChanges,
              unverifiedClaims: [],
              reviewedMarkdown: parsed.reviewedMarkdown,
              reviewNotes: covData?.reviewNotes || "Cobertura dirigida concluída.",
              consultedSources: covConsulted,
              auditedUnits: incomingCoverageUnits,
            };
            const merged = mergeCoverageAudits(
              baseline,
              parsed,
              syntheticCoverageAudit,
              { webSearchExecuted: combinedUrls.length > 0, consultedUrls: combinedUrls },
              describeConsultedSources(combinedUrls)
            );
            parsed = {
              ...parsed,
              ...merged,
              auditedUnits: parsed.auditedUnits,
              model: coverageResponse.model || parsed.model,
              webSearchUsed: combinedUrls.length > 0,
            };
          } else {
            parsed = {
              ...parsed,
              consultedSources: covConsulted,
              webSearchUsed: combinedUrls.length > 0,
            };
          }
        }

        const covUsage = readUsage(coverageResponse.usage);
        if (covUsage) {
          parsed.usage = {
            inputTokens: (parsed.usage?.inputTokens || 0) + covUsage.inputTokens,
            outputTokens: (parsed.usage?.outputTokens || 0) + covUsage.outputTokens,
            totalTokens: (parsed.usage?.totalTokens || 0) + covUsage.totalTokens,
          };
        }
      } catch (coverageError) {
        trace.noteFailure(coverageError, "coverage");
      }
    }
  } else if (input.enableCoveragePass === true) {
    // Compatibilidade: se enableCoveragePass foi forçado e pendingUnits era 0
    coverageExecuted = true;
    coverageCallCount = 1;
    const coverageTimeoutMs = Math.min(OPENAI_ATTEMPT_TIMEOUT_MS, remaining());
    const acceptedPatchesForCoverage = (parsed.changes || [])
      .filter((c) => c.confirmation === "CONFIRMADO")
      .map((c) => ({
        id: c.id,
        type: c.type,
        originalExcerpt: c.originalExcerpt,
        revisedExcerpt: c.revisedExcerpt,
        reason: c.reason,
      }));
    const coverageInstructions = buildCoverageReviewInstructions(input.reviewDate);
    const coverageUser = buildCoverageUntrustedInput({
      reviewDate: input.reviewDate,
      lessonId: input.lessonId,
      day: input.day,
      part: input.part,
      subject: input.subject,
      topic: input.topic,
      content: input.content,
      acceptedPatches: acceptedPatchesForCoverage,
      sectionIndex: input.sectionIndex,
    });

    trace.openaiStart();
    try {
      const coverageResponse = input.callModel
        ? await input.callModel({
            model: requestedModel,
            instructions: coverageInstructions,
            userInput: coverageUser,
            lessonText: input.content,
            timeoutMs: coverageTimeoutMs,
          })
        : await createResponse(
            client as OpenAI,
            requestedModel,
            coverageInstructions,
            coverageUser,
            input.content,
            coverageTimeoutMs,
            "high",
            12000
          );
      trace.openaiEnd(coverageResponse.model);
      const coverageParsed = read(coverageResponse);
      if (!(coverageParsed instanceof Error)) {
        if (coverageParsed.changes && coverageParsed.changes.length > 0) {
          const coverageUrls = extractConsultedSourceUrls(coverageResponse.output);
          const currentUrls = (parsed.consultedSources || []).map((s) => s.url);
          const combinedUrls = [...currentUrls, ...coverageUrls];
          const merged = mergeCoverageAudits(
            baseline,
            parsed,
            coverageParsed,
            { webSearchExecuted: combinedUrls.length > 0, consultedUrls: combinedUrls },
            describeConsultedSources(combinedUrls)
          );
          const covUsage = readUsage(coverageResponse.usage);
          parsed = {
            ...parsed,
            ...merged,
            model: coverageResponse.model || parsed.model,
            webSearchUsed: combinedUrls.length > 0,
            usage: {
              inputTokens: (parsed.usage?.inputTokens || 0) + (covUsage?.inputTokens || 0),
              outputTokens: (parsed.usage?.outputTokens || 0) + (covUsage?.outputTokens || 0),
              totalTokens: (parsed.usage?.totalTokens || 0) + (covUsage?.totalTokens || 0),
            },
          };
        }
      }
    } catch (coverageError) {
      trace.noteFailure(coverageError, "coverage");
    }
  }

  // Completeness Gate (FASE 14 / FASE 15 / V2.3.2-H):
  const finalValidation = validateAuditedUnits(
    propositionInventory,
    parsed.auditedUnits || [],
    parsed.changes,
    parsed.consultedSources
  );

  const consolidatedStatuses = new Map<string, PropositionAuditStatus>();
  for (const u of propositionInventory) {
    const finalSt = finalValidation.unitStatuses.get(u.id);
    const directedSt = unitStatuses.get(u.id);
    if (finalSt && finalSt !== "NOT_AUDITED") {
      consolidatedStatuses.set(u.id, finalSt);
    } else if (directedSt && directedSt !== "NOT_AUDITED") {
      consolidatedStatuses.set(u.id, directedSt);
    } else {
      consolidatedStatuses.set(u.id, "NOT_AUDITED");
    }
  }

  const coverageSummary = evaluateCoverageCompleteness(propositionInventory, consolidatedStatuses, {
    attributedCorrectCount: finalValidation.attributedCorrectCount,
    missingAttributionCount: finalValidation.missingAttributionCount,
    invalidAttributionCount: finalValidation.invalidAttributionCount,
  });
  parsed.coverageSummary = coverageSummary;
  if (!coverageSummary.complete && parsed.verificationLevel === "VERIFICADO_COM_FONTES") {
    parsed.verificationLevel = "VERIFICACAO_PARCIAL";
  }

  const mainCallCount = 1;
  const totalModelCalls = mainCallCount + repairCallCount + coverageCallCount;
  const coverageEligible = pendingUnits.length > 0 || coverageDecision.run;
  const coverageReasonCodes = coverageDecision.reasons;

  const finalResult: AuditLessonResult = {
    ...parsed,
    model: parsed.model,
    webSearchUsed: parsed.webSearchUsed,
    coverageEligible,
    coverageExecuted,
    coverageSkipReason: coverageExecuted ? undefined : (coverageSkipReason || coverageDecision.skipReason || "sufficient_main_coverage"),
    coverageReasonCodes,
    mainCallCount,
    coverageCallCount,
    repairCallCount,
    totalModelCalls,
    coverageSummary,
    propositionCount: coverageSummary.total,
    highRiskPropositionCount: coverageSummary.highRiskTotal,
    auditedCorrectCount: coverageSummary.auditedCorrect,
    auditedIncorrectCount: coverageSummary.auditedIncorrect,
    notAuditedCount: coverageSummary.notAudited,
    indeterminateCount: coverageSummary.indeterminate,
    coverageRate: coverageSummary.coverageRate,
    highRiskCoverageRate: coverageSummary.highRiskCoverageRate,
    directedCoverageEligible: pendingUnits.length > 0,
    directedCoverageBatchCount: directedBatchesCount,
    coverageCompletenessPassed: coverageSummary.complete,
    pendingByType: coverageSummary.pendingByType,
    pendingByRisk: coverageSummary.pendingByRisk,
  };

  delete finalResult.repairablePatches;
  delete finalResult.appliedPatchInputs;
  delete finalResult.validationLog;
  delete finalResult.autonomousClaims;
  return finalResult;
}

export function buildOfficialSupplementExecutor(customCall?: (params: {
  lessonId: string;
  pendingItems: SupplementPendingItem[];
  budget: { maxTokens: number; maxDurationMs: number; maxCostUsd: number };
  signal?: AbortSignal;
}) => Promise<{
  status: "completed" | "inconclusive";
  tokensUsed: number;
  durationMs: number;
  costUsd: number;
  findings: SupplementFindingItem[];
  finalNote: string;
}>): LegalSupplementExecutor {
  if (customCall) {
    return { supplement: customCall };
  }

  return {
    async supplement(params: {
      lessonId: string;
      pendingItems: SupplementPendingItem[];
      budget: { maxTokens: number; maxDurationMs: number; maxCostUsd: number };
      signal?: AbortSignal;
    }) {
      const startTime = Date.now();
      const apiKey = (process.env.OPENAI_API_KEY || "").trim();

      // Ambiente offline / sem chave de API: retorna resultado estruturado seguro sem falhar
      if (!apiKey) {
        return {
          status: "inconclusive" as const,
          tokensUsed: 0,
          durationMs: Date.now() - startTime,
          costUsd: 0,
          findings: params.pendingItems.map((p) => {
            const item: SupplementFindingItem = {
              pendingId: p.id,
              statementAnalyzed: p.excerpt,
              officialSourceConsulted: "Nenhuma (ambiente offline sem chave de API)",
              verifiableUrl: "",
              relevantExcerptOrBasis: "",
              status: "nao_verificada" as const,
              objectiveJustification: "Ambiente de execução sem OPENAI_API_KEY configurada.",
              foundOfficialEvidence: false,
            };
            if (typeof p.changeId === "string" && p.changeId.trim()) {
              item.changeId = p.changeId.trim();
            }
            return item;
          }),
          finalNote: "Execução concluída em modo offline sem chave de API configurada.",
        };
      }

      const client = new OpenAI({ apiKey, maxRetries: 0 });
      const requestedModel = reviewModelName();

      const instructions = [
        "Você é o auditor jurídico do ATHENA encarregado exclusivamente de verificar pendências jurídicas pontuais em fontes oficiais brasileiras.",
        "DIRETRIZES CRÍTICAS:",
        "- NÃO realize uma nova auditoria integral.",
        "- NÃO reescreva o texto da aula.",
        "- NÃO proponha novas alterações ou edições no Markdown.",
        "- NÃO invente URLs.",
        "- Limite-se estritamente às pendências jurídicas fornecidas no input.",
        "- Para cada pendência, pesquise somente em fontes oficiais brasileiras (legislação federal em planalto.gov.br, atos normativos do CNJ em atos.cnj.jus.br, jurisprudência do STF em stf.jus.br ou STJ em stj.jus.br).",
        "- Classifique cada pendência em: 'confirmada', 'refutada' ou 'nao_verificada'.",
        "- Se a afirmação estiver de acordo com o ato normativo ou súmula/tese oficial vigente, marque 'confirmada' e indique a citação normativa exata.",
        "- Se colidir com ato vigente, revogado ou súmula cancelada, marque 'refutada'.",
        "- Se não encontrar prova oficial inequívoca, marque 'nao_verificada'.",
        "- Preencha o JSON estritamente conforme o schema.",
      ].join("\n");

      const userInput = JSON.stringify({
        instrucao: "Verifique exclusivamente as seguintes pendências jurídicas em fontes oficiais brasileiras:",
        pendencias: params.pendingItems.map((p) => ({
          id: p.id,
          tipoOrigem: p.sourceType,
          changeId: p.changeId,
          afirmacaoOuTrecho: p.excerpt,
          motivoOuContexto: p.reason,
        })),
      }, null, 2);

      const maxOutputTokens = Math.min(params.budget.maxTokens || 4000, 4000);
      const executionTimeoutMs = params.budget.maxDurationMs || 120_000;

      console.log(`[supplement-executor] Disparando chamada OpenAI com timeout de ${executionTimeoutMs}ms para ${params.pendingItems.length} pendências da aula ${params.lessonId}...`);

      const response = await client.responses.create(
        {
          model: requestedModel,
          instructions,
          input: [
            {
              role: "user",
              content: userInput,
            },
          ],
          tools: [
            {
              type: "web_search" as const,
              external_web_access: true,
              search_context_size: "high" as const,
              user_location: {
                type: "approximate" as const,
                country: "BR",
                timezone: "America/Sao_Paulo",
              },
              filters: {
                allowed_domains: ["planalto.gov.br", "atos.cnj.jus.br", "stf.jus.br", "stj.jus.br", "camara.leg.br", "senado.leg.br"],
              },
            },
          ],
          tool_choice: "required" as const,
          reasoning: { effort: "medium" },
          max_output_tokens: maxOutputTokens,
          text: {
            format: {
              type: "json_schema" as const,
              name: "complementacao_juridica",
              strict: true,
              schema: LEGAL_SUPPLEMENT_JSON_SCHEMA,
            },
          },
        },
        {
          timeout: executionTimeoutMs,
          signal: params.signal,
          maxRetries: 0,
        }
      );

      const durationMs = Date.now() - startTime;
      const inputTokens = Number(response.usage?.input_tokens || 0);
      const outputTokens = Number(response.usage?.output_tokens || 0);
      const totalTokens = Number(response.usage?.total_tokens || inputTokens + outputTokens);
      const costUsd = Number(((inputTokens * 0.0000025) + (outputTokens * 0.00001)).toFixed(6));

      console.log(`[supplement-executor] OpenAI respondeu com sucesso em ${durationMs}ms: tokens=${totalTokens}, custo=$${costUsd}`);

      const rawText = (response.output_text || "").trim();
      let parsed: { findings: any[]; finalNote: string };
      try {
        parsed = JSON.parse(rawText);
      } catch (e: any) {
        return {
          status: "inconclusive" as const,
          tokensUsed: totalTokens,
          durationMs,
          costUsd,
          findings: [],
          finalNote: `Resposta do provedor não pôde ser decodificada como JSON válido: ${e?.message || "erro de parsing"}`,
        };
      }

      const validFindings: SupplementFindingItem[] = (parsed.findings || []).map((f) => {
        const rawUrl = String(f.verifiableUrl || "").trim();
        const isOfficial = rawUrl ? isOfficialLegalUrl(rawUrl) : false;
        const normalizedUrl = isOfficial ? canonicalSourceUrl(rawUrl) : rawUrl;

        const evidenceList: import("../lib/legalReviewTypes").LegalReviewEvidence[] = isOfficial && f.foundOfficialEvidence ? [
          {
            institution: String(f.officialSourceConsulted || "Planalto/Tribunal"),
            title: String(f.officialSourceConsulted || "Fonte Oficial"),
            url: normalizedUrl,
            official: true,
            consulted: true,
            supportsChange: true,
            supportExplanation: String(f.objectiveJustification || "Evidência oficial obtida na complementação."),
            sourceType: "LEI",
          },
        ] : [];

        const sourcesList: import("../lib/legalReviewTypes").LegalReviewSource[] = isOfficial ? [
          {
            title: String(f.officialSourceConsulted || "Fonte Oficial"),
            url: normalizedUrl,
            official: true,
            institution: String(f.officialSourceConsulted || "Planalto/Tribunal"),
          },
        ] : [];

        const finding: SupplementFindingItem = {
          pendingId: String(f.pendingId || ""),
          statementAnalyzed: String(f.statementAnalyzed || ""),
          officialSourceConsulted: String(f.officialSourceConsulted || ""),
          verifiableUrl: normalizedUrl,
          relevantExcerptOrBasis: String(f.relevantExcerptOrBasis || ""),
          status: f.status === "confirmada" || f.status === "refutada" ? f.status : "nao_verificada",
          objectiveJustification: String(f.objectiveJustification || ""),
          foundOfficialEvidence: Boolean(f.foundOfficialEvidence && isOfficial),
          evidence: evidenceList,
          sources: sourcesList,
        };

        if (typeof f.changeId === "string" && f.changeId.trim()) {
          finding.changeId = f.changeId.trim();
        }

        return finding;
      });

      const hasOfficialFindings = validFindings.some((f) => f.foundOfficialEvidence);
      const status = hasOfficialFindings ? ("completed" as const) : ("inconclusive" as const);

      return {
        status,
        tokensUsed: totalTokens,
        durationMs,
        costUsd,
        findings: validFindings,
        finalNote: String(parsed.finalNote || "Complementação pontual finalizada."),
      };
    },
  };
}
