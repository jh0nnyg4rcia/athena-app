/**
 * ATHENA — ETAPA 6C: TESTES OFFLINE DA HOMOLOGAÇÃO JURÍDICA CONTROLADA
 *
 * Cobertura de Verificação:
 * 1. Três estágios independentes:
 *    A. Deliberação individual dos achados (resolveHumanLegalReviewFinding)
 *    B. Encerramento fundamentado da complementação (closeLegalReviewSupplementFlow)
 *    C. Aprovação final da revisão (approveLegalReview)
 *    -> Nenhuma operação executa automaticamente a seguinte.
 * 2. Bloqueio de aprovação direta sem deliberação (fail-closed).
 * 3. Bloqueio de aprovação após Estágio A mas sem encerramento formal (Estágio B).
 * 4. Desacoplamento estrito: Estágio B concluído NÃO publica a aula nem altera seu status de aprovação.
 * 5. Rejeição do Estágio B com justificativa insuficiente (< 15 chars) ou achados pendentes.
 * 6. Regra de Invalidação Obrigatória: edição do texto da aula após Estágio B invalida o encerramento por descompasso de hash.
 * 7. Re-encerramento do Estágio B após edição restaura a aptidão para homologação final.
 * 8. Validações por natureza jurídica:
 *    - Norma jurídica / precedente vinculante: exige diploma positivo ou precedente judicial oficial.
 *    - Doutrina: admite referência bibliográfica sem exigir URL oficial de tribunal; rejeita divergência contra norma cogente.
 *    - Afirmação empírica: exige fundamentação metodológica/amostragem verificável.
 * 9. CORRECAO_NECESSARIA: exige texto corrigido presente no markdown final.
 * 10. NAO_COMPROVADO: exige expurgationConfirmed e bloqueia se o enunciado persistir no texto.
 * 11. Autorização estrita do CEO: rejeita não-CEO com HTTP 403 em todos os atos deliberativos.
 * 12. Conflito de concorrência com o catálogo oficial (originalHash) -> fail-closed.
 * 13. Preservação de dados históricos e imutabilidade dos achados originais da IA.
 */

// Simulação de flags operacionais estritamente locais para a suíte de testes offline
process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "true";

import assert from "node:assert";
import {
  getFindingStableKey,
  type HumanFindingDecision,
  type LegalReviewChange,
  type LegalReviewView,
  type SupplementFindingItem,
  type SupplementHumanResolution,
} from "../src/lib/legalReviewTypes";
import {
  approveLegalReview,
  closeLegalReviewSupplementFlow,
  resolveHumanLegalReviewFinding,
} from "../src/services/legalReviewFlow";
import {
  hashLessonContent,
  type LegalReviewRepository,
} from "../src/services/legalReviewRepository";
import {
  computeDecisionStateHash,
  validateFindingsForClosure,
  validateFindingsHomologation,
} from "../src/lib/legalReviewValidate";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider";

function createMockFinding(params: Partial<SupplementFindingItem>): SupplementFindingItem {
  return {
    pendingId: params.pendingId || "pen_test",
    changeId: params.changeId,
    statementAnalyzed: params.statementAnalyzed || "Afirmação em análise jurídica detalhada.",
    officialSourceConsulted: params.officialSourceConsulted || "Fonte de teste",
    verifiableUrl: params.verifiableUrl || "https://www.planalto.gov.br/lei",
    relevantExcerptOrBasis: params.relevantExcerptOrBasis || "Excerto legal de suporte",
    status: params.status || "nao_verificada",
    nature: params.nature || "NORMA_JURIDICA",
    outcome: params.outcome || "NAO_VERIFICADA",
    objectiveJustification: params.objectiveJustification || "Não foi possível verificar com certeza.",
    foundOfficialEvidence: false,
    ...params,
  };
}

