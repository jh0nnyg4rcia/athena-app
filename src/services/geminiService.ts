import { ATHENA_SYSTEM_INSTRUCTION } from "./geminiServerService";

declare const __ATHENA_BUILD_API_KEY__: string | undefined;

/**
 * Obtém dinamicamente a chave da API do Gemini:
 * 1. Chave customizada salva pelo usuário no app (localStorage)
 * 2. Constante estática injetada pelo Vite build (__ATHENA_BUILD_API_KEY__)
 * 3. Variável de ambiente VITE_GEMINI_API_KEY
 * 4. Variável de ambiente process.env.GEMINI_API_KEY
 */
export const getGeminiApiKey = (): string => {
  try {
    const saved = localStorage.getItem('athena_gemini_api_key');
    if (saved && saved.trim()) return saved.trim();
  } catch {}

  try {
    if (typeof __ATHENA_BUILD_API_KEY__ !== 'undefined' && __ATHENA_BUILD_API_KEY__ && __ATHENA_BUILD_API_KEY__.trim()) {
      return __ATHENA_BUILD_API_KEY__.trim();
    }
  } catch {}

  try {
    const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (viteKey && typeof viteKey === 'string' && viteKey.trim()) {
      return viteKey.trim();
    }
  } catch {}

  try {
    const procKey = process.env.GEMINI_API_KEY;
    if (procKey && typeof procKey === 'string' && procKey.trim()) {
      return procKey.trim();
    }
  } catch {}

  return "";
};

export const setCustomApiKey = (key: string) => {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem('athena_gemini_api_key');
    } else {
      localStorage.setItem('athena_gemini_api_key', key.trim());
    }
  } catch (e) {
    console.warn("Não foi possível salvar a chave no armazenamento local:", e);
  }
};

/**
 * Detecta se a aplicação está rodando nativamente dentro do Capacitor (Android / iOS)
 */
export const isNativeMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isCap = Boolean((window as any).Capacitor?.isNativePlatform?.());
  const isCapProto = window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:';
  return isCap || isCapProto;
};

const getApiUrl = (endpoint: string): string => {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return `${base}${endpoint}`;
};

/**
 * Extrai o texto limpo retornado pela API REST do Gemini,
 * inspecionando candidates[0].content.parts e garantindo suporte
 * mesmo quando houver metadados de pensamento (thoughtSignature).
 */
function extractTextFromGeminiResponse(data: any): string {
  if (!data) return '';
  if (typeof data.text === 'string' && data.text.trim()) {
    return data.text.trim();
  }
  const candidate = data.candidates?.[0];
  if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
    const combined = candidate.content.parts
      .map((part: any) => part.text || '')
      .filter(Boolean)
      .join('\n')
      .trim();
    if (combined) return combined;
  }
  return '';
}

/**
 * Chamada REST pura e direta para a API Gemini (v1beta), compatível
 * com qualquer ambiente (Browser, WebView Android via Capacitor, etc.).
 * Elimina completamente gargalos de SDK, retries infinitos e overhead.
 */
async function callGeminiREST(
  model: string,
  contents: any[],
  systemInstructionText?: string,
  timeoutMs: number = 20000
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Chave da API Gemini não configurada.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const bodyPayload: any = {
    contents,
    generationConfig: {
      temperature: 0.25
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  if (systemInstructionText && systemInstructionText.trim()) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemInstructionText }]
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const rawMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      const isQuotaOrTokens = response.status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('Quota exceeded') || rawMsg.includes('rate limit');
      if (isQuotaOrTokens) {
        throw new Error(`[API_TOKEN_EXHAUSTED] Limite de tokens ou cota da API Gemini atingido. Aguarde alguns instantes ou verifique sua chave de API nas configurações.`);
      }
      throw new Error(rawMsg);
    }

    const data = await response.json();
    const extracted = extractTextFromGeminiResponse(data);
    if (!extracted) {
      throw new Error("A API Gemini retornou uma resposta sem conteúdo textual legível.");
    }

    return extracted;
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new Error(`Tempo limite excedido (${timeoutMs / 1000}s) no modelo ${model}.`);
    }
    throw err;
  }
}

/**
 * Executa geração de conteúdo diretamente no cliente (Browser ou WebView nativo do Android)
 * utilizando chamada REST de altíssima performance.
 */
