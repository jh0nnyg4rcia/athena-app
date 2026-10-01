/**
 * ChatGPT exclusivo do Express. Nunca importar este módulo no cliente:
 * OPENAI_API_KEY não pode ir ao bundle nem ao APK.
 */
import { ATHENA_SYSTEM_INSTRUCTION } from "./geminiServerService";
import { sanitizeAthenaVoice } from "../lib/athenaVoice";

type ChatRole = "system" | "user" | "assistant";

interface OpenAiTurn {
  role: ChatRole;
  content: string | Array<Record<string, unknown>>;
}

const MISSING_KEY =
  "OPENAI_API_KEY ausente no servidor. A chave do ChatGPT fica só na Cloud Function, nunca no aplicativo.";

export function openAiModelAttempts(): string[] {
  const preferred = (process.env.OPENAI_MODEL || "").trim();
  const list = [preferred, "gpt-4.1", "gpt-4o"].filter((item) => item.length > 0);
  return list.filter((item, index) => list.indexOf(item) === index);
}

export function redactProviderError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  if (!raw || /sk-|api[_-]?key|bearer\s+/i.test(raw)) return fallback;
  return raw.replace(/\s+/g, " ").slice(0, 280);
}

export function geminiHistoryToOpenAi(history: unknown): OpenAiTurn[] {
  if (!Array.isArray(history)) return [];
  const turns: OpenAiTurn[] = [];
  const recent = history.slice(-8);
  for (const item of recent) {
    if (!item || typeof item !== "object") continue;
    const record = item as { role?: string; parts?: Array<{ text?: string }>; content?: string };
    const role: ChatRole = record.role === "model" || record.role === "assistant" ? "assistant" : "user";
    const fromParts = Array.isArray(record.parts)
      ? record.parts.map((part) => (typeof part?.text === "string" ? part.text : "")).join("\n")
      : "";
    const text = (fromParts || (typeof record.content === "string" ? record.content : "")).trim().slice(0, 12000);
    if (!text) continue;
    turns.push({ role, content: text });
  }
  return turns;
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function readMessageContent(message: { content?: unknown } | undefined): string {
  const content = message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof (part as { text?: string }).text === "string") {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("");
  }
  return "";
}

function requireOpenAiKey(): string {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error(MISSING_KEY);
  return apiKey;
}

async function completeOpenAi(options: {
  system: string;
  user: string;
  history?: unknown;
  image?: { mimeType: string; data: string };
  json?: boolean;
}): Promise<{ text: string; model: string }> {
  const apiKey = requireOpenAiKey();
  if (options.image && !options.image.mimeType.startsWith("image/")) {
    throw new Error("Anexo que não é imagem só é lido pelo Gemini. Troque o cérebro para Gemini ou envie sem o arquivo.");
  }

  const userContent: OpenAiTurn["content"] = options.image
    ? [
        { type: "text", text: options.user },
        {
          type: "image_url",
          image_url: { url: `data:${options.image.mimeType};base64,${options.image.data}` },
        },
      ]
    : options.user;

  const messages: OpenAiTurn[] = [
    { role: "system", content: options.system },
    ...geminiHistoryToOpenAi(options.history),
    { role: "user", content: userContent },
  ];

  let lastError: unknown = null;
  for (const model of openAiModelAttempts()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 85_000);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_completion_tokens: 16384,
          messages,
          ...(options.json ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const apiMessage = typeof payload?.error?.message === "string" ? payload.error.message : "";
        const unsupported = /temperature|response_format|max_completion_tokens/i.test(apiMessage);
        if (unsupported) {
          const retry = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, messages }),
            signal: controller.signal,
          });
          const retryPayload = await retry.json().catch(() => ({}));
          if (retry.ok) {
            const retryText = stripFences(readMessageContent(retryPayload?.choices?.[0]?.message));
            if (retryText) return { text: retryText, model };
          }
        }
        throw new Error(redactProviderError(apiMessage, `O ChatGPT recusou o modelo ${model}.`));
      }
      const text = stripFences(readMessageContent(payload?.choices?.[0]?.message));
      if (text) return { text, model };
      lastError = new Error("O ChatGPT devolveu uma resposta vazia.");
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[ATHENA ChatGPT] Falha no modelo ${model}:`, redactProviderError(message, "falha sem detalhe"));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof Error && lastError.name === "AbortError") {
    throw new Error("Tempo limite excedido ao falar com o ChatGPT.");
  }
  if (lastError instanceof Error && lastError.message === MISSING_KEY) throw lastError;
  throw new Error(redactProviderError(lastError, "Não foi possível obter resposta do ChatGPT."));
}

export async function testChatGptPing(): Promise<{ success: boolean; model: string; message: string }> {
  if (!(process.env.OPENAI_API_KEY || "").trim()) {
    return { success: false, model: "chatgpt", message: MISSING_KEY };
  }
  try {
    const result = await completeOpenAi({
      system: "Responda de forma estrita e curta.",
      user: "Responda estritamente: ATHENA CHATGPT CONECTADO.",
    });
    return { success: true, model: result.model, message: result.text };
  } catch (error) {
    return {
      success: false,
      model: openAiModelAttempts()[0] || "chatgpt",
      message: redactProviderError(error, "Falha ao contatar o ChatGPT no servidor."),
    };
  }
}

export async function askChatGPT(
  message: string,
  history: unknown[] = [],
  userName: string = "Mestre",
  file?: { mimeType: string; data: string },
  mentorshipStyle: "teorico" | "jurisprudente" | "pratico" | "automatico" = "teorico",
  mentorshipPhase: "objetiva" | "subjetiva" | "oral" = "objetiva"
): Promise<{ text: string; model: string }> {
  const system = `${ATHENA_SYSTEM_INSTRUCTION(userName, mentorshipStyle, mentorshipPhase)}

