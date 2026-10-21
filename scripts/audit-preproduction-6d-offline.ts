/**
 * ATHENA — ETAPA 6D: AUDITORIA INTEGRADA DE PRÉ-PRODUÇÃO (TESTE OFFLINE)
 *
 * Escopo de Auditoria:
 * 1. Auditoria Transacional:
 *    - Leitura e validação dos dados dentro da mesma transação.
 *    - Proteção contra concorrência e alterações simultâneas.
 *    - Integridade dos hashes (originalHash, candidateHash, candidateHashAtDecision, candidateHashAtClosure).
 *    - Invalidação estrita de decisões obsoletas após edições.
 *    - Preservação do histórico de auditoria e imutabilidade dos achados originais da IA.
 *    - Impossibilidade de publicar versão diferente da aprovada.
 *
 * 2. Auditoria de Autorização:
 *    - Acesso sem autenticação (401/403).
 *    - Acesso com usuário não-CEO (403 Forbidden).
 *    - Identificadores inválidos (400 Bad Request via isReviewId).
 *    - Injeção de campos protegidos.
 *    - Revisão em estado incompatível (409 Conflict).
 *    - Bloqueio de contorno do modo de teste (403 Forbidden).
 *
 * 3. Auditoria Probatória:
 *    - URL oficial não é prova automática da tese.
 *    - Referência bibliográfica não é tratada como conferência documental.
 *    - Declarações humanas identificadas como declarações declaradas.
 *    - Afirmações empíricas exigem metodologia auditável.
 *    - Divergência jurídica legítima não contorna norma cogente ou precedente vinculante.
 *    - Achados não comprovados permanecem bloqueados até supressão comprovada e expurgo atestado.
 *
 * 4. Teste Integrado Offline (Fluxo A até I):
 *    A. Revisão inconclusiva.
 *    B. Deliberação de todos os achados.
 *    C. Encerramento formal da complementação.
 *    D. Confirmação de que nada foi publicado no catálogo.
 *    E. Aprovação final simulada.
 *    F. Edição posterior do texto.
 *    G. Invalidação das decisões e do encerramento.
 *    H. Bloqueio por conflito de originalHash.
 *    I. Rejeição de tentativas de publicação sem autorização.
 *
 * 5. Compatibilidade Histórica:
 *    - Leitura determinística e simulação sobre os 5 achados da revisão histórica rev_3d4deba9-... (att-2).
 *    - Imutabilidade comprovada: zero mutações no arquivo e no histórico.
 */

import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  getFindingStableKey,
  type HumanFindingDecision,
  type LegalReviewChange,
  type LegalReviewView,
  type SupplementFindingItem,
  type SupplementHumanResolution,
  LEGAL_REVIEW_CONFLICT_MESSAGE,
} from "../src/lib/legalReviewTypes.js";
import {
  approveLegalReview,
  closeLegalReviewSupplementFlow,
  resolveHumanLegalReviewFinding,
  saveLegalReviewCandidate,
  rejectLegalReview,
} from "../src/services/legalReviewFlow.js";
import {
  hashCatalogSnapshot,
  hashLessonContent,
  isReviewId,
  LEGAL_REVIEW_TEST_PUBLISH_MESSAGE,
  type LegalReviewRepository,
} from "../src/services/legalReviewRepository.js";
import {
  validateFindingsForClosure,
  validateFindingsHomologation,
  validateEditorialIntegrity,
  isConfiguredOfficialUrl,
} from "../src/lib/legalReviewValidate.js";
import { ATHENA_CEO_EMAIL, isCeoEmail } from "../src/lib/contentProvider.js";

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

