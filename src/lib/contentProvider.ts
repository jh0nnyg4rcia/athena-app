/** Escolha do cérebro que redige aulas novas. A chave de cada provedor fica só no servidor. */

export const ATHENA_CEO_EMAIL = "jhonny.spider@gmail.com";

export type ContentProvider = "gemini" | "chatgpt";

const STORAGE_KEY = "athena_content_provider";

export function parseContentProvider(raw: unknown): ContentProvider {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "chatgpt" || value === "openai" || value === "gpt") return "chatgpt";
  return "gemini";
}

export function getContentProvider(): ContentProvider {
  try {
    if (typeof localStorage === "undefined") return "gemini";
    return parseContentProvider(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "gemini";
  }
}

export function setContentProvider(provider: ContentProvider): void {
  try {
    localStorage.setItem(STORAGE_KEY, provider);
  } catch {
    /* storage indisponível */
  }
}

export function contentEngineLabel(modelName?: string): "ChatGPT" | "Gemini" {
  const name = (modelName || "").toLowerCase();
  if (name.startsWith("gpt") || name.includes("chatgpt") || name.includes("openai")) {
    return "ChatGPT";
  }
  return "Gemini";
}

export function isCeoEmail(email: unknown): boolean {
  return String(email ?? "").toLowerCase().trim() === ATHENA_CEO_EMAIL;
}
