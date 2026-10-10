import {
  LEGAL_REVIEW_ALREADY_MESSAGE,
  LEGAL_REVIEW_CONFLICT_MESSAGE,
  LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE,
  LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE,
  getLegalReviewOperationalFlags,
  MAX_REVIEWABLE_CHARS,
  emptyReviewIndex,
  formatReviewDate,
  type AsyncLegalReviewJobPayload,
  type AsyncLegalSupplementJobPayload,
  type HumanReviewDecision,
  type LegalReviewIndex,
  type LegalReviewView,
  type StoredCatalogLesson,
  type LegalReviewSupplement,
  type SupplementPendingItem,
  type LegalReviewEvidence,
  type LegalReviewSource,
  getFindingStableKey,
} from "../lib/legalReviewTypes";
import { extractCatalogBlock, sectionReviewKey } from "../lib/catalogBlock";
import { isCeoEmail } from "../lib/contentProvider";
import type { LegalReviewTaskEnqueuer } from "./legalReviewTaskQueue";
import { reviewModelName, type AuditLessonResult } from "./legalReviewServer";
import {
  createLegalReviewTrace,
  sanitizeLegalReviewMessage,
  type LegalReviewTrace,
  type LegalReviewTraceCounts,
} from "./legalReviewTrace";
import { candidateMarkdownAccepted } from "./legalReviewPublish";
import {
  applyCoordinatedQuestionPatch,
  applySingleSpanPatch,
  validateEditorialIntegrity,
  validateFindingsForClosure,
  validateFindingsHomologation,
  computeDecisionStateHash,
} from "../lib/legalReviewValidate";
import {
  LegalReviewError,
  hashCatalogSnapshot,
  hashLessonContent,
  LEGAL_REVIEW_TEST_LESSON_ID,
  LEGAL_REVIEW_TEST_PUBLISH_MESSAGE,
  lessonDocId,
  newReviewId,
  PROCESSING_HEARTBEAT_MS,
  processingLockBlocks,
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
    sectionIndex?: number;
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

function retainProcessingLease(repo: LegalReviewRepository, lessonId: string, reviewId: string): () => void {
  const timer = setInterval(() => {
    void renewProcessingLease(repo, lessonId, reviewId);
  }, PROCESSING_HEARTBEAT_MS);
  timer.unref?.();
  return () => clearInterval(timer);
}

/** Renova só o cadeado desta execução. Falha de rede não derruba a auditoria nem gera rejeição solta. */
export async function renewProcessingLease(
  repo: LegalReviewRepository,
  lessonId: string,
  reviewId: string,
  now = Date.now()
): Promise<void> {
  try {
    await repo.touchProcessing(lessonId, reviewId, now);
  } catch {
    return;
  }
}

async function reserveProcessingSlot(
  repo: LegalReviewRepository,
  index: LegalReviewIndex,
  now: number,
  activeMessage: string
): Promise<void> {
  const current = index.processingReviewId ? await repo.get(index.processingReviewId) : null;
  if (processingLockBlocks(index, current, now)) {
    throw new LegalReviewError(activeMessage, 409);
  }
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
  if (index.latestReviewId) {
    const latest = await repo.get(index.latestReviewId);
    if (
      latest &&
      latest.lessonId === lessonId &&
      !latest.testMode &&
      latest.status === "pending_approval"
    ) {
      if (!input.force && latest.originalHash === hash) {
        return {
          alreadyReviewed: false,
          review: publicReview(latest),
        };
      }
      throw new LegalReviewError(
        "Não é permitido iniciar ou forçar uma nova revisão enquanto existir uma revisão pendente de aprovação associada a esta aula. O catálogo oficial preserva a auditoria histórica.",
        409
      );
    }
    if (
      !input.force &&
      latest &&
      latest.lessonId === lessonId &&
      !latest.testMode &&
      latest.status === "uncertain_failure" &&
      latest.originalHash === hash
    ) {
      throw new LegalReviewError(
        "A revisão anterior para esta aula está em estado de execução incerta. Para evitar cobrança duplicada da OpenAI, consulte a revisão ou delibere explicitamente o reprocessamento com force=true.",
        409
      );
    }
  }

  const currentProcessing = index.processingReviewId ? await repo.get(index.processingReviewId) : null;
  if (!input.force && currentProcessing && currentProcessing.status === "processing" && !processingLockFresh(index, now)) {
    throw new LegalReviewError(
      "A revisão anterior foi interrompida com estado de execução incerta durante o processamento. Para evitar cobrança duplicada da OpenAI, consulte a revisão ou delibere explicitamente o reprocessamento com force=true.",
      409
    );
  }
  await reserveProcessingSlot(
    repo,
    index,
    now,
    "Já existe uma revisão em andamento para esta aula. Aguarde a conclusão antes de iniciar outra."
  );

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

  const stopLease = retainProcessingLease(repo, lesson.id, processing.id);
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
      editorialIntegrity: audit.editorialIntegrity || validateEditorialIntegrity(
        processing.originalContent,
        audit.reviewedMarkdown,
        audit.changes,
        { verificationLevel: audit.verificationLevel }
      ),
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
  } finally {
    stopLease();
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
  if (index.latestReviewId) {
    const latest = await repo.get(index.latestReviewId);
    if (
      latest &&
      latest.lessonId === scopeId &&
      !latest.testMode &&
      latest.status === "pending_approval"
    ) {
      if (!input.force && latest.originalHash === hash) {
        return {
          alreadyReviewed: false,
          review: publicReview(latest),
        };
      }
      throw new LegalReviewError(
        "Não é permitido iniciar ou forçar uma nova revisão enquanto existir uma revisão pendente de aprovação associada a esta parte da aula. O catálogo oficial preserva a auditoria histórica.",
        409
      );
    }
    if (
      !input.force &&
      latest &&
      latest.lessonId === scopeId &&
      !latest.testMode &&
      latest.status === "uncertain_failure" &&
      latest.originalHash === hash
    ) {
      throw new LegalReviewError(
        "A revisão anterior para esta parte está em estado de execução incerta. Para evitar cobrança duplicada da OpenAI, consulte a revisão ou delibere explicitamente o reprocessamento com force=true.",
        409
      );
    }
  }

  const currentProcessing = index.processingReviewId ? await repo.get(index.processingReviewId) : null;
  if (!input.force && currentProcessing && currentProcessing.status === "processing" && !processingLockFresh(index, now)) {
    throw new LegalReviewError(
      "A revisão anterior foi interrompida com estado de execução incerta durante o processamento. Para evitar cobrança duplicada da OpenAI, consulte a revisão ou delibere explicitamente o reprocessamento com force=true.",
      409
    );
  }
  await reserveProcessingSlot(
    repo,
    index,
    now,
    "Já existe uma revisão em andamento para esta parte. Aguarde a conclusão antes de iniciar outra."
  );

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

  const stopLease = retainProcessingLease(repo, scopeId, processing.id);
  try {
    const audit = await auditor.audit({
      reviewDate,
      lessonId: scopeId,
      day: lesson.day,
      part: lesson.part,
      subject: lesson.subject,
      topic: lesson.topic || lesson.subject,
      content: slice,
      sectionIndex: input.blockIndex,
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
      editorialIntegrity: audit.editorialIntegrity || validateEditorialIntegrity(
        processing.originalContent,
        audit.reviewedMarkdown,
        audit.changes,
        { verificationLevel: audit.verificationLevel }
      ),
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
  } finally {
    stopLease();
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
  const index = (await repo.getIndex(LEGAL_REVIEW_TEST_LESSON_ID)) || emptyReviewIndex(LEGAL_REVIEW_TEST_LESSON_ID);
  await reserveProcessingSlot(
    repo,
    index,
    now,
    "Já existe uma revisão em andamento para esta aula. Aguarde a conclusão antes de iniciar outra."
  );
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
  const stopLease = retainProcessingLease(repo, LEGAL_REVIEW_TEST_LESSON_ID, processing.id);
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
      editorialIntegrity: audit.editorialIntegrity || validateEditorialIntegrity(
        processing.originalContent,
        audit.reviewedMarkdown,
        audit.changes,
        { verificationLevel: audit.verificationLevel }
      ),
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
  } finally {
    stopLease();
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
      sectionIndex: current.blockIndex,
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
      editorialIntegrity: audit.editorialIntegrity || validateEditorialIntegrity(
        current.originalContent,
        audit.reviewedMarkdown,
        audit.changes,
        { verificationLevel: audit.verificationLevel }
      ),
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
  const flags = getLegalReviewOperationalFlags();
  if (!flags.stageCEnabled) {
    throw new LegalReviewError(LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE, 503);
  }
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A aprovação exige a identidade autenticada do CEO.", 403);
  }
  const current = await repo.get(reviewId);
  if (current && reviewCannotBePublished(current)) {
    throw new LegalReviewError(LEGAL_REVIEW_TEST_PUBLISH_MESSAGE, 403);
  }
  if (current && current.verificationLevel === "FALHA_NA_VERIFICACAO") {
    throw new LegalReviewError(
      "A aprovação integral está bloqueada porque a verificação em fontes oficiais falhou ou é insuficiente. A aula publicada não foi alterada.",
      403
    );
  }
  if (current) {
    const isInconclusive = current.supplement?.status === "inconclusive";
    const hasUnverifiedFinding = Boolean(
      current.supplement?.findings?.some(
        (f) => f.status === "nao_verificada" || (f as any).classification === "nao_verificada"
      )
    );
    if (isInconclusive || hasUnverifiedFinding || current.supplement?.resolution) {
      const homologation = validateFindingsHomologation(current);
      if (!homologation.ok) {
        throw new LegalReviewError(
          `A aprovação está bloqueada por pendências na complementação jurídica:\n- ${homologation.failureReasons.join("\n- ")}`,
          400
        );
      }
    }
    const integrity = current.editorialIntegrity || validateEditorialIntegrity(
      current.originalContent,
      current.reviewedMarkdown,
      current.changes,
      {
        verificationLevel: current.verificationLevel,
        humanDecisions: current.humanDecisions,
      }
    );
    if (!integrity.passed || integrity.status === "EDITORIAL_REVIEW_INCOMPLETE") {
      throw new LegalReviewError(
        `A aprovação está bloqueada por integridade editorial incompleta (alterações não aplicadas ou inconsistentes: ${integrity.problematicChanges.join(", ")}). A aula publicada não foi alterada.`,
        400
      );
    }
  }
  const result = await repo.approve(reviewId, uid, email, now);
  if (!result.ok) {
    throw new LegalReviewError(LEGAL_REVIEW_CONFLICT_MESSAGE, 409);
  }
  return { reviewId, lesson: result.lesson };
}

export async function resolveHumanLegalReviewChange(
  repo: LegalReviewRepository,
  reviewId: string,
  params: {
    changeId: string;
    action: "APPLY" | "EDIT" | "REJECT";
    customText?: string;
    rejectionReason?: string;
    targetContext?: string;
  },
  uid: string,
  email: string,
  now = Date.now()
): Promise<LegalReviewView> {
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A resolução de pendências exige a identidade autenticada do CEO.", 403);
  }
  const current = await repo.get(reviewId);
  if (!current || current.status !== "pending_approval") {
    throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
  }

  const change = current.changes.find((c) => c.id === params.changeId);
  if (!change) {
    throw new LegalReviewError(`Alteração ${params.changeId} não encontrada nesta revisão.`, 404);
  }

  let nextMarkdown = current.reviewedMarkdown;
  let decision: HumanReviewDecision;

  if (params.action === "REJECT") {
    if (!params.rejectionReason || !params.rejectionReason.trim()) {
      throw new LegalReviewError("A justificativa é obrigatória para rejeitar uma alteração jurídica.", 400);
    }
    decision = {
      changeId: params.changeId,
      action: "REJECT",
      state: "REJECTED_BY_CEO",
      rejectionReason: params.rejectionReason.trim(),
      decidedAt: now,
      decidedByUid: uid,
      decidedByEmail: email,
    };
  } else if (params.action === "APPLY") {
    const targetExcerpt = change.originalExcerpt;
    const replacementText = change.revisedExcerpt || "";
    const patch = applySingleSpanPatch(
      current.reviewedMarkdown,
      targetExcerpt,
      replacementText,
      change.beforeContext || "",
      change.afterContext || ""
    );

    if (patch.ok === false) {
      throw new LegalReviewError(
        `Não foi possível aplicar automaticamente a alteração ${params.changeId}: ${patch.message}`,
        400
      );
    }

    nextMarkdown = patch.doc;
    decision = {
      changeId: params.changeId,
      action: "APPLY",
      state: "APPLIED_BY_CEO",
      decidedAt: now,
      decidedByUid: uid,
      decidedByEmail: email,
    };
  } else if (params.action === "EDIT") {
    const customText = typeof params.customText === "string" ? params.customText : "";
    const targetExcerpt = params.targetContext || change.originalExcerpt;
    const patch = applySingleSpanPatch(
      current.reviewedMarkdown,
      targetExcerpt,
      customText,
      change.beforeContext || "",
      change.afterContext || ""
    );

    if (patch.ok === false) {
      throw new LegalReviewError(
        `Não foi possível aplicar a edição manual da alteração ${params.changeId}: ${patch.message}`,
        400
      );
    }

    nextMarkdown = patch.doc;
    decision = {
      changeId: params.changeId,
      action: "EDIT",
      state: "EDITED_BY_CEO",
      customText,
      targetContext: params.targetContext,
      decidedAt: now,
      decidedByUid: uid,
      decidedByEmail: email,
    };
  } else {
    throw new LegalReviewError(`Ação desconhecida: ${String((params as any).action)}`, 400);
  }

  const nextDecisions: Record<string, HumanReviewDecision> = {
    ...(current.humanDecisions || {}),
    [params.changeId]: decision,
  };

  const integrity = validateEditorialIntegrity(
    current.originalContent,
    nextMarkdown,
    current.changes,
    {
      verificationLevel: current.verificationLevel,
      humanDecisions: nextDecisions,
    }
  );

  if (typeof repo.saveHumanDecisions === "function") {
    const saved = await repo.saveHumanDecisions(reviewId, nextMarkdown, nextDecisions, integrity, now);
    return publicReview(saved);
  }

  const saved = await repo.saveCandidate(reviewId, nextMarkdown, now);
  saved.humanDecisions = nextDecisions;
  saved.editorialIntegrity = integrity;
  return publicReview(saved);
}

export async function resolveHumanCoordinatedQuestion(
  repo: LegalReviewRepository,
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
  },
  uid: string,
  email: string,
  now = Date.now()
): Promise<LegalReviewView> {
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A resolução de questões exige a identidade autenticada do CEO.", 403);
  }
  const current = await repo.get(reviewId);
  if (!current || current.status !== "pending_approval") {
    throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
  }

  const patch = applyCoordinatedQuestionPatch(
    current.reviewedMarkdown,
    params.questionIndex,
    params.question
  );

  if (patch.ok === false) {
    throw new LegalReviewError(`Falha ao aplicar questão coordenada: ${patch.message}`, 400);
  }

  const nextMarkdown = patch.doc;
  const nextDecisions: Record<string, HumanReviewDecision> = {
    ...(current.humanDecisions || {}),
  };

  for (const cid of params.changeIds) {
    const matchedChange = current.changes.find((c) => c.id === cid);
    nextDecisions[cid] = {
      changeId: cid,
      action: "EDIT",
      state: "EDITED_BY_CEO",
      customText: matchedChange?.revisedExcerpt || `Atualizado na Questão ${params.questionIndex + 1} em coordenação conjunta.`,
      decidedAt: now,
      decidedByUid: uid,
      decidedByEmail: email,
    };
  }

  const integrity = validateEditorialIntegrity(
    current.originalContent,
    nextMarkdown,
    current.changes,
    {
      verificationLevel: current.verificationLevel,
      humanDecisions: nextDecisions,
    }
  );

  if (typeof repo.saveHumanDecisions === "function") {
    const saved = await repo.saveHumanDecisions(reviewId, nextMarkdown, nextDecisions, integrity, now);
    return publicReview(saved);
  }

  const saved = await repo.saveCandidate(reviewId, nextMarkdown, now);
  saved.humanDecisions = nextDecisions;
  saved.editorialIntegrity = integrity;
  return publicReview(saved);
}

