const fs = require('fs');
const path = require('path');
const { validateBulletin, validateLogoAsset } = require('./validator.cjs');
const { computeCanonicalHash, registerApproval } = require('./approvals.cjs');
const { renderCarousel } = require('./render_carousel.cjs');

const BASE_SAMPLE_PATH = path.resolve(__dirname, 'content-sample.json');
const TEST_REGISTRY_PATH = path.resolve(__dirname, 'approvals/test_approval_registry.json');
const TEST_OUT_DIR = path.resolve(__dirname, 'output_test');

function cloneValidSample() {
  const raw = fs.readFileSync(BASE_SAMPLE_PATH, 'utf8');
  return JSON.parse(raw);
}

function setupTestEnvironment() {
  if (fs.existsSync(TEST_REGISTRY_PATH)) {
    fs.unlinkSync(TEST_REGISTRY_PATH);
  }
  if (!fs.existsSync(TEST_OUT_DIR)) {
    fs.mkdirSync(TEST_OUT_DIR, { recursive: true });
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('ATHENA — SUÍTE DE TESTES AUTOMATIZADOS DO SISTEMA DE CARROSSÉIS');
  console.log('================================================================\n');

  setupTestEnvironment();
  const testResults = [];

  function assert(testId, name, passed, details = '') {
    const status = passed ? '✅ [PASSOU]' : '❌ [FALHOU]';
    console.log(`${status} ${testId} - ${name}${details ? ` (${details})` : ''}`);
    testResults.push({ id: testId, name, passed, details });
  }

  // --- CASO 1: JSON Válido e Aprovado ---
  try {
    const sample = cloneValidSample();
    sample.meta.editorial_id = 'ATHENA-BOL-TEST-01-VALID';
    registerApproval({
      content: sample,
      approver: 'Dr. Roberto Mendes (Auditor Jurídico)',
      registryPath: TEST_REGISTRY_PATH
    });

    const res = validateBulletin(sample, { registryPath: TEST_REGISTRY_PATH });
    assert('TEST-01', 'JSON Válido e Aprovado', res.valid === true && res.errors.length === 0);
  } catch (err) {
    assert('TEST-01', 'JSON Válido e Aprovado', false, err.message);
  }

  // --- CASO 2: JSON Incompleto (Sem Tema e Sem Origem) ---
  try {
    const sample = cloneValidSample();
    delete sample.meta.tema;
    delete sample.meta.origem;
    const res = validateBulletin(sample, { skipApprovalCheck: true });
    const hasExpectedError = res.errors.some(e => e.includes('meta.tema'));
    assert('TEST-02', 'JSON Incompleto (Ausência de campos obrigatórios)', res.valid === false && hasExpectedError);
  } catch (err) {
    assert('TEST-02', 'JSON Incompleto', false, err.message);
  }

  // --- CASO 3: Quantidade Incorreta de Slides (6 Slides em vez de 7) ---
  try {
    const sample = cloneValidSample();
    sample.slides.pop(); // Remove slide 7
    const res = validateBulletin(sample, { skipApprovalCheck: true });
    const hasExpectedError = res.errors.some(e => e.includes('Quantidade incorreta de slides'));
    assert('TEST-03', 'Quantidade Incorreta de Slides (6 slides em vez de 7)', res.valid === false && hasExpectedError);
  } catch (err) {
    assert('TEST-03', 'Quantidade Incorreta de Slides', false, err.message);
  }

  // --- CASO 4: Disciplina Inválida (Fora das Carreiras de Elite) ---
  try {
    const sample = cloneValidSample();
    sample.meta.disciplina = 'Direito Marítimo Internacional';
    const res = validateBulletin(sample, { skipApprovalCheck: true });
    const hasExpectedError = res.errors.some(e => e.includes('Disciplina jurídica inválida'));
    assert('TEST-04', 'Disciplina Inválida (Rejeição de áreas fora das carreiras de elite)', res.valid === false && hasExpectedError);
  } catch (err) {
    assert('TEST-04', 'Disciplina Inválida', false, err.message);
  }

  // --- CASO 5: Questão Sem Gabarito ---
  try {
    const sample = cloneValidSample();
    const gabaritoSlide = sample.slides.find(s => s.tipo === 'gabarito');
    delete gabaritoSlide.alternativa_correta;
    const res = validateBulletin(sample, { skipApprovalCheck: true });
    const hasExpectedError = res.errors.some(e => e.includes('campo alternativa_correta'));
    assert('TEST-05', 'Questão Sem Gabarito Informado', res.valid === false && hasExpectedError);
  } catch (err) {
    assert('TEST-05', 'Questão Sem Gabarito', false, err.message);
  }

  // --- CASO 6: Gabarito Incompatível com as Alternativas ---
  try {
    const sample = cloneValidSample();
    const gabaritoSlide = sample.slides.find(s => s.tipo === 'gabarito');
    gabaritoSlide.alternativa_correta = 'E'; // Só existem A, B, C, D
    const res = validateBulletin(sample, { skipApprovalCheck: true });
    const hasExpectedError = res.errors.some(e => e.includes('não existe nas alternativas') || e.includes('valor \'A\', \'B\', \'C\' ou \'D\''));
    assert('TEST-06', 'Gabarito Incompatível com as Alternativas (Letra E inexistente)', res.valid === false && hasExpectedError);
  } catch (err) {
    assert('TEST-06', 'Gabarito Incompatível', false, err.message);
  }

  // --- CASO 7: Fontes Ausentes ou Pendências Não Resolvidas ---
  try {
    const sample = cloneValidSample();
    sample.meta.pontos_pendentes = ['Confirmar se o STJ pacificou no REsp 1.999.888'];
    const res = validateBulletin(sample, { skipApprovalCheck: true });
    const hasExpectedError = res.errors.some(e => e.includes('pendência(s) jurídica(s) não resolvida(s)'));
    assert('TEST-07', 'Bloqueio por Pendências Jurídicas Não Resolvidas', res.valid === false && hasExpectedError);
  } catch (err) {
    assert('TEST-07', 'Pendências Não Resolvidas', false, err.message);
  }

  // --- CASO 8: Conteúdo Não Aprovado (Estado DRAFT / LEGAL_REVIEW) ---
  try {
    const sample = cloneValidSample();
    sample.meta.estado_editorial = 'DRAFT';
    const res = validateBulletin(sample, { skipApprovalCheck: true, allowDraft: false });
    const hasExpectedError = res.errors.some(e => e.includes('não está autorizado para renderização de artes finais'));
    assert('TEST-08', 'Bloqueio de Conteúdo em DRAFT para Renderização Final', res.valid === false && hasExpectedError);
  } catch (err) {
    assert('TEST-08', 'Bloqueio de Conteúdo em DRAFT', false, err.message);
  }

  // --- CASO 9: Hash de Aprovação Divergente (Adulteração Pós-Aprovação) ---
  try {
    const sample = cloneValidSample();
    sample.meta.editorial_id = 'ATHENA-BOL-TEST-09-TAMPER';
    registerApproval({
      content: sample,
      approver: 'Dra. Vanessa Lima (Promotora e Auditora)',
      registryPath: TEST_REGISTRY_PATH
    });

    // Simula adulteração no texto do slide após aprovação
    sample.slides[1].citacao = 'Texto alterado indevidamente após a auditoria jurídica.';

    const res = validateBulletin(sample, { registryPath: TEST_REGISTRY_PATH });
    const hasExpectedError = res.errors.some(e => e.includes('Divergência de integridade'));
    assert('TEST-09', 'Detecção Criptográfica de Adulteração Pós-Aprovação', res.valid === false && hasExpectedError);
  } catch (err) {
    assert('TEST-09', 'Detecção Criptográfica de Adulteração', false, err.message);
  }

  // --- CASO 10: Logomarca Ausente (Regra Fail-Closed) ---
  try {
    const sample = cloneValidSample();
    const res = validateBulletin(sample, {
      skipApprovalCheck: true,
      logoPath: path.resolve(__dirname, 'assets/inexistente.png')
    });
    const hasExpectedError = res.errors.some(e => e.includes('Logomarca oficial ausente'));
    assert('TEST-10', 'Regra Fail-Closed: Bloqueio por Logomarca Ausente', res.valid === false && hasExpectedError);
  } catch (err) {
    assert('TEST-10', 'Regra Fail-Closed Logomarca', false, err.message);
  }

  // --- CASO 11: Detecção de Textos Excessivamente Longos (Warning Editorial) ---
  try {
    const sample = cloneValidSample();
    sample.slides[1].citacao = 'A'.repeat(450); // Citação muito longa
    const res = validateBulletin(sample, { skipApprovalCheck: true });
    const hasWarning = res.warnings.some(w => w.includes('muito longa'));
    assert('TEST-11', 'Detecção Preventiva de Textos Excessivamente Longos (Alerta de Layout)', hasWarning === true);
  } catch (err) {
    assert('TEST-11', 'Detecção de Textos Longos', false, err.message);
  }

  // --- CASO 12: Execução Real de Renderização e Conferência de Dimensões 1080x1080 ---
  try {
    console.log('\n[TEST-12] Executando renderização real de homologação (Chrome Headless)...');
    const validSample = cloneValidSample();
    validSample.meta.editorial_id = 'ATHENA-BOL-TEST-12-E2E';
    registerApproval({
      content: validSample,
      approver: 'Jhonny Garcia (Engenheiro Responsável)',
      registryPath: TEST_REGISTRY_PATH
    });

    const testInputFile = path.join(TEST_OUT_DIR, 'test_bulletin.json');
    fs.writeFileSync(testInputFile, JSON.stringify(validSample, null, 2), 'utf8');

    const result = await renderCarousel(testInputFile, {
      output: TEST_OUT_DIR,
      registry: TEST_REGISTRY_PATH,
      skipZip: false
    });

    const allPngsValid = result.generatedFiles.length === 7 &&
      result.generatedFiles.every(f => f.width === 1080 && f.height === 1080 && f.sizeKb > 100);

    const zipExists = result.zipInfo && fs.existsSync(result.zipInfo.zipPath);

    assert(
      'TEST-12',
      'Renderização Real End-to-End: 7 PNGs 1080x1080 + ZIP Consolidado',
      allPngsValid && zipExists,
      `7 slides 1080x1080 px gerados, ZIP: ${result.zipInfo ? result.zipInfo.zipName : 'N/A'}`
    );
  } catch (err) {
    assert('TEST-12', 'Renderização Real End-to-End', false, err.message);
  }

  // Limpeza de arquivos de teste
  try {
    if (fs.existsSync(TEST_REGISTRY_PATH)) fs.unlinkSync(TEST_REGISTRY_PATH);
  } catch (e) {}

  console.log('\n================================================================');
  console.log('RESUMO FINAL DA SUÍTE DE TESTES:');
  const total = testResults.length;
  const passedCount = testResults.filter(t => t.passed).length;
  console.log(`Total de Casos:     ${total}`);
  console.log(`Aprovados:          ${passedCount} / ${total} (${Math.round((passedCount / total) * 100)}%)`);
  console.log(`Reprovados:         ${total - passedCount}`);
  console.log('================================================================\n');

  if (passedCount !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Erro fatal na execução da suíte de testes:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