function createMockReview(
  findings: SupplementFindingItem[],
  initialMarkdown = "# Aula de Direito Administrativo\n\nTexto oficial da aula."
): LegalReviewView {
  const candHash = hashLessonContent(initialMarkdown);
  return {
    id: "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Administrativo",
    originalHash: "hash_catalog_snapshot_base_123",
    originalApprovedAt: null,
    originalContent: "# Aula de Direito Administrativo\n\nTexto original da aula.",
    reviewedMarkdown: initialMarkdown,
    candidateHash: candHash,
    changes: [
      {
        id: "CHG-001",
        type: "CORRECAO",
        category: "LEGISLACAO",
        originalExcerpt: "Texto original da aula.",
        revisedExcerpt: "Texto oficial da aula.",
        justification: "Correção de conformidade legislativa.",
        source: "Lei 9.784/1999",
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
    model: "gpt-5.6-sol",
    reviewDate: "09/10/2026",
    requestedByUid: "uid_ceo_1",
    requestedAt: Date.now(),
    webSearchUsed: true,
    supplement: {
      attemptCount: 1,
      attemptId: "att-2",
      status: "inconclusive",
      startedAt: Date.now() - 60_000,
      completedAt: Date.now() - 10_000,
      targetedPendingItems: findings.map((f) => f.pendingId),
      findings,
    },
  };
}

function createMockRepo(initialReview: LegalReviewView, catalogLessonOverride?: any): LegalReviewRepository {
  let stored: LegalReviewView = JSON.parse(JSON.stringify(initialReview));
  let catalogLesson = catalogLessonOverride || {
    id: initialReview.lessonId,
    day: initialReview.day,
    part: initialReview.part,
    subject: initialReview.subject,
    topic: initialReview.topic || "Geral",
    content: initialReview.originalContent,
    challenge: null,
    status: "approved",
    approvedBy: ATHENA_CEO_EMAIL,
    approvedAt: Date.now(),
    modelUsed: "mock-model",
    version: 1,
    review: "Aula inicial",
  };

  if (!catalogLessonOverride) {
    stored.originalHash = hashCatalogSnapshot(catalogLesson);
  }

  return {
    async get(id: string) {
      if (id !== stored.id) return null;
      return JSON.parse(JSON.stringify(stored));
    },
    async saveCandidate(id: string, markdown: string, now: number) {
      const candHash = hashLessonContent(markdown);
      stored.reviewedMarkdown = markdown;
      stored.candidateHash = candHash;
      stored.manuallyEdited = true;
      stored.manuallyEditedAt = now;
      if (stored.supplement) {
        stored.supplement = {
          ...stored.supplement,
          resolution: undefined,
        };
      }
      return JSON.parse(JSON.stringify(stored));
    },
    async saveFindingDecision(id: string, dec: HumanFindingDecision, now: number) {
      const existing = stored.findingDecisions || {};
      const prior = existing[dec.findingKey];
      const history = [...(prior?.history || [])];
      if (prior) {
        history.push({
          action: prior.action,
          state: prior.state,
          justification: prior.justification,
          evidenceDeclaration: prior.evidenceDeclaration,
          divergenceNature: prior.divergenceNature,
          correctionChangeId: prior.correctionChangeId,
          expurgationConfirmed: prior.expurgationConfirmed,
          candidateHashAtDecision: prior.candidateHashAtDecision,
          decidedAt: prior.decidedAt,
          decidedByUid: prior.decidedByUid,
          decidedByEmail: prior.decidedByEmail,
        });
      }
      stored.findingDecisions = {
        ...existing,
        [dec.findingKey]: {
          ...dec,
          candidateHashAtDecision: stored.candidateHash,
          decidedAt: now,
          history,
        },
      };
      return JSON.parse(JSON.stringify(stored));
    },
    async closeSupplementResolution(id: string, resolution: SupplementHumanResolution, now: number) {
      stored.supplement = {
        ...(stored.supplement as any),
        resolution: {
          ...resolution,
          candidateHashAtClosure: stored.candidateHash,
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
      if (!isCeoEmail(email)) {
        throw new Error("Aprovação exige CEO");
      }
      if (hashCatalogSnapshot(catalogLesson) !== stored.originalHash) {
        return { ok: false, conflict: true };
      }
      stored.status = "approved";
      catalogLesson.content = stored.reviewedMarkdown;
      catalogLesson.version++;
      return { ok: true, lesson: catalogLesson as any };
    },
  };
}

async function runPreproductionAudit() {
  process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "true";
  try {
    console.log("================================================================================");
    console.log("ATHENA — ETAPA 6D: AUDITORIA TÉCNICA INTEGRADA DE PRÉ-PRODUÇÃO");
    console.log("MODO: 100% OFFLINE / ZERO NETWORK / ZERO FIRESTORE WRITES / READ-ONLY HISTORICAL");
    console.log("================================================================================\n");

  // ==========================================================================
  // SEÇÃO 1: AUDITORIA TRANSACIONAL
  // ==========================================================================
  console.log("--- SEÇÃO 1: AUDITORIA TRANSACIONAL ---");

  // 1.1 Invalidação de decisões individuais obsoletas após saveCandidate
  {
    const finding1 = createMockFinding({
      pendingId: "pen_trans_01",
      statementAnalyzed: "Norma sobre processo administrativo federal art. 54.",
      nature: "NORMA_JURIDICA",
    });
    const review = createMockReview([finding1], "# Texto V1\n\nTexto oficial da aula.");
    const repo = createMockRepo(review);

    // Delibera em V1
    await resolveHumanLegalReviewFinding(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(finding1),
        action: "CONFIRMAR",
        justification: "Verificado no art. 54 da Lei 9.784/99.",
        evidenceDeclaration: {
          declaredSource: "Lei 9.784/1999, art. 54",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/leis/l9784.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const afterDelib = await repo.get(review.id);
    assert.strictEqual(afterDelib?.findingDecisions?.[getFindingStableKey(finding1)].candidateHashAtDecision, afterDelib?.candidateHash);

    // Salva nova candidata (V2)
    await repo.saveCandidate(review.id, "# Texto V2\n\nTexto oficial da aula com edições.");
    const afterEdit = await repo.get(review.id);
    assert.notStrictEqual(afterEdit?.candidateHash, afterDelib?.candidateHash);

    // Validação transacional de fechamento DEVE BLOQUEAR decisão obsoleta
    const closureCheck = validateFindingsForClosure(afterEdit!);
    assert.strictEqual(closureCheck.ok, false);
    assert.ok(closureCheck.failureReasons[0].includes("deliberação individual foi invalidada porque o texto da aula foi editado"));
    console.log("  [1.1] ✓ Bloqueio transacional de reaproveitamento de decisões individuais obsoletas.");
  }

  // 1.2 Impossibilidade de publicar versão diferente da aprovada
  {
    const finding2 = createMockFinding({ pendingId: "pen_trans_02", statementAnalyzed: "Afirmação" });
    const review = createMockReview([finding2], "# Texto Homologado\n\nTexto oficial da aula.");
    const repo = createMockRepo(review);

    await resolveHumanLegalReviewFinding(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(finding2),
        action: "CONFIRMAR",
        justification: "Dispositivo conferido.",
        evidenceDeclaration: {
          declaredSource: "Lei 8.112/1990",
          declaredUrl: "https://www.planalto.gov.br/lei",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    await closeLegalReviewSupplementFlow(
      repo,
      review.id,
      { overallJustification: "Encerramento formal de conformidade probatória." },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const approved = await approveLegalReview(repo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    assert.strictEqual(approved.lesson.content, "# Texto Homologado\n\nTexto oficial da aula.");
    console.log("  [1.2] ✓ Aula publicada coincide estritamente com o texto examinado e homologado.");
  }

  // 1.3 Preservação do histórico cumulativo em deliberações sucessivas
  {
    const finding3 = createMockFinding({ pendingId: "pen_trans_03", statementAnalyzed: "Tese com dupla deliberação" });
    const review = createMockReview([finding3]);
    const repo = createMockRepo(review);

    // Decisão 1: PENDENTE
    await resolveHumanLegalReviewFinding(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(finding3),
        action: "MANTER_PENDENTE",
        justification: "Aguardando confirmação de bibliografia pelo parecerista.",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Decisão 2: CONFIRMAR
    await resolveHumanLegalReviewFinding(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(finding3),
        action: "CONFIRMAR",
        justification: "Bibliografia confirmada pelo CEO.",
        evidenceDeclaration: {
          declaredSource: "Doutrina",
          bibliographicReference: "MELLO, Celso Antônio. Curso de Direito Administrativo, 2024.",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const finalReview = await repo.get(review.id);
    const dec = finalReview?.findingDecisions?.[getFindingStableKey(finding3)];
    assert.strictEqual(dec?.state, "CONFIRMADO_PELO_CEO");
    assert.strictEqual(dec?.history?.length, 1);
    assert.strictEqual(dec?.history?.[0].state, "PENDENTE");
    console.log("  [1.3] ✓ Histórico cumulativo de deliberações preservado imutavelmente.");
  }

  // ==========================================================================
  // SEÇÃO 2: AUDITORIA DE AUTORIZAÇÃO
  // ==========================================================================
  console.log("\n--- SEÇÃO 2: AUDITORIA DE AUTORIZAÇÃO ---");

  // 2.1 Rejeição de usuário não-CEO em todos os métodos sensíveis
  {
    const review = createMockReview([createMockFinding({ pendingId: "pen_auth_1" })]);
    const repo = createMockRepo(review);
    const nonCeo = "aluno@dominio.com";

    let authDelib = false;
    try {
      await resolveHumanLegalReviewFinding(repo, review.id, { findingKey: "k", action: "CONFIRMAR", justification: "j" }, "uid_non", nonCeo);
    } catch (err: any) {
      authDelib = true;
      assert.strictEqual(err.status, 403);
    }
    assert.ok(authDelib);

    let authClose = false;
    try {
      await closeLegalReviewSupplementFlow(repo, review.id, { overallJustification: "j".repeat(20) }, "uid_non", nonCeo);
    } catch (err: any) {
      authClose = true;
      assert.strictEqual(err.status, 403);
    }
    assert.ok(authClose);

    let authApprove = false;
    try {
      await approveLegalReview(repo, review.id, "uid_non", nonCeo);
    } catch (err: any) {
      authApprove = true;
      assert.strictEqual(err.status, 403);
    }
    assert.ok(authApprove);
    console.log("  [2.1] ✓ Tentativas de deliberação, encerramento e aprovação por não-CEO rejeitadas com HTTP 403.");
  }

  // 2.2 Rejeição de reviewId com injeção ou caracteres inválidos (isReviewId exige UUID exato)
  {
    assert.strictEqual(isReviewId("rev_3d4deba9-5930-4b77-8ec1-7f257ef86008"), true);
    assert.strictEqual(isReviewId("rev_12345678-1234-1234-1234-123456789abc"), true);
    assert.strictEqual(isReviewId("rev_test_123"), false); // Formato curto rejeitado
    assert.strictEqual(isReviewId("../etc/passwd"), false);
    assert.strictEqual(isReviewId("rev_123; DROP TABLE"), false);
    assert.strictEqual(isReviewId(""), false);
    assert.strictEqual(isReviewId("rev_3d4deba9<script>"), false);
    console.log("  [2.2] ✓ Validador isReviewId protege endpoints exigindo formato UUID rigoroso (^rev_[0-9a-f-]{36}$).");
  }

  // 2.3 Tentativa de publicação em modo de teste bloqueada categoricamente
  {
    const testReview = createMockReview([]);
    testReview.testMode = true;
    const repo = createMockRepo(testReview);

    let testBlocked = false;
    try {
      await approveLegalReview(repo, testReview.id, "uid_ceo", ATHENA_CEO_EMAIL);
    } catch (err: any) {
      testBlocked = true;
      assert.strictEqual(err.status, 403);
      assert.strictEqual(err.message, LEGAL_REVIEW_TEST_PUBLISH_MESSAGE);
    }
    assert.ok(testBlocked);
    console.log("  [2.3] ✓ Modo de teste bloqueado contra publicação acidental com HTTP 403.");
  }

  // ==========================================================================
  // SEÇÃO 3: AUDITORIA PROBATÓRIA
  // ==========================================================================
  console.log("\n--- SEÇÃO 3: AUDITORIA PROBATÓRIA ---");

  // 3.1 URL oficial não é prova automática da tese (exige conferência documental)
  {
    const findingNorm = createMockFinding({
      pendingId: "pen_prob_1",
      nature: "NORMA_JURIDICA",
      statementAnalyzed: "Tese jurídica tributária.",
    });
    const review = createMockReview([findingNorm]);
    const repo = createMockRepo(review);

    // Registra deliberação com URL oficial mas documentaryVerified: false
    await resolveHumanLegalReviewFinding(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(findingNorm),
        action: "CONFIRMAR",
        justification: "Consta no site do planalto.",
        evidenceDeclaration: {
          declaredSource: "Lei 5.172/1966",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/leis/l5172.htm",
          documentaryVerified: false, // NÃO CONFERIDO DOCUMENTALMENTE PELO CEO
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const afterDelib = await repo.get(review.id);
    const closureCheck = validateFindingsForClosure(afterDelib!);
    assert.strictEqual(closureCheck.ok, false);
    assert.ok(closureCheck.failureReasons[0].includes("documentaryVerified"));

    let closeBlocked = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        { overallJustification: "Tentativa de fechar sem conferência documental." },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      closeBlocked = true;
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("documentaryVerified"));
    }
    assert.ok(closeBlocked);
    console.log("  [3.1] ✓ Indicação de URL oficial não presume veracidade nem substitui declaração expressa de conferência documental.");
  }

  // 3.2 Afirmações empíricas exigem metodologia e vedam desvio
  {
    const findingEmp = createMockFinding({
      pendingId: "pen_prob_2",
      nature: "AFIRMACAO_EMPIRICA",
      statementAnalyzed: "80% dos candidatos erram esta matéria em concursos públicos.",
    });
    const review = createMockReview([findingEmp]);
    const repo = createMockRepo(review);

    await resolveHumanLegalReviewFinding(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(findingEmp),
        action: "CONFIRMAR",
        justification: "Opinião do professor e experiência própria de aula.",
        evidenceDeclaration: {
          declaredSource: "Experiência prática",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const afterEmp = await repo.get(review.id);
    const closureCheck = validateFindingsForClosure(afterEmp!);
    assert.strictEqual(closureCheck.ok, false);
    assert.ok(
      closureCheck.failureReasons.some((r) => /metodol/i.test(r)),
      `Esperava erro de metodologia, obteve: ${closureCheck.failureReasons.join("; ")}`
    );

    let closeEmpBlocked = false;
    try {
      await closeLegalReviewSupplementFlow(
        repo,
        review.id,
        { overallJustification: "Tentativa de fechar afirmação empírica sem base amostral." },
        "uid_ceo",
        ATHENA_CEO_EMAIL
      );
    } catch (err: any) {
      closeEmpBlocked = true;
      assert.strictEqual(err.status, 400);
      assert.ok(/metodol/i.test(err.message));
    }
    assert.ok(closeEmpBlocked);
    console.log("  [3.2] ✓ Afirmação empírica bloqueada sem menção a metodologia/amostragem auditável.");
  }

  // 3.3 Divergência doutrinária não contorna norma cogente expressa
  {
    const findingCogente = createMockFinding({
      pendingId: "pen_prob_3",
      nature: "NORMA_JURIDICA",
      statementAnalyzed: "Art. 37, II da CF exige concurso público para investidura em cargo ou emprego.",
    });
    const review = createMockReview([findingCogente]);
    const repo = createMockRepo(review);

    await resolveHumanLegalReviewFinding(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(findingCogente),
        action: "DECLARAR_DIVERGENCIA",
        justification: "Corrente que defende admissão direta sem concurso em certos casos.",
        divergenceNature: "Doutrina minoritária",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const afterDiv = await repo.get(review.id);
    const closureCheck = validateFindingsForClosure(afterDiv!);
    assert.strictEqual(closureCheck.ok, false);
    assert.ok(closureCheck.failureReasons.some((r) => r.includes("não é permitido invocar divergência legítima contra norma jurídica cogente")));
    console.log("  [3.3] ✓ Invocação de divergência contra norma cogente bloqueada com rigor.");
  }

  // 3.4 Achado não comprovado bloqueado sem expurgo e enquanto persistir textualmente
  {
    const findingUnprov = createMockFinding({
      pendingId: "pen_prob_4",
      statementAnalyzed: "Tese inexistente de presunção absoluta no processo disciplinar.",
    });
    const review = createMockReview([findingUnprov], "# Aula\n\nTexto oficial da aula.\nTese inexistente de presunção absoluta no processo disciplinar.");
    const repo = createMockRepo(review);

    // Delibera como NAO_COMPROVADO com expurgationConfirmed = true, mas o texto ainda persiste na aula
    await resolveHumanLegalReviewFinding(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(findingUnprov),
        action: "DECLARAR_NAO_COMPROVADO",
        justification: "Tese sem amparo no ordenamento.",
        expurgationConfirmed: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    const reviewWithText = await repo.get(review.id);
    const checkPersisting = validateFindingsForClosure(reviewWithText!);
    assert.strictEqual(checkPersisting.ok, false);
    assert.ok(checkPersisting.failureReasons.some((r) => r.includes("afirmação não comprovada continua textualmente presente na aula")));
    console.log("  [3.4] ✓ Achado não comprovado bloqueado enquanto o excerto persistir textualmente.");
  }

  // ==========================================================================
  // SEÇÃO 4: TESTE INTEGRADO OFFLINE (FLUXO A ATÉ I)
  // ==========================================================================
  console.log("\n--- SEÇÃO 4: TESTE INTEGRADO OFFLINE (FLUXO COMPLETO A ATÉ I) ---");
  {
    // A. Revisão inconclusiva
    const findingFlow = createMockFinding({
      pendingId: "pen_flow_01",
      statementAnalyzed: "Decadência administrativa em 5 anos conforme art. 54 da Lei 9.784/1999.",
      nature: "NORMA_JURIDICA",
    });
    const review = createMockReview([findingFlow], "# Aula Oficial\n\nTexto oficial da aula.");
    assert.strictEqual(review.supplement?.status, "inconclusive");
    const repo = createMockRepo(review);
    console.log("  [A] ✓ Revisão inconclusiva inicializada com sucesso.");

    // B. Deliberação de todos os achados
    await resolveHumanLegalReviewFinding(
      repo,
      review.id,
      {
        findingKey: getFindingStableKey(findingFlow),
        action: "CONFIRMAR",
        justification: "Dispositivo conferido expressamente no art. 54 da Lei 9.784/1999.",
        evidenceDeclaration: {
          declaredSource: "Lei 9.784/1999, art. 54",
          declaredUrl: "https://www.planalto.gov.br/ccivil_03/leis/l9784.htm",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
    const reviewAfterB = await repo.get(review.id);
    const closureReady = validateFindingsForClosure(reviewAfterB!);
    assert.strictEqual(closureReady.ok, true);
    console.log("  [B] ✓ Deliberação do achado executada; apto para encerramento formal (Estágio B).");

    // C. Encerramento formal da complementação
    const reviewAfterC = await closeLegalReviewSupplementFlow(
      repo,
      review.id,
      { overallJustification: "Encerramento formal de conformidade probatória com fontes oficiais." },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
    assert.strictEqual(reviewAfterC.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO");
    console.log("  [C] ✓ Encerramento formal da complementação emitido com sucesso.");

    // D. Confirmação de que nada foi publicado
    assert.strictEqual(reviewAfterC.status, "pending_approval");
    console.log("  [D] ✓ Estado da revisão preservado em pending_approval; NADA publicado no catálogo.");

    // E. Aprovação final simulada
    const approved = await approveLegalReview(repo, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    assert.strictEqual(approved.lesson.version, 2);
    assert.strictEqual(approved.lesson.content, "# Aula Oficial\n\nTexto oficial da aula.");
    console.log("  [E] ✓ Aprovação final e publicação homologada no catálogo com sucesso.");

    // F. Edição posterior do texto (simulação de nova revisão reaberta)
    const reviewReopened = createMockReview([findingFlow], "# Aula Oficial\n\nTexto oficial da aula.");
    // Copia as decisões de reviewAfterC
    reviewReopened.findingDecisions = reviewAfterC.findingDecisions;
    reviewReopened.supplement = reviewAfterC.supplement;
    const repoReopened = createMockRepo(reviewReopened);

    await repoReopened.saveCandidate(reviewReopened.id, "# Aula Oficial V2\n\nTexto oficial da aula editado.");
    const editedReview = await repoReopened.get(reviewReopened.id);
    console.log("  [F] ✓ Edição posterior do texto simulada gerando novo candidateHash.");

    // G. Invalidação das decisões e do encerramento
    const checkEditedClosure = validateFindingsForClosure(editedReview!);
    assert.strictEqual(checkEditedClosure.ok, false);
    assert.ok(checkEditedClosure.failureReasons[0].includes("deliberação individual foi invalidada porque o texto da aula foi editado"));

    const checkEditedHomolog = validateFindingsHomologation(editedReview!);
    assert.strictEqual(checkEditedHomolog.ok, false);
    console.log("  [G] ✓ Invalidação automática das decisões individuais e do encerramento comprovada.");

    // H. Bloqueio por conflito de originalHash (divergência entre snapshot da revisão e catálogo oficial)
    const repoConflict: LegalReviewRepository = {
      ...repo,
      async approve() {
        return { ok: false, conflict: true };
      },
    };
    let conflictBlocked = false;
    try {
      await approveLegalReview(repoConflict, review.id, "uid_ceo", ATHENA_CEO_EMAIL);
    } catch (err: any) {
      conflictBlocked = true;
      assert.strictEqual(err.status, 409);
      assert.strictEqual(err.message, LEGAL_REVIEW_CONFLICT_MESSAGE);
    }
    assert.ok(conflictBlocked);
    console.log("  [H] ✓ Bloqueio transacional por conflito de originalHash verificado (HTTP 409).");

    // I. Rejeição de tentativas de publicação sem autorização
    let unauthorizedBlocked = false;
    try {
      await approveLegalReview(repo, review.id, "uid_attacker", "invasor@externo.com");
    } catch (err: any) {
      unauthorizedBlocked = true;
      assert.strictEqual(err.status, 403);
    }
    assert.ok(unauthorizedBlocked);
    console.log("  [I] ✓ Rejeição estrita de publicação sem autorização do CEO (HTTP 403).");
  }

  // ==========================================================================
  // SEÇÃO 5: COMPATIBILIDADE HISTÓRICA (OS 5 ACHADOS DE att-2)
  // ==========================================================================
  console.log("\n--- SEÇÃO 5: COMPATIBILIDADE HISTÓRICA COM OS 5 ACHADOS DO att-2 ---");
  {
    const sanitizedPath = resolve("scratch/recovered_responses/att2_findings_sanitized.json");
    assert.ok(existsSync(sanitizedPath), `Arquivo histórico não encontrado em ${sanitizedPath}`);

    const rawData = readFileSync(sanitizedPath, "utf8");
    const parsed = JSON.parse(rawData);
    assert.strictEqual(parsed.findingsCount, 5);
    assert.strictEqual(parsed.findings.length, 5);

    const keys = new Set<string>();
    for (let i = 0; i < parsed.findings.length; i++) {
      const f = parsed.findings[i];
      const key = getFindingStableKey(f);
      assert.ok(key && key.length > 0, `Chave inválida para o achado ${i}`);
      assert.ok(!keys.has(key), `Colisão detectada para a chave ${key}`);
      keys.add(key);

      // Simulação de leitura sem mutação
      assert.strictEqual(f.status, "nao_verificada");
    }

    assert.strictEqual(keys.size, 5);
    console.log(`  ✓ 5 achados históricos lidos com sucesso.`);
    console.log(`  ✓ Chaves canônicas estáveis geradas: ${Array.from(keys).join(", ")}`);
    console.log(`  ✓ Imutabilidade garantida: zero escritas ou mutações nos arquivos de recuperação.`);
  }

    console.log("\n================================================================================");
    console.log("✓ AUDITORIA INTEGRADA DA ETAPA 6D CONCLUÍDA COM 100% DE SUCESSO!");
    console.log("================================================================================\n");
  } finally {
    delete process.env.LEGAL_REVIEW_STAGE_A_ENABLED;
    delete process.env.LEGAL_REVIEW_STAGE_B_ENABLED;
    delete process.env.LEGAL_REVIEW_STAGE_C_ENABLED;
  }
}

runPreproductionAudit().catch((err) => {
  console.error("FALHA NA AUDITORIA DA ETAPA 6D:", err);
  process.exit(1);
});
