/**
 * Sistema de Cobertura Proposicional Determinística — ATHENA V2.3.2-B.
 *
 * Responsabilidade:
 * 1. Extrair deterministicamente unidades jurídicas auditáveis (PropositionUnits) do material via regex.
 * 2. Manter a hierarquia pai/filho (ex.: Art. 3º-B -> Incisos I a XV) sem mascarar folhas.
 * 3. Classificar unidades de alto risco (HIGH_RISK) com base em critérios objetivos.
 * 4. Validar o atestado de auditoria (auditedUnits) emitido pela Main Review.
 * 5. Gerar lotes compactos para Coverage Dirigida focada estritamente nas pendências (pendingUnits).
 * 6. Avaliar o Coverage Completeness Gate para garantir que nenhuma unidade crítica fique sem auditoria.
 *
 * O TypeScript controla COBERTURA e INTEGRIDADE.
 * O Modelo de IA continua decidindo o MÉRITO JURÍDICO.
 */

import type { ConsultedLegalSource } from "./legalReviewTypes";
import { matchOfficialHost } from "./legalReviewSources";
import { canonicalSourceUrl, computeSourceId } from "./legalReviewValidate";

export { computeSourceId };

export type PropositionRisk = "HIGH" | "MEDIUM" | "STANDARD";

export type PropositionType =
  | "ARTICLE_SECTION_HEADER"
  | "INLINE_ARTICLE_RULE"
  | "PARAGRAPH_RULE"
  | "INCISO_MAPPING"
  | "ALINEA_ITEM"
  | "PRECEDENT_MAPPING"
  | "SUMULA_MAPPING"
  | "THEME_MAPPING"
  | "TIMEFRAME_QUANTITY"
  | "NORMATIVE_MODALITY"
  | "OTHER_OBJECTIVE_MAPPING";

export interface PropositionUnit {
  id: string;
  type: PropositionType;
  citation: string;
  locator: string;
  text: string;
  context?: string;
  parentId?: string;
  parentCitation?: string;
  fingerprint: string;
  riskLevel: PropositionRisk;
  riskReasons: string[];
}

export type PropositionAuditStatus =
  | "AUDITED_CORRECT"
  | "AUDITED_INCORRECT"
  | "NOT_AUDITED"
  | "INDETERMINATE";

export interface AuditedPropositionInput {
  id: string;
  status: "AUDITED_CORRECT" | "AUDITED_INCORRECT";
  changeId?: string | null;
  evidenceSourceIds?: string[];
}

export interface CoverageSummary {
  total: number;
  auditedCorrect: number;
  auditedIncorrect: number;
  notAudited: number;
  indeterminate: number;
  highRiskTotal: number;
  highRiskResolved: number;
  coverageRate: number;
  highRiskCoverageRate: number;
  complete: boolean;
  pendingByType: Record<string, number>;
  pendingByRisk: Record<string, number>;
  attributedCorrectCount?: number;
  missingAttributionCount?: number;
  invalidAttributionCount?: number;
}

export interface DirectedCoverageBatch {
  batchIndex: number;
  totalBatches: number;
  units: PropositionUnit[];
  formattedPayload: string;
}

export interface DirectedCoverageAuditItem {
  id: string;
  status: "AUDITED_CORRECT" | "AUDITED_INCORRECT";
  change?: {
    originalExcerpt: string;
    revisedExcerpt: string;
    reason: string;
    evidenceUrl: string;
    evidenceTitle?: string | null;
    institution?: string | null;
  } | null;
  evidenceSourceIds?: string[];
}

export const DIRECTED_COVERAGE_BATCH_SIZE = 15;

function computeFingerprint(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  let h1 = 0xdeadbeef ^ normalized.length;
  let h2 = 0x41c64e6d ^ normalized.length;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return (part1 + part2).slice(0, 16);
}

/**
 * Extrai deterministicamente todas as unidades jurídicas verificáveis do Markdown.
 */