export async function resolveHumanLegalReviewFinding(
  repo: LegalReviewRepository,
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
  },
  uid: string,
  email: string,
  now = Date.now()
): Promise<LegalReviewView> {
  const flags = getLegalReviewOperationalFlags();
  if (!flags.stageAEnabled) {
    throw new LegalReviewError(LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE, 503);
  }
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A deliberação de achados jurídicos exige a identidade autenticada do CEO.", 403);
  }
  const current = await repo.get(reviewId);
  if (!current || current.status !== "pending_approval") {
    throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
  }

  // Validação estrita de concorrência e integridade do hash do candidato (Etapa 8.2)
  const expectedHash = (params.expectedCandidateHash || "").trim().toLowerCase();
  if (!expectedHash) {
    throw new LegalReviewError("O hash esperado do candidato (expectedCandidateHash) é obrigatório.", 400);
  }
  if (!/^[a-f0-9]{64}$/i.test(expectedHash)) {
    throw new LegalReviewError("O formato de expectedCandidateHash é inválido (deve ser SHA-256 hexadecimal com 64 caracteres).", 400);
  }
  const currentHash = (current.candidateHash || "").trim().toLowerCase();
  if (currentHash && expectedHash !== currentHash) {
    throw new LegalReviewError(
      "A revisão jurídica foi modificada desde o carregamento da página. O texto candidato atual difere da versão visualizada. Recarregue a página antes de deliberar.",
      409
    );
  }

  const findings = current.supplement?.findings || [];
  if (findings.length === 0) {
    throw new LegalReviewError("Esta revisão não possui achados da complementação jurídica.", 404);
  }

  const requestedKey = (params.findingKey || "").trim();
  const requestedPendingId = (params.pendingId || "").trim();
  const requestedChangeId = (params.changeId || "").trim();

  if (!requestedKey && !requestedPendingId && !requestedChangeId) {
    throw new LegalReviewError(
      "Não foi possível estabelecer identidade inequívoca para este achado jurídico (nenhum identificador válido informado). Deliberação bloqueada.",
      400
    );
  }

  // 1. Resolução Inequívoca e Detecção de Ambiguidade (Etapa 6A.1)
  const candidateIndices: number[] = [];

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    const stableKey = getFindingStableKey(f);

    // Prioridade 1: correspondência exata pela chave estável fornecida
    if (params.findingKey && stableKey && stableKey === params.findingKey) {
      candidateIndices.push(i);
      continue;
    }

    // Prioridade 2: correspondência por pendingId exato (apenas se findingKey não for especificada)
    if (!params.findingKey && params.pendingId && f.pendingId === params.pendingId) {
      candidateIndices.push(i);
      continue;
    }

    // Prioridade 3: correspondência por changeId exato (apenas se findingKey e pendingId não forem especificados)
    if (!params.findingKey && !params.pendingId && params.changeId && f.changeId === params.changeId) {
      candidateIndices.push(i);
      continue;
    }
  }

  // Se houver mais de uma ocorrência compatível, bloqueia com erro explícito de ambiguidade
  if (candidateIndices.length > 1) {
    throw new LegalReviewError(
      `Identificador ambíguo: foram encontrados ${candidateIndices.length} achados distintos correspondentes ao identificador '${params.findingKey || params.pendingId || params.changeId}'. A deliberação foi bloqueada para evitar vinculação ao achado incorreto.`,
      400
    );
  }

  if (candidateIndices.length === 0) {
    throw new LegalReviewError(
      `Achado jurídico '${params.findingKey || params.pendingId || params.changeId || "informado"}' não encontrado nesta revisão.`,
      404
    );
  }

  const targetIndex = candidateIndices[0];
  const finding = findings[targetIndex];
  const stableKey = getFindingStableKey(finding);

  if (!stableKey) {
    throw new LegalReviewError(
      "Não foi possível estabelecer identidade inequívoca para este achado jurídico. Deliberação bloqueada.",
      400
    );
  }

  // Validação de Justificativa Obrigatória para todas as deliberações ativas
  const justification = (params.justification || "").trim();
  if (params.action !== "MANTER_PENDENTE" && justification.length < 10) {
    throw new LegalReviewError(
      "A fundamentação detalhada do CEO é obrigatória (mínimo de 10 caracteres).",
      400
    );
  }

  let state: import("../lib/legalReviewTypes").HumanFindingResolutionState;
  let evidenceDecl: import("../lib/legalReviewTypes").FindingEvidenceDeclaration | undefined;
  let divergenceNature: string | undefined;
  let correctionChangeId: string | undefined;

  switch (params.action) {
    case "CONFIRMAR": {
      state = "CONFIRMADO_PELO_CEO";
      const hasDeclaredSource = Boolean(params.evidenceDeclaration?.declaredSource?.trim());
      const hasBiblio = Boolean(params.evidenceDeclaration?.bibliographicReference?.trim());
      if (!params.evidenceDeclaration || (!hasDeclaredSource && !hasBiblio)) {
        throw new LegalReviewError(
          "Para confirmar um achado, é obrigatório declarar a fonte oficial primária ou referência bibliográfica comprobatória.",
          400
        );
      }
      evidenceDecl = {
        declaredSource: params.evidenceDeclaration.declaredSource?.trim(),
        declaredUrl: params.evidenceDeclaration.declaredUrl?.trim(),
        declaredExcerpt: params.evidenceDeclaration.declaredExcerpt?.trim(),
        bibliographicReference: params.evidenceDeclaration.bibliographicReference?.trim(),
        semanticJustification: params.evidenceDeclaration.semanticJustification?.trim(),
        // Distinção expressa: a indicação de URL/fonte NÃO presume conferência documental automática
        documentaryVerified: Boolean(params.evidenceDeclaration.documentaryVerified),
        verificationNotes: params.evidenceDeclaration.verificationNotes?.trim(),
      };
      break;
    }

    case "APONTAR_CORRECAO": {
      state = "CORRECAO_NECESSARIA";
      const rawCid = params.correctionChangeId?.trim() || finding.changeId;
      if (!rawCid) {
        throw new LegalReviewError(
          "Para apontar necessidade de correção, vincule o achado a uma alteração existente em review.changes desta revisão.",
          400
        );
      }
      // Validação estrita de existência em review.changes da revisão atual
      const matchingChange = (current.changes || []).find(c => c.id === rawCid);
      if (!matchingChange) {
        throw new LegalReviewError(
          `A alteração corretiva informada ('${rawCid}') não existe em review.changes desta revisão. Não é permitido vincular identificadores inexistentes, pertencentes a outra revisão ou utilizar findingKey como substituto de alteração textual.`,
          400
        );
      }
      correctionChangeId = matchingChange.id;
      break;
    }

    case "DECLARAR_DIVERGENCIA": {
      state = "DIVERGENCIA_LEGITIMA";
      const divNature = (params.divergenceNature || "").trim();
      if (divNature.length < 5) {
        throw new LegalReviewError(
          "Para declarar divergência jurídica legítima, é obrigatório explicitar a corrente doutrinária ou divergência jurisprudencial aplicável.",
          400
        );
      }
      divergenceNature = divNature;
      break;
    }

    case "DECLARAR_NAO_COMPROVADO": {
      state = "NAO_COMPROVADO";
      break;
    }

    case "MANTER_PENDENTE": {
      state = "PENDENTE";
      break;
    }

    default:
      throw new LegalReviewError(`Ação de deliberação desconhecida: ${String(params.action)}`, 400);
  }

  const decisionPayload: import("../lib/legalReviewTypes").HumanFindingDecision = {
    findingKey: stableKey,
    findingPendingId: finding.pendingId,
    findingChangeId: finding.changeId,
    reviewId,
    originalAiStatus: finding.status,
    originalStatementAnalyzed: finding.statementAnalyzed,
    action: params.action,
    state,
    justification,
    evidenceDeclaration: evidenceDecl,
    divergenceNature,
    correctionChangeId,
    expurgationConfirmed: Boolean(params.expurgationConfirmed),
    expectedCandidateHash: expectedHash,
    candidateHashAtDecision: current.candidateHash,
    decidedAt: now,
    decidedByUid: uid,
    decidedByEmail: email,
  };

  if (typeof repo.saveFindingDecision === "function") {
    const updated = await repo.saveFindingDecision(reviewId, decisionPayload, now);
    return publicReview(updated);
  }

  // Fallback in-memory/teste caso repositório mock não tenha saveFindingDecision
  const existing = current.findingDecisions || {};
  const prior = existing[stableKey];
  const history = [...(prior?.history || [])];
  if (prior) {
    history.push({
      action: prior.action,
      state: prior.state,
      justification: prior.justification,
      evidenceDeclaration: prior.evidenceDeclaration,
      divergenceNature: prior.divergenceNature,
      correctionChangeId: prior.correctionChangeId,
      expurgationConfirmed: prior.expurgationConfirmed,
      expectedCandidateHash: prior.expectedCandidateHash,
      candidateHashAtDecision: prior.candidateHashAtDecision,
      decidedAt: prior.decidedAt,
      decidedByUid: prior.decidedByUid,
      decidedByEmail: prior.decidedByEmail,
    });
  }
  const consolidated = {
    ...decisionPayload,
    history,
  };
  const updatedView: LegalReviewView = {
    ...current,
    findingDecisions: {
      ...existing,
      [stableKey]: consolidated,
    },
  };
  return publicReview(updatedView);
}

