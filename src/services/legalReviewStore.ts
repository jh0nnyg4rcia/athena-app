import firebaseConfig from "../../firebase-applet-config.json";
import { embedChallengeInContent, extractChallengeFromText } from "../lib/objectiveChallenge";
import {
  emptyReviewIndex,
  type LegalReviewIndex,
  type LegalReviewView,
  type StoredCatalogLesson,
} from "../lib/legalReviewTypes";
import { candidateMarkdownAccepted, nextPublishedLesson, reviewAfterManualEdit } from "./legalReviewPublish";
import {
  LegalReviewError,
  LEGAL_REVIEW_TEST_PUBLISH_MESSAGE,
  hashCatalogSnapshot,
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
      return dbMod.getFirestore(app, DATABASE_ID) as unknown as Db;
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
        return asLesson(lessonId, snap.exists ? snap.data() : undefined);
      } catch (error) {
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
          if (processingLockFresh(current, review.requestedAt) && current.processingReviewId !== review.id) {
            throw new LegalReviewError(
              "Já existe uma revisão em andamento para esta aula. Aguarde a conclusão antes de iniciar outra.",
              409
            );
          }
          tx.set(db.collection(REVIEWS).doc(review.id), definedRecord({ ...review }));
          tx.set(indexRef, {
            lessonId: review.lessonId,
            processingReviewId: review.id,
            processingStartedAt: review.requestedAt,
            latestReviewId: review.id,
            latestStatus: "processing",
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
          tx.set(db.collection(REVIEWS).doc(review.id), definedRecord({ ...review }), { merge: true });
          tx.set(db.collection(INDEX).doc(review.lessonId), {
            lessonId: review.lessonId,
            processingReviewId: null,
            processingStartedAt: null,
            latestReviewId: review.id,
            latestStatus: review.status,
          }, { merge: true });
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
    async fail(reviewId, lessonId, message) {
      try {
        const db = await loadDb();
        await db.runTransaction(async (tx) => {
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const snap = await tx.get(reviewRef);
          if (!snap.exists) return;
          tx.set(reviewRef, {
            status: "failed",
            errorMessage: message.slice(0, 280),
          }, { merge: true });
          tx.set(db.collection(INDEX).doc(lessonId), {
            processingReviewId: null,
            processingStartedAt: null,
            latestReviewId: reviewId,
            latestStatus: "failed",
          }, { merge: true });
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
          tx.set(ref, {
            reviewedMarkdown: edited.reviewedMarkdown,
            manuallyEdited: edited.manuallyEdited,
            manuallyEditedAt: edited.manuallyEditedAt ?? null,
            candidateHash: edited.candidateHash,
            verificationLevel: edited.verificationLevel,
            sourceHistory: edited.sourceHistory,
          }, { merge: true });
          return edited;
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
          tx.set(ref, { status: "rejected", rejectedByUid: uid, rejectedAt: now }, { merge: true });
          tx.set(db.collection(INDEX).doc(review.lessonId), {
            processingReviewId: null,
            processingStartedAt: null,
            latestReviewId: review.id,
            latestStatus: "rejected",
          }, { merge: true });
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
          const reviewRef = db.collection(REVIEWS).doc(reviewId);
          const reviewSnap = await tx.get(reviewRef);
          const review = asReview(reviewSnap.exists ? reviewSnap.data() : undefined);
          if (!review || review.status !== "pending_approval") {
            throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
          }
          if (reviewCannotBePublished(review)) {
            throw new LegalReviewError(LEGAL_REVIEW_TEST_PUBLISH_MESSAGE, 403);
          }
          const lessonRef = db.collection(LESSONS).doc(review.lessonId);
          const lessonSnap = await tx.get(lessonRef);
          const lesson = asLesson(review.lessonId, lessonSnap.exists ? lessonSnap.data() : undefined);
          if (!lesson) {
            throw new LegalReviewError("A aula publicada não foi encontrada. Nada foi substituído.", 404);
          }
          if (hashCatalogSnapshot(lesson) !== review.originalHash) {
            return { ok: false as const, conflict: true as const };
          }
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
          tx.set(db.collection(INDEX).doc(review.lessonId), {
            lessonId: review.lessonId,
            processingReviewId: null,
            processingStartedAt: null,
            approvedHash: hashCatalogSnapshot(published),
            approvedReviewId: review.id,
            approvedReviewDate: review.reviewDate,
            latestReviewId: review.id,
            latestStatus: "approved",
          }, { merge: true });
          return { ok: true as const, lesson: published };
        });
      } catch (error) {
        if (error instanceof LegalReviewError) throw error;
        throw unavailable();
      }
    },
  };
}
