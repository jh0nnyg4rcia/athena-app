import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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
const DEMO_PROJECT_ID = "demo-athena-emulator-test";

async function runEmulatorTestSuite() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 6F.1: VALIDAÇÃO TRANSACIONAL COM FIRESTORE EMULATOR LOCAL");
  console.log(`EMULADOR DETECTADO: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`PROJETO DEMO ISOLADO: ${DEMO_PROJECT_ID}`);
  console.log("================================================================================\n");

  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, "FIRESTORE_EMULATOR_HOST DEVE estar definido");
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST.includes("127.0.0.1") || process.env.FIRESTORE_EMULATOR_HOST.includes("localhost"),
    "O host do emulador deve ser rigorosamente local (127.0.0.1 ou localhost)"
  );

  const app = initializeApp({ projectId: DEMO_PROJECT_ID }, "emulator-test-app");
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });

  const REVIEWS = "legal_reviews";
  const LESSONS = "homologated_lessons";

  const originalMarkdown = `# Processo Civil — Recursos Cíveis

O prazo geral do recurso de apelação no Código de Processo Civil é de 15 dias úteis.
A apelação possui efeito suspensivo automático como regra geral nos termos do art. 1.012 do CPC.
`;

  const lessonDoc: StoredCatalogLesson = {
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

  const reviewDoc: LegalReviewView = {
    id: "rev_3d4deba9-0000-4000-8000-000000000001",
    lessonId: "day_1_part_1",
    day: 1,
    part: 1,
    subject: "Direito Processual Civil",
    topic: "Teoria Geral dos Recursos",
    originalHash: hashCatalogSnapshot(lessonDoc),
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

  // 1. Grava dados sintéticos iniciais no Firestore Emulado
  await db.collection(LESSONS).doc(lessonDoc.id).set(lessonDoc);
  await db.collection(REVIEWS).doc(reviewDoc.id).set(reviewDoc);
  console.log("  [1] ✓ Documentos sintéticos gravados com sucesso no Firestore Emulator.");

  // Cria repositório conectado diretamente à instância emulada real
  const emulatorRepo: LegalReviewRepository = {
    async getLesson(id: string) {
      const snap = await db.collection(LESSONS).doc(id).get();
      return snap.exists ? (snap.data() as StoredCatalogLesson) : null;
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
      const snap = await db.collection(REVIEWS).doc(id).get();
      return snap.exists ? (snap.data() as LegalReviewView) : null;
    },
    async saveCandidate(id: string, markdown: string) {
      return await db.runTransaction(async (tx) => {
        const ref = db.collection(REVIEWS).doc(id);
        const snap = await tx.get(ref);
        const current = snap.data() as LegalReviewView;
        current.reviewedMarkdown = markdown;
        current.candidateHash = hashLessonContent(markdown);
        tx.set(ref, current);
        return current;
      });
    },
    async saveFindingDecision(reviewId: string, findingDecision: HumanFindingDecision, now: number) {
      const flags = getLegalReviewOperationalFlags();
      if (!flags.stageAEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE, 503);
      }
      return await db.runTransaction(async (tx) => {
        const ref = db.collection(REVIEWS).doc(reviewId);
        const snap = await tx.get(ref);
        const current = snap.data() as LegalReviewView;
        const existing = current.findingDecisions || {};
        const prior = existing[findingDecision.findingKey];
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
        const consolidated = {
          ...findingDecision,
          decidedAt: now,
          candidateHashAtDecision: current.candidateHash,
          history,
        };
        current.findingDecisions = {
          ...existing,
          [findingDecision.findingKey]: consolidated,
        };
        tx.set(ref, current);
        return current;
      });
    },
    async closeSupplementResolution(reviewId: string, resolution: any, now: number) {
      const flags = getLegalReviewOperationalFlags();
      if (!flags.stageBEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE, 503);
      }
      return await db.runTransaction(async (tx) => {
        const ref = db.collection(REVIEWS).doc(reviewId);
        const snap = await tx.get(ref);
        const current = snap.data() as LegalReviewView;
        if (!current.supplement) throw new LegalReviewError("Sem complementação", 404);
        current.supplement.resolution = resolution;
        tx.set(ref, current);
        return current;
      });
    },
    async reject(id: string, uid: string, now: number) {
      return await db.runTransaction(async (tx) => {
        const ref = db.collection(REVIEWS).doc(id);
        const snap = await tx.get(ref);
        const current = snap.data() as LegalReviewView;
        current.status = "rejected";
        tx.set(ref, current);
        return current;
      });
    },
    async approve(reviewId: string, uid: string, email: string, now: number) {
      const flags = getLegalReviewOperationalFlags();
      if (!flags.stageCEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE, 503);
      }
      return await db.runTransaction(async (tx) => {
        const reviewRef = db.collection(REVIEWS).doc(reviewId);
        const lessonRef = db.collection(LESSONS).doc(reviewDoc.lessonId);
        const reviewSnap = await tx.get(reviewRef);
        const lessonSnap = await tx.get(lessonRef);
        const r = reviewSnap.data() as LegalReviewView;
        const l = lessonSnap.data() as StoredCatalogLesson;

        if (hashCatalogSnapshot(l) !== r.originalHash) {
          return { ok: false as const, conflict: true as const };
        }
        l.content = r.reviewedMarkdown;
        l.approvedAt = now;
        l.approvedBy = email;
        l.version = (l.version || 1) + 1;
        r.status = "approved";

        tx.set(reviewRef, r);
        tx.set(lessonRef, l);
        return { ok: true as const, lesson: l };
      });
    },
  };

  // ---------------------------------------------------------------------------
  // TESTE 1: Fail-Closed no Emulador Real (Sem Flags)
  // ---------------------------------------------------------------------------
  delete process.env.LEGAL_REVIEW_STAGE_A_ENABLED;
  delete process.env.LEGAL_REVIEW_STAGE_B_ENABLED;
  delete process.env.LEGAL_REVIEW_STAGE_C_ENABLED;

  console.log("--- TESTE 1: Fail-Closed no Firestore Emulado ---");
  await assert.rejects(
    async () => {
      await approveLegalReview(emulatorRepo, reviewDoc.id, "uid_ceo", CEO_EMAIL);
    },
    (err: any) => err instanceof LegalReviewError && err.status === 503,
    "Aprovação sem flags deve falhar com 503 no Firestore real emulado"
  );
  console.log("  [1.1] ✓ Bloqueio 503 verificado dentro da transação atômica do emulador.");

  // ---------------------------------------------------------------------------
  // TESTE 2: Transações Atômicas de Homologação Gradual no Emulador Real
  // ---------------------------------------------------------------------------
  process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "true";

  console.log("--- TESTE 2: Execução de Transações Atômicas no Firestore Emulado ---");

  // 2.1 Estágio A transacional
  const afterA = await resolveHumanLegalReviewFinding(
    emulatorRepo,
    reviewDoc.id,
    {
      findingKey: "chg_CHG-001",
      action: "CONFIRMAR",
      justification: "Prazo de 15 dias conferido documentalmente pelo CEO no CPC.",
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
  assert.ok(afterA.findingDecisions?.["chg_CHG-001"]);
  console.log("  [2.1] ✓ Estágio A persistido atomicamente no Firestore Emulado.");

  // 2.2 Estágio B transacional
  const afterB = await closeLegalReviewSupplementFlow(
    emulatorRepo,
    reviewDoc.id,
    { overallJustification: "Encerramento formal de complementação jurídica com todas as pendências resolvidas." },
    "uid_ceo",
    CEO_EMAIL
  );
  assert.equal(afterB.supplement?.resolution?.status, "RESOLVIDO_PELO_CEO");
  console.log("  [2.2] ✓ Estágio B persistido atomicamente no Firestore Emulado.");

  // 2.3 Estágio C transacional (Aprovação Final)
  const afterC = await approveLegalReview(emulatorRepo, reviewDoc.id, "uid_ceo", CEO_EMAIL);
  assert.equal(afterC.lesson.version, 2);
  assert.equal(afterC.lesson.approvedBy, CEO_EMAIL);

  // Confirma leitura direta do banco emulado
  const persistedLessonSnap = await db.collection(LESSONS).doc(lessonDoc.id).get();
  const persistedLesson = persistedLessonSnap.data() as StoredCatalogLesson;
  assert.equal(persistedLesson.version, 2);
  assert.equal(persistedLesson.approvedBy, CEO_EMAIL);
  console.log("  [2.3] ✓ Estágio C aprovado atomicamente. Versão 2 persistida no Firestore Emulado com sucesso.");

  await deleteApp(app);

  console.log("\n================================================================================");
  console.log("✓ VALIDAÇÃO COM FIRESTORE EMULATOR LOCAL CONCLUÍDA COM 100% DE SUCESSO!");
  console.log("================================================================================\n");
}

runEmulatorTestSuite().catch((err) => {
  console.error("Falha na suíte de testes com emulador:", err);
  process.exit(1);
});
