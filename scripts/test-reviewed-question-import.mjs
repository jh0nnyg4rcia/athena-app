import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dryRun, parseStrict, embedded, main, sha256, contentSha256 } from './import-reviewed-questions.mjs';
import { syntheticFixture } from './revised-question-import-fixtures.mjs';

const reject = (name, mutate) => test(name, () => {
  const f = syntheticFixture(); mutate(f);
  const result = dryRun(f.snapshot, f.input);
  assert.equal(result.ok, false); assert.deepEqual(result.fieldsToUpdate, []);
  assert.equal(result.remoteWriteEnabled, false); assert.ok(result.conflicts.length);
});
const rehash = f => { f.input.originalContentSha256 = contentSha256(f.snapshot.lesson.content); f.input.originalLessonSha256 = sha256(f.snapshot.lesson); };
test('JSON válido, diferenças exatas e backup apenas planejado', () => {
  const f = syntheticFixture(); const r = dryRun(f.snapshot, f.input);
  assert.equal(r.ok, true); assert.equal(r.backupPlan.confirmed, false);
  assert.deepEqual(r.differences[0].changes.map(c => c.field), ['correctIndex', 'explanation']);
  assert.equal(r.differences[1].changed, false);
  assert.deepEqual(r.backupPlan.document, f.snapshot.lesson);
});
test('JSON inválido e chaves duplicadas rejeitados', () => {
  for (const text of ['{', '{"x":1,"x":2}', '[1,]', '{"x":1e999}', '{"x":true}x', '{"x":{"a":1,"a":2}}']) assert.throws(() => parseStrict(text));
});
reject('questão ausente', f => f.input.questions.pop());
reject('alternativa ausente', f => f.input.questions[0].revised.options.pop());
reject('gabarito fora do intervalo', f => f.input.questions[0].revised.correctIndex = 2);
reject('gabarito fracionário', f => f.input.questions[0].revised.correctIndex = 0.5);
reject('quantidade não autorizada', f => f.input.questions.push(structuredClone(f.input.questions[0])));
reject('ordem de questões', f => f.input.questions.reverse());
reject('permutação de alternativas', f => { f.input.questions[0].revised.options.reverse(); f.input.questions[0].approvedChanges.push({ field: 'options[0]', reason: 'x' }, { field: 'options[1]', reason: 'x' }); });
reject('id imutável', f => f.input.questions[0].revised.id = 'outro');
reject('subject imutável', f => delete f.input.questions[0].revised.subject);
reject('metadado opcional imutável', f => f.input.questions[0].revised.provenance.fixture = false);
reject('divergência de hash de conteúdo', f => f.input.originalContentSha256 = 'a'.repeat(64));
reject('divergência de hash da aula', f => f.snapshot.lesson.otherMetadata.preserve = false);
reject('divergência de hash da questão', f => f.input.questions[0].originalSha256 = 'b'.repeat(64));
reject('divergência de versão', f => f.input.originalVersion++);
reject('identificador não canônico', f => f.input.lessonId = 'day_01_part_0');
reject('identificadores duplicados', f => {
  f.snapshot.lesson.challenge.questions[1].id = 'synthetic-q1';
  f.snapshot.lesson.content = f.snapshot.lesson.content.replace(JSON.stringify(f.input.questions[1].original, null, 2), JSON.stringify(f.snapshot.lesson.challenge.questions[1], null, 2));
  rehash(f);
});
reject('alteração sem autorização', f => f.input.questions[0].approvedChanges.pop());
reject('autorização duplicada', f => f.input.questions[0].approvedChanges.push(f.input.questions[0].approvedChanges[0]));
reject('enunciado vazio', f => f.input.questions[0].revised.text = '  ');
reject('justificativa vazia', f => f.input.questions[0].revised.explanation = '');
reject('campo desconhecido no envelope', f => f.input.publish = true);
reject('revisão pendente', f => f.snapshot.reviewState.reviews.push({ id: 'r1', lessonId: f.input.lessonId, status: 'pending_approval' }));
reject('estado de revisão não verificado', f => f.snapshot.reviewState.checked = false);
reject('processamento em andamento', f => f.snapshot.reviewState.index = { lessonId: f.input.lessonId, processingReviewId: 'r1', latestReviewId: null, latestStatus: null });
reject('índice incompleto', f => f.snapshot.reviewState.index = { lessonId: f.input.lessonId });
reject('hash aprovado do índice divergente', f => f.snapshot.reviewState.index = { lessonId: f.input.lessonId, processingReviewId: null, latestReviewId: null, latestStatus: null, approvedHash: 'a'.repeat(64) });
reject('índice sem revisão referenciada', f => f.snapshot.reviewState.index = { lessonId: f.input.lessonId, processingReviewId: null, latestReviewId: 'r1', latestStatus: 'approved' });
reject('representações divergentes', f => { f.snapshot.lesson.challenge.questions[0].text = 'divergente'; rehash(f); });
reject('marcador duplicado', f => { f.snapshot.lesson.content += '[ATHENA_CHALLENGE]'; rehash(f); });
reject('desafio fora do bloco 5', f => { f.snapshot.lesson.content = f.snapshot.lesson.content.replace('[BLOCK_5]', '[BLOCK_6]').replace(/\[BLOCK_6\](?=\nRevisão)/, '[BLOCK_5]'); rehash(f); });
test('preserva todos os blocos, metadados, campos opcionais e questões intactas', () => {
  const f = syntheticFixture(); const r = dryRun(f.snapshot, f.input); assert.equal(r.ok, true);
  const a = embedded(f.snapshot.lesson.content), b = embedded(r.proposedLesson.content);
  assert.equal(f.snapshot.lesson.content.slice(0, a.start), r.proposedLesson.content.slice(0, b.start));
  assert.equal(f.snapshot.lesson.content.slice(a.end), r.proposedLesson.content.slice(b.end));
  assert.deepEqual(b.challenge, r.proposedLesson.challenge);
  for (const key of Object.keys(f.snapshot.lesson)) if (!['challenge', 'content'].includes(key)) assert.deepEqual(r.proposedLesson[key], f.snapshot.lesson[key]);
  for (const key of ['id', 'subject', 'provenance']) assert.deepEqual(r.proposedLesson.challenge.questions[0][key], f.snapshot.lesson.challenge.questions[0][key]);
  assert.deepEqual(r.proposedLesson.challenge.questions[1], f.snapshot.lesson.challenge.questions[1]);
});
test('dry-run não altera entradas nem compartilha objetos mutáveis', () => {
  const f = syntheticFixture(), before = JSON.stringify(f);
  const r = dryRun(f.snapshot, f.input); assert.equal(r.ok, true);
  r.proposedLesson.challenge.questions[0].text = 'mutação da proposta';
  r.proposedLesson.otherMetadata.preserve = false;
  assert.equal(r.backupPlan.document.otherMetadata.preserve, true);
  r.backupPlan.document.subject = 'mutação do backup em memória';
  assert.equal(JSON.stringify(f), before);
});
test('nenhuma alteração mantém conteúdo byte a byte', () => {
  const f = syntheticFixture(); f.input.questions[0].revised = structuredClone(f.input.questions[0].original); f.input.questions[0].approvedChanges = [];
  const r = dryRun(f.snapshot, f.input); assert.equal(r.ok, true);
  assert.deepEqual(r.fieldsToUpdate, []); assert.equal(r.proposedLesson.content, f.snapshot.lesson.content);
});
test('alternativa alterada na mesma posição com aprovação explícita', () => {
  const f = syntheticFixture(); f.input.questions[0].revised.options[1] = 'Alternativa B revisada'; f.input.questions[0].approvedChanges.push({ field: 'options[1]', reason: 'Revisão aprovada' });
  assert.equal(dryRun(f.snapshot, f.input).ok, true);
});
test('revisão terminal consistente permitida', () => {
  const f = syntheticFixture(); f.snapshot.reviewState = { checked: true, index: { lessonId: f.input.lessonId, processingReviewId: null, latestReviewId: 'r1', latestStatus: 'approved' }, reviews: [{ id: 'r1', lessonId: f.input.lessonId, status: 'approved' }] };
  assert.equal(dryRun(f.snapshot, f.input).ok, true);
});
test('CLI rejeita escrita e argumentos desconhecidos', () => {
  for (const args of [[], ['--write'], ['--apply'], ['--dry-run', '--snapshot', 'x', '--input', 'y', '--publish']]) assert.equal(main(args).ok, false);
});
test('JSON impede perda de precisão e poluição de protótipo', () => {
  assert.throws(() => parseStrict('{"n":9007199254740993}'));
  assert.throws(() => parseStrict('\u00a0{}'));
  const parsed = parseStrict('{"__proto__":{"polluted":true}}');
  assert.equal(Object.hasOwn(parsed, '__proto__'), true);
  assert.equal({}.polluted, undefined);
});
test('hash do plano determinístico vincula aprovação e snapshot', () => {
  const f = syntheticFixture(); const first = dryRun(f.snapshot, f.input);
  assert.equal(first.planSha256, dryRun(f.snapshot, f.input).planSha256);
  f.input.audit.approvalReference = 'outra aprovação';
  assert.notEqual(first.planSha256, dryRun(f.snapshot, f.input).planSha256);
});
test('CLI offline com fixtures documentadas: sucesso e nenhum arquivo criado/alterado', () => {
  const files = ['docs/revised-question-import-example.json', 'docs/revised-question-import-snapshot.example.json'];
  const before = files.map(p => readFileSync(p, 'utf8')); const entries = readdirSync('docs');
  const p = spawnSync(process.execPath, ['scripts/import-reviewed-questions.mjs', '--dry-run', '--snapshot', files[1], '--input', files[0]], { encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr); assert.equal(JSON.parse(p.stdout).ok, true);
  assert.deepEqual(files.map(p => readFileSync(p, 'utf8')), before); assert.deepEqual(readdirSync('docs'), entries);
});
