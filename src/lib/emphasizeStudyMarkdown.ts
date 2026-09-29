/**
 * Dá negrito ao rótulo do tópico quando a aula salva veio sem markdown.
 * Não mexe em linha que já tem negrito e não altera o cache.
 */
export function emphasizeStudyMarkdown(source: string): string {
  if (!source) return '';
  return source.split('\n').map((line) => emphasizeLine(line)).join('\n');
}

function emphasizeLine(line: string): string {
  if (line.includes('**') || line.includes('<strong') || line.includes('<b>')) return line;

  const heading = line.match(/^(\s*#{1,4}\s+)(.+)$/);
  if (heading) {
    return `${heading[1]}**${heading[2].trim()}**`;
  }

  const list = line.match(/^(\s*(?:[-*•]|\d+[.)])\s+)(.+)$/);
  if (!list) return line;

  const body = list[2].trim();
  const colon = body.match(/^([^:]{3,90}):\s*(.+)$/);
  if (colon && !colon[1].includes('http')) {
    return `${list[1]}**${colon[1].trim()}:** ${colon[2]}`;
  }

  const dash = body.match(/^(.{8,80}?)(\s+[–—]\s+)(.+)$/);
  if (dash) {
    return `${list[1]}**${dash[1].trim()}**${dash[2]}${dash[3]}`;
  }

  return line;
}
