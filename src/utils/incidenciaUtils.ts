export type EixoEstudo = 'leiSeca' | 'doutrina' | 'jurisprudencia';
export type FaixaIncidencia = 'alta' | 'media' | 'baixa';

export const FAIXA_ROTULO: Record<FaixaIncidencia, string> = {
  alta: '🔴 alta',
  media: '🟡 média',
  baixa: '🟢 menor',
};

export const FAIXA_LARGURA: Record<FaixaIncidencia, number> = {
  alta: 100,
  media: 62,
  baixa: 34,
};

export function textoFaixa(faixa: FaixaIncidencia): string {
  if (faixa === 'alta') return '🔴 alta incidência';
  if (faixa === 'media') return '🟡 média incidência';
  return '🟢 menor incidência';
}

export interface IncidenciaData {
  prioridade: 'lei_seca' | 'doutrina' | 'jurisprudencia';
  label: string;
  faixas: Record<EixoEstudo, FaixaIncidencia>;
  justificativa: string;
  concursoHistorico: string;
}

const AVISO = 'A faixa indica onde concentrar a leitura. Não é percentual medido de prova.';

function enfase(
  prioridade: IncidenciaData['prioridade'],
  label: string,
  alta: EixoEstudo,
  media: EixoEstudo,
  baixa: EixoEstudo,
  justificativa: string
): IncidenciaData {
  const faixas: IncidenciaData['faixas'] = {
    leiSeca: 'baixa',
    doutrina: 'baixa',
    jurisprudencia: 'baixa',
  };
  faixas[alta] = 'alta';
  faixas[media] = 'media';
  faixas[baixa] = 'baixa';
  return { prioridade, label, faixas, justificativa, concursoHistorico: AVISO };
}

/**
 * Ênfase de leitura do recorte. Os números antigos eram faixas fixas
 * repetidas, não estatística de banca, então a tela mostra só alta, média ou menor.
 */
