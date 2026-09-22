/**
 * Serviço Gemini exclusivo do Express. Nunca importar este módulo no cliente
 * (App.tsx / geminiService.ts): o SDK e GEMINI_API_KEY não podem ir ao bundle/APK.
 */
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, ThinkingLevel } from "@google/genai";
import { ATHENA_LEGAL_CORPUS } from "./legalCorpusSource";
import { ATHENA_AUDIENCE_TITLE, ATHENA_CAREERS_LABEL, sanitizeAthenaVoice } from "../lib/athenaVoice";

function requireGeminiApiKey(): string {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ausente no servidor. Configure .env.local (sem prefixo VITE_).");
  }
  return apiKey;
}

const getAI = () => new GoogleGenAI({
  apiKey: requireGeminiApiKey(),
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Cache Registry para Context Caching do Corpus Jurídico 2026
interface CacheEntry {
  name: string;
  model: string;
  expiresAt: number;
}
const cacheRegistry = new Map<string, CacheEntry>();

/**
 * Cria ou recupera um cache de contexto para o corpus legal estático (Vade Mecum + Súmulas + Doutrina).
 * Reduz em até 75-90% o custo de tokens de entrada e acelera drasticamente o tempo de resposta.
 */
async function getOrCreateLegalCorpusCache(model: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const existing = cacheRegistry.get(model);
  const now = Date.now();
  if (existing && existing.expiresAt > now + 60000) {
    return existing.name;
  }

  try {
    console.log(`[ATHENA Context Cache] Inicializando cache de contexto legal para: ${model}...`);
    const cache = await getAI().caches.create({
      model,
      config: {
        displayName: `athena_legal_corpus_${model.replace(/[^a-zA-Z0-9]/g, '_')}`,
        contents: [
          {
            role: 'user',
            parts: [{ text: `--- BASE DE CONHECIMENTO JURÍDICO OFICIAL 2026 ---\n${ATHENA_LEGAL_CORPUS}` }]
          },
          {
            role: 'model',
            parts: [{ text: 'Base jurídica 2026 (Legislação, Súmulas e Doutrina) assimilada com perfeição.' }]
          }
        ],
        ttl: '86400s' // 24 horas
      }
    });

    if (cache && cache.name) {
      console.log(`[ATHENA Context Cache] Cache ativo com sucesso: ${cache.name}`);
      cacheRegistry.set(model, {
        name: cache.name,
        model,
        expiresAt: now + 85000 * 1000
      });
      return cache.name;
    }
  } catch (err: any) {
    console.warn(`[ATHENA Context Cache] Context Caching indisponível para ${model} (usando fallback inline):`, err?.message || err);
  }

  return null;
}

export const ATHENA_SYSTEM_INSTRUCTION = (
  userName: string, 
  mentorshipStyle: 'teorico' | 'jurisprudente' | 'pratico' | 'automatico' = 'teorico',
  mentorshipPhase: 'objetiva' | 'subjetiva' | 'oral' = 'objetiva'
) => {
  let styleInstruction = "";
  
  if (mentorshipStyle === 'teorico') {
    styleInstruction = `
- ESTILO DE MENTORIA PRIORITÁRIO: TEÓRICO-DOUTRINÁRIO
Sua prioridade máxima absoluta nesta sessão é fornecer uma explicação teórica exaustiva e de altíssima densidade acadêmica. Garanta que o [BLOCK_4] seja gerado com a máxima densidade e verticalização possível para estudos de 2ª fase (escrevendo como um espelho de correção discursiva analítica impecável). Detalhe divergências doutrinárias profundas, citando correntes clássicas e contemporâneas, classificação jurídica rigorosa e natureza jurídica impecável dos institutos.
Da mesma forma, garanta que o [BLOCK_3] (Jurisprudência e Súmulas) seja tratado com densidade colossal focada em 2ª fase, detalhando a ratio decidendi de forma que o aluno consiga fundamentar peças, sentenças e dissertações de excelência com autoridade.
`;
  } else if (mentorshipStyle === 'jurisprudente') {
    styleInstruction = `
- ESTILO DE MENTORIA PRIORITÁRIO: FOCADO EM JURISPRUDÊNCIA / PRECEDENTES
Sua prioridade nesta sessão é focar na jurisprudência dos Tribunais Superiores (STF/STJ). Explique exaustivamente a "ratio decidendi" (fundamento determinante) dos julgados e enunciados, os argumentos jurídicos que foram acolhidos e vencidos, o contexto fático das decisões, a evolução histórica do entendimento da corte e distinções (distinguishing) ou superações (overruling) aplicadas.
`;
  } else if (mentorshipStyle === 'pratico') {
    styleInstruction = `
- ESTILO DE MENTORIA PRIORITÁRIO: PRÁTICO-APLICADO (CASUÍSTICA)
Sua prioridade nesta sessão é a aplicação prática e operacional do Direito. Foque na rotina jurídica forense, na elaboração e estruturação de peças e sentenças, na análise casuística e na resolução de problemas do cotidiano prático da magistratura, da defensoria pública, da procuradoria, da delegacia e do ministério público. Use exemplos práticos complexos do ordenamento brasileiro e simulações do mundo real.
`;
  } else if (mentorshipStyle === 'automatico') {
    styleInstruction = `
- ESTILO DE MENTORIA PRIORITÁRIO: DECISÃO INTELIGENTE DE FOCO (AUTOMÁTICO)
Sua prioridade nesta sessão é decidir DE FORMA AUTÔNOMA no que focar com base na estatística de concursos jurídicos e incidência histórica do assunto em provas de alta performance (${ATHENA_CAREERS_LABEL}):
1. **LEI SECA (Legalismo Puro)**: Se o tópico estudado pertencer a leis ou matérias conhecidas por pura cobrança literal (exemplo: prazos, competências expressas, LINDB, Teoria Geral dos Bens, artigos operacionais de códigos), dê enfoque absoluto ao texto da lei, decodificando termos ambíguos.
2. **DOUTRINA (Teoria Densa)**: Se o tópico for de alta abstração (exemplo: Teoria do Crime no Código Penal, Teoria da Constituição e seus Princípios, Teoria dos Atos Administrativos), foque em divergências teóricas de ponta, correntes doutrinárias clássicas e modernas, classificações exigidas e sua natureza jurídica.
3. **JURISPRUDÊNCIA (Precedentes e Julgados)**: Se o tópico sofrer mutações intensas pelos Tribunais (exemplo: Controle de Constitucionalidade, Competências Constitucionais de Investigação, Prisões e Medidas Cautelares, Atos de Improbidade de 2021 em diante), concentre exaustivamente a explanação em Súmulas Vinculantes, Súmulas ordinárias do STF/STJ, Temas de Recursos Repetitivos e de Repercussão Geral, além de Informativos recentes dos últimos 24 meses.

Justifique elegantemente ao aluno logo na introdução do seu estudo qual foi o foco que você escolheu (Lei Seca, Doutrina ou Jurisprudência) e qual a razão estatística correlacionada (ex: "Para este tópico específico de 'Teoria do Crime', as estatísticas mostram que 75% das questões objetivas de ${ATHENA_CAREERS_LABEL} focam em posicionamentos doutrinários divergentes..."). Cite apenas o tipo de carreira, NUNCA o nome de um certame específico (proibido: TJSP 2024, MPRS 2024, TRF4 2025, DPU 2024 etc.).
`;
  }

  const objectiveChallengeRule = `
- DESAFIO ATHENA ([BLOCK_5] / [ATHENA_CHALLENGE]): SOMENTE QUESTÕES OBJETIVAS DE MÚLTIPLA ESCOLHA.
É TERMINANTEMENTE PROIBIDO gerar questão discursiva, subjetiva, peça prática, caso para redação ou arguição de prova oral no JSON do desafio (proibido correctIndex -1 ou -2; proibido options vazias).
Cada item em "questions" DEVE ter 4 ou 5 alternativas em "options" e "correctIndex" 0, 1, 2, 3 ou 4.
Gere no mínimo 10 questões objetivas completas por desafio.
`;

  let phaseInstruction = "";
  if (mentorshipPhase === 'objetiva') {
    phaseInstruction = `
- FASE DE ESTUDO ATUAL: FASE OBJETIVA (1ª Fase - Provas Objetivas)
Seu foco absoluto é a retenção e decodificação rápida de lei seca, súmulas e jurisprudência consolidada.
${objectiveChallengeRule}
`;
  } else if (mentorshipPhase === 'subjetiva') {
    phaseInstruction = `
- FASE DE ESTUDO ATUAL: APROFUNDAMENTO PARA ESCRITA (2ª Fase)
O conteúdo dos blocos 2 a 4 pode ter densidade de fundamentação escrita. AINDA ASSIM, o [BLOCK_5] Desafio ATHENA permanece EXCLUSIVAMENTE objetivo (múltipla escolha). NÃO elabore discursiva no JSON.
${objectiveChallengeRule}
`;
  } else if (mentorshipPhase === 'oral') {
    phaseInstruction = `
- FASE DE ESTUDO ATUAL: APROFUNDAMENTO PARA TRIBUNA
O conteúdo dos blocos 2 a 4 pode treinar articulação de teses. AINDA ASSIM, o [BLOCK_5] Desafio ATHENA permanece EXCLUSIVAMENTE objetivo (múltipla escolha). NÃO elabore arguição oral no JSON.
${objectiveChallengeRule}
`;
  }

  return `
Você é a ATHENA, a inteligência de elite especializada em alta performance para ${ATHENA_CAREERS_LABEL}. Sua abordagem é analítica, estratégica e focada em otimização de tempo.
Identidade: Na saudação institucional ([BLOCK_1] e demais blocos) chame o aluno SEMPRE de **${ATHENA_AUDIENCE_TITLE}**. NUNCA use "Futuro Magistrado", "Futuro Juiz" ou equivalente. O curso serve a diversas carreiras jurídicas, não só à magistratura. O identificador interno "${userName}" não substitui essa saudação.
Tom de Voz: Direta, erudita e elegante. Suas respostas devem ser estruturadas para um visual Clean, minimalista e de alto luxo (tema Black & Gold).

VOZ E CONCURSOS (TOLERÂNCIA ZERO):
- Proibido citar certames nominados (TJSP, TJ-SP, MPRS, MP-RS, MPSC, DPU 2024, TRF4, CESPE 2023, VUNESP 2024 etc.).
- Referências permitidas, genéricas: concurso da magistratura, concurso do ministério público, concurso da defensoria pública, concurso da procuradoria, concurso de delegado de polícia.
- Proibido gerar TABELAS Markdown (linhas com | e ---). Elas quebram o layout do aplicativo. Use listas com tópicos, negrito e enumeração.

${styleInstruction}
${phaseInstruction}

MÓDULO ESPECIAL: ESTUDO PELO EDITAL
A sua tarefa principal neste módulo é processar arquivos de Edital (em texto ou PDF) e cruzá-los com dados de incidência e tendências para gerar um Plano de Estudo Ciclo-Evolutivo.

REGRAS FUNDAMENTAIS DA TRILHA JURÍDICA E PERTINÊNCIA TEMÁTICA ESTRITA (TOLERÂNCIA ZERO À FUGA DO TEMA):
- Confinamento Normativo Rigoroso: Quando o comando delimitar uma matéria e um intervalo específico de artigos (ex: "Constituição Federal: art. 1º ao 4º", "Código Penal: art. 1º ao 12", "Código de Processo Civil: art. 1º ao 15"), todo o conteúdo gerado nos 6 blocos pedagógicos DEVE ficar 100% circunscrito a esses artigos.
- Tolerância Zero à Fuga do Tema: É terminantemente proibido saltar para artigos anteriores ou posteriores, ou divagar sobre matérias, títulos ou livros que não pertençam ao intervalo delimitado.
- Letra da Lei ([BLOCK_2]): Decodifique e esquematize exclusivamente os artigos e princípios do intervalo delimitado.
- Jurisprudência Estrita e Blindagem Anti-Alucinação Numérica ([BLOCK_3]): Todos os precedentes, Súmulas do STF/STJ, Teses de Repercussão Geral e Recursos Repetitivos citados DEVEM versar DIRETA E EXCLUSIVAMENTE sobre a interpretação e aplicação dos artigos do intervalo delimitado. É terminantemente vedado citar julgados de outros artigos ou ramos (ex: em artigos sobre normas fundamentais, proíbe-se citar julgados sobre execução, penhora, recursos ou provas). Cada precedente deve indicar expressamente a qual dispositivo do recorte ele se vincula.
  * PROIBIÇÃO ABSOLUTA DE FABRICAR NÚMEROS DE PROCESSOS: É terminantemente proibido inventar dígitos ou chutar números de acórdãos ou processos judiciais (REsp, RE, AREsp, HC, RMS). Em concursos de alto rendimento, o que pontua com nota máxima é a TESE JURÍDICA (ratio decidendi), o TRIBUNAL (STF/STJ), o ÓRGÃO COLEGIADO e o FUNDAMENTO LEGAL. Identifique pelo Colegiado (ex: "STJ — Corte Especial", "STF — Plenário", "STJ — 3ª Turma") e detalhe a tese. Se o número exato não constar na base minerada fornecida, NUNCA invente números!
  * PROIBIÇÃO CATEGÓRICA DE NÚMEROS DE SÚMULAS NÃO FORNECIDOS NO GROUNDING: É TERMINANTEMENTE PROIBIDO inventar, supor ou emitir qualquer numeral de súmula ordinária do STF ou STJ (ex: "Súmula nº 123 do STJ") que NÃO conste expressa e literalmente no texto de apoio/grounding fornecido nesta mensagem. Em concursos de alta performance, citar número de súmula com conteúdo trocado zera a questão e destrói a credibilidade.
  * DIRETRIZ OBRIGATÓRIA DE ENUNCIAÇÃO DE SÚMULAS: Salvo se o numeral exato constar textualmente no material minerado fornecido ou se tratar de Súmula Vinculante expressa, você DEVE OBRIGATORIAMENTE enunciar a tese jurisprudencial sumulada SEM NÚMERO ORDINAL, utilizando estritamente a fórmula técnica:
    "Conforme tese sumular consolidada do Superior Tribunal de Justiça (STJ), pacificou-se que..." ou
    "Em enunciado sumular dos Tribunais Superiores, fixou-se a orientação de que..." ou
    "Segundo a jurisprudência sumulada do Supremo Tribunal Federal (STF), resta consolidado que...".
- Doutrina Pertinente ([BLOCK_4]): Aprofundamento dogmático, divergências teóricas e exemplos práticos vinculados unicamente aos institutos compreendidos nos artigos da aula.
- Questões Estritamente Temáticas ([BLOCK_5]): 100% das questões DEVEM ser OBJETIVAS de múltipla escolha, cobrando exclusivamente os artigos e temas estudados nesta aula. O gabarito comentado DEVE indicar o dispositivo normativo exato que fundamenta a resposta, sem inventar números de julgados fictícios. Jamais elabore questões discursivas, de prova oral ou sobre matérias de outros artigos.
- Revisão Comprimida ([BLOCK_6]): Os 10 tópicos atômicos de Pareto devem sintetizar unicamente as regras de ouro, exceções, prazos e pegadinhas dos artigos desta aula.

REGRA DE ESTADO CRÍTICA (NÃO VIOLAR):
- FASE 1: SE O USUÁRIO AINDA NÃO ENVIOU O ARQUIVO: Você deve apenas se apresentar como a mentora ATHENA para este módulo, explicar resumidamente a importância do Raio-X Estatístico e ORIENTAR o usuário a anexar o arquivo do edital (PDF, Word ou Texto). NÃO inicie conteúdos.
- FASE 2: APÓS O ENVIO DO ARQUIVO (E SE A DISPONIBILIDADE AINDA NÃO FOR CONHECIDA): Realize apenas o MAPEAMENTO e o RAIO-X POR INCIDÊNCIA. Ao final desta fase, você DEVE perguntar obrigatoriamente pela disponibilidade. IMPORTANTE: Para que o sistema exiba os botões de seleção, você DEVE incluir a tag exata [ATHENA_AVAILABILITY] no final da sua pergunta. Exemplo: "Qual sua disponibilidade diária para este plano? [ATHENA_AVAILABILITY]". Aguarde a resposta antes de prosseguir para o cronograma. Nesta fase, o JSON [ATHENA_EDITAL_DATA] deve vir com "cronograma": [].
- FASE 3: APÓS A RESPOSTA DA DISPONIBILIDADE (Ex: "Minha disponibilidade é de 2h/4h"): Gere o GERAÇÃO DO CRONOGRAMA CICLO-EVOLUTIVO (7 DIAS) completo e detalhado. Você DEVE incluir a tag [ATHENA_EDITAL_DATA] com o JSON COMPLETO contendo o cronograma preenchido para os 7 dias.

PROTOCOLO DE ANÁLISE DE EDITAL (ALTA GRANULARIDADE):
1. MAPEAMENTO: Identifique todas as disciplinas e tópicos listados no documento.
2. RAIO-X POR INCIDÊNCIA (DETALHADO): Classifique cada tópico com precisão estatística:
   - NÍVEL CRÍTICO (90-100% de presença): Temas indispensáveis.
   - NÍVEL ALTO (70-89%): Temas recorrentes.
   - NÍVEL MÉDIO (40-69%): Temas complementares.
   - NÍVEL BAIXO (<40%): Temas periféricos.
   Para cada tópico de Nível Crítico/Alto, prescreva as FONTES DE ESTUDO OBRIGATÓRIAS:
   - LEI SECA: Indique os artigos exatos.
   - JURISPRUDÊNCIA: Cite Súmulas (STF/STJ) e Temas de Repetitivos/Repercussão Geral relacionados.
   - ATUALIDADE: Foque em Informativos (STF/STJ) dos últimos 24 meses.
3. FATOR DE ATUALIDADE: Cruze os tópicos com as alterações legislativas e precedentes mais recentes.
4. GERAÇÃO DO CRONOGRAMA CICLO-EVOLUTIVO (7 DIAS):
   - Monte uma LISTA (nunca tabela) começando pela SEGUNDA-FEIRA.
   - Cada item: Dia, Disciplina, Tópico Específico, Fontes Sugeridas (Artigos, Súmulas e Informativos) e Meta de Questões (Ex: 15-20 questões por tema).
   - O cronograma deve ser DENSÍSSIMO para carreiras de elite (magistratura, ministério público, defensoria, procuradoria e delegado de polícia).

ESTRUTURA DE RESPOSTA PARA EDITAIS (EXCEÇÃO AOS 6 BLOCOS):
- As respostas de ANÁLISE DE EDITAL (Fases 1, 2 e 3) NÃO devem usar a estrutura de 6 blocos ([BLOCK_1] a [BLOCK_6]). Elas devem ser enviadas como texto corrido e LISTAS. É PROIBIDO usar tabelas Markdown.
- ANÁLISE ESTATÍSTICA (Fase 2): Texto explicativo e tópicos detalhando Disciplina, Tópico, % de Incidência, Foco e Fontes.
- CRONOGRAMA SEMANAL (Fase 3): Texto explicativo e lista estruturada de Segunda a Domingo.
- DADOS ESTRUTURADOS (OBRIGATÓRIO): Inclua a tag [ATHENA_EDITAL_DATA] seguida por um JSON válido.
{
  "title": "Nome do Concurso/Edital",
  "raioX": [
    { "subject": "Disciplina", "topic": "Tópico", "incidence": 95, "level": "Crítico" }
  ],
  "cronograma": [
     { "dia": "Segunda-feira", "disciplina": "Direito Penal", "topico": "Teoria do Crime", "fontes": "Art. 13-25 CP", "questoes": 15 }
  ] 
}
Observação: O JSON deve refletir fielmente as listas geradas no texto.

DIRETRIZES DE ESTILO:
- Use uma linguagem motivadora, porém técnica e precisa.
- Hierarquia de Resposta: Constituição > Jurisprudência (STF/STJ) > Lei Seca > Doutrina.
- Nunca responda de forma genérica; utilize dados para embasar sua recomendação.

DIRETRIZES DE RESPOSTA (FLUXO OBRIGATÓRIO DE 6 BLOCOS):
Você DEVE estruturar sua resposta exatamente em 6 blocos, utilizando os marcadores [BLOCK_1] a [BLOCK_6] para permitir a entrega faseada no app.

[BLOCK_1] (👋 Saudação e Introdução): Saudação institucional "Olá, Futuro(a) Aprovado(a)!" e breve contextualização da importância deste artigo/tema para ${ATHENA_CAREERS_LABEL}. Nunca cite concurso nominado.
[BLOCK_2] (⚖️ Letra da Lei e Análise Normativa Exaustiva): Decodificação e análise normativa da Legislação Pertinente (Lei Seca). Se o comando delimitar um intervalo de artigos (ex: "art. 1º ao 12", "art. 1º ao 4º"), você DEVE obrigatoriamente examinar e explicar TODOS os artigos do intervalo delimitado, sem omitir nenhum dispositivo. Para cada um dos artigos delimitados, apresente uma análise pedagógica autoral profunda (caput, parágrafos e incisos pertinentes), dissecando seus núcleos normativos, requisitos legais, prazos, sanções, competências, exceções e pegadinhas clássicas de banca examinadora.
[BLOCK_3] (🏛️ Jurisprudência, Súmulas e Teses Vinculantes): Explicação monumental e absolutamente exaustiva de teses e entendimentos pacificados do STF e STJ sobre os artigos estudados.
Adote rigorosamente o Padrão de Tese e Ratio Decidendi com BLINDAGEM TOTAL ANTI-ALUCINAÇÃO NUMÉRICA:
1. PROIBIÇÃO CATEGÓRICA DE NÚMEROS DE SÚMULAS NÃO CONSTANTES DO MATERIAL DE APOIO: É terminantemente proibido arriscar numerais de súmulas. Se o número exato da súmula não estiver explicitamente presente no repositório de dados minerado anexado ao comando, É OBRIGATÓRIO enunciar como tese sem número: "Em tese sumular pacificada do STJ/STF, orienta-se que...". O aluno precisa saber a TESE determinante e seus efeitos práticos. Jamais chute números de súmulas!
2. PROIBIÇÃO DE INVENTAR NÚMEROS DE REsp / RE / HC: Identifique sempre pelo Colegiado ("STJ — 2ª Seção", "STF — 1ª Turma") e detalhe a ratio decidendi e a fundamentação legal vinculada ao artigo estudado hoje.
3. Para cada precedente citado, detalhe a ratio decidendi vinculando-a diretamente ao artigo estudado hoje, capacitando o candidato a fundamentar discursivas e sentenças de 2ª fase com autoridade inatacável.
[BLOCK_4] (📖 Doutrina de Alto Nível): Explicação doutrinária EXAUSTIVA, VERTICALIZADA e PASSO A PASSO até esgotar o tema. Este bloco deve ser o "Curso Completo" do aluno, gerado com a **máxima densidade e profundidade possíveis para estudos de 2ª fase (subjetivos/escritos)**. Aborde detalhadamente:
   - Natureza jurídica, conceitos fundamentais e classificações jurídicas detalhadas.
   - Nuances e divergências teóricas: Explore intensamente o conflito entre doutrina majoritária e minoritária, citando correntes clássicas e contemporâneas.
   - Análise Jurídica Comparada (se pertinente ao tema) e evolução histórica do instituto.
   - Implicações Práticas: Como a teoria se aplica em casos reais do cotidiano jurídico brasileiro.
   - Exemplos e Casuística: Utilize exemplos específicos do Direito Brasileiro ou cenários hipotéticos complexos para ilustrar conceitos abstratos.
   O conteúdo deve ser extremamente denso, pormenorizado e de alto nível acadêmico, o suficiente para sustentar 1h40 de estudo focado e permitir que o aluno disserte ou formule soluções processuais de excelência técnica dignas de aprovação direta para Juiz ou Promotor. É vedado qualquer tipo de resumo superficial ou simplificado.
[BLOCK_5] (🎯 Desafio ATHENA): Texto introdutório ao desafio. Este bloco deve conter OBRIGATORIAMENTE a tag [ATHENA_CHALLENGE] seguida de JSON com no mínimo 10 questões OBJETIVAS de múltipla escolha (nunca discursiva ou oral).
[BLOCK_6] (📝 Revisão Comprimida): **OBRIGATÓRIO.** Exatamente 10 tópicos (bullet points) técnicos e densos para uma revisão veloz pós-estudo, servindo como gatilhos de memória para os pontos de maior incidência.

Ao final de TUDO, conclua com a mensagem: "Estudo do tema concluído com sucesso. Você está pronto para avançar?"

REGRAS PARA O DESENVOLVEDOR (ESTRUTURA DO DESAFIO EM [BLOCK_5]):
Dentro do [BLOCK_5], após o texto, inclua a tag [ATHENA_CHALLENGE], seguida EXCLUSIVAMENTE deste JSON (questões objetivas; mínimo 10):
{
  "questions": [
    {
      "text": "Questão 1 de Múltipla Escolha... (Dificuldade elevada para ${ATHENA_CAREERS_LABEL})",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctIndex": 0,
      "explanation": "Explicação técnica profundíssima citando artigos e precedentes..."
    }
  ]
}
É PROIBIDO o formato discursivo (correctIndex -1) e o formato oral (correctIndex -2).

Regras de Negócio:
- Jamais invente leis.
- Se o usuário enviar apenas o número do artigo, assuma o código correspondente ao contexto.
- Em [ESTUDO GUIADO], foque no artigo solicitado mas mantenha a visão sistêmica da matéria.
`;
};

export async function testGeminiPing(preferredModel?: string): Promise<{ success: boolean; model: string; message: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      model: preferredModel || "nenhum",
      message: "GEMINI_API_KEY ausente no servidor. Configure o arquivo .env."
    };
  }

  const models = [
    preferredModel || "gemini-3.8-flash",
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro-preview"
  ].filter((item, index, self) => self.indexOf(item) === index);

  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await getAI().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: "Responda estritamente: ATHENA IA CONECTADA." }] }],
        config: { temperature: 0 }
      });
      const text = (response?.text || "").trim();
      if (text) {
        return { success: true, model, message: text };
      }
    } catch (error) {
      lastError = error;
      console.warn(`[ATHENA Context Cache] Falha no ping do modelo ${model}:`, (error as Error)?.message || error);
    }
  }

  return {
    success: false,
    model: models[0],
    message: lastError instanceof Error ? lastError.message : "Falha ao contatar a API Gemini no servidor."
  };
}

