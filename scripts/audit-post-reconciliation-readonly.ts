import { execSync } from "child_process";
import { hashCatalogSnapshot, type StoredCatalogLesson } from "../src/services/legalReviewRepository";
import type { LegalReviewView } from "../src/lib/legalReviewTypes";
import {
  computeDecisionStateHash,
  validateReconciliationIntegrity,
  validateFindingsHomologation,
} from "../src/lib/legalReviewValidate";

const PROJECT_ID = "gen-lang-client-0822763072";
const DATABASE_ID = "ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

function getToken(): string {
  return execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
}

function unwrapFirestoreValue(val: any): any {
  if (!val || typeof val !== "object") return val;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return parseFloat(val.doubleValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  if ("timestampValue" in val) return val.timestampValue;
  if ("arrayValue" in val) {
    return (val.arrayValue.values || []).map(unwrapFirestoreValue);
  }
  if ("mapValue" in val) {
    const res: Record<string, any> = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = unwrapFirestoreValue(v);
    }
    return res;
  }
  return val;
}

function unwrapFirestoreDoc(doc: any): any {
  const res: Record<string, any> = {};
  const fields = doc.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    res[k] = unwrapFirestoreValue(v);
  }
  return res;
}

async function fetchDoc(collection: string, docId: string, token: string): Promise<any> {
  const url = `${BASE_URL}/${collection}/${docId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Falha HTTP ${res.status} ao ler ${collection}/${docId}: ${await res.text()}`);
  }
  const json = await res.json();
  return unwrapFirestoreDoc(json);
}

