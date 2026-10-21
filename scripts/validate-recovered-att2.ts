/**
 * ATHENA — VALIDAÇÃO DOS ARQUIVOS RECUPERADOS DA COMPLEMENTAÇÃO att-2 (ETAPA 1)
 *
 * Execução 100% offline (ZERO rede, ZERO chamadas externas):
 * 1. Verifica integridade dos arquivos att2_response_raw.json e att2_findings_sanitized.json.
 * 2. Confirma os cinco identificadores das pendências:
 *    - chg_CHG-001
 *    - chg_CHG-002
 *    - unverified_claim_1
 *    - unverified_claim_2
 *    - unverified_claim_3
 * 3. Valida contra tipos e esquemas oficiais (SupplementFindingItem, LegalReviewSupplement).
 * 4. Confirma que todos os 5 findings estão classificados como "nao_verificada".
 * 5. Verifica as duas fontes oficiais e suas limitações fundamentadas.
 * 6. Confirma ausência de chaves undefined, nulas espúrias ou corrupção de dados.
 */

import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { SupplementFindingItem, LegalReviewSupplement } from "../src/lib/legalReviewTypes.js";
import { cleanFirestoreData } from "../src/services/legalReviewStore.js";

const RAW_FILE = resolve("scratch/recovered_responses/att2_response_raw.json");
const SANITIZED_FILE = resolve("scratch/recovered_responses/att2_findings_sanitized.json");

