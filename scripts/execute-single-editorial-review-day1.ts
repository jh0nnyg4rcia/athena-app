/**
 * ATHENA — EXECUÇÃO AUTORIZADA DA REVISÃO JURÍDICA EDITORIAL REAL
 * Dia 1, primeira parte (day_1_part_0)
 * TETO ORÇAMENTÁRIO AUTORIZADO: US$ 2,00
 * EXECUÇÃO: EXATAMENTE 1 CHAMADA PAGA À OPENAI (ZERO RETENTATIVAS)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import OpenAI from "openai";
import {
  buildLegalReviewInstructions,
  buildUntrustedLessonInput,
} from "../src/services/legalReviewPrompt.js";
import {
  extractPropositionUnits,
  formatPropositionsForPrompt,
} from "../src/lib/legalReviewPropositions.js";
import {
  buildReviewCreateParams,
  interpretReviewResponse,
} from "../src/services/legalReviewServer.js";
import { markersPreserved, sanitizeReviewedMarkdown } from "../src/lib/legalReviewValidate.js";

const OUTPUT_DIR = path.join(process.cwd(), "tmp", "editorial-review-day1");
const LESSON_ID = "day_1_part_0";
const MODEL_NAME = "gpt-5.6";
const BUDGET_LIMIT_USD = 2.0;

// Tarifas oficiais GPT-5.6 Sol (07/10/2026)
const TARIFF_INPUT_PER_M = 4.0;
const TARIFF_CACHED_INPUT_PER_M = 0.4;
const TARIFF_OUTPUT_PER_M = 20.0;

async function execute() {
  console.log("================================================================================");
  console.log("ATHENA — REVISÃO JURÍDICA EDITORIAL INTEGRAL (EXECUÇÃO REAL AUTORIZADA)");
  console.log("================================================================================");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. CARREGAMENTO E REGISTRO DA AULA ORIGINAL
  const seedsRaw = fs.readFileSync("src/data/homologatedSeeds.json", "utf8");
  const seeds = JSON.parse(seedsRaw);
  const originalLesson = seeds[LESSON_ID];

  if (!originalLesson) {
    throw new Error(`Aula ${LESSON_ID} não encontrada no arquivo homologatedSeeds.json.`);
  }

  const originalContent = originalLesson.content;
  const originalSha256 = crypto.createHash("sha256").update(originalContent, "utf8").digest("hex");
  const originalLength = originalContent.length;

  console.log(`[PREPARAÇÃO] Aula: ${LESSON_ID} (${originalLesson.subject} - ${originalLesson.topic})`);
  console.log(`[PREPARAÇÃO] Versão original: ${originalLesson.version}`);
  console.log(`[PREPARAÇÃO] Caracteres: ${originalLength}`);
  console.log(`[PREPARAÇÃO] SHA-256 Original: ${originalSha256}`);

  // Validação de blocos didáticos
  const blocks = originalContent.match(/\[BLOCK_\d+\]/g) || [];
  const hasChallenge = originalContent.includes("[ATHENA_CHALLENGE]");
  if (blocks.length !== 6 || !hasChallenge) {
    throw new Error(`Estrutura original incompleta: encontrados ${blocks.length} blocos e desafio=${hasChallenge}`);
  }
  console.log(`[PREPARAÇÃO] Estrutura didática original confirmada: 6 blocos e [ATHENA_CHALLENGE] presentes.`);

  // 2. RECUPERAÇÃO DA CHAVE DE API
  let apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    try {
      const fc = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
      apiKey = execSync(
        `gcloud secrets versions access latest --secret=OPENAI_API_KEY --project=${fc.projectId}`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
      ).trim();
    } catch (e: any) {
      throw new Error(`Falha ao obter OPENAI_API_KEY: ${e.message}`);
    }
  }

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY indisponível.");
  }
  console.log(`[PREPARAÇÃO] Autenticação OpenAI configurada.`);

  // 3. CONSTRUÇÃO DO PROMPT
  const reviewDate = "07/10/2026";
  const instructions = buildLegalReviewInstructions(reviewDate);
  const propositionInventory = extractPropositionUnits(originalContent);
  const propositionsFormatted = formatPropositionsForPrompt(propositionInventory);

  const userInput = buildUntrustedLessonInput({
    reviewDate,
    lessonId: originalLesson.id,
    day: originalLesson.day,
    part: originalLesson.part,
    subject: originalLesson.subject,
    topic: originalLesson.topic,
    content: originalContent,
    propositionsFormatted,
  });

  const createParams = buildReviewCreateParams({
    model: MODEL_NAME,
    instructions,
    userInput,
    lessonText: originalContent,
    reasoningEffort: "medium",
    maxOutputTokens: 25000,
  });

  // Estimativa prévia
  const estimatedInputTokens = Math.ceil((instructions.length + userInput.length) / 3.5);
  const maxOutputTokens = createParams.max_output_tokens || 25000;
  const maxConservativeCost = ((estimatedInputTokens + 5000) * (TARIFF_INPUT_PER_M / 1_000_000)) +
                              (maxOutputTokens * (TARIFF_OUTPUT_PER_M / 1_000_000));

  console.log(`[TRAVA FINANCEIRA] Tokens de entrada estimados: ~${estimatedInputTokens}`);
  console.log(`[TRAVA FINANCEIRA] Teto tokens de saída: ${maxOutputTokens}`);
  console.log(`[TRAVA FINANCEIRA] Teto de custo conservador: US$ ${maxConservativeCost.toFixed(4)}`);
  console.log(`[TRAVA FINANCEIRA] Orçamento autorizado: US$ ${BUDGET_LIMIT_USD.toFixed(2)}`);

  if (maxConservativeCost > BUDGET_LIMIT_USD) {
    throw new Error(`Custo conservador US$ ${maxConservativeCost.toFixed(4)} excede orçamento de US$ 2,00. Abortando.`);
  }

  // 4. EXECUÇÃO DA CHAMADA ÚNICA (ZERO RETENTATIVAS)
  console.log(`[EXECUÇÃO] Iniciando chamada única com Responses API e ferramentas oficiais de busca habilitadas...`);
  const client = new OpenAI({ apiKey, maxRetries: 0 });

  const startTime = Date.now();
  let rawResponse: any;
  let callError: any = null;

  try {
    rawResponse = await client.responses.create(createParams as any);
  } catch (err: any) {
    callError = err;
    console.error(`[EXECUÇÃO] Erro na chamada da OpenAI:`, err);
  }
  const elapsedMs = Date.now() - startTime;
  console.log(`[EXECUÇÃO] Chamada concluída em ${(elapsedMs / 1000).toFixed(2)}s.`);

  // 5. REGISTRO E PROCESSAMENTO DO RESULTADO
  if (callError || !rawResponse) {
    console.error(`[EXECUÇÃO] Falha sem resposta utilizável. Registrando relatório e abortando sem retentativa.`);
    // Salvar relatório de erro
    const errorReport = `# RELATÓRIO TÉCNICO DE FALHA
- Modelo solicitado: ${MODEL_NAME}
- Chamadas executadas: 1
- Tempo decorrido: ${elapsedMs}ms
- Erro: ${callError?.message || "Sem resposta"}
- Status da aula original: INTACTA
- Classificação: EDITORIAL_REVIEW_INCOMPLETE
`;
    fs.writeFileSync(path.join(OUTPUT_DIR, "relatorio-tecnico.md"), errorReport, "utf8");
    return;
  }

  // Extrair estatísticas de tokens e custo real
  const usage = rawResponse.usage || {};
  const inputTokens = Number(usage.input_tokens || 0);
  const cachedTokens = Number(usage.input_token_details?.cached_tokens || 0);
  const uncachedInputTokens = Math.max(0, inputTokens - cachedTokens);
  const outputTokens = Number(usage.output_tokens || 0);
  const reasoningTokens = Number(usage.output_token_details?.reasoning_tokens || 0);
  const totalTokens = Number(usage.total_tokens || 0);

  const realCost = (uncachedInputTokens * (TARIFF_INPUT_PER_M / 1_000_000)) +
                   (cachedTokens * (TARIFF_CACHED_INPUT_PER_M / 1_000_000)) +
                   (outputTokens * (TARIFF_OUTPUT_PER_M / 1_000_000));

  console.log(`[CONSUMO REAL] Tokens de entrada não-cacheados: ${uncachedInputTokens}`);
  console.log(`[CONSUMO REAL] Tokens cacheados: ${cachedTokens}`);
  console.log(`[CONSUMO REAL] Tokens de saída (inclui raciocínio): ${outputTokens} (raciocínio: ${reasoningTokens})`);
  console.log(`[CONSUMO REAL] Total de tokens: ${totalTokens}`);
  console.log(`[CONSUMO REAL] CUSTO EFETIVO CALCULADO: US$ ${realCost.toFixed(5)}`);

  // 6. VALIDAÇÃO E INTERPRETAÇÃO DO PARECER
  let auditResult: any = null;
  let validationError: any = null;
  try {
    auditResult = interpretReviewResponse(rawResponse, originalContent, MODEL_NAME);
  } catch (err: any) {
    validationError = err;
    console.error(`[VALIDAÇÃO] Falha na interpretação da resposta:`, err);
  }

  // 7. VERIFICAÇÃO DE INVARIANTES DA AULA ORIGINAL
  const seedsPost = JSON.parse(fs.readFileSync("src/data/homologatedSeeds.json", "utf8"));
  const postLesson = seedsPost[LESSON_ID];
  const postSha256 = crypto.createHash("sha256").update(postLesson.content, "utf8").digest("hex");
  const catalogIntact = postSha256 === originalSha256;

  console.log(`[SEGURANÇA] Catálogo oficial inalterado: ${catalogIntact} (SHA-256 idêntico)`);

  // 8. SALVAMENTO DOS QUATRO ARQUIVOS OBRIGATÓRIOS
  console.log(`[PERSISTÊNCIA] Gravando arquivos obrigatórios em ${OUTPUT_DIR}...`);

  // A. Aula Original
  const fileAContent = `---
identificador: "${LESSON_ID}"
disciplina: "${originalLesson.subject}"
tema: "${originalLesson.topic}"
versao: ${originalLesson.version}
caracteres: ${originalLength}
sha256_original: "${originalSha256}"
data_extracao: "${new Date().toISOString()}"
---

${originalContent}
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, "aula-original.md"), fileAContent, "utf8");

  // B. Aula Revisada Proposta
  const reviewedMarkdownDefinitive = auditResult?.reviewedMarkdown
    ? sanitizeReviewedMarkdown(auditResult.reviewedMarkdown)
    : "";
  fs.writeFileSync(path.join(OUTPUT_DIR, "aula-revisada.md"), reviewedMarkdownDefinitive, "utf8");

  // C. Relatório Jurídico
  const changes = auditResult?.changes || [];
  const consultedSources = auditResult?.consultedSources || [];
  const unverifiedClaims = auditResult?.unverifiedClaims || [];

  let fileCContent = `# RELATÓRIO JURÍDICO EDITORIAL — DIA 1, PARTE 1
**Identificador da Aula:** ${LESSON_ID}  
**Tema:** ${originalLesson.topic}  
**Data da Auditoria:** ${reviewDate}  
**Status da Auditoria:** ${auditResult?.outcome || "INCONCLUSIVO"}  
**Nível de Verificação:** ${auditResult?.verificationLevel || "DESCONHECIDO"}  
**Confiança:** ${auditResult?.confidence || "DESCONHECIDA"}  

---

## 1. RESUMO EXECUTIVO DAS ALTERAÇÕES
- **Total de alterações propostas:** ${auditResult?.summary?.totalChanges ?? changes.length}
- **Correções materiais:** ${auditResult?.summary?.corrections ?? 0}
- **Atualizações normativas/jurisprudenciais:** ${auditResult?.summary?.updates ?? 0}
- **Acréscimos / Complementações:** ${auditResult?.summary?.additions ?? 0}
- **Precisões dogmáticas:** ${auditResult?.summary?.precisions ?? 0}
- **Remoções:** ${auditResult?.summary?.removals ?? 0}

## 2. NOTAS DE AUDITORIA EDITORIAL
${auditResult?.reviewNotes || "Sem notas adicionais registradas."}

## 3. ALTERAÇÕES JURÍDICAS DETALHADAS E EVIDÊNCIAS
`;

  if (changes.length === 0) {
    fileCContent += "\nNenhuma alteração material necessária foi identificada. O texto foi considerado conforme o direito vigente.\n";
  } else {
    for (let i = 0; i < changes.length; i++) {
      const chg = changes[i];
      fileCContent += `\n### Alteração ${i + 1}: [${chg.category}] ${chg.type} (Severidade: ${chg.severity})\n`;
      fileCContent += `- **ID:** \`${chg.id}\`\n`;
      fileCContent += `- **Trecho Original:**\n> "${chg.originalExcerpt}"\n`;
      fileCContent += `- **Trecho Revisado Proposto:**\n> "${chg.revisedExcerpt}"\n`;
      fileCContent += `- **Justificativa Jurídica:** ${chg.reason}\n`;
      fileCContent += `- **Status de Confirmação:** \`${chg.confirmation}\` (Verificado: ${chg.verified})\n`;

      if (chg.evidence && chg.evidence.length > 0) {
        fileCContent += `- **Evidências em Fontes Oficiais:**\n`;
        for (const ev of chg.evidence) {
          fileCContent += `  * **[${ev.institution}]** [${ev.title}](${ev.url}) — *${ev.supportExplanation}* (Oficial: ${ev.official}, Consultada: ${ev.consulted})\n`;
        }
      } else {
        fileCContent += `- **Evidências:** Nenhuma fonte anexada.\n`;
      }
    }
  }

  fileCContent += `\n## 4. FONTES OFICIAIS EFETIVAMENTE CONSULTADAS
`;
  if (consultedSources.length === 0) {
    fileCContent += `Nenhuma URL oficial foi registrada na trilha de busca.\n`;
  } else {
    for (const src of consultedSources) {
      fileCContent += `- **${src.institution || "Fonte Oficial"}:** [${src.title || src.url}](${src.url}) (Oficial: ${src.official})\n`;
    }
  }

  fileCContent += `\n## 5. AFIRMAÇÕES NÃO VERIFICADAS E PENDÊNCIAS
`;
  if (unverifiedClaims.length === 0) {
    fileCContent += `Nenhuma afirmação pendente de comprovação.\n`;
  } else {
    for (const cl of unverifiedClaims) {
      fileCContent += `- **Trecho:** "${cl.excerpt}"\n  * **Motivo da Pendência:** ${cl.reason}\n`;
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "relatorio-juridico.md"), fileCContent, "utf8");

  // D. Relatório Técnico
  const isComplete = Boolean(
    auditResult &&
    reviewedMarkdownDefinitive.length > 0 &&
    catalogIntact &&
    auditResult.verificationLevel !== "FALHA_NA_VERIFICACAO"
  );

  const fileDContent = `# RELATÓRIO TÉCNICO DE AUDITORIA EDITORIAL
**Identificador da Aula:** ${LESSON_ID}  
**Data e Hora da Execução:** ${new Date().toISOString()}  
**Modelo Utilizado:** ${rawResponse.model || MODEL_NAME}  
**Chamadas Pagas Realizadas:** 1 (única, zero retentativas)  
**Tempo Total de Execução:** ${elapsedMs} ms (${(elapsedMs / 1000).toFixed(2)} s)  

---

## 1. CONSUMO DE TOKENS E CUSTO FINANCEIRO
- **Tokens de Entrada (não cacheados):** ${uncachedInputTokens} (Tarifa: US$ ${TARIFF_INPUT_PER_M.toFixed(2)} / 1M)
- **Tokens de Entrada Cacheados:** ${cachedTokens} (Tarifa: US$ ${TARIFF_CACHED_INPUT_PER_M.toFixed(2)} / 1M)
- **Tokens de Saída:** ${outputTokens} (Tarifa: US$ ${TARIFF_OUTPUT_PER_M.toFixed(2)} / 1M)
- **Tokens de Raciocínio (incluídos na saída):** ${reasoningTokens}
- **Total Geral de Tokens:** ${totalTokens}
- **CUSTO EFETIVO TOTAL:** **US$ ${realCost.toFixed(5)}**
- **Teto Autorizado:** US$ ${BUDGET_LIMIT_USD.toFixed(2)}
- **Margem de Orçamento Restante:** US$ ${(BUDGET_LIMIT_USD - realCost).toFixed(5)}

## 2. INTEGRIDADE DO CONTEÚDO E ESTRUTURA DIDÁTICA
- **Caracteres Original:** ${originalLength}
- **Caracteres Revisado:** ${reviewedMarkdownDefinitive.length}
- **Marcadores Didáticos Preservados:** ${markersPreserved(originalContent, reviewedMarkdownDefinitive) ? "SIM (100% dos blocos e desafio)" : "NÃO"}
- **Aula Original Intacta no Catálogo:** ${catalogIntact ? "SIM (SHA-256 byte-a-byte idêntico)" : "NÃO (VIOLAÇÃO)"}
- **Publicação Automática:** NÃO REALIZADA (aula mantida estritamente em staging)

## 3. AVALIAÇÃO DOS CRITÉRIOS DE ACEITAÇÃO
1. Aula completa processada: ${auditResult ? "SIM" : "NÃO"}
2. Markdown revisado integralmente disponível: ${reviewedMarkdownDefinitive.length > 0 ? "SIM" : "NÃO"}
3. Pesquisa oficial realizada: ${auditResult?.webSearchUsed ? "SIM" : "NÃO"} (${consultedSources.length} fontes)
4. Alterações fundamentadas: ${changes.every((c: any) => c.confirmation === "CONFIRMADO") ? "SIM" : "PARCIAL"}
5. Estrutura didática preservada: ${markersPreserved(originalContent, reviewedMarkdownDefinitive) ? "SIM" : "NÃO"}
6. Versão original inalterada: ${catalogIntact ? "SIM" : "NÃO"}
7. Não publicada: SIM

## 4. CLASSIFICAÇÃO FINAL
**${isComplete ? "EDITORIAL_REVIEW_SUCCESS" : "EDITORIAL_REVIEW_INCOMPLETE"}**
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, "relatorio-tecnico.md"), fileDContent, "utf8");

  console.log(`[FINALIZAÇÃO] Todos os arquivos foram gerados com sucesso em ${OUTPUT_DIR}.`);
  console.log(`[STATUS FINAL] Classificação: ${isComplete ? "EDITORIAL_REVIEW_SUCCESS" : "EDITORIAL_REVIEW_INCOMPLETE"}`);
}

execute().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
