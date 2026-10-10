import { getAthenaApi, postAthenaApi } from "./geminiService";
import type { LegalReviewView, StoredCatalogLesson } from "../lib/legalReviewTypes";

const REVIEW_TIMEOUT_MS = 270_000;

export interface LegalReviewStartResponse {
  alreadyReviewed: boolean;
  message?: string;
  lastReviewDate?: string;
  reviewId?: string;
  review?: LegalReviewView;
}

export interface LatestLegalReviewResponse {
  found: boolean;
  review?: LegalReviewView;
  conflict?: boolean;
  status?: string;
}

export function fetchLatestLegalReview(
  day: number,
  part: number,
  blockIndex?: number
): Promise<LatestLegalReviewResponse> {
  const query = new URLSearchParams({
    day: String(day),
    part: String(part),
  });
  if (typeof blockIndex === "number") {
    query.set("blockIndex", String(blockIndex));
  }
  return getAthenaApi<LatestLegalReviewResponse>(`/api/legal-review?${query.toString()}`, 30_000);
}

export function requestAsyncLegalReview(
  day: number,
  part: number,
  blockIndex?: number,
  force = false
): Promise<{
  enqueued?: boolean;
  alreadyProcessing?: boolean;
  existingPending?: boolean;
  alreadyReviewed?: boolean;
  reviewId?: string;
  review?: LegalReviewView;
  status?: string;
  message?: string;
  lastReviewDate?: string;
}> {
  return postAthenaApi("/api/legal-review/request", { day, part, blockIndex, force }, 15_000);
}

export function requestLegalReview(day: number, part: number, blockIndex?: number, force = false): Promise<LegalReviewStartResponse> {
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

export function requestLegalReviewSupplement(reviewId: string): Promise<{ enqueued?: boolean; review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/supplement`, {}, 15_000);
}

export function resolveLegalReviewFinding(
  reviewId: string,
  params: {
    findingKey?: string;
    pendingId?: string;
    changeId?: string;
    action: import("../lib/legalReviewTypes").HumanFindingAction;
    justification: string;
    evidenceDeclaration?: import("../lib/legalReviewTypes").FindingEvidenceDeclaration;
    divergenceNature?: string;
    correctionChangeId?: string;
    expurgationConfirmed?: boolean;
    expectedCandidateHash: string;
  }
): Promise<{ review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/resolve-finding`, params, 60_000);
}

export function closeLegalReviewSupplement(
  reviewId: string,
  params: {
    overallJustification: string;
    expectedCandidateHash: string;
    expectedDecisionStateHash: string;
  }
): Promise<{ review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/close-supplement`, params, 60_000);
}

export function createHumanLegalReviewChange(
  reviewId: string,
  params: {
    originFindingKey: string;
    originalExcerpt: string;
    revisedExcerpt: string;
    justification: string;
    category?: import("../lib/legalReviewTypes").LegalChangeCategory;
    nature?: import("../lib/legalReviewTaxonomy").LegalClaimNature;
    expectedCandidateHash: string;
  }
): Promise<{ review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/human-change`, params, 60_000);
}

export function createLegalReviewAddendum(
  reviewId: string,
  params: {
    targetFindingKey: string;
    reason: import("../lib/legalReviewTypes").LegalAddendumReason;
    inconsistencyDescription: string;
    rectifyingAct: {
      action: import("../lib/legalReviewTypes").HumanFindingAction;
      state: import("../lib/legalReviewTypes").HumanFindingResolutionState;
      justification: string;
      correctionChangeId?: string;
      evidenceDeclaration?: import("../lib/legalReviewTypes").FindingEvidenceDeclaration;
      divergenceNature?: string;
      expurgationConfirmed?: boolean;
    };
    expectedCandidateHash: string;
    expectedDecisionStateHash: string;
  }
): Promise<{ review: LegalReviewView }> {
  return postAthenaApi(`/api/legal-review/${encodeURIComponent(reviewId)}/addenda`, params, 60_000);
}