export function runValidation() {
  console.log("================================================================================");
  console.log("ATHENA — VALIDAÇÃO LOCAL DOS RESULTADOS RECUPERADOS (ETAPA 1)");
  console.log("================================================================================\n");

  // 1. Integridade dos arquivos recuperados
  console.log("1. Verificando existência e integridade dos arquivos locais...");
  assert.strictEqual(existsSync(RAW_FILE), true, `Arquivo bruto não encontrado: ${RAW_FILE}`);
  assert.strictEqual(existsSync(SANITIZED_FILE), true, `Arquivo sanitizado não encontrado: ${SANITIZED_FILE}`);

  const rawContent = readFileSync(RAW_FILE, "utf-8");
  const sanitizedContent = readFileSync(SANITIZED_FILE, "utf-8");

  const rawJson = JSON.parse(rawContent);
  const sanitizedJson = JSON.parse(sanitizedContent);

  assert.strictEqual(rawJson.id, "resp_04e5fa37c665e08e006ac815b6c1cc87d2bb2c68127bf84ad9");
  assert.strictEqual(rawJson.status, "completed");
  assert.strictEqual(rawJson.model, "gpt-5.6-sol");
  assert.strictEqual(sanitizedJson.responseId, "resp_04e5fa37c665e08e006ac815b6c1cc87d2bb2c68127bf84ad9");
  assert.strictEqual(sanitizedJson.reviewId, "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008");
  assert.strictEqual(sanitizedJson.lessonId, "day_1_part_0");
  assert.strictEqual(sanitizedJson.usage.total_tokens, 39906);
  console.log("✓ Ambos os arquivos JSON são válidos, consistentes e íntegros.");

  // 2. Confirmação dos 5 identificadores de pendências
  console.log("\n2. Confirmando os 5 identificadores de pendências...");
  const expectedPendingIds = [
    "chg_CHG-001",
    "chg_CHG-002",
    "unverified_claim_1",
    "unverified_claim_2",
    "unverified_claim_3",
  ];
  const actualPendingIds = sanitizedJson.findings.map((f: any) => f.pendingId);
  assert.deepStrictEqual(actualPendingIds, expectedPendingIds, "Identificadores das pendências não coincidem");
  console.log("✓ Identificadores confirmados:", actualPendingIds.join(", "));

  // 3. Validação dos tipos e esquemas
  console.log("\n3. Validando os achados contra o esquema SupplementFindingItem...");
  const findings: SupplementFindingItem[] = sanitizedJson.findings;
  assert.strictEqual(findings.length, 5);

  findings.forEach((finding, idx) => {
    assert.strictEqual(typeof finding.pendingId, "string", `Finding ${idx}: pendingId deve ser string`);
    assert.strictEqual(typeof finding.statementAnalyzed, "string", `Finding ${idx}: statementAnalyzed deve ser string`);
    assert.strictEqual(typeof finding.officialSourceConsulted, "string", `Finding ${idx}: officialSourceConsulted deve ser string`);
    assert.strictEqual(typeof finding.verifiableUrl, "string", `Finding ${idx}: verifiableUrl deve ser string`);
    assert.strictEqual(typeof finding.relevantExcerptOrBasis, "string", `Finding ${idx}: relevantExcerptOrBasis deve ser string`);
    assert.strictEqual(typeof finding.objectiveJustification, "string", `Finding ${idx}: objectiveJustification deve ser string`);
    assert.strictEqual(typeof finding.foundOfficialEvidence, "boolean", `Finding ${idx}: foundOfficialEvidence deve ser boolean`);
    assert(Array.isArray(finding.evidence), `Finding ${idx}: evidence deve ser array`);
    assert(Array.isArray(finding.sources), `Finding ${idx}: sources deve ser array`);
  });
  console.log("✓ Todos os 5 achados respeitam estritamente a tipagem de SupplementFindingItem.");

  // 4. Confirmação de classificação "nao_verificada" para os 5 findings
  console.log("\n4. Verificando classificação de status dos 5 findings...");
  findings.forEach((finding) => {
    assert.strictEqual(
      finding.status,
      "nao_verificada",
      `Finding ${finding.pendingId} esperado como 'nao_verificada', recebido: ${finding.status}`
    );
  });
  assert.strictEqual(sanitizedJson.statusCounts.nao_verificada, 5);
  console.log("✓ Todos os 5 findings estão classificados como 'nao_verificada'.");

  // 5. Verificação das 2 fontes oficiais e suas limitações
  console.log("\n5. Verificando existência de fontes oficiais e limitações identificadas...");
  const findingsWithOfficialEvidence = findings.filter((f) => f.foundOfficialEvidence);
  assert.strictEqual(findingsWithOfficialEvidence.length, 2, "Devem existir exatamente 2 findings com fontes oficiais");
  
  const claim1 = findings.find((f) => f.pendingId === "unverified_claim_1");
  assert(claim1, "unverified_claim_1 não encontrada");
  assert.strictEqual(claim1.foundOfficialEvidence, true);
  assert(claim1.verifiableUrl.includes("planalto.gov.br"), "Fonte deve ser planalto.gov.br");
  assert(claim1.objectiveJustification.includes("terceiro grau"), "Limitação deve mencionar 'terceiro grau'");
  assert(claim1.relevantExcerptOrBasis.includes("art. 1º"), "Base deve citar art. 1º");
  console.log("  - unverified_claim_1: Suporte oficial parcial (CF/88, arts. 1º e 18). Limitação: qualificação 'terceiro grau' é classificação doutrinária não positivada.");

  const claim2 = findings.find((f) => f.pendingId === "unverified_claim_2");
  assert(claim2, "unverified_claim_2 não encontrada");
  assert.strictEqual(claim2.foundOfficialEvidence, true);
  assert(claim2.verifiableUrl.includes("planalto.gov.br") || claim2.verifiableUrl.includes("stf.jus.br"));
  assert(claim2.objectiveJustification.includes("democracia militante"), "Limitação deve citar 'democracia militante'");
  console.log("  - unverified_claim_2: Suporte oficial parcial (Lei 14.197/2021, CP, STF AP 2.176/DF). Limitação: ausência de tese vinculante sobre formulação 'democracia militante'.");

  const unverifiedItems = findings.filter((f) => !f.foundOfficialEvidence);
  assert.strictEqual(unverifiedItems.length, 3);
  console.log("  - chg_CHG-001, chg_CHG-002, unverified_claim_3: Sem evidências normativas/jurisprudenciais oficiais (sistema interno, percentuais empíricos e classificações doutrinárias).");
  console.log("✓ Verificação das fontes e limitações comprovada com fidelidade.");

  // 6. Confirmação de ausência de 'undefined' ou campos corrompidos
  console.log("\n6. Verificando ausência de propriedades undefined ou corrupção de dados...");
  findings.forEach((finding, idx) => {
    // Verifica se há alguma propriedade com valor undefined
    for (const [key, val] of Object.entries(finding)) {
      assert.notStrictEqual(val, undefined, `Finding ${idx} tem chave '${key}' com valor undefined`);
    }
    // Nos itens sem changeId, a chave 'changeId' não deve sequer existir no objeto
    if (idx >= 2) {
      assert.strictEqual("changeId" in finding, false, `Finding ${idx} (${finding.pendingId}) não deve ter chave changeId`);
    } else {
      assert.strictEqual(typeof finding.changeId, "string", `Finding ${idx} deve ter changeId string`);
    }
  });

  const cleaned = cleanFirestoreData(findings);
  assert.deepStrictEqual(cleaned, findings, "cleanFirestoreData deve preservar o payload sem mutação");
  console.log("✓ Zero propriedades undefined. Zero corrupção de dados.");

  console.log("\n================================================================================");
  console.log("RESULTADO DA ETAPA 1: TODOS OS REQUISITOS DE VALIDAÇÃO FORAM APROVADOS!");
  console.log("================================================================================");
  return true;
}

if (process.argv[1] && process.argv[1].endsWith("validate-recovered-att2.ts")) {
  runValidation();
}
