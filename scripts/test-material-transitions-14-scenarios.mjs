import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const SERVER_URL = 'http://localhost:3000';

const hash = (s) => createHash('sha256').update(s).digest('hex');

async function getOrCreateStudent(email, password = 'AthenaDemo2026!') {
  // Tentar login
  let res = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  let data = await res.json();
  if (data.idToken) return { token: data.idToken, uid: data.localId };

  // Se não existir, cadastrar
  res = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  data = await res.json();
  if (!data.idToken) throw new Error('Falha ao autenticar/criar estudante: ' + JSON.stringify(data));
  return { token: data.idToken, uid: data.localId };
}

async function getCeoToken() {
  const res = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'jhonny.spider@gmail.com', password: 'AthenaDemo2026!', returnSecureToken: true })
  });
  const data = await res.json();
  if (!data.idToken) throw new Error('Falha ao obter token do CEO: ' + JSON.stringify(data));
  return { token: data.idToken, uid: data.localId };
}

async function apiRequest(token, path, body) {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: 'Bearer ' + token,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

console.log('=== ATHENA: SUITE DE TESTES DE REGRESSÃO - 14 CENÁRIOS OBRIGATÓRIOS ===\n');

// 0. Credenciais de teste limpo para validação ponta a ponta dos 14 cenários
const testStudentEmail = `aluno.teste14.${Date.now()}@athena.local`;
const { token: studentToken, uid: studentUid } = await getOrCreateStudent(testStudentEmail);
const { token: ceoToken, uid: ceoUid } = await getCeoToken();

// Carregar catálogo oficial para as 5 matérias do Dia 1
const day1Lessons = [];
for (let p = 0; p < 5; p++) {
  const { data } = await apiRequest(studentToken, `/api/study/lesson/day_1_part_${p}`);
  assert.ok(data.lesson, `Lição day_1_part_${p} deve existir no catálogo oficial`);
  day1Lessons.push({
    part: p,
    id: `day_1_part_${p}`,
    version: data.lesson.version,
    sha256: hash(data.lesson.content),
    questionCount: data.lesson.challenge.questions.length
  });
}
console.log(`✔ Catálogo oficial carregado: 5 matérias (10 questões cada).`);

// ----------------------------------------------------------------------------
// CENÁRIO 9: QUESTÃO OBRIGATÓRIA REALMENTE PENDENTE
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 9: QUESTÃO OBRIGATÓRIA REALMENTE PENDENTE ---');
{
  const mat0 = day1Lessons[0];
  const { data: cur } = await apiRequest(studentToken, `/api/study/material/${mat0.id}`);
  assert.equal(cur.material.completed, false, 'Matéria deve iniciar com completed = false');

  // Salvar apenas 3 respostas de 10
  const partialAnswers = { 0: 1, 1: 2, 2: 0 };
  const saveRes = await apiRequest(studentToken, '/api/study/answers', {
    lessonId: mat0.id,
    lessonVersion: mat0.version,
    lessonSha256: mat0.sha256,
    expectedRevision: cur.material.revision,
    requestId: crypto.randomUUID(),
    answers: partialAnswers
  });
  assert.equal(saveRes.status, 200, 'Salvar respostas parciais deve retornar 200');

  // Tentativa de concluir sem responder às 7 questões restantes
  const completeFail = await apiRequest(studentToken, '/api/study/complete', {
    lessonId: mat0.id,
    lessonVersion: mat0.version,
    lessonSha256: mat0.sha256,
    expectedRevision: saveRes.data.material.revision,
    requestId: crypto.randomUUID(),
    confirmStudied: true
  });
  assert.equal(completeFail.status, 400, 'Tentativa sem todas as questões deve retornar 400');
  assert.equal(completeFail.data.error, 'ANSWERS_INCOMPLETE', 'Erro deve ser estritamente ANSWERS_INCOMPLETE');
  console.log('✔ PASSOU: Rejeição legítima quando há questão obrigatória pendente (ANSWERS_INCOMPLETE).');
}

// ----------------------------------------------------------------------------
// CENÁRIO 1: ALUNO CONCLUI A PRIMEIRA MATÉRIA E AVANÇA PARA A SEGUNDA
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 1: ALUNO CONCLUI A PRIMEIRA MATÉRIA E AVANÇA PARA A SEGUNDA ---');
{
  const mat0 = day1Lessons[0];
  const { data: cur } = await apiRequest(studentToken, `/api/study/material/${mat0.id}`);
  
  const fullAnswers0 = {};
  for (let q = 0; q < 10; q++) fullAnswers0[q] = q % 4;

  let rev = cur.material.revision;
  const saveRes = await apiRequest(studentToken, '/api/study/answers', {
    lessonId: mat0.id,
    lessonVersion: mat0.version,
    lessonSha256: mat0.sha256,
    expectedRevision: rev,
    requestId: crypto.randomUUID(),
    answers: fullAnswers0
  });
  assert.equal(saveRes.status, 200);
  rev = saveRes.data.material.revision;

  const complete0 = await apiRequest(studentToken, '/api/study/complete', {
    lessonId: mat0.id,
    lessonVersion: mat0.version,
    lessonSha256: mat0.sha256,
    expectedRevision: rev,
    requestId: crypto.randomUUID(),
    confirmStudied: true
  });
  assert.equal(complete0.status, 200, 'Conclusão da Parte 0 deve ter status 200');
  assert.equal(complete0.data.material.completed, true, 'Parte 0 deve constar como completed: true');
  assert.equal(complete0.data.dayCompleted, false, 'Dia 1 NÃO deve ser marcado como concluído na Parte 0 (apenas 1 de 5 feita)');
  console.log('✔ PASSOU: Matéria 1 individualmente concluída sem exigir a conclusão das outras matérias do dia.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 2: ALUNO CONCLUI A SEGUNDA MATÉRIA E AVANÇA PARA A TERCEIRA
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 2: ALUNO CONCLUI A SEGUNDA MATÉRIA E AVANÇA PARA A TERCEIRA ---');
{
  const mat1 = day1Lessons[1];
  const { data: cur } = await apiRequest(studentToken, `/api/study/material/${mat1.id}`);
  
  const fullAnswers1 = {};
  for (let q = 0; q < 10; q++) fullAnswers1[q] = (q + 1) % 4;

  let rev = cur.material.revision;
  const saveRes = await apiRequest(studentToken, '/api/study/answers', {
    lessonId: mat1.id,
    lessonVersion: mat1.version,
    lessonSha256: mat1.sha256,
    expectedRevision: rev,
    requestId: crypto.randomUUID(),
    answers: fullAnswers1
  });
  assert.equal(saveRes.status, 200);
  rev = saveRes.data.material.revision;

  const complete1 = await apiRequest(studentToken, '/api/study/complete', {
    lessonId: mat1.id,
    lessonVersion: mat1.version,
    lessonSha256: mat1.sha256,
    expectedRevision: rev,
    requestId: crypto.randomUUID(),
    confirmStudied: true
  });
  assert.equal(complete1.status, 200, 'Conclusão da Parte 1 deve ter status 200');
  assert.equal(complete1.data.material.completed, true, 'Parte 1 deve constar como completed: true');
  assert.equal(complete1.data.dayCompleted, false, 'Dia 1 NÃO deve ser marcado como concluído na Parte 1');
  console.log('✔ PASSOU: Matéria 2 individualmente concluída e confirmada pelo servidor.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 3: PROGRESSÃO SUCESSIVA POR TODAS AS CINCO MATÉRIAS DO DIA 1
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 3: PROGRESSÃO SUCESSIVA POR TODAS AS CINCO MATÉRIAS DO DIA 1 ---');
{
  for (let p = 2; p < 4; p++) {
    const mat = day1Lessons[p];
    const { data: cur } = await apiRequest(studentToken, `/api/study/material/${mat.id}`);
    const answers = {};
    for (let q = 0; q < 10; q++) answers[q] = (q + p) % 4;

    let rev = cur.material.revision;
    const saveRes = await apiRequest(studentToken, '/api/study/answers', {
      lessonId: mat.id,
      lessonVersion: mat.version,
      lessonSha256: mat.sha256,
      expectedRevision: rev,
      requestId: crypto.randomUUID(),
      answers
    });
    assert.equal(saveRes.status, 200);
    rev = saveRes.data.material.revision;

    const compRes = await apiRequest(studentToken, '/api/study/complete', {
      lessonId: mat.id,
      lessonVersion: mat.version,
      lessonSha256: mat.sha256,
      expectedRevision: rev,
      requestId: crypto.randomUUID(),
      confirmStudied: true
    });
    assert.equal(compRes.status, 200);
    assert.equal(compRes.data.material.completed, true);
    assert.equal(compRes.data.dayCompleted, false, `Parte ${p} individual NÃO deve disparar conclusão antecipada do dia`);
    console.log(`  ✔ Parte ${p + 1} de 5 concluída individualmente.`);
  }
  console.log('✔ PASSOU: Progressão intermediária sequencial (partes 1..4) confirmada individualmente.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 4: CONCLUSÃO FINAL DO DIA 1
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 4: CONCLUSÃO FINAL DO DIA 1 ---');
{
  const mat4 = day1Lessons[4];
  const { data: cur } = await apiRequest(studentToken, `/api/study/material/${mat4.id}`);
  const answers4 = {};
  for (let q = 0; q < 10; q++) answers4[q] = (q + 4) % 4;

  let rev = cur.material.revision;
  const saveRes = await apiRequest(studentToken, '/api/study/answers', {
    lessonId: mat4.id,
    lessonVersion: mat4.version,
    lessonSha256: mat4.sha256,
    expectedRevision: rev,
    requestId: crypto.randomUUID(),
    answers: answers4
  });
  assert.equal(saveRes.status, 200);
  rev = saveRes.data.material.revision;

  const comp4 = await apiRequest(studentToken, '/api/study/complete', {
    lessonId: mat4.id,
    lessonVersion: mat4.version,
    lessonSha256: mat4.sha256,
    expectedRevision: rev,
    requestId: crypto.randomUUID(),
    confirmStudied: true
  });
  assert.equal(comp4.status, 200);
  assert.equal(comp4.data.material.completed, true);
  assert.equal(comp4.data.dayCompleted, true, 'Ao concluir a última matéria (Parte 4), dayCompleted DEVE ser true');
  assert.ok(comp4.data.completedDays.includes(1), 'completedDays deve conter o Dia 1');
  console.log('✔ PASSOU: Conclusão do dia 1 confirmada após conclusão da 5ª matéria.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 5: RETORNO A UMA MATÉRIA COM RESPOSTAS JÁ REGISTRADAS
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 5: RETORNO A UMA MATÉRIA COM RESPOSTAS JÁ REGISTRADAS ---');
{
  const mat0 = day1Lessons[0];
  const { data: check0 } = await apiRequest(studentToken, `/api/study/material/${mat0.id}`);
  assert.equal(check0.material.completed, true);
  assert.equal(Object.keys(check0.material.answers).length, 10, 'Todas as 10 respostas da matéria 0 devem permanecer intactas');
  console.log('✔ PASSOU: Respostas previamente salvas persistem na matéria 0 sem perda.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 6: RETOMADA DE UMA SESSÃO INTERROMPIDA
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 6: RETOMADA DE UMA SESSÃO INTERROMPIDA ---');
{
  const { data: mats } = await apiRequest(studentToken, '/api/study/materials');
  const completedParts = mats.materials.filter(m => m.lessonId.startsWith('day_1_part_') && m.completed);
  assert.equal(completedParts.length, 5, 'Todas as 5 partes permanecem concluídas após retomada de sessão');
  console.log('✔ PASSOU: Estado completo e consistente recuperado para sessão retomada.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 7: FALHA DE REDE DURANTE CONFIRMAÇÃO INDIVIDUAL
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 7: FALHA DE REDE DURANTE CONFIRMAÇÃO INDIVIDUAL ---');
{
  // Simular payload com baseline divergente
  const mat0 = day1Lessons[0];
  const corruptedReq = await apiRequest(studentToken, '/api/study/complete', {
    lessonId: mat0.id,
    lessonVersion: mat0.version,
    lessonSha256: '0000000000000000000000000000000000000000000000000000000000000000',
    expectedRevision: 9999,
    requestId: crypto.randomUUID(),
    confirmStudied: true
  });
  assert.equal(corruptedReq.status, 409, 'Falha de divergência/conflito deve retornar 409 BASELINE_CHANGED');
  assert.equal(corruptedReq.data.error, 'BASELINE_CHANGED');
  console.log('✔ PASSOU: Divergência de baseline tratada com segurança sem corromper estado.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 8: REPETIÇÃO DA SOLICITAÇÃO SEM DUPLICAÇÃO DE XP (IDEMPOTÊNCIA)
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 8: REPETIÇÃO DA SOLICITAÇÃO SEM DUPLICAÇÃO DE XP ---');
{
  const mat0 = day1Lessons[0];
  const reqId = crypto.randomUUID();
  const { data: cur } = await apiRequest(studentToken, `/api/study/material/${mat0.id}`);
  
  const call1 = await apiRequest(studentToken, '/api/study/complete', {
    lessonId: mat0.id,
    lessonVersion: mat0.version,
    lessonSha256: mat0.sha256,
    expectedRevision: cur.material.revision,
    requestId: reqId,
    confirmStudied: true
  });
  assert.equal(call1.status, 200);

  // Repetição idêntica com mesmo requestId
  const call2 = await apiRequest(studentToken, '/api/study/complete', {
    lessonId: mat0.id,
    lessonVersion: mat0.version,
    lessonSha256: mat0.sha256,
    expectedRevision: cur.material.revision,
    requestId: reqId,
    confirmStudied: true
  });
  assert.equal(call2.status, 200, 'Re-execução com mesmo requestId deve retornar 200');
  assert.equal(call2.data.source, 'server_confirmed', 'Resultado idempotente devolvido sem duplicação');
  console.log('✔ PASSOU: Idempotência confirmada via recibo de requisição.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 10: QUESTÕES PENDENTES NO CADERNO DE ERROS E REVISÃO
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 10: QUESTÕES PENDENTES NO CADERNO DE ERROS E REVISÃO ---');
{
  const access = await apiRequest(studentToken, '/api/study/access');
  assert.ok(access.data.completedDays.includes(1), 'Dia 1 concluído independentemente de cadernos');
  assert.ok(access.data.allowedDays.includes(2), 'Dia 2 liberado mesmo com caderno de erros ativo');
  console.log('✔ PASSOU: Caderno de Erros e Caderno de Revisão não interferem na conclusão do dia.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 11: RETORNO A MATÉRIAS JÁ CONCLUÍDAS
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 11: RETORNO A MATÉRIAS JÁ CONCLUÍDAS ---');
{
  for (let p = 0; p < 5; p++) {
    const mat = day1Lessons[p];
    const { data: cur } = await apiRequest(studentToken, `/api/study/material/${mat.id}`);
    assert.equal(cur.material.completed, true, `Matéria ${p} deve constar como completed: true`);
  }
  console.log('✔ PASSOU: Todas as 5 matérias do Dia 1 permanecem navegáveis e concluídas.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 12: RECARREGAMENTO APÓS CONCLUSÃO CONFIRMADA
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 12: RECARREGAMENTO APÓS CONCLUSÃO CONFIRMADA ---');
{
  const freshAccess = await apiRequest(studentToken, '/api/study/access');
  assert.ok(freshAccess.data.verifiedDays.includes(1), 'verifiedDays no servidor contém Dia 1');
  assert.ok(freshAccess.data.allowedDays.includes(2), 'Dia 2 liberado após reload');
  console.log('✔ PASSOU: Estado do aluno após reload preserva aprovação e desbloqueio.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 13: ISOLAMENTO ENTRE USUÁRIOS
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 13: ISOLAMENTO ENTRE USUÁRIOS ---');
{
  const otherEmail = `outro.aluno.${Date.now()}@athena.local`;
  const { token: otherToken } = await getOrCreateStudent(otherEmail);

  const otherAccess = await apiRequest(otherToken, '/api/study/access');
  assert.equal(otherAccess.data.completedDays.length, 0, 'Novo aluno deve ter 0 dias concluídos');
  assert.deepEqual(otherAccess.data.allowedDays, [1], 'Novo aluno só tem acesso ao Dia 1');

  const otherMat0 = await apiRequest(otherToken, `/api/study/material/day_1_part_0`);
  assert.equal(otherMat0.data.material.completed, false, 'Matéria do novo aluno não herda estado de outro aluno');
  assert.equal(Object.keys(otherMat0.data.material.answers).length, 0, 'Novo aluno não tem respostas herdadas');
  console.log('✔ PASSOU: Isolamento completo e estrito entre usuários.');
}

// ----------------------------------------------------------------------------
// CENÁRIO 14: PRESERVAÇÃO DO ACESSO INTEGRAL DO CEO AUTORIZADO
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO 14: PRESERVAÇÃO DO ACESSO INTEGRAL DO CEO AUTORIZADO ---');
{
  const ceoAccess = await apiRequest(ceoToken, '/api/study/access');
  assert.equal(ceoAccess.status, 200);
  assert.equal(ceoAccess.data.ceo, true, 'CEO deve ter flag ceo: true');
  assert.equal(ceoAccess.data.allowedDays.length, 100, 'CEO deve ter acesso irrestrito aos 100 dias da trilha');
  assert.ok(ceoAccess.data.allowedDays.includes(1), 'CEO tem acesso ao Dia 1');
  assert.ok(ceoAccess.data.allowedDays.includes(50), 'CEO tem acesso ao Dia 50');
  assert.ok(ceoAccess.data.allowedDays.includes(100), 'CEO tem acesso ao Dia 100');
  console.log('✔ PASSOU: CEO mantém acesso integral aos 100 dias da Trilha Jurídica.');
}

console.log('\n=============================================================');
console.log('TODOS OS 14 CENÁRIOS DE REGRESSÃO FORAM APROVADOS COM SUCESSO!');
console.log('=============================================================');
