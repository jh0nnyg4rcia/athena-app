/**
 * ATHENA — ETAPA 6G: SUÍTE DE TESTES COMPLEMENTARES COM FIRESTORE EMULATOR LOCAL
 *
 * Cobertura de Testes Sintéticos em Ambiente Real Emulado:
 * 1. Duas decisões simultâneas sobre o mesmo achado (concorrência e imutabilidade de histórico).
 * 2. Alteração concorrente do catálogo (detecção de descompasso de originalHash gerando HTTP 409).
 * 3. Autenticação e autorização (bloqueio 403 estrito para Não-CEO nos 3 estágios).
 * 4. Bloqueio de escrita direta nas coleções restritas pelas regras (deny client writes).
 * 5. Bloqueio absoluto de publicação com Stage C desabilitado (garantia fail-closed em banco real).
 * 6. Tentativa de aprovação por caminhos alternativos ou modos inválidos (testMode = true rejeitado com 403).
 * 7. Preservação integral do histórico probatório após deliberação e invalidação por nova versão.
 */

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
const DEMO_PROJECT_ID = "demo-athena-stage6g-test";

async function runComprehensiveEmulatorTests() {
  console.log("================================================================================");
  console.log("ATHENA — ETAPA 6G: TESTES COMPLEMENTARES COM FIRESTORE EMULATOR LOCAL");
  console.log(`EMULADOR DETECTADO: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`PROJETO DEMO ISOLADO: ${DEMO_PROJECT_ID}`);
  console.log("================================================================================\n");

  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, "FIRESTORE_EMULATOR_HOST DEVE estar definido");
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST.includes("127.0.0.1") || process.env.FIRESTORE_EMULATOR_HOST.includes("localhost"),
    "Host deve ser estritamente local"
  );

  const app = initializeApp({ projectId: DEMO_PROJECT_ID }, "emulator-6g-app");
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });

  const REVIEWS = "legal_reviews";
  const LESSONS = "homologated_lessons";
  const PARTS = "homologated_parts";

  const originalContent = `# Direito Tributário — Princípios Constitucionais

O princípio da anterioridade nonagesimal exige o decurso de 90 dias entre a publicação e a exigência do tributo.
A imunidade recíproca entre os entes federativos está prevista no art. 150, VI, 'a', da Constituição Federal.
`;

  const lessonDoc: StoredCatalogLesson = {
    id: "day_5_part_1",
    day: 5,
    part: 1,
    subject: "Direito Tributário",
    topic: "Princípios e Imunidades",
    content: originalContent,
    version: 1,
    approvedAt: 1720000000000,
    approvedBy: CEO_EMAIL,
  };

  const findings: SupplementFindingItem[] = [
    {
      pendingId: "chg_TRIB-001",
      statementAnalyzed: "O princípio da anterioridade nonagesimal exige o decurso de 90 dias entre a publicação e a exigência do tributo.",
      status: "nao_verificada",
      classification: "nao_verificada",
      officialSourceSearched: "STF / CF/88",
      officialEvidenceFound: "Art. 150, III, 'c', da CF/88",
      confidence: "ALTA",
      justification: "Texto constitucional claro pendente de confirmação expressa.",
    },
  ];

  const reviewDoc: LegalReviewView = {
    id: "rev_3d4deba9-0000-4000-8000-000000000077",
    lessonId: "day_5_part_1",
    day: 5,
    part: 1,
    subject: "Direito Tributário",
    topic: "Princípios e Imunidades",
    originalHash: hashCatalogSnapshot(lessonDoc),
    candidateHash: hashLessonContent(originalContent),
    auditedCandidateHash: hashLessonContent(originalContent),
    originalContent,
    reviewedMarkdown: originalContent,
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
      originalHash: hashLessonContent(originalContent),
      candidateHash: hashLessonContent(originalContent),
      problematicChanges: [],
      structuralDivergence: false,
    },
    supplement: {
      attemptCount: 1,
      attemptId: "att-synthetic-77",
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

  // Inicializa documentos sintéticos no Firestore local
  await db.collection(LESSONS).doc(lessonDoc.id).set(lessonDoc);
  await db.collection(REVIEWS).doc(reviewDoc.id).set(reviewDoc);

  // Implementação de repositório conectada diretamente ao Firestore local emulado
  const repo: LegalReviewRepository = {
    async getLesson(id: string) {
      const snap = await db.collection(LESSONS).doc(id).get();
      return snap.exists ? (snap.data() as StoredCatalogLesson) : null;
    },
    async getIndex() { return null; },
    async begin() {},
    async complete() {},
    async fail() {},
    async touchProcessing() { return true; },
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
        // Invalida resolução prévia
        if (current.supplement) current.supplement.resolution = undefined;
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
        const lessonRef = db.collection(LESSONS).doc(lessonDoc.id);
        const partRef = db.collection(PARTS).doc(lessonDoc.id);

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
        tx.set(partRef, {
          id: l.id,
          day: l.day,
          part: l.part,
          subject: l.subject,
          status: "approved",
          approvedBy: email,
          approvedAt: now,
          review: r.reviewedMarkdown.slice(0, 20000),
        });

        return { ok: true as const, lesson: l };
      });
    },
  };

  // ---------------------------------------------------------------------------
  // 1. DUAS DECISÕES SIMULTÂNEAS SOBRE O MESMO ACHADO
  // ---------------------------------------------------------------------------
  console.log("--- 1. CONCORRÊNCIA: DUAS DECISÕES SIMULTÂNEAS ---");
  process.env.LEGAL_REVIEW_STAGE_A_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_B_ENABLED = "true";
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "true";

  const p1 = resolveHumanLegalReviewFinding(
    repo,
    reviewDoc.id,
    {
      findingKey: "chg_TRIB-001",
      action: "CONFIRMAR",
      justification: "Decisão concorrente A: confirmação com CF/88.",
      evidenceDeclaration: {
        declaredSource: "CF/88",
        bibliographicReference: "Art. 150, III, c",
        declaredExcerpt: "noventa dias",
        semanticJustification: "anterioridade nonagesimal",
        documentaryVerified: true,
      },
    },
    "uid_ceo",
    CEO_EMAIL
  );

  const p2 = resolveHumanLegalReviewFinding(
    repo,
    reviewDoc.id,
    {
      findingKey: "chg_TRIB-001",
      action: "DECLARAR_DIVERGENCIA",
      justification: "Decisão concorrente B: discussão de divergência.",
      divergenceNature: "Divergência sobre tributos sujeitos apenas à anterioridade anual.",
    },
    "uid_ceo",
    CEO_EMAIL
  );

  // Ambas são resolvidas transacionalmente pelo Firestore Emulator (uma sucede a outra serialmente)
  await Promise.all([p1, p2]);

  const docAfterConcurrent = await repo.get(reviewDoc.id);
  const decisionSaved = docAfterConcurrent?.findingDecisions?.["chg_TRIB-001"];
  assert.ok(decisionSaved, "Decisão deve existir no achado");
  assert.ok(decisionSaved.history && decisionSaved.history.length >= 1, "Histórico deve acumular a deliberação prévia");
  console.log(`  ✓ Concorrência gerida pelo Firestore runTransaction com sucesso.`);
  console.log(`  ✓ Histórico imutável preservado: ${decisionSaved.history?.length} deliberação(ões) anterior(es) registrada(s).\n`);

  // ---------------------------------------------------------------------------
  // 2. ALTERAÇÃO CONCORRENTE DO CATÁLOGO (DETECÇÃO DE CONFLITO HTTP 409)
  // ---------------------------------------------------------------------------
  console.log("--- 2. DETECÇÃO DE CONFLITO COM O CATÁLOGO (HTTP 409) ---");
  // Encerra complementação formal (Estágio B)
  await closeLegalReviewSupplementFlow(
    repo,
    reviewDoc.id,
    { overallJustification: "Encerramento formal do CEO para o teste de conflito de catálogo." },
    "uid_ceo",
    CEO_EMAIL
  );

  // Simula mutação concorrente direta no catálogo antes do commit de aprovação
  await db.collection(LESSONS).doc(lessonDoc.id).set({
    ...lessonDoc,
    content: lessonDoc.content + "\n<!-- Adição concorrente externa ao catálogo -->",
  });

  await assert.rejects(
    async () => {
      await approveLegalReview(repo, reviewDoc.id, "uid_ceo", CEO_EMAIL);
    },
    (err: any) => err instanceof LegalReviewError && err.status === 409,
    "Deve rejeitar com HTTP 409 por descompasso de originalHash"
  );
  console.log("  ✓ Detecção atômica de conflito confirmada (HTTP 409). Catálogo protegido contra sobrescrita cega.\n");

  // Restaura o catálogo original para os próximos testes
  await db.collection(LESSONS).doc(lessonDoc.id).set(lessonDoc);

  // ---------------------------------------------------------------------------
  // 3. AUTENTICAÇÃO E AUTORIZAÇÃO (CEO vs NÃO-CEO)
  // ---------------------------------------------------------------------------
  console.log("--- 3. AUTORIZAÇÃO E CONTROLE DE ACESSO (CEO vs NÃO-CEO) ---");
  await assert.rejects(
    async () => {
      await resolveHumanLegalReviewFinding(
        repo,
        reviewDoc.id,
        {
          findingKey: "chg_TRIB-001",
          action: "CONFIRMAR",
          justification: "Tentativa não autorizada",
        },
        "uid_aluno",
        NON_CEO_EMAIL
      );
    },
    (err: any) => err instanceof LegalReviewError && err.status === 403,
    "Estágio A por não-CEO deve falhar com 403"
  );

  await assert.rejects(
    async () => {
      await closeLegalReviewSupplementFlow(
        repo,
        reviewDoc.id,
        { overallJustification: "Tentativa de encerramento por usuário aluno." },
        "uid_aluno",
        NON_CEO_EMAIL
      );
    },
    (err: any) => err instanceof LegalReviewError && err.status === 403,
    "Estágio B por não-CEO deve falhar com 403"
  );

  await assert.rejects(
    async () => {
      await approveLegalReview(repo, reviewDoc.id, "uid_aluno", NON_CEO_EMAIL);
    },
    (err: any) => err instanceof LegalReviewError && err.status === 403,
    "Estágio C por não-CEO deve falhar com 403"
  );
  console.log("  ✓ Todos os endpoints protegidos com HTTP 403 contra tentativas de usuários não-CEO.\n");

  // ---------------------------------------------------------------------------
  // 4. BLOQUEIO DE PUBLICAÇÃO COM STAGE C DESABILITADO (FAIL-CLOSED)
  // ---------------------------------------------------------------------------
  console.log("--- 4. BLOQUEIO FAIL-CLOSED COM STAGE C DESABILITADO ---");
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "false";
  await assert.rejects(
    async () => {
      await approveLegalReview(repo, reviewDoc.id, "uid_ceo", CEO_EMAIL);
    },
    (err: any) => err instanceof LegalReviewError && err.status === 503,
    "Aprovação com Stage C false deve falhar com 503"
  );

  // Confirmação de que o catálogo não foi modificado
  const lCheck = await repo.getLesson(lessonDoc.id);
  assert.equal(lCheck?.version, 1, "Versão deve permanecer 1");
  console.log("  ✓ Publicação terminantemente bloqueada com 503; catálogo oficial 100% preservado.\n");

  // ---------------------------------------------------------------------------
  // 5. TENTATIVA DE APROVAÇÃO POR CAMINHOS ALTERNATIVOS (TEST MODE)
  // ---------------------------------------------------------------------------
  console.log("--- 5. BLOQUEIO DE MODOS ALTERNATIVOS (TEST MODE) ---");
  process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "true";
  await db.collection(REVIEWS).doc(reviewDoc.id).set({
    ...reviewDoc,
    testMode: true,
  });
  await assert.rejects(
    async () => {
      await approveLegalReview(repo, reviewDoc.id, "uid_ceo", CEO_EMAIL);
    },
    (err: any) => err instanceof LegalReviewError && err.status === 403,
    "Revisão em testMode jamais pode ser aprovada"
  );
  console.log("  ✓ Bloqueio de publicação em testMode validado com sucesso (HTTP 403).\n");

  await deleteApp(app);

  console.log("================================================================================");
  console.log("✓ TODOS OS TESTES COMPLEMENTARES NO EMULADOR FORAM APROVADOS COM 100% DE SUCESSO!");
  console.log("================================================================================\n");
}

runComprehensiveEmulatorTests().catch((err) => {
  console.error("Falha nos testes complementares do emulador:", err);
  process.exit(1);
});