/**
 * Criação transacional e atômica de alteração humana (CHG-H-xxx) pelo CEO vinculada a um achado autônomo (Etapa 20.2).
 */
export async function createHumanLegalReviewChangeFlow(
  repo: LegalReviewRepository,
  reviewId: string,
  params: {
    originFindingKey: string;
    originalExcerpt: string;
    revisedExcerpt: string;
    justification: string;
    category?: import("../lib/legalReviewTypes").LegalChangeCategory;
    nature?: import("../lib/legalReviewTaxonomy").LegalClaimNature;
    expectedCandidateHash: string;
  },
  uid: string,
  email: string,
  now = Date.now()
): Promise<LegalReviewView> {
  const flags = getLegalReviewOperationalFlags();
  if (!flags.stageAEnabled) {
    throw new LegalReviewError(LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE, 503);
  }
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A criação de alterações textuais humanas exige a identidade autenticada do CEO.", 403);
  }

  const current = await repo.get(reviewId);
  if (!current || current.status !== "pending_approval") {
    throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
  }

  // 1. Validação do Achado de Origem
  const requestedKey = (params.originFindingKey || "").trim();
  if (!requestedKey) {
    throw new LegalReviewError("O identificador do achado de origem (originFindingKey) é obrigatório.", 400);
  }
  const findings = current.supplement?.findings || [];
  const finding = findings.find((f) => getFindingStableKey(f) === requestedKey || f.pendingId === requestedKey || f.changeId === requestedKey);
  if (!finding) {
    throw new LegalReviewError(`O achado jurídico '${requestedKey}' não existe nesta revisão.`, 404);
  }
  const stableFindingKey = getFindingStableKey(finding);

  // 2. Validação de Concorrência e Integridade de Hash
  const expHash = (params.expectedCandidateHash || "").trim().toLowerCase();
  if (!expHash || !/^[a-f0-9]{64}$/i.test(expHash)) {
    throw new LegalReviewError("O hash esperado do candidato (expectedCandidateHash) é obrigatório e deve ser SHA-256 de 64 caracteres.", 400);
  }
  const currentHash = (current.candidateHash || "").trim().toLowerCase();
  if (currentHash && expHash !== currentHash) {
    throw new LegalReviewError(
      "A revisão jurídica foi modificada desde o carregamento da página. O texto candidato atual difere da versão visualizada. Recarregue a página antes de criar a alteração.",
      409
    );
  }

  // 3. Validação dos Textos
  const originalExcerpt = (params.originalExcerpt || "").trim();
  const revisedExcerpt = (params.revisedExcerpt || "").trim();
  const justification = (params.justification || "").trim();

  if (originalExcerpt.length < 5) {
    throw new LegalReviewError("O trecho original a ser substituído deve conter pelo menos 5 caracteres.", 400);
  }
  if (!revisedExcerpt) {
    throw new LegalReviewError("O texto substitutivo não pode ser vazio.", 400);
  }
  if (originalExcerpt === revisedExcerpt) {
    throw new LegalReviewError("O texto substitutivo não pode ser idêntico ao trecho original.", 400);
  }
  if (justification.length < 10) {
    throw new LegalReviewError("A justificativa editorial da alteração humana é obrigatória (mínimo de 10 caracteres).", 400);
  }

  // 4. Verificação de Ocorrência Única no reviewedMarkdown vigente
  const currentMarkdown = current.reviewedMarkdown || "";
  const firstIndex = currentMarkdown.indexOf(originalExcerpt);
  if (firstIndex === -1) {
    throw new LegalReviewError(
      "O trecho original informado não foi encontrado no texto atual da aula. Verifique se o texto já foi editado.",
      400
    );
  }
  const secondIndex = currentMarkdown.indexOf(originalExcerpt, firstIndex + 1);
  if (secondIndex !== -1) {
    throw new LegalReviewError(
      "O trecho original ocorre mais de uma vez no texto da aula. A substituição deve ser unívoca para evitar ambiguidades.",
      400
    );
  }

  // 5. Geração de ID Determinístico / Sequencial Único (CHG-H-001, CHG-H-002, ...)
  const existingChanges = current.changes || [];
  const humanIds = existingChanges
    .map((c) => c.id)
    .filter((id) => /^CHG-H-\d+$/i.test(id))
    .map((id) => parseInt(id.replace(/^CHG-H-/i, ""), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  const nextNum = humanIds.length > 0 ? Math.max(...humanIds) + 1 : 1;
  const newId = `CHG-H-${String(nextNum).padStart(3, "0")}`;

  if (existingChanges.some((c) => c.id === newId)) {
    throw new LegalReviewError(`Colisão de identificadores: alteração '${newId}' já existe nesta revisão.`, 409);
  }

  // 6. Substituição Atômica no Markdown
  const nextMarkdown = currentMarkdown.slice(0, firstIndex) + revisedExcerpt + currentMarkdown.slice(firstIndex + originalExcerpt.length);

  // 7. Montagem do Objeto LegalReviewChange Humano
  const humanChange: import("../lib/legalReviewTypes").LegalReviewChange = {
    id: newId,
    type: "CORRECAO",
    severity: "ALTA",
    category: params.category || "LEGISLACAO",
    originalExcerpt,
    revisedExcerpt,
    reason: justification,
    verified: true,
    confirmation: "CONFIRMADO",
    sources: finding.sources || [],
    evidence: finding.evidence || [],
    nature: params.nature || finding.nature,
    outcome: "CONFIRMADA",
    authorType: "HUMAN_CEO",
    originFindingKey: stableFindingKey,
    createdAt: now,
    createdByEmail: email,
  };

  // 8. Persistência Transacional no Repositório
  if (typeof repo.addHumanChange === "function") {
    const updated = await repo.addHumanChange(reviewId, humanChange, nextMarkdown, now, expHash);
    return publicReview(updated);
  }

  // Fallback in-memory para mocks / testes
  const updatedChanges = [...existingChanges, humanChange];
  const saved = await repo.saveCandidate(reviewId, nextMarkdown, now);
  // Preservação append-only: o encerramento do Estágio B permanece preservado para auditoria.
  // Sua eficácia é invalidada pelo descompasso de candidateHash.
  const updatedSupplement = current.supplement ? {
    ...current.supplement,
  } : undefined;

  saved.changes = updatedChanges;
  saved.supplement = updatedSupplement;
  return publicReview(saved);
}

/**
 * Emissão transacional de Aditamento Histórico Imutável (ADD-xxx) pelo CEO (Etapa 20.3).
 * Regulariza atos decisórios anteriores sem apagar, sobrescrever ou falsear registros históricos.
 */
export async function createLegalReviewAddendumFlow(
  repo: LegalReviewRepository,
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
  },
  uid: string,
  email: string,
  now = Date.now()
): Promise<LegalReviewView> {
  const flags = getLegalReviewOperationalFlags();
  if (!flags.stageAEnabled) {
    throw new LegalReviewError(LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE, 503);
  }
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A emissão de aditamentos históricos exige a identidade autenticada do CEO.", 403);
  }

  const current = await repo.get(reviewId);
  if (!current || current.status !== "pending_approval") {
    throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
  }

  // 1. Validação do Achado Alvo
  const requestedKey = (params.targetFindingKey || "").trim();
  if (!requestedKey) {
    throw new LegalReviewError("O identificador do achado alvo (targetFindingKey) é obrigatório.", 400);
  }
  const findings = current.supplement?.findings || [];
  const finding = findings.find(
    (f) => getFindingStableKey(f) === requestedKey || f.pendingId === requestedKey || f.changeId === requestedKey
  );
  if (!finding) {
    throw new LegalReviewError(`O achado jurídico '${requestedKey}' não existe nesta revisão.`, 404);
  }
  const stableFindingKey = getFindingStableKey(finding);

  // 2. Validação do Motivo e Descrição da Inconsistência
  const validReasons: import("../lib/legalReviewTypes").LegalAddendumReason[] = [
    "SANEAMENTO_VINCULO",
    "RETIFICACAO_MATERIAL",
    "ATUALIZACAO_JURISPRUDENCIAL",
    "OUTRO",
  ];
  if (!validReasons.includes(params.reason)) {
    throw new LegalReviewError(`O motivo do aditamento é inválido. Valores aceitos: ${validReasons.join(", ")}.`, 400);
  }
  const desc = (params.inconsistencyDescription || "").trim();
  if (desc.length < 15) {
    throw new LegalReviewError("A descrição da inconsistência sanada pelo aditamento é obrigatória (mínimo de 15 caracteres).", 400);
  }

  // 3. Validação Concorrencial Estrita dos Hashes (Etapa 15.1)
  const expCandHash = (params.expectedCandidateHash || "").trim().toLowerCase();
  const expDecHash = (params.expectedDecisionStateHash || "").trim().toLowerCase();
  if (!expCandHash || !/^[a-f0-9]{64}$/i.test(expCandHash)) {
    throw new LegalReviewError("O hash esperado do candidato (expectedCandidateHash) é obrigatório e deve ter 64 caracteres hexadecimais.", 400);
  }
  if (!expDecHash || !/^[a-f0-9]{64}$/i.test(expDecHash)) {
    throw new LegalReviewError("O hash esperado do estado de deliberações (expectedDecisionStateHash) é obrigatório e deve ter 64 caracteres hexadecimais.", 400);
  }

  const currentCandHash = (current.candidateHash || "").trim().toLowerCase();
  if (currentCandHash && expCandHash !== currentCandHash) {
    throw new LegalReviewError(
      "A revisão jurídica foi modificada desde o carregamento da página. O texto candidato difere da versão visualizada. Recarregue a página antes de emitir o aditamento.",
      409
    );
  }

  const currentDecHash = computeDecisionStateHash(current).toLowerCase();
  if (expDecHash !== currentDecHash) {
    throw new LegalReviewError(
      "O estado das deliberações individuais foi modificado desde o carregamento da página. Recarregue a página antes de emitir o aditamento.",
      409
    );
  }

  // 4. Validação do Ato Retificador
  const rect = params.rectifyingAct;
  if (!rect || typeof rect !== "object") {
    throw new LegalReviewError("Os dados do ato retificador (rectifyingAct) são obrigatórios.", 400);
  }
  const just = (rect.justification || "").trim();
  if (just.length < 10) {
    throw new LegalReviewError("A fundamentação do ato retificador é obrigatória (mínimo de 10 caracteres).", 400);
  }

  if (rect.action === "APONTAR_CORRECAO" || rect.state === "CORRECAO_NECESSARIA") {
    const cid = (rect.correctionChangeId || "").trim();
    if (!cid) {
      throw new LegalReviewError("O ato retificador de correção necessária exige a indicação de uma alteração vinculada (correctionChangeId).", 400);
    }
    const linkedChange = (current.changes || []).find((c) => c.id === cid);
    if (!linkedChange) {
      throw new LegalReviewError(`A alteração corretiva vinculada ('${cid}') não existe em review.changes desta revisão.`, 400);
    }
    if (!linkedChange.revisedExcerpt || !linkedChange.revisedExcerpt.trim()) {
      throw new LegalReviewError(`A alteração vinculada ('${cid}') não possui texto substitutivo/corrigido definido.`, 400);
    }
    const currentMarkdown = current.reviewedMarkdown || "";
    if (!currentMarkdown.includes(linkedChange.revisedExcerpt.trim())) {
      throw new LegalReviewError(`O texto corrigido da alteração vinculada ('${cid}') não está incorporado ao texto final da aula.`, 400);
    }
  }

  // 5. Verificação de Duplicidade e Geração de ID Sequencial
  const existingAddenda = current.addenda || [];
  const isDuplicate = existingAddenda.some(
    (a) =>
      a.targetFindingKey === stableFindingKey &&
      a.rectifyingAct.state === rect.state &&
      (a.rectifyingAct.correctionChangeId || "") === (rect.correctionChangeId || "") &&
      a.rectifyingAct.justification === just &&
      a.candidateHashAtAddendum === currentCandHash
  );
  if (isDuplicate) {
    throw new LegalReviewError(`Já existe um aditamento idêntico registrado para o achado '${stableFindingKey}' nesta versão da aula.`, 409);
  }

  const addendaNums = existingAddenda
    .map((a) => a.id)
    .filter((id) => /^ADD-\d+$/i.test(id))
    .map((id) => parseInt(id.replace(/^ADD-/i, ""), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  const nextNum = addendaNums.length > 0 ? Math.max(...addendaNums) + 1 : 1;
  const newAddendumId = `ADD-${String(nextNum).padStart(3, "0")}`;

  // 6. Snapshot do Ato Decisório Anterior
  const existingDec = (current.findingDecisions || {})[stableFindingKey];
  const priorAct: import("../lib/legalReviewTypes").PriorActSummary = existingDec ? {
    action: existingDec.action,
    state: existingDec.state,
    justification: existingDec.justification,
    correctionChangeId: existingDec.correctionChangeId,
    evidenceDeclaration: existingDec.evidenceDeclaration,
    divergenceNature: existingDec.divergenceNature,
    expurgationConfirmed: existingDec.expurgationConfirmed,
    candidateHashAtDecision: existingDec.candidateHashAtDecision,
    decidedAt: existingDec.decidedAt,
    decidedByEmail: existingDec.decidedByEmail,
  } : {
    state: "PENDENTE",
    justification: "Nenhuma deliberação anterior registrada.",
  };

  // 7. Construção do Objeto do Aditamento
  const newAddendum: import("../lib/legalReviewTypes").LegalReviewAddendum = {
    id: newAddendumId,
    reviewId,
    targetFindingKey: stableFindingKey,
    linkedChangeId: rect.correctionChangeId,
    reason: params.reason,
    inconsistencyDescription: desc,
    priorAct,
    rectifyingAct: {
      action: rect.action,
      state: rect.state,
      justification: just,
      correctionChangeId: rect.correctionChangeId,
      evidenceDeclaration: rect.evidenceDeclaration,
      divergenceNature: rect.divergenceNature,
      expurgationConfirmed: rect.expurgationConfirmed,
      candidateHashAtDecision: currentCandHash,
    },
    candidateHashAtAddendum: currentCandHash,
    decisionStateHashAtAddendum: currentDecHash,
    createdAt: now,
    createdByUid: uid,
    createdByEmail: email,
    authorType: "HUMAN_CEO",
    immutable: true,
  };

  // 8. Construção da Decisão Retificada com Histórico Preservado
  const priorHistory = existingDec ? [
    ...(existingDec.history || []),
    {
      action: existingDec.action,
      state: existingDec.state,
      justification: existingDec.justification,
      evidenceDeclaration: existingDec.evidenceDeclaration,
      divergenceNature: existingDec.divergenceNature,
      correctionChangeId: existingDec.correctionChangeId,
      expurgationConfirmed: existingDec.expurgationConfirmed,
      expectedCandidateHash: existingDec.expectedCandidateHash,
      candidateHashAtDecision: existingDec.candidateHashAtDecision,
      decidedAt: existingDec.decidedAt,
      decidedByUid: existingDec.decidedByUid,
      decidedByEmail: existingDec.decidedByEmail,
    }
  ] : [];

  const rectifiedDecision: import("../lib/legalReviewTypes").HumanFindingDecision = {
    findingKey: stableFindingKey,
    findingPendingId: finding.pendingId || "",
    findingChangeId: finding.changeId,
    reviewId,
    originalAiStatus: finding.status as any,
    originalStatementAnalyzed: finding.statementAnalyzed,
    action: rect.action,
    state: rect.state,
    justification: just,
    evidenceDeclaration: rect.evidenceDeclaration,
    divergenceNature: rect.divergenceNature,
    correctionChangeId: rect.correctionChangeId,
    expurgationConfirmed: rect.expurgationConfirmed,
    expectedCandidateHash: expCandHash,
    candidateHashAtDecision: currentCandHash,
    decidedAt: now,
    decidedByUid: uid,
    decidedByEmail: email,
    history: priorHistory,
    addendumId: newAddendumId,
    rectifiedByAddendum: true,
  };

  // 9. Persistência Transacional no Repositório
  if (typeof repo.addAddendum === "function") {
    const updated = await repo.addAddendum(
      reviewId,
      newAddendum,
      rectifiedDecision,
      now,
      {
        expectedCandidateHash: expCandHash,
        expectedDecisionStateHash: expDecHash,
      }
    );
    return publicReview(updated);
  }

  // Fallback in-memory para mocks / testes
  const updatedAddenda = [...existingAddenda, newAddendum];
  const updatedFindingDecisions = {
    ...(current.findingDecisions || {}),
    [stableFindingKey]: rectifiedDecision,
  };
  const updatedView: LegalReviewView = {
    ...current,
    addenda: updatedAddenda,
    findingDecisions: updatedFindingDecisions,
  };
  return publicReview(updatedView);
}

export async function closeLegalReviewSupplementFlow(
  repo: LegalReviewRepository,
  reviewId: string,
  params: {
    overallJustification: string;
    expectedCandidateHash: string;
    expectedDecisionStateHash: string;
  },
  uid: string,
  email: string,
  now = Date.now()
): Promise<LegalReviewView> {
  const flags = getLegalReviewOperationalFlags();
  if (!flags.stageBEnabled) {
    throw new LegalReviewError(LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE, 503);
  }
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A deliberação de encerramento da complementação jurídica exige a identidade autenticada do CEO.", 403);
  }
  const current = await repo.get(reviewId);
  if (!current || current.status !== "pending_approval") {
    throw new LegalReviewError("Esta revisão não está aguardando aprovação.", 409);
  }
  if (!current.supplement) {
    throw new LegalReviewError("Esta revisão não possui complementação jurídica para encerrar.", 404);
  }

  const currentCandidateHash = (current.candidateHash || "").trim().toLowerCase();
  const currentDecisionStateHash = computeDecisionStateHash(current).toLowerCase();

  // Proteção contra duplicidade de encerramento já realizado
  if (current.supplement.resolution && current.supplement.resolution.status === "RESOLVIDO_PELO_CEO") {
    const res = current.supplement.resolution;
    const sameCandidate = res.candidateHashAtClosure === current.candidateHash;
    const sameDecisions = Boolean(res.decisionStateHashAtClosure && res.decisionStateHashAtClosure === currentDecisionStateHash);
    const noNewAddenda = !(current.addenda && current.addenda.some((a) => a.createdAt > res.closedAt));
    if (sameCandidate && sameDecisions && noNewAddenda) {
      throw new LegalReviewError(
        "A complementação jurídica já foi encerrada anteriormente pelo CEO para esta mesma versão do texto candidato e deliberações.",
        409
      );
    }
  }

  // Validação estrita de concorrência e integridade dos hashes (Etapa 15.1)
  const expCandHash = (params.expectedCandidateHash || "").trim().toLowerCase();
  const expDecHash = (params.expectedDecisionStateHash || "").trim().toLowerCase();

  if (!expCandHash) {
    throw new LegalReviewError("O hash esperado do candidato (expectedCandidateHash) é obrigatório.", 400);
  }
  if (!/^[a-f0-9]{64}$/i.test(expCandHash)) {
    throw new LegalReviewError(
      "O formato de expectedCandidateHash é inválido (deve ser SHA-256 hexadecimal com 64 caracteres).",
      400
    );
  }

  if (!expDecHash) {
    throw new LegalReviewError("O hash esperado do estado de deliberações (expectedDecisionStateHash) é obrigatório.", 400);
  }
  if (!/^[a-f0-9]{64}$/i.test(expDecHash)) {
    throw new LegalReviewError(
      "O formato de expectedDecisionStateHash é inválido (deve ser SHA-256 hexadecimal com 64 caracteres).",
      400
    );
  }

  if (currentCandidateHash && expCandHash !== currentCandidateHash) {
    throw new LegalReviewError(
      "A revisão jurídica foi modificada desde o carregamento da página. O texto candidato atual difere da versão visualizada. Recarregue a página antes de encerrar.",
      409
    );
  }

  if (expDecHash !== currentDecisionStateHash) {
    throw new LegalReviewError(
      "O estado das deliberações individuais foi modificado desde o carregamento da página. As decisões registradas diferem da versão visualizada. Recarregue a página antes de encerrar.",
      409
    );
  }

  const justification = (params.overallJustification || "").trim();
  if (justification.length < 15) {
    throw new LegalReviewError(
      "A justificativa global do CEO para encerramento da complementação é obrigatória (mínimo de 15 caracteres).",
      400
    );
  }

  const closureCheck = validateFindingsForClosure(current);
  if (!closureCheck.ok) {
    throw new LegalReviewError(
      `O encerramento da complementação foi rejeitado porque existem pendências não resolvidas:\n- ${closureCheck.failureReasons.join("\n- ")}`,
      400
    );
  }

  const resolutionPayload: import("../lib/legalReviewTypes").SupplementHumanResolution = {
    status: "RESOLVIDO_PELO_CEO",
    closedAt: now,
    closedByUid: uid,
    closedByEmail: email,
    overallJustification: justification,
    candidateHashAtClosure: current.candidateHash,
    decisionStateHashAtClosure: currentDecisionStateHash,
    totalFindingsResolved: (current.supplement.findings || []).length,
  };

  if (typeof repo.closeSupplementResolution === "function") {
    const updated = await repo.closeSupplementResolution(
      reviewId,
      resolutionPayload,
      now,
      {
        expectedCandidateHash: expCandHash,
        expectedDecisionStateHash: expDecHash,
      }
    );
    return publicReview(updated);
  }

  const priorResolution = current.supplement.resolution;
  const priorHistory = [...(priorResolution?.history || [])];
  if (priorResolution && (
    priorResolution.candidateHashAtClosure !== current.candidateHash ||
    priorResolution.decisionStateHashAtClosure !== currentDecisionStateHash ||
    (current.addenda && current.addenda.some((a) => a.createdAt > priorResolution.closedAt))
  )) {
    priorHistory.push({
      status: priorResolution.status,
      closedAt: priorResolution.closedAt,
      closedByUid: priorResolution.closedByUid,
      closedByEmail: priorResolution.closedByEmail,
      overallJustification: priorResolution.overallJustification,
      candidateHashAtClosure: priorResolution.candidateHashAtClosure,
      decisionStateHashAtClosure: priorResolution.decisionStateHashAtClosure,
      totalFindingsResolved: priorResolution.totalFindingsResolved,
    });
  }

  const updatedSupplement: import("../lib/legalReviewTypes").LegalReviewSupplement = {
    ...current.supplement,
    resolution: {
      ...resolutionPayload,
      history: priorHistory,
    },
  };
  const updatedView: LegalReviewView = {
    ...current,
    supplement: updatedSupplement,
  };
  return publicReview(updatedView);
}