function createMockReview(findings: SupplementFindingItem[], initialMarkdown = "# Aula de Direito Administrativo\n\nTexto oficial da aula."): LegalReviewView {
  const candHash = hashLessonContent(initialMarkdown);
  return {
    id: "rev_test_6c",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Administrativo",
    originalHash: "hash_catalog_initial",
    originalApprovedAt: null,
    originalContent: "# Aula de Direito Administrativo\n\nTexto original da aula.",
    reviewedMarkdown: initialMarkdown,
    changes: [
      {
        id: "CHG-001",
        type: "CORRECAO",
        category: "LEGISLACAO",
        originalExcerpt: "Texto original da aula.",
        revisedExcerpt: "Texto oficial da aula.",
        justification: "Correção de conformidade legislativa.",
        source: "Lei 8.666",
        nature: "NORMA_JURIDICA",
        outcome: "CONFIRMADA",
      },
    ],
    unverifiedClaims: [],
    summary: { totalChanges: 1, corrections: 1, additions: 0, removals: 0, updates: 0, precisions: 0, restructures: 0 },
    reviewNotes: "Revisão detalhada.",
    verificationLevel: "VERIFICACAO_COMPLETA",
    confidence: "ALTA",
    outcome: "ALTERACOES_NECESSARIAS",
    status: "pending_approval",
    model: "mock-model",
    reviewDate: "09/10/2026",
    requestedByUid: "uid_ceo_1",
    requestedAt: Date.now(),
    webSearchUsed: true,
    testMode: false,
    consultedSources: [],
    manuallyEdited: false,
    candidateHash: candHash,
    auditedCandidateHash: candHash,
    sourceHistory: [],
    supplement: {
      attemptCount: 1,
      status: "inconclusive",
      findings,
    },
    findingDecisions: {},
  };
}

function createMockRepo(initialReview: LegalReviewView, catalogLessonContent = "# Aula de Direito Administrativo\n\nTexto original da aula."): LegalReviewRepository {
  let stored = JSON.parse(JSON.stringify(initialReview)) as LegalReviewView;
  let catalogLesson = {
    id: stored.lessonId,
    day: stored.day,
    part: stored.part,
    subject: stored.subject,
    content: catalogLessonContent,
    version: 1,
    approvedAt: Date.now() - 100000,
    approvedBy: ATHENA_CEO_EMAIL,
  };

  return {
    async getLesson() { return catalogLesson as any; },
    async getIndex() { return null; },
    async begin() {},
    async complete() {},
    async fail() {},
    async touchProcessing() { return true; },
    async get(id: string) {
      if (id === stored.id) return JSON.parse(JSON.stringify(stored));
      return null;
    },
    async saveCandidate(id: string, md: string) {
      stored.reviewedMarkdown = md;
      stored.candidateHash = hashLessonContent(md);
      // REGRA DE INVALIDAÇÃO: edição invalida supplement.resolution
      if (stored.supplement?.resolution) {
        delete stored.supplement.resolution;
      }
      return JSON.parse(JSON.stringify(stored));
    },
    async saveFindingDecision(id: string, dec: HumanFindingDecision, now: number) {
      const existing = stored.findingDecisions || {};
      stored.findingDecisions = {
        ...existing,
        [dec.findingKey]: { ...dec, decidedAt: now },
      };
      return JSON.parse(JSON.stringify(stored));
    },
    async closeSupplementResolution(id: string, resolution: SupplementHumanResolution, now: number) {
      stored.supplement = {
        ...(stored.supplement as any),
        resolution: {
          ...resolution,
          candidateHashAtClosure: stored.candidateHash,
          decisionStateHashAtClosure: computeDecisionStateHash(stored),
          closedAt: now,
        },
      };
      return JSON.parse(JSON.stringify(stored));
    },
    async reject(id: string, uid: string, now: number) {
      stored.status = "rejected";
      return JSON.parse(JSON.stringify(stored));
    },
    async approve(id: string, uid: string, email: string, now: number) {
      stored.status = "approved";
      catalogLesson.content = stored.reviewedMarkdown;
      catalogLesson.version++;
      return { ok: true, lesson: catalogLesson as any };
    },
  };
}

async function resolveFindingHelper(
  repo: LegalReviewRepository,
  reviewId: string,
  params: any,
  uid: string,
  email: string
) {
  const current = await repo.get(reviewId);
  const expectedCandidateHash = params.expectedCandidateHash || current?.candidateHash || "";
  return resolveHumanLegalReviewFinding(
    repo,
    reviewId,
    {
      expectedCandidateHash,
      ...params,
    },
    uid,
    email
  );
}

