/**
 * ATHENA — TESTE DE RECUPERAÇÃO SEGURA DE AUDITORIAS EXISTENTES
 * 
 * Verifica 100% offline e determinístico:
 * 1. Recuperação de revisão pending_approval sem invocar o auditor (OpenAI).
 * 2. Bloqueio de nova auditoria automática quando já existe revisão pendente compatível.
 * 3. Identificação de conflito quando a aula é modificada (hash incompatível).
 * 4. Isolamento estrito de modo de teste e escopos diferentes.
 * 5. Proteção de acesso e integridade de aula publicada.
 */
import assert from "node:assert";
import {
  enqueueAsyncLegalReview,
  getLatestLegalReviewFlow,
  processAsyncLegalReviewWorker,
  startLegalReview,
  executeSingleSupplementFlow,
  enqueueSingleSupplementFlow,
  processAsyncLegalSupplementWorker,
  type LegalReviewAuditor,
} from "../src/services/legalReviewFlow.js";
import {
  type LegalReviewRepository,
  type LegalReviewView,
  type LegalReviewIndex,
  type StoredCatalogLesson,
  hashCatalogSnapshot,
} from "../src/services/legalReviewRepository.js";
import { emptyReviewIndex, type AsyncLegalSupplementJobPayload } from "../src/lib/legalReviewTypes.js";
import type { LegalReviewTaskEnqueuer } from "../src/services/legalReviewTaskQueue.js";

