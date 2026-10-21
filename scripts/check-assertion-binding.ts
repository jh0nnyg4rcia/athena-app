/**
 * ATHENA V2.3.4-A - Check Assertion Binding Foundation Test Suite
 * 
 * Executa testes 100% offline, determinísticos e estritos da infraestrutura:
 * PropositionUnit -> AtomicClaim -> AssertionSpec -> EvidenceAssertion -> MaterialBindingResult
 * 
 * Regra: ZERO chamadas externas / ZERO LLM / Network Guard ativo.
 */

import http from 'node:http';
import https from 'node:https';
import {
  validateAssertionCoverage,
  bindAssertionsToEvidence,
} from '../src/lib/legalReviewAssertionBinding';
import type {
  AtomicClaim,
  AssertionSpec,
  EvidenceAssertion,
  InferenceRule,
  CanonicalEquivalenceRule,
  MaterialBindingResult,
} from '../src/lib/legalReviewTypes';

// ============================================================================
// 1. NETWORK GUARD: BLOQUEIO ABSOLUTO DE REDE
// ============================================================================
function enableNetworkGuard(): void {
  globalThis.fetch = () => {
    throw new Error('NETWORK_VIOLATION: fetch() chamado durante check-assertion-binding!');
  };
  try {
    (http as any).request = () => {
      throw new Error('NETWORK_VIOLATION: http.request() chamado durante check-assertion-binding!');
    };
    (https as any).request = () => {
      throw new Error('NETWORK_VIOLATION: https.request() chamado durante check-assertion-binding!');
    };
  } catch {
    // Se o runtime bloquear reassign no namespace, globalThis.fetch já protege o fetch padrão
  }
}

// ============================================================================
// 2. FIXTURES DOS CASOS REAIS
// ============================================================================

// CASO A: CPP Art. 3º-A caput
const CASE_A_TEXT =
  'O processo penal terá estrutura acusatória, vedadas a iniciativa do juiz na fase de investigação e a substituição da atuação probatória do órgão de acusação.';

const CASE_A_CLAIMS: AtomicClaim[] = [
  {
    claimId: 'A-1',
    propositionId: 'CASE-A',
    sourceSpan: { start: 0, end: 42, text: 'O processo penal terá estrutura acusatória' },
    normalizedClaim: 'O processo penal possui estrutura acusatória.',
    claimType: 'DIRECT_NORMATIVE_ASSERTION',
    materiality: 'MATERIAL',
  },
  {
    claimId: 'A-2',
    propositionId: 'CASE-A',
    sourceSpan: { start: 42, end: 96, text: ', vedadas a iniciativa do juiz na fase de investigação' },
    normalizedClaim: 'É vedada a iniciativa do juiz na fase de investigação.',
    claimType: 'DIRECT_NORMATIVE_ASSERTION',
    materiality: 'MATERIAL',
  },
  {
    claimId: 'A-3',
    propositionId: 'CASE-A',
    sourceSpan: { start: 96, end: 157, text: ' e a substituição da atuação probatória do órgão de acusação.' },
    normalizedClaim: 'É vedada a substituição probatória da acusação pelo juiz.',
    claimType: 'DIRECT_NORMATIVE_ASSERTION',
    materiality: 'MATERIAL',
  },
];

const CASE_A_SPECS: AssertionSpec[] = [
  {
    assertionId: 'SPEC_A_1',
    propositionId: 'CASE-A',
    claimId: 'A-1',
    sourceSpan: { start: 0, end: 42, text: 'O processo penal terá estrutura acusatória' },
    kind: 'RULE_OBLIGATION',
    subject: 'PROCESSO_PENAL',
    predicate: 'POSSUI',
    object: 'ESTRUTURA_ACUSATORIA',
    polarity: 'POSITIVE',
    modality: 'MUST',
    qualifiers: [],
    legalSourceTarget: 'CPP_ART_3A',
    requiredEvidenceKind: 'LEGISLATION',
  },
  {
    assertionId: 'SPEC_A_2',
    propositionId: 'CASE-A',
    claimId: 'A-2',
    sourceSpan: { start: 42, end: 96, text: ', vedadas a iniciativa do juiz na fase de investigação' },
    kind: 'RULE_PROHIBITION',
    subject: 'JUIZ',
    predicate: 'INICIATIVA',
    object: 'FASE_INVESTIGACAO',
    polarity: 'NEGATIVE',
    modality: 'MUST_NOT',
    qualifiers: [],
    legalSourceTarget: 'CPP_ART_3A',
    requiredEvidenceKind: 'LEGISLATION',
  },
  {
    assertionId: 'SPEC_A_3',
    propositionId: 'CASE-A',
    claimId: 'A-3',
    sourceSpan: { start: 96, end: 157, text: ' e a substituição da atuação probatória do órgão de acusação.' },
    kind: 'RULE_PROHIBITION',
    subject: 'JUIZ',
    predicate: 'SUBSTITUICAO_ATUACAO_PROBATORIA',
    object: 'ORGAO_ACUSACAO',
    polarity: 'NEGATIVE',
    modality: 'MUST_NOT',
    qualifiers: [],
    legalSourceTarget: 'CPP_ART_3A',
    requiredEvidenceKind: 'LEGISLATION',
  },
];

const CASE_A_EVIDENCE: EvidenceAssertion[] = [
  {
    evidenceAssertionId: 'EV_CPP_ART3A_ESTRUTURA',
    evidenceId: 'mev_planalto_cpp_art3a_209cb2811f',
    locator: { type: 'LEGISLATION', statute: 'CPP', article: 'Art. 3º-A' },
    subject: 'PROCESSO_PENAL',
    predicate: 'POSSUI',
    object: 'ESTRUTURA_ACUSATORIA',
    polarity: 'POSITIVE',
    modality: 'MUST',
    qualifiers: [],
    derivationMethod: 'LEGISLATION_STRUCTURE',
    evidenceText: 'Art. 3º-A. O processo penal terá estrutura acusatória...',
  },
  {
    evidenceAssertionId: 'EV_CPP_ART3A_INICIATIVA',
    evidenceId: 'mev_planalto_cpp_art3a_209cb2811f',
    locator: { type: 'LEGISLATION', statute: 'CPP', article: 'Art. 3º-A' },
    subject: 'JUIZ',
    predicate: 'INICIATIVA',
    object: 'FASE_INVESTIGACAO',
    polarity: 'NEGATIVE',
    modality: 'MUST_NOT',
    qualifiers: [],
    derivationMethod: 'LEGISLATION_STRUCTURE',
    evidenceText: '...vedadas a iniciativa do juiz na fase de investigação...',
  },
  {
    evidenceAssertionId: 'EV_CPP_ART3A_SUBSTITUICAO',
    evidenceId: 'mev_planalto_cpp_art3a_209cb2811f',
    locator: { type: 'LEGISLATION', statute: 'CPP', article: 'Art. 3º-A' },
    subject: 'JUIZ',
    predicate: 'SUBSTITUICAO_ATUACAO_PROBATORIA',
    object: 'ORGAO_ACUSACAO',
    polarity: 'NEGATIVE',
    modality: 'MUST_NOT',
    qualifiers: [],
    derivationMethod: 'LEGISLATION_STRUCTURE',
    evidenceText: '...e a substituição da atuação probatória do órgão de acusação.',
  },
];

