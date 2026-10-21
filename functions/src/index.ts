import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const openaiApiKey = defineSecret("OPENAI_API_KEY");
const athenaInternalServiceSecret = defineSecret("ATHENA_INTERNAL_SERVICE_SECRET");

type ExpressApp = (req: unknown, res: unknown) => unknown;
let cachedApp: ExpressApp | null = null;

async function getApp(): Promise<ExpressApp> {
  if (!cachedApp) {
    const mod = await import("./app.js");
    cachedApp = await mod.createAthenaApiApp();
  }
  return cachedApp;
}

export const athenaApi = onRequest(
  {
    region: "southamerica-east1",
    timeoutSeconds: 600,
    memory: "1GiB",
    maxInstances: 10,
    secrets: [geminiApiKey, openaiApiKey, athenaInternalServiceSecret],
    cors: true,
    invoker: "public",
  },
  async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      try {
        process.env.GEMINI_API_KEY = geminiApiKey.value();
      } catch {
        /* secret indisponível neste ciclo */
      }
    }
    if (!process.env.OPENAI_API_KEY) {
      try {
        process.env.OPENAI_API_KEY = openaiApiKey.value();
      } catch {
        /* secret OpenAI ainda não configurado */
      }
    }
    if (!process.env.ATHENA_INTERNAL_SERVICE_SECRET) {
      try {
        process.env.ATHENA_INTERNAL_SERVICE_SECRET = athenaInternalServiceSecret.value();
      } catch {
        /* secret interno ainda não configurado */
      }
    }
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = "production";
    }

    const app = await getApp();
    await app(req, res);
  }
);
