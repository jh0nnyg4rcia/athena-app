import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Component } from '@firebase/component';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs
} from 'firebase/firestore/lite';

const host = 'http://127.0.0.1:8197';
const project = 'demo-athena-client-safe';
const base = `${host}/v1/projects/${project}/databases/(default)/documents`;
const results = [];

// 1. Carrega as regras candidatas no emulador
const rulesCandidatePath = fs.existsSync('docs/progression/firestore.candidate.rules')
  ? 'docs/progression/firestore.candidate.rules'
  : 'work/athena-progress-subscriptions/docs/progression/firestore.candidate.rules';
const rulesContent = fs.readFileSync(rulesCandidatePath, 'utf8');

const r = await fetch(`${host}/emulator/v1/projects/${project}:securityRules`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rules: {
      files: [{ name: 'firestore.rules', content: rulesContent }]
    }
  })
});
assert.equal(r.status, 200, await r.text());

// Fixture helper usando bearer owner (bypass administrativo no emulador)
const setFixture = async (docPath, fields) => {
  const value = v =>
    typeof v === 'string' ? { stringValue: v } :
    typeof v === 'boolean' ? { booleanValue: v } :
    typeof v === 'number' ? { integerValue: String(v) } :
    Array.isArray(v) ? { arrayValue: { values: v.map(value) } } :
    { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, val]) => [k, value(val)])) } };

  const resp = await fetch(`${base}/${docPath}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, value(v)])) })
  });
  assert.equal(resp.status, 200, `Fixture ${docPath} failed: ${await resp.text()}`);
};

// Cria instância isolada do Client SDK com contexto de autenticação real
function createClientSdk(profileName, uid, email, isGoogle = false) {
  const app = initializeApp({ projectId: project, apiKey: 'fake-api-key' }, profileName);
  if (uid) {
    const token = [
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
      Buffer.from(JSON.stringify({
        iss: `https://securetoken.google.com/${project}`,
        aud: project,
        sub: uid,
        user_id: uid,
        email: email || `${uid}@example.invalid`,
        email_verified: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: {
          sign_in_provider: isGoogle ? 'google.com' : 'password',
          identities: {}
        }
      })).toString('base64url'),
      ''
    ].join('.');

    const authInternal = {
      getToken: async () => ({ accessToken: token }),
      getUid: () => uid,
      addAuthTokenListener: fn => fn(token),
      removeAuthTokenListener: () => {}
    };
    app.container.addComponent(new Component('auth-internal', () => authInternal, 'PRIVATE'));
    app.container.getProvider('auth-internal').initialize();
  }
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8197);
  return { app, db };
}

// Helpers de validação
const expectPermissionDenied = async (name, operationPromise) => {
  try {
    await operationPromise;
    assert.fail(`${name}: Esperava permission-denied, mas a operação foi permitida`);
  } catch (err) {
    const code = err?.code || '';
    assert.equal(code, 'permission-denied', `${name}: código inesperado ${code} (${err.message})`);
    results.push({ name, status: 'DENIED_AS_EXPECTED', code });
  }
};

const expectSuccess = async (name, operationPromise) => {
  try {
    const res = await operationPromise;
    results.push({ name, status: 'ALLOWED_AS_EXPECTED' });
    return res;
  } catch (err) {
    assert.fail(`${name}: Esperava sucesso, mas falhou com ${err?.code || err.message}`);
  }
};

// Fixtures iniciais
await setFixture('homologated_lessons/day_1_part_0', {
  id: 'day_1_part_0',
  day: 1,
  part: 0,
  status: 'approved',
  version: 1,
  content: 'Aula 1 Homologada',
  subject: 'Introducao'
});
await setFixture('homologated_lessons/day_3_part_0', {
  id: 'day_3_part_0',
  day: 3,
  part: 0,
  status: 'approved',
  version: 1,
  content: 'Aula 3 Homologada Protegida',
  subject: 'Direito Penal'
});
await setFixture('users/other_student/sessions/sess_other', {
  id: 'sess_other',
  title: 'Sessao Privada de Outro Aluno',
  userId: 'other_student',
  messages: [{ text: 'Segredo' }],
  lastUpdatedAt: 12345
});
await setFixture('users/student_free/sessions/sess_free', {
  id: 'sess_free',
  title: 'Sessao Antiga Aluno Gratuito',
  userId: 'student_free',
  messages: [{ text: 'Corpo da aula em cache antigo' }],
  lastUpdatedAt: 12345
});

