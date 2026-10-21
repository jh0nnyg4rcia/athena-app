/**
 * Troca, só na hora de exibir, o percentual inventado de incidência
 * por faixa alta, média ou menor. Não altera pena, alíquota nem o cache.
 */
import { textoFaixa, type FaixaIncidencia } from '../utils/incidenciaUtils';

const AXIS = /lei\s*seca|doutrina|jurisprud/i;
const PENALTY = /\b(pena|reclus[aã]o|deten[cç][aã]o|multa|prescri[cç][aã]o|honor[aá]ri|al[ií]quota|juros|selic|sal[aá]rio|reduz|aument|diminui|major|atenu|metade|ter[cç]o|dobro|triplo)\b/i;
const TAX_BASE = /hip[oó]tese de incid[eê]ncia|base de c[aá]lculo/i;
function percentPattern(): RegExp {
  return /(\d{1,3})(?:[.,]\d+)?\s*%/g;
}

function percentsIn(line: string): number[] {
  const found: number[] = [];
  for (const match of line.matchAll(percentPattern())) {
    const value = parseInt(match[1], 10);
    if (value <= 100) found.push(value);
  }
  return found;
}

function isAxisLine(line: string): boolean {
  return AXIS.test(line) && percentsIn(line).length > 0 && !TAX_BASE.test(line);
}

function bandFor(value: number, values: number[]): FaixaIncidencia {
  const distinct = [...new Set(values)].sort((a, b) => b - a);
  if (distinct.length === 1) {
    if (value >= 50) return 'alta';
    if (value >= 30) return 'media';
    return 'baixa';
  }
  if (value === distinct[0]) return 'alta';
  if (value === distinct[distinct.length - 1]) return 'baixa';
  return 'media';
}

function replacePercents(line: string, bands: FaixaIncidencia[]): string {
  let index = 0;
  return line.replace(percentPattern(), (full, raw: string) => {
    const value = parseInt(raw, 10);
    if (value > 100) return full;
    const band = bands[index++];
    return band ? textoFaixa(band) : full;
  });
}

function softenProse(line: string): string {
  if (TAX_BASE.test(line)) return line;
  if (PENALTY.test(line) && !AXIS.test(line)) return line;
  if (!/incid[eê]ncia|estat[ií]stic|quest[oõ]es|cobran[cç]a|percentual|banca/i.test(line)) return line;
  return line.replace(percentPattern(), (full, raw: string) => {
    const value = parseInt(raw, 10);
    if (value > 100) return full;
    return textoFaixa(value >= 50 ? 'alta' : value >= 30 ? 'media' : 'baixa');
  });
}

export function softenIncidenceMarkdown(source: string): string {
  if (!source) return '';
  const lines = source.split('\n');
  const axisIndexes = lines
    .map((line, index) => (isAxisLine(line) ? index : -1))
    .filter((index) => index >= 0);

  const clusters: number[][] = [];
  for (const index of axisIndexes) {
    const current = clusters[clusters.length - 1];
    if (current && index - current[current.length - 1] <= 3) current.push(index);
    else clusters.push([index]);
  }

  const consumed = new Set<number>();
  for (const cluster of clusters) {
    const values = cluster.flatMap((index) => percentsIn(lines[index]));
    for (const index of cluster) {
      const bands = percentsIn(lines[index]).map((value) => bandFor(value, values));
      lines[index] = replacePercents(lines[index], bands);
      consumed.add(index);
    }
  }

  return lines
    .map((line, index) => (consumed.has(index) ? line : softenProse(line)))
    .join('\n');
}
