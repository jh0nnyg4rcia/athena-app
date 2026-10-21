/**
 * ATHENA V2.3.5-D — HOLDOUT-60 HUMAN DECISION CONSOLIDATION & REJECTED GOLDEN REMEDIATION
 * 
 * 100% OFFLINE / ZERO OpenAI / ZERO Gemini / ZERO LLM / ZERO NETWORK
 * 
 * OBJETIVO:
 * - Consolidar as 27 decisões humanas PRE-H1 (APPROVED = 13, REJECTED = 14, UNCERTAIN = 0).
 * - Preservar 100% imutáveis as 13 unidades APPROVED e as 33 unidades não-críticas.
 * - Remediar SOMENTE as 14 unidades REJECTED estritamente conforme as razões vinculantes
 *   e as evidências oficiais materializadas localmente.
 * - Produzir o novo conjunto congelado em tmp/assertion-decomposition-holdout-v235d/:
 *     input/holdout-60-v235d.json
 *     golden/holdout-60-golden-v235d.json
 *     evidence/evidence-manifest-v235d.json
 *     manifest/holdout-manifest-v235d.json
 *     audit/human-decision-manifest.json
 *     audit/remediation-report-v235d.json
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
// 2. VERIFICAÇÃO DE HASHES DE BASELINE (SEÇÃO 1)
// ============================================================================
const BASELINE = {
  blindInputSha256: '5cd1ad38ba706ae9745d572e92ae6c029964e9ba412fbe0b5fd6b0a569190175',
  goldenSha256: 'd06e15ba78cce8c20e33b24c5e34d930d4786fb54f742c08851ab4c748335761',
  evidenceManifestSha256: '56f99debaed183dfd57cf1a26b8ad467cc2b2d58af01bcbe78da9c3495d2e41c',
  signoffSha256: '45f1303c11dd94c09ae3ff438da8c8a58ec7adca3a8b5124e0ed82e1bb04fe20',
  dossierSha256: '101793d6b6bb55fdc4f5d645de285d4f3e2e7586b93bd8f22ec86b25799d077c',
};

const v235cDir = path.resolve('tmp/assertion-decomposition-holdout-v235c');
const baselineBlindInput = fs.readFileSync(path.join(v235cDir, 'input/holdout-60-v235c.json'), 'utf8');
const baselineGolden = fs.readFileSync(path.join(v235cDir, 'golden/holdout-60-golden-v235c.json'), 'utf8');
const baselineEvidence = fs.readFileSync(path.join(v235cDir, 'evidence/evidence-manifest-v235c.json'), 'utf8');
const baselineSignoff = fs.readFileSync(path.join(v235cDir, 'audit/pre-h1-human-signoff.json'), 'utf8');
const baselineDossier = fs.readFileSync(path.join(v235cDir, 'audit/pre-h1-human-review-dossier.md'), 'utf8');

if (computeSha256(baselineBlindInput) !== BASELINE.blindInputSha256) {
  throw new Error(`BASELINE_HASH_MISMATCH: blindInput`);
}
if (computeSha256(baselineGolden) !== BASELINE.goldenSha256) {
  throw new Error(`BASELINE_HASH_MISMATCH: golden`);
}
if (computeSha256(baselineEvidence) !== BASELINE.evidenceManifestSha256) {
  throw new Error(`BASELINE_HASH_MISMATCH: evidenceManifest`);
}
if (computeSha256(baselineSignoff) !== BASELINE.signoffSha256) {
  throw new Error(`BASELINE_HASH_MISMATCH: pre-H1 signoff`);
}
if (computeSha256(baselineDossier) !== BASELINE.dossierSha256) {
  throw new Error(`BASELINE_HASH_MISMATCH: dossier`);
}
console.log('✓ BASELINE V2.3.5-C CONFIRMADO COM SUCESSO (Todos os 5 hashes coincidem)');

// ============================================================================
// 3. DECISÕES HUMANAS CONSOLIDADAS (SEÇÕES 2, 3, 4)
// ============================================================================
const APPROVED_IDS = [
  'HOLDOUT-002', 'HOLDOUT-008', 'HOLDOUT-016', 'HOLDOUT-020',
  'HOLDOUT-030', 'HOLDOUT-036', 'HOLDOUT-037', 'HOLDOUT-040',
  'HOLDOUT-044', 'HOLDOUT-045', 'HOLDOUT-053', 'HOLDOUT-057',
  'HOLDOUT-060'
];

const REJECTED_REASONS: Record<string, string> = {
  'HOLDOUT-005': 'A proposição acrescenta elementos sem suporte material suficiente na evidência apresentada, especialmente competência para determinar internação, "perigo social" e caracterização do período de 1 a 3 anos como primeiro exame médico.',
  'HOLDOUT-007': 'O originalText/golden não representa elemento considerado material na revisão humana da SV 26 relativo à avaliação dos requisitos objetivos e subjetivos para benefício.',
  'HOLDOUT-010': 'H010-C2 identifica condições materiais correspondentes aos incisos relevantes, mas elas não foram adequadamente representadas nos AssertionSpecs/qualifiers do golden.',
  'HOLDOUT-012': 'O originalText acrescenta "salvo quando o agente desconhecia a gravidez" sem suporte no art. 121-A, § 2º, I e omite a hipótese legal relativa à vítima mãe ou responsável por criança, adolescente ou pessoa com deficiência.',
  'HOLDOUT-017': 'O originalText simplifica materialmente a hipótese do art. 171, § 2º-A e omite do § 2º-B a condicionante "considerada a relevância do resultado gravoso".',
  'HOLDOUT-023': 'H023-C1 foi atribuído ao art. 413, § 1º, embora o requisito da pronúncia esteja no caput, e a expressão "sem emitir juízo categórico de culpabilidade" não consta da evidência legislativa apresentada.',
  'HOLDOUT-026': 'A evidência apresentada (CPP art. 414) não enuncia diretamente que a impronúncia extingue o processo sem julgamento de mérito nem que não produz coisa julgada material.',
  'HOLDOUT-027': 'O originalText/golden omitiram elementos considerados materiais da SV 11: perigo proveniente do preso ou de terceiros, responsabilidade disciplinar e responsabilidade do Estado.',
  'HOLDOUT-032': 'A decomposição não preservou com suficiente atomicidade os elementos normativos distintos relativos a reserva de plenário, quórum de maioria absoluta e exceção jurisprudencial de forma não compensatória.',
  'HOLDOUT-042': 'Na Lei 8.443/1992, art. 45, o prazo razoável destina-se a que o responsável adote as providências necessárias ao exato cumprimento da lei, e não simplesmente para manifestação do gestor.',
  'HOLDOUT-043': 'O originalText/golden deve representar os elementos materiais relevantes do verbete da SV 13, incluindo servidores investidos em direção/chefia/assessoramento, cargos em comissão/função gratificada e expressamente designações recíprocas.',
  'HOLDOUT-048': 'No CDC art. 28 § 5º a personalidade jurídica deve constituir obstáculo ao ressarcimento de prejuízos causados aos consumidores, e não "simples prejuízo".',
  'HOLDOUT-052': 'Remover a generalização de "inadmissibilidade da custódia civil por dívida no ordenamento jurídico brasileiro", restringindo a ilicitude estritamente à prisão civil de depositário infiel (SV 25).',
  'HOLDOUT-055': 'H055-SPEC1 deve preservar "risco ao resultado útil do processo" e H055-SPEC2 não deve acrescentar a qualificação doutrinária "fática ou jurídica" inexistente na fonte legal.'
};

const REJECTED_IDS = Object.keys(REJECTED_REASONS).sort();

if (APPROVED_IDS.length !== 13 || REJECTED_IDS.length !== 14) {
  throw new Error(`Contagem de decisões inválida: APPROVED=${APPROVED_IDS.length}, REJECTED=${REJECTED_IDS.length}`);
}

// ============================================================================
// 4. CARREGAR DADOS DE V2.3.5-C
// ============================================================================
const rawGoldenUnits: any[] = JSON.parse(baselineGolden);
const rawEvidenceManifest: Record<string, any> = JSON.parse(baselineEvidence);

// ============================================================================
// 5. CONSTRUIR AS 14 REMEDIAÇÕES
// ============================================================================
const remediatedUnitsMap = new Map<string, any>();

// ----------------------------------------------------------------------------
// HOLDOUT-005: CP art. 97, § 1º
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-005';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'A internação será por tempo indeterminado, perdurando enquanto não for averiguada a cessação de periculosidade, devendo o prazo mínimo ser de um a três anos.';
  u.originalText = text;
  u.propositionType = 'TIMEFRAME_QUANTITY';
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'A internação será por tempo indeterminado, perdurando enquanto não for averiguada a cessação de periculosidade';
  const c2Text = 'devendo o prazo mínimo ser de um a três anos';

  u.atomicClaims = [
    {
      claimId: 'H005-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'A internação de inimputável perdura por tempo indeterminado até a averiguação da cessação de periculosidade',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H005-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'O prazo mínimo de duração da internação deve ser de um a três anos',
      claimType: 'TIMEFRAME_QUANTITY',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'perdurando enquanto não for averiguada a cessação de periculosidade';
  const q2Text = 'um a três anos';

  u.assertionSpecs = [
    {
      assertionId: 'H005-SPEC1',
      holdoutId: id,
      claimId: 'H005-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'CONSTITUTIVE_EFFECT',
      subject: 'internação de inimputável',
      predicate: 'perdurar por tempo indeterminado',
      object: 'medida detentiva até averiguação pericial de cessação da periculosidade',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'CP_ART_97_PAR_1',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H005-SPEC2',
      holdoutId: id,
      claimId: 'H005-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'prazo mínimo de internação',
      predicate: 'ser fixado',
      object: 'de um a três anos',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'QUANTITY',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        }
      ],
      legalSourceTarget: 'CP_ART_97_PAR_1',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['internação', 'tempo indeterminado', 'cessação de periculosidade', 'prazo mínimo', 'um a três anos'];
  u.criticalQualifiers = [
    {
      type: 'CONDITION',
      value: q1Text,
      sourceText: q1Text,
      sourceSpan: makeSpan(text, q1Text)
    },
    {
      type: 'QUANTITY',
      value: q2Text,
      sourceText: q2Text,
      sourceSpan: makeSpan(text, q2Text)
    }
  ];

  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-007: STF SV 26
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-007';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'Para efeito de progressão de regime no cumprimento de pena por crime hediondo ou equiparado, o juízo da execução observará a inconstitucionalidade do art. 2º da Lei nº 8.072/1990, sem prejuízo de avaliar se o condenado preenche, ou não, os requisitos objetivos e subjetivos do benefício, podendo determinar, para tal fim, de modo fundamentado, a realização de exame criminológico.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'Para efeito de progressão de regime no cumprimento de pena por crime hediondo ou equiparado, o juízo da execução observará a inconstitucionalidade do art. 2º da Lei nº 8.072/1990';
  const c2Text = 'sem prejuízo de avaliar se o condenado preenche, ou não, os requisitos objetivos e subjetivos do benefício';
  const c3Text = 'podendo determinar, para tal fim, de modo fundamentado, a realização de exame criminológico';

  u.atomicClaims = [
    {
      claimId: 'H007-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'Juízo da execução deve afastar a vedação legal inconstitucional do art. 2º da Lei 8.072/1990 na progressão de hediondos',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H007-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'Juízo da execução deve avaliar se o condenado preenche os requisitos objetivos e subjetivos do benefício',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H007-C3',
      holdoutId: id,
      sourceSpan: makeSpan(text, c3Text),
      normalizedClaim: 'Juízo da execução pode fundamentadamente determinar realização de exame criminológico',
      claimType: 'PERMISSION',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'Para efeito de progressão de regime no cumprimento de pena por crime hediondo ou equiparado';
  const q2Text = 'requisitos objetivos e subjetivos do benefício';
  const q3Text = 'de modo fundamentado';

  u.assertionSpecs = [
    {
      assertionId: 'H007-SPEC1',
      holdoutId: id,
      claimId: 'H007-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'juízo da execução penal',
      predicate: 'observar inconstitucionalidade',
      object: 'vedação legal à progressão de regime no art. 2º da Lei 8.072/1990',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'SCOPE',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'STF_SV_26',
      requiredEvidenceKind: 'JURISPRUDENCE'
    },
    {
      assertionId: 'H007-SPEC2',
      holdoutId: id,
      claimId: 'H007-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'juízo da execução penal',
      predicate: 'avaliar preenchimento',
      object: 'requisitos objetivos e subjetivos da progressão de regime',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        }
      ],
      legalSourceTarget: 'STF_SV_26',
      requiredEvidenceKind: 'JURISPRUDENCE'
    },
    {
      assertionId: 'H007-SPEC3',
      holdoutId: id,
      claimId: 'H007-C3',
      sourceSpan: makeSpan(text, c3Text),
      kind: 'RULE_PERMISSION',
      normativeFunction: 'PERMISSION',
      subject: 'juízo da execução penal',
      predicate: 'determinar de modo fundamentado',
      object: 'realização de exame criminológico',
      polarity: 'POSITIVE',
      modality: 'MAY',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        }
      ],
      legalSourceTarget: 'STF_SV_26',
      requiredEvidenceKind: 'JURISPRUDENCE'
    }
  ];

  u.criticalMaterialTokens = ['progressão de regime', 'crime hediondo', 'inconstitucionalidade', 'requisitos objetivos e subjetivos', 'exame criminológico'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-010: CP art. 44, I e II
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-010';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'As penas privativas de liberdade não superiores a quatro anos podem ser substituídas por penas restritivas de direitos se o crime não for cometido com violência ou grave ameaça à pessoa e o réu não for reincidente em crime doloso.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'As penas privativas de liberdade não superiores a quatro anos podem ser substituídas por penas restritivas de direitos';
  const c2Text = 'se o crime não for cometido com violência ou grave ameaça à pessoa e o réu não for reincidente em crime doloso';

  u.atomicClaims = [
    {
      claimId: 'H010-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'Penas privativas de liberdade de até quatro anos admitem substituição por penas restritivas de direitos',
      claimType: 'PERMISSION',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H010-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'A substituição exige crime sem violência/grave ameaça e réu não reincidente em crime doloso',
      claimType: 'EXCEPTION',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'não superiores a quatro anos';
  const q2Text = 'se o crime não for cometido com violência ou grave ameaça à pessoa';
  const q3Text = 'o réu não for reincidente em crime doloso';

  u.assertionSpecs = [
    {
      assertionId: 'H010-SPEC1',
      holdoutId: id,
      claimId: 'H010-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_PERMISSION',
      normativeFunction: 'PERMISSION',
      subject: 'juízo sentenciante',
      predicate: 'substituir pena privativa por restritiva de direitos',
      object: 'pena privativa de liberdade não superior a quatro anos',
      polarity: 'POSITIVE',
      modality: 'MAY',
      qualifiers: [
        {
          type: 'QUANTITY',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'CP_ART_44_I',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H010-SPEC2',
      holdoutId: id,
      claimId: 'H010-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'substituição de pena',
      predicate: 'exigir condições legais cumulativas',
      object: 'crime sem violência ou grave ameaça e réu não reincidente doloso',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        },
        {
          type: 'CONDITION',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        }
      ],
      legalSourceTarget: 'CP_ART_44_I_E_II',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['penas privativas de liberdade', 'penas restritivas de direitos', 'quatro anos', 'violência ou grave ameaça', 'reincidente em crime doloso'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-012: CP art. 121-A, § 2º, I (Lei nº 14.994/2024)
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-012';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'A pena do feminicídio é aumentada de um terço até a metade se o crime for praticado durante a gestação, nos três meses posteriores ao parto ou se a vítima for mãe ou responsável por criança, adolescente ou pessoa com deficiência de qualquer idade.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'A pena do feminicídio é aumentada de um terço até a metade';
  const c2Text = 'se o crime for praticado durante a gestação, nos três meses posteriores ao parto ou se a vítima for mãe ou responsável por criança, adolescente ou pessoa com deficiência de qualquer idade';

  u.atomicClaims = [
    {
      claimId: 'H012-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'A pena do crime de feminicídio sofre exasperação de um terço até a metade',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H012-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'Aumento aplicável na gestação, no puerpério ou quando a vítima for mãe ou responsável por vulnerável',
      claimType: 'EXCEPTION',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'de um terço até a metade';
  const q2Text = 'durante a gestação, nos três meses posteriores ao parto';
  const q3Text = 'se a vítima for mãe ou responsável por criança, adolescente ou pessoa com deficiência de qualquer idade';

  u.assertionSpecs = [
    {
      assertionId: 'H012-SPEC1',
      holdoutId: id,
      claimId: 'H012-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'pena do feminicídio',
      predicate: 'ser aumentada',
      object: 'fração de um terço até a metade',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'QUANTITY',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'CP_ART_121A_PAR_2_I',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H012-SPEC2',
      holdoutId: id,
      claimId: 'H012-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'causa de aumento de pena',
      predicate: 'incidir',
      object: 'crime praticado na gestação, puerpério ou contra mãe/responsável por vulnerável',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'TEMPORAL',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        },
        {
          type: 'CONDITION',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        }
      ],
      legalSourceTarget: 'CP_ART_121A_PAR_2_I',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['feminicídio', 'um terço até a metade', 'gestação', 'três meses posteriores ao parto', 'mãe ou responsável', 'deficiência'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-017: CP art. 171, § 2º-A e § 2º-B
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-017';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'A pena do estelionato é de reclusão de quatro a oito anos e multa se a fraude é cometida mediante informações fornecidas pela vítima ou por terceiro induzido a erro por redes sociais, contatos telefônicos ou correio eletrônico fraudulento, aumentando-se de um terço a dois terços, considerada a relevância do resultado gravoso, se praticada mediante servidor mantido fora do território nacional.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'A pena do estelionato é de reclusão de quatro a oito anos e multa se a fraude é cometida mediante informações fornecidas pela vítima ou por terceiro induzido a erro por redes sociais, contatos telefônicos ou correio eletrônico fraudulento';
  const c2Text = 'aumentando-se de um terço a dois terços, considerada a relevância do resultado gravoso, se praticada mediante servidor mantido fora do território nacional';

  u.atomicClaims = [
    {
      claimId: 'H017-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'Fraude eletrônica com informações da vítima ou terceiro induzido a erro comina reclusão de 4 a 8 anos e multa',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H017-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'Pena aumenta de um terço a dois terços considerada a relevância do resultado gravoso se usado servidor no exterior',
      claimType: 'TIMEFRAME_QUANTITY',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'quatro a oito anos e multa';
  const q2Text = 'informações fornecidas pela vítima ou por terceiro induzido a erro';
  const q3Text = 'um terço a dois terços';
  const q4Text = 'considerada a relevância do resultado gravoso';
  const q5Text = 'servidor mantido fora do território nacional';

  u.assertionSpecs = [
    {
      assertionId: 'H017-SPEC1',
      holdoutId: id,
      claimId: 'H017-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'ordem jurídica penal',
      predicate: 'cominar reclusão de quatro a oito anos e multa',
      object: 'estelionato mediante fraude eletrônica',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'QUANTITY',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        },
        {
          type: 'CONDITION',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        }
      ],
      legalSourceTarget: 'CP_ART_171_PAR_2A',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H017-SPEC2',
      holdoutId: id,
      claimId: 'H017-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'juízo sentenciante',
      predicate: 'aumentar a pena de um terço a dois terços',
      object: 'fraude eletrônica praticada com servidor no exterior',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'QUANTITY',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        },
        {
          type: 'CONDITION',
          value: q4Text,
          sourceText: q4Text,
          sourceSpan: makeSpan(text, q4Text)
        },
        {
          type: 'CONDITION',
          value: q5Text,
          sourceText: q5Text,
          sourceSpan: makeSpan(text, q5Text)
        }
      ],
      legalSourceTarget: 'CP_ART_171_PAR_2B',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['estelionato', 'quatro a oito anos', 'terceiro induzido a erro', 'um terço a dois terços', 'relevância do resultado gravoso', 'servidor mantido fora do território nacional'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-023: CPP art. 413, caput e § 1º
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-023';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'O juiz pronunciará o acusado se convencido da materialidade do fato e da existência de indícios suficientes de autoria ou de participação, devendo a fundamentação limitar-se à indicação da materialidade do fato e da existência de indícios suficientes de autoria ou de participação.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'O juiz pronunciará o acusado se convencido da materialidade do fato e da existência de indícios suficientes de autoria ou de participação';
  const c2Text = 'devendo a fundamentação limitar-se à indicação da materialidade do fato e da existência de indícios suficientes de autoria ou de participação';

  u.atomicClaims = [
    {
      claimId: 'H023-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'O juiz pronunciará o acusado se convencido da materialidade do fato e indícios de autoria ou participação',
      claimType: 'COMPETENCE',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H023-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'A fundamentação da pronúncia limitar-se-á à materialidade do fato e indícios de autoria ou participação',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'se convencido da materialidade do fato e da existência de indícios suficientes de autoria ou de participação';
  const q2Text = 'indicação da materialidade do fato e da existência de indícios suficientes de autoria ou de participação';

  u.assertionSpecs = [
    {
      assertionId: 'H023-SPEC1',
      holdoutId: id,
      claimId: 'H023-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'juiz competente no rito do júri',
      predicate: 'pronunciar o acusado',
      object: 'decisão de pronúncia condicionada a materialidade e indícios',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'CPP_ART_413_CAPUT',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H023-SPEC2',
      holdoutId: id,
      claimId: 'H023-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'fundamentação da pronúncia',
      predicate: 'limitar-se à indicação da materialidade e dos indícios',
      object: 'limites legais da motivação da pronúncia',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'LIMIT',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        }
      ],
      legalSourceTarget: 'CPP_ART_413_PAR_1',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['pronunciará o acusado', 'materialidade do fato', 'indícios suficientes de autoria ou de participação', 'fundamentação limitar-se-á'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-026: CPP art. 414, caput e parágrafo único
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-026';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'Não se convencendo da materialidade do fato ou da existência de indícios suficientes de autoria ou de participação, o juiz impronunciará o acusado, podendo ser formulada nova denúncia ou queixa se houver prova nova, enquanto não extinta a punibilidade.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'Não se convencendo da materialidade do fato ou da existência de indícios suficientes de autoria ou de participação, o juiz impronunciará o acusado';
  const c2Text = 'podendo ser formulada nova denúncia ou queixa se houver prova nova, enquanto não extinta a punibilidade';

  u.atomicClaims = [
    {
      claimId: 'H026-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'O juiz impronunciará o acusado se não se convencer da materialidade ou de indícios suficientes de autoria/participação',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H026-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'Poderá ser formulada nova denúncia ou queixa se houver prova nova enquanto não extinta a punibilidade',
      claimType: 'PERMISSION',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'Não se convencendo da materialidade do fato ou da existência de indícios suficientes de autoria ou de participação';
  const q2Text = 'se houver prova nova';
  const q3Text = 'enquanto não extinta a punibilidade';

  u.assertionSpecs = [
    {
      assertionId: 'H026-SPEC1',
      holdoutId: id,
      claimId: 'H026-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'juiz no rito do júri',
      predicate: 'impronunciar o acusado',
      object: 'decisão de impronúncia por ausência de materialidade ou indícios suficientes',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'CPP_ART_414_CAPUT',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H026-SPEC2',
      holdoutId: id,
      claimId: 'H026-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_PERMISSION',
      normativeFunction: 'PERMISSION',
      subject: 'titular da ação penal',
      predicate: 'formular nova denúncia ou queixa',
      object: 'nova ação penal diante de prova nova após impronúncia',
      polarity: 'POSITIVE',
      modality: 'MAY',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        },
        {
          type: 'CONDITION',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        }
      ],
      legalSourceTarget: 'CPP_ART_414_PAR_UNICO',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['impronunciará o acusado', 'materialidade do fato', 'indícios suficientes', 'nova denúncia ou queixa', 'prova nova', 'enquanto não extinta a punibilidade'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-027: STF SV 11
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-027';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'Só é lícito o uso de algemas em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, por parte do preso ou de terceiros, justificada a excepcionalidade por escrito, sob pena de nulidade da prisão ou do ato processual a que se refere, sem prejuízo da responsabilidade disciplinar, civil e penal da autoridade ou do Estado.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'Só é lícito o uso de algemas em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, por parte do preso ou de terceiros, justificada a excepcionalidade por escrito, sob pena de nulidade da prisão ou do ato processual a que se refere, sem prejuízo da responsabilidade disciplinar, civil e penal da autoridade ou do Estado.';

  u.atomicClaims = [
    {
      claimId: 'H027-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'O uso de algemas só é lícito em resistência, fuga ou perigo justificados por escrito sob pena de nulidade e tríplice responsabilidade',
      claimType: 'COURT_RULING',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, por parte do preso ou de terceiros';
  const q2Text = 'justificada a excepcionalidade por escrito';
  const q3Text = 'sob pena de nulidade da prisão ou do ato processual a que se refere, sem prejuízo da responsabilidade disciplinar, civil e penal da autoridade ou do Estado';

  u.assertionSpecs = [
    {
      assertionId: 'H027-SPEC1',
      holdoutId: id,
      claimId: 'H027-C1',
      sourceSpan: makeSpan(text, c1Text),
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
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        },
        {
          type: 'CONDITION',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        },
        {
          type: 'LIMIT',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        }
      ],
      legalSourceTarget: 'STF_SUMULA_VINCULANTE_11',
      requiredEvidenceKind: 'JURISPRUDENCE'
    }
  ];

  u.criticalMaterialTokens = ['uso de algemas', 'resistência', 'fuga', 'preso ou de terceiros', 'justificada a excepcionalidade por escrito', 'nulidade', 'responsabilidade disciplinar', 'responsabilidade do Estado'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-032: CF art. 97 c/c CPC art. 949, parágrafo único
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-032';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'Somente pelo voto da maioria absoluta de seus membros ou dos membros do respectivo órgão especial poderão os tribunais declarar a inconstitucionalidade de lei ou ato normativo do Poder Público, dispensada a submissão ao plenário quando já houver pronunciamento do plenário do Supremo Tribunal Federal sobre a questão.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'poderão os tribunais declarar a inconstitucionalidade de lei ou ato normativo do Poder Público';
  const c2Text = 'Somente pelo voto da maioria absoluta de seus membros ou dos membros do respectivo órgão especial';
  const c3Text = 'dispensada a submissão ao plenário quando já houver pronunciamento do plenário do Supremo Tribunal Federal sobre a questão';

  u.atomicClaims = [
    {
      claimId: 'H032-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'Competência de tribunais para declarar inconstitucionalidade de lei ou ato normativo do Poder Público',
      claimType: 'COMPETENCE',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H032-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'Exigência de quórum de maioria absoluta dos membros do tribunal ou do respectivo órgão especial',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H032-C3',
      holdoutId: id,
      sourceSpan: makeSpan(text, c3Text),
      normalizedClaim: 'Dispensa de submissão ao plenário se já houver pronunciamento anterior do plenário do STF',
      claimType: 'EXCEPTION',
      materiality: 'MATERIAL'
    }
  ];

  const q2Text = 'maioria absoluta de seus membros ou dos membros do respectivo órgão especial';
  const q3Text = 'quando já houver pronunciamento do plenário do Supremo Tribunal Federal sobre a questão';

  u.assertionSpecs = [
    {
      assertionId: 'H032-SPEC1',
      holdoutId: id,
      claimId: 'H032-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_PERMISSION',
      normativeFunction: 'COMPETENCE',
      subject: 'tribunais judiciais',
      predicate: 'declarar inconstitucionalidade',
      object: 'lei ou ato normativo do Poder Público',
      polarity: 'POSITIVE',
      modality: 'MAY',
      qualifiers: [],
      legalSourceTarget: 'CF_ART_97',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H032-SPEC2',
      holdoutId: id,
      claimId: 'H032-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'declaração de inconstitucionalidade por tribunal',
      predicate: 'exigir voto da maioria absoluta',
      object: 'maioria absoluta de membros ou do respectivo órgão especial',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'QUANTITY',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        }
      ],
      legalSourceTarget: 'CF_ART_97',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H032-SPEC3',
      holdoutId: id,
      claimId: 'H032-C3',
      sourceSpan: makeSpan(text, c3Text),
      kind: 'RULE_PERMISSION',
      normativeFunction: 'PERMISSION',
      subject: 'órgão fracionário do tribunal',
      predicate: 'dispensar submissão ao plenário',
      object: 'arguição de inconstitucionalidade já decidida pelo plenário do STF',
      polarity: 'POSITIVE',
      modality: 'MAY',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        }
      ],
      legalSourceTarget: 'CPC_ART_949_PAR_UNICO',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['maioria absoluta', 'órgão especial', 'declarar a inconstitucionalidade', 'lei ou ato normativo', 'dispensada a submissão ao plenário', 'plenário do Supremo Tribunal Federal'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-042: CF art. 71, IX c/c Lei nº 8.443/1992, art. 45
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-042';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'Compete ao Tribunal de Contas da União assinar prazo para que o órgão ou entidade adote as providências necessárias ao exato cumprimento da lei, se verificada ilegalidade, devendo fixar prazo razoável não superior a trinta dias para que o responsável adote as providências necessárias ao exato cumprimento da lei.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'Compete ao Tribunal de Contas da União assinar prazo para que o órgão ou entidade adote as providências necessárias ao exato cumprimento da lei, se verificada ilegalidade';
  const c2Text = 'devendo fixar prazo razoável não superior a trinta dias para que o responsável adote as providências necessárias ao exato cumprimento da lei';

  u.atomicClaims = [
    {
      claimId: 'H042-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'Compete ao TCU assinar prazo para órgão adotar providências necessárias ao exato cumprimento da lei se verificada ilegalidade',
      claimType: 'COMPETENCE',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H042-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'O TCU assinará prazo razoável não superior a trinta dias para que o responsável adote as providências necessárias ao exato cumprimento da lei',
      claimType: 'TIMEFRAME_QUANTITY',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'se verificada ilegalidade';
  const q2Text = 'prazo razoável não superior a trinta dias';
  const q3Text = 'para que o responsável adote as providências necessárias ao exato cumprimento da lei';

  u.assertionSpecs = [
    {
      assertionId: 'H042-SPEC1',
      holdoutId: id,
      claimId: 'H042-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_PERMISSION',
      normativeFunction: 'COMPETENCE',
      subject: 'Tribunal de Contas da União',
      predicate: 'assinar prazo corretivo',
      object: 'órgão ou entidade pública para cumprimento da lei',
      polarity: 'POSITIVE',
      modality: 'NOT_APPLICABLE',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'CF_ART_71_IX',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H042-SPEC2',
      holdoutId: id,
      claimId: 'H042-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'Tribunal de Contas da União',
      predicate: 'fixar prazo razoável não superior a trinta dias',
      object: 'adoção de providências necessárias ao exato cumprimento da lei pelo responsável',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'QUANTITY',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        },
        {
          type: 'CONDITION',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        }
      ],
      legalSourceTarget: 'LEI_8443_1992_ART_45',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['Tribunal de Contas da União', 'assinar prazo', 'providências necessárias ao exato cumprimento da lei', 'prazo razoável não superior a trinta dias'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-043: STF SV 13
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-043';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'A nomeação de cônjuge, companheiro ou parente em linha reta, colateral ou por afinidade, até o terceiro grau, inclusive, da autoridade nomeante ou de servidor da mesma pessoa jurídica investido em cargo de direção, chefia ou assessoramento, para o exercício de cargo em comissão ou de confiança ou, ainda, de função gratificada na administração pública direta e indireta em qualquer dos poderes da União, dos Estados, do Distrito Federal e dos Municípios, compreendido o ajuste mediante designações recíprocas, viola a Constituição Federal.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'A nomeação de cônjuge, companheiro ou parente em linha reta, colateral ou por afinidade, até o terceiro grau, inclusive, da autoridade nomeante ou de servidor da mesma pessoa jurídica investido em cargo de direção, chefia ou assessoramento, para o exercício de cargo em comissão ou de confiança ou, ainda, de função gratificada na administração pública direta e indireta em qualquer dos poderes da União, dos Estados, do Distrito Federal e dos Municípios, compreendido o ajuste mediante designações recíprocas, viola a Constituição Federal.';

  u.atomicClaims = [
    {
      claimId: 'H043-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'Nomeação de cônjuge ou parente até 3º grau da autoridade ou servidor em chefia para comissão ou função gratificada, inclusive nepotismo cruzado, viola a CF',
      claimType: 'PROHIBITION',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'até o terceiro grau, inclusive';
  const q2Text = 'cargo em comissão ou de confiança ou, ainda, de função gratificada na administração pública direta e indireta';
  const q3Text = 'compreendido o ajuste mediante designações recíprocas';

  u.assertionSpecs = [
    {
      assertionId: 'H043-SPEC1',
      holdoutId: id,
      claimId: 'H043-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_PROHIBITION',
      normativeFunction: 'PROHIBITION',
      subject: 'administração pública direta e indireta',
      predicate: 'nomear para cargo em comissão, confiança ou função gratificada',
      object: 'cônjuge, companheiro ou parente até terceiro grau, inclusive ajuste mediante designações recíprocas',
      polarity: 'NEGATIVE',
      modality: 'MUST_NOT',
      qualifiers: [
        {
          type: 'LIMIT',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        },
        {
          type: 'SCOPE',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        },
        {
          type: 'CONDITION',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        }
      ],
      legalSourceTarget: 'STF_SUMULA_VINCULANTE_13',
      requiredEvidenceKind: 'JURISPRUDENCE'
    }
  ];

  u.criticalMaterialTokens = ['cônjuge, companheiro ou parente', 'até o terceiro grau', 'autoridade nomeante', 'direção, chefia ou assessoramento', 'cargo em comissão ou de confiança', 'função gratificada', 'designações recíprocas', 'viola a Constituição Federal'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-048: CC art. 50 c/c CDC art. 28, § 5º
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-048';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'Em caso de abuso da personalidade jurídica caracterizado pelo desvio de finalidade ou pela confusão patrimonial pode o juiz desconsiderá-la, ressalvada a incidência da teoria menor nas relações de consumo que autoriza a desconsideração sempre que sua personalidade for obstáculo ao ressarcimento de prejuízos causados aos consumidores.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'Em caso de abuso da personalidade jurídica caracterizado pelo desvio de finalidade ou pela confusão patrimonial pode o juiz desconsiderá-la';
  const c2Text = 'ressalvada a incidência da teoria menor nas relações de consumo que autoriza a desconsideração sempre que sua personalidade for obstáculo ao ressarcimento de prejuízos causados aos consumidores';

  u.atomicClaims = [
    {
      claimId: 'H048-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'O juiz pode desconsiderar a personalidade jurídica em caso de abuso por desvio de finalidade ou confusão patrimonial',
      claimType: 'COMPETENCE',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H048-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'Nas relações de consumo admite-se desconsideração sempre que a personalidade for obstáculo ao ressarcimento de prejuízos',
      claimType: 'EXCEPTION',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'caracterizado pelo desvio de finalidade ou pela confusão patrimonial';
  const q2Text = 'nas relações de consumo';
  const q3Text = 'sempre que sua personalidade for obstáculo ao ressarcimento de prejuízos causados aos consumidores';

  u.assertionSpecs = [
    {
      assertionId: 'H048-SPEC1',
      holdoutId: id,
      claimId: 'H048-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_PERMISSION',
      normativeFunction: 'COMPETENCE',
      subject: 'juiz competente',
      predicate: 'desconsiderar personalidade jurídica',
      object: 'sociedade empresária em abuso da personalidade por desvio ou confusão',
      polarity: 'POSITIVE',
      modality: 'MAY',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'CC_ART_50',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H048-SPEC2',
      holdoutId: id,
      claimId: 'H048-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_PERMISSION',
      normativeFunction: 'PERMISSION',
      subject: 'juiz competente',
      predicate: 'desconsiderar a pessoa jurídica nas relações de consumo',
      object: 'personalidade jurídica que constitui obstáculo ao ressarcimento',
      polarity: 'POSITIVE',
      modality: 'MAY',
      qualifiers: [
        {
          type: 'SCOPE',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        },
        {
          type: 'CONDITION',
          value: q3Text,
          sourceText: q3Text,
          sourceSpan: makeSpan(text, q3Text)
        }
      ],
      legalSourceTarget: 'CDC_ART_28_PAR_5',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['abuso da personalidade jurídica', 'desvio de finalidade', 'confusão patrimonial', 'relações de consumo', 'obstáculo ao ressarcimento'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-052: STF SV 25
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-052';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'É ilícita a prisão civil de depositário infiel, qualquer que seja a modalidade de depósito.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'É ilícita a prisão civil de depositário infiel, qualquer que seja a modalidade de depósito.';

  u.atomicClaims = [
    {
      claimId: 'H052-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'Ilicitude da prisão civil do depositário infiel em qualquer modalidade de depósito',
      claimType: 'COURT_RULING',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'qualquer que seja a modalidade de depósito';

  u.assertionSpecs = [
    {
      assertionId: 'H052-SPEC1',
      holdoutId: id,
      claimId: 'H052-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'DECLARATIVE',
      normativeFunction: 'CONSTITUTIVE_EFFECT',
      subject: 'ordem jurídica constitucional brasileira',
      predicate: 'declarar ilícita',
      object: 'prisão civil de depositário infiel',
      polarity: 'NEGATIVE',
      modality: 'DECLARES',
      qualifiers: [
        {
          type: 'SCOPE',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'STF_SV_25',
      requiredEvidenceKind: 'JURISPRUDENCE'
    }
  ];

  u.criticalMaterialTokens = ['ilícita', 'prisão civil', 'depositário infiel', 'modalidade de depósito'];
  remediatedUnitsMap.set(id, u);
}

// ----------------------------------------------------------------------------
// HOLDOUT-055: CPC art. 300, caput e § 3º
// ----------------------------------------------------------------------------
{
  const id = 'HOLDOUT-055';
  const u = JSON.parse(JSON.stringify(rawGoldenUnits.find(x => x.holdoutId === id)));
  const text = 'A tutela de urgência de natureza antecipada exige elementos que evidenciem a probabilidade do direito e o perigo de dano ou risco ao resultado útil do processo, não sendo concedida quando houver perigo de irreversibilidade dos efeitos da decisão.';
  u.originalText = text;
  u.remediationStatus = 'PRE_H1_HUMAN_DECISION_REMEDIATED';

  const c1Text = 'A tutela de urgência de natureza antecipada exige elementos que evidenciem a probabilidade do direito e o perigo de dano ou risco ao resultado útil do processo';
  const c2Text = 'não sendo concedida quando houver perigo de irreversibilidade dos efeitos da decisão';

  u.atomicClaims = [
    {
      claimId: 'H055-C1',
      holdoutId: id,
      sourceSpan: makeSpan(text, c1Text),
      normalizedClaim: 'Tutela de urgência antecipada exige probabilidade do direito e perigo de dano ou risco ao resultado útil do processo',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL'
    },
    {
      claimId: 'H055-C2',
      holdoutId: id,
      sourceSpan: makeSpan(text, c2Text),
      normalizedClaim: 'Vedada a concessão da tutela de urgência antecipada com perigo de irreversibilidade dos efeitos da decisão',
      claimType: 'EXCEPTION',
      materiality: 'MATERIAL'
    }
  ];

  const q1Text = 'perigo de dano ou risco ao resultado útil do processo';
  const q2Text = 'não sendo concedida quando houver perigo de irreversibilidade dos efeitos da decisão';

  u.assertionSpecs = [
    {
      assertionId: 'H055-SPEC1',
      holdoutId: id,
      claimId: 'H055-C1',
      sourceSpan: makeSpan(text, c1Text),
      kind: 'RULE_DUTY',
      normativeFunction: 'DUTY',
      subject: 'requerente da tutela de urgência antecipada',
      predicate: 'evidenciar requisitos legais cumulativos',
      object: 'probabilidade do direito e o perigo de dano ou o risco ao resultado útil do processo',
      polarity: 'POSITIVE',
      modality: 'MUST',
      qualifiers: [
        {
          type: 'CONDITION',
          value: q1Text,
          sourceText: q1Text,
          sourceSpan: makeSpan(text, q1Text)
        }
      ],
      legalSourceTarget: 'CPC_ART_300_CAPUT',
      requiredEvidenceKind: 'LEGISLATION'
    },
    {
      assertionId: 'H055-SPEC2',
      holdoutId: id,
      claimId: 'H055-C2',
      sourceSpan: makeSpan(text, c2Text),
      kind: 'RULE_PROHIBITION',
      normativeFunction: 'PROHIBITION',
      subject: 'juízo competente',
      predicate: 'conceder tutela de urgência antecipada',
      object: 'medida com perigo de irreversibilidade dos efeitos da decisão',
      polarity: 'NEGATIVE',
      modality: 'MUST_NOT',
      qualifiers: [
        {
          type: 'EXCEPTION',
          value: q2Text,
          sourceText: q2Text,
          sourceSpan: makeSpan(text, q2Text)
        }
      ],
      legalSourceTarget: 'CPC_ART_300_PAR_3',
      requiredEvidenceKind: 'LEGISLATION'
    }
  ];

  u.criticalMaterialTokens = ['tutela de urgência', 'probabilidade do direito', 'perigo de dano ou risco ao resultado útil do processo', 'irreversibilidade dos efeitos da decisão'];
  remediatedUnitsMap.set(id, u);
}

// ============================================================================
// 6. MONTAR O CONJUNTO COMPLETO DE 60 UNIDADES (V2.3.5-D)
// ============================================================================
let approvedUnitsMutated = 0;
const finalGoldenUnits: any[] = [];
const finalBlindInputs: any[] = [];
const remediationReportList: any[] = [];

for (const oldUnit of rawGoldenUnits) {
  const id = oldUnit.holdoutId;
  let newUnit: any;

  if (APPROVED_IDS.includes(id)) {
    // 100% IMUTÁVEL (Clone profundo sem qualquer alteração)
    newUnit = JSON.parse(JSON.stringify(oldUnit));
    // Teste de mutação
    if (JSON.stringify(newUnit) !== JSON.stringify(oldUnit)) {
      approvedUnitsMutated++;
    }
  } else if (REJECTED_IDS.includes(id)) {
    newUnit = remediatedUnitsMap.get(id);
    if (!newUnit) {
      throw new Error(`Unidade rejeitada ${id} não possui remediação construída!`);
    }

    remediationReportList.push({
      holdoutId: id,
      domain: newUnit.domain,
      difficulty: newUnit.difficulty,
      rejectionReason: REJECTED_REASONS[id],
      preOriginalText: oldUnit.originalText,
      postOriginalText: newUnit.originalText,
      claimsCountPre: oldUnit.atomicClaims.length,
      claimsCountPost: newUnit.atomicClaims.length,
      specsCountPre: oldUnit.assertionSpecs.length,
      specsCountPost: newUnit.assertionSpecs.length,
      legalSourceTargets: newUnit.assertionSpecs.map((s: any) => s.legalSourceTarget)
    });
  } else {
    // Unidade não-crítica (mantida exatamente como em V2.3.5-C)
    newUnit = JSON.parse(JSON.stringify(oldUnit));
  }

  // Validação geométrica rigorosa de spans para a unidade
  for (const c of newUnit.atomicClaims) {
    const slice = newUnit.originalText.slice(c.sourceSpan.start, c.sourceSpan.end);
    if (slice !== c.sourceSpan.text) {
      throw new Error(`FALHA_GEOMETRICA em ${id} claim ${c.claimId}: slice="${slice}" !== span="${c.sourceSpan.text}"`);
    }
  }
  for (const s of newUnit.assertionSpecs) {
    const slice = newUnit.originalText.slice(s.sourceSpan.start, s.sourceSpan.end);
    if (slice !== s.sourceSpan.text) {
      throw new Error(`FALHA_GEOMETRICA em ${id} spec ${s.assertionId}: slice="${slice}" !== span="${s.sourceSpan.text}"`);
    }
    for (const q of (s.qualifiers || [])) {
      if (q.sourceSpan) {
        const qSlice = newUnit.originalText.slice(q.sourceSpan.start, q.sourceSpan.end);
        if (qSlice !== q.sourceSpan.text) {
          throw new Error(`FALHA_GEOMETRICA_QUALIFIER em ${id} spec ${s.assertionId}: slice="${qSlice}" !== span="${q.sourceSpan.text}"`);
        }
      }
    }
  }

  finalGoldenUnits.push(newUnit);

  // Blind input (Anti-leakage rigoroso)
  finalBlindInputs.push({
    holdoutId: newUnit.holdoutId,
    domain: newUnit.domain,
    difficulty: newUnit.difficulty,
    propositionType: newUnit.propositionType,
    originalText: newUnit.originalText
  });
}

if (approvedUnitsMutated !== 0) {
  throw new Error(`REGRA_VIOLADA: APPROVED_UNITS_MUTATED = ${approvedUnitsMutated} (deve ser 0)`);
}
console.log('✓ TESTE DE IMUTABILIDADE APROVADO: APPROVED_UNITS_MUTATED = 0');

// ============================================================================
// 7. CONSTRUIR EVIDENCE MANIFEST V2.3.5-D
// ============================================================================
const finalEvidenceManifest: Record<string, any> = JSON.parse(baselineEvidence);

if (finalEvidenceManifest['HOLDOUT-023']) {
  finalEvidenceManifest['HOLDOUT-023'].officialSources[0].locator = 'CPP:art:413:caput:e:par:1';
}
if (finalEvidenceManifest['HOLDOUT-026']) {
  finalEvidenceManifest['HOLDOUT-026'].officialSources[0].locator = 'CPP:art:414:caput:e:par:unico';
}

// ============================================================================
// 8. CONSTRUIR HUMAN DECISION MANIFEST (SEÇÃO 13)
// ============================================================================
const decisionList: any[] = [];
const nowIso = new Date().toISOString();

for (const id of APPROVED_IDS) {
  decisionList.push({
    holdoutId: id,
    decision: 'APPROVED',
    reason: 'Unidade validada como tecnicamente conforme com a evidência oficial e decomposição deôntica correta.',
    decisionSource: 'USER_REVIEW',
    reviewStage: 'PRE_H1',
    timestamp: nowIso,
    reviewerQualification: null,
    barRegistration: null,
    professionalRole: null,
    independentLegalReviewer: null
  });
}

for (const id of REJECTED_IDS) {
  decisionList.push({
    holdoutId: id,
    decision: 'REJECTED',
    reason: REJECTED_REASONS[id],
    decisionSource: 'USER_REVIEW',
    reviewStage: 'PRE_H1',
    timestamp: nowIso,
    reviewerQualification: null,
    barRegistration: null,
    professionalRole: null,
    independentLegalReviewer: null
  });
}

decisionList.sort((a, b) => a.holdoutId.localeCompare(b.holdoutId));

const humanDecisionManifest = {
  manifestVersion: 'V2.3.5-D',
  phase: 'HUMAN_DECISION_CONSOLIDATION',
  reviewStage: 'PRE_H1',
  decisionSource: 'USER_REVIEW',
  totalDecisions: decisionList.length,
  approvedCount: APPROVED_IDS.length,
  rejectedCount: REJECTED_IDS.length,
  uncertainCount: 0,
  decisions: decisionList
};

// ============================================================================
// 9. ESCREVER ARTEFATOS EM tmp/assertion-decomposition-holdout-v235d/
// ============================================================================
const targetBaseDir = path.resolve('tmp/assertion-decomposition-holdout-v235d');
fs.mkdirSync(path.join(targetBaseDir, 'input'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'golden'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'evidence'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'manifest'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'audit'), { recursive: true });
fs.mkdirSync(path.join(targetBaseDir, 'extracted'), { recursive: true });

// Copiar os 27 documentos oficiais de extracted preservando integridade exata
const extractedSrc = path.join(v235cDir, 'extracted');
const extractedFiles = fs.readdirSync(extractedSrc);
for (const file of extractedFiles) {
  fs.copyFileSync(path.join(extractedSrc, file), path.join(targetBaseDir, 'extracted', file));
}

const inputContent = JSON.stringify(finalBlindInputs, null, 2);
const goldenContent = JSON.stringify(finalGoldenUnits, null, 2);
const evidenceContent = JSON.stringify(finalEvidenceManifest, null, 2);
const humanDecisionContent = JSON.stringify(humanDecisionManifest, null, 2);
const remediationReportContent = JSON.stringify({
  version: 'V2.3.5-D',
  remediationCount: remediationReportList.length,
  remediatedUnits: remediationReportList
}, null, 2);

const inputPath = path.join(targetBaseDir, 'input/holdout-60-v235d.json');
const goldenPath = path.join(targetBaseDir, 'golden/holdout-60-golden-v235d.json');
const evidencePath = path.join(targetBaseDir, 'evidence/evidence-manifest-v235d.json');
const decisionPath = path.join(targetBaseDir, 'audit/human-decision-manifest.json');
const reportPath = path.join(targetBaseDir, 'audit/remediation-report-v235d.json');

fs.writeFileSync(inputPath, inputContent, 'utf8');
fs.writeFileSync(goldenPath, goldenContent, 'utf8');
fs.writeFileSync(evidencePath, evidenceContent, 'utf8');
fs.writeFileSync(decisionPath, humanDecisionContent, 'utf8');
fs.writeFileSync(reportPath, remediationReportContent, 'utf8');

const blindInputSha256 = computeSha256(inputContent);
const goldenSha256 = computeSha256(goldenContent);
const evidenceManifestSha256 = computeSha256(evidenceContent);
const humanDecisionSha256 = computeSha256(humanDecisionContent);
const remediationReportSha256 = computeSha256(remediationReportContent);

const holdoutManifestV235D = {
  version: 'V2.3.5-D',
  phase: 'HUMAN_DECISION_CONSOLIDATION_AND_REJECTED_GOLDEN_REMEDIATION',
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
    approvedUnitsMutated: 0,
    remediatedUnitsCount: 14
  },
  hashes: {
    blindInputSha256,
    goldenSha256,
    evidenceManifestSha256,
    humanDecisionSha256,
    remediationReportSha256
  },
  holdoutFreezeV235D: true
};

const manifestPath = path.join(targetBaseDir, 'manifest/holdout-manifest-v235d.json');
fs.writeFileSync(manifestPath, JSON.stringify(holdoutManifestV235D, null, 2), 'utf8');

console.log('\n================================================================');
console.log('✓ FREEZE V2.3.5-D CONCLUÍDO COM SUCESSO');
console.log('================================================================');
console.log(`- blindInput SHA-256:       ${blindInputSha256}`);
console.log(`- golden SHA-256:           ${goldenSha256}`);
console.log(`- evidenceManifest SHA-256: ${evidenceManifestSha256}`);
console.log(`- humanDecision SHA-256:    ${humanDecisionSha256}`);
console.log(`- remediationReport SHA-256:${remediationReportSha256}`);
console.log(`- manifest SHA-256:         ${computeSha256(JSON.stringify(holdoutManifestV235D, null, 2))}`);
