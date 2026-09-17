import { GoogleGenAI, HarmCategory, HarmBlockThreshold, ThinkingLevel } from "@google/genai";
import { ATHENA_SYSTEM_INSTRUCTION } from "./geminiServerService";
import { ATHENA_LEGAL_CORPUS } from "./legalCorpusSource";

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
 * Executa geração de conteúdo diretamente no cliente (Browser ou WebView nativo do Android)
 * utilizando o SDK oficial @google/genai.
 */
async function askATHENADirectClient(
  message: string, 
  history: any[] = [], 
  userName: string = "Mestre", 
  file?: { mimeType: string, data: string },
  mentorshipStyle: 'teorico' | 'jurisprudente' | 'pratico' | 'automatico' = 'teorico',
  mentorshipPhase: 'objetiva' | 'subjetiva' | 'oral' = 'objetiva'
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Chave da API Gemini não encontrada. Por favor, configure sua chave no menu.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [{ text: message }];
  if (file) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  }

  // Model tiering com modelos de 2026 ativos
  const modelAttempts = [
    { model: "gemini-3.6-flash", useThinking: false },
    { model: "gemini-flash-latest", useThinking: false },
    { model: "gemini-3.5-flash", useThinking: true },
    { model: "gemini-3.1-pro-preview", useThinking: true }
  ];

  let lastError: any = null;

  for (const attempt of modelAttempts) {
    try {
      console.log(`[ATHENA Mobile] Solicitando modelo: ${attempt.model}...`);
      const config: any = {
        temperature: 0.25,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        systemInstruction: `${ATHENA_SYSTEM_INSTRUCTION(userName, mentorshipStyle, mentorshipPhase)}\n\n${ATHENA_LEGAL_CORPUS}`
      };

      if (attempt.useThinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: [
          ...history,
          { role: 'user', parts }
        ],
        config
      });

      if (response && response.text) {
        console.log(`[ATHENA Mobile] Resposta gerada com sucesso via ${attempt.model}`);
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[ATHENA Mobile] Falha no modelo ${attempt.model}:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("ATHENA não conseguiu obter resposta dos servidores Gemini. Verifique sua conexão com a internet.");
}

/**
 * Executa avaliação discursiva ou oral diretamente no cliente
 */
async function evaluateAnswerDirectClient(
  questionText: string,
  userAnswer: string,
  referenceResponse: string,
  phase: 'subjetiva' | 'oral',
  userName: string = "Mestre"
): Promise<{ text: string; evaluation: any }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Chave da API Gemini não encontrada para avaliação.");
  }

  const ai = new GoogleGenAI({ apiKey });

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
    { model: "gemini-3.6-flash", useThinking: false },
    { model: "gemini-3.1-pro-preview", useThinking: true },
    { model: "gemini-flash-latest", useThinking: false },
    { model: "gemini-3.5-flash", useThinking: true }
  ];

  let response: any = null;
  let lastError: any = null;

  for (const attempt of modelAttempts) {
    try {
      const config: any = {
        temperature: 0.25,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      };

      if (attempt.useThinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      console.log(`[ATHENA Mobile Eval] Tentando modelo: ${attempt.model}`);
      response = await ai.models.generateContent({
        model: attempt.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config
      });

      if (response && response.text) {
        break;
      }
    } catch (err: any) {
      console.warn(`[ATHENA Mobile Eval] Erro com ${attempt.model}:`, err?.message || err);
      lastError = err;
    }
  }

  if (!response || !response.text) {
    throw lastError || new Error("ATHENA não conseguiu avaliar a resposta.");
  }

  const text = response.text;
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
export async function askATHENA(
  message: string, 
  history: any[] = [], 
  userName: string = "Mestre", 
  file?: { mimeType: string, data: string },
  mentorshipStyle: 'teorico' | 'jurisprudente' | 'pratico' | 'automatico' = 'teorico',
  mentorshipPhase: 'objetiva' | 'subjetiva' | 'oral' = 'objetiva'
): Promise<string> {
  // Se estiver em dispositivo móvel (Capacitor) ou se não houver backend remoto configurado,
  // chama diretamente o Gemini SDK no cliente para resposta imediata sem depender de servidor Node.
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
    return data.responseText;
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
