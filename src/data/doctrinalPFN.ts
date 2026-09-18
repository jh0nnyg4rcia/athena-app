/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DoctrinalModule } from "./doctrinalRepository";

export const DOCTRINAL_PFN: DoctrinalModule[] = [
  // =========================================================================
  // 1. EXECUÇÃO FISCAL, CDA E PRERROGATIVAS PROCESSUAIS FAZENDÁRIAS
  // =========================================================================
  {
    id: "pfn-execucao-fiscal-lef-cda-prerrogativas",
    discipline: "DIREITO PROCESSUAL CIVIL",
    title: "Execução Fiscal da Dívida Ativa da União (Lei nº 6.830/1980 - LEF), CDA e Prerrogativas Processuais Fazendárias",
    themeKeywords: [
      "execução fiscal", "lei 6.830", "6.830", "6.830/1980", "lef", "cda",
      "certidão de dívida ativa", "dívida ativa da união", "dau", "artigo 204 do ctn",
      "súmula 392 do stj", "súmula 279 do stj", "exceção de pré-executividade",
      "embargos à execução fiscal", "garantia do juízo", "penhora de faturamento"
    ],
    coreDoctrine: `#### 🏛️ A Cobrança Coativa da Dívida Ativa da União e a Dinâmica Processual da LEF

* **A Natureza Jurídica da Dívida Ativa e a Presunção de Certeza e Liquidez (CTN e LEF)**:
  A Dívida Ativa da União (DAU) abrange os créditos de natureza tributária e não tributária regularmente inscritos pelo órgão competente da Procuradoria-Geral da Fazenda Nacional (art. 2º da Lei nº 6.830/1980). A inscrição formal do débito gera a Certidão de Dívida Ativa (CDA), que ostenta presunção relativa (*iuris tantum*) de certeza, liquidez e exigibilidade (art. 204 do CTN e art. 3º da LEF). Essa presunção somente pode ser ilidida mediante prova inequívoca cabal carreada pelo executado ou por terceiro interessado.

* **Requisitos da CDA e Limites de Substituição (Súmula 392 do STJ)**:
  O art. 202 do CTN e o art. 2º, § 5º da LEF estabelecem os requisitos extrínsecos de validade do termo de inscrição e da CDA: nome do devedor e corresponsáveis, quantia devida, forma de cálculo dos juros e atualização, origem, natureza e fundamento legal da obrigação e data da inscrição. Conforme tese sumulada pelo Superior Tribunal de Justiça na **Súmula 392**:
  1. *Substituição ou Emenda Admissível*: A Fazenda Pública pode substituir ou emendar a CDA até a prolação da sentença dos embargos à execução, desde que o vício seja estritamente formal ou material;
  2. *Vedação Insuperável*: É terminantemente vedada a substituição da CDA para modificar o sujeito passivo da obrigação tributária originária (ex: incluir sócio ou redirecionar a execução modificando o lançamento), pois tal alteração exigiria novo lançamento de ofício com abertura de contraditório administrativo prévio.

* **Defesas do Executado: Embargos do Devedor vs. Exceção de Pré-Executividade**:
  1. *Embargos à Execução Fiscal (Art. 16 da LEF)*: Constituem verdadeira ação incidental autônoma de cognição ampla. Seu processamento subordina-se à garantia integral do juízo (por penhora, depósito em dinheiro, fiança bancária ou seguro-garantia), no prazo decadencial preclusivo de 30 (trinta) dias úteis a contar do aperfeiçoamento da garantia (Súmula 289/STJ);
  2. *Exceção de Pré-Executividade (Súmulas 279 e 393 do STJ)*: Construção doutrinária do Min. Pontes de Miranda amplamente recepcionada pelos tribunais. Trata-se de mero incidente processual nos próprios autos da execução fiscal, sem exigência de garantia prévia do juízo, limitado a matérias cognoscíveis de ofício pelo magistrado (decadência, prescrição, nulidade patente do título executivo, ilegitimidade manifesta) que prescindam de dilação probatória.

* **Ordem Preferencial de Penhora e Sistemas Eletrônicos (BacenJud/SisbaJud)**:
  O art. 835 do CPC e o art. 11 da LEF conferem primazia absoluta à penhora de dinheiro, em espécie ou em depósito bancário. O Superior Tribunal de Justiça, no julgamento do **Tema Repetitivo 578 (REsp 1.184.765)**, assentou que a penhora eletrônica de ativos financeiros via BacenJud/SisbaJud não exige o prévio esgotamento de diligências em busca de outros bens penhoráveis pelo credor público. A penhora sobre o faturamento da pessoa jurídica é subsidiária, dependendo da inexistência de outros bens penhoráveis ou da sua insuficiência, fixando-se percentual razoável que não inviabilize a continuidade da atividade empresarial (Tema Repetitivo 1.012 do STJ).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Cabimento Restrito da Exceção de Pré-Executividade (STJ e Súmula 393)",
        author: "STJ / Primeira Seção / Min. Teori Zavascki",
        thesis: "A exceção de pré-executividade é cabível exclusivamente quando a matéria for de ordem pública e estiver demonstrada de plano por prova documental pré-constituída, sendo defeso utilizá-la para perícias contábeis ou apuração fática complexa de excesso de execução.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Instrumentalidade Ampla das Defesas Executivas",
        author: "Doutrina Processualista Minoritária",
        thesis: "Sustentava que o magistrado poderia deferir produção de prova pericial célere no âmbito da própria exceção de pré-executividade para homenagear o princípio da menor onerosidade da execução (art. 805 do CPC).",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a Fazenda Nacional pode emendar a CDA para trocar o polo passivo da execução de pessoa jurídica para os sócios diretores (FALSO: a Súmula 392 do STJ proíbe expressamente a modificação do sujeito passivo da execução mediante substituição da CDA).",
      "Sustentar que o prazo para embargos à execução fiscal de 30 dias conta-se da data da intimação da penhora sem necessidade de aperfeiçoamento da constrição (O prazo conta-se do depósito, da juntada da fiança/seguro ou da intimação da penhora devidamente avaliada e reduzida a termo).",
      "Afirmar que a penhora de dinheiro via SisbaJud exige que a PGFN comprove antes a tentativa frustrada de localizar bens imóveis ou veículos do devedor (FALSO: o Tema 578 do STJ fixou que o dinheiro tem preferência legal absoluta e prescinde de prévio esgotamento de outras diligências)."
    ],
    careerNuances: {
      PGFN: "Competência privativa constitucional (art. 131, § 3º da CF) para apuração, inscrição e cobrança judicial e extrajudicial de toda a Dívida Ativa da União tributária e não tributária.",
      AGU: "Atuação no contencioso administrativo e civil da União direta sem interferência na gestão dos créditos tributários inscritos.",
      PF: "Execução fiscal de créditos não tributários de autarquias (multas do IBAMA, contribuições do CRM/CREA) sob as regras gerais da LEF sem envolver a DAU federal.",
      PBC: "Execução fiscal de multas administrativas aplicadas pelo Banco Central às instituições do SFN após inscrição em sua dívida ativa autárquica."
    }
  },

  // =========================================================================
  // 2. PRESCRIÇÃO INTERCORRENTE TRIBUTÁRIA E O TEMA 566 DO STJ
  // =========================================================================
  {
    id: "pfn-prescricao-intercorrente-art40-tema566",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Prescrição Intercorrente Tributária (Art. 40 da Lei nº 6.830/1980 e Tema Repetitivo 566 do STJ - REsp 1.340.553)",
    themeKeywords: [
      "prescrição intercorrente", "artigo 40 da lef", "tema 566 do stj", "resp 1.340.553",
      "suspensão de um ano", "arquivamento provisório", "prazo de 5 anos", "marcos interruptivos",
      "efetiva constrição", "decretação de ofício", "oitiva da fazenda pública"
    ],
    coreDoctrine: `#### ⏳ A Sistemática Uniforme da Prescrição Intercorrente na Execução Fiscal

* **O Modelo Bifásico do Art. 40 da Lei nº 6.830/1980**:
  O art. 40 da LEF disciplina a paralisação do processo executivo quando não forem localizados o devedor ou bens suficientes para a garantia da execução. A sistemática processual é estritamente cronológica e bifásica:
  1. *Fase de Suspensão (1 ano)*: O processo fica suspenso por 1 (um) ano. Durante este período anual preliminar, não corre a prescrição;
  2. *Fase de Arquivamento Provisório (5 anos)*: Decorrido o prazo de 1 ano de suspensão sem que tenham sido localizados o devedor ou bens penhoráveis, os autos são arquivados provisoriamente, momento em que se inicia de forma automática a contagem do prazo da prescrição intercorrente quinquenal (5 anos);
  3. *Prazo Total para a Extinção*: A prescrição intercorrente consuma-se após o decurso ininterrupto de 6 (seis) anos (1 ano de suspensão + 5 anos de arquivamento provisório).

* **A Tese Vinculante do Tema 566 do STJ (REsp 1.340.553/RS)**:
  A Primeira Seção do STJ pacificou em definitivo as diretrizes operacionais do art. 40 da LEF:
  - *Início Automático da Suspensão*: O prazo de 1 ano de suspensão tem início imediato na data em que a Fazenda Pública toma ciência inequívoca da não localização do devedor ou da ausência de bens penhoráveis no processo, sendo desnecessária prévia provocação ou decisão judicial de deferimento;
  - *Início Automático da Prescrição*: Findo o prazo de 1 ano, inicia-se de imediato o prazo de 5 anos da prescrição intercorrente, independentemente de despacho judicial determinando o arquivamento provisório ou de remessa física dos autos ao arquivo;
  - *Interrupção Qualificada da Prescrição*: A prescrição intercorrente só se interrompe pela efetiva constrição de bens penhoráveis e úteis (penhora de dinheiro, arresto, adjudicação) ou pela citação válida do devedor. Meros pedidos de reiteração de diligências frustradas, expedição de novos ofícios ou pedidos genéricos de suspensão não interrompem o curso prescricional;
  - *Efeito Retroativo da Interrupção*: A interrupção retroage à data em que a Fazenda Pública protocolou o requerimento de constrição que resultou frutífera;
  - *Decretação de Ofício com Contraditório Prévio (Art. 40, § 4º)*: O juiz pode reconhecer e declarar a prescrição intercorrente de ofício, mas é nula a decisão terminativa que não abrir vista prévia à Fazenda Pública para que esta demonstre eventual causa suspensiva ou interruptiva pretérita.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Sistemática Objetiva e Início Automático da Fluência (Tese Vinculante Tema 566/STJ)",
        author: "STJ / Primeira Seção / Min. Mauro Campbell Marques",
        thesis: "O prazo de 1 ano e o posterior prazo de 5 anos fluem ope legis a partir da ciência da ausência de bens, afastando a inércia indefinida da Fazenda e evitando que a execução fiscal se transforme em cobrança perpétua.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Dependência de Provocação Judicial Formal",
        author: "Tese Fazendária Primitiva (Superada)",
        thesis: "Defendia que o prazo de suspensão e o arquivamento só poderiam iniciar-se após expresso despacho interlocutório do magistrado com intimação formal da Procuradoria.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a mera reiteração de pedido de penhora eletrônica pelo SisbaJud interrompe a prescrição intercorrente mesmo sem a localização de valores (FALSO: conforme o Tema 566 do STJ, somente a penhora efetiva e frutífera interrompe a prescrição).",
      "Sustentar que o juiz pode extinguir a execução fiscal pela prescrição intercorrente de plano sem intimar a Fazenda Nacional (FALSO: o art. 40, § 4º da LEF exige a prévia oitiva da Fazenda Pública para possibilitar a arguição de causas impeditivas ou interruptivas).",
      "Confundir prescrição originária do crédito tributário (art. 174 do CTN - 5 anos da constituição definitiva até a citação ou despacho que a ordena) com a prescrição intercorrente (art. 40 da LEF - 1 ano de suspensão + 5 anos de arquivamento no curso da execução fiscal)."
    ],
    careerNuances: {
      PGFN: "Aferição em massa da prescrição intercorrente em sistemas automatizados, aplicando inteligência fiscal para localizar ativos antes do marco de 6 anos ou promover o cancelamento de débitos prescritos.",
      AGU: "Aplicação subsidiária das regras de prescrição do CPC/2015 em execuções de títulos executivos judiciais contra particulares.",
      PF: "Execução de multas administrativas autárquicas sob o mesmo art. 40 da LEF e jurisprudência do STJ.",
      PBC: "Controle da prescrição intercorrente na cobrança de penalidades pecuniárias de ex-administradores de bancos liquidados."
    }
  },

  // =========================================================================
  // 3. TRANSAÇÃO TRIBUTÁRIA E O CONTENCIOSO FISCAL RESOLUTIVO
  // =========================================================================
  {
    id: "pfn-transacao-tributaria-conformidade-lei13988",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Transação Tributária, Conformidade Fiscal e Resolução Consensual de Litígios (Lei nº 13.988/2020 e Portarias PGFN)",
    themeKeywords: [
      "transação tributária", "lei 13.988", "13.988", "13.988/2020", "transação por adesão",
      "transação individual", "ratings de recuperabilidade", "grau de recuperabilidade",
      "descontos legais", "negócio jurídico processual", "njp", "conformidade fiscal", "pgfn"
    ],
    coreDoctrine: `#### 🤝 O Marco Legal da Transação Tributária Federal e o Novo Contencioso Consensual

* **O Paradigma da Transação Tributária na Dívida Ativa da União (Lei nº 13.988/2020)**:
  Regulamentando a autorização matriz do art. 171 do Código Tributário Nacional, a Lei nº 13.988/2020 (alterada pelas Leis nº 14.375/2022 e 14.689/2023) estabeleceu o regime da transação tributária no âmbito federal. A PGFN deixou de atuar exclusivamente como cobradora forçada para operar programas de conformidade fiscal resolutiva, conciliando a satisfação prioritária do crédito público com a manutenção da fonte produtora, a preservação de empregos e a solvência das empresas.

* **Modalidades da Transação Tributária Federal**:
  1. *Transação por Adesão*: Realizada nos termos de edital público expedido pela PGFN, estabelecendo condições padronizadas, prazos e descontos aplicáveis aos devedores que preencham os requisitos objetivos;
  2. *Transação Individual*: Proposta pelo devedor ou pela PGFN, aplicável a devedores com débitos inscritos em valor consolidado superior ao patamar legal fixado em portaria (geralmente acima de R$ 10 milhões) ou empresas em recuperação judicial e falência;
  3. *Transação no Contencioso Tributário de Relevante e Disseminada Controvérsia Jurídica*: Destinada a encerrar disputas judiciais de massa que envolvam matérias tributárias repetitivas perante o CARF, STJ e STF.

* **Classificação dos Créditos e Ratings de Recuperabilidade (Portarias PGFN)**:
  A concessão de descontos e prazos diferenciados subordina-se à mensuração objetiva da capacidade de pagamento do sujeito passivo (*Capag*) e da recuperabilidade da dívida:
  - *Rating A*: Crédito com alta perspectiva de recuperação (sem descontos no principal, exigindo amortização regular);
  - *Rating B*: Crédito com média perspectiva de recuperação;
  - *Rating C*: Crédito de difícil recuperação;
  - *Rating D*: Crédito considerado irrecuperável (empresas falidas, executadas sem bens localizados por longo período). Os descontos mais elevados e parcelamentos estendidos incidem primordialmente sobre os ratings C e D.

* **Limites Legais de Concessão de Benefícios**:
  - *Descontos Pecuniários*: O desconto legal máximo pode alcançar até 65% (sessenta e cinco por cento) do valor total da dívida elegível, admitindo-se ampliação até 70% (setenta por cento) caso a transação envolva pessoa física, microempreendedor individual (MEI), microempresa (ME), empresa de pequeno porte (EPP), cooperativas ou santas casas de misericórdia;
  - *Prazo de Parcelamento*: Até 120 (cento e vinte) meses na regra geral, podendo alcançar até 145 (cento e quarenta e cinco) meses para MEIs, microempresas, empresas de pequeno porte e entidades educacionais ou de saúde sem fins lucrativos;
  - *Utilização de Precatórios e Créditos Acumulados*: A Lei nº 14.375/2022 autorizou expressamente a utilização de créditos de precatórios federais e prejuízo fiscal e base de cálculo negativa da CSLL para amortização do saldo devedor transacionado.

* **Negócio Jurídico Processual (NJP) em Execução Fiscal (Art. 190 do CPC)**:
  A PGFN normatizou o uso de Negócios Jurídicos Processuais no contencioso da Dívida Ativa, permitindo acordos processuais para aceitação de garantias prévias, substituição de constrições patrimoniais, alienação particular de bens penhorados e calendarização de atos processuais executivos.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Transação Tributária Vinculada à Capacidade Contributiva (Regime da Lei nº 13.988/2020)",
        author: "PGFN / Doutrina Tributária Contemporânea / STJ",
        thesis: "A transação não constitui renúncia fiscal incondicionada ou anistia imotivada, mas mecanismo técnico que equaliza a cobrança à real capacidade de pagamento do devedor, resguardando a moralidade tributária e a isonomia com os bons pagadores.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Indisponibilidade Patrimonial Rígida do Crédito Tributário",
        author: "Doutrina Fiscalista Clássica (Superada)",
        thesis: "Sustentava que qualquer concessão de desconto sobre juros e multas de dívida ativa violaria a indisponibilidade do patrimônio público, exigindo lei em sentido estrito individualizada para cada contribuinte.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a transação tributária federal autoriza a redução do valor principal do tributo devido sem amparo em rating de irrecuperabilidade (Os descontos incidem primordialmente sobre multas, juros e encargos legais; a redução do principal só é admitida para créditos formalmente irrecuperáveis e nos estritos limites da lei).",
      "Sustentar que devedores com capacidade de pagamento de rating A podem obter desconto de até 70% da dívida (FALSO: devedores com alta capacidade contributiva não fazem jus a descontos sobre o montante devido, tendo direito apenas a parcelamento ordinário).",
      "Afirmar que a rescisão da transação mantém hígidos os descontos concedidos (FALSO: o descumprimento das parcelas da transação acarreta a rescisão do acordo, a restauração integral do saldo devedor originário com juros e multas cheios e o imediato prosseguimento da execução fiscal)."
    ],
    careerNuances: {
      PGFN: "Órgão gestor nacional dos programas de transação tributária federal e dos acordos de conformidade da Dívida Ativa da União.",
      AGU: "Celebração de acordos e mediações de débitos contratuais e extracontratuais de natureza não fiscal perante a CCAF.",
      PF: "Utilização do modelo de transação da PGFN para cobrança de créditos de autarquias federais (ex: multas regulatórias da ANATEL e ANEEL).",
      PBC: "Termo de Compromisso e Acordos de Supervisão como sucedâneos consensuais nas infrações administrativas do SFN."
    }
  },

  // =========================================================================
  // 4. RESPONSABILIDADE TRIBUTÁRIA DOS SÓCIOS E REDIRECIONAMENTO
  // =========================================================================
  {
    id: "pfn-responsabilidade-socios-redirecionamento-ctn",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Responsabilidade Tributária de Sócios, Grupos Econômicos e Redirecionamento (Arts. 124, 134 e 135 do CTN)",
    themeKeywords: [
      "responsabilidade tributária", "artigo 135 do ctn", "redirecionamento", "sócio-gerente",
      "sócio-administrador", "dissolução irregular", "súmula 435 do stj", "tema 962 do stj",
      "tema 981 do stj", "súmula 430 do stj", "grupo econômico", "artigo 124 do ctn", "idpj"
    ],
    coreDoctrine: `#### 🏢 Desconsideração, Redirecionamento e Responsabilidade de Gestores Fiscais

* **A Responsabilidade por Infração à Lei do Art. 135, III do CTN**:
  O art. 135, III do Código Tributário Nacional estipula que os diretores, gerentes ou representantes de pessoas jurídicas de direito privado são pessoalmente responsáveis pelos créditos correspondentes a obrigações tributárias resultantes de atos praticados com excesso de poderes ou infração de lei, contrato social ou estatuto.

* **A Inadimplência Ordinária e a Súmula 430 do STJ**:
  O mero inadimplemento da obrigação tributária pela sociedade empresária não configura infração de lei apta a ensejar a responsabilidade pessoal dos sócios administradores. Trata-se da consolidada **Súmula 430 do STJ**: 'O inadimplemento da obrigação tributária pela sociedade não gera, por si só, a responsabilidade solidária do sócio-gerente'. O não recolhimento de tributo decorrente de crise econômica ou desequilíbrio financeiro constitui risco da atividade empresarial.

* **A Presunção de Dissolução Irregular (Súmula 435 do STJ)**:
  A presunção de ato ilícito apto a deflagrar o redirecionamento surge na hipótese de dissolução irregular: **Súmula 435 do STJ**: 'Presume-se dissolvida irregularmente a empresa que deixar de funcionar no seu domicílio fiscal, sem comunicação aos órgãos competentes, legitimando o redirecionamento da execução fiscal para o sócio-gerente'. A certidão do Oficial de Justiça atestando que a empresa encerrou as atividades no endereço cadastrado sem baixa regular nos órgãos públicos basta para autorizar o redirecionamento.

* **O Marco Temporal do Redirecionamento: Temas 962 e 981 do STJ**:
  A jurisprudência qualificada da Primeira Seção do STJ fixou balizas temporais precisas para o redirecionamento fundado em dissolução irregular:
  1. *Tema Repetitivo 962*: O redirecionamento da execução fiscal para o sócio-gerente na hipótese de dissolução irregular pressupõe que o sócio estivesse no exercício da administração ao tempo da dissolução irregular, sendo descabido redirecionar contra quem já havia se retirado legitimamente da sociedade antes do encerramento fático das atividades;
  2. *Tema Repetitivo 981*: Em contrapartida, é plenamente legítimo o redirecionamento contra o sócio com poderes de administração no momento da dissolução irregular, ainda que ele não exercesse a gerência à época do fato gerador do tributo. É o ato ilícito de dissolução irregular que atrai a incidência do art. 135, III do CTN.

* **Solidariedade de Grupo Econômico (Art. 124, I do CTN) vs. IDPJ**:
  A existência de grupo econômico meramente societário ou coordenação contratual não gera solidariedade tributária automática entre as empresas componentes. Para a caracterização da solidariedade passiva do art. 124, I do CTN ('interesse comum na situação que constitua o fato gerador'), impõe-se a demonstração de confusão patrimonial, identidade fraudulenta de gestão ou esvaziamento premeditado de ativos entre as sociedades coligadas. Nesses casos de desvio de finalidade ou fraude societária, impõe-se a instauração do Incidente de Desconsideração da Personalidade Jurídica (IDPJ) na forma do art. 133 e seguintes do CPC.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Marco Temporal da Dissolução Irregular (STJ Temas 962 e 981)",
        author: "STJ / Primeira Seção / Min. Assusete Magalhães",
        thesis: "A responsabilidade tributária pessoal do sócio nasce com o ato ilícito de dissolução irregular das atividades, vinculando o administrador que operava na data do encerramento fático sem liquidação regular.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teoria da Coincidência Temporal Dupla",
        author: "Corrente Empresarialista Restritiva",
        thesis: "Sustentava que o sócio só poderia ser responsabilizado se cumulativamente exercesse a gestão na data da ocorrência do fato gerador e também na data da dissolução irregular.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que o sócio cotista que não exerce poderes de administração pode ser responsabilizado pelo art. 135 do CTN em caso de dissolução irregular (FALSO: a responsabilidade é restrita aos sócios que exercem efetivos poderes de gestão e administração).",
      "Sustentar que a simples falta de pagamento do tributo declarado em DCTF autoriza o redirecionamento imediato para o sócio-gerente (FALSO: a Súmula 430 do STJ exige prova de infração à lei, excesso de poderes ou dissolução irregular).",
      "Afirmar que o sócio que se retirou regularmente da administração responde pela dissolução irregular perpetrada anos depois pelos novos sócios (FALSO: o Tema 962 do STJ veda o redirecionamento contra ex-administrador que não participou da dissolução irregular)."
    ],
    careerNuances: {
      PGFN: "Condução prioritária das medidas de redirecionamento, combate à blindagem patrimonial e investigação de fraudes fiscais estruturadas no âmbito da Dívida Ativa da União.",
      AGU: "Defesa de agentes públicos que fiscalizam ou apuram fraudes de administradores perante o TCU e Justiça Federal.",
      PF: "Redirecionamento de execuções fiscais de créditos previdenciários do INSS ou multas de autarquias ambientais.",
      PBC: "Responsabilidade patrimonial e indisponibilidade de bens de administradores de instituições financeiras submetidas a liquidação extrajudicial (Lei nº 6.024/1974)."
    }
  },

  // =========================================================================
  // 5. REFORMA TRIBUTÁRIA DO CONSUMO (EC 132/2023) E O NOVO IVA DUAL
  // =========================================================================
  {
    id: "pfn-reforma-tributaria-cbs-ibs-imposto-seletivo",
    discipline: "DIREITO TRIBUTÁRIO",
    title: "Reforma Tributária sobre o Consumo (EC nº 132/2023), CBS, IBS, Imposto Seletivo e Transição Federativa",
    themeKeywords: [
      "emenda constitucional 132", "ec 132", "reforma tributária", "cbs",
      "contribuição sobre bens e serviços", "ibs", "imposto sobre bens e serviços",
      "imposto seletivo", "iva dual", "princípio do destino", "não cumulatividade plena",
      "crédito financeiro", "comitê gestor"
    ],
    coreDoctrine: `#### 🔄 A Nova Matriz Constitucional dos Tributos sobre o Consumo (EC nº 132/2023)

* **O Modelo Estruturante do IVA Dual Brasileiro**:
  A Emenda Constitucional nº 132/2023 operou a maior reformulação do Sistema Tributário Nacional desde 1988, substituindo cinco tributos indiretos cumulativos e fragmentados (PIS, COFINS e IPI federais; ICMS estadual; e ISS municipal) pelo modelo do Imposto sobre Valor Agregado Dual (IVA Dual):
  1. *CBS (Contribuição sobre Bens e Serviços - Art. 195, V da CF)*: De competência privativa da União, instituída por lei complementar federal, substituindo o PIS e a COFINS;
  2. *IBS (Imposto sobre Bens e Serviços - Art. 156-A da CF)*: De competência compartilhada entre Estados, Distrito Federal e Municípios, gerido pelo Comitê Gestor do IBS, substituindo o ICMS e o ISS;
  3. *Imposto Seletivo (IS - Art. 153, VIII da CF)*: Tributo federal de competência privativa da União, com finalidade marcadamente extrafiscal, incidente sobre a produção, extração, comercialização ou importação de bens e serviços prejudiciais à saúde ou ao meio ambiente.

* **Princípios Basilares do Novo Regime de Tributação**:
  - *Princípio da Tributação no Destino*: A arrecadação do IBS e da CBS passa a pertencer ao ente federativo onde ocorre o consumo final do bem ou serviço, extinguindo a guerra fiscal entre Estados e Municípios que concediam incentivos na origem;
  - *Não Cumulatividade Plena (Crédito Financeiro)*: Supera o modelo restritivo de crédito físico do ICMS e PIS/COFINS. O contribuinte tem direito à apropriação imediata de créditos sobre a totalidade das aquisições de bens e serviços utilizados em sua atividade produtiva (crédito financeiro integral), ressalvadas aquisições de uso e consumo pessoal;
  - *Base Ampla e Uniformidade Nacional*: Incidência sobre qualquer operação com bens materiais ou imateriais (inclusive direitos e propriedade intelectual) e serviços;
  - *Transparência e Não Inclusão na Própria Base (Cálculo por Fora)*: O IBS e a CBS não comporão a sua própria base de cálculo, nem integrarão a base de incidência um do outro ou do Imposto Seletivo.

* **O Imposto Seletivo (Art. 153, VIII da CF)**:
  Conhecido internacionalmente como *sin tax* (imposto do pecado), o Imposto Seletivo possui natureza inibitória:
  - Não incide sobre exportações nem sobre operações com energia elétrica e telecomunicações;
  - Poderá incidir sobre a extração de recursos minerais e petróleo, cobrado no momento da extração, independentemente da destinação, até o limite de 1% do valor de mercado;
  - Integra a base de cálculo do ICMS/ISS na fase de transição e integrará a base da CBS e do IBS.

* **Atuação da PGFN no Período de Transição (2026 a 2033)**:
  A transição será escalonada entre 2026 e 2032, com a CBS e o IBS sendo instituídos inicialmente com alíquotas de teste de 0,9% e 0,1% em 2026, com extinção progressiva dos tributos antigos até 2033. Cabe à PGFN assessorar o Ministério da Fazenda na elaboração dos projetos de lei complementar (PLPs de regulamentação), emitir pareceres de constitucionalidade e atuar na governança da transição de receitas do Tesouro Nacional.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Crédito Financeiro Pleno e Não Cumulatividade Neutra (Matriz da EC 132/2023)",
        author: "EC nº 132/2023 / Doutrina Reformista / Ministério da Fazenda",
        thesis: "O novo IVA dual impede o acúmulo de resíduos tributários na cadeia econômica, garantindo a desoneração total dos investimentos e das exportações mediante crédito amplo e ressarcimento célere de saldos credores.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Críticas ao Modelo de Comitê Gestor Federativo",
        author: "Correntes Municipalistas Tradicionais",
        thesis: "Sustenta que a concentração da arrecadação e partilha do IBS em comitê gestor centralizado enfraquece a autonomia política e a capacidade decisória tributária individual dos Municípios.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que o Imposto Seletivo pode incidir sobre exportações de manufaturados brasileiros (FALSO: o art. 153, § 6º, I da CF veda expressamente a incidência do Imposto Seletivo sobre as exportações).",
      "Sustentar que a CBS e o IBS incidirão 'por dentro' integrando sua própria base de cálculo como ocorria com o ICMS antigo (FALSO: o novo texto constitucional impõe expressamente a tributação 'por fora', não compondo a própria base nem a base do outro tributo).",
      "Afirmar que o IBS é tributo federal gerido pela Secretaria da Receita Federal do Brasil (FALSO: o IBS é imposto subnacional de Estados e Municípios, gerido pelo Comitê Gestor do IBS; a CBS é que é federal e gerida pela Receita Federal/PGFN)."
    ],
    careerNuances: {
      PGFN: "Elaboração das normas regulamentadoras da CBS, defesa da higidez fiscal dos créditos federais nos tribunais e representação da União na modelagem do Comitê Gestor.",
      AGU: "Defesa da constitucionalidade das leis complementares da Reforma Tributária em sede de controle concentrado perante o STF.",
      PF: "Consultoria sobre a repercussão da extinção do PIS/COFINS nas contratações e reequilíbrio econômico-financeiro de contratos de autarquias federais.",
      PBC: "Regulamentação e interoperabilidade dos sistemas de pagamentos eletrônicos com o split payment do IBS e CBS."
    }
  },

  // =========================================================================
  // 6. DIREITO FINANCEIRO DA FAZENDA NACIONAL E A REGRA DE OURO
  // =========================================================================
  {
    id: "pfn-direito-financeiro-divida-publica-regra-de-ouro",
    discipline: "DIREITO FINANCEIRO E ECONÔMICO",
    title: "Direito Financeiro da Fazenda Nacional: Dívida Pública Mobiliária Federal, Regra de Ouro e Controle de Precatórios",
    themeKeywords: [
      "dívida pública mobiliária", "títulos do tesouro", "tesouro nacional", "regra de ouro",
      "artigo 167 inciso iii", "operações de crédito", "despesas de capital", "senado federal",
      "limites da lrf", "lc 101", "precatórios federais", "passivos contingentes"
    ],
    coreDoctrine: `#### 💰 Gestão da Dívida Pública Federal, Responsabilidade Fiscal e Controle Orçamentário

* **Dívida Pública Mobiliária Federal e Competência da PGFN**:
  A Dívida Pública Federal divide-se em dívida consolidada (fundada) e dívida flutuante. A Dívida Pública Mobiliária Federal (DPMF) compreende os títulos emitidos pelo Tesouro Nacional (Letras do Tesouro Nacional - LTN, Letras Financeiras do Tesouro - LFT e Notas do Tesouro Nacional - NTN) para financiamento do déficit orçamentário e gestão da política fiscal. A PGFN atua como consultoria jurídica privativa do Tesouro Nacional na modelagem de emissões externas (bônus globais e títulos soberanos sustentáveis) e na estruturação dos contratos de garantia da União.

* **A Regra de Ouro Constitucional (Art. 167, III da CF/88)**:
  A Regra de Ouro é um postulado fiscal nuclear que proíbe a realização de operações de crédito que excedam o montante das despesas de capital (investimentos, inversões financeiras e amortização da dívida). O objetivo é impedir que o Estado contraia dívidas para custear despesas correntes (salários, custeio e benefícios sociais), resguardando as futuras gerações:
  - *Ressalva Constitucional*: A única exceção admitida pela Constituição é a autorização mediante créditos suplementares ou especiais com finalidade precisa, aprovados expressamente pelo Poder Legislativo por maioria absoluta de votos de seus membros.

* **Limites de Endividamento da LRF e o Papel do Senado Federal**:
  A Lei de Responsabilidade Fiscal (Lei Complementar nº 101/2000, arts. 30 e 32) disciplinou a fixação de limites para a dívida consolidada líquida dos entes da Federação. A fixação dos limites globais para o montante da dívida pública federal, estadual e municipal é competência privativa do Senado Federal (art. 52, VI e VII da CF), mediante proposta do Presidente da República.

* **Precatórios Judiciais e Riscos Fiscais da Fazenda Nacional**:
  O acompanhamento e provisionamento dos precatórios e passivos judiciais da União constitui atividade estratégica conjunta da PGFN e da Secretaria do Tesouro Nacional. No anexo de riscos fiscais da Lei de Diretrizes Orçamentárias (LDO), a PGFN apura os litígios fiscais de grande impacto econômico perante o STF e STJ, quantificando o risco de perda (provável, possível ou remoto) para fins de conformidade com as metas de superávit primário da LRF.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Eficácia Vinculante e Cogente da Regra de Ouro (Constituição e LRF)",
        author: "STF / TCU / Secretaria do Tesouro Nacional / PGFN",
        thesis: "A violação da Regra de Ouro configura crime de responsabilidade do Presidente da República e infração contra as finanças públicas, sendo inidônea qualquer manobra contábil que busque classificar despesas correntes de manutenção como despesas de capital.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Teorias Heterodoxas de Flexibilização em Crise",
        author: "Correntes Econômicas Desenvolvimentistas",
        thesis: "Defendia que em momentos de grave recessão econômica e emergência social a Regra de Ouro deveria ser automaticamente suspensa sem necessidade de prévia aprovação congressual por maioria absoluta.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a Regra de Ouro proíbe totalmente a emissão de títulos públicos que superem as despesas de capital (FALSO: o art. 167, III admite expressamente a superação mediante créditos adicionais aprovados pela maioria absoluta do Congresso Nacional).",
      "Sustentar que a fixação dos limites globais de endividamento da União compete ao Congresso Nacional por lei ordinária (FALSO: o art. 52, VI da CF atribui competência privativa ao Senado Federal por meio de resolução).",
      "Confundir dívida pública flutuante com dívida fundada (A dívida flutuante é de curto prazo, inferior a 12 meses, englobando restos a pagar e depósitos; a fundada decorre de compromissos com exigibilidade superior a 12 meses)."
    ],
    careerNuances: {
      PGFN: "Assessoria jurídica exclusiva e de excelência ao Tesouro Nacional e ao Ministério da Fazenda na contratação de dívida pública interna e externa.",
      AGU: "Defesa orçamentária dos Ministérios perante ações populares e impugnações judiciais a despesas de custeio.",
      PF: "Consultoria e fiscalização financeira de orçamentos e fundos de autarquias de infraestrutura (Fundo da Marinha Mercante, FUST, Funtel).",
      PBC: "Execução da política monetária por meio das operações compromissadas e controle da liquidez bancária com títulos do Tesouro Nacional."
    }
  }
];
