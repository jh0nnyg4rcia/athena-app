/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Retorna a chave normalizada da família da disciplina (ex: "ADMINISTRATIVO", "CONSTITUCIONAL", etc.)
 */
export function normalizeDisciplineFamily(disc: string): string {
  const d = (disc || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (d.includes("notar") || d.includes("registr") || d.includes("cartor") || d.includes("tabeli")) return "NOTARIAL_REGISTRAL";
  if (d.includes("seguridade") || d.includes("previdenc")) return "PREVIDENCIARIO";
  if (d.includes("process") && d.includes("trabalh")) return "PROCESSO_TRABALHO";
  if (d.includes("coletiv") && d.includes("trabalh")) return "TRABALHO_COLETIVO";
  if (d.includes("trabalh")) return "TRABALHO";
  if (d.includes("process") && d.includes("penal")) return "PROCESSO_PENAL";
  if (d.includes("criminolog")) return "CRIMINOLOGIA";
  if (d.includes("especial") || d.includes("drogas") || d.includes("abuso") || d.includes("orcrim")) return "PENAL_ESPECIAL";
  if (d.includes("penal") || d.includes("crime")) return "PENAL";
  if (d.includes("process") && d.includes("civil")) return "PROCESSO_CIVIL";
  if (d.includes("civil")) return "CIVIL";
  if (d.includes("financeiro") || d.includes("economico") || d.includes("orcament")) return "FINANCEIRO";
  if (d.includes("tribut") || d.includes("fiscal")) return "TRIBUTARIO";
  if (d.includes("constituc")) return "CONSTITUCIONAL";
  if (d.includes("ambiental")) return "AMBIENTAL";
  if (d.includes("agrario")) return "AGRARIO";
  if (d.includes("empresarial") || d.includes("comercial") || d.includes("falencia")) return "EMPRESARIAL";
  if (d.includes("internacional")) return "INTERNACIONAL";
  if (d.includes("eleitoral")) return "ELEITORAL";
  if (d.includes("consumidor")) return "CONSUMIDOR";
  if (d.includes("eca") || d.includes("crianca") || d.includes("adolescente")) return "ECA";
  if (d.includes("humanos") || d.includes("convencionalidade")) return "HUMANOS";
  if (d.includes("defensoria")) return "DEFENSORIA";
  if (d.includes("militar")) return "MILITAR";
  if (d.includes("humanistica") || d.includes("filosofia") || d.includes("sociologia")) return "HUMANISTICA";
  if (d.includes("medicina") || d.includes("tanatologia")) return "MEDICINA";
  if (d.includes("difus") || d.includes("coletiv")) return "DIFUSOS";
  if (d.includes("agu") || d.includes("gestao de conflitos") || d.includes("educacao, ciencia") || d.includes("governanca")) return "ADMINISTRATIVO";
  if (d.includes("administr") || d.includes("licita") || d.includes("improbidade") || d.includes("servidor")) return "ADMINISTRATIVO";
  return "GERAL";
}
