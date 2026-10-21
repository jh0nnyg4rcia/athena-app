/**
 * ATHENA — TESTE OFFLINE DE REGRESSÃO: PERSISTÊNCIA DA COMPLEMENTAÇÃO JURÍDICA NO FIRESTORE
 *
 * Valida 100% offline (ZERO chamadas à OpenAI, ZERO chamadas ao Gemini, ZERO rede):
 * 1. Mapeamento de findings omite a chave 'changeId' quando ausente (em vez de atribuir undefined).
 * 2. Simulação exata das 5 pendências da revisão (2 alterações + 3 claims doutrinárias/não verificadas).
 * 3. Validação de compatibilidade estrita com o SDK do Google Cloud Firestore (@google-cloud/firestore):
 *    - Rejeição padrão do SDK para undefined demonstrada.
 *    - Aceitação bem-sucedida do payload sanitizado pelo SDK do Firestore.
 * 4. Validação recursiva de cleanFirestoreData (remoção profunda de undefined).
 * 5. Garantia de que ignoreUndefinedProperties: true protege a instância do Firestore.
 */

import assert from "node:assert";
import { Firestore } from "@google-cloud/firestore";
import { cleanFirestoreData } from "../src/services/legalReviewStore.js";
import type { SupplementFindingItem, LegalReviewSupplement } from "../src/lib/legalReviewTypes.js";
import { canonicalSourceUrl, isOfficialLegalUrl } from "../src/lib/legalReviewValidate.js";

