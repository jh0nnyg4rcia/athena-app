/**
 * Avaliador Jurídico Adversarial Independente — Laboratório de Qualidade ATHENA.
 *
 * Avalia criticamente a qualidade das revisões produzidas pelo Revisor Jurídico
 * do Athena (detecção de falsos positivos, sobrecorreções, fontes inadequadas,
 * perda de nuance e falsos negativos residuais).
 *
 * Execução totalmente independente e read-only.
 *
 * Uso:
 *   npx tsx scripts/evaluate-legal-review-adversarial.ts --input tmp/audit-legal-review-day-1.json --limit 3 --dry-run
 *   npx tsx scripts/evaluate-legal-review-adversarial.ts --input tmp/audit-legal-review-day-1.json --output tmp/evaluate-legal-review-day-1.json --limit 3
 */

import OpenAI from "openai";
import firebaseConfig from "../firebase-applet-config.json";
import { extractCatalogBlock } from "../src/lib/catalogBlock";
import { searchDomainsForLesson } from "../src/lib/legalReviewSources";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";

// Resolução de credenciais read-only para ambiente de desenvolvimento
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
    // Secret indisponível via gcloud; o erro será emitido na instanciação
  }
}

// ----------------------------------------------------------------------------
// SCHEMAS ESTRUTURADOS (Strict JSON Schema para Responses API)
// ----------------------------------------------------------------------------

export const EVALUATE_PATCH_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "changeId",
    "subject",
    "sectionId",
    "classification",
    "severity",
    "originalAssessment",
    "revisionAssessment",
    "reasonAssessment",
    "evidenceAssessment",
    "typeAssessment",
    "examRisk",
    "independentSources",
    "finalExplanation",
  ],
  properties: {
    changeId: { type: "string" },
    subject: { type: "string" },
    sectionId: { type: "string" },
    classification: {
      type: "string",
      enum: [
        "TRUE_POSITIVE",
        "USEFUL_PRECISION",
        "UNNECESSARY_CHANGE",
        "FALSE_POSITIVE",
        "INCORRECT_REVISION",
        "OVERCORRECTION",
        "UNSUPPORTED_REVISION",
        "OUTDATED_REVISION",
        "INDETERMINATE",
      ],
    },
    severity: {
      type: "string",
      enum: ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
    },
    originalAssessment: {
      type: "object",
      additionalProperties: false,
      required: ["legallyCorrect", "outdated", "materialProblem", "explanation"],
      properties: {
        legallyCorrect: { type: "boolean" },
        outdated: { type: "boolean" },
        materialProblem: { type: "string" },
        explanation: { type: "string" },
      },
    },
    revisionAssessment: {
      type: "object",
      additionalProperties: false,
      required: [
        "legallyCorrect",
        "necessary",
        "proportionate",
        "preservesNuance",
        "introducesUnsupportedClaim",
        "explanation",
      ],
      properties: {
        legallyCorrect: { type: "boolean" },
        necessary: { type: "boolean" },
        proportionate: { type: "boolean" },
        preservesNuance: { type: "boolean" },
        introducesUnsupportedClaim: { type: "boolean" },
        explanation: { type: "string" },
      },
    },
    reasonAssessment: {
      type: "object",
      additionalProperties: false,
      required: ["accurate", "explanation"],
      properties: {
        accurate: { type: "boolean" },
        explanation: { type: "string" },
      },
    },
    evidenceAssessment: {
      type: "object",
      additionalProperties: false,
      required: ["sufficient", "primarySourcesUsed", "sourcesActuallySupportRevision", "problems"],
      properties: {
        sufficient: { type: "boolean" },
        primarySourcesUsed: { type: "boolean" },
        sourcesActuallySupportRevision: { type: "boolean" },
        problems: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    typeAssessment: {
      type: "object",
      additionalProperties: false,
      required: ["declaredType", "appropriate", "suggestedType"],
      properties: {
        declaredType: { type: "string" },
        appropriate: { type: "boolean" },
        suggestedType: {
          type: ["string", "null"],
          enum: ["CORRECAO", "PRECISAO", "ATUALIZACAO", "ACRESCIMO", null],
        },
      },
    },
    examRisk: {
      type: "object",
      additionalProperties: false,
      required: ["level", "explanation"],
      properties: {
        level: {
          type: "string",
          enum: ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
        },
        explanation: { type: "string" },
      },
    },
    independentSources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["institution", "title", "url", "supportsVerdict", "explanation"],
        properties: {
          institution: { type: "string" },
          title: { type: "string" },
          url: { type: "string" },
          supportsVerdict: { type: "boolean" },
          explanation: { type: "string" },
        },
      },
    },
    finalExplanation: { type: "string" },
  },
} as const;

