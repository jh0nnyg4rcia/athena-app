import test from 'node:test';
import assert from 'node:assert/strict';
import { Firestore } from '@google-cloud/firestore';
import { randomUUID } from 'node:crypto';
import { syntheticFixture } from './revised-question-import-fixtures.mjs';
import { sha256, contentSha256, embedded } from './import-reviewed-questions.mjs';
import { ATHENA_TARGET, createEmulatorFirestoreAdapter, previewPublication, createOfflinePublisher, recoverBackupInMemory } from './publish-reviewed-questions.mjs';

// Endereço e projeto fixos: nenhuma descoberta de credenciais ou fallback remoto.
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8189') throw Error('Exige FIRESTORE_EMULATOR_HOST=127.0.0.1:8189');
const db = new Firestore({ projectId: 'demo-athena-question-import', databaseId: ATHENA_TARGET.databaseId, host: '127.0.0.1:8189', ssl: false, credentials: { client_email: 'synthetic@example.invalid', private_key: 'unused-emulator' } });
const adapter = createEmulatorFirestoreAdapter(db);
let part = 0;
async function fixture(blocks = false, legacy = false) {
  const f = syntheticFixture(); const lesson = f.snapshot.lesson;
  lesson.id = `day_99_part_${part++}`; lesson.day = 99; lesson.part = part - 1;
  if (legacy) {
    const c = lesson.content, s = embedded(c), marker = c.indexOf('[ATHENA_CHALLENGE]');
    lesson.content = c.slice(0, marker) + c.slice(s.end) + '\n[ATHENA_CHALLENGE]\n' + c.slice(s.start, s.end) + '\n';
    f.input.originalContentSha256 = contentSha256(lesson.content);
  }
  if (blocks) {
    const marks = [...lesson.content.matchAll(/\[BLOCK_\d+\]/g)];
    lesson.blocks = marks.map((m, n) => lesson.content.slice(m.index + m[0].length, marks[n + 1]?.index ?? lesson.content.length).trim());
  }
  f.input.lessonId = lesson.id; f.input.originalLessonSha256 = sha256(lesson);
  const ref = db.collection('homologated_lessons').doc(lesson.id);
  await ref.create(lesson);
  const plan = await previewPublication(adapter, f.input);
  const auth = { action: 'publish-reviewed-questions', authorizationId: randomUUID(), actorUid: 'synthetic-ceo', lessonId: lesson.id, target: adapter.target, planSha256: plan.planSha256, approvedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString() };
  const publisher = createOfflinePublisher(adapter, { verifyAuthorization: a => a.actorUid === 'synthetic-ceo' });
  return { ...f, ref, plan, auth, publisher };
}
test('Firestore Emulator: banco nomeado, backup, sincronização, preservação e repetição', async () => {
  const f = await fixture(true); const before = (await f.ref.get()).data();
  const receipt = await f.publisher.publish(f.plan, f.auth);
  const after = (await f.ref.get()).data(); const backup = (await db.collection('question_import_backups').doc(receipt.backupId).get()).data();
  assert.deepEqual(recoverBackupInMemory(backup), before);
  assert.equal(db.databaseId, ATHENA_TARGET.databaseId);
  assert.deepEqual(embedded(after.content).challenge, after.challenge);
  assert.deepEqual(after.blocks, f.plan.proposed.blocks);
  for (const k of Object.keys(before)) if (!['challenge', 'content', 'blocks'].includes(k)) assert.deepEqual(after[k], before[k]);
  assert.equal((await f.publisher.publish(f.plan, f.auth)).repeated, true);
});
test('Firestore Emulator: rejeita autorização sem gravar aula/backup', async () => {
  const f = await fixture(); await assert.rejects(f.publisher.publish(f.plan, { ...f.auth, actorUid: 'aluno' }));
  assert.deepEqual((await f.ref.get()).data(), f.snapshot.lesson);
  assert.equal((await db.collection('question_import_receipts').doc(f.plan.planSha256).get()).exists, false);
});
test('Firestore Emulator: falha após staging reverte transação inteira', async () => {
  const f = await fixture();
  const failing = { ...adapter, runTransaction: callback => db.runTransaction(async nativeTx => {
    // Usa o adaptador real, substituindo apenas a execução para provocar falha após staging.
    const proxy = Object.create(db); proxy.runTransaction = fn => fn(nativeTx);
    const wrapped = createEmulatorFirestoreAdapter(proxy);
    await wrapped.runTransaction(callback); throw Error('falha sintética antes do commit');
  }) };
  await assert.rejects(createOfflinePublisher(failing, { verifyAuthorization: () => true }).publish(f.plan, f.auth), /falha sintética/);
  assert.deepEqual((await f.ref.get()).data(), f.snapshot.lesson);
  assert.equal((await db.collection('question_import_receipts').doc(f.plan.planSha256).get()).exists, false);
});
test('Firestore Emulator: duas publicações simultâneas comprometem uma operação idempotente', async () => {
  const f = await fixture();
  const results = await Promise.allSettled([f.publisher.publish(f.plan, f.auth), f.publisher.publish(f.plan, f.auth)]);
  assert.ok(results.some(r => r.status === 'fulfilled'));
  assert.equal((await db.collection('question_import_receipts').doc(f.plan.planSha256).get()).data().afterLessonSha256, sha256((await f.ref.get()).data()));
  assert.equal((await f.publisher.publish(f.plan, f.auth)).repeated, true);
});
test('Firestore Emulator: planos diferentes simultâneos não sobrescrevem um ao outro', async () => {
  const f = await fixture(); const alternative = structuredClone(f.input);
  alternative.questions[0].revised.explanation = 'Outra alteração sintética aprovada.';
  const otherPlan = await previewPublication(adapter, alternative);
  const otherAuth = { ...f.auth, authorizationId: randomUUID(), planSha256: otherPlan.planSha256 };
  const results = await Promise.allSettled([f.publisher.publish(f.plan, f.auth), f.publisher.publish(otherPlan, otherAuth)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter(r => r.status === 'rejected').length, 1);
  const winner = results.find(r => r.status === 'fulfilled').value;
  assert.equal(sha256((await f.ref.get()).data()), winner.afterLessonSha256);
  const receipts = await db.collection('question_import_receipts').where('lessonId', '==', f.input.lessonId).get();
  assert.equal(receipts.size, 1);
});
test('Firestore Emulator: revisão por bloco criada após prévia bloqueia publicação', async () => {
  const f = await fixture(); const scope = `${f.input.lessonId}_block_4`;
  await db.collection('legal_review_index').doc(scope).create({ lessonId: scope, processingReviewId: 'synthetic-review', latestReviewId: 'synthetic-review', latestStatus: 'processing' });
  await assert.rejects(f.publisher.publish(f.plan, f.auth), /Conflito/);
  assert.deepEqual((await f.ref.get()).data(), f.snapshot.lesson);
});
test('Firestore Emulator: conflito simultâneo de versão invalida o plano', async () => {
  const f = await fixture();
  await db.runTransaction(async tx => { await tx.get(f.ref); tx.update(f.ref, { version: 2 }); });
  await assert.rejects(f.publisher.publish(f.plan, f.auth), /Conflito/);
  assert.equal((await f.ref.get()).data().version, 2);
});
test('Firestore Emulator: legado preserva posição, demais blocos e backup recuperável', async () => {
  const f = await fixture(true, true);
  const receipt = await f.publisher.publish(f.plan, f.auth);
  const after = (await f.ref.get()).data();
  assert.equal(embedded(after.content).layout, 'legacy-after-block-6');
  assert.deepEqual(after.blocks.slice(0, 5), f.snapshot.lesson.blocks.slice(0, 5));
  assert.notEqual(after.blocks[5], f.snapshot.lesson.blocks[5]);
  assert.deepEqual(embedded(after.content).challenge, after.challenge);
  const backup = (await db.collection('question_import_backups').doc(receipt.backupId).get()).data();
  assert.deepEqual(recoverBackupInMemory(backup), f.snapshot.lesson);
});
test.after(async () => { await db.terminate(); });
