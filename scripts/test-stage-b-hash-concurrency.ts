/**
 * ATHENA — ETAPA 15.1: TESTES ADVERSARIAIS DE CONCORRÊNCIA E CONTROLE DE HASH NO ESTÁGIO B
 * MODO: 100% OFFLINE / ISOLAMENTO COMPLETO
 *
 * Cobertura de Testes:
 * 1. Estágio B desabilitado retorna HTTP 503 (Fail-Closed).
 * 2. Usuário não autenticado / Não-CEO retorna HTTP 403 Forbidden.
 * 3. expectedCandidateHash ausente ou inválido retorna HTTP 400 Bad Request.
 * 4. expectedDecisionStateHash ausente ou inválido retorna HTTP 400 Bad Request.
 * 5. Alteração do texto entre duas abas (expectedCandidateHash divergente) retorna HTTP 409 Conflict.
 * 6. Alteração de uma decisão sem mudança do texto (expectedDecisionStateHash divergente) retorna HTTP 409 Conflict.
 * 7. Inclusão ou remoção de deliberação (expectedDecisionStateHash divergente) retorna HTTP 409 Conflict.
 * 8. Alteração de justificativa individual de um achado altera o hash e rejeita com HTTP 409 Conflict.
 * 9. Encerramento duplicado/reincidente no mesmo hash rejeitado com HTTP 409 Conflict.
 * 10. Rejeição com HTTP 400 quando há achados com pendências não deliberadas conclusivamente.
 * 11. Encerramento legítimo com ambos os hashes corretos é persistido com sucesso na transação.
 * 12. Estágio C permanece bloqueado (503) e catálogo de alunos permanece 100% inalterado (v1).
 */

import assert from "node:assert";
import {
  type LegalReviewView,
  type SupplementFindingItem,
  type HumanFindingDecision,
  getFindingStableKey,
} from "../src/lib/legalReviewTypes";
import {
  closeLegalReviewSupplementFlow,
  resolveHumanLegalReviewFinding,
  approveLegalReview,
} from "../src/services/legalReviewFlow";
import {
  computeDecisionStateHash,
} from "../src/lib/legalReviewValidate";
import { hashLessonContent, type LegalReviewRepository } from "../src/services/legalReviewRepository";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider";

function createMockReview(findings: SupplementFindingItem[]): LegalReviewView {
  const content = "# Aula de Direito Administrativo\n\nTexto original da aula.";
  const candidateHash = hashLessonContent(content);
  return {
    id: "rev_stage_b_concurrency_test",
    lessonId: "lesson_test_day1_p1",
    day: 1,
    part: 1,
    subject: "Direito Administrativo",
    topic: "Ato Administrativo",
    originalHash: candidateHash,
    originalApprovedAt: Date.now(),
    originalContent: content,
    reviewedMarkdown: content,
    changes: [],
    unverifiedClaims: [],
    summary: { total: 0, approved: 0, pending: 0, rejected: 0 } as any,
    reviewNotes: "Revisão de teste para Estágio B",
    verificationLevel: "PLENA_COM_RESSALVAS",
    confidence: "ALTA",
    outcome: "VALIDADO_INTEGRALMENTE",
    status: "pending_approval",
    model: "gpt-4o",
    reviewDate: "2026-10-10",
    requestedByUid: "uid_ceo",
    requestedAt: Date.now(),
    webSearchUsed: true,
    testMode: false,
    consultedSources: [],
    manuallyEdited: false,
    candidateHash: candidateHash,
    auditedCandidateHash: candidateHash,
    sourceHistory: [],
    findingDecisions: {},
    supplement: {
      attemptCount: 1,
      status: "inconclusive",
      findings,
    },
  };
}