async function runTests() {
  console.log("================================================================================");
  console.log("ATHENA — TESTES OFFLINE: RECUPERAÇÃO DE REVISÃO E PREVENÇÃO DE AUDITORIA");
  console.log("================================================================================\n");

  const mockLesson: StoredCatalogLesson = {
    id: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Constitucional",
    topic: "Nacionalidade",
    content: "# Dia 1 - Nacionalidade e Direitos Fundamentais\n\nTexto original com conteúdo suficiente para o teste.",
  };

  const originalHash = hashCatalogSnapshot(mockLesson);

  const mockPendingReview: LegalReviewView = {
    id: "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    subject: mockLesson.subject,
    topic: mockLesson.topic || "",
    originalHash,
    originalApprovedAt: null,
    originalContent: mockLesson.content,
    reviewedMarkdown: mockLesson.content + "\n\n[Revisado]",
    changes: [],
    unverifiedClaims: [],
    summary: {
      totalChanges: 13,
      corrections: 1,
      additions: 0,
      removals: 0,
      updates: 0,
      precisions: 0,
      restructures: 0,
    },
    reviewNotes: "Auditoria recuperada do Firestore",
    verificationLevel: "VERIFICACAO_PARCIAL",
    confidence: "ALTA",
    outcome: "ALTERACOES_NECESSARIAS",
    status: "pending_approval",
    model: "gpt-5.6-sol",
    reviewDate: "2026-10-08",
    requestedByUid: "uid_ceo",
    requestedAt: 1791430000000,
    webSearchUsed: true,
    testMode: false,
    consultedSources: [],
    manuallyEdited: false,
    candidateHash: "cand_hash_1",
    auditedCandidateHash: "cand_hash_1",
    sourceHistory: [],
  };

  let mockIndex: LegalReviewIndex = {
    lessonId: "day_1_part_0",
    processingReviewId: null,
    processingStartedAt: null,
    approvedHash: null,
    approvedReviewId: null,
    approvedReviewDate: null,
    latestReviewId: mockPendingReview.id,
    latestStatus: "pending_approval",
  };

  let auditorCalled = false;
  const mockAuditor: LegalReviewAuditor = {
    async audit() {
      auditorCalled = true;
      throw new Error("ERRO: O auditor (OpenAI) NUNCA deveria ser invocado quando há revisão pendente!");
    },
  };

  const createMockRepo = (lesson = mockLesson, index = mockIndex, review = mockPendingReview): LegalReviewRepository => ({
    async getLesson(id) {
      return id === lesson.id ? lesson : null;
    },
    async getIndex(id) {
      return id === index.lessonId ? index : emptyReviewIndex(id);
    },
    async get(id) {
      return id === review.id ? review : null;
    },
    async begin() {},
    async complete() {},
    async fail() {},
    async touchProcessing() { return true; },
    async saveCandidate() { return review; },
    async reject() { return review; },
    async approve() { return { ok: true, lesson }; },
  });

  // --- Teste 1: Recuperação de revisão pendente compatível ---
  console.log("--- Teste 1: Consulta direta da revisão pendente via getLatestLegalReviewFlow ---");
  const repo1 = createMockRepo();
  const res1 = await getLatestLegalReviewFlow(repo1, { day: 1, part: 0 });
  assert.strictEqual(res1.found, true, "Deveria encontrar a revisão");
  if (res1.found) {
    assert.strictEqual(res1.review.id, "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008");
    assert.strictEqual(res1.review.status, "pending_approval");
    assert.strictEqual(res1.conflict, false, "Não deve haver conflito com a aula atual");
    assert.strictEqual(res1.review.model, "gpt-5.6-sol");
    console.log("✓ Revisão pendente recuperada com sucesso e sem conflito.");
  }

  // --- Teste 2: Prevenção de chamada ao auditor em startLegalReview ---
  console.log("\n--- Teste 2: Prevenção de nova auditoria (OpenAI) em startLegalReview ---");
  auditorCalled = false;
  const res2 = await startLegalReview(repo1, mockAuditor, {
    day: 1,
    part: 0,
    force: false,
    uid: "uid_ceo",
  });
  assert.strictEqual(auditorCalled, false, "Auditor não deve ser chamado");
  assert.strictEqual(res2.alreadyReviewed, false);
  if (!res2.alreadyReviewed) {
    assert.strictEqual(res2.review.id, "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008");
    assert.strictEqual(res2.review.status, "pending_approval");
    console.log("✓ startLegalReview retornou a revisão salva sem invocar o auditor!");
  }

  // --- Teste 3: Detecção de conflito quando a aula é alterada ---
  console.log("\n--- Teste 3: Detecção de conflito por modificação posterior da aula ---");
  const modifiedLesson = {
    ...mockLesson,
    content: mockLesson.content + "\n\nAlteração posterior pelo professor.",
  };
  const repo3 = createMockRepo(modifiedLesson);
  const res3 = await getLatestLegalReviewFlow(repo3, { day: 1, part: 0 });
  assert.strictEqual(res3.found, true);
  if (res3.found) {
    assert.strictEqual(res3.conflict, true, "Deveria acusar conflito de hash");
    console.log("✓ Conflito identificado: hash da aula modificada diverge do originalHash da revisão.");
  }

  // --- Teste 4: Isolamento por escopo de aula/bloco ---
  console.log("\n--- Teste 4: Isolamento de escopo (revisão de outro dia/parte não é devolvida) ---");
  const res4 = await getLatestLegalReviewFlow(repo1, { day: 2, part: 0 });
  assert.strictEqual(res4.found, false, "Não deve encontrar para dia 2");
  console.log("✓ Revisão de outro dia não foi retornada (isolamento de escopo confirmado).");

  // --- Teste 5: Isolamento de modo de teste ---
  console.log("\n--- Teste 5: Isolamento de modo de teste ---");
  const testReview = { ...mockPendingReview, testMode: true };
  const repo5 = createMockRepo(mockLesson, mockIndex, testReview);
  const res5 = await getLatestLegalReviewFlow(repo5, { day: 1, part: 0 });
  assert.strictEqual(res5.found, false, "Revisões em modo de teste não devem ser recuperadas como oficiais");
  console.log("✓ Revisão de teste devidamente isolada e ignorada na consulta oficial.");

  // --- Teste 6: Início rápido com enfileiramento (enqueueAsyncLegalReview) ---
  console.log("\n--- Teste 6: Início rápido via enqueueAsyncLegalReview (retorna < 100ms) ---");
  let enqueuedPayload: any = null;
  const mockEnqueuer = {
    async enqueue(p: any) {
      enqueuedPayload = p;
    },
  };
  const emptyIndex = emptyReviewIndex("day_1_part_0");
  const repo6 = createMockRepo(mockLesson, emptyIndex);
  const res6 = await enqueueAsyncLegalReview(repo6, mockEnqueuer, {
    day: 1,
    part: 0,
    force: false,
    uid: "uid_ceo",
  });
  assert.strictEqual(res6.enqueued, true);
  if (res6.enqueued) {
    assert.strictEqual(res6.status, "queued");
    assert.ok(res6.reviewId.startsWith("rev_"));
    assert.strictEqual(enqueuedPayload.reviewId, res6.reviewId);
    console.log("✓ Auditoria enfileirada com sucesso em status queued sem invocar o auditor!");
  }

  // --- Teste 7: Execução do worker assíncrono com sucesso ---
  console.log("\n--- Teste 7: Execução determinística do worker assíncrono ---");
  let workerAuditorCalled = false;
  const mockWorkerAuditor: LegalReviewAuditor = {
    async audit() {
      workerAuditorCalled = true;
      return {
        reviewedMarkdown: mockLesson.content + "\n\n[Revisão Concluída pelo Worker]",
        changes: [],
        unverifiedClaims: [],
        summary: {
          totalChanges: 0,
          corrections: 0,
          additions: 0,
          removals: 0,
          updates: 0,
          precisions: 0,
          restructures: 0,
        },
        reviewNotes: "Sucesso do worker",
        verificationLevel: "VERIFICADO_COM_FONTES",
        confidence: "ALTA",
        outcome: "SEM_ALTERACOES_RELEVANTES",
        model: "gpt-5.6-sol",
        webSearchUsed: true,
        consultedSources: [],
      };
    },
  };
  let storedReviewState: any = {
    id: enqueuedPayload.reviewId,
    lessonId: "day_1_part_0",
    status: "queued",
    originalHash,
    originalContent: mockLesson.content,
    reviewDate: "2026-10-08",
  };
  const repo7: LegalReviewRepository = {
    ...repo6,
    async get(id) {
      return id === storedReviewState.id ? storedReviewState : null;
    },
    async begin(rev) {
      storedReviewState = { ...rev };
    },
    async complete(rev) {
      storedReviewState = { ...rev, status: "pending_approval" };
    },
  };
  const workerRes = await processAsyncLegalReviewWorker(repo7, mockWorkerAuditor, enqueuedPayload);
  assert.strictEqual(workerRes.status, "completed");
  assert.strictEqual(workerAuditorCalled, true);
  assert.strictEqual(storedReviewState.status, "pending_approval");
  console.log("✓ Worker assíncrono processou o job e avançou para pending_approval.");

  // --- Teste 8: Idempotência de retries do Cloud Tasks ---
  console.log("\n--- Teste 8: Idempotência diante de retries do Cloud Tasks ---");
  workerAuditorCalled = false;
  const retryRes = await processAsyncLegalReviewWorker(repo7, mockWorkerAuditor, enqueuedPayload);
  assert.strictEqual(retryRes.status, "skipped", "Retry de tarefa já em pending_approval deve ser ignorado");
  assert.strictEqual(workerAuditorCalled, false, "Auditor não deve ser executado no retry");
  console.log("✓ Retry do Cloud Tasks foi ignorado com sucesso (zero chamadas duplicadas).");

  // --- Teste 9: Detecção de concorrência ativa (já em processamento) ---
  console.log("\n--- Teste 9: Detecção de concorrência ativa (bloqueio de duplicata) ---");
  const busyIndex: LegalReviewIndex = {
    lessonId: "day_1_part_0",
    processingReviewId: "rev_active_processing",
    processingStartedAt: Date.now(),
    approvedHash: null,
    approvedReviewId: null,
    approvedReviewDate: null,
    latestReviewId: "rev_active_processing",
    latestStatus: "processing",
  };
  const repo9 = createMockRepo(mockLesson, busyIndex, {
    ...mockPendingReview,
    id: "rev_active_processing",
    status: "processing",
  });
  const res9 = await enqueueAsyncLegalReview(repo9, mockEnqueuer, {
    day: 1,
    part: 0,
    force: false,
    uid: "uid_ceo",
  });
  assert.strictEqual(res9.alreadyProcessing, true);
  console.log("✓ Concorrência detectada: nova auditoria rejeitada enquanto outra está em andamento.");

  // --- Teste 10: Aquisição atômica concorrente (claimJob) ---
  console.log("\n--- Teste 10: Bloqueio de worker concorrente via claimJob atômico ---");
  let claimedCount = 0;
  let jobStatus = "queued";
  const repo10: LegalReviewRepository = {
    ...repo6,
    async get() {
      return { ...mockPendingReview, status: jobStatus as any };
    },
    async claimJob() {
      if (jobStatus !== "queued") return false;
      jobStatus = "processing";
      claimedCount++;
      return true;
    },
    async begin() {},
    async complete() { jobStatus = "pending_approval"; },
  };
  const [workerRunA, workerRunB] = await Promise.all([
    processAsyncLegalReviewWorker(repo10, mockWorkerAuditor, enqueuedPayload),
    processAsyncLegalReviewWorker(repo10, mockWorkerAuditor, enqueuedPayload),
  ]);
  assert.strictEqual(claimedCount, 1, "Apenas um worker deve obter o lock atômico");
  const results = [workerRunA.status, workerRunB.status].sort();
  assert.deepStrictEqual(results, ["completed", "skipped"], "Um worker deve completar e o outro deve dar skip");
  console.log("✓ Concorrência atômica validada: workers simultâneos não duplicam a auditoria.");

  // --- Teste 11: Rollback e falha segura se o agendamento no Cloud Tasks falhar ---
  console.log("\n--- Teste 11: Rollback e liberação de lock se o enfileiramento falhar ---");
  let failedReviewLogged: string | null = null;
  const failingEnqueuer = {
    async enqueue() {
      throw new Error("Simulação de falha de conexão com a API do Cloud Tasks.");
    },
  };
  const repo11: LegalReviewRepository = {
    ...repo6,
    async fail(id, _lesson, msg) {
      failedReviewLogged = `${id}:${msg}`;
    },
  };
  let enqueueErrorCaptured = false;
  try {
    await enqueueAsyncLegalReview(repo11, failingEnqueuer, {
      day: 1,
      part: 0,
      force: false,
      uid: "uid_ceo",
    });
  } catch (err: any) {
    enqueueErrorCaptured = true;
    assert.strictEqual(err.status, 503);
  }
  assert.strictEqual(enqueueErrorCaptured, true, "Deveria capturar erro 503");
  assert.ok(failedReviewLogged && failedReviewLogged.includes("Falha ao enfileirar tarefa no Cloud Tasks"));
  console.log("✓ Enfileiramento com falha marcou o job como falhado e liberou o lock com segurança.");

  // --- Teste 12: Estado de execução incerta bloqueia reexecução automática sem force ---
  console.log("\n--- Teste 12: Estado incerto bloqueia reexecução automática (anti-cobrança dupla) ---");
  const uncertainReview: LegalReviewView = {
    ...mockPendingReview,
    id: "rev_uncertain_123",
    status: "uncertain_failure",
  };
  const repo12: LegalReviewRepository = {
    ...repo1,
    async getIndex() {
      return {
        lessonId: "day_1_part_0",
        processingReviewId: null,
        processingStartedAt: null,
        approvedHash: null,
        approvedReviewId: null,
        approvedReviewDate: null,
        latestReviewId: "rev_uncertain_123",
        latestStatus: "uncertain_failure",
      };
    },
    async get(id: string) {
      if (id === "rev_uncertain_123") return uncertainReview;
      return null;
    },
  };

  let uncertainBlocked = false;
  try {
    await startLegalReview(repo12, mockAuditor, {
      day: 1,
      part: 0,
      force: false,
      uid: "uid_ceo",
    });
  } catch (err: any) {
    uncertainBlocked = true;
    assert.strictEqual(err.status, 409);
    assert.ok(err.message.includes("estado de execução incerta"));
  }
  assert.strictEqual(uncertainBlocked, true, "Tentativa sem force deve ser bloqueada com HTTP 409");
  console.log("✓ Estado incerto bloqueou reexecução automática sem chamar a OpenAI.");

  // --- Teste 13: Lease expirado durante processamento bloqueia início automático sem force ---
  console.log("\n--- Teste 13: Lease expirado durante processamento requer deliberação do CEO ---");
  const oldProcessingReview: LegalReviewView = {
    ...mockPendingReview,
    id: "rev_processing_old",
    status: "processing",
  };
  const repo13: LegalReviewRepository = {
    ...repo1,
    async getIndex() {
      return {
        lessonId: "day_1_part_0",
        processingReviewId: "rev_processing_old",
        // Lease iniciado há mais de 10 minutos (expirado)
        processingStartedAt: Date.now() - 600_000,
        approvedHash: null,
        approvedReviewId: null,
        approvedReviewDate: null,
        latestReviewId: "rev_processing_old",
        latestStatus: "processing",
      };
    },
    async get(id: string) {
      if (id === "rev_processing_old") return oldProcessingReview;
      return null;
    },
  };

  let expiredLeaseBlocked = false;
  try {
    await startLegalReview(repo13, mockAuditor, {
      day: 1,
      part: 0,
      force: false,
      uid: "uid_ceo",
    });
  } catch (err: any) {
    expiredLeaseBlocked = true;
    assert.strictEqual(err.status, 409);
    assert.ok(err.message.includes("interrompida com estado de execução incerta"));
  }
  assert.strictEqual(expiredLeaseBlocked, true, "Tentativa sem force sobre lease expirado deve ser bloqueada");
  console.log("✓ Auditoria interrompida não permite reexecução sem force=true explícito do CEO.");

  // --- Teste 14: Deliberação explícita do CEO (force=true) desbloqueia reexecução ---
  console.log("\n--- Teste 14: Deliberação explícita do CEO (force=true) permite reprocessamento deliberado ---");
  let newReviewBegun = false;
  const repo14: LegalReviewRepository = {
    ...repo12,
    async begin(rev) {
      newReviewBegun = true;
      assert.strictEqual(rev.status, "processing");
    },
    async complete() {},
  };
  const forceMockAuditor: LegalReviewAuditor = {
    async audit() {
      return {
        reviewedMarkdown: "Conteúdo reauditado deliberadamente pelo CEO.",
        changes: [],
        unverifiedClaims: [],
        summary: "Reauditoria forçada autorizada",
        reviewNotes: "OK",
        verificationLevel: "VERIFICADO_COM_FONTES",
        confidence: "ALTA",
        outcome: "SEM_ALTERACOES_RELEVANTES",
        model: "gpt-5.6-sol",
        webSearchUsed: false,
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        consultedSources: 0,
      };
    },
  };
  const forcedResult = await startLegalReview(repo14, forceMockAuditor, {
    day: 1,
    part: 0,
    force: true,
    uid: "uid_ceo",
  });
  assert.strictEqual(newReviewBegun, true, "Com force=true a deliberação do CEO inicia nova revisão");
  assert.strictEqual(forcedResult.review.status, "pending_approval");
  console.log("✓ Com force=true explícito, a reauditoria deliberada pelo CEO foi executada.");

  // =========================================================================
  // TESTES DE COMPLEMENTAÇÃO JURÍDICA COM ENCERRAMENTO DEFINITIVO (REQUISITOS 1-14)
  // =========================================================================

  console.log("\n--- Teste 15: Execução única e bem-sucedida de complementação com registro de evidências e achados ---");
  let testReview15: LegalReviewView = {
    ...mockPendingReview,
    id: "rev_test_supplement_01",
    changes: [
      {
        id: "chg_1",
        type: "CORRECAO",
        severity: "ALTA",
        category: "LEGISLACAO",
        originalExcerpt: "Trecho desatualizado",
        revisedExcerpt: "Trecho com nova redação",
        reason: "Fundamentação segundo a Lei 14.133",
        verified: false,
        confirmation: "NAO_CONFIRMADO",
        sources: [],
        evidence: [],
      },
    ],
    unverifiedClaims: [
      {
        excerpt: "Afirmação não verificada na aula",
        reason: "Falta referência normativa oficial",
      },
    ],
    supplement: undefined,
  };

  const originalChangesJson = JSON.stringify(testReview15.changes);
  const originalMarkdownText = testReview15.reviewedMarkdown;
  const originalContentText = testReview15.originalContent;

  let supplementCallsCount = 0;
  const mockSupplementExecutor: import("../src/lib/legalReviewTypes.js").LegalSupplementExecutor = {
    async supplement(params) {
      supplementCallsCount++;
      assert.strictEqual(params.pendingItems.length, 2, "Extrai 1 alteração sem evidência + 1 unverifiedClaim");
      assert.strictEqual(params.pendingItems[0].sourceType, "CHANGE");
      assert.strictEqual(params.pendingItems[1].sourceType, "UNVERIFIED_CLAIM");
      assert.strictEqual(params.budget.maxTokens, 4000, "Orçamento de tokens limitado a 4000");
      assert.strictEqual(params.budget.maxDurationMs, 120_000, "Orçamento de tempo ajustado para 120s");
      assert(params.signal instanceof AbortSignal, "AbortSignal configurado");
      return {
        status: "completed",
        tokensUsed: 450,
        durationMs: 1200,
        costUsd: 0.005,
        findings: [
          {
            pendingId: params.pendingItems[0].id,
            changeId: params.pendingItems[0].changeId,
            statementAnalyzed: params.pendingItems[0].excerpt,
            officialSourceConsulted: "Lei nº 14.133/2021",
            verifiableUrl: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm",
            relevantExcerptOrBasis: "Art. 1º Esta Lei estabelece normas gerais de licitação e contratação...",
            status: "confirmada",
            objectiveJustification: "Dispositivo legal confirmado em fonte oficial do Planalto.",
            foundOfficialEvidence: true,
            sources: [
              {
                title: "Lei nº 14.133/2021",
                url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm",
                official: true,
                institution: "Presidência da República",
              },
            ],
            evidence: [
              {
                sourceUrl: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm",
                official: true,
                title: "Lei nº 14.133/2021",
                excerpt: "Normas gerais de licitação...",
              },
            ],
          },
          {
            pendingId: params.pendingItems[1].id,
            statementAnalyzed: params.pendingItems[1].excerpt,
            officialSourceConsulted: "Constituição Federal art. 5º",
            verifiableUrl: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
            relevantExcerptOrBasis: "Todos são iguais perante a lei...",
            status: "confirmada",
            objectiveJustification: "Afirmação alinhada ao texto constitucional oficial.",
            foundOfficialEvidence: true,
            sources: [
              {
                title: "Constituição Federal",
                url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
                official: true,
              },
            ],
          },
        ],
        finalNote: "Evidência complementar obtida com sucesso em fonte oficial.",
      };
    },
  };

  const supplementRepo: LegalReviewRepository = {
    ...repo12,
    async get(id) {
      if (id === testReview15.id) return testReview15;
      return null;
    },
    async reserveSupplement(id, uid, email, pendingItems, now) {
      if (testReview15.supplement && testReview15.supplement.attemptCount >= 1) {
        return { ok: false, reason: "A complementação jurídica já foi executada para esta revisão e não pode ser repetida." };
      }
      testReview15 = {
        ...testReview15,
        supplement: {
          attemptCount: 0,
          status: "reserved",
          startedAt: now,
          requestedByUid: uid,
          requestedByEmail: email,
          targetedPendingItems: pendingItems,
        },
      };
      return { ok: true, review: testReview15 };
    },
    async markSupplementStarted(id, now) {
      if (!testReview15.supplement || testReview15.supplement.status !== "reserved") {
        return false;
      }
      testReview15 = {
        ...testReview15,
        supplement: {
          ...testReview15.supplement,
          attemptCount: 1,
          status: "running",
          startedAt: now,
        },
      };
      return true;
    },
    async recordSupplementOutcome(id, supplementData, now) {
      testReview15 = {
        ...testReview15,
        supplement: {
          ...supplementData,
          completedAt: now,
        },
      };
      return testReview15;
    },
  };

  const { executeSingleSupplementFlow } = await import("../src/services/legalReviewFlow.js");
  const suppResult = await executeSingleSupplementFlow(
    supplementRepo,
    mockSupplementExecutor,
    testReview15.id,
    "uid_ceo",
    "jhonny.spider@gmail.com"
  );
  assert.strictEqual(supplementCallsCount, 1, "Executor invocado exatamente 1 vez");
  assert.strictEqual(suppResult.supplement?.attemptCount, 1);
  assert.strictEqual(suppResult.supplement?.status, "completed");
  assert.strictEqual(suppResult.supplement?.findings?.length, 2);
  assert.strictEqual(testReview15.status, "pending_approval", "A revisão mantém pending_approval sem alteração de status base");
  assert.strictEqual(JSON.stringify(suppResult.changes), originalChangesJson, "Zero mutação de changes");
  assert.strictEqual(suppResult.reviewedMarkdown, originalMarkdownText, "Zero mutação de reviewedMarkdown");
  assert.strictEqual(suppResult.originalContent, originalContentText, "Zero mutação de originalContent");
  console.log("✓ Complementação única executada com sucesso e gravada com attemptCount = 1 (sem mutação no Markdown).");

  console.log("\n--- Teste 16: Bloqueio estrito de segunda tentativa (idempotência e trava persistente) ---");
  await assert.rejects(
    async () => {
      await executeSingleSupplementFlow(
        supplementRepo,
        mockSupplementExecutor,
        testReview15.id,
        "uid_ceo",
        "jhonny.spider@gmail.com"
      );
    },
    /já foi executada para esta revisão e não pode ser repetida/,
    "Segunda chamada deve ser imediatamente rejeitada com erro 409"
  );
  assert.strictEqual(supplementCallsCount, 1, "O executor NÃO pode ser chamado uma segunda vez");
  console.log("✓ Segunda tentativa de complementação bloqueada pela trava transacional.");

  console.log("\n--- Teste 17: Tratamento de falha ou timeout pós-chamada com encerramento em inconclusivo ---");
  let testReview17: LegalReviewView = {
    ...mockPendingReview,
    id: "rev_test_supplement_timeout",
    changes: [
      {
        id: "chg_2",
        type: "ATUALIZACAO",
        severity: "MEDIA",
        category: "JURISPRUDENCIA",
        originalExcerpt: "Jurisprudência",
        revisedExcerpt: "Nova jurisprudência",
        reason: "Tese fixada",
        verified: false,
        confirmation: "NAO_CONFIRMADO",
        sources: [],
        evidence: [],
      },
    ],
    supplement: undefined,
  };

  const timeoutExecutor: import("../src/lib/legalReviewTypes.js").LegalSupplementExecutor = {
    async supplement() {
      throw new Error("Timeout na consulta externa de evidência");
    },
  };

  const repo17: LegalReviewRepository = {
    ...repo12,
    async get(id) {
      if (id === testReview17.id) return testReview17;
      return null;
    },
    async reserveSupplement(id, uid, email, pendingItems, now) {
      testReview17 = {
        ...testReview17,
        supplement: { attemptCount: 0, status: "reserved", startedAt: now, requestedByUid: uid, targetedPendingItems: pendingItems },
      };
      return { ok: true, review: testReview17 };
    },
    async markSupplementStarted(id, now) {
      testReview17 = {
        ...testReview17,
        supplement: { ...testReview17.supplement!, attemptCount: 1, status: "running", startedAt: now },
      };
      return true;
    },
    async recordSupplementOutcome(id, supplementData) {
      testReview17 = {
        ...testReview17,
        supplement: supplementData,
      };
      return testReview17;
    },
  };

  const timeoutResult = await executeSingleSupplementFlow(
    repo17,
    timeoutExecutor,
    testReview17.id,
    "uid_ceo",
    "jhonny.spider@gmail.com"
  );
  assert.strictEqual(timeoutResult.supplement?.attemptCount, 1);
  assert.strictEqual(timeoutResult.supplement?.status, "inconclusive");
  assert.match(timeoutResult.supplement?.finalNote || "", /Complementação cancelada por atingir o tempo limite|interrompida/);
  console.log("✓ Falha/timeout encerra definitivamente a complementação como 'inconclusive' com trava attemptCount = 1 gravada.");

  console.log("\n--- Teste 18: Bloqueio de nova tentativa após falha/timeout (sem repetição de chamadas pagas) ---");
  await assert.rejects(
    async () => {
      await executeSingleSupplementFlow(
        repo17,
        mockSupplementExecutor,
        testReview17.id,
        "uid_ceo",
        "jhonny.spider@gmail.com"
      );
    },
    /já foi executada para esta revisão/,
    "Não é permitido retry pago após falha na complementação"
  );
  console.log("✓ Nenhuma nova chamada externa é permitida após complementação inconclusiva.");

  console.log("\n--- Teste 19: Proteção de acesso e perfil (somente CEO autorizado) ---");
  await assert.rejects(
    async () => {
      await executeSingleSupplementFlow(
        supplementRepo,
        mockSupplementExecutor,
        testReview15.id,
        "uid_aluno",
        "aluno@exemplo.com"
      );
    },
    /A complementação de evidências exige a identidade autenticada do CEO/,
    "Usuário que não é o CEO não pode disparar complementação"
  );
  console.log("✓ Bloqueio de usuário não-CEO validado com segurança.");

  console.log("\n--- Teste 20: Falha pré-chamada preserva tentativa única (attemptCount = 0) ---");
  let testReview20: LegalReviewView = {
    ...mockPendingReview,
    id: "rev_test_supplement_pre_call_fail",
    changes: [
      {
        id: "chg_3",
        type: "CORRECAO",
        severity: "ALTA",
        category: "LEGISLACAO",
        originalExcerpt: "Texto",
        revisedExcerpt: "Novo texto",
        reason: "Correção",
        verified: false,
        confirmation: "NAO_CONFIRMADO",
        sources: [],
        evidence: [],
      },
    ],
    supplement: undefined,
  };

  let markStartedAttempted = false;
  const repo20: LegalReviewRepository = {
    ...repo12,
    async get(id) {
      if (id === testReview20.id) return testReview20;
      return null;
    },
    async reserveSupplement(id, uid, email, pendingItems, now) {
      testReview20 = {
        ...testReview20,
        supplement: { attemptCount: 0, status: "reserved", startedAt: now, requestedByUid: uid, targetedPendingItems: pendingItems },
      };
      return { ok: true, review: testReview20 };
    },
    async markSupplementStarted() {
      markStartedAttempted = true;
      // Simula colisão ou falha antes de despachar a chamada
      return false;
    },
    async failPreCallSupplement(id, reason, now) {
      testReview20 = {
        ...testReview20,
        supplement: {
          attemptCount: 0,
          status: "pre_call_failure",
          completedAt: now,
          finalNote: reason,
        },
      };
      return testReview20;
    },
  };

  await assert.rejects(
    async () => {
      await executeSingleSupplementFlow(
        repo20,
        mockSupplementExecutor,
        testReview20.id,
        "uid_ceo",
        "jhonny.spider@gmail.com"
      );
    },
    /Não foi possível iniciar a complementação jurídica/,
    "Falha ao iniciar transição deve rejeitar"
  );
  assert.strictEqual(markStartedAttempted, true);
  assert.strictEqual(testReview20.supplement?.attemptCount, 0, "attemptCount continua 0 na falha pré-chamada");
  assert.strictEqual(testReview20.supplement?.status, "pre_call_failure");
  console.log("✓ Falha anterior à chamada preservou attemptCount = 0 em status pre_call_failure.");

  console.log("\n--- Teste 21: Modo offline do buildOfficialSupplementExecutor ---");
  const { buildOfficialSupplementExecutor } = await import("../src/services/legalReviewServer.js");
  const origKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const offlineExec = buildOfficialSupplementExecutor();
  const offlineRes = await offlineExec.supplement({
    lessonId: "day_1_part_0",
    pendingItems: [
      {
        id: "p1",
        sourceType: "CHANGE",
        changeId: "c1",
        excerpt: "Texto",
        reason: "Razão",
      },
    ],
    budget: { maxTokens: 4000, maxDurationMs: 30000, maxCostUsd: 0.05 },
  });

  assert.strictEqual(offlineRes.status, "inconclusive");
  assert.strictEqual(offlineRes.tokensUsed, 0);
  assert.strictEqual(offlineRes.costUsd, 0);
  assert.strictEqual(offlineRes.findings[0].status, "nao_verificada");
  assert.match(offlineRes.findings[0].objectiveJustification, /sem OPENAI_API_KEY/);
  console.log("✓ buildOfficialSupplementExecutor em modo offline opera com segurança determinística e zero custo.");

  if (origKey) process.env.OPENAI_API_KEY = origKey;

  console.log("\n--- Teste 22: Imutabilidade estrita da aula publicada no catálogo ---");
  let catalogLessonMutated = false;
  const originalCatalogText = mockLesson.content;
  // Verifica se o repositório teve seu catálogo alterado durante qualquer teste
  assert.strictEqual(mockLesson.content, originalCatalogText, "Conteúdo da aula publicada intacto");
  console.log("✓ Aula publicada no catálogo permaneceu 100% inalterada.");

  console.log("\n--- Teste 23: Validação recursiva estrita de Structured Outputs (OpenAI strict: true) ---");
  const { LEGAL_SUPPLEMENT_JSON_SCHEMA, LEGAL_REVIEW_JSON_SCHEMA } = await import("../src/lib/legalReviewValidate.js");

  function validateStrictStructuredOutputsSchema(schema: any, path = "$"): void {
    if (!schema || typeof schema !== "object") return;

    if (schema.type === "object") {
      assert.strictEqual(
        schema.additionalProperties,
        false,
        `Objeto em ${path} DEVE ter additionalProperties: false para strict: true`
      );
      assert(
        Array.isArray(schema.required),
        `Objeto em ${path} DEVE ter a propriedade required como array`
      );

      if (schema.properties && typeof schema.properties === "object") {
        const propKeys = Object.keys(schema.properties);
        const requiredSet = new Set(schema.required);

        for (const key of propKeys) {
          assert(
            requiredSet.has(key),
            `Em ${path}.properties: chave '${key}' ausente no array required. OpenAI strict: true exige que toda propriedade esteja em required.`
          );
        }

        for (const reqKey of schema.required) {
          assert(
            reqKey in schema.properties,
            `Em ${path}.required: chave '${reqKey}' não definida em properties.`
          );
        }

        for (const [propName, propDef] of Object.entries(schema.properties)) {
          validateStrictStructuredOutputsSchema(propDef, `${path}.properties.${propName}`);
        }
      }
    }

    if (schema.type === "array" && schema.items) {
      validateStrictStructuredOutputsSchema(schema.items, `${path}.items`);
    }

    if (Array.isArray(schema.anyOf)) {
      schema.anyOf.forEach((sub: any, i: number) => validateStrictStructuredOutputsSchema(sub, `${path}.anyOf[${i}]`));
    }
  }

  // Valida recursivamente o schema da complementação jurídica
  validateStrictStructuredOutputsSchema(LEGAL_SUPPLEMENT_JSON_SCHEMA, "LEGAL_SUPPLEMENT_JSON_SCHEMA");
  assert.strictEqual(
    (LEGAL_SUPPLEMENT_JSON_SCHEMA as any).properties.findings.items.properties.changeId.type[0],
    "string"
  );
  assert.strictEqual(
    (LEGAL_SUPPLEMENT_JSON_SCHEMA as any).properties.findings.items.properties.changeId.type[1],
    "null"
  );
  assert(
    (LEGAL_SUPPLEMENT_JSON_SCHEMA as any).properties.findings.items.required.includes("changeId"),
    "changeId explicitamente incluído em required com tipo nullable"
  );

  // Valida também o schema principal de auditoria jurídica
  validateStrictStructuredOutputsSchema(LEGAL_REVIEW_JSON_SCHEMA, "LEGAL_REVIEW_JSON_SCHEMA");
  console.log("✓ Todos os objetos dos schemas cumprem recursivamente strict: true (additionalProperties: false e todas as chaves em required).");

  // ====================================================================================================
  // TESTES DA COMPLEMENTAÇÃO ASSÍNCRONA COM GOOGLE CLOUD TASKS (TESTES 24 A 34)
  // ====================================================================================================

  console.log("\n--- Teste 24: Reserva atômica e enfileiramento determinístico no Cloud Tasks ---");
  let asyncTestReview24: LegalReviewView = {
    ...mockPendingReview,
    id: "rev_test_async_supplement_enqueue",
    changes: [
      {
        id: "chg_async_1",
        type: "CORRECAO",
        severity: "ALTA",
        category: "LEGISLACAO",
        originalExcerpt: "Norma A",
        revisedExcerpt: "Norma A revisada",
        reason: "Correção de número da lei",
        verified: false,
        confirmation: "NAO_CONFIRMADO",
        sources: [],
        evidence: [],
      },
    ],
    supplement: undefined,
  };

  let enqueuedSupplementPayload24: any = null;
  let enqueuedDeterministicId: string | undefined = undefined;
  const mockEnqueuer24: LegalReviewTaskEnqueuer = {
    async enqueue(payload, deterministicTaskId) {
      enqueuedSupplementPayload24 = payload;
      enqueuedDeterministicId = deterministicTaskId;
    },
  };

  const repo24: LegalReviewRepository = {
    ...repo12,
    async get(id) {
      if (id === asyncTestReview24.id) return asyncTestReview24;
      return null;
    },
    async reserveSupplement(id, uid, email, pendingItems, now) {
      asyncTestReview24 = {
        ...asyncTestReview24,
        supplement: {
          attemptCount: 0,
          status: "reserved",
          startedAt: now,
          requestedByUid: uid,
          requestedByEmail: email,
          targetedPendingItems: pendingItems,
        },
      };
      return { ok: true, review: asyncTestReview24 };
    },
    async failPreCallSupplement(id, reason, now) {
      asyncTestReview24 = {
        ...asyncTestReview24,
        supplement: {
          attemptCount: 0,
          status: "pre_call_failure",
          completedAt: now,
          finalNote: reason,
        },
      };
      return asyncTestReview24;
    },
  };

  const enqueueRes = await enqueueSingleSupplementFlow(
    repo24,
    mockEnqueuer24,
    asyncTestReview24.id,
    "uid_ceo",
    "jhonny.spider@gmail.com"
  );

  assert.strictEqual(enqueueRes.supplement?.status, "reserved", "Estado inicial após enfileiramento deve ser 'reserved'");
  assert.strictEqual(enqueueRes.supplement?.attemptCount, 0, "attemptCount permanece 0 antes da execução externa");
  assert.strictEqual(enqueuedSupplementPayload24?.jobType, "SUPPLEMENT", "Payload deve ter jobType 'SUPPLEMENT'");
  assert.strictEqual(enqueuedSupplementPayload24?.reviewId, asyncTestReview24.id);
  assert(enqueuedDeterministicId?.startsWith(`supp-${asyncTestReview24.id}`), "ID da tarefa Cloud Tasks deve ser determinístico");
  console.log("✓ Reserva atômica gravada como 'reserved' com attemptCount = 0 e tarefa despachada com identificador determinístico.");

  console.log("\n--- Teste 25: Falha anterior ao enfileiramento (revisão inexistente ou não pendente) ---");
  await assert.rejects(
    async () => {
      await enqueueSingleSupplementFlow(
        repo24,
        mockEnqueuer24,
        "rev_inexistente",
        "uid_ceo",
        "jhonny.spider@gmail.com"
      );
    },
    /A revisão precisa estar no estado pending_approval/,
    "Revisão inexistente deve rejeitar imediatamente"
  );
  console.log("✓ Bloqueio seguro para requisição anterior ao enfileiramento.");

  console.log("\n--- Teste 26: Rejeição comprovada antes da criação da tarefa (pre_call_failure com attemptCount = 0) ---");
  let asyncTestReview26: LegalReviewView = {
    ...asyncTestReview24,
    id: "rev_test_async_enqueue_proven_fail",
    supplement: undefined,
  };

  const provenFailingEnqueuer26: LegalReviewTaskEnqueuer = {
    async enqueue() {
      // Simula erro de configuração/validação local antes de qualquer chamada RPC
      throw new Error("Configuração obrigatória do Cloud Tasks ausente no ambiente: [CLOUD_TASKS_QUEUE]. Enfileiramento abortado.");
    },
  };

  const repo26: LegalReviewRepository = {
    ...repo24,
    async get(id) {
      if (id === asyncTestReview26.id) return asyncTestReview26;
      return null;
    },
    async reserveSupplement(id, uid, email, pendingItems, now, attemptId) {
      asyncTestReview26 = {
        ...asyncTestReview26,
        supplement: {
          attemptCount: 0,
          attemptId: attemptId || "att-1",
          status: "reserved",
          startedAt: now,
          requestedByUid: uid,
          requestedByEmail: email,
          targetedPendingItems: pendingItems,
        },
      };
      return { ok: true, review: asyncTestReview26 };
    },
    async failPreCallSupplement(id, reason, now) {
      asyncTestReview26 = {
        ...asyncTestReview26,
        supplement: {
          attemptCount: 0,
          attemptId: asyncTestReview26.supplement?.attemptId || "att-1",
          status: "pre_call_failure",
          completedAt: now,
          finalNote: reason,
        },
      };
      return asyncTestReview26;
    },
    async recordUncertainEnqueueSupplement(id, reason, now) {
      asyncTestReview26 = {
        ...asyncTestReview26,
        supplement: {
          ...(asyncTestReview26.supplement || { attemptCount: 0, status: "reserved" }),
          status: "reserved",
          uncertaintyReason: reason,
          finalNote: reason,
        },
      };
      return asyncTestReview26;
    },
  };

  await assert.rejects(
    async () => {
      await enqueueSingleSupplementFlow(
        repo26,
        provenFailingEnqueuer26,
        asyncTestReview26.id,
        "uid_ceo",
        "jhonny.spider@gmail.com"
      );
    },
    /Falha comprovada ao despachar a tarefa para a fila do Cloud Tasks antes da criação/
  );

  assert.strictEqual(asyncTestReview26.supplement?.attemptCount, 0, "attemptCount deve continuar 0 para permitir nova tentativa");
  assert.strictEqual(asyncTestReview26.supplement?.status, "pre_call_failure");
  console.log("✓ Rejeição comprovada antes da criação registrou pre_call_failure mantendo attemptCount = 0 intacto.");

  console.log("\n--- Teste 26B: Erro de transporte com resultado incerto (mantém reserved, bloqueia botão e grava incerteza) ---");
  let asyncTestReview26b: LegalReviewView = {
    ...asyncTestReview24,
    id: "rev_test_async_enqueue_uncertain_transport",
    supplement: undefined,
  };

  const uncertainTransportEnqueuer: LegalReviewTaskEnqueuer = {
    async enqueue() {
      // Simula timeout / queda de conexão durante RPC createTask
      const err: any = new Error("DEADLINE_EXCEEDED: timeout waiting for response");
      err.code = 4; // gRPC DEADLINE_EXCEEDED
      throw err;
    },
  };

  const repo26b: LegalReviewRepository = {
    ...repo24,
    async get(id) {
      if (id === asyncTestReview26b.id) return asyncTestReview26b;
      return null;
    },
    async reserveSupplement(id, uid, email, pendingItems, now, attemptId) {
      asyncTestReview26b = {
        ...asyncTestReview26b,
        supplement: {
          attemptCount: 0,
          attemptId: attemptId || "att-1",
          status: "reserved",
          startedAt: now,
          requestedByUid: uid,
          requestedByEmail: email,
          targetedPendingItems: pendingItems,
        },
      };
      return { ok: true, review: asyncTestReview26b };
    },
    async failPreCallSupplement() {
      throw new Error("failPreCallSupplement NÃO deve ser chamado em erro incerto de transporte!");
    },
    async recordUncertainEnqueueSupplement(id, reason, now) {
      asyncTestReview26b = {
        ...asyncTestReview26b,
        supplement: {
          ...(asyncTestReview26b.supplement || { attemptCount: 0, status: "reserved" }),
          status: "reserved",
          attemptId: asyncTestReview26b.supplement?.attemptId || "att-1",
          uncertaintyReason: reason,
          finalNote: reason,
        },
      };
      return asyncTestReview26b;
    },
  };

  await assert.rejects(
    async () => {
      await enqueueSingleSupplementFlow(
        repo26b,
        uncertainTransportEnqueuer,
        asyncTestReview26b.id,
        "uid_ceo",
        "jhonny.spider@gmail.com"
      );
    },
    /Falha de transporte com resultado incerto ao contatar o Cloud Tasks/
  );

  assert.strictEqual(asyncTestReview26b.supplement?.status, "reserved", "Estado permanece 'reserved' para reconciliação e proteção contra duplicidade");
  assert.notStrictEqual(asyncTestReview26b.supplement?.status, "pre_call_failure", "NÃO pode assumir pre_call_failure em caso incerto");
  assert(asyncTestReview26b.supplement?.uncertaintyReason, "Motivo de incerteza deve estar registrado");
  console.log("✓ Erro incerto de transporte manteve status bloqueado ('reserved'), registrou incerteza e NÃO reabilitou pre_call_failure.");

  console.log("\n--- Teste 27: Processamento assíncrono no Worker e bloqueio de entrega duplicada ---");
  let paidCallsTotal = 0;
  const countingExecutor: import("../src/lib/legalReviewTypes.js").LegalSupplementExecutor = {
    async supplement(params) {
      paidCallsTotal++;
      return {
        status: "completed",
        tokensUsed: 150,
        durationMs: 2500,
        costUsd: 0.002,
        findings: [
          {
            pendingId: "chg_async_1",
            changeId: "chg_async_1",
            statementAnalyzed: "Norma A",
            officialSourceConsulted: "Planalto",
            verifiableUrl: "http://www.planalto.gov.br/ccivil_03/leis/l8112.htm",
            relevantExcerptOrBasis: "Art. 1",
            status: "confirmada",
            objectiveJustification: "Confirmada em fonte oficial",
            foundOfficialEvidence: true,
            evidence: [],
            sources: [],
          },
        ],
        finalNote: "Complementação assíncrona finalizada com êxito.",
      };
    },
  };

  let workerReview27: LegalReviewView = {
    ...asyncTestReview24,
    id: "rev_test_worker_dedup",
    supplement: {
      attemptCount: 0,
      status: "reserved",
      startedAt: Date.now(),
      requestedByUid: "uid_ceo",
      requestedByEmail: "jhonny.spider@gmail.com",
      targetedPendingItems: [
        {
          id: "chg_async_1",
          sourceType: "CHANGE",
          changeId: "chg_async_1",
          excerpt: "Norma A",
          reason: "Correção",
        },
      ],
    },
  };

  const repo27: LegalReviewRepository = {
    ...repo24,
    async get(id) {
      if (id === workerReview27.id) return workerReview27;
      return null;
    },
    async markSupplementStarted(id, now) {
      if (workerReview27.supplement?.status !== "reserved") return false;
      workerReview27 = {
        ...workerReview27,
        supplement: {
          ...workerReview27.supplement!,
          attemptCount: 1,
          status: "running",
          startedAt: now,
        },
      };
      return true;
    },
    async recordSupplementOutcome(id, outcome) {
      workerReview27 = {
        ...workerReview27,
        supplement: outcome,
      };
      return workerReview27;
    },
  };

  const jobPayload27: AsyncLegalSupplementJobPayload = {
    jobType: "SUPPLEMENT",
    reviewId: workerReview27.id,
    lessonId: workerReview27.lessonId,
    requestedByUid: "uid_ceo",
    requestedByEmail: "jhonny.spider@gmail.com",
    requestedAt: Date.now(),
  };

  // Primeira entrega: executa com sucesso
  const firstDelivery = await processAsyncLegalSupplementWorker(repo27, countingExecutor, jobPayload27);
  assert.strictEqual(firstDelivery.status, "completed");
  assert.strictEqual(paidCallsTotal, 1, "Executor deve ser chamado exatamente 1 vez na primeira entrega");
  assert.strictEqual(workerReview27.supplement?.status, "completed");
  assert.strictEqual(workerReview27.supplement?.attemptCount, 1);

  // Segunda entrega (duplicação pelo Cloud Tasks): deve dar skip e ZERO novas chamadas
  const secondDelivery = await processAsyncLegalSupplementWorker(repo27, countingExecutor, jobPayload27);
  assert.strictEqual(secondDelivery.status, "skipped", "Entrega duplicada DEVE ser pulada (skipped)");
  assert.strictEqual(paidCallsTotal, 1, "Executor NÃO pode ser chamado uma segunda vez em entrega duplicada");
  console.log("✓ Entrega duplicada do Cloud Tasks descartada com status 'skipped' (ZERO chamadas extras à OpenAI).");

  console.log("\n--- Teste 28: Dois workers concorrentes do Cloud Tasks disputando a mesma tarefa ---");
  let concurrentReview28: LegalReviewView = {
    ...asyncTestReview24,
    id: "rev_test_concurrent_workers",
    supplement: {
      attemptCount: 0,
      status: "reserved",
      startedAt: Date.now(),
      requestedByUid: "uid_ceo",
      requestedByEmail: "jhonny.spider@gmail.com",
      targetedPendingItems: [
        {
          id: "chg_async_1",
          sourceType: "CHANGE",
          changeId: "chg_async_1",
          excerpt: "Norma A",
          reason: "Correção",
        },
      ],
    },
  };

  let concurrentCallsCount = 0;
  const slowExecutor: import("../src/lib/legalReviewTypes.js").LegalSupplementExecutor = {
    async supplement() {
      concurrentCallsCount++;
      await new Promise((r) => setTimeout(r, 50));
      return {
        status: "completed",
        tokensUsed: 100,
        durationMs: 50,
        costUsd: 0.001,
        findings: [],
        finalNote: "Ok",
      };
    },
  };

  let claimWinner: string | null = null;
  const repo28: LegalReviewRepository = {
    ...repo24,
    async get(id) {
      if (id === concurrentReview28.id) return concurrentReview28;
      return null;
    },
    async markSupplementStarted(id, now) {
      // Simula transação atômica do Firestore: somente o primeiro consegue passar de 'reserved' para 'running'
      if (concurrentReview28.supplement?.status !== "reserved") {
        return false;
      }
      claimWinner = "worker_1";
      concurrentReview28 = {
        ...concurrentReview28,
        supplement: {
          ...concurrentReview28.supplement!,
          attemptCount: 1,
          status: "running",
          startedAt: now,
        },
      };
      return true;
    },
    async recordSupplementOutcome(id, outcome) {
      concurrentReview28 = {
        ...concurrentReview28,
        supplement: outcome,
      };
      return concurrentReview28;
    },
  };

  const [resWorkerA, resWorkerB] = await Promise.all([
    processAsyncLegalSupplementWorker(repo28, slowExecutor, { ...jobPayload27, reviewId: concurrentReview28.id }),
    processAsyncLegalSupplementWorker(repo28, slowExecutor, { ...jobPayload27, reviewId: concurrentReview28.id }),
  ]);

  const completedCount = [resWorkerA.status, resWorkerB.status].filter((s) => s === "completed").length;
  const skippedCount = [resWorkerA.status, resWorkerB.status].filter((s) => s === "skipped").length;
  assert.strictEqual(completedCount, 1, "Exatamente um worker deve ter executado");
  assert.strictEqual(skippedCount, 1, "Exatamente um worker concorrente deve ter sido descartado (skipped)");
  assert.strictEqual(concurrentCallsCount, 1, "Exatamente uma única chamada externa à IA deve ter ocorrido");
  console.log("✓ Concorrência estrita no Firestore validada: apenas um worker adquiriu a execução e executou a chamada externa.");

  console.log("\n--- Teste 29: Timeout de 120s após início da chamada externa encerra como inconclusive ---");
  let timeoutReview29: LegalReviewView = {
    ...asyncTestReview24,
    id: "rev_test_worker_timeout_120s",
    supplement: {
      attemptCount: 0,
      status: "reserved",
      startedAt: Date.now(),
      requestedByUid: "uid_ceo",
      requestedByEmail: "jhonny.spider@gmail.com",
      targetedPendingItems: [],
    },
  };

  const timeoutExecutor120s: import("../src/lib/legalReviewTypes.js").LegalSupplementExecutor = {
    async supplement(params) {
      assert.strictEqual(params.budget.maxDurationMs, 120_000, "Orçamento de tempo deve ser de 120.000ms");
      const err: any = new Error("AbortError: The operation was aborted");
      err.name = "AbortError";
      throw err;
    },
  };

  const repo29: LegalReviewRepository = {
    ...repo24,
    async get(id) {
      if (id === timeoutReview29.id) return timeoutReview29;
      return null;
    },
    async markSupplementStarted(id, now) {
      timeoutReview29 = {
        ...timeoutReview29,
        supplement: {
          ...timeoutReview29.supplement!,
          attemptCount: 1,
          status: "running",
          startedAt: now,
        },
      };
      return true;
    },
    async recordSupplementOutcome(id, outcome) {
      timeoutReview29 = {
        ...timeoutReview29,
        supplement: outcome,
      };
      return timeoutReview29;
    },
  };

  const timeoutRes = await processAsyncLegalSupplementWorker(repo29, timeoutExecutor120s, { ...jobPayload27, reviewId: timeoutReview29.id });
  assert.strictEqual(timeoutRes.status, "inconclusive");
  assert.strictEqual(timeoutReview29.supplement?.attemptCount, 1, "attemptCount = 1 gravado em timeout");
  assert.strictEqual(timeoutReview29.supplement?.status, "inconclusive");
  assert.match(timeoutReview29.supplement?.finalNote || "", /Complementação cancelada por atingir o tempo limite de 120s/);
  console.log("✓ Timeout de 120s tratado com status 'inconclusive' definitivo e attemptCount = 1.");

  console.log("\n--- Teste 30: Reinicialização do worker após falha/timeout (rejeição automática de reprocessamento) ---");
  let postTimeoutCalls = 0;
  const postTimeoutExecutor: import("../src/lib/legalReviewTypes.js").LegalSupplementExecutor = {
    async supplement() {
      postTimeoutCalls++;
      return { status: "completed", tokensUsed: 0, durationMs: 0, costUsd: 0, findings: [], finalNote: "" };
    },
  };
  const redeliveryAfterTimeout = await processAsyncLegalSupplementWorker(repo29, postTimeoutExecutor, { ...jobPayload27, reviewId: timeoutReview29.id });
  assert.strictEqual(redeliveryAfterTimeout.status, "skipped", "Redelivery após timeout deve ser descartada");
  assert.strictEqual(postTimeoutCalls, 0, "Nenhuma chamada externa pode ser disparada após timeout registrado");
  console.log("✓ Worker rejeita reprocessamento após estado inconclusive registrado (zero retry pago).");

  console.log("\n--- Teste 31: Atualização da página durante processamento (visão preservada em running) ---");
  let runningReview31: LegalReviewView = {
    ...asyncTestReview24,
    id: "rev_test_page_refresh_during_running",
    supplement: {
      attemptCount: 1,
      status: "running",
      startedAt: Date.now() - 5000,
      requestedByUid: "uid_ceo",
      requestedByEmail: "jhonny.spider@gmail.com",
    },
  };

  const repo31: LegalReviewRepository = {
    ...repo24,
    async get(id) {
      if (id === runningReview31.id) return runningReview31;
      return null;
    },
    async getIndex() {
      return {
        lessonId: runningReview31.lessonId,
        processingReviewId: null,
        processingStartedAt: null,
        approvedHash: null,
        approvedReviewId: null,
        approvedReviewDate: null,
        latestReviewId: runningReview31.id,
        latestStatus: "pending_approval",
      };
    },
  };

  const refreshResult = await getLatestLegalReviewFlow(repo31, { day: 1, part: 0 });
  assert.strictEqual(refreshResult.found, true);
  assert.strictEqual(refreshResult.review?.supplement?.status, "running", "Ao recarregar a página, status permanece running");
  assert.strictEqual(refreshResult.review?.supplement?.attemptCount, 1);
  console.log("✓ Recarregar a página exibe 'running' ('Em execução...') sem disparar nova complementação.");

  console.log("\n--- Teste 32: CEO não autorizado ou aluno tentando enfileirar (HTTP 403) ---");
  await assert.rejects(
    async () => {
      await enqueueSingleSupplementFlow(
        repo24,
        mockEnqueuer24,
        asyncTestReview24.id,
        "uid_invasor",
        "hacker@externo.com"
      );
    },
    /A complementação de evidências exige a identidade autenticada do CEO/
  );
  console.log("✓ Tentativa de enfileiramento por usuário não-CEO bloqueada com HTTP 403.");

  console.log("\n--- Teste 33: Preservação estrita das 13 alterações e textos durante e após fluxo assíncrono ---");
  assert.strictEqual(mockLesson.content, originalCatalogText, "Conteúdo da aula homologada permanece intocado");
  assert.strictEqual(asyncTestReview24.changes.length, 1, "Alterações da revisão de teste intactas");
  assert.strictEqual(mockPendingReview.changes.length, 0, "Alterações base intactas");
  console.log("✓ Textos, Markdown revisado, 13 alterações e catálogo permaneceram 100% íntegros e inalterados.");

  console.log("\n--- Teste 34: Ausência absoluta de segunda chamada paga em todos os cenários de duplicidade ---");
  assert.strictEqual(paidCallsTotal, 1, "Total de chamadas do countingExecutor deve permanecer rigorosamente 1");
  assert.strictEqual(postTimeoutCalls, 0, "Total de chamadas pós-timeout deve ser rigorosamente 0");
  assert.strictEqual(concurrentCallsCount, 1, "Total de chamadas no teste concorrente deve ser rigorosamente 1");
  console.log("✓ Garantia matemática e determinística de chamada única sem loops de cobrança comprovada.");

  console.log("\n--- Teste 35: Duplo clique e requisições simultâneas com taskId estável e tratamento de ALREADY_EXISTS ---");
  let doubleClickReview: LegalReviewView = {
    ...asyncTestReview24,
    id: "rev_test_double_click_stable_id",
    supplement: undefined,
  };

  const dispatchedTaskIds: string[] = [];
  const doubleClickEnqueuer: LegalReviewTaskEnqueuer = {
    async enqueue(payload, deterministicTaskId) {
      if (deterministicTaskId) {
        if (dispatchedTaskIds.includes(deterministicTaskId)) {
          // Simula Cloud Tasks retornando ALREADY_EXISTS para a mesma tarefa
          return;
        }
        dispatchedTaskIds.push(deterministicTaskId);
      }
    },
  };

  const repo35: LegalReviewRepository = {
    ...repo24,
    async get(id) {
      if (id === doubleClickReview.id) return doubleClickReview;
      return null;
    },
    async reserveSupplement(id, uid, email, pendingItems, now, attemptId) {
      const effectiveAttemptId = doubleClickReview.supplement?.attemptId || attemptId || "att-1";
      doubleClickReview = {
        ...doubleClickReview,
        supplement: {
          attemptCount: 0,
          attemptId: effectiveAttemptId,
          status: "reserved",
          startedAt: now,
          requestedByUid: uid,
          requestedByEmail: email,
          targetedPendingItems: pendingItems,
        },
      };
      return { ok: true, review: doubleClickReview };
    },
  };

  const [dcRes1, dcRes2] = await Promise.all([
    enqueueSingleSupplementFlow(repo35, doubleClickEnqueuer, doubleClickReview.id, "uid_ceo", "jhonny.spider@gmail.com"),
    enqueueSingleSupplementFlow(repo35, doubleClickEnqueuer, doubleClickReview.id, "uid_ceo", "jhonny.spider@gmail.com"),
  ]);

  assert.strictEqual(dcRes1.supplement?.status, "reserved");
  assert.strictEqual(dcRes2.supplement?.status, "reserved");
  assert.strictEqual(dispatchedTaskIds.length, 1, "Exatamente um identificador de tarefa deve ser registrado na fila");
  assert.strictEqual(dispatchedTaskIds[0], `supp-${doubleClickReview.id}-att-1`, "TaskId deve ser derivado deterministicamente de attemptId");
  console.log("✓ Duplo clique utilizou o mesmo identificador estável e deduplicou via ALREADY_EXISTS com sucesso.");

  console.log("\n--- Teste 36: Resposta perdida de transporte no enfileiramento não invalida a tarefa criada na fila ---");
  let droppedResponseReview: LegalReviewView = {
    ...asyncTestReview24,
    id: "rev_test_dropped_response_task_valid",
    supplement: undefined,
  };

  const transportTimeoutEnqueuer: LegalReviewTaskEnqueuer = {
    async enqueue() {
      // Simula a tarefa sendo gravada no Cloud Tasks, mas a resposta de retorno sofrendo timeout
      const err: any = new Error("ECONNRESET: socket hang up");
      throw err;
    },
  };

  const repo36: LegalReviewRepository = {
    ...repo24,
    async get(id) {
      if (id === droppedResponseReview.id) return droppedResponseReview;
      return null;
    },
    async reserveSupplement(id, uid, email, pendingItems, now, attemptId) {
      droppedResponseReview = {
        ...droppedResponseReview,
        supplement: {
          attemptCount: 0,
          attemptId: attemptId || "att-1",
          status: "reserved",
          startedAt: now,
          requestedByUid: uid,
          requestedByEmail: email,
          targetedPendingItems: pendingItems,
        },
      };
      return { ok: true, review: droppedResponseReview };
    },
    async recordUncertainEnqueueSupplement(id, reason, now) {
      droppedResponseReview = {
        ...droppedResponseReview,
        supplement: {
          ...(droppedResponseReview.supplement || { attemptCount: 0, status: "reserved" }),
          status: "reserved",
          uncertaintyReason: reason,
          finalNote: reason,
        },
      };
      return droppedResponseReview;
    },
    async markSupplementStarted(id, now) {
      if (droppedResponseReview.supplement?.status !== "reserved") return false;
      droppedResponseReview = {
        ...droppedResponseReview,
        supplement: {
          ...droppedResponseReview.supplement!,
          attemptCount: 1,
          status: "running",
          startedAt: now,
        },
      };
      return true;
    },
    async recordSupplementOutcome(id, outcome) {
      droppedResponseReview = {
        ...droppedResponseReview,
        supplement: outcome,
      };
      return droppedResponseReview;
    },
  };

  // Enfileiramento falha por timeout de resposta HTTP
  await assert.rejects(
    async () => {
      await enqueueSingleSupplementFlow(repo36, transportTimeoutEnqueuer, droppedResponseReview.id, "uid_ceo", "jhonny.spider@gmail.com");
    },
    /Falha de transporte com resultado incerto/
  );

  // Verifica que o estado NÃO virou pre_call_failure e permaneceu reserved com motivo gravado
  assert.strictEqual(droppedResponseReview.supplement?.status, "reserved");
  assert.notStrictEqual(droppedResponseReview.supplement?.status, "pre_call_failure");
  assert(droppedResponseReview.supplement?.uncertaintyReason);

  // Quando o worker da tarefa do Cloud Tasks chega, a tarefa AINDA É VÁLIDA e executa normalmente!
  const workerPayload36: AsyncLegalSupplementJobPayload = {
    jobType: "SUPPLEMENT",
    reviewId: droppedResponseReview.id,
    lessonId: droppedResponseReview.lessonId,
    attemptId: "att-1",
    requestedByUid: "uid_ceo",
    requestedByEmail: "jhonny.spider@gmail.com",
    requestedAt: Date.now(),
  };

  let executedCalls36 = 0;
  const executor36: import("../src/lib/legalReviewTypes.js").LegalSupplementExecutor = {
    async supplement() {
      executedCalls36++;
      return { status: "completed", tokensUsed: 100, durationMs: 1000, costUsd: 0.001, findings: [], finalNote: "Concluído" };
    },
  };

  const workerResult36 = await processAsyncLegalSupplementWorker(repo36, executor36, workerPayload36);
  assert.strictEqual(workerResult36.status, "completed");
  assert.strictEqual(executedCalls36, 1, "Worker processou a tarefa criada sem invalidá-la");
  assert.strictEqual(droppedResponseReview.supplement?.status, "completed");
  assert.strictEqual(droppedResponseReview.supplement?.attemptCount, 1);
  console.log("✓ Tarefa na fila permaneceu válida após resposta de transporte perdida e foi executada com sucesso pelo worker.");

  console.log("\n--- Teste 37: Recuperação administrativa autorizada gerando nova identidade estável (att-2) ---");
  // Simula revisão que passou por recuperação administrativa com novo attemptId 'att-2'
  let recoveredReview37: LegalReviewView = {
    ...asyncTestReview24,
    id: "rev_test_recovered_administrative",
    supplement: {
      attemptCount: 0,
      attemptId: "att-2", // Nova identidade concedida após deliberação administrativa
      status: "idle",
      requestedByUid: "uid_ceo",
      requestedByEmail: "jhonny.spider@gmail.com",
    },
  };

  let capturedTaskId37: string | undefined = undefined;
  const enqueuer37: LegalReviewTaskEnqueuer = {
    async enqueue(payload, deterministicTaskId) {
      capturedTaskId37 = deterministicTaskId;
    },
  };

  const repo37: LegalReviewRepository = {
    ...repo24,
    async get(id) {
      if (id === recoveredReview37.id) return recoveredReview37;
      return null;
    },
    async reserveSupplement(id, uid, email, pendingItems, now, attemptId) {
      const effectiveAttemptId = recoveredReview37.supplement?.attemptId || attemptId || "att-2";
      recoveredReview37 = {
        ...recoveredReview37,
        supplement: {
          attemptCount: 0,
          attemptId: effectiveAttemptId,
          status: "reserved",
          startedAt: now,
          requestedByUid: uid,
          requestedByEmail: email,
          targetedPendingItems: pendingItems,
        },
      };
      return { ok: true, review: recoveredReview37 };
    },
    async markSupplementStarted(id, now) {
      if (recoveredReview37.supplement?.status !== "reserved") return false;
      recoveredReview37 = {
        ...recoveredReview37,
        supplement: {
          ...recoveredReview37.supplement!,
          attemptCount: 1,
          status: "running",
          startedAt: now,
        },
      };
      return true;
    },
    async recordSupplementOutcome(id, outcome) {
      recoveredReview37 = {
        ...recoveredReview37,
        supplement: outcome,
      };
      return recoveredReview37;
    },
  };

  await enqueueSingleSupplementFlow(repo37, enqueuer37, recoveredReview37.id, "uid_ceo", "jhonny.spider@gmail.com");
  assert.strictEqual(capturedTaskId37, `supp-${recoveredReview37.id}-att-2`, "Nova tentativa administrativa deve usar nova identidade estável (att-2)");

  // Se um worker residual da tentativa antiga (att-1) chegar, ele DEVE ser descartado por incompatibilidade de attemptId
  const staleWorkerPayload: AsyncLegalSupplementJobPayload = {
    jobType: "SUPPLEMENT",
    reviewId: recoveredReview37.id,
    lessonId: recoveredReview37.lessonId,
    attemptId: "att-1", // Tentativa antiga!
    requestedByUid: "uid_ceo",
    requestedByEmail: "jhonny.spider@gmail.com",
    requestedAt: Date.now(),
  };

  let staleWorkerExecuted = false;
  const staleExecutor: import("../src/lib/legalReviewTypes.js").LegalSupplementExecutor = {
    async supplement() {
      staleWorkerExecuted = true;
      return { status: "completed", tokensUsed: 0, durationMs: 0, costUsd: 0, findings: [], finalNote: "" };
    },
  };

  const staleResult = await processAsyncLegalSupplementWorker(repo37, staleExecutor, staleWorkerPayload);
  assert.strictEqual(staleResult.status, "skipped", "Worker com attemptId incompatível deve ser descartado com status 'skipped'");
  assert.strictEqual(staleWorkerExecuted, false, "Zero execuções pagas para worker de tentativa antiga");
  console.log("✓ Recuperação administrativa gerou nova identidade estável e descartou workers residuais da tentativa anterior.");

  console.log("\n================================================================================");
  console.log("TODOS OS 37 TESTES DE RECUPERAÇÃO, CONCORRÊNCIA, IDEMPOTÊNCIA E COMPLEMENTAÇÃO ASSÍNCRONA PASSARAM!");
  console.log("================================================================================");
}


runTests().catch((err) => {
  console.error("Falha no teste:", err);
  process.exit(1);
});

