import assert from 'node:assert/strict';
import { failedQuestionRetryReward, pendingErrorsCount } from '../src/lib/failedQuestionRetry';

let pass = 0;
const t = (name: string, fn: () => void) => { fn(); pass++; console.log('PASS ' + name); };

// Simula a sequência do Caderno de Erros com o mesmo estado que App.tsx mantém (resolved + contadores).
function simulate(answers: boolean[]) {
  let resolved = false, xp = 0, resolvedErrors = 0;
  for (const isCorrect of answers) {
    const r = failedQuestionRetryReward(isCorrect, resolved);
    xp += r.xp; resolvedErrors += r.resolvedIncrement;
    resolved = isCorrect || resolved;
  }
  return { resolved, xp, resolvedErrors };
}

t('primeiro acerto de pendente conta 1 erro superado e 25 XP', () => assert.deepEqual(failedQuestionRetryReward(true, false), { xp: 25, resolvedIncrement: 1 }));
t('acerto em questão já superada não conta de novo', () => assert.deepEqual(failedQuestionRetryReward(true, true), { xp: 0, resolvedIncrement: 0 }));
t('erro na revisão não dá XP nem supera', () => assert.deepEqual(failedQuestionRetryReward(false, false), { xp: 0, resolvedIncrement: 0 }));
t('erro em questão já superada mantém tudo', () => assert.deepEqual(failedQuestionRetryReward(false, true), { xp: 0, resolvedIncrement: 0 }));
t('sem dupla contagem: acertar 3x a mesma questão = 1 superada', () => assert.deepEqual(simulate([true, true, true]), { resolved: true, xp: 25, resolvedErrors: 1 }));
t('errar 5x e depois acertar = 1 superada, 25 XP (sem farm de XP)', () => assert.deepEqual(simulate([false, false, false, false, false, true]), { resolved: true, xp: 25, resolvedErrors: 1 }));
t('acertar e depois errar não desfaz a superação', () => assert.deepEqual(simulate([true, false]), { resolved: true, xp: 25, resolvedErrors: 1 }));
t('erros pendentes = erros da 1ª tentativa − superados', () => assert.equal(pendingErrorsCount({ totalQuestions: 10, uniqueQuestions: 10, correctAnswers: 6, evolution: { resolvedErrors: 1 } }), 3));
t('erros pendentes nunca negativos (contador antigo inflado)', () => assert.equal(pendingErrorsCount({ totalQuestions: 10, correctAnswers: 8, evolution: { resolvedErrors: 7 } }), 0));
t('sem erros = 0 pendentes', () => assert.equal(pendingErrorsCount({ totalQuestions: 10, correctAnswers: 10 }), 0));
console.log(`== failed-question-retry: ${pass}/10`);
