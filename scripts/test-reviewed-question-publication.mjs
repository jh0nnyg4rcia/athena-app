import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticFixture } from './revised-question-import-fixtures.mjs';
import { contentSha256, sha256, embedded } from './import-reviewed-questions.mjs';
import { ATHENA_TARGET, PRODUCTION_PUBLICATION_ENABLED, createProductionPublisher, createEmulatorFirestoreAdapter, createOfflinePublisher, previewPublication, recoverBackupInMemory } from './publish-reviewed-questions.mjs';

const copy = x => structuredClone(x);
const instant = Date.parse('2026-10-12T13:00:00Z');

// Implementação sintética da interface Firestore: não carrega SDK nem abre sockets.
class FakeFirestore {
  projectId = 'demo-athena-question-import';
  databaseId = ATHENA_TARGET.databaseId;
  _settings = { host: '127.0.0.1:8089', ssl: false };
  docs = new Map(); revision = 0; events = []; failBackup = false; corruptBackup = false;
  failTransaction = false; beforeTransaction = null; beforeCommit = null;
  constructor(lesson) { this.docs.set(`homologated_lessons/${lesson.id}`, copy(lesson)); }
  snapshot(path, map = this.docs) { return { id: path.split('/')[1], exists: map.has(path), data: () => copy(map.get(path)) }; }
  collection(name) {
    const db = this;
    const query = filters => ({ collection: name, filters, where: (field, op, value) => query([...filters, [field, op, value]]), get: () => db.get(query(filters)) });
    return { ...query([]), doc: id => ({ path: `${name}/${id}`, get: () => db.get({ path: `${name}/${id}` }), create: async data => {
      db.events.push('backup-create');
      if (db.failBackup) throw new Error('backup indisponível');
      const path = `${name}/${id}`;
      if (db.docs.has(path)) throw Object.assign(new Error('já existe'), { code: 6 });
      db.docs.set(path, copy(data)); db.revision++;
    } }) };
  }
  async get(ref, map = this.docs) {
    if (ref.path) {
      if (ref.path.startsWith('question_import_backups/')) {
        this.events.push('backup-read');
        if (this.corruptBackup) return { exists: true, data: () => ({ stateSha256: 'corrompido' }) };
      }
      return this.snapshot(ref.path, map);
    }
    const docs = [...map].filter(([path, data]) => path.startsWith(ref.collection + '/') && ref.filters.every(([field, op, v]) => op === 'in' ? v.includes(data[field]) : op === '>=' ? data[field] >= v : data[field] <= v)).map(([path]) => this.snapshot(path, map));
    return { docs };
  }
  async runTransaction(callback) {
    this.events.push('transaction-start');
    if (this.beforeTransaction) { const hook = this.beforeTransaction; this.beforeTransaction = null; hook(this); }
    const initialRevision = this.revision, shadow = copy(this.docs);
    let writesStarted = false;
    const tx = {
      get: r => { assert.equal(writesStarted, false, 'todas as leituras devem preceder escritas'); return this.get(r, shadow); },
      update: (r, patch) => {
        writesStarted = true; this.events.push('update-staged');
        assert.ok(shadow.has(r.path)); const lesson = shadow.get(r.path);
        for (const [key, value] of Object.entries(patch)) {
          assert.ok(['challenge.questions', 'content', 'blocks'].includes(key));
          if (key === 'challenge.questions') lesson.challenge.questions = copy(value);
          else lesson[key] = copy(value);
        }
      },
      create: (r, data) => { writesStarted = true; assert.equal(shadow.has(r.path), false); shadow.set(r.path, copy(data)); }
    };
    const result = await callback(tx);
    if (this.beforeCommit) { const hook = this.beforeCommit; this.beforeCommit = null; hook(this); }
    if (this.failTransaction || initialRevision !== this.revision) throw new Error('transação abortada sem commit');
    this.docs = shadow; this.revision++; this.events.push('commit');
    return result;
  }
}
function setup() {
  const f = syntheticFixture(); const db = new FakeFirestore(f.snapshot.lesson);
  const adapter = createEmulatorFirestoreAdapter(db);
  const publisher = createOfflinePublisher(adapter, { now: () => instant, verifyAuthorization: auth => auth.actorUid === 'synthetic-ceo' });
  return { ...f, db, adapter, publisher };
}
async function approved(f) {
  const plan = await previewPublication(f.adapter, f.input, '2026-10-12T12:45:00Z');
  const auth = { action: 'publish-reviewed-questions', authorizationId: 'synthetic-auth-1', actorUid: 'synthetic-ceo', lessonId: plan.lessonId, target: plan.target, planSha256: plan.planSha256, approvedAt: '2026-10-12T12:50:00Z', expiresAt: '2026-10-12T14:00:00Z' };
  return { plan, auth };
}
const lessonNow = f => f.db.docs.get(`homologated_lessons/${f.input.lessonId}`);
const noPublication = (f, before) => { assert.deepEqual(lessonNow(f), before); assert.equal([...f.db.docs.keys()].some(k => k.startsWith('question_import_receipts/')), false); assert.equal([...f.db.docs.keys()].some(k => k.startsWith('question_import_authorizations/')), false); };

