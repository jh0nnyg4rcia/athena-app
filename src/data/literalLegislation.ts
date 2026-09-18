/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LEGISLATION_ENAM_ENAC } from "./legislationEnamEnac";
import { LEGISLATION_BACEN } from "./legislationBACEN";

const searchCiclosNovidades = (_theme: string, _discipline?: string, _limit?: number): { theme: string; detalhe: string }[] => [];

export interface LegalArticle {
  statute: string; // ex: "Constituição Federal de 1988", "CPC/2015"
  article: string; // ex: "Art. 37", "Art. 182"
  themeKeywords: string[];
  literalText: string;
}

export const LITERAL_ARTICLES: LegalArticle[] = [
  // ==========================================
  // --- CONSTITUIÇÃO FEDERAL DE 1988 ---
  // ==========================================
  {
    statute: "Constituição Federal de 1988",
    article: "Art. 1º a 4º",
    themeKeywords: ["princípios fundamentais", "fundamentos", "república", "soberania", "cidadania", "dignidade da pessoa humana", "valores sociais do trabalho", "pluralismo político", "objetivos fundamentais", "relações internacionais", "direitos fundamentais"],
    literalText: `> **Art. 1º** A República Federativa do Brasil, formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal, constitui-se em Estado Democrático de Direito e tem como fundamentos:
> * **I -** a soberania;
> * **II -** a cidadania;
> * **III -** a dignidade da pessoa humana;
> * **IV -** os valores sociais do trabalho e da livre iniciativa;
> * **V -** o pluralismo político.
> * **Parágrafo único.** Todo o poder emana do povo, que o exerce por meio de representantes eleitos ou diretamente, nos termos desta Constituição.
>
> **Art. 2º** São Poderes da União, independentes e harmônicos entre si, o Legislativo, o Executivo e o Judiciário.
>
> **Art. 3º** Constituem objetivos fundamentais da República Federativa do Brasil:
> * **I -** construir uma sociedade livre, justa e solidária;
> * **II -** garantir o desenvolvimento nacional;
> * **III -** erradicar a pobreza e a marginalização e reduzir as desigualdades sociais e regionais;
> * **IV -** promover o bem de todos, sem preconceitos de origem, raça, sexo, cor, idade e quaisquer outras formas de discriminação.
>
> **Art. 4º** A República Federativa do Brasil rege-se nas suas relações internacionais pelos seguintes princípios:
> * **I -** independência nacional; **II -** prevalência dos direitos humanos; **III -** autodeterminação dos povos; **IV -** não-intervenção; **V -** igualdade entre os Estados; **VI -** defesa da paz; **VII -** solução pacífica dos conflitos; **VIII -** repúdio ao terrorismo e ao racismo; **IX -** cooperação entre os povos para o progresso da humanidade; **X -** concessão de asilo político.
> * **Parágrafo único.** A República Federativa do Brasil buscará a integração econômica, política, social e cultural dos povos da América Latina, visando à formação de uma comunidade latino-americana de nações.`
  },
  {
    statute: "Constituição Federal de 1988",
    article: "Art. 5º",
    themeKeywords: ["direitos individuais", "direitos coletivos", "garantias fundamentais", "remédios constitucionais", "mandado de segurança", "habeas corpus", "habeas data", "ação popular", "liberdade de expressão", "intimidade", "inviolabilidade de domicílio", "legalidade"],
    literalText: `> **Art. 5º** Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade, nos termos seguintes:
> * **II -** ninguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei;
> * **IV -** é livre a manifestação do pensamento, sendo vedado o anonimato;
> * **X -** são invioláveis a intimidade, a vida privada, a honra e a imagem das pessoas, assegurado o direito a indenização pelo dano material ou moral decorrente de sua violação;
> * **XI -** a casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial;
> * **XII -** é inviolável o sigilo da correspondência e das comunicações telegráficas, de dados e das comunicações telefônicas, salvo, no último caso, por ordem judicial, nas hipóteses e na forma que a lei estabelecer para fins de investigação criminal ou instrução processual penal;
> * **XXII -** é garantido o direito de propriedade;
> * **XXIII -** a propriedade atenderá a sua função social;
> * **XXIV -** a lei estabelecerá o procedimento para desapropriação por necessidade ou utilidade pública, ou por interesse social, mediante justa e prévia indenização em dinheiro, ressalvados os casos previstos nesta Constituição;
> * **XXXV -** a lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito;
> * **XXXVI -** a lei não prejudicará o direito adquirido, o ato jurídico perfeito e a coisa julgada;
> * **XXXVII -** não haverá juízo ou tribunal de exceção;
> * **LIII -** ninguém será processado nem sentenciado senão pela autoridade competente;
> * **LIV -** ninguém será privado da liberdade ou de seus bens sem o devido processo legal;
> * **LV -** aos litigantes, em processo judicial ou administrativo, e aos acusados em geral são assegurados o contraditório e ampla defesa, com os meios e recursos a ela inerentes;
> * **LVI -** são inadmissíveis, no processo, as provas obtidas por meios ilícitos;
> * **LVII -** ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória;
> * **LXVIII -** conceder-se-á habeas corpus sempre que alguém sofrer ou se achar ameaçado de sofrer violência ou coação em sua liberdade de locomoção, por ilegalidade ou abuso de poder;
> * **LXIX -** conceder-se-á mandado de segurança para proteger direito líquido e certo, não amparado por habeas corpus ou habeas data, quando o responsável pela ilegalidade ou abuso de poder for autoridade pública ou agente de pessoa jurídica no exercício de atribuições do Poder Público;
> * **LXXIII -** qualquer cidadão é parte legítima para propor ação popular que vise a anular ato lesivo ao patrimônio público ou de entidade de que o Estado participe, à moralidade administrativa, ao meio ambiente e ao patrimônio histórico e cultural, ficando o autor, salvo comprovada má-fé, isento de custas judiciais e do ônus da sucumbência.`
  },
  {
    statute: "Constituição Federal de 1988",
    article: "Art. 18 a 24",
    themeKeywords: ["federação", "organização do estado", "competência privativa", "competência concorrente", "competência comum", "autonomia federativa", "bens da união", "repartição de competências"],
    literalText: `> **Art. 18.** A organização político-administrativa da República Federativa do Brasil compreende a União, os Estados, o Distrito Federal e os Municípios, todos autônomos, nos termos desta Constituição.
>
> **Art. 21.** Compete à União:
> * **I -** manter relações com Estados estrangeiros e participar de organizações internacionais;
> * **VII -** emitir moeda;
> * **IX -** elaborar e executar planos nacionais e regionais de ordenação do território e de desenvolvimento econômico e social;
> * **XIII -** organizar e manter o Poder Judiciário, o Ministério Público do Distrito Federal e dos Territórios e a Defensoria Pública dos Territórios.
>
> **Art. 22.** Compete privativamente à União legislar sobre:
> * **I -** direito civil, comercial, penal, processual, eleitoral, agrário, marítimo, aeronáutico, espacial e do trabalho;
> * **II -** desapropriação;
> * **IV -** águas, energia, informática, telecomunicações e radiodifusão;
> * **XXVII -** normas gerais de licitação e contratação, em todas as modalidades, para as administrações públicas diretas, autárquicas e fundacionais da União, Estados, Distrito Federal e Municípios.
> * **Parágrafo único.** Lei complementar poderá autorizar os Estados a legislar sobre questões específicas das matérias relacionadas neste artigo.
>
> **Art. 24.** Compete à União, aos Estados e ao Distrito Federal legislar concorrentemente sobre:
> * **I -** direito tributário, financeiro, penitenciário, econômico e urbanístico;
> * **II -** orçamento;
> * **VI -** florestas, caça, pesca, fauna, conservação da natureza, defesa do solo e dos recursos naturais, proteção do meio ambiente e controle da poluição;
> * **§ 1º** No âmbito da legislação concorrente, a competência da União limitar-se-á a estabelecer normas gerais.
> * **§ 2º** A competência da União para legislar sobre normas gerais não exclui a competência suplementar dos Estados.
> * **§ 3º** Inexistindo lei federal sobre normas gerais, os Estados exercerão a competência legislativa plena, para atender a suas peculiaridades.
> * **§ 4º** A superveniência de lei federal sobre normas gerais suspende a eficácia da lei estadual, no que lhe for contrário.`
  },
  {
    statute: "Constituição Federal de 1988",
    article: "Art. 37",
    themeKeywords: ["administração pública", "princípios da administração", "legalidade", "impessoalidade", "moralidade", "publicidade", "eficiência", "concurso público", "acumulação de cargos", "teto remuneratório", "responsabilidade civil do estado"],
    literalText: `> **Art. 37.** A administração pública direta e indireta de qualquer dos Poderes da União, dos Estados, do Distrito Federal e dos Municípios obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência e, também, ao seguinte:
> * **I -** os cargos, empregos e funções públicas são acessíveis aos brasileiros que preencham os requisitos estabelecidos em lei, assim como aos estrangeiros, na forma da lei;
> * **II -** a investidura em cargo ou emprego público depende de aprovação prévia em concurso público de provas ou de provas e títulos, de acordo com a natureza e a complexidade do cargo ou emprego, na forma prevista em lei, ressalvadas as nomeações para cargo em comissão declarado em lei de livre nomeação e exoneração;
> * **XVI -** é vedada a acumulação remunerada de cargos públicos, exceto, quando houver compatibilidade de horários, observado em qualquer caso o disposto no inciso XI:
>   * a) a de dois cargos de professor;
>   * b) a de um cargo de professor com outro técnico ou científico;
>   * c) a de dois cargos ou empregos privativos de profissionais de saúde, com profissões regulamentadas;
> * **XVII -** a proibição de acumular estende-se a empregos e funções e abrange autarquias, fundações, empresas públicas, sociedades de economia mista, suas subsidiárias, e sociedades controladas, direta ou indiretamente, pelo poder público;
> * **§ 6º** As pessoas jurídicas de direito público e as de direito privado prestadoras de serviços públicos responderão pelos danos que seus agentes, nessa qualidade, causarem a terceiros, assegurado o direito de regresso contra o responsável nos casos de dolo ou culpa.`
  },
  {
    statute: "Constituição Federal de 1988",
    article: "Art. 102 e 103",
    themeKeywords: ["controle de constitucionalidade", "adi", "adc", "ação direta por omissão", "adpf", "stf", "supremo tribunal federal", "legitimados ativos", "efeito vinculante", "erga omnes", "inconstitucionalidade"],
    literalText: `> **Art. 102.** Compete ao Supremo Tribunal Federal, precipuamente, a guarda da Constituição, cabendo-lhe:
> * **I -** processar e julgar, originariamente:
>   * a) a ação direta de inconstitucionalidade de lei ou ato normativo federal ou estadual e a ação declaratória de constitucionalidade de lei ou ato normativo federal;
>   * p) o pedido de medida cautelar das ações diretas de inconstitucionalidade;
> * **§ 2º** As decisões definitivas de mérito, proferidas pelo Supremo Tribunal Federal, nas ações diretas de inconstitucionalidade e nas ações declaratórias de constitucionalidade produzirão eficácia contra todos e efeito vinculante, relativamente aos demais órgãos do Poder Judiciário e à administração pública direta e indireta, nas esferas federal, estadual e municipal.
>
> **Art. 103.** Podem propor a ação direta de inconstitucionalidade e a ação declaratória de constitucionalidade:
> * **I -** o Presidente da República;
> * **II -** a Mesa do Senado Federal;
> * **III -** a Mesa da Câmara dos Deputados;
> * **IV -** a Mesa de Assembleia Legislativa ou da Câmara Legislativa do Distrito Federal;
> * **V -** o Governador de Estado ou do Distrito Federal;
> * **VI -** o Procurador-Geral da República;
> * **VII -** o Conselho Federal da Ordem dos Advogados do Brasil;
> * **VIII -** partido político com representação no Congresso Nacional;
> * **IX -** confederação sindical ou entidade de classe de âmbito nacional.`
  },
  {
    statute: "Constituição Federal de 1988",
    article: "Art. 127 a 129",
    themeKeywords: ["ministério público", "mpe", "mpf", "funções institucionais", "ação penal pública", "inquérito civil", "ação civil pública", "princípios institucionais", "unidade", "indivisibilidade", "independência funcional", "controle externo da atividade policial"],
    literalText: `> **Art. 127.** O Ministério Público é instituição permanente, essencial à função jurisdicional do Estado, incumbindo-lhe a defesa da ordem jurídica, do regime democrático e dos interesses sociais e individuais indisponíveis.
> * **§ 1º** São princípios institucionais do Ministério Público a unidade, a indivisibilidade e a independência funcional.
> * **§ 2º** Ao Ministério Público é assegurada autonomia funcional e administrativa, podendo, observado o disposto no art. 169, propor ao Poder Legislativo a criação e extinção de seus cargos e serviços auxiliares, provendo-os por concurso público de provas ou de provas e títulos, a política remuneratória e os planos de carreira; a lei disporá sobre sua organização e funcionamento.
>
> **Art. 128.** O Ministério Público abrange:
> * **I -** o Ministério Público da União, que compreende: a) o Ministério Público Federal; b) o Ministério Público do Trabalho; c) o Ministério Público Militar; d) o Ministério Público do Distrito Federal e Territórios;
> * **II -** os Ministérios Públicos dos Estados.
>
> **Art. 129.** São funções institucionais do Ministério Público:
> * **I -** promover, privativamente, a ação penal pública, na forma da lei;
> * **II -** zelar pelo efetivo respeito dos Poderes Públicos e dos serviços de relevância pública aos direitos assegurados nesta Constituição, promovendo as medidas necessárias a sua garantia;
> * **III -** promover o inquérito civil e a ação civil pública, para a proteção do patrimônio público e social, do meio ambiente e de outros interesses difusos e coletivos;
> * **VI -** expedir notificações nos procedimentos administrativos de sua competência, requisitando informações e documentos para instruí-los, na forma da lei complementar respectiva;
> * **VII -** exercer o controle externo da atividade policial, na forma da lei complementar mencionada no artigo anterior;
> * **VIII -** requisitar diligências investigatórias e a instauração de inquérito policial, indicados os fundamentos jurídicos de suas manifestações processuais;
> * **IX -** exercer outras funções que lhe forem conferidas, desde que compatíveis com sua finalidade, sendo-lhe vedada a representação judicial e a consultoria jurídica de entidades públicas.`
  },
  {
    statute: "Constituição Federal de 1988",
    article: "Art. 131 e 132",
    themeKeywords: ["advocacia pública", "advocacia-geral da união", "agu", "procuradoria da fazenda nacional", "pgfn", "procuradorias dos estados", "representação judicial", "consultoria jurídica", "fazenda pública", "erário"],
    literalText: `> **Art. 131.** A Advocacia-Geral da União é a instituição que, diretamente ou através de órgão vinculado, representa a União, judicial e extrajudicialmente, cabendo-lhe, nos termos da lei complementar que dispuser sobre sua organização e funcionamento, as atividades de consultoria e assessoramento jurídico do Poder Executivo.
> * **§ 1º** A Advocacia-Geral da União tem por chefe o Advogado-Geral da União, de livre nomeação pelo Presidente da República dentre cidadãos maiores de trinta e cinco anos, de notável saber jurídico e reputação ilibada.
> * **§ 2º** O ingresso nas classes iniciais das carreiras da instituição de que trata este artigo far-se-á mediante concurso público de provas e títulos.
> * **§ 3º** Na execução da dívida ativa de natureza tributária, a representação da União cabe à Procuradoria-Geral da Fazenda Nacional, observado o disposto em lei.
>
> **Art. 132.** Os Procuradores dos Estados e do Distrito Federal, organizados em carreira, na qual o ingresso dependerá de concurso público de provas e títulos, com a participação da Ordem dos Advogados do Brasil em todas as suas fases, exercerão a representação judicial e a consultoria jurídica das respectivas unidades federadas.`
  },
  {
    statute: "Constituição Federal de 1988",
    article: "Art. 145 a 150",
    themeKeywords: ["sistema tributário nacional", "tributos", "impostos", "taxas", "contribuição de melhoria", "capacidade contributiva", "limitações do poder de tributar", "princípio da legalidade tributária", "anterioridade", "irretroatividade", "imunidade tributária", "vedação ao confisco"],
    literalText: `> **Art. 145.** A União, os Estados, o Distrito Federal e os Municípios poderão instituir os seguintes tributos:
> * **I -** impostos;
> * **II -** taxas, em razão do exercício do poder de polícia ou pela utilização, efetiva ou potencial, de serviços públicos específicos e divisíveis, prestados ao contribuinte ou postos a sua disposição;
> * **III -** contribuição de melhoria, decorrente de obras públicas.
> * **§ 1º** Sempre que possível, os impostos terão caráter pessoal e serão graduados segundo a capacidade econômica do contribuinte, facultado à administração tributária, especialmente para conferir efetividade a esses objetivos, identificar, respeitados os direitos individuais e nos termos da lei, o patrimônio, os rendimentos e as atividades econômicas do contribuinte.
> * **§ 2º** As taxas não poderão ter base de cálculo própria de impostos.
>
> **Art. 150.** Sem prejuízo de outras garantias asseguradas ao contribuinte, é vedado à União, aos Estados, ao Distrito Federal e aos Municípios:
> * **I -** exigir ou aumentar tributo sem lei que o estabeleça;
> * **II -** instituir tratamento desigual entre contribuintes que se encontrem em situação equivalente, proibida qualquer distinção em razão de ocupação profissional ou função por eles exercida, independentemente da denominação jurídica dos rendimentos, títulos ou direitos;
> * **III -** cobrar tributos:
>   * a) em relação a fatos geradores ocorridos antes do início da vigência da lei que os houver instituído ou aumentado (irretroatividade);
>   * b) no mesmo exercício financeiro em que haja sido publicada a lei que os instituiu ou aumentou (anterioridade do exercício);
>   * c) antes de decorridos noventa dias da data em que haja sido publicada a lei que os instituiu ou aumentou (anterioridade nonagesimal);
> * **IV -** utilizar tributo com efeito de confisco;
> * **VI -** instituir impostos sobre:
>   * a) patrimônio, renda ou serviços, uns dos outros (imunidade recíproca);
>   * b) templos de qualquer culto;
>   * c) patrimônio, renda ou serviços dos partidos políticos, inclusive suas fundações, das entidades sindicais dos trabalhadores, das instituições de educação e de assistência social, sem fins lucrativos, atendidos os requisitos da lei;
>   * d) livros, jornais, periódicos e o papel destinado a sua impressão.`
  },

  // ==========================================
  // --- LEI DE LICITAÇÕES (LEI Nº 14.133/2021) ---
  // ==========================================
  {
    statute: "Lei de Licitações e Contratos Administrativos (Lei nº 14.133/2021)",
    article: "Art. 11, 28, 74 e 75",
    themeKeywords: ["licitação", "contrato administrativo", "modalidades de licitação", "pregão", "concorrência", "diálogo competitivo", "inexigibilidade de licitação", "dispensa de licitação", "contratação direta", "lei 14.133"],
    literalText: `> **Art. 11.** O processo licitatório tem por objetivos:
> * **I -** assegurar a seleção da proposta apta a gerar o resultado de contratação mais vantajoso para a Administração Pública, inclusive no que se refere ao ciclo de vida do objeto;
> * **II -** assegurar tratamento isonômico entre os licitantes, bem como a justa competição;
> * **III -** evitar contratações com sobrepreço ou com preços manifestamente inexequíveis e superfaturamento na execução dos contratos;
> * **IV -** incentivar a inovação e o desenvolvimento nacional sustentável.
>
> **Art. 28.** São modalidades de licitação:
> * **I -** pregão; **II -** concorrência; **III -** concurso; **IV -** leilão; **V -** diálogo competitivo.
>
> **Art. 74.** É inexigível a licitação quando inviável a competição, em especial nos casos de:
> * **I -** aquisição de materiais, de equipamentos ou de gêneros ou contratação de serviços que só possam ser fornecidos por produtor, empresa ou representante comercial exclusivos;
> * **II -** contratação de profissional do setor artístico, diretamente ou por meio de empresário exclusivo, desde que consagrado pela crítica especializada ou pela opinião pública;
> * **III -** contratação dos seguintes serviços técnicos especializados de natureza predominantemente intelectual com profissionais ou empresas de notória especialização, vedada a inexigibilidade para serviços de publicidade e divulgação;
>
> **Art. 75.** É dispensável a licitação:
> * **I -** para contratação que envolva valores inferiores a R$ 100.000,00, no caso de obras e serviços de engenharia ou de serviços de manutenção de veículos automotores;
> * **II -** para contratação que envolva valores inferiores a R$ 50.000,00, no caso de outros serviços e compras;
> * **III -** para contratação que mantenha todas as condições definidas em edital de licitação realizada há menos de 1 ano, quando se verificar que naquela licitação não surgiram licitantes interessados ou não foram apresentadas propostas válidas (licitação deserta ou fracassada).`
  },

  // ==========================================
  // --- LEI DE IMPROBIDADE (LEI Nº 8.429/1992 COM LEI Nº 14.230/2021) ---
  // ==========================================
  // ==========================================
  // --- INTRODUÇÃO AO DIREITO ADMINISTRATIVO: CONCEITO, CRITÉRIOS E FONTES ---
  // ==========================================
  {
    statute: "CF/88, Decreto-Lei 200/1967 e Lei 9.784/1999",
    article: "CF/88 Art. 37 c/c DL 200/67 Arts. 1º e 4º c/c Lei 9.784/99 Art. 2º",
    themeKeywords: [
      "conceito de direito administrativo",
      "conceituação do direito administrativo",
      "critérios adotados para a conceituação",
      "critérios adotados",
      "criterios adotados",
      "objeto do direito administrativo",
      "aspectos orgânico, formal e material",
      "administração pública em sentido formal",
      "administração pública em sentido material",
      "sentido orgânico",
      "sentido subjetivo",
      "sentido objetivo",
      "fontes do direito administrativo",
      "regime jurídico-administrativo",
      "pedras de toque",
      "caso blanco",
      "função administrativa",
      "critério funcional"
    ],
    literalText: `> **Constituição Federal de 1988 — Art. 37, caput (Princípios Fundamentais da Administração Pública):**
> A administração pública direta e indireta de qualquer dos Poderes da União, dos Estados, do Distrito Federal e dos Municípios obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência.
>
> **Decreto-Lei nº 200/1967 — Arts. 1º e 4º (Estrutura e Sentido Orgânico da Administração Federal):**
> * **Art. 1º** O Poder Executivo é exercido pelo Presidente da República auxiliado pelos Ministros de Estado.
> * **Art. 4º** A Administração Federal compreende:
>   * **I - A Administração Direta**, que se constitui dos serviços integrados na estrutura administrativa da Presidência da República e dos Ministérios.
>   * **II - A Administração Indireta**, que compreende as seguintes categorias de entidades, dotadas de personalidade jurídica própria:
>     * a) Autarquias;
>     * b) Empresas Públicas;
>     * c) Sociedades de Economia Mista;
>     * d) Fundações Públicas.
>
> **Lei nº 9.784/1999 — Art. 2º (Critérios e Princípios da Função Administrativa):**
> A Administração Pública obedecerá, dentre outros, aos princípios da legalidade, finalidade, motivação, razoabilidade, proporcionalidade, moralidade, ampla defesa, contraditório, segurança jurídica, interesse público e eficiência.
> * **Parágrafo único.** Nos processos administrativos serão observados, entre outros, os critérios de:
>   * **I -** atuação conforme a lei e o Direito;
>   * **II -** atendimento a fins de interesse geral, vedada a renúncia total ou parcial de poderes ou competências, salvo autorização em lei;
>   * **XIII -** interpretação da norma administrativa da forma que melhor garanta o atendimento do fim público a que se dirige, vedada aplicação retroativa de nova interpretação.
>
> **LINDB — Arts. 20 e 22 (Segurança Jurídica na Interpretação do Direito Público):**
> * **Art. 20.** Nas esferas administrativa, controladora e judicial, não se decidirá com base em valores jurídicos abstratos sem que sejam consideradas as consequências práticas da decisão.
> * **Art. 22.** Na interpretação de normas sobre gestão pública, serão considerados os obstáculos e as dificuldades reais do gestor e as exigências das políticas públicas a seu cargo.`
  },
  {
    statute: "Lei de Improbidade Administrativa (Lei nº 8.429/1992 com redação da Lei nº 14.230/2021)",
    article: "Art. 1º, 9º, 10, 11 e 23",
    themeKeywords: ["improbidade administrativa", "dolo específico", "enriquecimento ilícito", "lesão ao erário", "atentado aos princípios", "prescrição", "lei 8429", "lei 14230", "acordo de não persecução civil"],
    literalText: `> **Art. 1º** O sistema de responsabilização por atos de improbidade administrativa tutelará a probidade na organização do Estado e no exercício de suas funções, como forma de assegurar a integridade do patrimônio público e social, nos termos desta Lei.
> * **§ 1º** Consideram-se atos de improbidade administrativa as condutas dolosas tipificadas nos arts. 9º, 10 e 11 desta Lei, ressalvados os tipos previstos em leis especiais.
> * **§ 2º** Considera-se dolo a vontade livre e consciente de alcançar o resultado ilícito tipificado nos arts. 9º, 10 e 11 desta Lei, não bastando a voluntariedade do agente.
> * **§ 3º** O mero exercício da função ou desempenho de competências públicas, sem comprovação de ato doloso com fim ilícito, afasta a responsabilidade por ato de improbidade administrativa.
>
> **Art. 9º** Constitui ato de improbidade administrativa importando em enriquecimento ilícito auferir, mediante a prática de ato doloso, qualquer tipo de vantagem patrimonial indevida em razão do exercício de cargo, de mandato, de função, de emprego ou de atividade nas entidades referidas no art. 1º desta Lei, e notadamente:
> * **I -** receber, para si ou para outrem, dinheiro, bem móvel ou imóvel, ou qualquer outra vantagem econômica, direta ou indireta, a título de comissão, percentagem, gratificação ou presente de quem tenha interesse, direto ou indireto, que possa ser atingido ou amparado por ação ou omissão decorrente das atribuições do agente público.
>
> **Art. 10.** Constitui ato de improbidade administrativa que causa lesão ao erário qualquer ação ou omissão dolosa, que enseje, efetiva e comprovadamente, perda patrimonial, desvio, apropriação, malbaratamento ou dilapidação dos bens ou haveres das entidades referidas no art. 1º desta Lei, e notadamente:
> * **I -** facilitar ou concorrer, por qualquer forma, para a indevida incorporação ao patrimônio particular, de pessoa física ou jurídica, de bens, de rendas, de verbas ou de valores integrantes do acervo patrimonial das entidades referidas no art. 1º desta Lei.
>
> **Art. 11.** Constitui ato de improbidade administrativa que atenta contra os princípios da administração pública a ação ou omissão dolosa que viole os deveres de honestidade, de imparcialidade e de legalidade, caracterizada por uma das seguintes condutas:
> * **III -** revelar fato ou circunstância de que tem ciência em razão das atribuições e que deva permanecer em segredo, propiciando benefício do próprio agente ou de outrem, ou comprometendo a segurança da sociedade e do Estado;
> * **IV -** negar publicidade aos atos oficiais, exceto em razão de sua imprescindibilidade para a segurança da sociedade e do Estado ou de outras hipóteses instituídas em lei.
>
> **Art. 23.** A ação para a aplicação das sanções previstas nesta Lei prescreve em 8 anos, contados a partir da ocorrência do fato ou, no caso de infrações permanentes, do dia em que cessou a permanência.`
  },

  // ==========================================
  // ==========================================
  // --- DIREITO TRIBUTÁRIO: NORMAS FUNDAMENTAIS E ESPECÍFICAS ---
  // ==========================================

  // [1] O ESTADO FISCAL E O PODER DE TRIBUTAR
  {
    statute: "Constituição Federal de 1988 e LINDB",
    article: "CF/88 Art. 145 c/c LINDB Arts. 20 a 24",
    themeKeywords: [
      "o estado fiscal", "estado fiscal", "poder de tributar", "finalidades da tributação",
      "finalidades da tributacao", "fiscalidade", "extrafiscalidade", "parafiscalidade",
      "dever fundamental de pagar tributos", "soberania fiscal", "relação jurídico-tributária", "relacao juridico-tributaria"
    ],
    literalText: `> **CF/88 — Art. 145.** A União, os Estados, o Distrito Federal e os Municípios poderão instituir os seguintes tributos:
> * **I -** impostos;
> * **II -** taxas, em razão do exercício do poder de polícia ou pela utilização, efetiva ou potencial, de serviços públicos específicos e divisíveis, prestados ao contribuinte ou postos a sua disposição;
> * **III -** contribuição de melhoria, decorrente de obras públicas.
> * **§ 1º** Sempre que possível, os impostos terão caráter pessoal e serão graduados segundo a capacidade econômica do contribuinte, facultado à administração tributária, especialmente para conferir efetividade a esses objetivos, identificar, respeitados os direitos individuais e nos termos da lei, o patrimônio, os rendimentos e as atividades econômicas do contribuinte.
> * **§ 2º** As taxas não poderão ter base de cálculo própria de impostos.
>
> **LINDB — Art. 20.** Nas esferas administrativa, controladora e judicial, não se decidirá com base em valores jurídicos abstratos sem que sejam consideradas as consequências práticas da decisão.
> * **Parágrafo único.** A motivação demonstrará a necessidade e a adequação da medida imposta ou da invalidação de ato, contrato, ajuste, processo ou norma administrativa, inclusive em face das possíveis alternativas.
>
> **LINDB — Art. 24.** A revisão, nas esferas administrativa, controladora ou judicial, quanto à validade de ato, contrato, ajuste, processo ou norma administrativa cuja produção já se houver completado levará em conta as orientações gerais da época, sendo vedado que, com base em mudança posterior de orientação geral, se declarem inválidas situações plenamente constituídas.`
  },

  // [2] FONTES DO DIREITO TRIBUTÁRIO, VIGÊNCIA, APLICAÇÃO E DIREITO PRIVADO
  {
    statute: "Código Tributário Nacional (Lei nº 5.172/1966)",
    article: "CTN Arts. 96 a 100, 108 a 112",
    themeKeywords: [
      "fontes do direito tributário", "fontes do direito tributario", "legislação tributária",
      "legislacao tributaria", "vigência e aplicação", "vigencia e aplicacao", "interpretação e integração",
      "interpretacao e integracao", "relações entre o direito tributário e o direito privado",
      "relacoes entre o direito tributario e o direito privado", "direito privado no direito tributario",
      "art 109 ctn", "art 110 ctn", "normas gerais de direito tributário", "normas gerais de direito tributario"
    ],
    literalText: `> **CTN — Art. 96.** A expressão "legislação tributária" compreende as leis, os tratados e as convenções internacionais, os decretos e as normas complementares que versem, no todo ou em parte, sobre tributos e relações jurídicas a eles pertinentes.
>
> **CTN — Art. 97.** Somente a lei pode estabelecer:
> * **I -** a instituição de tributos, ou a sua extinção;
> * **II -** a majoração de tributos, ou sua redução;
> * **III -** a definição do fato gerador da obrigação tributária principal e do seu sujeito passivo;
> * **IV -** a fixação de alíquota do tributo e da sua base de cálculo;
> * **V -** a cominação de penalidades para as ações ou omissões contrárias a seus dispositivos;
> * **VI -** as hipóteses de exclusão, suspensão e extinção de créditos tributários, ou de dispensa ou redução de penalidades.
>
> **CTN — Art. 98.** Os tratados e as convenções internacionais revogam ou modificam a legislação tributária interna, e serão observados pela que lhes sobrevenha.
>
> **CTN — Art. 100.** São normas complementares das leis, dos tratados e das convenções internacionais e dos decretos:
> * **I -** os atos normativos expedidos pelas autoridades administrativas;
> * **II -** as decisões dos órgãos singulares ou coletivos de jurisdição administrativa, a que a lei atribua eficácia normativa;
> * **III -** as práticas reiteradamente observadas pelas autoridades administrativas;
> * **IV -** os convênios que entre si celebrem a União, os Estados, o Distrito Federal e os Municípios.
>
> **CTN — Art. 109.** Os princípios gerais de direito privado utilizam-se para pesquisa da definição, do conteúdo e do alcance dos seus próprios conceitos e formas, mas não para a definição dos respectivos efeitos tributários.
>
> **CTN — Art. 110.** A lei tributária não pode alterar a definição, o conteúdo e o alcance de institutos, conceitos e formas de direito privado, utilizados, expressa ou implicitamente, pela Constituição Federal, pelas Constituições dos Estados, ou pelas Leis Orgânicas do Distrito Federal ou dos Municípios, para definir ou limitar competências tributárias.
>
> **CTN — Art. 111.** Interpreta-se literalmente a legislação tributária que disponha sobre:
> * **I -** suspensão ou exclusão do crédito tributário;
> * **II -** outorga de isenção;
> * **III -** dispensa do cumprimento de obrigações tributárias acessórias.`
  },

  // [3] IMUNIDADES TRIBUTÁRIAS
  {
    statute: "Constituição Federal de 1988 e CTN",
    article: "CF/88 Art. 150, VI e Art. 195, § 7º c/c CTN Art. 14",
    themeKeywords: [
      "imunidade tributária", "imunidade tributaria", "imunidades tributárias", "imunidades tributarias",
      "imunidade recíproca", "imunidade reciproca", "imunidade dos templos", "imunidade religiosa",
      "imunidade partidária", "imunidade partidaria", "imunidade sindical", "imunidade educacional",
      "imunidade assistencial", "entidades beneficentes", "cebas", "imunidade de livros",
      "imunidade de papel de imprensa", "livro eletrônico", "livro eletronico", "imunidade musical",
      "conceitos tributários-constitucionais: concepções; imunidade tributária", "art 150 vi cf"
    ],
    literalText: `> **CF/88 — Art. 150.** Sem prejuízo de outras garantias asseguradas ao contribuinte, é vedado à União, aos Estados, ao Distrito Federal e aos Municípios:
> * **VI -** instituir impostos sobre:
>   * **a)** patrimônio, renda ou serviços, uns dos outros;
>   * **b)** templos de qualquer culto;
>   * **c)** patrimônio, renda ou serviços dos partidos políticos, inclusive suas fundações, das entidades sindicais dos trabalhadores, das instituições de educação e de assistência social, sem fins lucrativos, atendidos os requisitos da lei;
>   * **d)** livros, jornais, periódicos e o papel destinado a sua impressão;
>   * **e)** fonogramas e videofonogramas musicais produzidos no Brasil contendo obras musicais ou literomusicais de autores brasileiros.
> * **§ 2º** A vedação do inciso VI, "a", é extensiva às autarquias e às fundações instituídas e mantidas pelo Poder Público, no que se refere ao patrimônio, à renda e aos serviços, vinculados a suas finalidades essenciais ou às delas decorrentes.
> * **§ 3º** As vedações do inciso VI, "a", e do parágrafo anterior não se aplicam ao patrimônio, à renda e aos serviços, relacionados com exploração de atividades econômicas regidas pelas normas aplicáveis a empreendimentos privados, ou em que haja contraprestação ou pagamento de preços ou tarifas pelo usuário.
> * **§ 4º** As vedações expressas no inciso VI, alíneas "b" e "c", compreendem somente o patrimônio, a renda e os serviços, relacionados com as finalidades essenciais das entidades nelas mencionadas.
>
> **CF/88 — Art. 195, § 7º.** São isentas de contribuição para a seguridade social as entidades beneficentes de assistência social que atendam às exigências estabelecidas em lei complementar.
>
> **CTN — Art. 14.** O disposto na alínea c do inciso IV do artigo 9º é subordinado à observância dos seguintes requisitos pelas entidades nele referidas:
> * **I -** não distribuírem qualquer parcela de seu patrimônio ou de suas rendas, a qualquer título;
> * **II -** aplicarem integralmente, no País, os seus recursos na manutenção dos seus objetivos institucionais;
> * **III -** manterem escrituração de suas receitas e despesas em livros revestidos de formalidades capazes de assegurar sua exatidão.`
  },

  // [4] SISTEMA TRIBUTÁRIO NACIONAL E LIMITAÇÕES AO PODER DE TRIBUTAR
  {
    statute: "Constituição Federal de 1988",
    article: "CF/88 Arts. 150, 151 e 152 (Princípios e Limitações)",
    themeKeywords: [
      "sistema tributário nacional: princípios gerais e limitações", "sistema tributario nacional",
      "princípios constitucionais tributários", "principios constitucionais tributarios", "princípios constitucionais",
      "limitações do poder de tributar", "limitacoes do poder de tributar", "princípios tributários",
      "principios tributarios", "legalidade tributária", "legalidade tributaria", "legalidade",
      "anterioridade", "anterioridade anual", "anterioridade nonagesimal", "noventena", 
      "irretroatividade", "irretroatividade tributária", "irretroatividade tributaria",
      "isonomia", "isonomia tributária", "isonomia tributaria",
      "vedação ao confisco", "vedacao ao confisco", "liberdade de tráfego", "liberdade de trafego",
      "uniformidade geográfica", "uniformidade geografica", "não discriminação tributária",
      "capacidade contributiva"
    ],
    literalText: `> **CF/88 — Art. 150.** Sem prejuízo de outras garantias asseguradas ao contribuinte, é vedado à União, aos Estados, ao Distrito Federal e aos Municípios:
> * **I -** exigir ou aumentar tributo sem lei que o estabeleça;
> * **II -** instituir tratamento desigual entre contribuintes que se encontrem em situação equivalente, proibida qualquer distinção em razão de ocupação profissional ou função por eles exercida, independentemente da denominação jurídica dos rendimentos, títulos ou direitos;
> * **III -** cobrar tributos:
>   * **a)** em relação a fatos geradores ocorridos antes do início da vigência da lei que os houver instituído ou aumentado (irretroatividade);
>   * **b)** no mesmo exercício financeiro em que haja sido publicada a lei que os instituiu ou aumentou (anterioridade anual);
>   * **c)** antes de decorridos noventa dias da data em que haja sido publicada a lei que os instituiu ou aumentou, observado o disposto na alínea b (anterioridade nonagesimal);
> * **IV -** utilizar tributo com efeito de confisco;
> * **V -** estabelecer limitações ao tráfego de pessoas ou bens, por meio de tributos interestaduais ou intermunicipais, ressalvada a cobrança de pedágio pela utilização de vias conservadas pelo Poder Público.
>
> **CF/88 — Art. 151.** É vedado à União:
> * **I -** instituir tributo que não seja uniforme em todo o território nacional, admitida a concessão de incentivos fiscais destinados a promover o equilíbrio do desenvolvimento socioeconômico entre as diferentes regiões do País;
> * **II -** tributar a renda das obrigações da dívida pública dos Estados, do Distrito Federal e dos Municípios, bem como a remuneração e os proventos dos respectivos agentes públicos, em níveis superiores aos que fixar para as suas obrigações e para seus agentes;
> * **III -** instituir isenções de tributos da competência dos Estados, do Distrito Federal ou dos Municípios (vedação de isenção heterônoma).
>
> **CF/88 — Art. 152.** É vedado aos Estados, ao Distrito Federal e aos Municípios estabelecer diferença tributária entre bens e serviços, de qualquer natureza, em razão de sua procedência ou destino.`
  },

  // [5] CONCEITO DE TRIBUTO E ESPÉCIES TRIBUTÁRIAS
  {
    statute: "Código Tributário Nacional e CF/88",
    article: "CTN Arts. 3º a 5º e 77 a 81 c/c CF Art. 145",
    themeKeywords: [
      "tributo: conceito e espécies", "tributo: conceito e especies", "conceito de tributo",
      "espécies tributárias", "especies tributarias", "teoria pentapartida", "natureza jurídica do tributo",
      "impostos", "taxas", "taxa de polícia", "taxa de policia", "taxa de serviço", "taxa de servico",
      "contribuição de melhoria", "contribuicao de melhoria", "empréstimos compulsórios", "emprestimos compulsorios"
    ],
    literalText: `> **CTN — Art. 3º.** Tributo é toda prestação pecuniária compulsória, em moeda ou cujo valor nela se possa exprimir, que não constitua sanção de ato ilícito, instituída em lei e cobrada mediante atividade administrativa plenamente vinculada.
>
> **CTN — Art. 4º.** A natureza jurídica específica do tributo é determinada pelo fato gerador da respectiva obrigação, sendo irrelevantes para qualificá-la:
> * **I -** a denominação e demais características formais adotadas pela lei;
> * **II -** a destinação legal do produto da sua arrecadação.
>
> **CTN — Art. 5º.** Os tributos são impostos, taxas e contribuições de melhoria.
>
> **CTN — Art. 77.** As taxas cobradas pela União, pelos Estados, pelo Distrito Federal ou pelos Municípios, no âmbito de suas respectivas atribuições, têm como fato gerador o exercício regular do poder de polícia, ou a utilização, efetiva ou potencial, de serviço público específico e divisível, prestado ao contribuinte ou posto à sua disposição.
> * **Parágrafo único.** A taxa não pode ter base de cálculo ou fato gerador idênticos aos que correspondam a imposto nem ser calculada em função do capital das empresas.
>
> **CTN — Art. 81.** A contribuição de melhoria cobrada pela União, pelos Estados, pelo Distrito Federal ou pelos Municípios, no âmbito de suas respectivas atribuições, é instituída para fazer face ao custo de obras públicas de que decorra valorização imobiliária, tendo como limite total a despesa realizada e como limite individual o acréscimo de valor que da obra resultar para cada imóvel beneficiado.`
  },

  // [6] OBRIGAÇÃO TRIBUTÁRIA E SUJEIÇÃO PASSIVA
  {
    statute: "Código Tributário Nacional (Lei nº 5.172/1966)",
    article: "CTN Arts. 113 a 127 (Obrigação, Fato Gerador e Sujeição)",
    themeKeywords: [
      "obrigação tributária", "obrigacao tributaria", "fato gerador", "hipótese de incidência",
      "hipotese de incidencia", "sujeito ativo", "sujeito passivo", "contribuinte", "solidariedade tributária",
      "solidariedade tributaria", "capacidade tributária", "capacidade tributaria", "domicílio tributário",
      "domicilio tributario", "convenções particulares", "convencoes particulares"
    ],
    literalText: `> **CTN — Art. 113.** A obrigação tributária é principal ou acessória.
> * **§ 1º** A obrigação principal surge com a ocorrência do fato gerador, tem por objeto o pagamento de tributo ou penalidade pecuniária e extingue-se juntamente com o crédito dela decorrente.
> * **§ 2º** A obrigação acessória decorre da legislação tributária e tem por objeto as prestações, positivas ou negativas, nela previstas no interesse da arrecadação ou da fiscalização dos tributos.
> * **§ 3º** A obrigação acessória, pelo simples fato da sua inobservância, converte-se em obrigação principal relativamente à penalidade pecuniária.
>
> **CTN — Art. 121.** Sujeito passivo da obrigação principal é a pessoa obrigada ao pagamento de tributo ou penalidade pecuniária:
> * **I -** contribuinte, quando tenha relação pessoal e direta com a situação que constitua o respectivo fato gerador;
> * **II -** responsável, quando, sem revestir a condição de contribuinte, sua obrigação decorra de disposição expressa de lei.
>
> **CTN — Art. 123.** Salvo disposições de lei em contrário, as convenções particulares, relativas à responsabilidade pelo pagamento de tributos, não podem ser opostas à Fazenda Pública, para modificar a definição legal do sujeito passivo das obrigações tributárias correspondentes.
>
> **CTN — Art. 124.** São solidariamente obrigadas:
> * **I -** as pessoas que tenham interesse comum na situação que constitua o fato gerador da obrigação principal;
> * **II -** as pessoas expressamente designadas por lei.
> * **Parágrafo único.** A solidariedade referida neste artigo não comporta benefício de ordem.
>
> **CTN — Art. 126.** A capacidade tributária passiva independe:
> * **I -** da capacidade civil das pessoas naturais;
> * **II -** de achar-se a pessoa natural sujeita a medidas que importem privação ou limitação do exercício de atividades civis, comerciais ou profissionais, ou da administração direta de seus bens ou negócios;
> * **III -** de estar a pessoa jurídica regularmente constituída, bastando que configure uma unidade econômica ou profissional.`
  },

  // [7] RESPONSABILIDADE TRIBUTÁRIA
  {
    statute: "Código Tributário Nacional (Lei nº 5.172/1966)",
    article: "CTN Arts. 128 a 138 (Responsabilidade dos Sucessores, Terceiros e Infrações)",
    themeKeywords: [
      "responsabilidade tributária: disposições gerais", "responsabilidade tributária", "responsabilidade tributaria",
      "responsabilidade dos sucessores", "responsabilidade de terceiros", "responsabilidade por infrações",
      "responsabilidade por infracoes", "responsabilidade de grupo econômico", "responsabilidade de grupo economico",
      "art 133 ctn", "art 134 ctn", "art 135 ctn", "denúncia espontânea", "denuncia espontanea",
      "súmula 435 stj", "sumula 435 stj"
    ],
    literalText: `> **CTN — Art. 128.** Sem prejuízo do disposto no capítulo anterior, a lei pode atribuir de modo expresso a responsabilidade pelo crédito tributário a terceira pessoa, vinculada ao fato gerador da respectiva obrigação, excluindo a responsabilidade do contribuinte ou atribuindo-a a este em caráter supletivo do cumprimento total ou parcial da referida obrigação.
>
> **CTN — Art. 133.** A pessoa natural ou jurídica de direito privado que adquirir de outra, por qualquer título, fundo de comércio ou estabelecimento comercial, industrial ou profissional, e continuar a respectiva exploração, sob a mesma ou outra razão social ou sob firma ou nome individual, responde pelos tributos, relativos ao fundo ou estabelecimento adquirido, devidos até à data do ato:
> * **I -** integralmente, se o alienante cessar a exploração do comércio, indústria ou atividade;
> * **II -** subsidiariamente com o alienante, se este prosseguir na exploração ou iniciar dentro de seis meses a contar da data da alienação, nova atividade no mesmo ou em outro ramo de comércio, indústria ou profissão.
>
> **CTN — Art. 134.** Nos casos de impossibilidade de exigência do cumprimento da obrigação principal pelo contribuinte, respondem solidariamente com este nos atos em que intervierem ou pelas omissões de que forem responsáveis:
> * **I -** os pais, pelos tributos devidos por seus filhos menores; **II -** os tutores e curadores, pelos tributos devidos pelos seus tutelados ou curatelados; **III -** os administradores de bens de terceiros, pelos tributos devidos por estes; **VII -** os sócios, no caso de liquidação de sociedade de pessoas.
>
> **CTN — Art. 135.** São pessoalmente responsáveis pelos créditos correspondentes a obrigações tributárias resultantes de atos praticados com excesso de poderes ou infração de lei, contrato social ou estatutos:
> * **I -** as pessoas referidas no artigo anterior;
> * **II -** os mandatários, prepostos e empregados;
> * **III -** os diretores, gerentes ou representantes de pessoas jurídicas de direito privado.
>
> **CTN — Art. 138.** A responsabilidade é excluída pela denúncia espontânea da infração, acompanhada, se for o caso, do pagamento do tributo devido e dos juros de mora, ou do depósito da importância arbitrada pela autoridade administrativa, quando o montante do tributo dependa de apuração.
> * **Parágrafo único.** Não se considera espontânea a denúncia apresentada após o início de qualquer procedimento administrativo ou medida de fiscalização, relacionados com a infração.`
  },

  // [8] CRÉDITO TRIBUTÁRIO: CONSTITUIÇÃO, LANÇAMENTO, SUSPENSÃO, EXTINÇÃO, PRESCRIÇÃO E DECADÊNCIA
  {
    statute: "Código Tributário Nacional (Lei nº 5.172/1966)",
    article: "CTN Arts. 142, 150, 151, 156, 173, 174 e 175",
    themeKeywords: [
      "crédito tributário: disposições gerais", "crédito tributário", "credito tributario",
      "constituição do crédito", "constituicao do credito", "lançamento tributário", "lancamento tributario",
      "revisão do lançamento", "revisao do lancamento", "suspensão da exigibilidade", "suspensao da exigibilidade",
      "extinção do crédito", "extincao do credito", "exclusão do crédito", "exclusao do credito",
      "decadência tributária", "decadencia tributaria", "prescrição tributária", "prescricao tributaria",
      "isenção tributária", "isencao tributaria", "anistia tributária", "anistia tributaria"
    ],
    literalText: `> **CTN — Art. 142.** Compete privativamente à autoridade administrativa constituir o crédito tributário pelo lançamento, assim entendido o procedimento administrativo tendente a verificar a ocorrência do fato gerador da obrigação correspondente, determinar a matéria tributável, calcular o montante do tributo devido, identificar o sujeito passivo e, sendo caso, propor a aplicação da penalidade cabível.
>
> **CTN — Art. 150, § 4º.** Se a lei não fixar prazo a homologação, será ele de cinco anos, a contar da ocorrência do fato gerador; expirado esse prazo sem que a Fazenda Pública se tenha pronunciado, considera-se homologado o lançamento e definitivamente extinto o crédito, salvo se comprovada a ocorrência de dolo, fraude ou simulação.
>
> **CTN — Art. 151.** Suspendem a exigibilidade do crédito tributário:
> * **I -** moratória;
> * **II -** o depósito do seu montante integral;
> * **III -** as reclamações e os recursos, nos termos das leis reguladoras do processo tributário administrativo;
> * **IV -** a concessão de medida liminar em mandado de segurança;
> * **V -** a concessão de medida liminar ou de tutela antecipada, em outras espécies de ação judicial;
> * **VI -** o parcelamento.
>
> **CTN — Art. 156.** Extinguem o crédito tributário:
> * **I -** o pagamento; **II -** a compensação; **III -** a transação; **IV -** remissão; **V -** a prescrição e a decadência; **VI -** a conversão de depósito em renda; **VII -** o pagamento antecipado e a homologação do lançamento; **VIII -** a consignação em pagamento julgada procedente; **IX -** a decisão administrativa irreformável; **X -** a decisão judicial passada em julgado; **XI -** a dação em pagamento em bens imóveis, na forma e condições estabelecidas em lei.
>
> **CTN — Art. 173.** O direito de a Fazenda Pública constituir o crédito tributário extingue-se após 5 (cinco) anos, contados:
> * **I -** do primeiro dia do exercício seguinte àquele em que o lançamento poderia ter sido efetuado;
> * **II -** da data em que se tornar definitiva a decisão que houver anulado, por vício formal, o lançamento anteriormente efetuado.
>
> **CTN — Art. 174.** A ação para a cobrança do crédito tributário prescreve em 5 (cinco) anos, contados da data da sua constituição definitiva.
> * **Parágrafo único.** A prescrição se interrompe:
>   * **I -** pelo despacho do juiz que ordenar a citação em execução fiscal;
>   * **II -** pelo protesto judicial;
>   * **III -** por qualquer ato judicial que constitua em mora o devedor;
>   * **IV -** por qualquer ato inequívoco ainda que extrajudicial, que importe em reconhecimento do débito pelo devedor.`
  },

  // [9] TRANSAÇÃO TRIBUTÁRIA E COBRANÇA EXTRAJUDICIAL DA DÍVIDA ATIVA DA UNIÃO
  {
    statute: "Lei nº 13.988/2020 e Portaria PGFN nº 6.757/2022 e CTN",
    article: "Lei nº 13.988/2020 Arts. 1º a 3º, 11 c/c CTN Arts. 201 a 204",
    themeKeywords: [
      "transação tributária: o regime da lei nº 13.988/18; portaria pgfn nº 6.757/2022", "transação tributária",
      "transacao tributaria", "lei 13.988", "lei 13988", "portaria pgfn 6.757", "portaria pgfn 6757",
      "cobrança extrajudicial do crédito inscrito em dívida ativa", "cobranca extrajudicial",
      "dívida ativa da união", "divida ativa da uniao", "cda", "cadin", "averbação pré-executória",
      "oferta antecipada de garantia", "negócio jurídico processual", "negocio juridico processual"
    ],
    literalText: `> **Lei nº 13.988/2020 — Art. 1º.** Esta Lei estabelece os requisitos e as condições para que a União, as suas autarquias e fundações públicas, e os devedores ou as partes adversas realizem transação resolutiva de litígio relativo a cobrança de créditos da Fazenda Pública, de natureza tributária ou não tributária.
> * **§ 2º** Para fins do disposto nesta Lei, a transação poderá ser realizada:
>   * **I -** por adesão, nas hipóteses em que o devedor ou a parte adversa aderir aos termos e condições estabelecidos em edital publicado pela Procuradoria-Geral da Fazenda Nacional;
>   * **II -** por proposta individual ou conjunta de iniciativa do devedor ou do credor.
>
> **Lei nº 13.988/2020 — Art. 2º.** Para fins do disposto nesta Lei, são modalidades de transação:
> * **I -** transação na cobrança de créditos sob gestão da Procuradoria-Geral da Fazenda Nacional, inscritos ou não em dívida ativa da União;
> * **II -** transação no contencioso tributário de relevante e disseminada controvérsia jurídica;
> * **III -** transação no contencioso de pequeno valor.
>
> **Lei nº 13.988/2020 — Art. 11.** A transação na cobrança da dívida ativa da União poderá contemplar os seguintes benefícios:
> * **I -** concessão de descontos nas multas, nos juros de mora e nos encargos legais relativos a créditos a serem transacionados que sejam classificados como irrecuperáveis ou de difícil recuperação;
> * **II -** oferecimento de prazos e formas de pagamento diferenciados, incluído o diferimento e a moratória;
> * **III -** oferecimento, substituição ou alienação de garantias e de constrições.
> * **§ 1º** É vedada a transação que: I - reduza o montante principal do crédito; II - implique redução superior a sessenta e cinco por cento do valor total dos créditos a serem transacionados.
>
> **CTN — Art. 204.** A dívida regularmente inscrita goza da presunção de certeza e liquidez e tem o efeito de prova pré-constituída.
> * **Parágrafo único.** A presunção a que se refere este artigo é relativa e pode ser ilidida por prova inequívoca, a cargo do sujeito passivo ou do terceiro a que aproveite.`
  },

  // [10] PARR - PROCEDIMENTO ADMINISTRATIVO DE RECONHECIMENTO DE RESPONSABILIDADE
  {
    statute: "Portaria PGFN nº 948/2017 e CTN",
    article: "Portaria PGFN nº 948/2017 Arts. 1º a 9º c/c CTN Art. 135",
    themeKeywords: [
      "procedimento administrativo de reconhecimento de responsabilidade", "parr", "portaria pgfn nº 948/2017",
      "portaria pgfn 948/2017", "portaria pgfn 948", "responsabilização administrativa", "redirecionamento extrajudicial",
      "defesa prévia no parr", "impugnação no parr", "contraditório administrativo pgfn"
    ],
    literalText: `> **Portaria PGFN nº 948/2017 — Art. 1º.** O Procedimento Administrativo de Reconhecimento de Responsabilidade - PARR destina-se a apurar a responsabilidade de terceiros pela prática de atos com excesso de poderes ou infração de lei, contrato social ou estatutos, relativamente a créditos inscritos em Dívida Ativa da União - DAU.
>
> **Portaria PGFN nº 948/2017 — Art. 2º.** O PARR será instaurado por ato fundamentado do Procurador da Fazenda Nacional, contendo a descrição circunstanciada dos fatos e a indicação das provas que demonstram a conduta ilícita imputada ao terceiro.
>
> **Portaria PGFN nº 948/2017 — Art. 4º.** O terceiro será notificado para, no prazo de 30 (trinta) dias, apresentar impugnação acompanhada das provas que entender necessárias.
>
> **Portaria PGFN nº 948/2017 — Art. 7º.** Acolhida a proposta de reconhecimento de responsabilidade pela autoridade competente, o nome do terceiro será incluído no sistema da Dívida Ativa da União como corresponsável pelo crédito, ensejando a emissão de nova certidão e o imediato redirecionamento das execuções fiscais ou medidas de cobrança.
>
> **CTN — Art. 135.** São pessoalmente responsáveis pelos créditos correspondentes a obrigações tributárias resultantes de atos praticados com excesso de poderes ou infração de lei, contrato social ou estatutos:
> * **III -** os diretores, gerentes ou representantes de pessoas jurídicas de direito privado.`
  },

  // [11] JURISPRUDÊNCIA DO STF, MODULAÇÃO E COISA JULGADA (TEMAS 881 E 885 STF)
  {
    statute: "CPC/2015 e STF (Temas 881 e 885 da Repercussão Geral)",
    article: "CPC/2015 Art. 505, I c/c Teses de Repercussão Geral 881 e 885 do STF",
    themeKeywords: [
      "jurisprudência do stf", "jurisprudencia do stf", "modulação dos efeitos temporais",
      "modulacao dos efeitos temporais", "coisa julgada em matéria tributária", "coisa julgada em materia tributaria",
      "temas 881 e 885", "tema 881", "tema 885", "trato sucessivo", "cessação de efeitos da coisa julgada",
      "cessacao de efeitos da coisa julgada", "limites da coisa julgada tributária"
    ],
    literalText: `> **CPC/2015 — Art. 505.** Nenhum juiz decidirá novamente as questões já decididas relativas à mesma lide, salvo:
> * **I -** se, tratando-se de relação jurídica de trato continuado, sobreveio modificação no estado de fato ou de direito, caso em que poderá a parte pedir a revisão do que foi estatuído na sentença.
>
> **STF — Tema 881 da Repercussão Geral (RE 949.297/CE):**
> * **Tese:** "As decisões do STF em controle difuso assumem eficácia erga omnes e efeito vinculante com a publicação da ata de julgamento no Plenário, ensejando a cessação imediata dos efeitos futuros de coisa julgada anterior que tenha reconhecido a inexigibilidade de tributo recolhido em trato continuado, respeitadas a irretroatividade, a anterioridade anual e a noventena conforme a natureza do tributo."
>
> **STF — Tema 885 da Repercussão Geral (RE 955.227/BA):**
> * **Tese:** "1. As decisões do STF em controle incidental ou concentrado de constitucionalidade não provocam a rescisão automática das sentenças transitadas em julgado, mas acarretam a cessação da eficácia executiva das sentenças em relações jurídicas tributárias de trato continuado a partir da publicação do acórdão.
> 2. A cessação da eficácia da coisa julgada não exige a propositura prévia de ação rescisória, operando de pleno direito perante os fatos geradores posteriores.
> 3. Na hipótese de restabelecimento da cobrança de tributo antes considerado inconstitucional, devem ser observadas as regras constitucionais de irretroatividade e anterioridade (anual e nonagesimal) que regem o tributo respectivo."`
  },

  // [12] PROCESSO JUDICIAL TRIBUTÁRIO E REPETIÇÃO DE INDÉBITO
  {
    statute: "Código Tributário Nacional e Lei nº 12.016/2009",
    article: "CTN Arts. 165 a 169 c/c Lei nº 12.016/2009 Art. 7º, III",
    themeKeywords: [
      "processo judicial tributário: ações do fisco contra o contribuinte", "processo judicial tributário",
      "processo judicial tributario", "ações do fisco contra o contribuinte", "ações do contribuinte contra o fisco",
      "repetição do indébito", "repeticao do indebito", "mandado de segurança tributário", "mandado de seguranca tributario",
      "ação anulatória de débito fiscal", "acao anulatoria de debito", "ação declaratória tributária",
      "consignação em pagamento tributária", "compensação de indébito", "art 165 ctn", "art 166 ctn"
    ],
    literalText: `> **CTN — Art. 165.** O sujeito passivo tem direito, independentemente de prévio protesto, à restituição total ou parcial do tributo, seja qual for a modalidade do seu pagamento, nos seguintes casos:
> * **I -** cobrança ou pagamento espontâneo de tributo indevido ou maior que o devido em face da legislação tributária aplicável, ou da natureza ou circunstâncias materiais do fato gerador efetivamente ocorrido;
> * **II -** erro na edificação do sujeito passivo, na determinação da alíquota aplicável, no cálculo do montante do débito ou na elaboração ou conferência de qualquer documento relativo ao pagamento;
> * **III -** reforma, anulação, revogação ou rescisão de decisão condenatória.
>
> **CTN — Art. 166.** A restituição de tributos que comportem, por sua natureza, transferência do respectivo encargo financeiro somente será feita a quem prove haver assumido o referido encargo, ou, no caso de tê-lo transferido a terceiro, estar por este expressamente autorizado a recebê-la.
>
> **CTN — Art. 168.** O direito de pleitear a restituição extingue-se com o decurso do prazo de 5 (cinco) anos, contados:
> * **I -** nas hipóteses dos incisos I e II do artigo 165, da data da extinção do crédito tributário;
> * **II -** na hipótese do inciso III do artigo 165, da data em que se tornar cominatória a decisão administrativa ou passar em julgado a decisão judicial que tenha reformado, anulado, revogado ou rescindido a decisão condenatória.
>
> **Lei nº 12.016/2009 — Art. 7º, III e § 2º.** Ao despachar a inicial, o juiz ordenará que se suspenda o ato que deu motivo ao pedido, quando houver fundamento relevante e do ato impugnado puder resultar a ineficácia da medida. Não será concedida medida liminar que tenha por objeto a compensação de créditos tributários ou a entrega de mercadorias e bens provenientes do exterior.`
  },

  // [13] LEI DE EXECUÇÃO FISCAL (LEI Nº 6.830/1980) E CTN
  {
    statute: "Lei de Execução Fiscal (Lei nº 6.830/1980) e CTN",
    article: "LEF Arts. 2º, 3º, 16 e 40 c/c CTN Arts. 185, 185-A e 186",
    themeKeywords: [
      "lei nº 6.830/80", "lei 6.830", "lei 6830", "execução fiscal", "execucao fiscal",
      "embargos à execução fiscal", "embargos a execucao fiscal", "exceção de pré-executividade", "excecao de pre-executividade",
      "art 40 lef", "prescrição intercorrente", "prescricao intercorrente", "redirecionamento de execução fiscal",
      "garantias, privilégios e preferências do crédito tributário", "garantias", "penhora", "arresto",
      "art 185-a ctn", "indisponibilidade de bens"
    ],
    literalText: `> **LEF — Art. 2º.** A Dívida Ativa da Fazenda Pública, compreendendo a tributária e a não tributária, abrange a atualização monetária, juros e multa de mora e demais encargos previstos em lei ou contrato.
>
> **LEF — Art. 3º.** A Dívida Ativa regularmente inscrita goza da presunção de certeza e liquidez.
> * **Parágrafo único.** A presunção a que se refere este artigo é relativa e pode ser ilidida por prova inequívoca, a cargo do executado ou de terceiro, a quem aproveite.
>
> **LEF — Art. 16.** O executado oferecerá embargos, no prazo de 30 (trinta) dias, contados:
> * **I -** do depósito; **II -** da juntada da prova da fiança bancária ou do seguro garantia; **III -** da intimação da penhora.
> * **§ 1º** Não são admissíveis embargos do executado antes de garantida a execução.
>
> **LEF — Art. 40.** O Juiz suspenderá o curso da execução, enquanto não for localizado o devedor ou encontrados bens sobre os quais possa recair a penhora, e, nesses casos, não correrá o prazo de prescrição.
> * **§ 1º** Não sendo localizado o devedor ou não sendo encontrados bens penhoráveis, o Juiz determinará a suspensão do curso da execução pelo prazo de 1 (um) ano.
> * **§ 2º** Decorrido o prazo máximo de 1 (um) ano, sem que seja localizado o devedor ou encontrados bens, o Juiz ordenará o arquivamento dos autos.
> * **§ 4º** Se da decisão que ordenar o arquivamento tiver decorrido o prazo prescricional, o juiz, depois de ouvida a Fazenda Pública, poderá, de ofício, reconhecer a prescrição intercorrente e decretá-la de imediato (Tema 566/STJ).
>
> **CTN — Art. 185-A.** Na hipótese de o devedor tributário, devidamente citado, não pagar nem apresentar bens à penhora no prazo legal e não forem encontrados bens penhoráveis, o juiz determinará a indisponibilidade de seus bens e direitos, comunicando a decisão, preferencialmente por meio eletrônico, aos órgãos e entidades que promovem registros de transferência de bens e aos cartórios de registro de imóveis.`
  },

  // [14] IMPOSTOS FEDERAIS EM ESPÉCIE E REPARTIÇÃO DE RECEITAS
  {
    statute: "Constituição Federal de 1988",
    article: "CF/88 Arts. 153, 154 e 157 a 162 (Impostos da União e Repartição)",
    themeKeywords: [
      "impostos da união", "impostos da uniao", "impostos federais em espécie", "impostos federais em especie",
      "imposto de importação", "imposto de importacao", "imposto de exportação", "imposto de exportacao",
      "irpj", "irpf", "imposto sobre a renda", "ipi", "iof", "itr", "igf",
      "competência residual da união", "competencia residual da uniao", "repartição das receitas tributárias", "reparticao das receitas tributarias"
    ],
    literalText: `> **CF/88 — Art. 153.** Compete à União instituir impostos sobre:
> * **I -** importação de produtos estrangeiros (II);
> * **II -** exportação, para o exterior, de produtos nacionais ou nacionalizados (IE);
> * **III -** renda e proventos de qualquer natureza (IR);
> * **IV -** produtos industrializados (IPI);
> * **V -** operações de crédito, câmbio e seguro, ou relativas a títulos ou valores mobiliários (IOF);
> * **VI -** propriedade territorial rural (ITR);
> * **VII -** grandes fortunas, nos termos de lei complementar (IGF).
> * **§ 1º** É facultado ao Poder Executivo, atendidas as condições e os limites estabelecidos em lei, alterar as alíquotas dos impostos enumerados nos incisos I, II, IV e V.
> * **§ 2º** O imposto previsto no inciso III: I - será informado pelos critérios da generalidade, da universalidade e da progressividade, na forma da lei.
> * **§ 3º** O imposto previsto no inciso IV: I - será seletivo, em função da essencialidade do produto; II - será não cumulativo.
>
> **CF/88 — Art. 154.** A União poderá instituir:
> * **I -** mediante lei complementar, impostos não previstos no artigo anterior, desde que sejam não-cumulativos e não tenham fato gerador ou base de cálculo próprios dos discriminados nesta Constituição (competência residual);
> * **II -** na iminência ou no caso de guerra externa, impostos extraordinários, compreendidos ou não em sua competência tributária.`
  },

  // [15] CONTRIBUIÇÕES SOCIAIS EM ESPÉCIE, PIS/COFINS, SEGURIDADE E TEMA 69 STF
  {
    statute: "Constituição Federal de 1988 e STF (Tema 69)",
    article: "CF/88 Arts. 149 e 195 c/c Tese do Tema 69 do STF",
    themeKeywords: [
      "contribuições sociais em espécie", "contribuicoes sociais em especie", "contribuições sociais",
      "contribuicoes sociais", "contribuição para o pis", "contribuicao para o pis", "cofins", "csll",
      "seguridade social", "faturamento", "receita bruta", "tema 69 stf", "exclusão do icms da base de calculo do pis cofins",
      "contribuições corporativas", "contribuicoes corporativas", "cide", "contribuições de intervenção no domínio econômico",
      "contribuicoes de intervencao no dominio economico"
    ],
    literalText: `> **CF/88 — Art. 149.** Compete exclusivamente à União instituir contribuições sociais, de intervenção no domínio econômico e de interesse das categorias profissionais ou econômicas, como instrumento de sua atuação nas respectivas áreas.
> * **§ 1º** A União, os Estados, o Distrito Federal e os Municípios instituirão, por meio de lei, contribuições para custeio de regime próprio de previdência social.
>
> **CF/88 — Art. 195.** A seguridade social será financiada por toda a sociedade, de forma direta e indireta, mediante recursos provenientes dos orçamentos e das seguintes contribuições sociais:
> * **I -** do empregador, da empresa e da entidade a ela equiparada, incidentes sobre:
>   * **a)** a folha de salários e demais rendimentos do trabalho;
>   * **b)** a receita ou o faturamento;
>   * **c)** o lucro;
> * **II -** do trabalhador e dos demais segurados da previdência social;
> * **III -** sobre a receita de concursos de prognósticos;
> * **IV -** do importador de bens ou serviços do exterior.
> * **§ 6º** As contribuições sociais de que trata este artigo só poderão ser exigidas após decorridos noventa dias da data da publicação da lei que as houver instituído ou modificado, não se lhes aplicando o disposto no art. 150, III, "b" (anterioridade nonagesimal pura).
>
> **STF — Tema 69 da Repercussão Geral (RE 574.706/PR):**
> * **Tese:** "O ICMS não compõe a base de cálculo para a incidência do PIS e da COFINS."
> * **Modulação:** O montante a ser excluído é o ICMS destacado nas notas fiscais de saída, com efeitos modulados a partir de 15/03/2017, ressalvadas as ações judiciais e administrativas protocoladas até a data da sessão em que proferido o julgamento.`
  },

  // [16] DIREITO TRIBUTÁRIO INTERNACIONAL, PREÇOS DE TRANSFERÊNCIA, FGTS E CRIPTOATIVOS
  {
    statute: "Lei nº 14.596/2023 e Lei nº 8.036/1990 e CTN",
    article: "Lei nº 14.596/2023 c/c CTN Art. 98 e Lei nº 8.036/1990",
    themeKeywords: [
      "direito tributário internacional", "direito tributario internacional", "preços de transferência",
      "precos de transferencia", "arm's length", "arms length", "bitributação", "bitributacao",
      "treaty shopping", "fundo de garantia por tempo de serviço", "fundo de garantia por tempo de servico",
      "fgts", "lc 110/2001", "lc 110", "tributação da economia digital", "tributacao da economia digital",
      "criptoativos", "software", "in rfb 1888"
    ],
    literalText: `> **Lei nº 14.596/2023 — Art. 2º.** Para a determinação da base de cálculo dos tributos sujeitos às regras de preços de transferência, os termos e as condições de uma transação controlada serão estabelecidos em conformidade com aqueles que seriam acordados entre partes não vinculadas em transações comparáveis (princípio arm's length).
>
> **Lei nº 14.596/2023 — Art. 11.** O método mais apropriado para determinar o preço arm's length será selecionado entre: Preço Independente Comparável - PIC; Preço de Revenda menos Lucro - PRL; Custo mais Lucro - MCL; Margem Líquida da Transação - MLT; Divisão do Lucro - MDL; ou outros métodos internacionalmente aceitos.
>
> **CTN — Art. 98.** Os tratados e as convenções internacionais revogam ou modificam a legislação tributária interna, e serão observados pela que lhes sobrevenha.
>
> **Lei nº 8.036/1990 — Art. 2º.** O FGTS é constituído pelos saldos das contas vinculadas a que se refere esta lei e outros recursos a ele incorporados, tendo seus recursos destinados à habitação popular, saneamento básico e infraestrutura urbana. O STF pacificou que o FGTS ostenta natureza social e trabalhista, não tributária (Súmula 353 do STJ e Tema 608 do STF: prescrição quinquenal).`
  },

// --- CPC/2015 - PRECEDENTES OBRIGATÓRIOS E COISA JULGADA ---
  // ==========================================
    {
    "statute": "CPC/2015 - Precedentes Obrigatórios e Coisa Julgada",
    "article": "Arts. 17, 485, 487, 502 a 508 e 926 a 928",
    "themeKeywords": [
      "cpc 2015",
      "precedentes obrigatorios",
      "art 927 cpc",
      "art 926 cpc",
      "coisa julgada",
      "art 502 cpc",
      "art 503 cpc",
      "art 485 cpc",
      "art 487 cpc"
    ],
    "literalText": "> **Art. 17.** Para postular em juízo é necessário ter interesse e legitimidade.\n>\n> **Art. 502.** Denomina-se coisa julgada material a autoridade que torna imutável e indiscutível a decisão de mérito não mais sujeita a recurso.\n>\n> **Art. 503.** A decisão que julgar total ou parcialmente o mérito tem força de lei nos limites da questão principal expressamente decidida.\n> * **§ 1º** O disposto no caput aplica-se à resolução de questão prejudicial, decidida expressa e incidentemente no processo, se: I - dessa resolução depender o julgamento do mérito; II - a seu respeito tiver havido contraditório prévio e efetivo; III - o juízo tiver competência em razão da matéria e da pessoa para resolvê-la como questão principal.\n>\n> **Art. 508.** Transitada em julgado a decisão de mérito, considerar-se-ão deduzidas e repelidas todas as alegações e as defesas que a parte poderia opor tanto ao acolhimento quanto à rejeição do pedido.\n>\n> **Art. 926.** Os tribunais devem uniformizar sua jurisprudência e mantê-la estável, íntegra e coerente.\n>\n> **Art. 927.** Os juízes e os tribunais observarão:\n> * **I -** as decisões do Supremo Tribunal Federal em controle concentrado de constitucionalidade;\n> * **II -** os enunciados de súmula vinculante;\n> * **III -** os acórdãos em incidente de assunção de competência ou de resolução de demandas repetitivas e em julgamento de recursos extraordinário e especial repetitivos;\n> * **IV -** os enunciados das súmulas do Supremo Tribunal Federal em matéria constitucional e do Superior Tribunal de Justiça em matéria infraconstitucional;\n> * **V -** as orientações do plenário ou do órgão especial aos quais estiverem vinculados.\n> * **§ 3º** Na hipótese de alteração de jurisprudência pacificada do Supremo Tribunal Federal e dos tribunais superiores ou daquela oriunda de julgamento de recursos repetitivos, pode haver modulação dos efeitos da alteração no interesse social e no da segurança jurídica."
  },

  // ==========================================
  // --- DIREITO DA SEGURIDADE SOCIAL E PREVIDENCIÁRIO ---
  // ==========================================
  {
    statute: "Constituição Federal de 1988",
    article: "Arts. 194, 195 e 201 (Seguridade e Previdência Social)",
    themeKeywords: ["seguridade social", "previdência social", "previdenciário", "inss", "rgps", "rpps", "reforma da previdência", "ec 103", "custeio", "benefício previdenciário", "aposentadoria", "pensão por morte"],
    literalText: `> **Art. 194.** A seguridade social compreende um conjunto integrado de ações de iniciativa dos Poderes Públicos e da sociedade, destinadas a assegurar os direitos relativos à saúde, à previdência e à assistência social.
> * **Parágrafo único.** Compete ao Poder Público, nos termos da lei, organizar a seguridade social, com base nos seguintes objetivos:
>   * **I -** universalidade da cobertura e do atendimento;
>   * **II -** uniformidade e equivalência dos benefícios e serviços às populações urbanas e rurais;
>   * **III -** seletividade e distributividade na prestação dos benefícios e serviços;
>   * **IV -** irredutibilidade do valor dos benefícios;
>   * **V -** eqüidade na forma de participação no custeio;
>   * **VI -** diversidade da base de financiamento;
>   * **VII -** caráter democrático e descentralizado da administração.
>
> **Art. 195.** A seguridade social será financiada por toda a sociedade, de forma direta e indireta, nos termos da lei, mediante recursos provenientes dos orçamentos da União, dos Estados, do Distrito Federal e dos Municípios, e de contribuições sociais.
>
> **Art. 201.** A previdência social será organizada sob a forma do Regime Geral de Previdência Social, de caráter contributivo e de filiação obrigatória, observados critérios que preservem o equilíbrio financeiro e atuarial.`
  },

  // ==========================================
  // --- DIREITO DO TRABALHO E PROCESSUAL DO TRABALHO ---
  // ==========================================
  {
    statute: "Constituição Federal de 1988 e CLT",
    article: "CF Art. 7º e 114 c/c CLT Arts. 2º, 3º e 611-A",
    themeKeywords: ["direito do trabalho", "processo do trabalho", "relação de trabalho", "relação de emprego", "terceirização", "negociado sobre o legislado", "clt", "competência da justiça do trabalho", "art. 114"],
    literalText: `> **CF/88 — Art. 7º.** São direitos dos trabalhadores urbanos e rurais, além de outros que visem à melhoria de sua condição social:
> * **XXVI -** reconhecimento das convenções e acordos coletivos de trabalho;
>
> **CF/88 — Art. 114.** Compete à Justiça do Trabalho processar e julgar:
> * **I -** as ações oriundas da relação de trabalho, abrangidos os entes de direito público externo e da administração pública direta e indireta da União, dos Estados, do Distrito Federal e dos Municípios;
> * **VII -** as ações relativas às penalidades administrativas impostas aos empregadores pelos órgãos de fiscalização das relações de trabalho.
>
> **CLT — Art. 611-A.** A convenção coletiva e o acordo coletivo de trabalho têm prevalência sobre a lei quando, entre outros, dispuserem sobre pacto quanto à jornada de trabalho, banco de horas e teletrabalho.`
  },

  // ==========================================
  // --- DIREITO FINANCEIRO E ECONÔMICO ---
  // ==========================================
  {
    statute: "Constituição Federal de 1988 e LRF",
    article: "CF Arts. 100, 165 a 169 c/c Lei Complementar nº 101/2000 (LRF)",
    themeKeywords: ["direito financeiro", "finanças públicas", "orçamento público", "lei orçamentária anual", "loa", "ldo", "ppa", "precatórios", "lrf", "responsabilidade fiscal", "despesa pública", "dívida pública"],
    literalText: `> **CF/88 — Art. 100.** Os pagamentos devidos pelas Fazendas Públicas Federal, Estaduais, Distrital e Municipais, em virtude de sentença judiciária, far-se-ão exclusivamente na ordem cronológica de apresentação dos precatórios e à conta dos créditos respectivos.
>
> **CF/88 — Art. 165.** Leis de iniciativa do Poder Executivo estabelecerão:
> * **I -** o plano plurianual (PPA);
> * **II -** as diretrizes orçamentárias (LDO);
> * **III -** os orçamentos anuais (LOA).
>
> **LRF — Art. 1º, § 1º.** A responsabilidade na gestão fiscal pressupõe a ação planejada e transparente, em que se previnem riscos e corrigem desvios capazes de afetar o equilíbrio das contas públicas.`
  },

  // ==========================================
  // --- DIREITO AMBIENTAL ---
  // ==========================================
  {
    statute: "Constituição Federal de 1988",
    article: "Art. 225 (Meio Ambiente)",
    themeKeywords: ["direito ambiental", "meio ambiente", "poluidor pagador", "responsabilidade civil ambiental", "licenciamento ambiental", "fauna", "flora", "recursos hídricos"],
    literalText: `> **Art. 225.** Todos têm direito ao meio ambiente ecologicamente equilibrado, bem de uso comum do povo e essencial à sadia qualidade de vida, impondo-se ao Poder Público e à coletividade o dever de defendê-lo e preservá-lo para as presentes e futuras gerações.
> * **§ 1º** Para assegurar a efetividade desse direito, incumbe ao Poder Público:
>   * **IV -** exigir, na forma da lei, para instalação de obra ou atividade potencialmente causadora de significativa degradação do meio ambiente, estudo prévio de impacto ambiental (EIA/RIMA), a que se dará publicidade;
> * **§ 3º** As condutas e atividades consideradas lesivas ao meio ambiente sujeitarão os infratores, pessoas físicas ou jurídicas, a sanções penais e administrativas, independentemente da obrigação de reparar os danos causados.`
  },

  // ==========================================
  // --- DIREITO AGRÁRIO ---
  // ==========================================
  {
    statute: "Constituição Federal de 1988",
    article: "Arts. 184 a 191 (Reforma Agrária e Função Social da Propriedade)",
    themeKeywords: ["direito agrário", "reforma agrária", "desapropriação agrária", "imóvel rural", "função social da propriedade rural", "incra", "módulo rural"],
    literalText: `> **Art. 184.** Compete à União desapropriar por interesse social, para fins de reforma agrária, o imóvel rural que não esteja cumprindo sua função social, mediante prévia e justa indenização em títulos da dívida agrária, com cláusula de exata preservação de seu valor real.
>
> **Art. 185.** São insuscetíveis de desapropriação para fins de reforma agrária:
> * **I -** a pequena e média propriedade rural, assim definida em lei, desde que seu proprietário não possua outra;
> * **II -** a propriedade produtiva.
>
> **Art. 186.** A função social é cumprida quando a propriedade rural atende, simultaneamente, segundo critérios e graus de exigência estabelecidos em lei: aproveitamento racional e adequado; utilização adequada dos recursos naturais disponíveis e preservação do meio ambiente; observância das disposições que regulam as relações de trabalho; e exploração que favoreça o bem-estar dos proprietários e dos trabalhadores.`
  },

  // ==========================================
  // --- DIREITO EMPRESARIAL ---
  // ==========================================
  {
    statute: "Código Civil e Lei nº 11.101/2005",
    article: "CC Arts. 966 e 1.052 c/c Lei nº 11.101/2005 Arts. 47 e 48",
    themeKeywords: ["direito empresarial", "empresário", "sociedade empresária", "sociedade limitada", "recuperação judicial", "falência", "títulos de crédito"],
    literalText: `> **Código Civil — Art. 966.** Considera-se empresário quem exerce profissionalmente atividade econômica organizada para a produção ou a circulação de bens ou de serviços.
>
> **Lei nº 11.101/2005 — Art. 47.** A recuperação judicial tem por objetivo viabilizar a superação da situação de crise econômico-financeira do devedor, a fim de permitir a manutenção da fonte produtora, do emprego dos trabalhadores e do interesse dos credores, promovendo, assim, a preservação da empresa, sua função social e o estímulo à atividade econômica.`
  },

  // ==========================================
  // --- DIREITO INTERNACIONAL PÚBLICO E PRIVADO ---
  // ==========================================
  {
    statute: "Constituição Federal de 1988 e LINDB",
    article: "CF Arts. 4º e 5º, § 3º c/c LINDB Arts. 7º a 17",
    themeKeywords: ["direito internacional", "direito internacional público", "direito internacional privado", "tratados internacionais", "jus cogens", "convenção de viena", "conflito de leis no espaço", "imunidade de jurisdição", "extradição"],
    literalText: `> **CF/88 — Art. 4º.** A República Federativa do Brasil rege-se nas suas relações internacionais pelos seguintes princípios:
> * **I -** independência nacional;
> * **II -** prevalência dos direitos humanos;
> * **III -** autodeterminação dos povos;
> * **IV -** não-intervenção;
> * **V -** igualdade entre os Estados;
> * **VI -** defesa da paz;
> * **VII -** solução pacífica dos conflitos.
>
> **CF/88 — Art. 5º, § 3º.** Os tratados e convenções internacionais sobre direitos humanos que forem aprovados, em cada Casa do Congresso Nacional, em dois turnos, por três quintos dos votos dos respectivos membros, serão equivalentes às emendas constitucionais.
>
> **LINDB — Art. 7º.** A lei do país em que domiciliada a pessoa determina as regras sobre o começo e o fim da personalidade, o nome, a capacidade e os direitos de família.`
  },

  // =========================================================================
    // =========================================================================
  // FASE 1.8: DIREITO INTERNACIONAL PÚBLICO E TRIBUTÁRIO INTERNACIONAL
  // =========================================================================
  {
    statute: "Constituição Federal de 1988",
    article: "CF/88 Arts. 4º, 5º, §§ 2º, 3º e 4º, 49, I, 84, VIII, 102 e 105",
    themeKeywords: [
      "direito internacional", "direito internacional público", "relação entre direito internacional público e direito interno estatal",
      "relacao entre direito internacional publico e direito interno estatal", "fontes do direito internacional público",
      "incorporação de tratados", "incorporacao de tratados", "dualismo moderado", "monismo", "supralegalidade",
      "emenda constitucional", "direitos humanos", "decreto de promulgação", "denúncia de tratados", "denuncia de tratados"
    ],
    literalText: `> **CF/88 — Art. 4º.** A República Federativa do Brasil rege-se nas suas relações internacionais pelos seguintes princípios:
> * **I -** independência nacional;
> * **II -** prevalência dos direitos humanos;
> * **III -** autodeterminação dos povos;
> * **IV -** não-intervenção;
> * **V -** igualdade entre os Estados;
> * **VI -** defesa da paz;
> * **VII -** solução pacífica dos conflitos;
> * **VIII -** repúdio ao terrorismo e ao racismo;
> * **IX -** cooperação entre os povos para o progresso da humanidade;
> * **X -** concessão de asilo político.
> * **Parágrafo único.** A República Federativa do Brasil buscará a integração econômica, política, social e cultural dos povos da América Latina, visando à formação de uma comunidade latino-americana de nações.
>
> **CF/88 — Art. 5º, § 2º.** Os direitos e garantias expressos nesta Constituição não excluem outros decorrentes do regime e dos princípios por ela adotados, ou dos tratados internacionais em que a República Federativa do Brasil seja parte.
>
> **CF/88 — Art. 5º, § 3º.** Os tratados e convenções internacionais sobre direitos humanos que forem aprovados, em cada Casa do Congresso Nacional, em dois turnos, por três quintos dos votos dos respectivos membros, serão equivalentes às emendas constitucionais.
>
> **CF/88 — Art. 5º, § 4º.** O Brasil se submete à jurisdição de Tribunal Penal Internacional a cuja criação tenha manifestado adesão.
>
> **CF/88 — Art. 49.** É da competência exclusiva do Congresso Nacional:
> * **I -** resolver definitivamente sobre tratados, acordos ou atos internacionais que acarretem encargos ou compromissos gravosos ao patrimônio nacional.
>
> **CF/88 — Art. 84.** Compete privativamente ao Presidente da República:
> * **VIII -** celebrar tratados, convenções e atos internacionais, sujeitos a referendo do Congresso Nacional.`
  },
  {
    statute: "Convenção de Viena sobre o Direito dos Tratados de 1969",
    article: "Decreto nº 7.030/2009 Arts. 1º, 2º, 6º, 7º, 11, 14, 26, 27, 31 e 53",
    themeKeywords: [
      "convenção de viena sobre o direito dos tratados", "convenção de viena 1969", "direito dos tratados", 
      "pacta sunt servanda", "jus cogens", "interpretação de tratados", "reservas a tratados", 
      "ratificação", "adesão", "nulidade de tratados", "fontes do direito internacional público", 
      "direito internacional"
    ],
    literalText: `> **Convenção de Viena/1969 — Art. 2º (Termos Empregados).** Para os fins da presente Convenção:
> * **a)** "tratado" significa um acordo internacional concluído por escrito entre Estados e regido pelo Direito Internacional, quer conste de um instrumento único, quer de dois ou mais instrumentos conexos, e qualquer que seja sua denominação específica;
> * **b)** "ratificação", "aceitação", "aprovação" e "adesão" significam, conforme o caso, o ato internacional assim denominado pelo qual um Estado estabelece no plano internacional o seu consentimento em obrigar-se por um tratado;
> * **d)** "reserva" significa uma declaração unilateral, qualquer que seja a sua redação ou denominação, feita por um Estado ao assinar, ratificar, aceitar ou aprovar um tratado, ou a ele aderir, com o objetivo de excluir ou modificar o efeito jurídico de certas disposições do tratado em sua aplicação a esse Estado.
>
> **Convenção de Viena/1969 — Art. 6º.** Todo Estado tem capacidade para concluir tratados.
>
> **Convenção de Viena/1969 — Art. 26 (Pacta Sunt Servanda).** Todo tratado em vigor obriga as partes e deve ser cumprido por elas de boa-fé.
>
> **Convenção de Viena/1969 — Art. 27 (Direito Interno e Observância de Tratados).** Uma parte não pode invocar as disposições de seu direito interno para justificar o inadimplemento de um tratado. Esta regra não prejudica o artigo 46.
>
> **Convenção de Viena/1969 — Art. 31 (Regra Geral de Interpretação).** Um tratado deve ser interpretado de boa-fé segundo o sentido comum atribuível aos termos do tratado em seu contexto e à luz de seu objetivo e finalidade.
>
> **Convenção de Viena/1969 — Art. 53 (Tratados em Conflito com uma Norma Imperativa de Direito Internacional Geral - Jus Cogens).** É nulo um tratado que, no momento de sua conclusão, conflite com uma norma imperativa de Direito Internacional geral. Para os fins da presente Convenção, uma norma imperativa de Direito Internacional geral é uma norma aceita e reconhecida pela comunidade internacional dos Estados como um todo, como norma da qual nenhuma derrogação é permitida e que só pode ser modificada por norma ulterior de Direito Internacional geral da mesma natureza.`
  },
  {
    statute: "Estatuto da Corte Internacional de Justiça e Carta da ONU",
    article: "Estatuto da CIJ Art. 38 c/c Carta da ONU Arts. 1º e 2º",
    themeKeywords: [
      "fontes do direito internacional público", "fontes do direito internacional", "estatuto da cij", 
      "artigo 38", "costume internacional", "opinio juris", "princípios gerais de direito", 
      "personalidade jurídica internacional", "personalidade juridica internacional", "sujeitos de direito internacional", 
      "estados soberanos", "organizações internacionais", "imunidade de jurisdição", "imunidade de execução"
    ],
    literalText: `> **Estatuto da Corte Internacional de Justiça — Art. 38.** A Corte, cuja função é decidir de acordo com o direito internacional as controvérsias que lhe forem submetidas, aplicará:
> * **a)** as convenções internacionais, quer gerais, quer especiais, que estabeleçam regras expressamente reconhecidas pelos Estados litigantes;
> * **b)** o costume internacional, como prova de uma prática geral aceita como sendo o direito;
> * **c)** os princípios gerais de direito reconhecidos pelas nações civilizadas;
> * **d)** sob ressalva da disposição do Artigo 59, as decisões judiciais e as doutrinas dos publicistas mais qualificados das diferentes nações, como meio auxiliar para a determinação das regras de direito.
> * **§ 2º.** A presente disposição não prejudicará a faculdade da Corte de decidir uma questão ex aequo et bono, se as partes com isto concordarem.
>
> **Carta das Nações Unidas — Art. 2º.** A Organização e seus Membros, na prossecução dos fins enunciados no Artigo 1º, agirão em conformidade com os seguintes Princípios:
> * **1.** A Organização é baseada no princípio da igualdade soberana de todos os seus Membros.
> * **2.** Todos os Membros, a fim de assegurar para cada um deles os direitos e vantagens resultantes de sua qualidade de Membro, devem cumprir de boa-fé as obrigações por eles assumidas de conformidade com a presente Carta.
> * **3.** Todos os Membros devem resolver suas controvérsias internacionais por meios pacíficos, de modo que a paz e a segurança internacionais, bem como a justiça, não sejam ameaçadas.
> * **4.** Todos os Membros devem abster-se em suas relações internacionais da ameaça ou uso da força contra a integridade territorial ou a independência política de qualquer Estado.`
  },
  {
    statute: "Código Tributário Nacional e Acordos contra a Bitributação",
    article: "CTN Arts. 96, 98 e 100 c/c Modelo OCDE/ONU",
    themeKeywords: [
      "tratados internacionais em matéria tributária", "tratados internacionais em materia tributaria", 
      "art. 98 do ctn", "bitributação internacional", "dupla tributação internacional", "acordos de bitributação", 
      "método da isenção", "método do crédito", "estabelecimento permanente", "beneficiário efetivo", 
      "não discriminação", "procedimento amigável", "map", "tributação internacional"
    ],
    literalText: `> **CTN — Art. 96.** A expressão "legislação tributária" compreende as leis, os tratados e as convenções internacionais, os decretos e as normas complementares que versem, no todo ou em parte, sobre tributos e relações jurídicas a eles pertinentes.
>
> **CTN — Art. 98.** Os tratados e as convenções internacionais revogam ou modificam a legislação tributária interna, e serão observados pela que lhes sobrevenha.
>
> **CTN — Art. 100.** São normas complementares das leis, dos tratados e das convenções internacionais e dos decretos:
> * **I -** os atos normativos expedidos pelas autoridades administrativas;
> * **II -** as decisões dos órgãos singulares ou coletivos de jurisdição administrativa, a que a lei atribua eficácia normativa;
> * **III -** as práticas reiteradamente observadas pelas autoridades administrativas;
> * **IV -** os convênios que entre si celebrem a União, os Estados, o Distrito Federal e os Municípios.
>
> **Modelo de Convenção da OCDE sobre Dupla Tributação — Art. 7º (Lucros das Empresas).** Os lucros de uma empresa de um Estado Contratante só são tributáveis nesse Estado, a não ser que a empresa exerça a sua atividade no outro Estado Contratante por meio de um estabelecimento permanente aí situado. Se a empresa exercer a sua atividade da forma indicada, os lucros da empresa podem ser tributados no outro Estado, mas unicamente na medida em que forem imputáveis a esse estabelecimento permanente.
>
> **Modelo de Convenção da OCDE — Art. 23B (Método do Crédito).** Sempre que um residente de um Estado Contratante obtiver rendimentos ou possuir elementos patrimoniais que, de acordo com as disposições desta Convenção, possam ser tributados no outro Estado Contratante, o primeiro Estado deduzirá do imposto sobre os rendimentos desse residente uma importância igual ao imposto pago no outro Estado.`
  },
  {
    statute: "Lei nº 14.596/2023 e Ações do Projeto BEPS da OCDE/G20",
    article: "Lei nº 14.596/2023 Arts. 1º, 2º, 3º, 7º e 11 c/c IN RFB nº 2.161/2023",
    themeKeywords: [
      "plano de ação da ocde para o combate à erosão da base tributária e à transferência de lucros", 
      "plano de acao da ocde", "beps", "erosão da base tributária", "erosao da base tributaria", 
      "transferência de lucros", "transferencia de lucros", "preços de transferência", "precos de transferencia", 
      "lei nº 14.596/2023", "lei 14.596", "arm's length", "transações controladas", "partes relacionadas", 
      "safe harbours", "apa", "acordo prévio de preços"
    ],
    literalText: `> **Lei nº 14.596/2023 — Art. 1º.** Esta Lei dispõe sobre as regras de preços de transferência relativas ao Imposto sobre a Renda das Pessoas Jurídicas (IRPJ) e à Contribuição Social sobre o Lucro Líquido (CSLL).
>
> **Lei nº 14.596/2023 — Art. 2º (Princípio Arm's Length).** Para fins de determinação da base de cálculo dos tributos de que trata o art. 1º desta Lei, os termos e as condições de uma transação controlada serão estabelecidos em conformidade com aqueles que seriam estabelecidos entre partes não relacionadas em transações comparáveis.
>
> **Lei nº 14.596/2023 — Art. 3º.** Considera-se transação controlada qualquer relação comercial ou financeira entre duas ou mais partes relacionadas, realizada de forma direta ou indireta, inclusive contratos ou arranjos sob qualquer forma e série de transações.
>
> **Lei nº 14.596/2023 — Art. 11 (Métodos de Determinação de Preços de Transferência).** O método mais apropriado para determinar se os termos e as condições da transação controlada estão em conformidade com o princípio arm's length será selecionado entre os seguintes:
> * **I -** Método dos Preços Independentes Comparados (PIC);
> * **II -** Método do Preço de Revenda menos Lucro (PRL);
> * **III -** Método do Custo mais Lucro (MCL);
> * **IV -** Método da Margem Líquida da Transação (MLT);
> * **V -** Método da Divisão do Lucro (DRL); e
> * **VI -** outros métodos, desde que a metodologia alternativa resulte em determinação em conformidade com o princípio arm's length.
>
> **Ações Estruturantes do Projeto BEPS da OCDE/G20:**
> * **Ação 1:** Economia digital e desafios da tributação direta e indireta;
> * **Ação 2:** Neutralização dos efeitos de instrumentos híbridos e entidades desconsideradas;
> * **Ações 8 a 10:** Alinhamento dos preços de transferência à criação efetiva de valor (intangíveis, riscos e capital);
> * **Ação 13:** Documentação de preços de transferência e declaração País-a-País (Country-by-Country Reporting - CbCR);
> * **Ação 15:** Instrumento Multilateral para Modificação de Tratados Tributários Bilaterais (MLI).`
  },
  {
    statute: "Convenção Multilateral de Assistência Mútua e CPC/2015",
    article: "Decreto nº 8.842/2016 Arts. 1º a 7º c/c CPC Arts. 26 a 36 e CF Art. 105, I, 'i'",
    themeKeywords: [
      "cooperação jurídica internacional em matéria tributária", "cooperacao juridica internacional em materia tributaria", 
      "troca de informações tributárias", "troca automatica de informacoes", "troca a pedido", 
      "crs", "common reporting standard", "fatca", "decreto nº 8.842/2016", "decreto 8.842", 
      "assistência mútua administrativa", "assistencia mutua administrativa", "auxílio direto", "cartas rogatórias"
    ],
    literalText: `> **Convenção Multilateral sobre Assistência Mútua Administrativa em Matéria Tributária (Decreto nº 8.842/2016) — Art. 1º (Objetivo).** As Partes prestarão mutuamente assistência administrativa em matéria tributária. Essa assistência abrangerá, quando apropriado:
> * **a)** a troca de informações, incluindo exames fiscais simultâneos e participação em exames fiscais no exterior;
> * **b)** a assistência na cobrança de créditos tributários, incluindo medidas cautelares; e
> * **c)** a notificação de documentos.
>
> **Decreto nº 8.842/2016 — Art. 4º (Troca de Informações Geral).** As Partes trocarão qualquer informação previsivelmente relevante para a administração ou execução de suas legislações tributárias internas relativas aos tributos abrangidos por esta Convenção.
>
> **Decreto nº 8.842/2016 — Art. 6º (Troca Automática de Informações).** Com respeito às categorias de casos e de acordo com os procedimentos determinados de comum acordo, duas ou mais Partes trocarão automaticamente as informações referidas no Artigo 4º.
>
> **CPC/2015 — Art. 26.** A cooperação jurídica internacional terá por diretriz:
> * **I -** o respeito aos direitos fundamentais e às garantias do devido processo legal no Estado requerente;
> * **II -** a igualdade de tratamento entre nacionais e estrangeiros, residentes ou não no Brasil, em relação ao acesso à justiça e à tramitação dos processos;
> * **III -** a publicidade processual, exceto nas hipóteses de segredo de justiça;
> * **IV -** a existência de reciprocidade, manifestada por via diplomática ou por tratado;
> * **V -** a espontaneidade na transmissão de informações a autoridades estrangeiras.
>
> **CPC/2015 — Art. 28.** Cabe auxílio direto quando a medida não decorrer diretamente de decisão de autoridade jurisdicional estrangeira a ser submetida a juízo de delibação no Superior Tribunal de Justiça.
>
> **CPC/2015 — Art. 30.** A autoridade central federal é responsável pela recepção e transmissão dos pedidos de cooperação jurídica internacional, ressalvada a via diplomática ou direta estabelecida em tratado.`
  },
  // =========================================================================
  // FASE 2.1: DIREITO AMBIENTAL E DIREITO ELEITORAL (CARREIRA AU)
  // =========================================================================
  {
    statute: "Constituição Federal de 1988 — Meio Ambiente",
    article: "CF/88 Art. 225 c/c Arts. 23, VI e VII, e 24, VI, VII e VIII",
    themeKeywords: [
      "direito ambiental", "a constituição federal e o meio ambiente", "a constituicao federal e o meio ambiente",
      "princípios do direito ambiental", "principios do direito ambiental", "repartição de competências em matéria ambiental",
      "reparticao de competencias em materia ambiental", "competência comum ambiental", "competência concorrente ambiental",
      "art. 225 da cf", "meio ambiente", "poluidor pagador", "precaução", "prevenção"
    ],
    literalText: `> **CF/88 — Art. 225.** Todos têm direito ao meio ambiente ecologicamente equilibrado, bem de uso comum do povo e essencial à sadia qualidade de vida, impondo-se ao Poder Público e à coletividade o dever de defendê-lo e preservá-lo para as presentes e futuras gerações.
> * **§ 1º.** Para assegurar a efetividade desse direito, incumbe ao Poder Público:
>   * **I -** preservar e restaurar os processos ecológicos essenciais e prover o manejo ecológico das espécies e ecossistemas;
>   * **II -** preservar a diversidade e a integridade do patrimônio genético do País e fiscalizar as entidades dedicadas à pesquisa e manipulação de material genético;
>   * **III -** definir, em todas as unidades da Federação, espaços territoriais e seus componentes a serem especialmente protegidos, sendo a alteração e a supressão permitidas somente através de lei, vedada qualquer utilização que comprometa a integridade dos atributos que justifiquem sua proteção;
>   * **IV -** exigir, na forma da lei, para instalação de obra ou atividade potencialmente causadora de significativa degradação do meio ambiente, estudo prévio de impacto ambiental, a que se dará publicidade;
>   * **V -** controlar a produção, a comercialização e o emprego de técnicas, métodos e substâncias que comportem risco para a vida, a qualidade de vida e o meio ambiente;
>   * **VI -** promover a educação ambiental em todos os níveis de ensino e a conscientização pública para a preservação do meio ambiente;
>   * **VII -** proteger a fauna e a flora, vedadas, na forma da lei, as práticas que coloquem em risco sua função ecológica, provoquem a extinção de espécies ou submetam os animais a crueldade.
> * **§ 2º.** Aquele que explorar recursos minerais fica obrigado a recuperar o meio ambiente degradado, de acordo com solução técnica exigida pelo órgão público competente, na forma da lei.
> * **§ 3º.** As condutas e atividades consideradas lesivas ao meio ambiente sujeitarão os infratores, pessoas físicas ou jurídicas, a sanções penais e administrativas, independentemente da obrigação de reparar os danos causados.`
  },
  {
    statute: "Política Nacional do Meio Ambiente e SNUC",
    article: "Lei nº 6.938/1981 Arts. 2º a 14 c/c Lei nº 9.985/2000 Arts. 1º a 9º",
    themeKeywords: [
      "política nacional do meio ambiente", "politica nacional do meio ambiente", "sistema nacional do meio ambiente", 
      "sisnama", "licenciamento ambiental", "estudo de impacto ambiental e relatório de impacto ambiental", 
      "eia/rima", "espaços territoriais especialmente protegidos", "sistema nacional de unidades de conservação", 
      "snuc", "responsabilidade civil, administrativa e penal em matéria ambiental"
    ],
    literalText: `> **Lei nº 6.938/1981 — Art. 2º.** A Política Nacional do Meio Ambiente tem por objetivo a preservação, melhoria e recuperação da qualidade ambiental propícia à vida, visando a assegurar, no País, condições ao desenvolvimento sócio-econômico, aos interesses da segurança nacional e à proteção da dignidade da vida humana.
>
> **Lei nº 6.938/1981 — Art. 9º.** São instrumentos da Política Nacional do Meio Ambiente:
> * **I -** o estabelecimento de padrões de qualidade ambiental;
> * **II -** o zoneamento ambiental;
> * **III -** a avaliação de impactos ambientais;
> * **IV -** o licenciamento e a revisão de atividades efetiva ou potencialmente poluidoras;
> * **V -** os incentivos à produção e instalação de equipamentos e a criação ou absorção de tecnologia, voltados para a melhoria da qualidade ambiental;
> * **VI -** a criação de espaços territoriais especialmente protegidos pelo Poder Público federal, estadual e municipal.
>
> **Lei nº 6.938/1981 — Art. 14, § 1º.** Sem obstar a aplicação das penalidades previstas neste artigo, é o poluidor obrigado, independentemente da existência de culpa, a indenizar ou reparar os danos causados ao meio ambiente e a terceiros, afetados por sua atividade.
>
> **Lei nº 9.985/2000 — Art. 7º.** As unidades de conservação integrantes do SNUC dividem-se em dois grupos:
> * **I -** Unidades de Proteção Integral (Estação Ecológica, Reserva Biológica, Parque Nacional, Monumento Natural e Refúgio de Vida Silvestre);
> * **II -** Unidades de Uso Sustentável (Área de Proteção Ambiental, Área de Relevante Interesse Ecológico, Floresta Nacional, Reserva Extrativista, Reserva de Fauna, Reserva de Desenvolvimento Sustentável e RPPN).`
  },
  {
    statute: "Código Florestal e Áreas Protegidas",
    article: "Lei nº 12.651/2012 Arts. 3º, 4º, 12 e 29",
    themeKeywords: [
      "código florestal", "codigo florestal", "área de preservação permanente", "area de preservacao permanente", 
      "app", "reserva legal", "cadastro ambiental rural", "car", "supressão de vegetação", "espaços protegidos"
    ],
    literalText: `> **Lei nº 12.651/2012 — Art. 3º.** Para os efeitos desta Lei, entende-se por:
> * **II -** Área de Preservação Permanente - APP: área protegida, coberta ou não por vegetação nativa, com a função ambiental de preservar os recursos hídricos, a paisagem, a estabilidade geológica e a biodiversidade, facilitar o fluxo gênico de fauna e flora, proteger o solo e assegurar o bem-estar das populações humanas;
> * **III -** Reserva Legal: área localizada no interior de uma propriedade ou posse rural, delimitada nos termos do art. 12, com a função de assegurar o uso econômico de modo sustentável dos recursos naturais do imóvel rural, auxiliar a conservação e a reabilitação dos processos ecológicos e promover a conservação da biodiversidade.
>
> **Lei nº 12.651/2012 — Art. 12.** Todo imóvel rural deve manter área com cobertura de vegetação nativa, a título de Reserva Legal, sem prejuízo da aplicação das normas sobre as Áreas de Preservação Permanente, observados os seguintes percentuais mínimos:
> * **I -** localizado na Amazônia Legal: a) 80% no imóvel situado em área de florestas; b) 35% no imóvel situado em área de cerrado; c) 20% no imóvel situado em área de campos gerais;
> * **II -** localizado nas demais regiões do País: 20%.
>
> **Lei nº 12.651/2012 — Art. 29.** É criado o Cadastro Ambiental Rural - CAR, no âmbito do Sistema Nacional de Informação sobre Meio Ambiente - SINIMA, registro público eletrônico de âmbito nacional, obrigatório para todos os imóveis rurais, com a finalidade de integrar as informações ambientais das propriedades e posses rurais.`
  },
  {
    statute: "Direito Eleitoral — Direitos Políticos, Condutas Vedadas e Propaganda",
    article: "CF Arts. 14 a 17 c/c Lei nº 9.504/1997 Arts. 36 a 41-A e 73 a 78",
    themeKeywords: [
      "direito eleitoral", "propaganda eleitoral", "propaganda na imprensa escrita", 
      "condutas vedadas aos agentes públicos federais em eleições", "condutas vedadas", 
      "lei 9.504", "art. 73", "abuso de poder político", "inelegibilidades", "desincompatibilização", 
      "recursos eleitorais"
    ],
    literalText: `> **CF/88 — Art. 14.** A soberania popular será exercida pelo sufrágio universal e pelo voto direto e secreto, com valor igual para todos, e, nos termos da lei, mediante: plebiscito, referendo e iniciativa popular.
> * **§ 3º.** São condições de elegibilidade, na forma da lei: a nacionalidade brasileira; o pleno exercício dos direitos políticos; o alistamento eleitoral; o domicílio eleitoral na circunscrição; a filiação partidária; a idade mínima de 35 anos para Presidente, Vice-Presidente e Senador; 30 anos para Governador e Vice-Governador; 21 anos para Deputado Federal, Estadual ou Distrital, Prefeito, Vice-Prefeito e Juiz de Paz; e 18 anos para Vereador.
> * **§ 4º.** São inelegíveis os inalistáveis e os analfabetos.
> * **§ 7º.** São inelegíveis, no território de jurisdição do titular, o cônjuge e os parentes consangüíneos ou afins, até o segundo grau ou por adoção, do Presidente da República, de Governador de Estado ou Território, do Distrito Federal, de Prefeito ou de quem os haja substituído dentro dos seis meses anteriores ao pleito, salvo se já titular de mandato eletivo e candidato à reeleição.
>
> **Lei nº 9.504/1997 — Art. 36.** A propaganda eleitoral somente é permitida após o dia 15 de agosto do ano da eleição.
>
> **Lei nº 9.504/1997 — Art. 43.** Na imprensa escrita, são permitidas, até a antevéspera das eleições, a divulgação paga, e a reprodução na internet do jornal impresso, de até 10 (dez) anúncios de propaganda eleitoral, por veículo, em datas diversas, para cada candidato, no espaço máximo, por edição, de 1/8 (um oitavo) de página de jornal padrão e de 1/4 (um quarto) de página de revista ou tablóide.
>
> **Lei nº 9.504/1997 — Art. 73.** São proibidas aos agentes públicos, servidores ou não, as seguintes condutas tendentes a afetar a igualdade de oportunidades entre candidatos nos pleitos eleitorais:
> * **I -** ceder ou usar, em benefício de candidato, partido político ou coligação, bens móveis ou imóveis pertencentes à administração direta ou indireta da União, dos Estados, do Distrito Federal e dos Municípios;
> * **II -** usar materiais ou serviços, custeados pelos Governos ou Casas Legislativas, que excedam as prerrogativas consignadas nos regimentos e normas dos órgãos que integram;
> * **III -** ceder servidor público ou empregado da administração, ou usar de seus serviços, para comitês de campanha eleitoral de candidato, partido ou coligação, durante o horário de expediente normal;
> * **IV -** fazer ou permitir uso promocional em favor de candidato, partido político ou coligação, de distribuição gratuita de bens e serviços de caráter social custeados ou subvencionados pelo Poder Público;
> * **V -** nomear, contratar ou de qualquer forma admitir, demitir sem justa causa, suprimir ou readaptar vantagens nos três meses que antecedem o pleito até a posse dos eleitos;
> * **VI -** nos três meses que antecedem o pleito: b) com exceção da propaganda de produtos e serviços que tenham concorrência no mercado, autorizar publicidade institucional dos atos, programas, obras, serviços e campanhas dos órgãos públicos.`
  },
  {
    statute: "Lei de Inelegibilidades e Desincompatibilização",
    article: "Lei Complementar nº 64/1990 Arts. 1º a 3º c/c LC nº 135/2010",
    themeKeywords: [
      "inelegibilidades", "lei de inelegibilidades", "lc 64/1990", "lc 64", "lei da ficha limpa", 
      "lc 135/2010", "desincompatibilização", "desincompatibilizacao", "prazos de desincompatibilização", 
      "recursos eleitorais", "registro de candidatura", "airc", "aije"
    ],
    literalText: `> **LC nº 64/1990 — Art. 1º.** São inelegíveis:
> * **I -** para qualquer cargo:
>   * **e)** os que forem condenados, em decisão transitada em julgado ou proferida por órgão judicial colegiado, desde a condenação até o transcurso do prazo de 8 (oito) anos após o cumprimento da pena, pelos crimes: contra a economia popular, a fé pública, a administração pública e o patrimônio público; contra o patrimônio privado, o sistema financeiro, o mercado de capitais e os previstos na lei que regula a falência; e contra o meio ambiente e a saúde pública;
>   * **g)** os que tiverem suas contas relativas ao exercício de cargos ou funções públicas rejeitadas por irregularidade insanável que configure ato doloso de improbidade administrativa, e por decisão irrecorrível do órgão competente, salvo se esta houver sido suspensa ou anulada pelo Poder Judiciário, para as eleições que se realizarem nos 8 (oito) anos seguintes, contados a partir da data da decisão;
>   * **l)** os que forem condenados à suspensão dos direitos políticos, em decisão transitada em julgado ou proferida por órgão judicial colegiado, por ato doloso de improbidade administrativa que importe lesão ao patrimônio público e enriquecimento ilícito, desde a condenação ou o trânsito em julgado até o transcurso do prazo de 8 (oito) anos após o cumprimento da pena.
>
> **LC nº 64/1990 — Art. 1º, II a VII (Prazos Principais de Desincompatibilização):**
> * **6 (seis) meses antes do pleito:** Ministros de Estado, Secretários de Estado e Municipais, Chefes da Casa Civil, dirigentes máximos de autarquias, fundações públicas e empresas estatais;
> * **4 (quatro) meses antes do pleito:** Magistrados e membros do Ministério Público (quando a lei permitir filiação sem renúncia definitiva);
> * **3 (três) meses antes do pleito:** Servidores públicos estatutários ou celetistas em geral que pretendam concorrer a mandato eletivo municipal ou geral (com direito à percepção da remuneração integral durante a licença remuneratória para atividade política).`
  },
// DIREITO FINANCEIRO: COMPETÊNCIA, NORMAS GERAIS E LEI 4.320/1964
  // =========================================================================
  {
    statute: "Constituição Federal de 1988 e Lei nº 4.320/1964",
    article: "CF Arts. 24, I e II, 163 c/c Lei nº 4.320/1964 Arts. 2º a 8º",
    themeKeywords: [
      "direito financeiro: conceito e objeto", "conceito e objeto", "atividade financeira do estado", 
      "fontes do direito financeiro", "princípios do direito financeiro", "legalidade", "principio da legalidade",
      "direito financeiro", "normas gerais de direito financeiro", "unidade orçamentária", "universalidade", 
      "anualidade", "reserva de lei", "gestão fiscal"
    ],
    literalText: `> **CF/88 — Art. 24.** Compete à União, aos Estados e ao Distrito Federal legislar concorrentemente sobre:
> * **I -** direito tributário, financeiro, penitenciário, econômico e urbanístico;
> * **II -** orçamento;
> * **§ 1º** No âmbito da legislação concorrente, a competência da União limitar-se-á a estabelecer normas gerais.
> * **§ 2º** A competência da União para legislar sobre normas gerais não exclui a competência suplementar dos Estados.
> * **§ 3º** Inexistindo lei federal sobre normas gerais, os Estados exercerão a competência legislativa plena, para atender a suas peculiaridades.
> * **§ 4º** A superveniência de lei federal sobre normas gerais suspende a eficácia da lei estadual, no que lhe for contrário.
>
> **CF/88 — Art. 163.** Lei complementar disporá sobre:
> * **I -** finanças públicas;
> * **II -** dívida pública externa e interna, compreendida a das autarquias, fundações e demais entidades controladas pelo Poder Público;
> * **III -** concessão de garantias pelas entidades de direito público;
> * **IV -** emissão e resgate de títulos da dívida pública;
> * **V -** fiscalização financeira da administração pública direta e indireta;
> * **VI -** operações de câmbio realizadas por órgãos e entidades da União, dos Estados, do Distrito Federal e dos Municípios;
> * **VII -** compatibilização das funções das instituições financeiras oficiais da União, resguardadas as características e condições operacionais plenas das voltadas ao desenvolvimento regional;
> * **VIII -** sustentabilidade da dívida pública.
>
> **Lei nº 4.320/1964 — Art. 2º.** A Lei do Orçamento conterá a discriminação da receita e despesa de forma a evidenciar a política econômica financeira e o programa de trabalho do Governo, obedecidos os princípios de unidade, universalidade e anualidade.
>
> **Lei nº 4.320/1964 — Art. 6º.** Todas as receitas e despesas constarão da Lei de Orçamento pelos seus totais, vedadas quaisquer deduções.`
  },

  // =========================================================================
  // DIREITO FINANCEIRO: ORÇAMENTO PÚBLICO (PPA, LDO, LOA E CRÉDITOS ADICIONAIS)
  // =========================================================================
  {
    statute: "Constituição Federal de 1988",
    article: "CF Arts. 165 a 168",
    themeKeywords: [
      "orçamento público: conceito e natureza jurídica", "orcamento publico: conceito e natureza juridica", 
      "orçamento público", "orcamento publico", "leis orçamentárias", "ppa", "ldo", "loa", 
      "plano plurianual", "diretrizes orcamentarias", "orcamentaria anual", "créditos adicionais", 
      "credito suplementar", "credito especial", "credito extraordinario", "princípios orçamentários", 
      "universalidade", "exclusividade", "anualidade", "não afetação", "emendas impositivas"
    ],
    literalText: `> **CF/88 — Art. 165.** Leis de iniciativa do Poder Executivo estabelecerão:
> * **I -** o plano plurianual;
> * **II -** as diretrizes orçamentárias;
> * **III -** os orçamentos anuais.
> * **§ 1º** A lei que instituir o plano plurianual estabelecerá, de forma regionalizada, as diretrizes, objetivos e metas da administração pública federal para as despesas de capital e outras delas decorrentes e para as relativas aos programas de duração continuada.
> * **§ 2º** A lei de diretrizes orçamentárias compreenderá as metas e prioridades da administração pública federal, estabelecerá as diretrizes de política fiscal e respectivas metas, em conformidade com trajetória sustentável da dívida pública, orientará a elaboração da lei orçamentária anual, disporá sobre as alterações na legislação tributária e estabelecerá a política de aplicação das agências financeiras oficiais de fomento.
> * **§ 5º** A lei orçamentária anual compreenderá:
>   * **I -** o orçamento fiscal referente aos Poderes da União, seus fundos, órgãos e entidades da administração direta e indireta, inclusive fundações instituídas e mantidas pelo Poder Público;
>   * **II -** o orçamento de investimento das empresas em que a União, direta ou indiretamente, detenha a maioria do capital social com direito a voto;
>   * **III -** o orçamento da seguridade social, abrangendo todas as entidades e órgãos a ela vinculados, da administração direta ou indireta, bem como os fundos e fundações instituídos e mantidos pelo Poder Público.
> * **§ 8º** A lei orçamentária anual não conterá dispositivo estranho à previsão da receita e à fixação da despesa, não se incluindo na proibição a autorização para abertura de créditos suplementares e contratação de operações de crédito, ainda que por antecipação de receita, nos termos da lei.
>
> **CF/88 — Art. 167.** São vedados:
> * **I -** o início de programas ou projetos não incluídos na lei orçamentária anual;
> * **II -** a realização de despesas ou a assunção de obrigações diretas que excedam os créditos orçamentários ou adicionais;
> * **III -** a realização de operações de créditos que excedam o montante das despesas de capital, ressalvadas as autorizadas mediante créditos suplementares ou especiais com finalidade precisa, aprovados pelo Poder Legislativo por maioria absoluta;
> * **IV -** a vinculação de receita de impostos a órgão, fundo ou despesa, ressalvadas a repartição do produto da arrecadação dos impostos a que se referem os arts. 158 e 159, a destinação de recursos para as ações e serviços públicos de saúde, para manutenção e desenvolvimento do ensino e para realização de atividades da administração tributária;
> * **§ 3º** A abertura de crédito extraordinário somente será admitida para atender a despesas imprevisíveis e urgentes, como as decorrentes de guerra, comoção interna ou calamidade pública, observado o disposto no art. 62.`
  },

  // =========================================================================
  // DIREITO FINANCEIRO: RECEITA PÚBLICA E RENÚNCIA DE RECEITA (LRF ART. 14)
  // =========================================================================
  {
    statute: "Lei Complementar nº 101/2000 (LRF)",
    article: "LRF Arts. 11 a 14",
    themeKeywords: [
      "receita pública: conceito, classificações", "receita publica: conceito, classificacoes", 
      "receita pública", "receita publica", "previsão da receita", "arrecadação da receita", 
      "recolhimento da receita", "renúncia de receita", "renuncia de receita", "artigo 14 da lrf", 
      "benefício fiscal", "beneficio fiscal", "estimativa de impacto trienal", "medidas de compensação"
    ],
    literalText: `> **LRF — Art. 11.** Constituem requisitos essenciais da responsabilidade na gestão fiscal a instituição, previsão e efetiva arrecadação de todos os tributos da competência constitucional do ente da Federação.
> * **Parágrafo único.** É vedada a realização de transferências voluntárias para o ente que não instituir, prever e arrecadar os impostos de sua competência.
>
> **LRF — Art. 14.** A concessão ou ampliação de incentivo ou benefício de natureza tributária da qual decorra renúncia de receita deverá estar acompanhada de estimativa do impacto orçamentário-financeiro no exercício em que deva iniciar sua vigência e nos dois seguintes, atender ao disposto na lei de diretrizes orçamentárias e a pelo menos uma das seguintes condições:
> * **I -** demonstração pelo proponente de que a renúncia foi considerada na estimativa de receita da lei orçamentária, na forma do art. 12, e de que não afetará as metas de resultados fiscais previstas no anexo próprio da lei de diretrizes orçamentárias;
> * **II -** estar acompanhada de medidas de compensação, no período mencionado no caput, por meio do aumento de receita, proveniente da elevação de alíquotas, ampliação da base de cálculo, majoração ou criação de tributo ou contribuição.
> * **§ 1º** A renúncia compreende anistia, remissão, subsídio, crédito presumido, concessão de isenção em caráter não geral, alteração de alíquota ou modificação de base de cálculo que implique redução discriminada de tributos ou contribuições, e outros benefícios que correspondam a tratamento diferenciado.
> * **§ 2º** Se o ato de concessão ou ampliação do incentivo ou benefício decorrer da condição estabelecida no inciso II deste artigo, o benefício só entrará em vigor quando implementadas as medidas referidas no mencionado inciso.
> * **§ 3º** O disposto neste artigo não se aplica:
>   * **I -** às alterações das alíquotas dos impostos previstos nos incisos I, II, IV e V do art. 153 da Constituição, na forma do seu § 1º;
>   * **II -** ao cancelamento de débito cujo montante seja inferior ao dos respectivos custos de cobrança.`
  },

  // =========================================================================
  // DIREITO FINANCEIRO: DESPESA PÚBLICA, DOCC E LIMITES DE PESSOAL (LRF)
  // =========================================================================
  {
    statute: "Lei Complementar nº 101/2000 (LRF)",
    article: "LRF Arts. 15 a 23 c/c Lei nº 4.320/1964 Arts. 58 a 64",
    themeKeywords: [
      "despesa pública: conceito, classificações", "despesa publica: conceito, classificacoes", 
      "despesa pública", "despesa publica", "docc", "despesa obrigatória de caráter continuado", 
      "artigo 17 da lrf", "empenho da despesa", "liquidação da despesa", "limites de despesa com pessoal", 
      "limites de pessoal", "artigo 19 da lrf", "artigo 20 da lrf", "limite prudencial", 
      "artigo 22 da lrf", "artigo 23 da lrf", "receita corrente líquida", "rcl"
    ],
    literalText: `> **LRF — Art. 17.** Considera-se obrigatória de caráter continuado a despesa corrente derivada de lei, medida provisória ou ato administrativo normativo que fixem para o ente a obrigação legal de sua execução por um período superior a dois exercícios.
> * **§ 1º** Os atos que criarem ou aumentarem despesa de que trata o caput deverão ser instruídos com a estimativa do impacto orçamentário-financeiro no exercício em que deva entrar em vigor e nos dois subseqüentes e demonstrar a origem dos recursos para seu custeio.
> * **§ 2º** Para efeito do atendimento do § 1º, o ato será acompanhado de comprovação de que a despesa criada ou aumentada não afetará as metas de resultados fiscais, devendo seus efeitos financeiros, nos períodos seguintes, ser compensados pelo aumento permanente de receita ou pela redução permanente de despesa.
>
> **LRF — Art. 19.** Para os fins do disposto no caput do art. 169 da Constituição, a despesa total com pessoal, em cada período de apuração e em cada ente da Federação, não poderá exceder os percentuais da receita corrente líquida, a seguir discriminados:
> * **I -** União: 50%;
> * **II -** Estados: 60%;
> * **III -** Municípios: 60%.
>
> **LRF — Art. 22. Parágrafo único.** Se a despesa total com pessoal exceder a 95% do limite, são vedados ao Poder ou órgão que houver incorrido no excesso:
> * **I -** concessão de vantagem, aumento, reajuste ou adequação de remuneração a qualquer título;
> * **IV -** provimento de cargo público, admissão ou contratação de pessoal a qualquer título, ressalvada a reposição decorrente de aposentadoria ou falecimento de servidores das áreas de educação, saúde e segurança.
>
> **LRF — Art. 23.** Se a despesa total com pessoal, do Poder ou órgão referido no art. 20, ultrapassar os limites definidos no mesmo artigo, sem prejuízo das medidas previstas no art. 22, o excesso deverá ser eliminado nos dois quadrimestres seguintes, sendo pelo menos um terço no primeiro.`
  },

  // =========================================================================
  // DIREITO FINANCEIRO: NOVO REGIME FISCAL, REGRA DE OURO E ARCABOUÇO FISCAL
  // =========================================================================
  {
    statute: "Constituição Federal de 1988 e Lei Complementar nº 200/2023",
    article: "CF Art. 167, III c/c LC nº 200/2023 Arts. 1º a 6º",
    themeKeywords: [
      "novo regime fiscal", "teto de gastos", "orçamento de guerra", "orcamento de guerra", 
      "arcabouço fiscal", "arcabouco fiscal", "lei complementar 200/2023", "lc 200", 
      "regra de ouro", "artigo 167, iii", "operações de crédito", "despesas de capital", 
      "limite de crescimento de despesas", "resultado primário"
    ],
    literalText: `> **CF/88 — Art. 167.** São vedados:
> * **III -** a realização de operações de créditos que excedam o montante das despesas de capital, ressalvadas as autorizadas mediante créditos suplementares ou especiais com finalidade precisa, aprovados pelo Poder Legislativo por maioria absoluta;
>
> **LC nº 200/2023 — Art. 1º.** Esta Lei Complementar estabelece, com base no art. 163-A da Constituição Federal, o regime fiscal sustentável para garantir a estabilidade macroeconômica da União e criar as condições adequadas ao crescimento socioeconômico.
>
> **LC nº 200/2023 — Art. 3º.** O limite para a despesa primária do Poder Executivo em cada exercício corresponderá ao valor do limite do exercício anterior, corrigido pela variação acumulada do Índice Nacional de Preços ao Consumidor Amplo (IPCA), acrescido de aplicação de percentual de crescimento real.
> * **§ 1º** O percentual de crescimento real da despesa primária não será inferior a 0,6% nem superior a 2,5% ao ano.
> * **§ 2º** Observado o intervalo do § 1º, o crescimento real da despesa primária equivalerá a:
>   * **I -** 70% do crescimento real da receita primária realizada nos 12 meses anteriores, se a meta de resultado primário fixada na LDO for integralmente cumprida;
>   * **II -** 50% do crescimento real da receita primária, caso a meta de resultado primário fixada na LDO não seja alcançada.`
  },

  // =========================================================================
  // DIREITO FINANCEIRO: PRECATÓRIOS JUDICIAIS E RPV (CF ART. 100)
  // =========================================================================
  {
    statute: "Constituição Federal de 1988",
    article: "CF Art. 100 e ADCT Art. 101",
    themeKeywords: [
      "dívida pública: conceito, natureza jurídica e espécies", "divida publica: conceito, natureza juridica e especies", 
      "precatórios", "precatório", "precatorios", "artigo 100", "créditos alimentares", 
      "superpreferência", "rpv", "requisição de pequeno valor", "ordem cronológica", 
      "prazo de 2 de abril", "pagamento de precatórios", "juros de mora", "súmula vinculante 17"
    ],
    literalText: `> **CF/88 — Art. 100.** Os pagamentos devidos pelas Fazendas Públicas Federal, Estaduais, Distrital e Municipais, em virtude de sentença judiciária, far-se-ão exclusivamente na ordem cronológica de apresentação dos precatórios e à conta dos créditos respectivos, proibida a designação de casos ou de pessoas nas dotações orçamentárias e nos créditos adicionais abertos para este fim.
> * **§ 1º** Os débitos de natureza alimentícia compreendem aqueles decorrentes de salários, vencimentos, proventos, pensões e suas complementações, benefícios previdenciários e indenizações por morte ou por invalidez.
> * **§ 2º** Os débitos de natureza alimentícia cujos titulares, originários ou por sucessão hereditária, tenham 60 anos de idade, ou sejam portadores de doença grave, ou pessoas com deficiência, serão pagos com preferência sobre todos os demais débitos, até o valor equivalente ao triplo do fixado em lei para as requisições de pequeno valor (RPV), admitido o fracionamento para essa finalidade.
> * **§ 3º** O disposto no caput deste artigo relativamente à expedição de precatórios não se aplica aos pagamentos de obrigações definidas em leis como de pequeno valor.
> * **§ 5º** É obrigatória a inclusão, no orçamento das entidades de direito público, de verba necessária ao pagamento de seus débitos, constantes de precatórios judiciários apresentados até 2 de abril, fazendo-se o pagamento até o final do exercício seguinte.
> * **§ 12.** A partir da promulgação da Emenda Constitucional nº 113/2021, nas discussões e nas condenações que envolvam a Fazenda Pública, para fins de atualização monetária, remuneração do capital e compensação da mora, haverá a incidência, uma única vez, até o efetivo pagamento, do índice da taxa referencial do Sistema Especial de Liquidação e de Custódia (SELIC), acumulado mensalmente.`
  },

  // =========================================================================
  // DIREITO FINANCEIRO: DÍVIDA PÚBLICA, OPERAÇÕES DE CRÉDITO E RESTOS A PAGAR
  // =========================================================================
  {
    statute: "Lei Complementar nº 101/2000 e Lei nº 4.320/1964",
    article: "LRF Arts. 29 a 42 c/c Lei nº 4.320/1964 Art. 36",
    themeKeywords: [
      "dívida pública: conceito, natureza jurídica e espécies", "divida publica: conceito, natureza juridica e especies", 
      "dívida pública", "divida publica", "dívida consolidada", "dívida flutuante", 
      "operações de crédito", "aro", "antecipação de receita orçamentária", "restos a pagar", 
      "artigo 42 da lrf", "disponibilidade de caixa", "últimos 8 meses de mandato"
    ],
    literalText: `> **LRF — Art. 29.** Para os efeitos desta Lei Complementar, são adotadas as seguintes definições:
> * **I -** dívida pública consolidada ou fundada: montante total, apurado sem duplicidade, das obrigações financeiras assumidas em virtude de leis, contratos, convênios ou tratados e da realização de operações de crédito, para amortização em prazo superior a doze meses;
> * **II -** dívida pública mobiliária: dívida pública representada por títulos emitidos pela União, inclusive os do Banco Central do Brasil, Estados e Municípios;
> * **III -** operação de crédito: compromisso financeiro assumido em razão de mútuo, abertura de crédito, emissão e colocação de títulos, aquisição financiada de bens, recebimento antecipado de valores provenientes da venda a termo de bens e serviços.
>
> **LRF — Art. 38.** A operação de crédito por antecipação de receita destina-se a atender insuficiência de caixa durante o exercício financeiro e cumprirá as seguintes exigências:
> * **I -** realizar-se-á somente a partir do décimo dia do início do exercício;
> * **II -** deverá ser liquidada, com juros e outros encargos incidentes, até o dia 10 de dezembro de cada ano;
> * **IV -** estará proibida no último ano de mandato do Presidente, Governador ou Prefeito Municipal.
>
> **LRF — Art. 42.** É vedado ao titular de Poder ou órgão referido no art. 20, nos últimos dois quadrimestres do seu mandato, contrair obrigação de despesa que não possa ser integralmente cumprida dentro dele, ou que tenha parcelas a serem pagas no exercício seguinte sem que haja suficiente disponibilidade de caixa para este efeito.
>
> **Lei nº 4.320/1964 — Art. 36.** Consideram-se Restos a Pagar as despesas empenhadas mas não pagas até o dia 31 de dezembro distinguindo-se as processadas das não processadas.`
  },

  // =========================================================================
  // DIREITO ECONÔMICO: ORDEM ECONÔMICA CONSTITUCIONAL (CF ARTS. 170 A 174)
  // =========================================================================
  {
    statute: "Constituição Federal de 1988",
    article: "CF Arts. 170 a 174",
    themeKeywords: [
      "direito econômico: objeto", "direito economico: objeto", "ordem econômica constitucional", 
      "ordem economica constitucional", "intervenção do estado na economia", "intervencao do estado na economia", 
      "artigo 170", "livre iniciativa", "valorização do trabalho humano", "propriedade privada", 
      "função social da propriedade", "livre concorrência", "defesa do consumidor", 
      "defesa do meio ambiente", "redução das desigualdades regionais", "intervenção indireta", 
      "artigo 173", "artigo 174", "agente normativo e regulador", "planejamento econômico", 
      "capital estrangeiro", "direito economico internacional"
    ],
    literalText: `> **CF/88 — Art. 170.** A ordem econômica, fundada na valorização do trabalho humano e na livre iniciativa, tem por fim assegurar a todos existência digna, conforme os ditames da justiça social, observados os seguintes princípios:
> * **I -** soberania nacional;
> * **II -** propriedade privada;
> * **III -** função social da propriedade;
> * **IV -** livre concorrência;
> * **V -** defesa do consumidor;
> * **VI -** defesa do meio ambiente, inclusive mediante tratamento diferenciado conforme o impacto ambiental dos produtos e serviços e de seus processos de elaboração e prestação;
> * **VII -** redução das desigualdades regionais e sociais;
> * **VIII -** busca do pleno emprego;
> * **IX -** tratamento favorecido para as empresas de pequeno porte constituídas sob as leis brasileiras e que tenham sua sede e administração no País.
> * **Parágrafo único.** É assegurado a todos o livre exercício de qualquer atividade econômica, independentemente de autorização de órgãos públicos, salvo nos casos previstos em lei.
>
> **CF/88 — Art. 173.** Ressalvados os casos previstos nesta Constituição, a exploração direta de atividade econômica pelo Estado só será permitida quando necessária aos imperativos da segurança nacional ou a relevante interesse coletivo, conforme definidos em lei.
> * **§ 1º** A lei estabelecerá o estatuto jurídico da empresa pública, da sociedade de economia mista e de suas subsidiárias que explorem atividade econômica de produção ou comercialização de bens ou de prestação de serviços, dispondo sobre:
>   * **II -** a sujeição ao regime jurídico próprio das empresas privadas, inclusive quanto aos direitos e obrigações civis, comerciais, trabalhistas e tributários;
> * **§ 2º** As empresas públicas e as sociedades de economia mista não poderão gozar de privilégios fiscais não extensivos às do setor privado.
>
> **CF/88 — Art. 174.** Como agente normativo e regulador da atividade econômica, o Estado exercerá, na forma da lei, as funções de fiscalização, incentivo e planejamento, sendo este determinante para o setor público e indicativo para o setor privado.`
  },

  // =========================================================================
  // DIREITO ECONÔMICO: MONOPÓLIO DA UNIÃO E LEI DAS ESTATAIS (LEI 13.303/2016)
  // =========================================================================
  {
    statute: "Constituição Federal de 1988 e Lei nº 13.303/2016",
    article: "CF Art. 177 c/c Lei nº 13.303/2016 Arts. 1º, 3º, 4º e 17",
    themeKeywords: [
      "monopólio da união", "artigo 177", "empresas estatais", "empresas estatais dependentes e não dependentes", 
      "lei das estatais", "lei 13.303/2016", "empresa pública", "sociedade de economia mista", 
      "governança corporativa", "compliance", "requisitos de administradores", "direito da regulação e agências reguladoras"
    ],
    literalText: `> **CF/88 — Art. 177.** Constituem monopólio da União:
> * **I -** a pesquisa e a lavra das jazidas de petróleo e gás natural e outros hidrocarbonetos fluidos;
> * **II -** a refinação do petróleo nacional ou estrangeiro;
> * **III -** a importação e exportação dos produtos e derivados básicos resultantes das atividades previstas nos incisos anteriores;
> * **IV -** o transporte marítimo do petróleo bruto de origem nacional ou de derivados básicos de petróleo produzidos no País, bem assim o transporte, por meio de conduto, de petróleo bruto, seus derivados e gás natural de qualquer origem;
> * **V -** a pesquisa, a lavra, o enriquecimento, o reprocessamento, a industrialização e o comércio de minérios e minerais nucleares e seus derivados.
> * **§ 1º** A União poderá contratar com empresas estatais ou com empresas privadas a realização das atividades previstas nos incisos I a IV deste artigo observadas as condições estabelecidas em lei.
>
> **Lei nº 13.303/2016 — Art. 1º.** Esta Lei dispõe sobre o estatuto jurídico da empresa pública, da sociedade de economia mista e de suas subsidiárias, abrangendo toda empresa pública e sociedade de economia mista da União, dos Estados, do Distrito Federal e dos Municípios que explore atividade econômica de produção ou comercialização de bens ou de prestação de serviços.
>
> **Lei nº 13.303/2016 — Art. 17.** Os membros do Conselho de Administração e os indicados para os cargos de diretor, inclusive presidente, diretor-geral e diretor-presidente, serão escolhidos entre cidadãos de reputação ilibada e notório conhecimento, devendo ser atendidos os seguintes requisitos mínimos:
> * **I -** ter experiência profissional de no mínimo dez anos na área de atuação da empresa ou quatro anos em cargo de chefia;
> * **II -** ter formação acadêmica compatível com o cargo para o qual foi indicado.`
  },

  // =========================================================================
  // DIREITO ECONÔMICO: SISTEMA FINANCEIRO NACIONAL, BACEN E SIGILO BANCÁRIO
  // =========================================================================
  {
    statute: "Constituição Federal de 1988, LC nº 179/2021 e LC nº 105/2001",
    article: "CF Art. 192 c/c LC nº 179/2021 e LC nº 105/2001",
    themeKeywords: [
      "sistema financeiro nacional", "sfn", "artigo 192", "banco central do brasil", "bacen", 
      "lei complementar 179/2021", "autonomia do bacen", "política monetária", "sigilo bancário", 
      "lei complementar 105/2001", "tema 225 stf", "transferência de sigilo fiscal", 
      "mercado de câmbio", "mercado de capitais", "sistema financeiro de habitação", 
      "regime prudencial do mercado financeiro", "regime interventivo do mercado financeiro", 
      "regime sancionador do mercado financeiro", "sistema nacional de seguros privados"
    ],
    literalText: `> **CF/88 — Art. 192.** O sistema financeiro nacional, estruturado de forma a promover o desenvolvimento equilibrado do País e a servir aos interesses da coletividade, em todas as partes que o compõem, abrangendo as cooperativas de crédito, será regulado por leis complementares que disporão, inclusive, sobre a participação do capital estrangeiro nas instituições que o integram.
>
> **LC nº 179/2021 — Art. 1º.** O Banco Central do Brasil tem por objetivo fundamental assegurar a estabilidade de preços.
> * **Parágrafo único.** Sem prejuízo de seu objetivo fundamental, o Banco Central do Brasil também tem por objetivos zelar pela estabilidade e pela eficiência do sistema financeiro, suavizar as flutuações do nível de atividade econômica e fomentar o pleno emprego.
>
> **LC nº 179/2021 — Art. 4º.** O Presidente e os Diretores do Banco Central do Brasil serão nomeados pelo Presidente da República, após aprovação de seus nomes pelo Senado Federal, para mandatos de 4 (quatro) anos, admitida uma recondução consecutiva.
> * **§ 1º** O mandato do Presidente do Banco Central do Brasil terá início no dia 1º de janeiro do terceiro ano de mandato do Presidente da República.
>
> **LC nº 105/2001 — Art. 6º.** As autoridades e os agentes fiscais tributários da União, dos Estados, do Distrito Federal e dos Municípios somente poderão examinar documentos, livros e registros de instituições financeiras, inclusive os referentes a contas de depósitos e aplicações financeiras, quando houver processo administrativo instaurado ou procedimento fiscal em curso e tais exames sejam considerados indispensáveis pela autoridade administrativa competente.`
  },

  // =========================================================================
  // DIREITO ECONÔMICO: DEFESA DA CONCORRÊNCIA E CADE (LEI 12.529/2011)
  // =========================================================================
  {
    statute: "Lei nº 12.529/2011 (Defesa da Concorrência)",
    article: "Lei nº 12.529/2011 Arts. 1º, 9º, 36, 85, 86 e 88",
    themeKeywords: [
      "direito da concorrência", "direito da concorrencia", "lei 12.529/2011", "cade", 
      "tribunal administrativo de defesa econômica", "superintendência-geral", "departamento de estudos econômicos", 
      "infrações contra a ordem econômica", "cartel", "acordo de leniência", "acordo de leniencia", 
      "termo de compromisso de cessação", "tcc", "atos de concentração", "atos de concentracao"
    ],
    literalText: `> **Lei nº 12.529/2011 — Art. 1º.** Esta Lei estrutura o Sistema Brasileiro de Defesa da Concorrência - SBDC e dispõe sobre a prevenção e a repressão às infrações contra a ordem econômica, orientada pelos ditames constitucionais de liberdade de iniciativa, livre concorrência, função social da propriedade, defesa dos consumidores e repressão ao abuso do poder econômico.
>
> **Lei nº 12.529/2011 — Art. 36.** Constituem infração da ordem econômica, independentemente de culpa, os atos sob qualquer forma manifestados, que tenham por objeto ou possam produzir os seguintes efeitos, ainda que não sejam alcançados:
> * **I -** limitar, falsear ou de qualquer forma prejudicar a livre concorrência ou a livre iniciativa;
> * **II -** dominar mercado relevante de bens ou serviços;
> * **III -** aumentar arbitrariamente os lucros; e
> * **IV -** exercer de forma abusiva posição dominante.
> * **§ 3º** As seguintes condutas, além de outras, na medida em que configurem hipótese prevista no caput deste artigo e seus incisos, caracterizam infração da ordem econômica:
>   * **I -** acordar, combinar, manipular ou ajustar com concorrente, sob qualquer forma:
>     * a) os preços de bens ou serviços ofertados individualmente;
>     * b) a produção ou a comercialização de uma quantidade restrita ou limitada de bens ou a prestação de um número, volume ou frequência restrita ou limitada de serviços;
>     * c) a divisão de partes ou de segmentos de um mercado atual ou potencial de bens ou serviços, mediante, dentre outros, a distribuição de clientes, fornecedores, regiões ou períodos;
>     * d) preços, condições, vantagens ou abstenção em licitação pública (cartel em licitações).
>
> **Lei nº 12.529/2011 — Art. 86.** O Cade, por intermédio da Superintendência-Geral, poderá celebrar acordo de leniência com pessoas físicas e jurídicas que forem autoras de infração à ordem econômica, desde que colaborem efetivamente com as investigações e com o processo administrativo e que dessa colaboração resulte:
> * **I -** a identificação dos demais envolvidos na infração; e
> * **II -** a obtenção de informações e documentos que comprovem a infração noticiada ou sob investigação.
> * **§ 1º** O acordo de que trata o caput deste artigo somente poderá ser celebrado se preenchidos cumulativamente os seguintes requisitos:
>   * **I -** a empresa seja a primeira a se qualificar com respeito à infração noticiada ou sob investigação;
>   * **II -** a empresa cesse completamente seu envolvimento na infração noticiada.`
  },

  // =========================================================================
  // DIREITO FINANCEIRO: CONTROLE INTERNO, EXTERNO E TCU (CF ARTS. 70 A 75)
  // =========================================================================
  {
    statute: "Constituição Federal de 1988 e Lei nº 8.443/1992",
    article: "CF Arts. 70 a 75 c/c Lei nº 8.443/1992 Arts. 1º, 16 e 71",
    themeKeywords: [
      "controle interno e externo", "controle interno", "controle externo", 
      "tribunal de contas da união", "tcu", "tribunal de contas", "fiscalização contábil", 
      "fiscalização financeira", "fiscalização orçamentária", "parecer prévio", 
      "julgamento de contas", "eficácia de título executivo", "tomada de contas especial"
    ],
    literalText: `> **CF/88 — Art. 70.** A fiscalização contábil, financeira, orçamentária, operacional e patrimonial da União e das entidades da administração direta e indireta, quanto à legalidade, legitimidade, economicidade, aplicação das subvenções e renúncia de receitas, será exercida pelo Congresso Nacional, mediante controle externo, e pelo sistema de controle interno de cada Poder.
> * **Parágrafo único.** Prestará contas qualquer pessoa física ou jurídica, pública ou privada, que utilize, arrecade, guarde, gerencie ou administre dinheiros, bens e valores públicos ou pelos quais a União responda, ou que, em nome desta, assuma obrigações de natureza pecuniária.
>
> **CF/88 — Art. 71.** O controle externo, a cargo do Congresso Nacional, será exercido com o auxílio do Tribunal de Contas da União, ao qual compete:
> * **I -** apreciar as contas prestadas anualmente pelo Presidente da República, mediante parecer prévio que deverá ser elaborado em sessenta dias a contar de seu recebimento;
> * **II -** julgar as contas dos administradores e demais responsáveis por dinheiros, bens e valores públicos da administração direta e indireta, incluídas as fundações e sociedades instituídas e mantidas pelo Poder Público federal, e as contas daqueles que derem causa a perda, extravio ou outra irregularidade de que resulte prejuízo ao erário público;
> * **§ 3º** As decisões do Tribunal de que resulte imputação de débito ou multa terão eficácia de título executivo.
>
> **CF/88 — Art. 74.** Os Poderes Legislativo, Executivo e Judiciário manterão, de forma integrada, sistema de controle interno com a finalidade de:
> * **I -** avaliar o cumprimento das metas previstas no plano plurianual, a execução dos programas de governo e dos orçamentos da União;
> * **II -** comprovar a legalidade e avaliar os resultados, quanto à eficácia e eficiência, da gestão orçamentária, financeira e patrimonial nos órgãos e entidades da administração federal, bem como da aplicação de recursos públicos por entidades de direito privado;
> * **IV -** apoiar o controle externo no exercício de sua missão institucional.`
  },

  // ==========================================
  // --- DIREITO DA SEGURIDADE SOCIAL: PRINCÍPIOS, CONCEITUAÇÃO E ORGANIZAÇÃO ---
  // ==========================================
  {
    themeKeywords: [
      "seguridade social. 1.1. conceituação. 1.2. organização e princípios constitucionais. 1.3 modelos. regime geral. regimes próprios. regimes especiais. previdência complementar",
      "seguridade social: conceituacao", "seguridade social", "organizacao e principios constitucionais", 
      "principios constitucionais da seguridade", "modelos de previdencia", "bismarckiano", "beveridgiano", 
      "universalidade da cobertura", "equidade no custeio", "diversidade da base", "gestao quadripartite"
    ],
    article: "CF Arts. 194 e 195",
    statute: "Constituição Federal de 1988",
    literalText: `> **Art. 194.** A seguridade social compreende um conjunto integrado de ações de iniciativa dos Poderes Públicos e da sociedade, destinadas a assegurar os direitos relativos à saúde, à previdência e à assistência social.
> 
> Parágrafo único. Compete ao Poder Público, nos termos da lei, organizar a seguridade social, com base nos seguintes objetivos:
> I - universalidade da cobertura e do atendimento;
> II - uniformidade e equivalência dos benefícios e serviços às populações urbanas e rurais;
> III - seletividade e distributividade na prestação dos benefícios e serviços;
> IV - irredutibilidade do valor dos benefícios;
> V - equidade na forma de participação no custeio;
> VI - diversidade da base de financiamento, identificando-se, em rubricas contábeis específicas para cada área, as receitas e as despesas vinculadas a ações de saúde, previdência e assistência social, preservado o caráter contributivo da previdência social;
> VII - caráter democrático e descentralizado da administração, mediante gestão quadripartite, com participação dos trabalhadores, dos empregadores, dos aposentados e do Governo nos órgãos colegiados.`
  },

  // ==========================================
  // --- DIREITO DA SEGURIDADE SOCIAL: RGPS, SEGURADOS E QUALIDADE DE SEGURADO ---
  // ==========================================
  {
    themeKeywords: [
      "regime geral de previdência social", "regime geral de previdencia social", "rgps", 
      "segurados obrigatorios", "segurado empregado", "empregado domestico", "trabalhador avulso", 
      "contribuinte individual", "segurado especial", "segurado facultativo", "qualidade de segurado", 
      "periodo de graca", "carencia", "dependentes do rgps", "classes de dependentes"
    ],
    article: "CF Art. 201 c/c Lei nº 8.213/1991 Arts. 11, 15 e 16",
    statute: "Constituição Federal e Lei de Benefícios (Lei nº 8.213/1991)",
    literalText: `> **CF/88, Art. 201.** A previdência social será organizada sob a forma do Regime Geral de Previdência Social, de caráter contributivo e de filiação obrigatória, observados critérios que preservem o equilíbrio financeiro e atuarial.
> 
> **Lei nº 8.213/1991, Art. 11.** São segurados obrigatórios da Previdência Social as seguintes pessoas físicas:
> I - como empregado: aquele que presta serviço de natureza urbana ou rural à empresa, em caráter não eventual, sob sua subordinação e mediante remuneração;
> II - como empregado doméstico: aquele que presta serviço de natureza contínua a pessoa ou família, no âmbito residencial desta, em atividades sem fins lucrativos;
> V - como contribuinte individual: a pessoa física que exerce, por conta própria, atividade econômica de natureza urbana ou rural, com fins lucrativos ou não;
> VII - como segurado especial: a pessoa física residente no imóvel rural ou em aglomerado urbano que, individualmente ou em regime de economia familiar, ainda que com o auxílio eventual de terceiros, na condição de produtor.
> 
> **Art. 15.** Mantém a qualidade de segurado, independentemente de contribuições:
> I - sem limite de prazo, quem está em gozo de benefício;
> II - até 12 (doze) meses após a cessação das contribuições, o segurado que deixar de exercer atividade remunerada abrangida pela Previdência Social;
> § 1º O prazo do inciso II será prorrogado para até 24 (vinte e quatro) meses se o segurado já tiver pago mais de 120 (cento e vinte) contribuições mensais sem interrupção.
> § 2º Os prazos do inciso II ou do § 1º serão acrescidos de 12 (doze) meses para o segurado desempregado, desde que comprovada essa situação pelo registro no órgão próprio.`
  },

  // ==========================================
  // --- DIREITO DA SEGURIDADE SOCIAL: EMPRESA, EMPREGADOR DOMÉSTICO E OBRIGAÇÕES ---
  // ==========================================
  {
    themeKeywords: [
      "empresa e empregador doméstico: conceito previdenciário", "empresa e empregador domestico: conceito previdenciario", 
      "conceito de empresa", "empregador domestico", "artigo 15 da lei 8.212", "obrigacoes tributarias previdenciarias", 
      "retencao de 11%", "cessao de mao de obra", "empreitada", "responsabilidade solidaria previdenciaria"
    ],
    article: "Lei nº 8.212/1991 Arts. 15, 30 e 31 c/c LC nº 150/2015",
    statute: "Lei Orgânica da Seguridade Social (Lei nº 8.212/1991)",
    literalText: `> **Art. 15.** Considera-se:
> I - empresa: a firma individual ou a sociedade que assume o risco de atividade econômica urbana ou rural, com fins lucrativos ou não, bem como os órgãos e entidades da administração pública direta, indireta e fundacional;
> II - empregador doméstico: a pessoa ou família que admite a seu serviço, sem fins lucrativos, empregado doméstico.
> Parágrafo único. Equiparam-se a empresa, para os efeitos desta Lei, o contribuinte individual e a pessoa física na condição de proprietário ou dono de obra de construção civil, em relação a segurado que lhe presta serviço, bem como a cooperativa, a associação, a entidade de qualquer natureza ou finalidade, a missão diplomática e a repartição consular de carreira estrangeiras.
> 
> **Art. 31.** A empresa contratante de serviços prestados mediante cessão de mão de obra ou empreitada, inclusive em regime de trabalho temporário, deverá reter 11% (onze por cento) do valor bruto da nota fiscal ou fatura de prestação de serviços e recolher, em nome da empresa cedente da mão de obra, a importância retida até o dia 20 (vinte) do mês subsequente ao da emissão da respectiva nota fiscal ou fatura, ou até o dia útil imediatamente anterior se não houver expediente bancário naquele dia.
> 
> **Art. 30, VI.** O proprietário, o incorporador definido na Lei nº 4.591/1964, o dono da obra ou condômino da unidade imobiliária, qualquer que seja a forma de contratação da construção, reforma ou acréscimo, são solidariamente responsáveis com o construtor pelas contribuições devidas à Seguridade Social.`
  },

  // ==========================================
  // --- DIREITO DA SEGURIDADE SOCIAL: FINANCIAMENTO, CUSTEIO E RPPS ---
  // ==========================================
  {
    themeKeywords: [
      "financiamento da seguridade social e regime próprio de previdência", "financiamento da seguridade social e regime proprio de previdencia", 
      "financiamento da seguridade", "custeio previdenciario", "artigo 195 da constituicao", 
      "contribuicoes sociais", "folha de salarios", "receita ou faturamento", "pis e cofins", 
      "lucro liquido", "csll", "anterioridade nonagesimal mitigada", "principio da contrapartida", 
      "regime proprio de previdencia social", "rpps", "artigo 40 da constituicao", "aliquotas progressivas", "cebas"
    ],
    article: "CF Arts. 40 e 195 c/c Lei nº 8.212/1991 Arts. 20 e 22",
    statute: "Constituição Federal e Lei Orgânica da Seguridade Social (Lei nº 8.212/1991)",
    literalText: `> **CF/88, Art. 195.** A seguridade social será financiada por toda a sociedade, de forma direta e indireta, nos termos da lei, mediante recursos provenientes dos orçamentos da União, dos Estados, do Distrito Federal e dos Municípios, e das seguintes contribuições sociais:
> I - do empregador, da empresa e da entidade a ela equiparada na forma da lei, incidentes sobre:
> a) a folha de salários e demais rendimentos do trabalho pagos ou creditados, a qualquer título, à pessoa física que lhe preste serviço, mesmo sem vínculo empregatício;
> b) a receita ou o faturamento;
> c) o lucro;
> II - do trabalhador e dos demais segurados da previdência social, podendo ser adotadas alíquotas progressivas de acordo com o valor do salário de contribuição, não incidindo contribuição sobre aposentadoria e pensão concedidas pelo Regime Geral de Previdência Social;
> III - sobre a receita de concursos de prognósticos;
> IV - do importador de bens ou serviços do exterior, ou de quem a lei a ele equiparar.
> 
> § 5º Nenhum benefício ou serviço da seguridade social poderá ser criado, majorado ou estendido sem a correspondente fonte de custeio total.
> § 6º As contribuições sociais de que trata este artigo só poderão ser exigidas após decorridos noventa dias da data da publicação da lei que as houver instituído ou modificado, não se lhes aplicando o disposto no art. 150, III, "b".
> § 7º São isentas de contribuição para a seguridade social as entidades beneficentes de assistência social que atendam às exigências estabelecidas em lei complementar.
> 
> **CF/88, Art. 40.** O regime próprio de previdência social dos servidores titulares de cargos efetivos terá caráter contributivo e solidário, mediante contribuição do respectivo ente federativo, de servidores ativos, de aposentados e de pensionistas, observados critérios que preservem o equilíbrio financeiro e atuarial.`
  },


  {
    "themeKeywords": [
      "fazenda publica em juizo",
      "fazenda publica",
      "prerrogativas da fazenda publica",
      "prazo em dobro",
      "intimacao pessoal",
      "reexame necessario",
      "remessa necessaria",
      "execucao contra a fazenda publica",
      "artigo 183",
      "artigo 496",
      "artigo 535",
      "lei 9494",
      "lei 8437",
      "representacao judicial"
    ],
    "statute": "Código de Processo Civil (Lei nº 13.105/2015) e Legislação da Fazenda Pública",
    "article": "Arts. 183, 496, 534 e 535 c/c Lei nº 9.494/1997 e Lei nº 8.437/1992",
    "literalText": "Art. 183. A União, os Estados, o Distrito Federal, os Municípios e suas respectivas autarquias e fundações de direito público gozarão de prazo em dobro para todas as suas manifestações processuais, cuja contagem terá início a partir da intimação pessoal.\n§ 1º A intimação pessoal far-se-á por meio eletrônico, em portal próprio, nos termos da lei.\n§ 2º Não se aplica o benefício da contagem em dobro quando a lei estabelecer, de forma expressa, prazo próprio para o ente público.\n\nArt. 496. Está sujeita ao duplo grau de jurisdição, não produzindo efeito senão depois de confirmada pelo tribunal, a sentença:\nI - proferida contra a União, os Estados, o Distrito Federal, os Municípios e suas respectivas autarquias e fundações de direito público;\nII - que julgar procedentes, no todo ou em parte, os embargos à execução fiscal.\n§ 1º Nos casos previstos neste artigo, não havendo apelação interposta pelo ente público, o juiz ordenará a remessa dos autos ao tribunal, e, se não o fizer, o presidente do tribunal avocá-los-á.\n§ 2º Em qualquer dos casos referidos no caput, o tribunal julgará a remessa necessária independentemente de pedido expresso.\n§ 3º Não se aplica o disposto neste artigo quando a condenação ou o proveito econômico obtido na causa for de valor certo e líquido inferior a:\nI - 1.000 (mil) salários-mínimos para a União e as respectivas autarquias e fundações de direito público federais;\nII - 500 (quinhentos) salários-mínimos para os Estados, o Distrito Federal, as respectivas autarquias e fundações de direito público e os Municípios que constituam capitais dos Estados;\nIII - 100 (cem) salários-mínimos para todos os demais Municípios e respectivas autarquias e fundações de direito público municipais.\n§ 4º Também não se aplica o disposto neste artigo quando a sentença estiver fundada em:\nI - súmula de tribunal superior;\nII - acórdão proferido pelo Supremo Tribunal Federal ou pelo Superior Tribunal de Justiça em julgamento de recursos repetitivos;\nIII - entendimento firmado em incidente de resolução de demandas repetitivas ou de assunção de competência;\nIV - entendimento coincidente com orientação vinculante firmada no âmbito administrativo do próprio ente público, consolidada em manifestação, parecer ou súmula administrativa.\n\nArt. 535. A Fazenda Pública será intimada na pessoa de seu representante judicial, por carga, remessa ou meio eletrônico, para, querendo, no prazo de 30 (trinta) dias e nos próprios autos, impugnar a execução, podendo arguir:\nI - falta ou nulidade da citação se, na fase de conhecimento, o processo correu à revelia;\nII - ilegitimidade de parte;\nIII - inexequibilidade do título ou inexigibilidade da obrigação;\nIV - excesso de execução ou cumulação indevida de execuções;\nV - incompetência absoluta ou relativa do juízo da execução;\nVI - qualquer causa modificativa ou extintiva da obrigação, como pagamento, novação, compensação, transação ou prescrição, desde que supervenientes ao trânsito em julgado da sentença.\n§ 1º A alegação de impedimento ou suspeição observará o disposto nos arts. 146 e 148."
  },

  {
    "themeKeywords": [
      "honorarios advocaticios",
      "honorarios de sucumbencia",
      "honorarios da fazenda publica",
      "tema 1076",
      "equidade",
      "apreciacao equitativa",
      "artigo 85",
      "faixas escalonadas",
      "honorarios recursais",
      "honorarios periciais",
      "adi 6053"
    ],
    "statute": "Código de Processo Civil (Lei nº 13.105/2015)",
    "article": "Art. 85, §§ 1º a 19",
    "literalText": "Art. 85. A sentença condenará o vencido a pagar honorários ao advogado do vencedor.\n§ 1º São devidos honorários advocatícios na reconvenção, no cumprimento de sentença, provisório ou definitivo, na execução, resistida ou não, e nos recursos interpostos, cumulativamente.\n§ 2º Os honorários serão fixados entre o mínimo de dez e o máximo de vinte por cento sobre o valor da condenação, do proveito econômico obtido ou, não sendo possível mensurá-lo, sobre o valor atualizado da causa, atendidos o grau de zelo do profissional, o lugar de prestação do serviço, a natureza e a importância da causa, o trabalho realizado pelo advogado e o tempo exigido para o seu serviço.\n§ 3º Nas causas em que a Fazenda Pública for parte, a fixação dos honorários observará os critérios estabelecidos nos incisos I a IV do § 2º e os seguintes percentuais:\nI - mínimo de dez e máximo de vinte por cento sobre o valor da condenação ou do proveito econômico obtido até 200 (duzentos) salários-mínimos;\nII - mínimo de oito e máximo de dez por cento sobre o valor da condenação ou do proveito econômico obtido acima de 200 (duzentos) salários-mínimos até 2.000 (dois mil) salários-mínimos;\nIII - mínimo de cinco e máximo de oito por cento sobre o valor da condenação ou do proveito econômico obtido acima de 2.000 (dois mil) salários-mínimos até 20.000 (vinte mil) salários-mínimos;\nIV - mínimo de três e máximo de cinco por cento sobre o valor da condenação ou do proveito econômico obtido acima de 20.000 (vinte mil) salários-mínimos até 100.000 (cem mil) salários-mínimos;\nV - mínimo de um e máximo de três por cento sobre o valor da condenação ou do proveito econômico obtido acima de 100.000 (cem mil) salários-mínimos.\n§ 4º Em qualquer das hipóteses do § 3º:\nI - os percentuais mais elevados serão reservados a situações de maior complexidade da causa;\nII - não havendo condenação principal ou não sendo possível mensurar o proveito econômico obtido, a condenação em honorários dar-se-á sobre o valor atualizado da causa;\nIII - se a sentença for ilíquida, a definição do percentual dos honorários advocatícios somente ocorrerá quando liquidado o julgado.\n§ 5º Quando, conforme o caso, a condenação contra a Fazenda Pública ou o benefício econômico obtido pelo autor superar o limite previsto no inciso I do § 3º, a fixação do percentual de honorários deve observar a faixa inicial e, naquilo que a exceder, a faixa subsequente, e assim sucessivamente.\n§ 8º Nas causas em que for inestimável ou irrisório o proveito econômico ou, ainda, quando o valor da causa for muito baixo, o juiz fixará o valor dos honorários por apreciação equitativa, observando o disposto nos incisos do § 2º.\n§ 8º-A. Aplica-se o disposto no § 8º deste artigo exclusivamente nas causas em que o proveito econômico for inestimável ou irrisório ou em que o valor da causa for muito baixo, vedada a fixação por equidade nas causas de valor elevado (STJ Tema 1.076).\n§ 11. O tribunal, ao julgar recurso, majorará os honorários fixados anteriormente levando em conta o trabalho adicional realizado em grau recursal, não podendo o total ultrapassar os limites estabelecidos nos §§ 2º e 3º para a fase de conhecimento.\n§ 19. Os advogados públicos perceberão honorários de sucumbência, nos termos da lei (STF ADI 6053)."
  },

  {
    "themeKeywords": [
      "normas fundamentais do processo",
      "normas fundamentais",
      "contraditorio substancial",
      "boa-fe processual",
      "cooperacao processual",
      "primazia do merito",
      "limites da jurisdição nacional",
      "cooperacao internacional",
      "auxilio direto",
      "carta rogatoria",
      "artigo 1",
      "artigo 9",
      "artigo 10",
      "artigo 21",
      "artigo 26"
    ],
    "statute": "Código de Processo Civil (Lei nº 13.105/2015)",
    "article": "Arts. 1º a 11 e Arts. 21 a 27",
    "literalText": "Art. 1º O processo civil será ordenado, disciplinado e interpretado conforme os valores e as normas fundamentais estabelecidos na Constituição da República Federativa do Brasil, observando-se as disposições deste Código.\nArt. 2º O processo começa por iniciativa da parte e se desenvolve por impulso oficial, salvo as exceções previstas em lei.\nArt. 3º Não se excluirá da apreciação jurisdicional ameaça ou lesão a direito.\n§ 1º É permitida a arbitragem, na forma da lei.\n§ 2º O Estado promoverá, sempre que possível, a solução consensual dos conflitos.\n§ 3º A conciliação, a mediação e outros métodos de solução consensual de conflitos deverão ser estimulados por juízes, advogados, defensores públicos e membros do Ministério Público, inclusive no curso do processo judicial.\nArt. 4º As partes têm o direito de obter em prazo razoável a solução integral do mérito, incluída a atividade satisfativa.\nArt. 5º Aquele que de qualquer forma participa do processo deve comportar-se de acordo com a boa-fé.\nArt. 6º Todos os sujeitos do processo devem cooperar entre si para que se obtenha, em tempo razoável, decisão de mérito justa e efetiva.\nArt. 9º Não se proferirá decisão contra uma das partes sem que ela seja previamente ouvida.\nParágrafo único. O disposto no caput não se aplica:\nI - à tutela provisória de urgência;\nII - às hipóteses de tutela da evidência previstas no art. 311, incisos II e III;\nIII - à decisão de indeferimento da petição inicial ou de improcedência liminar do pedido.\nArt. 10. O juiz não pode decidir, em grau algum de jurisdição, com base em fundamento a respeito do qual não se tenha dado às partes oportunidade de se manifestar, ainda que se trate de matéria sobre a qual deva decidir de ofício.\nArt. 11. Todos os julgamentos dos órgãos do Poder Judiciário serão públicos, e fundamentadas todas as decisões, sob pena de nulidade.\n\nArt. 21. Compete à autoridade judiciária brasileira processar e julgar as ações em que:\nI - o réu, qualquer que seja a sua nacionalidade, estiver domiciliado no Brasil;\nII - no Brasil tiver de ser cumprida a obrigação;\nIII - o fundamento seja fato ocorrido ou ato praticado no Brasil.\nArt. 26. A cooperação jurídica internacional será regida por tratado de que o Brasil faz parte e observará:\nI - o respeito às garantias do devido processo legal;\nII - a igualdade de tratamento entre nacionais e estrangeiros;\nIII - a publicidade processual, ressalvadas as hipóteses de segredo de justiça;\nIV - a existência de autoridade central para recepção e transmissão dos pedidos de cooperação.\nArt. 28. Cabe auxílio direto quando a medida não decorrer diretamente de decisão de autoridade jurisdicional estrangeira a ser submetida a juízo de delibação no Brasil."
  },

  {
    "themeKeywords": [
      "das partes e dos procuradores",
      "partes e procuradores",
      "do juiz e dos auxiliares de justica",
      "do juiz",
      "auxiliares de justica",
      "do ministerio publico",
      "ministerio publico",
      "da advocacia. da advocacia publica",
      "advocacia publica",
      "da defensoria publica",
      "defensoria publica",
      "capacidade processual",
      "deveres das partes",
      "impedimento e suspeicao",
      "artigo 70",
      "artigo 139",
      "artigo 144",
      "artigo 176",
      "artigo 182",
      "artigo 185"
    ],
    "statute": "Código de Processo Civil (Lei nº 13.105/2015)",
    "article": "Arts. 77, 139, 144, 145, 178, 182, 184 e 185",
    "literalText": "Art. 77. Além de outros previstos neste Código, são deveres das partes, de seus procuradores e de todos aqueles que de qualquer forma participem do processo:\nI - expor os fatos em juízo conforme a verdade;\nII - não formular pretensão ou de apresentar defesa quando cientes de que são destituídas de fundamento;\nIII - não produzir provas e não praticar atos inúteis ou desnecessários à declaração ou à defesa do direito;\nIV - cumprir com exatidão as decisões jurisdicionais, de natureza provisória ou final, e não criar embaraços à sua efetivação;\nV - declinar, no primeiro momento que lhes couber falar nos autos, o endereço residencial ou profissional onde receberão intimações.\n\nArt. 139. O juiz dirigirá o processo conforme as disposições deste Código, incumbindo-lhe:\nI - assegurar às partes igualdade de tratamento;\nII - velar pela duração razoável do processo;\nIII - prevenir ou reprimir qualquer ato contrário à dignidade da justiça e indeferir postulações meramente protelatórias;\nIV - determinar todas as medidas indutivas, coercitivas, mandamentais ou sub-rogatórias necessárias para assegurar o cumprimento de ordem judicial, inclusive nas ações que tenham por objeto prestação pecuniária.\n\nArt. 144. Há impedimento do juiz, sendo-lhe vedado exercer suas funções no processo:\nI - em que interveio como mandatário da parte, oficiou como perito, funcionou como membro do Ministério Público ou prestou depoimento como testemunha;\nII - de que conheceu em outro grau de jurisdição, tendo proferido decisão;\nIII - quando nele estiver postulando, como defensor público, advogado ou membro do Ministério Público, seu cônjuge ou companheiro, ou qualquer parente, consanguíneo ou afim, em linha reta ou colateral, até o terceiro grau, inclusive.\n\nArt. 178. O Ministério Público será intimado para, no prazo de 30 (trinta) dias, intervir como fiscal da ordem jurídica nas hipóteses previstas em lei ou na Constituição Federal e nos processos que envolvam:\nI - interesse público ou social;\nII - interesse de incapaz;\nIII - litígios coletivos pela posse de terra rural ou urbana.\n\nArt. 182. Incumbe à Advocacia Pública, na forma da lei, defender e promover os interesses patrimoniais e os direitos das respectivas pessoas jurídicas de direito público, atuando com as prerrogativas inerentes ao exercício do múnus público.\nArt. 184. O membro da Advocacia Pública será civil e regressivamente responsável quando agir com dolo ou fraude no exercício de suas funções."
  },

  {
    "themeKeywords": [
      "forma, tempo e lugar dos atos processuais",
      "atos processuais",
      "negócios jurídicos processuais e protocolos institucionais",
      "negocios juridicos processuais",
      "comunicação dos atos processuais",
      "comunicacao dos atos processuais",
      "citacao",
      "intimacao",
      "invalidades processuais",
      "nulidades processuais",
      "da distribuição, do registro e do valor da causa",
      "valor da causa",
      "artigo 188",
      "artigo 190",
      "artigo 219",
      "artigo 246",
      "artigo 277",
      "artigo 291"
    ],
    "statute": "Código de Processo Civil (Lei nº 13.105/2015)",
    "article": "Arts. 188, 190, 219, 246, 277, 282 e 291 a 293",
    "literalText": "Art. 188. Os atos e os termos processuais independem de forma determinada, salvo quando a lei expressamente a exigir, considerando-se válidos os que, realizados de outro modo, lhe preencham a finalidade essencial.\n\nArt. 190. Versando o processo sobre direitos que admitam auto-composição, é lícito às partes plenamente capazes estipular mudanças no procedimento para ajustá-lo às especificidades da causa e convencionar sobre os seus ônus, poderes, faculdades e deveres processuais, antes ou durante o processo.\nParágrafo único. De ofício ou a requerimento, o juiz controlará a validade das convenções previstas neste artigo, recusando-lhes aplicação somente nos casos de nulidade ou de inserção abusiva em contrato de adesão ou em que alguma parte se encontre em manifesta situação de vulnerabilidade.\n\nArt. 219. Na contagem de prazo em dias, estabelecido por lei ou pelo juiz, computar-se-ão somente os dias úteis.\nParágrafo único. O disposto neste artigo aplica-se somente aos prazos processuais.\n\nArt. 246. A citação será feita preferencialmente por meio eletrônico, no prazo de até 2 (dois) dias úteis, contado da decisão que a determinar, por meio dos endereços eletrônicos indicados pelo citando no banco de dados do Poder Judiciário, conforme regulamento do Conselho Nacional de Justiça.\n\nArt. 277. Quando a lei prescrever determinada forma, o juiz considerará válido o ato se, realizado de outro modo, lhe alcançar a finalidade.\nArt. 282. Ao pronunciar a nulidade, o juiz declarará que atos são atingidos e ordenará as providências necessárias a fim de que sejam repetidos ou retificados.\n§ 1º O ato não se repetirá nem se lhe suprirá a falta quando não prejudicar a parte (princípio pas de nullité sans grief).\n\nArt. 291. A toda causa será atribuído valor certo, ainda que não tenha conteúdo econômico imediatamente aferível.\nArt. 292. O valor da causa constará da petição inicial ou da reconvenção e será:\nI - na ação de cobrança de dívida, a soma monetariamente corrigida do principal, dos juros de mora vencidos e de outras penalidades;\nII - na ação que tiver por objeto a existência, a validade, o cumprimento, a modificação, a resolução, a resilição ou a rescisão de ato jurídico, o valor do ato ou o de sua parte controvertida."
  },

  {
    "themeKeywords": [
      "tutela provisoria",
      "tutela de urgencia",
      "tutela da evidencia",
      "estabilizacao da tutela",
      "formacao, suspensao e extincao do processo",
      "suspensao do processo",
      "extincao do processo",
      "vedacoes a liminares contra a fazenda",
      "artigo 294",
      "artigo 300",
      "artigo 304",
      "artigo 311",
      "artigo 313",
      "artigo 485",
      "artigo 487"
    ],
    "statute": "Código de Processo Civil (Lei nº 13.105/2015) e Lei nº 8.437/1992",
    "article": "Arts. 294, 300, 304 e 311 do CPC c/c Lei nº 8.437/1992, Art. 1º",
    "literalText": "Art. 294. A tutela provisória pode fundamentar-se em urgência ou evidência.\nParágrafo único. A tutela provisória de urgência, cautelar ou antecipada, pode ser concedida em caráter antecedente ou incidental.\n\nArt. 300. A tutela de urgência será concedida quando houver elementos que evidenciem a probabilidade do direito e o perigo de dano ou o risco ao resultado útil do processo.\n§ 1º Para a concessão da tutela de urgência, o juiz pode, conforme o caso, exigir caução real ou idônea suficiente para ressarcir os danos que a outra parte possa vir a sofrer, podendo a caução ser dispensada se a parte economicamente hipossuficiente não puder oferecê-la.\n§ 2º A tutela de urgência pode ser concedida liminarmente ou após justificação prévia.\n§ 3º A tutela de urgência de natureza antecipada não será concedida quando houver perigo de irreversibilidade dos efeitos da decisão.\n\nArt. 304. A tutela antecipada, concedida nos termos do art. 303, torna-se estável se da decisão que a conceder não for interposto o respectivo recurso.\n§ 1º No caso previsto no caput, o processo será extinto.\n§ 2º Qualquer das partes poderá demandar a outra com o intuito de rever, reformar ou invalidar a tutela antecipada estabilizada nos termos do caput.\n§ 5º O direito de rever, reformar ou invalidar a tutela antecipada, previsto no § 2º, extingue-se após decorridos 2 (dois) anos, contados da ciência da decisão que extinguiu o processo.\n\nArt. 311. A tutela da evidência será concedida, independentemente da demonstração de perigo de dano ou de risco ao resultado útil do processo, quando:\nI - ficar caracterizado o abuso do direito de defesa ou o manifesto propósito protelatório da parte;\nII - as alegações de fato puderem ser comprovadas apenas documentalmente e houver tese firmada em julgamento de casos repetitivos ou em súmula vinculante;\nIII - se tratar de pedido reipersecutório fundado em prova documental adequada do contrato de depósito;\nIV - a petição inicial for instruída com prova documental suficiente dos fatos constitutivos do direito do autor, a que o réu não oponha prova capaz de gerar dúvida razoável.\n\nLei nº 8.437/1992, Art. 1º. Não será cabível medida liminar contra o Poder Público que esgote, no todo ou em qualquer parte, o objeto da ação.\n§ 3º Não será cabível medida liminar que esgote, no todo ou em parte, o objeto da ação, ressalvadas as hipóteses expressamente previstas em lei."
  },

  {
    "themeKeywords": [
      "processo de conhecimento. procedimento comum",
      "processo de conhecimento",
      "procedimento comum",
      "peticao inicial",
      "contestacao",
      "revelia",
      "julgamento conforme o estado do processo",
      "procedimentos especiais",
      "coisa julgada",
      "limites da coisa julgada",
      "artigo 319",
      "artigo 335",
      "artigo 344",
      "artigo 355",
      "artigo 502",
      "artigo 505",
      "temas 881 e 885"
    ],
    "statute": "Código de Processo Civil (Lei nº 13.105/2015)",
    "article": "Arts. 319, 334, 344, 345, 355, 502, 503 e 505",
    "literalText": "Art. 319. A petição inicial indicará:\nI - o juízo a que é dirigida;\nII - os nomes, os prenomes, o estado civil, a existência de união estável, a profissão, o número de inscrição no Cadastro de Pessoas Físicas ou no Cadastro Nacional da Pessoa Jurídica, o endereço eletrônico, o domicílio e a residência do autor e do réu;\nIII - o fato e os fundamentos jurídicos do pedido;\nIV - o pedido com as suas especificações;\nV - o valor da causa;\nVI - as provas com que o autor pretende demonstrar a verdade dos fatos alegados;\nVII - a opção do autor pela realização ou não de audiência de conciliação ou de mediação.\n\nArt. 344. Se o réu não contestar a ação, será considerado revel e presumir-se-ão verdadeiras as alegações de fato formuladas pelo autor.\nArt. 345. A revelia não produz o efeito mencionado no art. 344 se:\nI - havendo pluralidade de réus, algum deles contestar a ação;\nII - o litígio versar sobre direitos indisponíveis (regra basilar protetiva da Fazenda Pública);\nIII - a petição inicial não estiver acompanhada de instrumento que a lei considere indispensável à prova do ato;\nIV - as alegações de fato formuladas pelo autor forem inverossímeis ou estiverem em contradição com prova constante dos autos.\n\nArt. 355. O juiz julgará antecipadamente o pedido, proferindo sentença com resolução de mérito, quando:\nI - não houver necessidade de produção de outras provas;\nII - o réu for revel, ocorrer o efeito previsto no art. 344 e não houver requerimento de prova.\n\nArt. 502. Denomina-se coisa julgada material a autoridade que torna imutável e indiscutível a decisão de mérito não mais sujeita a recurso.\nArt. 503. A decisão que julgar total ou parcialmente o mérito tem força de lei nos limites da questão principal expressamente decidida.\nArt. 505. Nenhum juiz decidirá novamente as questões já decididas relativas à mesma lide, salvo:\nI - se, tratando-se de relação jurídica de trato continuado, sobreveio modificação no estado de fato ou de direito, caso em que poderá a parte pedir a revisão do que foi estatuído na sentença;\nII - nos demais casos prescritos em lei."
  },

  {
    "themeKeywords": [
      "liquidacao de sentenca",
      "cumprimento da sentenca",
      "cumprimento de sentenca contra a fazenda publica",
      "do processo de execucao",
      "processo de execucao",
      "titulos executivos",
      "penhora",
      "prescricao intercorrente",
      "artigo 509",
      "artigo 523",
      "artigo 535",
      "artigo 784",
      "artigo 835",
      "artigo 921"
    ],
    "statute": "Código de Processo Civil (Lei nº 13.105/2015)",
    "article": "Arts. 509, 534, 535, 784, 835 e 921",
    "literalText": "Art. 509. Quando a sentença condenar ao pagamento de quantia ilíquida, proceder-se-á à sua liquidação, a requerimento do credor ou do devedor:\nI - por arbitramento, quando determinado pela sentença, convencionado pelas partes ou exigido pela natureza do objeto da liquidação;\nII - pelo procedimento comum, quando houver necessidade de alegar e provar fato novo.\n§ 4º Na liquidação é vedado discutir de novo a lide ou modificar a sentença que a julgou.\n\nArt. 784. São títulos executivos extrajudiciais:\nI - a letra de câmbio, a nota promissória, a duplicata, a debênture e o cheque;\nII - a escritura pública ou outro documento público assinado pelo devedor;\nIII - o documento particular assinado pelo devedor e por 2 (duas) testemunhas;\nIX - a certidão de dívida ativa da Fazenda Pública da União, dos Estados, do Distrito Federal e dos Municípios, correspondente aos créditos inscritos na forma da lei;\nX - o crédito decorrente de foro e laudêmio;\nXI - a certidão expedida por serventia notarial ou de registro relativa a emolumentos e demais despesas.\n\nArt. 835. A penhora observará, preferencialmente, a seguinte ordem:\nI - dinheiro, em espécie ou em depósito ou aplicação em instituição financeira;\nII - títulos da dívida pública da União, dos Estados e do Distrito Federal com cotação em mercado;\nIII - títulos e valores mobiliários com cotação em mercado;\nIV - veículos de via terrestre;\nV - bens imóveis;\nVI - bens móveis em geral;\nVII - semoventes;\nVIII - navios e aeronaves;\nIX - ações e quotas de sociedades simples e empresárias;\nX - percentual do faturamento de empresa devedora;\nXI - pedras e metais preciosos;\nXII - direitos aquisitivos derivados de promessa de compra e venda e de alienação fiduciária em garantia;\nXIII - outros direitos.\n\nArt. 921. Suspende-se a execução:\nIII - quando não for localizado o executado ou bens penhoráveis;\n§ 1º Na hipótese do inciso III, o juiz suspenderá a execução pelo prazo de 1 (um) ano, durante o qual se suspenderá a prescrição.\n§ 2º Decorrido o prazo máximo de 1 (um) ano sem que seja localizado o executado ou que sejam encontrados bens penhoráveis, o juiz ordenará o arquivamento dos autos.\n§ 4º O termo inicial da prescrição intercorrente dá-se no primeiro dia útil seguinte ao término do prazo de suspensão de 1 (um) ano de que trata o § 1º deste artigo."
  },

  {
    "themeKeywords": [
      "execucao fiscal. embargos a execucao. aplicacao subsidiaria do cpc. cautelar fiscal",
      "execucao fiscal",
      "embargos a execucao fiscal",
      "cda",
      "certidao de divida ativa",
      "cautelar fiscal",
      "excecao de pre-executividade",
      "lei 6830",
      "lei 8397",
      "sumula 393",
      "tema 568"
    ],
    "statute": "Lei de Execução Fiscal (Lei nº 6.830/1980) e Lei da Medida Cautelar Fiscal (Lei nº 8.397/1992)",
    "article": "Arts. 2º, 3º, 8º, 11, 16 e 40 da Lei 6.830/1980 c/c Lei nº 8.397/1992, Arts. 1º a 4º",
    "literalText": "Art. 2º Constitui Dívida Ativa da Fazenda Pública aquela definida como tributária ou não tributária na Lei nº 4.320, de 17 de março de 1964, com as alterações posteriores.\n§ 3º A inscrição, que se constitui no ato de controle administrativo da legalidade, será feita pelo órgão competente para apurar a liquidez e certeza do crédito.\n§ 5º O Termo de Inscrição de Dívida Ativa deverá conter: o nome do devedor e dos corresponsáveis, a quantia devida e a maneira de calcular os juros de mora, a origem e natureza do crédito e o número do processo administrativo.\n\nArt. 3º A Dívida Ativa regularmente inscrita goza da presunção de certeza e liquidez e tem o efeito de prova pré-constituída.\nParágrafo único. A presunção a que se refere este artigo é relativa e pode ser ilidida por prova inequívoca, a cargo do executado ou de terceiro, a quem aproveite.\n\nArt. 8º O executado será citado para, no prazo de 5 (cinco) dias, pagar a dívida com os juros e multa de mora e encargos indicados na Certidão de Dívida Ativa, ou garantir a execução.\n\nArt. 16. O executado oferecerá embargos, no prazo de 30 (trinta) dias, contados:\nI - do depósito;\nII - da juntada da prova da fiança bancária ou do seguro garantia;\nIII - da intimação da penhora.\n§ 1º Não são admissíveis embargos do executado antes de garantida a execução.\n§ 2º No prazo dos embargos, o executado deverá alegar toda matéria útil à defesa, requerer provas e juntar aos autos os documentos comprobatórios dos fatos alegados.\n\nArt. 40. O Juiz suspenderá o curso da execução, enquanto não for localizado o devedor ou encontrados bens sobre os quais possa recair a penhora, e, nesses casos, não correrá o prazo de prescrição.\n§ 1º Suspenso o curso da execução, será aberta vista dos autos ao representante judicial da Fazenda Pública.\n§ 2º Decorrido o prazo máximo de 1 (um) ano, sem que seja localizado o devedor ou encontrados bens penhoráveis, o Juiz ordenará o arquivamento dos autos.\n§ 4º Se da decisão que ordenar o arquivamento tiver decorrido o prazo prescricional, o juiz, depois de ouvida a Fazenda Pública, poderá, de ofício, reconhecer a prescrição intercorrente e decretá-la de imediato (STJ Tema 568)."
  },

  {
    "themeKeywords": [
      "ordem dos processos",
      "recursos e outros meios de impugnacao",
      "recursos",
      "repercussao geral",
      "sistema de precedentes",
      "apelacao",
      "agravo de instrumento",
      "embargos de declaracao",
      "acao rescisoria",
      "reclamacao constitucional",
      "incidente de assuncao de competencia",
      "irdr",
      "artigo 926",
      "artigo 927",
      "artigo 976",
      "artigo 988",
      "artigo 1015",
      "artigo 1022",
      "artigo 1035"
    ],
    "statute": "Código de Processo Civil (Lei nº 13.105/2015)",
    "article": "Arts. 926, 927, 976, 988, 1.015, 1.022 e 1.035",
    "literalText": "Art. 926. Os tribunais devem uniformizar sua jurisprudência e mantê-la estável, íntegra e coerente.\n§ 1º Na forma estabelecida pelo regimento interno, os tribunais editarão enunciados de súmula correspondentes a sua jurisprudência dominante.\n\nArt. 927. Os juízes e os tribunais observarão:\nI - as decisões do Supremo Tribunal Federal em controle concentrado de constitucionalidade;\nII - os enunciados de súmula vinculante do Supremo Tribunal Federal;\nIII - os acórdãos em incidente de assunção de competência ou de resolução de demandas repetitivas e em julgamento de recursos extraordinário e especial repetitivos;\nIV - os enunciados das súmulas do Supremo Tribunal Federal em matéria constitucional e do Superior Tribunal de Justiça em matéria infraconstitucional;\nV - a orientação do plenário ou do órgão especial aos quais estiverem vinculados.\n\nArt. 976. É cabível a instauração do incidente de resolução de demandas repetitivas quando houver, simultaneamente:\nI - efetiva repetição de processos que contenham controvérsia sobre a mesma questão unicamente de direito;\nII - risco de ofensa à isonomia e à segurança jurídica.\n\nArt. 988. Caberá reclamação da parte interessada ou do Ministério Público para:\nI - preservar a competência do tribunal;\nII - garantir a autoridade das decisões do tribunal;\nIII - garantir a observância de enunciado de súmula vinculante e de decisão do Supremo Tribunal Federal em controle concentrado de constitucionalidade;\nIV - garantir a observância de acórdão proferido em julgamento de incidente de resolução de demandas repetitivas ou de incidente de assunção de competência.\n\nArt. 1.015. Cabe agravo de instrumento contra as decisões interlocutórias que versarem sobre:\nI - tutelas provisórias;\nII - mérito do processo;\nIII - rejeição da alegação de convenção de arbitragem;\nIV - incidente de desconsideração da personalidade jurídica;\nV - rejeição do pedido de gratuidade da justiça ou acolhimento do pedido de sua revogação;\nVI - exibição ou posse de documento ou coisa;\nVII - exclusão de litisconsorte;\nVIII - rejeição do pedido de limitação do litisconsórcio;\nIX - admissão ou inadmissão de intervenção de terceiros;\nX - concessão, modificação ou revogação do efeito suspensivo aos embargos à execução;\nXI - redistribuição do ônus da prova nos termos do art. 373, § 1º;\nXIII - outros casos expressamente referidos em lei.\nParágrafo único. Também caberá agravo de instrumento contra decisões interlocutórias proferidas na fase de liquidação de sentença ou de cumprimento de sentença, no processo de execução e no processo de inventário (STJ Tema 988: taxatividade mitigada quando demonstrada urgência decorrente da inutilidade do julgamento em apelação)."
  },

  {
    "themeKeywords": [
      "processo coletivo",
      "processo estrutural",
      "juizado especial federal",
      "jef",
      "suspensao de seguranca",
      "acoes constitucionais",
      "mandado de seguranca",
      "acao civil publica",
      "tutela coletiva",
      "lei 7347",
      "lei 12016",
      "lei 10259",
      "lei 8437",
      "tema 1075"
    ],
    "statute": "Microssistema de Tutela Coletiva, Lei nº 12.016/2009 e Lei nº 10.259/2001",
    "article": "Lei 7.347/1985 Arts. 1º a 5º, 16; Lei 12.016/2009 Arts. 1º e 15; Lei 10.259/2001 Art. 3º",
    "literalText": "Lei nº 7.347/1985 (Ação Civil Pública), Art. 1º. Regem-se pelas disposições desta Lei as ações de responsabilidade por danos morais e patrimoniais causados:\nI - ao meio-ambiente;\nII - ao consumidor;\nIII - à ordem urbanística;\nIV - a bens e direitos de valor artístico, estético, histórico, turístico e paisagístico;\nV - a qualquer outro interesse difuso ou coletivo;\nVI - por infração da ordem econômica;\nVII - à ordem urbanística;\nVIII - à honra e à dignidade de grupos raciais, étnicos ou religiosos.\nArt. 5º Têm legitimidade para propor a ação principal e a ação cautelar:\nI - o Ministério Público;\nII - a Defensoria Pública;\nIII - a União, os Estados, o Distrito Federal e os Municípios;\nIV - a autarquia, empresa pública, fundação ou sociedade de economia mista;\nV - a associação legalmente constituída há pelo menos 1 (um) ano.\nArt. 16. A sentença civil fará coisa julgada erga omnes, nos limites da competência territorial do órgão prolator (Dispositivo declarado inconstitucional pelo STF no Tema 1.075, que reconheceu eficácia erga omnes nacional da sentença coletiva).\n\nLei nº 12.016/2009 (Mandado de Segurança), Art. 1º. Conceder-se-á mandado de segurança para proteger direito líquido e certo, não amparado por habeas corpus ou habeas data, sempre que, ilegalmente ou com abuso de poder, qualquer pessoa física ou jurídica sofrer violação ou houver justo receio de sofrê-la por parte de autoridade, seja de que categoria for e sejam quais forem as funções que exerça.\nArt. 15. Quando, a requerimento de pessoa jurídica de direito público interessada ou do Ministério Público e para evitar grave lesão à ordem, à saúde, à segurança e à economia públicas, o presidente do tribunal ao qual couber o conhecimento do respectivo recurso suspender, em decisão fundamentada, a execução da liminar e da sentença, dessa decisão caberá agravo, sem efeito suspensivo, no prazo de 5 (cinco) dias.\n\nLei nº 10.259/2001 (Juizados Especiais Federais), Art. 3º. Compete ao Juizado Especial Federal Cível processar, conciliar e julgar causas de competência da Justiça Federal até o valor de 60 (sessenta) salários mínimos, bem como executar as suas sentenças.\n§ 1º Não se incluem na competência do Juizado Especial Cível as causas:\nI - referidas no art. 109, incisos II, III e XI da Constituição Federal, as ações de mandado de segurança, de desapropriação, de divisão e demarcação, populares, por improbidade administrativa, execuções fiscais e sobre direitos difusos ou coletivos."
  },

  {
    "themeKeywords": [
      "codigo de etica profissional dos advogados",
      "lei de introducao as normas do direito brasileiro",
      "lindb",
      "lei de liberdade economica",
      "virtualizacao da justica",
      "consequencialismo",
      "erro grosseiro",
      "pje",
      "processo eletronico",
      "estatuto da oab",
      "desconsideracao da personalidade juridica",
      "lei 13655",
      "lei 13874",
      "lei 11419",
      "lei 8906"
    ],
    "statute": "LINDB (Decreto-Lei nº 4.657/1942), Lei de Liberdade Econômica e Lei do Processo Eletrônico",
    "article": "LINDB Arts. 20, 21, 22, 28 c/c Lei nº 13.874/2019 e Lei nº 11.419/2006",
    "literalText": "LINDB (Decreto-Lei nº 4.657/1942), Art. 20. Nas esferas administrativa, controladora e judicial, não se decidirá com base em valores jurídicos abstratos sem que sejam consideradas as consequências práticas da decisão.\nParágrafo único. A motivação demonstrará a necessidade e a adequação da medida imposta ou da invalidação de ato, contrato, ajuste, processo ou norma administrativa, inclusive em face das possíveis alternativas.\nArt. 21. A decisão que, nas esferas administrativa, controladora ou judicial, decretar a invalidação de ato, contrato, ajuste, processo ou norma administrativa deverá indicar de modo expresso as suas consequências jurídicas e administrativas.\nArt. 22. Na interpretação de normas sobre gestão pública, serão considerados os obstáculos e as dificuldades reais do gestor e as exigências das políticas públicas a seu cargo, sem prejuízo dos direitos dos administrados.\nArt. 28. O agente público responderá pessoalmente por suas decisões ou opiniões técnicas em caso de dolo ou erro grosseiro.\n\nLei nº 13.874/2019 (Declaração de Direitos de Liberdade Econômica), Art. 1º. Fica instituída a Declaração de Direitos de Liberdade Econômica, que estabelece normas de proteção à livre iniciativa e ao livre exercício de atividade econômica e disposições sobre a atuação do Estado como agente normativo e regulador.\nCódigo Civil, Art. 50 (Redação da Lei 13.874/2019). Em caso de abuso da personalidade jurídica, caracterizado pelo desvio de finalidade ou pela confusão patrimonial, pode o juiz, a requerimento da parte ou do Ministério Público quando lhe couber intervir no processo, desconsiderá-la para que os efeitos de certas e determinadas relações de obrigações sejam estendidos aos bens particulares de administradores ou de sócios da pessoa jurídica beneficiados direta ou indiretamente pelo abuso.\n§ 1º Para os fins do disposto neste artigo, desvio de finalidade é a utilização da pessoa jurídica com o propósito de lesar credores e para a prática de atos ilícitos de qualquer natureza.\n§ 2º Entende-se por confusão patrimonial a ausência de separação de fato entre os patrimônios.\n\nLei nº 11.419/2006 (Informatização do Processo Judicial), Art. 5º. As intimações serão feitas por meio eletrônico em portal próprio aos que se cadastrarem na forma do art. 2º desta Lei, dispensando-se a publicação no órgão oficial, inclusive eletrônico.\n§ 1º Considerar-se-á realizada a intimação no dia em que o intimando efetivar a consulta eletrônica ao teor da intimação, certificando-se nos autos a sua realização."
  }
,

  {
    "themeKeywords": [
      "lei de introducao as normas do direito brasileiro",
      "lindb",
      "das pessoas",
      "bens. diferentes classes",
      "personalidade juridica",
      "capacidade civil",
      "bens publicos",
      "bens particulares",
      "artigo 1",
      "artigo 3",
      "artigo 40",
      "artigo 79",
      "artigo 98"
    ],
    "statute": "Código Civil (Lei nº 10.406/2002) e LINDB (Decreto-Lei nº 4.657/1942)",
    "article": "CC Arts. 1º a 5º, 40 a 50, 98 a 103 c/c LINDB Arts. 1º a 6º",
    "literalText": "Código Civil, Art. 1º Toda pessoa é capaz de direitos e deveres na ordem civil.\nArt. 2º A personalidade civil da pessoa começa do nascimento com vida; mas a lei põe a salvo, desde a concepção, os direitos do nascituro.\nArt. 3º São absolutamente incapazes de exercer pessoalmente os atos da vida civil os menores de 16 (dezesseis) anos.\nArt. 4º São incapazes, relativamente a certos atos ou à maneira de os exercer:\nI - os maiores de dezesseis e menores de dezoito anos;\nII - os ébrios habituais e os viciados em tóxico;\nIII - aqueles que, por causa transitória ou permanente, não puderem exprimir sua vontade;\nIV - os pródigos.\n\nArt. 40. As pessoas jurídicas são de direito público, interno ou externo, e de direito privado.\nArt. 41. São pessoas jurídicas de direito público interno:\nI - a União;\nII - os Estados, o Distrito Federal e os Territórios;\nIII - os Municípios;\nIV - as autarquias, inclusive as associações públicas;\nV - as demais entidades de caráter público criadas por lei.\n\nArt. 44. São pessoas jurídicas de direito privado:\nI - as associações;\nII - as sociedades;\nIII - as fundações;\nIV - as organizações religiosas;\nV - os partidos políticos;\nVI - as empresas individuais de responsabilidade limitada.\n\nArt. 98. São públicos os bens do domínio nacional pertencentes às pessoas jurídicas de direito público interno; todos os outros são particulares, seja qual for a pessoa a que pertencerem.\nArt. 99. São bens públicos:\nI - os de uso comum do povo, tais como os rios, mares, estradas, ruas e praças;\nII - os de uso especial, tais como edifícios ou terrenos destinados a serviço ou estabelecimento da administração federal, estadual, distrital ou municipal, inclusive os de suas autarquias;\nIII - os dominicais, que constituem o patrimônio das pessoas jurídicas de direito público, como objeto de direito pessoal, ou real, de cada uma dessas entidades.\nArt. 100. Os bens públicos de uso comum do povo e os de uso especial são inalienáveis, enquanto conservarem a sua qualificação, na forma que a lei determinar.\nArt. 101. Os bens públicos dominicais podem ser alienados, observadas as exigências da lei.\nArt. 102. Os bens públicos não estão sujeitos a usucapião."
  },

  {
    "themeKeywords": [
      "ato juridico. fato e ato juridico. negocio juridico",
      "negocio juridico",
      "prescrição e decadência",
      "prescricao e decadencia",
      "defeitos do negocio juridico",
      "validade do negocio juridico",
      "nulidade absoluta",
      "nulidade relativa",
      "simulação",
      "fraude contra credores",
      "artigo 104",
      "artigo 138",
      "artigo 166",
      "artigo 189",
      "artigo 205"
    ],
    "statute": "Código Civil (Lei nº 10.406/2002)",
    "article": "Arts. 104, 138 a 157, 166, 171, 189 a 206",
    "literalText": "Art. 104. A validade do negócio jurídico requer:\nI - agente capaz;\nII - objeto lícito, possível, determinado ou determinável;\nIII - forma prescrita ou não defesa em lei.\n\nArt. 138. São anuláveis os negócios jurídicos, quando as declarações de vontade emanarem de erro substancial que poderia ser percebido por pessoa de diligência normal, em face das circunstâncias do negócio.\nArt. 145. São os negócios jurídicos anuláveis por dolo, quando este for a sua causa.\nArt. 151. A coação, para viciar a declaração da vontade, há de ser tal que incuta ao paciente fundado temor de dano iminente e considerável à sua pessoa, à sua família, ou aos seus bens.\nArt. 156. Configura-se o estado de perigo quando alguém, premido da necessidade de salvar-se, ou a pessoa de sua família, de grave dano conhecido pela outra parte, assume obrigação excessivamente onerosa.\nArt. 157. Ocorre a lesão quando uma pessoa, sob premente necessidade, ou por inexperiência, se obriga a prestação manifestamente desproporcional ao valor da prestação oposta.\nArt. 158. Os negócios de transmissão gratuita de bens ou remissão de dívida, se os praticar o devedor já insolvente, ou por eles reduzido à insolvência, ainda quando o ignore, poderão ser anulados pelos credores quirografários, como lesivos dos seus direitos (fraude contra credores).\n\nArt. 166. É nulo o negócio jurídico quando:\nI - celebrado por pessoa absolutamente incapaz;\nII - for ilícito, impossível ou indeterminável o seu objeto;\nIII - o motivo determinante, comum a ambas as partes, for ilícito;\nIV - não revestir a forma prescrita em lei;\nV - for preterida alguma solenidade que a lei considere essencial para a sua validade;\nVI - tiver por objetivo fraudar lei imperativa;\nVII - a lei taxativamente o declarar nulo, ou proibir-lhe a prática, sem cominar sanção.\nArt. 167. É nulo o negócio jurídico simulado, mas subsistirá o que se dissimulou, se for válido na substância e na forma.\n\nArt. 189. Violado o direito, nasce para o titular a pretensão, a qual se extingue, pela prescrição, nos prazos a que aludem os arts. 205 e 206.\nArt. 205. A prescrição ocorre em dez anos, quando a lei não lhe haja fixado prazo menor.\nArt. 206. Prescreve:\n§ 3º Em três anos:\nV - a pretensão de reparação civil.\n§ 5º Em cinco anos:\nI - a pretensão de cobrança de dívidas líquidas constantes de instrumento público ou particular."
  },

  {
    "themeKeywords": [
      "obrigações. características, elementos e princípios",
      "obrigacoes",
      "contratos. princípios. contratos em geral",
      "contratos em geral",
      "funcao social do contrato",
      "boa-fe objetiva",
      "adimplemento",
      "inadimplemento",
      "mora",
      "perdas e danos",
      "clausula penal",
      "artigo 233",
      "artigo 389",
      "artigo 395",
      "artigo 421"
    ],
    "statute": "Código Civil (Lei nº 10.406/2002)",
    "article": "Arts. 247 a 275, 389 a 405, 421 a 424, 476 a 478",
    "literalText": "Art. 389. Não cumprida a obrigação, responde o devedor por perdas e danos, mais juros e atualização monetária segundo índices oficiais regularmente estabelecidos, e honorários de advogado.\nArt. 394. Considera-se em mora o devedor que não efetuar o pagamento e o credor que não quiser recebê-lo no tempo, lugar e forma que a lei ou a convenção estabelecer.\nArt. 395. Responde o devedor pelos prejuízos a que sua mora der causa, mais juros, atualização dos valores monetários segundo índices oficiais regularmente estabelecidos, e honorários de advogado.\nArt. 402. Salvo as exceções expressamente previstas em lei, as perdas e danos devidas ao credor abrangem, além do que ele efetivamente perdeu (dano emergente), o que razoavelmente deixou de lucrar (lucro cessante).\nArt. 406. Quando os juros moratórios não forem convencionados, ou o forem sem taxa estipulada, ou quando forem devidos por força de lei, serão fixados segundo a taxa que estiver em vigor para a mora do pagamento de impostos devidos à Fazenda Nacional (Taxa SELIC).\n\nArt. 421. A liberdade contratual será exercida nos limites da função social do contrato.\nParágrafo único. Nas relações contratuais privadas, prevalecerão o princípio da intervenção mínima e a excepcionalidade da revisão contratual.\nArt. 421-A. Os contratos civis e empresariais presumem-se paritários e simétricos até a presença de elementos concretos que justifiquem o afastamento dessa presunção.\nArt. 422. Os contratantes são obrigados a guardar, assim na conclusão do contrato, como em sua execução, os princípios de probidade e boa-fé.\nArt. 476. Nos contratos bilaterais, nenhum dos contratantes, antes de cumprida a sua obrigação, pode exigir o implemento da do outro (exceptio non adimpleti contractus).\nArt. 478. Nos contratos de execução continuada ou diferida, se a prestação de uma das partes se tornar excessivamente onerosa, com extrema vantagem para a outra, em virtude de acontecimentos extraordinários e imprevisíveis, poderá o devedor pedir a resolução do contrato."
  },

  {
    "themeKeywords": [
      "responsabilidade civil objetiva e subjetiva",
      "responsabilidade civil",
      "direito das coisas",
      "direito patrimonial das famílias",
      "legislação civil",
      "posse",
      "propriedade",
      "alienacao fiduciaria",
      "regime de bens",
      "outorga uxoria",
      "artigo 186",
      "artigo 927",
      "artigo 1196",
      "artigo 1228",
      "artigo 1639"
    ],
    "statute": "Código Civil (Lei nº 10.406/2002)",
    "article": "Arts. 186, 187, 927, 932, 1.196, 1.228, 1.361 e 1.639 a 1.666",
    "literalText": "Art. 186. Aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, ainda que exclusivamente moral, comete ato ilícito.\nArt. 187. Também comete ato ilícito o titular de um direito que, ao exercê-lo, excede manifestamente os limites impostos pelo seu fim econômico ou social, pela boa-fé ou pelos bons costumes (abuso de direito).\nArt. 927. Aquele que, por ato ilícito (arts. 186 e 187), causar dano a outrem, fica obrigado a repará-lo.\nParágrafo único. Haverá obrigação de reparar o dano, independentemente de culpa, nos casos especificados em lei, ou quando a atividade normalmente desenvolvida pelo autor do dano implicar, por sua natureza, risco para os direitos de outrem (responsabilidade objetiva pelo risco da atividade).\n\nArt. 1.196. Considera-se possuidor todo aquele que tem de fato o exercício, pleno ou não, de algum dos poderes inerentes à propriedade.\nArt. 1.228. O proprietário tem a faculdade de usar, gozar e dispor da coisa, e o direito de reavê-la do poder de quem quer que injustamente a possua ou detenha.\n§ 1º O direito de propriedade deve ser exercido em consonância com as suas finalidades econômicas e sociais e de modo que sejam preservados a flora, a fauna, as belezas naturais, o equilíbrio ecológico e o patrimônio histórico e artístico.\n\nArt. 1.361. Considera-se fiduciária a propriedade resolúvel de coisa móvel infungível que o devedor, com escopo de garantia, transfere ao credor.\n§ 1º Constitui-se a propriedade fiduciária com o registro do contrato, celebrado por instrumento público ou particular, que lhe serve de título, no Registro de Títulos e Documentos do domicílio do devedor.\n\nArt. 1.639. É lícito aos nubentes, antes de celebrado o casamento, estipular, quanto aos seus bens, o que lhes aprouver.\n§ 1º O regime de bens entre os cônjuges começa a vigorar desde a data do casamento.\nArt. 1.647. Ressalvado o disposto no art. 1.648, nenhum dos cônjuges pode, sem autorização do outro, exceto no regime da separação absoluta:\nI - alienar ou gravar de ônus real os bens imóveis;\nII - pleitear, como autor ou réu, acerca desses bens ou direitos;\nIII - prestar fiança ou aval;\nIV - fazer doação, não sendo remuneratória, de bens comuns, ou dos que possam integrar futura meação."
  },

  {
    "themeKeywords": [
      "direito empresarial: origem",
      "empresário: classificação",
      "sociedade dependente de autorização",
      "o estabelecimento: conceito",
      "nome empresarial",
      "registro de empresas",
      "prepostos",
      "escrituração",
      "contratos de empresas",
      "empresario",
      "estabelecimento",
      "trespasse",
      "artigo 966",
      "artigo 1113",
      "artigo 1142",
      "artigo 1155"
    ],
    "statute": "Código Civil (Lei nº 10.406/2002) — Livro II (Do Direito de Empresa)",
    "article": "Arts. 966 a 971, 1.113 a 1.118, 1.142 a 1.154, 1.155 a 1.168",
    "literalText": "Art. 966. Considera-se empresário quem exerce profissionalmente atividade econômica organizada para a produção ou a circulação de bens ou de serviços.\nParágrafo único. Não se considera empresário quem exerce profissão intelectual, de natureza científica, literária ou artística, ainda com o concurso de auxiliares ou colaboradores, salvo se o exercício da profissão constituir elemento de empresa.\nArt. 967. É obrigatória a inscrição do empresário no Registro Público de Empresas Mercantis da respectiva sede, antes do início de sua atividade.\nArt. 971. O empresário, cuja atividade rural constitua sua principal profissão, pode, observadas as formalidades de que tratam o art. 968 e seus parágrafos, requerer inscrição no Registro Público de Empresas Mercantis da respectiva sede, caso em que, depois de inscrito, ficará equiparado, para todos os efeitos, ao empresário sujeito a registro.\n\nArt. 1.142. Considera-se estabelecimento todo complexo de bens organizado, para exercício da empresa, por empresário, ou por sociedade empresária.\nArt. 1.144. O contrato que tenha por objeto a alienação, o usufruto ou arrendamento do estabelecimento, só produzirá efeitos quanto a terceiros depois de averbado à margem da inscrição do empresário, ou da sociedade empresária, no Registro Público de Empresas Mercantis, e de publicado na imprensa oficial (trespasse).\nArt. 1.145. Se ao alienante não restarem bens suficientes para solver o seu passivo, a eficácia da alienação do estabelecimento depende do pagamento de todos os credores, ou do consentimento destes, de modo expresso ou tácito, em trinta dias a partir de sua notificação.\nArt. 1.146. O adquirente do estabelecimento responde pelo pagamento dos débitos anteriores à transferência, desde que regularmente contabilizados, continuando o devedor primitivo solidariamente obrigado pelo prazo de um ano, a partir, quanto aos créditos vencidos, da publicação, e, quanto aos outros, da data do vencimento.\nArt. 1.147. Não havendo autorização expressa, o alienante do estabelecimento não pode fazer concorrência ao adquirente, nos cinco anos subsequentes à transferência.\n\nArt. 1.155. Considera-se nome empresarial a firma ou a denominação adotada, de conformidade com este Capítulo, para o exercício de empresa."
  },

  {
    "themeKeywords": [
      "sociedade empresária: classificação e características",
      "liquidação, transformação",
      "responsabilidade dos sócios e administradores. desconsideração da personalidade jurídica",
      "sociedade limitada",
      "desconsideracao da personalidade juridica",
      "artigo 50",
      "dissolucao irregular",
      "sumula 435 stj",
      "tema 981 stj",
      "artigo 1052",
      "artigo 1080"
    ],
    "statute": "Código Civil (Lei nº 10.406/2002) e Lei de Liberdade Econômica",
    "article": "Arts. 50, 981, 997, 1.052, 1.055, 1.080 c/c Lei nº 6.404/1976, Arts. 115 a 117 e 158",
    "literalText": "Art. 50. Em caso de abuso da personalidade jurídica, caracterizado pelo desvio de finalidade ou pela confusão patrimonial, pode o juiz, a requerimento da parte ou do Ministério Público quando lhe couber intervir no processo, desconsiderá-la para que os efeitos de certas e determinadas relações de obrigações sejam estendidos aos bens particulares de administradores ou de sócios da pessoa jurídica beneficiados direta ou indiretamente pelo abuso.\n§ 1º Para os fins do disposto neste artigo, desvio de finalidade é a utilização da pessoa jurídica com o propósito de lesar credores e para a prática de atos ilícitos de qualquer natureza.\n§ 2º Entende-se por confusão patrimonial a ausência de separação de fato entre os patrimônios, caracterizada por:\nI - cumprimento repetitivo pela sociedade de obrigações do sócio ou do administrador ou vice-versa;\nII - transferência de ativos ou de passivos sem efetivas contraprestações, exceto os de valor economicamente insignificante; e\nIII - outros atos de descumprimento da autonomia patrimonial.\n§ 3º A desconsideração da personalidade jurídica pode ser também a inversa, para atingir bens da pessoa jurídica em razão de obrigações do sócio.\n§ 4º A mera existência de grupo econômico sem a presença dos requisitos do caput não autoriza a desconsideração da personalidade jurídica.\n§ 5º Não constitui desvio de finalidade a mera expansão ou a alteração da finalidade original da atividade econômica da pessoa jurídica.\n\nArt. 1.052. Na sociedade limitada, a responsabilidade de cada sócio é restrita ao valor de suas quotas, mas todos respondem solidariamente pela integralização do capital social.\n§ 1º A sociedade limitada pode ser constituída por 1 (uma) ou mais pessoas.\nArt. 1.080. As deliberações infringentes do contrato ou da lei tornam ilimitada a responsabilidade dos sócios que expressamente as aprovaram.\n\nLei nº 6.404/1976 (Sociedades por Ações), Art. 158. O administrador não é pessoalmente responsável pelas obrigações que contrair em nome da sociedade e em virtude de ato regular de gestão; responde, porém, civilmente, pelos prejuízos que causar, quando proceder:\nI - dentro de suas atribuições ou poderes, com culpa ou dolo;\nII - com violação da lei ou do estatuto."
  },

  {
    "themeKeywords": [
      "falência. recuperação judicial e extrajudicial. intervenção e liquidação extrajudicial",
      "falencia",
      "recuperacao judicial",
      "recuperacao extrajudicial",
      "credito tributario",
      "classificacao dos creditos",
      "concurso de credores",
      "lei 11101",
      "artigo 6",
      "artigo 83",
      "artigo 84"
    ],
    "statute": "Lei de Recuperação Judicial e Falência (Lei nº 11.101/2005 com a redação da Lei nº 14.112/2020)",
    "article": "Arts. 6º, 47, 50, 73, 83, 84 e 187",
    "literalText": "Art. 6º A decretação da falência ou o deferimento do processamento da recuperação judicial implica:\nI - suspensão do curso da prescrição das obrigações do devedor sujeitas ao regime desta Lei;\nII - suspensão das execuções ajuizadas contra o devedor, inclusive daquelas dos credores particulares do sócio solidário, relativas a créditos ou obrigações sujeitos à recuperação judicial ou à falência;\nIII - proibição de qualquer forma de retenção, arresto, penhora, sequestro, busca e apreensão e constrição judicial ou extrajudicial sobre os bens do devedor, oriunda de demandas judiciais ou extrajudiciais cujos créditos ou obrigações sujeitem-se à recuperação judicial ou à falência.\n§ 7º-B. O disposto nos incisos I, II e III do caput deste artigo não se aplica às execuções fiscais, admitida a continuação dos atos de constrição no juízo da execução fiscal e a aplicação de medidas de cooperação jurisdicional (art. 69 do CPC), ressalvada a competência do juízo da recuperação judicial para determinar a substituição dos atos de constrição que recaiam sobre bens de capital essenciais à manutenção da atividade empresarial.\n\nArt. 47. A recuperação judicial tem por objetivo viabilizar a superação da situação de crise econômico-financeira do devedor, a fim de permitir a manutenção da fonte produtora, do emprego dos trabalhadores e dos interesses dos credores, promovendo, assim, a preservação da empresa, sua função social e o estímulo à atividade econômica.\n\nArt. 83. A classificação dos créditos na falência obedece à seguinte ordem:\nI - os créditos derivados da legislação trabalhista, limitados a 150 (cento e cinquenta) salários-mínimos por credor, e aqueles decorrentes de acidentes de trabalho;\nII - os créditos com garantia real até o limite do valor do bem gravado;\nIII - os créditos tributários, independentemente da sua natureza e do tempo de constituição, excetuadas as multas tributárias;\nIV - os créditos quirografários;\nV - as multas contratuais e as penas pecuniárias por infração das leis penais ou administrativas, incluídas as multas tributárias;\nVI - os créditos subordinados.\n\nArt. 84. Serão considerados créditos extraconcursais e serão pagos com precedência sobre os mencionados no art. 83 desta Lei:\nI - as remunerações devidas ao administrador judicial e seus auxiliares;\nI-A - as quantias fornecidas à massa falida pelos credores;\nI-B - os créditos em dinheiro decorrentes de financiamento concedido à sociedade em recuperação judicial (DIP financing)."
  },

  {
    "themeKeywords": [
      "lei das sociedades anônimas (lei nº 6.404/1976)",
      "regime jurídicos das empresas estatais",
      "títulos de crédito",
      "propriedade industrial",
      "sociedades anonimas",
      "empresas estatais",
      "lei 6404",
      "lei 13303",
      "titulos de credito",
      "patentes",
      "marcas",
      "inpi",
      "lei 9279"
    ],
    "statute": "Lei das S/A (Lei 6.404/1976), Lei das Estatais (Lei 13.303/2016) e Lei de Propriedade Industrial (Lei 9.279/1996)",
    "article": "Lei 6.404/76 Arts. 1º a 4º; Lei 13.303/2016 Arts. 1º a 4º, 28; Lei 9.279/1996 Arts. 8º a 12",
    "literalText": "Lei nº 6.404/1976 (Sociedades por Ações), Art. 1º A companhia ou sociedade anônima terá o capital dividido em ações, e a responsabilidade dos sócios ou acionistas será limitada ao preço de emissão das ações subscritas ou adquiridas.\nArt. 2º Pode ser objeto da companhia qualquer empresa de fim lucrativo, não contrário à lei, à ordem pública e aos bons costumes.\n§ 1º Qualquer que seja o objeto, a companhia é mercantil e se rege pelas leis e usos do comércio.\nArt. 4º Para os efeitos desta Lei, a companhia é aberta ou fechada conforme os valores mobiliários de sua emissão estejam ou não admitidos à negociação no mercado de valores mobiliários.\n\nLei nº 13.303/2016 (Estatuto Jurídico das Estatais), Art. 1º Esta Lei dispõe sobre o estatuto jurídico da empresa pública, da sociedade de economia mista e de suas subsidiárias, abrangendo toda e qualquer empresa pública e sociedade de economia mista da União, dos Estados, do Distrito Federal e dos Municípios que explore atividade econômica de produção ou comercialização de bens ou de prestação de serviços.\nArt. 3º Empresa pública é a entidade dotada de personalidade jurídica de direito privado, com criação autorizada por lei e com patrimônio próprio, cujo capital social é integralmente detido pela União, pelos Estados, pelo Distrito Federal ou pelos Municípios.\nArt. 4º Sociedade de economia mista é a entidade dotada de personalidade jurídica de direito privado, com criação autorizada por lei, sob a forma de sociedade anônima, cujas ações com direito a voto pertençam em sua maioria à União, aos Estados, ao Distrito Federal, aos Municípios ou a entidade da administração indireta.\n\nLei nº 9.279/1996 (Propriedade Industrial), Art. 8º É patenteável a invenção que atenda aos requisitos de novidade, atividade inventiva e aplicação industrial.\nArt. 9º É patenteável como modelo de utilidade o objeto de uso prático, ou parte deste, suscetível de aplicação industrial, que apresente nova forma ou disposição, envolvendo ato inventivo, que resulte em melhoria funcional no seu uso ou em sua fabricação.\nArt. 122. São suscetíveis de registro como marca os sinais distintivos visualmente perceptíveis, não compreendidos nas proibições legais."
  },
  // ==========================================
  // --- CÓDIGO PENAL: PARTE GERAL (APLICAÇÃO, TEORIA DO CRIME, PENAS E EXTINÇÃO) ---
  // ==========================================
  {
    statute: "Código Penal (Decreto-Lei nº 2.848/1940)",
    article: "Arts. 1º a 6º, 13 a 25 e 28 (Aplicação da Lei Penal e Teoria do Crime)",
    themeKeywords: [
      "aplicação da lei penal", "crime. conceito", "exclusão de ilicitude", "imputabilidade penal",
      "anterioridade", "irretroatividade", "lei penal no tempo", "lei penal no espaço",
      "lugar do crime", "tempo do crime", "ubiquidade", "atividade", "relação de causalidade",
      "tentativa", "desistência voluntária", "arrependimento eficaz", "crime impossível",
      "estado de necessidade", "legítima defesa", "estrito cumprimento de dever legal", "exercício regular de direito"
    ],
    literalText: `> **Art. 1º** Não há crime sem lei anterior que o defina. Não há pena sem prévia cominação legal.
> **Art. 2º** Ninguém pode ser punido por fato que lei posterior deixa de considerar crime, cessando em virtude dela a execução e os efeitos penais da sentença condenatória.
> * **Parágrafo único.** A lei posterior, que de qualquer modo favorecer o agente, aplica-se aos fatos anteriores, ainda que decididos por sentença condenatória transitada em julgado.
> **Art. 3º** A lei excepcional ou temporária, embora decorrido o período de sua duração ou cessadas as circunstâncias que a determinaram, aplica-se ao fato praticado durante sua vigência.
> **Art. 4º** Considera-se praticado o crime no momento da ação ou omissão, ainda que outro seja o momento do resultado.
> **Art. 5º** Aplica-se a lei brasileira, sem prejuízo de convenções, tratados e regras de direito internacional, ao crime cometido no território nacional.
> **Art. 6º** Considera-se praticado o crime no lugar em que ocorreu a ação ou omissão, no todo ou em parte, bem como onde se produziu ou deveria produzir-se o resultado.
> **Art. 13.** O resultado, de que depende a existência do crime, somente é imputável a quem lhe deu causa. Considera-se causa a ação ou omissão sem a qual o resultado não teria ocorrido.
> * **§ 1º** A superveniência de causa relativamente independente exclui a imputação quando, por si só, produziu o resultado; os fatos anteriores, entretanto, imputam-se a quem os praticou.
> * **§ 2º** A omissão é penalmente relevante quando o omitente devia e podia agir para evitar o resultado. O dever de agir incumbe a quem: a) tenha por lei obrigação de cuidado, proteção ou vigilância; b) de outra forma, assumiu a responsabilidade de impedir o resultado; c) com seu comportamento anterior, criou o risco da ocorrência do resultado.
> **Art. 14.** Diz-se o crime: I - consumado, quando nele se reúnem todos os elementos de sua definição legal; II - tentado, quando, iniciada a execução, não se consuma por circunstâncias alheias à vontade do agente.
> **Art. 15.** O agente que, voluntariamente, desiste de prosseguir na execução ou impede que o resultado se produza, só responde pelos atos já praticados.
> **Art. 16.** Nos crimes cometidos sem violência ou grave ameaça à pessoa, reparado o dano ou restituída a coisa, até o recebimento da denúncia ou da queixa, por ato voluntário do agente, a pena será reduzida de um a dois terços.
> **Art. 17.** Não se pune a tentativa quando, por ineficácia absoluta do meio ou por absoluta impropriedade do objeto, é impossível consumar-se o crime.
> **Art. 23.** Não há crime quando o agente pratica o fato: I - em estado de necessidade; II - em legítima defesa; III - em estrito cumprimento de dever legal ou no exercício regular de direito. Parágrafo único. O agente, em qualquer das hipóteses deste artigo, responderá pelo excesso doloso ou culposo.
> **Art. 24.** Considera-se em estado de necessidade quem pratica o fato para salvar de perigo atual, que não provocou por sua vontade, nem podia de outro modo evitar, direito próprio ou alheio, cujo sacrifício, nas circunstâncias, não era razoável exigir-se.
> **Art. 25.** Entende-se em legítima defesa quem, usando moderadamente dos meios necessários, repele injusta agressão, atual ou iminente, a direito seu ou de outrem.
> **Art. 28.** Não excluem a imputabilidade penal: I - a emoção ou a paixão; II - a embriaguez, voluntária ou culposa, pelo álcool ou por substância de efeitos análogos.`
  },
  {
    statute: "Código Penal (Decreto-Lei nº 2.848/1940)",
    article: "Arts. 49 a 52, 91 a 92 e 107 a 118 (Pena de Multa, Efeitos da Condenação e Extinção da Punibilidade)",
    themeKeywords: [
      "efeitos da condenação e da reabilitação", "pena de multa criminal", "extinção da punibilidade",
      "efeitos da condenação", "reabilitação", "dias-multa", "prescrição penal", "decadência",
      "perda de bens", "perda de cargo público", "confisco alargado", "reparação do dano"
    ],
    literalText: `> **Art. 49.** A pena de multa consiste no pagamento ao fundo penitenciário da quantia calculada em dias-multa. Será, no mínimo, de 10 e, no máximo, de 360 dias-multa.
> * **§ 1º** O valor do dia-multa será fixado pelo juiz não podendo ser inferior a um trigésimo do maior salário mínimo mensal vigente ao tempo do fato, nem superior a 5 vezes esse salário.
> **Art. 51.** Transitada em julgado a sentença condenatória, a multa será executada perante o juiz da execução penal e será considerada dívida de valor, aplicáveis as normas relativas à dívida ativa da Fazenda Pública, inclusive no que concerne às causas interruptivas e suspensivas da prescrição.
> **Art. 91.** São efeitos da condenação: I - tornar certa a obrigação de indenizar o dano causado pelo crime; II - a perda em favor da União, ressalvado o direito do lesado ou de terceiro de boa-fé: a) dos instrumentos do crime, desde que consistam em coisas cujo fabrico, alienação, uso, porte ou detenção constitua fato ilícito; b) do produto do crime ou de qualquer bem ou valor que constitua proveito auferido pelo agente com a prática do fato criminoso.
> * **§ 1º** Poderá ser decretada a perda de bens ou valores equivalentes ao produto ou proveito do crime quando estes não forem encontrados ou quando se localizarem no exterior.
> **Art. 91-A.** Na hipótese de condenação por infrações às quais a lei comine pena máxima superior a 6 anos de reclusão, poderá ser decretada a perda, como produto ou proveito do crime, dos bens correspondentes à diferença entre o valor do patrimônio do condenado e aquele que seja compatível com o seu rendimento lícito.
> **Art. 92.** São também efeitos da condenação: I - a perda de cargo, função pública ou mandato eletivo: a) nos crimes aplicados com pena privativa de liberdade por tempo igual ou superior a um ano, nos crimes praticados com abuso de poder ou violação de dever para com a Administração Pública; b) quando for aplicada pena privativa de liberdade por tempo superior a 4 anos nos demais casos.
> * **Parágrafo único.** Os efeitos de que trata este artigo não são automáticos, devendo ser motivadamente declarados na sentença.
> **Art. 107.** Extingue-se a punibilidade: I - pela morte do agente; II - pela anistia, graça ou indulto; III - pela retroatividade de lei que não mais considera o fato como criminoso; IV - pela prescrição, decadência ou perempção; V - pela renúncia do direito de queixa ou pelo perdão aceito, nos crimes de ação privada; VI - pela retratação do agente, nos casos em que a lei a admite; IX - pelo perdão judicial, nos casos previstos em lei.
> **Art. 109.** A prescrição, antes de transitar em julgado a sentença final, salvo o disposto no § 1º do art. 110 deste Código, regula-se pelo máximo da pena privativa de liberdade cominada ao crime.`
  },
  // ==========================================
  // --- CÓDIGO PENAL E LEIS ESPECIAIS: CRIMES CONTRA A ADMINISTRAÇÃO E ORDEM ECONÔMICA ---
  // ==========================================
  {
    statute: "Código Penal (Decreto-Lei nº 2.848/1940)",
    article: "Arts. 312 a 327, 334, 334-A e 337-E a 337-P (Crimes Contra a Administração e Licitações)",
    themeKeywords: [
      "crimes contra a administração pública", "crimes em licitações", "acessoriedade administrativa",
      "peculato", "concussão", "corrupção passiva", "prevaricação", "advocacia administrativa",
      "funcionário público", "contrabando", "descaminho", "contratação direta ilegal",
      "frustração do caráter concorrencial", "modificação irregular de contrato", "licitações"
    ],
    literalText: `> **Art. 312.** Apropriar-se o funcionário público de dinheiro, valor ou qualquer outro bem móvel, público ou particular, de que tem a posse em razão do cargo, ou desviá-lo, em proveito próprio ou alheio: Pena - reclusão, de dois a doze anos, e multa.
> * **§ 1º** Aplica-se a mesma pena, se o funcionário público, embora não tendo a posse do dinheiro, quantia ou bem, o subtrai, ou concorre para que seja subtraído, em proveito próprio ou alheio, valendo-se de facilidade que lhe proporciona a qualidade de funcionário.
> * **§ 2º** Se o funcionário concorre culposamente para o crime de outrem: Pena - detenção, de três meses a um ano.
> * **§ 3º** No caso do § 2º, a reparação do dano, se precede à sentença irrecorrível, extingue a punibilidade; se lhe é posterior, reduz de metade a pena imposta.
> **Art. 316.** Exigir, para si ou para outrem, direta ou indiretamente, ainda que fora da função ou antes de assumi-la, mas em razão dela, vantagem indevida: Pena - reclusão, de 2 a 12 anos, e multa.
> **Art. 317.** Solicitar ou receber, para si ou para outrem, direta ou indiretamente, ainda que fora da função ou antes de assumi-la, mas em razão dela, vantagem indevida, ou aceitar promessa de tal vantagem: Pena - reclusão, de 2 a 12 anos, e multa.
> **Art. 319.** Retardar ou deixar de praticar, indevidamente, ato de ofício, ou praticá-lo contra disposição expressa de lei, para satisfazer interesse ou sentimento pessoal: Pena - detenção, de três meses a um ano, e multa.
> **Art. 327.** Considera-se funcionário público, para os efeitos penais, quem, embora transitoriamente ou sem remuneração, exerce cargo, emprego ou função pública.
> * **§ 1º** Equipara-se a funcionário público quem exerce cargo, emprego ou função em entidade paraestatal, e quem trabalha para empresa prestadora de serviço contratada ou conveniada para a execução de atividade típica da Administração Pública.
> * **§ 2º** A pena será aumentada da terça parte quando os autores dos crimes previstos neste Capítulo forem ocupantes de cargos em comissão ou de função de direção ou assessoramento de órgão da administração direta, sociedade de economia mista, empresa pública ou fundação instituída pelo poder público.
> **Art. 334.** Iludir, no todo ou em parte, o pagamento de direito ou imposto devido pela entrada, pela saída ou pelo consumo de mercadoria: Pena - reclusão, de 1 a 4 anos.
> **Art. 334-A.** Importar ou exportar mercadoria proibida: Pena - reclusão, de 2 a 5 anos.
> **Art. 337-E.** Admitir, possibilitar ou dar causa à contratação direta fora das hipóteses previstas em lei: Pena - reclusão, de 4 a 8 anos, e multa.
> **Art. 337-F.** Frustrar ou fraudar, com o intuito de obter para si ou para outrem vantagem decorrente da adjudicação do objeto da licitação, o caráter competitivo do processo licitatório: Pena - reclusão, de 4 a 8 anos, e multa.
> **Art. 337-H.** Admitir, possibilitar ou dar causa a qualquer modificação ou vantagem, inclusive prorrogação contratual, em favor do contratado, durante a execução dos contratos celebrados com a Administração Pública, sem autorização em lei, no edital da licitação ou nos respectivos instrumentos contratuais: Pena - reclusão, de 4 a 8 anos, e multa.`
  },
  {
    statute: "Leis Penais Especiais (Leis nº 8.137/90, 7.492/86, 9.613/98 e 13.869/19)",
    article: "Crimes Econômicos, Tributários, SFN, Lavagem de Dinheiro e Abuso de Autoridade",
    themeKeywords: [
      "crimes contra o sistema financeiro nacional", "crimes contra a ordem econômica e lei anticorrupção",
      "combate à lavagem", "crimes de abuso de autoridade", "lei de improbidade administrativa",
      "sistema financeiro nacional", "ordem econômica", "lavagem de capitais", "abuso de autoridade",
      "gestão fraudulenta", "evasão de divisas", "súmula vinculante 24"
    ],
    literalText: `> **Lei nº 8.137/1990, Art. 1º** Constitui crime contra a ordem tributária suprimir ou reduzir tributo, ou contribuição social e qualquer acessório, mediante as seguintes condutas: I - omitir informação, ou prestar declaração falsa às autoridades fazendárias; II - fraudar a fiscalização tributária, inserindo elementos inexatos, ou omitindo operação de qualquer natureza, em documento ou livro exigido pela lei fiscal; III - falsificar ou alterar nota fiscal, fatura, duplicata, nota de venda, ou qualquer outro documento relativo à operação tributável; IV - elaborar, distribuir, fornecer, emitir ou utilizar documento que saiba ou deva saber falso ou inexato: Pena - reclusão de 2 a 5 anos, e multa.
> * **Súmula Vinculante nº 24 do STF:** Não se tipifica crime material contra a ordem tributária, previsto no art. 1º, incisos I a IV, da Lei nº 8.137/90, antes do lançamento definitivo do tributo.
> **Lei nº 7.492/1986 (Crimes Contra o SFN), Art. 4º** Gerir fraudulentamente instituição financeira: Pena - Reclusão, de 3 a 12 anos, e multa. Parágrafo único. Se a gestão é temerária: Pena - Reclusão, de 2 a 8 anos, e multa.
> **Art. 5º** Apropriar-se, quaisquer das pessoas mencionadas no art. 25 desta lei, de dinheiro, título, valor ou qualquer outro bem móvel de que tem a posse, ou desviá-lo em proveito próprio ou alheio: Pena - Reclusão, de 2 a 6 anos, e multa.
> **Art. 16.** Fazer operar, sem a devida autorização, ou com autorização obtida mediante declaração falsa, instituição financeira, inclusive de distribuição de valores mobiliários ou de câmbio: Pena - Reclusão, de 1 a 4 anos, e multa.
> **Art. 22.** Efetuar operação de câmbio não autorizada, de que resulte a saída de moeda ou divisa do País, ou nele mantê-las sob a forma de depósitos não declarados à repartição federal competente: Pena - Reclusão, de 2 a 6 anos, e multa.
> **Lei nº 9.613/1998 (Lavagem de Capitais), Art. 1º** Ocultar ou dissimular a natureza, origem, localização, disposição, movimentação ou propriedade de bens, direitos ou valores provenientes, direta ou indiretamente, de infração penal. Pena: reclusão, de 3 a 10 anos, e multa.
> * **§ 1º** Incorre na mesma pena quem, para ocultar ou dissimular a utilização de bens, direitos ou valores provenientes de infração penal: I - os converte em ativos lícitos; II - os adquire, recebe, troca, negocia, dá ou aceita em garantia, guarda, tem em depósito, movimenta ou transfere; III - importa ou exporta bens com valores não correspondentes aos verdadeiros.
> * **§ 4º** A pena será aumentada de um a dois terços se os crimes definidos nesta Lei forem cometidos de forma reiterada ou por intermédio de organização criminosa.
> **Lei nº 13.869/2019 (Abuso de Autoridade), Art. 1º** Esta Lei define os crimes de abuso de autoridade, cometidos por agente público, servidor ou não, que, no exercício de suas funções ou a pretexto de exercê-las, abuse do poder que lhe tenha sido atribuído.
> * **§ 1º** As condutas descritas nesta Lei constituem crime de abuso de autoridade quando praticadas pelo agente com a finalidade específica de prejudicar outrem ou beneficiar a si mesmo ou a terceiro, ou, ainda, por mero capricho ou satisfação pessoal.
> * **§ 2º** A divergência na interpretação de lei ou na avaliação de fatos e provas não configura abuso de autoridade.`
  },
  // ==========================================
  // --- CÓDIGO DE PROCESSO PENAL: PRINCÍPIOS, INQUÉRITO, AÇÃO PENAL, COMPETÊNCIA E ANPP ---
  // ==========================================
  {
    statute: "Código de Processo Penal (Decreto-Lei nº 3.689/1941)",
    article: "Arts. 1º a 3º-F, 4º a 23, 24 a 44 (Princípios, Inquérito Policial e Ação Penal Pública e Privada)",
    themeKeywords: [
      "princípios gerais do direito processual penal e aplicação da lei processual no tempo",
      "sujeitos da relação processual", "inquérito policial", "ação penal", "ação penal pública",
      "denúncia", "ação penal privada", "queixa", "ação penal pública e privada no código penal",
      "tempus regit actum", "juiz das garantias", "indisponibilidade", "oficiosidade", "oportunidade"
    ],
    literalText: `> **Art. 2º** A lei processual penal aplicar-se-á desde logo, sem prejuízo da validade dos atos realizados sob a vigência da lei anterior.
> **Art. 3º-A.** O processo penal terá estrutura acusatória, vedadas a iniciativa do juiz na fase de investigação e a substituição da atuação probatória do órgão de acusação.
> **Art. 3º-B.** O juiz das garantias é responsável pelo controle da legalidade da investigação criminal e pela salvaguarda dos direitos individuais cuja franquia tenha sido reservada à autorização judicial.
> **Art. 4º** A polícia judiciária será exercida pelas autoridades policiais no território de suas respectivas circunscrições e terá por fim a apuração das infrações penais e da sua autoria.
> **Art. 5º** Nos crimes de ação pública o inquérito policial será iniciado: I - de ofício; II - mediante requisição da autoridade judiciária ou do Ministério Público, ou a requerimento do ofendido ou de quem tiver qualidade para representá-lo.
> **Art. 17.** A autoridade policial não poderá mandar arquivar autos de inquérito.
> **Art. 24.** Nos crimes de ação pública, esta será promovida por denúncia do Ministério Público, mas dependerá, quando a lei o exigir, de requisição do Ministro da Justiça, ou de representação do ofendido ou de quem tiver qualidade para representá-lo.
> **Art. 28.** Ordenado o arquivamento do inquérito policial ou de quaisquer peças informativas pelo órgão do Ministério Público, este comunicará à vítima, ao investigado e à autoridade policial e encaminhará os autos para a instância de revisão ministerial para fins de homologação, na forma da lei.
> **Art. 29.** Será admitida ação privada nos crimes de ação pública, se esta não for intentada no prazo legal, cabendo ao Ministério Público aditar a queixa, repudiá-la e oferecer denúncia substitutiva, intervir em todos os termos do processo, fornecer elementos de prova, interpor recurso e, a todo tempo, no caso de negligência do querelante, retomar a ação como parte principal.
> **Art. 30.** Ao ofendido ou a quem tenha qualidade para representá-lo caberá intentar a ação privada.
> **Art. 38.** Salvo disposição em contrário, o ofendido, ou seu representante legal, decairá no direito de queixa ou de representação, se não o exercer dentro do prazo de seis meses, contado do dia em que vier a saber quem é o autor do crime.
> **Art. 41.** A denúncia ou queixa conterá a exposição do fato criminoso, com todas as suas circunstâncias, a qualificação do acusado ou esclarecimentos pelos quais se possa identificá-lo, a classificação do crime e, quando necessário, o rol das testemunhas.`
  },
  {
    statute: "Código de Processo Penal (Decreto-Lei nº 3.689/1941)",
    article: "Arts. 28-A, 63 a 68, 69 a 91 (ANPP, Ação Civil Ex Delicto, Jurisdição e Competência)",
    themeKeywords: [
      "ação civil", "jurisdição", "competência", "justiça penal negociada",
      "acordo de não persecução penal", "anpp", "ação civil ex delicto", "justiça federal",
      "competência territorial", "conexão e continência", "competência penal"
    ],
    literalText: `> **Art. 28-A.** Não sendo caso de arquivamento e tendo o investigado confessado formal e circunstancialmente a prática de infração penal sem violência ou grave ameaça e com pena mínima inferior a 4 (quatro) anos, o Ministério Público poderá propor acordo de não persecução penal, desde que necessário e suficiente para reprovação e prevenção do crime, mediante as seguintes condições ajustadas cumulativa e alternativamente:
> * **I -** reparar o dano ou restituir a coisa à vítima, exceto na impossibilidade de fazê-lo;
> * **II -** renunciar voluntariamente a bens e direitos indicados pelo Ministério Público como instrumentos, produto ou proveito do crime;
> * **III -** prestar serviço à comunidade ou a entidades públicas por período correspondente à pena mínima cominada ao delito diminuída de um a dois terços;
> * **IV -** pagar prestação pecuniária, a ser estipulada nos termos do art. 45 do Decreto-Lei nº 2.848, de 7 de dezembro de 1940 (Código Penal), a entidade pública ou de interesse social;
> * **V -** cumprir, por prazo determinado, outra condição indicada pelo Ministério Público, desde que proporcional e compatível com a infração penal imputada.
> * **§ 13.** Cumprido integralmente o acordo de não persecução penal, o juízo competente decretará a extinção de punibilidade.
> **Art. 63.** Transitada em julgado a sentença condenatória, poderão promover-lhe a execução, no juízo cível, para o efeito da reparação do dano, o ofendido, seu representante legal ou seus herdeiros.
> * **Parágrafo único.** Transitada em julgado a sentença condenatória, a execução poderá ser efetuada pelo valor fixado nos termos do inciso IV do caput do art. 387 deste Código sem prejuízo da liquidação para a apuração do dano efetivamente sofrido.
> **Art. 64.** Sem prejuízo do disposto no artigo anterior, a ação para ressarcimento do dano poderá ser proposta no juízo cível, contra o autor do crime e, se for caso, contra o responsável civil.
> **Art. 69.** Determinará a competência jurisdicional: I - o lugar da infração; II - o domicílio ou residência do réu; III - a natureza da infração; IV - a distribuição; V - a conexão ou continência; VI - a prevenção; VII - a prerrogativa de função.
> **Art. 70.** A competência será, de regra, determinada pelo lugar em que se consumar a infração, ou, no caso de tentativa, pelo lugar em que for praticado o último ato de execução.
> **Art. 78.** Na determinação da competência por conexão ou continência, serão observadas as seguintes regras: I - no concurso entre a competência do júri e a de outro órgão da jurisdição comum, prevalecerá a competência do júri; II - no concurso de jurisdições da mesma categoria: a) preponderará a do lugar da infração, à qual for cominada a pena mais grave; b) prevalecerá a do lugar em que houver ocorrido o maior número de infrações, se as penas forem de igual gravidade; c) firmar-se-á a competência pela prevenção, nos outros casos; III - no concurso de jurisdições de diversas categorias, predominará a de maior graduação; IV - no concurso entre a jurisdição comum e a especial, prevalecerá esta.`
  },
  // =========================================================================
  // DIREITO DO TRABALHO E PROCESSUAL DO TRABALHO (CLT & CF/88)
  // =========================================================================
  {
    statute: "Consolidação das Leis do Trabalho e CF/88",
    article: "Arts. 2º, 3º, 9º, 10-A, 442, 442-B, 443, 444, 448-A, 468 e Art. 7º da CF/88",
    themeKeywords: [
      "conceito", "fontes", "relação de trabalho", "relação de emprego", "distinção",
      "sujeitos da relação de emprego", "contrato individual do trabalho", "reforma trabalhista",
      "empregador", "empregado", "grupo econômico", "sucessão de empregadores", "sócio retirante"
    ],
    literalText: `> **Art. 2º.** Considera-se empregador a empresa, individual ou coletiva, que, assumindo os riscos da atividade econômica, admite, assalaria e dirige a prestação pessoal de serviço.
> * **§ 1º.** Equiparam-se ao empregador, para os efeitos exclusivos da relação de emprego, os profissionais liberais, as instituições de beneficência, as associações recreativas ou outras instituições sem fins lucrativos, que admitirem trabalhadores como empregados.
> * **§ 2º.** Sempre que uma ou mais empresas, tendo, embora, cada uma delas, personalidade jurídica própria, estiverem sob a direção, controle ou administração de outra, ou ainda quando guardem entre si laços de direção ou coordenação em face do interesse integrado, constituirão grupo econômico, sendo solidariamente responsáveis para os efeitos da relação de emprego.
> * **§ 3º.** Não caracteriza grupo econômico a mera identidade de sócios, sendo necessárias, para a configuração do grupo, a demonstração do interesse integrado, a efetiva comunhão de interesses e a atuação conjunta das empresas dele integrantes.
> **Art. 3º.** Considera-se empregado toda pessoa física que prestar serviços de natureza não eventual a empregador, sob a dependência deste e mediante salário.
> * **Parágrafo único.** Não haverá distinções relativas à espécie de emprego e à condição de trabalhador, nem entre o trabalho intelectual, técnico e manual.
> **Art. 9º.** Serão nulos de pleno direito os atos praticados com o objetivo de desvirtuar, impedir ou fraudar a aplicação dos preceitos contidos na presente Consolidação.
> **Art. 10-A.** O sócio retirante responde subsidiariamente pelas obrigações trabalhistas da sociedade relativas ao período em que figurou como sócio, somente em ações ajuizadas até dois anos depois de averbada a modificação do contrato, observada a seguinte ordem de preferência: I - a sociedade devedora; II - os sócios atuais; e III - os sócios retirantes.
> * **Parágrafo único.** O sócio retirante responderá solidariamente com os demais quando ficar comprovada fraude na alteração societária decorrente da modificação do contrato.
> **Art. 442.** Contrato individual de trabalho é o acordo tácito ou expresso, correspondente à relação de emprego.
> **Art. 442-B.** A contratação do autônomo, cumpridas por este todas as formalidades legais, com ou sem exclusividade, de forma contínua ou não, afasta a qualidade de empregado prevista no art. 3º desta Consolidação.
> **Art. 443.** O contrato individual de trabalho poderá ser acordado tácita ou expressamente, verbalmente ou por escrito, por prazo determinado ou indeterminado, ou para prestação de trabalho intermitente.
> **Art. 444.** As relações contratuais de trabalho podem ser objeto de livre estipulação das partes interessadas em tudo quanto não contravenha às disposições de proteção ao trabalho, aos contratos coletivos que lhes sejam aplicáveis e às decisões das autoridades competentes.
> * **Parágrafo único.** A livre estipulação a que se refere o caput deste artigo aplica-se às hipóteses previstas no art. 611-A desta Consolidação, com a mesma eficácia legal e preponderância sobre os instrumentos coletivos, no caso de empregado portador de diploma de nível superior e que perceba salário mensal igual ou superior a duas vezes o limite máximo dos benefícios do Regime Geral de Previdência Social.
> **Art. 468.** Nos contratos individuais de trabalho só é lícita a alteração das respectivas condições por mútuo consentimento, e ainda assim desde que não resultem, direta ou indiretamente, prejuízos ao empregado, sob pena de nulidade da cláusula infringente desta garantia.`
  },
  {
    statute: "Consolidação das Leis do Trabalho e Lei 605/1949",
    article: "Arts. 58, 59, 59-A, 59-B, 67, 71, 129, 130, 134, 137, 457, 458 e 461 da CLT",
    themeKeywords: [
      "duração do trabalho", "jornada de trabalho", "horas extras", "banco de horas",
      "férias", "descanso semanal remunerado", "remuneração e salário: conceito e distinção",
      "remuneração", "salário", "programa emergencial de manutenção de emprego"
    ],
    literalText: `> **Art. 58.** A duração normal do trabalho, para os empregados em qualquer atividade privada, não excederá de 8 (oito) horas diárias, desde que não seja fixado expressamente outro limite.
> * **§ 1º.** Não serão descontadas nem computadas como jornada extraordinária as variações de horário no registro de ponto não excedentes de cinco minutos, observado o limite máximo de dez minutos diários.
> * **§ 2º.** O tempo despendido pelo empregado desde a sua residência até a efetiva ocupação do posto de trabalho e para o seu retorno, caminhando ou por qualquer meio de transporte, inclusive o fornecido pelo empregador, não será computado na jornada de trabalho, por não ser tempo à disposição do empregador.
> **Art. 59.** A duração diária do trabalho poderá ser acrescida de horas extras, em número não excedente de duas, por acordo individual, convenção coletiva ou acordo coletivo de trabalho.
> * **§ 1º.** A remuneração da hora extra será, pelo menos, 50% (cinquenta por cento) superior à da hora normal.
> * **§ 5º.** O banco de horas poderá ser pactuado por acordo individual escrito, desde que a compensação ocorra no período máximo de seis meses.
> **Art. 59-A.** Em exceção ao disposto no art. 59 desta Consolidação, é facultado às partes, mediante acordo individual escrito, convenção coletiva ou acordo coletivo de trabalho, estabelecer horário de trabalho de doze horas seguidas por trinta e seis horas ininterruptas de descanso, observados ou indenizados os intervalos para repouso e alimentação.
> **Art. 67.** Será assegurado a todo empregado um descanso semanal remunerado de 24 (vinte e quatro) horas consecutivas, o qual, salvo motivo de conveniência pública ou necessidade imperiosa do serviço, deverá coincidir com o domingo, no todo ou em parte.
> **Art. 71.** Em qualquer trabalho contínuo, cuja duração exceda de 6 (seis) horas, é obrigatória a concessão de um intervalo para repouso ou alimentação, o qual será, no mínimo, de 1 (uma) hora e, salvo acordo escrito ou contrato coletivo em contrário, não poderá exceder de 2 (duas) horas.
> * **§ 4º.** A não concessão ou a concessão parcial do intervalo intrajornada mínimo, para repouso e alimentação, a empregados urbanos e rurais, implica o pagamento, de natureza indenizatória, apenas do período suprimido, com acréscimo de 50% (cinquenta por cento) sobre o valor da remuneração da hora normal de trabalho.
> **Art. 129.** Todo empregado terá direito anualmente ao gozo de um período de férias, sem prejuízo da remuneração.
> **Art. 130.** Após cada período de 12 (doze) meses de vigência do contrato de trabalho, o empregado terá direito a férias, na seguinte proporção: I - 30 dias corridos, quando não houver faltado ao serviço mais de 5 vezes; II - 24 dias corridos, quando houver tido de 6 a 14 faltas; III - 18 dias corridos, quando houver tido de 15 a 23 faltas; IV - 12 dias corridos, quando houver tido de 24 a 32 faltas.
> **Art. 134.** As férias serão concedidas por ato do empregador, em um só período, nos 12 (doze) meses subsequentes à data em que o empregado tiver adquirido o direito.
> * **§ 1º.** Desde que haja concordância do empregado, as férias poderão ser usufruídas em até três períodos, sendo que um deles não poderá ser inferior a quatorze dias corridos e os demais não poderão ser inferiores a cinco dias corridos, cada um.
> * **§ 3º.** É vedado o início das férias no período de dois dias que antecede feriado ou dia de repouso semanal remunerado.
> **Art. 137.** Sempre que as férias forem concedidas após o prazo de que trata o art. 134, o empregador pagará em dobro a respectiva remuneração.
> **Art. 457.** Compreendem-se na remuneração do empregado, para todos os efeitos legais, além do salário devido e pago diretamente pelo empregador, como contraprestação do serviço, as gorjetas que receber.
> * **§ 1º.** Integram o salário a importância fixa estipulada, as gratificações legais e as comissões pagas pelo empregador.
> * **§ 2º.** As importâncias, ainda que habituais, pagas a título de ajuda de custo, auxílio-alimentação, vedado seu pagamento em dinheiro, diárias para viagem, prêmios e abonos não integram a remuneração do empregado, não se incorporam ao contrato de trabalho e não constituem base de incidência de qualquer encargo trabalhista e previdenciário.
> **Art. 461.** Sendo idêntica a função, a todo trabalho de igual valor, prestado ao mesmo empregador, no mesmo estabelecimento empresarial, corresponderá igual salário, sem distinção de sexo, etnia, nacionalidade ou idade.`
  },
  {
    statute: "Consolidação das Leis do Trabalho e CF/88",
    article: "Arts. 477, 482, 483, 484-A, 611-A, 611-B, 619, 620 da CLT e Art. 8º da CF/88",
    themeKeywords: [
      "extinção do contrato de trabalho", "direito coletivo do trabalho", "reforma trabalhista",
      "negociado sobre o legislado", "justa causa", "rescisão indireta", "acordo mútuo", "sindicato"
    ],
    literalText: `> **Art. 477.** Na extinção do contrato de trabalho, o empregador deverá proceder à anotação na Carteira de Trabalho e Previdência Social, comunicar a dispensa aos órgãos competentes e realizar o pagamento das verbas rescisórias no prazo e na forma estabelecidos neste artigo.
> * **§ 6º.** A entrega ao empregado de documentos que comprovem a comunicação da extinção contratual aos órgãos competentes bem como o pagamento dos valores constantes do instrumento de rescisão ou recibo de quitação deverão ser efetuados até dez dias contados do término do contrato.
> **Art. 482.** Constituem justa causa para rescisão do contrato de trabalho pelo empregador: a) ato de improbidade; b) incontinência de conduta ou mau procedimento; c) negociação habitual por conta própria ou alheia sem permissão do empregador; d) condenação criminal do empregado, passada em julgado, caso não tenha havido suspensão da execução da pena; e) desídia no desempenho das respectivas funções; f) embriaguez habitual ou em serviço; g) violação de segredo da empresa; h) ato de indisciplina ou de insubordinação; i) abandono de emprego; j) ato lesivo da honra ou da boa fama praticado no serviço contra qualquer pessoa, ou ofensas físicas; k) ato lesivo da honra ou ofensas físicas praticadas contra o empregador e superiores hierárquicos; l) prática constante de jogos de azar; m) perda da habilitação ou dos requisitos estabelecidos em lei para o exercício da profissão, em decorrência de conduta dolosa do empregado.
> **Art. 483.** O empregado poderá considerar rescindido o contrato e pleitear a devida indenização quando: a) forem exigidos serviços superiores às suas forças, defesos por lei, contrários aos bons costumes, ou alheios ao contrato; b) for tratado pelo empregador ou por seus superiores hierárquicos com rigor excessivo; c) correr perigo manifesto de mal considerável; d) não cumprir o empregador as obrigações do contrato; e) praticar o empregador ou seus prepostos ato lesivo da honra e boa fama; f) o empregador ou seus prepostos ofenderem-no fisicamente; g) o empregador reduzir o seu trabalho, sendo este por peça ou tarefa, de forma a afetar sensivelmente a importância dos salários.
> **Art. 484-A.** O contrato de trabalho poderá ser extinto por acordo entre empregado e empregador, caso em que serão devidas as seguintes verbas trabalhistas: I - por metade: a) o aviso prévio, se indenizado; e b) a indenização sobre o saldo do Fundo de Garantia do Tempo de Serviço, prevista no § 1º do art. 18 da Lei nº 8.036/1990; II - na integralidade, as demais verbas trabalhistas.
> * **§ 1º.** A extinção do contrato prevista no caput deste artigo permite a movimentação da conta vinculada do trabalhador no FGTS na forma do inciso I-A do art. 20 da Lei nº 8.036/1990, limitada a até 80% (oitenta por cento) do valor dos depósitos.
> * **§ 2º.** A extinção do contrato por acordo prevista no caput deste artigo não autoriza o ingresso no Programa de Seguro-Desemprego.
> **Art. 611-A.** A convenção coletiva e o acordo coletivo de trabalho têm prevalência sobre a lei quando, entre outros, dispuserem sobre: I - pacto quanto à jornada de trabalho, observados os limites constitucionais; II - banco de horas anual; III - intervalo intrajornada, respeitado o limite mínimo de trinta minutos para jornadas superiores a seis horas; IV - adesão ao Programa Seguro-Emprego (PSE); V - plano de cargos, salários e funções compatíveis com a condição pessoal do empregado; VI - regulamento empresarial; VII - representante dos trabalhadores no local de trabalho; VIII - teletrabalho, regime de sobreaviso, e trabalho intermitente; IX - remuneração por produtividade; X - modalidade de registro de jornada de trabalho; XI - troca do dia de feriado; XII - enquadramento do grau de insalubridade; XIII - prorrogação de jornada em ambientes insalubres, sem licença prévia das autoridades do Ministério do Trabalho; XIV - prêmios de incentivo em bens ou serviços; XV - participação nos lucros ou resultados da empresa.
> **Art. 611-B.** Constituem objeto ilícito de convenção coletiva ou de acordo coletivo de trabalho, exclusivamente, a supressão ou a redução dos seguintes direitos: I - normas de identificação profissional, inclusive as anotações na Carteira de Trabalho; II - seguro-desemprego, em caso de desemprego involuntário; III - valor dos depósitos mensais e da indenização rescisória do Fundo de Garantia do Tempo de Serviço (FGTS); IV - remuneração do trabalho noturno superior à do diurno; V - proteção do salário na forma da lei, constituindo crime sua retenção dolosa; VI - salário-família; VII - repouso semanal remunerado; VIII - remuneração do serviço extraordinário superior, no mínimo, em 50% (cinquenta por cento) à do normal; IX - número de dias de férias devidas ao empregado; X - gozo de férias anuais remuneradas com, pelo menos, um terço a mais do que o salário normal; XI - licença-maternidade com a duração mínima de cento e vinte dias; XII - licença-paternidade nos termos fixados em lei; XIII - proteção do mercado de trabalho da mulher; XIV - aviso prévio proporcional ao tempo de serviço; XV - normas de saúde, higiene e segurança do trabalho previstas em lei ou em normas regulamentadoras do Ministério do Trabalho.
> **Art. 620.** As condições estabelecidas em acordo coletivo de trabalho sempre prevalecerão sobre as estipuladas em convenção coletiva de trabalho.`
  },
  {
    statute: "Consolidação das Leis do Trabalho e CF/88",
    article: "Art. 114 da CF/88, Arts. 769, 791, 818, 836, 843, 844, 876, 879, 893, 895, 896, 896-A e 897 da CLT",
    themeKeywords: [
      "direito processual do trabalho", "processo do trabalho", "recursos no processo do trabalho",
      "liquidação de sentença", "execução das contribuições sociais na justiça do trabalho",
      "ação rescisória no processo do trabalho", "competência", "recurso de revista", "súmula vinculante 53"
    ],
    literalText: `> **Art. 114 da CF/88.** Compete à Justiça do Trabalho processar e julgar: I - as ações oriundas da relação de trabalho, abrangidos os entes de direito público externo e da administração pública direta e indireta da União, dos Estados, do Distrito Federal e dos Municípios; II - as ações que envolvam exercício do direito de greve; III - as ações sobre representação sindical; IV - os mandados de segurança, habeas corpus e habeas data, quando o ato questionado envolver matéria sujeita à sua jurisdição; V - os conflitos de competência entre órgãos com jurisdição trabalhista; VI - as ações de indenização por dano moral ou patrimonial, decorrentes da relação de trabalho; VII - as ações relativas às penalidades administrativas impostas aos empregadores pelos órgãos de fiscalização das relações de trabalho; VIII - a execução, de ofício, das contribuições sociais previstas no art. 195, I, 'a', e II, e seus acréscimos legais, decorrentes das sentenças que proferir; IX - outras controvérsias decorrentes da relação de trabalho, na forma da lei.
> **Art. 769.** Nos casos omissos, o direito processual comum será fonte subsidiária do direito processual do trabalho, exceto naquilo em que for incompatível com as normas deste Título.
> **Art. 791.** Os empregados e os empregadores poderão reclamar pessoalmente perante a Justiça do Trabalho e acompanhar as suas reclamações até o final.
> **Art. 818.** O ônus da prova incumbe: I - ao reclamante, quanto ao fato constitutivo de seu direito; II - ao reclamado, quanto à existência de fato impeditivo, modificativo ou extintivo do direito do reclamante.
> * **§ 1º.** Nos casos previstos em lei ou diante de peculiaridades da causa relacionadas à impossibilidade ou à excessiva dificuldade de cumprir o encargo ou à maior facilidade de obtenção da prova do fato contrário, poderá o juízo atribuir o ônus da prova de modo diverso, desde que o faça por decisão fundamentada.
> **Art. 836.** É vedado aos órgãos da Justiça do Trabalho conhecer de questões já decididas, excetuados os casos expressamente previstos neste Título e a ação rescisória, que será admitida na forma do disposto no Capítulo IV do Título IX da Lei nº 13.105, de 16 de março de 2015 (Código de Processo Civil), sujeita ao depósito prévio de 20% (vinte por cento) do valor da causa, salvo prova de miserabilidade jurídica.
> **Art. 844.** O não comparecimento do reclamante à audiência importa o arquivamento da reclamação, e o não comparecimento do reclamado importa revelia, além de confissão quanto à matéria de fato.
> * **§ 4º.** A revelia não produz o efeito mencionado no caput deste artigo: I - havendo pluralidade de reclamados, algum deles contestar a ação; II - o litígio versar sobre direitos indisponíveis; III - a petição inicial não estiver acompanhada de instrumento que a lei considere indispensável à prova do ato; IV - as alegações de fato formuladas pelo reclamante forem inverossímeis ou estiverem em contradição com prova constante dos autos.
> **Art. 876.** As decisões passadas em julgado ou das quais não tenha havido recurso com efeito suspensivo; os acordos, quando não cumpridos; os termos de ajuste de conduta firmados perante o Ministério Público do Trabalho e os termos de conciliação firmados perante as Comissões de Conciliação Prévia serão executados pela forma estabelecida neste Capítulo.
> * **Parágrafo único.** Serão executadas ex officio as contribuições sociais devidas em decorrência de decisão proferida pelos Juízes e Tribunais do Trabalho, resultantes de condenação ou homologação de acordo, inclusive sobre os salários pagos durante o período contratual reconhecido.
> **Art. 879.** Sendo ilíquida a sentença exequenda, ordenar-se-á, previamente, a sua liquidação, que poderá ser feita por cálculo, por arbitramento ou por artigos.
> * **§ 2º.** Elaborada a conta e tornada líquida, o juízo deverá abrir às partes prazo comum de oito dias para impugnação fundamentada com a indicação dos itens e valores objeto da discordância, sob pena de preclusão.
> **Art. 893.** Das decisões são admissíveis os seguintes recursos: I - embargos; II - recurso ordinário; III - recurso de revista; IV - agravo.
> **Art. 895.** Cabe recurso ordinário para a instância superior: I - das decisões definitivas ou terminativas das Varas e Juízos, no prazo de 8 (oito) dias; II - das decisões definitivas ou terminativas dos Tribunais Regionais, em processos de sua competência originária, no prazo de 8 (oito) dias.
> **Art. 896.** Cabe Recurso de Revista para Turma do Tribunal Superior do Trabalho das decisões proferidas em grau de recurso ordinário, em dissídio individual, pelos Tribunais Regionais do Trabalho, quando: a) derem ao mesmo dispositivo de lei federal interpretação diversa da que lhe houver dado outro Tribunal Regional do Trabalho, no seu Pleno ou Turma, ou a Seção de Dissídios Individuais do Tribunal Superior do Trabalho, ou contrariarem súmula de jurisprudência uniforme dessa Corte ou súmula vinculante do Supremo Tribunal Federal; b) derem ao mesmo dispositivo de lei estadual, convenção coletiva de trabalho, acordo coletivo, sentença normativa ou regulamento empresarial de observância obrigatória em área territorial que exceda a jurisdição do Tribunal Regional prolator da decisão recorrida, interpretação divergente; c) proferidas com violação literal de disposição de lei federal ou afronta direta e literal à Constituição Federal.
> **Art. 896-A.** O Tribunal Superior do Trabalho, no recurso de revista, examinará previamente se a causa oferece transcendência com relação aos reflexos gerais de natureza econômica, política, social ou jurídica.
> **Art. 897.** Cabe agravo, no prazo de 8 (oito) dias: a) de petição, das decisões do Juiz ou Presidente, nas execuções; b) de instrumento, dos despachos que denegarem a interposição de recursos.`
  },
  // =========================================================================
  // DIREITO CONSTITUCIONAL (CF/88)
  // =========================================================================
  {
    statute: "Constituição Federal de 1988",
    article: "Arts. 1º a 5º e Art. 60",
    themeKeywords: [
      "história constitucional do brasil", "constituição", "normas constitucionais",
      "constituição de 1988: teoria geral e direitos fundamentais", "direitos fundamentais",
      "teoria da constituição", "cláusulas pétreas", "poder constituinte", "princípios fundamentais"
    ],
    literalText: `> **Art. 1º.** A República Federativa do Brasil, formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal, constitui-se em Estado Democrático de Direito e tem como fundamentos: I - a soberania; II - a cidadania; III - a dignidade da pessoa humana; IV - os valores sociais do trabalho e da livre iniciativa; V - o pluralismo político.
> * **Parágrafo único.** Todo o poder emana do povo, que o exerce por meio de representantes eleitos ou diretamente, nos termos desta Constituição.
> **Art. 2º.** São Poderes da União, independentes e harmônicos entre si, o Legislativo, o Executivo e o Judiciário.
> **Art. 3º.** Constituem objetivos fundamentais da República Federativa do Brasil: I - construir uma sociedade livre, justa e solidária; II - garantir o desenvolvimento nacional; III - erradicar a pobreza e a marginalização e reduzir as desigualdades sociais e regionais; IV - promover o bem de todos, sem preconceitos de origem, raça, sexo, cor, idade e quaisquer outras formas de discriminação.
> **Art. 5º.** Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade, nos termos seguintes:
> * **I -** homens e mulheres são iguais em direitos e obrigações, nos termos desta Constituição;
> * **II -** ninguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei;
> * **XXXV -** a lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito;
> * **XXXVI -** a lei não prejudicará o direito adquirido, o ato jurídico perfeito e a coisa julgada;
> * **LV -** aos litigantes, em processo judicial ou administrativo, e aos acusados em geral são assegurados o contraditório e ampla defesa, com os meios e recursos a ela inerentes;
> * **LVII -** ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória;
> * **LXIX -** conceder-se-á mandado de segurança para proteger direito líquido e certo, não amparado por habeas corpus ou habeas data, quando o responsável pela ilegalidade ou abuso de poder for autoridade pública ou agente de pessoa jurídica no exercício de atribuições do Poder Público;
> * **LXXIV -** o Estado prestará assistência jurídica integral e gratuita aos que comprovarem insuficiência de recursos;
> * **§ 1º.** As normas definidoras dos direitos e garantias fundamentais têm aplicação imediata.
> * **§ 2º.** Os direitos e garantias expressos nesta Constituição não excluem outros decorrentes do regime e dos princípios por ela adotados, ou dos tratados internacionais em que a República Federativa do Brasil seja parte.
> * **§ 3º.** Os tratados e convenções internacionais sobre direitos humanos que forem aprovados, em cada Casa do Congresso Nacional, em dois turnos, por três quintos dos votos dos respectivos membros, serão equivalentes às emendas constitucionais.
> **Art. 60.** A Constituição poderá ser emendada mediante proposta: I - de um terço, no mínimo, dos membros da Câmara dos Deputados ou do Senado Federal; II - do Presidente da República; III - de mais da metade das Assembleias Legislativas das unidades da Federação, manifestando-se, cada uma delas, pela maioria relativa de seus membros.
> * **§ 4º.** Não será objeto de deliberação a proposta de emenda tendente a abolir: I - a forma federativa de Estado; II - o voto direto, secreto, universal e periódico; III - a separação dos Poderes; IV - os direitos e garantias individuais.`
  },
  {
    statute: "Constituição Federal de 1988",
    article: "Arts. 18, 21, 22, 23, 24, 25, 30 e Art. 131",
    themeKeywords: [
      "formas de estado", "da organização do estado", "organização do estado", "federalismo",
      "repartição de competências", "advocacia-geral da união", "procuradoria-geral da fazenda nacional",
      "advocacia pública", "funções essenciais à justiça", "competências privativas", "competências concorrentes"
    ],
    literalText: `> **Art. 18.** A organização político-administrativa da República Federativa do Brasil compreende a União, os Estados, o Distrito Federal e os Municípios, todos autônomos, nos termos desta Constituição.
> * **§ 1º.** Brasília é a Capital Federal.
> * **§ 2º.** Os Territórios Federais integram a União, e sua criação, transformação em Estado ou reintegração ao Estado de origem serão reguladas em lei complementar.
> **Art. 21.** Compete à União: I - manter relações com Estados estrangeiros e participar de organizações internacionais; VII - emitir moeda; VIII - administrar as reservas cambiais do País e fiscalizar as operações de natureza financeira; IX - elaborar e executar planos nacionais e regionais de ordenamento do território e de desenvolvimento econômico e social.
> **Art. 22.** Compete privativamente à União legislar sobre: I - direito civil, comercial, penal, processual, eleitoral, agrário, marítimo, aeronáutico, espacial e do trabalho; II - desapropriação; III - requisições civis e militares; IV - águas, energia, informática, telecomunicações e radiodifusão; VI - sistema monetário e de medidas; VII - política de crédito, câmbio, seguros e transferência de valores; VIII - comércio exterior e interestadual.
> * **Parágrafo único.** Lei complementar poderá autorizar os Estados a legislar sobre questões específicas das matérias relacionadas neste artigo.
> **Art. 24.** Compete à União, aos Estados e ao Distrito Federal legislar concorrentemente sobre: I - direito tributário, financeiro, penitenciário, econômico e urbanístico; II - orçamento; V - produção e consumo.
> * **§ 1º.** No âmbito da legislação concorrente, a competência da União limitar-se-á a estabelecer normas gerais.
> * **§ 2º.** A competência da União para legislar sobre normas gerais não exclui a competência suplementar dos Estados.
> * **§ 3º.** Inexistindo lei federal sobre normas gerais, os Estados exercerão a competência legislativa plena, para atender a suas peculiaridades.
> * **§ 4º.** A superveniência de lei federal sobre normas gerais suspende a eficácia da lei estadual, no que lhe for contrário.
> **Art. 131.** A Advocacia-Geral da União é a instituição que, diretamente ou através de órgão vinculado, representa a União, judicial e extrajudicialmente, cabendo-lhe, nos termos da lei complementar que dispuser sobre sua organização e funcionamento, as atividades de consultoria e assessoramento jurídico do Poder Executivo.
> * **§ 1º.** A Advocacia-Geral da União tem por chefe o Advogado-Geral da União, de livre nomeação pelo Presidente da República dentre cidadãos maiores de trinta e cinco anos, de notável saber jurídico e reputação ilibada.
> * **§ 2º.** O ingresso nas classes iniciais das carreiras da instituição de que trata este artigo far-se-á mediante concurso público de provas e títulos.
> * **§ 3º.** Na execução da dívida ativa de natureza tributária, a representação da União cabe à Procuradoria-Geral da Fazenda Nacional, observado o disposto em lei.`
  },
  {
    statute: "Constituição Federal de 1988",
    article: "Arts. 97, 102, 103, 103-A, 145, 150 e 195",
    themeKeywords: [
      "controle de constitucionalidade", "da tributação e do orçamento", "da ordem social",
      "súmula vinculante", "reserva de plenário", "adi", "adc", "adpf", "ordem social", "tributação"
    ],
    literalText: `> **Art. 97.** Somente pelo voto da maioria absoluta de seus membros ou dos membros do respectivo órgão especial poderão os tribunais declarar a inconstitucionalidade de lei ou ato normativo do Poder Público.
> **Art. 102.** Compete ao Supremo Tribunal Federal, precipuamente, a guarda da Constituição, cabendo-lhe: I - processar e julgar, originariamente: a) a ação direta de inconstitucionalidade de lei ou ato normativo federal ou estadual e a ação declaratória de constitucionalidade de lei ou ato normativo federal; p) o pedido de medida cautelar das ações diretas de inconstitucionalidade; § 1º A arguição de descumprimento de preceito fundamental, decorrente desta Constituição, será apreciada pelo Supremo Tribunal Federal, na forma da lei.
> * **§ 2º.** As decisões definitivas de mérito, proferidas pelo Supremo Tribunal Federal, nas ações diretas de inconstitucionalidade e nas ações declaratórias de constitucionalidade produzirão eficácia contra todos e efeito vinculante, relativamente aos demais órgãos do Poder Judiciário e à administração pública direta e indireta, nas esferas federal, estadual e municipal.
> **Art. 103.** Podem propor a ação direta de inconstitucionalidade e a ação declaratória de constitucionalidade: I - o Presidente da República; II - a Mesa do Senado Federal; III - a Mesa da Câmara dos Deputados; IV - a Mesa de Assembleia Legislativa ou da Câmara Legislativa do Distrito Federal; V - o Governador de Estado ou do Distrito Federal; VI - o Procurador-Geral da República; VII - o Conselho Federal da Ordem dos Advogados do Brasil; VIII - partido político com representação no Congresso Nacional; IX - confederação sindical ou entidade de classe de âmbito nacional.
> **Art. 103-A.** O Supremo Tribunal Federal poderá, de ofício ou por provocação, mediante decisão de dois terços dos seus membros, após reiteradas decisões sobre matéria constitucional, aprovar súmula que, a partir de sua publicação na imprensa oficial, terá efeito vinculante em relação aos demais órgãos do Poder Judiciário e à administração pública direta e indireta, nas esferas federal, estadual e municipal.
> **Art. 145.** A União, os Estados, o Distrito Federal e os Municípios poderão instituir os seguintes tributos: I - impostos; II - taxas, em razão do exercício do poder de polícia ou pela utilização, efetiva ou potencial, de serviços públicos específicos e divisíveis; III - contribuição de melhoria, decorrente de obras públicas.
> **Art. 150.** Sem prejuízo de outras garantias asseguradas ao contribuinte, é vedado à União, aos Estados, ao Distrito Federal e aos Municípios: I - exigir ou aumentar tributo sem lei que o estabeleça; II - instituir tratamento desigual entre contribuintes que se encontrem em situação equivalente; III - cobrar tributos: a) em relação a fatos geradores ocorridos antes do início da vigência da lei que os houver instituído ou aumentado; b) no mesmo exercício financeiro em que haja sido publicada a lei que os instituiu ou aumentou; c) antes de decorridos noventa dias da data em que haja sido publicada a lei que os instituiu ou aumentou.
> **Art. 195.** A seguridade social será financiada por toda a sociedade, de forma direta e indireta, nos termos da lei, mediante recursos provenientes dos orçamentos da União, dos Estados, do Distrito Federal e dos Municípios, e de contribuições sociais.`
  },
  // =========================================================================
  // DIREITO AGRÁRIO (PF / PGF / PFE-INCRA / REFORMA AGRÁRIA)
  // =========================================================================
  {
    statute: "Constituição Federal de 1988 — Arts. 184 a 191",
    article: "Arts. 184 a 191 (Política Agrícola, Fundiária e Reforma Agrária)",
    themeKeywords: [
      "agrario", "reforma agraria", "funcao social da propriedade rural", "desapropriacao por interesse social", 
      "propriedade rural", "art. 184", "art. 185", "art. 186", "art. 187", "art. 188", "art. 189", "art. 190", "art. 191", 
      "tda", "titulos da divida agraria", "benfeitorias", "propriedade produtiva", "pequena propriedade", "media propriedade", 
      "estatuto da terra", "usucapiao especial rural"
    ],
    literalText: `> **Art. 184.** Compete à União desapropriar por interesse social, para fins de reforma agrária, o imóvel rural que não esteja cumprindo sua função social, mediante prévia e justa indenização em títulos da dívida agrária, com cláusula de preservação do valor real, resgatáveis no prazo de até vinte anos, a partir do segundo ano de sua emissão, e cuja utilização será definida em lei.
> * **§ 1º.** As benfeitorias úteis e necessárias serão indenizadas em dinheiro.
> * **§ 2º.** O decreto que declarar o imóvel como de interesse social, para fins de reforma agrária, autoriza a União a propor a ação de desapropriação.
> * **§ 3º.** Cabe à lei complementar estabelecer procedimento contraditório especial, de rito sumário, para o processo judicial de desapropriação.
> * **§ 4º.** O orçamento fixará anualmente o volume total de títulos da dívida agrária, assim como o montante de recursos para atendimento do programa de reforma agrária no exercício.
> * **§ 5º.** São isentas de impostos federais, estaduais e municipais as operações de transferência de imóveis desapropriados para fins de reforma agrária.
> **Art. 185.** São insuscetíveis de desapropriação para fins de reforma agrária:
> * **I -** a pequena e média propriedade rural, assim definida em lei, desde que seu proprietário não possua outra;
> * **II -** a propriedade produtiva.
> * **Parágrafo único.** A lei garantirá tratamento especial à propriedade produtiva e fixará normas para o cumprimento dos requisitos relativos a sua função social.
> **Art. 186.** A função social é cumprida quando a propriedade rural atende, simultaneamente, segundo critérios e graus de exigência estabelecidos em lei, aos seguintes requisitos:
> * **I -** aproveitamento racional e adequado;
> * **II -** utilização adequada dos recursos naturais disponíveis e preservação do meio ambiente;
> * **III -** observância das disposições que regulam as relações de trabalho;
> * **IV -** exploração que favoreça o bem-estar dos proprietários e dos trabalhadores.
> **Art. 187.** A política agrícola será planejada e executada na forma da lei, com a participação efetiva do setor de produção, envolvendo produtores e trabalhadores rurais, bem como dos setores de comercialização, de armazenamento e de transportes.
> **Art. 188.** A destinação das terras públicas e devolutas será compatibilizada com a política agrícola e com o plano nacional de reforma agrária.
> **Art. 189.** Os beneficiários da distribuição de imóveis rurais pela reforma agrária receberão títulos de domínio ou de concessão de uso, inegociáveis pelo prazo de dez anos.
> **Art. 191.** Aquele que, não sendo proprietário de imóvel rural ou urbano, possua como seu, por cinco anos ininterruptos, sem oposição, área de terra, em zona rural, não superior a cinquenta hectares, tornando-a produtiva por seu trabalho ou de sua família, tendo nela sua moradia, adquirir-lhe-á a propriedade.`
  },
  {
    statute: "Lei nº 4.504/1964 (Estatuto da Terra) e Dec. nº 59.566/1966 — Arts. 1º a 4º e 92 a 96",
    article: "Arts. 1º a 4º e 92 a 96 (Conceitos Fundiários e Contratos Agrários)",
    themeKeywords: [
      "estatuto da terra", "lei 4.504", "modulo rural", "modulo fiscal", "imovel rural", "minifundio", "latifundio", 
      "propriedade familiar", "contratos agrarios", "arrendamento", "parceria rural", "decreto 59.566", "preempcao", 
      "direito de preferencia", "benfeitorias", "retencao"
    ],
    literalText: `> **Art. 1º.** Esta Lei regula os direitos e obrigações concernentes aos bens imóveis rurais, para os fins de execução da Reforma Agrária e promoção da Política Agrícola.
> * **§ 1º.** Considera-se Reforma Agrária o conjunto de medidas que visem a promover melhor distribuição da terra, mediante modificações no regime de sua posse e uso, a fim de atender aos princípios de justiça social e ao aumento da produtividade.
> **Art. 4º.** Para os efeitos desta Lei, definem-se:
> * **I - Imóvel Rural:** o prédio rústico, de área contínua qualquer que seja a sua localização, que se destina à exploração extrativa agrícola, pecuária ou agro-industrial, quer através de planos públicos de valorização, quer através de iniciativa privada;
> * **II - Propriedade Familiar:** o imóvel rural que, direta e pessoalmente explorado pelo agricultor e sua família, lhes absorva toda a força de trabalho, garantindo-lhes a subsistência e o progresso social e econômico;
> * **III - Módulo Rural:** a área da propriedade familiar fixada para cada região e tipo de exploração;
> * **IV - Minifúndio:** o imóvel rural de área e possibilidades inferiores às da propriedade familiar;
> * **V - Latifúndio:** o imóvel rural que: a) exceda a seiscentas vezes o módulo médio da propriedade familiar ou a dimensão máxima fixada para a região; b) não excedendo o limite referido, seja mantido inexplorado em relação às possibilidades físicas, econômicas e sociais do meio.
> **Art. 92.** A posse ou uso temporário da terra serão exercidos em virtude de contrato expresso ou tácito, estabelecido entre o proprietário e os que nela exercem atividade agrícola ou pecuária, sob forma de arrendamento rural, de parceria agrícola, pecuária, agro-industrial ou extrativa.
> * **§ 3º.** No caso de alienação do imóvel arrendado, o arrendatário terá preferência para adquiri-lo em igualdade de condições, devendo o proprietário dar-lhe conhecimento da venda, a fim de que possa exercitar o direito de preempção dentro de trinta dias.
> * **§ 4º.** O arrendatário a quem não se notificar a venda poderá, depositando o preço, haver para si o imóvel, se o requerer no prazo de seis meses, a contar da transcrição do ato de alienação no Registro de Imóveis.
> * **§ 6º.** O inadimplemento das obrigações assumidas por qualquer das partes dará lugar à rescisão do contrato, assegurado ao arrendatário o direito à indenização das benfeitorias necessárias e úteis.
> **Art. 96.** Na partilha dos frutos da parceria, a cota do proprietário não poderá exceder os limites percentuais fixados em lei, partilhando os contratantes os riscos da exploração.`
  },
  {
    statute: "Lei nº 8.629/1993 e LC nº 76/1993 — Arts. 2º, 6º e 9º (Lei 8.629) e Arts. 2º a 6º (LC 76)",
    article: "Arts. 2º, 6º e 9º (Lei 8.629) e Arts. 2º a 6º (LC 76)",
    themeKeywords: [
      "desapropriacao por interesse social", "lei 8.629", "lc 76", "procedimento contraditorio especial", 
      "imissao provisoria na posse", "imissao na posse", "pfe-incra", "incra", "procuradoria federal especializada", 
      "vistoria", "vedacao a vistoria", "invasao coletiva", "esbulho possessorio", "art. 2º, § 6º", "gut", "gee", 
      "grau de utilizacao", "grau de eficiencia"
    ],
    literalText: `> **Lei nº 8.629/1993 — Art. 2º.** A propriedade rural que não cumprir a função social é passível de desapropriação, nos termos desta lei, respeitados os dispositivos constitucionais.
> * **§ 6º.** O imóvel rural de domínio público ou particular objeto de esbulho possessório ou invasão motivada por conflito agrário ou fundiário de caráter coletivo não será vistoriado, avaliado ou desapropriado nos dois anos seguintes à sua desocupação, ou no dobro desse prazo, em caso de reincidência, e os ocupantes ou invasores não poderão ser beneficiados com a distribuição de imóveis rurais pela reforma agrária.
> **Lei nº 8.629/1993 — Art. 6º.** Considera-se propriedade produtiva aquela que, explorada econômica e racionalmente, atinge, simultaneamente, graus de utilização da terra e de eficiência na exploração, segundo índices fixados pelo órgão federal competente.
> * **§ 1º.** O grau de utilização da terra (GUT) para ser considerada produtiva a propriedade deve ser igual ou superior a 80%.
> * **§ 2º.** O grau de eficiência na exploração da terra (GEE) deverá ser igual ou superior a 100%.
> **LC nº 76/1993 — Art. 2º.** A desapropriação de que trata esta lei complementar é de competência privativa da União e será processada perante a Justiça Federal do foro do lugar do imóvel.
> **LC nº 76/1993 — Art. 6º.** O juiz, ao despachar a petição inicial, de plano ou no prazo máximo de quarenta e oito horas, deferirá a imissão provisória na posse do imóvel, em favor do expropriante, desde que haja sido efetuado o depósito do valor das benfeitorias úteis e necessárias em dinheiro e o lançamento dos Títulos da Dívida Agrária relativos à terra nua.
> * **§ 1º.** Não haverá audiência da parte contrária para a concessão da liminar de imissão provisória na posse, sendo vedado qualquer interdito possessório para obstar a imissão do expropriante.`
  },
  {
    statute: "Lei nº 11.952/2009 e Lei nº 13.465/2017 — Arts. 1º a 15",
    article: "Arts. 1º a 15 da Lei nº 11.952/2009 (Regularização Fundiária na Amazônia Legal)",
    themeKeywords: [
      "regularizacao fundiaria", "amazonia legal", "lei 11.952", "lei 13.465", "reurb", "terras devolutas", 
      "terras da uniao", "alienacao de terras publicas", "inalienabilidade", "car", "cadastro ambiental rural", 
      "posse mansa e pacifica"
    ],
    literalText: `> **Lei nº 11.952/2009 — Art. 1º.** Esta Lei dispõe sobre a regularização fundiária das ocupações incidentes em terras situadas em áreas da União, no âmbito da Amazônia Legal.
> **Art. 2º.** Para os fins desta Lei, considera-se regularização fundiária o conjunto de medidas jurídicas, urbanísticas, ambientais e sociais que visem à regularização de ocupações em terras públicas da União e à titulação de seus ocupantes.
> **Art. 5º.** São condições para a regularização da ocupação:
> * **I -** não ser o ocupante proprietário de imóvel rural em qualquer parte do território nacional;
> * **II -** comprovar o exercício de ocupação e exploração direta, mansa e pacífica, por si ou por seus antecessores;
> * **III -** não ter sido beneficiado por programa de reforma agrária ou de regularização fundiária de desenvolvimento rural;
> * **IV -** inscrição ativa no Cadastro Ambiental Rural (CAR).
> **Art. 6º.** A alienação ou concessão de direito real de uso de áreas de até dois mil e quinhentos hectares na Amazônia Legal poderá ser realizada mediante dispensa de licitação.
> **Art. 15.** O título de domínio expedido conterá cláusulas resolutivas que vinculem o adquirente pelo prazo de dez anos, sob pena de reversão da área ao patrimônio público federal em caso de descumprimento dos preceitos ambientais ou alienação sem anuência prévia do poder concedente.`
  },
  {
    statute: "CF/88 e Decreto nº 4.887/2003 — Art. 231 da CF, Art. 68 ADCT e Dec. 4.887/2003",
    article: "Art. 231 da CF, Art. 68 ADCT e Dec. 4.887/2003 (Terras Indígenas e Quilombolas)",
    themeKeywords: [
      "terras indigenas", "quilombolas", "art. 231", "art. 68 adct", "decreto 4.887", "comunidades quilombolas", 
      "direitos originarios", "inalienabilidade", "imprescritibilidade", "indisponibilidade", "funai", 
      "autoatribuicao", "adi 3239", "demarcacao"
    ],
    literalText: `> **Constituição Federal — Art. 231.** São reconhecidos aos índios sua organização social, costumes, línguas, crenças e tradições, e os direitos originários sobre as terras que tradicionalmente ocupam, competindo à União demarcá-las, proteger e fazer respeitar todos os seus bens.
> * **§ 1º.** São terras tradicionalmente ocupadas pelos índios as por eles habitadas em caráter permanente, as utilizadas para suas atividades produtivas, as imprescindíveis à preservação dos recursos ambientais necessários a seu bem-estar e as necessárias a sua reprodução física e cultural, segundo seus usos, costumes e tradições.
> * **§ 2º.** As terras tradicionalmente ocupadas pelos índios destinam-se a sua posse permanente, cabendo-lhes o usufruto exclusivo das riquezas do solo, dos rios e dos lagos nelas existentes.
> * **§ 4º.** As terras de que trata este artigo são inalienáveis e indisponíveis, e os direitos sobre elas, imprescritíveis.
> * **§ 6º.** São nulos e extintos, não produzindo efeitos jurídicos, os atos que tenham por objeto a ocupação, o domínio e a posse das terras a que se refere este artigo, ou a exploração das riquezas naturais do solo, dos rios e dos lagos nelas existentes, ressalvado relevante interesse público da União, segundo o que dispuser lei complementar, não gerando a nulidade e a extinção direito a indenização ou a ações contra a União, salvo, na forma da lei, quanto às benfeitorias derivadas da ocupação de boa-fé.
> **ADCT — Art. 68.** Aos remanescentes das comunidades dos quilombos que estejam ocupando suas terras é reconhecida a propriedade definitiva, devendo o Estado emitir-lhes os títulos respectivos.
> **Decreto nº 4.887/2003 — Art. 2º.** Consideram-se remanescentes das comunidades dos quilombos os grupos étnico-raciais, segundo critérios de auto-atribuição, com trajetória histórica própria, dotados de relações territoriais específicas, com presunção de ancestralidade negra relacionada com a resistência à opressão histórica sofrida.`
  },
  ...LEGISLATION_ENAM_ENAC,
  ...LEGISLATION_BACEN
];

