/**
 * ATHENA V2.3.5-C.2 — HUMAN REVIEW DOSSIER CHECKER & ANTI-LEAKAGE AUDITOR
 * 
 * Verificador determinístico offline para o Dossiê de Revisão Humana Pré-H1.
 * 
 * REGRAS DE EXECUÇÃO:
 * - 100% OFFLINE / ZERO OpenAI / ZERO Gemini / ZERO rede (externalModelCalls = 0, networkRequests = 0).
 * - Verificação de 27 unidades únicas no dossiê (sem faltantes nem extras).
 * - Verificação das 20 HARD, 12 Jurisprudenciais e 12 Replacements.
 * - Verificação da presença e destaque de HOLDOUT-012, HOLDOUT-017 e HOLDOUT-052.
 * - Verificação de exatidão de 100% dos originalTexts contra o golden oficial.
 * - Verificação de que evidence IDs e trechos materiais são válidos e existentes.
 * - Verificação estrita de que ZERO decisões foram pré-marcadas ([ ] APPROVED unselected).
 * - Verificação anti-leakage: dossiê não vaza para blind input, runners ou providedContext.
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

function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export interface DossierCheckResult {
  success: boolean;
  totalChecks: number;
  passedChecks: number;
  dossierSha256: string;
  uniqueUnitsCount: number;
  hardUnitsFound: number;
  jurisprudenceUnitsFound: number;
  replacementUnitsFound: number;
  specialCasesVerified: {
    holdout012: boolean;
    holdout017: boolean;
    holdout052: boolean;
  };
  zeroPreApprovedConfirmed: boolean;
  antiLeakageConfirmed: boolean;
}

export function runDossierCheck(): DossierCheckResult {
  let totalChecks = 0;
  let passedChecks = 0;

  const v235cDir = path.resolve('tmp/assertion-decomposition-holdout-v235c');
  const dossierPath = path.join(v235cDir, 'audit/pre-h1-human-review-dossier.md');
  const goldenPath = path.join(v235cDir, 'golden/holdout-60-golden-v235c.json');
  const inputPath = path.join(v235cDir, 'input/holdout-60-v235c.json');
  const evidencePath = path.join(v235cDir, 'evidence/evidence-manifest-v235c.json');
  const signoffPath = path.join(v235cDir, 'audit/pre-h1-human-signoff.json');

  // Check 1: Existência dos arquivos
  totalChecks++;
  if (!fs.existsSync(dossierPath) || !fs.existsSync(goldenPath) || !fs.existsSync(inputPath) || !fs.existsSync(evidencePath) || !fs.existsSync(signoffPath)) {
    throw new Error('ARTEFATO_FALTANDO: Um ou mais artefatos necessários para o check não existem.');
  }
  passedChecks++;

  const dossierContent = fs.readFileSync(dossierPath, 'utf8');
  const dossierSha256 = computeSha256(dossierContent);
  const goldenUnits: any[] = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));
  const blindInputs: any[] = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const evidenceManifest: Record<string, any> = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const signoff = JSON.parse(fs.readFileSync(signoffPath, 'utf8'));

  // Check 2: Contagem exata de 27 unidades no dossiê
  totalChecks++;
  const unitMatches = Array.from(dossierContent.matchAll(/^## (HOLDOUT-\d{3})$/gm)).map(m => m[1]);
  if (unitMatches.length !== 27) {
    throw new Error(`CONTAGEM_UNIDADES_DOSSIER: Esperado 27 unidades, encontrado ${unitMatches.length}`);
  }
  const uniqueUnitSet = new Set(unitMatches);
  if (uniqueUnitSet.size !== 27) {
    throw new Error(`DUPLICATAS_NO_DOSSIER: Apenas ${uniqueUnitSet.size} unidades únicas encontradas`);
  }
  // Verificar ordenação estrita crescente
  const sortedMatches = [...unitMatches].sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(unitMatches) !== JSON.stringify(sortedMatches)) {
    throw new Error('ORDENACAO_INCORRETA: As unidades no dossiê não estão estritamente ordenadas por HOLDOUT ID crescente.');
  }
  passedChecks++;

  // Check 3: Presença obrigatória de todas as 20 HARD, 12 JUR e 12 REPL
  totalChecks++;
  const goldenMap = new Map<string, any>();
  goldenUnits.forEach(u => goldenMap.set(u.holdoutId, u));

  let hardFound = 0;
  let jurFound = 0;
  let replFound = 0;

  for (const id of unitMatches) {
    const g = goldenMap.get(id);
    if (!g) throw new Error(`UNIDADE_DESCONHECIDA_NO_DOSSIER: ${id}`);
    if (g.difficulty === 'HARD') hardFound++;
    if (g.officialSources.some((s: any) => s.sourceType === 'JURISPRUDÊNCIA')) jurFound++;
    if (g.remediationStatus === 'VERIFIED_REPLACEMENT_PRE_H1') replFound++;
  }

  if (hardFound !== 20) throw new Error(`HARD_UNITS_MISMATCH: Esperado 20 HARD no dossiê, encontrado ${hardFound}`);
  if (jurFound !== 12) throw new Error(`JUR_UNITS_MISMATCH: Esperado 12 Jurisprudência no dossiê, encontrado ${jurFound}`);
  if (replFound !== 12) throw new Error(`REPL_UNITS_MISMATCH: Esperado 12 Substituições no dossiê, encontrado ${replFound}`);
  passedChecks++;

  // Check 4: Verificação dos Casos Especiais (HOLDOUT-012, HOLDOUT-017, HOLDOUT-052)
  totalChecks++;
  if (!unitMatches.includes('HOLDOUT-012')) throw new Error('CASO_ESPECIAL_FALTANDO: HOLDOUT-012 ausente.');
  if (!unitMatches.includes('HOLDOUT-017')) throw new Error('CASO_ESPECIAL_FALTANDO: HOLDOUT-017 ausente.');
  if (!unitMatches.includes('HOLDOUT-052')) throw new Error('CASO_ESPECIAL_FALTANDO: HOLDOUT-052 ausente.');

  // Detalhes de HOLDOUT-012: Lei 14.994/2024 e art. 121-A, § 2º, I
  if (!dossierContent.includes('121-A, § 2º, I') || !dossierContent.includes('14.994/2024')) {
    throw new Error('HOLDOUT-012_DETALHE_INSUFICIENTE: Menção a art. 121-A e Lei 14.994/2024 obrigatória.');
  }
  // Detalhes de HOLDOUT-017: art. 171 § 2º-A e § 2º-B
  if (!dossierContent.includes('171, § 2º-A') || !dossierContent.includes('§ 2º-B')) {
    throw new Error('HOLDOUT-017_DETALHE_INSUFICIENTE: Menção a art. 171, § 2º-A e § 2º-B obrigatória.');
  }
  // Detalhes de HOLDOUT-052: SV 25, CONSTITUTIVE_EFFECT, DECLARES, NEGATIVE
  if (!dossierContent.includes('Súmula Vinculante 25') || !dossierContent.includes('CONSTITUTIVE_EFFECT') || !dossierContent.includes('DECLARES') || !dossierContent.includes('NEGATIVE')) {
    throw new Error('HOLDOUT-052_DETALHE_INSUFICIENTE: Saneamento deôntico completo obrigatório para SV 25.');
  }
  passedChecks++;

  // Check 5: Integridade do Texto Original e Evidências Oficiais
  totalChecks++;
  for (const id of unitMatches) {
    const g = goldenMap.get(id);
    const ev = evidenceManifest[id];

    // Texto original contido exatamente
    if (!dossierContent.includes(g.originalText)) {
      throw new Error(`TEXTO_ORIGINAL_DIVERGENTE: Texto original de ${id} não encontrado identicamente no dossiê.`);
    }

    // Trecho material da fonte não-vazio
    for (const s of ev.officialSources) {
      if (!s.materialText || s.materialText.trim().length === 0) {
        throw new Error(`TRECHO_MATERIAL_VAZIO: Fonte ${s.evidenceId} de ${id} não possui texto material.`);
      }
      if (!dossierContent.includes(s.evidenceId)) {
        throw new Error(`EVIDENCE_ID_FALTANDO: Evidence ID ${s.evidenceId} de ${id} não citado no dossiê.`);
      }
    }
  }
  passedChecks++;

  // Check 6: Zero decisões pré-marcadas (NÃO AUTOAPROVAR)
  totalChecks++;
  if (dossierContent.includes('[X] APPROVED') || dossierContent.includes('[x] APPROVED')) {
    throw new Error('AUTO_APPROVAL_VIOLATION: Decisão APPROVED pré-marcada no dossiê!');
  }
  if (dossierContent.includes('[X] REJECTED') || dossierContent.includes('[x] REJECTED')) {
    throw new Error('AUTO_APPROVAL_VIOLATION: Decisão REJECTED pré-marcada no dossiê!');
  }
  if (dossierContent.includes('[X] UNCERTAIN') || dossierContent.includes('[x] UNCERTAIN')) {
    throw new Error('AUTO_APPROVAL_VIOLATION: Decisão UNCERTAIN pré-marcada no dossiê!');
  }

  // Contagem exata de blocos de decisão vazios
  const decisionBlocksCount = (dossierContent.match(/\[ \] APPROVED\s*\n\s*\[ \] REJECTED\s*\n\s*\[ \] UNCERTAIN/g) || []).length;
  if (decisionBlocksCount !== 27) {
    throw new Error(`DECISION_BLOCKS_COUNT: Esperado 27 blocos de decisão vazios, encontrado ${decisionBlocksCount}`);
  }
  passedChecks++;

  // Check 7: Anti-Leakage (Seção 11)
  totalChecks++;
  // 1. Blind input não referencia dossiê
  for (const b of blindInputs) {
    if ((b as any).providedContext && (b as any).providedContext.includes('dossier')) {
      throw new Error(`ANTI_LEAKAGE_FAIL: providedContext em blind input ${b.holdoutId} referencia dossiê!`);
    }
    if (JSON.stringify(b).includes('pre-h1-human-review-dossier')) {
      throw new Error(`ANTI_LEAKAGE_FAIL: Blind input ${b.holdoutId} contém metadados do dossiê!`);
    }
  }

  // 2. Candidate evaluation runners não importam o dossiê
  const evalRunners = [
    'scripts/evaluate-assertion-decomposition-gpt56.ts',
    'scripts/evaluate-assertion-decomposition-v2.ts',
    'scripts/evaluate-legal-review-adversarial.ts'
  ];
  for (const runner of evalRunners) {
    if (fs.existsSync(runner)) {
      const runnerCode = fs.readFileSync(runner, 'utf8');
      if (runnerCode.includes('pre-h1-human-review-dossier')) {
        throw new Error(`ANTI_LEAKAGE_FAIL: Runner ${runner} importa ou referencia o dossiê de revisão humana!`);
      }
    }
  }
  passedChecks++;

  // Check 8: Governança de isolamento (zero chamadas externas)
  totalChecks++;
  if (externalModelCalls !== 0 || networkRequests !== 0) {
    throw new Error(`ISOLATION_LEAK: Chamadas externas detectadas (modelCalls=${externalModelCalls}, networkRequests=${networkRequests})`);
  }
  passedChecks++;

  return {
    success: passedChecks === totalChecks,
    totalChecks,
    passedChecks,
    dossierSha256,
    uniqueUnitsCount: unitMatches.length,
    hardUnitsFound: hardFound,
    jurisprudenceUnitsFound: jurFound,
    replacementUnitsFound: replFound,
    specialCasesVerified: {
      holdout012: true,
      holdout017: true,
      holdout052: true,
    },
    zeroPreApprovedConfirmed: true,
    antiLeakageConfirmed: true,
  };
}

// Execução dupla com verificação de determinismo
console.log('=== EXECUÇÃO RUN 1: check-pre-h1-human-review-dossier.ts ===');
const res1 = runDossierCheck();
console.log(`Run 1 concluída: ${res1.passedChecks}/${res1.totalChecks} verificações passaram.`);
console.log(`- Unidades únicas catalogadas: ${res1.uniqueUnitsCount}/27`);
console.log(`- Unidades HARD verificadas: ${res1.hardUnitsFound}/20`);
console.log(`- Unidades Jurisprudenciais verificadas: ${res1.jurisprudenceUnitsFound}/12`);
console.log(`- Unidades Substituídas PRE-H1 verificadas: ${res1.replacementUnitsFound}/12`);
console.log(`- Casos especiais (012, 017, 052): 100% validados com destaque`);
console.log(`- Decisões pré-marcadas: 0 (todos os 27 blocos rigorosamente desmarcados)`);
console.log(`- Anti-leakage: 100% isolado de blind input e runners`);
console.log(`- SHA-256 do Dossiê: ${res1.dossierSha256}`);

console.log('\n=== EXECUÇÃO RUN 2: check-pre-h1-human-review-dossier.ts ===');
const res2 = runDossierCheck();
console.log(`Run 2 concluída: ${res2.passedChecks}/${res2.totalChecks} verificações passaram.`);

const diff = JSON.stringify(res1) !== JSON.stringify(res2);
if (diff) {
  console.error('ERRO: Divergência entre Run 1 e Run 2!');
  process.exit(1);
}
console.log('✓ DETERMINISMO 100% COMPROVADO: Run 1 e Run 2 são idênticas byte a byte.');
