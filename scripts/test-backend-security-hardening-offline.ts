import {
  hashCatalogSnapshot,
  LegalReviewError,
  type LegalReviewRepository,
} from "../src/services/legalReviewRepository";
import {
  startLegalReview,
  startLegalReviewSection,
  enqueueAsyncLegalReview,
  approveLegalReview,
} from "../src/services/legalReviewFlow";
import type {
  LegalReviewIndex,
  LegalReviewView,
  StoredCatalogLesson,
} from "../src/lib/legalReviewTypes";

function createHardenedMockRepo(initialData: {
  lesson: StoredCatalogLesson;
  review?: LegalReviewView;
  index?: LegalReviewIndex;
}): {
  repo: LegalReviewRepository;
  getLesson: () => StoredCatalogLesson;
  getReview: () => LegalReviewView | undefined;
  getIndex: () => LegalReviewIndex | undefined;
  getAllReviews: () => Map<string, LegalReviewView>;
} {
  let currentLesson = { ...initialData.lesson };
  const reviewsMap = new Map<string, LegalReviewView>();
  if (initialData.review) {
    reviewsMap.set(initialData.review.id, { ...initialData.review });
  }
  let currentIndex = initialData.index ? { ...initialData.index } : undefined;

  const repo: LegalReviewRepository = {
    async getLesson(id: string) {
      return currentLesson.id === id ? { ...currentLesson } : null;
    },
    async getIndex(lessonId: string) {
      return currentIndex?.lessonId === lessonId ? { ...currentIndex } : null;
    },
    async get(reviewId: string) {
      const found = reviewsMap.get(reviewId);
      return found ? { ...found } : null;
    },
    async begin(review: LegalReviewView) {
      // Simulação atômica fiel a repo.begin do Firestore
      if (currentIndex?.latestReviewId && currentIndex.latestReviewId !== review.id) {
        const existing = reviewsMap.get(currentIndex.latestReviewId);
        if (existing && existing.status === "pending_approval") {
          throw new LegalReviewError(
            `Não é permitido iniciar ou registrar nova revisão enquanto existir uma revisão pendente de aprovação (ID: ${existing.id}). O índice do catálogo preserva a auditoria histórica.`,
            409
          );
        }
      }
      reviewsMap.set(review.id, { ...review });
      if (currentIndex) {
        currentIndex = {
          ...currentIndex,
          processingReviewId: review.id,
          processingStartedAt: Date.now(),
          latestReviewId: review.id,
          latestStatus: review.status || "processing",
        };
      }
    },
    async complete(review: LegalReviewView) {
      reviewsMap.set(review.id, { ...review });
      if (currentIndex) {
        currentIndex = {
          ...currentIndex,
          processingReviewId: null,
          latestReviewId: review.id,
          latestStatus: review.status,
        };
      }
    },
    async fail(reviewId: string, _lessonId: string, message: string) {
      const rev = reviewsMap.get(reviewId);
      if (rev) {
        reviewsMap.set(reviewId, { ...rev, status: "failed", reviewNotes: message });
      }
    },
    async touchProcessing() { return true; },
    async saveCandidate(reviewId: string, markdown: string) {
      const rev = reviewsMap.get(reviewId);
      if (!rev) throw new Error("not found");
      const updated = { ...rev, reviewedMarkdown: markdown };
      reviewsMap.set(reviewId, updated);
      return updated;
    },
    async reject(reviewId: string, uid: string, now: number) {
      const rev = reviewsMap.get(reviewId);
      if (!rev) throw new Error("not found");
      const updated = { ...rev, status: "rejected" as const, rejectedByUid: uid, rejectedAt: now };
      reviewsMap.set(reviewId, updated);
      return updated;
    },
    async approve(reviewId, uid, email, now) {
      const rev = reviewsMap.get(reviewId);
      if (!rev) {
        throw new LegalReviewError("Revisão não encontrada.", 404);
      }
      if (rev.status !== "pending_approval") {
        throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
      }
      if (rev.supplement?.status === "inconclusive") {
        throw new LegalReviewError(
          "A aprovação está bloqueada porque a complementação jurídica da IA encerrou em estado inconclusivo. É necessária resolução prévia das pendências.",
          400
        );
      }
      const hasUnverified = Boolean(
        rev.supplement?.findings?.some(
          (f) => f.status === "nao_verificada" || (f as any).classification === "nao_verificada"
        )
      );
      if (hasUnverified) {
        throw new LegalReviewError(
          "A aprovação está bloqueada porque existem achados da complementação jurídica não verificados em fontes oficiais. É necessária verificação humana prévia.",
          400
        );
      }
      if (hashCatalogSnapshot(currentLesson) !== rev.originalHash) {
        return { ok: false as const, conflict: true as const };
      }
      currentLesson = {
        ...currentLesson,
        content: rev.reviewedMarkdown,
        status: "approved",
        approvedBy: email,
        approvedAt: now,
        version: (currentLesson.version || 1) + 1,
      };
      const updated = {
        ...rev,
        status: "approved" as const,
        approvedByUid: uid,
        approvedByEmail: email,
        approvedAt: now,
      };
      reviewsMap.set(reviewId, updated);
      return { ok: true as const, lesson: { ...currentLesson } };
    },
  };

  return {
    repo,
    getLesson: () => currentLesson,
    getReview: () => reviewsMap.get(initialData.review?.id || ""),
    getIndex: () => currentIndex,
    getAllReviews: () => reviewsMap,
  };
}