export type GetLatestReviewResult =
  | { found: false }
  | {
      found: true;
      review: LegalReviewView;
      conflict: boolean;
      status: string;
    };

export async function getLatestLegalReviewFlow(
  repo: LegalReviewRepository,
  input: { day: number; part: number; blockIndex?: number }
): Promise<GetLatestReviewResult> {
  const scopeId = typeof input.blockIndex === "number"
    ? sectionReviewKey(input.day, input.part, input.blockIndex)
    : lessonDocId(input.day, input.part);

  const catalogId = lessonDocId(input.day, input.part);
  const lesson = await repo.getLesson(catalogId);
  if (!lesson) {
    return { found: false };
  }

  let expectedHash = "";
  if (typeof input.blockIndex === "number") {
    const slice = extractCatalogBlock(lesson.content, input.blockIndex);
    if (!slice) return { found: false };
    const sectionLesson: StoredCatalogLesson = { ...lesson, id: scopeId, content: slice };
    expectedHash = hashCatalogSnapshot(sectionLesson);
  } else {
    expectedHash = hashCatalogSnapshot(lesson);
  }

  const index = await repo.getIndex(scopeId);
  if (!index || !index.latestReviewId) {
    return { found: false };
  }

  const review = await repo.get(index.latestReviewId);
  if (!review || review.testMode || review.lessonId !== scopeId) {
    return { found: false };
  }

  const conflict = review.originalHash !== expectedHash;

  return {
    found: true,
    review: publicReview(review),
    conflict,
    status: review.status,
  };
}

