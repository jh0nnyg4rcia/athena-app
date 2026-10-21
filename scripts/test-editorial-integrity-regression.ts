/**
 * ATHENA — SUÍTE DE TESTES OFFLINE DE REGRESSÃO DA INTEGRIDADE EDITORIAL
 * 
 * Verificação 100% determinística e offline:
 * - ZERO chamadas pagas (sem OpenAI, sem Gemini, sem Claude, sem rede).
 * - Utiliza os artefatos existentes de tmp/editorial-review-day1/ como caso de regressão.
 * - Testa todos os 9 cenários obrigatórios especificados no comando.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  validateEditorialIntegrity,
  isMaterialEditorialChange,
} from "../src/lib/legalReviewValidate.js";
import {
  type LegalReviewChange,
  type StoredCatalogLesson,
  type LegalReviewView,
} from "../src/lib/legalReviewTypes.js";
import {
  approveLegalReview,
} from "../src/services/legalReviewFlow.js";
import {
  LegalReviewError,
  type LegalReviewRepository,
} from "../src/services/legalReviewRepository.js";

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

function createMockRepository(initialLesson: StoredCatalogLesson): LegalReviewRepository & {
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
    async reject(reviewId: string, uid: string) {
      const current = reviews.get(reviewId);
      if (!current) throw new Error("not found");
      const updated: LegalReviewView = { ...current, status: "rejected" };
      reviews.set(reviewId, updated);
      return updated;
    },
    async saveCandidate(reviewId: string, markdown: string) {
      const current = reviews.get(reviewId);
      if (!current) throw new Error("not found");
      const updated: LegalReviewView = { ...current, reviewedMarkdown: markdown };
      reviews.set(reviewId, updated);
      return updated;
    },
    async approve(reviewId: string, uid: string, email: string) {
      const current = reviews.get(reviewId);
      if (!current) return { ok: false, conflict: true };
      const updatedLesson: StoredCatalogLesson = {
        ...initialLesson,
        content: current.reviewedMarkdown,
        approvedBy: email,
        version: (initialLesson.version || 1) + 1,
      };
      lessons.set(current.lessonId, updatedLesson);
      return { ok: true, conflict: false, lesson: updatedLesson };
    },
  };
}

async function runRegressionSuite() {
  console.log("================================================================================");
  console.log("ATHENA — TESTES OFFLINE DE REGRESSÃO DA INTEGRIDADE EDITORIAL");
  console.log("================================================================================");

  // Snapshot inicial do catálogo oficial
  const seedsRawInitial = fs.readFileSync("src/data/homologatedSeeds.json", "utf8");
  const seedsInitialSha256 = crypto.createHash("sha256").update(seedsRawInitial, "utf8").digest("hex");

  // Carregar artefatos reais do Dia 1
  const origPath = path.join("tmp", "editorial-review-day1", "aula-original.md");
  const revPath = path.join("tmp", "editorial-review-day1", "aula-revisada.md");
  const repPath = path.join("tmp", "editorial-review-day1", "relatorio-juridico.md");

  assert.ok(fs.existsSync(origPath), "aula-original.md deve existir");
  assert.ok(fs.existsSync(revPath), "aula-revisada.md deve existir");
  assert.ok(fs.existsSync(repPath), "relatorio-juridico.md deve existir");

  const origContent = fs.readFileSync(origPath, "utf8");
  const revContent = fs.readFileSync(revPath, "utf8");
  const repContent = fs.readFileSync(repPath, "utf8");
  const day1Changes = parseRelatorioJuridico(repContent);

  assert.strictEqual(day1Changes.length, 17, "Devem ser exatamente 17 alterações no relatório");

  // ---------------------------------------------------------------------------
  // CENÁRIO 1: Alteração efetivamente aplicada
  // ---------------------------------------------------------------------------
  console.log("\n1. Testando: Alteração efetivamente aplicada...");
  const appliedChg = day1Changes.find((c) => c.id === "CHG-002");
  assert.ok(appliedChg, "CHG-002 deve existir");
  const singleAppliedResult = validateEditorialIntegrity(origContent, revContent, [appliedChg]);
  assert.strictEqual(singleAppliedResult.passed, true);
  assert.strictEqual(singleAppliedResult.status, "EDITORIAL_REVIEW_SUCCESS");
  assert.strictEqual(singleAppliedResult.changeResults[0].status, "APPLIED");
  assert.strictEqual(singleAppliedResult.changeResults[0].applied, true);
  console.log("   ✓ Cenário 1 aprovado: alteração aplicada reconhecida como APPLIED (status: EDITORIAL_REVIEW_SUCCESS).");

  // ---------------------------------------------------------------------------
  // CENÁRIO 2: Alteração ausente
  // ---------------------------------------------------------------------------
  console.log("\n2. Testando: Alteração ausente (CHG-001, CHG-006)...");
  const missingChg1 = day1Changes.find((c) => c.id === "CHG-001")!;
  const missingChg6 = day1Changes.find((c) => c.id === "CHG-006")!;
  assert.ok(missingChg1 && missingChg6);

  const missingResult1 = validateEditorialIntegrity(origContent, revContent, [missingChg1]);
  assert.strictEqual(missingResult1.passed, false);
  assert.strictEqual(missingResult1.status, "EDITORIAL_REVIEW_INCOMPLETE");
  assert.strictEqual(missingResult1.changeResults[0].status, "MISSING");
  assert.strictEqual(missingResult1.problematicChanges.includes("CHG-001"), true);

  const missingResult6 = validateEditorialIntegrity(origContent, revContent, [missingChg6]);
  assert.strictEqual(missingResult6.passed, false);
  assert.strictEqual(missingResult6.status, "EDITORIAL_REVIEW_INCOMPLETE");
  assert.strictEqual(missingResult6.changeResults[0].status, "MISSING");
  assert.strictEqual(missingResult6.problematicChanges.includes("CHG-006"), true);
  console.log("   ✓ Cenário 2 aprovado: alterações ausentes detectadas como MISSING (status: EDITORIAL_REVIEW_INCOMPLETE).");

  // ---------------------------------------------------------------------------
  // CENÁRIO 3: Alteração parcialmente aplicada
  // ---------------------------------------------------------------------------
  console.log("\n3. Testando: Alteração parcialmente aplicada...");
  const partialSampleOriginal = "O prazo para recurso é de 15 dias úteis nos termos da lei.";
  const partialSampleReviewed = "O prazo para recurso é de 15 dias."; // Alterou o original, mas omitiu parte da correção
  const partialChange: LegalReviewChange = {
    id: "CHG-PARTIAL-1",
    type: "CORRECAO",
    category: "LEGISLACAO",
    severity: "ALTA",
    originalExcerpt: "O prazo para recurso é de 15 dias úteis nos termos da lei.",
    revisedExcerpt: "O prazo para interposição de apelação é de 15 dias úteis, conforme o art. 1.003, § 5º, do CPC.",
    reason: "Especificação do dispositivo legal aplicável.",
    confirmation: "CONFIRMADO",
    verified: true,
    sources: [],
    evidence: [],
  };
  const partialResult = validateEditorialIntegrity(partialSampleOriginal, partialSampleReviewed, [partialChange]);
  assert.strictEqual(partialResult.passed, false);
  assert.strictEqual(partialResult.status, "EDITORIAL_REVIEW_INCOMPLETE");
  assert.strictEqual(partialResult.changeResults[0].status, "PARTIALLY_APPLIED");
  assert.strictEqual(partialResult.problematicChanges.includes("CHG-PARTIAL-1"), true);
  console.log("   ✓ Cenário 3 aprovado: divergência e aplicação parcial detectadas como PARTIALLY_APPLIED.");

  // ---------------------------------------------------------------------------
  // CENÁRIO 4: Trecho original repetido
  // ---------------------------------------------------------------------------
  console.log("\n4. Testando: Trecho original repetido com desambiguação por contexto...");
  const repeatedSampleOriginal = `Parte 1: O prazo é de 5 dias.\nParte 2: O prazo é de 5 dias.`;
  const repeatedSampleReviewed = `Parte 1: O prazo é de 5 dias.\nParte 2: O prazo é de 10 dias úteis.`;
  const repeatedChangeWithContext: LegalReviewChange = {
    id: "CHG-REP-1",
    type: "CORRECAO",
    category: "LEGISLACAO",
    severity: "MEDIA",
    originalExcerpt: "O prazo é de 5 dias.",
    revisedExcerpt: "O prazo é de 10 dias úteis.",
    beforeContext: "Parte 2: ",
    afterContext: "",
    reason: "Correção específica do prazo da Parte 2.",
    confirmation: "CONFIRMADO",
    verified: true,
    sources: [],
    evidence: [],
  };
  const repeatedResult = validateEditorialIntegrity(repeatedSampleOriginal, repeatedSampleReviewed, [repeatedChangeWithContext]);
  assert.strictEqual(repeatedResult.passed, true);
  assert.strictEqual(repeatedResult.status, "EDITORIAL_REVIEW_SUCCESS");
  assert.strictEqual(repeatedResult.changeResults[0].status, "APPLIED");
  console.log("   ✓ Cenário 4 aprovado: ocorrência repetida desambiguada por contexto validada com sucesso como APPLIED.");

  // ---------------------------------------------------------------------------
  // CENÁRIO 5: Patch ambíguo
  // ---------------------------------------------------------------------------
  console.log("\n5. Testando: Patch ambíguo (sem contexto discriminante)...");
  const ambiguousChangeWithoutContext: LegalReviewChange = {
    id: "CHG-AMB-1",
    type: "CORRECAO",
    category: "LEGISLACAO",
    severity: "MEDIA",
    originalExcerpt: "O prazo é de 5 dias.",
    revisedExcerpt: "O prazo é de 10 dias úteis.",
    beforeContext: "",
    afterContext: "",
    reason: "Correção sem especificar qual das ocorrências.",
    confirmation: "CONFIRMADO",
    verified: true,
    sources: [],
    evidence: [],
  };
  const ambiguousResult = validateEditorialIntegrity(repeatedSampleOriginal, repeatedSampleReviewed, [ambiguousChangeWithoutContext]);
  assert.strictEqual(ambiguousResult.passed, false);
  assert.strictEqual(ambiguousResult.status, "EDITORIAL_REVIEW_INCOMPLETE");
  assert.strictEqual(ambiguousResult.changeResults[0].status, "AMBIGUOUS");
  assert.strictEqual(ambiguousResult.problematicChanges.includes("CHG-AMB-1"), true);
  console.log("   ✓ Cenário 5 aprovado: patch ambíguo rejeitado sem tentativa de reaplicação cega.");

  // ---------------------------------------------------------------------------
  // CENÁRIO 6: Alteração em questão estruturada
  // ---------------------------------------------------------------------------
  console.log("\n6. Testando: Alteração em questão estruturada (CHG-010, CHG-011, CHG-012)...");
  const q10 = day1Changes.find((c) => c.id === "CHG-010")!;
  const q11 = day1Changes.find((c) => c.id === "CHG-011")!;
  const q12 = day1Changes.find((c) => c.id === "CHG-012")!;

  const qResult = validateEditorialIntegrity(origContent, revContent, [q10, q11, q12]);
  assert.strictEqual(qResult.passed, false);
  assert.strictEqual(qResult.status, "EDITORIAL_REVIEW_INCOMPLETE");

  const r10 = qResult.changeResults.find((r) => r.changeId === "CHG-010")!;
  const r11 = qResult.changeResults.find((r) => r.changeId === "CHG-011")!;
  const r12 = qResult.changeResults.find((r) => r.changeId === "CHG-012")!;

  assert.strictEqual(r10.status, "MISSING", "Enunciado da questão deve ser MISSING");
  assert.strictEqual(r11.status, "APPLIED", "Alternativa A da questão deve ser APPLIED");
  assert.strictEqual(r12.status, "MISSING", "Explicação da questão deve ser MISSING");

  console.log("   ✓ Cenário 6 aprovado: incoerência estrutural na questão detectada (enunciado e explicação ausentes, alternativa A aplicada).");

  // ---------------------------------------------------------------------------
  // CENÁRIO 7: Relatório inconsistente com Markdown (Regressão real do Dia 1)
  // ---------------------------------------------------------------------------
  console.log("\n7. Testando: Relatório inconsistente com Markdown (caso real Dia 1)...");
  const day1FullResult = validateEditorialIntegrity(origContent, revContent, day1Changes, {
    verificationLevel: "VERIFICACAO_PARCIAL",
    technicalExecutionCompleted: true,
  });

  assert.strictEqual(day1FullResult.executionCompleted, true);
  assert.strictEqual(day1FullResult.editorialIntegrityPassed, false);
  assert.strictEqual(day1FullResult.legalVerificationPassed, false);
  assert.strictEqual(day1FullResult.status, "EDITORIAL_REVIEW_INCOMPLETE");
  assert.strictEqual(day1FullResult.appliedChanges, 12);
  assert.strictEqual(day1FullResult.problematicChanges.length, 5);

  const expectedProblematic = ["CHG-001", "CHG-006", "CHG-007", "CHG-010", "CHG-012"];
  for (const exp of expectedProblematic) {
    assert.ok(
      day1FullResult.problematicChanges.includes(exp),
      `Alteração ${exp} deve constar na lista de problemáticas`
    );
  }

  console.log(`   ✓ Cenário 7 aprovado: 12 aplicadas e 5 problemáticas detectadas (${day1FullResult.problematicChanges.join(", ")}).`);
  console.log("     - Execução técnica concluída: SIM");
  console.log("     - Integridade editorial aprovada: NÃO (EDITORIAL_REVIEW_INCOMPLETE)");
  console.log("     - Verificação jurídica aprovada: NÃO (VERIFICACAO_PARCIAL)");

  // ---------------------------------------------------------------------------
  // CENÁRIO 8: Bloqueio de aprovação
  // ---------------------------------------------------------------------------
  console.log("\n8. Testando: Bloqueio de aprovação no backend...");
  const mockLesson: StoredCatalogLesson = {
    id: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Constituição Federal",
    content: origContent,
    version: 1,
  };
  const mockRepo = createMockRepository(mockLesson);

  const incompleteReview: LegalReviewView = {
    id: "rev-day1-incomplete",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Constituição Federal",
    topic: "Direito Constitucional",
    originalHash: "dummy-hash",
    originalApprovedAt: null,
    originalContent: origContent,
    reviewedMarkdown: revContent,
    changes: day1Changes,
    unverifiedClaims: [],
    summary: {
      totalChanges: 17,
      corrections: 10,
      additions: 0,
      removals: 2,
      updates: 0,
      precisions: 5,
      restructures: 0,
    },
    reviewNotes: "Revisão do Dia 1",
    verificationLevel: "VERIFICACAO_PARCIAL",
    confidence: "MEDIA",
    outcome: "ALTERACOES_NECESSARIAS",
    status: "pending_approval",
    model: "gpt-5.6-sol",
    reviewDate: "07/10/2026",
    requestedByUid: "ceo-uid",
    requestedAt: Date.now(),
    webSearchUsed: true,
    testMode: false,
    consultedSources: [],
    manuallyEdited: false,
    candidateHash: "dummy-cand-hash",
    auditedCandidateHash: "dummy-cand-hash",
    sourceHistory: [],
    editorialIntegrity: day1FullResult,
  };
  mockRepo.reviews.set(incompleteReview.id, incompleteReview);

  let approvalBlocked = false;
  let blockErrorMessage = "";
  try {
    await approveLegalReview(mockRepo, incompleteReview.id, "ceo-uid", "jhonny.spider@gmail.com");
  } catch (err: any) {
    if (err instanceof LegalReviewError && err.status === 400) {
      approvalBlocked = true;
      blockErrorMessage = err.message;
    }
  }

  assert.strictEqual(approvalBlocked, true, "Aprovação deve ser bloqueada com status 400");
  assert.ok(
    blockErrorMessage.includes("integridade editorial incompleta"),
    `Mensagem de erro deve indicar integridade editorial incompleta: ${blockErrorMessage}`
  );
  console.log(`   ✓ Cenário 8 aprovado: aprovação bloqueada com sucesso pelo backend: "${blockErrorMessage}".`);

  // ---------------------------------------------------------------------------
  // CENÁRIO 9: Preservação integral da aula original
  // ---------------------------------------------------------------------------
  console.log("\n9. Testando: Preservação integral da aula original...");
  const lessonInCatalog = await mockRepo.getLesson("day_1_part_0");
  assert.strictEqual(lessonInCatalog?.content, origContent, "Conteúdo no repositório deve permanecer idêntico ao original");
  assert.strictEqual(lessonInCatalog?.version, 1, "Versão do catálogo não deve ter sido incrementada");

  const seedsRawPost = fs.readFileSync("src/data/homologatedSeeds.json", "utf8");
  const seedsPostSha256 = crypto.createHash("sha256").update(seedsRawPost, "utf8").digest("hex");
  assert.strictEqual(seedsPostSha256, seedsInitialSha256, "src/data/homologatedSeeds.json deve permanecer byte-a-byte idêntico");
  console.log("   ✓ Cenário 9 aprovado: aula original e catálogo oficial permanecem 100% inalterados.");

  console.log("\n================================================================================");
  console.log("TODOS OS 9 CENÁRIOS DE INTEGRIDADE EDITORIAL FORAM APROVADOS COM SUCESSO!");
  console.log("================================================================================");
}

runRegressionSuite().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
