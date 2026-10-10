/**
 * ATHENA — ETAPA 20.6.12: AUDITORIA ADVERSARIAL DA RECONCILIAÇÃO
 *
 * MODO: 100% OFFLINE / ISOLAMENTO COMPLETO (ZERO GRAVAÇÕES EM PRODUÇÃO)
 *
 * Esta suíte de testes adversariais valida sistematicamente os 10 cenários
 * de segurança, ataque, concorrência e integridade transacional da reconciliação:
 *
 * Cenário 1: Imutabilidade estrita do originalHash histórico.
 * Cenário 2: Autenticação, autorização CEO e validações de entrada em POST /reconcile.
 * Cenário 3: Cotejo autoritativo do backend vs diffSummary manipulado pelo cliente.
 * Cenário 4: Bloqueio fail-closed para divergências jurídicas materiais (<50 chars ou sem anuência).
 * Cenário 5: Concorrência de hashes (expectedCandidateHash, expectedDecisionStateHash, expectedCatalogHash).
 * Cenário 6: Catálogo alterado após a reconciliação -> bloqueio de homologação.
 * Cenário 7: Deliberação retificada ou aditamento (ADD) superveniente após reconciliação -> invalidação.
 * Cenário 8: Idempotência estrita (duas chamadas idênticas não duplicam histórico).
 * Cenário 9: Bloqueio de homologação sem encerramento formal válido do Estágio B.
 * Cenário 10: Catálogo revertido ao originalHash histórico -> homologação limpa permitida.
 */

import assert from "node:assert";
import {
  type LegalReviewView,
  type LegalReviewChange,
  type SupplementFindingItem,
  type HumanFindingDecision,
  type SupplementHumanResolution,
  type LegalReviewReconciliation,
  type LegalReviewAddendum,
} from "../src/lib/legalReviewTypes";
import {
  reconcileLegalReviewSnapshotFlow,
  getLatestLegalReviewFlow,
  getLegalReviewReconcilePreviewFlow,
  approveLegalReview,
} from "../src/services/legalReviewFlow";
import {
  hashCatalogSnapshot,
  type LegalReviewRepository,
  type StoredCatalogLesson,
} from "../src/services/legalReviewRepository";
import {
  computeDecisionStateHash,
  analyzeCatalogDivergence,
  validateReconciliationIntegrity,
  validateFindingsHomologation,
} from "../src/lib/legalReviewValidate";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider";

// SHA-256 fixos para teste determinístico
const HASH_ORIGINAL = "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0";
const HASH_CATALOG_V2 = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const HASH_CATALOG_V3 = "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
const HASH_CANDIDATE = "622e21647deb0000000000000000000000000000000000000000000000000000";

function createBaseMockChanges(): LegalReviewChange[] {
  const list: LegalReviewChange[] = [];
  for (let i = 1; i <= 13; i++) {
    const id = `CHG-${String(i).padStart(3, "0")}`;
    list.push({
      id,
      originalText: `Texto original trecho ${i}`,
      revisedText: `Texto revisado trecho ${i}`,
      originalExcerpt: `Texto original trecho ${i}`,
      revisedExcerpt: `Texto revisado trecho ${i}`,
      explanation: `Explicação ${i}`,
      category: "DOUTRINA",
      severity: "MEDIA",
      sources: [],
      evidence: [],
    });
  }
  list.push({
    id: "CHG-H-001",
    originalText: "A jurisprudência do STF estabelece balizas para a democracia militante.",
    revisedText: "Em precedentes relevantes, o STF reconheceu balizas para a salvaguarda do Estado Democrático de Direito.",
    originalExcerpt: "A jurisprudência do STF estabelece balizas para a democracia militante.",
    revisedExcerpt: "Em precedentes relevantes, o STF reconheceu balizas para a salvaguarda do Estado Democrático de Direito.",
    explanation: "Adequação jurisprudencial e doutrinária precisa conforme deliberação unverified_claim_2.",
    category: "JURISPRUDENCIA",
    severity: "ALTA",
    sources: [],
    evidence: [],
  });
  return list;
}