export const EVALUATE_FALSE_NEGATIVES_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sectionId", "subject", "candidates", "analysisSummary"],
  properties: {
    sectionId: { type: "string" },
    subject: { type: "string" },
    analysisSummary: { type: "string" },
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "subject",
          "sectionId",
          "excerpt",
          "classification",
          "severity",
          "problem",
          "suggestedCorrection",
          "officialSources",
          "confidence",
        ],
        properties: {
          subject: { type: "string" },
          sectionId: { type: "string" },
          excerpt: { type: "string" },
          classification: {
            type: "string",
            enum: ["FALSE_NEGATIVE_CANDIDATE"],
          },
          severity: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          },
          problem: { type: "string" },
          suggestedCorrection: { type: "string" },
          officialSources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["institution", "title", "url"],
              properties: {
                institution: { type: "string" },
                title: { type: "string" },
                url: { type: "string" },
              },
            },
          },
          confidence: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH"],
          },
        },
      },
    },
  },
} as const;

// ----------------------------------------------------------------------------
// INTERFACES INTERNAS
// ----------------------------------------------------------------------------

interface CliArgs {
  inputPath: string;
  outputPath: string;
  limit?: number;
  dryRun: boolean;
}

interface PatchToEvaluate {
  sectionId: string;
  subject: string;
  blockNumber: number;
  lessonDocId: string;
  blockIndex: number;
  contentChars: number;
  contentSha256: string;
  patch: {
    id: string;
    type: string;
    originalExcerpt: string;
    revisedExcerpt: string;
    reason: string;
    confirmation: string;
    verified: boolean;
    evidence: Array<{
      institution: string;
      family: string;
      title: string;
      url: string;
      sourceType: string;
      official: boolean;
      consulted: boolean;
      supportsChange: boolean;
      supportExplanation: string;
    }>;
  };
  sectionVerdict: {
    outcome: string;
    verificationLevel: string;
    confidence: string;
  };
}

// ----------------------------------------------------------------------------
// PARSER DE CLI
// ----------------------------------------------------------------------------

function parseCliArgs(): CliArgs {
  const argv = process.argv.slice(2);
  let inputPath = "";
  let outputPath = "";
  let limit: number | undefined;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--input" && argv[i + 1]) {
      inputPath = argv[++i];
    } else if (arg === "--output" && argv[i + 1]) {
      outputPath = argv[++i];
    } else if (arg === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i]);
    }
  }

  if (!inputPath) {
    inputPath = path.resolve(process.cwd(), "tmp/audit-legal-review-day-1.json");
  } else {
    inputPath = path.resolve(process.cwd(), inputPath);
  }

  if (!outputPath) {
    outputPath = path.resolve(process.cwd(), "tmp/evaluate-legal-review-day-1.json");
  } else {
    outputPath = path.resolve(process.cwd(), outputPath);
  }

  return { inputPath, outputPath, limit, dryRun };
}

// ----------------------------------------------------------------------------
// CARREGAMENTO DE CONTEÚDO ORIGINAL DA SEÇÃO (para Falso Negativo / Contexto)
// ----------------------------------------------------------------------------

function loadOriginalSectionContent(lessonDocId: string, blockIndex: number): string | null {
  const seedsPath = path.resolve(process.cwd(), "src/data/homologatedSeeds.json");
  if (!fs.existsSync(seedsPath)) return null;
  try {
    const seeds = JSON.parse(fs.readFileSync(seedsPath, "utf-8")) as Record<string, { content?: string }>;
    const seed = seeds[lessonDocId];
    if (seed?.content) {
      return extractCatalogBlock(seed.content, blockIndex);
    }
  } catch {
    // ignora falha de leitura
  }
  return null;
}

// ----------------------------------------------------------------------------
// PROMPTS DO AVALIADOR ADVERSARIAL
// ----------------------------------------------------------------------------