export type EnqueueReviewResult =
  | { alreadyReviewed: true; message: string; lastReviewDate: string; reviewId: string }
  | { existingPending: true; review: LegalReviewView }
  | { alreadyProcessing: true; reviewId: string; status: string }
  | { enqueued: true; reviewId: string; status: "queued" };

export async function enqueueAsyncLegalReview(
  repo: LegalReviewRepository,
  taskEnqueuer: { enqueue: (payload: AsyncLegalReviewJobPayload) => Promise<void> },
  input: {
    day: number;
    part: number;
    blockIndex?: number;
    force: boolean;
    uid: string;
    now?: number;
  }
): Promise<EnqueueReviewResult> {
  const now = input.now ?? Date.now();
  const catalogId = lessonDocId(input.day, input.part);
  const lesson = await repo.getLesson(catalogId);
  if (!lesson || lesson.content.trim().length < 20) {
    throw new LegalReviewError(
      "Esta aula ainda não está no catálogo oficial. Publique o bloco antes de revisar.",
      404
    );
  }

  const isSection = typeof input.blockIndex === "number";
  const scopeId = isSection
    ? sectionReviewKey(input.day, input.part, input.blockIndex!)
    : catalogId;

  let slice = lesson.content;
  let sectionLesson: StoredCatalogLesson = lesson;
  if (isSection) {
    const extracted = extractCatalogBlock(lesson.content, input.blockIndex!);
    if (!extracted || extracted.trim().length < 20) {
      throw new LegalReviewError("Esta parte não existe na aula publicada. A aula não foi alterada.", 404);
    }
    slice = extracted;
    sectionLesson = { ...lesson, id: scopeId, content: slice };
  }

  if (slice.length > MAX_REVIEWABLE_CHARS) {
    throw new LegalReviewError(
      "Esta parte é grande demais para a auditoria automática. A aula publicada não foi alterada.",
      400
    );
  }

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

  if (index.latestReviewId) {
    const latest = await repo.get(index.latestReviewId);
    if (
      latest &&
      latest.lessonId === scopeId &&
      !latest.testMode &&
      latest.status === "pending_approval"
    ) {
      if (!input.force && latest.originalHash === hash) {
        return {
          existingPending: true,
          review: publicReview(latest),
        };
      }
      throw new LegalReviewError(
        "Não é permitido iniciar ou forçar uma nova revisão enquanto existir uma revisão pendente de aprovação associada a esta aula. O catálogo oficial preserva a auditoria histórica.",
        409
      );
    }
    if (
      !input.force &&
      latest &&
      latest.lessonId === scopeId &&
      !latest.testMode &&
      latest.status === "uncertain_failure" &&
      latest.originalHash === hash
    ) {
      throw new LegalReviewError(
        "A revisão anterior para esta aula está em estado de execução incerta. Para evitar cobrança duplicada da OpenAI, consulte a revisão ou delibere explicitamente o reprocessamento com force=true.",
        409
      );
    }
  }

  const currentProcessing = index.processingReviewId ? await repo.get(index.processingReviewId) : null;
  if (processingLockBlocks(index, currentProcessing, now)) {
    return {
      alreadyProcessing: true,
      reviewId: index.processingReviewId!,
      status: currentProcessing?.status || "processing",
    };
  }

  if (!input.force && currentProcessing && currentProcessing.status === "processing" && !processingLockFresh(index, now)) {
    throw new LegalReviewError(
      "A revisão anterior foi interrompida com estado de execução incerta durante o processamento. Para evitar cobrança duplicada da OpenAI, consulte a revisão ou delibere explicitamente o reprocessamento com force=true.",
      409
    );
  }

  const reviewDate = formatReviewDate(new Date(now));
  const reviewId = newReviewId();
  const queuedReview: LegalReviewView = {
    ...blankReview(sectionLesson, input.uid, now, reviewDate),
    id: reviewId,
    lessonId: scopeId,
    day: input.day,
    part: input.part,
    blockIndex: input.blockIndex,
    catalogLessonId: isSection ? catalogId : undefined,
    previewOnly: isSection,
    originalContent: slice,
    originalHash: hash,
    status: "queued",
  };

  await repo.begin(queuedReview);

  const payload: AsyncLegalReviewJobPayload = {
    reviewId,
    lessonId: scopeId,
    day: input.day,
    part: input.part,
    blockIndex: input.blockIndex,
    expectedHash: hash,
    requestedByUid: input.uid,
    requestedAt: now,
  };

  try {
    await taskEnqueuer.enqueue(payload);
  } catch (enqueueError: any) {
    await repo.fail(
      reviewId,
      scopeId,
      `Falha ao enfileirar tarefa no Cloud Tasks: ${enqueueError?.message || "Erro desconhecido"}`
    ).catch(() => undefined);
    throw new LegalReviewError(
      "Não foi possível agendar a auditoria em segundo plano. Tente novamente.",
      503
    );
  }

  return {
    enqueued: true,
    reviewId,
    status: "queued",
  };
}

