/**
 * ATHENA — ETAPA 6F: TESTES ADVERSARIAIS DE TRAVAS OPERACIONAIS (FAIL-CLOSED)
 * E VALIDAÇÃO DE CONCORRÊNCIA, AUTORIZAÇÃO E SEGURANÇA EM AMBIENTE ISOLADO.
 *
 * RESTRIÇÕES ABSOLUTAS:
 * - 100% OFFLINE / ZERO NETWORK / ZERO FIRESTORE WRITES EM PRODUÇÃO
 * - ZERO CHAMADAS A MODELOS EXTERNOS (GEMINI/OPENAI)
 * - ZERO DEPLOY / COMMIT / PUSH
 */

import assert from "node:assert/strict";
import {
  LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE,
  getLegalReviewOperationalFlags,
  type HumanFindingDecision,
  type LegalReviewView,
  type StoredCatalogLesson,
  type SupplementFindingItem,
} from "../src/lib/legalReviewTypes.js";
import {
  approveLegalReview,
  closeLegalReviewSupplementFlow,
  resolveHumanLegalReviewFinding,
} from "../src/services/legalReviewFlow.js";
import {
  LegalReviewError,
  hashCatalogSnapshot,
  hashLessonContent,
  type LegalReviewRepository,
} from "../src/services/legalReviewRepository.js";

const CEO_EMAIL = "jhonny.spider@gmail.com";
const NON_CEO_EMAIL = "aluno@projetoathena.app.br";

function createMockRepository(initialReview: LegalReviewView, initialLesson: StoredCatalogLesson): LegalReviewRepository {
  let reviewState = JSON.parse(JSON.stringify(initialReview)) as LegalReviewView;
  let lessonState = JSON.parse(JSON.stringify(initialLesson)) as StoredCatalogLesson;

  return {
    async getLesson(id: string) {
      if (id === lessonState.id) return JSON.parse(JSON.stringify(lessonState));
      return null;
    },
    async getIndex() {
      return null;
    },
    async begin() {},
    async complete() {},
    async fail() {},
    async touchProcessing() {
      return true;
    },
    async get(id: string) {
      if (id === reviewState.id) return JSON.parse(JSON.stringify(reviewState));
      return null;
    },
    async saveCandidate(_id: string, markdown: string) {
      reviewState.reviewedMarkdown = markdown;
      reviewState.candidateHash = hashLessonContent(markdown);
      return JSON.parse(JSON.stringify(reviewState));
    },
    async saveFindingDecision(_reviewId: string, findingDecision: HumanFindingDecision, now: number) {
      const flags = getLegalReviewOperationalFlags();
      if (!flags.stageAEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE, 503);
      }
      const existing = reviewState.findingDecisions || {};
      reviewState.findingDecisions = {
        ...existing,
        [findingDecision.findingKey]: findingDecision,
      };
      return JSON.parse(JSON.stringify(reviewState));
    },
    async closeSupplementResolution(_reviewId: string, resolution: any, now: number) {
      const flags = getLegalReviewOperationalFlags();
      if (!flags.stageBEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE, 503);
      }
      if (!reviewState.supplement) {
        throw new LegalReviewError("Sem complementação", 404);
      }
      reviewState.supplement.resolution = resolution;
      return JSON.parse(JSON.stringify(reviewState));
    },
    async reject(_id: string, uid: string, now: number) {
      reviewState.status = "rejected";
      return JSON.parse(JSON.stringify(reviewState));
    },
    async approve(_reviewId: string, uid: string, email: string, now: number) {
      const flags = getLegalReviewOperationalFlags();
      if (!flags.stageCEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE, 503);
      }
      if (email !== CEO_EMAIL) {
        throw new LegalReviewError("Apenas o CEO pode aprovar", 403);
      }
      if (hashCatalogSnapshot(lessonState) !== reviewState.originalHash) {
        return { ok: false as const, conflict: true as const };
      }
      lessonState.content = reviewState.reviewedMarkdown;
      lessonState.approvedAt = now;
      lessonState.approvedBy = email;
      lessonState.version = (lessonState.version || 1) + 1;
      reviewState.status = "approved";
      return { ok: true as const, lesson: JSON.parse(JSON.stringify(lessonState)) };
    },
  };
}

