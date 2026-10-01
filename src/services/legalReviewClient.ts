import { postAthenaApi } from "./geminiService";
import type { LegalReviewView, StoredCatalogLesson } from "../lib/legalReviewTypes";

const REVIEW_TIMEOUT_MS = 270_000;

export interface LegalReviewStartResponse {
  alreadyReviewed: boolean;
  message?: string;
  lastReviewDate?: string;
  reviewId?: string;
  review?: LegalReviewView;
}

export function requestLegalReview(day: number, part: number, force = false): Promise<LegalReviewStartResponse> {
  return postAthenaApi<LegalReviewStartResponse>("/api/legal-review", { day, part, force }, REVIEW_TIMEOUT_MS);
}

export function saveLegalReviewCandidate(reviewId: string, reviewedMarkdown: string): Promise<{ review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/candidate`, { reviewedMarkdown }, 60_000);
}

export function rejectLegalReview(reviewId: string): Promise<{ review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/reject`, {}, 60_000);
}

export function approveLegalReview(reviewId: string): Promise<{ reviewId: string; lesson: StoredCatalogLesson }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/approve`, {}, 60_000);
}