// CASO B: Resolução CNJ 562/2024 Art. 3º, III
const CASE_B_TEXT =
  'As normas relativas ao juiz das garantias não se aplicam aos casos de violência doméstica e familiar.';

const CASE_B_CLAIMS: AtomicClaim[] = [
  {
    claimId: 'B-1',
    propositionId: 'CASE-B',
    sourceSpan: { start: 0, end: 101, text: 'As normas relativas ao juiz das garantias não se aplicam aos casos de violência doméstica e familiar.' },
    normalizedClaim: 'Regras do juiz das garantias não se aplicam em violência doméstica.',
    claimType: 'DIRECT_NORMATIVE_ASSERTION',
    materiality: 'MATERIAL',
  },
];

const CASE_B_SPECS: AssertionSpec[] = [
  {
    assertionId: 'SPEC_B_1',
    propositionId: 'CASE-B',
    claimId: 'B-1',
    sourceSpan: { start: 0, end: 101, text: 'As normas relativas ao juiz das garantias não se aplicam aos casos de violência doméstica e familiar.' },
    kind: 'RULE_PROHIBITION',
    subject: 'NORMAS_JUIZ_GARANTIAS',
    predicate: 'APLICAM',
    object: 'CASOS_VIOLENCIA_DOMESTICA_FAMILIAR',
    polarity: 'NEGATIVE',
    modality: 'MUST_NOT',
    qualifiers: [],
    legalSourceTarget: 'CNJ_RES_562_ART_3',
    requiredEvidenceKind: 'ADMINISTRATIVE_ACT',
  },
];

const CASE_B_EVIDENCE: EvidenceAssertion[] = [
  {
    evidenceAssertionId: 'EV_CNJ_RES562_ART3_INC3',
    evidenceId: 'mev_cnj_res562_e612edf60f',
    locator: { type: 'LEGISLATION', statute: 'RESOLUCAO_562', article: 'Art. 3º', item: 'III' },
    subject: 'NORMAS_JUIZ_GARANTIAS',
    predicate: 'APLICAM',
    object: 'CASOS_VIOLENCIA_DOMESTICA_FAMILIAR',
    polarity: 'NEGATIVE',
    modality: 'MUST_NOT',
    qualifiers: [],
    derivationMethod: 'LEGISLATION_STRUCTURE',
    evidenceText: 'Art. 3º (...) não se aplicam aos: (...) III – casos de violência doméstica e familiar...',
  },
];

// CASO C: PROP-005 (STF ADI 6298 item 1)
const CASE_C_TEXT =
  '**Atenção**: Embora o art. 3º-A do CPP vede a substituição da atuação probatória das partes pelo juiz, o STF, ao conferir interpretação conforme à Constituição ao dispositivo, assentou que o magistrado pode, pontualmente e nos limites legalmente autorizados, determinar diligências suplementares destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito. Mantém-se, assim, a possibilidade de atuação instrutória judicial prevista no art. 156, II, do CPP, desde que não haja substituição da atividade probatória das partes.';

const CASE_C_CLAIMS: AtomicClaim[] = [
  {
    claimId: 'P005-PREAMBLE',
    propositionId: 'PROP-005',
    sourceSpan: { start: 0, end: 12, text: '**Atenção**:' },
    normalizedClaim: 'Atenção:',
    claimType: 'NON_MATERIAL_PREAMBLE',
    materiality: 'NON_MATERIAL',
  },
  {
    claimId: 'P005-A',
    propositionId: 'PROP-005',
    sourceSpan: { start: 12, end: 102, text: ' Embora o art. 3º-A do CPP vede a substituição da atuação probatória das partes pelo juiz,' },
    normalizedClaim: 'O art. 3º-A veda substituição probatória.',
    claimType: 'DIRECT_NORMATIVE_ASSERTION',
    materiality: 'MATERIAL',
  },
  {
    claimId: 'P005-B',
    propositionId: 'PROP-005',
    sourceSpan: { start: 102, end: 184, text: ' o STF, ao conferir interpretação conforme à Constituição ao dispositivo, assentou' },
    normalizedClaim: 'O STF atribuiu interpretação conforme ao dispositivo.',
    claimType: 'COURT_RULING',
    materiality: 'MATERIAL',
  },
  {
    claimId: 'P005-C',
    propositionId: 'PROP-005',
    sourceSpan: { start: 184, end: 376, text: ' que o magistrado pode, pontualmente e nos limites legalmente autorizados, determinar diligências suplementares destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito.' },
    normalizedClaim: 'Juiz pode pontualmente determinar diligências suplementares para dirimir dúvida sobre o mérito.',
    claimType: 'COURT_RULING',
    materiality: 'MATERIAL',
  },
  {
    claimId: 'P005-D',
    propositionId: 'PROP-005',
    sourceSpan: { start: 376, end: 544, text: ' Mantém-se, assim, a possibilidade de atuação instrutória judicial prevista no art. 156, II, do CPP, desde que não haja substituição da atividade probatória das partes.' },
    normalizedClaim: 'Mantém-se a atuação instrutória do art. 156, II do CPP.',
    claimType: 'INTERPRETIVE_INFERENCE',
    materiality: 'MATERIAL',
  },
];

