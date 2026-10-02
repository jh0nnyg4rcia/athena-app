/**
 * Chamada OpenAI da auditoria. A chave fica só em OPENAI_API_KEY no processo.
 * Este módulo não pode ser importado pelo cliente.
 */
import OpenAI from "openai";
import {
  INVALID_AUDIT_MESSAGE,
  LEGAL_REVIEW_JSON_SCHEMA,
  describeConsultedSources,
  explainLegalAuditFailure,
  mergePatchAudits,
  normalizeLegalAudit,
  type NormalizedAudit,
  type RepairablePatch,
} from "../lib/legalReviewValidate";
import type { LegalAuditValidationLog, ValidationIncompleteReason, ValidationReasonCode, ValidationResponseStatus } from "../lib/legalReviewDiagnostics";
import { searchDomainsForLesson } from "../lib/legalReviewSources";
import { buildLegalReviewInstructions, buildUntrustedLessonInput } from "./legalReviewPrompt";
import { redactProviderError } from "./openaiServerService";
import { createLegalReviewTrace, type LegalReviewTrace, type LegalReviewTraceCounts } from "./legalReviewTrace";

const DEFAULT_OPENAI_REVIEW_MODEL = "gpt-5.6";
/** A Function tem 600s. Este orçamento deixa validação, Firestore e a resposta HTTP de fora da espera da OpenAI. */
export const OPENAI_AUDIT_BUDGET_MS = 250_000;
export const OPENAI_ATTEMPT_TIMEOUT_MS = 200_000;
/** Nova geração só começa se ainda houver orçamento para outra tentativa de 200s. */
export const MIN_GENERATION_RETRY_REMAINING_MS = 200_000;
/** Follow-up só começa se ainda houver pelo menos 90s. */
export const MIN_FOLLOW_UP_REMAINING_MS = 90_000;
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
  /** Só testes locais. Produção usa a Responses API. */
  callModel?: (input: {
    model: string;
    instructions: string;
    userInput: string;
    lessonText: string;
    timeoutMs: number;
  }) => Promise<ReviewModelResponse>;
}

export interface AuditLessonResult extends NormalizedAudit {
  model: string;
  webSearchUsed: boolean;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}

export interface ReviewModelResponse {
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

function invalidAuditError(log: LegalAuditValidationLog): Error {
  return Object.assign(new Error(INVALID_AUDIT_MESSAGE), { validationLog: log });
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
    max_output_tokens: 12000,
    text: {
      format: {
        type: "json_schema" as const,
        name: "auditoria_juridica",
        strict: true,
        schema: LEGAL_REVIEW_JSON_SCHEMA,
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
    throw new Error(
      `O modelo que respondeu (${response.model || "desconhecido"}) não é o modelo solicitado (${requestedModel}). A revisão não foi concluída. A aula publicada não foi alterada.`
    );
  }
  if (response.error) throw invalidAuditError(rejectedResponseLog("RESPONSE_ERROR", response));
  if (response.status === "incomplete") {
    throw invalidAuditError(rejectedResponseLog("RESPONSE_INCOMPLETE", response, incompleteReasonOf(response)));
  }
  if (response.status === "failed") throw invalidAuditError(rejectedResponseLog("RESPONSE_FAILED", response));
  const text = (response.output_text || "").trim();
  if (!text) throw invalidAuditError(rejectedResponseLog("EMPTY_OUTPUT", response));
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw invalidAuditError(rejectedResponseLog("JSON_PARSE_FAILED", response));
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
  reasoningEffort: "medium" | "high" = "medium"
) {
  return client.responses.create(
    buildReviewCreateParams({ model, instructions, userInput, lessonText, reasoningEffort }),
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
  if (input.acceptedIds.length) {
    lines.push(`Patches já validados, que não devem ser reenviados: ${input.acceptedIds.join(", ")}.`);
  }
  for (const patch of input.repairable) {
    lines.push(
      [
        `Patch recusado ${patch.id}.`,
        `Motivo: ${patch.reason}.`,
        `originalExcerpt: ${JSON.stringify(patch.originalExcerpt)}`,
        `revisedExcerpt: ${JSON.stringify(patch.revisedExcerpt)}`,
        `beforeContext: ${JSON.stringify(patch.beforeContext)}`,
        `afterContext: ${JSON.stringify(patch.afterContext)}`,
      ].join(" ")
    );
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
  });
  const startedAt = Date.now();
  const remaining = () => OPENAI_AUDIT_BUDGET_MS - (Date.now() - startedAt);

  const read = (current: ReviewModelResponse) => {
    trace.validationStart();
    try {
      const audit = interpretReviewResponse(current, baseline, requestedModel);
      const validation = audit.validationLog
        ? {
          ...audit.validationLog,
          followUpEligible:
            ((audit.repairablePatches?.length || 0) > 0 || !audit.webSearchUsed)
            && remaining() >= MIN_FOLLOW_UP_REMAINING_MS,
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
  for (let tryNumber = 0; tryNumber < 2; tryNumber += 1) {
    if (tryNumber > 0 && remaining() < MIN_GENERATION_RETRY_REMAINING_MS) break;
    const timeoutMs = Math.min(OPENAI_ATTEMPT_TIMEOUT_MS, remaining());
    if (timeoutMs < 15_000) break;
    trace.openaiStart();
    try {
      response = input.callModel
        ? await input.callModel({ model: requestedModel, instructions, userInput, lessonText: input.content, timeoutMs })
        : await createResponse(client as OpenAI, requestedModel, instructions, userInput, input.content, timeoutMs);
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
      throw reviewFailureForOpenAIError(error);
    }
  }
  if (!response) {
    const failure = new Error("A OpenAI não concluiu a auditoria. A aula publicada não foi alterada.");
    trace.noteFailure(failure, "openai");
    throw failure;
  }

  let parsed = read(response);
  if (parsed instanceof Error) {
    trace.noteFailure(parsed, "validation");
    throw parsed;
  }
  const repairable = parsed.repairablePatches ?? [];
  const lacksSources = !parsed.webSearchUsed;
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
        "high"
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

  delete parsed.repairablePatches;
  delete parsed.appliedPatchInputs;
  delete parsed.validationLog;
  return parsed;
}