function createBaseFindingDecisions(reviewId: string): Record<string, HumanFindingDecision> {
  return {
    "chg_CHG-001": {
      findingKey: "chg_CHG-001",
      findingPendingId: "chg_CHG-001",
      findingChangeId: "CHG-001",
      reviewId,
      originalAiStatus: "confirmada",
      originalStatementAnalyzed: "Conceito constitucional de ato administrativo",
      action: "APONTAR_CORRECAO",
      state: "CORRECAO_NECESSARIA",
      justification: "Correção técnica vinculada e aprovada conforme CHG-001.",
      correctionChangeId: "CHG-001",
      candidateHashAtDecision: HASH_CANDIDATE,
      decidedAt: 1760000001000,
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    },
    "chg_CHG-002": {
      findingKey: "chg_CHG-002",
      findingPendingId: "chg_CHG-002",
      findingChangeId: "CHG-002",
      reviewId,
      originalAiStatus: "refutada",
      originalStatementAnalyzed: "Percentuais de incidência estatística no exame",
      action: "DECLARAR_NAO_COMPROVADO",
      state: "NAO_COMPROVADO",
      justification: "Percentuais expurgados do texto revisado por ausência de comprovação empírica.",
      expurgationConfirmed: true,
      candidateHashAtDecision: HASH_CANDIDATE,
      decidedAt: 1760000002000,
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    },
    "unverified_claim_1": {
      findingKey: "unverified_claim_1",
      findingPendingId: "unverified_claim_1",
      reviewId,
      originalAiStatus: "nao_verificada",
      originalStatementAnalyzed: "Autonomia municipal no pacto federativo brasileiro",
      action: "CONFIRMAR",
      state: "CONFIRMADO_PELO_CEO",
      justification: "Autonomia municipal fundada no art. 18 e 29 da CF/88.",
      evidenceDeclaration: {
        declaredSource: "Art. 18 e 29 da Constituição Federal de 1988",
        declaredUrl: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
        declaredExcerpt: "Art. 18. A organização político-administrativa...",
        documentaryVerified: true,
      },
      candidateHashAtDecision: HASH_CANDIDATE,
      decidedAt: 1760000003000,
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    },
    "unverified_claim_2": {
      findingKey: "unverified_claim_2",
      findingPendingId: "unverified_claim_2",
      reviewId,
      originalAiStatus: "nao_verificada",
      originalStatementAnalyzed: "Democracia militante e jurisprudência do STF",
      action: "APONTAR_CORRECAO",
      state: "CORRECAO_NECESSARIA",
      justification: "Correção supervisionada gravada como CHG-H-001.",
      correctionChangeId: "CHG-H-001",
      candidateHashAtDecision: HASH_CANDIDATE,
      decidedAt: 1760000004000,
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    },
    "unverified_claim_3": {
      findingKey: "unverified_claim_3",
      findingPendingId: "unverified_claim_3",
      reviewId,
      originalAiStatus: "nao_verificada",
      originalStatementAnalyzed: "Elementos da Constituição segundo José Afonso da Silva",
      action: "CONFIRMAR",
      state: "CONFIRMADO_PELO_CEO",
      justification: "Classificação quinquepartite canônica de José Afonso da Silva.",
      evidenceDeclaration: {
        declaredSource: "SILVA, José Afonso da. Curso de Direito Constitucional Positivo, Malheiros",
        bibliographicReference: "SILVA, José Afonso da. Curso de Direito Constitucional Positivo, Malheiros",
        documentaryVerified: true,
      },
      candidateHashAtDecision: HASH_CANDIDATE,
      decidedAt: 1760000005000,
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    },
  };
}

function createBaseFindings(): SupplementFindingItem[] {
  return [
    {
      pendingId: "chg_CHG-001",
      changeId: "CHG-001",
      statementAnalyzed: "Conceito constitucional de ato administrativo",
      officialSourceConsulted: "CF/88",
      verifiableUrl: "https://www.planalto.gov.br/cf88",
      relevantExcerptOrBasis: "Art. 37",
      status: "confirmada",
      objectiveJustification: "Análise da IA sobre CHG-001",
      foundOfficialEvidence: true,
    },
    {
      pendingId: "chg_CHG-002",
      changeId: "CHG-002",
      statementAnalyzed: "Percentuais de incidência estatística no exame",
      officialSourceConsulted: "FGV",
      verifiableUrl: "",
      relevantExcerptOrBasis: "",
      status: "refutada",
      objectiveJustification: "Análise da IA sobre CHG-002",
      foundOfficialEvidence: false,
    },
    {
      pendingId: "unverified_claim_1",
      statementAnalyzed: "Autonomia municipal no pacto federativo brasileiro",
      officialSourceConsulted: "CF/88",
      verifiableUrl: "",
      relevantExcerptOrBasis: "",
      status: "nao_verificada",
      objectiveJustification: "Análise da IA sobre unverified_claim_1",
      foundOfficialEvidence: false,
    },
    {
      pendingId: "unverified_claim_2",
      statementAnalyzed: "Democracia militante e jurisprudência do STF",
      officialSourceConsulted: "STF",
      verifiableUrl: "",
      relevantExcerptOrBasis: "",
      status: "nao_verificada",
      objectiveJustification: "Análise da IA sobre unverified_claim_2",
      foundOfficialEvidence: false,
    },
    {
      pendingId: "unverified_claim_3",
      statementAnalyzed: "Elementos da Constituição segundo José Afonso da Silva",
      officialSourceConsulted: "Doutrina",
      verifiableUrl: "",
      relevantExcerptOrBasis: "",
      status: "nao_verificada",
      objectiveJustification: "Análise da IA sobre unverified_claim_3",
      foundOfficialEvidence: false,
    },
  ];
}

