/**
 * Auditoria do limiar de 90% da cobertura. Não altera o algoritmo.
 * Um caso "aceito" aqui é falso negativo: o bloco mudou e a validação deixou passar.
 */
import { changeHunks } from "../src/lib/legalReviewDiff";
import {
  COVERAGE_TOKEN_RATIO,
  SHORT_DELTA_TOKEN_LIMIT,
  assessSubstantiveCoverage,
  coverageTokens,
  uncoveredSubstantiveEdits,
} from "../src/lib/legalReviewValidate";

const ORIGINAL = "casa mesa livro porta chave folha pedra vidro ferro cobra";
const PREFIX = "regime passa a prever sanção maior desde logo agora";

function requiredMatches(length: number): number {
  if (length <= SHORT_DELTA_TOKEN_LIMIT) return length;
  return Math.ceil(length * COVERAGE_TOKEN_RATIO);
}

function quote(change: { originalExcerpt: string; revisedExcerpt: string }) {
  return change;
}

function accepted(original: string, revised: string, changes: Array<{ originalExcerpt: string; revisedExcerpt: string }>): boolean {
  return uncoveredSubstantiveEdits(original, revised, changes).length === 0;
}

interface Row {
  id: string;
  esperado: "rejeitar";
  aceito: boolean;
  delta: string[];
  exigido: number;
  omitido: string;
}

const rows: Row[] = [];

function runOmitExact(id: string, revisedTail: string, excerptTail: string, omitido: string) {
  const revised = `${PREFIX} ${revisedTail}`.trim();
  const excerpt = `${PREFIX} ${excerptTail}`.trim();
  const delta = coverageTokens(revised);
  rows.push({
    id,
    esperado: "rejeitar",
    aceito: accepted(ORIGINAL, revised, [quote({ originalExcerpt: ORIGINAL, revisedExcerpt: excerpt })]),
    delta,
    exigido: requiredMatches(delta.length),
    omitido,
  });
}

const suffixCases: Array<[string, string, string, string]> = [
  ["1 não", "não", "", "não"],
  ["2 artigo", "121", "", "121"],
  ["3 parágrafo número", "§ 5º", "", "5º"],
  ["3b parágrafo símbolo com o número citado", "§ 5º", "5º", "§"],
  ["4 inciso", "inciso III", "inciso", "iii"],
  ["5 pena no fim", "reclusão de 6 anos", "reclusão de 6", "anos"],
  ["5b pena no meio", "reclusão de 6 anos", "reclusão de anos", "6"],
  ["6 data no fim", "15 de março de 2026", "15 de março de", "2026"],
  ["6b data no meio", "15 de março de 2026", "de março de 2026", "15"],
  ["7 lei", "lei 9.605", "lei", "9.605"],
  ["8 tema", "tema 999.999", "tema", "999.999"],
  ["9 súmula", "súmula 331", "súmula", "331"],
  ["10 tribunal", "stf", "", "stf"],
  ["11 constitucional", "inconstitucional", "", "inconstitucional"],
  ["12 revogado", "revogado", "", "revogado"],
  ["12b vigente", "vigente", "", "vigente"],
];

for (const [id, tail, excerptTail, omitido] of suffixCases) runOmitExact(id, tail, excerptTail, omitido);

const middleRevised = `${PREFIX} não`;
const middleExcerpt = "regime passa a prever não maior desde logo agora";
const middleDelta = coverageTokens(middleRevised);
const middleAccepted = accepted(ORIGINAL, middleRevised, [quote({
  originalExcerpt: ORIGINAL,
  revisedExcerpt: middleExcerpt,
})]);

const inverseRevised = `${PREFIX} não`;
const inverseExcerpt = "regime passa a prever sanção não";
const inverseAccepted = accepted(ORIGINAL, inverseRevised, [quote({
  originalExcerpt: ORIGINAL,
  revisedExcerpt: inverseExcerpt,
})]);

