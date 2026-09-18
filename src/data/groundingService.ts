/**
 * @license
 * ATHENA Mentoria Jurídica - Grounding Soberano
 * Integração das fontes mineradas (Legislação Literal + Doutrina Verticalizada)
 * ao gerador de lições da Trilha Jurídica dos 100 Dias.
 */

import { LITERAL_ARTICLES } from "./literalLegislation";
import { DOCTRINAL_REPOSITORY, DoctrinalModule } from "./doctrinalRepository";
import { TRILHA_JURIDICA_DATA } from "./trilhaData";

export interface TrilhaGroundingResult {
  hasGrounding: boolean;
  statuteText: string;
  doctrinalCore: string;
  divergentCurrents?: string;
  examPitfalls?: string[];
  formattedGroundingPrompt: string;
}

function normalizeStr(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

/**
 * Tenta extrair da fonteCompleta do dia (quando disponível, ex: Dia 1) a seção
 * exata da matéria estudada.
 */
function extractFromDayFullSource(dayNum: number, subject: string): string | null {
  const dayItem = TRILHA_JURIDICA_DATA.find(d => d.dia === dayNum);
  if (!dayItem || !dayItem.fonteCompleta) return null;

  const full = dayItem.fonteCompleta;
  const normSubj = normalizeStr(subject);

  // Mapeamento de títulos nas fontes completas
  const markers = [
    { key: "constituicao", marker: "### **CONSTITUIÇÃO FEDERAL" },
    { key: "penal", marker: "### **CÓDIGO PENAL" },
    { key: "processo civil", marker: "### **CÓDIGO DE PROCESSO CIVIL" },
    { key: "processo penal", marker: "### **CÓDIGO DE PROCESSO PENAL" },
    { key: "lindb", marker: "### **LINDB" },
    { key: "civil", marker: "### **CÓDIGO CIVIL" }
  ];

  let targetMarker: string | null = null;
  for (const m of markers) {
    if (normSubj.includes(m.key)) {
      targetMarker = m.marker;
      break;
    }
  }

  if (!targetMarker) return null;

  const startIdx = full.indexOf(targetMarker);
  if (startIdx === -1) return null;

  // Encontrar o próximo marcador de seção principal
  let nextSectionIdx = -1;
  for (const m of markers) {
    if (m.marker === targetMarker) continue;
    const idx = full.indexOf(m.marker, startIdx + 10);
    if (idx !== -1 && (nextSectionIdx === -1 || idx < nextSectionIdx)) {
      nextSectionIdx = idx;
    }
  }

  const rawSection = nextSectionIdx !== -1 
    ? full.substring(startIdx, nextSectionIdx) 
    : full.substring(startIdx);

  return rawSection.trim();
}

/**
 * Busca os artigos literais de regência no repositório minerado
 */
function findLiteralArticles(subject: string, content: string): string {
  const normSubj = normalizeStr(subject);

  // Extrai números de artigos para correspondência exata
  const articleNumbers = content.match(/\d+/g) || [];

  const matched = LITERAL_ARTICLES.filter(item => {
    const itemStatute = normalizeStr(item.statute);
    const itemArticle = normalizeStr(item.article);

    // 1. Compatibilidade de disciplina/código
    let isDisciplineMatch = false;
    if (normSubj.includes("constituicao") && itemStatute.includes("constitui")) isDisciplineMatch = true;
    else if (normSubj.includes("processo civil") && (itemStatute.includes("processo civil") || itemStatute.includes("cpc"))) isDisciplineMatch = true;
    else if (normSubj.includes("processo penal") && (itemStatute.includes("processo penal") || itemStatute.includes("cpp"))) isDisciplineMatch = true;
    else if (normSubj.includes("penal") && !normSubj.includes("process") && (itemStatute.includes("codigo penal") || itemStatute.includes("penal"))) isDisciplineMatch = true;
    else if (normSubj.includes("civil") && !normSubj.includes("process") && (itemStatute.includes("codigo civil") || itemStatute.includes("civil"))) isDisciplineMatch = true;
    else if (normSubj.includes("lindb") && itemStatute.includes("lindb")) isDisciplineMatch = true;
    else if (itemStatute.includes(normSubj) || normSubj.includes(itemStatute)) isDisciplineMatch = true;

    if (!isDisciplineMatch) return false;

    // 2. Se houver número de artigo especificado, checa correspondência
    if (articleNumbers.length > 0) {
      return articleNumbers.some(num => itemArticle.includes(num));
    }

    return true;
  });

  if (matched.length > 0) {
    return matched.slice(0, 3).map(m => `### 📜 ${m.statute} — ${m.article}\n${m.literalText}`).join("\n\n---\n\n");
  }

  return "";
}

/**
 * Busca o melhor módulo doutrinário para o tema delimitado
 */
function findDoctrinalContext(subject: string, content: string): DoctrinalModule | null {
  const query = `${subject} ${content}`;
  const normQuery = normalizeStr(query);
  const words = normQuery.split(/\s+/).filter(w => w.length > 3);

  let bestModule: DoctrinalModule | null = null;
  let maxScore = 0;

  for (const mod of DOCTRINAL_REPOSITORY) {
    let score = 0;
    const modTitle = normalizeStr(mod.title);
    const modDisc = normalizeStr(mod.discipline);
    const keywords = (mod.themeKeywords || []).map(normalizeStr);

    for (const word of words) {
      if (modTitle.includes(word)) score += 5;
      if (keywords.some(k => k.includes(word))) score += 4;
      if (modDisc.includes(word)) score += 1;
    }

    if (score > maxScore) {
      maxScore = score;
      bestModule = mod;
    }
  }

  return maxScore >= 8 ? bestModule : null;
}

/**
 * Retorna o bloco de Grounding Soberano completo para uma parte da Trilha
 */
export function getGroundingForTrilhaPart(
  dayNum: number,
  subject: string,
  content: string
): TrilhaGroundingResult {
  // 1. Tentar fonte direta do dia se existir
  const directSource = extractFromDayFullSource(dayNum, subject);
  if (directSource && directSource.length > 100) {
    const prompt = `\n[FONTES MINERADAS DE REFERÊNCIA OFICIAL - GROUNDING SOBERANO]:\n${directSource}\n\nDIRETRIZES DE USO DO GROUNDING:\n- Utilize a base de referência acima como guia doutrinário, legal e jurisprudencial soberano.\n- Decodifique e sintetize os artigos com suas próprias palavras analíticas para evitar recitação literal de manuais comerciais.\n- Toda a lição, questões e julgados devem estar estritamente vinculados aos artigos e temas desta base.`;

    return {
      hasGrounding: true,
      statuteText: directSource,
      doctrinalCore: directSource,
      formattedGroundingPrompt: prompt
    };
  }

  // 2. Tentar buscar nos acervos de legislação e doutrina minerada
  const literal = findLiteralArticles(subject, content);
  const doctrine = findDoctrinalContext(subject, content);

  if (!literal && !doctrine) {
    return {
      hasGrounding: false,
      statuteText: "",
      doctrinalCore: "",
      formattedGroundingPrompt: ""
    };
  }

  let sections: string[] = [];

  if (literal) {
    sections.push(`### ⚖️ LEGISLAÇÃO DE REGÊNCIA (TEXTO DA LEI MINERADO):\n${literal}`);
  }

  if (doctrine) {
    sections.push(`### 📚 DOUTRINA DE REFERÊNCIA (${doctrine.title}):\n${doctrine.coreDoctrine}`);

    if (doctrine.divergentCurrents) {
      sections.push(`### ⚡ CORRENTES DOUTRINÁRIAS DIVERGENTES:\n* **1ª Corrente (${doctrine.divergentCurrents.firstCurrent.name})**: ${doctrine.divergentCurrents.firstCurrent.thesis} (Defendida por ${doctrine.divergentCurrents.firstCurrent.author})\n* **2ª Corrente (${doctrine.divergentCurrents.secondCurrent.name})**: ${doctrine.divergentCurrents.secondCurrent.thesis} (Defendida por ${doctrine.divergentCurrents.secondCurrent.author})`);
    }

    if (doctrine.examPitfalls && doctrine.examPitfalls.length > 0) {
      sections.push(`### ⚠️ PEGADINHAS CLÁSSICAS DE BANCA EXAMINADORA:\n${doctrine.examPitfalls.map(p => `- ${p}`).join("\n")}`);
    }
  }

  const fullText = sections.join("\n\n---\n\n");
  const prompt = `\n[FONTES MINERADAS DE REFERÊNCIA OFICIAL - GROUNDING SOBERANO]:\n${fullText}\n\nDIRETRIZES DE USO DO GROUNDING:\n- Utilize os artigos de regência e a dogmática acima como fundamento soberano para os 6 blocos pedagógicos.\n- Decodifique e esquematize com suas próprias palavras analíticas para evitar qualquer filtro de recitação literal de apostilas comerciais.\n- As questões do [BLOCK_5] e os precedentes do [BLOCK_3] devem ser 100% ancorados neste recorte delimitado.`;

  return {
    hasGrounding: true,
    statuteText: literal,
    doctrinalCore: doctrine?.coreDoctrine || "",
    divergentCurrents: doctrine?.divergentCurrents ? JSON.stringify(doctrine.divergentCurrents) : undefined,
    examPitfalls: doctrine?.examPitfalls,
    formattedGroundingPrompt: prompt
  };
}
