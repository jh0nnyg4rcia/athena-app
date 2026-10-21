import { createAthenaApiApp as createBaseApp } from "./base-app.js";
import fs from "node:fs";

export async function createAthenaApiApp() {
  const app = createBaseApp();

  const verifyManagedIdentity = async () => {
    const r = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email", {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(5000)
    });
    if (!r.ok || r.headers.get("Metadata-Flavor") !== "Google") throw Error("RECEIVER_IDENTITY");
    return { email: (await r.text()).trim(), managed: true };
  };

  const mcpRequired = process.env.ATHENA_MCP_APPROVAL_ENABLED === "true" ||
                      process.env.ATHENA_MCP_PUBLISH_ENABLED === "true" ||
                      process.env.ATHENA_CATALOG_GENERALIZED === "true" ||
                      process.env.ATHENA_MCP_AUTH_ONLY === "true" ||
                      process.env.ATHENA_MCP_REAL_PILOT_ENABLED === "true" ||
                      process.env.ATHENA_CATALOG_WRITES_ENABLED === "true";

  const publicKeyPath = new URL("./auth-public.pem", import.meta.url);
  const authOnlyReceiverPath = new URL("./auth-only-receiver.mjs", import.meta.url);
  const ceoRuntimePath = new URL("./ceo-publication-runtime.mjs", import.meta.url);
  const approvedBlock4Path = new URL("./approved-block4.md", import.meta.url);

  if (!fs.existsSync(publicKeyPath)) {
    if (mcpRequired) {
      throw new Error("MCP_INITIALIZATION_FAILED: auth-public.pem missing while MCP publication or approval is required by configuration.");
    }
    // Modo isolado/local de desenvolvimento sem os arquivos do piloto MCP
    return app;
  }

  // Se MCP é exigido pelas flags, validar ausência de conflitos e presença dos runtimes obrigatórios
  if (mcpRequired) {
    if (process.env.ATHENA_CATALOG_GENERALIZED === "true" && process.env.ATHENA_MCP_AUTH_ONLY === "true") {
      throw new Error("MCP_INITIALIZATION_FAILED: conflicting configuration - ATHENA_CATALOG_GENERALIZED is true but ATHENA_MCP_AUTH_ONLY is true, preventing chat publication.");
    }
    const publicationRequired = process.env.ATHENA_CATALOG_GENERALIZED === "true" ||
                                process.env.ATHENA_MCP_PUBLISH_ENABLED === "true" ||
                                process.env.ATHENA_MCP_AUTH_ONLY === "false";
    if (publicationRequired && !fs.existsSync(ceoRuntimePath)) {
      throw new Error("MCP_INITIALIZATION_FAILED: ceo-publication-runtime.mjs missing while MCP publication is required.");
    }
    if (process.env.ATHENA_MCP_AUTH_ONLY === "true" && !fs.existsSync(authOnlyReceiverPath)) {
      throw new Error("MCP_INITIALIZATION_FAILED: auth-only-receiver.mjs missing while MCP auth-only mode is required.");
    }
    if (publicationRequired && process.env.ATHENA_CATALOG_GENERALIZED !== "true" && process.env.ATHENA_MCP_PUBLICATION_MODE === "day4-block4-reviewed-v1" && !fs.existsSync(approvedBlock4Path)) {
      throw new Error("MCP_INITIALIZATION_FAILED: approved-block4.md missing while MCP pilot publication is required.");
    }
  }

  const publicKey = fs.readFileSync(publicKeyPath);

  // Modo Auth-Only estrito (quando explicitamente configurado e chat publication não foi ativada)
  if (process.env.ATHENA_MCP_AUTH_ONLY === "true" && process.env.ATHENA_CATALOG_GENERALIZED !== "true") {
    const { installAuthOnlyReceiver } = await import("./auth-only-receiver.mjs" as any);
    await installAuthOnlyReceiver(app, { publicKey, verifyManagedIdentity });
    return app;
  }

  // Modo Publicação (Generalizado pelo Chat ou Piloto Restrito)
  if (process.env.ATHENA_CATALOG_GENERALIZED === "true" || process.env.ATHENA_MCP_AUTH_ONLY === "false" || process.env.ATHENA_MCP_PUBLISH_ENABLED === "true") {
    const { installCeoApprovalBridge } = await import("./ceo-publication-runtime.mjs" as any);
    const { getApps, getApp, initializeApp } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    const native = getFirestore(getApps().length ? getApp() : initializeApp(), "ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb");
    await installCeoApprovalBridge(app, {
      native,
      publicKey,
      kid: "athena-day4-v1",
      approvedMarkdown: fs.existsSync(approvedBlock4Path) ? fs.readFileSync(approvedBlock4Path, "utf8") : "",
      verifyManagedIdentity
    });
    return app;
  }

  if (mcpRequired) {
    throw new Error("MCP_INITIALIZATION_FAILED: MCP required by configuration but no valid publication bridge or receiver was initialized.");
  }

  return app;
}
