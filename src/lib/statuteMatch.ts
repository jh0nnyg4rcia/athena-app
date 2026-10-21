/**
 * Compara o número do diploma programado com o texto de apoio.
 * "8.137" e "8137" são o mesmo diploma. "15211" não é "1521".
 */

export function compactStatuteText(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2');
}

export function containsDiploma(text: string, digits: string): boolean {
  if (!digits) return false;
  const compact = compactStatuteText(text);
  return new RegExp(`(?<!\\d)${digits}(?!\\d)`).test(compact);
}

/** Número da lei, do decreto ou da resolução nomeados no recorte. */
export function namedStatuteDigits(subject: string): string | null {
  const folded = compactStatuteText(subject);
  const match = folded.match(
    /(?:lei(?:\s+complementar)?|decreto(?:\s*-?\s*lei)?|resolucao|medida\s+provisoria)\s*(?:n(?:o|º|\.)?\s*)?(\d{3,6})\b/
  );
  return match ? match[1] : null;
}

export function formatDiploma(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function diplomaConfinementPrompt(subject: string, content: string): string {
  const digits = namedStatuteDigits(subject) || namedStatuteDigits(content);
  if (!digits) return '';
  const formatted = formatDiploma(digits);
  return `
[DIPLOMA INSUBSTITUÍVEL]
O recorte programado é a Lei nº ${formatted} (${content || subject}).
A aula, as questões e a revisão existem somente sobre esse diploma.
É proibido substituí-lo pelos arts. 337-E a 337-P do Código Penal ou pela Lei nº 14.133/2021, salvo se o próprio recorte desta parte nomear expressamente esses dispositivos.
Se o material de apoio reunir várias leis no mesmo arquivo, use apenas os trechos da Lei nº ${formatted} e ignore os demais números.
A palavra "crimes" no título não autoriza trocar o diploma programado.`;
}
