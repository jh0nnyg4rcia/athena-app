import "./loadEnv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createAthenaApiApp } from "./src/api/createAthenaApiApp";

const PORT = Number(process.env.PORT) || 3000;

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.argv[1]?.endsWith(".cjs"));
}

async function verifyLocalEmulatorsAlive(): Promise<void> {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8197";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

  const [fsRes, authRes] = await Promise.all([
    fetch(`http://${firestoreHost}/`, { signal: AbortSignal.timeout(2000) }).catch(() => null),
    fetch(`http://${authHost}/`, { signal: AbortSignal.timeout(2000) }).catch(() => null)
  ]);

  if (!fsRes || !authRes) {
    console.error("\n================================================================================");
    console.error("[SEGURANÇA ATHENA] ERRO CRÍTICO DE ISOLAMENTO:");
    console.error(`- Firestore Emulator (127.0.0.1:8197): ${fsRes ? "ATIVO" : "INACESSÍVEL / FORA DO AR"}`);
    console.error(`- Auth Emulator (127.0.0.1:9099): ${authRes ? "ATIVO" : "INACESSÍVEL / FORA DO AR"}`);
    console.error("Para proteger o acervo e o banco de produção, a inicialização foi BLOQUEADA.");
    console.error("A ausência do emulador NUNCA provocará conexão com o banco real.");
    console.error("Inicie os emuladores locais antes de subir a instância candidata.");
    console.error("================================================================================\n");
    process.exit(1);
  }
}

async function startServer() {
  // Garantir isolamento estrito para o servidor local
  process.env.ATHENA_STUDY_PROGRESS_LOCAL = "true";
  process.env.GCLOUD_PROJECT = "demo-athena-client-safe";
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8197";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  process.env.FIRESTORE_DATABASE_ID = "(default)";

  // Bloqueio fail-closed: aborta imediatamente se os emuladores locais não responderem
  await verifyLocalEmulatorsAlive();
  console.log("[SEGURANÇA ATHENA] Emuladores locais 127.0.0.1:8197 e 127.0.0.1:9099 verificados e ativos.");
  console.log("[SEGURANÇA ATHENA] Projeto: demo-athena-client-safe (Blindagem contra produção ativa).");

  const app = createAthenaApiApp();

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