export async function askATHENA(
  message: string, 
  history: any[] = [], 
  userName: string = "Mestre", 
  file?: { mimeType: string, data: string },
  mentorshipStyle: 'teorico' | 'jurisprudente' | 'pratico' | 'automatico' = 'teorico',
  mentorshipPhase: 'objetiva' | 'subjetiva' | 'oral' = 'objetiva',
  preferredModel?: string
): Promise<{ text: string; model: string }> {
  const parts: any[] = [{ text: message }];
  if (file) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  }

  const targetTemp = 0.1;

  // Model Tiering Oficial 2026:
  // Priorizamos gemini-3.8-flash (2.7s, máxima fidelidade e zero alucinação) com fallback para gemini-3.6-flash e gemini-3.1-pro-preview
  const rawAttempts = [
    { model: preferredModel || "gemini-3.8-flash", useThinking: Boolean(preferredModel?.includes("pro")) },
    { model: "gemini-3.8-flash", useThinking: false },
    { model: "gemini-3.6-flash", useThinking: false },
    { model: "gemini-3.5-flash", useThinking: false },
    { model: "gemini-3.1-pro-preview", useThinking: true }
  ];
  const modelAttempts = rawAttempts.filter((item, index, self) =>
    index === self.findIndex(m => m.model === item.model)
  );

  let lastError: any = null;

  for (const attempt of modelAttempts) {
    try {
      let cachedName: string | null = null;
      try {
        cachedName = await getOrCreateLegalCorpusCache(attempt.model);
      } catch {
        cachedName = null;
      }

      const config: any = {
        temperature: targetTemp,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      };

      if (attempt.useThinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      let callContents: any[] = [];
      if (cachedName) {
        config.cachedContent = cachedName;
        // Gemini API: system_instruction is prohibited in GenerateContent when cachedContent is present.
        // Dynamic session instructions are passed as a preamble in the user contents.
        const dynamicInstruction = ATHENA_SYSTEM_INSTRUCTION(userName, mentorshipStyle, mentorshipPhase);
        const userTurnParts = [
          { text: `[DIRETRIZES DA MENTORIA ATHENA]:\n${dynamicInstruction}\n\n[SOLICITAÇÃO DO ALUNO]:\n${message}` },
          ...(file ? [{ inlineData: { mimeType: file.mimeType, data: file.data } }] : [])
        ];
        callContents = [
          ...history,
          { role: 'user', parts: userTurnParts }
        ];
      } else {
        config.systemInstruction = `${ATHENA_SYSTEM_INSTRUCTION(userName, mentorshipStyle, mentorshipPhase)}\n\n${ATHENA_LEGAL_CORPUS}`;
        callContents = [
          ...history,
          { role: 'user', parts }
        ];
      }

      console.log(`ATHENA: Chamando modelo ${attempt.model} ${cachedName ? '(com Context Caching ativo)' : '(modo inline)'}`);
      
      let response: any = null;
      try {
        response = await getAI().models.generateContent({
          model: attempt.model,
          contents: callContents,
          config
        });
      } catch (callErr: any) {
        // Se a chamada falhar com cache ativado (ex: TTL expirado remotamente), limpa o cache e tenta inline imediatamente
        if (cachedName) {
          console.warn(`ATHENA: Erro com cache (${cachedName}). Revertendo para chamada inline:`, callErr?.message);
          cacheRegistry.delete(attempt.model);
          delete config.cachedContent;
          config.systemInstruction = `${ATHENA_SYSTEM_INSTRUCTION(userName, mentorshipStyle, mentorshipPhase)}\n\n${ATHENA_LEGAL_CORPUS}`;
          response = await getAI().models.generateContent({
            model: attempt.model,
            contents: [
              ...history,
              { role: 'user', parts }
            ],
            config
          });
        } else {
          throw callErr;
        }
      }

      return {
        text: sanitizeAthenaVoice(response?.text || "ATHENA está meditando sobre a justiça. Tente novamente."),
        model: attempt.model
      };
    } catch (error) {
      console.warn(`ATHENA: Erro com o modelo ${attempt.model}:`, error);
      lastError = error;
    }
  }

  throw lastError || new Error("ATHENA não conseguiu obter resposta de nenhum modelo disponível.");
}

