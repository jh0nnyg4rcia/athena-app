/**
 * Recorta uma parte interna do markdown-fonte da aula.
 * O índice 0 é [BLOCK_1], o índice 1 é [BLOCK_2], sem presumir que existam seis partes.
 * O recorte começa no marcador e termina imediatamente antes do próximo marcador.
 */

const BLOCK_MARKER = /\[BLOCK_(\d+)\]/g;

export function sectionReviewKey(day: number, materialIndex: number, blockIndex: number): string {
  return `day_${day}_part_${materialIndex}_block_${blockIndex}`;
}

export function isSectionReviewKey(lessonId: string): boolean {
  return /^day_\d+_part_\d+_block_\d+$/.test(lessonId);
}

export function extractCatalogBlock(content: string, blockIndex: number): string | null {
  if (typeof content !== "string") return null;
  if (typeof blockIndex !== "number" || !Number.isInteger(blockIndex) || blockIndex < 0) return null;
  const target = blockIndex + 1;
  const markers: Array<{ number: number; index: number }> = [];
  for (const match of content.matchAll(BLOCK_MARKER)) {
    const number = Number(match[1]);
    if (!Number.isInteger(number) || number < 1 || match.index === undefined) continue;
    markers.push({ number, index: match.index });
  }
  const start = markers.find((marker) => marker.number === target);
  if (!start) return null;
  const next = markers.find((marker) => marker.index > start.index);
  const slice = content.slice(start.index, next ? next.index : content.length);
  if (!slice.trim()) return null;
  return slice;
}
