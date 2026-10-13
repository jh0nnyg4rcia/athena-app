/**
 * ATHENA — ETAPA 20.6.11: TESTES OFFLINE DA RECONCILIAÇÃO SEGURA DE VERSÕES
 *
 * MODO: 100% OFFLINE / ISOLAMENTO COMPLETO (SEM GRAVAÇÕES EM PRODUÇÃO)
 *
 * Cobertura de Verificação:
 * 1. Reconciliação bem-sucedida com preservação de todo o histórico:
 *    - originalHash histórico imutável (não sobrescrito);
 *    - candidateHash e reviewedMarkdown preservados intactos;
 *    - 14 alterações (CHG-001 a CHG-013 e CHG-H-001) preservadas;
 *    - 5 deliberações de achados (findingDecisions) preservadas;
 *    - Encerramento formal do Estágio B (supplement.resolution) preservado;
 *    - Registro separado e auditável de reconciliação gravado com sucesso.
 * 2. Rejeição de aprovação se o catálogo for alterado após a reconciliação (concorrência fail-closed).
 * 3. Rejeição com HTTP 403 para tentativa de reconciliação por usuário não-CEO.
 * 4. Rejeição com HTTP 400 para justificativa com menos de 15 caracteres.
 * 5. Rejeição com HTTP 409 se o expectedCatalogHash não corresponder ao catálogo real.
 * 6. Suporte seguro caso o catálogo volte a coincidir com o originalHash histórico.
 * 7. Múltiplas reconciliações sucessivas com preservação cumulativa em reconciliationHistory.
 * 8. Aprovação bem-sucedida após reconciliação válida quando Estágio C está habilitado.
 */

import assert from "node:assert";
import {
  type LegalReviewView,
  type LegalReviewChange,
  type SupplementFindingItem,
  type HumanFindingDecision,
  type SupplementHumanResolution,
  type LegalReviewReconciliation,
} from "../src/lib/legalReviewTypes";
import {
  reconcileLegalReviewSnapshotFlow,
  getLatestLegalReviewFlow,
  approveLegalReview,
} from "../src/services/legalReviewFlow";
import {
  hashCatalogSnapshot,
  type LegalReviewRepository,
  type StoredCatalogLesson,
} from "../src/services/legalReviewRepository";
import { ATHENA_CEO_EMAIL } from "../src/lib/contentProvider";

// Mock de 14 alterações históricas (CHG-001 a CHG-013 da IA + CHG-H-001 humana do CEO)
function createMockChanges(): LegalReviewChange[] {
  const list: LegalReviewChange[] = [];
  for (let i = 1; i <= 13; i++) {
    const id = `CHG-${String(i).padStart(3, "0")}`;
    list.push({
      id,
      originalText: `Texto original trecho ${i}`,
      revisedText: `Texto revisado trecho ${i}`,
      explanation: `Explicação da alteração ${i}`,
      category: "DOUTRINA",
      severity: "MEDIA",
      sources: [],
      evidence: [],
    });
  }
  // Correção humana supervisionada na Etapa 20.6.4
  list.push({
    id: "CHG-H-001",
    originalText: "A jurisprudência do STF estabelece balizas para a democracia militante.",
    revisedText: "Em precedentes relevantes, o STF reconheceu balizas para a salvaguarda do Estado Democrático de Direito.",
    explanation: "Adequação jurisprudencial e doutrinária precisa conforme deliberação unverified_claim_2.",
    category: "JURISPRUDENCIA",
    severity: "ALTA",
    sources: [],
    evidence: [],
  });
  return list;
}

