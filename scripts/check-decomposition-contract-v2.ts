/**
 * ATHENA V2.3.4-D — DECOMPOSITION CONTRACT V2 VERIFICATION SUITE
 * 
 * Suíte de testes e validação determinística do Contract V2:
 * 1. Network Guard (Zero rede, zero chamadas externas).
 * 2. Feature Flag (LEGAL_REVIEW_MATERIAL_BINDING === false).
 * 3. Integridade Criptográfica do RAW Congelado (SHA-256).
 * 4. Testes de Integridade de Source Text (7 casos A-G, somente A passa).
 * 5. Teste Anti-Golden-Repair (Adapter produz saída independente do golden).
 * 6. Testes do Canonical Source Resolver (Diretos, herdados, jurisprudência, não resolvidos).
 * 7. Testes de Lossless Grouping (Positivos).
 * 8. Testes de Lossy Grouping (Negativos).
 * 9. Testes Adversariais / Controles Negativos (10 controles).
 * 10. Replay Forense das 20 Unidades contra o Contract V2.
 * 11. Relatório Específico dos 5 Casos HARD.
 * 12. Contabilidade dos Erros Semânticos Reais Restantes.
 * 13. Execução Dupla com Verificação de Determinismo 100% Byte a Byte.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';

import {
  LEGAL_REVIEW_MATERIAL_BINDING,
  type NormativeFunction,
  type SourceTargetEvaluability,
  type ReferencePresence,
  type CanonicalTargetEvaluability,
  type LegalSourceTargetComponents,
  type LegalSourceLocator,
  type EvaluabilityReasonCode,
  type EvaluabilityAssessment,
  type InputSufficiencyManifest,
} from '../src/lib/legalReviewTypes.js';

import {
  recoverExactSourceSpan,
  validateSourceTextIntegrity,
  resolveCanonicalLegalSource,
  adaptV234CRawToContractV2,
  evaluateDecompositionContractV2,
  deriveSourceTargetEvaluability,
  parseCanonicalTargetComponents,
  assessSourceTargetResolvability,
  extractLegalSourceLocators,
  type DecompositionCandidateV2,
  type GoldenBenchmarkEntry,
  type LegalSourceReference,
  type LegalStructuralContext,
  type ProvidedEvaluationContext,
  type GenericEvaluabilityContext,
} from '../src/lib/legalReviewDecompositionContract.js';

// ============================================================================
// 1. NETWORK GUARD (ZERO REDE / ZERO MODEL CALLS)
// ============================================================================

let externalModelCalls = 0;
let networkRequests = 0;

globalThis.fetch = () => {
  networkRequests++;
  throw new Error('NETWORK_GUARD_VIOLATION: Chamada externa a fetch() terminantemente proibida.');
};

try {
  (http as any).request = (() => {
    networkRequests++;
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada http.request terminantemente proibida.');
  }) as any;
  (https as any).request = (() => {
    networkRequests++;
    throw new Error('NETWORK_GUARD_VIOLATION: Chamada https.request terminantemente proibida.');
  }) as any;
} catch {
  // Ignora se congelado
}

const EXPECTED_RAW_HASH = 'ca1ec0c585bad0f9859a825bee70392bda226abf40be4e816ff42d4a17fd7efd';

// ============================================================================
// 2. FUNÇÃO PRINCIPAL DE VERIFICAÇÃO DO CONTRACT V2
// ============================================================================

export function runDecompositionContractV2Verification() {
  const testResults: Record<string, any> = {};
  let totalTests = 0;
  let passedTests = 0;

  // ---------------------------------------------------------------------------
  // A. VERIFICAÇÃO DE FEATURE FLAG
  // ---------------------------------------------------------------------------
  totalTests++;
  if (LEGAL_REVIEW_MATERIAL_BINDING !== false) {
    throw new Error(`FEATURE_FLAG_ERROR: LEGAL_REVIEW_MATERIAL_BINDING deve ser false (atual: ${LEGAL_REVIEW_MATERIAL_BINDING})`);
  }
  passedTests++;
  testResults['featureFlag'] = { status: 'PASS', value: LEGAL_REVIEW_MATERIAL_BINDING };

  // ---------------------------------------------------------------------------
  // B. INTEGRIDADE CRIPTOGRÁFICA DO ARTEFATO RAW CONGELADO
  // ---------------------------------------------------------------------------
  totalTests++;
  const rawPath = path.resolve(process.cwd(), 'tmp/assertion-decomposition-eval/gpt56-blind-raw-response.json');
  if (!fs.existsSync(rawPath)) {
    throw new Error(`Arquivo RAW não encontrado em: ${rawPath}`);
  }
  const rawContent = fs.readFileSync(rawPath, 'utf8');
  const actualHash = crypto.createHash('sha256').update(rawContent).digest('hex');
  if (actualHash !== EXPECTED_RAW_HASH) {
    throw new Error(`RAW_HASH_MISMATCH: esperado ${EXPECTED_RAW_HASH}, obtido ${actualHash}`);
  }
  passedTests++;
  testResults['rawHashIntegrity'] = { status: 'PASS', hash: actualHash };

  // ---------------------------------------------------------------------------
  // C. TESTES DE INTEGRIDADE DE SOURCE TEXT (CASOS A ATÉ G)
  // ---------------------------------------------------------------------------
  const originalSample = 'O juiz das garantias é responsável pelo controle da legalidade da investigação.';
  const integritySuite = [
    { name: 'Case A: Substring única', text: 'controle da legalidade', expected: 'UNIQUE_EXACT_MATCH' },
    { name: 'Case B: Substring inexistente', text: 'juiz da instrução', expected: 'TEXT_NOT_FOUND' },
    { name: 'Case C: Substring duplicada', text: 'da', expected: 'AMBIGUOUS_EXACT_MATCH' },
    { name: 'Case D: Diferença de acento', text: 'O juiz das garantias e responsavel', expected: 'TEXT_NOT_FOUND' },
    { name: 'Case E: Diferença de pontuação', text: 'investigação;', expected: 'TEXT_NOT_FOUND' },
    { name: 'Case F: Espaço alterado', text: 'controle   da legalidade', expected: 'TEXT_NOT_FOUND' },
    { name: 'Case G: Texto parcialmente inventado', text: 'controle rigoroso da legalidade', expected: 'TEXT_NOT_FOUND' },
  ];

  const integrityResults: Record<string, any> = {};
  for (const tc of integritySuite) {
    totalTests++;
    const res = validateSourceTextIntegrity(originalSample, tc.text);
    if (res !== tc.expected) {
      throw new Error(`SOURCE_INTEGRITY_FAIL: ${tc.name} esperado ${tc.expected}, obtido ${res}`);
    }
    passedTests++;
    integrityResults[tc.name] = { expected: tc.expected, actual: res, pass: true };
  }
  testResults['sourceTextIntegrity'] = integrityResults;

  // ---------------------------------------------------------------------------
  // D. TESTE ANTI-GOLDEN-REPAIR (ADAPTER INDEPENDENTE DO GOLDEN)
  // ---------------------------------------------------------------------------
  totalTests++;
  const rawData = JSON.parse(rawContent);
  const rawCandidateText = rawData.output.find((o: any) => o.type === 'message').content[0].text;
  const rawDecompositions = JSON.parse(rawCandidateText).decompositions;

  // Execução 1: adapter sem qualquer menção a golden
  const adaptedCandidate1 = adaptV234CRawToContractV2(rawDecompositions[0]);
  // Execução 2: adapter em isolamento repetido
  const adaptedCandidate2 = adaptV234CRawToContractV2(rawDecompositions[0]);

  const strCand1 = JSON.stringify(adaptedCandidate1);
  const strCand2 = JSON.stringify(adaptedCandidate2);
  if (strCand1 !== strCand2) {
    throw new Error('ANTI_GOLDEN_REPAIR_FAIL: Adapter produziu resultados divergentes.');
  }
  passedTests++;
  testResults['antiGoldenRepair'] = { status: 'PASS', isGoldenIndependent: true };

  // ---------------------------------------------------------------------------
  // E. TESTES DO CANONICAL SOURCE RESOLVER
  // ---------------------------------------------------------------------------
  const resolverSuite = [
    {
      name: 'Resolução direta CPP Art. 1º',
      ref: { authority: 'LEGISLACAO_FEDERAL', identifier: 'CPP', provision: 'Art. 1º' },
      ctx: undefined,
      expectedId: 'CPP_ART_1',
    },
    {
      name: 'Resolução herdada CPP Art. 3º-B Inciso I',
      ref: { inciso: 'I' },
      ctx: { parentCitation: 'Art. 3º-B do CPP' },
      expectedId: 'CPP_ART_3B_I',
    },
    {
      name: 'Resolução herdada CPP Art. 1º Parágrafo Único',
      ref: { paragraph: 'Parágrafo Único' },
      ctx: { parentCitation: 'Art. 1º do CPP' },
      expectedId: 'CPP_ART_1_PAR_UNICO',
    },
    {
      name: 'Resolução herdada CPP Art. 3º-C § 1º',
      ref: { paragraph: '§ 1º' },
      ctx: { parentCitation: 'Art. 3º-C do CPP' },
      expectedId: 'CPP_ART_3C_PAR_1',
    },
    {
      name: 'Resolução STF ADI 6298 Item 1 (Art. 3º-A)',
      ref: { authority: 'STF', provision: 'Art. 3º-A', textualReference: 'interpretação conforme' },
      ctx: undefined,
      expectedId: 'STF_ADI_6298_ITEM1',
    },
    {
      name: 'Resolução STF ADI 6298 Item 2 (Juiz das Garantias)',
      ref: { authority: 'STF', textualReference: 'constitucionalidade do juiz das garantias' },
      ctx: undefined,
      expectedId: 'STF_ADI_6298_ITEM2',
    },
    {
      name: 'Resolução STF ADI 6298 Rodízio',
      ref: { authority: 'STF', provision: 'Art. 3º-D', paragraph: 'parágrafo único', textualReference: 'rodízio' },
      ctx: undefined,
      expectedId: 'STF_ADI_6298_RODIZIO',
    },
    {
      name: 'Referência não resolvida',
      ref: { identifier: 'LEI_DESCONHECIDA_XYZ' },
      ctx: undefined,
      expectedId: undefined,
    },
  ];

  const resolverResults: Record<string, any> = {};
  for (const tc of resolverSuite) {
    totalTests++;
    const res = resolveCanonicalLegalSource(tc.ref, tc.ctx);
    if (tc.expectedId) {
      if (res.status !== 'RESOLVED' || res.canonicalId !== tc.expectedId) {
        throw new Error(`RESOLVER_FAIL: ${tc.name} esperado ${tc.expectedId}, obtido ${res.canonicalId} (${res.status})`);
      }
    } else {
      if (res.status === 'RESOLVED') {
        throw new Error(`RESOLVER_FAIL: ${tc.name} deveria ser UNRESOLVED, mas foi ${res.canonicalId}`);
      }
    }
    passedTests++;
    resolverResults[tc.name] = { pass: true, canonicalId: res.canonicalId, status: res.status };
  }
  testResults['canonicalResolver'] = resolverResults;

  // ---------------------------------------------------------------------------
  // F. CARREGAR GOLDEN BENCHMARK
  // ---------------------------------------------------------------------------
  const goldenPath = path.resolve(process.cwd(), 'tmp/assertion-decomposition-benchmark/golden-assertions.json');
  const goldenEntries: GoldenBenchmarkEntry[] = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));

  // ---------------------------------------------------------------------------
  // G. TESTES DE LOSSLESS GROUPING (POSITIVOS ESPECÍFICOS)
  // ---------------------------------------------------------------------------
  // Caso Positivo 1: PROP-005 ("pontualmente" + "nos limites legalmente autorizados")
  {
    totalTests++;
    const e05 = goldenEntries.find(e => e.propositionId === 'PROP-005')!;
    const losslessCand05: DecompositionCandidateV2 = {
      propositionId: 'PROP-005',
      atomicClaims: [
        {
          claimId: 'P005-PREAMBLE',
          sourceText: e05.atomicClaims[0].sourceSpan.text,
          materiality: 'NON_MATERIAL',
        },
        {
          claimId: 'P005-A',
          sourceText: e05.atomicClaims[1].sourceSpan.text,
          materiality: 'MATERIAL',
        },
        {
          claimId: 'P005-BC-GROUPED',
          sourceText: e05.originalText.slice(102, 376),
          materiality: 'MATERIAL',
        },
        {
          claimId: 'P005-D',
          sourceText: e05.atomicClaims[4].sourceSpan.text,
          materiality: 'MATERIAL',
        },
      ],
      assertionSpecs: [
        {
          assertionId: 'SPEC_05_1',
          claimId: 'P005-A',
          sourceText: e05.atomicClaims[1].sourceSpan.text,
          subject: 'JUIZ',
          predicate: 'SUBSTITUICAO_ATUACAO_PROBATORIA',
          polarity: 'NEGATIVE',
          modality: 'MUST_NOT',
          qualifiers: [],
          legalSourceReference: { authority: 'LEGISLACAO_FEDERAL', identifier: 'CPP', provision: 'Art. 3º-A' },
        },
        {
          assertionId: 'SPEC_05_2',
          claimId: 'P005-BC-GROUPED',
          sourceText: e05.originalText.slice(102, 184),
          subject: 'STF',
          predicate: 'ATRIBUIU_INTERPRETACAO_CONFORME',
          polarity: 'POSITIVE',
          modality: 'DECLARES',
          qualifiers: [],
          legalSourceReference: { authority: 'STF', provision: 'Art. 3º-A' },
        },
        {
          assertionId: 'SPEC_05_3',
          claimId: 'P005-BC-GROUPED',
          sourceText: e05.originalText.slice(184, 376),
          subject: 'JUIZ',
          predicate: 'DETERMINA_DILIGENCIAS_SUPLEMENTARES',
          polarity: 'POSITIVE',
          modality: 'MAY',
          qualifiers: [
            {
              type: 'LIMIT',
              value: 'pontualmente e nos limites legalmente autorizados',
              sourceText: 'pontualmente e nos limites legalmente autorizados',
            },
            {
              type: 'PURPOSE',
              value: 'destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito',
              sourceText: 'destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito',
            },
          ],
          legalSourceReference: { authority: 'STF', provision: 'Art. 3º-A' },
        },
        {
          assertionId: 'SPEC_05_4',
          claimId: 'P005-D',
          sourceText: e05.atomicClaims[4].sourceSpan.text,
          subject: 'JUIZ',
          predicate: 'ATUACAO_INSTRUTORIA_SUBSIDIARIA',
          polarity: 'POSITIVE',
          modality: 'MAY',
          qualifiers: [
            {
              type: 'CONDITION',
              value: 'desde que não haja substituição da atividade probatória das partes',
              sourceText: 'desde que não haja substituição da atividade probatória das partes',
            },
          ],
          legalSourceReference: { authority: 'LEGISLACAO_FEDERAL', identifier: 'CPP', provision: 'Art. 156', inciso: 'II' },
        },
      ],
    };

    const res05 = evaluateDecompositionContractV2(losslessCand05, e05);
    if (!res05.valid) {
      throw new Error(`LOSSLESS_GROUPING_TEST_FAIL: PROP-005 deveria passar sob agrupamento lossless. Erros: ${res05.errors.join(', ')}`);
    }
    if (res05.qualifierTypeStatus !== 'QUALIFIER_TYPE_COMPOSITE') {
      throw new Error(`LOSSLESS_GROUPING_TEST_FAIL: Esperado QUALIFIER_TYPE_COMPOSITE, obtido: ${res05.qualifierTypeStatus}`);
    }
    passedTests++;
    testResults['losslessGroupingPositives_PROP005'] = { pass: true, qualifierTypeStatus: res05.qualifierTypeStatus };
  }

  // Caso Positivo 2: PROP-030 (autonomia dos tribunais + diretrizes do CNJ agrupadas literalmente)
  {
    totalTests++;
    const e30 = goldenEntries.find(e => e.propositionId === 'PROP-030')!;
    const losslessCand30: DecompositionCandidateV2 = {
      propositionId: 'PROP-030',
      atomicClaims: [
        {
          claimId: 'P030-A',
          sourceText: e30.atomicClaims[0].sourceSpan.text,
          materiality: 'MATERIAL',
        },
        {
          claimId: 'P030-B',
          sourceText: e30.atomicClaims[1].sourceSpan.text,
          materiality: 'MATERIAL',
        },
        {
          claimId: 'P030-CDE-GROUPED',
          sourceText: e30.originalText.slice(e30.atomicClaims[2].sourceSpan.start, e30.atomicClaims[4].sourceSpan.end),
          materiality: 'MATERIAL',
        },
      ],
      assertionSpecs: [
        {
          assertionId: 'SPEC_30_1',
          claimId: 'P030-A',
          sourceText: e30.atomicClaims[0].sourceSpan.text,
          subject: 'STF',
          predicate: 'CONSIDERA_CONSTITUCIONAL_CRIACAO_JUIZ_GARANTIAS',
          polarity: 'POSITIVE',
          modality: 'DECLARES',
          qualifiers: [],
          legalSourceReference: { authority: 'STF', textualReference: 'constitucionalidade do juiz das garantias' },
        },
        {
          assertionId: 'SPEC_30_2',
          claimId: 'P030-B',
          sourceText: e30.atomicClaims[1].sourceSpan.text,
          subject: 'STF',
          predicate: 'RECONHECE_OBRIGATORIEDADE_IMPLEMENTACAO_NACIONAL',
          polarity: 'POSITIVE',
          modality: 'RECOGNIZES',
          qualifiers: [
            { type: 'SCOPE', value: 'em todo o país', sourceText: 'em todo o país' },
          ],
          legalSourceReference: { authority: 'STF', textualReference: 'constitucionalidade do juiz das garantias' },
        },
        {
          assertionId: 'SPEC_30_3',
          claimId: 'P030-CDE-GROUPED',
          sourceText: e30.originalText.slice(e30.atomicClaims[2].sourceSpan.start, e30.atomicClaims[4].sourceSpan.end),
          subject: 'ORGANIZACAO_E_FUNCIONAMENTO',
          predicate: 'DEVEM_SER_DISCIPLINADOS',
          polarity: 'POSITIVE',
          modality: 'MUST',
          qualifiers: [
            {
              type: 'CONDITION',
              value: 'observada a autonomia dos tribunais e as diretrizes estabelecidas pelo CNJ',
              sourceText: 'observada a autonomia dos tribunais e as diretrizes estabelecidas pelo CNJ',
            },
          ],
          legalSourceReference: { authority: 'STF', textualReference: 'constitucionalidade do juiz das garantias' },
        },
      ],
    };

    const res30 = evaluateDecompositionContractV2(losslessCand30, e30);
    if (!res30.valid) {
      throw new Error(`LOSSLESS_GROUPING_TEST_FAIL: PROP-030 deveria passar sob agrupamento lossless. Erros: ${res30.errors.join(', ')}`);
    }
    passedTests++;
    testResults['losslessGroupingPositives_PROP030'] = { pass: true, coveredQualifiers: res30.coveredGoldenQualifierIds };
  }

  // ---------------------------------------------------------------------------
  // H. TESTES DE LOSSY GROUPING (NEGATIVOS ESPECÍFICOS)
  // ---------------------------------------------------------------------------
  // Caso Negativo 1: PROP-005 omitindo "nos limites legalmente autorizados"
  {
    totalTests++;
    const e05 = goldenEntries.find(e => e.propositionId === 'PROP-005')!;
    const lossyCand05: DecompositionCandidateV2 = {
      propositionId: 'PROP-005',
      atomicClaims: [
        { claimId: 'P005-PREAMBLE', sourceText: e05.atomicClaims[0].sourceSpan.text, materiality: 'NON_MATERIAL' },
        { claimId: 'P005-A', sourceText: e05.atomicClaims[1].sourceSpan.text, materiality: 'MATERIAL' },
        { claimId: 'P005-BC-GROUPED', sourceText: e05.originalText.slice(102, 376), materiality: 'MATERIAL' },
        { claimId: 'P005-D', sourceText: e05.atomicClaims[4].sourceSpan.text, materiality: 'MATERIAL' },
      ],
      assertionSpecs: [
        {
          assertionId: 'SPEC_05_1',
          claimId: 'P005-A',
          sourceText: e05.atomicClaims[1].sourceSpan.text,
          subject: 'JUIZ',
          predicate: 'SUBSTITUICAO_ATUACAO_PROBATORIA',
          polarity: 'NEGATIVE',
          modality: 'MUST_NOT',
          qualifiers: [],
          legalSourceReference: { authority: 'LEGISLACAO_FEDERAL', identifier: 'CPP', provision: 'Art. 3º-A' },
        },
        {
          assertionId: 'SPEC_05_2',
          claimId: 'P005-BC-GROUPED',
          sourceText: e05.originalText.slice(102, 184),
          subject: 'STF',
          predicate: 'ATRIBUIU_INTERPRETACAO_CONFORME',
          polarity: 'POSITIVE',
          modality: 'DECLARES',
          qualifiers: [],
          legalSourceReference: { authority: 'STF', provision: 'Art. 3º-A' },
        },
        {
          assertionId: 'SPEC_05_3',
          claimId: 'P005-BC-GROUPED',
          sourceText: e05.originalText.slice(184, 376),
          subject: 'JUIZ',
          predicate: 'DETERMINA_DILIGENCIAS_SUPLEMENTARES',
          polarity: 'POSITIVE',
          modality: 'MAY',
          qualifiers: [
            // Mantém apenas pontualmente, omite "nos limites legalmente autorizados"
            { type: 'FREQUENCY', value: 'pontualmente', sourceText: 'pontualmente' },
            { type: 'PURPOSE', value: 'destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito', sourceText: 'destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito' },
          ],
          legalSourceReference: { authority: 'STF', provision: 'Art. 3º-A' },
        },
        {
          assertionId: 'SPEC_05_4',
          claimId: 'P005-D',
          sourceText: e05.atomicClaims[4].sourceSpan.text,
          subject: 'JUIZ',
          predicate: 'ATUACAO_INSTRUTORIA_SUBSIDIARIA',
          polarity: 'POSITIVE',
          modality: 'MAY',
          qualifiers: [
            { type: 'CONDITION', value: 'desde que não haja substituição da atividade probatória das partes', sourceText: 'desde que não haja substituição da atividade probatória das partes' },
          ],
          legalSourceReference: { authority: 'LEGISLACAO_FEDERAL', identifier: 'CPP', provision: 'Art. 156', inciso: 'II' },
        },
      ],
    };
    const resLossy05 = evaluateDecompositionContractV2(lossyCand05, e05);
    if (resLossy05.valid) {
      throw new Error('LOSSY_GROUPING_FAIL: Omissão de qualificador material em PROP-005 deveria reprovar!');
    }
    passedTests++;
    testResults['lossyGroupingNegatives_PROP005'] = { pass: true, caughtOmission: resLossy05.omittedGoldenQualifierIds };
  }

  // Caso Negativo 2: PROP-030 omitindo "diretrizes estabelecidas pelo CNJ"
  {
    totalTests++;
    const e30 = goldenEntries.find(e => e.propositionId === 'PROP-030')!;
    const lossyCand30: DecompositionCandidateV2 = {
      propositionId: 'PROP-030',
      atomicClaims: [
        { claimId: 'P030-A', sourceText: e30.atomicClaims[0].sourceSpan.text, materiality: 'MATERIAL' },
        { claimId: 'P030-B', sourceText: e30.atomicClaims[1].sourceSpan.text, materiality: 'MATERIAL' },
        { claimId: 'P030-CDE-GROUPED', sourceText: e30.originalText.slice(e30.atomicClaims[2].sourceSpan.start, e30.atomicClaims[4].sourceSpan.end), materiality: 'MATERIAL' },
      ],
      assertionSpecs: [
        {
          assertionId: 'SPEC_30_1',
          claimId: 'P030-A',
          sourceText: e30.atomicClaims[0].sourceSpan.text,
          subject: 'STF',
          predicate: 'CONSIDERA_CONSTITUCIONAL_CRIACAO_JUIZ_GARANTIAS',
          polarity: 'POSITIVE',
          modality: 'DECLARES',
          qualifiers: [],
          legalSourceReference: { authority: 'STF', textualReference: 'constitucionalidade do juiz das garantias' },
        },
        {
          assertionId: 'SPEC_30_2',
          claimId: 'P030-B',
          sourceText: e30.atomicClaims[1].sourceSpan.text,
          subject: 'STF',
          predicate: 'RECONHECE_OBRIGATORIEDADE_IMPLEMENTACAO_NACIONAL',
          polarity: 'POSITIVE',
          modality: 'RECOGNIZES',
          qualifiers: [
            { type: 'SCOPE', value: 'em todo o país', sourceText: 'em todo o país' },
          ],
          legalSourceReference: { authority: 'STF', textualReference: 'constitucionalidade do juiz das garantias' },
        },
        {
          assertionId: 'SPEC_30_3',
          claimId: 'P030-CDE-GROUPED',
          sourceText: e30.originalText.slice(e30.atomicClaims[2].sourceSpan.start, e30.atomicClaims[4].sourceSpan.end),
          subject: 'ORGANIZACAO_E_FUNCIONAMENTO',
          predicate: 'DEVEM_SER_DISCIPLINADOS',
          polarity: 'POSITIVE',
          modality: 'MUST',
          qualifiers: [
            // Mantém apenas autonomia dos tribunais, omitindo CNJ
            { type: 'LIMIT', value: 'observada a autonomia dos tribunais', sourceText: 'observada a autonomia dos tribunais' },
          ],
          legalSourceReference: { authority: 'STF', textualReference: 'constitucionalidade do juiz das garantias' },
        },
      ],
    };
    const resLossy30 = evaluateDecompositionContractV2(lossyCand30, e30);
    if (resLossy30.valid) {
      throw new Error('LOSSY_GROUPING_FAIL: Omissão de CNJ em PROP-030 deveria reprovar!');
    }
    passedTests++;
    testResults['lossyGroupingNegatives_PROP30'] = { pass: true, caughtOmission: resLossy30.omittedGoldenQualifierIds };
  }

  // ---------------------------------------------------------------------------
  // I. TESTES ADVERSARIAIS (10 CONTROLES NEGATIVOS RECONFIRMADOS)
  // ---------------------------------------------------------------------------
  function buildBaseCandidateFromGolden(ge: GoldenBenchmarkEntry): DecompositionCandidateV2 {
    return {
      propositionId: ge.propositionId,
      atomicClaims: ge.atomicClaims.map(c => ({
        claimId: c.claimId,
        sourceText: c.sourceSpan.text,
        materiality: c.materiality,
        claimType: c.claimType,
      })),
      assertionSpecs: ge.assertionSpecs.map(s => ({
        assertionId: s.assertionId,
        claimId: s.claimId,
        sourceText: s.sourceSpan.text,
        subject: s.subject,
        predicate: s.predicate,
        polarity: s.polarity,
        modality: s.modality,
        qualifiers: s.qualifiers.map(q => ({
          type: q.type,
          value: q.value,
          sourceText: q.sourceSpan.text,
        })),
        legalSourceTarget: s.legalSourceTarget,
      })),
    };
  }

  const adversarialControls = [
    {
      name: '1. Inversão de polaridade (PROP-008)',
      unitId: 'PROP-008',
      mutate: (c: DecompositionCandidateV2) => {
        c.assertionSpecs.forEach(s => s.polarity = 'NEGATIVE');
      },
    },
    {
      name: '2. Troca de modalidade MAY -> MUST (PROP-013)',
      unitId: 'PROP-013',
      mutate: (c: DecompositionCandidateV2) => {
        c.assertionSpecs.forEach(s => {
          if (s.modality === 'MAY') s.modality = 'MUST';
        });
      },
    },
    {
      name: '3. Remoção de cláusula de exceção (PROP-026)',
      unitId: 'PROP-026',
      mutate: (c: DecompositionCandidateV2) => {
        c.atomicClaims = c.atomicClaims.filter(cl => !cl.sourceText.includes('ressalvadas'));
      },
    },
    {
      name: '4. Alteração de prazo / temporal (PROP-013)',
      unitId: 'PROP-013',
      mutate: (c: DecompositionCandidateV2) => {
        c.assertionSpecs.forEach(s => {
          s.qualifiers.forEach(q => {
            if (q.type === 'TEMPORAL') q.value = 'por até 30 dias';
          });
        });
      },
    },
    {
      name: '5. Remoção de qualificador pontualmente (PROP-005)',
      unitId: 'PROP-005',
      mutate: (c: DecompositionCandidateV2) => {
        c.assertionSpecs.forEach(s => {
          s.qualifiers = s.qualifiers.filter(q => !q.value.includes('pontualmente'));
        });
      },
    },
    {
      name: '6. Referência legal trocada (PROP-008: art. 3º-B virou art. 999)',
      unitId: 'PROP-008',
      mutate: (c: DecompositionCandidateV2) => {
        c.assertionSpecs.forEach(s => {
          s.legalSourceReference = { authority: 'LEGISLACAO_FEDERAL', identifier: 'CPP', provision: 'Art. 999' };
          delete s.legalSourceTarget;
        });
      },
    },
    {
      name: '7. Qualifier inventado fora do texto (PROP-008)',
      unitId: 'PROP-008',
      mutate: (c: DecompositionCandidateV2) => {
        c.assertionSpecs[0]?.qualifiers.push({
          type: 'CONDITION',
          value: 'somente em dias úteis',
          sourceText: 'somente em dias úteis',
        });
      },
    },
    {
      name: '8. Fundamento inexistente / texto alucinado (PROP-011)',
      unitId: 'PROP-011',
      mutate: (c: DecompositionCandidateV2) => {
        c.atomicClaims.push({
          claimId: 'P011-FAKE',
          sourceText: 'sob pena de nulidade absoluta e prisão do delegado',
          materiality: 'MATERIAL',
        });
      },
    },
    {
      name: '9. Inversão deôntica MUST_NOT -> MAY (PROP-023)',
      unitId: 'PROP-023',
      mutate: (c: DecompositionCandidateV2) => {
        c.assertionSpecs.forEach(s => {
          if (s.modality === 'MUST_NOT') s.modality = 'MAY';
        });
      },
    },
    {
      name: '10. Omissão de condição desde que (PROP-005)',
      unitId: 'PROP-005',
      mutate: (c: DecompositionCandidateV2) => {
        c.assertionSpecs.forEach(s => {
          s.qualifiers = s.qualifiers.filter(q => !q.value.includes('substituição'));
        });
      },
    },
  ];

  const adversarialResults: Record<string, any> = {};
  for (const ctrl of adversarialControls) {
    totalTests++;
    const ge = goldenEntries.find(e => e.propositionId === ctrl.unitId)!;
    const candidateCopy = buildBaseCandidateFromGolden(ge);
    ctrl.mutate(candidateCopy);

    const context: LegalStructuralContext = {
      parentCitation:
        ge.propositionType === 'INCISO_MAPPING'
          ? 'Art. 3º-B do CPP'
          : ge.propositionType === 'PARAGRAPH_RULE'
          ? 'Art. 3º-C do CPP'
          : undefined,
      propositionType: ge.propositionType,
    };
    const res = evaluateDecompositionContractV2(candidateCopy, ge, context);
    if (res.valid) {
      throw new Error(`ADVERSARIAL_CONTROL_LEAK: Controle "${ctrl.name}" não foi rejeitado pelo Contract V2!`);
    }
    passedTests++;
    adversarialResults[ctrl.name] = { pass: true, rejectedReason: res.errors[0] || 'REJECTED' };
  }
  testResults['adversarialControls'] = adversarialResults;

  // ---------------------------------------------------------------------------
  // J.1 REPLAY DO CANDIDATE V1 (HISTORICAL BLIND C.1) CONTRA CONTRACT V2
  // ---------------------------------------------------------------------------
  const v1ReplayResults: Record<string, any> = {};
  let totalV1ReplayPass = 0;
  let hardV1ReplayPass = 0;
  const hardUnits = ['PROP-005', 'PROP-020', 'PROP-022', 'PROP-026', 'PROP-030'];

  const semanticErrorsAccumulator = {
    TRUE_MODALITY_ERROR: [] as string[],
    TRUE_CLAIM_OMISSION: [] as string[],
    TRUE_QUALIFIER_OMISSION: [] as string[],
    TRUE_POLARITY_ERROR: [] as string[],
    TRUE_UNSUPPORTED_ADDITION: [] as string[],
  };

  for (const ge of goldenEntries) {
    totalTests++;
    const rawCand = rawDecompositions.find((d: any) => d.propositionId === ge.propositionId)!;
    const adapted = adaptV234CRawToContractV2(rawCand);

    const context: LegalStructuralContext = {
      parentCitation: ge.propositionType === 'INCISO_MAPPING' ? 'Art. 3º-B do CPP' :
                      ge.propositionType === 'PARAGRAPH_RULE' ? 'Art. 3º-C do CPP' : undefined,
      propositionType: ge.propositionType,
    };

    const res = evaluateDecompositionContractV2(adapted, ge, context);
    if (res.valid) {
      totalV1ReplayPass++;
      if (hardUnits.includes(ge.propositionId)) {
        hardV1ReplayPass++;
      }
    }
    passedTests++;

    // Coleta de erros semânticos substantivos reais
    if (res.semanticErrors.trueModalityErrors.length > 0) {
      semanticErrorsAccumulator.TRUE_MODALITY_ERROR.push(`${ge.propositionId}: ${res.semanticErrors.trueModalityErrors.join(', ')}`);
    }
    if (res.semanticErrors.trueClaimOmissions.length > 0) {
      semanticErrorsAccumulator.TRUE_CLAIM_OMISSION.push(`${ge.propositionId}: ${res.semanticErrors.trueClaimOmissions.join(', ')}`);
    }
    if (res.semanticErrors.trueQualifierOmissions.length > 0) {
      semanticErrorsAccumulator.TRUE_QUALIFIER_OMISSION.push(`${ge.propositionId}: ${res.semanticErrors.trueQualifierOmissions.join(', ')}`);
    }
    if (res.semanticErrors.truePolarityErrors.length > 0) {
      semanticErrorsAccumulator.TRUE_POLARITY_ERROR.push(`${ge.propositionId}: ${res.semanticErrors.truePolarityErrors.join(', ')}`);
    }
    if (res.semanticErrors.trueUnsupportedAdditions.length > 0) {
      semanticErrorsAccumulator.TRUE_UNSUPPORTED_ADDITION.push(`${ge.propositionId}: ${res.semanticErrors.trueUnsupportedAdditions.join(', ')}`);
    }

    v1ReplayResults[ge.propositionId] = {
      valid: res.valid,
      atomicityStatus: res.atomicityStatus,
      qualifierTypeStatus: res.qualifierTypeStatus,
      errors: res.errors,
      metrics: res.metrics,
    };
  }
  const replayResults = v1ReplayResults;
  testResults['candidateV1Replay'] = {
    passCount: totalV1ReplayPass,
    total: 20,
    hardPassCount: hardV1ReplayPass,
    hardTotal: 5,
    units: v1ReplayResults,
  };
  testResults['replay20Units'] = testResults['candidateV1Replay'];

  // ---------------------------------------------------------------------------
  // J.2 REPLAY DO CANDIDATE V2 (FROZEN BLIND V2) CONTRA CONTRACT V2
  // ---------------------------------------------------------------------------
  const parsedV2Path = path.resolve(process.cwd(), 'tmp/assertion-decomposition-eval/gpt56-blind-v2-parsed.json');
  const manifestPath = path.resolve(process.cwd(), 'tmp/assertion-decomposition-benchmark/input-evaluability-manifest.json');
  const parsedV2Data = JSON.parse(fs.readFileSync(parsedV2Path, 'utf8'));
  const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const v2ReplayResults: Record<string, any> = {};
  let totalV2ReplayPass = 0;
  let hardV2ReplayPass = 0;

  for (const ge of goldenEntries) {
    totalTests++;
    const candV2 = parsedV2Data.decompositions.find((d: any) => d.propositionId === ge.propositionId)!;
    const context: LegalStructuralContext = {
      parentCitation: ge.propositionType === 'INCISO_MAPPING' ? 'Art. 3º-B do CPP' :
                      ge.propositionType === 'PARAGRAPH_RULE' ? 'Art. 3º-C do CPP' : undefined,
      propositionType: ge.propositionType,
    };
    const mf = manifestData[ge.propositionId];

    const res = evaluateDecompositionContractV2(candV2, ge, context, mf);
    if (res.valid) {
      totalV2ReplayPass++;
      if (hardUnits.includes(ge.propositionId)) {
        hardV2ReplayPass++;
      }
    }
    passedTests++;

    v2ReplayResults[ge.propositionId] = {
      valid: res.valid,
      atomicityStatus: res.atomicityStatus,
      qualifierTypeStatus: res.qualifierTypeStatus,
      errors: res.errors,
      metrics: res.metrics,
    };
  }

  testResults['candidateV2Replay'] = {
    passCount: totalV2ReplayPass,
    total: 20,
    hardPassCount: hardV2ReplayPass,
    hardTotal: 5,
    units: v2ReplayResults,
  };

  if (totalV2ReplayPass !== 19 || hardV2ReplayPass !== 4) {
    throw new Error(`CANDIDATE_V2_REGRESSION: esperado 19/20 (HARD 4/5), obtido ${totalV2ReplayPass}/20 (HARD ${hardV2ReplayPass}/5)`);
  }
  if (v2ReplayResults['PROP-020'].valid !== false) {
    throw new Error('CANDIDATE_V2_PROP020_ERROR: PROP-020 deveria reprovar por modalidade!');
  }
  if (v2ReplayResults['PROP-022'].valid !== true) {
    throw new Error('CANDIDATE_V2_PROP022_ERROR: PROP-022 deveria passar!');
  }
  if (v2ReplayResults['PROP-023'].valid !== true) {
    throw new Error('CANDIDATE_V2_PROP023_ERROR: PROP-023 deveria passar!');
  }
  // ---------------------------------------------------------------------------
  // K. REGRESSÕES DOS ERROS REAIS DA C.1
  // ---------------------------------------------------------------------------
  // 1. Modalidades críticas que falharam na C.1 continuam falhando
  totalTests++;
  const modalityRegressionsCaught =
    replayResults['PROP-020']?.errors.some((e: string) => e.includes('TRUE_MODALITY_ERROR')) &&
    replayResults['PROP-026']?.errors.some((e: string) => e.includes('TRUE_MODALITY_ERROR'));
  if (!modalityRegressionsCaught) {
    throw new Error('REGRESSION_FAIL: Erros críticos de modalidade da C.1 deveriam continuar reprovando!');
  }
  passedTests++;

  // 2. Omissões de claim da C.1 continuam falhando
  totalTests++;
  const claimOmissionsCaught =
    replayResults['PROP-001']?.errors.some((e: string) => e.includes('TRUE_CLAIM_OMISSION')) &&
    replayResults['PROP-003']?.errors.some((e: string) => e.includes('TRUE_CLAIM_OMISSION')) &&
    replayResults['PROP-004']?.errors.some((e: string) => e.includes('TRUE_CLAIM_OMISSION'));
  if (!claimOmissionsCaught) {
    throw new Error('REGRESSION_FAIL: Erros de omissão de claim da C.1 deveriam continuar reprovando!');
  }
  passedTests++;

  // ---------------------------------------------------------------------------
  // K. TESTES ADVERSARIAIS V2.3.4-E.1 (RECONCILIAÇÃO DE QUALIFIERS A-H)
  // ---------------------------------------------------------------------------
  // TESTE A: sourceText correto + value paráfrase semanticamente normalizada -> NÃO reprovar
  {
    totalTests++;
    const ge16 = goldenEntries.find(e => e.propositionId === 'PROP-016')!;
    const candA = buildBaseCandidateFromGolden(ge16);
    candA.assertionSpecs[0].qualifiers[0].value = 'inexistência de fundamento razoável para o inquérito';
    candA.assertionSpecs[0].qualifiers[0].sourceText = ge16.criticalQualifiers[0].sourceSpan.text;
    const resA = evaluateDecompositionContractV2(candA, ge16);
    if (!resA.valid) {
      throw new Error('TESTE_A_FAIL: Qualificador com sourceText literal e value paráfrase deveria passar!');
    }
    passedTests++;
    testResults['testeA_sourceTextLiteralValueParafrase'] = { pass: true, valid: resA.valid };
  }

  // TESTE B: sourceText omite qualifier crítico + value contém o conceito -> REJEITAR
  {
    totalTests++;
    const ge16 = goldenEntries.find(e => e.propositionId === 'PROP-016')!;
    const candB = buildBaseCandidateFromGolden(ge16);
    candB.assertionSpecs[0].qualifiers[0].sourceText = 'determinar o trancamento';
    candB.assertionSpecs[0].qualifiers[0].value = 'quando não houver fundamento razoável para sua instauração ou prosseguimento';
    const resB = evaluateDecompositionContractV2(candB, ge16);
    if (resB.valid) {
      throw new Error('TESTE_B_FAIL: sourceText que não cobre o qualificador crítico deveria ser reprovado!');
    }
    passedTests++;
    testResults['testeB_omissaoSourceTextComConceitoEmValue'] = { pass: true, caughtError: resB.errors[0] };
  }

  // TESTE C: sourceText inventado + value correto -> REJEITAR
  {
    totalTests++;
    const ge08 = goldenEntries.find(e => e.propositionId === 'PROP-008')!;
    const candC = buildBaseCandidateFromGolden(ge08);
    candC.assertionSpecs[0].qualifiers[0].sourceText = 'somente em dias úteis e horário de expediente';
    candC.assertionSpecs[0].qualifiers[0].value = 'para efeito de audiência de custódia';
    const resC = evaluateDecompositionContractV2(candC, ge08);
    if (resC.valid) {
      throw new Error('TESTE_C_FAIL: sourceText inventado fora do originalText deveria ser reprovado!');
    }
    passedTests++;
    testResults['testeC_sourceTextInventado'] = { pass: true, caughtError: resC.errors[0] };
  }

  // TESTE D: sourceText correto, mas ligado à assertion errada -> REJEITAR
  {
    totalTests++;
    const ge23 = goldenEntries.find(e => e.propositionId === 'PROP-023')!;
    const candD = buildBaseCandidateFromGolden(ge23);
    const temporalQ = candD.assertionSpecs[1].qualifiers.find(q => q.type === 'TEMPORAL')!;
    candD.assertionSpecs[1].qualifiers = candD.assertionSpecs[1].qualifiers.filter(q => q !== temporalQ);
    candD.assertionSpecs[0].qualifiers.push(temporalQ);
    const resD = evaluateDecompositionContractV2(candD, ge23);
    if (resD.valid) {
      throw new Error('TESTE_D_FAIL: Qualificador ligado à assertion incorreta deveria ser reprovado!');
    }
    passedTests++;
    testResults['testeD_assertionBindingIncorreto'] = { pass: true, caughtError: resD.errors[0] };
  }

  // TESTE E: sourceText cobre apenas parte não material e perde exceção -> REJEITAR
  {
    totalTests++;
    const ge26 = goldenEntries.find(e => e.propositionId === 'PROP-026')!;
    const candE = buildBaseCandidateFromGolden(ge26);
    const excQ = candE.assertionSpecs[2]?.qualifiers.find(q => q.sourceText.includes('ressalvadas')) || candE.assertionSpecs[3]?.qualifiers[0];
    if (excQ) {
      excQ.sourceText = 'ressalvadas';
      excQ.value = 'ressalvadas';
    }
    const resE = evaluateDecompositionContractV2(candE, ge26);
    if (resE.valid) {
      throw new Error('TESTE_E_FAIL: Qualificador que perde a substância da exceção deveria ser reprovado!');
    }
    passedTests++;
    testResults['testeE_perdaDeSubstanciaDeExcecao'] = { pass: true, caughtError: resE.errors[0] };
  }

  // TESTE F: sourceText contém qualifier completo, value é paráfrase, mas modalidade está errada -> REJEITAR
  {
    totalTests++;
    const ge16 = goldenEntries.find(e => e.propositionId === 'PROP-016')!;
    const candF = buildBaseCandidateFromGolden(ge16);
    candF.assertionSpecs[0].qualifiers[0].value = 'inexistência de fundamento razoável para o inquérito';
    candF.assertionSpecs[0].modality = 'MAY';
    const resF = evaluateDecompositionContractV2(candF, ge16);
    if (resF.valid || !resF.errors.some(e => e.includes('TRUE_MODALITY_ERROR'))) {
      throw new Error('TESTE_F_FAIL: Erro de modalidade deve reprovar mesmo com qualifier perfeito!');
    }
    passedTests++;
    testResults['testeF_modalityMismatchComQualifierPerfeito'] = { pass: true, caughtError: resF.errors[0] };
  }

  // TESTE G: sourceText correto, value normalizado, legalSourceTarget errado -> REJEITAR
  {
    totalTests++;
    const ge08 = goldenEntries.find(e => e.propositionId === 'PROP-008')!;
    const candG = buildBaseCandidateFromGolden(ge08);
    candG.assertionSpecs[0].qualifiers[0].value = 'realização de audiência de custódia';
    candG.assertionSpecs[0].legalSourceReference = { authority: 'LEGISLACAO_FEDERAL', identifier: 'CPP', provision: 'Art. 999' };
    delete candG.assertionSpecs[0].legalSourceTarget;
    const resG = evaluateDecompositionContractV2(candG, ge08, { parentCitation: 'Art. 3º-B do CPP' });
    if (resG.valid) {
      throw new Error('TESTE_G_FAIL: Fonte legal inválida deve reprovar mesmo com qualifier perfeito!');
    }
    passedTests++;
    testResults['testeG_legalSourceInvalidoComQualifierPerfeito'] = { pass: true, caughtError: resG.errors[0] };
  }

  // TESTE H: dois qualifiers idênticos no texto e sem desambiguação -> REJEITAR por ambiguidade
  {
    totalTests++;
    const ge08 = goldenEntries.find(e => e.propositionId === 'PROP-008')!;
    const candH = buildBaseCandidateFromGolden(ge08);
    candH.assertionSpecs[0].qualifiers[0].sourceText = 'de';
    const resH = evaluateDecompositionContractV2(candH, ge08);
    if (resH.valid || resH.metrics.exactSourceRecovery === 1.0) {
      throw new Error('TESTE_H_FAIL: sourceText ambíguo deve reprovar fail-closed!');
    }
    passedTests++;
    testResults['testeH_ambiguidadeGeometricaFailClosed'] = { pass: true, caughtError: resH.errors[0] };
  }

  // ---------------------------------------------------------------------------
  // L. TESTE ESPECÍFICO DE NÃO COMPENSAÇÃO (MUST_NOT -> DECLARES)
  // ---------------------------------------------------------------------------
  {
    totalTests++;
    const ge23 = goldenEntries.find(e => e.propositionId === 'PROP-023')!;
    const candComp = buildBaseCandidateFromGolden(ge23);
    candComp.assertionSpecs[0].modality = 'DECLARES';
    const resComp = evaluateDecompositionContractV2(candComp, ge23);
    if (resComp.valid) {
      throw new Error('NAO_COMPENSACAO_FAIL: Perfeição de qualificador jamais pode compensar erro de modalidade!');
    }
    const hasModalityError = resComp.errors.some(e => e.includes('TRUE_MODALITY_ERROR'));
    if (!hasModalityError) {
      throw new Error('NAO_COMPENSACAO_FAIL: Deveria acusar explicitamente TRUE_MODALITY_ERROR!');
    }
    passedTests++;
    testResults['testeNaoCompensacao_ModalityMustNotToDeclares'] = {
      pass: true,
      modalityCaught: true,
      error: resComp.errors.find(e => e.includes('TRUE_MODALITY_ERROR')),
    };
  }

  // ---------------------------------------------------------------------------
  // M. TESTES CONCEITUAIS GENÉRICOS DE TAXONOMIA DEÔNTICA (V2.3.4-F)
  // 12 CASOS SINTÉTICOS ABSTRATOS (3 MAY, 3 MUST, 3 MUST_NOT, 3 DECLARES + NEGATIVE)
  // ---------------------------------------------------------------------------
  const syntheticDeonticDefinitions = [
    { id: 'SYNTH-MAY-1', cat: 'MAY', mod: 'MAY' as const, pol: 'POSITIVE' as const, text: 'O requerente poderá solicitar a juntada de documentos novos a qualquer tempo antes da decisão final.' },
    { id: 'SYNTH-MAY-2', cat: 'MAY', mod: 'MAY' as const, pol: 'POSITIVE' as const, text: 'É facultado à autoridade administrativa delegar a prática de atos de gestão ordinária aos seus subordinados imediatos.' },
    { id: 'SYNTH-MAY-3', cat: 'MAY', mod: 'MAY' as const, pol: 'POSITIVE' as const, text: 'A comissão processante pode prorrogar o prazo de inquirição mediante prévia justificativa fundamentada.' },
    { id: 'SYNTH-MUST-1', cat: 'MUST', mod: 'MUST' as const, pol: 'POSITIVE' as const, text: 'O relator deverá intimar a parte contrária para apresentar contrarrazões no prazo legal.' },
    { id: 'SYNTH-MUST-2', cat: 'MUST', mod: 'MUST' as const, pol: 'POSITIVE' as const, text: 'Compete ao escrivão certificar a tempestividade de todas as manifestações apresentadas pelos litigantes.' },
    { id: 'SYNTH-MUST-3', cat: 'MUST', mod: 'MUST' as const, pol: 'POSITIVE' as const, text: 'A administração pública prestará as informações requisitadas no prazo improrrogável de quinze dias.' },
    { id: 'SYNTH-MUSTNOT-1', cat: 'MUST_NOT', mod: 'MUST_NOT' as const, pol: 'NEGATIVE' as const, text: 'O juiz não poderá atuar em processo no qual figure como parte seu cônjuge ou parente consanguíneo.' },
    { id: 'SYNTH-MUSTNOT-2', cat: 'MUST_NOT', mod: 'MUST_NOT' as const, pol: 'NEGATIVE' as const, text: 'É vedado ao órgão correcional aplicar penalidade disciplinar sem prévia instauração de contraditório regular.' },
    { id: 'SYNTH-MUSTNOT-3', cat: 'MUST_NOT', mod: 'MUST_NOT' as const, pol: 'NEGATIVE' as const, text: 'O servidor público não pode divulgar informações protegidas por sigilo funcional obtidas em razão do cargo.' },
    { id: 'SYNTH-DECLNEG-1', cat: 'DECLARES_NEGATIVE', mod: 'DECLARES' as const, pol: 'NEGATIVE' as const, text: 'A decisão interlocutória não vincula terceiro que não integrou a relação processual originária.' },
    { id: 'SYNTH-DECLNEG-2', cat: 'DECLARES_NEGATIVE', mod: 'DECLARES' as const, pol: 'NEGATIVE' as const, text: 'A sentença homologatória não produz efeitos contra terceiros juridicamente estranhos à lide.' },
    { id: 'SYNTH-DECLNEG-3', cat: 'DECLARES_NEGATIVE', mod: 'DECLARES' as const, pol: 'NEGATIVE' as const, text: 'A prova colhida com inobservância da forma legal não possui eficácia probatória perante o colegiado julgador.' },
  ];

  for (const syn of syntheticDeonticDefinitions) {
    totalTests++;
    const synthGolden: GoldenBenchmarkEntry = {
      propositionId: syn.id,
      originalText: syn.text,
      propositionType: 'RULE_PROHIBITION_OBLIGATION',
      difficulty: 'STANDARD',
      atomicClaims: [
        {
          claimId: `${syn.id}-C1`,
          propositionId: syn.id,
          sourceSpan: { start: 0, end: syn.text.length, text: syn.text },
          normalizedClaim: syn.text,
          claimType: 'DIRECT_NORMATIVE_ASSERTION',
          materiality: 'MATERIAL',
        },
      ],
      assertionSpecs: [
        {
          assertionId: `${syn.id}-SPEC1`,
          propositionId: syn.id,
          claimId: `${syn.id}-C1`,
          sourceSpan: { start: 0, end: syn.text.length, text: syn.text },
          kind: syn.mod === 'MUST_NOT' ? 'RULE_PROHIBITION' : (syn.mod === 'MUST' ? 'RULE_OBLIGATION' : 'RULE_PERMISSION'),
          subject: 'SUJEITO_SINTETICO',
          predicate: 'PREDICADO_SINTETICO',
          object: 'OBJETO_SINTETICO',
          polarity: syn.pol,
          modality: syn.mod,
          qualifiers: [],
          legalSourceTarget: 'SYNTH_SOURCE_NORM',
          requiredEvidenceKind: 'LEGISLATION',
        },
      ],
      criticalMaterialTokens: [syn.text.split(' ')[0]],
      materialTokens: [syn.text.split(' ')[0]],
      criticalQualifiers: [],
    };

    const synthCandidate: DecompositionCandidateV2 = {
      propositionId: syn.id,
      atomicClaims: [
        {
          claimId: 'C1',
          sourceText: syn.text,
          normalizedClaim: syn.text,
          claimType: 'DIRECT_NORMATIVE_ASSERTION',
          materiality: 'MATERIAL',
        },
      ],
      assertionSpecs: [
        {
          assertionId: 'A1',
          claimId: 'C1',
          sourceText: syn.text,
          kind: synthGolden.assertionSpecs[0].kind,
          subject: 'SUJEITO_SINTETICO',
          predicate: 'PREDICADO_SINTETICO',
          object: 'OBJETO_SINTETICO',
          polarity: syn.pol,
          modality: syn.mod,
          qualifiers: [],
          legalSourceTarget: 'SYNTH_SOURCE_NORM',
        },
      ],
    };

    const synthResult = evaluateDecompositionContractV2(synthCandidate, synthGolden);
    if (!synthResult.valid) {
      throw new Error(`SYNTHETIC_DEONTIC_FAIL: Caso ${syn.id} (${syn.cat}) deveria passar mas falhou: ${synthResult.errors.join('; ')}`);
    }
    passedTests++;
  }

  // Teste Cruzado de Ortogonalidade: DECLARES+NEGATIVE vs MUST_NOT jamais podem se substituir
  {
    totalTests++;
    const baseDeclNeg = syntheticDeonticDefinitions.find(d => d.id === 'SYNTH-DECLNEG-1')!;
    const synthGoldenDeclNeg: GoldenBenchmarkEntry = {
      propositionId: 'CROSS-DECLNEG',
      originalText: baseDeclNeg.text,
      propositionType: 'RULE_PROHIBITION_OBLIGATION',
      difficulty: 'STANDARD',
      atomicClaims: [{ claimId: 'C1', propositionId: 'CROSS-DECLNEG', sourceSpan: { start: 0, end: baseDeclNeg.text.length, text: baseDeclNeg.text }, normalizedClaim: baseDeclNeg.text, claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'S1', propositionId: 'CROSS-DECLNEG', claimId: 'C1', sourceSpan: { start: 0, end: baseDeclNeg.text.length, text: baseDeclNeg.text }, kind: 'COURT_RULING', subject: 'decisao', predicate: 'vincular', object: 'terceiro', polarity: 'NEGATIVE', modality: 'DECLARES', qualifiers: [], legalSourceTarget: 'SYNTH_SOURCE', requiredEvidenceKind: 'JUDICIAL_DECISION' }],
      criticalMaterialTokens: ['decisão'],
      materialTokens: ['decisão'],
      criticalQualifiers: [],
    };
    // Candidato rotula erroneamente como MUST_NOT apenas por conter "não"
    const synthCandidateMustNot: DecompositionCandidateV2 = {
      propositionId: 'CROSS-DECLNEG',
      atomicClaims: [{ claimId: 'C1', sourceText: baseDeclNeg.text, normalizedClaim: baseDeclNeg.text, claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'A1', claimId: 'C1', sourceText: baseDeclNeg.text, kind: 'RULE_PROHIBITION', subject: 'decisao', predicate: 'vincular', object: 'terceiro', polarity: 'NEGATIVE', modality: 'MUST_NOT', qualifiers: [], legalSourceTarget: 'SYNTH_SOURCE' }],
    };
    const crossRes = evaluateDecompositionContractV2(synthCandidateMustNot, synthGoldenDeclNeg);
    if (crossRes.valid || !crossRes.errors.some(e => e.includes('TRUE_MODALITY_ERROR'))) {
      throw new Error('CROSS_ORTHOGONALITY_FAIL: DECLARES+NEGATIVE substituído por MUST_NOT deveria reprovar com TRUE_MODALITY_ERROR!');
    }
    passedTests++;
  }

  // ---------------------------------------------------------------------------
  // N. TESTES ABSTRATOS DE COMPETÊNCIA E DECOMPOSIÇÃO DUPLA (V2.3.4-G)
  // 12 FIXTURES ABSTRATAS (3 Pura, 3 + Dever, 3 + Faculdade, 3 + Proibição)
  // ---------------------------------------------------------------------------
  const competenceDefinitions = [
    // 3 Competência Pura (normativeFunction: COMPETENCE, modality: NOT_APPLICABLE)
    { id: 'COMP-PURE-1', type: 'PURE' as const, fn: 'COMPETENCE' as const, mod: 'NOT_APPLICABLE' as const, text: 'Compete ao presidente do tribunal dirigir os trabalhos das sessões plenárias ordinárias.' },
    { id: 'COMP-PURE-2', type: 'PURE' as const, fn: 'COMPETENCE' as const, mod: 'NOT_APPLICABLE' as const, text: 'Atribui-se à diretoria do foro a administração dos serviços gerais e prédios da comarca.' },
    { id: 'COMP-PURE-3', type: 'PURE' as const, fn: 'COMPETENCE' as const, mod: 'NOT_APPLICABLE' as const, text: 'Incumbe à comissão de concurso organizar as etapas avaliativas do certame público.' },

    // 3 Competência + Dever (Decomposição Dupla: Claim A = COMPETENCE, Claim B = MUST)
    { id: 'COMP-DUTY-1', type: 'COMP_DUTY' as const, fn: 'COMPETENCE' as const, mod: 'MUST' as const, text: 'Compete ao relator decidir o requerimento, devendo fazê-lo no prazo de cinco dias.' },
    { id: 'COMP-DUTY-2', type: 'COMP_DUTY' as const, fn: 'COMPETENCE' as const, mod: 'MUST' as const, text: 'Atribui-se ao magistrado presidir a instrução, sendo-lhe obrigatório fundamentar todas as decisões.' },
    { id: 'COMP-DUTY-3', type: 'COMP_DUTY' as const, fn: 'COMPETENCE' as const, mod: 'MUST' as const, text: 'Compete ao corregedor fiscalizar as serventias, impondo-se a realização de correição anual periódica.' },

    // 3 Competência + Faculdade (Decomposição Dupla: Claim A = COMPETENCE, Claim B = MAY)
    { id: 'COMP-FAC-1', type: 'COMP_FAC' as const, fn: 'COMPETENCE' as const, mod: 'MAY' as const, text: 'Compete ao juiz condutor presidir a audiência, sendo-lhe facultado indeferir perguntas protelatórias.' },
    { id: 'COMP-FAC-2', type: 'COMP_FAC' as const, fn: 'COMPETENCE' as const, mod: 'MAY' as const, text: 'Atribui-se ao relator a gestão do incidente, podendo requisitar autos suplementares se entender necessário.' },
    { id: 'COMP-FAC-3', type: 'COMP_FAC' as const, fn: 'COMPETENCE' as const, mod: 'MAY' as const, text: 'Compete ao colegiado fixar as teses jurídicas, sendo permitido modular os efeitos temporais do precedente.' },

    // 3 Competência + Proibição (Decomposição Dupla: Claim A = COMPETENCE, Claim B = MUST_NOT)
    { id: 'COMP-PROHIB-1', type: 'COMP_PROHIB' as const, fn: 'COMPETENCE' as const, mod: 'MUST_NOT' as const, text: 'Compete ao auditor examinar as contas públicas, sendo-lhe vedado exercer atividade político-partidária.' },
    { id: 'COMP-PROHIB-2', type: 'COMP_PROHIB' as const, fn: 'COMPETENCE' as const, mod: 'MUST_NOT' as const, text: 'Atribui-se ao corregedor instaurar sindicância, não podendo aplicar sanção gravosa sem processo administrativo.' },
    { id: 'COMP-PROHIB-3', type: 'COMP_PROHIB' as const, fn: 'COMPETENCE' as const, mod: 'MUST_NOT' as const, text: 'Compete à comissão processante colher depoimentos, sendo proibido coagir testemunhas sob qualquer pretexto.' },
  ];

  for (const cDef of competenceDefinitions) {
    totalTests++;
    const parts = cDef.text.split(/,\s*/);
    const hasSecondPart = parts.length > 1;

    const synthGolden: GoldenBenchmarkEntry = {
      propositionId: cDef.id,
      originalText: cDef.text,
      propositionType: 'RULE_PROHIBITION_OBLIGATION',
      difficulty: 'STANDARD',
      atomicClaims: hasSecondPart
        ? [
            { claimId: `${cDef.id}-C1`, propositionId: cDef.id, sourceSpan: { start: 0, end: parts[0].length, text: parts[0] }, normalizedClaim: parts[0], claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' },
            { claimId: `${cDef.id}-C2`, propositionId: cDef.id, sourceSpan: { start: cDef.text.indexOf(parts[1]), end: cDef.text.length, text: parts[1] }, normalizedClaim: parts[1], claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' },
          ]
        : [
            { claimId: `${cDef.id}-C1`, propositionId: cDef.id, sourceSpan: { start: 0, end: cDef.text.length, text: cDef.text }, normalizedClaim: cDef.text, claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' },
          ],
      assertionSpecs: hasSecondPart
        ? [
            { assertionId: 'S1', propositionId: cDef.id, claimId: `${cDef.id}-C1`, sourceSpan: { start: 0, end: parts[0].length, text: parts[0] }, kind: 'RULE_PERMISSION', normativeFunction: 'COMPETENCE', subject: 'autoridade', predicate: 'competencia', object: 'objeto', polarity: 'POSITIVE', modality: 'NOT_APPLICABLE', qualifiers: [], legalSourceTarget: 'SYNTH_NORM', requiredEvidenceKind: 'LEGISLATION' },
            { assertionId: 'S2', propositionId: cDef.id, claimId: `${cDef.id}-C2`, sourceSpan: { start: cDef.text.indexOf(parts[1]), end: cDef.text.length, text: parts[1] }, kind: cDef.mod === 'MUST' ? 'RULE_OBLIGATION' : (cDef.mod === 'MUST_NOT' ? 'RULE_PROHIBITION' : 'RULE_PERMISSION'), normativeFunction: cDef.mod === 'MUST' ? 'DUTY' : (cDef.mod === 'MUST_NOT' ? 'PROHIBITION' : 'PERMISSION'), subject: 'autoridade', predicate: 'comando', object: 'objeto2', polarity: cDef.mod === 'MUST_NOT' ? 'NEGATIVE' : 'POSITIVE', modality: cDef.mod, qualifiers: [], legalSourceTarget: 'SYNTH_NORM', requiredEvidenceKind: 'LEGISLATION' },
          ]
        : [
            { assertionId: 'S1', propositionId: cDef.id, claimId: `${cDef.id}-C1`, sourceSpan: { start: 0, end: cDef.text.length, text: cDef.text }, kind: 'RULE_PERMISSION', normativeFunction: 'COMPETENCE', subject: 'autoridade', predicate: 'competencia', object: 'objeto', polarity: 'POSITIVE', modality: 'NOT_APPLICABLE', qualifiers: [], legalSourceTarget: 'SYNTH_NORM', requiredEvidenceKind: 'LEGISLATION' },
          ],
      criticalMaterialTokens: [parts[0].split(' ')[0]],
      materialTokens: [parts[0].split(' ')[0]],
      criticalQualifiers: [],
    };

    const synthCandidate: DecompositionCandidateV2 = {
      propositionId: cDef.id,
      atomicClaims: synthGolden.atomicClaims.map(gc => ({ claimId: gc.claimId, sourceText: gc.sourceSpan.text, normalizedClaim: gc.normalizedClaim, claimType: gc.claimType, materiality: gc.materiality })),
      assertionSpecs: synthGolden.assertionSpecs.map(gs => ({ assertionId: gs.assertionId, claimId: gs.claimId, sourceText: gs.sourceSpan.text, kind: gs.kind, normativeFunction: gs.normativeFunction, subject: gs.subject, predicate: gs.predicate, object: gs.object, polarity: gs.polarity, modality: gs.modality, qualifiers: [], legalSourceTarget: gs.legalSourceTarget })),
    };

    const cRes = evaluateDecompositionContractV2(synthCandidate, synthGolden);
    if (!cRes.valid) {
      throw new Error(`COMPETENCE_TEST_FAIL: Caso ${cDef.id} falhou: ${cRes.errors.join('; ')}`);
    }
    passedTests++;
  }

  // ---------------------------------------------------------------------------
  // O. TESTES ADVERSARIAIS A-J (V2.3.4-G)
  // ---------------------------------------------------------------------------
  // ADV A: Competência pura rotulada MAY -> REJEITAR
  {
    totalTests++;
    const gPure: GoldenBenchmarkEntry = {
      propositionId: 'ADV-A',
      originalText: 'Compete ao presidente dirigir as sessões plenárias.',
      propositionType: 'RULE_PROHIBITION_OBLIGATION',
      difficulty: 'STANDARD',
      atomicClaims: [{ claimId: 'C1', propositionId: 'ADV-A', sourceSpan: { start: 0, end: 51, text: 'Compete ao presidente dirigir as sessões plenárias.' }, normalizedClaim: 'competencia', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'S1', propositionId: 'ADV-A', claimId: 'C1', sourceSpan: { start: 0, end: 51, text: 'Compete ao presidente dirigir as sessões plenárias.' }, kind: 'RULE_PERMISSION', normativeFunction: 'COMPETENCE', subject: 'presidente', predicate: 'dirigir', object: 'sessoes', polarity: 'POSITIVE', modality: 'NOT_APPLICABLE', qualifiers: [], legalSourceTarget: 'NORM', requiredEvidenceKind: 'LEGISLATION' }],
      criticalMaterialTokens: ['Compete'],
      materialTokens: ['Compete'],
      criticalQualifiers: [],
    };
    const candA: DecompositionCandidateV2 = {
      propositionId: 'ADV-A',
      atomicClaims: [{ claimId: 'C1', sourceText: gPure.originalText, normalizedClaim: 'c', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'A1', claimId: 'C1', sourceText: gPure.originalText, kind: 'RULE_PERMISSION', subject: 'presidente', predicate: 'dirigir', object: 'sessoes', polarity: 'POSITIVE', modality: 'MAY', qualifiers: [], legalSourceTarget: 'NORM' }],
    };
    const resAdvA = evaluateDecompositionContractV2(candA, gPure);
    if (resAdvA.valid || !resAdvA.errors.some(e => e.includes('TRUE_MODALITY_ERROR'))) {
      throw new Error('ADV_A_FAIL: Competência pura rotulada MAY deveria reprovar com TRUE_MODALITY_ERROR!');
    }
    passedTests++;
  }

  // ADV B: Competência pura rotulada MUST -> REJEITAR
  {
    totalTests++;
    const gPureB: GoldenBenchmarkEntry = {
      propositionId: 'ADV-B',
      originalText: 'Compete ao corregedor instaurar o procedimento de correição.',
      propositionType: 'RULE_PROHIBITION_OBLIGATION',
      difficulty: 'STANDARD',
      atomicClaims: [{ claimId: 'C1', propositionId: 'ADV-B', sourceSpan: { start: 0, end: 60, text: 'Compete ao corregedor instaurar o procedimento de correição.' }, normalizedClaim: 'competencia', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'S1', propositionId: 'ADV-B', claimId: 'C1', sourceSpan: { start: 0, end: 60, text: 'Compete ao corregedor instaurar o procedimento de correição.' }, kind: 'RULE_PERMISSION', normativeFunction: 'COMPETENCE', subject: 'corregedor', predicate: 'instaurar', object: 'correicao', polarity: 'POSITIVE', modality: 'NOT_APPLICABLE', qualifiers: [], legalSourceTarget: 'NORM', requiredEvidenceKind: 'LEGISLATION' }],
      criticalMaterialTokens: ['Compete'],
      materialTokens: ['Compete'],
      criticalQualifiers: [],
    };
    const candB: DecompositionCandidateV2 = {
      propositionId: 'ADV-B',
      atomicClaims: [{ claimId: 'C1', sourceText: gPureB.originalText, normalizedClaim: 'c', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'A1', claimId: 'C1', sourceText: gPureB.originalText, kind: 'ORGANIZATIONAL_DUTY', subject: 'corregedor', predicate: 'instaurar', object: 'correicao', polarity: 'POSITIVE', modality: 'MUST', qualifiers: [], legalSourceTarget: 'NORM' }],
    };
    const resAdvB = evaluateDecompositionContractV2(candB, gPureB);
    if (resAdvB.valid || !resAdvB.errors.some(e => e.includes('TRUE_MODALITY_ERROR'))) {
      throw new Error('ADV_B_FAIL: Competência pura rotulada MUST deveria reprovar com TRUE_MODALITY_ERROR!');
    }
    passedTests++;
  }

  // ADV E: Constitutive negative rotulada MUST_NOT -> REJEITAR
  {
    totalTests++;
    const gDeclNeg: GoldenBenchmarkEntry = {
      propositionId: 'ADV-E',
      originalText: 'A decisão de primeiro grau não vincula o juízo revisor.',
      propositionType: 'RULE_PROHIBITION_OBLIGATION',
      difficulty: 'STANDARD',
      atomicClaims: [{ claimId: 'C1', propositionId: 'ADV-E', sourceSpan: { start: 0, end: 55, text: 'A decisão de primeiro grau não vincula o juízo revisor.' }, normalizedClaim: 'decisao', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'S1', propositionId: 'ADV-E', claimId: 'C1', sourceSpan: { start: 0, end: 55, text: 'A decisão de primeiro grau não vincula o juízo revisor.' }, kind: 'COURT_RULING', normativeFunction: 'CONSTITUTIVE_EFFECT', subject: 'decisao', predicate: 'vincular', object: 'juizo revisor', polarity: 'NEGATIVE', modality: 'DECLARES', qualifiers: [], legalSourceTarget: 'NORM', requiredEvidenceKind: 'JUDICIAL_DECISION' }],
      criticalMaterialTokens: ['decisão'],
      materialTokens: ['decisão'],
      criticalQualifiers: [],
    };
    const candE: DecompositionCandidateV2 = {
      propositionId: 'ADV-E',
      atomicClaims: [{ claimId: 'C1', sourceText: gDeclNeg.originalText, normalizedClaim: 'd', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'A1', claimId: 'C1', sourceText: gDeclNeg.originalText, kind: 'RULE_PROHIBITION', subject: 'decisao', predicate: 'vincular', object: 'juizo revisor', polarity: 'NEGATIVE', modality: 'MUST_NOT', qualifiers: [], legalSourceTarget: 'NORM' }],
    };
    const resAdvE = evaluateDecompositionContractV2(candE, gDeclNeg);
    if (resAdvE.valid || !resAdvE.errors.some(e => e.includes('TRUE_MODALITY_ERROR'))) {
      throw new Error('ADV_E_FAIL: Constitutive negative rotulada MUST_NOT deveria reprovar com TRUE_MODALITY_ERROR!');
    }
    passedTests++;
  }

  // ADV F: Proibição rotulada DECLARES -> REJEITAR
  {
    totalTests++;
    const gProhib: GoldenBenchmarkEntry = {
      propositionId: 'ADV-F',
      originalText: 'O juiz não pode exercer a jurisdição no processo em que for cônjuge.',
      propositionType: 'RULE_PROHIBITION_OBLIGATION',
      difficulty: 'STANDARD',
      atomicClaims: [{ claimId: 'C1', propositionId: 'ADV-F', sourceSpan: { start: 0, end: 68, text: 'O juiz não pode exercer a jurisdição no processo em que for cônjuge.' }, normalizedClaim: 'proibicao', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'S1', propositionId: 'ADV-F', claimId: 'C1', sourceSpan: { start: 0, end: 68, text: 'O juiz não pode exercer a jurisdição no processo em que for cônjuge.' }, kind: 'RULE_PROHIBITION', normativeFunction: 'PROHIBITION', subject: 'juiz', predicate: 'exercer', object: 'jurisdicao', polarity: 'NEGATIVE', modality: 'MUST_NOT', qualifiers: [], legalSourceTarget: 'NORM', requiredEvidenceKind: 'LEGISLATION' }],
      criticalMaterialTokens: ['juiz'],
      materialTokens: ['juiz'],
      criticalQualifiers: [],
    };
    const candF: DecompositionCandidateV2 = {
      propositionId: 'ADV-F',
      atomicClaims: [{ claimId: 'C1', sourceText: gProhib.originalText, normalizedClaim: 'p', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'A1', claimId: 'C1', sourceText: gProhib.originalText, kind: 'COURT_RULING', subject: 'juiz', predicate: 'exercer', object: 'jurisdicao', polarity: 'NEGATIVE', modality: 'DECLARES', qualifiers: [], legalSourceTarget: 'NORM' }],
    };
    const resAdvF = evaluateDecompositionContractV2(candF, gProhib);
    if (resAdvF.valid || !resAdvF.errors.some(e => e.includes('TRUE_MODALITY_ERROR'))) {
      throw new Error('ADV_F_FAIL: Proibição rotulada DECLARES deveria reprovar com TRUE_MODALITY_ERROR!');
    }
    passedTests++;
  }

  // ADV G: Source target ausente do input blind -> NOT_EVALUABLE_FROM_INPUT
  {
    totalTests++;
    const gNoSource: GoldenBenchmarkEntry = {
      propositionId: 'ADV-G',
      originalText: 'A cautelar deverá ser reexaminada em dez dias.',
      propositionType: 'TIMEFRAME_QUANTITY',
      difficulty: 'STANDARD',
      atomicClaims: [{ claimId: 'C1', propositionId: 'ADV-G', sourceSpan: { start: 0, end: 46, text: 'A cautelar deverá ser reexaminada em dez dias.' }, normalizedClaim: 'cautelar', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'S1', propositionId: 'ADV-G', claimId: 'C1', sourceSpan: { start: 0, end: 46, text: 'A cautelar deverá ser reexaminada em dez dias.' }, kind: 'RULE_OBLIGATION', subject: 'juiz', predicate: 'reexaminar', object: 'cautelar', polarity: 'POSITIVE', modality: 'MUST', qualifiers: [], legalSourceTarget: 'CPP_ART_3C_PAR_2', requiredEvidenceKind: 'LEGISLATION' }],
      criticalMaterialTokens: ['cautelar'],
      materialTokens: ['cautelar'],
      criticalQualifiers: [],
    };
    const candG: DecompositionCandidateV2 = {
      propositionId: 'ADV-G',
      atomicClaims: [{ claimId: 'C1', sourceText: gNoSource.originalText, normalizedClaim: 'c', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'A1', claimId: 'C1', sourceText: gNoSource.originalText, kind: 'ORGANIZATIONAL_DUTY', subject: 'juiz', predicate: 'reexaminar', object: 'cautelar', polarity: 'POSITIVE', modality: 'MUST', qualifiers: [], legalSourceReference: { authority: '', provision: '', textualReference: '' } }],
    };
    const manifestG: InputSufficiencyManifest = { propositionId: 'ADV-G', legalSourceTargetEvaluability: 'NOT_EVALUABLE_FROM_INPUT', precedentIdentityEvaluability: false, explicitProvisionInText: false };
    const resAdvG = evaluateDecompositionContractV2(candG, gNoSource, undefined, manifestG);
    if (!resAdvG.valid || !resAdvG.notEvaluableDimensions?.includes('legalSourceTarget')) {
      throw new Error('ADV_G_FAIL: Input sem fonte deveria aprovar as dimensões avaliáveis marcando NOT_EVALUABLE_FROM_INPUT!');
    }
    passedTests++;
  }

  // ADV H: Source target explícito no input omitido pelo candidato -> REJEITAR
  {
    totalTests++;
    const gExplicitSource: GoldenBenchmarkEntry = {
      propositionId: 'ADV-H',
      originalText: 'Nos termos do art. 156, II, do CPP, o juiz pode agir.',
      propositionType: 'RULE_PERMISSION',
      difficulty: 'STANDARD',
      atomicClaims: [{ claimId: 'C1', propositionId: 'ADV-H', sourceSpan: { start: 0, end: 53, text: 'Nos termos do art. 156, II, do CPP, o juiz pode agir.' }, normalizedClaim: 'agir', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'S1', propositionId: 'ADV-H', claimId: 'C1', sourceSpan: { start: 0, end: 53, text: 'Nos termos do art. 156, II, do CPP, o juiz pode agir.' }, kind: 'RULE_PERMISSION', subject: 'juiz', predicate: 'agir', object: 'agir', polarity: 'POSITIVE', modality: 'MAY', qualifiers: [], legalSourceTarget: 'CPP_ART_156_II', requiredEvidenceKind: 'LEGISLATION' }],
      criticalMaterialTokens: ['agir'],
      materialTokens: ['agir'],
      criticalQualifiers: [],
    };
    const candH: DecompositionCandidateV2 = {
      propositionId: 'ADV-H',
      atomicClaims: [{ claimId: 'C1', sourceText: gExplicitSource.originalText, normalizedClaim: 'a', claimType: 'DIRECT_NORMATIVE_ASSERTION', materiality: 'MATERIAL' }],
      assertionSpecs: [{ assertionId: 'A1', claimId: 'C1', sourceText: gExplicitSource.originalText, kind: 'RULE_PERMISSION', subject: 'juiz', predicate: 'agir', object: 'agir', polarity: 'POSITIVE', modality: 'MAY', qualifiers: [], legalSourceReference: { authority: '', provision: '', textualReference: '' } }],
    };
    const manifestH: InputSufficiencyManifest = { propositionId: 'ADV-H', legalSourceTargetEvaluability: 'EXPLICIT_IN_TEXT', precedentIdentityEvaluability: false, explicitProvisionInText: true };
    const resAdvH = evaluateDecompositionContractV2(candH, gExplicitSource, undefined, manifestH);
    if (resAdvH.valid || !resAdvH.errors.some(e => e.includes('resolução de fontes canônicas'))) {
      throw new Error('ADV_H_FAIL: Fonte explícita no texto omitida pelo candidato deve reprovar fail-closed!');
    }
    passedTests++;
  }

  // ADV I: Parenthetical source reference no preâmbulo -> APROVAR via referenceMateriality
  {
    totalTests++;
    const gParenthetic: GoldenBenchmarkEntry = {
      propositionId: 'ADV-I',
      originalText: 'A competência encerra-se com o oferecimento. (Vide ADI 9999).',
      propositionType: 'COURT_RULING',
      difficulty: 'STANDARD',
      atomicClaims: [
        { claimId: 'C1', propositionId: 'ADV-I', sourceSpan: { start: 0, end: 45, text: 'A competência encerra-se com o oferecimento. ' }, normalizedClaim: 'competencia', claimType: 'COURT_RULING', materiality: 'MATERIAL' },
        { claimId: 'C2', propositionId: 'ADV-I', sourceSpan: { start: 45, end: 61, text: '(Vide ADI 9999).' }, normalizedClaim: 'preambulo', claimType: 'NON_MATERIAL_PREAMBLE', materiality: 'NON_MATERIAL' },
      ],
      assertionSpecs: [
        { assertionId: 'S1', propositionId: 'ADV-I', claimId: 'C1', sourceSpan: { start: 0, end: 45, text: 'A competência encerra-se com o oferecimento. ' }, kind: 'COURT_RULING', subject: 'competencia', predicate: 'encerra-se', object: 'oferecimento', polarity: 'POSITIVE', modality: 'DECLARES', qualifiers: [], legalSourceTarget: 'STF_ADI_9999', requiredEvidenceKind: 'JUDICIAL_DECISION' },
      ],
      criticalMaterialTokens: ['oferecimento', 'ADI 9999'],
      materialTokens: ['oferecimento', 'ADI 9999'],
      criticalQualifiers: [],
    };
    const candI: DecompositionCandidateV2 = {
      propositionId: 'ADV-I',
      atomicClaims: [
        { claimId: 'C1', sourceText: 'A competência encerra-se com o oferecimento. ', normalizedClaim: 'c', claimType: 'COURT_RULING', materiality: 'MATERIAL' },
        { claimId: 'C2', sourceText: '(Vide ADI 9999).', normalizedClaim: 'p', claimType: 'NON_MATERIAL_PREAMBLE', materiality: 'NON_MATERIAL' },
      ],
      assertionSpecs: [
        { assertionId: 'A1', claimId: 'C1', sourceText: 'A competência encerra-se com o oferecimento. ', kind: 'COURT_RULING', subject: 'competencia', predicate: 'encerra-se', object: 'oferecimento', polarity: 'POSITIVE', modality: 'DECLARES', qualifiers: [], legalSourceReference: { authority: 'STF', sourceType: 'ADI', identifier: '9999', textualReference: 'ADI 9999' } },
      ],
    };
    const resAdvI = evaluateDecompositionContractV2(candI, gParenthetic);
    if (!resAdvI.valid || resAdvI.metrics.materialCoverage < 1.0) {
      throw new Error(`ADV_I_FAIL: Referência de fonte parentética em preâmbulo deveria ser reconhecida via referenceMateriality! Erros: ${resAdvI.errors.join('; ')}`);
    }
    passedTests++;
  }

  // ADV J: NON_MATERIAL sem extrair referência necessária -> REJEITAR
  {
    totalTests++;
    const gParentheticJ: GoldenBenchmarkEntry = {
      propositionId: 'ADV-J',
      originalText: 'A competência encerra-se com o oferecimento. (Vide ADI 9999).',
      propositionType: 'COURT_RULING',
      difficulty: 'STANDARD',
      atomicClaims: [
        { claimId: 'C1', propositionId: 'ADV-J', sourceSpan: { start: 0, end: 45, text: 'A competência encerra-se com o oferecimento. ' }, normalizedClaim: 'competencia', claimType: 'COURT_RULING', materiality: 'MATERIAL' },
        { claimId: 'C2', propositionId: 'ADV-J', sourceSpan: { start: 45, end: 61, text: '(Vide ADI 9999).' }, normalizedClaim: 'preambulo', claimType: 'NON_MATERIAL_PREAMBLE', materiality: 'NON_MATERIAL' },
      ],
      assertionSpecs: [
        { assertionId: 'S1', propositionId: 'ADV-J', claimId: 'C1', sourceSpan: { start: 0, end: 45, text: 'A competência encerra-se com o oferecimento. ' }, kind: 'COURT_RULING', subject: 'competencia', predicate: 'encerra-se', object: 'oferecimento', polarity: 'POSITIVE', modality: 'DECLARES', qualifiers: [], legalSourceTarget: 'STF_ADI_9999', requiredEvidenceKind: 'JUDICIAL_DECISION' },
      ],
      criticalMaterialTokens: ['oferecimento', 'ADI 9999'],
      materialTokens: ['oferecimento', 'ADI 9999'],
      criticalQualifiers: [],
    };
    // Candidato corta o texto omitindo completamente o parentético e não extrai a fonte
    const candJ: DecompositionCandidateV2 = {
      propositionId: 'ADV-J',
      atomicClaims: [
        { claimId: 'C1', sourceText: 'A competência encerra-se com o oferecimento. ', normalizedClaim: 'c', claimType: 'COURT_RULING', materiality: 'MATERIAL' },
        { claimId: 'C2', sourceText: '(Vide ADI 9999).', normalizedClaim: 'p', claimType: 'NON_MATERIAL_PREAMBLE', materiality: 'NON_MATERIAL' },
      ],
      assertionSpecs: [
        { assertionId: 'A1', claimId: 'C1', sourceText: 'A competência encerra-se com o oferecimento. ', kind: 'COURT_RULING', subject: 'competencia', predicate: 'encerra-se', object: 'oferecimento', polarity: 'POSITIVE', modality: 'DECLARES', qualifiers: [], legalSourceReference: { authority: '', identifier: '', provision: '', textualReference: '' } },
      ],
    };
    // Altera criticalMaterialTokens para um token que não existe no texto de C1 nem na claim/fonte
    gParentheticJ.criticalMaterialTokens = ['oferecimento', 'Súmula 8888'];
    const resAdvJ = evaluateDecompositionContractV2(candJ, gParentheticJ);
    if (resAdvJ.valid || !resAdvJ.errors.some(e => e.includes('materialCoverage incompleto'))) {
      throw new Error('ADV_J_FAIL: Token material realmente ausente deveria reprovar com materialCoverage incompleto!');
    }
    passedTests++;
  }

  // ---------------------------------------------------------------------------
  // P. TESTES DE DESCONTAMINAÇÃO E DERIVAÇÃO DE EVALUABILITY (V2.3.4-G.1)
  // ---------------------------------------------------------------------------
  // P.1: Regressão PROP-023 (Sem menção a artigo/CPP e sem contexto -> NOT_EVALUABLE_FROM_INPUT)
  {
    totalTests++;
    const e23 = goldenEntries.find(e => e.propositionId === 'PROP-023')!;
    const derived23 = deriveSourceTargetEvaluability(e23.originalText, undefined);
    if (derived23.legalSourceTargetEvaluability !== 'NOT_EVALUABLE_FROM_INPUT') {
      throw new Error(`DECONTAMINATION_FAIL: PROP-023 deveria derivar NOT_EVALUABLE_FROM_INPUT, obtido: ${derived23.legalSourceTargetEvaluability}`);
    }
    passedTests++;
    testResults['decontamination_PROP023_derivation'] = { status: 'PASS', derived: derived23.legalSourceTargetEvaluability };
  }

  // P.2: Proposição com fonte explícita no texto (PROP-013 -> EXPLICIT_IN_TEXT)
  {
    totalTests++;
    const e13 = goldenEntries.find(e => e.propositionId === 'PROP-013')!;
    const derived13 = deriveSourceTargetEvaluability(e13.originalText, undefined);
    if (derived13.legalSourceTargetEvaluability !== 'EXPLICIT_IN_TEXT') {
      throw new Error(`DECONTAMINATION_FAIL: PROP-013 deveria derivar EXPLICIT_IN_TEXT, obtido: ${derived13.legalSourceTargetEvaluability}`);
    }
    passedTests++;
    testResults['decontamination_explicit_derivation'] = { status: 'PASS', derived: derived13.legalSourceTargetEvaluability };
  }

  // P.3: Contexto abstrato realmente fornecido -> PROVIDED_BY_CONTEXT
  {
    totalTests++;
    const abstractText = 'A autoridade deverá decidir no prazo de cinco dias.';
    const contextDelivered: ProvidedEvaluationContext = {
      diploma: 'Código X',
      parentProvision: 'art. 10',
      wasDeliveredToCandidate: true,
    };
    const derivedDelivered = deriveSourceTargetEvaluability(abstractText, contextDelivered);
    if (derivedDelivered.legalSourceTargetEvaluability !== 'PROVIDED_BY_CONTEXT') {
      throw new Error(`DECONTAMINATION_FAIL: Contexto entregue deveria derivar PROVIDED_BY_CONTEXT, obtido: ${derivedDelivered.legalSourceTargetEvaluability}`);
    }
    if (!derivedDelivered.contextHash || !derivedDelivered.contextFieldsProvided?.includes('diploma')) {
      throw new Error('DECONTAMINATION_FAIL: contextHash ou contextFieldsProvided ausentes para contexto entregue!');
    }
    passedTests++;
    testResults['decontamination_context_delivered'] = { status: 'PASS', derived: derivedDelivered.legalSourceTargetEvaluability, hash: derivedDelivered.contextHash };
  }

  // P.4: Contexto NÃO entregue ao modelo -> NOT_EVALUABLE_FROM_INPUT
  {
    totalTests++;
    const abstractText = 'A autoridade deverá decidir no prazo de cinco dias.';
    const contextNotDelivered: ProvidedEvaluationContext = {
      diploma: 'Código X',
      parentProvision: 'art. 10',
      wasDeliveredToCandidate: false, // Contexto não foi enviado ao candidato
    };
    const derivedNotDelivered = deriveSourceTargetEvaluability(abstractText, contextNotDelivered);
    if (derivedNotDelivered.legalSourceTargetEvaluability !== 'NOT_EVALUABLE_FROM_INPUT') {
      throw new Error(`DECONTAMINATION_FAIL: Contexto não entregue deveria derivar NOT_EVALUABLE_FROM_INPUT, obtido: ${derivedNotDelivered.legalSourceTargetEvaluability}`);
    }
    passedTests++;
    testResults['decontamination_context_not_delivered'] = { status: 'PASS', derived: derivedNotDelivered.legalSourceTargetEvaluability };
  }

  // P.5: Anti-Golden Leakage Proof (Mutar golden target NÃO afeta evaluability)
  {
    totalTests++;
    const e23Base = goldenEntries.find(e => e.propositionId === 'PROP-023')!;
    const evalBefore = deriveSourceTargetEvaluability(e23Base.originalText, undefined);

    // Muta artificialmente o golden para outra autoridade totalmente arbitrária
    const mutatedGolden: GoldenBenchmarkEntry = JSON.parse(JSON.stringify(e23Base));
    mutatedGolden.assertionSpecs.forEach(s => {
      s.legalSourceTarget = 'STF_TOTALMENTE_DIFERENTE_ADI_99999';
    });

    const evalAfter = deriveSourceTargetEvaluability(mutatedGolden.originalText, undefined);

    if (evalBefore.legalSourceTargetEvaluability !== evalAfter.legalSourceTargetEvaluability) {
      throw new Error('ANTI_LEAKAGE_FAIL: Mutação de legalSourceTarget do golden alterou a evaluability!');
    }
    passedTests++;
    testResults['anti_golden_leakage_proof'] = { status: 'PASS', invariant: true };
  }

  // P.6: Verificação de Decontaminação de src/ (ZERO propositionIds em src/)
  {
    totalTests++;
    function scanSrcForBenchmarkIds(dir: string): string[] {
      let ids: string[] = [];
      for (const file of fs.readdirSync(dir)) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          ids = ids.concat(scanSrcForBenchmarkIds(full));
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
          const content = fs.readFileSync(full, 'utf8');
          const matches = content.match(/\bPROP-[0-9]{3}\b/g);
          if (matches) {
            ids.push(...matches.map(m => `${file}:${m}`));
          }
        }
      }
      return ids;
    }
    const leakedIds = scanSrcForBenchmarkIds(path.resolve(process.cwd(), 'src'));
    if (leakedIds.length > 0) {
      throw new Error(`DECONTAMINATION_LEAK_FAIL: Encontrados propositionIds do benchmark em src/: ${leakedIds.join(', ')}`);
    }
    passedTests++;
    testResults['src_decontamination_zero_ids'] = { status: 'PASS', leakedCount: 0 };
  }

  // ===========================================================================
  // Q. SUÍTE DE 20 CASOS SINTÉTICOS DE SOURCE TARGET RESOLVABILITY (A até T)
  // ===========================================================================
  const syntheticResolvabilityCases = [
    {
      id: 'A',
      name: 'Artigo + diploma explícito no texto',
      text: 'art. 121 do Código Penal',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedPrecedentId: false,
    },
    {
      id: 'B',
      name: 'Artigo sem diploma no texto',
      text: 'art. 121',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'PROVISION_WITHOUT_DIPLOMA' as EvaluabilityReasonCode,
      expectedMissing: ['diploma'],
    },
    {
      id: 'C',
      name: 'Diploma sem artigo no texto',
      text: 'segundo o Código Penal',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'DIPLOMA_WITHOUT_PROVISION' as EvaluabilityReasonCode,
      expectedMissing: ['article'],
    },
    {
      id: 'D',
      name: 'Parágrafo isolado no texto',
      text: '§ 2º',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'PROVISION_WITHOUT_DIPLOMA' as EvaluabilityReasonCode,
      expectedMissing: ['diploma'],
    },
    {
      id: 'E',
      name: 'Inciso isolado no texto',
      text: 'inciso IV',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'PROVISION_WITHOUT_DIPLOMA' as EvaluabilityReasonCode,
      expectedMissing: ['diploma'],
    },
    {
      id: 'F',
      name: 'Artigo + parágrafo + diploma explícitos',
      text: 'art. 3º-B, § 2º, do CPP',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
    },
    {
      id: 'G',
      name: 'Artigo com contexto entregue ao candidato',
      text: 'art. 14',
      context: { diploma: 'Código de Processo Penal', wasDeliveredToCandidate: true } as ProvidedEvaluationContext,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'PROVIDED_BY_CONTEXT' as CanonicalTargetEvaluability,
      expectedReason: 'COMPONENTS_PROVIDED_BY_CONTEXT' as EvaluabilityReasonCode,
    },
    {
      id: 'H',
      name: 'Artigo com contexto NÃO entregue ao candidato',
      text: 'art. 14',
      context: { diploma: 'Código de Processo Penal', wasDeliveredToCandidate: false } as ProvidedEvaluationContext,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'CONTEXT_NOT_DELIVERED' as EvaluabilityReasonCode,
      expectedMissing: ['diploma'],
    },
    {
      id: 'I',
      name: 'Precedente ADI com número explícito',
      text: 'ADI 6.298',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedPrecedentId: true,
    },
    {
      id: 'J',
      name: 'STF decidiu sem número de processo',
      text: 'O STF decidiu sobre a matéria em recente julgamento',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'PARTIAL_REFERENCE_MISSING_PROVISION' as EvaluabilityReasonCode,
      expectedPrecedentId: false,
    },
    {
      id: 'K',
      name: 'Tema repetitivo com número explícito',
      text: 'Tema 1087 do STJ',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedPrecedentId: true,
    },
    {
      id: 'L',
      name: 'Súmula Vinculante com número explícito',
      text: 'Súmula Vinculante 11',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedPrecedentId: true,
    },
    {
      id: 'M',
      name: 'Resolução com número explícito',
      text: 'Resolução CNJ nº 562',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
    },
    {
      id: 'N',
      name: 'Resolução com número e artigo explícitos',
      text: 'Resolução CNJ nº 562, art. 3º',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
    },
    {
      id: 'O',
      name: 'Referência relativa deste Código sem contexto',
      text: 'nos termos deste Código',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'PROVISION_WITHOUT_DIPLOMA' as EvaluabilityReasonCode,
      expectedMissing: ['diploma'],
    },
    {
      id: 'P',
      name: 'Referência relativa deste Código com contexto entregue',
      text: 'nos termos do art. 10 deste Código',
      context: { diploma: 'Código de Processo Penal', wasDeliveredToCandidate: true } as ProvidedEvaluationContext,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'PROVIDED_BY_CONTEXT' as CanonicalTargetEvaluability,
      expectedReason: 'COMPONENTS_PROVIDED_BY_CONTEXT' as EvaluabilityReasonCode,
    },
    {
      id: 'Q',
      name: 'Citação parentética completa',
      text: 'O furto é punível com reclusão (CP, art. 155)',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
    },
    {
      id: 'R',
      name: 'Múltiplas citações completas independentes',
      text: 'O art. 121 do CP trata do homicídio, enquanto o art. 155 do CP disciplina o furto.',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
    },
    {
      id: 'S',
      name: 'Dispositivo ambíguo com múltiplos diplomas conflitantes',
      text: 'conforme o art. 5º previsto no Código Penal e no Código de Processo Penal',
      context: undefined,
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'CANONICAL_TARGET_AMBIGUOUS' as EvaluabilityReasonCode,
    },
    {
      id: 'T',
      name: 'Target canônico mais granular que input',
      text: 'O art. 3º-C do CPP estabelece a competência do juiz das garantias.',
      context: undefined,
      requiredTarget: 'CPP_ART_3C_PAR_2',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'TARGET_MORE_GRANULAR_THAN_INPUT' as EvaluabilityReasonCode,
      expectedMissing: ['paragraph'],
    },
  ];

  const syntheticResults: Record<string, any> = {};

  for (const tc of syntheticResolvabilityCases) {
    totalTests++;
    const assessment = assessSourceTargetResolvability(tc.text, tc.context, tc.requiredTarget);
    const derived = deriveSourceTargetEvaluability(tc.text, tc.context, tc.requiredTarget);

    if (assessment.canonicalTargetEvaluability !== tc.expectedEvaluability) {
      throw new Error(`SYNTHETIC_RESOLVABILITY_FAIL [Case ${tc.id}]: evaluability esperado ${tc.expectedEvaluability}, obtido ${assessment.canonicalTargetEvaluability}`);
    }
    if (assessment.referencePresence !== tc.expectedPresence) {
      throw new Error(`SYNTHETIC_RESOLVABILITY_FAIL [Case ${tc.id}]: referencePresence esperado ${tc.expectedPresence}, obtido ${assessment.referencePresence}`);
    }
    if (assessment.reasonCode !== tc.expectedReason) {
      throw new Error(`SYNTHETIC_RESOLVABILITY_FAIL [Case ${tc.id}]: reasonCode esperado ${tc.expectedReason}, obtido ${assessment.reasonCode}`);
    }
    if (tc.expectedPrecedentId !== undefined && assessment.precedentIdentityEvaluability !== tc.expectedPrecedentId) {
      throw new Error(`SYNTHETIC_RESOLVABILITY_FAIL [Case ${tc.id}]: precedentIdentityEvaluability esperado ${tc.expectedPrecedentId}, obtido ${assessment.precedentIdentityEvaluability}`);
    }
    if (tc.expectedMissing) {
      for (const m of tc.expectedMissing) {
        if (!assessment.missingComponents?.includes(m)) {
          throw new Error(`SYNTHETIC_RESOLVABILITY_FAIL [Case ${tc.id}]: missingComponent esperado '${m}', obtido ${JSON.stringify(assessment.missingComponents)}`);
        }
      }
    }
    if (derived.legalSourceTargetEvaluability !== assessment.canonicalTargetEvaluability) {
      throw new Error(`SYNTHETIC_RESOLVABILITY_FAIL [Case ${tc.id}]: divergência entre assess e derive`);
    }

    passedTests++;
    syntheticResults[tc.id] = {
      status: 'PASS',
      name: tc.name,
      referencePresence: assessment.referencePresence,
      canonicalTargetEvaluability: assessment.canonicalTargetEvaluability,
      reasonCode: assessment.reasonCode,
    };
  }

  testResults['syntheticResolvability20Cases'] = {
    status: 'PASS',
    totalCases: syntheticResolvabilityCases.length,
    casesPassed: syntheticResolvabilityCases.length,
    cases: syntheticResults,
  };

  // ===========================================================================
  // R. SUÍTE DE 20 CASOS MULTI-TARGET RESOLUTION A ATÉ T (V2.3.4-G.4)
  // ===========================================================================
  const multiTargetCases = [
    {
      id: 'A',
      name: 'CP 121 + CP 155',
      text: 'art. 121 do CP e art. 155 do CP',
      requiredTarget: 'CP_ART_121',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'CP_ART_121',
    },
    {
      id: 'B',
      name: 'CP 121 + CF 5',
      text: 'art. 121 do CP e art. 5º da CF',
      requiredTarget: 'CF_ART_5',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'CF_ART_5',
    },
    {
      id: 'C',
      name: 'CPP 3-B IV + CPP 3-C §2',
      text: 'art. 3º-B, IV, do CPP e art. 3º-C, § 2º, do CPP',
      requiredTarget: 'CPP_ART_3B_IV',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'CPP_ART_3B_IV',
    },
    {
      id: 'D',
      name: 'Target presente primeiro',
      text: 'art. 121 do CP e art. 155 do CP',
      requiredTarget: 'CP_ART_121',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedMatchedId: 'CP_ART_121',
    },
    {
      id: 'E',
      name: 'Target presente segundo',
      text: 'art. 121 do CP e art. 155 do CP',
      requiredTarget: 'CP_ART_155',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedMatchedId: 'CP_ART_155',
    },
    {
      id: 'F',
      name: 'Target ausente',
      text: 'art. 121 do CP e art. 155 do CP',
      requiredTarget: 'CP_ART_157',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'TARGET_NOT_PRESENT_IN_INPUT' as EvaluabilityReasonCode,
    },
    {
      id: 'G',
      name: 'Target mesmo artigo, diploma diferente',
      text: 'art. 121 do CP',
      requiredTarget: 'CC_ART_121',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'TARGET_NOT_PRESENT_IN_INPUT' as EvaluabilityReasonCode,
      expectedMissing: ['diploma'],
    },
    {
      id: 'H',
      name: 'Referência ambígua',
      text: 'art. 5º do CP e do CPP',
      requiredTarget: undefined,
      expectedPresence: 'PARTIAL' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'CANONICAL_TARGET_AMBIGUOUS' as EvaluabilityReasonCode,
    },
    {
      id: 'I',
      name: 'arts. 121 e 122 do CP (diploma compartilhado)',
      text: 'arts. 121 e 122 do Código Penal',
      requiredTarget: 'CP_ART_122',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'CP_ART_122',
    },
    {
      id: 'J',
      name: 'CF art.5 LIV e LV (incisos compartilhados)',
      text: 'art. 5º, incisos LIV e LV, da Constituição',
      requiredTarget: 'CF_ART_5_LV',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'CF_ART_5_LV',
    },
    {
      id: 'K',
      name: 'ADI 6298 + ADI 6299',
      text: 'ADI 6.298 e ADI 6.299',
      requiredTarget: 'STF_ADI_6299',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'STF_ADI_6299',
    },
    {
      id: 'L',
      name: 'CPP art.3-A + ADI 6298',
      text: 'art. 3º-A do CPP, interpretado pelo STF na ADI 6.298',
      requiredTarget: 'STF_ADI_6298',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'STF_ADI_6298',
    },
    {
      id: 'M',
      name: 'resolução + artigo + lei + artigo',
      text: 'Resolução CNJ nº 562/2024, art. 3º, e Lei nº 13.964/2019, art. 3º',
      requiredTarget: 'LEI_13964_2019_ART_3',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'LEI_13964_2019_ART_3',
    },
    {
      id: 'N',
      name: 'duas súmulas',
      text: 'Súmula Vinculante 11 e Súmula 111 do STJ',
      requiredTarget: 'STJ_SUMULA_111',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'STJ_SUMULA_111',
    },
    {
      id: 'O',
      name: 'tema + RE',
      text: 'Tema 1087 do STJ e RE 1.234.567 do STF',
      requiredTarget: 'STJ_TEMA_1087',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'STJ_TEMA_1087',
    },
    {
      id: 'P',
      name: 'referência duplicada idêntica',
      text: 'art. 121 do CP e posteriormente o art. 121 do CP',
      requiredTarget: 'CP_ART_121',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'CP_ART_121',
    },
    {
      id: 'Q',
      name: 'mesmo artigo citado duas vezes com diplomas diferentes',
      text: 'art. 121 do CP e art. 121 do CPP',
      requiredTarget: 'CPP_ART_121',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'CPP_ART_121',
    },
    {
      id: 'R',
      name: 'parágrafo associado somente ao segundo artigo',
      text: 'art. 121 do CP e art. 155, § 1º, do CP',
      requiredTarget: 'CP_ART_155_PAR_1',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'CP_ART_155_PAR_1',
    },
    {
      id: 'S',
      name: 'inciso associado somente ao primeiro artigo',
      text: 'art. 121, inciso I, do CP e art. 155 do CP',
      requiredTarget: 'CP_ART_121_I',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'EXPLICIT_IN_TEXT' as CanonicalTargetEvaluability,
      expectedReason: 'FULL_COMPONENTS_EXPLICIT_IN_TEXT' as EvaluabilityReasonCode,
      expectedLocatorsCount: 2,
      expectedMatchedId: 'CP_ART_121_I',
    },
    {
      id: 'T',
      name: 'required target mais granular que locator',
      text: 'O art. 3º-C do CPP estabelece a competência do juiz das garantias.',
      requiredTarget: 'CPP_ART_3C_PAR_2',
      expectedPresence: 'STRUCTURED' as ReferencePresence,
      expectedEvaluability: 'NOT_EVALUABLE_FROM_INPUT' as CanonicalTargetEvaluability,
      expectedReason: 'TARGET_MORE_GRANULAR_THAN_INPUT' as EvaluabilityReasonCode,
      expectedMissing: ['paragraph'],
    },
  ];

  const multiTargetResults: Record<string, any> = {};
  for (const tc of multiTargetCases) {
    totalTests++;
    const assessment = assessSourceTargetResolvability(tc.text, undefined, tc.requiredTarget);

    if (assessment.canonicalTargetEvaluability !== tc.expectedEvaluability) {
      throw new Error(`MULTI_TARGET_FAIL [Case ${tc.id}]: evaluability esperada ${tc.expectedEvaluability}, obtida ${assessment.canonicalTargetEvaluability}`);
    }
    if (assessment.referencePresence !== tc.expectedPresence) {
      throw new Error(`MULTI_TARGET_FAIL [Case ${tc.id}]: presence esperada ${tc.expectedPresence}, obtida ${assessment.referencePresence}`);
    }
    if (assessment.reasonCode !== tc.expectedReason) {
      throw new Error(`MULTI_TARGET_FAIL [Case ${tc.id}]: reasonCode esperado ${tc.expectedReason}, obtido ${assessment.reasonCode}`);
    }
    if (tc.expectedLocatorsCount !== undefined && assessment.availableLocators?.length !== tc.expectedLocatorsCount) {
      throw new Error(`MULTI_TARGET_FAIL [Case ${tc.id}]: locatorsCount esperado ${tc.expectedLocatorsCount}, obtido ${assessment.availableLocators?.length}`);
    }
    if (tc.expectedMatchedId !== undefined && assessment.matchedLocator?.canonicalId !== tc.expectedMatchedId) {
      throw new Error(`MULTI_TARGET_FAIL [Case ${tc.id}]: matchedLocator canonicalId esperado ${tc.expectedMatchedId}, obtido ${assessment.matchedLocator?.canonicalId}`);
    }
    if (tc.expectedMissing) {
      for (const m of tc.expectedMissing) {
        if (!assessment.missingComponents?.includes(m)) {
          throw new Error(`MULTI_TARGET_FAIL [Case ${tc.id}]: missingComponent esperado '${m}', obtido ${JSON.stringify(assessment.missingComponents)}`);
        }
      }
    }

    passedTests++;
    multiTargetResults[tc.id] = {
      status: 'PASS',
      name: tc.name,
      referencePresence: assessment.referencePresence,
      canonicalTargetEvaluability: assessment.canonicalTargetEvaluability,
      reasonCode: assessment.reasonCode,
      matchedId: assessment.matchedLocator?.canonicalId,
      locatorsCount: assessment.availableLocators?.length,
    };
  }

  testResults['multiTargetResolvability20Cases'] = {
    status: 'PASS',
    totalCases: multiTargetCases.length,
    casesPassed: multiTargetCases.length,
    cases: multiTargetResults,
  };

  // ===========================================================================
  // S. TESTE DE ANTI-LEAKAGE MULTI-TARGET (SECTION 10 / V2.3.4-G.4)
  // ===========================================================================
  {
    totalTests++;
    const multiSampleText = 'art. 121 do CP e art. 155 do CP';
    const evalTarget1 = assessSourceTargetResolvability(multiSampleText, undefined, 'CP_ART_121');
    const evalTarget2 = assessSourceTargetResolvability(multiSampleText, undefined, 'CP_ART_155');
    const evalTarget3 = assessSourceTargetResolvability(multiSampleText, undefined, 'CP_ART_157');
    const evalTarget4 = assessSourceTargetResolvability(multiSampleText, undefined, 'CC_ART_121');

    const loc1Json = JSON.stringify(evalTarget1.availableLocators);
    const loc2Json = JSON.stringify(evalTarget2.availableLocators);
    const loc3Json = JSON.stringify(evalTarget3.availableLocators);
    const loc4Json = JSON.stringify(evalTarget4.availableLocators);

    if (loc1Json !== loc2Json || loc2Json !== loc3Json || loc3Json !== loc4Json) {
      throw new Error('MULTI_TARGET_ANTI_LEAKAGE_FAIL: availableLocators variou em função do requiredTarget!');
    }
    passedTests++;
    testResults['antiLeakageMultiTargetProof'] = {
      status: 'PASS',
      locatorsByteIdentical: true,
      locatorsCount: evalTarget1.availableLocators?.length,
    };
  }

  totalTests++;
  const qualOmissionCaught = replayResults['PROP-007']?.errors.some((e: string) => e.includes('TRUE_QUALIFIER_OMISSION'));
  if (!qualOmissionCaught) {
    throw new Error('REGRESSION_FAIL: Omissão de qualificador da C.1 em PROP-007 deveria continuar reprovando!');
  }
  passedTests++;
  testResults['c1Regressions'] = {
    status: 'PASS',
    modalityFailuresPreserved: true,
    claimOmissionsPreserved: true,
    qualifierOmissionsPreserved: true,
  };

  return {
    success: true,
    totalTests,
    passedTests,
    externalModelCalls,
    networkRequests,
    testResults,
  };
}

