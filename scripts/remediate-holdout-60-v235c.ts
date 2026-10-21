/**
 * ATHENA V2.3.5-C — HOLDOUT REMEDIATION & SANITIZATION PIPELINE
 * 
 * 100% OFFLINE / ZERO NETWORK / ZERO LLM.
 * 
 * Saneia os defeitos de V2.3.5-B:
 * 1. Substitui HOLDOUT-017 (CONTRADICTED) por nova unidade HARD oficial em Direito Penal — Parte Especial.
 * 2. Atualiza HOLDOUT-012 para o art. 121-A, § 2º, I do CP (Lei nº 14.994/2024).
 * 3. Corrige e substitui unidades do STJ indisponíveis (WAF 403) e STF SPA por Súmulas Vinculantes do STF ou diplomas federais 100% comprovados.
 * 4. Saneia anomalia deôntica em HOLDOUT-052 (DECLARES + NEGATIVE + CONSTITUTIVE_EFFECT).
 * 5. Corrige rotas do STF (IDs 1195, 1199, 1216, 1220, 1227, 1230, 1245, 1255, 1265, 1268, 1271, 1274).
 * 6. Preserva 100% das cotas estruturais (60 units, 40 STANDARD / 20 HARD, 7 domínios, cotas substantivas).
 * 7. Gera blind input, golden, evidence manifest, manifest, unit-replacements.json e golden-corrections.json.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function runRemediationV235C() {
  const v235aGoldenPath = path.resolve('tmp/assertion-decomposition-holdout/golden/holdout-60-golden.json');
  const v235cDir = path.resolve('tmp/assertion-decomposition-holdout-v235c');
  const extractedDir = path.join(v235cDir, 'extracted');
  const manifestDir = path.join(v235cDir, 'manifest');
  const auditDir = path.join(v235cDir, 'audit');
  const goldenDir = path.join(v235cDir, 'golden');
  const inputDir = path.join(v235cDir, 'input');
  const evidenceDir = path.join(v235cDir, 'evidence');

  [auditDir, goldenDir, inputDir, evidenceDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

  const baseUnits: any[] = JSON.parse(fs.readFileSync(v235aGoldenPath, 'utf8'));
  const extractionManifest = JSON.parse(fs.readFileSync(path.join(extractedDir, 'extraction-manifest.json'), 'utf8'));

  // Map of extracted texts for evidence locator extraction
  const extractedMap: Record<string, string> = {};
  for (const doc of extractionManifest.documents) {
    const txt = fs.readFileSync(path.join(extractedDir, `${doc.documentId}.txt`), 'utf8');
    extractedMap[doc.documentId] = txt;
  }

  const replacements: any[] = [];
  const corrections: any[] = [];

  const remediatedUnits: any[] = [];

  for (const u of baseUnits) {
    const id = u.holdoutId;

    if (id === 'HOLDOUT-007') {
      // Original STJ JT 133 (WAF 403) -> STF Súmula Vinculante 26 c/c Lei 8.072/1990
      const newText = "Para efeito de progressão de regime no cumprimento de pena por crime hediondo ou equiparado, o juízo da execução observará a inconstitucionalidade do art. 2º da Lei nº 8.072/1990, podendo determinar, de modo fundamentado, a realização de exame criminológico.";
      const unit = {
        holdoutId: 'HOLDOUT-007',
        domain: 'Direito Penal — Parte Geral',
        difficulty: 'HARD',
        propositionType: 'COURT_RULING',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'STRUCTURED',
          canonicalTargetEvaluability: 'EXPLICIT_IN_TEXT',
          reasonCode: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT',
          availableComponents: { precedentType: 'SV', precedentNumber: '26', diploma: 'LEI_8072', article: '2' },
          availableLocators: [
            { precedentType: 'SV', precedentNumber: '26', sourceSpan: { text: "crime hediondo ou equiparado", start: 67, end: 97 }, canonicalId: 'STF_SV_26' }
          ],
          precedentIdentityEvaluability: true,
          precedentHoldingEvaluability: true
        },
        atomicClaims: [
          {
            claimId: 'H007-C1',
            holdoutId: 'HOLDOUT-007',
            sourceSpan: { start: 0, end: 178, text: "Para efeito de progressão de regime no cumprimento de pena por crime hediondo ou equiparado, o juízo da execução observará a inconstitucionalidade do art. 2º da Lei nº 8.072/1990" },
            normalizedClaim: "Dever do juízo da execução de afastar o regime integralmente fechado da Lei dos Crimes Hediondos",
            claimType: 'COURT_RULING',
            materiality: 'MATERIAL'
          },
          {
            claimId: 'H007-C2',
            holdoutId: 'HOLDOUT-007',
            sourceSpan: { start: 180, end: 257, text: "podendo determinar, de modo fundamentado, a realização de exame criminológico" },
            normalizedClaim: "Faculdade motivada do juízo da execução de determinar exame criminológico para progressão",
            claimType: 'COURT_RULING',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H007-SPEC1',
            holdoutId: 'HOLDOUT-007',
            claimId: 'H007-C1',
            sourceSpan: { start: 0, end: 178, text: "Para efeito de progressão de regime no cumprimento de pena por crime hediondo ou equiparado, o juízo da execução observará a inconstitucionalidade do art. 2º da Lei nº 8.072/1990" },
            kind: 'COURT_RULING',
            normativeFunction: 'DUTY',
            subject: 'juízo da execução penal',
            predicate: 'observar inconstitucionalidade',
            object: 'vedação legal à progressão de regime',
            polarity: 'POSITIVE',
            modality: 'MUST',
            legalSourceTarget: 'STF_SV_26',
            requiredEvidenceKind: 'JUDICIAL_DECISION'
          },
          {
            assertionId: 'H007-SPEC2',
            holdoutId: 'HOLDOUT-007',
            claimId: 'H007-C2',
            sourceSpan: { start: 180, end: 257, text: "podendo determinar, de modo fundamentado, a realização de exame criminológico" },
            kind: 'COURT_RULING',
            normativeFunction: 'PERMISSION',
            subject: 'juízo da execução penal',
            predicate: 'determinar exame criminológico fundamentadamente',
            object: 'aferição de requisitos para benefício',
            polarity: 'POSITIVE',
            modality: 'MAY',
            legalSourceTarget: 'STF_SV_26',
            requiredEvidenceKind: 'JUDICIAL_DECISION'
          }
        ],
        criticalMaterialTokens: ["progressão de regime", "crime hediondo", "juízo da execução", "exame criminológico"],
        materialTokens: ["progressão", "regime", "hediondo", "execução", "inconstitucionalidade", "exame", "criminológico"],
        criticalQualifiers: [],
        officialSources: [
          {
            authority: 'STF',
            sourceType: 'JURISPRUDÊNCIA',
            citation: 'STF, Súmula Vinculante 26',
            officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1271',
            rawTextExcerpt: "Súmula Vinculante 26: Para efeito de progressão de regime no cumprimento de pena por crime hediondo, ou equiparado, o juízo da execução observará a inconstitucionalidade do art. 2º da Lei 8.072/1990, sem prejuízo de avaliar se o condenado preenche, ou não, os requisitos objetivos e subjetivos do benefício, podendo determinar, para tal fim, de modo fundamentado, a realização de exame criminológico.",
            locator: 'STF:SV:26'
          },
          {
            authority: 'LEGISLACAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: 'Lei nº 8.072/1990, art. 2º',
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8072.htm',
            rawTextExcerpt: "Art. 2º Os crimes hediondos, a prática da tortura, o tráfico ilícito de entorpecentes e drogas afins e o terrorismo são insuscetíveis de: I - anistia, graça e indulto; II - fiança.",
            locator: 'LEI_8072:art:2'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-007',
        newHoldoutId: 'HOLDOUT-007',
        oldDomain: 'Direito Penal — Parte Geral',
        newDomain: 'Direito Penal — Parte Geral',
        oldDifficulty: 'HARD',
        newDifficulty: 'HARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'COURT_RULING',
        reason: 'OFFICIAL_SOURCE_UNAVAILABLE: STJ JT 133 bloqueado por WAF (HTTP 403). Substituído por STF Súmula Vinculante 26 com evidência oficial 100% recuperável e comprovada.',
        evidenceIds: ['STF-SV26', 'PLN-L8072'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-010') {
      // Original STJ Súmula 241 (WAF 403) -> CP art. 44, I e II
      const newText = "As penas privativas de liberdade não superiores a quatro anos podem ser substituídas por penas restritivas de direitos se o crime não for cometido com violência ou grave ameaça à pessoa e o réu não for reincidente em crime doloso.";
      const unit = {
        holdoutId: 'HOLDOUT-010',
        domain: 'Direito Penal — Parte Geral',
        difficulty: 'STANDARD',
        propositionType: 'TIMEFRAME_QUANTITY',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'NONE',
          canonicalTargetEvaluability: 'NOT_EVALUABLE_FROM_INPUT',
          reasonCode: 'NO_REFERENCE_IN_INPUT',
          availableComponents: {},
          precedentIdentityEvaluability: false,
          precedentHoldingEvaluability: false
        },
        atomicClaims: [
          {
            claimId: 'H010-C1',
            holdoutId: 'HOLDOUT-010',
            sourceSpan: { start: 0, end: 118, text: "As penas privativas de liberdade não superiores a quatro anos podem ser substituídas por penas restritivas de direitos" },
            normalizedClaim: "Possibilidade de substituição de pena privativa até quatro anos por restritivas de direitos",
            claimType: 'TIMEFRAME_QUANTITY',
            materiality: 'MATERIAL'
          },
          {
            claimId: 'H010-C2',
            holdoutId: 'HOLDOUT-010',
            sourceSpan: { start: 122, end: 229, text: "o crime não for cometido com violência ou grave ameaça à pessoa e o réu não for reincidente em crime doloso" },
            normalizedClaim: "Condições negativas de ausência de violência e não reincidência dolosa para conversão",
            claimType: 'DIRECT_NORMATIVE_ASSERTION',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H010-SPEC1',
            holdoutId: 'HOLDOUT-010',
            claimId: 'H010-C1',
            sourceSpan: { start: 0, end: 118, text: "As penas privativas de liberdade não superiores a quatro anos podem ser substituídas por penas restritivas de direitos" },
            kind: 'RULE_PERMISSION',
            normativeFunction: 'PERMISSION',
            subject: 'juízo sentenciante',
            predicate: 'substituir pena privativa por restritiva de direitos',
            object: 'condenação não superior a quatro anos',
            polarity: 'POSITIVE',
            modality: 'MAY',
            qualifiers: [{ type: 'QUANTITY', value: 'não superior a quatro anos', sourceText: 'não superiores a quatro anos', sourceSpan: { start: 33, end: 61, text: "não superiores a quatro anos" } }],
            legalSourceTarget: 'CP_ART_44_I',
            requiredEvidenceKind: 'LEGISLATION'
          }
        ],
        criticalMaterialTokens: ["penas privativas de liberdade", "não superiores a quatro anos", "penas restritivas de direitos", "não for cometido com violência"],
        materialTokens: ["privativas", "liberdade", "quatro", "anos", "restritivas", "direitos", "violência", "reincidente"],
        criticalQualifiers: [{ type: 'QUANTITY', value: 'não superior a quatro anos', sourceText: 'não superiores a quatro anos', sourceSpan: { start: 33, end: 61, text: "não superiores a quatro anos" } }],
        officialSources: [
          {
            authority: 'LEGISLACAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: 'Código Penal, art. 44, I e II',
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
            rawTextExcerpt: "Art. 44. As penas restritivas de direitos são autônomas e substituem as privativas de liberdade, quando: I – aplicada pena privativa de liberdade não superior a quatro anos e o crime não for cometido com violência ou grave ameaça à pessoa; II – o réu não for reincidente em crime doloso.",
            locator: 'CP:art:44:inciso:I'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-010',
        newHoldoutId: 'HOLDOUT-010',
        oldDomain: 'Direito Penal — Parte Geral',
        newDomain: 'Direito Penal — Parte Geral',
        oldDifficulty: 'STANDARD',
        newDifficulty: 'STANDARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'TIMEFRAME_QUANTITY',
        reason: 'OFFICIAL_SOURCE_UNAVAILABLE: STJ Súmula 241 bloqueada por WAF (HTTP 403). Substituído por CP art. 44 com prova legislativa integral.',
        evidenceIds: ['PLN-CP'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-012') {
      // Feminicídio: Lei 14.994/2024 revogou art. 121 §7 e criou Art. 121-A §2 I
      const newCitation = "Código Penal, art. 121-A, § 2º, I (redação dada pela Lei nº 14.994/2024)";
      const unit = {
        ...u,
        resolvabilityAssessment: {
          ...u.resolvabilityAssessment,
          availableComponents: { diploma: 'CP', article: '121-A', paragraph: '2', inciso: 'I' }
        },
        assertionSpecs: u.assertionSpecs.map((s: any) => ({
          ...s,
          legalSourceTarget: 'CP_ART_121A_PAR_2_I'
        })),
        officialSources: [
          {
            authority: 'LEGISLACAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: newCitation,
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
            rawTextExcerpt: "Art. 121-A. Matar mulher por razões da condição do sexo feminino: ... § 2º A pena do feminicídio é aumentada de 1/3 (um terço) até a metade se o crime é praticado: I – durante a gestação, nos 3 (três) meses posteriores ao parto ou se a vítima é a mãe ou a responsável por criança, adolescente ou pessoa com deficiência de qualquer idade;",
            locator: 'CP:art:121A:par:2:I'
          }
        ],
        remediationStatus: 'VERIFIED_AFTER_PRE_H1_CORRECTION'
      };
      corrections.push({
        holdoutId: 'HOLDOUT-012',
        field: 'officialSources / legalSourceTarget',
        oldValue: 'Código Penal, art. 121, § 7º, I (CP_ART_121_PAR_7_I)',
        newValue: newCitation + ' (CP_ART_121A_PAR_2_I)',
        reasonCode: 'SUPERSEDED_LEGISLATION',
        evidenceId: 'PLN-CP',
        materialLocator: 'CP:art:121A:par:2:I',
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-016') {
      // Original STJ Súmula 17 (WAF 403) -> CP art. 317, § 1º (Corrupção passiva qualificada)
      const newText = "A pena do crime de corrupção passiva é aumentada de um terço se, em consequência da vantagem ou promessa, o funcionário retarda ou deixa de praticar qualquer ato de ofício ou o pratica infringindo dever funcional.";
      const unit = {
        holdoutId: 'HOLDOUT-016',
        domain: 'Direito Penal — Parte Especial',
        difficulty: 'HARD',
        propositionType: 'TIMEFRAME_QUANTITY',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'NONE',
          canonicalTargetEvaluability: 'NOT_EVALUABLE_FROM_INPUT',
          reasonCode: 'NO_REFERENCE_IN_INPUT',
          availableComponents: {},
          precedentIdentityEvaluability: false,
          precedentHoldingEvaluability: false
        },
        atomicClaims: [
          {
            claimId: 'H016-C1',
            holdoutId: 'HOLDOUT-016',
            sourceSpan: { start: 0, end: 60, text: "A pena do crime de corrupção passiva é aumentada de um terço" },
            normalizedClaim: "Causa de aumento de um terço da pena no crime de corrupção passiva",
            claimType: 'TIMEFRAME_QUANTITY',
            materiality: 'MATERIAL'
          },
          {
            claimId: 'H016-C2',
            holdoutId: 'HOLDOUT-016',
            sourceSpan: { start: 65, end: 212, text: "em consequência da vantagem ou promessa, o funcionário retarda ou deixa de praticar qualquer ato de ofício ou o pratica infringindo dever funcional" },
            normalizedClaim: "Condição funcional de retardamento, omissão ou prática infringindo dever em razão de vantagem",
            claimType: 'DIRECT_NORMATIVE_ASSERTION',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H016-SPEC1',
            holdoutId: 'HOLDOUT-016',
            claimId: 'H016-C1',
            sourceSpan: { start: 0, end: 213, text: newText },
            kind: 'RULE_OBLIGATION',
            normativeFunction: 'DUTY',
            subject: 'juízo sentenciante',
            predicate: 'aumentar a pena em um terço',
            object: 'corrupção passiva qualificada pelo resultado funcional',
            polarity: 'POSITIVE',
            modality: 'MUST',
            qualifiers: [{ type: 'QUANTITY', value: 'aumento de um terço', sourceText: 'aumentada de um terço', sourceSpan: { start: 39, end: 60, text: "aumentada de um terço" } }],
            legalSourceTarget: 'CP_ART_317_PAR_1',
            requiredEvidenceKind: 'LEGISLATION'
          }
        ],
        criticalMaterialTokens: ["corrupção passiva", "aumentada de um terço", "vantagem ou promessa", "infringindo dever funcional"],
        materialTokens: ["corrupção", "passiva", "aumentada", "terço", "vantagem", "promessa", "ato", "ofício", "dever", "funcional"],
        criticalQualifiers: [{ type: 'QUANTITY', value: 'aumento de um terço', sourceText: 'aumentada de um terço', sourceSpan: { start: 39, end: 60, text: "aumentada de um terço" } }],
        officialSources: [
          {
            authority: 'LEGISLACAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: 'Código Penal, art. 317, § 1º',
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
            rawTextExcerpt: "Art. 317 ... § 1º - A pena é aumentada de um terço, se, em conseqüência da vantagem ou promessa, o funcionário retarda ou deixa de praticar qualquer ato de ofício ou o pratica infringindo dever funcional.",
            locator: 'CP:art:317:par:1'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-016',
        newHoldoutId: 'HOLDOUT-016',
        oldDomain: 'Direito Penal — Parte Especial',
        newDomain: 'Direito Penal — Parte Especial',
        oldDifficulty: 'HARD',
        newDifficulty: 'HARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'TIMEFRAME_QUANTITY',
        reason: 'OFFICIAL_SOURCE_UNAVAILABLE: STJ Súmula 17 bloqueada por WAF (HTTP 403). Substituído por CP art. 317, § 1º com prova legislativa integral.',
        evidenceIds: ['PLN-CP'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-017') {
      // Original STF Tema 1087 (CONTRADICTED: fake RE, holding error) -> CP art. 171, § 2º-A e § 2º-B
      const newText = "A pena do estelionato é de reclusão de quatro a oito anos e multa se a fraude é cometida mediante informações fornecidas pela vítima induzida a erro por redes sociais ou contatos telefônicos, aumentando-se de um terço a dois terços se praticada mediante servidor mantido fora do território nacional.";
      const unit = {
        holdoutId: 'HOLDOUT-017',
        domain: 'Direito Penal — Parte Especial',
        difficulty: 'HARD',
        propositionType: 'TIMEFRAME_QUANTITY',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'NONE',
          canonicalTargetEvaluability: 'NOT_EVALUABLE_FROM_INPUT',
          reasonCode: 'NO_REFERENCE_IN_INPUT',
          availableComponents: {},
          precedentIdentityEvaluability: false,
          precedentHoldingEvaluability: false
        },
        atomicClaims: [
          {
            claimId: 'H017-C1',
            holdoutId: 'HOLDOUT-017',
            sourceSpan: { start: 0, end: 190, text: "A pena do estelionato é de reclusão de quatro a oito anos e multa se a fraude é cometida mediante informações fornecidas pela vítima induzida a erro por redes sociais ou contatos telefônicos" },
            normalizedClaim: "Tipificação da fraude eletrônica no estelionato com pena de reclusão de 4 a 8 anos e multa",
            claimType: 'TIMEFRAME_QUANTITY',
            materiality: 'MATERIAL'
          },
          {
            claimId: 'H017-C2',
            holdoutId: 'HOLDOUT-017',
            sourceSpan: { start: 192, end: 298, text: "aumentando-se de um terço a dois terços se praticada mediante servidor mantido fora do território nacional" },
            normalizedClaim: "Causa de aumento de 1/3 a 2/3 para fraude eletrônica com servidor no exterior",
            claimType: 'TIMEFRAME_QUANTITY',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H017-SPEC1',
            holdoutId: 'HOLDOUT-017',
            claimId: 'H017-C1',
            sourceSpan: { start: 0, end: 190, text: "A pena do estelionato é de reclusão de quatro a oito anos e multa se a fraude é cometida mediante informações fornecidas pela vítima induzida a erro por redes sociais ou contatos telefônicos" },
            kind: 'RULE_OBLIGATION',
            normativeFunction: 'DUTY',
            subject: 'ordem jurídica penal',
            predicate: 'cominar pena de reclusão',
            object: 'fraude eletrônica',
            polarity: 'POSITIVE',
            modality: 'MUST',
            qualifiers: [{ type: 'QUANTITY', value: 'quatro a oito anos', sourceText: 'quatro a oito anos', sourceSpan: { start: 39, end: 57, text: "quatro a oito anos" } }],
            legalSourceTarget: 'CP_ART_171_PAR_2A',
            requiredEvidenceKind: 'LEGISLATION'
          },
          {
            assertionId: 'H017-SPEC2',
            holdoutId: 'HOLDOUT-017',
            claimId: 'H017-C2',
            sourceSpan: { start: 192, end: 298, text: "aumentando-se de um terço a dois terços se praticada mediante servidor mantido fora do território nacional" },
            kind: 'RULE_OBLIGATION',
            normativeFunction: 'DUTY',
            subject: 'juízo sentenciante',
            predicate: 'aumentar a pena',
            object: 'servidor mantido no exterior',
            polarity: 'POSITIVE',
            modality: 'MUST',
            qualifiers: [{ type: 'QUANTITY', value: 'um terço a dois terços', sourceText: 'um terço a dois terços', sourceSpan: { start: 209, end: 231, text: "um terço a dois terços" } }],
            legalSourceTarget: 'CP_ART_171_PAR_2B',
            requiredEvidenceKind: 'LEGISLATION'
          }
        ],
        criticalMaterialTokens: ["estelionato", "quatro a oito anos", "fraude", "redes sociais", "servidor mantido fora do território nacional"],
        materialTokens: ["estelionato", "reclusão", "quatro", "oito", "anos", "fraude", "redes", "sociais", "servidor", "exterior"],
        criticalQualifiers: [
          { type: 'QUANTITY', value: 'quatro a oito anos', sourceText: 'quatro a oito anos', sourceSpan: { start: 39, end: 57, text: "quatro a oito anos" } },
          { type: 'QUANTITY', value: 'um terço a dois terços', sourceText: 'um terço a dois terços', sourceSpan: { start: 209, end: 231, text: "um terço a dois terços" } }
        ],
        officialSources: [
          {
            authority: 'LEGISLACAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: 'Código Penal, art. 171, § 2º-A e § 2º-B',
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
            rawTextExcerpt: "Art. 171 ... § 2º-A. A pena é de reclusão, de 4 (quatro) a 8 (oito) anos, e multa, se a fraude é cometida com a utilização de informações fornecidas pela vítima ou por terceiro induzido a erro por meio de redes sociais, contatos telefônicos ou envio de correio eletrônico fraudulento, ou por qualquer outro meio fraudulento análogo. § 2º-B. A pena prevista no § 2º-A deste artigo, considerada a relevância do resultado gravoso: I – aumenta-se de 1/3 (um terço) a 2/3 (dois terços), se o crime é praticado mediante a utilização de servidor mantido fora do território nacional;",
            locator: 'CP:art:171:par:2A'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-017',
        newHoldoutId: 'HOLDOUT-017',
        oldDomain: 'Direito Penal — Parte Especial',
        newDomain: 'Direito Penal — Parte Especial',
        oldDifficulty: 'HARD',
        newDifficulty: 'HARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'TIMEFRAME_QUANTITY',
        reason: 'CONTRADICTED: Tema 1087 STF continha leading case fictício (RE 1.234.567) e atribuição falsa de limite de 1.000 maços do STJ ao STF. Substituído por CP art. 171, § 2º-A e § 2º-B com prova legislativa integral.',
        evidenceIds: ['PLN-CP'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-030') {
      // Original STF Súmula 708 -> STF Súmula Vinculante 14
      const newText = "É direito do defensor, no interesse do representado, ter acesso amplo aos elementos de prova que, já documentados em procedimento investigatório realizado por órgão com competência de polícia judiciária, digam respeito ao exercício do direito de defesa.";
      const unit = {
        holdoutId: 'HOLDOUT-030',
        domain: 'Processo Penal',
        difficulty: 'STANDARD',
        propositionType: 'COURT_RULING',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'STRUCTURED',
          canonicalTargetEvaluability: 'EXPLICIT_IN_TEXT',
          reasonCode: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT',
          availableComponents: { precedentType: 'SV', precedentNumber: '14' },
          availableLocators: [{ precedentType: 'SV', precedentNumber: '14', sourceSpan: { text: "direito do defensor", start: 2, end: 21 }, canonicalId: 'STF_SV_14' }],
          precedentIdentityEvaluability: true,
          precedentHoldingEvaluability: true
        },
        atomicClaims: [
          {
            claimId: 'H030-C1',
            holdoutId: 'HOLDOUT-030',
            sourceSpan: { start: 0, end: 254, text: newText },
            normalizedClaim: "Direito do defensor de acesso amplo às provas documentadas no procedimento investigatório",
            claimType: 'COURT_RULING',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H030-SPEC1',
            holdoutId: 'HOLDOUT-030',
            claimId: 'H030-C1',
            sourceSpan: { start: 0, end: 254, text: newText },
            kind: 'COURT_RULING',
            normativeFunction: 'PERMISSION',
            subject: 'defensor do investigado',
            predicate: 'ter acesso amplo',
            object: 'elementos de prova documentados em procedimento investigatório',
            polarity: 'POSITIVE',
            modality: 'MAY',
            legalSourceTarget: 'STF_SV_14',
            requiredEvidenceKind: 'JUDICIAL_DECISION'
          }
        ],
        criticalMaterialTokens: ["direito do defensor", "acesso amplo", "elementos de prova", "procedimento investigatório"],
        materialTokens: ["defensor", "acesso", "amplo", "prova", "investigatório", "polícia", "judiciária", "defesa"],
        criticalQualifiers: [],
        officialSources: [
          {
            authority: 'STF',
            sourceType: 'JURISPRUDÊNCIA',
            citation: 'STF, Súmula Vinculante 14',
            officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1230',
            rawTextExcerpt: "Súmula Vinculante 14: É direito do defensor, no interesse do representado, ter acesso amplo aos elementos de prova que, já documentados em procedimento investigatório realizado por órgão com competência de polícia judiciária, digam respeito ao exercício do direito de defesa.",
            locator: 'STF:SV:14'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-030',
        newHoldoutId: 'HOLDOUT-030',
        oldDomain: 'Processo Penal',
        newDomain: 'Processo Penal',
        oldDifficulty: 'STANDARD',
        newDifficulty: 'STANDARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'COURT_RULING',
        reason: 'ROUTING_MISMATCH: Súmula 708 STF com rota divergente no portal. Substituído por Súmula Vinculante 14 com evidência oficial 100% recuperável e comprovada.',
        evidenceIds: ['STF-SV14'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-037') {
      // Original STF Tema 280 (SPA) -> STF Súmula Vinculante 18 c/c CF art. 14, § 7º
      const newText = "A dissolução da sociedade conjugal ou do vínculo conjugal, no curso do mandato do cônjuge, não afasta a inelegibilidade reflexa prevista na Constituição Federal para o território de jurisdição do titular.";
      const unit = {
        holdoutId: 'HOLDOUT-037',
        domain: 'Direito Constitucional',
        difficulty: 'HARD',
        propositionType: 'COURT_RULING',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'STRUCTURED',
          canonicalTargetEvaluability: 'EXPLICIT_IN_TEXT',
          reasonCode: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT',
          availableComponents: { precedentType: 'SV', precedentNumber: '18', diploma: 'CF', article: '14', paragraph: '7' },
          availableLocators: [
            { precedentType: 'SV', precedentNumber: '18', sourceSpan: { text: "inelegibilidade reflexa prevista na Constituição Federal", start: 104, end: 161 }, canonicalId: 'STF_SV_18' }
          ],
          precedentIdentityEvaluability: true,
          precedentHoldingEvaluability: true
        },
        atomicClaims: [
          {
            claimId: 'H037-C1',
            holdoutId: 'HOLDOUT-037',
            sourceSpan: { start: 0, end: 209, text: newText },
            normalizedClaim: "Inafastabilidade da inelegibilidade reflexa pela dissolução do vínculo conjugal no curso do mandato",
            claimType: 'COURT_RULING',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H037-SPEC1',
            holdoutId: 'HOLDOUT-037',
            claimId: 'H037-C1',
            sourceSpan: { start: 0, end: 209, text: newText },
            kind: 'COURT_RULING',
            normativeFunction: 'CONSTITUTIVE_EFFECT',
            subject: 'dissolução da sociedade ou vínculo conjugal',
            predicate: 'afastar',
            object: 'inelegibilidade reflexa constitucional',
            polarity: 'NEGATIVE',
            modality: 'DECLARES',
            legalSourceTarget: 'STF_SV_18',
            requiredEvidenceKind: 'JUDICIAL_DECISION'
          }
        ],
        criticalMaterialTokens: ["dissolução da sociedade conjugal", "no curso do mandato", "não afasta a inelegibilidade reflexa"],
        materialTokens: ["dissolução", "sociedade", "conjugal", "mandato", "inelegibilidade", "reflexa", "jurisdição"],
        criticalQualifiers: [],
        officialSources: [
          {
            authority: 'STF',
            sourceType: 'JURISPRUDÊNCIA',
            citation: 'STF, Súmula Vinculante 18',
            officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1245',
            rawTextExcerpt: "Súmula Vinculante 18: A dissolução da sociedade ou do vínculo conjugal, no curso do mandato, não afasta a inelegibilidade prevista no § 7º do artigo 14 da Constituição Federal.",
            locator: 'STF:SV:18'
          },
          {
            authority: 'CONSTITUICAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: 'Constituição Federal de 1988, art. 14, § 7º',
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
            rawTextExcerpt: "Art. 14 ... § 7º São inelegíveis, no território de jurisdição do titular, o cônjuge e os parentes consangüíneos ou afins, até o segundo grau ou por adoção, do Presidente da República, de Governador de Estado ou Território, do Distrito Federal, de Prefeito ou de quem os haja substituído dentro dos seis meses anteriores ao pleito, salvo se já titular de mandato eletivo e candidato à reeleição.",
            locator: 'CF:art:14:par:7'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-037',
        newHoldoutId: 'HOLDOUT-037',
        oldDomain: 'Direito Constitucional',
        newDomain: 'Direito Constitucional',
        oldDifficulty: 'HARD',
        newDifficulty: 'HARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'COURT_RULING',
        reason: 'OFFICIAL_SOURCE_UNAVAILABLE: Tema 280 STF em SPA dinâmica. Substituído por Súmula Vinculante 18 com evidência oficial 100% recuperável e comprovada.',
        evidenceIds: ['STF-SV18', 'PLN-CF'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-044') {
      // Original STF Súmula 473 -> STF Súmula Vinculante 5
      const newText = "A falta de defesa técnica por advogado no processo administrativo disciplinar não ofende a Constituição Federal.";
      const unit = {
        holdoutId: 'HOLDOUT-044',
        domain: 'Direito Administrativo',
        difficulty: 'STANDARD',
        propositionType: 'COURT_RULING',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'STRUCTURED',
          canonicalTargetEvaluability: 'EXPLICIT_IN_TEXT',
          reasonCode: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT',
          availableComponents: { precedentType: 'SV', precedentNumber: '5' },
          availableLocators: [{ precedentType: 'SV', precedentNumber: '5', sourceSpan: { text: "processo administrativo disciplinar", start: 42, end: 77 }, canonicalId: 'STF_SV_5' }],
          precedentIdentityEvaluability: true,
          precedentHoldingEvaluability: true
        },
        atomicClaims: [
          {
            claimId: 'H044-C1',
            holdoutId: 'HOLDOUT-044',
            sourceSpan: { start: 0, end: 113, text: newText },
            normalizedClaim: "Inexistência de ofensa à CF pela ausência de advogado no PAD",
            claimType: 'COURT_RULING',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H044-SPEC1',
            holdoutId: 'HOLDOUT-044',
            claimId: 'H044-C1',
            sourceSpan: { start: 0, end: 113, text: newText },
            kind: 'COURT_RULING',
            normativeFunction: 'DECLARATION',
            subject: 'falta de defesa técnica por advogado no PAD',
            predicate: 'ofender',
            object: 'Constituição Federal',
            polarity: 'NEGATIVE',
            modality: 'DECLARES',
            legalSourceTarget: 'STF_SV_5',
            requiredEvidenceKind: 'JUDICIAL_DECISION'
          }
        ],
        criticalMaterialTokens: ["falta de defesa técnica", "advogado", "processo administrativo disciplinar", "não ofende a Constituição"],
        materialTokens: ["defesa", "técnica", "advogado", "processo", "administrativo", "disciplinar", "Constituição"],
        criticalQualifiers: [],
        officialSources: [
          {
            authority: 'STF',
            sourceType: 'JURISPRUDÊNCIA',
            citation: 'STF, Súmula Vinculante 5',
            officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1199',
            rawTextExcerpt: "Súmula Vinculante 5: A falta de defesa técnica por advogado no processo administrativo disciplinar não ofende a Constituição.",
            locator: 'STF:SV:5'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-044',
        newHoldoutId: 'HOLDOUT-044',
        oldDomain: 'Direito Administrativo',
        newDomain: 'Direito Administrativo',
        oldDifficulty: 'STANDARD',
        newDifficulty: 'STANDARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'COURT_RULING',
        reason: 'ROUTING_MISMATCH: Súmula 473 com rota divergente no portal. Substituído por Súmula Vinculante 5 com evidência oficial 100% recuperável e comprovada.',
        evidenceIds: ['STF-SV5'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-045') {
      // Original STF Tema 897 (SPA) -> STF Súmula Vinculante 21 c/c CF art. 5º, LV
      const newText = "É inconstitucional a exigência de depósito ou arrolamento prévios de dinheiro ou bens para admissibilidade de recurso administrativo perante a administração pública.";
      const unit = {
        holdoutId: 'HOLDOUT-045',
        domain: 'Direito Administrativo',
        difficulty: 'HARD',
        propositionType: 'COURT_RULING',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'STRUCTURED',
          canonicalTargetEvaluability: 'EXPLICIT_IN_TEXT',
          reasonCode: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT',
          availableComponents: { precedentType: 'SV', precedentNumber: '21', diploma: 'CF', article: '5', inciso: 'LV' },
          availableLocators: [
            { precedentType: 'SV', precedentNumber: '21', sourceSpan: { text: "recurso administrativo perante a administração pública", start: 111, end: 165 }, canonicalId: 'STF_SV_21' }
          ],
          precedentIdentityEvaluability: true,
          precedentHoldingEvaluability: true
        },
        atomicClaims: [
          {
            claimId: 'H045-C1',
            holdoutId: 'HOLDOUT-045',
            sourceSpan: { start: 0, end: 166, text: newText },
            normalizedClaim: "Inconstitucionalidade de depósito prévio de bens para admissibilidade de recurso administrativo",
            claimType: 'COURT_RULING',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H045-SPEC1',
            holdoutId: 'HOLDOUT-045',
            claimId: 'H045-C1',
            sourceSpan: { start: 0, end: 166, text: newText },
            kind: 'COURT_RULING',
            normativeFunction: 'PROHIBITION',
            subject: 'administração pública',
            predicate: 'exigir depósito ou arrolamento prévios',
            object: 'admissibilidade de recurso administrativo',
            polarity: 'NEGATIVE',
            modality: 'MUST_NOT',
            legalSourceTarget: 'STF_SV_21',
            requiredEvidenceKind: 'JUDICIAL_DECISION'
          }
        ],
        criticalMaterialTokens: ["inconstitucional", "depósito ou arrolamento prévios", "recurso administrativo", "admissibilidade"],
        materialTokens: ["inconstitucional", "depósito", "arrolamento", "prévios", "recurso", "administrativo", "admissibilidade"],
        criticalQualifiers: [],
        officialSources: [
          {
            authority: 'STF',
            sourceType: 'JURISPRUDÊNCIA',
            citation: 'STF, Súmula Vinculante 21',
            officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1255',
            rawTextExcerpt: "Súmula Vinculante 21: É inconstitucional a exigência de depósito ou arrolamento prévios de dinheiro ou bens para admissibilidade de recurso administrativo.",
            locator: 'STF:SV:21'
          },
          {
            authority: 'CONSTITUICAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: 'Constituição Federal de 1988, art. 5º, LV',
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
            rawTextExcerpt: "Art. 5º ... LV - aos litigantes, em processo judicial ou administrativo, e aos acusados em geral são assegurados o contraditório e ampla defesa, com os meios e recursos a ela inerentes;",
            locator: 'CF:art:5:inciso:LV'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-045',
        newHoldoutId: 'HOLDOUT-045',
        oldDomain: 'Direito Administrativo',
        newDomain: 'Direito Administrativo',
        oldDifficulty: 'HARD',
        newDifficulty: 'HARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'COURT_RULING',
        reason: 'OFFICIAL_SOURCE_UNAVAILABLE: Tema 897 STF em SPA dinâmica. Substituído por Súmula Vinculante 21 com evidência oficial 100% recuperável e comprovada.',
        evidenceIds: ['STF-SV21', 'PLN-CF'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-052') {
      // Original STJ Súmula 375 (WAF 403 e erro deôntico) -> STF Súmula Vinculante 25 c/c CF art. 5º, LXVII e CC art. 652
      const newText = "É ilícita a decretação de prisão civil do depositário infiel, qualquer que seja a modalidade de depósito, subsistindo a inadmissibilidade da custódia civil por dívida no ordenamento jurídico brasileiro.";
      const unit = {
        holdoutId: 'HOLDOUT-052',
        domain: 'Direito Civil',
        difficulty: 'HARD',
        propositionType: 'COURT_RULING',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'STRUCTURED',
          canonicalTargetEvaluability: 'EXPLICIT_IN_TEXT',
          reasonCode: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT',
          availableComponents: { precedentType: 'SV', precedentNumber: '25', diploma: 'CF', article: '5', inciso: 'LXVII' },
          availableLocators: [
            { precedentType: 'SV', precedentNumber: '25', sourceSpan: { text: "prisão civil do depositário infiel", start: 25, end: 59 }, canonicalId: 'STF_SV_25' }
          ],
          precedentIdentityEvaluability: true,
          precedentHoldingEvaluability: true
        },
        atomicClaims: [
          {
            claimId: 'H052-C1',
            holdoutId: 'HOLDOUT-052',
            sourceSpan: { start: 0, end: 204, text: newText },
            normalizedClaim: "Ilicitude da prisão civil do depositário infiel em qualquer modalidade de depósito",
            claimType: 'COURT_RULING',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H052-SPEC1',
            holdoutId: 'HOLDOUT-052',
            claimId: 'H052-C1',
            sourceSpan: { start: 0, end: 204, text: newText },
            kind: 'COURT_RULING',
            normativeFunction: 'CONSTITUTIVE_EFFECT',
            subject: 'ordem jurídica brasileira',
            predicate: 'declarar ilícita',
            object: 'prisão civil do depositário infiel',
            polarity: 'NEGATIVE',
            modality: 'DECLARES',
            legalSourceTarget: 'STF_SV_25',
            requiredEvidenceKind: 'JUDICIAL_DECISION'
          }
        ],
        criticalMaterialTokens: ["ilícita a decretação de prisão civil", "depositário infiel", "qualquer que seja a modalidade de depósito"],
        materialTokens: ["ilícita", "prisão", "civil", "depositário", "infiel", "modalidade", "depósito", "dívida"],
        criticalQualifiers: [],
        officialSources: [
          {
            authority: 'STF',
            sourceType: 'JURISPRUDÊNCIA',
            citation: 'STF, Súmula Vinculante 25',
            officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1268',
            rawTextExcerpt: "Súmula Vinculante 25: É ilícita a prisão civil de depositário infiel, qualquer que seja a modalidade de depósito.",
            locator: 'STF:SV:25'
          },
          {
            authority: 'CONSTITUICAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: 'Constituição Federal de 1988, art. 5º, LXVII',
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
            rawTextExcerpt: "Art. 5º ... LXVII - não haverá prisão civil por dívida, salvo a do responsável pelo inadimplemento voluntário e inescusável de obrigação alimentícia e a do depositário infiel;",
            locator: 'CF:art:5:inciso:LXVII'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-052',
        newHoldoutId: 'HOLDOUT-052',
        oldDomain: 'Direito Civil',
        newDomain: 'Direito Civil',
        oldDifficulty: 'HARD',
        newDifficulty: 'HARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'COURT_RULING',
        reason: 'OFFICIAL_SOURCE_UNAVAILABLE & DEONTIC_ERROR: Súmula 375 STJ bloqueada por WAF e H052-SPEC2 continha MUST_NOT em constitutive effect. Substituído por Súmula Vinculante 25 com deôntica rigorosa DECLARES + NEGATIVE + CONSTITUTIVE_EFFECT.',
        evidenceIds: ['STF-SV25', 'PLN-CF'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-053') {
      // Original STJ Súmula 479 (WAF 403) -> STF Súmula Vinculante 27
      const newText = "Compete à Justiça Estadual processar e julgar causas entre consumidor e concessionária de serviço público de telefonia, quando a ANATEL não seja parte na lide.";
      const unit = {
        holdoutId: 'HOLDOUT-053',
        domain: 'Direito Civil',
        difficulty: 'STANDARD',
        propositionType: 'COURT_RULING',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'STRUCTURED',
          canonicalTargetEvaluability: 'EXPLICIT_IN_TEXT',
          reasonCode: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT',
          availableComponents: { precedentType: 'SV', precedentNumber: '27' },
          availableLocators: [{ precedentType: 'SV', precedentNumber: '27', sourceSpan: { text: "consumidor e concessionária de serviço público de telefonia", start: 57, end: 118 }, canonicalId: 'STF_SV_27' }],
          precedentIdentityEvaluability: true,
          precedentHoldingEvaluability: true
        },
        atomicClaims: [
          {
            claimId: 'H053-C1',
            holdoutId: 'HOLDOUT-053',
            sourceSpan: { start: 0, end: 161, text: newText },
            normalizedClaim: "Competência da Justiça Estadual para causas entre consumidor e telefonia sem ANATEL",
            claimType: 'COURT_RULING',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H053-SPEC1',
            holdoutId: 'HOLDOUT-053',
            claimId: 'H053-C1',
            sourceSpan: { start: 0, end: 161, text: newText },
            kind: 'COURT_RULING',
            normativeFunction: 'COMPETENCE',
            subject: 'Justiça Estadual',
            predicate: 'julgar causas entre consumidor e concessionária de telefonia',
            object: 'lide sem presença da ANATEL',
            polarity: 'POSITIVE',
            modality: 'CAN',
            legalSourceTarget: 'STF_SV_27',
            requiredEvidenceKind: 'JUDICIAL_DECISION'
          }
        ],
        criticalMaterialTokens: ["Compete à Justiça Estadual", "consumidor", "concessionária de serviço público de telefonia", "quando a ANATEL não seja parte"],
        materialTokens: ["Justiça", "Estadual", "consumidor", "concessionária", "telefonia", "ANATEL", "lide"],
        criticalQualifiers: [],
        officialSources: [
          {
            authority: 'STF',
            sourceType: 'JURISPRUDÊNCIA',
            citation: 'STF, Súmula Vinculante 27',
            officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1274',
            rawTextExcerpt: "Súmula Vinculante 27: Compete à Justiça Estadual julgar causas entre consumidor e concessionária de serviço público de telefonia, quando a ANATEL não seja parte na lide.",
            locator: 'STF:SV:27'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-053',
        newHoldoutId: 'HOLDOUT-053',
        oldDomain: 'Direito Civil',
        newDomain: 'Direito Civil',
        oldDifficulty: 'STANDARD',
        newDifficulty: 'STANDARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'COURT_RULING',
        reason: 'OFFICIAL_SOURCE_UNAVAILABLE: Súmula 479 STJ bloqueada por WAF. Substituído por Súmula Vinculante 27 com evidência oficial 100% recuperável e comprovada.',
        evidenceIds: ['STF-SV27'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-055') {
      // Original STJ Tema 988 -> CPC art. 300, caput e § 3º
      const newText = "A tutela de urgência de natureza antecipada exige elementos que evidenciem a probabilidade do direito e o perigo de dano ou risco ao resultado útil do processo, não sendo concedida quando houver perigo de irreversibilidade dos efeitos da decisão.";
      const unit = {
        holdoutId: 'HOLDOUT-055',
        domain: 'Processo Civil',
        difficulty: 'HARD',
        propositionType: 'EXCEPTION',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'NONE',
          canonicalTargetEvaluability: 'NOT_EVALUABLE_FROM_INPUT',
          reasonCode: 'NO_REFERENCE_IN_INPUT',
          availableComponents: {},
          precedentIdentityEvaluability: false,
          precedentHoldingEvaluability: false
        },
        atomicClaims: [
          {
            claimId: 'H055-C1',
            holdoutId: 'HOLDOUT-055',
            sourceSpan: { start: 0, end: 159, text: "A tutela de urgência de natureza antecipada exige elementos que evidenciem a probabilidade do direito e o perigo de dano ou risco ao resultado útil do processo" },
            normalizedClaim: "Requisitos de probabilidade e perigo de dano para concessão da tutela de urgência",
            claimType: 'DIRECT_NORMATIVE_ASSERTION',
            materiality: 'MATERIAL'
          },
          {
            claimId: 'H055-C2',
            holdoutId: 'HOLDOUT-055',
            sourceSpan: { start: 161, end: 245, text: "não sendo concedida quando houver perigo de irreversibilidade dos efeitos da decisão" },
            normalizedClaim: "Vedação à concessão da tutela antecipada em caso de irreversibilidade dos efeitos",
            claimType: 'EXCEPTION',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H055-SPEC1',
            holdoutId: 'HOLDOUT-055',
            claimId: 'H055-C1',
            sourceSpan: { start: 0, end: 159, text: "A tutela de urgência de natureza antecipada exige elementos que evidenciem a probabilidade do direito e o perigo de dano ou risco ao resultado útil do processo" },
            kind: 'RULE_OBLIGATION',
            normativeFunction: 'DUTY',
            subject: 'requerente da tutela de urgência',
            predicate: 'evidenciar requisitos legais cumulativos',
            object: 'probabilidade do direito e perigo de dano',
            polarity: 'POSITIVE',
            modality: 'MUST',
            legalSourceTarget: 'CPC_ART_300_CAPUT',
            requiredEvidenceKind: 'LEGISLATION'
          },
          {
            assertionId: 'H055-SPEC2',
            holdoutId: 'HOLDOUT-055',
            claimId: 'H055-C2',
            sourceSpan: { start: 161, end: 245, text: "não sendo concedida quando houver perigo de irreversibilidade dos efeitos da decisão" },
            kind: 'RULE_PROHIBITION',
            normativeFunction: 'PROHIBITION',
            subject: 'juízo',
            predicate: 'conceder tutela antecipada',
            object: 'medida com perigo de irreversibilidade fática ou jurídica',
            polarity: 'NEGATIVE',
            modality: 'MUST_NOT',
            qualifiers: [{ type: 'EXCEPTION', value: 'vedada se houver perigo de irreversibilidade', sourceText: 'não sendo concedida quando houver perigo de irreversibilidade', sourceSpan: { start: 161, end: 224, text: "não sendo concedida quando houver perigo de irreversibilidade" } }],
            legalSourceTarget: 'CPC_ART_300_PAR_3',
            requiredEvidenceKind: 'LEGISLATION'
          }
        ],
        criticalMaterialTokens: ["tutela de urgência", "probabilidade do direito", "perigo de dano", "irreversibilidade dos efeitos"],
        materialTokens: ["tutela", "urgência", "antecipada", "probabilidade", "direito", "perigo", "dano", "irreversibilidade"],
        criticalQualifiers: [{ type: 'EXCEPTION', value: 'vedada se houver perigo de irreversibilidade', sourceText: 'não sendo concedida quando houver perigo de irreversibilidade', sourceSpan: { start: 163, end: 226, text: "não sendo concedida quando houver perigo de irreversibilidade" } }],
        officialSources: [
          {
            authority: 'LEGISLACAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: 'Código de Processo Civil, art. 300, caput e § 3º',
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',
            rawTextExcerpt: "Art. 300. A tutela de urgência será concedida quando houver elementos que evidenciem a probabilidade do direito e o perigo de dano ou o risco ao resultado útil do processo. ... § 3º A tutela de urgência de natureza antecipada não será concedida quando houver perigo de irreversibilidade dos efeitos da decisão.",
            locator: 'CPC:art:300:caput'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-055',
        newHoldoutId: 'HOLDOUT-055',
        oldDomain: 'Processo Civil',
        newDomain: 'Processo Civil',
        oldDifficulty: 'HARD',
        newDifficulty: 'HARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'EXCEPTION',
        reason: 'OFFICIAL_SOURCE_UNAVAILABLE: Tema 988 STJ em container dinâmico/iframe. Substituído por CPC art. 300 com evidência legislativa 100% verificada.',
        evidenceIds: ['PLN-CPC'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else if (id === 'HOLDOUT-060') {
      // Original STJ Súmula 7 (WAF 403) -> STF Súmula Vinculante 4 c/c CF art. 7º, IV
      const newText = "Salvo nos casos expressamente previstos na Constituição Federal, o salário mínimo não pode ser usado como indexador de base de cálculo de vantagem de servidor público ou de empregado, nem ser substituído por decisão judicial.";
      const unit = {
        holdoutId: 'HOLDOUT-060',
        domain: 'Processo Civil',
        difficulty: 'STANDARD',
        propositionType: 'COURT_RULING',
        originalText: newText,
        resolvabilityAssessment: {
          referencePresence: 'STRUCTURED',
          canonicalTargetEvaluability: 'EXPLICIT_IN_TEXT',
          reasonCode: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT',
          availableComponents: { precedentType: 'SV', precedentNumber: '4', diploma: 'CF', article: '7', inciso: 'IV' },
          availableLocators: [{ precedentType: 'SV', precedentNumber: '4', sourceSpan: { text: "salário mínimo não pode ser usado como indexador", start: 67, end: 115 }, canonicalId: 'STF_SV_4' }],
          precedentIdentityEvaluability: true,
          precedentHoldingEvaluability: true
        },
        atomicClaims: [
          {
            claimId: 'H060-C1',
            holdoutId: 'HOLDOUT-060',
            sourceSpan: { start: 0, end: 228, text: newText },
            normalizedClaim: "Vedação ao uso do salário mínimo como indexador salvo exceção constitucional",
            claimType: 'COURT_RULING',
            materiality: 'MATERIAL'
          }
        ],
        assertionSpecs: [
          {
            assertionId: 'H060-SPEC1',
            holdoutId: 'HOLDOUT-060',
            claimId: 'H060-C1',
            sourceSpan: { start: 0, end: 228, text: newText },
            kind: 'COURT_RULING',
            normativeFunction: 'PROHIBITION',
            subject: 'administração pública e órgãos judiciais',
            predicate: 'usar salário mínimo como indexador ou substituí-lo judicialmente',
            object: 'vantagem pecuniária de servidor público ou empregado',
            polarity: 'NEGATIVE',
            modality: 'MUST_NOT',
            qualifiers: [{ type: 'EXCEPTION', value: 'salvo nos casos previstos na Constituição', sourceText: 'Salvo nos casos expressamente previstos na Constituição Federal', sourceSpan: { start: 0, end: 63, text: "Salvo nos casos expressamente previstos na Constituição Federal" } }],
            legalSourceTarget: 'STF_SV_4',
            requiredEvidenceKind: 'JUDICIAL_DECISION'
          }
        ],
        criticalMaterialTokens: ["Salvo nos casos expressamente previstos na Constituição", "salário mínimo não pode ser usado como indexador", "vantagem de servidor público ou de empregado"],
        materialTokens: ["salário", "mínimo", "indexador", "base", "cálculo", "vantagem", "servidor", "decisão", "judicial"],
        criticalQualifiers: [{ type: 'EXCEPTION', value: 'salvo nos casos previstos na Constituição', sourceText: 'Salvo nos casos expressamente previstos na Constituição Federal', sourceSpan: { start: 0, end: 63, text: "Salvo nos casos expressamente previstos na Constituição Federal" } }],
        officialSources: [
          {
            authority: 'STF',
            sourceType: 'JURISPRUDÊNCIA',
            citation: 'STF, Súmula Vinculante 4',
            officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1195',
            rawTextExcerpt: "Súmula Vinculante 4: Salvo nos casos previstos na Constituição, o salário mínimo não pode ser usado como indexador de base de cálculo de vantagem de servidor público ou de empregado, nem ser substituído por decisão judicial.",
            locator: 'STF:SV:4'
          },
          {
            authority: 'CONSTITUICAO_FEDERAL',
            sourceType: 'LEGISLAÇÃO',
            citation: 'Constituição Federal de 1988, art. 7º, IV',
            officialUrl: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
            rawTextExcerpt: "Art. 7º ... IV - salário mínimo , fixado em lei, nacionalmente unificado, capaz de atender a suas necessidades vitais básicas e às de sua família com moradia, alimentação, educação, saúde, lazer, vestuário, higiene, transporte e previdência social, com reajustes periódicos que lhe preservem o poder aquisitivo, sendo vedada sua vinculação para qualquer fim;",
            locator: 'CF:art:7:inciso:IV'
          }
        ],
        remediationStatus: 'VERIFIED_REPLACEMENT_PRE_H1'
      };
      replacements.push({
        oldHoldoutId: 'HOLDOUT-060',
        newHoldoutId: 'HOLDOUT-060',
        oldDomain: 'Processo Civil',
        newDomain: 'Processo Civil',
        oldDifficulty: 'STANDARD',
        newDifficulty: 'STANDARD',
        oldPropositionType: 'COURT_RULING',
        newPropositionType: 'COURT_RULING',
        reason: 'OFFICIAL_SOURCE_UNAVAILABLE: Súmula 7 STJ bloqueada por WAF. Substituído por Súmula Vinculante 4 com prova oficial vinculante 100% recuperável e comprovada.',
        evidenceIds: ['STF-SV4', 'PLN-CF'],
        preH1: true
      });
      remediatedUnits.push(unit);
    } else {
      // Units that remain unchanged in substance, but need URL parameter updates for STF SVs
      let unit = { ...u };
      if (id === 'HOLDOUT-008') {
        unit.officialSources = unit.officialSources.map((s: any) =>
          s.authority === 'STF' ? { ...s, officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1265' } : s
        );
        corrections.push({ holdoutId: id, field: 'officialUrl', oldValue: 'sumula=1273', newValue: 'sumula=1265', reasonCode: 'CORRECT_STF_ROUTING', evidenceId: 'STF-SV24', materialLocator: 'STF:SV:24', preH1: true });
        unit.remediationStatus = 'VERIFIED_AFTER_PRE_H1_CORRECTION';
      } else if (id === 'HOLDOUT-027') {
        unit.officialSources = unit.officialSources.map((s: any) =>
          s.authority === 'STF' ? { ...s, officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1220' } : s
        );
        corrections.push({ holdoutId: id, field: 'officialUrl', oldValue: 'sumula=1260', newValue: 'sumula=1220', reasonCode: 'CORRECT_STF_ROUTING', evidenceId: 'STF-SV11', materialLocator: 'STF:SV:11', preH1: true });
        unit.remediationStatus = 'VERIFIED_AFTER_PRE_H1_CORRECTION';
      } else if (id === 'HOLDOUT-032') {
        unit.officialSources = unit.officialSources.map((s: any) =>
          s.authority === 'STF' ? { ...s, officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1216' } : s
        );
        corrections.push({ holdoutId: id, field: 'officialUrl', oldValue: 'sumula=1259', newValue: 'sumula=1216', reasonCode: 'CORRECT_STF_ROUTING', evidenceId: 'STF-SV10', materialLocator: 'STF:SV:10', preH1: true });
        unit.remediationStatus = 'VERIFIED_AFTER_PRE_H1_CORRECTION';
      } else if (id === 'HOLDOUT-043') {
        unit.officialSources = unit.officialSources.map((s: any) =>
          s.authority === 'STF' ? { ...s, officialUrl: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1227' } : s
        );
        corrections.push({ holdoutId: id, field: 'officialUrl', oldValue: 'sumula=1262', newValue: 'sumula=1227', reasonCode: 'CORRECT_STF_ROUTING', evidenceId: 'STF-SV13', materialLocator: 'STF:SV:13', preH1: true });
        unit.remediationStatus = 'VERIFIED_AFTER_PRE_H1_CORRECTION';
      } else {
        unit.remediationStatus = 'VERIFIED_AS_IS';
      }
      remediatedUnits.push(unit);
    }
  }

  // 1. Write golden/holdout-60-golden-v235c.json
  const goldenV235cPath = path.join(goldenDir, 'holdout-60-golden-v235c.json');
  fs.writeFileSync(goldenV235cPath, JSON.stringify(remediatedUnits, null, 2), 'utf8');

  // 2. Write input/holdout-60-v235c.json (Blind Input strictly without golden fields)
  const blindInputs = remediatedUnits.map(u => ({
    holdoutId: u.holdoutId,
    domain: u.domain,
    difficulty: u.difficulty,
    propositionType: u.propositionType,
    originalText: u.originalText,
    providedContext: u.providedContext || undefined
  }));
  const inputV235cPath = path.join(inputDir, 'holdout-60-v235c.json');
  fs.writeFileSync(inputV235cPath, JSON.stringify(blindInputs, null, 2), 'utf8');

  // 3. Write audit/unit-replacements.json
  const replacementsPath = path.join(auditDir, 'unit-replacements.json');
  fs.writeFileSync(replacementsPath, JSON.stringify({
    phase: 'V2.3.5-C',
    createdAt: new Date().toISOString(),
    totalReplacements: replacements.length,
    replacements
  }, null, 2), 'utf8');

  // 4. Write audit/golden-corrections.json
  const correctionsPath = path.join(auditDir, 'golden-corrections.json');
  fs.writeFileSync(correctionsPath, JSON.stringify({
    phase: 'V2.3.5-C',
    createdAt: new Date().toISOString(),
    totalCorrections: corrections.length,
    corrections
  }, null, 2), 'utf8');

  // 5. Build Evidence Manifest V2: evidence/evidence-manifest-v235c.json
  const evidenceManifest: Record<string, any> = {};
  for (const u of remediatedUnits) {
    evidenceManifest[u.holdoutId] = {
      holdoutId: u.holdoutId,
      domain: u.domain,
      difficulty: u.difficulty,
      propositionType: u.propositionType,
      remediationStatus: u.remediationStatus,
      officialSources: u.officialSources.map((s: any) => {
        // Find matching documentId in extraction manifest
        let docId = '';
        if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1195')) docId = 'STF-SV4';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1199')) docId = 'STF-SV5';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1216')) docId = 'STF-SV10';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1220')) docId = 'STF-SV11';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1227')) docId = 'STF-SV13';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1230')) docId = 'STF-SV14';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1245')) docId = 'STF-SV18';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1255')) docId = 'STF-SV21';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1265')) docId = 'STF-SV24';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1268')) docId = 'STF-SV25';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1271')) docId = 'STF-SV26';
        else if (s.authority === 'STF' && s.officialUrl?.includes('sumula=1274')) docId = 'STF-SV27';
        else if (s.citation?.includes('Penal') && !s.citation?.includes('Processo')) docId = 'PLN-CP';
        else if (s.citation?.includes('Processo Penal')) docId = 'PLN-CPP';
        else if (s.citation?.includes('Constituição')) docId = 'PLN-CF';
        else if (s.citation?.includes('Processo Civil')) docId = 'PLN-CPC';
        else if (s.citation?.includes('Civil') && !s.citation?.includes('Processo')) docId = 'PLN-CC';
        else if (s.citation?.includes('8.137')) docId = 'PLN-L8137';
        else if (s.citation?.includes('9.868')) docId = 'PLN-L9868';
        else if (s.citation?.includes('14.133')) docId = 'PLN-L14133';
        else if (s.citation?.includes('8.112')) docId = 'PLN-L8112';
        else if (s.citation?.includes('8.443')) docId = 'PLN-L8443';
        else if (s.citation?.includes('9.784')) docId = 'PLN-L9784';
        else if (s.citation?.includes('Consumidor')) docId = 'PLN-CDC';
        else if (s.citation?.includes('7.210') || s.citation?.includes('Execução Penal')) docId = 'PLN-LEP';
        else if (s.citation?.includes('8.072') || s.citation?.includes('Hediondos')) docId = 'PLN-L8072';
        else if (s.citation?.includes('CNJ')) docId = 'CNJ-RES227';

        const docEntry = extractionManifest.documents.find((d: any) => d.documentId === docId);
        const materialText = s.rawTextExcerpt || '';
        return {
          evidenceId: `${u.holdoutId}-${docId}`,
          authority: s.authority,
          documentId: docId,
          canonicalUrl: s.officialUrl,
          rawSha256: docEntry?.rawSha256,
          normalizedTextSha256: docEntry?.normalizedTextSha256,
          locator: s.locator,
          materialText,
          materialTextSha256: computeSha256(materialText),
          provenance: docEntry?.rawSha256 ? 'REMOTE_OFFICIAL_DOCUMENT_RETRIEVED' : 'PREEXISTING_VERIFIED_OFFICIAL_BYTES',
          extractorVersion: 'v235c-extract-1'
        };
      })
    };
  }
  const evidenceManifestPath = path.join(evidenceDir, 'evidence-manifest-v235c.json');
  fs.writeFileSync(evidenceManifestPath, JSON.stringify(evidenceManifest, null, 2), 'utf8');

  // 6. Write manifest/holdout-manifest-v235c.json
  const blindInputSha = computeSha256(fs.readFileSync(inputV235cPath, 'utf8'));
  const goldenSha = computeSha256(fs.readFileSync(goldenV235cPath, 'utf8'));
  const evidenceSha = computeSha256(fs.readFileSync(evidenceManifestPath, 'utf8'));

  const holdoutManifest = {
    version: 'V2.3.5-C',
    phase: 'HOLDOUT_REMEDIATION_AND_OFFICIAL_EVIDENCE_CLOSURE',
    createdAt: new Date().toISOString(),
    benchmarkSize: remediatedUnits.length,
    stratification: {
      standardCount: remediatedUnits.filter(u => u.difficulty === 'STANDARD').length,
      hardCount: remediatedUnits.filter(u => u.difficulty === 'HARD').length,
      domains: {
        'Direito Penal — Parte Geral': remediatedUnits.filter(u => u.domain === 'Direito Penal — Parte Geral').length,
        'Direito Penal — Parte Especial': remediatedUnits.filter(u => u.domain === 'Direito Penal — Parte Especial').length,
        'Processo Penal': remediatedUnits.filter(u => u.domain === 'Processo Penal').length,
        'Direito Constitucional': remediatedUnits.filter(u => u.domain === 'Direito Constitucional').length,
        'Direito Administrativo': remediatedUnits.filter(u => u.domain === 'Direito Administrativo').length,
        'Direito Civil': remediatedUnits.filter(u => u.domain === 'Direito Civil').length,
        'Processo Civil': remediatedUnits.filter(u => u.domain === 'Processo Civil').length,
      }
    },
    quotas: {
      jurisprudenciaCount: remediatedUnits.filter(u => u.officialSources.some((s: any) => s.sourceType === 'JURISPRUDÊNCIA')).length,
      legislacaoCount: remediatedUnits.filter(u => u.officialSources.some((s: any) => s.sourceType === 'LEGISLAÇÃO')).length,
      replacementsCount: replacements.length,
      correctionsCount: corrections.length
    },
    hashes: {
      blindInputSha256: blindInputSha,
      goldenSha256: goldenSha,
      evidenceManifestSha256: evidenceSha
    },
    holdoutFreezeV235C: true
  };
  const manifestPath = path.join(manifestDir, 'holdout-manifest-v235c.json');
  fs.writeFileSync(manifestPath, JSON.stringify(holdoutManifest, null, 2), 'utf8');

  // 7. Write audit/human-review-required.json
  const humanReviewRequired = {
    manifestVersion: 'v235c-human-review',
    createdAt: new Date().toISOString(),
    criteria: [
      'Todas as 20 unidades de dificuldade HARD',
      'Todas as 12 unidades de Jurisprudência (STF Súmulas Vinculantes)',
      'Todas as 11 unidades substituídas PRE-H1',
      'Todas as unidades com correção legislativa (HOLDOUT-012)'
    ],
    totalUnitsRequiringHumanReview: 28,
    independentHumanReviewCompleted: false,
    note: 'Classificação oficial: OFFICIAL_EVIDENCE_REVALIDATION. Nenhuma destas unidades deve ser considerada submetida a revisão humana independente antes de validação por anotador humano real.',
    units: remediatedUnits
      .filter(u => u.difficulty === 'HARD' || u.officialSources.some((s: any) => s.sourceType === 'JURISPRUDÊNCIA') || replacements.some(r => r.oldHoldoutId === u.holdoutId))
      .map(u => ({
        holdoutId: u.holdoutId,
        domain: u.domain,
        difficulty: u.difficulty,
        remediationStatus: u.remediationStatus,
        isHard: u.difficulty === 'HARD',
        isJurisprudence: u.officialSources.some((s: any) => s.sourceType === 'JURISPRUDÊNCIA'),
        isReplacement: replacements.some(r => r.oldHoldoutId === u.holdoutId)
      }))
  };
  fs.writeFileSync(path.join(auditDir, 'human-review-required.json'), JSON.stringify(humanReviewRequired, null, 2), 'utf8');

  console.log(`\nRemediação V2.3.5-C concluída com sucesso.`);
  console.log(`- Total de unidades: ${remediatedUnits.length}`);
  console.log(`- Unidades substituídas: ${replacements.length}`);
  console.log(`- Unidades com correções pontuais: ${corrections.length}`);
  console.log(`- Blind Input SHA-256: ${blindInputSha}`);
  console.log(`- Golden SHA-256: ${goldenSha}`);
  console.log(`- Evidence Manifest SHA-256: ${evidenceSha}`);
}

runRemediationV235C();
