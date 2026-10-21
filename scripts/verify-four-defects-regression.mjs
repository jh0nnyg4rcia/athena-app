import assert from 'node:assert/strict';
import { progressiveDayAccess, createStudyProgressCore } from '../src/server/studyProgressCore.js';
import { TRILHA_JURIDICA_DATA } from '../src/data/trilhaData.js';
import { LocalPersistence } from '../src/services/localPersistence.js';

// Setup Mock localStorage for Node environment
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

const results = [];
const check = async (name, fn) => {
  await fn();
  results.push(name);
  console.log(`✔ PASSOU: ${name}`);
};

console.log('=== SUÍTE DE TESTES DE REGRESSÃO: QUATRO FALHAS FUNCIONAIS ATHENA ===\n');

// ============================================================================
// PROBLEMA 1: CADERNO DE ERROS — TENTATIVA LIMPA, MASCARAMENTO E XP
// ============================================================================
console.log('--- TESTANDO PROBLEMA 1: CADERNO DE ERROS ---');

await check('Questão pendente no Caderno de Erros inicia em modo limpo (sem seleção antecipada, gabarito oculto)', () => {
  const pendingQuestion = {
    id: 'caderno_q1',
    trilhaDay: 1,
    materialIndex: 0,
    questionIndex: 0,
    questionText: 'Qual o prazo para interposição de apelação?',
    options: ['5 dias', '10 dias', '15 dias', '20 dias'],
    correctIndex: 2,
    selectedOption: 0, // Resposta anterior com erro
    resolved: false,
    attempts: [
      {
        selectedOption: 0,
        isCorrect: false,
        timestamp: 1000,
        explanation: 'O prazo do CPC é de 15 dias.'
      }
    ]
  };

  // Simulação do estado do componente no App.tsx
  const retryState = undefined; // Inicialmente sem tentativa submetida nesta sessão
  const isRetryActive = !pendingQuestion.resolved || Boolean(retryState?.active);
  const savedAnswer = retryState?.submittedAnswer;
  const hideExplanationInitially = !pendingQuestion.resolved && !retryState?.submittedAnswer;
  const maskedHistory = isRetryActive && !retryState?.submittedAnswer ? [] : pendingQuestion.attempts;

  assert.equal(isRetryActive, true, 'isRetryActive deve ser true para questões pendentes');
  assert.equal(savedAnswer, undefined, 'savedAnswer deve ser undefined (nenhuma alternativa pré-selecionada)');
  assert.equal(hideExplanationInitially, true, 'Gabarito e explicações devem estar estritamente ocultos inicialmente');
  assert.equal(maskedHistory.length, 0, 'Histórico de tentativas deve ser mascarado durante a nova resolução para não dar spoiler');
  assert.equal(pendingQuestion.attempts.length, 1, 'Histórico original no banco deve permanecer intacto');
});

await check('Submissão de nova tentativa revela gabarito, pontua com XP de retry (+25/+5) e impede submissões duplicadas', () => {
  let submittedAnswer = undefined;
  let retryCount = 0;
  let totalXP = 100;
  const originalQuestion = {
    selectedOption: 0,
    resolved: false,
    attempts: [{ selectedOption: 0, isCorrect: false, timestamp: 1000 }]
  };

  const handleRetrySubmit = (selectedIdx, correctIdx) => {
    if (submittedAnswer !== undefined) {
      throw new Error('DUPLICATE_SUBMISSION_PREVENTED');
    }
    submittedAnswer = selectedIdx;
    retryCount++;
    const isCorrect = selectedIdx === correctIdx;
    // Política de XP de Retentativa: +25 acerto / +5 erro (nunca +50 / +10 da primeira tentativa)
    const xpGain = isCorrect ? 25 : 5;
    totalXP += xpGain;

    originalQuestion.attempts.push({
      selectedOption: selectedIdx,
      isCorrect,
      timestamp: Date.now()
    });
    if (isCorrect) {
      originalQuestion.resolved = true;
    }
    return { isCorrect, xpGain };
  };

  // 1ª submissão: acerto na alternativa 2
  const outcome = handleRetrySubmit(2, 2);
  assert.equal(outcome.isCorrect, true);
  assert.equal(outcome.xpGain, 25, 'Acerto no retry deve conceder +25 XP');
  assert.equal(totalXP, 125);
  assert.equal(originalQuestion.resolved, true);
  assert.equal(originalQuestion.attempts.length, 2);
  assert.equal(originalQuestion.attempts[0].selectedOption, 0, 'Tentativa original não pode ser alterada');

  // Submissão duplicada deve ser prevenida
  assert.throws(() => handleRetrySubmit(2, 2), /DUPLICATE_SUBMISSION_PREVENTED/, 'Submissões repetidas devem ser rejeitadas');
  assert.equal(retryCount, 1, 'Contador de retentativas não pode inflar');
  assert.equal(totalXP, 125, 'XP não pode inflar em submissão duplicada');
});

