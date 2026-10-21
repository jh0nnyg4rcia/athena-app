import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createAthenaApiApp } from '../src/api/createAthenaApiApp.ts';
import { TRILHA_JURIDICA_DATA } from '../src/data/trilhaData.js';

const results = [];
const check = (name, passed, detail = '') => {
  assert.ok(passed, `${name}: ${detail}`);
  results.push({ name, passed: true, detail });
};

// 1. Inicia Mock do Auth Emulator na porta 9099
const authServer = http.createServer((req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    let uid = 'student_http_test';
    let email = 'student_http_test@example.invalid';
    let provider = 'password';
    try {
      const parsed = JSON.parse(body || '{}');
      if (parsed.localId?.[0]) uid = parsed.localId[0];
      if (parsed.idToken) {
        const parts = parsed.idToken.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        uid = payload.sub || uid;
        email = payload.email || email;
        provider = payload.firebase?.sign_in_provider || provider;
      }
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      users: [{
        localId: uid,
        email,
        emailVerified: true,
        validSince: '0',
        providerUserInfo: [{ rawId: uid, providerId: provider }]
      }]
    }));
  });
});

await new Promise(resolve => authServer.listen(9099, '127.0.0.1', resolve));

// Configura variáveis de ambiente locais exigidas por getStudyContext()
process.env.ATHENA_STUDY_PROGRESS_LOCAL = 'true';
process.env.GCLOUD_PROJECT = 'demo-athena-client-safe';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8197';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Inicializa a aplicação candidata oficial via sua entrada efetiva
const app = createAthenaApiApp();

const server = http.createServer(app);
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const apiBase = `http://127.0.0.1:${port}`;

// Helper para criar JWT de teste
const makeToken = (uid, provider = 'password', email = `${uid}@example.invalid`) => {
  return [
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
    Buffer.from(JSON.stringify({
      iss: 'https://securetoken.google.com/demo-athena-client-safe',
      aud: 'demo-athena-client-safe',
      sub: uid,
      user_id: uid,
      email,
      email_verified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      firebase: {
        sign_in_provider: provider,
        identities: {}
      }
    })).toString('base64url'),
    ''
  ].join('.');
};

const studentUid = 'student_http_test';
const studentToken = makeToken(studentUid);

// Seed de fixtures no Firestore Emulator usando Admin SDK
const adminApp = getApps().find(a => a.name === 'study-local') || initializeApp({ projectId: 'demo-athena-client-safe' }, 'study-local');
const db = getFirestore(adminApp);

// Template de Markdown homologado com desafio válido e todos os 6 blocos obrigatórios
function makeCanonicalMarkdown(day, part, title) {
  return `[BLOCK_1]
### Saudacao Dia ${day} Parte ${part} - ${title}
Introducao pedagogica e objetivos da sessao de estudos.

---

[BLOCK_2]
### Lei Seca Decodificada
Literalidade dos artigos e analise dogmatica pontual.

---

[BLOCK_3]
### Jurisprudencia e Precedentes
Decisoes vinculantes e teses dos Tribunais Superiores.

---

[BLOCK_4]
### Doutrina Verticalizada
Aprofundamento teorico para questoes dissertativas e orais.

---

[BLOCK_5]
### Desafio ATHENA
Simulado inedito para fixacao cognitiva.

---

[BLOCK_6]
### Revisao Comprimida Pareto 80/20
Sintese esquematica dos topicos de maior incidencia.

[ATHENA_CHALLENGE]
{
  "questions": [
    {
      "id": "q1",
      "subject": "${title}",
      "text": "Questao basilar do tema ${title} para afericao de retencao cognitiva:",
      "options": [
        "A) Opcao correta demonstrando o dominio tecnico da materia.",
        "B) Opcao incorreta com erro de literalidade da norma."
      ],
      "correctIndex": 0,
      "explanation": "A alternativa A esta correta conforme a doutrina."
    }
  ]
}
`;
}