function buildSyntheticBaseline() {
  const originalMarkdown = `# Processo Civil — Recursos Cíveis

O prazo geral do recurso de apelação no Código de Processo Civil é de 15 dias úteis.
A apelação possui efeito suspensivo automático como regra geral nos termos do art. 1.012 do CPC.
`;

  const lesson: StoredCatalogLesson = {
    id: "day_1_part_1",
    day: 1,
    part: 1,
    subject: "Direito Processual Civil",
    topic: "Teoria Geral dos Recursos",
    content: originalMarkdown,
    version: 1,
    approvedAt: 1720000000000,
    approvedBy: CEO_EMAIL,
  };

  const findings: SupplementFindingItem[] = [
    {
      pendingId: "chg_CHG-001",
      statementAnalyzed: "O prazo geral do recurso de apelação no Código de Processo Civil é de 15 dias úteis.",
      status: "nao_verificada",
      classification: "nao_verificada",
      officialSourceSearched: "STJ / CPC",
      officialEvidenceFound: "Prazo de 15 dias do art. 1.003, § 5º, do CPC",
      confidence: "ALTA",
      justification: "Texto legal claro pendente de confirmação do dispositivo exato.",
    },
  ];

  const review: LegalReviewView = {
    id: "rev_3d4deba9-0000-4000-8000-000000000001",
    lessonId: "day_1_part_1",
    day: 1,
    part: 1,
    subject: "Direito Processual Civil",
    topic: "Teoria Geral dos Recursos",
    originalHash: hashCatalogSnapshot(lesson),
    candidateHash: hashLessonContent(originalMarkdown),
    auditedCandidateHash: hashLessonContent(originalMarkdown),
    originalContent: originalMarkdown,
    reviewedMarkdown: originalMarkdown,
    changes: [],
    unverifiedClaims: [],
    verificationLevel: "VERIFICACAO_PARCIAL",
    confidence: "ALTA",
    outcome: "SEM_ALTERACOES_RELEVANTES",
    model: "gpt-5.4-preview",
    webSearchUsed: true,
    testMode: false,
    status: "pending_approval",
    editorialIntegrity: {
      passed: true,
      status: "EDITORIAL_REVIEW_SUCCESS",
      originalHash: hashLessonContent(originalMarkdown),
      candidateHash: hashLessonContent(originalMarkdown),
      problematicChanges: [],
      structuralDivergence: false,
    },
    supplement: {
      attemptCount: 1,
      attemptId: "att-synthetic-1",
      status: "inconclusive",
      startedAt: 1720000010000,
      completedAt: 1720000020000,
      requestedByUid: "uid_ceo",
      requestedByEmail: CEO_EMAIL,
      costEstimatedUsd: 0.02,
      tokensUsed: 1200,
      durationMs: 10000,
      targetedPendingItems: [],
      findings,
    },
  };

  return { lesson, review };
}

