/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DOCTRINAL_ENAM_ENAC } from "./doctrinalEnamEnac";
import { DOCTRINAL_BACEN } from "./doctrinalBACEN";
import { DOCTRINAL_PF } from "./doctrinalPF";
import { DOCTRINAL_AU } from "./doctrinalAU";
import { DOCTRINAL_PFN } from "./doctrinalPFN";

export interface DoctrinalModule {
  id: string;
  themeKeywords: string[];
  discipline: string;
  title: string;
  coreDoctrine: string;
  divergentCurrents?: {
    firstCurrent: { name: string; author: string; thesis: string; adoptedByExam: boolean };
    secondCurrent: { name: string; author: string; thesis: string; adoptedByExam: boolean };
  };
  examPitfalls: string[];
  careerNuances: {
    AGU?: string;
    PGFN?: string;
    PF?: string;
    PBC?: string;
    MPE?: string;
    ENAM?: string;
    ENAC?: string;
  };
}

export const DOCTRINAL_REPOSITORY: DoctrinalModule[] = [
  // =========================================================================
  // 1. CONTROLE DE CONSTITUCIONALIDADE
  // =========================================================================
  {
    id: "controle-constitucionalidade",
    discipline: "DIREITO CONSTITUCIONAL",
    title: "Teoria Geral do Controle de Constitucionalidade",
    themeKeywords: [
      "controle de constitucionalidade", "controle concentrado", "controle difuso", 
      "inconstitucionalidade", "adi", "adc", "ação direta por omissão", "adpf", "modulação", "bloco de constitucionalidade"
    ],
    coreDoctrine: `#### 📚 Teoria Geral do Controle de Constitucionalidade

* **Fundamento Dogmático e Conceito**:
  O controle de constitucionalidade apoia-se no **princípio da supremacia formal da Constituição** e na rigidez do processo de reforma (art. 60 da CF/88). Conforme lição clássica de **José Afonso da Silva**, a Constituição funciona como a "pedra angular" do sistema, impondo a **compatibilidade vertical** de todas as normas infraconstitucionais.
  
* **Bloco de Constitucionalidade (Normas-Parâmetro)**:
  O parâmetro de controle no Brasil não se resume ao texto formal da CF/88. Abrange:
  1. O texto permanente e o ADCT;
  2. As Emendas Constitucionais;
  3. Os **Tratados Internacionais de Direitos Humanos** aprovados pelo rito do art. 5º, § 3º da CF/88 (equivalentes a Emendas);
  4. Princípios constitucionais implícitos decorrentes do regime republicano e democrático.

* **Sistemas e Concepções Teóricas Fundamentais**:
  * **Sistema Norte-Americano (*Judicial Review* - Marshall, 1803 / Marbury v. Madison)**: Adota a **Teoria da Nulidade (*ab initio*)**. O ato inconstitucional é natimorto, destituído de qualquer validade jurídica, operando efeitos *ex tunc*.
  * **Sistema Austríaco (Hans Kelsen, 1920)**: Adota a **Teoria da Anulabilidade**. A lei inconstitucional produz efeitos até que seja desconstituída pelo Tribunal Constitucional, operando originariamente efeitos *ex nunc* (prospectivos).
  * **O Sistema Brasileiro (Híbrido/Misto com Flexibilização da Nulidade)**: O STF adotou historicamente a teoria da nulidade como regra geral, porém consagrou a flexibilização legislativa com a **modulação temporal de efeitos (art. 27 da Lei 9.868/99)** por maioria qualificada de 2/3 dos membros (8 ministros), quando presentes razões de **segurança jurídica ou de excepcional interesse social**.

* **Controle Difuso e Cláusula de Reserva de Plenário (Art. 97 da CF e Súmula Vinculante 10 do STF)**:
  No controle difuso incidental, qualquer juiz ou tribunal aprecia a arguição de inconstitucionalidade. Nos tribunais, a declaração de inconstitucionalidade submete-se compulsoriamente à **reserva de plenário (Full Bench)**, exigindo maioria absoluta do tribunal ou órgão especial. A **Súmula Vinculante nº 10 do STF** pune com nulidade absoluta a decisão de órgão fracionário que afasta a incidência de lei sem remessa ao pleno. Exceções: quando já houver manifestação do plenário do próprio tribunal ou do plenário do STF sobre a matéria.

* **Abstrativização do Controle Difuso e Papel do Senado (Art. 52, X da CF/88)**:
  A jurisprudência contemporânea do STF reconhece que o julgamento de mérito em Recurso Extraordinário pelo Plenário (especialmente em Repercussão Geral) irradia efeitos vinculantes e *erga omnes* imediatos para toda a ordem jurídica, atribuindo ao Senado Federal função meramente integrativa de dar publicidade à decisão da Suprema Corte.

* **Microssistema das Ações de Controle Concentrado perante o STF**:
  * **ADI**: Voltada contra lei ou ato normativo federal ou estadual pós-constitucional que viole a CF/88;
  * **ADC**: Destinada a confirmar a constitucionalidade de lei federal em face de controvérsia judicial relevante;
  * **ADPF**: Remédio de cognição subsidiária (art. 4º, § 1º da Lei 9.882/99), cabível contra leis municipais, normas pré-constitucionais e atos materiais lesivos a preceitos fundamentais;
  * **ADO**: Instrumento de combate à omissão legislativa inconstitucional total ou parcial.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria da Nulidade com Modulação Excepcional (Posição do STF)",
        author: "Ministro Gilmar Mendes / Luís Roberto Barroso",
        thesis: "A inconstitucionalidade gera nulidade absoluta em regra, mas autoriza a eficácia prospectiva quando a declaração retroativa produzir dano social maior que a subsistência transitória da norma.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Nulidade Radical e Insuperável",
        author: "Pontes de Miranda / Doutrina Tradicional",
        thesis: "O ato inconstitucional é juridicamente inexistente e nenhuma situação fática nele amparada pode ser chancelada sob o manto da segurança jurídica.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que a modulação de efeitos exige unanimidade do STF (FALSO: exige quórum de 2/3, ou seja, 8 ministros).",
      "Confundir 'inconstitucionalidade superveniente' com 'revogação por não-recepção'. No Brasil, o STF rejeita a inconstitucionalidade superveniente: leis anteriores à nova Constituição são simplesmente revogadas por não recepção.",
      "Afirmar que normas constitucionais originárias podem ser objeto de controle de constitucionalidade (FALSO: adotada a tese de Otto Bachof apenas em nível doutrinário; o STF não admite inconstitucionalidade de normas constitucionais originárias)."
    ],
    careerNuances: {
      AGU: "Na atuação da AGU, invoque sempre a presunção de constitucionalidade das leis, a autocontenção judicial (*judicial self-restraint*), a deferência ao legislador e a necessidade imperiosa de modulação de efeitos (art. 27 da Lei 9.868/99) para resguardar as finanças públicas e o orçamento da União.",
      PGFN: "Em matéria tributária, o controle de constitucionalidade impacta diretamente a arrecadação. Sustente a higidez dos lançamentos fiscais com base na modulação temporal para impedir devoluções retroativas de indébitos que desestabilizem as contas fiscais.",
      MPE: "O Ministério Público atua com legitimidade ativa no controle concentrado estadual (perante o TJ) e difuso. Sustente a força normativa dos princípios republicanos e a inaplicabilidade de modulações que gerem impunidade ou lesão a direitos fundamentais indisponíveis."
    }
  },

  // =========================================================================
  // 2. RESPONSABILIDADE CIVIL DO ESTADO
  // =========================================================================
  {
    id: "responsabilidade-civil-estado",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Responsabilidade Civil da Administração Pública",
    themeKeywords: [
      "responsabilidade civil", "responsabilidade do estado", "art. 37", "dano moral", 
      "nexo de causalidade", "risco administrativo", "omissão estatal", "faute du service", "direito de regresso"
    ],
    coreDoctrine: `#### 📚 Responsabilidade Civil do Estado

* **Evolução Dogmática e Fundamento Constitucional**:
  A responsabilidade civil do Estado evoluiu da fase da irresponsabilidade feudal ("*the King can do no wrong*") para a teoria civilista da culpa e, finalmente, para a **Teoria do Risco Administrativo**, positivada no **art. 37, § 6º da CF/88**:
  As pessoas jurídicas de direito público e as de direito privado prestadoras de serviços públicos respondem objetivamente pelos danos causados por seus agentes, assegurado o direito de regresso contra o responsável nos casos de dolo ou culpa.

* **Pressupostos da Responsabilidade Objetiva**:
  1. **Conduta administrativa**: Praticada por agente público nessa qualidade;
  2. **Dano**: Certeza e especificidade (patrimonial, moral ou estético);
  3. **Nexo de Causalidade**: O Brasil adota a **Teoria do Dano Direto e Imediato (Interrupção do Nexo)** positivada no art. 403 do Código Civil.

* **Excludentes e Atenuantes do Nexo Causal**:
  * **Culpa Exclusiva da Vítima**: Exclui o dever de indenizar do Estado.
  * **Caso Fortuito ou Força Maior**: Exclui o nexo, salvo em casos de omissão culposa concorrente.
  * **Fato Exclusivo de Terceiro**: Rompe o nexo causal, salvo dever legal específico de proteção.

* **Responsabilidade por Omissão Estatal**:
  * **Omissão Genérica**: Aplica-se a teoria da responsabilidade **subjetiva** (*faute du service* / culpa anônima do serviço) — a vítima deve provar a falta, atraso ou deficiência do serviço público na prevenção do dano.
  * **Omissão Específica**: Quando o Estado assume posição de **garante legal** e descumpre dever específico de agir (ex.: custódia de presos em estabelecimentos prisionais, guarda de alunos em escolas públicas, pacientes internados em hospitais do SUS), a responsabilidade é **objetiva**, sob a modalidade da Teoria do Risco Administrativo (STF, Tema 592/RG).

* **Responsabilidade por Atos Legislativos e Judiciais**:
  * **Atos Judiciais**: Como regra vige a irresponsabilidade judicial. Exceções constitucionais taxativas (art. 5º, LXXV da CF): erro judiciário na esfera criminal e prisão além do tempo fixado na sentença, além de responsabilidade pessoal regressiva do magistrado por dolo ou fraude (art. 143 do CPC).
  * **Atos Legislativos**: Regra da irresponsabilidade das leis em tese. Exceções: leis de efeitos concretos causadoras de danos específicos e declaração incidental ou concentrada de inconstitucionalidade de lei tributária ou restritiva pelo Supremo Tribunal Federal.

* **Diretrizes Jurisprudenciais Vinculantes e Regime Prescricional**:
  * **Tema 940 do STF**: A ação por danos causados por agente público deve ser proposta exclusivamente em face da pessoa jurídica de direito público ou de direito privado prestadora de serviço público, sendo manifestamente incabível o ajuizamento direto contra o agente ou a formação de litisconsórcio passivo facultativo entre ambos.
  * **Tema 553 do STJ (Prazo Prescricional Quinquenal)**: A pretensão indenizatória veiculada contra a Fazenda Pública prescreve em 5 anos, por força do art. 1º-C da Lei 9.494/1997 e do Decreto 20.910/1932, norma especial que prevalece sobre o prazo trienal previsto no art. 206, § 3º, V do Código Civil.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria do Risco Administrativo (Regra Geral Constitucional)",
        author: "Hely Lopes Meirelles / Maria Sylvia Di Pietro / STF",
        thesis: "O Estado responde objetivamente pelos atos comissivos, admitindo-se a comprovação de excludentes da causalidade (força maior, culpa exclusiva da vítima).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria do Risco Integral (Exceção Taxativa no Brasil)",
        author: "Doutrina Majoritária",
        thesis: "Não admite qualquer excludente do nexo causal. Aplica-se estritamente a: danos nucleares (art. 21, XXIII, 'd' da CF), atentados terroristas em aeronaves brasileiras (Leis 10.744/03) e dano ambiental.",
        adoptedByExam: true
      }
    },
    examPitfalls: [
      "Bancas tentam aplicar a Teoria do Risco Integral indistintamente a todos os acidentes públicos (FALSO: a regra brasileira é o Risco Administrativo).",
      "Prescrição da ação indenizatória contra a Fazenda Pública: aplica-se o prazo quinquenal do Decreto 20.910/32, e não o prazo trienal do Código Civil (STJ, Tema 553 dos Repetitivos).",
      "Direito de Regresso: a propositura de ação contra o Estado não autoriza litisconsórcio passivo facultativo entre o Estado e o agente público causador do dano (STF, Tema 940/RG: a vítima deve acionar unicamente o Estado; este é quem move o regresso)."
    ],
    careerNuances: {
      AGU: "Defenda sempre a aplicação estrita da Teoria da Causalidade Direta e Imediata (art. 403 do CC), demonstrando a culpa exclusiva de terceiros ou da vítima para afastar o nexo causal e proteger os cofres públicos contra pretensões indenizatórias abusivas.",
      PGFN: "Em demandas de responsabilidade patrimonial por bloqueios indevidos em execuções fiscais, invoque a escusa do exercício regular de direito da Fazenda e a ausência de dolo funcional para barrar fixação de danos morais *in re ipsa*.",
      MPE: "Em ações civis públicas promovidas pelo MP, sustente a responsabilidade objetiva do Estado por omissão específica na proteção de presidiários, menores internados no socioeducativo e meio ambiente, exigindo o cumprimento do dever constitucional de custódia e proteção integral."
    }
  },

  // =========================================================================
  // 3. LICITAÇÕES E CONTRATOS ADMINISTRATIVOS (LEI 14.133/2021)
  // =========================================================================
  {
    id: "licitacoes-contratos-14133",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Licitações e Contratos Administrativos (Nova Lei 14.133/2021)",
    themeKeywords: [
      "licitações", "lei 14.133", "contratos administrativos", "inexigibilidade", "dispensa", 
      "parecer jurídico", "assessoria jurídica", "matriz de riscos", "diálogo competitivo"
    ],
    coreDoctrine: `#### 📚 Licitações e Contratos na Nova Lei nº 14.133/2021

* **Princípios Estruturantes da Nova Lei (Art. 5º)**:
  A Lei 14.133/2021 consolidou os princípios da legalidade, impessoalidade, moralidade, publicidade, eficiência, interesse público, probidade administrativa, igualdade, planejamento, transparência, eficácia, segregação de funções, motivação, vinculação ao edital, julgamento objetivo, segurança jurídica, razoabilidade, proporcionalidade, celeridade, economicidade e desenvolvimento nacional sustentável.

* **Papel Estratégico da Advocacia Pública (Art. 53)**:
  Ao final da fase preparatória, o processo licitatório será submetido a **controle prévio de legalidade mediante análise jurídica** do órgão de assessoramento jurídico da Administração (AGU / Procuradoria).
  * O parecer jurídico é peça técnica que vincula o gestor nos aspectos de estrita legalidade.
  * O membro da Advocacia Pública só responde civil e regressivamente quando agir com **dolo ou fraude** (art. 184 CPC e art. 28 LINDB).

* **Modalidades Licitatórias Modernizadas**:
  * Extinção do Convite e Tomada de Preços.
  * Modalidades Mantidas: Pregão, Concorrência, Concurso e Leilão.
  * Nova Modalidade Criada: **Diálogo Competitivo** (para inovações tecnológicas ou complexidades técnicas onde o Estado não consegue fixar a solução de antemão).

* **Contratação Direta (Inexigibilidade x Dispensa)**:
  * **Inexigibilidade (Art. 74)**: Inviabilidade de competição (rol exemplificativo). Casos: fornecedor exclusivo, profissional artístico consagrado, serviços técnicos especializados intelectuais com notória especialização.
  * **Dispensa (Art. 75)**: Viabilidade de competição, mas a lei autoriza expressamente não licitar por razões de economia processual (baixo valor) ou urgência/calamidade pública (rol taxativo).

* **Sistema de Registro de Preços (SRP) e Contratos na Lei 14.133/2021**:
  * **Procedimentos Auxiliares**: O Sistema de Registro de Preços constitui procedimento auxiliar (art. 78) destinado a compras e contratações rotineiras, registrando preços em ata com vigência de até um ano, prorrogável por igual período. A utilização da ata por órgãos não participantes ("caronas") é restrita a limites quantitativos rigorosos (art. 86).
  * **Terceirização na Administração Pública**: A responsabilidade subsidiária da Administração Pública pelos encargos trabalhistas de empresas terceirizadas exige comprovação inequívoca de conduta culposa na fiscalização do cumprimento das obrigações contratuais (STF Tema 246 - ADC 16; STF Tema 725), não decorrendo de inadimplemento automático.
  * **Relicitação e Continuidade Contratual (Lei 13.448/2017 e Lei 14.133/2021)**: Mecanismo de resolução amigável e estruturada de concessões e grandes contratos de infraestrutura inviabilizados, assegurando a continuidade dos serviços essenciais até a assunção pelo novo licitante vencedor.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Rol Exemplificativo da Inexigibilidade de Licitação",
        author: "Marçal Justen Filho / Doutrina Unânime / TCU",
        thesis: "Sempre que a competição for inviável em decorrência da singularidade do objeto ou da especialização personalíssima do contratado, haverá inexigibilidade, mesmo que a hipótese fática não esteja literalmente no art. 74.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Taxatividade Absoluta das Hipóteses de Dispensa",
        author: "Doutrina e Jurisprudência dos Tribunais de Contas",
        thesis: "A dispensa de licitação do art. 75 constitui exceção à regra republicana da disputa; não admite interpretação extensiva nem analogia para criar novas hipóteses liberatórias.",
        adoptedByExam: true
      }
    },
    examPitfalls: [
      "Bancas tentam incluir 'Diálogo Competitivo' como contratação direta (FALSO: é modalidade de licitação com disputa).",
      "Afirmar que o parecerista jurídico da AGU responde solidariamente com o gestor por qualquer irregularidade (FALSO: STF pacificou que o advogado público só responde em caso de dolo ou erro grosseiro inescusável).",
      "Confundir critério de julgamento com modalidade licitatória (Menor Preço, Maior Desconto e Melhor Técnica são critérios de julgamento da Concorrência/Pregão, não modalidades autônomas)."
    ],
    careerNuances: {
      AGU: "Destaque as orientações da Consultoria-Geral da União (CGU/AGU), os modelos padronizados de minutas de editais e contratos e a imunidade funcional do parecerista público (art. 133 CF/88 c/c art. 184 CPC).",
      PGFN: "Destaque a conformidade orçamentária dos contratos (art. 16 da LRF), a exigência de regularidade fiscal e certidões negativas de débitos federais (CND) para habilitação jurídica do contratado.",
      MPE: "O Ministério Público atua como fiscal da probidade das contratações públicas e do patrimônio social (art. 129, III da CF). Destaque a verificação de fracionamento ilegal de despesas para burlar a licitação e a tipificação de crimes em licitação (arts. 337-E a 337-P do Código Penal)."
    }
  },

  // =========================================================================
  // 4. IMPROBIDADE ADMINISTRATIVA (LEI 8.429/92 C/C LEI 14.230/2021)
  // =========================================================================
  {
    id: "improbidade-administrativa",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Improbidade Administrativa e Regime Sancionatório",
    themeKeywords: [
      "improbidade", "lei 14.230", "enriquecimento ilícito", "prejuízo ao erário", 
      "dolo específico", "sanções", "prescrição intercorrente", "legitimidade"
    ],
    coreDoctrine: `#### 📚 Regime da Improbidade Administrativa Reformada (Lei 14.230/2021)

* **Revolução Dogmática: Extinção da Culpa e Exigência de Dolo Específico**:
  A Lei 14.230/2021 revogou completamente a modalidade culposa da improbidade administrativa. Atualmente:
  * Considera-se **dolo a vontade livre e consciente de alcançar o resultado ilícito** tipificado nos arts. 9º, 10 e 11, não bastando a mera voluntariedade do agente (art. 1º, § 2º).
  * O mero erro hermenêutico ou inaptidão administrativa (má-gestão) sem dolo específico com desvio de finalidade afasta a improbidade (art. 1º, § 3º).

* **Tipologias Materiais de Atos de Improbidade**:
  1. **Art. 9º - Enriquecimento Ilícito**: Exige acréscimo patrimonial indevido do agente. É sempre doloso e com sanções mais rigorosas (perda de bens, suspensão de direitos políticos até 14 anos).
  2. **Art. 10 - Lesão ao Erário**: Exige comprovação de **perda patrimonial efetiva e concreta** (não se admite mais dano presumido ou potencial).
  3. **Art. 11 - Violação aos Princípios Administrativos**: Rol **taxativo** (números clausus) segundo a nova lei. Exige que a conduta esteja expressamente prevista nos incisos do art. 11.

* **Legitimidade Ativa e Prescrição**:
  * **Legitimidade Concorrente**: O STF (ADI 7042 e 7043) julgou inconstitucional a exclusividade do MP, assentando que **tanto o Ministério Público quanto as Pessoas Jurídicas interessadas (como União, AGU, Estados e Municípios)** possuem legitimidade para propor a ação de improbidade.
  * **Prescrição Geral Unificada**: Prazo de **8 anos** contados a partir da ocorrência do fato (art. 23).
  * **Prescrição Intercorrente**: Prazo de **4 anos** entre os marcos interruptivos processuais.

* **Indisponibilidade de Bens e Acordo de Não Persecução Civil (ANPC)**:
  * **Art. 16 da Lei 8.429/1992 Reformada**: A concessão de tutela de urgência para decretação de indisponibilidade de bens exige a demonstração inequívoca de perigo de dano concreto ou de risco ao resultado útil do processo (periculum in mora documentalmente demonstrado), vedada a decretação sem elementos objetivos de dilapidação patrimonial.
  * **Acordo de Não Persecução Civil (ANPC, Art. 17-B)**: Instrumento negocial de justiça consensual disponível para todas as tipologias de improbidade, condicionado cumulativamente à reparação integral do dano efetivo e à perda da vantagem patrimonial ilícita auferida.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Irretroatividade da Nova Lei para Casos com Trânsito em Julgado",
        author: "STF (Tema 1199/RG)",
        thesis: "A revogação do ato culposo de improbidade administrativa é irretroativa em relação às condenações com trânsito em julgado. Para ações em andamento sem condenação transitada, aplica-se a nova lei exigindo-se a comprovação do dolo.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Natureza Jurídica do Direito Administrativo Sancionador",
        author: "Doutrina Publicista Moderna",
        thesis: "O direito sancionador da improbidade atrai as garantias do Direito Penal (art. 5º, XL da CF), devendo retroagir a norma mais benéfica em qualquer hipótese pendente de execução.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que o MP possui monopólio exclusivo da ação de improbidade (FALSO: o STF julgou inconstitucional a exclusividade; a Pessoa Jurídica lesada também tem legitimidade ativa concorrente).",
      "Afirmar que ainda existe improbidade na modalidade culposa para lesão ao erário (FALSO: revogada a modalidade culposa pela Lei 14.230/2021).",
      "Dano presumido (*in re ipsa*) em improbidade: não é mais admitido pela jurisprudência e pelo texto do art. 10; exige-se comprovação de efetivo prejuízo pecuniário."
    ],
    careerNuances: {
      AGU: "Como representante da União (pessoa jurídica lesada), a AGU atua com legitimidade concorrente ampla para propor ação de improbidade, cobrar ressarcimento ao erário e celebrar Acordos de Não Continuidade (ANPC).",
      PGFN: "Em fraudes tributárias perpetradas com dolo funcional e conluio para esvaziamento do patrimônio sujeito à execução fiscal, promova a indisponibilidade de bens com base na Lei de Improbidade e no art. 185-A do CTN.",
      MPE: "O Ministério Público é o protagonista constitucional no combate à corrupção e improbidade. Destaque o Inquérito Civil como instrumento investigatório prévio e a celebração de Acordo de Não Persecução Civil (ANPC) para recuperar os valores aos cofres locais."
    }
  },

  // =========================================================================
  // 5. DIREITO TRIBUTÁRIO: CRÉDITO TRIBUTÁRIO (SUSPENSÃO E EXTINÇÃO)
  // =========================================================================
  {
    id: "credito-tributario-ctn",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Crédito Tributário: Lançamento, Suspensão, Extinção, Exclusão, Prescrição e Decadência",
    themeKeywords: [
      "crédito tributário", "suspensão da exigibilidade", "extinção do crédito", "art. 151", 
      "art. 156", "ctn", "lançamento", "decadência", "prescrição", "repetição do indébito",
      "compensação tributária", "exclusão do crédito", "isenção e anistia", "mora tributária"
    ],
    coreDoctrine: `#### 📚 Crédito Tributário, Suspensão e Extinção

* **Natureza Dogmática do Crédito e Lançamento (Art. 142 do CTN)**:
  O lançamento tributário é o ato administrativo vinculado e obrigatório pelo qual a autoridade administrativa constitui o crédito tributário, verificando a ocorrência do fato gerador, a matéria tributável, o sujeito passivo e a alíquota aplicável.
  * O lançamento possui eficácia **declaratória** da obrigação tributária preexistente e **constitutiva** do crédito tributário.

* **Hipóteses Taxativas de Suspensão da Exigibilidade (Art. 151 do CTN - Mnemônico MODEPARALIRE)**:
  1. **MO**ratória;
  2. **DE**pósito do seu montante integral em dinheiro (Súmula 112 STJ);
  3. **PA**rcelamento;
  4. **RE**clamações e recursos administrativos (PAF);
  5. **LI**minar em mandado de segurança;
  6. **LI**minar ou tutela antecipada em outras ações judiciais.
  * A suspensão impede a prática de atos executivos e a inscrição em dívida ativa, mas **não dispensa o cumprimento das obrigações acessórias**.

* **Hipóteses de Extinção do Crédito Tributário (Art. 156 do CTN)**:
  Pagamento, compensação, transação, remissão, **prescrição e decadência**, conversão de depósito em renda, pagamento antecipado homologado, consignação em pagamento julgada procedente, decisão administrativa irreformável, decisão judicial com trânsito em julgado e dação em pagamento em bens imóveis (CF/88 e Lei 13.259/16).

* **Prescrição e Decadência Tributária**:
  * **Decadência (Art. 173 CTN)**: Perda do direito do Fisco de constituir o crédito tributário. Prazo de 5 anos contados do primeiro dia do exercício seguinte ou da data da homologação.
  * **Prescrição (Art. 174 CTN)**: Perda da pretensão executória da Fazenda. Prazo de 5 anos contados da constituição definitiva do crédito.

* **Causas de Suspensão e Extinção do Crédito Tributário (Arts. 151 e 156 do CTN)**:
  O rol das causas de suspensão da exigibilidade do crédito tributário (art. 151 do CTN) é taxativo (moratória, depósito do montante integral, reclamações e recursos administrativos, liminares em mandado de segurança, tutelas provisórias e parcelamento). Por sua vez, a extinção do crédito opera-se pelas modalidades do art. 156 (pagamento, compensação, transação, remissão, prescrição, decadência, conversão de depósito em renda, pagamento antecipado homologado, consignação em pagamento julgada procedente, decisão administrativa irreformável, coisa julgada e dação em pagamento de bens imóveis).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Taxatividade Absoluta do Rol do Artigo 151 do CTN",
        author: "STJ (Primeira Seção) / Doutrina Majoritária",
        thesis: "O rol do art. 151 do CTN é taxativo (numerus clausus). Não é lícito ao magistrado criar outras causas de suspensão da exigibilidade tributária, como prestação de caução em bens ou fiança bancária (que garantem o juízo, mas não suspendem a exigibilidade).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Equiparação do Seguro-Garantia ao Depósito em Dinheiro",
        author: "Corrente Minoritária de Defesa do Contribuinte",
        thesis: "O seguro-garantia ou a fiança bancária deveriam suspender a exigibilidade do crédito tributário por assegurarem o pagamento imediato em caso de liquidação.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que a fiança bancária e o seguro-garantia suspendem a exigibilidade do crédito (FALSO: eles apenas autorizam a expedição de CPD-EN e obstam o CADIN, mas NÃO suspendem a exigibilidade; Súmula 112 do STJ exige depósito em dinheiro).",
      "Confundir decadência com prescrição tributária. A decadência atinge o direito de lançar; a prescrição atinge a pretensão de cobrar executivamente.",
      "Afirmar que lei ordinária pode criar hipóteses de extinção ou suspensão tributária (FALSO: matéria reservada à Lei Complementar nacional conforme art. 146, III, 'b' da CF/88)."
    ],
    careerNuances: {
      AGU: "Em matérias de contribuições federais não tributárias, invoque a distinção entre créditos tributários (regidos pelo CTN) e créditos públicos patrimoniais (Decreto 20.910/32 e Lei 6.830/80).",
      PGFN: "A PGFN detém competência constitucional exclusiva para a apuração da liquidez e certeza da Dívida Ativa da União de natureza tributária (art. 131, § 3º da CF). Defenda a presunção de legitimidade da Certidão de Dívida Ativa (CDA - art. 3º da Lei 6.830/80) e a inaplicabilidade de suspensões sem depósito integral em dinheiro.",
      MPE: "Na tutela da probidade fiscal e combate à sonegação, atue em conjunto com a Fazenda Estadual nas ações de combate a crimes contra a ordem tributária (Lei 8.137/90), observando a Súmula Vinculante 24 do STF (necessidade de prévio lançamento definitivo do crédito para os crimes materiais do art. 1º)."
    }
  },

  // =========================================================================
  // 6. TEORIA DO CRIME E TEORIA DA LEI PENAL
  // =========================================================================
  {
    id: "teoria-do-crime-pena",
    discipline: "DIREITO PENAL",
    title: "Teoria do Crime: Fato Típico, Ilicitude e Culpabilidade",
    themeKeywords: [
      "direito penal", "teoria do crime", "fato típico", "ilicitude", "culpabilidade", 
      "dolo", "culpa", "teoria finalista", "erro de tipo", "legítima defesa", "imputabilidade"
    ],
    coreDoctrine: `#### 📚 Teoria Geral do Crime e Culpabilidade

* **Conceito Analítico de Crime (Teoria Tripartida - Majoritária no Brasil)**:
  O crime é estruturado como fato **típico**, **ilícito** e **culpável** (adotada por Nelson Hungria, Aníbal Bruno, Assis Toledo, Rogério Sanches e STJ/STF).
  * **1. Fato Típico**: Composto por conduta (dolosa ou culposa), resultado naturalístico (nos crimes materiais), nexo de causalidade e tipicidade (formal e conglobante).
  * **2. Ilicitude (Antijuridicidade)**: Relação de contrariedade entre a conduta e o ordenamento. Excludentes legais (art. 23 do CP): Estado de Necessidade, Legítima Defesa, Estrito Cumprimento do Dever Legal e Exercício Regular de Direito.
  * **3. Culpabilidade**: Juízo de reprovação pessoal que recai sobre o autor do fato. Elementos: Imputabilidade, Potencial Consciência da Ilicitude e Exigibilidade de Conduta Diversa.

* **Evolução das Teorias da Conduta**:
  * **Teoria Causalista/Clássica (Liszt-Beling)**: Conduta é mero movimento corporal que produz modificação no mundo exterior. Dolo e culpa estavam na culpabilidade como vínculo psicológico.
  * **Teoria Neoclássica/Neokantista (Mezger)**: Culpabilidade passa a ser normativa (juízo de reprovação).
  * **Teoria Finalista (Hans Welzel - Adotada pelo Código Penal Brasileiro)**: A conduta é a atividade finalisticamente orientada. O dolo e a culpa foram deslocados da culpabilidade para o **fato típico** (integrando a conduta). Na culpabilidade restaram apenas juízos normativos de reprovação.

* **Erro de Tipo x Erro de Proibição**:
  * **Erro de Tipo (Art. 20 CP)**: Recai sobre elementar ou circunstância de fato do tipo penal. Se inevitável, exclui o dolo e a culpa. Se evitável, exclui o dolo, mas permite a punição por crime culposo (se previsto em lei).
  * **Erro de Proibição (Art. 21 CP)**: O agente sabe exatamente o que faz no plano dos fatos, mas acredita erradamente que sua conduta é permitida pelo Direito. Se inevitável, isenta de pena (exclui a culpabilidade por ausência de potencial consciência da ilicitude). Se evitável, diminui a pena de um sexto a um terço.

* **Concurso de Pessoas e Crimes Contra a Administração Pública**:
  O Código Penal adota a teoria monista ou unitária temperada no art. 29 (quem, de qualquer modo, concorre para o crime incide nas penas a este cominadas, na medida de sua culpabilidade). Exceções pluralistas expressas: corrupção passiva (art. 317) e corrupção ativa (art. 333). Nos crimes funcionais contra a administração pública, as circunstâncias e condições de caráter pessoal de funcionário público comunicam-se ao coautor ou partícipe particular, desde que este conheça a condição funcional do comparsa (art. 30 do Código Penal).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria Tripartida do Crime (Majoritária)",
        author: "Nelson Hungria / Rogério Sanches / STF e STJ",
        thesis: "O crime é fato típico, antijurídico e culpável. A culpabilidade é pressuposto estrutural do crime; quem pratica fato típico e ilícito sem culpabilidade não comete crime punível.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria Bipartida do Crime",
        author: "Damásio de Jesus / René Ariel Dotti",
        thesis: "O crime é fato típico e ilícito. A culpabilidade é mero pressuposto de aplicação da pena, e não elemento constitutivo do conceito de crime.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que o Código Penal brasileiro adota a teoria causalista de Liszt-Beling (FALSO: o CP brasileiro reformado em 1984 adotou a Teoria Finalista de Welzel).",
      "Dizer que o erro de proibição inevitável exclui a tipicidade (FALSO: o erro de tipo exclui a tipicidade/dolo; o erro de proibição exclui a culpabilidade).",
      "Confundir legítima defesa (repulsa a agressão injusta humana) com estado de necessidade (conflito entre bens jurídicos em perigo atual gerado pela natureza ou animal não instigado)."
    ],
    careerNuances: {
      AGU: "Em crimes funcionais contra a administração pública federal e ações de improbidade, ressalte a necessária distinção dogmática entre dolo penal/específico e mera irregularidade formal administrativa.",
      PGFN: "Em crimes contra a ordem tributária (Lei 8.137/90), sustente a tipicidade material estrita e a indispensabilidade de lançamento tributário definitivo para a caracterização do resultado naturalístico de sonegação (Súmula Vinculante 24 do STF).",
      MPE: "Para o Promotor de Justiça, o domínio da Teoria do Crime é basilar na elaboração da denúncia penal. Demonstre a justa causa (indícios suficientes de autoria e prova da materialidade) e descreva pormenorizadamente a conduta dolosa finalística para evitar inépcia da petição inicial acusatória."
    }
  },

  // =========================================================================
  // 7. PROCESSO PENAL E SISTEMAS PROCESSUAIS
  // =========================================================================
  {
    id: "processo-penal-juiz-garantias",
    discipline: "DIREITO PROCESSUAL PENAL",
    title: "Sistemas Processuais Penais, Juiz das Garantias, ANPP e Provas Ilícitas",
    themeKeywords: [
      "processo penal", "sistema acusatório", "sistema acusatorio", "juiz das garantias",
      "estrutura acusatória", "anpp", "acordo de nao persecucao penal", "audiência de custódia",
      "audiencia de custodia", "prisão cautelar", "prisao preventiva", "provas ilícitas", "provas ilicitas"
    ],
    coreDoctrine: "O sistema processual penal brasileiro experimentou profunda transformação com a edição do Pacote Anticrime (Lei nº 13.964/2019) e o julgamento definitivo das Ações Diretas de Inconstitucionalidade nº 6.298, 6.299, 6.300 e 6.305 pelo Plenário do Supremo Tribunal Federal. O artigo 3º-A do Código de Processo Penal consagrou expressamente que o processo penal pátrio ostenta estrutura estritamente acusatória, vedando peremptoriamente a iniciativa do magistrado na fase de investigação preliminar e a substituição da atuação probatória conferida ao órgão da acusação criminal.\n\nA instituição do Juiz das Garantias (arts. 3º-B a 3º-F do CPP) constitui a maior densificação institucional do princípio da imparcialidade judicial objetiva na história do processo penal pátrio. Compete ao Juiz das Garantias o controle rigoroso da legalidade da persecução pré-processual e a salvaguarda inegociável dos direitos fundamentais da pessoa submetida a investigação criminal. Sua competência funcional exaure-se com a decisão formal de recebimento ou rejeição da denúncia ou queixa-crime, momento a partir do qual cessa seu ofício jurisdicional e deflagra-se a competência exclusiva do Juiz da Instrução e Julgamento, o qual não terá contato pregresso contaminador com os elementos inquisitoriais informativos.\n\nNo âmbito do consenso penal despenalizador, o novel artigo 28-A do Código de Processo Penal inaugurou o Acordo de Não Persecução Penal (ANPP), consubstanciando negócio jurídico pré-processual bilateral personalíssimo celebrado privativamente entre o Ministério Público e o investigado, assistido por defensor constituído ou Defensoria Pública, condicionado à homologação pelo juízo competente. São requisitos legais cumulativos indispensáveis: (i) não ser caso de arquivamento da investigação criminal; (ii) confissão formal e circunstanciada da prática da infração penal perante o parquet; (iii) prática de delito sem violência ou grave ameaça à pessoa; e (iv) cominação de pena privativa de liberdade mínima abstrata inferior a 4 anos, computadas eventuais causas de aumento e de diminuição. Sob a ótica intertemporal, o Supremo Tribunal Federal, ao julgar o Habeas Corpus nº 185.913, conferiu ao ANPP natureza jurídica mista ou híbrida (material e processual benéfica), autorizando sua aplicação retroativa benéfica a fatos pretéritos à vigência da Lei nº 13.964/2019, desde que inexistente o trânsito em julgado da condenação penal.\n\nNo campo das liberdades públicas e medidas cautelares, a audiência de custódia (art. 310 do CPP e ADPF nº 347 do STF) impõe a apresentação compulsória de toda pessoa presa em flagrante delito perante a autoridade judiciária no prazo improrrogável de até 24 horas, sob pena de ilegalidade manifesta da custódia e responsabilidade funcional. No tocante ao regime jurídico das provas ilícitas (art. 157 do CPP), vige a teoria dos frutos da árvore envenenada (fruits of the poisonous tree), pela qual a ilicitude originária contamina por derivação todas as provas dela decorrentes, ressalvadas exclusivamente as hipóteses legais de fonte independente (§ 1º) e descoberta inevitável (§ 2º), exigindo-se a preclusão e o desentranhamento físico compulsório das provas ilícitas dos autos.",
    divergentCurrents: {
      firstCurrent: {
        name: "Retroatividade do ANPP a Processos em Curso sem Trânsito em Julgado",
        author: "Supremo Tribunal Federal (Plenário - HC 185.913)",
        thesis: "Por possuir natureza mista mais benéfica ao imputado, o instituto do ANPP retroage para alcançar condutas anteriores à Lei 13.964/2019, mesmo naqueles feitos em que a peça inaugural acusatória já tenha sido recebida, contanto que não tenha ocorrido o trânsito em julgado.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Preclusão do ANPP a Partir do Recebimento da Peça Acusatória",
        author: "Jurisprudência Anterior do STJ (5ª e 6ª Turmas)",
        thesis: "O ANPP constituiria instituto despenalizador eminentemente pré-processual, precluindo a possibilidade jurídica de sua celebração a partir do momento em que o juízo profere decisão de recebimento da inicial acusatória.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "ACORDO DE NÃO PERSECUÇÃO PENAL NÃO GERA REINCIDÊNCIA: O cumprimento integral das condições estipuladas no ANPP extingue a punibilidade do agente sem implicar reconhecimento de culpa nem gerar reincidência ou maus antecedentes criminais.",
      "CONFISSÃO CIRCUNSTANCIADA COMO REQUISITO ESSENCIAL: A confissão formal e circunstanciada da prática delitiva é requisito indeclinável e indispensável para a viabilidade do ANPP.",
      "VEDAÇÃO DO ANPP EM VIOLÊNCIA DOMÉSTICA: É categoricamente vedada a celebração de ANPP nos crimes praticados no âmbito de violência doméstica ou familiar, ou praticados contra a mulher por razões da condição do sexo feminino.",
      "IMPARCIALIDADE DO JUIZ DAS GARANTIAS: O magistrado que funcionou na fase de inquérito como Juiz das Garantias fica absolutamente impedido de atuar na fase subsequente de instrução e julgamento do processo.",
      "PRAZO IMPRORROGÁVEL DA AUDIÊNCIA DE CUSTÓDIA: O prazo legal e jurisprudencial para apresentação do custodiado é de 24 horas a contar da efetivação da prisão."
    ],
    careerNuances: {
      PGFN: "A PGFN acompanha a fixação de cláusulas de recomposição patrimonial do Erário nos ANPPs celebrados em crimes tributários ou aduaneiros, assegurando que o acordo condicione a extinção da punibilidade à liquidação dos débitos tributários federais.",
      AGU: "A Advocacia-Geral da União atua em prol da preservação da higidez processual em ações penais que envolvem patrimônio federal, requerendo o cumprimento integral das cláusulas ressarcitórias como pressuposto de validade do ajuste consensual.",
      PF: "A Procuradoria Federal defende judicialmente as autarquias federais lesadas, pugnando pela destinação prioritária dos valores arrecadados no ANPP para o ressarcimento da entidade autárquica vitimada."
    }
  },

  // =========================================================================
  // 8. TUTELA COLETIVA E DIREITOS DIFUSOS (MP)
  // =========================================================================
  {
    id: "tutela-coletiva-difusos",
    discipline: "DIREITO PROCESSUAL CIVIL E DIFUSOS",
    title: "Tutela Coletiva: Ação Civil Pública, Inquérito Civil e Coisa Julgada",
    themeKeywords: [
      "tutela coletiva", "ação civil pública", "inquérito civil", "direitos difusos", 
      "direitos coletivos", "interesses individuais homogêneos", "tac", "termo de ajustamento", "cdc"
    ],
    coreDoctrine: `#### 📚 Teoria Geral do Processo Coletivo e Direitos Difusos

* **Classificação Tridimensional dos Direitos Metaindividuais (Art. 81 do CDC)**:
  1. **Direitos Difusos (Inciso I)**: Transindividuais, de natureza indivisível, titularizados por pessoas indeterminadas e ligadas por circunstâncias de fato (ex.: meio ambiente sadio, publicidade enganosa de massa).
  2. **Direitos Coletivos em Sentido Estrito (Inciso II)**: Transindividuais, de natureza indivisível, titularizados por grupo, categoria ou classe determinada ligada por uma relação jurídica base (ex.: plano de saúde cobrando reajuste indevido de associados de determinado sindicato).
  3. **Direitos Individuais Homogêneos (Inciso III)**: Decorrentes de origem comum, divisíveis por natureza e com titulares determinados ou determináveis (ex.: passageiros lesados pelo cancelamento em massa de voos).

* **Instrumentos Extrajudiciais do Ministério Público**:
  * **Inquérito Civil (IC)**: Procedimento administrativo inquisitorial privativo do MP, de natureza preparatória à Ação Civil Pública (art. 129, III da CF).
  * **Termo de Ajustamento de Conduta (TAC - Art. 5º, § 6º da Lei 7.347/85)**: Título executivo extrajudicial pelo qual os órgãos públicos legitimados tomam dos interessados compromisso de ajustamento às exigências legais, mediante cominações de multa.
  * **Recomendações**: Instrumento de advertência e orientação pedagógica que constitui em mora o destinatário e comprova dolo em caso de reiteração deliberada.

* **Regime Especial da Coisa Julgada Coletiva (Secundum Eventum Litis)**:
  * Em direitos difusos: Eficácia *erga omnes*, salvo se improcedente por insuficiência de provas (onde qualquer legitimado pode ajuizar nova ação com novas provas).
  * Em direitos individuais homogêneos: Eficácia *erga omnes* no caso de procedência para beneficiar todas as vítimas na liquidação individual (art. 103 CDC).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Inconstitucionalidade do Limite Territorial da Coisa Julgada na ACP",
        author: "STF (Tema 1075/RG)",
        thesis: "É inconstitucional o art. 16 da Lei 7.347/85 na redação da Lei 9.494/97 que restringia a eficácia da sentença coletiva à competência territorial do órgão prolator. A coisa julgada na ACP tem amplitude nacional ou regional conforme a extensão do dano.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Restrição Territorial da Coisa Julgada Coletiva",
        author: "Entendimento Superado pelo STF",
        thesis: "A decisão coletiva só produzia efeitos nos limites territoriais da comarca ou da subseção judiciária do juiz sentenciante.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que a sentença de improcedência na ACP por falta de provas faz coisa julgada material definitiva que impede nova ação (FALSO: a coisa julgada coletiva opera 'secundum eventum probationis', permitindo nova ação fundada em nova prova).",
      "Afirmar que apenas o Ministério Público pode firmar TAC (FALSO: o art. 5º, § 6º da LACP autoriza todos os órgãos públicos legitimados a celebrar compromisso de ajustamento).",
      "Dizer que cabe condenação da parte autora em honorários sucumbenciais na ACP (FALSO: art. 18 da LACP estabelece que não haverá adiantamento de custas nem honorários, salvo comprovada má-fé)."
    ],
    careerNuances: {
      AGU: "A União também possui legitimidade ativa na defesa coletiva de seus interesses patrimoniais. Em ações populares ou ACPs contra atos da União, a AGU atua em defesa do ato administrativo quando atendida a juridicidade e o interesse geral.",
      PGFN: "A ACP não pode ser utilizada como sucedâneo de ação anulatória ou de repetição de indébito tributário em favor de contribuintes (art. 1º, parágrafo único da Lei 7.347/85 e Súmula 198 do STJ vedam ACP em matéria tributária direta).",
      MPE: "O Ministério Público é o grande garantidor da tutela metaindividual. Defenda a amplitude nacional/regional da coisa julgada coletiva (Tema 1075 STF), a execução imediata das multas cominatórias do TAC e a prioridade da reparação ambiental específica (in natura) sobre a compensação pecuniária."
    }
  },

  // =========================================================================
  // 9. ATOS ADMINISTRATIVOS E PODERES DA ADMINISTRAÇÃO
  // =========================================================================
  {
    id: "atos-administrativos-poderes",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Teoria Geral dos Atos Administrativos e Poderes da Administração",
    themeKeywords: [
      "ato administrativo", "atos administrativos", "elementos do ato", "competência", "finalidade", 
      "forma", "motivo", "objeto", "atributos do ato", "presunção de legitimidade", "imperatividade", 
      "autoexecutoriedade", "tipicidade", "poder de polícia", "poder discricionário", "poder vinculado",
      "anulação", "revogação", "convalidação"
    ],
    coreDoctrine: `#### 📚 Teoria Geral dos Atos Administrativos e Poderes Estatais

* **Conceito Dogmático e Requisitos de Validade (Elementos)**:
  O ato administrativo é toda manifestação unilateral de vontade da Administração Pública que, agindo sob regime de direito público, tem por fim imediato adquirir, resguardar, transferir, modificar, extinguir ou declarar direitos, ou impor obrigações aos administrados.
  Conforme a clássica Lei da Ação Popular (Lei nº 4.717/1965, art. 2º), são 5 os elementos vinculados essenciais do ato:
  1. **Competência (Sujeito)**: Poder legal conferido ao agente para a prática do ato. É irrenunciável, improrrogável e, em regra, passível de delegação e avocação (Lei nº 9.784/1999, arts. 11 a 15).
  2. **Finalidade**: O interesse público primário visado pela norma. O desvio de finalidade acarreta nulidade insanável.
  3. **Forma**: O modo de exteriorização da vontade estatal. No direito público, a forma é solene e vinculada à legalidade.
  4. **Motivo**: O pressuposto de fato e de direito que enseja a prática do ato. Pela **Teoria dos Motivos Determinantes**, a validade do ato está indissoluvelmente vinculada à veracidade e procedência dos motivos alegados pelo agente.
  5. **Objeto (Conteúdo)**: A alteração no mundo jurídico produzida pelo ato (criação, extinção, modificação de direito ou dever).

* **Atributos do Ato Administrativo (PATI)**:
  * **Presunção de Legitimidade e Veracidade**: Os atos presumem-se conformes ao Direito e verídicos até prova idônea em contrário (presunção juris tantum). Inverte o ônus da prova em favor do Estado.
  * **Autoexecutoriedade**: A faculdade de a Administração Pública executar diretamente suas decisões sem prévia intervenção do Poder Judiciário. Presente quando expressamente autorizada em lei ou diante de urgência pública.
  * **Tipicidade**: O ato deve corresponder a uma figura previamente descrita em lei.
  * **Imperatividade**: Capacidade de impor obrigações a terceiros independentemente de concordância.

* **Extinção dos Atos Administrativos**:
  * **Anulação**: Incide sobre atos com vícios de legalidade (ilegais). Produz efeitos retroativos (*ex tunc*). Pode ser declarada pela Administração (autotutela, Súmulas 346 e 473 do STF) ou pelo Judiciário. Prazo decadencial de 5 anos para anular atos favoráveis aos administrados de boa-fé (art. 54 da Lei 9.784/1999).
  * **Revogação**: Incide sobre atos válidos, discricionários e eficazes, por motivo de conveniência e oportunidade. Produz efeitos prospectivos (*ex nunc*). Privativa da Administração Pública, sendo vedado ao Judiciário revogar atos de outro Poder.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria Dualista dos Vícios do Ato Administrativo (Nulidade e Anulabilidade)",
        author: "Hely Lopes Meirelles / Seabra Fagundes / Celso Antônio Bandeira de Mello",
        thesis: "Admite-se a convalidação de atos administrativos com vícios sanáveis (competência quanto à pessoa e forma não essencial), desde que não causem lesão ao interesse público nem prejuízo a terceiros.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria Monista da Nulidade Absoluta",
        author: "Doutrina Publicista Tradicional",
        thesis: "Todo ato administrativo violador da lei seria nulo de pleno direito, não tolerando convalidação no âmbito do Direito Público estrito.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que a revogação pode ser determinada pelo Poder Judiciário em controle de legalidade (FALSO: o Judiciário jamais revoga ato do Executivo, apenas anula se for ilegal).",
      "Confundir motivo (pressuposto fático/jurídico) com motivação (exteriorização formal das razões do ato). Nem todo ato discricionário exige prévia motivação extensa, mas uma vez motivado, aplica-se a Teoria dos Motivos Determinantes.",
      "Afirmar que a autoexecutoriedade existe em todos os atos administrativos (FALSO: não existe na cobrança de multas pecuniárias, que exige Execução Fiscal)."
    ],
    careerNuances: {
      AGU: "Sustente com vigor a presunção de legitimidade e veracidade dos atos dos Ministérios e órgãos federais. Aplique o princípio da deferência à discricionariedade técnica da Administração Pública e a impossibilidade de o Judiciário imiscuir-se no mérito administrativo.",
      PGFN: "Defenda a autoexecutoriedade e presunção de liquidez e certeza da Certidão de Dívida Ativa (CDA), ressaltando que o lançamento tributário é ato administrativo plenamente vinculado e imune a alegações genéricas de discricionariedade.",
      MPE: "O Ministério Público combate o desvio de finalidade, a motivação falsa e os atos praticados com vício de competência. Em matéria ambiental e de patrimônio público, a ausência de motivo legítimo enseja pronta instauração de Inquérito Civil e Ação Civil Pública anulatória."
    }
  },

  // =========================================================================
  // 10. DIREITO TRIBUTÁRIO: PRINCÍPIOS E IMUNIDADES
  // =========================================================================
  {
    id: "tributario-imunidades",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Imunidades Tributárias: Regimes Constitucionais e Jurisprudência dos Tribunais Superiores",
    themeKeywords: [
      "imunidade", "imunidades", "imunidade tributária", "imunidade recíproca", "imunidade religiosa", 
      "imunidade cultural", "livros eletrônicos", "art. 150, vi", "entidades beneficentes", "cebas", 
      "artigo 150, vi", "súmula vinculante 57", "súmula vinculante 52", "tema 508", "tema 385", "concepções; imunidade tributária"
    ],
    coreDoctrine: `#### 📚 Sistema Constitucional Tributário e Imunidades

* **Limitações Constitucionais ao Poder de Tributar**:
  O poder de tributar do Estado encontra limites intransponíveis nas garantias fundamentais do contribuinte previstas no art. 150 da CF/88. Trata-se de cláusulas pétreas (art. 60, § 4º, IV da CF/88), conforme pacificado pelo STF.
  1. **Legalidade Estrita (Tipicidade Fechada)**: Não há tributo sem lei prévia que defina todos os elementos da hipótese de incidência (art. 150, I da CF/88 e art. 97 do CTN). Exceções atenuadas à legalidade: alteração de alíquotas dos impostos regulatórios (II, IE, IPI e IOF) por ato do Executivo, dentro dos limites legais.
  2. **Irretroatividade**: A lei tributária nova não atinge fatos geradores consumados no passado (art. 150, III, 'a' da CF/88). Aplica-se a retroatividade benigna apenas em matéria de infrações/penalidades não definitivamente julgadas (art. 106, II do CTN).
  3. **Anterioridade Anual e Nonagesimal (Noventena)**: A instituição ou majoração de tributos exige dupla espera temporal (mesmo exercício financeiro + 90 dias).
  4. **Capacidade Contributiva e Vedação ao Confisco**: Os tributos devem respeitar a capacidade econômica do contribuinte (art. 145, § 1º da CF/88) e não podem inviabilizar o exercício de atividades lícitas ou confiscar o patrimônio privado (art. 150, IV da CF/88).

* **Imunidades Tributárias em Espécie (CF/88, art. 150, VI)**:
  * **Imunidade Recíproca (alínea 'a')**: Veda a tributação mútua entre União, Estados, DF e Municípios sobre patrimônio, renda e serviços. O STF estende a imunidade recíproca às empresas públicas e sociedades de economia mista delegatárias de serviços públicos essenciais em regime de monopólio e sem intuito de lucro (ex: Correios e Infraero). Não se aplica se houver exploração de atividade econômica em concorrência com a iniciativa privada.
  * **Imunidade Religiosa (alínea 'b')**: Abrange templos de qualquer culto, inclusive cemitérios mantidos por entidades religiosas e imóveis locados a terceiros, desde que os aluguéis sejam aplicados nas finalidades essenciais da entidade (Súmula Vinculante 52 do STF).
  * **Imunidade dos Partidos e Entidades de Educação/Assistência (alínea 'c')**: Exige o cumprimento dos requisitos legais de transparência e reinvestimento integral no País (art. 14 do CTN e Tema 32 do STF).
  * **Imunidade Cultural/Livros (alínea 'd')**: Livros, jornais, periódicos e o papel destinado a sua impressão. O STF pacificou no Tema 593 que os livros eletrônicos (e-books) e suportes exclusivos de leitura (e-readers) são alcançados pela imunidade.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Interpretação Teleológica e Extensiva das Imunidades (Posição do STF)",
        author: "Ministro Luís Roberto Barroso / Aliomar Baleeiro",
        thesis: "As imunidades constitucionais consagram direitos fundamentais e salvaguardam valores supremos (liberdade religiosa, livre manifestação, federalismo), devendo ser interpretadas de modo amplo para atingir sua finalidade prática.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Interpretação Restritiva e Literal das Desonerações Fiscais",
        author: "Doutrina Tradicional / Fazenda Pública em juízo",
        thesis: "Desonerações fiscais configuram exceção ao dever fundamental de pagar tributos, devendo limitar-se ao texto literal da norma constitucional.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam estender a imunidade aos tributos em geral. As imunidades do art. 150, VI aplicam-se exclusivamente a IMPOSTOS, não alcançando taxas nem contribuições de melhoria.",
      "Afirmar que imóvel alugado de entidade religiosa perde a imunidade do IPTU (FALSO: conforme Súmula Vinculante 52, mantém-se a imunidade se o aluguel for revertido para suas finalidades institucionais).",
      "Confundir imunidade (vedação constitucional à competência tributária) com isenção (dispensa legal do pagamento do tributo concedida por lei infraconstitucional)."
    ],
    careerNuances: {
      AGU: "Defenda a prerrogativa da União de fiscalizar o cumprimento dos requisitos do art. 14 do CTN pelas entidades imunes. Invoque o princípio da solidariedade federativa e a vedação à concessão de isenções heterônomas.",
      PGFN: "Na cobrança do crédito fazendário, sustente que a imunidade deve ser formalmente comprovada pela entidade contribuinte, combatendo fraudes em desvios de finalidade e blindagem indevida de patrimônio sob fachada filantrópica.",
      MPE: "O Ministério Público atua na fiscalização das fundações e entidades do terceiro setor, apurando se as instituições de assistência social e ensino cumprem os requisitos de aplicação integral dos recursos no País para gozo das imunidades."
    }
  },

  // =========================================================================
  // 11. DIREITO PROCESSUAL CIVIL: A FAZENDA PÚBLICA EM JUÍZO
  // =========================================================================
  {
    id: "processo-civil-fazenda-publica",
    discipline: "DIREITO PROCESSUAL CIVIL",
    title: "A Fazenda Pública em Juízo e a Teoria Geral dos Precedentes Obrigatórios",
    themeKeywords: [
      "fazenda pública em juízo", "fazenda pública", "prerrogativas da fazenda", "prazo em dobro", 
      "intimação pessoal", "remessa necessária", "reexame necessário", "execução contra a fazenda", 
      "precatórios", "rpv", "art. 100 cf", "art. 183 cpc", "art. 496 cpc", "art. 927 cpc", "precedentes judiciais"
    ],
    coreDoctrine: `#### 📚 A Fazenda Pública em Juízo e Sistema de Precedentes

* **Prerrogativas Processuais da Fazenda Pública no CPC/2015**:
  A atuação processual do Poder Público orienta-se pela defesa do erário e do interesse público indisponível, justificando regime jurídico processual diferenciado:
  1. **Prazo em Dobro para Todas as Manifestações (CPC, art. 183)**: A União, Estados, DF, Municípios e suas autarquias e fundações públicas dispõem de prazo em dobro para contestar, recorrer e manifestar-se nos autos.
  2. **Intimação Pessoal Obrigatória (CPC, art. 183, § 1º)**: A contagem dos prazos da Fazenda Pública inicia-se estritamente a partir da efetiva intimação pessoal do órgão de representação judicial (carga, remessa ou meio eletrônico formal).
  3. **Remessa Necessária (Duplo Grau Obrigatório - CPC, art. 496)**: As sentenças ilíquidas ou condenatórias proferidas contra a Fazenda não produzem efeitos senão após confirmação pelo Tribunal de Justiça ou TRF competente.
     * **Limites de Dispensa**: Não há remessa necessária quando a condenação for inferior a 1.000 salários-mínimos (União), 500 salários-mínimos (Estados/DF) ou 100 salários-mínimos (Municípios), ou se a sentença estiver fundada em precedente vinculante do STF/STJ.
  4. **Execução de Título Contra a Fazenda Pública (CPC, arts. 534 e 535)**: A execução de obrigação de pagar quantia certa faz-se pelo rito do cumprimento de sentença, com prazo de 30 dias para impugnação, sem necessidade de garantia prévia do juízo. O pagamento sujeita-se ao regime constitucional de Precatórios e Requisições de Pequeno Valor (RPV), na forma do art. 100 da CF/88.

* **Sistema de Precedentes Judiciais Vinculantes (CPC, arts. 926 e 927)**:
  O CPC/2015 consagrou o dever dos tribunais de uniformizar sua jurisprudência e mantê-la estável, íntegra e coerente (art. 926).
  São precedentes de observância obrigatória pelos juízes e tribunais:
  * Decisões do STF em controle concentrado de constitucionalidade;
  * Enunciados de Súmula Vinculante do STF;
  * Acórdãos em IRDR (Incidente de Resolução de Demandas Repetitivas), IAC (Incidente de Assunção de Competência) e Recursos Repetitivos (REsp e RE repetitivos);
  * Súmulas do STF em matéria constitucional e do STJ em matéria infraconstitucional.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Eficácia Vinculante Forte dos Precedentes Qualificados",
        author: "Fredie Didier Jr / Luiz Guilherme Marinoni / STJ",
        thesis: "Os incisos do art. 927 do CPC consagram verdadeiras normas de competência funcional vinculante, tornando nula a decisão judicial que descumprir o precedente sem demonstrar distinguishing ou overruling fundamentado.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Eficácia Persuasiva Reforçada (Livre Convencimento Motivado)",
        author: "Lenio Streck / Doutrina Crítica",
        thesis: "O rol do art. 927 não pode anular a independência jurídica do magistrado nem transformar o Direito brasileiro em sistema estrito de common law por via infraconstitucional.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que a Fazenda Pública goza de prazo em quádruplo para contestar (FALSO: o CPC/2015 unificou todos os prazos em dobro, eliminando o antigo prazo quádruplo do CPC/1973).",
      "Dizer que a penhora de bens públicos é admitida se a Fazenda não embargar a execução (FALSO: bens públicos são inalienáveis e impenhoráveis; a execução segue estritamente Precatório ou RPV).",
      "Afirmar que a dispensa de remessa necessária se baseia no valor da causa inicial (FALSO: baseia-se no valor líquido da condenação imposta na sentença)."
    ],
    careerNuances: {
      AGU: "Exija a estrita observância da intimação pessoal eletrônica no portal próprio para início de prazos (CPC, art. 183). Invoque precedentes obrigatórios do STF/STJ para julgamento monocrático imediato e extinção liminar de demandas repetitivas infundadas contra a União.",
      PGFN: "Na execução fiscal e nas ações anulatórias de débito fiscal, invoque a indisponibilidade do crédito tributário e exija a remessa necessária em sentenças ilíquidas de valor elevado que desconstituam lançamentos da União.",
      MPE: "O Ministério Público atua como fiscal da ordem jurídica (custos iuris) nas execuções contra o poder público, garantindo que a ordem cronológica de precatórios do art. 100 da CF/88 seja rigorosamente cumprida, sem quebra de isonomia ou fraudes de preferências."
    }
  },

  // =========================================================================
  // 12. DIREITO FINANCEIRO: LEI DE RESPONSABILIDADE FISCAL E ORÇAMENTO
  // =========================================================================
  {
    id: "direito-financeiro-lrf",
    discipline: "DIREITO FINANCEIRO",
    title: "Orçamento Público, Despesa e Responsabilidade na Gestão Fiscal (LRF)",
    themeKeywords: [
      "direito financeiro", "orçamento público", "leis orçamentárias", "ppa", "ldo", "loa", 
      "princípios orçamentários", "universalidade", "exclusividade", "anualidade", "não afetação", 
      "despesa pública", "receita pública", "lrf", "lei complementar 101", "limite de gastos", "restos a pagar"
    ],
    coreDoctrine: `#### 📚 Direito Financeiro e Lei de Responsabilidade Fiscal (LC 101/2000)

* **O Modelo Orçamentário Constitucional Tridimensional**:
  O art. 165 da CF/88 estrutura o planejamento financeiro estatal em três leis de iniciativa privativa do Chefe do Poder Executivo:
  1. **Plano Plurianual (PPA)**: Estabelece, de forma regionalizada, as diretrizes, objetivos e metas da administração pública para as despesas de capital e outras delas decorrentes, com vigência de 4 anos (inicia no 2º ano de mandato e finda no 1º ano do mandato seguinte).
  2. **Lei de Diretrizes Orçamentárias (LDO)**: Compreende as metas e prioridades da administração, orienta a elaboração da LOA, dispõe sobre alterações na legislação tributária e estabelece a política de aplicação das agências financeiras oficiais.
  3. **Lei Orçamentária Anual (LOA)**: Compreende o Orçamento Fiscal, o Orçamento de Investimento das estatais e o Orçamento da Seguridade Social.

* **Princípios Orçamentários Estruturantes**:
  * **Universalidade (CF, art. 165, § 5º e Lei 4.320/64, art. 2º)**: O orçamento deve conter todas as receitas e despesas de todos os poderes e fundos do ente federado.
  * **Exclusividade (CF, art. 165, § 8º)**: A LOA não conterá matéria estranha à previsão de receita e fixação de despesa, ressalvadas a autorização para abertura de créditos suplementares e a contratação de operações de crédito.
  * **Anualidade/Periodicidade**: O orçamento tem vigência coincidente com o ano civil (1º de janeiro a 31 de dezembro).
  * **Não Afetação da Receita de Impostos (CF, art. 167, IV)**: Veda a vinculação de receita de impostos a órgão, fundo ou despesa, ressalvadas as repartições constitucionais, saúde, educação e garantias a operações de crédito.

* **Pilares da Lei de Responsabilidade Fiscal (LC nº 101/2000)**:
  * **Despesa Obrigatória de Caráter Continuado (DOCC - art. 17)**: Exige estimativa de impacto orçamentário-financeiro no exercício em que deva entrar em vigor e nos dois subsequentes, além de demonstração de compensação pelo aumento de receita ou cancelamento de despesa.
  * **Limites de Despesa com Pessoal (arts. 19 e 20)**: Percentuais da Receita Corrente Líquida (RCL): 50% para a União e 60% para Estados e Municípios.
  * **Restos a Pagar (art. 42)**: Veda ao titular de Poder nos últimos 8 meses de mandato contrair obrigação de despesa que não possa ser integralmente cumprida dentro dele, ou que tenha parcelas a serem pagas no exercício seguinte sem que haja suficiente disponibilidade de caixa.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Natureza Jurídica do Orçamento no Brasil: Lei em Sentido Formal",
        author: "STF / Régis Fernandes de Oliveira",
        thesis: "O orçamento é ato de planejamento que autoriza gastos (orçamento autorizativo), gerando discricionariedade mitigada para a Administração, ressalvadas as emendas impositivas e os pisos constitucionais de saúde e educação.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Orçamento como Lei Materialmente Obrigatória (Orçamento Impositivo Total)",
        author: "Doutrina Financeira Contemporânea",
        thesis: "O orçamento consolidado no Estado Social de Direito impõe verdadeiro dever jurídico de execução das políticas públicas aprovadas pelo Parlamento, não mero ato gracioso do Executivo.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que a vedação de vinculação de receitas abrange tributos em geral (FALSO: a vedação do art. 167, IV aplica-se EXCLUSIVAMENTE a impostos; taxas e contribuições especiais podem e costumam ter receitas vinculadas).",
      "Dizer que créditos extraordinários exigem prévia dotação orçamentária ou autorização em lei ordinária (FALSO: abrem-se por Medida Provisória ou Decreto para despesas imprevisíveis e urgentes, como guerra ou calamidade pública).",
      "Afirmar que a LRF permite contrair despesas sem dotação se houver superávit financeiro estimado no final do ano (FALSO: a inexistência de dotação acarreta nulidade do ato e crime de responsabilidade fiscal)."
    ],
    careerNuances: {
      AGU: "Sustente a teoria da 'Reserva do Possível' e a vedação à criação de despesas públicas por via judicial sem prévia dotação orçamentária (CF, art. 167 e ADPF 347 do STF).",
      PGFN: "Na consultoria fiscal da União, zele pela observância estrita dos limites da LRF, das metas fiscais do arcabouço orçamentário e da legalidade na contratação de operações de crédito e renúncias fiscais (art. 14 da LRF).",
      MPE: "O Ministério Público atua com rigor na fiscalização dos limites de despesa com pessoal dos Municípios e Estados e no cumprimento do art. 42 da LRF (proibição de contrair despesas sem caixa no fim de mandato), ajuizando ações de improbidade e ações civis públicas."
    }
  }
,

  // =========================================================================
  // MINISTÉRIO PÚBLICO: PRINCÍPIOS INSTITUCIONAIS, GARANTIAS, VEDAÇÕES E PODERES INVESTIGATÓRIOS CRIMINAIS
  // =========================================================================
    {
    "id": "fuc-mp-principios-institucionais",
    "discipline": "MINISTÉRIO PÚBLICO E EXECUÇÃO PENAL",
    "title": "Ministério Público: Princípios Institucionais, Garantias, Vedações e Poderes Investigatórios Criminais",
    "themeKeywords": [
      "ministério público",
      "principios institucionais",
      "unidade",
      "indivisibilidade",
      "independencia funcional",
      "promotor natural",
      "poderes investigatórios",
      "re 593727",
      "pic",
      "resolucao 181",
      "cnmp",
      "anpp",
      "anpc",
      "mp junto ao tcu",
      "sumula 234 stj",
      "sumula 601 stj"
    ],
    "coreDoctrine": "#### 🏛️ Teoria Geral e Princípios Institucionais do Ministério Público\n\n* **Conceito Dogmático e Natureza Constitucional (Art. 127, CF/88)**:\n  O Ministério Público é instituição permanente, essencial à função jurisdicional do Estado, incumbindo-lhe a defesa da ordem jurídica, do regime democrático e dos interesses sociais e individuais indisponíveis. Conforme sedimentado pelo STF, o Ministério Público não integra nenhum dos três Poderes tradicionais (Executivo, Legislativo ou Judiciário), configurando um órgão estatal autônomo com estatura constitucional originária dotado de autonomia funcional, administrativa e orçamentária (art. 127, §§ 1º e 2º).\n\n* **Princípios Institucionais Fundamentais (Art. 127, § 1º, CF/88)**:\n  1. **Unidade**: O Ministério Público é uno, formando um só corpo sob uma única chefia institucional em cada esfera (Procurador-Geral da República na União e Procuradores-Gerais de Justiça nos Estados). A unidade opera dentro de cada ramo institucional, de modo que o Ministério Público da União (MPF, MPT, MPM, MPDFT) e os Ministérios Públicos Estaduais mantêm suas próprias linhas estruturais;\n  2. **Indivisibilidade**: Os membros do Ministério Público podem substituir-se reciprocamente no curso do processo, nos termos definidos pela lei orgânica, uma vez que quem se manifesta nos autos é a própria instituição do Ministério Público e não a pessoa física do membro que subscreve a peça;\n  3. **Independência Funcional**: No exercício específico de suas funções institucionais e processuais, o membro do Ministério Público submete-se exclusivamente à sua consciência jurídica e à ordem normativa, descabendo qualquer ingerência hierárquica ou vinculação de mérito por ordens do Procurador-Geral ou de órgãos colegiados da instituição.\n\n* **Princípios Implícitos de Matriz Constitucional**:\n  * **Princípio do Promotor Natural**: O cidadão tem o direito fundamental de ser processado por órgão do Ministério Público cuja atribuição esteja prévia e abstratamente fixada em lei, vedando-se a criação de órgãos de acusação ad hoc ou designações casuísticas de exceção pela chefia institucional;\n  * **Princípio da Indisponibilidade da Ação Penal Pública**: Proposta a ação penal pública condenatória, o Ministério Público não pode dela desistir (art. 42 do CPP);\n  * **Princípio da Resolutividade Institucional**: Dever de atuação vocacionada à tutela material efetiva dos direitos difusos, coletivos e indisponíveis, priorizando soluções consensuais como o TAC e o ANPC.\n\n* **Poderes Investigatórios Criminais do Ministério Público (STF - RE 593.727/MG, Tema 184 da Repercussão Geral)**:\n  O Supremo Tribunal Federal fixou a tese de repercussão geral consagrando que o Ministério Público dispõe de competência originária para promover, por autoridade própria e por prazo razoável, investigações de natureza penal, instaurando o Procedimento Investigatório Criminal (PIC), regulamentado pela Resolução nº 181/2017 do CNMP.\n  * **Fundamento Hermenêutico**: Aplicação da **Teoria dos Poderes Implícitos** (*implied powers doctrine*), de extração constitucional norte-americana (John Marshall, *McCulloch v. Maryland*, 1819). Se a Carta Magna atribuiu ao Ministério Público o fim supremo de promover, privativamente, a ação penal pública (art. 129, I), outorgou-lhe tacitamente os meios necessários à colheita idônea da prova acusatória;\n  * **Condições Insuperáveis de Validade Fixadas pelo STF**:\n    1. A investigação deve observar estritamente as garantias do investigado e o contraditório diferido;\n    2. Aplicação obrigatória da **Súmula Vinculante nº 14 do STF**, garantindo ao defensor ampla vista dos elementos de prova já documentados;\n    3. As medidas restritivas de direitos sujeitas à reserva de jurisdição (interceptação telefônica, busca e apreensão domiciliar, quebra de sigilo fiscal e bancário) exigem prévia autorização judicial;\n    4. Controle judicial dos atos investigatórios pelo Poder Judiciário competente.\n\n* **Conselho Nacional do Ministério Público (CNMP - Art. 130-A, CF/88)**:\n  Órgão de cúpula para controle da atuação administrativa e financeira do Ministério Público e do cumprimento dos deveres funcionais de seus membros. Possui 14 membros nomeados pelo Presidente da República após aprovação pelo Senado Federal, presidido pelo Procurador-Geral da República. O CNMP detém competência correicional originária e concorrente em relação às corregedorias locais.\n\n* **Ministério Público junto ao Tribunal de Contas (Art. 73, § 2º, I e Art. 130, CF/88)**:\n  O Ministério Público especial que atua perante o Tribunal de Contas da União ou dos Estados integra a estrutura orgânica da respectiva Corte de Contas, não compondo o Ministério Público da União nem os Ministérios Públicos Estaduais. Aplica-se a **Súmula nº 653 do STF**: no Tribunal de Contas da União, a vaga destinada ao Ministério Público especial deve ser preenchida exclusivamente por membros da própria carreira ministerial junto àquela Corte.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Competência Investigatória Criminal Direta do MP (Tese Vencedora - STF)",
        "author": "STF (RE 593.727/MG, Rel. Min. Gilmar Mendes) e Doutrina Maior (Hugo Nigro Mazzilli)",
        "thesis": "O Ministério Público dispõe de competência para promover diretamente investigações penais com base na Teoria dos Poderes Implícitos, sem monopólio probatório da polícia judiciária.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Exclusividade da Polícia Judiciária na Presidência do Inquérito (Tese Vencida)",
        "author": "Corrente Minoritária de Delegados de Polícia e Parte da Doutrina Garantista",
        "thesis": "A investigação preliminar seria atividade privativa das polícias civil e federal nos termos do art. 144, §§ 1º e 4º da Constituição, cabendo ao MP apenas o controle externo da atividade policial.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "PEGA DE PROVA CLÁSSICO: A participação de membro do Ministério Público na fase investigatória preliminar NÃO acarreta impedimento ou suspeição para o oferecimento da denúncia ou atuação no processo penal (Súmula 234 do STJ).",
      "ATENÇÃO: O Ministério Público tem plena legitimidade ativa para propor Ação Civil Pública na defesa de direitos individuais indisponíveis ou de interesse social relevante, conforme pacificado na Súmula 601 do STJ.",
      "CUIDADO: É inconstitucional norma de lei estadual que confira à Procuradoria-Geral do Estado ou à Secretaria de Fazenda competência privativa para apurar crimes tributários, usurpando os poderes investigatórios do MP.",
      "PEGADINHA DO MP ESPECIAL: Os membros do MP junto ao Tribunal de Contas possuem as mesmas garantias e vedações dos demais membros, mas pertencem a quadro próprio agregado à Corte de Contas e não participam das eleições para PGR ou PGJ."
    ],
    "careerNuances": {
      "MPE": "Tema fundamental para ingresso na carreira ministerial. Domínio absoluto da Resolução 181/2017 do CNMP, poderes do PIC, limites materiais do Acordo de Não Persecução Penal (art. 28-A do CPP) e tutela coletiva resolutiva.",
      "AGU": "Compreender com precisão a distinção dogmática entre as funções do Ministério Público (fiscal da ordem jurídica e titular da ação penal pública) e da Advocacia Pública (representação judicial e consultoria jurídica do Poder Executivo, art. 131 da CF).",
      "PGFN": "Foco na articulação entre o MPF/MPE e a Fazenda Pública no combate aos crimes contra a ordem tributária (Lei 8.137/1990) e o respeito à Súmula Vinculante 24 do STF."
    }
  },

  // =========================================================================
  // EXECUÇÃO PENAL: PRINCÍPIOS FUNDAMENTAIS, COLETA DE PERFIL GENÉTICO E REGIME DISCIPLINAR DIFERENCIADO
  // =========================================================================
    {
    "id": "fuc-lep-principios-rdd",
    "discipline": "MINISTÉRIO PÚBLICO E EXECUÇÃO PENAL",
    "title": "Execução Penal: Princípios Fundamentais, Coleta de Perfil Genético e Regime Disciplinar Diferenciado",
    "themeKeywords": [
      "execução penal",
      "lep",
      "lei 7210",
      "rdd",
      "regime disciplinar diferenciado",
      "perfil genético",
      "art 9-a",
      "numerus clausus",
      "transcendencia minima",
      "sumula 192 stj",
      "falta grave"
    ],
    "coreDoctrine": "#### ⛓️ Princípios Estruturantes da Execução Penal e Dogmática da LEP\n\n* **Finalidade Bivalente da Execução Penal (Art. 1º da Lei 7.210/1984 - LEP)**:\n  A execução penal objetiva efetivar as disposições de sentença ou decisão criminal e proporcionar condições para a harmônica integração social do condenado e do internado. Congrega simultaneamente o caráter retributivo-preventivo estatal e o imperativo ressocializador humanitário.\n\n* **Princípio da Jurisdicionalidade (Art. 2º da LEP e Súmula nº 192 do STJ)**:\n  A execução das penas privativas de liberdade e das medidas de segurança submete-se ao controle jurisdicional indelegável. Compete ao Juízo das Execuções Penais do Estado a execução das penas impostas a sentenciados pela Justiça Federal, Militar ou Eleitoral, quando recolhidos a estabelecimentos prisionais estaduais (Súmula 192 do STJ).\n\n* **Princípio da Individualização da Execução Penal e Classificação**:\n  Os condenados serão classificados, segundo os seus antecedentes e personalidade, para orientar a individualização da execução penal (art. 5º da LEP), atuando a Comissão Técnica de Classificação (CTC).\n\n* **Identificação Obrigatória de Perfil Genético (Art. 9º-A da LEP, com redação do Pacote Anticrime - Lei 13.964/2019)**:\n  O condenado por crime doloso praticado com violência grave contra a pessoa, bem como por crime contra a vida, contra a liberdade sexual ou por crime sexual contra vulnerável, será submetido, obrigatoriamente, à identificação do perfil genético, mediante extração de DNA por técnica adequada e indolor, por ocasião do ingresso no estabelecimento prisional.\n  * **Regras Especiais e Garantias da Amostra**:\n    1. A amostra biológica só poderá ser utilizada para permitir a identificação pelo perfil genético, vedadas expressamente as práticas de **fenotipagem genética** (art. 9º-A, § 5º);\n    2. A recusa injustificada do condenado em submeter-se ao procedimento constitui **falta disciplinar grave** (art. 9º-A, § 8º);\n    3. Nos crimes hediondos e equiparados, o processamento de vestígios biológicos e a inclusão nos bancos deve ser concluída em até 30 dias (art. 9º-A, § 10);\n    4. **Constitucionalidade perante o STF (Tema 1.048 da Repercussão Geral, RE 973.837)**: O Plenário Virtual reconheceu a repercussão geral sobre a constitucionalidade da coleta compulsória frente à garantia contra a autoincriminação (*nemo tenetur se detegere*), prevalecendo a validade da extração como elemento de identificação civil-criminal qualificada.\n\n* **Princípio do *Numerus Clausus* e Princípio da Transcendência Mínima**:\n  * ***Numerus Clausus***: Doutrina orientada ao controle de densidade carcerária fixando que o ingresso de novo custodiado em unidade lotada exige a prévia liberação de vaga mediante progressão ou saída, inspirada no HC Coletivo 143.641 do STF e na jurisprudência do STF no RE 580.252;\n  * **Transcendência Mínima**: A execução da pena não pode recair sobre a pessoa dos familiares do preso, impondo respeito absoluto à dignidade do visitante e vedando revistas íntimas vexatórias e degradantes.\n\n* **Regime Disciplinar Diferenciado (RDD - Art. 52 da LEP com Pacote Anticrime)**:\n  Modalidade sancionatória de cumprimento da pena privativa de liberdade em estabelecimento fechado de segurança máxima.\n  * **Hipóteses Cabíveis**:\n    1. Prática de fato previsto como crime doloso que constitua falta grave e cause subversão da ordem ou disciplina internas;\n    2. Presos provisórios ou condenados nacionais ou estrangeiros que apresentem alto risco para a ordem e a segurança do estabelecimento ou da sociedade;\n    3. Fundadas suspeitas de envolvimento ou participação, a qualquer título, em organização criminosa, associação criminosa ou milícia privada.\n  * **Regime Jurídico Estrito**:\n    * Duração máxima de até **2 anos**, sem prejuízo de repetição da sanção por nova falta grave de mesma espécie;\n    * Recolhimento em cela individual;\n    * Visitas quinzenais, de 2 pessoas por vez, a serem realizadas em instalações equipadas para impedir contato físico e passagem de objetos, por 2 horas;\n    * Banho de sol de 2 horas diárias, em grupos de até 4 presos, desde que não pertençam à mesma organização criminosa nem sejam rivais.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Constitucionalidade e Rigor Instrumental do RDD",
        "author": "STF e STJ (Jurisprudência Dominante)",
        "thesis": "O RDD não consubstancia pena cruel nem tratamento desumano, mas medida de contenção disciplinar proporcional e estritamente necessária contra líderes de facções e presos de alta periculosidade.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Inconstitucionalidade por Violação do Princípio da Humanidade",
        "author": "Doutrina Crítica Garantista (Juarez Cirino dos Santos)",
        "thesis": "O isolamento prolongado em RDD e a restrição severa de contato humano vulneram a integridade psíquica do apenado e aniquilam a diretriz ressocializadora da pena.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "PRAZO DO RDD PÓS-PACOTE ANTICRIME: O prazo máximo original de 360 dias FOI AMPLIADO para até 2 anos pelo Pacote Anticrime (Lei 13.964/2019), admitindo renovações sucessivas quando o apenado continuar apresentando alto risco para a sociedade.",
      "ATENÇÃO COM A IDENTIFICAÇÃO DO PERFIL GENÉTICO: Constitui falta grave a recusa do condenado em submeter-se ao procedimento (art. 9º-A, § 8º da LEP), dispositivo expressamente mantido pelo Congresso Nacional após rejeição de veto.",
      "PEGADINHA DO BANHO DE SOL: No RDD, o banho de sol é de 2 horas diárias em grupos de no máximo 4 presos, sendo expressamente proibido o contato entre membros de mesma facção ou facções rivais.",
      "NÃO CONFUNDA: A interposição de Agravo em Execução (art. 197 da LEP) NÃO possui efeito suspensivo como regra, aplicando-se o rito do Recurso em Sentido Estrito no prazo de 5 dias (Súmula 700 do STF)."
    ],
    "careerNuances": {
      "MPE": "Matéria de cobrança maciça na prova do Ministério Público. Conhecimento aprofundado dos requisitos do RDD, fiscalização das condições prisionais e instauração de PAD disciplinar com ampla defesa.",
      "AGU": "Defesa da União nos presídios federais de segurança máxima e manutenção do isolamento de líderes do crime organizado em litígios constitucionais perante o STF e STJ.",
      "PGFN": "A cobrança de multas penais na execução da pena e sua inscrição em dívida ativa da Fazenda Pública após o julgamento da ADI 3.150 pelo STF."
    }
  },

  // =========================================================================
  // EXECUÇÃO DAS PENAS EM ESPÉCIE: REGIMES, NOVOS PERCENTUAIS DE PROGRESSÃO, REMIÇÃO E LIVRAMENTO CONDICIONAL
  // =========================================================================
    {
    "id": "fuc-lep-regimes-progressao-remicao",
    "discipline": "MINISTÉRIO PÚBLICO E EXECUÇÃO PENAL",
    "title": "Execução das Penas em Espécie: Regimes, Novos Percentuais de Progressão, Remição e Livramento Condicional",
    "themeKeywords": [
      "progressão de regime",
      "percentuais lep",
      "pacote anticrime",
      "remição",
      "art 112 lep",
      "art 126 lep",
      "sumula vinculante 56",
      "sumula 491 stj",
      "sumula 534 stj",
      "livramento condicional",
      "exame criminologico",
      "sumula vinculante 26"
    ],
    "coreDoctrine": "#### 📊 Sistema Progressivo e Execução das Penas Privativas de Liberdade\n\n* **Regimes Penitenciários e a Súmula Vinculante nº 56 do STF**:\n  * Regimes: Fechado (estabelecimento de segurança máxima ou média), Semiaberto (colônia agrícola, industrial ou similar) e Aberto (casa de albergado ou estabelecimento adequado);\n  * **Súmula Vinculante nº 56**: A falta de estabelecimento penal adequado não autoriza a manutenção do condenado em regime prisional mais gravoso. Havendo déficit de vagas, cumpre ao juiz aplicar parâmetros substitutivos fixados no RE 641.320: saída antecipada de sentenciado mais antigo, liberdade eletronicamente monitorada e regime aberto domiciliar;\n  * **Vedação da Progressão *Per Saltum***: É inadmissível a progressão de regime prisional por salto, isto é, direto do regime fechado para o aberto, sem passar pelo semiaberto (Súmula 491 do STJ).\n\n* **Novos Percentuais de Progressão de Regime (Art. 112 da LEP com Lei 13.964/2019)**:\n  O Pacote Anticrime revogou integralmente o antigo critério fracionário (1/6, 2/5 e 3/5), instituindo um sistema escalonado por percentuais atrelados à primariedade, reincidência e natureza hedionda ou violenta da conduta:\n  1. **16%**: apenado primário, crime cometido sem violência à pessoa ou grave ameaça;\n  2. **20%**: apenado reincidente em crime cometido sem violência à pessoa ou grave ameaça;\n  3. **25%**: apenado primário, crime cometido com violência à pessoa ou grave ameaça;\n  4. **30%**: apenado reincidente em crime cometido com violência à pessoa ou grave ameaça;\n  5. **40%**: apenado primário condenado pela prática de crime hediondo ou equiparado;\n  6. **50%**: apenado primário condenado pela prática de crime hediondo ou equiparado com resultado morte (vedado o livramento condicional), ou condenado por exercer o comando de organização criminosa estruturada para a prática de crime hediondo, ou condenado pela prática do crime de constituição de milícia privada;\n  7. **60%**: apenado reincidente na prática de crime hediondo ou equiparado;\n  8. **70%**: apenado reincidente em crime hediondo ou equiparado com resultado morte (vedado o livramento condicional).\n\n* **Requisito Subjetivo e Exame Criminológico (Súmula Vinculante nº 26 e Súmula 439 do STJ)**:\n  A progressão pressupõe bom comportamento carcerário atestado pelo diretor do estabelecimento. O juiz da execução penal pode requisitar a realização de **exame criminológico**, desde que o faça por meio de decisão concretamente motivada pelas peculiaridades do caso (Súmula Vinculante 26 e Súmula 439 do STJ). A gravidade abstrata do delito não basta para legitimar o exame.\n\n* **Instituto da Remição de Pena (Arts. 126 a 128 da LEP)**:\n  O apenado que cumpre pena em regime fechado ou semiaberto poderá remir tempo de execução:\n  * **Remição pelo Trabalho**: 1 dia de pena a cada 3 dias trabalhados (jornada de 6 a 8 horas diárias);\n  * **Remição pelo Estudo**: 1 dia de pena a cada 12 horas de frequência escolar (ensino fundamental, médio, técnico ou superior), distribuídas em no mínimo 3 dias;\n  * **Remição pela Leitura**: Conforme Recomendação nº 44/2013 e Resolução nº 391/2021 do CNJ, viabiliza a remição de 4 dias de pena por livro lido e avaliado por resenha, limitada a 12 obras por ano (máximo de 48 dias anuais);\n  * **Perda dos Dias Remidos por Falta Grave**: O art. 127 da LEP com redação da Lei 12.245/2010 estabelece que, cometida falta grave, o juiz poderá revogar até **1/3** do tempo remido, observado o disposto no art. 57, recomeçando a contagem a partir da data da infração disciplinar (Súmula Vinculante nº 9 do STF).\n\n* **Falta Grave e Seus Efeitos Restritos**:\n  * **Interrompe o prazo para nova progressão de regime** (Súmula 534 do STJ);\n  * **NÃO interrompe o prazo para obtenção de livramento condicional** (Súmula 441 do STJ);\n  * **NÃO interrompe o prazo para comutação de pena ou indulto** (Súmula 535 do STJ).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Reincidência Específica para Percentuais Qualificados de Hediondos",
        "author": "STJ (Terceira Seção - Tema Repetitivo 1.072)",
        "thesis": "A incidência do percentual de 60% ou 70% para progressão pressupõe reincidência específica em crime hediondo. A reincidência genérica atrai o patamar menor.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Reincidência Genérica Suficiente para Elevação do Percentual",
        "author": "Posição Minoritária de Primeiras Instâncias",
        "thesis": "A reincidência em qualquer delito comum bastaria para agravar o percentual do apenado condenado por crime hediondo.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "CUIDADO COM AS SÚMULAS DE FALTA GRAVE: Falta grave zera a contagem para progressão de regime (Súmula 534 STJ), mas NÃO zera o prazo para livramento condicional (Súmula 441 STJ) nem para indulto (Súmula 535 STJ).",
      "ATENÇÃO: A perda dos dias remidos em caso de falta grave limita-se expressamente ao teto legal de 1/3 (art. 127 da LEP), sendo constitucional esse regramento (Súmula Vinculante 9). O juiz não pode decretar a perda integral.",
      "PROGRESSÃO DA MULHER MÃE (Art. 112, § 3º da LEP): Mulher gestante ou mãe de filhos de até 12 anos ou com deficiência progride com apenas 1/8 (12,5%) da pena, desde que primária, bom comportamento e sem violência contra o descendente.",
      "LIVRAMENTO CONDICIONAL EXIGE COMPORTAMENTO HISTÓRICO: Pelo Pacote Anticrime, exige-se bom comportamento carcerário durante TODO o período de cumprimento da pena, não bastando atestado relativo aos últimos meses."
    ],
    "careerNuances": {
      "MPE": "Tema com altíssima incidência em peças e questões objetivas do MP. Cálculos de liquidação de penas, insurgência contra saídas temporárias sem vigilância e impugnação de progressões sem o lapso temporal correto.",
      "AGU": "Acompanhamento das ações perante a Corte Interamericana de Direitos Humanos e implementação de decisões judiciais estruturais do STF sobre superlotação dos presídios.",
      "PGFN": "Conexão com os créditos de prestação pecuniária e indenizações fixadas na sentença penal condenatória em favor do erário público."
    }
  },

  // =========================================================================
  // SISTEMA DE PRECEDENTES OBRIGATÓRIOS: ART. 927 DO CPC, TÉCNICAS DE CONFRONTO E SUPERAÇÃO
  // =========================================================================
    {
    "id": "fuc-cpc-precedentes-vinculantes",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Sistema de Precedentes Obrigatórios: Art. 927 do CPC, Técnicas de Confronto e Superação",
    "themeKeywords": [
      "precedentes",
      "art 927 cpc",
      "ratio decidendi",
      "obiter dictum",
      "distinguishing",
      "overruling",
      "modulação de efeitos",
      "recursos repetitivos",
      "irdr",
      "iac",
      "segurança juridica"
    ],
    "coreDoctrine": "#### 🏛️ Teoria dos Precedentes Judiciais no CPC/2015\n\n* **Dever de Uniformidade, Estabilidade, Integridade e Coerência (Art. 926 do CPC)**:\n  Os tribunais devem uniformizar sua jurisprudência e mantê-la estável, íntegra e coerente. A integridade exige que as decisões sejam fundamentadas no conjunto coerente do ordenamento, não permitindo julgamentos voluntaristas ou casuísticos; a coerência impede que casos idênticos recebam respostas contraditórias da mesma corte jurisdicional.\n\n* **Rol dos Precedentes de Eficácia Obrigatória / Vinculante (Art. 927 do CPC)**:\n  Os juízes e os tribunais observarão compulsoriamente:\n  1. As decisões do Supremo Tribunal Federal em controle concentrado de constitucionalidade;\n  2. Os enunciados de súmula vinculante;\n  3. Os acórdãos em incidente de assunção de competência (IAC) ou em julgamento de recursos extraordinário e especial repetitivos;\n  4. Os enunciados das súmulas do Supremo Tribunal Federal em matéria constitucional e do Superior Tribunal de Justiça em matéria infraconstitucional;\n  5. As orientações do plenário ou do órgão especial aos quais estiverem vinculados.\n\n* **Anatomia do Precedente Judicial**:\n  * ***Ratio Decidendi* (Razão de Decidir ou Holding)**: Consiste na tese jurídica necessária, indispensável e determinante acolhida pelo tribunal para a resolução do litígio. Constitui o núcleo vinculante do precedente judicial;\n  * ***Obiter Dictum* (Dito de Passagem)**: Juízos e reflexões argumentativas que não se revelam cruciais para o desfecho lógico do julgamento. Possui natureza meramente persuasiva, sem força formal de vinculação obrigatória.\n\n* **Técnicas de Confronto e Superação de Precedentes**:\n  * ***Distinguishing* (Distinção)**: Demonstração analítica e motivada de que o caso concreto sob julgamento ostenta peculiaridades fáticas ou jurídicas essenciais que o distinguem do precedente vinculante, afastando justificadamente a sua incidência (art. 489, § 1º, VI do CPC);\n  * ***Overruling* (Superação)**: Revogação formal da eficácia do precedente pelo próprio tribunal emissor em razão de transformações axiológicas, sociais, científicas ou legislativas que tornaram a tese anacrônica ou insustentável;\n  * ***Overruling* Difuso vs Concentrado**: O overruling concentrado ocorre quando a Corte anuncia expressamente a mudança de orientação em recurso paradigma; o difuso processa-se gradualmente nas câmaras recursais até a sua pacificação em sessão plenária;\n  * ***Anticipatory Overruling* (Superação Antecipada)**: Juízes de instâncias inferiores deixam de aplicar precedente formal diante de claros e inequívocos indicativos emitidos pela Corte de Vértice de que a jurisprudência está prestes a ruir. O CPC/2015 desautoriza a superação antecipada generalizada em prestígio ao art. 927.\n\n* **Modulação Temporal de Efeitos na Mudança de Precedente (Art. 927, § 3º do CPC)**:\n  Na hipótese de alteração de jurisprudência pacificada do Supremo Tribunal Federal e dos tribunais superiores ou daquela oriunda de julgamento de recursos repetitivos, pode haver modulação dos efeitos da alteração no interesse social e no da segurança jurídica, fixando eficácia prospectiva ou temporalmente delimitada.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Taxatividade Mitigada do Rol do Art. 927 do CPC",
        "author": "Doutrina Processualista Majoritária (Fredie Didier Jr., Daniel Mitidiero)",
        "thesis": "O rol do art. 927 do CPC consagra padrões vinculantes imperativos, admitindo que novas técnicas de repercussão estrutural e controle de constitucionalidade sejam incorporadas harmonicamente.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Caráter Meramente Persuasivo dos Precedentes Infraconstitucionais",
        "author": "Corrente Minoritária Tradicional",
        "thesis": "Argumenta que apenas as decisões com expressa previsão constitucional (como ADI, ADC e Súmula Vinculante) teriam força estritamente vinculante, não podendo a lei processual ordinária criar novas espécies de vinculação rígida para juízes de primeiro grau.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "DEVER QUALIFICADO DE MOTIVAÇÃO: O art. 489, § 1º, VI do CPC considera não fundamentada a decisão judicial que deixar de seguir enunciado de súmula, jurisprudência ou precedente invocado pela parte, sem demonstrar a existência de distinção (distinguishing) ou superação (overruling).",
      "CABIMENTO DE RECLAMAÇÃO CONSTITUCIONAL: Cabe reclamação para garantir a observância de acórdão proferido em julgamento de recurso especial ou extraordinário repetitivo SOMENTE APÓS o esgotamento das instâncias ordinárias (art. 988, § 5º, II do CPC).",
      "RECURSO CABÍVEL CONTRA DECISÃO QUE APLICA REPETITIVO: Contra a decisão de presidente ou vice-presidente de tribunal local que nega seguimento a REsp/RE com base em tese repetitiva cabe AGRAVO INTERNO (art. 1.030, § 2º), e NÃO agravo em REsp/RE do art. 1.042.",
      "MODULAÇÃO NO CPC: A modulação de efeitos prescinde de quórum de 2/3 quando fundada no art. 927, § 3º do CPC para tribunais ordinários, embora no STF em sede concentrada mantenha-se o quórum de 2/3 (art. 27 da Lei 9.868/99)."
    ],
    "careerNuances": {
      "AGU": "Atuação central da Advocacia Pública no manejo de teses repetitivas, IRDR e incidentes de assunção de competência para combater litígios de massa contra a União Federal.",
      "PGFN": "Aplicação da dispensa de recorrer vinculada aos precedentes do STF e STJ (Portarias PGFN e art. 19 da Lei 10.522/2002), viabilizando encerramento célere de cobranças fiscais desconformes com os repetitivos.",
      "MPE": "Uso do microssistema de formação de precedentes qualificados na defesa do patrimônio público e do meio ambiente, bem como provocação de IRDR nos Tribunais de Justiça estaduais."
    }
  },

  // =========================================================================
  // TEORIA GERAL DA AÇÃO: EVOLUÇÃO HISTÓRICA, TEORIA DA ASSERÇÃO E CONDIÇÕES DA AÇÃO NO CPC/2015
  // =========================================================================
    {
    "id": "fuc-cpc-teoria-da-acao",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Teoria Geral da Ação: Evolução Histórica, Teoria da Asserção e Condições da Ação no CPC/2015",
    "themeKeywords": [
      "teoria da acao",
      "condicoes da acao",
      "teoria da asserção",
      "in status assertionis",
      "liebman",
      "teoria eclética",
      "legitimidade ad causam",
      "interesse de agir",
      "art 17 cpc",
      "art 485 vi cpc"
    ],
    "coreDoctrine": "#### 🎯 Teoria Geral da Ação e Condições da Ação no CPC/2015\n\n* **Conceito de Ação e Evolução Teórica**:\n  O direito de ação é o direito público, subjetivo, autônomo e abstrato de exigir do Estado-Juiz a prestação jurisdicional definitiva para a tutela de situações jurídicas materiais controvertidas.\n  * **1. Teoria Civilista ou Imanentista (Savigny)**: A ação é o próprio direito material em movimento armado para a sua defesa após a ocorrência de uma lesão. Não há ação sem direito substantivo;\n  * **2. Teoria Concreta da Ação (Muther, Wach)**: A ação é autônoma, mas só existe se o demandante for o titular do direito material e tiver direito a uma sentença de mérito favorável;\n  * **3. Teoria Abstrata da Ação (Degenkolb, Plósz)**: A ação é o direito de provocar o Judiciário e obter um pronunciamento jurisdicional qualquer, mesmo que terminativo ou desfavorável;\n  * **4. Teoria Eclética da Ação (Enrico Tullio Liebman)**: A ação é o direito a um julgamento sobre o mérito da causa. A obtenção do pronunciamento meritório depende do preenchimento de requisitos especiais denominados **condições da ação**.\n\n* **O Modelo Adotado pelo CPC/2015 (Arts. 17 e 485, VI)**:\n  O CPC/2015 operou uma profunda reestruturação na teoria liebmaniana:\n  * Suprimiu a **possibilidade jurídica do pedido** do rol das condições da ação, transferindo a sua análise para o mérito do litígio (art. 487 do CPC);\n  * Restaram como legítimas condições da ação apenas:\n    1. **Legitimidade das partes (*ad causam*)**: pertinência subjetiva da demanda (quem pleiteia e contra quem se pleiteia);\n    2. **Interesse processual (ou de agir)**: consubstanciado no binômio *necessidade-utilidade* (e pela doutrina dominante, o trinômio *necessidade-utilidade-adequação* do procedimento eleito).\n\n* **Teoria da Asserção (*In Status Assertionis*) e a Posição do STJ**:\n  A jurisprudência do Superior Tribunal de Justiça consagrou pacificamente a **Teoria da Asserção**:\n  * As condições da ação devem ser aferidas pelo julgador à luz exclusivamente das afirmações deduzidas pelo autor na petição inicial, tomadas em abstrato como verdadeiras;\n  * Se a verificação da legitimidade ou do interesse exigir dilação probatória, instrução complexa e cognição exauriente, a matéria transmuda-se em **questão de mérito**, impondo a prolação de sentença definitiva de procedência ou improcedência (com força de coisa julgada material - art. 487, I), e não de extinção terminativa sem resolução de mérito (art. 485, VI).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Teoria da Asserção (Jurisprudência Pacífica do STJ)",
        "author": "STJ (REsp 1.838.077/SP, REsp 1.605.470/RJ) e Kazuo Watanabe",
        "thesis": "As condições da ação devem ser verificadas à luz das alegações da inicial. Exigindo instrução probatória para comprovação, o provimento jurisdicional recai sobre o mérito da causa.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Teoria Eclética Clássica de Liebman em Sentido Estrito",
        "author": "Enrico Tullio Liebman (3ª Edição de suas lições) e José Roberto dos Santos Bedaque",
        "thesis": "As condições da ação podem ser aferidas a qualquer tempo e grau de jurisdição até a sentença final, devendo resultar sempre em carência de ação se ausentes no momento da decisão.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "EXTINÇÃO POR IMPOSSIBILIDADE JURÍDICA É MÉRITO NO CPC/2015: No CPC/2015, se o pedido for vedado pelo ordenamento (ex: cobrança de dívida de jogo ilícita), a sentença é de IMPROCEDÊNCIA DO PEDIDO com resolução de mérito (art. 487, I), e não de carência da ação sem mérito.",
      "TEORIA DA ASSERÇÃO NO STJ: Em prova de concurso, se o enunciado narrar que o juiz precisou ouvir testemunhas e realizar perícia para constatar a ilegitimidade do réu, a resposta correta à luz da teoria da asserção é a EXTINÇÃO COM RESOLUÇÃO DO MÉRITO (improcedência).",
      "INTERESSE DE AGIR NAS AÇÕES PREVIDENCIÁRIAS E ADMINISTRATIVAS: O STF fixou no Tema 350 da Repercussão Geral que a concessão de benefícios previdenciários e certidões administrativas exige prévio requerimento administrativo como condição para caracterizar o interesse de agir."
    ],
    "careerNuances": {
      "AGU": "Defesa prévia da União arguindo ausência de interesse processual por ausência de prévia pretensão resistida na via administrativa (Tema 350/STF).",
      "PGFN": "Arguição de ilegitimidade passiva e falta de interesse de agir nas ações anulatórias de débito fiscal desacompanhadas de depósito integral ou de início de execução.",
      "MPE": "Defesa intransigente da legitimidade extraordinária autônoma do MP na tutela de direitos difusos, coletivos e individuais homogêneos com supedâneo no art. 129, III da CF."
    }
  },

  // =========================================================================
  // ORGANIZAÇÕES CRIMINOSAS (LEI 12.850/2013): TIPICIDADE, MEIOS DE OBTENÇÃO DE PROVA E COLABORAÇÃO PREMIADA
  // =========================================================================
    {
    "id": "fuc-penal-organizacoes-criminosas",
    "discipline": "DIREITO PENAL E LEGISLAÇÃO ESPECIAL",
    "title": "Organizações Criminosas (Lei 12.850/2013): Tipicidade, Meios de Obtenção de Prova e Colaboração Premiada",
    "themeKeywords": [
      "organizacao criminosa",
      "lei 12850",
      "colaboracao premiada",
      "acao controlada",
      "infiltracao policial",
      "meios de prova",
      "pacote anticrime",
      "obstrucao de investigacao"
    ],
    "coreDoctrine": "#### 🕵️ Lei das Organizações Criminosas (Lei nº 12.850/2013)\n\n* **Conceito Típico Estrutural (Art. 1º, § 1º da Lei 12.850/2013)**:\n  Considera-se organização criminosa a associação de **4 (quatro) ou mais pessoas** estruturalmente ordenada e caracterizada pela divisão de tarefas, ainda que informalmente, com objetivo de obter, direta ou indiretamente, vantagem de qualquer natureza, mediante a prática de infrações penais cujas penas máximas sejam **superiores a 4 (quatro) anos** ou que sejam de **caráter transnacional**.\n  * **Diferenças Cruciais**:\n    * Associação Criminosa (art. 288 do CP): 3 ou mais pessoas para cometer crimes genéricos, sem exigência de estrutura escalonada;\n    * Associação para o Tráfico (art. 35 da Lei 11.343/2006): 2 ou mais pessoas unidas com vínculo estável e permanente para o tráfico;\n    * Organização Criminosa (Lei 12.850/2013): exige no mínimo 4 agentes, divisão orgânica de tarefas e crimes com pena máxima superior a 4 anos ou transnacionais.\n\n* **Tipos Penais Próprios da Lei 12.850/2013**:\n  * **Crime do Art. 2º (*Caput*)**: Promover, constituir, financiar ou integrar, pessoalmente ou por interposta pessoa, organização criminosa (Pena: reclusão de 3 a 8 anos e multa);\n  * **Crime do Art. 2º, § 1º (Obstrução de Justiça)**: Conduta de quem impede ou, de qualquer forma, embaraça a investigação de infração penal que envolva organização criminosa;\n  * **Causa de Aumento pelo Emprego de Arma de Fogo**: Pena aumentada até a metade se houver emprego de arma de fogo na atuação da organização;\n  * **Efeito Obrigatório da Condenação para Servidores Públicos**: A condenação com trânsito em julgado acarreta a perda do cargo, função, emprego ou mandato eletivo e a interdição para o exercício de função pública pelo prazo de 8 anos subsequentes ao cumprimento da pena (art. 2º, § 6º).\n\n* **Meios Extraordinários de Obtenção de Prova (Art. 3º da Lei)**:\n  * **Colaboração Premiada**: Negócio jurídico processual personalíssimo e meio de obtenção de prova que visa à identificação dos demais coautores, estrutura da organização, localização de vítimas e recuperação do produto do crime;\n  * **Ação Controlada**: Retardamento circunstanciado da intervenção policial ou administrativa para que a prisão ocorra no momento mais eficaz à formação de provas e captura de líderes (exige prévia comunicação ao juiz competente);\n  * **Infiltração de Agentes**: Infiltração física de policiais em tarefas investigativas, precedida de autorização judicial sigilosa e fundamentada, com prazo máximo legal de até 6 meses prorrogável (arts. 10 e 11);\n  * **Infiltração Virtual de Policiais na Internet**: Introduzida expressamente pelo Pacote Anticrime (arts. 10-A a 10-D) para investigações na rede mundial de computadores, com prazo de até 6 meses e relatórios circunstanciados.\n\n* **Regime Jurídico da Colaboração Premiada após o Pacote Anticrime (Arts. 3º-A a 4º)**:\n  * **Natureza Jurídica**: O art. 3º-A declara expressamente que o acordo de colaboração premiada é negócio jurídico processual e meio de obtenção de prova, não constituindo por si só elemento probatório;\n  * **Vedação ao Magistrado**: O juiz não participa das negociações do acordo, atuando estritamente na homologação quanto à regularidade, legalidade e voluntariedade do pacto;\n  * **Impossibilidade de Condenação Exclusiva**: Nenhuma sentença condenatória poderá ser proferida com fundamento apenas nas declarações do colaborador (art. 4º, § 16), exigindo corroboração probatória autônoma;\n  * **Direito de Rescisão**: O descumprimento injustificado das cláusulas pelo colaborador acarreta a rescisão do acordo, preservando-se em desfavor dos demais corréus as provas licitamente colhidas.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Legitimidade Concorrente do Delegado e do MP na Colaboração",
        "author": "STF (ADI 5.508/DF, Rel. Min. Marco Aurélio)",
        "thesis": "O Delegado de Polícia tem legitimidade para propor e firmar acordo de colaboração premiada na fase de inquérito, exigindo-se manifestação prévia (não vinculante) do MP e homologação judicial.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Monopólio do Ministério Público por Titularidade da Ação Penal",
        "author": "Procuradoria-Geral da República (PGR)",
        "thesis": "Sustentava que somente o titular exclusivo da ação penal pública (MP) poderia transacionar benefícios e prêmios na colaboração premiada.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "HOMOLOGAÇÃO DA COLABORAÇÃO: O juiz NÃO pode participar das negociações das cláusulas do acordo de colaboração premiada (art. 3º-A, § 1º), sob pena de nulidade absoluta e quebra da imparcialidade.",
      "VALOR PROBATÓRIO DA DELAÇÃO: As declarações isoladas do colaborador NÃO bastam para o oferecimento de denúncia sem elementos de corroboração, e NÃO podem embasar cautelares patrimoniais ou condenação (art. 4º, § 16).",
      "PERDA AUTOMÁTICA DE CARGO NA LEI 12.850: Ao contrário do Código Penal (art. 92, I), na Lei das Organizações Criminosas a perda do cargo e a interdição por 8 anos após a pena são efeitos AUTOMÁTICOS da condenação com trânsito em julgado (art. 2º, § 6º).",
      "REQUISITO NUMÉRICO: Organização criminosa exige QUATRO ou mais agentes. Associação criminosa (art. 288 CP) exige TRÊS. Associação para o tráfico (art. 35 Lei 11.343) exige DOIS."
    ],
    "careerNuances": {
      "MPE": "Atuação central nos GAECOs estaduais, celebração de colaborações premiadas complexas e persecução a milícias privadas e facções de alta periculosidade.",
      "AGU": "Defesa dos atos da Polícia Federal e controle administrativo sobre cooperação jurídica internacional em investigações transnacionais.",
      "PGFN": "Recuperação de ativos desviados por organizações criminosas e sequestro de bens sonegados para recomposição fiscal dos cofres federais."
    }
  },

  // =========================================================================
  // NOVA LEI DE ABUSO DE AUTORIDADE (LEI 13.869/2019): DOLO ESPECÍFICO, VEDAÇÃO DO CRIME DE HERMENÊUTICA E EFEITOS DA CONDENAÇÃO
  // =========================================================================
    {
    "id": "fuc-penal-abuso-de-autoridade",
    "discipline": "DIREITO PENAL E LEGISLAÇÃO ESPECIAL",
    "title": "Nova Lei de Abuso de Autoridade (Lei 13.869/2019): Dolo Específico, Vedação do Crime de Hermenêutica e Efeitos da Condenação",
    "themeKeywords": [
      "abuso de autoridade",
      "lei 13869",
      "crime de hermeneutica",
      "dolo especifico",
      "mero capricho",
      "efeitos da condenacao",
      "perda do cargo",
      "inabilitacao",
      "agente publico"
    ],
    "coreDoctrine": "#### ⚖️ Regime Jurídico da Nova Lei de Abuso de Autoridade (Lei nº 13.869/2019)\n\n* **Elemento Subjetivo Especial Cumulativo e Tipicidade Subjetiva (Art. 1º, § 1º)**:\n  As condutas descritas na Lei 13.869/2019 constituem crime de abuso de autoridade quando praticadas pelo agente com a **finalidade específica de prejudicar outrem ou beneficiar a si mesmo ou a terceiro, ou, ainda, por mero capricho ou satisfação pessoal**.\n  * **Ausência de Modalidade Culposa**: Todos os crimes da lei são exclusivamente dolosos. Não existe crime culposo de abuso de autoridade;\n  * **Necessidade de Dolo Específico**: O dolo genérico não é suficiente para configurar a infração. É imperioso comprovar o especial fim de agir delineado no art. 1º, § 1º.\n\n* **Vedação Absoluta do Crime de Hermenêutica (Art. 1º, § 2º)**:\n  A divergência na interpretação de lei ou na avaliação de fatos e provas **não configura abuso de autoridade**. O dispositivo consagra a clássica lição de Rui Barbosa contra o \"crime de hermenêutica\", protegendo a liberdade de julgamento e a independência funcional de magistrados, membros do Ministério Público e pareceristas da Advocacia Pública.\n  * *Natureza Jurídica*: Para Rogério Greco e Rogério Sanches, trata-se de causa legal expressa de exclusão da tipicidade penal (fato atípico).\n\n* **Sujeito Ativo do Delito (Art. 2º)**:\n  É sujeito ativo do crime de abuso de autoridade qualquer agente público, servidor ou não, da administração direta, indireta ou fundacional de qualquer dos Poderes da União, dos Estados, do DF e dos Municípios, incluindo membros dos Poderes Legislativo, Executivo e Judiciário, do Ministério Público, dos Tribunais ou Conselhos de Contas e forças policiais.\n\n* **Ação Penal e Legitimidade (Art. 3º)**:\n  Os crimes previstos na Lei 13.869/2019 são de **ação penal pública incondicionada**.\n  * Admite-se a **ação penal privada subsidiária da pública**, se a ação pública não for intentada no prazo legal, devendo ser exercida no prazo decadencial de 6 meses contados da inércia ministerial.\n\n* **Efeitos da Condenação e Penas Restritivas de Direitos (Arts. 4º e 5º)**:\n  * **Efeitos Não Automáticos e Condicionados à Reincidência Específica (Art. 4º)**:\n    1. Tornar certa a obrigação de indenizar o dano causado pelo crime;\n    2. A inabilitação para o exercício de cargo, mandato ou função pública, pelo período de 1 a 5 anos;\n    3. A perda do cargo, do mandato ou da função pública.\n    * **Regra de Ouro**: A inabilitação e a perda do cargo são condicionadas à ocorrência de **reincidência em crime de abuso de autoridade** e NÃO são automáticas, exigindo expressa fundamentação judicial na sentença (art. 4º, parágrafo único).\n  * **Penas Restritivas de Direitos Substitutivas (Art. 5º)**: Prestação de serviços à comunidade e suspensão do exercício do cargo pelo prazo de 1 a 6 meses com perda dos vencimentos.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Exclusão da Tipicidade por Ausência de Dolo Específico",
        "author": "Rogério Greco, Rogério Sanches Cunha",
        "thesis": "A vedação do crime de hermenêutica atua como causa atípica da conduta, pois sem a demonstração inequívoca do capricho ou intuito preordenado de prejudicar, o fato é penalmente irrelevante.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Dever de Apuração em Decisões Teratológicas",
        "author": "Parte da Doutrina Processual Penal",
        "thesis": "Defende que decisões judiciais que violem frontalmente literalidade legal ou precedentes vinculantes sem fundamentação não podem ser escudadas no art. 1º, § 2º, autorizando investigação penal por desvio manifesto.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "PERDA DO CARGO NÃO É AUTOMÁTICA E EXIGE REINCIDÊNCIA: Na Lei de Abuso de Autoridade, a perda do cargo ou inabilitação NÃO é efeito automático e EXIGE reincidência específica em crime da própria Lei 13.869 (art. 4º, parágrafo único).",
      "CRIME DE HERMENÊUTICA: A divergência jurídica na valoração da prova ou interpretação legal NUNCA constitui abuso de autoridade (art. 1º, § 2º).",
      "ATENÇÃO AOS TIPOS MAIS COBRADOS: Decretar medida de privação da liberdade em manifesta desconformidade com a lei (art. 9º); Deixar injustificadamente de relaxar prisão manifestamente ilegal (art. 9º, parágrafo único); Fotografar ou filmar preso sem seu consentimento para expô-lo à curiosidade pública (art. 13, II).",
      "PRAZO DA SUSPENSÃO DO CARGO COMO PENA RESTRITIVA: A suspensão do exercício do cargo, função ou mandato aplica-se pelo prazo de 1 a 6 meses, com perda integral dos vencimentos e vantagens (art. 5º, II)."
    ],
    "careerNuances": {
      "AGU": "Proteção da atividade consultiva da Advocacia Pública. Pareceres jurídicos exarados por Procuradores Federais e Advogados da União são acobertados pela vedação ao crime de hermenêutica.",
      "MPE": "Atuação ministerial no controle externo da atividade policial e apuração rigorosa de excessos de autoridades que vulnerem os direitos de custodiados.",
      "PGFN": "Garantia de que a lavratura de autos de infração fiscal e representações fiscais para fins penais não caracterizam abuso de autoridade quando baseadas em interpretação razoável da legislação tributária."
    }
  },

  // =========================================================================
  // LAVAGEM DE CAPITAIS (LEI 9.613/1998): FASES TÍPICAS, TEORIA DA CEGUEIRA DELIBERADA E AUTOLAVAGEM
  // =========================================================================
    {
    "id": "fuc-penal-lavagem-dinheiro",
    "discipline": "DIREITO PENAL E LEGISLAÇÃO ESPECIAL",
    "title": "Lavagem de Capitais (Lei 9.613/1998): Fases Típicas, Teoria da Cegueira Deliberada e Autolavagem",
    "themeKeywords": [
      "lavagem de dinheiro",
      "lei 9613",
      "cegueira deliberada",
      "willful blindness",
      "autolavagem",
      "self laundering",
      "fases da lavagem",
      "colocacao",
      "dissimulacao",
      "integracao",
      "coaf"
    ],
    "coreDoctrine": "#### 💰 Teoria Geral e Dogmática da Lavagem de Capitais (Lei nº 9.613/1998)\n\n* **Evolução Histórica e as Gerações da Lavagem de Capitais**:\n  * **1ª Geração**: A lavagem admitia como crime antecedente apenas o tráfico ilícito de entorpecentes (Convenção de Viena de 1988);\n  * **2ª Geração**: Adotava um rol taxativo fechado de crimes antecedentes graves (terrorismo, extorsão mediante sequestro, armas, corrupção);\n  * **3ª Geração (Modelo Brasileiro Atual - Lei 12.683/2012)**: Toda e qualquer **infração penal** (crime ou contravenção penal) pode funcionar como antecedente de lavagem de dinheiro. Revogou-se o rol taxativo. O jogo do bicho ou exploração ilícita de jogos de azar (contravenções) servem de base antecedente para a lavagem de capitais.\n\n* **As Três Fases Típicas do Processo de Lavagem**:\n  1. **Colocação (*Placement*)**: Introdução dos recursos financeiros ilícitos no sistema financeiro ou econômico formal, visando a afastar o dinheiro da sua origem imediata (ex: depósitos fracionados / *smurfing*, compra de bens em espécie);\n  2. **Ocultação ou Dissimulação (*Layering* / Estratificação)**: Realização de complexas transações financeiras, transferências sucessivas e remessas internacionais destinadas a apagar a trilha documental e dificultar o rastreamento pelos órgãos de controle;\n  3. **Integração (*Integration*)**: O capital, agora com aparência formal e regularizada de licitude, é reintroduzido na economia real por meio de investimentos empresariais, compras imobiliárias ou sociedades de fachada.\n  * *Momento Consumativo*: O crime consubstancia-se com a prática de atos idôneos de ocultação ou dissimulação, dispensando a consumação da fase de integração. Trata-se de crime formal em relação ao proveito final.\n\n* **Crime Acessório / Parasitário e Justa Causa Duplicada**:\n  A lavagem é infração penal derivada ou parasitária, pressupondo a existência de infração antecedente produtora de ativos ilícitos.\n  * Conforme o art. 2º, II da Lei 9.613/1998, a denúncia de lavagem de capitais é instruída com indícios suficientes da existência da infração antecedente, sendo puníveis os fatos ainda que desconhecido ou isento de pena o autor da infração prévia, ou extinta a punibilidade.\n\n* **A Teoria da Cegueira Deliberada (*Willful Blindness Doctrine* ou Avestruz)**:\n  De origem na jurisprudência anglo-saxônica, estabelece que o agente que deliberadamente se coloca em estado de ignorância, evitando tomar conhecimento da procedência criminosa dos bens ou valores com que negocia, atua com **dolo eventual**.\n  * *Posição dos Tribunais Superiores*: O STJ e o STF admitem a incidência do dolo eventual na lavagem de dinheiro calcado na cegueira deliberada, desde que demonstrado que o agente tinha suspeitas fundadas sobre a origem ilícita dos valores e conscientemente se absteve de certificar a sua procedência.\n\n* **A Autolavagem (*Self-Laundering*)**:\n  Configura-se quando o próprio autor da infração penal antecedente pratica atos posteriores e autônomos de ocultação e dissimulação do proveito criminoso.\n  * O STF assentou que o mero proveito ou usufruto do produto do crime (mero exaurimento) não constitui lavagem; todavia, se o agente engendra manobras ativas e fraudulentas para mascarar a titularidade dos bens (como o uso de contas em nome de laranjas ou empresas offshore), responderá em concurso de crimes pelo delito antecedente e por lavagem de capitais.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Admissibilidade do Dolo Eventual na Lavagem de Capitais",
        "author": "STJ (APn 856/DF e REsp 1.772.339) e STF (AP 470)",
        "thesis": "O tipo subjetivo da lavagem abrange tanto o dolo direto quanto o dolo eventual quando caracterizada a cegueira deliberada em operações suspeitas de ativos.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Exigência Exclusiva de Dolo Direto",
        "author": "Doutrina Tradicional Garantista (Helena Regina Lobo da Costa)",
        "thesis": "Argumenta que os verbos 'ocultar' e 'dissimular' pressupõem intenção finalística preordenada, repelindo a compatibilidade dogmática com a culpa consciente ou o dolo eventual.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "CONTRAVENÇÃO COMO ANTECEDENTE: O crime de lavagem admite CONTRAVENÇÃO PENAL como infração antecedente desde a Lei 12.683/2012 (art. 1º, caput). Cuidado com pegadinhas que afirmam que apenas crimes podem ser antecedentes.",
      "INDEPENDÊNCIA PROCESSUAL: A punição da lavagem independe do trânsito em julgado ou condenação do crime antecedente (art. 2º, II), bastando a comprovação de justa causa indiciária sobre a origem ilícita.",
      "MERO EXAURIMENTO NÃO É AUTOLAVAGEM: A mera utilização ou gasto dos valores auferidos no crime antecedente não constitui autolavagem. Exige-se conduta autônoma e subsequente voltada a mascarar ou distanciar a origem dos valores.",
      "PAPEL DO COAF: O COAF é órgão de inteligência financeira. O STF pacificou no Tema 990 da Repercussão Geral que o compartilhamento de relatórios de inteligência financeira (RIF) entre o COAF e órgãos de persecução penal sem prévia autorização judicial é plenamente constitucional."
    ],
    "careerNuances": {
      "MPE": "Atuação intensiva na persecução de organizações especializadas em lavagem de dinheiro público desviado da saúde, educação e licitações municipais.",
      "AGU": "Defesa dos Relatórios de Inteligência Financeira (RIF) emitidos pelo COAF e representação judicial em ações de repatriação internacional de capitais.",
      "PGFN": "Ajuizamento de medidas cautelares fiscais para bloqueio preventivo de patrimônio ocultado em fraudes fiscais estruturadas."
    }
  },

  // =========================================================================
  // LEI DE DROGAS (LEI 11.343/2006): ART. 28 E TEMA 506/STF, TRÁFICO PRIVILEGIADO E AFASTAMENTO DA HEDIONDEZ
  // =========================================================================
    {
    "id": "fuc-penal-lei-de-drogas",
    "discipline": "DIREITO PENAL E LEGISLAÇÃO ESPECIAL",
    "title": "Lei de Drogas (Lei 11.343/2006): Art. 28 e Tema 506/STF, Tráfico Privilegiado e Afastamento da Hediondez",
    "themeKeywords": [
      "lei de drogas",
      "lei 11343",
      "art 28 drogas",
      "porte para consumo",
      "tema 506 stf",
      "trafico privilegiado",
      "art 33 § 4",
      "tema 1122 stj",
      "sumula 512 cancelada",
      "hediondez"
    ],
    "coreDoctrine": "#### 🌿 Dogmática da Lei de Drogas (Lei nº 11.343/2006)\n\n* **Porte de Drogas para Consumo Pessoal (Art. 28) e o Julgamento do STF (RE 635.659, Tema 506 da Repercussão Geral)**:\n  * **Natureza Jurídica Histórica**: O STF consagrou que o art. 28 da Lei 11.343/2006 operou uma **despenalização** (abolição das penas privativas de liberdade, restando advertência, prestação de serviços e medida educativa), mas NÃO descriminalização;\n  * **Tese Fixada no Tema 506 pelo Plenário do STF**:\n    1. O porte de **maconha (Cannabis sativa)** para consumo pessoal NÃO constitui ilícito penal, consubstanciando **ilícito de natureza administrativa**, desprovido de qualquer efeito de repercussão criminal (não gera reincidência nem antecedentes penais);\n    2. Fixação de critério quantitativo objetivo de presunção: presume-se usuário a pessoa flagrada portando até **40 (quarenta) gramas** de maconha ou **6 (seis) plantas fêmeas**, salvo se outros elementos concretos indicarem a destinação comercial (apreensão de balança de precisão, anotações de contabilidade de tráfico, mensagens de mercancia);\n    3. A competência para aplicação das sanções administrativas do art. 28 recai sobre a autoridade judicial em procedimento de natureza não penal;\n    4. A substância continua sendo ilícita e sujeita à apreensão compulsória e destruição pela polícia.\n\n* **Tráfico Privilegiado (Art. 33, § 4º da Lei 11.343/2006)**:\n  Causa especial de diminuição de pena de **1/6 a 2/3** conferida ao apenado pelo crime de tráfico (art. 33, *caput*) que preencha cumulativamente quatro requisitos:\n  1. Ser primário;\n  2. Ter bons antecedentes;\n  3. Não se dedicar a atividades criminosas;\n  4. Não integrar organização criminosa.\n  * **Afastamento Radical da Hediondez**:\n    * O STF (HC 118.533) e o STJ (Tema Repetitivo 1.122 e cancelamento formal da Súmula 512) pacificaram que o tráfico privilegiado **NÃO é crime hediondo nem equiparado**;\n    * Aplica-se a fração comum para progressão de regime (16% se primário com Pacote Anticrime, art. 112 da LEP);\n    * Admite substituição da pena privativa de liberdade por restritivas de direitos se a pena final for igual ou inferior a 4 anos (STF, HC 97.256 e Resolução nº 5/2012 do Senado Federal);\n    * Admite livramento condicional pelo critério do art. 83, I do CP (cumprimento de mais de 1/3 da pena).\n\n* **Associação para o Tráfico (Art. 35)**:\n  Exige o dolo de associação com estabilidade e permanência entre duas ou mais pessoas para o fim de praticar os crimes de tráfico. O mero concurso eventual e esporádico de agentes (*concursus deliquentium*) não tipifica o art. 35, caracterizando apenas a coautoria no tráfico com a incidência da causa de aumento do art. 40, VI se envolver menores.\n\n* **Causas de Aumento de Pena (Art. 40 da Lei 11.343/2006)**:\n  As penas aumentam-se de 1/6 a 2/3 nas hipóteses de: transnacionalidade da droga (Súmula 528 do STJ: basta a intenção de transposição de fronteiras); prevalecimento de função pública; prática nas dependências ou imediações de presídios, escolas e hospitais; violência ou grave ameaça; envolvimento de criança ou adolescente.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Inaplicabilidade da Hediondez ao Tráfico Privilegiado",
        "author": "STF (Plenário - HC 118.533) e STJ (Tema 1.122)",
        "thesis": "O tráfico privilegiado não ostenta caráter hediondo, permitindo progressão comum, sursis da pena e concessão de livramento condicional desonerado de travas hediondas.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Equiparação a Hediondo pela Tipificação no Art. 33 (Superada)",
        "author": "Antiga Súmula 512 do STJ (Cancelada)",
        "thesis": "A causa de diminuição do § 4º apenas modulava a sanção sem afastar a natureza hedionda nuclear do delito tipificado no art. 33, caput.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "CRITÉRIO DO TEMA 506 STF PARA MACONHA: Presunção de usuário fixada em até 40 gramas ou 6 plantas fêmeas. A presunção é relativa, podendo ser afastada pela presença inequívoca de elementos de tráfico.",
      "SÚMULA 512 DO STJ FOI EXPRESSAMENTE CANCELADA: Tráfico com causa de diminuição do art. 33, § 4º NÃO é hediondo.",
      "SÚMULA 528 DO STJ (TRANSNACIONALIDADE): A competência da Justiça Federal e a majorante da transnacionalidade firmam-se com a prova da destinação internacional das drogas, mesmo que não ocorra a efetiva transposição da fronteira.",
      "INAPLICABILIDADE DO PRINCÍPIO DA INSIGNIFICÂNCIA: É pacífica a orientação do STF e STJ de que o princípio da insignificância NÃO se aplica aos crimes de tráfico de drogas e porte para uso próprio."
    ],
    "careerNuances": {
      "MPE": "Atuação crucial nas audiências de custódia e instrução criminal, avaliando com rigor os elementos concretos de traficância contra teses artificiais de usuário do art. 28.",
      "AGU": "Defesa dos atos da Polícia Rodoviária Federal e órgãos de controle aduaneiro nas apreensões interestaduais de substâncias entorpecentes.",
      "PGFN": "Perdimento de bens e veículos apreendidos utilizados na prática de tráfico ilícito de entorpecentes, em favor do FUNAD (Fundo Nacional Antidrogas)."
    }
  },

  // =========================================================================
  // LEI MARIA DA PENHA (LEI 11.340/2006): FORMAS DE VIOLÊNCIA, MEDIDAS PROTETIVAS E SÚMULAS VINCULADAS
  // =========================================================================
    {
    "id": "fuc-penal-maria-da-penha",
    "discipline": "DIREITO PENAL E LEGISLAÇÃO ESPECIAL",
    "title": "Lei Maria da Penha (Lei 11.340/2006): Formas de Violência, Medidas Protetivas e Súmulas Vinculadas",
    "themeKeywords": [
      "maria da penha",
      "lei 11340",
      "violencia domestica",
      "medidas protetivas",
      "sumula 588 stj",
      "sumula 600 stj",
      "sumula 589 stj",
      "lei 14550",
      "natureza juridica"
    ],
    "coreDoctrine": "#### 🌸 Violência Doméstica e Familiar Contra a Mulher (Lei nº 11.340/2006)\n\n* **Âmbito de Incidência e Configuração da Violência Doméstica (Art. 5º)**:\n  Configura violência doméstica e familiar contra a mulher qualquer ação ou omissão baseada no gênero que lhe cause morte, lesão, sofrimento físico, sexual ou psicológico e dano moral ou patrimonial:\n  1. No âmbito da **unidade doméstica** (espaço de convívio permanente, com ou sem vínculo familiar);\n  2. No âmbito da **família** (indivíduos aparentados por laços naturais, afinidade ou vontade);\n  3. Em qualquer relação íntima de afeto, na qual o agressor conviva ou tenha convivido com a ofendida, **independentemente de coabitação** (**Súmula nº 600 do STJ**).\n\n* **As Cinco Formas de Violência Doméstica (Art. 7º)**:\n  1. **Violência Física**: Qualquer conduta que ofenda sua integridade ou saúde corporal;\n  2. **Violência Psicológica**: Conduta que lhe cause dano emocional, diminuição da autoestima, perturbação do pleno desenvolvimento ou que vise a degradar ou a controlar suas ações e decisões (tipificada também autonomamente no art. 147-B do CP);\n  3. **Violência Sexual**: Constrangimento a presenciar, a manter ou a participar de relação sexual não desejada mediante coerção ou força;\n  4. **Violência Patrimonial**: Retenção, subtração, destruição parcial ou total de seus objetos, instrumentos de trabalho, documentos pessoais e bens;\n  5. **Violência Moral**: Qualquer conduta que configure calúnia, difamação ou injúria.\n\n* **Regime Jurídico das Medidas Protetivas de Urgência (Arts. 18 a 24-A, com a Lei 14.550/2023)**:\n  * **Natureza Jurídica**: O STJ pacificou que as medidas protetivas de urgência possuem natureza jurídica de **tutela inibitória e cautelar cível**, visando à salvaguarda da vida e higidez física da vítima;\n  * **Desvinculação do Processo-Crime (Lei 14.550/2023)**: As medidas protetivas vigorarão enquanto persistir a situação de risco à integridade da mulher, **independentemente da tipificação penal da violência, do ajuizamento de ação penal ou cível, da existência de inquérito policial ou do registro de boletim de ocorrência**;\n  * **Crime de Descumprimento de Medida Protetiva (Art. 24-A)**: Pune com detenção de 3 meses a 2 anos quem descumprir decisão judicial que defere medida protetiva de urgência. Apenas a autoridade judicial pode conceder fiança na fase policial.\n\n* **Inaplicabilidades e Vedações Rígidas Consagradas pelo STF e STJ**:\n  * **Inaplicabilidade da Lei 9.099/1995 (Art. 41)**: Aos crimes praticados com violência doméstica e familiar contra a mulher NÃO se aplicam os institutos despenalizadores da Lei dos Juizados Especiais (vedada a transação penal, suspensão condicional do processo e composição civil);\n  * **Súmula 588 do STJ**: A prática de crime no contexto de violência doméstica e familiar contra a mulher com violência ou grave ameaça **impossibilita a substituição da pena privativa de liberdade por restritiva de direitos**;\n  * **Súmula 589 do STJ**: É **inaplicável o princípio da insignificância** aos crimes ou contravenções penais praticados contra a mulher no âmbito das relações domésticas;\n  * **Ação Penal na Lesão Corporal Leve**: A ação penal nos crimes de lesão corporal leve praticados contra mulher em violência doméstica é **pública incondicionada** (STF, ADI 4.424 e Súmula 542 do STJ).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Natureza Jurídica Tutelar Cível e Autônoma das Protetivas",
        "author": "STJ (Terceira Seção - REsp 1.775.341/SP) e Lei 14.550/2023",
        "thesis": "As medidas protetivas têm caráter cível-inibitório e não estão subordinadas à existência contemporânea de inquérito policial ou ação penal condenatória em curso.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Caráter Estritamente Cautelar Penal Subordinado",
        "author": "Corrente Jurisprudencial Antiga (Superada)",
        "thesis": "Sustentava que as protetivas seriam acessórias e caducariam se o inquérito policial não fosse instaurado ou fosse arquivado.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "DESNECESSIDADE DE COABITAÇÃO: A incidência da Lei Maria da Penha independe de coabitação entre autor e vítima (Súmula 600 do STJ). Namorados ou ex-namorados que nunca moraram juntos são alcançados pela lei.",
      "INSIGNIFICÂNCIA É TERMINANTEMENTE VEDADA: Não cabe princípio da insignificância na violência doméstica, mesmo que se trate de leve empurrão ou vias de fato (Súmula 589 do STJ).",
      "RENÚNCIA À REPRESENTAÇÃO (Art. 16): A renúncia à representação só é válida se realizada perante o juiz em audiência especialmente designada para tal finalidade, antes do recebimento da denúncia e ouvido o Ministério Público. NÃO vale renúncia em delegacia.",
      "FIANÇA NO ART. 24-A: Na hipótese de prisão em flagrante pelo crime de descumprimento de medida protetiva (art. 24-A), o Delegado de Polícia NÃO pode arbitrar fiança. Somente o juiz poderá concedê-la."
    ],
    "careerNuances": {
      "MPE": "Tema primordial e de alta densidade em concursos do Ministério Público. Participação na audiência do art. 16, requerimento de medidas protetivas de ofício e atuação firme nas varas de violência doméstica.",
      "AGU": "Defesa das políticas públicas federais de combate à violência de gênero e conformidade das diretrizes nacionais perante organismos internacionais de direitos humanos.",
      "PGFN": "Inaplicabilidade de vedações pecuniárias que possam ser convertidas em prejuízo alimentar das vítimas em cobranças fiscais."
    }
  },

  // =========================================================================
  // SÚMULA VINCULANTE E RECLAMAÇÃO CONSTITUCIONAL: ART. 103-A DA CF, LEI 11.417/2006 E ARTS. 988 A 993 DO CPC
  // =========================================================================
    {
    "id": "fuc-const-sumula-vinculante-reclamacao",
    "discipline": "DIREITO CONSTITUCIONAL",
    "title": "Súmula Vinculante e Reclamação Constitucional: Art. 103-A da CF, Lei 11.417/2006 e Arts. 988 a 993 do CPC",
    "themeKeywords": [
      "sumula vinculante",
      "reclamacao constitucional",
      "art 103-a cf",
      "lei 11417",
      "art 988 cpc",
      "esgotamento das instancias ordinarias",
      "stf",
      "efeito vinculante"
    ],
    "coreDoctrine": "#### 🏛️ Regime Constitucional da Súmula Vinculante e da Reclamação\n\n* **Súmula Vinculante (Art. 103-A da CF/88, introduzido pela EC nº 45/2004 e Lei nº 11.417/2006)**:\n  O Supremo Tribunal Federal poderá, de ofício ou por provocação, mediante decisão de **dois terços dos seus membros (8 Ministros)**, após reiteradas decisões sobre matéria constitucional, aprovar enunciado de súmula com efeito vinculante em relação aos demais órgãos do Poder Judiciário e à administração pública direta e indireta, nas esferas federal, estadual e municipal.\n  * **Requisitos Cumulativos de Validade**:\n    1. Reiteradas decisões do STF sobre a matéria;\n    2. Quórum qualificado de 2/3 (oito ministros) para aprovação, revisão ou cancelamento;\n    3. Objeto restrito à matéria constitucional;\n    4. Atual controvérsia entre órgãos judiciários ou entre esses e a administração pública que cause grave insegurança jurídica e relevante multiplicação de processos (art. 103-A, § 1º).\n  * **Destinatários Vinculados e Exceção do Legislativo**: A Súmula Vinculante submete todos os juízes e tribunais do país e toda a Administração Pública direta e indireta. **NÃO vincula o Poder Legislativo** em sua função típica de legislar, sob pena de fossilização constitucional ou tutela indevida da atividade parlamentar. O STF também não fica adstrito para sempre, podendo revisar o enunciado.\n\n* **Reclamação Constitucional (Art. 102, I, l, Art. 103-A, § 3º da CF/88 e Arts. 988 a 993 do CPC)**:\n  Ação constitucional vocacionada a garantir a autoridade das decisões das Cortes de Vértice e preservar sua competência originária.\n  * **Hipóteses de Cabimento (Art. 988 do CPC)**:\n    1. Preservar a competência do tribunal;\n    2. Garantir a autoridade das decisões do tribunal;\n    3. Garantir a observância de enunciado de súmula vinculante e de decisão do STF em controle concentrado de constitucionalidade;\n    4. Garantir a observância de acórdão proferido em julgamento de incidente de resolução de demandas repetitivas (IRDR) ou de incidente de assunção de competência (IAC).\n\n* **Requisito Obrigatório do Esgotamento das Instâncias Ordinárias**:\n  * Para a reclamação que visa a garantir a observância de acórdão de **recurso especial ou extraordinário com repercussão geral ou em repetitivos**, o art. 988, § 5º, II do CPC impõe o **prévio esgotamento das instâncias ordinárias**;\n  * O esgotamento pressupõe o julgamento de todos os recursos ordinários no tribunal de origem, inclusive a interposição e julgamento de Agravo Interno contra a decisão da presidência que aplicou a tese repetitiva (STF, Rcl 24.686 e STJ, Rcl 36.476).\n\n* **Reclamação contra Ato da Administração Pública (Art. 103-A, § 3º e Art. 7º, § 1º da Lei 11.417/2006)**:\n  Do ato administrativo que contrariar a súmula aplicável ou que indevidamente a aplicar, caberá reclamação ao Supremo Tribunal Federal, que, se a acolher, anulará o ato e determinará a sua substituição.\n  * **Condição de Procedibilidade**: Contra ato puramente administrativo, o ajuizamento da reclamação perante o STF só é admitido **após o esgotamento das vias administrativas** (art. 7º, § 1º da Lei 11.417/2006).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Esgotamento Obrigatório das Instâncias Ordinárias em Repetitivos",
        "author": "STF (Plenário - Rcl 24.686) e STJ (Corte Especial)",
        "thesis": "A reclamação não pode atuar como sucedâneo recursal direto. Exige-se o prévio exaurimento da jurisdição local com a interposição de agravo interno na origem.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Cabimento Imediato por Afronta a Precedente Obrigatório",
        "author": "Corrente Minoritária Doutrinária",
        "thesis": "Sustentava que a violação frontal a precedente vinculante do STF ou STJ autorizaria o ajuizamento per saltum da reclamação para estancar de pronto a teratologia da decisão.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "QUÓRUM DE APROVAÇÃO: A aprovação, revisão ou cancelamento de Súmula Vinculante exige voto de DOIS TERÇOS dos membros do STF (8 Ministros). Cuidado com pegadinhas que mencionam maioria absoluta (6).",
      "LEGISLATIVO NÃO É VINCULADO: A Súmula Vinculante vincula o Judiciário e a Administração Pública, mas NÃO vincula o Legislador em sua função típica.",
      "ATO ADMINISTRATIVO EXIGE ESGOTAMENTO: Se a violação da Súmula Vinculante ocorrer por ato da Administração Pública, a reclamação só cabe após ESGOTAR os recursos na via administrativa (art. 7º, § 1º da Lei 11.417/2006).",
      "NÃO CABE RECLAMAÇÃO CONTRA COISA JULGADA: A reclamação proposta após o trânsito em julgado da decisão impugnada é manifestamente inadmissível (art. 988, § 5º, I do CPC e Súmula 734 do STF)."
    ],
    "careerNuances": {
      "AGU": "Manejo defensivo e repressivo de Reclamações perante o STF para garantir o cumprimento das orientações da Corte e resguardar prerrogativas da União.",
      "PGFN": "Defesa da Fazenda Nacional perante o STF contra reclamações infundadas de contribuintes que buscam burlar o esgotamento dos recursos locais.",
      "MPE": "Legitimidade ampla para propor reclamação na salvaguarda de suas funções institucionais e na garantia da eficácia das decisões das Cortes Superiores."
    }
  },

  // =========================================================================
  // EXECUÇÃO FISCAL (LEI 6.830/1980): CDA, REDIRECIONAMENTO AO SÓCIO, EXCEÇÃO DE PRÉ-EXECUTIVIDADE E PRESCRIÇÃO INTERCORRENTE
  // =========================================================================
    {
    "id": "fuc-tributario-execucao-fiscal",
    "discipline": "DIREITO TRIBUTÁRIO",
    "title": "Execução Fiscal (Lei 6.830/1980): CDA, Redirecionamento ao Sócio, Exceção de Pré-Executividade e Prescrição Intercorrente",
    "themeKeywords": [
      "execucao fiscal",
      "lei 6830",
      "cda",
      "certidao de divida ativa",
      "redirecionamento",
      "art 135 ctn",
      "sumula 435 stj",
      "excecao de pre-executividade",
      "sumula 393 stj",
      "prescricao intercorrente",
      "tema 566 stj",
      "art 40 lef"
    ],
    "coreDoctrine": "#### ⚖️ Processo Judicial Tributário: Execução Fiscal (Lei nº 6.830/1980)\n\n* **Certidão de Dívida Ativa (CDA) como Título Executivo Extrajudicial (Art. 2º da LEF e Art. 204 do CTN)**:\n  A Dívida Ativa regularmente inscrita goza de **presunção de certeza e liquidez** e tem o efeito de prova pré-constituída.\n  * A presunção é **relativa (*juris tantum*)**, podendo ser ilidida por prova inequívoca a cargo do executado ou de terceiro que a aproveite;\n  * A nulidade da CDA só é reconhecida quando o vício nos requisitos formais (art. 2º, § 5º da LEF e art. 202 do CTN) prejudicar concretamente o exercício do contraditório e da ampla defesa do executado. Até a decisão de primeira instância, é assegurada à Fazenda Pública a emenda ou substituição da CDA (art. 2º, § 8º da LEF e Súmula 392 do STJ).\n\n* **Redirecionamento da Execução Fiscal ao Sócio-Gerente (Art. 135, III do CTN e Súmula nº 435 do STJ)**:\n  O mero inadimplemento da obrigação tributária NÃO gera a responsabilidade pessoal do sócio-administrador (Súmula 430 do STJ).\n  * **Súmula nº 435 do STJ**: Presume-se dissolvida irregularmente a empresa que deixar de funcionar no seu domicílio fiscal, sem comunicação aos órgãos competentes, legitimando o redirecionamento da execução fiscal para o sócio-gerente;\n  * **Marco do Redirecionamento e Prescrição (Tema Repetitivo 444 do STJ)**:\n    1. O prazo prescricional para o redirecionamento é de **5 anos**, contados da citação da pessoa jurídica (se a dissolução ocorreu antes ou concomitantemente à citação) ou da data da constatação do ato de dissolução irregular (se posterior à citação);\n    2. O sócio que responde pelo débito é aquele que exercia a administração da sociedade no momento da ocorrência do fato gerador e no momento da dissolução irregular (Tema 962 do STJ).\n\n* **Meios de Defesa do Executado**:\n  * **1. Embargos à Execução Fiscal (Art. 16 da LEF)**: Ação autônoma de impugnação incidental com ampla dilação probatória. Exige, obrigatoriamente, a **garantia integral do juízo** (por penhora, depósito em dinheiro ou fiança bancária/seguro garantia), com prazo preclusivo de 30 dias contados da garantia;\n  * **2. Exceção de Pré-Executividade (Súmula nº 393 do STJ)**: Meio de defesa atípico formulado por simples petição nos próprios autos da execução fiscal.\n    * Requisitos Cumulativos: Matéria suscetível de ser conhecida de ofício pelo magistrado (decadência, prescrição, nulidade patente da CDA, ilegitimidade manifesta) e **desnecessidade de dilação probatória** (prova documental pré-constituída). Dispensa a garantia do juízo.\n\n* **Prescrição Intercorrente na Execução Fiscal (Art. 40 da LEF e Tema Repetitivo 566 do STJ)**:\n  Regime unificado fixado pela Primeira Seção do STJ:\n  1. Não localizado o devedor ou não encontrados bens penhoráveis, o juiz suspenderá o curso da execução fiscal pelo prazo improrrogável de **1 (um) ano**;\n  2. O termo inicial da suspensão é automático, contando-se a partir da ciência da Fazenda Pública a respeito da não localização do devedor ou inexistência de bens;\n  3. Findo o prazo de 1 ano de suspensão, tem início automático o prazo de **5 (cinco) anos de prescrição intercorrente**;\n  4. Decorridos os 5 anos, o magistrado decretará, de ofício, a prescrição intercorrente, ouvida previamente a Fazenda Pública apenas para alegar eventuais causas interruptivas ou suspensivas ocorridas no período.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Termo Inicial Automático da Prescrição Intercorrente (Tema 566 STJ)",
        "author": "STJ (Primeira Seção - REsp 1.340.553/RS)",
        "thesis": "O prazo de suspensão de 1 ano e o posterior prazo de prescrição de 5 anos operam-se de forma automática, independentemente de despacho judicial expresso.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Exigência de Prévia Intimação Formal da Fazenda",
        "author": "Corrente Fazendária Tradicional (Superada)",
        "thesis": "Argumentava que a suspensão e a prescrição só poderiam fluir após despacho formal do juiz intimando expressamente a Fazenda sobre o início do cômputo prescricional.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "MERO INADIMPLEMENTO NÃO GERA REDIRECIONAMENTO: O não pagamento de tributo não autoriza redirecionar a execução para o sócio (Súmula 430 STJ). É imperioso comprovar atos com excesso de poder, infração da lei ou dissolução irregular (Súmula 435 STJ).",
      "GARANTIA DO JUÍZO NOS EMBARGOS: Não são admissíveis embargos do devedor antes de garantida a execução fiscal (art. 16, § 1º da LEF). Já a Exceção de Pré-Executividade independe de penhora ou garantia.",
      "SÚMULA 392 DO STJ: A Fazenda Pública pode substituir a CDA até a prolação da sentença dos embargos, quando se tratar de erro material ou formal, SENDO VEDADA A MODIFICAÇÃO DO SUJEITO PASSIVO da execução fiscal.",
      "CONTAGEM DO TEMA 566 DO STJ: Suspensão de 1 ano + prescrição de 5 anos = 6 anos contados da ciência do primeiro ato infrutífero de busca de bens."
    ],
    "careerNuances": {
      "PGFN": "Tema absolutamente central da atuação da Procuradoria-Geral da Fazenda Nacional. Manejo diário da LEF, pedidos de indisponibilidade de bens (art. 185-A CTN) e aplicação das regras do Tema 566 do STJ.",
      "AGU": "Cobrança da dívida ativa não tributária de autarquias e fundações federais (IBAMA, ANATEL, etc.) com respaldo integral nas regras da Lei 6.830/1980.",
      "MPE": "Execução judicial de multas cominatórias (astreintes) decorrentes de termos de ajustamento de conduta (TAC) e sentenças em ações civis públicas ambientais."
    }
  },

  // =========================================================================
  // TUTELA COLETIVA DO DIREITO À SAÚDE E PROCESSO COLETIVO: TEMAS 793, 500 E 1234 DO STF E TEMA 106 DO STJ
  // =========================================================================
    {
    "id": "fuc-difusos-saude-coletiva",
    "discipline": "DIREITOS DIFUSOS E COLETIVOS",
    "title": "Tutela Coletiva do Direito à Saúde e Processo Coletivo: Temas 793, 500 e 1234 do STF e Tema 106 do STJ",
    "themeKeywords": [
      "direito a saude",
      "processo coletivo",
      "tema 793 stf",
      "tema 500 stf",
      "tema 1234 stf",
      "tema 106 stj",
      "medicamentos",
      "anvisa",
      "solidariedade",
      "justica federal"
    ],
    "coreDoctrine": "#### 🏥 Tutela Jurisdicional do Direito à Saúde e Microssistema Coletivo\n\n* **Dever Estatal e Princípio da Solidariedade Federativa (Art. 196 da CF/88 e Tema 793 do STF)**:\n  A saúde é direito de todos e dever do Estado, garantido mediante políticas sociais e econômicas.\n  * **Tese do Tema 793 do STF**: Os entes da Federação (União, Estados, DF e Municípios) são solidariamente responsáveis nas demandas prestacionais na área da saúde. Contudo, compete à autoridade judicial **direcionar o cumprimento conforme as regras de repartição de competências e determinar o ressarcimento** a quem suportou o ônus financeiro de competência alheia;\n  * O polo passivo pode ser composto por qualquer dos entes, mas o magistrado deve zelar pelo direcionamento administrativo da obrigação primária.\n\n* **Critérios para Fornecimento de Medicamentos sem Registro na ANVISA (Tema 500 do STF)**:\n  O Estado **não pode ser obrigado** a fornecer medicamentos experimentais ou sem registro na ANVISA.\n  * *Exceções Excepcionais e Cumulativas*: É viável o fornecimento se demonstrados:\n    1. Existência de pedido de registro na ANVISA (salvo no caso de doenças raras e ultrarraras);\n    2. Existência de registro do medicamento em renomadas agências de regulação no exterior (FDA, EMA);\n    3. Inexistência de substituto terapêutico com registro no Brasil;\n    * **Juízo Competente Obrigatório**: As ações que demandem fornecimento de medicamentos sem registro na ANVISA devem ser **obrigatoriamente propostas em face da União perante a Justiça Federal**.\n\n* **Medicamentos Não Incorporados ao SUS e Fixação de Competência (Tema 1.234 do STF - Acordo Homologado)**:\n  O Plenário do STF homologou acordo definindo a competência e os parâmetros para demandas de remédios não incluídos nas listas oficiais do SUS (RENASE / RENAME):\n  1. Nas demandas de medicamentos que custem valor expressivo fixado em patamares anuais regulamentados, a **União deve figurar no polo passivo**, atraindo a competência exclusiva da Justiça Federal;\n  2. Nas demandas de menor impacto econômico já descentralizadas, atuam os Estados e Municípios perante a Justiça Estadual;\n  3. Criação de plataforma nacional unificada de conciliação e rastreamento para evitar duplicidade de fornecimento.\n\n* **Requisitos Cumulativos para Medicamentos Incorporados mas Faltantes (Tema Repetitivo 106 do STJ)**:\n  A concessão judicial de medicamentos não constantes nos atos normativos do SUS exige a demonstração cumulativa pelo autor de:\n  1. Comprovação, por meio de laudo médico fundamentado e circunstanciado expedido pelo médico assistente, da **imprescindibilidade ou necessidade do medicamento**, assim como da ineficácia dos fármacos fornecidos pelo SUS para o tratamento da moléstia;\n  2. **Incapacidade financeira** do postulante de arcar com o custo do medicamento prescrito;\n  3. Existência de **registro do medicamento na ANVISA**, observados os usos autorizados pela agência.\n\n* **Microssistema Processual Coletivo (LACP e CDC)**:\n  A tutela da saúde e dos direitos transindividuais opera-se pela integração da Lei 7.347/1985 (LACP) e Lei 8.078/1990 (CDC).\n  * A legitimação do Ministério Público e da Defensoria Pública para a tutela coletiva de direitos individuais homogêneos na área da saúde é ampla e pacificada pelo STF (Tema 607 e Súmula 601 do STJ).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Solidariedade com Direcionamento e Ressarcimento (Tema 793 STF)",
        "author": "STF (Plenário - RE 855.178/SE)",
        "thesis": "A solidariedade autoriza a propositura da ação em face de qualquer ente, mas impõe ao juiz direcionar a execução e determinar compensação financeira interna.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Litisconsórcio Passivo Necessário com a União em Todos os Casos",
        "author": "Corrente Fazendária Federal",
        "thesis": "Sustentava que a ausência de inclusão na RENAME atrairia obrigatoriamente a União Federal para todos os feitos judiciais de saúde, deslocando tudo para a Justiça Federal.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "TEMA 106 DO STJ EXIGE TRÊS REQUISITOS CUMULATIVOS: Laudo circunstanciado comprovando a ineficácia dos medicamentos do SUS + hipossuficiência financeira do autor + registro prévio na ANVISA.",
      "MEDICAMENTO SEM ANVISA EXIGE UNIÃO NO POLO PASSIVO: Demanda sobre remédio não registrado na ANVISA TRAMITA OBRIGATORIAMENTE NA JUSTIÇA FEDERAL contra a União (Tema 500 do STF).",
      "MEDICAMENTOS EXPERIMENTAIS: O Estado NUNCA pode ser obrigado a custear tratamentos experimentais sem respaldo científico ou eficácia reconhecida.",
      "SÚMULA 601 DO STJ: O Ministério Público possui ampla legitimidade ativa para ajuizar Ação Civil Pública postulando tratamento de saúde e medicamentos para pessoas determinadas hipossuficientes."
    ],
    "careerNuances": {
      "AGU": "Defesa da União nas ações de medicamentos de alto custo e fármacos sem registro na ANVISA perante a Justiça Federal (Temas 500 e 1234 do STF).",
      "PGFN": "Garantia de que condenações judiciais em saúde obedeçam ao regime de precatórios e respeito à reserva orçamentária do Ministério da Saúde.",
      "MPE": "Atuação maciça na garantia de vagas hospitalares em UTI, fornecimento de remédios essenciais e ajuizamento de ACPs estruturantes contra o colapso da rede pública municipal e estadual."
    }
  },

  // =========================================================================
  // 13. PRESCRIÇÃO, DECADÊNCIA E LINDB (DIREITO CIVIL - LOTE A FUC)
  // =========================================================================
  {
    id: "fuc-civil-prescricao-decadencia-lindb",
    themeKeywords: [
      "prescrição", "prescricao", "decadência", "decadencia", "lindb",
      "segurança jurídica", "art. 205", "art. 206", "prazo decenal", "prazo trienal",
      "erro grosseiro", "art. 28 lindb", "actio nata"
    ],
    discipline: "DIREITO CIVIL",
    title: "Prescrição, Decadência e Regime Jurídico da LINDB",
    coreDoctrine: `#### 📚 Teoria Geral do Direito Civil, Prescrição, Decadência e LINDB

* **Distinção Científica entre Prescrição e Decadência**:
  A teoria dualista consagrada por Agnelo Amorim Filho estabelece o critério científico irretocável de distinção: a prescrição extingue a pretensão referente a direitos subjetivos prestacionais (que nascem da violação de um dever jurídico e exigem prestação comissiva ou omissiva), ao passo que a decadência atinge diretamente o próprio direito potestativo (ao qual corresponde um estado de sujeição da contraparte sem prestação executiva).
  O Código Civil de 2002 consagrou expressamente essa dicotomia nos artigos 205 (prazo geral de prescrição de 10 anos) e 206 (prazos prescricionais especiais de 1 a 5 anos), reservando à decadência os prazos esparsos previstos nos artigos correspondentes a cada direito potestativo específico. Diferente da prescrição, a decadência legal não admite suspensão ou interrupção (art. 207), salvo expressa disposição em contrário, e deve ser conhecida de ofício pelo magistrado.

* **Direito Civil Geral: Aplicação da Lei no Tempo, Espaço, Interpretação e Negócio Jurídico**:
  A LINDB consagra a irretroatividade da lei e o respeito ao ato jurídico perfeito, direito adquirido e coisa julgada (art. 6º). As fontes integradoras da ordem jurídica em caso de omissão legal são a analogia, os costumes e os princípios gerais de direito (art. 4º). No negócio jurídico (arts. 104 a 184 do CC), a validade requer agente capaz, objeto lícito, possível, determinado ou determinável, e forma prescrita ou não defesa em lei, tutelando-se a boa-fé objetiva (art. 113) e vedando-se os vícios do consentimento (erro, dolo, coação, estado de perigo e lesão) e vício social da fraude contra credores.

* **Direito Público na LINDB (Arts. 20 a 30)**:
  A Lei de Introdução às Normas do Direito Brasileiro impõe o consequencialismo decisório prático, veda decisões baseadas em valores jurídicos abstratos sem ponderação das consequências práticas e exige demonstração de erro grosseiro ou dolo para responsabilização pessoal do agente público (art. 28).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria da Actio Nata Subjetiva (Consolidada no STJ)",
        author: "Jurisprudência Dominante da 2ª Seção e Corte Especial do STJ",
        thesis: "O termo inicial do prazo prescricional submete-se ao conhecimento efetivo da lesão e da autoria pelo titular do direito, em homenagem à boa-fé objetiva.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Actio Nata Objetiva Estrita",
        author: "Doutrina Civilista Clássica (Clóvis Beviláqua)",
        thesis: "A prescrição tem início imediatamente na data em que ocorre o fato violador do direito subjetivo, independentemente da ciência do credor.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "UNICIDADE DA INTERRUPÇÃO DA PRESCRIÇÃO: O art. 202 do Código Civil veda taxativamente a repetição de atos interruptivos. A prescrição só pode ser interrompida uma única vez.",
      "DECRETO 20.910/1932 PREVALECE SOBRE O CÓDIGO CIVIL: Dívidas da Fazenda Pública prescrevem em 5 anos, prevalecendo a norma especial administrativa sobre o prazo decenal ou trienal do Código Civil (Tema 553 do STJ).",
      "DECADÊNCIA LEGAL NÃO SE SUSPENDE: Salvo expressa exceção normativa, os prazos decadenciais fixados em lei não admitem impedimento, suspensão ou interrupção (art. 207 do CC).",
      "RESPONSABILIDADE CONTRATUAL É DECENAL: O STJ pacificou no EREsp 1.280.825/RJ que a reparação por inadimplemento contratual prescreve em 10 anos (art. 205), ficando o prazo trienal (art. 206, § 3º, V) adstrito à responsabilidade extracontratual."
    ],
    careerNuances: {
      AGU: "Aplicação intransigente do prazo prescricional quinquenal do Decreto 20.910/1932 em favor de autarquias e fundações federais, afastando a incidência do Código Civil.",
      PGFN: "Defesa da inaplicabilidade dos prazos do direito civil à execução de créditos inscritos em Dívida Ativa da União, regidos com exclusividade pelo CTN e pela Lei 6.830/1980.",
      MPE: "Sustentação da imprescritibilidade das pretensões de ressarcimento ao erário fundadas na prática de atos de improbidade administrativa dolosos (Tema 897 do STF)."
    }
  },

  // =========================================================================
  // 14. DIREITOS REAIS, ALIENAÇÃO FIDUCIÁRIA E BENS (DIREITO CIVIL - LOTE A FUC)
  // =========================================================================
  {
    id: "fuc-civil-direitos-reais-alienacao-fiduciaria",
    themeKeywords: [
      "direitos reais", "alienação fiduciária", "alienacao fiduciaria", "posse",
      "propriedade", "desapropriação", "bem de família", "bem de familia",
      "decreto-lei 911", "lei 9.514", "hipoteca", "penhor"
    ],
    discipline: "DIREITO CIVIL",
    title: "Direitos Reais, Alienação Fiduciária em Garantia e Bem de Família",
    coreDoctrine: `#### 📚 Direitos Reais, Posse, Propriedade e Garantias Fiduciárias

* **Regime Dogmático dos Direitos Reais e Teoria da Posse**:
  Os direitos reais são dotados de tipicidade cerrada (numerus clausus, art. 1.225 do Código Civil), oponibilidade erga omnes e direito de sequela. A propriedade imobiliária é o direito real por excelência, condicionado ao cumprimento de sua função socioambiental (art. 5º, XXIII da CF/88).
  O Código Civil adota a teoria objetiva de Ihering: posse é a visibilidade do domínio (art. 1.196). A aquisição da propriedade imobiliária aperfeiçoa-se pelo registro do título translativo no Cartório de Registro de Imóveis (art. 1.245) ou pela usucapião ordinária (10 anos, art. 1.242), extraordinária (15 anos, art. 1.238), especial urbana (5 anos, art. 1.240) ou especial rural (5 anos, art. 1.239).

* **Alienação Fiduciária em Garantia (Lei 9.514/1997 e Tema 1.095 STF)**:
  Ocorre o desdobramento da posse e a transferência da propriedade resolúvel do imóvel ao credor fiduciário. O Supremo Tribunal Federal (Tema 1.095 / RE 860.631) fixou a tese vinculante da plena constitucionalidade da execução extrajudicial da cláusula de alienação fiduciária imobiliária em cartório de registro de imóveis.

* **Proteção do Bem de Família (Lei 8.009/1990 e Súmula 364 STJ)**:
  Impenhorabilidade ampla do imóvel residencial próprio da entidade familiar ou pessoa solteira, ressalvadas dívidas de pensão alimentícia, taxas condominiais, IPTU do próprio imóvel e fiança em locação urbana (STF Tema 1.127).

* **Teoria dos Direitos Reais sobre Coisas Alheias e Direitos de Vizinhança**:
  Os direitos reais sobre coisas alheias subdividem-se em direitos reais de fruição (enfiteuse, superfície, servidões, usufruto, uso e habitação), direitos reais de garantia (penhor, hipoteca e anticrese) e direito real de aquisição (promessa de compra e venda irrevogável registrada em cartório de imóveis, art. 1.417 do Código Civil). Nos direitos de vizinhança (arts. 1.277 a 1.313 do CC), tutela-se o sossego, a saúde e a segurança dos confinantes contra o uso anormal da propriedade, assegurando o direito de passagem forçada ao proprietário do imóvel encravado e a regular repartição das águas e limites divisórios.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Inaplicabilidade do Adimplemento Substancial na Alienação Fiduciária (STJ)",
        author: "2ª Seção do STJ (REsp 1.622.555/MG)",
        thesis: "O Decreto-Lei 911/1969 constitui microssistema especial expresso que prevalece sobre a construção principiológica do adimplemento substancial.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Aplicação da Função Social e Boa-Fé Objetiva",
        author: "Corrente Civilista Constitucionalizada",
        thesis: "O pagamento de expressiva fração da dívida deveria impedir a busca e apreensão drástica do veículo, convertendo a pretensão em cobrança simples.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "BENS PÚBLICOS NÃO SOFREM USUCAPIÃO: Súmula 340 do STF e arts. 183, § 3º e 191, parágrafo único da CF vedam de forma absoluta a usucapião de qualquer bem público.",
      "FIADOR DE LOCAÇÃO COMERCIAL: O STF fixou a tese de que é plenamente penhorável o bem de família do fiador inclusive na locação comercial (Tema 1.127).",
      "IMÓVEL FUNCIONAL OU DE SOLTEIRO: A proteção da Lei 8.009/1990 abrange o imóvel pertencente a pessoas solteiras, separadas e viúvas (Súmula 364 do STJ).",
      "PURGAÇÃO DA MORA NA ALIENAÇÃO FIDUCIÁRIA: A purgação da mora exige o pagamento da integralidade da dívida pendente (parcelas vencidas e vincendas), conforme art. 3º, § 2º do DL 911/69."
    ],
    careerNuances: {
      AGU: "Defesa patrimonial intransigente das terras da União, terrenos de marinha, faixas de fronteira e bens públicos afetados à prestação de serviços federais.",
      PGFN: "Execução de garantias fiduciárias e imobiliárias prestadas em parcelamentos especiais de grandes contribuintes, com bloqueio no Registro Imobiliário.",
      MPE: "Atuação na tutela dos bens de interesse difuso, proteção de áreas de preservação permanente contra grilagem e desocupação de unidades de conservação."
    }
  },

  // =========================================================================
  // 15. RECUPERAÇÃO JUDICIAL, FALÊNCIA E DIREITO SOCIETÁRIO (DIREITO EMPRESARIAL - LOTE A FUC)
  // =========================================================================
  {
    id: "fuc-empresarial-recuperacao-falencia-11101",
    themeKeywords: [
      "recuperação judicial", "recuperacao judicial", "falência", "falencia",
      "lei 11.101", "stay period", "concurso de credores", "crédito tributário",
      "habilitação de crédito", "sociedades", "sociedade limitada", "títulos de crédito"
    ],
    discipline: "DIREITO EMPRESARIAL",
    title: "Recuperação Judicial, Falência e Regime da Lei 11.101/2005",
    coreDoctrine: `#### 📚 Teoria Geral da Empresa, Falência e Recuperação Judicial

* **O Microssistema da Recuperação Empresarial e Falência (Lei 11.101/2005 e Lei 14.112/2020)**:
  Orienta-se pelos princípios reitores da preservação da empresa viável, proteção aos trabalhadores e otimização dos ativos produtivos.
  A recuperação judicial tem como pressupostos materiais o exercício regular da atividade empresarial por mais de 2 anos e a não ocorrência de falência anterior ou condenação por crime falimentar. O deferimento do processamento instaura o stay period (suspensão de execuções contra o devedor por 180 dias, prorrogável uma única vez por igual prazo, art. 6º, § 4º). Os créditos fiscais não se sujeitam à recuperação judicial (art. 6º, § 7º-B), mas as constrições patrimoniais sobre bens essenciais do devedor submetem-se à deliberação do juízo da recuperação para salvaguardar a função social da empresa.
  Na falência, a ordem legal de preferência de pagamentos (art. 83) prioriza: créditos trabalhistas limitados a 150 salários-mínimos por credor; créditos gravados com garantia real até o limite do bem gravado; créditos tributários; créditos quirografários; e créditos subordinados.

* **Teoria da Empresa, Sociedades Empresárias e Propriedade Intelectual**:
  O Código Civil de 2002 consagrou a Teoria da Empresa no art. 966, superando a vetusta teoria francesa dos atos de comércio. Considera-se empresário quem exerce profissionalmente atividade econômica organizada para a produção ou circulação de bens ou serviços. Nas sociedades empresárias (LTDA e S/A), destacam-se a responsabilidade patrimonial limitada e a autonomia da pessoa jurídica. A propriedade intelectual compreende os direitos autorais (Lei 9.610/98) e a propriedade industrial (marcas, patentes de invenção e modelos de utilidade na Lei 9.279/1996), tutelados contra atos de contrafação e concorrência desleal.

* **Classificação dos Créditos na Falência e Concurso de Credores**:
  A ordem de classificação dos créditos na falência é matéria de ordem pública imperativa e indelegável (art. 83 da Lei 11.101/2005). Destacam-se as garantias e privilégios dos créditos trabalhistas de natureza estritamente salarial até o limite legal, seguidos dos créditos com garantia real (hipoteca, penhor e alienação fiduciária quando incidente), créditos tributários da União, Estados e Municípios e créditos quirografários ordinários. A Lei 14.112/2020 aperfeiçoou o financiamento do devedor em recuperação (DIP Financing - Debtor-in-Possession), autorizando a outorga de garantias sobre ativos da empresa com prioridade extraconcursal absoluta em caso de convolação em falência, preservando o fluxo de caixa essencial à atividade econômica e à manutenção dos postos de trabalho.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Competência do Juízo da Recuperação para Bens Essenciais (STJ Tema 987)",
        author: "1ª Seção e 2ª Seção do STJ",
        thesis: "A execução fiscal não é suspensa, mas os atos constritivos contra patrimônio essencial devem ser harmonizados pelo juízo recuperatório universal.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Autonomia Absoluta do Juízo da Execução Fiscal",
        author: "Corrente Fiscalista Tradicional",
        thesis: "A execução fiscal deveria prosseguir com penhoras e leilões diretos sem qualquer interferência do juízo da recuperação judicial.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "CRÉDITO TRIBUTÁRIO NÃO SE SUBMETE À RECUPERAÇÃO: O art. 6º, § 7º-B da Lei 11.101/2005 é taxativo: o crédito da Fazenda Pública é insubmisso aos efeitos da recuperação judicial.",
      "CONVOLAÇÃO EM FALÊNCIA: O não envio do plano de recuperação no prazo improrrogável de 60 dias da publicação do deferimento acarreta obrigatoriamente a decretação de falência.",
      "PROIBIÇÃO DE VOTO DO CREDOR EM CONFLITO: Sócios e pessoas ligadas à recuperanda não votam na assembleia geral de credores e seus créditos não contam para o quórum.",
      "QUÓRUM DE MODIFICAÇÃO CONTRATUAL NA LIMITADA: A Lei 14.451/2022 reduziu o quórum de alteração do contrato social de 3/4 para maioria absoluta do capital social."
    ],
    careerNuances: {
      AGU: "Garantia da continuidade dos serviços públicos concedidos quando a concessionária entra em recuperação judicial, assegurando o interesse público primário.",
      PGFN: "Cobrança ativa de créditos tributários e transações resolutivas de litígio na recuperação judicial, com fiscalização do cumprimento das CNDs obrigatórias.",
      MPE: "Atuação como fiscal da ordem jurídica (custos vulnerabilis) no processo falimentar e de recuperação, atuando na repressão a crimes falimentares."
    }
  },

  // =========================================================================
  // 16. TEORIA GERAL DOS RECURSOS E PRECEDENTES (DIREITO PROCESSUAL CIVIL - LOTE A FUC)
  // =========================================================================
  {
    id: "fuc-processocivil-recursos-precedentes-927",
    themeKeywords: [
      "recursos", "teoria geral dos recursos", "apelação", "agravo de instrumento",
      "art. 1.015", "precedentes", "art. 927", "recurso especial", "recurso extraordinário",
      "embargos de declaração", "irdr", "iac", "taxatividade mitigada"
    ],
    discipline: "DIREITO PROCESSUAL CIVIL",
    title: "Teoria Geral dos Recursos, Precedentes Obrigatórios e Agravo de Instrumento",
    coreDoctrine: `#### 📚 Teoria Geral do Processo, Normas Fundamentais e Recursos no CPC/2015

* **Normas Fundamentais e Modelo Constitucional do Processo Civil**:
  O Código de Processo Civil de 2015 é ordenado, disciplinado e interpretado conforme os valores e as normas fundamentais da Constituição Federal (art. 1º do CPC). Destacam-se o princípio da primazia da resolução de mérito (arts. 4º e 317), a vedação peremptória à prolação de decisões surpresa (arts. 9º e 10), a boa-fé objetiva processual (art. 5º) e o princípio da cooperação mútua entre todos os sujeitos processuais (art. 6º).
  O CPC estruturou um autêntico sistema de precedentes vinculantes (arts. 926 e 927), impondo aos tribunais o dever de uniformizar sua jurisprudência e mantê-la estável, íntegra e coerente.

* **Teoria Geral dos Recursos e Agravo de Instrumento**:
  A taxatividade do agravo de instrumento (art. 1.015 do CPC) foi mitigada pelo STJ no Tema 988 dos Repetitivos, admitindo o agravo contra decisões interlocutórias não elencadas na lei quando verificada a urgência decorrente da inutilidade da futura apreciação em apelação. Prazos recursais são computados exclusivamente em dias úteis (art. 219), gozando a Fazenda Pública e a Defensoria Pública de prazo em dobro (art. 183 do CPC).

* **Efeitos Recursais, Juízo de Admissibilidade e Teoria da Causa Madura**:
  Os recursos no CPC/2015 são dotados de efeito devolutivo em sua dimensão vertical (profundidade) e horizontal (extensão da impugnação). A concessão de efeito suspensivo ope judicis exige demonstração concomitante da probabilidade do provimento do recurso e do perigo de dano ou risco ao resultado útil do processo (art. 995, parágrafo único). Pela teoria da causa madura (art. 1.013, § 3º), o tribunal pode julgar desde logo o mérito da demanda quando o processo estiver em condições de imediato julgamento, nas hipóteses de reforma de sentença terminativa, decretação de nulidade por falta de fundamentação ou superação de prescrição e decadência.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Taxatividade Mitigada do Art. 1.015 do CPC (STJ Tema 988)",
        author: "Corte Especial do STJ (Rel. Min. Nancy Andrighi)",
        thesis: "O rol do art. 1.015 é de taxatividade mitigada, cabendo agravo de instrumento sempre que a postergação da matéria para a apelação ensejar dano irreparável.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Taxatividade Estrita do Rol do Agravo",
        author: "Interpretação Literal Originária",
        thesis: "As hipóteses de agravo de instrumento deveriam ser interpretadas restritivamente, sem qualquer alargamento pretoriano.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "PRAZO EM DOBRO DA FAZENDA NOS EMBARGOS: A Fazenda Pública possui prazo em dobro inclusive para opor embargos de declaração (10 dias úteis), superando a Súmula 116 do TFR.",
      "AGRAVO INTERNO CONTRA DECISÃO MONOCRÁTICA: Cabe agravo interno no prazo de 15 dias contra qualquer decisão unipessoal de relator (art. 1.021 do CPC), sendo vedado ao relator limitar o recurso.",
      "SUPERVENIÊNCIA DE PRECEDENTE VINCULANTE: O juiz não pode julgar improcedente pedido de aplicação de tese vinculante do STF/STJ sem demonstrar expressamente distinguishing ou overruling.",
      "REMESSA NECESSÁRIA NÃO É RECURSO: A remessa necessária é condição de eficácia da sentença desfavorável à Fazenda Pública e não recurso, não se sujeitando a preparo ou prazo preclusivo."
    ],
    careerNuances: {
      AGU: "Defesa uniforme da aplicação imediata de precedentes qualificados do STF e STJ favoráveis à União, invocando dispensa legal de recorrer (art. 19 da Lei 10.522/2002).",
      PGFN: "Atuação recursal de cúpula no STJ e STF com pareceres vinculantes e despachos orientadores, evitando a interposição de recursos protelatórios contra teses pacificadas.",
      MPE: "Atuação como fiscal da correta observância do sistema de precedentes pelos Tribunais de Justiça e sustentação oral em IRDRs sobre políticas públicas estaduais."
    }
  },

  // =========================================================================
  // 17. PROCESSO LEGISLATIVO E REFORMAS CONSTITUCIONAIS (DIREITO CONSTITUCIONAL - LOTE A FUC)
  // =========================================================================
  {
    id: "fuc-constitucional-processo-legislativo-ec136",
    themeKeywords: [
      "processo legislativo", "emenda constitucional", "ec 132", "ec 136",
      "lei complementar", "lei ordinária", "medida provisória", "sanção e veto",
      "iniciativa privativa", "quórum", "cláusula pétrea", "reforma constitucional"
    ],
    discipline: "DIREITO CONSTITUCIONAL",
    title: "Processo Legislativo Constitucional, Limitações à Reforma e Novidades das ECs Recentes",
    coreDoctrine: `#### 📚 Processo Legislativo, Poder Legislativo e Limites Constitucionais

* **Processo Legislativo Constitucional e Cláusulas Pétreas**:
  O processo legislativo é estruturado a partir da rigidez constitucional e da tripartição de poderes. A Carta Magna de 1988 estabelece limites intransponíveis ao Poder Constituinte Derivado Reformador: circunstanciais (intervenção federal, estado de defesa e sítio, art. 60, § 1º), formais (quórum de 3/5 em dois turnos em cada Casa, art. 60, § 2º) e materiais (cláusulas pétreas do art. 60, § 4º). Emendas constitucionais são promulgadas pelas Mesas da Câmara e do Senado, inexistindo sanção ou veto presidencial. A sanção presidencial superveniente não convalida vício de iniciativa privativa do Chefe do Executivo (cancelamento da Súmula 5 do STF).

* **Organização e Competências do Congresso Nacional (Arts. 44 a 58 da CF)**:
  O Poder Legislativo compõe-se da Câmara dos Deputados e do Senado Federal. Cabe à Câmara autorizar a instauração de processo de impeachment (art. 51, I). Cabe privativamente ao Senado julgar o Presidente da República e Ministros do STF por crimes de responsabilidade (art. 52, I e II), além de aprovar a escolha de magistrados dos tribunais superiores, dirigentes de agências reguladoras e diplomatas.

* **Espécies Normativas e Processo de Elaboração das Leis**:
  O art. 59 da Constituição Federal elenca o rol das espécies normativas do processo legislativo: emendas à Constituição, leis complementares (aprovadas por maioria absoluta, art. 69), leis ordinárias (maioria simples, art. 47), leis delegadas (elaboradas pelo Presidente da República mediante autorização do Congresso, art. 68), medidas provisórias (com força de lei, adotadas em caso de relevância e urgência, art. 62), decretos legislativos (veiculam matérias de competência exclusiva do Congresso, art. 49) e resoluções (matérias de competência privativa de cada Casa Legislativa, arts. 51 e 52). A iniciativa popular de leis exige subscrição de pelo menos um por cento do eleitorado nacional, distribuído por pelo menos cinco Estados, com não menos de três décimos por cento dos eleitores de cada um deles (art. 61, § 2º).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Superação da Súmula 5 do STF (Inconstitucionalidade Formal Insanável)",
        author: "Jurisprudência Pacífico do Plenário do STF",
        thesis: "A sanção do Chefe do Executivo a projeto de lei de iniciativa reservada proposto por parlamentar NÃO convalida o vício formal de inconstitucionalidade.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Convalidação pela Sanção (Súmula 5 Histórica)",
        author: "Doutrina Histórica e Súmula 5 Superada",
        thesis: "A sanção expressa supriria a falta de iniciativa originária, convalidando a manifestação da vontade executiva.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "PEC NÃO SOFRE SANÇÃO NEM VETO: A proposta de emenda aprovada é promulgada pelas Mesas da Câmara e do Senado Federal, sem qualquer intervenção de sanção ou veto presidencial.",
      "INICIATIVA POPULAR NÃO CABE PARA PEC FEDERAL: A iniciativa popular no âmbito federal cabe para Leis Complementares e Ordinárias (art. 61, § 2º), mas NÃO há previsão de iniciativa popular de PEC federal.",
      "ESCRUTÍNIO ABERTO NO VETO: Desde a Emenda Constitucional 76/2013, a votação que aprecia e derruba o veto presidencial é ostensiva (voto aberto) por maioria absoluta dos Deputados e Senadores.",
      "MEDIDA PROVISÓRIA E PRINCÍPIO DA ANTERIORIDADE: Medida provisória que institui ou majora impostos (salvo II, IE, IPI, IOF e IEG) só produz efeitos no exercício financeiro seguinte se for convertida em lei até o último dia daquele em que foi editada."
    ],
    careerNuances: {
      AGU: "Defesa perante o STF da constitucionalidade formal e material de Leis e Emendas Constitucionais de interesse da União (art. 103, § 3º da CF).",
      PGFN: "Acompanhamento rigoroso da tramitação legislativa de projetos fiscais e orçamentários, elaborando notas técnicas de conformidade constitucional.",
      MPE: "Provocação do Procurador-Geral da República ou atuação no controle concentrado perante os TJs para impugnação de leis estaduais com vício de iniciativa."
    }
  },

  // =========================================================================
  // 18. PRECATÓRIOS, ENDIVIDAMENTO E REGIME CONSTITUCIONAL (DIREITO FINANCEIRO - LOTE A FUC)
  // =========================================================================
  {
    id: "fuc-financeiro-precatorios-divida-cf100",
    themeKeywords: [
      "precatórios", "precatorios", "art. 100", "rpv", "requisição de pequeno valor",
      "emendas constitucionais 113 e 114", "endividamento público", "dívida consolidada",
      "adi 7064", "adi 7047", "ordem cronológica", "despesa de pessoal", "lrf"
    ],
    discipline: "DIREITO FINANCEIRO",
    title: "Precatórios Judiciais, Requisições de Pequeno Valor (RPV) e Limites da Dívida Pública",
    coreDoctrine: `#### 📚 Regime Constitucional dos Precatórios, RPVs e Limites Fiscais

* **Princípio Republicano da Impessoalidade e Precatórios (Art. 100 da CF)**:
  O cumprimento de sentenças condenatórias contra a Fazenda Pública processa-se unicamente pela expedição de precatórios judiciais e Requisições de Pequeno Valor (RPVs), em rigorosa ordem cronológica de apresentação. As ADIs 7064 e 7047 do STF declararam a inconstitucionalidade do teto de precatórios das ECs 113 e 114/2021, autorizando a regularização do passivo da União mediante créditos extraordinários.
  Estados e Municípios podem fixar tetos próprios de RPV, desde que não inferiores ao teto do RGPS (STF ADI 5100).

* **Ordem Cronológica, Preferências Constitucionais e Conciliação**:
  Têm preferência sobre os demais os créditos de natureza alimentar devidos a pessoas com 60 anos de idade, pessoas com deficiência ou portadores de doença grave, até o limite do triplo da RPV (art. 100, § 2º). É admitida a compensação de precatórios com créditos tributários da Fazenda Pública e a celebração de acordos diretos com deságio de até 40% perante as câmaras de conciliação de precatórios.

* **Juros de Mora, Correção Monetária e Execução contra a Fazenda**:
  O STF (Tema 810 / RE 870.947) e as Emendas Constitucionais recentes definiram que os créditos em face da Fazenda Pública sujeitam-se à incidência da taxa referencial do Sistema Especial de Liquidação e Custódia (SELIC) a título de juros e correção monetária unificados para débitos de natureza não tributária. No período compreendido entre a data da conta de liquidação e a expedição do precatório ou RPV não incidem juros de mora (Súmula Vinculante 17 do STF), desde que o pagamento tempestivo ocorra dentro do prazo constitucional estipulado no art. 100, § 5º da CF (até o final do exercício seguinte para precatórios apresentados até 2 de abril).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Inconstitucionalidade do Teto de Precatórios (STF ADIs 7064 e 7047)",
        author: "Plenário do STF (Rel. Min. Luiz Fux)",
        thesis: "O adiamento indefinido e moratória de precatórios afronta o direito fundamental à tutela jurisdicional efetiva e a separação de poderes.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Moratória Orçamentária Excepcional",
        author: "Governo Federal na edição das ECs 113 e 114",
        thesis: "A criação de subteto era medida de solvência fiscal imprescindível diante do crescimento abrupto das condenações fazendárias.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "VEDAÇÃO AO FRACIONAMENTO PARA BURLAR RPV: A Súmula Vinculante 47 permite a execução autônoma de honorários advocatícios sucumbenciais, mas é vedado o fracionamento do valor da execução para que o mesmo credor receba em parte por RPV e em parte por precatório.",
      "COMPENSAÇÃO TRIBUTÁRIA COM PRECATÓRIOS: O credor de precatório pode utilizá-lo para amortizar dívida inscrita em Dívida Ativa da União, mas a transação exige procedimento administrativo formal perante a PGFN.",
      "CRIME DE RESPONSABILIDADE DO PRESIDENTE DO TRIBUNAL: Preterir a ordem cronológica de pagamento de precatório importa responsabilidade pessoal e improbidade administrativa do Presidente do Tribunal de Justiça.",
      "LIMITE MÍNIMO DE RPV: Lei municipal não pode fixar valor de RPV inferior ao teto do Regime Geral de Previdência Social (art. 100, § 4º da CF)."
    ],
    careerNuances: {
      AGU: "Elaboração de acordos judiciais diretos com deságio de até 40% na Câmara de Conciliação e Arbitragem da Administração Federal (CCAF) para quitação célere de precatórios federais.",
      PGFN: "Utilização estratégica de precatórios federais ofertados por devedores para liquidação e compensação de débitos tributários inscritos em Dívida Ativa.",
      MPE: "Fiscalização da fila cronológica gerida pelo Tribunal de Justiça Estadual e responsabilização de chefes do Executivo municipal que descumprem dotações orçamentárias de precatórios."
    }
  },

  // =========================================================================
  // 19. CRIMES EM LICITAÇÕES E CONTRATOS ADMINISTRATIVOS (DIREITO PENAL - LOTE B FUC)
  // =========================================================================
  {
    id: "fuc-penal-crimes-licitacoes-337",
    themeKeywords: [
      "crimes em licitações", "crimes em licitacoes", "crimes licitatorios", "licitacoes e contratos",
      "art. 337-e", "art. 337-f", "dispensa indevida", "inexigibilidade indevida", "contratacao direta ilegal",
      "frustração do caráter competitivo", "frustracao do carater competitivo", "lei 14.133", "direito penal licitatório"
    ],
    discipline: "DIREITO PENAL",
    title: "Crimes em Licitações e Contratos Administrativos (Arts. 337-E a 337-P do Código Penal)",
    coreDoctrine: "A Lei nº 14.133/2021 operou profunda revolução estrutural no Direito Penal Licitatório pátrio ao revogar integralmente a disciplina penal outrora albergada nos artigos 89 a 108 da vetusta Lei nº 8.666/1993, inaugurando o Capítulo II-B do Título XI da Parte Especial do Código Penal (arts. 337-E a 337-P), conferindo status codificado aos tipos penais contra a Administração Pública nos procedimentos licitatórios e contratos administrativos.\n\nO novel diploma legislativo exasperou substancialmente o tratamento punitivo cominado às condutas delituosas, substituindo sistematicamente as antigas reprimendas de detenção por severas penas de reclusão. Ilustrativamente, o crime de contratação direta ilegal (art. 337-E do CP, sucessor do art. 89 da Lei 8.666/93) e o crime de frustração do caráter competitivo de licitação (art. 337-F do CP, correspondente ao antigo art. 90) passaram a cominar penas privativas de liberdade de 4 a 8 anos de reclusão, acrescidas de expressiva sanção pecuniária, o que obsta peremptoriamente a concessão de institutos despenalizadores comuns como a suspensão condicional do processo (art. 89 da Lei 9.099/95) e impõe regime inicial prisional potencialmente fechado ou semiaberto.\n\nNo plano da dogmática da tipicidade penal na contratação direta indevida (art. 337-E do CP), a jurisprudência uniformizada da Corte Especial do Superior Tribunal de Justiça (consolidada no julgamento do Recurso Especial repetitivo nº 1.288.620/PB e Tema Repetitivo 1.002) e do Supremo Tribunal Federal (Inq 2.482 e AP 480) consagrou de forma indeclinável que o tipo penal exige cumulativamente: (i) a demonstração cabal e incontroversa do dolo específico de burlar as salvaguardas licitatórias para causar dano ao patrimônio público; e (ii) a efetiva produção de prejuízo material e econômico aos cofres públicos (dano real ao Erário). Desse modo, afasta-se de forma peremptória a vetusta tese acusatória de que o delito configuraria infração de perigo abstrato. Caso a contratação tenha ocorrido com preços compatíveis com os praticados no mercado relevante e os serviços ou obras tenham sido prestados na integralidade, inexiste crime por manifesta atipicidade material, resolvendo-se eventuais falhas procedimentais estritamente no âmbito cível ou disciplinar.\n\nOutro avanço marcante consiste na cominação da pena de multa nos delitos do Capítulo II-B do Código Penal, disciplinada pelo novel art. 337-P. Em derrogação ao critério geral de dias-multa preconizado pelos artigos 49 a 60 do Código Penal, o art. 337-P instituiu critério sancionatório proporcional específico: a pena de multa não poderá ser inferior a 2% nem superior a 5% do valor do contrato licitado ou celebrado com contratação direta, assegurando que o impacto patrimonial da condenação guarde estreita aderência à magnitude econômica da avença administrativa fraudada.\n\nQuanto à tipicidade subjetiva e à natureza da ação penal, todas as figuras típicas descritas nos arts. 337-E a 337-P são estritamente dolosas, inexistindo previsão de modalidade culposa em qualquer de suas hipóteses normativas. A ação penal é pública incondicionada em sua totalidade, cuja titularidade privativa é do Ministério Público, ressalvada a intervenção atuante e legitimada da Advocacia Pública Federal (AGU e PGFN) na qualidade de assistente de acusação para pleitear a liquidação do dano e o ressarcimento integral do patrimônio fazendário federal.",
    divergentCurrents: {
      firstCurrent: {
        name: "Exigência Cumulativa de Dolo Específico e Prejuízo Efetivo ao Erário (STJ Tema 1.002 e STF)",
        author: "Corte Especial do STJ (APn 480/MG, REsp 1.288.620/PB) e Plenário do STF",
        thesis: "A contratação direta fora das hipóteses legais ou sem observância das formalidades exige indispensável demonstração do dolo específico de fraudar e efetivo prejuízo material aos cofres públicos, sendo atípica a conduta na ausência de superfaturamento comprovado.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Crime Formal de Perigo Abstrato e Mera Inobservância de Rito Formal",
        author: "Doutrina Acusatória Minoritária Superada",
        thesis: "A tipificação do crime tutelaria prioritariamente a higidez e a moralidade formal dos procedimentos administrativos, aperfeiçoando-se a consumação penal com a simples preterição das formalidades de dispensa ou inexigibilidade sem exigir comprovação de rombo financeiro.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "REVOGAÇÃO PENAL IMEDIATA DA LEI 8.666/1993: As disposições penais da Lei 8.666/1993 foram revogadas imediatamente na data da publicação oficial da Lei 14.133/2021, não se submetendo à regra de transição bienal concedida à parte eminentemente administrativa da legislação.",
      "AÇÃO PENAL PÚBLICA INCONDICIONADA INTEGRAL: Todos os crimes licitatórios previstos no Capítulo II-B do Código Penal submetem-se exclusivamente à ação penal pública incondicionada a cargo do Ministério Público.",
      "INEXISTÊNCIA DE MODALIDADE CULPOSA: Não existe qualquer modalidade culposa tipificada nos crimes licitatórios dos arts. 337-E a 337-P do Código Penal brasileiro.",
      "SISTEMÁTICA ESPECIAL DE MULTA CONTRATUAL: A pena pecuniária nos crimes de licitação não segue o sistema tradicional de dias-multa, mas sim percentual legal taxativo de 2% a 5% sobre o valor do contrato administrativo celebrado ou pretendido.",
      "PARECERISTAS E ADVOGADOS PÚBLICOS: O STF fixou que advogados públicos e pareceristas não cometem crime licitatório pela mera emissão de manifestação jurídica opinativa, exigindo-se prova de concerto delitivo ou dolo direto e manifesto conluio com os fraudadores."
    ],
    careerNuances: {
      AGU: "A Advocacia-Geral da União atua com ênfase na blindagem técnica dos atos praticados pelos consultores jurídicos e gestores públicos federais em estrita boa-fé, rechaçando a persecução penal temerária desprovida de dolo específico nos termos do Tema 1.002 do STJ.",
      PGFN: "A Procuradoria-Geral da Fazenda Nacional exerce vigilância rigorosa sobre a legalidade dos contratos públicos federais e contratos de modernização arrecadatória, fornecendo subsídios técnicos às instâncias penais e atuando na liquidação do título penal condenatório para recomposição dos cofres fazendários.",
      PF: "A Procuradoria Federal assegura a defesa dos atos administrativos de licitação praticados pelas autarquias e fundações federais, intervindo como assistente de acusação em face de quadrilhas ou cartéis que fraudam compras de medicamentos e insumos federais."
    }
  },

  // =========================================================================
  // 20. CRIMES CONTRA O ESTADO DEMOCRÁTICO DE DIREITO (DIREITO PENAL - LOTE B FUC)
  // =========================================================================
  {
    id: "fuc-penal-crimes-estado-democratico-14197",
    themeKeywords: [
      "estado democrático de direito", "lei 14.197", "golpe de estado",
      "abolição violenta", "art. 359-l", "art. 359-m", "interrupção do processo eleitoral",
      "sabotagem", "espionagem", "soberania nacional"
    ],
    discipline: "DIREITO PENAL",
    title: "Crimes Contra o Estado Democrático de Direito (Lei 14.197/2021 no Código Penal)",
    coreDoctrine: `#### 📚 Crimes Contra o Estado Democrático de Direito (Lei 14.197/2021)

* **Revogação da LSN e Novo Título XII da Parte Especial do Código Penal**:
  A Lei 14.197/2021 inseriu os arts. 359-I a 359-T no Código Penal, modernizando a tutela penal das instituições democráticas. Destacam-se a Abolição Violenta do Estado Democrático de Direito (art. 359-L) e Golpe de Estado (art. 359-M).
  O STF assentou que ambos os delitos são formais e de consumação antecipada (crimes de atentado): a própria tentativa idônea consuma o tipo penal, sendo inaplicável a redução de tentativa do art. 14, II do Código Penal.

* **Interrupção do Processo Eleitoral e Sabotagem Institucional**:
  O Código Penal tipifica a Interrupção do Processo Eleitoral (art. 359-N - perturbar pleito eleitoral violando segurança de urnas ou sistemas), a Violência Política (art. 359-P) e a Sabotagem a Instalações Militares ou Serviços Essenciais (art. 359-R). A tipificação resguarda a soberania popular, a higidez das eleições e o regular funcionamento dos Poderes da República.

* **Crimes Contra a Cidadania, Soberania e Atentado a Instalações Críticas**:
  A tutela penal outorgada pela Lei 14.197/2021 abrange a repressão ao Atentado à Soberania Nacional (art. 359-I - negociar com governo ou grupo estrangeiro visando à provocação de guerra ou atos de hostilidade contra o Brasil), ao crime de Traição e ao Atentado à Integridade Nacional (art. 359-J - praticar violência ou grave ameaça com o objetivo de desmembrar parte do território nacional). A lei assegura expressamente no art. 359-T que não constitui crime a manifestação crítica aos poderes constitucionais, reivindicações de direitos e a manifestação pacífica em passeatas e greves de categorias profissionais, resguardando as liberdades fundamentais da cidadania e da expressão coletiva contra interpretações persecutórias abusivas.

* **Causas Especiais de Aumento de Pena e Perda de Cargo Público**:
  O art. 359-U do Código Penal estabelece causas de aumento de pena de metade se o crime for cometido com violência ou grave ameaça exercida com arma de fogo, ou por militar ou funcionário público, acarretando ainda, como efeito extrapenal obrigatório da condenação transitada em julgado, a perda do cargo, função pública ou mandato eletivo exercido pelo agente infrator.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Concurso Formal Impróprio com Desígnios Autônomos (Jurisprudência do STF)",
        author: "Plenário do STF nos Julgamentos dos Atos Antidemocráticos",
        thesis: "Abolição violenta e golpe de estado praticados mediante unidade de desígnios concorrem na forma material ou formal imprópria, cumulando-se as penas.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Princípio da Consunção / Subsidiariedade",
        author: "Doutrina Penal Garantista",
        thesis: "O crime de golpe de estado deveria absorver a abolição violenta do Estado de Direito por constituir fase de execução mais gravosa de uma mesma conduta.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "INAPLICABILIDADE DA TENTATIVA: Por se tratarem de crimes de atentado ou de empreendimento, a própria conduta tentada já é punida com a pena do crime consumado.",
      "IMUNIDADE PARLAMENTAR INOPONÍVEL: A imunidade material do art. 53 da CF não resguarda manifestações que incitem golpe de estado, intervenção militar ou atentados armados contra os Três Poderes.",
      "COMPETÊNCIA DA JUSTIÇA FEDERAL: Os crimes contra o Estado Democrático de Direito afetam diretamente bens e serviços da União, sendo de competência da Justiça Federal (art. 109, IV da CF).",
      "PROTEÇÃO À MANIFESTAÇÃO CRÍTICA: O art. 359-T ressalva expressamente que não constitui crime a manifestação crítica a poderes constitucionais ou reivindicação de direitos por movimentos sociais."
    ],
    careerNuances: {
      AGU: "Atuação proativa na defesa da integridade dos edifícios sedes dos Três Poderes e ajuizamento de ações de responsabilidade civil para bloqueio de bens dos financiadores de atos antidemocráticos.",
      PGFN: "Rastreamento e bloqueio financeiro de recursos utilizados em apoio a condutas subversivas contra o Estado Democrático.",
      MPE: "Atuação preventiva e repressiva no âmbito estadual para coibir articulações extremistas que atentem contra a estabilidade democrática regional."
    }
  },

  // =========================================================================
  // 21. CADEIA DE CUSTÓDIA E TEORIA DA PROVA PENAL (DIREITO PROCESSUAL PENAL - LOTE B FUC)
  // =========================================================================
  {
    id: "fuc-processopenal-provas-cadeia-custodia",
    themeKeywords: [
      "cadeia de custódia", "cadeia de custodia", "art. 158-a", "etapas da cadeia de custódia",
      "prova ilícita", "frutos da árvore envenenada", "busca e apreensão", "busca pessoal",
      "rhc 158.580", "prova pericial", "corpo de delito"
    ],
    discipline: "DIREITO PROCESSUAL PENAL",
    title: "Cadeia de Custódia da Prova e Teoria Geral da Ilicitude Probatória no CPP",
    coreDoctrine: `#### 📚 Cadeia de Custódia, Busca e Apreensão e Teoria das Provas Ilícitas

* **Cadeia de Custódia das Provas (Arts. 158-A a 158-F do CPP - Lei 13.964/2019)**:
  Conjunto de procedimentos para documentar a cronologia do vestígio (reconhecimento, isolamento, fixação, coleta, acondicionamento, transporte, recebimento, processamento, armazenamento e descarte). O STJ pacificou que a eventual irregularidade na cadeia de custódia não conduz à nulidade automática imediata, devendo o magistrado dosar o grau de confiabilidade e valor probatório em contraditório.

* **Busca Pessoal, Domiciliar e Teoria dos Frutos da Árvore Envenenada**:
  A busca pessoal (art. 240, § 2º do CPP) exige fundada e objetiva suspeita prévia baseada em elementos concretos, vedada a revista fundada em tirocínio policial genérico (STJ RHC 158.580/BA). A inviolabilidade domiciliar (art. 5º, XI da CF e STF Tema 280) exige justa causa justificada previamente. Provas obtidas com violação de normas constitucionais são inadmissíveis (art. 157 do CPP), contaminando as derivadas (frutos da árvore envenenada), ressalvadas fontes independentes.

* **Provas Digitais, Extração de Dados Telefônicos e Interceptação Telefônica**:
  A jurisprudência qualificada do STF e STJ assentou que o acesso aos dados e conversas armazenados em aplicativos de mensagens instantâneas (como WhatsApp e Telegram) em aparelhos celulares apreendidos durante flagrante exige prévia e fundamentada autorização judicial, sendo ilícita a devassa direta efetuada pela autoridade policial sem ordem do juiz competente (Tema 977 do STF). A interceptação telefônica e telemática rege-se pela Lei 9.296/1996, constituindo meio extraordinário de obtenção de prova admitido unicamente quando indispensável para elucidação de infrações punidas com pena de reclusão e insuscetível de apuração por outros meios probatórios ordinários disponíveis.

* **Infiltração de Agentes Policiais e Ação Controlada (Lei nº 12.850/2013)**:
  Como meios extraordinários de obtenção de prova em organizações criminosas, a infiltração de policiais em ambiente físico ou virtual (arts. 10 a 14) exige autorização judicial prévia, fundamentada e com prazo determinado, devendo o agente policial infiltrado atuar estritamente dentro dos limites da legalidade e da proporcionalidade, vedada a provocação criminosa que configure flagrante preparado (Súmula 145 do STF).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Quebra da Cadeia como Vício de Valoração e Não Nulidade Automática (STJ)",
        author: "3ª Seção do STJ (Precedente Vinculante)",
        thesis: "A violação da cadeia de custódia repercute na idoneidade e força probante do vestígio, não gerando nulidade automática sem demonstração de prejuízo.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Ilicitude Derivada com Desentranhamento Obrigatório",
        author: "Doutrina Processual Penal Garantista",
        thesis: "A adulteração ou ausência de registro formal de qualquer etapa da cadeia de custódia fulmina a prova com a pecha da ilicitude material insuperável.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "ORDEM DAS 10 ETAPAS DA CADEIA: As bancas (especialmente CEBRASPE e FGV) invertem a ordem lógica entre isolamento, fixação e coleta dos vestígios.",
      "BUSCA PESSOAL EXIGE FUNDADA SUSPEITA OBJETIVA: O STJ pacificou no RHC 158.580/BA que impressões subjetivas dos policiais militares não autorizam busca pessoal sem mandado.",
      "PROVA ILÍCITA POR DERIVAÇÃO: As provas derivadas das ilícitas são inadmissíveis (art. 157, § 1º do CPP), ressalvadas a fonte independente e a descoberta inevitável.",
      "VEDAÇÃO AO ARQUIVAMENTO PELO JUIZ: O magistrado não pode arquivar inquérito de ofício, sob pena de violação estrutural ao sistema acusatório (art. 3º-A do CPP)."
    ],
    careerNuances: {
      AGU: "Defesa dos laudos emitidos pelos órgãos periciais da Polícia Federal em ações penais e cíveis perante a Justiça Federal.",
      PGFN: "Utilização de provas obtidas em apreensões fiscais com estrita observância da cadeia documental para instrução de execuções e ações cautelares fiscais.",
      MPE: "Atuação intransigente na fiscalização do correto acondicionamento de vestígios por peritos e policiais nos Institutos Médicos Legais e de Criminalística."
    }
  },

  // =========================================================================
  // 22. NULIDADES, RECURSOS E HABEAS CORPUS (DIREITO PROCESSUAL PENAL - LOTE B FUC)
  // =========================================================================
  {
    id: "fuc-processopenal-nulidades-recursos-hc",
    themeKeywords: [
      "nulidades no processo penal", "pas de nullité sans grief", "art. 563",
      "recurso em sentido estrito", "rese", "apelação criminal", "habeas corpus",
      "súmula vinculante 14", "revisão criminal", "recurso especial criminal"
    ],
    discipline: "DIREITO PROCESSUAL PENAL",
    title: "Sistema de Nulidades, Recursos Criminais e Habeas Corpus",
    coreDoctrine: `#### 📚 Sistema de Nulidades, Recursos Criminais e Habeas Corpus

* **Princípio do Pas de Nullité Sans Grief (Art. 563 do CPP)**:
  O sistema das nulidades processuais penais exige a demonstração de prejuízo concreto (pas de nullité sans grief), entendimento estendido pelo STF e STJ inclusive a hipóteses de nulidades absolutas para preservar a estabilidade da persecução criminal e a razoável duração do processo.
  No sistema recursal penal, destacam-se a apelação (art. 593 do CPP) e o Recurso em Sentido Estrito (RESE, art. 581 do CPP, rol taxativo mitigado).

* **Garantia Constitucional do Habeas Corpus (Art. 5º, LXVIII da CF)**:
  O Habeas Corpus visa à tutela imediata da liberdade de locomoção contra ilegalidade ou abuso de poder. Exige prova pré-constituída inequívoca do constrangimento ilegal, sendo incabível dilação probatória na via estreita do remédio heroico. Não cabe habeas corpus contra pena exclusivamente de multa (Súmula 693 STF) nem contra perda de função pública.

* **Competência Penal Originária, Recursos aos Tribunais Superiores e Revisão Criminal**:
  A fixação da competência penal no CPP orienta-se pelo lugar de consumação da infração (ratione loci, art. 70) e pela conexão e continência (arts. 76 a 82). A apelação no processo penal tem devolução ampla (art. 593), vigorando o princípio da vedação da reformatio in pejus em recurso exclusivo da defesa (art. 617). O Recurso Especial perante o STJ e o Recurso Extraordinário perante o STF no âmbito penal exigem esgotamento das instâncias ordinárias e prequestionamento explícito, sendo incabível o reexame de matéria fático-probatória (Súmula 7 do STJ e Súmula 279 do STF). A revisão criminal (art. 621) opera como ação autônoma rescisória penal pro reo cabível a qualquer tempo após o trânsito em julgado.

* **Embargos Infringentes e de Nulidade e Reclamação Constitucional**:
  No processo penal, os embargos infringentes e de nulidade (art. 609, parágrafo único do CPP) são recurso exclusivo da defesa contra acórdãos não unânimes proferidos em apelação ou recurso em sentido estrito desfavoráveis ao réu. A reclamação constitucional perante o STF e STJ visa a preservar a competência do tribunal e garantir a autoridade de suas decisões vinculantes e súmulas vinculantes violadas.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Exigência Universal de Demonstração de Prejuízo (STF e STJ)",
        author: "Plenário do STF e Corte Especial do STJ",
        thesis: "O princípio pas de nullité sans grief aplica-se a todas as nulidades, inclusive absolutas, sendo inadmissível o reconhecimento sem prejuízo real.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Presunção Absoluta de Prejuízo nas Nulidades Constitucionais",
        author: "Corrente Clássica da Dogmática Processual",
        thesis: "Vícios que afrontem diretamente o devido processo legal e o juiz natural dispensariam qualquer prova do prejuízo, operando de pleno direito.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "NÃO CABE RESE CONTRA RECEBIMENTO DE DENÚNCIA: Cabe RESE contra a decisão que rejeita a denúncia (art. 581, I), mas NÃO cabe recurso algum contra a decisão que a recebe.",
      "APELAÇÃO NO TRIBUNAL DO JÚRI É VINCULADA: A apelação no júri limita-se estritamente aos motivos invocados na petição de interposição (Súmula 713 do STF).",
      "SV 14 NÃO ALCANÇA DILIGÊNCIAS EM ANDAMENTO: A Súmula Vinculante 14 garante acesso apenas aos elementos já formalmente documentados nos autos, preservando o sigilo de investigações em curso.",
      "VEDAÇÃO A REFORMATIO IN PEJUS: Em recurso exclusivo da defesa é absolutamente vedado ao tribunal piorar a situação do réu, inclusive em matéria de pena e regime inicial."
    ],
    careerNuances: {
      AGU: "Defesa técnica de servidores e autoridades públicas federais que figuram como pacientes ou autoridades coatoras em remédios constitucionais.",
      PGFN: "Atuação no combate a habeas corpus impetrados para trancar ações penais por crimes contra a ordem tributária quando houver débito consolidado.",
      MPE: "Atuação no Tribunal de Justiça sustentando a manutenção de condenações válidas e combatendo nulidades formais sem demonstração de prejuízo."
    }
  },

  // =========================================================================
  // 23. ORGANIZAÇÕES CRIMINOSAS E COLABORAÇÃO PREMIADA (LEGISLAÇÃO PENAL ESPECIAL - LOTE B FUC)
  // =========================================================================
  {
    id: "fuc-especial-orcrim-colaboracao-premiada",
    themeKeywords: [
      "organizações criminosas", "orcrim", "lei 12.850", "colaboração premiada",
      "delação premiada", "infiltração de agentes", "ação controlada",
      "captação ambiental", "adi 5508", "meios de obtenção de prova"
    ],
    discipline: "LEGISLAÇÃO PENAL ESPECIAL",
    title: "Organizações Criminosas, Meios Extraordinários de Prova e Colaboração Premiada",
    coreDoctrine: "A Lei 12.850/2013 revolucionou a repressão ao crime organizado ao conceituar organização criminosa (associação de 4 ou mais pessoas estruturalmente ordenada, caracterizada pela divisão de tarefas, com objetivo de obter vantagem ilícita mediante crimes com pena máxima superior a 4 anos ou de caráter transnacional) e tipificar o crime autônomo de integrar organização criminosa (art. 2º).\n\nA colaboração premiada foi consolidada como meio de obtenção de prova e negócio jurídico processual personalíssimo entre o Estado e o colaborador. Nos termos do art. 4º, § 16, introduzido pelo Pacote Anticrime, nenhuma medida cautelar e nenhuma sentença condenatória poderá ser proferida unicamente com base nas declarações do colaborador desprovidas de elementos de corroboração externos.\n\nO Supremo Tribunal Federal, ao julgar a ADI 5508, consagrou a constitucionalidade da celebração de acordos de colaboração premiada diretamente pela autoridade policial, devendo o Ministério Público se manifestar previamente, cabendo a decisão final de homologação com exclusividade ao Poder Judiciário.",
    divergentCurrents: {
      firstCurrent: {
        name: "Legitimidade Concorrente do Delegado para Acordo (STF ADI 5508)",
        author: "Plenário do STF (Rel. Min. Marco Aurélio)",
        thesis: "O Delegado de Polícia pode celebrar acordo de colaboração na fase do inquérito, com manifestação prévia do Ministério Público sem poder de veto.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Monopólio Exclusivo do Ministério Público",
        author: "Doutrina Ministerial e PGR",
        thesis: "Por ser o titular exclusivo da ação penal pública (art. 129, I da CF), apenas o Ministério Público teria legitimidade para transigir benefícios premiais.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "NÚMERO DE INTEGRANTES NA ORCRIM: A Lei 12.850/13 exige quatro ou mais pessoas. Não confundir com associação criminosa (três ou mais) ou associação para o tráfico (duas ou mais).",
      "DELAÇÃO ISOLADA NÃO CONDENA: As palavras do delator jamais podem justificar sozinhas decreto condenatório ou medidas cautelares sem provas independentes de corroboração.",
      "IMPUGNAÇÃO POR CORRÉU DELATADO: O delatado não detém legitimidade para impugnar os termos do acordo de colaboração celebrado por terceiro (res inter alios acta).",
      "AÇÃO CONTROLADA EXIGE COMUNICAÇÃO PRÉVIA: A ação controlada da Lei 12.850 dispensa autorização judicial prévia, exigindo apenas comunicação ao juiz competente (diferente da Lei de Drogas)."
    ],
    careerNuances: {
      AGU: "Coordenação com a CGU na celebração de acordos de leniência da Lei 12.846/13 articulados com termos de colaboração premiada de réus federais.",
      PGFN: "Recuperação de ativos desviados por organizações criminosas e repatriação de capitais mantidos em paraísos fiscais.",
      MPE: "Atuação na linha de frente dos Grupos de Atuação Especial de Combate ao Crime Organizado (GAECO), negociando termos de colaboração premiada com devolução de valores."
    }
  },

  // =========================================================================
  // 24. ESCOLAS CRIMINOLÓGICAS, MODELOS TEÓRICOS E VITIMOLOGIA (CRIMINOLOGIA - LOTE B FUC)
  // =========================================================================
  {
    id: "fuc-criminologia-escolas-vitimologia",
    themeKeywords: [
      "criminologia", "escolas criminológicas", "escola clássica", "escola positiva",
      "beccaria", "lombroso", "labeling approach", "anomia", "vitimologia",
      "cifras da criminalidade", "prevenção criminal", "teorias do consenso e conflito"
    ],
    discipline: "CRIMINOLOGIA",
    title: "Evolução Histórica da Criminologia, Escolas Penais, Sociologia Criminal e Vitimologia",
    coreDoctrine: "A Criminologia é ciência empírica e interdisciplinar dedicada à análise quadridimensional do delito, do delinquente, da vítima e das instâncias de controle social formal e informal.\n\nSua evolução divide-se em marcos decisivos: a Escola Clássica (Cesare Beccaria e Francesco Carrara), que enxerga o criminoso como ser racional dotado de livre-arbítrio e prega penas proporcionais; a Escola Positiva (Cesare Lombroso, Enrico Ferri e Raffaele Garofalo), que substitui o livre-arbítrio pelo determinismo biológico e social, elegendo a periculosidade como fundamento da reação estatal; e a Sociologia Criminal, que se ramifica em Teorias do Consenso (Anomia de Durkheim/Merton, Associação Diferencial de Sutherland) e Teorias do Conflito (Labeling Approach de Becker e Criminologia Crítica).\n\nA Vitimologia, ciência autônoma fundada por Mendelsohn, classifica a vitimização em primária (impacto direto do crime), secundária ou sobrevitimização (sofrimento imposto pelas agências policiais e judiciais) e terciária (estigmatização do meio social). As cifras da criminalidade mapeiam a distância entre os delitos reais e os registrados (cifra negra, dourada, rosa e amarela).",
    divergentCurrents: {
      firstCurrent: {
        name: "Teorias do Conflito / Reação Social (Labeling Approach)",
        author: "Howard Becker e Edwin Lemert",
        thesis: "A criminalidade não é propriedade imanente da conduta, mas qualidade atribuída seletivamente pelas agências de controle aos grupos vulneráveis.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teorias do Consenso / Integração Funcional",
        author: "Robert Merton e Talcott Parsons",
        thesis: "A sociedade compartilha valores comuns e o crime decorre de disfunções e anomias temporárias que devem ser corrigidas pelo sistema formal.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "OBJETOS DA CRIMINOLOGIA: O estudo quadridimensional contemporâneo engloba: o Delito, o Delinquente, a Vítima e o Controle Social (não apenas os dois primeiros).",
      "REVITIMIZAÇÃO É VITIMIZAÇÃO SECUNDÁRIA: O sofrimento causado à vítima durante depoimentos em delegacias e julgamentos constitui vitimização secundária (não primária nem terciária).",
      "CIFRA DOURADA VS CIFRA NEGRA: Cifra dourada refere-se aos crimes de colarinho branco do poder econômico que não são investigados; cifra negra é a taxa geral de subnotificação.",
      "LIVRE-ARBÍTRIO É DA ESCOLA CLÁSSICA: A Escola Positiva NUNCA defendeu o livre-arbítrio; adotou o determinismo (biológico em Lombroso, sociológico em Ferri e psicológico em Garofalo)."
    ],
    careerNuances: {
      AGU: "Elaboração de pareceres fundamentados em criminologia empírica para fundamentar a constitucionalidade de políticas públicas federais de prevenção terciária.",
      PGFN: "Compreensão dos mecanismos da Cifra Dourada para aprimorar técnicas de rastreamento fiscal contra blindagens patrimoniais fraudulentas.",
      MPE: "Atendimento humanizado de vítimas nos Centros de Apoio Operacional (CAOPs), combate ostensivo à violência institucional e fomento à justiça restaurativa."
    }
  },

  // =========================================================================
  // 25. TERCEIRIZAÇÃO, PEJOTIZAÇÃO E RESPONSABILIDADE FAZENDÁRIA (DIREITO DO TRABALHO - LOTE C FUC)
  // =========================================================================
  {
    id: "fuc-trabalho-terceirizacao-pejotizacao-adpf324",
    themeKeywords: [
      "terceirização", "terceirizacao", "atividade-fim", "pejotização", "pejotizacao",
      "adpf 324", "tema 725", "súmula 331", "adc 16", "tema 246", "responsabilidade subsidiária",
      "culpa in vigilando", "art. 71 da lei 8.666"
    ],
    discipline: "DIREITO DO TRABALHO",
    title: "Terceirização de Atividades, Pejotização e Limites da Responsabilidade da Fazenda Pública",
    coreDoctrine: `#### 📚 Terceirização no Serviço Público, Direito Sindical e Prerrogativas Fazendárias

* **Regime Constitucional da Terceirização e Tema 246 do STF (ADC 16)**:
  A partir da ADPF 324 e Tema 725 do STF, é lícita a terceirização de qualquer atividade produtiva. No setor público, a responsabilidade da Fazenda Pública pelos encargos trabalhistas da empresa prestadora não decorre do mero inadimplemento contratual (art. 71, § 1º da Lei 8.666/93 e art. 121 da Lei 14.133/2021). No Tema 246 do STF (RE 760.931), assentou-se que a responsabilidade subsidiária do ente público somente se aperfeiçoa se demonstrada conduta culposa in vigilando efetiva e concreta na fiscalização contratual.

* **Direito Coletivo do Trabalho e Prerrogativas Processuais da Fazenda Pública**:
  O direito coletivo apoia-se na unicidade sindical territorial mínima (art. 8º da CF). Os acordos e convenções coletivas de trabalho prevalecem sobre a legislação nos termos do art. 611-A da CLT (STF Tema 1.046). Nas execuções trabalhistas contra a Fazenda Pública, aplicam-se com exclusividade as prerrogativas do rito dos precatórios e RPVs (art. 100 da CF) e intimação pessoal dos procuradores públicos.

* **Pejotização e Descaracterização do Vínculo de Emprego no STF**:
  O Supremo Tribunal Federal, em múltiplos precedentes vinculantes (Tema 725 da Repercussão Geral, ADPF 324 e RCL 53.899), pacificou a licitude de formas alternativas de contratação e divisão do trabalho, inclusive a prestação de serviços por pessoas jurídicas individuais ("pejotização") em contratos civis ou comerciais com profissionais qualificados e hipersuficientes, afastando o reconhecimento automático de vínculo empregatício celetista quando evidenciada a autonomia de vontade entre as partes e ausentes vícios de consentimento ou subordinação jurídica direta e pessoal.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Licitude Irrestrita da Terceirização e Ônus da Prova da Culpa Estatal (STF)",
        author: "Plenário do STF (ADPF 324, Tema 725 e Tema 246)",
        thesis: "A terceirização é ampla e irrestrita; a responsabilidade da Administração Pública exige prova cabal e concreta de culpa in vigilando.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Inversão do Ônus Probatório em Favor do Trabalhador",
        author: "Subseção I Especializada em Dissídios Individuais do TST (SDI-1)",
        thesis: "Caberiam à Administração os registros documentais da fiscalização, gerando presunção de culpa pela omissão na juntada das guias de recolhimento de FGTS.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "VEDAÇÃO À RESPONSABILIZAÇÃO OBJETIVA DO PODER PÚBLICO: A condenação da Fazenda Pública com base em presunção genérica ou responsabilidade objetiva afronta a autoridade da ADC 16 do STF e gera cabimento imediato de Reclamação Constitucional.",
      "PEJOTIZAÇÃO DE PROFISSIONAIS HIPERSUFICIENTES: O STF tem cassado sucessivas decisões da Justiça do Trabalho que reconhecem vínculo de emprego para médicos, advogados e executivos constituídos sob a forma de pessoa jurídica (pejotização lícita).",
      "SUBSIDIARIEDADE E NÃO SOLIDARIEDADE: A responsabilidade do tomador de serviços em caso de culpa comprovada é sempre subsidiária, jamais solidária.",
      "BENEFÍCIOS DA CATEGORIA PREPONDERANTE: Em terceirização lícita, o trabalhador terceirizado não tem direito a receber os mesmos salários e benefícios previstos em acordo coletivo da categoria profissional dos empregados da tomadora."
    ],
    careerNuances: {
      AGU: "Defesa intransigente da União e autarquias federais nas Varas do Trabalho, instruindo as contestações com os relatórios fiscais mensais para afastar de plano a culpa in vigilando e ajuizar Reclamação Constitucional no STF.",
      PGFN: "Cobrança regressiva contra empresas terceirizadas inadimplentes para reaver valores que a Fazenda Nacional foi compelida judicialmente a suportar.",
      MPE: "Fiscalização da legalidade dos contratos terceirizados nos órgãos municipais e estaduais para coibir a substituição fraudulenta de servidores públicos concursados por mão de obra terceirizada."
    }
  },

  // =========================================================================
  // 26. NEGOCIADO SOBRE O LEGISLADO E TEMA 1.046 DO STF (DIREITO COLETIVO DO TRABALHO - LOTE C FUC)
  // =========================================================================
  {
    id: "fuc-trabalho-negociado-sobre-legislado-1046",
    themeKeywords: [
      "negociado sobre o legislado", "art. 611-a", "art. 611-b", "tema 1.046", "stf",
      "convenção coletiva", "acordo coletivo", "autonomia da vontade coletiva",
      "direitos absolutamente indisponíveis", "presunção de comutatividade"
    ],
    discipline: "DIREITO COLETIVO DO TRABALHO",
    title: "Prevalência do Negociado sobre o Legislado e Limites Constitucionais da Negociação Coletiva",
    coreDoctrine: "O artigo 7º, XXVI da Constituição Federal consagra o reconhecimento das convenções e acordos coletivos de trabalho como garantia fundamental dos trabalhadores. Com o advento da Lei 13.467/2017 (Reforma Trabalhista), inseriram-se na CLT os arts. 611-A e 611-B, estabelecendo os parâmetros da prevalência do negociado sobre o legislado.\n\nAo julgar o Tema 1.046 da Repercussão Geral (ARE 1.121.633), o Supremo Tribunal Federal fixou tese histórica: são constitucionais os acordos e as convenções coletivos que pactuam limitações ou afastamentos de direitos trabalhistas, desde que respeitados os direitos absolutamente indisponíveis.\n\nO Pretório Excelso consolidou que as cláusulas normativas possuem presunção de adequação setorial e comutatividade: a renúncia ou transigência pontual de determinada vantagem encontra compensação no conjunto das condições de trabalho pactuadas, sendo vedado à Justiça do Trabalho imiscuir-se no equilíbrio econômico-jurídico da negociação autônoma.",
    divergentCurrents: {
      firstCurrent: {
        name: "Prevalência da Autonomia Sindical e Validade Ampla da Norma Coletiva (STF Tema 1.046)",
        author: "Plenário do STF (Rel. Min. Gilmar Mendes)",
        thesis: "Normas coletivas que limitam direitos não expressamente vedados na Constituição e no art. 611-B da CLT são válidas e vinculantes.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Princípio da Proteção e Indisponibilidade Relativa dos Direitos Laborais",
        author: "Corrente Majoritária Histórica da Magistratura do Trabalho e MPT",
        thesis: "A negociação coletiva não poderia suprimir direitos previstos em lei sem contrapartida expressa, específica e individualizada no instrumento normativo.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "DIREITOS DO ART. 611-B SÃO ABSOLUTAMENTE INDISPONÍVEIS: O art. 611-B traz rol taxativo de matérias que NÃO podem ser suprimidas por acordo ou convenção (ex: normas de saúde e segurança do trabalho, salário mínimo, seguro-desemprego, aviso prévio proporcional).",
      "PREVALÊNCIA DO ACORDO SOBRE A CONVENÇÃO: O art. 620 da CLT prevê que as condições estabelecidas em Acordo Coletivo de Trabalho SEMPRE prevalecerão sobre as estipuladas em Convenção Coletiva de Trabalho (critério da especificidade).",
      "VEDAÇÃO À ULTRATIVIDADE: O art. 614, § 3º da CLT veda expressamente a ultratividade das normas coletivas de trabalho.",
      "EXIGÊNCIA DE PARTICIPAÇÃO SINDICAL EM DISPENSA EM MASSA: O STF fixou no Tema 638 que a dispensa em massa de empregados exige prévia intervenção sindical, embora dispense acordo coletivo formal."
    ],
    careerNuances: {
      AGU: "Defesa dos acordos e convenções de empresas estatais federais (ex: Correios, Petrobras) perante o TST, assegurando a validade de cláusulas de flexibilização de jornada e benefícios.",
      PGFN: "Análise da repercussão fiscal e tributária de cláusulas coletivas de natureza indenizatória versando sobre auxílios e verbas rescisórias transacionadas.",
      MPE: "Atuação na promoção do diálogo social no âmbito local e mediação de conflitos coletivos de categorias de servidores públicos celetistas."
    }
  },

  // =========================================================================
  // 27. COMPETÊNCIA DA JUSTIÇA DO TRABALHO E SISTEMA RECURSAL (DIREITO PROCESSUAL DO TRABALHO - LOTE C FUC)
  // =========================================================================
  {
    id: "fuc-processotrabalho-competencia-114-recursos",
    themeKeywords: [
      "art. 114 da cf", "competência da justiça do trabalho", "adi 3395", "recursos trabalhistas",
      "recurso ordinário", "recurso de revista", "agravo de petição", "agravo de instrumento",
      "prazo de 8 dias", "depósito recursal", "transcendência no tst"
    ],
    discipline: "DIREITO PROCESSUAL DO TRABALHO",
    title: "Competência Constitucional da Justiça do Trabalho (Art. 114 da CF) e Teoria Geral dos Recursos Trabalhistas",
    coreDoctrine: `#### 📚 Competência da Justiça do Trabalho, Relações Estatutárias e Recursos

* **Competência Constitucional Material (Art. 114 da CF) e STF ADI 3395**:
  A EC 45/2004 ampliou a competência trabalhista para abranger as ações oriundas da relação de trabalho. No entanto, o Plenário do STF (ADI 3395-DF) pacificou que a Justiça do Trabalho é absolutamente incompetente para processar e julgar causas instauradas entre o Poder Público e servidores a ele vinculados por típica relação de ordem estatutária ou de caráter jurídico-administrativo (inclusive temporários do art. 37, IX da CF).
  Compete à Justiça do Trabalho processar e julgar dissídios individuais e coletivos, ações de indenização por dano moral decorrente da relação de trabalho e mandados de segurança contra atos de autoridades trabalhistas.

* **Organização Judiciária e Sistema Recursal Trabalhista**:
  A CLT adota a regra uniforme do prazo de 8 dias úteis para os principais recursos trabalhistas (Recurso Ordinário, Recurso de Revista, Agravo de Petição e Agravo de Instrumento), reservando 5 dias úteis para Embargos de Declaração. O Recurso de Revista perante o TST (art. 896-A da CLT) exige demonstração fundamentada do pressuposto da transcendência econômica, política, social ou jurídica.

* **Ações Possessórias, Direito de Greve e Dano Moral Coletivo**:
  Compete à Justiça do Trabalho processar e julgar os mandados de segurança, habeas corpus e habeas data quando o ato questionado envolver matéria sujeita à sua jurisdição (art. 114, IV da CF) e as ações que envolvam exercício do direito de greve (art. 114, II). O STF (Súmula Vinculante 23) assentou que a Justiça do Trabalho é competente para processar e julgar ação possessória ajuizada em decorrência do exercício do direito de greve pelos trabalhadores da iniciativa privada. Compete-lhe igualmente a apreciação de ações civis públicas ajuizadas pelo MPT para reparação de dano moral coletivo decorrente de violação a normas de saúde e segurança do trabalho.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Incompetência Absoluta para Regime Administrativo/Estatutário (STF ADI 3395)",
        author: "Plenário do STF",
        thesis: "A relação entre o Poder Público e servidores sob vínculo estatutário ou temporário do art. 37, IX da CF é de natureza administrativo-constitucional, atraindo a Justiça Comum.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Atração Trabalhista em Casos de Desvirtuamento da Contratação Temporária",
        author: "Jurisprudência Pretérita de Tribunais Regionais do Trabalho",
        thesis: "Contratos temporários nulos com sucessivas prorrogações ilegais convolar-se-iam em vínculo celetista sob competência da Justiça Laboral.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "COMPETÊNCIA PENAL É DA JUSTIÇA FEDERAL/ESTADUAL: A Justiça do Trabalho NÃO tem competência criminal, mesmo para crimes contra a organização do trabalho (art. 109, VI da CF atribui à Justiça Federal).",
      "PRAZO EM DIAS ÚTEIS: O art. 775 da CLT, reformado pela Lei 13.467/17, fixou a contagem de todos os prazos processuais exclusivamente em dias úteis.",
      "AGRAVO DE INSTRUMENTO TRABALHISTA NÃO REFORMA A DECISÃO: Diferente do CPC, no processo do trabalho o Agravo de Instrumento (art. 897, 'b') serve exclusivamente para destrancar recurso cujo seguimento foi negado.",
      "DEPÓSITO RECURSAL: Autarquias, fundações públicas e a União são dispensadas do depósito recursal e isentas de custas processuais (art. 790-A e art. 899, § 1º da CLT)."
    ],
    careerNuances: {
      AGU: "Suscitação sistemática de preliminar de incompetência absoluta da Justiça do Trabalho em ações de servidores públicos temporários ou agentes comunitários e postulação do não recolhimento de depósito recursal por expressa prerrogativa legal.",
      PGFN: "Atuação recursal perante o TST em matérias de execução fiscal das multas administrativas decorrentes da fiscalização do trabalho (art. 114, VII da CF).",
      MPE: "Atuação na defesa do patrimônio público perante a Justiça Estadual para declarar a nulidade de contratações de servidores sem concurso que burlaram as regras constitucionais."
    }
  },

  // =========================================================================
  // 28. EXECUÇÃO TRABALHISTA, DESCONSIDERAÇÃO DA PERSONALIDADE E PRESCRIÇÃO INTERCORRENTE (DIREITO PROCESSUAL DO TRABALHO - LOTE C FUC)
  // =========================================================================
  {
    id: "fuc-processotrabalho-execucao-desconsideracao",
    themeKeywords: [
      "execução trabalhista", "idpj", "incidente de desconsideração da personalidade jurídica",
      "art. 855-a", "prescrição intercorrente", "art. 11-a da clt", "responsabilidade do ex-sócio",
      "art. 10-a", "grupo econômico", "art. 2º da clt"
    ],
    discipline: "DIREITO PROCESSUAL DO TRABALHO",
    title: "Execução Trabalhista, Incidente de Desconsideração da Personalidade Jurídica (IDPJ) e Responsabilidade Societária",
    coreDoctrine: "A fase executória no Processo do Trabalho foi profundamente modificada pela Lei 13.467/2017. O artigo 878 da CLT retirou o impulso oficial irrestrito do juiz, fixando que a execução será promovida pelas partes, permitindo-se a iniciativa ex officio do magistrado tão somente nas hipóteses em que as partes não estiverem representadas por advogado.\n\nOutra inovação nodal foi a inserção da Prescrição Intercorrente no art. 11-A da CLT: ocorre a prescrição intercorrente no prazo de 2 (dois) anos quando o exequente deixar de cumprir determinação judicial no curso da execução. O marco inicial dessa contagem flui após expressa intimação judicial para cumprimento do ato.\n\nPara a constrição patrimonial de sócios e administradores, o art. 855-A da CLT instituiu a obrigatoriedade da instauração formal do Incidente de Desconsideração da Personalidade Jurídica (IDPJ), previsto nos arts. 133 a 137 do CPC, com contraditório prévio e suspensão do processo principal. No tocante ao ex-sócio (sócio retirante), o art. 10-A da CLT consagrou a ordem de preferência executiva: primeiro a empresa devedora, depois os sócios atuais e, por último, o sócio retirante em até 2 anos após a averbação da alteração contratual.",
    divergentCurrents: {
      firstCurrent: {
        name: "Observância Obrigatória do IDPJ e Limitação Temporal do Art. 10-A (Jurisprudência TST/STJ)",
        author: "Jurisprudência Atualizada dos Tribunais Superiores",
        thesis: "A execução de bens dos sócios exige instauração formal do IDPJ com contraditório prévio; o ex-sócio responde apenas em até 2 anos da averbação da saída.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria Menor Trabalhista e Desconsideração de Ofício",
        author: "Corrente Clássica da Dogmática Trabalhista",
        thesis: "O mero inadimplemento do débito alimentar trabalhista autorizaria a constrição imediata das contas de sócios sem prévia instauração de incidente formal.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "PRAZO DA PRESCRIÇÃO INTERCORRENTE TRABALHISTA É DE 2 ANOS: Não confundir o prazo de 2 anos do art. 11-A da CLT com o prazo quinquenal da execução cível ou fiscal.",
      "AGRAVO DE PETIÇÃO CONTRA DECISÃO DE IDPJ: Da decisão interlocutória que acolhe ou rejeita o IDPJ na fase executiva cabe de imediato Agravo de Petição (art. 855-A, § 1º, II da CLT).",
      "GRUPO ECONÔMICO EXIGE COMUNHÃO DE INTERESSES: A mera identidade de sócios não basta para a caracterização do grupo econômico, exigindo-se demonstração de interesse integrado e atuação conjunta (art. 2º, § 3º da CLT).",
      "ORDEM DE EXECUÇÃO DO SÓCIO RETIRANTE: O ex-sócio responde subsidiariamente e em terceiro lugar, apenas pelas obrigações trabalhistas relativas ao período em que figurou como sócio."
    ],
    careerNuances: {
      AGU: "Defesa dos bens de empresas públicas e entidades federais em execuções de terceirização, afastando o redirecionamento indevido de dívidas de prestadoras de serviços coligadas.",
      PGFN: "Ajuizamento de medidas cautelares fiscais articuladas com a desconsideração da personalidade jurídica para coibir grupos econômicos devedores contumazes de tributos e FGTS.",
      MPE: "Atuação perante as Varas de Falências e Recuperações Judiciais para fiscalizar os créditos trabalhistas habilitados no plano de liquidação e responsabilização de administradores."
    }
  },

  // =========================================================================
  // 29. REFORMA DA PREVIDÊNCIA (EC 103/2019), BENEFÍCIOS DO RGPS E EQUILÍBRIO ATUARIAL (DIREITO PREVIDENCIÁRIO - LOTE C FUC)
  // =========================================================================
  {
    id: "fuc-previdenciario-reforma-ec103-regras-transicao",
    themeKeywords: [
      "emenda constitucional 103", "reforma da previdência", "rgps", "regras de transição",
      "aposentadoria programada", "pedágio de 50%", "pedágio de 100%", "cálculo de benefício",
      "equilíbrio atuarial", "pensão por morte", "tema 1.102", "revisão da vida toda"
    ],
    discipline: "DIREITO PREVIDENCIÁRIO",
    title: "Reforma Constitucional da Previdência (EC 103/2019), Regras de Transição e Regime Geral (RGPS)",
    coreDoctrine: `#### 📚 Reforma da Previdência (EC 103/2019), Salário de Contribuição e Custeio

* **Reestruturação Estrutural da Previdência Social (EC 103/2019)**:
  A EC 103/2019 reformulou radicalmente o sistema previdenciário brasileiro para salvaguardar a sustentabilidade financeira e atuarial da Seguridade Social (art. 201 da CF). No RGPS, foram extintas as aposentadorias exclusivamente por tempo de contribuição, exigindo-se idade mínima conjugada com tempo de contribuição (65 anos homem e 62 anos mulher). Para os segurados já filiados, instituíram-se regras de transição (pontos, idade progressiva, pedágios de 50% e 100%).
  A base de cálculo dos benefícios considera 100% de todo o período contributivo desde julho de 1994. O Plenário do STF (ADIs 2110 e 2111) superou a Revisão da Vida Toda, consagrando a higidez das regras de transição originárias.

* **Salário de Contribuição, Financiamento da Seguridade e Previdência Complementar**:
  O salário de contribuição constitui a base de cálculo das contribuições previdenciárias dos segurados empregados, domésticos e avulsos (art. 28 da Lei 8.212/1991), submetido ao teto máximo fixado pelo RGPS. O PIS/PASEP e a COFINS financiam o seguro-desemprego, o abono salarial e a Seguridade Social (art. 239 da CF). O regime de previdência complementar fechado operado por fundos de pensão (LC 108 e 109/2001) rege-se pelo princípio da capitalização e autonomia contratual frente ao regime público obrigatório.

* **Equilíbrio Financeiro e Atuarial e Princípios da Seguridade Social**:
  O sistema previdenciário rege-se pelos princípios da universalidade da cobertura e do atendimento, uniformidade e equivalência dos benefícios e serviços às populações urbanas e rurais, seletividade e distributividade na prestação dos benefícios, irredutibilidade do valor dos benefícios, equidade na forma de participação no custeio, diversidade da base de financiamento e caráter democrático e descentralizado da administração (art. 194 da CF). A EC 103/2019 reforçou a exigência de prévia e suficiente fonte de custeio total para a criação, majoração ou extensão de qualquer benefício ou serviço da Seguridade Social (art. 195, § 5º da CF), sob pena de nulidade absoluta do ato legislativo instituidor.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Prevalência da Regra de Transição Legal e Inaplicabilidade da Revisão da Vida Toda (STF ADIs 2110 e 2111)",
        author: "Plenário do STF (Julgamento Histórico de 2024)",
        thesis: "O segurado não pode optar pela regra definitiva se a regra de transição for cogente, superando a tese do benefício mais vantajoso no Tema 1.102.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Direito ao Benefício Mais Vantajoso (Tema 1.102 STF Superado)",
        author: "Doutrina Previdenciarista e Decisão Anterior do STF",
        thesis: "O segurado filiado antes da Lei 9.876/99 teria o direito subjetivo de incluir no cálculo os salários de contribuição anteriores a 1994 quando mais favoráveis.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "ACUMULAÇÃO DE BENEFÍCIOS LIMITADA NA EC 103: A percepção simultânea de aposentadoria e pensão por morte é permitida, mas o benefício de menor valor sofre redução escalonada progressiva (art. 24 da EC 103/19).",
      "COTA DA PENSÃO POR MORTE NÃO É REVERSÍVEL: Com a cessação da cota de um dependente (ex: atingimento dos 21 anos do filho), o valor da sua cota extingue-se e não reverte para os demais pensionistas, salvo se houver dependente inválido.",
      "DESCARTE DE CONTRIBUIÇÕES PREJUDICIAIS: O segurado pode descartar contribuições que reduzam o valor da média, desde que mantido o tempo mínimo de carência exigido para a concessão.",
      "CONVERSÃO DE TEMPO ESPECIAL EM COMUM: É vedada a conversão de tempo especial em comum para o trabalho exercido após a entrada em vigor da EC 103/2019 (direito adquirido resguardado até 13/11/2019)."
    ],
    careerNuances: {
      AGU: "Defesa judicial do INSS em milhões de ações previdenciárias de concessão e revisão, sustentando a higidez atuarial do RGPS e a aplicação estrita do julgamento vinculante das ADIs 2110 e 2111 do STF.",
      PGFN: "Defesa e cobrança das contribuições previdenciárias patronais incidentes sobre folha de pagamento, com foco na higidez do custeio da Seguridade Social (art. 195 da CF).",
      MPE: "Fiscalização dos Regimes Próprios de Previdência Social (RPPS) dos municípios e estados, coibindo desvios em fundos de previdência de servidores locais e responsabilizando gestores."
    }
  },

  // =========================================================================
  // 30. MINISTÉRIO PÚBLICO DO TRABALHO (MPT), INQUÉRITO CIVIL E AÇÃO CIVIL PÚBLICA (REGIME JURÍDICO MPT - LOTE C FUC)
  // =========================================================================
  {
    id: "fuc-mpt-inquerito-civil-acao-civil-publica",
    themeKeywords: [
      "ministério público do trabalho", "mpt", "lc 75/1993", "inquérito civil trabalhista",
      "termo de ajustamento de conduta", "tac", "ação civil pública trabalhista",
      "trabalho escravo", "trabalho infantil", "meio ambiente do trabalho", "danos morais coletivos"
    ],
    discipline: "REGIME JURÍDICO DO MPT",
    title: "Estatuto do Ministério Público do Trabalho (LC 75/1993), Inquérito Civil, TAC e Defesa Coletiva",
    coreDoctrine: "O Ministério Público do Trabalho (MPT) constitui um dos quatro ramos do Ministério Público da União (MPU), regido pela Lei Complementar nº 75/1993, dotado de autonomia funcional, administrativa e financeira.\n\nSuas atribuições nucleares (arts. 83 e 84 da LC 75/93) concentram-se na promoção da ação civil pública no âmbito da Justiça do Trabalho para a defesa da ordem jurídica, do regime democrático e dos interesses sociais e individuais indisponíveis, com ênfase na erradicação do trabalho escravo e degradante, combate ao trabalho infantil, garantia do meio ambiente laboral equilibrado e tutela contra práticas discriminatórias.\n\nNo exercício de suas funções precípuas, o MPT preside o Inquérito Civil Trabalhista, procedimento administrativo inquisitorial e unilateral destinado a colher elementos de convicção para o ajuizamento da ACP ou para a celebração do Termo de Ajustamento de Conduta (TAC). O TAC trabalhista (art. 876 da CLT c/c art. 5º, § 6º da Lei 7.347/85) ostenta eficácia de título executivo extrajudicial líquido e certo, submetido à execução direta perante a Justiça Laboral em caso de descumprimento, com direcionamento das multas punitivas ao Fundo de Amparo ao Trabalhador (FAT).",
    divergentCurrents: {
      firstCurrent: {
        name: "Legitimidade Ampla do MPT para Direitos Individuais Homogêneos (STF e TST)",
        author: "Plenário do STF (Tema 470) e Súmula 378 do STJ",
        thesis: "O Ministério Público do Trabalho detém legitimidade ativa para ajuizar ACP em defesa de direitos individuais homogêneos com repercussão social relevante.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Ilegitimidade em Matéria de Direitos Individuais Disponíveis",
        author: "Doutrina Processual Restritiva",
        thesis: "O MPT não poderia atuar quando a lesão atingir direitos meramente divisíveis e patrimoniais disponíveis de trabalhadores determinados.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "MPT NÃO PODE INSTAURAR INQUÉRITO PENAL: O MPT é órgão trabalhista; caso constate a prática de crime (como trabalho em condições análogas às de escravo - art. 149 do CP), deve remeter peças ao MPF (Justiça Federal).",
      "DESTINAÇÃO DAS MULTAS DO TAC: As multas decorrentes de TACs e condenações em ACP do trabalho devem ser revertidas prioritariamente ao FAT ou a fundos e projetos sociais locais aprovados pelo juízo trabalhista.",
      "COMPETÊNCIA TERRITORIAL DA ACP TRABALHISTA: A competência da ACP trabalhista é do local do dano (art. 93 do CDC). Se o dano for de âmbito regional ou nacional, a competência fixa-se na capital do Estado ou no Distrito Federal.",
      "INEXISTÊNCIA DE HONORÁRIOS EM FAVOR DO MPT: É incabível a condenação da parte vencida em honorários advocatícios sucumbenciais em favor do Ministério Público em sede de Ação Civil Pública (art. 18 da Lei 7.347/85)."
    ],
    careerNuances: {
      AGU: "Atuação conciliatória perante o MPT e a JT para firmar compromissos institucionais de adequação sanitária e ergonômica em prédios de ministérios e repartições federais.",
      PGFN: "Articulação com o MPT no cumprimento de condenações trabalhistas de devedores de FGTS e na repressão a fraudes fiscais e trabalhistas corporativas.",
      MPE: "Atuação conjunta com o MPT em forças-tarefas estaduais de resgate de trabalhadores rurais e fiscalização de convênios municipais que utilizam mão de obra informal."
    }
  },

  // =========================================================================
  // 31. RESPONSABILIDADE CIVIL AMBIENTAL E RISCO INTEGRAL (DIREITO AMBIENTAL - LOTE D FUC)
  // =========================================================================
  {
    id: "fuc-ambiental-responsabilidade-civil-poluidor-pagador",
    themeKeywords: [
      "responsabilidade civil ambiental", "teoria do risco integral", "poluidor-pagador",
      "súmula 623 do stj", "súmula 629 do stj", "súmula 652 do stj", "tema 707", "tema 999",
      "dano ambiental", "obrigação propter rem", "imprescritibilidade ambiental"
    ],
    discipline: "DIREITO AMBIENTAL",
    title: "Responsabilidade Civil Ambiental Objetiva sob a Teoria do Risco Integral e Princípio do Poluidor-Pagador",
    coreDoctrine: `#### 📚 Responsabilidade Civil Ambiental e Princípios

A responsabilidade civil por dano ambiental consagra a modalidade objetiva fundamentada na Teoria do Risco Integral (art. 225, § 3º da CF e art. 14, § 1º da Lei 6.938/1981), não se admitindo a invocação de excludentes de nexo de causalidade como o fato de terceiro, caso fortuito ou força maior.\n\nA jurisprudência consolidada do Superior Tribunal de Justiça assentou enunciados sumulares determinantes: as obrigações ambientais possuem natureza propter rem, respondendo o adquirente pela degradação mesmo que ocorrida antes de sua posse (Súmula 623); é cabível a cumulação de obrigação de fazer ou não fazer (reparação in natura) com indenização pecuniária compensatória pelo dano residual (Súmula 629); e a responsabilidade do Estado por omissão no dever de fiscalizar é de caráter solidário, porém com execução subsidiária (Súmula 652 e Tema 707).\n\nNo âmbito do Supremo Tribunal Federal, fixou-se com repercussão geral (Tema 999 / RE 654.833) a tese vinculante de que a pretensão reparatória civil por danos causados ao meio ambiente é materialmente imprescritível, em face da titularidade transindividual e intergeracional do bem jurídico ecológico tutelado.

* **Princípios Estruturantes do Direito Ambiental**:
  1. **Princípio do Poluidor-Pagador (Internalização das Externalidades)**: O degradador deve suportar integralmente os custos da prevenção, mitigação e reparação dos danos ecológicos provocados por sua atividade.
  2. **Princípio da Prevenção**: Incide perante riscos ambientais cientificamente conhecidos e mensuráveis, impondo medidas prévias de contenção (ex.: licenças e EIA/RIMA).
  3. **Princípio da Precaução (In Dubio Pro Natura)**: Diante da incerteza científica sobre a gravidade ou irreversibilidade de potenciais danos ambientais, o Poder Público e os particulares devem abster-se ou adotar medidas protetivas rigorosas, invertendo-se o ônus probatório em desfavor do empreendedor (Súmula 618 do STJ).
  4. **Princípio da Proibição do Retrocesso Ecológico**: Veda a supressão injustificada de níveis de tutela e proteção ambiental já conquistados pela ordem jurídica.

* **Responsabilidade Tripartite por Dano Ambiental (Art. 225, § 3º da CF/88)**:
  * **Responsabilidade Civil**: Objetiva sob a Teoria do Risco Integral, sem admissão de excludentes, com imprescritibilidade da reparação patrimonial e ambiental (STF Tema 999).
  * **Responsabilidade Administrativa**: Subjetiva pura (STJ Tema 1038 e 1ª Seção). A aplicação de sanções administrativas (multas, embargos e demolições) exige demonstração de dolo ou culpa do infrator.
  * **Responsabilidade Penal**: É admitida a responsabilidade penal da pessoa jurídica por crimes ambientais (Lei 9.605/1998 e art. 225, § 3º da CF), assentando o STF (RE 548.181) a desnecessidade da teoria da dupla imputação (a pessoa jurídica pode ser processada e condenada criminalmente de forma autônoma, independentemente da responsabilização penal individual da pessoa física do dirigente).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria do Risco Integral e Imprescritibilidade Universal (STF e STJ)",
        author: "Plenário do STF (Tema 999) e 1ª Seção do STJ (Tema 707)",
        thesis: "A responsabilidade civil ambiental é objetiva pura por risco integral sem excludentes e a pretensão indenizatória é imprescritível.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria do Risco Criado com Admissão de Força Maior Absoluta",
        author: "Doutrina Civilista Tradicional Minoritária",
        thesis: "Deveriam admitir-se eventos naturais extraordinários e imprevisíveis como causas de rompimento do nexo de causalidade material.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "EXECUÇÃO DO ESTADO É SUBSIDIÁRIA: Embora a responsabilidade do Estado por dano ambiental decorrente de falha na fiscalização seja solidária, a execução do crédito é estritamente subsidiária, devendo primeiro excutir-se o patrimônio do poluidor direto (Súmula 652 do STJ).",
      "IMPREVIDÊNCIA DO POLUIDOR NÃO AFASTA NEXO: O fortuito interno ou externo não exime o degradador da obrigação integral de reparar e indenizar.",
      "CUMULAÇÃO DE OBRIGAÇÕES É PLENA: É vedado ao poluidor optar por pagar indenização em dinheiro se a regeneração natural da área degradada for tecnicamente viável (prioridade da restauração in natura).",
      "DANO MORAL COLETIVO AMBIENTAL: O STJ pacificou que a degradação ambiental intolerável gera dano moral coletivo in re ipsa, dispensando prova de sofrimento psíquico individual."
    ],
    careerNuances: {
      AGU: "Defesa dos órgãos ambientais federais (IBAMA e ICMBio) em ações civis públicas, demonstrando a ausência de inércia administrativa e invocando o benefício de ordem da subsidiariedade estatal estabelecido na Súmula 652 do STJ.",
      PGFN: "Cobrança e inscrição em Dívida Ativa da União das multas administrativas ambientais lavradas pelos órgãos federais de fiscalização com garantia de indisponibilidade de bens.",
      MPE: "Ajuizamento prioritário de ações civis públicas com pedidos de tutela provisória para cessação imediata de desmatamentos ilegais e exigência de recomposição de APPs com averbação de Reserva Legal."
    }
  },

  // =========================================================================
  // 32. LICENCIAMENTO AMBIENTAL E COMPETÊNCIAS FEDERATIVAS (DIREITO AMBIENTAL - LOTE D FUC)
  // =========================================================================
  {
    id: "fuc-ambiental-licenciamento-competencias-lc140",
    themeKeywords: [
      "licenciamento ambiental", "lei complementar 140", "competência comum ambiental",
      "art. 23 da cf", "ibama", "licença prévia", "licença de instalação", "licença de operação",
      "eia/rima", "adi 4713", "impacto local", "estudo de impacto ambiental"
    ],
    discipline: "DIREITO AMBIENTAL",
    title: "Licenciamento Ambiental, Competências Federativas da LC 140/2011 e Regime das Licenças",
    coreDoctrine: `#### 📚 Licenciamento Ambiental e SISNAMA

O artigo 23 da Constituição Federal estabelece a competência material comum da União, dos Estados, do Distrito Federal e dos Municípios para a proteção do meio ambiente e combate à poluição. Para regulamentar essa cooperação interfederativa e afastar conflitos de atribuições, editou-se a Lei Complementar nº 140/2011.\n\nA legislação fixou como premissa que o licenciamento ambiental deve ser conduzido por um único ente federativo, vedando-se a duplicidade de exigências licenciatórias. A competência originária do órgão federal (IBAMA) circunscreve-se a empreendimentos situados em terras indígenas, mar territorial, plataforma continental, zona econômica exclusiva, que cruzem limites territoriais de dois ou mais Estados federados ou que envolvam energia nuclear. Aos Municípios compete licenciar atividades de impacto ambiental local conforme tipificação dos Conselhos Estaduais de Meio Ambiente, cabendo aos Estados a competência residual.\n\nNo julgamento da ADI 4713, o Supremo Tribunal Federal declarou inconstitucional o dispositivo da LC 140/11 que atribuía prevalência ao auto de infração do órgão licenciador sobre o auto do órgão fiscalizador originário, consagrando que o poder de polícia ambiental fiscalizatório é concorrente e irrenunciável de todos os entes federados.

* **O Sistema Nacional do Meio Ambiente (SISNAMA - Lei 6.938/1981)**:
  Estrutura integrada para gestão e proteção do meio ambiente brasileiro:
  * **Órgão Superior**: Conselho de Governo;
  * **Órgão Consultivo e Deliberativo**: Conselho Nacional do Meio Ambiente (CONAMA), competente para expedir resoluções e parâmetros técnicos vinculantes;
  * **Órgão Central**: Ministério do Meio Ambiente e Mudança do Clima (MMA);
  * **Órgãos Executores Federais**: Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA - fiscalização, controle e licenciamento federal) e Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio - gestão das Unidades de Conservação federais);
  * **Órgãos Seccionais e Locais**: Órgãos ambientais estaduais (OEMAs) e secretarias municipais de meio ambiente.

* **Procedimento Trifásico do Licenciamento Ambiental Ordinário**:
  1. **Licença Prévia (LP)**: Concedida na fase preliminar do planejamento, atesta a viabilidade ambiental e locacional do empreendimento, estabelecendo requisitos básicos e condicionantes.
  2. **Licença de Instalação (LI)**: Autoriza o início da construção e instalação da obra, de acordo com as especificações aprovadas nos planos ambientais.
  3. **Licença de Operação (LO)**: Autoriza o início efetivo da atividade operacional e comercial, após verificação in loco do cumprimento integral das condicionantes impostas nas licenças anteriores.
  * **Estudo Prévio de Impacto Ambiental e Relatório de Impacto Ambiental (EIA/RIMA)**: Exigência constitucional inafastável (art. 225, § 1º, IV da CF) para obras ou atividades potencialmente causadoras de significativa degradação ambiental, assegurada audiência pública obrigatória e publicidade irrestrita.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Licenciamento Monofásico Concentrado com Fiscalização Concorrente Ampla (STF ADI 4713)",
        author: "Plenário do STF",
        thesis: "O licenciamento ambiental é atribuído a um único ente federado, mas o poder de polícia de fiscalização e lavratura de multas pode ser exercido concorrentemente por qualquer ente.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Prevalência Absoluta do Órgão Licenciador em Matéria Sancionatória",
        author: "Redação Originária do art. 17, § 3º da LC 140/2011",
        thesis: "O auto de infração lavrado pelo ente licenciador deveria anular autos lavrados concorrentemente por outros entes sobre o mesmo fato.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "INEXISTÊNCIA DE APROVAÇÃO TÁCITA NO LICENCIAMENTO: O decurso dos prazos legais de análise sem manifestação conclusiva do órgão ambiental NÃO implica deferimento tácito da licença ambiental, autorizando apenas a atuação supletiva do ente superior.",
      "ORDEM TRIFÁSICA DO LICENCIAMENTO: A sequência legal e vinculante é: 1º Licença Prévia (fase preliminar de viabilidade e localização), 2º Licença de Instalação (autoriza o início das obras) e 3º Licença de Operação (autoriza o funcionamento após vistoria).",
      "VEDAÇÃO À DISPENSA DE EIA POR LEI ESTADUAL: Lei estadual não pode dispensar EIA/RIMA para atividades com potencial de degradação ambiental significativa elencadas em normas federais do CONAMA (ADI 1086 STF).",
      "AUDIÊNCIA PÚBLICA É OBRIGATÓRIA QUANDO REQUERIDA: Conforme Resolução CONAMA 09/87, a realização de audiência pública é obrigatória se requerida por 50 ou mais cidadãos, pelo Ministério Público ou por entidade legalmente constituída."
    ],
    careerNuances: {
      AGU: "Defesa judicial da higidez das licenças ambientais federais emitidas pelo IBAMA em obras estratégicas de infraestrutura nacional (portos, hidrelétricas, rodovias federais).",
      PGFN: "Atuação na validação jurídica de termos de conversão de multas ambientais federais em serviços de preservação e melhoria do meio ambiente.",
      MPE: "Atuação no controle externo dos atos de licenciamento ambiental expedidos por órgãos estaduais e secretarias municipais de meio ambiente com exigência rigorosa de EIA/RIMA."
    }
  },

  // =========================================================================
  // 33. MICROSSISTEMA DE PROCESSO COLETIVO E COISA JULGADA (DIREITOS DIFUSOS E COLETIVOS - LOTE D FUC)
  // =========================================================================
  {
    id: "fuc-difusos-processo-coletivo-coisa-julgada-tema1075",
    themeKeywords: [
      "microssistema processual coletivo", "ação civil pública", "lei 7.347/85", "cd",
      "coisa julgada coletiva", "tema 1.075", "art. 16 da lacp", "inconstitucionalidade",
      "legitimidade ativa", "litispendência coletiva", "transporte in utilibus"
    ],
    discipline: "DIREITOS DIFUSOS E COLETIVOS",
    title: "Microssistema de Processo Coletivo, Legitimidade Adequada e Coisa Julgada (Tema 1.075 STF)",
    coreDoctrine: "A tutela dos direitos transindividuais no Brasil apoia-se no conceito de Microssistema Processual Coletivo, integrado dialogicamente pela Lei da Ação Civil Pública (Lei 7.347/1985) e pelo Título III do Código de Defesa do Consumidor (Lei 8.078/1990), aplicando-se subsidiariamente o Código de Processo Civil naquilo em que não colidir com os princípios informadores da tutela coletiva.\n\nUm dos marcos jurisprudenciais mais expressivos da história do direito processual brasileiro ocorreu com o julgamento do Tema 1.075 da Repercussão Geral (RE 1.101.937) pelo Supremo Tribunal Federal, que declarou a inconstitucionalidade da redação do art. 16 da LACP conferida pela Lei 9.494/1997. O STF assentou que a coisa julgada coletiva não pode ser restringida aos limites da competência territorial do órgão prolator da decisão, operando erga omnes ou ultra partes em âmbito nacional ou regional de acordo com a extensão subjetiva e objetiva da lesão.\n\nNo regime da coisa julgada, consagra-se a eficácia secundum eventum probationis nos direitos difusos e coletivos (se improcedente por insuficiência de provas, nova demanda com novas provas é admissível) e a teoria do transporte in utilibus da coisa julgada favorável para as vítimas individuais (art. 103 do CDC). Não há litispendência entre ação coletiva e ações individuais (art. 104 do CDC), cabendo ao autor individual pedir a suspensão da sua demanda em até 30 dias após a ciência da ação coletiva para beneficiar-se dos efeitos da sentença coletiva.",
    divergentCurrents: {
      firstCurrent: {
        name: "Inconstitucionalidade da Restrição Territorial e Eficácia Nacional (STF Tema 1.075)",
        author: "Plenário do STF (Rel. Min. Alexandre de Moraes)",
        thesis: "A coisa julgada coletiva define-se pelo pedido e limites do dano, sendo inconstitucional a limitação por circunscrição do juiz sentenciante.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Restrição Territorial da Coisa Julgada à Comarca Prolatora",
        author: "Advocacia Pública Federal na vigência do antigo art. 16 da LACP",
        thesis: "A sentença coletiva deveria irradiar efeitos apenas nos limites territoriais da jurisdição do órgão prolator para evitar dispersão de efeitos.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "DEFENSORIA PÚBLICA TEM LEGITIMIDADE AMPLA: O STF pacificou no Tema 607 e ADI 3943 que a Defensoria Pública tem ampla legitimidade para ajuizar ACP para tutela de direitos difusos, coletivos e individuais homogêneos de vulneráveis, dispensando comprovação de hipossuficiência de todos os membros.",
      "NÃO HÁ LITISPENDÊNCIA ENTRE AÇÃO COLETIVA E INDIVIDUAL: O art. 104 do CDC afasta litispendência entre a ação coletiva e individual; o autor individual só se beneficia da procedência da ACP se requerer a suspensão tempestiva de sua ação individual.",
      "EXECUÇÃO COLETIVA FLUID RECOVERY: A indenização genérica por danos difusos que não puder ser individualizada pelas vítimas no prazo de um ano reverte para o Fundo de Defesa dos Direitos Difusos (art. 100 do CDC).",
      "REQUISITO DA PERTINÊNCIA TEMÁTICA E PRÉ-CONSTITUIÇÃO: Associações civis exigem pré-constituição de ao menos 1 ano e pertinência temática estatutária para ajuizar ACP (art. 5º, V da LACP)."
    ],
    careerNuances: {
      AGU: "Defesa dos atos normativos de agências reguladoras federais (ANVISA, ANATEL, ANS) atacados em ações civis públicas, sustentando a presunção de legalidade e discricionariedade técnica regulatória.",
      PGFN: "Atuação perante os Tribunais Superiores para impedir o desvirtuamento da Ação Civil Pública quando utilizada como sucedâneo de ação tributária contra a Fazenda (vedação do art. 1º, parágrafo único da LACP).",
      MPE: "Atuação como dominus litis na propositura de ações civis públicas e termos de ajustamento de conduta na tutela da saúde pública, moralidade administrativa e meio ambiente urbano."
    }
  },

  // =========================================================================
  // 34. FATO E VÍCIO DO PRODUTO E TEORIA MENOR NO CDC (DIREITO DO CONSUMIDOR - LOTE D FUC)
  // =========================================================================
  {
    id: "fuc-consumidor-responsabilidade-fato-vicio-desconsideracao",
    themeKeywords: [
      "direito do consumidor", "código de defesa do consumidor", "fato do produto", "vício do produto",
      "acidente de consumo", "teoria menor da desconsideração", "art. 28 do cdc", "prazos decadenciais",
      "art. 26 do cdc", "art. 27 do cdc", "inversão do ônus da prova", "práticas abusivas"
    ],
    discipline: "DIREITO DO CONSUMIDOR",
    title: "Regime de Responsabilidade Civil no CDC: Fato vs Vício do Produto, Prazos e Teoria Menor",
    coreDoctrine: "O Código de Defesa do Consumidor (Lei 8.078/1990) estruturou a responsabilidade dos fornecedores sob duas categorias ontologicamente distintas: a responsabilidade por Fato do Produto ou do Serviço (defeito de segurança / acidente de consumo - arts. 12 a 17) e a responsabilidade por Vício do Produto ou do Serviço (defeito de adequação / quantidade ou qualidade - arts. 18 a 25).\n\nNo Fato do Produto, o defeito atinge a integridade psicofísica do consumidor ou de terceiros (bystanders - art. 17). O prazo prescricional é de 5 (cinco) anos (art. 27 do CDC), e a responsabilidade do fabricante, construtor e importador é direta e objetiva, ao passo que o comerciante responde apenas subsidiariamente nas hipóteses do art. 13 do CDC. No Vício do Produto, o defeito restringe-se à funcionalidade intrínseca da coisa sem risco à segurança. Os prazos são decadenciais: 30 dias para bens não duráveis e 90 dias para duráveis (art. 26), com prazo prévio legal de 30 dias para o fornecedor sanar o defeito (art. 18, § 1º).\n\nNo plano da constrição patrimonial, o art. 28, § 5º do CDC consagra a Teoria Menor da Desconsideração da Personalidade Jurídica: para atingir o patrimônio pessoal dos sócios e administradores, prescinde-se da prova de fraude ou confusão patrimonial (exigida na Teoria Maior do art. 50 do Código Civil), bastando a demonstração de insolvência ou que a personalidade societária constitua obstáculo ao ressarcimento dos prejuízos causados aos consumidores.",
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria Menor Pura no Direito do Consumidor (Jurisprudência Pacífica do STJ)",
        author: "Corte Especial e 2ª Seção do STJ",
        thesis: "A mera insolvência da sociedade fornecedora autoriza de plano a desconsideração da personalidade jurídica para satisfazer o crédito do consumidor.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Exigência de Ato Fraudulento ou Abuso de Gestão",
        author: "Doutrina Empresarialista Tradicional",
        thesis: "A aplicação da teoria menor sem prova de dolo ou desvio violaria o princípio da autonomia patrimonial societária consagrado na Lei de Liberdade Econômica.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "DEFEITO VS VÍCIO: Defeito gera acidente de consumo e prescreve em 5 anos; Vício gera inadequação do produto e decai em 30 ou 90 dias.",
      "BYSTANDER É CONSUMIDOR EQUIPARADO: Todas as pessoas que sofrem danos decorrentes do acidente de consumo são equiparadas a consumidores, ainda que jamais tenham adquirido o produto (art. 17 do CDC).",
      "TEORIA FINALISTA MITIGADA: O STJ adota a teoria finalista aprofundada ou mitigada: a pessoa jurídica que adquire produto para sua atividade econômica pode ser considerada consumidora se demonstrada vulnerabilidade fática, técnica ou informacional.",
      "VEDAÇÃO À DENUNCIAÇÃO DA LIDE NO FATO DO PRODUTO: É expressamente proibida a denunciação da lide nas ações de responsabilidade por fato do produto (art. 88 do CDC) para assegurar celeridade ao consumidor."
    ],
    careerNuances: {
      AGU: "Defesa dos órgãos reguladores de proteção ao consumidor em ações contra empresas concessionárias de serviços públicos federais (energia, telecomunicações e transporte aéreo).",
      PGFN: "Fiscalização e execução fiscal das multas cominatórias e administrativas aplicadas pelo PROCON e DPDC contra grandes fornecedores de serviços financeiros.",
      MPE: "Atuação no PROCON e Promotorias de Justiça do Consumidor contra fraudes em comércio eletrônico, publicidade enganosa, reajustes abusivos de planos de saúde e cláusulas contratuais leoninas."
    }
  },

  // =========================================================================
  // 35. SISTEMA SOCIOEDUCATIVO E ATO INFRACIONAL NO ECA (ECA - LOTE D FUC)
  // =========================================================================
  {
    id: "fuc-eca-atos-infracionais-medidas-socioeducativas",
    themeKeywords: [
      "estatuto da criança e do adolescente", "eca", "ato infracional", "medidas socioeducativas",
      "lei 8.069/90", "internação provisória de 45 dias", "limite de 3 anos de internação",
      "súmula 338 do stj", "súmula 108 do stj", "remição", "sinase", "lei 12.594"
    ],
    discipline: "ECA",
    title: "Apuração de Ato Infracional, Garantias Constitucionais e Medidas Socioeducativas no ECA",
    coreDoctrine: "O Estatuto da Criança e do Adolescente (Lei 8.069/1990) adota a Doutrina da Proteção Integral consagrada no art. 227 da Constituição Federal, superando o antigo modelo tutelar de situação irregular.\n\nConsidera-se ato infracional a conduta descrita como crime ou contravenção penal praticada por criança (menor de 12 anos) ou adolescente (entre 12 e 18 anos). À criança infratora aplicam-se exclusivamente medidas específicas de proteção (art. 101 do ECA). Ao adolescente autor de ato infracional podem ser impostas medidas socioeducativas (advertência, obrigação de reparar o dano, prestação de serviços à comunidade, liberdade assistida, semiliberdade e internação).\n\nA medida socioeducativa de internação constitui providência extrema e excepcional, informada pelos princípios da brevidade e excepcionalidade (art. 121). Seu cabimento é taxativo nos termos do art. 122 do ECA: ato cometido com grave ameaça ou violência à pessoa, reiteração no cometimento de outras infrações graves ou descumprimento injustificado de medida anterior. O prazo máximo de internação provisória é de 45 dias improrrogáveis; a internação definitiva não tem prazo pré-fixado, devendo ser reavaliada a cada 6 meses e jamais excedendo o teto improrrogável de 3 anos, ocorrendo a liberação compulsória e automática aos 21 anos de idade. Conforme Súmula 338 do STJ, a prescrição penal incide nas medidas socioeducativas.",
    divergentCurrents: {
      firstCurrent: {
        name: "Taxatividade Estrita do Art. 122 e Prescrição Penal Plena (STJ e STF)",
        author: "3ª Seção do STJ e Plenário do STF",
        thesis: "A internação é medida excepcionalíssima e não admite interpretação extensiva para abarcar atos sem violência; a prescrição penal é irrestrita.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Cabimento Ampliado em Razão da Gravidade Concreta do Tráfico de Drogas",
        author: "Jurisprudência Minoritária de Tribunais Estaduais",
        thesis: "O tráfico de entorpecentes, por sua hediondez equiparada, justificaria a decretação de internação mesmo sem violência direta à pessoa.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "TRÁFICO DE DROGAS NÃO JUSTIFICA INTERNAÇÃO: O STJ pacificou na Súmula 492 que o ato infracional análogo ao tráfico de drogas, por si só, não conduz à medida de internação, ante a ausência de violência ou grave ameaça.",
      "REITERAÇÃO EXIGE AO MENOS 3 ATOS GRAVES: Para configurar a hipótese do art. 122, II do ECA, a jurisprudência consolidada do STJ exige a prática de no mínimo três atos infracionais graves pretéritos com decisões definitivas.",
      "INTERNAÇÃO-SANÇÃO DURA NO MÁXIMO 3 MESES: A internação decorrente do descumprimento reiterado de medida anterior (art. 122, III) é transitória e não pode ultrapassar o período de 3 meses.",
      "VEDAÇÃO A ALGEMAS SEM FUNDAMENTAÇÃO: A Súmula Vinculante 11 do STF aplica-se com ainda maior rigor na condução e audiência de adolescentes infratores."
    ],
    careerNuances: {
      AGU: "Defesa dos parâmetros e normativas nacionais do Sistema Nacional de Atendimento Socioeducativo (SINASE - Lei 12.594/2012) expedidos pelo Ministério dos Direitos Humanos.",
      PGFN: "Destinação de recursos de fundos federais para estruturação das políticas de prevenção e proteção a menores em situação de vulnerabilidade extrema.",
      MPE: "Atuação exclusiva na condução do Procedimento de Apuração de Ato Infracional, fiscalização periódica dos estabelecimentos de internação (Fundação CASA, etc.) e tutela dos direitos de crianças e adolescentes."
    }
  },

  // =========================================================================
  // 36. CONTROLE DE CONVENCIONALIDADE E CORTE INTERAMERICANA (DIREITOS HUMANOS - LOTE D FUC)
  // =========================================================================
  {
    id: "fuc-dh-controle-convencionalidade-sistema-interamericano",
    themeKeywords: [
      "direitos humanos", "controle de convencionalidade", "pacto de san josé da costa rica",
      "corte idh", "comissão interamericana", "art. 5º da cf", "bloco de constitucionalidade",
      "status supralegal", "caso gomes lund", "caso vladimir herzog", "caso fazenda brasil verde"
    ],
    discipline: "DIREITOS HUMANOS",
    title: "Controle de Convencionalidade, Bloco de Constitucionalidade e Jurisprudência da Corte IDH",
    coreDoctrine: "O Direito Internacional dos Direitos Humanos opera no ordenamento jurídico pátrio por meio da Teoria do Duplo Controle de Compatibilidade Vertical: toda norma infraconstitucional deve submeter-se simultaneamente ao Controle de Constitucionalidade (compatibilidade com a Carta Magna) e ao Controle de Convencionalidade (compatibilidade com os Tratados Internacionais de Direitos Humanos ratificados pelo Estado brasileiro).\n\nA hierarquia normativa dos tratados internacionais de direitos humanos no Brasil divide-se em dois patamares fundamentais (STF RE 466.343 e art. 5º, §§ 2º e 3º da CF): tratados aprovados pelo rito qualificado das emendas constitucionais (2 turnos, 3/5 dos votos na Câmara e no Senado) integram o Bloco de Constitucionalidade com equivalência de Emenda Constitucional (ex: Tratado de Marraquexe e Convenção sobre os Direitos das Pessoas com Deficiência); tratados ratificados pelo rito ordinário (como o Pacto de San José da Costa Rica) possuem natureza supralegal, paralisando a eficácia de qualquer lei ordinária em sentido contrário (ex: Súmula Vinculante 25 que vedou a prisão civil do depositário infiel).\n\nNo plano jurisdicional internacional, o Brasil submeteu-se à jurisdição contenciosa da Corte Interamericana de Direitos Humanos em 1998. Suas sentenças condenatórias (ex: Caso Gomes Lund / Guerrilha do Araguaia, Caso Vladimir Herzog e Caso Fazenda Brasil Verde sobre trabalho escravo) possuem eficácia vinculante de título executivo judicial diretamente oponível à União, gerando a obrigação de investigar, punir graves violações e reparar as vítimas independentemente de prescrições ou anistias internas.",
    divergentCurrents: {
      firstCurrent: {
        name: "Controle de Convencionalidade Difuso e Obrigatório (Corte IDH e Jurisprudência)",
        author: "Corte Interamericana de Direitos Humanos (Caso Almonacid Arellano) e STF",
        thesis: "Todos os juízes e tribunais nacionais exercem de ofício o controle de convencionalidade, devendo deixar de aplicar normas internas que afrontem os tratados.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Soberania Nacional e Inoponibilidade da Decisão da Corte IDH sobre a Lei de Anistia",
        author: "Precedente Pretérito do STF na ADPF 153",
        thesis: "A Lei de Anistia de 1979 teria natureza de compromisso histórico com anistia bilateral e ampla, não podendo ser revista por corte internacional.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "QUÓRUM DE EMENDA É REQUISITO FORMAL: Apenas tratados aprovados por 3/5 em 2 turnos possuem status constitucional; os demais tratados de direitos humanos possuem status SUPRALEGAL, e tratados comuns (tributários/comerciais) possuem status de lei ordinária.",
      "CONTROLE DE CONVENCIONALIDADE É EX OFFICIO: O juiz de primeira instância tem o dever de realizar o controle de convencionalidade difuso de ofício, sem necessidade de provocação das partes.",
      "SENTENÇA DA CORTE IDH NÃO PRECISA DE HOMOLOGAÇÃO NO STJ: As sentenças condenatórias da Corte Interamericana de Direitos Humanos dispensam homologação perante o STJ, executando-se diretamente na Justiça Federal.",
      "INCIDENTE DE DESLOCAMENTO DE COMPETÊNCIA (IDC): O IDC (art. 109, § 5º da CF) só pode ser suscitado privativamente pelo Procurador-Geral da República perante o Superior Tribunal de Justiça em caso de grave violação a direitos humanos."
    ],
    careerNuances: {
      AGU: "Defesa do Estado brasileiro perante a Comissão e a Corte Interamericana de Direitos Humanos em Washington e San José, e cumprimento das decisões internacionais em coordenação com os Ministérios de Estado.",
      PGFN: "Atuação no pagamento tempestivo das indenizações pecuniárias fixadas em sentenças condenatórias da Corte IDH em face da República Federativa do Brasil.",
      MPE: "Atuação na aplicação imediata das diretrizes da Corte IDH em investigações criminais de violência policial, combate ao racismo estrutural e proteção a defensores de direitos humanos e comunidades quilombolas."
    }
  },

  // =========================================================================
  // 37. INELEGIBILIDADES E LEI DA FICHA LIMPA (DIREITO ELEITORAL - LOTE E FUC)
  // =========================================================================
  {
    id: "fuc-eleitoral-inelegibilidades-ficha-limpa-lc64",
    themeKeywords: [
      "direito eleitoral", "inelegibilidades", "lei da ficha limpa", "lc 135/2010", "lc 64/1990",
      "art. 14 da cf", "condenação por órgão colegiado", "rejeição de contas", "tcu", "tce",
      "prazo de 8 anos", "abuso do poder econômico", "desincompatibilização"
    ],
    discipline: "DIREITO ELEITORAL",
    title: "Inelegibilidades Constitucionais e Infraconstitucionais da LC 64/1990 c/c Lei da Ficha Limpa (LC 135/2010)",
    coreDoctrine: `#### 📚 Inelegibilidades e Desincompatibilização

O regime jurídico das inelegibilidades apoia-se no art. 14, § 9º da Constituição Federal, cuja finalidade precípua é proteger a probidade administrativa, a moralidade para o exercício do mandato e a normalidade e legitimidade das eleições contra a influência do poder econômico ou o abuso do exercício de funções públicas.\n\nA Lei Complementar nº 135/2010 (Lei da Ficha Limpa) alterou profundamente a Lei das Inelegibilidades (LC 64/1990), fixando causas impeditivas objetivas de elegibilidade. O Supremo Tribunal Federal, no histórico julgamento das ADCs 29 e 30 e ADI 4578, consagrou a constitucionalidade integral da Lei da Ficha Limpa, assentando que a inelegibilidade não tem natureza jurídica de pena, mas de requisito negativo de capacidade eleitoral passiva; por essa razão, a causa de inelegibilidade incide imediatamente sobre fatos pretéritos sem violar o princípio da irretroatividade ou da presunção de inocência.\n\nDestacam-se as hipóteses de inelegibilidade pelo prazo de 8 (oito) anos após o cumprimento da pena para condenações criminais proferidas por órgão judicial colegiado (art. 1º, I, 'e'), para cassações de mandatos parlamentares e para rejeição de contas públicas por improbidade administrativa insanável (art. 1º, I, 'g'). O STF assentou ainda no Tema 835 que o julgamento das contas de Prefeito, tanto as de governo quanto as de gestão, compete exclusivamente à Câmara Municipal, sendo o parecer do Tribunal de Contas meramente opinativo.

* **Prazos e Regime Jurídico da Desincompatibilização (LC nº 64/1990)**:
  A desincompatibilização é o ato pelo qual o cidadão se afasta temporária ou definitivamente do exercício de determinado cargo, emprego ou função pública a fim de afastar a causa de inelegibilidade e restabelecer a igualdade de oportunidades entre os concorrentes (art. 14, § 9º da CF).
  * **Prazos Gerais**:
    * **6 (seis) meses anteriores ao pleito**: Ministros de Estado, Secretários Estaduais e Municipais, Chefes da Casa Civil e dirigentes máximos de autarquias e estatais;
    * **4 (quatro) meses anteriores ao pleito**: Magistrados, membros do Ministério Público e defensores públicos;
    * **3 (três) meses anteriores ao pleito**: Servidores públicos em geral da administração direta e indireta. A licença concedida ao servidor público para atividade política assegura a percepção da remuneração integral do cargo efetivo durante o período de 3 meses.

* **Sistema Recursal no Direito Eleitoral**:
  Os recursos eleitorais rege-se pelos princípios da celeridade, irrecorribilidade em separado das decisões interlocutórias (preclusão com possibilidade de reiteração no recurso contra a decisão final) e efeito devolutivo ordinário.
  * O prazo geral para interposição de recursos perante a Justiça Eleitoral é de **3 (três) dias** (Código Eleitoral e Lei 9.504/1997).
  * Cabimento: Recurso Ordinário perante o TSE nas decisões dos TREs sobre inelegibilidade ou expedição de diplomas em eleições federais e estaduais (art. 121, § 4º, III da CF); e Recurso Especial Eleitoral em caso de divergência jurisprudencial ou violação direta de lei ou da Constituição.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Constitucionalidade e Incidência Imediata da Ficha Limpa (STF ADCs 29 e 30)",
        author: "Plenário do STF (Rel. Min. Luiz Fux)",
        thesis: "A inelegibilidade é regime protetivo da moralidade pública e não sanção penal, incidindo de pronto a partir de condenação colegiada.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Ofensa à Presunção de Não Culpabilidade sem Trânsito em Julgado",
        author: "Doutrina Penal Constitucional Garantista",
        thesis: "A privação da capacidade eleitoral passiva antes do trânsito em julgado material da condenação afrontaria o art. 5º, LVII da CF.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "JULGAMENTO DE CONTAS DE PREFEITO É DA CÂMARA MUNICIPAL: Compete com exclusividade à Câmara Municipal o julgamento das contas de governo e de gestão de Prefeito, exigindo-se quórum de 2/3 para derrubar o parecer do TCE/TCU (STF Tema 835).",
      "PRAZO DE 8 ANOS CONTA DO CUMPRIMENTO DA PENA: Na alínea 'e' da LC 64/90, o prazo de 8 anos de inelegibilidade tem início apenas após o cumprimento ou extinção da pena, e não da condenação colegiada.",
      "INELEGIBILIDADE REFLEXA ATÉ 2º GRAU: São inelegíveis no território de jurisdição do titular o cônjuge e os parentes consanguíneos ou afins até o segundo grau (art. 14, § 7º da CF e Súmula Vinculante 18).",
      "DISSOLUÇÃO DA SOCIEDADE CONJUGAL NÃO AFASTA INELEGIBILIDADE: A dissolução do casamento no curso do mandato NÃO afasta a inelegibilidade reflexa para o pleito subsequente (Súmula Vinculante 18)."
    ],
    careerNuances: {
      AGU: "Defesa dos acórdãos do Tribunal de Contas da União (TCU) atacados na Justiça Federal por candidatos que pretendem anular registros de contas rejeitadas para obter certidão de quitação eleitoral.",
      PGFN: "Representação fiscal para cobrança de multas eleitorais inscritas em Dívida Ativa da União e atuação na execução forçada de penalidades pecuniárias de campanhas eleitorais.",
      MPE: "Atuação no Ministério Público Eleitoral (promotores eleitorais designados) ajuizando Ações de Impugnação de Registro de Candidatura (AIRC) e Ações de Investigação Judicial Eleitoral (AIJE) contra abuso de poder político e compra de votos."
    }
  },

  // =========================================================================
  // 38. DEFENSORIA PÚBLICA, CUSTOS VULNERABILIS E AUTONOMIA (DEFENSORIA PÚBLICA - LOTE E FUC)
  // =========================================================================
  {
    id: "fuc-defensoria-custos-vulnerabilis-autonomia",
    themeKeywords: [
      "defensoria pública", "lc 80/1994", "emenda constitucional 80/2014", "custos vulnerabilis",
      "autonomia funcional", "legitimidade coletiva da defensoria", "tema 607", "adi 3943",
      "prazo em dobro", "intimação pessoal com vista"
    ],
    discipline: "DEFENSORIA PÚBLICA",
    title: "Estatuto Constitucional da Defensoria Pública (LC 80/1994), Intervenção como Custos Vulnerabilis e Autonomia",
    coreDoctrine: "A Defensoria Pública é concebida pelo art. 134 da Constituição Federal como instituição permanente, essencial à função jurisdicional do Estado, incumbindo-lhe fundamentalmente a orientação jurídica, a promoção dos direitos humanos e a defesa judicial e extrajudicial dos direitos individuais e coletivos, de forma integral e gratuita, aos necessitados.\n\nA Emenda Constitucional 80/2014 outorgou estatura constitucional expressa aos princípios institucionais da Defensoria (unidade, indivisibilidade e independência funcional) e assegurou às Defensorias Públicas da União, dos Estados e do Distrito Federal autonomia funcional, administrativa e iniciativa de sua proposta orçamentária, além de estabelecer a meta de universalização com a lotação de defensores em todas as comarcas do território nacional.\n\nNo plano processual coletivo, o Plenário do Supremo Tribunal Federal (Tema 607 e ADI 3943) assentou a ampla legitimidade da Defensoria Pública para ajuizar Ação Civil Pública na tutela de interesses difusos, coletivos e individuais homogêneos de vulneráveis, independente da situação socioeconômica de parte do grupo. Doutrinariamente, consolidou-se a intervenção da Defensoria como Custos Vulnerabilis (guardiã dos vulneráveis): intervenção autônoma e fiscalizatória em demandas estruturais, litígios possessórios coletivos e causas cíveis ou penais em que haja interesse jurídico de grupos socialmente hipervulneráveis.",
    divergentCurrents: {
      firstCurrent: {
        name: "Legitimidade Coletiva Ampla e Doutrina do Custos Vulnerabilis (STF e STJ)",
        author: "Plenário do STF (ADI 3943) e Corte Especial do STJ",
        thesis: "A Defensoria tem legitimação ampla para ACP e legitimidade institucional para intervir como custos vulnerabilis em favor de vulneráveis.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Legitimação Restrita a Hipossuficientes Econômicos Individuais",
        author: "Tese Histórica da Associação Nacional dos Membros do MP (CONAMP na ADI 3943)",
        thesis: "A Defensoria Pública deveria restringir sua atuação à assistência jurídica individual daqueles que comprovassem insuficiência de recursos financeiros.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "PRERROGATIVA DE PRAZO EM DOBRO E INTIMAÇÃO PESSOAL: A Defensoria Pública goza de prazo em dobro universal para todas as suas manifestações e intimação pessoal com remessa ou vista dos autos (art. 44, I da LC 80/94).",
      "NÃO EXIGE PROCURAÇÃO: O Defensor Público atua mediante simples nomeação nos autos ou indicação da Defensoria, dispensando a juntada de procuração (salvo poderes especiais de transigir ou confessar).",
      "INDEPENDÊNCIA FUNCIONAL DO MEMBRO: O Defensor Público exerce suas funções com plena autonomia técnica e independência funcional, não estando vinculado às diretrizes políticas do Defensor Público-Geral.",
      "PODER DE REQUISIÇÃO: A Defensoria possui prerrogativa de requisitar de autoridades públicas e agentes privados certidões, exames, perícias, documentos e informações necessárias ao exercício de suas funções institucionais."
    ],
    careerNuances: {
      AGU: "Atuação em conjunto com a Defensoria Pública da União (DPU) na formulação de soluções consensuais e câmaras de mediação de políticas públicas federais de saúde e habitação.",
      PGFN: "Celebração de acordos e transações de parcelamento facilitado em favor de pequenos produtores e devedores assistidos pela Defensoria Pública.",
      MPE: "Atuação harmônica com a Defensoria Estadual em audiências de custódia, ações possessórias multitudinárias e procedimentos de fiscalização do sistema penitenciário."
    }
  },

  // =========================================================================
  // 39. DIREITO PENAL MILITAR E COMPETÊNCIA DA JUSTIÇA MILITAR (DIREITO MILITAR - LOTE E FUC)
  // =========================================================================
  {
    id: "fuc-militar-crime-militar-competencia-art9",
    themeKeywords: [
      "direito penal militar", "cpm", "cppm", "crime militar em tempo de paz", "art. 9º do cpm",
      "lei 13.491/2017", "competência da justiça militar", "jmu", "jme", "crimes dolosos contra a vida",
      "tribunal do júri", "inquérito policial militar"
    ],
    discipline: "DIREITO MILITAR E PROCESSO PENAL MILITAR",
    title: "Direito Penal Militar: Conceito de Crime Militar em Tempo de Paz (Art. 9º do CPM c/c Lei 13.491/2017) e Jurisdição Militar",
    coreDoctrine: "O Direito Penal Militar e a jurisdição das Justiças Militares apoiam-se na preservação dos pilares constitucionais da hierarquia e da disciplina nas Forças Armadas e forças auxiliares (art. 42 e art. 142 da CF).\n\nA Lei nº 13.491/2017 operou a maior reforma histórica no Código Penal Militar (Decreto-Lei 1.001/1969) ao dar nova redação ao art. 9º, II. Anteriormente, consideravam-se crimes militares em tempo de paz apenas aqueles previstos no próprio CPM; a partir da reforma de 2017, qualquer crime previsto na legislação penal comum ou extravagante (ex: tortura, abuso de autoridade, crimes de trânsito, lavagem de capitais) passa a ser considerado crime militar por extensão quando praticado por militar em serviço, em local sob administração militar ou contra militar em serviço.\n\nQuanto à repartição de competências constitucionais: a Justiça Militar da União (art. 124 da CF) julga militares federais (Exército, Marinha e Aeronáutica) e civis que cometam crimes militares contra as Forças Armadas. Por outro lado, a Justiça Militar Estadual (art. 125, § 4º da CF) julga exclusivamente policiais militares e bombeiros militares estaduais, sendo absolutamente vedado o julgamento de civis na esfera militar estadual. Ademais, os crimes dolosos contra a vida praticados por militares contra civil competem com exclusividade ao Tribunal do Júri da Justiça Comum.",
    divergentCurrents: {
      firstCurrent: {
        name: "Ampliação dos Crimes Militares por Extensão (Lei 13.491/17 e Jurisprudência STF/STJ)",
        author: "Plenário do STF e 3ª Seção do STJ",
        thesis: "A redação do art. 9º, II atrai para a Justiça Militar qualquer crime da legislação extravagante se praticado nas situações funcionais do tipo militar.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Incompetência da Justiça Militar para Tipos Extravagantes Não Castrenses",
        author: "Doutrina Penal Garantista Minoritária",
        thesis: "A tipificação castrense deveria exigir conteúdo de ofensa funcional militar genuíno sob pena de expansão indevida do foro militar sobre matérias comuns.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "CIVIL NUNCA É JULGADO NA JUSTIÇA MILITAR ESTADUAL: É vedado à Justiça Militar Estadual processar e julgar civil, ainda que em coautoria com policial militar (art. 125, § 4º da CF e Súmula 53 do STJ).",
      "CRIME DOLOSO CONTRA A VIDA DE CIVIL É DO JÚRI: Crime doloso contra a vida de civil praticado por militar estadual compete privativamente ao Tribunal do Júri da Justiça Estadual Comum.",
      "MILITAR DAS FORÇAS ARMADAS E LEI 13.491: Para crimes dolosos contra a vida cometidos por militares das Forças Armadas em missões de GLO (Garantia da Lei e da Ordem), a competência é da Justiça Militar da União (art. 9º, § 2º do CPM).",
      "PRINCÍPIO DA INSIGNIFICÂNCIA MITIGADO: O Superior Tribunal Militar e o STF afastam a incidência do princípio da insignificância ao porte ou posse de drogas no interior de organizações militares (art. 290 do CPM)."
    ],
    careerNuances: {
      AGU: "Representação judicial da União e dos comandantes das Forças Armadas em mandados de segurança perante o Superior Tribunal Militar e na defesa da legalidade de atos disciplinares castrenses.",
      PGFN: "Execução fiscal de indenizações ao erário federal decorrentes de desvios e danos patrimoniais apurados em inquéritos policiais militares das três Forças.",
      MPE: "Atuação perante a Auditoria Militar Estadual (promotores de justiça militar) na fiscalização da atividade policial militar e persecução de abusos e crimes da tropa em serviço."
    }
  },

  // =========================================================================
  // 40. FILOSOFIA, SOCIOLOGIA E TEORIA DO DIREITO (FORMAÇÃO HUMANÍSTICA - LOTE E FUC)
  // =========================================================================
  {
    id: "fuc-humanistica-pos-positivismo-hermeneutica-dworkin-alexy",
    themeKeywords: [
      "formação humanística", "resolução 75 do cnj", "filosofia do direito", "sociologia do direito",
      "pós-positivismo", "robert alexy", "ronald dworkin", "teoria dos princípios", "ponderação",
      "resposta correta", "romance em cadeia", "ética judicial", "moralidade institucional"
    ],
    discipline: "FORMAÇÃO HUMANÍSTICA",
    title: "Formação Humanística: Pós-Positivismo, Teoria dos Princípios (Alexy), Integridade do Direito (Dworkin) e Ética Judicial",
    coreDoctrine: "A disciplina de Formação Humanística, institucionalizada pela Resolução nº 75/2009 do Conselho Nacional de Justiça (CNJ), é obrigatória em concursos da Magistratura e do Ministério Público, exigindo o domínio da Filosofia do Direito, Sociologia Jurídica, Psicologia Judiciária e Ética da Magistratura.\n\nNa evolução do pensamento jusfilosófico contemporâneo, consagra-se o Pós-Positivismo (ou Neoconstitucionalismo), que supera a dicotomia entre Jusnaturalismo e Positivismo Jurídico estrito kelseniano ao reconhecer a força normativa dos princípios constitucionais e a reaproximação entre Direito, Moral e Justiça.\n\nDestacam-se as duas maiores matrizes contemporâneas: a Teoria dos Direitos Fundamentais de Robert Alexy, que distingue regras (mandamentos de definição com aplicação tudo-ou-nada) e princípios (mandamentos de otimização aplicados por ponderação à luz da máxima da proporcionalidade); e o Direito como Integridade de Ronald Dworkin, que refuta a discricionariedade judicial em casos difíceis (hard cases), propondo que o magistrado deve atuar como o Juiz Hércules, buscando a única resposta correta através de uma interpretação construtiva que harmonize o caso concreto com a história institucional e os princípios morais substantivos da comunidade (Metáfora do Romance em Cadeia).",
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria dos Princípios e Ponderação Racional (Robert Alexy)",
        author: "Robert Alexy (Teoria dos Direitos Fundamentais)",
        thesis: "Conflitos entre princípios resolvem-se mediante fórmula de peso e proporcionalidade no caso concreto.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Direito como Integridade e Rejeição da Ponderação Discricionária (Ronald Dworkin)",
        author: "Ronald Dworkin (O Império do Direito)",
        thesis: "A ponderação geraria decisionismo arbitrário; o direito exige coerência histórica e fidelidade aos princípios fundamentais.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "REGRAS NÃO SÃO PONDERADAS: Conforme Alexy, conflitos entre regras resolvem-se pelos critérios tradicionais de antinomia (hierárquico, temporal e especialidade); a ponderação aplica-se exclusivamente a colisões entre princípios.",
      "SUBPRINCÍPIOS DA PROPORCIONALIDADE: A máxima da proporcionalidade de Alexy desdobra-se em 3 elementos sequenciais e cumulativos: Adequação, Necessidade e Proporcionalidade em Sentido Estrito.",
      "DWORKIN REJEITA DISCRICIONARIEDADE: Para Dworkin, o juiz nunca tem discricionariedade forte para criar direito novo em hard cases; existe sempre uma única resposta correta no sistema.",
      "CÓDIGO DE ÉTICA DA MAGISTRATURA DO CNJ: Veda ao magistrado manifestar opinião sobre processo pendente de julgamento ou expressar juízo depreciativo sobre decisões judiciais de colegas."
    ],
    careerNuances: {
      AGU: "Elaboração de manifestações e pareceres fundamentados na proporcionalidade e razoabilidade para sustentar a validade de escolhas trágicas alocativas em políticas públicas de saúde.",
      PGFN: "Aplicação da ética pública e ponderação dos princípios da capacidade contributiva e da segurança jurídica na edição de pareceres fiscais vinculantes.",
      MPE: "Fundamentação sociológica e axiológica nas manifestações em audiências públicas, mediação de conflitos multitudinários e respeito aos direitos fundamentais de minorias."
    }
  },

  // =========================================================================
  // 41. TRAUMATOLOGIA FORENSE, TANATOLOGIA E ASFIXIOLOGIA (MEDICINA LEGAL - LOTE E FUC)
  // =========================================================================
  {
    id: "fuc-medicina-legal-tanatologia-traumatologia-forense",
    themeKeywords: [
      "medicina legal", "traumatologia forense", "tanatologia", "cronotanatognose",
      "asfixiologia forense", "equimose", "ferida incisa", "projétil de arma de fogo",
      "sinal de benassi", "escoriação", "enforcamento", "estrangulamento", "esganadura"
    ],
    discipline: "MEDICINA LEGAL",
    title: "Medicina Legal: Traumatologia Forense, Cronotanatognose Cadavérica e Asfixiologia",
    coreDoctrine: "A Medicina Legal é a aplicação dos conhecimentos médicos e biológicos às necessidades do Direito e da Justiça na elucidação pericial de vestígios corporais e circunstâncias de crimes.\n\nNa Traumatologia Forense (estudo das lesões e energias mecânicas), as lesões classificam-se conforme o agente vulnerante: lesões contusas por ação contundente (escoriação, equimose, hematoma, bossa sanguínea e ferida contusa); lesões incisas por ação cortante (ferida incisa com cauda de escoriação orientada); lesões puntiformes por ação perfurante; e lesões pérfuro-contundentes causadas por projéteis de arma de fogo (PAF). No disparo de arma de fogo, o tiro encostado caracteriza-se pelo Sinal de Benassi (impregnação de fuligem na lâmina óssea) e Câmara de Mina de Hoffmann (descolamento gasoso sob o couro cabeludo); o tiro a curta distância exibe zona de tatuagem (grânulos de pólvora incombusta incrustados na derme) e zona de esfumaçamento; o tiro a distância apresenta tão somente orla de escoriação e orla de enxugo.\n\nNa Tanatologia e Cronotanatognose, a determinação do momento da morte apoia-se em fenômenos abióticos consecutivos: rigidez cadavérica (Lei de Nysten-Sommer: crânio-caudal com generalização em 8 a 12 horas e resolução em 24 a 36 horas); e manchas de hipóstase (livedos cadavéricos: surgem em 2 a 3 horas e tornam-se indelevelmente fixos após 8 a 12 horas).\n\nNa Asfixiologia, o Enforcamento (interrupção provocada pelo peso do próprio corpo) ostenta sulco oblíquo, interrompido na região do nó e de profundidade desigual; o Estrangulamento (constrição por força muscular alheia) apresenta sulco horizontal, contínuo e de profundidade uniforme; a Esganadura decorre de constrição cervical direta pelas mãos do agressor, exibindo escoriações semilunares (estigmas ungueais).",
    divergentCurrents: {
      firstCurrent: {
        name: "Rigidez Cadavérica Crânio-Caudal Descendente (Lei de Nysten)",
        author: "Doutrina Médico-Legal Clássica e Majoritária (França e Fávero)",
        thesis: "A rigidez inicia-se na mandíbula e nuca, descendo para tórax, membros superiores e membros inferiores.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Início Concomitante em Músculos de Menor Massa",
        author: "Doutrina Forense Internacional Contemporânea",
        thesis: "A rigidez manifestar-se-ia simultaneamente em todos os músculos, sendo percebida visualmente mais rápido nas pequenas articulações.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "ZONA DE ESFUMAÇAMENTO É REMOVÍVEL COM ÁGUA: A zona de esfumaçamento (falsa tatuagem) pode ser lavada e removida com água e sabão; a zona de tatuagem NÃO sai com a lavagem porque os grânulos de pólvora incrustam na derme.",
      "SULCO NO ENFORCAMENTO É OBLÍQUO E DESCONTÍNUO: As bancas invertem a descrição com a do estrangulamento (que tem sulco horizontal e contínuo).",
      "HEMATOMA TEM COLEÇÃO SANGUÍNEA; EQUIMOSE NÃO TEM: A equimose é mero derrame de sangue nos tecidos sem cavidade; o hematoma forma cavidade líquida com coleção sanguínea palpável.",
      "COGUMELO DE ESPUMA É TÍPICO DE AFOGAMENTO: A presença de cogumelo de espuma nas vias respiratórias e manchas de Tardieu na pleura caracterizam a morte por afogamento."
    ],
    careerNuances: {
      AGU: "Análise técnica de laudos periciais cadavéricos em litígios indenizatórios contra a União decorrentes de mortes sob custódia em estabelecimentos penais federais.",
      PGFN: "Atuação no ressarcimento de custos ao SUS e perícias médico-legais decorrentes de desastres químicos e contaminações corporativas.",
      MPE: "Atuação em plenário do Tribunal do Júri examinando peritos e médicos legistas sobre a mecânica de disparos, ângulo de tiro e causa mortis da vítima."
    }
  },

  // =========================================================================
  // 42. DIREITO AGRÁRIO E DESAPROPRIAÇÃO RURAL (DIREITO AGRÁRIO - LOTE E FUC)
  // =========================================================================
  {
    id: "fuc-agrario-desapropriacao-funcao-social-propriedade",
    themeKeywords: [
      "direito agrário", "desapropriação rural", "função social da propriedade rural",
      "art. 184 da cf", "art. 185 da cf", "art. 186 da cf", "lei 8.629/1993", "estatuto da terra",
      "tda", "títulos da dívida agrária", "propriedade produtiva", "pequena propriedade rural", "incra"
    ],
    discipline: "DIREITO AGRÁRIO",
    title: "Direito Agrário: Função Social da Propriedade Rural, Desapropriação para Reforma Agrária e Imunidades",
    coreDoctrine: "O Direito Agrário brasileiro apoia-se no Estatuto da Terra (Lei 4.504/1964) e no regime constitucional do Capítulo III do Título VII da Carta de 1988 (arts. 184 a 191), subordinando a exploração econômica da terra ao cumprimento incondicional de sua função social.\n\nNos termos do art. 184 da CF, compete privativamente à União desapropriar por interesse social, para fins de reforma agrária, o imóvel rural que não esteja cumprindo sua função social. A indenização da terra nua é realizada mediante Títulos da Dívida Agrária (TDA), com cláusula de preservação do valor real e resgate escalonado no prazo de até 20 (vinte) anos, ao passo que as benfeitorias úteis e necessárias devem ser pagas integralmente em dinheiro à vista.\n\nO artigo 186 da Carta Política estatui que a função social é cumprida quando a propriedade rural atende simultaneamente a quatro requisitos cumulativos: aproveitamento racional e adequado (GUT e GEE); utilização adequada dos recursos naturais disponíveis e preservação do meio ambiente (cumprimento de APPs e Reserva Legal); observância das disposições da legislação trabalhista; e exploração que favoreça o bem-estar dos proprietários e dos trabalhadores. Por mandamento do art. 185 da CF, são absolutamente insuscetíveis de desapropriação para fins de reforma agrária: a pequena e média propriedade rural desde que seu proprietário não possua outra, e a propriedade comprovadamente produtiva.",
    divergentCurrents: {
      firstCurrent: {
        name: "Cumulatividade Indispensável dos Quatro Requisitos do Art. 186 (STF e STJ)",
        author: "Plenário do STF (MS 22.164) e 1ª Seção do STJ",
        thesis: "A propriedade rural produtiva que violar a legislação trabalhista (trabalho escravo) ou ambiental descumpre sua função social e perde a imunidade.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Imunidade Absoluta da Propriedade Produtiva",
        author: "Doutrina Agrarista Tradicional",
        thesis: "O art. 185, II da CF conferiria imunidade objetiva à terra que atinge os graus de produtividade, punindo infrações trabalhistas por outras vias.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "BENFEITORIAS SÃO PAGAS EM DINHEIRO: A terra nua é indenizada em TDA em até 20 anos, mas as benfeitorias úteis e necessárias são pagas obrigatoriamente EM DINHEIRO VIVO (art. 184, § 1º da CF).",
      "COMPETÊNCIA DESAPROPRIATÓRIA AGRÁRIA É EXCLUSIVA DA UNIÃO: Apenas a União pode desapropriar imóvel rural para reforma agrária; Estados e Municípios NÃO possuem competência para desapropriação por reforma agrária (art. 184 da CF).",
      "IMISSÃO PROVISÓRIA NA POSSE: Ajuizada a ação pelo INCRA e depositadas as TDAs e o valor em dinheiro das benfeitorias, a imissão provisória na posse é obrigatória no prazo de 48 horas (Lei Complementar 76/1993).",
      "VEDAÇÃO À VISTORIA EM IMÓVEL INVADIDO: Não será objeto de vistoria ou desapropriação o imóvel rural invadido ou ocupado coletivamente nos 2 anos seguintes à sua desocupação (art. 2º, § 6º da Lei 8.629/93)."
    ],
    careerNuances: {
      AGU: "Atuação pela Procuradoria Federal Especializada junto ao INCRA (PFE-INCRA), conduzindo as ações expropriatórias de reforma agrária e regularização fundiária na Justiça Federal.",
      PGFN: "Fiscalização e lançamento do Imposto sobre a Propriedade Territorial Rural (ITR), cuja função é marcadamente extrafiscal para desestimular a manutenção de terras improdutivas.",
      MPE: "Atuação em Varas Agrárias e conflitos fundiários coletivos, mediando litígios rurais multitudinários e fiscalizando a preservação de nascentes e reservas legais."
    }
  }
,

// =========================================================================
  // 43. NOVA LEI DE LICITAÇÕES E CONTRATOS ADMINISTRATIVOS (LEI 14.133/2021)
  // =========================================================================
  {
    id: "fuc-admin-nova-licitacao-contratos-14133",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Nova Lei de Licitações e Contratos Administrativos (Lei 14.133/2021)",
    themeKeywords: [
      "licitação", "licitacao", "14.133", "contratos administrativos", "diálogo competitivo", 
      "dialogo competitivo", "segregação de funções", "segregacao de funcoes", "dispensa", 
      "inexigibilidade", "matriz de riscos", "extinção contratual"
    ],
    coreDoctrine: `#### 📚 Nova Lei de Licitações e Contratos Administrativos (Lei 14.133/2021)

* **Princípios Vetores e Inovações Estruturantes**:
  A Lei 14.133/2021 unificou o regime geral de licitações e contratos da Administração Pública direta, autárquica e fundacional de todos os entes federativos. Consagrou expressamente o **princípio do planejamento**, o **princípio da segregação de funções** (art. 5º e 7º, § 1º) para evitar a concentração de atribuições decisórias e operacionais na mesma autoridade, e instituiu o **Portal Nacional de Contratações Públicas (PNCP)** como sítio eletrônico oficial obrigatório para divulgação de atos editalícios e contratuais.

* **Modalidades e Extinções**:
  Foram extintas as modalidades de convite e tomada de preços. As modalidades licitatórias vigentes são: **Pregão**, **Concorrência**, **Concurso**, **Leilão** e o inovador **Diálogo Competitivo** (art. 28 e 32), destinado a contratações que envolvam inovações tecnológicas, complexidade técnica ou impossibilidade de a Administração definir objetivamente a solução de mercado.

* **Inversão de Fases como Regra Geral**:
  A regra geral do rito ordinário é a **inversão de fases**: primeiro ocorre a abertura e o julgamento das propostas e somente depois se realiza a habilitação do licitante vencedor (art. 17). A inversão de fases (habilitação prévia) passou a ser excepcional e condicionada a prévia justificativa de interesse público no instrumento convocatório.

* **Contratação Direta: Inexigibilidade vs Dispensa**:
  A inexigibilidade (art. 74) decorre da inviabilidade de competição (rol meramente exemplificativo), abrangendo fornecedor exclusivo, serviços técnicos de natureza predominantemente intelectual com profissional ou empresa de notória especialização, e credenciamento. A dispensa (art. 75) envolve viabilidade fática de competição com autorização legislativa para não licitar (rol taxativo), com destaque para os limites de valor atualizados anualmente.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Controle Preventivo e Responsabilidade Subjetiva do Parecerista",
        author: "Marçal Justen Filho e Jurisprudência do TCU",
        thesis: "O parecer jurídico prévio exigido pelo art. 53 é ato de controle preventivo da legalidade. O parecerista somente responde pessoalmente perante os órgãos de controle se comprovado dolo ou erro grosseiro inescusável, nos termos do art. 28 da LINDB e Tema 1.098 do STF.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Responsabilidade Solidária Ampla em Pareceres Vinculantes",
        author: "Corrente Minoritária de Controle Externo",
        thesis: "Sustenta que o parecerista que aprova minuta ilegal com vícios evidentes de cálculo ou ausência de pesquisa de mercado responde solidariamente com o gestor ordenador de despesa, independentemente da demonstração de dolo.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "MODALIDADES EXTINTAS: Convite e Tomada de Preços foram revogados; não existem mais no direito positivo brasileiro sob a Lei 14.133/21.",
      "DIÁLOGO COMPETITIVO É MODALIDADE: O Diálogo Competitivo não é critério de julgamento nem procedimento auxiliar; é modalidade autônoma de licitação com comissão formada por pelo menos 3 servidores efetivos ou empregados públicos.",
      "SEGREGAÇÃO DE FUNÇÕES: A atuação do agente de contratação e da equipe de apoio é incompatível com a fiscalização e gestão direta do contrato decorrente.",
      "MATRIZ DE RISCOS OBRIGATÓRIA: É obrigatória a previsão de matriz de alocação de riscos nos contratos de grande vulto e nas contratações integradas e semi-integradas."
    ],
    careerNuances: {
      AGU: "A Consultoria-Geral da União (CGU/AGU) padroniza modelos nacionais de editais e contratos federais, exercendo a análise preventiva de juridicidade estrita do art. 53 da Lei 14.133/2021.",
      PGFN: "Verificação de conformidade fiscal e regularidade perante a Seguridade Social nas contratações do Ministério da Fazenda, coibindo renúncia irregular de receitas e assegurando garantias contratuais adequadas.",
      MPE: "Atuação repressiva e preventiva contra fraudes em contratações emergenciais e fracionamento indevido de despesas de dispensa em prefeituras e secretarias de estado."
    }
  },

  // =========================================================================
  // 44. IMPROBIDADE ADMINISTRATIVA REFORMADA (LEI 14.230/2021 E STF TEMA 1.199)
  // =========================================================================
  {
    id: "fuc-admin-improbidade-administrativa-14230",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Improbidade Administrativa Reformada (Lei 8.429/1992 c/c Lei 14.230/2021)",
    themeKeywords: [
      "improbidade administrativa", "14.230", "8.429", "dolo específico", "tema 1199", 
      "prescrição intercorrente", "prescricao intercorrente", "acordo de não persecução civil", 
      "anpc", "perda da função pública", "artigo 11"
    ],
    coreDoctrine: `#### 📚 Improbidade Administrativa Reformada (Lei 14.230/2021 e Tema 1.199 STF)

* **Exigência Inafastável de Dolo Específico**:
  Com o advento da Lei 14.230/2021, foi extinta a modalidade culposa de ato de improbidade administrativa. O art. 1º, §§ 2º e 3º exige expressamente a demonstração de **dolo específico** (vontade livre e consciente de alcançar o resultado ilícito tipificado na lei), sendo vedada a responsabilização por dolo genérico, culpa grave ou simples negligência/imperícia.

* **Repercussão Geral: STF Tema 1.199**:
  O Plenário do STF fixou balizas cruciais sobre a aplicação da Lei 14.230/2021:
  1. A revogação da modalidade culposa do art. 10 da LIA é **irretroativa** para condenações já transitadas em julgado (respeito à coisa julgada, art. 5º, XXXVI da CF).
  2. A exigência de dolo aplica-se imediatamente aos **processos em andamento sem trânsito em julgado**, devendo o juiz oportunizar ao autor a emenda para comprovação do elemento subjetivo doloso.
  3. O novo prazo prescricional geral de 8 anos (art. 23) e os marcos interruptivos da prescrição intercorrente são **irretroativos**, aplicando-se somente a partir da publicação da Lei 14.230/2021.

* **Legitimidade Ativa Concorrente e ANPC**:
  O STF declarou a inconstitucionalidade da exclusividade ministerial para a ação de improbidade (ADI 7042 e 7043), restabelecendo a **legitimidade ativa concorrente** do Ministério Público e da pessoa jurídica de direito público lesada (União, Estados, Municípios e autarquias). O **Acordo de Não Persecução Civil (ANPC)** é cabível em qualquer fase processual, exigindo ressarcimento integral do dano e perda da vantagem patrimonial indevida.

* **Dosimetria das Sanções e Indisponibilidade Cautelar de Bens**:
  * As sanções do art. 12 da LIA foram reestruturadas para afastar a cumulação automática de penalidades. O magistrado deve individualizar fundamentadamente cada sanção (perda de bens, perda de função pública, suspensão de direitos políticos, multa civil e proibição de contratar), considerando a extensão do dano e o proveito patrimonial obtido.
  * A indisponibilidade cautelar de bens (art. 16) exige agora demonstração concreta de risco de insolvência ou ocultação de patrimônio, vedada a incidência sobre bens de família ou quantias até 40 salários mínimos em caderneta de poupança.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Tese Vinculante da Irretroatividade sobre a Coisa Julgada (STF)",
        author: "STF Tema 1.199 / Min. Alexandre de Moraes",
        thesis: "O princípio da retroatividade da lei penal mais benéfica (art. 5º, XL da CF) não tem aplicação automática e ilimitada no Direito Administrativo Sancionador, não desconstituindo decisões transitadas em julgado.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Retroatividade Ampla no Direito Sancionador",
        author: "Doutrina Penalista Sancionadora Crítica",
        thesis: "Sustentava que a revogação do ato culposo operava verdadeira abolitio criminis civilis, autorizando a rescisão inclusive de títulos executivos transitados em julgado via impugnação ao cumprimento de sentença.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "PERDA DA FUNÇÃO PÚBLICA RESTRITA AO MESMO VÍNCULO: A perda da função pública agora atinge apenas o vínculo de mesma qualidade e natureza que o agente detinha na época do fato ilícito, exigindo decisão motivada expressa para alcançar outros vínculos no art. 9º.",
      "ROL TAXATIVO DO ARTIGO 11: Os atos que atentam contra os princípios da administração pública (art. 11) passaram a ter rol taxativo de incisos; a conduta deve subsumir-se com precisão aos tipos ali previstos.",
      "PRESCRIÇÃO GERAL DE 8 ANOS: O prazo prescricional é unificado em 8 anos a contar da data em que o fato ocorreu (e não mais do fim do mandato de prefeito ou governador).",
      "PRESCRIÇÃO INTERCORRENTE DE 4 ANOS: Ajuizada a ação, o processo não pode permanecer paralisado por mais de 4 anos entre cada marco interruptivo legal."
    ],
    careerNuances: {
      AGU: "A União, via representação da AGU, detém legitimidade ativa plena e autônoma para ajuizar ações de improbidade administrativa e firmar Acordos de Não Persecução Civil (ANPC) na defesa do patrimônio público federal.",
      PGFN: "Cooperação institucional no compartilhamento de provas tributárias decorrentes de operações aduaneiras e fiscais que evidenciem enriquecimento ilícito de servidores fazendários.",
      MPE: "Condução prioritária dos inquéritos civis públicos e celebração de ANPCs para recomposição célere de verbas municipais e estaduais desviadas."
    }
  },

  // =========================================================================
  // 45. TRATADOS INTERNACIONAIS, INCORPORAÇÃO E JUS COGENS
  // =========================================================================
  {
    id: "fuc-internacional-tratados-incorporacao-jus-cogens",
    discipline: "DIREITO INTERNACIONAL PÚBLICO E PRIVADO",
    title: "Tratados Internacionais: Celebração, Incorporação e Teoria do Jus Cogens",
    themeKeywords: [
      "tratados internacionais", "incorporação", "incorporacao", "convenção de viena 1969", 
      "convencao de viena 1969", "jus cogens", "supralegalidade", "duplo binário", "duplo binario", 
      "denúncia de tratados", "denuncia de tratados", "monismo", "dualismo moderado"
    ],
    coreDoctrine: `#### 📚 Tratados Internacionais: Processo de Incorporação e Jus Cogens

* **Processo Complexo de Incorporação no Brasil (Dualismo Moderado)**:
  O Supremo Tribunal Federal firmou a adoção do **dualismo moderado** (ADI 1.480/DF). A vigência interna de um tratado internacional no ordenamento brasileiro exige um processo integrado por quatro fases sucessivas:
  1. **Assinatura/Celebração**: Competência privativa do Presidente da República ou plenipotenciários munidos de Carta de Plenos Poderes (CF art. 84, VIII).
  2. **Aprovação Parlamentar (Referendo)**: Competência exclusiva do Congresso Nacional mediante edição de **Decreto Legislativo** (CF art. 49, I).
  3. **Ratificação Internacional**: Ato internacional formal depositado pelo Chefe de Estado junto ao depositário do tratado, gerando o liame internacional obrigatório (pacta sunt servanda).
  4. **Promulgação e Publicação Interna**: Edição de **Decreto Presidencial** de promulgação com publicação no Diário Oficial da União, momento a partir do qual a norma gera exigibilidade jurídica interna.

* **Hierarquia das Normas Internacionais no Brasil**:
  - **Tratados de Direitos Humanos aprovados pelo art. 5º, § 3º da CF**: Aprovados em 2 turnos, por 3/5 em cada Casa do Congresso Nacional, possuem equivalência jurídica a **Emendas Constitucionais**.
  - **Tratados de Direitos Humanos comuns (rito ordinário)**: Possuem **status supralegal** (STF RE 466.343 - tese do duplo binário), paralisando a eficácia de qualquer lei ordinária contrária.
  - **Tratados comuns (comércio, tributos, extradição, meio ambiente)**: Ingressam com **status de lei ordinária**, submetidos aos critérios cronológico (lei posterior derroga tratado anterior) e de especialidade.

* **Teoria do Jus Cogens Internacional**:
  Nos termos do art. 53 da Convenção de Viena sobre o Direito dos Tratados de 1969 (CVDT), é nulo todo tratado que, no momento de sua conclusão, conflite com uma norma imperativa de Direito Internacional Geral (**jus cogens**). Caracteriza-se como norma aceita e reconhecida pela comunidade internacional dos Estados em seu conjunto, da qual nenhuma derrogação é permitida e que só pode ser modificada por norma ulterior de mesma natureza (ex: proibição da tortura, do genocídio, do tráfico de escravos e do apartheid).

* **Teoria das Fontes do Direito Internacional Público (Artigo 38 do Estatuto da CIJ)**:
  O Estatuto da Corte Internacional de Justiça consagra o rol tradicional das fontes do Direito Internacional Público:
  1. **Tratados e Convenções Internacionais**: Fonte primária e expressa, gerando obrigações para as partes pactuantes em consonância com o princípio pacta sunt servanda (art. 26 da CVDT).
  2. **Costume Internacional**: Prova de uma prática geral, uniforme e reiterada (elemento material ou inveterata consuetudo), aceita e reconhecida como sendo de observância jurídica obrigatória (elemento subjetivo ou opinio juris sive necessitatis).
  3. **Princípios Gerais de Direito**: Normas fundamentais compartilhadas pelos sistemas jurídicos nacionais (boa-fé, vedação ao enriquecimento sem causa, coisa julgada, proporcionalidade).
  4. **Meios Auxiliares**: Jurisprudência internacional e a doutrina dos publicistas mais qualificados.
  5. **Atos Unilaterais dos Estados e Resoluções Vinculantes de Organizações Internacionais**: Fontes contemporâneas autônomas reconhecidas pela dogmática moderna (ex.: decisões do Conselho de Segurança da ONU sob o Capítulo VII da Carta).

* **Direito dos Tratados na Convenção de Viena de 1969**:
  * **Conclusão e Fases**: Negociação, adoção do texto, autenticação, assinatura (efeito precário de abstenção de atos contrários ao objeto e finalidade, art. 18), ratificação e entrada em vigor internacional.
  * **Reservas (Art. 19)**: Declaração unilateral feita no momento da assinatura ou ratificação para excluir ou modificar os efeitos de cláusulas específicas, admitida salvo se expressamente proibida ou incompatível com o objeto e finalidade do tratado.
  * **Interpretação (Arts. 31 e 32)**: Primazia da interpretação gramatical, teleológica e sistemática de boa-fé no sentido comum dos termos, utilizando trabalhos preparatórios e circunstâncias de conclusão apenas como meios suplementares.
  * **Causas de Extinção e Suspensão**: Denúncia regular com consentimento mútuo, quebra substancial do tratado pela contraparte (inadimplência), impossibilidade superveniente de cumprimento e cláusula rebus sic stantibus (modificação fundamental das circunstâncias fáticas, art. 62).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Dualismo Moderado com Exigência de Decreto Presidencial (STF)",
        author: "Jurisprudência Consolidada do STF (ADI 1.480 e CR 8.279)",
        thesis: "O tratado ratificado não possui eficácia executiva automática na ordem jurídica interna sem a expedição do Decreto Executivo de promulgação, que opera a transformação da norma internacional em norma aplicável pelo Judiciário.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Monismo Internacionalista com Primazia Automática",
        author: "Hildebrando Accioly e Celso de Albuquerque Mello",
        thesis: "Defende que a ordem jurídica é única e universal, de modo que a ratificação internacional válida basta para produzir efeitos internos imediatos, dispensando a formalidade anacrônica do decreto de promulgação.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "DENÚNCIA DE TRATADO EXIGE APROVAÇÃO DO CONGRESSO: O Presidente da República não pode denunciar tratado internacional unilateralmente sem a prévia chancela do Congresso Nacional (STF ADC 39 e ADI 1.625).",
      "RESERVAS EM TRATADOS: A reserva é permitida desde que não vedada expressamente pelo tratado e compatível com seu objeto e finalidade (art. 19 da CVDT de 1969).",
      "REVOGAÇÃO DE TRATADO POR LEI INTERNA POSTERIOR: Tratados comuns podem ter sua eficácia interna paralisada por lei ordinária posterior (STF Carta Rogatória 8.279), ressalvando-se a responsabilidade internacional do Estado brasileiro perante a ordem exterior.",
      "JUS COGENS NÃO ADMITE RESERVA NEM DERROGAÇÃO: Qualquer tratado ou cláusula que viole norma de jus cogens é nulo de pleno direito ab initio."
    ],
    careerNuances: {
      AGU: "Defesa do Estado brasileiro perante cortes supranacionais e assessoria jurídica aos Ministérios na redação e negociação de acordos e tratados internacionais de cooperação.",
      PGFN: "Aplicação dos Acordos e Convenções para Evitar a Dupla Tributação da Renda (TIBs), assegurando a prevalência de regras convencionais de competência tributária.",
      MPE: "Exercício do controle de convencionalidade difuso nas promotorias de direitos fundamentais, exigindo a observância de tratados ratificados perante a magistratura local."
    }
  },

  // =========================================================================
  // 46. IMUNIDADE DE JURISDIÇÃO, COOPERAÇÃO JURÍDICA E EXTRADIÇÃO
  // =========================================================================
  {
    id: "fuc-internacional-imunidade-jurisdicao-extradicao",
    discipline: "DIREITO INTERNACIONAL PÚBLICO E PRIVADO",
    title: "Imunidade de Jurisdição, Cooperação Jurídica Internacional e Extradição",
    themeKeywords: [
      "imunidade de jurisdição", "imunidade de jurisdicao", "imunidade de execução", 
      "imunidade de execucao", "atos de império", "atos de imperio", "atos de gestão", 
      "atos de gestao", "extradição", "extradicao", "lei de migração", "lei de migracao", 
      "homologação de sentença estrangeira", "stj", "stf", "tema 944"
    ],
    coreDoctrine: `#### 📚 Imunidade de Jurisdição, Cooperação Jurídica e Extradição

* **Evolução da Imunidade de Jurisdição dos Estados Estrangeiros**:
  O Brasil abandonou a teoria clássica da imunidade absoluta e consolidou a **teoria da imunidade relativa** (STF ACi 9.696):
  1. **Atos de Império (jure imperii)**: Atos praticados pelo Estado no exercício estrito de sua soberania estatal continuam protegidos pela imunidade de jurisdição.
  2. **Atos de Gestão (jure gestionis)**: Atos de natureza comercial, civil e obrigações trabalhistas não gozam de imunidade de jurisdição cognitiva, podendo o Estado estrangeiro ser demandado no Brasil.
  3. **Violações a Direitos Humanos Fundamentais**: O STF fixou que atos ilícitos praticados por Estados estrangeiros em violação a direitos humanos fundamentais não gozam de imunidade de jurisdição (**STF Tema 944 / RE 1.159.247**).
  4. **Imunidade de Execução**: Permanece em vigor, sendo impenhoráveis os bens afetados à representação diplomática ou consular (Convenção de Viena sobre Relações Diplomáticas de 1961). Bens desafetados podem sofrer execução forçada.

* **Competências Constitucionais e Cooperação Internacional**:
  - **Homologação de Decisão Estrangeira e Concessão de Exequatur**: Competência originária do **Superior Tribunal de Justiça (STJ)** nos termos do art. 105, I, "i", da CF (EC 45/2004). O STJ não analisa o mérito da decisão estrangeira (sistema de delibação), limitando-se aos requisitos formais, soberania nacional e ordem pública.
  - **Litígios com Estados Estrangeiros**: Competência do **STF** para litígios entre Estado estrangeiro e a União, Estado ou DF (CF art. 102, I, e); e da **Justiça Federal de 1º Grau** entre Estado estrangeiro e Município ou particular (CF art. 109, II), cabendo Recurso Ordinário Constitucional direto ao STJ (art. 105, II, c).

* **Extradição na CF/88 e Lei de Migração (Lei 13.445/2017)**:
  A extradição é ato de soberania e cooperação jurídica internacional de competência jurisdicional exclusiva do **STF** (CF art. 102, I, g):
  - **Brasileiro Nato**: JAMAIS poderá ser extraditado (CF art. 5º, LI).
  - **Brasileiro Naturalizado**: Somente poderá ser extraditado por crime comum praticado ANTES da naturalização, ou de comprovado envolvimento em tráfico ilícito de entorpecentes a qualquer tempo.
  - **Vedações Absolutas à Extradição**: Não se concederá extradição por crime político ou de opinião (art. 5º, LII), se o fato for punível no Brasil com pena de morte ou prisão perpétua (salvo se o Estado requerente assumir compromisso formal de comutação), ou se houver risco de perseguição discriminatória.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria da Imunidade Relativa de Jurisdição e Absoluta de Execução",
        author: "STF e STJ (Convenções de Viena de 1961 e 1963)",
        thesis: "Existe jurisdição contenciosa da Justiça brasileira para processar e julgar causas trabalhistas e cíveis fundadas em atos de gestão, mas a execução só pode alcançar bens estritamente não afetados à representação consular ou diplomática.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Imunidade Ampla e Irrestrita de Execução",
        author: "Corrente Conservadora Diplomática",
        thesis: "Sustenta que qualquer penhora sobre conta bancária ou patrimônio de missão estrangeira ofende o princípio da inviolabilidade diplomática, devendo a execução ser extinta sem penhora.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "HOMOLOGAÇÃO DE SENTENÇA É NO STJ, EXTRADIÇÃO É NO STF: Pegadinha recorrente de bancas. A homologação de sentença estrangeira e cartas rogatórias competem ao STJ (art. 105, I, i); a extradição compete originariamente ao STF (art. 102, I, g).",
      "RECURSO ORDINÁRIO EM CAUSAS COM ESTADO ESTRANGEIRO: Das decisões do juiz federal nas causas entre Estado estrangeiro e particular cabe Recurso Ordinário diretamente ao STJ (art. 105, II, c da CF), sem passar pelo TRF.",
      "ALTERAÇÃO DE PERDA DA NACIONALIDADE PELA EC 131/2023: O brasileiro que adquire outra nacionalidade não perde mais automaticamente a nacionalidade brasileira, salvo se fizer pedido expresso por escrito.",
      "VEDAÇÃO DE EXTRADIÇÃO POR CRIME POLÍTICO: A definição de crime político para fins de recusa da extradição compete privativamente ao Plenário do STF."
    ],
    careerNuances: {
      AGU: "Defesa dos interesses da União perante a Justiça Federal e STF em matérias de cooperação jurídica internacional, auxílio direto e contencioso com representações diplomáticas.",
      PGFN: "Cooperação transnacional fiscal para localização e repatriação de divisas ocultadas em paraísos fiscais, articulando-se com a rede de recuperação de ativos.",
      MPE: "Atuação ministerial em pedidos de repatriação internacional de menores sob a Convenção de Haia de 1980 e persecução de redes de tráfico internacional de pessoas."
    }
  },
  {
    id: "fuc-admin-conceito-criterios-fontes-regime",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Conceito, Critérios de Definição, Objeto e Fontes do Direito Administrativo",
    themeKeywords: [
      "critérios adotados", "criterios adotados", "conceituação do direito administrativo",
      "conceituacao do direito administrativo", "conceito de direito administrativo",
      "objeto do direito administrativo", "critério do poder executivo", "critério das relações jurídicas",
      "critério do serviço público", "critério finalístico", "critério negativista",
      "critério funcional", "critério teleológico", "aspectos orgânico, formal e material",
      "administração pública em sentido formal", "administração pública em sentido material",
      "sentido orgânico", "sentido subjetivo", "fontes do direito administrativo",
      "regime jurídico-administrativo", "pedras de toque", "caso blanco",
      "supremacia do interesse público", "indisponibilidade do interesse público",
      "função administrativa", "noções introdutórias"
    ],
    coreDoctrine: `#### 🏛️ Origem Histórica, Conceito e os Critérios da Doutrina

* **Origem Histórica e Autonomia Dogmática (O Caso Blanco de 1873)**:
  O Direito Administrativo, como ramo jurídico autônomo dotado de princípios e prerrogativas próprias, nasceu com a consagração do Estado de Direito após a Revolução Francesa. O marco dogmático fundacional universalmente reconhecido pela doutrina é o célebre **Arresto Blanco (Caso Blanco de 1873)**, julgado pelo Tribunal de Conflitos da França (*Tribunal des Conflits*). Ao dirimir o conflito de competência decorrente do atropelamento da menina Agnès Blanco por uma vagonete da Companhia Estatal de Fumo em Bordeaux, o tribunal assentou que:
  1. A responsabilidade do Estado pelos prejuízos causados aos particulares no exercício de serviços públicos não pode ser regida pelos princípios de direito privado estabelecidos no Código Civil;
  2. As relações administrativas submetem-se a um regime jurídico especial e derrogatório do direito comum, voltado a conciliar as necessidades do serviço público e a salvaguarda dos direitos dos cidadãos;
  3. No modelo francês consolidou-se o contencioso administrativo dual (Conselho de Estado vs Poder Judiciário), enquanto o Brasil adotou o sistema inglês de jurisdição una (CF/88, art. 5º, inciso XXXV).

* **Os Critérios Adotados pela Doutrina para a Conceituação do Direito Administrativo**:
  A doutrina administrativista clássica e contemporânea desenvolveu diversos critérios para delimitar o conceito e o objeto da disciplina:
  * **1. Critério do Poder Executivo (Orgânico ou Subjetivo Restrito)**:
    Define o Direito Administrativo como o conjunto de normas que disciplinam a organização e a atuação privativa do Poder Executivo.
    *Crítica*: Critério falho por excesso e por defeito. Por defeito porque desconsidera que o Poder Legislativo e o Poder Judiciário também desempenham atipicamente a função administrativa (gestão de pessoal, compras, licitações, concursos). Por excesso porque o Executivo também exerce funções políticas de governo e legisla atipicamente (medidas provisórias).
  * **2. Critério das Relações Jurídicas**:
    Define o ramo como a disciplina das relações jurídicas travadas entre a Administração Pública e os particulares.
    *Crítica*: Insuficiente, pois existem relações jurídicas entre o Estado e particulares regidas precipuamente pelo direito privado (empresas estatais exploradoras de atividade econômica concorrencial ou contratos de locação). Ademais, desconsidera as relações interorgânicas e a estrutura interna dos órgãos públicos.
  * **3. Critério do Serviço Público (Escola de Bordeaux / Léon Duguit, Gaston Jèze e Louis Rolland)**:
    Sustenta que o Direito Administrativo é o ramo do direito que rege exclusivamente os serviços públicos. O Estado seria concebido como uma corporação de serviços públicos.
    *Crítica*: Restringe indevidamente o objeto da matéria, pois exclui atividades fundamentais que não configuram serviço público em sentido estrito, tais como o poder de polícia administrativa, o fomento e a intervenção estatal no domínio econômico.
  * **4. Critério Teleológico ou Finalístico**:
    Define o Direito Administrativo como o complexo de normas que regem as atividades voltadas à consecução direta dos fins do Estado.
    *Crítica*: Vago e impreciso, pois a função legislativa e a função jurisdicional também têm por objetivo a realização dos fins estatais fundamentais.
  * **5. Critério Negativo ou Residual**:
    Identifica o Direito Administrativo por exclusão: é o conjunto de atividades estatais que sobram após a subtração das funções legislativa e jurisdicional.
    *Crítica*: Tem valor meramente didático e residual, mas é incapaz de fornecer uma definição ontológica e positiva do conteúdo do direito material.
  * **6. Critério da Atividade Jurídica Não Contenciosa**:
    Conceitua a disciplina como a regulação da atividade não contenciosa do Estado voltada ao bem público.
    *Crítica*: Olvida a existência do contencioso administrativo e dos processos administrativos formais de impugnação disciplinados por lei (Lei 9.784/1999 e Decreto 70.235/1972).
  * **7. Critério Funcional (Critério Moderno Majoritário)**:
    Consagrado pela moderna doutrina brasileira (Celso Antônio Bandeira de Mello, José dos Santos Carvalho Filho, Maria Sylvia Zanella Di Pietro e Rafael Rezende Oliveira). Define o Direito Administrativo como o ramo autônomo do Direito Público que estuda e disciplina normativamente o exercício da **função administrativa**, bem como os órgãos, as pessoas jurídicas e os agentes que a exercem e os bens públicos empregados na satisfação dos interesses coletivos.

* **Sentidos de Administração Pública (Dicotomia Fundamental)**:
  * **Sentido Subjetivo, Formal ou Orgânico (Administração Pública com iniciais maiúsculas)**:
    Refere-se a QUEM exerce a função administrativa. É o complexo de órgãos, entes federativos, pessoas jurídicas administrativas e agentes públicos instituídos pela ordem constitucional e legal para gerir os serviços estatais. Compreende a Administração Direta (União, Estados, DF e Municípios) e a Administração Indireta (Autarquias, Fundações Públicas, Empresas Públicas e Sociedades de Economia Mista - art. 4º do Decreto-Lei 200/1967).
  * **Sentido Objetivo, Material ou Funcional (administração pública com iniciais minúsculas)**:
    Refere-se ao QUE é exercido, isto é, o conteúdo da atividade administrativa estatal concreta. Desdobra-se em quatro eixos materiais:
    1. **Serviço Público**: prestação de utilidades materiais aos administrados;
    2. **Polícia Administrativa**: restrições e condicionamentos a liberdades e propriedades privadas pelo interesse público (CTN, art. 78);
    3. **Fomento**: incentivo e suporte a atividades de interesse social (terceiro setor, parcerias);
    4. **Intervenção**: atuação regulatória (art. 174 da CF) e intervenção na propriedade e na ordem econômica.

* **O Regime Jurídico-Administrativo e as Pedras de Toque de Bandeira de Mello**:
  O Direito Administrativo assenta-se em duas vigas mestras correlatas:
  1. **Princípio da Supremacia do Interesse Público sobre o Privado**: outorga **prerrogativas especiais** à Administração (presunção de veracidade e legitimidade dos atos, autoexecutoriedade, exigibilidade, cláusulas exorbitantes nos contratos e prerrogativas processuais da Fazenda Pública);
  2. **Princípio da Indisponibilidade do Interesse Público pela Administração**: impõe **sujeições e restrições intransponíveis** ao gestor (vinculação estrita à legalidade, dever indeclinável de motivar os atos, obrigatoriedade de concurso público e dever de licitar). O administrador não é titular dos interesses públicos, mas mero fiduciário e gestor da coletividade.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Critério Funcional da Função Administrativa (Majoritária)",
        author: "Celso Antônio Bandeira de Mello / José dos Santos Carvalho Filho",
        thesis: "O Direito Administrativo tem por objeto a disciplina normativa da função administrativa sob qualquer Poder do Estado, integrando órgãos, bens, agentes e a relação jurídica publicística com os administrados.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Critério das Atividades Jurídicas Não Contenciosas e Bens Públicos",
        author: "Maria Sylvia Zanella Di Pietro",
        thesis: "Conceitua o ramo como direito público que tem por objeto os órgãos, agentes e pessoas jurídicas administrativas, a atividade jurídica não contenciosa que exerce e os bens públicos de que se utiliza para seus fins.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "CONFUSÃO ENTRE CRITÉRIO DO PODER EXECUTIVO E FUNCIONAL: As bancas afirmam que o Brasil adota o critério do Poder Executivo para conceituar o Direito Administrativo. Falso: adota-se o critério funcional, pois os Poderes Judiciário e Legislativo também exercem função administrativa em caráter atípico.",
      "INVERSÃO DOS SENTIDOS DE ADMINISTRAÇÃO PÚBLICA: Afirmar que a Administração Pública em sentido objetivo designa os órgãos e entes da Administração Direta e Indireta. Errado: órgãos, pessoas e agentes integram o sentido SUBJETIVO, FORMAL ou ORGÂNICO.",
      "CRITÉRIO DOS SERVIÇOS PÚBLICOS COMO ÚNICO: Tentar resumir o objeto do Direito Administrativo aos serviços públicos. Errado: exclui as matérias de poder de polícia, fomento e intervenção econômica.",
      "FALSA SUBORDINAÇÃO DO DIREITO ADMINISTRATIVO AO DIREITO CIVIL: O Caso Blanco (1873) assentou a autonomia do Direito Administrativo em relação ao Código Civil privado, vedando a aplicação direta das regras privatistas à responsabilidade do Estado."
    ],
    careerNuances: {
      AGU: "Na Advocacia-Geral da União, a compreensão dos critérios do direito administrativo e dos sentidos de Administração Pública é indispensável para a fixação de teses uniformes e edição de pareceres vinculantes (art. 40 da LC 73/1993) aplicáveis a todos os órgãos da Administração Direta Federal.",
      PF: "Na Procuradoria-Geral Federal, a distinção entre Administração Direta e Indireta é a base institucional para a representação judicial e consultiva das autarquias e fundações públicas federais (Lei 10.480/2002), resguardando o regime jurídico autárquico de direito público.",
      PGFN: "Na Procuradoria-Geral da Fazenda Nacional, a supremacia e a indisponibilidade do interesse público orientam o regime de cobrança da Dívida Ativa da União e a legalidade estrita dos créditos fiscais.",
      PBC: "No Banco Central do Brasil, a conceituação da função administrativa técnica sustenta o poder de regulação e fiscalização monetária e cambial sob regime de autarquia de natureza especial dotada de autonomia funcional."
    }
  },


  // =========================================================================
  // 47. DIREITO TRIBUTÁRIO: O ESTADO FISCAL E O PODER DE TRIBUTAR
  // =========================================================================
  {
    id: "tributario-estado-fiscal",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "O Estado Fiscal, o Poder de Tributar e as Finalidades da Tributação",
    themeKeywords: [
      "o estado fiscal", "estado fiscal", "poder de tributar", "finalidades da tributação", 
      "fiscalidade", "extrafiscalidade", "parafiscalidade", "dever fundamental de pagar tributos", 
      "klaus tipke", "relação jurídico-tributária", "soberania fiscal"
    ],
    coreDoctrine: `#### 📚 O Estado Fiscal, Soberania e Finalidades da Tributação

* **Conceito de Estado Fiscal (Klaus Tipke e Joseph Schumpeter)**:
  O Estado Fiscal caracteriza-se pela obtenção de suas receitas ordinárias primordialmente a partir do patrimônio dos cidadãos mediante tributação compulsória, renunciando à exploração direta e prioritária de atividades econômicas ou estatais patrimoniais (Estado Produtor/Proprietário).
  * O poder de tributar deriva da soberania estatal, mas no Estado Democrático de Direito transmuda-se em **dever fundamental de pagar tributos** (solidariedade fiscal, art. 3º, I da CF/88).

* **Finalidades da Tributação**:
  1. **Fiscalidade**: Obtenção primária de receitas financeiras para o custeio de despesas públicas gerais e serviços essenciais indivisíveis.
  2. **Extrafiscalidade**: Utilização da norma tributária como instrumento de intervenção e indução no domínio socioeconômico (art. 174 da CF/88), estimulando ou desestimulando condutas (exemplo: alíquotas do II, IE, IPI, IOF e ITR progressivo contra latifúndios improdutivos).
  3. **Parafiscalidade**: Atribuição legal da capacidade tributária ativa e da arrecadação a pessoas jurídicas diversas da instituidora para o financiamento de atividades corporativas ou de fomento social (exemplo: contribuições do Sistema S e conselhos de fiscalização profissional).

* **Natureza da Relação Jurídico-Tributária**:
  Superação definitiva da teoria da relação de poder (Gewaltverhältnis de Otto Mayer). Com Albert Hensel e Dino Jarach, pacificou-se que a obrigação tributária é uma **relação de direito** ex lege e vinculada, na qual Fisco e contribuinte submetem-se estritamente à legalidade e à tipicidade cerrada.

* **Limitações Formais e Materiais ao Poder de Tributar**:
  A tributação encontra limites inultrapassáveis nos direitos e garantias fundamentais do contribuinte (art. 150 da CF), destacando-se a proibição de retroatividade da lei tributária, a anterioridade de exercício e nonagesimal, a irredutibilidade dos direitos adquiridos e o respeito à segurança jurídica e à confiança legítima do administrado perante as orientações da administração fiscal O dever fundamental de pagar tributos constitui a contrapartida cidadã indispensável para a concretização dos direitos sociais fundamentais e erradicação da pobreza (arts. 3º e 6º da CF/88), legitimando a atuação fiscalizatória rigorosa e a cobrança da Dívida Ativa pela PGFN.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria da Indução Econômica Pura da Extrafiscalidade",
        author: "Klaus Tipke / Paulo de Barros Carvalho",
        thesis: "A extrafiscalidade autoriza a modulação de alíquotas para induzir comportamentos de mercado, desde que preservada a capacidade contributiva mínima e a razoabilidade.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Reserva Absoluta de Fiscalidade",
        author: "Corrente Crítica Clássica",
        thesis: "Sustenta que qualquer finalidade arrecadatória que desvie da manutenção da máquina estatal configuraria desvio de finalidade tributária.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "CONFUSÃO ENTRE EXTRAFISCALIDADE E PARAFISCALIDADE: A banca troca os conceitos afirmando que parafiscalidade é o uso do tributo para regular a economia. Errado: parafiscalidade é a destinação da receita para entes paralelos ao Estado (como OAB, CRM, SESI, SENAI).",
      "RELAÇÃO DE PODER VS RELAÇÃO DE DIREITO: Dizer que a relação tributária é uma relação de poder de império do Fisco. Errado: é relação de direito estritamente vinculada à lei (art. 3º do CTN)."
    ],
    careerNuances: {
      AGU: "Na AGU, a defesa da extrafiscalidade é fundamental para assegurar a higidez de políticas públicas federais de incentivo e regulação ambiental e setorial.",
      PGFN: "Na PGFN, o conceito de Estado Fiscal fundamenta a legitimidade republicana da cobrança da Dívida Ativa da União e a garantia das receitas estruturantes do Orçamento Geral da União.",
      PF: "Na PGF, orienta a defesa da legalidade das taxas e contribuições arrecadadas pelas autarquias e agências reguladoras federais.",
      PBC: "No Banco Central, articula-se com a extrafiscalidade cambial e monetária nas operações de câmbio e crédito."
    }
  },

  // =========================================================================
  // 48. DIREITO TRIBUTÁRIO: FONTES E RELAÇÕES COM O DIREITO PRIVADO
  // =========================================================================
  {
    id: "tributario-fontes-direito-privado",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Fontes do Direito Tributário, Interpretação e Relações com o Direito Privado",
    themeKeywords: [
      "fontes do direito tributário", "direito privado", "art. 110", 
      "artigo 110", "relações entre o direito tributário e o direito privado", "normas gerais de direito tributário", 
      "legislação tributária", "vigência e aplicação", "interpretação e integração", "art. 108", "art. 100", "artigo 108"
    ],
    coreDoctrine: `#### 📚 Fontes do Direito Tributário e Limites do Art. 110 do CTN

* **Fontes e Conceito de Legislação Tributária (Art. 96 do CTN)**:
  A expressão "legislação tributária" é mais ampla que "lei tributária". Abrange leis (ordinárias e complementares), tratados e convenções internacionais, decretos e as chamadas normas complementares.
  * **Normas Complementares (Art. 100 do CTN)**: Atos normativos expedidos pelas autoridades administrativas (portarias, instruções normativas), decisões dos órgãos singulares ou coletivos de jurisdição administrativa a que a lei atribua eficácia normativa, práticas reiteradas das autoridades e convênios entre a União, Estados, DF e Municípios.
  * **Efeito Protetivo do Art. 100, Parágrafo Único**: A observância de norma complementar exclui a imposição de penalidades, a cobrança de juros de mora e a atualização monetária da base de cálculo.

* **Relações entre o Direito Tributário e o Direito Privado (Arts. 108 a 110 do CTN)**:
  1. **Autonomia Dogmática Mitigada (Art. 109)**: Os princípios gerais de direito privado utilizam-se para pesquisa da definição, do conteúdo e do alcance dos seus institutos, conceitos e formas, mas não para a definição dos respectivos efeitos tributários.
  2. **Cláusula Pétrea de Inalterabilidade Conceitual (Art. 110 do CTN)**: A lei tributária **NÃO pode alterar a definição, o conteúdo e o alcance de institutos, conceitos e formas de direito privado**, utilizados expressa ou implicitamente pela Constituição Federal para definir ou limitar competências tributárias.
  * Exemplo Paradigmático no STF (RE 116.121 e Súmula Vinculante 31): O conceito civilista de "locação de bens móveis" não envolve obrigação de fazer (prestação de serviço humano). Logo, a lei municipal não pode alterar esse conceito para exigir ISS sobre locação de veículos ou equipamentos.

* **Integração e Interpretação (Arts. 108 e 111 do CTN)**:
  * Na ausência de disposição expressa, a autoridade competente usará sucessivamente: 1) analogia; 2) princípios gerais de direito tributário; 3) princípios gerais de direito público; 4) equidade.
  * **Vedações Absolutas**: O emprego da analogia NÃO poderá resultar na exigência de tributo não previsto em lei; o emprego da equidade NÃO poderá resultar na dispensa do pagamento de tributo devido.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Conceito Constitucionalizado dos Institutos de Direito Privado",
        author: "Ministro Marco Aurélio / STF Súmula Vinculante 31",
        thesis: "A Constituição recepcionou os conceitos de direito privado consolidados na tradição jurídica (ex.: faturamento, serviço, renda), sendo vedado ao legislador ordinário esgarçá-los para ampliar a tributação.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Autonomia Conceitual Plena do Direito Tributário",
        author: "Corrente Fiscalista Minoritária",
        thesis: "Sustenta que o direito tributário possui autonomia terminológica para redefinir qualquer conceito privatista conforme a capacidade contributiva.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "ARTIGO 110 DO CTN E COMPETÊNCIA CONSTITUCIONAL: A banca tenta induzir que o art. 110 proíbe qualquer alteração de conceito de direito privado. Cuidado: proíbe apenas quando o conceito foi utilizado pela CONSTITUIÇÃO para definir ou limitar competências tributárias.",
      "ANALOGIA E EQUIDADE: Afirmar que a equidade pode dispensar o pagamento do tributo em caso de contribuinte de baixa renda. Falso: o art. 108, § 2º do CTN veda expressamente a dispensa de tributo devido por equidade."
    ],
    careerNuances: {
      AGU: "Sustentação da higidez dos conceitos econômico-jurídicos federais na definição de contratos públicos e instrumentos de fomento.",
      PGFN: "Defesa técnica contínua nas teses tributárias perante o STF e STJ, diferenciando ingressos operacionais de faturamento nos termos do art. 110 do CTN.",
      PF: "Aplicação dos conceitos regulatórios e normas complementares no contencioso das autarquias arrecadadoras.",
      PBC: "Harmonização entre os conceitos de direito bancário privado e o regime de tributação e fiscalização do Sistema Financeiro Nacional."
    }
  },

  // =========================================================================
  // 49. DIREITO TRIBUTÁRIO: SISTEMA TRIBUTÁRIO NACIONAL E PRINCÍPIOS
  // =========================================================================
  {
    id: "tributario-principios-limitacoes",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Sistema Tributário Nacional: Princípios Fundamentais e Limitações do Poder de Tributar",
    themeKeywords: [
      "sistema tributário nacional", "princípios constitucionais tributários", "princípios constitucionais", 
      "princípios gerais e limitações", "limitações do poder de tributar", "limitações constitucionais ao poder de tributar",
      "legalidade", "legalidade tributária", "anterioridade", "anterioridade anual", "anterioridade nonagesimal", "noventena", 
      "irretroatividade", "irretroatividade tributária", "isonomia", "isonomia tributária", "capacidade contributiva", 
      "vedação ao confisco", "não cumulatividade", "seletividade", "impostos regulatórios", "artigo 150", "art. 150", "dupla garantia temporal"
    ],
    coreDoctrine: `#### 📚 Princípios Fundamentais e Limitações Constitucionais ao Poder de Tributar

* **Garantias Fundamentais e Cláusulas Pétreas (Art. 150 da CF/88)**:
  As limitações constitucionais ao poder de tributar constituem verdadeiras garantias individuais do contribuinte, revestidas de cláusula pétrea (art. 60, § 4º, IV da CF/88), conforme consolidado pelo STF (ADI 939).

* **Princípio da Legalidade Estrita (Tipicidade Fechada)**:
  * Regra: É vedado exigir ou aumentar tributo sem lei formal que o estabeleça (art. 150, I CF e art. 97 CTN).
  * Exceções mitigadas quanto à alteração de alíquotas pelo Poder Executivo: II, IE, IPI e IOF (art. 153, § 1º CF), além da CIDE-Combustíveis e do ICMS-Monofásico sobre combustíveis.

* **Princípios da Anterioridade Anual e Nonagesimal (Dupla Garantia Temporal)**:
  * **Anterioridade Anual (Art. 150, III, 'b')**: O tributo não pode ser cobrado no mesmo exercício financeiro em que haja sido publicada a lei que o instituiu ou aumentou.
  * **Anterioridade Nonagesimal / Noventena (Art. 150, III, 'c')**: Deve-se aguardar o prazo de 90 dias entre a publicação e a cobrança.
  * Regra Geral: As duas anterioridades são **cumulativas** — a cobrança só é legítima no exercício seguinte E após transcorridos no mínimo 90 dias da publicação da lei instituidora ou majoradora.

* **Matriz Comparativa de Exceções às Anterioridades (Quadro Estruturante Cebraspe/FGV)**:

| Tributo / Hipótese de Incidência | Anterioridade Anual (Exercício) | Anterioridade Nonagesimal (Noventena) | Aplicação Prática e Fundamento Constitucional |
| :--- | :---: | :---: | :--- |
| **II, IE, IOF e IEG (Imposto Extraordinário de Guerra)** | ❌ Dispensa | ❌ Dispensa | **Eficácia Imediata**: Finalidade extrafiscal urgente e defesa da soberania nacional (Art. 150, § 1º). |
| **IPI** | ❌ Dispensa | ✅ Exige 90 dias | **Apenas Noventena**: Mitigação para calibragem célere da política industrial (Art. 150, § 1º c/c 153, § 1º). |
| **Contribuições Sociais da Seguridade Social** | ❌ Dispensa | ✅ Exige 90 dias | **Apenas Noventena**: Regra autônoma da Seguridade Social estampada no Art. 195, § 6º da CF/88. |
| **CIDE-Combustíveis e ICMS-Combustíveis (Alíquotas)** | ❌ Dispensa | ✅ Exige 90 dias | **Apenas Noventena**: Restabelecimento e redução de alíquotas monofásicas (Arts. 177, § 4º e 155, § 4º). |
| **Imposto de Renda (IR)** | ✅ Exige Anual | ❌ Dispensa | **Apenas 1º de Janeiro**: Previsibilidade orçamentária do exercício (Art. 150, § 1º). |
| **IPTU e IPVA (Fixação da Base de Cálculo)** | ✅ Exige Anual | ❌ Dispensa | **Apenas Exercício Seguinte**: Atualização das plantas genéricas de valores fiscais (Art. 150, § 1º). |
| **IPTU e IPVA (Majoração de Alíquotas)** | ✅ Exige Anual | ✅ Exige 90 dias | **Cumulativa (Regra Geral)**: Exige a virada de exercício financeiro E o decurso mínimo de 90 dias. |
| **Demais Tributos (Regra Geral: ITCMD, ITBI, ISS, Taxas, Empréstimo Compulsório)** | ✅ Exige Anual | ✅ Exige 90 dias | **Cumulativa Plena**: Exige cumprimento rigoroso e simultâneo de ambas as garantias temporais. |

* **Capacidade Contributiva e Vedação ao Confisco**:
  * Os impostos terão caráter pessoal e serão graduados segundo a capacidade econômica do contribuinte (art. 145, § 1º da CF). Aplica-se também a taxas quando viável a parametrização (STF RE 406.955).
  * É vedado utilizar tributo com efeito de confisco (art. 150, IV da CF). A vedação ao confisco é aferida sobre a **carga tributária global** suportada pelo contribuinte em determinado período.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria da Aplicação da Capacidade Contributiva a Todos os Tributos",
        author: "STF (RE 406.955) / Ministro Joaquim Barbosa",
        thesis: "O princípio da capacidade contributiva aplica-se a todos os tributos, inclusive taxas e contribuições, sempre que a estrutura da hipótese de incidência permitir graduação equitativa.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria Restritiva aos Impostos",
        author: "Doutrina Tradicional Clássica",
        thesis: "Sustenta que o art. 145, § 1º limita expressamente a capacidade contributiva aos impostos, não sendo exigível em taxas.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "IPTU E IPVA: FIXAÇÃO DE BASE DE CÁLCULO VS ALÍQUOTA: A alteração da BASE DE CÁLCULO do IPTU/IPVA obedece apenas à anterioridade anual (dispensa noventena). Já o aumento de ALÍQUOTA do IPTU/IPVA obedece à anterioridade ANUAL E NONAGESIMAL cumulativamente.",
      "REVOGAÇÃO DE BENEFÍCIO FISCAL: A revogação ou redução de isenção ou benefício fiscal equivale a aumento indireto de tributo e deve obedecer à anterioridade (Tema 1.082 do STF)."
    ],
    careerNuances: {
      AGU: "Sustentação da constitucionalidade de medidas fiscais de emergência e respeito às regras de transição orçamentária anual.",
      PGFN: "Defesa intransigente dos marcos temporais de anterioridade nos litígios de grande impacto no STF (como nas alterações de PIS/Cofins e alíquotas de IOF).",
      PF: "Conformação das taxas de fiscalização autárquica aos limites da razoabilidade para afastar alegações de efeito confiscatório.",
      PBC: "Manejo das alíquotas regulatórias do IOF-Câmbio e Títulos Mobiliários com vigência imediata para política monetária."
    }
  },

  // =========================================================================
  // 50. DIREITO TRIBUTÁRIO: CONCEITO DE TRIBUTO E ESPÉCIES TRIBUTÁRIAS
  // =========================================================================
  {
    id: "tributario-tributo-especies",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Tributo: Conceito Legal (Art. 3º do CTN) e Teoria Pentapartida das Espécies",
    themeKeywords: [
      "tributo: conceito e espécies", "conceito de tributo", "espécies tributárias", "art. 3º", 
      "artigo 3º do ctn", "teoria pentapartida", "taxas", "preço público", "contribuição de melhoria", 
      "empréstimo compulsório", "pedágio", "impostos", "fato gerador de taxas", "art. 77"
    ],
    coreDoctrine: `#### 📚 Conceito Legal de Tributo e Espécies Tributárias

* **Elementos Estruturantes do Conceito de Tributo (Art. 3º do CTN)**:
  Tributo é toda prestação:
  1. **Pecuniária compulsória**: Obrigação ex lege que prescinde da vontade do obrigado.
  2. **Em moeda ou cujo valor nela se possa exprimir**: Veda o tributo in natura (bens ou serviços) ou in labore (trabalho braçal). A dação em pagamento de bens imóveis é forma de extinção admitida em lei (art. 156, XI).
  3. **Que não constitua sanção de ato ilícito**: Tributo não é multa. Multa tem caráter punitivo; tributo tem caráter contributivo. Todavia, vigora o princípio do **non olet** (art. 118 do CTN): a tributação incide sobre fatos econômicos independentemente da ilicitude ou validade do negócio subjacente (exemplo: tributação de rendimentos do tráfico ou jogo de azar).
  4. **Instituída em lei**: Princípio da estrita legalidade.
  5. **Cobrada mediante atividade administrativa plenamente vinculada**: A autoridade fiscal não tem discricionariedade quanto ao lançamento ou cobrança.

* **Teoria Pentapartida / Quinquipartida (Adotada pelo STF)**:
  O STF superou a teoria tripartite do art. 5º do CTN e consagrou que existem 5 espécies autônomas de tributo:
  1. **Impostos (Art. 16 do CTN)**: Tributos não vinculados a qualquer contraprestação estatal específica ao contribuinte.
  2. **Taxas (Art. 77 do CTN)**: Tributos vinculados ao exercício regular do poder de polícia ou à utilização, efetiva ou potencial, de serviço público específico e divisível (uti singuli).
  3. **Contribuições de Melhoria (Art. 81 do CTN)**: Decorrem de valorização imobiliária resultante de obras públicas (limite total do custo da obra e limite individual da valorização).
  4. **Empréstimos Compulsórios (Art. 148 da CF)**: Competência privativa da União por Lei Complementar em caso de guerra externa, calamidade pública ou investimento público de relevante interesse nacional.
  5. **Contribuições Especiais (Art. 149 da CF)**: Sociais, de intervenção no domínio econômico (CIDE) e de interesse de categorias profissionais ou econômicas.

* **Taxa vs. Preço Público (Tarifa) — Critério da Súmula 545 do STF**:
  * **Taxa**: Regime compulsório de direito público, criada por lei, devida pelo serviço público próprio e indelegável do Estado.
  * **Preço Público**: Regime contratual de direito privado, facultativo, decorrente da fruição de serviços públicos delegados ou atividades econômicas de mercado.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria Pentapartida das Espécies Tributárias (STF)",
        author: "Supremo Tribunal Federal (RE 146.733) / Geraldo Ataliba",
        thesis: "A Constituição Federal de 1988 consagrou 5 espécies tributárias com regimes jurídicos constitucionais próprios e inconfundíveis.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria Tripartite do Código Tributário Nacional",
        author: "Art. 5º do CTN clássico",
        thesis: "Reconhece apenas impostos, taxas e contribuições de melhoria, enquadrando os empréstimos compulsórios e contribuições como espécies de impostos.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "PRINCÍPIO DO NON OLET E ATOS ILÍCITOS: Dizer que o tráfico de drogas não pode ser tributado porque o tributo não constitui sanção de ato ilícito. Errado: o tributo não é sanção, mas incide sobre a riqueza econômica auferida independentemente da ilicitude (art. 118 do CTN).",
      "TAXA DE ILUMINAÇÃO PÚBLICA: As bancas afirmam que taxa de iluminação é constitucional. Falso: a iluminação pública é serviço uti universi (indivisível), vedada por taxa (Súmula Vinculante 41), sendo autorizada apenas a COSIP (art. 149-A)."
    ],
    careerNuances: {
      AGU: "Defesa da validade e distinção entre taxas administrativas e preços públicos nas concessões de infraestrutura federal.",
      PGFN: "Defesa da natureza jurídica das contribuições da Seguridade Social e CIDEs para resguardar a vinculação constitucional de receitas públicas.",
      PF: "Cobrança de taxas de poder de polícia ambiental (IBAMA), minerária (ANM) e sanitária (ANVISA).",
      PBC: "Regime de custeio e taxas de fiscalização do mercado financeiro e de pagamentos."
    }
  },

  // =========================================================================
  // 51. DIREITO TRIBUTÁRIO: RESPONSABILIDADE TRIBUTÁRIA E SÚMULA 435 STJ
  // =========================================================================
  {
    id: "tributario-responsabilidade",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Responsabilidade Tributária: Sucessores, Terceiros, Administradores e Grupo Econômico",
    themeKeywords: [
      "responsabilidade tributária", "responsabilidade dos sucessores", "responsabilidade de terceiros", 
      "responsabilidade por infrações", "responsabilidade de grupo econômico", "súmula 435", "art. 135", 
      "artigo 135 do ctn", "tema 981", "tema 962", "redirecionamento da execução fiscal", "denúncia espontânea", "art. 138"
    ],
    coreDoctrine: `#### 📚 Responsabilidade Tributária e Regime de Redirecionamento

* **Classificação Dogmática da Sujeição Passiva (Art. 121 do CTN)**:
  1. **Contribuinte (Direto)**: Possui relação pessoal e direta com a situação que constitui o fato gerador.
  2. **Responsável (Indireto)**: Sem revestir a condição de contribuinte, sua obrigação decorre de disposição expressa de lei.

* **Responsabilidade dos Sucessores (Arts. 129 a 133 do CTN)**:
  * **Imóveis (Art. 130)**: Os créditos tributários sub-rogam-se na pessoa dos adquirentes, salvo se constar da escritura certidão negativa de débitos.
  * **Arrematação em Hasta Pública (Art. 130, parágrafo único)**: A sub-rogação ocorre sobre o respectivo PREÇO pago na hasta, recebendo o arrematante o bem livre e desembaraçado de ônus tributários.
  * **Alienação de Estabelecimento Comercial (Art. 133)**: O adquirente responde integralmente se o alienante cessar a atividade; ou subsidiariamente se o alienante prosseguir ou reiniciar atividade em 6 meses.

* **Responsabilidade Pessoal dos Administradores e Sócios (Art. 135, III do CTN)**:
  * **Regra Fundamental (Súmula 430 do STJ)**: O mero inadimplemento da obrigação tributária pela pessoa jurídica NÃO gera por si só a responsabilidade pessoal dos sócios ou administradores.
  * **Requisitos do Art. 135, III**: Exige-se comprovação de que o administrador agiu com **excesso de poderes ou infração da lei, contrato social ou estatuto**.
  * **Dissolução Irregular (Súmula 435 do STJ)**: Presume-se dissolvida irregularmente a empresa que deixar de funcionar no seu domicílio fiscal sem comunicação aos órgãos competentes, legitimando o redirecionamento da execução fiscal para o sócio-gerente.
  * **Precedentes Qualificados do STJ (Temas 981 e 962)**:
    - *Tema 981*: O redirecionamento alcança o sócio que exercia a administração **ao tempo da dissolução irregular**, ainda que não gerenciasse à época do fato gerador.
    - *Tema 962*: O sócio que administrava no fato gerador, mas retirou-se regularmente da sociedade antes da dissolução, NÃO responde pelas dívidas fiscais.

* **Responsabilidade Solidária de Grupo Econômico (Tema 13 STJ e Art. 124 do CTN)**:
  O mero pertencimento a grupo econômico de fato ou de direito não acarreta responsabilidade tributária solidária automática (art. 124, I do CTN). Para a imputação de responsabilidade solidária aos integrantes do conglomerado empresarial, exige-se a demonstração de interesse comum na situação que constitua o fato gerador da obrigação principal, ou a comprovação de confusão patrimonial, fraude ou abuso da personalidade jurídica.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Teoria da Responsabilidade Subjetiva por Dissolução Ilícita (STJ Temas 981 e 962)",
        author: "Superior Tribunal de Justiça / 1ª Seção",
        thesis: "O ato ilícito gerador da responsabilidade pessoal do art. 135, III é a própria dissolução irregular, recaindo a execução sobre o gestor que a perpetrou.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Responsabilidade Solidária Automática",
        author: "Fisco Municipal e Estadual Minoritário",
        thesis: "Defende que todo administrador societário responde solidariamente pelo passivo tributário inadimplido.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "SÓCIO QUOTISTA NÃO GERENTE: As bancas afirmam que a execução fiscal pode ser redirecionada para qualquer sócio da empresa. Falso: só é cabível contra quem exercia poderes de administração ou gerência (Súmula 435 STJ).",
      "DENÚNCIA ESPONTÂNEA (ART. 138 CTN) E TRIBUTO DECLARADO: A entrega de declaração de débito (DCTF/GFIP) sem o respectivo pagamento afasta o benefício da denúncia espontânea (Súmula 360 do STJ)."
    ],
    careerNuances: {
      AGU: "Uniformização de teses para proteção do crédito público e combate a fraudes societárias estruturadas.",
      PGFN: "Atuação central da PGFN: manejo diário dos incidentes de redirecionamento, combate a grupos econômicos de fato e aplicação da Súmula 435 do STJ.",
      PF: "Responsabilização de gestores fraudulentos em execuções de créditos não tributários e multas autárquicas.",
      PBC: "Responsabilidade solidária de administradores de instituições financeiras sob intervenção ou liquidação extrajudicial (Lei 6.024/1974)."
    }
  },

  // =========================================================================
  // 52. DIREITO TRIBUTÁRIO: LEI DE EXECUÇÃO FISCAL E PRESCRIÇÃO INTERCORRENTE
  // =========================================================================
  {
    id: "tributario-execucao-fiscal",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Execução Fiscal (Lei nº 6.830/1980), Dívida Ativa, Redirecionamento e Prescrição Intercorrente",
    themeKeywords: [
      "lei nº 6.830/80", "lei 6.830", "execução fiscal", "dívida ativa tributária", "certidão de dívida ativa", 
      "prescrição intercorrente", "tema 566", "exceção de pré-executividade", "súmula 393", "penhora", 
      "arresto", "embargos à execução fiscal", "art. 185-a", "indisponibilidade de bens", "tema 444", "garantias da execução fiscal"
    ],
    coreDoctrine: `#### 📚 Lei de Execução Fiscal (LEF) e Precedentes Vinculantes do STJ

* **Certidão de Dívida Ativa (CDA) e Prerrogativas Processuais (Arts. 2º e 3º da LEF)**:
  A Dívida Ativa regularmente inscrita goza de presunção relativa de certeza e liquidez, que só pode ser ilidida por prova inequívoca a cargo do executado ou de terceiro interveniente. A nulidade da CDA pode ser sanada até a decisão de primeira instância mediante substituição, reabrindo-se prazo de defesa (art. 2º, § 8º).

* **Garantia do Juízo e Meios de Defesa**:
  1. **Embargos à Execução (Art. 16 da LEF)**: Prazo de 30 (trinta) dias contados do depósito, da juntada da prova da fiança bancária/seguro-garantia ou da intimação da penhora. A garantia integral do juízo é condição de procedibilidade dos embargos.
  2. **Exceção de Pré-Executividade (Súmula 393 do STJ)**: Cabível sem garantia do juízo quando versar sobre matérias de ordem pública (prescrição, decadência, ilegitimidade, nulidade formal da CDA) que NÃO demandem dilação probatória.
  3. **Indisponibilidade Universal de Bens (Art. 185-A do CTN)**: Medida extrema deferida após esgotadas as diligências executórias sem localização de bens e sem pagamento do débito.

* **Regime Vinculante da Prescrição Intercorrente (Art. 40 da LEF e Tema 566 do STJ)**:
  1. Não localizado o devedor ou não encontrados bens penhoráveis, o juiz suspenderá o curso da execução fiscal por **1 (um) ano**.
  2. Decorrido o prazo de 1 ano de suspensão sem localização de bens, inicia-se **automaticamente o prazo de 5 (cinco) anos de prescrição intercorrente**, independentemente de despacho judicial.
  3. O termo inicial da prescrição intercorrente é o fim do ano de suspensão.
  4. A efetiva constrição patrimonial interrompe a prescrição intercorrente retroativamente à data do requerimento da Fazenda.

* **Exceção de Pré-Executividade e Garantia do Juízo nos Embargos (Súmula 393 do STJ)**:
  A exceção de pré-executividade é admissível na execução fiscal relativamente às matérias de ordem pública cognoscíveis de ofício pelo magistrado (decadência, prescrição, ilegitimidade passiva manifesta, vício formal insanável da CDA), desde que não haja necessidade de dilação probatória. Por sua vez, a oposição de embargos à execução fiscal exige a prévia e integral garantia do juízo pela penhora, depósito em dinheiro ou fiança bancária/seguro garantia (art. 16, § 1º da Lei 6.830/1980).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Tese Vinculante da Fluência Automática da Prescrição (STJ Tema 566)",
        author: "Primeira Seção do STJ (Ministro Mauro Campbell Marques)",
        thesis: "O prazo de 1 ano de suspensão e o subsequente prazo de 5 anos de prescrição intercorrente fluem por expressa determinação legal, sendo desnecessária a intimação da Fazenda para início do cômputo.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Necessidade de Intimação Prévia para Cada Marco",
        author: "Corrente Fazendária Superada",
        thesis: "Exigia intimação pessoal da Fazenda Pública para cada termo de início, posição superada no julgamento repetitivo do Tema 566.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "PRAZO DOS EMBARGOS À EXECUÇÃO FISCAL: As bancas afirmam que os embargos têm prazo de 15 dias do CPC. Errado: no rito especial da LEF (art. 16), o prazo é especial de 30 dias contados da garantia do juízo.",
      "EXCEÇÃO DE PRÉ-EXECUTIVIDADE E PERÍCIA: Alegar que cabe exceção de pré-executividade para discutir base de cálculo com necessidade de laudo pericial contábil. Falso: a Súmula 393 exige prova pré-constituída sem dilação probatória."
    ],
    careerNuances: {
      AGU: "Orientação geral da Fazenda Nacional perante os tribunais regionais federais e STJ.",
      PGFN: "O núcleo do contencioso fiscal da PGFN: controle de legalidade da CDA, acompanhamento dos prazos do art. 40 da LEF e localização estratégica de patrimônio ocultado.",
      PF: "Cobrança da dívida ativa autárquica (IBAMA, CVM, INSS) sob o rito da Lei 6.830/1980.",
      PBC: "Execução fiscal de penalidades administrativas aplicadas pelo Bacen a instituições financeiras."
    }
  },

  // =========================================================================
  // 53. DIREITO TRIBUTÁRIO: COBRANÇA DA DÍVIDA ATIVA E TRANSAÇÃO PGFN
  // =========================================================================
  {
    id: "tributario-transacao-divida-ativa",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Cobrança da Dívida Ativa da União, Transação Tributária e Instrumentos Estratégicos da PGFN",
    themeKeywords: [
      "transação tributária", "lei nº 13.988", "portaria pgfn nº 6.757", "cobrança extrajudicial do crédito", 
      "dívida ativa da união", "averbação pré-executória", "negócio jurídico processual em matéria tributária", 
      "portarias pgfn nºs 33/2018", "procedimento administrativo de reconhecimento de responsabilidade", 
      "portaria pgfn nº 948/2017", "parr", "oferta antecipada de garantia", "cadin", "ajuizamento seletivo"
    ],
    coreDoctrine: `#### 📚 Transação Tributária e Inovações na Cobrança da Dívida Ativa da União

* **Marco Legal da Transação Tributária (Lei nº 13.988/2020 e Portaria PGFN nº 6.757/2022)**:
  A transação tributária consagra o consensualismo e a resolução amigável de litígios fiscais, permitindo a celebração de acordos resolutivos de débitos inscritos em Dívida Ativa da União.
  * **Modalidades**:
    1. Transação por adesão a edital publicado pela PGFN.
    2. Transação individual proposta pelo devedor ou pela PGFN.
    3. Transação no contencioso tributário de relevante e disseminada controvérsia jurídica.
  * **Limites Legais de Concessões**: É permitida a concessão de descontos em multas, juros e encargos legais de até 65% (elevado a 70% para pessoas físicas, microempresas e EPPs). **É VEDADA a redução do valor principal da obrigação tributária pura** (preservação do capital do tributo).
  * **Capacidade de Pagamento (CAPAG)**: A concessão de descontos e prazos diferenciados baliza-se na metodologia oficial de mensuração da CAPAG pela PGFN.

* **Instrumentos Extrajudiciais Estratégicos da PGFN**:
  1. **Averbação Pré-Executória (Portaria PGFN 33/2018)**: Notificação prévia do devedor e averbação da certidão de dívida ativa nos órgãos de registro público para prevenir a dilapidação patrimonial.
  2. **Negócio Jurídico Processual (NJP) em Matéria Tributária**: Acordos atípicos para escalonamento de garantias, amortização negociada e gestão de ativos (Portarias 33/2018 e 742/2018).
  3. **Procedimento Administrativo de Reconhecimento de Responsabilidade (PARR - Portaria PGFN nº 948/2017)**: Rito administrativo que assegura o contraditório para imputar responsabilidade a terceiros antes do ajuizamento da execução fiscal.
  4. **Oferta Antecipada de Garantia (OAG)**: Possibilidade de o devedor oferecer fiança bancária ou imóvel antes da execução para obtenção de CPD-EN.

* **Transação Tributária na Lei nº 13.988/2020 e Portaria PGFN nº 6.757/2022**:
  A transação individual ou por adesão na cobrança de créditos inscritos em Dívida Ativa da União viabiliza descontos sobre juros, multas e encargos legais de créditos classificados como irrecuperáveis ou de difícil recuperação (mensurados pela Capacidade de Pagamento - CAPAG do contribuinte), com prazos diferenciados de parcelamento, vedada a redução do montante principal do tributo. Constitui instrumento de resolução consensual e conformidade fiscal que prioriza a recuperação célere do crédito público.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Consensualismo Tributário Resolutivo (PGFN)",
        author: "Portaria PGFN 6.757/2022 / Lei 13.988/2020",
        thesis: "A transação não viola a indisponibilidade do patrimônio público, pois subordina-se a critérios objetivos de recuperabilidade do crédito e capacidade contributiva real.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Indisponibilidade Absoluta e Inflexível do Crédito",
        author: "Doutrina Tradicional Clássica",
        thesis: "Sustentava a impossibilidade de concessão de descontos em encargos e prazos fora de moratória geral.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "DESCONTO NO VALOR PRINCIPAL DO TRIBUTO: A banca tenta enganar o candidato afirmando que a transação pode reduzir o valor do tributo principal. Errado: a lei proíbe expressamente o perdão ou desconto do principal (apenas multas, juros e encargos).",
      "REQUISITOS DA TRANSAÇÃO: A transação tributária não implica renúncia de direito da Fazenda nem novação automática da dívida, condicionando-se ao cumprimento integral do plano de pagamento."
    ],
    careerNuances: {
      AGU: "Incentivo institucional à resolução consensual de conflitos no âmbito de toda a Advocacia Pública Federal.",
      PGFN: "Instrumento de vanguarda privativo da PGFN para recuperação recorde de créditos tributários e esvaziamento de acervos judiciais estéreis.",
      PF: "Utilização subsidiária de instrumentos consensuais para cobrança de créditos de autarquias federais.",
      PBC: "Mecanismos de termo de compromisso e acordos administrativos com o mercado financeiro."
    }
  },

  // =========================================================================
  // 54. DIREITO TRIBUTÁRIO: JURISPRUDÊNCIA DO STF E COISA JULGADA (TEMAS 881/885)
  // =========================================================================
  {
    id: "tributario-coisa-julgada-stf",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Jurisprudência Vinculante do STF, Modulação de Efeitos e Coisa Julgada em Matéria Tributária",
    themeKeywords: [
      "jurisprudência do stf", "modulação dos efeitos temporais", "coisa julgada em matéria tributária", 
      "tema 881", "tema 885", "cessação de efeitos", "trato continuado", "relativização da coisa julgada", 
      "art. 525, § 12", "art. 535, § 5º"
    ],
    coreDoctrine: `#### 📚 Coisa Julgada Tributária e Julgamento Histórico dos Temas 881 e 885 do STF

* **Tese Fixada nos Temas 881 e 885 do STF (Fevereiro de 2023)**:
  1. As decisões do Supremo Tribunal Federal em controle difuso com repercussão geral ou em controle concentrado de constitucionalidade **cessam automaticamente a eficácia temporal futura** de sentença transitada em julgado que tenha reconhecido a inexigibilidade de tributo recolhido em **relação jurídica tributária de trato continuado** (como CSLL, PIS e Cofins).
  2. **Desnecessidade de Ação Rescisória**: Não é necessário que o Fisco ajuíze ação rescisória para derrubar a coisa julgada individual; a eficácia da sentença individual cessa ipso facto a partir da publicação do acórdão do STF.
  3. **Respeito à Irretroatividade e Anterioridades**: A cessação dos efeitos opera para o futuro, devendo a cobrança do tributo pelo Fisco observar a irretroatividade e, conforme a natureza do tributo, a anterioridade anual e a nonagesimal.
  4. **Não Modulação**: O Plenário do STF rejeitou a modulação de efeitos, reafirmando que a higidez da concorrência e a isonomia fiscal (art. 150, II da CF) exigem que contribuintes em igual situação econômica paguem o mesmo tributo.

* **Inexigibilidade de Título Executivo Judicial Inconstitucional (Arts. 525, § 12 e 535, § 5º do CPC)**:
  Considera-se inexigível a obrigação reconhecida em título executivo judicial fundado em lei ou ato normativo considerado inconstitucional pelo Supremo Tribunal Federal, ou fundado em aplicação ou interpretação da lei tidas pelo STF como incompatíveis com a Constituição Federal.

* **Eficácia Vinculante e Coisa Julgada Tributária em Relações de Trato Sucessivo (STF Temas 881 e 885)**:
  A decisão transitada em julgado fundada em inconstitucionalidade ou constitucionalidade de tributo perde automaticamente sua eficácia vinculante executiva quando o Supremo Tribunal Federal, em sede de controle difuso com repercussão geral ou em controle concentrado, adota entendimento diametralmente oposto em relação jurídica tributária continuativa de trato sucessivo, observada a irretroatividade e as anterioridades anuais e nonagesimais pertinentes.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Cessação Automática por Mutação Constitucional Vinculante (Posição Vencedora do STF)",
        author: "Ministros Luís Roberto Barroso e Edson Fachin (STF Temas 881/885)",
        thesis: "A coisa julgada tributária contém a cláusula rebus sic stantibus. A superveniência de precedente vinculante do STF altera o estado de direito objetivo, cessando a eficácia da sentença anterior.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Imutabilidade Absoluta da Coisa Julgada sem Rescisória",
        author: "Corrente de Defesa dos Contribuintes (Voto Vencido)",
        thesis: "Sustentava que a segurança jurídica impediria a cessação de efeitos da coisa julgada individual sem a prévia desconstituição por ação rescisória no prazo de 2 anos.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "NECESSIDADE DE AÇÃO RESCISÓRIA: A banca afirma que a Fazenda Nacional precisa propor ação rescisória para cobrar tributo de contribuinte com decisão transitada em julgado contrária ao STF. Errado: nos Temas 881 e 885, o STF assentou a CESSAÇÃO AUTOMÁTICA sem necessidade de rescisória.",
      "ANTERIORIDADE NA VOLTA DA COBRANÇA: As bancas afirmam que o Fisco pode cobrar os atrasados retroativamente. Errado: a cobrança para o futuro deve respeitar a anterioridade anual ou nonagesimal aplicável à espécie."
    ],
    careerNuances: {
      AGU: "Marco definitivo de segurança jurídica no sistema de precedentes vinculantes de todos os órgãos federais.",
      PGFN: "Vitória histórica de dezenas de bilhões de reais para a PGFN, restabelecendo a igualdade concorrencial entre os contribuintes nacionais.",
      PF: "Aplicação do entendimento sobre a coisa julgada em relações de trato continuado de autarquias reguladoras.",
      PBC: "Estabilidade das regras de custeio e regulação fiscal do sistema de bancos e pagamentos."
    }
  },

  // =========================================================================
  // 55. DIREITO TRIBUTÁRIO: PROCESSO JUDICIAL TRIBUTÁRIO
  // =========================================================================
  {
    id: "tributario-processo-judicial",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Processo Judicial Tributário: Mandado de Segurança, Ação Anulatória, Repetição de Indébito e Cautelar Fiscal",
    themeKeywords: [
      "processo judicial tributário", "ações do fisco contra o contribuinte", "ações do contribuinte contra o fisco", 
      "mandado de segurança", "ação anulatória de débito fiscal", "ação declaratória de inexistência de relação jurídico-tributária", 
      "ação de repetição de indébito", "medida cautelar fiscal", "lei 8.397", "depósito integral", "súmula 112 do stj"
    ],
    coreDoctrine: `#### 📚 Ações Judiciais Tributárias do Contribuinte e do Fisco

* **Ações do Contribuinte contra o Fisco**:
  1. **Mandado de Segurança Tributário (Lei 12.016/2009)**:
     - Cabível para proteção de direito líquido e certo contra ato ilegal de autoridade fiscal (delegado da RFB, procurador da Fazenda).
     - **Vedações**: Não cabe concessão de liminar para compensação de créditos tributários (art. 7º, § 2º da LMS e Súmula 212 do STJ).
     - **Súmula 213 do STJ**: O mandado de segurança constitui ação adequada para a declaração do direito à compensação tributária com tributos vincendos.
  2. **Ação Anulatória de Débito Fiscal (Art. 38 da LEF)**:
     - Cabível após o lançamento tributário.
     - **O Depósito Integral (Art. 151, II do CTN e Súmula 112 do STJ)**: O depósito do montante integral e em dinheiro é faculdade do autor para suspender a exigibilidade do crédito, NÃO constituindo pressuposto processual ou condição de admissibilidade da ação anulatória.
  3. **Ação de Repetição de Indébito (Arts. 165 a 169 do CTN)**:
     - Restituição de valores recolhidos indevidamente ou a maior.
     - **Prazo Prescricional**: 5 (cinco) anos contados da data do pagamento indevido (art. 168 do CTN c/c LC 118/2005 e Tema 27 do STF - superada a tese dos 'cinco mais cinco').
     - **Correção Monetária (Taxa SELIC)**: A restituição do indébito tributário é corrigida exclusivamente pela Taxa SELIC a partir do recolhimento indevido (Súmula 523 do STF e repetitivos do STJ).

* **Ações do Fisco contra o Contribuinte**:
  1. **Execução Fiscal (Lei 6.830/1980)**: Cobrança forçada de CDA líquida e certa.
  2. **Medida Cautelar Fiscal (Lei 8.397/1992)**:
     - Procedimento cautelar ajuizado pela Fazenda Pública para decretação de indisponibilidade de bens do devedor.
     - **Hipóteses**: Ausência de domicílio certo, tentativa de alienação fraudulenta de patrimônio, débito superior a 30% do patrimônio líquido conhecido ou inadimplemento notificado.

* **Ação Anulatória de Débito Fiscal e Mandado de Segurança Tributário**:
  A propositura de ação anulatória de débito fiscal desacompanhada do depósito integral e em dinheiro do montante controvertido não suspende a exigibilidade do crédito tributário nem impede o ajuizamento da execução fiscal (Súmula 112 do STJ). No mandado de segurança tributário, a concessão de medida liminar suspende a exigibilidade do crédito (art. 151, IV do CTN), vedada a concessão de liminar para compensação de créditos tributários antes do trânsito em julgado (Súmula 212 do STJ).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Jurisprudência Consolidada sobre Compensação em Mandado de Segurança",
        author: "STJ (Súmula 213 c/c Súmula 212)",
        thesis: "O Judiciário pode declarar em MS o direito abstrato à compensação, remetendo a homologação dos cálculos e valores à esfera administrativa da autoridade fazendária.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Executividade Direta de Valores em MS",
        author: "Corrente Minoritária Superada",
        thesis: "Pretendia a apuração e liquidação imediata dos créditos de compensação na própria via estreita do mandado de segurança.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "DEPÓSITO COMO CONDIÇÃO DA AÇÃO ANULATÓRIA: As bancas afirmam que a ação anulatória exige depósito prévio. Errado: a Súmula Vinculante 28 do STF veda expressamente a exigência de depósito prévio de dinheiro como pressuposto de admissibilidade de ação judicial na qual se discuta exigibilidade de crédito tributário.",
      "PRAZO DA REPETIÇÃO DE INDÉBITO: Dizer que o prazo é de 10 anos pela tese dos 5 mais 5. Falso: desde a LC 118/2005 e o Tema 27 do STF, o prazo é estritamente de 5 anos do pagamento."
    ],
    careerNuances: {
      AGU: "Defesa das prerrogativas da Fazenda Pública na tutela coletiva e mandados de segurança coletivos.",
      PGFN: "Representação privativa da União perante a Justiça Federal e tribunais superiores em mandados de segurança e ações anulatórias de créditos bilionários.",
      PF: "Contestação de ações anulatórias contra autos de infração e multas de agências reguladoras federais.",
      PBC: "Defesa dos atos sancionadores e fiscalizatórios do Banco Central em mandados de segurança."
    }
  },

  // =========================================================================
  // 56. DIREITO TRIBUTÁRIO: IMPOSTOS FEDERAIS EM ESPÉCIE
  // =========================================================================
  {
    id: "tributario-impostos-federais",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Impostos Federais em Espécie: IRPJ, IRPF, IPI, IOF, ITR, II e IE",
    themeKeywords: [
      "impostos federais em espécie", "imposto sobre a renda", "irpf", "irpj", "ipi", "iof", "itr", 
      "imposto de importação", "imposto de exportação", "fato gerador", "base de cálculo", "contribuintes", 
      "acréscimo patrimonial", "art. 43 do ctn", "não cumulatividade do ipi", "seletividade do ipi"
    ],
    coreDoctrine: `#### 📚 Impostos Federais em Espécie (Art. 153 da CF/88)

* **Imposto sobre a Renda e Proventos de Qualquer Natureza (IR - Art. 153, III)**:
  * **Conceito Constitucional de Renda (Art. 43 do CTN)**: Aquisição da disponibilidade econômica ou jurídica de renda (produto do capital, trabalho ou combinação) ou proventos de qualquer natureza (acréscimos patrimoniais não compreendidos no conceito de renda).
  * **Princípios Estruturantes**: Generalidade (todas as pessoas), Universalidade (todas as rendas) e Progressividade (alíquotas maiores para rendas maiores).
  * **Não Incidência sobre Verbas Indenizatórias**: A indenização repõe patrimônio lesado sem gerar acréscimo patrimonial. Logo, não incide IRPF sobre indenização de férias não gozadas (Súmula 125 STJ), PDV (Súmula 215 STJ) e dano moral puro.

* **Imposto sobre Produtos Industrializados (IPI - Art. 153, IV)**:
  * Fato Gerador: Desembaraço aduaneiro ou saída do produto do estabelecimento industrial (art. 46 do CTN).
  * **Não Cumulatividade Obrigatória**: Compensação do imposto devido em cada operação com o montante cobrado nas anteriores (art. 153, § 3º, II).
  * **Seletividade Obrigatória**: O IPI será obrigatoriamente seletivo em função da essencialidade do produto (produtos básicos têm alíquota zero; supérfluos têm alíquota elevada).

* **Impostos Regulatórios de Comércio Exterior e Financeiro (II, IE e IOF)**:
  * Função predominantemente extrafiscal de regulação do balanço de pagamentos e da moeda.
  * O Poder Executivo pode alterar suas alíquotas nos limites legais sem necessidade de lei formal (art. 153, § 1º) e com cobrança imediata (sem anterioridade).

* **Imposto sobre a Propriedade Territorial Rural (ITR - Art. 153, VI)**:
  * Fato Gerador: Propriedade, domínio útil ou posse de imóvel rural localizado fora da zona urbana municipal.
  * **Progressividade Extrafiscal Obrigatória**: O ITR será progressivo com alíquotas mais altas para desestimular a manutenção de propriedades improdutivas (art. 153, § 4º, I).
  * **Convênio com Municípios**: Os Municípios podem optar por fiscalizar e cobrar o ITR, ficando com 100% da arrecadação (art. 153, § 4º, III).

* **Imposto sobre a Renda e Proventos de Qualquer Natureza (IR - Art. 153, III)**:
  O imposto de renda rege-se pelos critérios da generalidade (todos os sujeitos), universalidade (todas as rendas auferidas globalmente) e progressividade (art. 153, § 2º, I). O fato gerador consubstancia a aquisição da disponibilidade econômica ou jurídica de renda (produto do capital, do trabalho ou da combinação de ambos) ou de proventos de qualquer natureza (acréscimos patrimoniais não compreendidos no conceito de renda, art. 43 do CTN).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Conceito Constitucional de Renda como Acréscimo Patrimonial Líquido",
        author: "STF (RE 117.887) / Aliomar Baleeiro",
        thesis: "Não há incidência de imposto de renda sem que ocorra verdadeiro incremento financeiro líquido no patrimônio do contribuinte.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Renda como Mero Fluxo de Caixa Bruto",
        author: "Posição Fazendária Superada",
        thesis: "Pretendia a incidência sobre ingressos meramente contábeis, rejeitada no STF.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "SELETIVIDADE DO IPI VS ICMS: O IPI SERÁ obrigatoriamente seletivo (art. 153, § 3º, I da CF). O ICMS PODERÁ ser seletivo (art. 155, § 2º, III da CF). A banca troca as palavras 'será' e 'poderá'.",
      "MUNICÍPIOS E ITR: Se o Município não optar pelo convênio, ele fica com 50% do ITR arrecadado pela União (art. 158, II). Se optar pelo convênio para fiscalizar e cobrar, fica com 100% (art. 153, § 4º, III)."
    ],
    careerNuances: {
      AGU: "Defesa dos critérios de legalidade e extrafiscalidade das políticas tarifárias federais de comércio exterior.",
      PGFN: "Administração e execução contenciosa dos maiores tributos do país (IRPJ de grandes contribuintes, IPI, PIS/Cofins e ITR).",
      PF: "Fiscalização da afetação territorial rural em conjunto com o INCRA no manejo do ITR.",
      PBC: "Regulação cambial e monetária em estreita coordenação com as alíquotas do IOF."
    }
  },

  // =========================================================================
  // 57. DIREITO TRIBUTÁRIO: CONTRIBUIÇÕES SOCIAIS E TEMA 69 STF
  // =========================================================================
  {
    id: "tributario-contribuicoes-sociais",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Contribuições Sociais e de Seguridade em Espécie: PIS/COFINS (Tema 69 do STF), CSLL e CIDEs",
    themeKeywords: [
      "contribuições sociais em espécie", "contribuições de seguridade social", "pis", "cofins", 
      "tema 69", "tese do século", "exclusão do icms", "csll", "cide", "contribuições corporativas", 
      "contribuições de intervenção no domínio econômico", "cprb", "art. 195 da cf"
    ],
    coreDoctrine: `#### 📚 Contribuições Sociais e a Tese do Século (Tema 69 do STF)

* **Espécies de Contribuições Especiais (Art. 149 da CF/88)**:
  1. Contribuições Sociais (Seguridade Social e outras de relevância social).
  2. Contribuições de Intervenção no Domínio Econômico (CIDE-Combustíveis, CIDE-Remessas).
  3. Contribuições de Interesse das Categorias Profissionais ou Econômicas (Conselhos de classe, como CREA, CRM, etc., exceto OAB que tem natureza sui generis).
  4. Contribuição de Iluminação Pública (COSIP - Art. 149-A).

* **Contribuições para o Financiamento da Seguridade Social (Art. 195 da CF)**:
  * Financiamento por toda a sociedade, mediante recursos dos orçamentos públicos e contribuições:
    1. Do empregador/empresa sobre: a) folha de salários; b) receita ou faturamento; c) lucro (CSLL).
    2. Do trabalhador e demais segurados da previdência social.
    3. Sobre a receita de concursos de prognósticos (loterias).
    4. Do importador de bens ou serviços do exterior.
  * **Regime de Anterioridade Mitigada (Art. 195, § 6º da CF)**: As contribuições de seguridade social sujeitam-se APENAS à anterioridade nonagesimal de 90 dias, dispensada a anterioridade anual.

* **O Tema 69 do STF — Exclusão do ICMS da Base de Cálculo do PIS e da COFINS**:
  * **Tese Fixada pelo Pleno do STF**: *"O ICMS não compõe a base de cálculo para a incidência do PIS e da COFINS"*.
  * **Fundamento Central**: O ICMS destacado na nota fiscal não se incorpora ao patrimônio do contribuinte vendedor, constituindo mero ingresso contábil que transita temporariamente para ser repassado ao erário estadual. Logo, não configura "faturamento" nem "receita bruta" (art. 195, I, 'b').
  * **Qual ICMS deve ser excluído?**: O STF pacificou nos embargos de declaração que o ICMS a ser excluído é o **ICMS DESTACADO na nota fiscal**, e não o ICMS efetivamente pago.
  * **Modulação de Efeitos**: Produção de efeitos a partir de 15/03/2017 (data do julgamento de mérito), ressalvadas as ações judiciais e administrativas protocoladas até essa data.

* **Contribuição Social sobre o Lucro Líquido (CSLL) e CIDEs Constitucionais**:
  A CSLL incide sobre o lucro líquido do exercício antes da provisão para o imposto de renda, sujeitando-se unicamente à anterioridade nonagesimal (art. 195, § 6º da CF). As Contribuições de Intervenção no Domínio Econômico (CIDEs - art. 149 da CF) possuem destinação vinculada legalmente ao fomento, desregulamentação ou intervenção setorial da economia nacional, não se confundindo com taxas ou impostos.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Tese da Exclusão do ICMS Destacado (Posição Vinculante do STF)",
        author: "Plenário do STF (Relatora Ministra Cármen Lúcia / Tema 69)",
        thesis: "O ICMS destacado em nota fiscal não é receita própria da empresa, não podendo ser tributado pelo PIS/Cofins.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Receita Bruta Global",
        author: "Tese Fazendária Original da Receita Federal",
        thesis: "Sustentava que o preço total da mercadoria faturada ao consumidor abrangia o tributo embutido (cálculo por dentro).",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "ICMS DESTACADO VS PAGO: As bancas afirmam que o STF autorizou a exclusão apenas do ICMS recolhido/pago aos cofres estaduais. Errado: o STF fixou expressamente a exclusão do ICMS DESTACADO na nota fiscal.",
      "ANTERIORIDADE DAS CONTRIBUIÇÕES SOCIAIS: A banca tenta aplicar a anterioridade anual às contribuições de seguridade social. Falso: elas submetem-se apenas à noventena de 90 dias (art. 195, § 6º da CF)."
    ],
    careerNuances: {
      AGU: "Defesa dos parâmetros orçamentários da seguridade e estabilização de impactos jurisprudenciais bilionários.",
      PGFN: "Condução e cumprimento do Tema 69 do STF (Pareceres Vinculantes PGFN que autorizaram dispensa de contestar e aplicação direta administrativa pelo Fisco Federal).",
      PF: "Arrecadação e gestão de contribuições parafiscais arrecadadas por autarquias e fundações públicas federais.",
      PBC: "Regime de contribuições incidentes sobre o faturamento de cooperativas e entidades de crédito."
    }
  },


  // =========================================================================
  // 36. DIREITO FINANCEIRO: ATIVIDADE FINANCEIRA DO ESTADO, FONTES E PRINCÍPIOS
  // =========================================================================
  {
    id: "fin-atividade-fontes-principios",
    discipline: "DIREITO FINANCEIRO",
    title: "Atividade Financeira do Estado, Fontes e Princípios do Direito Financeiro",
    themeKeywords: [
      "direito financeiro: conceito e objeto", "conceito e objeto", "atividade financeira do estado", 
      "fontes do direito financeiro", "princípios do direito financeiro", "legalidade", "principio da legalidade",
      "reserva de lei", "transparência fiscal", "responsabilidade na gestao fiscal", "constitucionalismo financeiro",
      "receita publica", "despesa publica", "orcamento", "credito publico"
    ],
    coreDoctrine: `#### 📚 Atividade Financeira do Estado, Fontes e Princípios Estruturantes

* **Conceito e Objeto Dogmático**:
  O Direito Financeiro é o ramo do Direito Público que disciplina a **atividade financeira do Estado**, compreendida como o conjunto de atos estatais voltados a:
  1. **Obter receitas públicas** (tributárias, patrimoniais, creditícias e empresariais);
  2. **Criar e gerir o crédito público** (endividamento e emissão de títulos da dívida);
  3. **Dispor e gerir o patrimônio público**;
  4. **Despender recursos públicos** (despesa pública para concretização das necessidades coletivas e políticas públicas);
  5. **Planejar a atuação estatal** (orçamento público tridimensional: PPA, LDO e LOA).
  
  Diferencia-se do Direito Tributário pois este disciplina a relação jurídica entre Fisco e contribuinte (obrigação e lançamento), ao passo que o Direito Financeiro cuida da gestão interna dos recursos obtidos, sua alocação orçamentária e o controle fiscal dos gastos.

* **Competência Legislativa e Fontes Normativas**:
  * **Competência Legislativa Concorrente (CF, art. 24, I e II)**: Compete à União, aos Estados e ao DF legislar concorrentemente sobre direito financeiro e orçamento. A União edita normas gerais (CF, art. 24, § 1º) e os Estados exercem competência suplementar. Inexistindo lei federal de normas gerais, os Estados exercem competência legislativa plena (art. 24, § 3º), cuja eficácia fica suspensa naquilo que contrariar superveniente norma geral federal (§ 4º).
  * **Reserva de Lei Complementar Federal (CF, art. 163)**: Lei complementar federal de normas gerais disporá sobre finanças públicas, dívida pública, emissão de títulos e gestão fiscal. Atualmente, exercem esse papel a **Lei nº 4.320/1964** (recepcionada com status material de Lei Complementar) e a **Lei de Responsabilidade Fiscal (LC nº 101/2000)**.
  
* **Princípios Fundamentais do Direito Financeiro**:
  * **Princípio da Legalidade Financeira (Reserva de Lei Orçamentária)**: Nenhuma despesa pode ser criada ou executada sem prévia autorização na LOA ou em créditos adicionais (CF, art. 167, I e II).
  * **Princípio da Transparência e Responsabilidade Fiscal (LRF, art. 1º, § 1º)**: A responsabilidade na gestão fiscal pressupõe a ação planejada e transparente, em que se previnem riscos e corrigem desvios capazes de afetar o equilíbrio das contas públicas.
  * **Princípio da Economicidade (CF, art. 70)**: Exige a otimização da relação custo-benefício na aplicação do erário, impedindo gastos desproporcionais ou ineficientes.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Autonomia Científica do Direito Financeiro",
        author: "Aliomar Baleeiro / Kiyoshi Harada / STF",
        thesis: "O Direito Financeiro ostenta plena autonomia didática e dogmática em relação ao Direito Tributário e Constitucional, possuindo princípios próprios (exclusividade, não-afetação, equilíbrio orçamentário e responsabilidade fiscal).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Subordinação do Direito Financeiro ao Constitucional e Administrativo",
        author: "Doutrina Publicista Monista",
        thesis: "O Direito Financeiro seria mero capítulo instrumental do Direito Administrativo e Constitucional, não dispondo de densidade principiológica autônoma.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas costumam afirmar que Municípios possuem competência legislativa concorrente para normas de direito financeiro do art. 24 da CF (FALSO: o art. 24 inclui apenas União, Estados e DF; Municípios legislam com base no art. 30, I e II, sobre assuntos de interesse local e suplementando a legislação federal e estadual no que couber).",
      "Confundir a recepção da Lei 4.320/1964: ela foi editada formalmente como lei ordinária em 1964, mas foi MATERIALMENTE recepcionada pela CF/88 como Lei Complementar (art. 163 c/c art. 165, § 9º), exigindo lei complementar para sua revogação ou alteração de normas gerais."
    ],
    careerNuances: {
      PGFN: "A PGFN atua como órgão central de consultoria e contencioso fiscal da União. Sustente a higidez da Lei 4.320/64 e da LRF na preservação das competências do Tesouro Nacional, rechaçando leis estaduais que pretendam criar normas gerais financeiras derrogatórias do padrão federal.",
      AGU: "Defesa dos atos do Poder Executivo em matéria orçamentária e financeira perante o STF, afirmando a reserva de iniciativa do Presidente da República e a competência nacional da União para normas gerais.",
      PF: "Consultoria das autarquias e fundações federais na correta aplicação dos princípios de direito financeiro em convênios e descentralizações de créditos orçamentários.",
      PBC: "Articulação das diretrizes financeiras com a política monetária e cambial sob supervisão do Conselho Monetário Nacional."
    }
  },

  // =========================================================================
  // 37. DIREITO FINANCEIRO: FINANÇAS PÚBLICAS, DIREITOS FUNDAMENTAIS E CONTROLE
  // =========================================================================
  {
    id: "fin-financas-direitos-fundamentais-controle",
    discipline: "DIREITO FINANCEIRO",
    title: "Finanças Públicas, Direitos Fundamentais e Controle dos Gastos Públicos",
    themeKeywords: [
      "finanças públicas e direitos fundamentais", "financas publicas e direitos fundamentais", "direitos fundamentais", 
      "minimo existencial", "reserva do possivel", "escolhas tragicas", "judicializacao", "controle interno e externo", 
      "controle interno", "controle externo", "tribunal de contas", "tcu", "parecer previo", "julgamento de contas", "fiscalizacao contabil"
    ],
    coreDoctrine: `#### 📚 Finanças Públicas, Direitos Fundamentais e Controle Externo

* **Tensão Dialética: Mínimo Existencial vs Reserva do Possível**:
  * **Reserva do Possível (*Der Vorbehalt des Möglichen*)**: Construção do Tribunal Constitucional Federal Alemão (*BVerfG*, caso Numerus Clausus, 1972). Possui tríplice dimensão: fática (recursos materiais disponíveis no erário), jurídica (autorização orçamentária prévia - art. 167, II da CF) e razoabilidade da pretensão.
  * **Mínimo Existencial**: Núcleo essencial dos direitos fundamentais diretamente ancorado no princípio da dignidade da pessoa humana (CF, art. 1º, III). Abrange prestações materiais mínimas sem as quais o indivíduo não subsiste condignamente (saúde essencial, educação primária, alimentação e renda básica).
  * **Posição do STF**: A cláusula da reserva do possível não pode ser invocada pelo Poder Público como subterfúgio genérico ou escudo potestativo para se eximir do cumprimento de suas obrigações constitucionais básicas. Para obstar a intervenção judicial impositiva de prestações de saúde/educação, incumbe à Fazenda Pública demonstrar concretamente a escassez real e objetiva de recursos e o risco de desorganização do planejamento sanitário (Temas 6 e 1.234 da Repercussão Geral).

* **Teoria das Escolhas Trágicas (*Tragic Choices*)**:
  Formulada por Guido Calabresi e Philip Bobbitt, demonstra que a escassez estrutural de recursos públicos impõe escolhas trágicas à Administração, decidindo quem terá acesso prioritário a tratamentos ou bens escassos. Daí decorre a necessária autocontenção judicial para não desestruturar o orçamento sanitário.

* **Regime Constitucional de Controle dos Gastos Públicos**:
  * **Controle Interno (CF, art. 74)**: Cada Poder mantém sistema integrado de controle interno para avaliar o cumprimento das metas do PPA, comprovar a legalidade da gestão e apoiar o controle externo.
  * **Controle Externo (CF, arts. 70 e 71)**: Exercido pelo Congresso Nacional com o auxílio técnico do Tribunal de Contas da União (TCU).
  * **Dualidade de Atribuições do TCU**:
    1. **Apreciação das Contas de Governo do Presidente da República (art. 71, I)**: O TCU emite **parecer prévio** (opinativo) no prazo de 60 dias, cabendo o julgamento político exclusivamente ao Congresso Nacional (art. 49, IX).
    2. **Julgamento das Contas de Gestão dos Administradores Públicos (art. 71, II)**: O TCU **julga** as contas dos administradores e demais responsáveis por dinheiros, bens e valores públicos. A decisão que imputa débito ou multa tem **eficácia de título executivo extrajudicial (art. 71, § 3º da CF)**.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Inoponibilidade da Reserva do Possível ao Mínimo Existencial",
        author: "STF (Min. Celso de Mello / Min. Barroso)",
        thesis: "O mínimo existencial consubstancia parâmetro intangível que prevalece sobre juízos de conveniência orçamentária do governante, autorizando a determinação judicial de alocação de recursos em caso de omissão inescusável.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Prioridade Absoluta da Separação de Poderes e Discricionariedade Orçamentária",
        author: "Corrente Publicista Restritiva",
        thesis: "O Poder Judiciário não possui legitimidade democrática nem capacidade institucional para formular escolhas orçamentárias alocativas, devendo respeitar a soberania das prioridades eleitas na LOA.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que o TCU julga as contas do Chefe do Poder Executivo (FALSO: as contas do Presidente da República são julgadas exclusivamente pelo Congresso Nacional, emitindo o TCU mero parecer prévio opinativo em 60 dias).",
      "Afirmar que a execução de certidão de débito do TCU deve ser promovida pelo próprio TCU (FALSO: o TCU não tem personalidade jurídica própria para execução judicial; a cobrança judicial do título do TCU é atribuição privativa da AGU/PGFN, ou do ente prejudicado pela conduta ilícita segundo o Tema 642 do STF)."
    ],
    careerNuances: {
      PGFN: "Defesa técnica da estabilidade fiscal e da previsibilidade orçamentária, demonstrando que a reserva do possível exige comprovação pericial contábil e impedindo liminares temerárias que desviem dotações vinculadas.",
      AGU: "Execução judicial dos acórdãos condenatórios do TCU perante a Justiça Federal, sustentando a presunção de liquidez e certeza do título executivo extrajudicial administrativo.",
      PF: "Consultoria em processos de tomadas de contas especiais nas autarquias federais e mitigação de glosas orçamentárias.",
      PBC: "Atuação no controle externo dos fundos administrados pelo BACEN perante as Cortes de Contas."
    }
  },

  // =========================================================================
  // 38. DIREITO FINANCEIRO: ORÇAMENTO PÚBLICO, MODELO TRIDIMENSIONAL E CRÉDITOS
  // =========================================================================
  {
    id: "fin-orcamento-modelo-processo-creditos",
    discipline: "DIREITO FINANCEIRO",
    title: "Orçamento Público: Natureza Jurídica, Ciclo Orçamentário e Créditos Adicionais",
    themeKeywords: [
      "orçamento público: conceito e natureza jurídica", "orcamento publico: conceito e natureza juridica", 
      "orcamento publico", "orçamento público", "natureza juridica", "ppa", "ldo", "loa", 
      "plano plurianual", "diretrizes orcamentarias", "orcamentaria anual", "creditos adicionais", 
      "credito suplementar", "credito especial", "credito extraordinario", "principios orcamentarios", 
      "universalidade", "exclusividade", "anualidade", "nao afetacao", "unidade orcamentaria"
    ],
    coreDoctrine: `#### 📚 Orçamento Público: Modelo Constitucional, Princípios e Créditos Adicionais

* **Natureza Jurídica da Lei Orçamentária no Brasil**:
  * **Tese Tradicional do STF (Lei em Sentido Formal / Ato-Condição)**: Historicamente, o STF consagrou que a lei orçamentária ostenta natureza de lei formal, contendo autorização de gastos, desprovida de generalidade e abstração originárias (orçamento autorizativo).
  * **Evolução para o Orçamento Impositivo Mitigado**: Com as Emendas Constitucionais nº 86/2015, 100/2019, 105/2020 e 126/2022, o orçamento brasileiro adquiriu caráter progressivamente impositivo no tocante às emendas individuais (art. 166, §§ 9º e 11) e de bancada (§ 17), tornando obrigatória a execução das programações orçamentárias nelas contidas, ressalvados impedimentos de ordem técnica.

* **O Modelo Tridimensional do Planejamento Orçamentário (CF, art. 165)**:
  1. **Plano Plurianual (PPA - art. 165, § 1º)**: Vigência de 4 anos. Estabelece, de forma regionalizada, as diretrizes, objetivos e metas para as despesas de capital e outras delas decorrentes, e para os programas de duração continuada.
  2. **Lei de Diretrizes Orçamentárias (LDO - art. 165, § 2º)**: Vigência anual. Compreende as metas e prioridades da administração pública, orienta a elaboração da LOA, dispõe sobre alterações na legislação tributária e estabelece a política de aplicação das agências financeiras de fomento.
  3. **Lei Orçamentária Anual (LOA - art. 165, § 5º)**: Compreende:
     * O **Orçamento Fiscal** referente aos Poderes da União, seus fundos, órgãos e entidades da administração direta e indireta;
     * O **Orçamento de Investimento** das empresas em que a União, direta ou indiretamente, detenha a maioria do capital social com direito a voto;
     * O **Orçamento da Seguridade Social**, abrangendo todas as entidades e órgãos a ela vinculados.

* **Princípios Orçamentários Constitucionais**:
  * **Universalidade (art. 165, § 5º da CF c/c art. 2º da Lei 4.320/64)**: O orçamento deve conter todas as receitas e todas as despesas de todos os órgãos e Poderes.
  * **Exclusividade (art. 165, § 8º da CF)**: A LOA não conterá matéria estranha à previsão de receita e fixação de despesa, admitindo-se apenas duas ressalvas: autorização para abertura de créditos suplementares e contratação de operações de crédito, ainda que por antecipação de receita (ARO).
  * **Não Afetação da Receita de Impostos (art. 167, IV da CF)**: Veda a vinculação de receita de impostos a órgão, fundo ou despesa. Ressalvas estritas: repartição constitucional de receitas tributárias, saúde, educação, administração tributária e garantias a operações de crédito.
  * **Unidade / Totalidade**: Cada ente federado deve possuir apenas um único orçamento consolidado anual.

* **Regime dos Créditos Adicionais (Lei 4.320/1964, arts. 40 a 46)**:
  Autorizações de despesa não computadas ou insuficientemente dotadas na LOA:
  1. **Créditos Suplementares**: Destinados ao reforço de dotação orçamentária já existente. Exigem prévia autorização legislativa (pode constar na própria LOA) e indicação de recursos disponíveis. Vigência adstrita ao exercício.
  2. **Créditos Especiais**: Destinados a despesas para as quais não haja dotação orçamentária específica. Exigem autorização em lei específica e indicação de recursos. Se promulgados nos últimos 4 meses do exercício, podem ser reabertos no exercício seguinte até o limite do saldo.
  3. **Créditos Extraordinários (CF, art. 167, § 3º)**: Destinados a despesas urgentes e imprevisíveis (guerra, comoção interna ou calamidade pública). Abertos por **Medida Provisória** na União (ou Decreto nos entes sem MP), com vigência que pode ser prorrogada para o exercício seguinte se abertos nos últimos 4 meses.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Orçamento como Instrumento Vinculante Mitigado (STF Atual)",
        author: "STF (ADI 4.048 / ADPF 854)",
        thesis: "A lei orçamentária pode ser objeto de controle abstrato de constitucionalidade perante o STF quando ostentar efeitos concretos lesivos a preceitos constitucionais, afastando a antiga tese da irrecusável imunidade jurisdicional do orçamento.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Súmula 266 do STF e Inadmissibilidade de ADI contra Lei Orçamentária",
        author: "Jurisprudência Clássica Superada do STF",
        thesis: "Por se tratar de ato com efeitos concretos e eficácia temporária anual, a lei orçamentária não se submeteria ao controle concentrado perante o Pretório Excelso.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que créditos extraordinários exigem prévia aprovação de lei ordinária pelo Congresso Nacional (FALSO: na União, abrem-se mediante Medida Provisória pelo Presidente da República, com vigência e eficácia imediatas).",
      "Dizer que a vedação de vinculação de receitas abrange taxas e contribuições especiais (FALSO: o art. 167, IV proíbe expressamente a vinculação da receita de IMPOSTOS; contribuições e taxas podem ter sua receita vinculada a fundos e órgãos específicos)."
    ],
    careerNuances: {
      PGFN: "Assessoramento jurídico e controle de legalidade nos créditos adicionais e na elaboração da LDO e LOA sob a ótica do Ministério da Fazenda e do Tesouro Nacional.",
      AGU: "Defesa perante o STF da constitucionalidade das dotações da LOA contra ações que pretendam impor execução de despesas sem disponibilidade financeira.",
      PF: "Consultoria nos procedimentos de empenho e anulação de dotações orçamentárias de autarquias sob supervisão ministerial.",
      PBC: "Acompanhamento do Orçamento de Investimento das entidades financeiras públicas federais."
    }
  },

  // =========================================================================
  // 39. DIREITO FINANCEIRO: EMPRESAS ESTATAIS DEPENDENTES E NÃO DEPENDENTES
  // =========================================================================
  {
    id: "fin-empresas-estatais-dependentes",
    discipline: "DIREITO FINANCEIRO",
    title: "Empresas Estatais Dependentes e Não Dependentes na LRF",
    themeKeywords: [
      "empresas estatais dependentes e não dependentes", "empresas estatais dependentes", 
      "estatais nao dependentes", "estatal dependente", "artigo 2 da lrf", "repasses para custeio e pessoal", 
      "orcamento fiscal", "orcamento de investimento", "teto remuneratorio", "regime financeiro das estatais", "subvencao economica"
    ],
    coreDoctrine: `#### 📚 Empresas Estatais no Direito Financeiro: Dependentes vs Não Dependentes

* **Definição Legal da Empresa Estatal Dependente (LRF, art. 2º, III)**:
  Empresa controlada pelo Poder Público que receba do ente controlador recursos financeiros para:
  1. Pagamento de **despesas com pessoal**; ou
  2. Pagamento de **despesas de custeio em geral**; ou
  3. Despesas de **capital**, excluídas, neste último caso, as transferências destinadas a aumento de participação acionária.

* **Regime Financeiro Diferenciado**:
  * **Empresa Estatal Dependente**:
    * Integra plenamente o **Orçamento Fiscal e da Seguridade Social** da União, Estados ou Municípios (CF, art. 165, § 5º, I);
    * Suas despesas com pessoal submetem-se aos **limites globais de gastos com pessoal da LRF** do ente controlador (art. 18, § 1º);
    * Submete-se ao **teto remuneratório constitucional do art. 37, XI da CF** (conforme expressamente preconizado pelo art. 37, § 9º da CF);
    * Seus precatórios judiciais submetem-se ao regime público do art. 100 da CF quando prestadora de serviço público em regime não concorrencial (STF Tema 253 e Tema 1.050).
  * **Empresa Estatal Não Dependente**:
    * Mantém sua higidez econômico-financeira por receitas próprias de suas atividades operacionais no mercado;
    * Não integra o Orçamento Fiscal, figurando exclusivamente no **Orçamento de Investimento** das estatais (CF, art. 165, § 5º, II);
    * Suas despesas com pessoal não são computadas nos limites da LRF do ente político controlador;
    * Não se aplica o teto remuneratório constitucional aos seus empregados (art. 37, § 9º da CF), gozando de autonomia de gestão de salários de mercado.

* **Regime de Controle Financeiro das Empresas Estatais Dependentes**:
  A caracterização de empresa estatal como dependente atrai a incidência integral das restrições orçamentárias da LRF: inclusão obrigatória no Orçamento Fiscal e da Seguridade Social do ente controlador, cômputo das despesas com pessoal nos limites globais e prudenciais (art. 18 e 19 da LRF), submissão de seus empregados ao teto remuneratório constitucional do art. 37, XI da CF e proibição de contrair operações de crédito sem prévia autorização legal específica.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Submissão Automática das Estatais Dependentes aos Limites da LRF",
        author: "STF (ADI 2.238) / Tribunal de Contas da União",
        thesis: "O recebimento continuado de recursos do Tesouro para custeio atrai o regime financeiro público estrito, vedando o uso de personalidades jurídicas de direito privado para fraudar limites de responsabilidade fiscal.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Imunidade Societária das Estatais",
        author: "Corrente Empresarialista Isolada",
        thesis: "A forma societária de sociedade por ações (Lei 6.404/76) impediria a extensão de amarras orçamentárias públicas a empresas estatais independentemente de aportes.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que transferências para aumento de participação acionária tornam a empresa estatal dependente (FALSO: o art. 2º, III da LRF exclui expressamente os recursos para aumento de participação acionária da caracterização de estatal dependente).",
      "Afirmar que o teto constitucional do art. 37, XI se aplica a qualquer empresa pública ou sociedade de economia mista (FALSO: nos termos do art. 37, § 9º, o teto só se aplica às empresas estatais e subsidiárias que receberem recursos da Fazenda Pública para pagamento de pessoal ou de custeio em geral)."
    ],
    careerNuances: {
      PGFN: "Representação acionária da União nas assembleias de empresas estatais federais e controle da legalidade das subvenções econômicas concedidas pelo Tesouro Nacional.",
      AGU: "Defesa judicial da distinção entre estatais prestadoras de serviços públicos próprios e estatais exploradoras de atividade econômica em sentido estrito para fins de regime de precatórios.",
      PF: "Consultoria na estruturação de acordos de gestão e despesas de pessoal em subsidiárias e controladas.",
      PBC: "Supervisão da solidez financeira de instituições bancárias estatais não dependentes."
    }
  },

  // =========================================================================
  // 40. DIREITO FINANCEIRO: RECEITA PÚBLICA, CLASSIFICAÇÕES E RENÚNCIA FISCAL
  // =========================================================================
  {
    id: "fin-receita-publica-renuncia-fiscal",
    discipline: "DIREITO FINANCEIRO",
    title: "Receita Pública: Conceito, Classificações e Renúncia Fiscal (LRF art. 14)",
    themeKeywords: [
      "receita pública: conceito, classificações", "receita publica: conceito, classificacoes", 
      "receita publica", "receita originaria", "receita derivada", "classificacao economica", 
      "receitas correntes", "receitas de capital", "estagios da receita", "previsao", "lancamento", 
      "arrecadacao", "recolhimento", "renuncia de receita", "renúncia de receita", "artigo 14 da lrf", 
      "beneficio fiscal", "estimativa de impacto trienal", "medidas de compensacao"
    ],
    coreDoctrine: `#### 📚 Receita Pública e Disciplina Fiscal da Renúncia de Receitas (LRF, art. 14)

* **Conceito e Ingressos Públicos**:
  Receita pública em sentido estrito compreende todo ingresso financeiro definitivo que se integra ao patrimônio do ente estatal sem correspondente obrigação passiva ou condicionamento de devolução futura (diferenciando-se de meros ingressos provisórios ou movimentos de caixa, como fianças, depósitos judiciais e operações de crédito ARO).

* **Classificações Clássicas e Orçamentárias da Receita**:
  1. **Quanto à Origem Jurídica**:
     * **Receitas Originárias (de Direito Privado)**: Decorrem da exploração do patrimônio imobiliário ou mobiliário do Estado ou de suas empresas estatais em regime concorrencial (aluguéis, juros, dividendos, preços públicos e tarifas). Atuação do Estado *iure gestionis*.
     * **Receitas Derivadas (de Direito Público)**: Decorrem do constrangimento do patrimônio do particular sob o império do poder estatal (*iure imperii*), compreendendo os **tributos** e as **penalidades pecuniárias** (multas administrativas e tributárias).
  2. **Quanto à Categoria Econômica (Lei 4.320/1964, art. 11)**:
     * **Receitas Correntes**: Receitas tributárias, de contribuições, patrimonial, agropecuária, industrial, de serviços e transferências correntes. Destinam-se ao atendimento das despesas correntes de manutenção estatal.
     * **Receitas de Capital**: Provenientes de operações de crédito, alienação de bens móveis e imóveis, amortização de empréstimos concedidos e transferências de capital.

* **Estágios da Receita Pública**:
  1. **Previsão**: Estimativa inicial consignada na proposta orçamentária e aprovada na LOA;
  2. **Lançamento**: Ato administrativo vinculado que identifica a matéria tributável, o sujeito passivo e o montante exigível (art. 53 da Lei 4.320/64 c/c art. 142 do CTN);
  3. **Arrecadação**: Momento em que os agentes arrecadadores ou a rede bancária autorizada recebem os valores devidos pelos contribuintes;
  4. **Recolhimento**: Transferência financeira dos recursos arrecadados para a **Conta Única do Tesouro Nacional** (princípio da unidade de tesouraria - art. 56 da Lei 4.320/64).

* **Regime de Renúncia de Receitas (LRF, art. 14)**:
  A concessão ou ampliação de incentivo ou benefício de natureza tributária da qual decorra renúncia fiscal (anistia, remissão, subsídio, crédito presumido, isenção em caráter não geral, alteração de alíquota ou modificação de base de cálculo que reduza tributos) exige, cumulativamente:
  1. **Estimativa do impacto orçamentário-financeiro** no exercício em que deva iniciar sua vigência e nos dois seguintes;
  2. Atendimento ao disposto na **LDO**; e
  3. Pelo menos uma das seguintes condições alternativas:
     * **Condição I (art. 14, I)**: Demonstração de que a renúncia foi considerada na estimativa de receita da lei orçamentária anual e que não afetará as metas de resultados fiscais; OU
     * **Condição II (art. 14, II)**: Estar acompanhada de **medidas de compensação**, no mesmo exercício e nos dois seguintes, por meio do aumento de receita, decorrente da elevação de alíquotas, ampliação de base de cálculo ou criação de novos tributos. Neste caso, o benefício só entra em vigor quando implementadas as medidas compensatórias.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Eficácia Condicionada da Renúncia Fiscal à Compensação Efetiva",
        author: "STF (ADI 2.238 / ADI 5.814) / STJ",
        thesis: "A regra do art. 14 da LRF impõe eficácia suspensiva imediata: o benefício fiscal concedido sem o prévio cumprimento do impacto orçamentário e das medidas de compensação é inconstitucional e nulo de pleno direito.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Natureza Meramente Diretiva do Art. 14 da LRF",
        author: "Tese Fazendária Estadual Rejeitada",
        thesis: "Sustentava que as exigências do art. 14 seriam meras diretrizes programáticas de governança que não contaminariam a validade da lei tributária concessiva do benefício.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que a alteração de alíquota do II, IE, IPI e IOF para fins extrafiscais submete-se às condicionantes do art. 14 da LRF (FALSO: o § 3º, I do art. 14 afasta essas exigências no tocante a tributos de função marcadamente extrafiscal regulatória e ao cancelamento de débito irrelevante).",
      "Confundir as alternativas do art. 14: a estimativa trienal de impacto é SEMPRE OBRIGATÓRIA; o que é alternativo é a previsão do impacto na LOA (inciso I) OU a adoção de medidas compensatórias de aumento de tributos (inciso II)."
    ],
    careerNuances: {
      PGFN: "Análise prévia de impacto e higidez jurídica de renúncias fiscais federais (créditos presumidos, programas de desoneração da folha e incentivos regionais), resguardando as metas de superávit primário do Governo Central.",
      AGU: "Defesa da validade e eficácia das normas que revogam incentivos fiscais setoriais em prol do equilíbrio financeiro e da LRF.",
      PF: "Controle da arrecadação de receitas originárias patrimoniais de autarquias federais e taxas regulatórias.",
      PBC: "Gestão dos resultados financeiros e distribuição do resultado cambial positivo do BACEN para o Tesouro Nacional."
    }
  },

  // =========================================================================
  // 41. DIREITO FINANCEIRO: DESPESA PÚBLICA, DOCC E LIMITES DE PESSOAL (LRF)
  // =========================================================================
  {
    id: "fin-despesa-publica-docc-pessoal",
    discipline: "DIREITO FINANCEIRO",
    title: "Despesa Pública, DOCC e Limites de Gastos com Pessoal na LRF",
    themeKeywords: [
      "despesa pública: conceito, classificações", "despesa publica: conceito, classificacoes", 
      "despesa publica", "estagios da despesa", "fixacao", "empenho", "liquidacao", "pagamento", 
      "docc", "despesa obrigatoria de carater continuado", "artigo 17 da lrf", "limites de despesa com pessoal", 
      "limites de pessoal", "artigo 19 da lrf", "artigo 20 da lrf", "receita corrente liquida", "rcl", 
      "medidas de reducao", "artigo 23 da lrf"
    ],
    coreDoctrine: `#### 📚 Despesa Pública, Despesa Obrigatória Continuada (DOCC) e Limites de Pessoal

* **Estágios e Liquidação da Despesa Pública (Lei 4.320/1964, arts. 58 a 65)**:
  1. **Fixação**: Aprovação da dotação orçamentária máxima fixada na LOA;
  2. **Empenho (art. 58)**: Ato emanado de autoridade competente que cria para o Estado obrigação de pagamento pendente ou não de implemento de condição. É vedada a realização de despesa sem prévio empenho (art. 60). Modalidades:
     * *Ordinário*: Destinado a despesa de valor determinado e pagamento em parcela única;
     * *Estimativo*: Destinado a despesas cujo montante exato não se possa determinar previamente (serviços de energia, água, diárias);
     * *Global*: Destinado a despesas contratuais sujeitas a parcelamento (obras, locações e contratos continuados).
  3. **Liquidação (art. 63)**: Verificação do direito adquirido pelo credor tendo por base títulos, contratos ou comprovantes da prestação efetiva do serviço ou entrega do material.
  4. **Pagamento (art. 64)**: Emissão de ordem de pagamento bancária em favor do credor, estritamente após a regular liquidação.

* **Despesa Obrigatória de Caráter Continuado (DOCC - LRF, art. 17)**:
  Despesa corrente derivada de lei, medida provisória ou ato administrativo normativo que fixe para o ente obrigação legal de sua execução por um período **superior a 2 (dois) anos**.
  * **Requisitos Inafastáveis de Criação**:
    1. Estimativa do impacto orçamentário-financeiro no exercício de início e nos dois seguintes;
    2. Demonstração de que a criação não afetará as metas de resultados fiscais;
    3. Compensação de seus efeitos pelo aumento permanente de receita ou redução permanente de despesa.

* **Limites de Gastos com Pessoal na LRF (arts. 19 e 20)**:
  A despesa total com pessoal ativo e inativo em cada período de apuração (12 meses) não pode exceder os seguintes percentuais da **Receita Corrente Líquida (RCL)**:
  * **União**: 50% (Executivo: 40,9%; Judiciário: 6%; Legislativo/TCU: 2,5%; MPU: 0,6%);
  * **Estados**: 60% (Executivo: 49%; Judiciário: 6%; Legislativo/TCE: 3%; MPE: 2%);
  * **Municípios**: 60% (Executivo: 54%; Legislativo: 6%).

* **Escalonamento de Alerta, Limite Prudencial e Sanções**:
  * **Limite de Alerta (90% do limite máximo - art. 59, § 1º, II)**: O Tribunal de Contas emite notificação formal;
  * **Limite Prudencial (95% do limite máximo - art. 22, parágrafo único)**: Veda concessão de vantagens, aumentos salariais, criação de cargos, reestruturação de carreiras, provimento de cargos públicos (ressalvadas reposições de vacâncias em saúde, educação e segurança) e pagamento de horas extras.
  * **Extrapolação do Limite Máximo (art. 23 da LRF e art. 169 da CF)**: O excesso deve ser eliminado nos **dois quadrimestres seguintes, sendo pelo menos um terço no primeiro**, adotando-se sucessivamente:
    1. Redução de pelo menos 20% das despesas com cargos em comissão e funções de confiança;
    2. Exoneração de servidores não estáveis;
    3. Exoneração de servidores estáveis (mediante ato motivado e indenização de 1 mês por ano de serviço).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Inconstitucionalidade de Redução de Salários e Jornada para Adequação à LRF",
        author: "STF (ADI 2.238 - Julgamento de Mérito)",
        thesis: "O STF declarou inconstitucional o art. 9º, § 3º e o art. 23, § 2º da LRF na parte que autorizava a redução unilateral de jornada de trabalho com adequação proporcional de vencimentos dos servidores públicos, ante a garantia constitucional da irredutibilidade de vencimentos (CF, art. 37, XV).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Flexibilização Salarial em Crise Fiscal Extrema",
        author: "Texto Original da LRF",
        thesis: "Admitia que, antes de exonerar servidores estáveis, o administrador pudesse pactuar a redução temporária da jornada e remuneração para restabelecer a saúde das contas.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que a extrapolação do limite prudencial da LRF impede a nomeação de concursados para reposição de vacâncias de aposentadoria ou falecimento em saúde, educação e segurança (FALSO: o art. 22, parágrafo único, IV da LRF ressalva expressamente essas reposições essenciais).",
      "Dizer que o prazo para reconduzir os gastos com pessoal ao limite é de um ano (FALSO: nos termos do art. 23 da LRF, o excesso deve ser eliminado nos 2 quadrimestres subsequentes, sendo no mínimo 1/3 no 1º quadrimestre)."
    ],
    careerNuances: {
      PGFN: "Emissão de pareceres em projetos de lei que criam cargos e reajustes salariais federais, aferindo o estrito cumprimento da estimativa de impacto financeiro (art. 16 e 17 da LRF).",
      AGU: "Defesa dos atos da Presidência da República que barram despesas com pessoal aprovadas sem a correspondente indicação de fonte de compensação financeira permanente.",
      PF: "Consultoria em reestruturações funcionais autárquicas e gestão dos limites orçamentários setoriais da seguridade.",
      PBC: "Aplicação dos limites de pessoal aos quadros próprios do Banco Central do Brasil."
    }
  },

  // =========================================================================
  // 42. DIREITO FINANCEIRO: NOVO REGIME FISCAL, ARCABOUÇO FISCAL E EMENDAS
  // =========================================================================
  {
    id: "fin-novo-regime-arcabouco-emendas",
    discipline: "DIREITO FINANCEIRO",
    title: "Novo Regime Fiscal, Arcabouço Fiscal (LC 200/2023), Regra de Ouro e Emendas Impositivas",
    themeKeywords: [
      "novo regime fiscal", "teto de gastos", "orçamento de guerra", "orcamento de guerra", 
      "arcabouço fiscal", "arcabouco fiscal", "lei complementar 200/2023", "lc 200", "regra de ouro", 
      "artigo 167, iii", "operacoes de credito", "despesas de capital", "emendas impositivas", 
      "emendas individuais", "emendas de bancada", "transferencias especiais", "pix orcamentario", "adpf 854"
    ],
    coreDoctrine: `#### 📚 Arcabouço Fiscal Sustentável (LC 200/2023), Regra de Ouro e Emendas Impositivas

* **Evolução do Teto de Gastos para o Arcabouço Fiscal (LC nº 200/2023)**:
  * A EC nº 95/2016 instituiu o Novo Regime Fiscal com congelamento real das despesas primárias pela inflação (IPCA) por 20 anos.
  * A **Lei Complementar nº 200/2023** substituiu o antigo teto por um **Regime Fiscal Sustentável** baseado em:
    1. **Banda de Crescimento Real da Despesa Primária**: O crescimento anual das despesas fica limitado entre **0,6% (piso) e 2,5% (teto) acima da inflação**;
    2. **Parâmetro de Receita**: A despesa autorizada para o exercício pode crescer até **70% do crescimento real da receita primária** dos 12 meses anteriores se a meta fiscal de primário for cumprida; caso a meta não seja alcançada, o percentual cai para **50% do crescimento da receita**;
    3. **Gatilhos Automáticos de Contenção**: Mecanismos automáticos escalonados que limitam despesas não obrigatórias e reajustes salariais caso as metas de resultado primário sofram descumprimento sucessivo.

* **Regra de Ouro Constitucional (CF, art. 167, III)**:
  É vedada a realização de operações de créditos que excedam o montante das despesas de capital, ressalvadas as autorizadas mediante créditos suplementares ou especiais com finalidade precisa, aprovados pelo Poder Legislativo por **maioria absoluta**.
  * Finalidade dogmática: Impedir que o Estado se endivide para pagar despesas correntes de custeio (salários, benefícios e manutenção), exigindo que empréstimos financiem investimentos reprodutivos ou amortização da própria dívida.

* **Regime Constitucional das Emendas Impositivas**:
  * **Emendas Individuais (CF, art. 166, §§ 9º e 11)**: De execução obrigatória até o limite de 2% da receita corrente líquida do exercício anterior (sendo metade destinada à saúde pública).
  * **Transferências Especiais e Transferências com Finalidade Definida (CF, art. 166-A - EC 105/2019)**: As transferências especiais ('PIX Orçamentário') repassam recursos diretamente a Estados e Municípios sem celebração de convênio, mas permanecem sujeitas à fiscalização dos Tribunais de Contas e exigem transparência de plano de trabalho.
  * **Inconstitucionalidade das Emendas de Relator (RP 9) - STF ADPF 854**: O Plenário do STF declarou inconstitucional a sistemática das emendas de relator geral ('orçamento secreto') por incompatibilidade frontal com os princípios constitucionais da transparência, publicidade, impessoalidade e isonomia na distribuição de recursos públicos orçamentários.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Impositividade Mitigada por Impedimentos Técnicos Reais",
        author: "STF (ADI 5.468 / ADPF 854)",
        thesis: "A obrigatoriedade de execução das emendas parlamentares cede diante de impedimentos de ordem técnica insuperáveis (incompatibilidade com o PPA, inexistência de projeto executivo, inadimplência federativa ou frustração de receitas).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Execução Mecânica Incondicional de Emendas Parlamentares",
        author: "Corrente Parlamentarista Estrita",
        thesis: "Sustentava que o Poder Executivo não possuiria qualquer discricionariedade técnica para reter o pagamento de emendas impositivas uma vez sancionada a LOA.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que a superação da Regra de Ouro pode ser feita por lei ordinária por maioria simples (FALSO: o art. 167, III exige crédito suplementar ou especial com finalidade precisa aprovado por MAIORIA ABSOLUTA do Congresso Nacional).",
      "Afirmar que as emendas parlamentares na modalidade transferência especial (PIX) dispensam qualquer prestação de contas (FALSO: o STF determinou a obrigatoriedade de transparência, publicidade dos beneficiários finais e fiscalização pelo TCU e Tribunais de Contas locais)."
    ],
    careerNuances: {
      PGFN: "Estruturação das operações de crédito público para cumprimento milimétrico da Regra de Ouro e controle da aderência fiscal da LOA aos limites da LC 200/2023.",
      AGU: "Atuação direta perante o STF nas ações de controle concentrado sobre emendas impositivas e execução das decisões da ADPF 854.",
      PF: "Consultoria nos órgãos federais recebedores de descentralizações de emendas parlamentares com finalidade vinculada.",
      PBC: "Emissão de pareceres técnicos sobre o impacto das regras fiscais nas operações de mercado aberto e títulos soberanos."
    }
  },

  // =========================================================================
  // 43. DIREITO FINANCEIRO: DÍVIDA PÚBLICA, PRECATÓRIOS E RESTOS A PAGAR
  // =========================================================================
  {
    id: "fin-divida-publica-precatorios-restos",
    discipline: "DIREITO FINANCEIRO",
    title: "Dívida Pública, Regime Constitucional de Precatórios (CF art. 100) e Restos a Pagar",
    themeKeywords: [
      "dívida pública: conceito, natureza jurídica e espécies", "divida publica: conceito, natureza juridica e especies", 
      "divida publica", "divida consolidada", "divida flutuante", "precatorios", "precatórios", 
      "artigo 100 da cf", "emenda constitucional 113", "emenda constitucional 114", "rpv", 
      "requisicao de pequeno valor", "ordem cronologica", "sumula vinculante 17", "restos a pagar", 
      "artigo 42 da lrf", "disponibilidade de caixa"
    ],
    coreDoctrine: `#### 📚 Dívida Pública, Regime de Precatórios (CF, art. 100) e Restos a Pagar

* **Conceito e Espécies de Dívida Pública**:
  * **Dívida Flutuante (Lei 4.320/1964, art. 92)**: Passivos de curto prazo que não dependem de autorização orçamentária prévia para sua amortização rápida: restos a pagar, serviços da dívida a pagar, depósitos e operações de crédito por antecipação de receita (ARO).
  * **Dívida Fundada ou Consolidada (LRF, art. 29, I)**: Obrigações financeiras assumidas em virtude de leis, contratos, convênios ou títulos públicos, para amortização em prazo **superior a 12 (doze) meses**.

* **Regime Constitucional dos Precatórios (CF, art. 100 com alterações das ECs 113 e 114)**:
  1. **Ordem Cronológica e Precedência de Créditos Alimentares**: Pagamentos ordenados rigorosamente pela ordem de apresentação, gozando os créditos alimentares (salários, aposentadorias, indenizações por morte/invalidez) de preferência sobre os comuns.
  2. **Superpreferência Humanitária (CF, art. 100, § 2º)**: Débitos alimentares cujos titulares tenham 60 anos de idade, sejam portadores de doença grave ou pessoas com deficiência serão pagos com preferência sobre todos os demais débitos, até o valor equivalente ao **triplo da RPV**, admitido o fracionamento do crédito para este fim exclusivo.
  3. **Prazo Constitucional de Inclusão e Pagamento (CF, art. 100, § 5º)**:
     * Precatórios apresentados perante o Tribunal até **2 de abril** devem ser incluídos na LOA e pagos impreterivelmente até o final do exercício financeiro seguinte (31 de dezembro).
  4. **Juros de Mora e Súmula Vinculante nº 17 do STF**:
     * Durante o período constitucional compreendido entre 2 de abril e o final do exercício seguinte, **não incidem juros de mora**, incidindo apenas correção monetária.
  5. **Atualização Monetária e Compensação (EC 113/2021 e julgamento da ADI 7.064 pelo STF)**:
     * Para fins de atualização monetária, remuneração do capital e compensação da mora, haverá a incidência da **taxa referencial do Sistema Especial de Liquidação e de Custódia (SELIC)**, acumulada mensalmente, a partir da fixação judicial.
     * O STF na **ADI 7.064** declarou inconstitucional o teto limitador de pagamento de precatórios introduzido pelas ECs 113 e 114, restabelecendo a obrigatoriedade da quitação integral do estoque para evitar 'calote institucional'.

* **Disciplina de Restos a Pagar e o Artigo 42 da LRF**:
  * **Conceito (art. 36 da Lei 4.320/64)**: Despesas empenhadas mas não pagas até o dia 31 de dezembro de cada exercício:
    * *Restos a Pagar Processados*: A despesa foi regular e formalmente liquidada dentro do exercício;
    * *Restos a Pagar Não Processados*: Houve o empenho, mas a liquidação não se aperfeiçoou no exercício corrente.
  * **Vedação dos Últimos 8 Meses de Mandato (LRF, art. 42)**: É vedado ao titular de Poder ou órgão, nos últimos dois quadrimestres do seu mandato, contrair obrigação de despesa que não possa ser integralmente cumprida dentro dele, ou que tenha parcelas a serem pagas no exercício seguinte sem que haja suficiente **disponibilidade de caixa**.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Inconstitucionalidade do Calote de Precatórios (STF ADI 7.064)",
        author: "STF (Plenário / Min. Luís Roberto Barroso)",
        thesis: "A imposição de limites ou subtetos para postergar o adimplemento tempestivo de precatórios constitui violação frontal à coisa julgada, à segurança jurídica e ao princípio da separação de poderes.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Sustentabilidade Fiscal Emergencial dos Precatórios",
        author: "Defesa Governamental das ECs 113 e 114",
        thesis: "Sustentava que a explosão das dívidas judiciais justificava moratória extraordinária para viabilizar gastos sociais emergenciais e programas de transferência de renda.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que incidem juros de mora durante o prazo constitucional de pagamento do precatório (FALSO: a Súmula Vinculante 17 veda juros de mora no período do art. 100, § 5º da CF; os juros só voltam a incidir se houver mora e inadimplemento após o fim do exercício seguinte).",
      "Dizer que a superpreferência do art. 100, § 2º autoriza a quitação ilimitada do valor integral do precatório (FALSO: é limitada ao valor equivalente ao triplo do montante fixado em lei para a requisição de pequeno valor - RPV)."
    ],
    careerNuances: {
      PGFN: "Gestão do passivo judicial tributário em precatórios e promoção de acordos diretos com deságio regulamentado (art. 100, § 20 da CF) perante a Câmara de Conciliação e Pagamento de Precatórios.",
      AGU: "Defesa dos cálculos da Fazenda Nacional na impugnação ao cumprimento de sentença de precatórios, aplicação da taxa SELIC e expurgo de anatocismo.",
      PF: "Gestão das requisições de pequeno valor e precatórios no orçamento descentralizado das autarquias federais.",
      PBC: "Pagamento das ordens judiciais expedidas em face da autarquia monetária federal."
    }
  },

  // =========================================================================
  // 44. DIREITO ECONÔMICO: ORDEM ECONÔMICA CONSTITUCIONAL E REGIME DAS ESTATAIS
  // =========================================================================
  {
    id: "eco-ordem-economica-intervencao-estatais-regulacao",
    discipline: "DIREITO ECONÔMICO",
    title: "Ordem Econômica Constitucional, Intervenção Estatal e Estatuto das Estatais (Lei 13.303/2016)",
    themeKeywords: [
      "direito econômico: objeto", "direito economico: objeto", "ordem econômica constitucional", 
      "ordem economica constitucional", "intervenção do estado na economia", "intervencao do estado na economia", 
      "artigo 170", "artigo 173", "artigo 174", "livre iniciativa", "funcao social da propriedade", 
      "livre concorrencia", "monopolio da uniao", "artigo 177", "empresas estatais", "lei 13.303/2016", 
      "lei das estatais", "sociedade de economia mista", "empresa publica", "direito da regulacao", 
      "agencias reguladoras", "planejamento economico", "capital estrangeiro", "direito economico internacional"
    ],
    coreDoctrine: `#### 📚 Ordem Econômica Constitucional, Intervenção do Estado e Empresas Estatais

* **Princípios da Ordem Econômica Constitucional (CF, art. 170)**:
  A ordem econômica, fundada na **valorização do trabalho humano** e na **livre iniciativa**, tem por fim assegurar a todos existência digna, conforme os ditames da justiça social, observados os seguintes princípios reitores:
  1. Soberania nacional;
  2. Propriedade privada e sua Função social;
  3. **Livre concorrência**;
  4. Defesa do consumidor;
  5. Defesa do meio ambiente (inclusive mediante tratamento diferenciado conforme o impacto ambiental de bens e serviços);
  6. Redução das desigualdades regionais e sociais;
  7. Busca do pleno emprego;
  8. Tratamento favorecido para as empresas de pequeno porte.

* **Modalidades de Intervenção do Estado no Domínio Econômico**:
  * **Intervenção Indireta (Estado Regulador - CF, art. 174)**: Como agente normativo e regulador da atividade econômica, o Estado exerce as funções de **fiscalização, incentivo (fomento) e planejamento**, sendo este determinante para o setor público e indicativo para o setor privado. A regulação setorial é delegada às **Agências Reguladoras** dotadas de independência funcional e mandatos fixos de sua diretoria (Lei nº 13.848/2019).
  * **Intervenção Direta (Estado Agente Econômico)**:
    1. **Monopólio da União (CF, art. 177)**: Pesquisa e lavra das jazidas de petróleo, gás natural e outros hidrocarbonetos fluidos; refinação; importação/exportação e transporte de gás natural e petróleo; pesquisa, lavra e enriquecimento de minérios nucleares. O monopólio é da União (ente político), não da Petrobras (empresa estatal que atua sob regime de concessão e partilha de produção).
    2. **Exploração Direta de Atividade Econômica em Concorrência (CF, art. 173)**: A exploração direta só é permitida quando necessária aos **imperativos da segurança nacional ou a relevante interesse coletivo**, conforme definidos em lei.

* **Regime Jurídico das Empresas Estatais (CF, art. 173 c/c Lei nº 13.303/2016)**:
  * **Regime Híbrido com Predominância do Direito Privado (art. 173, § 1º, II)**: A empresa pública e a sociedade de economia mista sujeitam-se ao regime jurídico próprio das empresas privadas, inclusive quanto aos direitos e obrigações civis, comerciais, trabalhistas e tributários.
  * **Vedação de Privilégios Fiscais (art. 173, § 2º)**: Não poderão gozar de privilégios fiscais não extensivos às do setor privado.
  * **Estatuto Jurídico das Estatais (Lei nº 13.303/2016)**: Disciplina governança corporativa, compliance, licitações próprias e critérios rigorosos de nomeação para diretoria e conselho de administração (STF na **ADI 7.331** declarou a inconstitucionalidade das vedações absolutas para nomeação de dirigentes partidários que violavam a presunção de idoneidade moral, preservando a exigência de capacitação técnica).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Extensão da Imunidade Tributária Recíproca a Estatais Prestadoras de Serviços Públicos",
        author: "STF (Tema 508 / RE 253.472 / ECT e INFRAERO)",
        thesis: "A empresa pública prestadora de serviço público essencial em regime de monopólio e não concorrencial é beneficiária da imunidade tributária recíproca do art. 150, VI, 'a' da CF e do regime de precatórios (art. 100), pois não atua em regime de mercado visando ao lucro.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Interpretação Literal do Art. 173, § 2º da CF",
        author: "Doutrina Fazendária Municipal e Estadual",
        thesis: "Sustentava que a natureza jurídica de direito privado das empresas estatais impediria qualquer privilégio tributário ou processual, devendo ser tributadas por IPTU e ISS independentemente do serviço prestado.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que o planejamento econômico estatal é obrigatório/determinante para a iniciativa privada (FALSO: nos termos do art. 174 da CF, o planejamento é DETERMINANTE para o setor público e INDICATIVO para o setor privado).",
      "Dizer que o monopólio do petróleo pertence à Petrobras (FALSO: o monopólio constitucional do art. 177 pertence à UNIÃO; a Petrobras é sociedade de economia mista que executa atividades monopolizadas em regime de concessão outorgada pela ANP)."
    ],
    careerNuances: {
      PGFN: "Orientação societária nos conselhos fiscais e de administração das estatais federais e consultoria nas operações de concessão de crédito do Tesouro Nacional.",
      AGU: "Defesa judicial das diretrizes regulatórias fixadas pelos ministérios supervisores e defesa dos atos da ANP, ANATEL e ANEEL.",
      PF: "Consultoria jurídica das agências reguladoras federais no exercício do poder de polícia setorial e aplicação de sanções administrativas.",
      PBC: "Supervisão da governança das instituições financeiras públicas e privadas perante o Conselho Monetário Nacional."
    }
  },

  // =========================================================================
  // 45. DIREITO ECONÔMICO: SFN, AUTONOMIA DO BACEN, SIGILO BANCÁRIO E CADE
  // =========================================================================
  {
    id: "eco-sfn-bacen-mercados-concorrencia-cade",
    discipline: "DIREITO ECONÔMICO",
    title: "Sistema Financeiro Nacional, BACEN, Mercados Regulados e Direito da Concorrência (CADE)",
    themeKeywords: [
      "sistema financeiro nacional", "sfn", "artigo 192", "banco central do brasil", "bacen", 
      "lei complementar 179/2021", "autonomia do bacen", "sigilo bancario", "lei complementar 105/2001", 
      "tema 225 stf", "direito da concorrência", "direito da concorrencia", "lei 12.529/2011", 
      "cade", "tribunal administrativo", "superintendencia-geral", "departamento de estudos economicos", 
      "cartel", "acordo de leniencia", "atos de concentracao", "politica monetaria", "mercado de cambio", 
      "mercado de capitais", "sistema financeiro de habitacao", "regime prudencial", "regime interventivo", 
      "regime sancionador", "sistema nacional de seguros privados"
    ],
    coreDoctrine: `#### 📚 Sistema Financeiro Nacional, Autonomia do BACEN e Sistema Antitruste (CADE)

* **Sistema Financeiro Nacional (CF, art. 192)**:
  Estruturado de forma a promover o desenvolvimento equilibrado do País e a servir aos interesses da coletividade, regulado por leis complementares. O art. 192 teve revogado pela EC nº 40/2003 o antigo parágrafo que limitava os juros reais a 12% ao ano (Súmula Vinculante nº 7 do STF: a norma dependia de lei complementar).

* **Autonomia Institucional do Banco Central do Brasil (LC nº 179/2021)**:
  * O BACEN é autarquia especial dotada de autonomia técnica, operacional, administrativa e financeira, sem vinculação a Ministério ou tutela hierárquica ministerial.
  * **Mandato Fixo Não Coincidente**: Presidente e Diretores possuem mandatos fixos de 4 (quatro) anos, com recondução autorizada por igual período, escalonados de modo que a investidura do Presidente do BACEN ocorre no primeiro dia do terceiro ano do mandato do Presidente da República.
  * O STF na **ADI 6.890** declarou a plena constitucionalidade da LC 179/2021, afirmando a higidez do projeto de iniciativa parlamentar e a compatibilidade do modelo com a estabilidade de preços e controle da inflação.

* **Sigilo Bancário e Transferência de Informações Fiscais (LC 105/2001 e Tema 225 do STF)**:
  * O art. 6º da Lei Complementar nº 105/2001 autoriza a Receita Federal e os fiscos a requisitar informações bancárias diretamente das instituições financeiras, quando houver processo administrativo instaurado ou procedimento fiscal em curso.
  * **Tese Vinculante do STF (Tema 225)**: O repasse de informações financeiras diretamente ao Fisco sem prévia autorização judicial é **constitucional**, pois configura mera transferência de sigilo de um ambiente protegido para outro igualmente obrigado a guardar sigilo fiscal, sem violação ao direito à intimidade do art. 5º, X da CF.

* **Sistema Brasileiro de Defesa da Concorrência - SBDC (Lei nº 12.529/2011 e CADE)**:
  * **Estrutura Tripartite do CADE**:
    1. **Tribunal Administrativo de Defesa Econômica (TADE)**: Órgão judicante colegiado que julga infrações à ordem econômica e atos de concentração econômica;
    2. **Superintendência-Geral (SG)**: Instrui processos administrativos sancionadores, investiga cartéis e realiza o controle prévio de atos de concentração;
    3. **Departamento de Estudos Econômicos (DEE)**: Presta subsídios econômicos quantitativos e mercadológicos às decisões do CADE.
  * **Controle Prévio de Concentrações Econômicas (art. 88)**: Controle *ex ante* obrigatório quando preenchidos cumulativamente os critérios de faturamento dos grupos econômicos participantes (pelo menos um grupo com faturamento anual igual ou superior a R$ 750 milhões e outro com R$ 75 milhões no ano anterior). Prazo legal de análise de 240 dias, prorrogável por até 90 dias.
  * **Repressão a Cartéis e Acordo de Leniência (art. 86)**: O CADE pode celebrar acordo de leniência exclusivamente com a primeira empresa que comparecer e colaborar na identificação dos demais coautores de condutas colusivas e na obtenção de provas, gerando extinção da ação punitiva da administração pública antitruste e de tipificações penais correlatas.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Constitucionalidade da Notificação Bancária Direta pela Receita (STF Tema 225)",
        author: "STF (Plenário / Min. Dias Toffoli / Min. Edson Fachin)",
        thesis: "A administração tributária pode requisitar diretamente relatórios bancários de movimentação financeira (e-Financeira) sem prévia ordem judicial, assegurada a responsabilidade funcional pelo resguardo do sigilo de dados.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Reserva Absoluta de Jurisdição para Quebra de Sigilo Bancário",
        author: "Posição Minoritária Superada (Min. Marco Aurélio)",
        thesis: "Sustentava que o sigilo bancário integra a intimidade domiciliar e só poderia ser mitigado mediante decisão judicial fundamentada individualizada.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que o acordo de leniência antitruste do CADE pode ser celebrado simultaneamente com todas as empresas do cartel (FALSO: o art. 86, I da Lei 12.529/2011 prevê expressamente que o benefício só cabe à PRIMEIRA empresa que comparecer e colaborar com a investigação).",
      "Afirmar que o mandato do Presidente do BACEN tem início no primeiro dia do mandato do Presidente da República (FALSO: inicia-se no 1º dia do TERCEIRO ano de mandato do Presidente da República, assegurando descompasso temporal de política monetária)."
    ],
    careerNuances: {
      PBC: "Atuação institucional direta e privativa da Procuradoria-Geral do Banco Central do Brasil na defesa dos atos normativos, fiscalização e regime sancionador e interventivo do SFN perante os Tribunais Superiores.",
      PGFN: "Utilização das informações financeiras transferidas legalmente via LC 105/2001 para combate a fraudes tributárias, ocultação de patrimônio e execuções fiscais da Dívida Ativa da União.",
      AGU: "Defesa dos pareceres do CADE perante a Justiça Federal e representação judicial nas ações que visam anular decisões do Tribunal Antitruste.",
      PF: "Consultoria jurídica das agências reguladoras e autarquias econômicas em convênios com o Sistema Brasileiro de Defesa da Concorrência."
    }
  },


  // ==========================================
  // --- DIREITO DA SEGURIDADE SOCIAL: PRINCÍPIOS, CONCEITUAÇÃO E ORGANIZAÇÃO ---
  // ==========================================
  {
    id: "fuc-seguridade-principios-organizacao-modelos",
    title: "Seguridade Social: Conceituação, Princípios Constitucionais, Organização e Modelos Protetivos",
    discipline: "DIREITO DA SEGURIDADE SOCIAL",
    themeKeywords: [
      "seguridade social. 1.1. conceituação. 1.2. organização e princípios constitucionais. 1.3 modelos. regime geral. regimes próprios. regimes especiais. previdência complementar",
      "seguridade social: conceituacao", "seguridade social", "organizacao e principios constitucionais", 
      "principios constitucionais da seguridade", "modelos de previdencia", "regime geral", 
      "regimes proprios", "regimes especiais", "previdencia complementar", "bismarckiano", 
      "beveridgiano", "solidariedade", "universalidade da cobertura", "equidade no custeio", 
      "diversidade da base", "gestao quadripartite", "triplice vertente", "saude", "previdencia", "assistencia social"
    ],
    coreDoctrine: `### 1. Conceito Constitucional de Seguridade Social e a Tríplice Vertente

A Seguridade Social brasileira, estruturada no Título VIII, Capítulo II da Constituição da República de 1988 (artigos 194 a 204), consubstancia um **conjunto integrado de ações de iniciativa dos Poderes Públicos e da sociedade, destinadas a assegurar os direitos relativos à saúde, à previdência e à assistência social** (CF, art. 194, caput).

Trata-se de um microssistema constitucional de proteção contra contingências sociais (morte, invalidez, idade avançada, doença, desemprego involuntário e vulnerabilidade socioeconômica). A doutrina administrativista e previdenciária sintetiza a Seguridade Social no trinômio protetivo:

1. **Saúde (CF, arts. 196 a 200)**:
   - Natureza: Direito de todos e dever do Estado;
   - Caráter: Acesso universal e igualitário, independentemente de qualquer contribuição financeira (não contributiva);
   - Financiamento: Recursos do orçamento da Seguridade Social da União, Estados, DF e Municípios, além de outras fontes.

2. **Previdência Social (CF, arts. 201 e 202)**:
   - Natureza: Seguro social compulsório de reposição de renda substitutiva da força de trabalho;
   - Caráter: **Contributivo e de filiação obrigatória**;
   - Equilíbrio: Princípio do equilíbrio financeiro e atuarial, vedando concessão de benefícios sem prévia fonte de custeio (art. 195, § 5º).

3. **Assistência Social (CF, arts. 203 e 204)**:
   - Natureza: Política pública protetiva destinada a garantir o mínimo existencial aos hipossuficientes;
   - Caráter: **Não contributiva**, prestada a quem dela necessitar (renda per capita familiar inferior aos limites legais);
   - Benefício paradigmático: Benefício de Prestação Continuada (BPC/LOAS - Lei 8.742/1993, art. 20), no valor de um salário mínimo mensal ao idoso (65 anos) ou à pessoa com deficiência incapacitante.

---

### 2. Evolução Histórica e Modelos Protetivos de Seguridade

A conformação dos sistemas de proteção social na doutrina universal divide-se em dois grandes paradigmas:

| Critério de Comparação | Modelo Alemão (Bismarckiano) | Modelo Inglês (Beveridgiano) |
| :--- | :--- | :--- |
| **Origem e Marco Legal** | Alemanha (1883 - Chanceler Otto von Bismarck) | Reino Unido (1942 - Relatório Lord William Beveridge) |
| **Público Alvo** | Trabalhadores formais contribuintes (Seguro Social) | Toda a população nacional (Cidadania / Seguridade) |
| **Financiamento Principal** | Contribuições sobre folha de salários (Empregado e Empresa) | Orçamento fiscal geral e tributos gerais |
| **Natureza dos Benefícios** | Proporcional aos rendimentos e contribuições vertidas | Universal e uniforme (garantia do mínimo vital básico) |
| **Adesão no Brasil** | Inspirou os antigos IAPs e a Previdência Social (RGPS) | Inspirou o SUS (Saúde) e a LOAS (Assistência Social) |

> **Síntese Dogmática**: O modelo constitucional brasileiro de 1988 é **HÍBRIDO**: adotou a concepção beveridgiana para a Saúde (SUS) e Assistência Social (LOAS), mantendo a vertente bismarckiana contributiva e atuarial na Previdência Social.

---

### 3. Princípios Constitucionais e Objetivos da Seguridade Social (CF, art. 194, Parágrafo Único)

Compete ao Poder Público organizar a Seguridade Social com base nos seguintes mandamentos normativos expressos:

1. **Universalidade da Cobertura e do Atendimento (Inciso I)**:
   - *Cobertura* (vertente objetiva): Proteção contra todas as contingências sociais causadoras de estado de necessidade (doença, invalidez, idade, maternidade);
   - *Atendimento* (vertente subjetiva): Todas as pessoas em território nacional devem ser amparadas, observadas as regras de cada vertente (universal irrestrito na saúde; necessitados na assistência; filiados no seguro previdenciário).

2. **Uniformidade e Equivalência dos Benefícios e Serviços às Populações Urbanas e Rurais (Inciso II)**:
   - Superação da histórica discriminação do FUNRURAL anterior a 1988, que conferia benefícios inferiores ao homem do campo;
   - *Uniformidade*: Mesmos eventos protegidos e mesmas espécies de prestações para trabalhadores urbanos e rurais;
   - *Equivalência*: Padrão pecuniário equivalente no cálculo dos benefícios, observado o piso de 1 salário mínimo (art. 201, § 2º).

3. **Seletividade e Distributividade na Prestação dos Benefícios e Serviços (Inciso III)**:
   - *Seletividade*: Critério de prioridade do legislador ordinário na escolha das contingências mais graves a serem cobertas, considerando a escassez de recursos públicos;
   - *Distributividade*: Vetor de justiça social, direcionando a proteção estatal com maior intensidade às camadas populacionais de menor renda (exemplo: salário-família e auxílio-reclusão restritos aos segurados de baixa renda - art. 201, IV).

4. **Irredutibilidade do Valor dos Benefícios (Inciso IV)**:
   - Aplicação dúplice: Na Previdência Social (art. 201, § 4º), a irredutibilidade é **REAL** (reajustamento periódico obrigatório para preservar o poder aquisitivo contra a inflação); na Seguridade Social em geral, assegura-se ao menos a irredutibilidade **NOMINAL**.

5. **Equidade na Forma de Participação no Custeio (Inciso V)**:
   - Princípio da capacidade contributiva transposto à Seguridade Social: quem possui maior pujança econômica financia em proporção superior;
   - Permite fixação de alíquotas progressivas (confirmadas pela EC 103/2019) e alíquotas diferenciadas por setor de atividade econômica ou risco ambiental do trabalho (SAT/RAT).

6. **Diversidade da Base de Financiamento (Inciso VI)**:
   - Vedação de dependência de uma única base tributária. O sistema é financiado por múltiplos tributos incidentes sobre a empresa (folha, faturamento/receita, lucro), o trabalhador, o importador e a exploração de loterias/prognósticos (CF, art. 195).
   - A EC 103/2019 reforçou a exigência de identificação em rubricas contábeis específicas de cada área da seguridade.

7. **Caráter Democrático e Descentralizado da Administração (Inciso VII)**:
   - Gestão quadripartite nos órgãos colegiados de deliberação (Conselho Nacional de Previdência Social - CNPS): participação paritária de **trabalhadores, empregadores, aposentados e do Governo**.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Irredutibilidade Real Obrigatória na Previdência Social",
        author: "STF (Plenário) e Jurisprudência Pacificada",
        thesis: "Por força do art. 201, § 4º da CF/88, o legislador ordinário tem a obrigação constitucional de criar índice oficial de atualização monetária periódico que preserve o valor real dos benefícios contra a corrosão inflacionária, sem vincular compulsoriamente aos índices do salário mínimo (Súmula Vinculante 4).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Irredutibilidade Apenas Nominal",
        author: "Posição Minoritária Restrita ao art. 194, IV",
        thesis: "Sustenta que o art. 194, IV asseguraria apenas a manutenção do valor numérico nominal pago pela Administração, permitindo ao Estado congelar benefícios em momentos de crise fiscal severa.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que a gestão da Seguridade Social é tripartite (governo, trabalhadores e empresas). Erro clássico: a gestão é QUADRIPARTITE, incluindo expressamente os APOSENTADOS (CF, art. 194, VII).",
      "Confundir irredutibilidade: na seguridade em geral a garantia estrita do art. 194, IV é de irredutibilidade nominal; a irredutibilidade REAL (preservação do poder de compra) decorre do art. 201, § 4º específico da Previdência Social.",
      "Afirmar que a Assistência Social e a Saúde exigem período de carência ou contribuição prévia. Erro: ambas são direitos não contributivos de prestação imediata estatal."
    ],
    careerNuances: {
      PGFN: "Defesa intransigente do princípio da equidade no custeio e diversidade da base de financiamento nas cobranças e execuções de contribuições sociais devidas à União.",
      AGU: "Defesa dos atos de regulamentação do Conselho Nacional de Previdência Social (CNPS) e preservação do equilíbrio financeiro e atuarial dos regimes públicos perante os Tribunais.",
      PF: "Representação judicial do INSS em ações coletivas e individuais que impugnam critérios de concessão, carência e cálculo de benefícios e BPC/LOAS.",
      PBC: "Fiscalização e supervisão prudencial dos ativos garantidores e reservas das entidades de previdência complementar fechada e aberta."
    }
  },

  // ==========================================
  // --- DIREITO DA SEGURIDADE SOCIAL: RGPS, SEGURADOS E QUALIDADE DE SEGURADO ---
  // ==========================================
  {
    id: "fuc-seguridade-rgps-segurados-qualidade",
    title: "Regime Geral de Previdência Social (RGPS): Segurados Obrigatórios, Facultativos e Manutenção da Qualidade de Segurado",
    discipline: "DIREITO DA SEGURIDADE SOCIAL",
    themeKeywords: [
      "regime geral de previdência social", "regime geral de previdencia social", "rgps", 
      "segurados obrigatorios", "segurado empregado", "empregado domestico", "trabalhador avulso", 
      "contribuinte individual", "segurado especial", "segurado facultativo", "qualidade de segurado", 
      "periodo de graca", "carencia", "filiacao e inscricao", "dependentes do rgps", "classes de dependentes"
    ],
    coreDoctrine: `### 1. Estrutura Constitucional do RGPS e a Relação Jurídica Previdenciária

O Regime Geral de Previdência Social (RGPS), com assento no art. 201 da Constituição Federal e regulamentado pelas Leis nº 8.212/1991 (Custeio) e nº 8.213/1991 (Benefícios), rege-se pelos postulados da **contributividade** e da **filiação obrigatória**.

A relação jurídica previdenciária opera em dois polos indissociáveis:
1. **Polo de Custeio (Tributário)**: Obrigação de verter contribuições aos cofres da União administrados pela Receita Federal e cobrados pela PGFN;
2. **Polo de Benefícios (Prestacional)**: Direito público subjetivo de receber prestações pecuniárias e serviços operados pelo Instituto Nacional do Seguro Social (INSS).

---

### 2. Espécies de Segurados do RGPS

O vínculo do segurado com o RGPS divide-se entre segurados obrigatórios e segurados facultativos:

#### A. Segurados Obrigatórios (Filiação Automática 'Ex Lege')
A filiação do segurado obrigatório decorre compulsoriamente do mero exercício de atividade remunerada lícita em território nacional (Lei 8.213/91, art. 11):

1. **Empregado (Art. 11, I)**: Presta serviço de natureza urbana ou rural à empresa, em caráter não eventual, sob subordinação e mediante remuneração, inclusive o servidor ocupante exclusivamente de cargo em comissão declarado em lei de livre nomeação e exoneração (CF, art. 40, § 13);
2. **Empregado Doméstico (Art. 11, II)**: Presta serviço contínuo a pessoa ou família, no âmbito residencial destas, em atividades sem finalidade lucrativa (regido pela LC 150/2015);
3. **Trabalhador Avulso (Art. 11, VI)**: Presta serviços a diversas empresas, agrupado em entidade de classe ou órgão gestor de mão de obra (OGMO), sem vínculo empregatício direto, sindicalizado ou não (portuários e não portuários - igualdade com empregados pelo art. 7º, XXXIV da CF);
4. **Contribuinte Individual (Art. 11, V)**: Antigo autônomo, profissional liberal, sócio-administrador de empresa que recebe pró-labore, empresário individual, síndico remunerado de condomínio e trabalhadores que exercem atividade econômica por conta própria sem subordinação;
5. **Segurado Especial (Art. 11, VII)**: Pessoa física residente no imóvel rural ou em aglomerado urbano próximo que, individualmente ou em regime de economia familiar, sem empregados permanentes, exerce atividade como produtor rural, seringueiro, extrativista vegetal ou pescador artesanal. Contribuição sobre a comercialização da produção rural (art. 195, § 8º da CF).

#### B. Segurado Facultativo (Filiação Voluntária)
Pessoa física com idade a partir de 16 anos que não exerça atividade remunerada que a enquadre compulsoriamente em qualquer regime previdenciário público (estudantes, donas de casa, estagiários e desempregados). É vedada a filiação facultativa de servidor público ocupante de cargo efetivo vinculado a RPPS (CF, art. 201, § 5º).

---

### 3. Manutenção e Perda da Qualidade de Segurado: O Período de Graça (Art. 15 da Lei 8.213/1991)

O período de graça consubstancia o intervalo temporal fixado em lei durante o qual o cidadão mantém todos os seus direitos previdenciários perante o RGPS, mesmo sem verter contribuições financeiras:

| Hipótese Fática | Prazo Base | Prorrogações Admitidas | Prazo Máximo Possível |
| :--- | :--- | :--- | :--- |
| **Segurado Obrigatório que cessa as contribuições** | 12 meses | + 12 meses (se tiver mais de 120 contribuições sem perda prévia da qualidade) + 12 meses (se comprovada situação de desemprego involuntário) | **Até 36 meses** |
| **Segurado acometido de doença de segregação compulsória** | Até 12 meses após cessar a segregação | Não há prorrogações adicionais | 12 meses |
| **Segurado retido ou recluso** | Até 12 meses após o livramento | Não há prorrogações adicionais | 12 meses |
| **Segurado incorporado às Forças Armadas para serviço militar** | Até 3 meses após o licenciamento | Não há prorrogações adicionais | 3 meses |
| **Segurado Facultativo** | 6 meses após a cessação das contribuições | Não há prorrogações adicionais | 6 meses |

> **Marco Fatal de Perda da Qualidade**: O benefício cessa no dia seguinte ao do término do prazo fixado no Plano de Custeio da Seguridade Social para recolhimento da contribuição referente ao mês imediatamente posterior ao do final do período de graça (Lei 8.213/91, art. 15, § 4º c/c Lei 8.212/91, art. 30, II: dia 16 do 2º mês subsequente).

---

### 4. Classes de Dependentes e Ordem de Precedência (Art. 16 da Lei 8.213/1991)

Os dependentes do segurado dividem-se em classes excludentes (a existência de dependente de classe anterior exclui peremptoriamente os das classes subsequentes):

1. **Classe 1**: Cônjuge, companheiro(a) em união estável (inclusive homoafetiva - Tema 526/STF) e o filho não emancipado, de qualquer condição, menor de 21 anos ou inválido/com deficiência grave. Dependência econômica **PRESUMIDA** por lei;
2. **Classe 2**: Pais. Dependência econômica deve ser **CABALMENTE COMPROVADA**;
3. **Classe 3**: Irmão não emancipado, de qualquer condição, menor de 21 anos ou inválido/com deficiência grave. Dependência econômica deve ser **CABALMENTE COMPROVADA**.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Inexistência de Direito a Rateio em Bigamia ou Concubinato",
        author: "STF Tema 529 (Tese Vinculante de Repercussão Geral)",
        thesis: "A pré-existência de casamento ou de união estável de um dos conviventes, ressalvada a separação de fato, impede o reconhecimento de novo vínculo concomitante para fins de rateio de pensão por morte previdenciária, ante a consagração do princípio da monogamia no ordenamento constitucional.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Rateio Previdenciário Humanitário",
        author: "Tese Minoritária Superada (Min. Edson Fachin - Voto Vencido)",
        thesis: "Sustentava que o direito previdenciário possui autonomia em relação ao direito de família, cabendo proteger a boa-fé e o amparo econômico dos conviventes simultâneos de longa data.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam estender a idade limite de pensão por morte para filhos estudantes universitários até 24 anos. Erro no RGPS: a perda da qualidade de dependente para filhos ocorre aos 21 anos completos, sem prorrogação universitária (STJ Súmula 74).",
      "Confundir período de graça de facultativo com obrigatório: facultativo tem apenas 6 meses de período de graça e não recebe as prorrogações por desemprego ou 120 contribuições.",
      "Afirmar que o servidor comissionado puro é segurado especial ou facultativo. Erro: é segurado OBRIGATÓRIO do RGPS na categoria de EMPREGADO (CF, art. 40, § 13)."
    ],
    careerNuances: {
      PGFN: "Verificação da legalidade das compensações previdenciárias e retenções operadas por empresas tomadoras sobre pagamentos a contribuintes individuais e cooperativas.",
      AGU: "Defesa das prerrogativas da União em conflitos de competência envolvendo concessão de benefícios previdenciários e representação nas cortes superiores.",
      PF: "Atuação direta em varas previdenciárias federais na defesa do INSS em ações postulatórias de concessão de aposentadorias rurais e averbação de tempo especial.",
      PBC: "Fiscalização da segregação atuarial entre os fundos previdenciários e a liquidez dos fundos garantidores institucionais."
    }
  },

  // ==========================================
  // --- DIREITO DA SEGURIDADE SOCIAL: EMPRESA, EMPREGADOR DOMÉSTICO E OBRIGAÇÕES ---
  // ==========================================
  {
    id: "fuc-seguridade-empresa-empregador-domestico-obrigacoes",
    title: "Empresa e Empregador Doméstico no Direito Previdenciário: Conceituação, Obrigações Tributárias e Responsabilidade Solidária",
    discipline: "DIREITO DA SEGURIDADE SOCIAL",
    themeKeywords: [
      "empresa e empregador doméstico: conceito previdenciário", "empresa e empregador domestico: conceito previdenciario", 
      "conceito de empresa", "empregador domestico", "artigo 15 da lei 8.212", "obrigacoes tributarias previdenciarias", 
      "retencao de 11%", "cessao de mao de obra", "empreitada", "responsabilidade solidaria previdenciaria", 
      "produtor rural pessoa fisica", "contribuinte individual equiparado", "folha de salarios"
    ],
    coreDoctrine: `### 1. O Conceito Previdenciário Amplo de Empresa (Lei nº 8.212/1991, Art. 15)

No Direito Empresarial (Código Civil, art. 966), a figura do empresário exige a conjugação de atividade econômica organizada para a produção ou circulação de bens e serviços com finalidade lucrativa. 

Contudo, no **Direito Previdenciário e Tributário da Seguridade Social**, o conceito legal de empresa é expressamente ampliado pelo artigo 15, inciso I da Lei nº 8.212/1991 para abarcar qualquer centro de imputação de custos produtivos e mão de obra:

> **Art. 15, I**: Considera-se empresa a **firma individual ou a sociedade que assume o risco de atividade econômica urbana ou rural, com fins lucrativos ou não**, bem como os órgãos e entidades da administração pública direta, indireta e fundacional.

#### Pessoas Físicas Equiparadas a Empresa (Art. 15, Parágrafo Único)
Equiparam-se compulsoriamente a empresa para efeitos previdenciários:
1. O **contribuinte individual** em relação a segurado que lhe preste serviços remunerados (exemplo: médico que contrata secretária em seu consultório particular);
2. A **cooperativa**, a **associação** de qualquer natureza ou finalidade (mesmo sem finalidade lucrativa, como ONGs e clubes esportivos);
3. A **missão diplomática** e a **repartição consular** de carreira estrangeiras;
4. O **condomínio edilício** (que, embora desprovido de personalidade jurídica civil formal, ostenta personalidade tributária e capacidade passiva previdenciária);
5. O **titular de cartório** e serventia notarial ou registral, em relação aos escreventes e prepostos contratados sob regime celetista.

---

### 2. O Conceito de Empregador Doméstico (Lei nº 8.212/1991, Art. 15, II c/c LC nº 150/2015)

Considera-se empregador doméstico a **pessoa física ou a família que admite a seu serviço, sem finalidade lucrativa, empregado doméstico** para prestar serviços de forma contínua, subordinada, onerosa e pessoal por mais de 2 (dois) dias por semana no âmbito residencial.

Principais diretrizes tributárias do empregador doméstico:
- Adoção compulsória do regime unificado **Simples Doméstico** (eSocial - LC 150/2015, art. 31);
- Alíquota patronal previdenciária de **8% (oito por cento)** sobre a remuneração paga;
- Recolhimento adicional obrigatório de **0,8%** para cobertura de seguro contra acidentes de trabalho (GILRAT) e **8%** de FGTS mais **3,2%** de indenização compensatória por perda involuntária de emprego.

---

### 3. A Sistemática da Retenção de 11% na Cessão de Mão de Obra e Empreitada (Art. 31 da Lei 8.212/1991)

Para coibir a inadimplência crônica de empresas prestadoras de serviços terceirizados, o art. 31 da Lei nº 8.212/1991 (com redação dada pela Lei nº 9.711/1998) criou mecanismo de **substituição tributária por retenção na fonte**:

- **Fato Gerador da Retenção**: A empresa contratante de serviços executados mediante **cessão de mão de obra** ou **empreitada** deve reter **11% (onze por cento)** do valor bruto da nota fiscal, fatura ou recibo de prestação de serviços;
- **Recolhimento**: O montante retido deve ser recolhido aos cofres públicos pela tomadora até o dia 20 do mês subsequente ao da emissão da nota fiscal, em nome da empresa prestadora (compensável por esta com as contribuições previdenciárias de sua folha de salários);
- **Solidariedade Mitigada**: A regular retenção e o recolhimento integral dos 11% pelo tomador de serviços elidem a sua responsabilidade solidária quanto às contribuições devidas pela prestadora referente àquela mão de obra (salvo comprovação de fraude ou conluio).

---

### 4. Responsabilidade Solidária em Construção Civil (Art. 30, VI da Lei 8.212/1991)

Na contratação de serviços de construção civil, o proprietário do imóvel, o dono da obra, o incorporador e o construtor respondem **solidariamente** com o empreiteiro principal pelas contribuições previdenciárias decorrentes da execução da obra:

- **Exceção Legal Expressa**: A responsabilidade solidária **NÃO se aplica** ao adquirente de prédio ou unidade imobiliária que realize a compra de empresa construtora devidamente regularizada, nem à construção residencial unifamiliar, destinada a uso próprio, do tipo econômico, executada sem mão de obra assalariada (Lei 8.212/91, art. 30, VIII);
- **Exigência de CND**: A averbação de construção civil no Registro de Imóveis exige a apresentação da Certidão Negativa de Débitos (CND) Previdenciários da obra expedida pela Receita Federal e PGFN (art. 47, II).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Validade da Retenção como Substituição Tributária e Mera Antecipação",
        author: "STF (Plenário - RE 393.115) e STJ (Súmula 451)",
        thesis: "O art. 31 da Lei 8.212/1991 instituiu legítima substituição tributária voltada à praticabilidade e fiscalização da arrecadação, não criando nova contribuição sobre faturamento, mas mera antecipação do tributo devido sobre a folha de salários da empresa cedente.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Inconstitucionalidade por Criação de Base de Cálculo Nova sem Lei Complementar",
        author: "Tese dos Contribuintes Superada",
        thesis: "Sustentava que a retenção sobre nota fiscal configuraria imposto ou contribuição nova incidente sobre a receita bruta, violando o art. 195, § 4º c/c art. 154, I da CF por ausência de lei complementar.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que condomínio edilício e fundações privadas sem fins lucrativos não se submetem às obrigações de empresa perante a Seguridade Social. FALSO: o art. 15 equipara expressamente qualquer associação, condomínio e firma a empresa para fins de custeio previdenciário.",
      "Tentar estender a responsabilidade solidária da construção civil ao proprietário de imóvel residencial unifamiliar que constrói casa própria para moradia com esforço próprio (art. 30, VIII da Lei 8.212/91 expressamente ressalva essa hipótese).",
      "Afirmar que a alíquota de retenção na cessão de mão de obra é de 20%. Erro: a retenção legal na fatura é de 11% (art. 31)."
    ],
    careerNuances: {
      PGFN: "Cobrança executiva de débitos previdenciários e retenções inadimplidas de empresas terceirizadas e responsabilização solidária de sócios e tomadores de serviço na Dívida Ativa da União.",
      AGU: "Defesa da legalidade de glosas e retenções preventivas de faturas contratuais efetuadas pela Administração Pública Federal contra empresas prestadoras de serviço inadimplentes com o INSS.",
      PF: "Consultoria e assessoria jurídica em contratos de empreitada de obras públicas de universidades e autarquias federais com fiscalização de obrigações previdenciárias e CND.",
      PBC: "Supervisão da terceirização de mão de obra e segurança armada bancária e exigência de estrito cumprimento de encargos previdenciários pelas instituições de crédito."
    }
  },

  // ==========================================
  // --- DIREITO DA SEGURIDADE SOCIAL: FINANCIAMENTO, CUSTEIO E RPPS ---
  // ==========================================
  {
    id: "fuc-seguridade-financiamento-custeio-rpps",
    title: "Financiamento da Seguridade Social, Custeio Previdenciário e Regimes Próprios de Previdência Social (RPPS)",
    discipline: "DIREITO DA SEGURIDADE SOCIAL",
    themeKeywords: [
      "financiamento da seguridade social e regime próprio de previdência", "financiamento da seguridade social e regime proprio de previdencia", 
      "financiamento da seguridade", "custeio previdenciario", "artigo 195 da constituicao", 
      "contribuicoes sociais", "folha de salarios", "receita ou faturamento", "pis e cofins", 
      "lucro liquido", "csll", "concursos de prognosticos", "importador", "anterioridade nonagesimal mitigada", 
      "principio da contrapartida", "regime proprio de previdencia social", "rpps", "artigo 40 da constituicao", 
      "emenda constitucional 103", "aliquotas progressivas", "imunidade das entidades beneficentes", 
      "cebas", "tema 32 stf", "tema 69 stf"
    ],
    coreDoctrine: `### 1. O Modelo Constitucional de Financiamento da Seguridade Social (CF, Art. 195)

A Seguridade Social será financiada por **toda a sociedade, de forma direta e indireta**, mediante recursos provenientes dos orçamentos da União, dos Estados, do Distrito Federal e dos Municípios, e das seguintes contribuições sociais:

1. **Do Empregador, da Empresa e da Entidade a ela Equiparada (Inciso I)**:
   - *Alínea 'a'*: Sobre a folha de salários e demais rendimentos do trabalho pagos ou creditados à pessoa física (Contribuição Patronal Previdenciária de 20% + RAT/SAT de 1% a 3% + Adicional SAT de 6%, 9% ou 12% para aposentadoria especial);
   - *Alínea 'b'*: Sobre a receita ou o faturamento (PIS/PASEP e COFINS);
   - *Alínea 'c'*: Sobre o lucro líquido (CSLL - Contribuição Social sobre o Lucro Líquido);
2. **Do Trabalhador e dos Demais Segurados da Previdência Social (Inciso II)**:
   - Alíquotas **progressivas** introduzidas pela EC 103/2019 (7,5%, 9%, 12% e 14% no RGPS), calculadas sobre cada faixa remuneratória até o teto do RGPS;
   - Não incide contribuição sobre aposentadoria e pensão concedidas pelo RGPS (imunidade expressa do art. 195, II, in fine);
3. **Sobre a Receita de Concursos de Prognósticos (Inciso III)**:
   - Loterias federais e estaduais, sorteios de números e apostas de quota fixa;
4. **Do Importador de Bens ou Serviços do Exterior (Inciso IV)**:
   - PIS-Importação e COFINS-Importação (criados pela EC 42/2003 e regulamentados pela Lei nº 10.865/2004).

---

### 2. Princípios Constitucionais Específicos do Custeio da Seguridade

#### A. Anterioridade Nonagesimal Mitigada (CF, art. 195, § 6º)
As contribuições sociais da Seguridade Social **só poderão ser exigidas após decorridos 90 (noventa) dias da data da publicação da lei que as houver instituído ou modificado**.
- *Mitigação*: Não se lhes aplica a anterioridade anual (exercício financeiro seguinte - art. 150, III, 'b'). Uma majoração de contribuição social publicada em 15 de outubro pode ser cobrada em meados de janeiro do ano seguinte (bastando fluírem os 90 dias);
- *Fixação do STF*: A mera revogação de benefício fiscal ou isenção de contribuição social configura majoração indireta de tributo e **submete-se compulsoriamente à anterioridade nonagesimal** (Tema 1.091 do STF).

#### B. Princípio da Preexistência do Custeio / Regra da Contrapartida (CF, art. 195, § 5º)
**Nenhum benefício ou serviço da Seguridade Social poderá ser criado, majorado ou estendido sem a correspondente fonte de custeio total**.
- Norma geral dirigida tanto ao legislador quanto ao julgador: veda a criação judicial de novos benefícios previdenciários (como a tese da 'desaposentação' rejeitada pelo STF no Tema 503);
- Exceção reconhecida pelo STF: A garantia do salário mínimo como piso de benefícios (CF, art. 201, § 2º) tem eficácia plena e aplicação imediata, não dependendo de previsão prévia em lei ordinária de fonte de custeio específica.

#### C. Imunidade das Entidades Beneficentes de Assistência Social (CEBAS - CF, art. 195, § 7º)
São isentas (com natureza jurídica de **imunidade tributária**) de contribuição para a seguridade social as entidades beneficentes de assistência social que atendam às exigências estabelecidas em **lei complementar**.
- **STF Tema 32 e ADI 4.480**: É inconstitucional a exigência de requisitos meramente formais de certificação contidos em lei ordinária ou decreto regulamentar que inovem sobre limitações à imunidade; os requisitos materiais de gozo da imunidade (como a não distribuição de lucros e aplicação integral dos recursos no país) submetem-se à reserva de lei complementar (antigo art. 14 do CTN e atual LC nº 187/2021).

---

### 3. As Balizas do Regime Próprio de Previdência Social (RPPS - CF, Art. 40 e EC 103/2019)

O Regime Próprio de Previdência Social dos servidores titulares de cargos efetivos da União, Estados, DF e Municípios sofreu profunda reestruturação pela Emenda Constitucional nº 103/2019:

1. **Vedação de Criação de Novos RPPS e Unidade Gestora Única**:
   - Cada ente federativo pode manter apenas **UM** único regime próprio e uma única entidade gestora previdenciária (art. 40, § 20);
2. **Alíquotas Progressivas e Alíquotas Extraordinárias**:
   - Aplicação de alíquotas progressivas para servidores ativos, aposentados e pensionistas federais (de 7,5% a 22%);
   - Possibilidade de instituição de **alíquota extraordinária** em caso de déficit atuarial comprovado do RPPS federal (art. 149, § 1º-B), pelo prazo máximo de 20 anos;
3. **Incidência sobre Aposentados e Pensionistas do RPPS**:
   - Diversamente do RGPS (onde aposentados são imunes), no RPPS aposentados e pensionistas contribuem sobre a parcela dos proventos que supere o teto do RGPS (art. 40, § 18);
   - Havendo déficit atuarial formalmente demonstrado, a contribuição pode incidir a partir de **1 salário mínimo** (art. 149, § 1º-A);
4. **Previdência Complementar Obrigatória (RPC - CF, art. 40, §§ 14 a 16)**:
   - Todos os entes com RPPS foram obrigados a instituir o regime de previdência complementar (como a FUNPRESP na União) e fixar o teto do RGPS como limite máximo para os benefícios do RPPS para novos servidores efetivos.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Incidência Válida sobre Férias Gozadas com Modulação Temporal",
        author: "STF Tema 985 (RE 1.072.485 - Plenário)",
        thesis: "É legítima a incidência de contribuição social sobre o valor satisfeito a título de terço constitucional de férias usufruídas, ante a sua natureza remuneratória habitual. Contudo, em embargos de declaração julgados em 2024, o STF modulou os efeitos para que a decisão produza efeitos apenas a partir da publicação do acórdão de mérito (15/09/2020), ressalvadas as ações ajuizadas até aquela data.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Caráter Indenizatório Total",
        author: "Jurisprudência Anterior do STJ (Primeira Seção - REsp 1.230.957)",
        thesis: "Sustentava que o terço de férias consubstanciaria compensação pecuniária indenizatória para reforço do descanso, não se incorporando aos proventos e devendo ser expurgado da base patronal.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas cobram a modulação do Tema 985 do STF: a cobrança do terço constitucional de férias gozadas só vale a partir de 15/09/2020 para contribuintes sem ação ajuizada.",
      "Afirmar que aposentados do RGPS pagam contribuição previdenciária. Erro: o art. 195, II da CF isenta expressamente aposentadorias e pensões do RGPS; quem paga sobre o excedente ao teto são os aposentados do RPPS (art. 40, § 18).",
      "Confundir anterioridade de contribuições sociais: submetem-se apenas à noventena (art. 195, § 6º); não precisam esperar a virada do exercício financeiro."
    ],
    careerNuances: {
      PGFN: "Representação privativa da União nas ações de repetição de indébito de contribuições previdenciárias e sustentação da tese da modulação temporal em favor da higidez orçamentária no STF.",
      AGU: "Defesa da constitucionalidade da reforma previdenciária da EC 103/2019 e das alíquotas progressivas e extraordinárias dos servidores públicos federais.",
      PF: "Consultoria jurídica aos órgãos de gestão de previdência própria e defesa de autarquias federais quanto ao repasse tempestivo de encargos patronais de servidores comissionados.",
      PBC: "Fiscalização da solvência atuarial dos planos de previdência complementar e supervisão do cumprimento do teto do RGPS nas autarquias de crédito."
    }
  },


  {
    "id": "fuc-proc-fazenda-publica-prerrogativas-prazos",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "A Fazenda Pública em Juízo: Regime Jurídico, Prerrogativas Processuais e Tutela Executiva",
    "themeKeywords": [
      "fazenda pública em juízo",
      "fazenda publica em juizo. conceito e caracteristicas",
      "fazenda publica",
      "prerrogativas da fazenda pública",
      "prazo em dobro",
      "intimacao pessoal eletronica",
      "remessa necessaria",
      "reexame necessario",
      "execucao contra a fazenda",
      "artigo 183",
      "artigo 496",
      "artigo 535"
    ],
    "coreDoctrine": "### 1. Conceito Processual de Fazenda Pública e Fundamento Constitucional das Prerrogativas\nNo direito processual civil contemporâneo, a expressão **Fazenda Pública** não designa uma pessoa jurídica autônoma, mas sim a personificação do Estado quando este atua em juízo na defesa do interesse público primário (sociedade) e secundário (patrimônio estatal). Compreende a Administração Pública direta (União, Estados, Distrito Federal e Municípios) e as respectivas autarquias e fundações públicas de direito público. As empresas públicas e sociedades de economia mista exploradoras de atividade econômica em sentido estrito submetem-se ao regime de direito privado (CF/88, art. 173, § 1º, II), não usufruindo das prerrogativas processuais da Fazenda Pública, salvo quando prestadoras de serviço público próprio em regime não concorrencial e sem finalidade lucrativa (como reconhecido pelo STF em favor da Empresa Brasileira de Correios e Telégrafos - ECT e da Infraero).\n\nAs prerrogativas processuais da Fazenda Pública não constituem privilégios odiosos ou quebra arbitrária da isonomia processual, mas instrumentos legítimos de equalização material destinados a resguardar o patrimônio coletivo, a indisponibilidade dos interesses públicos e a complexidade burocrática ínsita à máquina estatal.\n\n### 2. Prazo em Dobro e Intimação Pessoal Eletrônica (CPC, Art. 183)\nO CPC/2015 unificou o tratamento dos prazos da Fazenda Pública no artigo 183, extinguindo o antigo prazo em quádruplo para contestar previsto no CPC/1973. Atualmente, a União, Estados, DF, Municípios e suas autarquias e fundações de direito público gozam de **prazo em dobro para todas as suas manifestações processuais** (contestar, recorrer, impugnar, falar sobre provas ou cumprir determinações judiciais).\n\nA contagem do prazo inicia-se a partir da intimação pessoal, que se dá primordialmente por meio eletrônico, em portal próprio (CPC, art. 183, § 1º c/c Lei nº 11.419/2006, art. 5º). Não se aplica o prazo em dobro quando a própria legislação estipular, de forma expressa, prazo especial específico para o ente público (CPC, art. 183, § 2º), a exemplo do prazo de 30 dias para impugnação ao cumprimento de sentença (CPC, art. 535), que é prazo próprio e peremptório.\n\n### 3. Remessa Necessária e Limites de Alçada (CPC, Art. 496)\nA remessa necessária (ou reexame necessário) consubstancia uma condição de eficácia da sentença desfavorável à Fazenda Pública. A decisão não produz efeitos senão após a confirmação pelo respectivo Tribunal. O CPC/2015 racionalizou o instituto ao estabelecer faixas de proveito econômico para a dispensa da remessa necessária (art. 496, § 3º):\n1. **1.000 salários mínimos** para a União e suas autarquias e fundações federais;\n2. **500 salários mínimos** para os Estados, DF, suas autarquias e Capitais de Estado;\n3. **100 salários mínimos** para os demais Municípios e suas entidades autárquicas.\n\nAdemais, dispensa-se a remessa necessária quando a sentença estiver lastreada em súmula de tribunal superior, acórdão proferido pelo STF ou STJ sob o rito dos recursos repetitivos, entendimento firmado em IRDR ou IAC, ou ainda orientação vinculante consolidada administrativamente pelo próprio ente público (art. 496, § 4º).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Corrente da Natureza Jurídica como Condição Lógica de Eficácia",
        "author": "Nelson Nery Jr. e Posição Majoritária do STJ",
        "thesis": "A remessa necessária não é recurso, mas mera condição legal de eficácia preclusiva da sentença, não se sujeitando aos requisitos recursais intrínsecos de preparo e tempestividade.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Corrente do Recurso de Ofício",
        "author": "Doutrina Tradicional Minoritária",
        "thesis": "Sustenta que a remessa necessária consubstancia recurso anômalo obrigatório determinado pelo magistrado de primeiro grau.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas tentam estender o prazo em dobro da Fazenda Pública ao prazo para prestar informações em mandado de segurança. Erro crasso: o prazo de 10 dias da Lei 12.016/2009 é improrrogável e não se dobra.",
      "Afirmar que a dispensa de remessa necessária da União é de 500 salários mínimos. Atenção: para a União a alçada de dispensa é de 1.000 salários mínimos (art. 496, § 3º, I).",
      "Confundir prazos: a impugnação ao cumprimento de sentença contra a Fazenda Pública tem prazo próprio de 30 dias (CPC, art. 535), não havendo duplicação para 60 dias."
    ],
    "careerNuances": {
      "PGFN": "Atuação intensiva na verificação de alçadas da remessa necessária em execuções fiscais e embargos do devedor, aplicando as teses repetitivas do STJ e STF para dispensar recursos antieconômicos.",
      "AGU": "Sustentação da legitimidade constitucional do prazo em dobro e da intimação pessoal em portal próprio como garantias do contraditório institucionalizado."
    }
  },

  {
    "id": "fuc-proc-normas-fundamentais-jurisdicao-cooperacao",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Normas Fundamentais do Processo Civil, Cooperação Judiciária e Limites da Jurisdição Nacional",
    "themeKeywords": [
      "normas fundamentais do processo",
      "normas fundamentais",
      "limites da jurisdição nacional e cooperação internacional",
      "limites da jurisdicao nacional",
      "cooperacao internacional",
      "contraditório substancial",
      "boa-fé processual",
      "cooperação processual",
      "vedação a decisão surpresa",
      "auxílio direto",
      "carta rogatória",
      "artigo 1",
      "artigo 6",
      "artigo 9",
      "artigo 10",
      "artigo 21",
      "artigo 26"
    ],
    "coreDoctrine": "### 1. O Modelo Constitucional do Processo Civil e as Normas Fundamentais (CPC, Arts. 1º a 12)\nO Código de Processo Civil de 2015 inaugurou expressamente um modelo processual cooperativo e compromissado com a ordem axiológica da Constituição da República de 1988 (art. 1º). As normas fundamentais atuam como balizas hermenêuticas vinculantes para todos os sujeitos do processo.\n\nDentre os postulados centrais, destacam-se:\n1. **Princípio da Primazia da Resolução do Mérito (Art. 4º)**: As partes têm o direito à obtenção da solução integral do mérito em prazo razoável, devendo o juiz priorizar o saneamento de vícios processuais formais e a sanação de defeitos sanáveis antes de proferir qualquer juízo extintivo sem julgamento de mérito.\n2. **Boa-Fé Objetiva e Cooperação (Arts. 5º e 6º)**: O processo civil deixa de ser visto como um duelo egoístico entre as partes para se transformar em uma comunidade de trabalho. Todos os intervenientes têm o dever de agir com lealdade, clareza e probidade.\n3. **Contraditório Substancial e Vedação à Decisão Surpresa (Arts. 9º e 10)**: O contraditório superou a concepção clássica de mera ciência bilateral e possibilidade de resposta (informação e reação). O art. 10 consagra o contraditório como poder de influência efetiva nos fundamentos da decisão judicial. É categoricamente proibido ao magistrado decidir com base em fundamento a respeito do qual as partes não tenham tido oportunidade de se manifestar previamente, ainda que se trate de matéria cognoscível de ofício (como prescrição, decadência ou pressupostos processuais).\n\n### 2. Limites da Jurisdição Nacional (CPC, Arts. 21 a 25)\nA jurisdição internacional brasileira divide-se em:\n- **Competência Concorrente (Arts. 21 e 22)**: Hipóteses em que a autoridade judicial brasileira pode julgar a causa, mas a propositura idêntica perante tribunal estrangeiro não induz litispendência (art. 24). Abrange réu domiciliado no Brasil, obrigação a ser cumprida em território nacional, atos ocorridos no país, ações de alimentos com credor no Brasil e relações de consumo quando o consumidor reside no Brasil.\n- **Competência Exclusiva (Art. 23)**: Hipóteses em que apenas o Poder Judiciário brasileiro possui jurisdição, excluindo qualquer tribunal estrangeiro: ações relativas a imóveis situados no Brasil e inventário e partilha de bens situados no território nacional.\n\n### 3. Cooperação Jurídica Internacional (CPC, Arts. 26 a 41)\nA cooperação internacional rege-se pelos tratados internacionais e desenvolve-se por instrumentos como o **auxílio direto** (medida que não decorre diretamente de ato jurisdicional estrangeiro a ser executado, dispensando juízo de delibação perante o STJ) e a **carta rogatória** (comunicação entre órgãos judiciais de países distintos para a prática de atos instrutórios ou de cumprimento, sujeita a exequatur pelo STJ).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Alcance Absoluto da Vedação à Decisão Surpresa",
        "author": "Fredie Didier Jr. e Jurisprudência Amplamente Dominante do STJ",
        "thesis": "A proibição de decisão surpresa atinge inclusive as matérias de ordem pública cognoscíveis de ofício, tornando nula a sentença que extingue o feito sem prévia oitiva das partes sobre o fundamento adotado.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Mitigação para Matérias Flagrantes de Ordem Pública",
        "author": "Posição Jurisprudencial Minoritária e Isolada",
        "thesis": "Argumenta que defeitos insanáveis gritantes dispensariam nova intimação para preservar a celeridade processual.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que a litispendência internacional impede o prosseguimento da ação no Brasil. Falso: a pendência de causa no exterior não obsta que a autoridade brasileira conheça da mesma causa (CPC, art. 24).",
      "Confundir auxílio direto com carta rogatória: o auxílio direto prescinde de juízo de delibação ou exequatur do STJ, operando por autoridade central administrativa.",
      "Afirmar que o juiz pode decretar a prescrição de ofício na sentença sem intimar previamente as partes. Erro frontal ao art. 10 e ao art. 487, parágrafo único do CPC."
    ],
    "careerNuances": {
      "PGFN": "Utilização do auxílio direto internacional para localização de patrimônio oculto de grandes devedores da União no exterior em cobranças de Dívida Ativa da Fazenda Nacional.",
      "AGU": "Atuação perante o Superior Tribunal de Justiça nos procedimentos de homologação de decisão estrangeira e concessão de exequatur a cartas rogatórias."
    }
  },

  {
    "id": "fuc-proc-partes-procuradores-juiz-funcoes-essenciais",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Sujeitos do Processo, Poderes do Juiz, Ministério Público e Advocacia Pública",
    "themeKeywords": [
      "das partes e dos procuradores",
      "do juiz e dos auxiliares de justiça",
      "do ministerio publico",
      "da advocacia. da advocacia publica",
      "da defensoria publica",
      "partes e procuradores",
      "juiz e auxiliares de justica",
      "ministerio publico fiscal da ordem",
      "advocacia publica",
      "defensoria publica",
      "capacidade processual",
      "deveres das partes",
      "impedimento e suspeicao",
      "artigo 77",
      "artigo 139",
      "artigo 144",
      "artigo 176",
      "artigo 182",
      "artigo 185"
    ],
    "coreDoctrine": "### 1. Capacidade Processual e Deveres das Partes (CPC, Arts. 70 a 81)\nToda pessoa que se encontre no exercício de seus direitos tem capacidade para estar em juízo. As partes e seus advogados têm deveres estritos de probidade (art. 77), sujeitando-se à caracterização de litigância de má-fé (arts. 79 a 81) caso alterem a verdade dos fatos, deduzam pretensão contra texto expresso de lei ou provoquem incidentes manifestamente infundados. A multa por litigância de má-fé, superior a 1% e inferior a 10% do valor corrigido da causa, é revertida em proveito da parte prejudicada.\n\n### 2. Poderes, Deveres e Responsabilidade do Juiz (CPC, Arts. 139 a 148)\nO juiz dirige o processo com amplos poderes instrutórios (art. 370) e indutivos (art. 139, IV), cabendo-lhe determinar de ofício as provas necessárias ao julgamento do mérito e adotar todas as medidas coercitivas e mandamentais para efetivar ordens judiciais, inclusive em obrigações pecuniárias (como apreensão de passaporte e CNH, desde que observada a razoabilidade e proporcionalidade fixadas pelo STF na ADI 5941).\n\nO regime de parcialidade judicial bifurca-se em:\n- **Impedimento (Art. 144)**: Presunção absoluta (juris et de jure) de parcialidade. Envolve parentesco, causa em que já atuou como advogado ou membro do MP, ou litígio envolvendo cônjuge. O vício contamina o processo com nulidade insanável e autoriza ação rescisória (art. 966, II).\n- **Suspeição (Art. 145)**: Presunção relativa de parcialidade decorrente de amizade íntima, inimizade capital, interesse no julgamento ou credor/devedor da parte. Sujeita-se a preclusão se não arguida no primeiro momento processual.\n\n### 3. O Ministério Público no Processo Civil (CPC, Arts. 176 a 181)\nO Ministério Público pode atuar como parte (órgão agente) ou como fiscal da ordem jurídica (custos iuris). Como fiscal da ordem jurídica, atua em causas de interesse público e social, incapacidade ou conflitos coletivos agrários e urbanos (art. 178). Goza de prazo em dobro e intimação pessoal eletrônica (art. 180), não cabendo condenação em honorários salvo comprovada má-fé (art. 18 da Lei 7.347/85).\n\n### 4. Regime Jurídico da Advocacia Pública (CPC, Arts. 182 a 184)\nA Advocacia Pública representa judicialmente as pessoas jurídicas de direito público. O artigo 184 consagra expressamente a responsabilidade civil pessoal regressiva do membro da Advocacia Pública **apenas quando agir com dolo ou fraude** no exercício de suas funções, resguardando a independência técnica institucional do procurador público.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Responsabilidade Subjetiva Restrita a Dolo ou Fraude",
        "author": "Doutrina Majoritária e Jurisprudência do STF",
        "thesis": "O art. 184 do CPC protege a autonomia decisória do Procurador da Fazenda, afastando qualquer responsabilização funcional por culpa simples ou divergência interpretativa plausível.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Extensão a Erro Grosseiro Equiparado",
        "author": "Corrente Minoritária em Direito Administrativo",
        "thesis": "Sustenta aplicação subsidiária do art. 28 da LINDB para alcançar a culpa manifestamente inescusável.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas tentam imputar responsabilidade civil ao Procurador Público por culpa leve ou erro interpretativo de tese jurídica controvertida. Erro: o CPC exige taxativamente dolo ou fraude (art. 184).",
      "Confundir impedimento com suspeição: impedimento gera nulidade absoluta e permite rescisória; suspeição preclui se não manifestada no prazo de resposta do incidente.",
      "Afirmar que a Defensoria Pública atua como curadora especial da Fazenda Pública. Falso: a Fazenda Pública é representada privativamente pela Advocacia Pública."
    ],
    "careerNuances": {
      "PGFN": "Defesa das prerrogativas da carreira de Procurador da Fazenda Nacional e imunidade material quanto às teses jurídicas sustentadas em pareceres e peças processuais.",
      "AGU": "Coordenação da representação judicial perante os tribunais superiores e sustentação de teses uniformizadas nos termos da Lei Complementar nº 73/1993."
    }
  },

  {
    "id": "fuc-proc-honorarios-advocaticios-sucumbencia-tema1076",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Honorários Advocatícios de Sucumbência: Faixas Escalonadas, STJ Tema 1.076 e Honorários da Fazenda Pública",
    "themeKeywords": [
      "honorários advocatícios",
      "honorarios advocaticios",
      "honorários de sucumbência",
      "honorários da fazenda pública",
      "tema 1076 stj",
      "tema 1076",
      "equidade",
      "apreciação equitativa",
      "artigo 85",
      "faixas escalonadas",
      "honorários recursais",
      "adi 6053",
      "titularidade dos honorários dos advogados públicos"
    ],
    "coreDoctrine": "### 1. Disciplina Geral dos Honorários de Sucumbência (CPC, Art. 85)\nOs honorários de sucumbência decorrem do princípio da causalidade e da sucumbência objetiva, cabendo ao vencido indenizar os custos advocatícios do vencedor. No procedimento comum geral entre particulares, a fixação deve obedecer à regra geral do artigo 85, § 2º: **entre 10% e 20%** sobre o valor da condenação, do proveito econômico obtido ou, subsidiariamente, sobre o valor atualizado da causa.\n\n### 2. Regime Diferenciado contra a Fazenda Pública (Art. 85, §§ 3º, 4º e 5º)\nQuando a Fazenda Pública for parte vencida ou vencedora, os honorários devem ser fixados obrigatoriamente de forma fracionada e progressiva, mediante as seguintes faixas escalonadas:\n1. **Até 200 salários mínimos**: de 10% a 20%;\n2. **De 200 a 2.000 salários mínimos**: de 8% a 10%;\n3. **De 2.000 a 20.000 salários mínimos**: de 5% a 8%;\n4. **De 20.000 a 100.000 salários mínimos**: de 3% a 5%;\n5. **Acima de 100.000 salários mínimos**: de 1% a 3%.\n\nA aplicação das alíquotas obedece à regra progressiva de repartição prevista no § 5º: calcula-se o percentual de cada faixa até o seu teto, incidindo o percentual inferior apenas sobre o excedente. Se a sentença for ilíquida, o percentual só será definido quando liquidado o julgado (art. 85, § 4º, II).\n\n### 3. O Julgamento Histórico do Tema 1.076 pelo STJ (Corte Especial)\nA regra da fixação por apreciação equitativa (CPC, art. 85, § 8º) prevê que o juiz fixará honorários equitativos exclusivamente em três hipóteses expressas e taxativas:\n1. Quando o proveito econômico for inestimável;\n2. Quando o proveito econômico for irrisório;\n3. Quando o valor da causa for muito baixo.\n\nDurante anos, magistrados aplicavam a equidade para reduzir honorários em causas com valor vultoso contra a Fazenda Pública. A Corte Especial do Superior Tribunal de Justiça, no paradigmático **Tema 1.076**, fixou as seguintes teses vinculantes:\n- **Tese 1**: A fixação dos honorários por apreciação equitativa não é permitida quando os valores da condenação, da causa ou o proveito econômico forem elevados. Nesses casos, é obrigatória a observância dos percentuais dos §§ 2º ou 3º do art. 85.\n- **Tese 2**: Apenas se admite o arbitramento por equidade de forma residual quando o valor da causa for inestimável, irrisório ou muito baixo.\n\n### 4. Honorários Recursais e Titularidade dos Advogados Públicos (STF ADI 6053)\nO tribunal, ao julgar recurso, majorará os honorários fixados na origem para remunerar o trabalho adicional em fase recursal (art. 85, § 11).\nNo âmbito da Advocacia Pública, o STF julgou constitucional na **ADI 6053** a percepção de honorários sucumbenciais por advogados públicos e procuradores da Fazenda Nacional (CPC art. 85, § 19 c/c Lei 13.327/2016), desde que a soma de sua remuneração com os honorários respeite rigorosamente o teto constitucional do funcionalismo público (CF, art. 37, XI).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Taxatividade Estrita do Art. 85, § 8º (Tema 1.076 do STJ)",
        "author": "Corte Especial do STJ (Relator Min. Og Fernandes)",
        "thesis": "O texto legal veda a equidade para causas de alto valor econômico, prestigiando a segurança jurídica e a legalidade estrita.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Tese da Equidade Inversa para Prevenir Enriquecimento Sem Causa",
        "author": "Posição Vencida no STJ / Defesa Histórica da Fazenda Pública",
        "thesis": "Sustentava que honorários milionários em causas repetitivas violariam a razoabilidade e a vedação ao enriquecimento sem causa do patrono vencedor.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas tentam aplicar a equidade do art. 85, § 8º para fixar honorários irrisórios em causas tributárias bilionárias vencidas pela Fazenda Pública. Erro após o Tema 1.076 do STJ: a fixação DEVE seguir as faixas escalonadas do § 3º.",
      "Afirmar que a Fazenda Pública paga honorários recursais mesmo quando o recurso interposto pela outra parte foi provido. Erro: honorários recursais só são devidos pelo recorrente vencido.",
      "Esquecer a trava do teto constitucional: os honorários pagos aos procuradores públicos submetem-se imperativamente ao teto remuneratório do subsídio dos Ministros do STF."
    ],
    "careerNuances": {
      "PGFN": "Aplicação imediata das faixas escalonadas do art. 85, § 3º em execuções fiscais e ações anulatórias de créditos tributários da União.",
      "AGU": "Defesa da constitucionalidade do rateio de honorários sucumbenciais perante o STF na ADI 6053 e respeito estrito ao abate-teto constitucional."
    }
  },

  {
    "id": "fuc-proc-atos-negocios-juridicos-invalidades-valor-causa",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Atos Processuais, Negócios Jurídicos Processuais (NJP), Invalidades e Valor da Causa",
    "themeKeywords": [
      "forma, tempo e lugar dos atos processuais",
      "negócios jurídicos processuais e protocolos institucionais",
      "comunicação dos atos processuais",
      "invalidades processuais",
      "da distribuição, do registro e do valor da causa",
      "atos processuais",
      "negocios juridicos processuais",
      "njp",
      "comunicacao dos atos",
      "citacao eletronica",
      "nulidades processuais",
      "pas de nullite sans grief",
      "valor da causa",
      "dias uteis",
      "artigo 188",
      "artigo 190",
      "artigo 219",
      "artigo 246",
      "artigo 277",
      "artigo 291"
    ],
    "coreDoctrine": "### 1. Atos Processuais e Contagem de Prazos em Dias Úteis (CPC, Arts. 188 a 235)\nO CPC/2015 consagrou a regra de que a contagem de prazos processuais dar-se-á exclusivamente em **dias úteis** (art. 219), aplicando-se apenas aos prazos tipicamente processuais, e não aos prazos de direito material (como prazos prescricionais e decadenciais do CTN ou Código Civil). Durante o recesso forense (20 de dezembro a 20 de janeiro), suspendem-se os prazos processuais e a realização de audiências e sessões de julgamento (art. 220).\n\n### 2. Negócios Jurídicos Processuais e Protocolos Institucionais da PGFN (Art. 190)\nO art. 190 consagra a cláusula geral de atipicidade dos negócios jurídicos processuais. Versando o processo sobre direitos que admitam autocomposição, é lícito às partes plenamente capazes celebrar convenções processuais para alterar regras de procedimento, prazos e ônus probatórios.\n\nNo âmbito da Procuradoria-Geral da Fazenda Nacional, a consensualidade e o NJP ganharam estatura regulamentar pioneira (Portaria PGFN nº 742/2018 e Portaria ME nº 247/2020). A PGFN pode celebrar NJP atípico em matéria tributária para:\n- Ajustar cronograma e ordem de penhora e expropriação patrimonial;\n- Aceitar bens alternativos em garantia sem prejuízo à Fazenda Pública;\n- Diferir atos de constrição patrimonial durante recuperação judicial do devedor;\n- Calendarização de atos processuais (art. 191).\n\n### 3. Sistema de Invalidades e o Princípio da Instrumentalidade das Formas (Arts. 276 a 283)\nO regime das invalidades processuais é regido pelo princípio da instrumentalidade das formas (art. 277) e pela máxima francesa **pas de nullité sans grief** (art. 282, § 1º: não se pronuncia a nulidade de ato processual quando não for comprovado efetivo prejuízo à parte). A nulidade relativa deve ser alegada na primeira oportunidade sob pena de preclusão; a nulidade absoluta, de ordem pública, pode ser conhecida de ofício, mas exige prévia intimação para evitar decisão surpresa.\n\n### 4. Distribuição, Registro e Valor da Causa (Arts. 284 a 293)\nA toda causa deve ser atribuído valor certo correspondente ao seu proveito econômico. Nas ações de anulação de débito fiscal ou cobrança, o valor da causa é o valor principal monetariamente corrigido com juros e encargos. O juiz pode corrigir de ofício o valor da causa quando manifestamente irrisório ou abusivo para recolhimento de custas ou fixação de honorários (art. 292, § 3º).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Legitimidade dos Negócios Jurídicos Processuais Tributários",
        "author": "PGFN (Portaria 742/2018) e Fredie Didier Jr.",
        "thesis": "A indisponibilidade do crédito tributário refere-se ao dever legal de cobrança, não impedindo a celebração de acordos procedimentais que otimizem a arrecadação e recuperação do crédito.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Rigidez Processual em Direito Público",
        "author": "Doutrina Administrativista Tradicional",
        "thesis": "Sustentava que a indisponibilidade do interesse público impedia qualquer flexibilização voluntária de regras procedimentais pelo ente estatal.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas tentam aplicar a contagem em dias úteis do art. 219 aos prazos de decadência e prescrição tributária. Erro grave: decadência e prescrição são de direito material e correm em dias corridos.",
      "Afirmar que o NJP pode alterar competência absoluta do juízo ou suprimir direitos de terceiros. Erro: competência absoluta é matéria improrrogável e infensa a convenção das partes.",
      "Afirmar que qualquer nulidade de citação exige repetição de todos os atos subsequentes mesmo sem prejuízo demonstrado. Erro frontal ao princípio pas de nullité sans grief."
    ],
    "careerNuances": {
      "PGFN": "Celebração estratégica de Negócios Jurídicos Processuais (NJP) para viabilizar garantias idôneas de débitos inscritos em Dívida Ativa da União e amortização estruturada.",
      "AGU": "Elaboração de protocolos institucionais de calendarização processual e redução de litigiosidade perante os Tribunais Regionais Federais."
    }
  },

  {
    "id": "fuc-proc-tutela-provisoria-urgencia-evidencia-vedacoes",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Tutela Provisória: Espécies, Requisitos, Estabilização e Regime de Vedações contra a Fazenda Pública",
    "themeKeywords": [
      "tutela provisória",
      "tutela provisoria",
      "tutela de urgência",
      "tutela da evidência",
      "estabilização da tutela antecipada",
      "formação, suspensão e extinção do processo",
      "formacao, suspensao e extincao do processo",
      "suspensao do processo",
      "extincao do processo",
      "vedações a liminares contra a fazenda",
      "lei 8437",
      "lei 9494",
      "adc 4",
      "artigo 294",
      "artigo 300",
      "artigo 304",
      "artigo 311",
      "artigo 313",
      "artigo 485",
      "artigo 487"
    ],
    "coreDoctrine": "### 1. Espécies de Tutela Provisória e Requisitos Gerais (CPC, Arts. 294 a 311)\nA tutela provisória bifurca-se segundo o seu fundamento:\n1. **Tutela de Urgência (Art. 300)**: Fundamenta-se no perigo de dano ou risco ao resultado útil do processo (periculum in mora) e na probabilidade do direito (fumus boni iuris). Pode ter natureza **antecipada** (satisfativa no plano fático) ou **cautelar** (assecuratória do direito material). É vedada a concessão de tutela antecipada quando houver perigo de irreversibilidade dos efeitos da decisão (§ 3º).\n2. **Tutela da Evidência (Art. 311)**: Prescinde inteiramente da comprovação de perigo de dano. Concede-se quando caracterizado abuso do direito de defesa/manifesto propósito protelatório (inciso I); houver prova documental aliada a tese em recursos repetitivos ou súmula vinculante (inciso II); pedido reipersecutório fundado em contrato de depósito (inciso III); ou petição com prova documental cabal não contraposta por dúvida razoável do réu (inciso IV). Apenas os incisos II e III autorizam concessão liminar inaudita altera parte.\n\n### 2. Estabilização da Tutela Antecipada Antecedente (CPC, Arts. 303 e 304)\nA tutela de urgência antecipada requerida em caráter antecedente torna-se **estável** se, concedida a medida, o réu não interpuser o respectivo agravo de instrumento (art. 304). Uma vez estabilizada, o processo é extinto sem resolução de mérito. Qualquer das partes dispõe do prazo decadencial de **2 anos** para ajuizar ação autônoma com o fito de rever, reformar ou invalidar a decisão estabilizada. A estabilização não faz coisa julgada material, mas produz efeitos preclusivos continuados.\n\n### 3. Vedações à Concessão de Liminares contra a Fazenda Pública\nO ordenamento jurídico estabelece barreiras protetivas fundamentais contra tutelas precárias que afetem os cofres públicos:\n- **Lei nº 8.437/1992, Art. 1º, § 3º**: Não cabe liminar contra o Poder Público que esgote, no todo ou em qualquer parte, o objeto da ação;\n- **Lei nº 9.494/1997, Art. 1º (STF ADC 4)**: É constitucional a vedação de liminares contra a Fazenda Pública que importem em reclassificação ou equiparação de servidores públicos, concessão de aumentos ou extensão de vantagens pecuniárias e pagamento de vencimentos;\n- **Lei nº 12.016/2009, Art. 7º, § 2º**: Vedada concessão de liminar em mandado de segurança para compensação de créditos tributários, entrega de mercadorias provenientes do exterior ou reclassificação funcional.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Inaplicabilidade da Estabilização contra a Fazenda Pública Sujeita a Remessa Necessária",
        "author": "Doutrina Publicista e Jurisprudência Defensiva da AGU/PGFN",
        "thesis": "Como as decisões desfavoráveis à Fazenda submetem-se ao reexame do art. 496, a ausência de agravo não pode dispensar a tutela do patrimônio público para estabilizar provimentos precários.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Aplicabilidade Geral da Estabilização Inclusive à Fazenda Pública",
        "author": "Doutrina Processualista Civil Geral",
        "thesis": "Sustenta que o art. 304 não cria exceção para a Fazenda, cabendo ao procurador o ônus de recorrer sob pena de estabilização.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas tentam conceder tutela da evidência liminar com base no inciso I do art. 311 (abuso de defesa). Erro: o inciso I pressupõe que o réu já tenha contestado com propósito protelatório, sendo vedada concessão liminar.",
      "Afirmar que a tutela estabilizada faz coisa julgada material. Erro clássico: a tutela estabilizada não faz coisa julgada material, extinguindo-se a ação e operando eficácia executiva provisória com prazo rescisório de 2 anos.",
      "Afirmar que liminar pode autorizar compensação tributária imediata contra a Fazenda Pública. Vedação expressa do art. 7º, § 2º da Lei 12.016/2009 e Súmula 212 do STJ."
    ],
    "careerNuances": {
      "PGFN": "Arguição imediata da vedação legal à concessão de liminares para compensação de créditos tributários ou liberação indevida de mercadorias retidas em alfândega.",
      "AGU": "Manejo da suspensão de liminar perante a presidência dos Tribunais para estancar decisões de tutela de urgência contrárias ao art. 1º da Lei 9.494/1997."
    }
  },

  {
    "id": "fuc-proc-conhecimento-procedimento-comum-coisa-julgada",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Processo de Conhecimento, Procedimento Comum, Revelia da Fazenda e Coisa Julgada Material",
    "themeKeywords": [
      "processo de conhecimento. procedimento comum",
      "procedimentos especiais",
      "coisa julgada",
      "processo de conhecimento",
      "procedimento comum",
      "petição inicial",
      "contestação",
      "revelia contra a fazenda pública",
      "julgamento conforme o estado do processo",
      "limites da coisa julgada",
      "temas 881 e 885 stf",
      "coisa julgada tributaria de trato continuado",
      "artigo 319",
      "artigo 335",
      "artigo 345",
      "artigo 355",
      "artigo 502",
      "artigo 505"
    ],
    "coreDoctrine": "### 1. Petição Inicial e Resposta do Réu no Procedimento Comum (CPC, Arts. 319 a 346)\nO procedimento comum inicia-se com a petição inicial (art. 319), submetendo-se a indeferimento da petição inicial (art. 330) ou julgamento de improcedência liminar do pedido (art. 332) caso a pretensão contrarie súmula do STF/STJ, acórdão em recursos repetitivos ou entendimento em IRDR.\n\nA contestação deve concentrar todas as matérias de defesa, sob pena de preclusão consumativa (princípio da eventualidade - art. 336). No entanto, quando a **Fazenda Pública for ré**, o efeito material da revelia (presunção de veracidade dos fatos alegados pelo autor) **não se produz** (art. 345, II), pois o litígio versa sobre direitos indisponíveis. A revelia contra o Poder Público atrai unicamente a preclusão temporal dos atos pretéritos, subsistindo ao autor o ônus de provar os fatos constitutivos de seu direito.\n\n### 2. Julgamento Conforme o Estado do Processo (CPC, Arts. 354 a 357)\nUltrapassadas as providências preliminares, o juiz proferirá extinção sem resolução do mérito (art. 354), julgamento antecipado total do mérito (art. 355) ou julgamento antecipado parcial do mérito (art. 356 - impugnável por agravo de instrumento). Não sendo caso de julgamento imediato, profere-se a decisão de saneamento e organização do processo (art. 357), fixando pontos controvertidos e distribuindo o ônus da prova.\n\n### 3. Coisa Julgada Material e os Temas 881 e 885 do STF\nA coisa julgada material consubstancia a autoridade de imutabilidade da decisão de mérito irrecorrível (art. 502). Ela opera limites subjetivos (vincula as partes e não prejudica terceiros) e limites objetivos (restringe-se ao dispositivo da sentença, salvo prejudicial incidental expressa e contraditada do art. 503, § 1º).\n\nEm relações jurídicas tributárias de **trato continuado**, o Plenário do STF firmou nos **Temas 881 e 885** teses de importância nodal para a PGFN:\n- As decisões do STF em controle concentrado ou em sede de repercussão geral **cessam automaticamente os efeitos futuros da coisa julgada** que tenha reconhecido a um contribuinte a imunidade ou inexigibilidade de tributo recolhido de forma continuada (como CSLL), sem necessidade de ajuizamento de ação rescisória.\n- A cessação dos efeitos respeita a anterioridade anual ou nonagesimal, conforme a natureza do tributo.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Cessação Automática da Coisa Julgada Tributária de Trato Continuado (STF Temas 881 e 885)",
        "author": "Supremo Tribunal Federal (Plenário)",
        "thesis": "A eficácia da coisa julgada tributária em relações sucessivas subordinava-se à cláusula rebus sic stantibus, extinguindo-se prospectivamente quando sobrevier tese vinculante em sentido contrário do STF.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Indispensabilidade da Ação Rescisória",
        "author": "Doutrina Tradicional e Contribuintes Vencidos",
        "thesis": "Sustentava que mesmo diante de decisão contrária do STF, a segurança jurídica exigiria o ajuizamento de rescisória no biênio legal para desconstituir o comando individual favorável.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que a revelia da Fazenda Pública torna incontroversos os fatos alegados na inicial. Erro crasso: o art. 345, II do CPC afasta categoricamente a presunção de veracidade sobre direitos indisponíveis.",
      "Afirmar que a União precisa ajuizar ação rescisória para derrubar coisa julgada que isentou contribuinte de CSLL após o STF declarar o tributo constitucional. Erro direto aos Temas 881 e 885: a cessação é automática e prescinde de rescisória.",
      "Confundir recurso contra julgamento antecipado parcial de mérito: o recurso cabível é o agravo de instrumento (CPC, art. 356, § 5º), e não apelação."
    ],
    "careerNuances": {
      "PGFN": "Aplicação direta dos Temas 881 e 885 para cobrar tributos de empresas que detinham liminares antigas de trato continuado contrárias à jurisprudência do STF.",
      "AGU": "Sustentação da inaplicabilidade da revelia e da necessidade de prova documental robusta pelo particular nas demandas contra a União."
    }
  },

  {
    "id": "fuc-proc-liquidacao-cumprimento-execucao-titulos",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Liquidação de Sentença, Cumprimento de Sentença contra a Fazenda Pública e Processo de Execução",
    "themeKeywords": [
      "liquidação de sentença",
      "cumprimento da sentença",
      "do processo de execução",
      "liquidacao de sentenca",
      "cumprimento da sentenca",
      "processo de execucao",
      "cumprimento contra a fazenda pública",
      "impugnação ao cumprimento de sentença",
      "precatórios e rpv",
      "títulos executivos extrajudiciais",
      "ordem de penhora",
      "artigo 509",
      "artigo 535",
      "artigo 784",
      "artigo 835",
      "artigo 921",
      "tema 810 stf"
    ],
    "coreDoctrine": "### 1. Liquidação de Sentença (CPC, Arts. 509 a 512)\nA liquidação destina-se a quantificar a obrigação ilíquida reconhecida no título executivo judicial. Dá-se por:\n- **Arbitramento (Art. 509, I)**: Quando determinado pela sentença, convencionado pelas partes ou exigido pela natureza do objeto (necessidade de perícia técnica contábil ou de engenharia).\n- **Procedimento Comum (Art. 509, II)**: Quando houver necessidade de alegar e provar fato novo indispensável à quantificação.\nO art. 509, § 4º consagra a vedação de discutir de novo a lide ou modificar a sentença que a julgou na fase de liquidação.\n\n### 2. Cumprimento de Sentença Contra a Fazenda Pública (CPC, Arts. 534 e 535)\nO cumprimento de sentença que impõe à Fazenda Pública dever de pagar quantia certa possui rito próprio:\n1. O exequente apresenta demonstrativo discriminado do cálculo;\n2. A Fazenda Pública é intimada na pessoa de seu procurador para, no prazo de **30 dias**, apresentar **impugnação aos próprios autos** (CPC, art. 535);\n3. As matérias de defesa restringem-se ao rol do art. 535 (falta/nulidade de citação, ilegitimidade, inexigibilidade do título, excesso de execução, incompetência absoluta e causas extintivas supervenientes ao trânsito em julgado);\n4. Não impugnada a execução ou rejeitada a impugnação, expedir-se-á **Precatório** ou **Requisição de Pequeno Valor (RPV)** perante o Tribunal competente, nos termos do art. 100 da CF/88.\n\n### 3. Juros Moratórios, Correção Monetária e Taxa SELIC (STF Tema 810 e EC 113/2021)\nO regime das condenações pecuniárias da Fazenda Pública sofreu importante evolução:\n- **STF Tema 810**: Reconheceu a inconstitucionalidade da TR para correção monetária, determinando o IPCA-E para débitos não tributários.\n- **Emenda Constitucional nº 113/2021, Art. 3º**: Unificou o índice nas condenações da Fazenda Pública, fixando que a partir de dezembro de 2021 incidirá unicamente a **taxa SELIC** a título de correção monetária e juros de mora acumulados, vedada cumulação com qualquer outro índice.\n\n### 4. Processo de Execução de Título Extrajudicial (CPC, Arts. 771 a 925)\nA execução funda-se em título líquido, certo e exigível. São títulos extrajudiciais a certidão de dívida ativa da Fazenda Pública (art. 784, IX), cheques, debêntures e escrituras públicas. A penhora obedece à ordem preferencial do art. 835 (dinheiro em primeiro lugar). O executado pode opor-se mediante **embargos à execução em 15 dias** (art. 915), independentemente de penhora para particulares (diversamente da execução fiscal da LEF).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Incidência Exclusiva da Taxa SELIC a Partir da EC 113/2021",
        "author": "STJ (Corte Especial) e Jurisprudência Pacificada",
        "thesis": "A determinação constitucional da EC 113/2021 é de eficácia imediata, englobando simultaneamente correção monetária e juros de mora em todas as condenações impostas ao Erário.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Preservação de Juros Separados por Critério de Especialidade",
        "author": "Posição Minoritária de Exequentes",
        "thesis": "Tentava manter juros do art. 1º-F da Lei 9.494/97 somados à correção da SELIC.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que a impugnação ao cumprimento de sentença contra a Fazenda Pública tem prazo de 15 dias. Erro: o prazo é de 30 dias (CPC, art. 535), e não se dobra pelo art. 183.",
      "Afirmar que incidem juros de mora entre a data da expedição do precatório e o seu efetivo pagamento no prazo constitucional. Súmula Vinculante 17 do STF: NÃO incidem juros de mora durante o período do art. 100, § 5º da CF.",
      "Esquecer a prescrição intercorrente na execução: decorrido 1 ano de suspensão sem localização de bens, inicia-se o prazo de prescrição intercorrente do direito material (CPC, art. 921, § 4º)."
    ],
    "careerNuances": {
      "PGFN": "Verificação minuciosa dos cálculos de execução contra a União para impugnar excesso de execução decorrente de cumulação indevida de juros e desrespeito à Taxa SELIC da EC 113/2021.",
      "AGU": "Gestão do passivo de precatórios federais e sustentação das teses repetitivas do STF e STJ nos cumprimentos de sentença multitudinários."
    }
  },

  {
    "id": "fuc-proc-execucao-fiscal-lef-cautelar-pre-executividade",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Execução Fiscal (Lei 6.830/80), CDA, Embargos do Devedor, Cautelar Fiscal e Exceção de Pré-Executividade",
    "themeKeywords": [
      "execução fiscal. embargos à execução. aplicação subsidiária do cpc. cautelar fiscal",
      "execucao fiscal. embargos a execucao",
      "execução fiscal",
      "embargos à execução fiscal",
      "certidão de dívida ativa",
      "cda",
      "cautelar fiscal",
      "exceção de pré-executividade",
      "lei 6830",
      "lei 8397",
      "súmula 393 stj",
      "tema 568 stj",
      "prescrição intercorrente na lef"
    ],
    "coreDoctrine": "### 1. A Certidão de Dívida Ativa (CDA) e Pressupostos da LEF (Lei nº 6.830/1980)\nA Execução Fiscal é o procedimento especial de cobrança judicial da dívida ativa tributária e não tributária da União, Estados, DF, Municípios e suas autarquias. Funda-se na **Certidão de Dívida Ativa (CDA)**, documento formal emitido pela autoridade competente (PGFN no âmbito federal) após o controle prévio administrativo de legalidade do lançamento (LEF, art. 2º, § 3º). A CDA regularmente inscrita goza de presunção de certeza e liquidez e tem o efeito de prova pré-constituída (art. 3º), só podendo ser elidida por prova inequívoca do devedor.\n\n### 2. Citação, Penhora e Embargos do Executado (Arts. 8º, 11 e 16)\nO executado é citado por via postal com AR (art. 8º) para pagar em 5 dias ou garantir o juízo mediante depósito em dinheiro, fiança bancária, seguro garantia ou indicação de bens da ordem do art. 11 (dinheiro preferencial).\nA oposição de **embargos à execução fiscal** exige a observância das regras especiais da LEF:\n- **Prazo de 30 dias** (art. 16), contados do depósito, da juntada da fiança bancária/seguro garantia ou da intimação da penhora;\n- **Necessidade estrita de garantia prévia do juízo** (art. 16, § 1º: não se admitem embargos antes de garantida a execução), não se aplicando o art. 914 do CPC;\n- A apelação dos embargos à execução é recebida em regra apenas no efeito devolutivo.\n\n### 3. Exceção de Pré-Executividade na Execução Fiscal (STJ Súmula 393)\nA exceção de pré-executividade constitui criação doutrinária e pretoriana que permite ao executado suscitar incidentes processuais sem necessidade de garantia do juízo. O STJ pacificou os seus limites na **Súmula 393**:\n- *A exceção de pré-executividade é admissível na execução fiscal relativamente às matérias conhecíveis de ofício que não demandem dilação probatória.*\nCabível para alegar prescrição, decadência, ilegitimidade manifesta da parte ou nulidade formal flagrante da CDA, sendo vedada para discussões que exijam perícia contábil ou produção de prova testemunhal.\n\n### 4. Prescrição Intercorrente na Execução Fiscal (LEF, Art. 40 e STJ Tema 568)\nA Primeira Seção do STJ uniformizou no repetitivo **Tema 568** o rito do art. 40 da LEF:\n1. Não localizado o devedor ou bens, o juiz suspende a execução por 1 ano de forma automática, independentemente de requerimento expresso da Fazenda;\n2. Durante o prazo de 1 ano, não corre a prescrição;\n3. Terminado o prazo de 1 ano, inicia-se automaticamente a contagem do prazo de **prescrição intercorrente quinquenal (5 anos)**;\n4. O requerimento de medidas inócuas ou infrutíferas não interrompe a contagem da prescrição intercorrente;\n5. O magistrado pode decretar a prescrição intercorrente de ofício após prévia oitiva da Fazenda Pública.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Exigência de Garantia Integral para Embargos à Execução Fiscal",
        "author": "STJ (Primeira Seção) e Jurisprudência Vinculante",
        "thesis": "O art. 16, § 1º da LEF é norma especial que prevalece sobre o CPC, sendo inadmissíveis embargos do devedor sem a garantia integral do juízo, ressalvada a comprovação de absoluta hipossuficiência.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Aplicação Subsidiária do Art. 914 do CPC",
        "author": "Doutrina Minoritária de Defesa dos Executados",
        "thesis": "Sustentava que o CPC/2015 teria revogado a exigência de garantia prévia para viabilizar o direito de defesa.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que os embargos à execução fiscal independem de garantia do juízo por aplicação subsidiária do CPC. Erro fatal: a LEF é lei especial e exige expressamente a garantia prévia no art. 16, § 1º.",
      "Afirmar que a exceção de pré-executividade admite dilação probatória documental suplementar ou perícia. Erro direto à Súmula 393 do STJ: a matéria deve ser provada de plano com a petição inicial.",
      "Contar a prescrição intercorrente da data da citação: o termo inicial da prescrição intercorrente é o primeiro dia após o término do período de 1 ano de suspensão (Tema 568 do STJ)."
    ],
    "careerNuances": {
      "PGFN": "Carro-chefe da atuação judicial da Procuradoria da Fazenda Nacional: controle da CDA, execução fiscal de grandes devedores e combate à prescrição intercorrente mediante protesto e indisponibilidade do art. 185-A do CTN.",
      "AGU": "Cobrança judicial das dívidas ativas autárquicas do Ibama, ANTT e agências reguladoras sob a sistemática da LEF."
    }
  },

  {
    "id": "fuc-proc-recursos-precedentes-repercussao-geral-irdr",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Teoria Geral dos Recursos, Precedentes Obrigatórios, Repercussão Geral e IRDR",
    "themeKeywords": [
      "ordem dos processos",
      "recursos e outros meios de impugnação",
      "repercussão geral",
      "sistema de precedentes",
      "recursos",
      "repercussao geral",
      "sistema de precedentes",
      "apelação",
      "agravo de instrumento",
      "taxatividade mitigada",
      "tema 988 stj",
      "embargos de declaração",
      "ação rescisória",
      "reclamação constitucional",
      "ratio decidendi",
      "distinguishing",
      "overruling",
      "irdr",
      "iac",
      "artigo 926",
      "artigo 927",
      "artigo 976",
      "artigo 988",
      "artigo 1015",
      "artigo 1022",
      "artigo 1035"
    ],
    "coreDoctrine": "### 1. Sistema de Precedentes Obrigatórios no CPC (Arts. 926 e 927)\nO CPC/2015 impôs aos tribunais o dever de manter sua jurisprudência estável, íntegra e coerente (art. 926). O artigo 927 estabelece o rol de pronunciamentos judiciais de eficácia vinculante obrigatória:\n1. Decisões do STF em controle concentrado de constitucionalidade;\n2. Enunciados de Súmula Vinculante do STF;\n3. Acórdãos proferidos em IAC e IRDR e em recursos especial e extraordinário repetitivos;\n4. Enunciados de súmulas do STF e do STJ;\n5. Orientações vinculantes do plenário ou órgão especial do tribunal.\n\nA operabilidade dos precedentes exige o domínio da **ratio decidendi** (fundamentos determinantes da tese), do **distinguishing** (distinção fática ou jurídica entre o caso concreto e o paradigma) e do **overruling** (superação de precedente por mudança axiológica, legislativa ou fática, passível de modulação de efeitos prospectivos).\n\n### 2. O Incidente de Resolução de Demandas Repetitivas - IRDR (Arts. 976 a 987)\nO IRDR objetiva conferir tratamento isonômico a litígios massificados. Requisitos cumulativos: efetiva repetição de processos sobre a mesma questão unicamente de direito e risco de ofensa à isonomia e à segurança jurídica. A admissão pelo tribunal de segundo grau suspende todos os processos pendentes na região ou Estado. Fixada a tese, ela se aplica a todas as causas atuais e futuras no âmbito de competência do tribunal.\n\n### 3. Agravo de Instrumento e o Tema 988 do STJ (Taxatividade Mitigada)\nO artigo 1.015 do CPC estabelece o rol de decisões interlocutórias agraváveis. A Corte Especial do STJ, no **Tema 988**, fixou que o rol do art. 1.015 é de **taxatividade mitigada**, admitindo-se agravo de instrumento fora das hipóteses legais quando for demonstrada urgência decorrente da inutilidade do julgamento da questão em sede de apelação (a exemplo da decisão que indefere segredo de justiça ou define competência do juízo).\n\n### 4. Repercussão Geral no Recurso Extraordinário (CF art. 102, § 3º e CPC arts. 1.035 a 1.041)\nO Recurso Extraordinário perante o STF exige demonstração de repercussão geral (relevância econômica, política, social ou jurídica que ultrapasse os interesses subjetivos da causa). Negada a repercussão geral, o acórdão é irrecorrível perante todos os tribunais. Contra a decisão da presidência do tribunal de origem que aplica tese de repercussão geral para negar seguimento ao RE, o recurso cabível é o **agravo interno**, e não agravo em RE (CPC, art. 1.030, § 2º).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Taxatividade Mitigada sob Critério de Urgência (Tema 988 do STJ)",
        "author": "Corte Especial do STJ (Relatora Min. Nancy Andrighi)",
        "thesis": "O rol do art. 1.015 comporta interpretação extensiva mediante taxatividade mitigada quando demonstrado o risco de prejuízo irreparável pela espera da apelação.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Taxatividade Absoluta do Rol do Artigo 1.015",
        "author": "Doutrina Tradicional e Voto Vencido",
        "thesis": "Sustentava que decisões interlocutórias não previstas expressamente no rol deveriam aguardar a preliminar de apelação (art. 1.009, § 1º).",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas cobram o recurso cabível contra decisão da presidência do tribunal de origem que nega seguimento a recurso extraordinário com base em precedente vinculante do STF: o recurso cabível é AGRAVO INTERNO perante o próprio tribunal, e não agravo em RE (ARE).",
      "Afirmar que a apelação no CPC/2015 é sempre recebida no efeito suspensivo. Erro: há exceções expressas no art. 1.012, § 1º (como alimentos, embargos à execução e demarcação).",
      "Esquecer a preclusão dos embargos de declaração: interpostos tempestivamente, os embargos INTERROMPEM (e não suspendem) o prazo para outros recursos."
    ],
    "careerNuances": {
      "PGFN": "Mapeamento intensivo de recursos extraordinários com repercussão geral reconhecida no STF para suspensão de cobranças e negociação de transação tributária.",
      "AGU": "Sustentação oral perante o Plenário do STF e Corte Especial do STJ na defesa de teses estruturantes da União e preservação dos precedentes vinculantes."
    }
  },

  {
    "id": "fuc-proc-coletivo-estrutural-juizados-acoes-constitucionais",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "Processo Coletivo, Processo Estrutural, Juizados Especiais Federais e Ações Constitucionais",
    "themeKeywords": [
      "processo coletivo",
      "processo estrutural",
      "juizado especial federal",
      "suspensão de segurança",
      "ações constitucionais",
      "acao civil publica",
      "tutela coletiva",
      "tema 1075 stf",
      "litígios complexos estruturais",
      "jef",
      "lei 10259",
      "mandado de segurança",
      "lei 12016",
      "suspensao de seguranca",
      "lei 8437",
      "grave lesao a ordem e economia publicas"
    ],
    "coreDoctrine": "### 1. O Microssistema de Tutela Coletiva e a Eficácia Erga Omnes Nacional (Tema 1.075 do STF)\nO microssistema da tutela coletiva é formado primordialmente pela Lei da Ação Civil Pública (Lei nº 7.347/1985) e pelo Código de Defesa do Consumidor (arts. 81 a 104 da Lei nº 8.078/1990). O STF, no histórico julgamento do **Tema 1.075**, declarou a **inconstitucionalidade do art. 16 da LACP** (com a redação dada pela Lei nº 9.494/1997), que tentava restringir os efeitos da sentença coletiva aos limites territoriais do órgão prolator. Portanto, a coisa julgada nas ações civis públicas produz eficácia erga omnes ou ultra partes em âmbito regional ou nacional, conforme a extensão do dano e o pedido formulado.\n\n### 2. Processo Estrutural e Litígios Policêntricos\nO processo estrutural destina-se a solucionar conflitos complexos, policêntricos e de feição continuada, envolvendo falhas estruturais em políticas públicas estatais (como saneamento, sistema prisional, saúde pública ou equilíbrio fiscal). Caracteriza-se por:\n- Decisões em cascata com provimentos prospectivos e metas graduais;\n- Consensualidade e ampla participação social;\n- Plano de transição institucional com flexibilidade temporal para cumprimento pelo Executivo;\n- Superação do modelo adjudicatório tradicional binário (vencedor versus vencido).\n\n### 3. Juizados Especiais Federais (Lei nº 10.259/2001)\nOs Juizados Especiais Federais Cíveis possuem **competência absoluta** para causas cíveis da competência da Justiça Federal até o valor de **60 salários mínimos** (art. 3º). O art. 3º, § 1º exclui taxativamente da competência do JEF as causas de mandado de segurança, desapropriação, divisão e demarcação, improbidade administrativa, execuções fiscais e demandas que versem sobre direitos difusos e coletivos. Das sentenças dos JEFs cabe recurso inominado para a Turma Recursal em 10 dias. Divergências jurisprudenciais são uniformizadas pela Turma Nacional de Uniformização (TNU).\n\n### 4. Suspensão de Segurança e Ações Constitucionais (Lei nº 8.437/92 e Lei nº 12.016/2009)\nA suspensão de segurança consubstancia incidente político-processual de competência exclusiva do Presidente do Tribunal recursal para suspender a execução de liminar ou sentença contra o Poder Público a fim de evitar **grave lesão à ordem, à saúde, à segurança ou à economia públicas** (Lei 8.437/92, art. 4º c/c Lei 12.016/2009, art. 15). Da decisão do Presidente cabe agravo regimental em 5 dias, sem efeito suspensivo.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Inconstitucionalidade da Limitação Territorial do Art. 16 da LACP (Tema 1.075 do STF)",
        "author": "Supremo Tribunal Federal (Plenário)",
        "thesis": "A restrição territorial do art. 16 viola a isonomia e a proteção adequada aos direitos metaindividuais, operando a coisa julgada em escala territorial compatível com a lesão.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Constitucionalidade da Limitação Territorial",
        "author": "Posição Vencida no STF e Antiga Defesa da União",
        "thesis": "Defendia a legalidade da limitação territorial para evitar que um juiz singular de primeira instância emitisse ordens com alcance em todo o território nacional.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas tentam aplicar a competência do JEF para Execução Fiscal de até 60 salários mínimos. Erro crasso: o art. 3º, § 1º, I da Lei 10.259/2001 exclui expressamente a Execução Fiscal da competência do JEF.",
      "Afirmar que a suspensão de segurança analisa o mérito do direito material debatido. Erro: a suspensão restringe-se ao juízo de estancamento da grave lesão à ordem, saúde, segurança ou economia públicas.",
      "Afirmar que na Ação Civil Pública a sentença limita seus efeitos à circunscrição do juiz prolator (art. 16 da LACP). Erro superado pelo Tema 1.075 do STF que declarou o artigo inconstitucional."
    ],
    "careerNuances": {
      "PGFN": "Manejo da suspensão de segurança perante o STJ e STF contra decisões liminares que causem rombo orçamentário e grave lesão à economia pública.",
      "AGU": "Atuação destacada nos processos estruturais perante o STF para construção de planos consensuais de reestruturação de políticas públicas federais."
    }
  },

  {
    "id": "fuc-proc-lindb-liberdade-economica-etica-virtualizacao",
    "discipline": "DIREITO PROCESSUAL CIVIL",
    "title": "A LINDB Processual (Lei 13.655/2018), Lei de Liberdade Econômica, Ética e Virtualização da Justiça",
    "themeKeywords": [
      "código de ética profissional dos advogados",
      "lei de introdução às normas do direito brasileiro",
      "lei de liberdade econômica",
      "virtualização da justiça",
      "codigo de etica profissional",
      "lindb",
      "lei de liberdade economica",
      "virtualizacao da justica",
      "consequencialismo juridico",
      "erro grosseiro",
      "artigo 20 lindb",
      "artigo 28 lindb",
      "desconsideração da personalidade jurídica",
      "artigo 50 cc",
      "estatuto da oab",
      "pje",
      "lei 11419",
      "processo judicial eletronico",
      "intimação eletrônica"
    ],
    "coreDoctrine": "### 1. A LINDB e o Consequencialismo Decisório (Arts. 20 a 30 da Lei de Introdução)\nA Lei nº 13.655/2018 introduziu na LINDB dispositivos estruturantes de segurança jurídica e pragmaticismo decisório para a gestão pública e o processo:\n- **Art. 20 (Consequencialismo e Motivação Pragmatista)**: Nas esferas judicial, administrativa e controladora, não se decidirá com base em valores jurídicos abstratos sem que sejam consideradas as consequências práticas da decisão. O magistrado deve ponderar a necessidade, a adequação e as possíveis alternativas de sua medida;\n- **Art. 22 (Obstáculos Reais do Gestor)**: Na interpretação sobre atos de gestão pública, o juiz deve considerar os obstáculos e as dificuldades reais do gestor e as exigências das políticas públicas;\n- **Art. 23 (Modulação Temporal de Novas Interpretações)**: Nova interpretação jurídica que modifique orientação geral consolidada deve prever regime de transição para resguardar a confiança legítima;\n- **Art. 28 (Erro Grosseiro e Dolo)**: O agente público responderá pessoalmente por suas decisões e pareceres técnicos apenas em caso de dolo ou erro grosseiro (culpa grave inescusável), não respondendo por escolhas fundamentadas em orientações jurídicas plausíveis.\n\n### 2. A Lei da Liberdade Econômica e a Desconsideração da Personalidade Jurídica (Art. 50 do Código Civil)\nA Lei nº 13.874/2019 alterou profundamente o art. 50 do Código Civil para blindar a autonomia da pessoa jurídica e reprimir o uso desmedido da desconsideração. Adotou requisitos estritos e cumulativos da Teoria Maior:\n- **Desvio de Finalidade (§ 1º)**: Utilização dolosa da pessoa jurídica com o propósito de lesar credores e para a prática de atos ilícitos;\n- **Confusão Patrimonial (§ 2º)**: Ausência de separação de fato entre os patrimônios dos sócios e da empresa (como cumprimento repetitivo pela sociedade de obrigações do sócio ou transferência desprovida de causa).\nA mera insolvência ou falta de bens não autoriza a desconsideração ordinária no direito civil e empresarial.\n\n### 3. Virtualização da Justiça e Processo Eletrônico (Lei nº 11.419/2006)\nA digitalização dos atos processuais e o Processo Judicial Eletrônico (PJe) são regidos pela Lei nº 11.419/2006:\n- **Intimação Eletrônica em Portal Próprio (Art. 5º)**: Considera-se realizada a intimação no dia em que o intimando efetivar a consulta ao teor da mensagem. Caso a consulta não seja realizada em até 10 dias corridos contados do envio, a intimação é considerada automaticamente realizada no término desse prazo (intimação ficta ou tácita);\n- **Prerrogativa da Fazenda Pública**: A intimação da Fazenda dá-se prioritariamente por portal eletrônico institucional interligado aos sistemas da AGU e PGFN (Sistema Sapiens).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Conceito Estrito de Erro Grosseiro na LINDB (Art. 28)",
        "author": "STF (Plenário - ADI 6421) e TCU",
        "thesis": "O erro grosseiro consiste na culpa grave manifesta, caracterizada por negligência inescusável, imprudência evidente ou erro que reflete desvio inaceitável dos padrões ordinários de conduta.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Equiparação do Erro Grosseiro à Culpa Simples",
        "author": "Doutrina Tradicional Minoritária",
        "thesis": "Pretendia responsabilizar pareceristas públicos por qualquer falha formal de avaliação técnica.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas tentam aplicar a desconsideração da personalidade jurídica no Código Civil com base na mera insolvência (Teoria Menor). Erro crasso: o Código Civil exige a Teoria Maior (desvio de finalidade doloso ou confusão patrimonial).",
      "Afirmar que a consulta eletrônica no PJe inicia a contagem no dia seguinte ao término dos 10 dias mesmo quando a parte abriu a intimação no 2º dia. Erro: se a parte abre no 2º dia, a intimação é perfeita e acabada no próprio dia da consulta.",
      "Afirmar que o juiz pode anular ato administrativo invocando apenas o princípio abstrato da moralidade sem indicar as consequências práticas da anulação. Violação frontal ao art. 20 da LINDB."
    ],
    "careerNuances": {
      "PGFN": "Utilização do art. 28 da LINDB para salvaguardar os procuradores da Fazenda de perseguições disciplinares e aplicação do art. 50 do Código Civil na responsabilização de fraudes fiscais societárias.",
      "AGU": "Integração do Sistema Sapiens à plataforma do PJe para garantia dos prazos da União e acompanhamento em tempo real das intimações judiciais."
    }
  }
,

  {
    "id": "fuc-civil-lindb-pessoas-capacidade-bens",
    "discipline": "DIREITO CIVIL",
    "title": "LINDB, Personalidade Jurídica, Capacidade Civil e Regime Jurídico dos Bens Públicos",
    "themeKeywords": [
      "lei de introdução às normas do direito brasileiro",
      "lei de introducao as normas do direito brasileiro",
      "lindb",
      "das pessoas",
      "pessoas",
      "bens. diferentes classes",
      "bens",
      "capacidade civil",
      "personalidade civil",
      "bens públicos",
      "bens dominicais",
      "imprescritibilidade de bens publicos",
      "artigo 1",
      "artigo 3",
      "artigo 40",
      "artigo 98"
    ],
    "coreDoctrine": "### 1. A LINDB e a Aplicação das Normas no Tempo e Espaço (Decreto-Lei nº 4.657/1942)\nA Lei de Introdução às Normas do Direito Brasileiro (LINDB) consubstancia uma lex legum (norma de sobredireito) que rege a vigência, interpretação, eficácia espacial e temporal das leis, além de balizar a atuação administrativa e judicial após a promulgação da Lei nº 13.655/2018 (arts. 20 a 30).\n- **Vigência Temporal (Art. 1º)**: Salvo disposição contrária, a lei começa a vigorar em todo o país 45 dias depois de oficialmente publicada, e no estrangeiro 3 meses após a publicação;\n- **Princípio da Continuidade (Art. 2º)**: A lei terá vigor até que outra a modifique ou revogue. A revogação tácita ocorre quando a lei posterior for com ela incompatível ou regular inteiramente a matéria da lei anterior;\n- **Reprística Condicionada (Art. 2º, § 3º)**: Salvo disposição em contrário, a lei revogada não se restaura por ter a lei revogadora perdido a sua vigência (a repristinação tácita é categoricamente vedada no direito brasileiro);\n- **Segurança Jurídica e Direito Adquirido (Art. 6º)**: A lei em vigor terá efeito imediato e geral, respeitados o ato jurídico perfeito, o direito adquirido e a coisa julgada.\n\n### 2. Das Pessoas Naturais e Jurídicas: Personalidade e Teoria das Incapacidades\nA personalidade civil da pessoa natural inicia-se do nascimento com vida, ressalvados desde a concepção os direitos do nascituro (CC, art. 2º). A teoria natalista é a adotada formalmente pelo Código Civil para aquisição de personalidade, conquanto a teoria concepcionista seja amplamente prestigiada na tutela dos direitos personalíssimos do nascituro (como alimentos gravídicos e dano moral).\n\nO Estatuto da Pessoa com Deficiência (Lei nº 13.146/2015) revolucionou a teoria das incapacidades:\n- **Incapacidade Absoluta Exclusiva (Art. 3º)**: São absolutamente incapazes exclusivamente os menores de 16 anos;\n- **Pessoas com Deficiência**: São plenamente capazes para todos os atos da vida civil (casar, contratar, votar, trabalhar e gerir bens), admitindo-se a curatela ou a Tomada de Decisão Apoiada unicamente para atos patrimoniais e negociais em hipóteses estritas e personalizadas.\n\n### 3. Regime Jurídico dos Bens Públicos e Prerrogativas Fazendárias (CC, Arts. 98 a 103)\nBens públicos são aqueles pertencentes às pessoas jurídicas de direito público interno (União, Estados, DF, Municípios, autarquias e fundações públicas de direito público). Classificam-se em:\n1. **Bens de Uso Comum do Povo (Art. 99, I)**: Rios, praças, mares, ruas e estradas;\n2. **Bens de Uso Especial (Art. 99, II)**: Edifícios e terrenos afetados a serviços públicos e repartições governamentais;\n3. **Bens Dominicais (Art. 99, III)**: Bens desprovidos de afetação pública específica que integram o patrimônio disponível do Estado.\n\nOs bens públicos gozam de regime jurídico derrogatório do direito comum:\n- **Inalienabilidade Relativa**: Os de uso comum e uso especial são inalienáveis enquanto conservarem a sua afetação, tornando-se alienáveis apenas após regular desafetação legislativa ou fática formal (art. 100);\n- **Imprescritibilidade Absoluta (Art. 102 e CF arts. 183, § 3º e 191, parágrafo único)**: Bens públicos, de qualquer classe (inclusive dominicais), são absolutamente insuscetíveis de usucapião (Súmula 340 do STF);\n- **Impenhorabilidade**: Submetem-se ao regime constitucional de precatórios do art. 100 da CF/88, vedada qualquer penhora judicial direta.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Teoria Concepcionista para Direitos da Personalidade do Nascituro",
        "author": "STJ (Terceira e Quarta Turmas) e Maria Helena Diniz",
        "thesis": "O nascituro é pessoa humana e titular de direitos da personalidade desde a concepção, assistindo-lhe direito a indenização por dano moral decorrente de morte de genitor ocorrida na gestação.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Teoria Natalista Estrita",
        "author": "Silvio Rodrigues e Caio Mário da Silva Pereira",
        "thesis": "Sustenta que o nascituro tem mera expectativa de direito subordinada à condição suspensiva do nascimento com vida.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que pessoa com deficiência mental severa é absolutamente incapaz. Erro fatal após o Estatuto da Pessoa com Deficiência: apenas menores de 16 anos são absolutamente incapazes no direito brasileiro.",
      "Afirmar que bens públicos dominicais podem ser adquiridos por usucapião. Erro direto ao art. 102 do CC e Súmula 340 do STF: NENHUM bem público é usucapível.",
      "Confundir repristinação: a lei revogada não volta a vigorar pela revogação da lei revogadora, salvo se houver manifestação expressa do legislador (proibição de repristinação tácita)."
    ],
    "careerNuances": {
      "PGFN": "Defesa intransigente da imprescritibilidade dos imóveis da União administrados pela SPU (Secretaria do Patrimônio da União) e execução fiscal de créditos decorrentes de foros, laudêmios e taxas de ocupação.",
      "AGU": "Atuação perante o STF e STJ na proteção do patrimônio imobiliário público federal contra tentativas de grilagem e usucapião disfarçada."
    }
  },

  {
    "id": "fuc-civil-fato-negocio-defeitos-invalidade-prescricao",
    "discipline": "DIREITO CIVIL",
    "title": "Fatos Jurídicos, Defeitos do Negócio Jurídico, Invalidades e Prescrição e Decadência",
    "themeKeywords": [
      "ato jurídico. fato e ato jurídico. negócio jurídico",
      "ato juridico",
      "fato juridico",
      "negócio jurídico",
      "negocio juridico",
      "prescrição e decadência",
      "prescricao e decadencia",
      "defeitos do negocio juridico",
      "erro",
      "dolo",
      "coacao",
      "estado de perigo",
      "lesao",
      "fraude contra credores",
      "simulacao",
      "nulidade absoluta",
      "nulidade relativa",
      "artigo 104",
      "artigo 138",
      "artigo 166",
      "artigo 189",
      "artigo 205"
    ],
    "coreDoctrine": "### 1. Teoria Geral do Negócio Jurídico e a Escada Ponteana (CC, Art. 104)\nO negócio jurídico é a manifestação de vontade humana qualificada com finalidade negocial lícita. A doutrina de Pontes de Miranda sintetiza o negócio em três planos sucessivos:\n1. **Plano da Existência**: Elementos mínimos constitutivos (agente, vontade, objeto e forma). Se faltar qualquer elemento, o negócio é juridicamente inexistente;\n2. **Plano da Validade (Art. 104)**: Agente capaz, vontade livre e de boa-fé, objeto lícito, possível, determinado ou determinável, e forma prescrita ou não proibida em lei;\n3. **Plano da Eficácia**: Aptidão para produzir efeitos no mundo prático, sujeitando-se a elementos acidentais como condição (evento futuro e incerto), termo (evento futuro e certo) e encargo (ônus coercitivo).\n\n### 2. Defeitos do Negócio Jurídico e Vícios Sociais (Arts. 138 a 165)\nOs defeitos dividem-se em vícios do consentimento e vícios sociais:\n- **Erro Substancial (Arts. 138 a 144)**: Falsa percepção da realidade que poderia ser percebida por pessoa de diligência normal sobre a natureza do negócio, o objeto ou pessoa;\n- **Dolo (Arts. 145 a 150)**: Artifício malicioso empregado para induzir outrem em erro;\n- **Coação (Arts. 151 a 155)**: Pressão física ou moral que incute fundado temor de dano considerável à pessoa ou aos seus bens;\n- **Estado de Perigo (Art. 156)**: Obrigação excessivamente onerosa assumida sob premência de perigo à vida ou integridade física, conhecido da outra parte;\n- **Lesão (Art. 157)**: Prestação manifestamente desproporcional decorrente de necessidade econômica premente ou inexperiência, dispensando dolo da outra parte;\n- **Fraude contra Credores (Arts. 158 a 165)**: Alienação fraudulenta de bens em insolvência prejudicial a credores quirografários, atacável privativamente mediante **Ação Pauliana** no prazo decadencial de 4 anos.\n\n### 3. Nulidade Absoluta versus Nulidade Relativa (Arts. 166 a 184)\n- **Nulidade Absoluta (Art. 166)**: Tutela o interesse público, decorre de incapacidade absoluta, ilicitude do objeto, vício de forma essencial ou **simulação** (art. 167 - inovação do CC/2002 que tornou a simulação causa de nulidade absoluta). É insanável, não se convalida pelo decurso do tempo e pode ser conhecida de ofício pelo magistrado;\n- **Nulidade Relativa / Anulabilidade (Art. 171)**: Tutela o interesse privado das partes (incapacidade relativa, vícios do consentimento e fraude contra credores). Admite confirmação expressa ou tácita pelas partes e convalida-se pelo decurso do prazo decadencial.\n\n### 4. Prescrição versus Decadência (Arts. 189 a 211)\nA prescrição atinge a **pretensão** indenizatória ou condenatória decorrente da violação a um direito subjetivo (art. 189). Admite renúncia após consumada (art. 191), submete-se a causas impeditivas, suspensivas e interruptivas (arts. 197 a 202). O prazo geral é de 10 anos (art. 205), com prazos especiais de 3 anos (reparação civil) e 5 anos (cobrança de dívidas líquidas contratuais).\nA decadência extingue o próprio **direito potestativo** pela falta de exercício tempestivo. Se for decadência legal, não admite suspensão nem interrupção e deve ser conhecida de ofício pelo magistrado.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Simulação como Causa de Nulidade Absoluta Imprescritível",
        "author": "Código Civil de 2002 (Art. 167 e 169) e STJ",
        "thesis": "A simulação foi erigida a vício social de nulidade absoluta no CC/2002, não convalescendo pelo decurso do tempo e admitindo decretação de ofício ou ação declaratória sem prazo prescricional.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Regime da Anulabilidade no Código de 1916",
        "author": "Código Civil de 1916 (Revogado)",
        "thesis": "Tratava a simulação como causa de mera anulabilidade com prazo prescricional de 4 anos.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que a simulação é causa de anulabilidade sujeita a decadência de 4 anos. Erro crasso: no CC/2002 a simulação é NULIDADE ABSOLUTA (art. 167) e não convalesce pelo tempo (art. 169).",
      "Confundir fraude contra credores com fraude à execução: fraude contra credores exige Ação Pauliana e demonstração do eventus damni e consilium fraudis; fraude à execução ocorre com processo pendente e pode ser declarada incidentalmente nos próprios autos.",
      "Afirmar que a lesão exige dolo de aproveitamento da outra parte. Erro: o art. 157 do CC não exige dolo de aproveitamento, bastando a desproporção objetiva aliada à inexperiência ou premente necessidade."
    ],
    "careerNuances": {
      "PGFN": "Arguição da nulidade de negócios jurídicos simulados celebrados por devedores fiscais para ocultar bens sob a titularidade de laranjas e empresas de fachada.",
      "AGU": "Defesa da prescrição quinquenal em favor da Fazenda Pública prevista no Decreto nº 20.910/1932 contra pretensões indenizatórias de particulares."
    }
  },

  {
    "id": "fuc-civil-obrigacoes-inadimplemento-contratos",
    "discipline": "DIREITO CIVIL",
    "title": "Teoria Geral das Obrigações, Inadimplemento, Mora, Juros e Princípios Contratuais",
    "themeKeywords": [
      "obrigações. características, elementos e princípios",
      "obrigacoes",
      "contratos. princípios. contratos em geral",
      "contratos em geral",
      "contratos",
      "funcao social do contrato",
      "boa-fe objetiva",
      "inadimplemento das obrigacoes",
      "mora",
      "perdas e danos",
      "juros moratorios",
      "taxa selic",
      "exceptio non adimpleti contractus",
      "teoria da imprevisao",
      "onerosidade excessiva",
      "artigo 233",
      "artigo 389",
      "artigo 406",
      "artigo 421",
      "artigo 478"
    ],
    "coreDoctrine": "### 1. Elementos Estruturantes da Relação Obrigacional (CC, Arts. 233 a 285)\nA obrigação é um vínculo jurídico complexo que une credor e devedor, composto pelo débito primário (dever de prestar - schuld) e pela responsabilidade patrimonial (sujeição dos bens ao adimplemento forçado - haftung).\nDentre as modalidades obrigacionais, sobressai a **solidariedade passiva (arts. 264 e 275)**: o credor tem direito a exigir e receber de um ou de alguns dos devedores, parcial ou totalmente, a dívida comum. O pagamento parcial feito por um devedor aproveita aos demais até a concorrência da quantia paga. A solidariedade **não se presume**, resulta da lei ou da vontade expressa das partes (art. 265).\n\n### 2. Inadimplemento, Mora e Taxa de Juros Moratórios (Arts. 389 a 406)\nO inadimplemento voluntário impõe ao devedor o dever de reparar as perdas e danos integrais (danos emergentes e lucros cessantes - art. 402), cumulado com juros moratórios e honorários advocatícios (art. 389).\nA mora pode ser:\n- **Mora ex re (Art. 397, caput)**: O inadimplemento da obrigação positiva e líquida, no seu termo, constitui de pleno direito em mora o devedor (dies interpellat pro homine);\n- **Mora ex persona (Art. 397, parágrafo único)**: Não havendo termo certo, a mora depende de interpelação judicial ou extrajudicial.\n\nQuanto à taxa dos juros moratórios legais, a Corte Especial do STJ pacificou no **Tema 1.076 e na interpretação do art. 406 do CC** que a taxa de juros moratórios quando não convencionada é a **taxa SELIC**, que já engloba juros e correção monetária, vedada cumulação com outros índices inflacionários.\n\n### 3. Função Social dos Contratos e Boa-Fé Objetiva (Arts. 421 a 424)\nA liberdade contratual é exercida nos limites da função social do contrato (art. 421), prevalecendo nas relações privadas a intervenção mínima estatal e a presunção de paridade e simetria dos contratos civis e empresariais (Lei nº 13.874/2019 - Lei de Liberdade Econômica).\nA **boa-fé objetiva (art. 422)** cria deveres anexos de conduta (lealdade, informação, assistência e sigilo), operando como:\n- Fonte integradora de deveres laterais que independem de previsão contratual expressa;\n- Limite ao exercício abusivo de direitos subjetivos (art. 187);\n- Vetor hermenêutico imperativo (art. 113).\n\nSuas figuras parcelares pretorianas incluem: venire contra factum proprium (vedação a comportamento contraditório), suppressio (perda de faculdade jurídica pelo não exercício prolongado), surrectio (surgimento de direito correlato) e duty to mitigate the loss (dever do credor de mitigar o próprio prejuízo).\n\n### 4. Extinção dos Contratos e Onerosidade Excessiva (Arts. 476 a 480)\nNos contratos bilaterais vigora a **exceção do contrato não cumprido (art. 476)**: nenhum contratante pode exigir a prestação do outro sem ter cumprido a sua própria obrigação.\nNos contratos de execução continuada, a resolução por **onerosidade excessiva (art. 478 - Teoria da Imprevisão)** exige a concorrência de: evento extraordinário e imprevisível, extrema onerosidade para uma das partes e extrema vantagem para a outra.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Aplicação Exclusiva da Taxa SELIC no Artigo 406 do Código Civil",
        "author": "Corte Especial do STJ (REsp 1.795.982/SP)",
        "thesis": "A taxa que está em vigor para a mora do pagamento de impostos devidos à Fazenda Nacional a que alude o art. 406 do CC é a SELIC, não se admitindo a incidência cumulativa de juros de 1% ao mês com correção pelo IPCA.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Corrente dos Juros de 1% ao Mês do Artigo 161 do CTN",
        "author": "Doutrina Tradicional e Voto Vencido",
        "thesis": "Sustentava que os juros civis deveriam ser de 1% ao mês cumulados com índice oficial de atualização monetária.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que a solidariedade pode ser presumida quando houver benefício comum aos devedores. Erro direto ao art. 265 do CC: a solidariedade NUNCA se presume; resulta unicamente da lei ou da vontade das partes.",
      "Afirmar que a revisão contratual no Código Civil prescinde de evento extraordinário e imprevisível (confundindo com a Teoria da Base do Negócio do Código de Defesa do Consumidor). No Código Civil a imprevisibilidade é requisito indispensável (art. 478).",
      "Afirmar que a responsabilidade civil contratual prescreve em 3 anos. Erro: a Corte Especial do STJ fixou que a responsabilidade contratual submete-se ao prazo decenal geral do art. 205; o prazo trienal do art. 206, § 3º, V é restrito à responsabilidade extracontratual aquiliana."
    ],
    "careerNuances": {
      "PGFN": "Aplicação da Taxa SELIC nos débitos tributários e contratos administrativos de parcelamento e transação fiscal celebrados com a União.",
      "AGU": "Defesa dos contratos administrativos federais contra pedidos descabidos de reequilíbrio econômico-financeiro sem demonstração cabal de álea extraordinária imprevisível."
    }
  },

  {
    "id": "fuc-civil-responsabilidade-coisas-familias-legislacao",
    "discipline": "DIREITO CIVIL",
    "title": "Responsabilidade Civil, Direitos Reais, Alienação Fiduciária e Direito Patrimonial de Família",
    "themeKeywords": [
      "responsabilidade civil objetiva e subjetiva",
      "responsabilidade civil",
      "direito das coisas",
      "direito patrimonial das famílias",
      "direito patrimonial das familias",
      "legislação civil",
      "legislacao civil",
      "posse e propriedade",
      "funcao social da propriedade",
      "alienação fiduciária em garantia",
      "alienacao fiduciaria",
      "regime de bens entre conjuges",
      "dividas do casal e execucao fiscal",
      "outorga uxoria",
      "artigo 186",
      "artigo 927",
      "artigo 1196",
      "artigo 1228",
      "artigo 1361",
      "artigo 1639"
    ],
    "coreDoctrine": "### 1. Teoria Geral da Responsabilidade Civil: Subjetiva versus Objetiva (CC, Arts. 186 e 927)\nA responsabilidade civil subjetiva é a regra geral do ordenamento civil (arts. 186 e 927, caput), exigindo a comprovação de conduta humana voluntária, nexo de causalidade, dano efetivo e culpa em sentido estrito (imprudência, negligência ou imperícia) ou dolo.\nA **responsabilidade civil objetiva (art. 927, parágrafo único)** independe de culpa, incidindo:\n- Nos casos expressamente tipificados em lei;\n- Quando a atividade normalmente desenvolvida pelo autor do dano implicar, por sua natureza, risco especial para os direitos de outrem (Teoria do Risco da Atividade).\n\nA responsabilidade civil do Estado funda-se no art. 37, § 6º da CF/88 (responsabilidade objetiva sob a modalidade do risco administrativo), admitindo como causas excludentes do nexo causal a culpa exclusiva da vítima, caso fortuito/força maior e fato exclusivo de terceiro. Em caso de omissão estatal, a jurisprudência consagra em regra a responsabilidade subjetiva fundada na faute du service (falha na prestação do serviço público), ressalvada a custódia de pessoas ou coisas perigosas em presídios e hospitais psiquiátricos, onde o STF adota o risco direto pelo dever específico de custódia.\n\n### 2. Posse, Propriedade e Alienação Fiduciária em Garantia (Arts. 1.196 a 1.368)\nO direito brasileiro adota preponderantemente a **Teoria Objetiva da Posse de Ihering** (art. 1.196): possuidor é todo aquele que tem de fato o exercício, pleno ou não, de algum dos poderes inerentes à propriedade (usar, gozar, dispor ou reaver).\nNa **Alienação Fiduciária em Garantia (art. 1.361 e Lei nº 9.514/1997)**, o devedor fiduciante transfere ao credor fiduciário a propriedade resolúvel e a posse indireta de bem móvel ou imóvel com escopo de garantia. Ponto nodal para a Fazenda Pública:\n- O bem alienado fiduciariamente **pertence ao patrimônio do credor fiduciário**, e não ao devedor executado;\n- Em sede de execução fiscal, a Fazenda Pública **não pode penhorar o bem imóvel alienado fiduciariamente**, mas pode penhorar unicamente os **direitos aquisitivos decorrentes do contrato de alienação fiduciária** pertencentes ao devedor fiduciante (CPC art. 835, XII e STJ Tema 1.169).\n\n### 3. Direito Patrimonial das Famílias e Responsabilidade por Dívidas Fiscais (Arts. 1.639 a 1.688)\nOs regimes de bens regulam as relações patrimoniais do casamento:\n- **Comunhão Parcial (Regime Legal - Art. 1.658)**: Comunicam-se os bens adquiridos onerosamente na constância do casamento, excluindo-se os bens anteriores e os adquiridos por doação ou sucessão;\n- **Comunhão Universal (Art. 1.667)**: Comunicação de todos os bens presentes e futuros e de suas dívidas passivas;\n- **Separação Obrigatória (Art. 1.641)**: Obrigatório para pessoas com mais de 70 anos e causas suspensivas. Observa-se a Súmula 377 do STF com a modulação recente do STF no Tema 1.236 (exigência de pacto antenupcial expresso para afastar a comunicação de aquestos adquiridos com esforço comum).\n\nNa cobrança de dívidas tributárias e execução fiscal contra pessoa casada:\n- A penhora sobre bens do casal deve resguardar a **meação do cônjuge alheio à dívida**, salvo prova de que a dívida reverteu em proveito da família (STJ Súmula 251).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Penhora de Direitos Aquisitivos na Alienação Fiduciária (Tema 1.169 do STJ)",
        "author": "Superior Tribunal de Justiça (Primeira e Segunda Seções)",
        "thesis": "É vedada a penhora do próprio bem objeto de alienação fiduciária em execução fiscal promovida contra o devedor fiduciante, admitindo-se exclusivamente a constrição dos direitos aquisitivos contratuais.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Penhora Direta do Bem Gravado",
        "author": "Posição Minoritária Superada da Fazenda Pública",
        "thesis": "Pretendia penhorar o próprio bem sob o fundamento da supremacia do crédito tributário.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas tentam autorizar a penhora de imóvel financiado com alienação fiduciária em execução fiscal contra o comprador. Erro crasso: o bem pertence ao banco; a penhora só pode incidir sobre os DIREITOS AQUISITIVOS do contrato (STJ Tema 1.169).",
      "Afirmar que a responsabilidade do Estado por atos omissivos gerais é sempre objetiva. Erro: a omissão comum estatal exige prova da culpa do serviço (responsabilidade subjetiva).",
      "Penhorar a meação do cônjuge sem demonstrar que o débito fiscal beneficiou o núcleo familiar (Súmula 251 do STJ)."
    ],
    "careerNuances": {
      "PGFN": "Localização e penhora de direitos aquisitivos derivados de contratos de alienação fiduciária em garantia de veículos e imóveis de devedores da Dívida Ativa da União.",
      "AGU": "Defesa da União em ações indenizatórias por responsabilidade civil do Estado, comprovando excludentes de nexo de causalidade ou culpa exclusiva da vítima."
    }
  },

  {
    "id": "fuc-emp-teoria-geral-empresario-estabelecimento-registro",
    "discipline": "DIREITO EMPRESARIAL",
    "title": "Teoria da Empresa, Conceito de Empresário, Estabelecimento Comercial e Trespasse",
    "themeKeywords": [
      "direito empresarial: origem",
      "empresário: classificação",
      "empresario",
      "sociedade dependente de autorização",
      "o estabelecimento: conceito",
      "estabelecimento",
      "nome empresarial",
      "registro de empresas",
      "prepostos",
      "escrituração",
      "contratos de empresas",
      "teoria da empresa",
      "trespasse",
      "cláusula de não concorrência",
      "artigo 966",
      "artigo 1113",
      "artigo 1142",
      "artigo 1146",
      "artigo 1155"
    ],
    "coreDoctrine": "### 1. Origem Histórica do Direito Comercial e a Teoria da Empresa (CC, Art. 966)\nO Direito Comercial evoluiu por três fases históricas fundamentais:\n1. **Fase Subjetiva Corporativa (Idade Média)**: Direito consuetudinário das corporações de ofício, aplicável unicamente aos comerciantes matriculados nas corporações;\n2. **Fase Objetiva dos Atos de Comércio (Código Napoleônico de 1807)**: Delimitação objetiva de atos comerciais tipificados na lei, independentemente da qualidade da pessoa;\n3. **Fase Moderna da Teoria da Empresa (Código Civil Italiano de 1942 e Código Civil Brasileiro de 2002)**: Superação dos atos de comércio e foco no exercício profissional de atividade econômica organizada.\n\nO artigo 966 do Código Civil define: **empresário é quem exerce profissionalmente atividade econômica organizada para a produção ou a circulação de bens ou de serviços**. Elementos constitutivos:\n- Profissionalismo (habitualidade e publicidade);\n- Atividade econômica (busca pelo lucro e assunção do risco);\n- Organização (articulação dos fatores de produção: capital, mão de obra, matéria-prima e tecnologia).\n\nO art. 966, parágrafo único exclui expressamente da qualificação de empresário quem exerce **profissão intelectual**, de natureza científica, literária ou artística (como médicos, engenheiros e advogados), ainda com o concurso de auxiliares, **salvo se o exercício da profissão constituir elemento de empresa** (exemplo: médico que abre um complexo hospitalar com hotelaria e pronto-socorro).\n\n### 2. O Produtor Rural e o Microempreendedor Individual (MEI)\nO produtor rural possui regime de equiparação voluntária facultativa: a inscrição no Registro Público de Empresas Mercantis (Junta Comercial) tem **natureza constitutiva** da condição de empresário regular (art. 971). Enquanto não registrado, submete-se ao regime de direito civil comum.\n\n### 3. Estabelecimento Empresarial e o Contrato de Trespasse (Arts. 1.142 a 1.149)\nO estabelecimento é o complexo de bens organizado para o exercício da empresa (art. 1.142). É uma universalidade de fato que engloba bens corpóreos (máquinas, mercadorias) e incorpóreos (ponto comercial, aviamento, clientela).\nA alienação do estabelecimento denomina-se **trespasse** (art. 1.144):\n- **Eficácia perante terceiros**: Exige averbação na Junta Comercial e publicação na imprensa oficial;\n- **Proteção dos Credores (Art. 1.145)**: Se ao alienante não restarem bens suficientes para pagar suas dívidas, o trespasse depende da notificação de todos os credores para anuência expressa ou tácita em 30 dias, sob pena de nulidade ou decretação de falência;\n- **Responsabilidade por Débitos Anteriores (Art. 1.146)**: O adquirente responde pelos débitos regularmente contabilizados, permanecendo o alienante solidariamente responsável pelo prazo de 1 ano;\n- **Cláusula de Não Concorrência Implícita (Art. 1.147)**: Salvo autorização expressa em contrário, o alienante fica proibido de fazer concorrência ao adquirente nos **5 anos subsequentes** à transferência.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Eficácia da Sucessão Tributária no Trespasse (CTN, Art. 133)",
        "author": "Doutrina Tributária e Jurisprudência Pacificada do STJ",
        "thesis": "A responsabilidade tributária na aquisição de fundo de comércio opera ex lege nos termos do art. 133 do CTN (integral se o alienante cessar a exploração e subsidiária se prosseguir ou reiniciar atividade em 6 meses), prevalecendo sobre disposições privadas do contrato de trespasse.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Prevalência da Limitação Contratual do Código Civil",
        "author": "Posição Minoritária de Adquirentes",
        "thesis": "Pretendia opor à Fazenda cláusulas de isenção de débitos fiscais inseridas na escritura de trespasse.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que sociedade de advogados ou cooperativa pode ser empresária. Erro: sociedade simples de advogados é sempre civil por força do art. 16 do Estatuto da OAB, e a cooperativa é sempre sociedade simples por expressa determinação do art. 982, parágrafo único do CC.",
      "Afirmar que o registro na Junta Comercial é condição de existência do empresário. Erro: o registro é ato meramente declaratório de regularidade (com exceção do produtor rural em que o registro é constitutivo).",
      "Esquecer a regra de não concorrência no trespasse: o prazo de proibição legal de concorrência é de 5 anos (art. 1.147)."
    ],
    "careerNuances": {
      "PGFN": "Aplicação do art. 133 do CTN em operações fraudulentas de trespasse disfarçado para responsabilizar os sucessores empresariais pelos débitos da Dívida Ativa.",
      "AGU": "Orientação e supervisão do Registro Público de Empresas Mercantis a cargo do Departamento Nacional de Registro Empresarial e Integração (DREI)."
    }
  },

  {
    "id": "fuc-emp-sociedades-limitadas-desconsideracao-socios",
    "discipline": "DIREITO EMPRESARIAL",
    "title": "Sociedades Limitadas, Desconsideração da Personalidade Jurídica e Responsabilidade dos Administradores",
    "themeKeywords": [
      "sociedade empresária: classificação e características",
      "sociedade empresaria",
      "liquidação, transformação",
      "responsabilidade dos sócios e administradores. desconsideração da personalidade jurídica",
      "responsabilidade dos socios e administradores",
      "desconsideração da personalidade jurídica",
      "desconsideracao da personalidade juridica",
      "lei das sociedades anônimas (lei nº 6.404/1976)",
      "sociedades anonimas",
      "sociedade limitada",
      "artigo 50 do codigo civil",
      "desvio de finalidade",
      "confusao patrimonial",
      "dissolução irregular",
      "súmula 435 stj",
      "tema 981 stj",
      "tema 444 stj",
      "artigo 1052",
      "artigo 1080",
      "lei 6404"
    ],
    "coreDoctrine": "### 1. Sociedade Limitada: Características e Responsabilidade dos Sócios (CC, Arts. 1.052 a 1.087)\nA sociedade limitada é o tipo societário mais utilizado no Brasil. Suas características basilares:\n- **Responsabilidade dos Sócios (Art. 1.052)**: A responsabilidade de cada sócio é restrita ao valor de suas quotas, mas todos respondem **solidariamente pela integralização do capital social**. Uma vez integralizado todo o capital social, cessa a responsabilidade subsidiária pessoal dos sócios pelas dívidas negociais da sociedade;\n- **Sociedade Unipessoal (§ 1º do art. 1.052 introduzido pela Lei 13.874/2019)**: Permite a constituição de sociedade limitada por uma única pessoa física ou jurídica, o que motivou a extinção legal da EIRELI;\n- **Deliberações Ilícitas (Art. 1.080)**: As deliberações infringentes do contrato social ou da lei tornam ilimitada e pessoal a responsabilidade dos sócios que expressamente as aprovaram.\n\n### 2. A Desconsideração da Personalidade Jurídica (Disregard Doctrine) e o Art. 50 do Código Civil\nO ordenamento brasileiro adota duas vertentes da desconsideração:\n1. **Teoria Maior da Desconsideração (Art. 50 do CC)**: Incide nas relações civis e comerciais paritárias. Exige a comprovação inequívoca de fraude configurada por:\n   - **Desvio de Finalidade (§ 1º)**: Utilização dolosa da pessoa jurídica com o propósito de lesar credores e para a prática de ilícitos;\n   - **Confusão Patrimonial (§ 2º)**: Ausência de separação de fato entre os patrimônios dos sócios e da empresa (cumprimento habitual de despesas particulares do sócio pela empresa ou transferências sem causa).\n   A mera insuficiência de bens ou dissolução irregular **não autorizam** a desconsideração com base no art. 50 do Código Civil.\n2. **Teoria Menor da Desconsideração**: Incide nas relações de consumo (CDC, art. 28, § 5º) e ambientais (Lei 9.605/98, art. 4º), bastando a simples insolvência ou obstáculo ao ressarcimento do lesado.\n\n### 3. Responsabilidade Tributária e Redirecionamento da Execução Fiscal (CTN Art. 135 e Jurisprudência do STJ)\nO redirecionamento de dívidas fiscais não se confunde com o art. 50 do Código Civil, regendo-se pelo artigo 135, III do CTN:\n- **Não Configuração por Mero Inadimplemento (Súmula 430 do STJ)**: O simples inadimplemento da obrigação tributária pela sociedade não gera por si só a responsabilidade pessoal do sócio-administrador;\n- **Presunção de Dissolução Irregular (Súmula 435 do STJ)**: Presume-se dissolvida irregularmente a empresa que deixar de funcionar no seu domicílio fiscal, sem comunicação aos órgãos competentes, legitimando o redirecionamento da execução fiscal para o sócio-gerente;\n- **Quem responde na Dissolução Irregular (STJ Tema 981 da Primeira Seção)**: O redirecionamento da execução fiscal, quando fundado na dissolução irregular da pessoa jurídica executada, deve recair sobre **o sócio com poderes de administração no momento da dissolução irregular**, ainda que não tenha exercido a administração na época do fato gerador do tributo;\n- **Prescrição para o Redirecionamento (STJ Tema 444)**: O prazo de 5 anos para redirecionar a execução fiscal conta-se da data da ciência da Fazenda Pública acerca da dissolução irregular.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Tese Vinculante do STJ no Tema 981 (Administrador no Momento da Dissolução)",
        "author": "Primeira Seção do STJ (Relator Min. Assusete Magalhães)",
        "thesis": "O ilícito tributário que deflagra a responsabilidade pessoal do art. 135, III do CTN na dissolução irregular é o próprio encerramento clandestino da sociedade, devendo responder quem geria a empresa no momento em que ela deixou de funcionar.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Corrente da Gestão Concomitante ao Fato Gerador",
        "author": "Posição Antiga Superada da Segunda Turma do STJ",
        "thesis": "Exigia que o sócio tivesse poderes de gerência tanto na época do fato gerador quanto no momento da dissolução irregular.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que o simples não pagamento de imposto autoriza o redirecionamento da execução fiscal contra os sócios. Erro crasso frontal à Súmula 430 do STJ: o inadimplemento isolado não configura infração à lei.",
      "Afirmar que o redirecionamento por dissolução irregular atinge o sócio que administrava à época do fato gerador mas que já havia se retirado regularmente da sociedade antes do fechamento. Erro direto ao Tema 981 do STJ: responde o administrador da época da dissolução.",
      "Aplicar a Teoria Menor da desconsideração em relações civis comuns ou empresariais. Erro: no Código Civil vigora a Teoria Maior (art. 50)."
    ],
    "careerNuances": {
      "PGFN": "Aplicação maciça da Súmula 435 e do Tema 981 do STJ para redirecionar execuções fiscais de empresas fantasmas para o patrimônio pessoal de administradores sonegadores.",
      "AGU": "Instauração de Incidentes de Desconsideração da Personalidade Jurídica (IDPJ) perante a Justiça Federal em execuções de multas e créditos do Ibama e agências."
    }
  },

  {
    "id": "fuc-emp-falencia-recuperacao-credito-tributario-pgfn",
    "discipline": "DIREITO EMPRESARIAL",
    "title": "Falência, Recuperação Judicial e o Tratamento do Crédito Tributário da PGFN (Lei 11.101/2005)",
    "themeKeywords": [
      "falência. recuperação judicial e extrajudicial. intervenção e liquidação extrajudicial",
      "falência",
      "falencia",
      "recuperação judicial",
      "recuperacao judicial",
      "recuperação extrajudicial",
      "classificação dos créditos na falência",
      "crédito tributário na falência",
      "lei 11101",
      "lei 14112",
      "stay period",
      "execucao fiscal e recuperacao judicial",
      "artigo 6",
      "artigo 47",
      "artigo 83",
      "artigo 84",
      "artigo 187",
      "transação tributária na recuperação",
      "lei 13988"
    ],
    "coreDoctrine": "### 1. Princípios da Lei de Falências e Recuperação de Empresas (Lei nº 11.101/2005)\nA Lei nº 11.101/2005, com as profundas inovações da Reforma da Lei nº 14.112/2020, visa preservar a atividade econômica viável, proteger empregos e garantir o pagamento ordenado dos credores (art. 47).\nO deferimento do processamento da recuperação judicial instaura o **stay period** (art. 6º): suspensão das execuções promovidas contra o devedor pelo prazo improrrogável de 180 dias, prorrogável por igual período apenas uma vez caso o devedor não tenha concorrido para o atraso no plano de recuperação.\n\n### 2. Autonomia da Execução Fiscal e Competência Concorrente (Arts. 6º, § 7º-B e 187)\nA relação entre a execução fiscal e o juízo da recuperação judicial é um dos temas mais caros à PGFN:\n- **Não Submissão do Crédito Tributário**: Por força do art. 187 do CTN e art. 6º, § 7º-B da Lei 11.101/2005, o crédito tributário **não se submete à recuperação judicial** e as execuções fiscais não são suspensas pelo deferimento da recuperação judicial;\n- **Prática de Atos de Constrição**: Os atos de constrição patrimonial e expropriação continuam no juízo da execução fiscal federal. Todavia, a jurisprudência fixou a competência do juízo da recuperação para exercer o controle sobre atos que atinjam **bens de capital essenciais** à continuidade da atividade empresarial;\n- **Exigência de CND para Homologação do Plano (Art. 57)**: A concessão da recuperação judicial condiciona-se à apresentação de certidão negativa de débitos tributários (CND ou CPEN), admitindo-se a comprovação de parcelamento especial ou transação tributária.\n\n### 3. Transação Tributária na Recuperação Judicial (Lei nº 13.988/2020)\nA Fazenda Nacional regulamentou modalidades especializadas de transação resolutiva de litígio para empresas em recuperação judicial, permitindo descontos de até 70% sobre encargos e multas e prazos dilatados de parcelamento de até 120 ou 144 meses, compatibilizando a recuperação da empresa com a recomposição do erário.\n\n### 4. Ordem de Classificação dos Créditos na Falência (Arts. 83 e 84)\nDecretada a falência, forma-se o concurso universal de credores com rígida ordem de preferência:\n- **Créditos Extraconcursais (Art. 84)**: Pagos com absoluta precedência (remuneração do administrador judicial, custas da massa e financiamento na recuperação - DIP financing);\n- **Créditos Concursais (Art. 83)**:\n  1. Créditos trabalhistas e decorrentes de acidentes de trabalho (limitados a 150 salários mínimos por credor);\n  2. Créditos com garantia real até o valor do bem gravado;\n  3. **Créditos Tributários** (independentemente da data de constituição, excetuadas as multas);\n  4. Créditos quirografários;\n  5. Multas contratuais e penas pecuniárias administrativas e tributárias;\n  6. Créditos subordinados.",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Não Submissão da Execução Fiscal e Controle Estrito de Bens Essenciais",
        "author": "STJ (Segunda Seção) e Reforma da Lei 14.112/2020",
        "thesis": "A execução fiscal prossegue normalmente perante a Vara Federal, cabendo ao juízo recuperacional apenas determinar a substituição de constrições de bens de capital comprovadamente indispensáveis à empresa.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Universalidade Absoluta do Juízo Falimentar/Recuperacional",
        "author": "Posição Vencida de Juízos Estaduais",
        "thesis": "Sustentava que todos os bens e execuções contra a empresa deveriam ser monopolizados pelo juízo da recuperação judicial.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas afirmam que os créditos tributários se sujeitam aos efeitos da recuperação judicial e ao plano de pagamento da assembleia geral de credores. Erro fatal: os créditos tributários NÃO se sujeitam à recuperação judicial (art. 6º, § 7º-B da Lei 11.101/05 e art. 187 do CTN).",
      "Afirmar que na falência as multas tributárias têm a mesma preferência do tributo principal. Erro: o principal é crédito tributário (Classe III); a multa tributária é rebaixada para a Classe V (art. 83, V).",
      "Esquecer o limite do crédito trabalhista preferencial na falência: até 150 salários mínimos; o excedente é classificado como crédito quirografário."
    ],
    "careerNuances": {
      "PGFN": "Habilitação e cobrança prioritária dos créditos tributários inscritos em Dívida Ativa nos processos de falência e celebração de transação tributária estratégica para empresas em recuperação judicial.",
      "AGU": "Acompanhamento das ações recuperacionais perante as Varas Empresariais para resguardar créditos não tributários de agências reguladoras e fundações federais."
    }
  },

  {
    "id": "fuc-emp-estatais-lei13303-titulos-propriedade-industrial",
    "discipline": "DIREITO EMPRESARIAL",
    "title": "Estatuto das Estatais (Lei 13.303/2016), Títulos de Crédito e Propriedade Industrial",
    "themeKeywords": [
      "regime jurídicos das empresas estatais",
      "regime juridico das empresas estatais",
      "empresas estatais",
      "lei das estatais",
      "lei 13303",
      "títulos de crédito",
      "titulos de credito",
      "propriedade industrial",
      "empresa publica",
      "sociedade de economia mista",
      "governanca corporativa",
      "princípios cambiais",
      "cartularidade",
      "literalidade",
      "autonomia",
      "endosso",
      "aval",
      "marcas e patentes",
      "inpi",
      "lei 9279"
    ],
    "coreDoctrine": "### 1. Regime Jurídico das Empresas Estatais (Lei nº 13.303/2016)\nO Estatuto das Empresas Estatais regulamenta o art. 173 da CF/88 para empresas públicas e sociedades de economia mista da União, Estados, DF e Municípios:\n- **Natureza Jurídica**: Pessoas jurídicas de direito privado com criação autorizada por lei. A empresa pública tem capital 100% público e admite qualquer forma societária; a sociedade de economia mista exige maioria de ações votantes em poder do Estado e é compulsoriamente constituída sob a forma de **Sociedade Anônima (S/A)**;\n- **Governança e Compliance**: A Lei 13.303/2016 estabeleceu regras rigorosas de transparência, comitê de auditoria estatutário, gestão de riscos e requisitos técnicos impeditivos de nomeações puramente político-partidárias para diretorias e conselhos de administração;\n- **Regime de Pessoal e Contratações**: Empregados públicos celetistas admitidos por concurso público (CF art. 37, II) e regime próprio de licitações e contratos (arts. 28 a 91).\n\n### 2. Teoria Geral do Direito Cambiário e Títulos de Crédito (CC, Arts. 887 a 903)\nO título de crédito é o documento necessário para o exercício do direito literal e autônomo nele mencionado (conceito de Cesare Vivante acolhido no art. 887). Princípios fundamentais:\n- **Cartularidade**: O direito material incorpora-se ao documento representativo (cártula), mitigada pela informatização dos títulos eletrônicos (duplicatas escriturais);\n- **Literalidade**: Vale apenas o que estiver expressamente escrito no título;\n- **Autonomia das Obrigações Cambiais**: O vício na obrigação de um coobrigado não contamina a obrigação dos demais. Desdobra-se em abstração (desvinculação do negócio causal subjacente após a circulação) e inoponibilidade das exceções pessoais a terceiros de boa-fé.\n\nGarantias cambiais:\n- **Aval versus Fiança**: O aval é garantia estritamente cambial, autônoma e solidária, prestada no próprio título sem benefício de ordem; a fiança é garantia fidejussória contratual, acessória e dotada de benefício de ordem.\n\n### 3. Propriedade Industrial e Registro no INPI (Lei nº 9.279/1996)\nA propriedade industrial tutela os bens imateriais empresariais:\n- **Patente de Invenção (Art. 8º)**: Requisitos: novidade absoluta, atividade inventiva e aplicação industrial. Vigência de **20 anos** a contar da data do depósito;\n- **Patente de Modelo de Utilidade (Art. 9º)**: Objeto de uso prático suscetível de melhoria funcional. Vigência de **15 anos** contados do depósito;\n- **Registro de Marca (Art. 122)**: Sinal distintivo visualmente perceptível que identifica produtos e serviços. Vigência de **10 anos** prorrogáveis indefinidamente por períodos iguais. O direito de propriedade sobre a marca adquire-se pelo registro validamente concedido pelo Instituto Nacional da Propriedade Industrial (INPI).",
    "divergentCurrents": {
      "firstCurrent": {
        "name": "Inconstitucionalidade da Extensão do Prazo de Patentes (STF ADI 5529)",
        "author": "Supremo Tribunal Federal (Plenário)",
        "thesis": "É inconstitucional o parágrafo único do art. 40 da Lei 9.279/1996 que prorrogava o prazo de vigência das patentes em razão da demora na análise pelo INPI, violando a temporariedade da proteção constitucional e a livre concorrência.",
        "adoptedByExam": true
      },
      "secondCurrent": {
        "name": "Proteção Compensatória pela Demora Administrativa",
        "author": "Indústria Farmacêutica e Posicionamento Anterior",
        "thesis": "Sustentava que a morosidade do INPI justificava extensão do monopólio para viabilizar o retorno do investimento.",
        "adoptedByExam": false
      }
    },
    "examPitfalls": [
      "Bancas tentam afirmar que Sociedade de Economia Mista pode ser constituída como Sociedade Limitada. Erro direto ao art. 4º da Lei 13.303/16 e art. 235 da Lei 6.404/76: a sociedade de economia mista é OBRIGATORIAMENTE uma Sociedade Anônima.",
      "Afirmar que o avalista goza do benefício de ordem para exigir que primeiro sejam penhorados bens do devedor principal. Erro: o aval é garantia autônoma e solidária sem benefício de ordem.",
      "Prazos de patente: Invenção = 20 anos; Modelo de Utilidade = 15 anos; Marca = 10 anos prorrogáveis. O STF declarou inconstitucional qualquer prorrogação automática por mora do INPI (ADI 5529)."
    ],
    "careerNuances": {
      "PGFN": "Representação judicial e consultiva da União nos atos de controle acionário e governança das sociedades de economia mista federais (como Banco do Brasil e Petrobras).",
      "AGU": "Defesa do Instituto Nacional da Propriedade Industrial (INPI) perante a Justiça Federal em ações de anulação e indeferimento de patentes e marcas."
    }
  },
  // =========================================================================
  // DIREITO PENAL E PROCESSUAL PENAL: MÓDULOS DE ALTA DENSIDADE (PGFN/AGU)
  // =========================================================================
  {
    id: "penal-acao-penal-publica-privada",
    discipline: "DIREITO PENAL E PROCESSUAL PENAL",
    title: "Ação Penal Pública e Privada: Condições da Ação, Titularidade e Princípios Informadores",
    themeKeywords: [
      "ação penal pública e privada no código penal", "ação penal", "ação penal pública",
      "ação penal privada", "queixa", "denúncia"
    ],
    coreDoctrine: "A ação penal consubstancia o direito público subjetivo e autônomo de provocar a jurisdição penal para a aplicação do ius puniendi estatal em face da prática de um fato aparentemente criminoso. No modelo processual constitucional acusatório (artigo 129, I, da CF c/c art. 3º-A do CPP), a ação penal classifica-se precipuamente a partir do critério da legitimidade ativa. A ação penal pública subdivide-se em incondicionada (regra geral do ordenamento, decorrente do art. 100 do CP e art. 24 do CPP, na qual a propositura da denúncia submete-se exclusivamente ao Ministério Público, dispensando qualquer ato de vontade do ofendido) e condicionada à representação do ofendido ou requisição do Ministro da Justiça (hipótese de eficácia subordinada a condição objetiva de procedibilidade, sujeita ao prazo decadencial improrrogável de 6 meses contados do conhecimento da autoria delitiva, nos moldes do art. 38 do CPP). A ação penal pública rege-se pelos princípios fundamentais da obrigatoriedade ou legalidade estrita (imposição do ajuizamento da denúncia havendo prova da materialidade e indícios suficientes de autoria, hoje mitigada pela consensualidade penal do Acordo de Não Persecução Penal previsto no art. 28-A do CPP), da oficialidade (atribuição privativa a órgãos oficiais do Estado), da oficiosidade (atuação ex officio das autoridades públicas persecutórias), da indisponibilidade (vedação ao Ministério Público de desistir da ação penal proposta ou de recurso interposto, ex vi do art. 42 e art. 576 do CPP) e da indivisibilidade (objeto de acirrada divergência doutrinária e jurisprudencial). Por sua vez, a ação penal privada classifica-se em exclusiva (titularizada pelo ofendido ou sucessores no art. 31 do CPP), personalíssima (adstrita unicamente à vítima, como no casamento induzido em erro, art. 236 do CP) e subsidiária da pública (garantia constitucional do art. 5º, inciso LIX, e art. 29 do CPP, admitida quando o Ministério Público permanece inerte no prazo legal de oferecimento da denúncia, ensejando a queixa-crime supletiva pelo particular, sem prejuízo da prerrogativa ministerial de aditar a queixa, intervir e retomar a ação em caso de negligência do querelante). As condições da ação penal estruturam-se na teoria tripartite, abrangendo a legitimidade ad causam, o interesse de agir (desdobrado em necessidade e utilidade do provimento jurisdicional) e a justa causa, esta última erigida em categoria autônoma pelo art. 395, inciso III, do CPP, exigindo lastro probatório mínimo e idôneo de materialidade e indícios de autoria para impedir acusações temerárias ou infundadas.",
    divergentCurrents: {
      firstCurrent: {
        name: "Princípio da Indivisibilidade da Ação Penal Pública",
        author: "Doutrina Tradicional (Frederico Marques, Tourinho Filho e Nucci)",
        thesis: "A ação penal pública é indivisível, incumbindo ao Ministério Público denunciar todos os coautores e partícipes revelados no inquérito policial, não podendo selecionar arbitrariamente quem deve figurar no pólo passivo, sob pena de violação ao princípio da impessoalidade e obrigatoriedade.",
        adoptedByExam: false
      },
      secondCurrent: {
        name: "Princípio da Divisibilidade da Ação Penal Pública",
        author: "Jurisprudência Vinculante do STF e STJ",
        thesis: "O princípio da indivisibilidade aplica-se estritamente à ação penal privada (art. 48 do CPP). Na ação penal pública vige a divisibilidade, admitindo-se que o Ministério Público ofereça denúncia apenas em face dos investigados contra os quais já existam elementos probatórios suficientes de autoria e materialidade, prosseguindo as investigações quanto aos demais sem que isso caracterize renúncia tácita.",
        adoptedByExam: true
      }
    },
    examPitfalls: [
      "Afirmar que a decadência do direito de representação na ação penal pública condicionada gera a extinção da punibilidade do agente (Correto, art. 107, IV, do CP), mas confundi-la com prescrição da pretensão punitiva.",
      "Sustentar que o oferecimento de queixa-crime na ação penal privada subsidiária da pública desnatura a natureza pública do delito ou retira do Ministério Público o poder de aditamento ou retomada da titularidade (Falso: a ação permanece pública por natureza, ocorrendo mera substituição processual extraordinária).",
      "Errar o termo inicial da decadência da ação privada subsidiária da pública: o prazo decadencial de 6 meses corre a partir do encerramento do prazo legal concedido ao Ministério Público para denunciar ou arquivar o inquérito, e não da data do fato criminoso.",
      "Confundir a renúncia ao direito de queixa (ato unilateral que ocorre antes da propositura da ação privada) com o perdão do ofendido (ato bilateral que pressupõe ação penal já em curso e aceitação expressa ou tácita do querelado)."
    ],
    careerNuances: {
      PGFN: "A PGFN atua em estreita articulação com o Ministério Público Federal mediante o encaminhamento da Representação Fiscal para Fins Penais após o esgotamento do processo administrativo tributário (Súmula Vinculante 24 do STF), fiscalizando a reparação do dano ao erário nas condições do ANPP e na execução civil ex delicto.",
      AGU: "A Advocacia-Geral da União atua como assistente da acusação em ações penais públicas promovidas em razão de crimes praticados contra o patrimônio, serviços ou servidores federais em razão de suas funções, resguardando a pretensão reparatória e ressarcitória da União."
    }
  },
  {
    id: "penal-crimes-administracao-licitacoes",
    discipline: "DIREITO PENAL E PROCESSUAL PENAL",
    title: "Crimes Contra a Administração Pública, Crimes em Licitações e Acessoriedade Administrativa",
    themeKeywords: [
      "crimes contra a administração pública", "crimes em licitações", "acessoriedade administrativa",
      "peculato", "concussão", "corrupção passiva", "prevaricação", "contratação direta ilegal",
      "frustração do caráter concorrencial"
    ],
    coreDoctrine: "O Título XI do Código Penal tutela o regular funcionamento, a moralidade, a probidade, a legalidade e a preservação patrimonial da Administração Pública. No plano subjetivo, destaca-se a conceituação ampla e funcional de funcionário público para fins penais (art. 327 do CP), a qual abrange qualquer pessoa que, mesmo transitoriamente ou sem remuneração, exerça cargo, emprego ou função pública, estendendo-se por equiparação (§ 1º) a quem atua em entidade paraestatal ou empresa prestadora de serviços contratada para execução de atividade típica do Estado, incidindo a causa de aumento de pena do § 2º (terça parte) aos detentores de cargos em comissão ou funções de direção e assessoramento. Os tipos penais funcionais próprios bifurcam-se dos impróprios: nos próprios, a condição de funcionário público é elementar essencial da tipicidade, de modo que sua ausência desnatura o crime para conduta atípica (ex: prevaricação, art. 319 do CP); nos impróprios, a ausência da qualidade funcional opera desclassificação para outro delito comum (ex: peculato-apropriação que se transmuda em apropriação indébita comum). O peculato (art. 312 do CP) ostenta especial relevo dogmático: divide-se nas modalidades dolosas (apropriação de bem público ou particular que esteja em sua posse funcional, desvio do bem para destinação diversa e peculato-furto no § 1º) e na modalidade culposa (§ 2º), na qual o funcionário concorre culposamente com negligência ou desídia para o crime doloso de terceiro, dotada de regra ímpar de extinção da punibilidade (§ 3º) caso ocorra a integral reparação do dano patrimonial antes do trânsito em julgado da sentença condenatória, ou redução da pena pela metade se a reparação for posterior. A concussão (art. 316, conduta de exigir vantagem indevida com abuso de autoridade) diferencia-se da corrupção passiva (art. 317, conduta de solicitar, receber ou aceitar promessa de vantagem indevida), sendo ambas crimes formais cuja consumação antecede o efetivo recebimento do proveito econômico. Com a promulgação da novel Lei de Licitações (Lei nº 14.133/2021), os crimes em licitações e contratos foram formalmente revogados da Lei nº 8.666/1993 e transladados para o Código Penal (arts. 337-E a 337-P), com significativo recrudescimento sancionatório. Dentre eles, ressaltam o art. 337-E (contratação direta ilegal por dispensa ou inexigibilidade indevidas) e o art. 337-F (frustração do caráter competitivo do certame licitatório), nos quais o Superior Tribunal de Justiça, uniformizando a matéria perante sua Corte Especial, consagrou a exigência de demonstração cabal de dolo específico e efetivo prejuízo material aos cofres públicos para a subsunção delitiva, afastando responsabilizações automáticas de gestores ou assessores jurídicos desprovidas de prova do conluio fraudulento.",
    divergentCurrents: {
      firstCurrent: {
        name: "Crime de Mera Conduta e Perigo Abstrato nas Licitações",
        author: "Doutrina Punitivista e Ministério Público Tradicional",
        thesis: "O crime de contratação direta indevida (antigo art. 89 da Lei 8.666 e novel art. 337-E do CP) é delito formal de perigo abstrato, consumando-se com a mera inobservância dos ritos legais da dispensa ou inexigibilidade, independentemente de superfaturamento ou comprovação de prejuízo pecuniário.",
        adoptedByExam: false
      },
      secondCurrent: {
        name: "Exigência de Dolo Específico e Prejuízo ao Erário (Tese Vinculante)",
        author: "Superior Tribunal de Justiça (Corte Especial, APn 480/MG e REsp 1.288.620/PB)",
        thesis: "A tipificação dos crimes em licitações exige a presença incontroversa do dolo específico de fraudar o erário e a demonstração cabal do prejuízo econômico efetivo imposto à Administração Pública, sendo atípica a conduta do agente público que realiza contratação direta sem dano financeiro e com prestação integral dos serviços contratados.",
        adoptedByExam: true
      }
    },
    examPitfalls: [
      "Confundir a reparação do dano no peculato doloso com o culposo: a extinção da punibilidade pela reparação do dano anterior à sentença irrecorrível aplica-se EXCLUSIVAMENTE ao peculato culposo (art. 312, § 3º). No peculato doloso, a reparação do dano antes do recebimento da denúncia enseja apenas arrependimento posterior (art. 16 do CP, causa de diminuição de pena de um a dois terços).",
      "Errar a distinção entre concussão (verbo nuclear exigir, imposição coativa da vantagem) e corrupção passiva (verbos solicitar ou receber, sem a coação típica da exigência concussiva).",
      "Afirmar que a responsabilidade do assessor jurídico público que emite parecer favorável à licitação é automática: o STF firmou na ADI 6421 que o parecerista só responde se houver dolo ou erro grosseiro eivados de conluio ilícito.",
      "Afirmar que a condenação definitiva pelo Tribunal de Contas da União gera coisa julgada no âmbito penal (Falso: a jurisdição penal é independente e soberana, operando-se o princípio da incomunicabilidade das instâncias, ressalvada a negativa cabal de autoria ou inocorrência material do fato julgadas no juízo criminal)."
    ],
    careerNuances: {
      PGFN: "A Procuradoria da Fazenda Nacional é a guardiã da integridade dos contratos públicos federais e da arrecadação, atuando na apuração de desvios tributários decorrentes de fraudes funcionais e licitatórias e comunicando indícios de infração penal aos órgãos de persecução.",
      AGU: "Os membros da AGU contam com proteção legal expressa contra responsabilização penal decorrente do exercício regular de suas prerrogativas consultivas, demandando a comprovação de dolo direto ou concerto ilícito para persecução penal de advogados públicos por emissão de pareceres."
    }
  },
  {
    id: "penal-economico-sfn-lavagem-anticorrupcao",
    discipline: "DIREITO PENAL E PROCESSUAL PENAL",
    title: "Direito Penal Econômico: Crimes Contra a Ordem Tributária, Crimes Contra o Sistema Financeiro, Lavagem e Anticorrupção",
    themeKeywords: [
      "crimes contra a ordem econômica e lei anticorrupção", "crimes contra o sistema financeiro nacional",
      "combate à lavagem", "ordem econômica", "sistema financeiro nacional", "lavagem"
    ],
    coreDoctrine: "O Direito Penal Econômico tutela bens jurídicos supraindividuais relativos à ordem tributária, à estabilidade do sistema financeiro, à higidez do fluxo econômico e à moralidade corporativa nas relações mercantis com o Estado. No microssistema dos crimes contra a ordem tributária (Lei nº 8.137/1990), o ordenamento distingue nitidamente os crimes materiais (art. 1º, incisos I a IV), que exigem efetiva supressão ou redução de tributo ou contribuição social, dos crimes formais (art. 2º), que prescindem do resultado naturalístico de dano ao erário. Nos crimes do art. 1º, a jurisprudência fixou o histórico enunciado da Súmula Vinculante nº 24 do STF: 'Não se tipifica crime material contra a ordem tributária, previsto no art. 1º, incisos I a IV, da Lei nº 8.137/90, antes do lançamento definitivo do tributo'. A consumação delitiva subordina-se à preclusão das instâncias administrativas fiscais perante o CARF/Receita Federal, constituindo o encerramento do processo administrativo verdadeira condição objetiva de punibilidade e marco deflagrador da prescrição penal. De outro lado, a legislação assegura que o pagamento integral dos tributos devidos, acrescido dos consectários legais, realizado a qualquer tempo (mesmo após o trânsito em julgado da condenação penal), extingue a punibilidade do agente (art. 9º da Lei nº 10.684/2003 c/c art. 83 da Lei 9.430/1996), ao passo que o parcelamento deferido suspende a pretensão punitiva e o prazo prescricional enquanto vigorar. Nos crimes contra o Sistema Financeiro Nacional (Lei nº 7.492/1986), destacam-se a gestão fraudulenta (art. 4º, crime de forma livre, perigo abstrato e ação múltipla corporificado no falseamento de demonstrações contábeis e desvio patrimonial ilícito), a gestão temerária (art. 4º, parágrafo único, voltada a riscos excessivos sem salvaguardas regulatórias), a apropriação indébita financeira (art. 5º) e a evasão de divisas (art. 22, parágrafo único, consistente na remessa de divisas ao exterior sem autorização ou manutenção de depósitos não declarados à repartição federal competente - Bacen ou Receita Federal). No crime de lavagem ou ocultação de capitais (Lei nº 9.613/1998, com as alterações estruturantes da Lei nº 12.683/2012), extirpou-se o rol taxativo de crimes antecedentes, admitindo-se que qualquer infração penal (crime ou contravenção penal como jogo do bicho) funcione como delito antecedente. O tipo estrutura-se nas etapas dogmáticas de introdução/colocação (placement), dissimulação/estratificação (layering) e integração (integration), ostentando autonomia em relação à infração prévia (art. 2º, II), prescindindo de condenação ou conhecimento da identidade dos autores do crime gerador do ativo ilícito, admitindo o dolo eventual corporificado na teoria da cegueira deliberada (willful blindness).",
    divergentCurrents: {
      firstCurrent: {
        name: "Extinção da Punibilidade Tributária Restrita à Fase Pré-Processual",
        author: "Doutrina Penal Clássica e Regra Geral do Art. 16 do CP",
        thesis: "O pagamento do tributo após o recebimento da denúncia criminal deve configurar mero arrependimento posterior ou circunstância atenuante genérica, descabendo extinguir a punibilidade do réu após deflagrada a ação penal.",
        adoptedByExam: false
      },
      secondCurrent: {
        name: "Extinção da Punibilidade pelo Pagamento a Qualquer Tempo (STF e STJ)",
        author: "Precedente Vinculante do STF (HC 81.929/RJ e ADI 4273)",
        thesis: "No direito penal tributário brasileiro, o pagamento integral do tributo e seus acessórios extingue a punibilidade dos crimes tipificados na Lei nº 8.137/1990 e de apropriação indébita previdenciária a qualquer tempo, mesmo que realizado após o trânsito em julgado da sentença condenatória, haja vista que o objetivo primordial da persecução penal fiscal é a recuperação das receitas do Erário.",
        adoptedByExam: true
      }
    },
    examPitfalls: [
      "Afirmar que a Súmula Vinculante 24 do STF aplica-se aos crimes formais do art. 2º da Lei 8.137/1990 ou aos crimes de descaminho e apropriação indébita previdenciária (Erro frontal: a súmula vinculante aplica-se EXCLUSIVAMENTE aos crimes materiais do art. 1º, incisos I a IV).",
      "Confundir a evasão de divisas na modalidade de manter depósitos não declarados no exterior (art. 22, p. único): o STJ e STF fixaram que a omissão só é penalmente típica se o valor não declarado for superior ao patamar regulamentar mínimo de declaração obrigatória fixado pelo Banco Central do Brasil.",
      "Desconhecer a teoria da cegueira deliberada na lavagem de dinheiro: o agente que cria barreiras conscientes para não tomar conhecimento da origem criminosa dos bens e recursos aceita o risco de dissimulá-los, atuando com dolo eventual equiparável ao dolo direto.",
      "Afirmar que a Lei Anticorrupção (Lei 12.846/2013) estabelece crimes societários: a responsabilização da pessoa jurídica na Lei Anticorrupção é de natureza estritamente administrativa e civil objetiva, não existindo responsabilidade penal de pessoas jurídicas fora da seara dos crimes ambientais (art. 225, § 3º da CF)."
    ],
    careerNuances: {
      PGFN: "A PGFN possui atribuição direta no controle da Dívida Ativa Tributária, na emissão da Representação Fiscal para Fins Penais e no deferimento de parcelamentos e transações tributárias (Lei 13.988/2020), atos que operam a suspensão ou extinção da punibilidade de crimes contra a ordem tributária.",
      PBC: "Os Procuradores do Banco Central do Brasil atuam em colaboração estreita com os órgãos de repressão penal no encaminhamento de relatórios técnicos de ilícitos cambiais, evasão de divisas e infrações regulatórias graves no Sistema Financeiro Nacional."
    }
  },
  {
    id: "proc-penal-inquerito-jurisdicao-competencia",
    discipline: "DIREITO PENAL E PROCESSUAL PENAL",
    title: "Inquérito Policial, Jurisdição e Critérios Determinadores da Competência Penal Federal",
    themeKeywords: [
      "inquérito policial", "inquerito policial", "inquérito", "inquerito", "polícia judiciária",
      "policia judiciaria", "arquivamento do inquérito", "art. 28 do cpp", "jurisdição", "competência",
      "competencia penal federal", "sujeitos da relação processual", "art. 109 da cf"
    ],
    coreDoctrine: "O inquérito policial qualifica-se dogmaticamente como procedimento administrativo de índole inquisitiva, informativo e de natureza preparatória, presidido privativamente pela polícia judiciária (Polícia Federal no âmbito da União ou Polícia Civil nos Estados) com a finalidade pública precípua de coligir elementos materiais de informação acerca da existência do fato criminoso (materialidade) e de quem seja seu autor ou partícipes (autoria), a fim de aparelhar e subsidiar a formação da opinio delicti do titular da ação penal pública (art. 129, I da CF) ou privada.\n\nEntre as características estruturais e basilares que tipificam o inquérito policial destacam-se: (i) a inquisitoriedade, marcada pela ausência de contraditório e ampla defesa em amplitude idêntica à do processo judicial, resguardadas com força cogente as prerrogativas profissionais da advocacia alçadas na Súmula Vinculante nº 14 do Supremo Tribunal Federal ('É direito do defensor, no interesse do representado, ter amplo acesso aos elementos de prova que, já documentados em procedimento investigatório realizado por órgão com competência de polícia judiciária, digam respeito ao exercício do direito de defesa'); (ii) a oficiosidade e oficialidade; (iii) a forma escrita e documental; (iv) o sigilo externo (art. 20 do CPP), indispensável ao êxito das investigações policiais; (v) a dispensabilidade, na medida em que a denúncia ministerial pode ser legitimamente deduzida com esteio em peças de informação autônomas; e (vi) a indisponibilidade, expressamente insculpida no art. 17 do CPP, segundo o qual 'a autoridade policial não poderá mandar arquivar autos de inquérito'.\n\nCom o advento da Lei nº 13.964/2019 e a pacificação jurisprudencial emanada do Pleno do Supremo Tribunal Federal nas ADIs 6.298, 6.299, 6.300 e 6.305, remodelou-se a sistemática de arquivamento do inquérito policial prevista no art. 28 do CPP. Suprimiu-se a homologação judicial outrora exercida pelo magistrado, transferindo-se o arquivamento integralmente para a esfera orgânica ministerial. Ao promover o arquivamento da investigação, o Ministério Público notifica o investigado, a autoridade policial e o ofendido, cabendo a este último, no prazo legal de 30 dias contados da ciência, interpor recurso administrativo à instância revisora do respectivo órgão ministerial.\n\nNo campo probatório, o valor dos elementos colhidos na fase inquisitorial subordina-se à regra de ouro do artigo 155 do CPP: o juiz formará sua convicção pela livre apreciação da prova produzida sob contraditório judicial, não podendo fundamentar sua decisão condenatória exclusivamente nos elementos informativos colhidos na investigação policial, ressalvadas as provas cautelares, não repetíveis e antecipadas. Ademais, vigora o dogma secular de que vícios formais ocorridos no inquérito policial não contaminam a higidez e a higidez substancial da ação penal subsequente.\n\nNo tocante à competência criminal da Justiça Federal, esculpida com matriz constitucional estrita no art. 109, inciso IV, da Constituição Federal, fixou-se o entendimento de que a jurisdição federal abrange os crimes praticados em detrimento de bens, serviços ou interesse da União, autarquias federais ou empresas públicas federais, excluídas as contravenções penais (Súmula 38 do STJ: 'Compete à Justiça Estadual comum o processo por contravenção penal, ainda que praticada em detrimento de bens ou interesse da União') e os crimes cometidos contra sociedades de economia mista federais (Súmula 556 do STF: 'É competente a Justiça Comum para julgar o crime em que é vítima a sociedade de economia mista'). Na reunião por conexão ou continência, aplica-se a prevalência absoluta da Justiça Federal sobre a Justiça Estadual, consoante proclama a Súmula 122 do STJ: 'Compete à Justiça Federal o processo e julgamento dos crimes conexos de competência federal e estadual, não se aplicando a regra do art. 78, II, 'a', do Código de Processo Penal'.",
    divergentCurrents: {
      firstCurrent: {
        name: "Competência Federal Fixada por Interesse Direto e Específico da União (Súmulas 38 e 122 STJ, Súmula 556 STF)",
        author: "Precedentes Uniformizados Vinculantes do STF e STJ",
        thesis: "O rol de entes federais do art. 109, IV, da CF é exaustivo: União, autarquias e empresas públicas. Delitos que lesem sociedade de economia mista ou contravenções penais tramitam perante a Justiça Estadual, atraindo a Justiça Federal unicamente em hipótese de conexão com crime federal (Súmula 122 STJ).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Atração Genérica de Toda Infração Conexa ao Interesse Econômico Federal",
        author: "Doutrina Minoritária Superada",
        thesis: "Qualquer afetação patrimonial a ente com participação acionária da União justificaria o deslocamento da jurisdição para os juízes federais.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "DISPENSABILIDADE DO INQUÉRITO POLICIAL: O inquérito é procedimento facultativo e dispensável; se o Ministério Público dispuser de outros elementos informativos suficientes, pode ajuizar denúncia imediatamente.",
      "SÚMULA VINCULANTE 14 E DILIGÊNCIAS EM CURSO: O defensor tem acesso amplo aos elementos já documentados nos autos; o acesso NÃO se estende a diligências policiais sigilosas em andamento (interceptações telefônicas e mandados de busca pendentes de cumprimento).",
      "DESCAMINHO VERSUS CONTRABANDO: O descaminho (art. 334 do CP) lesa a arrecadação tributária da União (interesse direto da Fazenda Nacional e competência da Justiça Federal, ex vi da Súmula 151 do STJ), admitindo o princípio da insignificância até o limite fiscal administrativo de R$ 20.000,00.",
      "CONTRAVENÇÕES PENAIS JAMAIS NA JUSTIÇA FEDERAL: Mesmo que a contravenção penal seja praticada contra prédio ou funcionário público federal em serviço, a competência permanece firmada na Justiça Estadual (Súmula 38 do STJ).",
      "VÍCIOS DO INQUÉRITO NÃO ANULAM A AÇÃO PENAL: Eventuais irregularidades praticadas pela polícia judiciária no bojo do inquérito policial não geram a nulidade da subsequente ação penal."
    ],
    careerNuances: {
      PGFN: "A Procuradoria da Fazenda Nacional acompanha os inquéritos policiais por crimes contra a ordem tributária e descaminho instaurados a partir de Representações Fiscais, postulando medidas assecuratórias reais (sequestro e hipoteca legal) para assegurar o ressarcimento da Dívida Ativa da União.",
      PF: "A Procuradoria Federal atua ativamente na defesa institucional e patrimonial das autarquias federais (INSS, IBAMA, ANATEL, etc.) lesadas por fraudes investigadas em inquéritos policiais, habilitando-se como assistente do Ministério Público Federal.",
      PBC: "Os Procuradores do Banco Central utilizam o inquérito policial federal como instrumento crucial de articulação para estancar esquemas de pirâmides financeiras, evasão de divisas e ilícitos cambiais complexos."
    }
  },
  // =========================================================================
  // DIREITO DO TRABALHO E PROCESSUAL DO TRABALHO: MÓDULOS DE ALTA DENSIDADE
  // =========================================================================
  {
    id: "doctrinal-trabalho-teoria-geral-relacao-emprego",
    discipline: "DIREITO DO TRABALHO E PROCESSUAL DO TRABALHO",
    title: "Direito Individual do Trabalho: Princípios Fundamentais, Relação de Trabalho vs Emprego, Sujeitos, Grupo Econômico e Sucessão",
    themeKeywords: [
      "conceito", "fontes", "relação de trabalho", "relação de emprego", "distinção",
      "sujeitos da relação de emprego", "contrato individual do trabalho", "princípios do direito do trabalho",
      "reforma trabalhista", "pejotização", "teletrabalho", "grupo econômico", "sucessão de empregadores",
      "sócio retirante", "subordinação jurídica", "alteridade"
    ],
    coreDoctrine: "O Direito Individual do Trabalho alicerça-se no princípio protetivo, concebido historicamente para reequilibrar a disparidade socioeconômica inerente à relação entre capital e trabalho. Desdobra-se classicamente em três vertentes dogmáticas: o in dubio pro operario, a aplicação da norma mais favorável e a preservação da condição mais benéfica (incorporada no art. 468 da CLT e na Súmula 51 do TST). Com a vigência da Reforma Trabalhista (Lei nº 13.467/2017), o legislador introduziu balizas hermenêuticas restritivas no artigo 8º da CLT, estabelecendo em seu § 2º que súmulas e outros enunciados de jurisprudência editados pelo Tribunal Superior do Trabalho e pelos Tribunais Regionais do Trabalho não poderão restringir direitos legalmente previstos nem criar obrigações que não estejam expressamente albergadas em lei, prestigiando a intervenção mínima na vontade coletiva.\n\nNo plano conceitual, impõe-se a distinção basilar entre relação de trabalho (gênero amplo que compreende toda atividade humana produtiva prestada por pessoa física em favor de outrem, englobando o trabalho autônomo, eventual, avulso, voluntário, estágio e cooperativo) e relação de emprego (espécie qualificada e tutelada com primazia pela CLT). Nos termos dos artigos 2º e 3º da Consolidação das Leis do Trabalho, a caracterização do liame empregatício reclama a presença concomitante e indelével de cinco pressupostos fático-jurídicos: (i) pessoalidade (intuitu personae quanto ao prestador); (ii) pessoa natural ou física; (iii) não eventualidade (inserção regular e permanente na dinâmica produtiva do tomador); (iv) onerosidade (contraprestação pecuniária estipulada); e (v) subordinação jurídica, elemento diferenciador por excelência, corporificada na sujeição do trabalhador ao poder diretivo, regulamentar, fiscalizatório e disciplinar do empregador, somada ao elemento da alteridade (assunção exclusiva dos riscos da atividade econômica pelo empregador).\n\nNo tocante à autonomia da contratação, o art. 442-B da CLT estabeleceu expressamente que a contratação do trabalhador autônomo, cumpridas as formalidades legais, afasta a qualidade de empregado, ainda que haja prestação de serviços com exclusividade e de forma contínua. Em sintonia com essa diretriz de livre iniciativa, o Supremo Tribunal Federal, ao julgar a ADPF 324 e o Tema 725 da Repercussão Geral, fixou tese vinculante histórica reconhecendo a plena licitude da terceirização de qualquer atividade econômica, meio ou fim, superando a dicotomia restritiva outrora cristalizada na Súmula 331 do TST. Ademais, o STF chancelou a validade constitucional de arranjos societários e de prestação de serviços por profissionais liberais mediante pessoas jurídicas (o fenômeno da pejotização), assentando a competência da Justiça Comum para dirimir controvérsias de natureza estritamente comercial e exigindo prova incontroversa de vício formal de consentimento ou fraude para qualquer desconsideração do negócio jurídico.\n\nNo polo passivo, a figura do empregador (art. 2º da CLT) abarca a empresa que assume os riscos do empreendimento. O regime jurídico do grupo econômico sofreu profunda reformulação com a redação dos §§ 2º e 3º do art. 2º da CLT: a mera identidade de sócios não é mais suficiente para configurar grupo econômico trabalhista, exigindo-se cumulativamente a demonstração inequívoca de interesse integrado, efetiva comunhão de interesses e atuação conjunta das sociedades integrantes para legitimar a responsabilidade solidária passiva. Na sucessão de empregadores (arts. 10 e 448-A da CLT), as obrigações trabalhistas transmitem-se integralmente ao sucessor, respondendo a empresa sucedida apenas em caso de comprovada fraude societária, ao passo que o sócio retirante (art. 10-A da CLT) responde apenas subsidiariamente pelas dívidas contraídas no período em que figurou nos quadros sociais, condicionado a que a reclamação trabalhista seja ajuizada no prazo decadencial estrito de até 2 anos contados da averbação da alteração contratual na Junta Comercial competente.",
    divergentCurrents: {
      firstCurrent: {
        name: "Licitude Ampla da Terceirização e Pejotização (STF ADPF 324 e Tema 725)",
        author: "Plenário do Supremo Tribunal Federal",
        thesis: "É plenamente lícita a terceirização de qualquer atividade da empresa, seja meio ou fim, inexistindo ilicitude abstrata em contratos civis e comerciais de prestação de serviços por pessoas jurídicas constituídas, descabendo presumir vínculo de emprego sem fraude cabalmente demonstrada.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Ilicitude da Terceirização em Atividade-Fim e Subordinação Estrutural",
        author: "Jurisprudência Tradicional do TST (Súmula 331 Superada)",
        thesis: "A terceirização de atividade-fim configuraria intermediação ilícita de mão de obra e fraude trabalhista, gerando vínculo de emprego direto com a tomadora com fundamento na teoria da subordinação estrutural ou reticular.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "GRUPO ECONÔMICO TRABALHISTA E IDENTIDADE DE SÓCIOS: Após a Reforma Trabalhista, a mera existência de sócios comuns não caracteriza grupo econômico; é indispensável comprovar a comunhão de interesses e atuação coordenada entre as empresas.",
      "PRAZO DECADENCIAL DO SÓCIO RETIRANTE: O sócio retirante responde subsidiariamente somente em ações propostas em até 2 anos após a averbação da alteração societária, observando a ordem imperativa de preferência patrimonial (art. 10-A da CLT).",
      "CONTRATAÇÃO DE AUTÔNOMO COM EXCLUSIVIDADE: O art. 442-B da CLT prevê expressamente que a contratação de autônomo, inclusive com exclusividade e continuidade, afasta a presunção de vínculo empregatício.",
      "TERCEIRIZAÇÃO NA ADMINISTRAÇÃO PÚBLICA (ADC 16 E TEMA 246 DO STF): O inadimplemento de verbas trabalhistas pela empresa contratada não transfere automaticamente responsabilidade subsidiária ao Poder Público, sendo vedada presunção de culpa in vigilando.",
      "TELETRABALHO E CONTROLE DE JORNADA: O empregado submetido a teletrabalho por produção ou tarefa é excluído do regime geral de controle de jornada (art. 62, III da CLT); todavia, se submetido a controle de horários por meios telemáticos, faz jus a horas extras."
    ],
    careerNuances: {
      PGFN: "A PGFN monitora de forma rigorosa as tentativas de redirecionamento indevido de débitos trabalhistas contra a Fazenda Pública em contratos de terceirização, atuando em harmonia com as diretrizes do Tema 246 do STF para comprovar a inexistência de culpa administrativa e preservar a higidez dos cofres públicos.",
      AGU: "A Advocacia-Geral da União atua perante a Justiça do Trabalho defendendo os órgãos da administração pública federal direta e indireta nas terceirizações, comprovando a realização das rotinas regulamentares de fiscalização fiscal e previdenciária das empresas contratadas.",
      PF: "O Ministério Público do Trabalho foca sua atuação na repressão ao trabalho em condições análogas às de escravo, fraudes de pejotização que mascaram vulnerabilidade extrema e precarização de direitos fundamentais em cadeias produtivas complexas."
    }
  },
  {
    id: "doctrinal-trabalho-duracao-remuneracao-ferias-dsr",
    discipline: "DIREITO DO TRABALHO E PROCESSUAL DO TRABALHO",
    title: "Duração do Trabalho, Jornada, Férias, Repouso Semanal, Remuneração, Salário e Programas Emergenciais de Emprego",
    themeKeywords: [
      "duração do trabalho", "jornada de trabalho", "horas extras", "banco de horas",
      "férias", "descanso semanal remunerado", "remuneração e salário: conceito e distinção",
      "remuneração", "salário", "programa emergencial de manutenção de emprego", "intervalo intrajornada",
      "regime 12x36", "equiparação salarial", "gorjetas", "prêmios"
    ],
    coreDoctrine: "O regime da duração do trabalho submete-se ao teto constitucional de 8 horas diárias e 44 horas semanais (art. 7º, XIII da CF/88 e art. 58 da CLT), admitida a compensação de horários e a redução de jornada mediante acordo ou convenção coletiva. No tocante aos registros de ponto, o art. 58, § 1º da CLT e a Súmula 366 do TST estabelecem que não serão descontadas nem computadas como jornada extraordinária as variações no registro não excedentes de 5 minutos, observado o teto máximo de 10 minutos diários. Ponto de expressivo impacto dogmático consistiu na supressão das horas in itinere operada pelo § 2º do art. 58: o tempo gasto pelo empregado desde a sua residência até a efetiva ocupação do posto e no trajeto de retorno, mesmo em transporte fornecido pelo empregador para local de difícil acesso, não é mais computado na jornada de trabalho por não constituir tempo à disposição.\n\nAs horas extraordinárias são limitadas a até duas horas diárias (art. 59 da CLT), remuneradas com acréscimo mínimo de 50%. A legislação autoriza a celebração de banco de horas semestral por mero acordo individual escrito entre empregado e empregador (art. 59, § 5º da CLT), bem como a instituição da jornada 12x36 (doze horas de trabalho seguidas por trinta e seis horas de descanso) por acordo individual direto (art. 59-A), na qual a remuneração pactuada já abrange os pagamentos devidos pelo descanso semanal e pelos feriados descansados. Quanto ao intervalo intrajornada (art. 71 da CLT), a concessão é obrigatória em 1 hora mínima para jornadas superiores a 6 horas; contudo, a sua supressão parcial ou total enseja apenas o pagamento indenizatório relativo ao período efetivamente suprimido, com acréscimo de 50%, sem reflexos nas demais verbas rescisórias ou contratuais (§ 4º), afastando-se a antiga diretriz da Súmula 437 do TST.\n\nO descanso semanal remunerado (Lei nº 605/1949 e art. 67 da CLT) deve ser de 24 horas consecutivas, preferencialmente aos domingos. No plano das férias anuais remuneradas (arts. 129 a 145 da CLT), assegura-se o gozo de até 30 dias corridos após cada período aquisitivo de 12 meses, com o terço constitucional. Desde que haja anuência expressa do trabalhador, as férias podem ser fracionadas em até 3 períodos (art. 134, § 1º), sendo um deles de no mínimo 14 dias corridos e os demais de pelo menos 5 dias cada um, sendo vedado o início nos dois dias antecedentes a feriado ou repouso semanal. Ademais, o Supremo Tribunal Federal, ao julgar a ADPF 501, declarou a inconstitucionalidade da Súmula 450 do TST, assentando que o atraso no pagamento da remuneração das férias não autoriza a aplicação da dobra do art. 137 da CLT quando o gozo das férias ocorreu dentro do período concessivo próprio.\n\nNo campo salarial, a remuneração compreende a totalidade dos ganhos econômicos auferidos pelo empregado, incluindo o salário devido e pago diretamente pelo empregador e as gorjetas percebidas de terceiros (art. 457 da CLT). A Reforma Trabalhista remodelou o § 2º do art. 457 para excluir categoricamente do salário de contribuição e da base de cálculo de reflexos trabalhistas e previdenciários as importâncias pagas a título de ajuda de custo, auxílio-alimentação (vedado pagamento em espécie), diárias para viagem, prêmios por desempenho e abonos, ainda que habituais. Na equiparação salarial (art. 461 da CLT), exige-se identidade de função e trabalho de igual valor prestado ao mesmo empregador e no mesmo estabelecimento empresarial, demandando que a diferença de tempo de serviço entre paradigma e paragonado na empresa não seja superior a 4 anos e a diferença na função não ultrapasse 2 anos.",
    divergentCurrents: {
      firstCurrent: {
        name: "Inconstitucionalidade da Dobra de Férias por Mero Atraso no Pagamento (STF ADPF 501)",
        author: "Plenário do Supremo Tribunal Federal",
        thesis: "O art. 137 da CLT comina o pagamento em dobro apenas quando as férias não são gozadas dentro do período concessivo. É inconstitucional estender essa penalidade pecuniária por via de interpretação analógica ao simples atraso no pagamento da remuneração das férias tempestivamente usufruídas.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Aplicação Analógica da Dobra por Descumprimento do Prazo do Art. 145 (TST Súmula 450 Superada)",
        author: "Jurisprudência Tradicional do TST",
        thesis: "O descumprimento do prazo de pagamento previsto no art. 145 da CLT frustraria a finalidade recreativa do instituto, ensejando a aplicação da penalidade de dobra prevista no art. 137.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "SUPRESSÃO DO INTERVALO INTRAJORNADA E NATUREZA INDENIZATÓRIA: Paga-se apenas o tempo suprimido com adicional de 50%, com natureza puramente indenizatória, sem qualquer reflexo em verbas salariais ou rescisórias.",
      "INÍCIO DAS FÉRIAS E DIAS QUE ANTECEDEM DESCANSO: É proibido iniciar as férias nos 2 dias que antecedem feriado ou o dia de repouso semanal remunerado.",
      "PARCELAS NÃO INTEGRANTES DO SALÁRIO: Prêmios, ajudas de custo, abonos e diárias para viagem, mesmo habituais, não integram a remuneração nem sofrem incidência de contribuição previdenciária.",
      "EQUIPARAÇÃO SALARIAL NO MESMO ESTABELECIMENTO: A Reforma Trabalhista passou a exigir que paradigma e paragonado trabalhem no mesmo estabelecimento empresarial, e não mais na mesma localidade ou comarca.",
      "PROGRAMAS EMERGENCIAIS DE MANUTENÇÃO DO EMPREGO: O STF fixou na ADI 6363 a constitucionalidade de acordos individuais diretos para redução proporcional de jornada e salário sem intervenção sindical obrigatória em quadros de calamidade."
    ],
    careerNuances: {
      PGFN: "A Fazenda Nacional atua decisivamente na verificação dos reflexos previdenciários das parcelas salariais e indenizatórias, fiscalizando o correto recolhimento da contribuição previdenciária patronal e do trabalhador em conformidade com o art. 457, § 2º da CLT e a legislação de custeio.",
      AGU: "A Advocacia-Geral da União defende a estrita legalidade dos regimes de jornada de trabalho nas empresas estatais federais e autarquias, assegurando a validade dos acordos de compensação e a observância dos precedentes vinculantes do STF.",
      PF: "O Ministério Público do Trabalho fiscaliza ativamente a saúde ocupacional e a limitação de jornadas abusivas que acarretam fadiga severa e acidentes em setores industriais, frigoríficos e plataformas marítimas."
    }
  },
  {
    id: "doctrinal-trabalho-extincao-coletivo-tema1046",
    discipline: "DIREITO DO TRABALHO E PROCESSUAL DO TRABALHO",
    title: "Extinção do Contrato de Trabalho, Direito Coletivo, Prevalência do Negociado sobre o Legislado (STF Tema 1.046) e Liberdade Sindical",
    themeKeywords: [
      "extinção do contrato de trabalho", "direito coletivo do trabalho", "reforma trabalhista",
      "negociado sobre o legislado", "tema 1046", "justa causa", "rescisão indireta", "acordo mútuo rescisório",
      "convenção coletiva", "acordo coletivo", "contribuição assistencial", "tema 935 stf", "liberdade sindical"
    ],
    coreDoctrine: "A extinção do contrato de trabalho estrutura-se a partir de modalidades consolidadas que variam segundo a iniciativa e a culpabilidade das partes. A dispensa imotivada por iniciativa do empregador impõe o aviso prévio proporcional ao tempo de serviço (Lei nº 12.506/2011, que garante 30 dias acrescidos de 3 dias por ano completo de serviço, até o limite de 90 dias) e a multa indenizatória de 40% sobre os depósitos do FGTS. A demissão motivada por justa causa do trabalhador decorre do enquadramento estrito nas hipóteses taxativas do art. 482 da CLT (destacando-se improbidade, desídia habitual, insubordinação funcional e abandono de emprego, este presumido após 30 dias contínuos de ausência injustificada consoante a Súmula 32 do TST). No reverso, a rescisão indireta (art. 483 da CLT) configura justa causa perpetrada pelo empregador (como atraso contumaz de salários ou recolhimento irregular de FGTS), assegurando ao obreiro o recebimento da totalidade das verbas rescisórias da dispensa imotivada.\n\nInovação estrutural de grande repercussão consistiu na consagração do distrato ou rescisão por acordo bilateral entre empregado e empregador, tipificada no art. 484-A da CLT. Nessa modalidade negocial, o trabalhador recebe por metade o aviso prévio indenizado e a multa rescisória do FGTS (20%), levantando até 80% do saldo da conta vinculada do FGTS, restando vedado o acesso ao benefício do seguro-desemprego. O prazo para quitação de todas as verbas rescisórias e entrega das guias comprobatórias foi unificado no art. 477, § 6º da CLT: até 10 dias corridos contados do término contratual, independentemente de o aviso prévio ser trabalhado ou indenizado, incidindo a multa de um salário do art. 477, § 8º caso descumprido o interregno.\n\nNo campo do Direito Coletivo do Trabalho, a ordem jurídica assenta-se nos princípios da liberdade sindical e da autonomia privada coletiva (artigo 8º da CF/88). A Constituição consagra a unicidade sindical compulsória por base territorial mínima municipal e a vedação à interferência estatal na organização das entidades de classe. A Reforma Trabalhista extinguiu a compulsoriedade da contribuição sindical legal (antigo imposto sindical dos arts. 578 e 579 da CLT), condicionando-a à autorização prévia e expressa dos integrantes da categoria. Contudo, em emblemático julgamento que redefiniu o custeio sindical, o Plenário do Supremo Tribunal Federal (Tema 935 da Repercussão Geral, ARE 1.018.459) firmou a constitucionalidade da instituição, por acordo ou convenção coletiva, de contribuições assistenciais a serem exigidas inclusive dos empregados não filiados ao sindicato, contanto que seja expressa e amplamente assegurado a todos os trabalhadores o direito de oposição tempestiva e desprovida de ônus desarrazoados.\n\nO ápice da valorização da negociação coletiva consolidou-se com o julgamento do histórico Tema 1.046 da Repercussão Geral pelo Supremo Tribunal Federal (ARE 1.121.633): o STF proclamou a validade constitucional plena de convenções e acordos coletivos que pactuam limitações ou renúncias parciais a direitos trabalhistas, independentemente da previsão de vantagens compensatórias expressas, desde que não violem direitos absolutamente indisponíveis tutelados com assento constitucional direto. O artigo 611-A da CLT elenca rol exemplificativo de matérias em que o negociado prevalece sobre o legislado (jornada, banco de horas, teletrabalho, intervalo intrajornada respeitado o piso de 30 minutos, planos de cargos e salários), ao passo que o artigo 611-B estabelece rol taxativo e inderrogável de temas que constituem objeto ilícito de negociação (salário mínimo, seguro-desemprego, FGTS, normas de segurança e medicina do trabalho, licença-maternidade). Finalmente, o art. 620 da CLT consagrou a primazia do acordo coletivo de trabalho sobre a convenção coletiva, independentemente de ser mais ou menos favorável ao empregado.",
    divergentCurrents: {
      firstCurrent: {
        name: "Plena Validade da Negociação Coletiva sem Vantagens Compensatórias Explícitas (STF Tema 1.046)",
        author: "Plenário do Supremo Tribunal Federal (ARE 1.121.633)",
        thesis: "São constitucionais os acordos e convenções coletivas de trabalho que limitam direitos trabalhistas infraconstitucionais, sendo desnecessária a demonstração de contrapartidas setoriais específicas, prestigiando a autonomia da vontade coletiva do art. 7º, XXVI da CF.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Princípio da Vedação ao Retrocesso Social e Exigência de Compensação Mútua (TST Superado)",
        author: "Jurisprudência Tradicional do TST",
        thesis: "A supressão ou restrição de direitos trabalhistas por norma coletiva somente seria válida caso houvesse concessão de vantagem equivalente, sob pena de vulneração aos princípios da irrenunciabilidade e proteção social.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "ACORDO COLETIVO SEMPRE PREVALECE SOBRE CONVENÇÃO COLETIVA: A Reforma Trabalhista revogou a teoria do conglobamento no art. 620 da CLT; as condições do ACT sempre prevalecem sobre a CCT.",
      "DIREITO DE OPOSIÇÃO NA CONTRIBUIÇÃO ASSISTENCIAL: O Tema 935 do STF validou a cobrança de contribuição assistencial aos não filiados, mas condicionou expressamente a cobrança à garantia ampla do direito de oposição do trabalhador.",
      "UNIFICAÇÃO DO PRAZO RESCISÓRIO: O prazo de pagamento das verbas rescisórias do art. 477 da CLT é de 10 dias corridos em TODAS as modalidades de rescisão, sem distinção de aviso prévio trabalhado ou indenizado.",
      "LIMITAÇÃO DO INTERVALO INTRAJORNADA EM NORMA COLETIVA: O intervalo intrajornada pode ser reduzido por acordo ou convenção coletiva, desde que respeitado o piso mínimo absoluto de 30 minutos para jornadas superiores a 6 horas (art. 611-A, III).",
      "SUPRESSÃO DO PRINCÍPIO DA ULTRATIVIDADE: O art. 614, § 3º da CLT veda a ultratividade das normas coletivas de trabalho, não se incorporando cláusulas vencidas aos contratos individuais (confirmado pelo STF na ADPF 323)."
    ],
    careerNuances: {
      PGFN: "A PGFN resguarda os interesses do Erário e da arrecadação previdenciária em processos trabalhistas, defendendo que a negociação coletiva que altere a natureza de verbas trabalhistas de salarial para indenizatória deve observar estritamente a lei de custeio tributário.",
      AGU: "A Advocacia-Geral da União intervém em dissídios coletivos envolvendo empresas públicas e sociedades de economia mista federais, assegurando a compatibilidade dos acordos com as diretrizes orçamentárias e limites da Lei de Responsabilidade Fiscal.",
      PF: "O Ministério Público do Trabalho detém legitimidade privativa para ajuizar Ação Anulatória de cláusula de convenção ou acordo coletivo que afronte direitos absolutamente indisponíveis ou viole preceitos de ordem pública tutelados pelo art. 611-B da CLT."
    }
  },
  {
    id: "doctrinal-processo-trabalho-competencia-provas-recursos",
    discipline: "DIREITO DO TRABALHO E PROCESSUAL DO TRABALHO",
    title: "Direito Processual do Trabalho: Competência Constitucional (Art. 114 CF), Jus Postulandi, Audiência, Provas e Recursos Trabalhistas",
    themeKeywords: [
      "direito processual do trabalho", "processo do trabalho", "recursos no processo do trabalho",
      "competência da justiça do trabalho", "art. 114 da cf", "jus postulandi", "ônus da prova",
      "audiência trabalhista", "revelia", "recurso ordinário", "recurso de revista", "transcendência", "agravo de petição"
    ],
    coreDoctrine: "O Direito Processual do Trabalho caracteriza-se pela oralidade, simplicidade formal, concentração dos atos em audiência unitária e impulsão oficial (art. 765 da CLT). A disciplina subordina-se à regra de subsidiariedade do art. 769 da CLT e supletividade do art. 15 do CPC, regulamentada pela Instrução Normativa nº 39/2016 do Tribunal Superior do Trabalho, pela qual as normas do CPC somente incidem na seara laboral se houver omissão legal e compatibilidade axiológica com os princípios informadores do processo do trabalho.\n\nA competência material da Justiça do Trabalho, redesenhada pela Emenda Constitucional nº 45/2004 no artigo 114 da Constituição Federal, transcendeu o vínculo empregatício tradicional para alcançar a integralidade das controvérsias oriundas da relação de trabalho (inciso I). Dentre os temas de destaque, fixou-se a competência absoluta da Justiça do Trabalho para julgar ações de indenização por danos morais e patrimoniais decorrentes de acidentes de trabalho e doenças profissionais (Súmula Vinculante nº 22 do STF), inclusive quando ajuizadas por sucessores ou herdeiros da vítima. No entanto, o Supremo Tribunal Federal, no julgamento definitivo da ADI 3.395, assentou que a Justiça do Trabalho é categoricamente incompetente para processar e julgar causas instauradas entre o Poder Público e servidores a ele vinculados por relação jurídico-administrativa ou regime estatutário, cuja competência pertence à Justiça Comum Estadual ou Federal.\n\nQuanto à capacidade postulatória, o art. 791 da CLT consagra a faculdade do jus postulandi pessoal dos empregados e empregadores. Não obstante, a jurisprudência uniformizada do TST (Súmula 425) delineou restrições severas ao alcance desse instituto: o jus postulandi limita-se estritamente às Varas do Trabalho e aos Tribunais Regionais do Trabalho, não alcançando a ação rescisória, a ação cautelar, o mandado de segurança e os recursos de competência originária ou recursal do Tribunal Superior do Trabalho. No rito procedimental e na audiência, a ausência injustificada do reclamante deflagra o arquivamento da reclamatória (art. 844 da CLT), ao passo que a ausência do reclamado opera revelia e confissão quanto à matéria fática. Todavia, a Reforma Trabalhista introduziu o § 5º no art. 844, garantindo que a presença de advogado constituído com procuração na audiência assegura a juntada de contestação e documentos, afastando os efeitos materiais da confissão ficta.\n\nNo campo probatório, o art. 818 da CLT adota a regra clássica de ônus distributivo (fato constitutivo ao autor; fato impeditivo, modificativo ou extintivo ao réu), consagrando expressamente em seu § 1º a teoria da distribuição dinâmica do ônus da prova por decisão judicial fundamentada. No regime recursal, sobressai o princípio da irrecorribilidade imediata das decisões interlocutórias (art. 893, § 1º da CLT e Súmula 214 do TST), desafiáveis apenas em sede de recurso principal contra a decisão definitiva. Os prazos recursais no processo trabalhista são de 8 dias úteis (art. 775 e 893), destacando-se o Recurso Ordinário (art. 895, cabível contra sentença terminativa ou definitiva), o Agravo de Instrumento (art. 897, 'b', privativo para destrancar recurso cujo seguimento foi denegado), o Agravo de Petição (art. 897, 'a', cabível nas execuções trabalhistas mediante delimitação exata de matérias e valores impugnados) e o Recurso de Revista (art. 896 da CLT). O Recurso de Revista constitui apelo de cognição estrita perante o TST, inadmitindo revolvimento probatório (Súmula 126 do TST), exigindo demonstração cumulativa de violação literal de lei federal ou da CF/88, ou divergência com súmula do TST/STF, associada à transcendência econômica, política, social ou jurídica (art. 896-A da CLT).",
    divergentCurrents: {
      firstCurrent: {
        name: "Incompetência Absoluta da Justiça do Trabalho para Servidores Estatutários (STF ADI 3.395)",
        author: "Plenário do Supremo Tribunal Federal",
        thesis: "O art. 114, I, da CF/88 não abrange as ações ajuizadas por servidores públicos estatutários ou sob regime especial em face do Poder Público, cabendo à Justiça Comum apreciar o vínculo jurídico-administrativo.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Competência Universal da Justiça do Trabalho para Todo Vínculo Jurídico de Trabalho",
        author: "Doutrina Trabalhista e Entendimento Superado do TST",
        thesis: "A EC 45/2004 teria unificado sob a jurisdição laboral todas as causas que envolvam o trabalho humano, independentemente da natureza do regime estatutário do servidor público.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "LIMITAÇÃO DO JUS POSTULANDI (SÚMULA 425 TST): O jus postulandi não se aplica perante o TST, nem alcança mandado de segurança, ação cautelar e ação rescisória, exigindo representação privativa por advogado.",
      "ACEITAÇÃO DA CONTESTAÇÃO E DOCUMENTOS NA REVELIA: Se a reclamada ausente estiver representada por advogado na audiência, o juiz é obrigado a receber a contestação e os documentos (art. 844, § 5º da CLT).",
      "RECURSO DE REVISTA E SÚMULA 126 DO TST: Não cabe recurso de revista para reexame de fatos e provas; a moldura fática fixada pelo Tribunal Regional do Trabalho é soberana.",
      "PRAZOS RECURSAIS EM DIAS ÚTEIS: Os prazos processuais trabalhistas são contados exclusivamente em dias úteis, com exclusão do dia do começo e inclusão do dia do vencimento (art. 775 da CLT).",
      "PREPARO RECURSAL E ISENÇÕES: Beneficiários da gratuidade de justiça, entidades filantrópicas e empresas em recuperação judicial são isentas do pagamento de depósito recursal (art. 899, § 10 da CLT)."
    ],
    careerNuances: {
      PGFN: "A PGFN atua nos recursos trabalhistas interpostos perante os TRTs e o TST para garantir o cumprimento estrito das normas de isenção de custas e dispensa de depósito recursal conferidas à Fazenda Pública (art. 790-A da CLT e Decreto-Lei 779/1969).",
      AGU: "A Advocacia-Geral da União combate pretensões que tentem burlar a ADI 3.395 do STF para atrair à Justiça do Trabalho discussões atinentes ao regime estatutário federal ou concursos públicos para cargos efetivos da União.",
      PF: "O Ministério Público do Trabalho possui prerrogativa de manifestação obrigatória em dissídios individuais e coletivos que envolvem interesses indisponíveis ou interesse público relevante, além de legitimidade recursal ampla na defesa da ordem jurídica."
    }
  },
  {
    id: "doctrinal-processo-trabalho-liquidacao-execucao-rescisoria",
    discipline: "DIREITO DO TRABALHO E PROCESSUAL DO TRABALHO",
    title: "Liquidação de Sentença, Execução Trabalhista, Execução Fiscal Previdenciária de Ofício e Ação Rescisória no TST",
    themeKeywords: [
      "liquidação de sentença", "execução das contribuições sociais na justiça do trabalho",
      "ação rescisória no processo do trabalho", "execução trabalhista", "súmula vinculante 53",
      "art. 114, viii da cf", "art. 876 da clt", "art. 879 da clt", "ação rescisória",
      "súmula 259 do tst", "súmula 410 do tst", "depósito prévio de rescisória", "correção monetária trabalhista"
    ],
    coreDoctrine: "A liquidação de sentença no processo trabalhista (art. 879 da CLT) constitui fase intermediária destinada a outorgar liquidez e certeza ao comando judicial condenatório genérico, operando-se por cálculos aritméticos (regra geral), arbitramento técnico ou artigos de liquidação. Em homenagem à soberania da res judicata, é expressamente defeso às partes e ao julgador inovar ou modificar a sentença liquidanda ou discutir matéria pertinente à lide originária (art. 879, § 1º). A preclusão na liquidação foi severamente reforçada pela Reforma Trabalhista: homologada a conta, o juiz obrigatoriamente abrirá às partes prazo comum de 8 dias úteis para impugnação fundamentada, com indicação precisa e discriminada dos itens e valores objeto da discórdia, sob pena de preclusão absoluta da faculdade de impugnar (§ 2º).\n\nNo campo da atualização dos débitos judiciais trabalhistas, o Supremo Tribunal Federal, ao julgar em conjunto as Ações Declaratórias de Constitucionalidade nº 58 e 59 e as ADIs 5867 e 6021, declarou a inconstitucionalidade da incidência da Taxa Referencial (TR) prevista no art. 879, § 7º da CLT. A Suprema Corte modulou os efeitos da decisão para determinar a aplicação do IPCA-E na fase pré-judicial (acrescido dos juros legais de mora previstos no caput do art. 39 da Lei 8.177/1991), incidindo a taxa SELIC (prevista no art. 406 do Código Civil) a partir da citação válida ou ajuizamento da ação penal, a qual engloba de forma unitária a correção monetária e os juros moratórios, sendo vedada a cumulação da SELIC com juros moratórios mensais adicionais de 1%.\n\nNa fase executória, a iniciativa do procedimento sofreu alteração basilar no art. 878 da CLT: a execução será promovida pelas partes, admitindo-se a iniciativa ex officio do juiz do trabalho tão somente nos casos em que os litigantes estiverem no exercício pessoal do jus postulandi desacompanhados de procurador habilitado. A garantia integral do juízo (por penhora de dinheiro via SISBAJUD, seguro-garantia judicial ou fiança bancária) é pressuposto inafastável para o conhecimento dos embargos à execução pelo devedor e da impugnação à liquidação pelo credor no prazo preclusivo de 5 dias úteis (art. 884 da CLT).\n\nO epicentro de atuação institucional da Procuradoria-Geral da Fazenda Nacional na jurisdição trabalhista consubstancia-se na execução ex officio das contribuições sociais previdenciárias decorrentes de decisões laborais (artigo 114, inciso VIII, da Constituição Federal c/c art. 876, parágrafo único, da CLT). Após intensos embates doutrinários, o Supremo Tribunal Federal editou a Súmula Vinculante nº 53, pacificando com efeito vinculante absoluto que 'A competência da Justiça do Trabalho prevista no art. 114, VIII, da Constituição Federal alcança a execução de ofício das contribuições previdenciárias relativas ao objeto da condenação constante das sentenças que proferir e acordos por ela homologados, não abrangendo a cobrança de contribuições sobre salários pagos durante o período contratual reconhecido'. Desse modo, se a sentença trabalhista for puramente declaratória de vínculo de emprego, falece competência à Justiça do Trabalho para cobrar as contribuições devidas ao INSS daquele período contratual pretérito, incumbindo à Receita Federal e à PGFN proceder ao lançamento tributário e à respectiva Execução Fiscal perante a Justiça Federal (Lei 6.830/1980). Do mesmo modo, o STF fixou no Tema 325 da Repercussão Geral que a Justiça do Trabalho é incompetente para executar contribuições destinadas a terceiros (Sistema S: SENAI, SESC, SESI, etc.).\n\nPor derradeiro, a Ação Rescisória Trabalhista submete-se ao regramento do art. 836 da CLT c/c os artigos 966 a 975 do CPC. É cabível exclusivamente em face de decisão de mérito transitada em julgado quando caracterizada alguma das hipóteses taxativas do art. 966 do CPC (como manifesta violação de norma jurídica, dolo da parte vencedora, prova falsa e prova nova). A propositura reclama o depósito prévio de 20% do valor da causa (art. 836 da CLT), sendo isenta a Fazenda Pública (art. 968, § 1º do CPC e Súmula 259 do TST) e os beneficiários da gratuidade judicial. O prazo decadencial bienal de 2 anos flui a contar do trânsito em julgado da última decisão proferida no feito (Súmula 100 do TST), competindo originariamente aos TRTs ou à SDI-2 do TST, sendo peremptoriamente vedado o reexame de fatos e provas em sede rescisória, a teor da Súmula 410 do TST.",
    divergentCurrents: {
      firstCurrent: {
        name: "Restrição da Execução Previdenciária de Ofício às Sentenças Condenatórias (STF Súmula Vinculante 53)",
        author: "Plenário do Supremo Tribunal Federal",
        thesis: "A Justiça do Trabalho somente executa ex officio as contribuições incidentes sobre as verbas pecuniárias da condenação que profere ou do acordo que homologa. Sentenças meramente declaratórias de vínculo empregatício não autorizam execução previdenciária direta, devendo a cobrança ser veiculada via execução fiscal na Justiça Federal.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Execução Previdenciária Ampla Abrangendo Todo o Contrato Reconhecido (Tese Superada do TST)",
        author: "Tribunal Superior do Trabalho (Antiga Súmula 368)",
        thesis: "O reconhecimento judicial do liame empregatício geraria a faculdade imediata de apurar e executar as contribuições sociais de todo o interregno laborado perante a própria Vara do Trabalho.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "SÚMULA VINCULANTE 53 DO STF: A Justiça do Trabalho NÃO tem competência para executar contribuições previdenciárias de ofício incidentes sobre salários pagos no período reconhecido em sentença declaratória de vínculo.",
      "INCOMPETÊNCIA PARA CONTRIBUIÇÕES DO SISTEMA S: O STF fixou no Tema 325 que a Justiça do Trabalho é incompetente para executar contribuições parafiscais destinadas a terceiros (SENAI, SESI, etc.).",
      "CORREÇÃO MONETÁRIA PELO IPCA-E E TAXA SELIC (ADCS 58 E 59): É inconstitucional o uso da TR; aplica-se o IPCA-E na fase pré-judicial e a taxa SELIC a partir do ajuizamento, sem incidência concomitante de juros de 1%.",
      "AÇÃO RESCISÓRIA E SÚMULA 410 DO TST: A ação rescisória calcada em violação de literal disposição de lei não permite a reanálise de fatos e provas do feito originário.",
      "INICIATIVA DA EXECUÇÃO TRABALHISTA: O juiz do trabalho só pode promover a execução ex officio se a parte não estiver representada por advogado (art. 878 da CLT)."
    ],
    careerNuances: {
      PGFN: "A atuação da PGFN perante a Justiça do Trabalho é estratégica na recuperação de créditos previdenciários decorrentes de sentenças e acordos, bem como na fiscalização das homologações judiciais que simulam verbas indenizatórias para sonegar a contribuição patronal devida à Seguridade Social.",
      AGU: "A Advocacia-Geral da União atua na liquidação de sentença trabalhista promovendo a execução por cálculos em conformidade estrita com as decisões do STF nas ADCs 58 e 59 e na interposição de Ações Rescisórias perante o TST para desconstituir decisões transitadas em julgado eivadas de violação legal.",
      PF: "O Ministério Público do Trabalho não possui atribuição para cobrança de contribuições previdenciárias arrecadadas pela Fazenda Nacional, focando sua intervenção executiva no cumprimento de obrigações de fazer e não fazer estipuladas em Ações Civis Públicas e Termos de Ajustamento de Conduta."
    }
  },
  // =========================================================================
  // DIREITO CONSTITUCIONAL: MÓDULOS DE ALTA DENSIDADE (PGFN/AGU)
  // =========================================================================
  {
    id: "doctrinal-const-teoria-geral-historia-normas",
    discipline: "DIREITO CONSTITUCIONAL",
    title: "História Constitucional do Brasil, Teoria da Constituição, Poder Constituinte e Eficácia das Normas Constitucionais",
    themeKeywords: [
      "história constitucional do brasil", "constituição", "normas constitucionais",
      "constituição de 1988: teoria geral e direitos fundamentais", "direitos fundamentais",
      "teoria da constituição", "cláusulas pétreas", "poder constituinte", "eficácia das normas",
      "hermenêutica constitucional", "força normativa"
    ],
    coreDoctrine: "A evolução constitucional brasileira reflete as transformações sociopolíticas da nação, iniciando-se com a Carta Imperial outorgada de 1824 (marcada pelo Poder Moderador de Benjamin Constant, unitarismo centralizador, religião católica oficial e voto censitário indireto), sucedida pela Constituição Republicana de 1891 (instituidora da Federação brasileira pelo modelo de desagregação ou segregação, presidencialismo, separação Estado-Igreja e controle difuso de constitucionalidade calcado no modelo norte-americano). A Carta de 1934 introduziu a ordem econômica e social e a Justiça do Trabalho, efêmera diante da Carta outorgada do Estado Novo de 1937 (autoritária e corporativista). A redemocratização produziu a Carta de 1946 (restauradora das liberdades democráticas e do equilíbrio federativo), sucedida pela ordem militar de 1967 e pela Emenda Constitucional nº 1/1969. Finalmente, a Assembleia Nacional Constituinte culminou na promulgação da Constituição Cidadã de 5 de outubro de 1988, refundando o Estado Democrático de Direito assentado na soberania popular, cidadania e dignidade da pessoa humana (art. 1º da CF/88).\n\nNo plano da Teoria da Constituição e do Poder Constituinte, a dogmática distingue o Poder Constituinte Originário (inicial, autônomo, incondicionado e juridicamente ilimitado, responsável por inaugurar uma nova ordem jurídica e romper com o arcabouço pretérito) do Poder Constituinte Derivado. Este último bifurca-se em Derivado Reformador (competente para modificar o texto constitucional por meio de emendas constitucionais, submetendo-se aos limites formais, circunstanciais e materiais imutáveis das cláusulas pétreas insculpidas no art. 60, § 4º da CF) e Derivado Decorrente (atribuído aos Estados-membros para auto-organização por meio de Constituições Estaduais, ex vi do art. 25 da CF e art. 11 do ADCT, e ao Distrito Federal mediante Lei Orgânica). As cláusulas pétreas (forma federativa de Estado, voto direto, secreto, universal e periódico, separação dos Poderes e direitos e garantias individuais) consubstanciam núcleo de intangibilidade material absoluta, vedando não apenas a abolição expressa, mas qualquer proposta tendente a esvaziar sua eficácia protetiva.\n\nQuanto à classificação e aplicabilidade das normas constitucionais, a doutrina brasileira adota com prevalência a consagrada tricotomia formulada por José Afonso da Silva: (i) normas de eficácia plena: aquelas dotadas de aplicabilidade direta, imediata e integral, produzindo todos os seus efeitos desde a promulgação da Constituição, dispensando qualquer complementação legislativa ordinária (ex: a maioria dos remédios constitucionais do art. 5º); (ii) normas de eficácia contida ou prospectiva: aquelas que possuem aplicabilidade direta e imediata, mas não integral, porquanto sujeitas a restrição ou contenção por lei infraconstitucional posterior ou preceitos constitucionais específicos (ex: liberdade profissional do art. 5º, XIII: 'é livre o exercício de qualquer trabalho, ofício ou profissão, atendidas as qualificações profissionais que a lei estabelecer'); e (iii) normas de eficácia limitada: aquelas que ostentam aplicabilidade indireta, mediata e diferida, demandando imperativamente a interposição do legislador infraconstitucional para conferir densidade prática ao preceito, subdividindo-se em normas definidoras de princípios institutivos ou organizativos e normas definidoras de princípios programáticos (como os direitos sociais e as diretrizes de ordem econômica). A omissão legislativa inconstitucional em relação a estas últimas desafia o Mandado de Injunção (art. 5º, LXXI e Lei 13.300/2016) e a Ação Direta de Inconstitucionalidade por Omissão (art. 103, § 2º da CF).\n\nNo campo da Hermenêutica Constitucional, superou-se o positivismo exegético mediante o pós-positivismo axiológico e os métodos principiológicos de interpretação. Destacam-se o princípio da unidade da Constituição (o texto constitucional deve ser interpretado harmonicamente como um sistema orgânico, inexistindo hierarquia formal entre normas originárias), o princípio do efeito integrador (priorização de soluções que fortaleçam a integração política e social e a estabilidade federativa), o princípio da máxima efetividade ou da eficiência social (conferir à norma constitucional a mais ampla eficácia prática possível, mormente aos direitos fundamentais), o princípio da concordância prática ou harmonização (ponderação de bens constitucionais em aparente colisão para evitar o sacrifício total de um em favor de outro), o princípio da força normativa da Constituição (formulação de Konrad Hesse que prega a vontade de constituição - Wille zur Verfassung - como vetor de prevalência das normas constitucionais perante a realidade fática transitória) e o princípio da interpretação conforme a Constituição (técnica de controle pela qual o tribunal preserva a validade da norma infraconstitucional atribuindo-lhe sentido hermenêutico compatível com a Carta Magna).",
    divergentCurrents: {
      firstCurrent: {
        name: "Inexistência de Hierarquia entre Normas Constitucionais Originárias",
        author: "Supremo Tribunal Federal (Plenário - ADI 815/DF)",
        thesis: "Não existe hierarquia jurídica entre normas constitucionais originárias da Carta de 1988, sendo inadmissível o controle de constitucionalidade de preceito constitucional originário em face de outro dispositivo da mesma Constituição, rechaçando a tese alemã de normas constitucionais inconstitucionais de Otto Bachof.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese das Normas Constitucionais Inconstitucionais (Otto Bachof)",
        author: "Doutrina Alemã e Teoria Constitucional Estrangeira",
        thesis: "Normas da Constituição originária que colidissem frontalmente com preceitos supralegais de direito natural ou princípios basilares de justiça material poderiam ser declaradas inválidas pelo tribunal constitucional.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "DIREITOS INDIVIDUAIS E CLÁUSULA PÉTREA (ART. 60, § 4º, IV): A jurisprudência do STF assentou que as cláusulas pétreas de direitos individuais abrangem direitos e garantias fundamentais espalhados por todo o texto constitucional (como a anterioridade tributária do art. 150, III), e não exclusivamente os insertos no art. 5º.",
      "MUTAÇÃO CONSTITUCIONAL VERSUS REFORMA: Mutação constitucional é processo informal de alteração do sentido e alcance da norma sem alteração literal de seu texto, decorrente de nova interpretação judicial.",
      "NORMAS DE EFICÁCIA CONTIDA E AUSÊNCIA DE LEI: Na ausência de lei regulamentadora restritiva, a norma de eficácia contida opera efeitos plenos e irrestritos; a lei superveniente serve unicamente para restringir ou limitar o direito.",
      "INAPLICABILIDADE DO DESUSO OU COSTUME CONTRA CONSTITUCIONEM: No constitucionalismo brasileiro, o desuso de um dispositivo constitucional não revoga nem retira a vigência da norma, por força da supremacia formal da Constituição.",
      "PODER CONSTITUINTE DIFUSO: Expressão doutrinária que designa os processos informais de mutação constitucional decorrentes da evolução hermenêutica da sociedade e dos tribunais superiores."
    ],
    careerNuances: {
      PGFN: "A PGFN invoca a teoria da supremacia constitucional e a força normativa dos princípios do Estado Fiscal para defender a higidez das políticas públicas orçamentárias e a estrita constitucionalidade das fontes materiais de financiamento da Seguridade Social.",
      AGU: "A Advocacia-Geral da União fundamenta a defesa dos atos presidenciais e das leis federais na presunção de constitucionalidade, postulando a aplicação da interpretação conforme a Constituição para preservar diplomas normativos federais atacados perante o STF.",
      PF: "A Procuradoria Federal atua na sustentação jurídica da autonomia administrativa e financeira das autarquias e fundações públicas, embasando a legalidade de suas resoluções nos princípios constitucionais da eficiência, proporcionalidade e supremacia do interesse público."
    }
  },
  {
    id: "doctrinal-const-organizacao-estado-competencias-formas",
    discipline: "DIREITO CONSTITUCIONAL",
    title: "Teoria do Estado, Federalismo Brasileiro, Repartição Constitucional de Competências e Intervenção",
    themeKeywords: [
      "formas de estado", "da organização do estado", "organização do estado", "federalismo",
      "repartição de competências", "competência privativa", "competência concorrente",
      "competência comum", "intervenção federal", "autonomia dos entes", "princípio da simetria"
    ],
    coreDoctrine: "A Federação brasileira qualifica-se como federalismo cooperativo, de terceiro grau (englobando União, Estados, Distrito Federal e Municípios, todos entes federados autônomos nos moldes do art. 18 da CF/88) e originado por movimento centrífugo ou de segregação (descentralização a partir de um Estado unitário imperial). A autonomia dos entes federativos estrutura-se no quadrilátero de capacidades constitucionais: auto-organização (edição de constituições estaduais e leis orgânicas municipais), autogoverno (eleição direta de seus próprios mandatários executivos e legislativos), autoadministração (gestão dos serviços públicos locais) e autolegislação/competência tributária (instituição de tributos próprios e gestão orçamentária autônoma).\n\nO núcleo da dinâmica federativa repousa sobre a técnica da repartição constitucional de competências, pautada pelo princípio da predominância do interesse: matérias de interesse geral e nacional afetam-se à União; matérias de interesse regional pertencem aos Estados; e matérias de interesse predominantemente local competem aos Municípios (art. 30 da CF). O ordenamento constitucional brasileiro distribui competências materiais (administrativas) e legislativas (normativas):\n(i) Competência material exclusiva da União (art. 21 da CF): elenco indelegável de atribuições de soberania internacional, emissão de moeda, defesa nacional e fiscalização financeira;\n(ii) Competência material comum ou cumulativa de todos os entes (art. 23 da CF): dever conjunto e solidário de tutela da saúde, proteção ao meio ambiente, preservação de bens culturais e combate à pobreza, admitindo que leis complementares federais fixem normas de cooperação federativa (como a LC 140/2011 na área ambiental);\n(iii) Competência legislativa privativa da União (art. 22 da CF): abrange os ramos basilares do Direito (civil, comercial, penal, processual, eleitoral, agrário, trabalho e trânsito), admitindo delegação estrita a Estados-membros mediante Lei Complementar federal para legislar sobre questões específicas (art. 22, parágrafo único);\n(iv) Competência legislativa concorrente entre União, Estados e DF (art. 24 da CF): circunscrita às áreas de direito tributário, financeiro, penitenciário, econômico e urbanístico, além de orçamento e meio ambiente. Na competência concorrente, a União limita-se a estabelecer normas gerais (§ 1º); inexistindo norma geral federal, os Estados exercem competência legislativa plena (§ 3º); e a superveniência de lei federal sobre normas gerais não revoga a lei estadual anterior, mas apenas suspende a eficácia dos dispositivos estaduais no que lhe forem estritamente contrários (§ 4º);\n(v) Competência legislativa remanescente ou residual dos Estados (art. 25, § 1º da CF): são reservadas aos Estados todas as competências materiais e legislativas que não lhes sejam vedadas implícita ou explicitamente pela Carta Magna;\n(vi) Competência dos Municípios (art. 30 da CF): legislar sobre assuntos de interesse local (inciso I) e suplementar a legislação federal e estadual no que couber (inciso II).\n\nComo mecanismo extraordinário de salvaguarda da higidez do pacto federativo, a intervenção federal (arts. 34 a 36 da CF) constitui ato de supressão temporária e episódica da autonomia política do ente federado em hipóteses taxativas e de interpretação estrita (defesa da integridade nacional, repulsa à invasão estrangeira, garantia do livre exercício dos Poderes, reorganização das finanças públicas ou execução de ordem judicial). Destaca-se a intervenção para assegurar a observância dos princípios constitucionais sensíveis (art. 34, VII: forma republicana, sistema representativo e democrático, direitos da pessoa humana, autonomia municipal e prestação de contas), deflagrada privativamente mediante Representação Interventiva ajuizada pelo Procurador-Geral da República perante o Plenário do Supremo Tribunal Federal (art. 36, III da CF).",
    divergentCurrents: {
      firstCurrent: {
        name: "Competência Suplementar Municipal Condicionada à Inexistência de Conflito com Normas Gerais",
        author: "Supremo Tribunal Federal (Súmula Vinculante 38 e ADPF 672)",
        thesis: "O Município detém legitimidade constitucional para legislar sobre matéria de saúde e meio ambiente suplementando normas estaduais e federais em prol do interesse local, não podendo contudo flexibilizar ou esvaziar a proteção fixada pelas diretrizes nacionais da União.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Incompetência Absoluta dos Municípios para Regulação de Atividades Econômicas",
        author: "Corrente Centralizadora Tradicional",
        thesis: "A regulação de comércio, funcionamento de estabelecimentos bancários e vigilância sanitária seria competência exclusiva estadual ou federal, vedada qualquer interferência legislativa do Município.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "SUSPENSÃO DA EFICÁCIA VERSUS REVOGAÇÃO (ART. 24, § 4º DA CF): A superveniência de lei federal sobre normas gerais SUSPENDE A EFICÁCIA da lei estadual contrária, não ocorrendo revogação formal; caso a norma federal seja revogada no futuro, a lei estadual volta a produzir efeitos (repristinação de efeitos).",
      "LEI COMPLEMENTAR E DELEGAÇÃO DE COMPETÊNCIA PRIVATIVA: A delegação da competência privativa da União (art. 22, parágrafo único) exige obrigatoriamente Lei Complementar federal e deve versar sobre questões específicas, sendo inconstitucional delegar a totalidade de um ramo jurídico.",
      "SÚMULA VINCULANTE 38 DO STF E HORÁRIO BANCÁRIO: Compete ao Município fixar o horário de funcionamento de estabelecimentos comerciais, mas NÃO o horário de funcionamento das agências bancárias (que é competência federal da União).",
      "PRINCÍPIO DA SIMETRIA CONSTITUCIONAL: Os Estados e Municípios estão compelidos a reproduzir em suas Constituições e Leis Orgânicas os princípios estruturantes do processo legislativo e da separação de poderes da CF/88.",
      "INTERVENÇÃO FEDERAL E PRINCÍPIOS SENSÍVEIS: A intervenção da União nos Estados por violação a princípio constitucional sensível reclama representação privativa do PGR e julgamento de procedência pelo STF."
    ],
    careerNuances: {
      PGFN: "A PGFN atua com excelência técnica na defesa da higidez da legislação tributária e financeira federal perante alegações de usurpação de competência por legislações estaduais e distritais no âmbito da competência concorrente do art. 24 da CF.",
      AGU: "A Advocacia-Geral da União é a defensora por excelência do pacto federativo e da atuação regulatória das agências federais, ajuizando ADIs perante o STF contra leis estaduais que invadem a competência legislativa privativa da União (art. 22 da CF).",
      PF: "A Procuradoria Federal resguarda as competências fiscalizatórias exercidas em âmbito nacional pelas autarquias reguladoras federais (ANATEL, ANVISA, ANEEL, ANP), repelindo normas locais que obstaculizam a execução dos serviços públicos outorgados pela União."
    }
  },
  {
    id: "doctrinal-const-controle-constitucionalidade-stf",
    discipline: "DIREITO CONSTITUCIONAL",
    title: "Controle de Constitucionalidade: Sistemas Difuso e Concentrado, Ações Constitucionais e Abstrativização",
    themeKeywords: [
      "controle de constitucionalidade", "adi", "adc", "adpf", "ado", "reserva de plenário",
      "súmula vinculante 10", "efeito vinculante", "modulação temporal", "controle difuso",
      "controle concentrado", "abstrativização do controle difuso", "bloco de constitucionalidade"
    ],
    coreDoctrine: "O sistema brasileiro de controle de constitucionalidade qualifica-se dogmaticamente como híbrido ou jurisdicional misto, congregando de forma harmônica o modelo difuso (ou incidental, herdado do direito norte-americano a partir do leading case Marbury v. Madison de 1803) e o modelo concentrado (ou por via de ação abstrata, concebido pela matriz kelseniana austríaca de 1920).\n\nNo controle difuso, qualquer juiz ou tribunal detém competência para declarar incidentalmente a inconstitucionalidade de lei ou ato normativo em face do caso concreto submetido a julgamento. Nos tribunais, impõe-se a observância estrita da cláusula de reserva de plenário consagrada no artigo 97 da Constituição Federal: somente pelo voto da maioria absoluta dos membros do tribunal ou de seu órgão especial pode ser declarada a inconstitucionalidade de lei ou ato normativo do Poder Público. A inobservância desse comando deflagra nulidade absoluta da decisão judicial, consoante a Súmula Vinculante nº 10 do STF ('Viola a cláusula de reserva de plenário cominada no art. 97 da CF a decisão de órgão fracionário de tribunal que, embora não declare expressamente a inconstitucionalidade de lei ou ato normativo do Poder Público, afasta sua incidência, no todo ou em parte'). Dispensam a remessa ao plenário: a existência de decisão prévia do próprio plenário do tribunal ou de julgamento de mérito proferido pelo STF. No tocante aos efeitos, o controle difuso opera tradicionalmente eficácia inter partes e ex tunc; contudo, a doutrina e a jurisprudência consagraram o fenômeno da abstrativização do controle difuso, pelo qual as decisões definitivas de mérito do Plenário do STF em recurso extraordinário com repercussão geral produzem eficácia erga omnes e vinculante prospectiva, mitigando o papel formal de suspensão pelo Senado Federal preconizado no art. 52, X da CF/88.\n\nNo controle abstrato concentrado, a competência originária e exclusiva para julgar as ações do art. 102, I, 'a' e § 1º da CF pertence ao Supremo Tribunal Federal. O rol taxativo de legitimados ativos é traçado pelo artigo 103 da Constituição, dividindo-se entre legitimados universais (que não necessitam comprovar pertinência temática: Presidente da República, Mesas da Câmara e do Senado, PGR, Conselho Federal da OAB e partidos políticos com representação no Congresso) e legitimados especiais (que demandam demonstração inequívoca de pertinência temática entre o ato impugnado e seus objetivos institucionais: Mesas das Assembleias Legislativas/CLDF, Governadores de Estado/DF e Confederações Sindicais ou entidades de classe de âmbito nacional).\n\nAs ações concentradas compreendem: (i) ADI (Ação Direta de Inconstitucionalidade): combate lei ou ato normativo federal ou estadual pós-constitucional que viole a CF/88; (ii) ADC (Ação Declaratória de Constitucionalidade): restrita a leis ou atos normativos federais pós-constitucionais, exigindo demonstração de relevante controvérsia judicial prévia; (iii) ADPF (Arguição de Descumprimento de Preceito Fundamental): ação de cognição subsidiária (art. 4º, § 1º da Lei 9.882/1999) cabível contra atos do Poder Público federais, estaduais ou municipais, inclusive direito pré-constitucional e atos materiais desprovidos de abstração normativa; e (iv) ADO (Ação Direta de Inconstitucionalidade por Omissão): voltada a sanar inércia de órgãos legislativos ou administrativos. As decisões de mérito proferidas em controle concentrado ostentam eficácia erga omnes, efeito vinculante em relação a todo o Poder Judiciário e Administração Pública, e operam efeitos ex tunc, admitindo-se a modulação temporal dos efeitos (art. 27 da Lei 9.868/1999) por decisão qualificada de dois terços dos membros do STF em razão de segurança jurídica ou excepcional interesse social.",
    divergentCurrents: {
      firstCurrent: {
        name: "Abstrativização e Efeito Vinculante das Decisões do STF no Controle Difuso",
        author: "Supremo Tribunal Federal (Reclamação 4.335 e Tema 733)",
        thesis: "A atuação do Plenário do STF no controle difuso qualifica-se como verdadeira fixação de tese de abrangência nacional, atuando o Senado Federal (art. 52, X da CF) não mais como outorgante exclusivo da eficácia erga omnes, mas como órgão de publicidade integrativa institucional.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Eficácia Estritamente Inter Partes Subordinada à Resolução do Senado",
        author: "Doutrina Constitucional Tradicional",
        thesis: "A decisão proferida em controle difuso jamais ultrapassa a esfera dos litigantes originários sem a formal edição de resolução do Senado Federal que suspenda a execução da lei declarada inconstitucional.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "SÚMULA VINCULANTE 10 E AFASTAMENTO POR INTERPRETAÇÃO: A violação da reserva de plenário ocorre tanto na declaração expressa quanto no afastamento disfarçado da norma por critérios de interpretação conforme ou proporcionalidade.",
      "DIREITO PRÉ-CONSTITUCIONAL E CONTROLE DE CONSTITUCIONALIDADE: Lei anterior à CF/88 incompatível com ela não é inconstitucional, mas simplesmente NÃO RECEPCIONADA (revogada); não cabe ADI, sendo impugnável perante o STF unicamente via ADPF.",
      "INEXISTÊNCIA DE ADI CONTRA LEI MUNICIPAL PERANTE O STF: Não cabe ADI de lei municipal perante o Supremo Tribunal Federal em face da Constituição Federal; contra lei municipal perante o STF cabe unicamente ADPF.",
      "PERTINÊNCIA TEMÁTICA DOS LEGITIMADOS ESPECIAIS: Governadores e confederações sindicais necessitam demonstrar ligação direta e imediata entre o ato impugnado e suas atribuições funcionais ou interesses da categoria.",
      "QUÓRUM DE MODULAÇÃO DE EFEITOS: A modulação temporal de efeitos em controle de constitucionalidade exige o quórum qualificado e rigoroso de dois terços dos membros do STF (8 ministros)."
    ],
    careerNuances: {
      PGFN: "A Procuradoria da Fazenda Nacional desempenha papel central nas ADIs tributárias perante o STF, sustentando a constitucionalidade de regras fiscais e pleiteando a modulação temporal de efeitos para obstar impactos fiscais catastróficos ao Erário da União.",
      AGU: "O Advogado-Geral da União atua com esteio no art. 103, § 3º da CF/88, funcionando como curador da presunção de constitucionalidade das leis federais, além de exercer o patrocínio das ações propostas pelo Presidente da República perante a Suprema Corte.",
      PF: "A Procuradoria Federal intervém nos processos concentrados e difusos que impactam a higidez dos atos normativos regulatórios de autarquias federais (como o CADE, ANATEL e Banco Central), fornecendo subsídios probatórios de ordem fática e setorial."
    }
  },
  {
    id: "doctrinal-const-funcoes-essenciais-agu-pgfn-tributacao-ordem-social",
    discipline: "DIREITO CONSTITUCIONAL",
    title: "Funções Essenciais à Justiça (AGU e PGFN), Sistema Tributário Nacional e Ordem Social na CF/88",
    themeKeywords: [
      "advocacia-geral da união", "procuradoria-geral da fazenda nacional", "agu", "pgfn",
      "advocacia pública", "funções essenciais à justiça", "da tributação e do orçamento",
      "da ordem social", "sistema tributário nacional", "seguridade social", "orçamento público",
      "princípios tributários constitucionais", "art. 131 da cf", "art. 145 da cf"
    ],
    coreDoctrine: "As Funções Essenciais à Justiça (Título IV, Capítulo IV da CF/88) consubstanciam o complexo orgânico e instrumental indispensável à preservação do Estado Democrático de Direito e à concretização da ordem jurídica, abarcando o Ministério Público, a Advocacia Pública, a Defensoria Pública e a Advocacia Privada. No âmbito federal, a Advocacia Pública é corporificada com status de instituição constitucional indelegável pela Advocacia-Geral da União (artigo 131 da Carta Magna), à qual compete a representação judicial e extrajudicial da União, bem como as atividades privativas de consultoria e assessoramento jurídico do Poder Executivo federal, regendo-se pela Lei Complementar nº 73/1993.\n\nO artigo 131, § 3º da Constituição Federal estabelece regra de competência funcional expressa e indeclinável no tocante à cobrança fiscal: 'Na execução da dívida ativa de natureza tributária, a representação da União cabe à Procuradoria-Geral da Fazenda Nacional, observado o disposto em lei'. A PGFN é órgão de direção superior da AGU subordinado administrativamente ao Ministério da Fazenda, detendo atribuições constitucionais e legais privativas no controle da higidez e liquidez da Dívida Ativa da União, na representação judicial em causas tributárias federais perante todos os tribunais e na consultoria jurídica fazendária. Sob o prisma das prerrogativas funcionais, o Supremo Tribunal Federal assentou na ADI 6.421 que os pareceres emitidos por membros da Advocacia Pública em processos administrativos e de licitação possuem natureza opinativa e técnica, não gerando responsabilidade civil ou criminal do consultor público salvo comprovação cabal de dolo direto ou manifesto concerto ilícito.\n\nNo campo da Tributação e do Orçamento (arts. 145 a 169 da CF/88), a Constituição disciplina o Sistema Tributário Nacional alicerçado na tipologia pentapartida de tributos: impostos, taxas, contribuições de melhoria, empréstimos compulsórios (art. 148) e contribuições especiais (art. 149 e 195). O poder de tributar submete-se às limitações constitucionais taxativas que compõem o estatuto do contribuinte (arts. 150 a 152 da CF), destacando-se o princípio da legalidade estrita (art. 150, I), a isonomia fiscal (inciso II), a irretroatividade tributária (inciso III, 'a'), a anterioridade de exercício ('b') e a anterioridade nonagesimal ('c'), além da vedação ao efeito de confisco (inciso IV), da imunidade recíproca dos entes federados (art. 150, VI, 'a') e das imunidades religiosas, partidárias, educacionais e de imprensa. No plano orçamentário, a Carta estabelece o tripé formado pelo Plano Plurianual (PPA), pela Lei de Diretrizes Orçamentárias (LDO) e pela Lei Orçamentária Anual (LOA), submetidos aos princípios fundamentais da legalidade, universalidade, unidade, exclusividade orçamentária e vedação de vinculação de receita de impostos a órgão ou fundo (art. 167, IV).\n\nFinalmente, o Título VIII da Carta Magna estrutura a Ordem Social, cujo primado basilar é o trabalho e cujo objetivo primordial é o bem-estar e a justiça sociais (art. 193). O coração protetivo reside na Seguridade Social (arts. 194 a 204), concebida como rede protetiva universal integrada de ações dos Poderes Públicos e da sociedade nas áreas da Saúde (direito de todos e dever do Estado, universal e igualitário, gerido pelo SUS), da Previdência Social (de caráter contributivo e de filiação obrigatória, preservado o equilíbrio financeiro e atuarial) e da Assistência Social (prestada a quem dela necessitar, independentemente de contribuição à seguridade, destacando-se o Benefício de Prestação Continuada - BPC previsto no art. 203, V da CF e na Lei 8.742/1993). Na preservação ambiental (art. 225), a Carta erige o meio ambiente ecologicamente equilibrado a bem de uso comum do povo e direito intergeracional difuso, consagrando a responsabilidade tríplice (administrativa, civil e penal) para pessoas físicas e jurídicas causadoras de degradação ambiental.",
    divergentCurrents: {
      firstCurrent: {
        name: "Prerrogativa Constitucional da PGFN na Cobrança da Dívida Ativa Tributária",
        author: "Supremo Tribunal Federal e Texto Expresso do Art. 131, § 3º da CF/88",
        thesis: "A representação da União na execução de créditos tributários e na inscrição da Dívida Ativa tributária compete com exclusividade e reserva institucional à Procuradoria-Geral da Fazenda Nacional, não podendo ser transferida ou exercida por outros órgãos.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Faculdade de Delegação Genérica de Cobrança Fiscal a Outras Carreiras",
        author: "Tese Minoritária Superada",
        thesis: "O Poder Executivo poderia discricionariamente transferir as atribuições de cobrança judicial fiscal para qualquer órgão da administração pública federal.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "REPRESENTAÇÃO TRIBUTÁRIA VERSUS NÃO TRIBUTÁRIA DA UNIÃO: A representação judicial da União na dívida ativa tributária cabe à PGFN (art. 131, § 3º); na dívida ativa não tributária (multas eleitorais, multas do TCU e danos patrimoniais), a representação compete à Procuradoria-Geral da União (PGU/AGU).",
      "PARECERES JURÍDICOS DA AGU E RESPONSABILIZAÇÃO: O advogado público que emite parecer em licitação ou procedimento administrativo não pode ser responsabilizado civil ou regressivamente sem prova incontroversa de dolo ou erro grosseiro e inescusável (ADI 6421 do STF).",
      "ANTERIORIDADE NONAGESIMAL E TRIBUTOS ISENTOS: As contribuições sociais da seguridade social (art. 195, § 6º da CF) submetem-se exclusivamente à anterioridade nonagesimal de 90 dias, não se submetendo à anterioridade anual de exercício.",
      "IMUNIDADE RECÍPROCA E EMPRESAS ESTATAIS: A imunidade recíproca do art. 150, VI, 'a' aplica-se a empresas públicas e sociedades de economia mista que prestem serviços públicos essenciais em regime de monopólio e sem intuito primário de lucro (STF Tema 508), não alcançando estatais exploradoras de atividade econômica em regime concorrencial.",
      "VEDAÇÃO DE VINCULAÇÃO DE RECEITA DE IMPOSTOS: A vedação de vinculação de receita do art. 167, IV da CF atinge exclusivamente IMPOSTOS, não se aplicando às contribuições sociais e taxas."
    ],
    careerNuances: {
      PGFN: "A PGFN é o órgão constitucionalmente encarregado de tutelar a arrecadação federal, ajuizar a execução fiscal da Dívida Ativa tributária e defender o Sistema Tributário Nacional perante o STF, resguardando as bases econômicas da Seguridade Social da União.",
      AGU: "A AGU exerce a representação geral da União e a consultoria do Presidente da República e dos Ministérios, assegurando a compatibilidade de projetos de lei e decretos regulamentares com as balizas constitucionais das ordens econômica e social.",
      PF: "A Procuradoria Federal exerce a representação judicial e a cobrança da Dívida Ativa das autarquias e fundações federais (como IBAMA, ANP e INSS), sustentando a legalidade dos atos de poder de polícia e das penalidades administrativas setoriais."
    }
  },

  // =========================================================================
  // FASE 1.7: MÓDULOS ESPECIALIZADOS DE DIREITO ADMINISTRATIVO
  // =========================================================================

  // 1. PODERES ADMINISTRATIVOS, HIERARQUIA E PODER DE POLÍCIA
  {
    id: "fuc-admin-poderes-hierarquico-disciplinar-policia",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Poderes Administrativos: Poder Hierárquico, Disciplinar e Poder de Polícia",
    themeKeywords: [
      "poderes administrativos", "poder hierárquico", "poder hierarquico", "hierarquia", 
      "poder disciplinar", "poder de polícia", "poder de policia", "ciclo de polícia", 
      "ciclo de policia", "autoexecutoriedade", "coercibilidade", "delegação de polícia", 
      "delegacao de policia", "tema 532", "infrações e sanções administrativas", "infracoes e sancoes"
    ],
    coreDoctrine: `#### 📚 Teoria Geral dos Poderes da Administração Pública

* **Conceito Dogmático e Natureza Jurídica**:
  Os poderes administrativos não constituem privilégios pessoais do administrador público, mas verdadeiros **poderes-deveres ou deveres-poderes instrumentais**, outorgados pela ordem jurídica com a finalidade exclusiva de propiciar o atendimento cabal do interesse público primário. O exercício de qualquer poder administrativo é limitado pela legalidade estrita, pela moralidade e pelos postulados da razoabilidade e proporcionalidade. O ordenamento jurídico repudia o **abuso de poder**, que se manifesta sob duas formas clássicas:
  1. **Excesso de Poder**: O agente atua fora ou além dos limites de sua competência legal originária ou delegada (vício de competência).
  2. **Desvio de Poder (ou Desvio de Finalidade)**: O agente atua dentro da sua competência material, mas direciona o ato a finalidade diversa daquela expressa ou implicitamente determinada pela lei, seja com intuito de favorecimento pessoal, perseguição ou interesse público secundário desautorizado (vício de finalidade).

* **Poder Hierárquico e suas Manifestações**:
  O poder hierárquico consubstancia a prerrogativa conferida à Administração Pública para distribuir funções, escalonar órgãos e agentes, e coordenar internamente a atuação estatal. Manifesta-se nas prerrogativas de:
  * **Dar Ordens**: Dever de obediência do subordinado, ressalvada a hipótese de ordens manifestamente ilegais (art. 116, IV da Lei 8.112/1990);
  * **Fiscalizar**: Verificação permanente da legalidade e conveniência dos atos praticados pelos subordinados;
  * **Delegar e Avocar Atribuições**: A delegação consiste na transferência temporária de parte da competência a órgãos ou agentes subordinados ou do mesmo nível hierárquico, inexistindo reserva legal em sentido contrário (art. 12 da Lei 9.784/1999). É expressamente vedada a delegação de: edição de atos normativos, decisão de recursos administrativos e matérias de competência exclusiva (art. 13 da Lei 9.784/1999). A avocação é medida excepcional, temporária e motivada de competência de órgão subordinado.
  * Inexiste hierarquia funcional entre o Poder Executivo e o Poder Judiciário, entre a Administração Direta e as pessoas jurídicas da Administração Indireta (nestas vige tutela ou controle finalístico), nem tampouco entre a Administração e os administrados em geral.

* **Poder Disciplinar**:
  Poder outorgado à Administração para apurar infrações e aplicar penalidades funcionais a servidores públicos e a particulares submetidos a **vínculo jurídico específico** com o Estado (ex.: concessionários de serviços públicos, estudantes de escolas públicas, fornecedores contratados sob a Lei 14.133/2021). Difere ontologicamente do poder de polícia, cujo destinatário é o particular genérico sem vínculo jurídico individualizado com a Administração.

* **Poder de Polícia: Fundamentos, Atributos e Ciclo de Polícia**:
  O poder de polícia é a faculdade conferida à Administração Pública para condicionar e restringir o uso, gozo e disposição da liberdade individual e da propriedade privada em benefício do bem-estar coletivo (art. 78 do CTN).
  * **Atributos Clássicos**:
    * **Discricionariedade**: Liberdade na escolha da oportunidade, conveniência e meio de atuação, ressalvados os atos de polícia vinculados (ex.: concessão de licença para construir);
    * **Autoexecutoriedade**: Prerrogativa de executar direta e imediatamente as decisões administrativas coativas sem necessidade de autorização prévia judicial (presente quando expressamente autorizada em lei ou em situações de urgência inadiável);
    * **Coercibilidade**: Imposição imperativa das determinações administrativas, inclusive com emprego de força pública moderada em caso de resistência.
  * **Ciclo de Polícia**: Estrutura-se em quatro fases dogmáticas:
    1. **Ordem de Polícia**: Fixação da regra legal ou regulamentar abstrata de polícia;
    2. **Consentimento de Polícia**: Anuência prévia estatal para o exercício de atividade privada condicionada (licença ou autorização);
    3. **Fiscalização de Polícia**: Verificação do cumprimento das ordens e condições estatais;
    4. **Sanção de Polícia**: Aplicação da medida repressiva ante a constatação da infração administrativa.
  * **Delegação do Poder de Polícia a Pessoas Jurídicas de Direito Privado (STF Tema 532/RG e RE 633.782)**:
    É constitucional a delegação das fases de **consentimento, fiscalização e sanção de polícia** a pessoas jurídicas de direito privado integrantes da Administração Pública Indireta (sociedades de economia mista e empresas públicas), desde que prestadoras exclusivas de serviço público em regime não concorrencial e com capital social majoritariamente estatal.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Delegação Ampla das Fases Executórias e Sancionatórias de Polícia a Estatais (Tese Vinculante do STF)",
        author: "STF Tema 532 / RE 633.782 / Min. Roberto Barroso",
        thesis: "Pessoas jurídicas de direito privado da Administração Indireta prestadoras de serviço público em regime não concorrencial podem exercer fiscalização e aplicar sanções de trânsito e posturas administrativas, reservando-se à pessoa política apenas a fase de ordem de polícia.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Indelegabilidade Absoluta do Poder Sancionatório de Polícia a Entes Privados",
        author: "Hely Lopes Meirelles / Jurisprudência Tradicional do STJ",
        thesis: "A aplicação de sanções administrativas com imperatividade e poder de império decorre da soberania estatal, sendo prerrogativa exclusiva e indelegável de pessoas jurídicas de direito público.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a fase de 'ordem de polícia' pode ser delegada a empresas estatais de direito privado (FALSO: o STF manteve a competência normativa de ordem de polícia privativa do ente político estatal).",
      "Confundir delegação com avocação de competência: a edição de atos normativos e a decisão de recursos administrativos nunca podem ser delegadas por expressa vedação do art. 13 da Lei 9.784/1999.",
      "Afirmar que a sanção aplicada no exercício do poder disciplinar exige prévia autorização judicial (FALSO: é autoexecutória pela autoridade administrativa competente no processo regular)."
    ],
    careerNuances: {
      AGU: "Sustente a validade das multas aplicadas por agências reguladoras federais (ANATEL, ANVISA, ANP) e a legitimidade da atuação da Polícia Rodoviária Federal, refutando alegações de cerceamento de defesa e garantindo a presunção de legitimidade dos autos de infração.",
      PGFN: "Defenda a imediata inscrição em dívida ativa da União de créditos não tributários oriundos de multas de polícia e sanções disciplinares consolidadas administrativamente, com execução fiscal célere.",
      PF: "Atuação destacada na defesa judicial das autarquias e fundações públicas federais fiscalizadoras (IBAMA, ICMBio, INCRA, CVM), assegurando a autoexecutoriedade dos embargos de obras e retenção de bens poluidores.",
      PBC: "Defesa técnica do exercício do poder de polícia do Banco Central do Brasil na supervisão prudencial do Sistema Financeiro Nacional, validação das sanções disciplinares e termo de compromisso nos termos da Lei 13.506/2017."
    }
  },

  // 2. ORGANIZAÇÃO ADMINISTRATIVA, AGÊNCIAS, CONSÓRCIOS E ESTATAIS
  {
    id: "fuc-admin-organizacao-estatais-terceiro-setor",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Organização Administrativa: Descentralização, Autarquias, Agências, Consórcios, Estatais e Terceiro Setor",
    themeKeywords: [
      "centralização e descentralização", "centralizacao e descentralizacao", "desconcentração", 
      "desconcentracao", "agências reguladoras", "agencias reguladoras", "consórcios públicos", 
      "consorcios publicos", "empresas estatais", "estatuto jurídico das empresas estatais", 
      "terceiro setor", "organizações sociais", "organização da administração pública", "lei 13.303", "lei 11.107"
    ],
    coreDoctrine: `#### 📚 Organização Administrativa do Estado Brasileiro

* **Morfologia Estrutural: Centralização, Descentralização e Desconcentração**:
  * **Centralização**: A atividade administrativa é exercida diretamente pelo próprio ente federativo (União, Estados, DF e Municípios), por meio dos órgãos e agentes integrantes da sua Administração Direta.
  * **Descentralização**: Ocorre a distribuição de competências entre diferentes pessoas jurídicas. Subdivide-se em:
    * **Descentralização por Outorga (Serviços ou Legal)**: O Estado cria ou autoriza a criação de uma pessoa jurídica da Administração Indireta, transferindo a titularidade e o exercício do serviço (exigência de lei específica, art. 37, XIX da CF).
    * **Descentralização por Delegação (ou Colaboração)**: O Estado transfere unicamente a execução material do serviço a um particular, mantendo a titularidade (concessão, permissão ou autorização de serviços públicos, art. 175 da CF).
  * **Desconcentração**: Distribuição interna de competências dentro de uma mesma pessoa jurídica, criando órgãos desprovidos de personalidade jurídica própria. Critérios: territorial, hierárquico ou por matéria.

* **Autarquias em Regime Especial e Agências Reguladoras (Lei 13.848/2019 e Lei 9.986/2000)**:
  As agências reguladoras são autarquias de regime especial caracterizadas por autonomia financeira, orçamentária e administrativa, bem como mandato fixo de seus dirigentes com estabilidade qualificada (quarentena e perda de mandato restrita a condenação judicial transitada em julgado ou processo disciplinar, art. 9º da Lei 13.848/2019).
  * **Poder Normativo Técnico e Teoria da Deslegalização**: As agências possuem competência normativa infralegal técnica especializada. A lei estabelece os padrões e parâmetros finalísticos (standards), delegando à agência a regulação setorial detalhada, sem que isso configure usurpação legislativa.
  * Não há subordinação hierárquica entre a agência reguladora e o Ministério supervisor, cabendo unicamente controle ministerial finalístico estrito (recurso hierárquico impróprio apenas se houver desvio das finalidades institucionais ou expressa previsão legal).

* **Consórcios Públicos (Lei 11.107/2005 e Decreto 6.017/2007)**:
  Instrumento cooperativo federativo que viabiliza a união de entes federados (União, Estados, DF e Municípios) para realização de objetivos de interesse comum.
  * **Personalidade Jurídica**:
    * **Direito Público**: Integra a Administração Indireta de todos os entes consorciados sob a forma de **associação pública** (natureza jurídica autárquica);
    * **Direito Privado**: Depende de formalização de associação civil, sem fins lucrativos, regida predominantemente pelas normas de direito privado, mas submetida aos controles públicos republicanos.
  * **Regime Diferenciado**: Os consórcios de direito público podem emitir certidões, desapropriar bens e gozam de prazos em dobro para manifestação processual. A União somente participará de consórcios públicos em que também integrem o Estado em cujo território se localize o Município consorciado.

* **Estatuto Jurídico das Empresas Estatais (Lei 13.303/2016 e Art. 173 da CF)**:
  Regulamenta as empresas públicas e sociedades de economia mista, exploradoras de atividade econômica em sentido estrito ou prestadoras de serviços públicos.
  * **Diferenças Fundamentais**:
    * **Empresa Pública**: Capital 100% público; qualquer forma societária admitida em direito (LTDA, S/A); foro na Justiça Federal quando federal (art. 109, I da CF).
    * **Sociedade de Economia Mista**: Capital majoritariamente público com voto; obrigatoriamente constituída sob a forma de Sociedade Anônima (S/A); foro na Justiça Estadual ainda que federal (salvo intervenção da União na lide, Súmulas 517 e 556 do STF).
  * **Governança e Contratações**: A Lei 13.303/2016 instituiu regime licitatório próprio das estatais (arts. 28 e seguintes), com critérios rígidos de integridade, comitê de auditoria e vedações de indicações políticas para diretorias e conselhos de administração (STF, ADI 7331).

* **Terceiro Setor: Organizações Sociais e Parcerias da Sociedade Civil**:
  Entidades privadas sem fins lucrativos que colaboram com o Estado na execução de atividades de interesse coletivo:
  * **Organizações Sociais (OS - Lei 9.637/1998)**: Celebram **Contrato de Gestão** para fomento e absorção de atividades estatais de saúde, cultura, ciência e ensino (STF, ADI 1923: constitucionalidade do modelo sem necessidade de concurso público para contratação de seus empregados celetistas, mas com dever de processo seletivo impessoal e fiscalização do TCU).
  * **Organizações da Sociedade Civil de Interesse Público (OSCIP - Lei 9.790/1999)**: Celebram **Termo de Parceria**.
  * **Marco Regulatório das Organizações da Sociedade Civil (MROSC - Lei 13.019/2014)**: Regula os Termos de Colaboração, Termos de Fomento e Acordos de Cooperação.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Constitucionalidade das Parcerias com Organizações Sociais via Contrato de Gestão",
        author: "STF (ADI 1923/DF) / Min. Ayres Britto e Min. Luiz Fux",
        thesis: "O modelo de fomento público das Organizações Sociais não ofende a CF. As OSs não integram a Administração Pública, aplicando-lhes regulamento próprio de compras e admissão de pessoal sob critérios de impessoalidade e publicidade.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Submissão Obrigatória das OSs ao Estatuto Licitatório e Concurso Público",
        author: "Doutrina Crítica Tradicional / Procuradorias de Contas",
        thesis: "A transferência massiva de recursos e bens públicos a entidades privadas exigiria observância irrestrita da regra do concurso público e das licitações formais da Administração.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que as sociedades de economia mista federais respondem perante a Justiça Federal (FALSO: a regra do art. 109, I da CF abrange apenas autarquias e empresas públicas federais; SEM federal litiga na Justiça Estadual).",
      "Confundir associação pública com entidade privada: consórcio público com personalidade de direito público é associação pública com natureza jurídica autárquica integrante da Administração Indireta.",
      "Afirmar que a criação de subsidiárias de empresas estatais depende de lei específica individualizada (FALSO: o STF assentou que basta autorização legislativa genérica na lei criadora da empresa-matriz)."
    ],
    careerNuances: {
      AGU: "Defesa dos atos de regulação técnica das agências reguladoras federais contra interferências judiciais descabidas, preservando a discricionariedade técnica e a matriz de governança da Lei 13.848/2019.",
      PGFN: "Fiscalização societária das participações acionárias da União em empresas estatais, acompanhamento dos dividendos e juros sobre capital próprio devidos ao Tesouro Nacional e execução de dívidas ativas.",
      PF: "Representação judicial e consultiva das autarquias e fundações públicas federais reguladoras e de fiscalização, assegurando a autonomia decisória e a integridade de seus orçamentos.",
      PBC: "Garantia da autonomia institucional e governança do Banco Central do Brasil em harmonia com as diretrizes da Lei Complementar 179/2021."
    }
  },

  // 3. SERVIÇOS PÚBLICOS, CONCESSÕES, PERMISSÕES E PARCERIAS PÚBLICO-PRIVADAS
  {
    id: "fuc-admin-servicos-publicos-concessoes-ppp",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Serviços Públicos: Regime Jurídico, Concessões, Permissões e Parcerias Público-Privadas (PPPs)",
    themeKeywords: [
      "serviços públicos", "servicos publicos", "concessão de serviço público", "concessao de servico publico", 
      "permissão de serviço público", "permissao de servico publico", "parcerias público-privadas", 
      "parcerias publico privadas", "ppp", "lei 8.987", "lei 11.079", "encampação", "encampacao", 
      "caducidade", "equilíbrio econômico-financeiro", "equilibrio economico financeiro", "tarifa"
    ],
    coreDoctrine: `#### 📚 Teoria Geral dos Serviços Públicos e Parcerias com a Iniciativa Privada

* **Conceito, Princípios e Titularidade (Art. 175 da CF/88)**:
  Incumbe ao Poder Público, na forma da lei, diretamente ou sob regime de concessão ou permissão, sempre através de licitação, a prestação de serviços públicos. A titularidade dos serviços públicos é privativa do Estado, sendo indelegável; o que se transfere na concessão e permissão é unicamente a execução material do serviço.
  * **Princípios Fundamentais do Serviço Adequado (Art. 6º da Lei 8.987/1995)**:
    * **Continuidade**: Vedação à interrupção arbitrária do serviço essencial. Exceções legais (aviso prévio): razões de ordem técnica ou de segurança, e inadimplemento do usuário (STJ: lícito o corte por inadimplemento após notificação prévia, vedado corte de serviços essenciais a hospitais e unidades de saúde);
    * **Mutabilidade do Regime Jurídico**: Prerrogativa estatal de alterar unilateralmente as condições de execução para atender às mutações do interesse público;
    * **Modicidade Tarifária**: As tarifas devem ser acessíveis a toda a população;
    * **Atualidade**: Compreende a modernidade das técnicas, equipamentos e instalações.

* **Regime de Concessões e Permissões (Lei 8.987/1995)**:
  * **Concessão Comum de Serviço Público**: Contrato administrativo bilateral celebrado com pessoa jurídica ou consórcio de empresas que demonstre capacidade de investimento, mediante licitação na modalidade **concorrência** ou **diálogo competitivo**, por sua conta e risco, remunerada preponderantemente por tarifas cobradas dos usuários.
  * **Permissão de Serviço Público**: Delegação formalizada mediante contrato de adesão, a título precário, após licitação prévia, cabível a pessoas físicas ou jurídicas.

* **Equilíbrio Econômico-Financeiro do Contrato de Concessão**:
  Garantia constitucional (art. 37, XXI da CF) e infraconstitucional (art. 9º, § 4º da Lei 8.987/1995) de manutenção da equação originária entre os encargos do concessionário e a justa remuneração tarifária estabelecida na proposta vencedora. Eventos de *fato do príncipe*, alterações unilaterais pelo concedente ou áleas extraordinárias ensejam reequilíbrio obrigatório.

* **Formas de Extinção da Concessão de Serviços Públicos (Arts. 35 a 39 da Lei 8.987/1995)**:
  1. **Advento do Termo Contratual**: Fim do prazo pactuado, com reversão dos bens essenciais ao Poder Público concedente;
  2. **Encampação (ou Resgate)**: Retomada antecipada do serviço pelo poder concedente por **motivo de interesse público**, mediante lei autorizativa específica e **prévia indenização em dinheiro**;
  3. **Caducidade**: Rescisão unilateral decorrente de **inadimplemento contratual culposo da concessionária**, decretada por ato motivado após regular processo administrativo (sem necessidade de prévia lei autorizativa);
  4. **Rescisão Judicial**: Promovida pela concessionária em face do Poder Concedente em caso de descumprimento de cláusulas contratuais pelo Estado (a concessionária não pode suspender os serviços unilateralmente antes do trânsito em julgado da decisão judicial);
  5. **Anulação**: Declaração de nulidade do contrato ou do procedimento licitatório por ilegalidade congênita;
  6. **Falência ou Extinção da Empresa Concessionária**.

* **Parcerias Público-Privadas (PPPs - Lei 11.079/2004)**:
  Contratos de concessão especial firmados entre a Administração Pública e entes privados:
  * **Modalidades de PPP**:
    1. **Concessão Patrocinada**: Concessão de serviços públicos ou de obras públicas quando envolver, adicionalmente à tarifa cobrada dos usuários, contraprestação pecuniária do parceiro público ao parceiro privado.
    2. **Concessão Administrativa**: Contrato de prestação de serviços de que a Administração Pública seja a usuária direta ou indireta, ainda que envolva execução de obra ou fornecimento e instalação de bens (inexiste tarifa cobrada da coletividade; o poder público remunera integralmente o particular).
  * **Vedações Estritas da Lei 11.079/2004 (Art. 2º, § 4º)**:
    * Contratos com valor inferior a **R$ 10.000.000,00 (dez milhões de reais)**;
    * Período de vigência inferior a **5 anos** ou superior a **35 anos** (já computada eventual prorrogação);
    * Contratos cujo objeto único seja o mero fornecimento de mão de obra, fornecimento e instalação de equipamentos ou execução de obra pública sem operação de longo prazo.
  * **Garantias e Fundo Garantidor (FGP)**: As obrigações pecuniárias contraídas pela Administração Pública em PPPs podem ser garantidas pelo Fundo Garantidor de Parcerias Público-Privadas (FGP), garantias fiduciárias, vinculação de receitas orçamentárias ou fundos especiais.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Possibilidade de Suspensão de Serviço Público por Inadimplemento com Aviso Prévio",
        author: "STJ (Tema 698 dos Repetitivos) / Min. Mauro Campbell",
        thesis: "É legítimo o corte do fornecimento de serviço público essencial por inadimplemento do usuário após prévio aviso formal, ressalvadas unidades públicas que prestem serviços essenciais à vida (hospitais e pronto-socorro).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Inadmissibilidade Absoluta de Suspensão com Base no Princípio da Continuidade",
        author: "Doutrina Consumerista Radical / Código de Defesa do Consumidor",
        thesis: "Sustenta que o art. 22 do CDC impõe o dever de continuidade ininterrupta, devendo a concessionária cobrar as faturas vencidas exclusivamente pelas vias judiciais ordinárias de execução.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Confundir Encampação com Caducidade: Encampação fundamenta-se em interesse público e exige lei autorizativa específica e prévia indenização; Caducidade fundamenta-se em culpa da concessionária e dispensa lei.",
      "Afirmar que a concessionária pode rescindir unilateralmente o contrato por descumprimento estatal (FALSO: a concessionária deve ingressar com ação judicial de rescisão e manter a prestação do serviço até decisão judicial definitiva).",
      "Vedações de PPP: contratos de valor inferior a R$ 10 milhões ou com prazo inferior a 5 anos não podem ser celebrados sob o regime de PPP da Lei 11.079/2004."
    ],
    careerNuances: {
      AGU: "Estruturação jurídica e modelagem de grandes concessões de rodovias, portos e aeroportos federais, garantindo a segurança jurídica da matriz de riscos e a viabilidade dos financiamentos junto aos bancos de desenvolvimento.",
      PGFN: "Análise da capacidade de endividamento da União e mitigação de riscos fiscais e orçamentários assumidos em garantias contratuais de Parcerias Público-Privadas (PPPs) federais perante a LRF.",
      PF: "Consultoria e contencioso das agências federais reguladoras de infraestrutura (ANTT, ANTAQ, ANAC) nos processos sancionatórios de caducidade de concessões deficitárias.",
      PBC: "Regulamentação e acompanhamento dos instrumentos de captação financeira das concessionárias no mercado de capitais (debêntures incentivadas de infraestrutura)."
    }
  },

  // 4. BENS PÚBLICOS: REGIME JURÍDICO, AFETAÇÃO E FORMAS DE USO
  {
    id: "fuc-admin-bens-publicos-regime-juridico",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Bens Públicos: Classificação, Regime Jurídico Constitucional, Afetação e Utilização Privativa",
    themeKeywords: [
      "bens públicos", "bens publicos", "utilização dos bens públicos", "utilizacao dos bens publicos", 
      "afetação e desafetação", "afetacao e desafetacao", "bens de uso comum", "bens de uso especial", 
      "bens dominicais", "imprescritibilidade", "impenhorabilidade", "inalienabilidade", "terrenos de marinha", 
      "faixa de fronteira", "autorização de uso", "autorizacao de uso", "permissão de uso", "concessão de uso"
    ],
    coreDoctrine: `#### 📚 Regime Jurídico Dogmático dos Bens Públicos

* **Conceito e Classificação Tripartite (Art. 99 do Código Civil)**:
  Bens públicos são todos aqueles pertencentes às pessoas jurídicas de direito público interno (União, Estados, DF, Municípios, autarquias e fundações públicas de direito público). Classificam-se em:
  1. **Bens de Uso Comum do Povo**: Destinados à fruição coletiva indiscriminada de toda a sociedade (ex.: mares, rios, estradas, ruas e praças). A utilização pode ser gratuita ou retribuída (pedágio legalmente instituído);
  2. **Bens de Uso Especial**: Destinados à execução dos serviços públicos e instalação dos órgãos da Administração Pública (ex.: prédios de ministérios, fóruns, hospitais públicos, viaturas policiais e quartéis);
  3. **Bens Dominicais (ou Dominicais Puros)**: Constituem o patrimônio disponível do Estado sem destinação pública específica direta (ex.: terras devolutas, prédios públicos desocupados, títulos da dívida).

* **Teoria da Afetação e Desafetação**:
  * **Afetação**: Consagração fática ou jurídica de um bem ao atendimento de uma finalidade pública imediata (transformando-o em bem de uso comum ou bem de uso especial). Pode ocorrer por ato formal administrativo, lei ou destinação fática direta.
  * **Desafetação**: Retirada da destinação pública originária de um bem, convertendo-o na categoria de bem dominical.

* **Atributos Fundamentais do Regime Jurídico dos Bens Públicos**:
  * **Inalienabilidade Relativa**: Os bens de uso comum do povo e de uso especial são inalienáveis enquanto mantiverem sua afetação pública (art. 100 do CC). Apenas os bens dominicais podem ser alienados, desde que observadas as exigências do art. 76 da Lei 14.133/2021 (interesse público justificado, avaliação prévia, autorização legislativa para imóveis e licitação, ressalvadas doações e dações em pagamento).
  * **Imprescritibilidade**: Os bens públicos são insuscetíveis de usucapião ordinária, extraordinária ou especial (arts. 183, § 3º e 191, parágrafo único da CF/88; Súmula 340 do STF). A ocupação irregular de bem público por particular não configura posse jurídica, mas **mera detenção precária de natureza ilícita**, não assistindo ao invasor direito a indenização por benfeitorias ou direito de retenção (Súmula 619 do STJ).
  * **Impenhorabilidade**: Os bens públicos não podem ser submetidos a penhora ou arresto judicial em execuções comuns. O cumprimento de sentenças condenatórias em face da Fazenda Pública processa-se unicamente pelo rito constitucional dos precatórios e RPVs (art. 100 da CF/88).
  * **Não Onerabilidade**: Os bens públicos não podem ser gravados com direitos reais de garantia (hipoteca, penhor, anticrese).

* **Formas de Utilização Privativa de Bens Públicos por Particulares**:
  1. **Autorização de Uso**: Ato administrativo unilateral, discricionário e a título precário, revogável a qualquer tempo sem direito a indenização, destinado a atender preponderantemente a interesse privado do requerente em eventos passageiros (ex.: feira cultural de rua em praça pública, filmagem pontual de comercial);
  2. **Permissão de Uso**: Ato unilateral, discricionário e precário, destinado ao atendimento de interesse público e privado concomitantes (ex.: instalação de banca de jornal em calçada pública, cantina em prédio escolar público);
  3. **Concessão de Uso**: Contrato administrativo bilateral, formal, precedido de licitação, outorgando ao particular o uso exclusivo de área pública por prazo determinado, gerando direito subjetivo à ocupação durante o prazo contratual pactuado;
  4. **Concessão de Direito Real de Uso (CDRU - Decreto-Lei 271/1967)**: Contrato administrativo com natureza de direito real resolúvel sobre bem público, transferível por ato inter vivos ou causa mortis, aplicável preponderantemente a programas de habitação popular e urbanização de interesse social.

* **Bens Públicos da União (Art. 20 da CF/88)**:
  Dentre o rol constitucional destacam-se: os recursos minerais (inclusive do subsolo), os potenciais de energia hidráulica, a plataforma continental e zona econômica exclusiva, os terrenos de marinha e seus acrescidos, as terras tradicionalmente ocupadas pelos índios e a **faixa de fronteira** (largura de até 150 km ao longo das fronteiras terrestres, considerada área indispensável à segurança nacional).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Ocupação Irregular como Mera Detenção sem Indenização por Benfeitorias (Súmula 619 STJ)",
        author: "STJ Súmula 619 / 1ª e 2ª Turmas",
        thesis: "A ocupação indevida de bem público configura mera detenção de natureza precária, insuscetível de gerar posse e retenção por benfeitorias, autorizando a imediata reintegração de posse estatal.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Reconhecimento da Posse Social em Face do Estado para Fins Moratórios",
        author: "Doutrina Civilista Constitucional / Defensorias Públicas",
        thesis: "Sustenta que a omissão reiterada do Estado em áreas dominicais desocupadas por décadas configuraria posse fática suscetível de tutela possessória provisória em favor de famílias vulneráveis.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam sugerir que bens dominicais desocupados podem ser objeto de usucapião (FALSO: a imprescritibilidade atinge indistintamente TODAS as categorias de bens públicos, inclusive bens dominicais).",
      "Sustentar que a alienação de bens imóveis públicos dispensa autorização legislativa se houver licitação (FALSO: para imóveis da administração direta e autárquica exige-se autorização legislativa específica, além de licitação e avaliação prévia).",
      "Confundir Autorização com Concessão de Uso: a autorização é ato unilateral e precário sem prazo rígido; a concessão de uso é contrato administrativo que confere estabilidade e gera direito a indenização caso rescindido antes do termo."
    ],
    careerNuances: {
      AGU: "Defesa intransigente do domínio da União sobre terras públicas federais, faixa de fronteira e ilhas oceânicas, promovendo a anulação de registros imobiliários fraudulentos e grilagem de terras.",
      PGFN: "Gestão do patrimônio imobiliário da União e execução fiscal imobiliária, incluindo a cobrança de laudêmio, taxa de ocupação e foro relativos aos terrenos de marinha sob jurisdição da Secretaria do Patrimônio da União (SPU).",
      PF: "Reintegração de posse de áreas públicas ocupadas irregularmente em rodovias, ferrovias e reservas federais geridas por autarquias e fundações (DNIT, INCRA, FUNAI).",
      PBC: "Gestão patrimonial e alienação dos bens dominicais desativados adquiridos pelo Banco Central no exercício de liquidações extrajudiciais bancárias."
    }
  },

  // 5. AGENTES PÚBLICOS, REGIME ESTATUTÁRIO (LEI 8.112/90), PAD E LIMITES DA LRF
  {
    id: "fuc-admin-agentes-publicos-servidores-8112-pad",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Agentes Públicos: Classificação, Regime Jurídico dos Servidores (Lei 8.112/1990), PAD e Despesas da LRF",
    themeKeywords: [
      "agentes públicos", "agentes publicos", "regime jurídico: servidor público estatutário", 
      "servidor publico estatutario", "lei nº 8.112/1990", "lei 8.112", "8.112", "limite de gastos com servidores", 
      "responsabilidade fiscal", "processo administrativo disciplinar", "pad", "sindicância", 
      "demissão", "teto remuneratório", "teto remuneratorio", "estabilidade"
    ],
    coreDoctrine: `#### 📚 Teoria Geral dos Agentes Públicos e Regime Estatutário Federal

* **Classificação Dogmática dos Agentes Públicos**:
  Agente público é toda pessoa física que exerce, ainda que transitoriamente ou sem remuneração, por eleição, nomeação, designação, contratação ou qualquer forma de investidura ou vínculo, mandato, cargo, emprego ou função pública (art. 2º da Lei 8.429/1992). Classificação:
  1. **Agentes Políticos**: Integram os escalões estruturais da federação com mandatos e prerrogativas constitucionais (Chefes do Executivo, Ministros, Parlamentares, Magistrados, membros do MP e Tribunais de Contas);
  2. **Servidores Públicos em Sentido Estrito (Estatutários)**: Ocupantes de cargo público na Administração Direta, autarquias e fundações públicas de direito público, submetidos a regime jurídico estatutário (Lei 8.112/1990 no âmbito federal);
  3. **Empregados Públicos (Celetistas)**: Ocupantes de emprego público nas empresas estatais e certas fundações estatais, regidos pela CLT;
  4. **Agentes Temporários**: Contratados por tempo determinado para atender a necessidade temporária de excepcional interesse público (art. 37, IX da CF e Lei 8.745/1993);
  5. **Particulares em Colaboração com o Poder Público**: Exercem múnus público sem perder o vínculo privado (mesários eleitorais, jurados do Tribunal do Júri, notários e registradores, concessionários de serviço público).

* **Regras Constitucionais Estruturantes (Arts. 37 e 39 a 41 da CF/88)**:
  * **Concurso Público (Art. 37, II)**: Exigência para investidura originária em cargo ou emprego público, de provas ou de provas e títulos, com validade de até dois anos, prorrogável uma vez por igual período.
  * **Estabilidade (Art. 41)**: Adquire-se após **3 anos de efetivo exercício**, condicionada à aprovação em avaliação especial de desempenho por comissão instituída para essa finalidade. O servidor estável só perde o cargo em virtude de: sentença judicial transitada em julgado; processo administrativo disciplinar com ampla defesa; procedimento de avaliação periódica de desempenho (LC); ou contenção de despesas com pessoal (art. 169 da CF).
  * **Teto Remuneratório Constitucional (Art. 37, XI)**: O subsídio e vencimentos não podem exceder o subsídio mensal dos Ministros do STF. No âmbito federal dos Poderes: Executivo (subsídio do Presidente); Legislativo (subsídio dos Deputados Federais); Judiciário (subsídio dos Ministros do STF, extensível a membros do MP e Advocacia Pública).

* **Regime Disciplinar e Processo Administrativo Disciplinar (Lei 8.112/1990)**:
  * **Sindicância**: Procedimento prévio ou autônomo de apuração sumária que pode resultar em: arquivamento, aplicação de advertência ou suspensão de até 30 dias, ou instauração de PAD.
  * **Processo Administrativo Disciplinar (PAD - Rito Ordinário)**: Obrigatório para a aplicação das penalidades graves de **demissão, cassação de aposentadoria ou disponibilidade, e destituição de cargo em comissão**.
    * **Comissão Processante**: Composta por **3 servidores estáveis**, designados pela autoridade competente, que não guardem relação de parentesco com o indiciado (art. 149).
    * **Fases do PAD**: Instauração, Inquérito Administrativo (instrução, defesa e relatório circunstanciado) e Julgamento pela autoridade competente.
    * **Defesa Técnica**: A falta de defesa técnica por advogado no processo administrativo disciplinar não ofende a Constituição (Súmula Vinculante 5 do STF).
    * **Prescrição da Pretensão Punitiva (Art. 142)**: 5 anos para infrações puníveis com demissão, cassação de aposentadoria e destituição; 2 anos para suspensão; 180 dias para advertência. O termo inicial corre da data em que o fato se tornou conhecido pela autoridade competente para instaurar o processo. A instauração interrompe a prescrição por até 140 dias.

* **Limites de Gastos com Pessoal na Lei de Responsabilidade Fiscal (LCF 101/2000)**:
  * **Limites Globais da Despesa Total com Pessoal (Art. 19 da LRF)**:
    * **União**: 50% da Receita Corrente Líquida (RCL), repartida entre Executivo (40,9%), Judiciário (6%), Legislativo e TCU (2,5%) e MP da União (0,6%);
    * **Estados**: 60% da RCL;
    * **Municípios**: 60% da RCL.
  * **Limites de Alerta (90%) e Limite Prudencial (95%)**: O atingimento do limite prudencial veda expressamente: concessão de aumentos ou reajustes de remuneração; criação de cargos; provimento de cargo público ressalvada reposição decorrente de aposentadoria ou falecimento nas áreas de educação, saúde e segurança; e contratação de horas extras (art. 22, parágrafo único).
  * **Medidas Drásticas de Adequação do Art. 169 da CF**: Ultrapassado o limite máximo, o ente deve reduzi-lo mediante: 1º) redução de pelo menos 20% das despesas com cargos em comissão e funções de confiança; 2º) exoneração de servidores não estáveis; 3º) perda do cargo pelo servidor estável mediante ato motivado com indenização de um mês por ano de serviço.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Dispensa de Defesa Técnica Obrigatória por Advogado no PAD (Súmula Vinculante 5)",
        author: "STF Súmula Vinculante 5 / Plenário",
        thesis: "A falta de defesa técnica por advogado no processo administrativo disciplinar não ofende a Constituição, desde que assegurados o contraditório fático e a ampla oportunidade de manifestação pessoal do servidor.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Imprescindibilidade de Capacidade Postulatória no Processo Punitivo",
        author: "OAB / Doutrina Garantista Administrativa",
        thesis: "Sustenta que o processo administrativo disciplinar sancionador aproxima-se da ação penal, sendo nulo o procedimento sem acompanhamento efetivo de profissional habilitado na OAB.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a prescrição da infração disciplinar começa a correr na data do cometimento do fato ilícito (FALSO: segundo o art. 142, § 1º da Lei 8.112/90, corre a partir da data em que o fato se tornou conhecido pela autoridade competente).",
      "Sustentar que estagiários ou terceirizados podem compor a comissão de PAD (FALSO: a comissão deve ser integrada exclusivamente por 3 servidores públicos estatutários e estáveis).",
      "Confundir limite prudencial (95%) com limite de alerta (90% do teto global de despesa de pessoal na LRF)."
    ],
    careerNuances: {
      AGU: "Defesa dos atos demissórios de servidores federais expedidos pelo Presidente da República e Ministros de Estado, refutando nulidades formais e assegurando a legalidade estrita do PAD.",
      PGFN: "Verificação das repercussões fiscais e cumprimento dos limites prudenciais de despesa com pessoal da União perante a LRF e a Secretaria do Tesouro Nacional.",
      PF: "Consultoria e condução de procedimentos correcionais internos e PADs instaurados no âmbito das autarquias federais (INSS, IBAMA, INCRA).",
      PBC: "Orientação e defesa nos processos correcionais e disciplinares de servidores do quadro de carreira técnica do Banco Central do Brasil."
    }
  },

  // 6. PROCESSO ADMINISTRATIVO FEDERAL (LEI 9.784/1999) E CONTROLE DA ADMINISTRAÇÃO
  {
    id: "fuc-admin-processo-administrativo-9784-controle-tcu",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Processo Administrativo Federal (Lei 9.784/1999) e Controle da Administração Pública (Judicial e TCU)",
    themeKeywords: [
      "processo administrativo", "procedimento processo administrativo", "lei nº 9.784/1999", 
      "lei 9.784", "9.784", "instância administrativa", "instancia administrativa", 
      "controle interno e externo", "controle jurisdicional", "tribunal de contas da união", 
      "tribunal de contas", "tcu", "autotutela", "súmula 473", "súmula vinculante 3", "decadência administrativa"
    ],
    coreDoctrine: `#### 📚 Processo Administrativo Federal e Sistema Republicano de Controle

* **Princípios Reitores do Processo Administrativo (Lei 9.784/1999)**:
  O processo administrativo federal rege-se pelos princípios da legalidade, finalidade, motivação, razoabilidade, proporcionalidade, moralidade, ampla defesa, contraditório, segurança jurídica, interesse público e eficiência (art. 2º). Destacam-se as especificidades:
  * **Princípio da Oficialidade**: A Administração pode impulsionar o processo de ofício, ordenar diligências e produzir provas independentemente de provocação do administrado;
  * **Princípio da Verdade Material**: A autoridade administrativa deve buscar a verdade fática e substancial dos acontecimentos, não se limitando à verdade formal carreada aos autos pelas partes;
  * **Princípio do Informalismo Moderado**: Ritos simples e dispensa de fórmulas sacramentais rígidas, bastando as formalidades necessárias à garantia dos direitos e à segurança jurídica.

* **Competência, Delegação, Avocação e Decadência Administrativa (Art. 54)**:
  * **Competência**: É irrenunciável e se exerce pelos órgãos administrativos a que foi atribuída como própria.
  * **Vedação Absoluta de Delegação (Art. 13)**: É expressamente proibida a delegação de competência para:
    1. A edição de atos de caráter normativo;
    2. A decisão de recursos administrativos;
    3. As matérias de competência exclusiva do órgão ou autoridade.
  * **Decadência do Direito de Anular Atos Administrativos Favoráveis (Art. 54)**:
    O direito da Administração de anular os atos administrativos de que decorram efeitos favoráveis para os destinatários decai em **5 anos**, contados da data em que foram praticados, **salvo comprovada má-fé**. No caso de efeitos patrimoniais contínuos, o prazo de decadência conta-se da percepção do primeiro pagamento.
  * **Decisão Coordenada (Arts. 49-A a 49-G)**: Mecanismo de deliberação conjunta e simultânea de órgãos públicos em processos administrativos complexos com matérias transversais.

* **Sistema de Controle da Administração Pública**:
  Classifica-se sob três perspectivas fundamentais:
  1. **Controle Administrativo (Autotutela)**: Exercido pela própria Administração sobre seus atos. Consagrado nas **Súmulas 346 e 473 do STF**: A Administração pode anular seus próprios atos, quando eivados de vícios que os tornam ilegais, porque deles não se originam direitos; ou revogá-los, por motivo de conveniência ou oportunidade, respeitados os direitos adquiridos e ressalvada a apreciação judicial.
  2. **Controle Legislativo e Atuação do Tribunal de Contas da União (TCU)**:
    * Controle financeiro, orçamentário, patrimonial e operacional da Administração Direta e Indireta (art. 70 e 71 da CF/88);
    * O TCU auxilia o Congresso Nacional no controle externo, apreciando as contas do Presidente da República (parecer prévio) e julgando as contas dos administradores públicos federais e demais responsáveis por bens públicos;
    * **Eficácia de Título Executivo (Art. 71, § 3º da CF)**: As decisões do TCU de que resulte imputação de débito ou multa possuem eficácia de título executivo extrajudicial, sendo executadas pela Advocacia Pública perante o Poder Judiciário;
    * **Súmula Vinculante 3 do STF**: Nos processos perante o TCU asseguram-se o contraditório e a ampla defesa quando da decisão puder resultar anulação ou revogação de ato administrativo que beneficie o interessado, **excetuada a apreciação da legalidade do ato de concessão inicial de aposentadoria, reforma e pensão**.
  3. **Controle Jurisdicional (Judicial Review)**:
    * Decorre do princípio da inafastabilidade da jurisdição (art. 5º, XXXV da CF/88);
    * O Poder Judiciário exerce controle de legalidade, constitucionalidade, moralidade e razoabilidade de todos os atos da Administração (vinculados ou discricionários);
    * É vedado ao Judiciário imiscuir-se no **mérito administrativo puro** (conveniência e oportunidade da escolha discricionária legítima), ressalvada a verificação de manifesta desproporcionalidade ou desvio de finalidade.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Inaplicabilidade do Contraditório na Concessão Inicial de Aposentadoria no TCU (Súmula Vinculante 3)",
        author: "STF Súmula Vinculante 3 / Plenário",
        thesis: "O ato complexo de concessão inicial de aposentadoria, reforma e pensão não exige contraditório perante o TCU até o decurso de 5 anos de sua chegada ao Tribunal de Contas (STF Tema 445).",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Exigência de Contraditório Pleno Imediato em Qualquer Revisão de Benefício",
        author: "Doutrina Previdenciária / Entidades Representativas",
        thesis: "Sustenta que qualquer glosa de proventos em sede de controle externo gera impacto alimentar imediato, impondo citação e defesa prévia perante a Corte de Contas.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que as decisões do TCU que imputam débito são executadas pelo próprio Tribunal de Contas (FALSO: o TCU não tem poder de execução judicial; as decisões com força de título executivo são executadas pela Advocacia Pública no Judiciário).",
      "Afirmar que a competência para julgar recurso administrativo pode ser delegada (FALSO: proibição taxativa do art. 13 da Lei 9.784/1999).",
      "Decadência do art. 54 da Lei 9.784/1999: não flui na ocorrência de comprovada má-fé do beneficiário nem em atos inconstitucionais flagrantes."
    ],
    careerNuances: {
      AGU: "Defesa dos atos do Presidente da República e dos Ministros de Estado em sede de Mandado de Segurança perante o Supremo Tribunal Federal e Superior Tribunal de Justiça.",
      PGFN: "Execução fiscal e judicial das certidões de débito e acórdãos condenatórios do Tribunal de Contas da União (TCU) para reaver aos cofres federais os recursos desviados.",
      PF: "Atuação consultiva perante os órgãos de controle interno (CGU) e externo (TCU) para comprovação da regularidade dos atos de gestão das autarquias federais.",
      PBC: "Defesa das decisões colegiadas da Diretoria do Banco Central contra impugnações jurisdicionais perante a Justiça Federal e tribunais superiores."
    }
  },

  // 7. ADVOCACIA PÚBLICA, ÉTICA, LINDB, LGPD, LIBERDADE ECONÔMICA E PAR
  {
    id: "fuc-admin-advocacia-publica-par-anticorrupcao-lindb",
    discipline: "DIREITO ADMINISTRATIVO",
    title: "Advocacia Pública Consultiva, Ética, Processo Administrativo de Responsabilização (Lei 12.846), LINDB e LGPD",
    themeKeywords: [
      "advocacia-geral da união", "advocacia geral da uniao", "advocacia pública consultiva", 
      "advocacia publica consultiva", "procuradoria-geral da fazenda nacional", "pgfn", 
      "código de ética profissional", "codigo de etica profissional", "processo administrativo de responsabilização", 
      "par", "lei anticorrupção", "lei anticorrupcao", "12.846", "acordo de leniência", 
      "lindb", "lei de introdução", "lei da liberdade econômica", "lei da liberdade economica", 
      "lei geral de proteção de dados", "lgpd", "acesso à informação", "acesso a informacao"
    ],
    coreDoctrine: `#### 📚 Advocacia Pública Constitucional e Novos Marcos Regulatórios

* **Estatuto Constitucional da Advocacia Pública (Art. 131 da CF e LC 73/1993)**:
  A Advocacia-Geral da União é a instituição que, diretamente ou através de órgão vinculado, representa a União judicial e extrajudicialmente, cabendo-lhe, nos termos da lei complementar que dispuser sobre sua organização e funcionamento, as atividades de **consultoria e assessoramento jurídico do Poder Executivo**.
  * **Estrutura Orgânica da AGU**:
    * Órgão de Direção Superior: Advogado-Geral da União;
    * Órgãos de Assistência Direta e Imediata;
    * Órgãos de Direção: Procuradoria-Geral da União (PGU - contencioso da União), Consultoria-Geral da União (CGU - consultoria dos Ministérios);
    * Órgãos Vinculados: **Procuradoria-Geral da Fazenda Nacional (PGFN)**, competente privativamente para a representação judicial em matéria fiscal/tributária e cobrança da Dívida Ativa da União; **Procuradoria-Geral Federal (PGF)**, que representa as autarquias e fundações federais; e **Procuradoria-Geral do Banco Central (PGBC)**.
  * **Advocacia Pública Consultiva e Imunidade do Parecerista**:
    * O parecer do advogado público divide-se em: **facultativo** (não vincula a autoridade); **obrigatório** (a autoridade é obrigada a ouvir, mas pode divergir motivadamente); e **vinculante** (a lei impõe a concordância expressa do parecer para a validade do ato, ex.: aprovação de edital de licitação no art. 53 da Lei 14.133/2021).
    * O membro da Advocacia Pública atua com independência técnica e **somente responde civil e regressivamente quando agir com dolo ou fraude** (art. 184 do CPC, art. 28 da LINDB e MS 24.631 do STF).

* **Processo Administrativo de Responsabilização (PAR) e Lei Anticorrupção (Lei 12.846/2013)**:
  Dispõe sobre a responsabilização objetiva administrativa e civil de pessoas jurídicas pela prática de atos lesivos contra a administração pública nacional ou estrangeira.
  * **Responsabilidade Objetiva**: Independe da demonstração de culpa ou dolo da diretoria ou colaboradores da pessoa jurídica lesiva.
  * **Sanções Administrativas (Art. 6º)**: Multa de 0,1% a 20% do faturamento bruto do último exercício anterior à instauração do processo, e publicação extraordinária da decisão condenatória.
  * **Acordo de Leniência (Art. 16)**: Celebrado privativamente pela autoridade máxima do ente ou CGU/AGU, exige identificação dos envolvidos e cooperação plena e contínua, com isenção ou atenuação das sanções pecuniárias.

* **Direito Público na LINDB (Decreto-Lei 4.657/1942, alterado pela Lei 13.655/2018)**:
  * **Consequencialismo Jurídico (Art. 20)**: Nas esferas administrativa, controladora e judicial, não se decidirá com base em valores jurídicos abstratos sem que sejam consideradas as consequências práticas da decisão.
  * **Regime de Transição e Modulação (Art. 23)**: A decisão administrativa, controladora ou judicial que estabelecer nova interpretação ou orientação sobre norma de conteúdo indeterminado deverá prever regime de transição quando indispensável para a segurança jurídica.
  * **Erro Grosseiro (Art. 28)**: O agente público responderá pessoalmente por suas decisões ou opiniões técnicas em caso de **dolo ou erro grosseiro** (aquele praticado com manifesta negligência, imprudência ou desrespeito flagrante a jurisprudência consolidada).

* **Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018) e Tratamento pelo Poder Público**:
  O tratamento de dados pessoais por pessoas jurídicas de direito público deve ser realizado para o atendimento de sua finalidade pública, na persecução do interesse público, com o objetivo de executar as competências legais ou cumprir as atribuições legais do serviço público (art. 23). Exige-se observância dos princípios da finalidade, adequação, necessidade, transparência e segurança.

* **Lei da Liberdade Econômica (Lei 13.874/2019)**:
  Institui a Declaração de Direitos de Liberdade Econômica, fixando normas de proteção à livre iniciativa e ao livre exercício da atividade econômica e disposições sobre a atuação do Estado como agente normativo e regulador. Princípios: presunção de boa-fé do particular, intervenção subsidiária e excepcional do Estado sobre o exercício de atividades econômicas e o reconhecimento da vulnerabilidade do particular perante o Estado.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Imunidade Funcional do Parecerista Público e Exigência de Dolo ou Erro Grosseiro",
        author: "STF (MS 24.631/DF) / Min. Joaquim Barbosa / LINDB art. 28",
        thesis: "O advogado público parecerista não pode ser responsabilizado solidariamente com o gestor por suas manifestações técnicas, salvo nos casos estritos de dolo ou erro grosseiro inescusável documentalmente comprovado.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Responsabilização Solidária Ampla do Parecerista em Licitações Ilícitas",
        author: "Jurisprudência Histórica Rígida do TCU",
        thesis: "Sustentava que o parecer prévio em licitações integra a cadeia causal decisória obrigatória, autorizando a aplicação de multa e condenação do parecerista pelo Tribunal de Contas sempre que o parecer viabilizasse contratação irregular.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam atribuir competência privativa à PGU para representar a União em execução de dívida ativa tributária (FALSO: a cobrança da Dívida Ativa da União e causas tributárias federais é atribuição exclusiva e privativa da PGFN).",
      "Afirmar que a Lei Anticorrupção exige prova de dolo ou culpa dos dirigentes da pessoa jurídica (FALSO: a responsabilidade das pessoas jurídicas na Lei 12.846/2013 é estritamente OBJETIVA).",
      "Afirmar que a LINDB autoriza decisões fundadas exclusivamente em princípios gerais abstratos (FALSO: o art. 20 veda decisão fundada em conceitos jurídicos abstratos sem demonstração das consequências práticas)."
    ],
    careerNuances: {
      AGU: "Estruturação das defesas constitucionais perante o STF, preservação das prerrogativas funcionais dos membros da Advocacia Pública e celebração de Acordos de Leniência de grandes proporções em cooperação com a CGU.",
      PGFN: "Defesa privativa dos créditos tributários federais e da higidez da Dívida Ativa da União, atuação consultiva em contratos de financiamento internacional garantidos pelo Tesouro e representação do Ministério da Fazenda.",
      PF: "Consultoria e assessoramento das autarquias federais (ANVISA, INPI, IBAMA) e aplicação dos padrões da LINDB e LGPD na prestação de serviços públicos descentralizados.",
      PBC: "Assessoramento jurídico especializado à Diretoria Colegiada do Banco Central e defesa da legalidade do regime sancionador perante o Sistema Financeiro Nacional."
    }
  },

  // =========================================================================
  // FASE 1.8: MÓDULOS ESPECIALIZADOS DE DIREITO INTERNACIONAL PÚBLICO E TRIBUTÁRIO
  // =========================================================================

  // 1. PERSONALIDADE JURÍDICA INTERNACIONAL E IMUNIDADES
  {
    id: "fuc-internacional-personalidade-estados-organizacoes",
    discipline: "DIREITO INTERNACIONAL PÚBLICO",
    title: "Personalidade Jurídica Internacional: Estados, Organizações Internacionais e Imunidades",
    themeKeywords: [
      "personalidade jurídica internacional", "personalidade juridica internacional", 
      "sujeitos de direito internacional", "estados soberanos", "reconhecimento de estado", 
      "reconhecimento de governo", "organizações internacionais", "organizacoes internacionais", 
      "imunidade de jurisdição", "imunidade de jurisdicao", "imunidade de execução", 
      "atos de império", "atos de gestão", "tema 959", "costume internacional"
    ],
    coreDoctrine: `#### 📚 Teoria da Personalidade Jurídica no Direito Internacional Público

* **Sujeitos de Direito Internacional Público (DIP)**:
  A personalidade jurídica internacional traduz a aptidão para ser titular direto de direitos e obrigações no plano global, celebrar tratados (jus tractuum) e postular perante tribunais internacionais (jus postulandi).
  1. **Estados Soberanos**: Sujeitos originários, plenários e necessários do DIP. Elementos constitutivos clássicos (Convenção de Montevidéu de 1933): população permanente, território determinado, governo soberano efetivo e capacidade de entrar em relações com outros Estados.
  2. **Organizações Internacionais Intergovernamentais (OIs)**: Sujeitos derivados criados por tratados constitutivos. Detêm personalidade jurídica internacional funcional própria e distinta dos Estados-membros (Parecer Consultivo da CIJ no Caso Reparação por Danos Sofridos a Serviço das Nações Unidas - 1949). Regem-se pelo princípio da especialidade e pela **Teoria das Competências Implícitas**.
  3. **Indivíduos e Coletividades Especiais**: Sujeitos parciais detentores de direitos fundamentais protegidos internacionalmente (direitos humanos) e responsabilidade penal individual direta perante tribunais penais internacionais (TPI, Estatuto de Roma).
  4. **Santa Sé / Estado da Cidade do Vaticano, Ordem Soberana de Malta e Movimentos de Libertação Nacional**: Sujeitos sui generis com capacidade internacional restrita.

* **Reconhecimento de Estado e de Governo**:
  * **Reconhecimento de Estado**: Ato unilateral declaratório (teoria majoritária declaratória), confirmando que a entidade preenche os requisitos fáticos da estatalidade soberana. É ato discricionário, irrevogável e retroage à data da constituição fática do Estado.
  * **Reconhecimento de Governo**: Aplica-se em caso de rupturas institucionais anômalas (golpes ou revoluções). Doutrinas clássicas:
    * **Doutrina Tobar**: Exige restauração democrática constitucional prévia para reconhecimento;
    * **Doutrina Estrada (adotada majoritariamente pelo Brasil)**: O reconhecimento formal de governos viola a soberania interna; o Estado deve manter ou retirar seus representantes diplomáticos de forma pragmática, sem julgar expressamente a legitimidade interna do regime.

* **Imunidade de Jurisdição e de Execução dos Estados Estrangeiros**:
  * **Evolução Dogmática**: Passou da imunidade absoluta (*par in parem non habet imperium*) para a **imunidade relativa mitigada**, distinguindo:
    * **Atos de Império (jure imperii)**: Atos emanados da soberania estatal (defesa nacional, representação diplomática, políticas públicas essenciais). Subsiste a **imunidade absoluta de jurisdição**.
    * **Atos de Gestão (jure gestionis)**: Atos comerciais, contratuais, civis ou trabalhistas praticados pelo Estado em igualdade com particulares. **Não há imunidade de jurisdição** perante o Judiciário brasileiro (STF AC 9.696 e jurisprudência pacífica).
  * **Imunidade de Execução**: Permanece rigorosa. A renúncia à imunidade de jurisdição não implica renúncia automática à imunidade de execução. Bens destinados à representação diplomática ou consular são absolutamente impenhoráveis (Convenção de Viena sobre Relações Diplomáticas de 1961). A penhora judicial só é admitida sobre bens privados desvinculados de funções soberanas estatais.
  * **Violações aos Direitos Humanos e Tema 959 do STF**:
    O Supremo Tribunal Federal assentou que os atos de império praticados por Estado estrangeiro no território de outro Estado que violem direitos humanos cometidos no contexto de guerra ou perseguição não gozam de imunidade de jurisdição automática em face de ações civis indenizatórias.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Imunidade Relativa de Jurisdição para Atos de Gestão (Jurisprudência Dominante)",
        author: "STF (AC 9.696 e Tema 959) / Doutrina Internacionalista Contemporânea",
        thesis: "Estados estrangeiros não gozam de imunidade de cognição em litígios trabalhistas e contratuais celebrados no Brasil que configurem atos de mera gestão privada, garantindo acesso à justiça aos jurisdicionados.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Imunidade Absoluta Tradicional",
        author: "Doutrina Clássica do Direito Internacional Público",
        thesis: "A soberania dos Estados nacionais impede qualquer juízo de delibação coercitiva por cortes de outros países, independentemente da natureza pública ou privada do ato impugnado.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que a renúncia à imunidade de jurisdição abrange a imunidade de execução (FALSO: a renúncia à imunidade de execução exige manifestação formal expressa, autônoma e inequívoca do Estado estrangeiro).",
      "Afirmar que bens diplomáticos podem sofrer penhora para garantia de créditos trabalhistas (FALSO: contas correntes de embaixadas e veículos diplomáticos gozam de inviolabilidade absoluta protegida pela Convenção de Viena de 1961).",
      "Teoria das competências implícitas nas OIs: organizações internacionais podem praticar atos não expressos no tratado constitutivo desde que indispensáveis para a consecução de suas finalidades institucionais estatutárias."
    ],
    careerNuances: {
      PGFN: "Atuação no contencioso tributário envolvendo imunidades diplomáticas, isenções consulares e reciprocidade de tributos em face de bens de governos e representações financeiras estrangeiras.",
      AGU: "Defesa dos interesses da União perante a Justiça Federal em demandas de extradição, homologação de sentenças estrangeiras e ações movidas por corpos diplomáticos de outros países.",
      PF: "Consultoria das agências reguladoras no cumprimento de tratados setoriais internacionais e proteção de patrimônio de organizações internacionais sediadas no território brasileiro.",
      PBC: "Relacionamento institucional com organismos financeiros multilaterais (FMI, Banco Mundial, BIS), mantendo a proteção da imunidade dos ativos de reservas internacionais depositados no exterior."
    }
  },

  // 2. TRATADOS INTERNACIONAIS EM MATÉRIA TRIBUTÁRIA E PLANO BEPS DA OCDE
  {
    id: "fuc-internacional-tributario-dupla-tributacao-beps",
    discipline: "DIREITO INTERNACIONAL PÚBLICO",
    title: "Tratados Internacionais em Matéria Tributária, Modelo OCDE/ONU e Plano de Ação BEPS",
    themeKeywords: [
      "tratados internacionais em matéria tributária", "tratados internacionais em materia tributaria", 
      "plano de ação da ocde para o combate à erosão da base tributária e à transferência de lucros", 
      "plano de acao da ocde", "beps", "erosão da base tributária", "erosao da base tributaria", 
      "transferência de lucros", "transferencia de lucros", "preços de transferência", "precos de transferencia", 
      "lei nº 14.596/2023", "lei 14.596", "art. 98 do ctn", "bitributação internacional", 
      "dupla tributação internacional", "arm's length", "estabelecimento permanente", "beneficiário efetivo"
    ],
    coreDoctrine: `#### 📚 Direito Tributário Internacional, Acordos de Bitributação e o Projeto BEPS

* **Princípios Gerais da Tributação Internacional e Artigo 98 do CTN**:
  A soberania fiscal autoriza os Estados a eleger critérios de conexão territorial (fonte produtora ou pagadora) e pessoal (residência, nacionalidade ou domicílio). A sobreposição desses critérios acarreta a **bitributação jurídica internacional** (mesmo fato imponível, mesmo sujeito passivo, tributado por dois Estados soberanos distintos pelo mesmo período).
  * **O Artigo 98 do CTN e a Jurisprudência do STF**:
    * O art. 98 do CTN preceitua que os tratados e as convenções internacionais revogam ou modificam a legislação tributária interna, e serão observados pela que lhes sobrevenha.
    * O Supremo Tribunal Federal (RE 229.096 e RE 460.320) pacificou que a prevalência dos tratados tributários sobre a lei ordinária interna não decorre de superioridade hierárquica formal, mas sim do **princípio da especialidade** (*lex specialis derogat legi generali*).
    * O tratado contra a bitributação impede a incidência do imposto interno ou concede crédito do tributo recolhido no exterior, atuando como norma de sobredireito limitadora da pretensão punitiva e arrecadatória do fisco doméstico.

* **Modelos de Convenção Internacional contra a Bitributação**:
  * **Modelo da OCDE**: Historicamente concebido sob a ótica dos países exportadores de capital, conferindo primazia à **tributação no Estado de Residência** do investidor.
  * **Modelo da ONU**: Desenvolvido para resguardar as finanças dos países em desenvolvimento e importadores de capital, prestigiando a **tributação no Estado da Fonte** dos rendimentos (conceito ampliado de Estabelecimento Permanente e alíquotas retidas na fonte para royalties, dividendos e serviços técnicos).
  * **Métodos para Eliminação da Dupla Tributação**:
    1. **Método da Isenção**: O Estado da residência isenta de tributação os rendimentos auferidos no exterior;
    2. **Método do Crédito (Ordinário ou Integral)**: O Estado da residência tributa a totalidade da renda global, deduzindo o montante do imposto comprovadamente pago no Estado da fonte até o limite do imposto interno aplicável (art. 23B do Modelo OCDE).

* **Projeto BEPS (Base Erosion and Profit Shifting) da OCDE/G20**:
  Iniciativa internacional estruturada em **15 Ações Estratégicas** para combater a erosão da base tributária e a transferência artificial de lucros de empresas multinacionais para jurisdições de tributação favorecida ou paraísos fiscais sem substância econômica real.
  * **Pilares e Ações Fundamentais**:
    * **Ação 1**: Tributação da economia digital (Pilar 1: nexus sem presença física e Pilar 2: tributação mínima global de 15% - GloBE Rules);
    * **Ação 2**: Neutralização de assimetrias híbridas (hybrid mismatches);
    * **Ação 5**: Combate a práticas tributárias prejudiciais e exigência de substância econômica;
    * **Ação 6**: Prevenção da concessão abusiva de benefícios de tratados (cláusulas LOB - Limitation on Benefits e PPT - Principal Purpose Test);
    * **Ações 8 a 10**: Alinhamento das regras de preços de transferência à efetiva geração de valor econômico (intangíveis de difícil avaliação e alocação de riscos);
    * **Ação 13**: Documentação de Preços de Transferência e Country-by-Country Reporting (Declaração País-a-País);
    * **Ação 15**: Instrumento Multilateral (MLI) para modificação automática de milhares de tratados bilaterais simultâneos.

* **O Novo Marco dos Preços de Transferência no Brasil (Lei nº 14.596/2023)**:
  O Brasil abandonou o sistema tradicional de margens de lucro prefixadas em lei (antiga Lei 9.430/1996) e convergiu integralmente para o **Padrão Internacional da OCDE**:
  * **Princípio Arm's Length (Art. 2º)**: Os termos e condições contratados em transações controladas entre partes relacionadas no Brasil e no exterior devem corresponder àqueles que seriam pactuados entre partes independentes em operações econômicas comparáveis.
  * **Métodos de Preços de Transferência (Art. 11)**: Método dos Preços Independentes Comparados (PIC), Preço de Revenda menos Lucro (PRL), Custo mais Lucro (MCL), Margem Líquida da Transação (MLT) e Divisão do Lucro (DRL), selecionando-se o método mais apropriado conforme os fatos e circunstâncias da transação controlada.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Prevalência dos Tratados Tributários por Especialidade (Tese Vinculante do STF)",
        author: "STF (RE 229.096 e RE 460.320) / Min. Ilmar Galvão",
        thesis: "Os tratados internacionais em matéria tributária prevalecem sobre a legislação interna em decorrência do princípio da especialidade e do art. 98 do CTN, não havendo revogação de tratado por lei ordinária posterior genérica.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Equiparação Absoluta de Hierarquia com Revogação por Lei Posterior",
        author: "Doutrina Fiscalista Rígida",
        thesis: "Sustentava que tratados tributários possuem força de mera lei ordinária, podendo ser revogados unilateralmente por lei interna posterior em razão do princípio cronológico lex posterior derogat priori.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que o STF reconhece status supralegal aos tratados tributários (FALSO: o status supralegal cabe exclusivamente aos tratados de direitos humanos; tratados tributários prevalecem pelo princípio da especialidade e pelo art. 98 do CTN).",
      "Afirmar que a nova Lei 14.596/2023 manteve margens fixas de lucro para exportação e importação (FALSO: a nova lei revogou margens fixas e adotou o princípio arm's length da OCDE com base em comparabilidade econômica real).",
      "Cláusula de Beneficiário Efetivo: a fruição de alíquotas reduzidas em tratados internacionais exige que a pessoa jurídica estrangeira seja a titular econômica real dos rendimentos, barrando sociedades intermediárias de fachada (treaty shopping)."
    ],
    careerNuances: {
      PGFN: "Defesa dos autos de infração lavrados pela Receita Federal com fundamento nas regras de preços de transferência da Lei 14.596/2023 e descaracterização de planejamentos tributários abusivos internacionais perante o CARF e Justiça Federal.",
      AGU: "Negociação internacional de acordos para evitar a dupla tributação e apoio jurídico ao Ministério da Fazenda na implementação dos Pilares 1 e 2 do Projeto BEPS da OCDE.",
      PF: "Consultoria e acompanhamento da regulação aduaneira e tarifária em zonas francas e comércio exterior perante autarquias econômicas.",
      PBC: "Fiscalização cambial de capitais estrangeiros, registro de investimentos diretos e empréstimos externos no sistema RDE-ROF em consonância com as normas da OCDE."
    }
  },

  // 3. COOPERAÇÃO JURÍDICA INTERNACIONAL EM MATÉRIA TRIBUTÁRIA
  {
    id: "fuc-internacional-cooperacao-tributaria-troca-informacoes",
    discipline: "DIREITO INTERNACIONAL PÚBLICO",
    title: "Cooperação Jurídica Internacional em Matéria Tributária, Troca de Informações e Transparência",
    themeKeywords: [
      "cooperação jurídica internacional em matéria tributária", "cooperacao juridica internacional em materia tributaria", 
      "troca de informações tributárias", "troca de informacoes tributarias", "troca automática", 
      "troca automatica", "troca a pedido", "troca espontânea", "crs", "common reporting standard", 
      "fatca", "decreto nº 8.842/2016", "decreto 8.842", "assistência mútua administrativa", 
      "assistencia mutua administrativa", "auxílio direto", "cartas rogatórias", "exequatur"
    ],
    coreDoctrine: `#### 📚 Teoria e Prática da Cooperação Jurídica Internacional em Matéria Fiscal

* **Conceito e Fundamentos da Cooperação Internacional Tributária**:
  A cooperação jurídica e administrativa internacional é o mecanismo pelo qual as administrações tributárias e autoridades jurisdicionais de diferentes Estados soberanos prestam assistência mútua com o objetivo de fiscalizar fatos imponíveis transnacionais, combater a evasão fiscal, a lavagem de dinheiro e a ocultação de ativos financeiros no exterior.
  * Fundamento Constitucional: Art. 4º, IX da CF/88 (cooperação entre os povos para o progresso da humanidade).
  * A soberania fiscal impede a prática de atos materiais extraterritoriais de fiscalização coativa por agentes de um país no território de outro país sem prévia autorização e consentimento diplomático soberano.

* **Instrumentos Multilaterais e Bilaterais de Transparência Fiscal Global**:
  1. **Convenção Multilateral sobre Assistência Mútua Administrativa em Matéria Tributária (Decreto nº 8.842/2016)**:
     Desenvolvida pela OCDE e Conselho da Europa, ratificada pelo Brasil. Constitui o instrumento multilateral mais abrangente do mundo para combate à sonegação fiscal internacional.
     * **Âmbito de Assistência (Art. 1º)**: Abrange a troca de informações (a pedido, automática e espontânea), exames fiscais simultâneos e assistência na recuperação de créditos tributários no exterior.
  2. **Common Reporting Standard (CRS / Padrão Comum de Relato)**:
     Regulamentado no Brasil pela Receita Federal, impõe às instituições financeiras o dever de identificar contas de residentes fiscais no exterior e repassar compulsoriamente os saldos e rendimentos para envio automático às administrações tributárias estrangeiras recíprocas.
  3. **FATCA (Foreign Account Tax Compliance Act - Decreto nº 8.506/2015)**:
     Acordo intergovernamental celebrado entre Brasil e Estados Unidos para troca recíproca e automática de relatórios de informações financeiras de cidadãos e residentes norte-americanos e brasileiros.

* **Modalidades de Troca de Informações Tributárias**:
  * **Troca a Pedido (Exchange on Request)**: Ocorre quando uma administração tributária específica solicita dados individualizados pertinentes a uma investigação fiscal concreta em andamento, demonstrando relevância previsível das informações solicitadas. É vedada a realização de pesquisas genéricas e especulativas de dados (*fishing expeditions*).
  * **Troca Automática (Automatic Exchange)**: Transmissão periódica e sistemática de lotes padronizados de informações bancárias e societárias pré-definidas sem necessidade de requerimento individualizado prévio.
  * **Troca Espontânea (Spontaneous Exchange)**: Envio voluntário de dados descobertos por um Estado quando há fundadas razões para supor a ocorrência de perda de receita tributária ou ilícito no outro Estado contratante.

* **Cooperação Jurisdicional no Código de Processo Civil (Arts. 26 a 36 do CPC/2015)**:
  * **Princípios Reitores**: Observância do devido processo legal, igualdade substancial entre nacionais e estrangeiros, confidencialidade fiscal e reciprocidade diplomática.
  * **Instrumentos Processuais**:
    * **Auxílio Direto (Arts. 28 a 34)**: Procedimento expedito cabível quando a medida solicitada pela autoridade estrangeira não decorre diretamente de provimento jurisdicional decisório que exija juízo de delibação formal (ex.: colheita de provas, intimações e obtenção de certidões). Tramita perante a Autoridade Central do Ministério da Justiça e AGU.
    * **Carta Rogatória (Art. 36)**: Destinada ao cumprimento de atos decisórios e instrutórios expedidos por juízo estrangeiro, sujeita à concessão de *exequatur* pelo Superior Tribunal de Justiça (art. 105, I, 'i' da CF/88).
    * **Homologação de Decisão Estrangeira (Arts. 960 a 965 do CPC)**: De competência privativa do STJ, não admitindo reexame do mérito da causa (juízo de delibação restrito a requisitos formais, soberania nacional e ordem pública).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Legitimidade da Troca Automática sem Autorização Judicial Prévia (STF Tema 990)",
        author: "STF Tema 990 / RE 1.055.941 / Plenário",
        thesis: "É constitucional o compartilhamento direto de dados bancários e relatórios financeiros globais entre órgãos fiscais e de inteligência sem prévia ordem judicial, desde que resguardado o sigilo sob as mesmas garantias institucionais protetivas.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Exigência de Reserva de Jurisdição para Acesso a Dados Bancários Transnacionais",
        author: "Doutrina Penal Garantista / Entidades do Sistema Bancário",
        thesis: "Sustentava que o sigilo bancário constituiria direito fundamental absoluto do correntista, sendo nula qualquer remessa de movimentação financeira internacional sem autorização prévia e individualizada do Poder Judiciário.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que a Convenção Multilateral permite 'fishing expeditions' (FALSO: tanto o Modelo OCDE quanto o Decreto 8.842/2016 vedam expressamente solicitações genéricas e especulativas de provas sem liame fiscal justificado).",
      "Competência para concessão de exequatur em carta rogatória: compete privativamente ao STJ (art. 105, I, 'i' da CF), e não ao STF.",
      "Auxílio Direto versus Carta Rogatória: cabe auxílio direto quando o ato de cooperação não decorre de decisão judicial estrangeira que necessite de juízo de delibação; havendo decisão de juiz estrangeiro que produza efeitos no Brasil, a via correta é a carta rogatória com exequatur do STJ."
    ],
    careerNuances: {
      PGFN: "Utilização estratégica dos dados obtidos por troca automática de informações financeiras (CRS e FATCA) para identificação de patrimônio oculto de devedores da Dívida Ativa da União no exterior e propositura de medidas cautelares fiscais.",
      AGU: "Representação jurídica da autoridade central federal em procedimentos de cooperação jurídica passiva e ativa, e defesa da soberania nacional perante o Superior Tribunal de Justiça em pedidos de homologação de sentenças estrangeiras.",
      PF: "Consultoria das entidades reguladoras financeiras na parametrização de segurança e sigilo dos dados compartilhados internacionalmente.",
      PBC: "Fiscalização da conformidade regulatória dos bancos e instituições de pagamento quanto ao envio fidedigno de relatórios do CRS e cumprimento de diretrizes do GAFI/FATF."
    }
  },

  // =========================================================================
  // FASE 2.1: MÓDULOS ESPECIALIZADOS DE DIREITO AMBIENTAL E DIREITO ELEITORAL
  // =========================================================================

  // 1. SNUC, CÓDIGO FLORESTAL E ESPAÇOS PROTEGIDOS
  {
    id: "fuc-ambiental-snuc-codigo-florestal-espacos-protegidos",
    discipline: "DIREITO AMBIENTAL",
    title: "Sistema Nacional de Unidades de Conservação (SNUC), Código Florestal e Áreas Protegidas",
    themeKeywords: [
      "sistema nacional de unidades de conservação", "snuc", "código florestal", "codigo florestal", 
      "espaços territoriais especialmente protegidos", "espacos territoriais especialmente protegidos", 
      "unidades de conservação", "unidades de conservacao", "proteção integral", "uso sustentável", 
      "reserva legal", "área de preservação permanente", "app", "car", "lei 9.985", "lei 12.651"
    ],
    coreDoctrine: `#### 📚 Regime Jurídico dos Espaços Territoriais Especialmente Protegidos

* **Fundamento Constitucional (Art. 225, § 1º, III da CF/88)**:
  Incumbe ao Poder Público definir, em todas as unidades da federação, espaços territoriais e seus componentes a serem especialmente protegidos. A **criação** de espaço especialmente protegido pode ocorrer mediante ato do Poder Executivo (decreto) ou por lei formal; no entanto, a **alteração e a supressão** de qualquer espaço protegido ou a desafetação de seus limites territoriais exigem **obrigatoriamente lei formal em sentido estrito**, sendo inconstitucional a redução de unidades por decreto presidencial (STF, ADI 4.717).

* **Sistema Nacional de Unidades de Conservação da Natureza (SNUC - Lei 9.985/2000)**:
  Classificação das Unidades de Conservação (UCs):
  1. **Unidades de Proteção Integral**: Têm por objetivo prioritário a manutenção dos ecossistemas livres de alterações causadas por interferência humana, admitindo-se apenas o uso indireto dos seus recursos naturais (pesquisa científica, turismo ecológico e educação ambiental).
     * Categorias: Estação Ecológica, Reserva Biológica, Parque Nacional (Estadual ou Municipal), Monumento Natural e Refúgio de Vida Silvestre. A terra deve ser de domínio público (salvo Monumento Natural e Refúgio de Vida Silvestre que admitem propriedade particular compatível).
  2. **Unidades de Uso Sustentável**: Têm por objetivo compatibilizar a conservação da natureza com o uso sustentável de parcela dos seus recursos naturais.
     * Categorias: Área de Proteção Ambiental (APA), Área de Relevante Interesse Ecológico (ARIE), Floresta Nacional (FLONA), Reserva Extrativista (RESEX), Reserva de Fauna, Reserva de Desenvolvimento Sustentável (RDS) e Reserva Particular do Patrimônio Natural (RPPN).

* **Regime Jurídico das Áreas Protegidas no Código Florestal (Lei nº 12.651/2012)**:
  * **Área de Preservação Permanente (APP - Arts. 4º a 9º)**:
    Área protegida, coberta ou não por vegetação nativa, com a função ambiental de preservar os recursos hídricos, a paisagem, a estabilidade geológica e a biodiversidade.
    * Hipóteses Legais: Faixas marginais de qualquer curso d'água natural; entorno de lagos e lagoas naturais; topos de morros e montanhas; encostas com declividade superior a 45º; restingas e manguezais; bordas dos tabuleiros ou chapadas.
    * A supressão de vegetação em APP é excepcionalíssima, admitida apenas em casos de **utilidade pública, interesse social ou baixo impacto ambiental**, com prévia autorização do órgão competente.
  * **Reserva Legal (Arts. 12 a 25)**:
    Área localizada no interior de imóvel rural com a função de assegurar o uso econômico sustentável dos recursos naturais e conservar a biodiversidade.
    * Percentuais Mínimos: Amazônia Legal (80% em área de floresta, 35% em cerrado, 20% em campos gerais); Demais regiões do país (20%).
    * A obrigação de manter e recompor a Reserva Legal possui natureza *propter rem* (Súmula 623 do STJ), vinculando o adquirente do imóvel rural independentemente de ter sido ele o autor do desmatamento.
  * **Cadastro Ambiental Rural (CAR - Art. 29)**:
    Registro público eletrônico nacional e obrigatório para todos os imóveis rurais, destinado a integrar informações ambientais e viabilizar o Programa de Regularização Ambiental (PRA).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Exigência Inafastável de Lei em Sentido Estrito para Redução de Limites (STF ADI 4.717)",
        author: "STF ADI 4.717 / Plenário",
        thesis: "A desafetação ou diminuição de limites de unidade de conservação exige reserva de lei formal em sentido estrito, sendo nulo decreto executivo que reduza a área protegida.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Admissão de Decreto Regulamentar para Adequações Limítrofes",
        author: "Doutrina Administrativa Minoritária",
        thesis: "Sustentava que meros ajustes técnicos topográficos sem impacto substantivo poderiam ser veiculados por decreto autônomo do Chefe do Executivo.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a desafetação de Unidade de Conservação pode ser feita por decreto do Presidente (FALSO: criação pode ser por decreto, mas a alteração redutora ou supressão exige LEI FORMAL).",
      "Natureza propter rem da recomposição florestal: o adquirente responde pelo dano ambiental pretérito do imóvel rural (Súmula 623 STJ).",
      "Confundir Parque Nacional (Proteção Integral) com APA (Uso Sustentável): a APA admite propriedades privadas e atividades econômicas disciplinadas."
    ],
    careerNuances: {
      AGU: "Defesa dos limites das Unidades de Conservação federais geridas pelo ICMBio contra invasões e ocupações ilegais, e sustentação da constitucionalidade das desapropriações ambientais.",
      PGFN: "Cobrança de compensações ambientais decorrentes do art. 36 do SNUC inadimplidas por grandes empreendimentos concessionários.",
      PF: "Representação judicial do IBAMA e ICMBio na defesa da legalidade das autuações, embargos de desmatamento e demolição de edificações erigidas clandestinamente em APPs e UCs federais."
    }
  },

  // 2. CONDUTAS VEDADAS, PROPAGANDA ELEITORAL E RECURSOS
  {
    id: "fuc-eleitoral-condutas-vedadas-propaganda-recursos",
    discipline: "DIREITO ELEITORAL",
    title: "Condutas Vedadas aos Agentes Públicos, Propaganda Eleitoral e Abuso do Poder Político",
    themeKeywords: [
      "propaganda eleitoral", "propaganda na imprensa escrita", "condutas vedadas aos agentes públicos federais em eleições", 
      "condutas vedadas", "lei 9.504", "art. 73", "abuso de poder político", "poder de polícia eleitoral", 
      "propaganda na internet", "showmício", "gastos eleitorais", "recursos eleitorais"
    ],
    coreDoctrine: `#### 📚 Condutas Vedadas aos Agentes Públicos e Propaganda Eleitoral

* **Condutas Vedadas aos Agentes Públicos em Campanhas Eleitorais (Arts. 73 a 78 da Lei nº 9.504/1997)**:
  Têm por objetivo tutelar a isonomia do pleito, a moralidade administrativa e impedir o uso da máquina pública em proveito de candidaturas:
  1. **Cessão ou Uso de Bens Públicos (Art. 73, I)**: Proibição de ceder ou utilizar bens móveis ou imóveis da administração direta ou indireta em benefício de candidato ou partido, ressalvada a realização de convenções partidárias em prédios públicos.
  2. **Uso de Servidores Públicos (Art. 73, III)**: Proibição de ceder servidor ou empregado público, ou usar de seus serviços, para comitês de campanha durante o horário normal de expediente funcional.
  3. **Distribuição Gratuita de Bens e Valores (Art. 73, § 10)**: No ano da eleição, é proibida a distribuição gratuita de bens, valores ou benefícios pela Administração Pública, salvo em programas sociais previamente autorizados em lei e já em execução orçamentária no ano anterior ou em casos de calamidade pública formalmente decretada.
  4. **Nomeações e Demissões nos 3 Meses Anteriores (Art. 73, V)**: Proibição de nomear, contratar, demitir sem justa causa ou suprimir vantagens funcionais a partir dos 3 meses que antecedem o pleito até a posse dos eleitos. Exceções: nomeação para cargos em comissão; nomeação de aprovados em concursos públicos homologados antes do início dos 3 meses; e nomeações indispensáveis na segurança pública e saúde.
  5. **Publicidade Institucional (Art. 73, VI, 'b')**: Nos 3 meses que antecedem o pleito é terminantemente proibida a autorização de publicidade institucional de programas e obras estatais, salvo em caso de grave e urgente necessidade pública reconhecida pela Justiça Eleitoral.
  * **Sanções**: As condutas vedadas configuram infração de natureza objetiva (dispensam prova de dolo ou desvio de finalidade para a incidência da sanção pecuniária), ensejando aplicação de multa ao responsável e ao beneficiário, além de cassação do registro ou do diploma e declaração de inelegibilidade caso haja gravidade das circunstâncias (art. 73, §§ 4º e 5º c/c art. 22 da LC 64/90).

* **Regime Jurídico da Propaganda Eleitoral (Lei nº 9.504/1997)**:
  * **Marco Temporal**: Permitida a partir do dia **16 de agosto** do ano da eleição (art. 36).
  * **Propaganda na Imprensa Escrita (Art. 43)**: Permitida a divulgação paga de até 10 anúncios por veículo, em datas diversas, até a antevéspera do pleito, respeitados os limites máximos de espaço (1/8 de página padrão ou 1/4 de página de revista).
  * **Vedações Expressas**: É vedada a veiculação de propaganda eleitoral em bens públicos e bens de uso comum (postes, viadutos, praças, cinemas, lojas e igrejas); proibição de showmícios e eventos com apresentação artística para animação de comícios (STF, ADI 5617: declarou constitucional a proibição de showmícios remunerados); proibição de disparos em massa e desinformação eleitoral deliberada (deepfakes).
  * **Poder de Polícia Eleitoral**: Exercido pelo Juiz Eleitoral para fazer cessar imediatamente propagandas irregulares, não autorizando a instauração de censura prévia (art. 41).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Natureza Objetiva das Condutas Vedadas do Artigo 73 (TSE)",
        author: "Tribunal Superior Eleitoral / Jurisprudência Pacífica",
        thesis: "A configuração das condutas vedadas aos agentes públicos prescinde da demonstração de potencialidade lesiva ou de dolo específico, bastando a subsunção fática aos núcleos proibitivos para aplicação da multa legal.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Exigência de Demonstração de Prejuízo Efetivo à Isonomia do Pleito",
        author: "Doutrina Eleitoralista Crítica",
        thesis: "Sustenta que infrações irrelevantes ou de bagatela não deveriam ensejar punição ao administrador quando demonstrada a boa-fé e ausência de proveito eleitoral concreto.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que a distribuição gratuita de bens é proibida em todo o mandato (FALSO: a vedação do art. 73, § 10 da Lei 9.504/97 incide especificamente no ANO da eleição).",
      "Publicidade institucional nos 3 meses anteriores ao pleito: é vedada mesmo que desprovida de nomes de candidatos, salvo grave e urgente necessidade pública com autorização expressa da Justiça Eleitoral.",
      "Concurso público homologado antes do trimestre vedado: a nomeação dos aprovados é plenamente válida e autorizada pelo art. 73, V, 'c' da Lei 9.504/97."
    ],
    careerNuances: {
      AGU: "Orientação consultiva preventiva aos órgãos da Administração Pública federal durante o período eleitoral (Cartilha de Condutas Vedadas da AGU), prevenindo a prática involuntária de atos tipificados no art. 73 da Lei 9.504/97.",
      PGFN: "Execução fiscal de créditos não tributários decorrentes de multas cominadas pela Justiça Eleitoral e inscritas na Dívida Ativa da União.",
      PF: "Consultoria das autarquias e fundações públicas para adequação de campanhas de conscientização pública institucional aos limites temporais das eleições."
    }
  },
  // =========================================================================
  // DIREITO AGRÁRIO (PF / PGF / PFE-INCRA / REFORMA AGRÁRIA)
  // =========================================================================
  {
    id: "fuc-agrario-estatuto-terra-funcao-social-modulos",
    discipline: "DIREITO AGRÁRIO",
    title: "Estatuto da Terra, Função Social da Propriedade Rural e Critérios Constitucionais de Produtividade",
    themeKeywords: [
      "estatuto da terra", "lei 4.504", "funcao social da propriedade rural", "art. 186 da cf/88", 
      "modulo rural", "modulo fiscal", "imovel rural", "latifundio", "minifundio", "grau de utilizacao", 
      "gut", "gee", "eficiencia na exploracao", "reforma agraria", "politica agricola"
    ],
    coreDoctrine: `#### 📚 Estatuto da Terra, Função Social e Produtividade Rural na Ordem Constitucional

* **Marco Histórico e Principiologia do Estatuto da Terra (Lei nº 4.504/1964)**:
  O Estatuto da Terra (diploma pioneiro promulgado sob a égide da Emenda Constitucional nº 10/1964) instituiu o microssistema do Direito Agrário no Brasil, subordinando o regime da posse e uso da terra à consecução da **Reforma Agrária** e ao desenvolvimento planejado da **Política Agrícola**. A ordem agrária brasileira afasta a visão individualista oitocentista e consagra a **função socioeconômica da terra**, erigindo-a em instrumento de dignidade humana, fomento produtivo e justiça distributiva.

* **Conceito Dogmático de Imóvel Rural e Critério da Destinação**:
  Consoante o art. 4º, I do Estatuto da Terra c/c art. 15 do Decreto-Lei nº 57/1966 e pacífica jurisprudência do Superior Tribunal de Justiça, a definição de imóvel rural rege-se pelo **critério da destinação econômica**, e não pela sua localização física ou geográfica. Desse modo, o prédio rústico situado em área urbanizável ou dentro do perímetro urbano que seja comprovadamente destinado à exploração extrativa agrícola, pecuária, agroindustrial ou florestal qualifica-se juridicamente como imóvel rural, atraindo a incidência das normas agrárias e do ITR, com o consequente afastamento do IPTU municipal.

* **Classificação Jurídica dos Imóveis Rurais no Ordenamento**:
  1. **Propriedade Familiar**: O imóvel rural que, direta e pessoalmente explorado pelo agricultor e sua família, lhes absorva toda a força de trabalho, garantindo-lhes a subsistência e o progresso social e econômico, com dimensões máximas regionais delimitadas pelo órgão agrário federal;
  2. **Módulo Rural versus Módulo Fiscal**: O módulo rural traduz a unidade de medida fixada pelo Estatuto da Terra como área mínima indispensável à subsistência da família rural em determinada microrregião homogênea. Já o **módulo fiscal** (instituído pela Lei nº 6.746/1979 e fixado em hectares pelo INCRA para cada Município) constitui parâmetro objetivo obrigatório para a cobrança do ITR e para a classificação legal dos imóveis em minifúndio (área inferior a um módulo fiscal), pequena propriedade (de um a quatro módulos fiscais), média propriedade (de quatro a quinze módulos fiscais) e grande propriedade (área superior a quinze módulos fiscais);
  3. **Minifúndio**: O prédio rústico de dimensão inferior ao módulo fiscal, cuja exploração econômica revela-se deficitária perante os padrões da propriedade familiar;
  4. **Latifúndio**: Classifica-se em:
     * *Latifúndio por Extensão*: Imóvel cuja área exceda em seiscentas vezes o módulo médio da propriedade familiar;
     * *Latifúndio por Exploração*: Imóvel rural que, independentemente de sua área, seja mantido inexplorado ou explorado de modo comprovadamente antieconômico ou predatório aos recursos ambientais.

* **Função Social da Propriedade Rural: Cumulatividade dos Requisitos (Art. 186 da CF/88)**:
  A Constituição da República de 1988 operou uma verdadeira revolução dogmática ao estatuir, em seu art. 186, que a função social da propriedade rural exige o atendimento **concomitante e obrigatório** de quatro vetores substanciais:
  1. *Aproveitamento racional e adequado da terra*;
  2. *Utilização adequada dos recursos naturais disponíveis e preservação do meio ambiente*;
  3. *Observância estrita das disposições que regulam as relações de trabalho*;
  4. *Exploração que favoreça o bem-estar dos proprietários e dos trabalhadores*.
  A jurisprudência assentada do Supremo Tribunal Federal e do Superior Tribunal de Justiça proclama que o cumprimento da função social é **indivisível**: o proprietário que alcança altos índices de produtividade agronômica, mas degrada o meio ambiente (mediante supressão ilegal de Reserva Legal ou queima de Áreas de Preservação Permanente) ou submete trabalhadores a condições degradantes ou análogas à de escravo, descumpre frontalmente a função social constitucional, legitimando a intervenção expropriatória do Poder Público.

* **Parâmetros da Propriedade Produtiva na Lei nº 8.629/1993 (GUT e GEE)**:
  Para que a propriedade rural seja legalmente considerada produtiva e obtenha a imunidade desapropriatória do art. 185, II da CF/88, a Lei nº 8.629/1993 impõe o atingimento cumulativo de dois índices técnicos apurados pelo INCRA:
  * **Grau de Utilização da Terra (GUT)**: Proporção entre a área efetivamente aproveitada e a área aproveitável total do imóvel, devendo ser igual ou superior a **80% (oitenta por cento)**;
  * **Grau de Eficiência na Exploração (GEE)**: Quociente entre a produção obtida e os índices de rendimento agropecuário fixados pelo Ministério da Agricultura para a região, devendo ser igual ou superior a **100% (cem por cento)**.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Tese da Indivisibilidade e Cumulatividade dos Requisitos da Função Social",
        author: "STF (Plenário) / STJ / Doutrina Majoritária (José Afonso da Silva, Celso Antônio Bandeira de Mello)",
        thesis: "A produtividade econômica apurada nos índices de GUT e GEE não elide o descumprimento dos requisitos socioambientais e trabalhistas, de sorte que a violação ao meio ambiente ou a normas trabalhistas desnatura a função social e autoriza a intervenção estatal.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Prevalência da Produtividade para Fins de Imunidade Expropriatória",
        author: "Doutrina Agrarista Tradicional Minoritária",
        thesis: "Sustenta que a propriedade comprovadamente produtiva goza de imunidade absoluta contra desapropriação para reforma agrária (art. 185, II da CF), cabendo para as infrações ambientais ou trabalhistas exclusivamente as sanções administrativas e penais ordinárias.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que a aferição da produtividade rural é suficiente para afastar a desapropriação mesmo havendo trabalho escravo (FALSO: o descumprimento trabalhista grave viola o art. 186, III da CF e legitima a perda da posse ou até a expropriação confiscatória do art. 243 da CF).",
      "Confundir Módulo Rural (conceito agrário do Estatuto da Terra centrado na subsistência da propriedade familiar) com Módulo Fiscal (unidade em hectares fixada pelo INCRA para cada Município utilizada como base para classificação de pequena e média propriedade).",
      "Critério de enquadramento do imóvel rural: bancas tentam induzir que imóvel dentro da zona urbana nunca é rural (FALSO: prevalece o critério da destinação econômica rurícola, nos termos do art. 15 do Decreto-Lei nº 57/1966 e Súmula do STJ)."
    ],
    careerNuances: {
      PF: "A atuação da Procuradoria Federal Especializada junto ao INCRA (PFE-INCRA/PGF/AGU) sustenta a plena vigência dos critérios constitucionais cumulativos do art. 186 da CF/88. A jurisprudência do STF e STJ firma que a produtividade econômica (GUT >= 80% e GEE >= 100%) não supre o descumprimento dos requisitos ambientais e trabalhistas, ensejando a aplicação da sanção desapropriatória e a defesa intransigente do interesse público primário nas ações demarcatórias e administrativas fundiárias.",
      AGU: "A AGU atua em cooperação com os órgãos de fiscalização federal para assegurar que a política nacional de reforma agrária preserve a higidez do meio ambiente ecologicamente equilibrado e os preceitos fundamentais da dignidade dos trabalhadores rurais."
    }
  },
  {
    id: "fuc-agrario-desapropriacao-lc76-lei8629-tda",
    discipline: "DIREITO AGRÁRIO",
    title: "Desapropriação por Interesse Social para Reforma Agrária, Rito da LC 76/1993, TDAs e Benfeitorias",
    themeKeywords: [
      "desapropriacao por interesse social", "reforma agraria", "art. 184 da cf/88", "lei 8.629/1993", 
      "lc 76/1993", "tda", "titulos da divida agraria", "terra nua", "benfeitorias uteis e necessarias", 
      "imissao provisoria na posse", "deposito previo", "juros compensatorios", "juros moratorios", "honorarios advocaticios"
    ],
    coreDoctrine: `#### 📚 Desapropriação Agrária por Interesse Social: Procedimento da LC 76/93 e Regime Financeiro dos TDAs

* **Competência Privativa da União e Natureza Jurídica Sancionatória**:
  A desapropriação por interesse social para fins de reforma agrária (art. 184 da CF/88) consubstancia a intervenção supressiva estatal de maior gravidade no domínio privado, constituindo competência legislativa e material privativa da União. Apresenta nítida **natureza sancionatória**, operando como consequência jurídica inexorável imposta ao proprietário que se omite ou falha no cumprimento da função social de seu imóvel rural.

* **Regime Bipartido Constitucional de Indenização (TDA versus Dinheiro)**:
  A ordem constitucional instituiu mecanismo financeiro diferenciado para a indenização da propriedade rural desapropriada:
  1. **Terra Nua**: Indenizada mediante **Títulos da Dívida Agrária (TDA)**, de emissão especial do Tesouro Nacional, com cláusula de atualização monetária pelo IPCA e taxa de remuneração de juros legais. Os TDAs possuem resgate escalonado no prazo de até **vinte anos**, iniciando-se a amortização a partir do segundo ano da emissão. São dotados de poder liberatório para pagamento de tributos e do preço de imóveis públicos e gozam de isenção total de impostos federais, estaduais e municipais (art. 184, § 5º da CF/88);
  2. **Benfeitorias Úteis e Necessárias**: Pagamento obrigatório e prévio em **dinheiro vivo** (art. 184, § 1º da CF/88). As benfeitorias voluptuárias não são indenizáveis na via expropriatória agrária, assistindo ao expropriado o direito de levantamento desde que não comprometa a integridade das instalações ou do solo;
  3. **Benfeitorias de Má-Fé ou Posteriores à Notificação**: Não geram direito a indenização quando realizadas com o intuito fraudulento de elevar artificialmente a avaliação pericial administrativa.

* **O Procedimento Contraditório Especial e Sumário da Lei Complementar nº 76/1993**:
  O microssistema processual da LC nº 76/1993 confere máxima celeridade e efetividade à ação expropriatória ajuizada perante a **Justiça Federal** competente:
  * **Petição Inicial e Depósito Prévio**: A petição inicial do INCRA deve ser instruída obrigatoriamente com o Decreto Presidencial declaratório de interesse social, laudo de vistoria administrativa circunstanciado, comprovação do depósito do valor das benfeitorias em dinheiro e do lançamento contábil dos TDAs correspondentes à terra nua;
  * **Imissão Provisória na Posse *Inaudita Altera Parte***: O juiz federal, no prazo improrrogável de quarenta e oito horas do despacho da petição inicial, deferirá de plano a imissão do INCRA na posse do imóvel, sem audiência prévia do expropriado (art. 6º da LC 76/1993);
  * **Vedação Absoluta a Interditos Possessórios**: O art. 6º, § 1º da LC 76/1993 veda taxativamente o ajuizamento de interdito possessório ou medida cautelar tendente a paralisar ou embaraçar a imissão de posse em favor da autarquia fundiária federal;
  * **Limitação Temática da Contestação**: A resposta do expropriado restringe-se estritamente à arguição de vícios formais do processo administrativo expropriatório e à impugnação do valor da indenização ofertada, sendo vedada a rediscussão sobre conveniência, oportunidade ou utilidade social da reforma agrária na sede da ação de desapropriação;
  * **Levantamento Parcial do Depósito**: O expropriado poderá levantar até 80% (oitenta por cento) do valor depositado em dinheiro e TDAs, desde que comprove a regularidade do domínio imobiliário e a quitação dos tributos incidentes sobre o imóvel.

* **Regime Jurisprudencial dos Juros e Honorários na Desapropriação Agrária**:
  * **Juros Compensatórios**: Destinados a compensar a perda antecipada da posse direta. Com a fixação da tese vinculante pelo STF na **ADI 2.332/DF**, os juros compensatórios incidem à alíquota máxima de até **6% ao ano** sobre a diferença entre 80% do valor ofertado e o valor final arbitrado em juízo. Exige-se comprovação inequívoca de perda de renda efetiva e produtividade real do imóvel expropriado;
  * **Juros Moratórios**: Fixados em 6% ao ano, fluem a partir de 1º de janeiro do exercício financeiro seguinte àquele em que o precatório correspondente deveria ter sido pago (art. 15-B do Decreto-Lei nº 3.365/1941 c/c art. 100 da CF/88), vedada a cumulação simultânea de juros compensatórios e moratórios no mesmo período.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Exigência de Comprovação de Renda Real para Juros Compensatórios (STF ADI 2.332)",
        author: "STF (Tribunal Pleno - Rel. Min. Roberto Barroso)",
        thesis: "A fixação de juros compensatórios em até 6% ao ano exige a prova substancial de perda de exploração econômica e rendimento potencial do imóvel, não sendo devidos sobre imóveis inexplorados ou improdutivos.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Incidência Objetiva dos Juros Compensatórios pela Mera Perda da Posse",
        author: "Jurisprudência Histórica Superada (Súmulas 69 e 114 do STJ)",
        thesis: "Defendia que a privação antecipada da posse decorrente da liminar de imissão ensejava juros compensatórios objetivos à base de 12% ao ano, independentemente da produtividade do bem.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que a indenização da terra nua pode ser feita em dinheiro (FALSO: a CF/88 art. 184 exige expressamente que a terra nua seja indenizada em Títulos da Dívida Agrária - TDA).",
      "Afirmar que o juiz deve ouvir o expropriado antes de conceder a imissão provisória na posse (FALSO: a LC 76/1993 art. 6º manda deferir a imissão no prazo de 48 horas inaudita altera parte).",
      "Juros compensatórios: bancas ainda cobram a alíquota antiga de 12% ao ano (FALSO: o STF na ADI 2.332 declarou constitucional o limite máximo de 6% ao ano e impôs a exigência de prova da perda de renda)."
    ],
    careerNuances: {
      PF: "A PFE-INCRA/PGF atua com rigor na defesa da imissão provisória na posse e no pagamento bipartido constitucional: TDA para terra nua (resgatáveis em até 20 anos, isentos de tributos e corrigidos monetariamente) e dinheiro exclusivamente para benfeitorias úteis e necessárias de boa-fé. Observa-se a jurisprudência do STF (ADI 2.332) sobre juros compensatórios de até 6% ao ano, condicionados à prova de produtividade e perda de renda real pelo proprietário expropriado.",
      AGU: "Atuação da Advocacia-Geral da União perante os Tribunais Superiores para impedir o pagamento de indenizações superfaturadas e salvaguardar os cofres públicos contra laudos periciais judiciais que desconsiderem os preços de mercado vigentes na região do imóvel desapropriado."
    }
  },
  {
    id: "fuc-agrario-imunidades-invasao-vistoria-pfe-incra",
    discipline: "DIREITO AGRÁRIO",
    title: "Imunidades Agrárias, Vedação de Vistoria em Imóvel Invadido e Atuação Estratégica da PFE-INCRA",
    themeKeywords: [
      "imunidades agrarias", "pequena e media propriedade", "propriedade produtiva", "art. 185 da cf/88", 
      "vedacao a vistoria", "art. 2º, § 6º da lei 8.629/1993", "imovel rural invadido", "esbulho possessorio", 
      "pfe-incra", "procuradoria federal especializada", "imissao provisoria na posse", "stf ms 24.504"
    ],
    coreDoctrine: `#### 📚 Imunidades Agrárias Expropriatórias e a Vedação Peremptória de Vistoria em Imóvel Invadido

* **Imunidades Constitucionais à Desapropriação para Reforma Agrária (Art. 185 da CF/88)**:
  A Carta Magna protege de forma qualificada determinadas categorias de propriedades rurais contra a desapropriação por interesse social para fins de reforma agrária, consagrando verdadeiras **imunidades materiais de índole constitucional**:
  1. **Pequena e Média Propriedade Rural**: O art. 185, I da CF/88 declara insuscetível de desapropriação agrária a pequena propriedade (entre um e quatro módulos fiscais) e a média propriedade (entre quatro e quinze módulos fiscais), **desde que seu proprietário não possua outra propriedade rural**. A unicidade da titularidade imobiliária rurícola configura requisito indispensável para a fruição da garantia constitucional;
  2. **Propriedade Produtiva**: O art. 185, II da CF/88 imuniza a propriedade rural que atende aos parâmetros técnicos de produtividade econômica fixados em lei (GUT igual ou superior a 80% e GEE igual ou superior a 100%).
  Ressalte-se que tais garantias representam imunidades estritas contra a desapropriação sancionatória para fins de reforma agrária (art. 184 da CF), subsistindo plenamente a prerrogativa do Poder Público de promover a desapropriação ordinária por utilidade pública ou necessidade pública (conforme o Decreto-Lei nº 3.365/1941) mediante pagamento integral prévio em dinheiro.

* **Vedação Legal à Vistoria e Desapropriação de Imóvel Invadido (Art. 2º, § 6º da Lei nº 8.629/1993)**:
  Com o objetivo de refrear a utilização de ações de força e ocupações ilegais como estratégia de pressão fundiária, a Medida Provisória nº 2.183-56/2001 introduziu o § 6º no art. 2º da Lei nº 8.629/1993, estabelecendo disciplina normativa de caráter imperativo:
  * O imóvel rural de domínio público ou privado que for objeto de **esbulho possessório ou invasão motivada por conflito agrário coletivo** não poderá ser vistoriado, avaliado ou desapropriado pelo Poder Público nos **dois anos subsequentes à sua completa desocupação**;
  * Ocorrendo **reincidência** no esbulho ou nova invasão possessória, o prazo de vedação administrativa é **duplicado para quatro anos**;
  * Os ocupantes, invasores ou participantes de atos de esbulho coletivo ficam compulsoriamente **excluídos de qualquer benefício ou programa de distribuição de terras** da reforma agrária promovido pelo INCRA.

* **Jurisprudência Constitucional Vinculante do STF: O Histórico Julgamento do MS 24.504/DF**:
  O Supremo Tribunal Federal, em paradigmático acórdão relatado pelo Ministro Celso de Mello no **Mandado de Segurança nº 24.504/DF**, fixou balizas inegociáveis sobre a matéria:
  * A garantia da higidez do procedimento administrativo expropriatório pressupõe absoluta paz jurídica no campo. O esbulho possessório gera contaminação estrutural no processo de vistoria do INCRA, inviabilizando a aferição fidedigna da produtividade e do cumprimento da função social da terra;
  * O Estado Democrático de Direito não tolera que condutas ilegais de turbação ou invasão sejam manipuladas como mecanismo de aceleração de desapropriações estatais. O preceito do art. 2º, § 6º da Lei nº 8.629/1993 foi integralmente validado perante a Constituição Federal como instrumento cogente de salvaguarda da legalidade e da segurança jurídica fundiária.

* **Atuação da Procuradoria Federal Especializada junto ao INCRA (PFE-INCRA/PGF/AGU)**:
  A PFE-INCRA, órgão integrante da Procuradoria-Geral Federal vinculado à AGU, exerce papel de vanguarda no contencioso agrário nacional:
  * Emissão de pareceres prévios vinculantes atestando a regularidade formal da cadeia dominial centenária, obstando indenizações a proprietários de títulos grilados ou sobrepostos em terras públicas federais devolutas;
  * Verificação cadastral preventiva para aplicação imediata do bloqueio de vistoria do art. 2º, § 6º da Lei nº 8.629/1993 sempre que noticiada formalmente a ocorrência de invasão coletiva no imóvel fiscalizado;
  * Sustentação da imissão provisória imediata na posse perante os Tribunais Regionais Federais e os Tribunais Superiores, resguardando os recursos públicos destinados à aquisição fundiária pacificada.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Validade e Aplicação Vinculante da Vedação de Vistoria em Imóvel Invadido (STF MS 24.504)",
        author: "STF (Tribunal Pleno - Rel. Min. Celso de Mello)",
        thesis: "O art. 2º, § 6º da Lei 8.629/1993 é plenamente constitucional e impõe a paralisação imediata dos atos de vistoria e desapropriação sobre imóveis rurais invadidos, assegurando a ordem jurídica e desestimulando a violência coletiva no campo.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Flexibilização da Vedação em Face da Suposta Preponderância Social da Reforma",
        author: "Doutrina Crítica dos Movimentos Sociais",
        thesis: "Sustentava que a vedação violaria o mandamento constitucional da reforma agrária, devendo a vistoria prosseguir quando a ocupação não tivesse o condão de descaracterizar a improdutividade pré-existente do imóvel.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas afirmam que a vedação do art. 2º, § 6º da Lei 8.629/93 é de 1 ano (FALSO: o prazo é de 2 anos a contar da total desocupação, ou 4 anos em caso de reincidência).",
      "Pequena e média propriedade rural: a imunidade à desapropriação só existe se o titular não possuir outra propriedade rural (art. 185, I da CF). Se possuir outro imóvel rural, perde a imunidade.",
      "Imunidade agrária impede qualquer desapropriação? (FALSO: impede apenas a desapropriação agrária para reforma agrária do art. 184 da CF; desapropriações por utilidade pública como para hidrelétricas ou estradas pelo DL 3.365/41 continuam plenamente cabíveis)."
    ],
    careerNuances: {
      PF: "A Procuradoria Federal Especializada junto ao INCRA invoca a aplicação peremptória do art. 2º, § 6º da Lei 8.629/1993, pacificada pelo STF no MS 24.504: o imóvel rural esbulhado ou ocupado coletivamente não pode ser objeto de vistoria ou desapropriação nos 2 anos subsequentes à desocupação (ou 4 anos se reincidente), repelindo o estímulo à invasão como instrumento de coerção fundiária e resguardando a legitimidade do Programa Nacional de Reforma Agrária.",
      AGU: "Coordenação estratégica com o Ministério do Desenvolvimento Agrário para garantir a integridade dos processos administrativos de assentamento e prevenir conflitos violentos no campo por meio da conciliação agrária institucional."
    }
  },
  {
    id: "fuc-agrario-regularizacao-amazonia-contratos-indigenas-quilombolas",
    discipline: "DIREITO AGRÁRIO",
    title: "Regularização Fundiária na Amazônia Legal, Contratos Agrários e Terras Tradicionais Indígenas e Quilombolas",
    themeKeywords: [
      "regularizacao fundiaria rural e urbana", "amazonia legal", "lei 11.952/2009", "lei 13.465/2017", 
      "contratos agrarios", "arrendamento rural", "parceria rural", "decreto 59.566/1966", "direito de preferencia", 
      "preempcao", "terras indigenas", "quilombolas", "art. 231 da cf", "art. 68 do adct", "decreto 4.887/2003", 
      "adi 3239", "funai"
    ],
    coreDoctrine: `#### 📚 Regularização Fundiária, Contratos Agrários e Regime Constitucional de Terras Tradicionais

* **Regularização Fundiária na Amazônia Legal (Lei nº 11.952/2009 e Lei nº 13.465/2017)**:
  O programa de regularização fundiária nas áreas da União situadas na **Amazônia Legal** visa conferir segurança jurídica, sustentabilidade ambiental e ordenamento territorial a ocupações mansas e pacíficas históricas de produtores rurais:
  * **Limites Territoriais e Dispensa Licitatória**: A legislação autoriza a alienação ou concessão de direito real de uso de áreas rurais de até **2.500 (dois mil e quinhentos) hectares** mediante dispensa de licitação pública, desde que o ocupante comprove a exploração direta anterior e não seja proprietário de outro imóvel rural no país;
  * **Cláusulas Resolutivas Decenais Obrigatórias**: Os títulos de domínio expedidos pelo INCRA incorporam compulsoriamente condições resolutivas que vigoram pelo prazo inegociável de **dez anos**. O adquirente fica adstrito a manter a regularidade do Cadastro Ambiental Rural (CAR), preservar os percentuais legais de Reserva Legal (80% em bioma florestal amazônico) e Área de Preservação Permanente (APP), abster-se do trabalho escravo e não alienar a terceiros sem prévia anuência estatal, sob pena de reversão imediata da área ao patrimônio da União.

* **Regime Protetivo dos Contratos Agrários no Estatuto da Terra (Decreto nº 59.566/1966)**:
  Os contratos agrários submetem-se ao **dirigismo contratual imperativo**, informados por normas cogentes de ordem pública indisponíveis pelas partes:
  1. **Arrendamento Rural**: Negócio jurídico pelo qual uma pessoa cede a outra o uso e gozo temporário de imóvel rural mediante retribuição pecuniária certa em dinheiro (preço do arrendamento). O art. 18 do Decreto nº 59.566/1966 veda a fixação do preço em quantidade de frutos ou produtos agrícolas, exigindo fixação em moeda corrente (embora admitido o pagamento equivalente);
  2. **Parceria Rural**: Negócio jurídico fundado na comunhão de riscos e na mútua cooperação econômica entre o parceiro-outorgante e o parceiro-outorgado, cabendo a partilha proporcional dos frutos e dos prejuízos consoante tetos legais fixados no art. 96 da Lei nº 4.504/1964;
  3. **Prazos Mínimos Legais Obrigatórios**: Fixados em três anos (lavoura temporária ou pecuária de pequeno/médio porte), cinco anos (lavoura permanente ou pecuária de grande porte) e sete anos (atividade de exploração florestal);
  4. **Direito de Preferência (Preempção Legal)**: O arrendatário tem preferência absoluta para adquirir o imóvel arrendado em igualdade de condições com terceiros (art. 92, § 3º da Lei 4.504/64). Se o proprietário alienar o imóvel sem prévia notificação, assiste ao arrendatário o direito potestativo de adjudicar a coisa para si, mediante depósito integral do preço em juízo, no prazo decadencial improrrogável de **seis meses** contados da averbação da escritura no Cartório de Registro de Imóveis competente.

* **Terras Tradicionalmente Ocupadas por Índios (Art. 231 da CF/88)**:
  * **Direitos Originários e Indisponíveis**: Os direitos territoriais indígenas são **originários** (*indigenato*), anteriores à própria criação do Estado brasileiro. As terras tradicionalmente ocupadas destinam-se à posse permanente dos índios e ao usufruto exclusivo das riquezas naturais do solo e das águas;
  * **Bens da União e Regime de Nulidade Absoluta**: As terras indígenas integram o domínio público da União (art. 20, XI da CF/88) e são marcadas pelos atributos da inalienabilidade, indisponibilidade e imprescritibilidade. O art. 231, § 6º da CF comina a **nulidade absoluta e extinção *ex tunc*** de todos os títulos de propriedade privada, escrituras ou concessões que incidam sobre elas, inexistindo direito a qualquer indenização ao ocupante particular, ressalvadas exclusivamente as benfeitorias úteis e necessárias edificadas de boa-fé.

* **Terras Quilombolas e a Higidez Constitucional do Decreto nº 4.887/2003 (STF ADI 3.239)**:
  * O art. 68 do ADCT conferiu eficácia plena ao direito fundamental à titulação definitiva da propriedade imobiliária comunitária em prol dos remanescentes das comunidades dos quilombos;
  * O **Decreto nº 4.887/2003** regulamentou o rito de identificação, delimitação e titulação a cargo do INCRA, fundado no critério da **autoatribuição étnico-racial** e na emissão de laudo antropológico circunstanciado;
  * O Supremo Tribunal Federal, ao julgar a emblemática **ADI nº 3.239/DF**, julgou improcedente a ação direta e reconheceu a **plena constitucionalidade do Decreto nº 4.887/2003**, chancelando a desapropriação por interesse social de imóveis privados incidentes em territórios quilombolas mediante indenização prévia e justa em dinheiro.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Constitucionalidade Integral da Titulação Quilombola por Autoatribuição (STF ADI 3.239)",
        author: "STF (Tribunal Pleno - Rel. Min. Rosa Weber)",
        thesis: "O Decreto 4.887/2003 é formal e materialmente constitucional. A autoidentificação étnica combinada com laudo antropológico do INCRA é meio legítimo e suficiente para delimitar as terras quilombolas do art. 68 do ADCT.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Tese da Exigência de Lei Formal em Sentido Estrito para Desapropriação Quilombola",
        author: "Posição Vencida na ADI 3.239 (Min. Cezar Peluso)",
        thesis: "Sustentava que o Presidente da República não poderia regulamentar a desapropriação quilombola por mero decreto autônomo, exigindo-se lei complementar ou ordinária do Congresso Nacional.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Bancas tentam afirmar que o preço do arrendamento rural pode ser fixado em sacas de soja ou café (FALSO: o art. 18 do Decreto 59.566/66 veda a fixação do preço em quantidade de frutos, devendo ser estipulado em quantia fixa de dinheiro).",
      "Prazo para o arrendatário preterido adjudicar o imóvel: o prazo decadencial é de 6 meses contados do registro imobiliário da escritura (art. 92, § 4º da Lei 4.504/64), mediante depósito do valor.",
      "Terras indígenas geram direito a indenização da terra nua para ocupantes titulados? (FALSO: art. 231, § 6º da CF estabelece que os títulos são nulos de pleno direito, indenizando-se apenas as benfeitorias de boa-fé)."
    ],
    careerNuances: {
      PF: "A PGF/AGU exerce protagonismo na defesa de terras tradicionalmente ocupadas por comunidades indígenas (art. 231 CF) e quilombolas (art. 68 ADCT c/c Decreto 4.887/2003, cuja higidez constitucional foi assentada pelo STF na ADI 3.239). Em tema de regularização fundiária da Amazônia Legal (Lei 11.952/2009), a PFE-INCRA zela pelo cumprimento estrito dos limites de área, cláusulas resolutivas ambientais (CAR) e veto à grilagem de terras públicas.",
      AGU: "Defesa dos atos de demarcação homologados pelo Presidente da República perante o STF, resguardando os direitos ancestrais dos povos tradicionais e prevenindo a desestabilização da ordem fundiária pública."
    }
  },
  ...DOCTRINAL_ENAM_ENAC,
  ...DOCTRINAL_BACEN,
  ...DOCTRINAL_PF,
  ...DOCTRINAL_AU,
  ...DOCTRINAL_PFN
];

import { normalizeDisciplineFamily } from "./disciplineUtils";
export { normalizeDisciplineFamily };

/**
 * Identifica o melhor módulo doutrinário especializado correspondente ao tema e disciplina
 */
export function findBestDoctrinalModule(theme: string, discipline: string): DoctrinalModule {
  const normTheme = (theme || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const targetFamily = normalizeDisciplineFamily(discipline);

  // 1. Filtrar módulos compatíveis com a família disciplinar solicitada
  const discModules = DOCTRINAL_REPOSITORY.filter(mod => {
    const modFamily = normalizeDisciplineFamily(mod.discipline);
    if (targetFamily === "TRABALHO" && (modFamily === "TRABALHO" || modFamily === "PROCESSO_TRABALHO" || modFamily === "TRABALHO_COLETIVO")) return true;
    if (targetFamily === "PROCESSO_TRABALHO" && (modFamily === "TRABALHO" || modFamily === "PROCESSO_TRABALHO" || modFamily === "TRABALHO_COLETIVO")) return true;
    if (targetFamily === "PROCESSO_PENAL" && (modFamily === "PENAL" || modFamily === "PROCESSO_PENAL" || modFamily === "PENAL_ESPECIAL" || modFamily === "CRIMINOLOGIA")) return true;
    if (targetFamily === "PENAL" && (modFamily === "PENAL" || modFamily === "PROCESSO_PENAL" || modFamily === "PENAL_ESPECIAL" || modFamily === "CRIMINOLOGIA")) return true;
    if (targetFamily === "ADMINISTRATIVO" && (modFamily === "ADMINISTRATIVO" || mod.discipline.includes("ADMINISTRATIVO"))) return true;
    return modFamily === targetFamily;
  });

  // 2. Busca ponderada por palavras-chave temáticas DENTRO da disciplina selecionada
  let bestMod: any = null;
  let bestScore = 0;

  const rawTheme = theme || "";
  const statuteMatches = rawTheme.match(/\b\d{1,2}\.?\d{3}\b(?:\/\d{4})?|\b179\/2021\b|\b105\/2001\b|\b857\/1969\b|\b2\.321\/1987\b|\b4\.320\b|\b6\.830\b|\b7\.347\b|\b12\.865\b|\b10\.214\b|\b14\.478\b|\b6\.024\b|\b10\.931\b|\b12\.529\b|\b13\.874\b|\b9\.650\b|\b9\.784\b|\b8\.112\b|\b8\.429\b|\b7\.492\b|\b9\.613\b|\b6\.404\b|\b11\.101\b|\b14\.112\b|\b9\.514\b/gi) || [];
  const normalizedStatuteNumbers = statuteMatches.map(s => s.toLowerCase().replace(/\./g, "").trim());

  const GENERIC_DISC_WORDS = new Set([
    "direito", "tributario", "tributaria", "constitucional", "administrativo", 
    "administrativa", "civil", "penal", "processual", "trabalho", 
    "previdenciario", "eleitoral", "empresarial", "internacional", 
    "financeiro", "economico", "seguridade", "normas", "gerais"
  ]);

  const cleanTheme = " " + normTheme.replace(/[(),:;.\-\/\\\[\]]/g, " ").replace(/\s+/g, " ") + " ";
  const themeTokens = cleanTheme.trim().split(/\s+/).filter(t => t.length > 2);

  for (const mod of discModules) {
    let score = 0;
    const modTitleLower = mod.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Bonificação por número de lei/diploma específico presente no título ou keywords
    for (const num of normalizedStatuteNumbers) {
      if (modTitleLower.replace(/\./g, "").includes(num) || mod.themeKeywords.some(k => k.replace(/\./g, "").includes(num))) {
        score += 150;
      }
    }

    for (const kw of mod.themeKeywords) {
      const normKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const cleanKw = normKw.replace(/[(),:;.\-\/\\\[\]]/g, " ").replace(/\s+/g, " ").trim();

      if (cleanKw.length <= 3) {
        if (themeTokens.includes(cleanKw)) score += 30;
      } else if (cleanTheme.includes(" " + cleanKw + " ") || normTheme.includes(normKw)) {
        // Exato trecho: bonifica proporcionalmente ao tamanho para priorizar frases compostas específicas
        score += cleanKw.length * 4;
      } else if (cleanKw.includes(cleanTheme.trim()) && cleanTheme.trim().length >= 6) {
        score += cleanTheme.trim().length * 2;
      } else {
        // Checa tokens substantivos individuais (ignorando stopwords genéricas de disciplina)
        const kwTokens = cleanKw.split(/\s+/).filter(k => k.length > 2 && !GENERIC_DISC_WORDS.has(k));
        let hits = 0;
        for (const kt of kwTokens) {
          if (themeTokens.includes(kt)) hits++;
        }
        if (hits >= 1) score += hits * 15;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMod = mod;
    }
  }

  let matched = bestScore > 0 ? bestMod : null;

  // 3. Se não casou por palavra-chave mas encontramos módulos daquela disciplina, faz o fallback seguro dentro da MESMA disciplina
  if (!matched && discModules.length > 0) {
    matched = discModules[0];
  }

  // 4. Se a disciplina não possuía nenhum módulo específico cadastrado, busca em todo o repositório com token boundary estrito
  if (!matched) {
    matched = DOCTRINAL_REPOSITORY.find(mod => {
      return mod.themeKeywords.some(kw => {
        const normKw = kw.toLowerCase();
        if (normKw.length <= 3) {
          const tokens = normTheme.split(/\s+/);
          return tokens.includes(normKw);
        }
        return normTheme.includes(normKw);
      });
    });
  }

  return matched || DOCTRINAL_REPOSITORY[0];
}

/**
 * Formata o conteúdo do módulo doutrinário com as nuances da carreira correspondente
 */
export function formatDoctrinalAnalysis(
  mod: DoctrinalModule,
  career: "AU" | "PGFN" | "PF" | "PBC" | "MPE" | "ENAM" | "ENAC" | "COMPREHENSIVE" = "AU"
): string {
  const careerName = career === "AU" 
    ? "Advocacia-Geral da União (AGU)" 
    : career === "PGFN" 
    ? "Procuradoria-Geral da Fazenda Nacional (PGFN)" 
    : career === "PF"
    ? "Procuradoria-Geral Federal (PGF/AGU)"
    : career === "PBC"
    ? "Procuradoria-Geral do Banco Central (PGBC/AGU)"
    : career === "ENAM"
    ? "Exame Nacional da Magistratura (ENAM)"
    : career === "ENAC"
    ? "Exame Nacional dos Cartórios (ENAC)"
    : "Ministério Público Estadual (MPE)";

  let specificGuidance = "";
  if (career === "PGFN") {
    specificGuidance = mod.careerNuances.PGFN || `[Prisma PGFN • Defesa do Erário & Dívida Ativa]: ${mod.careerNuances.AGU || "Atuação voltada à defesa da legalidade do lançamento tributário, higidez da CDA (Lei 6.830/80), arrecadação fiscal e aplicação das teses vinculantes dos Tribunais Superiores."}`;
  } else if (career === "PF") {
    specificGuidance = mod.careerNuances.PF || `[Prisma PGF • Autarquias e Fundações]: ${mod.careerNuances.AGU || "Atuação focada na representação das autarquias e fundações públicas federais (Lei 10.480/2002), preservando a autonomia regulatória, a seguridade social pública e a sustentabilidade ambiental."}`;
  } else if (career === "PBC") {
    specificGuidance = mod.careerNuances.PBC || `[Prisma PGBC • Sistema Financeiro Nacional]: ${mod.careerNuances.AGU || "Atuação voltada à higidez regulatória do Sistema Financeiro Nacional, estabilidade da moeda e do câmbio, autonomia do BACEN (LC 179/2021) e legalidade do Processo Administrativo Sancionador (Lei 13.506/2017)."}`;
  } else if (career === "ENAM") {
    specificGuidance = mod.careerNuances.ENAM || `[Prisma ENAM • Magistratura & Direitos Fundamentais]: Aplicação do Protocolo de Julgamento com Perspectiva de Gênero (Resolução 492 CNJ), controle difuso de convencionalidade com base no Pacto de San José da Costa Rica e fundamentação estrita ancorada nos arts. 20 a 24 da LINDB.`;
  } else if (career === "ENAC") {
    specificGuidance = mod.careerNuances.ENAC || `[Prisma ENAC • Serviços Notariais e de Registro]: Observância estrita da fé pública delegada (art. 236 da CF), qualificação registral estrita da Lei 6.015/73, diretrizes do Código Nacional de Normas (Provimento 149/CNJ) e Marco Legal das Garantias (Lei 14.711/2023).`;
  } else if (career === "AU") {
    specificGuidance = mod.careerNuances.AGU || "Representação judicial e consultoria jurídica da União direta (Presidência da República, Ministérios e Forças Armadas), controle de constitucionalidade perante o STF, processo civil fazendário e juridicidade de políticas públicas federais.";
  } else {
    specificGuidance = mod.careerNuances.MPE || "Atuação na defesa da ordem jurídica, do regime democrático e dos interesses sociais e individuais indisponíveis.";
  }

  const currentsBlock = mod.divergentCurrents ? `

---

#### ⚖️ Divergências Doutrinárias & Correntes de Prova (1ª e 2ª Fase)

* 🟢 **1ª Corrente (Majoritária nos Tribunais & Adotada em Prova)**:
  * **Tese**: ${mod.divergentCurrents.firstCurrent.thesis}
  * **Referência Dogmática**: ${mod.divergentCurrents.firstCurrent.author}

* 🟡 **2ª Corrente (Minoritária / Posição Crítica)**:
  * **Tese**: ${mod.divergentCurrents.secondCurrent.thesis}
  * **Referência Dogmática**: ${mod.divergentCurrents.secondCurrent.author}
` : "";

  const pitfallsBlock = mod.examPitfalls && mod.examPitfalls.length > 0 ? `

---

#### 🚨 Distratores & Pegadinhas Clássicas das Bancas (CEBRASPE / FGV / VUNESP)

${mod.examPitfalls.map((p, idx) => `* **[${idx + 1}]** ${p}`).join("\n")}` : "";

  return `### 🏛️ Aprofundamento Doutrinário Institucional — ${careerName}

> **Eixo Temático:** *Doutrina Especializada & Jurisprudência Vinculante dos Tribunais Superiores*.
> **Módulo Dogmático Vinculado:** ${mod.title}

${mod.coreDoctrine}${currentsBlock}${pitfallsBlock}

---

#### 🎯 Diretriz Estratégica Institucional para a Carreira (${career})

${specificGuidance}`;
}

/**
 * Retorna a análise doutrinária especializada correspondente ao tema, disciplina e carreira
 */
export function getDeepDoctrinalAnalysis(
  theme: string, 
  discipline: string, 
  career: "AU" | "PGFN" | "PF" | "PBC" | "MPE" | "ENAM" | "ENAC" | "COMPREHENSIVE" = "AU"
): string {
  const mod = findBestDoctrinalModule(theme, discipline);
  return formatDoctrinalAnalysis(mod, career);
}