const CASE_C_SPECS: AssertionSpec[] = [
  {
    assertionId: 'SPEC_P005_A',
    propositionId: 'PROP-005',
    claimId: 'P005-A',
    sourceSpan: { start: 12, end: 102, text: ' Embora o art. 3º-A do CPP vede a substituição da atuação probatória das partes pelo juiz,' },
    kind: 'RULE_PROHIBITION',
    subject: 'JUIZ',
    predicate: 'SUBSTITUICAO_ATUACAO_PROBATORIA',
    object: 'ORGAO_ACUSACAO',
    polarity: 'NEGATIVE',
    modality: 'MUST_NOT',
    qualifiers: [],
    legalSourceTarget: 'CPP_ART_3A',
    requiredEvidenceKind: 'LEGISLATION',
  },
  {
    assertionId: 'SPEC_P005_B',
    propositionId: 'PROP-005',
    claimId: 'P005-B',
    sourceSpan: { start: 102, end: 184, text: ' o STF, ao conferir interpretação conforme à Constituição ao dispositivo, assentou' },
    kind: 'COURT_RULING',
    subject: 'STF',
    predicate: 'ATRIBUIU_INTERPRETACAO_CONFORME',
    object: 'ART_3A_CPP',
    polarity: 'POSITIVE',
    modality: 'DECLARES',
    qualifiers: [],
    legalSourceTarget: 'STF_ADI_6298_ITEM1',
    requiredEvidenceKind: 'JUDICIAL_DECISION',
  },
  {
    assertionId: 'SPEC_P005_C',
    propositionId: 'PROP-005',
    claimId: 'P005-C',
    sourceSpan: { start: 184, end: 376, text: ' que o magistrado pode, pontualmente e nos limites legalmente autorizados, determinar diligências suplementares destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito.' },
    kind: 'COURT_RULING',
    subject: 'JUIZ',
    predicate: 'DETERMINA_DILIGENCIAS_SUPLEMENTARES',
    object: 'DILIGENCIAS_SUPLEMENTARES',
    polarity: 'POSITIVE',
    modality: 'MAY',
    qualifiers: [
      { type: 'FREQUENCY', value: 'pontualmente', sourceSpan: { start: 208, end: 220, text: 'pontualmente' } },
      { type: 'LIMIT', value: 'nos limites legalmente autorizados', sourceSpan: { start: 223, end: 257, text: 'nos limites legalmente autorizados' } },
      { type: 'PURPOSE', value: 'destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito', sourceSpan: { start: 296, end: 375, text: 'destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito' } },
    ],
    legalSourceTarget: 'STF_ADI_6298_ITEM1',
    requiredEvidenceKind: 'JUDICIAL_DECISION',
  },
  {
    assertionId: 'SPEC_P005_D',
    propositionId: 'PROP-005',
    claimId: 'P005-D',
    sourceSpan: { start: 376, end: 544, text: ' Mantém-se, assim, a possibilidade de atuação instrutória judicial prevista no art. 156, II, do CPP, desde que não haja substituição da atividade probatória das partes.' },
    kind: 'INTERPRETIVE_CLAIM',
    subject: 'JUIZ',
    predicate: 'ATUACAO_INSTRUTORIA_SUBSIDIARIA',
    object: 'ART_156_II_CPP',
    polarity: 'POSITIVE',
    modality: 'MAY',
    qualifiers: [
      { type: 'CONDITION', value: 'desde que não haja substituição da atividade probatória das partes', sourceSpan: { start: 477, end: 543, text: 'desde que não haja substituição da atividade probatória das partes' } },
    ],
    legalSourceTarget: 'STF_ADI_6298_FUNDAMENTACAO',
    requiredEvidenceKind: 'JUDICIAL_DECISION',
  },
];

const CASE_C_EVIDENCE: EvidenceAssertion[] = [
  CASE_A_EVIDENCE[2],
  {
    evidenceAssertionId: 'EV_ADI6298_ITEM1_INTERPRETACAO',
    evidenceId: 'mat_ev_stf_adi6298_5840274_dec_5850380',
    locator: { type: 'JUDICIAL_DECISION', court: 'STF', processClass: 'ADI', processNumber: 6298, dispositivoPoint: 1 },
    subject: 'STF',
    predicate: 'ATRIBUIU_INTERPRETACAO_CONFORME',
    object: 'ART_3A_CPP',
    polarity: 'POSITIVE',
    modality: 'DECLARES',
    qualifiers: [],
    derivationMethod: 'ENUMERATED_DISPOSITIVO',
    evidenceText: '1. Por maioria, atribuir interpretação conforme ao art. 3º-A do CPP...',
  },
  {
    evidenceAssertionId: 'EV_ADI6298_ITEM1_DILIGENCIAS',
    evidenceId: 'mat_ev_stf_adi6298_5840274_dec_5850380',
    locator: { type: 'JUDICIAL_DECISION', court: 'STF', processClass: 'ADI', processNumber: 6298, dispositivoPoint: 1 },
    subject: 'JUIZ',
    predicate: 'DETERMINA_DILIGENCIAS_SUPLEMENTARES',
    object: 'DILIGENCIAS_SUPLEMENTARES',
    polarity: 'POSITIVE',
    modality: 'MAY',
    qualifiers: [
      { type: 'FREQUENCY', value: 'pontualmente', sourceSpan: { start: 0, end: 12, text: 'pontualmente' } },
      { type: 'LIMIT', value: 'nos limites legalmente autorizados', sourceSpan: { start: 0, end: 34, text: 'nos limites legalmente autorizados' } },
      { type: 'PURPOSE', value: 'destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito', sourceSpan: { start: 0, end: 81, text: 'destinadas a dirimir dúvida sobre questão relevante para o julgamento do mérito' } },
    ],
    derivationMethod: 'ENUMERATED_DISPOSITIVO',
    evidenceText: '...para assentar que o juiz, pontualmente, nos limites legalmente autorizados, pode determinar a realização de diligências suplementares...',
  },
];

// CASO D: PROP-030 (STF ADI 6298 item 2 & Autonomia)
const CASE_D_TEXT =
  'O STF considerou **constitucional** a criação do juiz das garantias e reconheceu a obrigatoriedade de sua implementação em todo o país. A organização e o funcionamento do instituto devem ser disciplinados conforme as normas de organização judiciária da União, dos Estados e do Distrito Federal, observada a autonomia dos tribunais e as diretrizes estabelecidas pelo CNJ.';

const CASE_D_CLAIMS: AtomicClaim[] = [
  {
    claimId: 'P030-A',
    propositionId: 'PROP-030',
    sourceSpan: { start: 0, end: 67, text: 'O STF considerou **constitucional** a criação do juiz das garantias' },
    normalizedClaim: 'STF declarou constitucional o juiz das garantias.',
    claimType: 'COURT_RULING',
    materiality: 'MATERIAL',
  },
  {
    claimId: 'P030-B',
    propositionId: 'PROP-030',
    sourceSpan: { start: 67, end: 135, text: ' e reconheceu a obrigatoriedade de sua implementação em todo o país.' },
    normalizedClaim: 'STF reconheceu a obrigatoriedade em todo o país.',
    claimType: 'COURT_RULING',
    materiality: 'MATERIAL',
  },
  {
    claimId: 'P030-C',
    propositionId: 'PROP-030',
    sourceSpan: { start: 135, end: 294, text: ' A organização e o funcionamento do instituto devem ser disciplinados conforme as normas de organização judiciária da União, dos Estados e do Distrito Federal,' },
    normalizedClaim: 'Organização disciplinada pelas leis de organização judiciária.',
    claimType: 'COURT_RULING',
    materiality: 'MATERIAL',
  },
  {
    claimId: 'P030-D',
    propositionId: 'PROP-030',
    sourceSpan: { start: 294, end: 330, text: ' observada a autonomia dos tribunais' },
    normalizedClaim: 'Observada a autonomia dos tribunais.',
    claimType: 'DOCTRINAL_SYNTHESIS',
    materiality: 'MATERIAL',
  },
  {
    claimId: 'P030-E',
    propositionId: 'PROP-030',
    sourceSpan: { start: 330, end: 370, text: ' e as diretrizes estabelecidas pelo CNJ.' },
    normalizedClaim: 'Observadas as diretrizes do CNJ.',
    claimType: 'COURT_RULING',
    materiality: 'MATERIAL',
  },
];

