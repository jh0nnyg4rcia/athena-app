import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const openaiApiKey = defineSecret("OPENAI_API_KEY");
const athenaInternalServiceSecret = defineSecret("ATHENA_INTERNAL_SERVICE_SECRET");
let cachedApp = null;
async function getApp() {
  if (!cachedApp) {
    const mod = await import("./app.js");
    cachedApp = await mod.createAthenaApiApp();
  }
  return cachedApp;
}
const athenaApi = onRequest(
  {
    region: "southamerica-east1",
    timeoutSeconds: 600,
    memory: "1GiB",
    maxInstances: 10,
    secrets: [geminiApiKey, openaiApiKey, athenaInternalServiceSecret],
    cors: true,
    invoker: "public"
  },
  async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      try {
        process.env.GEMINI_API_KEY = geminiApiKey.value();
      } catch {
      }
    }
    if (!process.env.OPENAI_API_KEY) {
      try {
        process.env.OPENAI_API_KEY = openaiApiKey.value();
      } catch {
      }
    }
    if (!process.env.ATHENA_INTERNAL_SERVICE_SECRET) {
      try {
        process.env.ATHENA_INTERNAL_SERVICE_SECRET = athenaInternalServiceSecret.value();
      } catch {
      }
    }
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = "production";
    }
    const app = await getApp();
    await app(req, res);
  }
);
export {
  athenaApi
};
