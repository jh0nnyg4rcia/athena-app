/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DoctrinalModule } from "./doctrinalRepository";

export const DOCTRINAL_AU: DoctrinalModule[] = [
  // =========================================================================
  // 1. LEI ORGÂNICA DA AGU E EFICÁCIA DOS PARECERES VINCULANTES
  // =========================================================================
  {
    id: "au-lei-organica-agu-pareceres-vinculantes-lc73",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Lei Orgânica da AGU (Lei Complementar nº 73/1993), Estrutura Orgânica da Advocacia Federal e Eficácia dos Pareceres Vinculantes",
    themeKeywords: [
      "lei complementar 73", "lc 73", "lei orgânica da agu", "advogado-geral da união",
      "parecer vinculante", "pareceres vinculantes", "artigo 40", "artigo 41",
      "procuradoria-geral da união", "pgu", "consultoria-geral da união", "cgu",
      "corregedoria-geral da advocacia da união", "órgãos de direção superior"
    ],
    coreDoctrine: `#### 🏛️ Estrutura Orgânica da AGU e Eficácia Vinculante dos Pareceres Normativos (LC nº 73/1993)

* **Estrutura e Órgãos de Direção Superior da Advocacia-Geral da União**:
  A Advocacia-Geral da União (AGU) foi concebida pelo art. 131 da Constituição Federal de 1988 como função essencial à Justiça, responsável pela representação judicial e extrajudicial da União direta, bem como pelas atividades de consultoria e assessoramento jurídico do Poder Executivo federal. A Lei Complementar nº 73/1993 estrutura a instituição em órgãos de direção superior:
  1. O Advogado-Geral da União (chefe da instituição, de livre nomeação pelo Presidente da República entre cidadãos de notável saber jurídico e reputação ilibada, maiores de 35 anos);
  2. A Procuradoria-Geral da União (PGU), competente para a representação judicial da União na esfera do contencioso federal perante todos os foros e tribunais;
  3. A Consultoria-Geral da União (CGU), competente para a consultoria e assessoramento jurídico aos órgãos da administração federal direta;
  4. A Corregedoria-Geral da Advocacia da União, encarregada da fiscalização disciplinar, correição e avaliação de desempenho funcional dos membros da carreira.

* **Competências Privativas do Advogado-Geral da União**:
  O art. 4º da LC nº 73/1993 confere ao Advogado-Geral da União competência para assessorar direta e pessoalmente o Presidente da República, representar judicialmente a União nas ações de competência originária do Supremo Tribunal Federal, sugerir a adoção de medidas legislativas e propor a unificação da jurisprudência administrativa da Administração Pública Federal.

* **Regime Jurídico dos Pareceres Vinculantes (Arts. 40 e 41 da LC nº 73/1993)**:
  A manifestação consultiva da AGU assume tríplice graduação de eficácia no ordenamento administrativo federal:
  1. *Parecer Simples ou Facultativo*: Peça de consultoria emitida pelas Consultorias Jurídicas (CONJURs) ministeriais, de observância recomendatória e técnica pelo gestor;
  2. *Parecer Aprovado pelo Advogado-Geral da União (Art. 41)*: Vincula administrativamente todos os órgãos jurídicos integrantes da AGU e suas unidades setoriais;
  3. *Parecer Vinculante com Despacho do Presidente da República (Art. 40)*: Quando aprovado expressamente pelo Presidente da República e publicado no Diário Oficial da União (DOU), adquire força vinculante *erga omnes* obrigatória para toda a Administração Pública Federal direta, autárquica e fundacional. O gestor público federal que contrariar orientação fixada em parecer vinculante publicado pratica falta funcional grave e ato sujeito à anulação de ofício.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Eficácia Vinculante Restrita à Esfera Administrativa Federal (Doutrina Majoritária e STF)",
        author: "STF / Min. Celso de Mello / José dos Santos Carvalho Filho",
        thesis: "O parecer do AGU aprovado pelo Presidente da República vincula estritamente os órgãos e agentes do Poder Executivo Federal, não possuindo força vinculante sobre o Poder Legislativo, o Poder Judiciário, o Tribunal de Contas da União ou os entes federados subnacionais (Estados, DF e Municípios).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Expansão Federativa por Conexão de Recursos Federais",
        author: "Corrente Minoritária de Controladoria",
        thesis: "Sustenta que o parecer vinculante vincularia Estados e Municípios que recebam transferências voluntárias da União mediante convênio ou contrato de repasse.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a aprovação do parecer pelo Advogado-Geral da União basta para gerar eficácia vinculante a toda a Administração Federal direta e indireta (FALSO: a eficácia obrigatória para toda a Administração depende de aprovação expressa pelo Presidente da República e publicação no DOU, nos termos do art. 40 da LC nº 73/1993; a mera aprovação pelo AGU vincula somente os órgãos integrantes da AGU, conforme art. 41).",
      "Confundir as atribuições da PGU com as da PGFN (A PGU cuida do contencioso ordinário e geral da União, ao passo que a PGFN possui competência privativa para a cobrança e execução da Dívida Ativa da União e representação em matéria fiscal-tributária).",
      "Sustentar que o Advogado-Geral da União precisa ser membro de carreira da AGU (FALSO: o art. 131, § 1º da CF/88 exige apenas idade mínima de 35 anos, notável saber jurídico e reputação ilibada, sendo cargo de livre escolha e exoneração do Presidente da República)."
    ],
    careerNuances: {
      AGU: "Núcleo orgânico institucional primordial. O Advogado da União atua diretamente na PGU, CGU e órgãos setoriais de assessoramento aos Ministérios de Estado.",
      PGFN: "Órgão que integra formalmente a AGU, mantendo autonomia técnica na representação fazendária e na gestão da Dívida Ativa da União perante a Secretaria da Receita Federal e o Ministério da Fazenda.",
      PF: "Atuação autárquica vinculada sob supervisão técnica da AGU, com competência específica para defender as autarquias e fundações públicas federais.",
      PBC: "Órgão jurídico autônomo pós-LC 179/2021, atuando nas matérias regulatórias e prudenciais do Sistema Financeiro Nacional."
    }
  },

  // =========================================================================
  // 2. O AGU NO CONTROLE CONCENTRADO PERANTE O STF (ART. 103, § 3º DA CF)
  // =========================================================================
  {
    id: "au-controle-concentrado-defensor-legis-art103",
    discipline: "DIREITO CONSTITUCIONAL",
    title: "O Advogado-Geral da União no Controle Concentrado de Constitucionalidade (Art. 103, § 3º da CF/88): Defensor Legis e Mitigações Jurisprudenciais",
    themeKeywords: [
      "artigo 103", "parágrafo 3", "defensor legis", "curador da lei", "obrigatoriedade de defesa",
      "controle concentrado", "adi", "adc", "adpf", "stf adi 1616", "adi 3916", "adi 2101",
      "advogado-geral da união no stf", "presunção de constitucionalidade"
    ],
    coreDoctrine: `#### ⚖️ O Múnus Constitucional do Advogado-Geral da União no Controle Abstrato

* **A Regra Constitucional do Art. 103, § 3º da Carta da República**:
  O art. 103, § 3º da Constituição Federal estabelece que, quando o Supremo Tribunal Federal apreciar a inconstitucionalidade, em tese, de norma legal ou ato normativo estadual ou federal, o Advogado-Geral da União será previamente citado para defender o ato ou texto impugnado. Trata-se da consagração da figura do *defensor legis* (curador da constitucionalidade da lei), destinada a viabilizar o contraditório constitucional abstrato e a preservar a presunção relativa de constitucionalidade emanada do Poder Legislativo.

* **Natureza da Função do AGU: Defesa da Higidez Normativa**:
  O Advogado-Geral da União, ao atuar no controle concentrado em sede de ADI, não atua como mandatário dos interesses pontuais do Poder Executivo ou da Presidência da República, mas como órgão da República encarregado da sustentação técnica da norma editada pelos representantes do povo. Por essa razão, a citação do AGU é obrigatória sob pena de nulidade processual no rito da ADI (art. 5º da Lei nº 9.868/1999).

* **A Evolução da Jurisprudência do STF sobre a Obrigatoriedade da Defesa**:
  Historicamente, o STF consagrou que o AGU possuía o dever indeclinável de defender a norma impugnada, sendo-lhe vedado concordar com o pedido da petição inicial da ADI ou emitir juízo de inconstitucionalidade. No entanto, a jurisprudência evoluiu substancialmente a partir da Questão de Ordem na **ADI 1.616/PE** e reafirmações na **ADI 3.916/DF** e **ADI 2.101/MS**:
  1. *Regra Geral*: O AGU deve defender a norma legal atacada, resguardando a higidez do ato estatal;
  2. *Exceção 1 (Precedente Vinculante do STF)*: Se o Supremo Tribunal Federal já houver pacificado o tema em sua jurisprudência vinculante ou em controle concentrado prévio declarando a inconstitucionalidade de dispositivo idêntico, o AGU fica dispensado de defender a norma, podendo curvar-se à orientação da Corte Constitucional;
  3. *Exceção 2 (Inconstitucionalidade Chapada ou Notória)*: Quando a norma impugnada violar frontalmente cláusula pétrea ou postulado fundante já reconhecido pelo STF;
  4. *Atuação em ADC e ADPF*: Na Ação Declaratória de Constitucionalidade (ADC) e na Ação de Descumprimento de Preceito Fundamental (ADPF), inexiste a previsão da citação obrigatória para atuar exclusivamente como *defensor legis*, intervindo o AGU de forma alinhada à higidez da ordem jurídica e às posições do Estado federal.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Mitigação Racional da Defesa Normativa (Jurisprudência Atual do STF)",
        author: "STF / Min. Roberto Barroso / Min. Gilmar Mendes / Min. Moreira Alves",
        thesis: "O dever de defender o texto impugnado cede passo perante a existência de entendimento já fixado pelo STF em sentido diametralmente oposto, não fazendo sentido impor ao AGU o dever de sustentar teses sabidamente superadas pela jurisprudência do Tribunal.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Obrigatoriedade Irrestrita da Defesa Normativa",
        author: "Posição Clássica Inicial do STF (Superada)",
        thesis: "O termo 'defenderá' constante do art. 103, § 3º ostentava caráter cogente e absoluto, impondo a obrigação de apresentar argumentos de defesa em qualquer hipótese, sem qualquer margem de concordância com o autor da ADI.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a citação do AGU é exigida na Ação Declaratória de Constitucionalidade (ADC) como defensor legis (FALSO: na ADC a pretensão já é de confirmação da constitucionalidade, de modo que a citação para defesa é desprovida de objeto lógico, atuando o AGU na instrução da causa).",
      "Sustentar que o AGU pode deixar de defender a norma com base em mera discordância ideológica ou política do Governo de plantão (FALSO: a dispensa de defesa só é legitimada perante jurisprudência consolidada do STF em sentido contrário ou patente nulidade constitucional reconhecida por precedentes).",
      "Confundir a manifestação do AGU com o parecer do Procurador-Geral da República (O AGU atua como defensor da norma no art. 103, § 3º, enquanto o PGR oficia como fiscal da ordem jurídica constitucional nos termos do art. 103, § 1º da CF)."
    ],
    careerNuances: {
      AGU: "Competência exclusiva do Advogado-Geral da União, auxiliado pela Secretaria-Geral de Contencioso (SGCT), órgão da Direção Superior da AGU com assento perante o Plenário do STF.",
      PGFN: "Atuação concentrada nos casos tributários e financeiros sob supervisão do AGU quando envolver controle de constitucionalidade fiscal.",
      PF: "Intervenção eventual como amicus curiae em matéria regulatória ou de políticas públicas de autarquias (ex: demarcação de terras ou patentes).",
      PBC: "Auxílio técnico à manifestação do AGU em temas de estabilidade financeira e autonomia do Banco Central."
    }
  },

  // =========================================================================
  // 3. ADVOCACIA PREVENTIVA (CGU) NA LEI 14.133/2021 E DEFESA DE AGENTES
  // =========================================================================
  {
    id: "au-licitacoes-consultoria-cgu-defesa-servidor-lei14133",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Advocacia Pública Consultiva e Preventiva (CGU) na Nova Lei de Licitações (Lei nº 14.133/2021) e Defesa de Agentes Públicos",
    themeKeywords: [
      "lei 14.133", "nova lei de licitacoes", "artigo 53", "parecer jurídico prévio",
      "consultoria-geral da união", "cgu", "defesa de agentes públicos", "artigo 10",
      "lei 9.028", "lindb artigo 22", "minutas padronizadas", "controle prévio de legalidade"
    ],
    coreDoctrine: `#### 📑 Controle Prévio de Legalidade, Minutas Padronizadas e Garantia Institucional do Gestor

* **O Papel da Consultoria-Geral da União (CGU) no Controle Prévio de Legalidade**:
  O art. 53 da Nova Lei de Licitações e Contratos Administrativos (Lei nº 14.133/2021) atribui ao órgão de assessoramento jurídico da Administração o controle prévio de legalidade de contratações públicas. No âmbito federal, essa atribuição é desempenhada privativamente pela Consultoria-Geral da União (CGU) e pelas Consultorias Jurídicas (CONJURs) adjuntas a cada Ministério. O exame jurídico abrange a análise da fase preparatória, editais de licitação, minutas de editais, termos de contrato, acordos, termos de cooperação, convênios e alterações contratuais.

* **Minutas Padronizadas da AGU e Dispensa Fundamentada de Parecer**:
  Visando à celeridade e à desburocratização das compras públicas, a Lei nº 14.133/2021 (art. 53, § 5º) autoriza expressamente que o órgão de assessoramento jurídico elabore minutas padronizadas de editais e contratos. Quando o gestor adotar integralmente as minutas-padrão da AGU sem alterações substantivas, é dispensada a emissão de parecer jurídico individualizado para o caso concreto, bastando certidão nos autos atestando a estrita conformidade com o modelo oficial.

* **Responsabilidade do Advogado Público Consultor (Art. 28 da LINDB)**:
  O parecer emitido pelo Advogado da União possui natureza opinativa e técnica. Conforme jurisprudência pacificada do Supremo Tribunal Federal (MS 24.631/DF e MS 24.584/DF) e ratificada pelo art. 28 da Lei de Introdução às Normas do Direito Brasileiro (LINDB), o procurador ou advogado público somente responderá pessoalmente por seus atos, manifestações e pareceres em caso de dolo ou erro grosseiro. A mera divergência interpretativa plausível da lei afasta qualquer sancionamento pelos órgãos de controle externo (TCU).

* **Defesa Judicial e Extrajudicial de Agentes Públicos pela AGU (Art. 10 da Lei nº 14.133/2021 c/c Lei nº 9.028/1995)**:
  O art. 10 da Lei nº 14.133/2021 estatui que a autoridade e os servidores públicos que tiverem atuado estritamente com base em parecer jurídico do órgão de assessoramento da Administração Pública serão representados judicial e extrajudicialmente pela Advocacia Pública, em processos judiciais e perante tribunais de contas, caso sejam demandados em decorrência de atos praticados no estrito cumprimento do dever legal. Na esfera federal, o art. 22 da Lei nº 9.028/1995 já assegurava a defesa dos titulares de cargos comissionados e agentes públicos pela AGU quando os atos tiverem sido praticados no exercício legítimo de suas funções institucionais e com respaldo técnico.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Garantia Subjetiva do Agente Vinculada à Higidez do Parecer (Regra da Lei nº 14.133/2021)",
        author: "Lei nº 14.133/2021 / AGU / Doutrina Majoritária",
        thesis: "A defesa pela Advocacia Pública é garantia institucional que protege o gestor que se fiou na orientação técnica do parecerista público, ressalvada a comprovação superveniente de conduta dolosa ou fraude praticada pelo agente.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Restrição à Defesa Institucional",
        author: "Correntes de Controle Externo Rígido",
        thesis: "Sustentava que a defesa de servidor público pela Fazenda Pública constituiria desvio de finalidade sempre que houvesse imputação de lesão ao erário, cabendo ao servidor custear seu patrono particular em qualquer cenário sancionador.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a defesa do servidor pela AGU com base no art. 10 da Lei nº 14.133/2021 é automática mesmo quando o agente descumprir as orientações do parecer jurídico (FALSO: a representação institucional pressupõe expressamente que o agente tenha atuado estritamente em consonância com as recomendações do órgão de assessoramento jurídico).",
      "Sustentar que o advogado público que emite parecer em licitação pode ser solidariamente responsabilizado pelo TCU por qualquer falha de execução contratual (FALSO: a responsabilidade do parecerista exige dolo ou erro grosseiro inescusável, não respondendo por desvios fáticos na fase de execução da obra ou fornecimento).",
      "Afirmar que as minutas padronizadas da AGU exigem homologação do Tribunal de Contas da União para terem validade (FALSO: as minutas padronizadas são expedidas pelo órgão de direção da consultoria jurídica interna da AGU no exercício de sua competência legal)."
    ],
    careerNuances: {
      AGU: "Atuação central da Consultoria-Geral da União (CGU) e das Consultorias Jurídicas nos Ministérios da Fazenda, Saúde, Educação, Defesa, etc., atuando na blindagem preventiva dos atos da Presidência e dos Ministros.",
      PGFN: "Exame das minutas de contratações no âmbito do Ministério da Fazenda e formulação de pareceres orçamentários e fiscais de conformidade.",
      PF: "Atuação no assessoramento preventivo de contratos e licitações de autarquias de infraestrutura (DNIT, ANTT, ANAC) e ambientais (IBAMA).",
      PBC: "Controle prévio dos atos de contratação do Banco Central, especialmente na aquisição de sistemas de segurança cibernética e papel-moeda."
    }
  },

  // =========================================================================
  // 4. GESTÃO DE CONFLITOS, CCAF E AUTOCOMPOSIÇÃO NA FAZENDA PÚBLICA
  // =========================================================================
  {
    id: "au-autocomposicao-ccaf-mediacao-fazenda-lei13140",
    discipline: "LEGISLAÇÃO DA AGU, GESTÃO DE CONFLITOS E GOVERNANÇA",
    title: "Gestão Adequada de Conflitos, Câmara de Mediação e Conciliação da Administração Federal (CCAF) e Autocomposição na Fazenda Pública",
    themeKeywords: [
      "ccaf", "câmara de mediação e conciliação", "lei 13.140", "marco legal da mediação",
      "autocomposição", "transação administrativa", "conflitos interorgânicos",
      "conflitos interadministrativos", "indisponibilidade do interesse público mitigada",
      "desjudicialização", "arbitragem na administração pública"
    ],
    coreDoctrine: `#### 🤝 Solução Consensual de Controvérsias e Desjudicialização no Âmbito Federal

* **A Câmara de Mediação e Conciliação da Administração Federal (CCAF)**:
  Instituída no âmbito da Consultoria-Geral da União (CGU), a CCAF é o órgão vocacionado para a resolução consensual de conflitos que envolvam órgãos da Administração Federal direta, autárquica e fundacional, bem como entre a União e os demais entes federativos (Estados, DF e Municípios), empresas estatais ou particulares contratantes. A CCAF materializa a mudança paradigmática da Fazenda Pública, que abandona a postura estritamente litigante para atuar como agente de estabilização social e desjudicialização.

* **Competências e Espécies de Conflitos Submetidos à CCAF**:
  1. *Conflitos Interorgânicos e Interadministrativos*: Controvérsias entre órgãos da União direta (ex: Ministério do Meio Ambiente vs. Ministério dos Transportes) ou entre a União e suas autarquias (ex: União vs. INCRA ou FUNAI). Nestes casos, o processo na CCAF visa a compor a divergência sem necessidade de judicialização, sob pena de violação ao princípio da unidade da Administração Pública;
  2. *Conflitos Federativos*: Disputas patrimoniais, financeiras ou operacionais entre a União e Estados/Municípios (ex: ressarcimento do Fundo de Participação, compensações previdenciárias ou regularização fundiária de áreas urbanas);
  3. *Conflitos entre Administração e Particulares*: Questões contratuais, desapropriações consensuais e adimplemento de obrigações decorrentes de grandes obras de infraestrutura.

* **Releitura do Princípio da Indisponibilidade do Interesse Público**:
  A doutrina contemporânea da Advocacia Pública e a jurisprudência do STF e STJ superaram a concepção anacrônica de que o princípio da indisponibilidade do interesse público imporia o dever de contestar e recorrer até as últimas instâncias judiciais. O interesse público primário (justiça distributiva, satisfação célere da demanda e economia de recursos orçamentários com honorários e custas) prevalece sobre o interesse secundário meramente arrecadatório ou protelatório da Fazenda Pública. A transação e a mediação são autorizadas expressamente pela Lei nº 13.140/2015 (Marco Legal da Mediação) e pelas Portarias Normativas da AGU.

* **Arbitragem e Administração Pública Federal (Lei nº 13.129/2015)**:
  A Administração Pública direta e indireta pode se utilizar da arbitragem para a solução de conflitos decorrentes de contratos administrativos que versem sobre direitos patrimoniais disponíveis (como reequilíbrio econômico-financeiro, indenizações por atraso e penalidades contratuais). A arbitragem de que a União participe é obrigatoriamente de direito e submete-se ao princípio da publicidade (art. 2º, § 3º da Lei nº 9.307/1996), vedando-se o julgamento por equidade ou o sigilo dos autos.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Legitimidade Plena da Autocomposição Administrativa (Doutrina AGU e Jurisprudência)",
        author: "AGU / Marco Legal da Mediação (Lei nº 13.140/2015) / STF",
        thesis: "A Fazenda Pública tem o poder-dever de transigir e buscar acordos preventivos ou incidentais sempre que a celebração do ajuste se mostrar juridicamente viável, faticamente segura e mais vantajosa economicamente do que o custo temporal e financeiro da marcha processual.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Indisponibilidade Absoluta",
        author: "Visão Processualista Tradicional (Superada)",
        thesis: "Sustentava que o Procurador Público não possuía capacidade postulatória dispositiva, dependendo sempre de autorização legal estrita e individualizada do Congresso Nacional para qualquer renúncia ou acordo em litígio.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a arbitragem na Administração Pública admite convenção de julgamento por equidade ou cláusula de sigilo total (FALSO: o art. 2º, § 3º da Lei de Arbitragem exige expressamente julgamento de direito e respeito estrito ao princípio da publicidade).",
      "Sustentar que a submissão de conflito à CCAF acarreta preclusão imediata do direito de ação se não houver acordo (FALSO: frustrada a autocomposição, as partes mantêm intacto o acesso à via jurisdicional).",
      "Confundir mediação pública com renúncia ilegítima de receitas (O acordo firmado na CCAF baseia-se em critérios técnicos, pareceres de viabilidade jurídica e cálculos atuariais que demonstram o benefício da quitação célere frente aos riscos da condenação com juros e correção monetária)."
    ],
    careerNuances: {
      AGU: "Gestão direta da CCAF no âmbito da Consultoria-Geral da União, conduzindo grandes mediações federativas e interministeriais.",
      PGFN: "Transação tributária regulamentada pela Lei nº 13.988/2020, que instituiu o contencioso tributário resolutivo e o programa de conformidade fiscal.",
      PF: "Resolução de conflitos ambientais e fundiários entre autarquias federais (ex: INCRA vs. IBAMA) e comunidades tradicionais na CCAF.",
      PBC: "Utilização do Termo de Compromisso e Acordos de Supervisão como mecanismos consensuais regulatórios sancionadores no âmbito do PAS (Lei nº 13.506/2017)."
    }
  },

  // =========================================================================
  // 5. FAZENDA PÚBLICA EM JUÍZO, PGU, PRERROGATIVAS E PRECATÓRIOS
  // =========================================================================
  {
    id: "au-fazenda-juizo-prerrogativas-pgu-precatorios-lei9028",
    discipline: "DIREITO PROCESSUAL CIVIL",
    title: "Fazenda Pública em Juízo, Prerrogativas Processuais da União (PGU, CPC/2015 e Lei nº 9.028/1995) e Regime de Precatórios Federais",
    themeKeywords: [
      "procuradoria-geral da união", "pgu", "fazenda pública em juízo", "artigo 183 do cpc",
      "intimação pessoal eletrônica", "prazo em dobro em dias úteis", "remessa necessária",
      "artigo 496", "artigo 100 da cf", "precatórios", "rpv", "adi 7047", "adi 7064",
      "lei 9.028", "lei 9.494", "cumprimento de sentença contra a fazenda pública"
    ],
    coreDoctrine: `#### 🛡️ O Regime Processual Diferenciado da União e a Quitação de Débitos Judiciais

* **Prerrogativas Processuais da União e Atuação da PGU (CPC/2015 e Lei nº 9.028/1995)**:
  A União goza de prerrogativas processuais fundamentadas no princípio da supremacia do interesse público sobre o privado e na salvaguarda do erário:
  1. *Prazo em Dobro (Art. 183 do CPC/2015)*: Prazo em dobro para todas as manifestações processuais (contestação, recursos, embargos e manifestações incidentais), cuja contagem se dá exclusivamente em dias úteis (art. 219 do CPC);
  2. *Intimação Pessoal e Meio Eletrônico*: O art. 183, § 1º do CPC exige que a intimação da Fazenda Pública seja feita pessoalmente, preferencialmente por meio eletrônico via portal do tribunal (Lei nº 11.419/2006 e Súmula 656 do STJ). A ausência de remessa dos autos eletrônicos induz à nulidade dos atos subsequentes por cerceamento de defesa;
  3. *Dispensa de Preparo Recursal (Art. 1.007, § 1º do CPC)*: A União é isenta do adiantamento de custas, preparo e porte de retorno recursal, recolhendo despesas somente ao final se vencida, ressalvadas as custas no âmbito da Justiça Estadual no exercício da competência federal delegada;
  4. *Remessa Necessária (Art. 496 do CPC)*: Sentença proferida contra a União ou que julgar procedentes embargos à execução fiscal não produz efeitos senão depois de confirmada pelo tribunal, ressalvadas as condenações líquidas inferiores a 1.000 salários mínimos ou fundadas em súmula de tribunal superior ou precedente qualificado.

* **Cumprimento de Sentença contra a Fazenda Pública (Arts. 534 e 535 do CPC)**:
  A execução de obrigação de pagar quantia certa contra a União não enseja penhora direta de bens públicos, sendo vedada qualquer expropriação forçada ordinária. O rito obedece ao art. 535 do CPC: intimação da União na pessoa do Advogado da União para, querendo, no prazo de 30 dias úteis, impugnar a execução. As matérias de impugnação são taxativas (falta ou nulidade da citação, ilegitimidade, inexequibilidade do título, excesso de execução, incompetência e causa modificativa superveniente).

* **Regime Constitucional de Precatórios e RPVs (Art. 100 da CF) e Julgamento das ADIs 7047 e 7064**:
  Os débitos da União decorrentes de sentença transitada em julgado são satisfeitos exclusivamente por meio de:
  1. *Requisições de Pequeno Valor (RPVs)*: Para créditos de até 60 salários mínimos no âmbito federal, pagos no prazo improrrogável de até 60 dias após a requisição judicial;
  2. *Precatórios Judiciais*: Para créditos superiores a 60 salários mínimos. Os precatórios apresentados perante o tribunal até 02 de abril de um ano devem ser orçados e pagos até o final do exercício seguinte.
  O Supremo Tribunal Federal, no histórico julgamento das **ADIs 7047 e 7064**, declarou a manifesta inconstitucionalidade do teto orçamentário anual de pagamento de precatórios e do parcelamento imposto pelas Emendas Constitucionais nº 113 e 114/2021, restabelecendo a quitação integral e tempestiva pela União para evitar nova moratória inconstitucional da dívida pública.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Quitação Plena e Inconstitucionalidade da Moratória (STF ADIs 7047 e 7064)",
        author: "STF Plenário / Rel. Min. Luiz Fux",
        thesis: "O calote ou moratória de precatórios afronta o direito fundamental à tutela jurisdicional efetiva (Art. 5º, XXXV), a separação dos Poderes (Art. 2º) e a coisa julgada (Art. 5º, XXXVI), impondo à União o dever de quitação integral do estoque sem submissão a subtetos protelatórios.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria do Espaço Fiscal e Prioridade de Gastos Sociais",
        author: "Defesa Governamental Inicial das ECs 113 e 114 (Superada)",
        thesis: "Sustentava que a fixação de um teto temporário anual para precatórios era legítima com base no estado de emergência fiscal e na necessidade de viabilizar benefícios assistenciais de transferência de renda.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a Fazenda Pública possui prazo em dobro para ajuizar Ação Rescisória (FALSO: o prazo decadencial de 2 anos do art. 975 do CPC é improrrogável e não se submete à dobra do art. 183).",
      "Sustentar que a impugnação ao cumprimento de sentença pela União tem prazo de 15 dias (FALSO: o art. 535 do CPC fixa prazo especial de 30 dias úteis para a impugnação da Fazenda Pública).",
      "Confundir os limites de RPV da União com os de Estados e Municípios (No âmbito federal o piso constitucional do RPV é fixado diretamente em 60 salários mínimos, enquanto Estados e Municípios podem reduzir esse teto por lei local até o limite do maior benefício do RGPS ou 30 salários mínimos)."
    ],
    careerNuances: {
      AGU: "Atuação direta da Procuradoria-Geral da União (PGU) nos 5 Tribunais Regionais Federais (TRFs) e em todas as Varas Federais do país, sustentando teses institucionais e defendendo o orçamento federal.",
      PGFN: "Execução fiscal e cobrança do crédito tributário via Lei de Execução Fiscal (Lei nº 6.830/1980) e representação no STJ/STF em matéria tributária.",
      PF: "Defesa judicial de autarquias sob as prerrogativas da Lei nº 9.469/1997 e do CPC/2015.",
      PBC: "Representação em ações judiciais de intervenção bancária e execuções movidas contra o Banco Central."
    }
  },

  // =========================================================================
  // 6. RESPONSABILIDADE CIVIL DO ESTADO E LITÍGIOS ESTRUTURAIS DA UNIÃO
  // =========================================================================
  {
    id: "au-responsabilidade-civil-estado-regresso-litigios-massa",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Responsabilidade Civil do Estado (Art. 37, § 6º da CF/88), Teoria da Dupla Garantia, Ações Regressivas e Litígios Estruturais da União",
    themeKeywords: [
      "artigo 37 parágrafo 6", "responsabilidade civil do estado", "risco administrativo",
      "dupla garantia", "tema 940", "tema 592", "tema 130", "tema 1157", "ação regressiva",
      "omissão estatal", "faute du service", "caso varig", "litígios de massa da união"
    ],
    coreDoctrine: `#### ⚡ A Responsabilidade Extracontratual da União e a Proteção do Servidor Público

* **A Matriz Constitucional da Responsabilidade Objetiva (Art. 37, § 6º da CF/88)**:
  A Constituição Federal consagrou a responsabilidade civil objetiva das pessoas jurídicas de direito público e das de direito privado prestadoras de serviços públicos pelos danos que seus agentes, nessa qualidade, causarem a terceiros, sob a modalidade da *Teoria do Risco Administrativo*. Essa teoria dispensa a comprovação de dolo ou culpa da Administração, exigindo apenas a demonstração do ato comissivo estatal, do dano patrimonial ou moral e do nexo de causalidade entre ambos.

* **Causas Excludentes e Atenuantes do Nexo de Causalidade**:
  Por adotar o risco administrativo (e não o risco integral, ressalvadas matérias de dano ambiental difuso e acidentes nucleares - art. 21, XXIII, 'd'), a União pode se eximir da responsabilidade demonstrando:
  1. *Culpa Exclusiva da Vítima*: Rompe integralmente o nexo de causalidade, desonerando o Estado;
  2. *Culpa Concorrente da Vítima*: Atenua a responsabilidade do ente público, ensejando a repartição proporcional da condenação indenizatória;
  3. *Caso Fortuito ou Força Maior Absolutos*: Eventos imprevisíveis e irresistíveis da natureza que rompem a causalidade fática com a conduta estatal.

* **Responsabilidade por Omissão Estatal: Omissão Genérica vs. Específica**:
  1. *Omissão Genérica*: Quando o Estado descumpre um dever legal amplo de fiscalização ou polícia (ex: assalto em via pública). Aplica-se a teoria da responsabilidade subjetiva mitigada (*faute du service*), exigindo a comprovação de que o serviço funcionou mal, não funcionou ou funcionou tardiamente;
  2. *Omissão Específica*: Quando o Estado tinha o dever de custódia e garantia de incolumidade de pessoas ou bens sob sua tutela direta (ex: suicídio ou homicídio de detento em penitenciária federal, ou agressão a aluno em escola pública). O Supremo Tribunal Federal, no julgamento do **Tema 592 da Repercussão Geral (RE 841.526)**, fixou que a responsabilidade do Estado por morte de detento é objetiva em decorrência do dever constitucional de vigilância (art. 5º, XLIX), cabendo ao ente público demonstrar causa impeditiva do nexo causal.

* **A Teoria da Dupla Garantia (Tema 940 do STF)**:
  O STF, no julgamento do **Tema 940 da Repercussão Geral (RE 1.027.633)**, fixou tese categórica e vinculante com enorme impacto na atuação da AGU: a ação de reparação civil decorrente de dano praticado por agente público deve ser ajuizada *exclusivamente em face do Estado ou da pessoa jurídica de direito privado prestadora do serviço público*. É juridicamente inadmissível a propositura direta da demanda contra o servidor, bem como é incabível o litisconsórcio passivo facultativo entre o ente público e o agente. O servidor somente responde em sede de ação regressiva autônoma ajuizada pela União após o trânsito em julgado e pagamento da indenização, condicionada à estrita comprovação de dolo ou culpa.

* **Grandes Litígios da União: Temas 130 e 1157 do STF**:
  - *Tema 130/STF (Caso Varig)*: O congelamento de tarifas aéreas pelo Poder Executivo em planos econômicos gerou desequilíbrio e dever de indenizar danos emergentes decorrentes da intervenção estatal desmedida;
  - *Tema 1157/STF (Operações de Segurança)*: Responsabilidade civil objetiva da União por danos causados a terceiros inocentes feridos ou mortos por disparos de arma de fogo em operações de forças de segurança pública federais.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria da Dupla Garantia Constitucional (Tese Vinculante do STF - Tema 940)",
        author: "STF Plenário / Rel. Min. Marco Aurélio / STJ",
        thesis: "O art. 37, § 6º da CF/88 consagra dupla garantia: garante ao administrado a satisfação célere perante o Estado solvente e garante ao agente público o exercício sereno de suas funções sem a ameaça de ser demandado diretamente pela via cível pelo cidadão insatisfeito.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Legitimidade Concorrente Passiva",
        author: "Doutrina Processualista Civilista Tradicional",
        thesis: "Sustentava a legitimidade facultativa do cidadão de demandar o Estado, o servidor ou ambos em litisconsórcio passivo facultativo com base no art. 186 do Código Civil.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a vítima pode optar por ajuizar a ação indenizatória diretamente contra o policial federal ou agente da União causador do disparo (FALSO: a tese do Tema 940 do STF veda o ajuizamento direto ou litisconsórcio passivo com o servidor).",
      "Sustentar que a responsabilidade do Estado por morte de detento em presídio é subjetiva e depende de prova de omissão dolosa do agente carcerário (FALSO: o Tema 592 do STF consagrou que a responsabilidade é objetiva, com presunção decorrente do dever de custódia do art. 5º, XLIX da CF).",
      "Afirmar que a União pode denunciar da lide o servidor público no bojo da ação indenizatória principal movida pela vítima (A jurisprudência do STJ e STF não admite a denunciação da lide que introduza fundamento novo sobre dolo ou culpa, devendo a União buscar o ressarcimento pela via regressiva autônoma)."
    ],
    careerNuances: {
      AGU: "Defesa primária da União direta perante os tribunais em ações de indenização de grande vulto e condução privativa das ações regressivas em face de ex-agentes faltosos.",
      PGFN: "Atuação nos reflexos de responsabilidade patrimonial da Fazenda Nacional em casos de execuções fiscais indevidas e danos a contribuintes.",
      PF: "Defesa de autarquias em acidentes de rodovias federais geridas pelo DNIT ou danos causados por servidores do INSS.",
      PBC: "Defesa do Banco Central em demandas indenizatórias decorrentes de intervenção e liquidação extrajudicial de instituições financeiras falidas."
    }
  }
];