function buildPatchEvaluatorInstructions(): string {
  return [
    "Você é um Avaliador Jurídico Adversarial de Alto Nível para materiais preparatórios de concursos públicos de carreiras jurídicas de elite (Magistratura, Ministério Público, Defensoria Pública e Delegado de Polícia).",
    "Você está avaliando uma revisão jurídica produzida por outro sistema.",
    "Não presuma que a revisão esteja correta nem incorreta.",
    "Seu objetivo é tentar refutá-la.",
    "A aprovação somente deve ocorrer quando a alteração sobreviver à tentativa de refutação mediante confronto com fontes oficiais primárias.",
    "Não recompense alterações apenas porque parecem mais completas, técnicas ou sofisticadas. Uma alteração desnecessária em conteúdo já correto deve ser identificada.",
    "Mais texto não significa maior qualidade.",
    "",
    "PESQUISA E FONTES:",
    "Você DEVE utilizar Web Search para confrontar ativamente as afirmações do original e da revisão com as fontes oficiais vigentes no Brasil.",
    "Priorize fontes oficiais e primárias:",
    "- Constituição e legislação federal (planalto.gov.br, camara.leg.br, senado.leg.br);",
    "- Supremo Tribunal Federal (stf.jus.br) — acórdãos, súmulas vinculantes, teses de repercussão geral;",
    "- Superior Tribunal de Justiça (stj.jus.br) — recursos repetitivos, súmulas, jurisprudência em teses;",
    "- Conselho Nacional de Justiça (cnj.jus.br), Conselho Nacional do Ministério Público (cnmp.mp.br) e demais órgãos oficiais reguladores;",
    "- Legislação estadual oficial quando aplicável.",
    "NÃO use blogs, cursinhos, Jusbrasil, Wikipédia, resumos informais ou páginas comerciais como fundamento final de aprovação.",
    "Fontes secundárias podem servir apenas para localizar a fonte primária oficial, mas jamais para fundamentar seu veredito final.",
    "",
    "CRITÉRIOS DE VERIFICAÇÃO DAS FONTES ALEGADAS:",
    "Não reutilize mecanicamente as evidências alegadas pelo revisor como se fossem verdadeiras.",
    "Verifique ativamente se cada fonte indicada:",
    "1. Existe de fato;",
    "2. É oficial;",
    "3. Corresponde ao tribunal ou órgão alegado;",
    "4. Trata especificamente do ponto jurídico em exame;",
    "5. Sustenta com precisão a alteração proposta;",
    "6. Não foi descontextualizada ou distorcida.",
    "",
    "QUESTÕES OBRIGATÓRIAS A RESPONDER NA AVALIAÇÃO:",
    "1. O trecho original contém erro jurídico material?",
    "2. O trecho original está desatualizado?",
    "3. A alteração era estritamente necessária?",
    "4. O revisedExcerpt está juridicamente correto?",
    "5. O revisedExcerpt preserva a precisão e a nuance do original?",
    "6. O revisedExcerpt introduziu alguma afirmação nova não sustentada por fontes?",
    "7. O revisedExcerpt removeu alguma ressalva juridicamente relevante?",
    "8. A razão (reason) apresentada pelo Revisor corresponde ao problema real?",
    "9. As fontes indicadas sustentam especificamente a alteração?",
    "10. A alteração é proporcional ou reescreve além do necessário?",
    "11. O tipo atribuído (CORRECAO, PRECISAO, ATUALIZACAO, ACRESCIMO) é adequado?",
    "12. Há risco relevante para candidato de concurso de carreira jurídica?",
    "",
    "CLASSIFICAÇÃO OBRIGATÓRIA (EXATAMENTE UMA):",
    "- TRUE_POSITIVE: O original possuía problema jurídico real e a alteração o corrigiu adequadamente com base em fonte oficial.",
    "- USEFUL_PRECISION: O original não estava propriamente errado, mas a alteração acrescenta precisão jurídica relevante e adequada para prova de concurso.",
    "- UNNECESSARY_CHANGE: O original estava correto e suficiente; a mudança é mero preciosismo ou reescrita estilística sem valor jurídico material.",
    "- FALSE_POSITIVE: O Revisor tratou conteúdo original juridicamente correto como erro ou como necessitando de correção.",
    "- INCORRECT_REVISION: A alteração proposta introduz erro, distorção doutrinária/jurisprudencial ou conclusão juridicamente incorreta.",
    "- OVERCORRECTION: Existia algo pontual a melhorar, mas a alteração foi além do necessário, eliminou nuance válida ou ampliou indevidamente a proposição.",
    "- UNSUPPORTED_REVISION: A alteração pode ser plausível, mas as fontes verificadas não sustentam com rigor a proposição feita.",
    "- OUTDATED_REVISION: A alteração utiliza norma ou entendimento jurisprudencial já superado, ou desconsidera atualização normativa superveniente.",
    "- INDETERMINATE: Não há evidência suficiente nas fontes oficiais para chegar a uma conclusão segura.",
    "",
    "SEVERIDADE OBRIGATÓRIA:",
    "- NONE: Alteração classificada como TRUE_POSITIVE perfeitamente adequada, sem qualquer risco.",
    "- LOW: Mudança desnecessária, predominantemente editorial, ou imprecisão de baixíssimo impacto.",
    "- MEDIUM: Precisão discutível, sobrecorreção ou excesso que pode confundir o estudo para concurso.",
    "- HIGH: Erro jurídico material, jurisprudência mal representada ou fonte que não sustenta proposição relevante.",
    "- CRITICAL: Alteração que ensina ao aluno regra jurídica substancialmente errada ou contrária a texto de lei / jurisprudência vinculante vigente.",
    "",
    "Responda estritamente no formato JSON definido pelo schema.",
  ].join("\n");
}