function createMockReview(reviewId: string): LegalReviewView {
  const decisions = createBaseFindingDecisions(reviewId);
  const findings = createBaseFindings();
  const changes = createBaseMockChanges();

  const mockReview: LegalReviewView = {
    id: reviewId,
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    status: "pending_approval",
    originalHash: HASH_ORIGINAL,
    candidateHash: HASH_CANDIDATE,
    originalContent: "# Aula 1: Teoria Geral do Direito Constitucional\n\nTexto original com conteúdo normativo.",
    reviewedMarkdown: "# Aula 1: Teoria Geral do Direito Constitucional\n\nTexto revisado trecho 1 com conteúdo normativo e correções aplicadas.\n\nEm precedentes relevantes, o STF reconheceu balizas para a salvaguarda do Estado Democrático de Direito.",
    changes,
    unverifiedClaims: [],
    sources: [],
    verificationLevel: "HIGH",
    findingDecisions: decisions,
    supplement: {
      status: "completed",
      attemptCount: 1,
      attemptId: "att-1",
      startedAt: 1760000000000,
      completedAt: 1760000001000,
      requestedByUid: "uid_ceo",
      requestedByEmail: ATHENA_CEO_EMAIL,
      costEstimatedUsd: 0.02,
      tokensUsed: 1500,
      durationMs: 4500,
      targetedPendingItems: [],
      findings,
      finalNote: "Auditoria jurídica de complementação concluída.",
      resolution: {
        status: "RESOLVIDO_PELO_CEO",
        closedAt: 1760000006000,
        closedByUid: "uid_ceo",
        closedByEmail: ATHENA_CEO_EMAIL,
        overallJustification: "Encerramento formal do Estágio B pelo CEO com todas as deliberações convergentes.",
        candidateHashAtClosure: HASH_CANDIDATE,
        decisionStateHashAtClosure: "", // será preenchido abaixo
      },
    },
    reconciliationHistory: [],
    addenda: [],
  };

  const decHash = computeDecisionStateHash(mockReview);
  if (mockReview.supplement?.resolution) {
    mockReview.supplement.resolution.decisionStateHashAtClosure = decHash;
  }
  return mockReview;
}

class InMemoryLegalReviewRepository implements LegalReviewRepository {
  private reviews = new Map<string, LegalReviewView>();
  private lessons = new Map<string, StoredCatalogLesson>();

  setReview(review: LegalReviewView) {
    this.reviews.set(review.id, JSON.parse(JSON.stringify(review)));
  }

  setLesson(lesson: StoredCatalogLesson) {
    this.lessons.set(lesson.id, JSON.parse(JSON.stringify(lesson)));
  }