async function runAudit() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 20.6.27: AUDITORIA PÓS-RECONCILIAÇÃO (SOMENTE LEITURA)");
  console.log("================================================================================\n");

  const token = getToken();
  const reviewId = "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008";
  const lessonId = "day_1_part_0";

  console.log(`[1] Lendo documento legal_reviews/${reviewId} via REST API...`);
  const review = (await fetchDoc("legal_reviews", reviewId, token)) as LegalReviewView;

  console.log(`[2] Lendo documento homologated_lessons/${lessonId} via REST API...`);
  const lesson = (await fetchDoc("homologated_lessons", lessonId, token)) as StoredCatalogLesson;

  const currentCatalogHash = hashCatalogSnapshot(lesson);

  console.log("\n================================================================================");
  console.log("VERIFICAÇÃO 1: OBJETO RECONCILIATION NO FIRESTORE");
  console.log("================================================================================");
  const rec = review.reconciliation;
  if (!rec) {
    console.error("ALERTA: Objeto review.reconciliation NÃO encontrado no documento!");
  } else {
    console.log(`reconciliation.status:                     ${rec.status}`);
    console.log(`reconciliation.justification:              ${rec.justification}`);
    console.log(`reconciliation.reconciledByEmail:          ${rec.reconciledByEmail}`);
    console.log(`reconciliation.reconciledByUid:            ${rec.reconciledByUid}`);
    console.log(`reconciliation.reconciledAt:               ${rec.reconciledAt ? new Date(rec.reconciledAt).toISOString() : "N/A"}`);
    console.log(`reconciliation.historicalOriginalHash:     ${rec.historicalOriginalHash}`);
    console.log(`reconciliation.reconciledCatalogHash:      ${rec.reconciledCatalogHash}`);
    console.log(`reconciliation.candidateHashAtReconciliation: ${rec.candidateHashAtReconciliation}`);
    console.log(`reconciliation.decisionStateHashAtReconciliation: ${rec.decisionStateHashAtReconciliation}`);
  }

  console.log("\n================================================================================");
  console.log("VERIFICAÇÃO 2: PRESERVAÇÃO DE CAMPOS E HASHES DA REVISÃO");
  console.log("================================================================================");
  console.log(`review.status:                             ${review.status}`);
  console.log(`review.originalHash:                       ${review.originalHash}`);
  console.log(`review.candidateHash:                      ${review.candidateHash}`);
  console.log(`review.lessonId:                           ${review.lessonId}`);
  console.log(`review.verificationLevel:                  ${review.verificationLevel}`);
  console.log(`review.changes.length:                     ${review.changes?.length || 0}`);
  console.log(`review.originalContent.length:             ${review.originalContent?.length || 0}`);
  console.log(`review.reviewedMarkdown.length:            ${review.reviewedMarkdown?.length || 0}`);

  console.log("\n================================================================================");
  console.log("VERIFICAÇÃO 3: AS 14 ALTERAÇÕES E SUAS DELIBERAÇÕES/DECISÕES");
  console.log("================================================================================");
  if (review.changes && review.changes.length > 0) {
    console.log(`Total de alterações: ${review.changes.length}`);
    review.changes.forEach((c, idx) => {
      console.log(`  [#${idx + 1}] ID: ${c.id} | Tipo: ${c.type} | Decisão: ${c.humanDecision?.action || "sem decisão"} (${c.humanDecision?.resolvedBy || "N/A"})`);
    });
  }

  console.log("\n================================================================================");
  console.log("VERIFICAÇÃO 4: AS CINCO PENDÊNCIAS E ENCERRAMENTO DO ESTÁGIO B");
  console.log("================================================================================");
  const supp = review.supplement;
  console.log(`review.supplement.status:                  ${supp?.status}`);
  console.log(`review.supplement.findings.length:         ${supp?.findings?.length || 0}`);
  if (supp?.findings && supp.findings.length > 0) {
    supp.findings.forEach((f, idx) => {
      console.log(`  [Pendência #${idx + 1}] ID: ${f.id} | Status: ${f.status} | Deliberação CEO: ${f.resolution?.action || "sem ação"} | Motivo: ${f.resolution?.rationale?.slice(0, 50)}...`);
    });
  }
  const resolution = supp?.resolution;
  console.log(`review.supplement.resolution.status:       ${resolution?.status}`);
  console.log(`review.supplement.resolution.closedBy:     ${resolution?.closedBy}`);
  console.log(`review.supplement.resolution.closedAt:     ${resolution?.closedAt ? new Date(resolution.closedAt).toISOString() : "N/A"}`);
  console.log(`candidateHashAtClosure:                    ${resolution?.candidateHashAtClosure}`);
  console.log(`decisionStateHashAtClosure:                ${resolution?.decisionStateHashAtClosure}`);

  console.log("\n================================================================================");
  console.log("VERIFICAÇÃO 5: INTEGRIDADE DO CATÁLOGO ATUAL (homologated_lessons/day_1_part_0)");
  console.log("================================================================================");
  console.log(`lesson.id:                                 ${lesson.id}`);
  console.log(`lesson.day / part:                         ${lesson.day} / ${lesson.part}`);
  console.log(`lesson.content.length:                     ${lesson.content?.length || 0}`);
  console.log(`currentCatalogHash:                        ${currentCatalogHash}`);
  console.log(`reconciledCatalogHash:                     ${rec?.reconciledCatalogHash}`);
  console.log(`Coincide com reconciledCatalogHash?        ${currentCatalogHash === rec?.reconciledCatalogHash ? "SIM (Catálogo 100% inalterado desde a reconciliação)" : "NÃO"}`);

  console.log("\n================================================================================");
  console.log("VERIFICAÇÃO 6: CHECAGENS DE INTEGRIDADE DA LÓGICA DE NEGÓCIO");
  console.log("================================================================================");
  const currentDecisionStateHash = computeDecisionStateHash(review);
  console.log(`currentDecisionStateHash:                  ${currentDecisionStateHash}`);
  console.log(`decisionStateHashAtReconciliation:         ${rec?.decisionStateHashAtReconciliation}`);
  console.log(`decisionStateHashAtClosure:                ${resolution?.decisionStateHashAtClosure}`);
  console.log(`Hashes de decisões coincidem perfeitamente? ${currentDecisionStateHash === rec?.decisionStateHashAtReconciliation && currentDecisionStateHash === resolution?.decisionStateHashAtClosure ? "SIM (100% ÍNTEGRO)" : "NÃO"}`);

  const recIntegrity = validateReconciliationIntegrity(review, currentCatalogHash);
  console.log(`validateReconciliationIntegrity:           ${recIntegrity.valid ? "VÁLIDO" : "INVÁLIDO: " + recIntegrity.reason}`);

  const homologationValidation = validateFindingsHomologation(review);
  console.log(`validateFindingsHomologation:              ${homologationValidation.ok ? "APROVADO (sem pendências)" : "BLOQUEADO: " + homologationValidation.failureReasons.join("; ")}`);

  console.log("\n================================================================================");
  console.log("AUDITORIA SOMENTE LEITURA CONCLUÍDA!");
  console.log("================================================================================");
}

runAudit().catch((err) => {
  console.error("ERRO NA AUDITORIA:", err);
  process.exit(1);
});
