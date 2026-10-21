/**
 * ATHENA V2.3.5-C — HOLDOUT-60-V235C INTEGRITY & DECONTAMINATION CHECKER
 * 
 * Verificador offline determinístico para o benchmark Holdout saneado V2.3.5-C.
 * 
 * REGRAS DE EXECUÇÃO:
 * - 100% OFFLINE / ZERO OpenAI / ZERO Gemini / ZERO rede (externalModelCalls = 0, networkRequests = 0).
 * - Verificação de integridade dos 60 units (HOLDOUT-001 a HOLDOUT-060).
 * - Verificação de distribuição estratificada (40 STANDARD / 20 HARD, 7 domínios).
 * - Verificação geométrica de 100% dos sourceSpans.
 * - Verificação anti-leakage do input cego (tmp/assertion-decomposition-holdout-v235c/input/holdout-60-v235c.json).
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

export interface Holdout60V235CCheckResult {
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

export function runHoldout60V235CCheck(): Holdout60V235CCheckResult {
  let totalChecks = 0;
  let passedChecks = 0;

  const baseDir = path.resolve('tmp/assertion-decomposition-holdout-v235c');
  const inputPath = path.join(baseDir, 'input/holdout-60-v235c.json');
  const goldenPath = path.join(baseDir, 'golden/holdout-60-golden-v235c.json');
  const evidencePath = path.join(baseDir, 'evidence/evidence-manifest-v235c.json');
  const manifestPath = path.join(baseDir, 'manifest/holdout-manifest-v235c.json');
  const devGoldenPath = path.resolve('tmp/assertion-decomposition-benchmark/golden-assertions.json');

  // Check 1: Existência de todos os artefatos
  totalChecks++;
  if (!fs.existsSync(inputPath) || !fs.existsSync(goldenPath) || !fs.existsSync(evidencePath) || !fs.existsSync(manifestPath)) {
    throw new Error('Artefatos do Holdout-60-V235C ausentes!');
  }
  passedChecks++;

  const inputContent = fs.readFileSync(inputPath, 'utf8');
  const goldenContent = fs.readFileSync(goldenPath, 'utf8');
  const evidenceContent = fs.readFileSync(evidencePath, 'utf8');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Check 2: Verificação de SHA-256 no manifest
  totalChecks++;
  if (computeSha256(inputContent) !== manifest.hashes.blindInputSha256) {
    throw new Error('SHA-256 mismatch em input/holdout-60-v235c.json');
  }
  if (computeSha256(goldenContent) !== manifest.hashes.goldenSha256) {
    throw new Error('SHA-256 mismatch em golden/holdout-60-golden-v235c.json');
  }
  if (computeSha256(evidenceContent) !== manifest.hashes.evidenceManifestSha256) {
    throw new Error('SHA-256 mismatch em evidence/evidence-manifest-v235c.json');
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
    'Processo Civil': 7
  };

  const domainCounts: Record<string, number> = {};
  let standardCount = 0;
  let hardCount = 0;

  for (const u of goldenUnits) {
    domainCounts[u.domain] = (domainCounts[u.domain] || 0) + 1;
    if (u.difficulty === 'STANDARD') standardCount++;
    else if (u.difficulty === 'HARD') hardCount++;
  }

  if (standardCount !== 40 || hardCount !== 20) {
    throw new Error(`Estratificação inválida: STANDARD=${standardCount}, HARD=${hardCount}`);
  }

  for (const [dom, count] of Object.entries(expectedDomains)) {
    if (domainCounts[dom] !== count) {
      throw new Error(`Domínio ${dom}: esperado ${count}, encontrado ${domainCounts[dom]}`);
    }
  }
  passedChecks++;

  // Check 5: Verificação geométrica de sourceSpans
  totalChecks++;
  let spansChecked = 0;
  for (const u of goldenUnits) {
    for (const claim of u.atomicClaims) {
      const slice = u.originalText.slice(claim.sourceSpan.start, claim.sourceSpan.end);
      if (slice !== claim.sourceSpan.text) {
        throw new Error(`Span corrompido em ${u.holdoutId} claim ${claim.claimId}`);
      }
      spansChecked++;
    }
    for (const spec of u.assertionSpecs) {
      const slice = u.originalText.slice(spec.sourceSpan.start, spec.sourceSpan.end);
      if (slice !== spec.sourceSpan.text) {
        throw new Error(`Span corrompido em ${u.holdoutId} spec ${spec.assertionId}`);
      }
      spansChecked++;
    }
  }
  passedChecks++;

  // Check 6: Verificação de anti-leakage em input
  totalChecks++;
  for (const bi of blindInputs) {
    if (bi.atomicClaims || bi.assertionSpecs || bi.resolvabilityAssessment || bi.officialSources) {
      throw new Error(`Leakage detectado em blind input ${bi.holdoutId}!`);
    }
  }
  passedChecks++;

  // Check 7: Descontaminação contra o benchmark de desenvolvimento
  totalChecks++;
  const devUnits: any[] = JSON.parse(fs.readFileSync(devGoldenPath, 'utf8'));
  let maxJaccard = 0;
  let maxPair: any = null;
  let exactMatches = 0;

  for (const u of goldenUnits) {
    const holdoutTokens = tokenize(u.originalText);
    for (const d of devUnits) {
      const devTokens = tokenize(d.originalText);
      const sim = jaccardSimilarity(holdoutTokens, devTokens);
      if (sim > maxJaccard) {
        maxJaccard = sim;
        maxPair = { holdoutId: u.holdoutId, devId: d.propositionId, similarity: sim };
      }
      if (u.originalText.trim() === d.originalText.trim()) {
        exactMatches++;
      }
    }
  }

  if (exactMatches > 0) {
    throw new Error(`Contaminação: ${exactMatches} matches exatos contra o dev set!`);
  }
  if (maxJaccard > 0.40) {
    throw new Error(`Similaridade léxica excessiva: ${maxJaccard} (par: ${JSON.stringify(maxPair)})`);
  }
  passedChecks++;

  return {
    success: passedChecks === totalChecks,
    totalChecks,
    passedChecks,
    manifest,
    quotas: manifest.quotas,
    decontamination: {
      maxJaccard,
      maxPair,
      exactMatches,
    },
    spansChecked,
  };
}

console.log('=== EXECUÇÃO RUN 1: check-holdout-60-v235c.ts ===');
const res1 = runHoldout60V235CCheck();
console.log(`Run 1 concluída: ${res1.passedChecks}/${res1.totalChecks} verificações passaram.`);
console.log(`- Spans geométricos verificados: ${res1.spansChecked}`);
console.log(`- Cotas atingidas:`, res1.quotas);
console.log(`- Descontaminação: maxJaccard = ${res1.decontamination.maxJaccard.toFixed(4)} (par: ${res1.decontamination.maxPair.holdoutId} vs ${res1.decontamination.maxPair.devId})`);

console.log('\n=== EXECUÇÃO RUN 2: check-holdout-60-v235c.ts ===');
const res2 = runHoldout60V235CCheck();

const diff = JSON.stringify(res1) !== JSON.stringify(res2);
if (diff) {
  console.error('ERRO: Divergência entre Run 1 e Run 2!');
  process.exit(1);
}
console.log('✓ DETERMINISMO 100% COMPROVADO: Run 1 e Run 2 são idênticas byte a byte.');