function buildFalseNegativeInstructions(): string {
  return [
    "Você é um Auditor Jurídico Adversarial especializado em identificar ERROS GRAVES NÃO CORRIGIDOS (Falsos Negativos) em material preparatório de concursos jurídicos.",
    "Seu objetivo é analisar o conteúdo ORIGINAL de um bloco da aula e identificar problemas jurídicos graves e relevantes que NÃO tenham sido objeto de nenhum dos patches já propostos.",
    "",
    "O QUE BUSCAR (FALSOS NEGATIVOS MATERIAIS):",
    "- Violação expressa de texto legal vigente;",
    "- Citação ou aplicação de dispositivo revogado ou expressamente alterado por lei posterior;",
    "- Jurisprudência superada (overruling de súmula vinculante, repercussão geral ou repetitivo);",
    "- Tese jurídica atribuída incorretamente a tribunal;",
    "- Generalização manifestamente incompatível com entendimento consolidado do STF ou STJ;",
    "- Omissão de exceção legal primária indispensável cuja ausência torna a assertiva incorreta em prova de concurso;",
    "- Conteúdo com risco imediato de induzir o candidato a erro fatal em prova de carreira jurídica.",
    "",
    "O QUE NÃO BUSCAR E NÃO MARCAR:",
    "- Preferências estilísticas ou de redação alternativa;",
    "- Simplificação didática aceitável;",
    "- Doutrina minoritária apenas por ser minoritária;",
    "- Omissão de detalhes periféricos que não tornem a afirmação juridicamente errada;",
    "- Trechos que já foram objeto de patches fornecidos na lista de revisões.",
    "",
    "Use Web Search para verificar normas vigentes e jurisprudência oficial.",
    "Se o conteúdo restante estiver juridicamente adequado ou se os pontos relevantes já tiverem sido contemplados pelos patches existentes, retorne a lista candidates vazia: [].",
    "Responda estritamente no formato JSON definido pelo schema.",
  ].join("\n");
}

// ----------------------------------------------------------------------------
// EXECUÇÃO DO AVALIADOR ADVERSARIAL
// ----------------------------------------------------------------------------

