/**
 * ATHENA — INCORPORAÇÃO ADMINISTRATIVA DOS RESULTADOS RECUPERADOS (att-2)
 *
 * Script administrativo para incorporar ao documento Firestore de produção
 * os 5 findings recuperados da OpenAI Responses API (resp_04e5fa37c665e08e006ac815b6c1cc87d2bb2c68127bf84ad9),
 * sem executar nova chamada externa e mantendo a integridade integral da revisão.
 *
 * DIRETRIZES DE SEGURANÇA E CONCORRÊNCIA:
 * 1. MODO PADRÃO: --dry-run (somente simulação e validação).
 * 2. Para aplicar alterações reais em produção, exige autorização expressa do CEO e a flag --execute.
 * 3. Validação rigorosa de pré-condições antes da gravação:
 *    - review.status == pending_approval
 *    - review.changes.length == 13
 *    - supplement.status == uncertain_interrupted
 *    - supplement.attemptId == att-2
 *    - supplement.attemptCount == 1
 *    - updateTime == 2026-10-08T22:15:07.468915Z
 *    - ausência de findings já incorporados
 * 4. Controle efetivo de concorrência por updateTime na operação de gravação (currentDocument.updateTime na API REST).
 * 5. Backup compulsório integral do documento original antes de qualquer gravação.
 * 6. Preserva 100% o catálogo: ZERO alterações em homologated_lessons ou homologated_parts.
 * 7. Pós-verificação completa em modo somente leitura após a escrita.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import https from "node:https";
import { runValidation } from "./validate-recovered-att2.js";
import { cleanFirestoreData } from "../src/services/legalReviewStore.js";
import type {
  LegalReviewSupplement,
  SupplementFindingItem,
  ConsultedLegalSource,
  LegalSourceHistoryEntry,
} from "../src/lib/legalReviewTypes.js";

export const PROJECT_ID = "gen-lang-client-0822763072";
export const DATABASE_ID = "ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb";
export const TARGET_REVIEW_ID = "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008";
export const TARGET_LESSON_ID = "day_1_part_0";
export const TARGET_RESPONSE_ID = "resp_04e5fa37c665e08e006ac815b6c1cc87d2bb2c68127bf84ad9";
export const EXPECTED_PRECONDITION_UPDATE_TIME = "2026-10-08T22:15:07.468915Z";
export const EXPECTED_LESSON_UPDATE_TIME = "2026-10-01T15:49:46.622720Z";

const SANITIZED_FILE = resolve("scratch/recovered_responses/att2_findings_sanitized.json");
const BACKUP_DIR = resolve("scratch/backups");

export function getAccessToken(): string {
  try {
    const token = execSync("gcloud auth print-access-token", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!token) throw new Error("Token vazio retornado pelo gcloud CLI.");
    return token;
  } catch (error) {
    throw new Error(`Falha ao obter token de acesso do gcloud: ${error}`);
  }
}

export function httpsRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<{ statusCode: number; data: string; json: any }> {
  return new Promise((resolvePromise, rejectPromise) => {
    const parsedUrl = new URL(url);
    const req = https.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json: any = null;
          try {
            json = JSON.parse(data);
          } catch {
            // não json
          }
          resolvePromise({ statusCode: res.statusCode || 0, data, json });
        });
      }
    );
    req.on("error", rejectPromise);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

export function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ("nullValue" in val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return val.doubleValue;
  if ("arrayValue" in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return val;
}

export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return { arrayValue: {} };
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  throw new Error("Tipo não suportado para Firestore Value: " + typeof val);
}

export function loadSanitizedFindings(): {
  responseId: string;
  usage: { total_tokens: number };
  findings: SupplementFindingItem[];
  finalNote: string;
} {
  if (!existsSync(SANITIZED_FILE)) {
    throw new Error(`Arquivo sanitizado não encontrado: ${SANITIZED_FILE}`);
  }
  const content = readFileSync(SANITIZED_FILE, "utf-8");
  return JSON.parse(content);
}

export interface IncorporationPlan {
  reviewId: string;
  lessonId: string;
  currentStatus: string;
  currentChangesCount: number;
  currentSupplementStatus?: string;
  newSupplement: LegalReviewSupplement;
  newConsultedSources: ConsultedLegalSource[];
  newSourceHistory: LegalSourceHistoryEntry[];
  payloadToMerge: Record<string, unknown>;
}

export function buildIncorporationPlan(
  existingDoc: Partial<any>,
  now = Date.now()
): IncorporationPlan {
  if (existingDoc.id && existingDoc.id !== TARGET_REVIEW_ID) {
    throw new Error(`Review ID incorreto: esperado ${TARGET_REVIEW_ID}, encontrado ${existingDoc.id}`);
  }
  if (existingDoc.lessonId && existingDoc.lessonId !== TARGET_LESSON_ID) {
    throw new Error(`Lesson ID incorreto: esperado ${TARGET_LESSON_ID}, encontrado ${existingDoc.lessonId}`);
  }
  if (existingDoc.status && existingDoc.status !== "pending_approval") {
    throw new Error(`Status da revisão deve ser 'pending_approval'. Encontrado: ${existingDoc.status}`);
  }
  if (Array.isArray(existingDoc.changes) && existingDoc.changes.length !== 13) {
    throw new Error(`Quantidade de alterações deve ser 13. Encontrado: ${existingDoc.changes.length}`);
  }

  const sanitized = loadSanitizedFindings();

  const existingSupplement = existingDoc.supplement || {};
  const newSupplement: LegalReviewSupplement = {
    attemptCount: 1,
    attemptId: "att-2",
    status: "inconclusive",
    startedAt: existingSupplement.startedAt || 1791497652286,
    completedAt: existingSupplement.completedAt || 1791497706582,
    durationMs: 52674,
    tokensUsed: sanitized.usage.total_tokens || 39906,
    costEstimatedUsd: 0.123698,
    requestedByUid: existingSupplement.requestedByUid || "9fLrqxrLjdYGc0JW8YvBuLQkgg73",
    requestedByEmail: existingSupplement.requestedByEmail || "jhonny.spider@gmail.com",
    targetedPendingItems: existingSupplement.targetedPendingItems || [],
    findings: sanitized.findings,
    finalNote:
      "A verificação ficou estritamente limitada às cinco pendências apresentadas. Nenhuma foi refutada por fonte oficial; duas possuem suporte oficial apenas parcial, insuficiente para confirmar integralmente a formulação examinada, e três não apresentaram prova oficial verificável. (Incorporação administrativa de resposta OpenAI recuperada sob Response ID resp_04e5fa37c665e08e006ac815b6c1cc87d2bb2c68127bf84ad9).",
  };

  if (Array.isArray(existingSupplement.history)) {
    (newSupplement as any).history = existingSupplement.history;
  }
  if (existingSupplement.previousAttempt) {
    (newSupplement as any).previousAttempt = existingSupplement.previousAttempt;
  }

  const newSourcesFromFindings = sanitized.findings.flatMap((f) => f.sources || []);
  const updatedConsultedSources: ConsultedLegalSource[] = [...(existingDoc.consultedSources || [])];
  for (const s of newSourcesFromFindings) {
    if (!updatedConsultedSources.some((exist) => exist.url === s.url)) {
      updatedConsultedSources.push({
        url: s.url,
        official: s.official,
        institution: s.institution,
        title: s.title,
      });
    }
  }

  const newHistoryEntry: LegalSourceHistoryEntry = {
    at: now,
    verificationLevel: existingDoc.verificationLevel || "VERIFICACAO_PARCIAL",
    consultedSources: updatedConsultedSources,
    note: `Complementação jurídica de evidências (inconclusive): Incorporação administrativa dos cinco findings recuperados da tentativa att-2 (Response ID: ${TARGET_RESPONSE_ID}, consumo: 39.906 tokens, custo: US$ 0,123698). Sem novas chamadas pagas à OpenAI.`,
  };

  const updatedSourceHistory: LegalSourceHistoryEntry[] = [
    ...(existingDoc.sourceHistory || []),
    newHistoryEntry,
  ];

  const payloadToMerge = cleanFirestoreData({
    supplement: newSupplement,
    consultedSources: updatedConsultedSources,
    sourceHistory: updatedSourceHistory,
  });

  return {
    reviewId: TARGET_REVIEW_ID,
    lessonId: TARGET_LESSON_ID,
    currentStatus: existingDoc.status || "pending_approval",
    currentChangesCount: existingDoc.changes?.length ?? 13,
    currentSupplementStatus: existingDoc.supplement?.status,
    newSupplement,
    newConsultedSources: updatedConsultedSources,
    newSourceHistory: updatedSourceHistory,
    payloadToMerge,
  };
}

export async function fetchProductionDoc(token: string, docPath: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${docPath}`;
  const resp = await httpsRequest(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (resp.statusCode !== 200) {
    throw new Error(`Falha ao ler documento ${docPath} no Firestore (status ${resp.statusCode}): ${resp.data}`);
  }
  return resp.json;
}

export function savePreWriteBackup(rawDoc: Record<string, unknown>): string {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = resolve(BACKUP_DIR, `${TARGET_REVIEW_ID}_backup_${timestamp}.json`);
  writeFileSync(backupPath, JSON.stringify(rawDoc, null, 2), "utf-8");
  if (!existsSync(backupPath) || readFileSync(backupPath, "utf-8").length === 0) {
    throw new Error(`Falha ao verificar gravação do backup em ${backupPath}`);
  }
  return backupPath;
}

export async function executeCommitWithPrecondition(
  token: string,
  docPath: string,
  fieldsToUpdate: Record<string, any>,
  expectedUpdateTime: string
) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:commit`;
  const docFullName = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${docPath}`;

  const firestoreFields: Record<string, any> = {};
  const fieldPaths: string[] = [];

  for (const [key, val] of Object.entries(fieldsToUpdate)) {
    fieldPaths.push(key);
    firestoreFields[key] = toFirestoreValue(val);
  }

  const commitBody = {
    writes: [
      {
        update: {
          name: docFullName,
          fields: firestoreFields,
        },
        updateMask: {
          fieldPaths,
        },
        currentDocument: {
          updateTime: expectedUpdateTime,
        },
      },
    ],
  };

  const resp = await httpsRequest(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commitBody),
  });

  if (resp.statusCode !== 200) {
    throw new Error(`Falha no commit com pré-condição (HTTP ${resp.statusCode}): ${resp.data}`);
  }

  return resp.json;
}

async function main() {
  console.log("================================================================================");
  console.log("ATHENA — EXECUÇÃO CONTROLADA DA INCORPORAÇÃO DOS RESULTADOS att-2");
  console.log("================================================================================\n");

  const isExecuteAuthorized = process.argv.includes("--execute");

  console.log("Projeto:", PROJECT_ID);
  console.log("Banco Firestore:", DATABASE_ID);
  console.log("Revisão Jurídica Alvo:", TARGET_REVIEW_ID);
  console.log("Aula Alvo:", TARGET_LESSON_ID);
  console.log("Response ID Recuperado:", TARGET_RESPONSE_ID);
  console.log("Pré-condição updateTime esperada:", EXPECTED_PRECONDITION_UPDATE_TIME);
  console.log("Modo de Operação:", isExecuteAuthorized ? "EXECUÇÃO AUTORIZADA (--execute)" : "DRY-RUN / SOMENTE LEITURA");

  // --------------------------------------------------------------------------------
  // ETAPA 1 — VERIFICAÇÕES ANTES DA GRAVAÇÃO
  // --------------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("ETAPA 1 — VERIFICAÇÕES ANTES DA GRAVAÇÃO");
  console.log("================================================================================");

  // 1.1 Executar novamente a validação local dos arquivos recuperados
  console.log("\n1.1 Validando arquivos locais recuperados...");
  const validationPassed = runValidation();
  if (!validationPassed) {
    throw new Error("Validação dos arquivos recuperados falhou. Abortando.");
  }

  // 1.2 Obter credencial e consultar documento atual em modo somente leitura
  console.log("\n1.2 Consultando documento atual no Firestore de produção (somente leitura)...");
  const token = getAccessToken();
  const rawReviewDoc = await fetchProductionDoc(token, `legal_reviews/${TARGET_REVIEW_ID}`);

  const reviewStatus = rawReviewDoc.fields?.status?.stringValue;
  const changesCount = rawReviewDoc.fields?.changes?.arrayValue?.values?.length || 0;
  const suppFields = rawReviewDoc.fields?.supplement?.mapValue?.fields || {};
  const suppStatus = suppFields.status?.stringValue;
  const suppAttemptId = suppFields.attemptId?.stringValue;
  const suppAttemptCount = parseInt(suppFields.attemptCount?.integerValue || "0", 10);
  const currentUpdateTime = rawReviewDoc.updateTime;
  const currentFindingsCount = suppFields.findings?.arrayValue?.values?.length || 0;

  console.log("  - review.status:", reviewStatus);
  console.log("  - review.changes count:", changesCount);
  console.log("  - supplement.status:", suppStatus);
  console.log("  - supplement.attemptId:", suppAttemptId);
  console.log("  - supplement.attemptCount:", suppAttemptCount);
  console.log("  - updateTime atual:", currentUpdateTime);
  console.log("  - findings atualmente incorporados:", currentFindingsCount);

  // 1.3 Confirmações obrigatórias
  console.log("\n1.3 Verificando condições obrigatórias do estado de produção...");
  if (reviewStatus !== "pending_approval") {
    throw new Error(`Pré-condição falhou: review.status é '${reviewStatus}', esperado 'pending_approval'.`);
  }
  if (changesCount !== 13) {
    throw new Error(`Pré-condição falhou: alterações contam ${changesCount}, esperado 13.`);
  }
  if (suppStatus !== "uncertain_interrupted") {
    throw new Error(`Pré-condição falhou: supplement.status é '${suppStatus}', esperado 'uncertain_interrupted'.`);
  }
  if (suppAttemptId !== "att-2") {
    throw new Error(`Pré-condição falhou: supplement.attemptId é '${suppAttemptId}', esperado 'att-2'.`);
  }
  if (suppAttemptCount !== 1) {
    throw new Error(`Pré-condição falhou: supplement.attemptCount é ${suppAttemptCount}, esperado 1.`);
  }
  if (currentUpdateTime !== EXPECTED_PRECONDITION_UPDATE_TIME) {
    throw new Error(
      `Pré-condição falhou: updateTime atual (${currentUpdateTime}) difere do esperado (${EXPECTED_PRECONDITION_UPDATE_TIME}). Concorrência detectada!`
    );
  }
  if (currentFindingsCount !== 0) {
    throw new Error(`Pré-condição falhou: documento já possui ${currentFindingsCount} findings incorporados.`);
  }
  console.log("✓ Todas as 7 pré-condições obrigatórias do documento foram confirmadas com sucesso.");

  // 1.4 Conferir que os 5 findings recuperados correspondem exatamente à resposta original e são nao_verificada
  console.log("\n1.4 Conferindo os 5 findings contra a resposta original...");
  const sanitized = loadSanitizedFindings();
  if (sanitized.responseId !== TARGET_RESPONSE_ID) {
    throw new Error(`Response ID divergente: esperado ${TARGET_RESPONSE_ID}, obtido ${sanitized.responseId}`);
  }
  if (sanitized.findings.length !== 5) {
    throw new Error(`Quantidade de findings divergente: esperado 5, obtido ${sanitized.findings.length}`);
  }
  sanitized.findings.forEach((f, idx) => {
    if (f.status !== "nao_verificada") {
      throw new Error(`Finding ${idx} (${f.pendingId}) possui status '${f.status}', esperado 'nao_verificada'`);
    }
  });
  console.log("✓ Os 5 findings conferem exatamente e estão classificados como 'nao_verificada'.");

  // 1.5 Verificar mecanismo de controle efetivo de concorrência por updateTime
  console.log("\n1.5 Verificando mecanismo de concorrência por updateTime...");
  console.log("  - Mecanismo configurado: Firestore REST API commit com currentDocument.updateTime");
  console.log("  - Valor da pré-condição enviado na requisição atômica:", EXPECTED_PRECONDITION_UPDATE_TIME);
  console.log("  - Garantia: O servidor do Google Firestore rejeitará a gravação caso haja divergência atômica.");
  console.log("✓ Controle de concorrência comprovado.");

  // 1.6 Criar backup integral do documento original
  console.log("\n1.6 Criando backup integral do documento original antes de qualquer gravação...");
  const backupPath = savePreWriteBackup(rawReviewDoc);
  const backupStat = readFileSync(backupPath, "utf-8");
  console.log("✓ Backup integral gravado com sucesso!");
  console.log("  - Caminho do backup:", backupPath);
  console.log("  - Tamanho do backup:", backupStat.length, "bytes");

  // Conferir estado do catálogo antes de prosseguir
  console.log("\n1.7 Conferindo estado do catálogo publicado (homologated_lessons/day_1_part_0)...");
  const rawLessonDoc = await fetchProductionDoc(token, `homologated_lessons/${TARGET_LESSON_ID}`);
  const lessonStatus = rawLessonDoc.fields?.status?.stringValue;
  const lessonUpdateTime = rawLessonDoc.updateTime;
  console.log("  - Catálogo status:", lessonStatus);
  console.log("  - Catálogo updateTime:", lessonUpdateTime);
  if (lessonStatus !== "approved" || lessonUpdateTime !== EXPECTED_LESSON_UPDATE_TIME) {
    throw new Error(`Catálogo em estado inesperado: status=${lessonStatus}, updateTime=${lessonUpdateTime}`);
  }
  console.log("✓ Catálogo confirmado em estado 'approved' e updateTime original intacto.");

  // Preparação do payload para a gravação
  const parsedDoc: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawReviewDoc.fields || {})) {
    parsedDoc[k] = fromFirestoreValue(v);
  }

  const existingSupplement = parsedDoc.supplement || {};
  const existingConsulted = parsedDoc.consultedSources || [];
  const existingSourceHistory = parsedDoc.sourceHistory || [];

  const newSupplement: LegalReviewSupplement = {
    attemptCount: 1,
    attemptId: "att-2",
    status: "inconclusive",
    startedAt: existingSupplement.startedAt || 1791497652286,
    completedAt: existingSupplement.completedAt || 1791497706582,
    durationMs: 52674,
    tokensUsed: 39906,
    costEstimatedUsd: 0.123698,
    requestedByUid: existingSupplement.requestedByUid || "9fLrqxrLjdYGc0JW8YvBuLQkgg73",
    requestedByEmail: existingSupplement.requestedByEmail || "jhonny.spider@gmail.com",
    targetedPendingItems: existingSupplement.targetedPendingItems || [],
    findings: sanitized.findings,
    finalNote:
      "A verificação ficou estritamente limitada às cinco pendências apresentadas. Nenhuma foi refutada por fonte oficial; duas possuem suporte oficial apenas parcial, insuficiente para confirmar integralmente a formulação examinada, e três não apresentaram prova oficial verificável. (Incorporação administrativa de resposta OpenAI recuperada sob Response ID resp_04e5fa37c665e08e006ac815b6c1cc87d2bb2c68127bf84ad9).",
  };

  // Preservar history e previousAttempt se existirem
  if (Array.isArray(existingSupplement.history)) {
    (newSupplement as any).history = existingSupplement.history;
  }
  if (existingSupplement.previousAttempt) {
    (newSupplement as any).previousAttempt = existingSupplement.previousAttempt;
  }

  // Atualizar consultedSources deduplicando por URL
  const newSourcesFromFindings = sanitized.findings.flatMap((f) => f.sources || []);
  const updatedConsultedSources: ConsultedLegalSource[] = [...existingConsulted];
  for (const s of newSourcesFromFindings) {
    if (!updatedConsultedSources.some((exist) => exist.url === s.url)) {
      updatedConsultedSources.push({
        url: s.url,
        official: s.official,
        institution: s.institution,
        title: s.title,
      });
    }
  }

  // Nova entrada em sourceHistory
  const now = Date.now();
  const newHistoryEntry: LegalSourceHistoryEntry = {
    at: now,
    verificationLevel: parsedDoc.verificationLevel || "VERIFICACAO_PARCIAL",
    consultedSources: updatedConsultedSources,
    note: `Complementação jurídica de evidências (inconclusive): Incorporação administrativa dos cinco findings recuperados da tentativa att-2 (Response ID: ${TARGET_RESPONSE_ID}, consumo: 39.906 tokens, custo: US$ 0,123698). Sem novas chamadas pagas à OpenAI.`,
  };

  const updatedSourceHistory: LegalSourceHistoryEntry[] = [...existingSourceHistory, newHistoryEntry];

  const cleanedFieldsToUpdate = cleanFirestoreData({
    supplement: newSupplement,
    consultedSources: updatedConsultedSources,
    sourceHistory: updatedSourceHistory,
  });

  if (!isExecuteAuthorized) {
    console.log("\n================================================================================");
    console.log("[MODO DRY-RUN CONCLUÍDO COM SUCESSO]");
    console.log("Todas as verificações pré-gravação foram APROVADAS.");
    console.log("Nenhuma gravação foi realizada em produção.");
    console.log("Para efetivar a gravação autorizada, execute com a flag --execute.");
    console.log("================================================================================");
    return;
  }

  // --------------------------------------------------------------------------------
  // ETAPA 2 — EXECUÇÃO ÚNICA
  // --------------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("ETAPA 2 — EXECUÇÃO ÚNICA DA GRAVAÇÃO NO FIRESTORE");
  console.log("================================================================================");

  console.log("Disparando commit atômico no Firestore com pré-condição updateTime...");
  const commitResult = await executeCommitWithPrecondition(
    token,
    `legal_reviews/${TARGET_REVIEW_ID}`,
    cleanedFieldsToUpdate,
    EXPECTED_PRECONDITION_UPDATE_TIME
  );

  console.log("✓ Commit executado com sucesso!");
  console.log("  - Commit Time:", commitResult.commitTime);
  console.log("  - Resultados de escrita:", JSON.stringify(commitResult.writeResults));

  // --------------------------------------------------------------------------------
  // ETAPA 3 — VERIFICAÇÃO POSTERIOR
  // --------------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("ETAPA 3 — VERIFICAÇÃO POSTERIOR (SOMENTE LEITURA)");
  console.log("================================================================================");

  console.log("Consultando documento atualizado no Firestore de produção...");
  const postReviewDoc = await fetchProductionDoc(token, `legal_reviews/${TARGET_REVIEW_ID}`);

  const postParsed: Record<string, any> = {};
  for (const [k, v] of Object.entries(postReviewDoc.fields || {})) {
    postParsed[k] = fromFirestoreValue(v);
  }

  const postUpdateTime = postReviewDoc.updateTime;
  const postStatus = postParsed.status;
  const postChanges = postParsed.changes || [];
  const postClaims = postParsed.unverifiedClaims || [];
  const postSupplement = postParsed.supplement || {};
  const postFindings = postSupplement.findings || [];
  const postHistory = postParsed.sourceHistory || [];
  const postConsulted = postParsed.consultedSources || [];

  console.log("1. Revisão permanece pending_approval?", postStatus === "pending_approval" ? "SIM" : "NÃO");
  if (postStatus !== "pending_approval") throw new Error("Status pós-escrita incorreto: " + postStatus);

  console.log("2. 13 alterações originais permanecem intactas?", postChanges.length === 13 ? "SIM" : "NÃO");
  if (postChanges.length !== 13) throw new Error("Quantidade de alterações alterada: " + postChanges.length);

  console.log("3. 3 unverifiedClaims originais preservadas?", postClaims.length === 3 ? "SIM" : "NÃO");
  if (postClaims.length !== 3) throw new Error("Quantidade de claims alterada: " + postClaims.length);

  console.log("4. Supplement contém os 5 findings recuperados?", postFindings.length === 5 ? "SIM" : "NÃO");
  if (postFindings.length !== 5) throw new Error("Quantidade de findings incorreta: " + postFindings.length);

  const allNaoVerificada = postFindings.every((f: any) => f.status === "nao_verificada");
  console.log("5. Todos os 5 findings permanecem 'nao_verificada'?", allNaoVerificada ? "SIM" : "NÃO");
  if (!allNaoVerificada) throw new Error("Findings possuem status diferente de nao_verificada");

  console.log("6. Supplement registra status 'inconclusive'?", postSupplement.status === "inconclusive" ? "SIM" : "NÃO");
  if (postSupplement.status !== "inconclusive") throw new Error("Supplement status incorreto: " + postSupplement.status);

  const lastHistoryNote = postHistory[postHistory.length - 1]?.note || "";
  const hasAtt2RecoveryNote = lastHistoryNote.includes("att-2") && lastHistoryNote.includes(TARGET_RESPONSE_ID);
  console.log("7. Histórico registra a recuperação administrativa da tentativa att-2?", hasAtt2RecoveryNote ? "SIM" : "NÃO");
  if (!hasAtt2RecoveryNote) throw new Error("Entrada de histórico não encontrada");

  const tokensMatch = postSupplement.tokensUsed === 39906;
  console.log("8. Response ID e consumo de 39.906 tokens registrados corretamente?", tokensMatch ? "SIM" : "NÃO");
  if (!tokensMatch) throw new Error("Tokens divergentes: " + postSupplement.tokensUsed);

  const uniqueUrls = new Set(postConsulted.map((s: any) => s.url));
  const noDuplicates = uniqueUrls.size === postConsulted.length;
  console.log("9. Nenhuma duplicação de fontes em consultedSources?", noDuplicates ? "SIM" : "NÃO");
  if (!noDuplicates) throw new Error("Duplicação detectada em consultedSources");

  console.log("\nVerificando o catálogo publicado após a operação...");
  const postLessonDoc = await fetchProductionDoc(token, `homologated_lessons/${TARGET_LESSON_ID}`);
  const postLessonStatus = postLessonDoc.fields?.status?.stringValue;
  const postLessonUpdateTime = postLessonDoc.updateTime;

  const lessonUntouched =
    postLessonStatus === "approved" && postLessonUpdateTime === EXPECTED_LESSON_UPDATE_TIME;
  console.log(
    "10. A aula homologated_lessons/day_1_part_0 permanece approved e com updateTime original de 2026-10-01T15:49:46.622720Z?",
    lessonUntouched ? "SIM" : "NÃO"
  );
  if (!lessonUntouched) {
    throw new Error(
      `Catálogo foi alterado indevidamente! status=${postLessonStatus}, updateTime=${postLessonUpdateTime}`
    );
  }

  console.log("\n================================================================================");
  console.log("INCORPORAÇÃO E VERIFICAÇÃO CONCLUÍDAS COM SUCESSO ABSOLUTO!");
  console.log("================================================================================");
  console.log("updateTime anterior:", EXPECTED_PRECONDITION_UPDATE_TIME);
  console.log("updateTime posterior:", postUpdateTime);
  console.log("Backup gravado em:", backupPath);
}

if (process.argv[1] && process.argv[1].endsWith("incorporate-att2-findings.ts")) {
  main().catch((err) => {
    console.error("\n❌ ERRO NA OPERAÇÃO:", err);
    process.exit(1);
  });
}

