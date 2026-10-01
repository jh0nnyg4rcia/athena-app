import { embedChallengeInContent, extractChallengeFromText, normalizeObjectiveChallenge } from "../lib/objectiveChallenge";
import type { ChallengeData } from "../types";
import type { StoredCatalogLesson } from "../lib/legalReviewTypes";
import { containsHtmlMarkup, markersPreserved } from "../lib/legalReviewValidate";

export function blockSixExcerpt(content: string): string {
  const match = /\[BLOCK_6\]([\s\S]*)$/i.exec(content || "");
  if (!match) return "";
  return match[1].replace(/\[ATHENA_CHALLENGE\][\s\S]*$/i, "").trim().slice(0, 20_000);
}

export function candidateMarkdownAccepted(original: string, revised: string): boolean {
  if (!revised || revised.trim().length < 20) return false;
  if (revised.length > 900_000) return false;
  if (containsHtmlMarkup(revised)) return false;
  if (!markersPreserved(original, revised)) return false;
  if (revised.length > Math.max(original.length * 3, original.length + 20_000)) return false;
  return true;
}

/** Monta a aula que substituirá a publicada, preservando id, dia, bloco e disciplina. */
export function nextPublishedLesson(
  lesson: StoredCatalogLesson,
  reviewedMarkdown: string,
  now: number
): StoredCatalogLesson {
  const extracted = extractChallengeFromText(reviewedMarkdown);
  const challenge = extracted.challenge || normalizeObjectiveChallenge(lesson.challenge);
  const content = challenge ? embedChallengeInContent(reviewedMarkdown, challenge as ChallengeData) : reviewedMarkdown;
  const review = blockSixExcerpt(content);
  return {
    ...lesson,
    content,
    challenge: challenge || lesson.challenge,
    status: "approved",
    approvedBy: "jhonny.spider@gmail.com",
    approvedAt: now,
    version: (lesson.version || 1) + 1,
    review: review || lesson.review,
  };
}
