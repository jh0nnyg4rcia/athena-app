/**
 * Testes isolados (dados sintéticos, Firestore em memória) da correção CEO / progressão / bloco extra.
 * Nenhum acesso a rede ou a projetos reais. Executar: npx tsx scripts/test-ceo-progression-fix.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createStudyProgressCore } from '../src/server/studyProgressCore';
import { TRILHA_JURIDICA_DATA } from '../src/data/trilhaData';
import { isDayCompletionNotice, inferTrilhaContext } from '../src/lib/trilhaContext';
import { resolveDisplayedChallenge, findChallengeBlockIndex } from '../src/lib/objectiveChallenge';

const clone = (v: any) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
function memoryDb(seed: Record<string, any>) {
  const store = new Map<string, any>(Object.entries(seed).map(([k, v]) => [k, clone(v)]));
  const snap = (path: string) => ({ exists: store.has(path), id: path.split('/').pop(), data: () => clone(store.get(path)) });
  const db: any = {
    store,
    doc: (path: string) => ({ path }),
    collection: (path: string) => ({ get: async () => ({ forEach: (fn: any) => [...store.keys()].filter(k => k.startsWith(path + '/') && k.split('/').length === path.split('/').length + 1).forEach(k => fn(snap(k))) }) }),
    runTransaction: async (fn: any) => {
      const writes: Array<() => void> = [];
      const tx = {
        get: async (r: any) => snap(r.path),
        set: (r: any, v: any) => writes.push(() => store.set(r.path, clone(v))),
        create: (r: any, v: any) => { if (store.has(r.path)) throw Error('ALREADY_EXISTS'); writes.push(() => store.set(r.path, clone(v))); }
      };
      const out = await fn(tx); writes.forEach(w => w()); return clone(out);
    }
  };
  return db;
}
const Q = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `Questão sintética ${i + 1}`, options: ['A', 'B', 'C', 'D'], correctIndex: i % 4, explanation: 'x' }));
const lessonMd = (d: number, p: number) => [1, 2, 3, 4, 5, 6].map(b => `[BLOCK_${b}]\nConteúdo sintético D${d}P${p} B${b}` + (b === 5 ? `\n[ATHENA_CHALLENGE]\n${JSON.stringify({ questions: Q(10) })}` : '')).join('\n\n');
const seed: Record<string, any> = {};
for (let d = 1; d <= 5; d++) for (let p = 0; p < 5; p++) {
  const id = `day_${d}_part_${p}`;
  seed['homologated_lessons/' + id] = { id, day: d, part: p, status: 'approved', version: 1, content: lessonMd(d, p) };
  seed['homologated_parts/' + id] = { id, day: d, part: p, status: 'approved', version: 1 };
}
const CEO = 'synthCeoUid', STUDENT = 'synthStudentUid';
seed['access_admins/' + CEO] = { uid: CEO, role: 'ceo', enabled: true, email: 'ceo@example.invalid' };
const parts = (day: number) => TRILHA_JURIDICA_DATA.find(d => d.dia === day)?.materias.length || 0;
const seedSnapshot = JSON.stringify(Object.keys(seed).filter(k => k.startsWith('homologated_') || k.startsWith('access_admins')).map(k => [k, seed[k]]));

const results: string[] = [];
const test = async (name: string, fn: () => Promise<void>) => { await fn(); results.push('PASS ' + name); };

(async () => {
  const db = memoryDb(seed);
  const core = createStudyProgressCore(db, parts);
  const ceoGoogle = { uid: CEO, emailVerified: true, provider: 'google.com' };
  const ceoPassword = { uid: CEO, emailVerified: true, provider: 'password' };
  const student = { uid: STUDENT, emailVerified: true, provider: 'google.com' };

  await test('1. CEO com zero progresso (sessão Google verificada) acessa todos os dias homologados', async () => {
    const a = await core.access(ceoGoogle);
    assert.equal(a.ceo, true); assert.deepEqual(a.completedDays, []); assert.equal(a.allowedDays.length, 100);
    for (let d = 1; d <= 5; d++) for (let p = 0; p < 5; p++) await core.view(ceoGoogle, `day_${d}_part_${p}`);
    assert.equal(db.store.has('study_progress/' + CEO), false, 'acesso administrativo não grava conclusão');
    // Causa comprovada: a mesma conta por senha não é CEO para o servidor -> frontend (email) e servidor divergiam.
    const pw = await core.access(ceoPassword);
    assert.equal(pw.ceo, false); assert.deepEqual(pw.allowedDays, [1]);
    await assert.rejects(core.view(ceoPassword, 'day_2_part_0'), /PROGRESSION_OR_SUBSCRIPTION_REQUIRED/);
    const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
    assert.match(app, /const isCEO = isCeoAccount\(user\) && !!user\?\.uid && serverCeoUid === user\.uid;/, 'privilégio CEO no frontend exige confirmação do servidor');
  });

  await test('2. Aluno comum continua respeitando bloqueios legítimos', async () => {
    const a = await core.access(student);
    assert.equal(a.ceo, false); assert.deepEqual(a.allowedDays, [1]);
    await assert.rejects(core.view(student, 'day_2_part_0'), /PROGRESSION_OR_SUBSCRIPTION_REQUIRED/);
    await assert.rejects(core.view(student, 'day_3_part_0'), /PROGRESSION_OR_SUBSCRIPTION_REQUIRED/);
  });

  let totalAnswered = 0; const lastReq: any = {};
  await test('3. Aluno completa as 50 questões do Dia 1', async () => {
    for (let p = 0; p < 5; p++) {
      const id = `day_1_part_${p}`; let v = await core.view(student, id);
      for (let q = 0; q < 10; q++) {
        const body = { lessonId: id, lessonVersion: v.material.lessonVersion, lessonSha256: v.material.lessonSha256, expectedRevision: v.material.revision, requestId: randomUUID(), answers: { [q]: q % 4 } };
        const r = await core.saveAnswers(student, body); lastReq[id] = body; v = { ...v, material: r.material }; totalAnswered++;
      }
      assert.equal(Object.keys(v.material.answers).length, 10);
    }
    assert.equal(totalAnswered, 50);
  });

  let finalResult: any;
  await test('4. Servidor confirma os cinco blocos e a conclusão do dia', async () => {
    for (let p = 0; p < 5; p++) {
      const id = `day_1_part_${p}`; const v = await core.view(student, id);
      finalResult = await core.completeMaterial(student, { lessonId: id, lessonVersion: v.material.lessonVersion, lessonSha256: v.material.lessonSha256, expectedRevision: v.material.revision, requestId: randomUUID(), confirmStudied: true });
      assert.equal(finalResult.source, 'server_confirmed'); assert.equal(finalResult.dayCompleted, p === 4);
    }
    assert.deepEqual(finalResult.completedDays, [1]);
  });

  await test('5. Dia 2 reconhece a conclusão anterior, respeitando bloqueio por assinatura do Dia 3', async () => {
    const a = await core.access(student);
    assert.deepEqual(a.completedDays, [1]); assert.deepEqual(a.allowedDays, [1, 2]);
    await core.view(student, 'day_2_part_0');
    await assert.rejects(core.view(student, 'day_3_part_0'), /PROGRESSION_OR_SUBSCRIPTION_REQUIRED/);
  });

  await test('6. Último bloco não gera material adicional (aviso de conclusão não herda a LINDB)', async () => {
    const lindb: any = seed['homologated_lessons/day_1_part_4'];
    const official = { challenge: { questions: Q(10) }, content: lindb.content };
    const notice = { role: 'model', content: '🎉 **Parabéns de Elite!** ... Conclusão confirmada pelo servidor.', blocks: ['x'], currentBlockIndex: 0 };
    const lindbMsg = { role: 'model', content: 'aula', blocks: ['1', '2', '3', '4', '5', '6'], trilhaDay: 1, trilhaMaterialIndex: 4 };
    // Causa: sem a guarda, o aviso (sessão com trilhaMaterialIndex=4) exibia o desafio oficial da LINDB no bloco 0.
    const before = resolveDisplayedChallenge({ messageChallenge: undefined, messageContent: notice.content, officialChallenge: official.challenge, officialContent: official.content });
    assert.equal(before?.questions.length, 10); assert.equal(findChallengeBlockIndex(notice.blocks), 0);
    assert.equal(isDayCompletionNotice(notice), true); assert.equal(isDayCompletionNotice(lindbMsg as any), false);
    const ctx = inferTrilhaContext({ trilhaDay: 1, trilhaMaterialIndex: 4, title: '' }, [lindbMsg as any, notice as any], notice as any);
    assert.equal(ctx.part, 4);
    const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
    for (const guard of ['const displayedChallenge = completionNotice ? undefined : resolveDisplayedChallenge(', 'const challengeBlockIdx = completionNotice ? -1 : findChallengeBlockIndex(', "if (isCEO || msg.role !== 'model' || isDayCompletionNotice(msg)", 'if (isDayCompletionNotice(m)) return m;'])
      assert.ok(app.includes(guard), 'guarda ausente: ' + guard);
    assert.ok(!/if \(isCEO && !trilhaCompletedDays\.includes\(dayNum\)\) \{\s*await toggleTrilhaDayComplete/.test(app), 'CEO não deve gerar conclusão/XP automáticos');
    const m = await db.collection('study_progress/' + STUDENT + '/materials').get(); let n = 0; m.forEach(() => n++);
    assert.equal(n, 5, 'somente os 5 materiais do Dia 1 foram gravados (nenhum bloco extra)');
  });

  await test('7. Atualização (F5) preserva o estado confirmado', async () => {
    const fresh = createStudyProgressCore(db, parts);
    const a = await fresh.access(student); assert.deepEqual(a.completedDays, [1]); assert.deepEqual(a.allowedDays, [1, 2]);
    const v = await fresh.view(student, 'day_1_part_4'); assert.equal(v.material.completed, true);
    const persisted = JSON.parse(JSON.stringify([{ role: 'model', content: 'Parabéns de Elite! Conclusão confirmada pelo servidor.', trilhaDay: 1, trilhaMaterialIndex: 4 }]));
    assert.equal(isDayCompletionNotice(persisted[0]), true);
  });

  await test('8. Nenhuma duplicação de XP ou respostas (idempotência)', async () => {
    const progressBefore = JSON.stringify(db.store.get('study_progress/' + STUDENT));
    const replay = lastReq['day_1_part_0'];
    const again = await core.saveAnswers(student, replay); // mesmo requestId -> recibo
    assert.equal(Object.keys(again.material.answers).length, 10);
    await assert.rejects(core.saveAnswers(student, { ...replay, requestId: randomUUID(), answers: { 0: 1 } }), /REVISION_CONFLICT|ALREADY_COMPLETED/);
    const v = await core.view(student, 'day_1_part_4');
    const re = await core.completeMaterial(student, { lessonId: 'day_1_part_4', lessonVersion: v.material.lessonVersion, lessonSha256: v.material.lessonSha256, expectedRevision: v.material.revision, requestId: randomUUID(), confirmStudied: true });
    assert.deepEqual(re.completedDays, [1]);
    assert.equal(JSON.stringify(db.store.get('study_progress/' + STUDENT)), progressBefore, 'progresso não muda em reenvio');
    const p = db.store.get('study_progress/' + STUDENT); assert.deepEqual(p.verifiedDays, [1]); assert.equal(p.xp, undefined);
    const keysNow = JSON.stringify([...db.store.keys()].filter(k => k.startsWith('homologated_') || k.startsWith('access_admins')).map(k => [k, db.store.get(k)]));
    assert.equal(keysNow, seedSnapshot, 'aulas, catálogo e access_admins sintéticos intactos');
  });

  console.log(results.join('\n')); console.log(`${results.length}/8 aprovados`);
  if (results.length !== 8) process.exit(1);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
