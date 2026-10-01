/**
 * Chamada OpenAI da auditoria. A chave fica só em OPENAI_API_KEY no processo.
 * Este módulo não pode ser importado pelo cliente.
 */
import OpenAI from "openai";
import { LEGAL_REVIEW_JSON_SCHEMA, normalizeLegalAudit, type NormalizedAudit } from "../lib/legalReviewValidate";
import { buildLegalReviewInstructions, buildUntrustedLessonInput } from "./legalReviewPrompt";
import { redactProviderError } from "./openaiServerService";

const DEFAULT_OPENAI_REVIEW_MODEL = "gpt-5.5";
const FALLBACK_IF_UNAVAILABLE = "gpt-5.4";
const MISSING_KEY =
  "OPENAI_API_KEY ausente no servidor. A chave da OpenAI fica só na Cloud Function, nunca no aplicativo.";

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
}

export interface AuditLessonResult extends NormalizedAudit {
  model: string;
  webSearchUsed: boolean;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}

const OFFICIAL_SEARCH_DOMAINS = ["gov.br", "jus.br", "leg.br"];

type Attempt = {
  model: string;
  reasoning: boolean;
  domainFilter: boolean;
  maxOutput: boolean;
};

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

function nextAttempt(current: Attempt, error: unknown): Attempt | null {
  if (isTimeout(error)) return null;
  const message = redactProviderError(error, "");
  const status = errorStatus(error);
  if (
    current.model !== FALLBACK_IF_UNAVAILABLE &&
    current.model === reviewModelName() &&
    (status === 404 || /model.*(not found|does not exist|invalid)|invalid model/i.test(message))
  ) {
    return { model: FALLBACK_IF_UNAVAILABLE, reasoning: true, domainFilter: true, maxOutput: true };
  }
  if (current.reasoning && /reasoning|effort/i.test(message)) {
    return { ...current, reasoning: false };
  }
  if (current.domainFilter && /allowed_domains|filters|domain/i.test(message)) {
    return { ...current, domainFilter: false };
  }
  if (current.maxOutput && /max_output_tokens|max_tokens/i.test(message)) {
    return { ...current, maxOutput: false };
  }
  return null;
}

function searchFacts(output: unknown): { completed: boolean; failed: boolean } {
  if (!Array.isArray(output)) return { completed: false, failed: false };
  const calls = output.filter((item) => item && typeof item === "object" && (item as { type?: string }).type === "web_search_call");
  if (!calls.length) return { completed: false, failed: false };
  const statuses = calls.map((item) => String((item as { status?: string }).status || ""));
  const completed = statuses.some((status) => status === "completed");
  return { completed, failed: !completed && statuses.every((status) => status === "failed") };
}

function readUsage(usage: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null | undefined) {
  if (!usage) return undefined;
  return {
    inputTokens: Number(usage.input_tokens || 0),
    outputTokens: Number(usage.output_tokens || 0),
    totalTokens: Number(usage.total_tokens || 0),
  };
}

async function createResponse(
  client: OpenAI,
  attempt: Attempt,
  instructions: string,
  input: string,
  timeoutMs: number
) {
  return client.responses.create(
    {
      model: attempt.model,
      instructions,
      input,
      store: false,
      tools: [
        {
          type: "web_search",
          external_web_access: true,
          search_context_size: "high",
          user_location: {
            type: "approximate",
            country: "BR",
            timezone: "America/Sao_Paulo",
          },
          ...(attempt.domainFilter ? { filters: { allowed_domains: OFFICIAL_SEARCH_DOMAINS } } : {}),
        },
      ],
      ...(attempt.reasoning ? { reasoning: { effort: "high" as const } } : {}),
      ...(attempt.maxOutput ? { max_output_tokens: 32000 } : {}),
      text: {
        format: {
          type: "json_schema",
          name: "auditoria_juridica",
          strict: true,
          schema: LEGAL_REVIEW_JSON_SCHEMA,
        },
      },
    },
    { timeout: timeoutMs }
  );
}

export async function auditLessonWithOpenAI(input: AuditLessonInput): Promise<AuditLessonResult> {
  const apiKey = requireKey();
  const client = new OpenAI({ apiKey });
  const instructions = buildLegalReviewInstructions(input.reviewDate);
  let userInput = buildUntrustedLessonInput(input);
  let attempt: Attempt = {
    model: reviewModelName(),
    reasoning: true,
    domainFilter: true,
    maxOutput: true,
  };
  const startedAt = Date.now();
  const budgetMs = 250_000;
  const remaining = () => budgetMs - (Date.now() - startedAt);

  let response: Awaited<ReturnType<typeof createResponse>> | null = null;
  for (let tryNumber = 0; tryNumber < 4; tryNumber += 1) {
    const timeoutMs = Math.min(200_000, remaining());
    if (timeoutMs < 15_000) break;
    try {
      response = await createResponse(client, attempt, instructions, userInput, timeoutMs);
      break;
    } catch (error) {
      const retry = nextAttempt(attempt, error);
      console.error("[legal-review] OpenAI falhou.", errorStatus(error) || "sem-status");
      if (!retry) {
        throw new Error(redactProviderError(error, "A OpenAI não concluiu a auditoria. A aula publicada não foi alterada."));
      }
      attempt = retry;
    }
  }
  if (!response) {
    throw new Error("A OpenAI não concluiu a auditoria. A aula publicada não foi alterada.");
  }

  const parseFrom = (current: typeof response) => {
    if (!current || current.error || current.status === "incomplete" || current.status === "failed") return null;
    const text = (current.output_text || "").trim();
    if (!text) return null;
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return null;
    }
    const facts = searchFacts(current.output);
    return {
      audit: normalizeLegalAudit(textObject(raw), input.content, { webSearchCompleted: facts.completed }),
      facts,
      usage: readUsage(current.usage),
      model: current.model || attempt.model,
    };
  };

  let parsed = parseFrom(response);
  const canFollowUp = remaining() > 20_000;
  if (parsed?.audit && !parsed.facts.completed && canFollowUp) {
    userInput = `${userInput}\n\nA ferramenta de web search é obrigatória nesta auditoria. Consulte fonte oficial primária antes de concluir. Se a pesquisa falhar, use verificationLevel FALHA_NA_VERIFICACAO e não trate o texto como verificado.`;
    try {
      response = await createResponse(client, attempt, instructions, userInput, Math.min(90_000, remaining()));
      parsed = parseFrom(response) || parsed;
    } catch (error) {
      console.error("[legal-review] Pesquisa oficial não repetiu.", errorStatus(error) || "sem-status");
    }
  } else if (!parsed?.audit && canFollowUp) {
    userInput = `${userInput}\n\nA resposta anterior não pôde ser validada. Devolva somente o JSON do schema, com Markdown válido em reviewedMarkdown e os marcadores [BLOCK_n] preservados.`;
    try {
      response = await createResponse(client, attempt, instructions, userInput, Math.min(90_000, remaining()));
      parsed = parseFrom(response);
    } catch (error) {
      console.error("[legal-review] Nova tentativa de JSON falhou.", errorStatus(error) || "sem-status");
    }
  }

  if (!parsed?.audit) {
    throw new Error("A OpenAI devolveu uma auditoria inválida. A aula publicada não foi alterada.");
  }

  return {
    ...parsed.audit,
    model: parsed.model,
    webSearchUsed: parsed.facts.completed,
    usage: parsed.usage,
  };
}

function textObject(raw: unknown): unknown {
  if (raw && typeof raw === "object") return raw;
  return null;
}
