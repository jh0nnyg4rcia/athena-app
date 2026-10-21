import assert from "node:assert/strict";
import { getApps as getAdminApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { initializeApp as initializeClientApp, getApps as getClientApps } from "firebase/app";
import { getFirestore as getClientFirestore, connectFirestoreEmulator, terminate } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };
import { createFirestoreLegalReviewRepository } from "../src/services/legalReviewStore.ts";
import { persistCeoCatalogLesson } from "../src/services/persistCeoCatalogLesson.ts";
import { FirestoreInternalCatalogService } from "../src/api/internalCatalogRoutes.ts";
import { createStudyProgressCore } from "../src/server/studyProgressCore.ts";
import { hashCatalogSnapshot } from "../src/services/legalReviewRepository.ts";

process.env.LEGAL_REVIEW_STAGE_C_ENABLED = "true";

const DATABASE_ID = firebaseConfig.firestoreDatabaseId;
const CEO_EMAIL = "jhonny.spider@gmail.com";

const clean = (v) => JSON.parse(JSON.stringify(v));

// 1. Admin SDK (para setup, assertions e createFirestoreLegalReviewRepository)
const adminApp = getAdminApps().length ? getAdminApps()[0] : initializeAdminApp({ projectId: firebaseConfig.projectId });
const adminDb = getAdminFirestore(adminApp, DATABASE_ID);

