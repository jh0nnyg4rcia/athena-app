/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DoctrinalModule } from "./doctrinalRepository";

export const DOCTRINAL_PF: DoctrinalModule[] = [
  // =========================================================================
  // 1. LEI GERAL DAS AGÊNCIAS REGULADORAS E TEORIA DA DEFERÊNCIA TÉCNICA
  // =========================================================================
  {
    id: "pf-agencias-reguladoras-deferencia-lei13848",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Lei Geral das Agências Reguladoras (Lei nº 13.848/2019), Poder Normativo Técnico e Teoria da Deferência Administrativa",
    themeKeywords: [
      "agência reguladora", "agencias reguladoras", "lei 13.848", "13.848", "13.848/2019",
      "poder normativo técnico", "poder normativo", "deslegalização", "análise de impacto regulatório",
      "air", "deferência", "deferência judicial", "controle dos atos regulatórios", "anatel", "aneel",
      "anp", "anvisa", "ans", "antaq", "antt", "tema 877"
    ],
    coreDoctrine: `#### 🏛️ Poder Normativo Técnico, Autonomia e Controle Judicial das Agências Reguladoras

* **Natureza Jurídica e Autonomia Qualificada (Lei nº 13.848/2019)**:
  As agências reguladoras federais são autarquias sob regime especial, dotadas de autonomia financeira, funcional, administrativa e poder decisório final em sua esfera de competência. A Lei Geral das Agências Reguladoras (Lei nº 13.848/2019) uniformizou sua governança, exigindo processo público de indicação, sabatina no Senado Federal, mandato fixo e não coincidente de 5 anos para os membros do conselho diretor ou diretoria colegiada, sendo vedada a recondução no mesmo mandato. Exige-se quarentena legal de 6 meses após o término da gestão.

* **Poder Normativo Técnico e Teoria da Deslegalização**:
  O poder normativo das agências fundamenta-se no fenômeno da deslegalização (*delegalization*), em que o Poder Legislativo estabelece os parâmetros, finalidades e *standards* regulatórios primários na lei ordinária instituidora, delegando à autarquia a disciplina técnica e mutável do setor econômico. O Supremo Tribunal Federal, no julgamento do **Tema 877 da Repercussão Geral (RE 748.543)**, fixou expressamente que as agências reguladoras podem editar atos normativos primários nos limites de sua especialidade técnica delegada pela lei, inclusive proibindo substâncias lesivas à saúde (caso da Resolução da ANVISA referente a aditivos no tabaco).

* **Análise de Impacto Regulatório (AIR) e Processo Decisório Transparente**:
  O art. 6º da Lei nº 13.848/2019 e o art. 5º da Lei de Liberdade Econômica (Lei nº 13.874/2019) tornaram obrigatória a prévia realização de Análise de Impacto Regulatório (AIR) para a edição ou alteração de atos normativos de interesse geral de agentes econômicos e consumidores. A AIR consiste em procedimento fundamentado que avalia os custos, benefícios e alternativas regulatórias da medida. Ademais, as minutas de normas submetem-se a consulta pública prévia por período mínimo de 45 dias úteis, salvo urgência devidamente justificada.

* **Teoria da Deferência aos Atos Administrativos Regulatórios**:
  Inspirada no modelo norte-americano da Doutrina Chevron e sedimentada na doutrina administrativa contemporânea brasileira, a teoria da deferência preconiza que o Poder Judiciário deve exercer autocontenção (*judicial self-restraint*) ao examinar atos técnicos das agências reguladoras. O controle jurisdicional limita-se aos aspectos de legalidade estrita, proporcionalidade, respeito ao devido processo administrativo e coerência com a motivação fática, sendo defeso ao juiz substituir a escolha discricionária técnica da autoridade reguladora por sua própria valoração de conveniência.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria da Deferência e Autocontenção Judicial (STF e Doutrina Majoritária)",
        author: "STF (Tema 877) / Min. Luís Roberto Barroso / Min. Alexandre de Moraes",
        thesis: "A decisão técnica regulatória adotada no âmbito das opções legítimas franqueadas pelo legislador goza de presunção de higidez, sendo vedado ao Judiciário substituir o juízo de mérito técnico da agência por mera divergência de interpretação setorial.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Inafastabilidade Irrestrita da Jurisdição",
        author: "Corrente Publicista Tradicional",
        thesis: "Defende que todo ato administrativo normativo ou sancionador pode ter sua proporcionalidade e adequação técnica reexaminadas amplamente pelo juiz com auxílio de perícia judicial, sem qualquer privilégio hermenêutico da agência.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que os conselheiros de agências reguladoras podem ser reconduzidos no mesmo cargo imediatamente (FALSO: o art. 5º da Lei nº 13.848/2019 estabelece mandato de 5 anos, vedada a recondução).",
      "Sustentar que a AIR é dispensada quando a agência pretender aplicar sanções regulatórias já previstas em resolução (A AIR incide na produção de atos normativos gerais, e não no exercício do poder disciplinar em casos concretos).",
      "Confundir supervisão ministerial com subordinação hierárquica (As agências submetem-se apenas à tutela finalística e controle de legalidade pelos Ministérios supervisores, inexistindo recurso hierárquico impróprio ordinário contra decisões técnicas da Diretoria Colegiada, salvo expressa previsão em lei instituidora)."
    ],
    careerNuances: {
      AGU: "Representação institucional e consultoria de alto nível nos conflitos interinstitucionais entre agências reguladoras e os Ministérios supervisores.",
      PGFN: "Articulação das receitas regulatórias com o Tesouro Nacional e execução da dívida ativa não tributária gerada pelas taxas e multas setoriais.",
      PF: "Defesa técnica privativa de todas as agências reguladoras federais (ANATEL, ANEEL, ANP, ANVISA, ANS, ANTAQ, ANTT) em ações civis públicas e defesas de legitimidade do poder normativo perante a Justiça Federal e Tribunais Superiores.",
      PBC: "Aplicação analógica dos princípios da deferência regulatória na defesa dos atos normativos prudenciais expedidos pela Diretoria Colegiada do Banco Central."
    }
  },

  // =========================================================================
  // 2. REGIME DAS AUTARQUIAS FEDERAIS E PRERROGATIVAS PROCESSUAIS DA PGF
  // =========================================================================
  {
    id: "pf-regime-autarquias-prerrogativas-pgf",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Regime Jurídico das Autarquias e Fundações Públicas Federais e Prerrogativas Processuais da PGF (Lei nº 10.480/2002 e Lei nº 9.469/1997)",
    themeKeywords: [
      "procuradoria-geral federal", "pgf", "lei 10.480", "10.480", "lei 9.469", "9.469",
      "autarquias federais", "fundações públicas", "fundacoes publicas", "prerrogativas da fazenda pública",
      "prazos em dobro", "intimação pessoal", "regime de precatórios", "impenhorabilidade", "artigo 100",
      "dispensa de recurso", "desistência", "não ajuizamento", "autorização para acordos"
    ],
    coreDoctrine: `#### 🏛️ Estrutura da PGF, Regime Autárquico e Prerrogativas Processuais

* **Estrutura Institucional da Procuradoria-Geral Federal (Lei nº 10.480/2002)**:
  A PGF é órgão da Advocacia-Geral da União, com competência para a representação judicial e extrajudicial das autarquias e fundações públicas federais, além das respectivas atividades de consultoria e assessoramento jurídicos. O Procurador-Geral Federal integra a administração superior da AGU, nomeado pelo Presidente da República por indicação do Advogado-Geral da União.

* **Regime Jurídico das Autarquias e Fundações Públicas de Direito Público**:
  1. **Criação e Extinção**: Criação por lei específica (Art. 37, XIX da CF) para autarquias; fundações públicas dependem de lei específica para autorização e lei complementar para definir as áreas de atuação;
  2. **Patrimônio e Bens Públicos**: Bens das autarquias e fundações públicas federais são bens públicos em sentido estrito, dotados de inalienabilidade relativa, imprescritibilidade (não sujeitos a usucapião) e impenhorabilidade absoluta;
  3. **Execução pelo Regime de Precatórios (Art. 100 da CF)**: As dívidas judiciais transitadas em julgado das autarquias e fundações federais submetem-se compulsoriamente ao rito dos precatórios e Requisições de Pequeno Valor (RPV), vedada a penhora direta de verbas orçamentárias autárquicas.

* **Prerrogativas Processuais Fazendárias dos Procuradores Federais**:
  * **Prazos em Dobro**: Prazo em dobro para todas as manifestações processuais (contestação, recursos, réplicas e cumprimento de despachos - Art. 183 do CPC);
  * **Intimação Pessoal**: Obrigatoriedade de intimação pessoal do Procurador Federal, realizada preferencialmente por meio eletrônico oficial ou carga dos autos (Art. 183, § 1º do CPC c/c Art. 17 da Lei nº 10.910/2004);
  * **Dispensa de Preparo e Depósito Recursal**: Isenção absoluta de custas processuais, preparo e depósitos recursais perante as Varas Federais, TRFs e TST (Art. 1º-A da Lei nº 9.469/1997 e Art. 91 do CPC).

* **Poderes Especiais da Lei nº 9.469/1997 e Resoluções da AGU/PGF**:
  O Procurador-Geral Federal e as autoridades delegadas possuem autorização legal expressa para:
  1. Deixar de ajuizar execuções fiscais ou requerer arquivamento provisório sem baixa na distribuição para créditos inferiores aos tetos regulamentares da Portaria Normativa AGU;
  2. Deixar de interpor recursos contra jurisprudência sumulada do STF, STJ ou vinculada a julgamentos em regime de repercussão geral ou repetitivo;
  3. Celebrar acordos, transações e termos de conciliação perante os Juizados Especiais Federais e órgãos jurisdicionais comuns, conferindo segurança jurídica e celeridade ao desfecho dos litígios.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Extensão Plena das Prerrogativas às Autarquias Especiais e Fundações Públicas",
        author: "STF (Súmula Vinculante 10 e Precedentes Uniformes) / CPC/2015 Art. 183",
        thesis: "Todas as entidades autárquicas e fundacionais federais qualificam-se como Fazenda Pública para efeitos processuais, usufruindo incondicionalmente de prazos em dobro, intimação pessoal e rito de precatórios.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tentativa de Restrição a Autarquias em Regime de Concorrência",
        author: "Crítica Doutrinária Isolada",
        thesis: "Sustentava que autarquias que cobram tarifas ou exercem atividades econômicas não deveriam usufruir de regime de precatórios, tese veementemente rejeitada pelo STF.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que as autarquias federais recolhem depósito recursal na Justiça do Trabalho (FALSO: o art. 1º-A da Lei nº 9.469/1997 e o art. 790-A da CLT isentam expressamente a Fazenda Pública autárquica de custas e de depósito recursal).",
      "Sustentar que a contagem do prazo recursal começa da publicação no Diário da Justiça Eletrônico quando a intimação pessoal eletrônica for frustrada (A intimação é pessoal; a ausência de intimação pessoal do Procurador Federal acarreta nulidade processual do ato).",
      "Confundir o Procurador Federal com o Procurador da Fazenda Nacional (O Procurador Federal representa as autarquias e fundações federais; o Procurador da Fazenda Nacional representa a União em matéria estritamente fiscal e dívida ativa da União)."
    ],
    careerNuances: {
      AGU: "Defesa dos órgãos da administração direta e condução das diretrizes gerais vinculantes da Advocacia Pública Federal.",
      PGFN: "Foco na cobrança do crédito tributário e fiscal da União, com atuação perante a Justiça Federal e Estadual.",
      PF: "Atuação direta em mais de 150 autarquias e fundações públicas federais com competências especializadas (universidades, agências reguladoras, autarquias ambientais, previdenciárias e agrárias).",
      PBC: "Representação autárquica específica do Banco Central do Brasil, mantendo cooperação com a PGF nos temas de regime processual público."
    }
  },

  // =========================================================================
  // 3. DIREITO AGRÁRIO E DESAPROPRIAÇÃO PARA REFORMA AGRÁRIA (PFE-INCRA)
  // =========================================================================
  {
    id: "pf-direito-agrario-desapropriacao-incra",
    discipline: "DIREITO AGRÁRIO",
    title: "Direito Agrário Constitucional: Desapropriação por Interesse Social para Reforma Agrária (PFE-INCRA, Lei nº 8.629/1993 e LC nº 76/1993)",
    themeKeywords: [
      "reforma agrária", "desapropriação agrária", "lei 8.629", "8.629", "lc 76/1993", "lc 76", "76/1993",
      "incra", "pfe-incra", "função social da propriedade rural", "índice de utilização da terra", "gut",
      "índice de eficiência na exploração", "gee", "título da dívida agrária", "tda", "imissão provisória",
      "imissão em 48 horas", "imóvel invadido", "ms 24504", "artigo 184", "artigo 186"
    ],
    coreDoctrine: `#### 🌾 Desapropriação por Interesse Social para Reforma Agrária

* **Fundamento Constitucional e Competência Privativa (Art. 184 da CF/88)**:
  Compete exclusivamente à União desapropriar por interesse social, para fins de reforma agrária, o imóvel rural que não esteja cumprindo sua função social. O procedimento é privativo da União Federal e executado pela Procuradoria Federal Especializada junto ao INCRA (PFE-INCRA).

* **Requisitos Cumulativos da Função Social (Art. 186 da CF/88)**:
  O imóvel rural somente cumpre sua função social quando atende simultaneamente aos seguintes parâmetros:
  1. Aproveitamento racional e adequado: cumprimento dos índices de Grau de Utilização da Terra (GUT igual ou superior a 80%) e Grau de Eficiência na Exploração (GEE igual ou superior a 100%);
  2. Utilização adequada dos recursos naturais disponíveis e preservação do meio ambiente (cumprimento do Código Florestal, preservação de APPs e Reserva Legal);
  3. Observância rigorosa das disposições que regulam as relações de trabalho rural;
  4. Exploração que favoreça o bem-estar dos proprietários e dos trabalhadores.

* **Imunidades Constitucionais à Desapropriação Agrária (Art. 185 da CF/88)**:
  São insuscetíveis de desapropriação para reforma agrária:
  1. A pequena e média propriedade rural, assim definida em lei, desde que seu proprietário não possua outra;
  2. A propriedade produtiva (aquela que atinge os índices fixados de GUT e GEE).

* **Indenização Dupla e Específica**:
  * **Terra Nua**: Indenizada mediante **Títulos da Dívida Agrária (TDA)**, com cláusula de preservação do valor real, resgatáveis em prazos de até 20 anos, a partir do segundo ano de sua emissão;
  * **Benfeitorias Úteis e Necessárias**: Indenizadas sempre em **dinheiro** (Art. 184, § 1º da CF/88 e tese vinculante do STF na ADI 2.332). As benfeitorias voluptuárias não são indenizadas pela via agrária, admitindo-se apenas seu levantamento se não causar prejuízo ao imóvel.

* **Rito Sumário da Lei Complementar nº 76/1993 e Imissão na Posse em 48 Horas**:
  O rito expropriatório agrário é bifásico e acelerado. Distribuída a ação pelo INCRA e depositados os TDAs e a parcela em dinheiro correspondente às benfeitorias, o juiz federal determinará mandado de **imissão provisória na posse no prazo improrrogável de 48 horas** (Art. 6º, I da LC nº 76/1993). A contestação é concentrada em 15 dias úteis, vedada a discussão de matéria estranha à nulidade processual ou ao valor da indenização.

* **Vedação à Desapropriação e Vistoria em Imóvel Invadido (Art. 2º, § 6º da Lei nº 8.629/1993 e STF MS 24.504)**:
  O imóvel rural que for objeto de invasão ou ocupação coletiva com motivação agrária não poderá ser vistoriado, avaliado ou desapropriado nos 2 anos seguintes à sua desocupação, ou no dobro desse prazo em caso de reincidência. O STF, no julgamento do **MS 24.504/DF**, reconheceu a plena constitucionalidade desse dispositivo, visando coibir a coação e preservar a ordem pública no campo.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Constitucionalidade da Cláusula Anti-Invasão (STF Plenário)",
        author: "STF (MS 24.504 / MS 25.186 / Rel. Min. Marco Aurélio / Rel. Min. Gilmar Mendes)",
        thesis: "O art. 2º, § 6º da Lei nº 8.629/1993 é plenamente constitucional, constituindo sanção administrativa legítima para assegurar que a reforma agrária ocorra sob o império da lei e sem violência possessória.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Invalidade por Restrição ao Poder Expropriatório Estatal",
        author: "Movimentos Sociais Agrários e Doutrina Minoritária",
        thesis: "Sustentava que a invasão de terras improdutivas evidenciaria o abandono social pelo proprietário e não deveria suspender o dever constitucional de desapropriação da União.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que as benfeitorias úteis e necessárias podem ser indenizadas em TDAs (FALSO: o art. 184, § 1º da CF/88 exige expressamente pagamento prévio e justo em DINHEIRO).",
      "Sustentar que o juiz pode conceder prazo de 15 dias para a imissão na posse (FALSO: o art. 6º, I da LC nº 76/1993 impõe mandado de imissão provisória na posse no prazo de 48 horas após o depósito inicial).",
      "Confundir índices agrários: o GUT afere o uso da terra (mínimo 80%) e o GEE afere a produtividade por hectare (mínimo 100%)."
    ],
    careerNuances: {
      AGU: "Defesa dos atos do Presidente da República que decretam a declaração de interesse social para fins de reforma agrária em mandados de segurança perante o STF.",
      PGFN: "Acompanhamento fiscal da emissão dos Títulos da Dívida Agrária (TDA) pelo Tesouro Nacional.",
      PF: "Atuação privativa em campo e em juízo pela PFE-INCRA na condução de todas as ações de desapropriação agrária e regularização fundiária perante a Justiça Federal.",
      PBC: "Monitoramento dos impactos de títulos públicos federais e securitização de dívidas do crédito rural."
    }
  },

  // =========================================================================
  // 4. TUTELA CONSTITUCIONAL INDIGENISTA E TERRAS QUILOMBOLAS (FUNAI E INCRA)
  // =========================================================================
  {
    id: "pf-indigenista-quilombola-funai-incra",
    discipline: "DIREITO AGRÁRIO",
    title: "Tutela Constitucional das Terras Indígenas (Art. 231 da CF e Tema 1.031/STF) e Demarcação de Terras Quilombolas (PFE-FUNAI e INCRA)",
    themeKeywords: [
      "terras indígenas", "terras indigenas", "artigo 231", "funai", "pfe-funai", "quilombolas",
      "remanescentes de quilombos", "artigo 68 adct", "decreto 4.887", "4.887/2003", "adi 3239",
      "marco temporal", "tema 1031", "renitente esbulho", "nulidade dos títulos", "benfeitorias de boa-fé",
      "posse tradicional", "usucapião indígena vedado"
    ],
    coreDoctrine: `#### 🏹 Tutela das Comunidades Indígenas e Remanescentes de Quilombos

* **Direito Originário e Natureza Declaratória da Demarcação Indígena (Art. 231 da CF/88)**:
  São reconhecidos aos índios sua organização social, costumes, línguas, crenças e tradições, e os direitos originários sobre as terras que tradicionalmente ocupam, competindo à União demarcá-las, proteger e fazer respeitar todos os seus bens. A posse indígena é congênita (*indigenato*), antecedendo à própria ordem constitucional republicana. Consequentemente, o ato administrativo de demarcação homologado pela Presidência da República é meramente declaratório de uma situação jurídica preexistente, e não constitutivo.

* **Regime Jurídico das Terras Indígenas**:
  1. **Propriedade da União**: As terras tradicionalmente ocupadas por indígenas pertencem à União (Art. 20, XI da CF/88);
  2. **Posse Permanente e Usufruto Exclusivo**: Destinam-se à posse permanente das etnias, cabendo-lhes o usufruto exclusivo das riquezas do solo, rios e lagos;
  3. **Inalienabilidade e Indisponibilidade**: São inalienáveis, indisponíveis e os direitos sobre elas são imprescritíveis;
  4. **Nulidade dos Títulos de Propriedade Privada (Art. 231, § 6º da CF/88)**: São nulos e extintos de pleno direito quaisquer títulos de domínio privado sobre terras indígenas, não gerando direito a indenização, salvo exclusivamente quanto a benfeitorias necessárias derivadas de ocupação de boa-fé.

* **O Julgamento do Tema 1.031 do STF e o Marco Temporal**:
  O Plenário do STF, no julgamento do **RE 1.017.365 (Tema 1.031 da Repercussão Geral)**, rejeitou a teoria do marco temporal rígido que exigia a presença física das comunidades na data de 05 de outubro de 1988, fixando:
  1. A posse tradicional indígena não se confunde com a posse civil ordinária;
  2. O marco de 1988 é descaracterizado quando demonstrado o **renitente esbulho** (perseguição, conflito armado ou expulsão violenta decorrente de litígio judicial ou fático continuado);
  3. Nos casos em que proprietários particulares detinham títulos de domínio legítimos e expedidos de boa-fé pelo Poder Público, reconheceu-se o direito à justa indenização pela terra nua e pelas benfeitorias antes da desocupação física definitiva da área.

* **Demarcação de Terras Ocupadas por Remanescentes de Quilombos (Art. 68 do ADCT e STF ADI 3.239)**:
  Aos remanescentes das comunidades dos quilombos que estejam ocupando suas terras é reconhecida a propriedade definitiva, devendo o Estado emitir-lhes os títulos respectivos (Art. 68 do ADCT). O procedimento é coordenado pelo INCRA nos termos do Decreto nº 4.887/2003. O STF, no julgamento histórico da **ADI 3.239/DF**, julgou plenamente constitucional o Decreto nº 4.887/2003, chancelando o critério da **autoatribuição / autodefinição** das comunidades quilombolas para identificação territorial.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Rejeição do Marco Temporal Físico e Teoria do Renitente Esbulho (STF Tema 1.031)",
        author: "STF Plenário (Rel. Min. Edson Fachin)",
        thesis: "A proteção do art. 231 da CF é de direito originário, não dependendo de presença física exata em 05/10/1988 caso tenha havido renitente esbulho ou expulsão fática.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria do Marco Temporal Estrito (Tese do Caso Raposa Serra do Sol - Pet 3.388)",
        author: "Rel. Min. Ayres Britto / Setores do Agronegócio e Lei 14.701/2023",
        thesis: "A Constituição teria fotografado a posse indígena em 05 de outubro de 1988, de modo que terras desocupadas naquela data não poderiam mais ser demarcadas como indígenas.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a terra indígena é propriedade da etnia indígena (FALSO: a terra indígena é bem público da União Federal nos termos do art. 20, XI da CF; aos índios cabe o usufruto exclusivo).",
      "Sustentar que terceiro de boa-fé tem direito a indenização por lucros cessantes ou terra nua segundo a literalidade do art. 231, § 6º da CF (A literalidade constitucional só prevê indenização por benfeitorias derivadas da boa-fé, tendo o STF modulado indenização de terra nua apenas sob rito especial quando expedido título formalmente válido pelo Estado).",
      "Afirmar que terras quilombolas são bens da União (FALSO: os títulos quilombolas conferem propriedade coletiva privada e inalienável à própria comunidade remanescente, diferindo das terras indígenas)."
    ],
    careerNuances: {
      AGU: "Intervenção perante o STF em Ações Cíveis Originárias (ACOs) que debatem demarcações e nulidades de títulos concedidos por governos estaduais no passado.",
      PGFN: "Imunidades fiscais e cadastros rurais relacionados a áreas tituladas para reforma agrária e povos tradicionais.",
      PF: "Atuação privativa em defesa das demarcações conduzidas pela PFE-FUNAI e titulações quilombolas promovidas pela PFE-INCRA perante todas as instâncias judiciais.",
      PBC: "Operações de inclusão e custeio social no âmbito das políticas monetárias e bancárias voltadas a comunidades tradicionais."
    }
  },

  // =========================================================================
  // 5. DIREITO AMBIENTAL SANCIONADOR E TUTELA ECOLÓGICA DAS AUTARQUIAS
  // =========================================================================
  {
    id: "pf-ambiental-sancionador-ibama-icmbio",
    discipline: "DIREITO AMBIENTAL",
    title: "Direito Ambiental das Autarquias Federais: Poder de Polícia Ambiental (PFE-IBAMA/ICMBio), Risco Integral e Imprescritibilidade (Tema 999/STF)",
    themeKeywords: [
      "ibama", "pfe-ibama", "icmbio", "pfe-icmbio", "sisnama", "poder de polícia ambiental",
      "decreto 6.514", "6.514/2008", "lei 9.605", "auto de infração ambiental", "termo de embargo",
      "apreensão de bens", "responsabilidade civil ambiental", "teoria do risco integral", "tema 999",
      "imprescritibilidade do dano ambiental", "lc 140", "licenciamento ambiental", "código florestal"
    ],
    coreDoctrine: `#### 🌳 Poder de Polícia Ambiental e Reparação Civil Ecológica

* **Competências e Estrutura do SISNAMA (LC nº 140/2011)**:
  O Sistema Nacional do Meio Ambiente (SISNAMA) organiza as funções ambientais da Federação. A Lei Complementar nº 140/2011 fixou a cooperação entre os entes, estabelecendo que o licenciamento ambiental é conduzido por um único ente federativo (regra da competência única para licenciar), enquanto a fiscalização é comum a todos os órgãos do SISNAMA. Quando houver duplicidade de autos de infração lavrados por órgãos distintos sobre o mesmo fato, prevalece o auto de infração lavrado pelo órgão originariamente licenciador (Art. 17, § 3º da LC nº 140/2011).

* **Poder de Polícia Ambiental do IBAMA e ICMBio (Decreto nº 6.514/2008)**:
  Os fiscais do IBAMA e do ICMBio exercem poder de polícia repressivo e preventivo, dispondo de atributos de autoexecutoriedade e coercibilidade para:
  1. Lavrar autos de infração e aplicar multas administrativas pecuniárias;
  2. Impor **embargos imediatos de obras ou atividades** para impedir a continuidade da degradação ambiental;
  3. Promover a **apreensão e destinação sumária de produtos, instrumentos e veículos** utilizados na prática de infrações ambientais em áreas protegidas e terras públicas federais.

* **Responsabilidade Civil por Dano Ambiental: Teoria do Risco Integral**:
  A responsabilidade civil por dano ambiental (Art. 225, § 3º da CF/88 c/c Art. 14, § 1º da Lei nº 6.938/1981) é objetiva e orientada pela **Teoria do Risco Integral**, o que produz reflexos processuais indispensáveis:
  1. Inadmissibilidade de excludentes do nexo de causalidade baseadas em caso fortuito interno, força maior, fato de terceiro ou culpa exclusiva da vítima;
  2. Responsabilidade solidária e de execução ilimitada entre todos os poluidores diretos e indiretos;
  3. Responsabilidade do Estado por omissão fiscalizatória é solidária, porém de **execução subsidiária** (Súmula 652 do STJ), resguardando o Erário até que sejam exauridos os bens do degradador originário.

* **Imprescritibilidade da Reparação Civil Ambiental (Tema 999 do STF)**:
  O Supremo Tribunal Federal, no julgamento com repercussão geral do **RE 654.833 (Tema 999)**, fixou a seguinte tese vinculante: *"É imprescritível a pretensão de reparação civil de dano ambiental"*. A tutela da integridade ecológica constitui direito fundamental de titularidade difusa e intergeracional. Diferencia-se, contudo, a reparação civil da multa administrativa sancionadora, cuja pretensão punitiva prescreve em 5 anos (Art. 1º da Lei nº 9.873/1999 e Tema 436 do STJ).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Imprescritibilidade da Reparação Civil do Dano Ecológico (STF Tema 999)",
        author: "STF Plenário (Rel. Min. Alexandre de Moraes)",
        thesis: "O direito ao meio ambiente equilibrado é imprescritível na dimensão de reparação e recomposição in natura, afastando o Decreto 20.910/32 e o Código Civil.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Prescritibilidade Geral Quinquenal das Ações Civis Públicas",
        author: "Precedentes Superados e Doutrina Civilista Tradicional",
        thesis: "Sustentava que a ausência de previsão constitucional expressa de imprescritibilidade impunha o prazo geral de 5 anos das ações civis públicas.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Confundir a imprescritibilidade da reparação do dano ambiental (Tema 999/STF) com a prescrição quinquenal da multa administrativa (Tema 436/STJ e Lei 9.873/99).",
      "Afirmar que a Administração Pública responde diretamente como devedora principal solidária pelo dano ambiental de particular (A Súmula 652 do STJ fixa que a responsabilidade do Estado por omissão é solidária, mas a execução é subsidiária).",
      "Admitir excludente de caso fortuito ou força maior para afastar responsabilidade civil ambiental (FALSO: sob a Teoria do Risco Integral, não se admitem excludentes de nexo causal)."
    ],
    careerNuances: {
      AGU: "Defesa dos atos ministeriais e declarações de emergência ambiental do Poder Executivo perante os Tribunais Superiores.",
      PGFN: "Inscrição em dívida ativa e execução das multas ambientais federais não pagas voluntariamente.",
      PF: "Atuação combativa na sustentação judicial dos autos de infração e embargos do IBAMA e ICMBio, além da propositura e defesa de Ações Civis Públicas ambientais.",
      PBC: "Supervisão da governança ESG no Sistema Financeiro Nacional e restrição de crédito a degradadores ambientais constantes da lista pública de embargos."
    }
  },

  // =========================================================================
  // 6. LEGISLAÇÃO DE CTI, EDUCAÇÃO E UNIVERSIDADES FEDERAIS
  // =========================================================================
  {
    id: "pf-cti-educacao-universidades-fomento",
    discipline: "LEGISLAÇÃO DE EDUCAÇÃO, CIÊNCIA, TECNOLOGIA E INOVAÇÃO",
    title: "Marco Legal de CTI (Lei nº 13.243/2016 e Lei nº 10.973/2004), Autonomia Universitária e Atuação da PFE-Universidades/ICTs",
    themeKeywords: [
      "universidades federais", "artigo 207", "autonomia universitária", "marco legal de cti", "cti",
      "lei 10.973", "10.973", "lei 13.243", "13.243", "ict", "icts", "fundação de apoio", "fundações de apoio",
      "lei 8.958", "8.958", "cnpq", "capes", "finep", "encomendas tecnológicas", "dispensa de licitação pd&i",
      "propriedade industrial", "adi 5529", "inpi"
    ],
    coreDoctrine: `#### 🔬 Autonomia Universitária, Inovação Tecnológica e Agências de Fomento

* **Autonomia Universitária Constitucional (Art. 207 da CF/88)**:
  As universidades gozam de autonomia didático-científica, administrativa e de gestão financeira e patrimonial, obedecendo ao princípio de indissociabilidade entre ensino, pesquisa e extensão. A autonomia universitária não constitui soberania, submetendo-se ao controle de legalidade pelos órgãos de auditoria externa (TCU e CGU) e aos parâmetros gerais da Lei de Diretrizes e Bases da Educação Nacional (LDB - Lei nº 9.394/1996).

* **Marco Legal de Ciência, Tecnologia e Inovação (EC nº 85/2015, Lei nº 10.973/2004 e Lei nº 13.243/2016)**:
  O ordenamento jurídico instituiu regime facilitador para a integração entre o ambiente acadêmico, o Estado e o setor produtivo:
  1. **Instituições Científicas, Tecnológicas e de Inovação (ICTs)**: Órgãos ou entidades da administração pública que tenham por missão institucional a pesquisa básica ou aplicada;
  2. **Contratações Especiais de Inovação e Encomendas Tecnológicas**: Autorização para contratação direta por dispensa de licitação para contratação de bens e serviços destinados exclusivamente à pesquisa e desenvolvimento (Art. 75, IV, 'c' da Lei nº 14.133/2021 c/c Art. 20 da Lei nº 10.973/2004);
  3. **Compartilhamento de Laboratórios e Cessão de Pessoal**: As universidades federais podem compartilhar laboratórios, equipamentos e instrumentos com micro e pequenas empresas, bem como autorizar docentes sob dedicação exclusiva a exercer atividades de pesquisa remuneradas em projetos de inovação.

* **Regime das Fundações de Apoio (Lei nº 8.958/1994 e Decreto nº 7.423/2010)**:
  As instituições federais de ensino superior (IFES) e as ICTs podem contratar fundações de apoio de direito privado sem fins lucrativos, mediante dispensa de licitação, para dar suporte a projetos de ensino, pesquisa, extensão e desenvolvimento institucional. A atuação das fundações de apoio submete-se a rigoroso controle finalístico, prestação de contas periódica e vedação expressa à sua utilização para terceirização permanente de atividades rotineiras da universidade.

* **Propriedade Industrial das Universidades e Inconstitucionalidade da Extensão Automática (ADI 5.529 do STF)**:
  As patentes e registros de propriedade industrial gerados por universidades e institutos federais são geridos por seus Núcleos de Inovação Tecnológica (NIT). O STF, no julgamento da **ADI 5.529/DF**, declarou a inconstitucionalidade do parágrafo único do art. 40 da Lei nº 9.279/1996, que prorrogava automaticamente o prazo das patentes caso houvesse demora na análise pelo INPI. A fixação de prazos improrrogáveis (20 anos para invenção e 15 anos para modelo de utilidade contados do depósito) prestigia o interesse social e a democratização do acesso a tecnologias e medicamentos.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Constitucionalidade dos Mecanismos de Fomento e Flexibilização de PD&I (STF ADI 5.599)",
        author: "STF Plenário (Rel. Min. Gilmar Mendes)",
        thesis: "O Marco Legal de CTI é plenamente harmônico com a CF/88, sendo legítima a dispensa de licitação para projetos de pesquisa e a celebração de parcerias com fundações privadas para dinamizar o desenvolvimento tecnológico nacional.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Crítica da Terceirização e Privatização Indireta do Ensino Superior",
        author: "Corrente Sindical e Doutrina Tradicional",
        thesis: "Sustentava que o uso de fundações de apoio e contratações diretas vulneraria o princípio do concurso público e a publicidade dos gastos acadêmicos.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a contratação de fundações de apoio exige licitação na modalidade concorrência (FALSO: a Lei nº 8.958/1994 e a Lei nº 14.133/2021 autorizam expressamente a dispensa de licitação para fundações credenciadas).",
      "Sustentar que a autonomia universitária impede o controle financeiro pelo Tribunal de Contas da União (FALSO: a autonomia é didático-científica e administrativa, permanecendo as universidades plenamente sujeitas à fiscalização contábil, orçamentária e operacional do TCU).",
      "Afirmar que a prorrogação automática de patentes pelo atraso do INPI continua válida (O STF declarou inconstitucional o art. 40, parágrafo único da LPI na ADI 5.529, com efeitos ex tunc para patentes farmacêuticas)."
    ],
    careerNuances: {
      AGU: "Uniformização de entendimentos normativos sobre a aplicação do Marco Legal de CTI nos ministérios da Educação e de Ciência e Tecnologia.",
      PGFN: "Benefícios fiscais, isenções aduaneiras e incentivos tributários para importação de equipamentos científicos por pesquisadores e universidades.",
      PF: "Consultoria e contencioso das Procuradorias Especializadas junto a todas as Universidades Federais (UFBA, UFRJ, UFMG, etc.), IFs, CNPq, CAPES, FINEP e INPI.",
      PBC: "Mecanismos de financiamento de risco e venture capital integrados às fintechs e arranjos do Marco Legal de Inovação."
    }
  }
];
