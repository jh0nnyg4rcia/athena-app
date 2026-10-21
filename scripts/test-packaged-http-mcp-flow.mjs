import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateKeyPairSync, createHash, randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gwDir = path.resolve(__dirname, "../../athena-admin-gateway");
const toGwUrl = (p) => pathToFileURL(path.join(gwDir, p)).href;

// Import tools from catalog generalization
const { createCatalogPolicy, buildCatalogPlan, idPattern, bytesHash } = await import(
  toGwUrl("catalog-generalization/policy.mjs")
);
const { exactReviewedLesson } = await import(
  toGwUrl("real-catalog-pilot/exact-reviewed-lesson.ts")
);
const { approvalSigner } = await import(
  toGwUrl("ceo-approval-bridge/signature.ts")
);
const { sha256, split } = await import(
  toGwUrl("catalog-integration/catalog-adapter.mjs")
);

// Helper to send mock HTTP requests directly to an Express app
async function mockRequest(app, method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    // Use an in-memory mock request/response
    const req = {
      method,
      url: urlPath,
      headers: { ...headers },
      body,
      query: {},
      params: {}
    };

    let statusCode = 200;
    const responseHeaders = {};
    let responseBody = null;

    const res = {
      status(code) {
        statusCode = code;
        return res;
      },
      setHeader(name, val) {
        responseHeaders[name.toLowerCase()] = val;
        return res;
      },
      json(data) {
        responseBody = data;
        resolve({ status: statusCode, headers: responseHeaders, body: responseBody });
        return res;
      },
      send(data) {
        responseBody = data;
        resolve({ status: statusCode, headers: responseHeaders, body: responseBody });
        return res;
      },
      end() {
        resolve({ status: statusCode, headers: responseHeaders, body: responseBody });
      }
    };

    try {
      app(req, res, (err) => {
        if (err) reject(err);
        else resolve({ status: 404, headers: {}, body: null });
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function run() {
  console.log("================================================================================");
  console.log("ATHENA — FLUXO POSITIVO EMPACOTADO (CHAT MCP HTTP DIRETO NO APP)");
  console.log("Ambiente: Local 100% isolado, banco emulado, sem Day 4 restrito");
  console.log("================================================================================\n");

  const EMULATOR_PORT = "8197";
  process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${EMULATOR_PORT}`;

  // 1. Gerar par de chaves RSA em memória para assinar e verificar JWS de teste
  const pair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });

  const { createPublicKey } = await import("node:crypto");
  const testPublicKeyDerHash = createHash("sha256")
    .update(createPublicKey(pair.publicKey).export({ type: "spki", format: "der" }))
    .digest("hex");

  // Salvar backup de auth-public.pem existente e escrever a chave de teste
  const authPemPath = path.resolve(__dirname, "../functions/lib/auth-public.pem");
  const origAuthPem = fs.existsSync(authPemPath) ? fs.readFileSync(authPemPath) : null;
  fs.writeFileSync(authPemPath, pair.publicKey);

  // 2. Configurar variáveis de ambiente exigidas para publicação generalizada
  process.env.ATHENA_CATALOG_GENERALIZED = "true";
  process.env.ATHENA_CATALOG_WRITES_ENABLED = "true";
  process.env.ATHENA_CATALOG_ALLOW_ALL = "true";
  process.env.DISCOVERY_ONLY = "true";
  process.env.K_SERVICE = "athenaapi";
  process.env.GOOGLE_CLOUD_PROJECT = "gen-lang-client-0822763072";
  process.env.ATHENA_MCP_APPROVAL_ENABLED = "true";
  process.env.ATHENA_MCP_PUBLISH_ENABLED = "true";
  process.env.ATHENA_MCP_AUTH_ONLY = "false";
  process.env.ATHENA_APPROVAL_PUBLIC_KEY_SHA256 = testPublicKeyDerHash;

  // 3. Mock isolado de OAuth2Client.prototype.verifyIdToken
  const origVerifyIdToken = OAuth2Client.prototype.verifyIdToken;
  OAuth2Client.prototype.verifyIdToken = async function ({ idToken, audience }) {
    if (idToken === "test-oidc-service-token") {
      return {
        getPayload: () => ({
          iss: "https://accounts.google.com",
          email: "mcp-admin@athena-mcp-hml-20261013.iam.gserviceaccount.com",
          email_verified: true
        })
      };
    }
    throw new Error("INVALID_SERVICE_TOKEN");
  };

  // 4. Mock de metadata server para verificação de managed identity do CEO
  const origFetch = globalThis.fetch;
  globalThis.fetch = async function (url, opts) {
    const urlStr = String(url);
    if (urlStr.includes("metadata.google.internal")) {
      return {
        ok: true,
        headers: new Headers({ "Metadata-Flavor": "Google" }),
        text: async () => "217533514119-compute@developer.gserviceaccount.com"
      };
    }
    return origFetch.apply(this, arguments);
  };

  try {
    // 5. Inicializar o Firebase Admin e obter o Firestore nativo emulado
    const adminAppMod = await import("firebase-admin/app");
    const adminDbMod = await import("firebase-admin/firestore");

    const appInstance = adminAppMod.getApps().length
      ? adminAppMod.getApp()
      : adminAppMod.initializeApp({ projectId: "gen-lang-client-0822763072" });
    const firestore = adminDbMod.getFirestore(appInstance, "ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb");
    firestore.settings({ ignoreUndefinedProperties: true });

    // 6. Carregar e inicializar o App empacotado functions/lib/app.js
    const appUrl = pathToFileURL(path.resolve(__dirname, "../functions/lib/app.js")).href + "?t=" + Date.now();
    const { createAthenaApiApp } = await import(appUrl);
    const expressApp = await createAthenaApiApp();
    console.log("App Express empacotado inicializado com bridge MCP generalizada montada com sucesso.\n");

    const policy = createCatalogPolicy({
      target: {
        projectId: "gen-lang-client-0822763072",
        databaseId: "ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb"
      }
    });

    const signEvidence = approvalSigner(pair.privateKey, "athena-day4-v1");

    // Lições de teste para comprovar generalização (Dia 5 e Dia 1, não Dia 4)
    const testCases = [
      { id: "day_5_part_1", day: 5, part: 1, subject: "Direito Constitucional", editBlock: 2, marker: "[BLOCK_2]" },
      { id: "day_1_part_0", day: 1, part: 0, subject: "Direito Processual Civil", editBlock: 4, marker: "[BLOCK_4]" }
    ];

    const results = [];

    for (const tc of testCases) {
      console.log(`--- Testando lição ${tc.id} (${tc.subject}), editando ${tc.marker} ---`);

      const questions = {
        questions: [
          { text: "Questão teste 1?", options: ["A", "B"], correctIndex: 0, explanation: "Exp 1" },
          { text: "Questão teste 2?", options: ["A", "B"], correctIndex: 1, explanation: "Exp 2" }
        ]
      };
      const initialContent = [
        `[BLOCK_1]\n# ${tc.subject} — Bloco 1 Fundamentos\nTexto original do bloco 1 que deve ser rigorosamente preservado intacto.\n`,
        `[BLOCK_2]\n## Bloco 2 Doutrina\nTexto original do bloco 2 antes da revisão editorial pelo chat.\n`,
        `[BLOCK_3]\n## Bloco 3 Jurisprudência\nTexto original do bloco 3 que deve ser rigorosamente preservado intacto.\n`,
        `[BLOCK_4]\n## Bloco 4 Casos Práticos\nTexto original do bloco 4 que deve ser rigorosamente preservado intacto.\n`,
        `[BLOCK_5]\n## Bloco 5 Questões e Desafio\n[ATHENA_CHALLENGE]\n${JSON.stringify(questions, null, 2)}\n`,
        `[BLOCK_6]\n## Bloco 6 Resumo Final\nTexto de resumo que deve ser rigorosamente preservado intacto.\n`
      ].join("");

      const seedLesson = exactReviewedLesson({
        id: tc.id,
        day: tc.day,
        part: tc.part,
        subject: tc.subject,
        topic: `${tc.subject} - Geral`,
        status: "approved",
        version: 1,
        approvedAt: Date.now() - 50000,
        approvedBy: "jhonny.spider@gmail.com",
        synthetic: false,
        challenge: questions,
        content: initialContent,
        blocks: Array(6).fill("")
      });

      const seedCatalog = {
        id: tc.id,
        day: tc.day,
        part: tc.part,
        subject: tc.subject,
        status: "approved",
        version: 1,
        approvedAt: seedLesson.approvedAt,
        approvedBy: "jhonny.spider@gmail.com"
      };

      // Gravar estado inicial no Firestore emulado
      await firestore.collection("homologated_lessons").doc(tc.id).set(seedLesson);
      await firestore.collection("homologated_parts").doc(tc.id).set(seedCatalog);

      // Snapshot antes
      const beforeLessonSnap = (await firestore.collection("homologated_lessons").doc(tc.id).get()).data();
      const beforeCatalogSnap = (await firestore.collection("homologated_parts").doc(tc.id).get()).data();
      const snapshot = { lesson: beforeLessonSnap, catalogEntry: beforeCatalogSnap };

      assert.equal(beforeLessonSnap.version, 1, "Versão inicial deve ser 1");
      assert.equal(beforeCatalogSnap.version, 1, "Versão do catálogo inicial deve ser 1");

      // Construir plano com novo Markdown para o bloco alvo
      const newBlockContent = `${tc.marker}\n## SEÇÃO REVISADA PELO CHAT MCP\nEste conteúdo foi editado e autorizado pelo CEO via bridge generalizada.\n`;
      const operationId = randomUUID();
      const now = Date.now();
      const actor = "mcp-admin@athena-mcp-hml-20261013.iam.gserviceaccount.com";

      const plan = buildCatalogPlan(snapshot, newBlockContent, {
        policy,
        normalize: exactReviewedLesson,
        actor,
        now,
        operationId,
        lessonId: tc.id,
        marker: tc.marker,
        markdownSha256: bytesHash(newBlockContent)
      });

      const approval = {
        state: "approved",
        method: "authenticated-browser-explicit-post",
        actor,
        operationId: plan.operationId,
        planSha256: plan.planSha256,
        baselineVersion: plan.baselineVersion,
        baselineSha256: plan.baselineSha256,
        contentSha256: sha256(plan.proposed),
        expiresAt: plan.expiresAt
      };

      const evidence = {
        issuer: "athena-mcp-hml-20261013",
        audience: "athena-ceo-pilot-publication",
        caller: "mcp-admin@athena-mcp-hml-20261013.iam.gserviceaccount.com",
        writer: "217533514119-compute@developer.gserviceaccount.com",
        plan,
        approval,
        reservationId: plan.operationId,
        issuedAt: now,
        expiresAt: plan.expiresAt
      };

      const signedEvidence = signEvidence(evidence);

      // 7. Chamada HTTP POST ao endpoint empacotado /api/internal/mcp-day4/publish
      const publishRes = await mockRequest(
        expressApp,
        "POST",
        "/api/internal/mcp-day4/publish",
        {
          authorization: "Bearer test-oidc-service-token",
          "content-type": "application/json"
        },
        { evidence: signedEvidence }
      );

      assert.equal(publishRes.status, 200, `Publicação deve retornar 200: ${JSON.stringify(publishRes.body)}`);
      const receipt = publishRes.body;
      assert.equal(receipt.resultingVersion, 2, "Versão resultante no recibo deve ser 2");
      assert.equal(receipt.lessonId, tc.id, "Lição no recibo deve ser a correta");
      assert.equal(receipt.planSha256, plan.planSha256, "planSha256 no recibo deve bater com o plano");

      // 8. Consulta posterior ao recibo via HTTP POST /api/internal/mcp-day4/receipt
      const receiptRes = await mockRequest(
        expressApp,
        "POST",
        "/api/internal/mcp-day4/receipt",
        {
          authorization: "Bearer test-oidc-service-token",
          "content-type": "application/json"
        },
        { operationId: plan.operationId, planSha256: plan.planSha256 }
      );

      assert.equal(receiptRes.status, 200, "Consulta de recibo deve retornar 200");
      assert.deepEqual(receiptRes.body.receipt, receipt, "Recibo consultado deve ser idêntico ao emitido");

      // 9. Verificação direta no banco emulado
      const afterLessonSnap = (await firestore.collection("homologated_lessons").doc(tc.id).get()).data();
      const afterCatalogSnap = (await firestore.collection("homologated_parts").doc(tc.id).get()).data();

      // Sincronização atômica de versão: ambas as coleções devem estar na versão 2
      assert.equal(afterLessonSnap.version, 2, "homologated_lessons deve estar na versão 2");
      assert.equal(afterCatalogSnap.version, 2, "homologated_parts deve estar sincronizado na versão 2");

      // Preservação estrita dos blocos não editados
      const beforeChunks = split(beforeLessonSnap.content).chunks;
      const afterChunks = split(afterLessonSnap.content).chunks;
      const targetIdx = tc.editBlock - 1;

      assert.equal(afterChunks.length, 6, "Deve haver 6 blocos");
      assert.equal(afterChunks[targetIdx].trim(), newBlockContent.trim(), "Bloco editado deve conter nova redação");

      for (let i = 0; i < 6; i++) {
        if (i !== targetIdx) {
          assert.equal(
            afterChunks[i],
            beforeChunks[i],
            `Bloco ${i + 1} não editado DEVE estar estritamente idêntico ao original`
          );
        }
      }

      // Desafio e questões preservados 100%
      assert.deepEqual(
        afterLessonSnap.challenge,
        beforeLessonSnap.challenge,
        "Challenge/questões deve ser rigorosamente preservado"
      );

      // Verificação de auditoria e backup
      const backupDoc = (await firestore.collection("mcp_editorial_backups").doc(plan.planSha256).get()).data();
      assert.ok(backupDoc, "Backup do estado anterior deve existir");
      assert.equal(backupDoc.lesson.version, 1, "Backup deve guardar lição na versão 1");

      const receiptDoc = (await firestore.collection("mcp_editorial_receipts").doc(plan.planSha256).get()).data();
      assert.ok(receiptDoc, "Recibo oficial deve estar persistido");
      assert.equal(receiptDoc.resultingVersion, 2, "Recibo gravado deve ter versão 2");

      // 10. Bloqueio anti-replay: tentar publicar a mesma evidência consumida deve ser rejeitado
      const replayRes = await mockRequest(
        expressApp,
        "POST",
        "/api/internal/mcp-day4/publish",
        {
          authorization: "Bearer test-oidc-service-token",
          "content-type": "application/json"
        },
        { evidence: signedEvidence }
      );
      assert.equal(replayRes.status, 403, "Tentativa de replay com evidência consumida deve ser rejeitada com 403");

      results.push({
        lessonId: tc.id,
        day: tc.day,
        part: tc.part,
        subject: tc.subject,
        editedBlock: tc.marker,
        previousVersion: 1,
        resultingVersion: 2,
        uneditedBlocksPreserved: [1, 2, 3, 4, 5, 6].filter((b) => b !== tc.editBlock),
        catalogVersionSynced: true,
        receiptConfirmed: true,
        antiReplayEnforced: true,
        status: "PASS"
      });

      console.log(`PASS: ${tc.id} publicado via HTTP com sucesso. Versões sincronizadas (v2) e 5 blocos preservados.`);
    }

    const outDir = path.resolve(__dirname, "../outputs/progress-subscriptions");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, "packaged-http-mcp-flow-results.json"),
      JSON.stringify({ passed: results.length, testCases: results }, null, 2)
    );

    console.log("\n================================================================================");
    console.log(`TODAS AS ${results.length} PUBLICAÇÕES DO FLUXO POSITIVO EMPACOTADO FORAM CONCLUÍDAS COM SUCESSO!`);
    console.log("================================================================================\n");
  } finally {
    // Restaurar fetch e OAuth2Client
    globalThis.fetch = origFetch;
    OAuth2Client.prototype.verifyIdToken = origVerifyIdToken;
    // Restaurar auth-public.pem
    if (origAuthPem) {
      fs.writeFileSync(authPemPath, origAuthPem);
    }
  }
}

run().catch((err) => {
  console.error("ERRO NO FLUXO POSITIVO EMPACOTADO:", err);
  process.exit(1);
});
