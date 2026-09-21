import "./loadEnv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { askATHENA, evaluateAnswer, testGeminiPing } from "./src/services/geminiServerService";
import firebaseConfig from "./firebase-applet-config.json";

const PORT = Number(process.env.PORT) || 3000;

async function verifyFirebaseIdToken(idToken: string): Promise<boolean> {
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
    if (!response.ok) return false;
    const data = await response.json();
    return Array.isArray(data?.users) && data.users.length > 0;
  } catch (error) {
    console.warn("[Server API] Falha ao validar token Firebase:", error);
    return false;
  }
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.argv[1]?.endsWith(".cjs"));
}

async function requireApiAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const mustAuth =
    process.env.REQUIRE_API_AUTH === "true" ||
    (isProductionRuntime() && process.env.REQUIRE_API_AUTH !== "false");

  if (!mustAuth) {
    next();
    return;
  }

  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    res.status(401).json({ error: "Autenticação obrigatória para o proxy ATHENA." });
    return;
  }

  const valid = await verifyFirebaseIdToken(token);
  if (!valid) {
    res.status(401).json({ error: "Token de autenticação inválido." });
    return;
  }
  next();
}

async function startServer() {
  const app = express();

  app.use((req, res, next) => {
    const allowed = process.env.CORS_ORIGIN || "*";
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString()
    });
  });

  app.post("/api/test-gemini", requireApiAuth, async (req, res) => {
    try {
      const result = await testGeminiPing(req.body?.preferredModel);
      res.json(result);
    } catch (error: any) {
      console.error("[Server API Error] testGeminiPing falhou:", error);
      res.status(500).json({
        success: false,
        error: error?.message || "Erro interno ao testar Gemini."
      });
    }
  });

  app.post("/api/ask-athena", requireApiAuth, async (req, res) => {
    try {
      const { message, history, userName, file, mentorshipStyle, mentorshipPhase, preferredModel } = req.body;
      console.log(`[Server API] Requisitando askATHENA para o usuário: ${userName || "Sem nome"}`);
      const result = await askATHENA(
        message,
        history || [],
        userName,
        file,
        mentorshipStyle,
        mentorshipPhase,
        preferredModel
      );
      res.json({ responseText: result.text, model: result.model });
    } catch (error: any) {
      console.error("[Server API Error] askATHENA falhou:", error);
      res.status(500).json({ error: error?.message || "Erro interno ao processar ATHENA." });
    }
  });

  app.post("/api/evaluate-answer", requireApiAuth, async (req, res) => {
    try {
      const { questionText, userAnswer, referenceResponse, phase, userName } = req.body;
      console.log(`[Server API] Requisitando evaluateAnswer para o usuário: ${userName || "Sem nome"}`);
      const evalResult = await evaluateAnswer(
        questionText,
        userAnswer,
        referenceResponse,
        phase,
        userName
      );
      res.json(evalResult);
    } catch (error: any) {
      console.error("[Server API Error] evaluateAnswer falhou:", error);
      res.status(500).json({ error: error?.message || "Erro interno ao avaliar resposta." });
    }
  });

  const isProd = isProductionRuntime();
  if (!isProd) {
    console.log("[Server] Modo Desenvolvimento ativo (Vite HMR)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Modo Produção ativo (dist/ estático)");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