export async function processAsyncLegalReviewWorker(
  repo: LegalReviewRepository,
  auditor: LegalReviewAuditor,
  payload: AsyncLegalReviewJobPayload,
  now = Date.now()
): Promise<{ status: "completed" | "skipped" | "failed"; reviewId: string }> {
  const current = await repo.get(payload.reviewId);
  if (!current) {
    return { status: "skipped", reviewId: payload.reviewId };
  }

  if (
    current.status === "pending_approval" ||
    current.status === "approved" ||
    current.status === "rejected" ||
    current.status === "failed" ||
    current.status === "uncertain_failure"
  ) {
    return { status: "skipped", reviewId: payload.reviewId };
  }

  // Aquisição atômica: se outro worker já adquiriu ou mudou de queued, ignora execução concorrente
  if (typeof repo.claimJob === "function") {
    const claimed = await repo.claimJob(payload.reviewId, payload.lessonId, now);
    if (!claimed) {
      return { status: "skipped", reviewId: payload.reviewId };
    }
  }

  const catalogId = lessonDocId(payload.day, payload.part);
  const lesson = await repo.getLesson(catalogId);
  if (!lesson) {
    await repo.fail(payload.reviewId, payload.lessonId, "Aula não encontrada no catálogo oficial.");
    return { status: "failed", reviewId: payload.reviewId };
  }

  const isSection = typeof payload.blockIndex === "number";
  let contentToAudit = lesson.content;
  let sectionLesson = lesson;
  if (isSection) {
    const slice = extractCatalogBlock(lesson.content, payload.blockIndex!);
    if (!slice) {
      await repo.fail(payload.reviewId, payload.lessonId, "Bloco interno da aula não encontrado.");
      return { status: "failed", reviewId: payload.reviewId };
    }
    contentToAudit = slice;
    sectionLesson = { ...lesson, id: payload.lessonId, content: slice };
  }

  const currentHash = hashCatalogSnapshot(sectionLesson);
  if (currentHash !== payload.expectedHash) {
    await repo.fail(payload.reviewId, payload.lessonId, LEGAL_REVIEW_CONFLICT_MESSAGE);
    return { status: "failed", reviewId: payload.reviewId };
  }

  if (typeof repo.claimJob !== "function") {
    const processingUpdate: LegalReviewView = {
      ...current,
      status: "processing",
    };
    await repo.begin(processingUpdate);
  }

  const stopLease = retainProcessingLease(repo, payload.lessonId, payload.reviewId);
  const trace = createLegalReviewTrace({ testMode: false, requestedModel: reviewModelName() });
  trace.start();

  try {
    const audit = await auditor.audit({
      reviewDate: current.reviewDate,
      lessonId: payload.lessonId,
      day: payload.day,
      part: payload.part,
      subject: lesson.subject,
      topic: lesson.topic || lesson.subject,
      content: contentToAudit,
      sectionIndex: payload.blockIndex,
      trace,
    });

    const pending: LegalReviewView = {
      ...current,
      status: "pending_approval",
      reviewedMarkdown: audit.reviewedMarkdown,
      changes: audit.changes,
      unverifiedClaims: audit.unverifiedClaims,
      summary: audit.summary,
      reviewNotes: audit.reviewNotes,
      verificationLevel: audit.verificationLevel,
      confidence: audit.confidence,
      outcome: audit.outcome,
      model: audit.model,
      webSearchUsed: audit.webSearchUsed,
      testMode: false,
      usage: audit.usage,
      consultedSources: audit.consultedSources,
      manuallyEdited: false,
      candidateHash: hashLessonContent(audit.reviewedMarkdown),
      auditedCandidateHash: hashLessonContent(audit.reviewedMarkdown),
      sourceHistory: [],
      editorialIntegrity: audit.editorialIntegrity || validateEditorialIntegrity(
        contentToAudit,
        audit.reviewedMarkdown,
        audit.changes,
        { verificationLevel: audit.verificationLevel }
      ),
    };

    await repo.complete(pending);
    trace.success(reviewCounts(pending));
    return { status: "completed", reviewId: payload.reviewId };
  } catch (error) {
    trace.error(error);
    const message = failureMessage(error);
    // Registra falha e previne novas execuções automáticas sem deliberação expressa do CEO
    await repo.fail(
      payload.reviewId,
      payload.lessonId,
      `Auditoria interrompida com estado incerto: ${message.slice(0, 200)}. Intervenção manual do CEO requerida para evitar cobrança duplicada.`,
      "uncertain_failure"
    ).catch(() => undefined);
    return { status: "failed", reviewId: payload.reviewId };
  } finally {
    stopLease();
  }
}

export interface LegalSupplementExecutor {
  supplement: (params: {
    lessonId: string;
    pendingItems: SupplementPendingItem[];
    budget: { maxTokens: number; maxDurationMs: number; maxCostUsd: number };
    signal?: AbortSignal;
  }) => Promise<{
    status: "completed" | "inconclusive";
    tokensUsed: number;
    durationMs: number;
    costUsd: number;
    findings: import("../lib/legalReviewTypes").SupplementFindingItem[];
    finalNote: string;
  }>;
}

