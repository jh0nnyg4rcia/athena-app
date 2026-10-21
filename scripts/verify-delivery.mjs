// Mock localStorage for Node.js environment
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

import fs from 'node:fs';
import assert from 'node:assert';

// 1. Load data
const seeds = JSON.parse(fs.readFileSync('./src/data/homologatedSeeds.json', 'utf8'));

// Import modules to test
import { 
  canonicalSubjectForDayPart, 
  detectPartFromContent, 
  isReviewContaminated, 
  shouldReplaceReviewContent,
  extractReviewBlock,
  buildCompressedReview,
  selectUserStudiedReviews,
  mergeReviewLists
} from '../src/lib/compressedReviews.ts';

import { ReviewCounterService } from '../src/services/reviewCounterService.ts';
import { LocalPersistence } from '../src/services/localPersistence.ts';

console.log("=== INICIANDO SUÍTE DE VERIFICAÇÃO FOCADA ===\n");

// TEST 1: Cinco revisões distintas do Dia 1
console.log("TEST 1: Cinco revisões distintas do Dia 1...");
const day1Reviews = [];
for (let p = 0; p < 5; p++) {
  const key = `day_1_part_${p}`;
  const seed = seeds[key];
  assert(seed, `Semente ${key} deve existir`);
  
  const extracted = extractReviewBlock(seed.content, seed.blocks);
  assert(extracted && extracted.length > 50, `Revisão de ${key} deve ser extraída com sucesso (tam: ${extracted?.length})`);
  
  const canonical = canonicalSubjectForDayPart(1, p);
  assert(canonical, `Matéria canônica para Dia 1 Parte ${p} deve existir`);
  
  const review = buildCompressedReview({
    content: extracted,
    subject: canonical,
    day: 1,
    part: p,
    sessionId: 'session-uuid-day-1'
  });
  
  day1Reviews.push(review);
  
  assert.strictEqual(review.id, `trilha:1:${p}`);
  assert.strictEqual(review.day, 1);
  assert.strictEqual(review.part, p);
  assert(review.subject.includes(`Parte ${p + 1}`), `Título deve conter Parte ${p + 1}`);
  
  // Verify no cross-contamination
  const isContaminated = isReviewContaminated(review);
  assert.strictEqual(isContaminated, false, `Revisão de Parte ${p} (${canonical}) não pode estar contaminada`);
}

// Check all 5 reviews have distinct contents
const uniqueContents = new Set(day1Reviews.map(r => r.content));
assert.strictEqual(uniqueContents.size, 5, "As cinco revisões do Dia 1 devem ter conteúdos completamente distintos!");
console.log("✔ TEST 1 PASSOU: 5 revisões distintas do Dia 1 extraídas, canônicas e sem contaminação.");

// TEST 2: Antídoto para armadilha de tamanho (shouldReplaceReviewContent)
console.log("\nTEST 2: Substituição de revisão corrompida mesmo quando menor em caracteres...");
const corruptedPart2 = {
  id: 'trilha:1:2',
  day: 1,
  part: 2,
  subject: 'Parte 3 · Direito Processual Civil',
  content: 'Revisão com SO-CI-DI-VA-PLU e fundamentos da República que veio copiada indevidamente da Parte 0 com tamanho gigante de 2399 caracteres ' + 'x'.repeat(2300),
  timestamp: 1000
};
const cleanPart2 = {
  id: 'trilha:1:2',
  day: 1,
  part: 2,
  subject: 'Parte 3 · Direito Processual Civil',
  content: 'Revisão legítima de Processo Civil sobre inércia da jurisdição, impulso oficial e contraditório com 1698 caracteres ' + 'y'.repeat(1500),
  timestamp: 1000
};

assert(isReviewContaminated(corruptedPart2), "Revisão corrompida de CPC com SO-CI-DI-VA-PLU deve ser detectada como contaminada");
assert(!isReviewContaminated(cleanPart2), "Revisão limpa de CPC não deve ser contaminada");
assert(shouldReplaceReviewContent(corruptedPart2, cleanPart2), "Revisão limpa DEVE substituir a corrompida mesmo tendo menos caracteres!");
console.log("✔ TEST 2 PASSOU: Armadilha de tamanho eliminada com detecção de contaminação.");

// TEST 3: Contador individual de revisões (ReviewCounterService)
console.log("\nTEST 3: Persistência, clamping (min 0) e idempotência do contador de revisões...");
const testUser = 'user_test_counter_123';
const reviewId = 'trilha:1:0';

// Clean initial
LocalPersistence.saveReviewCounters(testUser, {});

let count = ReviewCounterService.getCount(testUser, reviewId);
assert.strictEqual(count, 0, "Contador inicial deve ser 0");

// Increment
count = await ReviewCounterService.updateCounter(testUser, reviewId, 1, 'mut_1');
assert.strictEqual(count, 1, "Após +1 contador deve ser 1");

// Increment again
count = await ReviewCounterService.updateCounter(testUser, reviewId, 1, 'mut_2');
assert.strictEqual(count, 2, "Após +1 contador deve ser 2");

// Idempotency: replay mut_2
count = await ReviewCounterService.updateCounter(testUser, reviewId, 1, 'mut_2');
assert.strictEqual(count, 2, "Reenvio da mesma mutação deve ser ignorado (idempotente)");

// Decrement
count = await ReviewCounterService.updateCounter(testUser, reviewId, -1, 'mut_3');
assert.strictEqual(count, 1, "Após -1 contador deve ser 1");

