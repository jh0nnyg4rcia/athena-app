/**
 * Ajusta só o que o aluno vê. Não regrava o cache nem o catálogo.
 * Troca o vocabulário da trilha, limita a carreira-alvo e tira incidência não medida.
 */

const THREE_CAREERS = "Magistratura, Ministério Público e Defensoria Pública";
const AXIS = /lei\s*seca|doutrina|jurisprud/i;
const PENALTY = /\b(pena|reclus[aã]o|deten[cç][aã]o|multa|prescri[cç][aã]o|honor[aá]ri|al[ií]quota|juros|selic|sal[aá]rio|reduz|aument|diminui|major|atenu|metade|ter[cç]o|dobro|triplo)\b/i;
const TAX_BASE = /hip[oó]tese de incid[eê]ncia|base de c[aá]lculo/i;
const STAT_TALK = /incid[eê]ncia|estat[ií]stic|banca|percentual|cobran[cç]a|quest[oõ]es hist|raio-x/i;

function percentPattern(): RegExp {
  return /(\d{1,3})(?:[.,]\d+)?\s*%/g;
}

export function stripUnprovenIncidence(source: string): string {
  if (!source) return "";
  return source
    .split("\n")
    .map((line) => {
      if (TAX_BASE.test(line)) return line;
      if (PENALTY.test(line) && !AXIS.test(line) && !STAT_TALK.test(line)) return line;

      const originalStat = STAT_TALK.test(line) || /🔴|🟡|🟢/.test(line);
      let out = line;
      out = out.replace(/🔴\s*alta incid[eê]ncia|🟡\s*m[eé]dia incid[eê]ncia|🟢\s*menor incid[eê]ncia/gi, "");
      out = out.replace(/\b(alta|m[eé]dia|menor|baixa)\s+incid[eê]ncia\b/gi, "");
      out = out.replace(
        /(?:cerca de\s+|aproximadamente\s+|quase\s+)?\d{1,3}(?:[.,]\d+)?\s*%(?:\s+d[aeo]s?\s+(?:quest[oõ]es|cobran[cç]a|incid[eê]ncia|provas?|bancas?))?(?:\s+hist[oó]ric\w*)?/gi,
        ""
      );
      if ((STAT_TALK.test(out) || AXIS.test(out)) && !PENALTY.test(out)) {
        out = out.replace(percentPattern(), (full, raw: string) => {
          const value = parseInt(raw, 10);
          return value > 100 ? full : "";
        });
      }
      if (/an[aá]lise d[ea]s? bancas|mapeamento de incid|refer[eê]ncia hist[oó]rica|foco inteligente|foco de banca/i.test(out) && !PENALTY.test(out)) {
        return "";
      }
      out = out.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").replace(/:\s*$/g, "").trim();
      if (/^(lei seca|doutrina|jurisprud[eê]ncia)\s*$/i.test(out)) return "";
      if (originalStat && !PENALTY.test(line) && !TAX_BASE.test(line)) {
        const words = out.split(/\s+/).filter(Boolean);
        if (words.length < 8 && !/\bart\.|lei\s|s[uú]mula|\bstf\b|\bstj\b/i.test(out)) return "";
      }
      return out;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function restrictAudienceCareers(source: string): string {
  if (!source) return "";
  let out = source;
  const swaps: Array<[RegExp, string]> = [
    [/concursos da magistratura, do ministério público, da defensoria pública, da procuradoria e de delegado de polícia/gi, "concursos da Magistratura, do Ministério Público e da Defensoria Pública"],
    [/magistratura,\s*(?:do\s+)?minist[eé]rio p[uú]blico,\s*(?:da\s+)?defensoria(?:\s+p[uú]blica)?,\s*procuradoria e delegado de pol[ií]cia/gi, THREE_CAREERS],
    [/magistratura,\s*mp,\s*defensorias?\s+e\s+oab/gi, THREE_CAREERS],
    [/magistratura,\s*minist[eé]rio p[uú]blico,\s*defensorias?\s+e\s+oab/gi, THREE_CAREERS],
    [/,?\s*(?:da\s+)?procuradoria e de delegado de pol[ií]cia/gi, ""],
    [/,?\s*procuradorias?\s*(?:&|e)\s*oab/gi, ""],
    [/\bconcurso d[aeo] procuradoria\b/gi, "concurso da Magistratura, do Ministério Público ou da Defensoria Pública"],
    [/\bconcurso de delegado de pol[ií]cia\b/gi, "concurso da Magistratura, do Ministério Público ou da Defensoria Pública"],
    [/\bcarreira de delegado de pol[ií]cia\b/gi, "carreira da Magistratura, do Ministério Público ou da Defensoria Pública"],
    [/\bexame de ordem\b/gi, "prova"],
    [/\bdelegado de pol[ií]cia e exame de ordem\b/gi, THREE_CAREERS],
  ];
  for (const [pattern, replacement] of swaps) out = out.replace(pattern, replacement);
  return out;
}

/** O recorte do dia passa a se chamar bloco. Cada um dos 6 trechos passa a se chamar parte. */
export function renameDisplayedStructure(source: string): string {
  if (!source) return "";
  let out = source;
  out = out.replace(/\b([Pp]arte)\s+(\d+)\s+de\s+(\d+)\b/g, (_full, word: string, index: string, total: string) => {
    const label = word[0] === "P" ? "Bloco" : "bloco";
    return `${label} ${index} de ${total}`;
  });
  out = out.replace(/\b([Bb]loco)\s+([1-6])\b(?!\s+de\s+\d)/g, (_full, word: string, index: string) => {
    const label = word[0] === "B" ? "Parte" : "parte";
    return `${label} ${index}`;
  });
  out = out.replace(/\bos\s+(\d+)\s+blocos\b/gi, "as $1 partes");
  out = out.replace(/\b(\d+)\s+blocos\b/gi, "$1 partes");
  out = out.replace(/\bfluxo de estudos em blocos\b/gi, "fluxo de estudos em partes");
  out = out.replace(/\btodos os blocos de estudo\b/gi, "todas as partes de estudo");
  out = out.replace(/\bcompletou todos os blocos\b/gi, "completou todas as partes");
  out = out.replace(/\bbloco a bloco\b/gi, "parte a parte");
  out = out.replace(/\boutros blocos\b/gi, "outras partes");
  return out;
}

export function presentSavedLesson(source: string): string {
  return renameDisplayedStructure(restrictAudienceCareers(stripUnprovenIncidence(source)));
}
