import {
  LEGAL_REVIEW_ALREADY_MESSAGE,
  LEGAL_REVIEW_CONFLICT_MESSAGE,
  MAX_REVIEWABLE_CHARS,
  emptyReviewIndex,
  formatReviewDate,
  type LegalReviewView,
  type StoredCatalogLesson,
} from "../lib/legalReviewTypes";
import { extractCatalogBlock, sectionReviewKey } from "../lib/catalogBlock";
import { isCeoEmail } from "../lib/contentProvider";
import { reviewModelName, type AuditLessonResult } from "./legalReviewServer";
import {
  createLegalReviewTrace,
  sanitizeLegalReviewMessage,
  type LegalReviewTrace,
  type LegalReviewTraceCounts,
} from "./legalReviewTrace";
import { candidateMarkdownAccepted } from "./legalReviewPublish";
import {
  LegalReviewError,
  hashCatalogSnapshot,
  hashLessonContent,
  LEGAL_REVIEW_TEST_LESSON_ID,
  LEGAL_REVIEW_TEST_PUBLISH_MESSAGE,
  lessonDocId,
  newReviewId,
  processingLockFresh,
  publicReview,
  reviewCannotBePublished,
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
    publishedContent?: string;
    trace?: LegalReviewTrace;
  }): Promise<AuditLessonResult>;
}

export type StartReviewResult =
  | { alreadyReviewed: true; message: string; lastReviewDate: string; reviewId: string }
  | { alreadyReviewed: false; review: LegalReviewView };

function reviewCounts(review: Pick<LegalReviewView, "model" | "verificationLevel" | "consultedSources" | "changes" | "unverifiedClaims">): LegalReviewTraceCounts {
  return {
    servedModel: review.model,
    verificationLevel: review.verificationLevel,
    consultedSources: review.consultedSources.length,
    changes: review.changes.length,
    unverifiedClaims: review.unverifiedClaims.length,
  };
}

function failureMessage(error: unknown): string {
  if (error instanceof LegalReviewError) return error.message;
  const raw = error instanceof Error ? error.message : "";
  const safe = sanitizeLegalReviewMessage(raw);
  if (!raw || safe === "Falha sem mensagem segura.") {
    return "A auditoria falhou. A aula publicada não foi alterada.";
  }
  return safe;
}

async function tracedFirestore(
  trace: LegalReviewTrace,
  step: "begin" | "complete" | "fail",
  write: () => Promise<unknown>
) {
  trace.firestoreStart(step);
  try {
    await write();
    trace.firestoreEnd();
  } catch (error) {
    trace.noteFailure(error, "firestore");
    trace.firestoreEnd();
    throw error;
  }
}

