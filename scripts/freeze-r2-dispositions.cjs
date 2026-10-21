/**
 * ATHENA — V2.3.7-H2.3-R2
 * FREEZE HUMAN REMEDIATION DISPOSITIONS + PREPARE TWO ISOLATED NEXT-PHASE QUEUES
 * MODE: OFFLINE / ZERO LLM / ZERO NETWORK / ZERO GOLDEN / ZERO REPLACEMENT SELECTION / ZERO LEGAL REVIEW EXECUTION / FAIL-CLOSED
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sha256File = (p) => sha256(fs.readFileSync(p));

const R2_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/remediation/r2-freeze');
fs.mkdirSync(R2_DIR, { recursive: true });

// -----------------------------------------------------------------------------
// 1. VERIFY R1.2 ARTIFACTS
// -----------------------------------------------------------------------------
const EXPECTED_R12 = {
  'h2-014-human-decision-card.md': '2f4a83b8c633f5f6d3a4abb40fb54191c6781ad456bf68cc54cb4afe254702bb',
  'h2-015-human-decision-card.md': '1e44231794cc957bc4e9cab3ea1c2ac4a3c0a705bab4831bddf7e00db0bbd809',
  'h2-028-human-decision-card.md': '2ec4a37f642835b8a8a8963b2a87a6c42093f7d6a5c667ac1f11451acfef7573',
  'h2-029-human-decision-card.md': '6116e9bd827c38973fc3caf80b38b19cbeb42834c62278048c40fa9cb7da16e4',
  'h2-043-human-decision-card.md': '234f21e9e75230c537aa28e650f55cc8e010118d06f7bc992b225c537767054f',
  'h2-044-human-decision-card.md': 'fc16788a6e366bce735256364ea02b121f10dc0872704abadcc41d5851612f74',
  'remediation-human-review-dossier.md': '7ab1c09fc7f5ffa8b65dec327b97afa656d120da8387d31bae93cb33d40032ac',
  'remediation-human-review-manifest.json': '5967bd4554cff31d578cf54b487f4e8024fe24dd3432b734531e8a3109ff3645'
};

const r12Dir = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/remediation/r1-final-review');
for (const [f, exp] of Object.entries(EXPECTED_R12)) {
  const p = path.join(r12Dir, f);
  const act = sha256File(p);
  if (act !== exp) {
    throw new Error(`ABORT: R1.2 verification failed on ${f}: ${act} != ${exp}`);
  }
}
console.log('Verification 1: R1.2 freeze artifacts verified 100%.');

// -----------------------------------------------------------------------------
// 2. DATASET PRE-EXECUTION HASHES
// -----------------------------------------------------------------------------
const DATASET_PATHS = {
  'dataset/h2-source-dataset.hardened.internal.json': {
    exp: '5d736b19dd1cc3ff1b7c111f9f4333904aaca6a8d74a1a508b95aa28d6f9d461',
    p: path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h211/dataset/h2-source-dataset.hardened.internal.json')
  },
  'dataset/h2-blind-input.hardened.preview.json': {
    exp: 'a92c7208b27a90f0cbfd95d68b118c6ae7120bdf25c933cffc77bfd31a30ae4b',
    p: path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h211/dataset/h2-blind-input.hardened.preview.json')
  },
  'dataset/h2-source-review-queue.hardened.json': {
    exp: '4340c22564513a9cc8b0969ad0a27838720af55f3e77ba8531febb00e3efd690',
    p: path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h211/dataset/h2-source-review-queue.hardened.json')
  }
};

const datasetPreHashes = {};
for (const [k, v] of Object.entries(DATASET_PATHS)) {
  const act = sha256File(v.p);
  if (act !== v.exp) throw new Error(`ABORT: Pre-dataset mismatch on ${k}: ${act} != ${v.exp}`);
  datasetPreHashes[k] = act;
}

// -----------------------------------------------------------------------------
// 3. RECORD USER DECISIONS & SUPERSEDING EVENTS
// -----------------------------------------------------------------------------
const DECISION_EVENTS = [
  {
    h2Id: 'H2-014',
    previousSourceReviewDecision: 'REJECTED',
    remediationDisposition: 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    decisionStage: 'POST_EVIDENCE_REMEDIATION_DISPOSITION'
  },
  {
    h2Id: 'H2-015',
    previousSourceReviewDecision: 'REJECTED',
    remediationDisposition: 'REPLACE_UNIT',
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    decisionStage: 'POST_EVIDENCE_REMEDIATION_DISPOSITION'
  },
  {
    h2Id: 'H2-028',
    previousSourceReviewDecision: 'REJECTED',
    remediationDisposition: 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    decisionStage: 'POST_EVIDENCE_REMEDIATION_DISPOSITION'
  },
  {
    h2Id: 'H2-029',
    previousSourceReviewDecision: 'REJECTED',
    remediationDisposition: 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    decisionStage: 'POST_EVIDENCE_REMEDIATION_DISPOSITION'
  },
  {
    h2Id: 'H2-043',
    previousSourceReviewDecision: 'REJECTED',
    remediationDisposition: 'KEEP_ORIGINAL',
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    decisionStage: 'POST_EVIDENCE_REMEDIATION_DISPOSITION',
    supersedingEvent: true,
    evidenceFinding: 'ORIGINAL_UNIT_SUPPORTED_AFTER_EVIDENCE_RECONSTRUCTION',
    provenanceNote: 'The original human decision (REJECTED) remains immutably preserved in the historical log. This event records the explicit user reversal to KEEP_ORIGINAL based on reconstructed documentary evidence without altering the originalText or canonicalLocator.'
  },
  {
    h2Id: 'H2-044',
    previousSourceReviewDecision: 'REJECTED',
    remediationDisposition: 'REPLACE_UNIT',
    decisionOrigin: 'USER_EXPLICIT_DECISION',
    decisionStage: 'POST_EVIDENCE_REMEDIATION_DISPOSITION'
  }
];

// Write remediation-disposition-decisions.json
const decisionsJsonPath = path.join(R2_DIR, 'remediation-disposition-decisions.json');
fs.writeFileSync(decisionsJsonPath, JSON.stringify(DECISION_EVENTS, null, 2), 'utf8');

// Write remediation-disposition-freeze.json
const freezeJsonPath = path.join(R2_DIR, 'remediation-disposition-freeze.json');
const freezeData = {
  protocol: 'ATHENA — V2.3.7-H2.3-R2',
  timestamp: new Date().toISOString(),
  decisionOrigin: 'USER_EXPLICIT_DECISION',
  decisionStage: 'POST_EVIDENCE_REMEDIATION_DISPOSITION',
  counts: {
    TOTAL: 6,
    KEEP_ORIGINAL: 1,
    REPLACE_UNIT: 2,
    REQUIRE_EXTERNAL_LEGAL_REVIEW: 3,
    CORRECT_UNIT: 0,
    REMOVE_WITHOUT_REPLACEMENT: 0
  },
  dispositions: {
    'H2-014': 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    'H2-015': 'REPLACE_UNIT',
    'H2-028': 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    'H2-029': 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    'H2-043': 'KEEP_ORIGINAL',
    'H2-044': 'REPLACE_UNIT'
  },
  h2043Accounting: {
    originalDecisionPreserved: 'REJECTED',
    supersedingDisposition: 'KEEP_ORIGINAL',
    evidenceFinding: 'ORIGINAL_UNIT_SUPPORTED_AFTER_EVIDENCE_RECONSTRUCTION',
    originalTextMutated: false,
    canonicalLocatorMutated: false,
    correctedTextCreated: false
  },
  status: 'REMEDIATION_DISPOSITIONS_FROZEN_NEXT_PHASES_READY'
};
fs.writeFileSync(freezeJsonPath, JSON.stringify(freezeData, null, 2), 'utf8');

// Write remediation-disposition-report.md
const reportMdPath = path.join(R2_DIR, 'remediation-disposition-report.md');
const reportMdContent = `# ATHENA — V2.3.7-H2.3-R2: RELATÓRIO DE CONGELAMENTO DE DISPOSIÇÕES DE REMEDIAÇÃO
## Congelamento das Decisões Humanas Explícitas e Preparação de Filas Isoladas

**Data:** ${new Date().toISOString()}  
**Modo:** OFFLINE / ZERO LLM / ZERO NETWORK / ZERO GOLDEN / ZERO REPLACEMENT SELECTION / ZERO LEGAL REVIEW EXECUTION / FAIL-CLOSED  
**Classificação:** \`R2_REMEDIATION_DISPOSITIONS_FROZEN_NEXT_PHASES_READY\`

---

## 1. Verificação de Integridade R1.2

Todos os 8 artefatos da fase R1.2 foram verificados contra seus hashes SHA-256 autoritativos com 100% de conformidade:
- \`h2-014-human-decision-card.md\`: \`2f4a83b8c633f5f6d3a4abb40fb54191c6781ad456bf68cc54cb4afe254702bb\`
- \`h2-015-human-decision-card.md\`: \`1e44231794cc957bc4e9cab3ea1c2ac4a3c0a705bab4831bddf7e00db0bbd809\`
- \`h2-028-human-decision-card.md\`: \`2ec4a37f642835b8a8a8963b2a87a6c42093f7d6a5c667ac1f11451acfef7573\`
- \`h2-029-human-decision-card.md\`: \`6116e9bd827c38973fc3caf80b38b19cbeb42834c62278048c40fa9cb7da16e4\`
- \`h2-043-human-decision-card.md\`: \`234f21e9e75230c537aa28e650f55cc8e010118d06f7bc992b225c537767054f\`
- \`h2-044-human-decision-card.md\`: \`fc16788a6e366bce735256364ea02b121f10dc0872704abadcc41d5851612f74\`
- \`remediation-human-review-dossier.md\`: \`7ab1c09fc7f5ffa8b65dec327b97afa656d120da8387d31bae93cb33d40032ac\`
- \`remediation-human-review-manifest.json\`: \`5967bd4554cff31d578cf54b487f4e8024fe24dd3432b734531e8a3109ff3645\`

---

## 2. Decisões Humanas Explícitas Congeladas

O usuário aprovou integralmente as seis recomendações técnicas apresentadas em R1.2. As disposições foram formalmente registradas como decisões de projeto soberanas:

| h2Id | Decisão Anterior (Source Review) | Disposição de Remediação Congelada | Origem da Decisão | Estágio |
| :---: | :---: | :---: | :---: | :---: |
| **H2-014** | \`REJECTED\` | **\`REQUIRE_EXTERNAL_LEGAL_REVIEW\`** | \`USER_EXPLICIT_DECISION\` | \`POST_EVIDENCE_REMEDIATION_DISPOSITION\` |
| **H2-015** | \`REJECTED\` | **\`REPLACE_UNIT\`** | \`USER_EXPLICIT_DECISION\` | \`POST_EVIDENCE_REMEDIATION_DISPOSITION\` |
| **H2-028** | \`REJECTED\` | **\`REQUIRE_EXTERNAL_LEGAL_REVIEW\`** | \`USER_EXPLICIT_DECISION\` | \`POST_EVIDENCE_REMEDIATION_DISPOSITION\` |
| **H2-029** | \`REJECTED\` | **\`REQUIRE_EXTERNAL_LEGAL_REVIEW\`** | \`USER_EXPLICIT_DECISION\` | \`POST_EVIDENCE_REMEDIATION_DISPOSITION\` |
| **H2-043** | \`REJECTED\` | **\`KEEP_ORIGINAL\`** | \`USER_EXPLICIT_DECISION\` | \`POST_EVIDENCE_REMEDIATION_DISPOSITION\` |
| **H2-044** | \`REJECTED\` | **\`REPLACE_UNIT\`** | \`USER_EXPLICIT_DECISION\` | \`POST_EVIDENCE_REMEDIATION_DISPOSITION\` |

*Aviso de Governança: Estas decisões representam escolhas explícitas de projeto do usuário e NÃO constituem \`QUALIFIED_LEGAL_SIGNOFF\`, \`INDEPENDENT_LEGAL_CERTIFICATION\` ou \`MODEL_DECISION\`.*

---

## 3. Contagem Consolidada de Disposições

- **TOTAL DE UNIDADES AVALIADAS:** 6
- **KEEP_ORIGINAL:** 1 (\`H2-043\`)
- **REPLACE_UNIT:** 2 (\`H2-015\`, \`H2-044\`)
- **REQUIRE_EXTERNAL_LEGAL_REVIEW:** 3 (\`H2-014\`, \`H2-028\`, \`H2-029\`)
- **CORRECT_UNIT:** 0
- **REMOVE_WITHOUT_REPLACEMENT:** 0

---

## 4. Proveniência e Contabilidade de H2-043

- O evento original de rejeição (\`REJECTED\`) permanece preservado intacto nos registros históricos.
- Foi registrado um evento superveniente de remediação que estabelece \`remediationDisposition = KEEP_ORIGINAL\` respaldado em \`ORIGINAL_UNIT_SUPPORTED_AFTER_EVIDENCE_RECONSTRUCTION\`.
- O texto original (\`originalText\`) e o localizador canônico (\`canonicalLocator\`) permanecem estritamente idênticos byte a byte.
- Nenhuma proposição corrigida ou texto alternativo foi criado.

---

## 5. Estrutura das Duas Filas Isoladas

As unidades remanescentes foram bifurcadas em duas filas metodologicamente estanques:
1. **Fila A (Substituição Determinística):** Composta por **H2-015** e **H2-044**. Requer seleção de novas unidades a partir do pool elegível congelado sob regras estritas de isolamento e cotas originais de H2.
2. **Fila B (Revisão Jurídica Externa):** Composta por **H2-014**, **H2-028** e **H2-029**. Requer averiguação independente de direito vigente priorizando precedentes do STF/STJ e legislação oficial.
3. **Unidade Resolvida:** **H2-043** permanece no benchmark em sua forma original, sem necessidade de substituição ou parecer externo.

Nenhuma das duas filas foi executada nesta fase.
`;
fs.writeFileSync(reportMdPath, reportMdContent, 'utf8');

// -----------------------------------------------------------------------------
// 4. PREPARE REPLACEMENT QUEUE & PROTOCOL
// -----------------------------------------------------------------------------
const replacementQueueData = {
  protocol: 'ATHENA — V2.3.7-H2.3-R2',
  timestamp: new Date().toISOString(),
  phase: 'REPLACEMENT_QUEUE_PREPARATION',
  replacementSelected: false,
  queueCount: 2,
  queuedUnits: [
    {
      h2Id: 'H2-015',
      domain: 'PENAL_EXTRAVAGANTE',
      difficulty: 'Hard',
      originalCanonicalLocator: 'LEI_8072_ART_6_PAR_3',
      reasonForReplacement: 'STRUCTURAL_LOCATOR_FAILURE (Art. 6º é alterador e não possui § 3º) e TEMPORAL_CURRENT_LAW_FAILURE (CP Art. 157 § 3º alterado pela Lei 13.654/2018). Regra de integridade do benchmark exige substituição neutra para evitar tailoring.'
    },
    {
      h2Id: 'H2-044',
      domain: 'ADMINISTRATIVO',
      difficulty: 'Hard',
      originalCanonicalLocator: 'LEI_8112_ART_253_PAR_2',
      reasonForReplacement: 'WRONG_PARENT_BINDING (anexo de promulgação de veto ao final do documento após o Art. 253) e CURRENT_APPLICABILITY CONTRADICTED (licença-prêmio revogada pela Lei 9.527/1997). Regra de integridade exige substituição para preservar amostragem natural.'
    }
  ]
};

const replacementQueueJsonPath = path.join(R2_DIR, 'replacement-queue.json');
fs.writeFileSync(replacementQueueJsonPath, JSON.stringify(replacementQueueData, null, 2), 'utf8');

const replacementProtocolMdPath = path.join(R2_DIR, 'replacement-selection-protocol.md');
const replacementProtocolMdContent = `# ATHENA — V2.3.7-H2.3-R2: PROTOCOLO DE SELEÇÃO DE SUBSTITUIÇÃO DETERMINÍSTICA

**Status:** \`PREPARED_FOR_FUTURE_EXECUTION\`  
**Estado Atual:** \`REPLACEMENT_SELECTED = false\`  
**Unidades na Fila:** \`H2-015\`, \`H2-044\`

---

## 1. Princípios Mandatórios de Execução da Substituição

A futura fase de substituição determinística deverá seguir estritamente as seguintes restrições metodológicas:

1. **Origem Exclusiva do Pool Elegível Congelado:** As unidades substitutas deverão ser selecionadas exclusivamente a partir do pool de unidades candidatas já elegíveis e congeladas no processo de amostragem original de H2.
2. **Respeito às Cotas Originais de Domínio:** A unidade substituta de H2-015 deverá pertencer ao mesmo domínio (\`PENAL_EXTRAVAGANTE\`), e a de H2-044 deverá pertencer ao domínio (\`ADMINISTRATIVO\`).
3. **Manutenção do Perfil de Dificuldade:** As unidades substitutas deverão atender aos mesmos critérios de complexidade estrutural e deontológica (\`Hard\`) das unidades originais.
4. **Vedação Absoluta de Tailoring Semântico:** É proibida qualquer seleção orientada pelo comportamento, fraquezas ou erros conhecidos de modelos de linguagem (GPT, Claude ou Gemini).
5. **Zero Uso de Saídas de Modelos:** Não poderão ser utilizadas quaisquer saídas ou avaliações de modelos de H1 ou H2 na seleção.
6. **Zero Golden e Zero LLM:** A seleção é determinística e baseada unicamente nas propriedades formais do pool de normas compiladas.
7. **Rastreabilidade e Proveniência:** Cada candidato selecionado deverá ter seu algoritmo de seleção, timestamp e hash do pool documentados de forma reproduzível.
8. **Checagem de Não Contaminação:** A unidade candidata não poderá colidir nem duplicar nenhuma unidade previamente utilizada no H1 (60 unidades) ou nas demais 58 unidades ativas do H2.
9. **Preservação Histórica das Unidades Rejeitadas:** As unidades H2-015 e H2-044 permanecem documentadas nos registros históricos do benchmark para fins de auditoria científica.

---

## 2. Preservação do Isolamento Cego (Benchmark Blindness)

O módulo de seleção de substitutos **NÃO DEVERÁ RECEBER OU PROCESSAR**:
- Saídas de candidatos de modelos;
- Histórico de erros do GPT-5.6;
- Dados golden ou especificações de decomposição;
- Categorias de falhas qualitativas observadas na inferência.

Apenas os metadados bibliográficos e estruturais da norma (diploma, artigo, parágrafo, contagem de caracteres e tipo deontológico) serão acessíveis ao seletor.
`;
fs.writeFileSync(replacementProtocolMdPath, replacementProtocolMdContent, 'utf8');

// -----------------------------------------------------------------------------
// 5. PREPARE EXTERNAL LEGAL REVIEW QUEUE & PROTOCOL
// -----------------------------------------------------------------------------
const externalLegalReviewQueueData = {
  protocol: 'ATHENA — V2.3.7-H2.3-R2',
  timestamp: new Date().toISOString(),
  phase: 'EXTERNAL_LEGAL_REVIEW_QUEUE_PREPARATION',
  legalReviewExecuted: false,
  queueCount: 3,
  queuedUnits: [
    {
      h2Id: 'H2-014',
      originalText: 'Em caso de sentença condenatória, o juiz decidirá fundamentadamente se o réu poderá apelar em liberdade.',
      canonicalLocator: 'LEI_8072_ART_2_PAR_3',
      documentaryFindings: [
        'Constava como § 2º na redação original de 1990 da Lei nº 8.072.',
        'Renumerado para § 3º pela Lei nº 11.464/2007.',
        'Permanece não tachado (<strike>) no texto compilado do Planalto (l8072.htm).',
        'Lei nº 13.964/2019 revogou expressamente apenas o § 2º.'
      ],
      remainingLegalQuestion: 'Qual o status de vigência e eficácia substantiva da exigência/vedação legal de apelação em liberdade em crimes hediondos após a fixação da jurisprudência do STF sobre presunção de inocência (HC 82.959, ADCs 43, 44 e 54) e a reforma do CPP pela Lei nº 12.403/2011 (art. 387, § 1º)?',
      existingOfficialEvidenceReferences: [
        'Planalto Lei 8.072/1990 compilada (l8072.htm)',
        'Lei nº 11.464/2007',
        'Lei nº 13.964/2019',
        'Jurisprudência do Supremo Tribunal Federal (HC 82.959, ADCs 43, 44, 54)'
      ]
    },
    {
      h2Id: 'H2-028',
      originalText: 'Da carta de guia e seus aditamentos se remeterá cópia ao Conselho Penitenciário.',
      canonicalLocator: 'CPP_ART_677',
      documentaryFindings: [
        'Consta literalmente no texto compilado do CPP (del3689compilado.htm).',
        'A LEP (Lei 7.210/1984, arts. 105 a 107) reestruturou o título executivo na figura da "guia de recolhimento".',
        'O texto da LEP não proíbe expressamente a remessa de cópias informativas ao Conselho Penitenciário.',
        'O Art. 204 da LEP revogou as disposições em contrário sem citar nominalmente o Art. 677 do CPP.'
      ],
      remainingLegalQuestion: 'O Art. 677 do CPP deve ser considerado tacitamente revogado/derrogado pela disciplina integral da LEP sobre guia de recolhimento (LINDB art. 2º, § 1º) ou subsiste como dever procedimental de comunicação acessória perante o Conselho Penitenciário?',
      existingOfficialEvidenceReferences: [
        'Planalto Decreto-Lei nº 3.689/1941 compilado (del3689compilado.htm)',
        'Planalto Lei nº 7.210/1984 (l7210.htm, arts. 105–107 e 204)',
        'LINDB (Decreto-Lei nº 4.657/1942, art. 2º, § 1º)'
      ]
    },
    {
      h2Id: 'H2-029',
      originalText: 'Se, intimado pessoalmente ou por edital com prazo de 20 dias, o réu não comparecer à audiência a que se refere o art. 703, a suspensão ficará sem efeito e será executada imediatamente a pena, salvo prova de justo impedimento, caso em que será marcada nova audiência.',
      canonicalLocator: 'CPP_ART_705',
      documentaryFindings: [
        'Consta literalmente no CPP compilado (del3689compilado.htm).',
        'A LEP (Lei 7.210/1984, art. 161) disciplina que, se intimado pessoalmente ou por edital com prazo de 20 dias, o réu não comparecer injustificadamente à audiência admonitória, a suspensão ficará sem efeito e será executada imediatamente a pena.',
        'O conteúdo substantivo de ambas as regras é idêntico em suas consequências jurídicas.',
        'O Art. 204 da LEP contém revogação geral sem citar expressamente o Art. 705 do CPP.'
      ],
      remainingLegalQuestion: 'Qual a qualificação técnico-jurídica formal da relação entre o Art. 705 do CPP e o Art. 161 da LEP para fins de benchmark ontológico: norma derrogada por especialidade superveniente, norma em vigência concomitante com eficácia paralela ou disciplina procedimental absorvida pelo microssistema executório?',
      existingOfficialEvidenceReferences: [
        'Planalto Decreto-Lei nº 3.689/1941 compilado (del3689compilado.htm, arts. 703 e 705)',
        'Planalto Lei nº 7.210/1984 (l7210.htm, arts. 161 e 204)'
      ]
    }
  ]
};

const externalLegalReviewQueueJsonPath = path.join(R2_DIR, 'external-legal-review-queue.json');
fs.writeFileSync(externalLegalReviewQueueJsonPath, JSON.stringify(externalLegalReviewQueueData, null, 2), 'utf8');

const externalLegalReviewProtocolMdPath = path.join(R2_DIR, 'external-legal-review-protocol.md');
const externalLegalReviewProtocolMdContent = `# ATHENA — V2.3.7-H2.3-R2: PROTOCOLO DE REVISÃO JURÍDICA EXTERNA

**Status:** \`PREPARED_FOR_FUTURE_EXECUTION\`  
**Estado Atual:** \`LEGAL_REVIEW_EXECUTED = false\`  
**Unidades na Fila:** \`H2-014\`, \`H2-028\`, \`H2-029\`

---

## 1. Princípios da Revisão Jurídica Externa Independente

A futura execução da revisão jurídica externa das três unidades na fila deverá observar:

1. **Fontes Autoritativas Primárias:** A verificação deverá fundamentar-se estritamente em repositórios oficiais e precedentes vinculantes.
2. **Hierarquia de Fontes:**
   - **Prioridade 1:** Precedentes vinculantes e teses fixadas pelo Supremo Tribunal Federal (STF) e Superior Tribunal de Justiça (STJ) quando a controvérsia depender de interpretação constitucional ou jurisprudencial.
   - **Prioridade 2:** Legislação oficial consolidada da Presidência da República (Planalto) para verificar atos revogatórios expressos ou históricos de emendas.
   - **Prioridade 3:** Outras fontes oficiais institucionais (atos do CNJ, súmulas administrativas) exclusivamente onde houver lacuna material.
3. **Taxonomia Rigorosa de Qualificação de Parecer:** O revisor não poderá colapsar teses hermenêuticas em fatos determinísticos brutos. Cada assertiva deverá ser categorizada como:
   - \`DOCUMENTARY_FACT\`: Fato demonstrado de forma direta pelo texto legal expresso.
   - \`JURISPRUDENTIAL_HOLDING\`: Tese fixada em precedente obrigatório ou acórdão representativo.
   - \`LEGAL_INTERPRETATION\`: Construção doutrinária ou hermenêutica plausível, mas não textualmente imposta.
   - \`UNRESOLVED\`: Matéria sobre a qual persistem dissídios relevantes sem harmonização uniforme.
4. **Zero Respostas Pré-Concebidas:** Nenhuma questão jurídica é dada como resolvida antecipadamente neste protocolo.

---

## 2. Preservação do Isolamento Cego (Benchmark Blindness)

O processo de revisão jurídica externa **NÃO DEVERÁ TER ACESSO A**:
- Gabaritos deontológicos ou semânticos (golden datasets);
- Proposições atômicas decompostas esperadas (\`atomicClaims\` / \`AssertionSpecs\`);
- Respostas candidatas produzidas por modelos sob teste (GPT-5.6);
- Métricas, pontuações ou rankings obtidos no H1 ou H2;
- Diagnósticos de falhas de modelos (ex.: categorias de erros de decomposição do GPT).

A revisão jurídica opera estritamente "às cegas" em relação ao comportamento do modelo, garantindo imparcialidade e evitando que o critério de correção legal seja moldado para inflar ou desinflar métricas do benchmark.
`;
fs.writeFileSync(externalLegalReviewProtocolMdPath, externalLegalReviewProtocolMdContent, 'utf8');

// -----------------------------------------------------------------------------
// 6. VERIFY POST-EXECUTION DATASET IMMUTABILITY
// -----------------------------------------------------------------------------
const datasetPostHashes = {};
let datasetMutated = false;
for (const [k, v] of Object.entries(DATASET_PATHS)) {
  const act = sha256File(v.p);
  if (act !== v.exp || act !== datasetPreHashes[k]) {
    datasetMutated = true;
  }
  datasetPostHashes[k] = act;
}

if (datasetMutated) {
  throw new Error('CRITICAL ABORT: Dataset mutation detected during R2.');
}
console.log('Verification 2: Dataset immutability verified 100% (before == after).');

// -----------------------------------------------------------------------------
// 7. COMPUTE HASHES OF ALL CREATED ARTIFACTS
// -----------------------------------------------------------------------------
const CREATED_R2_FILES = [
  'remediation-disposition-decisions.json',
  'remediation-disposition-freeze.json',
  'remediation-disposition-report.md',
  'replacement-queue.json',
  'replacement-selection-protocol.md',
  'external-legal-review-queue.json',
  'external-legal-review-protocol.md'
];

const createdR2Hashes = {};
for (const f of CREATED_R2_FILES) {
  const p = path.join(R2_DIR, f);
  createdR2Hashes[f] = sha256File(p);
}

console.log(JSON.stringify({
  status: 'SUCCESS',
  finalClassification: 'R2_REMEDIATION_DISPOSITIONS_FROZEN_NEXT_PHASES_READY',
  datasetPreHashes,
  datasetPostHashes,
  createdArtifacts: createdR2Hashes
}, null, 2));
