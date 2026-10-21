/**
 * ATHENA — Executor Experimental V2.3.2-A (Runtime Budget Estendido).
 *
 * Módulo exclusivo para testes locais controlados offline.
 * Reutiliza estritamente os componentes canônicos de produção:
 * - Prompt V2.3.1 canônico (buildLegalReviewInstructions, buildUntrustedLessonInput, etc.)
 * - Validator V2.3.1 canônico (interpretReviewResponse, mergePatchAudits, mergeCoverageAudits, shouldRunCoveragePass)
 * - Trace e diagnósticos canônicos
 *
 * Sobrescreve unicamente os tetos de timeout para testar se o gargalo de 200s é a causa da não conclusão.
 */

import OpenAI from "openai";
import {
  reviewModelName,
  buildReviewCreateParams,
  interpretReviewResponse,
  extractConsultedSourceUrls,
  buildRejectedPatchFollowUp,
  reviewFollowUpInstruction,
  isTimeout,
  reviewFailureForOpenAIError,
  type AuditLessonResult,
} from "../src/services/legalReviewServer";
import {
  buildLegalReviewInstructions,
  buildUntrustedLessonInput,
  buildCoverageReviewInstructions,
  buildCoverageUntrustedInput,
} from "../src/services/legalReviewPrompt";
import {
  mergePatchAudits,
  mergeCoverageAudits,
  describeConsultedSources,
  shouldRunCoveragePass,
} from "../src/lib/legalReviewValidate";
import { searchDomainsForLesson, matchOfficialHost } from "../src/lib/legalReviewSources";
import { formatReviewDate, type LegalReviewChange } from "../src/lib/legalReviewTypes";
import type { LegalReviewTrace } from "../src/services/legalReviewTrace";

export const EXPERIMENTAL_CONFIG = {
  name: "V2.3.2-A_RUNTIME_ONLY",
  MAIN_ATTEMPT_TIMEOUT_MS: 360_000,
  TOTAL_AUDIT_BUDGET_MS: 540_000,
  MIN_FOLLOW_UP_REMAINING_MS: 75_000,
  MAX_MAIN_ATTEMPTS: 1,
  EXPECTED_SECTION_ID: "day_1_part_3_block_1",
  EXPECTED_CHARS: 13348,
  EXPECTED_SHA256: "99f481d10ffe9fb74bfd8cb2235213b6f7fe0155d8c5264136f4e838e9a5056b",
  EXPECTED_MODEL: "gpt-5.6",
  EXPECTED_REASONING_EFFORT: "medium" as const,
  EXPECTED_MAX_OUTPUT_TOKENS: 16000,
  EXPECTED_SEARCH_CONTEXT_SIZE: "high" as const,
  EXPECTED_TOOL_CHOICE: "required" as const,
  EXPECTED_DOMAINS: [
    "planalto.gov.br",
    "camara.leg.br",
    "senado.leg.br",
    "stf.jus.br",
    "stj.jus.br",
  ],
};

export interface ExperimentalSection {
  day: number;
  part: number;
  blockIndex: number;
  blockNumber: number;
  blockLabel: string;
  subject: string;
  topic: string;
  lessonDocId: string;
  sectionId: string;
  content: string;
  contentChars: number;
  contentSha256: string;
}

export interface ExperimentalAuditResult {
  executionStatus: "success" | "failed";
  audit: AuditLessonResult | null;
  error: { name: string; message: string } | null;
  requests: {
    logicalAuditExecutions: number;
    mainRequests: number;
    coverageRequests: number;
    repairRequests: number;
    totalOpenAIRequests: number;
  };
  timings: {
    experimentStartedAt: string;
    mainStartedAt: string | null;
    mainFinishedAt: string | null;
    mainElapsedMs: number | null;
    validationStartedAt: string | null;
    validationFinishedAt: string | null;
    validationElapsedMs: number | null;
    coverageStartedAt: string | null;
    coverageFinishedAt: string | null;
    coverageElapsedMs: number | null;
    repairStartedAt: string | null;
    repairFinishedAt: string | null;
    repairElapsedMs: number | null;
    experimentFinishedAt: string;
    totalElapsedMs: number;
  };
  tokens: {
    main: { input: number | null; output: number | null; reasoning: number | null };
    coverage: { input: number | null; output: number | null; reasoning: number | null };
    repair: { input: number | null; output: number | null; reasoning: number | null };
  };
  stages: {
    main: {
      status: string | null;
      changeCount: number;
      acceptedPatchCount: number;
      rejectedPatchCount: number;
      repairablePatchCount: number;
      unverifiedClaimCount: number;
    };
    coverage: {
      executed: boolean;
      status: string | null;
      changeCount: number;
    };
    repair: {
      executed: boolean;
      status: string | null;
      changeCount: number;
    };
  };
  finalCounts: {
    finalAcceptedPatchCount: number;
    finalRejectedPatchCount: number;
    finalRepairablePatchCount: number;
    finalUnverifiedClaimCount: number;
    finalVerificationLevel: string | null;
    consultedSourceCount: number;
  };
  changesProposed: Array<{
    id: string;
    type: string;
    originalExcerpt: string;
    revisedExcerpt: string;
    reason: string;
    confirmation: string;
    verified: boolean;
    evidence: any[];
  }>;
  unverifiedClaims: any[];
  rejectedPatches: any[];
  consultedSources: any[];
}