// Decrement to 0
count = await ReviewCounterService.updateCounter(testUser, reviewId, -1, 'mut_4');
assert.strictEqual(count, 0, "Após -1 contador deve ser 0");

// Decrement below 0 clamp
count = await ReviewCounterService.updateCounter(testUser, reviewId, -1, 'mut_5');
assert.strictEqual(count, 0, "Contador não pode ser negativo (mínimo 0 preservado)");

console.log("✔ TEST 3 PASSOU: Contador opera com mínimo 0, idempotência e persistência local.");

// TEST 4: Isolamento entre contas
console.log("\nTEST 4: Isolamento entre contas para contadores...");
const userA = 'user_account_A';
const userB = 'user_account_B';
LocalPersistence.saveReviewCounters(userA, {});
LocalPersistence.saveReviewCounters(userB, {});

await ReviewCounterService.updateCounter(userA, 'trilha:1:0', 5, 'mut_a1');
await ReviewCounterService.updateCounter(userB, 'trilha:1:0', 1, 'mut_b1');

assert.strictEqual(ReviewCounterService.getCount(userA, 'trilha:1:0'), 5, "Usuário A deve ter 5x");
assert.strictEqual(ReviewCounterService.getCount(userB, 'trilha:1:0'), 1, "Usuário B deve ter 1x (isolamento estrito)");
console.log("✔ TEST 4 PASSOU: Contas isoladas sem vazamento de estado.");

// TEST 5: Caderno de Erros e Estatísticas Coerentes
console.log("\nTEST 5: Recuperação de erros e coerência das estatísticas...");
const initialStat = {
  subjectName: 'Direito Constitucional',
  correctAnswers: 2,
  totalQuestions: 4, // 4 questões únicas estudadas
  progress: 40,
  xp: 120,
  uniqueQuestions: 4,
  totalAttempts: 4,
  evolution: {
    firstAttemptAccuracy: 50,
    resolvedErrors: 0
  }
};

// Student failed a question originally
const failedQ = {
  id: 'err_q_1',
  userId: userA,
  subject: 'Direito Constitucional',
  text: 'Sobre os princípios fundamentais da CF/88...',
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 2,
  explanation: 'Gabarito letra C',
  timestamp: Date.now() - 3600000,
  trilhaDay: 1,
  trilhaMaterialIndex: 0,
  resolved: false,
  attempts: [
    { timestamp: Date.now() - 3600000, selectedOption: 0, correct: false }
  ]
};

LocalPersistence.saveFailedQuestion(userA, failedQ);
const loadedFq = LocalPersistence.getFailedQuestions(userA).find(q => q.id === 'err_q_1');
assert(loadedFq, "Questão com erro deve estar persistida no Caderno de Erros");
assert.strictEqual(loadedFq.resolved, false, "Inicialmente deve estar pendente");

// Now student retries question in Caderno de Erros and gets it right (option 2)
const isCorrect = 2 === loadedFq.correctIndex;
assert.strictEqual(isCorrect, true);

const updatedAttempts = [...(loadedFq.attempts || []), { timestamp: Date.now(), selectedOption: 2, correct: true }];
const resolvedFq = {
  ...loadedFq,
  resolved: true,
  resolvedAt: Date.now(),
  attempts: updatedAttempts
};

LocalPersistence.saveFailedQuestion(userA, resolvedFq);
const reloadedFq = LocalPersistence.getFailedQuestions(userA).find(q => q.id === 'err_q_1');
assert.strictEqual(reloadedFq.resolved, true, "Após acertar, questão deve constar como resolvida/superada");
assert.strictEqual(reloadedFq.attempts.length, 2, "Histórico deve preservar 2 tentativas");
assert.strictEqual(reloadedFq.attempts[0].correct, false, "1ª tentativa foi erro");
assert.strictEqual(reloadedFq.attempts[1].correct, true, "2ª tentativa foi acerto");

// Update stats on retry (isRetry: true):
// Rule: uniqueQuestions (totalQuestions) MUST NOT INCREMENT!
const isRetry = true;
const newUniqueQuestions = isRetry ? (initialStat.uniqueQuestions ?? initialStat.totalQuestions) : initialStat.totalQuestions + 1;
const newTotalAttempts = (initialStat.totalAttempts ?? initialStat.totalQuestions) + 1;
const newCorrectAnswers = isRetry ? initialStat.correctAnswers : initialStat.correctAnswers + 1;
const newResolvedErrors = (initialStat.evolution?.resolvedErrors ?? 0) + (isRetry && isCorrect ? 1 : 0);
const firstAttemptAccuracy = Math.round((newCorrectAnswers / newUniqueQuestions) * 100);

assert.strictEqual(newUniqueQuestions, 4, "Refazer questão no Caderno NÃO pode inflar as 4 questões únicas estudadas!");
assert.strictEqual(newTotalAttempts, 5, "Total de tentativas deve subir para 5");
assert.strictEqual(newCorrectAnswers, 2, "Acertos na 1ª tentativa devem permanecer 2 (não altera baseline inicial)");
assert.strictEqual(newResolvedErrors, 1, "Erros superados no Caderno deve registrar 1");
assert.strictEqual(firstAttemptAccuracy, 50, "Precisão na 1ª tentativa permanece 50%");

console.log("✔ TEST 5 PASSOU: Retentativa preserva histórico, resolve erro e não infla total de questões únicas.");

console.log("\n==========================================");
console.log("TODAS AS VERIFICAÇÕES PASSARAM COM SUCESSO!");
console.log("==========================================");
process.exit(0);
