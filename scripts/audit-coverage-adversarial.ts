/**
 * Regressão da cobertura jurídica. Sai com código 0 só quando todo caso perigoso
 * é rejeitado e os casos editoriais ou integralmente declarados continuam aceitos.
 */
import { changeHunks } from "../src/lib/legalReviewDiff";
import {
  assessSubstantiveCoverage,
  coverageTokens,
  uncoveredSubstantiveEdits,
} from "../src/lib/legalReviewValidate";

const BASE = "casa mesa livro porta chave folha pedra vidro ferro cobra";
const LEFT = "regime passa a prever sanção";
const RIGHT = "maior desde logo agora";

type Quote = { originalExcerpt: string; revisedExcerpt: string };

const failures: string[] = [];
let executed = 0;
let dangerousRejected = 0;
let positivesAccepted = 0;

function covered(original: string, revised: string, changes: Quote[]): boolean {
  return uncoveredSubstantiveEdits(original, revised, changes).length === 0;
}

function expectReject(id: string, original: string, revised: string, changes: Quote[]) {
  executed += 1;
  if (covered(original, revised, changes)) failures.push(`${id}: aceito`);
  else dangerousRejected += 1;
}

function expectAccept(id: string, original: string, revised: string, changes: Quote[]) {
  executed += 1;
  if (!covered(original, revised, changes)) failures.push(`${id}: rejeitado`);
  else positivesAccepted += 1;
}

function expectTokens(id: string, text: string, expected: string[]) {
  executed += 1;
  const got = coverageTokens(text);
  if (got.join("|") !== expected.join("|")) failures.push(`${id}: ${got.join("|")}`);
  else positivesAccepted += 1;
}

function lineAt(position: "inicio" | "meio" | "fim", token: string): string {
  if (position === "inicio") return `${token} ${LEFT} ${RIGHT}`;
  if (position === "meio") return `${LEFT} ${token} ${RIGHT}`;
  return `${LEFT} ${RIGHT} ${token}`;
}

function withoutToken(text: string, token: string): string {
  const tokens = coverageTokens(text);
  const index = tokens.indexOf(token);
  if (index < 0) throw new Error(`token ${token} ausente em [${tokens.join(", ")}]`);
  return tokens.filter((_, tokenIndex) => tokenIndex !== index).join(" ");
}

const decisive: Array<[string, string]> = [
  ["1 não", "não"],
  ["2 artigo", "121"],
  ["3 §", "§"],
  ["4 número do parágrafo", "5º"],
  ["5 inciso", "iii"],
  ["6 número da pena", "6"],
  ["7 unidade da pena", "anos"],
  ["8 dia", "15"],
  ["9 mês", "março"],
  ["10 ano", "2026"],
  ["11 lei", "9.605"],
  ["12 tema", "999.999"],
  ["13 súmula", "331"],
  ["14 stf", "stf"],
  ["15 stj", "stj"],
  ["16 constitucional", "constitucional"],
  ["17 inconstitucional", "inconstitucional"],
  ["18 revogado", "revogado"],
  ["19 vigente", "vigente"],
];

expectTokens("tokenização § 5º", "§ 5º", ["§", "5º"]);
expectTokens("tokenização art. 121, § 2º", "art. 121, § 2º", ["art", "121", "§", "2º"]);
expectTokens("pontuação comum fica de fora", "olá, mundo.", ["olá", "mundo"]);

for (const [id, token] of decisive) {
  for (const position of ["inicio", "meio", "fim"] as const) {
    const revised = lineAt(position, token);
    const tokens = coverageTokens(revised);
    const at = position === "inicio" ? 0 : position === "fim" ? tokens.length - 1 : coverageTokens(LEFT).length;
    executed += 1;
    if (tokens[at] !== token || tokens.filter((item) => item === token).length !== 1) {
      failures.push(`${id} ${position}: token não está na posição pedida [${tokens.join(", ")}]`);
    } else {
      positivesAccepted += 1;
    }
    expectReject(`${id} omitido no ${position}`, BASE, revised, [{
      originalExcerpt: BASE,
      revisedExcerpt: withoutToken(revised, token),
    }]);
    expectAccept(`${id} integral no ${position}`, BASE, revised, [{
      originalExcerpt: BASE,
      revisedExcerpt: revised,
    }]);
  }
}

