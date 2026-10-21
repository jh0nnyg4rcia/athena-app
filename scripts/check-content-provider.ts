import { readFileSync } from "node:fs";
import {
  generationBackend,
  parseContentProvider,
  providerForCeoChoice,
  regenerateEngineName,
  regenerateLessonConfirm,
} from "../src/lib/contentProvider";
import { legalReviewTestButtonVisible } from "../src/lib/legalReviewTypes";
import { reviewModelName } from "../src/services/legalReviewServer";

let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failed += 1;
    console.error("FALHOU:", message);
  }
}

function main() {
  assert(parseContentProvider("chatgpt") === "chatgpt", "chatgpt é um provider");
  assert(parseContentProvider("gemini") === "gemini", "gemini é o provider padrão explícito");
  assert(parseContentProvider("outro") === "gemini", "valor desconhecido volta para Gemini");

  assert(providerForCeoChoice(true, "chatgpt") === "chatgpt", "CEO envia ChatGPT");
  assert(providerForCeoChoice(true, "gemini") === "gemini", "CEO envia Gemini");
  assert(providerForCeoChoice(false, "chatgpt") === "gemini", "aluno não envia ChatGPT");

  assert(generationBackend("gemini") === "gemini", "Gemini no seletor usa o backend Gemini");
  assert(generationBackend("chatgpt") === "openai", "ChatGPT no seletor usa o backend OpenAI");

  const geminiConfirm = regenerateLessonConfirm({
    provider: "gemini",
    day: 78,
    block: 1,
    subject: "Direito Penal",
  });
  const chatgptConfirm = regenerateLessonConfirm({
    provider: "chatgpt",
    day: 78,
    block: 1,
    subject: "Direito Penal",
  });
  assert(geminiConfirm.includes("com a IA Gemini?"), "confirmação de Gemini nomeia Gemini");
  assert(chatgptConfirm.includes("com a IA ChatGPT?"), "confirmação de ChatGPT nomeia ChatGPT");
  assert(!geminiConfirm.includes("ChatGPT") && !chatgptConfirm.endsWith("com a IA Gemini?"), "cada confirmação usa o provider selecionado");
  assert(regenerateEngineName("chatgpt") === "ChatGPT" && regenerateEngineName("gemini") === "Gemini", "nome do motor acompanha o provider");

  assert(legalReviewTestButtonVisible(true), "CEO vê Testar Revisor Jurídico");
  assert(!legalReviewTestButtonVisible(false), "usuário comum não vê Testar Revisor Jurídico");

  const app = readFileSync("src/App.tsx", "utf8");
  const client = readFileSync("src/services/geminiService.ts", "utf8");
  const api = readFileSync("src/api/createAthenaApiApp.ts", "utf8");
  const reviewRoutes = readFileSync("src/api/legalReviewRoutes.ts", "utf8");
  const reviewServer = readFileSync("src/services/legalReviewServer.ts", "utf8");

  assert(app.includes("regenerateLessonConfirm({"), "Regerar usa a confirmação do provider real");
  assert(!app.includes("com a IA Gemini?"), "a confirmação não está mais fixa em Gemini");
  assert(app.includes("handleCeoRegenerateLesson") && app.includes("askATHENA("), "Regerar chama askATHENA");
  assert(app.includes("handleCeoRegenerateQuestions") && app.includes("regenerateObjectiveChallenge("), "questões chamam regenerateObjectiveChallenge");
  assert(client.includes('"/api/ask-athena"') && client.includes("contentProvider: providerForRequest()"), "aula nova e Regerar enviam o provider");
  assert(client.includes('"/api/regenerate-challenge"') && client.includes("providerForCeoChoice"), "questões enviam o provider do CEO");

  const ask = api.slice(api.indexOf('app.post("/api/ask-athena"'), api.indexOf('app.post("/api/regenerate-challenge"'));
  const challenge = api.slice(api.indexOf('app.post("/api/regenerate-challenge"'), api.indexOf('app.post("/api/evaluate-answer"'));
  assert(ask.includes('generationBackend(provider) === "openai"') && ask.includes("askChatGPT(") && ask.includes("askATHENA("), "aula nova e Regerar escolhem OpenAI ou Gemini no servidor");
  assert(challenge.includes('generationBackend(provider) === "openai"') && challenge.includes("generateObjectiveChallengeChatGPT(") && challenge.includes("generateObjectiveChallenge("), "questões escolhem OpenAI ou Gemini no servidor");
  assert(!reviewRoutes.includes("generationBackend") && !reviewRoutes.includes("contentProvider"), "o revisor não consulta o seletor");
  assert(reviewRoutes.includes("auditLessonWithOpenAI"), "o revisor usa a auditoria OpenAI");
  assert(reviewServer.includes('DEFAULT_OPENAI_REVIEW_MODEL = "gpt-5.6"'), "o revisor permanece no GPT-5.6");
  const previousModel = process.env.OPENAI_REVIEW_MODEL;
  delete process.env.OPENAI_REVIEW_MODEL;
  assert(reviewModelName() === "gpt-5.6", "o modelo efetivo do revisor continua GPT-5.6");
  if (previousModel === undefined) delete process.env.OPENAI_REVIEW_MODEL;
  else process.env.OPENAI_REVIEW_MODEL = previousModel;

  const marker = "legalReviewTestButtonVisible(Boolean(isCEO))";
  const testButton = app.slice(app.indexOf(marker), app.indexOf("Testar Revisor Jurídico", app.indexOf(marker)));
  assert(testButton.length > 0 && !testButton.includes("cacheCurrent") && !testButton.includes("legalReviewButtonVisible"), "o teste do revisor não depende de aula salva");
  assert(!app.includes("OPENAI_API_KEY") && !client.includes("OPENAI_API_KEY") && !app.includes("GEMINI_API_KEY"), "as chaves não entram no cliente");

  if (failed) {
    console.error(`${failed} verificações do provider falharam.`);
    process.exit(1);
  }
  console.log("Provider de geração: verificações locais passaram.");
}

main();