function blankReview(
  lesson: StoredCatalogLesson,
  uid: string,
  now: number,
  reviewDate: string,
  testMode = false
): LegalReviewView {
  return {
    id: newReviewId(),
    lessonId: lesson.id,
    day: lesson.day,
    part: lesson.part,
    subject: lesson.subject,
    topic: lesson.topic || lesson.subject,
    originalHash: hashCatalogSnapshot(lesson),
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
    testMode,
    consultedSources: [],
    manuallyEdited: false,
    candidateHash: "",
    auditedCandidateHash: "",
    sourceHistory: [],
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
  const hash = hashCatalogSnapshot(lesson);
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
  const trace = createLegalReviewTrace({ testMode: false, requestedModel: reviewModelName() });
  trace.start();
  try {
    await tracedFirestore(trace, "begin", () => repo.begin(processing));
  } catch (error) {
    trace.error(error);
    if (error instanceof LegalReviewError) throw error;
    throw new LegalReviewError(failureMessage(error), 502);
  }

  try {
    const audit = await auditor.audit({
      reviewDate,
      lessonId: lesson.id,
      day: lesson.day,
      part: lesson.part,
      subject: lesson.subject,
      topic: lesson.topic || lesson.subject,
      content: lesson.content,
      trace,
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
      testMode: false,
      usage: audit.usage,
      consultedSources: audit.consultedSources,
      manuallyEdited: false,
      candidateHash: hashLessonContent(audit.reviewedMarkdown),
      auditedCandidateHash: hashLessonContent(audit.reviewedMarkdown),
      sourceHistory: [],
    };
    await tracedFirestore(trace, "complete", () => repo.complete(pending));
    trace.success(reviewCounts(pending));
    return { alreadyReviewed: false, review: publicReview(pending) };
  } catch (error) {
    trace.error(error);
    const message = failureMessage(error);
    await tracedFirestore(trace, "fail", () => repo.fail(processing.id, lesson.id, message)).catch(() => undefined);
    if (error instanceof LegalReviewError) throw error;
    throw new LegalReviewError(message, 502);
  }
}

export async function startLegalReviewSection(
  repo: LegalReviewRepository,
  auditor: LegalReviewAuditor,
  input: { day: number; part: number; blockIndex: number; force: boolean; uid: string; now?: number }
): Promise<StartReviewResult> {
  const now = input.now ?? Date.now();
  const catalogId = lessonDocId(input.day, input.part);
  const lesson = await repo.getLesson(catalogId);
  if (!lesson || lesson.content.trim().length < 20) {
    throw new LegalReviewError(
      "Esta aula ainda não está no catálogo oficial. Publique o bloco antes de revisar.",
      404
    );
  }
  const slice = extractCatalogBlock(lesson.content, input.blockIndex);
  if (!slice || slice.trim().length < 20) {
    throw new LegalReviewError(
      "Esta parte não existe na aula publicada. A aula não foi alterada.",
      404
    );
  }
  if (slice.length > MAX_REVIEWABLE_CHARS) {
    throw new LegalReviewError(
      "Esta parte é grande demais para a auditoria automática. A aula publicada não foi alterada.",
      400
    );
  }
  const scopeId = sectionReviewKey(input.day, input.part, input.blockIndex);
  const sectionLesson: StoredCatalogLesson = { ...lesson, id: scopeId, content: slice };
  const index = (await repo.getIndex(scopeId)) || emptyReviewIndex(scopeId);
  const hash = hashCatalogSnapshot(sectionLesson);
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
      "Já existe uma revisão em andamento para esta parte. Aguarde a conclusão antes de iniciar outra.",
      409
    );
  }

  const reviewDate = formatReviewDate(new Date(now));
  const processing: LegalReviewView = {
    ...blankReview(sectionLesson, input.uid, now, reviewDate),
    lessonId: scopeId,
    day: lesson.day,
    part: lesson.part,
    blockIndex: input.blockIndex,
    catalogLessonId: lesson.id,
    previewOnly: true,
    originalContent: slice,
    originalHash: hash,
  };
  const trace = createLegalReviewTrace({ testMode: false, requestedModel: reviewModelName() });
  trace.start();
  try {
    await tracedFirestore(trace, "begin", () => repo.begin(processing));
  } catch (error) {
    trace.error(error);
    if (error instanceof LegalReviewError) throw error;
    throw new LegalReviewError(failureMessage(error), 502);
  }

  try {
    const audit = await auditor.audit({
      reviewDate,
      lessonId: scopeId,
      day: lesson.day,
      part: lesson.part,
      subject: lesson.subject,
      topic: lesson.topic || lesson.subject,
      content: slice,
      trace,
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
      testMode: false,
      previewOnly: true,
      usage: audit.usage,
      consultedSources: audit.consultedSources,
      manuallyEdited: false,
      candidateHash: hashLessonContent(audit.reviewedMarkdown),
      auditedCandidateHash: hashLessonContent(audit.reviewedMarkdown),
      sourceHistory: [],
    };
    await tracedFirestore(trace, "complete", () => repo.complete(pending));
    trace.success(reviewCounts(pending));
    return { alreadyReviewed: false, review: publicReview(pending) };
  } catch (error) {
    trace.error(error);
    const message = failureMessage(error);
    await tracedFirestore(trace, "fail", () => repo.fail(processing.id, scopeId, message)).catch(() => undefined);
    if (error instanceof LegalReviewError) throw error;
    throw new LegalReviewError(message, 502);
  }
}

export async function startLegalReviewTest(
  repo: LegalReviewRepository,
  auditor: LegalReviewAuditor,
  input: { content: string; uid: string; now?: number }
): Promise<LegalReviewView> {
  const content = String(input.content || "");
  if (content.trim().length < 20) {
    throw new LegalReviewError("Informe o material de teste. Nenhuma aula foi alterada.", 400);
  }
  if (content.length > MAX_REVIEWABLE_CHARS) {
    throw new LegalReviewError("O material de teste é grande demais. Nenhuma aula foi alterada.", 400);
  }
  const now = input.now ?? Date.now();
  const reviewDate = formatReviewDate(new Date(now));
  const processing = blankReview({
    id: LEGAL_REVIEW_TEST_LESSON_ID,
    day: 0,
    part: 0,
    subject: "Teste do revisor",
    topic: "Material sintético",
    content,
  }, input.uid, now, reviewDate, true);
  const trace = createLegalReviewTrace({ testMode: true, requestedModel: reviewModelName() });
  trace.start();
  try {
    await tracedFirestore(trace, "begin", () => repo.begin(processing));
  } catch (error) {
    trace.error(error);
    if (error instanceof LegalReviewError) throw error;
    throw new LegalReviewError(failureMessage(error), 502);
  }
  try {
    const audit = await auditor.audit({
      reviewDate,
      lessonId: LEGAL_REVIEW_TEST_LESSON_ID,
      day: 0,
      part: 0,
      subject: processing.subject,
      topic: processing.topic,
      content,
      trace,
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
      testMode: true,
      usage: audit.usage,
      consultedSources: audit.consultedSources,
      manuallyEdited: false,
      candidateHash: hashLessonContent(audit.reviewedMarkdown),
      auditedCandidateHash: hashLessonContent(audit.reviewedMarkdown),
      sourceHistory: [],
    };
    await tracedFirestore(trace, "complete", () => repo.complete(pending));
    trace.success(reviewCounts(pending));
    return publicReview(pending);
  } catch (error) {
    trace.error(error);
    const message = failureMessage(error);
    await tracedFirestore(trace, "fail", () => repo.fail(processing.id, LEGAL_REVIEW_TEST_LESSON_ID, message)).catch(() => undefined);
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
  return publicReview(await repo.saveCandidate(reviewId, markdown, Date.now()));
}

export async function reauditLegalReview(
  repo: LegalReviewRepository,
  auditor: LegalReviewAuditor,
  reviewId: string,
  now = Date.now()
): Promise<LegalReviewView> {
  const current = await repo.get(reviewId);
  if (!current || current.status !== "pending_approval") {
    throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
  }
  if (!candidateMarkdownAccepted(current.originalContent, current.reviewedMarkdown)) {
    throw new LegalReviewError("O Markdown revisado quebrou a estrutura da aula. A aula publicada não foi alterada.", 400);
  }
  const trace = createLegalReviewTrace({ testMode: current.testMode === true, requestedModel: reviewModelName() });
  trace.start();
  try {
    const audit = await auditor.audit({
      reviewDate: formatReviewDate(new Date(now)),
      lessonId: current.lessonId,
      day: current.day,
      part: current.part,
      subject: current.subject,
      topic: current.topic,
      content: current.reviewedMarkdown,
      publishedContent: current.originalContent,
      trace,
    });
    const pending: LegalReviewView = {
      ...current,
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
      reviewDate: formatReviewDate(new Date(now)),
      webSearchUsed: audit.webSearchUsed,
      usage: audit.usage,
      consultedSources: audit.consultedSources,
      manuallyEdited: false,
      candidateHash: hashLessonContent(audit.reviewedMarkdown),
      auditedCandidateHash: hashLessonContent(audit.reviewedMarkdown),
      sourceHistory: [
        ...(current.sourceHistory || []),
        {
          at: now,
          verificationLevel: current.verificationLevel,
          consultedSources: current.consultedSources || [],
          note: "Fontes da auditoria anterior à nova revisão da candidata.",
        },
      ].slice(-6),
    };
    await tracedFirestore(trace, "complete", () => repo.complete(pending));
    trace.success(reviewCounts(pending));
    return publicReview(pending);
  } catch (error) {
    trace.error(error);
    const message = failureMessage(error);
    if (error instanceof LegalReviewError) throw error;
    throw new LegalReviewError(message, 502);
  }
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
  email: string,
  now = Date.now()
): Promise<{ reviewId: string; lesson: StoredCatalogLesson }> {
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A aprovação exige a identidade autenticada do CEO.", 403);
  }
  const current = await repo.get(reviewId);
  if (current && reviewCannotBePublished(current)) {
    throw new LegalReviewError(LEGAL_REVIEW_TEST_PUBLISH_MESSAGE, 403);
  }
  const result = await repo.approve(reviewId, uid, email, now);
  if (!result.ok) {
    throw new LegalReviewError(LEGAL_REVIEW_CONFLICT_MESSAGE, 409);
  }
  return { reviewId, lesson: result.lesson };
}