// 2. Client SDK (para persistCeoCatalogLesson, que usa modular firebase/firestore)
const clientApp = getClientApps().length ? getClientApps()[0] : initializeClientApp({
  projectId: firebaseConfig.projectId,
  apiKey: "synthetic-local",
  authDomain: "localhost",
}, "client-sync-verifier");
const clientDb = getClientFirestore(clientApp, DATABASE_ID);
const [host, portStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8197").split(":");
connectFirestoreEmulator(clientDb, host, parseInt(portStr, 10));

console.log("=== INICIANDO VERIFICAÇÃO DIRECIONADA DE SINCRONIZAÇÃO DE VERSÕES DO CEO ===");

try {
  // -----------------------------------------------------------------------------
  // CASO 1: Publicação CEO Direta (persistCeoCatalogLesson)
  // -----------------------------------------------------------------------------
  console.log("\n[CASO 1] Testando persistCeoCatalogLesson (caminho de publicação CEO)...");
  const lessonId1 = "day_1_part_1";
  const lessonRef1 = adminDb.collection("homologated_lessons").doc(lessonId1);
  const catalogRef1 = adminDb.collection("homologated_parts").doc(lessonId1);

  // Baseline: versão 1 em ambas as coleções
  const initialContent1 = "[BLOCK_1]\nTexto inicial da aula 1.\n\n[BLOCK_2]\nConteúdo do bloco 2.\n\n[BLOCK_3]\nBloco 3.\n\n[BLOCK_4]\nBloco 4.\n\n[BLOCK_5]\nBloco 5.\n\n[BLOCK_6]\nRevisão jurídica inicial.";
  const initialLesson1 = {
    id: lessonId1,
    day: 1,
    part: 1,
    subject: "Direito Constitucional",
    topic: "Controle de Constitucionalidade",
    content: initialContent1,
    blocks: [
      "[BLOCK_1]\nTexto inicial da aula 1.",
      "[BLOCK_2]\nConteúdo do bloco 2.",
      "[BLOCK_3]\nBloco 3.",
      "[BLOCK_4]\nBloco 4.",
      "[BLOCK_5]\nBloco 5.",
      "[BLOCK_6]\nRevisão jurídica inicial.",
    ],
    status: "approved",
    approvedBy: CEO_EMAIL,
    approvedAt: 1000,
    version: 1,
  };

  await lessonRef1.set(initialLesson1);
  await catalogRef1.set({
    id: lessonId1,
    day: 1,
    part: 1,
    subject: "Direito Constitucional",
    status: "approved",
    approvedBy: CEO_EMAIL,
    approvedAt: 1000,
    version: 1,
  });

  // Executa publicação CEO via persistCeoCatalogLesson
  const editedLesson1 = {
    ...initialLesson1,
    content: initialContent1.replace("Texto inicial da aula 1.", "Texto atualizado pelo CEO na aula 1."),
    approvedAt: 2000,
  };

  const saved1 = await persistCeoCatalogLesson(clientDb, editedLesson1, clean);

  const afterLessonSnap1 = await lessonRef1.get();
  const afterCatalogSnap1 = await catalogRef1.get();

  assert.ok(afterLessonSnap1.exists, "homologated_lessons deve existir");
  assert.ok(afterCatalogSnap1.exists, "homologated_parts deve existir");

  const lessonData1 = afterLessonSnap1.data();
  const catalogData1 = afterCatalogSnap1.data();

  console.log(`  homologated_lessons.version = ${lessonData1.version}`);
  console.log(`  homologated_parts.version   = ${catalogData1.version}`);

  assert.strictEqual(lessonData1.version, 2, "homologated_lessons deve ter avançado para a versão 2");
  assert.strictEqual(catalogData1.version, 2, "homologated_parts deve ter avançado para a versão 2 na mesma transação");
  assert.strictEqual(lessonData1.version, catalogData1.version, "Aula e catálogo devem compartilhar estritamente a mesma versão");
  assert.strictEqual(saved1.version, 2, "Objeto retornado deve reportar a versão 2");
  console.log("  ✓ CASO 1 APROVADO: persistCeoCatalogLesson grava a mesma versão resultante na aula e no catálogo atomicamente.");

  // -----------------------------------------------------------------------------
  // CASO 2: Aprovação da Revisão Jurídica (createFirestoreLegalReviewRepository.approve)
  // -----------------------------------------------------------------------------
  console.log("\n[CASO 2] Testando aprovação da revisão jurídica (legalReviewStore.approve)...");
  const lessonId2 = "day_1_part_2";
  const reviewId2 = "rev-sync-verification-2";
  const lessonRef2 = adminDb.collection("homologated_lessons").doc(lessonId2);
  const catalogRef2 = adminDb.collection("homologated_parts").doc(lessonId2);
  const reviewRef2 = adminDb.collection("legal_reviews").doc(reviewId2);
  const indexRef2 = adminDb.collection("legal_review_index").doc(lessonId2);

  const challenge2 = { questions: [{ text: "Questão 1?", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "Explicação 1." }] };
  const initialContent2 = `[BLOCK_1]\nTexto original 2.\n\n[BLOCK_2]\nBloco 2 original.\n\n[BLOCK_3]\nBloco 3 original.\n\n[BLOCK_4]\nBloco 4 original.\n\n[BLOCK_5]\n[ATHENA_CHALLENGE]\n${JSON.stringify(challenge2)}\n\n[BLOCK_6]\nRevisão original.`;
  const initialLesson2 = {
    id: lessonId2,
    day: 1,
    part: 2,
    subject: "Direito Administrativo",
    topic: "Atos Administrativos",
    content: initialContent2,
    challenge: challenge2,
    status: "approved",
    approvedBy: CEO_EMAIL,
    approvedAt: 3000,
    version: 2,
  };

  await lessonRef2.set(initialLesson2);
  await catalogRef2.set({
    id: lessonId2,
    day: 1,
    part: 2,
    subject: "Direito Administrativo",
    status: "approved",
    approvedBy: CEO_EMAIL,
    approvedAt: 3000,
    version: 2,
  });

  const originalHash2 = hashCatalogSnapshot(initialLesson2);
  const reviewedMarkdown2 = initialContent2.replace("Texto original 2.", "Texto revisado pelo consultor jurídico.");

  await reviewRef2.set({
    id: reviewId2,
    lessonId: lessonId2,
    day: 1,
    part: 2,
    originalContent: initialContent2,
    originalHash: originalHash2,
    candidateContent: reviewedMarkdown2,
    reviewedMarkdown: reviewedMarkdown2,
    changes: [],
    humanDecisions: {},
    status: "pending_approval",
    verificationLevel: "FONTES_OFICIAIS_VALIDADAS",
    reviewDate: new Date().toISOString(),
    editorialIntegrity: {
      passed: true,
      status: "APPROVED_COMPLETE",
      problematicChanges: [],
    },
  });

  await indexRef2.set({
    lessonId: lessonId2,
    processingReviewId: null,
    processingStartedAt: null,
    approvedHash: null,
    approvedReviewId: null,
    latestReviewId: reviewId2,
    latestStatus: "pending_approval",
  });

  const repo = createFirestoreLegalReviewRepository();
  const approveResult = await repo.approve(reviewId2, "uid_ceo", CEO_EMAIL, 4000);

  assert.strictEqual(approveResult.ok, true, "Aprovação deve retornar ok: true");

  const afterLessonSnap2 = await lessonRef2.get();
  const afterCatalogSnap2 = await catalogRef2.get();

  const lessonData2 = afterLessonSnap2.data();
  const catalogData2 = afterCatalogSnap2.data();

  console.log(`  homologated_lessons.version = ${lessonData2.version}`);
  console.log(`  homologated_parts.version   = ${catalogData2.version}`);

  assert.strictEqual(lessonData2.version, 3, "homologated_lessons deve ter avançado para a versão 3 (v2 + 1)");
  assert.strictEqual(catalogData2.version, 3, "homologated_parts deve ter avançado para a versão 3 na mesma transação");
  assert.strictEqual(lessonData2.version, catalogData2.version, "Aula e catálogo devem compartilhar estritamente a versão 3");
  console.log("  ✓ CASO 2 APROVADO: Transação de aprovação da revisão jurídica grava a mesma versão resultante na aula e no catálogo atomicamente.");

  // -----------------------------------------------------------------------------
  // CASO 3: Consistência Pedagógica (studyProgressCore & internalCatalogRoutes)
  // -----------------------------------------------------------------------------
  console.log("\n[CASO 3] Testando integridade pedagógica e consultas sem disparar CATALOG_INCONSISTENT...");

  // Teste de consulta de catálogo via FirestoreInternalCatalogService
  const catalogService = new FirestoreInternalCatalogService();
  catalogService.firestoreInstance = adminDb;
  const listResult = await catalogService.listHomologatedParts({ day: 1 });
  const foundInCatalog = listResult.aulas.find(a => a.id === lessonId2);
  assert.ok(foundInCatalog, "Aula 2 deve ser listada no catálogo oficial");
  console.log(`  Catálogo oficial retornou aula ${foundInCatalog.id} com status '${foundInCatalog.status}'.`);

  // Teste de estudo do aluno via studyProgressCore
  const core = createStudyProgressCore(adminDb, () => 5, () => 5000);
  const studentActor = { uid: "test_student_version_sync", emailVerified: true, provider: "password" };

  // Inicializa progresso com dia 1 autorizado (gratuito)
  const viewResult = await core.view(studentActor, lessonId2);
  assert.ok(viewResult.lesson, "Aluno deve conseguir abrir a aula sem erro");
  assert.strictEqual(viewResult.lesson.version, 3, "Versão entregue ao aluno deve ser 3");
  console.log(`  studyProgressCore.view entregou a aula com versão ${viewResult.lesson.version} sem erros.`);

  console.log("\n===============================================================================");
  console.log("TODOS OS 3 CASOS DE SINCRONIZAÇÃO DE VERSÃO FORAM CONCLUÍDOS COM 100% DE SUCESSO!");
  console.log("===============================================================================\n");
} finally {
  await terminate(clientDb);
}