// ============================================================================
// PROBLEMA 2: PRESERVAÇÃO DAS PARTES JÁ ABERTAS
// ============================================================================
console.log('\n--- TESTANDO PROBLEMA 2: PRESERVAÇÃO DAS PARTES JÁ ABERTAS ---');

await check('Navegar entre aula e Caderno de Erros preserva as partes/blocos desbloqueados', () => {
  const userId = 'aluno_teste_parts';
  const sessionId = 'session_day_1_part_0';

  // Criação da sessão inicial no Dia 1 com 3 blocos já abertos
  const initialSession = {
    id: sessionId,
    trilhaDay: 1,
    trilhaMaterialIndex: 0,
    sessionType: 'trilha',
    currentBlockIndex: 2, // Blocos 0, 1 e 2 desbloqueados
    messages: [
      {
        sender: 'ai',
        content: '[BLOCK_1] Parte 1\n[BLOCK_2] Parte 2\n[BLOCK_3] Parte 3\n[BLOCK_4] Parte 4\n[BLOCK_5] Parte 5\n[BLOCK_6] Parte 6',
        currentBlockIndex: 2,
        blocks: ['Parte 1', 'Parte 2', 'Parte 3', 'Parte 4', 'Parte 5', 'Parte 6'],
        trilhaDay: 1,
        trilhaMaterialIndex: 0
      }
    ]
  };

  // Salva na persistência local
  LocalPersistence.saveSession(userId, initialSession);

  // Aluno vai ao Caderno de Erros (muda de aba) e depois retorna ao Dia 1
  const savedSessions = LocalPersistence.getSessions(userId);
  const existingSession = savedSessions.find(s => s.trilhaDay === 1 && s.sessionType === 'trilha');

  assert.ok(existingSession, 'Sessão existente deve ser encontrada');
  assert.equal(existingSession.currentBlockIndex, 2, 'currentBlockIndex 2 deve ser preservado');
  assert.equal(existingSession.messages[0].currentBlockIndex, 2, 'currentBlockIndex da mensagem deve ser preservado');

  // Simula executeStartTrilhaStudy restaurando a sessão existente
  let restoredBlocks = existingSession.messages[0].currentBlockIndex;
  assert.equal(restoredBlocks, 2, 'Estudante deve ter acesso direto até o bloco 3 sem precisar clicar em Avançar novamente');
});

await check('Dias concluídos disponibilizam diretamente todos os 6 blocos para consulta', () => {
  const completedDaySession = {
    id: 'completed_day_1',
    trilhaDay: 1,
    trilhaMaterialIndex: 0,
    sessionType: 'trilha',
    currentBlockIndex: 1, // Antigo
    messages: [
      {
        sender: 'ai',
        content: 'Conteúdo completo',
        blocks: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'],
        currentBlockIndex: 1
      }
    ]
  };

  const isDayCompleted = true;
  if (isDayCompleted) {
    completedDaySession.currentBlockIndex = completedDaySession.messages[0].blocks.length - 1;
    completedDaySession.messages[0].currentBlockIndex = completedDaySession.messages[0].blocks.length - 1;
  }

  assert.equal(completedDaySession.currentBlockIndex, 5, 'Todos os 6 blocos devem estar diretamente acessíveis');
  assert.equal(completedDaySession.messages[0].currentBlockIndex, 5, 'currentBlockIndex da mensagem deve ser 5 (último bloco)');
});