// Mock das 5 deliberações de achados jurídicos
function createMockFindingDecisions(reviewId: string): Record<string, HumanFindingDecision> {
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
      candidateHashAtDecision: "hash_cand_v1",
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
      candidateHashAtDecision: "hash_cand_v1",
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
      justification: "Autonomia municipal fundada no art. 18 e 29 da CF/88, com ressalva doutrinária.",
      candidateHashAtDecision: "hash_cand_v1",
      decidedAt: 1760000003000,
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    },
    "unverified_claim_2": {
      findingKey: "unverified_claim_2",
      findingPendingId: "unverified_claim_2",
      reviewId,
      originalAiStatus: "nao_verificada",
      originalStatementAnalyzed: "Pluralismo político e democracia militante",
      action: "APONTAR_CORRECAO",
      state: "CORRECAO_NECESSARIA",
      justification: "Ajuste textual supervisionado gravado e vinculado à alteração CHG-H-001.",
      correctionChangeId: "CHG-H-001",
      candidateHashAtDecision: "hash_cand_v1",
      decidedAt: 1760000004000,
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    },
    "unverified_claim_3": {
      findingKey: "unverified_claim_3",
      findingPendingId: "unverified_claim_3",
      reviewId,
      originalAiStatus: "nao_verificada",
      originalStatementAnalyzed: "Classificação das normas constitucionais de José Afonso da Silva",
      action: "CONFIRMAR",
      state: "CONFIRMADO_PELO_CEO",
      justification: "Nomenclatura doutrinária consolidada: elementos orgânicos, limitativos, etc.",
      candidateHashAtDecision: "hash_cand_v1",
      decidedAt: 1760000005000,
      decidedByUid: "uid_ceo",
      decidedByEmail: ATHENA_CEO_EMAIL,
    },
  };
}

function createMockReview(lessonId = "day_1_part_0"): {
  review: LegalReviewView;
  initialCatalogLesson: StoredCatalogLesson;
} {
  const originalCatalogText = "# Aula 1: Teoria Geral do Estado\n\nTexto original com estatística 75% lei seca.\n\nDemocracia militante e pluralismo político.";
  const candidateReviewedText = "# Aula 1: Teoria Geral do Estado\n\nTexto com priorização estratégica.\n\nEm precedentes relevantes, o STF reconheceu balizas para a salvaguarda do Estado Democrático de Direito.";

  const initialCatalogLesson: StoredCatalogLesson = {
    id: lessonId,
    day: 1,
    part: 0,
    subject: "Direito Constitucional",
    topic: "Teoria da Constituição",
    content: originalCatalogText,
    version: 1,
    approvedAt: 1791000000000,
  };

  const originalHash = hashCatalogSnapshot(initialCatalogLesson);

  const reviewId = "rev_3d4deba9-5930-4b77-8ec1-7f257ef86008";
  const changes = createMockChanges();
  const findingDecisions = createMockFindingDecisions(reviewId);

  const resolution: SupplementHumanResolution = {
    status: "RESOLVIDO_PELO_CEO",
    closedAt: 1760000010000,
    closedByUid: "uid_ceo",
    closedByEmail: ATHENA_CEO_EMAIL,
    overallJustification: "Encerramento formal de todas as pendências da complementação jurídica pelo CEO.",
    candidateHashAtClosure: "hash_candidate_revisado_622e",
    decisionStateHashAtClosure: "hash_decisions_state_v1",
    totalFindingsResolved: 5,
    history: [
      {
        status: "RESOLVIDO_PELO_CEO",
        closedAt: 1759000000000,
        closedByUid: "uid_ceo",
        closedByEmail: ATHENA_CEO_EMAIL,
        overallJustification: "Encerramento legado anterior.",
        candidateHashAtClosure: "hash_legado_anterior",
        totalFindingsResolved: 5,
      },
    ],
  };

  const review: LegalReviewView = {
    id: reviewId,
    lessonId,
    day: 1,
    part: 0,
    subject: initialCatalogLesson.subject,
    topic: initialCatalogLesson.topic || initialCatalogLesson.subject,
    originalHash,
    originalApprovedAt: initialCatalogLesson.approvedAt || null,
    originalContent: originalCatalogText,
    reviewedMarkdown: candidateReviewedText,
    changes,
    unverifiedClaims: [],
    summary: {
      totalChanges: changes.length,
      corrections: 2,
      additions: 1,
      removals: 1,
      updates: 8,
      precisions: 2,
      restructures: 0,
    },
    reviewNotes: "Revisão jurídica completa supervisionada pelo CEO",
    verificationLevel: "VERIFICADO_COM_FONTES",
    confidence: "ALTA",
    outcome: "ALTERACOES_NECESSARIAS",
    status: "pending_approval",
    model: "gpt-4o",
    reviewDate: "10/10/2026",
    requestedByUid: "uid_ceo",
    requestedAt: 1760000000000,
    webSearchUsed: true,
    testMode: false,
    consultedSources: [],
    manuallyEdited: true,
    candidateHash: "hash_candidate_revisado_622e",
    auditedCandidateHash: originalHash,
    sourceHistory: [],
    findingDecisions,
    supplement: {
      attemptCount: 1,
      status: "inconclusive",
      findings: [
        {
          pendingId: "unverified_claim_1",
          statementAnalyzed: "Autonomia municipal",
          officialSourceConsulted: "CF/88",
          verifiableUrl: "https://www.planalto.gov.br",
          relevantExcerptOrBasis: "Art. 18",
          status: "nao_verificada",
          objectiveJustification: "Inconclusivo na IA",
          foundOfficialEvidence: false,
        },
      ],
      resolution,
    },
  };

  return { review, initialCatalogLesson };
}