const sectionOriginal = "aplica-se o art. 10";
const sectionRevised = "aplica-se o art. 10, § 1º";
expectReject("A excerpt só com 1º", sectionOriginal, sectionRevised, [{
  originalExcerpt: sectionOriginal,
  revisedExcerpt: "1º",
}]);
expectAccept("B excerpt com § 1º", sectionOriginal, sectionRevised, [{
  originalExcerpt: sectionOriginal,
  revisedExcerpt: "§ 1º",
}]);

const sectionSwapFrom = "aplica-se o § 1º";
const sectionSwapTo = "aplica-se o § 2º";
expectAccept("C § 1º para § 2º nos dois lados", sectionSwapFrom, sectionSwapTo, [{
  originalExcerpt: "§ 1º",
  revisedExcerpt: "§ 2º",
}]);
expectReject("C sem o 2º revisado", sectionSwapFrom, sectionSwapTo, [{
  originalExcerpt: "§ 1º",
  revisedExcerpt: "§",
}]);
expectReject("C sem o 1º original", sectionSwapFrom, sectionSwapTo, [{
  originalExcerpt: "§",
  revisedExcerpt: "§ 2º",
}]);

const sectionDropped = "aplica-se o 1º";
expectReject("D remoção de § não declarada", sectionSwapFrom, sectionDropped, [{
  originalExcerpt: "1º",
  revisedExcerpt: "1º",
}]);
expectAccept("D remoção de § declarada", sectionSwapFrom, sectionDropped, [{
  originalExcerpt: "§ 1º",
  revisedExcerpt: "1º",
}]);

const sectionInsertedFrom = "aplica-se o 1º";
const sectionInsertedTo = "aplica-se o § 1º";
expectReject("E inserção de § não declarada", sectionInsertedFrom, sectionInsertedTo, [{
  originalExcerpt: "1º",
  revisedExcerpt: "1º",
}]);
expectAccept("E inserção de § declarada", sectionInsertedFrom, sectionInsertedTo, [{
  originalExcerpt: "1º",
  revisedExcerpt: "§ 1º",
}]);

const plain = "O prazo comum é de cinco dias segundo a regra geral deste bloco.";
expectAccept("CRLF para LF", "linha um\r\nlinha dois", "linha um\nlinha dois", []);
expectAccept("espaços repetidos", plain.replace("cinco dias", "cinco   dias"), plain, []);
expectAccept("linhas vazias", `${plain}\n\n${plain}`, `${plain}\n${plain}`, []);
expectAccept("só caixa", plain, plain.toLocaleUpperCase("pt-BR"), []);
expectAccept("só negrito", plain, plain.replace("cinco", "**cinco**"), []);
expectAccept("remover negrito", plain.replace("cinco", "**cinco**"), plain, []);
expectAccept("só itálico asterisco", plain, plain.replace("cinco", "*cinco*"), []);
expectAccept("só itálico sublinhado", plain, plain.replace("cinco", "_cinco_"), []);
expectAccept("reflow do parágrafo", plain, "O prazo comum é de cinco dias\nsegundo a regra geral deste bloco.", []);

const longOriginal = "O regime anterior previa multa isolada sem conversão neste trecho longo da aula de controle.";
const longRevised = longOriginal.replace("multa isolada", "reclusão de dois anos");
expectAccept("correção integral no parágrafo longo", longOriginal, longRevised, [{
  originalExcerpt: "multa isolada",
  revisedExcerpt: "reclusão de dois anos",
}]);
expectReject("correção parcial no parágrafo longo", longOriginal, longRevised, [{
  originalExcerpt: "multa",
  revisedExcerpt: "reclusão",
}]);
expectAccept("detenção para reclusão", "A pena é de detenção.", "A pena é de reclusão.", [{
  originalExcerpt: "detenção",
  revisedExcerpt: "reclusão",
}]);
expectAccept("art. 121 para art. 129", "Cabe o art. 121 no homicídio.", "Cabe o art. 129 no homicídio.", [{
  originalExcerpt: "121",
  revisedExcerpt: "129",
}]);
expectAccept("§ 1º para § 2º", "Incide o § 1º da lei.", "Incide o § 2º da lei.", [{
  originalExcerpt: "§ 1º",
  revisedExcerpt: "§ 2º",
}]);

expectReject("inverso com o token crítico e o resto incompleto", BASE, `${LEFT} ${RIGHT} não`, [{
  originalExcerpt: BASE,
  revisedExcerpt: "regime passa a prever sanção não",
}]);

