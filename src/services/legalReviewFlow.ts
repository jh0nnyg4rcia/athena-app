import {
  LEGAL_REVIEW_ALREADY_MESSAGE,
  LEGAL_REVIEW_CONFLICT_MESSAGE,
  MAX_REVIEWABLE_CHARS,
  emptyReviewIndex,
  formatReviewDate,
  type LegalReviewView,
  type StoredCatalogLesson,
} from "../lib/legalReviewTypes";
import type { AuditLessonResult } from "./legalReviewServer";
import { candidateMarkdownAccepted } from "./legalReviewPublish";
import {
  LegalReviewError,
  hashLessonContent,
  lessonDocId,
  newReviewId,
  processingLockFresh,
  publicReview,
  type LegalReviewRepository,
} from "./legalReviewRepository";

export interface LegalReviewAuditor {
  audit(input: {
    reviewDate: string;
    lessonId: string;
    day: number;
    part: number;
    subject: string;
    topic: string;
    content: string;
  }): Promise<AuditLessonResult>;
}

export type StartReviewResult =
  | { alreadyReviewed: true; message: string; lastReviewDate: string; reviewId: string }
  | { alreadyReviewed: false; review: LegalReviewView };

function blankReview(lesson: StoredCatalogLesson, uid: string, now: number, reviewDate: string): LegalReviewView {
  return {
    id: newReviewId(),
    lessonId: lesson.id,
    day: lesson.day,
    part: lesson.part,
    subject: lesson.subject,
    topic: lesson.topic || lesson.subject,
    originalHash: hashLessonContent(lesson.content),
    originalApprovedAt: lesson.approvedAt ?? null,
    originalContent: lesson.content,
    reviewedMarkdown: "",
    changes: [],
    unverifiedClaims: [],
    summary: {
      totalChanges: 0,
      corrections: 0,
      additions: 0,
      removals: 0,
      updates: 0,
      precisions: 0,
      restructures: 0,
    },
    reviewNotes: "",
    verificationLevel: "FALHA_NA_VERIFICACAO",
    confidence: "BAIXA",
    outcome: "SEM_ALTERACOES_RELEVANTES",
    status: "processing",
    model: "",
    reviewDate,
    requestedByUid: uid,
    requestedAt: now,
    webSearchUsed: false,
  };
}

export async function startLegalReview(
  repo: LegalReviewRepository,
  auditor: LegalReviewAuditor,
  input: { day: number; part: number; force: boolean; uid: string; now?: number }
): Promise<StartReviewResult> {
  const now = input.now ?? Date.now();
  const lessonId = lessonDocId(input.day, input.part);
  const lesson = await repo.getLesson(lessonId);
  if (!lesson || lesson.content.trim().length < 20) {
    throw new LegalReviewError(
      "Esta aula ainda não está no catálogo oficial. Publique o bloco antes de revisar.",
      404
    );
  }
  if (lesson.content.length > MAX_REVIEWABLE_CHARS) {
    throw new LegalReviewError(
      "Esta aula é grande demais para a auditoria automática. A aula publicada não foi alterada.",
      400
    );
  }
  const index = (await repo.getIndex(lessonId)) || emptyReviewIndex(lessonId);
  const hash = hashLessonContent(lesson.content);
  if (!input.force && index.approvedHash && index.approvedHash === hash && index.approvedReviewDate) {
    return {
      alreadyReviewed: true,
      message: LEGAL_REVIEW_ALREADY_MESSAGE,
      lastReviewDate: index.approvedReviewDate,
      reviewId: index.approvedReviewId || "",
    };
  }
  if (processingLockFresh(index, now)) {
    throw new LegalReviewError(
      "Já existe uma revisão em andamento para esta aula. Aguarde a conclusão antes de iniciar outra.",
      409
    );
  }

  const reviewDate = formatReviewDate(new Date(now));
  const processing = blankReview(lesson, input.uid, now, reviewDate);
  await repo.begin(processing);

  try {
    const audit = await auditor.audit({
      reviewDate,
      lessonId: lesson.id,
      day: lesson.day,
      part: lesson.part,
      subject: lesson.subject,
      topic: lesson.topic || lesson.subject,
      content: lesson.content,
    });
    const pending: LegalReviewView = {
      ...processing,
      reviewedMarkdown: audit.reviewedMarkdown,
      changes: audit.changes,
      unverifiedClaims: audit.unverifiedClaims,
      summary: audit.summary,
      reviewNotes: audit.reviewNotes,
      verificationLevel: audit.verificationLevel,
      confidence: audit.confidence,
      outcome: audit.outcome,
      status: "pending_approval",
      model: audit.model,
      webSearchUsed: audit.webSearchUsed,
      usage: audit.usage,
    };
    await repo.complete(pending);
    return { alreadyReviewed: false, review: publicReview(pending) };
  } catch (error) {
    const message = error instanceof LegalReviewError
      ? error.message
      : error instanceof Error
        ? error.message
        : "A auditoria falhou. A aula publicada não foi alterada.";
    await repo.fail(processing.id, lesson.id, message);
    if (error instanceof LegalReviewError) throw error;
    throw new LegalReviewError(message, 502);
  }
}

export async function saveLegalReviewCandidate(
  repo: LegalReviewRepository,
  reviewId: string,
  markdown: string
): Promise<LegalReviewView> {
  const current = await repo.get(reviewId);
  if (!current) throw new LegalReviewError("Revisão não encontrada.", 404);
  if (!candidateMarkdownAccepted(current.originalContent, markdown)) {
    throw new LegalReviewError("O Markdown revisado quebrou a estrutura da aula. A candidata não foi salva.", 400);
  }
  return publicReview(await repo.saveCandidate(reviewId, markdown));
}

export async function rejectLegalReview(
  repo: LegalReviewRepository,
  reviewId: string,
  uid: string,
  now = Date.now()
): Promise<LegalReviewView> {
  return publicReview(await repo.reject(reviewId, uid, now));
}

export async function approveLegalReview(
  repo: LegalReviewRepository,
  reviewId: string,
  uid: string,
  now = Date.now()
): Promise<{ reviewId: string; lesson: StoredCatalogLesson }> {
  const result = await repo.approve(reviewId, uid, now);
  if (!result.ok) {
    throw new LegalReviewError(LEGAL_REVIEW_CONFLICT_MESSAGE, 409);
  }
  return { reviewId, lesson: result.lesson };
}