export async function executeSingleSupplementFlow(
  repo: LegalReviewRepository,
  executor: LegalSupplementExecutor,
  reviewId: string,
  uid: string,
  email: string,
  now = Date.now()
): Promise<LegalReviewView> {
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A complementação de evidências exige a identidade autenticada do CEO.", 403);
  }

  const current = await repo.get(reviewId);
  if (!current || current.status !== "pending_approval") {
    throw new LegalReviewError("A revisão precisa estar no estado pending_approval para receber complementação.", 409);
  }

  // Trava persistente: se já executou ou está em estado terminal/interrompido
  if (current.supplement) {
    if (
      current.supplement.attemptCount >= 1 ||
      current.supplement.status === "completed" ||
      current.supplement.status === "inconclusive" ||
      current.supplement.status === "uncertain_interrupted" ||
      current.supplement.status === "exhausted"
    ) {
      throw new LegalReviewError("A complementação jurídica já foi executada para esta revisão e não pode ser repetida.", 409);
    }
    if (current.supplement.status === "running") {
      throw new LegalReviewError("A complementação jurídica já está em andamento. Se foi interrompida, exige verificação humana do CEO.", 409);
    }
  }

  // Extrai pendências concretas: alterações sem evidência suficiente + unverifiedClaims
  const changeItems: SupplementPendingItem[] = (current.changes || [])
    .filter((c) => !c.verified || !c.evidence || c.evidence.length === 0)
    .map((c) => ({
      id: `chg_${c.id}`,
      sourceType: "CHANGE" as const,
      changeId: c.id,
      excerpt: c.originalExcerpt || "",
      reason: c.reason || "",
    }));

  const claimItems: SupplementPendingItem[] = (current.unverifiedClaims || []).map((uc, idx) => ({
    id: `unverified_claim_${idx + 1}`,
    sourceType: "UNVERIFIED_CLAIM" as const,
    excerpt: uc.excerpt,
    reason: uc.reason,
  }));

  const pendingItems: SupplementPendingItem[] = [...changeItems, ...claimItems];

  if (pendingItems.length === 0) {
    const noPendingSupplement: LegalReviewSupplement = {
      attemptCount: 1,
      status: "completed",
      startedAt: now,
      completedAt: now,
      requestedByUid: uid,
      requestedByEmail: email,
      costEstimatedUsd: 0,
      tokensUsed: 0,
      durationMs: 0,
      targetedPendingItems: [],
      findings: [],
      finalNote: "Todas as alterações e afirmações já possuem comprovação oficial vinculada.",
    };
    if (typeof repo.recordSupplementOutcome === "function") {
      return await repo.recordSupplementOutcome(reviewId, noPendingSupplement, now);
    }
    return current;
  }

  // Etapa 1: Reserva prévia da tentativa (attemptCount permanece 0)
  if (typeof repo.reserveSupplement === "function") {
    const reserved = await repo.reserveSupplement(reviewId, uid, email, pendingItems, now);
    if (!reserved.ok || !reserved.review) {
      throw new LegalReviewError(reserved.reason || "Não foi possível reservar a complementação jurídica.", 409);
    }
  }

  // Orçamento preventivo verificável: máximo 4000 tokens, 120s de duração, teto estimado de $0.05 USD
  const budget = {
    maxTokens: 4000,
    maxDurationMs: 120_000,
    maxCostUsd: 0.05,
  };

  // Etapa 2: Transição atômica para RUNNING com attemptCount = 1 imediatamente antes da chamada
  if (typeof repo.markSupplementStarted === "function") {
    const started = await repo.markSupplementStarted(reviewId, now);
    if (!started) {
      if (typeof repo.failPreCallSupplement === "function") {
        await repo.failPreCallSupplement(reviewId, "Falha na transição atômica para execução", now);
      }
      throw new LegalReviewError("Não foi possível iniciar a complementação jurídica. Estado reservado inválido ou conflito.", 409);
    }
  }

  // Etapa 3: Execução com AbortController de 120s
  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => {
    controller.abort();
  }, budget.maxDurationMs);

  try {
    const outcome = await executor.supplement({
      lessonId: current.lessonId,
      pendingItems,
      budget,
      signal: controller.signal,
    });
    clearTimeout(timeoutTimer);

    const recordedSupplement: LegalReviewSupplement = {
      attemptCount: 1,
      status: outcome.status,
      startedAt: now,
      completedAt: Date.now(),
      requestedByUid: uid,
      requestedByEmail: email,
      costEstimatedUsd: outcome.costUsd,
      tokensUsed: outcome.tokensUsed,
      durationMs: outcome.durationMs,
      targetedPendingItems: pendingItems,
      findings: outcome.findings,
      finalNote: outcome.finalNote,
    };

    if (typeof repo.recordSupplementOutcome === "function") {
      return await repo.recordSupplementOutcome(reviewId, recordedSupplement, Date.now());
    }
    return current;
  } catch (error: any) {
    clearTimeout(timeoutTimer);

    // Em caso de cancelamento por timeout ou erro em voo: trava attemptCount = 1 de forma conservadora
    const isTimeout = controller.signal.aborted || error?.name === "AbortError" || /timeout/i.test(error?.message || "");
    const finalStatus: import("../lib/legalReviewTypes").LegalSupplementStatus = isTimeout
      ? "inconclusive"
      : "uncertain_interrupted";

    const failedSupplement: LegalReviewSupplement = {
      attemptCount: 1,
      status: finalStatus,
      startedAt: now,
      completedAt: Date.now(),
      requestedByUid: uid,
      requestedByEmail: email,
      costEstimatedUsd: 0,
      tokensUsed: 0,
      durationMs: Date.now() - now,
      targetedPendingItems: pendingItems,
      findings: [],
      finalNote: isTimeout
        ? `Complementação cancelada por atingir o tempo limite de ${budget.maxDurationMs / 1000}s. Encerramento definitivo registrado.`
        : `Complementação interrompida por erro durante execução: ${error?.message || "Erro desconhecido"}. Encerramento definitivo registrado.`,
    };

    if (typeof repo.recordSupplementOutcome === "function") {
      return await repo.recordSupplementOutcome(reviewId, failedSupplement, Date.now());
    }
    return current;
  }
}

/**
 * Deriva um identificador determinístico e estável para a tarefa do Cloud Tasks.
 * Baseia-se exclusivamente no reviewId e no attemptId persistido atomicamente no Firestore.
 */