/**
 * Retorna os dispositivos normativos na íntegra para um dado tema e disciplina.
 * Seleciona cirurgicamente os artigos de maior incidência, com redação oficial completa.
 */

export function normalizeDisciplineFamily(disc: string): string {
  const d = (disc || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (d.includes("notar") || d.includes("registr") || d.includes("cartor") || d.includes("tabeli")) return "NOTARIAL_REGISTRAL";
  if (d.includes("humanistica") || d.includes("filosofia") || d.includes("sociologia")) return "HUMANISTICA";
  if (d.includes("humanos") || d.includes("convencionalidade")) return "HUMANOS";
  if (d.includes("seguridade") || d.includes("previdenc")) return "PREVIDENCIARIO";
  if (d.includes("process") && d.includes("trabalh")) return "PROCESSO_TRABALHO";
  if (d.includes("trabalh")) return "TRABALHO";
  if (d.includes("process") && d.includes("penal")) return "PROCESSO_PENAL";
  if (d.includes("penal") || d.includes("crime")) return "PENAL";
  if (d.includes("process") && d.includes("civil")) return "PROCESSO_CIVIL";
  if (d.includes("civil")) return "CIVIL";
  if (d.includes("financeiro") || d.includes("economico") || d.includes("orcament")) return "FINANCEIRO";
  if (d.includes("tribut") || d.includes("fiscal")) return "TRIBUTARIO";
  if (d.includes("constituc")) return "CONSTITUCIONAL";
  if (d.includes("ambiental")) return "AMBIENTAL";
  if (d.includes("agrario")) return "AGRARIO";
  if (d.includes("empresarial") || d.includes("comercial") || d.includes("falencia")) return "EMPRESARIAL";
  if (d.includes("internacional")) return "INTERNACIONAL";
  if (d.includes("eleitoral")) return "ELEITORAL";
  if (d.includes("agu") || d.includes("gestao de conflitos") || d.includes("educacao, ciencia")) return "ADMINISTRATIVO";
  if (d.includes("administr") || d.includes("licita") || d.includes("improbidade")) return "ADMINISTRATIVO";
  return "GERAL";
}

export function getLiteralLegislationForTheme(theme: string, discipline: string = "", additionalKeywords: string[] = []): string {
  const rawTheme = theme || "";
  const normTheme = rawTheme.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const family = normalizeDisciplineFamily(discipline);

  // Extração cirúrgica de números de normas citadas no tema (ex: 14.133, 13.506, 4.595, 179/2021, etc.)
  const statuteMatches = rawTheme.match(/\b\d{1,2}\.?\d{3}\b(?:\/\d{4})?|\b179\/2021\b|\b105\/2001\b|\b857\/1969\b|\b2\.321\/1987\b|\b4\.320\b|\b6\.830\b|\b7\.347\b|\b12\.865\b|\b10\.214\b|\b14\.478\b|\b6\.024\b|\b10\.931\b|\b12\.529\b|\b13\.874\b|\b9\.650\b|\b9\.784\b|\b8\.112\b|\b8\.429\b|\b7\.492\b|\b9\.613\b|\b6\.404\b|\b11\.101\b|\b14\.112\b|\b9\.514\b/gi) || [];
  const normalizedStatuteNumbers = statuteMatches.map(s => s.toLowerCase().replace(/\./g, "").trim());

  // Score articles for maximum relevance
  const cleanTheme = " " + normTheme.replace(/[(),:;.\-\/\\\[\]]/g, " ").replace(/\s+/g, " ") + " ";

  const scored = LITERAL_ARTICLES.map(art => {
    let score = 0;
    const statLower = (art.statute + " " + art.article).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const kw of art.themeKeywords) {
      const normKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cleanKw = normKw.replace(/[(),:;.\-\/\\\[\]]/g, " ").replace(/\s+/g, " ").trim();

      if (normTheme === normKw || cleanTheme.trim() === cleanKw) {
        score += 160;
      } else if (cleanTheme.includes(" " + cleanKw + " ") || normTheme.includes(normKw)) {
        score += 40 + cleanKw.length * 3;
      } else if (cleanKw.includes(cleanTheme.trim()) && cleanTheme.trim().length >= 5) {
        score += 30;
      }
    }

    // Alinhamento estrito com palavras-chave do módulo doutrinário vinculado
    if (additionalKeywords && additionalKeywords.length > 0) {
      for (const akw of additionalKeywords) {
        const normAkw = akw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        for (const kw of art.themeKeywords) {
          const normKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (normKw === normAkw || (normKw.length >= 4 && normAkw.includes(normKw)) || (normAkw.length >= 4 && normKw.includes(normAkw))) {
            score += 35;
          }
        }
      }
    }

    // Superbonificação por número de lei/diploma expressamente mencionado no tema do edital
    const cleanStatLower = statLower.replace(/\./g, "");
    for (const num of normalizedStatuteNumbers) {
      if (cleanStatLower.includes(num)) {
        score += 260;
      }
    }

    const topicScore = score;

    // Regra estrita de pertinência temática:
    // O artigo SÓ recebe pontuação e bonificação se demonstrar pertinência temática real (topicScore > 0).
    // Artigos com 0 correspondência ao tema não pontuam, impedindo a injeção de leis impertinentes.
    if (topicScore > 0) {
      // Boost if statute aligns with discipline family
      if (family === "CONSTITUCIONAL") {
      if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("crime")) {
        score = -999;
      } else if (statLower.includes("constituic") || statLower.includes("cf/88") || statLower.includes("art. 1") ||
          statLower.includes("art. 5") || statLower.includes("art. 18") || statLower.includes("art. 21") ||
          statLower.includes("art. 22") || statLower.includes("art. 24") || statLower.includes("art. 37") ||
          statLower.includes("art. 60") || statLower.includes("art. 102") || statLower.includes("art. 103") ||
          statLower.includes("art. 131") || statLower.includes("art. 145") || statLower.includes("art. 195")) {
        score += 90;
      }
    } else if (family === "TRABALHO" || family === "PROCESSO_TRABALHO") {
      if (statLower.includes("penal") || statLower.includes("crime") || statLower.includes("falencia") || statLower.includes("tributario") || statLower.includes("ctn")) {
        score = -999;
      } else if (statLower.includes("clt") || statLower.includes("trabalh") || statLower.includes("empreg") ||
          statLower.includes("salario") || statLower.includes("ferias") || statLower.includes("remunerac") ||
          statLower.includes("114") || statLower.includes("recurso de revista") || statLower.includes("rescisoria") ||
          statLower.includes("contribuic") || statLower.includes("sindic") || statLower.includes("coletiv")) {
        score += 80;
      }
    } else if (family === "CIVIL") {
      if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("previdenci") || statLower.includes("tributario") || statLower.includes("ctn") || statLower.includes("licita") || statLower.includes("14.133")) {
        score = -999;
      } else if (statLower.includes("codigo civil") || statLower.includes("10.406") || statLower.includes("lindb") ||
          statLower.includes("obrigac") || statLower.includes("contrat") || statLower.includes("prescric") ||
          statLower.includes("posse") || statLower.includes("propriedade") || statLower.includes("responsabilidade civil") ||
          statLower.includes("familia") || statLower.includes("sucessoes") || statLower.includes("bens") ||
          statLower.includes("857/1969") || statLower.includes("10.192") || statLower.includes("9.514") ||
          statLower.includes("alienacao fiduciaria") || statLower.includes("juros")) {
        score += 80;
      }
    } else if (family === "EMPRESARIAL") {
      if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("previdenci") || statLower.includes("tributario") || statLower.includes("ctn")) {
        score = -999;
      } else if (statLower.includes("empresarial") || statLower.includes("falencia") || statLower.includes("11.101") ||
          statLower.includes("6.404") || statLower.includes("13.303") || statLower.includes("9.279") ||
          statLower.includes("sociedade") || statLower.includes("estabelecimento") || statLower.includes("trespasse") ||
          statLower.includes("titulos de credito") || statLower.includes("desconsideracao") || statLower.includes("estatais") ||
          statLower.includes("direito de empresa") || statLower.includes("6.024") || statLower.includes("2.321") ||
          statLower.includes("10.931") || statLower.includes("resolucao bancaria") || statLower.includes("ccb")) {
        score += 80;
      }
    } else if (family === "PROCESSO_CIVIL") {
      if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("trabalh") || statLower.includes("previdenci")) {
        score = -999;
      } else if (statLower.includes("cpc") || statLower.includes("processo civil") || statLower.includes("13.105") ||
          statLower.includes("6.830") || statLower.includes("8.437") || statLower.includes("9.494") ||
          statLower.includes("12.016") || statLower.includes("10.259") || statLower.includes("7.347") ||
          statLower.includes("lindb") || statLower.includes("13.874") || statLower.includes("8.906") ||
          statLower.includes("11.419") || statLower.includes("fazenda") || statLower.includes("execucao") || 
          statLower.includes("recurso") || statLower.includes("honorarios")) {
        score += 70;
      }
    } else if (family === "TRIBUTARIO") {
      if (statLower.includes("tribut") || statLower.includes("ctn") || statLower.includes("145") || 
          statLower.includes("149") || statLower.includes("150") || statLower.includes("151") || 
          statLower.includes("152") || statLower.includes("153") || statLower.includes("154") || 
          statLower.includes("195") || statLower.includes("6.830") || statLower.includes("13.988") || 
          statLower.includes("lindb") || statLower.includes("divida ativa") || statLower.includes("14.596")) {
        score += 50;
      } else if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("trabalh") || statLower.includes("consumidor") || ((statLower.includes("ctn") || statLower.includes("tributario")) && !normTheme.includes("tribut") && !normTheme.includes("fiscal") && !normTheme.includes("iof"))) {
        score = -999;
      }
    } else if (family === "PENAL" || family === "PROCESSO_PENAL") {
      if (statLower.includes("codigo penal") || statLower.includes("processo penal") || statLower.includes("cpp") ||
          statLower.includes("crimes") || statLower.includes("pena") || statLower.includes("acao penal") ||
          statLower.includes("inquerito") || statLower.includes("7.492") || statLower.includes("9.613") ||
          statLower.includes("13.869") || statLower.includes("8.137") || statLower.includes("14.133") ||
          statLower.includes("licitac") || statLower.includes("abuso") || statLower.includes("improbidade") ||
          statLower.includes("competencia") || statLower.includes("jurisdicao") || statLower.includes("anpp") ||
          statLower.includes("lavagem") || statLower.includes("sistema financeiro") || statLower.includes("anticorrupcao")) {
        score += 70;
      } else if (statLower.includes("clt") || statLower.includes("previdenci") || (statLower.includes("tribut") && !statLower.includes("8.137"))) {
        score = -999;
      }
    } else if (family === "ADMINISTRATIVO") {
      if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("crime") || statLower.includes("tributario") || statLower.includes("ctn") || statLower.includes("falencia")) {
        score = -999;
      } else if (statLower.includes("administra") || statLower.includes("200/67") || statLower.includes("9.784") || statLower.includes("14.133") || statLower.includes("8.112") || statLower.includes("8.429") || statLower.includes("art. 37") || statLower.includes("13.506") || statLower.includes("4.595") || statLower.includes("9.650") || statLower.includes("179/2021")) {
        score += 80;
      }
    } else if (family === "PREVIDENCIARIO") {
      if (statLower.includes("194") || statLower.includes("195") || statLower.includes("201") || 
          statLower.includes("8.212") || statLower.includes("8.213") || statLower.includes("150/2015") || 
          statLower.includes("seguridade") || statLower.includes("previdenci") || statLower.includes("custeio") || 
          statLower.includes("empresa") || statLower.includes("domestico")) {
        score += 60;
      } else if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("consumidor")) {
        score = -999;
      }
    } else if (family === "AMBIENTAL") {
      if (statLower.includes("ambiental") || statLower.includes("meio ambiente") || statLower.includes("225") ||
          statLower.includes("6.938") || statLower.includes("12.651") || statLower.includes("9.985") ||
          statLower.includes("poluidor") || statLower.includes("florestal") || statLower.includes("snuc") ||
          statLower.includes("licenciamento") || statLower.includes("eia") || statLower.includes("app") ||
          statLower.includes("reserva legal") || statLower.includes("car")) {
        score += 85;
      } else if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("tributario") || statLower.includes("falencia")) {
        score = -999;
      }
    } else if (family === "ELEITORAL") {
      if (statLower.includes("eleitoral") || statLower.includes("eleic") || statLower.includes("propaganda") ||
          statLower.includes("9.504") || statLower.includes("64/90") || statLower.includes("135/2010") ||
          statLower.includes("inelegibil") || statLower.includes("desincompatibilizacao") || statLower.includes("ficha limpa") ||
          statLower.includes("condutas vedadas") || statLower.includes("art. 14") || statLower.includes("art. 73")) {
        score += 85;
      } else if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("tributario") || statLower.includes("falencia")) {
        score = -999;
      }
    } else if (family === "INTERNACIONAL") {
      if (statLower.includes("internacional") || statLower.includes("viena") || statLower.includes("tratado") ||
          statLower.includes("cij") || statLower.includes("ocde") || statLower.includes("beps") ||
          statLower.includes("basileia") || statLower.includes("gafi") || statLower.includes("fatf") ||
          statLower.includes("imunidade") || statLower.includes("arm's length") || statLower.includes("14.596") ||
          statLower.includes("8.842") || statLower.includes("cooperacao") || statLower.includes("rogatoria") ||
          statLower.includes("auxilio direto") || statLower.includes("art. 4º") || statLower.includes("art. 49") ||
          statLower.includes("art. 84") || statLower.includes("lindb")) {
        score += 85;
      } else if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("trabalh") || statLower.includes("consumidor") || statLower.includes("falencia")) {
        score = -999;
      } else if ((statLower.includes("tribut") || statLower.includes("ctn")) && !normTheme.includes("tribut") && !normTheme.includes("fiscal") && !normTheme.includes("beps") && !normTheme.includes("ocde")) {
        score = -999;
      }
    } else if (family === "AGRARIO") {
      if (statLower.includes("agrari") || statLower.includes("terra") || statLower.includes("184") ||
          statLower.includes("185") || statLower.includes("186") || statLower.includes("4.504") ||
          statLower.includes("8.629") || statLower.includes("76") || statLower.includes("11.952") ||
          statLower.includes("4.887") || statLower.includes("231") || statLower.includes("incra") ||
          statLower.includes("reforma") || statLower.includes("quilombo") || statLower.includes("indigen") ||
          statLower.includes("arrendamento") || statLower.includes("parceria")) {
        score += 90;
      } else if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("tributario") || statLower.includes("falencia") || statLower.includes("consumidor")) {
        score = -999;
      }
    } else if (family === "FINANCEIRO") {
      if (statLower.includes("penal") || statLower.includes("clt") || statLower.includes("trabalh") || statLower.includes("consumidor") || statLower.includes("ctn") || statLower.includes("tributario")) {
        score = -999;
      } else if (statLower.includes("art. 165") || statLower.includes("art. 166") || statLower.includes("art. 167") || 
          statLower.includes("art. 168") || statLower.includes("art. 169") || statLower.includes("art. 100") || statLower.includes("precatorio") || 
          statLower.includes("lrf") || statLower.includes("101/2000") || statLower.includes("4.320") || 
          statLower.includes("art. 170") || statLower.includes("art. 172") || statLower.includes("art. 173") || 
          statLower.includes("art. 174") || statLower.includes("art. 177") || statLower.includes("art. 192") || 
          statLower.includes("13.303") || statLower.includes("12.529") || statLower.includes("179/2021") || 
          statLower.includes("105/2001") || statLower.includes("200/2023") || statLower.includes("4.595") ||
          statLower.includes("10.214") || statLower.includes("12.865") || statLower.includes("14.478") ||
          statLower.includes("857/1969") || statLower.includes("10.192") || statLower.includes("pagamentos") ||
          statLower.includes("pix") || statLower.includes("criptoativ") || statLower.includes("vasp") || 
          statLower.includes("basileia") || statLower.includes("prudencial") || statLower.includes("fintech") || 
          statLower.includes("scd") || statLower.includes("sep")) {
        score += 80;
      }
    } else if (family === "NOTARIAL_REGISTRAL") {
      if (statLower.includes("registros publicos") || statLower.includes("6.015") || statLower.includes("8.935") ||
          statLower.includes("14.711") || statLower.includes("14.382") || statLower.includes("provimento 149") ||
          statLower.includes("notari") || statLower.includes("registr") || statLower.includes("cartor") ||
          statLower.includes("tabeli") || statLower.includes("serp") || statLower.includes("imoveis")) {
        score += 95;
      } else {
        score = -999;
      }
    } else if (family === "HUMANISTICA") {
      if (statLower.includes("humanistica") || statLower.includes("resolucao 492") || statLower.includes("etica") ||
          statLower.includes("filosofia") || statLower.includes("genero") || statLower.includes("loman") ||
          statLower.includes("sociologia") || statLower.includes("magistratura")) {
        score += 95;
      } else {
        score = -999;
      }
    } else if (family === "HUMANOS") {
      if (statLower.includes("humanos") || statLower.includes("interamerican") || statLower.includes("san jose") ||
          statLower.includes("convencao") || statLower.includes("pacto")) {
        score += 95;
      } else {
        score = -999;
      }
    } else {
      score = 0;
    }
  } else {
    score = 0;
  }

  return { art, score };
});

  const matching = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  if (matching.length > 0) {
    const topArticles = matching
      .slice(0, 4)
      .map(m => `### 📜 ${m.art.statute} — ${m.art.article}\n\n${m.art.literalText}`)
      .join("\n\n---\n\n");

    const novidades = searchCiclosNovidades(theme, discipline, 2);
    if (novidades.length > 0) {
      const novidadesText = novidades.map(n => `> ⚖️ **${n.theme}**: ${n.detalhe}`).join("\n>\n");
      return `${topArticles}\n\n---\n\n### ⚖️ Alterações Legislativas & Atualizações Normativas Recentes\n\n${novidadesText}`;
    }
    return topArticles;
  }

  // Fallback limpo: se não houver artigo específico no acervo com pontuação estrita,
  // JAMAIS injetar diplomas arbitrários de outras matérias ou códigos civis/penais desconexos.
  const novidades = searchCiclosNovidades(theme, discipline, 2);
  let novidadesComplemento = "";
  if (novidades.length > 0) {
    novidadesComplemento = `\n\n---\n\n### ⚖️ Alterações Legislativas & Atualizações Normativas Recentes\n\n` +
      novidades.map(n => `> ⚖️ **${n.theme}**: ${n.detalhe}`).join("\n>\n");
  }

  return `### 📜 Enquadramento Normativo de Regência — ${discipline || "Legislação Federal"}\n\n` +
    `> **Tema do Edital**: ${theme}\n>\n` +
    `> A regência normativa deste tópico fundamenta-se nos preceitos da Constituição Federal e na legislação infraconstitucional específica de ${discipline}. Recomenda-se o domínio da literalidade dos dispositivos de regência e das súmulas uniformizadoras dos Tribunais Superiores (STF/STJ).${novidadesComplemento}`;
}
