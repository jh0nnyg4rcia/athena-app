/**
 * ATHENA — V2.3.7-H2.3-R1.2
 * FINAL HUMAN REMEDIATION DECISION DOSSIER
 * MODE: OFFLINE FIRST / ZERO LLM / ZERO GOLDEN / ZERO CORRECTION / ZERO REPLACEMENT / FAIL-CLOSED
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const sha256File = (p) => sha256(fs.readFileSync(p));

const TARGET_DIR = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/remediation/r1-final-review');
fs.mkdirSync(TARGET_DIR, { recursive: true });

// -----------------------------------------------------------------------------
// 1. VERIFY COMPLETE FREEZE (Pre-R1, R1, R1.1)
// -----------------------------------------------------------------------------
const EXPECTED_PRE_R1 = {
  'dataset/h2-source-dataset.hardened.internal.json': {
    exp: '5d736b19dd1cc3ff1b7c111f9f4333904aaca6a8d74a1a508b95aa28d6f9d461',
    p: 'tmp/assertion-decomposition-holdout-v237h211/dataset/h2-source-dataset.hardened.internal.json'
  },
  'dataset/h2-blind-input.hardened.preview.json': {
    exp: 'a92c7208b27a90f0cbfd95d68b118c6ae7120bdf25c933cffc77bfd31a30ae4b',
    p: 'tmp/assertion-decomposition-holdout-v237h211/dataset/h2-blind-input.hardened.preview.json'
  },
  'dataset/h2-source-review-queue.hardened.json': {
    exp: '4340c22564513a9cc8b0969ad0a27838720af55f3e77ba8531febb00e3efd690',
    p: 'tmp/assertion-decomposition-holdout-v237h211/dataset/h2-source-review-queue.hardened.json'
  },
  'final-source-review/source-review-decisions-60.json': {
    exp: 'd2e652989df745f702d1ecdcde8bca770dd983ca9f7f790cedd21507efc2a6bc',
    p: 'tmp/assertion-decomposition-holdout-v237h22/final-source-review/source-review-decisions-60.json'
  },
  'final-source-review/source-review-rejection-set.json': {
    exp: '7cd3783f33b90e8e8f1bd9be20c66018591b7efc2b110e9d9f87c59af0fd8c2b',
    p: 'tmp/assertion-decomposition-holdout-v237h22/final-source-review/source-review-rejection-set.json'
  },
  'final-source-review/source-review-final-report.md': {
    exp: 'e323b64fe1e2c6b3dee2f2d4230469ac513696ec7cf68ceca1572cce4095c1ca',
    p: 'tmp/assertion-decomposition-holdout-v237h22/final-source-review/source-review-final-report.md'
  },
  'final-source-review/source-review-final-manifest.json': {
    exp: 'f52f161dab7664b1cb3669eb3992d16565d9de56766b6e985ff33c2e2a5a5d7f',
    p: 'tmp/assertion-decomposition-holdout-v237h22/final-source-review/source-review-final-manifest.json'
  },
  'remediation/rejected-unit-remediation-queue.json': {
    exp: 'ded74c747f3d9020a145eae04147807d5f30a0aa90e5f8c74fa5435915409761',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/rejected-unit-remediation-queue.json'
  },
  'remediation/remediation-plan.md': {
    exp: 'dacb09483501e41d563b8f1028473b73e6612d33181699f1c1b6058efdb999f3',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/remediation-plan.md'
  }
};

const EXPECTED_R1 = {
  'remediation-evidence-dossier.md': {
    exp: '2c3903ad32ee325c2929789671583f480a70260a7a215c7f0b1d68454e4e982a',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/evidence/remediation-evidence-dossier.md'
  },
  'remediation-evidence-manifest.json': {
    exp: '6b6873d32afa5e5c4ff80194a832e7f59e0296b8e014d1e27e66d3769eda7bd9',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/evidence/remediation-evidence-manifest.json'
  },
  'h2-014-remediation-evidence.md': {
    exp: 'ef35dc0c911d5706ba30c3cdb10e7e2000c640cf3d981b43b9daf8a9f05d436f',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/evidence/h2-014-remediation-evidence.md'
  },
  'h2-015-remediation-evidence.md': {
    exp: '8bcae2b33a48c1fa685c9070e0c899847c1523b57c6652749b6ad69a307cbe17',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/evidence/h2-015-remediation-evidence.md'
  },
  'h2-028-remediation-evidence.md': {
    exp: 'c3b9963950591493bac9ba93ef35c4f734beb94d8c53d5d5345c6b087d689822',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/evidence/h2-028-remediation-evidence.md'
  },
  'h2-029-remediation-evidence.md': {
    exp: 'a5834f6ab9e7785c089606faaa936c95b49d3635ce72901f9369dedb14f95d57',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/evidence/h2-029-remediation-evidence.md'
  },
  'h2-043-remediation-evidence.md': {
    exp: 'e3f1f06eb6d781ade07f7675b03beb58bdcba04e2cd4413d61993ba28d150e82',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/evidence/h2-043-remediation-evidence.md'
  },
  'h2-044-remediation-evidence.md': {
    exp: '6a26bc41676528b2edb7995486ef51a6e6e0b1f367940f129c869a0531da23fc',
    p: 'tmp/assertion-decomposition-holdout-v237h22/remediation/evidence/h2-044-remediation-evidence.md'
  }
};

const EXPECTED_R11 = {
  'r1-integrity-audit.json': 'f089782764a9be697e7d0defdda19ea7369ec3563652425b3ce77dc901267b89',
  'r1-integrity-audit.md': '7c2878257212fc55faeb63616c84ff6f4aab537de502de34314504337f20e03c',
  'h2-014-claim-audit.md': '08afe1242f3dcf04e0b1d46f484f5139f0bd9bdff1eb96902217e9049a81a807',
  'h2-015-claim-audit.md': 'c11e66efde7a1407922ea641d6eb3e3cecc045a5abaaaec9aa820ffe6c1a1224',
  'h2-028-claim-audit.md': '45f598382a3ee718df419c8060ed05468e0a852806d3341d4630b91b6233cd60',
  'h2-029-claim-audit.md': 'b357b899287fa2a7b1b736a1468c5de79dd8f48c109fa7032ed790aea5a4e8f8',
  'h2-043-claim-audit.md': '313d41aeb9b16184ae8247e16a8beddf5c52b1d97a1d9fbaea6b7c61b633879f',
  'h2-044-claim-audit.md': '0d3bd973ee6a6d8b15fd47f3b022fa87836ebac140a6eacdfeeecd12a3eab912',
  'r1-hardened-evidence-summary.md': 'cb5c1af570ae917541e60face730a1e11fa7eb8018fec97a96a48aedc58ff87b',
  'r1-hardening-manifest.json': '96e4cb370df902f641586baf0d052fcd96d2322cfb055f5fecefa4bd7d825cae'
};

for (const [k, v] of Object.entries(EXPECTED_PRE_R1)) {
  const act = sha256File(path.join(ROOT, v.p));
  if (act !== v.exp) throw new Error(`ABORT: Pre-R1 mismatch on ${k}: ${act} != ${v.exp}`);
}
for (const [k, v] of Object.entries(EXPECTED_R1)) {
  const act = sha256File(path.join(ROOT, v.p));
  if (act !== v.exp) throw new Error(`ABORT: R1 mismatch on ${k}: ${act} != ${v.exp}`);
}
const r11Dir = path.join(ROOT, 'tmp/assertion-decomposition-holdout-v237h22/remediation/r1-hardening');
for (const [k, exp] of Object.entries(EXPECTED_R11)) {
  const act = sha256File(path.join(r11Dir, k));
  if (act !== exp) throw new Error(`ABORT: R1.1 mismatch on ${k}: ${act} != ${exp}`);
}

console.log('Pre-flight verification passed: 100% of Pre-R1, R1, and R1.1 hashes verified.');

// -----------------------------------------------------------------------------
// 2. DECISION CARDS DEFINITIONS
// -----------------------------------------------------------------------------

const CARDS_DATA = {
  'H2-014': {
    h2Id: 'H2-014',
    frozenOriginalText: 'Em caso de sentença condenatória, o juiz decidirá fundamentadamente se o réu poderá apelar em liberdade.',
    frozenCanonicalLocator: 'LEI_8072_ART_2_PAR_3',
    documentaryFindings: [
      'O texto constava como § 2º do Art. 2º da Lei nº 8.072/1990 em sua redação original de 1990.',
      'A Lei nº 11.464/2007 renumerou a matéria para § 3º do Art. 2º da Lei nº 8.072/1990.',
      'No compilado oficial do Planalto (l8072.htm), o texto do § 3º não consta tachado (<strike>).',
      'A Lei nº 13.964/2019 (Pacote Anticrime) revogou expressamente apenas o § 2º (progressão de regime).'
    ],
    legalInferenceRemaining: 'A validade e eficácia material contemporânea da exigência de fundamentação ou restrição ao apelo em liberdade para crimes hediondos em face da jurisprudência do STF (HC 82.959, ADCs 43, 44 e 54 - presunção de inocência) e da disciplina geral do CPP (art. 387, § 1º, com redação da Lei 12.403/2011) constitui controvérsia dogmática e hermenêutica que depende de inferência jurídica externa qualificada, não sendo determinável unicamente pela verificação do texto compilado.',
    currentEvidenceState: {
      TEXT_EXISTENCE: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      STRUCTURAL_BINDING: 'CONTRADICTED (DIRECTLY_ESTABLISHED - extraído de camada histórica desfasada)',
      TEMPORAL_BINDING: 'CONFIRMED_HISTORICAL (DIRECTLY_ESTABLISHED)',
      CURRENT_LAW_APPLICABILITY: 'INDETERMINATE (LEGAL_INFERENCE_REQUIRED)',
      SOURCE_SUFFICIENCY: 'SUFFICIENT_FOR_AUDIT_INSUFFICIENT_FOR_DESIGN',
      READINESS: 'INDETERMINATE_REQUIRES_MORE_EVIDENCE'
    },
    recommendedDisposition: 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    recommendationReason: 'Como a vigência substantiva e a aplicabilidade da norma no direito penal e processual penal positivo permanecem indeterminadas e dependentes de hermenêutica jurisprudencial constitucional, qualquer design de correção ou validação no momento presente incorreria em arbitrariedade prévia sobre a tese jurídica correta.',
    consequenceForFutureGolden: 'Impede a introdução precipitada de um gabarito ontológico controvertido no golden dataset antes de manifestação humana soberana ou parecer jurídico formal.',
    consequenceForBlindBenchmark: 'Protege a acurácia discriminativa do benchmark, evitando a atribuição de penalidades espúrias ao modelo avaliado (GPT-5.6) por divergência puramente dogmática.'
  },

  'H2-015': {
    h2Id: 'H2-015',
    frozenOriginalText: 'Se da violência resulta lesão corporal grave, a pena é de reclusão, de cinco a quinze anos, além da multa; se resulta morte, a reclusão é de vinte a trinta anos, sem prejuízo da multa.',
    frozenCanonicalLocator: 'LEI_8072_ART_6_PAR_3',
    documentaryFindings: [
      'O Art. 6º da Lei nº 8.072/1990 é uma norma meramente alteradora cujo comando prescreve a nova redação de artigos do Código Penal (l8072.htm).',
      'A Lei nº 8.072/1990 não possui parágrafo 3º próprio em seu Art. 6º.',
      'O fragmento normativo extraído pertence ao Código Penal (Decreto-Lei nº 2.848/1940), Art. 157, § 3º, na redação de 1990.',
      'No Código Penal, o Art. 157, § 3º foi expressamente cindido e alterado pela Lei nº 13.654/2018 (incisos I e II), tornando o texto histórico e superado.'
    ],
    legalInferenceRemaining: 'Nenhuma. As falhas de vinculação estrutural (STRUCTURAL_LOCATOR_FAILURE) e de superação temporal (TEMPORAL_CURRENT_LAW_FAILURE) são direta e documentalmente comprovadas.',
    currentEvidenceState: {
      TEXT_EXISTENCE: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      STRUCTURAL_BINDING: 'CONTRADICTED (DIRECTLY_ESTABLISHED - STRUCTURAL_LOCATOR_FAILURE)',
      TEMPORAL_BINDING: 'CONFIRMED_HISTORICAL (DIRECTLY_ESTABLISHED - TEMPORAL_CURRENT_LAW_FAILURE)',
      CURRENT_LAW_APPLICABILITY: 'CONTRADICTED (DIRECTLY_ESTABLISHED)',
      SOURCE_SUFFICIENCY: 'SUFFICIENT',
      READINESS: 'READY_FOR_REMEDIAL_ACTION_CHOICE'
    },
    recommendedDisposition: 'REPLACE_UNIT',
    recommendationReason: 'A unidade padece de defeito cumulado de extração: vinculador inexistente na lei extravagante e texto substantivo histórico superado do Código Penal. Sob a Regra de Integridade do Benchmark (Seção 6), tentar corrigir artesanalmente o localizador para CP_ART_157_PAR_3_INC_II ou reformular o texto após a inspeção da falha introduziria contaminação por adaptação post-hoc (tailoring). A substituição limpa e determinística a partir do pool elegível congelado garante a independência estrita do benchmark.',
    consequenceForFutureGolden: 'O golden manterá apenas unidades originárias do processo de amostragem cega, eliminando enxertos direcionados decorrentes de auditoria corretiva.',
    consequenceForBlindBenchmark: 'Preserva a integridade e representatividade estatística do benchmark H2 de 60 unidades, mantendo o nível de dificuldade orgânico.'
  },

  'H2-028': {
    h2Id: 'H2-028',
    frozenOriginalText: 'Da carta de guia e seus aditamentos se remeterá cópia ao Conselho Penitenciário.',
    frozenCanonicalLocator: 'CPP_ART_677',
    documentaryFindings: [
      'O Art. 677 consta literalmente no texto do Código de Processo Penal compilado (del3689compilado.htm).',
      'A Lei de Execução Penal (Lei nº 7.210/1984, arts. 105 a 107) reestruturou o título executivo da prisão, instituindo a "guia de recolhimento".',
      'O texto da LEP não proíbe expressamente a remessa de cópias ao Conselho Penitenciário.',
      'O Art. 204 da LEP revogou as "disposições em contrário, especialmente a Lei nº 3.274, de 2 de outubro de 1957", sem mencionar expressamente o Art. 677 do CPP.'
    ],
    legalInferenceRemaining: 'A caracterização da perda de aplicabilidade do Art. 677 do CPP por revogação tácita (disciplina integral da matéria nos termos do art. 2º, § 1º da LINDB) depende de inferência doutrinária e hermenêutica, não constituindo fato documental bruto.',
    currentEvidenceState: {
      TEXT_EXISTENCE: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      STRUCTURAL_BINDING: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      TEMPORAL_BINDING: 'CONFIRMED_HISTORICAL (DIRECTLY_ESTABLISHED)',
      CURRENT_LAW_APPLICABILITY: 'INDETERMINATE (LEGAL_INFERENCE_REQUIRED)',
      SOURCE_SUFFICIENCY: 'SUFFICIENT',
      READINESS: 'READY_FOR_REMEDIAL_ACTION_CHOICE'
    },
    recommendedDisposition: 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    recommendationReason: 'Como o texto literal permanece presente e formalmente não revogado no texto compilado do CPP, a conclusão de que foi integralmente derrogado pela LEP requer interpretação jurídica material. Cabe à revisão humana definir explicitamente se unidades sob sobreposição tácita da LEP devem ser mantidas como proposições procedimentais históricas, tidas por vigentes ou descartadas.',
    consequenceForFutureGolden: 'Assegura uniformidade ontológica na catalogação de dispositivos do Livro IV do CPP com institutos correlatos na LEP.',
    consequenceForBlindBenchmark: 'Evita discrepâncias avaliativas e penalidades injustificadas a respostas do modelo que façam menção a qualquer dos dois regimes legais.'
  },

  'H2-029': {
    h2Id: 'H2-029',
    frozenOriginalText: 'Se, intimado pessoalmente ou por edital com prazo de 20 dias, o réu não comparecer à audiência a que se refere o art. 703, a suspensão ficará sem efeito e será executada imediatamente a pena, salvo prova de justo impedimento, caso em que será marcada nova audiência.',
    frozenCanonicalLocator: 'CPP_ART_705',
    documentaryFindings: [
      'O Art. 705 consta literalmente no CPP compilado oficial (del3689compilado.htm).',
      'A Lei nº 7.210/1984 (LEP, art. 161) positivou regra prevendo que, intimado pessoalmente ou por edital com prazo de 20 dias, se o réu não comparecer injustificadamente à audiência admonitória, a suspensão ficará sem efeito e será executada imediatamente a pena.',
      'O núcleo material das regras é compatível e teleologicamente idêntico.',
      'A cláusula geral revogatória do Art. 204 da LEP não cita expressamente o Art. 705 do CPP.'
    ],
    legalInferenceRemaining: 'A afirmação de que o Art. 705 do CPP encontra-se derrogado baseia-se na tese hermenêutica da prevalência do microssistema da execução penal (LEP), dependendo de inferência jurídica teórica.',
    currentEvidenceState: {
      TEXT_EXISTENCE: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      STRUCTURAL_BINDING: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      TEMPORAL_BINDING: 'CONFIRMED_HISTORICAL (DIRECTLY_ESTABLISHED)',
      CURRENT_LAW_APPLICABILITY: 'INDETERMINATE (LEGAL_INFERENCE_REQUIRED)',
      SOURCE_SUFFICIENCY: 'SUFFICIENT',
      READINESS: 'READY_FOR_REMEDIAL_ACTION_CHOICE'
    },
    recommendedDisposition: 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    recommendationReason: 'Dada a sobreposição quase integral de conteúdo e a subsistência do texto no CPP compilado, a qualificação jurídica quanto à derrogação exige parecer deliberado humano para assegurar consistência metodológica entre o CPP e a LEP.',
    consequenceForFutureGolden: 'Estabelece uma diretriz clara e transparente sobre como tratar paralelismos entre a codificação geral e o estatuto de execução no padrão de resposta esperado.',
    consequenceForBlindBenchmark: 'Garante que o benchmark permaneça neutro e justo na pontuação de testes de decomposição assertiva.'
  },

  'H2-043': {
    h2Id: 'H2-043',
    frozenOriginalText: 'Na hipótese de o servidor cedido a empresa pública ou sociedade de economia mista, nos termos das respectivas normas, optar pela remuneração do cargo efetivo ou pela remuneração do cargo efetivo acrescida de percentual da retribuição do cargo em comissão, a entidade cessionária efetuará o reembolso das despesas realizadas pelo órgão ou entidade de origem.',
    frozenCanonicalLocator: 'LEI_8112_ART_93_PAR_2',
    documentaryFindings: [
      'A cadeia normativa oficial compilada da Lei nº 8.112/1990 (l8112cons.htm) estabelece documentalmente que a redação apresentada atualmente como operativa para o Art. 93, § 2º é a redação conferida pela Lei nº 11.355/2006.',
      'A redação temporária introduzida pela Medida Provisória nº 765/2016 não foi mantida na conversão pela Lei nº 13.464/2017 e figura expressamente tachada (<strike>) no repositório oficial da Presidência da República, não constando como texto operativo vigente.',
      'A proposição congelada corresponde exatamente, palavra por palavra, ao texto atualmente operativo em l8112cons.htm.',
      'O localizador congelado LEI_8112_ART_93_PAR_2 é exato, atual e canônico.'
    ],
    legalInferenceRemaining: 'Nenhuma para a verificação do texto operativo vigente. A questão constitucional sobre as relações jurídicas criadas durante a vigência de medida provisória não convertida (CF art. 62, §§ 3º e 11) não afeta a determinação fática de que o texto hoje operativo no Planalto é o da Lei 11.355/2006.',
    currentEvidenceState: {
      TEXT_EXISTENCE: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      STRUCTURAL_BINDING: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      TEMPORAL_BINDING: 'CONFIRMED_CURRENT (DIRECTLY_ESTABLISHED)',
      CURRENT_LAW_APPLICABILITY: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      SOURCE_SUFFICIENCY: 'SUFFICIENT',
      READINESS: 'READY_FOR_REVERSAL_CONSIDERATION'
    },
    recommendedDisposition: 'KEEP_ORIGINAL',
    recommendationReason: 'A unidade original possui proposição perfeitamente verdadeira, vigente e canonicamente vinculada ao dispositivo legal correspondente. A rejeição humana inicial derivou de suposição fática equivocada sobre o desfecho da MP nº 765/2016. A recomendação de manter a unidade representa a reversão da rejeição anterior com base na evidência documental reconstituída, sem qualquer necessidade ou legitimidade para alterações do texto ou do localizador. Conforme governança estrita, a decisão anterior (REJECTED) permanece registrada no histórico como evento originário, sendo superada por decisão formal subsequente de aceitação.',
    consequenceForFutureGolden: 'Permite a absorção íntegra e direta da unidade original no golden semântico.',
    consequenceForBlindBenchmark: 'Preserva a seleção randômica original, mantendo a autenticidade e estabilidade do conjunto de avaliação.'
  },

  'H2-044': {
    h2Id: 'H2-044',
    frozenOriginalText: 'Os períodos de licença-prêmio já adquiridos e não gozados pelo servidor que vier a falecer serão convertidos em pecúnia, em favor de seus beneficiários da pensão.',
    frozenCanonicalLocator: 'LEI_8112_ART_253_PAR_2',
    documentaryFindings: [
      'O fragmento normativo pertence originalmente ao Art. 87, § 2º da Lei nº 8.112/1990 (bloco de promulgação de vetos pelo Congresso Nacional, DOU de 19/04/1991).',
      'O localizador LEI_8112_ART_253_PAR_2 resultou de falha do extrator linear em interpretar o bloco de promulgação anexado ao fim do arquivo compilado após o Art. 253.',
      'No corpo compilado da Lei 8.112 (l8112cons.htm), o dispositivo sobre licença-prêmio encontra-se expressamente riscado (<strike>) em virtude da Lei nº 9.527/1997, que substituiu a licença-prêmio por licença-capacitação.',
      'A unidade acumula vinculação hierárquica inexistente (WRONG_PARENT_BINDING) e matéria legal expressamente extinta no regime estatutário federal.'
    ],
    legalInferenceRemaining: 'Nenhuma. As falhas estrutural e temporal são documentalmente comprovadas de forma direta.',
    currentEvidenceState: {
      TEXT_EXISTENCE: 'CONFIRMED (DIRECTLY_ESTABLISHED)',
      STRUCTURAL_BINDING: 'CONTRADICTED (DIRECTLY_ESTABLISHED - WRONG_PARENT_BINDING)',
      TEMPORAL_BINDING: 'CONFIRMED_HISTORICAL (DIRECTLY_ESTABLISHED - HISTORICAL_TEXT)',
      CURRENT_LAW_APPLICABILITY: 'CONTRADICTED (DIRECTLY_ESTABLISHED - CURRENT_APPLICABILITY)',
      SOURCE_SUFFICIENCY: 'SUFFICIENT',
      READINESS: 'READY_FOR_REMEDIAL_ACTION_CHOICE'
    },
    recommendedDisposition: 'REPLACE_UNIT',
    recommendationReason: 'A unidade conjuga erro grave de segmentação de parser com revogação legal expressa da norma. Conforme a Regra de Integridade do Benchmark (Seção 6), tentar adaptar o localizador para Art. 87 e ajustar proposições transicionais geraria contaminação de benchmark direcionada. A substituição objetiva a partir do pool elegível congelado é o procedimento metodologicamente íntegro e robusto.',
    consequenceForFutureGolden: 'Garante que o golden seja composto apenas de unidades com vinculação estrutural e vigência sólidas.',
    consequenceForBlindBenchmark: 'Evita distorções causadas por fragmentos acidentais de anexos legislativos, assegurando um teste representativo para o GPT-5.6.'
  }
};

// -----------------------------------------------------------------------------
// 3. GENERATE INDIVIDUAL DECISION CARDS
// -----------------------------------------------------------------------------
for (const [id, c] of Object.entries(CARDS_DATA)) {
  const cardPath = path.join(TARGET_DIR, `${id.toLowerCase()}-human-decision-card.md`);
  const cardContent = `# ATHENA — V2.3.7-H2.3-R1.2: CARTÃO DE DECISÃO DE REMEDIAÇÃO HUMANA
## Unidade: ${c.h2Id}

---

### 1. Identificação da Unidade Congelada
- **h2Id:** \`${c.h2Id}\`
- **frozenOriginalText:** "${c.frozenOriginalText}"
- **frozenCanonicalLocator:** \`${c.frozenCanonicalLocator}\`

---

### 2. Constatações Documentais (Documentary Findings)
${c.documentaryFindings.map(f => `- ${f}`).join('\n')}

---

### 3. Inferência Jurídica Remanescente (Legal Inference Remaining)
${c.legalInferenceRemaining}

---

### 4. Estado Atual das Evidências (Current Evidence State)
- **TEXT_EXISTENCE:** \`${c.currentEvidenceState.TEXT_EXISTENCE}\`
- **STRUCTURAL_BINDING:** \`${c.currentEvidenceState.STRUCTURAL_BINDING}\`
- **TEMPORAL_BINDING:** \`${c.currentEvidenceState.TEMPORAL_BINDING}\`
- **CURRENT_LAW_APPLICABILITY:** \`${c.currentEvidenceState.CURRENT_LAW_APPLICABILITY}\`
- **SOURCE_SUFFICIENCY:** \`${c.currentEvidenceState.SOURCE_SUFFICIENCY}\`
- **READINESS:** \`${c.currentEvidenceState.READINESS}\`

---

### 5. Recomendação de Disposição de Remediação
- **recommendedDisposition:** **\`${c.recommendedDisposition}\`**
- **recommendationReason:** ${c.recommendationReason}

---

### 6. Consequências Metodológicas
- **consequenceForFutureGolden:** ${c.consequenceForFutureGolden}
- **consequenceForBlindBenchmark:** ${c.consequenceForBlindBenchmark}

---
*Aviso Estrito: Este cartão contém exclusivamente recomendações técnicas fundamentadas em evidências documentais. Nenhuma proposição corrigida, localizador corrigido, candidato substituto ou dado golden foi gerado. A decisão final cabe soberanamente ao revisor humano.*
`;
  fs.writeFileSync(cardPath, cardContent, 'utf8');
}

// -----------------------------------------------------------------------------
// 4. GENERATE CONSOLIDATED DOSSIER & MANIFEST
// -----------------------------------------------------------------------------
const dossierPath = path.join(TARGET_DIR, 'remediation-human-review-dossier.md');
const dossierContent = `# ATHENA — V2.3.7-H2.3-R1.2: DOSSIÊ CONSOLIDADO DE DECISÃO DE REMEDIAÇÃO HUMANA
## Fase R1.2 — Preparação Final das 6 Unidades Rejeitadas para Deliberação Humana

**Data:** ${new Date().toISOString()}  
**Modo:** OFFLINE FIRST / ZERO LLM / ZERO GOLDEN / ZERO CORRECTION / ZERO REPLACEMENT / FAIL-CLOSED  
**Classificação:** \`R1_FINAL_REMEDIATION_DOSSIER_READY_FOR_HUMAN_DECISION\`

---

## 1. Sumário Executivo de Recomendações de Remediação

| h2Id | Localizador Congelado | Diploma | Disposição Recomendada | Motivo Central da Recomendação | Prontidão Atual |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **H2-014** | \`LEI_8072_ART_2_PAR_3\` | LEI_8072 | **\`REQUIRE_EXTERNAL_LEGAL_REVIEW\`** | Eficácia substantiva perante jurisprudência do STF sobre presunção de inocência depende de inferência jurídica. | \`INDETERMINATE_REQUIRES_MORE_EVIDENCE\` |
| **H2-015** | \`LEI_8072_ART_6_PAR_3\` | LEI_8072 | **\`REPLACE_UNIT\`** | Art. 6º é alterador e não possui § 3º; matéria do CP 157 § 3º foi alterada pela Lei 13.654/2018. Correção violaria integridade de benchmark. | \`READY_FOR_REMEDIAL_ACTION_CHOICE\` |
| **H2-028** | \`CPP_ART_677\` | CPP | **\`REQUIRE_EXTERNAL_LEGAL_REVIEW\`** | Revogação tácita de remessa de cópias ao Conselho Penitenciário pela LEP depende de inferência hermenêutica. | \`READY_FOR_REMEDIAL_ACTION_CHOICE\` |
| **H2-029** | \`CPP_ART_705\` | CPP | **\`REQUIRE_EXTERNAL_LEGAL_REVIEW\`** | Paralelismo funcional com LEP Art. 161 exige posicionamento deliberado quanto à vigência procedimental. | \`READY_FOR_REMEDIAL_ACTION_CHOICE\` |
| **H2-043** | \`LEI_8112_ART_93_PAR_2\` | LEI_8112 | **\`KEEP_ORIGINAL\`** | Cadeia documental oficial comprova que a redação da Lei 11.355/2006 continua ativa após não conversão da MP 765/2016. | \`READY_FOR_REVERSAL_CONSIDERATION\` |
| **H2-044** | \`LEI_8112_ART_253_PAR_2\` | LEI_8112 | **\`REPLACE_UNIT\`** | Falha estrutural de parser (bloco de veto pós-art. 253) e matéria revogada no Art. 87 pela Lei 9.527/1997. Substituição evita viés. | \`READY_FOR_REMEDIAL_ACTION_CHOICE\` |

---

## 2. Taxonomia de Disposição de Remediação Aplicada

1. **\`KEEP_ORIGINAL\`:** A proposição original e o localizador canônico encontram-se material e documentalmente amparados no direito positivo vigente. Recomendada a reversão da decisão de rejeição sem qualquer alteração do texto ou do localizador.
2. **\`CORRECT_UNIT\`:** A unidade contém defeito estrutural ou temporal que comporta reparo determinístico sem violar o isolamento do benchmark. *(Não recomendada para H2-015 e H2-044 em razão da Regra de Integridade de Benchmark).*
3. **\`REPLACE_UNIT\`:** A unidade apresenta vícios graves de extração ou inadequação ontológica. Para evitar contaminação por tailoring pós-auditoria, recomenda-se a substituição determinística por outra unidade do pool elegível congelado.
4. **\`REQUIRE_EXTERNAL_LEGAL_REVIEW\`:** A suficiência documental esbarra na necessidade de inferência hermenêutica ou análise de constitucionalidade/jurisprudência externa para determinação da aplicabilidade da norma.

---

## 3. Justificação da Regra de Integridade do Benchmark (H2-015 e H2-044)

Conforme a Seção 6 do protocolo R1.2:
- **H2-015:** Tentar consertar o localizador de \`LEI_8072_ART_6_PAR_3\` para \`CP_ART_157_PAR_3_INC_II\` e adaptar o texto legal após constatar a falha do extrator representaria intervenção seletiva subjetiva.
- **H2-044:** Tentar reaproveitar o fragmento de licença-prêmio como Art. 87 ou adaptá-lo às regras transitórias da Lei 9.527/1997 alteraria o caráter cego e natural da amostragem.
- **Conclusão:** Ambas as unidades recebem a recomendação técnica de **\`REPLACE_UNIT\`**, cuja execução posterior deverá recorrer exclusivamente ao pool de reserva já congelado de unidades elegíveis, sob as restrições originais de amostragem de H2.

---

## 4. Contabilidade Histórica e Falsa Rejeição de H2-043

- O exame documental da cadeia compilada oficial estabelece que a redação dada pela Lei nº 11.355/2006 ao Art. 93, § 2º da Lei 8.112/1990 permanece como o texto operativo no repositório oficial da Presidência da República. A redação da MP 765/2016 figura expressamente como tachada em \`l8112cons.htm\`.
- A recomendação técnica é **\`KEEP_ORIGINAL\`**.
- **Registro Histórico Preservado:** A decisão inicial do usuário permanece registrada no histórico como \`REJECTED\`. Em caso de confirmação da reversão em etapa humana futura, o evento será contabilizado como superação formal por deliberação humana, sem apagar a rastreabilidade da decisão anterior.

---

## 5. Garantias de Não Intervenção e Próximos Passos

1. Nenhuma recomendação foi executada ou aplicada automaticamente.
2. Nenhuma proposição corrigida foi formulada.
3. Nenhum localizador foi alterado.
4. Nenhuma unidade substituta foi selecionada.
5. Nenhum dado golden foi gerado.
6. Todas as 6 decisões permanecem formalmente registradas como \`REJECTED\` até a expressa manifestação do revisor humano sobre as disposições propostas.
`;
fs.writeFileSync(dossierPath, dossierContent, 'utf8');

// Manifest
const manifestPath = path.join(TARGET_DIR, 'remediation-human-review-manifest.json');
const manifestObj = {
  protocol: 'ATHENA — V2.3.7-H2.3-R1.2',
  timestamp: new Date().toISOString(),
  finalClassification: 'R1_FINAL_REMEDIATION_DOSSIER_READY_FOR_HUMAN_DECISION',
  governance: {
    frozenDecisionsMutated: false,
    datasetMutated: false,
    productionCodeChanged: false,
    deployExecuted: false,
    commitExecuted: false,
    pushExecuted: false,
    llmCalls: 0,
    gptCalls: 0,
    geminiCalls: 0,
    claudeCalls: 0,
    networkCalls: 0,
    goldenCreated: false,
    correctedPropositionCreated: false,
    correctedLocatorCreated: false,
    replacementSelected: false,
    h2Executed: false,
    benchmarkScored: false
  },
  taxonomy: [
    'KEEP_ORIGINAL',
    'CORRECT_UNIT',
    'REPLACE_UNIT',
    'REQUIRE_EXTERNAL_LEGAL_REVIEW',
    'REMOVE_WITHOUT_REPLACEMENT'
  ],
  recommendations: {
    'H2-014': {
      recommendedDisposition: 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
      readiness: 'INDETERMINATE_REQUIRES_MORE_EVIDENCE',
      cardFile: 'h2-014-human-decision-card.md'
    },
    'H2-015': {
      recommendedDisposition: 'REPLACE_UNIT',
      readiness: 'READY_FOR_REMEDIAL_ACTION_CHOICE',
      benchmarkIntegrityRuleApplied: true,
      cardFile: 'h2-015-human-decision-card.md'
    },
    'H2-028': {
      recommendedDisposition: 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
      readiness: 'READY_FOR_REMEDIAL_ACTION_CHOICE',
      cardFile: 'h2-028-human-decision-card.md'
    },
    'H2-029': {
      recommendedDisposition: 'REQUIRE_EXTERNAL_LEGAL_REVIEW',
      readiness: 'READY_FOR_REMEDIAL_ACTION_CHOICE',
      cardFile: 'h2-029-human-decision-card.md'
    },
    'H2-043': {
      recommendedDisposition: 'KEEP_ORIGINAL',
      readiness: 'READY_FOR_REVERSAL_CONSIDERATION',
      remediationFinding: 'ORIGINAL_UNIT_SUPPORTED_AFTER_EVIDENCE_RECONSTRUCTION',
      cardFile: 'h2-043-human-decision-card.md'
    },
    'H2-044': {
      recommendedDisposition: 'REPLACE_UNIT',
      readiness: 'READY_FOR_REMEDIAL_ACTION_CHOICE',
      benchmarkIntegrityRuleApplied: true,
      cardFile: 'h2-044-human-decision-card.md'
    }
  }
};
fs.writeFileSync(manifestPath, JSON.stringify(manifestObj, null, 2), 'utf8');

// -----------------------------------------------------------------------------
// 5. COMPUTE HASHES OF CREATED ARTIFACTS
// -----------------------------------------------------------------------------
const CREATED_R12_FILES = [
  'h2-014-human-decision-card.md',
  'h2-015-human-decision-card.md',
  'h2-028-human-decision-card.md',
  'h2-029-human-decision-card.md',
  'h2-043-human-decision-card.md',
  'h2-044-human-decision-card.md',
  'remediation-human-review-dossier.md',
  'remediation-human-review-manifest.json'
];

const r12Hashes = {};
for (const f of CREATED_R12_FILES) {
  const p = path.join(TARGET_DIR, f);
  r12Hashes[f] = sha256File(p);
}

console.log(JSON.stringify({
  status: 'SUCCESS',
  finalClassification: 'R1_FINAL_REMEDIATION_DOSSIER_READY_FOR_HUMAN_DECISION',
  createdArtifacts: r12Hashes
}, null, 2));