export function deriveSupplementTaskId(reviewId: string, attemptId: string): string {
  const raw = `supp-${reviewId}-${attemptId}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 500);
}

/**
 * Diferencia rejeição comprovada antes da criação da tarefa de erro de transporte com resultado incerto.
 * Qualquer ambiguidade ou erro pós-início de transporte é estritamente classificado como resultado INCERTO.
 */
export function isProvenPreCreationError(err: any): boolean {
  if (!err) return false;

  const message = String(err.message || err || "");
  const code = err.code;
  const status = err.status || err.statusCode;

  // 1. Falha de configuração local antes de qualquer RPC ao Cloud Tasks
  if (
    /configura[çc][ãa]o obrigat[óo]ria do cloud tasks ausente/i.test(message) ||
    /missing.*cloud_tasks/i.test(message) ||
    /enfileiramento abortado/i.test(message)
  ) {
    return true;
  }

  // 2. Erros de validação síncrona local de payload/argumentos antes do RPC
  if (
    err instanceof TypeError ||
    err instanceof RangeError ||
    (code === 3 && /invalid argument/i.test(message))
  ) {
    return true;
  }

  // 3. Rejeição explícita da API do Cloud Tasks comprovando que a tarefa NÃO foi criada
  // gRPC 5 (NOT_FOUND - fila inexistente), gRPC 7 (PERMISSION_DENIED), gRPC 9 (FAILED_PRECONDITION)
  // HTTP 400, 401, 403, 404, 412
  if (
    code === 5 ||
    code === 7 ||
    code === 9 ||
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 412
  ) {
    return true;
  }

  // Timeouts, conexões interrompidas, deadlines, reset de rede ou erros 5xx são INCERTOS
  return false;
}

/**
 * Enfileira a etapa única de complementação jurídica no Google Cloud Tasks de forma segura e assíncrona.
 * Reserva atomicamente a tentativa no Firestore e despacha uma tarefa determinística.
 * Não aguarda a OpenAI e responde rapidamente ao frontend.
 */
export async function enqueueSingleSupplementFlow(
  repo: LegalReviewRepository,
  taskEnqueuer: LegalReviewTaskEnqueuer,
  reviewId: string,
  uid: string,
  email: string,
  now = Date.now()
): Promise<LegalReviewView> {
  if (!isCeoEmail(email)) {
    throw new LegalReviewError("A complementação de evidências exige a identidade autenticada do CEO.", 403);
  }

  const current = await repo.get(reviewId);
  if (!current || current.status !== "pending_approval") {
    throw new LegalReviewError("A revisão precisa estar no estado pending_approval para receber complementação.", 409);
  }

  // Trava persistente: se já executou ou está em estado terminal/interrompido
  if (current.supplement) {
    if (
      current.supplement.attemptCount >= 1 ||
      current.supplement.status === "completed" ||
      current.supplement.status === "inconclusive" ||
      current.supplement.status === "uncertain_interrupted" ||
      current.supplement.status === "exhausted"
    ) {
      throw new LegalReviewError("A complementação jurídica já foi executada para esta revisão e não pode ser repetida.", 409);
    }
    if (current.supplement.status === "running") {
      throw new LegalReviewError("A complementação jurídica já está em andamento. Se foi interrompida, exige verificação humana do CEO.", 409);
    }
  }

  // Extrai pendências concretas: alterações sem evidência suficiente + unverifiedClaims
  const changeItems: SupplementPendingItem[] = (current.changes || [])
    .filter((c) => !c.verified || !c.evidence || c.evidence.length === 0)
    .map((c) => ({
      id: `chg_${c.id}`,
      sourceType: "CHANGE" as const,
      changeId: c.id,
      excerpt: c.originalExcerpt || "",
      reason: c.reason || "",
    }));

  const claimItems: SupplementPendingItem[] = (current.unverifiedClaims || []).map((uc, idx) => ({
    id: `unverified_claim_${idx + 1}`,
    sourceType: "UNVERIFIED_CLAIM" as const,
    excerpt: uc.excerpt,
    reason: uc.reason,
  }));

  const pendingItems: SupplementPendingItem[] = [...changeItems, ...claimItems];

  if (pendingItems.length === 0) {
    const noPendingSupplement: LegalReviewSupplement = {
      attemptCount: 1,
      attemptId: current.supplement?.attemptId || "att-1",
      status: "completed",
      startedAt: now,
      completedAt: now,
      requestedByUid: uid,
      requestedByEmail: email,
      costEstimatedUsd: 0,
      tokensUsed: 0,
      durationMs: 0,
      targetedPendingItems: [],
      findings: [],
      finalNote: "Todas as alterações e afirmações já possuem comprovação oficial vinculada.",
    };
    if (typeof repo.recordSupplementOutcome === "function") {
      return await repo.recordSupplementOutcome(reviewId, noPendingSupplement, now);
    }
    return current;
  }

  // Identificador estável da tentativa persistido no Firestore
  // Reenvios da mesma tentativa reutilizam o mesmo identificador estável.
  const stableAttemptId = current.supplement?.attemptId || "att-1";

  // Etapa 1: Reserva prévia atômica no Firestore (attemptCount permanece 0)
  if (current.supplement?.status !== "reserved") {
    if (typeof repo.reserveSupplement === "function") {
      const reserved = await repo.reserveSupplement(reviewId, uid, email, pendingItems, now, stableAttemptId);
      if (!reserved.ok || !reserved.review) {
        throw new LegalReviewError(reserved.reason || "Não foi possível reservar a complementação jurídica.", 409);
      }
    }
  }

  // Obtém o attemptId efetivamente persistido
  const latestReservedView = await repo.get(reviewId);
  const effectiveAttemptId = latestReservedView?.supplement?.attemptId || stableAttemptId;

  // Etapa 2: Derivação de identificador estável e determinístico para o Cloud Tasks
  const deterministicTaskId = deriveSupplementTaskId(reviewId, effectiveAttemptId);

  const jobPayload: AsyncLegalSupplementJobPayload = {
    jobType: "SUPPLEMENT",
    reviewId,
    lessonId: current.lessonId,
    attemptId: effectiveAttemptId,
    requestedByUid: uid,
    requestedByEmail: email,
    requestedAt: now,
  };

  try {
    await taskEnqueuer.enqueue(jobPayload, deterministicTaskId);
  } catch (enqueueErr: any) {
    const isProvenPreCreation = isProvenPreCreationError(enqueueErr);
    if (isProvenPreCreation) {
      // Falha comprovadamente anterior à criação da tarefa na fila:
      // Preserva a tentativa para nova ação do CEO com pre_call_failure (attemptCount = 0)
      if (typeof repo.failPreCallSupplement === "function") {
        await repo.failPreCallSupplement(
          reviewId,
          `Falha comprovada anterior à criação da tarefa: ${enqueueErr?.message || enqueueErr}`,
          Date.now()
        );
      }
      throw new LegalReviewError(
        "Falha comprovada ao despachar a tarefa para a fila do Cloud Tasks antes da criação. A tentativa foi preservada.",
        502
      );
    } else {
      // Erro de transporte com resultado incerto (timeout, queda de conexão, 5xx):
      // A tarefa PODE ter sido criada no Cloud Tasks. Mantém o estado 'reserved' bloqueado para reconciliação,
      // NÃO restaura attemptCount = 0, NÃO reabilita o botão e NÃO invalida a tarefa criada caso o worker a receba.
      if (typeof repo.recordUncertainEnqueueSupplement === "function") {
        await repo.recordUncertainEnqueueSupplement(
          reviewId,
          `Erro de transporte com resultado incerto no enfileiramento: ${enqueueErr?.message || enqueueErr}`,
          Date.now()
        );
      }
      throw new LegalReviewError(
        "Falha de transporte com resultado incerto ao contatar o Cloud Tasks. O estado foi mantido reservado para reconciliação e proteção contra duplicidade.",
        504
      );
    }
  }

  const updatedView = await repo.get(reviewId);
  return updatedView || current;
}

/**
 * Worker autenticado do Google Cloud Tasks para processar exclusivamente a complementação jurídica reservada.
 * Garante aquisição exclusiva e atômica antes de qualquer chamada à OpenAI.
 * Entregas duplicadas, tardias ou concorrentes são descartadas de forma segura com status "skipped".
 */
export async function processAsyncLegalSupplementWorker(
  repo: LegalReviewRepository,
  executor: LegalSupplementExecutor,
  payload: AsyncLegalSupplementJobPayload,
  now = Date.now()
): Promise<{ status: "completed" | "skipped" | "inconclusive" | "failed"; reviewId: string }> {
  const current = await repo.get(payload.reviewId);
  if (!current || current.status !== "pending_approval") {
    return { status: "skipped", reviewId: payload.reviewId };
  }

  // Trava estrita de entrega: SOMENTE o estado 'reserved' pode progredir para execução
  if (!current.supplement || current.supplement.status !== "reserved") {
    return { status: "skipped", reviewId: payload.reviewId };
  }

  if (current.supplement.attemptCount >= 1) {
    return { status: "skipped", reviewId: payload.reviewId };
  }

  // Validação estrita da identidade da tentativa:
  // Se o payload carrega attemptId, ele precisa bater exatamente com o attemptId ativo no Firestore.
  if (payload.attemptId && current.supplement?.attemptId && current.supplement.attemptId !== payload.attemptId) {
    console.warn(`[supplement-worker] Tarefa descartada: attemptId (${payload.attemptId}) não corresponde à tentativa ativa (${current.supplement.attemptId}).`);
    return { status: "skipped", reviewId: payload.reviewId };
  }

  // Transição atômica e exclusiva para RUNNING com attemptCount = 1 imediatamente antes da chamada
  if (typeof repo.markSupplementStarted === "function") {
    const started = await repo.markSupplementStarted(payload.reviewId, now);
    if (!started) {
      // Outro worker concorrente adquiriu o lock primeiro. Descarte seguro sem segunda chamada.
      return { status: "skipped", reviewId: payload.reviewId };
    }
  }

  const pendingItems = current.supplement.targetedPendingItems && current.supplement.targetedPendingItems.length > 0
    ? current.supplement.targetedPendingItems
    : [
        ...(current.changes || [])
          .filter((c) => !c.verified || !c.evidence || c.evidence.length === 0)
          .map((c) => ({
            id: `chg_${c.id}`,
            sourceType: "CHANGE" as const,
            changeId: c.id,
            excerpt: c.originalExcerpt || "",
            reason: c.reason || "",
          })),
        ...(current.unverifiedClaims || []).map((uc, idx) => ({
          id: `unverified_claim_${idx + 1}`,
          sourceType: "UNVERIFIED_CLAIM" as const,
          excerpt: uc.excerpt,
          reason: uc.reason,
        })),
      ];

  // Orçamento preventivo: 120s de timeout, 4000 tokens de saída, teto estimado de $0.05 USD
  const budget = {
    maxTokens: 4000,
    maxDurationMs: 120_000,
    maxCostUsd: 0.05,
  };

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => {
    controller.abort();
  }, budget.maxDurationMs);

  console.log(`[supplement-worker] Iniciando complementação assíncrona para reviewId: ${payload.reviewId} (${pendingItems.length} pendências, timeout: 120s)`);

  try {
    const outcome = await executor.supplement({
      lessonId: current.lessonId,
      pendingItems,
      budget,
      signal: controller.signal,
    });
    clearTimeout(timeoutTimer);

    const recordedSupplement: LegalReviewSupplement = {
      attemptCount: 1,
      attemptId: payload.attemptId || current.supplement?.attemptId || "att-1",
      status: outcome.status,
      startedAt: now,
      completedAt: Date.now(),
      requestedByUid: payload.requestedByUid,
      requestedByEmail: payload.requestedByEmail,
      costEstimatedUsd: outcome.costUsd,
      tokensUsed: outcome.tokensUsed,
      durationMs: outcome.durationMs,
      targetedPendingItems: pendingItems,
      findings: outcome.findings,
      finalNote: outcome.finalNote,
    };

    if (typeof repo.recordSupplementOutcome === "function") {
      await repo.recordSupplementOutcome(payload.reviewId, recordedSupplement, Date.now());
    }
    console.log(`[supplement-worker] Complementação assíncrona finalizada com status=${outcome.status} para reviewId: ${payload.reviewId}`);
    return { status: outcome.status, reviewId: payload.reviewId };
  } catch (error: any) {
    clearTimeout(timeoutTimer);

    // Em caso de cancelamento por timeout ou erro em voo: trava attemptCount = 1 de forma definitiva
    const isTimeout = controller.signal.aborted || error?.name === "AbortError" || /timeout/i.test(error?.message || "");
    const finalStatus: import("../lib/legalReviewTypes").LegalSupplementStatus = isTimeout
      ? "inconclusive"
      : "uncertain_interrupted";

    const failedSupplement: LegalReviewSupplement = {
      attemptCount: 1,
      attemptId: payload.attemptId || current.supplement?.attemptId || "att-1",
      status: finalStatus,
      startedAt: now,
      completedAt: Date.now(),
      requestedByUid: payload.requestedByUid,
      requestedByEmail: payload.requestedByEmail,
      costEstimatedUsd: 0,
      tokensUsed: 0,
      durationMs: Date.now() - now,
      targetedPendingItems: pendingItems,
      findings: [],
      finalNote: isTimeout
        ? `Complementação cancelada por atingir o tempo limite de ${budget.maxDurationMs / 1000}s. Encerramento definitivo registrado.`
        : `Complementação interrompida por erro durante execução: ${error?.message || "Erro desconhecido"}. Encerramento definitivo registrado.`,
    };

    if (typeof repo.recordSupplementOutcome === "function") {
      await repo.recordSupplementOutcome(payload.reviewId, failedSupplement, Date.now());
    }
    console.warn(`[supplement-worker] Complementação falhou/abortou com status=${finalStatus} para reviewId: ${payload.reviewId}:`, error?.message || error);
    return { status: finalStatus === "inconclusive" ? "inconclusive" : "failed", reviewId: payload.reviewId };
  }
}