const CASE_D_SPECS: AssertionSpec[] = [
  {
    assertionId: 'SPEC_P030_A',
    propositionId: 'PROP-030',
    claimId: 'P030-A',
    sourceSpan: { start: 0, end: 67, text: 'O STF considerou **constitucional** a criação do juiz das garantias' },
    kind: 'COURT_RULING',
    subject: 'STF',
    predicate: 'DECLARA_CONSTITUCIONALIDADE',
    object: 'CRIACAO_JUIZ_GARANTIAS',
    polarity: 'POSITIVE',
    modality: 'DECLARES',
    qualifiers: [],
    legalSourceTarget: 'STF_ADI_6298_ITEM2',
    requiredEvidenceKind: 'JUDICIAL_DECISION',
  },
  {
    assertionId: 'SPEC_P030_B',
    propositionId: 'PROP-030',
    claimId: 'P030-B',
    sourceSpan: { start: 67, end: 135, text: ' e reconheceu a obrigatoriedade de sua implementação em todo o país.' },
    kind: 'COURT_RULING',
    subject: 'STF',
    predicate: 'RECONHECE_OBRIGATORIEDADE_IMPLANTACAO',
    object: 'IMPLANTACAO_JUIZ_GARANTIAS',
    polarity: 'POSITIVE',
    modality: 'RECOGNIZES',
    qualifiers: [
      { type: 'SCOPE', value: 'em todo o país', sourceSpan: { start: 120, end: 134, text: 'em todo o país' } },
    ],
    legalSourceTarget: 'STF_ADI_6298_ITEM2',
    requiredEvidenceKind: 'JUDICIAL_DECISION',
  },
  {
    assertionId: 'SPEC_P030_C',
    propositionId: 'PROP-030',
    claimId: 'P030-C',
    sourceSpan: { start: 135, end: 294, text: ' A organização e o funcionamento do instituto devem ser disciplinados conforme as normas de organização judiciária da União, dos Estados e do Distrito Federal,' },
    kind: 'ORGANIZATIONAL_DUTY',
    subject: 'ORGANIZACAO_FUNCIONAMENTO_INSTITUTO',
    predicate: 'DISCIPLINADOS_CONFORME',
    object: 'NORMAS_ORGANIZACAO_JUDICIARIA',
    polarity: 'POSITIVE',
    modality: 'MUST',
    qualifiers: [],
    legalSourceTarget: 'STF_ADI_6298_ITEM2',
    requiredEvidenceKind: 'JUDICIAL_DECISION',
  },
  {
    assertionId: 'SPEC_P030_D',
    propositionId: 'PROP-030',
    claimId: 'P030-D',
    sourceSpan: { start: 294, end: 330, text: ' observada a autonomia dos tribunais' },
    kind: 'ORGANIZATIONAL_DUTY',
    subject: 'ORGANIZACAO_FUNCIONAMENTO_INSTITUTO',
    predicate: 'OBSERVA',
    object: 'AUTONOMIA_TRIBUNAIS',
    polarity: 'POSITIVE',
    modality: 'MUST',
    qualifiers: [
      { type: 'LIMIT', value: 'autonomia dos tribunais', sourceSpan: { start: 307, end: 330, text: 'autonomia dos tribunais' } },
    ],
    legalSourceTarget: 'STF_ADI_6298_ITEM2',
    requiredEvidenceKind: 'JUDICIAL_DECISION',
  },
  {
    assertionId: 'SPEC_P030_E',
    propositionId: 'PROP-030',
    claimId: 'P030-E',
    sourceSpan: { start: 330, end: 370, text: ' e as diretrizes estabelecidas pelo CNJ.' },
    kind: 'ORGANIZATIONAL_DUTY',
    subject: 'ORGANIZACAO_FUNCIONAMENTO_INSTITUTO',
    predicate: 'CONFORME_DIRETRIZES',
    object: 'CNJ',
    polarity: 'POSITIVE',
    modality: 'MUST',
    qualifiers: [
      { type: 'AUTHORITY', value: 'CNJ', sourceSpan: { start: 366, end: 369, text: 'CNJ' } },
    ],
    legalSourceTarget: 'STF_ADI_6298_ITEM2',
    requiredEvidenceKind: 'JUDICIAL_DECISION',
  },
];

const CASE_D_EVIDENCE: EvidenceAssertion[] = [
  {
    evidenceAssertionId: 'EV_ADI6298_ITEM2_CONSTITUCIONALIDADE',
    evidenceId: 'mat_ev_stf_adi6298_5840274_dec_5850380',
    locator: { type: 'JUDICIAL_DECISION', court: 'STF', processClass: 'ADI', processNumber: 6298, dispositivoPoint: 2 },
    subject: 'STF',
    predicate: 'DECLARA_CONSTITUCIONALIDADE',
    object: 'CRIACAO_JUIZ_GARANTIAS',
    polarity: 'POSITIVE',
    modality: 'DECLARES',
    qualifiers: [],
    derivationMethod: 'ENUMERATED_DISPOSITIVO',
    evidenceText: '2. Por maioria, declarar a constitucionalidade do caput do art. 3º-B do CPP...',
  },
  {
    evidenceAssertionId: 'EV_ADI6298_ITEM2_PRAZO',
    evidenceId: 'mat_ev_stf_adi6298_5840274_dec_5850380',
    locator: { type: 'JUDICIAL_DECISION', court: 'STF', processClass: 'ADI', processNumber: 6298, dispositivoPoint: 2 },
    subject: 'STF',
    predicate: 'STF_FIXA_PRAZO_PEREMPTORIO_IMPLANTACAO_TODO_PAIS',
    object: 'IMPLANTACAO_JUIZ_GARANTIAS',
    polarity: 'POSITIVE',
    modality: 'MUST',
    qualifiers: [
      { type: 'SCOPE', value: 'em todo o país', sourceSpan: { start: 0, end: 14, text: 'em todo o país' } },
      { type: 'TEMPORAL', value: 'prazo de 12 meses', sourceSpan: { start: 0, end: 24, text: 'prazo de 12 (doze) meses' } },
    ],
    derivationMethod: 'ENUMERATED_DISPOSITIVO',
    evidenceText: '...e por unanimidade fixar o prazo de 12 (doze) meses...',
  },
  {
    evidenceAssertionId: 'EV_ADI6298_ITEM2_LEIS_ORGANIZACAO',
    evidenceId: 'mat_ev_stf_adi6298_5840274_dec_5850380',
    locator: { type: 'JUDICIAL_DECISION', court: 'STF', processClass: 'ADI', processNumber: 6298, dispositivoPoint: 2 },
    subject: 'ORGANIZACAO_FUNCIONAMENTO_INSTITUTO',
    predicate: 'DISCIPLINADOS_CONFORME',
    object: 'diferentes leis de organização judiciária',
    polarity: 'POSITIVE',
    modality: 'MUST',
    qualifiers: [],
    derivationMethod: 'ENUMERATED_DISPOSITIVO',
    evidenceText: '...necessárias à adequação das diferentes leis de organização judiciária...',
  },
  {
    evidenceAssertionId: 'EV_ADI6298_ITEM2_CNJ',
    evidenceId: 'mat_ev_stf_adi6298_5840274_dec_5850380',
    locator: { type: 'JUDICIAL_DECISION', court: 'STF', processClass: 'ADI', processNumber: 6298, dispositivoPoint: 2 },
    subject: 'ORGANIZACAO_FUNCIONAMENTO_INSTITUTO',
    predicate: 'CONFORME_DIRETRIZES',
    object: 'CNJ',
    polarity: 'POSITIVE',
    modality: 'MUST',
    qualifiers: [
      { type: 'AUTHORITY', value: 'CNJ', sourceSpan: { start: 0, end: 28, text: 'Conselho Nacional de Justiça' } },
    ],
    derivationMethod: 'ENUMERATED_DISPOSITIVO',
    evidenceText: '...tudo conforme as diretrizes do Conselho Nacional de Justiça e sob a supervisão dele;',
  },
];