const sectionOnlyOriginal = "O prazo comum é de cinco dias segundo a regra geral deste bloco.";
const sectionOnlyRevised = "O prazo comum é de § cinco dias segundo a regra geral deste bloco.";
const sectionDeltaRemoved = coverageTokens(sectionOnlyOriginal);
const sectionDeltaAdded = coverageTokens(sectionOnlyRevised);
const sectionAccepted = accepted(sectionOnlyOriginal, sectionOnlyRevised, [quote({
  originalExcerpt: sectionOnlyOriginal,
  revisedExcerpt: "O prazo comum é de cinco dias segundo a regra geral deste bloco.",
})]);

const hunkOneOriginal = "alfa bravo charlie delta echo";
const hunkOneRevised = "um dois tres quatro cinco";
const hunkTwoOriginal = "foxtrot golf hotel india juliet";
const hunkTwoRevised = "seis sete oito nove dez";
const twoHunkOriginal = `${hunkOneOriginal}\n\n${hunkTwoOriginal}`;
const twoHunkRevised = `${hunkOneRevised}\n\n${hunkTwoRevised}`;
const oneChangeTwoHunks = accepted(twoHunkOriginal, twoHunkRevised, [quote({
  originalExcerpt: hunkOneOriginal,
  revisedExcerpt: hunkOneRevised,
})]);
const concatenated = accepted(twoHunkOriginal, twoHunkRevised, [quote({
  originalExcerpt: `${hunkOneOriginal} ${hunkTwoOriginal}`,
  revisedExcerpt: `${hunkOneRevised} ${hunkTwoRevised}`,
})]);

const bigOriginal = ORIGINAL;
const bigRevised = `${PREFIX} não`;
const partialChanges = [
  quote({ originalExcerpt: "casa mesa livro porta chave", revisedExcerpt: "regime passa a prever sanção maior" }),
  quote({ originalExcerpt: "folha pedra vidro ferro cobra", revisedExcerpt: "desde logo agora não" }),
];
const partialA = accepted(bigOriginal, bigRevised, partialChanges);
const partialReport = assessSubstantiveCoverage(bigOriginal, bigRevised, partialChanges);

console.log(JSON.stringify({
  ratio: COVERAGE_TOKEN_RATIO,
  curtoExigeTudoAte: SHORT_DELTA_TOKEN_LIMIT,
  sufixo: rows.map((row) => ({
    id: row.id,
    aceito: row.aceito,
    tokens: row.delta.length,
    exigido: row.exigido,
    delta: row.delta,
    omitido: row.omitido,
    omitidoEstaNoDelta: row.delta.includes(row.omitido),
  })),
  meio: {
    aceito: middleAccepted,
    delta: middleDelta,
    exigido: requiredMatches(middleDelta.length),
    excerpt: coverageTokens(middleExcerpt),
  },
  inverso: {
    aceito: inverseAccepted,
    delta: coverageTokens(inverseRevised),
    exigido: requiredMatches(coverageTokens(inverseRevised).length),
    excerpt: coverageTokens(inverseExcerpt),
  },
  paragrafoInvisivel: {
    aceito: sectionAccepted,
    removidos: sectionDeltaRemoved,
    adicionados: sectionDeltaAdded,
    hunks: changeHunks(sectionOnlyOriginal, sectionOnlyRevised).map((hunk) => hunk.kind),
  },
  umChangeDoisHunks: {
    aceito: oneChangeTwoHunks,
    hunks: changeHunks(twoHunkOriginal, twoHunkRevised).length,
  },
  excerptConcatenadoNaoCobreDois: {
    aceito: concatenated,
  },
  doisChangesParciais: {
    aceito: partialA,
    cobertura: partialReport,
  },
}, null, 2));

const vulneraveis = rows.filter((row) => row.aceito).map((row) => row.id);
if (sectionAccepted) vulneraveis.push("3b § some do alfabeto de tokens");
if (oneChangeTwoHunks || concatenated || partialA || middleAccepted || inverseAccepted) {
  vulneraveis.push("controle que deveria rejeitar foi aceito");
}
if (vulneraveis.length) {
  console.error(`VULNERAVEIS: ${vulneraveis.join("; ")}`);
  process.exitCode = 1;
}
