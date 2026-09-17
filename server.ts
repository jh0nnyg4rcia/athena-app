import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { askATHENA, evaluateAnswer } from "./src/services/geminiServerService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits for base64 attached materials
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // Health route to check server and environment status
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString()
    });
  });

  // API Route - askATHENA proxy
  app.post("/api/ask-athena", async (req, res) => {
    try {
      const { message, history, userName, file, mentorshipStyle, mentorshipPhase } = req.body;
      console.log(`[Server API] Requisitando askATHENA para o usuário: ${userName || "Sem nome"}`);
      const responseText = await askATHENA(
        message,
        history || [],
        userName,
        file,
        mentorshipStyle,
        mentorshipPhase
      );
      res.json({ responseText });
    } catch (error: any) {
      console.error("[Server API Error] askATHENA falhou:", error);
      res.status(500).json({ error: error?.message || "Erro interno ao processar ATHENA." });
    }
  });

  // API Route - evaluateAnswer proxy
  app.post("/api/evaluate-answer", async (req, res) => {
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

  // Hot dynamic server-serving flow
  const isProd = process.env.NODE_ENV === "production" || process.argv[1]?.endsWith(".cjs");
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
