/**
 * Chamada OpenAI da auditoria. A chave fica só em OPENAI_API_KEY no processo.
 * Este módulo não pode ser importado pelo cliente.
 */
import OpenAI from "openai";
import { LEGAL_REVIEW_JSON_SCHEMA, normalizeLegalAudit, type NormalizedAudit } from "../lib/legalReviewValidate";
import { searchDomainsForLesson } from "../lib/legalReviewSources";
import { buildLegalReviewInstructions, buildUntrustedLessonInput } from "./legalReviewPrompt";
import { redactProviderError } from "./openaiServerService";

const DEFAULT_OPENAI_REVIEW_MODEL = "gpt-5.6";
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

function isTimeout(error: unknown): boolean {
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
  if (!audit) {
    throw new Error("A revisão não descreveu todas as alterações do texto. A aula publicada não foi alterada.");
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
  timeoutMs: number
) {
  return client.responses.create(
    buildReviewCreateParams({ model, instructions, userInput, lessonText }),
    { timeout: timeoutMs }
  );
}

export async function auditLessonWithOpenAI(input: AuditLessonInput): Promise<AuditLessonResult> {
  const apiKey = requireKey();
  const client = new OpenAI({ apiKey });
  const requestedModel = reviewModelName();
  const instructions = buildLegalReviewInstructions(input.reviewDate);
  const baseline = input.publishedContent || input.content;
  let userInput = buildUntrustedLessonInput(input);
  const startedAt = Date.now();
  const budgetMs = 250_000;
  const remaining = () => budgetMs - (Date.now() - startedAt);

  let response: Awaited<ReturnType<typeof createResponse>> | null = null;
  for (let tryNumber = 0; tryNumber < 2; tryNumber += 1) {
    const timeoutMs = Math.min(200_000, remaining());
    if (timeoutMs < 15_000) break;
    try {
      response = await createResponse(client, requestedModel, instructions, userInput, input.content, timeoutMs);
      break;
    } catch (error) {
      console.error("[legal-review] OpenAI falhou.", errorStatus(error) || "sem-status");
      if (tryNumber === 0 && isTimeout(error)) continue;
      throw reviewFailureForOpenAIError(error);
    }
  }
  if (!response) {
    throw new Error("A OpenAI não concluiu a auditoria. A aula publicada não foi alterada.");
  }

  const read = (current: typeof response) => {
    try {
      return interpretReviewResponse(current as ReviewModelResponse, baseline, requestedModel);
    } catch (error) {
      return error instanceof Error ? error : new Error("A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.");
    }
  };

  let parsed = read(response);
  const canFollowUp = remaining() > 20_000;
  const lacksSources = !(parsed instanceof Error) && !parsed.webSearchUsed;
  if ((parsed instanceof Error || lacksSources) && canFollowUp) {
    userInput = `${userInput}\n\nA resposta anterior não pôde ser aceita. Pesquise de novo nas fontes oficiais permitidas. Devolva somente o JSON do schema. Cada trecho substancialmente diferente do original precisa de um item em changes, com originalExcerpt e revisedExcerpt. Não invente URLs. Se não houver comprovação, use NAO_CONFIRMADO. Preserve os marcadores [BLOCK_n].`;
    try {
      response = await createResponse(
        client,
        requestedModel,
        instructions,
        userInput,
        input.content,
        Math.min(90_000, remaining())
      );
      parsed = read(response);
    } catch (error) {
      console.error("[legal-review] Nova tentativa de auditoria falhou.", errorStatus(error) || "sem-status");
      if (!isTimeout(error)) throw reviewFailureForOpenAIError(error);
    }
  }

  if (parsed instanceof Error) throw parsed;
  return parsed;
}