export function extractPropositionUnits(markdown: string): PropositionUnit[] {
  if (!markdown || typeof markdown !== "string" || markdown.trim().length === 0) {
    return [];
  }

  const units: PropositionUnit[] = [];
  const lines = markdown.split("\n");

  let currentArticleCitation = "";
  let currentArticleId = "";
  let currentContext = "";
  let unitSeq = 1;

  const nextId = () => `PROP-${String(unitSeq++).padStart(3, "0")}`;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    const locator = `line:${i + 1}`;

    // 1. Cabeçalho de Artigo (ex.: ### **1. Art. 1º do CPP...**, ## Art. 1º do Código de Processo Penal...)
    const artHeaderMatch = line.match(
      /^#{1,6}\s+\*?\*?(?:\d+\.?\s*)?(Art(?:s|\.|igo(?:s)?)?\s*([0-9ºoªa-zA-Z\s,–—e\.-]+?)[^\n*]*)\*?\*?$/i
    );
    if (artHeaderMatch) {
      const fullCitation = artHeaderMatch[1]
        .split("—")[0]
        .split("–")[0]
        .replace(/\*\*+/g, "")
        .trim();
      currentArticleCitation = fullCitation;
      currentContext = artHeaderMatch[1].replace(/\*\*+/g, "").trim();
      const id = nextId();
      currentArticleId = id;

      units.push({
        id,
        type: "ARTICLE_SECTION_HEADER",
        citation: fullCitation,
        locator,
        text: line,
        context: currentContext,
        fingerprint: computeFingerprint(line),
        riskLevel: "STANDARD",
        riskReasons: ["ARTICLE_HEADER"],
      });
      continue;
    }

    // 2. Artigo inline em bullet (ex.: * **Art. 3º-F:** O juiz das garantias deverá...)
    const artBulletMatch = line.match(
      /^[*•-]\s*\*\*?(Art(?:igo|\.)?\s*(\d+[ºo°]?[A-Za-z]?(?:-[A-Za-z0-9]+)?))(?::\*\*|\*\*:?)\s*(.+)$/i
    );
    if (artBulletMatch) {
      const artCitation = artBulletMatch[1].replace(/\*/g, "").trim();
      const content = artBulletMatch[3].trim();
      const id = nextId();

      const riskReasons = ["DEVICE_RULE"];
      let riskLevel: PropositionRisk = "MEDIUM";
      if (/\b(?:dever[aá]|poder[aá]|audi[eê]ncia|cust[oó]dia|preso|higidez|vedado|obrigatoriamente)\b/i.test(content)) {
        riskLevel = "HIGH";
        riskReasons.push("NORMATIVE_MODALITY_OR_PROCEDURAL_DUTY");
      }

      units.push({
        id,
        type: "INLINE_ARTICLE_RULE",
        citation: artCitation,
        locator,
        text: line,
        context: currentContext,
        parentId: currentArticleId || undefined,
        parentCitation: currentArticleCitation || undefined,
        fingerprint: computeFingerprint(line),
        riskLevel,
        riskReasons,
      });
      continue;
    }

    // 3. Parágrafo em bullet (ex.: * **§ 1º:**..., * **§ 2º:**..., * **Parágrafo único:**...)
    const paragMatch = line.match(
      /^[*•-]\s*\*\*?(§\s*\d+[ºo]?|Par[aá]grafo\s+[uú]nico)(?::\*\*|\*\*:?)\s*(.+)$/i
    );
    if (paragMatch) {
      const paragCitation = paragMatch[1].replace(/\*/g, "").trim();
      const content = paragMatch[2].trim();
      const id = nextId();
      const fullCitation = currentArticleCitation
        ? `${currentArticleCitation}, ${paragCitation}`
        : paragCitation;

      const riskReasons = ["PARAGRAPH_RULE"];
      let riskLevel: PropositionRisk = "MEDIUM";

      if (/\b(?:poder[aá]|dever[aá]|obrigat[oó]ri[ao]|prazo|\d+\s*dias|cautelares|vedado)\b/i.test(content)) {
        riskLevel = "HIGH";
        riskReasons.push("NORMATIVE_MODALITY_OR_TIMEFRAME");
      }

      units.push({
        id,
        type: "PARAGRAPH_RULE",
        citation: fullCitation,
        locator,
        text: line,
        context: currentContext,
        parentId: currentArticleId || undefined,
        parentCitation: currentArticleCitation || undefined,
        fingerprint: computeFingerprint(line),
        riskLevel,
        riskReasons,
      });
      continue;
    }

    // 4. Inciso em lista romana (ex.: * I –, * VII –, * XII –)
    const incisoMatch = line.match(/^[*•-]\s*([IVXLCDM]+)\s*[-–—]\s*(.+)$/i);
    if (incisoMatch) {
      const roman = incisoMatch[1].toUpperCase();
      const content = incisoMatch[2].trim();
      const id = nextId();
      const fullCitation = currentArticleCitation
        ? `${currentArticleCitation}, Inciso ${roman}`
        : `Inciso ${roman}`;

      const riskReasons = ["DEVICE_MAPPING", "ENUMERATED_COMPETENCE"];
      let riskLevel: PropositionRisk = "HIGH";

      if (/\b\d+\s*(?:dias|horas|meses|anos)\b/i.test(content)) riskReasons.push("TIMEFRAME");
      if (/\b(?:trancar|homologar|audi[eê]ncia|receber|zelar|prorrogar|compet[eê]ncia)\b/i.test(content)) {
        riskReasons.push("KEY_COMPETENCE_VERB");
      }

      units.push({
        id,
        type: "INCISO_MAPPING",
        citation: fullCitation,
        locator,
        text: line,
        context: currentContext,
        parentId: currentArticleId || undefined,
        parentCitation: currentArticleCitation || undefined,
        fingerprint: computeFingerprint(line),
        riskLevel,
        riskReasons,
      });
      continue;
    }

    // 5. Alínea em bullet (ex.: * a) ..., * b) ...)
    const alineaMatch = line.match(/^[*•-]\s*([a-z])\)\s*(.+)$/i);
    if (alineaMatch) {
      const letter = alineaMatch[1].toLowerCase();
      const id = nextId();
      const fullCitation = currentArticleCitation
        ? `${currentArticleCitation}, Alínea ${letter}`
        : `Alínea ${letter}`;

      units.push({
        id,
        type: "ALINEA_ITEM",
        citation: fullCitation,
        locator,
        text: line,
        context: currentContext,
        parentId: currentArticleId || undefined,
        parentCitation: currentArticleCitation || undefined,
        fingerprint: computeFingerprint(line),
        riskLevel: "MEDIUM",
        riskReasons: ["ALINEA_SUBITEM"],
      });
      continue;
    }

    // 6. Atribuição expressa a Precedente / Tribunal (STF, STJ, Súmula, ADI, Tema)
    const precedentMatch = line.match(
      /\b(ADI\s+[\d\.]+|ADPF\s+[\d\.]+|ADC\s+[\d\.]+|S[uú]mula(?:\s+Vinculante)?\s+\d+|Tema\s+\d+|STF|STJ)\b/i
    );
    if (
      precedentMatch &&
      /\b(?:declarou|decidiu|decidid[ao]|julgou|fixou|assentou|firmou|entendeu|inconstitucional|constitucional|interpreta[cç][aã]o\s+conforme|modulad[ao]|s[uú]mula|vinculante|repercuss[aã]o)\b/i.test(
        line
      )
    ) {
      const id = nextId();
      const tag = precedentMatch[0];
      const type: PropositionType = /s[uú]mula/i.test(tag)
        ? "SUMULA_MAPPING"
        : /tema/i.test(tag)
          ? "THEME_MAPPING"
          : "PRECEDENT_MAPPING";

      units.push({
        id,
        type,
        citation: tag,
        locator,
        text: line,
        context: currentContext,
        parentId: currentArticleId || undefined,
        parentCitation: currentArticleCitation || undefined,
        fingerprint: computeFingerprint(line),
        riskLevel: "HIGH",
        riskReasons: ["TRIBUNAL_RULING", "CONSTITUTIONALITY_OR_BINDING_CLAIM"],
      });
      continue;
    }

    // 7. Prazos e Quantidades Normativas Isoladas (se a linha contiver comando com prazo explícito)
    const timeframeMatch = line.match(/\b(\d+)\s*(dias|horas|meses|anos)\b/i);
    if (timeframeMatch && /\b(?:prazo|m[aá]ximo|m[ií]nimo|reexaminar|conclu[ií]d[ao]|audi[eê]ncia)\b/i.test(line)) {
      const id = nextId();
      units.push({
        id,
        type: "TIMEFRAME_QUANTITY",
        citation: `Prazo de ${timeframeMatch[1]} ${timeframeMatch[2]}`,
        locator,
        text: line,
        context: currentContext,
        parentId: currentArticleId || undefined,
        parentCitation: currentArticleCitation || undefined,
        fingerprint: computeFingerprint(line),
        riskLevel: "HIGH",
        riskReasons: ["EXPLICIT_STATUTORY_TIMEFRAME"],
      });
      continue;
    }
  }

  return units;
}

