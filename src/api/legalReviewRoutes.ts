import type { Express, Request, Response, NextFunction } from "express";
import { rateLimit } from "./rateLimit";
import { createFirestoreLegalReviewRepository } from "../services/legalReviewStore";
import {
  approveLegalReview,
  enqueueAsyncLegalReview,
  getLatestLegalReviewFlow,
  processAsyncLegalReviewWorker,
  reauditLegalReview,
  rejectLegalReview,
  resolveHumanCoordinatedQuestion,
  resolveHumanLegalReviewChange,
  resolveHumanLegalReviewFinding,
  closeLegalReviewSupplementFlow,
  saveLegalReviewCandidate,
  startLegalReview,
  startLegalReviewSection,
  startLegalReviewTest,
  executeSingleSupplementFlow,
  enqueueSingleSupplementFlow,
  processAsyncLegalSupplementWorker,
  type LegalReviewAuditor,
} from "../services/legalReviewFlow";
import { createCloudTasksEnqueuer, type LegalReviewTaskEnqueuer } from "../services/legalReviewTaskQueue";
import {
  LegalReviewError,
  isReviewId,
  readBlockIndex,
  readLessonSlot,
  type LegalReviewRepository,
} from "../services/legalReviewRepository";
import {
  LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE,
  getLegalReviewOperationalFlags,
  type AsyncLegalReviewJobPayload,
  type AsyncLegalReviewTaskPayload,
  type AsyncLegalSupplementJobPayload,
  type LegalSupplementExecutor,
} from "../lib/legalReviewTypes";
import { buildOfficialSupplementExecutor, auditLessonWithOpenAI } from "../services/legalReviewServer";
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

