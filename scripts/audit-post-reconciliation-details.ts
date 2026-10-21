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
  const token = getToken();
  const reviewId = "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008";
  const lessonId = "day_1_part_0";

  const review = (await fetchDoc("legal_reviews", reviewId, token)) as LegalReviewView;
  const lesson = (await fetchDoc("homologated_lessons", lessonId, token)) as StoredCatalogLesson;

  console.log("=== INSPEÇÃO DETALHADA DAS 5 DELIBERAÇÕES DO CEO (findingDecisions) ===");
  const fd = review.findingDecisions || {};
  const keys = Object.keys(fd);
  console.log(`Total de findingDecisions: ${keys.length}`);
  keys.forEach((k, idx) => {
    const d = fd[k];
    console.log(`\n[Deliberação #${idx + 1}] Chave: ${k}`);
    console.log(`  findingPendingId:          ${d.findingPendingId}`);
    console.log(`  action:                    ${d.action}`);
    console.log(`  state:                     ${d.state}`);
    console.log(`  decidedBy:                 ${d.decidedByEmail} em ${new Date(d.decidedAt).toISOString()}`);
    console.log(`  justification:             ${d.justification}`);
    console.log(`  correctionChangeId:        ${d.correctionChangeId || "N/A"}`);
    console.log(`  candidateHashAtDecision:   ${d.candidateHashAtDecision}`);
  });

  console.log("\n=== INSPEÇÃO DO ENCERRAMENTO DO ESTÁGIO B (resolution) ===");
  const res = review.supplement?.resolution;
  console.log(`status:                      ${res?.status}`);
  console.log(`closedByEmail:               ${res?.closedByEmail}`);
  console.log(`closedByUid:                 ${res?.closedByUid}`);
  console.log(`closedAt:                    ${res?.closedAt ? new Date(res.closedAt).toISOString() : "N/A"}`);
  console.log(`overallJustification:        ${res?.overallJustification}`);
  console.log(`candidateHashAtClosure:      ${res?.candidateHashAtClosure}`);
  console.log(`decisionStateHashAtClosure:  ${res?.decisionStateHashAtClosure}`);

  console.log("\n=== INSPEÇÃO DOS ADITAMENTOS (addenda) ===");
  console.log(`Total addenda:               ${review.addenda?.length || 0}`);
  if (review.addenda && review.addenda.length > 0) {
    review.addenda.forEach((a, i) => {
      console.log(`  [Addendum #${i+1}] ID: ${a.id} | Motivo: ${a.reason} | Criado por: ${a.createdByEmail}`);
    });
  }

  console.log("\n=== INSPEÇÃO DAS DECISÕES HUMANAS NAS ALTERAÇÕES (humanDecisions) ===");
  const hd = review.humanDecisions || {};
  const hdKeys = Object.keys(hd);
  console.log(`Total de humanDecisions: ${hdKeys.length}`);
  hdKeys.forEach((k) => {
    console.log(`  Alteração ${k}: ${hd[k].action} por ${hd[k].resolvedBy} (${hd[k].reason})`);
  });
}

runAudit().catch(console.error);
