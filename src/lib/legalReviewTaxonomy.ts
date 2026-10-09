/**
 * ATHENA — ETAPA 5B: ARQUITETURA DE TAXONOMIA JURÍDICA E VERIFICAÇÃO INDEPENDENTE
 *
 * Responsabilidade:
 * 1. Desacoplar a NATUREZA da afirmação (dogmática/teórica) do RESULTADO de sua verificação (status probatório).
 * 2. Manter 100% de compatibilidade retroativa com registros legados (LegalConfirmation, LegalSourceType).
 * 3. Projetar metadados de evidência especializados para cada categoria jurídica (Normativa, Jurisprudencial, Doutrinária, Empírica, Pedagógica).
 * 4. Impor blindagem determinística: classificar como DOUTRINA ou RECURSO_PEDAGOGICO NUNCA produz CONFIRMADA automaticamente.
 * 5. Preservar a exigência de fontes oficiais primárias para afirmações normativas e jurisprudenciais.
 */

import type {
  LegalChangeCategory,
  LegalConfirmation,
  LegalReviewEvidence,
  LegalReviewSource,
} from "./legalReviewTypes";

// =============================================================================
// 1. CAMPOS CONCEITUALMENTE INDEPENDENTES
// =============================================================================

export const VALID_CLAIM_NATURES = [
  "NORMA_JURIDICA",
  "PRECEDENTE_VINCULANTE",
  "JURISPRUDENCIA_NAO_VINCULANTE",
  "DOUTRINA",
  "DIVERGENCIA_DOUTRINARIA",
  "AFIRMACAO_EMPIRICA",
  "RECURSO_PEDAGOGICO",
] as const;

export type LegalClaimNature = (typeof VALID_CLAIM_NATURES)[number];

export const VALID_VERIFICATION_OUTCOMES = [
  "CONFIRMADA",
  "PARCIALMENTE_CONFIRMADA",
  "CONTROVERSA",
  "NAO_VERIFICADA",
  "INCORRETA",
  "NAO_APLICAVEL",
] as const;

export type LegalVerificationOutcome = (typeof VALID_VERIFICATION_OUTCOMES)[number];

// =============================================================================
// 2. METADADOS DE EVIDÊNCIA ESPECIALIZADOS POR NATUREZA
// =============================================================================

/**
 * Metadados para afirmações de natureza NORMA_JURIDICA.
 * Exige identificação de diploma, dispositivo, vigência e fonte oficial.
 */
export interface NormativeEvidenceMetadata {
  diploma: string;
  dispositivo: string;
  vigencia?: string;
  fonteOficial: string;
}

/**
 * Metadados para afirmações de natureza PRECEDENTE_VINCULANTE ou JURISPRUDENCIA_NAO_VINCULANTE.
 * Exige tribunal, identificação do processo, tese e fonte oficial.
 */
export interface JurisprudentialEvidenceMetadata {
  tribunal: string;
  orgaoJulgador?: string;
  processo: string;
  tese?: string;
  fonteOficial: string;
  vinculante?: boolean;
}

/**
 * Metadados para afirmações de natureza DOUTRINA ou DIVERGENCIA_DOUTRINARIA.
 * Exige autor, obra de referência e grau de consolidação na literatura para concursos.
 */
export interface DoctrinalEvidenceMetadata {
  autor: string;
  obra: string;
  edicao?: string;
  referenciaBibliografica?: string;
  grauConfirmacao?: "DOMINANTE" | "DIVIDIDA" | "ISOLADA";
}

/**
 * Metadados para afirmações de natureza AFIRMACAO_EMPIRICA.
 * Exige origem dos dados estatísticos, metodologia e amostragem.
 */
export interface EmpiricalEvidenceMetadata {
  origem: string;
  metodologia?: string;
  periodo?: string;
  amostra?: string;
}

/**
 * Metadados para afirmações de natureza RECURSO_PEDAGOGICO.
 * Exige justificativa da finalidade didática e demonstração de compatibilidade com o direito positivo.
 */
export interface PedagogicalEvidenceMetadata {
  justificativa: string;
  compatibilidadeJuridica: string;
}

/**
 * Container em união discriminada para metadados de evidência tipados por natureza.
 */