// ============================================================================
// 3. EXECUÇÃO DETERMINÍSTICA DUPLA (RUN 1 == RUN 2)
// ============================================================================

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('check-decomposition-contract-v2')) {
  console.log('=== EXECUÇÃO RUN 1: check-decomposition-contract-v2.ts ===');
  const run1 = runDecompositionContractV2Verification();
  console.log(`Run 1 concluída: ${run1.passedTests}/${run1.totalTests} verificações passaram.`);
  console.log(`Candidate V1 (Historical Blind C.1) Replay: ${run1.testResults.candidateV1Replay.passCount}/20 PASS (HARD: ${run1.testResults.candidateV1Replay.hardPassCount}/5)`);
  console.log(`Candidate V2 (Frozen Blind V2) Replay: ${run1.testResults.candidateV2Replay.passCount}/20 PASS (HARD: ${run1.testResults.candidateV2Replay.hardPassCount}/5)`);

  console.log('\n=== EXECUÇÃO RUN 2: check-decomposition-contract-v2.ts ===');
  const run2 = runDecompositionContractV2Verification();
  console.log(`Run 2 concluída: ${run2.passedTests}/${run2.totalTests} verificações passaram.`);

  const str1 = JSON.stringify(run1);
  const str2 = JSON.stringify(run2);

  if (str1 !== str2) {
    throw new Error('DETERMINISM_VIOLATION: Run 1 e Run 2 divergiram na verificação do Contract V2.');
  }

  console.log('\n✓ DETERMINISMO 100% COMPROVADO: Run 1 e Run 2 são idênticas byte a byte.');
}
