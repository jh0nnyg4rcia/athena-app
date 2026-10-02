/**
 * Chamada OpenAI da auditoria. A chave fica só em OPENAI_API_KEY no processo.
 * Este módulo não pode ser importado pelo cliente.
 */
import OpenAI from "openai";
import {
  LEGAL_REVIEW_JSON_SCHEMA,
  explainLegalAuditFailure,
  normalizeLegalAudit,
  type NormalizedAudit,
} from "../lib/legalReviewValidate";
import { searchDomainsForLesson } from "../lib/legalReviewSources";
import { buildLegalReviewInstructions, buildUntrustedLessonInput } from "./legalReviewPrompt";
import { redactProviderError } from "./openaiServerService";
import { createLegalReviewTrace, type LegalReviewTrace, type LegalReviewTraceCounts } from "./legalReviewTrace";

const DEFAULT_OPENAI_REVIEW_MODEL = "gpt-5.6";
/** A Function tem 600s. Este orçamento deixa validação, Firestore e a resposta HTTP de fora da espera da OpenAI. */
export const OPENAI_AUDIT_BUDGET_MS = 250_000;
export const OPENAI_ATTEMPT_TIMEOUT_MS = 200_000;
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
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null;
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

/** Falha fechada. Não troca o modelo nem remove o filtro de domínio. */
export function reviewFailureForOpenAIError(error: unknown): Error {
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
    const call = item as {
      type?: string;
      action?: { type?: string; sources?: Array<{ url?: string }>; url?: string | null };
    };
    if (call.type !== "web_search_call" || !call.action) continue;
    if (Array.isArray(call.action.sources)) {
      for (const source of call.action.sources) {
        if (source?.url) urls.push(source.url);
      }
    }
    if (call.action.type === "open_page" && call.action.url) urls.push(call.action.url);
  }
  return urls;
}

export function buildReviewCreateParams(input: {
  model: string;
  instructions: string;
  userInput: string;
  lessonText: string;
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
    reasoning: { effort: "high" as const },
    max_output_tokens: 32000,
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
  if (response.error || response.status === "incomplete" || response.status === "failed") {
    throw new Error("A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.");
  }
  const text = (response.output_text || "").trim();
  if (!text) throw new Error("A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.");
  }
  const consultedUrls = extractConsultedSourceUrls(response.output);
  const audit = normalizeLegalAudit(raw, originalMarkdown, {
    webSearchExecuted: consultedUrls.length > 0,
    consultedUrls,
  });
  if (!audit) throw explainLegalAuditFailure(raw, originalMarkdown);
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
  timeoutMs: number
) {
  return client.responses.create(
    buildReviewCreateParams({ model, instructions, userInput, lessonText }),
    { timeout: timeoutMs, maxRetries: OPENAI_REVIEW_SDK_MAX_RETRIES }
  );
}

const COVERAGE_REPAIR_FOLLOW_UP = [
  "A resposta anterior foi recusada porque reviewedMarkdown contém alterações que não estão integralmente descritas em changes[].",
  "Refaça a resposta completa.",
  "REGRA OBRIGATÓRIA:",
  "Para cada alteração feita em reviewedMarkdown, inclua exatamente um item adequado em changes[].",
  "originalExcerpt deve reproduzir integralmente o trecho original que foi efetivamente alterado.",
  "revisedExcerpt deve reproduzir integralmente o trecho correspondente da versão revisada.",
  "Os trechos originalExcerpt e revisedExcerpt devem ser estritamente literais, exatamente como constam do texto original e revisado, sem adicionar 'nº', abreviações ou caracteres inexistentes.",
  "Quando várias correções atingirem o mesmo parágrafo, é preferível incluir um único change abrangendo integralmente todo o trecho alterado do parágrafo.",
  "Não faça alterações silenciosas.",
  "Não melhore estilo, pontuação, headings, listas ou formatação se isso não for necessário para corrigir conteúdo jurídico.",
  "Preserve literalmente todo texto que não necessite correção.",
  "Se não puder justificar uma modificação, mantenha o texto original.",
  "Antes de responder, faça uma autoconsistência entre reviewedMarkdown e changes[].",
  "A validação do servidor exige cobertura integral e recusará novamente qualquer alteração não declarada.",
  "Preserve expressamente órgãos, tribunais, prazos e competências específicas confirmadas por fontes oficiais; nunca os substitua por termos genéricos como 'autoridade competente', 'órgão competente' ou 'prazo legal'.",
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
      trace.validationEnd(traceCounts(audit));
      return audit;
    } catch (error) {
      trace.validationEnd(undefined, error);
      trace.noteFailure(error, "validation");
      return error instanceof Error ? error : new Error("A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.");
    }
  };

  let response: ReviewModelResponse | null = null;
  for (let tryNumber = 0; tryNumber < 2; tryNumber += 1) {
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
      trace.noteFailure(error, "openai");
      if (tryNumber === 0 && isTimeout(error)) {
        trace.retry("timeout");
        continue;
      }
      throw reviewFailureForOpenAIError(error);
    }
  }
  if (!response) {
    const failure = new Error("A OpenAI não concluiu a auditoria. A aula publicada não foi alterada.");
    trace.noteFailure(failure, "openai");
    throw failure;
  }

  let parsed = read(response);
  const lacksSources = !(parsed instanceof Error) && !parsed.webSearchUsed;
  // Uma resposta de cobertura gera no máximo este reparo. Se ele também falhar, não há terceira chamada.
  if (parsed instanceof Error || lacksSources) {
    const followUpTimeoutMs = Math.min(OPENAI_ATTEMPT_TIMEOUT_MS, remaining());
    if (followUpTimeoutMs >= 15_000) {
      trace.retry(lacksSources ? "missing_sources" : "invalid_audit");
      userInput = `${userInput}\n\n${reviewFollowUpInstruction(parsed)}`;
      trace.openaiStart();
      try {
        response = input.callModel
          ? await input.callModel({
            model: requestedModel,
            instructions,
            userInput,
            lessonText: input.content,
            timeoutMs: followUpTimeoutMs,
          })
          : await createResponse(
          client as OpenAI,
          requestedModel,
          instructions,
          userInput,
          input.content,
          followUpTimeoutMs
        );
        trace.openaiEnd(response.model);
        parsed = read(response);
      } catch (error) {
        trace.noteFailure(error, "openai");
        throw reviewFailureForOpenAIError(error);
      }
    }
  }

  if (parsed instanceof Error) {
    trace.noteFailure(parsed, "validation");
    throw parsed;
  }
  return parsed;
}