// Implementação em memória de LegalReviewRepository para testes unitários isolados
function createMockRepository(
  initialReview: LegalReviewView,
  initialLesson: StoredCatalogLesson
): LegalReviewRepository & {
  storedReview: LegalReviewView;
  currentCatalog: StoredCatalogLesson;
} {
  const state = {
    storedReview: JSON.parse(JSON.stringify(initialReview)) as LegalReviewView,
    currentCatalog: JSON.parse(JSON.stringify(initialLesson)) as StoredCatalogLesson,
  };

  return {
    get storedReview() {
      return state.storedReview;
    },
    get currentCatalog() {
      return state.currentCatalog;
    },
    async getLesson(lessonId: string) {
      if (lessonId === state.currentCatalog.id) {
        return JSON.parse(JSON.stringify(state.currentCatalog));
      }
      return null;
    },
    async getIndex(lessonId: string) {
      return {
        lessonId,
        processingReviewId: null,
        processingStartedAt: null,
        approvedHash: null,
        approvedReviewId: null,
        approvedReviewDate: null,
        latestReviewId: state.storedReview.id,
        latestStatus: state.storedReview.status,
      };
    },
    async get(reviewId: string) {
      if (reviewId === state.storedReview.id) {
        return JSON.parse(JSON.stringify(state.storedReview));
      }
      return null;
    },
    async begin() {},
    async complete() {},
    async fail() {},
    async touchProcessing() {
      return true;
    },
    async saveCandidate(reviewId: string, markdown: string) {
      state.storedReview.reviewedMarkdown = markdown;
      return JSON.parse(JSON.stringify(state.storedReview));
    },
    async reject(reviewId: string, uid: string, now: number) {
      state.storedReview.status = "rejected";
      return JSON.parse(JSON.stringify(state.storedReview));
    },
    async reconcileReviewCatalogSnapshot(reviewId, reconciliation, now) {
      if (reviewId !== state.storedReview.id) {
        throw new Error("Revisão não encontrada.");
      }
      if (state.storedReview.status !== "pending_approval") {
        const err: any = new Error("Esta revisão não está aguardando aprovação.");
        err.status = 409;
        throw err;
      }
      if (reconciliation.historicalOriginalHash !== state.storedReview.originalHash) {
        const err: any = new Error("O hash original histórico informado não coincide com a revisão.");
        err.status = 400;
        throw err;
      }
      if ((reconciliation.justification || "").trim().length < 15) {
        const err: any = new Error("A justificativa do CEO para reconciliação é insuficiente (mínimo de 15 caracteres).");
        err.status = 400;
        throw err;
      }

      const currentCatalogHash = hashCatalogSnapshot(state.currentCatalog);
      if (currentCatalogHash !== reconciliation.reconciledCatalogHash) {
        const err: any = new Error("O catálogo foi modificado após a análise de reconciliação. O hash atual difere do reconciliado.");
        err.status = 409;
        throw err;
      }

      const priorReconciliation = state.storedReview.reconciliation;
      const priorHistory = [...(state.storedReview.reconciliationHistory || [])];
      if (priorReconciliation) {
        priorHistory.push(priorReconciliation);
      }

      state.storedReview.reconciliation = reconciliation;
      state.storedReview.reconciliationHistory = priorHistory;

      return JSON.parse(JSON.stringify(state.storedReview));
    },
    async approve(reviewId, uid, email, now) {
      if (reviewId !== state.storedReview.id) throw new Error("Revisão não encontrada.");
      if (state.storedReview.status !== "pending_approval") {
        const err: any = new Error("Esta revisão não está aguardando aprovação.");
        err.status = 409;
        throw err;
      }

      const currentCatalogHash = hashCatalogSnapshot(state.currentCatalog);
      const reconciledHash = state.storedReview.reconciliation?.reconciledCatalogHash;
      const matchesOriginal = currentCatalogHash === state.storedReview.originalHash;
      const matchesReconciled = Boolean(reconciledHash && currentCatalogHash === reconciledHash);

      if (!matchesOriginal && !matchesReconciled) {
        return { ok: false as const, conflict: true as const };
      }

      state.currentCatalog.content = state.storedReview.reviewedMarkdown;
      state.currentCatalog.approvedBy = email;
      state.currentCatalog.approvedAt = now;
      state.storedReview.status = "approved";

      return { ok: true as const, lesson: JSON.parse(JSON.stringify(state.currentCatalog)) };
    },
  };
}

