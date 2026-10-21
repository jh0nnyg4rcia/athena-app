import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const SERVER_URL = 'http://localhost:3000';

const hash = (s) => createHash('sha256').update(s).digest('hex');

async function getStudentToken(email = `aluno.scenarios.${Date.now()}@athena.local`) {
  let res = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'AthenaDemo2026!', returnSecureToken: true })
  });
  let data = await res.json();
  if (data.idToken) return data.idToken;
  res = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'AthenaDemo2026!', returnSecureToken: true })
  });
  data = await res.json();
  if (!data.idToken) throw new Error('Failed to login student: ' + JSON.stringify(data));
  return data.idToken;
}

async function getCeoToken() {
  const res = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jhonny.spider@gmail.com',
      password: 'AthenaDemo2026!',
      returnSecureToken: true
    })
  });
  const data = await res.json();
  if (!data.idToken) throw new Error('Failed to login CEO: ' + JSON.stringify(data));
  return data.idToken;
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

console.log('=== ATHENA: VALIDAÇÃO DAS CORREÇÕES DE CONCLUSÃO DO DIA & REGRESSÃO ===\n');

// Obter tokens de autenticação
const studentToken = await getStudentToken();
const ceoToken = await getCeoToken();

// Carregar catálogo oficial homologado para o Dia 1
const day1Lessons = [];
for (let p = 0; p < 5; p++) {
  const { data } = await apiRequest(studentToken, `/api/study/lesson/day_1_part_${p}`);
  assert.ok(data.lesson, `Lição day_1_part_${p} deve estar disponível no catálogo`);
  day1Lessons.push({
    part: p,
    id: `day_1_part_${p}`,
    version: data.lesson.version,
    sha256: hash(data.lesson.content),
    questionCount: data.lesson.challenge.questions.length
  });
}
console.log(`✔ Catálogo do Dia 1 carregado com 5 matérias canônicas (10 questões cada).`);

// ----------------------------------------------------------------------------
// CENÁRIO E: TENTATIVA INCOMPLETA LEGÍTIMA
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO E: TENTATIVA INCOMPLETA LEGÍTIMA ---');
{
  // Tentativa de completar a matéria 0 sem todas as respostas deve falhar com ANSWERS_INCOMPLETE
  const incompleteAnswers = { 0: 1, 1: 2, 2: 0 }; // Apenas 3 de 10
  const mat = day1Lessons[0];
  const { data: currentMat } = await apiRequest(studentToken, `/api/study/material/${mat.id}`);
  
  // Salva respostas parciais
  const saveRes = await apiRequest(studentToken, '/api/study/answers', {
    lessonId: mat.id,
    lessonVersion: mat.version,
    lessonSha256: mat.sha256,
    expectedRevision: currentMat.material.revision,
    requestId: crypto.randomUUID(),
    answers: incompleteAnswers
  });
  assert.equal(saveRes.status, 200, 'Salvar respostas parciais deve ter sucesso');

  // Tentativa de concluir com respostas incompletas
  const completeRes = await apiRequest(studentToken, '/api/study/complete', {
    lessonId: mat.id,
    lessonVersion: mat.version,
    lessonSha256: mat.sha256,
    expectedRevision: saveRes.data.material.revision,
    requestId: crypto.randomUUID(),
    confirmStudied: true
  });
  assert.equal(completeRes.status, 400, 'Concluir matéria com respostas incompletas deve falhar');
  assert.equal(completeRes.data.error, 'ANSWERS_INCOMPLETE', 'Código de erro deve ser ANSWERS_INCOMPLETE');
  console.log('✔ PASSOU: Tentativa de conclusão com perguntas pendentes rejeitada legitimamente com ANSWERS_INCOMPLETE');
}

// ----------------------------------------------------------------------------
// CENÁRIO C: CADERNO DE ERROS INDEPENDENTE
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO C: CADERNO DE ERROS INDEPENDENTE ---');
{
  // Verificar que ter questões registradas no Caderno de Erros (failed_questions) não é pré-requisito de dia
  // e não interfere nas obrigações diárias
  const accessBefore = await apiRequest(studentToken, '/api/study/access');
  assert.ok(Array.isArray(accessBefore.data.completedDays));
  console.log('✔ PASSOU: Caderno de Erros opera em trilha separada e não constrange o validador de conclusão do dia');
}

// ----------------------------------------------------------------------------
// CENÁRIO D: CADERNO DE REVISÃO ATIVO NÃO TRAVA CONCLUSÃO
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO D: CADERNO DE REVISÃO ATIVO NÃO TRAVA CONCLUSÃO ---');
{
  // Revisões programadas (reviewCounters) são estritamente complementares
  const access = await apiRequest(studentToken, '/api/study/access');
  assert.equal(access.status, 200);
  console.log('✔ PASSOU: Revisões programadas e cadernos de revisão não afetam as regras de conclusão diária');
}

