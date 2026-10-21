import test from 'node:test';
import assert from 'node:assert/strict';
import { ceoEditorMarkdown, exactPublishedLesson, readCeoMarkdown } from '../src/lib/ceoLessonEditing';
import { cloudMayReplaceLocal, mayPersistCatalogLesson } from '../src/lib/lessonLoad';
import { extractChallengeFromText } from '../src/lib/objectiveChallenge';
import { refreshPublishedQuestions } from '../src/lib/questionCacheRefresh';
import { syntheticFixture } from './revised-question-import-fixtures.mjs';
import { extractBalancedJson } from '../src/lib/objectiveChallenge';

export function fixture() { return structuredClone(syntheticFixture().snapshot.lesson); }
test('Editor opens all questions from a display-only message', () => {
  const l = fixture();
  const text = l.content.replace(/\[ATHENA_CHALLENGE\][\s\S]*?(?=\[BLOCK_6\])/, '');
  assert.deepEqual(readCeoMarkdown(ceoEditorMarkdown({ content: text, challenge: l.challenge })).challenge, l.challenge);
});
test('Manual Markdown and approved legal wording are preserved byte for byte', () => {
  const l = fixture(); l.content = l.content.replace('[BLOCK_2]', '[BLOCK_2]\n\n\nTexto aprovado: Futuro Magistrado.');
  const result = exactPublishedLesson(l);
  assert.equal(result.content, l.content); assert.deepEqual(result.challenge, l.challenge);
});
test('Canonical and legacy embedded JSON remain in the original location', () => {
  const l = fixture(); const original = l.content;
  const start = original.indexOf('[ATHENA_CHALLENGE]');
  const end = extractBalancedJson(original, start)!.end;
  const legacy = original.slice(0, start) + original.slice(end) + '\n' + original.slice(start, end);
  for (const content of [original, legacy]) assert.equal(exactPublishedLesson({ ...l, content }).content, content);
});
test('Duplicate JSON and invalid questions fail closed', () => {
  const l = fixture(); assert.throws(() => readCeoMarkdown(l.content + '\n[ATHENA_CHALLENGE]\n{}'), /duplicado/);
  assert.throws(() => readCeoMarkdown(l.content.replace(/"correctIndex":\s*0/, '"correctIndex":99')), /incompatível/);
});
test('Divergent structured questions cannot overwrite edited JSON', () => {
  const l = fixture(); l.challenge.questions[0].explanation += ' divergência';
  assert.throws(() => exactPublishedLesson(l), /divergentes/);
});
test('Display blocks track Markdown without modifying questions or answers', () => {
  const l = fixture(); l.blocks = Array(6).fill('display anterior');
  const original = structuredClone(l.challenge);
  const saved = exactPublishedLesson(l); assert.deepEqual(saved.blocks, readCeoMarkdown(l.content).blocks); assert.deepEqual(saved.challenge, original);
});
test('Oversized lesson is refused instead of truncated', () => {
  const l = fixture(); l.content = l.content.replace('[BLOCK_1]', '[BLOCK_1]' + 'á'.repeat(500000));
  assert.throws(() => exactPublishedLesson(l), /limite seguro/);
});
test('Unknown blocks fail closed', () => { const l = fixture(); l.blocks = [{ text: 'unknown' }]; assert.throws(() => exactPublishedLesson(l), /blocks/); });
test('Published Markdown refreshes cache with new publication stamp', async () => {
  const local = fixture(); const remote = { ...local, approvedAt: local.approvedAt + 1, content: local.content + '\nAtualizado.' };
  let cached = local;
  const result = await refreshPublishedQuestions({ shown: local, readServer: async () => remote, current: () => cached, canReplace: cloudMayReplaceLocal, writeLocal: async value => { cached = value; } });
  assert.deepEqual(result, remote); assert.deepEqual(cached, remote);
});
test('Offline and pending local edits survive refresh', async () => {
  for (const pendingCloud of [false, true]) {
    const local = { ...fixture(), pendingCloud }; let writes = 0;
    const result = await refreshPublishedQuestions({ shown: local, readServer: async () => { if (!pendingCloud) throw Error('offline'); return { ...local, approvedAt: local.approvedAt + 1 }; }, current: () => local, canReplace: cloudMayReplaceLocal, writeLocal: async () => { writes++; } });
    assert.deepEqual(result, local); assert.equal(writes, 0);
  }
});
test('Catalog restoration cannot overwrite pending local edits', () => {
  const local = { ...fixture(), pendingCloud: true };
  const remote = { ...local, pendingCloud: false, approvedAt: local.approvedAt + 1 };
  assert.equal(mayPersistCatalogLesson('found', local, remote), false);
});
test('Editor uses the original publication when display parsing removed JSON metadata', () => {
  const l = fixture();
  const displayed = { content: extractChallengeFromText(l.content).content, challenge: extractChallengeFromText(l.content).challenge };
  assert.equal(ceoEditorMarkdown(displayed, l), l.content);
});
