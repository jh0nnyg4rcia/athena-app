/**
 * ATHENA — SUÍTE DE TESTES OFFLINE: RESOLUÇÃO HUMANA DAS PENDÊNCIAS JURÍDICAS
 * 
 * Verificação 100% determinística e offline:
 * - ZERO chamadas pagas (sem OpenAI, sem Gemini, sem Claude, sem rede).
 * - Utiliza os artefatos congelados de tmp/editorial-review-day1/ (Dia 1).
 * - Testa a resolução pontual das 5 pendências reais:
 *   CHG-001, CHG-006, CHG-007, CHG-010, CHG-012.
 * - Valida os estados:
 *   APPLIED_AUTOMATICALLY, APPLIED_BY_CEO, EDITED_BY_CEO, REJECTED_BY_CEO, PENDING, BLOCKED.
 * - Valida a coordenação atômica de questões no desafio [ATHENA_CHALLENGE].
 * - Valida o bloqueio estrito de aprovação até a resolução completa de todas as pendências.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  validateEditorialIntegrity,
  applySingleSpanPatch,
  findQuestionCoordinationGroups,
  applyCoordinatedQuestionPatch,
} from "../src/lib/legalReviewValidate.js";
import {
  type LegalReviewChange,
  type StoredCatalogLesson,
  type LegalReviewView,
  type HumanReviewDecision,
} from "../src/lib/legalReviewTypes.js";
import {
  approveLegalReview,
  resolveHumanLegalReviewChange,
  resolveHumanCoordinatedQuestion,
} from "../src/services/legalReviewFlow.js";
import {
  LegalReviewError,
  type LegalReviewRepository,
  hashCatalogSnapshot,
  hashLessonContent,
} from "../src/services/legalReviewRepository.js";

const CEO_EMAIL = "jhonny.spider@gmail.com";
const NON_CEO_EMAIL = "aluno@athena.com";
const TEST_UID = "uid_ceo_offline_test";

function parseRelatorioJuridico(mdContent: string): LegalReviewChange[] {
  const changes: LegalReviewChange[] = [];
  const regex = /### Alteração (\d+): \[([A-Z_]+)\] ([A-Z_]+) \(Severidade: ([A-Z_]+)\)\s+- \*\*ID:\*\* `([^`]+)`\s+- \*\*Trecho Original:\*\*\s+> "([\s\S]*?)"\s+- \*\*Trecho Revisado Proposto:\*\*\s+> "([\s\S]*?)"\s+- \*\*Justificativa Jurídica:\*\* ([\s\S]*?)\s+- \*\*Status de Confirmação:\*\* `([^`]+)` \(Verificado: (true|false)\)/g;

  let match;
  while ((match = regex.exec(mdContent)) !== null) {
    changes.push({
      id: match[5],
      category: match[2] as any,
      type: match[3] as any,
      severity: match[4] as any,
      originalExcerpt: match[6],
      revisedExcerpt: match[7],
      reason: match[8].trim(),
      confirmation: match[9] as any,
      verified: match[10] === "true",
      sources: [],
      evidence: [],
    });
  }
  return changes;
}

function createInMemoryRepository(initialLesson: StoredCatalogLesson): LegalReviewRepository & {
  lessons: Map<string, StoredCatalogLesson>;
  reviews: Map<string, LegalReviewView>;
} {
  const lessons = new Map<string, StoredCatalogLesson>([[initialLesson.id, { ...initialLesson }]]);
  const reviews = new Map<string, LegalReviewView>();

  return {
    lessons,
    reviews,
    async getLesson(id: string) {
      const found = lessons.get(id);
      return found ? { ...found } : null;
    },
    async getIndex(id: string) {
      return {
        lessonId: id,
        latestReviewId: null,
        latestStatus: null,
        processingReviewId: null,
        processingStartedAt: null,
        approvedReviewId: null,
        approvedReviewDate: null,
        approvedHash: null,
      };
    },
    async begin(review: LegalReviewView) {
      reviews.set(review.id, { ...review });
    },
    async complete(review: LegalReviewView) {
      reviews.set(review.id, { ...review });
    },
    async fail(reviewId: string, lessonId: string) {
      const current = reviews.get(reviewId);
      if (current) reviews.set(reviewId, { ...current, status: "failed" });
    },
    async touchProcessing() { return true; },
    async get(id: string) {
      const found = reviews.get(id);
      return found ? { ...found } : null;
    },
    async saveCandidate(reviewId: string, markdown: string, now: number) {
      const current = reviews.get(reviewId);
      if (!current) throw new LegalReviewError("not found", 404);
      const updated: LegalReviewView = {
        ...current,
        reviewedMarkdown: markdown,
        candidateHash: hashLessonContent(markdown),
        manuallyEdited: true,
        manuallyEditedAt: now,
      };
      reviews.set(reviewId, updated);
      return updated;
    },
    async saveHumanDecisions(reviewId, markdown, humanDecisions, editorialIntegrity, now) {
      const current = reviews.get(reviewId);
      if (!current) throw new LegalReviewError("not found", 404);
      const updated: LegalReviewView = {
        ...current,
        reviewedMarkdown: markdown,
        candidateHash: hashLessonContent(markdown),
        manuallyEdited: true,
        manuallyEditedAt: now,
        humanDecisions,
        editorialIntegrity,
      };
      reviews.set(reviewId, updated);
      return updated;
    },
    async reject(reviewId: string, uid: string) {
      const current = reviews.get(reviewId);
      if (!current) throw new Error("not found");
      const updated: LegalReviewView = { ...current, status: "rejected" };
      reviews.set(reviewId, updated);
      return updated;
    },
    async approve(reviewId: string, uid: string, email: string, now: number) {
      const current = reviews.get(reviewId);
      if (!current) throw new Error("not found");
      const lesson = lessons.get(current.lessonId);
      if (!lesson) throw new Error("lesson not found");

      const published: StoredCatalogLesson = {
        ...lesson,
        content: current.reviewedMarkdown,
        status: "approved",
        approvedBy: email,
        approvedAt: now,
      };
      lessons.set(lesson.id, published);
      reviews.set(reviewId, { ...current, status: "approved" });
      return { ok: true, lesson: published };
    },
  };
}

async function runHumanResolutionTestSuite() {
  console.log("================================================================================");
  console.log("ATHENA — TESTES OFFLINE: RESOLUÇÃO HUMANA DAS PENDÊNCIAS JURÍDICAS");
  console.log("================================================================================\n");

  const originalPath = path.resolve("tmp/editorial-review-day1/aula-original.md");
  const reviewedPath = path.resolve("tmp/editorial-review-day1/aula-revisada.md");
  const reportPath = path.resolve("tmp/editorial-review-day1/relatorio-juridico.md");

  assert.ok(fs.existsSync(originalPath), "aula-original.md deve existir");
  assert.ok(fs.existsSync(reviewedPath), "aula-revisada.md deve existir");
  assert.ok(fs.existsSync(reportPath), "relatorio-juridico.md deve existir");

  const originalDoc = fs.readFileSync(originalPath, "utf8");
  const reviewedDoc = fs.readFileSync(reviewedPath, "utf8");
  const reportDoc = fs.readFileSync(reportPath, "utf8");

  const changes = parseRelatorioJuridico(reportDoc);
  console.log(`[Carga] Total de alterações extraídas do relatório: ${changes.length}`);
  assert.strictEqual(changes.length, 17, "Relatório do Dia 1 deve ter 17 alterações.");

  // CENÁRIO 1: Validação Inicial do Dia 1 (Divergências detectadas)
  console.log("\n--- Cenário 1: Diagnóstico inicial de pendências do Dia 1 ---");
  const initialIntegrity = validateEditorialIntegrity(originalDoc, reviewedDoc, changes, {
    verificationLevel: "VERIFICADO_COM_FONTES",
  });

  assert.strictEqual(initialIntegrity.status, "EDITORIAL_REVIEW_INCOMPLETE");
  assert.strictEqual(initialIntegrity.passed, false);
  assert.strictEqual(initialIntegrity.problematicChanges.length, 5);
  assert.deepStrictEqual(initialIntegrity.problematicChanges.sort(), ["CHG-001", "CHG-006", "CHG-007", "CHG-010", "CHG-012"].sort());
  console.log(`✓ 5 pendências confirmadas no estado inicial: ${initialIntegrity.problematicChanges.join(", ")}`);

  // Montar Repositório e Revisão inicial
  const lessonId = "day_1_part_0";
  const initialLesson: StoredCatalogLesson = {
    id: lessonId,
    day: 1,
    part: 0,
    subject: "Constituição Federal",
    content: originalDoc,
    approvedAt: 1000,
    version: 1,
  };
  const repo = createInMemoryRepository(initialLesson);

  const reviewId = "rev_day1_human_resolution_test";
  const initialReview: LegalReviewView = {
    id: reviewId,
    lessonId,
    day: 1,
    part: 0,
    subject: "Constituição Federal",
    topic: "Princípios Fundamentais",
    originalHash: hashCatalogSnapshot(initialLesson),
    originalApprovedAt: initialLesson.approvedAt || null,
    originalContent: originalDoc,
    reviewedMarkdown: reviewedDoc,
    changes,
    unverifiedClaims: [],
    summary: {
      totalChanges: changes.length,
      corrections: 3,
      additions: 1,
      removals: 2,
      updates: 4,
      precisions: 2,
      restructures: 0,
    },
    reviewNotes: "Revisão jurídica real do Dia 1",
    verificationLevel: "VERIFICADO_COM_FONTES",
    confidence: "ALTA",
    outcome: "ALTERACOES_NECESSARIAS",
    status: "pending_approval",
    model: "gpt-5.6",
    reviewDate: "2026-10-07",
    requestedByUid: TEST_UID,
    requestedAt: 2000,
    webSearchUsed: true,
    testMode: false,
    consultedSources: [],
    manuallyEdited: false,
    candidateHash: hashLessonContent(reviewedDoc),
    auditedCandidateHash: hashLessonContent(reviewedDoc),
    sourceHistory: [],
    editorialIntegrity: initialIntegrity,
  };
  await repo.begin(initialReview);

  // CENÁRIO 2: Tentativa de aprovação com pendências ativas deve ser estritamente bloqueada
  console.log("\n--- Cenário 2: Bloqueio estrito de aprovação antes da resolução ---");
  await assert.rejects(
    async () => {
      await approveLegalReview(repo, reviewId, TEST_UID, CEO_EMAIL);
    },
    (err: any) => {
      assert.ok(err instanceof LegalReviewError);
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("A aprovação está bloqueada por integridade editorial incompleta"));
      return true;
    }
  );
  console.log("✓ Aprovação bloqueada com código 400 enquanto houver pendências.");

  // CENÁRIO 3: Controle de Acesso — Rejeição a usuário não-CEO
  console.log("\n--- Cenário 3: Controle de acesso (Somente CEO pode deliberar) ---");
  await assert.rejects(
    async () => {
      await resolveHumanLegalReviewChange(repo, reviewId, {
        changeId: "CHG-001",
        action: "APPLY",
      }, "uid_aluno", NON_CEO_EMAIL);
    },
    (err: any) => {
      assert.strictEqual(err.status, 403);
      assert.ok(err.message.includes("identidade autenticada do CEO"));
      return true;
    }
  );
  console.log("✓ Acesso não autorizado rejeitado com código 403.");

  // CENÁRIO 4: Resolução de CHG-001 (Percentuais estatísticos) via Ação A (Aplicar proposta)
  console.log("\n--- Cenário 4: Resolução de CHG-001 (Ação A — Aplicar Proposta) ---");
  let updatedReview = await resolveHumanLegalReviewChange(repo, reviewId, {
    changeId: "CHG-001",
    action: "APPLY",
  }, TEST_UID, CEO_EMAIL);

  assert.strictEqual(updatedReview.humanDecisions?.["CHG-001"]?.state, "APPLIED_BY_CEO");
  const chg1Result = updatedReview.editorialIntegrity?.changeResults.find(r => r.changeId === "CHG-001");
  assert.strictEqual(chg1Result?.status, "APPLIED");
  assert.strictEqual(chg1Result?.resolutionState, "APPLIED_BY_CEO");
  assert.ok(!updatedReview.editorialIntegrity?.problematicChanges.includes("CHG-001"));
  console.log("✓ CHG-001 resolvido como APPLIED_BY_CEO e removido das problemáticas.");

  // CENÁRIO 5: Resolução de CHG-006 (Título da Seção de Asilo) via Ação A (Aplicar proposta)
  console.log("\n--- Cenário 5: Resolução de CHG-006 (Ação A — Aplicar Proposta) ---");
  updatedReview = await resolveHumanLegalReviewChange(repo, reviewId, {
    changeId: "CHG-006",
    action: "APPLY",
  }, TEST_UID, CEO_EMAIL);

  assert.strictEqual(updatedReview.humanDecisions?.["CHG-006"]?.state, "APPLIED_BY_CEO");
  const chg6Result = updatedReview.editorialIntegrity?.changeResults.find(r => r.changeId === "CHG-006");
  assert.strictEqual(chg6Result?.status, "APPLIED");
  assert.strictEqual(chg6Result?.resolutionState, "APPLIED_BY_CEO");
  assert.ok(!updatedReview.editorialIntegrity?.problematicChanges.includes("CHG-006"));
  console.log("✓ CHG-006 resolvido como APPLIED_BY_CEO.");

  // CENÁRIO 6: Segurança contra patches ambíguos em CHG-007 (Múltiplas ocorrências)
  console.log("\n--- Cenário 6: Segurança contra substituição global / ambígua em CHG-007 ---");
  await assert.rejects(
    async () => {
      // CHG-007 possui 3 ocorrências no texto sem antes/depois especificados. A aplicação automática deve recusar.
      await resolveHumanLegalReviewChange(repo, reviewId, {
        changeId: "CHG-007",
        action: "APPLY",
      }, TEST_UID, CEO_EMAIL);
    },
    (err: any) => {
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("possui 3 ocorrências") || err.message.includes("não pôde ser desambiguado"));
      return true;
    }
  );
  console.log("✓ Patch ambíguo de CHG-007 recusado deterministamente.");

  // CENÁRIO 7: Rejeição com justificativa obrigatória em CHG-007 (Ação C)
  console.log("\n--- Cenário 7: Rejeição formal com justificativa obrigatória (Ação C) ---");
  // Tentativa sem justificativa
  await assert.rejects(
    async () => {
      await resolveHumanLegalReviewChange(repo, reviewId, {
        changeId: "CHG-007",
        action: "REJECT",
        rejectionReason: "   ",
      }, TEST_UID, CEO_EMAIL);
    },
    (err: any) => {
      assert.strictEqual(err.status, 400);
      assert.ok(err.message.includes("justificativa é obrigatória"));
      return true;
    }
  );
  console.log("✓ Rejeição sem justificativa recusada com 400.");

  // Rejeição formal válida
  const rejectionReason = "Rejeitado pelo CEO por ausência de precedente unívoco do STF Plenário e duplicidade conceitual mantida na contextualização doutrinária.";
  updatedReview = await resolveHumanLegalReviewChange(repo, reviewId, {
    changeId: "CHG-007",
    action: "REJECT",
    rejectionReason,
  }, TEST_UID, CEO_EMAIL);

  assert.strictEqual(updatedReview.humanDecisions?.["CHG-007"]?.state, "REJECTED_BY_CEO");
  const chg7Result = updatedReview.editorialIntegrity?.changeResults.find(r => r.changeId === "CHG-007");
  assert.strictEqual(chg7Result?.status, "REJECTED");
  assert.strictEqual(chg7Result?.resolutionState, "REJECTED_BY_CEO");
  assert.strictEqual(chg7Result?.applied, false, "Alteração rejeitada NÃO pode contar como aplicada.");
  assert.ok(!updatedReview.editorialIntegrity?.problematicChanges.includes("CHG-007"), "Rejeitada não deve constar como problemática.");
  console.log("✓ CHG-007 rejeitado formalmente, registrado com justificativa e resolvido.");

  // CENÁRIO 8: Coordenação Conjunta da Questão q7 (CHG-010 e CHG-012)
  console.log("\n--- Cenário 8: Coordenação de Questões do Desafio (CHG-010 e CHG-012) ---");
  const questionGroups = findQuestionCoordinationGroups(
    updatedReview.reviewedMarkdown,
    updatedReview.changes,
    updatedReview.editorialIntegrity?.problematicChanges || []
  );

  assert.ok(questionGroups.length > 0, "Deve encontrar grupo de questões no desafio.");
  const q7Group = questionGroups.find(g => g.changeIds.includes("CHG-010") && g.changeIds.includes("CHG-012"));
  assert.ok(q7Group, "Grupo da Questão q7 deve conter CHG-010 e CHG-012.");
  console.log(`✓ Grupo identificado: Questão ${q7Group.questionIndex + 1} (${q7Group.questionId}) com alterações ${q7Group.changeIds.join(", ")}`);

  // Executar patch coordenado conjunto mantendo integridade JSON do desafio
  const updatedQuestion = {
    text: "Quanto à concessão de asilo político (Art. 4º, X, da CF/88) e ao seu regime jurídico, é correto afirmar:",
    options: [...q7Group.options], // options[0] já continha a alteração de CHG-011
    correctIndex: q7Group.correctIndex,
    explanation: "A alternativa A está correta, pois o art. 27 da Lei nº 13.445/2017 define o asilo político como ato discricionário do Estado, diplomático ou territorial, outorgado como instrumento de proteção à pessoa. As demais alternativas atribuem revisão integral de mérito, competência exclusiva ao Ministério das Relações Exteriores ou concessão automática, afirmações sem amparo no regime legal indicado.",
  };

  updatedReview = await resolveHumanCoordinatedQuestion(repo, reviewId, {
    questionIndex: q7Group.questionIndex,
    changeIds: ["CHG-010", "CHG-012"],
    question: updatedQuestion,
  }, TEST_UID, CEO_EMAIL);

  assert.strictEqual(updatedReview.humanDecisions?.["CHG-010"]?.state, "EDITED_BY_CEO");
  assert.strictEqual(updatedReview.humanDecisions?.["CHG-012"]?.state, "EDITED_BY_CEO");

  const chg10Result = updatedReview.editorialIntegrity?.changeResults.find(r => r.changeId === "CHG-010");
  const chg12Result = updatedReview.editorialIntegrity?.changeResults.find(r => r.changeId === "CHG-012");
  assert.strictEqual(chg10Result?.status, "APPLIED");
  assert.strictEqual(chg12Result?.status, "APPLIED");
  assert.strictEqual(chg10Result?.resolutionState, "EDITED_BY_CEO");
  assert.strictEqual(chg12Result?.resolutionState, "EDITED_BY_CEO");
  console.log("✓ Questão q7 coordenada atomicamente; CHG-010 e CHG-012 validadas como EDITED_BY_CEO.");

  // CENÁRIO 9: Validação Final e Desbloqueio da Aprovação
  console.log("\n--- Cenário 9: Resolução Completa e Desbloqueio de Aprovação ---");
  const finalIntegrity = updatedReview.editorialIntegrity;
  assert.ok(finalIntegrity, "Integridade final deve existir");
  console.log(`- Status final: ${finalIntegrity.status}`);
  console.log(`- Passed: ${finalIntegrity.passed}`);
  console.log(`- Problematic changes: ${finalIntegrity.problematicChanges.length}`);
  console.log(`- Total de alterações: ${finalIntegrity.totalChanges}`);
  console.log(`- Alterações aplicadas: ${finalIntegrity.appliedChanges}`);
  console.log(`- Alterações resolvidas pelo CEO: ${finalIntegrity.resolvedChangesCount}`);

  assert.strictEqual(finalIntegrity.problematicChanges.length, 0);
  assert.strictEqual(finalIntegrity.passed, true);
  assert.strictEqual(finalIntegrity.status, "EDITORIAL_REVIEW_SUCCESS");

  // Aprovação agora DEVE ter sucesso
  const approvalResult = await approveLegalReview(repo, reviewId, TEST_UID, CEO_EMAIL);
  assert.strictEqual(approvalResult.reviewId, reviewId);
  assert.strictEqual(approvalResult.lesson.status, "approved");
  assert.strictEqual(approvalResult.lesson.approvedBy, CEO_EMAIL);
  console.log("✓ Aprovação final pelo CEO concluída com sucesso!");

  // CENÁRIO 10: Rastreabilidade e Não-contaminação do Markdown publicado
  console.log("\n--- Cenário 10: Rastreabilidade e integridade do catálogo ---");
  const publishedDoc = approvalResult.lesson.content;
  // A decisão do CEO e o histórico não poluem o markdown do aluno
  assert.ok(!publishedDoc.includes("REJECTED_BY_CEO"), "Decisões de auditoria não devem poluir o Markdown do aluno.");
  assert.ok(!publishedDoc.includes("jhonny.spider@gmail.com"), "E-mail de aprovação não deve vazar no corpo do texto.");
  // Mas os trechos corrigidos constam no texto
  assert.ok(publishedDoc.includes("#### **3. Regime Jurídico do Asilo Político**"), "Novo título de seção deve constar no texto.");
  assert.ok(!publishedDoc.includes("75% de incidência histórica"), "Percentuais removidos não devem constar no texto.");
  console.log("✓ Markdown publicado está limpo, didaticamente íntegro e sem contaminação técnica.");

  console.log("\n================================================================================");
  console.log("TODOS OS 10 CENÁRIOS DE RESOLUÇÃO HUMANA PASSARAM COM SUCESSO!");
  console.log("================================================================================\n");
}

runHumanResolutionTestSuite().catch((err) => {
  console.error("FALHA NOS TESTES:", err);
  process.exit(1);
});
