import { createPersonalHighlightsBackend } from '../src/server/personalHighlightsVerification.js';
import { reconcileHighlightsWithBlock } from '../src/services/personalHighlightsClient.js';

console.log('=== INICIANDO SUÍTE DE TESTES: MARCAÇÕES PESSOAIS DE TEXTO ===\n');

class MockDocRef {
  constructor(path, storage) {
    this.path = path;
    this.storage = storage;
  }
  async get() {
    return {
      exists: Boolean(this.storage[this.path]),
      data: () => this.storage[this.path]
    };
  }
  async set(val, options) {
    if (options?.merge && this.storage[this.path]) {
      this.storage[this.path] = { ...this.storage[this.path], ...val };
    } else {
      this.storage[this.path] = { ...val };
    }
  }
  async delete() {
    delete this.storage[this.path];
  }
}

class MockCollectionRef {
  constructor(path, storage) {
    this.path = path;
    this.storage = storage;
    this.filters = [];
  }
  where(field, op, val) {
    const next = new MockCollectionRef(this.path, this.storage);
    next.filters = [...this.filters, { field, op, val }];
    return next;
  }
  async get() {
    const docs = [];
    for (const [key, val] of Object.entries(this.storage)) {
      if (key.startsWith(this.path + '/')) {
        let matches = true;
        for (const f of this.filters) {
          if (f.op === '==' && val[f.field] !== f.val) matches = false;
        }
        if (matches) {
          docs.push({
            id: key.split('/').pop(),
            data: () => val
          });
        }
      }
    }
    return {
      forEach: (cb) => docs.forEach(cb),
      docs
    };
  }
}

class MockFirestore {
  constructor() {
    this.storage = {};
  }
  doc(path) {
    return new MockDocRef(path, this.storage);
  }
  collection(path) {
    return new MockCollectionRef(path, this.storage);
  }
}

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (!condition) {
    console.error(`❌ FALHOU: ${testName}`);
    process.exit(1);
  }
  passed++;
  console.log(`✔ PASSOU: ${testName}`);
}

