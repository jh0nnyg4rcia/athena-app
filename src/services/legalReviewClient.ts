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

export function requestLegalReview(day: number, part: number, blockIndex: number, force = false): Promise<LegalReviewStartResponse> {
  return postAthenaApi<LegalReviewStartResponse>("/api/legal-review", { day, part, blockIndex, force }, REVIEW_TIMEOUT_MS);
}

export function requestLegalReviewTest(content: string): Promise<{ review: LegalReviewView }> {
  return postAthenaApi("/api/legal-review/test", { content }, REVIEW_TIMEOUT_MS);
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

export function reauditLegalReview(reviewId: string): Promise<{ review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/reaudit`, {}, REVIEW_TIMEOUT_MS);
}

export function resolveLegalReviewChange(
  reviewId: string,
  params: {
    changeId: string;
    action: "APPLY" | "EDIT" | "REJECT";
    customText?: string;
    rejectionReason?: string;
    targetContext?: string;
  }
): Promise<{ review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/resolve-change`, params, 60_000);
}

export function resolveLegalReviewQuestion(
  reviewId: string,
  params: {
    questionIndex: number;
    changeIds: string[];
    question: {
      text: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    };
  }
): Promise<{ review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/resolve-question`, params, 60_000);
}