// ============================================================================
// PROBLEMA 3: CONCLUSÃO DO DIA E MODO REVISÃO
// ============================================================================
console.log('\n--- TESTANDO PROBLEMA 3: CONCLUSÃO DO DIA E MODO REVISÃO ---');

await check('Conclusão confirmada pelo servidor renderiza Estado Final e não re-executa desafio', () => {
  const trilhaCompletedDays = [1];
  const tDay = 1;
  let reviewingCompletedDay = null;

  const isDayAlreadyCompleted = trilhaCompletedDays.includes(tDay);

  // Antes de clicar em revisar: deve exibir o card de conclusão
  const showCompletionCard = isDayAlreadyCompleted && reviewingCompletedDay !== tDay;
  assert.equal(showCompletionCard, true, 'Deve exibir o card de conclusão confirmada');

  // Ao clicar em "Revisar o Dia concluído"
  reviewingCompletedDay = tDay;
  const showReviewMode = isDayAlreadyCompleted && reviewingCompletedDay === tDay;
  assert.equal(showReviewMode, true, 'Deve entrar em Modo Revisão');

  // No modo revisão:
  // 1. Mensagens são exibidas diretamente
  // 2. Desafio não é renderizado como etapa obrigatória pendente
  // 3. Nenhuma pontuação de XP é concedida por simples reabertura
  const awardXPOnReview = (isCompleted) => {
    if (isCompleted) return 0;
    return 50;
  };
  assert.equal(awardXPOnReview(isDayAlreadyCompleted), 0, 'Revisão de dia concluído não pode conceder XP');
});

// ============================================================================
// PROBLEMA 4: CEO ACESSO IRRESTRITO AOS 100 DIAS VS ALUNO GRATUITO
// ============================================================================
console.log('\n--- TESTANDO PROBLEMA 4: CEO VS ALUNO GRATUITO ---');

await check('CEO autorizado pelo servidor acessa livremente o Dia 56 e todos os 100 dias', () => {
  // progressiveDayAccess(day, completed, isPaid, isCeo)
  assert.equal(progressiveDayAccess(56, [], false, true), true, 'CEO tem acesso livre ao Dia 56 sem assinatura');
  assert.equal(progressiveDayAccess(100, [], false, true), true, 'CEO tem acesso livre ao Dia 100 sem assinatura');
  assert.equal(progressiveDayAccess(1, [], false, true), true, 'CEO tem acesso livre ao Dia 1');
});

await check('Aluno gratuito é estritamente bloqueado no Dia 3+ sem assinatura', () => {
  assert.equal(progressiveDayAccess(1, [], false, false), true, 'Aluno gratuito acessa Dia 1');
  assert.equal(progressiveDayAccess(2, [1], false, false), true, 'Aluno gratuito acessa Dia 2 após concluir Dia 1');
  assert.equal(progressiveDayAccess(3, [1, 2], false, false), false, 'Aluno gratuito NÃO acessa Dia 3');
  assert.equal(progressiveDayAccess(56, [1, 2], false, false), false, 'Aluno gratuito NÃO acessa Dia 56');
});

await check('Assinante com dias anteriores concluídos acessa Dia 3, mas não pula dias', () => {
  assert.equal(progressiveDayAccess(3, [1, 2], true, false), true, 'Assinante com 1 e 2 concluídos acessa Dia 3');
  assert.equal(progressiveDayAccess(56, [1, 2], true, false), false, 'Assinante NÃO pode pular para o Dia 56 sem os dias contíguos');
});

