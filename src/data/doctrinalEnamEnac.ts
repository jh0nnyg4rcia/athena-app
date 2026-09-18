/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DoctrinalModule } from "./doctrinalRepository";

export const DOCTRINAL_ENAM_ENAC: DoctrinalModule[] = [
  // =========================================================================
  // 1. ENAC: REGISTRO DE IMÓVEIS E PRINCÍPIOS REGISTRAIS (LEI 6.015/1973)
  // =========================================================================
  {
    id: "enac-principios-registrais-imobiliarios",
    discipline: "DIREITO NOTARIAL E REGISTRAL",
    title: "Princípios Fundamentais do Registro de Imóveis e Sistema de Matrículas",
    themeKeywords: [
      "registro de imóveis", "fólio real", "matrícula", "princípios registrais", 
      "continuidade", "especialidade objetiva", "especialidade subjetiva", "prioridade", 
      "prenotação", "legalidade qualificada", "qualificação registral", "inscrição", "trato sucessivo"
    ],
    coreDoctrine: `#### 🏛️ Teoria Geral dos Princípios Registrais Imobiliários (Lei nº 6.015/1973)

* **Fundamento Constitucional e Regime da Atividade**:
  Os serviços notariais e de registro são exercidos em caráter privado, por delegação do Poder Público (art. 236 da CF/88 e Lei nº 8.935/1994). O Registro de Imóveis tem por escopo conferir **autenticidade, segurança, eficácia e publicidade** aos atos jurídicos constitutivos, modificativos ou extintivos de direitos reais sobre bens imóveis (art. 1º da LRP).

* **O Princípio do Fólio Real e a Matrícula Imobiliária (Arts. 176 e 227 da LRP)**:
  Com a vigência da Lei nº 6.015/1973, o Brasil superou o antigo modelo do fólio pessoal (Livro 3 de Transcrições) e instituiu o **Fólio Real (Livro 2)**. A matrícula é o ato inaugural que cria a cédula de identidade jurídica do imóvel:
  1. **Princípio da Unitariedade Matricial**: Cada imóvel deve corresponder a uma única matrícula, e cada matrícula deve conter a descrição georreferenciada de um único imóvel. É vedada a duplicidade de matrículas para o mesmo imóvel.
  2. **Atos Praticados na Matrícula**:
     * **Registro em Sentido Estrito (Art. 167, I)**: Ato causal translativo ou constitutivo de direito real (compra e venda, doação, alienação fiduciária, hipoteca, servidão, usucapião).
     * **Averbação (Art. 167, II)**: Ato acessório que noticia alterações subjetivas ou objetivas que não geram novo direito real por si sós (mudança de estado civil, construção, demolição, cancelamento de ônus, penhora judicial).

* **Princípios Estruturantes da Qualificação Registral Imobiliária**:
  * **Princípio da Continuidade (Trato Sucessivo - Arts. 195 e 237 da LRP)**: Nenhum registro pode ser feito sem que previamente esteja registrado o título do outorgante. Exige-se cadeia causal ininterrupta de titularidades.
  * **Princípio da Especialidade Objetiva e Subjetiva (Arts. 176 e 225 da LRP)**:
    * *Objetiva*: Descrição pormenorizada do bem com confrontações, medidas perimétricas, área superficial e amarração com a malha municipal ou georreferenciamento rural (Lei nº 10.267/2001).
    * *Subjetiva*: Qualificação individualizadora completa das partes (nome, nacionalidade, estado civil, regime de bens, profissão, domicílio e número do CPF/CNPJ).
  * **Princípio da Prioridade e Prenotação (Arts. 182, 186 e 205 da LRP)**: O protocolo do título confere prioridade de grau de direitos reais. O prazo legal de vigência da prenotação é de **20 (vinte) dias corridos** com o advento da Lei nº 14.382/2022 (reduzindo a antiga regra de 30 dias para os títulos eletrônicos padronizados).
  * **Princípio da Legalidade Qualificada**: O oficial registrador exerce juízo preventivo de legalidade no momento da qualificação, recusando títulos nulos ou em desacordo com a ordem pública, mesmo que emanados de autoridade judicial. Conforme jurisprudência firme do STJ e do CNJ, o registrador tem o dever funcional de qualificar ordens e mandados judiciais quanto à continuidade e especialidade.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Qualificação Ampla de Títulos Judiciais (Majoritária no CNJ e Tribunais Superiores)",
        author: "STJ e Conselho Nacional de Justiça (Provimento nº 149/2023)",
        thesis: "A origem judicial do título não o imuniza contra a qualificação registral. O registrador deve obstar o registro de mandado judicial que afronte a continuidade subjetiva ou a especialidade do imóvel, sem que isso configure crime de desobediência.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Imunidade Relativa dos Mandados Judiciais (Minoritária)",
        author: "Doutrina Processualista Tradicional",
        thesis: "O registrador imobiliário, na condição de delegatário, não detém competência funcional para sindicar comandos jurisdicionais transitados em julgado, devendo cumprir prontamente a ordem sob pena de desacato.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a prenotação do título no Livro 1 Protocolo assegura prioridade registral por prazo indefinido. Erro: o prazo é decadencial e expira se o interessado não cumprir a nota de exigência dentro do prazo legal.",
      "Considerar que ordem judicial de penhora ou desapropriação dispensa a prévia abertura de matrícula e observância da continuidade registral. Erro: mesmo a desapropriação requer estrita observância da especialidade objetiva.",
      "Confundir registro com averbação nas questões da FGV: penhora, cancelamento de hipoteca e mudança de nome de rua averbam-se no Livro 2; doação, compra e venda e constituição de alienação fiduciária registram-se."
    ],
    careerNuances: {
      ENAC: "O candidato ao ENAC deve dominar o procedimento de dúvida registral (art. 198 da LRP), o exame formal dos títulos no prazo de 10 dias e o cancelamento automático da prenotação se as exigências não forem satisfeitas no prazo legal.",
      ENAM: "No ENAM, o magistrado precisa compreender que a decisão na dúvida registral inversa ou direta possui natureza estritamente administrativa, não gerando coisa julgada material nem precluindo o acesso à via contenciosa ordinária."
    }
  },

  // =========================================================================
  // 2. ENAC: MARCO LEGAL DAS GARANTIAS (LEI 14.711/2023)
  // =========================================================================
  {
    id: "enac-marco-legal-garantias-14711",
    discipline: "DIREITO NOTARIAL E REGISTRAL",
    title: "Marco Legal das Garantias (Lei nº 14.711/2023) e Execução Extrajudicial",
    themeKeywords: [
      "marco legal das garantias", "lei 14.711", "alienação fiduciária", "execução extrajudicial de hipoteca", 
      "agente de garantias", "purga da mora", "leilão extrajudicial", "recarregamento de garantia", 
      "intimação por correio", "consolidação da propriedade", "excussão de garantias"
    ],
    coreDoctrine: `#### 🛡️ O Marco Legal das Garantias (Lei nº 14.711/2023) no Direito Notarial e Registral

* **Objetivo Sistemático da Lei nº 14.711/2023**:
  O diploma remodelou o microssistema de crédito e garantias no Brasil, outorgando eficiência executiva mediante a desjudicialização das execuções garantidas por bens móveis e imóveis, reduzindo custos de transação e fortalecendo o papel institucional dos cartórios de Registro de Imóveis, Registro de Títulos e Documentos e Tabelionatos de Protesto.

* **Execução Extrajudicial da Hipoteca perante o Registro de Imóveis (Arts. 9º a 11 da Lei 14.711/2023)**:
  A Lei nº 14.711/2023 universalizou o rito de execução extrajudicial para créditos hipotecários concedidos por qualquer credor (e não apenas pelo Sistema Financeiro da Habitação sob o Decreto-Lei 70/1966):
  1. **Requerimento**: O credor hipotecário apresenta certidão da dívida ao Oficial do Registro de Imóveis da circunscrição do bem.
  2. **Intimação do Devedor**: O devedor hipotecante é intimado para pagar a dívida em **15 (quinze) dias**, admitida intimação por carta com aviso de recebimento (AR) ou por hora certa.
  3. **Ausência de Pagamento**: Não purgada a mora, o oficial emite certidão de autorização para leilão público extrajudicial do imóvel, conduzido por leiloeiro oficial credenciado.

* **Inovações na Alienação Fiduciária de Imóveis (Lei nº 9.514/1997 com Redação da Lei nº 14.711/2023)**:
  * **Intimação Pessoal e por Correio**: A intimação para purga da mora pode ser efetuada pessoalmente pelo oficial, por carta com AR entregue no domicílio do devedor ou a funcionário da portaria de condomínio edilício.
  * **Prazo de Consolidação da Propriedade**: Esgotado o prazo de 15 dias sem purga da mora, o oficial certifica o fato, e o credor dispõe de prazo para recolher o **ITBI**. Apenas com a comprovação do pagamento do imposto translativo e taxa judiciária é consolidada a propriedade no fólio real.
  * **Regime dos Leilões Públicos (Art. 27 da Lei 9.514/1997)**:
    * *1º Leilão*: Prazo de 30 dias contados da consolidação, pelo valor estipulado no contrato atualizado.
    * *2º Leilão*: Realizado em até 15 dias subsequentes, aceitando-se o maior lance oferecido, desde que igual ou superior ao valor integral da dívida, das despesas, dos prêmios de seguro e dos encargos legais.
    * *Efeito Extintivo da Dívida*: No 2º leilão, se o maior lance for inferior ao valor mínimo estipulado, considera-se extinta a dívida e exonerado o credor da obrigação de indenizar o devedor, com quitação mútua recíproca.

* **A Figura do Agente de Garantias (Art. 853-A do Código Civil)**:
  Qualquer credor ou conjunto de credores pode designar um agente de garantias, pessoa física ou jurídica, para atuar em nome próprio e em benefício dos credores na constituição, registro, gestão e execução extrajudicial da garantia real ou fiduciária. Os bens e direitos vinculados à garantia constituem **patrimônio de afetação** incomunicável com os bens particulares do agente de garantias.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Constitucionalidade Plena da Execução Extrajudicial (Jurisprudência Vinculante do STF)",
        author: "STF (Tema 1.095 da Repercussão Geral, RE 860.631)",
        thesis: "É constitucional o procedimento de execução extrajudicial nos contratos de alienação fiduciária e hipoteca, não violando os princípios da inafastabilidade da jurisdição, do devido processo legal, do contraditório e da ampla defesa, haja vista a garantia do controle judicial diferido e a atuação qualificada do oficial registrador.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Inconstitucionalidade por Supressão da Reserva de Jurisdição (Tese Superada)",
        author: "Corrente Doutrinária Garantista Clássica",
        thesis: "A expropriação forçada de patrimônio sem controle judicial antecedente viola o monopólio da jurisdição estatal e o direito fundamental à moradia.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Supor que a execução extrajudicial da hipoteca da Lei 14.711/2023 exige sentença condenatória prévia. Erro: trata-se de procedimento exclusivamente extrajudicial processado perante o Cartório de Registro de Imóveis.",
      "Afirmar que o credor fiduciário pode consolidar a propriedade em seu nome sem comprovar o recolhimento prévio do ITBI. Erro: a Lei 14.711/2023 condicionou expressamente a consolidação no cartório à exibição da guia paga de ITBI.",
      "Esquecer que o patrimônio sob custódia do agente de garantias não se comunica com sua massa falida nem responde por suas dívidas fiscais ou trabalhistas particulares (regime de afetação patrimonial estrito)."
    ],
    careerNuances: {
      ENAC: "Para o delegado cartorário, é vital dominar o cálculo das custas e emolumentos proporcionais nos atos da Lei 14.711/2023 e as formalidades dos editais quando o fiduciante estiver em local incerto.",
      ENAM: "Para o juiz no ENAM, o tema é cobrado em tutelas provisórias de urgência requeridas por devedores para suspender leilões extrajudiciais, exigindo do magistrado o indeferimento da liminar quando ausente depósito integral ou prova de vício na intimação."
    }
  },

  // =========================================================================
  // 3. ENAC: SERP E MODERNIZAÇÃO DOS REGISTROS (LEI 14.382/2022)
  // =========================================================================
  {
    id: "enac-modernizacao-serp-14382",
    discipline: "DIREITO NOTARIAL E REGISTRAL",
    title: "SERP (Lei nº 14.382/2022), Adjudicação Compulsória Extrajudicial e Nome Civil",
    themeKeywords: [
      "serp", "lei 14.382", "sistema eletrônico dos registros públicos", "adjudicação compulsória extrajudicial", 
      "extratos eletrônicos", "alteração de nome", "prenome imotivado", "sobrenome de família", 
      "redução de prazos registrais", "artigo 216-b lrp"
    ],
    coreDoctrine: `#### 🌐 A Lei de Modernização dos Registros Públicos (Lei nº 14.382/2022) e o SERP

* **O Sistema Eletrônico dos Registros Públicos (SERP)**:
  Criado para unificar eletronicamente as serventias de Registro de Imóveis, Registro Civil de Pessoas Naturais, Registro de Títulos e Documentos e Registro Civil de Pessoas Jurídicas:
  1. **Finalidade**: Consulta e certidões em tempo real, recepção e envio de documentos eletrônicos estruturados, comunicações compulsórias entre órgãos públicos e visualização remota de matrículas e assentos.
  2. **Extrato Eletrônico Padronizado**: Autorizou o registro de atos translativos ou declaratórios com base em extratos eletrônicos contendo elementos essenciais do negócio jurídico, dispensando a apresentação física do instrumento integral quando emitido por órgãos públicos, instituições financeiras ou tabelionatos de notas.

* **Adjudicação Compulsória Extrajudicial (Artigo 216-B da Lei nº 6.015/1973)**:
  Mecanismo revolucionário de desjudicialização que permite ao promitente comprador obter a propriedade definitiva do imóvel perante o Oficial de Registro de Imóveis:
  * **Documentos Obrigatórios**:
    1. Instrumento de promessa de compra e venda ou de cessão de direitos, com quitação integral do preço;
    2. Certidões forenses de inexistência de litígio judicial sobre o contrato;
    3. Comprovante de recolhimento do imposto de transmissão imobiliária (ITBI);
    4. **Ata Notarial** lavrada por Tabelião de Notas atestando a regularidade formal, a quitação e o decurso do tempo.
  * **Notificação do Promitente Vendedor**: O oficial notifica o proprietário tabular alienante para concordar ou impugnar o pedido em **15 (quinze) dias**.
  * **Efeito do Silêncio**: Decorrido o prazo legal de 15 dias sem impugnação fundamentada, o silêncio do titular registral **importará expressa concordância**, procedendo o registrador à imediata adjudicação compulsória do imóvel em nome do adquirente.

* **Revolução no Direito ao Nome Civil no RCPN (Arts. 56 e 57 da LRP)**:
  * **Alteração do Prenome (Art. 56)**: Qualquer pessoa, após atingir a maioridade civil (18 anos), pode alterar seu prenome **diretamente em cartório de RCPN**, independentemente de decisão judicial e independentemente de justa causa ou justificativa, por uma única vez.
  * **Alteração de Sobrenomes (Art. 57)**: Permite o acréscimo ou supressão de sobrenomes de família, sobrenome de cônjuge ou companheiro, inclusão do sobrenome do padrasto ou madrasta (sociafetividade), diretamente no cartório de registro civil, mediante requerimento fundamentado e certidões negativas forenses.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Eficácia Plena do Silêncio Qualificado na Adjudicação Extrajudicial",
        author: "Corregedoria Nacional de Justiça e Doutrina Registral Majoritária",
        thesis: "O silêncio do proprietário notificado no art. 216-B da LRP é legalmente tarifado como anuência tácita ficta, conferindo legitimidade imediata para a prática do ato translativo registral sem necessidade de homologação pelo juiz de direito.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Necessidade de Ratificação Judicial Expressa (Tese Rejeitada)",
        author: "Corrente Judicialista Residual",
        thesis: "Por implicar perda involuntária do direito de propriedade, a transferência coercitiva por adjudicação compulsória demandaria chancela judicial expressa.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Acreditar que a alteração de prenome no cartório de RCPN após os 18 anos exige comprovação de constrangimento social ou erro gráfico. Erro: a Lei 14.382/2022 suprimiu a exigência de justa causa, autorizando alteração imotivada.",
      "Afirmar que a ata notarial é dispensável no requerimento de adjudicação compulsória extrajudicial. Erro: a ata notarial lavrada por tabelião é documento estritamente obrigatório nos termos do art. 216-B, § 1º, III da LRP.",
      "Confundir o prazo de impugnação da adjudicação extrajudicial (15 dias) com o prazo geral de suscitação de dúvida registral (15 dias)."
    ],
    careerNuances: {
      ENAC: "O titular do RCPN e do RI deve zelar pelo controle das certidões criminais na alteração de nome civil e conferir meticulosamente a quitação tributária do ITBI na adjudicação compulsória.",
      ENAM: "No ENAM, o tema desponta em conflitos de vizinhança ou demandas anulatórias ajuizadas por terceiros prejudicados por fraude contra credores na adjudicação extrajudicial."
    }
  },

  // =========================================================================
  // 4. ENAC: CÓDIGO NACIONAL DE NORMAS DO CNJ (PROVIMENTO 149/2023)
  // =========================================================================
  {
    id: "enac-provimento-149-2023-cnj",
    discipline: "DIREITO NOTARIAL E REGISTRAL",
    title: "Código Nacional de Normas da Corregedoria Nacional de Justiça (Provimento 149/2023)",
    themeKeywords: [
      "provimento 149 2023", "código nacional de normas", "e-notariado", "onr", "censec", 
      "cenprot", "crc nacional", "qualificação remota", "competência territorial notarial", 
      "escritura pública eletrônica", "livros obrigatórios", "duplicata escritural"
    ],
    coreDoctrine: `#### 📜 Consolidação Normativa da Corregedoria Nacional (Provimento CNJ nº 149/2023)

* **Estatuto Normativo Unificado dos Serviços Extrajudiciais**:
  O Provimento nº 149/2023 consolidou as normas da Corregedoria Nacional de Justiça sobre os serviços notariais e de registro no Brasil, revogando atos normativos esparsos anteriores e unificando os parâmetros de tecnologia, segurança jurídica e disciplina funcional.

* **A Plataforma e-Notariado e os Atos Notariais Eletrônicos (Arts. 280 a 300)**:
  * **Competência Territorial Exclusiva para Escrituras Eletrônicas (Art. 283)**:
    A prática de atos notariais eletrônicos por videoconferência exige estrita observância da competência territorial fixada no Provimento 149/2023:
    1. Tratando-se de negócio imobiliário, é competente o Tabelião de Notas do **domicílio do adquirente** ou o do **local da situação do imóvel**;
    2. Se houver múltiplos adquirentes com domicílios distintos ou imóveis em comarcas diversas, a escolha cabe às partes dentre quaisquer das circunscrições competentes;
    3. Tratando-se de ato sem transmissão imobiliária (procuração, testamento, declaração), a competência é a do domicílio do outorgante.
  * **Assinatura Eletrônica Aceita**: Admite-se tanto a assinatura qualificada com certificado digital ICP-Brasil quanto a assinatura eletrônica avançada notarizada (Certificado Notarizado emitido gratuitamente pelo e-Notariado).

* **Centrais Unificadas de Serviços Eletrônicos Compartilhados**:
  * **ONR (Operador Nacional do Registro Imobiliário Eletrônico)**: Integra todos os registradores de imóveis do país para envio de títulos, visualização de matrículas e penhora eletrônica online.
  * **CENSEC (Central Notarial de Serviços Eletrônicos Compartilhados)**: Armazena o Registro Central de Testamentos (RCTO), Escrituras de Separação, Divórcio e Inventários Extrajudiciais e a Central de Escrituras e Procurações (CEP).
  * **CRC Nacional (Central de Informações do Registro Civil)**: Conecta todos os cartórios de RCPN para emissão interestadual de certidões eletrônicas de nascimento, casamento e óbito.
  * **CENPROT (Central Nacional de Serviços Eletrônicos dos Tabeliães de Protesto)**: Canal nacional para remessa de títulos a protesto, consultas de inadimplência e cancelamento de protesto mediante carta de anuência digital.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Taxatividade da Competência Notarial no e-Notariado",
        author: "CNJ (Provimento nº 149/2023, art. 283)",
        thesis: "A desterritorialização dos atos notariais é relativa: na via digital, as partes não têm liberdade irrestrita para escolher qualquer cartório do Brasil para negócios imobiliários, devendo observar as circunscrições do domicílio do adquirente ou do imóvel.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Universalidade Territorial Irrestrita no Ambiente Digital (Rejeitada)",
        author: "Tese Rejeitada pelo CNJ",
        thesis: "A internet aboliria fronteiras físicas, autorizando as partes a escolherem qualquer tabelião no país para lavrar escrituras eletrônicas imobiliárias.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que uma escritura pública de compra e venda de imóvel em São Paulo, com adquirente domiciliado em Brasília, pode ser lavrada por tabelião situado em Manaus. Erro: violação flagrante da competência territorial fixada no art. 283 do Provimento 149/2023.",
      "Confundir as atribuições da CENSEC com o ONR: a consulta sobre existência de testamento público faz-se exclusivamente na CENSEC (RCTO), enquanto a busca de bens imóveis é de alçada do ONR.",
      "Esquecer que o certificado notarizado é emitido sem custo ao cidadão e possui validade exclusiva para assinatura de atos notariais na plataforma e-Notariado."
    ],
    careerNuances: {
      ENAC: "O delegatário deve conhecer a fundo as sanções disciplinares aplicáveis por descumprimento do Provimento 149/2023 e as regras de segurança cibernética (backup em nuvem e antivírus corporativo).",
      ENAM: "No ENAM, o juiz corregedor permanente precisa saber instruir procedimentos disciplinares administrativos instaurados contra notários e registradores por descumprimento das regras unificadas do CNJ."
    }
  },

  // =========================================================================
  // 5. ENAC: ENUNCIADOS DA I JORNADA DE DIREITO NOTARIAL E REGISTRAL (CJF)
  // =========================================================================
  {
    id: "enac-enunciados-cjf-notarial-registral",
    discipline: "DIREITO NOTARIAL E REGISTRAL",
    title: "Enunciados da I Jornada de Direito Notarial e Registral do CJF e Usucapião Extrajudicial",
    themeKeywords: [
      "enunciados cjf", "i jornada direito notarial", "usucapião extrajudicial", "artigo 216-a lrp", 
      "qualificação registral", "desjudicialização", "autonomia da vontade", "segurança preventiva", 
      "anuência dos confinantes", "ata notarial de usucapião"
    ],
    coreDoctrine: `#### 🏛️ Enunciados Aprovados na I Jornada do CJF e a Desjudicialização Registral

* **A I Jornada de Direito Notarial e Registral do Conselho da Justiça Federal (CJF)**:
  Evento dogmático de cúpula que fixou 82 enunciados hermenêuticos definindo a interpretação contemporânea da LRP (Lei 6.015/1973), Lei dos Notários e Registradores (Lei 8.935/1994), Código Civil e normas do CNJ.

* **Principais Enunciados Estratégicos de Prova (Curva A da FGV)**:
  * **Enunciado 24 do CJF**: A qualificação registral do título extrajudicial ou judicial abrange a verificação da regularidade formal, da capacidade das partes, da disponibilidade do direito e da observância da continuidade e da especialidade, sem adentrar no mérito da decisão judicial.
  * **Enunciado 33 do CJF (Usucapião Extrajudicial - Art. 216-A da LRP)**: A falta de manifestação expressa de qualquer dos titulares de direitos reais ou confrontantes, desde que devidamente notificados pessoalmente ou por edital, **não impede o reconhecimento extrajudicial da usucapião**, aplicando-se a presunção de ausência de oposição.
  * **Enunciado 48 do CJF**: O silêncio do titular do direito real registrado perante a notificação na adjudicação compulsória extrajudicial (art. 216-B da LRP) ou na retificação consensual de área (art. 213 da LRP) opera como **concordância ficta tácita**, viabilizando o deferimento administrativo do pedido.
  * **Enunciado 61 do CJF (Inventário e Partilha Extrajudicial)**: É válida a lavratura de escritura pública de inventário e partilha extrajudicial com testamento válido, desde que haja prévia autorização ou homologação pelo juízo sucessório competente ou abertura e registro judicial do testamento (harmonizado com a tese do STJ no REsp 1.808.767/RJ e Resolução CNJ 35/2007).
  * **Enunciado 75 do CJF**: A ata notarial é instrumento hábil para constatar fatos em meios digitais, possuindo eficácia probatória qualificada e presunção relativa de veracidade (art. 384 do CPC).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Desnecessidade de Anuência Expressa dos Confinantes na Usucapião Extrajudicial",
        author: "Enunciado 33 do CJF e Provimento CNJ nº 149/2023",
        thesis: "A redação dada pela Lei 13.465/2017 ao art. 216-A da LRP superou a exigência original de anuência unânime expressa: o silêncio dos confrontantes notificados opera como conformidade, cabendo ao registrador deferir a usucapião extrajudicial se presentes os demais requisitos da posse ad usucapionem.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Exigência de Consentimento Unânime e Expresso (Tese Superada de 2015)",
        author: "Redação Primitiva do CPC/2015",
        thesis: "Qualquer silêncio inviabilizaria a via administrativa, remetendo obrigatoriamente as partes para a ação de usucapião judicial.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que inventário com herdeiro incapaz ou testamento não pode ser realizado em cartório sob nenhuma hipótese. Erro: a jurisprudência atual do STJ e normas do CNJ autorizam a partilha extrajudicial se houver consenso e prévia autorização judicial do plano de partilha.",
      "Supor que a ata notarial de usucapião extrajudicial substitui o procedimento perante o oficial registrador de imóveis. Erro: a ata notarial é lavrada pelo tabelião de notas para atestar a posse, mas a declaração final de aquisição originária compete com exclusividade ao oficial do Registro de Imóveis."
    ],
    careerNuances: {
      ENAC: "O candidato deve conhecer os 82 enunciados do CJF para demonstrar atualização jurisprudencial e doutrinária de ponta perante as bancas da FGV.",
      ENAM: "No ENAM, o juiz deve prestigiar a desjudicialização, extinguindo sem resolução do mérito por falta de interesse de agir ações que a parte pode obter pela via administrativa consensual cartorária."
    }
  },

  // =========================================================================
  // 6. ENAM: JULGAMENTO COM PERSPECTIVA DE GÊNERO (RESOLUÇÃO CNJ 492/2023)
  // =========================================================================
  {
    id: "enam-protocolo-genero-cnj-492",
    discipline: "NOÇÕES GERAIS DE DIREITO E FORMAÇÃO HUMANÍSTICA",
    title: "Protocolo para Julgamento com Perspectiva de Gênero (Resolução CNJ 492/2023)",
    themeKeywords: [
      "protocolo de gênero", "resolução cnj 492", "perspectiva de gênero", "interseccionalidade", 
      "estereótipos de gênero", "direitos humanos das mulheres", "violência de gênero", 
      "valoração probatória qualificada", "caso márcia barbosa", "caso campo algodoeiro", "corte idh"
    ],
    coreDoctrine: `#### ⚖️ Julgamento com Perspectiva de Gênero no Poder Judiciário (Resolução CNJ nº 492/2023)

* **Obrigatoriedade e Natureza Jurídica**:
  A Resolução CNJ nº 492/2023 tornou **obrigatória** a aplicação do Protocolo para Julgamento com Perspectiva de Gênero por todas as juízas, juízes, tribunais e ramos do Poder Judiciário brasileiro. Não se trata de mera recomendação ou faculdade interpretativa, mas de **dever funcional cogente** de índole convencional e constitucional.

* **Origem Convencional e Vinculação Internacional**:
  O protocolo decorreu do cumprimento de sentença proferida pela Corte Interamericana de Direitos Humanos no **Caso Márcia Barbosa de Souza e outros vs. Brasil (2021)**, no qual o Estado brasileiro foi internacionalmente condenado pela morosidade, impunidade e uso de estereótipos machistas e discriminatórios na persecução penal do feminicídio da vítima.

* **Diretrizes Estruturantes da Perspectiva de Gênero**:
  1. **Superação de Estereótipos e Mitos Patriarcais**: É vedado ao magistrado e aos sujeitos processuais utilizar condutas morais da vítima, histórico sexual, estilo de vestimenta ou vida pregressa para desqualificar seu testemunho, mitigar a culpabilidade do agressor ou presumir consentimento em crimes contra a dignidade sexual.
  2. **Teoria da Interseccionalidade (Kimberlé Crenshaw)**: O julgador deve analisar as múltiplas camadas de vulnerabilidade que se sobrepõem à identidade da pessoa (gênero, raça, etnia, classe social, orientação sexual, idade e deficiência). Mulheres negras periféricas enfrentam assimetrias qualitativamente distintas de mulheres brancas abastadas.
  3. **Valoração Probatória Qualificada em Crimes Clandestinos**: Em delitos praticados no âmbito doméstico e familiar ou contra a dignidade sexual, comumente perpetrados na clandestinidade e sem testemunhas presenciais, **a palavra da vítima ganha especial relevância e valor probatório reforçado**, desde que coerente com os demais elementos indiciários coligidos (Súmula 542 do STJ e jurisprudência vinculante).
  4. **Linguagem Forense Neutra e Não Revitimizante**: Proibição de perguntas ofensivas ou inquisitórias durante as audiências de instrução e julgamento (Lei nº 14.245/2021 - Lei Mariana Ferrer, art. 400-A do CPP).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Caráter Cogente e Nulidade por Descumprimento do Protocolo",
        author: "STJ (Habeas Corpus 785.495/SP e RHC 163.456) e CNJ",
        thesis: "A prolação de decisão judicial pautada em estereótipos discriminatórios de gênero ou que ignore deliberadamente a perspectiva de gênero constitui vício de fundamentação com nulidade insanável por afronta aos arts. 5º, I e 93, IX da CF/88.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Caráter Meramente Programático e Recomendatório (Rejeitada pelas Bancas)",
        author: "Tese Rejeitada pelo CNJ e Tribunais Superiores",
        thesis: "O protocolo seria apenas um guia de estilo, e o juiz teria discricionariedade plena para adotá-lo ou ignorá-lo com base no livre convencimento motivado.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Dizer que a aplicação do Protocolo de Gênero do CNJ é facultativa ou restrita aos Juizados de Violência Doméstica. Erro: a Resolução 492/2023 impôs a observância obrigatória a TODOS os ramos da Justiça (Cível, Família, Trabalho, Eleitoral, Militar e Federal).",
      "Confundir igualdade formal com material: a perspectiva de gênero não quebra a imparcialidade do juiz; visa justamente reequilibrar desvantagens estruturais históricas para alcançar a igualdade substantiva.",
      "Desconsiderar a origem internacional do protocolo: questão clássica da FGV indaga sobre a sentença da Corte IDH no Caso Márcia Barbosa vs. Brasil."
    ],
    careerNuances: {
      ENAM: "No ENAM, a Formação Humanística e a Perspectiva de Gênero compõem o núcleo duro do exame. O candidato deve articular a teoria da interseccionalidade e a jurisprudência interamericana em casos práticos.",
      ENAC: "Para o delegado cartorário, a perspectiva de gênero impõe especial acolhimento a mulheres vítimas de violência econômica no atendimento balcão e no registro de filhos havidos de reprodução assistida ou paternidade socioafetiva."
    }
  },

  // =========================================================================
  // 7. ENAM: CÓDIGO DE ÉTICA DA MAGISTRATURA E HERMENÊUTICA
  // =========================================================================
  {
    id: "enam-etica-magistratura-hermeneutica",
    discipline: "NOÇÕES GERAIS DE DIREITO E FORMAÇÃO HUMANÍSTICA",
    title: "Código de Ética da Magistratura Nacional e Teoria da Decisão Judicial",
    themeKeywords: [
      "ética da magistratura", "código de ética cnj", "independência judicial", "imparcialidade", 
      "fundamentação da decisão", "artigo 489 cpc", "hermenêutica filosófica", "ronald dworkin", 
      "robert alexy", "resposta correta", "mandamentos de otimização", "vedações constitucionais"
    ],
    coreDoctrine: `#### 🏛️ Deontologia Jurídica da Magistratura e Teoria da Decisão Judicial

* **O Código de Ética da Magistratura Nacional (Resolução CNJ nº 60/2008)**:
  Diploma ético e deontológico cogente que estabelece os deveres dos magistrados brasileiros, norteado pelos seguintes princípios estruturantes:
  1. **Independência Judicial (Arts. 4º a 7º)**: O juiz não deve subordinar sua atividade jurisdicional a pressões políticas, ideológicas, econômicas ou midiáticas, decidindo com liberdade de convicção alicerçada na Constituição e nas leis do país.
  2. **Imparcialidade (Arts. 8º e 9º)**: O magistrado deve manter equidistância real e aparente perante as partes litigantes. Deve evitar manifestar sua opinião jurídica ou política sobre processos que estejam sob seu julgamento ou pendentes de decisão nos tribunais.
  3. **Transparência e Cortesia (Arts. 10 a 23)**: O juiz deve tratar as partes, advogados, membros do MP e servidores com urbanidade e respeito recíproco, garantindo publicidade processual e presteza nos atos ordinatórios.

* **Vedações Constitucionais Expressas aos Magistrados (Art. 95, Parágrafo Único da CF/88)**:
  * Exercer, ainda que em disponibilidade, outro cargo ou função, salvo uma de magistério;
  * Receber, a qualquer título ou pretexto, custas ou participação em processo;
  * Dedicar-se à atividade político-partidária;
  * Receber auxílios ou contribuições de pessoas físicas ou entidades públicas ou privadas;
  * **Quarentena de Saída**: Exercer a advocacia no juízo ou tribunal do qual se afastou antes de decorridos **3 (três) anos** do afastamento do cargo por aposentadoria ou exoneração (inciso V).

* **Teoria da Decisão Judicial e o Art. 489, § 1º do CPC/2015**:
  O CPC/2015 positivou o dever de fundamentação analítica rigorosa, superando o decisionismo arbitrário. **Não se considera fundamentada a decisão que**:
  1. Limitar-se à indicação, à reprodução ou à paráfrase de ato normativo, sem explicar sua relação com a causa;
  2. Empregar conceitos jurídicos indeterminados, sem explicar o motivo concreto de sua incidência no caso;
  3. Invocar motivos que se prestariam a justificar qualquer outra decisão;
  4. Não enfrentar todos os argumentos deduzidos no processo capazes de, em tese, infirmar a conclusão adotada pelo julgador;
  5. Limitar-se a invocar precedente ou enunciado de súmula, sem demonstrar sua fundamentação determinante e o ajustamento ao caso concreto (proibição da citação genérica sem distinguishing).

* **Teorias da Hermenêutica Jurídica mais Cobradas no ENAM**:
  * **Ronald Dworkin**: O Direito como Integridade e o "Romance em Cadeia". Dworkin refuta o positivismo discricionário de Hart, afirmando que os juízes não criam o direito discricionariamente nas lacunas (hard cases), mas devem buscar a "única resposta correta" (right answer) por meio da melhor interpretação moral e política da tradição jurídica.
  * **Robert Alexy**: Teoria dos Direitos Fundamentais. Distinção entre regras (mandamentos definitivos aplicados na modalidade do "tudo ou nada" - subsumpção) e princípios (mandamentos de otimização aplicados por ponderação e proporcionalidade - Lei da Colisão).`,
    divergentCurrents: {
      firstCurrent: {
        name: "Dever Estrito de Enfrentamento de Todos os Argumentos Relevantes",
        author: "CPC/2015 (Art. 489, § 1º, IV) e Doutrina Hermenêutica Contemporânea",
        thesis: "O julgador tem o dever analítico e explícito de enfrentar todos os argumentos suscitados pelas partes que apresentem potencial concreto para infirmar o desfecho do julgamento, sob pena de nulidade absoluta da sentença por negativa de prestação jurisdicional.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Livre Convencimento e Não Vinculação a Todos os Pontos (Tese Restritiva)",
        author: "Jurisprudência Histórica Tradicional do STJ (EDcl no MS 21.315/DF)",
        thesis: "O julgador não está obrigado a responder a todas as teses da parte se já encontrou fundamento autônomo suficiente para amparar sua conclusão.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Confundir o prazo da quarentena de saída da magistratura (3 anos) com o da Advocacia Pública (que segue regras funcionais distintas).",
      "Achar que o Código de Ética permite ao magistrado opinar livremente nas redes sociais sobre decisões tomadas por colegas em processos em curso. Erro: proibição expressa de pré-julgamento e manifestação pública sobre processos pendentes.",
      "Errar a tese de Ronald Dworkin: para Dworkin, NÃO há discricionariedade judicial em casos difíceis; os princípios jurídicos fornecem a resposta institucionalmente adequada."
    ],
    careerNuances: {
      ENAM: "No ENAM, a filosofia do direito e a deontologia compõem o filtro eliminatório. O candidato precisa transitar com segurança pelas teses de Alexy, Dworkin, Gadamer e pelas balizas do art. 489 do CPC.",
      ENAC: "Para cartórios, os deveres éticos da Lei 8.935/1994 (arts. 30 e 31) impõem estrita imparcialidade, proibição de cobrança de valores superiores à tabela de emolumentos e dever de prestar informações aos usuários."
    }
  },

  // =========================================================================
  // 8. ENAM: CONTROLE DE CONVENCIONALIDADE E CORTE IDH
  // =========================================================================
  {
    id: "enam-controle-convencionalidade-corte-idh",
    discipline: "DIREITOS HUMANOS",
    title: "Controle de Convencionalidade e Jurisprudência da Corte Interamericana de Direitos Humanos",
    themeKeywords: [
      "controle de convencionalidade", "corte idh", "sistema interamericano", "pacto de san josé", 
      "comissão interamericana", "guerrilha do araguaia", "caso vladimir herzog", "caso favela nova brasília", 
      "supralegalidade", "duplo controle", "bloco de convencionalidade"
    ],
    coreDoctrine: `#### 🌐 O Controle de Convencionalidade no Direito Brasileiro

* **Conceito e Mecanismo Dogmático**:
  O controle de convencionalidade é o juízo de conformidade que se realiza entre as normas do direito interno (leis, decretos, portarias, e inclusive normas constitucionais originárias ou derivadas) e os **Tratados Internacionais de Direitos Humanos** ratificados pelo Estado brasileiro.
  * **Duplo Controle Vertical**: No Brasil, as leis sofrem um duplo crivo de validade:
    1. Controle de Constitucionalidade (parâmetro: CF/88);
    2. Controle de Convencionalidade (parâmetro: Pacto de San José da Costa Rica e demais tratados de direitos humanos).

* **Hierarquia dos Tratados Internacionais de Direitos Humanos (Jurisprudência do STF)**:
  * **Tratados Aprovados pelo Rito Especial (Art. 5º, § 3º da CF/88)**: Aprovados em cada Casa do Congresso Nacional, em dois turnos, por três quintos dos votos dos membros. Possuem equivalência a **Emendas Constitucionais** (ex: Convenção da ONU sobre Direitos das Pessoas com Deficiência e Convenção Interamericana contra o Racismo).
  * **Tratados Aprovados pelo Rito Ordinário (Jurisprudência do STF no RE 466.343/SP)**: Possuem **status supralegal** (situam-se acima das leis ordinárias infraconstitucionais, mas abaixo do texto constitucional). Paralisam a eficácia de qualquer lei em sentido contrário (efeito paralisante, como na vedação da prisão civil do depositário infiel - Súmula Vinculante 25).

* **Casos Paradigmáticos da Corte IDH contra o Brasil**:
  1. **Caso Gomes Lund e outros ("Guerrilha do Araguaia") vs. Brasil (2010)**: A Corte IDH proclamou a inconvencionalidade das disposições da Lei de Anistia brasileira (Lei nº 6.683/1979) que impedem a investigação e a sanção de graves violações de direitos humanos (tortura e desaparecimento forçado). Tais crimes são imprescritíveis e insuscetíveis de anistia.
  2. **Caso Vladimir Herzog e outros vs. Brasil (2018)**: Reafirmou que o assassinato do jornalista pela ditadura militar qualifica-se como **crime contra a humanidade**, sendo vedada a aplicação de anistia ou prescrição no direito interno.
  3. **Caso Fazenda Brasil Verde vs. Brasil (2016)**: Primeira condenação da Corte IDH por violação à proibição de escravidão e servidão (art. 6º da CADH), assentando a responsabilidade do Estado pela tolerância histórica ao trabalho análogo ao de escravo e a vulnerabilidade estrutural dos trabalhadores migrantes.
  4. **Caso Favela Nova Brasília vs. Brasil (2017)**: Condenou o Brasil por violência policial e falta de investigação célere sobre execuções sumárias e violência sexual perpetradas por policiais no Rio de Janeiro, impondo a criação de diretrizes para perícia independente em letalidade policial.`,
    divergentCurrents: {
      firstCurrent: {
        name: "Controle Difuso de Convencionalidade por Qualquer Magistrado (Dever Ex Officio)",
        author: "Corte Interamericana de Direitos Humanos (Caso Almonacid Arellano vs. Chile) e CNJ",
        thesis: "Todos os juízes e órgãos vinculados à administração da justiça têm o dever de exercer, de ofício (ex officio), o controle de convencionalidade das leis internas, afastando a aplicação de dispositivos contrários à Convenção Americana sobre Direitos Humanos.",
        adoptedByExam: true
      },
      secondCurrent: {
        name: "Controle Restrito ao Supremo Tribunal Federal (Tese Equivocada)",
        author: "Positivismo Jurisdicional Estrito",
        thesis: "O controle de convencionalidade dependeria de provocação e caberia apenas às instâncias constitucionais de cúpula.",
        adoptedByExam: false
      }
    },
    examPitfalls: [
      "Afirmar que a Súmula Vinculante 25 do STF decorreu de uma alteração formal da Constituição. Erro: decorreu do controle de convencionalidade do art. 7º, item 7 da CADH (Pacto de San José) sobre o Código Civil e CPC.",
      "Dizer que a Lei de Anistia foi validada pela Corte IDH porque o STF a declarou constitucional na ADPF 153. Erro: a Corte IDH declarou a Lei de Anistia expressamente inconvencional no Caso Gomes Lund, havendo conflito aberto entre as cortes.",
      "Confundir competência da Comissão Interamericana (sede em Washington, função de receber petições, emitir relatórios e promover soluções amistosas) com a da Corte Interamericana (sede em San José da Costa Rica, função jurisdicional contenciosa e consultiva)."
    ],
    careerNuances: {
      ENAM: "O candidato ao ENAM deve saber fundamentar decisões judiciais utilizando a jurisprudência contenciosa da Corte IDH e a doutrina do diálogo entre cortes (cross-fertilization).",
      ENAC: "O delegatário cartorário deve aplicar o controle de convencionalidade na interpretação de tratados internacionais e no reconhecimento de direitos de migrantes e povos originários."
    }
  }
];