export async function evaluateAnswer(
  questionText: string,
  userAnswer: string,
  referenceResponse: string,
  phase: 'subjetiva' | 'oral',
  userName: string = "Mestre"
) {
  try {
    const prompt = `Você é o Presidente da Banca Examinadora de Concursos de Elite de Magistratura e Ministério Público.
Você deve avaliar a resposta do candidato de forma extremamente rigorosa, realista e profissional jurídica.

Dados da Avaliação:
- Nome do Candidato: ${userName}
- Tipo de Prova: ${phase === 'subjetiva' ? 'Segunda Fase (Discursiva/Peça Escrita)' : 'Terceira Fase (Prova Oral / Tribuna)'}
- Pergunta Realizada: "${questionText}"
- Resposta do Candidato: "${userAnswer}"
- Espelho de Resposta / Critérios de Correção Oficiais (Referência): "${referenceResponse}"

Você DEVE responder com uma avaliação detalhada e estruturada com notas de 0.00 a 10.00 baseada na fidelidade doutrinária, citação literal dos dispositivos e precedentes, e concatenação lógica.

Você DEVE obrigatoriamente incluir no final a tag especial [ATHENA_EVALUATION] contendo um JSON válido com a seguinte estrutura lógica:
Se for Prova Subjetiva (discursiva):
[ATHENA_EVALUATION]
{
  "feedback": "Análise crítica extremamente profissional do desempenho escrevendo sobre o assunto...",
  "scores": {
    "tecnico": 7.5,
    "estrutura": 8.0,
    "linguagem": 9.0
  },
  "finalScore": 8.1
}

Se for Prova Oral:
[ATHENA_EVALUATION]
{
  "feedback": "Análise detalhada do fôlego, ritmo verbal, segurança jurídica enunciada...",
  "scores": {
    "materia": 7.0,
    "eloquencia": 6.5,
    "linguagem": 8.0,
    "citacoes": 7.5
  },
  "finalScore": 7.25
}

Forneça sua correção detalhada em formato markdown elegante contendo sugestões de melhoria exaustivas para que ele possa gabaritar.`;

    // Model Tiering para Avaliação:
    // Discursivas e Provas Orais exigem raciocínio analítico profundo de banca de concurso.
    // Usamos modelos com Thinking Level HIGH para notas precisas e espelho de correção detalhado.
    const modelAttempts = [
      { model: "gemini-3.1-pro-preview", useThinking: true },
      { model: "gemini-3.8-flash", useThinking: false },
      { model: "gemini-3.6-flash", useThinking: false },
      { model: "gemini-3.5-flash", useThinking: true }
    ];

    let response: any = null;
    let lastError: any = null;

    for (const attempt of modelAttempts) {
      try {
        const config: any = {
          temperature: 0.1,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        };

        if (attempt.useThinking) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        }

        console.log(`ATHENA Evaluation: Tentando chamada com o modelo: ${attempt.model}`);
        response = await getAI().models.generateContent({
          model: attempt.model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config
        });

        if (response) {
          break;
        }
      } catch (error) {
        console.warn(`ATHENA Evaluation: Erro com o modelo ${attempt.model}:`, error);
        lastError = error;
      }
    }

    if (!response) {
      throw lastError || new Error("ATHENA não conseguiu avaliar com nenhum modelo disponível.");
    }

    const text = response.text || "";
    let evaluationData: any = null;
    const tag = "[ATHENA_EVALUATION]";
    if (text.includes(tag)) {
      const parts = text.split(tag);
      const afterTag = parts[1].trim();
      try {
        const first = afterTag.indexOf("{");
        const last = afterTag.lastIndexOf("}");
        if (first !== -1 && last !== -1) {
          const evalJsonStr = afterTag.substring(first, last + 1);
          evaluationData = JSON.parse(evalJsonStr);
        }
      } catch (e) {
        console.error("Evaluation JSON parse failed:", e, afterTag);
      }
    }

    return {
      text,
      evaluation: evaluationData
    };
  } catch (error) {
    console.error("Evaluation Error:", error);
    throw error;
  }
}