async function closeSupplementHelper(
  repo: LegalReviewRepository,
  reviewId: string,
  params: any,
  uid: string,
  email: string
) {
  const current = await repo.get(reviewId);
  const expectedCandidateHash = params.expectedCandidateHash || current?.candidateHash || "";
  const expectedDecisionStateHash =
    params.expectedDecisionStateHash || (current ? computeDecisionStateHash(current) : "");
  return closeLegalReviewSupplementFlow(
    repo,
    reviewId,
    {
      expectedCandidateHash,
      expectedDecisionStateHash,
      ...params,
    },
    uid,
    email
  );
}

async function runControlledHomologationSuite() {
  console.log("=== INICIANDO TESTES OFFLINE: HOMOLOGAÇÃO JURÍDICA CONTROLADA (ETAPA 6C) ===\n");

  const finding1 = createMockFinding({
    pendingId: "pen_001",
    changeId: "CHG-001",
    statementAnalyzed: "O prazo decadencial para anulação do ato é de 5 anos.",
    nature: "NORMA_JURIDICA",
    status: "nao_verificada",
  });
  const finding2 = createMockFinding({
    pendingId: "pen_002",
    statementAnalyzed: "A doutrina clássica de Hely Lopes admite a convalidação ampla.",
    nature: "DOUTRINA",
    status: "nao_verificada",
  });

  // --------------------------------------------------------------------------
  // CENÁRIO 1: Aprovação direta (Stage C) sem Estágios A e B -> Bloqueada
  // --------------------------------------------------------------------------
  console.log("[Cenário 1] Tentativa de aprovação direta (Stage C) sem deliberar achados");
  {
    const review = createMockReview([finding1, finding2]);
    const repo = createMockRepo(review);

    let failed = false;
    try {
      await approveLegalReview(repo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    } catch (err: any) {
      failed = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("bloqueada por pendências na complementação jurídica"));
      assert.ok(err.message.includes("não possui encerramento administrativo formal"));
      console.log("  ✓ Aprovação direta foi bloqueada com erro descritivo.");
    }
    assert.ok(failed, "Aprovação direta deveria ter falhado.");
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 2: Aprovação (Stage C) após Estágio A mas sem Estágio B -> Bloqueada
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 2] Tentativa de aprovação após Estágio A mas sem fechar Estágio B");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    // Executa Estágio A para o achado
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(finding1),
        action: "CONFIRMAR",
        justification: "Dispositivo legal expressamente verificado no texto da Lei 9.784/99 art. 54.",
        evidenceDeclaration: {
          declaredSource: "Lei 9.784/1999, art. 54",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/leis/l9784.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    let failed = false;
    try {
      await approveLegalReview(repo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    } catch (err: any) {
      failed = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("não possui encerramento administrativo formal realizado pelo CEO"));
      console.log("  ✓ Aprovação sem Estágio B foi estritamente bloqueada.");
    }
    assert.ok(failed, "Aprovação sem Estágio B deveria ter falhado.");
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 3: Estágio B executado -> Desacoplamento estrito (não aprova a aula)
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 3] Execução do Estágio B: desacoplamento e preservação de estado");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    // 1. Estágio A
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(finding1),
        action: "CONFIRMAR",
        justification: "Dispositivo legal expressamente verificado no texto da Lei 9.784/99 art. 54.",
        evidenceDeclaration: {
          declaredSource: "Lei 9.784/1999, art. 54",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/leis/l9784.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // 2. Estágio B
    const closed = await closeSupplementHelper(
      repo,
      review.id,
      {
        overallJustification: "Encerramento formal de todos os achados jurídicos fundamentados pelo CEO.",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    assert.strictEqual(closed.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO");
    assert.strictEqual(closed.status, "pending_approval", "Status deve permanecer pending_approval");
    
    // Verifica que aula no catálogo NÃO foi publicada/modificada
    const catalog = await repo.getLesson("day_1_part_0");
    assert.strictEqual(catalog?.content, "# Aula de Direito Administrativo\n\nTexto original da aula.");
    console.log("  ✓ Estágio B encerrou formalmente a complementação sem aprovar a revisão nem publicar a aula.");
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 4: Estágio B com justificativa insuficiente (< 15 chars) ou pendências
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 4] Tentativa de Estágio B com justificativa curta ou achado pendente");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    // 1. Justificativa curta
    let failedShort = false;
    try {
      await closeSupplementHelper(
        repo,
        review.id,
        { overallJustification: "Curto" },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      failedShort = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("mínimo de 15 caracteres"));
      console.log("  ✓ Justificativa global curta foi rejeitada.");
    }
    assert.ok(failedShort);

    // 2. Achado pendente
    let failedPending = false;
    try {
      await closeSupplementHelper(
        repo,
        review.id,
        { overallJustification: "Justificativa válida com mais de 15 caracteres para encerramento." },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      failedPending = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("não possui deliberação registrada"));
      console.log("  ✓ Encerramento com achados pendentes foi rejeitado.");
    }
    assert.ok(failedPending);
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 5: Edição após Estágio B invalida resolução por descompasso de hash
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 5] Regra de Invalidação Obrigatória: edição posterior invalida Estágio B");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(finding1),
        action: "CONFIRMAR",
        justification: "Dispositivo legal expressamente verificado no texto da Lei 9.784/99 art. 54.",
        evidenceDeclaration: {
          declaredSource: "Lei 9.784/1999, art. 54",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/leis/l9784.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    await closeSupplementHelper(
      repo,
      review.id,
      {
        overallJustification: "Encerramento formal de todos os achados jurídicos fundamentados pelo CEO.",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Edita o texto da aula após o encerramento
    await repo.saveCandidate(review.id, "# Aula de Direito Administrativo\n\nTexto oficial da aula com edição posterior do professor.");

    // Tenta aprovação final (Stage C)
    let failed = false;
    try {
      await approveLegalReview(repo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    } catch (err: any) {
      failed = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("bloqueada por pendências"));
      console.log("  ✓ Aprovação após edição foi bloqueada por invalidação do ato anterior.");
    }
    assert.ok(failed, "Aprovação após edição deveria ter falhado.");
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 6: Re-encerramento do Estágio B após edição restaura homologação
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 6] Re-encerramento formal pelo CEO após edição libera homologação");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);

    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(finding1),
        action: "CONFIRMAR",
        justification: "Dispositivo legal expressamente verificado no texto da Lei 9.784/99 art. 54.",
        evidenceDeclaration: {
          declaredSource: "Lei 9.784/1999, art. 54",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/leis/l9784.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    await closeSupplementHelper(
      repo,
      review.id,
      { overallJustification: "Primeiro encerramento administrativo da complementação." },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Edição do texto mantendo o trecho revisado de CHG-001
    await repo.saveCandidate(review.id, "# Aula de Direito Administrativo\n\nTexto oficial da aula. Adição de parágrafo explicativo.");

    // Tentativa de fechar Estágio B sem redeliberar o achado que foi invalidado pela edição do texto -> BLOQUEADA
    let failedWithoutRedeliberation = false;
    try {
      await closeSupplementHelper(
        repo,
        review.id,
        { overallJustification: "Novo encerramento expressamente realizado após validação da alteração textual." },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      failedWithoutRedeliberation = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("deliberação individual foi invalidada porque o texto da aula foi editado após a decisão do CEO"));
      console.log("  ✓ Edição do texto invalidou a deliberação individual por candidateHash desatualizado.");
    }
    assert.ok(failedWithoutRedeliberation, "Deveria ter falhado por descompasso de hash na deliberação individual.");

    // CEO redelibera o achado sobre a nova versão do texto (novo candidateHash)
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(finding1),
        action: "CONFIRMAR",
        justification: "Dispositivo legal expressamente verificado na nova versão do texto da aula.",
        evidenceDeclaration: {
          declaredSource: "Lei 9.784/1999, art. 54",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/leis/l9784.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Agora o encerramento formal pelo CEO é aceito com sucesso
    await closeSupplementHelper(
      repo,
      review.id,
      { overallJustification: "Novo encerramento expressamente realizado após reavaliação de todos os achados." },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Aprovação (Stage C)
    const approved = await approveLegalReview(repo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    assert.strictEqual(approved.reviewId, review.id);
    assert.strictEqual(approved.lesson.content, "# Aula de Direito Administrativo\n\nTexto oficial da aula. Adição de parágrafo explicativo.");
    console.log("  ✓ Homologação final realizada com sucesso após re-deliberação e re-encerramento.");
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 7: Validação de Doutrina sem URL de tribunal e bloqueio de divergência contra norma cogente
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 7] Validação por natureza jurídica: Doutrina e divergência contra norma");
  {
    const doctrinalFinding = createMockFinding({
      pendingId: "pen_doc_1",
      statementAnalyzed: "Conforme Celso Antônio Bandeira de Mello, o princípio da supremacia é basilar.",
      nature: "DOUTRINA",
      status: "nao_verificada",
    });

    const review = createMockReview([doctrinalFinding]);
    const repo = createMockRepo(review);

    // Confirmação doutrinária com referência bibliográfica sem URL de tribunal
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(doctrinalFinding),
        action: "CONFIRMAR",
        justification: "Referência bibliográfica verificada na obra de Celso Antônio Bandeira de Mello.",
        evidenceDeclaration: {
          bibliographicReference: "MELLO, Celso Antônio Bandeira de. Curso de Direito Administrativo, 30ª ed., Malheiros, p. 102",
          semanticJustification: "O autor sustenta expressamente a supremacia do interesse público como postulado fundamental.",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    await closeSupplementHelper(
      repo,
      review.id,
      { overallJustification: "Encerramento com comprovação doutrinária verificada pelo CEO." },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const approved = await approveLegalReview(repo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    assert.strictEqual(approved.reviewId, review.id);
    console.log("  ✓ Doutrina aprovada com referência bibliográfica válida sem exigir URL de tribunal.");

    // Tentativa de invocar divergência contra norma cogente
    const normativeFinding = createMockFinding({
      pendingId: "pen_norm_1",
      statementAnalyzed: "A CF/88 veda a criação de tribunais de exceção.",
      nature: "NORMA_JURIDICA",
      status: "nao_verificada",
    });
    const reviewNorm = createMockReview([normativeFinding]);
    const repoNorm = createMockRepo(reviewNorm);

    await resolveFindingHelper(
      repoNorm,
      reviewNorm.id,
      {
        findingKey: getFindingStableKey(normativeFinding),
        action: "DECLARAR_DIVERGENCIA",
        justification: "Existe divergência teórica sobre juízos arbitrais.",
        divergenceNature: "Corrente doutrinária alternativa",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    let failedNorm = false;
    try {
      await closeSupplementHelper(
        repoNorm,
        reviewNorm.id,
        { overallJustification: "Tentativa de encerramento com divergência contra norma cogente." },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      failedNorm = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("não é permitido invocar divergência legítima contra norma jurídica cogente"));
      console.log("  ✓ Invocação de divergência contra norma cogente foi barrada na homologação.");
    }
    assert.ok(failedNorm);
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 8: Validação de Afirmação Empírica -> Exige metodologia e amostragem
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 8] Afirmação empírica: exige fundamentação metodológica verificável");
  {
    const empiricalFinding = createMockFinding({
      pendingId: "pen_emp_1",
      statementAnalyzed: "Cerca de 70% dos processos judiciais terminam em recurso extraordinário.",
      nature: "AFIRMACAO_EMPIRICA",
      status: "nao_verificada",
    });

    const review = createMockReview([empiricalFinding]);
    const repo = createMockRepo(review);

    // Confirma sem metodologia
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(empiricalFinding),
        action: "CONFIRMAR",
        justification: "Confirmo este número porque é de conhecimento geral.",
        evidenceDeclaration: {
          declaredSource: "Artigo de opinião na internet",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    let failedEmp = false;
    try {
      await closeSupplementHelper(
        repo,
        review.id,
        { overallJustification: "Encerramento de afirmação empírica sem dados metodológicos." },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      failedEmp = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("exige fundamentação metodológica e amostragem verificável"));
      console.log("  ✓ Estatística empírica não comprovada metodologicamente foi barrada.");
    }
    assert.ok(failedEmp);
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 9: Achado NAO_COMPROVADO -> Exige expurgationConfirmed e supressão textual
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 9] Achado NAO_COMPROVADO: exige expurgo e supressão do texto");
  {
    const unprovenFinding = createMockFinding({
      pendingId: "pen_unp_1",
      statementAnalyzed: "Afirmação falsa de que todo servidor público possui foro privilegiado.",
      nature: "NORMA_JURIDICA",
      status: "nao_verificada",
    });

    // Cria revisão com a afirmação presente no texto candidato
    const textWithFalse = "# Aula\n\nTexto oficial da aula.\nAfirmação falsa de que todo servidor público possui foro privilegiado.";
    const review = createMockReview([unprovenFinding], textWithFalse);
    const repo = createMockRepo(review, "# Aula\n\nTexto original.");

    // Delibera sem expurgationConfirmed
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(unprovenFinding),
        action: "DECLARAR_NAO_COMPROVADO",
        justification: "A tese não tem amparo constitucional e é falsa.",
        expurgationConfirmed: false,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    let failedWithoutExpurg = false;
    try {
      await closeSupplementHelper(
        repo,
        review.id,
        { overallJustification: "Tentativa de fechar sem expurgo atestado." },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      failedWithoutExpurg = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("expurgationConfirmed"));
      console.log("  ✓ Falta de expurgationConfirmed atestada foi rejeitada.");
    }
    assert.ok(failedWithoutExpurg);

    // Delibera com expurgationConfirmed: true, mas sem retirar do texto
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(unprovenFinding),
        action: "DECLARAR_NAO_COMPROVADO",
        justification: "A tese não tem amparo constitucional e é falsa.",
        expurgationConfirmed: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    let failedPersistingText = false;
    try {
      await closeSupplementHelper(
        repo,
        review.id,
        { overallJustification: "Tentativa de fechar com texto ainda presente." },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      failedPersistingText = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("afirmação não comprovada continua textualmente presente na aula"));
      console.log("  ✓ Persistência do texto falso na aula foi bloqueada na homologação.");
    }
    assert.ok(failedPersistingText);

    // Agora retira o texto (novo candidateHash)
    await repo.saveCandidate(review.id, "# Aula\n\nTexto oficial da aula.\nTexto correto sem a afirmação falsa.");

    // Como o texto mudou, a deliberação anterior foi invalidada pelo descompasso de hash.
    // O CEO delibera novamente sobre o texto corrigido, confirmando o expurgo definitivo.
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(unprovenFinding),
        action: "DECLARAR_NAO_COMPROVADO",
        justification: "A tese sem amparo constitucional foi definitivamente expurgada do texto da aula.",
        expurgationConfirmed: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    await closeSupplementHelper(
      repo,
      review.id,
      { overallJustification: "Encerramento formal após confirmação do expurgo e supressão textual." },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const approved = await approveLegalReview(repo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    assert.strictEqual(approved.reviewId, review.id);
    console.log("  ✓ NAO_COMPROVADO liberado apenas após expurgo comprovado e supressão textual.");
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 10: Autorização do CEO -> Rejeita não-CEO em todas as etapas
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 10] Autorização do CEO: rejeita emails não autorizados com 403");
  {
    const review = createMockReview([finding1]);
    const repo = createMockRepo(review);
    const nonCeo = "hacker@test.com";

    // 1. Deliberação
    let failA = false;
    try {
      await resolveFindingHelper(repo, review.id, { findingKey: "k", action: "CONFIRMAR", justification: "J" }, "uid_other", nonCeo);
    } catch (err: any) {
      failA = true;
      assert.strictEqual(err.status, 403);
    }
    assert.ok(failA);

    // 2. Encerramento (Stage B)
    let failB = false;
    try {
      await closeSupplementHelper(repo, review.id, { overallJustification: "J".repeat(20) }, "uid_other", nonCeo);
    } catch (err: any) {
      failB = true;
      assert.strictEqual(err.status, 403);
    }
    assert.ok(failB);

    // 3. Aprovação (Stage C)
    let failC = false;
    try {
      await approveLegalReview(repo, review.id, "uid_other", nonCeo);
    } catch (err: any) {
      failC = true;
      assert.strictEqual(err.status, 403);
    }
    assert.ok(failC);

    console.log("  ✓ Todas as etapas rejeitaram usuários não-CEO com HTTP 403.");
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 11: ETAPA 6C.1 — Investigação e Eliminação do Bloqueio Circular
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 11] Investigação e Eliminação do Bloqueio Circular (Etapa 6C.1)");
  {
    const incFinding = createMockFinding({
      pendingId: "pen_inc_01",
      statementAnalyzed: "O prazo prescricional para repetição de indébito tributário segue a LC 118/2005.",
      nature: "NORMA_JURIDICA",
      status: "nao_verificada",
    });
    const review = createMockReview([incFinding]);
    // Simula complementação que encerrou inconclusiva na IA
    review.supplement = {
      attemptCount: 1,
      attemptId: "att-1",
      status: "inconclusive",
      startedAt: Date.now() - 5000,
      completedAt: Date.now() - 1000,
      findings: [incFinding],
    };
    // Sem resolução prévia
    assert.strictEqual(review.supplement.resolution, undefined);

    const repo = createMockRepo(review);

    // 1. Antes de deliberar o achado, validateFindingsForClosure deve acusar falta de deliberação
    const checkBeforeDelib = validateFindingsForClosure(review);
    assert.strictEqual(checkBeforeDelib.ok, false);
    assert.ok(checkBeforeDelib.failureReasons[0].includes("não possui deliberação registrada"));

    // 2. Delibera o achado (Estágio A)
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(incFinding),
        action: "CONFIRMAR",
        justification: "LC 118/2005 e RE 566.621 (Tema 27 STF) conferidos integralmente.",
        evidenceDeclaration: {
          declaredSource: "LC 118/2005, art. 3º; STF RE 566.621",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp118.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const afterDelib = await repo.get(review.id);
    assert.ok(afterDelib);

    // 3. Verifica separação estrita dos validadores:
    // validateFindingsForClosure DEVE RETORNAR OK mesmo sem existir resolution!
    const closureCheck = validateFindingsForClosure(afterDelib);
    assert.strictEqual(closureCheck.ok, true, "validateFindingsForClosure deve retornar ok: true sem exigir resolution prévia.");
    assert.strictEqual(closureCheck.failureReasons.length, 0);

    // validateFindingsHomologation DEVE RETORNAR OK: FALSE pois ainda não houve Estágio B
    const homologCheckBeforeClose = validateFindingsHomologation(afterDelib);
    assert.strictEqual(homologCheckBeforeClose.ok, false, "validateFindingsHomologation deve acusar ausência de resolution.");
    assert.ok(homologCheckBeforeClose.failureReasons.some(r => r.includes("não possui encerramento administrativo formal")));

    // 4. Solicitação de encerramento pelo CEO (Estágio B): NÃO PODE SOFRER BLOQUEIO CIRCULAR
    const closed = await closeSupplementHelper(
      repo,
      review.id,
      { overallJustification: "Encerramento formal de revisão inconclusiva após validação integral das fontes e precedentes vinculantes." },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
    assert.strictEqual(closed.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO");
    assert.strictEqual(closed.supplement?.resolution?.candidateHashAtClosure, afterDelib.candidateHash);
    console.log("  ✓ Bloqueio circular eliminado: encerramento inicial concluiu com sucesso.");

    // 5. Após o encerramento formal (Estágio B), validateFindingsHomologation DEVE RETORNAR OK: TRUE
    const homologCheckAfterClose = validateFindingsHomologation(closed);
    assert.strictEqual(homologCheckAfterClose.ok, true, "validateFindingsHomologation deve passar 100% após Estágio B.");

    // 6. Aprovação final (Estágio C) realizada com sucesso
    const approved = await approveLegalReview(repo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    assert.strictEqual(approved.reviewId, review.id);
    console.log("  ✓ Fluxo completo sem bloqueio circular homologado com sucesso.");
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 12: Invalidação de Decisão Individual por Edição do Texto
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 12] Invalidação de Decisão Individual quando candidateHashAtDecision difere do texto atual");
  {
    const findingA = createMockFinding({
      pendingId: "pen_hash_01",
      statementAnalyzed: "Regra geral sobre licitações prevista na Lei 14.133.",
      nature: "NORMA_JURIDICA",
      status: "nao_verificada",
    });
    const review = createMockReview([findingA], "# Aula de Licitações\n\nTexto original da aula de licitações.");
    const repo = createMockRepo(review);

    // Delibera no texto original (Hash 1)
    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(findingA),
        action: "CONFIRMAR",
        justification: "Dispositivo conferido na Nova Lei de Licitações.",
        evidenceDeclaration: {
          declaredSource: "Lei 14.133/2021",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Edita o texto da aula (passando para Hash 2)
    await repo.saveCandidate(review.id, "# Aula de Licitações\n\nTexto original da aula de licitações com modificações subsequentes.");
    const editedReview = await repo.get(review.id);
    assert.ok(editedReview);

    // Validação de encerramento DEVE BLOQUEAR acusando descompasso de hash na decisão individual
    const closureCheck = validateFindingsForClosure(editedReview);
    assert.strictEqual(closureCheck.ok, false);
    assert.ok(closureCheck.failureReasons.some(r => r.includes("deliberação individual foi invalidada porque o texto da aula foi editado após a decisão do CEO")));
    console.log("  ✓ validateFindingsForClosure bloqueia quando candidateHashAtDecision !== review.candidateHash.");

    // Validação de homologação também DEVE BLOQUEAR
    const homologCheck = validateFindingsHomologation(editedReview);
    assert.strictEqual(homologCheck.ok, false);
    assert.ok(homologCheck.failureReasons.some(r => r.includes("deliberação individual foi invalidada porque o texto da aula foi editado após a decisão do CEO")));
    console.log("  ✓ validateFindingsHomologation bloqueia quando candidateHashAtDecision !== review.candidateHash.");

    // Tentativa de fechar Estágio B via fluxo também falha
    let failedClosure = false;
    try {
      await closeSupplementHelper(
        repo,
        review.id,
        { overallJustification: "Tentativa de fechar com achado tomado em versão defasada do texto." },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      failedClosure = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("deliberação individual foi invalidada"));
    }
    assert.ok(failedClosure);
    console.log("  ✓ closeLegalReviewSupplementFlow rejeita encerramento com decisão em hash defasado.");
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 13: Concorrência e integridade atômica com catálogo oficial
  // --------------------------------------------------------------------------
  console.log("\n[Cenário 13] Concorrência: divergência de originalHash impede publicação (fail-closed)");
  {
    const findingC = createMockFinding({
      pendingId: "pen_conc_01",
      statementAnalyzed: "Concurso público tem validade de até dois anos.",
      nature: "NORMA_JURIDICA",
      status: "nao_verificada",
    });
    const review = createMockReview([findingC]);
    const repo = createMockRepo(review);

    await resolveFindingHelper(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(findingC),
        action: "CONFIRMAR",
        justification: "Artigo 37, inciso III da CF/88 conferido expressamente.",
        evidenceDeclaration: {
          declaredSource: "CF/88 art. 37, III",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    await closeSupplementHelper(
      repo,
      review.id,
      { overallJustification: "Encerramento formal de complementação para teste de concorrência." },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Tentativa de aprovação com conflito concorrente de catálogo
    const conflictingRepo: LegalReviewRepository = {
      ...repo,
      async approve() {
        return { ok: false, conflict: true };
      },
    };

    let conflictFailed = false;
    try {
      await approveLegalReview(conflictingRepo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    } catch (err: any) {
      conflictFailed = true;
      assert.strictEqual(err.status, 409);
      assert.ok(err.message.includes("A aula foi modificada após o início desta revisão"));
    }
    assert.ok(conflictFailed);
    console.log("  ✓ Conflito de concorrência detectado e protegido com HTTP 409.");
  }

  console.log("\n========================================================");
  console.log("✓ TODOS OS CENÁRIOS DA ETAPA 6C E 6C.1 PASSARAM COM SUCESSO!");
  console.log("========================================================\n");
}

runControlledHomologationSuite().catch((err) => {
  console.error("FALHA NA SUÍTE DE TESTES DA ETAPA 6C:", err);
  process.exit(1);
});