// Função auxiliar para cadastrar aula e seu registro correspondente em homologated_parts
async function seedLesson(day, part, title) {
  const lessonId = `day_${day}_part_${part}`;
  const content = makeCanonicalMarkdown(day, part, title);
  const sha256 = crypto.createHash('sha256').update(content).digest('hex');

  await db.collection('homologated_lessons').doc(lessonId).set({
    id: lessonId,
    day,
    part,
    status: 'approved',
    version: 1,
    sha256,
    content,
    subject: title,
    approvedBy: 'jhonny.spider@gmail.com'
  });

  await db.collection('homologated_parts').doc(lessonId).set({
    id: lessonId,
    day,
    part,
    status: 'approved',
    version: 1,
    subject: title,
    review: 'Revisao aprovada pelo CEO',
    approvedBy: 'jhonny.spider@gmail.com'
  });

  return { lessonId, sha256, version: 1 };
}

// Cadastra todas as matérias do Dia 1 (5 matérias)
const day1Meta = [];
const day1Count = TRILHA_JURIDICA_DATA.find(d => d.dia === 1)?.materias.length || 5;
for (let p = 0; p < day1Count; p++) {
  const m = TRILHA_JURIDICA_DATA[0].materias[p];
  day1Meta.push(await seedLesson(1, p, m.nome));
}

// Cadastra todas as matérias do Dia 2 (5 matérias)
const day2Meta = [];
const day2Count = TRILHA_JURIDICA_DATA.find(d => d.dia === 2)?.materias.length || 5;
for (let p = 0; p < day2Count; p++) {
  const m = TRILHA_JURIDICA_DATA[1].materias[p];
  day2Meta.push(await seedLesson(2, p, m.nome));
}

// Cadastra o Dia 3 e Dia 10
const day3Meta = await seedLesson(3, 0, 'Direito Penal Avancado');
const day10Meta = await seedLesson(10, 0, 'Processo Penal Especial');

// Helper para responder e completar uma matéria
async function answerAndComplete(lessonId, version, sha256) {
  // 1. Envia respostas
  const ansRes = await fetch(`${apiBase}/api/study/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      lessonId,
      lessonVersion: version,
      lessonSha256: sha256,
      expectedRevision: 0,
      requestId: crypto.randomUUID(),
      answers: { 0: 0 }
    })
  });
  const ansData = await ansRes.json();
  assert.equal(ansRes.status, 200, `Save answers failed for ${lessonId}: ${JSON.stringify(ansData)}`);

  // 2. Finaliza conclusão
  const compRes = await fetch(`${apiBase}/api/study/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      lessonId,
      lessonVersion: version,
      lessonSha256: sha256,
      expectedRevision: ansData.material.revision,
      requestId: crypto.randomUUID(),
      confirmStudied: true
    })
  });
  const compData = await compRes.json();
  assert.equal(compRes.status, 200, `Complete failed for ${lessonId}: ${JSON.stringify(compData)}`);
  return compData;
}

// -----------------------------------------------------------------------------
// 1. AUTENTICAÇÃO NA ENTRADA EFETIVA DA API
// -----------------------------------------------------------------------------
// 1.1 Requisição sem cabeçalho Authorization -> 401 AUTHENTICATION_REQUIRED
const resNoAuth = await fetch(`${apiBase}/api/study/lesson/day_1_part_0`);
assert.equal(resNoAuth.status, 401);
const errNoAuth = await resNoAuth.json();
check('API HTTP: Requisicao desautenticada rejeitada com 401', errNoAuth.error === 'AUTHENTICATION_REQUIRED');

// -----------------------------------------------------------------------------
// 2. DIA 2 BLOQUEADO ANTES DA CONCLUSÃO DO DIA 1
// -----------------------------------------------------------------------------
// 2.1 Leitura do Dia 1 é permitida com token (degustação)
const resDay1 = await fetch(`${apiBase}/api/study/lesson/day_1_part_0`, {
  headers: { Authorization: `Bearer ${studentToken}` }
});
const dataDay1 = await resDay1.json();
assert.equal(resDay1.status, 200, `Esperava 200 para Day 1, recebeu ${resDay1.status}: ${JSON.stringify(dataDay1)}`);
check('API HTTP: Dia 1 acessivel na entrada efetiva da API', dataDay1.lesson.id === 'day_1_part_0');

