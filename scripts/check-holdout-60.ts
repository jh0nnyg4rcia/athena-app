/**
 * ATHENA V2.3.5-A — HOLDOUT-60 INTEGRITY, ISOLATION & DECONTAMINATION CHECKER
 * 
 * Verificador offline exaustivo para o benchmark Holdout de 60 unidades.
 * 
 * REGRAS DE EXECUÇÃO:
 * - 100% OFFLINE / ZERO OpenAI / ZERO Gemini / ZERO rede (externalModelCalls = 0, networkRequests = 0).
 * - Verificação de integridade dos 60 units (HOLDOUT-001 a HOLDOUT-060).
 * - Verificação de distribuição estratificada (40 STANDARD / 20 HARD, 7 domínios).
 * - Verificação de todas as cotas substantivas obrigatórias.
 * - Verificação geométrica de 100% dos sourceSpans.
 * - Verificação anti-leakage do input cego (tmp/assertion-decomposition-holdout/input/holdout-60.json).
 * - Verificação de descontaminação e independência lexical contra o dev set (PROP-001 a PROP-020).
 * - Verificação determinística dupla (Run 1 === Run 2 byte a byte).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';

// ============================================================================
// 1. NETWORK GUARD (ZERO REDE / ZERO EXTERNAL MODEL CALLS)
// ============================================================================
let externalModelCalls = 0;
let networkRequests = 0;

globalThis.fetch = () => {
  networkRequests++;
  throw new Error('NETWORK_GUARD_VIOLATION: Chamada externa a fetch() terminantemente proibida.');
};

try {
  (http as any).request = () => {
    networkRequests++;
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada http.request terminantemente proibida.');
  };
  (https as any).request = () => {
    networkRequests++;
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada https.request terminantemente proibida.');
  };
} catch {
  // Ignora se congelado
}

function computeSha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ============================================================================
// 2. RUN CHECK FUNCTION
// ============================================================================
export interface Holdout60CheckResult {
  success: boolean;
  totalChecks: number;
  passedChecks: number;
  manifest: any;
  quotas: Record<string, number>;
  decontamination: {
    maxJaccard: number;
    maxPair: any;
    exactMatches: number;
  };
  spansChecked: number;
}

export function runHoldout60Check(): Holdout60CheckResult {
  let totalChecks = 0;
  let passedChecks = 0;

  const baseDir = path.resolve('tmp/assertion-decomposition-holdout');
  const inputPath = path.join(baseDir, 'input/holdout-60.json');
  const goldenPath = path.join(baseDir, 'golden/holdout-60-golden.json');
  const evidencePath = path.join(baseDir, 'evidence/evidence-manifest.json');
  const manifestPath = path.join(baseDir, 'holdout-manifest.json');
  const devGoldenPath = path.resolve('tmp/assertion-decomposition-benchmark/golden-assertions.json');

  // Check 1: Existência de todos os artefatos
  totalChecks++;
  if (!fs.existsSync(inputPath) || !fs.existsSync(goldenPath) || !fs.existsSync(evidencePath) || !fs.existsSync(manifestPath)) {
    throw new Error('Artefatos do Holdout-60 ausentes!');
  }
  passedChecks++;

  const inputContent = fs.readFileSync(inputPath, 'utf8');
  const goldenContent = fs.readFileSync(goldenPath, 'utf8');
  const evidenceContent = fs.readFileSync(evidencePath, 'utf8');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Check 2: Verificação de SHA-256 no manifest
  totalChecks++;
  if (computeSha256(inputContent) !== manifest.files['input/holdout-60.json'].sha256) {
    throw new Error('SHA-256 mismatch em input/holdout-60.json');
  }
  if (computeSha256(goldenContent) !== manifest.files['golden/holdout-60-golden.json'].sha256) {
    throw new Error('SHA-256 mismatch em golden/holdout-60-golden.json');
  }
  if (computeSha256(evidenceContent) !== manifest.files['evidence/evidence-manifest.json'].sha256) {
    throw new Error('SHA-256 mismatch em evidence/evidence-manifest.json');
  }
  passedChecks++;

  const blindInputs: any[] = JSON.parse(inputContent);
  const goldenUnits: any[] = JSON.parse(goldenContent);
  const evidenceManifest: Record<string, any> = JSON.parse(evidenceContent);

  // Check 3: Tamanho exato e correspondência 1:1
  totalChecks++;
  if (blindInputs.length !== 60 || goldenUnits.length !== 60 || Object.keys(evidenceManifest).length !== 60) {
    throw new Error(`Contagem inconsistente: input=${blindInputs.length}, golden=${goldenUnits.length}, evidence=${Object.keys(evidenceManifest).length}`);
  }
  passedChecks++;

  // Check 4: Verificação de estratificação de dificuldade e domínios
  totalChecks++;
  const expectedDomains: Record<string, number> = {
    'Direito Penal — Parte Geral': 10,
    'Direito Penal — Parte Especial': 8,
    'Processo Penal': 12,
    'Direito Constitucional': 8,
    'Direito Administrativo': 8,
    'Direito Civil': 7,
    'Processo Civil': 7,
  };

  const domainCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = { STANDARD: 0, HARD: 0 };

  for (let i = 0; i < goldenUnits.length; i++) {
    const u = goldenUnits[i];
    const expectedId = `HOLDOUT-${String(i + 1).padStart(3, '0')}`;
    if (u.holdoutId !== expectedId) {
      throw new Error(`ID fora de ordem: esperado ${expectedId}, obtido ${u.holdoutId}`);
    }
    difficultyCounts[u.difficulty] = (difficultyCounts[u.difficulty] || 0) + 1;
    domainCounts[u.domain] = (domainCounts[u.domain] || 0) + 1;
  }

  if (difficultyCounts.STANDARD !== 40 || difficultyCounts.HARD !== 20) {
    throw new Error(`Estratificação de dificuldade inválida: STANDARD=${difficultyCounts.STANDARD}, HARD=${difficultyCounts.HARD}`);
  }

  for (const [dom, count] of Object.entries(expectedDomains)) {
    if (domainCounts[dom] !== count) {
      throw new Error(`Domínio ${dom}: esperado ${count}, obtido ${domainCounts[dom]}`);
    }
  }
  passedChecks++;

  // Check 5: Verificação estrita de Juiz das Garantias em Processo Penal (quota = 0)
  totalChecks++;
  const processPenalUnits = goldenUnits.filter(u => u.domain === 'Processo Penal');
  for (const u of processPenalUnits) {
    if (/juiz\s+das\s+garantias/i.test(u.originalText)) {
      throw new Error(`VIOLAÇÃO: Menção a Juiz das Garantias encontrada em ${u.holdoutId} de Processo Penal!`);
    }
  }
  passedChecks++;

  // Check 6: Verificação de Spans Geométricos (100% de correspondência)
  totalChecks++;
  let spansChecked = 0;
  for (const u of goldenUnits) {
    for (const c of u.atomicClaims) {
      const slice = u.originalText.slice(c.sourceSpan.start, c.sourceSpan.end);
      if (slice !== c.sourceSpan.text) {
        throw new Error(`Span mismatch no claim ${c.claimId} (${u.holdoutId}): "${slice}" !== "${c.sourceSpan.text}"`);
      }
      spansChecked++;
    }
    for (const s of u.assertionSpecs) {
      const slice = u.originalText.slice(s.sourceSpan.start, s.sourceSpan.end);
      if (slice !== s.sourceSpan.text) {
        throw new Error(`Span mismatch na assertion ${s.assertionId} (${u.holdoutId}): "${slice}" !== "${s.sourceSpan.text}"`);
      }
      spansChecked++;

      for (const q of s.qualifiers || []) {
        const qSlice = u.originalText.slice(q.sourceSpan.start, q.sourceSpan.end);
        if (qSlice !== q.sourceSpan.text) {
          throw new Error(`Span mismatch no qualifier ${q.sourceSpan.text} (${s.assertionId}): "${qSlice}" !== "${q.sourceSpan.text}"`);
        }
        spansChecked++;
      }
    }
  }
  passedChecks++;

  // Check 7: Verificação de Cotas Substantivas
  totalChecks++;
  let multiTarget = 0;
  let pureComp = 0;
  let compDuty = 0;
  let compPerm = 0;
  let negConst = 0;
  let prazos = 0;
  let excecoes = 0;
  let jur = 0;
  let leg = 0;

  for (const u of goldenUnits) {
    const distinctTargets = new Set(u.assertionSpecs.map((s: any) => s.legalSourceTarget).filter(Boolean));
    if (distinctTargets.size > 1 || (u.officialSources && u.officialSources.length > 1) || (u.originalText.includes(' e ') && /arts?\.|s[uú]mula/i.test(u.originalText))) {
      multiTarget++;
    }
    const funcs = u.assertionSpecs.map((s: any) => s.normativeFunction);
    if (funcs.includes('COMPETENCE') && !funcs.includes('DUTY') && !funcs.includes('PERMISSION')) pureComp++;
    if (funcs.includes('COMPETENCE') && funcs.includes('DUTY')) compDuty++;
    if (funcs.includes('COMPETENCE') && funcs.includes('PERMISSION')) compPerm++;
    if (u.assertionSpecs.some((s: any) => s.normativeFunction === 'CONSTITUTIVE_EFFECT' && s.polarity === 'NEGATIVE')) negConst++;
    if (u.propositionType === 'TIMEFRAME_QUANTITY' || u.assertionSpecs.some((s: any) => s.qualifiers?.some((q: any) => q.type === 'TEMPORAL' || q.type === 'QUANTITY'))) prazos++;
    if (u.propositionType === 'EXCEPTION' || u.assertionSpecs.some((s: any) => s.qualifiers?.some((q: any) => q.type === 'EXCEPTION'))) excecoes++;
    if (u.officialSources?.some((s: any) => s.sourceType === 'JURISPRUDÊNCIA')) jur++;
    if (u.officialSources?.some((s: any) => s.sourceType === 'LEGISLAÇÃO')) leg++;
  }

  const quotas = {
    multiTarget,
    pureComp,
    compDuty,
    compPerm,
    negConst,
    prazos,
    excecoes,
    jurisprudencia: jur,
    legislacao: leg,
  };

  if (multiTarget < 10) throw new Error(`Cota Multi-target não atingida: ${multiTarget} < 10`);
  if (pureComp < 3) throw new Error(`Cota Pure Competence não atingida: ${pureComp} < 3`);
  if (compDuty < 3) throw new Error(`Cota Competence + Duty não atingida: ${compDuty} < 3`);
  if (compPerm < 2) throw new Error(`Cota Competence + Permission não atingida: ${compPerm} < 2`);
  if (negConst < 3) throw new Error(`Cota Negative Constitutive Effect não atingida: ${negConst} < 3`);
  if (prazos < 8) throw new Error(`Cota Prazos/Quantidades não atingida: ${prazos} < 8`);
  if (excecoes < 8) throw new Error(`Cota Exceções não atingida: ${excecoes} < 8`);
  if (jur < 12) throw new Error(`Cota Jurisprudência não atingida: ${jur} < 12`);
  if (leg < 20) throw new Error(`Cota Legislação não atingida: ${leg} < 20`);
  passedChecks++;

  // Check 8: Isolamento do Blind Input (zero campos de golden)
  totalChecks++;
  const FORBIDDEN_KEYS = [
    'atomicClaims',
    'assertionSpecs',
    'resolvabilityAssessment',
    'criticalMaterialTokens',
    'materialTokens',
    'criticalQualifiers',
    'officialSources',
    'passReviewNotes',
    'evidence',
    'review',
    'answers',
    'goldenAssertions',
    'expectedModality',
    'expectedLegalSourceTarget',
  ];

  for (const u of blindInputs) {
    for (const key of FORBIDDEN_KEYS) {
      if (key in u) {
        throw new Error(`LEAKAGE_FAIL: Campo de golden '${key}' detectado no blind input de ${u.holdoutId}!`);
      }
    }
    const allowedKeys = new Set(['holdoutId', 'domain', 'difficulty', 'propositionType', 'originalText', 'providedContext']);
    for (const key of Object.keys(u)) {
      if (!allowedKeys.has(key)) {
        throw new Error(`LEAKAGE_FAIL: Campo desconhecido '${key}' detectado no blind input de ${u.holdoutId}!`);
      }
    }
  }
  passedChecks++;

  // Check 9: Descontaminação e Independência Lexical contra o Benchmark Dev
  totalChecks++;
  let exactMatches = 0;
  let maxJaccard = 0;
  let maxPair: any = null;

  if (fs.existsSync(devGoldenPath)) {
    const devUnits: any[] = JSON.parse(fs.readFileSync(devGoldenPath, 'utf8'));
    for (const hu of goldenUnits) {
      const hTokens = tokenize(hu.originalText);
      for (const du of devUnits) {
        if (hu.originalText.trim() === du.originalText.trim()) {
          exactMatches++;
        }
        const dTokens = tokenize(du.originalText);
        const sim = jaccardSimilarity(hTokens, dTokens);
        if (sim > maxJaccard) {
          maxJaccard = sim;
          maxPair = { holdoutId: hu.holdoutId, devId: du.propositionId, similarity: sim };
        }
      }
    }
  }

  if (exactMatches > 0) {
    throw new Error(`CONTAMINATION_FAIL: ${exactMatches} proposições do holdout são cópias idênticas do benchmark dev!`);
  }
  if (maxJaccard >= 0.35) {
    throw new Error(`CONTAMINATION_FAIL: Similaridade léxica excessiva detectada (${maxJaccard.toFixed(3)}) entre ${maxPair?.holdoutId} e ${maxPair?.devId}`);
  }
  passedChecks++;

  return {
    success: true,
    totalChecks,
    passedChecks,
    manifest,
    quotas,
    decontamination: {
      maxJaccard,
      maxPair,
      exactMatches,
    },
    spansChecked,
  };
}

// ============================================================================
// 3. EXECUÇÃO DETERMINÍSTICA DUPLA
// ============================================================================
if (process.argv[1] && process.argv[1].endsWith('check-holdout-60.ts')) {
  console.log('=== EXECUÇÃO RUN 1: check-holdout-60.ts ===');
  const run1 = runHoldout60Check();
  const run1Json = JSON.stringify(run1, null, 2);
  console.log(`Run 1 concluída: ${run1.passedChecks}/${run1.totalChecks} verificações passaram.`);
  console.log(`- Spans geométricos verificados: ${run1.spansChecked}`);
  console.log(`- Cotas atingidas:`, run1.quotas);
  console.log(`- Descontaminação: maxJaccard = ${run1.decontamination.maxJaccard.toFixed(4)} (par: ${run1.decontamination.maxPair.holdoutId} vs ${run1.decontamination.maxPair.devId})`);

  console.log('\n=== EXECUÇÃO RUN 2: check-holdout-60.ts ===');
  const run2 = runHoldout60Check();
  const run2Json = JSON.stringify(run2, null, 2);

  if (run1Json !== run2Json) {
    throw new Error('FATAL: Divergência não-determinística detectada em check-holdout-60.ts!');
  }
  console.log('✓ DETERMINISMO 100% COMPROVADO: Run 1 e Run 2 são idênticas byte a byte.');
}
