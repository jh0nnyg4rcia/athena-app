import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import {
  buildLegalReviewInstructions,
  buildUntrustedLessonInput,
} from "../src/services/legalReviewPrompt.js";
import {
  extractPropositionUnits,
  formatPropositionsForPrompt,
} from "../src/lib/legalReviewPropositions.js";
import { searchDomainsForLesson } from "../src/lib/legalReviewSources.js";
import { buildReviewCreateParams } from "../src/services/legalReviewServer.js";

async function main() {
  console.log("=== PREFLIGHT DIA 1 - PRIMEIRA PARTE ===");

  // 1. Recuperar o Markdown integral da aula
  const seeds = JSON.parse(fs.readFileSync("src/data/homologatedSeeds.json", "utf8"));
  const lesson = seeds["day_1_part_0"];
  if (!lesson) {
    throw new Error("Aula day_1_part_0 não encontrada no cache.");
  }

  const sha256 = crypto.createHash("sha256").update(lesson.content, "utf8").digest("hex");
  console.log("Identificador:", lesson.id);
  console.log("Disciplina:", lesson.subject);
  console.log("Tema:", lesson.topic);
  console.log("Versão:", lesson.version);
  console.log("Tamanho em caracteres:", lesson.content.length);
  console.log("SHA-256 Original:", sha256);

  // 2. Verificar blocos didáticos
  const blocks = lesson.content.match(/\[BLOCK_\d+\]/g) || [];
  const hasChallenge = lesson.content.includes("[ATHENA_CHALLENGE]");
  console.log("Blocos didáticos detectados:", blocks);
  console.log("Bloco [ATHENA_CHALLENGE] presente:", hasChallenge);

  if (blocks.length !== 6 || !hasChallenge) {
    throw new Error("Conteúdo incompleto: esperado 6 blocos e 1 ATHENA_CHALLENGE.");
  }

  // 3. Proposições para o prompt
  const t0 = Date.now();
  const propositionInventory = extractPropositionUnits(lesson.content);
  const propositionsFormatted = formatPropositionsForPrompt(propositionInventory);
  console.log(`Proposições extraídas: ${propositionInventory.length} (em ${Date.now() - t0}ms)`);

  const reviewDate = "07/10/2026";
  const instructions = buildLegalReviewInstructions(reviewDate);
  const userInput = buildUntrustedLessonInput({
    reviewDate,
    lessonId: lesson.id,
    day: lesson.day,
    part: lesson.part,
    subject: lesson.subject,
    topic: lesson.topic,
    content: lesson.content,
    propositionsFormatted,
  });

  // 4. Domínios de pesquisa oficial
  const domains = searchDomainsForLesson(lesson.content);
  console.log("Domínios oficiais de pesquisa:", domains);

  // 5. Parâmetros da chamada
  const createParams = buildReviewCreateParams({
    model: "gpt-5.6",
    instructions,
    userInput,
    lessonText: lesson.content,
    reasoningEffort: "medium",
    maxOutputTokens: 25000,
  });

  // 6. Estimativa de tokens e custo
  const estimatedInputTokens = Math.ceil((instructions.length + userInput.length) / 3.5);
  const maxOutputTokens = createParams.max_output_tokens || 25000;
  console.log("Tokens estimados de entrada:", estimatedInputTokens);
  console.log("Teto configurado de tokens de saída:", maxOutputTokens);

  // Tarifas oficiais GPT-5.6 (Sol)
  // Input: $4.00 / 1M ($0.000004)
  // Output: $20.00 / 1M ($0.000020)
  const maxInputCost = (estimatedInputTokens + 5000) * 0.000004; // margem para tool output
  const maxOutputCost = maxOutputTokens * 0.000020;
  const maxConservativeCost = maxInputCost + maxOutputCost;

  console.log(`Custo máximo conservador estimado: US$ ${maxConservativeCost.toFixed(4)}`);
  console.log(`Orçamento autorizado: US$ 2.00`);

  if (maxConservativeCost > 2.0) {
    throw new Error(`Custo conservador US$ ${maxConservativeCost.toFixed(4)} excede teto de US$ 2.00! Interrompendo.`);
  }
  console.log("✓ Estimativa conservadora dentro do orçamento autorizado de US$ 2.00.");

  // 7. Teste de chave de API
  let apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    try {
      const fc = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
      apiKey = execSync(
        `gcloud secrets versions access latest --secret=OPENAI_API_KEY --project=${fc.projectId}`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
      ).trim();
    } catch (e: any) {
      console.log("Erro ao buscar secret no GCP:", e.message);
    }
  }

  console.log("Chave OPENAI_API_KEY disponível:", Boolean(apiKey), "comprimento:", apiKey.length);
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não localizada.");
  }

  console.log("=== PREFLIGHT CONCLUÍDO COM SUCESSO ===");
}

main().catch((err) => {
  console.error("Falha no preflight:", err);
  process.exit(1);
});