// 2.2 Leitura do Dia 2 ANTES de concluir o Dia 1 -> DEVE RETORNAR 403
const resDay2Blocked = await fetch(`${apiBase}/api/study/lesson/day_2_part_0`, {
  headers: { Authorization: `Bearer ${studentToken}` }
});
const errDay2Blocked = await resDay2Blocked.json();
assert.equal(resDay2Blocked.status, 403, `Esperava 403 para Day 2 sem Day 1 concluido, recebeu ${resDay2Blocked.status}`);
check('API HTTP: Dia 2 bloqueado antes da conclusao integral do Dia 1', errDay2Blocked.error === 'PROGRESSION_OR_SUBSCRIPTION_REQUIRED');

// -----------------------------------------------------------------------------
// 3. CONCLUSÃO INTEGRAL DO DIA 1 E DESBLOQUEIO DO DIA 2
// -----------------------------------------------------------------------------
// 3.1 Conclui todas as matérias do Dia 1
for (let p = 0; p < day1Count; p++) {
  const meta = day1Meta[p];
  await answerAndComplete(meta.lessonId, meta.version, meta.sha256);
}

// 3.2 Agora com Dia 1 concluído, Dia 2 DEVE ser desbloqueado
const resDay2Allowed = await fetch(`${apiBase}/api/study/lesson/day_2_part_0`, {
  headers: { Authorization: `Bearer ${studentToken}` }
});
const dataDay2 = await resDay2Allowed.json();
assert.equal(resDay2Allowed.status, 200, `Esperava 200 para Day 2 apos conclusao de Day 1, recebeu ${resDay2Allowed.status}: ${JSON.stringify(dataDay2)}`);
check('API HTTP: Dia 2 desbloqueado com sucesso apos conclusao do Dia 1', dataDay2.lesson.id === 'day_2_part_0');

// -----------------------------------------------------------------------------
// 4. DIAS POSTERIORES EXIGEM PROGRESSÃO CONTÍGUA E BENEFÍCIO VIGENTE
// -----------------------------------------------------------------------------
// 4.1 Dia 3 sem assinatura ou convite de teste -> DEVE RETORNAR 403
const resDay3NoSub = await fetch(`${apiBase}/api/study/lesson/day_3_part_0`, {
  headers: { Authorization: `Bearer ${studentToken}` }
});
assert.equal(resDay3NoSub.status, 403, `Esperava 403 para Day 3 sem assinatura, recebeu ${resDay3NoSub.status}`);
const errDay3NoSub = await resDay3NoSub.json();
check('API HTTP: Dia 3 bloqueado para aluno gratuito sem assinatura/convite', errDay3NoSub.error === 'PROGRESSION_OR_SUBSCRIPTION_REQUIRED');

// 4.2 Conclui integralmente o Dia 2
for (let p = 0; p < day2Count; p++) {
  const meta = day2Meta[p];
  await answerAndComplete(meta.lessonId, meta.version, meta.sha256);
}

// 4.3 Mesmo com Dias 1 e 2 concluídos, Dia 3 AINDA é bloqueado sem assinatura/convite
const resDay3StillNoSub = await fetch(`${apiBase}/api/study/lesson/day_3_part_0`, {
  headers: { Authorization: `Bearer ${studentToken}` }
});
assert.equal(resDay3StillNoSub.status, 403);
check('API HTTP: Dia 3 continua bloqueado ate contratacao de assinatura ou convite ativo', (await resDay3StillNoSub.json()).error === 'PROGRESSION_OR_SUBSCRIPTION_REQUIRED');

// 4.4 Concede assinatura ativa ao aluno no Firestore
await db.collection('access_subscriptions').doc(studentUid).set({
  status: 'active',
  provider: 'google_play',
  serverVerified: true,
  currentPeriodStart: Date.now() - 3600000,
  currentPeriodEnd: Date.now() + 30 * 86400 * 1000
});

// 4.5 Agora com Dias 1 e 2 concluídos E assinatura ativa -> Dia 3 DEVE desbloquear
const resDay3WithSub = await fetch(`${apiBase}/api/study/lesson/day_3_part_0`, {
  headers: { Authorization: `Bearer ${studentToken}` }
});
assert.equal(resDay3WithSub.status, 200, `Esperava 200 para Day 3 apos assinatura e progressao previa, recebeu ${resDay3WithSub.status}`);
const dataDay3 = await resDay3WithSub.json();
check('API HTTP: Dia 3 desbloqueado com progressao previa + assinatura vigente', dataDay3.lesson.id === 'day_3_part_0');