export function verifyIdentityGuard(section: ExperimentalSection): void {
  if (section.sectionId !== EXPERIMENTAL_CONFIG.EXPECTED_SECTION_ID) {
    throw new Error(
      `[GUARD VIOLATION] lessonId '${section.sectionId}' diverge do alvo do experimento ('${EXPERIMENTAL_CONFIG.EXPECTED_SECTION_ID}').`
    );
  }
  if (section.contentChars !== EXPERIMENTAL_CONFIG.EXPECTED_CHARS) {
    throw new Error(
      `[GUARD VIOLATION] chars '${section.contentChars}' diverge de '${EXPERIMENTAL_CONFIG.EXPECTED_CHARS}'.`
    );
  }
  if (section.contentSha256 !== EXPERIMENTAL_CONFIG.EXPECTED_SHA256) {
    throw new Error(
      `[GUARD VIOLATION] SHA-256 '${section.contentSha256}' diverge do baseline do smoke.`
    );
  }

  const requested = reviewModelName();
  if (requested !== EXPERIMENTAL_CONFIG.EXPECTED_MODEL) {
    throw new Error(
      `[GUARD VIOLATION] requestedModel '${requested}' diverge de '${EXPERIMENTAL_CONFIG.EXPECTED_MODEL}'.`
    );
  }

  const domains = searchDomainsForLesson(section.content);
  const coreMatch = EXPERIMENTAL_CONFIG.EXPECTED_DOMAINS.every((d) => domains.includes(d));
  if (!coreMatch) {
    throw new Error(
      `[GUARD VIOLATION] allowedDomains [${domains.join(", ")}] não contêm todos os domínios esperados [${EXPERIMENTAL_CONFIG.EXPECTED_DOMAINS.join(", ")}].`
    );
  }
}