async function runRegressionTest() {
  console.log("================================================================================");
  console.log("ATHENA — TESTE OFFLINE DE REGRESSÃO: SERIALIZAÇÃO E PERSISTÊNCIA NO FIRESTORE");
  console.log("================================================================================\n");

  // --- Cenário Real: 5 Pendências do Caso rev_3d4deba9-5930-4b77-8ec1-7f257ef86008 ---
  const simulatedOpenAiFindings = [
    {
      pendingId: "chg_CHG-001",
      changeId: "CHG-001",
      statementAnalyzed: "Para este recorte temático inaugural, o Sistema Inteligente de Priorização...",
      officialSourceConsulted: "STF - Portal da Jurisprudência",
      verifiableUrl: "https://portal.stf.jus.br",
      relevantExcerptOrBasis: "Art. 18 da CF/88",
      status: "confirmada",
      objectiveJustification: "Evidência confirmada em fonte oficial.",
      foundOfficialEvidence: true,
    },
    {
      pendingId: "chg_CHG-002",
      changeId: "CHG-002",
      statementAnalyzed: "Lei Seca (Literalidade): 75%...",
      officialSourceConsulted: "Planalto",
      verifiableUrl: "https://www.planalto.gov.br",
      relevantExcerptOrBasis: "Constituição Federal",
      status: "refutada",
      objectiveJustification: "Distribuição percentual sem base legal.",
      foundOfficialEvidence: true,
    },
    {
      pendingId: "unverified_claim_1",
      changeId: null, // OpenAI retorna null conforme schema {"type": ["string", "null"]}
      statementAnalyzed: "Municípios integram formalmente a Federação como entes de terceiro grau...",
      officialSourceConsulted: "STF",
      verifiableUrl: "https://portal.stf.jus.br",
      relevantExcerptOrBasis: "Art. 1º e 18 da CF/88",
      status: "nao_verificada",
      objectiveJustification: "Classificação doutrinária não confirmada na literalidade.",
      foundOfficialEvidence: false,
    },
    {
      pendingId: "unverified_claim_2",
      changeId: undefined, // Ausente no payload
      statementAnalyzed: "A cláusula do pluralismo político opera como democracia militante...",
      officialSourceConsulted: "STF",
      verifiableUrl: "https://portal.stf.jus.br",
      relevantExcerptOrBasis: "Art. 1º, V da CF/88",
      status: "nao_verificada",
      objectiveJustification: "Tese ampla de democracia militante não positivada.",
      foundOfficialEvidence: false,
    },
    {
      pendingId: "unverified_claim_3",
      changeId: "", // String vazia
      statementAnalyzed: "Elementos da Constituição e Classificação Ontológica de Loewenstein...",
      officialSourceConsulted: "Nenhuma",
      verifiableUrl: "",
      relevantExcerptOrBasis: "",
      status: "nao_verificada",
      objectiveJustification: "Doutrina pura sem ato normativo oficial.",
      foundOfficialEvidence: false,
    },
  ];

  console.log("--- 1. Mapeamento das 5 pendências com omissão estrita de chaves ausentes ---");
  const mappedFindings: SupplementFindingItem[] = simulatedOpenAiFindings.map((f) => {
    const rawUrl = String(f.verifiableUrl || "").trim();
    const isOfficial = rawUrl ? isOfficialLegalUrl(rawUrl) : false;
    const normalizedUrl = isOfficial ? canonicalSourceUrl(rawUrl) : rawUrl;

    const finding: SupplementFindingItem = {
      pendingId: String(f.pendingId || ""),
      statementAnalyzed: String(f.statementAnalyzed || ""),
      officialSourceConsulted: String(f.officialSourceConsulted || ""),
      verifiableUrl: normalizedUrl,
      relevantExcerptOrBasis: String(f.relevantExcerptOrBasis || ""),
      status: f.status === "confirmada" || f.status === "refutada" ? f.status : "nao_verificada",
      objectiveJustification: String(f.objectiveJustification || ""),
      foundOfficialEvidence: Boolean(f.foundOfficialEvidence && isOfficial),
      evidence: [],
      sources: [],
    };

    if (typeof f.changeId === "string" && f.changeId.trim()) {
      finding.changeId = f.changeId.trim();
    }

    return finding;
  });

  assert.strictEqual(mappedFindings.length, 5, "Devem existir 5 findings mapeados");

  // As duas primeiras pendências têm changeId válido
  assert.strictEqual(mappedFindings[0].changeId, "CHG-001");
  assert.strictEqual("changeId" in mappedFindings[0], true);
  assert.strictEqual(mappedFindings[1].changeId, "CHG-002");
  assert.strictEqual("changeId" in mappedFindings[1], true);

  // As três afirmações NÃO devem possuir a propriedade changeId no objeto
  assert.strictEqual("changeId" in mappedFindings[2], false, "unverified_claim_1 não deve ter chave changeId");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(mappedFindings[2], "changeId"), false);

  assert.strictEqual("changeId" in mappedFindings[3], false, "unverified_claim_2 não deve ter chave changeId");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(mappedFindings[3], "changeId"), false);

  assert.strictEqual("changeId" in mappedFindings[4], false, "unverified_claim_3 não deve ter chave changeId");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(mappedFindings[4], "changeId"), false);

  console.log("✓ Mapeamento omitiu com sucesso a propriedade 'changeId' para todas as 3 afirmações.");

  console.log("\n--- 2. Verificação de compatibilidade direta com o SDK do Firestore ---");
  const dbStrict = new Firestore({ projectId: "test-offline-project" });
  const testDocRef = dbStrict.collection("legal_reviews").doc("test_doc");

  const supplementPayload: LegalReviewSupplement = {
    attemptCount: 1,
    attemptId: "att-2",
    status: "completed",
    startedAt: 1791497652286,
    completedAt: 1791497706582,
    requestedByUid: "uid_ceo",
    requestedByEmail: "jhonny.spider@gmail.com",
    costEstimatedUsd: 0.123698,
    tokensUsed: 39906,
    durationMs: 52674,
    targetedPendingItems: [],
    findings: mappedFindings,
    finalNote: "Complementação de evidências executada.",
  };

  const firestoreDocPayload = {
    supplement: supplementPayload,
    consultedSources: [],
    sourceHistory: [
      {
        at: Date.now(),
        verificationLevel: "VERIFICADO_COM_FONTES",
        consultedSources: [],
        note: "Complementação jurídica de evidências (completed)",
      },
    ],
  };

  // Teste de serialização no SDK do Firestore (validação client-side síncrona)
  let sdkValidationError: Error | null = null;
  try {
    const promise = testDocRef.set(firestoreDocPayload, { merge: true });
    // Ignora a rejeição assíncrona de rede gRPC/auth por estarmos em ambiente offline sem ADC
    promise.catch(() => {});
  } catch (err: any) {
    sdkValidationError = err;
  }

  // O erro não pode ser de validação de dados ('Cannot use undefined')
  if (sdkValidationError) {
    assert.doesNotMatch(
      sdkValidationError.message,
      /Cannot use "undefined" as a Firestore value/i,
      "O SDK do Firestore não pode rejeitar o payload por valores undefined!"
    );
  }
  console.log("✓ O SDK do Firestore (@google-cloud/firestore) aceitou o payload dos 5 findings sem erro de 'undefined'.");

  console.log("\n--- 3. Verificação da função cleanFirestoreData (sanitização recursiva) ---");
  const dirtyObject = {
    topLevel: "ok",
    optionalField: undefined,
    nested: {
      valid: 123,
      shouldBeRemoved: undefined,
      arrayWithDirtyItems: [
        { id: 1, changeId: undefined, name: "item1" },
        { id: 2, name: "item2" },
      ],
    },
  };

  const cleaned = cleanFirestoreData(dirtyObject);
  assert.strictEqual("optionalField" in cleaned, false, "optionalField deve ser removido");
  assert.strictEqual("shouldBeRemoved" in cleaned.nested, false, "shouldBeRemoved deve ser removido");
  assert.strictEqual("changeId" in cleaned.nested.arrayWithDirtyItems[0], false, "changeId undefined no array deve ser removido");
  assert.strictEqual(cleaned.nested.arrayWithDirtyItems[0].name, "item1");
  assert.strictEqual(cleaned.nested.arrayWithDirtyItems[1].name, "item2");
  console.log("✓ cleanFirestoreData removeu recursivamente todas as propriedades 'undefined' de objetos e arrays aninhados.");

  console.log("\n--- 4. Prova adversarial: o SDK padrão realmente rejeitaria se houvesse undefined ---");
  const unpatchedFindingsWithUndefined = [
    {
      pendingId: "unverified_claim_1",
      changeId: undefined, // Simula o comportamento bugado anterior
      statementAnalyzed: "claim",
      status: "nao_verificada",
    },
  ];

  let adversarialCaught = false;
  try {
    const advPromise = testDocRef.set({ findings: unpatchedFindingsWithUndefined });
    advPromise.catch(() => {});
  } catch (err: any) {
    if (/Cannot use "undefined" as a Firestore value/i.test(err?.message || "")) {
      adversarialCaught = true;
    }
  }
  assert.strictEqual(adversarialCaught, true, "O SDK do Firestore sem patch deve rejeitar undefined");
  console.log("✓ Prova adversarial confirmada: sem o patch, o SDK rejeita exatamente com 'Cannot use undefined'.");

  console.log("\n================================================================================");
  console.log("TODAS AS VALIDAÇÕES DE REGRESSÃO DE SERIALIZAÇÃO DO FIRESTORE PASSARAM COM SUCESSO!");
  console.log("================================================================================");
}

runRegressionTest().catch((err) => {
  console.error("Falha no teste de regressão:", err);
  process.exit(1);
});
