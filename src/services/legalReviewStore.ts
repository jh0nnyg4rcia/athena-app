import firebaseConfig from "../../firebase-applet-config.json";
import homologatedSeedsData from "../data/homologatedSeeds.json";
import { embedChallengeInContent, extractChallengeFromText } from "../lib/objectiveChallenge";
import {
  emptyReviewIndex,
  type LegalReviewIndex,
  type LegalReviewSupplement,
  type LegalReviewView,
  type StoredCatalogLesson,
  LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE,
  getLegalReviewOperationalFlags,
} from "../lib/legalReviewTypes";
import { candidateMarkdownAccepted, nextPublishedLesson, reviewAfterManualEdit } from "./legalReviewPublish";
import { isCeoEmail } from "../lib/contentProvider";
import { validateFindingsForClosure, validateFindingsHomologation, validateEditorialIntegrity, computeDecisionStateHash } from "../lib/legalReviewValidate";
import {
  LegalReviewError,
  LEGAL_REVIEW_TEST_PUBLISH_MESSAGE,
  hashCatalogSnapshot,
  INTERRUPTED_PROCESSING_MESSAGE,
  processingLockBlocks,
  processingLockFresh,
  reviewCannotBePublished,
  type LegalReviewRepository,
} from "./legalReviewRepository";

const DATABASE_ID = firebaseConfig.firestoreDatabaseId;
const REVIEWS = "legal_reviews";
const INDEX = "legal_review_index";
const LESSONS = "homologated_lessons";
const PARTS = "homologated_parts";

type Snap = { exists: boolean; data: () => Record<string, unknown> | undefined };
type DocRef = { get: () => Promise<Snap> };
type Tx = {
  get: (ref: DocRef) => Promise<Snap>;
  set: (ref: DocRef, data: Record<string, unknown>, opts?: { merge?: boolean }) => void;
};
type Db = {
  collection: (name: string) => { doc: (id: string) => DocRef };
  runTransaction: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;
};

let dbReady: Promise<Db> | null = null;

async function loadDb(): Promise<Db> {
  if (!dbReady) {
    dbReady = (async () => {
      const appMod = await import("firebase-admin/app");
      const dbMod = await import("firebase-admin/firestore");
      const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp();
      const firestore = dbMod.getFirestore(app, DATABASE_ID);
      try {
        firestore.settings({ ignoreUndefinedProperties: true });
      } catch {
        // Ignora caso settings() já tenha sido invocado nesta instância
      }
      return firestore as unknown as Db;
    })().catch((error) => {
      dbReady = null;
      console.warn("[legal-review] Admin SDK indisponível.");
      throw error;
    });
  }
  return dbReady;
}

function unavailable(): LegalReviewError {
  return new LegalReviewError(
    "Não foi possível registrar a revisão. A aula publicada não foi alterada.",
    503
  );
}

export function cleanFirestoreData<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    return input.map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (value !== undefined) {
        out[key] = cleanFirestoreData(value);
      }
    }
    return out as T;
  }
  return input;
}

