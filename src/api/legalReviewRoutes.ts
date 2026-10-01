import type { Express, Request, Response, NextFunction } from "express";
import { rateLimit } from "./rateLimit";
import { createFirestoreLegalReviewRepository } from "../services/legalReviewStore";
import { auditLessonWithOpenAI } from "../services/legalReviewServer";
import {
  approveLegalReview,
  reauditLegalReview,
  rejectLegalReview,
  saveLegalReviewCandidate,
  startLegalReview,
} from "../services/legalReviewFlow";
import { LegalReviewError, isReviewId, readLessonSlot } from "../services/legalReviewRepository";

function sendReviewError(res: Response, error: unknown) {
  if (error instanceof LegalReviewError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : "A auditoria falhou. A aula publicada não foi alterada.";
  console.error("[legal-review] falha sem alteração da aula.");
  res.status(500).json({ error: message.slice(0, 280) });
}

export function registerLegalReviewRoutes(
  app: Express,
  requireCeo: (req: Request, res: Response, next: NextFunction) => void
) {
  const repo = createFirestoreLegalReviewRepository();
  const auditor = { audit: auditLessonWithOpenAI };

  app.post("/api/legal-review", rateLimit(6, 60 * 60_000), requireCeo, async (req, res) => {
    const slot = readLessonSlot(req.body);
    if (!slot) {
      res.status(400).json({ error: "Informe o dia e o bloco da aula publicada." });
      return;
    }
    try {
      const result = await startLegalReview(repo, auditor, {
        day: slot.day,
        part: slot.part,
        force: req.body?.force === true,
        uid: req.athenaUser?.uid || "",
      });
      res.json(result);
    } catch (error) {
      sendReviewError(res, error);
    }
  });

  app.post("/api/legal-review/:reviewId/candidate", rateLimit(30, 60 * 60_000), requireCeo, async (req, res) => {
    if (!isReviewId(req.params.reviewId)) {
      res.status(400).json({ error: "Identificador de revisão inválido." });
      return;
    }
    const markdown = typeof req.body?.reviewedMarkdown === "string" ? req.body.reviewedMarkdown : "";
    try {
      const review = await saveLegalReviewCandidate(repo, req.params.reviewId, markdown);
      res.json({ review });
    } catch (error) {
      sendReviewError(res, error);
    }
  });

  app.post("/api/legal-review/:reviewId/reject", rateLimit(30, 60 * 60_000), requireCeo, async (req, res) => {
    if (!isReviewId(req.params.reviewId)) {
      res.status(400).json({ error: "Identificador de revisão inválido." });
      return;
    }
    try {
      const review = await rejectLegalReview(repo, req.params.reviewId, req.athenaUser?.uid || "");
      res.json({ review });
    } catch (error) {
      sendReviewError(res, error);
    }
  });

  app.post("/api/legal-review/:reviewId/approve", rateLimit(20, 60 * 60_000), requireCeo, async (req, res) => {
    if (!isReviewId(req.params.reviewId)) {
      res.status(400).json({ error: "Identificador de revisão inválido." });
      return;
    }
    try {
      const result = await approveLegalReview(
        repo,
        req.params.reviewId,
        req.athenaUser?.uid || "",
        req.athenaUser?.email || ""
      );
      res.json(result);
    } catch (error) {
      sendReviewError(res, error);
    }
  });

  app.post("/api/legal-review/:reviewId/reaudit", rateLimit(6, 60 * 60_000), requireCeo, async (req, res) => {
    if (!isReviewId(req.params.reviewId)) {
      res.status(400).json({ error: "Identificador de revisão inválido." });
      return;
    }
    try {
      const review = await reauditLegalReview(repo, auditor, req.params.reviewId);
      res.json({ review });
    } catch (error) {
      sendReviewError(res, error);
    }
  });
}
