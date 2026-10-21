/** Caderno de Erros: recompensa de revisão conta só no primeiro acerto de uma questão ainda pendente (idempotente). */
export function failedQuestionRetryReward(isCorrect: boolean, alreadyResolved: boolean): { xp: number; resolvedIncrement: number } {
  const firstResolution = isCorrect && !alreadyResolved;
  return { xp: firstResolution ? 25 : 0, resolvedIncrement: firstResolution ? 1 : 0 };
}

/** Erros ainda pendentes = erros na 1ª tentativa menos erros já superados no Caderno (nunca negativo). */
export function pendingErrorsCount(stat: { totalQuestions?: number; uniqueQuestions?: number; correctAnswers?: number; evolution?: { resolvedErrors?: number } }): number {
  const unique = stat.uniqueQuestions ?? stat.totalQuestions ?? 0;
  const wrong = Math.max(0, unique - (stat.correctAnswers ?? 0));
  return Math.max(0, wrong - (stat.evolution?.resolvedErrors ?? 0));
}