async function evaluateSinglePatch(
  client: OpenAI,
  item: PatchToEvaluate,
  patchIndex: number,
  totalPatches: number
): Promise<{
  verdict: any;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number } | null;
  elapsedMs: number;
}> {
  console.log(`------------------------------------------------------------------------`);
  console.log(`[Patch ${patchIndex + 1}/${totalPatches}] Avaliando: ${item.patch.id} (${item.patch.type})`);
  console.log(`Matéria: ${item.subject} | Seção: ${item.sectionId}`);
  console.log(`Início da análise adversarial independente (gpt-5.6, reasoning: high, Web Search)...`);

  // Monta entrada estritamente neutra (SEM confirmation, SEM verificationLevel, SEM supportsChange)
  const neutralInput = {
    changeId: item.patch.id,
    subject: item.subject,
    sectionId: item.sectionId,
    declaredType: item.patch.type,
    originalExcerpt: item.patch.originalExcerpt,
    revisedExcerpt: item.patch.revisedExcerpt,
    reasonPresentedByReviewer: item.patch.reason,
    allegedEvidence: item.patch.evidence.map((ev) => ({
      institution: ev.institution,
      title: ev.title,
      url: ev.url,
      sourceType: ev.sourceType,
      supportExplanation: ev.supportExplanation,
    })),
  };

  const domains = searchDomainsForLesson(
    `${item.subject} ${item.patch.originalExcerpt} ${item.patch.revisedExcerpt} ${item.patch.evidence.map((e) => e.title).join(" ")}`
  );

  const start = Date.now();
  const response = await client.responses.create(
    {
      model: "gpt-5.6",
      instructions: buildPatchEvaluatorInstructions(),
      input: JSON.stringify(neutralInput, null, 2),
      store: false,
      include: ["web_search_call.action.sources"],
      tools: [
        {
          type: "web_search",
          external_web_access: true,
          search_context_size: "high",
          user_location: {
            type: "approximate",
            country: "BR",
            timezone: "America/Sao_Paulo",
          },
          filters: { allowed_domains: domains },
        },
      ],
      tool_choice: "auto",
      reasoning: { effort: "high" },
      max_output_tokens: 16000,
      text: {
        format: {
          type: "json_schema",
          name: "avaliacao_adversarial_patch",
          strict: true,
          schema: EVALUATE_PATCH_JSON_SCHEMA,
        },
      },
    },
    { timeout: 200_000, maxRetries: 0 }
  );

  const elapsedMs = Date.now() - start;
  const rawText = (response.output_text || "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(`Falha ao converter resposta do avaliador para JSON: ${String(err)}`);
  }

  // Anexa decisão original do Athena POSTERIORMENTE (FASE 11)
  const finalVerdict = {
    ...parsed,
    athenaDecision: {
      confirmation: item.patch.confirmation,
      verificationLevel: item.sectionVerdict.verificationLevel,
      confidence: item.sectionVerdict.confidence,
      declaredType: item.patch.type,
      totalEvidenceCount: item.patch.evidence.length,
      officialEvidenceCount: item.patch.evidence.filter((e) => e.official).length,
    },
  };

  const usage = response.usage
    ? {
      inputTokens: Number(response.usage.input_tokens || 0),
      outputTokens: Number(response.usage.output_tokens || 0),
      totalTokens: Number(response.usage.total_tokens || 0),
    }
    : null;

  console.log(`=> Avaliado em ${(elapsedMs / 1000).toFixed(1)}s`);
  console.log(`   Classificação: ${finalVerdict.classification} | Severidade: ${finalVerdict.severity}`);
  console.log(`   Original correto: ${finalVerdict.originalAssessment.legallyCorrect} | Revisão correta: ${finalVerdict.revisionAssessment.legallyCorrect}`);
  console.log(`   Athena: ${item.patch.confirmation} | Avaliador: ${finalVerdict.classification}`);

  return { verdict: finalVerdict, usage, elapsedMs };
}