function createMockRepo(initialReview: LegalReviewView): LegalReviewRepository {
  let stored = JSON.parse(JSON.stringify(initialReview)) as LegalReviewView;
  let catalogLesson = {
    id: initialReview.lessonId,
    content: initialReview.originalContent,
    subject: initialReview.subject,
    topic: initialReview.topic,
    version: 1,
  };

  return {
    async get(id: string) {
      if (id !== stored.id) return null;
      return JSON.parse(JSON.stringify(stored));
    },
    async saveFindingDecision(id: string, findingDecision: HumanFindingDecision, now: number) {
      if (id !== stored.id) throw new Error("Revisão não encontrada");
      stored.findingDecisions = stored.findingDecisions || {};
      stored.findingDecisions[findingDecision.findingKey] = JSON.parse(JSON.stringify(findingDecision));
      return JSON.parse(JSON.stringify(stored));
    },
    async closeSupplementResolution(id: string, resolution: any, now: number, expectedHashes?: any) {
      if (id !== stored.id) throw new Error("Revisão não encontrada");

      // Simulação da transação Firestore da Etapa 15.1
      if (stored.supplement?.resolution && stored.supplement.resolution.status === "RESOLVIDO_PELO_CEO") {
        if (stored.supplement.resolution.candidateHashAtClosure === stored.candidateHash) {
          const err: any = new Error("A complementação jurídica já foi encerrada anteriormente pelo CEO para esta mesma versão do texto candidato.");
          err.status = 409;
          throw err;
        }
      }

      if (expectedHashes) {
        const expCand = (expectedHashes.expectedCandidateHash || "").trim().toLowerCase();
        const expDec = (expectedHashes.expectedDecisionStateHash || "").trim().toLowerCase();

        if (!expCand) {
          const err: any = new Error("O hash esperado do candidato (expectedCandidateHash) é obrigatório.");
          err.status = 400;
          throw err;
        }
        if (!/^[a-f0-9]{64}$/i.test(expCand)) {
          const err: any = new Error("O formato de expectedCandidateHash é inválido (deve ser SHA-256 hexadecimal com 64 caracteres).");
          err.status = 400;
          throw err;
        }
        if (!expDec) {
          const err: any = new Error("O hash esperado do estado de deliberações (expectedDecisionStateHash) é obrigatório.");
          err.status = 400;
          throw err;
        }
        if (!/^[a-f0-9]{64}$/i.test(expDec)) {
          const err: any = new Error("O formato de expectedDecisionStateHash é inválido (deve ser SHA-256 hexadecimal com 64 caracteres).");
          err.status = 400;
          throw err;
        }

        const currentCand = (stored.candidateHash || "").trim().toLowerCase();
        if (currentCand && expCand !== currentCand) {
          const err: any = new Error("A revisão jurídica foi modificada desde o carregamento da página. O texto candidato atual difere da versão visualizada. Recarregue a página antes de encerrar.");
          err.status = 409;
          throw err;
        }

        const currentDec = computeDecisionStateHash(stored).toLowerCase();
        if (expDec !== currentDec) {
          const err: any = new Error("O estado das deliberações individuais foi modificado desde o carregamento da página. As decisões registradas diferem da versão visualizada. Recarregue a página antes de encerrar.");
          err.status = 409;
          throw err;
        }
      }

      const priorResolution = stored.supplement?.resolution;
      const priorHistory = [...(priorResolution?.history || [])];
      if (priorResolution && priorResolution.candidateHashAtClosure !== stored.candidateHash) {
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

      stored.supplement = {
        ...(stored.supplement as any),
        resolution: {
          ...resolution,
          candidateHashAtClosure: stored.candidateHash,
          closedAt: now,
          history: priorHistory,
        },
      };
      return JSON.parse(JSON.stringify(stored));
    },
    async approve(id: string, uid: string, email: string, now: number) {
      if (process.env.LEGAL_REVIEW_STAGE_C_ENABLED !== "true") {
        const err: any = new Error("Estágio C desabilitado.");
        err.status = 503;
        throw err;
      }
      stored.status = "approved";
      catalogLesson.content = stored.reviewedMarkdown;
      catalogLesson.version++;
      return { ok: true, lesson: catalogLesson as any };
    },
    async saveCandidate(id: string, markdown: string, now: number) {
      stored.reviewedMarkdown = markdown;
      stored.candidateHash = hashLessonContent(markdown);
      return JSON.parse(JSON.stringify(stored));
    },
    async getLesson(id: string) {
      return JSON.parse(JSON.stringify(catalogLesson));
    },
    async touchProcessing() { return true; },
    async fail() {},
    async reject() { return JSON.parse(JSON.stringify(stored)); },
  } as any;
}

async function runStageBConcurrencySuite() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 15.1: TESTES ADVERSARIAIS DE CONCORRÊNCIA E HASH (ESTÁGIO B)");
  console.log("MODO: 100% OFFLINE / ISOLAMENTO COMPLETO");
  console.log("================================================================================\n");

  const finding1: SupplementFindingItem = {
    pendingId: "pen_001",
    changeId: "CHG-001",
    statementAnalyzed: "O prazo prescricional quinquenal da Fazenda Pública é disciplinado pelo Decreto 20.910/32.",
    officialSourceConsulted: "Decreto 20.910/32",
    verifiableUrl: "https://www.planalto.gov.br/ccivil_03/decreto/d20910.htm",
    relevantExcerptOrBasis: "Art. 1º As dívidas passivas da União...",
    status: "nao_verificada",
    nature: "NORMA_JURIDICA",
    objectiveJustification: "Necessária verificação de base legal cogente.",
    foundOfficialEvidence: true,
  };

  const finding2: SupplementFindingItem = {
    pendingId: "pen_002",
    statementAnalyzed: "A teoria dos motivos determinantes vincula a validade do ato à veracidade das razões expostas.",
    officialSourceConsulted: "Doutrina de Hely Lopes Meirelles",
    verifiableUrl: "",
    relevantExcerptOrBasis: "Direito Administrativo Brasileiro, Malheiros.",
    status: "nao_verificada",
    nature: "DOUTRINA",
    objectiveJustification: "Princípio consolidado da teoria geral do ato administrativo.",
    foundOfficialEvidence: false,
  };

  // [Teste 1] Estágio B bloqueado com 503 quando flag estiver false ou ausente
  console.log("[Teste 1] Bloqueio HTTP 503 quando Estágio B está ausente ou false");
  {
    process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
    process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "false";
    process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    let threw = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Justificativa válida de encerramento do CEO",
          expectedCandidateHash: review.candidateHash,
          expectedDecisionStateHash: "a".repeat(64),
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 503);
    }
    assert.ok(threw, "Deveria ter bloqueado com 503 na ausência de flag B");
    console.log("  ✓ Bloqueio 503 confirmado quando flag B é false.");
  }

  // Habilitar Estágio B para os demais testes
  process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

  // [Teste 2] Rejeição de Não-CEO (HTTP 403 Forbidden)
  console.log("[Teste 2] Rejeição de identidade não autorizada / Não-CEO (HTTP 403 Forbidden)");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    let threw = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Justificativa válida do CEO com mais de 15 caracteres",
          expectedCandidateHash: review.candidateHash,
          expectedDecisionStateHash: "a".repeat(64),
        },
        "uid_impostor",
        "hacker@gmail.com"
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 403);
      assert.ok(err.message.includes("exige a identidade autenticada do CEO"));
    }
    assert.ok(threw, "Não-CEO deve ser rejeitado com 403");
    console.log("  ✓ Acesso rejeitado com 403 para identidade não-CEO.");
  }

  // [Teste 3] expectedCandidateHash ausente ou inválido rejeitado com HTTP 400
  console.log("[Teste 3] expectedCandidateHash ausente ou inválido rejeitado com HTTP 400 Bad Request");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    // Hash ausente
    let threw = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Justificativa válida do CEO com mais de 15 caracteres",
          expectedCandidateHash: "",
          expectedDecisionStateHash: "a".repeat(64),
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("expectedCandidateHash"));
    }
    assert.ok(threw, "expectedCandidateHash vazio deve retornar 400");

    // Formato inválido
    threw = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Justificativa válida do CEO com mais de 15 caracteres",
          expectedCandidateHash: "hash_curto_invalido",
          expectedDecisionStateHash: "a".repeat(64),
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 400);
    }
    assert.ok(threw, "expectedCandidateHash malformado deve retornar 400");
    console.log("  ✓ Hash do candidato ausente ou inválido rejeitado com 400.");
  }

  // [Teste 4] expectedDecisionStateHash ausente ou inválido rejeitado com HTTP 400
  console.log("[Teste 4] expectedDecisionStateHash ausente ou inválido rejeitado com HTTP 400 Bad Request");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    // Hash de deliberação ausente
    let threw = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Justificativa válida do CEO com mais de 15 caracteres",
          expectedCandidateHash: review.candidateHash,
          expectedDecisionStateHash: "",
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("expectedDecisionStateHash"));
    }
    assert.ok(threw, "expectedDecisionStateHash vazio deve retornar 400");

    // Hash de deliberação não hexadecimal / curto
    threw = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Justificativa válida do CEO com mais de 15 caracteres",
          expectedCandidateHash: review.candidateHash,
          expectedDecisionStateHash: "zzzz".repeat(16),
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 400);
    }
    assert.ok(threw, "expectedDecisionStateHash malformado deve retornar 400");
    console.log("  ✓ Hash do estado de deliberações ausente ou inválido rejeitado com 400.");
  }

  // [Teste 5] Alteração de texto entre duas abas (expectedCandidateHash desatualizado) rejeitado com HTTP 409
  console.log("[Teste 5] Alteração do texto candidato entre abas rejeitado com HTTP 409 Conflict");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    const oldCandidateHash = review.candidateHash;
    // Aba 1 edita o texto e altera candidateHash
    await repo.saveCandidate(review.id, "# Aula de Direito Administrativo\n\nTexto com edição na Aba 1.", Date.now());

    let threw = false;
    try {
      // Aba 2 tenta encerrar com o hash antigo
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Justificativa válida do CEO com mais de 15 caracteres",
          expectedCandidateHash: oldCandidateHash,
          expectedDecisionStateHash: "a".repeat(64),
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 409);
      assert.ok(err.message.includes("O texto candidato atual difere da versão visualizada"));
    }
    assert.ok(threw, "Hash de candidato defasado deve ser bloqueado com 409");
    console.log("  ✓ Concorrência de texto entre abas bloqueada com 409 Conflict.");
  }

  // [Teste 6] Alteração de uma deliberação sem alteração de texto (expectedDecisionStateHash desatualizado) rejeitado com HTTP 409
  console.log("[Teste 6] Alteração de deliberação sem alteração de texto rejeitado com HTTP 409 Conflict");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    // Snapshot do hash de decisões na Aba 2 antes da Aba 1 deliberar
    const oldDecisionHash = computeDecisionStateHash(review);

    // Aba 1 delibera o achado
    const key = getFindingStableKey(finding1);
    await repo.saveFindingDecision(review.id, {
      findingKey: key,
      findingPendingId: finding1.pendingId,
      reviewId: review.id,
      originalAiStatus: "nao_verificada",
      originalStatementAnalyzed: finding1.statementAnalyzed,
      action: "CONFIRMAR",
      state: "CONFIRMADO_PELO_CEO",
      justification: "Decreto federal positivo e em vigor plenamente conferido no Planalto.",
      evidenceDeclaration: {
        declaredSource: "Decreto 20.910/32",
        declaredUrl: "https://www.planalto.gov.br/ccivil_03/decreto/d20910.htm",
        declaredExcerpt: "Art. 1º",
        documentaryVerified: true,
      },
      expectedCandidateHash: review.candidateHash,
      candidateHashAtDecision: review.candidateHash,
      decidedAt: Date.now(),
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    }, Date.now());

    // Aba 2 tenta encerrar com o hash de decisões antigo
    let threw = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Justificativa válida do CEO com mais de 15 caracteres",
          expectedCandidateHash: review.candidateHash,
          expectedDecisionStateHash: oldDecisionHash,
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 409);
      assert.ok(err.message.includes("O estado das deliberações individuais foi modificado"));
    }
    assert.ok(threw, "Hash de decisão defasado deve ser bloqueado com 409");
    console.log("  ✓ Alteração concorrente de decisão bloqueada com 409 Conflict.");
  }

  // [Teste 7] Inclusão de decisão e alteração de justificativa altera determinísticamente o hash
  console.log("[Teste 7] Determinismo e sensibilidade estrita de computeDecisionStateHash");
  {
    const review = createMockReview([finding1, finding2]);
    const hInitial = computeDecisionStateHash(review);

    // Delibera finding1
    const key1 = getFindingStableKey(finding1);
    review.findingDecisions = {
      [key1]: {
        findingKey: key1,
        findingPendingId: finding1.pendingId,
        reviewId: review.id,
        originalAiStatus: "nao_verificada",
        originalStatementAnalyzed: finding1.statementAnalyzed,
        action: "CONFIRMAR",
        state: "CONFIRMADO_PELO_CEO",
        justification: "Fundamentação com 10 caracteres no mínimo.",
        evidenceDeclaration: {
          declaredSource: "Decreto 20.910/32",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/decreto/d20910.htm",
          documentaryVerified: true,
        },
        expectedCandidateHash: review.candidateHash,
        candidateHashAtDecision: review.candidateHash,
        decidedAt: Date.now(),
        decidedByUid: "uid_ceo",
        decidedByEmail: ATHENA_CEO_EMAIL,
      },
    };
    const hAfter1 = computeDecisionStateHash(review);
    assert.notStrictEqual(hInitial, hAfter1, "Deliberação de um achado deve alterar o hash");

    // Altera uma única letra na justificativa
    review.findingDecisions[key1].justification = "Fundamentação com 10 caracteres no mínimo!";
    const hAfterEditJustification = computeDecisionStateHash(review);
    assert.notStrictEqual(hAfter1, hAfterEditJustification, "Modificação na justificativa deve alterar o hash");

    console.log("  ✓ Alterações em decisões e justificativas alteram 100% determinísticamente o hash.");
  }

  // [Teste 8] Rejeição com HTTP 400 por pendências não deliberadas
  console.log("[Teste 8] Bloqueio HTTP 400 quando há achados pendentes");
  {
    const review = createMockReview([finding1, finding2]);
    // Delibera somente finding1; finding2 permanece pendente
    const key1 = getFindingStableKey(finding1);
    review.findingDecisions = {
      [key1]: {
        findingKey: key1,
        findingPendingId: finding1.pendingId,
        reviewId: review.id,
        originalAiStatus: "nao_verificada",
        originalStatementAnalyzed: finding1.statementAnalyzed,
        action: "CONFIRMAR",
        state: "CONFIRMADO_PELO_CEO",
        justification: "Decreto federal positivo e em vigor plenamente conferido no Planalto.",
        evidenceDeclaration: {
          declaredSource: "Decreto 20.910/32",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/decreto/d20910.htm",
          documentaryVerified: true,
        },
        expectedCandidateHash: review.candidateHash,
        candidateHashAtDecision: review.candidateHash,
        decidedAt: Date.now(),
        decidedByUid: "uid_ceo",
        decidedByEmail: ATHENA_CEO_EMAIL,
      },
    };
    const repo = createMockRepo(review);
    const validDecHash = computeDecisionStateHash(review);

    let threw = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Justificativa global do CEO para encerramento.",
          expectedCandidateHash: review.candidateHash,
          expectedDecisionStateHash: validDecHash,
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("não possui deliberação registrada"));
    }
    assert.ok(threw, "Deveria ter rejeitado com 400 por pendência no finding2");
    console.log("  ✓ Encerramento com achados pendentes rejeitado com 400.");
  }

  // [Teste 9] Encerramento legítimo com todos os hashes válidos persistido com sucesso
  console.log("[Teste 9] Encerramento legítimo persistido com sucesso na transação");
  let closedReviewResult: LegalReviewView;
  {
    const review = createMockReview([finding1, finding2]);
    const key1 = getFindingStableKey(finding1);
    const key2 = getFindingStableKey(finding2);

    review.findingDecisions = {
      [key1]: {
        findingKey: key1,
        findingPendingId: finding1.pendingId,
        reviewId: review.id,
        originalAiStatus: "nao_verificada",
        originalStatementAnalyzed: finding1.statementAnalyzed,
        action: "CONFIRMAR",
        state: "CONFIRMADO_PELO_CEO",
        justification: "Decreto federal positivo e em vigor plenamente conferido no Planalto.",
        evidenceDeclaration: {
          declaredSource: "Decreto 20.910/32",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/decreto/d20910.htm",
          documentaryVerified: true,
        },
        expectedCandidateHash: review.candidateHash,
        candidateHashAtDecision: review.candidateHash,
        decidedAt: Date.now(),
        decidedByUid: "uid_ceo",
        decidedByEmail: ATHENA_CEO_EMAIL,
      },
      [key2]: {
        findingKey: key2,
        findingPendingId: finding2.pendingId,
        reviewId: review.id,
        originalAiStatus: "nao_verificada",
        originalStatementAnalyzed: finding2.statementAnalyzed,
        action: "CONFIRMAR",
        state: "CONFIRMADO_PELO_CEO",
        justification: "Doutrina amplamente acolhida nos concursos da Magistratura e MP.",
        evidenceDeclaration: {
          declaredSource: "Hely Lopes Meirelles",
          bibliographicReference: "Direito Administrativo Brasileiro, 42ª ed.",
          documentaryVerified: true,
        },
        expectedCandidateHash: review.candidateHash,
        candidateHashAtDecision: review.candidateHash,
        decidedAt: Date.now(),
        decidedByUid: "uid_ceo",
        decidedByEmail: ATHENA_CEO_EMAIL,
      },
    };
    const repo = createMockRepo(review);
    const validDecHash = computeDecisionStateHash(review);

    const closed = await closeLegalReviewSupplementFlow(
      repo,
      review.id,
      {
        overallJustification: "Todos os achados jurídicos foram sanados e conferidos documentalmente pelo CEO.",
        expectedCandidateHash: review.candidateHash,
        expectedDecisionStateHash: validDecHash,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    assert.strictEqual(closed.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO");
    assert.strictEqual(closed.supplement?.resolution?.candidateHashAtClosure, review.candidateHash);
    assert.strictEqual(closed.supplement?.resolution?.totalFindingsResolved, 2);
    closedReviewResult = closed;
    console.log("  ✓ Encerramento formal persistido com integridade transacional.");

    // [Teste 10] Encerramento duplicado no mesmo hash rejeitado com 409 Conflict
    console.log("[Teste 10] Proteção contra encerramento duplicado rejeitada com HTTP 409 Conflict");
    let duplicateThrew = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        {
          overallJustification: "Tentativa de segundo encerramento sobre a mesma revisão.",
          expectedCandidateHash: review.candidateHash,
          expectedDecisionStateHash: validDecHash,
        },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      duplicateThrew = true;
      assert.strictEqual(err.status, 409);
      assert.ok(err.message.includes("já foi encerrada anteriormente pelo CEO"));
    }
    assert.ok(duplicateThrew, "Encerramento duplicado deve falhar com 409");
    console.log("  ✓ Encerramento duplicado rejeitado com 409.");
  }

  // [Teste 11] Estágio C bloqueado com 503 e catálogo de alunos inalterado
  console.log("[Teste 11] Isolamento total contra Estágio C e imutabilidade do catálogo de alunos");
  {
    const repo = createMockRepo(closedReviewResult);
    let threw = false;
    try {
      await approveLegalReview(repo, closedReviewResult.id, "uid_ceo", ATHENA_CEO_EMAIL);
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 503);
    }
    assert.ok(threw, "Aprovação final no Estágio C deve estar estritamente bloqueada com 503");

    const lesson = await repo.getLesson(closedReviewResult.lessonId);
    assert.strictEqual(lesson.version, 1, "Versão do catálogo deve permanecer 1");
    assert.strictEqual(lesson.content, "# Aula de Direito Administrativo\n\nTexto original da aula.");
    console.log("  ✓ Catálogo de alunos intocado (v1) e Estágio C estritamente bloqueado (503).");
  }

  // [Teste 12] Reabertura/Edição posterior invalida encerramento e novo encerramento preserva histórico cumulativo
  console.log("[Teste 12] Preservação de histórico cumulativo em re-encerramento após alteração de texto");
  {
    const repo = createMockRepo(closedReviewResult);
    // Simula edição do texto da aula (alterando candidateHash)
    const newContent = "# Aula de Direito Administrativo\n\nTexto com edição posterior após encerramento.";
    const afterEdit = await repo.saveCandidate(closedReviewResult.id, newContent, Date.now());

    // Atualiza deliberações para o novo hash
    const key1 = getFindingStableKey(finding1);
    const key2 = getFindingStableKey(finding2);
    await repo.saveFindingDecision(afterEdit.id, {
      ...afterEdit.findingDecisions![key1],
      candidateHashAtDecision: afterEdit.candidateHash,
      expectedCandidateHash: afterEdit.candidateHash,
    }, Date.now());
    await repo.saveFindingDecision(afterEdit.id, {
      ...afterEdit.findingDecisions![key2],
      candidateHashAtDecision: afterEdit.candidateHash,
      expectedCandidateHash: afterEdit.candidateHash,
    }, Date.now());

    const afterReDeliberated = await repo.get(afterEdit.id);
    const newDecHash = computeDecisionStateHash(afterReDeliberated!);

    const reClosed = await closeLegalReviewSupplementFlow(
      repo,
      afterEdit.id,
      {
        overallJustification: "Novo encerramento pelo CEO após ajuste no texto da aula.",
        expectedCandidateHash: afterEdit.candidateHash,
        expectedDecisionStateHash: newDecHash,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    assert.strictEqual(reClosed.supplement?.resolution?.candidateHashAtClosure, afterEdit.candidateHash);
    assert.strictEqual(reClosed.supplement?.resolution?.overallJustification, "Novo encerramento pelo CEO após ajuste no texto da aula.");
    assert.ok(Array.isArray(reClosed.supplement?.resolution?.history));
    assert.strictEqual(reClosed.supplement?.resolution?.history?.length, 1);
    assert.strictEqual(reClosed.supplement?.resolution?.history?.[0].candidateHashAtClosure, closedReviewResult.candidateHash);
    assert.strictEqual(reClosed.supplement?.resolution?.history?.[0].overallJustification, "Todos os achados jurídicos foram sanados e conferidos documentalmente pelo CEO.");
    console.log("  ✓ Histórico cumulativo do encerramento anterior preservado com fidelidade.");
  }

  console.log("\n================================================================================");
  console.log("✓ TODOS OS 12 TESTES ADVERSARIAIS DO ESTÁGIO B FORAM APROVADOS COM 100% DE SUCESSO!");
  console.log("================================================================================\n");
}

runStageBConcurrencySuite().catch((err) => {
  console.error("FALHA NOS TESTES DO ESTÁGIO B:", err);
  process.exit(1);
});
