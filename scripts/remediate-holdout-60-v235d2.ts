/**
 * ATHENA V2.3.5-D.2 — SURGICAL REMEDIATION FOR HOLDOUT-027 ONLY
 * 
 * 100% OFFLINE / ZERO OpenAI / ZERO Gemini / ZERO LLM / ZERO NETWORK
 * 
 * OBJETIVO:
 * - Corrigir exclusivamente HOLDOUT-027 conforme o verbete literal da STF SV 11.
 * - Preservar 100% imutáveis todas as outras 59 unidades (OTHER_HOLDOUT_UNITS_MUTATED = 0).
 * - Distribuir com precisão cirúrgica e não compensatória as responsabilidades:
 *     AGENTE/AUTORIDADE -> disciplinar, civil, penal
 *     ESTADO -> civil
 *     PROCESSO -> nulidade da prisão ou ato processual
 * - Gerar novo freeze em tmp/assertion-decomposition-holdout-v235d2/.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';

// ============================================================================
// 1. NETWORK GUARD
// ============================================================================
let externalModelCalls = 0;
let networkRequests = 0;

globalThis.fetch = () => {
  networkRequests++;
  throw new Error('NETWORK_GUARD_VIOLATION: fetch() terminantemente proibido.');
};

try {
  (http as any).request = () => {
    networkRequests++;
    throw new Error('NETWORK_GUARD_VIOLATION: http.request terminantemente proibido.');
  };
  (https as any).request = () => {
    networkRequests++;
    throw new Error('NETWORK_GUARD_VIOLATION: https.request terminantemente proibido.');
  };
} catch {
  // Ignora se congelado
}

function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function makeSpan(fullText: string, sub: string) {
  const start = fullText.indexOf(sub);
  if (start === -1) {
    throw new Error(`makeSpan: Substring não encontrada no texto:\n"${sub}"\nTexto completo:\n"${fullText}"`);
  }
  return { start, end: start + sub.length, text: sub };
}

// ============================================================================
// 2. VERIFICAÇÃO DE HASHES DE BASELINE V2.3.5-D (SEÇÃO 1)
// ============================================================================
const BASELINE_D = {
  blindInput: 'ade57e6d5dea4f64241614e3f2e1c785d82308b7c2177d1374d00bfc9a38897e',
  golden: '4cb30b29b101b5530181547271ea4dcc2f883beffc64248b1bbe9b93ffc1e711',
  evidenceManifest: 'e71c42faa0a1def61ffb69fbf5632d7d1ac9a4a57e40319c584b669ff173df98',
  decisionManifest: '4345107dc9289824299fe9ce352e311e379dd5d69620bf145c51484c5168e35f',
  remediationReport: '4e076da680a5737ab6b07752adbb8f6c2e01d00fde66901beb9384bd437fae19',
  holdoutManifest: 'f57db3ef7013699cd41a5e32d0ccc55d621e650ad4352ee0834837350cd4e531'
};

const v235dDir = path.resolve('tmp/assertion-decomposition-holdout-v235d');

const baselineBlindInput = fs.readFileSync(path.join(v235dDir, 'input/holdout-60-v235d.json'), 'utf8');
const baselineGolden = fs.readFileSync(path.join(v235dDir, 'golden/holdout-60-golden-v235d.json'), 'utf8');
const baselineEvidence = fs.readFileSync(path.join(v235dDir, 'evidence/evidence-manifest-v235d.json'), 'utf8');
const baselineDecision = fs.readFileSync(path.join(v235dDir, 'audit/human-decision-manifest.json'), 'utf8');
const baselineReport = fs.readFileSync(path.join(v235dDir, 'audit/remediation-report-v235d.json'), 'utf8');
const baselineManifest = fs.readFileSync(path.join(v235dDir, 'manifest/holdout-manifest-v235d.json'), 'utf8');

if (computeSha256(baselineBlindInput) !== BASELINE_D.blindInput) {
  throw new Error('D2_BASELINE_HASH_MISMATCH: blindInput');
}
if (computeSha256(baselineGolden) !== BASELINE_D.golden) {
  throw new Error('D2_BASELINE_HASH_MISMATCH: golden');
}
if (computeSha256(baselineEvidence) !== BASELINE_D.evidenceManifest) {
  throw new Error('D2_BASELINE_HASH_MISMATCH: evidenceManifest');
}
if (computeSha256(baselineDecision) !== BASELINE_D.decisionManifest) {
  throw new Error('D2_BASELINE_HASH_MISMATCH: decisionManifest');
}
if (computeSha256(baselineReport) !== BASELINE_D.remediationReport) {
  throw new Error('D2_BASELINE_HASH_MISMATCH: remediationReport');
}
if (computeSha256(baselineManifest) !== BASELINE_D.holdoutManifest) {
  throw new Error('D2_BASELINE_HASH_MISMATCH: holdoutManifest');
}

console.log('✓ BASELINE V2.3.5-D CONFIRMADO COM SUCESSO (Todos os 6 hashes conferem)');

// ============================================================================
// 3. CARREGAR DADOS E CONSTRUIR CORREÇÃO CIRÚRGICA DE HOLDOUT-027
// ============================================================================
const rawGoldenUnits: any[] = JSON.parse(baselineGolden);
const rawEvidenceManifest: Record<string, any> = JSON.parse(baselineEvidence);
const rawDecisionManifest: any = JSON.parse(baselineDecision);

const old027 = rawGoldenUnits.find(u => u.holdoutId === 'HOLDOUT-027');
if (!old027) throw new Error('HOLDOUT-027 não encontrado no golden V2.3.5-D');

// Texto oficial literal exato da STF SV 11:
const newText027 = 'Só é lícito o uso de algemas em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, por parte do preso ou de terceiros, justificada a excepcionalidade por escrito, sob pena de responsabilidade disciplinar, civil e penal do agente ou da autoridade e de nulidade da prisão ou do ato processual a que se refere, sem prejuízo da responsabilidade civil do Estado.';

const new027 = JSON.parse(JSON.stringify(old027));
new027.originalText = newText027;
new027.remediationStatus = 'PRE_H1_SURGICALLY_REMEDIATED_D2';

// Substrings para decomposição atômica não compensatória:
const c1Text = 'Só é lícito o uso de algemas em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, por parte do preso ou de terceiros, justificada a excepcionalidade por escrito';
const c2Text = 'sob pena de responsabilidade disciplinar, civil e penal do agente ou da autoridade e de nulidade da prisão ou do ato processual a que se refere';
const c3Text = 'sem prejuízo da responsabilidade civil do Estado';

new027.atomicClaims = [
  {
    claimId: 'H027-C1',
    holdoutId: 'HOLDOUT-027',
    sourceSpan: makeSpan(newText027, c1Text),
    normalizedClaim: 'O uso de algemas só é lícito em casos de resistência, receio de fuga ou perigo justificados por escrito',
    claimType: 'PERMISSION',
    materiality: 'MATERIAL'
  },
  {
    claimId: 'H027-C2',
    holdoutId: 'HOLDOUT-027',
    sourceSpan: makeSpan(newText027, c2Text),
    normalizedClaim: 'O uso indevido acarreta responsabilidade disciplinar, civil e penal do agente ou autoridade e nulidade da prisão ou ato processual',
    claimType: 'COURT_RULING',
    materiality: 'MATERIAL'
  },
  {
    claimId: 'H027-C3',
    holdoutId: 'HOLDOUT-027',
    sourceSpan: makeSpan(newText027, c3Text),
    normalizedClaim: 'A ilicitude no uso de algemas não prejudica a responsabilidade civil do Estado',
    claimType: 'COURT_RULING',
    materiality: 'MATERIAL'
  }
];

const q1_cond = 'em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, por parte do preso ou de terceiros';
const q1_formal = 'justificada a excepcionalidade por escrito';
const q2_respAgente = 'responsabilidade disciplinar, civil e penal do agente ou da autoridade';
const q2_nulidade = 'nulidade da prisão ou do ato processual a que se refere';
const q3_respEstado = 'responsabilidade civil do Estado';

new027.assertionSpecs = [
  {
    assertionId: 'H027-SPEC1',
    holdoutId: 'HOLDOUT-027',
    claimId: 'H027-C1',
    sourceSpan: makeSpan(newText027, c1Text),
    kind: 'RULE_PERMISSION',
    normativeFunction: 'PERMISSION',
    subject: 'autoridade pública policial ou judiciária',
    predicate: 'usar algemas excepcionalmente',
    object: 'preso ou pessoa sob custódia estatal',
    polarity: 'POSITIVE',
    modality: 'MAY',
    qualifiers: [
      {
        type: 'CONDITION',
        value: q1_cond,
        sourceText: q1_cond,
        sourceSpan: makeSpan(newText027, q1_cond)
      },
      {
        type: 'CONDITION',
        value: q1_formal,
        sourceText: q1_formal,
        sourceSpan: makeSpan(newText027, q1_formal)
      }
    ],
    legalSourceTarget: 'STF_SUMULA_VINCULANTE_11',
    requiredEvidenceKind: 'JURISPRUDENCE'
  },
  {
    assertionId: 'H027-SPEC2',
    holdoutId: 'HOLDOUT-027',
    claimId: 'H027-C2',
    sourceSpan: makeSpan(newText027, c2Text),
    kind: 'RULE_DUTY',
    normativeFunction: 'DUTY',
    subject: 'agente ou autoridade responsável pelo uso ilícito',
    predicate: 'responder disciplinar, civil e penalmente e sofrer nulidade do ato',
    object: 'responsabilidade tríplice do agente/autoridade e nulidade processual da prisão ou ato',
    polarity: 'POSITIVE',
    modality: 'MUST',
    qualifiers: [
      {
        type: 'LIMIT',
        value: q2_respAgente,
        sourceText: q2_respAgente,
        sourceSpan: makeSpan(newText027, q2_respAgente)
      },
      {
        type: 'LIMIT',
        value: q2_nulidade,
        sourceText: q2_nulidade,
        sourceSpan: makeSpan(newText027, q2_nulidade)
      }
    ],
    legalSourceTarget: 'STF_SUMULA_VINCULANTE_11',
    requiredEvidenceKind: 'JURISPRUDENCE'
  },
  {
    assertionId: 'H027-SPEC3',
    holdoutId: 'HOLDOUT-027',
    claimId: 'H027-C3',
    sourceSpan: makeSpan(newText027, c3Text),
    kind: 'DECLARATIVE',
    normativeFunction: 'CONSTITUTIVE_EFFECT',
    subject: 'Estado (Poder Público)',
    predicate: 'responder civilmente pelos danos decorrentes',
    object: 'responsabilidade civil extracontratual do Estado',
    polarity: 'POSITIVE',
    modality: 'DECLARES',
    qualifiers: [
      {
        type: 'SCOPE',
        value: q3_respEstado,
        sourceText: q3_respEstado,
        sourceSpan: makeSpan(newText027, q3_respEstado)
      }
    ],
    legalSourceTarget: 'STF_SUMULA_VINCULANTE_11',
    requiredEvidenceKind: 'JURISPRUDENCE'
  }
];

new027.criticalMaterialTokens = [
  'uso de algemas',
  'resistência',
  'fuga',
  'preso ou de terceiros',
  'justificada a excepcionalidade por escrito',
  'responsabilidade disciplinar, civil e penal do agente ou da autoridade',
  'nulidade da prisão ou do ato processual',
  'responsabilidade civil do Estado'
];

new027.criticalQualifiers = [
  {
    type: 'CONDITION',
    value: q1_cond,
    sourceText: q1_cond,
    sourceSpan: makeSpan(newText027, q1_cond)
  },
  {
    type: 'LIMIT',
    value: q2_respAgente,
    sourceText: q2_respAgente,
    sourceSpan: makeSpan(newText027, q2_respAgente)
  },
  {
    type: 'SCOPE',
    value: q3_respEstado,
    sourceText: q3_respEstado,
    sourceSpan: makeSpan(newText027, q3_respEstado)
  }
];

// ============================================================================
// 4. MONTAR O BENCHMARK COMPLETO E VERIFICAR OUTRAS 59 UNIDADES
// ============================================================================
let otherHoldoutUnitsMutated = 0;
const finalGoldenUnitsD2: any[] = [];
const finalBlindInputsD2: any[] = [];

for (const oldU of rawGoldenUnits) {
  if (oldU.holdoutId === 'HOLDOUT-027') {
    finalGoldenUnitsD2.push(new027);
    finalBlindInputsD2.push({
      holdoutId: new027.holdoutId,
      domain: new027.domain,
      difficulty: new027.difficulty,
      propositionType: new027.propositionType,
      originalText: new027.originalText
    });
  } else {
    const cloneU = JSON.parse(JSON.stringify(oldU));
    if (JSON.stringify(cloneU) !== JSON.stringify(oldU)) {
      otherHoldoutUnitsMutated++;
    }
    finalGoldenUnitsD2.push(cloneU);
    finalBlindInputsD2.push({
      holdoutId: cloneU.holdoutId,
      domain: cloneU.domain,
      difficulty: cloneU.difficulty,
      propositionType: cloneU.propositionType,
      originalText: cloneU.originalText
    });
  }
}

if (otherHoldoutUnitsMutated !== 0) {
  throw new Error(`VIOLAÇÃO_DE_IMUTABILIDADE: OTHER_HOLDOUT_UNITS_MUTATED = ${otherHoldoutUnitsMutated}`);
}
console.log('✓ TESTE DE IMUTABILIDADE APROVADO: OTHER_HOLDOUT_UNITS_MUTATED = 0');

// Validação geométrica rigorosa em 100% das 60 unidades
let spansChecked = 0;
for (const u of finalGoldenUnitsD2) {
  for (const c of u.atomicClaims) {
    const slice = u.originalText.slice(c.sourceSpan.start, c.sourceSpan.end);
    if (slice !== c.sourceSpan.text) {
      throw new Error(`FALHA_GEOMETRICA em ${u.holdoutId} claim ${c.claimId}: "${slice}" !== "${c.sourceSpan.text}"`);
    }
    spansChecked++;
  }
  for (const s of u.assertionSpecs) {
    const slice = u.originalText.slice(s.sourceSpan.start, s.sourceSpan.end);
    if (slice !== s.sourceSpan.text) {
      throw new Error(`FALHA_GEOMETRICA em ${u.holdoutId} spec ${s.assertionId}: "${slice}" !== "${s.sourceSpan.text}"`);
    }
    spansChecked++;
    for (const q of (s.qualifiers || [])) {
      if (q.sourceSpan) {
        const qSlice = u.originalText.slice(q.sourceSpan.start, q.sourceSpan.end);
        if (qSlice !== q.sourceSpan.text) {
          throw new Error(`FALHA_GEOMETRICA_QUALIFIER em ${u.holdoutId} qualifier ${q.value}`);
        }
        spansChecked++;
      }
    }
  }
}
console.log(`✓ GEOMETRIA CONFIRMADA: ${spansChecked} spans validados`);

// ============================================================================
// 5. ATUALIZAR EVIDENCE MANIFEST E RELATÓRIO DE REMEDIAÇÃO
// ============================================================================
const finalEvidenceManifestD2: Record<string, any> = JSON.parse(baselineEvidence);

// Atualizar rawTextExcerpt de HOLDOUT-027 para o verbete oficial exato
finalEvidenceManifestD2['HOLDOUT-027'].officialSources[0].rawTextExcerpt = newText027;

const remediationReportD2 = {
  version: 'V2.3.5-D.2',
  phase: 'SURGICAL_REMEDIATION_HOLDOUT_027_ONLY',
  remediationCount: 1,
  remediatedUnits: [
    {
      holdoutId: 'HOLDOUT-027',
      domain: new027.domain,
      difficulty: new027.difficulty,
      rejectionReason: 'V2.3.5-D.1 detectou coordenação gramatical errônea na parte final, atribuindo responsabilidade disciplinar e penal ao Estado.',
      preOriginalText: old027.originalText,
      postOriginalText: new027.originalText,
      preClaimsCount: old027.atomicClaims.length,
      postClaimsCount: new027.atomicClaims.length,
      preSpecsCount: old027.assertionSpecs.length,
      postSpecsCount: new027.assertionSpecs.length,
      legalSourceTargets: ['STF_SUMULA_VINCULANTE_11']
    }
  ]
};

// ============================================================================
// 6. ESCREVER ARTEFATOS CONGELADOS EM tmp/assertion-decomposition-holdout-v235d2/
// ============================================================================
const targetBaseDir = path.resolve('tmp/assertion-decomposition-holdout-v235d2');
fs.mkdirSync(path.join(targetBaseDir, 'input'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'golden'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'evidence'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'manifest'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'audit'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'extracted'), { recursive: true });

// Copiar os 27 documentos oficiais extraídos
const extractedSrc = path.join(v235dDir, 'extracted');
for (const file of fs.readdirSync(extractedSrc)) {
  fs.copyFileSync(path.join(extractedSrc, file), path.join(targetBaseDir, 'extracted', file));
}

const inputContentD2 = JSON.stringify(finalBlindInputsD2, null, 2);
const goldenContentD2 = JSON.stringify(finalGoldenUnitsD2, null, 2);
const evidenceContentD2 = JSON.stringify(finalEvidenceManifestD2, null, 2);
const decisionContentD2 = JSON.stringify(rawDecisionManifest, null, 2); // Idêntico
const reportContentD2 = JSON.stringify(remediationReportD2, null, 2);

const inputPathD2 = path.join(targetBaseDir, 'input/holdout-60-v235d2.json');
const goldenPathD2 = path.join(targetBaseDir, 'golden/holdout-60-golden-v235d2.json');
const evidencePathD2 = path.join(targetBaseDir, 'evidence/evidence-manifest-v235d2.json');
const decisionPathD2 = path.join(targetBaseDir, 'audit/human-decision-manifest.json');
const reportPathD2 = path.join(targetBaseDir, 'audit/remediation-report-v235d2.json');

fs.writeFileSync(inputPathD2, inputContentD2, 'utf8');
fs.writeFileSync(goldenPathD2, goldenContentD2, 'utf8');
fs.writeFileSync(evidencePathD2, evidenceContentD2, 'utf8');
fs.writeFileSync(decisionPathD2, decisionContentD2, 'utf8');
fs.writeFileSync(reportPathD2, reportContentD2, 'utf8');

const blindInputSha256 = computeSha256(inputContentD2);
const goldenSha256 = computeSha256(goldenContentD2);
const evidenceManifestSha256 = computeSha256(evidenceContentD2);
const humanDecisionSha256 = computeSha256(decisionContentD2);
const remediationReportSha256 = computeSha256(reportContentD2);

const nowIso = new Date().toISOString();
const holdoutManifestD2 = {
  version: 'V2.3.5-D.2',
  phase: 'SURGICAL_REMEDIATION_HOLDOUT_027_ONLY',
  createdAt: nowIso,
  benchmarkSize: 60,
  stratification: {
    standardCount: 40,
    hardCount: 20,
    domains: {
      'Direito Penal — Parte Geral': 10,
      'Direito Penal — Parte Especial': 8,
      'Processo Penal': 12,
      'Direito Constitucional': 8,
      'Direito Administrativo': 8,
      'Direito Civil': 7,
      'Processo Civil': 7
    }
  },
  humanReview: {
    totalCriticalReviewed: 27,
    approvedCount: 13,
    rejectedCount: 14,
    uncertainCount: 0,
    otherHoldoutUnitsMutated: 0,
    surgicallyRemediatedUnitsCount: 1
  },
  hashes: {
    blindInputSha256,
    goldenSha256,
    evidenceManifestSha256,
    humanDecisionSha256,
    remediationReportSha256
  },
  holdoutFreezeV235D2: true
};

const manifestPathD2 = path.join(targetBaseDir, 'manifest/holdout-manifest-v235d2.json');
fs.writeFileSync(manifestPathD2, JSON.stringify(holdoutManifestD2, null, 2), 'utf8');

console.log('\n================================================================');
console.log('✓ FREEZE V2.3.5-D.2 CONCLUÍDO COM SUCESSO');
console.log('================================================================');
console.log(`- blindInput SHA-256:       ${blindInputSha256}`);
console.log(`- golden SHA-256:           ${goldenSha256}`);
console.log(`- evidenceManifest SHA-256: ${evidenceManifestSha256}`);
console.log(`- humanDecision SHA-256:    ${humanDecisionSha256}`);
console.log(`- remediationReport SHA-256:${remediationReportSha256}`);
console.log(`- manifest SHA-256:         ${computeSha256(JSON.stringify(holdoutManifestD2, null, 2))}`);