async function evaluateSectionFalseNegatives(
  client: OpenAI,
  sectionId: string,
  subject: string,
  originalSectionContent: string,
  alreadyReviewedPatches: Array<{ id: string; originalExcerpt: string; revisedExcerpt: string }>
): Promise<{
  candidates: any[];
  analysisSummary: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number } | null;
  elapsedMs: number;
}> {
  console.log(`\n--- [Segunda Passagem] Verificando Falsos Negativos Residuais: ${subject} (${sectionId}) ---`);
  const inputPayload = {
    sectionId,
    subject,
    originalFullContent: originalSectionContent,
    alreadyReviewedExcerpts: alreadyReviewedPatches.map((p) => ({
      id: p.id,
      originalExcerpt: p.originalExcerpt,
      revisedExcerpt: p.revisedExcerpt,
    })),
  };

  const domains = searchDomainsForLesson(`${subject} ${originalSectionContent.slice(0, 3000)}`);
  const start = Date.now();

  const response = await client.responses.create(
    {
      model: "gpt-5.6",
      instructions: buildFalseNegativeInstructions(),
      input: JSON.stringify(inputPayload, null, 2),
      store: false,
      include: ["web_search_call.action.sources"],
      tools: [
        {
          type: "web_search",
          external_web_access: true,
          search_context_size: "high",
          user_location: {
            type: "approximate",
            country: "BR",
            timezone: "America/Sao_Paulo",
          },
          filters: { allowed_domains: domains },
        },
      ],
      tool_choice: "auto",
      reasoning: { effort: "high" },
      max_output_tokens: 16000,
      text: {
        format: {
          type: "json_schema",
          name: "avaliacao_falsos_negativos",
          strict: true,
          schema: EVALUATE_FALSE_NEGATIVES_JSON_SCHEMA,
        },
      },
    },
    { timeout: 200_000, maxRetries: 0 }
  );

  const elapsedMs = Date.now() - start;
  const rawText = (response.output_text || "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(`Falha ao converter resposta de falsos negativos: ${String(err)}`);
  }

  const usage = response.usage
    ? {
      inputTokens: Number(response.usage.input_tokens || 0),
      outputTokens: Number(response.usage.output_tokens || 0),
      totalTokens: Number(response.usage.total_tokens || 0),
    }
    : null;

  const count = parsed.candidates?.length || 0;
  console.log(`=> Concluído em ${(elapsedMs / 1000).toFixed(1)}s`);
  console.log(`   Candidatos a falso negativo detectados: ${count}`);

  return {
    candidates: parsed.candidates || [],
    analysisSummary: parsed.analysisSummary || "",
    usage,
    elapsedMs,
  };
}

// ----------------------------------------------------------------------------
// MÉTRICAS CONSOLIDADAS (FASE 10)
// ----------------------------------------------------------------------------