async function run() {
  const db = new MockFirestore();
  let fakeNow = 1700000000000;
  const backend = createPersonalHighlightsBackend(db, () => fakeNow);

  const actorAlice = { uid: 'aluno_alice_1', emailVerified: true, provider: 'google.com' };
  const actorBob = { uid: 'aluno_bob_2', emailVerified: true, provider: 'google.com' };

  // TEST 1: Criação e suporte às cinco cores obrigatórias
  console.log('TEST 1: Criação de marcações nas 5 cores especificadas...');
  const colors = ['yellow', 'red', 'green', 'pink', 'blue'];
  for (let i = 0; i < colors.length; i++) {
    const col = colors[i];
    const created = await backend.saveHighlight(actorAlice, {
      id: `hl_test_${col}`,
      lessonId: 'day_1_part_0',
      blockIndex: 0,
      selectedText: `Trecho marcado na cor ${col}`,
      prefix: 'Contexto anterior ',
      suffix: ' contexto posterior',
      color: col,
      lessonVersion: 1
    });
    assert(created.color === col, `Suporte verificado para cor ${col}`);
  }

  // TEST 2: Consulta e isolamento estrito entre contas
  console.log('\nTEST 2: Consulta e isolamento de marcações por conta...');
  const aliceHighlights = await backend.getHighlights(actorAlice, 'day_1_part_0');
  assert(aliceHighlights.length === 5, 'Alice tem exatamente 5 marcações salvas');

  const bobHighlights = await backend.getHighlights(actorBob, 'day_1_part_0');
  assert(bobHighlights.length === 0, 'Bob tem 0 marcações (isolamento completo entre alunos)');

  // TEST 3: Atualização de cor e remoção
  console.log('\nTEST 3: Alteração de cor e remoção de marcação...');
  const updatedYellow = await backend.saveHighlight(actorAlice, {
    id: 'hl_test_yellow',
    lessonId: 'day_1_part_0',
    selectedText: 'Trecho marcado na cor yellow',
    color: 'blue' // Troca amarelo para azul
  });
  assert(updatedYellow.color === 'blue', 'Cor atualizada com sucesso para blue');

  await backend.deleteHighlight(actorAlice, 'hl_test_yellow');
  const afterDelete = await backend.getHighlights(actorAlice, 'day_1_part_0');
  assert(afterDelete.length === 4, 'Marcação removida com sucesso');

  // TEST 4: Reconciliação Inequívoca vs. Preservação Pendente
  console.log('\nTEST 4: Reconciliação inequívoca de marcações...');
  const sampleBlock = 'A Constituição Federal de 1988 assegura o devido processo legal e a ampla defesa. Todos são iguais perante a lei.';
  
  const testHighlights = [
    {
      id: 'h1',
      uid: 'aluno_alice_1',
      lessonId: 'day_1_part_0',
      blockIndex: 0,
      selectedText: 'devido processo legal',
      prefix: 'assegura o ',
      suffix: ' e a ampla',
      color: 'yellow',
      createdAt: 100,
      updatedAt: 100,
      status: 'active'
    },
    {
      id: 'h2', // Trecho modificado ou excluído
      uid: 'aluno_alice_1',
      lessonId: 'day_1_part_0',
      blockIndex: 0,
      selectedText: 'texto que foi revogado e removido da aula',
      prefix: '',
      suffix: '',
      color: 'red',
      createdAt: 100,
      updatedAt: 100,
      status: 'active'
    }
  ];

  const recon1 = reconcileHighlightsWithBlock(testHighlights, sampleBlock, 0);
  assert(recon1.activeHighlights.length === 1 && recon1.activeHighlights[0].id === 'h1', 'Correspondência única inequívoca aplicada como active');
  assert(recon1.pendingHighlights.length === 1 && recon1.pendingHighlights[0].id === 'h2', 'Trecho ausente preservado como pending_match');

  // TEST 5: Desambiguação por contexto de prefixo/sufixo
  console.log('\nTEST 5: Desambiguação de palavras repetidas via prefixo/sufixo...');
  const repeatingBlock = 'Artigo 1 da Lei. Artigo 2 da Lei. Artigo 3 da Lei.';
  const repeatedHighlight = [
    {
      id: 'h_repeat',
      uid: 'aluno_alice_1',
      lessonId: 'day_1_part_0',
      blockIndex: 0,
      selectedText: 'da Lei',
      prefix: 'Artigo 2 ',
      suffix: '. Artigo 3',
      color: 'green',
      createdAt: 100,
      updatedAt: 100,
      status: 'active'
    }
  ];
  const recon2 = reconcileHighlightsWithBlock(repeatedHighlight, repeatingBlock, 0);
  assert(recon2.activeHighlights.length === 1 && recon2.activeHighlights[0].id === 'h_repeat', 'Ocorrência repetida desambiguada com sucesso pelo prefixo e sufixo');

  // TEST 6: Respeito à Autorização de Leitura (Dia 3+ bloqueado)
  console.log('\nTEST 6: Bloqueio de marcações para aulas sem autorização de leitura...');
  let blockedReadCaught = false;
  try {
    // Aluno sem progressão tentando consultar marcações do Dia 5 (bloqueado)
    await backend.getHighlights(actorBob, 'day_5_part_0');
  } catch (e) {
    blockedReadCaught = e.message === 'PROGRESSION_OR_SUBSCRIPTION_REQUIRED';
  }
  assert(blockedReadCaught, 'Marcações em aula bloqueada não vazam nem servem de atalho (fail-closed)');

  console.log('\n==========================================');
  console.log(`TODOS OS ${passed}/${total} TESTES DE MARCAÇÃO PASSARAM COM SUCESSO!`);
  console.log('==========================================');
  process.exit(0);
}

run().catch((e) => {
  console.error('Erro na suíte de testes:', e);
  process.exit(1);
});