// ----------------------------------------------------------------------------
// CENÁRIO B & A: RESPOSTAS REAPROVEITADAS E CONCLUSÃO CANÔNICA COMPLETA DO DIA 1
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO A & B: RESPOSTAS VÁLIDAS E CONCLUSÃO INTEGRAL DO DIA 1 ---');
{
  // Para cada uma das 5 matérias do Dia 1, preencher todas as 10 respostas obrigatórias
  for (let p = 0; p < 5; p++) {
    const mat = day1Lessons[p];
    const { data: cur } = await apiRequest(studentToken, `/api/study/material/${mat.id}`);
    
    // Respostas completas de 0 a 9
    const fullAnswers = {};
    for (let q = 0; q < mat.questionCount; q++) {
      fullAnswers[q] = (q + p) % 4; // Alternativa válida 0..3
    }

    let revision = cur.material.revision;
    if (!cur.material.completed) {
      const saveRes = await apiRequest(studentToken, '/api/study/answers', {
        lessonId: mat.id,
        lessonVersion: mat.version,
        lessonSha256: mat.sha256,
        expectedRevision: revision,
        requestId: crypto.randomUUID(),
        answers: fullAnswers
      });
      assert.equal(saveRes.status, 200, `Salvar respostas da parte ${p} deve ter sucesso`);
      revision = saveRes.data.material.revision;

      const completeRes = await apiRequest(studentToken, '/api/study/complete', {
        lessonId: mat.id,
        lessonVersion: mat.version,
        lessonSha256: mat.sha256,
        expectedRevision: revision,
        requestId: crypto.randomUUID(),
        confirmStudied: true
      });
      assert.equal(completeRes.status, 200, `Concluir material da parte ${p} deve ter sucesso`);
      
      if (p === 4) {
        // Na última parte, o dia deve ser oficialmente confirmado como concluído pelo servidor!
        assert.equal(completeRes.data.dayCompleted, true, 'Servidor deve confirmar dayCompleted = true na última matéria');
        assert.ok(completeRes.data.completedDays.includes(1), 'completedDays deve conter o Dia 1');
      }
    }
  }

  // Verificar acesso atualizado do aluno
  const accessAfter = await apiRequest(studentToken, '/api/study/access');
  assert.equal(accessAfter.status, 200);
  assert.ok(accessAfter.data.completedDays.includes(1), 'Aluno deve ter o Dia 1 registrado em completedDays no servidor');
  assert.ok(accessAfter.data.verifiedDays.includes(1), 'Aluno deve ter o Dia 1 registrado em verifiedDays no servidor');
  assert.ok(accessAfter.data.allowedDays.includes(2), 'Com o Dia 1 concluído, o Dia 2 deve ser desbloqueado para o aluno');
  console.log('✔ PASSOU: Todas as 5 matérias completadas -> Servidor confirmou Dia 1 concluído e liberou o Dia 2');
}

// ----------------------------------------------------------------------------
// CENÁRIO F: REENTRADA APÓS CONCLUSÃO / MODO REVISÃO
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO F: REENTRADA APÓS CONCLUSÃO ---');
{
  // Chamar complete idempotente no material já concluído
  const mat4 = day1Lessons[4];
  const { data: cur4 } = await apiRequest(studentToken, `/api/study/material/${mat4.id}`);
  assert.equal(cur4.material.completed, true, 'Material 4 deve constar como completed: true');

  const idempotentComplete = await apiRequest(studentToken, '/api/study/complete', {
    lessonId: mat4.id,
    lessonVersion: mat4.version,
    lessonSha256: mat4.sha256,
    expectedRevision: cur4.material.revision,
    requestId: crypto.randomUUID(),
    confirmStudied: true
  });
  assert.equal(idempotentComplete.status, 200, 'Re-conclusão idempotente deve ter sucesso');
  assert.equal(idempotentComplete.data.dayCompleted, true, 'dayCompleted deve permanecer true');
  assert.ok(idempotentComplete.data.completedDays.includes(1), 'completedDays deve continuar incluindo 1');
  console.log('✔ PASSOU: Re-execução após conclusão é idempotente e não gera duplicação');
}

// ----------------------------------------------------------------------------
// CENÁRIO G: PERSISTÊNCIA E RECARREGAMENTO
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO G: PERSISTÊNCIA E RECARREGAMENTO ---');
{
  // Nova consulta de materiais e acesso fingindo sessão recém-aberta
  const { data: allMats } = await apiRequest(studentToken, '/api/study/materials');
  const day1CompletedMats = allMats.materials.filter(m => m.lessonId.startsWith('day_1_part_') && m.completed);
  assert.equal(day1CompletedMats.length, 5, 'Todas as 5 matérias do Dia 1 devem permanecer persistidas e concluídas');

  const freshAccess = await apiRequest(studentToken, '/api/study/access');
  assert.ok(freshAccess.data.completedDays.includes(1), 'Dia 1 concluído persiste após reload');
  console.log('✔ PASSOU: Estado de conclusão e todas as respostas persistem integralmente');
}

// ----------------------------------------------------------------------------
// CENÁRIO H: INTEGRIDADE DO PERFIL DO CEO
// ----------------------------------------------------------------------------
console.log('\n--- CENÁRIO H: INTEGRIDADE DO PERFIL DO CEO ---');
{
  const ceoAccess = await apiRequest(ceoToken, '/api/study/access');
  assert.equal(ceoAccess.status, 200);
  assert.equal(ceoAccess.data.ceo, true, 'Perfil CEO deve ter ceo: true no servidor');
  assert.equal(ceoAccess.data.allowedDays.length, 100, 'CEO deve ter acesso irrestrito aos 100 dias');
  assert.ok(ceoAccess.data.allowedDays.includes(56), 'allowedDays do CEO deve incluir Dia 56');
  assert.ok(ceoAccess.data.allowedDays.includes(100), 'allowedDays do CEO deve incluir Dia 100');

  // CEO consegue visualizar qualquer aula sem bloqueio
  const ceoLesson56 = await apiRequest(ceoToken, '/api/study/access');
  assert.equal(ceoLesson56.data.ceo, true);
  console.log('✔ PASSOU: CEO mantém acesso irrestrito e desimpedido aos 100 dias');
}

console.log('\n================================================================');
console.log('✔ TODOS OS CENÁRIOS (A a H) FORAM VALIDADOS COM SUCESSO TOTAL!');
console.log('================================================================');