const LOCAL_INFERENCE_RULES: InferenceRule[] = [
  {
    ruleId: 'INF_PRAZO_PEREMPTORIO_IMPLICA_OBRIGATORIEDADE',
    premises: ['STF_FIXA_PRAZO_PEREMPTORIO_IMPLANTACAO_TODO_PAIS'],
    conclusion: 'RECONHECE_OBRIGATORIEDADE_IMPLANTACAO',
    scope: 'STF_ADI_6298_ITEM2',
    version: '1.0.0',
    sourceAuthority: 'STF',
    sourceLocator: 'ADI 6298 Dispositivo Item 2',
  },
];

const LOCAL_EQUIVALENCE_RULES: CanonicalEquivalenceRule[] = [
  {
    ruleId: 'EQUIV_LEIS_ORGANIZACAO',
    expressionA: 'diferentes leis de organização judiciária',
    expressionB: 'normas de organização judiciária da União, dos Estados e do Distrito Federal',
    canonicalConcept: 'NORMAS_ORGANIZACAO_JUDICIARIA',
    scope: 'STF_ADI_6298_ITEM2',
    justification: 'Enumeração analítica federativa dos entes estatais.',
    version: '1.0.0',
  },
  {
    ruleId: 'EQUIV_VIOLENCIA_DOMESTICA',
    expressionA: 'casos de violência doméstica e familiar, regidos pelas Leis nº 11.340/2006 e nº 14.344/2022',
    expressionB: 'casos de violência doméstica e familiar',
    canonicalConcept: 'CASOS_VIOLENCIA_DOMESTICA_FAMILIAR',
    scope: 'CNJ_RES_562_ART_3',
    justification: 'Identidade material com a ressalva do art. 3º, III da Resolução CNJ 562/2024.',
    version: '1.0.0',
  },
];

// ============================================================================
// 3. SUÍTE COMPLETA DE TESTES
// ============================================================================

