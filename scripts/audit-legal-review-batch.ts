/**
 * Harness de Auditoria Jurídica em Escala — Modo Estritamente Read-Only.
 *
 * Executa o motor real do Revisor Jurídico (auditLessonWithOpenAI) sobre partes/blocos
 * das aulas publicadas sem qualquer persistência ou efeito colateral no banco ATHENA
 * (sem gravação em homologated_lessons, legal_reviews, legal_review_index ou caches).
 *
 * Uso:
 *   npx tsx scripts/audit-legal-review-batch.ts --dry-run --day 1 --parts 0,1,3 --blocks 1 --limit 3
 *   npx tsx scripts/audit-legal-review-batch.ts --day 1 --parts 0,1,3 --blocks 1 --limit 3
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { TRILHA_JURIDICA_DATA } from "../src/data/trilhaData";
import { extractCatalogBlock, sectionReviewKey } from "../src/lib/catalogBlock";
import { auditLessonWithOpenAI, reviewModelName, persistDiagnosticFiles } from "../src/services/legalReviewServer";
import { createLegalReviewTrace } from "../src/services/legalReviewTrace";
import { formatReviewDate } from "../src/lib/legalReviewTypes";
import { matchOfficialHost, searchDomainsForLesson } from "../src/lib/legalReviewSources";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import dotenv from "dotenv";
import {
  runAuditExperimentalV232A,
  verifyIdentityGuard,
  EXPERIMENTAL_CONFIG,
} from "./audit-experimental-v232a";

// Resolução de credenciais para ambiente de desenvolvimento / batch
if (!process.env.OPENAI_API_KEY) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}
if (!process.env.OPENAI_API_KEY) {
  try {
    const fetched = execSync(
      `gcloud secrets versions access latest --secret=OPENAI_API_KEY --project=${firebaseConfig.projectId}`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    if (fetched) {
      process.env.OPENAI_API_KEY = fetched;
    }
  } catch {
    // Secret indisponível via gcloud; o validador interno emitirá mensagem segura se ausente
  }
}

const STAGE_LABELS = [
  "Introdução",
  "Letra da Lei e Destaques",
  "Jurisprudência de Alta Intensidade",
  "Doutrina de Alto Nível",
  "Desafio ATHENA",
  "Revisão Comprimida",
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

interface CliArgs {
  day: number;
  parts?: number[];
  blocks?: number[];
  limit?: number;
  outPath: string;
  dryRun: boolean;
  experimentalV232A: boolean;
  maxRealCalls?: number;
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  let day = 1;
  let parts: number[] | undefined;
  let blocks: number[] | undefined;
  let limit: number | undefined;
  let outPath = "";
  let dryRun = false;
  let experimentalV232A = false;
  let maxRealCalls: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--experimental-v232a") {
      experimentalV232A = true;
    } else if (arg === "--max-real-calls" && argv[i + 1]) {
      maxRealCalls = Number(argv[++i]);
    } else if (arg === "--day" && argv[i + 1]) {
      day = Number(argv[++i]);
    } else if (arg === "--parts" && argv[i + 1]) {
      parts = argv[++i].split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
    } else if (arg === "--blocks" && argv[i + 1]) {
      blocks = argv[++i].split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
    } else if (arg === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i]);
    } else if (arg === "--out" && argv[i + 1]) {
      outPath = argv[++i];
    }
  }

  if (!outPath) {
    if (experimentalV232A) {
      outPath = path.resolve(process.cwd(), `tmp/audit-legal-review-day-${day}-v2.3.2a-runtime.json`);
    } else {
      outPath = path.resolve(process.cwd(), `tmp/audit-legal-review-day-${day}.json`);
    }
  } else {
    outPath = path.resolve(process.cwd(), outPath);
  }

  return { day, parts, blocks, limit, outPath, dryRun, experimentalV232A, maxRealCalls };
}

function getGitContext(): { commitSha: string; commitShaShort: string; branch: string } {
  try {
    const commitSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    const commitShaShort = commitSha.slice(0, 7);
    const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
    return { commitSha, commitShaShort, branch };
  } catch {
    return { commitSha: "unknown", commitShaShort: "unknown", branch: "unknown" };
  }
}

interface LoadedLesson {
  id: string;
  day: number;
  part: number;
  subject: string;
  topic?: string;
  content: string;
}

async function loadLesson(day: number, part: number): Promise<LoadedLesson | null> {
  const docId = `day_${day}_part_${part}`;

  // 1. Leitura direta do Firestore (permissão pública em homologated_lessons)
  try {
    const snap = await getDoc(doc(db, "homologated_lessons", docId));
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.content === "string" && data.content.trim().length >= 20) {
        return {
          id: docId,
          day,
          part,
          subject: (data.subject as string) || "Trilha Jurídica",
          topic: data.topic as string | undefined,
          content: data.content,
        };
      }
    }
  } catch {
    // Falha silenciosa e fallback para seeds estáticos
  }

  // 2. Fallback para homologatedSeeds.json
  const seedsPath = path.resolve(process.cwd(), "src/data/homologatedSeeds.json");
  if (fs.existsSync(seedsPath)) {
    try {
      const seeds = JSON.parse(fs.readFileSync(seedsPath, "utf-8")) as Record<string, LoadedLesson>;
      const seed = seeds[docId];
      if (seed && typeof seed.content === "string" && seed.content.trim().length >= 20) {
        return {
          id: docId,
          day,
          part,
          subject: seed.subject || "Trilha Jurídica",
          topic: seed.topic,
          content: seed.content,
        };
      }
    } catch {
      // Ignora erro de parse de seeds
    }
  }

  return null;
}

interface DiscoveredSection {
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

async function discoverSections(args: CliArgs): Promise<DiscoveredSection[]> {
  const sections: DiscoveredSection[] = [];
  const trilhaDay = TRILHA_JURIDICA_DATA.find((d) => d.dia === args.day);
  const totalMaterials = trilhaDay?.materias?.length || 5;

  const candidateParts = args.parts && args.parts.length > 0
    ? args.parts
    : Array.from({ length: totalMaterials }, (_, i) => i);

  for (const part of candidateParts) {
    const lesson = await loadLesson(args.day, part);
    if (!lesson) continue;

    // Procura todos os blocos existentes no conteúdo da aula
    const markers = [...lesson.content.matchAll(/\[BLOCK_(\d+)\]/g)].map((m) => Number(m[1]));
    const candidateBlocks = args.blocks && args.blocks.length > 0
      ? args.blocks
      : markers.map((num) => num - 1);

    for (const blockIndex of candidateBlocks) {
      const blockNumber = blockIndex + 1;
      const slice = extractCatalogBlock(lesson.content, blockIndex);
      if (!slice || slice.trim().length < 20) continue;

      const sectionId = sectionReviewKey(args.day, part, blockIndex);
      const sha256 = crypto.createHash("sha256").update(slice).digest("hex");
      const blockLabel = STAGE_LABELS[blockIndex] || `Parte ${blockNumber}`;

      sections.push({
        day: args.day,
        part,
        blockIndex,
        blockNumber,
        blockLabel,
        subject: lesson.subject,
        topic: lesson.topic || lesson.subject,
        lessonDocId: lesson.id,
        sectionId,
        content: slice,
        contentChars: slice.length,
        contentSha256: sha256,
      });

      if (args.limit && sections.length >= args.limit) {
        return sections;
      }
    }
  }

  return sections;
}

async function main() {
  const args = parseArgs();
  const git = getGitContext();
  const startedAtIso = new Date().toISOString();
  const overallStart = Date.now();

  console.log(`\n========================================================================`);
  console.log(`ATHENA — Auditoria Jurídica em Escala (Modo Estritamente Read-Only)`);
  console.log(`Commit: ${git.commitShaShort} (${git.commitSha}) | Branch: ${git.branch}`);
  console.log(`Configuração: Dia ${args.day} | Parts: ${args.parts?.join(",") || "todas"} | Blocos: ${args.blocks?.join(",") || "todos"} | Limite: ${args.limit || "sem limite"}`);
  console.log(`Modo: ${args.dryRun ? "DRY-RUN (somente enumeração e recorte)" : "EXECUÇÃO REAL DA OPENAI (Revisor Completo)"}`);
  console.log(`========================================================================\n`);

  console.log(`[Batch] Descobrindo e fatiando seções no catálogo...`);
  const sections = await discoverSections(args);
  console.log(`[Batch] ${sections.length} seções válidas identificadas.\n`);

  if (sections.length === 0) {
    console.warn(`[Batch] Nenhuma seção encontrada para os parâmetros informados.`);
    process.exit(0);
  }

  // --- MODO EXPERIMENTAL V2.3.2-A ---
  if (args.experimentalV232A) {
    console.log(`[EXPERIMENTAL V2.3.2-A] Modo experimental ativo.`);
    if (args.maxRealCalls !== 1) {
      throw new Error("[GUARD VIOLATION] No modo experimental V2.3.2-A, --max-real-calls 1 é estritamente obrigatório.");
    }
    if (sections.length !== 1) {
      throw new Error(`[GUARD VIOLATION] No modo experimental V2.3.2-A, foram selecionados ${sections.length} blocos. Exatamente 1 bloco é permitido.`);
    }

    const target = sections[0];
    verifyIdentityGuard(target);

    const allowedDomains = searchDomainsForLesson(target.content);
    const requestedModel = reviewModelName();

    if (args.dryRun) {
      console.log(`--- RELATÓRIO DO DRY-RUN (Zero chamadas de rede / Zero persistência) ---`);
      console.log(`SELECTED_BLOCKS = ${sections.length}`);
      console.log(`lessonId: ${target.sectionId}`);
      console.log(`day: ${target.day} | part: ${target.part} | blockNumber: ${target.blockNumber} (${target.blockLabel})`);
      console.log(`chars: ${target.contentChars}`);
      console.log(`hash (SHA-256): ${target.contentSha256}`);
      console.log(`runtime experimental: V2.3.2-A (Main 360s, Total 540s, maxAttempts 1)`);
      console.log(`modelo: ${requestedModel}`);
      console.log(`reasoning: medium`);
      console.log(`web search: habilitada (required, search_context_size=high, external_web_access=true)`);
      console.log(`max output: 16000`);
      console.log(`allowed domains: ${allowedDomains.join(", ")}`);
      console.log(`Dry-run concluído com sucesso. Nenhuma chamada à OpenAI foi disparada e nenhum dado foi alterado.\n`);
      process.exit(0);
    }

    // Execução real experimental
    console.log(`------------------------------------------------------------------------`);
    console.log(`[EXPERIMENTAL V2.3.2-A] Executando auditoria real única sobre ${target.sectionId}...`);
    console.log(`Identificador: ${target.sectionId} | Tamanho: ${target.contentChars} chars`);
    console.log(`SHA-256: ${target.contentSha256}`);
    console.log(`Modelo: ${requestedModel} | Reasoning: medium | MaxOutput: 16000 | Context: high`);
    console.log(`Allowed domains: ${allowedDomains.join(", ")}`);

    const expResult = await runAuditExperimentalV232A(target);
    const overallElapsedMs = expResult.timings.totalElapsedMs;

    const finalReport = {
      reportMetadata: {
        executedAt: startedAtIso,
        commitSha: git.commitSha,
        commitShaShort: git.commitShaShort,
        branch: git.branch,
        day: args.day,
        partsFilter: args.parts || "all",
        blocksFilter: args.blocks || "all",
        limitFilter: args.limit || null,
        totalRequested: sections.length,
        totalExecuted: 1,
        totalSuccess: expResult.executionStatus === "success" ? 1 : 0,
        totalFailed: expResult.executionStatus === "failed" ? 1 : 0,
        totalElapsedMs: overallElapsedMs,
        experiment: {
          name: EXPERIMENTAL_CONFIG.name,
          productionCodeChanged: false,
          promptChanged: false,
          validatorChanged: false,
          searchContextChanged: false,
          reasoningChanged: false,
          maxOutputTokensChanged: false,
          onlyRuntimeChanged: true,
          mainTimeoutMs: EXPERIMENTAL_CONFIG.MAIN_ATTEMPT_TIMEOUT_MS,
          totalBudgetMs: EXPERIMENTAL_CONFIG.TOTAL_AUDIT_BUDGET_MS,
          maxMainAttempts: EXPERIMENTAL_CONFIG.MAX_MAIN_ATTEMPTS,
        },
      },
      results: [
        {
          identification: {
            day: target.day,
            subject: target.subject,
            partIndex: target.part,
            blockIndex: target.blockIndex,
            blockNumber: target.blockNumber,
            blockLabel: target.blockLabel,
            lessonDocId: target.lessonDocId,
            sectionId: target.sectionId,
          },
          content: {
            chars: target.contentChars,
            sha256: target.contentSha256,
            preview: target.content.slice(0, 140).replace(/\r?\n/g, " "),
          },
          execution: {
            status: expResult.executionStatus,
            requestedModel,
            servedModel: expResult.audit?.model || null,
            reasoningEffort: "medium",
            maxOutputTokens: 16000,
            searchContextSize: "high",
            toolChoice: "required",
            allowedDomains,
            requests: expResult.requests,
            timings: expResult.timings,
            tokens: expResult.tokens,
            error: expResult.error,
          },
          stages: expResult.stages,
          verdict: expResult.audit
            ? {
                outcome: expResult.audit.outcome,
                verificationLevel: expResult.audit.verificationLevel,
                confidence: expResult.audit.confidence,
                summary: expResult.audit.summary,
              }
            : null,
          changes: expResult.audit
            ? {
                total: expResult.changesProposed.length,
                confirmedCount: expResult.finalCounts.finalAcceptedPatchCount,
                unconfirmedCount: expResult.finalCounts.finalRejectedPatchCount,
                proposed: expResult.changesProposed,
                confirmed: expResult.changesProposed.filter((c) => c.confirmation === "CONFIRMADO").map((c) => c.id),
                unconfirmed: expResult.changesProposed.filter((c) => c.confirmation === "NAO_CONFIRMADO").map((c) => c.id),
              }
            : null,
          finalCounts: expResult.finalCounts,
          unverifiedClaims: expResult.unverifiedClaims,
          rejectedPatches: expResult.rejectedPatches,
          consultedSources: expResult.consultedSources,
        },
      ],
    };

    fs.mkdirSync(path.dirname(args.outPath), { recursive: true });
    fs.writeFileSync(args.outPath, JSON.stringify(finalReport, null, 2), "utf8");

    console.log(`\n========================================================================`);
    console.log(`RELATÓRIO EXPERIMENTAL V2.3.2-A GERADO COM SUCESSO:`);
    console.log(`Caminho: ${args.outPath}`);
    console.log(`Status de execução: ${expResult.executionStatus}`);
    console.log(`Total model requests: ${expResult.requests.totalOpenAIRequests} (Main: ${expResult.requests.mainRequests}, Cov: ${expResult.requests.coverageRequests}, Rep: ${expResult.requests.repairRequests})`);
    console.log(`Tempo total: ${(overallElapsedMs / 1000).toFixed(1)} segundos`);
    console.log(`========================================================================\n`);
    process.exit(0);
  }

  // --- DRY RUN ---
  if (args.dryRun) {
    console.log(`--- RELATÓRIO DO DRY-RUN (Zero chamadas de rede / Zero persistência) ---`);
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const preview = s.content.slice(0, 100).replace(/\r?\n/g, " ");
      console.log(`[${i + 1}/${sections.length}] ${s.subject} (${s.blockLabel})`);
      console.log(`  - lessonDocId: ${s.lessonDocId}`);
      console.log(`  - sectionId:   ${s.sectionId}`);
      console.log(`  - blockNumber: ${s.blockNumber} (índice ${s.blockIndex})`);
      console.log(`  - caracteres:  ${s.contentChars} chars | hash: ${s.contentSha256.slice(0, 12)}...`);
      console.log(`  - início:      "${preview}..."\n`);
    }
    console.log(`Dry-run concluído com sucesso. Nenhuma chamada à OpenAI foi disparada e nenhum dado foi alterado.\n`);
    process.exit(0);
  }

  // --- EXECUÇÃO REAL ---
  const results: any[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const sectionIndexNum = i + 1;
    console.log(`------------------------------------------------------------------------`);
    console.log(`[${sectionIndexNum}/${sections.length}] Auditando: ${s.subject} — Bloco ${s.blockNumber} (${s.blockLabel})`);
    console.log(`Identificador: ${s.sectionId} | Tamanho: ${s.contentChars} chars`);
    console.log(`Início da chamada ao Revisor Jurídico oficial (gpt-5.6 + Web Search)...`);

    let retryReason: string | null = null;
    let followUpSkipReason: string | null = null;
    let validationLogFromTrace: any = null;
    let mainCallElapsedMs = 0;
    let validationElapsedMs = 0;
    let followUpElapsedMs: number | null = null;

    const trace = createLegalReviewTrace({
      testMode: false,
      requestedModel: reviewModelName(),
      write: (line) => {
        try {
          const entry = JSON.parse(line);
          if (entry.message === "LEGAL_REVIEW_RETRY" && entry.retryReason) {
            retryReason = entry.retryReason;
          }
          if (entry.message === "LEGAL_REVIEW_VALIDATION_END" && entry.validation) {
            validationLogFromTrace = entry.validation;
            if (typeof entry.validation.mainCallElapsedMs === "number") {
              mainCallElapsedMs = entry.validation.mainCallElapsedMs;
            }
            if (typeof entry.validation.validationElapsedMs === "number") {
              validationElapsedMs = entry.validation.validationElapsedMs;
            }
            if (entry.validation.followUpSkipReason) {
              followUpSkipReason = entry.validation.followUpSkipReason;
            }
          }
          if (entry.message === "LEGAL_REVIEW_OPENAI_END" && retryReason && typeof entry.stageMs === "number") {
            followUpElapsedMs = entry.stageMs;
          }
        } catch {
          // ignora linhas não JSON
        }
      },
    });

    const itemStart = Date.now();
    try {
      const audit = await auditLessonWithOpenAI({
        reviewDate: formatReviewDate(new Date()),
        lessonId: s.sectionId,
        day: s.day,
        part: s.part,
        subject: s.subject,
        topic: s.topic,
        content: s.content,
        sectionIndex: s.blockIndex,
        trace,
      });

      const totalItemMs = Date.now() - itemStart;
      successCount++;

      const confirmedChanges = audit.changes.filter((c) => c.confirmation === "CONFIRMADO");
      const unconfirmedChanges = audit.changes.filter((c) => c.confirmation === "NAO_CONFIRMADO");

      console.log(`=> Concluído em ${(totalItemMs / 1000).toFixed(1)}s`);
      console.log(`   Status: ${audit.outcome} | Nível: ${audit.verificationLevel}`);
      console.log(`   Alterações: ${audit.changes.length} total (${confirmedChanges.length} confirmadas, ${unconfirmedChanges.length} não confirmadas)`);
      console.log(`   Unverified Claims: ${audit.unverifiedClaims.length}`);
      console.log(`   Follow-up: ${retryReason ? `SIM (motivo: ${retryReason})` : `NÃO (skip: ${followUpSkipReason || "não elegível"})`}`);

      results.push({
        identification: {
          day: s.day,
          subject: s.subject,
          partIndex: s.part,
          blockIndex: s.blockIndex,
          blockNumber: s.blockNumber,
          blockLabel: s.blockLabel,
          lessonDocId: s.lessonDocId,
          sectionId: s.sectionId,
        },
        content: {
          chars: s.contentChars,
          sha256: s.contentSha256,
          preview: s.content.slice(0, 140).replace(/\r?\n/g, " "),
        },
        execution: {
          status: "success",
          requestedModel: reviewModelName(),
          servedModel: audit.model || null,
          followUpExecuted: Boolean(retryReason),
          followUpReason: retryReason,
          followUpSkipReason: retryReason ? null : followUpSkipReason,
          timings: {
            mainCallElapsedMs: mainCallElapsedMs || null,
            validationElapsedMs: validationElapsedMs || null,
            followUpElapsedMs: followUpElapsedMs || null,
            totalElapsedMs: totalItemMs,
          },
          usage: audit.usage
            ? {
              inputTokens: audit.usage.inputTokens,
              outputTokens: audit.usage.outputTokens,
              totalTokens: audit.usage.totalTokens,
            }
            : null,
          error: null,
        },
        verdict: {
          outcome: audit.outcome,
          verificationLevel: audit.verificationLevel,
          confidence: audit.confidence,
          summary: audit.summary,
        },
        changes: {
          total: audit.changes.length,
          confirmedCount: confirmedChanges.length,
          unconfirmedCount: unconfirmedChanges.length,
          proposed: audit.changes.map((c) => ({
            id: c.id,
            type: c.type,
            originalExcerpt: c.originalExcerpt,
            revisedExcerpt: c.revisedExcerpt,
            reason: c.reason,
            confirmation: c.confirmation,
            verified: c.verified,
            evidence: (c.evidence || []).map((ev) => ({
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
          })),
          confirmed: confirmedChanges.map((c) => c.id),
          unconfirmed: unconfirmedChanges.map((c) => c.id),
        },
        unverifiedClaims: audit.unverifiedClaims,
        rejectedPatches: validationLogFromTrace?.rejectedPatches || [],
        consultedSources: audit.consultedSources.map((cs) => {
          const hostMatch = matchOfficialHost(cs.url);
          return {
            sourceId: (cs as any).sourceId,
            url: cs.url,
            institution: cs.institution,
            family: hostMatch?.family || "OUTRA",
            host: hostMatch?.hosts?.[0] || cs.institution,
            official: cs.official,
            sourceType: (cs as any).sourceType,
          };
        }),
        coverageSummary: audit.coverageSummary || null,
        auditedUnits: audit.auditedUnits || [],
        propositions: {
          total: audit.propositionCount || 0,
          highRiskTotal: audit.highRiskPropositionCount || 0,
          auditedCorrect: audit.auditedCorrectCount || 0,
          auditedIncorrect: audit.auditedIncorrectCount || 0,
          indeterminate: audit.indeterminateCount || 0,
          notAudited: audit.notAuditedCount || 0,
          complete: audit.coverageSummary?.complete || false,
        },
        calls: {
          mainCallCount: audit.mainCallCount || 1,
          coverageCallCount: audit.coverageCallCount || 0,
          repairCallCount: audit.repairCallCount || 0,
          totalModelCalls: audit.totalModelCalls || 1,
          coverageExecuted: audit.coverageExecuted || false,
          coverageSkipReason: audit.coverageSkipReason || null,
        },
        rawAudit: audit,
      });
    } catch (error) {
      failureCount++;
      const totalItemMs = Date.now() - itemStart;
      const errObj = error instanceof Error
        ? { name: error.name, message: error.message, status: (error as any).status || null }
        : { name: "UnknownError", message: String(error) };

      console.error(`=> FALHA na seção ${s.sectionId} em ${(totalItemMs / 1000).toFixed(1)}s:`, errObj.message);

      const diagnostic = (error as any)?.diagnostic || null;
      if (diagnostic) {
        console.error(`   Diagnóstico: Rejeição=${diagnostic.rejectionReason} | Status=${diagnostic.responseStatus || "desconhecido"} | OutputChars=${diagnostic.outputTextLength ?? "N/A"}`);
        if (diagnostic.incompleteDetails?.reason) {
          console.error(`   Incomplete Reason: ${diagnostic.incompleteDetails.reason}`);
        }
        if (diagnostic.validationReasonCodes && diagnostic.validationReasonCodes.length > 0) {
          console.error(`   Validation Reasons: ${diagnostic.validationReasonCodes.join(", ")}`);
        }
        if (diagnostic.parseError) {
          console.error(`   Parse Error: ${diagnostic.parseError}`);
        }
        persistDiagnosticFiles(diagnostic, diagnostic.rawOutputText);
      }

      results.push({
        identification: {
          day: s.day,
          subject: s.subject,
          partIndex: s.part,
          blockIndex: s.blockIndex,
          blockNumber: s.blockNumber,
          blockLabel: s.blockLabel,
          lessonDocId: s.lessonDocId,
          sectionId: s.sectionId,
        },
        content: {
          chars: s.contentChars,
          sha256: s.contentSha256,
          preview: s.content.slice(0, 140).replace(/\r?\n/g, " "),
        },
        execution: {
          status: "failed",
          requestedModel: reviewModelName(),
          servedModel: diagnostic?.responseModel || null,
          followUpExecuted: Boolean(retryReason),
          followUpReason: retryReason,
          followUpSkipReason: null,
          timings: {
            mainCallElapsedMs: diagnostic?.elapsedMs || mainCallElapsedMs || null,
            validationElapsedMs: validationElapsedMs || null,
            followUpElapsedMs: followUpElapsedMs || null,
            totalElapsedMs: totalItemMs,
          },
          usage: diagnostic?.usage || null,
          error: errObj,
          diagnostic: diagnostic ? {
            rejectionReason: diagnostic.rejectionReason,
            rejectionDetail: diagnostic.rejectionDetail,
            responseId: diagnostic.responseId,
            responseStatus: diagnostic.responseStatus,
            responseModel: diagnostic.responseModel,
            incompleteDetails: diagnostic.incompleteDetails,
            outputTextLength: diagnostic.outputTextLength,
            outputItemCount: diagnostic.outputItemCount,
            outputItemTypes: diagnostic.outputItemTypes,
            webSearchCallCount: diagnostic.webSearchCallCount,
            validationReasonCodes: diagnostic.validationReasonCodes,
            validationLog: diagnostic.validationLog,
            parseError: diagnostic.parseError,
            elapsedMs: diagnostic.elapsedMs,
            configuredTimeoutMs: diagnostic.configuredTimeoutMs,
            configuredBudgetMs: diagnostic.configuredBudgetMs,
            rawOutputSample: diagnostic.rawOutputSample,
          } : null,
        },
        verdict: null,
        changes: null,
        unverifiedClaims: [],
        rejectedPatches: validationLogFromTrace?.rejectedPatches || [],
        consultedSources: [],
      });
    }

    // Intervalo de cortesia de 2 segundos entre chamadas para evitar rate limit de RPM
    if (i < sections.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const overallElapsedMs = Date.now() - overallStart;

  const finalReport = {
    reportMetadata: {
      executedAt: startedAtIso,
      commitSha: git.commitSha,
      commitShaShort: git.commitShaShort,
      branch: git.branch,
      day: args.day,
      partsFilter: args.parts || "all",
      blocksFilter: args.blocks || "all",
      limitFilter: args.limit || null,
      totalRequested: sections.length,
      totalExecuted: results.length,
      totalSuccess: successCount,
      totalFailed: failureCount,
      totalElapsedMs: overallElapsedMs,
    },
    results,
  };

  // Grava o arquivo de saída apenas em tmp/
  fs.mkdirSync(path.dirname(args.outPath), { recursive: true });
  fs.writeFileSync(args.outPath, JSON.stringify(finalReport, null, 2), "utf8");

  console.log(`\n========================================================================`);
  console.log(`RELATÓRIO FINAL GERADO COM SUCESSO:`);
  console.log(`Caminho: ${args.outPath}`);
  console.log(`Total executado: ${results.length} | Sucessos: ${successCount} | Falhas: ${failureCount}`);
  console.log(`Tempo total: ${(overallElapsedMs / 1000).toFixed(1)} segundos`);
  console.log(`========================================================================\n`);
}

main().catch((err) => {
  console.error("Erro fatal no harness de auditoria batch:", err);
  process.exit(1);
});