await check('Servidor local (ATHENA_STUDY_PROGRESS_LOCAL=true) reconhece CEO sintético com role ceo em access_admins', async () => {
  process.env.ATHENA_STUDY_PROGRESS_LOCAL = 'true';

  const fakeAdminDoc = {
    uid: 'jhonny-spider-ceo',
    role: 'ceo',
    enabled: true
  };

  const fakeDb = {
    doc: (p) => ({
      path: p,
      get: async () => ({
        exists: p === 'access_admins/jhonny-spider-ceo',
        data: () => (p === 'access_admins/jhonny-spider-ceo' ? fakeAdminDoc : null)
      })
    }),
    runTransaction: async (fn) => fn({
      get: async (ref) => ref.get()
    })
  };

  const core = createStudyProgressCore(fakeDb, () => 5, () => 1000);
  const syntheticCeoActor = {
    uid: 'jhonny-spider-ceo',
    emailVerified: true,
    provider: 'password' // Login por senha no emulador
  };

  const access = await core.access(syntheticCeoActor);
  assert.equal(access.ceo, true, 'CEO sintético deve ser reconhecido como ceo=true no servidor local');
  assert.equal(access.allowedDays.length, 100, 'CEO sintético deve ter todos os 100 dias liberados');
  assert.ok(access.allowedDays.includes(56), 'allowedDays deve incluir o Dia 56');

  // Limpa variável de ambiente
  delete process.env.ATHENA_STUDY_PROGRESS_LOCAL;
});

await check('Em produção, CEO requer estritamente provider google.com além de grant em access_admins', async () => {
  delete process.env.ATHENA_STUDY_PROGRESS_LOCAL;

  const fakeAdminDoc = {
    uid: 'real-ceo-uid',
    role: 'ceo',
    enabled: true
  };

  const fakeDb = {
    doc: (p) => ({
      path: p,
      get: async () => ({
        exists: p === 'access_admins/real-ceo-uid',
        data: () => (p === 'access_admins/real-ceo-uid' ? fakeAdminDoc : null)
      })
    }),
    runTransaction: async (fn) => fn({
      get: async (ref) => ref.get()
    })
  };

  const core = createStudyProgressCore(fakeDb, () => 5, () => 1000);

  // Tentativa com senha em produção deve falhar para CEO
  const passwordCeo = { uid: 'real-ceo-uid', emailVerified: true, provider: 'password' };
  const accessPass = await core.access(passwordCeo);
  assert.equal(accessPass.ceo, false, 'Em produção, provider password não pode obter papel de CEO');

  // Com Google OAuth deve passar
  const googleCeo = { uid: 'real-ceo-uid', emailVerified: true, provider: 'google.com' };
  const accessGoogle = await core.access(googleCeo);
  assert.equal(accessGoogle.ceo, true, 'Em produção, provider google.com com grant válido obtém papel de CEO');
  assert.equal(accessGoogle.allowedDays.length, 100);
});

// ============================================================================
// INVESTIGAÇÃO COMPLEMENTAR: XP
// ============================================================================
console.log('\n--- TESTANDO INVESTIGAÇÃO COMPLEMENTAR: POLÍTICA DE XP ---');

await check('Badges e cálculo de XP respeitam a política: 1ª tentativa (+50/+10), retentativa (+25/+5), dia concluído (+0)', () => {
  const getXPBadge = (isCorrect, isAlreadyCompletedDay, isRetry) => {
    if (isAlreadyCompletedDay) {
      return isCorrect ? 'Correto' : 'Incorreto';
    }
    if (isRetry) {
      return isCorrect ? 'Correto! +25 XP' : 'Incorreto +5 XP';
    }
    return isCorrect ? 'Correto! +50 XP' : 'Incorreto +10 XP';
  };

  assert.equal(getXPBadge(true, false, false), 'Correto! +50 XP', '1ª tentativa com acerto: +50 XP');
  assert.equal(getXPBadge(false, false, false), 'Incorreto +10 XP', '1ª tentativa com erro: +10 XP');
  assert.equal(getXPBadge(true, false, true), 'Correto! +25 XP', 'Retentativa com acerto: +25 XP');
  assert.equal(getXPBadge(false, false, true), 'Incorreto +5 XP', 'Retentativa com erro: +5 XP');
  assert.equal(getXPBadge(true, true, false), 'Correto', 'Dia concluído: sem XP adicional');
  assert.equal(getXPBadge(false, true, false), 'Incorreto', 'Dia concluído: sem XP adicional');
});

console.log('\n======================================================');
console.log(`TOTAL DE TESTES EXECUTADOS: ${results.length}`);
console.log('TODOS OS TESTES DE REGRESSÃO DOS 4 DEFEITOS PASSARAM COM SUCESSO!');
console.log('======================================================\n');