// Inicializa os 5 perfis no Client SDK
const anon = createClientSdk('anon-client', null, null);
const free = createClientSdk('free-client', 'student_free', 'free@student.invalid');
const sub = createClientSdk('sub-client', 'student_sub', 'subscriber@student.invalid');
const tester = createClientSdk('tester-client', 'student_tester', 'tester@student.invalid');
const ceoUnauthorized = createClientSdk('ceo-unauth', 'ceo', 'jhonny.spider@gmail.com', true);

// -----------------------------------------------------------------------------
// PERFIL 1: ANÔNIMO (Client SDK com auth == null)
// -----------------------------------------------------------------------------
await expectPermissionDenied(
  'Anonimo: leitura direta de catalogo homologado bloqueada no client SDK',
  getDoc(doc(anon.db, 'homologated_lessons', 'day_1_part_0'))
);
await expectPermissionDenied(
  'Anonimo: listagem de catalogo bloqueada no client SDK',
  getDocs(collection(anon.db, 'homologated_lessons'))
);
await expectPermissionDenied(
  'Anonimo: leitura de sessao de aluno bloqueada no client SDK',
  getDoc(doc(anon.db, 'users', 'student_free', 'sessions', 'sess_free'))
);
await expectPermissionDenied(
  'Anonimo: leitura de convites de teste bloqueada no client SDK',
  getDoc(doc(anon.db, 'tester_invites', 'any_code'))
);

// -----------------------------------------------------------------------------
// PERFIL 2: ALUNO GRATUITO (Client SDK)
// -----------------------------------------------------------------------------
await expectPermissionDenied(
  'Gratuito: leitura direta de homologated_lessons bloqueada (deve usar API)',
  getDoc(doc(free.db, 'homologated_lessons', 'day_1_part_0'))
);
await expectPermissionDenied(
  'Gratuito: leitura direta de homologated_parts bloqueada',
  getDoc(doc(free.db, 'homologated_parts', 'day_1_part_0'))
);
await expectPermissionDenied(
  'Gratuito: leitura direta de suas proprias sessoes antigas bloqueada (impede extracao de corpos)',
  getDoc(doc(free.db, 'users', 'student_free', 'sessions', 'sess_free'))
);
await expectPermissionDenied(
  'Gratuito: tentativa de ler sessao de OUTRO aluno bloqueada (cross-account read)',
  getDoc(doc(free.db, 'users', 'other_student', 'sessions', 'sess_other'))
);
await expectPermissionDenied(
  'Gratuito: tentativa de gravar dados na conta de OUTRO aluno bloqueada (cross-account write)',
  setDoc(doc(free.db, 'users', 'other_student', 'gamification', 'stats'), { totalXP: 9999, level: 10, streak: 50 })
);
await expectPermissionDenied(
  'Gratuito: tentativa de autoatribuir assinatura paga em access_subscriptions bloqueada',
  setDoc(doc(free.db, 'access_subscriptions', 'student_free'), { status: 'active', serverVerified: true })
);
await expectPermissionDenied(
  'Gratuito: tentativa de autoatribuir cargo de CEO/admin em access_admins bloqueada',
  setDoc(doc(free.db, 'access_admins', 'student_free'), { uid: 'student_free', role: 'ceo', enabled: true })
);
await expectPermissionDenied(
  'Gratuito: tentativa de autoatribuir dias concluídos em study_progress bloqueada',
  setDoc(doc(free.db, 'study_progress', 'student_free'), { verifiedDays: [1, 2, 3, 4, 5] })
);
await expectPermissionDenied(
  'Gratuito: tentativa de autoinjetar role/admin no documento users/{uid} bloqueada',
  setDoc(doc(free.db, 'users', 'student_free'), { displayName: 'Hacker', email: 'free@student.invalid', role: 'admin', isAdmin: true, isCEO: true })
);