async function askATHENADirectClient(
  message: string, 
  history: any[] = [], 
  userName: string = "Mestre", 
  file?: { mimeType: string, data: string },
  mentorshipStyle: 'teorico' | 'jurisprudente' | 'pratico' | 'automatico' = 'teorico',
  mentorshipPhase: 'objetiva' | 'subjetiva' | 'oral' = 'objetiva'
): Promise<{ text: string; model: string }> {
  const parts: any[] = [{ text: message }];
  if (file) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  }

  // Força explicitamente a chamada para o modelo Flash oficial estável
  const modelAttempts = [
    { model: "gemini-flash-latest", timeout: 45000 },
    { model: "gemini-3.8-flash", timeout: 45000 }
  ];

  const systemInstruction = ATHENA_SYSTEM_INSTRUCTION(userName, mentorshipStyle, mentorshipPhase);
  const contents = [
    ...history,
    { role: 'user', parts }
  ];

  let lastError: any = null;

  for (const attempt of modelAttempts) {
    try {
      console.log(`[ATHENA Mobile REST] Solicitando modelo: ${attempt.model}...`);
      const text = await callGeminiREST(attempt.model, contents, systemInstruction, attempt.timeout);
      console.log(`[ATHENA Mobile REST] Resposta gerada com sucesso via ${attempt.model} (${text.length} chars)`);
      return { text, model: attempt.model };
    } catch (err: any) {
      console.warn(`[ATHENA Mobile REST] Falha no modelo ${attempt.model}:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("ATHENA não conseguiu obter resposta dos servidores Gemini. Verifique sua conexão com a internet.");
}

/**
 * Executa avaliação discursiva ou oral diretamente no cliente via REST
 */
async function evaluateAnswerDirectClient(
  questionText: string,
  userAnswer: string,
  referenceResponse: string,
  phase: 'subjetiva' | 'oral',
  userName: string = "Mestre"
): Promise<{ text: string; evaluation: any }> {
  const prompt = `Você é o Presidente da Banca Examinadora de Concursos de Elite de Magistratura e Ministério Público.
Você deve avaliar a resposta do candidato de forma extremamente rigorosa, realista e profissional jurídica.

Dados da Avaliação:
- Nome do Candidato: ${userName}
- Tipo de Prova: ${phase === 'subjetiva' ? 'Segunda Fase (Discursiva/Peça Escrita)' : 'Terceira Fase (Prova Oral / Tribuna)'}
- Pergunta Realizada: "${questionText}"
- Resposta do Candidato: "${userAnswer}"
- Espelho de Resposta / Critérios de Correção Oficiais (Referência): "${referenceResponse}"

Você DEVE responder com uma avaliação detalhada e estruturada com notas de 0.00 a 10.00 baseada na fidelidade doutrinária, citação literal dos dispositivos e precedentes, e concatenação lógica.

Você DEVE obrigatoriamente incluir no final a tag especial [ATHENA_EVALUATION] contendo um JSON válido com a seguinte estrutura lógica:
Se for Prova Subjetiva (discursiva):
[ATHENA_EVALUATION]
{
  "feedback": "Análise crítica extremamente profissional do desempenho escrevendo sobre o assunto...",
  "scores": {
    "tecnico": 7.5,
    "estrutura": 8.0,
    "linguagem": 9.0
  },
  "finalScore": 8.1
}

Se for Prova Oral:
[ATHENA_EVALUATION]
{
  "feedback": "Análise detalhada do fôlego, ritmo verbal, segurança jurídica enunciada...",
  "scores": {
    "materia": 7.0,
    "eloquencia": 6.5,
    "linguagem": 8.0,
    "citacoes": 7.5
  },
  "finalScore": 7.25
}

Forneça sua correção detalhada em formato markdown elegante contendo sugestões de melhoria exaustivas para que ele possa gabaritar.`;

  const modelAttempts = [
    { model: "gemini-flash-latest", timeout: 45000 },
    { model: "gemini-3.8-flash", timeout: 45000 }
  ];

  let text = '';
  let lastError: any = null;

  for (const attempt of modelAttempts) {
    try {
      console.log(`[ATHENA Mobile Eval REST] Solicitando ${attempt.model}...`);
      text = await callGeminiREST(attempt.model, [{ role: 'user', parts: [{ text: prompt }] }], undefined, attempt.timeout);
      if (text) break;
    } catch (err: any) {
      console.warn(`[ATHENA Mobile Eval REST] Erro com ${attempt.model}:`, err?.message || err);
      lastError = err;
    }
  }

  if (!text) {
    throw lastError || new Error("ATHENA não conseguiu avaliar a resposta.");
  }

  let evaluationData: any = null;
  const tag = "[ATHENA_EVALUATION]";
  if (text.includes(tag)) {
    const parts = text.split(tag);
    const afterTag = parts[1].trim();
    try {
      const first = afterTag.indexOf("{");
      const last = afterTag.lastIndexOf("}");
      if (first !== -1 && last !== -1) {
        const evalJsonStr = afterTag.substring(first, last + 1);
        evaluationData = JSON.parse(evalJsonStr);
      }
    } catch (e) {
      console.error("Evaluation JSON parse failed:", e, afterTag);
    }
  }

  return {
    text,
    evaluation: evaluationData
  };
}

/**
 * Função principal exportada: roteia de forma inteligente entre o servidor local
 * (se estiver rodando em desenvolvimento no PC) e a execução direta do cliente
 * (essencial no smartphone Android com o APK instalado).
 */
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
 * Executa um ping de diagnóstico rápido para testar a comunicação direta
 * com a API do Google Gemini a partir do dispositivo móvel ou browser.
 */
export async function testGeminiConnection(): Promise<GeminiConnectionTestResult> {
  const start = Date.now();
  const apiKey = getGeminiApiKey();
  const apiKeyPreview = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "Não encontrada";
  
  if (!apiKey) {
    return {
      success: false,
      model: "Nenhum",
      latencyMs: 0,
      message: "Chave da API Gemini não configurada no aplicativo.",
      apiKeyPreview
    };
  }

  const modelAttempts = ["gemini-flash-latest", "gemini-3.8-flash"];
  let lastErr: any = null;

  for (const model of modelAttempts) {
    try {
      const text = await callGeminiREST(
        model,
        [{ role: 'user', parts: [{ text: 'Responda estritamente: ATHENA IA CONECTADA.' }] }],
        undefined,
        15000
      );
      const latencyMs = Date.now() - start;
      return {
        success: true,
        model,
        latencyMs,
        message: text.trim(),
        apiKeyPreview
      };
    } catch (err: any) {
      lastErr = err;
    }
  }

  const latencyMs = Date.now() - start;
  return {
    success: false,
    model: modelAttempts[0],
    latencyMs,
    message: lastErr?.message || lastErr?.toString() || "Falha ao conectar com os servidores Gemini.",
    apiKeyPreview
  };
}

export async function askATHENA(
  message: string, 
  history: any[] = [], 
  userName: string = "Mestre", 
  file?: { mimeType: string, data: string },
  mentorshipStyle: 'teorico' | 'jurisprudente' | 'pratico' | 'automatico' = 'teorico',
  mentorshipPhase: 'objetiva' | 'subjetiva' | 'oral' = 'objetiva'
): Promise<AthenaResult> {
  // Se estiver em dispositivo móvel (Capacitor) ou se não houver backend remoto configurado,
  // chama diretamente a API REST no cliente para resposta imediata sem depender de servidor Node.
  const remoteUrl = import.meta.env.VITE_API_URL;
  if (isNativeMobile() || !remoteUrl) {
    console.log("[ATHENA] Executando Gemini diretamente no dispositivo móvel...");
    return askATHENADirectClient(message, history, userName, file, mentorshipStyle, mentorshipPhase);
  }

  // No desktop web com URL configurada, tenta primeiro o servidor via fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(getApiUrl('/api/ask-athena'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, userName, file, mentorshipStyle, mentorshipPhase }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro de conexão HTTP: ${response.status}`);
    }
    const data = await response.json();
    return { text: data.responseText, model: data.model || 'gemini-flash-latest' };
  } catch (error: any) {
    console.warn("[ATHENA] Backend indisponível, acionando execução cliente direta do Gemini:", error?.message);
    return askATHENADirectClient(message, history, userName, file, mentorshipStyle, mentorshipPhase);
  }
}

export async function evaluateAnswer(
  questionText: string,
  userAnswer: string,
  referenceResponse: string,
  phase: 'subjetiva' | 'oral',
  userName: string = "Mestre"
): Promise<{ text: string; evaluation: any }> {
  const remoteUrl = import.meta.env.VITE_API_URL;
  if (isNativeMobile() || !remoteUrl) {
    return evaluateAnswerDirectClient(questionText, userAnswer, referenceResponse, phase, userName);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(getApiUrl('/api/evaluate-answer'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionText, userAnswer, referenceResponse, phase, userName }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro de conexão HTTP para Avaliação: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.warn("[ATHENA] Backend indisponível para avaliação, acionando fallback direto:", error?.message);
    return evaluateAnswerDirectClient(questionText, userAnswer, referenceResponse, phase, userName);
  }
}