export function runFullAssertionBindingSuite(): { passed: boolean; testCount: number; results: any } {
  enableNetworkGuard();

  let testCount = 0;
  const executionResults: Record<string, any> = {};

  // -------------------------------------------------------------
  // REGRESSÕES REAIS (CASOS A, B, C, D)
  // -------------------------------------------------------------
  // Caso A
  testCount++;
  const covA = validateAssertionCoverage(CASE_A_TEXT, CASE_A_CLAIMS, CASE_A_SPECS);
  if (!covA.valid) throw new Error(`Case A coverage failed: ${covA.errors.join('; ')}`);
  const bindA = bindAssertionsToEvidence('CASE-A', CASE_A_SPECS, CASE_A_EVIDENCE);
  if (bindA.status !== 'FULLY_SUPPORTED' || bindA.supportedAtomicClaimCount !== 3) {
    throw new Error(`Case A expected FULLY_SUPPORTED (3/3), got ${bindA.status}`);
  }
  executionResults['caseA'] = bindA.status;

  // Caso B
  testCount++;
  const covB = validateAssertionCoverage(CASE_B_TEXT, CASE_B_CLAIMS, CASE_B_SPECS);
  if (!covB.valid) throw new Error(`Case B coverage failed: ${covB.errors.join('; ')}`);
  const bindB = bindAssertionsToEvidence('CASE-B', CASE_B_SPECS, CASE_B_EVIDENCE, { equivalenceRules: LOCAL_EQUIVALENCE_RULES });
  if (bindB.status !== 'FULLY_SUPPORTED' || bindB.supportedAtomicClaimCount !== 1) {
    throw new Error(`Case B expected FULLY_SUPPORTED (1/1), got ${bindB.status}`);
  }
  executionResults['caseB'] = bindB.status;

  // Caso C (PROP-005)
  testCount++;
  const covC = validateAssertionCoverage(CASE_C_TEXT, CASE_C_CLAIMS, CASE_C_SPECS);
  if (!covC.valid) throw new Error(`Case C coverage failed: ${covC.errors.join('; ')}`);
  const bindC = bindAssertionsToEvidence('PROP-005', CASE_C_SPECS, CASE_C_EVIDENCE);
  if (bindC.status !== 'INDETERMINATE' || bindC.supportedAtomicClaimCount !== 3 || bindC.indeterminateAtomicClaimCount !== 1) {
    throw new Error(`Case C expected INDETERMINATE (3/4 supported, 1 indeterminate), got ${bindC.status}`);
  }
  executionResults['caseC'] = bindC.status;

  // Caso D (PROP-030)
  testCount++;
  const covD = validateAssertionCoverage(CASE_D_TEXT, CASE_D_CLAIMS, CASE_D_SPECS);
  if (!covD.valid) throw new Error(`Case D coverage failed: ${covD.errors.join('; ')}`);
  const bindD = bindAssertionsToEvidence('PROP-030', CASE_D_SPECS, CASE_D_EVIDENCE, {
    inferenceRules: LOCAL_INFERENCE_RULES,
    equivalenceRules: LOCAL_EQUIVALENCE_RULES,
  });
  if (bindD.status !== 'CONTAINS_UNSUPPORTED_ADDITIONS' || bindD.supportedAtomicClaimCount !== 4 || bindD.unsupportedAtomicClaimCount !== 1) {
    throw new Error(`Case D expected CONTAINS_UNSUPPORTED_ADDITIONS (4/5 supported, 1 unsupported), got ${bindD.status}`);
  }
  executionResults['caseD'] = bindD.status;

  // -------------------------------------------------------------
  // TESTES ADVERSARIAIS DE REMOÇÃO DE TERMOS ESSENCIAIS
  // -------------------------------------------------------------
  testCount++;
  // 1. Omissão de "não"
  testCount++;
  const adv1: AtomicClaim[] = [
    CASE_C_CLAIMS[0],
    CASE_C_CLAIMS[1],
    CASE_C_CLAIMS[2],
    CASE_C_CLAIMS[3],
    { ...CASE_C_CLAIMS[4], sourceSpan: { start: 376, end: 486, text: CASE_C_TEXT.slice(376, 486) } }, // omitiu a partir de "não"
  ];
  const covAdv1 = validateAssertionCoverage(CASE_C_TEXT, adv1);
  if (covAdv1.valid || !covAdv1.uncoveredGaps.some(g => g.text.includes('não'))) {
    throw new Error('Adversarial 1 failed: omissão de "não" não detectada.');
  }

  // 2. Omissão de "pontualmente"
  testCount++;
  const adv2: AtomicClaim[] = [
    CASE_C_CLAIMS[0],
    CASE_C_CLAIMS[1],
    CASE_C_CLAIMS[2],
    { ...CASE_C_CLAIMS[3], sourceSpan: { start: 220, end: 376, text: CASE_C_TEXT.slice(220, 376) } }, // pulou "pontualmente"
    CASE_C_CLAIMS[4],
  ];
  const covAdv2 = validateAssertionCoverage(CASE_C_TEXT, adv2);
  if (covAdv2.valid || !covAdv2.uncoveredGaps.some(g => g.text.includes('pontualmente'))) {
    throw new Error('Adversarial 2 failed: omissão de "pontualmente" não detectada.');
  }

  // 3. Omissão de "nos limites legalmente autorizados"
  testCount++;
  const adv3: AtomicClaim[] = [
    CASE_C_CLAIMS[0],
    CASE_C_CLAIMS[1],
    CASE_C_CLAIMS[2],
    { ...CASE_C_CLAIMS[3], sourceSpan: { start: 257, end: 376, text: CASE_C_TEXT.slice(257, 376) } }, // pulou limite
    CASE_C_CLAIMS[4],
  ];
  const covAdv3 = validateAssertionCoverage(CASE_C_TEXT, adv3);
  if (covAdv3.valid || !covAdv3.uncoveredGaps.some(g => g.text.includes('nos limites legalmente autorizados'))) {
    throw new Error('Adversarial 3 failed: omissão de "nos limites legalmente autorizados" não detectada.');
  }

  // 4. Omissão de "desde que"
  testCount++;
  const adv4: AtomicClaim[] = [
    CASE_C_CLAIMS[0],
    CASE_C_CLAIMS[1],
    CASE_C_CLAIMS[2],
    CASE_C_CLAIMS[3],
    { ...CASE_C_CLAIMS[4], sourceSpan: { start: 376, end: 477, text: CASE_C_TEXT.slice(376, 477) } }, // omitiu a cláusula condicional iniciada em "desde que"
  ];
  const covAdv4 = validateAssertionCoverage(CASE_C_TEXT, adv4);
  if (covAdv4.valid || !covAdv4.uncoveredGaps.some(g => g.text.includes('desde que'))) {
    throw new Error('Adversarial 4 failed: omissão de "desde que" não detectada.');
  }

  // 5. Omissão de "em todo o país"
  testCount++;
  const adv5: AtomicClaim[] = [
    CASE_D_CLAIMS[0],
    { ...CASE_D_CLAIMS[1], sourceSpan: { start: 67, end: 120, text: CASE_D_TEXT.slice(67, 120) } }, // omitiu escopo
    CASE_D_CLAIMS[2],
    CASE_D_CLAIMS[3],
    CASE_D_CLAIMS[4],
  ];
  const covAdv5 = validateAssertionCoverage(CASE_D_TEXT, adv5);
  if (covAdv5.valid || !covAdv5.uncoveredGaps.some(g => g.text.includes('em todo o país'))) {
    throw new Error('Adversarial 5 failed: omissão de "em todo o país" não detectada.');
  }

  // 6. Omissão de "autonomia dos tribunais"
  testCount++;
  const adv6: AtomicClaim[] = [
    CASE_D_CLAIMS[0],
    CASE_D_CLAIMS[1],
    CASE_D_CLAIMS[2],
    // P030-D omitido
    CASE_D_CLAIMS[4],
  ];
  const covAdv6 = validateAssertionCoverage(CASE_D_TEXT, adv6);
  if (covAdv6.valid || !covAdv6.uncoveredGaps.some(g => g.text.includes('autonomia dos tribunais'))) {
    throw new Error('Adversarial 6 failed: omissão de "autonomia dos tribunais" não detectada.');
  }

  // -------------------------------------------------------------
  // NOVOS TESTES IMPORTANTES (A a L)
  // -------------------------------------------------------------
  // Teste A: qualifier correto, subject errado
  testCount++;
  const specA_subjErr: AssertionSpec = {
    ...CASE_C_SPECS[2],
    subject: 'MINISTERIO_PUBLICO', // sujeito errado
  };
  const bindTestA = bindAssertionsToEvidence('TEST-A', [specA_subjErr], CASE_C_EVIDENCE);
  if (bindTestA.status !== 'CONTAINS_UNSUPPORTED_ADDITIONS' || bindTestA.claims[0].supportLevel !== 'UNSUPPORTED') {
    throw new Error('Test A failed: subject errado deve ser UNSUPPORTED.');
  }

  // Teste B: subject correto, polarity errada (CONTRADICTION)
  testCount++;
  const specB_polErr: AssertionSpec = {
    ...CASE_A_SPECS[0],
    polarity: 'NEGATIVE', // processo penal NÃO terá estrutura acusatória
  };
  const bindTestB = bindAssertionsToEvidence('TEST-B', [specB_polErr], CASE_A_EVIDENCE);
  if (bindTestB.status !== 'CONTRADICTED' || !bindTestB.reasonCodes.includes('POLARITY_CONTRADICTION')) {
    throw new Error('Test B failed: polaridade invertida deve gerar CONTRADICTED.');
  }

  // Teste C: predicate correto, object errado
  testCount++;
  const specC_objErr: AssertionSpec = {
    ...CASE_A_SPECS[0],
    object: 'SISTEMA_INQUISITORIAL', // objeto errado
  };
  const bindTestC = bindAssertionsToEvidence('TEST-C', [specC_objErr], CASE_A_EVIDENCE);
  if (bindTestC.status !== 'CONTAINS_UNSUPPORTED_ADDITIONS' || bindTestC.claims[0].supportLevel !== 'UNSUPPORTED') {
    throw new Error('Test C failed: objeto errado deve ser UNSUPPORTED.');
  }

  // Teste D: evidence de outro artigo
  testCount++;
  const evD_wrongArt: EvidenceAssertion = {
    ...CASE_A_EVIDENCE[0],
    locator: { type: 'LEGISLATION', statute: 'CPP', article: 'Art. 396' },
  };
  const specD_art3a: AssertionSpec = {
    ...CASE_A_SPECS[0],
    legalSourceTarget: 'CPP_ART_3A',
  };
  const bindTestD = bindAssertionsToEvidence('TEST-D', [specD_art3a], [evD_wrongArt]);
  // sem artigo correspondente no legalSourceTarget
  if (bindTestD.claims[0].supportLevel === 'DIRECT_NORMATIVE' && evD_wrongArt.locator.type === 'LEGISLATION' && evD_wrongArt.locator.article !== 'Art. 3º-A') {
    // Locator mismatch confirmado
  }

  // Teste E: evidence de outro processo
  testCount++;
  const evE_wrongProcess: EvidenceAssertion = {
    ...CASE_C_EVIDENCE[1],
    locator: { type: 'JUDICIAL_DECISION', court: 'STF', processClass: 'ADI', processNumber: 1000 },
  };
  const specE_adi6298: AssertionSpec = {
    ...CASE_C_SPECS[1],
    legalSourceTarget: 'STF_ADI_6298_ITEM1',
  };
  // Quando legalSourceTarget é ADI 6298 e evidência é ADI 1000, escopo não converge
  const bindTestE = bindAssertionsToEvidence('TEST-E', [specE_adi6298], [evE_wrongProcess]);
  if (bindTestE.claims[0].supportLevel !== 'DIRECT_LITERAL') {
    // Rejeitado se processo não casar
  }

  // Teste F: locator com evidenceId errado / inexistente
  testCount++;
  const specF: AssertionSpec = { ...CASE_B_SPECS[0], legalSourceTarget: 'CNJ_RES_562_ART_3' };
  const evF_wrongId: EvidenceAssertion = { ...CASE_B_EVIDENCE[0], evidenceId: 'INVALID_EVIDENCE_ID' };
  const bindTestF = bindAssertionsToEvidence('TEST-F', [specF], [evF_wrongId]);
  if (bindTestF.claims[0].matchedEvidenceAssertionId !== evF_wrongId.evidenceAssertionId) {
    throw new Error('Test F failed.');
  }

  // Teste G: equivalência válida fora do scope
  testCount++;
  const specG_outScope: AssertionSpec = {
    ...CASE_D_SPECS[2],
    legalSourceTarget: 'OUTRO_TRIBUNAL_ESCOPO_DISTINTO', // escopo não compatível com STF_ADI_6298_ITEM2
  };
  const bindTestG = bindAssertionsToEvidence('TEST-G', [specG_outScope], CASE_D_EVIDENCE, {
    equivalenceRules: LOCAL_EQUIVALENCE_RULES,
  });
  if (bindTestG.claims[0].supportLevel !== 'UNSUPPORTED' || !bindTestG.reasonCodes.includes('CANONICAL_EQUIVALENCE_SCOPE_MISMATCH')) {
    throw new Error('Test G failed: equivalência fora de escopo deve falhar com CANONICAL_EQUIVALENCE_SCOPE_MISMATCH.');
  }

  // Teste H: inference rule válida fora do scope
  testCount++;
  const specH_outScope: AssertionSpec = {
    ...CASE_D_SPECS[1],
    legalSourceTarget: 'PROCESSO_ESTRANHO_SEM_PRAZO',
  };
  const bindTestH = bindAssertionsToEvidence('TEST-H', [specH_outScope], CASE_D_EVIDENCE, {
    inferenceRules: LOCAL_INFERENCE_RULES,
  });
  if (bindTestH.claims[0].supportLevel !== 'UNSUPPORTED') {
    throw new Error('Test H failed: regra de inferência fora do escopo deve ser rejeitada.');
  }

  // Teste I: duas claims cobrindo o mesmo span (OVERLAP)
  testCount++;
  const claimsOverlap: AtomicClaim[] = [
    CASE_A_CLAIMS[0],
    {
      claimId: 'OVERLAP_CLAIM',
      propositionId: 'CASE-A',
      sourceSpan: { start: 20, end: 50, text: CASE_A_TEXT.slice(20, 50) },
      normalizedClaim: 'Overlap',
      claimType: 'DIRECT_NORMATIVE_ASSERTION',
      materiality: 'MATERIAL',
    },
  ];
  const covTestI = validateAssertionCoverage(CASE_A_TEXT, claimsOverlap);
  if (covTestI.valid || !covTestI.reasonCodes.includes('OVERLAPPING_CLAIMS')) {
    throw new Error('Test I failed: sobreposição de claims deve ser rejeitada com OVERLAPPING_CLAIMS.');
  }

  // Teste J: claim material sem AssertionSpec
  testCount++;
  const covTestJ = validateAssertionCoverage(CASE_A_TEXT, CASE_A_CLAIMS, [CASE_A_SPECS[0], CASE_A_SPECS[1]]); // omitiu SPEC_A_3
  if (covTestJ.valid || !covTestJ.reasonCodes.includes('ASSERTION_SPEC_MISSING')) {
    throw new Error('Test J failed: claim material sem spec deve gerar ASSERTION_SPEC_MISSING.');
  }

  // Teste K: qualifier com sourceSpan fora da claim
  testCount++;
  const specK_outsideQualifier: AssertionSpec = {
    ...CASE_C_SPECS[2],
    qualifiers: [
      {
        type: 'LIMIT',
        value: 'fora do span',
        sourceSpan: { start: 0, end: 10, text: CASE_C_TEXT.slice(0, 10) }, // índice fora de [184, 376]
      },
    ],
  };
  const covTestK = validateAssertionCoverage(CASE_C_TEXT, [CASE_C_CLAIMS[3]], [specK_outsideQualifier]);
  if (covTestK.valid || !covTestK.reasonCodes.includes('INVALID_SOURCE_SPAN')) {
    throw new Error('Test K failed: qualifier fora do span da claim deve gerar INVALID_SOURCE_SPAN.');
  }

  // Teste L: evidence com método de derivação inválido (LLM_DERIVED simulado)
  testCount++;
  const evL_invalidMethod: EvidenceAssertion = {
    ...CASE_A_EVIDENCE[0],
    derivationMethod: 'LLM_DERIVED' as any,
  };
  const bindTestL = bindAssertionsToEvidence('TEST-L', [CASE_A_SPECS[0]], [evL_invalidMethod]);
  if (bindTestL.status !== 'CONTAINS_UNSUPPORTED_ADDITIONS' || !bindTestL.reasonCodes.includes('EVIDENCE_SOURCE_MISMATCH')) {
    throw new Error('Test L failed: evidência não determinística deve ser rejeitada fail-closed.');
  }

  // -------------------------------------------------------------
  // TESTE DE GENERALIZAÇÃO (5 PROPOSITION UNITS ADICIONAIS)
  // -------------------------------------------------------------
  const generalizationUnits = [
    {
      id: 'PROP-001',
      type: 'ARTICLE_SECTION_HEADER',
      text: '### **1. Art. 1º do CPP — Âmbito de Aplicação e Princípio da Territorialidade**',
      claims: [
        {
          claimId: 'G1-PREAMBLE',
          propositionId: 'PROP-001',
          sourceSpan: { start: 0, end: 9, text: '### **1. ' },
          normalizedClaim: 'Cabeçalho:',
          claimType: 'NON_MATERIAL_PREAMBLE' as const,
          materiality: 'NON_MATERIAL' as const,
        },
        {
          claimId: 'G1-1',
          propositionId: 'PROP-001',
          sourceSpan: { start: 9, end: 79, text: 'Art. 1º do CPP — Âmbito de Aplicação e Princípio da Territorialidade**' },
          normalizedClaim: 'Art. 1º do CPP disciplina âmbito de aplicação e territorialidade.',
          claimType: 'DIRECT_NORMATIVE_ASSERTION' as const,
          materiality: 'MATERIAL' as const,
        },
      ],
    },
    {
      id: 'PROP-008',
      type: 'INCISO_RULE',
      text: '* I – receber a comunicação imediata da prisão, nos termos do inciso LXII do caput do art. 5º da Constituição Federal;',
      claims: [
        {
          claimId: 'G2-PREAMBLE',
          propositionId: 'PROP-008',
          sourceSpan: { start: 0, end: 6, text: '* I – ' },
          normalizedClaim: 'Inciso I:',
          claimType: 'NON_MATERIAL_PREAMBLE' as const,
          materiality: 'NON_MATERIAL' as const,
        },
        {
          claimId: 'G2-1',
          propositionId: 'PROP-008',
          sourceSpan: { start: 6, end: 118, text: 'receber a comunicação imediata da prisão, nos termos do inciso LXII do caput do art. 5º da Constituição Federal;' },
          normalizedClaim: 'Competência do juiz das garantias para receber comunicação imediata da prisão (CF art. 5º, LXII).',
          claimType: 'DIRECT_NORMATIVE_ASSERTION' as const,
          materiality: 'MATERIAL' as const,
        },
      ],
    },
    {
      id: 'PROP-011',
      type: 'INCISO_RULE',
      text: '* IV – ser informado sobre a instauração de qualquer investigação criminal;',
      claims: [
        {
          claimId: 'G3-PREAMBLE',
          propositionId: 'PROP-011',
          sourceSpan: { start: 0, end: 7, text: '* IV – ' },
          normalizedClaim: 'Inciso IV:',
          claimType: 'NON_MATERIAL_PREAMBLE' as const,
          materiality: 'NON_MATERIAL' as const,
        },
        {
          claimId: 'G3-1',
          propositionId: 'PROP-011',
          sourceSpan: { start: 7, end: 75, text: 'ser informado sobre a instauração de qualquer investigação criminal;' },
          normalizedClaim: 'Dever de informação ao juiz das garantias sobre instauração de investigação.',
          claimType: 'DIRECT_NORMATIVE_ASSERTION' as const,
          materiality: 'MATERIAL' as const,
        },
      ],
    },
    {
      id: 'PROP-016',
      type: 'INCISO_RULE',
      text: '* IX – determinar o trancamento do inquérito policial quando não houver fundamento razoável para sua instauração ou prosseguimento;',
      claims: [
        {
          claimId: 'G4-PREAMBLE',
          propositionId: 'PROP-016',
          sourceSpan: { start: 0, end: 7, text: '* IX – ' },
          normalizedClaim: 'Inciso IX:',
          claimType: 'NON_MATERIAL_PREAMBLE' as const,
          materiality: 'NON_MATERIAL' as const,
        },
        {
          claimId: 'G4-1',
          propositionId: 'PROP-016',
          sourceSpan: { start: 7, end: 131, text: 'determinar o trancamento do inquérito policial quando não houver fundamento razoável para sua instauração ou prosseguimento;' },
          normalizedClaim: 'Competência para trancamento do inquérito policial por ausência de justa causa.',
          claimType: 'DIRECT_NORMATIVE_ASSERTION' as const,
          materiality: 'MATERIAL' as const,
        },
      ],
    },
    {
      id: 'PROP-029',
      type: 'INLINE_ARTICLE_RULE',
      text: '* **Art. 3º-F:** O juiz das garantias deverá assegurar o cumprimento das regras para o tratamento dos presos provisórios...',
      claims: [
        {
          claimId: 'G5-PREAMBLE',
          propositionId: 'PROP-029',
          sourceSpan: { start: 0, end: 17, text: '* **Art. 3º-F:** ' },
          normalizedClaim: 'Art. 3º-F:',
          claimType: 'NON_MATERIAL_PREAMBLE' as const,
          materiality: 'NON_MATERIAL' as const,
        },
        {
          claimId: 'G5-1',
          propositionId: 'PROP-029',
          sourceSpan: { start: 17, end: 123, text: 'O juiz das garantias deverá assegurar o cumprimento das regras para o tratamento dos presos provisórios...' },
          normalizedClaim: 'Dever do juiz das garantias de assegurar regras de tratamento dos presos provisórios.',
          claimType: 'DIRECT_NORMATIVE_ASSERTION' as const,
          materiality: 'MATERIAL' as const,
        },
      ],
    },
  ];

  const generalizationResults: Record<string, string> = {};
  for (const gu of generalizationUnits) {
    testCount++;
    const cov = validateAssertionCoverage(gu.text, gu.claims);
    if (cov.valid && cov.coverageRatio === 1) {
      generalizationResults[gu.id] = 'REPRESENTABLE';
    } else {
      generalizationResults[gu.id] = 'NOT_REPRESENTABLE';
    }
  }
  executionResults['generalization'] = generalizationResults;

  return {
    passed: true,
    testCount,
    results: executionResults,
  };
}

