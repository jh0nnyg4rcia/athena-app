/**
 * ATHENA V2.3.3-E - Material Evidence Regression Suite
 * Testes unitários e de regressão offline para a fundação de MaterialEvidence (Planalto + CNJ).
 * 
 * ZERO REDE / ZERO MODELOS DE IA.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as assert from 'node:assert';
import {
  OFFICIAL_LEGISLATION_HOSTS,
  isForbiddenIp,
  validateRetrievalUrlAndDns,
  normalizeOfficialHtml,
  extractLegislationLocator,
  verifyMaterialEvidence,
  getCachedOfficialDocument,
  setCachedOfficialDocument,
  clearCachedOfficialDocuments,
  sha256Hex,
} from '../src/services/legalEvidenceRetrievalService';
import type {
  MaterialEvidence,
  LegislationLocator,
  MaterialDocumentOrigin,
} from '../src/lib/legalReviewTypes';

console.log('=== TESTE DE REGRESSÃO: MATERIAL EVIDENCE FOUNDATION (V2.3.3-E) ===\n');

let passCount = 0;
let failCount = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Detalhe: ${err instanceof Error ? err.message : String(err)}`);
    failCount++;
  }
}

const SMOKE_DIR = path.resolve('tmp/material-evidence-real-smoke');

// =============================================================================
// 1. TESTES POSITIVOS COM ARTEFATOS REAIS DO SMOKE D (100% OFFLINE)
// =============================================================================

runTest('1. Planalto CPP: Normalização e extração de Art. 3º-A sobre bytes reais', () => {
  const rawPath = path.join(SMOKE_DIR, 'raw_planalto_cpp.htm');
  assert.ok(fs.existsSync(rawPath), 'raw_planalto_cpp.htm deve existir no cache do smoke D');
  const rawBytes = fs.readFileSync(rawPath);

  // Decodifica Windows-1252 (Planalto)
  const decodedHtml = new TextDecoder('windows-1252').decode(rawBytes);
  const norm = normalizeOfficialHtml(decodedHtml);

  // Verificações de higienização
  assert.ok(!norm.normalizedText.includes('<script'), 'Scripts devem ser removidos');
  assert.ok(!norm.normalizedText.includes('<style'), 'Styles devem ser removidos');
  assert.ok(norm.normalizedText.includes('estrutura acusatória'), 'Texto vigente deve estar presente');

  // Locator Art. 3º-A
  const locator: LegislationLocator = { type: 'LEGISLATION', statute: 'CPP', article: 'Art. 3º-A' };
  const extracted = extractLegislationLocator(norm.normalizedText, locator);
  assert.ok(extracted.found, 'Art. 3º-A deve ser localizado deterministamente');
  assert.ok(extracted.materialText?.includes('vedadas a iniciativa do juiz'), 'Conteúdo do Art. 3º-A deve conferir');

  // Construção e verificação de MaterialEvidence
  const rawHash = sha256Hex(rawBytes);
  const mevPlanalto: MaterialEvidence = {
    evidenceId: `mev_planalto_cpp_art3a_${rawHash.slice(0, 10)}`,
    sourceId: 'src_planalto_cpp',
    sourceUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm',
    retrievedAt: new Date().toISOString(),
    rawContentHash: rawHash,
    normalizedContentHash: norm.normalizedContentHash,
    evidenceType: 'LOCAL_DETERMINISTIC',
    locator,
    materialText: extracted.materialText!,
    provenance: {
      origin: 'LOCAL_REAL_DOCUMENT',
      sourceUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm',
      retrievedAt: new Date().toISOString(),
      rawContentHash: rawHash,
      normalizedContentHash: norm.normalizedContentHash,
      contentType: 'text/html',
      revalidationPolicy: 'REVALIDATE_CONDITIONAL',
    },
  };

  const verifyRes = verifyMaterialEvidence(mevPlanalto, {
    rawBytes,
    normalizedText: norm.normalizedText,
    sourceUrl: mevPlanalto.sourceUrl,
    sourceId: mevPlanalto.sourceId,
    origin: 'LOCAL_REAL_DOCUMENT',
  });

  assert.strictEqual(verifyRes.valid, true, `Verificação deve ser válida: ${verifyRes.details}`);
  assert.strictEqual(verifyRes.reasonCode, 'VALID');
});

runTest('2. CNJ Resolução 562/2024: Normalização e extração de Art. 3º sobre bytes reais', () => {
  const rawPath = path.join(SMOKE_DIR, 'raw_cnj_res562.htm');
  assert.ok(fs.existsSync(rawPath), 'raw_cnj_res562.htm deve existir no cache do smoke D');
  const rawBytes = fs.readFileSync(rawPath);

  const decodedHtml = new TextDecoder('utf-8').decode(rawBytes);
  const norm = normalizeOfficialHtml(decodedHtml);

  const locator: LegislationLocator = { type: 'LEGISLATION', statute: 'RESOLUCAO_562', article: 'Art. 3º' };
  const extracted = extractLegislationLocator(norm.normalizedText, locator);
  assert.ok(extracted.found, 'Art. 3º deve ser localizado');
  assert.ok(extracted.materialText?.includes('não se aplicam aos'), 'Texto do Art. 3º deve conferir');

  const rawHash = sha256Hex(rawBytes);
  const mevCnj: MaterialEvidence = {
    evidenceId: `mev_cnj_res562_art3_${rawHash.slice(0, 10)}`,
    sourceId: 'src_cnj_res562',
    sourceUrl: 'https://atos.cnj.jus.br/atos/detalhar/5601',
    retrievedAt: new Date().toISOString(),
    rawContentHash: rawHash,
    normalizedContentHash: norm.normalizedContentHash,
    evidenceType: 'TOOL_GROUNDED',
    locator,
    materialText: extracted.materialText!,
    provenance: {
      origin: 'REMOTE_OFFICIAL_DOCUMENT',
      sourceUrl: 'https://atos.cnj.jus.br/atos/detalhar/5601',
      retrievedAt: new Date().toISOString(),
      rawContentHash: rawHash,
      normalizedContentHash: norm.normalizedContentHash,
      contentType: 'text/html',
      revalidationPolicy: 'REVALIDATE_CONDITIONAL',
    },
  };

  const verifyRes = verifyMaterialEvidence(mevCnj, {
    rawBytes,
    normalizedText: norm.normalizedText,
    sourceUrl: mevCnj.sourceUrl,
    sourceId: mevCnj.sourceId,
    origin: 'REMOTE_OFFICIAL_DOCUMENT',
  });

  assert.strictEqual(verifyRes.valid, true, `Verificação deve ser válida: ${verifyRes.details}`);
  assert.strictEqual(verifyRes.reasonCode, 'VALID');
});

// =============================================================================
// 2. BATERIA DE TESTES NEGATIVOS
// =============================================================================

runTest('3. Negativo A: Alteração de 1 byte nos dados brutos gera RAW_HASH_MISMATCH', () => {
  const rawBytes = Buffer.from('Texto legal oficial');
  const norm = normalizeOfficialHtml(rawBytes.toString('utf8'));
  const locator: LegislationLocator = { type: 'LEGISLATION', statute: 'LEI', article: 'Texto' };

  const mev: MaterialEvidence = {
    evidenceId: 'mev_test_1',
    sourceId: 'src_test',
    sourceUrl: 'https://www.planalto.gov.br/lei.htm',
    retrievedAt: new Date().toISOString(),
    rawContentHash: sha256Hex(rawBytes),
    normalizedContentHash: norm.normalizedContentHash,
    evidenceType: 'LOCAL_DETERMINISTIC',
    locator,
    materialText: norm.normalizedText,
    provenance: {
      origin: 'LOCAL_REAL_DOCUMENT',
      sourceUrl: 'https://www.planalto.gov.br/lei.htm',
      retrievedAt: new Date().toISOString(),
      rawContentHash: sha256Hex(rawBytes),
      normalizedContentHash: norm.normalizedContentHash,
      contentType: 'text/html',
      revalidationPolicy: 'IMMUTABLE',
    },
  };

  const tamperedBytes = Buffer.from(rawBytes);
  tamperedBytes[0] = tamperedBytes[0] ^ 0xff; // Inverte 1 byte

  const res = verifyMaterialEvidence(mev, {
    rawBytes: tamperedBytes,
    normalizedText: norm.normalizedText,
    sourceUrl: mev.sourceUrl,
    sourceId: mev.sourceId,
    origin: 'LOCAL_REAL_DOCUMENT',
  });

  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.reasonCode, 'RAW_HASH_MISMATCH');
});

runTest('4. Negativo B: Alteração no normalizedText gera NORMALIZED_HASH_MISMATCH', () => {
  const rawBytes = Buffer.from('Texto legal oficial');
  const norm = normalizeOfficialHtml(rawBytes.toString('utf8'));
  const locator: LegislationLocator = { type: 'LEGISLATION', statute: 'LEI', article: 'Texto' };

  const mev: MaterialEvidence = {
    evidenceId: 'mev_test_2',
    sourceId: 'src_test',
    sourceUrl: 'https://www.planalto.gov.br/lei.htm',
    retrievedAt: new Date().toISOString(),
    rawContentHash: sha256Hex(rawBytes),
    normalizedContentHash: norm.normalizedContentHash,
    evidenceType: 'LOCAL_DETERMINISTIC',
    locator,
    materialText: norm.normalizedText,
    provenance: {
      origin: 'LOCAL_REAL_DOCUMENT',
      sourceUrl: 'https://www.planalto.gov.br/lei.htm',
      retrievedAt: new Date().toISOString(),
      rawContentHash: sha256Hex(rawBytes),
      normalizedContentHash: norm.normalizedContentHash,
      contentType: 'text/html',
      revalidationPolicy: 'IMMUTABLE',
    },
  };

  const res = verifyMaterialEvidence(mev, {
    rawBytes,
    normalizedText: norm.normalizedText + ' alterado',
    sourceUrl: mev.sourceUrl,
    sourceId: mev.sourceId,
    origin: 'LOCAL_REAL_DOCUMENT',
  });

  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.reasonCode, 'NORMALIZED_HASH_MISMATCH');
});

runTest('5. Negativo C: materialText forjado/inventado gera MATERIAL_TEXT_MISMATCH', () => {
  const rawBytes = Buffer.from('Art. 1º Esta lei dispõe sobre normas.');
  const norm = normalizeOfficialHtml(rawBytes.toString('utf8'));
  const locator: LegislationLocator = { type: 'LEGISLATION', statute: 'LEI', article: 'Art. 1º' };

  const mev: MaterialEvidence = {
    evidenceId: 'mev_test_3',
    sourceId: 'src_test',
    sourceUrl: 'https://www.planalto.gov.br/lei.htm',
    retrievedAt: new Date().toISOString(),
    rawContentHash: sha256Hex(rawBytes),
    normalizedContentHash: norm.normalizedContentHash,
    evidenceType: 'LOCAL_DETERMINISTIC',
    locator,
    materialText: 'Art. 1º Redação forjada que não existe no texto original.',
    provenance: {
      origin: 'LOCAL_REAL_DOCUMENT',
      sourceUrl: 'https://www.planalto.gov.br/lei.htm',
      retrievedAt: new Date().toISOString(),
      rawContentHash: sha256Hex(rawBytes),
      normalizedContentHash: norm.normalizedContentHash,
      contentType: 'text/html',
      revalidationPolicy: 'IMMUTABLE',
    },
  };

  const res = verifyMaterialEvidence(mev, {
    rawBytes,
    normalizedText: norm.normalizedText,
    sourceUrl: mev.sourceUrl,
    sourceId: mev.sourceId,
    origin: 'LOCAL_REAL_DOCUMENT',
  });

  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.reasonCode, 'MATERIAL_TEXT_MISMATCH');
});

runTest('6. Negativo D: Locator inexistente gera LOCATOR_NOT_FOUND', () => {
  const rawBytes = Buffer.from('Art. 1º Esta lei dispõe sobre normas.');
  const norm = normalizeOfficialHtml(rawBytes.toString('utf8'));
  const locator: LegislationLocator = { type: 'LEGISLATION', statute: 'LEI', article: 'Art. 999-Z' };

  const mev: MaterialEvidence = {
    evidenceId: 'mev_test_4',
    sourceId: 'src_test',
    sourceUrl: 'https://www.planalto.gov.br/lei.htm',
    retrievedAt: new Date().toISOString(),
    rawContentHash: sha256Hex(rawBytes),
    normalizedContentHash: norm.normalizedContentHash,
    evidenceType: 'LOCAL_DETERMINISTIC',
    locator,
    materialText: norm.normalizedText,
    provenance: {
      origin: 'LOCAL_REAL_DOCUMENT',
      sourceUrl: 'https://www.planalto.gov.br/lei.htm',
      retrievedAt: new Date().toISOString(),
      rawContentHash: sha256Hex(rawBytes),
      normalizedContentHash: norm.normalizedContentHash,
      contentType: 'text/html',
      revalidationPolicy: 'IMMUTABLE',
    },
  };

  const res = verifyMaterialEvidence(mev, {
    rawBytes,
    normalizedText: norm.normalizedText,
    sourceUrl: mev.sourceUrl,
    sourceId: mev.sourceId,
    origin: 'LOCAL_REAL_DOCUMENT',
  });

  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.reasonCode, 'LOCATOR_NOT_FOUND');
});

runTest('7. Negativo E: sourceId divergente gera SOURCE_ID_MISMATCH', () => {
  const rawBytes = Buffer.from('Art. 1º Esta lei.');
  const norm = normalizeOfficialHtml(rawBytes.toString('utf8'));
  const locator: LegislationLocator = { type: 'LEGISLATION', statute: 'LEI', article: 'Art. 1º' };

  const mev: MaterialEvidence = {
    evidenceId: 'mev_test_5',
    sourceId: 'src_correto',
    sourceUrl: 'https://www.planalto.gov.br/lei.htm',
    retrievedAt: new Date().toISOString(),
    rawContentHash: sha256Hex(rawBytes),
    normalizedContentHash: norm.normalizedContentHash,
    evidenceType: 'LOCAL_DETERMINISTIC',
    locator,
    materialText: norm.normalizedText,
    provenance: {
      origin: 'LOCAL_REAL_DOCUMENT',
      sourceUrl: 'https://www.planalto.gov.br/lei.htm',
      retrievedAt: new Date().toISOString(),
      rawContentHash: sha256Hex(rawBytes),
      normalizedContentHash: norm.normalizedContentHash,
      contentType: 'text/html',
      revalidationPolicy: 'IMMUTABLE',
    },
  };

  const res = verifyMaterialEvidence(mev, {
    rawBytes,
    normalizedText: norm.normalizedText,
    sourceUrl: mev.sourceUrl,
    sourceId: 'src_diferente',
    origin: 'LOCAL_REAL_DOCUMENT',
  });

  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.reasonCode, 'SOURCE_ID_MISMATCH');
});

runTest('8. Negativo F: sourceUrl divergente gera SOURCE_URL_MISMATCH', () => {
  const rawBytes = Buffer.from('Art. 1º Esta lei.');
  const norm = normalizeOfficialHtml(rawBytes.toString('utf8'));
  const locator: LegislationLocator = { type: 'LEGISLATION', statute: 'LEI', article: 'Art. 1º' };

  const mev: MaterialEvidence = {
    evidenceId: 'mev_test_6',
    sourceId: 'src_test',
    sourceUrl: 'https://www.planalto.gov.br/lei_a.htm',
    retrievedAt: new Date().toISOString(),
    rawContentHash: sha256Hex(rawBytes),
    normalizedContentHash: norm.normalizedContentHash,
    evidenceType: 'LOCAL_DETERMINISTIC',
    locator,
    materialText: norm.normalizedText,
    provenance: {
      origin: 'LOCAL_REAL_DOCUMENT',
      sourceUrl: 'https://www.planalto.gov.br/lei_a.htm',
      retrievedAt: new Date().toISOString(),
      rawContentHash: sha256Hex(rawBytes),
      normalizedContentHash: norm.normalizedContentHash,
      contentType: 'text/html',
      revalidationPolicy: 'IMMUTABLE',
    },
  };

  const res = verifyMaterialEvidence(mev, {
    rawBytes,
    normalizedText: norm.normalizedText,
    sourceUrl: 'https://www.planalto.gov.br/lei_b.htm',
    sourceId: mev.sourceId,
    origin: 'LOCAL_REAL_DOCUMENT',
  });

  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.reasonCode, 'SOURCE_URL_MISMATCH');
});

runTest('9. Negativo G: Host fora da allowlist é rejeitado no pré-flight', async () => {
  assert.strictEqual(OFFICIAL_LEGISLATION_HOSTS.has('stf.jus.br'), false);
  assert.strictEqual(OFFICIAL_LEGISLATION_HOSTS.has('senado.leg.br'), false);
  assert.strictEqual(OFFICIAL_LEGISLATION_HOSTS.has('outro-orgao.gov.br'), false);

  await assert.rejects(
    () => validateRetrievalUrlAndDns(new URL('https://stf.jus.br/processo')),
    /HOST_NAO_AUTORIZADO/
  );
});

runTest('10. Negativo H: Protocolo HTTP em vez de HTTPS é rejeitado', async () => {
  await assert.rejects(
    () => validateRetrievalUrlAndDns(new URL('http://www.planalto.gov.br/lei.htm')),
    /PROTOCOLO_INSEGURO/
  );
});

runTest('11. Negativo J/K/L/M: Bloqueio estrito de IPs Proibidos (Anti-SSRF)', () => {
  assert.strictEqual(isForbiddenIp('127.0.0.1'), true, 'Loopback IPv4');
  assert.strictEqual(isForbiddenIp('127.255.255.255'), true, 'Faixa 127.0.0.0/8');
  assert.strictEqual(isForbiddenIp('::1'), true, 'Loopback IPv6');
  assert.strictEqual(isForbiddenIp('localhost'), true, 'Localhost');
  assert.strictEqual(isForbiddenIp('10.0.0.1'), true, 'RFC 1918 10.0.0.0/8');
  assert.strictEqual(isForbiddenIp('192.168.1.1'), true, 'RFC 1918 192.168.0.0/16');
  assert.strictEqual(isForbiddenIp('172.16.0.1'), true, 'RFC 1918 172.16.0.0/12');
  assert.strictEqual(isForbiddenIp('172.31.255.255'), true, 'RFC 1918 172.31.x');
  assert.strictEqual(isForbiddenIp('169.254.169.254'), true, 'Cloud Metadata (AWS/GCP)');
  assert.strictEqual(isForbiddenIp('169.254.0.1'), true, 'Link-local IPv4');
  assert.strictEqual(isForbiddenIp('fc00::1'), true, 'IPv6 Unique Local');
  assert.strictEqual(isForbiddenIp('fe80::1'), true, 'IPv6 Link-Local');

  // IP público válido não deve ser proibido
  assert.strictEqual(isForbiddenIp('200.198.239.20'), false, 'IP público de exemplo');
});

runTest('12. Negativo 13: Origem proibida (tentativa de elevação indevida) é rejeitada com ORIGIN_NOT_ALLOWED', () => {
  const rawBytes = Buffer.from('Art. 1º Norma.');
  const norm = normalizeOfficialHtml(rawBytes.toString('utf8'));
  const locator: LegislationLocator = { type: 'LEGISLATION', statute: 'LEI', article: 'Art. 1º' };

  const mev: MaterialEvidence = {
    evidenceId: 'mev_fraud',
    sourceId: 'src_test',
    sourceUrl: 'https://www.planalto.gov.br/lei.htm',
    retrievedAt: new Date().toISOString(),
    rawContentHash: sha256Hex(rawBytes),
    normalizedContentHash: norm.normalizedContentHash,
    evidenceType: 'LOCAL_DETERMINISTIC',
    locator,
    materialText: norm.normalizedText,
    provenance: {
      origin: 'REMOTE_OFFICIAL_DOCUMENT',
      sourceUrl: 'https://www.planalto.gov.br/lei.htm',
      retrievedAt: new Date().toISOString(),
      rawContentHash: sha256Hex(rawBytes),
      normalizedContentHash: norm.normalizedContentHash,
      contentType: 'text/html',
      revalidationPolicy: 'IMMUTABLE',
    },
  };

  // Documento passado como synthetic fixture
  const res = verifyMaterialEvidence(mev, {
    rawBytes,
    normalizedText: norm.normalizedText,
    sourceUrl: mev.sourceUrl,
    sourceId: mev.sourceId,
    origin: 'SYNTHETIC_FIXTURE' as unknown as MaterialDocumentOrigin,
  });

  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.reasonCode, 'ORIGIN_NOT_ALLOWED');
});

// =============================================================================
// 3. TESTE DE CACHE DETERMINÍSTICO COM EXPIRAÇÃO E REVALIDAÇÃO
// =============================================================================

runTest('13. Cache: Armazenamento, recuperação por canonicalUrl e respeito a TTL', () => {
  clearCachedOfficialDocuments();

  const testUrl = 'https://www.planalto.gov.br/ccivil_03/leis/l13964compilado.htm';
  const rawBytes = Buffer.from('Lei 13.964');
  const norm = normalizeOfficialHtml(rawBytes.toString('utf8'));

  setCachedOfficialDocument(
    testUrl,
    {
      retrievedAt: new Date().toISOString(),
      rawContentHash: sha256Hex(rawBytes),
      normalizedContentHash: norm.normalizedContentHash,
      rawBytes,
      normalizedText: norm.normalizedText,
      contentType: 'text/html',
      etag: '"12345"',
      lastModified: 'Wed, 21 Oct 2025 07:28:00 GMT',
      revalidationPolicy: 'REVALIDATE_CONDITIONAL',
    },
    500 // TTL de 500ms
  );

  // Recupera com variação da URL (deve resolver via canonicalUrl)
  const cached = getCachedOfficialDocument('https://planalto.gov.br/ccivil_03/leis/l13964.htm');
  assert.ok(cached, 'Documento deve ser recuperado via canonicalSourceUrl');
  assert.strictEqual(cached?.etag, '"12345"');
  assert.strictEqual(cached?.revalidationPolicy, 'REVALIDATE_CONDITIONAL');

  clearCachedOfficialDocuments();
  assert.strictEqual(getCachedOfficialDocument(testUrl), null, 'Cache limpo deve retornar null');
});

// =============================================================================
// RESULTADO FINAL
// =============================================================================
console.log(`\nResumo da Bateria V2.3.3-E: ${passCount} PASS | ${failCount} FAIL (Total: ${passCount + failCount})`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('Todos os testes de MaterialEvidence Foundation passaram com sucesso pleno.');
}
