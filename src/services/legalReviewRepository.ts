import { createHash, randomUUID } from "node:crypto";
import type { LegalReviewIndex, LegalReviewView, StoredCatalogLesson } from "../lib/legalReviewTypes";

export function hashLessonContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function stableValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stableValue);
  const record = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    if (record[key] !== undefined) sorted[key] = stableValue(record[key]);
  }
  return sorted;
}

/** Hash do snapshot que a aprovação compara. Inclui os campos que a revisão não pode sobrescrever em silêncio. */
export function hashCatalogSnapshot(lesson: {
  content: string;
  subject: string;
  topic?: string;
  challenge?: unknown;
  approvedAt?: number | null;
  version?: number | null;
}): string {
  const canonical = JSON.stringify(stableValue({
    content: lesson.content,
    subject: lesson.subject,
    topic: lesson.topic ?? "",
    challenge: lesson.challenge ?? null,
    approvedAt: lesson.approvedAt ?? null,
    version: typeof lesson.version === "number" ? lesson.version : null,
  }));
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function newReviewId(): string {
  return `rev_${randomUUID()}`;
}

export function isReviewId(value: unknown): value is string {
  return typeof value === "string" && /^rev_[0-9a-f-]{36}$/i.test(value);
}

const PROCESSING_TTL_MS = 15 * 60 * 1000;

export function processingLockFresh(index: LegalReviewIndex | null, now: number): boolean {
  if (!index?.processingReviewId || !index.processingStartedAt) return false;
  return now - index.processingStartedAt < PROCESSING_TTL_MS;
}

export class LegalReviewError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LegalReviewError";
    this.status = status;
  }
}

export interface LegalReviewRepository {
  getLesson(lessonId: string): Promise<StoredCatalogLesson | null>;
  getIndex(lessonId: string): Promise<LegalReviewIndex | null>;
  begin(review: LegalReviewView): Promise<void>;
  complete(review: LegalReviewView): Promise<void>;
  fail(reviewId: string, lessonId: string, message: string): Promise<void>;
  get(reviewId: string): Promise<LegalReviewView | null>;
  saveCandidate(reviewId: string, markdown: string, now: number): Promise<LegalReviewView>;
  reject(reviewId: string, uid: string, now: number): Promise<LegalReviewView>;
  approve(reviewId: string, uid: string, email: string, now: number): Promise<
    | { ok: true; lesson: StoredCatalogLesson }
    | { ok: false; conflict: true }
  >;
}

export function readLessonSlot(body: unknown): { day: number; part: number } | null {
  if (!body || typeof body !== "object") return null;
  const record = body as { day?: unknown; part?: unknown };
  const day = record.day;
  const part = record.part;
  if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > 100) return null;
  if (typeof part !== "number" || !Number.isInteger(part) || part < 0 || part > 20) return null;
  return { day, part };
}

export function lessonDocId(day: number, part: number): string {
  return `day_${day}_part_${part}`;
}

export function publicReview(review: LegalReviewView): LegalReviewView {
  return {
    id: review.id,
    lessonId: review.lessonId,
    day: review.day,
    part: review.part,
    subject: review.subject,
    topic: review.topic,
    originalHash: review.originalHash,
    originalApprovedAt: review.originalApprovedAt,
    originalContent: review.originalContent,
    reviewedMarkdown: review.reviewedMarkdown,
    changes: review.changes,
    unverifiedClaims: review.unverifiedClaims,
    summary: review.summary,
    reviewNotes: review.reviewNotes,
    verificationLevel: review.verificationLevel,
    confidence: review.confidence,
    outcome: review.outcome,
    status: review.status,
    model: review.model,
    reviewDate: review.reviewDate,
    requestedByUid: review.requestedByUid,
    requestedAt: review.requestedAt,
    approvedByUid: review.approvedByUid,
    approvedAt: review.approvedAt,
    rejectedByUid: review.rejectedByUid,
    rejectedAt: review.rejectedAt,
    webSearchUsed: review.webSearchUsed,
    usage: review.usage,
    consultedSources: review.consultedSources || [],
    manuallyEdited: Boolean(review.manuallyEdited),
    manuallyEditedAt: review.manuallyEditedAt,
    candidateHash: review.candidateHash || "",
    auditedCandidateHash: review.auditedCandidateHash || "",
    sourceHistory: review.sourceHistory || [],
  };
}