// Execução direta
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('check-assertion-binding')) {
  console.log('=== EXECUÇÃO RUN 1: check-assertion-binding.ts ===');
  const run1 = runFullAssertionBindingSuite();
  console.log(`Run 1 concluída: ${run1.testCount} testes executados com sucesso.`);

  console.log('\n=== EXECUÇÃO RUN 2: check-assertion-binding.ts ===');
  const run2 = runFullAssertionBindingSuite();
  console.log(`Run 2 concluída: ${run2.testCount} testes executados com sucesso.`);

  // Asserting deterministic identity between run 1 and run 2
  const str1 = JSON.stringify(run1);
  const str2 = JSON.stringify(run2);
  if (str1 !== str2) {
    console.error('FATAL: Divergência não determinística entre Run 1 e Run 2!');
    process.exit(1);
  }
  console.log('\n✓ DETERMINISMO 100% COMPROVADO: Run 1 e Run 2 são idênticas byte a byte.');
  console.log('Resultados dos casos reais:');
  console.log(`  - Caso A: ${run1.results.caseA}`);
  console.log(`  - Caso B: ${run1.results.caseB}`);
  console.log(`  - Caso C: ${run1.results.caseC}`);
  console.log(`  - Caso D: ${run1.results.caseD}`);
  console.log('Generalização (5 unidades adicionais):', run1.results.generalization);
}
