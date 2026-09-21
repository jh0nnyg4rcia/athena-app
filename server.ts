import "./loadEnv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createAthenaApiApp } from "./src/api/createAthenaApiApp";

const PORT = Number(process.env.PORT) || 3000;

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.argv[1]?.endsWith(".cjs"));
}

async function startServer() {
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