async function verifyWorkerOidcToken(token: string): Promise<boolean> {
  try {
    const { OAuth2Client } = await import("google-auth-library");
    const client = new OAuth2Client();
    const expectedAudience = process.env.CLOUD_RUN_SERVICE_URL || "https://athenaapi-37efv4sd6a-rj.a.run.app";

    // Validação criptográfica confiável de assinatura, audience base do Cloud Run, issuer e expiração
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: expectedAudience,
    });
    const payload = ticket.getPayload();
    if (!payload) return false;

    // Validação do issuer oficial do Google
    const validIssuers = ["https://accounts.google.com", "accounts.google.com"];
    if (!validIssuers.includes(payload.iss)) return false;

    // Validação estrita da Service Account autorizada
    const expectedSa = process.env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL;
    if (expectedSa && payload.email !== expectedSa) {
      return false;
    }

    return true;
  } catch {
    // Fallback restrito via tokeninfo apenas em ambiente que não seja produção
    if (process.env.NODE_ENV !== "production") {
      try {
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`;
        const resp = await fetch(verifyUrl);
        if (resp.ok) {
          const claims = await resp.json();
          const expectedSa = process.env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL;
          const expectedAudience = process.env.CLOUD_RUN_SERVICE_URL || "https://athenaapi-37efv4sd6a-rj.a.run.app";
          const audValid = claims.aud === expectedAudience;
          const emailValid = !expectedSa || claims.email === expectedSa;
          return audValid && emailValid;
        }
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function registerLegalReviewRoutes(
  app: Express,
  requireCeo: (req: Request, res: Response, next: NextFunction) => void,
  options?: {
    repo?: LegalReviewRepository;
    auditor?: LegalReviewAuditor;
    enqueuer?: LegalReviewTaskEnqueuer;
    supplementExecutor?: LegalSupplementExecutor;
  }
) {
  const repo = options?.repo || createFirestoreLegalReviewRepository();
  const auditor = options?.auditor || { audit: auditLessonWithOpenAI };
  const enqueuer = options?.enqueuer || createCloudTasksEnqueuer();
  const supplementExecutor = options?.supplementExecutor || buildOfficialSupplementExecutor();

  app.get("/api/legal-review", rateLimit(60, 60_000), requireCeo, async (req, res) => {
    const day = typeof req.query.day === "string" ? parseInt(req.query.day, 10) : undefined;
    const part = typeof req.query.part === "string" ? parseInt(req.query.part, 10) : undefined;
    const blockIndex = typeof req.query.blockIndex === "string" ? parseInt(req.query.blockIndex, 10) : undefined;

    const slot = readLessonSlot({ day, part });
    if (!slot) {
      res.status(400).json({ error: "Informe o dia e o bloco da aula publicada." });
      return;
    }
    const validatedBlock = typeof blockIndex === "number" ? readBlockIndex({ blockIndex }) : undefined;
    if (validatedBlock === null) {
      res.status(400).json({ error: "A parte interna da aula é inválida." });
      return;
    }

    try {
      const result = await getLatestLegalReviewFlow(repo, {
        day: slot.day,
        part: slot.part,
        blockIndex: typeof validatedBlock === "number" ? validatedBlock : undefined,
      });
      res.json(result);
    } catch (error) {
      sendReviewError(res, error);
    }
  });

  app.post("/api/legal-review/request", rateLimit(10, 60_000), requireCeo, async (req, res) => {
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
      const result = await enqueueAsyncLegalReview(repo, enqueuer, {
        day: slot.day,
        part: slot.part,
        blockIndex: typeof blockIndex === "number" ? blockIndex : undefined,
        force: req.body?.force === true,
        uid: req.athenaUser?.uid || "",
      });
      res.json(result);
    } catch (error) {
      sendReviewError(res, error);
    }
  });

  app.post("/api/legal-review/worker", rateLimit(30, 60_000), async (req, res) => {
    // Validação criptográfica de autenticação OIDC do Google Cloud Tasks / Service Account
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const expectedSecret = process.env.LEGAL_REVIEW_WORKER_SECRET;
    const workerSecretHeader = req.headers["x-worker-secret"];

    let isAuthorized = false;

    if (token) {
      isAuthorized = await verifyWorkerOidcToken(token);
    } else if (process.env.NODE_ENV !== "production" && expectedSecret && workerSecretHeader === expectedSecret) {
      // Fallback por segredo compartilhado EXCLUSIVAMENTE para desenvolvimento local / testes offline
      isAuthorized = true;
    } else if (!process.env.LEGAL_REVIEW_WORKER_SECRET && !process.env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL && process.env.NODE_ENV !== "production") {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      res.status(401).json({ error: "Acesso não autorizado ao worker de revisão jurídica." });
      return;
    }

    const payload = req.body as AsyncLegalReviewTaskPayload;
    if (!payload?.reviewId) {
      res.status(400).json({ error: "Payload inválido para o worker de revisão." });
      return;
    }
    try {
      if (payload.jobType === "SUPPLEMENT") {
        const result = await processAsyncLegalSupplementWorker(repo, supplementExecutor, payload as AsyncLegalSupplementJobPayload);
        res.json(result);
      } else {
        if (!payload.lessonId) {
          res.status(400).json({ error: "Payload inválido para o worker de revisão." });
          return;
        }
        const result = await processAsyncLegalReviewWorker(repo, auditor, payload);
        res.json(result);
      }
    } catch (error) {
      sendReviewError(res, error);
    }
  });

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
    const flags = getLegalReviewOperationalFlags();
    if (!flags.stageCEnabled) {
      res.status(503).json({ error: LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE });
      return;
    }
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

  app.post("/api/legal-review/:reviewId/resolve-finding", rateLimit(30, 60 * 60_000), requireCeo, async (req, res) => {
    const flags = getLegalReviewOperationalFlags();
    if (!flags.stageAEnabled) {
      res.status(503).json({ error: LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE });
      return;
    }
    if (!isReviewId(req.params.reviewId)) {
      res.status(400).json({ error: "Identificador de revisão inválido." });
      return;
    }
    const { findingKey, pendingId, changeId, action, justification, evidenceDeclaration, divergenceNature, correctionChangeId, expurgationConfirmed, expectedCandidateHash } = req.body || {};
    if (!action) {
      res.status(400).json({ error: "O parâmetro 'action' é obrigatório." });
      return;
    }
    if (!findingKey && !pendingId && !changeId) {
      res.status(400).json({ error: "É obrigatório fornecer 'findingKey', 'pendingId' ou 'changeId' para identificar o achado." });
      return;
    }
    const cleanExpectedHash = typeof expectedCandidateHash === "string" ? expectedCandidateHash.trim() : "";
    if (!cleanExpectedHash) {
      res.status(400).json({ error: "O parâmetro 'expectedCandidateHash' é obrigatório." });
      return;
    }
    if (!/^[a-f0-9]{64}$/i.test(cleanExpectedHash)) {
      res.status(400).json({ error: "O formato de 'expectedCandidateHash' é inválido (deve ser SHA-256 hexadecimal com 64 caracteres)." });
      return;
    }
    try {
      const review = await resolveHumanLegalReviewFinding(
        repo,
        req.params.reviewId,
        {
          findingKey,
          pendingId,
          changeId,
          action,
          justification: typeof justification === "string" ? justification : "",
          evidenceDeclaration,
          divergenceNature,
          correctionChangeId,
          expurgationConfirmed: expurgationConfirmed === true,
          expectedCandidateHash: cleanExpectedHash,
        },
        req.athenaUser?.uid || "",
        req.athenaUser?.email || ""
      );
      res.json({ review });
    } catch (error) {
      sendReviewError(res, error);
    }
  });

  app.post("/api/legal-review/:reviewId/close-supplement", rateLimit(20, 60 * 60_000), requireCeo, async (req, res) => {
    const flags = getLegalReviewOperationalFlags();
    if (!flags.stageBEnabled) {
      res.status(503).json({ error: LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE });
      return;
    }
    if (!isReviewId(req.params.reviewId)) {
      res.status(400).json({ error: "Identificador de revisão inválido." });
      return;
    }
    const { overallJustification } = req.body || {};
    if (typeof overallJustification !== "string" || overallJustification.trim().length < 15) {
      res.status(400).json({ error: "A justificativa global do CEO é obrigatória (mínimo de 15 caracteres)." });
      return;
    }
    try {
      const review = await closeLegalReviewSupplementFlow(
        repo,
        req.params.reviewId,
        { overallJustification },
        req.athenaUser?.uid || "",
        req.athenaUser?.email || ""
      );
      res.json({ review });
    } catch (error) {
      sendReviewError(res, error);
    }
  });

  app.post("/api/legal-review/:reviewId/supplement", rateLimit(10, 60 * 60_000), requireCeo, async (req, res) => {
    if (!isReviewId(req.params.reviewId)) {
      res.status(400).json({ error: "Identificador de revisão inválido." });
      return;
    }
    try {
      const review = await enqueueSingleSupplementFlow(
        repo,
        enqueuer,
        req.params.reviewId,
        req.athenaUser?.uid || "",
        req.athenaUser?.email || ""
      );
      res.status(202).json({ enqueued: true, review });
    } catch (error) {
      sendReviewError(res, error);
    }
  });
}