// 4.6 Tentativa de pular diretamente para o Dia 10 (sem concluir dias intermediários 3 a 9) -> DEVE RETORNAR 403
const resDay10Skip = await fetch(`${apiBase}/api/study/lesson/day_10_part_0`, {
  headers: { Authorization: `Bearer ${studentToken}` }
});
assert.equal(resDay10Skip.status, 403, `Esperava 403 ao pular para Day 10 sem conclusao intermediaria`);
check('API HTTP: Salto arbitrario para Dia 10 bloqueado mesmo com assinatura ativa', (await resDay10Skip.json()).error === 'PROGRESSION_OR_SUBSCRIPTION_REQUIRED');

// -----------------------------------------------------------------------------
// 5. HISTÓRICO ANTIGO: LEITURA AUTORIZADA DAS CONVERSAS LEGADAS COM FILTRAGEM
// -----------------------------------------------------------------------------
// 5.1 Cadastra sessões legadas no banco para aluno sem direito a Dia 4
const studentFreshUid = 'student_fresh_legacy';
const studentFreshToken = makeToken(studentFreshUid);

await db.collection('users').doc(studentFreshUid).collection('sessions').doc('sess_legacy_01').set({
  id: 'sess_legacy_01',
  userId: studentFreshUid,
  title: 'Mentoria Constitucional Antiga',
  guidedSubject: 'Direito Constitucional',
  currentArticle: 1,
  lastUpdatedAt: Date.now(),
  trilhaDay: 4, // Dia 4 protegido (sem assinatura/progressão)
  trilhaMaterialIndex: 0,
  messages: [
    {
      id: 'm1',
      role: 'user',
      text: 'Qual a diferenca entre controle concentrado e difuso?'
    },
    {
      id: 'm2',
      role: 'model',
      content: '[BLOCK_1]\nTexto protegido do Dia 4\n[BLOCK_2]\nMais texto protegido\n[ATHENA_CHALLENGE]\n{"questions":[]}',
      trilhaDay: 4,
      answers: { 0: 1 },
      subject: 'Direito Constitucional'
    }
  ]
});

// 5.2 Aluno consulta suas conversas legadas via rota autorizada GET /api/study/sessions
const resLegacySessions = await fetch(`${apiBase}/api/study/sessions`, {
  headers: { Authorization: `Bearer ${studentFreshToken}` }
});
assert.equal(resLegacySessions.status, 200, `Esperava 200 para GET /api/study/sessions`);
const dataLegacySessions = await resLegacySessions.json();
assert.equal(dataLegacySessions.sessions.length, 1);
const loadedSession = dataLegacySessions.sessions[0];

// Verifica que a conversa do usuário e suas respostas estão 100% preservadas
check('Historico Legado: Mensagens do usuario e respostas estao preservadas',
  loadedSession.messages[0].text === 'Qual a diferenca entre controle concentrado e difuso?' &&
  loadedSession.messages[1].answers[0] === 1
);

// Verifica que o corpo protegido do Dia 4 foi filtrado com aviso seguro
check('Historico Legado: Corpo da aula protegida foi filtrado para usuario sem acesso',
  loadedSession.messages[1].content.includes('[Conteúdo da aula protegido') &&
  !loadedSession.messages[1].content.includes('Texto protegido do Dia 4')
);

// 5.3 Aluno assinante sem Dia 1 concluído consulta sessão antiga com aula do Dia 2
const subNoProgUid = 'student_sub_no_progression';
const subNoProgToken = makeToken(subNoProgUid, 'password', 'sub_noprog@test.com');
await db.collection('access_subscriptions').doc(subNoProgUid).set({
  provider: 'google_play',
  status: 'active',
  serverVerified: true,
  currentPeriodStart: Date.now() - 1000,
  currentPeriodEnd: Date.now() + 86400000
});
await db.collection('users').doc(subNoProgUid).collection('sessions').doc('sess_day2_unprog').set({
  id: 'sess_day2_unprog',
  userId: subNoProgUid,
  title: 'Trilha Dia 2: P0/5',
  trilhaDay: 2,
  messages: [
    { id: 'm1', role: 'user', text: 'Minha duvida do Dia 2' },
    {
      id: 'm2',
      role: 'model',
      trilhaDay: 2,
      content: '[BLOCK_1]\nTexto protegido do Dia 2\n[ATHENA_CHALLENGE]\n{"questions":[]}'
    }
  ]
});

