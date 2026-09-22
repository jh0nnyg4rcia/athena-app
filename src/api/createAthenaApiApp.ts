import express from "express";
import { askATHENA, evaluateAnswer, testGeminiPing } from "../services/geminiServerService";
import firebaseConfig from "../../firebase-applet-config.json";
import { rateLimit } from "./rateLimit";

interface AthenaAuthUser {
  uid: string;
}

declare global {
  namespace Express {
    interface Request {
      athenaUser?: AthenaAuthUser;
    }
  }
}

const PRODUCTION_ORIGINS = [
  "https://athena-mentoria.web.app",
  "https://athena-mentoria.firebaseapp.com",
  "https://projetoathena.app.br",
  "https://www.projetoathena.app.br",
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "ionic://localhost",
];

async function verifyFirebaseIdToken(idToken: string): Promise<AthenaAuthUser | null> {
  try {
    const apiKey = process.env.FIREBASE_WEB_API_KEY || firebaseConfig.apiKey;
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const uid = data?.users?.[0]?.localId;
    if (!uid || typeof uid !== "string") return null;
    return { uid };
  } catch (error) {
    console.warn("[Server API] Falha ao validar token Firebase.");
    return null;
  }
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.argv[1]?.endsWith(".cjs"));
}

function allowCorsOrigin(requestOrigin: string | undefined): string {
  const configured = (process.env.CORS_ORIGIN || "").trim();
  if (configured && configured !== "*") {
    return configured;
  }
  if (!isProductionRuntime()) {
    return requestOrigin || "*";
  }
  if (requestOrigin && PRODUCTION_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  return PRODUCTION_ORIGINS[0];
}

function isStrictApiAuth(): boolean {
  return (process.env.REQUIRE_API_AUTH || "").trim().toLowerCase() === "strict";
}

function skipApiAuth(): boolean {
  return (process.env.REQUIRE_API_AUTH || "").trim().toLowerCase() === "false";
}

async function requireApiAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (skipApiAuth()) {
    next();
    return;
  }

  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  // Login por e-mail/código (APK e web) não tem sessão Firebase.
  // Sem Bearer o proxy segue, com rate limit. REQUIRE_API_AUTH=strict exige token.
  if (!token) {
    if (isStrictApiAuth()) {
      res.status(401).json({ error: "Autenticação obrigatória para o proxy ATHENA." });
      return;
    }
    next();
    return;
  }

  const user = await verifyFirebaseIdToken(token);
  if (!user) {
    res.status(401).json({ error: "Token de autenticação inválido." });
    return;
  }
  req.athenaUser = user;
  next();
}

/**
 * App Express só com /api/* — usado pelo server.ts local e pela Cloud Function.
 */
export function createAthenaApiApp(): express.Express {
  const app = express();

  app.use((req, res, next) => {
    const origin = allowCorsOrigin(req.headers.origin);
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use((req, res, next) => {
    const limit = req.path === "/api/ask-athena" ? "30mb" : "2mb";
    express.json({ limit })(req, res, next);
  });
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  app.get("/api/health", rateLimit(60, 60_000), (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  app.post("/api/test-gemini", rateLimit(10, 60_000), requireApiAuth, async (req, res) => {
    try {
      const result = await testGeminiPing(req.body?.preferredModel);
      res.json(result);
    } catch (error: any) {
      console.error("[Server API Error] testGeminiPing falhou.");
      res.status(500).json({
        success: false,
        error: error?.message || "Erro interno ao testar Gemini."
      });
    }
  });

  app.post("/api/ask-athena", rateLimit(20, 60_000), requireApiAuth, async (req, res) => {
    try {
      const { message, history, userName, file, mentorshipStyle, mentorshipPhase, preferredModel } = req.body;
      const safeName = typeof userName === "string" && userName.trim() ? userName.trim().slice(0, 80) : "Mestre";
      const result = await askATHENA(
        message,
        history || [],
        safeName,
        file,
        mentorshipStyle,
        mentorshipPhase,
        preferredModel
      );
      res.json({ responseText: result.text, model: result.model });
    } catch (error: any) {
      console.error("[Server API Error] askATHENA falhou.");
      res.status(500).json({ error: error?.message || "Erro interno ao processar ATHENA." });
    }
  });

  app.post("/api/evaluate-answer", rateLimit(20, 60_000), requireApiAuth, async (req, res) => {
    try {
      const { questionText, userAnswer, referenceResponse, phase, userName } = req.body;
      const safeName = typeof userName === "string" && userName.trim() ? userName.trim().slice(0, 80) : "Mestre";
      const evalResult = await evaluateAnswer(
        questionText,
        userAnswer,
        referenceResponse,
        phase,
        safeName
      );
      res.json(evalResult);
    } catch (error: any) {
      console.error("[Server API Error] evaluateAnswer falhou.");
      res.status(500).json({ error: error?.message || "Erro interno ao avaliar resposta." });
    }
  });

  return app;
}