// -----------------------------------------------------------------------------
// PERFIL 3: ALUNO ASSINANTE (Client SDK)
// -----------------------------------------------------------------------------
await expectPermissionDenied(
  'Assinante: leitura direta de homologated_lessons bloqueada no Firestore (deve consumir via servidor)',
  getDoc(doc(sub.db, 'homologated_lessons', 'day_3_part_0'))
);
await expectPermissionDenied(
  'Assinante: tentativa de ler sessoes de outro aluno bloqueada',
  getDoc(doc(sub.db, 'users', 'student_free', 'sessions', 'sess_free'))
);
await expectPermissionDenied(
  'Assinante: tentativa de forjar progresso na trilha legado bloqueada',
  setDoc(doc(sub.db, 'users', 'student_sub', 'trilha', 'progress'), { completedDays: [1, 2, 3, 4] })
);
await expectPermissionDenied(
  'Assinante: tentativa de criar convite em tester_invites bloqueada',
  setDoc(doc(sub.db, 'tester_invites', 'hacked_invite'), { code: 'hacked_invite', maxUses: 10 })
);

// -----------------------------------------------------------------------------
// PERFIL 4: TESTADOR (Client SDK)
// -----------------------------------------------------------------------------
await expectPermissionDenied(
  'Testador: leitura direta de catalogo homologado bloqueada no client SDK',
  getDoc(doc(tester.db, 'homologated_lessons', 'day_3_part_0'))
);
await expectPermissionDenied(
  'Testador: autoatribuicao de vigencia estendida em tester_access bloqueada',
  setDoc(doc(tester.db, 'tester_access', 'student_tester'), { revoked: false, expiresAt: Date.now() + 999999999 })
);
await expectPermissionDenied(
  'Testador: leitura de dados confidenciais em legal_reviews bloqueada',
  getDoc(doc(tester.db, 'legal_reviews', 'review_1'))
);
await expectPermissionDenied(
  'Testador: acesso a colecao arbitraria inexistente bloqueado por default deny',
  getDoc(doc(tester.db, 'arbitrary_unmapped', 'doc1'))
);

// -----------------------------------------------------------------------------
// PERFIL 5: CEO (Client SDK)
// -----------------------------------------------------------------------------
// 5.1 CEO apenas com e-mail e login Google, SEM registro canônico em access_admins -> BLOQUEADO
const ceoNoGrant = createClientSdk('ceo-no-grant', 'ceo_unauthorized_user', 'jhonny.spider@gmail.com', true);
await expectPermissionDenied(
  'CEO sem registro de autorizacao no servidor e bloqueado (previne impersonacao)',
  getDoc(doc(ceoNoGrant.db, 'homologated_lessons', 'day_3_part_0'))
);

// 5.2 Fixture de autorizacao canônica do CEO para UID dedicado
await setFixture('access_admins/ceo_verified_user', {
  uid: 'ceo_verified_user',
  role: 'ceo',
  enabled: true
});

// 5.3 CEO autenticado via Google + registro ativo em access_admins -> PERMITIDO
const ceoAuthorized = createClientSdk('ceo-auth', 'ceo_verified_user', 'jhonny.spider@gmail.com', true);
const ceoSnap = await expectSuccess(
  'CEO autorizado via Google + access_admins le catalogo homologado diretamente no client SDK',
  getDoc(doc(ceoAuthorized.db, 'homologated_lessons', 'day_3_part_0'))
);
assert.equal(ceoSnap.exists(), true);
assert.equal(ceoSnap.data()?.id, 'day_3_part_0');

// 5.4 Impostor fingindo e-mail do CEO sem token Google ou com UID divergente -> BLOQUEADO
const imposter = createClientSdk('imposter-client', 'imposter_uid', 'jhonny.spider@gmail.com', false);
await expectPermissionDenied(
  'Impostor com UID divergente ou sem login Google e bloqueado',
  getDoc(doc(imposter.db, 'homologated_lessons', 'day_3_part_0'))
);

// Limpeza de apps do client SDK
await Promise.all([
  deleteApp(anon.app),
  deleteApp(free.app),
  deleteApp(sub.app),
  deleteApp(tester.app),
  deleteApp(ceoNoGrant.app),
  deleteApp(ceoAuthorized.app),
  deleteApp(imposter.app)
]);

const outDir = 'outputs/progress-subscriptions';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'rules-client-sdk-emulator-results.json'),
  JSON.stringify({
    passed: results.length,
    results,
    emulatorOnly: true,
    activeRulesNotChanged: true,
    verifiedAt: new Date().toISOString()
  }, null, 2)
);

console.log(JSON.stringify({ passed: results.length, total: results.length }, null, 2));