O recorte oficial que vier na solicitação (lei, artigo ou grounding) prevalece. Não substitua o diploma pedido por outro.`;
  const result = await completeOpenAi({
    system,
    user: message,
    history,
    image: file,
  });
  return { text: sanitizeAthenaVoice(result.text), model: result.model };
}

export async function generateObjectiveChallengeChatGPT(brief: string): Promise<{ text: string; model: string }> {
  const system = `Você elabora somente o Desafio ATHENA.
Responda APENAS com JSON válido neste formato, sem markdown e sem texto fora do JSON:
{"questions":[{"text":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}
Regras:
- Mínimo de 10 questões objetivas de múltipla escolha.
- 4 ou 5 alternativas em options.
- correctIndex inteiro de 0 a 4.
- Proibido questão discursiva, peça, caso para redação, arguição oral e correctIndex negativo.
- As questões devem cobrar somente o recorte jurídico descrito.
- Proibido citar certame nominado (TJSP, MPRS, TRF, DPU, CESPE, VUNESP, FGV, Cebraspe).
- Proibido tabela markdown.`;
  return completeOpenAi({
    system,
    user: (brief || "").slice(0, 12000),
    json: true,
  });
}

export async function evaluateAnswerChatGPT(
  questionText: string,
  userAnswer: string,
  referenceResponse: string,
  phase: "subjetiva" | "oral",
  userName: string = "Mestre"
): Promise<{ text: string; evaluation: unknown }> {
  const prompt = `Você é o Presidente da Banca Examinadora.
Avalie a resposta com notas de 0.00 a 10.00.

- Candidato: ${userName}
- Tipo: ${phase === "subjetiva" ? "Segunda Fase escrita" : "Prova oral"}
- Pergunta: "${questionText}"
- Resposta: "${userAnswer}"
- Espelho: "${referenceResponse}"

Escreva a correção em markdown e termine com a tag [ATHENA_EVALUATION] seguida de JSON válido.
Se for escrita:
[ATHENA_EVALUATION]
{"feedback":"...","scores":{"tecnico":0,"estrutura":0,"linguagem":0},"finalScore":0}
Se for oral:
[ATHENA_EVALUATION]
{"feedback":"...","scores":{"materia":0,"eloquencia":0,"linguagem":0,"citacoes":0},"finalScore":0}`;

  const result = await completeOpenAi({
    system: "Você corrige prova jurídica com rigor e devolve o JSON pedido no final.",
    user: prompt,
  });
  const text = sanitizeAthenaVoice(result.text);
  let evaluation: unknown = null;
  const tag = "[ATHENA_EVALUATION]";
  if (text.includes(tag)) {
    const after = text.split(tag)[1] || "";
    const first = after.indexOf("{");
    const last = after.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      try {
        evaluation = JSON.parse(after.slice(first, last + 1));
      } catch {
        evaluation = null;
      }
    }
  }
  return { text, evaluation };
}
