import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const functionsLibDir = path.resolve(__dirname, "../functions/lib");

// Helper to test dynamic app creation in a fresh sub-environment
async function testInitializationWithEnv(envOverrides, removeFiles = []) {
  const originalEnv = { ...process.env };
  const backups = new Map();

  try {
    // Apply env overrides
    for (const [k, v] of Object.entries(envOverrides)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }

    // Temporarily rename files to simulate missing files
    for (const f of removeFiles) {
      const fullPath = path.join(functionsLibDir, f);
      const tempPath = path.join(functionsLibDir, f + ".tmp_test");
      if (fs.existsSync(fullPath)) {
        fs.renameSync(fullPath, tempPath);
        backups.set(fullPath, tempPath);
      }
    }

    // Bust module cache or re-import
    const appUrl = pathToFileURL(path.join(functionsLibDir, "app.js")).href + "?t=" + Date.now() + Math.random();
    const { createAthenaApiApp } = await import(appUrl);
    const app = await createAthenaApiApp();
    return { ok: true, app };
  } catch (err) {
    return { ok: false, error: err };
  } finally {
    // Restore files
    for (const [fullPath, tempPath] of backups.entries()) {
      if (fs.existsSync(tempPath)) {
        fs.renameSync(tempPath, fullPath);
      }
    }
    // Restore env
    for (const k of Object.keys(process.env)) {
      if (!(k in originalEnv)) delete process.env[k];
    }
    for (const [k, v] of Object.entries(originalEnv)) {
      process.env[k] = v;
    }
  }
}

async function run() {
  console.log("=== INICIANDO VERIFICAÇÃO DE INICIALIZAÇÃO SEGURA DO BACKEND ===");
  const results = [];

  // Cenário 1: Flags MCP ativas (ATHENA_MCP_APPROVAL_ENABLED=true) com auth-public.pem ausente
  {
    const res = await testInitializationWithEnv(
      { ATHENA_MCP_APPROVAL_ENABLED: "true" },
      ["auth-public.pem"]
    );
    assert.equal(res.ok, false, "Deveria falhar na ausência de auth-public.pem quando MCP exigido");
    assert.ok(
      res.error.message.includes("MCP_INITIALIZATION_FAILED: auth-public.pem missing"),
      `Mensagem inesperada: ${res.error.message}`
    );
    results.push({
      test: "ausência de auth-public.pem quando MCP exigido",
      status: "PASS",
      diagnostic: res.error.message
    });
    console.log("PASS: Falha fail-closed explícita na ausência de chave pública.");
  }

  // Cenário 2: Publicação exigida (ATHENA_CATALOG_GENERALIZED=true) com ceo-publication-runtime.mjs ausente
  {
    const res = await testInitializationWithEnv(
      { ATHENA_CATALOG_GENERALIZED: "true", ATHENA_MCP_AUTH_ONLY: "false" },
      ["ceo-publication-runtime.mjs"]
    );
    assert.equal(res.ok, false, "Deveria falhar na ausência de ceo-publication-runtime.mjs");
    assert.ok(
      res.error.message.includes("MCP_INITIALIZATION_FAILED: ceo-publication-runtime.mjs missing"),
      `Mensagem inesperada: ${res.error.message}`
    );
    results.push({
      test: "ausência de ceo-publication-runtime.mjs quando publicação chat exigida",
      status: "PASS",
      diagnostic: res.error.message
    });
    console.log("PASS: Falha fail-closed explícita na ausência do runtime de publicação.");
  }

  // Cenário 3: Modo Auth-Only (ATHENA_MCP_AUTH_ONLY=true) com auth-only-receiver.mjs ausente
  {
    const res = await testInitializationWithEnv(
      { ATHENA_MCP_AUTH_ONLY: "true", ATHENA_CATALOG_GENERALIZED: "false" },
      ["auth-only-receiver.mjs"]
    );
    assert.equal(res.ok, false, "Deveria falhar na ausência de auth-only-receiver.mjs");
    assert.ok(
      res.error.message.includes("MCP_INITIALIZATION_FAILED: auth-only-receiver.mjs missing"),
      `Mensagem inesperada: ${res.error.message}`
    );
    results.push({
      test: "ausência de auth-only-receiver.mjs em modo auth-only",
      status: "PASS",
      diagnostic: res.error.message
    });
    console.log("PASS: Falha fail-closed explícita na ausência do auth-only receiver.");
  }

  // Cenário 4: Conflito de configuração: ATHENA_CATALOG_GENERALIZED=true com ATHENA_MCP_AUTH_ONLY=true (tentativa de silenciar publicação pelo chat)
  {
    const res = await testInitializationWithEnv(
      { ATHENA_CATALOG_GENERALIZED: "true", ATHENA_MCP_AUTH_ONLY: "true" }
    );
    assert.equal(res.ok, false, "Deveria falhar no conflito de publicação pelo chat e auth-only");
    assert.ok(
      res.error.message.includes("MCP_INITIALIZATION_FAILED: conflicting configuration"),
      `Mensagem inesperada: ${res.error.message}`
    );
    results.push({
      test: "conflito bloqueando publicação pelo chat silenciada",
      status: "PASS",
      diagnostic: res.error.message
    });
    console.log("PASS: Bloqueio contra servidor subir silenciosamente sem publicação pelo chat.");
  }

  // Cenário 5: Modo local/desenvolvimento seguro (sem flags MCP e sem chave)
  {
    const res = await testInitializationWithEnv(
      {
        ATHENA_MCP_APPROVAL_ENABLED: "false",
        ATHENA_MCP_PUBLISH_ENABLED: "false",
        ATHENA_CATALOG_GENERALIZED: "false",
        ATHENA_MCP_AUTH_ONLY: "false",
        ATHENA_MCP_REAL_PILOT_ENABLED: "false",
        ATHENA_CATALOG_WRITES_ENABLED: "false"
      },
      ["auth-public.pem"]
    );
    assert.equal(res.ok, true, "Modo dev puro sem flags MCP deve iniciar rotas base normalmente");
    assert.ok(typeof res.app === "function", "Deve retornar a função Express");
    results.push({
      test: "modo de desenvolvimento puro sem MCP",
      status: "PASS",
      diagnostic: "Express base app retornado normalmente sem MCP"
    });
    console.log("PASS: Inicialização local segura em modo dev sem MCP.");
  }

  const outDir = path.resolve(__dirname, "../outputs/progress-subscriptions");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "secure-initialization-results.json"),
    JSON.stringify({ passed: results.length, results }, null, 2)
  );

  console.log(`\nTODAS AS ${results.length} VERIFICAÇÕES DE INICIALIZAÇÃO SEGURA FORAM CONCLUÍDAS COM SUCESSO!`);
}

run().catch((err) => {
  console.error("ERRO NO TESTE DE INICIALIZAÇÃO SEGURA:", err);
  process.exit(1);
});