  async get(id: string): Promise<LegalReviewView | null> {
    const found = this.reviews.get(id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async getLesson(id: string): Promise<StoredCatalogLesson | null> {
    const found = this.lessons.get(id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async getIndex(lessonId: string): Promise<any> {
    const rev = Array.from(this.reviews.values()).find((r) => r.lessonId === lessonId);
    return {
      lessonId,
      processingReviewId: null,
      processingStartedAt: null,
      approvedHash: null,
      approvedReviewId: null,
      approvedReviewDate: null,
      latestReviewId: rev?.id || null,
      latestStatus: rev?.status || null,
    };
  }

  async updateLesson(lesson: StoredCatalogLesson): Promise<void> {
    this.lessons.set(lesson.id, JSON.parse(JSON.stringify(lesson)));
  }

  async reconcileReviewCatalogSnapshot(
    reviewId: string,
    reconciliation: LegalReviewReconciliation,
    now: number
  ): Promise<LegalReviewView> {
    const current = await this.get(reviewId);
    if (!current) throw new Error("Revisão não encontrada.");

    // IDEMPOTÊNCIA ESTRITA: se a reconciliação ativa for idêntica, retorna sem duplicar histórico
    if (current.reconciliation && current.reconciliation.status === "RECONCILED_BY_CEO") {
      const active = current.reconciliation;
      const sameCatalog = active.reconciledCatalogHash === reconciliation.reconciledCatalogHash;
      const sameCandidate = active.candidateHashAtReconciliation === reconciliation.candidateHashAtReconciliation;
      const sameDecisions = active.decisionStateHashAtReconciliation === reconciliation.decisionStateHashAtReconciliation;
      const sameJust = active.justification.trim() === reconciliation.justification.trim();
      if (sameCatalog && sameCandidate && sameDecisions && sameJust) {
        return current;
      }
    }

    const priorHistory = [...(current.reconciliationHistory || [])];
    if (current.reconciliation) {
      priorHistory.push(current.reconciliation);
    }

    const updated: LegalReviewView = {
      ...current,
      reconciliation,
      reconciliationHistory: priorHistory,
    };
    this.reviews.set(reviewId, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  async approve(reviewId: string, approvedMarkdown: string, now: number): Promise<LegalReviewView> {
    const current = await this.get(reviewId);
    if (!current) throw new Error("Revisão não encontrada.");
    const lesson = await this.getLesson(current.lessonId);
    if (!lesson) throw new Error("Aula não encontrada.");

    const currentCatalogHash = hashCatalogSnapshot(lesson);
    const matchesOriginal = current.originalHash === currentCatalogHash;

    if (!matchesOriginal) {
      if (!current.reconciliation) {
        throw new Error(
          "Não é possível aprovar uma revisão jurídica cujo snapshot divirja do catálogo oficial atual sem reconciliação prévia auditada."
        );
      }
      const integrity = validateReconciliationIntegrity(current, currentCatalogHash);
      if (!integrity.valid) {
        throw new Error(`Reconciliação inválida: ${integrity.reason}`);
      }
    }

    const homologationValidation = validateFindingsHomologation(current);
    if (!homologationValidation.ok) {
      throw new Error(`Homologação bloqueada: ${homologationValidation.failureReasons.join("; ")}`);
    }

    const updated: LegalReviewView = {
      ...current,
      status: "approved",
      reviewedMarkdown: approvedMarkdown,
    };
    this.reviews.set(reviewId, updated);
    return JSON.parse(JSON.stringify(updated));
  }
}

// =============================================================================
// EXECUÇÃO DA BATERIA ADVERSARIAL DE TESTES OFFLINE
// =============================================================================

async function runAdversarialTestSuite() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 20.6.12: AUDITORIA ADVERSARIAL DA RECONCILIAÇÃO SEGURA");
  console.log("MODO: 100% OFFLINE / ISOLAMENTO COMPLETO (ZERO GRAVAÇÕES EM PRODUÇÃO)");
  console.log("================================================================================\n");

  const repo = new InMemoryLegalReviewRepository();
  const reviewId = "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008";

  // Conteúdo base do snapshot original
  const originalSnapshotText = "# Aula 1: Teoria Geral do Direito Constitucional\n\nTexto original com conteúdo normativo conforme art. 1º da CF/88.";

  // Catálogo inicial: mesmo conteúdo, porém com formatação alterada (espaços e markdown)
  const catalogFormattingOnlyText = "# Aula 1: Teoria Geral do Direito Constitucional  \n\nTexto original com conteúdo normativo conforme art. 1º da CF/88.  ";

  // Catálogo com alteração jurídica material (novo dispositivo legal adicionado)
  const catalogMaterialDivergenceText = "# Aula 1: Teoria Geral do Direito Constitucional\n\nTexto original alterado contendo expressamente a Lei 14.133/2021 e art. 37 da CF/88 não previstos no snapshot original.";

  const lessonBase: StoredCatalogLesson = {
    id: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Constitucional",
    topic: "Teoria Geral",
    content: catalogFormattingOnlyText,
    challenge: "Questão teste",
    approvedAt: "2026-10-10T00:00:00.000Z",
    version: 2,
  };

  // ---------------------------------------------------------------------------
  // CENÁRIO 1: Imutabilidade Estrita do originalHash Histórico
  // ---------------------------------------------------------------------------
  console.log("TESTE 1: Confirmação de que 'originalHash' histórico NUNCA é sobrescrito");
  {
    const review = createMockReview(reviewId);
    repo.setReview(review);
    repo.setLesson(lessonBase);

    const catalogHash = hashCatalogSnapshot(lessonBase);
    const reconciled = await reconcileLegalReviewSnapshotFlow(
      repo,
      reviewId,
      {
        expectedCatalogHash: catalogHash,
        justification: "Justificativa válida do CEO com mais de 15 caracteres para teste.",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    assert.strictEqual(
      reconciled.originalHash,
      HASH_ORIGINAL,
      "originalHash histórico foi adulterado! Violação crítica de integridade."
    );
    assert.strictEqual(
      reconciled.reconciliation?.historicalOriginalHash,
      HASH_ORIGINAL,
      "Registro de reconciliação não salvou o originalHash histórico correto."
    );
    console.log("  ✓ SUCESSO: originalHash permaneceu inviolável e permanentemente preservado.\n");
  }

  // ---------------------------------------------------------------------------
  // CENÁRIO 2: Validação de Autenticação, Autorização e Formato de Entrada
  // ---------------------------------------------------------------------------
  console.log("TESTE 2: Autenticação, autorização CEO e validações de entrada em POST /reconcile");
  {
    const review = createMockReview(reviewId);
    repo.setReview(review);
    repo.setLesson(lessonBase);
    const catalogHash = hashCatalogSnapshot(lessonBase);

    // 2.1 Rejeição para não-CEO
    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          reviewId,
          {
            expectedCatalogHash: catalogHash,
            justification: "Justificativa válida com tamanho suficiente.",
          },
          "uid_intruder",
          "intruder@empresa.com"
        );
      },
      /exige a identidade autenticada do ceo/i,
      "Deveria ter barrado usuário não-CEO com HTTP 403."
    );

    // 2.2 Rejeição para expectedCatalogHash inválido ou malformado
    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          reviewId,
          {
            expectedCatalogHash: "hash_curto_invalido",
            justification: "Justificativa válida com tamanho suficiente.",
          },
          "uid_ceo",
          ATHENA_CEO_EMAIL
        );
      },
      /sha-256 de 64 caracteres/i,
      "Deveria ter rejeitado expectedCatalogHash fora do padrão sha256."
    );

    // 2.3 Rejeição para justificativa insuficiente (< 15 caracteres)
    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          reviewId,
          {
            expectedCatalogHash: catalogHash,
            justification: "curta",
          },
          "uid_ceo",
          ATHENA_CEO_EMAIL
        );
      },
      /mínimo de 15 caracteres/i,
      "Deveria ter rejeitado justificativa menor que 15 caracteres."
    );

    console.log("  ✓ SUCESSO: Bloqueios de autorização CEO e parâmetros validados com rigor.\n");
  }

  // ---------------------------------------------------------------------------
  // CENÁRIO 3: Cotejo Autoritativo do Backend vs diffSummary Informado pelo Cliente
  // ---------------------------------------------------------------------------
  console.log("TESTE 3: Backend identifica diferenças de forma autoritativa e não confia em diff do cliente");
  {
    const review = createMockReview(reviewId);
    review.originalContent = originalSnapshotText;
    repo.setReview(review);

    const lessonModified: StoredCatalogLesson = {
      ...lessonBase,
      content: catalogFormattingOnlyText,
    };
    repo.setLesson(lessonModified);
    const currentHash = hashCatalogSnapshot(lessonModified);

    // A rota reconcilePreview expõe a verdade calculada pelo backend
    const preview = await getLegalReviewReconcilePreviewFlow(repo, reviewId, ATHENA_CEO_EMAIL);
    assert.strictEqual(typeof preview.totalHunks, "number", "Preview deve retornar totalHunks.");
    assert.strictEqual(preview.catalogHash, currentHash, "Preview deve computar hash autoritativo do catálogo.");

    // Ao reconciliar, o backend analisa por conta própria
    const reconciled = await reconcileLegalReviewSnapshotFlow(
      repo,
      reviewId,
      {
        expectedCatalogHash: currentHash,
        justification: "Justificativa substancial para conferência de diferenças pelo backend.",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    assert.ok(reconciled.reconciliation?.diffSummary, "diffSummary deve existir no registro de reconciliação.");
    assert.strictEqual(
      reconciled.reconciliation?.diffSummary.totalHunks,
      preview.totalHunks,
      "O diffSummary gravado deve corresponder à análise autoritativa do backend."
    );
    console.log("  ✓ SUCESSO: O backend calculou autoritativamente o comparativo de divergência.\n");
  }

  // ---------------------------------------------------------------------------
  // CENÁRIO 4: Bloqueio Fail-Closed para Divergência Jurídica Material
  // ---------------------------------------------------------------------------
  console.log("TESTE 4: Bloqueio fail-closed diante de divergência jurídica material no catálogo");
  {
    const review = createMockReview(reviewId);
    review.originalContent = originalSnapshotText;
    repo.setReview(review);

    const lessonMaterial: StoredCatalogLesson = {
      ...lessonBase,
      content: catalogMaterialDivergenceText,
    };
    repo.setLesson(lessonMaterial);
    const materialHash = hashCatalogSnapshot(lessonMaterial);

    // 4.1 Tentativa sem acknowledgeMaterialDivergence: fail-closed 400
    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          reviewId,
          {
            expectedCatalogHash: materialHash,
            justification: "Justificativa padrão para tentar reconciliar sem ciência expressa de materialidade.",
            acknowledgeMaterialDivergence: false,
          },
          "uid_ceo",
          ATHENA_CEO_EMAIL
        );
      },
      /divergência jurídica material detectada.*acknowledgeMaterialDivergence/i,
      "Deveria ter bloqueado divergência jurídica material sem anuência expressa."
    );

    // 4.2 Tentativa com acknowledgeMaterialDivergence: true, mas justificativa < 50 caracteres: fail-closed 400
    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          reviewId,
          {
            expectedCatalogHash: materialHash,
            justification: "Justificativa curta com menos de 50 caracteres.",
            acknowledgeMaterialDivergence: true,
          },
          "uid_ceo",
          ATHENA_CEO_EMAIL
        );
      },
      /mínimo de 50 caracteres/i,
      "Deveria ter exigido no mínimo 50 caracteres para divergência jurídica material."
    );

    // 4.3 Tentativa com acknowledgeMaterialDivergence: true E justificativa >= 50 caracteres: SUCESSO
    const validJustification50 = "Atesto formalmente que a inserção superveniente da Lei 14.133/2021 no catálogo não altera o mérito constitucional das correções deliberadas.";
    const reconciledMaterial = await reconcileLegalReviewSnapshotFlow(
      repo,
      reviewId,
      {
        expectedCatalogHash: materialHash,
        justification: validJustification50,
        acknowledgeMaterialDivergence: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    assert.strictEqual(
      reconciledMaterial.reconciliation?.diffSummary.materialChangesDetected,
      true,
      "Deveria ter registrado a detecção de alterações materiais no histórico."
    );
    console.log("  ✓ SUCESSO: Fail-closed impediu reconciliação cega e exigiu comprovação substancial (>=50 chars).\n");
  }

  // ---------------------------------------------------------------------------
  // CENÁRIO 5: Concorrência e Integridade de Hashes (409 Conflict)
  // ---------------------------------------------------------------------------
  console.log("TESTE 5: Verificação de concorrência de hashes (expectedCandidate, expectedDecision, expectedCatalog)");
  {
    const review = createMockReview(reviewId);
    repo.setReview(review);
    repo.setLesson(lessonBase);
    const validCatalogHash = hashCatalogSnapshot(lessonBase);
    const validCandidateHash = review.candidateHash || "";
    const validDecisionStateHash = computeDecisionStateHash(review);

    // 5.1 Catálogo sofreu mutação antes da chamada (expectedCatalogHash desatualizado)
    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          reviewId,
          {
            expectedCatalogHash: "0000000000000000000000000000000000000000000000000000000000000000",
            justification: "Justificativa de teste com tamanho adequado para passar validação simples.",
          },
          "uid_ceo",
          ATHENA_CEO_EMAIL
        );
      },
      /o catálogo foi alterado após a conferência/i,
      "Deveria ter rejeitado com 409 quando expectedCatalogHash diverge do catálogo real."
    );

    // 5.2 Texto candidato editado concorrentemente (expectedCandidateHash obsoleto)
    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          reviewId,
          {
            expectedCatalogHash: validCatalogHash,
            expectedCandidateHash: "hash_candidato_antigo_000000000000000000000000000000000000000000000000",
            justification: "Justificativa de teste com tamanho adequado para passar validação simples.",
          },
          "uid_ceo",
          ATHENA_CEO_EMAIL
        );
      },
      /o texto candidato da revisão foi editado concorrentemente/i,
      "Deveria ter rejeitado com 409 quando expectedCandidateHash diverge do texto atual."
    );

    // 5.3 Deliberações editadas concorrentemente (expectedDecisionStateHash obsoleto)
    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          reviewId,
          {
            expectedCatalogHash: validCatalogHash,
            expectedCandidateHash: validCandidateHash,
            expectedDecisionStateHash: "hash_decisao_antigo_00000000000000000000000000000000000000000000000",
            justification: "Justificativa de teste com tamanho adequado para passar validação simples.",
          },
          "uid_ceo",
          ATHENA_CEO_EMAIL
        );
      },
      /o estado das deliberações de achados foi modificado concorrentemente/i,
      "Deveria ter rejeitado com 409 quando expectedDecisionStateHash diverge do estado das deliberações."
    );

    console.log("  ✓ SUCESSO: Travas de concorrência em todas as três dimensões de integridade.\n");
  }

  // ---------------------------------------------------------------------------
  // CENÁRIO 6: Catálogo Alterado Após a Reconciliação -> Bloqueio de Aprovação
  // ---------------------------------------------------------------------------
  console.log("TESTE 6: Catálogo alterado após a reconciliação bloqueia a homologação com conflito");
  {
    const review = createMockReview(reviewId);
    repo.setReview(review);
    repo.setLesson(lessonBase);
    const catV2Hash = hashCatalogSnapshot(lessonBase);

    // Reconcilia com Catálogo V2
    await reconcileLegalReviewSnapshotFlow(
      repo,
      reviewId,
      {
        expectedCatalogHash: catV2Hash,
        justification: "Reconciliação formal com a versão V2 do catálogo oficial.",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Catálogo é atualizado posteriormente para V3 sem nova conferência
    const lessonV3: StoredCatalogLesson = {
      ...lessonBase,
      content: "# Aula 1: Teoria Geral do Direito Constitucional - Versão V3 superveniente\n\nConteúdo modificado novamente.",
    };
    repo.setLesson(lessonV3);

    // getLatestLegalReviewFlow deve sinalizar conflito
    const latest = await getLatestLegalReviewFlow(repo, { day: 1, part: 0 });
    assert.strictEqual(latest.found, true);
    if (latest.found) {
      assert.strictEqual(latest.conflict, true, "Deveria ter reportado conflito ativo para Catálogo V3.");
    }

    // Tentativa de aprovação direta deve falhar
    await assert.rejects(
      async () => {
        await repo.approve(reviewId, review.reviewedMarkdown, Date.now());
      },
      /o catálogo oficial foi alterado após a reconciliação/i,
      "Deveria ter rejeitado a aprovação após modificação posterior do catálogo."
    );

    console.log("  ✓ SUCESSO: Concorrência pós-reconciliação detectada e aprovação bloqueada com conflito.\n");
  }

  // ---------------------------------------------------------------------------
  // CENÁRIO 7: Deliberação Retificada ou Aditamento (ADD) Após Reconciliação
  // ---------------------------------------------------------------------------
  console.log("TESTE 7: Retificação de deliberação ou aditamento superveniente invalida a reconciliação");
  {
    const review = createMockReview(reviewId);
    repo.setReview(review);
    repo.setLesson(lessonBase);
    const catHash = hashCatalogSnapshot(lessonBase);

    // Reconcilia
    const reconciled = await reconcileLegalReviewSnapshotFlow(
      repo,
      reviewId,
      {
        expectedCatalogHash: catHash,
        justification: "Reconciliação com estado das deliberações original intacto.",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // 7.1 Simula emissão de um aditamento histórico superveniente
    const addendumTime = Date.now() + 1000;
    const addendum: LegalReviewAddendum = {
      id: "ADD-001",
      createdAt: addendumTime,
      createdByUid: "uid_ceo",
      createdByEmail: ATHENA_CEO_EMAIL,
      targetFindingKey: "chg_CHG-001",
      reason: "SANEAMENTO_VINCULO",
      inconsistencyDescription: "Ajuste posterior de redação",
      rectifyingAct: {
        action: "APONTAR_CORRECAO",
        state: "CORRECAO_NECESSARIA",
        justification: "Aditamento retificador.",
      },
      candidateHashAtAddendum: review.candidateHash || "",
      decisionStateHashAtAddendum: computeDecisionStateHash(review),
    };

    const reviewWithAddendum: LegalReviewView = {
      ...reconciled,
      addenda: [addendum],
    };
    repo.setReview(reviewWithAddendum);

    // Validação de integridade da reconciliação deve detectar invalidação por aditamento superveniente
    const checkAddendum = validateReconciliationIntegrity(reviewWithAddendum, catHash);
    assert.strictEqual(checkAddendum.valid, false, "Reconciliação deveria ter sido invalidada por aditamento superveniente.");
    assert.match(checkAddendum.reason || "", /aditamento formal \(ADD\) após o ato de reconciliação/i);

    // 7.2 Simula modificação no hash de deliberações
    const modifiedDecisions = {
      ...reconciled.findingDecisions,
      "unverified_claim_1": {
        ...reconciled.findingDecisions["unverified_claim_1"],
        justification: "Justificativa modificada após a reconciliação sem novo encerramento.",
      },
    };
    const reviewWithModifiedDec: LegalReviewView = {
      ...reconciled,
      findingDecisions: modifiedDecisions,
      addenda: [],
    };
    repo.setReview(reviewWithModifiedDec);

    const checkDecMod = validateReconciliationIntegrity(reviewWithModifiedDec, catHash);
    assert.strictEqual(checkDecMod.valid, false, "Reconciliação deveria ter sido invalidada por alteração de deliberação.");
    assert.match(checkDecMod.reason || "", /deliberações de achados jurídicos foram modificadas após o ato de reconciliação/i);

    console.log("  ✓ SUCESSO: Qualquer alteração posterior em deliberações ou aditamentos invalida a reconciliação.\n");
  }

  // ---------------------------------------------------------------------------
  // CENÁRIO 8: Idempotência Estrita da Reconciliação
  // ---------------------------------------------------------------------------
  console.log("TESTE 8: Idempotência estrita: chamadas idênticas não duplicam o histórico");
  {
    const review = createMockReview(reviewId);
    repo.setReview(review);
    repo.setLesson(lessonBase);
    const catHash = hashCatalogSnapshot(lessonBase);

    const justText = "Reconciliação idêntica executada repetidas vezes em teste.";

    // Chamada 1
    const rec1 = await reconcileLegalReviewSnapshotFlow(
      repo,
      reviewId,
      {
        expectedCatalogHash: catHash,
        justification: justText,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
    const histLen1 = rec1.reconciliationHistory?.length || 0;

    // Chamada 2 idêntica
    const rec2 = await reconcileLegalReviewSnapshotFlow(
      repo,
      reviewId,
      {
        expectedCatalogHash: catHash,
        justification: justText,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );
    const histLen2 = rec2.reconciliationHistory?.length || 0;

    assert.strictEqual(
      histLen1,
      histLen2,
      "Histórico de reconciliação não deveria ter duplicado na chamada idempotente."
    );
    assert.strictEqual(
      rec1.reconciliation?.reconciledAt,
      rec2.reconciliation?.reconciledAt,
      "Reconciliação ativa não deveria ter sido sobrescrita na chamada idempotente."
    );
    console.log("  ✓ SUCESSO: Idempotência confirmada sem poluição do reconciliationHistory.\n");
  }

  // ---------------------------------------------------------------------------
  // CENÁRIO 9: Bloqueio de Homologação sem Encerramento Formal do Estágio B
  // ---------------------------------------------------------------------------
  console.log("TESTE 9: Bloqueio de homologação sem encerramento formal válido do Estágio B");
  {
    const review = createMockReview(reviewId);
    // Simula remoção do encerramento formal do Estágio B
    if (review.supplement) {
      delete review.supplement.resolution;
    }
    repo.setReview(review);
    repo.setLesson(lessonBase);
    const catHash = hashCatalogSnapshot(lessonBase);

    // Reconcilia
    await reconcileLegalReviewSnapshotFlow(
      repo,
      reviewId,
      {
        expectedCatalogHash: catHash,
        justification: "Reconciliação realizada, mas Estágio B não possui encerramento formal.",
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Tentativa de aprovação deve ser bloqueada por validateFindingsHomologation
    await assert.rejects(
      async () => {
        await repo.approve(reviewId, review.reviewedMarkdown, Date.now());
      },
      /não possui encerramento administrativo formal realizado pelo ceo/i,
      "Deveria ter impedido aprovação de revisão sem encerramento formal do Estágio B."
    );

    console.log("  ✓ SUCESSO: A homologação é rigidamente dependente do encerramento formal do Estágio B.\n");
  }

  // ---------------------------------------------------------------------------
  // CENÁRIO 10: Catálogo Revertido ao originalHash Histórico
  // ---------------------------------------------------------------------------
  console.log("TESTE 10: Catálogo revertido ao originalHash histórico permite homologação limpa");
  {
    const review = createMockReview(reviewId);
    repo.setReview(review);

    // Catálogo contendo exatamente o texto do snapshot original da revisão
    const lessonReverted: StoredCatalogLesson = {
      ...lessonBase,
      content: review.originalContent,
    };
    // Forçamos o cálculo do hash do catálogo revertido a bater com originalHash
    const computedHash = hashCatalogSnapshot(lessonReverted);
    review.originalHash = computedHash;
    repo.setReview(review);
    repo.setLesson(lessonReverted);

    // getLatestLegalReviewFlow deve acusar ausência de conflito mesmo sem reconciliação
    const latest = await getLatestLegalReviewFlow(repo, { day: 1, part: 0 });
    assert.strictEqual(latest.found, true);
    if (latest.found) {
      assert.strictEqual(latest.conflict, false, "Catálogo revertido ao originalHash não deve ter conflito.");
    }

    // Aprovação deve ser permitida diretamente
    const approved = await repo.approve(reviewId, review.reviewedMarkdown, Date.now());
    assert.strictEqual(approved.status, "approved", "Revisão deveria ter sido aprovada com sucesso.");

    console.log("  ✓ SUCESSO: Reversão limpa do catálogo ao snapshot original respeitada sem fricção.\n");
  }

  console.log("================================================================================");
  console.log("RESULTADO GERAL: TODOS OS 10 TESTES ADVERSARIAIS APROVADOS COM SUCESSO!");
  console.log("================================================================================");
}

runAdversarialTestSuite().catch((err) => {
  console.error("FALHA NA BATERIA ADVERSARIAL:", err);
  process.exit(1);
});