export type ClaimEvidenceMetadata =
  | ({ nature: "NORMA_JURIDICA" } & NormativeEvidenceMetadata)
  | ({ nature: "PRECEDENTE_VINCULANTE" } & JurisprudentialEvidenceMetadata)
  | ({ nature: "JURISPRUDENCIA_NAO_VINCULANTE" } & JurisprudentialEvidenceMetadata)
  | ({ nature: "DOUTRINA" } & DoctrinalEvidenceMetadata)
  | ({ nature: "DIVERGENCIA_DOUTRINARIA" } & DoctrinalEvidenceMetadata)
  | ({ nature: "AFIRMACAO_EMPIRICA" } & EmpiricalEvidenceMetadata)
  | ({ nature: "RECURSO_PEDAGOGICO" } & PedagogicalEvidenceMetadata);

/**
 * Dicionário estruturado opcional para armazenar metadados conforme o preenchimento.
 */
export interface EvidenceNatureMetadata {
  normative?: NormativeEvidenceMetadata;
  jurisprudential?: JurisprudentialEvidenceMetadata;
  doctrinal?: DoctrinalEvidenceMetadata;
  empirical?: EmpiricalEvidenceMetadata;
  pedagogical?: PedagogicalEvidenceMetadata;
}

// =============================================================================
// 3. REGRAS DE VALIDAÇÃO E BLINDAGEM DA TAXONOMIA
// =============================================================================

export interface TaxonomyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Avalia se uma natureza de afirmação pode ser confirmada sem URL de órgão oficial do Estado.
 * Afirmações normativas e jurisprudenciais NUNCA podem dispensar fonte oficial primária.
 */
export function canBeConfirmedWithoutOfficialSource(nature: LegalClaimNature): boolean {
  switch (nature) {
    case "NORMA_JURIDICA":
    case "PRECEDENTE_VINCULANTE":
    case "JURISPRUDENCIA_NAO_VINCULANTE":
      return false;
    case "DOUTRINA":
    case "DIVERGENCIA_DOUTRINARIA":
    case "AFIRMACAO_EMPIRICA":
    case "RECURSO_PEDAGOGICO":
      return true;
  }
}

/**
 * Extrai os metadados específicos para a natureza informada a partir de container flexível ou discriminado.
 */
/**
 * Extrai os metadados específicos para a natureza informada a partir de container flexível ou discriminado,
 * com fallback para metadados presentes nas evidências.
 */
export function extractMetadataForNature(
  nature: LegalClaimNature,
  metadata?: ClaimEvidenceMetadata | EvidenceNatureMetadata,
  evidenceList?: LegalReviewEvidence[]
): Record<string, unknown> | null {
  if (metadata) {
    if ("nature" in metadata && metadata.nature === nature) {
      return (metadata as unknown) as Record<string, unknown>;
    }
    const container = metadata as EvidenceNatureMetadata;
    let found: Record<string, unknown> | null = null;
    switch (nature) {
      case "NORMA_JURIDICA":
        found = ((container.normative as unknown) as Record<string, unknown>) || null;
        break;
      case "PRECEDENTE_VINCULANTE":
      case "JURISPRUDENCIA_NAO_VINCULANTE":
        found = ((container.jurisprudential as unknown) as Record<string, unknown>) || null;
        break;
      case "DOUTRINA":
      case "DIVERGENCIA_DOUTRINARIA":
        found = ((container.doctrinal as unknown) as Record<string, unknown>) || null;
        break;
      case "AFIRMACAO_EMPIRICA":
        found = ((container.empirical as unknown) as Record<string, unknown>) || null;
        break;
      case "RECURSO_PEDAGOGICO":
        found = ((container.pedagogical as unknown) as Record<string, unknown>) || null;
        break;
    }
    if (found) return found;
  }

  // Fallback: busca metadados especializados anexados a itens de evidence
  if (evidenceList && Array.isArray(evidenceList)) {
    for (const ev of evidenceList) {
      if (ev.evidenceMetadata) {
        const meta = extractMetadataForNature(nature, ev.evidenceMetadata);
        if (meta) return meta;
      }
    }
  }

  return null;
}

const GENERIC_DOCTRINAL_TERMS = new Set([
  "doutrina",
  "doutrina majoritaria",
  "doutrina dominante",
  "doutrina minoritaria",
  "maioria da doutrina",
  "autores",
  "autor",
  "manual",
  "livro",
  "curso",
  "professores",
  "jurisconsultos",
  "academicos",
  "doutrinadores",
]);