export function calcularIncidenciaParaMaterias(
  diaNum: number,
  materias: { nome: string; conteudo: string }[]
): IncidenciaData {
  let hasControlOrSTForSTJ = false;
  let hasTeoriaOrCrimeOrConstituicao = false;
  let hasProcessoCivilOrPrazosOrLei = false;
  let hasAdministrativeTenders = false;

  const textToAnalyze = materias
    .map((m) => `${m.nome} ${m.conteudo}`)
    .join(' ')
    .toLowerCase();

  if (
    textToAnalyze.includes('stf') ||
    textToAnalyze.includes('stj') ||
    textToAnalyze.includes('jurisprudência') ||
    textToAnalyze.includes('precedentes') ||
    textToAnalyze.includes('adi') ||
    textToAnalyze.includes('adc') ||
    textToAnalyze.includes('adpf') ||
    textToAnalyze.includes('súmula') ||
    textToAnalyze.includes('controle de constitucionalidade') ||
    textToAnalyze.includes('temas de recursos') ||
    textToAnalyze.includes('repetitivos') ||
    textToAnalyze.includes('jurisprudente')
  ) {
    hasControlOrSTForSTJ = true;
  }

  if (
    textToAnalyze.includes('teoria') ||
    textToAnalyze.includes('doutrina') ||
    textToAnalyze.includes('crime') ||
    textToAnalyze.includes('princípios') ||
    textToAnalyze.includes('conceito') ||
    textToAnalyze.includes('constitucionalidade material') ||
    textToAnalyze.includes('atos administrativos') ||
    textToAnalyze.includes('repartição de competências') ||
    textToAnalyze.includes('direitos fundamentais')
  ) {
    hasTeoriaOrCrimeOrConstituicao = true;
  }

  if (
    textToAnalyze.includes('art.') ||
    textToAnalyze.includes('arts.') ||
    textToAnalyze.includes('lei seca') ||
    textToAnalyze.includes('lindb') ||
    textToAnalyze.includes('prazo') ||
    textToAnalyze.includes('competência expressa') ||
    textToAnalyze.includes('bens') ||
    textToAnalyze.includes('contratos') ||
    textToAnalyze.includes('casuística')
  ) {
    hasProcessoCivilOrPrazosOrLei = true;
  }

  if (textToAnalyze.includes('licitações') || textToAnalyze.includes('lei 14133') || textToAnalyze.includes('lei 8429')) {
    hasAdministrativeTenders = true;
  }

  if (diaNum === 1 || textToAnalyze.includes('lindb')) {
    return enfase(
      'lei_seca',
      'Lei Seca (Literalidade)',
      'leiSeca',
      'doutrina',
      'jurisprudencia',
      'Neste ponto a leitura começa pelo texto da norma. A doutrina organiza o dispositivo e a jurisprudência entra com menor intensidade.'
    );
  }

  if (diaNum === 2 || textToAnalyze.includes('art. 5º')) {
    return enfase(
      'jurisprudencia',
      'Jurisprudência / Precedentes',
      'jurisprudencia',
      'leiSeca',
      'doutrina',
      'O texto constitucional continua indispensável, mas a ênfase de leitura está nos precedentes. A doutrina fica em menor intensidade.'
    );
  }

  if (hasControlOrSTForSTJ) {
    return enfase(
      'jurisprudencia',
      'Jurisprudência Temática',
      'jurisprudencia',
      'leiSeca',
      'doutrina',
      'A ênfase deste recorte está nos precedentes e nas súmulas. O texto legal permanece em intensidade média e a doutrina, em menor intensidade.'
    );
  }

  if (hasTeoriaOrCrimeOrConstituicao && !hasProcessoCivilOrPrazosOrLei) {
    return enfase(
      'doutrina',
      'Teórico-Doutrinário (Doutrina Densa)',
      'doutrina',
      'leiSeca',
      'jurisprudencia',
      'A ênfase está na construção doutrinária do instituto. A lei seca entra em intensidade média e a jurisprudência, em menor intensidade.'
    );
  }

  if (hasAdministrativeTenders) {
    return enfase(
      'lei_seca',
      'Lei Seca e Súmulas Correlatas',
      'leiSeca',
      'jurisprudencia',
      'doutrina',
      'A ênfase está no texto da lei de licitações ou de improbidade. A jurisprudência correlata entra em intensidade média e a doutrina, em menor intensidade.'
    );
  }

  if (textToAnalyze.includes('lei') || textToAnalyze.includes('art') || textToAnalyze.includes('código') || hasProcessoCivilOrPrazosOrLei) {
    return enfase(
      'lei_seca',
      'Incidência de Lei Seca',
      'leiSeca',
      'jurisprudencia',
      'doutrina',
      'A ênfase está na literalidade: prazos, rito, competências e exceções. A jurisprudência entra em intensidade média e a doutrina, em menor intensidade.'
    );
  }

  return {
    prioridade: 'doutrina',
    label: 'Equilíbrio Doutrinário / Súmulas',
    faixas: { leiSeca: 'media', doutrina: 'alta', jurisprudencia: 'media' },
    justificativa: 'A ênfase está na teoria, com lei seca e jurisprudência em intensidade média. Nenhuma das três some do estudo.',
    concursoHistorico: AVISO,
  };
}

export function instrucaoEnfase(rotulo: string, incidencia: IncidenciaData): string {
  const lei = incidencia.prioridade === 'lei_seca' ? 'prioridade máxima' : 'leitura complementar indispensável';
  const juris = incidencia.prioridade === 'jurisprudencia' ? 'prioridade máxima' : 'atenção especial às distinções do STF/STJ';
  const doutrina = incidencia.prioridade === 'doutrina' ? 'prioridade máxima' : 'compreensão dos conceitos estruturantes';
  const foco = incidencia.prioridade === 'lei_seca'
    ? 'LEI SECA (Literalidade Decodificada)'
    : incidencia.prioridade === 'jurisprudencia'
      ? 'JURISPRUDÊNCIA dos tribunais superiores'
      : 'DOUTRINA dos conceitos estruturantes';
  return `[INSTRUÇÃO DE FOCO DE LEITURA]
No recorte ${rotulo}, o foco será ${foco}, complementado pelos outros eixos.
É proibido atribuir percentual a banca, prova ou cobrança. É proibido escrever nível de incidência (alta, média, baixa ou menor). Não invente estatística.
Na saudação, apresente o foco somente assim, sem números e sem a palavra incidência:
Lei Seca: ${lei}
Jurisprudência: ${juris}
Doutrina: ${doutrina}
As carreiras citadas são apenas Magistratura, Ministério Público e Defensoria Pública.
------
`;
}