function definedRecord(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function asLesson(id: string, data: Record<string, unknown> | undefined): StoredCatalogLesson | null {
  if (!data || typeof data.content !== "string" || data.content.trim().length < 20) return null;
  return {
    id: typeof data.id === "string" ? data.id : id,
    day: Number(data.day),
    part: Number(data.part),
    subject: typeof data.subject === "string" ? data.subject : "Trilha Jurídica",
    topic: typeof data.topic === "string" ? data.topic : undefined,
    content: data.content,
    challenge: data.challenge,
    status: typeof data.status === "string" ? data.status : undefined,
    approvedBy: typeof data.approvedBy === "string" ? data.approvedBy : undefined,
    approvedAt: typeof data.approvedAt === "number" ? data.approvedAt : undefined,
    modelUsed: typeof data.modelUsed === "string" ? data.modelUsed : undefined,
    version: typeof data.version === "number" ? data.version : undefined,
    review: typeof data.review === "string" ? data.review : undefined,
  };
}

function asIndex(lessonId: string, data: Record<string, unknown> | undefined): LegalReviewIndex {
  if (!data) return emptyReviewIndex(lessonId);
  return {
    lessonId,
    processingReviewId: typeof data.processingReviewId === "string" ? data.processingReviewId : null,
    processingStartedAt: typeof data.processingStartedAt === "number" ? data.processingStartedAt : null,
    approvedHash: typeof data.approvedHash === "string" ? data.approvedHash : null,
    approvedReviewId: typeof data.approvedReviewId === "string" ? data.approvedReviewId : null,
    approvedReviewDate: typeof data.approvedReviewDate === "string" ? data.approvedReviewDate : null,
    latestReviewId: typeof data.latestReviewId === "string" ? data.latestReviewId : null,
    latestStatus: typeof data.latestStatus === "string" ? data.latestStatus : null,
  };
}

function asReview(data: Record<string, unknown> | undefined): LegalReviewView | null {
  if (!data || typeof data.id !== "string" || typeof data.originalContent !== "string") return null;
  return data as unknown as LegalReviewView;
}

async function readDoc(db: Db, collection: string, id: string): Promise<Snap> {
  return db.collection(collection).doc(id).get();
}

export function createFirestoreLegalReviewRepository(): LegalReviewRepository {
  return {
    async getLesson(lessonId) {
      try {
        const db = await loadDb();
        const snap = await readDoc(db, LESSONS, lessonId);
        const fromDb = asLesson(lessonId, snap.exists ? snap.data() : undefined);
        if (fromDb) return fromDb;
        const seeds = (homologatedSeedsData || {}) as Record<string, unknown>;
        const seed = seeds[lessonId] as Record<string, unknown> | undefined;
        if (seed && typeof seed.content === "string" && seed.content.trim().length >= 20) {
          return asLesson(lessonId, seed);
        }
        return null;
      } catch (error) {
        try {
          const seeds = (homologatedSeedsData || {}) as Record<string, unknown>;
          const seed = seeds[lessonId] as Record<string, unknown> | undefined;
          if (seed && typeof seed.content === "string" && seed.content.trim().length >= 20) {
            return asLesson(lessonId, seed);
          }
        } catch {
          // ignore
        }
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async getIndex(lessonId) {
      try {
        const db = await loadDb();
        const snap = await readDoc(db, INDEX, lessonId);
        if (!snap.exists) return emptyReviewIndex(lessonId);
        return asIndex(lessonId, snap.data());
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async begin(review) {
      try {
        const db = await loadDb();
        await db.runTransaction(async (tx) => {
          const indexRef = db.collection(INDEX).doc(review.lessonId);
          const currentSnap = await tx.get(indexRef);
          const current = asIndex(review.lessonId, currentSnap.exists ? currentSnap.data() : undefined);
          const previousId = current.processingReviewId && current.processingReviewId !== review.id
            ? current.processingReviewId
            : null;
          const previousRef = previousId ? db.collection(REVIEWS).doc(previousId) : null;
          const previousSnap = previousRef ? await tx.get(previousRef) : null;
          const previous = previousSnap?.exists ? asReview(previousSnap.data()) : null;
          const currentLatestId = current.latestReviewId && current.latestReviewId !== review.id
            ? current.latestReviewId
            : null;
          if (currentLatestId) {
            const currentLatestRef = db.collection(REVIEWS).doc(currentLatestId);
            const currentLatestSnap = await tx.get(currentLatestRef);
            const currentLatest = currentLatestSnap?.exists ? asReview(currentLatestSnap.data()) : null;
            if (currentLatest && currentLatest.status === "pending_approval") {
              throw new LegalReviewError(
                `Não é permitido iniciar ou registrar nova revisão enquanto existir uma revisão pendente de aprovação (ID: ${currentLatest.id}). O índice do catálogo preserva a auditoria histórica.`,
                409
              );
            }
          }
          if (processingLockBlocks(current, previous, review.requestedAt)) {
            throw new LegalReviewError(
              "Já existe uma revisão em andamento para esta aula. Aguarde a conclusão antes de iniciar outra.",
              409
            );
          }
          if (previousRef && previous?.status === "processing" && !processingLockFresh(current, review.requestedAt)) {
            tx.set(previousRef, {
              status: "uncertain_failure",
              errorMessage: "A revisão anterior foi interrompida com estado de execução incerta durante o processamento. Requer intervenção explícita do CEO.",
            }, { merge: true });
          }
          tx.set(db.collection(REVIEWS).doc(review.id), definedRecord({ ...review }));
          tx.set(indexRef, {
            lessonId: review.lessonId,
            processingReviewId: review.id,
            processingStartedAt: review.requestedAt,
            latestReviewId: review.id,
            latestStatus: review.status || "processing",
            approvedHash: current.approvedHash,
            approvedReviewId: current.approvedReviewId,
            approvedReviewDate: current.approvedReviewDate,
          }, { merge: true });
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async claimJob(reviewId, lessonId, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const indexRef = db.collection(INDEX).doc(lessonId);
          const revSnap = await tx.get(reviewRef);
          if (!revSnap.exists) return false;
          const rev = asReview(revSnap.data());
          if (!rev || rev.status !== "queued") return false;

          const indexSnap = await tx.get(indexRef);
          const idx = asIndex(lessonId, indexSnap.exists ? indexSnap.data() : undefined);

          // Garante aquisição exclusiva
          tx.set(reviewRef, { status: "processing" }, { merge: true });
          tx.set(indexRef, {
            processingReviewId: reviewId,
            processingStartedAt: now,
            latestStatus: "processing",
          }, { merge: true });
          return true;
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async touchProcessing(lessonId, reviewId, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const indexRef = db.collection(INDEX).doc(lessonId);
          const currentSnap = await tx.get(indexRef);
          const current = asIndex(lessonId, currentSnap.exists ? currentSnap.data() : undefined);
          if (current.processingReviewId !== reviewId) return false;
          tx.set(indexRef, { processingStartedAt: now }, { merge: true });
          return true;
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async complete(review) {
      try {
        if (JSON.stringify(review).length > 1_000_000) {
          throw new LegalReviewError(
            "A revisão ficou grande demais para ser registrada. A aula publicada não foi alterada.",
            413
          );
        }
        const db = await loadDb();
        await db.runTransaction(async (tx) => {
          const reviewRef = db.collection(REVIEWS).doc(review.id);
          const indexRef = db.collection(INDEX).doc(review.lessonId);
          const indexSnap = await tx.get(indexRef);
          const index = asIndex(review.lessonId, indexSnap.exists ? indexSnap.data() : undefined);
          tx.set(reviewRef, definedRecord({ ...review }), { merge: true });
          if (!index.processingReviewId || index.processingReviewId === review.id) {
            tx.set(indexRef, {
              lessonId: review.lessonId,
              processingReviewId: null,
              processingStartedAt: null,
              latestReviewId: review.id,
              latestStatus: review.status,
            }, { merge: true });
          }
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async fail(reviewId, lessonId, message, failureStatus = "failed") {
      try {
        const db = await loadDb();
        await db.runTransaction(async (tx) => {
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const indexRef = db.collection(INDEX).doc(lessonId);
          const snap = await tx.get(reviewRef);
          const indexSnap = await tx.get(indexRef);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review || (review.status !== "processing" && review.status !== "queued")) return;
          const index = asIndex(lessonId, indexSnap.exists ? indexSnap.data() : undefined);
          tx.set(reviewRef, {
            status: failureStatus,
            errorMessage: message.slice(0, 280),
          }, { merge: true });
          if (index.processingReviewId === reviewId) {
            tx.set(indexRef, {
              processingReviewId: null,
              processingStartedAt: null,
              latestReviewId: reviewId,
              latestStatus: failureStatus,
            }, { merge: true });
          }
        });
      } catch {
        console.warn("[legal-review] Não foi possível arquivar a falha. A aula publicada permanece intacta.");
      }
    },
    async get(reviewId) {
      try {
        const db = await loadDb();
        const snap = await readDoc(db, REVIEWS, reviewId);
        if (!snap.exists) return null;
        return asReview(snap.data());
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async saveCandidate(reviewId, markdown, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const ref = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(ref);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review || review.status !== "pending_approval") {
            throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
          }
          if (!candidateMarkdownAccepted(review.originalContent, markdown)) {
            throw new LegalReviewError("O Markdown revisado quebrou a estrutura da aula. A candidata não foi salva.", 400);
          }
          const challenge = extractChallengeFromText(markdown).challenge
            || extractChallengeFromText(review.originalContent).challenge;
          const nextMarkdown = challenge ? embedChallengeInContent(markdown, challenge) : markdown;
          const edited = reviewAfterManualEdit(review, nextMarkdown, now);
          const updatedSupplement = edited.supplement ? {
            ...edited.supplement,
            resolution: undefined,
          } : undefined;
          tx.set(ref, {
            reviewedMarkdown: edited.reviewedMarkdown,
            manuallyEdited: edited.manuallyEdited,
            manuallyEditedAt: edited.manuallyEditedAt ?? null,
            candidateHash: edited.candidateHash,
            verificationLevel: edited.verificationLevel,
            sourceHistory: edited.sourceHistory,
            ...(updatedSupplement ? { supplement: updatedSupplement } : {}),
          }, { merge: true });
          return {
            ...edited,
            supplement: updatedSupplement,
          };
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async saveHumanDecisions(reviewId, markdown, humanDecisions, editorialIntegrity, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const ref = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(ref);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review || review.status !== "pending_approval") {
            throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
          }
          if (!candidateMarkdownAccepted(review.originalContent, markdown)) {
            throw new LegalReviewError("O Markdown revisado quebrou a estrutura da aula. A candidata não foi salva.", 400);
          }
          const challenge = extractChallengeFromText(markdown).challenge
            || extractChallengeFromText(review.originalContent).challenge;
          const nextMarkdown = challenge ? embedChallengeInContent(markdown, challenge) : markdown;
          const edited = reviewAfterManualEdit(review, nextMarkdown, now);
          const mergedDecisions = {
            ...(review.humanDecisions || {}),
            ...humanDecisions,
          };
          // Invalidação obrigatória: qualquer edição no reviewedMarkdown invalida o encerramento da complementação
          const updatedSupplement = review.supplement ? {
            ...review.supplement,
            resolution: undefined,
          } : undefined;

          const updated: LegalReviewView = {
            ...edited,
            humanDecisions: mergedDecisions,
            editorialIntegrity,
            supplement: updatedSupplement,
          };
          tx.set(ref, {
            reviewedMarkdown: updated.reviewedMarkdown,
            manuallyEdited: updated.manuallyEdited,
            manuallyEditedAt: updated.manuallyEditedAt ?? null,
            candidateHash: updated.candidateHash,
            verificationLevel: updated.verificationLevel,
            sourceHistory: updated.sourceHistory,
            humanDecisions: updated.humanDecisions,
            editorialIntegrity: updated.editorialIntegrity,
            ...(updatedSupplement ? { supplement: updatedSupplement } : {}),
          }, { merge: true });
          return updated;
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async saveFindingDecision(reviewId, findingDecision, now) {
      const flags = getLegalReviewOperationalFlags();
      if (!flags.stageAEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE, 503);
      }
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const ref = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(ref);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review || review.status !== "pending_approval") {
            throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
          }

          // Validação transacional estrita de concorrência e integridade do hash do candidato (Etapa 8.2)
          const expectedHash = (findingDecision.expectedCandidateHash || "").trim().toLowerCase();
          const currentHash = (review.candidateHash || "").trim().toLowerCase();
          if (!expectedHash) {
            throw new LegalReviewError("O hash esperado do candidato (expectedCandidateHash) é obrigatório.", 400);
          }
          if (!/^[a-f0-9]{64}$/i.test(expectedHash)) {
            throw new LegalReviewError("O formato de expectedCandidateHash é inválido (deve ser SHA-256 hexadecimal com 64 caracteres).", 400);
          }
          if (currentHash && expectedHash !== currentHash) {
            throw new LegalReviewError(
              "A revisão jurídica foi modificada desde o carregamento da página. O texto candidato atual difere da versão visualizada. Recarregue a página antes de deliberar.",
              409
            );
          }

          const existingDecisions = review.findingDecisions || {};
          const prior = existingDecisions[findingDecision.findingKey];

          // Preserva histórico cumulativo imutável
          const priorHistory = prior?.history || [];
          const newHistory = [...priorHistory];
          if (prior) {
            newHistory.push({
              action: prior.action,
              state: prior.state,
              justification: prior.justification,
              evidenceDeclaration: prior.evidenceDeclaration,
              divergenceNature: prior.divergenceNature,
              correctionChangeId: prior.correctionChangeId,
              expurgationConfirmed: prior.expurgationConfirmed,
              expectedCandidateHash: prior.expectedCandidateHash,
              candidateHashAtDecision: prior.candidateHashAtDecision,
              decidedAt: prior.decidedAt,
              decidedByUid: prior.decidedByUid,
              decidedByEmail: prior.decidedByEmail,
            });
          }

          const consolidatedDecision: import("../lib/legalReviewTypes").HumanFindingDecision = {
            ...findingDecision,
            expectedCandidateHash: expectedHash,
            decidedAt: now,
            candidateHashAtDecision: review.candidateHash,
            history: newHistory,
          };

          const mergedFindingDecisions = {
            ...existingDecisions,
            [findingDecision.findingKey]: consolidatedDecision,
          };

          // supplement.findings é estritamente preservado intacto (sem mutação)
          const updated: LegalReviewView = {
            ...review,
            findingDecisions: mergedFindingDecisions,
          };

          tx.set(ref, {
            findingDecisions: mergedFindingDecisions,
          }, { merge: true });

          return updated;
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async closeSupplementResolution(reviewId, resolution, now, expectedHashes) {
      const flags = getLegalReviewOperationalFlags();
      if (!flags.stageBEnabled) {
        throw new LegalReviewError(LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE, 503);
      }
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const ref = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(ref);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review || review.status !== "pending_approval") {
            throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
          }
          if (!review.supplement) {
            throw new LegalReviewError("Esta revisão não possui complementação jurídica para encerrar.", 404);
          }

          // Proteção contra duplicidade de encerramento já realizado
          if (review.supplement.resolution && review.supplement.resolution.status === "RESOLVIDO_PELO_CEO") {
            if (review.supplement.resolution.candidateHashAtClosure === review.candidateHash) {
              throw new LegalReviewError(
                "A complementação jurídica já foi encerrada anteriormente pelo CEO para esta mesma versão do texto candidato.",
                409
              );
            }
          }

          // Validação transacional estrita de concorrência e integridade de hashes (Etapa 15.1)
          if (expectedHashes) {
            const expCandHash = (expectedHashes.expectedCandidateHash || "").trim().toLowerCase();
            const expDecHash = (expectedHashes.expectedDecisionStateHash || "").trim().toLowerCase();

            if (!expCandHash) {
              throw new LegalReviewError("O hash esperado do candidato (expectedCandidateHash) é obrigatório.", 400);
            }
            if (!/^[a-f0-9]{64}$/i.test(expCandHash)) {
              throw new LegalReviewError(
                "O formato de expectedCandidateHash é inválido (deve ser SHA-256 hexadecimal com 64 caracteres).",
                400
              );
            }

            if (!expDecHash) {
              throw new LegalReviewError("O hash esperado do estado de deliberações (expectedDecisionStateHash) é obrigatório.", 400);
            }
            if (!/^[a-f0-9]{64}$/i.test(expDecHash)) {
              throw new LegalReviewError(
                "O formato de expectedDecisionStateHash é inválido (deve ser SHA-256 hexadecimal com 64 caracteres).",
                400
              );
            }

            const currentCandidateHash = (review.candidateHash || "").trim().toLowerCase();
            if (currentCandidateHash && expCandHash !== currentCandidateHash) {
              throw new LegalReviewError(
                "A revisão jurídica foi modificada desde o carregamento da página. O texto candidato atual difere da versão visualizada. Recarregue a página antes de encerrar.",
                409
              );
            }

            const currentDecisionStateHash = computeDecisionStateHash(review).toLowerCase();
            if (expDecHash !== currentDecisionStateHash) {
              throw new LegalReviewError(
                "O estado das deliberações individuais foi modificado desde o carregamento da página. As decisões registradas diferem da versão visualizada. Recarregue a página antes de encerrar.",
                409
              );
            }
          }

          const check = validateFindingsForClosure(review);
          if (!check.ok) {
            throw new LegalReviewError(
              `O encerramento da complementação foi rejeitado porque existem pendências não resolvidas:\n- ${check.failureReasons.join("\n- ")}`,
              400
            );
          }

          if ((resolution.overallJustification || "").trim().length < 15) {
            throw new LegalReviewError(
              "A justificativa global de encerramento da complementação pelo CEO é insuficiente (mínimo de 15 caracteres).",
              400
            );
          }

          const priorResolution = review.supplement.resolution;
          const priorHistory = [...(priorResolution?.history || [])];
          if (priorResolution && priorResolution.candidateHashAtClosure !== review.candidateHash) {
            priorHistory.push({
              status: priorResolution.status,
              closedAt: priorResolution.closedAt,
              closedByUid: priorResolution.closedByUid,
              closedByEmail: priorResolution.closedByEmail,
              overallJustification: priorResolution.overallJustification,
              candidateHashAtClosure: priorResolution.candidateHashAtClosure,
              totalFindingsResolved: priorResolution.totalFindingsResolved,
            });
          }

          const updatedSupplement: import("../lib/legalReviewTypes").LegalReviewSupplement = {
            ...review.supplement,
            resolution: {
              ...resolution,
              candidateHashAtClosure: review.candidateHash,
              closedAt: now,
              history: priorHistory,
            },
          };

          const updated: LegalReviewView = {
            ...review,
            supplement: updatedSupplement,
          };

          tx.set(ref, {
            supplement: updatedSupplement,
          }, { merge: true });

          return updated;
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async reject(reviewId, uid, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const ref = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(ref);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review || (review.status !== "pending_approval" && review.status !== "processing")) {
            throw new LegalReviewError("Esta revisão não pode mais ser rejeitada.", 409);
          }
          const indexRef = db.collection(INDEX).doc(review.lessonId);
          const indexSnap = await tx.get(indexRef);
          const index = asIndex(review.lessonId, indexSnap.exists ? indexSnap.data() : undefined);
          tx.set(ref, { status: "rejected", rejectedByUid: uid, rejectedAt: now }, { merge: true });
          if (!index.processingReviewId || index.processingReviewId === review.id) {
            tx.set(indexRef, {
              processingReviewId: null,
              processingStartedAt: null,
              latestReviewId: review.id,
              latestStatus: "rejected",
            }, { merge: true });
          }
          return { ...review, status: "rejected" as const, rejectedByUid: uid, rejectedAt: now };
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async approve(reviewId, uid, email, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const flags = getLegalReviewOperationalFlags();
          if (!flags.stageCEnabled) {
            throw new LegalReviewError(LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE, 503);
          }
          if (!isCeoEmail(email)) {
            throw new LegalReviewError("A aprovação exige a identidade autenticada do CEO.", 403);
          }
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const reviewSnap = await tx.get(reviewRef);
          const review = asReview(reviewSnap.exists ? reviewSnap.data() : undefined);
          if (!review || review.status !== "pending_approval") {
            throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
          }
          if (reviewCannotBePublished(review)) {
            throw new LegalReviewError(LEGAL_REVIEW_TEST_PUBLISH_MESSAGE, 403);
          }
          if (review.verificationLevel === "FALHA_NA_VERIFICACAO") {
            throw new LegalReviewError(
              "A aprovação integral está bloqueada porque a verificação em fontes oficiais falhou ou é insuficiente. A aula publicada não foi alterada.",
              403
            );
          }
          const isInconclusive = review.supplement?.status === "inconclusive";
          const hasUnverified = Boolean(
            review.supplement?.findings?.some(
              (f) => f.status === "nao_verificada" || (f as any).classification === "nao_verificada"
            )
          );
          if (isInconclusive || hasUnverified || review.supplement?.resolution) {
            const homologation = validateFindingsHomologation(review);
            if (!homologation.ok) {
              throw new LegalReviewError(
                `A aprovação está bloqueada por pendências na complementação jurídica:\n- ${homologation.failureReasons.join("\n- ")}`,
                400
              );
            }
          }
          const integrity = review.editorialIntegrity || validateEditorialIntegrity(
            review.originalContent,
            review.reviewedMarkdown,
            review.changes,
            {
              verificationLevel: review.verificationLevel,
              humanDecisions: review.humanDecisions,
            }
          );
          if (!integrity.passed || integrity.status === "EDITORIAL_REVIEW_INCOMPLETE") {
            throw new LegalReviewError(
              `A aprovação está bloqueada por integridade editorial incompleta (alterações não aplicadas ou inconsistentes: ${integrity.problematicChanges.join(", ")}). A aula publicada não foi alterada.`,
              400
            );
          }
          const lessonRef = db.collection(LESSONS).doc(review.lessonId);
          const indexRef = db.collection(INDEX).doc(review.lessonId);
          const lessonSnap = await tx.get(lessonRef);
          const indexSnap = await tx.get(indexRef);
          const lesson = asLesson(review.lessonId, lessonSnap.exists ? lessonSnap.data() : undefined);
          if (!lesson) {
            throw new LegalReviewError("A aula publicada não foi encontrada. Nada foi substituído.", 404);
          }
          if (hashCatalogSnapshot(lesson) !== review.originalHash) {
            return { ok: false as const, conflict: true as const };
          }
          const index = asIndex(review.lessonId, indexSnap.exists ? indexSnap.data() : undefined);
          const ownsLock = !index.processingReviewId || index.processingReviewId === review.id;
          const published = nextPublishedLesson(lesson, review.reviewedMarkdown, now, email);
          tx.set(lessonRef, definedRecord({
            id: published.id,
            day: published.day,
            part: published.part,
            subject: published.subject,
            topic: published.topic,
            content: published.content,
            challenge: published.challenge,
            status: "approved",
            approvedBy: email,
            approvedAt: published.approvedAt,
            modelUsed: published.modelUsed,
            version: published.version,
            review: published.review,
          }), { merge: true });
          tx.set(db.collection(PARTS).doc(published.id), {
            id: published.id,
            day: published.day,
            part: published.part,
            subject: (published.subject || "Trilha Jurídica").slice(0, 200),
            status: "approved",
            approvedBy: email,
            approvedAt: published.approvedAt,
            review: (published.review || "").slice(0, 20_000),
          }, { merge: true });
          tx.set(reviewRef, { status: "approved", approvedByUid: uid, approvedAt: now }, { merge: true });
          tx.set(indexRef, {
            lessonId: review.lessonId,
            approvedHash: hashCatalogSnapshot(published),
            approvedReviewId: review.id,
            approvedReviewDate: review.reviewDate,
            ...(ownsLock ? {
              processingReviewId: null,
              processingStartedAt: null,
              latestReviewId: review.id,
              latestStatus: "approved",
            } : {}),
          }, { merge: true });
          return { ok: true as const, lesson: published };
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async reserveSupplement(reviewId, uid, email, pendingItems, now, attemptId) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(reviewRef);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review || review.status !== "pending_approval") {
            return { ok: false, reason: "A revisão precisa estar no estado pending_approval para receber complementação." };
          }
          if (review.supplement) {
            if (review.supplement.status === "completed" || review.supplement.status === "inconclusive" || review.supplement.status === "uncertain_interrupted" || review.supplement.status === "exhausted") {
              return { ok: false, reason: "A complementação jurídica já foi executada para esta revisão e não pode ser repetida." };
            }
            if (review.supplement.status === "running") {
              return { ok: false, reason: "A complementação jurídica já está em andamento. Se foi interrompida, exige verificação humana do CEO." };
            }
          }

          // Identificador estável da tentativa:
          // Se já existir na revisão (reenvio/retry da mesma tentativa), reusa o mesmo para idempotência no Cloud Tasks.
          // Se não existir, utiliza o attemptId fornecido ou o padrão att-1.
          const effectiveAttemptId = review.supplement?.attemptId || attemptId || "att-1";

          const supplementData: LegalReviewSupplement = {
            attemptCount: 0, // 0 durante a reserva anterior à chamada externa
            attemptId: effectiveAttemptId,
            status: "reserved",
            startedAt: now,
            requestedByUid: uid,
            requestedByEmail: email,
            targetedPendingItems: pendingItems,
          };

          tx.set(reviewRef, { supplement: supplementData }, { merge: true });
          const updated: LegalReviewView = {
            ...review,
            supplement: supplementData,
          };
          return { ok: true, review: updated };
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async markSupplementStarted(reviewId, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(reviewRef);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review || !review.supplement || review.supplement.status !== "reserved") {
            return false;
          }
          const supplementData: LegalReviewSupplement = {
            ...review.supplement,
            attemptCount: 1, // Consumida no momento do disparo da chamada
            status: "running",
            startedAt: now,
          };
          tx.set(reviewRef, { supplement: supplementData }, { merge: true });
          return true;
        });
      } catch {
        return false;
      }
    },
    async failPreCallSupplement(reviewId, reason, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(reviewRef);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review) throw new LegalReviewError("Revisão não encontrada.", 404);
          
          // Libera tentativa (attemptCount = 0) pois comprovadamente nenhuma chamada ou tarefa foi criada
          const supplementData: LegalReviewSupplement = {
            ...(review.supplement || { attemptCount: 0, status: "pre_call_failure" }),
            attemptCount: 0,
            attemptId: review.supplement?.attemptId || "att-1",
            status: "pre_call_failure",
            completedAt: now,
            finalNote: `Falha anterior à chamada externa: ${reason}. A tentativa foi preservada.`,
          };
          tx.set(reviewRef, { supplement: supplementData }, { merge: true });
          return { ...review, supplement: supplementData };
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async recordUncertainEnqueueSupplement(reviewId, reason, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(reviewRef);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review) throw new LegalReviewError("Revisão não encontrada.", 404);

          // Resultado incerto de transporte: NÃO libera tentativa (mantém bloqueado contra novas chamadas)
          // e NÃO altera para pre_call_failure. Mantém status 'reserved' para NÃO invalidar eventual tarefa
          // que já tenha sido enfileirada no Cloud Tasks e que venha a ser recebida pelo worker.
          const supplementData: LegalReviewSupplement = {
            ...(review.supplement || { attemptCount: 0, status: "reserved" }),
            status: "reserved",
            attemptId: review.supplement?.attemptId || "att-1",
            uncertaintyReason: reason,
            finalNote: `Resultado incerto no enfileiramento Cloud Tasks: ${reason}. Mantido bloqueado para reconciliação administrativa.`,
          };
          tx.set(reviewRef, { supplement: supplementData }, { merge: true });
          return { ...review, supplement: supplementData };
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async recordSupplementOutcome(reviewId, supplement, now) {
      try {
        const db = await loadDb();
        return await db.runTransaction(async (tx) => {
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(reviewRef);
          const review = asReview(snap.exists ? snap.data() : undefined);
          if (!review) {
            throw new LegalReviewError("Revisão não encontrada.", 404);
          }
          const finalSupplement: LegalReviewSupplement = {
            ...supplement,
            attemptCount: 1,
            completedAt: now,
          };

          // Registra separadamente no histórico de fontes preservando as anteriores
          const newSources = (supplement.findings || []).flatMap((f) => f.sources || []);
          const updatedConsulted = [...(review.consultedSources || [])];
          for (const s of newSources) {
            if (!updatedConsulted.some((exist) => exist.url === s.url)) {
              updatedConsulted.push({
                url: s.url,
                official: s.official,
                institution: s.institution,
                title: s.title,
              });
            }
          }

          const historyEntry = {
            at: now,
            verificationLevel: review.verificationLevel,
            consultedSources: updatedConsulted,
            note: `Complementação jurídica de evidências (${finalSupplement.status}): ${finalSupplement.finalNote || "execução única concluída"}.`,
          };

          const updated: LegalReviewView = {
            ...review,
            supplement: finalSupplement,
            consultedSources: updatedConsulted,
            sourceHistory: [...(review.sourceHistory || []), historyEntry],
          };

          const updatePayload = cleanFirestoreData({
            supplement: finalSupplement,
            consultedSources: updatedConsulted,
            sourceHistory: updated.sourceHistory,
          });

          tx.set(reviewRef, updatePayload, { merge: true });

          return updated;
        });
      } catch (error: any) {
        if (error instanceof LegalReviewError) throw error;
        const safeCode = error?.code || error?.status || "UNKNOWN";
        const safeMsg = error?.message || String(error);
        console.error(`[legal-review] Falha ao registrar resultado da complementação (código: ${safeCode}, motivo: ${safeMsg})`);
        throw unavailable();
      }
    },
  };
}