function computeConsolidatedMetrics(patchVerdicts: any[], falseNegativeCandidatesCount: number) {
  const classifications: Record<string, number> = {
    TRUE_POSITIVE: 0,
    USEFUL_PRECISION: 0,
    UNNECESSARY_CHANGE: 0,
    FALSE_POSITIVE: 0,
    INCORRECT_REVISION: 0,
    OVERCORRECTION: 0,
    UNSUPPORTED_REVISION: 0,
    OUTDATED_REVISION: 0,
    INDETERMINATE: 0,
  };

  const severity: Record<string, number> = {
    NONE: 0,
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  for (const v of patchVerdicts) {
    if (classifications[v.classification] !== undefined) {
      classifications[v.classification]++;
    }
    if (severity[v.severity] !== undefined) {
      severity[v.severity]++;
    }
  }

  const patchesEvaluated = patchVerdicts.length;
  const useful = classifications.TRUE_POSITIVE + classifications.USEFUL_PRECISION;
  const harmful =
    classifications.FALSE_POSITIVE +
    classifications.INCORRECT_REVISION +
    classifications.OVERCORRECTION +
    classifications.OUTDATED_REVISION;

  const patchPrecision = patchesEvaluated > 0 ? Number((useful / patchesEvaluated).toFixed(4)) : null;
  const usefulChangeRate = patchesEvaluated > 0 ? Number((useful / patchesEvaluated).toFixed(4)) : null;
  const harmfulChangeRate = patchesEvaluated > 0 ? Number((harmful / patchesEvaluated).toFixed(4)) : null;

  return {
    patchesEvaluated,
    classifications,
    severity,
    falseNegativeCandidates: falseNegativeCandidatesCount,
    patchPrecision,
    usefulChangeRate,
    harmfulChangeRate,
  };
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------

async function main() {
  const args = parseCliArgs();
  const overallStart = Date.now();
  const startedAtIso = new Date().toISOString();

  console.log(`\n========================================================================`);
  console.log(`ATHENA — Avaliador Jurídico Adversarial Independente (Modo Read-Only)`);
  console.log(`Entrada: ${args.inputPath}`);
  console.log(`Saída:   ${args.outputPath}`);
  console.log(`Limite:  ${args.limit !== undefined ? `${args.limit} patches` : "sem limite"}`);
  console.log(`Modo:    ${args.dryRun ? "DRY-RUN (somente inspeção e contagem)" : "EXECUÇÃO REAL DA OPENAI (GPT-5.6 High)"}`);
  console.log(`========================================================================\n`);

  if (!fs.existsSync(args.inputPath)) {
    console.error(`Erro: Arquivo de entrada não encontrado em ${args.inputPath}`);
    process.exit(1);
  }

  const auditReport = JSON.parse(fs.readFileSync(args.inputPath, "utf-8"));
  const sections = auditReport.results || [];

  // Extrai todos os patches em uma lista plana mantendo o contexto de seção
  const allPatches: PatchToEvaluate[] = [];
  for (const s of sections) {
    if (s.changes?.proposed && Array.isArray(s.changes.proposed)) {
      for (const p of s.changes.proposed) {
        allPatches.push({
          sectionId: s.identification.sectionId,
          subject: s.identification.subject,
          blockNumber: s.identification.blockNumber,
          lessonDocId: s.identification.lessonDocId,
          blockIndex: s.identification.blockIndex,
          contentChars: s.content?.chars || 0,
          contentSha256: s.content?.sha256 || "",
          patch: p,
          sectionVerdict: {
            outcome: s.verdict?.outcome || "UNKNOWN",
            verificationLevel: s.verdict?.verificationLevel || "UNKNOWN",
            confidence: s.verdict?.confidence || "UNKNOWN",
          },
        });
      }
    }
  }

  const selectedPatches = args.limit ? allPatches.slice(0, args.limit) : allPatches;

  console.log(`[Inspeção] Relatório de entrada carregado com sucesso.`);
  console.log(`  - Total de seções no relatório: ${sections.length}`);
  console.log(`  - Total de patches disponíveis: ${allPatches.length}`);
  console.log(`  - Patches selecionados para avaliação: ${selectedPatches.length}\n`);

  // Identifica quais seções estão envolvidas nos patches selecionados
  const involvedSectionIds = Array.from(new Set(selectedPatches.map((p) => p.sectionId)));
  console.log(`[Inspeção] Seções abrangidas pelos patches selecionados (${involvedSectionIds.length}):`);
  involvedSectionIds.forEach((sid, idx) => {
    const patchCount = selectedPatches.filter((p) => p.sectionId === sid).length;
    console.log(`  ${idx + 1}. ${sid} (${patchCount} patch${patchCount > 1 ? "es" : ""})`);
  });
  console.log("");

  // --- DRY RUN ---
  if (args.dryRun) {
    console.log(`--- RELATÓRIO DO DRY-RUN (Zero chamadas de rede / Zero persistência) ---`);
    selectedPatches.forEach((item, idx) => {
      const origPreview = item.patch.originalExcerpt.slice(0, 80).replace(/\r?\n/g, " ");
      const revPreview = item.patch.revisedExcerpt.slice(0, 80).replace(/\r?\n/g, " ");
      console.log(`[${idx + 1}/${selectedPatches.length}] ${item.patch.id} (${item.patch.type})`);
      console.log(`  - Matéria:   ${item.subject}`);
      console.log(`  - Seção:     ${item.sectionId} (Bloco ${item.blockNumber})`);
      console.log(`  - Original:  "${origPreview}..."`);
      console.log(`  - Revisão:   "${revPreview}..."`);
      console.log(`  - Evidências declaradas: ${item.patch.evidence.length} fontes\n`);
    });
    console.log(`Dry-run concluído com sucesso. Nenhuma chamada à OpenAI foi disparada e nenhum arquivo foi gerado.\n`);
    process.exit(0);
  }

  // --- EXECUÇÃO REAL ---
  if (!process.env.OPENAI_API_KEY) {
    console.error("Erro: OPENAI_API_KEY ausente. Não é possível executar a avaliação real.");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const patchVerdicts: any[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Passagem 1: Avaliação individual de cada patch
  console.log(`========================================================================`);
  console.log(`PASSAGEM 1: AVALIAÇÃO ADVERSARIAL INDIVIDUAL DE CADA PATCH (${selectedPatches.length})`);
  console.log(`========================================================================\n`);

  for (let i = 0; i < selectedPatches.length; i++) {
    const item = selectedPatches[i];
    const res = await evaluateSinglePatch(client, item, i, selectedPatches.length);
    patchVerdicts.push(res.verdict);
    if (res.usage) {
      totalInputTokens += res.usage.inputTokens;
      totalOutputTokens += res.usage.outputTokens;
    }

    if (i < selectedPatches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Passagem 2: Detecção independente de falsos negativos por seção envolvida
  console.log(`\n========================================================================`);
  console.log(`PASSAGEM 2: DETECÇÃO DE FALSOS NEGATIVOS RESIDUAIS POR SEÇÃO (${involvedSectionIds.length})`);
  console.log(`========================================================================`);

  const falseNegativeResults: any[] = [];
  let totalFalseNegativeCandidates = 0;

  for (let i = 0; i < involvedSectionIds.length; i++) {
    const secId = involvedSectionIds[i];
    const sectionData = sections.find((s: any) => s.identification.sectionId === secId);
    if (!sectionData) continue;

    const patchesOfSection = (sectionData.changes?.proposed || []).map((p: any) => ({
      id: p.id,
      originalExcerpt: p.originalExcerpt,
      revisedExcerpt: p.revisedExcerpt,
    }));

    const originalContent = loadOriginalSectionContent(
      sectionData.identification.lessonDocId,
      sectionData.identification.blockIndex
    );

    if (!originalContent) {
      console.warn(`[Aviso] Não foi possível carregar o conteúdo integral da seção ${secId}. Pulando falso negativo.`);
      continue;
    }

    const fnRes = await evaluateSectionFalseNegatives(
      client,
      secId,
      sectionData.identification.subject,
      originalContent,
      patchesOfSection
    );

    falseNegativeResults.push({
      sectionId: secId,
      subject: sectionData.identification.subject,
      analysisSummary: fnRes.analysisSummary,
      candidates: fnRes.candidates,
      timings: { elapsedMs: fnRes.elapsedMs },
      usage: fnRes.usage,
    });

    totalFalseNegativeCandidates += fnRes.candidates.length;
    if (fnRes.usage) {
      totalInputTokens += fnRes.usage.inputTokens;
      totalOutputTokens += fnRes.usage.outputTokens;
    }

    if (i < involvedSectionIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const overallElapsedMs = Date.now() - overallStart;
  const metrics = computeConsolidatedMetrics(patchVerdicts, totalFalseNegativeCandidates);

  const finalEvaluationReport = {
    reportMetadata: {
      evaluatedAt: startedAtIso,
      evaluatorModel: "gpt-5.6",
      evaluatorReasoning: "high",
      evaluatorWebSearch: true,
      inputReportFile: path.basename(args.inputPath),
      totalPatchesInSource: allPatches.length,
      limitApplied: args.limit || null,
      patchesEvaluatedCount: patchVerdicts.length,
      sectionsInvolvedCount: involvedSectionIds.length,
      overallElapsedMs,
      totalTokens: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
      },
    },
    metrics,
    patchEvaluations: patchVerdicts,
    falseNegativeDetections: falseNegativeResults,
  };

  fs.mkdirSync(path.dirname(args.outputPath), { recursive: true });
  fs.writeFileSync(args.outputPath, JSON.stringify(finalEvaluationReport, null, 2), "utf-8");

  console.log(`\n========================================================================`);
  console.log(`RELATÓRIO DO AVALIADOR ADVERSARIAL GERADO COM SUCESSO:`);
  console.log(`Caminho: ${args.outputPath}`);
  console.log(`Patches avaliados: ${metrics.patchesEvaluated}`);
  console.log(`Métricas: Useful=${metrics.classifications.TRUE_POSITIVE + metrics.classifications.USEFUL_PRECISION} | Harmful=${metrics.classifications.FALSE_POSITIVE + metrics.classifications.INCORRECT_REVISION + metrics.classifications.OVERCORRECTION + metrics.classifications.OUTDATED_REVISION}`);
  console.log(`Precisão dos patches: ${metrics.patchPrecision !== null ? `${(metrics.patchPrecision * 100).toFixed(1)}%` : "N/A"}`);
  console.log(`Falsos negativos candidatos detectados: ${metrics.falseNegativeCandidates}`);
  console.log(`Tempo total: ${(overallElapsedMs / 1000).toFixed(1)}s | Tokens: ${totalInputTokens + totalOutputTokens}`);
  console.log(`========================================================================\n`);
}

main().catch((err) => {
  console.error("Erro fatal no Avaliador Jurídico Adversarial:", err);
  process.exit(1);
});