const GENERIC_DOCTRINAL_WORKS = new Set([
  "doutrina",
  "livro",
  "manual",
  "curso",
  "obra",
  "artigo",
  "referencia",
  "jurisprudencia",
  "concurso",
]);

function normalizeDoctrinalText(text: string): string {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isGenericDoctrinalAuthor(author: string): boolean {
  if (!author || author.trim().length < 3) return true;
  const clean = normalizeDoctrinalText(author);
  return GENERIC_DOCTRINAL_TERMS.has(clean);
}

export function isGenericDoctrinalWork(work: string): boolean {
  if (!work || work.trim().length < 3) return true;
  const clean = normalizeDoctrinalText(work);
  return GENERIC_DOCTRINAL_WORKS.has(clean);
}

export function isIsolatedOrNonBindingPrecedent(
  text: string,
  meta?: JurisprudentialEvidenceMetadata
): boolean {
  if (meta && meta.vinculante === false) return true;
  const normalized = String(text || "").toLowerCase();

  // Decisão monocrática expressa
  if (/\bdecis[aã]o\s+monocr[aá]tica\b/i.test(normalized)) return true;

  // Acórdão isolado ou menção explícita de ausência de repercussão geral/repetitivo
  if (/\bac[oó]rd[aã]o\s+isolado\b/i.test(normalized)) return true;
  if (/\bjulgamento\s+isolado\b/i.test(normalized)) return true;

  // Órgão fracionário (Turma/Câmara) desprovido de eficácia vinculante expressa
  const mentionsPanel = /\b(?:\d+[ªa]?\s+turma|\d+[ªa]?\s+c[aâ]mara|turma\s+recursal)\b/i.test(normalized);
  const mentionsBindingInstrument = /\b(?:repercuss[aã]o\s+geral|recurso\s+repetitivo|repetitivo|s[uú]mula\s+vinculante|controle\s+concentrado|adi|adc|adpf|ado|iac|irdr|tema\s+\d+)\b/i.test(normalized);

  if (mentionsPanel && !mentionsBindingInstrument) {
    return true;
  }

  return false;
}

export function hasEmpiricalPercentagesWithoutMethodology(
  text: string,
  meta?: EmpiricalEvidenceMetadata
): boolean {
  const hasPercentage = /\b\d+(?:,\d+)?\s*%|\bpor\s+cento\b/i.test(text);
  if (!hasPercentage) return false;
  const hasMethodology = Boolean(
    meta && (meta.metodologia?.trim() || meta.amostra?.trim())
  );
  return !hasMethodology;
}

export function isFraudulentPedagogicalReclassification(
  text: string,
  meta?: PedagogicalEvidenceMetadata
): boolean {
  // Se contiver percentuais ou estatísticas disfarçados de didática
  return /\b\d+(?:,\d+)?\s*%|\bpor\s+cento\b/i.test(text);
}

export interface ValidateClaimTaxonomyInput {
  nature?: LegalClaimNature;
  outcome?: LegalVerificationOutcome;
  rawNature?: unknown;
  rawOutcome?: unknown;
  metadata?: ClaimEvidenceMetadata | EvidenceNatureMetadata;
  sources?: LegalReviewSource[];
  evidence?: LegalReviewEvidence[];
  isOfficialSourceChecker?: (url: string) => boolean;
  category?: LegalChangeCategory;
  confirmation?: LegalConfirmation;
  verified?: boolean;
  originalExcerpt?: string;
  revisedExcerpt?: string;
  reason?: string;
}

/**
 * Validador determinístico das regras da taxonomia jurídica (Etapa 5D).
 *
 * GARANTIAS MANDATÓRIAS:
 * 1. Enum validation: rejeição estrita de strings fora de VALID_CLAIM_NATURES ou VALID_VERIFICATION_OUTCOMES.
 * 2. Backwards compatibility: se nenhum campo taxonômico for passado, retorna valid: true (legado).
 * 3. Coerência entre campos: fail-closed em caso de incompatibilidade entre outcome, confirmation, verified e category.
 * 4. Critérios específicos por natureza:
 *    - NORMA_JURIDICA: fonte oficial primária mandatória;
 *    - PRECEDENTE_VINCULANTE vs JURISPRUDENCIA_NAO_VINCULANTE: rejeita decisões monocráticas ou acórdãos isolados de turma como vinculantes;
 *    - DOUTRINA: rejeita menções genéricas ("doutrina majoritária") sem autor e obra rastreáveis;
 *    - AFIRMACAO_EMPIRICA: rejeita percentuais ou estatísticas sem metodologia ou amostragem;
 *    - RECURSO_PEDAGOGICO: rejeita fraudes que mascarem percentuais ou normas em categoria didática sem compatibilidade positiva.
 */
export function validateClaimTaxonomy(input: ValidateClaimTaxonomyInput): TaxonomyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const {
    nature,
    outcome,
    rawNature,
    rawOutcome,
    metadata,
    sources,
    evidence,
    isOfficialSourceChecker,
    category,
    confirmation,
    verified,
    originalExcerpt,
    revisedExcerpt,
    reason,
  } = input;

  // 1. Validação estrita de Enums
  if (rawNature !== undefined && rawNature !== null && typeof rawNature === "string" && rawNature.trim() !== "") {
    if (!(VALID_CLAIM_NATURES as readonly string[]).includes(rawNature.trim())) {
      errors.push(`Natureza da afirmação inválida: "${rawNature}". Deve ser uma das naturezas permitidas na taxonomia.`);
    }
  }

  if (rawOutcome !== undefined && rawOutcome !== null && typeof rawOutcome === "string" && rawOutcome.trim() !== "") {
    if (!(VALID_VERIFICATION_OUTCOMES as readonly string[]).includes(rawOutcome.trim())) {
      errors.push(`Resultado da verificação inválido: "${rawOutcome}". Deve ser um dos resultados permitidos na taxonomia.`);
    }
  }

  // Se nenhum campo novo estiver preenchido, é um registro legado válido
  if (!nature && !outcome && !rawNature && !rawOutcome) {
    return { valid: true, errors: [], warnings: [] };
  }

  // Se apenas um dos campos foi informado:
  if (!nature && outcome) {
    warnings.push("Resultado informado sem especificação da natureza da afirmação.");
  }
  if (nature && !outcome) {
    warnings.push("Natureza informada sem especificação do resultado da verificação.");
  }

  // 2. Coerência entre campos legados e novos (Scope 4)
  if (outcome === "CONFIRMADA" && confirmation === "NAO_CONFIRMADO") {
    errors.push("Incoerência grave: outcome CONFIRMADA não pode coexistir com confirmação legal NAO_CONFIRMADO.");
  }

  if (
    (outcome === "NAO_VERIFICADA" || outcome === "INCORRETA" || outcome === "CONTROVERSA") &&
    (verified === true || confirmation === "CONFIRMADO")
  ) {
    errors.push(
      `Incoerência grave: outcome ${outcome} não pode ter status verified=true ou confirmação CONFIRMADO.`
    );
  }

  if (nature === "NORMA_JURIDICA" && category === "DIDATICA") {
    const metaPedagogica = extractMetadataForNature("RECURSO_PEDAGOGICO", metadata, evidence);
    const hasPedagogicalTransposition = Boolean(
      metaPedagogica && (metaPedagogica.justificativa || metaPedagogica.compatibilidadeJuridica)
    ) || /\b(?:transposi[cç][aã]o\s+pedag[oó]gica|fins\s+did[aá]ticos|recurso\s+did[aá]tico)\b/i.test(reason || "");

    if (!hasPedagogicalTransposition) {
      errors.push(
        "Incoerência de classificação: afirmação de natureza NORMA_JURIDICA não pode ser categorizada como DIDATICA sem transposição pedagógica explícita."
      );
    }
  }

  const claimText = `${revisedExcerpt || ""} ${originalExcerpt || ""} ${reason || ""}`;

  // 3. Validação dos critérios específicos quando outcome === "CONFIRMADA" (Scope 3)
  if (outcome === "CONFIRMADA" && nature) {
    const specificMeta = extractMetadataForNature(nature, metadata, evidence);

    switch (nature) {
      case "NORMA_JURIDICA": {
        const hasOfficialEvidence =
          (evidence && evidence.some((e) => e.official && e.supportsChange)) ||
          (sources && sources.some((s) => s.official)) ||
          (specificMeta &&
            typeof specificMeta.fonteOficial === "string" &&
            Boolean(specificMeta.fonteOficial.trim()) &&
            (!isOfficialSourceChecker || isOfficialSourceChecker(specificMeta.fonteOficial)));

        if (!hasOfficialEvidence) {
          errors.push(
            "Afirmações normativas exigem comprovação em fonte oficial primária para o resultado CONFIRMADA."
          );
        }
        if (!specificMeta || !specificMeta.diploma || !specificMeta.dispositivo) {
          warnings.push("Afirmação normativa confirmada sem especificação completa de diploma ou dispositivo.");
        }
        break;
      }

      case "PRECEDENTE_VINCULANTE": {
        const combinedText = `${claimText} ${(evidence || []).map((e) => `${e.title || ""} ${e.supportExplanation || ""}`).join(" ")}`;
        if (isIsolatedOrNonBindingPrecedent(combinedText, specificMeta as unknown as JurisprudentialEvidenceMetadata | undefined)) {
          errors.push(
            "Decisões monocráticas ou acórdãos isolados de turma sem força vinculante não podem ser classificados como PRECEDENTE_VINCULANTE."
          );
        }

        const hasOfficialEvidence =
          (evidence && evidence.some((e) => e.official && e.supportsChange)) ||
          (sources && sources.some((s) => s.official)) ||
          (specificMeta &&
            typeof specificMeta.fonteOficial === "string" &&
            Boolean(specificMeta.fonteOficial.trim()) &&
            (!isOfficialSourceChecker || isOfficialSourceChecker(specificMeta.fonteOficial)));

        if (!hasOfficialEvidence) {
          errors.push(
            "Afirmações jurisprudenciais vinculantes exigem comprovação em fonte oficial primária do tribunal para o resultado CONFIRMADA."
          );
        }
        if (!specificMeta || !specificMeta.tribunal || !specificMeta.processo) {
          warnings.push("Afirmação jurisprudencial vinculante confirmada sem especificação completa de tribunal ou processo.");
        }
        break;
      }

      case "JURISPRUDENCIA_NAO_VINCULANTE": {
        const hasOfficialEvidence =
          (evidence && evidence.some((e) => e.official && e.supportsChange)) ||
          (sources && sources.some((s) => s.official)) ||
          (specificMeta &&
            typeof specificMeta.fonteOficial === "string" &&
            Boolean(specificMeta.fonteOficial.trim()) &&
            (!isOfficialSourceChecker || isOfficialSourceChecker(specificMeta.fonteOficial)));

        if (!hasOfficialEvidence) {
          errors.push(
            "Afirmações jurisprudenciais exigem comprovação em fonte oficial primária do tribunal para o resultado CONFIRMADA."
          );
        }
        if (!specificMeta || !specificMeta.tribunal || !specificMeta.processo) {
          warnings.push("Afirmação jurisprudencial confirmada sem especificação completa de tribunal ou processo.");
        }
        break;
      }

      case "DOUTRINA":
      case "DIVERGENCIA_DOUTRINARIA": {
        // REGRA MANDATÓRIA 4: A simples classificação como DOUTRINA não produz CONFIRMADA automaticamente!
        let autor = specificMeta && typeof specificMeta.autor === "string" ? specificMeta.autor.trim() : "";
        let obra = specificMeta && typeof specificMeta.obra === "string" ? specificMeta.obra.trim() : "";

        // Fallback: tenta extrair autor e obra de title da evidência se formatado como "Autor - Obra"
        if ((!autor || !obra) && evidence && evidence.length > 0) {
          for (const ev of evidence) {
            const evTitle = String(ev.title || "").trim();
            const parts = evTitle.split(/\s*[-—–]\s*|\s*,\s*/);
            if (parts.length >= 2) {
              if (!autor) autor = parts[0].trim();
              if (!obra) obra = parts.slice(1).join(" - ").trim();
            }
          }
        }

        if (!autor || !obra || isGenericDoctrinalAuthor(autor) || isGenericDoctrinalWork(obra)) {
          errors.push(
            "Afirmação doutrinária não pode ser classificada como CONFIRMADA sem indicação válida de autor e obra de referência bibliográfica (rejeitadas referências genéricas à doutrina)."
          );
        }
        break;
      }

      case "RECURSO_PEDAGOGICO": {
        // REGRA MANDATÓRIA 4: A simples classificação como RECURSO_PEDAGOGICO não produz CONFIRMADA automaticamente!
        if (isFraudulentPedagogicalReclassification(claimText, specificMeta as unknown as PedagogicalEvidenceMetadata | undefined)) {
          errors.push(
            "Reclassificação fraudulenta detectada: dados estatísticos ou percentuais empíricos não podem ser mascarados como recurso pedagógico."
          );
        }

        const justificativa =
          specificMeta && typeof specificMeta.justificativa === "string" ? specificMeta.justificativa.trim() : "";
        const compatibilidade =
          specificMeta && typeof specificMeta.compatibilidadeJuridica === "string"
            ? specificMeta.compatibilidadeJuridica.trim()
            : "";

        if (!justificativa || !compatibilidade) {
          errors.push(
            "Recurso pedagógico não pode ser classificado como CONFIRMADO sem justificativa didática e análise explícita de compatibilidade jurídica."
          );
        }
        break;
      }

      case "AFIRMACAO_EMPIRICA": {
        const origem = specificMeta && typeof specificMeta.origem === "string" ? specificMeta.origem.trim() : "";
        if (!origem) {
          errors.push(
            "Afirmação empírica não pode ser classificada como CONFIRMADA sem indicação da origem dos dados ou da amostragem."
          );
        } else if (hasEmpiricalPercentagesWithoutMethodology(claimText, specificMeta as unknown as EmpiricalEvidenceMetadata | undefined)) {
          errors.push(
            "Afirmação empírica contendo percentuais exige metodologia e amostragem verificáveis para o resultado CONFIRMADA."
          );
        }
        break;
      }

    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// 4. COMPATIBILIDADE RETROATIVA PURA (SEM MUTAÇÃO DE BANCO)
// =============================================================================

/**
 * Identifica se um registro pertence ao schema legado (sem nature ou outcome declarados).
 */
export function isLegacyReviewRecord(record: { nature?: unknown; outcome?: unknown }): boolean {
  return !record.nature && !record.outcome;
}

/**
 * Mapeador de leitura: converte o valor legado LegalConfirmation no novo LegalVerificationOutcome.
 * Função pura: não muta o registro original.
 */
export function mapLegacyConfirmationToOutcome(
  confirmation?: LegalConfirmation,
  verified = false
): LegalVerificationOutcome {
  if (confirmation === "CONFIRMADO" && verified) {
    return "CONFIRMADA";
  }
  return "NAO_VERIFICADA";
}

/**
 * Mapeador de leitura consultiva: infere uma natureza correspondente a partir da categoria legada.
 * Usado exclusivamente em tempo de leitura/exibição, sem persistência ou mutação automática.
 */
export function inferNatureFromLegacyCategory(
  category?: LegalChangeCategory
): LegalClaimNature | undefined {
  if (!category) return undefined;
  switch (category) {
    case "LEGISLACAO":
      return "NORMA_JURIDICA";
    case "JURISPRUDENCIA":
      return "JURISPRUDENCIA_NAO_VINCULANTE";
    case "SUMULA":
      return "PRECEDENTE_VINCULANTE";
    case "DOUTRINA":
      return "DOUTRINA";
    case "CONCEITO":
      return "DOUTRINA";
    case "DIDATICA":
      return "RECURSO_PEDAGOGICO";
    case "ATUALIZACAO":
    case "OMISSAO_RELEVANTE":
      return "NORMA_JURIDICA";
    default:
      return undefined;
  }
}

/**
 * Leitor seguro de natureza da afirmação:
 * Retorna o campo nature se existir; caso contrário retorna undefined, preservando a integridade.
 */
export function readClaimNatureSafe(item: {
  nature?: LegalClaimNature;
}): LegalClaimNature | undefined {
  return item.nature;
}

/**
 * Leitor seguro do resultado da verificação com fallback retrocompatível em tempo de leitura:
 * Se o campo outcome existir, retorna diretamente.
 * Se for legado, calcula o fallback sem alterar o objeto.
 */
export function readClaimOutcomeSafe(item: {
  outcome?: LegalVerificationOutcome;
  confirmation?: LegalConfirmation;
  verified?: boolean;
}): LegalVerificationOutcome {
  if (item.outcome) {
    return item.outcome;
  }
  return mapLegacyConfirmationToOutcome(item.confirmation, item.verified);
}
