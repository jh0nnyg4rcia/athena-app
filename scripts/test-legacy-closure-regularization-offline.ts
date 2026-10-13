/**
 * Teste Offline Determinístico — Regularização de Encerramentos Legados
 * 
 * Demonstra:
 * 1. Comportamento fail-closed quando uma revisão possui encerramento legado sem decisionStateHashAtClosure.
 * 2. Bloqueio de homologação enquanto o encerramento antigo não for formalmente regularizado.
 * 3. Preservação integral do ato histórico na lista de histórico (append-only).
 * 4. Exigência de deliberação completa e válida dos achados.
 * 5. Lavratura de novo encerramento formal do Estágio B com geração dos hashes contemporâneos.
 * 6. Validação e elegibilidade pós-regularização.
 */

import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  LegalReviewView,
  SupplementHumanResolution,
  HumanFindingDecision,
} from "../src/lib/legalReviewTypes";

const ATHENA_CEO_EMAIL = "jhonny.spider@gmail.com";
import {
  validateFindingsHomologation,
  computeDecisionStateHash,
} from "../src/lib/legalReviewValidate";
import {
  closeLegalReviewSupplementFlow,
  resolveHumanLegalReviewFinding,
} from "../src/services/legalReviewFlow";

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

async function runLegacyClosureRegularizationTests() {
  process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

  console.log("=== INICIANDO TESTE OFFLINE: REGULARIZAÇÃO DE REVISÕES LEGADAS ===");

  const lessonMarkdown = "# Aula de Direito Administrativo\n\nTexto oficial da aula para fins de auditoria de atos administrativos.";
  const candHash = sha256(lessonMarkdown);

  // 1. Criação do estado de revisão com encerramento legado (pré-20.4)
  const legacyReview: LegalReviewView = {
    id: "rev_legacy_001",
    lessonId: "day_01_part_01",
    day: 1,
    part: 1,
    subject: "Direito Administrativo",
    topic: "Atos Administrativos",
    reviewedMarkdown: lessonMarkdown,
    candidateHash: candHash,
    auditedCandidateHash: candHash,
    status: "pending_approval",
    confidence: "high",
    verificationLevel: "VERIFICACAO_PARCIAL",
    outcome: "approved_with_reservations",
    summary: "Revisão jurídica legada",
    sourceHistory: [],
    consultedSources: [],
    changes: [],
    editorialIntegrity: { passed: true, problematicChanges: [] },
    supplement: {
      attemptCount: 1,
      status: "inconclusive",
      findings: [
        {
          findingKey: "claim_leg_1",
          pendingId: "claim_leg_1",
          nature: "FACTUAL_ASSERTION",
          severity: "MEDIUM",
          statementAnalyzed: "O ato administrativo produz efeitos imediatos.",
          unverifiedText: "O ato administrativo produz efeitos imediatos.",
          legalIssue: "Eficácia e autoexecutoriedade",
          requiresHumanReview: true,
        },
        {
          findingKey: "claim_leg_2",
          pendingId: "claim_leg_2",
          nature: "LEGAL_INTERPRETATION",
          severity: "HIGH",
          statementAnalyzed: "A revogação de ato administrativo pode ter efeitos retroativos.",
          unverifiedText: "A revogação de ato administrativo pode ter efeitos retroativos.",
          legalIssue: "Efeitos da revogação ex nunc",
          requiresHumanReview: true,
        },
      ],
      // Encerramento Legado: sem decisionStateHashAtClosure
      resolution: {
        status: "RESOLVIDO_PELO_CEO",
        closedAt: 1700000000000,
        closedByUid: "uid_ceo_legacy",
        closedByEmail: ATHENA_CEO_EMAIL,
        overallJustification: "Encerramento legado efetuado antes da implantação da Etapa 20.4 sem hash de decisões.",
        candidateHashAtClosure: candHash,
        decisionStateHashAtClosure: undefined as any, // AUSENTE NO LEGADO
        totalFindingsResolved: 2,
        history: [],
      },
    },
    findingDecisions: {
      claim_leg_1: {
        findingKey: "claim_leg_1",
        action: "CONFIRMAR",
        state: "CONFIRMADO_PELO_CEO",
        justification: "Confirmado com base no princípio da presunção de legitimidade.",
        evidenceDeclaration: {
          declaredSource: "Lei 9.784/1999, art. 2º",
          documentaryVerified: true,
        },
        decidedAt: 1700000000000,
        decidedByUid: "uid_ceo_legacy",
        decidedByEmail: ATHENA_CEO_EMAIL,
        candidateHashAtDecision: candHash,
      },
      claim_leg_2: {
        findingKey: "claim_leg_2",
        action: "CONFIRMAR",
        state: "CONFIRMADO_PELO_CEO",
        justification: "Confirmado indevidamente no passado sem correção doutrinária.",
        evidenceDeclaration: {
          declaredSource: "Doutrina minoritária superada",
          documentaryVerified: false,
        },
        decidedAt: 1700000000000,
        decidedByUid: "uid_ceo_legacy",
        decidedByEmail: ATHENA_CEO_EMAIL,
        candidateHashAtDecision: candHash,
      },
    },
    addenda: [],
  };

  // Mock Repository com comportamento append-only idêntico ao Firestore
  let reviewState = JSON.parse(JSON.stringify(legacyReview)) as LegalReviewView;
  const mockRepo = {
    async get(id: string) {
      if (id !== reviewState.id) return null;
      return JSON.parse(JSON.stringify(reviewState));
    },
    async saveFindingDecision(id: string, decision: HumanFindingDecision, now: number) {
      if (id !== reviewState.id) throw new Error("Not found");
      reviewState.findingDecisions = reviewState.findingDecisions || {};
      reviewState.findingDecisions[decision.findingKey] = JSON.parse(JSON.stringify(decision));
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
      const curDecHash = computeDecisionStateHash(reviewState);

      // Sempre arquiva resolução anterior no histórico
      if (priorResolution) {
        priorHistory.push({
          status: priorResolution.status,
          closedAt: priorResolution.closedAt,
          closedByUid: priorResolution.closedByUid,
          closedByEmail: priorResolution.closedByEmail,
          overallJustification: priorResolution.overallJustification,
          candidateHashAtClosure: priorResolution.candidateHashAtClosure,
          decisionStateHashAtClosure: priorResolution.decisionStateHashAtClosure,
          totalFindingsResolved: priorResolution.totalFindingsResolved,
        });
      }

      reviewState.supplement = {
        ...reviewState.supplement!,
        resolution: {
          ...resolution,
          candidateHashAtClosure: reviewState.candidateHash,
          decisionStateHashAtClosure: curDecHash,
          closedAt: now,
          history: priorHistory,
        },
      };
      return JSON.parse(JSON.stringify(reviewState));
    },
  };

  // -------------------------------------------------------------------------
  // TESTE 1: Fail-Closed da Revisão Legada
  // -------------------------------------------------------------------------
  console.log("\n[Cenário 1] Verificação fail-closed: Encerramento legado sem decisionStateHashAtClosure");
  {
    const validation = validateFindingsHomologation(reviewState);
    assert.strictEqual(validation.ok, false, "Revisão legada não pode ser presumida válida");
    assert.ok(
      validation.failureReasons.some((r) => r.includes("decisionStateHashAtClosure ausente") || r.includes("é legado")),
      "Deve acusar ausência de rastreamento de decisões"
    );
    console.log("  ✓ Bloqueio fail-closed validado com sucesso:");
    console.log(`    Motivo: ${validation.failureReasons[0]}`);
  }

  // -------------------------------------------------------------------------
  // TESTE 2: Redeliberação do Achado Problemático pelo CEO
  // -------------------------------------------------------------------------
  console.log("\n[Cenário 2] Redeliberação retificadora do achado 'claim_leg_2'");
  {
    const updatedReview = await resolveHumanLegalReviewFinding(
      mockRepo as any,
      reviewState.id,
      {
        findingKey: "claim_leg_2",
        pendingId: "claim_leg_2",
        action: "DECLARAR_NAO_COMPROVADO",
        justification: "A revogação de ato administrativo opera efeitos puramente prospectivos (ex nunc); a retroatividade foi expurgada.",
        expectedCandidateHash: reviewState.candidateHash,
        expurgationConfirmed: true,
      },
      "uid_ceo_active",
      ATHENA_CEO_EMAIL
    );

    assert.strictEqual(updatedReview.findingDecisions?.["claim_leg_2"].action, "DECLARAR_NAO_COMPROVADO");
    console.log("  ✓ Deliberação do achado atualizada pelo CEO.");
  }

  // -------------------------------------------------------------------------
  // TESTE 3: Regularização Formal do Estágio B pelo CEO
  // -------------------------------------------------------------------------
  console.log("\n[Cenário 3] Novo Encerramento do Estágio B e Preservação do Ato Legado");
  {
    const curDecHash = computeDecisionStateHash(reviewState);
    const regularized = await closeLegalReviewSupplementFlow(
      mockRepo as any,
      reviewState.id,
      {
        overallJustification: "Regularização administrativa formal da lição com expurgo da tese equivocada e registro de hashes contemporâneos.",
        expectedCandidateHash: reviewState.candidateHash,
        expectedDecisionStateHash: curDecHash,
      },
      "uid_ceo_active",
      ATHENA_CEO_EMAIL
    );

    // 3a: Histórico preservado integralmente
    const resolution = regularized.supplement?.resolution;
    assert.ok(resolution, "Resolução deve existir");
    assert.strictEqual(resolution.history.length, 1, "Ato histórico legado deve estar arquivado no histórico");
    assert.strictEqual(resolution.history[0].closedByUid, "uid_ceo_legacy");
    assert.strictEqual(resolution.history[0].decisionStateHashAtClosure, undefined);
    assert.strictEqual(resolution.history[0].overallJustification, "Encerramento legado efetuado antes da implantação da Etapa 20.4 sem hash de decisões.");
    console.log("  ✓ Histórico anterior preservado integralmente sem alteração retroativa.");

    // 3b: Nova resolução contém hashes válidos
    assert.strictEqual(resolution.status, "RESOLVIDO_PELO_CEO");
    assert.strictEqual(resolution.candidateHashAtClosure, reviewState.candidateHash);
    assert.strictEqual(resolution.decisionStateHashAtClosure, curDecHash);
    assert.strictEqual(resolution.closedByEmail, ATHENA_CEO_EMAIL);
    console.log("  ✓ Novo encerramento gravado com decisionStateHashAtClosure contemporâneo.");

    // 3c: Validação de homologação agora é OK: TRUE
    const validationAfter = validateFindingsHomologation(regularized);
    assert.strictEqual(validationAfter.ok, true, "Validação de homologação deve passar 100% após a regularização");
    assert.strictEqual(validationAfter.failureReasons.length, 0);
    console.log("  ✓ Validação pós-regularização aprovada com sucesso (0 pendências).");
  }

  console.log("\n=== TESTE OFFLINE DE REGULARIZAÇÃO LEGADA CONCLUÍDO COM 100% DE SUCESSO ===");
}

runLegacyClosureRegularizationTests().catch((err) => {
  console.error("FALHA NO TESTE:", err);
  process.exit(1);
});
