import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

type ExpressApp = (req: unknown, res: unknown) => unknown;
let cachedApp: ExpressApp | null = null;

async function getApp(): Promise<ExpressApp> {
  if (!cachedApp) {
    const mod = await import("./app.js");
    cachedApp = mod.createAthenaApiApp();
  }
  return cachedApp;
}

export const athenaApi = onRequest(
  {
    region: "southamerica-east1",
    timeoutSeconds: 300,
    memory: "1GiB",
    maxInstances: 10,
    secrets: [geminiApiKey],
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
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = "production";
    }
    const app = await getApp();
    return app(req, res);
  }
);
