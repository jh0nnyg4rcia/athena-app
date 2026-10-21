// Exclusivamente dados sintéticos; nenhuma leitura de catálogo ou configuração.
import { sha256, contentSha256 } from './import-reviewed-questions.mjs';
export function syntheticFixture() {
  const questions = [
    { id: 'synthetic-q1', subject: 'Disciplina sintética', text: 'Qual alternativa foi aprovada neste teste?', options: ['Alternativa A', 'Alternativa B'], correctIndex: 0, explanation: 'Justificativa original sintética.', provenance: { fixture: true } },
    { text: 'Questão sintética preservada?', options: ['Sim', 'Não'], correctIndex: 0, explanation: 'Esta questão permanece intacta.' }
  ];
  const challenge = { questions, fixtureMetadata: 'preservar' };
  const content = '[BLOCK_1]\nCabeçalho\n[BLOCK_2]\nLei sintética\n[BLOCK_3]\nJurisprudência sintética\n[BLOCK_4]\nDoutrina sintética\n[BLOCK_5]\nIntrodução preservada.\n[ATHENA_CHALLENGE]\n' + JSON.stringify(challenge, null, 2) + '\nRodapé do desafio preservado.\n[BLOCK_6]\nRevisão sintética\n';
  const lesson = { id: 'day_1_part_0', day: 1, part: 0, version: 1, subject: 'Disciplina sintética', content, challenge, status: 'approved', approvedBy: 'CEO sintético', approvedAt: 1, otherMetadata: { preserve: true } };
  const snapshot = { schemaVersion: 'athena-question-snapshot/v1', capturedAt: '2026-10-12T12:00:00Z', lesson, reviewState: { checked: true, index: null, reviews: [] } };
  const input = { schemaVersion: 'athena-reviewed-questions/v1', lessonId: lesson.id, originalVersion: 1, originalContentSha256: contentSha256(content), originalLessonSha256: sha256(lesson), audit: { reference: 'EXEMPLO SINTÉTICO — não é auditoria real', approvedBy: 'CEO sintético', approvedAt: '2026-10-12T12:30:00Z', approvalReference: 'Aprovação sintética para teste offline', sources: ['https://www.planalto.gov.br/'] }, questions: questions.map((q, index) => ({ index, originalSha256: sha256(q), original: structuredClone(q), revised: structuredClone(q), approvedChanges: [] })) };
  input.questions[0].revised.correctIndex = 1;
  input.questions[0].revised.explanation = 'Justificativa revisada e aprovada no cenário sintético.';
  input.questions[0].approvedChanges = [{ field: 'correctIndex', reason: 'Correção sintética aprovada' }, { field: 'explanation', reason: 'Fundamentação sintética aprovada' }];
  return { snapshot, input };
}