export async function runAuditExperimentalV232A(
  section: ExperimentalSection,
  trace?: LegalReviewTrace
): Promise<ExperimentalAuditResult> {
  // Guarda de identidade obrigatória
  verifyIdentityGuard(section);

  const experimentStartedAt = new Date().toISOString();
  const expStartMs = Date.now();
  const remaining = () => EXPERIMENTAL_CONFIG.TOTAL_AUDIT_BUDGET_MS - (Date.now() - expStartMs);

  let mainStartedAt: string | null = null;
  let mainFinishedAt: string | null = null;
  let mainElapsedMs: number | null = null;

  let validationStartedAt: string | null = null;
  let validationFinishedAt: string | null = null;
  let validationElapsedMs: number | null = null;

  let coverageStartedAt: string | null = null;
  let coverageFinishedAt: string | null = null;
  let coverageElapsedMs: number | null = null;

  let repairStartedAt: string | null = null;
  let repairFinishedAt: string | null = null;
  let repairElapsedMs: number | null = null;

  let mainInputTokens: number | null = null;
  let mainOutputTokens: number | null = null;
  let mainReasoningTokens: number | null = null;

  let coverageInputTokens: number | null = null;
  let coverageOutputTokens: number | null = null;
  let coverageReasoningTokens: number | null = null;

  let repairInputTokens: number | null = null;
  let repairOutputTokens: number | null = null;
  let repairReasoningTokens: number | null = null;

  let mainRequests = 0;
  let coverageRequests = 0;
  let repairRequests = 0;
  let totalOpenAIRequests = 0;
  const logicalAuditExecutions = 1;

  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ausente para o experimento.");
  }
  const client = new OpenAI({ apiKey, maxRetries: 0 });
  const requestedModel = reviewModelName();
  const reviewDate = formatReviewDate(new Date());
  const instructions = buildLegalReviewInstructions(reviewDate);
  const baseline = section.content;
  const userInput = buildUntrustedLessonInput({
    reviewDate,
    lessonId: section.sectionId,
    day: section.day,
    part: section.part,
    subject: section.subject,
    topic: section.topic,
    content: section.content,
    sectionIndex: section.blockIndex,
  });

  trace?.start();

  console.log(`[EXPERIMENTAL V2.3.2-A] Iniciando Main Review com teto estendido de 360s (budget total 540s)...`);
  mainStartedAt = new Date().toISOString();
  const mainStartMs = Date.now();
  mainRequests++;
  totalOpenAIRequests++;
  trace?.openaiStart();

  let mainResponse: any = null;
  const mainTimeoutMs = Math.min(EXPERIMENTAL_CONFIG.MAIN_ATTEMPT_TIMEOUT_MS, remaining());

  try {
    mainResponse = await client.responses.create(
      buildReviewCreateParams({
        model: requestedModel,
        instructions,
        userInput,
        lessonText: section.content,
        reasoningEffort: "medium",
        maxOutputTokens: 16000,
      }),
      { timeout: mainTimeoutMs, maxRetries: 0 }
    );
    mainFinishedAt = new Date().toISOString();
    mainElapsedMs = Date.now() - mainStartMs;
    trace?.openaiEnd(mainResponse.model);
    console.log(`[EXPERIMENTAL V2.3.2-A] Main Review CONCLUÍDA com sucesso em ${(mainElapsedMs / 1000).toFixed(1)}s!`);
  } catch (error) {
    mainFinishedAt = new Date().toISOString();
    mainElapsedMs = Date.now() - mainStartMs;
    trace?.noteFailure(error, "openai");
    if (isTimeout(error)) {
      console.error(`[EXPERIMENTAL V2.3.2-A] MAIN_TIMEOUT_AT_360S após ${(mainElapsedMs / 1000).toFixed(1)}s. Abortando experimento sem retry.`);
      const experimentFinishedAt = new Date().toISOString();
      return {
        executionStatus: "failed",
        audit: null,
        error: { name: "TimeoutError", message: "MAIN_TIMEOUT_AT_360S" },
        requests: { logicalAuditExecutions, mainRequests, coverageRequests, repairRequests, totalOpenAIRequests },
        timings: {
          experimentStartedAt,
          mainStartedAt,
          mainFinishedAt,
          mainElapsedMs,
          validationStartedAt: null,
          validationFinishedAt: null,
          validationElapsedMs: null,
          coverageStartedAt: null,
          coverageFinishedAt: null,
          coverageElapsedMs: null,
          repairStartedAt: null,
          repairFinishedAt: null,
          repairElapsedMs: null,
          experimentFinishedAt,
          totalElapsedMs: Date.now() - expStartMs,
        },
        tokens: {
          main: { input: null, output: null, reasoning: null },
          coverage: { input: null, output: null, reasoning: null },
          repair: { input: null, output: null, reasoning: null },
        },
        stages: {
          main: { status: "TIMEOUT_360S", changeCount: 0, acceptedPatchCount: 0, rejectedPatchCount: 0, repairablePatchCount: 0, unverifiedClaimCount: 0 },
          coverage: { executed: false, status: null, changeCount: 0 },
          repair: { executed: false, status: null, changeCount: 0 },
        },
        finalCounts: {
          finalAcceptedPatchCount: 0,
          finalRejectedPatchCount: 0,
          finalRepairablePatchCount: 0,
          finalUnverifiedClaimCount: 0,
          finalVerificationLevel: null,
          consultedSourceCount: 0,
        },
        changesProposed: [],
        unverifiedClaims: [],
        rejectedPatches: [],
        consultedSources: [],
      };
    }
    throw reviewFailureForOpenAIError(error);
  }

  // Extrair contagem de tokens da Main
  if (mainResponse.usage) {
    mainInputTokens = mainResponse.usage.input_tokens ?? null;
    mainOutputTokens = mainResponse.usage.output_tokens ?? null;
    mainReasoningTokens =
      (mainResponse.usage as any).reasoning_tokens ??
      (mainResponse.usage as any).output_token_details?.reasoning_tokens ??
      null;
  }

  // Validação da Main
  validationStartedAt = new Date().toISOString();
  const valStartMs = Date.now();
  trace?.validationStart();
  let parsed: any;
  try {
    parsed = interpretReviewResponse(mainResponse, baseline, requestedModel);
    validationFinishedAt = new Date().toISOString();
    validationElapsedMs = Date.now() - valStartMs;
    trace?.validationEnd();
  } catch (valErr) {
    validationFinishedAt = new Date().toISOString();
    validationElapsedMs = Date.now() - valStartMs;
    trace?.validationEnd(undefined, valErr);
    trace?.noteFailure(valErr, "validation");
    throw valErr;
  }

  const mainResultStatus = parsed.outcome;
  const mainChangeCount = parsed.changes.length;
  const mainAcceptedPatchCount = parsed.changes.filter((c: LegalReviewChange) => c.confirmation === "CONFIRMADO").length;
  const mainRejectedPatchCount = parsed.changes.filter((c: LegalReviewChange) => c.confirmation === "NAO_CONFIRMADO").length;
  const mainRepairablePatchCount = parsed.repairablePatches?.length || 0;
  const mainUnverifiedClaimCount = parsed.unverifiedClaims.length;

  console.log(`[EXPERIMENTAL V2.3.2-A] Main validada: status=${mainResultStatus}, ${mainChangeCount} patches (${mainAcceptedPatchCount} conf, ${mainRejectedPatchCount} não conf, ${mainRepairablePatchCount} reparáveis)`);

  // --- ETAPA DE REPAIR ---
  let repairExecuted = false;
  let repairStatus: string | null = null;
  let repairChangeCount = 0;
  const repairable = parsed.repairablePatches ?? [];
  const lacksSources = !parsed.webSearchUsed;
  const firstUrls = extractConsultedSourceUrls(mainResponse.output);

  if ((repairable.length > 0 || lacksSources) && remaining() >= EXPERIMENTAL_CONFIG.MIN_FOLLOW_UP_REMAINING_MS) {
    repairExecuted = true;
    repairRequests++;
    totalOpenAIRequests++;
    repairStartedAt = new Date().toISOString();
    const repStartMs = Date.now();
    const followUpTimeoutMs = Math.min(EXPERIMENTAL_CONFIG.MAIN_ATTEMPT_TIMEOUT_MS, remaining());
    const patchFollowUp = repairable.length > 0;
    trace?.retry(patchFollowUp ? "rejected_patches" : "missing_sources");
    const followUser = patchFollowUp
      ? buildRejectedPatchFollowUp({
          repairable,
          acceptedIds: (parsed.appliedPatchInputs ?? []).map((item: any) => item.id),
        })
      : `${userInput}\n\n${reviewFollowUpInstruction(parsed)}`;

    console.log(`[EXPERIMENTAL V2.3.2-A] Executando Repair (motivo: ${patchFollowUp ? "rejected_patches" : "missing_sources"})...`);
    trace?.openaiStart();
    try {
      const repResponse = await client.responses.create(
        buildReviewCreateParams({
          model: requestedModel,
          instructions,
          userInput: followUser,
          lessonText: section.content,
          reasoningEffort: "high",
          maxOutputTokens: 12000,
        }),
        { timeout: followUpTimeoutMs, maxRetries: 0 }
      );
      repairFinishedAt = new Date().toISOString();
      repairElapsedMs = Date.now() - repStartMs;
      trace?.openaiEnd(repResponse.model);

      if (repResponse.usage) {
        repairInputTokens = repResponse.usage.input_tokens ?? null;
        repairOutputTokens = repResponse.usage.output_tokens ?? null;
        repairReasoningTokens =
          (repResponse.usage as any).reasoning_tokens ??
          (repResponse.usage as any).output_token_details?.reasoning_tokens ??
          null;
      }

      const followParsed = interpretReviewResponse(repResponse, baseline, requestedModel);
      repairStatus = followParsed.outcome;
      repairChangeCount = followParsed.changes.length;

      if (patchFollowUp) {
        const followUrls = extractConsultedSourceUrls(repResponse.output);
        const consultedUrls = [...firstUrls, ...followUrls];
        const merged = mergePatchAudits(
          baseline,
          parsed,
          followParsed,
          { webSearchExecuted: consultedUrls.length > 0, consultedUrls },
          describeConsultedSources(consultedUrls)
        );
        parsed = {
          ...parsed,
          ...merged,
          model: repResponse.model || parsed.model,
          webSearchUsed: consultedUrls.length > 0,
        };
      } else {
        parsed = followParsed;
      }
      console.log(`[EXPERIMENTAL V2.3.2-A] Repair concluído em ${(repairElapsedMs / 1000).toFixed(1)}s.`);
    } catch (repErr) {
      repairFinishedAt = new Date().toISOString();
      repairElapsedMs = Date.now() - repStartMs;
      trace?.noteFailure(repErr, "repair");
      console.warn(`[EXPERIMENTAL V2.3.2-A] Falha no Repair:`, repErr);
    }
  } else if (repairable.length > 0 || lacksSources) {
    console.log(`[EXPERIMENTAL V2.3.2-A] Repair pulado por tempo insuficiente (restam ${(remaining() / 1000).toFixed(1)}s).`);
  }

  // --- ETAPA DE COVERAGE ---
  let coverageExecuted = false;
  let coverageStatus: string | null = null;
  let coverageChangeCount = 0;

  const coverageDecision = shouldRunCoveragePass({
    content: section.content,
    parsedMain: parsed,
    sectionIndex: section.blockIndex,
  });

  console.log(`[EXPERIMENTAL V2.3.2-A] Decisão da Coverage adaptativa: run=${coverageDecision.run} (reasons: ${coverageDecision.reasons?.join(", ") || "none"}, skipReason: ${coverageDecision.skipReason || "none"})`);

  if (coverageDecision.run && remaining() >= EXPERIMENTAL_CONFIG.MIN_FOLLOW_UP_REMAINING_MS) {
    coverageExecuted = true;
    coverageRequests++;
    totalOpenAIRequests++;
    coverageStartedAt = new Date().toISOString();
    const covStartMs = Date.now();
    const coverageTimeoutMs = Math.min(EXPERIMENTAL_CONFIG.MAIN_ATTEMPT_TIMEOUT_MS, remaining());
    const acceptedPatchesForCoverage = (parsed.changes || [])
      .filter((c: LegalReviewChange) => c.confirmation === "CONFIRMADO")
      .map((c: LegalReviewChange) => ({
        id: c.id,
        type: c.type,
        originalExcerpt: c.originalExcerpt,
        revisedExcerpt: c.revisedExcerpt,
        reason: c.reason,
      }));
    const coverageInstructions = buildCoverageReviewInstructions(reviewDate);
    const coverageUser = buildCoverageUntrustedInput({
      reviewDate,
      lessonId: section.sectionId,
      day: section.day,
      part: section.part,
      subject: section.subject,
      topic: section.topic,
      content: section.content,
      acceptedPatches: acceptedPatchesForCoverage,
      sectionIndex: section.blockIndex,
    });

    console.log(`[EXPERIMENTAL V2.3.2-A] Executando Coverage Pass (${acceptedPatchesForCoverage.length} patches aceitos preservados)...`);
    trace?.openaiStart();
    try {
      const covResponse = await client.responses.create(
        buildReviewCreateParams({
          model: requestedModel,
          instructions: coverageInstructions,
          userInput: coverageUser,
          lessonText: section.content,
          reasoningEffort: "high",
          maxOutputTokens: 12000,
        }),
        { timeout: coverageTimeoutMs, maxRetries: 0 }
      );
      coverageFinishedAt = new Date().toISOString();
      coverageElapsedMs = Date.now() - covStartMs;
      trace?.openaiEnd(covResponse.model);

      if (covResponse.usage) {
        coverageInputTokens = covResponse.usage.input_tokens ?? null;
        coverageOutputTokens = covResponse.usage.output_tokens ?? null;
        coverageReasoningTokens =
          (covResponse.usage as any).reasoning_tokens ??
          (covResponse.usage as any).output_token_details?.reasoning_tokens ??
          null;
      }

      const covParsed = interpretReviewResponse(covResponse, baseline, requestedModel);
      coverageStatus = covParsed.outcome;
      coverageChangeCount = covParsed.changes.length;

      if (covParsed.changes && covParsed.changes.length > 0) {
        const coverageUrls = extractConsultedSourceUrls(covResponse.output);
        const currentUrls = (parsed.consultedSources || []).map((cs: any) => cs.url);
        const combinedUrls = [...currentUrls, ...coverageUrls];
        const merged = mergeCoverageAudits(
          baseline,
          parsed,
          covParsed,
          { webSearchExecuted: combinedUrls.length > 0, consultedUrls: combinedUrls },
          describeConsultedSources(combinedUrls)
        );
        parsed = {
          ...parsed,
          ...merged,
          model: covResponse.model || parsed.model,
          webSearchUsed: combinedUrls.length > 0,
        };
      }
      console.log(`[EXPERIMENTAL V2.3.2-A] Coverage Pass concluída em ${(coverageElapsedMs / 1000).toFixed(1)}s.`);
    } catch (covErr) {
      coverageFinishedAt = new Date().toISOString();
      coverageElapsedMs = Date.now() - covStartMs;
      trace?.noteFailure(covErr, "coverage");
      console.warn(`[EXPERIMENTAL V2.3.2-A] Falha na Coverage Pass:`, covErr);
    }
  } else if (coverageDecision.run) {
    console.log(`[EXPERIMENTAL V2.3.2-A] Coverage elegível, mas pulada por tempo insuficiente (restam ${(remaining() / 1000).toFixed(1)}s).`);
  }

  const experimentFinishedAt = new Date().toISOString();
  const totalElapsedMs = Date.now() - expStartMs;

  const confirmedChanges = parsed.changes.filter((c: LegalReviewChange) => c.confirmation === "CONFIRMADO");
  const unconfirmedChanges = parsed.changes.filter((c: LegalReviewChange) => c.confirmation === "NAO_CONFIRMADO");

  const finalCounts = {
    finalAcceptedPatchCount: confirmedChanges.length,
    finalRejectedPatchCount: unconfirmedChanges.length,
    finalRepairablePatchCount: parsed.repairablePatches?.length || 0,
    finalUnverifiedClaimCount: parsed.unverifiedClaims.length,
    finalVerificationLevel: parsed.verificationLevel,
    consultedSourceCount: parsed.consultedSources.length,
  };

  const changesProposed = parsed.changes.map((c: LegalReviewChange) => ({
    id: c.id,
    type: c.type,
    originalExcerpt: c.originalExcerpt,
    revisedExcerpt: c.revisedExcerpt,
    reason: c.reason,
    confirmation: c.confirmation,
    verified: c.verified,
    evidence: (c.evidence || []).map((ev: any) => ({
      institution: ev.institution,
      family: matchOfficialHost(ev.url)?.family || "OUTRA",
      title: ev.title,
      url: ev.url,
      sourceType: ev.sourceType,
      official: ev.official,
      consulted: ev.consulted,
      supportsChange: ev.supportsChange,
      supportExplanation: ev.supportExplanation,
    })),
  }));

  const consultedSources = parsed.consultedSources.map((cs: any) => {
    const hostMatch = matchOfficialHost(cs.url);
    return {
      url: cs.url,
      institution: cs.institution,
      family: hostMatch?.family || "OUTRA",
      host: hostMatch?.hosts?.[0] || cs.institution,
      official: cs.official,
    };
  });

  return {
    executionStatus: "success",
    audit: parsed,
    error: null,
    requests: {
      logicalAuditExecutions,
      mainRequests,
      coverageRequests,
      repairRequests,
      totalOpenAIRequests,
    },
    timings: {
      experimentStartedAt,
      mainStartedAt,
      mainFinishedAt,
      mainElapsedMs,
      validationStartedAt,
      validationFinishedAt,
      validationElapsedMs,
      coverageStartedAt,
      coverageFinishedAt,
      coverageElapsedMs,
      repairStartedAt,
      repairFinishedAt,
      repairElapsedMs,
      experimentFinishedAt,
      totalElapsedMs,
    },
    tokens: {
      main: { input: mainInputTokens, output: mainOutputTokens, reasoning: mainReasoningTokens },
      coverage: { input: coverageInputTokens, output: coverageOutputTokens, reasoning: coverageReasoningTokens },
      repair: { input: repairInputTokens, output: repairOutputTokens, reasoning: repairReasoningTokens },
    },
    stages: {
      main: {
        status: mainResultStatus,
        changeCount: mainChangeCount,
        acceptedPatchCount: mainAcceptedPatchCount,
        rejectedPatchCount: mainRejectedPatchCount,
        repairablePatchCount: mainRepairablePatchCount,
        unverifiedClaimCount: mainUnverifiedClaimCount,
      },
      coverage: {
        executed: coverageExecuted,
        status: coverageStatus,
        changeCount: coverageChangeCount,
      },
      repair: {
        executed: repairExecuted,
        status: repairStatus,
        changeCount: repairChangeCount,
      },
    },
    finalCounts,
    changesProposed,
    unverifiedClaims: parsed.unverifiedClaims,
    rejectedPatches: parsed.validationLog?.rejectedPatches || [],
    consultedSources,
  };
}
