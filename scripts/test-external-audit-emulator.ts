import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDocFromServer, deleteDoc, terminate } from 'firebase/firestore';
import { Firestore } from '@google-cloud/firestore';
import { persistCeoCatalogLesson } from '../src/services/persistCeoCatalogLesson';
import { readCeoMarkdown } from '../src/lib/ceoLessonEditing';
import { extractBalancedJson } from '../src/lib/objectiveChallenge';
import { FirestoreInternalCatalogService } from '../src/api/internalCatalogRoutes';
import { executeConsultarAula } from '../athena-mcp-service/src/tools';
import { syntheticFixture } from './revised-question-import-fixtures.mjs';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8189' || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') throw Error('Exclusivamente emuladores locais.');
const projectId = 'demo-athena-question-import', databaseId = 'ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb';
const admin = new Firestore({ projectId, databaseId, host: '127.0.0.1:8189', ssl: false, credentials: { client_email: 'synthetic@example.invalid', private_key: 'unused-emulator' } });
const rulesAdmin = new Firestore({ projectId, host: '127.0.0.1:8189', ssl: false, credentials: { client_email: 'synthetic@example.invalid', private_key: 'unused-emulator' } });
const apps: ReturnType<typeof initializeApp>[] = [], clients: ReturnType<typeof getFirestore>[] = [];
const clean = (value: any): any => JSON.parse(JSON.stringify(value));
let ceo: ReturnType<typeof getFirestore>, student: ReturnType<typeof getFirestore>;
let rulesCeo: ReturnType<typeof getFirestore>;
const lesson = syntheticFixture().snapshot.lesson;
lesson.id = 'day_88_part_0'; lesson.day = 88; lesson.approvedBy = 'jhonny.spider@gmail.com';
const review = { lessonId: lesson.id, status: 'pending_approval', candidateContent: 'Candidato sintético preservado', unknownLegacy: { keep: true } };
test.before(async () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const r = await fetch(`http://127.0.0.1:8189/emulator/v1/projects/${projectId}:securityRules`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content: rules }] } }) });
  assert.equal(r.status, 200); const body: any = await r.json(); assert.ok(!body.issues?.some((i: any) => i.severity === 'ERROR'));
  for (const [name, email] of [['ceo', 'jhonny.spider@gmail.com'], ['student', 'synthetic-student@example.invalid']]) {
    const app = initializeApp({ projectId, apiKey: 'synthetic-local', authDomain: 'localhost' }, 'external-' + name); apps.push(app);
    const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    await createUserWithEmailAndPassword(auth, email, 'Synthetic-local-123!');
    const db = getFirestore(app, databaseId); connectFirestoreEmulator(db, '127.0.0.1', 8189); clients.push(db);
    // This installed emulator applies its securityRules endpoint to (default).
    // Exercise that exact rules engine separately from named-database persistence.
    const secured = getFirestore(app); connectFirestoreEmulator(secured, '127.0.0.1', 8189); clients.push(secured);
    if (name === 'ceo') { ceo = db; rulesCeo = secured; } else student = secured;
  }
  await admin.collection('homologated_lessons').doc(lesson.id).set({ ...lesson, blocks: readCeoMarkdown(lesson.content).blocks });
  await admin.collection('legal_reviews').doc('external-flow-pending').set(review);
  await admin.collection('legal_reviews').doc('external-flow-failed').set({ ...review, status: 'failed' });
  await admin.collection('legal_review_index').doc(lesson.id).set({ status: 'pending_approval', latestReviewId: 'external-flow-pending' });
  await rulesAdmin.collection('homologated_lessons').doc(lesson.id).set(lesson);
});
test('CEO edits and publishes despite pending review; exact Markdown, metadata, answers and blocks persist', async () => {
  const edited = { ...lesson, content: lesson.content.replace('Lei sintética', 'Lei sintética — correção externa aprovada'), approvedAt: 2 };
  const saved = await persistCeoCatalogLesson(ceo, edited, clean);
  const data = (await getDocFromServer(doc(ceo, 'homologated_lessons', lesson.id))).data()!;
  assert.equal(data.content, edited.content); assert.deepEqual(data.challenge, lesson.challenge); assert.deepEqual(data.otherMetadata, lesson.otherMetadata);
  assert.equal(data.version, 2); assert.equal(saved.version, 2); assert.equal(data.approvedAt, 2);
  assert.deepEqual(data.blocks, readCeoMarkdown(edited.content).blocks);
  assert.deepEqual((await admin.collection('legal_reviews').doc('external-flow-pending').get()).data(), review);
  assert.deepEqual((await admin.collection('legal_review_index').doc(lesson.id).get()).data(), { status: 'pending_approval', latestReviewId: 'external-flow-pending' });
  const catalog = new FirestoreInternalCatalogService();
  // Bind the real service to the synthetic named database, never initialize production ADC.
  (catalog as any).firestoreInstance = admin;
  const result = await executeConsultarAula(catalog as any, { lessonId: lesson.id });
  assert.equal(result.content, edited.content); assert.equal(result.metadata.version, 2);
});
test('Student and anonymous callers cannot forge approvedBy or delete official content', async () => {
  await assert.rejects(persistCeoCatalogLesson(student, lesson, clean), /permission|PERMISSION/i);
  await assert.rejects(deleteDoc(doc(student, 'homologated_lessons', lesson.id)), /permission|PERMISSION/i);
  const app = initializeApp({ projectId, apiKey: 'synthetic-local' }, 'external-anonymous'); apps.push(app);
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8189); clients.push(db);
  await assert.rejects(setDoc(doc(db, 'homologated_lessons', 'day_89_part_0'), { ...lesson, id: 'day_89_part_0', day: 89 }), /permission|PERMISSION/i);
});
test('Question correction preserves all other questions, answers, prose and failed review', async () => {
  const current: any = (await admin.collection('homologated_lessons').doc(lesson.id).get()).data();
  const changed = structuredClone(current.challenge); changed.questions[0].explanation += ' Correção aprovada.';
  const start = current.content.indexOf('{', current.content.indexOf('[ATHENA_CHALLENGE]'));
  const end = extractBalancedJson(current.content, start)!.end;
  const content = current.content.slice(0, start) + JSON.stringify(changed) + current.content.slice(end);
  await persistCeoCatalogLesson(ceo, { ...current, content, challenge: changed }, clean);
  const saved = (await admin.collection('homologated_lessons').doc(lesson.id).get()).data()!;
  assert.equal(saved.content, content); assert.deepEqual(saved.challenge, changed);
  assert.deepEqual(saved.challenge.questions.slice(1), current.challenge.questions.slice(1));
  assert.deepEqual(saved.challenge.questions.map((q: any) => q.correctIndex), current.challenge.questions.map((q: any) => q.correctIndex));
  assert.deepEqual((await admin.collection('legal_reviews').doc('external-flow-failed').get()).data(), { ...review, status: 'failed' });
});
test('Invalid transaction leaves lesson and catalog unchanged', async () => {
  const before = (await rulesAdmin.collection('homologated_lessons').doc(lesson.id).get()).data();
  const part = (await rulesAdmin.collection('homologated_parts').doc(lesson.id).get()).data();
  await assert.rejects(persistCeoCatalogLesson(rulesCeo, { ...lesson, subject: 'X'.repeat(201) }, clean), /permission|PERMISSION/i);
  assert.deepEqual((await rulesAdmin.collection('homologated_lessons').doc(lesson.id).get()).data(), before);
  assert.deepEqual((await rulesAdmin.collection('homologated_parts').doc(lesson.id).get()).data(), part);
});
test.after(async () => { for (const db of clients) await terminate(db); for (const app of apps) await deleteApp(app); await admin.terminate(); await rulesAdmin.terminate(); });
