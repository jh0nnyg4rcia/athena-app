import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const host = 'http://127.0.0.1:8197';
const project = 'demo-athena-client-safe';
const base = host + '/v1/projects/' + project + '/databases/(default)/documents';
const results = [];

const rulesCandidatePath = fs.existsSync('docs/progression/firestore.candidate.rules')
  ? 'docs/progression/firestore.candidate.rules'
  : 'work/athena-progress-subscriptions/docs/progression/firestore.candidate.rules';

const rulesContent = fs.readFileSync(rulesCandidatePath, 'utf8');

// Load candidate rules into the emulator
const r = await fetch(host + '/emulator/v1/projects/' + project + ':securityRules', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rules: {
      files: [{ name: 'firestore.rules', content: rulesContent }]
    }
  })
});
assert.equal(r.status, 200, await r.text());

const jwt = (uid, google = false) => {
  if (!uid) return '';
  return [
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
    Buffer.from(JSON.stringify({
      iss: 'https://securetoken.google.com/' + project,
      aud: project,
      sub: uid,
      user_id: uid,
      email: uid === 'ceo' ? 'jhonny.spider@gmail.com' : 'synthetic@example.invalid',
      email_verified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: {
        sign_in_provider: google ? 'google.com' : 'password',
        identities: {}
      }
    })).toString('base64url'),
    ''
  ].join('.');
};

const value = v =>
  typeof v === 'string' ? { stringValue: v } :
  typeof v === 'boolean' ? { booleanValue: v } :
  typeof v === 'number' ? { integerValue: String(v) } :
  Array.isArray(v) ? { arrayValue: { values: v.map(value) } } :
  { mapValue: { fields: fields(v) } };

const fields = x => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, value(v)]));

const req = (docPath, data = {}, token = jwt('student'), method = 'PATCH') => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return fetch(base + '/' + docPath, {
    method,
    headers,
    ...(method === 'GET' ? {} : { body: JSON.stringify({ fields: fields(data) }) })
  });
};

const check = async (name, status, p) => {
  const resp = await p;
  assert.equal(resp.status, status, name + ' returned ' + resp.status + ': ' + (await resp.text()));
  results.push(name);
};

// Fixtures
const lesson = { id: 'day_3_part_0', day: 3, part: 0, status: 'approved', version: 1, content: 'Synthetic protected content only' };
await check('emulator canonical fixture setup', 200, req('homologated_lessons/day_3_part_0', lesson, 'owner'));

// 1. Leitura de catálogo fechada para alunos e anônimos
await check('student direct lesson read denied', 403, req('homologated_lessons/day_3_part_0', {}, jwt('student'), 'GET'));
await check('anonymous visitor lesson read denied', 403, req('homologated_lessons/day_3_part_0', {}, '', 'GET'));
await check('student full catalog listing denied', 403, req('homologated_lessons', {}, jwt('student'), 'GET'));
await check('student homologated_parts read denied', 403, req('homologated_parts/day_3_part_0', {}, jwt('student'), 'GET'));

// 2. Proteção de autoridade do CEO (sem concessão privada é bloqueado)
await check('CEO email alone cannot bypass source authorization', 403, req('homologated_lessons/day_3_part_0', {}, jwt('ceo', true), 'GET'));
await check('server-only CEO authorization fixture setup', 200, req('access_admins/ceo', { uid: 'ceo', role: 'ceo', enabled: true }, 'owner'));
await check('server-authorized Google CEO retains canonical read', 200, req('homologated_lessons/day_3_part_0', {}, jwt('ceo', true), 'GET'));

// 3. Bloqueio de autoatribuição e escalada de privilégios
await check('student cannot write a paid entitlement', 403, req('access_subscriptions/student', { serverVerified: true, provider: 'google_play', status: 'active' }));
await check('student cannot create CEO grant', 403, req('access_admins/student', { uid: 'student', role: 'ceo', enabled: true }));
await check('student cannot self-assign verified progress', 403, req('study_progress/student', { verifiedDays: [1, 2, 3] }));
await check('legacy manual completion writer denied', 403, req('users/student/trilha/progress', { completedDays: [1, 2, 3] }));

// 4. Bloqueio de recuperação direta de corpos em sessões
await check('legacy session fixture setup', 200, req('users/student/sessions/history', { id: 'history', content: 'Synthetic previously delivered content' }, 'owner'));
await check('old client cannot redownload protected session body directly', 403, req('users/student/sessions/history', {}, jwt('student'), 'GET'));
await check('anonymous cannot read student session', 403, req('users/student/sessions/history', {}, '', 'GET'));

// 5. Coleções privadas e bloqueios explícitos (default deny)
await check('tester_invites private and denied to student', 403, req('tester_invites/student', {}, jwt('student'), 'GET'));
await check('tester_access private and cannot be self-assigned', 403, req('tester_access/student', { uid: 'student', revoked: false, expiresAt: 9999999999999 }));
await check('legal_reviews explicitly denied to read', 403, req('legal_reviews/rev1', {}, jwt('student'), 'GET'));
await check('arbitrary unmapped collection default denied', 403, req('unmapped_collection/doc1', {}, jwt('student'), 'GET'));

// 6. Imutabilidade de versão do catálogo
await check('student cannot alter lesson version', 403, req('homologated_lessons/day_3_part_0', { ...lesson, version: 99 }));

const outDir = fs.existsSync('outputs/progress-subscriptions')
  ? 'outputs/progress-subscriptions'
  : 'work/athena-progress-subscriptions/outputs/progress-subscriptions';

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'rules-emulator-results.json'),
  JSON.stringify({
    passed: results.length,
    results,
    emulatorOnly: true,
    activeRulesNotChanged: true,
    verifiedAt: new Date().toISOString()
  }, null, 2)
);

console.log(JSON.stringify({ passed: results.length, results }, null, 2));
