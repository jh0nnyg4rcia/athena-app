import type { Express, Request, Response, NextFunction } from "express";
import { rateLimit } from "./rateLimit";
import { createFirestoreLegalReviewRepository } from "../services/legalReviewStore";
import { auditLessonWithOpenAI } from "../services/legalReviewServer";
import {
  approveLegalReview,
  reauditLegalReview,
  rejectLegalReview,
  resolveHumanCoordinatedQuestion,
  resolveHumanLegalReviewChange,
  saveLegalReviewCandidate,
  startLegalReview,
  startLegalReviewSection,
  startLegalReviewTest,
} from "../services/legalReviewFlow";
import { LegalReviewError, isReviewId, readBlockIndex, readLessonSlot } from "../services/legalReviewRepository";
import { sanitizeLegalReviewError, sanitizeLegalReviewMessage } from "../services/legalReviewTrace";

function publicFailure(message: string): string {
  const safe = sanitizeLegalReviewMessage(message);
  if (!message || safe === "Falha sem mensagem segura.") {
    return "A auditoria falhou. A aula publicada não foi alterada.";
  }
  return safe;
}

function sendReviewError(res: Response, error: unknown) {
  if (error instanceof LegalReviewError) {
    res.status(error.status).json({ error: publicFailure(error.message) });
    return;
  }
  const safe = sanitizeLegalReviewError(error, "http");
  console.error(JSON.stringify({
    severity: "ERROR",
    message: "LEGAL_REVIEW_ERROR",
    error: safe,
  }));
  res.status(500).json({ error: publicFailure(safe.message) });
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
    const blockIndex = readBlockIndex(req.body);
    if (blockIndex === null) {
      res.status(400).json({ error: "A parte interna da aula é inválida. Nada foi alterado." });
      return;
    }
    try {
      const result = typeof blockIndex === "number"
        ? await startLegalReviewSection(repo, auditor, {
          day: slot.day,
          part: slot.part,
          blockIndex,
          force: req.body?.force === true,
          uid: req.athenaUser?.uid || "",
        })
        : await startLegalReview(repo, auditor, {
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

  app.post("/api/legal-review/test", rateLimit(6, 60 * 60_000), requireCeo, async (req, res) => {
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    try {
      const review = await startLegalReviewTest(repo, auditor, {
        content,
        uid: req.athenaUser?.uid || "",
      });
      res.json({ review });
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

  app.post("/api/legal-review/:reviewId/resolve-change", rateLimit(30, 60 * 60_000), requireCeo, async (req, res) => {
    if (!isReviewId(req.params.reviewId)) {
      res.status(400).json({ error: "Identificador de revisão inválido." });
      return;
    }
    const { changeId, action, customText, rejectionReason, targetContext } = req.body || {};
    if (!changeId || !action) {
      res.status(400).json({ error: "Parâmetros 'changeId' e 'action' são obrigatórios." });
      return;
    }
    try {
      const review = await resolveHumanLegalReviewChange(
        repo,
        req.params.reviewId,
        { changeId, action, customText, rejectionReason, targetContext },
        req.athenaUser?.uid || "",
        req.athenaUser?.email || ""
      );
      res.json({ review });
    } catch (error) {
      sendReviewError(res, error);
    }
  });

  app.post("/api/legal-review/:reviewId/resolve-question", rateLimit(30, 60 * 60_000), requireCeo, async (req, res) => {
    if (!isReviewId(req.params.reviewId)) {
      res.status(400).json({ error: "Identificador de revisão inválido." });
      return;
    }
    const { questionIndex, changeIds, question } = req.body || {};
    if (typeof questionIndex !== "number" || !Array.isArray(changeIds) || !question) {
      res.status(400).json({ error: "Parâmetros 'questionIndex', 'changeIds' e 'question' são obrigatórios." });
      return;
    }
    try {
      const review = await resolveHumanCoordinatedQuestion(
        repo,
        req.params.reviewId,
        { questionIndex, changeIds, question },
        req.athenaUser?.uid || "",
        req.athenaUser?.email || ""
      );
      res.json({ review });
    } catch (error) {
      sendReviewError(res, error);
    }
  });
}