const hunkOneOriginal = "alfa bravo charlie delta echo";
const hunkOneRevised = "um dois tres quatro cinco";
const hunkTwoOriginal = "foxtrot golf hotel india juliet";
const hunkTwoRevised = "seis sete oito nove dez";
expectReject("um change não cobre dois hunks", `${hunkOneOriginal}\n\n${hunkTwoOriginal}`, `${hunkOneRevised}\n\n${hunkTwoRevised}`, [{
  originalExcerpt: hunkOneOriginal,
  revisedExcerpt: hunkOneRevised,
}]);
expectReject("excerpt concatenado não cobre dois hunks", `${hunkOneOriginal}\n\n${hunkTwoOriginal}`, `${hunkOneRevised}\n\n${hunkTwoRevised}`, [{
  originalExcerpt: `${hunkOneOriginal} ${hunkTwoOriginal}`,
  revisedExcerpt: `${hunkOneRevised} ${hunkTwoRevised}`,
}]);
const partialReport = assessSubstantiveCoverage(BASE, `${LEFT} ${RIGHT} não`, [
  { originalExcerpt: "casa mesa livro porta chave", revisedExcerpt: "regime passa a prever sanção maior" },
  { originalExcerpt: "folha pedra vidro ferro cobra", revisedExcerpt: "desde logo agora não" },
]);
executed += 1;
if (partialReport.covered !== 0 || partialReport.uncovered !== 1 || changeHunks(BASE, `${LEFT} ${RIGHT} não`).length !== 1) {
  failures.push("dois changes parciais cobriram o hunk");
} else {
  dangerousRejected += 1;
}

function synthetic(prefix: string, count: number): string {
  return Array.from({ length: count }, (_, index) => `${prefix}${index}`).join(" ");
}

function omitAt(text: string, index: number): string {
  return coverageTokens(text).filter((_, tokenIndex) => tokenIndex !== index).join(" ");
}

for (const count of [5, 10, 20, 50]) {
  const added = synthetic("acr", count);
  const removed = synthetic("rem", count);
  const left = synthetic("sai", count);
  const right = synthetic("ent", count);
  expectAccept(`adição de ${count} integral`, "origemunica", added, [{
    originalExcerpt: "origemunica",
    revisedExcerpt: added,
  }]);
  expectAccept(`remoção de ${count} integral`, removed, "destinounico", [{
    originalExcerpt: removed,
    revisedExcerpt: "destinounico",
  }]);
  expectAccept(`substituição de ${count} integral`, left, right, [{
    originalExcerpt: left,
    revisedExcerpt: right,
  }]);
  for (let index = 0; index < count; index += 1) {
    expectReject(`adição de ${count} sem o token ${index}`, "origemunica", added, [{
      originalExcerpt: "origemunica",
      revisedExcerpt: omitAt(added, index),
    }]);
    expectReject(`remoção de ${count} sem o token ${index}`, removed, "destinounico", [{
      originalExcerpt: omitAt(removed, index),
      revisedExcerpt: "destinounico",
    }]);
    expectReject(`substituição de ${count} sem o token original ${index}`, left, right, [{
      originalExcerpt: omitAt(left, index),
      revisedExcerpt: right,
    }]);
    expectReject(`substituição de ${count} sem o token revisado ${index}`, left, right, [{
      originalExcerpt: left,
      revisedExcerpt: omitAt(right, index),
    }]);
  }
}

// --- COBERTURA COMPOSTA DETERMINÍSTICA DE HUNKS ---
// 1. Dois changes legítimos cobrindo partes distintas de um mesmo hunk -> aceitar
const comp1Orig = "O artigo 121 prevê pena de seis a vinte anos de reclusão.";
const comp1Rev = "O artigo 121 prevê pena de 6 a 20 anos de reclusão.";
expectAccept("composta 1: dois changes cobrindo partes distintas", comp1Orig, comp1Rev, [
  { originalExcerpt: "pena de seis a", revisedExcerpt: "pena de 6 a" },
  { originalExcerpt: "a vinte anos", revisedExcerpt: "a 20 anos" },
]);

// 2. Dois changes repetindo a cobertura dos mesmos tokens, deixando outro token do hunk descoberto -> rejeitar
expectReject("composta 2: repetindo mesmos tokens sem cobrir todo delta", comp1Orig, comp1Rev, [
  { originalExcerpt: "pena de seis a", revisedExcerpt: "pena de 6 a" },
  { originalExcerpt: "pena de seis a", revisedExcerpt: "pena de 6 a" },
]);

