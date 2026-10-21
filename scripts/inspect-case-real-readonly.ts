/**
 * ATHENA — ETAPA 20.6.13: INSPEÇÃO READ-ONLY DO CASO REAL VIA REST API
 *
 * MODO: 100% SOMENTE LEITURA / ZERO ESCRITAS / ZERO TRANSAÇÕES
 *
 * Recupera o snapshot original da revisão rev_3d4deba9-5930-4b77-8ec1-7f257ef86008
 * e a aula homologated_lessons/day_1_part_0 via Firestore REST API autenticada por gcloud.
 */

import { execSync } from "child_process";
import { hashCatalogSnapshot, type StoredCatalogLesson } from "../src/services/legalReviewRepository";
import type { LegalReviewView } from "../src/lib/legalReviewTypes";
import {
  analyzeCatalogDivergence,
  computeDecisionStateHash,
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

async function main() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 20.6.13: INSPEÇÃO SOMENTE LEITURA DO CASO REAL");
  console.log("================================================================================\n");

  const token = getToken();
  const reviewId = "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008";
  const lessonId = "day_1_part_0";

  console.log(`[1] Lendo documento legal_reviews/${reviewId} via REST API...`);
  const reviewRaw = await fetchDoc("legal_reviews", reviewId, token);
  const review = reviewRaw as LegalReviewView;

  console.log(`[2] Lendo documento homologated_lessons/${lessonId} via REST API...`);
  const lessonRaw = await fetchDoc("homologated_lessons", lessonId, token);
  const lesson = lessonRaw as StoredCatalogLesson;

  const currentCatalogHash = hashCatalogSnapshot(lesson);

  console.log("\n--- DADOS DE INTEGRIDADE RECUPERADOS DO FIRESTORE DE PRODUÇÃO ---");
  console.log(`reviewId:                  ${review.id}`);
  console.log(`lessonId:                  ${review.lessonId}`);
  console.log(`Status da revisão:         ${review.status}`);
  console.log(`originalHash (histórico):  ${review.originalHash}`);
  console.log(`hashCatalogSnapshot atual: ${currentCatalogHash}`);
  console.log(`candidateHash vigente:     ${review.candidateHash}`);
  console.log(`originalContent.length:    ${review.originalContent?.length || 0} caracteres`);
  console.log(`catalog.content.length:    ${lesson.content?.length || 0} caracteres`);
  console.log(`reviewedMarkdown.length:   ${review.reviewedMarkdown?.length || 0} caracteres`);
  console.log(`Total changes na revisão:   ${review.changes?.length || 0}`);
  console.log(`Encerramento Estágio B:    ${review.supplement?.resolution ? "PRESENTE (" + review.supplement.resolution.status + ")" : "AUSENTE"}`);
  console.log(`closedAt:                  ${review.supplement?.resolution?.closedAt ? new Date(review.supplement.resolution.closedAt).toISOString() : "N/A"}`);
  console.log(`candidateHashAtClosure:    ${review.supplement?.resolution?.candidateHashAtClosure || "N/A"}`);
  console.log(`decisionStateHashAtClosure:${review.supplement?.resolution?.decisionStateHashAtClosure || "N/A"}`);

  const currentDecisionStateHash = computeDecisionStateHash(review);
  console.log(`decisionStateHash atual:   ${currentDecisionStateHash}`);
  console.log(
    `decisionStateHash confere? ${
      review.supplement?.resolution?.decisionStateHashAtClosure === currentDecisionStateHash ? "SIM (100% íntegro)" : "NÃO"
    }`
  );

  console.log("\n[3] Executando análise autoritativa de divergências (analyzeCatalogDivergence)...");
  const divergence = analyzeCatalogDivergence(review.originalContent, lesson.content, review.changes);

  console.log("\n================================================================================");
  console.log(`TOTAL DE BLOCOS IDENTIFICADOS: ${divergence.totalHunks}`);
  console.log(`  - Formatação / Tipografia:    ${divergence.formattingHunksCount}`);
  console.log(`  - Alinhados com Correções:    ${divergence.alignedChangesCount}`);
  console.log(`  - Divergências Materiais:     ${divergence.materialHunksCount}`);
  console.log(`  - Material Changes Detected:  ${divergence.materialChangesDetected}`);
  console.log("================================================================================\n");

  console.log("--- DETALHES DE CADA UM DOS BLOCOS ---");
  divergence.hunks.forEach((h, idx) => {
    console.log(`\n================================================================================`);
    console.log(`BLOCO #${idx + 1} de ${divergence.totalHunks} (Hunk Index: ${h.hunkIndex})`);
    console.log(`Classificação: [${h.classification}] | Material: ${h.isMaterial ? "SIM" : "NÃO"}`);
    console.log(`Tipo: ${h.kind}`);
    console.log(`Motivo: ${h.reason}`);
    if (h.alignedChangeId) {
      console.log(`Alteração Aprovada Vinculada: ${h.alignedChangeId}`);
    }
    console.log(`--- [TEXTO ANTERIOR - Snapshot Original da Revisão] ---`);
    console.log(h.original ? h.original.trim() : "(vazio)");
    console.log(`--- [TEXTO ATUAL - Catálogo Homologado Oficial] ---`);
    console.log(h.catalog ? h.catalog.trim() : "(vazio)");
  });

  console.log("\n================================================================================");
  console.log("INSPEÇÃO SOMENTE LEITURA CONCLUÍDA COM SUCESSO!");
  console.log("================================================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("ERRO NA INSPEÇÃO READ-ONLY:", err);
  process.exit(1);
});