/**
 * Formata o inventário de proposições para ser incluído no prompt da Main Review.
 */
export function formatPropositionsForPrompt(units: PropositionUnit[]): string {
  if (!units || units.length === 0) {
    return "Nenhuma unidade jurídica objetiva identificada para auditoria prévia.";
  }

  const lines: string[] = [
    "INVENTÁRIO DETERMINÍSTICO DE UNIDADES JURÍDICAS PRESENTES NESTE BLOCO:",
    "Você deve auditar com rigor as proposições abaixo. No campo auditedUnits, informe o status de cada ID examinado.",
    "- Se a proposição contiver erro material: status = 'AUDITED_INCORRECT' e informe changeId apontando para o patch correspondente.",
    "- Se a proposição estiver correta: status = 'AUDITED_CORRECT'.",
    "- OBRIGATÓRIO PARA [ALTO RISCO] AUDITED_CORRECT: informe em evidenceSourceIds a(s) fonte(s) oficial(is) que você consultou e que comprovam que a proposição está correta (cite a URL oficial consultada ou seu sourceId). Se for AUDITED_INCORRECT, informe [].",
    "- NÃO associe fontes de outro diploma ou corte descorrelacionada: a fonte deve comprovar materialmente a proposição.",
    "- NÃO invente IDs que não constem desta lista.",
    "",
  ];

  for (const u of units) {
    const riskTag = u.riskLevel === "HIGH" ? "[ALTO RISCO]" : "";
    lines.push(`- [${u.id}] ${riskTag} ${u.citation} (${u.locator}): ${u.text.slice(0, 140)}`);
  }

  return lines.join("\n");
}

/**
 * Normaliza o texto de proposições e patches para comparação estrutural estrita.
 */