test('backup confirmado antes da gravação; publicação atômica e relatório completo', async () => {
  const f = setup(), before = copy(lessonNow(f)), { plan, auth } = await approved(f);
  const receipt = await f.publisher.publish(plan, auth);
  const backup = f.db.docs.get(`question_import_backups/${receipt.backupId}`);
  assert.deepEqual(backup.state.lesson, before); assert.equal(backup.lessonSha256, sha256(before));
  const recovered = recoverBackupInMemory(backup); assert.deepEqual(recovered, before);
  recovered.subject = 'edição local'; assert.equal(backup.state.lesson.subject, before.subject);
  const corrupted = copy(backup); corrupted.state.lesson.subject = 'corrompido'; assert.throws(() => recoverBackupInMemory(corrupted));
  assert.ok(f.db.events.indexOf('backup-read') < f.db.events.indexOf('update-staged'));
  assert.deepEqual(receipt.fieldsModified, ['challenge.questions', 'content']);
  assert.equal(receipt.beforeLessonSha256, sha256(before)); assert.equal(receipt.afterLessonSha256, sha256(lessonNow(f)));
  assert.equal(receipt.previousVersion, receipt.resultingVersion);
  assert.deepEqual(embedded(lessonNow(f).content).challenge, lessonNow(f).challenge);
  for (const k of Object.keys(before)) if (!['content', 'challenge'].includes(k)) assert.deepEqual(lessonNow(f)[k], before[k]);
  assert.equal(receipt.production, false);
});
for (const flag of ['failBackup', 'corruptBackup']) test(`interrompe quando ${flag}`, async () => {
  const f = setup(), before = copy(lessonNow(f)), p = await approved(f); f.db[flag] = true;
  await assert.rejects(f.publisher.publish(p.plan, p.auth)); noPublication(f, before);
  assert.equal(f.db.events.includes('update-staged'), false);
});
for (const [name, mutate] of [
  ['versão', l => l.version++], ['hash', l => l.otherMetadata.preserve = false], ['questões', l => l.challenge.questions[0].text = 'divergente']
]) test(`conflito atualizado de ${name}`, async () => {
  const f = setup(), p = await approved(f); mutate(lessonNow(f)); const before = copy(lessonNow(f));
  await assert.rejects(f.publisher.publish(p.plan, p.auth), /Conflito/); noPublication(f, before);
  assert.equal(f.db.events.includes('backup-create'), false);
});
for (const scopeSuffix of ['', '_block_4']) test(`revisão administrativa pendente ${scopeSuffix || 'da aula'}`, async () => {
  const f = setup(), scope = f.input.lessonId + scopeSuffix;
  f.db.docs.set('legal_reviews/rev1', { lessonId: scope, status: 'pending_approval' });
  f.db.docs.set(`legal_review_index/${scope}`, { lessonId: scope, processingReviewId: null, latestReviewId: 'rev1', latestStatus: 'pending_approval' });
  await assert.rejects(previewPublication(f.adapter, f.input), /pendente|andamento/);
});
test('revisão criada depois do backup bloqueia a transação', async () => {
  const f = setup(), before = copy(lessonNow(f)), p = await approved(f);
  f.db.beforeTransaction = db => { const scope = f.input.lessonId + '_block_0'; db.docs.set(`legal_review_index/${scope}`, { lessonId: scope, processingReviewId: 'r1', latestReviewId: 'r1', latestStatus: 'processing' }); db.revision++; };
  await assert.rejects(f.publisher.publish(p.plan, p.auth), /Conflito transacional/); noPublication(f, before);
});
test('falha após staging não deixa aula, recibo ou autorização parcialmente gravados', async () => {
  const f = setup(), before = copy(lessonNow(f)), p = await approved(f); f.db.failTransaction = true;
  await assert.rejects(f.publisher.publish(p.plan, p.auth), /abortada/); noPublication(f, before);
  assert.ok([...f.db.docs.keys()].some(k => k.startsWith('question_import_backups/')));
  f.db.failTransaction = false; assert.equal((await f.publisher.publish(p.plan, p.auth)).repeated, false);
});
test('concorrência no commit aborta todas as escritas', async () => {
  const f = setup(), before = copy(lessonNow(f)), p = await approved(f);
  f.db.beforeCommit = db => { db.revision++; };
  await assert.rejects(f.publisher.publish(p.plan, p.auth), /abortada/); noPublication(f, before);
});
test('mesma importação retorna recibo sem segunda escrita', async () => {
  const f = setup(), p = await approved(f); const first = await f.publisher.publish(p.plan, p.auth);
  const size = f.db.docs.size, revision = f.db.revision;
  const second = await f.publisher.publish(p.plan, p.auth);
  assert.equal(second.repeated, true); assert.equal(second.afterLessonSha256, first.afterLessonSha256);
  assert.equal(f.db.docs.size, size); assert.equal(f.db.revision, revision);
  lessonNow(f).subject = 'alterado posteriormente';
  await assert.rejects(f.publisher.publish(p.plan, p.auth), /alteração posterior/);
});
for (const [name, mutate] of [
  ['ausente', p => { p.auth = null; }], ['outro plano', p => p.auth.planSha256 = '0'.repeat(64)],
  ['identidade não CEO', p => p.auth.actorUid = 'aluno'], ['expirada', p => p.auth.expiresAt = '2026-10-12T12:00:00Z'],
  ['outro destino', p => p.auth.target = ATHENA_TARGET], ['plano adulterado', p => p.plan.patch.content = 'adulterado']
]) test(`rejeita autorização ${name}`, async () => {
  const f = setup(), before = copy(lessonNow(f)), p = await approved(f); mutate(p);
  await assert.rejects(f.publisher.publish(p.plan, p.auth)); noPublication(f, before);
  assert.equal(f.db.events.includes('backup-create'), false);
});
function rawBlocks(content) { const marks = [...content.matchAll(/\[BLOCK_\d+\]/g)]; return marks.map((m, n) => content.slice(m.index + m[0].length, marks[n + 1]?.index ?? content.length).trim()); }
function withBlocks(f, remove) {
  const lesson = lessonNow(f); let text = lesson.content;
  if (remove) { const s = embedded(text); text = (text.slice(0, text.indexOf('[ATHENA_CHALLENGE]')) + text.slice(s.end)).replace(/\n{3,}/g, '\n\n'); }
  lesson.blocks = rawBlocks(text); f.input.originalLessonSha256 = sha256(lesson);
}
for (const remove of [false, true]) test(`sincronização de blocks ${remove ? 'sem JSON' : 'brutos'}`, async () => {
  const f = setup(); withBlocks(f, remove); const before = copy(lessonNow(f).blocks), p = await approved(f);
  const receipt = await f.publisher.publish(p.plan, p.auth);
  assert.deepEqual(lessonNow(f).blocks, p.plan.proposed.blocks);
  if (remove) { assert.deepEqual(lessonNow(f).blocks, before); assert.equal(receipt.fieldsModified.includes('blocks'), false); }
  else { assert.notEqual(lessonNow(f).blocks[4], before[4]); assert.equal(receipt.fieldsModified.includes('blocks'), true); }
  before.forEach((b, n) => { if (n !== 4) assert.equal(lessonNow(f).blocks[n], b); });
});
test('blocks divergentes exigem intervenção, sem reparo silencioso', async () => {
  const f = setup(); withBlocks(f, true); lessonNow(f).blocks[2] += ' divergência'; f.input.originalLessonSha256 = sha256(lessonNow(f));
  await assert.rejects(previewPublication(f.adapter, f.input), /blocks diverge/);
});
test('tentativa de injetar marcador nas questões é rejeitada', async () => {
  const f = setup(); f.input.questions[0].revised.explanation = '[BLOCK_6]';
  await assert.rejects(previewPublication(f.adapter, f.input), /Marcador|sincronizado/);
});
test('backup alterado dentro da janela transacional bloqueia publicação', async () => {
  const f = setup(), before = copy(lessonNow(f)), p = await approved(f);
  f.db.beforeTransaction = db => { const key = [...db.docs.keys()].find(k => k.startsWith('question_import_backups/')); db.docs.get(key).lessonSha256 = 'corrompido'; db.revision++; };
  await assert.rejects(f.publisher.publish(p.plan, p.auth), /Backup alterado/); noPublication(f, before);
});
test('produção permanece bloqueada independentemente de variáveis de ambiente', () => {
  assert.equal(PRODUCTION_PUBLICATION_ENABLED, false); assert.throws(createProductionPublisher, /bloqueada/);
  const db = new FakeFirestore(syntheticFixture().snapshot.lesson);
  db.projectId = ATHENA_TARGET.projectId; assert.throws(() => createEmulatorFirestoreAdapter(db));
  db.projectId = 'demo-athena-question-import'; db._settings.host = 'firestore.googleapis.com:443'; assert.throws(() => createEmulatorFirestoreAdapter(db));
  assert.throws(() => createOfflinePublisher({ mode: 'production' }, { verifyAuthorization: () => true }));
});
test('preview não cria documentos nem modifica entradas', async () => {
  const f = setup(), docs = copy(f.db.docs), input = copy(f.input);
  await previewPublication(f.adapter, f.input); assert.deepEqual(f.db.docs, docs); assert.deepEqual(f.input, input);
  assert.equal(f.db.events.includes('backup-create'), false);
});
test('revisões de outra aula com prefixo semelhante não interferem', async () => {
  const f = setup(); f.db.docs.set('legal_reviews/other', { lessonId: 'day_1_part_01', status: 'processing' });
  f.db.docs.set('legal_review_index/day_1_part_01', { lessonId: 'day_1_part_01' });
  assert.ok((await approved(f)).plan.planSha256);
});
test('tipos especiais não são convertidos silenciosamente no backup', async () => {
  const f = setup(); lessonNow(f).extraTimestamp = new Date();
  await assert.rejects(previewPublication(f.adapter, f.input), /não JSON/);
});
test('autorização expira durante janela entre backup e commit', async () => {
  const f = setup(), p = await approved(f), before = copy(lessonNow(f)); let time = instant;
  const publisher = createOfflinePublisher(f.adapter, { now: () => time, verifyAuthorization: () => true });
  f.db.beforeTransaction = () => { time = Date.parse(p.auth.expiresAt); };
  await assert.rejects(publisher.publish(p.plan, p.auth), /expirada/); noPublication(f, before);
});
test('autorização já consumida rejeita nova transação', async () => {
  const f = setup(), p = await approved(f), before = copy(lessonNow(f));
  f.db.docs.set(`question_import_authorizations/${p.auth.authorizationId}`, { planSha256: 'outro-plano' });
  await assert.rejects(f.publisher.publish(p.plan, p.auth), /já utilizada/);
  assert.deepEqual(lessonNow(f), before);
});