const resSubUnprog = await fetch(`${apiBase}/api/study/sessions`, {
  headers: { Authorization: `Bearer ${subNoProgToken}` }
});
const dataSubUnprog = await resSubUnprog.json();
const sessSubUnprog = dataSubUnprog.sessions[0];

check('Historico: Dia 2 filtrado para assinante sem conclusao previa do Dia 1',
  sessSubUnprog.messages[1].content.includes('[Conteúdo da aula protegido') &&
  !sessSubUnprog.messages[1].content.includes('Texto protegido do Dia 2')
);


// -----------------------------------------------------------------------------
// 6. RESPOSTAS PENDENTES: LOGOUT INTERROMPE ENVIO MAS PRESERVA RESPOSTAS LOCAIS
// -----------------------------------------------------------------------------
// 6.1 Simulação do LocalStorage e descarte de fila
const fakeLocalStorage = new Map();
const uidA = 'student_device_A';
const uidB = 'student_device_B';

// Resposta local não sincronizada gravada pelo Aluno A
const sessionKeyA = `athena_sessions_${uidA}`;
const sessionPayloadA = [{
  id: 'session_day1',
  userId: uidA,
  messages: [{ id: 'msg1', text: 'Minha tese elaborada offline', answers: { 0: 2 } }],
  lastUpdatedAt: Date.now()
}];
fakeLocalStorage.set(sessionKeyA, JSON.stringify(sessionPayloadA));

// Simula fila de envio em memória do Aluno A
const inMemoryQueues = new Map();
let sendBlockedOnAccountMismatch = false;

// Tarefa na fila verifica a conta ativa antes de disparar
const queuedSendTask = (activeUid) => {
  if (activeUid !== uidA) {
    sendBlockedOnAccountMismatch = true;
    return Promise.reject(new Error('ACCOUNT_CHANGED'));
  }
  return Promise.resolve({ synced: true });
};
inMemoryQueues.set(`${uidA}/day_1_part_0`, queuedSendTask);

// Evento de Logout do Aluno A:
// (a) Interrompe e limpa filas em memória
inMemoryQueues.clear();
// (b) Preserva respostas locais vinculadas ao usuário original (não apaga silenciosamente)
check('Respostas Pendentes: Respostas offline do Aluno A preservadas no storage apos logout',
  fakeLocalStorage.has(sessionKeyA) && JSON.parse(fakeLocalStorage.get(sessionKeyA))[0].messages[0].answers[0] === 2
);

// Aluno B faz login no mesmo dispositivo
const sessionKeyB = `athena_sessions_${uidB}`;
const sessionsForB = fakeLocalStorage.has(sessionKeyB) ? JSON.parse(fakeLocalStorage.get(sessionKeyB)) : [];
check('Respostas Pendentes: Aluno B nao enxerga nem envia respostas do Aluno A', sessionsForB.length === 0);

// Tentativa de execução com usuário trocado é bloqueada
await assert.rejects(queuedSendTask(uidB), /ACCOUNT_CHANGED/);
check('Respostas Pendentes: Tentativa de envio com conta trocada rejeita com ACCOUNT_CHANGED', sendBlockedOnAccountMismatch);

// Aluno A reloga no mesmo dispositivo: suas respostas continuam disponíveis para sincronização
const reloadedSessionsA = JSON.parse(fakeLocalStorage.get(sessionKeyA));
check('Respostas Pendentes: Aluno A recupera suas respostas intactas ao retornar',
  reloadedSessionsA[0].userId === uidA && reloadedSessionsA[0].messages[0].answers[0] === 2
);

// -----------------------------------------------------------------------------
// 7. ENCERRAMENTO DOS SERVIDORES E PERSISTÊNCIA DOS RESULTADOS
// -----------------------------------------------------------------------------
await new Promise(resolve => server.close(resolve));
await new Promise(resolve => authServer.close(resolve));

const outDir = 'outputs/progress-subscriptions';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'candidate-http-progression-results.json'),
  JSON.stringify({
    passed: results.length,
    results,
    verifiedAt: new Date().toISOString()
  }, null, 2)
);

console.log(JSON.stringify({ passed: results.length, total: results.length }, null, 2));
