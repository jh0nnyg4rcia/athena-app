/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DoctrinalModule } from "./doctrinalRepository";

export const DOCTRINAL_BACEN: DoctrinalModule[] = [
  // =========================================================================
  // 1. REGULAÇÃO BANCÁRIA, PODER DE POLÍCIA E AUTONOMIA DO BACEN (LC 179/2021)
  // =========================================================================
  {
    id: "fuc-pbc-regulacao-supervisao-autonomia",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Regulação Bancária, Poder de Polícia e Supervisão Prudencial do Banco Central (LC nº 179/2021 e Lei nº 4.595/1964)",
    themeKeywords: [
      "banco central do brasil", "bacen", "autarquia de natureza especial", "autonomia técnica", 
      "lei 4.595", "4.595", "lc 179/2021", "lc 179", "179/2021", "poder de polícia do banco central", 
      "poder de policia", "supervisão bancária", "supervisao bancaria", "medidas cautelares preventivas", 
      "regulação financeira", "diretoria colegiada do bacen", "adi 6696", "estabilidade de preços"
    ],
    coreDoctrine: `#### 🏛️ Autonomia Institucional e Regime Autárquico Especial do BACEN

* **Natureza Jurídica e Ausência de Subordinação Hierárquica (LC nº 179/2021)**:
  O Banco Central do Brasil é autarquia federal de natureza especial, dotada de autonomia técnica, operacional, administrativa e financeira. A Lei Complementar nº 179/2021 extinguiu a vinculação ministerial com o Ministério da Fazenda, vedando qualquer relação de tutela, supervisão ministerial imprópria ou subordinação hierárquica. O Supremo Tribunal Federal, no julgamento da **ADI 6.696/DF**, declarou a plena constitucionalidade da autonomia do BACEN, assentando que o mandato fixo da Diretoria Colegiada não vulnera a prerrogativa presidencial do art. 84, II da CF/88.

* **Mandatos Não Coincidentes da Diretoria Colegiada**:
  O Presidente e os 8 Diretores são nomeados pelo Presidente da República após sabatina e aprovação pelo Senado Federal. O mandato é de 4 anos, com termo inicial escalonado: o Presidente do BACEN toma posse no dia 1º de janeiro do terceiro ano de mandato do Presidente da República. A perda do mandato é taxativa (art. 5º da LC 179/2021): renúncia, incapacidade física definitiva, condenação criminal ou por improbidade em órgão colegiado, e comprovado e recorrente desempenho insuficiente (aprovado pelo Senado Federal por maioria absoluta após proposta do CMN).

* **Poder de Polícia e Supervisão Prudencial do SFN**:
  O poder de polícia do BACEN sobre o Sistema Financeiro Nacional possui tríplice dimensão:
  1. **Regulatória e Normativa**: Edição de normas complementares às diretrizes do Conselho Monetário Nacional (CMN);
  2. **Autorizadora (Gatekeeper)**: Competência privativa e discricionariedade técnica para autorizar o funcionamento de instituições financeiras, fintechs, administradoras de consórcios e VASPs;
  3. **Fiscalizatória e Cautelar Preventiva**: Inspeções in loco e monitoramento remoto de solvência, liquidez e risco de crédito, com imposição de medidas cautelares preventivas (termo de ajustamento, aportes de capital, restrições operacionais e suspensão de pagamentos de dividendos).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Constitucionalidade Plena da Autonomia e Mandatos Fixos (STF ADI 6696)",
        author: "STF Tribunal Pleno / Rel. Min. Ricardo Lewandowski / Min. Roberto Barroso",
        thesis: "A fixação de mandatos uniformes para a diretoria do BACEN não coincidentes com o mandato do Chefe do Executivo materializa a necessária estabilidade técnica e neutralidade da política monetária, sem ofensa à separação de poderes.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Violação da Unidade do Poder Executivo e Teoria do Quarto Poder",
        author: "Doutrina Crítica Publicista Minoritária",
        thesis: "Sustenta que a desvinculação ministerial total e a impossibilidade de exoneração ad nutum dos diretores configurariam uma autarquia descolada dos freios e contrapesos republicanos.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que o BACEN é subordinado ao Ministério da Fazenda (FALSO: a LC 179/2021 expressamente revogou qualquer tutela ou vinculação ministerial).",
      "Sustentar que o Presidente da República pode exonerar o Presidente do BACEN ad nutum por divergência de política econômica (FALSO: a exoneração exige estrita subsunção ao rol taxativo do art. 5º e aprovação prévia do Senado Federal).",
      "Confundir as atribuições normativas primárias do CMN com a fiscalização executiva do BACEN (O CMN dita as metas de inflação e diretrizes cambiais; o BACEN executa as operações de mercado aberto, fixação da Selic e supervisão prudencial)."
    ],
    careerNuances: {
      AGU: "Articulação institucional perante o STF na defesa da higidez das normas prudenciais de regulação bancária emitidas pela Diretoria Colegiada.",
      PGFN: "Alinhamento estratégico entre a política fiscal da Fazenda Nacional e os parâmetros de endividamento público e sustentabilidade da dívida geridos pelo BACEN.",
      PF: "Consultoria das agências federais reguladoras inspirada nos precedentes do STF que consolidaram a autonomia das autarquias especiais.",
      PBC: "Defesa técnica privativa da autonomia institucional do BACEN, elaboração de pareceres vinculantes sobre a legalidade de medidas cautelares prudenciais e sustentação oral perante o STF e STJ."
    }
  },

  // =========================================================================
  // 2. PROCESSO ADMINISTRATIVO SANCIONADOR NO SFN (LEI Nº 13.506/2017)
  // =========================================================================
  {
    id: "fuc-pbc-processo-sancionador-13506",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Processo Administrativo Sancionador no Sistema Financeiro Nacional e Meios Consensuais (Lei nº 13.506/2017)",
    themeKeywords: [
      "processo administrativo sancionador", "lei 13.506/2017", "lei 13.506", "13.506", 
      "infrações e penalidades administrativas", "termo de compromisso", "acordo administrativo", 
      "acordo em processo de supervisão", "supervisão bancária", "crsfn", "multa administrativa", 
      "inabilitação", "cassação de autorização", "consensualismo"
    ],
    coreDoctrine: `#### ⚖️ Regime Jurídico do PAS no Âmbito do BACEN (Lei nº 13.506/2017)

* **Princípios Estruturantes e Tipicidade Material Sancionadora**:
  O Processo Administrativo Sancionador (PAS) conduzido pelo BACEN submete-se ao princípio da legalidade estrita, contraditório, ampla defesa e proporcionalidade das sanções. A Lei nº 13.506/2017 unificou o marco punitivo do BACEN e da CVM, afastando a aplicação analógica de regimes genéricos e fixando um catálogo objetivo de tipos infracionais (art. 3º e 4º) que abrangem a gestão temerária em sede administrativa, omissão de informações e descumprimento de limites operacionais.

* **Graduação das Penalidades Administrativas**:
  As penalidades aplicáveis pelo BACEN (art. 5º) incluem:
  1. Admoestação pública;
  2. Multa pecuniária de até R$ 50.000.000,00 ou até o dobro da vantagem obtida;
  3. Inabilitação temporária de até 20 anos para atuar como administrador em instituições sob supervisão;
  4. Cassação de autorização para funcionamento da instituição financeira infratora.

* **Instrumentos Consensuais de Resolução de Conflitos**:
  * **Termo de Compromisso (Art. 20)**: Mecanismo de resolução consensual em que o investigado obriga-se a cessar a prática sob apuração, corrigir irregularidades e indenizar integralmente os prejuízos causados ao mercado. **Não importa confissão de culpa nem reconhecimento de ilicitude**.
  * **Acordo Administrativo em Processo de Supervisão (Art. 28)**: Similar ao acordo de leniência, exige confissão formal e cooperação útil e inédita com as investigações que resulte na identificação dos demais coautores ou apresentação de provas materiais de difícil obtenção.

* **Instância Recursal: Atuação do CRSFN**:
  Das decisões condenatórias colegiadas do BACEN cabe recurso voluntário no prazo de 30 dias para o Conselho de Recursos do Sistema Financeiro Nacional (CRSFN), colegiado integrante da estrutura federal dotado de competência recursal plena sobre matérias punitivas do SFN.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Eficácia Imediata da Decisão e Ausência de Efeito Suspensivo Automático",
        author: "Jurisprudência do STJ e CRSFN / Art. 35 da Lei 13.506/2017",
        thesis: "Os recursos administrativos perante o CRSFN são recebidos exclusivamente no efeito devolutivo, dependendo a concessão de efeito suspensivo de decisão monocrática justificada do Presidente do Conselho mediante demonstração cumulativa de fumaça do bom direito e perigo de dano.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Exigência de Efeito Suspensivo Obrigatório para Multas Elevadas",
        author: "Doutrina de Defesa do Mercado Financeiro",
        thesis: "Sustenta que a execução imediata de multas multimilionárias antes do julgamento final do CRSFN violaria a presunção de inocência administrativa e o princípio da proporcionalidade.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a celebração do Termo de Compromisso implica confissão de culpa do investigado (FALSO: o art. 20, § 1º veda expressamente a interpretação do termo como confissão fática ou jurídica).",
      "Confundir o teto da multa administrativa do BACEN (R$ 50 milhões na Lei 13.506/17) com os limites da Lei Anticorrupção ou do CADE.",
      "Afirmar que o recurso voluntário ao CRSFN é sempre dotado de efeito suspensivo legal automático (FALSO: a regra geral é o efeito devolutivo puro)."
    ],
    careerNuances: {
      AGU: "Padronização de entendimentos sobre a utilização de acordos de leniência e termos de ajustamento em toda a Administração Pública Federal.",
      PGFN: "Inscrição em Dívida Ativa da União e execução fiscal das multas sancionatórias aplicadas pela CVM e BACEN confirmadas pelo CRSFN.",
      PF: "Aplicação da teoria da dosimetria das penas em processos sancionatórios instaurados por agências reguladoras federais.",
      PBC: "Atuação exclusiva na instrução, acusação e julgamento dos processos sancionatórios do BACEN, negociação de Termos de Compromisso e defesa das decisões perante o CRSFN e Justiça Federal."
    }
  },

  // =========================================================================
  // 3. REGIMES DE RESOLUÇÃO BANCÁRIA: INTERVENÇÃO, LIQUIDAÇÃO E RAET
  // =========================================================================
  {
    id: "fuc-pbc-resolucao-bancaria-intervencao-raet",
    discipline: "DIREITO EMPRESARIAL",
    title: "Regimes de Resolução Bancária: Intervenção, Liquidação Extrajudicial (Lei nº 6.024/1974) e RAET (DL nº 2.321/1987)",
    themeKeywords: [
      "resolução bancária", "resolucao bancaria", "lei 6.024/1974", "lei 6.024", "6.024", 
      "intervenção bancária", "liquidação extrajudicial", "raet", "decreto-lei 2.321/1987", 
      "decreto-lei 2.321", "2.321", "indisponibilidade de bens", "responsabilidade dos administradores", 
      "inquérito do bacen", "fgc", "créditos bancários"
    ],
    coreDoctrine: `#### 🏦 Regimes Especiais de Resolução e Saneamento Financeiro

* **Inaplicabilidade do Regime Geral da Lei 11.101/2005**:
  As instituições financeiras submetem-se a regime especial de resolução e liquidação regulado pelas Leis nº 6.024/1974 e Decreto-Lei nº 2.321/1987. A recuperação judicial é expressamente vedada às instituições financeiras (art. 2º, II da Lei 11.101/2005). A falência judicial somente pode ser requerida pelo próprio liquidante nomeado pelo BACEN ou pelo credor após esgotadas as vias de liquidação administrativa.

* **Intervenção (Lei nº 6.024/1974)**:
  Medida de natureza conservativa e saneadora decretada pelo BACEN por prazo de até 6 meses (prorrogável por mais 6). Produz a perda dos mandatos dos administradores e a nomeação de Interventor com plenos poderes de gestão para reestruturar as contas da entidade ou propor a liquidação extrajudicial.

* **Liquidação Extrajudicial (Lei nº 6.024/1974)**:
  Medida extrema de natureza expropriatória que extingue a personalidade mercantil ativa da instituição. Efeitos imediatos:
  1. Suspensão de todas as ações e execuções individuais contra a massa;
  2. Vencimento antecipado de todas as obrigações da instituição liquidanda;
  3. Não fluência de juros contratuais se o ativo não for suficiente para quitar o passivo principal;
  4. Interrupção do prazo prescricional de todas as pretensões contra a instituição.

* **Indisponibilidade dos Bens dos Administradores**:
  Por força do art. 36 da Lei nº 6.024/1974, todos os bens de administradores e membros do conselho fiscal que exerceram mandato nos últimos 12 meses anteriores à decretação tornam-se **indisponíveis de pleno direito**, independentemente de comprovação prévia de culpa ou dolo. A indisponibilidade atinge bens presentes e futuros até a conclusão do inquérito administrativo instaurado pelo BACEN para apuração de responsabilidades civis e societárias.

* **Regime de Administração Especial Temporária (RAET - DL nº 2.321/1987)**:
  Regime que não suspende as atividades da instituição nem as execuções de credores. O Conselho Diretor nomeado pelo BACEN substitui os órgãos de governança societária para sanear a entidade sem alarmar os depositantes nem gerar efeito dominó no mercado financeiro.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Responsabilidade Subjetiva com Culpa Presumida dos Administradores no Inquérito",
        author: "STJ 2ª Seção / Súmula 419 do STF / Doutrina Majoritária",
        thesis: "A responsabilidade civil dos administradores de instituição financeira liquidanda é subjetiva, recaindo sobre eles o ônus probatório de afastar a presunção legal de negligência ou imperícia na condução do passivo da sociedade.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Responsabilidade Objetiva Pura pelo Risco Integral da Atividade",
        author: "Corrente Minoritária Doutrinária",
        thesis: "Defende que a mera gestão de poupança popular atrairia responsabilidade sem culpa em caso de insolvência bancária.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que banco privado pode pleitear diretamente recuperação judicial (FALSO: a recuperação judicial é vedada a instituições financeiras pelo art. 2º da Lei 11.101/2005).",
      "Sustentar que a indisponibilidade dos bens dos ex-administradores depende de ordem judicial liminar prévia (FALSO: decorre automaticamente ope legis da publicação do ato do BACEN no Diário Oficial).",
      "Confundir RAET com Liquidação Extrajudicial (No RAET a instituição opera normalmente sem interrupção de suas obrigações diárias; na Liquidação Extrajudicial há cessação operacional total)."
    ],
    careerNuances: {
      AGU: "Representação da União em litígios envolvendo pedidos de indenização formulados por ex-controladores de bancos sob alegação de desvio de poder na intervenção pública.",
      PGFN: "Cobrança de créditos tributários e habilitação de créditos de Dívida Ativa da União perante a massa liquidanda de bancos extrajudicialmente liquidados.",
      PF: "Consultoria em regimes de intervenção e administração especial temporária decretados por agências reguladoras (ex.: ANS em operadoras de saúde).",
      PBC: "Condução jurídica privativa do processo de liquidação extrajudicial e RAET, representação do liquidante perante o juízo universal da falência e ajuizamento da ação de responsabilidade civil contra os ex-administradores."
    }
  },

  // =========================================================================
  // 4. SISTEMA DE PAGAMENTOS BRASILEIRO, PIX, MOEDAS DIGITAIS E CRIPTOATIVOS
  // =========================================================================
  {
    id: "fuc-pbc-spb-pix-criptoativos",
    discipline: "DIREITO FINANCEIRO E ECONÔMICO",
    title: "Sistema de Pagamentos Brasileiro (SPB), Pix, Moedas Digitais (Drex/CBDC) e Criptoativos (Leis nº 10.214/2001, 12.865/2013 e 14.478/2022)",
    themeKeywords: [
      "sistema de pagamentos brasileiro", "spb", "lei 10.214", "10.214", "arranjos de pagamento", 
      "instituições de pagamento", "lei 12.865", "12.865", "pix", "moeda eletrônica", 
      "drex", "cbdc", "criptoativos", "vasp", "lei 14.478", "14.478", "interoperabilidade"
    ],
    coreDoctrine: `#### 💳 Infraestrutura Financeira, Moeda Digital e Inovação Regulatória

* **Sistema de Pagamentos Brasileiro (SPB - Lei nº 10.214/2001)**:
  O SPB compreende as entidades, sistemas e procedimentos que processam a liquidação de transferências de fundos, operações com títulos e valores mobiliários e câmbio. O marco legal introduziu a **certeza jurídica e a irrevogabilidade das ordens de liquidação** aceitas pelas câmaras de compensação, impedindo que a falência superveniente de uma instituição interrompa ou anule as liquidações multilaterais pendentes no Sistema de Liquidação Diferida ou em Tempo Real (STR).

* **Regime dos Arranjos e Instituições de Pagamento (Lei nº 12.865/2013)**:
  A Lei nº 12.865/2013 disciplinou as empresas de tecnologia financeira (fintechs) e instituições de pagamento, estabelecendo:
  1. **Moeda Eletrônica**: Saldo mantido em conta de pagamento pré-paga para transações de compra e transferência;
  2. **Interoperabilidade Obrigatória**: As redes de pagamentos devem comunicar-se entre si para permitir concorrência justa e barateamento de custos;
  3. **Segregação Patrimonial Estrita (Art. 12)**: Os recursos dos usuários em contas de pagamento não se misturam com o patrimônio próprio da instituição de pagamento e são impenhoráveis por dívidas da empresa.

* **O Ecossistema do Pix e Open Finance**:
  O Pix foi regulamentado pelo BACEN com fundamento na Lei nº 12.865/2013, consistindo em arranjo de pagamento instantâneo público e obrigatório para todas as instituições com mais de 500 mil contas ativas. O Open Finance amplia esse ambiente ao garantir a interoperabilidade e o compartilhamento consentido de dados cadastrais e histórico financeiro entre diferentes intermediários.

* **Moedas Digitais de Banco Central (Drex / CBDC) e Criptoativos (Lei nº 14.478/2022)**:
  * **Drex (Real Digital)**: Representa a moeda soberana oficial em formato escritural digital programável emitida diretamente pelo BACEN, operando em redes DLT de atacado para liquidação de contratos inteligentes (smart contracts);
  * **Marco dos Criptoativos (Lei nº 14.478/2022)**: Regula as empresas que ofertam intermediação ou custódia de ativos virtuais (VASPs), fixando a competência do BACEN para autorização e supervisão das corretoras e exigindo conformidade rigorosa com normas de PLD/FT e governança corporativa.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Natureza Jurídica de Bem Móvel Incorpóreo dos Criptoativos e Tributação Ganho de Capital",
        author: "STJ 3ª e 4ª Turmas / Receita Federal do Brasil",
        thesis: "Criptoativos possuem natureza jurídica de bens incorpóreos e direitos patrimoniais sui generis, não se confundindo com moeda de curso legal nem com moeda eletrônica regulada, sujeitando-se à penhora judicial eletrônica via BACEN-JUD/SISBAJUD.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Equiparação Funcional dos Criptoativos a Valores Mobiliários",
        author: "Corrente Minoritária da Regulação de Mercados",
        thesis: "Sustenta que qualquer criptoativo distribuído publicamente deveria ser fiscalizado pela CVM como contrato de investimento coletivo.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Confundir Moeda Eletrônica (saldo em reais em conta do Nubank/PicPay) com Criptoativo ou Moeda Digital Soberana (Drex).",
      "Afirmar que os saldos de contas de pagamento dos clientes respondem pela massa falida da instituição de pagamento (FALSO: o art. 12 da Lei 12.865/2013 consagra a separação patrimonial absoluta).",
      "Sustentar que o Pix foi criado por lei federal específica aprovada no Congresso (FALSO: foi estruturado e instituído mediante Resoluções normativas do BACEN com base na Lei 12.865/2013)."
    ],
    careerNuances: {
      AGU: "Defesa judicial da soberania monetária brasileira e dos marcos regulatórios da internet e proteção de dados aplicados ao setor bancário.",
      PGFN: "Fiscalização tributária das transações financeiras digitais e regulamentação das declarações de criptoativos perante a Receita Federal.",
      PF: "Modelagem regulatória de sandbox em agências federais para teste de tecnologias inovadoras.",
      PBC: "Consultoria e regulação técnica do projeto Drex, elaboração dos atos normativos do Pix e condução do processo de autorização e fiscalização das exchanges de criptoativos (VASPs)."
    }
  },

  // =========================================================================
  // 5. CRIMES CONTRA O SISTEMA FINANCEIRO E LAVAGEM DE CAPITAIS
  // =========================================================================
  {
    id: "fuc-pbc-crimes-sfn-lavagem-dinheiro",
    discipline: "DIREITO PENAL E PROCESSUAL PENAL",
    title: "Crimes contra o Sistema Financeiro Nacional (Lei nº 7.492/1986) e Lavagem de Capitais (Lei nº 9.613/1998)",
    themeKeywords: [
      "crimes contra o sistema financeiro", "lei 7.492", "7.492", "gestão fraudulenta", 
      "gestão temerária", "evasão de divisas", "instituição financeira clandestina", 
      "lavagem de dinheiro", "lavagem de capitais", "lei 9.613", "9.613", "coaf", 
      "inteligência financeira", "comunicação de operações suspeitas", "tema 990 stf"
    ],
    coreDoctrine: `#### 🚨 Direito Penal Econômico e Tutela da Ordem Financeira

* **Crimes de Colarinho Branco (Lei nº 7.492/1986)**:
  A Lei nº 7.492/1986 tutela a estabilidade, a higidez e a credibilidade do Sistema Financeiro Nacional. Principais tipos:
  1. **Gestão Fraudulenta (Art. 4º, caput)**: Conduta habitual e comissiva de fraudar balanços, simular garantias ou emitir títulos fictícios com emprego de engodo;
  2. **Gestão Temerária (Art. 4º, parágrafo único)**: Crime formal e de perigo abstrato caracterizado pela assunção de riscos desmedidos e anormais na administração de recursos alheios, em patente violação às regras prudenciais de liquidez e solvência;
  3. **Operação de Instituição Financeira Clandestina (Art. 16)**: Fazer operar, sem prévia autorização do BACEN, atividade de câmbio, factoring com captação pública de poupança ou pirâmides financeiras;
  4. **Evasão de Divisas (Art. 22)**: Efetuar operação de câmbio não autorizada, promover saída de moeda para o exterior ou **manter depósitos no exterior não declarados à autoridade competente (BACEN)** acima do piso regulamentar fixado em norma administrativa.

* **Lavagem de Capitais (Lei nº 9.613/1998)**:
  Crime autônomo que protege a administração da justiça e a ordem econômico-financeira. Desenvolve-se em três etapas:
  * **Colocação (Placement)**: Inserção do dinheiro sujo no sistema financeiro por fracionamento de depósitos (smurfing);
  * **Dissimulação (Layering)**: Realização de múltiplas operações financeiras complexas internacionais para ocultar a rastreabilidade;
  * **Integração (Integration)**: Investimento final do capital aparentemente lícito em negócios legítimos.

* **O Papel do COAF e Compartilhamento de Inteligência Financeira (STF Tema 990)**:
  O COAF (Conselho de Controle de Atividades Financeiras) atua na coordenação do sistema de inteligência financeira nacional. O STF, no julgamento do **Tema 990 de Repercussão Geral**, fixou a legitimidade do envio de Relatórios de Inteligência Financeira (RIFs) do COAF para o Ministério Público e Polícia Federal sem necessidade de prévia autorização judicial, desde que resguardado o sigilo dos dados cadastrais e financeiros.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Consumação Formal da Gestão Temerária como Crime de Perigo Abstrato",
        author: "STF e STJ (Súmulas e Teses Repetitivas) / Doutrina Majoritária",
        thesis: "O crime de gestão temerária consuma-se com a prática do ato exorbitante do dever de cuidado exigido na administração bancária, dispensando a ocorrência de prejuízo material ou insolvência financeira efetiva da instituição.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Exigência de Dano Patrimonial Concreto para Configuração Típica",
        author: "Doutrina Penal Garantista Minoritária",
        thesis: "Sustenta que a gestão temerária exigiria o efetivo abalo patrimonial ou desfalque material para diferenciar a conduta criminosa de uma mera infração regulatória disciplinar.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Confundir Gestão Fraudulenta com Gestão Temerária: na gestão fraudulenta há fraude deliberada e ardil; na temerária há imprudência crassa e assunção excessiva de risco sem necessariamente fraude.",
      "Afirmar que a evasão de divisas por manter depósitos no exterior independe de valor regulatório mínimo (O STJ pacificou que a omissão de declarar depósitos só é típica penalmente se o saldo no último dia do ano-base for superior ao patamar fixado pelo Banco Central).",
      "Sustentar que o envio de RIF do COAF para a polícia exige autorização judicial prévia (O STF no Tema 990 autorizou o compartilhamento direto de ofício sem quebra de sigilo judicial)."
    ],
    careerNuances: {
      AGU: "Representação de órgãos de controle nos processos de controle concentrado contra leis de combate à corrupção.",
      PGFN: "Encaminhamento de representações fiscais para fins penais nos casos de crimes contra a ordem tributária conexos com lavagem de capitais.",
      PF: "Consultoria para implementação de programas de integridade e compliance em entidades da Administração Indireta.",
      PBC: "Elaboração de relatórios técnicos de fiscalização e comunicação de indícios de crimes contra o SFN e lavagem de capitais diretamente ao Ministério Público Federal."
    }
  },
  // =========================================================================
  // 6. FLUXOGRAMA ANALÍTICO E PRAZOS DO PAS NO BACEN (LEI Nº 13.506/2017)
  // =========================================================================
  {
    id: "fuc-pbc-fluxograma-pas-prazos",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Fluxograma Analítico e Prazos do Processo Administrativo Sancionador no BACEN (Lei nº 13.506/2017 e Resolução BCB nº 131/2021)",
    themeKeywords: [
      "fluxograma do pas", "processo administrativo sancionador", "lei 13.506/2017", "lei 13.506", 
      "resolução bcb 131/2021", "termo de acusação", "cops", "crsfn", "recurso voluntário", 
      "efeito suspensivo", "saídas consensuais", "termo de compromisso", "acordo de supervisão", 
      "instrução probatória", "alegações finais", "prescrição intercorrente"
    ],
    coreDoctrine: `#### 🧭 A Marcha Processual Sancionadora no Banco Central do Brasil

O rito processual sancionador no BACEN é regido pela Lei nº 13.506/2017 e pela Resolução BCB nº 131/2021, aplicando-se subsidiariamente as Leis nº 9.784/1999 e nº 9.873/1999.

* **Fase 1: Supervisão e Investigação Preliminar**:
  Auditorias in loco e monitoramento contínuo pelo corpo fiscalizatório do BACEN. Ações preparatórias e expedição de Termos de Notificação para esclarecimentos. Em caso de risco iminente à higidez do SFN, a Diretoria Colegiada pode decretar medidas cautelares antecedentes de urgência (art. 13 da Lei nº 13.506/2017), como afastamento preventivo de administradores e restrição operacional.

* **Fase 2: Instauração e Termo de Acusação**:
  Formalização do Termo de Acusação com capitulação expressa e individualizada dos fatos e normas violadas (princípio da congruência acusatória). A citação válida constitui o primeiro marco interruptivo da prescrição quinquenal da pretensão punitiva (art. 2º, I, da Lei nº 9.873/1999).

* **Fase 3: Defesa Escrita e Saídas Consensuais**:
  * **Defesa Escrita**: Prazo peremptório de 30 dias úteis (art. 14 da Lei nº 13.506/2017);
  * **Termo de Compromisso (TC - Arts. 19 a 29)**: Cessação da conduta, correção de falhas e indenização. NÃO exige confissão de culpa e suspende o PAS e a prescrição;
  * **Acordo Administrativo em Processo de Supervisão (AAPS - Arts. 30 a 41)**: Exige confissão expressa e cooperação inédita e eficaz, propiciando extinção da punibilidade administrativa ou atenuação de 1/3 a 2/3 da sanção (não gera imunidade penal perante o MPF).

* **Fase 4: Instrução Probatória e Relatório**:
  Produção de perícias, juntada de documentos e oitiva técnica. Em havendo juntada de fatos novos substanciais, abre-se prazo de 10 dias para alegações finais (art. 44 da Lei nº 9.784/1999). A comissão elabora relatório circunstanciado com proposta motivada de absolvição ou condenação dosimetrada.

* **Fase 5: Julgamento em 1ª Instância (Âmbito Interno do BACEN)**:
  Competência do Comitê de Decisão do Processo Administrativo Sancionador (COPS) ou da Diretoria Colegiada. Sessão colegiada com garantia de sustentação oral presencial ou telepresencial por 15 minutos. A decisão condenatória interrompe a prescrição punitiva (art. 2º, III, da Lei nº 9.873/1999).

* **Fase 6: Fase Recursal perante o CRSFN (2ª Instância)**:
  Interposição de Recurso Voluntário perante o Conselho de Recursos do Sistema Financeiro Nacional no prazo de 30 dias. Por expressa disposição legal, o recurso goza de efeito suspensivo como regra geral, obstando a cobrança da multa ou a execução de inabilitações temporárias até o trânsito em julgado administrativo.

* **Fase de Cumprimento e Execução Fiscal**:
  Decorrido in albis o prazo de recolhimento da multa definitiva, os autos são encaminhados à Procuradoria-Geral do BACEN (PGBC) para emissão de Certidão de Dívida Ativa (CDA), inscrição no CADIN e ajuizamento de Execução Fiscal perante a Justiça Federal (art. 109, I, CF c/c Lei nº 6.830/1980).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Efeito Suspensivo Ex Lege do Recurso ao CRSFN",
        author: "Lei nº 13.506/2017, art. 14 / Resolução BCB nº 131/2021",
        thesis: "O recurso ao Conselho de Recursos do Sistema Financeiro Nacional é dotado ope legis de efeito suspensivo ordinário, ressalvadas decisões com fundamento em medida acautelatória por risco sistêmico.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Aplicação Supletiva do Efeito Devolutivo Puro da Lei nº 9.784/1999",
        author: "Corrente Minoritária Administrativista",
        thesis: "Sustenta que os recursos administrativos federais teriam em regra apenas efeito devolutivo pelo art. 61 da Lei nº 9.784/1999, tese rejeitada pela especialidade da Lei nº 13.506/2017.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que o Termo de Compromisso no BACEN exige confissão formal do ilícito (FALSO: o art. 19, § 4º da Lei nº 13.506/2017 expressamente dispensa a confissão; quem exige confissão é o Acordo de Supervisão).",
      "Confundir o prazo de defesa do PAS do BACEN com o prazo geral da Lei 9.784/1999 (No BACEN o prazo é de 30 dias úteis, e não 10 dias).",
      "Sustentar que o julgamento recursal do PAS cabe à Diretoria Colegiada em segunda instância (FALSO: o recurso é apreciado pelo CRSFN, órgão colegiado paritário autônomo do Ministério da Fazenda)."
    ],
    careerNuances: {
      AGU: "Atuação na higidez dos atos punitivos das agências e autarquias especiais perante a Justiça Federal.",
      PGFN: "Representação da Fazenda Nacional perante as sessões do CRSFN.",
      PF: "Consultoria processual para instrução de processos administrativos disciplinares e sancionadores.",
      PBC: "Condução da consultoria jurídica nos procedimentos sancionadores, representação processual da autarquia e ajuizamento das execuções fiscais dos créditos de multas aplicadas."
    }
  },

  // =========================================================================
  // 7. QUADRO COMPARATIVO: PRAZOS PRESCRICIONAIS E DECADENCIAIS NO BACEN
  // =========================================================================
  {
    id: "fuc-pbc-quadro-prazos-prescricao-decadencia",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Quadro Comparativo: Prazos Prescricionais e Decadenciais no Banco Central do Brasil",
    themeKeywords: [
      "prazos prescricionais no bacen", "decadência no bacen", "lei 9.873/1999", "prescrição intercorrente", 
      "prescrição quinquenal", "autotutela", "artigo 54 da lei 9.784", "tema 445 do stf", "quarentena funcional", 
      "lei 6.024", "indisponibilidade de bens", "ccb prescrição", "licitações prazos"
    ],
    coreDoctrine: `#### ⏱️ Matriz Sistemática de Prazos Extintivos no Âmbito do BACEN

| Campo de Incidência | Prazo Legal | Natureza Jurídica | Termo Inicial (Dies a Quo) | Hipótese Interruptiva / Suspensiva | Base Normativa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PAS: Pretensão Punitiva Ordinária** | **5 anos** | Prescricional | Data da prática do fato ou da cessação (permanente) | Citação, ato de apuração ou decisão condenatória | Lei nº 9.873/1999, art. 1º |
| **PAS: Prescrição Intercorrente** | **3 anos** | Prescricional | Data do protocolo ou último ato instrutório útil | Despacho instrutório ou julgamento de mérito | Lei nº 9.873/1999, art. 1º, § 1º |
| **PAS: Fato que também é Crime contra o SFN** | **Prazo Penal** | Prescricional | Regras do Código Penal (art. 109 e 111 do CP) | Causas interruptivas do art. 117 do CP | Lei nº 9.873/1999, art. 1º, § 2º |
| **PAS: Execução da Multa Cominada** | **5 anos** | Prescricional | Trânsito em julgado administrativo condenatório | Despacho que ordenar a citação na Execução Fiscal | Lei nº 9.873/1999, art. 1º-A |
| **Autotutela sobre Atos Favoráveis** | **5 anos** | Decadencial | Data da prática do ato administrativo favorável | Notificação formal para impugnação (salvo má-fé) | Lei nº 9.784/1999, art. 54 |
| **Registro de Aposentadoria no TCU** | **5 anos** | Decadencial | Chegada do processo à Corte de Contas | Transcorrido in albis, opera-se o registro tácito | STF Tema 445 (RE 636.553) |
| **Intervenção em Instituição Financeira** | **Até 6 + 6 meses** | Caducicial | Publicação do ato do BACEN que decretar a medida | Teto máximo e improrrogável de 12 meses | Lei nº 6.024/1974, art. 3º |
| **Indisponibilidade de Bens dos Administradores** | **12 meses anteriores** | Marco Ope Legis | Contados retroativamente da decretação da medida | Alcança universalidade de bens até liquidação final | Lei nº 6.024/1974, art. 36 |
| **Ação de Responsabilidade contra Gestores** | **5 anos** | Prescricional | Homologação final do inquérito do BACEN | Citação válida na ação societária reparatória | Lei nº 6.024/1974, art. 45 |
| **Execução da Cédula de Crédito Bancário (CCB)** | **3 anos** | Prescricional | Vencimento da dívida constante do título cartular | Despacho que ordenar citação em execução | Lei 10.931/04 art. 44 c/c LUG 70 |
| **Ação Monitória fundada em CCB prescrita** | **5 anos** | Prescricional | Dia seguinte ao vencimento da eficácia executiva | Citação válida na ação monitória | STJ Súmula 503 e CC art. 206, § 5º, I |
| **Quarentena de Desimpedimento dos Diretores** | **6 meses** | Impedimento | Término do mandato ou data da exoneração | Percepção de remuneração compensatória integral | LC nº 179/2021, art. 8º |`,
    divergentCurrents: {
      firstCurrent: {
        name: "Termo Inicial do Quinquênio de Aposentadoria no TCU (STF Tema 445)",
        author: "Supremo Tribunal Federal (Tribunal Pleno)",
        thesis: "O prazo decadencial de 5 anos para o TCU registrar aposentadorias de servidores conta-se da chegada do processo ao tribunal, estabilizando o ato por registro tácito se não julgado no quinquênio.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Imprescritibilidade por Natureza de Ato Complexo (Superada)",
        author: "Jurisprudência Histórica do TCU",
        thesis: "Sustentava que o ato de aposentadoria só se aperfeiçoava com o registro, não correndo qualquer prazo antes da decisão final, tese expressamente sepultada pelo STF no Tema 445.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Dizer que a prescrição intercorrente de 3 anos é interrompida por despachos de mero expediente (FALSO: o STJ exige andamento processual substancial e instrutório real).",
      "Confundir a indisponibilidade de bens dos gestores com período de gestão (Atinge os últimos 12 meses anteriores à decretação e alcança bens adquiridos antes ou durante o período).",
      "Afirmar que a anulação de atos desfavoráveis prescreve em 5 anos (A decadência do art. 54 da Lei nº 9.784/1999 protege exclusivamente atos benéficos ao administrado; atos que causam gravame podem ser revistos a qualquer tempo no exercício da legalidade)."
    ],
    careerNuances: {
      AGU: "Controle da segurança jurídica e prazos extintivos em processos de fiscalização e contratos administrativos.",
      PGFN: "Gestão do prazo prescricional para ajuizamento de execuções fiscais tributárias e não tributárias.",
      PF: "Orientação jurídica aos órgãos de recursos humanos sobre vacância, aposentadoria e processos disciplinares.",
      PBC: "Acompanhamento rigoroso da prescrição intercorrente de 3 anos nos inquéritos e processos sancionadores e defesa da indisponibilidade patrimonial ope legis nas liquidações bancárias."
    }
  },

  // =========================================================================
  // 8. DEFESA DA CONCORRÊNCIA BANCÁRIA: CADE VS. BACEN (PARECER GM-085 AGU)
  // =========================================================================
  {
    id: "fuc-pbc-concorrencia-bancaria-cade-bacen",
    discipline: "DIREITO FINANCEIRO E ECONÔMICO",
    title: "Defesa da Concorrência Bancária: Atos de Concentração, Cartéis e Conflito de Competência BACEN vs. CADE (Parecer GM-085 da AGU)",
    themeKeywords: [
      "concorrência bancária", "cade e bacen", "parecer gm-085", "atos de concentração bancários", 
      "risco sistêmico", "failing bank", "dupla análise coordenada", "lei 12.529/2011", 
      "lei 4.595/1964", "cartel de câmbio", "concentração no sfn", "estabilidade sistêmica"
    ],
    coreDoctrine: `#### 🏛️ A Articulação entre Regulação Prudencial e Defesa da Concorrência no SFN

A convivência entre o Banco Central do Brasil (órgão regulador setorial e guardião da estabilidade macroeconômica) e o Conselho Administrativo de Defesa Econômica - CADE (autoridade antitruste da Lei nº 12.529/2011) protagonizou uma das mais relevantes disputas de competência da história administrativa brasileira.

* **O Conflito Histórico e o Parecer Vinculante AGU GM-085**:
  Durante décadas divergiu-se se atos de concentração entre instituições financeiras submetiam-se à aprovação exclusiva do BACEN (com esteio no art. 10 da Lei nº 4.595/1964) ou ao controle concorrencial do CADE. O Superior Tribunal de Justiça (REsp 1.094.218/DF) chegou a reconhecer a precedência material do BACEN com fundamento na força obrigatória do Parecer GM-085 da AGU chancelado pela Presidência da República (art. 40 da LC nº 73/1993).

* **A Solução Harmônica: Memorando de Entendimentos (MoU BACEN/CADE)**:
  Atualmente vigora a sistemática da **dupla análise coordenada**:
  1. **Regra Geral (Competência Concorrente)**: Todo ato de concentração bancário que atinja os patamares de faturamento do art. 88 da Lei nº 12.529/2011 submete-se simultaneamente à avaliação prudencial do BACEN e ao escrutínio concorrencial do CADE;
  2. **Exceção de Prevalência Técnica do BACEN (Failing Bank Doctrine)**: Caso o BACEN ateste formalmente que a instituição encontra-se sob iminente colapso financeiro capaz de deflagrar risco sistêmico generalizado à poupança popular e ao SFN, a decisão da autoridade monetária pela aprovação da incorporação/fusão tem primazia sobre a análise concorrencial antitruste do CADE (art. 192 da CF/88);
  3. **Repressão de Condutas Ilícitas e Cartéis Financeiros**: A apuração e repressão a práticas concertadas e cartéis (como cartéis de fixação de spreads, manipulação de taxas de câmbio offshore ou fechamento de infraestrutura) é de competência plena e inquestionável do Tribunal do CADE.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Dupla Análise Coordenada com Prevalência do BACEN em Risco Sistêmico",
        author: "Memorando de Entendimentos BACEN/CADE / Doutrina Financeira Majoritária",
        thesis: "O CADE avalia a concentração de mercado e eventuais remédios concorrenciais, mas o Banco Central detém prevalência técnica inconteste caso haja comprovação de risco de contágio sistêmico no SFN.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Exclusividade Antitruste Irrestrita do CADE",
        author: "Corrente Concorrencialista Pura",
        thesis: "Defende que nenhum setor regulado, inclusive o bancário, poderia afastar o controle concorrencial pleno do CADE, mesmo diante de crises de liquidez institucional.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que o CADE não tem competência para punir cartéis praticados por bancos (FALSO: a apuração de infrações contra a ordem econômica no setor financeiro compete plenamente ao CADE).",
      "Sustentar que a fusão entre bancos depende unicamente da autorização do CADE (FALSO: exige a autorização prévia e discricionária do BACEN sob o prisma prudencial e de higidez patrimonial).",
      "Ignorar a Teoria do Failing Bank: sob risco sistêmico iminente certificado pelo BACEN, a estabilidade financeira prepondera sobre o juízo concorrencial."
    ],
    careerNuances: {
      AGU: "Conciliação entre órgãos da Administração Federal perante a CCAF nos conflitos regulatórios e concorrenciais.",
      PGFN: "Defesa dos interesses arrecadatórios e de tributação de operações financeiras decorrentes de incorporações societárias.",
      PF: "Consultoria antitruste nas operações envolvendo autarquias e empresas públicas federais.",
      PBC: "Defesa perante o CADE e o Judiciário da competência prudencial do Banco Central e aplicação da exceção de risco sistêmico na aprovação de fusões emergenciais."
    }
  }
];