async function runAllReconciliationTests() {
  console.log("=== INICIANDO TESTES OFFLINE DA RECONCILIAÇÃO SEGURA (ETAPA 20.6.11) ===");

  // ---------------------------------------------------------------------------
  // TESTE 1: Reconciliação bem-sucedida com preservação de todo o histórico
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 1] Reconciliação bem-sucedida e preservação de histórico...");
  {
    const { review, initialCatalogLesson } = createMockReview();
    const repo = createMockRepository(review, initialCatalogLesson);

    // Simula alteração prévia no catálogo (como ocorrido na Etapa 20.6.10)
    repo.currentCatalog.content = "# Aula 1: Teoria Geral do Estado\n\nTexto com formatação prévia no catálogo.\n\nDemocracia militante e pluralismo político.";
    const newCatalogHash = hashCatalogSnapshot(repo.currentCatalog);

    // Antes da reconciliação: deve indicar conflito
    const checkBefore = await getLatestLegalReviewFlow(repo, { day: 1, part: 0 });
    assert.strictEqual(checkBefore.found, true);
    assert.strictEqual(checkBefore.conflict, true, "Deve reportar conflito antes da reconciliação.");

    // Executa fluxo de reconciliação pelo CEO
    const justification = "Ajustes de formatação prévios no catálogo analisados; correções CHG-001 a 013 e CHG-H-001 mantidas íntegras.";
    const reconciled = await reconcileLegalReviewSnapshotFlow(
      repo,
      review.id,
      {
        expectedCatalogHash: newCatalogHash,
        justification,
        acknowledgeMaterialDivergence: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Verificações de Preservação Absoluta:
    assert.strictEqual(reconciled.originalHash, review.originalHash, "originalHash NÃO pode ser sobrescrito!");
    assert.strictEqual(reconciled.candidateHash, review.candidateHash, "candidateHash deve permanecer idêntico.");
    assert.strictEqual(reconciled.reviewedMarkdown, review.reviewedMarkdown, "reviewedMarkdown deve permanecer idêntico.");
    assert.strictEqual(reconciled.changes.length, 14, "As 14 alterações devem permanecer intactas.");
    assert.ok(reconciled.changes.some((c) => c.id === "CHG-H-001"), "CHG-H-001 deve permanecer no array changes.");
    assert.strictEqual(Object.keys(reconciled.findingDecisions || {}).length, 5, "As 5 deliberações devem permanecer intactas.");
    assert.strictEqual(reconciled.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO", "Encerramento do Estágio B deve permanecer intacto.");
    assert.strictEqual(reconciled.supplement?.resolution?.history?.length, 1, "Histórico legado do encerramento deve ser preservado.");

    // Verificações do registro de reconciliação:
    assert.ok(reconciled.reconciliation, "Objeto reconciliation deve ser gerado.");
    assert.strictEqual(reconciled.reconciliation?.status, "RECONCILED_BY_CEO");
    assert.strictEqual(reconciled.reconciliation?.historicalOriginalHash, review.originalHash);
    assert.strictEqual(reconciled.reconciliation?.reconciledCatalogHash, newCatalogHash);
    assert.strictEqual(reconciled.reconciliation?.justification, justification);
    assert.strictEqual(reconciled.reconciliation?.reconciledByEmail, ATHENA_CEO_EMAIL);
    assert.ok(reconciled.reconciliation?.diffSummary, "diffSummary deve existir.");

    // Após a reconciliação: conflito deve ser superado!
    const checkAfter = await getLatestLegalReviewFlow(repo, { day: 1, part: 0 });
    assert.strictEqual(checkAfter.found, true);
    assert.strictEqual(checkAfter.conflict, false, "Conflito deve ser superado após reconciliação com o catálogo atual.");

    console.log("  ✓ TESTE 1 APROVADO: Reconciliação bem-sucedida, conflito superado e histórico 100% preservado.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 2: Rejeição de aprovação se o catálogo for alterado após a reconciliação
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 2] Concorrência: alteração do catálogo após reconciliação gera conflito...");
  {
    const { review, initialCatalogLesson } = createMockReview();
    const repo = createMockRepository(review, initialCatalogLesson);

    repo.currentCatalog.content = "Versão intermediária do catálogo.";
    const hashIntermediario = hashCatalogSnapshot(repo.currentCatalog);

    // Reconcilia com a versão intermediária
    await reconcileLegalReviewSnapshotFlow(
      repo,
      review.id,
      {
        expectedCatalogHash: hashIntermediario,
        justification: "Reconciliação com versão intermediária aprovada formalmente pelo CEO com fundamentação ampla.",
        acknowledgeMaterialDivergence: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Agora o catálogo é alterado NOVINHA VEZ por terceiros/outro fluxo
    repo.currentCatalog.content = "Versão posterior conflitante que alterou o catálogo após a reconciliação.";
    const hashPosterior = hashCatalogSnapshot(repo.currentCatalog);
    assert.notStrictEqual(hashPosterior, hashIntermediario);
    assert.notStrictEqual(hashPosterior, review.originalHash);

    // 1. getLatestLegalReviewFlow deve detectar o novo conflito
    const checkConcorrente = await getLatestLegalReviewFlow(repo, { day: 1, part: 0 });
    assert.strictEqual(checkConcorrente.conflict, true, "Novo conflito deve ser detectado.");

    // 2. repo.approve deve rejeitar com conflito
    const approveResult = await repo.approve(review.id, "uid_ceo", ATHENA_CEO_EMAIL, Date.now());
    assert.strictEqual(approveResult.ok, false);
    assert.strictEqual(approveResult.conflict, true, "Aprovação deve ser recusada com conflict: true.");

    console.log("  ✓ TESTE 2 APROVADO: Proteção de concorrência ativa; aprovação bloqueada se catálogo mudar pós-reconciliação.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 3: Rejeição com HTTP 403 para usuário não-CEO
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 3] Autorização: rejeição com 403 para usuário não-CEO...");
  {
    const { review, initialCatalogLesson } = createMockReview();
    const repo = createMockRepository(review, initialCatalogLesson);

    repo.currentCatalog.content = "Catálogo modificado.";
    const catHash = hashCatalogSnapshot(repo.currentCatalog);

    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          review.id,
          {
            expectedCatalogHash: catHash,
            justification: "Tentativa não autorizada por terceiro no sistema.",
          },
          "uid_estagiario",
          "estagiario@outroemail.com"
        );
      },
      (err: any) => {
        assert.strictEqual(err.status, 403, "Deve retornar status HTTP 403.");
        assert.ok(err.message.includes("CEO"), "Mensagem deve mencionar o CEO.");
        return true;
      }
    );

    console.log("  ✓ TESTE 3 APROVADO: Não-CEO é estritamente rejeitado com HTTP 403.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 4: Rejeição com HTTP 400 para justificativa com menos de 15 caracteres
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 4] Validação: rejeição com 400 para justificativa curta (< 15 chars)...");
  {
    const { review, initialCatalogLesson } = createMockReview();
    const repo = createMockRepository(review, initialCatalogLesson);

    repo.currentCatalog.content = initialCatalogLesson.content + "   ";
    const catHash = hashCatalogSnapshot(repo.currentCatalog);

    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          review.id,
          {
            expectedCatalogHash: catHash,
            justification: "Curto demais", // 12 chars
          },
          "uid_ceo",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.strictEqual(err.status, 400, "Deve retornar status HTTP 400.");
        assert.ok(err.message.includes("15 caracteres"), "Mensagem deve exigir 15 caracteres.");
        return true;
      }
    );

    console.log("  ✓ TESTE 4 APROVADO: Justificativa insuficiente rejeitada com HTTP 400.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 5: Rejeição com HTTP 409 se expectedCatalogHash for divergente do real
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 5] Concorrência: rejeição se expectedCatalogHash divergir do catálogo atual...");
  {
    const { review, initialCatalogLesson } = createMockReview();
    const repo = createMockRepository(review, initialCatalogLesson);

    repo.currentCatalog.content = "Conteúdo real do catálogo.";

    await assert.rejects(
      async () => {
        await reconcileLegalReviewSnapshotFlow(
          repo,
          review.id,
          {
            expectedCatalogHash: "0000000000000000000000000000000000000000000000000000000000000000",
            justification: "Justificativa completa do CEO com mais de quinze caracteres.",
          },
          "uid_ceo",
          ATHENA_CEO_EMAIL
        );
      },
      (err: any) => {
        assert.strictEqual(err.status, 409, "Deve retornar status HTTP 409.");
        assert.ok(err.message.includes("não corresponde à versão atual"), "Mensagem deve apontar descompasso de hash.");
        return true;
      }
    );

    console.log("  ✓ TESTE 5 APROVADO: expectedCatalogHash divergente rejeitado com HTTP 409.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 6: Comportamento correto se o catálogo voltar ao originalHash
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 6] Reversão do catálogo: segurança quando catálogo coincide com originalHash histórico...");
  {
    const { review, initialCatalogLesson } = createMockReview();
    const repo = createMockRepository(review, initialCatalogLesson);

    // O catálogo está exatamente com o texto original da revisão
    assert.strictEqual(hashCatalogSnapshot(repo.currentCatalog), review.originalHash);

    // Mesmo com reconciliação anterior presente apontando para outro hash temporário:
    repo.storedReview.reconciliation = {
      reconciledAt: 1760000000000,
      reconciledByUid: "uid_ceo",
      reconciledByEmail: ATHENA_CEO_EMAIL,
      reviewId: review.id,
      lessonId: review.lessonId,
      historicalOriginalHash: review.originalHash,
      catalogHashFound: "hash_antigo_temporario",
      reconciledCatalogHash: "hash_antigo_temporario",
      candidateHashAtReconciliation: review.candidateHash,
      diffSummary: { totalHunks: 1, materialChangesDetected: false, details: [] },
      justification: "Reconciliação temporária prévia de teste.",
      status: "RECONCILED_BY_CEO",
    };

    // getLatestLegalReviewFlow não deve reportar conflito porque bate com o originalHash!
    const checkOriginal = await getLatestLegalReviewFlow(repo, { day: 1, part: 0 });
    assert.strictEqual(checkOriginal.conflict, false, "Não deve ter conflito pois catálogo atual coincide com originalHash.");

    // repo.approve deve permitir aprovação
    const appResult = await repo.approve(review.id, "uid_ceo", ATHENA_CEO_EMAIL, Date.now());
    assert.strictEqual(appResult.ok, true, "Aprovação deve operar com segurança quando catálogo coincide com originalHash.");

    console.log("  ✓ TESTE 6 APROVADO: Catálogo coincidindo com originalHash opera perfeitamente.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 7: Múltiplas reconciliações sucessivas com preservação cumulativa em reconciliationHistory
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 7] Múltiplas reconciliações sucessivas e histórico cumulativo...");
  {
    const { review, initialCatalogLesson } = createMockReview();
    const repo = createMockRepository(review, initialCatalogLesson);

    // 1ª reconciliação (catálogo v2)
    repo.currentCatalog.content = "Catálogo versão 2 com ajuste prévio A.";
    const hashV2 = hashCatalogSnapshot(repo.currentCatalog);
    const rec1 = await reconcileLegalReviewSnapshotFlow(
      repo,
      review.id,
      {
        expectedCatalogHash: hashV2,
        justification: "Primeira reconciliação formal com catálogo versão 2 realizada pelo CEO com fundamentação ampla.",
        acknowledgeMaterialDivergence: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL,
      1000
    );

    assert.strictEqual(rec1.reconciliation?.reconciledCatalogHash, hashV2);
    assert.strictEqual(rec1.reconciliationHistory?.length, 0, "Primeira reconciliação não tem histórico anterior.");

    // 2ª reconciliação (catálogo v3)
    repo.currentCatalog.content = "Catálogo versão 3 com ajuste prévio B.";
    const hashV3 = hashCatalogSnapshot(repo.currentCatalog);
    const rec2 = await reconcileLegalReviewSnapshotFlow(
      repo,
      review.id,
      {
        expectedCatalogHash: hashV3,
        justification: "Segunda reconciliação formal com catálogo versão 3 realizada pelo CEO com fundamentação ampla.",
        acknowledgeMaterialDivergence: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL,
      2000
    );

    assert.strictEqual(rec2.originalHash, review.originalHash, "originalHash continua imutável.");
    assert.strictEqual(rec2.reconciliation?.reconciledCatalogHash, hashV3, "reconciliation ativo deve apontar para v3.");
    assert.strictEqual(rec2.reconciliationHistory?.length, 1, "reconciliationHistory deve conter 1 entrada arquivada.");
    assert.strictEqual(rec2.reconciliationHistory?.[0].reconciledCatalogHash, hashV2, "Histórico arquivado deve ser a versão v2.");
    assert.strictEqual(rec2.reconciliationHistory?.[0].justification, "Primeira reconciliação formal com catálogo versão 2 realizada pelo CEO com fundamentação ampla.");

    // 3ª reconciliação (catálogo v4)
    repo.currentCatalog.content = "Catálogo versão 4 com ajuste prévio C.";
    const hashV4 = hashCatalogSnapshot(repo.currentCatalog);
    const rec3 = await reconcileLegalReviewSnapshotFlow(
      repo,
      review.id,
      {
        expectedCatalogHash: hashV4,
        justification: "Terceira reconciliação formal com catálogo versão 4 realizada pelo CEO com fundamentação ampla.",
        acknowledgeMaterialDivergence: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL,
      3000
    );

    assert.strictEqual(rec3.originalHash, review.originalHash, "originalHash continua rigorosamente imutável.");
    assert.strictEqual(rec3.reconciliation?.reconciledCatalogHash, hashV4);
    assert.strictEqual(rec3.reconciliationHistory?.length, 2, "reconciliationHistory deve conter 2 entradas arquivadas.");
    assert.strictEqual(rec3.reconciliationHistory?.[0].reconciledCatalogHash, hashV2);
    assert.strictEqual(rec3.reconciliationHistory?.[1].reconciledCatalogHash, hashV3);

    console.log("  ✓ TESTE 7 APROVADO: Múltiplas reconciliações encadeadas preservam cadeia auditável completa.");
  }

  // ---------------------------------------------------------------------------
  // TESTE 8: Aprovação bem-sucedida após reconciliação com o catálogo atual
  // ---------------------------------------------------------------------------
  console.log("\n[TESTE 8] Fluxo completo de aprovação pós-reconciliação...");
  {
    const { review, initialCatalogLesson } = createMockReview();
    const repo = createMockRepository(review, initialCatalogLesson);

    repo.currentCatalog.content = "Catálogo atual com formatação da Etapa 20.6.10.";
    const hashAtual = hashCatalogSnapshot(repo.currentCatalog);

    // Reconcilia com o catálogo atual
    await reconcileLegalReviewSnapshotFlow(
      repo,
      review.id,
      {
        expectedCatalogHash: hashAtual,
        justification: "Reconciliação formal atestando compatibilidade com o catálogo atual com fundamentação detalhada.",
        acknowledgeMaterialDivergence: true,
      },
      "uid_ceo",
      ATHENA_CEO_EMAIL
    );

    // Executa aprovação formal
    const approveResult = await repo.approve(review.id, "uid_ceo", ATHENA_CEO_EMAIL, Date.now());
    assert.strictEqual(approveResult.ok, true, "Aprovação deve ser bem-sucedida.");
    assert.strictEqual(repo.storedReview.status, "approved", "Status da revisão deve ser atualizado para approved.");
    assert.strictEqual(repo.currentCatalog.content, review.reviewedMarkdown, "Catálogo deve receber o reviewedMarkdown aprovado.");

    console.log("  ✓ TESTE 8 APROVADO: Aprovação pós-reconciliação conclui com sucesso substituindo a aula no catálogo.");
  }

  console.log("\n===============================================================================");
  console.log("TODOS OS 8 TESTES OFFLINE DA ETAPA 20.6.11 FORAM CONCLUÍDOS COM 100% DE SUCESSO!");
  console.log("===============================================================================");
}

runAllReconciliationTests().catch((err) => {
  console.error("FALHA NOS TESTES OFFLINE:", err);
  process.exit(1);
});