// 3. Três changes cuja união cubra exatamente 100% dos tokens removidos e 100% dos adicionados -> aceitar
const comp3Orig = "marco primeiro de abril e dois de maio e tres de junho fim";
const comp3Rev = "marco 1 de abril e 2 de maio e 3 de junho fim";
expectAccept("composta 3: tres changes com uniao 100%", comp3Orig, comp3Rev, [
  { originalExcerpt: "marco primeiro de abril", revisedExcerpt: "marco 1 de abril" },
  { originalExcerpt: "abril e dois de maio", revisedExcerpt: "abril e 2 de maio" },
  { originalExcerpt: "maio e tres de junho", revisedExcerpt: "maio e 3 de junho" },
]);

// 4. União que cubra 100% do removido mas 99% do adicionado (ex: falta 1 token) -> rejeitar
expectReject("composta 4: 100% removido mas falta 1 token adicionado", comp3Orig, comp3Rev, [
  { originalExcerpt: "marco primeiro de abril", revisedExcerpt: "marco 1 de abril" },
  { originalExcerpt: "abril e dois de maio", revisedExcerpt: "abril e 2 de maio" },
  { originalExcerpt: "maio e tres de junho", revisedExcerpt: "maio e de junho" },
]);

// 5. Um change com excerpt não literal (ex: 'artigo 121, nº 2' quando o texto diz 'artigo 121, 2') -> não contribui
const comp5Orig = "artigo 121, 2 e pena de seis a vinte anos";
const comp5Rev = "artigo 121, 2 e pena de 6 a 20 anos";
expectReject("composta 5: change com excerpt nao literal nao contribui", comp5Orig, comp5Rev, [
  { originalExcerpt: "artigo 121, nº 2 e pena de seis a", revisedExcerpt: "artigo 121, nº 2 e pena de 6 a" },
  { originalExcerpt: "a vinte anos", revisedExcerpt: "a 20 anos" },
]);

// 6. Change grounded no hunk errado -> não contribui
const comp6Orig = "pena de seis anos de prisao\n\nmulta de vinte reais";
const comp6Rev = "pena de 6 anos de prisao\n\nmulta de 20 reais";
expectReject("composta 6: change grounded no hunk errado nao contribui", comp6Orig, comp6Rev, [
  { originalExcerpt: "multa de vinte reais", revisedExcerpt: "multa de 20 reais" },
  { originalExcerpt: "multa de vinte reais", revisedExcerpt: "multa de 20 reais" },
]);

// 7. Dois changes com sobreposição parcial de tokens -> apenas posições efetivamente cobertas contam
const comp7Orig = "pena de dez e vinte e trinta anos";
const comp7Rev = "pena de 10 e 20 e 30 anos";
expectReject("composta 7: sobreposicao parcial sem cobrir todas posicoes", comp7Orig, comp7Rev, [
  { originalExcerpt: "pena de dez e vinte", revisedExcerpt: "pena de 10 e 20" },
  { originalExcerpt: "dez e vinte e", revisedExcerpt: "10 e 20 e" },
]);

// 8. Substituição de '§ 1º' por '§ 2º' dividida em changes -> aceita apenas se a união cobrir integralmente
const comp8Orig = "nos termos do § 1º e § 3º aplicaveis";
const comp8Rev = "nos termos do § 2º e § 4º aplicaveis";
expectAccept("composta 8: delta com § e ordinais aceito com uniao integral", comp8Orig, comp8Rev, [
  { originalExcerpt: "nos termos do § 1º", revisedExcerpt: "nos termos do § 2º" },
  { originalExcerpt: "e § 3º aplicaveis", revisedExcerpt: "e § 4º aplicaveis" },
]);

// 9. Múltiplos changes de um hunk não podem ser reutilizados para outro hunk
const comp9Orig = "pena de seis a vinte anos\n\npena de seis a vinte anos";
const comp9Rev = "pena de 6 a 20 anos\n\npena de 6 a 20 anos";
expectReject("composta 9: changes de um hunk nao podem ser reutilizados em outro", comp9Orig, comp9Rev, [
  { originalExcerpt: "pena de seis a", revisedExcerpt: "pena de 6 a" },
  { originalExcerpt: "a vinte anos", revisedExcerpt: "a 20 anos" },
]);

console.log(JSON.stringify({
  executados: executed,
  rejeitados: dangerousRejected,
  aceitos: positivesAccepted,
  falhas: failures,
}, null, 2));

if (failures.length) {
  console.error(`REGRESSAO_FALHOU: ${failures.join("; ")}`);
  process.exitCode = 1;
} else {
  console.log("Auditoria adversarial: regressão passou.");
}