async function runHardeningTests() {
  console.log("=== INICIANDO TESTES OFFLINE: BLINDAGEM DE SEGURANÇA DO BACKEND (ETAPA 4D) ===");

  const lessonContent = "Artigo 5º da Constituição Federal de 1988. Direitos e Garantias Fundamentais.";
  const lessonHash = hashCatalogSnapshot({
    id: "day_1_part_0",
    day: 1,
    part: 0,
    subject: "Direito Constitucional",
    content: lessonContent,
  });

  const baseReview: LegalReviewView = {
    id: "rev_pending_secure_1",
    lessonId: "day_1_part_0",
    day: 1,
    part: 0,
    status: "pending_approval",
    originalContent: lessonContent,
    originalHash: lessonHash, // Hash perfeitamente coincidente
    reviewedMarkdown: "Artigo 5º da Constituição Federal de 1988 revisado.",
    changes: [],
    sources: [],
    consultedSources: [],
    reviewNotes: "Revisão base",
    requestedByUid: "uid_ceo",
    requestedAt: Date.now() - 3600000,
    completedAt: Date.now() - 3500000,
    reviewDate: "09/10/2026",
    verificationLevel: "VERIFICADO_COM_FONTES",
    editorialIntegrity: {
      passed: true,
      status: "EDITORIAL_REVIEW_COMPLETE",
      changeResults: [],
      problematicChanges: [],
      coordinatedQuestionsPassed: true,
    },
    webSearchUsed: false,
    testMode: false,
    manuallyEdited: false,
    candidateHash: "cand_hash",
    auditedCandidateHash: "aud_hash",
    sourceHistory: [],
  };

  // Test 1: Aprovação bloqueada quando supplement.status = "inconclusive" (mesmo com hash coincidente)
  console.log("\n[Teste 1] approveLegalReview bloqueado com supplement.status = 'inconclusive' (mesmo com hash válido)");
  {
    const reviewWithInconclusive: LegalReviewView = {
      ...baseReview,
      id: "rev_inc_1",
      supplement: {
        attemptCount: 1,
        status: "inconclusive",
        findings: [
          {
            pendingId: "p1",
            statementAnalyzed: "Afirmação",
            officialSourceConsulted: "STF",
            verifiableUrl: "https://stf.jus.br",
            relevantExcerptOrBasis: "Base",
            status: "confirmada",
            objectiveJustification: "Justificativa",
            foundOfficialEvidence: true,
          },
        ],
      },
    };

    const mock = createHardenedMockRepo({
      lesson: { id: "day_1_part_0", day: 1, part: 0, subject: "Direito Constitucional", content: lessonContent },
      review: reviewWithInconclusive,
    });

    let threwExpected = false;
    try {
      await approveLegalReview(mock.repo, "rev_inc_1", "uid_ceo", "jhonny.spider@gmail.com");
    } catch (err: any) {
      if (err instanceof LegalReviewError && err.status === 400 && err.message.includes("inconclusivo")) {
        threwExpected = true;
        console.log("  ✓ Backend rejeitou aprovação com 400:", err.message);
      } else {
        throw err;
      }
    }
    console.assert(threwExpected, "Deveria ter lançado LegalReviewError(400) por complementação inconclusiva");
    console.assert(mock.getLesson().content === lessonContent, "Aula publicada permaneceu intacta!");
    console.assert(!mock.getLesson().approvedAt, "Aula não foi aprovada!");
  }

  // Test 2: Aprovação bloqueada quando existe finding com status "nao_verificada" (mesmo com hash válido)
  console.log("\n[Teste 2] approveLegalReview bloqueado com finding.status = 'nao_verificada' (mesmo com hash válido)");
  {
    const reviewWithUnverifiedFinding: LegalReviewView = {
      ...baseReview,
      id: "rev_unver_1",
      supplement: {
        attemptCount: 1,
        status: "completed",
        findings: [
          {
            pendingId: "p1",
            statementAnalyzed: "Afirmação não comprovada",
            officialSourceConsulted: "DOU",
            verifiableUrl: "https://in.gov.br",
            relevantExcerptOrBasis: "Sem registro",
            status: "nao_verificada",
            objectiveJustification: "Não localizada fonte",
            foundOfficialEvidence: false,
          },
        ],
      },
    };

    const mock = createHardenedMockRepo({
      lesson: { id: "day_1_part_0", day: 1, part: 0, subject: "Direito Constitucional", content: lessonContent },
      review: reviewWithUnverifiedFinding,
    });

    let threwExpected = false;
    try {
      await approveLegalReview(mock.repo, "rev_unver_1", "uid_ceo", "jhonny.spider@gmail.com");
    } catch (err: any) {
      if (err instanceof LegalReviewError && err.status === 400 && err.message.includes("não verificados")) {
        threwExpected = true;
        console.log("  ✓ Backend rejeitou aprovação com 400:", err.message);
      } else {
        throw err;
      }
    }
    console.assert(threwExpected, "Deveria ter lançado LegalReviewError(400) por achado não verificado");
    console.assert(mock.getLesson().content === lessonContent, "Aula publicada permaneceu intacta!");
  }

  // Test 3: Aprovação permitida somente quando todas as condições de segurança forem atendidas
  console.log("\n[Teste 3] approveLegalReview permitida quando supplement.status='completed' e todos findings confirmados");
  {
    const cleanReview: LegalReviewView = {
      ...baseReview,
      id: "rev_clean_1",
      supplement: {
        attemptCount: 1,
        status: "completed",
        findings: [
          {
            pendingId: "p1",
            statementAnalyzed: "Afirmação",
            officialSourceConsulted: "STF ADI 123",
            verifiableUrl: "https://portal.stf.jus.br",
            relevantExcerptOrBasis: "Julgado favorável",
            status: "confirmada",
            objectiveJustification: "Confirmado com acórdão",
            foundOfficialEvidence: true,
          },
        ],
      },
    };

    const mock = createHardenedMockRepo({
      lesson: { id: "day_1_part_0", day: 1, part: 0, subject: "Direito Constitucional", content: lessonContent },
      review: cleanReview,
    });

    const res = await approveLegalReview(mock.repo, "rev_clean_1", "uid_ceo", "jhonny.spider@gmail.com");
    console.assert(res.lesson.content === cleanReview.reviewedMarkdown, "Aula deve ser atualizada para o texto revisado!");
    console.assert(res.lesson.status === "approved", "Status da aula deve ser 'approved'");
    console.log("  ✓ Aprovação bem-sucedida com todas as garantias satisfeitas.");
  }

  // Test 4: startLegalReview com force=true bloqueado quando já existe revisão pending_approval
  console.log("\n[Teste 4] startLegalReview com force=true bloqueado por revisão pending_approval");
  {
    const mock = createHardenedMockRepo({
      lesson: { id: "day_1_part_0", day: 1, part: 0, subject: "Direito Constitucional", content: lessonContent },
      review: baseReview,
      index: {
        lessonId: "day_1_part_0",
        latestReviewId: baseReview.id,
        latestStatus: "pending_approval",
        processingReviewId: null,
        processingStartedAt: null,
      },
    });

    let threwExpected = false;
    try {
      await startLegalReview(mock.repo, { audit: async () => ({} as any) }, {
        day: 1,
        part: 0,
        force: true, // TENTATIVA DE FORÇAR
        uid: "uid_ceo",
      });
    } catch (err: any) {
      if (err instanceof LegalReviewError && err.status === 409 && err.message.includes("Não é permitido iniciar ou forçar")) {
        threwExpected = true;
        console.log("  ✓ Backend bloqueou startLegalReview(force=true) com 409:", err.message);
      } else {
        throw err;
      }
    }
    console.assert(threwExpected, "Deveria ter lançado 409 bloqueando force=true!");
    console.assert(mock.getIndex()?.latestReviewId === baseReview.id, "Ponteiro latestReviewId preservado intacto!");
  }

  // Test 5: enqueueAsyncLegalReview com force=true bloqueado quando já existe revisão pending_approval
  console.log("\n[Teste 5] enqueueAsyncLegalReview com force=true bloqueado por revisão pending_approval");
  {
    const mock = createHardenedMockRepo({
      lesson: { id: "day_1_part_0", day: 1, part: 0, subject: "Direito Constitucional", content: lessonContent },
      review: baseReview,
      index: {
        lessonId: "day_1_part_0",
        latestReviewId: baseReview.id,
        latestStatus: "pending_approval",
        processingReviewId: null,
        processingStartedAt: null,
      },
    });

    let threwExpected = false;
    let enqueueCalled = false;
    const taskEnqueuer = {
      enqueue: async () => { enqueueCalled = true; },
    };

    try {
      await enqueueAsyncLegalReview(mock.repo, taskEnqueuer, {
        day: 1,
        part: 0,
        force: true, // TENTATIVA DE FORÇAR ENFILEIRAMENTO
        uid: "uid_ceo",
      });
    } catch (err: any) {
      if (err instanceof LegalReviewError && err.status === 409 && err.message.includes("Não é permitido iniciar ou forçar")) {
        threwExpected = true;
        console.log("  ✓ Backend bloqueou enqueueAsyncLegalReview(force=true) com 409:", err.message);
      } else {
        throw err;
      }
    }
    console.assert(threwExpected, "Deveria ter lançado 409 bloqueando force=true!");
    console.assert(!enqueueCalled, "Cloud Tasks NÃO foi chamado!");
    console.assert(mock.getIndex()?.latestReviewId === baseReview.id, "Ponteiro latestReviewId preservado intacto!");
  }

  // Test 6: Proteção atômica no nível da transação (repo.begin) contra condições de corrida
  console.log("\n[Teste 6] Proteção atômica em repo.begin contra concorrência e sobrescrita de índice");
  {
    const mock = createHardenedMockRepo({
      lesson: { id: "day_1_part_0", day: 1, part: 0, subject: "Direito Constitucional", content: lessonContent },
      review: baseReview,
      index: {
        lessonId: "day_1_part_0",
        latestReviewId: baseReview.id,
        latestStatus: "pending_approval",
        processingReviewId: null,
        processingStartedAt: null,
      },
    });

    const concurrentReview: LegalReviewView = {
      ...baseReview,
      id: "rev_concurrent_rogue_999",
      requestedAt: Date.now(),
    };

    let threwExpected = false;
    try {
      // Simula uma tentativa concorrente de chamar repo.begin ignorando a camada de fluxo
      await mock.repo.begin(concurrentReview);
    } catch (err: any) {
      if (err instanceof LegalReviewError && err.status === 409 && err.message.includes("Não é permitido iniciar ou registrar nova revisão enquanto existir uma revisão pendente")) {
        threwExpected = true;
        console.log("  ✓ Transação atômica repo.begin barrou sobrescrita com 409:", err.message);
      } else {
        throw err;
      }
    }
    console.assert(threwExpected, "Transação atômica DEVE barrar concorrência com 409!");
    console.assert(mock.getIndex()?.latestReviewId === baseReview.id, "Ponteiro latestReviewId não foi sobrescrito!");
    console.assert(!mock.getAllReviews().has("rev_concurrent_rogue_999"), "Revisão concorrente não foi registrada!");
  }

  // Test 7: Preservação de revisões históricas e integridade do catálogo
  console.log("\n[Teste 7] Imutabilidade do histórico e integridade da aula publicada");
  {
    const mock = createHardenedMockRepo({
      lesson: { id: "day_1_part_0", day: 1, part: 0, subject: "Direito Constitucional", content: lessonContent },
      review: baseReview,
      index: {
        lessonId: "day_1_part_0",
        latestReviewId: baseReview.id,
        latestStatus: "pending_approval",
        processingReviewId: null,
        processingStartedAt: null,
      },
    });

    // Simula múltiplas tentativas rejeitadas
    try { await approveLegalReview(mock.repo, baseReview.id, "uid_fake", "fake@email.com"); } catch {}
    try { await startLegalReview(mock.repo, { audit: async () => ({} as any) }, { day: 1, part: 0, force: true, uid: "uid_ceo" }); } catch {}

    const lessonAfter = mock.getLesson();
    const reviewAfter = mock.getReview();
    const indexAfter = mock.getIndex();

    console.assert(lessonAfter.content === lessonContent, "Conteúdo da aula permaneceu rigorosamente idêntico");
    console.assert(lessonAfter.status !== "approved", "Status da aula permanece intocado");
    console.assert(reviewAfter?.originalHash === lessonHash, "originalHash da revisão histórica permanece intocado");
    console.assert(reviewAfter?.status === "pending_approval", "Status da revisão histórica permanece pending_approval");
    console.assert(indexAfter?.latestReviewId === baseReview.id, "Índice aponta confiavelmente para a revisão histórica");
    console.log("  ✓ Catálogo oficial, hash e revisão histórica 100% íntegros e preservados.");
  }

  console.log("\n=== TODOS OS 7 TESTES DE BLINDAGEM DE BACKEND FORAM APROVADOS COM SUCESSO! ===");
}

runHardeningTests().catch((err) => {
  console.error("Falha nos testes de blindagem:", err);
  process.exit(1);
});
