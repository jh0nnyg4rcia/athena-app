/** Voz institucional da ATHENA: carreira ampla, sem concurso nominado, sem tabelas. */

export const ATHENA_AUDIENCE_TITLE = "Futuro(a) Aprovado(a)";

export const ATHENA_CAREERS_LABEL =
  "concursos da magistratura, do ministério público, da defensoria pública, da procuradoria e de delegado de polícia";

export function flattenMarkdownTables(text: string): string {
  if (!text || !text.includes("|")) return text;
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;

  const isRow = (line: string) => {
    const t = line.trim();
    return t.startsWith("|") && t.includes("|", 1);
  };
  const isSep = (line: string) => /^\s*\|?\s*:?-{3,}/.test(line.trim());
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c && !/^:?-{3,}:?$/.test(c));

  while (i < lines.length) {
    if (isRow(lines[i]) && i + 1 < lines.length && isSep(lines[i + 1])) {
      const header = cells(lines[i]);
      i += 2;
      while (i < lines.length && isRow(lines[i])) {
        if (isSep(lines[i])) {
          i += 1;
          continue;
        }
        const row = cells(lines[i]);
        const parts = header
          .map((h, idx) => (row[idx] ? `**${h}:** ${row[idx]}` : ""))
          .filter(Boolean);
        if (parts.length) out.push(`- ${parts.join(" · ")}`);
        i += 1;
      }
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }
  return out.join("\n");
}

export function generalizeContestNames(text: string): string {
  if (!text) return text;
  let out = text;
  const replacements: Array<[RegExp, string]> = [
    [/\bDPU\s*\d{4}\b/gi, "concurso da defensoria pública"],
    [/\bDPE[-\s]?[A-Z]{2}\s*\d{4}\b/gi, "concurso da defensoria pública"],
    [/\bPG[EF][-\s]?[A-Z]{0,2}\s*\d{4}\b/gi, "concurso da procuradoria"],
    [/\bPC[-\s]?[A-Z]{2}\s*\d{4}\b/gi, "concurso de delegado de polícia"],
    [/\bMP[-\s]?[A-Z]{2,3}\s*\d{4}\b/gi, "concurso do ministério público"],
    [/\bTRF\s*-?\s*\d\s*\d{4}\b/gi, "concurso da magistratura"],
    [/\bMagistratura Federal TRF\s*-?\s*\d\s*\d{4}\b/gi, "concurso da magistratura"],
    [/\bTJ[-\s]?[A-Z]{2}\s*\d{4}\b/gi, "concurso da magistratura"],
    [/\bTRE[-\s]?[A-Z]{2}\s*\d{4}\b/gi, "concurso da magistratura"],
  ];
  for (const [re, label] of replacements) {
    out = out.replace(re, label);
  }
  return out;
}

export function sanitizeAthenaVoice(text: string): string {
  if (!text) return text;
  let out = flattenMarkdownTables(text);
  out = out.replace(/Futuro\(a\)\s+Magistrado\(a\)/gi, ATHENA_AUDIENCE_TITLE);
  out = out.replace(/Futuros?\s+Magistrados?/gi, ATHENA_AUDIENCE_TITLE);
  out = out.replace(/Futuro\(a\)\s+Juiz\(a\)/gi, ATHENA_AUDIENCE_TITLE);
  out = generalizeContestNames(out);
  return out;
}

export function keepObjectiveChallengeQuestions<T extends { correctIndex?: number }>(
  questions: T[] | undefined
): T[] {
  if (!Array.isArray(questions)) return [];
  return questions.filter((q) => {
    const idx = Number(q.correctIndex);
    return Number.isInteger(idx) && idx >= 0 && idx <= 4;
  });
}