async function runAdversarialTestSuite() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 6F: TESTES ADVERSARIAIS DE TRAVAS OPERACIONAIS (FAIL-CLOSED)");
  console.log("MODO: 100% OFFLINE / ZERO PRODUCTION ACCESS / SINTÉTICO");
  console.log("================================================================================\n");

  // Salva estado original de env
  const origEnvA = process.env.LEGAL_REVIEW_STAGE_A_ENABLED;
  const origEnvB = process.env.LEGAL_REVIEW_STAGE_B_ENABLED;
  const origEnvC = process.env.LEGAL_REVIEW_STAGE_C_ENABLED;

  try {
    // -------------------------------------------------------------------------
    // CENÁRIO 1: Ausência total das três flags (Fail-Closed Default)
    // -------------------------------------------------------------------------
    delete process.env.LEGAL_REVIEW_STAGE_A_ENABLED;
    delete process.env.LEGAL_REVIEW_STAGE_B_ENABLED;
    delete process.env.LEGAL_REVIEW_STAGE_C_ENABLED;

    console.log("--- CENÁRIO 1: Ausência total das flags (Default Fail-Closed) ---");
    const flags1 = getLegalReviewOperationalFlags();
    assert.equal(flags1.stageAEnabled, false, "Estágio A deve ser false por padrão");
    assert.equal(flags1.stageBEnabled, false, "Estágio B deve ser false por padrão");
    assert.equal(flags1.stageCEnabled, false, "Estágio C deve ser false por padrão");

    const { lesson: l1, review: r1 } = buildSyntheticBaseline();
    const repo1 = createMockRepository(r1, l1);

    // Tentativa Estágio A deve falhar com 503
    await assert.rejects(
      async () => {
        await resolveHumanLegalReviewFinding(
          repo1,
          r1.id,
          {
            findingKey: "chg_CHG-001",
            action: "CONFIRMAR",
            justification: "O prazo de 15 dias está no art. 1003 do CPC.",
            expectedCandidateHash: r1.candidateHash || "",
            evidenceDeclaration: {
              declaredSource: "Código de Processo Civil",
              bibliographicReference: "Art. 1.003, § 5º",
              declaredExcerpt: "prazo de 15 dias",
              semanticJustification: "Comprova o prazo legal",
              documentaryVerified: true,
            },
          },
          "uid_ceo",
          CEO_EMAIL
        );
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503 && err.message.includes("LEGAL_REVIEW_STAGE_A_ENABLED=false"),
      "Estágio A sem flag deve retornar 503"
    );
    console.log("  [1.1] ✓ Estágio A bloqueado com 503 na ausência de flag.");

    // Tentativa Estágio B deve falhar com 503
    await assert.rejects(
      async () => {
        await closeLegalReviewSupplementFlow(
          repo1,
          r1.id,
          { overallJustification: "Encerramento formal de testes sem flags operacionais ativas." },
          "uid_ceo",
          CEO_EMAIL
        );
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503 && err.message.includes("LEGAL_REVIEW_STAGE_B_ENABLED=false"),
      "Estágio B sem flag deve retornar 503"
    );
    console.log("  [1.2] ✓ Estágio B bloqueado com 503 na ausência de flag.");

    // Tentativa Estágio C deve falhar com 503
    await assert.rejects(
      async () => {
        await approveLegalReview(repo1, r1.id, "uid_ceo", CEO_EMAIL);
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503 && err.message.includes("LEGAL_REVIEW_STAGE_C_ENABLED=false"),
      "Estágio C sem flag deve retornar 503"
    );
    console.log("  [1.3] ✓ Estágio C (Aprovação/Publicação) bloqueado com 503 na ausência de flag.\n");

    // -------------------------------------------------------------------------
    // CENÁRIO 2: Flags explicitamente definidas como "false"
    // -------------------------------------------------------------------------
    process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "false";
    process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "false";
    process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

    console.log("--- CENÁRIO 2: Flags explicitamente configuradas como 'false' ---");
    const flags2 = getLegalReviewOperationalFlags();
    assert.equal(flags2.stageAEnabled, false);
    assert.equal(flags2.stageBEnabled, false);
    assert.equal(flags2.stageCEnabled, false);

    const { lesson: l2, review: r2 } = buildSyntheticBaseline();
    const repo2 = createMockRepository(r2, l2);

    await assert.rejects(
      async () => {
        await approveLegalReview(repo2, r2.id, "uid_ceo", CEO_EMAIL);
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503,
      "Aprovação com flags explicitamente false deve ser recusada com 503"
    );
    console.log("  [2.1] ✓ Bloqueio 503 confirmado com flags explicitamente 'false'.\n");

    // -------------------------------------------------------------------------
    // CENÁRIO 3: Apenas Estágio A habilitado (Deliberação Individual)
    // -------------------------------------------------------------------------
    process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
    process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "false";
    process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

    console.log("--- CENÁRIO 3: Apenas Estágio A habilitado ---");
    const { lesson: l3, review: r3 } = buildSyntheticBaseline();
    const repo3 = createMockRepository(r3, l3);

    // Estágio A deve ter sucesso
    const updatedA = await resolveHumanLegalReviewFinding(
      repo3,
      r3.id,
      {
        findingKey: "chg_CHG-001",
        action: "CONFIRMAR",
        justification: "O prazo de 15 dias está fundamentado expressamente no CPC.",
        expectedCandidateHash: r3.candidateHash || "",
        evidenceDeclaration: {
          declaredSource: "Código de Processo Civil",
          bibliographicReference: "Art. 1.003, § 5º",
          declaredExcerpt: "prazo de 15 dias",
          semanticJustification: "Comprova o prazo legal",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      CEO_EMAIL
    );
    assert.ok(updatedA.findingDecisions?.["chg_CHG-001"]);
    console.log("  [3.1] ✓ Estágio A executado com sucesso (decisão persistida).");

    // Estágio B deve falhar com 503
    await assert.rejects(
      async () => {
        await closeLegalReviewSupplementFlow(
          repo3,
          r3.id,
          { overallJustification: "Tentando encerrar com B desabilitado." },
          "uid_ceo",
          CEO_EMAIL
        );
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503,
      "Estágio B deve falhar quando desabilitado"
    );
    console.log("  [3.2] ✓ Estágio B rejeitado com 503 conforme flag.");

    // Estágio C deve falhar com 503
    await assert.rejects(
      async () => {
        await approveLegalReview(repo3, r3.id, "uid_ceo", CEO_EMAIL);
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503,
      "Estágio C deve falhar quando desabilitado"
    );
    console.log("  [3.3] ✓ Estágio C rejeitado com 503 conforme flag.\n");

    // -------------------------------------------------------------------------
    // CENÁRIO 4: Estágios A e B habilitados; Estágio C DESABILITADO
    // -------------------------------------------------------------------------
    process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
    process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
    process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";

    console.log("--- CENÁRIO 4: Estágios A e B habilitados; Estágio C Desabilitado ---");
    const { lesson: l4, review: r4 } = buildSyntheticBaseline();
    const repo4 = createMockRepository(r4, l4);

    // Executa A
    await resolveHumanLegalReviewFinding(
      repo4,
      r4.id,
      {
        findingKey: "chg_CHG-001",
        action: "CONFIRMAR",
        justification: "Prazo legal comprovado com base no art. 1.003, § 5º, do CPC.",
        expectedCandidateHash: r4.candidateHash || "",
        evidenceDeclaration: {
          declaredSource: "Código de Processo Civil",
          bibliographicReference: "Art. 1.003, § 5º",
          declaredExcerpt: "prazo de 15 dias",
          semanticJustification: "Comprova o prazo legal",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      CEO_EMAIL
    );

    // Executa B
    const updatedB = await closeLegalReviewSupplementFlow(
      repo4,
      r4.id,
      { overallJustification: "Encerramento formal de complementação jurídica com todas as pendências resolvidas." },
      "uid_ceo",
      CEO_EMAIL
    );
    assert.equal(updatedB.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO");
    console.log("  [4.1] ✓ Estágios A e B concluídos com sucesso.");

    // Executa C -> DEVE SER BLOQUEADO COM 503 MESMO COM A E B VÁLIDOS!
    await assert.rejects(
      async () => {
        await approveLegalReview(repo4, r4.id, "uid_ceo", CEO_EMAIL);
      },
      (err: any) => err instanceof LegalReviewError && err.status === 503,
      "Aprovação final DEVE ser estritamente bloqueada quando STAGE_C_ENABLED=false"
    );
    // Assegura que o catálogo NÃO sofreu mutação
    const untouchedLesson = await repo4.getLesson(l4.id);
    assert.equal(untouchedLesson?.version, 1, "Versão da aula não deve ter sido alterada");
    assert.equal(untouchedLesson?.content, l4.content, "Conteúdo da aula deve permanecer inalterado");
    console.log("  [4.2] ✓ Publicação estritamente bloqueada; catálogo 100% íntegro e intocado.\n");

    // -------------------------------------------------------------------------
    // CENÁRIO 5: Todos habilitados (A, B, C) — Validações de Segurança
    // -------------------------------------------------------------------------
    process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
    process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
    process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "true";

    console.log("--- CENÁRIO 5: Todos habilitados — Validações Adversariais de Segurança ---");
    const { lesson: l5, review: r5 } = buildSyntheticBaseline();
    const repo5 = createMockRepository(r5, l5);

    // 5.1 Rejeição de Não-CEO em todos os estágios
    await assert.rejects(
      async () => {
        await resolveHumanLegalReviewFinding(
          repo5,
          r5.id,
          {
            findingKey: "chg_CHG-001",
            action: "CONFIRMAR",
            justification: "Tentativa de deliberação por aluno",
            expectedCandidateHash: r5.candidateHash || "",
            evidenceDeclaration: {
              declaredSource: "CPC",
              bibliographicReference: "Art. 1003",
              declaredExcerpt: "15 dias",
              semanticJustification: "justificativa do aluno",
              documentaryVerified: true,
            },
          },
          "uid_aluno",
          NON_CEO_EMAIL
        );
      },
      (err: any) => err instanceof LegalReviewError && err.status === 403,
      "Não-CEO deve receber 403 no Estágio A"
    );

    await assert.rejects(
      async () => {
        await closeLegalReviewSupplementFlow(
          repo5,
          r5.id,
          { overallJustification: "Tentativa de encerramento por aluno com caracteres suficientes." },
          "uid_aluno",
          NON_CEO_EMAIL
        );
      },
      (err: any) => err instanceof LegalReviewError && err.status === 403,
      "Não-CEO deve receber 403 no Estágio B"
    );

    await assert.rejects(
      async () => {
        await approveLegalReview(repo5, r5.id, "uid_aluno", NON_CEO_EMAIL);
      },
      (err: any) => err instanceof LegalReviewError && err.status === 403,
      "Não-CEO deve receber 403 no Estágio C"
    );
    console.log("  [5.1] ✓ Tentativas de usuário Não-CEO rejeitadas com HTTP 403 nos 3 estágios.");

    // 5.2 Bloqueio de Modo de Teste
    const { lesson: lTest, review: rTest } = buildSyntheticBaseline();
    rTest.testMode = true;
    const repoTest = createMockRepository(rTest, lTest);
    await assert.rejects(
      async () => {
        await approveLegalReview(repoTest, rTest.id, "uid_ceo", CEO_EMAIL);
      },
      (err: any) => err instanceof LegalReviewError && err.status === 403,
      "Modo de teste deve receber 403 na aprovação"
    );
    console.log("  [5.2] ✓ Revisão em modo de teste bloqueada contra publicação (HTTP 403).");

    // 5.3 Conflito de Hash no Catálogo (HTTP 409)
    const { lesson: lConflict, review: rConflict } = buildSyntheticBaseline();
    lConflict.content += "\nAdição concorrente de novo tópico antes da aprovação.";
    const repoConflict = createMockRepository(rConflict, lConflict);
    // Prepara A e B
    await resolveHumanLegalReviewFinding(
      repoConflict,
      rConflict.id,
      {
        findingKey: "chg_CHG-001",
        action: "CONFIRMAR",
        justification: "Prazo comprovado pelo CPC.",
        expectedCandidateHash: rConflict.candidateHash || "",
        evidenceDeclaration: {
          declaredSource: "CPC",
          bibliographicReference: "Art. 1.003",
          declaredExcerpt: "15 dias",
          semanticJustification: "prazo recursal",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      CEO_EMAIL
    );
    await closeLegalReviewSupplementFlow(
      repoConflict,
      rConflict.id,
      { overallJustification: "Encerramento formal de complementação válido." },
      "uid_ceo",
      CEO_EMAIL
    );
    await assert.rejects(
      async () => {
        await approveLegalReview(repoConflict, rConflict.id, "uid_ceo", CEO_EMAIL);
      },
      (err: any) => err instanceof LegalReviewError && err.status === 409,
      "Conflito de hash deve retornar 409"
    );
    console.log("  [5.3] ✓ Detecção de conflito de concorrência com o catálogo validada (HTTP 409).");

    // 5.4 Fluxo Legítimo Completo quando plenamente autorizado
    await resolveHumanLegalReviewFinding(
      repo5,
      r5.id,
      {
        findingKey: "chg_CHG-001",
        action: "CONFIRMAR",
        justification: "Prazo legal conferido e comprovado no texto do CPC pelo CEO.",
        expectedCandidateHash: r5.candidateHash || "",
        evidenceDeclaration: {
          declaredSource: "Código de Processo Civil",
          bibliographicReference: "Art. 1.003, § 5º",
          declaredExcerpt: "prazo de 15 dias",
          semanticJustification: "Comprova o prazo legal",
          documentaryVerified: true,
        },
      },
      "uid_ceo",
      CEO_EMAIL
    );
    await closeLegalReviewSupplementFlow(
      repo5,
      r5.id,
      { overallJustification: "Encerramento formal legítimo com todas as pendências resolvidas pelo CEO." },
      "uid_ceo",
      CEO_EMAIL
    );
    const approvedResult = await approveLegalReview(repo5, r5.id, "uid_ceo", CEO_EMAIL);
    assert.equal(approvedResult.lesson.version, 2);
    assert.equal(approvedResult.lesson.approvedBy, CEO_EMAIL);
    console.log("  [5.4] ✓ Fluxo integral concluído com sucesso e catálogo atualizado atomicamente para v2.\n");

    console.log("================================================================================");
    console.log("✓ TODOS OS TESTES ADVERSARIAIS DE TRAVAS OPERACIONAIS APROVADOS COM SUCESSO!");
    console.log("================================================================================");
  } finally {
    // Restaura o ambiente original rigorosamente
    if (origEnvA !== undefined) process.env.LEGAL_REVIEW_STAGE_A_ENABLED = origEnvA;
    else delete process.env.LEGAL_REVIEW_STAGE_A_ENABLED;

    if (origEnvB !== undefined) process.env.LEGAL_REVIEW_STAGE_B_ENABLED = origEnvB;
    else delete process.env.LEGAL_REVIEW_STAGE_B_ENABLED;

    if (origEnvC !== undefined) process.env.LEGAL_REVIEW_STAGE_C_ENABLED = origEnvC;
    else delete process.env.LEGAL_REVIEW_STAGE_C_ENABLED;
  }
}

runAdversarialTestSuite().catch((err) => {
  console.error("Falha na suíte adversarial:", err);
  process.exit(1);
});
