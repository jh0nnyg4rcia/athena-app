/**
 * Cliente ATHENA: inferência Gemini somente via proxy Express.
 * Nenhuma chave de API é lida, armazenada ou enviada a partir do app (web ou Capacitor).
 */

try {
  localStorage.removeItem("athena_gemini_api_key");
} catch {
  /* storage indisponível (SSR / WebView restrito) */
}

export const getSelectedModel = (): string => {
  try {
    const saved = localStorage.getItem("athena_selected_model");
    if (
      saved &&
      (saved === "gemini-3.8-flash" ||
        saved === "gemini-3.1-pro-preview" ||
        saved === "gemini-3.6-flash")
    ) {
      return saved;
    }
  } catch {}
  return "gemini-3.8-flash";
};

export const setSelectedModel = (model: string) => {
  try {
    localStorage.setItem("athena_selected_model", model);
  } catch (e) {
    console.warn("[ATHENA] Não foi possível salvar o modelo no armazenamento local:", e);
  }
};

export const isNativeMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  const isCap = Boolean((window as any).Capacitor?.isNativePlatform?.());
  const isCapProto =
    window.location.protocol === "capacitor:" || window.location.protocol === "ionic:";
  return isCap || isCapProto;
};

const PRODUCTION_PROXY_URL =
  "https://southamerica-east1-gen-lang-client-0822763072.cloudfunctions.net/athenaApi";

const getApiUrl = (endpoint: string): string => {
  const configured = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const base = configured || (isNativeMobile() ? PRODUCTION_PROXY_URL : "");
  if (isNativeMobile() && !base) {
    throw new Error(
      "VITE_API_URL não configurada no build nativo. O APK não pode chamar a API Gemini diretamente; defina a URL HTTPS do proxy ATHENA no momento do build."
    );
  }
  return `${base}${endpoint}`;
};

async function getProxyIdToken(): Promise<string | undefined> {
  try {
    const { auth } = await import("../lib/firebase");
    const jsToken = await auth.currentUser?.getIdToken();
    if (jsToken) return jsToken;
  } catch {
    /* SDK web indisponível */
  }

  if (!isNativeMobile()) return undefined;

  try {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const native = await FirebaseAuthentication.getIdToken();
    if (native?.token) return native.token;
  } catch {
    /* login local / sem Google no nativo */
  }
  return undefined;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = await getProxyIdToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchAthenaApi<T>(
  endpoint: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(getApiUrl(endpoint), {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro de conexão HTTP: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Tempo limite excedido (${timeoutMs / 1000}s) no proxy ATHENA.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface AthenaResult {
  text: string;
  model: string;
}

export interface GeminiConnectionTestResult {
  success: boolean;
  model: string;
  latencyMs: number;
  message: string;
  apiKeyPreview: string;
}

/**
 * Diagnóstico via backend: nunca inspeciona chave no cliente.
 */
export async function testGeminiConnection(): Promise<GeminiConnectionTestResult> {
  const start = Date.now();
  try {
    const data = await fetchAthenaApi<{
      success: boolean;
      model?: string;
      message?: string;
    }>("/api/test-gemini", { preferredModel: getSelectedModel() }, 20000);
    return {
      success: Boolean(data.success),
      model: data.model || getSelectedModel(),
      latencyMs: Date.now() - start,
      message: data.message || "Proxy ATHENA operacional.",
      apiKeyPreview: "servidor (não exposta no cliente)",
    };
  } catch (err: any) {
    return {
      success: false,
      model: getSelectedModel(),
      latencyMs: Date.now() - start,
      message: err?.message || "Falha ao contatar o proxy ATHENA.",
      apiKeyPreview: "servidor (não exposta no cliente)",
    };
  }
}

export async function askATHENA(
  message: string,
  history: any[] = [],
  userName: string = "Mestre",
  file?: { mimeType: string; data: string },
  mentorshipStyle: "teorico" | "jurisprudente" | "pratico" | "automatico" = "teorico",
  mentorshipPhase: "objetiva" | "subjetiva" | "oral" = "objetiva"
): Promise<AthenaResult> {
  const data = await fetchAthenaApi<{ responseText?: string; model?: string }>(
    "/api/ask-athena",
    {
      message,
      history,
      userName,
      file,
      mentorshipStyle,
      mentorshipPhase,
      preferredModel: getSelectedModel(),
    },
    90000
  );

  const text = (data.responseText || "").trim();
  if (!text) {
    throw new Error("O proxy ATHENA retornou uma resposta vazia.");
  }
  return { text, model: data.model || getSelectedModel() };
}

export async function regenerateObjectiveChallenge(brief: string): Promise<AthenaResult> {
  const data = await fetchAthenaApi<{ responseText?: string; model?: string }>(
    "/api/regenerate-challenge",
    { brief },
    90000
  );
  const text = (data.responseText || "").trim();
  if (!text) {
    throw new Error("O proxy ATHENA retornou o bloco de questões vazio.");
  }
  return { text, model: data.model || getSelectedModel() };
}

export async function evaluateAnswer(
  questionText: string,
  userAnswer: string,
  referenceResponse: string,
  phase: "subjetiva" | "oral",
  userName: string = "Mestre"
): Promise<{ text: string; evaluation: any }> {
  return fetchAthenaApi("/api/evaluate-answer", {
    questionText,
    userAnswer,
    referenceResponse,
    phase,
    userName,
    preferredModel: getSelectedModel(),
  }, 90000);
}
