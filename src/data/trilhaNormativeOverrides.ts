/**
 * Travas de tema para partes cujo gerador confundia o diploma
 * ou ensinava a norma anterior como se ainda fosse a regra geral.
 * O texto abaixo é roteiro de estudo, não substitui a leitura oficial.
 */

import { namedStatuteDigits } from '../lib/statuteMatch';

export type NormativeOverrideId = 'conama-378' | 'conama-237' | 'lei-1521' | 'lei-9605';

function fold(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchNormativeOverride(subject: string, content: string): NormativeOverrideId | null {
  const text = fold(`${subject} ${content}`);
  if (text.includes('conama')) {
    if (/\b378\b/.test(text)) return 'conama-378';
    if (/\b237\b/.test(text)) return 'conama-237';
  }
  const digits = namedStatuteDigits(subject) || namedStatuteDigits(content);
  if (digits === '1521') return 'lei-1521';
  if (digits === '9605') return 'lei-9605';
  return null;
}

export function normativeOverridePrompt(subject: string, content: string): string {
  const id = matchNormativeOverride(subject, content);
  if (id === 'conama-378') return CONAMA_378_LOCK;
  if (id === 'conama-237') return CONAMA_237_LOCK;
  if (id === 'lei-1521') return LEI_1521_LOCK;
  if (id === 'lei-9605') return LEI_9605_LOCK;
  return '';
}

const CONAMA_378_LOCK = `
[TRAVA DE TEMA — PARTE OBRIGATÓRIA]
O recorte desta parte é SOMENTE a Resolução CONAMA nº 378, de 19 de outubro de 2006 (publicada no DOU de 20/10/2006).
É PROIBIDO gerar aula, questão, jurisprudência ou revisão sobre a Resolução CNJ nº 492/2023, o Protocolo de Julgamento com Perspectiva de Gênero, o CNJ, formação humanística ou qualquer outra resolução que não seja a CONAMA 378/2006.
Se o material de apoio mencionar outro número de resolução, ignore esse material.

Ementa: define os empreendimentos potencialmente causadores de impacto ambiental nacional ou regional para o inciso III do § 1º do art. 19 da Lei nº 4.771/1965, com a redação dada pelo art. 83 da Lei nº 11.284/2006, que reparte a competência para autorizar a exploração de florestas e formações sucessoras.

Art. 1º — compete ao IBAMA aprovar:
- **I:** manejo ou supressão de espécies do Anexo II da CITES (Decreto nº 76.623/1975).
- **II:** exploração em imóvel rural que abranja dois ou mais Estados.
- **III:** supressão de floresta ou outra vegetação nativa acima de **2.000 hectares** na Amazônia Legal ou **1.000 hectares** nas demais regiões.
- **IV:** supressão ligada a obra ou atividade potencialmente poluidora licenciada pelo próprio IBAMA.
- **V:** manejo florestal em área superior a **50.000 hectares**, respeitados os limites das normas do bioma.
A exploração deve observar as regras específicas de cada bioma.

A Resolução CONAMA nº 428/2010 revogou apenas o **parágrafo único do art. 3º** da Resolução 378/2006. O art. 1º permanece. Não trate a resolução inteira como revogada.
O Código Florestal vigente é a Lei nº 12.651/2012, que sucedeu a Lei nº 4.771/1965. Situe a resolução nesse contexto, sem trocar o objeto da aula por outro diploma.
Cite número de artigo da Resolução 378/2006 somente quando constar deste bloco. Não invente súmula nem número de processo.
`;

const CONAMA_237_LOCK = `
[TRAVA DE TEMA — REGIME ATUALIZADO PELA LEI Nº 15.190/2025]
O recorte desta parte é o licenciamento ambiental da Resolução CONAMA nº 237, de 19 de dezembro de 1997, **relido à luz da Lei nº 15.190/2025** (Lei Geral do Licenciamento Ambiental).
A lei foi sancionada em 8 de agosto de 2025 e **entrou em vigor em 4 de fevereiro de 2026** (vacatio do art. 67). É essa a norma que o usuário chama de Lei 15.190/26. Não invente uma lei diferente com o ano de 2026 no número.
Ao regerar, NÃO apresente a Resolução 237/97 como se ainda fosse a norma geral nacional vigente. Mostre o que ela estabelecia e o que a Lei nº 15.190/2025 alterou em profundidade. A aula tem de servir para revisão e novo salvamento no cache.

Pontos que devem aparecer, com o rótulo em **negrito**:
- **Norma geral anterior:** até a lei nova, o procedimento nacional estava sobretudo na Resolução CONAMA 237/1997 e na Lei Complementar nº 140/2011.
- **Licenças clássicas:** a Resolução 237/97 estruturou o rito trifásico **LP** (prévia), **LI** (instalação) e **LO** (operação). A lei nova mantém essas três e acrescenta **LAU** (licença ambiental única), **LAC** (licença por adesão e compromisso), **LOC** (licença de operação corretiva) e **LAE** (licença ambiental especial).
- **Procedimentos:** além do ordinário trifásico, a lei prevê ritos simplificado, corretivo e especial.
- **Discricionariedade:** o art. 1º, III, da Resolução 237/97 deixava margem larga para condicionantes. O art. 3º, XXV, da Lei nº 15.190/2025 vincula a licença a normas legais, regulamentares e técnicas. O art. 3º, IV, e o art. 14 limitam a condicionante ao impacto negativo identificado no estudo ambiental.
- **Art. 14, § 1º:** nexo de causalidade entre a condicionante e o impacto, proporcionalidade e motivação qualificada. O dispositivo foi vetado e depois restaurado pelo Congresso.
- **Vedações do art. 14:** condicionante não cobre impacto de terceiro nem situação fora da ingerência do empreendedor, e não pode obrigá-lo a manter serviço que é dever do Poder Público.
- **Recurso:** o empreendedor pode recorrer na via administrativa, com prazo máximo de apreciação (art. 14, §§ 6º a 8º).
- **Autoridade licenciadora:** a lógica de um único ente licenciador, já anunciada no art. 7º da Resolução 237/97 e no art. 13, § 1º, da LC 140/2011, foi reforçada. A manifestação do ICMBio em unidade de conservação deixou de ser autorização vinculante e passou a parecer de autoridade envolvida (art. 3º, III), cabendo a palavra final ao licenciador (art. 42, I, e art. 44, § 6º). A exigência específica do art. 46 da Lei nº 9.985/2000 permanece nos casos que a própria lei do SNUC delimita.
- **Prazos de análise:** a lei fixa prazos máximos para o licenciador e para as autoridades envolvidas. Não invente quantidade de dias que não esteja neste bloco.
- **Controle concentrado:** as ADIs 7.913, 7.916 e 7.919 questionam trechos da lei no STF, sob relatoria do ministro Alexandre de Moraes. Trate-as como ações pendentes, não como declaração de inconstitucionalidade já julgada.
Cite número de artigo somente quando ele constar deste bloco. Não invente súmula nem número de processo.
`;

const LEI_1521_LOCK = `
[TRAVA DE TEMA — LEI Nº 1.521, DE 26 DE DEZEMBRO DE 1951]
O recorte desta parte é SOMENTE a Lei nº 1.521/1951 (crimes contra a economia popular).
É PROIBIDO gerar aula, questão ou revisão sobre os arts. 337-E a 337-P do Código Penal, sobre a Lei nº 14.133/2021 ou sobre qualquer outro diploma. A palavra "crimes" não autoriza essa troca.
Se o material de apoio falar de licitação ou de contratação direta, ignore esse material.

Ementa oficial: altera dispositivos da legislação vigente sobre crimes contra a economia popular. O art. 1º manda punir, na forma desta lei, os crimes e as contravenções contra a economia popular.

Pontos que devem aparecer, com o rótulo em **negrito**:
- **Art. 2º:** crimes cuja pena é detenção de 6 meses a 2 anos e multa. Incisos: recusa ou sonegação de serviço ou mercadoria essencial; preferência de comprador; peso ou composição em desacordo com determinação oficial; recusa da nota de serviço; mistura de gêneros; transgressão de tabela oficial; recusa da nota de gêneros de primeira necessidade; ajuste de preço de revenda ou de exclusividade; ganho ilícito por "bola de neve", "cadeias", "pichardismo" e equivalentes; fraude na venda a prestações; fraude de pesos ou medidas.
- **Parágrafo único do art. 2º:** o que se considera de primeira necessidade (alimentação, vestuário, iluminação, terapêuticos ou sanitários, combustível, habitação e materiais de construção).
- **Art. 3º:** crimes mais graves. A pena escrita na lei é detenção de 2 a 10 anos e multa. Não "corrija" detenção para reclusão. Incisos nucleares: destruir bens para provocar alta de preços; abandonar lavoura ou suspender produção mediante indenização; cartel ou ajuste para impedir a concorrência; açambarcar para dominar o mercado; vender abaixo do custo para impedir a concorrência; notícia falsa ou operação fictícia para alterar preços.
- **Art. 4º:** usura pecuniária (juros, comissões ou descontos acima da taxa legal; ágio de câmbio; penhor privativo de instituição oficial) e usura real (lucro que exceda o quinto do valor corrente ou justo, abusando da necessidade, inexperiência ou leviandade). Pena de detenção de 6 meses a 2 anos e multa. O § 3º, que anulava a estipulação usurária, está revogado pela Medida Provisória nº 2.172-32/2001.
- **Art. 5º:** há duas redações no texto oficial. Ensine a redação da Lei nº 3.290/1957, que admite suspensão da pena e livramento condicional nos casos da legislação comum. Não ensine o caput antigo, que negava esses benefícios, como se fosse a regra atual.
- **Art. 9º:** as contravenções de locação estão revogadas pela Lei nº 6.649/1979. Não as cobre como infrações vigentes.
- **Arts. 11 a 31:** rito e júri anotados com "Vide Emenda Constitucional nº 1, de 1969". Não os apresente como o júri comum vigente do Código de Processo Penal e não desvie a aula para processo penal geral.
Cite número de artigo somente quando ele constar deste bloco. Não invente súmula nem número de processo.
`;

const LEI_9605_LOCK = `
[TRAVA DE TEMA — LEI Nº 9.605, DE 12 DE FEVEREIRO DE 1998]
O recorte desta parte é SOMENTE a Lei nº 9.605/1998 (sanções penais e administrativas por condutas lesivas ao meio ambiente).
É PROIBIDO gerar aula, questão ou revisão sobre os arts. 337-E a 337-P do Código Penal ou sobre a Lei nº 14.133/2021. A palavra "crimes" não autoriza essa troca.
Não substitua esta lei pela responsabilidade civil ambiental da Lei nº 6.938/1981. O objeto é o crime ambiental.

Pontos que devem aparecer, com o rótulo em **negrito**:
- **Art. 2º:** quem concorre para o crime incide nas penas, na medida da culpabilidade. Diretor, administrador, membro de conselho ou órgão técnico, auditor, gerente, preposto ou mandatário que, sabendo da conduta de outrem, deixa de impedi-la quando podia agir responde pelo mesmo fundamento.
- **Art. 3º:** a pessoa jurídica responde administrativa, civil e penalmente quando a infração é cometida por decisão do representante legal ou contratual, ou do órgão colegiado, no interesse ou benefício da entidade. Essa responsabilidade não exclui a da pessoa física. Pode citar, como tese e sem inventar outro número, que o STF no RE 548.181 dispensou a dupla imputação.
- **Art. 10:** interdição de contratar com o Poder Público, receber incentivos ou participar de licitação por 5 anos no crime doloso e 3 anos no culposo. Não confunda esse prazo com os crimes de licitação do Código Penal.
- **Art. 29:** matar, perseguir, caçar, apanhar ou utilizar espécime da fauna silvestre sem permissão. Pena de detenção de 6 meses a 1 ano e multa. O § 4º aumenta a pena de metade (espécie ameaçada, período proibido, noite, abuso de licença, unidade de conservação, destruição em massa). O § 6º afasta o artigo nos atos de pesca.
- **Art. 32:** abuso, maus-tratos, ferir ou mutilar animais. Pena de detenção de 3 meses a 1 ano e multa. O § 1º-A, incluído pela Lei nº 14.064/2020, pune as condutas do caput contra cão ou gato com reclusão de 2 a 5 anos, multa e proibição da guarda. Os §§ 1º-B e 1º-C (Leis nº 15.150/2025 e nº 15.355/2026) só entram se o ponto for atualização; o núcleo clássico de prova é o § 1º-A.
- **Art. 38:** destruir ou danificar floresta de preservação permanente. Pena de detenção de 1 a 3 anos, ou multa, ou ambas. No culposo, a pena cai à metade.
- **Art. 40:** dano direto ou indireto a unidade de conservação. Pena de reclusão de 1 a 5 anos. A noção de unidade de conservação foi atualizada pela Lei nº 9.985/2000. No culposo, a pena é reduzida à metade.
- **Art. 50:** destruir floresta ou vegetação fixadora de dunas e protetora de mangues. Pena de detenção de 3 meses a 1 ano e multa.
- **Art. 50-A:** incluído pela Lei nº 11.284/2006. Desmatar, explorar ou degradar floresta em terra pública ou devoluta sem autorização. Pena de reclusão de 2 a 4 anos e multa. O § 1º exclui a conduta necessária à subsistência imediata do agente ou da família.
- **Art. 54:** poluição que resulte ou possa resultar em dano à saúde humana, mortandade de animais ou destruição significativa da flora. Pena de reclusão de 1 a 4 anos e multa. No § 1º culposo, detenção de 6 meses a 1 ano e multa. No § 2º, as qualificadoras sobem a reclusão de 1 a 5 anos.
Cite número de artigo somente quando ele constar deste bloco. Não invente súmula nem número de processo.
`;
