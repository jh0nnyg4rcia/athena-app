import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  LegalReviewView,
  HumanFindingDecision,
  SupplementHumanResolution
} from "../src/lib/legalReviewTypes.js";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider.js";
import {
  validateFindingsForClosure,
  validateFindingsHomologation,
  computeDecisionStateHash,
  getFindingStableKey
} from "../src/lib/legalReviewValidate.js";
import {
  createHumanLegalReviewChangeFlow,
  closeLegalReviewSupplementFlow
} from "../src/services/legalReviewFlow.js";

process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function runShieldingSuite() {
  console.log("=== INICIANDO SUÍTE ADVERSARIAL: BLINDAGEM DO HISTÓRICO DE CORREÇÕES HUMANAS (ETAPA 20.2.1) ===\n");

  const originalContent = `# Aula 1 - Princípios Fundamentais

O conceito de democracia militante foi aplicado no julgamento de forma unânime e pacífica.

Linha final da aula.`;

  const initialReviewed = `# Aula 1 - Princípios Fundamentais

O conceito de democracia militante foi aplicado no julgamento de forma unânime e pacífica.

Linha final da aula.`;

  const initialHash = sha256(initialReviewed);

  // Estado inicial simulando a revisão histórica com Estágio B previamente encerrado
  let reviewState: LegalReviewView = {
    id: "rev_shielding_test_001",
    lessonId: "lesson_1",
    subject: "Direito Constitucional",
    topic: "Princípios Fundamentais",
    candidateHash: initialHash,
    candidateMarkdownAccepted: initialReviewed,
    originalContent: originalContent,
    reviewedMarkdown: initialReviewed,
    status: "pending_approval",
    changes: [
      {
        id: "CHG-001",
        type: "CORRECAO",
        severity: "MEDIA",
        category: "TEXTUAL",
        originalExcerpt: "Aula 1",
        revisedExcerpt: "Aula 1 - Princípios Fundamentais",
        reason: "Padronização de título",
        verified: true,
        confirmation: "SIM",
        sources: [],
        evidence: [],
        outcome: "CONFIRMADA",
        authorType: "AI"
      }
    ],
    supplement: {
      status: "completed",
      findings: [
        {
          pendingId: "unverified_claim_2",
          statementAnalyzed: "O conceito de democracia militante foi aplicado no julgamento de forma unânime e pacífica.",
          officialSourceConsulted: "STF - Jurisprudência",
          verifiableUrl: "https://stf.jus.br",
          relevantExcerptOrBasis: "Democracia militante",
          status: "nao_verificada",
          objectiveJustification: "Conceito não unânime sem indicação de julgado específico.",
          foundOfficialEvidence: false,
          nature: "AFIRMACAO_EMPIRICA"
        }
      ],
      resolution: {
        status: "RESOLVIDO_PELO_CEO",
        closedAt: 1728500000000,
        closedByUid: "uid_ceo_historico",
        closedByEmail: ATHENA_CEO_EMAIL,
        overallJustification: "Encerramento histórico original do Estágio B realizado pelo CEO.",
        candidateHashAtClosure: initialHash,
        totalFindingsResolved: 1,
        history: []
      }
    },
    findingDecisions: {
      "unverified_claim_2": {
        findingKey: "unverified_claim_2",
        state: "CORRECAO_NECESSARIA",
        justification: "Decisão histórica com vínculo que não apontava para alteração textual real.",
        correctionChangeId: "CHG-001", // Vínculo anterior imperfeito
        decidedAt: 1728500000000,
        decidedByUid: "uid_ceo_historico",
        decidedByEmail: ATHENA_CEO_EMAIL,
        candidateHashAtDecision: initialHash,
      }
    }
  };

  const mockRepo = {
    async get(id: string) {
      if (id === reviewState.id) return JSON.parse(JSON.stringify(reviewState));
      return null;
    },
    async saveFindingDecision(id: string, decision: HumanFindingDecision, now: number) {
      if (id !== reviewState.id) throw new Error("Not found");
      reviewState.findingDecisions = reviewState.findingDecisions || {};
      reviewState.findingDecisions[decision.findingKey] = JSON.parse(JSON.stringify(decision));
      return JSON.parse(JSON.stringify(reviewState));
    },
    async addHumanChange(
      id: string,
      change: any,
      nextMarkdown: string,
      now: number,
      expectedHash: string
    ) {
      if (reviewState.candidateHash !== expectedHash) {
        const err: any = new Error("Hash mismatch / Concorrência detectada");
        err.status = 409;
        throw err;
      }
      reviewState.changes = [...reviewState.changes, change];
      reviewState.reviewedMarkdown = nextMarkdown;
      reviewState.candidateMarkdownAccepted = nextMarkdown;
      reviewState.candidateHash = sha256(nextMarkdown);
      // REGRA DE OURO (Etapa 20.2.1): supplement.resolution É PRESERVADO APPEND-ONLY!
      return JSON.parse(JSON.stringify(reviewState));
    },
    async closeSupplementResolution(
      id: string,
      resolution: SupplementHumanResolution,
      now: number,
      expectedHashes?: { expectedCandidateHash: string; expectedDecisionStateHash: string }
    ) {
      if (id !== reviewState.id) throw new Error("Not found");
      const priorResolution = reviewState.supplement?.resolution;
      const priorHistory = [...(priorResolution?.history || [])];
      if (priorResolution && priorResolution.candidateHashAtClosure !== reviewState.candidateHash) {
        priorHistory.push({
          status: priorResolution.status,
          closedAt: priorResolution.closedAt,
          closedByUid: priorResolution.closedByUid,
          closedByEmail: priorResolution.closedByEmail,
          overallJustification: priorResolution.overallJustification,
          candidateHashAtClosure: priorResolution.candidateHashAtClosure,
          totalFindingsResolved: priorResolution.totalFindingsResolved,
        });
      }

      reviewState.supplement = {
        ...reviewState.supplement!,
        resolution: {
          ...resolution,
          candidateHashAtClosure: reviewState.candidateHash,
          closedAt: now,
          history: priorHistory,
        }
      };
      return JSON.parse(JSON.stringify(reviewState));
    }
  };

  // ---------------------------------------------------------------------------
  // TESTE 1: Estado Original Válido antes de Qualquer Alteração
  // ---------------------------------------------------------------------------
  console.log("1. Verificando estado inicial da revisão histórica...");
  assert.equal(reviewState.supplement?.resolution?.candidateHashAtClosure, initialHash);
  assert.equal(reviewState.supplement?.resolution?.history?.length, 0);
  console.log("   -> OK: Encerramento histórico v1 registrado no hash inicial.");

  // ---------------------------------------------------------------------------
  // TESTE 2: Criação de Correção Humana CHG-H-001 Preserva Resolução Histórica
  // ---------------------------------------------------------------------------
  console.log("\n2. Executando criação de CHG-H-001 (substituição textual do achado unverified_claim_2)...");
  const revisedText1 = "O conceito de ordem constitucional democrática foi acolhido pela maioria dos ministros.";
  const result1 = await createHumanLegalReviewChangeFlow(
    mockRepo as any,
    reviewState.id,
    {
      originFindingKey: "unverified_claim_2",
      originalExcerpt: "O conceito de democracia militante foi aplicado no julgamento de forma unânime e pacífica.",
      revisedExcerpt: revisedText1,
      justification: "Correção editorial humana fundamentada pelo CEO para sanar unverified_claim_2.",
      expectedCandidateHash: initialHash,
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL
  );

  const hash2 = result1.candidateHash;
  assert.notEqual(hash2, initialHash, "CandidateHash deve ser alterado após edição textual");

  // A RESPOSTA E O BANCO DEVEM PRESERVAR O REGISTRO DO ENCERRAMENTO ANTERIOR!
  assert.ok(result1.supplement?.resolution, "supplement.resolution NÃO PODE ser undefined!");
  assert.equal(
    result1.supplement?.resolution?.candidateHashAtClosure,
    initialHash,
    "Hash no encerramento deve ser mantido estritamente igual ao hash original v1"
  );
  assert.equal(
    result1.supplement?.resolution?.overallJustification,
    "Encerramento histórico original do Estágio B realizado pelo CEO."
  );
  assert.equal(result1.supplement?.resolution?.closedByUid, "uid_ceo_historico");
  assert.equal(result1.supplement?.resolution?.closedByEmail, ATHENA_CEO_EMAIL);
  console.log("   -> OK: CHG-H-001 criado com sucesso e supplement.resolution histórico preservado intacto no registro.");

  // ---------------------------------------------------------------------------
  // TESTE 3: Descompasso de Hash Invalida Automaticamente a Homologação (Estágio C)
  // ---------------------------------------------------------------------------
  console.log("\n3. Verificando que o descompasso de hash bloqueia fail-closed a homologação no Estágio C...");
  const homologationCheck = validateFindingsHomologation(reviewState);
  assert.equal(homologationCheck.ok, false, "Homologação deve falhar após alteração de texto");
  assert.ok(
    homologationCheck.failureReasons.some((r) =>
      r.includes("O encerramento da complementação foi invalidado porque o texto da aula foi editado após o ato do CEO")
    ),
    "Deve conter motivo explícito de invalidação por descompasso de hash de encerramento"
  );
  console.log("   -> OK: validateFindingsHomologation detecta descompasso e rejeita com mensagem forense clara.");

  // ---------------------------------------------------------------------------
  // TESTE 4: Decisões Individuais Prévias Invalidadas pelo Novo Hash
  // ---------------------------------------------------------------------------
  console.log("\n4. Verificando que as decisões individuais anteriores foram invalidadas pelo novo hash...");
  const closureCheckBeforeRedeliberation = validateFindingsForClosure(reviewState);
  assert.equal(closureCheckBeforeRedeliberation.ok, false, "validateFindingsForClosure deve falhar");
  assert.ok(
    closureCheckBeforeRedeliberation.failureReasons.some((r) =>
      r.includes("a deliberação individual foi invalidada porque o texto da aula foi editado após a decisão do CEO")
    ),
    "Deve acusar que a deliberação individual de unverified_claim_2 era no hash antigo"
  );
  console.log("   -> OK: validateFindingsForClosure exige nova deliberação individual vinculada ao novo hash.");

  // ---------------------------------------------------------------------------
  // TESTE 5: Re-deliberação Individual pelo CEO Vinculando CHG-H-001 no Novo Hash
  // ---------------------------------------------------------------------------
  console.log("\n5. CEO re-delibera unverified_claim_2 vinculando expressamente a CHG-H-001 no novo hash...");
  await mockRepo.saveFindingDecision(
    reviewState.id,
    {
      findingKey: "unverified_claim_2",
      state: "CORRECAO_NECESSARIA",
      justification: "Correção realizada e sanada através da alteração humana CHG-H-001.",
      correctionChangeId: "CHG-H-001",
      decidedAt: Date.now(),
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
      candidateHashAtDecision: hash2,
    },
    Date.now()
  );

  const closureCheckAfterRedeliberation = validateFindingsForClosure(reviewState);
  assert.equal(
    closureCheckAfterRedeliberation.ok,
    true,
    `Todos os achados devem estar válidos agora: ${closureCheckAfterRedeliberation.failureReasons.join(", ")}`
  );
  console.log("   -> OK: Deliberação individual saneada com sucesso vinculada a CHG-H-001 e validada no novo hash.");

  // ---------------------------------------------------------------------------
  // TESTE 6: Re-encerramento do Estágio B Migra Resolução Antiga para history
  // ---------------------------------------------------------------------------
  console.log("\n6. CEO executa novo encerramento formal do Estágio B no hash v2...");
  const decHash2 = computeDecisionStateHash(reviewState);
  const reClosedResult1 = await closeLegalReviewSupplementFlow(
    mockRepo as any,
    reviewState.id,
    {
      overallJustification: "Novo encerramento formal do Estágio B após incorporação da correção humana CHG-H-001.",
      expectedCandidateHash: hash2,
      expectedDecisionStateHash: decHash2,
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL,
    Date.now()
  );

  assert.equal(reClosedResult1.supplement?.resolution?.candidateHashAtClosure, hash2);
  assert.equal(
    reClosedResult1.supplement?.resolution?.overallJustification,
    "Novo encerramento formal do Estágio B após incorporação da correção humana CHG-H-001."
  );
  assert.ok(Array.isArray(reClosedResult1.supplement?.resolution?.history));
  assert.equal(reClosedResult1.supplement?.resolution?.history?.length, 1);

  // A primeira resolução está preservada em history[0]!
  const hist0 = reClosedResult1.supplement?.resolution?.history?.[0];
  assert.equal(hist0?.candidateHashAtClosure, initialHash);
  assert.equal(hist0?.overallJustification, "Encerramento histórico original do Estágio B realizado pelo CEO.");
  assert.equal(hist0?.closedByUid, "uid_ceo_historico");
  console.log("   -> OK: Re-encerramento concluído com sucesso. Histórico cumulativo contém o ato histórico original.");

  // ---------------------------------------------------------------------------
  // TESTE 7: Homologação no Estágio C Torna-se Válida após Re-encerramento
  // ---------------------------------------------------------------------------
  console.log("\n7. Verificando que a homologação no Estágio C torna-se materialmente válida...");
  const homologationCheck2 = validateFindingsHomologation(reviewState);
  assert.equal(
    homologationCheck2.ok,
    true,
    `Homologação deveria ser válida: ${homologationCheck2.failureReasons.join(", ")}`
  );
  console.log("   -> OK: validateFindingsHomologation aprovada com 100% de conformidade documental e de hashes.");

  // ---------------------------------------------------------------------------
  // TESTE 8: Criação de Segunda Alteração Humana CHG-H-002 Acumula Histórico
  // ---------------------------------------------------------------------------
  console.log("\n8. Adicionando segunda alteração humana CHG-H-002 e verificando acumulação estrita...");
  const revisedText2 = "Linha final da aula devidamente revisada e aprofundada.";
  const result2 = await createHumanLegalReviewChangeFlow(
    mockRepo as any,
    reviewState.id,
    {
      originFindingKey: "unverified_claim_2",
      originalExcerpt: "Linha final da aula.",
      revisedExcerpt: revisedText2,
      justification: "Segundo ajuste de redação executado pelo CEO.",
      expectedCandidateHash: hash2,
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL
  );

  const hash3 = result2.candidateHash;
  assert.notEqual(hash3, hash2);
  assert.equal(result2.changes.length, 3);
  assert.equal(result2.changes[2].id, "CHG-H-002");

  // A resolução v2 ainda está gravada, e seu history ainda contém v1!
  assert.ok(result2.supplement?.resolution);
  assert.equal(result2.supplement?.resolution?.candidateHashAtClosure, hash2);
  assert.equal(result2.supplement?.resolution?.history?.length, 1);
  assert.equal(result2.supplement?.resolution?.history?.[0].candidateHashAtClosure, initialHash);
  console.log("   -> OK: CHG-H-002 adicionado sem perda de histórico. Resolução v2 preservada e descompassada do hash v3.");

  // ---------------------------------------------------------------------------
  // TESTE 9: Terceiro Encerramento Gera Histórico com 2 Entradas Anteriores
  // ---------------------------------------------------------------------------
  console.log("\n9. Re-deliberando e re-encerrando no hash v3 para verificar 2 entradas em history...");
  await mockRepo.saveFindingDecision(
    reviewState.id,
    {
      findingKey: "unverified_claim_2",
      state: "CORRECAO_NECESSARIA",
      justification: "Re-confirmando saneamento no hash v3.",
      correctionChangeId: "CHG-H-001",
      decidedAt: Date.now(),
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
      candidateHashAtDecision: hash3,
    },
    Date.now()
  );

  const decHash3 = computeDecisionStateHash(reviewState);
  const reClosedResult2 = await closeLegalReviewSupplementFlow(
    mockRepo as any,
    reviewState.id,
    {
      overallJustification: "Terceiro encerramento formal do Estágio B no hash v3 pelo CEO.",
      expectedCandidateHash: hash3,
      expectedDecisionStateHash: decHash3,
    },
    "uid_ceo",
    ATHENA_CEO_EMAIL,
    Date.now()
  );

  assert.equal(reClosedResult2.supplement?.resolution?.candidateHashAtClosure, hash3);
  assert.equal(reClosedResult2.supplement?.resolution?.history?.length, 2);

  // history[0]: encerramento original no hash1
  assert.equal(reClosedResult2.supplement?.resolution?.history?.[0].candidateHashAtClosure, initialHash);
  assert.equal(reClosedResult2.supplement?.resolution?.history?.[0].overallJustification, "Encerramento histórico original do Estágio B realizado pelo CEO.");

  // history[1]: segundo encerramento no hash2
  assert.equal(reClosedResult2.supplement?.resolution?.history?.[1].candidateHashAtClosure, hash2);
  assert.equal(reClosedResult2.supplement?.resolution?.history?.[1].overallJustification, "Novo encerramento formal do Estágio B após incorporação da correção humana CHG-H-001.");

  console.log("   -> OK: history acumulou perfeitamente os 2 atos anteriores (v1 e v2), e a resolução vigente é v3.");

  console.log("\n================================================================================");
  console.log("✓ TODOS OS 9 TESTES DE BLINDAGEM DO HISTÓRICO FORAM APROVADOS COM 100% DE SUCESSO!");
  console.log("================================================================================\n");
}

runShieldingSuite().catch((err) => {
  console.error("FALHA NA SUÍTE DE BLINDAGEM DO HISTÓRICO:", err);
  process.exit(1);
});