export function normalizePropositionText(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .toLowerCase()
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[*•-]\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/["'“”«»]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Valida deterministicamente se um patch (change) corresponde à PropositionUnit declarada incorreta.
 */
export function changeMatchesProposition(
  unit: PropositionUnit,
  change: { originalExcerpt?: string; reason?: string; id?: string } | undefined
): boolean {
  if (!unit || !change || typeof change.originalExcerpt !== "string") return false;

  const excerptNorm = normalizePropositionText(change.originalExcerpt);
  const unitNorm = normalizePropositionText(unit.text);

  if (!excerptNorm || !unitNorm) return false;

  // 1. Coincidência exata normalizada
  if (excerptNorm === unitNorm) return true;

  // 2. originalExcerpt contém integralmente o texto da unidade (bloco maior)
  if (excerptNorm.includes(unitNorm) && unitNorm.length >= 12) {
    return true;
  }

  // 3. unit.text contém integralmente originalExcerpt (recorte substantivo da unidade)
  if (unitNorm.includes(excerptNorm)) {
    if (excerptNorm.length >= 20 || (excerptNorm.length >= 15 && excerptNorm.length >= unitNorm.length * 0.25)) {
      return true;
    }
  }

  // 4. Verificação no corpo do inciso/parágrafo (sem prefixo de marcador)
  const unitBodyMatch = unit.text.match(/^[*•-]\s*(?:[IVXLCDM]+|[a-z]\)|\d+[ºo]?)\s*[-–—:\.]\s*(.+)$/i);
  if (unitBodyMatch) {
    const bodyNorm = normalizePropositionText(unitBodyMatch[1]);
    if (bodyNorm && (bodyNorm === excerptNorm || (bodyNorm.includes(excerptNorm) && excerptNorm.length >= 15))) {
      return true;
    }
    if (bodyNorm && excerptNorm.includes(bodyNorm) && bodyNorm.length >= 12) {
      return true;
    }
  }

  // 5. Para cabeçalho de artigo (ARTICLE_SECTION_HEADER): aceita se o patch cita especificamente o artigo
  if (unit.type === "ARTICLE_SECTION_HEADER") {
    const artMatch = unit.citation.match(/\bArt(?:igo|\.)?\s*([0-9ºo°a-zA-Z-]+)/i);
    if (artMatch) {
      const artNum = artMatch[1].replace(/[ºo°]/g, "").toLowerCase();
      const changeText = `${change.originalExcerpt || ""} ${change.reason || ""}`.toLowerCase();
      const mentionsArt = new RegExp(`\\bart(?:igo|\\.)?\\s*${artNum}\\b`, "i").test(changeText);
      if (mentionsArt) {
        return true;
      }
    }
  }

  return false;
}

export interface CanonicalPrecedentIdentity {
  court: "STF" | "STJ" | "TST" | "TSE" | "CNJ";
  type: "ADI" | "ADPF" | "ADC" | "RE" | "RESP" | "HC" | "SUMULA" | "SUMULA_VINCULANTE" | "TEMA" | "ATO_NORMATIVO";
  number: string;
}

export const KNOWN_CANONICAL_PRECEDENTS: Record<string, CanonicalPrecedentIdentity> = {
  // STF Incidente 5840274: registro processual canônico da ADI 6298 no STF (Leading case do Juiz das Garantias)
  "5840274": { court: "STF", type: "ADI", number: "6298" },
};

export function canonicalPrecedentIdentity(source: ConsultedLegalSource): CanonicalPrecedentIdentity | null {
  if (!source || !source.official) return null;
  const url = (source.url || "").toLowerCase();
  const title = (source.title || "").toLowerCase();
  const snippet = (source.snippet || "").toLowerCase();
  const host = matchOfficialHost(source.url);
  const family = host?.family;

  // 1. Mapeamento de incidente canônico registrado do STF
  const incMatch = url.match(/[?&]incidente=(\d+)/i);
  if (incMatch && family === "STF") {
    const incId = incMatch[1];
    if (KNOWN_CANONICAL_PRECEDENTS[incId]) {
      return KNOWN_CANONICAL_PRECEDENTS[incId];
    }
  }

  // 2. Extração explícita de ADI a partir da URL ou metadados
  const combined = `${url} ${title} ${snippet}`.trim();
  const adiMatch = combined.match(/\badis?[-_ /]?([0-9\.]+)\b/i) || url.match(/[?&]numprocesso=([0-9\.]+)&base=adi/i);
  if (adiMatch && family === "STF") {
    return { court: "STF", type: "ADI", number: adiMatch[1].replace(/\./g, "") };
  }

  const adpfMatch = combined.match(/\badpfs?[-_ /]?([0-9\.]+)\b/i) || url.match(/[?&]numprocesso=([0-9\.]+)&base=adpf/i);
  if (adpfMatch && family === "STF") {
    return { court: "STF", type: "ADPF", number: adpfMatch[1].replace(/\./g, "") };
  }

  const adcMatch = combined.match(/\badcs?[-_ /]?([0-9\.]+)\b/i) || url.match(/[?&]numprocesso=([0-9\.]+)&base=adc/i);
  if (adcMatch && family === "STF") {
    return { court: "STF", type: "ADC", number: adcMatch[1].replace(/\./g, "") };
  }

  return null;
}

/**
 * Verifica deterministicamente se uma fonte oficial consultada possui vínculo
 * material e institucional direto com a PropositionUnit.
 */
export function evidenceSupportsProposition(
  unit: PropositionUnit,
  source: ConsultedLegalSource
): boolean {
  if (!unit || !source || typeof source !== "object") return false;

  if (!source.official) return false;

  const url = (source.url || "").toLowerCase();
  const title = (source.title || "").toLowerCase();
  const snippet = (source.snippet || "").toLowerCase();
  const host = matchOfficialHost(source.url);
  const family = host?.family;
  if (!family) return false;

  const combinedSearchable = `${url} ${title} ${snippet}`.trim();
  const unitFullText = `${unit.citation} ${unit.parentCitation || ""} ${unit.context || ""} ${unit.text}`.toLowerCase();

  const isPrecedentUnit =
    unit.type === "PRECEDENT_MAPPING" ||
    unit.type === "SUMULA_MAPPING" ||
    unit.type === "THEME_MAPPING";

  // 1. Jurisprudência com Identificador Específico / Identidade Canônica
  const precedentIdent = canonicalPrecedentIdentity(source);

  // 1.1 ADI
  const adiMatch = unitFullText.match(/\badis?\s*([\d\.]+)\b/i);
  if (adiMatch) {
    const num = adiMatch[1].replace(/\./g, "");
    const hasNum = new RegExp(`\\b${num}\\b|adi[-_/]?${num}|numero=${num}`).test(combinedSearchable);
    if (family === "STF" && hasNum) return true;
    if (precedentIdent?.court === "STF" && precedentIdent?.type === "ADI" && precedentIdent?.number === num) return true;
  }

  // 1.2 ADPF
  const adpfMatch = unitFullText.match(/\badpfs?\s*([\d\.]+)\b/i);
  if (adpfMatch) {
    const num = adpfMatch[1].replace(/\./g, "");
    const hasNum = new RegExp(`\\b${num}\\b|adpf[-_/]?${num}|numero=${num}`).test(combinedSearchable);
    if (family === "STF" && hasNum) return true;
    if (precedentIdent?.court === "STF" && precedentIdent?.type === "ADPF" && precedentIdent?.number === num) return true;
  }

  // 1.3 ADC
  const adcMatch = unitFullText.match(/\badcs?\s*([\d\.]+)\b/i);
  if (adcMatch) {
    const num = adcMatch[1].replace(/\./g, "");
    const hasNum = new RegExp(`\\b${num}\\b|adc[-_/]?${num}|numero=${num}`).test(combinedSearchable);
    if (family === "STF" && hasNum) return true;
    if (precedentIdent?.court === "STF" && precedentIdent?.type === "ADC" && precedentIdent?.number === num) return true;
  }

  // 1.4 Súmula Vinculante
  const sumulaVincMatch = unitFullText.match(/\bs[uú]mula\s+vinculante\s*([\d\.]+)\b/i);
  if (sumulaVincMatch) {
    const num = sumulaVincMatch[1].replace(/\./g, "");
    const hasNum = new RegExp(`\\b${num}\\b|sv[-_/]?${num}|sumula[-_]?vinculante[-_]?${num}`).test(combinedSearchable);
    if (family === "STF" && hasNum) return true;
  }

  // 1.5 Súmula
  const sumulaMatch = unitFullText.match(/\bs[uú]mula\s*([\d\.]+)\b/i);
  if (sumulaMatch) {
    const num = sumulaMatch[1].replace(/\./g, "");
    const hasNum = new RegExp(`\\b${num}\\b|sumula[-_/]?${num}`).test(combinedSearchable);
    if ((family === "STF" || family === "STJ") && hasNum) return true;
  }

  // 1.6 Tema
  const temaMatch = unitFullText.match(/\btema\s*([\d\.]+)\b/i);
  if (temaMatch) {
    const num = temaMatch[1].replace(/\./g, "");
    const hasNum = new RegExp(`\\b${num}\\b|tema[-_/]?${num}`).test(combinedSearchable);
    if ((family === "STF" || family === "STJ") && hasNum) return true;
  }

  // 1.7 RE / RESP / HC
  const reMatch = unitFullText.match(/\b(?:re|resp|hc)\s*([\d\.]+)\b/i);
  if (reMatch) {
    const num = reMatch[1].replace(/\./g, "");
    const hasNum = new RegExp(`\\b${num}\\b`).test(combinedSearchable);
    if ((family === "STF" || family === "STJ") && hasNum) return true;
  }

  // 1.8 Ato específico do CNJ
  if (/\bcnj\b/i.test(unitFullText)) {
    const cnjActMatch = unitFullText.match(/\b(?:resolu[cç][aã]o|ato(?:\s+normativo)?|portaria)\s*(?:do\s+cnj\s*)?(?:n[º°]?\s*)?([\d\.]+)\b/i);
    if (cnjActMatch) {
      const cnjNum = cnjActMatch[1].replace(/\./g, "");
      const hasCnjNum = new RegExp(`\\b${cnjNum}\\b|ato[-_/]?${cnjNum}|detalhar/${cnjNum}`).test(combinedSearchable);
      if (family === "CNJ" && hasCnjNum) return true;
    }
  }

  // Precedente puro não pode cair em legislação infraconstitucional
  if (isPrecedentUnit) {
    return false;
  }

  // 2. Menção a Tribunal sem número específico (APENAS para STANDARD/MEDIUM, NUNCA para HIGH)
  if (unit.riskLevel !== "HIGH") {
    if (/\b(?:stf|supremo\s+tribunal\s+federal)\b/i.test(unitFullText) && !/\b(?:cpp|cp|lei|decreto)\b/i.test(unitFullText)) {
      return family === "STF";
    }
    if (/\b(?:stj|superior\s+tribunal\s+de\s+justi[cç]a)\b/i.test(unitFullText) && !/\b(?:cpp|cp|lei|decreto)\b/i.test(unitFullText)) {
      return family === "STJ";
    }
    if (/\bcnj\b/i.test(unitFullText)) {
      return family === "CNJ" || family === "STF";
    }
  }

  // 3. Legislação Federal (Estatutos / Códigos / Leis)
  if (family === "LEGISLACAO_FEDERAL" || family === "STF") {
    // 3.1 Código de Processo Penal
    if (/\b(?:cpp|c[oó]digo\s+de\s+processo\s+penal|processo\s+penal)\b/i.test(unitFullText)) {
      const isCpp =
        /(?:del3689(?:compilado)?\.htm|\bdel3689\b|\b3689\b|\bcpp\b|processo[-_ ]penal)/i.test(combinedSearchable) ||
        title.includes("código de processo penal") ||
        title.includes("processo penal") ||
        /\b(?:l13964|13964|adi[-_/]?6298|6298)\b/i.test(combinedSearchable);
      if (isCpp) return true;
    }

    // 3.2 Código Penal
    if (/\b(?:c[oó]digo\s+penal|(?<!processo\s+)cp)\b/i.test(unitFullText) && !/\bcpp\b/i.test(unitFullText)) {
      const isCp = /\b(?:del2848|2848|codigo[-_ ]penal)\b/i.test(combinedSearchable) ||
        title.includes("código penal");
      if (isCp) return true;
    }

    // 3.3 Constituição Federal
    if (/\b(?:cf(?:\/88)?|crfb|constitui[cç][aã]o(?:\s+federal)?)\b/i.test(unitFullText)) {
      const isCf = /\b(?:constituicao|crfb|cf88)\b/i.test(combinedSearchable);
      if (isCf) return true;
    }

    // 3.4 Código de Processo Civil
    if (/\b(?:cpc|c[oó]digo\s+de\s+processo\s+civil)\b/i.test(unitFullText)) {
      const isCpc = /\b(?:lei13105|l13105|13105|cpc|processo[-_ ]civil)\b/i.test(combinedSearchable);
      if (isCpc) return true;
    }

    // 3.5 Código Civil
    if (/\b(?:c[oó]digo\s+civil|(?<!processo\s+)cc)\b/i.test(unitFullText) && !/\bcpc\b/i.test(unitFullText)) {
      const isCc = /\b(?:lei10406|l10406|10406|codigo[-_ ]civil)\b/i.test(combinedSearchable);
      if (isCc) return true;
    }

    // 3.6 Consolidação das Leis do Trabalho
    if (/\b(?:clt|consolida[cç][aã]o\s+das\s+leis\s+do\s+trabalho)\b/i.test(unitFullText)) {
      const isClt = /\b(?:del5452|5452|clt)\b/i.test(combinedSearchable);
      if (isClt) return true;
    }

    // 3.7 Lei Específica (ex: Lei 1.521, Lei 11.343, Lei 13.964)
    const leiMatch = unitFullText.match(/\blei\s+(\d[\d\.]*)\b/i);
    if (leiMatch) {
      const num = leiMatch[1].replace(/\./g, "");
      const isLei = new RegExp(`\\b${num}\\b|l${num}|lei[-_/]?${num}`).test(combinedSearchable);
      if (isLei) return true;
    }

    // 3.8 Decreto-Lei Específico
    const decLeiMatch = unitFullText.match(/\bdecreto-lei\s+(\d[\d\.]*)\b/i);
    if (decLeiMatch) {
      const num = decLeiMatch[1].replace(/\./g, "");
      const isDecLei = new RegExp(`\\b${num}\\b|del${num}|decreto[-_]?lei[-_/]?${num}`).test(combinedSearchable);
      if (isDecLei) return true;
    }

    // 3.9 Vínculo por Artigo Específico na URL
    const artNumMatch = unit.citation.match(/\bArt(?:igo|\.)?\s*([0-9ºo°a-zA-Z-]+)/i);
    if (artNumMatch) {
      const artClean = artNumMatch[1].replace(/[ºo°]/g, "").toLowerCase();
      if (artClean && new RegExp(`art[-_]?${artClean}\\b|#art${artClean}\\b`).test(combinedSearchable)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Verifica se para uma unidade HIGH_RISK há evidência oficial correspondente nas fontes consultadas.
 */
export function coverageEvidenceSatisfied(
  unit: PropositionUnit,
  consultedSources: ConsultedLegalSource[]
): boolean {
  if (unit.riskLevel !== "HIGH") return true;
  if (!consultedSources || consultedSources.length === 0) return false;
  return consultedSources.some((source) => evidenceSupportsProposition(unit, source));
}

/**
 * Mescla deterministicamente dois conjuntos de AuditedPropositionInput por propositionUnit.id.
 *
 * Regras:
 * 1. Preserva unidades existentes de `current` não mencionadas em `incoming`.
 * 2. Unidade reenviada em `incoming` substitui estritamente a unidade de MESMO propositionUnit.id.
 * 3. Não relaciona PROP-xxx e CHG-xxx por igualdade numérica.
 * 4. Não cria unidade inexistente no inventário canônico (quando `inventory` fornecido).
 * 5. Não infere status (preserva status e evidence declarados).
 * 6. Deduplica preservando a ordem determinística.
 */
export function mergeAuditedPropositionUnits(
  current?: AuditedPropositionInput[] | null,
  incoming?: AuditedPropositionInput[] | null,
  inventory?: PropositionUnit[]
): AuditedPropositionInput[] {
  const allowedIds = inventory ? new Set(inventory.map((u) => u.id)) : null;
  const mergedMap = new Map<string, AuditedPropositionInput>();

  for (const item of current || []) {
    if (!item || typeof item !== "object" || typeof item.id !== "string") continue;
    const id = item.id.trim();
    if (!id) continue;
    if (allowedIds && !allowedIds.has(id)) continue;
    mergedMap.set(id, { ...item, id });
  }

  for (const item of incoming || []) {
    if (!item || typeof item !== "object" || typeof item.id !== "string") continue;
    const id = item.id.trim();
    if (!id) continue;
    if (allowedIds && !allowedIds.has(id)) continue;
    mergedMap.set(id, { ...item, id });
  }

  return Array.from(mergedMap.values());
}

export interface AuditedUnitsValidationResult {
  unitStatuses: Map<string, PropositionAuditStatus>;
  validAuditedCount: number;
  invalidDeclarations: string[];
  pendingUnits: PropositionUnit[];
  attributedCorrectCount: number;
  missingAttributionCount: number;
  invalidAttributionCount: number;
}

/**
 * Valida o atestado de auditoria retornado pelo modelo contra o inventário.
 * V2.3.2-D: Exige Evidence Attribution explícita para unidades HIGH_RISK em AUDITED_CORRECT.
 */
export function validateAuditedUnits(
  inventory: PropositionUnit[],
  auditedInputs: AuditedPropositionInput[] | undefined,
  changes: Array<{ id: string; originalExcerpt?: string; reason?: string; confirmation?: string; verified?: boolean }>,
  consultedSources: ConsultedLegalSource[]
): AuditedUnitsValidationResult {
  const inventoryMap = new Map(inventory.map((u) => [u.id, u]));
  const unitStatuses = new Map<string, PropositionAuditStatus>();
  const invalidDeclarations: string[] = [];
  const seenIds = new Set<string>();

  let attributedCorrectCount = 0;
  let missingAttributionCount = 0;
  let invalidAttributionCount = 0;

  // Inicializa todos como NOT_AUDITED
  for (const u of inventory) {
    unitStatuses.set(u.id, "NOT_AUDITED");
  }

  // Mapeia fontes consultadas por sourceId e por URL canônica
  const sourceById = new Map<string, ConsultedLegalSource>();
  const sourceByCanonical = new Map<string, ConsultedLegalSource>();
  for (const s of consultedSources) {
    if (!s || !s.url) continue;
    const sId = s.sourceId || computeSourceId(s.url);
    const enriched: ConsultedLegalSource = { ...s, sourceId: sId };
    sourceById.set(sId, enriched);
    const canon = canonicalSourceUrl(s.url);
    if (canon) {
      sourceByCanonical.set(canon, enriched);
    }
  }

  const changeMap = new Map(changes.map((c) => [c.id, c]));
  const inputs = Array.isArray(auditedInputs) ? auditedInputs : [];

  for (const item of inputs) {
    if (!item || typeof item !== "object" || typeof item.id !== "string") continue;
    const id = item.id.trim();

    // 1. ID precisa existir no inventário
    const unit = inventoryMap.get(id);
    if (!unit) {
      invalidDeclarations.push(`ID inexistente no inventário: ${id}`);
      continue;
    }

    // 2. Não duplicar IDs
    if (seenIds.has(id)) {
      invalidDeclarations.push(`ID duplicado na resposta: ${id}`);
      continue;
    }
    seenIds.add(id);

    // 3. Status INCORRECT precisa de changeId válido E correspondência com o texto da proposição
    if (item.status === "AUDITED_INCORRECT") {
      const changeId = typeof item.changeId === "string" ? item.changeId.trim() : "";
      const matchedChange = changeMap.get(changeId);
      if (!changeId || !matchedChange) {
        invalidDeclarations.push(`PROPOSITION_CHANGE_NOT_FOUND: AUDITED_INCORRECT para ${id} sem changeId válido correspondente.`);
        unitStatuses.set(id, "NOT_AUDITED");
        continue;
      }
      if (!changeMatchesProposition(unit, matchedChange)) {
        invalidDeclarations.push(`PROPOSITION_PATCH_MISMATCH: patch ${changeId} não corresponde ao texto da proposição ${id}. (PROPOSITION_CHANGE_MISMATCH)`);
        unitStatuses.set(id, "INDETERMINATE");
        continue;
      }
      if (matchedChange.confirmation === "NAO_CONFIRMADO" || matchedChange.verified === false) {
        invalidDeclarations.push(`PROPOSITION_CHANGE_UNCONFIRMED: patch ${changeId} associado à proposição ${id} não foi confirmado (NAO_CONFIRMADO).`);
        unitStatuses.set(id, "INDETERMINATE");
        continue;
      }
      unitStatuses.set(id, "AUDITED_INCORRECT");
      continue;
    }

    // 4. Status CORRECT
    if (item.status === "AUDITED_CORRECT") {
      if (unit.riskLevel === "HIGH") {
        const rawEvidenceIds = Array.isArray(item.evidenceSourceIds)
          ? item.evidenceSourceIds.filter((id) => typeof id === "string" && Boolean(id.trim()))
          : [];

        // 4.1 FASE 6 / FASE 14 E1: Ausência de evidenceSourceIds para HIGH_RISK
        if (rawEvidenceIds.length === 0) {
          missingAttributionCount++;
          invalidDeclarations.push(
            `PROPOSITION_EVIDENCE_MISSING: PropositionUnit [${id}] classificada como HIGH_RISK declarada AUDITED_CORRECT sem evidenceSourceIds.`
          );
          unitStatuses.set(id, "INDETERMINATE");
          continue;
        }

        // 4.2 FASE 7 / FASE 14 E2: Resolver fontes atribuídas e validar existência em consultedSources
        const resolvedSources: ConsultedLegalSource[] = [];
        let sourceNotFound = false;

        for (const rawRef of rawEvidenceIds) {
          const ref = String(rawRef || "").trim();
          if (!ref) continue;
          let foundSource = sourceById.get(ref);
          if (!foundSource) {
            const canonRef = canonicalSourceUrl(ref);
            if (canonRef) foundSource = sourceByCanonical.get(canonRef);
          }
          if (!foundSource) {
            invalidAttributionCount++;
            invalidDeclarations.push(
              `PROPOSITION_EVIDENCE_SOURCE_NOT_FOUND: Fonte [${ref}] atribuída a ${id} não existe em consultedSources.`
            );
            sourceNotFound = true;
            break;
          }
          resolvedSources.push(foundSource);
        }

        if (sourceNotFound || resolvedSources.length === 0) {
          unitStatuses.set(id, "INDETERMINATE");
          continue;
        }

        // 4.3 FASE 8 / FASE 9 / FASE 14 E3 / FASE 15: Validar se as fontes atribuídas comprovam a proposição
        // ATENÇÃO: NÃO faz fallback para fontes não atribuídas de consultedSources!
        const hasSupportingSource = resolvedSources.some((src) =>
          evidenceSupportsProposition(unit, src)
        );

        if (!hasSupportingSource) {
          invalidAttributionCount++;
          const isPrecedent = unit.type === "PRECEDENT_MAPPING" || unit.type === "SUMULA_MAPPING" || unit.type === "THEME_MAPPING";
          const unresolvedDiagnostic = isPrecedent ? " (PRECEDENT_IDENTITY_UNRESOLVED)" : "";
          invalidDeclarations.push(
            `PROPOSITION_EVIDENCE_MISMATCH: Nenhuma das fontes atribuídas (${rawEvidenceIds.join(", ")}) comprova materialmente a proposição ${id}.${unresolvedDiagnostic}`
          );
          unitStatuses.set(id, "INDETERMINATE");
          continue;
        }

        attributedCorrectCount++;
      }
      unitStatuses.set(id, "AUDITED_CORRECT");
      continue;
    }

    // Status desconhecido
    unitStatuses.set(id, "NOT_AUDITED");
  }

  // Identifica pendências
  const pendingUnits = inventory.filter((u) => {
    const st = unitStatuses.get(u.id);
    return st === "NOT_AUDITED" || st === "INDETERMINATE";
  });

  const validAuditedCount = inventory.length - pendingUnits.length;

  return {
    unitStatuses,
    validAuditedCount,
    invalidDeclarations,
    pendingUnits,
    attributedCorrectCount,
    missingAttributionCount,
    invalidAttributionCount,
  };
}

/**
 * Calcula o resumo de cobertura e avalia o Completeness Gate.
 */
export function evaluateCoverageCompleteness(
  inventory: PropositionUnit[],
  unitStatuses: Map<string, PropositionAuditStatus>,
  options?: {
    attributedCorrectCount?: number;
    missingAttributionCount?: number;
    invalidAttributionCount?: number;
  }
): CoverageSummary {
  const total = inventory.length;
  let auditedCorrect = 0;
  let auditedIncorrect = 0;
  let notAudited = 0;
  let indeterminate = 0;

  let highRiskTotal = 0;
  let highRiskResolved = 0;

  const pendingByType: Record<string, number> = {};
  const pendingByRisk: Record<string, number> = {};

  for (const u of inventory) {
    const st = unitStatuses.get(u.id) || "NOT_AUDITED";
    const isHigh = u.riskLevel === "HIGH";
    if (isHigh) highRiskTotal++;

    if (st === "AUDITED_CORRECT") {
      auditedCorrect++;
      if (isHigh) highRiskResolved++;
    } else if (st === "AUDITED_INCORRECT") {
      auditedIncorrect++;
      if (isHigh) highRiskResolved++;
    } else if (st === "INDETERMINATE") {
      indeterminate++;
      pendingByType[u.type] = (pendingByType[u.type] || 0) + 1;
      pendingByRisk[u.riskLevel] = (pendingByRisk[u.riskLevel] || 0) + 1;
    } else {
      notAudited++;
      pendingByType[u.type] = (pendingByType[u.type] || 0) + 1;
      pendingByRisk[u.riskLevel] = (pendingByRisk[u.riskLevel] || 0) + 1;
    }
  }

  const coverageRate = total > 0 ? (auditedCorrect + auditedIncorrect) / total : 1;
  const highRiskCoverageRate = highRiskTotal > 0 ? highRiskResolved / highRiskTotal : 1;

  // Gate de Completude:
  // Completo SE E SOMENTE SE:
  // 1. 100% das unidades HIGH_RISK foram resolvidas (zero notAudited ou indeterminate em HIGH_RISK)
  // 2. Nenhuma unidade de qualquer risco permaneceu NOT_AUDITED ou INDETERMINATE
  const complete = total === 0 || (highRiskResolved === highRiskTotal && notAudited === 0 && indeterminate === 0);

  return {
    total,
    auditedCorrect,
    auditedIncorrect,
    notAudited,
    indeterminate,
    highRiskTotal,
    highRiskResolved,
    coverageRate,
    highRiskCoverageRate,
    complete,
    pendingByType,
    pendingByRisk,
    ...(options?.attributedCorrectCount !== undefined ? { attributedCorrectCount: options.attributedCorrectCount } : {}),
    ...(options?.missingAttributionCount !== undefined ? { missingAttributionCount: options.missingAttributionCount } : {}),
    ...(options?.invalidAttributionCount !== undefined ? { invalidAttributionCount: options.invalidAttributionCount } : {}),
  };
}

/**
 * Prepara lotes de unidades pendentes para a Coverage Dirigida.
 */
export function prepareDirectedCoverageBatches(
  pendingUnits: PropositionUnit[],
  batchSize = DIRECTED_COVERAGE_BATCH_SIZE
): DirectedCoverageBatch[] {
  if (!pendingUnits || pendingUnits.length === 0) return [];

  // Ordena por prioridade de risco (HIGH primeiro), depois por parentId
  const sorted = [...pendingUnits].sort((a, b) => {
    if (a.riskLevel === "HIGH" && b.riskLevel !== "HIGH") return -1;
    if (a.riskLevel !== "HIGH" && b.riskLevel === "HIGH") return 1;
    return (a.parentId || "").localeCompare(b.parentId || "");
  });

  const batches: DirectedCoverageBatch[] = [];
  const totalBatches = Math.ceil(sorted.length / batchSize);

  for (let i = 0; i < sorted.length; i += batchSize) {
    const chunk = sorted.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize) + 1;

    const lines: string[] = [
      `PASSAGEM DE COBERTURA DIRIGIDA — LOTE ${batchIndex}/${totalBatches} (${chunk.length} proposições):`,
      "As proposições abaixo ainda NÃO possuem prova de auditoria válida da Main Review.",
      "Sua missão é verificar estritamente estas proposições em fontes oficiais primárias.",
      "Para cada proposição, informe no array coverageAudits:",
      "- id: o ID exato;",
      "- status: 'AUDITED_CORRECT' (se o texto do material for juridicamente correto) ou 'AUDITED_INCORRECT' (se contiver erro material);",
      "- se AUDITED_CORRECT para [ALTO RISCO]: informe obrigatoriamente evidenceSourceIds com a(s) fonte(s) oficial(is) consultada(s) que comprovam a proposição;",
      "- se AUDITED_INCORRECT: inclua o objeto change com originalExcerpt literal, revisedExcerpt, reason e fonte oficial (e evidenceSourceIds: []).",
      "",
    ];

    for (const u of chunk) {
      const risk = u.riskLevel === "HIGH" ? "[ALTO RISCO]" : "";
      lines.push(`ID: ${u.id} ${risk}`);
      lines.push(`Dispositivo: ${u.citation}`);
      if (u.parentCitation) lines.push(`Contexto Pai: ${u.parentCitation}`);
      lines.push(`Texto no Material: ${JSON.stringify(u.text)}`);
      lines.push("");
    }

    batches.push({
      batchIndex,
      totalBatches,
      units: chunk,
      formattedPayload: lines.join("\n"),
    });
  }

  return batches;
}

/**
 * Schema JSON estrito para a chamada de Coverage Dirigida compacta.
 */
export const DIRECTED_COVERAGE_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["coverageAudits", "reviewNotes"],
  properties: {
    coverageAudits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "status", "change", "evidenceSourceIds"],
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["AUDITED_CORRECT", "AUDITED_INCORRECT"] },
          change: {
            type: ["object", "null"],
            additionalProperties: false,
            required: ["originalExcerpt", "revisedExcerpt", "reason", "evidenceUrl", "evidenceTitle", "institution"],
            properties: {
              originalExcerpt: { type: "string" },
              revisedExcerpt: { type: "string" },
              reason: { type: "string" },
              evidenceUrl: { type: "string" },
              evidenceTitle: { type: ["string", "null"] },
              institution: { type: ["string", "null"] },
            },
          },
          evidenceSourceIds: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    reviewNotes: { type: "string" },
  },
};
