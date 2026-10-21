import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mayRefreshPublishedQuestions, refreshPublishedQuestions } from '../src/lib/questionCacheRefresh';
import { createQuestionImportAdmin } from '../src/services/questionImportAdmin';
import { resolveDisplayedChallenge, extractChallengeFromText } from '../src/lib/objectiveChallenge';
import { syntheticFixture } from './revised-question-import-fixtures.mjs';
import { dryRun } from './import-reviewed-questions.mjs';
const fixture = () => { const f = syntheticFixture(); return { local: f.snapshot.lesson, cloud: dryRun(f.snapshot, f.input).proposedLesson }; };
test('questões atualizam com mesmo approvedAt/versão e prosa preservada', () => { const {local, cloud} = fixture(); assert.equal(mayRefreshPublishedQuestions(local, cloud), true); });
test('não substitui pendência local, outra prosa ou identidade/carimbo divergente', () => {
  for (const change of [(l: any) => l.pendingCloud = true, (l: any) => l.content += ' edição local', (l: any) => l.approvedAt++, (l: any) => l.version++, (l: any) => l.id = 'day_2_part_0']) {
    const {local, cloud} = fixture(); change(local); assert.equal(mayRefreshPublishedQuestions(local, cloud), false);
  }
});
test('mesma aula não causa regravação', () => { const {local} = fixture(); assert.equal(mayRefreshPublishedQuestions(local, structuredClone(local)), false); });
test('conversa oficial reaberta usa questões atuais sem alterar a mensagem histórica', () => {
  const {local,cloud} = fixture(); const messageContent = extractChallengeFromText(local.content).content;
  const before = JSON.stringify(local);
  const result = resolveDisplayedChallenge({ messageChallenge:local.challenge,messageContent,officialChallenge:cloud.challenge,officialContent:cloud.content,preferOfficialForMatchingContent:true });
  assert.equal(result?.questions[0].correctIndex,1); assert.equal(JSON.stringify(local),before);
  assert.equal(resolveDisplayedChallenge({messageChallenge:local.challenge,messageContent,officialChallenge:cloud.challenge,officialContent:cloud.content})?.questions[0].correctIndex,0);
  assert.equal(resolveDisplayedChallenge({messageChallenge:local.challenge,messageContent:messageContent+' outra prosa',officialChallenge:cloud.challenge,officialContent:cloud.content,preferOfficialForMatchingContent:true})?.questions[0].correctIndex,0);
});
test('reabrir lê armazenamento atualizado; questões são devolvidas já na primeira abertura online', async () => {
  const {local, cloud} = fixture(); let stored = local;
  const result = await refreshPublishedQuestions({ shown: local, readServer: async () => cloud, current: () => stored, canReplace: mayRefreshPublishedQuestions, writeLocal: async value => { stored = structuredClone(value); } });
  assert.deepEqual(result.challenge, cloud.challenge); const reopened = structuredClone(stored); assert.deepEqual(reopened.challenge, cloud.challenge);
});
test('offline mantém cache, sem gravação', async () => {
  const {local} = fixture(); let writes = 0;
  const result = await refreshPublishedQuestions({ shown: local, readServer: async () => { throw Error('offline'); }, current: () => local, canReplace: mayRefreshPublishedQuestions, writeLocal: async () => { writes++; } });
  assert.equal(result, local); assert.equal(writes, 0);
});
test('edição local surgida durante leitura prevalece', async () => {
  const {local, cloud} = fixture(); let current = local; let writes = 0;
  await refreshPublishedQuestions({ shown: local, readServer: async () => { current = {...local, pendingCloud: true}; return cloud; }, current: () => current, canReplace: mayRefreshPublishedQuestions, writeLocal: async () => { writes++; } });
  assert.equal(writes, 0);
});
test('serviço usa leitura autoritativa, espera atualização e preserva cofre desconhecido', () => {
  const source = readFileSync('src/services/curatedLessonService.ts', 'utf8');
  assert.ok(source.includes('getDocFromServer')); assert.ok(source.includes('return refreshHomologatedLesson'));
  assert.ok(source.includes("=== 'not_loaded'"));
});
function backend() {
  const f = syntheticFixture(); const previews = new Map(), approvals = new Map(); let clock = Date.parse('2026-10-12T13:00:00Z');
  const adapter: any = { mode: 'mock', target: {projectId:'demo-athena-question-import',databaseId:'synthetic'}, readState: async () => ({ lesson:f.snapshot.lesson, reviewState:f.snapshot.reviewState, sections:Array.from({length:6},(_,n)=>({scopeId:`${f.input.lessonId}_block_${n}`,index:null,reviews:[]})) }) };
  const admin = createQuestionImportAdmin({ adapter, now: () => clock,
    verifyToken: async token => {
      if (token === 'bad') throw Error('Token inválido');
      return {uid:token === 'other'?'other-uid':'ceo-uid',email:token === 'student'?'aluno@example.invalid':'jhonny.spider@gmail.com',emailVerified:token !== 'unverified'};
    }, records: {
      createPreview: async (id,v) => { assert.equal(previews.has(id),false); previews.set(id,structuredClone(v)); }, readPreview: async id => structuredClone(previews.get(id)),
      createApproval: async (id,v) => { assert.equal(approvals.has(id),false); approvals.set(id,structuredClone(v)); }, readApproval: async id => structuredClone(approvals.get(id))
    }
  });
  return {admin,f,previews,approvals,advance:()=>clock+=20*60_000};
}
test('backend valida token antes de aceitar qualquer declaração JSON', async () => {
  const {admin,f,approvals} = backend(); for (const bearer of ['', 'Bearer bad','Bearer student','Bearer unverified']) await assert.rejects(admin.preview(bearer,f.input));
  await assert.rejects(admin.publish('Bearer ceo','json-forjado')); assert.equal(approvals.size,0);
});
test('backend armazena prévia e aprovação vinculada ao UID/hash; dados são auditáveis', async () => {
  const {admin,f,approvals} = backend(); const preview = await admin.preview('Bearer ceo',f.input);
  const approval = await admin.approve('Bearer ceo',preview.previewId,preview.plan.planSha256);
  const saved = approvals.get(approval.authorizationId); assert.equal(saved.actorUid,'ceo-uid'); assert.equal(saved.planSha256,preview.plan.planSha256); assert.ok(saved.approvedAt && saved.expiresAt);
  await assert.rejects(admin.publish('Bearer other',approval.authorizationId), /identidade divergente/);
});
test('backend rejeita prévia de outra identidade, hash divergente e expiração', async () => {
  const {admin,f,advance} = backend(); const p = await admin.preview('Bearer ceo',f.input);
  await assert.rejects(admin.approve('Bearer other',p.previewId,p.plan.planSha256));
  await assert.rejects(admin.approve('Bearer ceo',p.previewId,'hash-forjado'));
  advance(); await assert.rejects(admin.approve('Bearer ceo',p.previewId,p.plan.planSha256));
});
