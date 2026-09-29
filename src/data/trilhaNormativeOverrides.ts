/**
 * Travas de tema para partes cujo gerador confundia o diploma
 * ou ensinava a norma anterior como se ainda fosse a regra geral.
 * O texto abaixo é roteiro de estudo, não substitui a leitura oficial.
 */

export type NormativeOverrideId = 'conama-378' | 'conama-237';

function fold(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchNormativeOverride(subject: string, content: string): NormativeOverrideId | null {
  const text = fold(`${subject} ${content}`);
  if (!text.includes('conama')) return null;
  if (/\b378\b/.test(text)) return 'conama-378';
  if (/\b237\b/.test(text)) return 'conama-237';
  return null;
}

export function normativeOverridePrompt(subject: string, content: string): string {
  const id = matchNormativeOverride(subject, content);
  if (id === 'conama-378') return CONAMA_378_LOCK;
  if (id === 'conama-237') return CONAMA_237_LOCK;
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
