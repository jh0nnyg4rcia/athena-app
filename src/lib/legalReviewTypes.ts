/** Tipos da auditoria jurídica. Sem chave, sem prompt e sem Firestore. */

export const LEGAL_REVIEW_CONFLICT_MESSAGE =
  "A aula foi modificada após o início desta revisão. Gere uma nova revisão ou compare as versões antes de publicar.";

export const LEGAL_REVIEW_ALREADY_MESSAGE = "Esta versão já foi revisada.";

export const LEGAL_REVIEW_STAGE_A_DISABLED_MESSAGE =
  "O Estágio A (deliberação individual de achados jurídicos) está desabilitado operacionalmente no ambiente (LEGAL_REVIEW_STAGE_A_ENABLED=false).";

export const LEGAL_REVIEW_STAGE_B_DISABLED_MESSAGE =
  "O Estágio B (encerramento formal da complementação jurídica) está desabilitado operacionalmente no ambiente (LEGAL_REVIEW_STAGE_B_ENABLED=false).";

export const LEGAL_REVIEW_STAGE_C_DISABLED_MESSAGE =
  "O Estágio C (homologação e publicação final da aula) está desabilitado operacionalmente no ambiente (LEGAL_REVIEW_STAGE_C_ENABLED=false).";

export interface LegalReviewOperationalFlags {
  stageAEnabled: boolean;
  stageBEnabled: boolean;
  stageCEnabled: boolean;
}

export function getLegalReviewOperationalFlags(
  env: Record<string, string | undefined> = process.env
): LegalReviewOperationalFlags {
  return {
    stageAEnabled: env.LEGAL_REVIEW_STAGE_A_ENABLED === "true",
    stageBEnabled: env.LEGAL_REVIEW_STAGE_B_ENABLED === "true",
    stageCEnabled: env.LEGAL_REVIEW_STAGE_C_ENABLED === "true",
  };
}

export const MAX_REVIEWABLE_CHARS = 180_000;

export type LegalReviewRecordStatus =
  | "queued"
  | "processing"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "failed"
  | "uncertain_failure";

export interface AsyncLegalReviewJobPayload {
  jobType?: "AUDIT";
  reviewId: string;
  lessonId: string;
  day: number;
  part: number;
  blockIndex?: number;
  expectedHash: string;
  requestedByUid: string;
  requestedAt: number;
}

export interface AsyncLegalSupplementJobPayload {
  jobType: "SUPPLEMENT";
  reviewId: string;
  lessonId: string;
  attemptId?: string;
  requestedByUid: string;
  requestedByEmail: string;
  requestedAt: number;
}

export type AsyncLegalReviewTaskPayload =
  | AsyncLegalReviewJobPayload
  | AsyncLegalSupplementJobPayload;

export type LegalReviewOutcome = "ALTERACOES_NECESSARIAS" | "SEM_ALTERACOES_RELEVANTES";

export type LegalReviewConfidence = "ALTA" | "MEDIA" | "BAIXA";

export type LegalVerificationLevel =
  | "VERIFICADO_COM_FONTES"
  | "VERIFICACAO_PARCIAL"
  | "FALHA_NA_VERIFICACAO";

export type EditorialIntegrityStatus =
  | "EDITORIAL_REVIEW_SUCCESS"
  | "EDITORIAL_REVIEW_INCOMPLETE";

export type ChangeResolutionState =
  | "APPLIED_AUTOMATICALLY"
  | "APPLIED_BY_CEO"
  | "EDITED_BY_CEO"
  | "REJECTED_BY_CEO"
  | "PENDING"
  | "BLOCKED";

export interface HumanReviewDecision {
  changeId: string;
  action: "APPLY" | "EDIT" | "REJECT";
  state: ChangeResolutionState;
  customText?: string;
  rejectionReason?: string;
  targetContext?: string;
  decidedAt: number;
  decidedByUid: string;
  decidedByEmail: string;
}

// =============================================================================
// ETAPA 5F: DELIBERAÇÃO INDIVIDUAL E AUDITÁVEL DOS ACHADOS JURÍDICOS (CEO)
// =============================================================================

export type HumanFindingAction =
  | "CONFIRMAR"
  | "APONTAR_CORRECAO"
  | "DECLARAR_DIVERGENCIA"
  | "DECLARAR_NAO_COMPROVADO"
  | "MANTER_PENDENTE";

export type HumanFindingResolutionState =
  | "CONFIRMADO_PELO_CEO"
  | "CORRECAO_NECESSARIA"
  | "DIVERGENCIA_LEGITIMA"
  | "NAO_COMPROVADO"
  | "PENDENTE";

/**
 * Distinção probatória expressa exigida na Etapa 5F:
 * - Evidência declarada pelo CEO (alegação ou apontamento fornecido)
 * - Evidência documental conferida (fonte oficial validada e confrontada)
 * - Decisão jurídica humana (juízo deliberativo do CEO sobre a controvérsia)
 */
export interface FindingEvidenceDeclaration {
  declaredSource: string;
  declaredUrl?: string;
  declaredExcerpt?: string;
  bibliographicReference?: string;
  semanticJustification?: string;
  documentaryVerified: boolean;
  verificationNotes?: string;
}

export interface FindingDecisionHistoryEntry {
  action: HumanFindingAction;
  state: HumanFindingResolutionState;
  justification: string;
  evidenceDeclaration?: FindingEvidenceDeclaration;
  divergenceNature?: string;
  correctionChangeId?: string;
  expurgationConfirmed?: boolean;
  expectedCandidateHash?: string;
  candidateHashAtDecision?: string;
  decidedAt: number;
  decidedByUid: string;
  decidedByEmail: string;
}

export interface HumanFindingDecision {
  /** Chave estável do achado (calculada via getFindingStableKey) */
  findingKey: string;
  findingPendingId: string;
  findingChangeId?: string;
  reviewId: string;
  originalAiStatus: "confirmada" | "refutada" | "nao_verificada";
  originalStatementAnalyzed: string;
  action: HumanFindingAction;
  state: HumanFindingResolutionState;
  justification: string;
  evidenceDeclaration?: FindingEvidenceDeclaration;
  divergenceNature?: string;
  correctionChangeId?: string;
  expurgationConfirmed?: boolean;
  /** Hash SHA-256 esperado pelo operador no momento do envio da deliberação */
  expectedCandidateHash?: string;
  /** Hash SHA-256 do reviewedMarkdown no momento da deliberação */
  candidateHashAtDecision?: string;
  decidedAt: number;
  decidedByUid: string;
  decidedByEmail: string;
  history?: FindingDecisionHistoryEntry[];
}

/**
 * Encerramento Administrativo e Fundamentado da Complementação Jurídica (Estágio B - Etapa 6C).
 * Preserva o supplement.status original gerado pela IA (ex: 'inconclusive') e atesta
 * que 100% dos achados foram sanados pelo CEO com integridade e coerência.
 */
export interface SupplementHumanResolutionHistoryEntry {
  status: "RESOLVIDO_PELO_CEO";
  closedAt: number;
  closedByUid: string;
  closedByEmail: string;
  overallJustification: string;
  candidateHashAtClosure: string;
  totalFindingsResolved: number;
}

export interface SupplementHumanResolution {
  status: "RESOLVIDO_PELO_CEO";
  closedAt: number;
  closedByUid: string;
  closedByEmail: string;
  overallJustification: string;
  /** Hash SHA-256 do reviewedMarkdown no momento exato do encerramento */
  candidateHashAtClosure: string;
  totalFindingsResolved: number;
  /** Histórico de atos de encerramento anteriores preservado cumulativamente */
  history?: SupplementHumanResolutionHistoryEntry[];
}


/**
 * Deriva um identificador único, determinístico e estável para um achado da complementação jurídica.
 *
 * Regras de Identidade Estável:
 * 1. Combina pendingId e changeId quando ambos presentes (ex: pendingId 'chg_CHG-001' ou pendingId 'pen_01' + changeId 'CHG-001').
 * 2. Se apenas pendingId existir e não for vazio, utiliza pendingId (compatibilidade com unverified_claim_1, etc.).
 * 3. Se pendingId for ausente mas changeId existir, utiliza `change_${changeId}`.
 * 4. Para achados legados sem identificadores explícitos:
 *    - Calcula um digest SHA-256 canônico baseado na tupla (statementAnalyzed + officialSourceConsulted + relevantExcerptOrBasis).
 *    - Retorna `stmt_sha256_${hash}`.
 * 5. Se o conteúdo for completamente vazio/indeterminado, retorna string vazia para indicar ausência de identidade inequívoca.
 */
export function getFindingStableKey(finding: {
  pendingId?: string;
  changeId?: string;
  statementAnalyzed?: string;
  officialSourceConsulted?: string;
  relevantExcerptOrBasis?: string;
}): string {
  const pendingId = (finding.pendingId || "").trim();
  const changeId = (finding.changeId || "").trim();
  const statement = (finding.statementAnalyzed || "").trim();
  const source = (finding.officialSourceConsulted || "").trim();
  const excerpt = (finding.relevantExcerptOrBasis || "").trim();

  // 1. Se possuir changeId e pendingId distintos
  if (changeId && pendingId) {
    if (pendingId.includes(changeId)) {
      return pendingId;
    }
    return `${pendingId}_${changeId}`;
  }

  // 2. Se possuir apenas pendingId
  if (pendingId) {
    return pendingId;
  }

  // 3. Se possuir apenas changeId
  if (changeId) {
    return `change_${changeId}`;
  }

  // 4. Sem identificadores formais: calcula digest criptográfico canônico da tupla material
  if (statement || source || excerpt) {
    const canonicalMaterial = `${statement}:::${source}:::${excerpt}`;
    let hash = 0;
    for (let i = 0; i < canonicalMaterial.length; i++) {
      hash = ((hash << 5) - hash + canonicalMaterial.charCodeAt(i)) | 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    return `canonical_${hex}`;
  }

  return "";
}



export type ChangeValidationStatus =
  | "APPLIED"
  | "MISSING"
  | "PARTIALLY_APPLIED"
  | "NOT_IN_ORIGINAL"
  | "AMBIGUOUS"
  | "INCONSISTENT"
  | "REJECTED";

export interface ChangeValidationResult {
  changeId: string;
  status: ChangeValidationStatus;
  resolutionState: ChangeResolutionState;
  applied: boolean;
  material: boolean;
  detail: string;
  originalFoundInOriginal: boolean;
  originalMatchesInOriginal: number;
  revisedFoundInReviewed: boolean;
  originalStillInReviewed: boolean;
  decision?: HumanReviewDecision;
  currentReviewedExcerpt?: string;
}

export interface CoordinatedQuestionGroup {
  questionIndex: number;
  questionId: string;
  subject: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  changeIds: string[];
  pendingChangeIds: string[];
}

export interface EditorialIntegrityValidation {
  status: EditorialIntegrityStatus;
  passed: boolean;
  executionCompleted: boolean;
  editorialIntegrityPassed: boolean;
  legalVerificationPassed: boolean;
  totalChanges: number;
  appliedChanges: number;
  problematicChanges: string[];
  changeResults: ChangeValidationResult[];
  failureReasons: string[];
  pendingChangesCount: number;
  resolvedChangesCount: number;
}

export type LegalChangeType =
  | "CORRECAO"
  | "ATUALIZACAO"
  | "ACRESCIMO"
  | "REMOCAO"
  | "PRECISAO"
  | "REESTRUTURACAO";

export type LegalChangeCategory =
  | "LEGISLACAO"
  | "JURISPRUDENCIA"
  | "SUMULA"
  | "DOUTRINA"
  | "CONCEITO"
  | "ATUALIZACAO"
  | "OMISSAO_RELEVANTE"
  | "DIDATICA";

export type LegalSeverity = "ALTA" | "MEDIA" | "BAIXA";

export type LegalConfirmation = "CONFIRMADO" | "NAO_CONFIRMADO";

export type LegalSourceType =
  | "LEI"
  | "CONSTITUICAO"
  | "DECRETO"
  | "RESOLUCAO"
  | "SUMULA"
  | "ACORDAO"
  | "REPERCUSSAO_GERAL"
  | "REPETITIVO"
  | "INFORMATIVO"
  | "ATO_NORMATIVO"
  | "OUTRO_OFICIAL";

export interface LegalReviewSource {
  title: string;
  url: string;
  official: boolean;
  institution: string;
}

/** Fonte devolvida pela ferramenta. Consultada não significa que comprova a alteração. */
export interface ConsultedLegalSource {
  sourceId?: string;
  url: string;
  official: boolean;
  institution: string;
  title?: string;
  snippet?: string;
}

import type {
  LegalClaimNature,
  LegalVerificationOutcome,
  ClaimEvidenceMetadata,
  EvidenceNatureMetadata,
} from "./legalReviewTaxonomy";
export * from "./legalReviewTaxonomy";

export interface LegalReviewEvidence {
  institution: string;
  title: string;
  url: string;
  official: boolean;
  consulted: boolean;
  supportsChange: boolean;
  supportExplanation: string;
  sourceType: LegalSourceType;
  /** Natureza ontológica da afirmação (Etapa 5B). Opcional para manter compatibilidade retroativa. */
  nature?: LegalClaimNature;
  /** Resultado probatório da verificação (Etapa 5B). Opcional para manter compatibilidade retroativa. */
  outcome?: LegalVerificationOutcome;
  /** Metadados especializados por categoria de evidência (Etapa 5B). */
  evidenceMetadata?: ClaimEvidenceMetadata | EvidenceNatureMetadata;
}

export interface LegalSourceHistoryEntry {
  at: number;
  verificationLevel: LegalVerificationLevel;
  consultedSources: ConsultedLegalSource[];
  note: string;
}

export interface LegalReviewChange {
  id: string;
  type: LegalChangeType;
  severity: LegalSeverity;
  category: LegalChangeCategory;
  originalExcerpt: string;
  revisedExcerpt: string;
  beforeContext?: string;
  afterContext?: string;
  reason: string;
  verified: boolean;
  confirmation: LegalConfirmation;
  sources: LegalReviewSource[];
  evidence: LegalReviewEvidence[];
  /** Natureza ontológica da afirmação (Etapa 5B). Opcional para manter compatibilidade retroativa. */
  nature?: LegalClaimNature;
  /** Resultado probatório da verificação (Etapa 5B). Opcional para manter compatibilidade retroativa. */
  outcome?: LegalVerificationOutcome;
  /** Metadados especializados por categoria de evidência (Etapa 5B). */
  evidenceMetadata?: ClaimEvidenceMetadata | EvidenceNatureMetadata;
}

export interface LegalUnverifiedClaim {
  excerpt: string;
  reason: string;
  /** Natureza ontológica da afirmação (Etapa 5B). Opcional para manter compatibilidade retroativa. */
  nature?: LegalClaimNature;
  /** Resultado probatório da verificação (Etapa 5B). Opcional para manter compatibilidade retroativa. */
  outcome?: LegalVerificationOutcome;
  /** Metadados especializados por categoria de evidência (Etapa 5B). */
  evidenceMetadata?: ClaimEvidenceMetadata | EvidenceNatureMetadata;
}

export interface LegalReviewSummary {
  totalChanges: number;
  corrections: number;
  additions: number;
  removals: number;
  updates: number;
  precisions: number;
  restructures: number;
}

export interface LegalReviewUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface LegalReviewView {
  id: string;
  lessonId: string;
  day: number;
  part: number;
  /** Parte interna [BLOCK_n], índice zero-based. Ausente na revisão do documento inteiro. */
  blockIndex?: number;
  /** Documento do catálogo de onde a parte foi extraída. */
  catalogLessonId?: string;
  /** Prévia de uma parte. Não pode substituir a aula publicada. */
  previewOnly?: boolean;
  subject: string;
  topic: string;
  originalHash: string;
  originalApprovedAt: number | null;
  originalContent: string;
  reviewedMarkdown: string;
  changes: LegalReviewChange[];
  unverifiedClaims: LegalUnverifiedClaim[];
  summary: LegalReviewSummary;
  reviewNotes: string;
  verificationLevel: LegalVerificationLevel;
  confidence: LegalReviewConfidence;
  outcome: LegalReviewOutcome;
  status: LegalReviewRecordStatus;
  model: string;
  reviewDate: string;
  requestedByUid: string;
  requestedAt: number;
  approvedByUid?: string;
  approvedAt?: number;
  rejectedByUid?: string;
  rejectedAt?: number;
  webSearchUsed: boolean;
  testMode: boolean;
  usage?: LegalReviewUsage;
  consultedSources: ConsultedLegalSource[];
  manuallyEdited: boolean;
  manuallyEditedAt?: number;
  candidateHash: string;
  auditedCandidateHash: string;
  sourceHistory: LegalSourceHistoryEntry[];
  editorialIntegrity?: EditorialIntegrityValidation;
  humanDecisions?: Record<string, HumanReviewDecision>;
  /** Deliberações individuais do CEO sobre achados jurídicos (Etapa 5F). */
  findingDecisions?: Record<string, HumanFindingDecision>;
  /** Hash SHA-256 canônico do estado de deliberações e achados para encerramento do Estágio B (Etapa 15.1). */
  decisionStateHash?: string;
  supplement?: LegalReviewSupplement;
}

export type LegalSupplementStatus =
  | "idle"
  | "reserved"
  | "running"
  | "completed"
  | "inconclusive"
  | "pre_call_failure"
  | "uncertain_interrupted"
  | "exhausted";

export interface SupplementPendingItem {
  id: string;
  sourceType: "CHANGE" | "UNVERIFIED_CLAIM";
  changeId?: string;
  excerpt: string;
  reason: string;
  targetTopics?: string[];
}

export interface SupplementFindingItem {
  pendingId: string;
  changeId?: string;
  statementAnalyzed: string;
  officialSourceConsulted: string;
  verifiableUrl: string;
  relevantExcerptOrBasis: string;
  status: "confirmada" | "refutada" | "nao_verificada";
  objectiveJustification: string;
  foundOfficialEvidence: boolean;
  evidence?: LegalReviewEvidence[];
  sources?: LegalReviewSource[];
  /** Natureza ontológica da afirmação (Etapa 5B). Opcional para manter compatibilidade retroativa. */
  nature?: LegalClaimNature;
  /** Resultado probatório da verificação (Etapa 5B). Opcional para manter compatibilidade retroativa. */
  outcome?: LegalVerificationOutcome;
  /** Metadados especializados por categoria de evidência (Etapa 5B). */
  evidenceMetadata?: ClaimEvidenceMetadata | EvidenceNatureMetadata;
}

export interface LegalReviewSupplement {
  attemptCount: number;
  status: LegalSupplementStatus;
  attemptId?: string;
  startedAt?: number;
  completedAt?: number;
  requestedByUid?: string;
  requestedByEmail?: string;
  costEstimatedUsd?: number;
  tokensUsed?: number;
  durationMs?: number;
  targetedPendingItems?: SupplementPendingItem[];
  findings?: SupplementFindingItem[];
  finalNote?: string;
  uncertaintyReason?: string;
  /** Encerramento administrativo formal da complementação pelo CEO (Etapa 6C) */
  resolution?: SupplementHumanResolution;
}

export interface LegalSupplementExecutor {
  supplement: (params: {
    lessonId: string;
    pendingItems: SupplementPendingItem[];
    budget: { maxTokens: number; maxDurationMs: number; maxCostUsd: number };
    signal?: AbortSignal;
  }) => Promise<{
    status: "completed" | "inconclusive";
    tokensUsed: number;
    durationMs: number;
    costUsd: number;
    findings: SupplementFindingItem[];
    finalNote: string;
  }>;
}

export interface StoredCatalogLesson {
  id: string;
  day: number;
  part: number;
  subject: string;
  topic?: string;
  content: string;
  challenge?: unknown;
  status?: string;
  approvedBy?: string;
  approvedAt?: number;
  modelUsed?: string;
  version?: number;
  review?: string;
}

export interface LegalReviewIndex {
  lessonId: string;
  processingReviewId: string | null;
  processingStartedAt: number | null;
  approvedHash: string | null;
  approvedReviewId: string | null;
  approvedReviewDate: string | null;
  latestReviewId: string | null;
  latestStatus: string | null;
}

export function emptyReviewIndex(lessonId: string): LegalReviewIndex {
  return {
    lessonId,
    processingReviewId: null,
    processingStartedAt: null,
    approvedHash: null,
    approvedReviewId: null,
    approvedReviewDate: null,
    latestReviewId: null,
    latestStatus: null,
  };
}

export function legalReviewButtonVisible(isCeo: boolean, lessonSaved: boolean): boolean {
  return Boolean(isCeo && lessonSaved);
}

/** O teste do revisor aparece para o CEO mesmo sem aula homologada. */
export function legalReviewTestButtonVisible(isCeo: boolean): boolean {
  return Boolean(isCeo);
}

export function formatReviewDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(now);
  const day = parts.find((part) => part.type === "day")?.value || "01";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const year = parts.find((part) => part.type === "year") || { value: "2026" };
  return `${day}/${month}/${year.value}`;
}

// =============================================================================
// V2.3.3 MATERIAL EVIDENCE FOUNDATION (LEGISLAÇÃO & ATOS NORMATIVOS)
// =============================================================================

export type MaterialEvidenceType = "TOOL_GROUNDED" | "LOCAL_DETERMINISTIC";

/**
 * Origens oficiais permitidas em ambiente de produção.
 * Nota: SYNTHETIC_FIXTURE é restrito aos ambientes de teste e PoC e não é aceito aqui.
 */
export type MaterialDocumentOrigin = "REMOTE_OFFICIAL_DOCUMENT" | "LOCAL_REAL_DOCUMENT";

export type MaterialRevalidationPolicy = "IMMUTABLE" | "REVALIDATE_CONDITIONAL" | "DYNAMIC";

export interface LegislationLocator {
  type: "LEGISLATION";
  statute: string;
  article: string;
  paragraph?: string;
  item?: string;
  subItem?: string;
}

export type MaterialEvidenceLocator = LegislationLocator;

export interface MaterialEvidenceProvenance {
  origin: MaterialDocumentOrigin;
  sourceUrl: string;
  retrievedAt: string;
  rawContentHash: string;
  normalizedContentHash: string;
  contentType: "text/html" | "text/plain";
  revalidationPolicy: MaterialRevalidationPolicy;
  etag?: string;
  lastModified?: string;
}

export interface MaterialEvidence {
  evidenceId: string;
  sourceId: string;
  sourceUrl: string;
  retrievedAt: string;
  rawContentHash: string;
  normalizedContentHash: string;
  evidenceType: MaterialEvidenceType;
  locator: MaterialEvidenceLocator;
  materialText: string;
  provenance: MaterialEvidenceProvenance;
}

export type MaterialEvidenceValidationReason =
  | "VALID"
  | "ORIGIN_NOT_ALLOWED"
  | "SOURCE_ID_MISMATCH"
  | "SOURCE_URL_MISMATCH"
  | "RAW_HASH_MISMATCH"
  | "NORMALIZED_HASH_MISMATCH"
  | "LOCATOR_NOT_FOUND"
  | "MATERIAL_TEXT_MISMATCH"
  | "MATERIAL_EVIDENCE_UNAVAILABLE";

export interface MaterialEvidenceVerificationResult {
  valid: boolean;
  reasonCode: MaterialEvidenceValidationReason;
  details?: string;
}

// ============================================================================
// ATHENA V2.3.4-A: ASSERTION BINDING FOUNDATION TYPES & FEATURE FLAG
// ============================================================================

/**
 * Feature flag controlando a ativação do motor de Material Evidence Binding no runtime.
 * Default: false (desacoplado do gate jurídico final).
 */
export const LEGAL_REVIEW_MATERIAL_BINDING = false;

export interface SourceSpan {
  start: number;
  end: number;
  text: string;
}

export type ClaimMateriality = "MATERIAL" | "NON_MATERIAL";

export type ClaimType =
  | "DIRECT_NORMATIVE_ASSERTION"
  | "COURT_RULING"
  | "INTERPRETIVE_INFERENCE"
  | "DOCTRINAL_SYNTHESIS"
  | "NON_MATERIAL_PREAMBLE";

export interface AtomicClaim {
  claimId: string;
  propositionId: string;
  sourceSpan: SourceSpan;
  normalizedClaim: string;
  claimType: ClaimType;
  materiality: ClaimMateriality;
}

export type QualifierType =
  | "SCOPE"
  | "FREQUENCY"
  | "LIMIT"
  | "PURPOSE"
  | "CONDITION"
  | "AUTHORITY"
  | "TEMPORAL"
  | "OTHER";

export interface Qualifier {
  type: QualifierType;
  value: string;
  sourceSpan: SourceSpan;
}

export type Polarity = "POSITIVE" | "NEGATIVE";

export type Modality =
  | "MAY"
  | "MUST"
  | "MUST_NOT"
  | "DECLARES"
  | "RECOGNIZES"
  | "NOT_APPLICABLE"
  | "OTHER";

export type NormativeFunction =
  | "DUTY"
  | "PROHIBITION"
  | "PERMISSION"
  | "COMPETENCE"
  | "CONSTITUTIVE_EFFECT"
  | "DECLARATION";

export type ReferencePresence =
  | "NONE"
  | "PARTIAL"
  | "STRUCTURED";

export type CanonicalTargetEvaluability =
  | "EXPLICIT_IN_TEXT"
  | "PROVIDED_BY_CONTEXT"
  | "NOT_EVALUABLE_FROM_INPUT";

export type SourceTargetEvaluability = CanonicalTargetEvaluability;

export interface LegalSourceTargetComponents {
  authority?: string;
  sourceType?: string;
  diploma?: string;
  number?: string;
  article?: string;
  paragraph?: string;
  inciso?: string;
  alinea?: string;
  precedentType?: string;
  precedentNumber?: string;
}

export interface LegalSourceLocator {
  authority?: string;
  sourceType?: string;
  diploma?: string;
  number?: string;

  article?: string;
  paragraph?: string;
  inciso?: string;
  alinea?: string;

  precedentType?: string;
  precedentNumber?: string;

  sourceSpan?: SourceSpan;
  canonicalId?: string;
}

export type EvaluabilityReasonCode =
  | "FULL_COMPONENTS_EXPLICIT_IN_TEXT"
  | "COMPONENTS_PROVIDED_BY_CONTEXT"
  | "PARTIAL_REFERENCE_MISSING_DIPLOMA"
  | "PARTIAL_REFERENCE_MISSING_PROVISION"
  | "PARTIAL_REFERENCE_MISSING_PARAGRAPH"
  | "DIPLOMA_WITHOUT_PROVISION"
  | "PROVISION_WITHOUT_DIPLOMA"
  | "CONTEXT_NOT_DELIVERED"
  | "NO_REFERENCE_IN_INPUT"
  | "CANONICAL_TARGET_AMBIGUOUS"
  | "TARGET_MORE_GRANULAR_THAN_INPUT"
  | "TARGET_NOT_PRESENT_IN_INPUT";

export interface EvaluabilityAssessment {
  referencePresence: ReferencePresence;
  canonicalTargetEvaluability: CanonicalTargetEvaluability;
  reasonCode: EvaluabilityReasonCode;
  missingComponents?: string[];
  availableComponents?: LegalSourceTargetComponents;
  availableLocators?: LegalSourceLocator[];
  matchedLocator?: LegalSourceLocator;
  requiredComponents?: LegalSourceTargetComponents;
  precedentIdentityEvaluability: boolean;
  precedentHoldingEvaluability: boolean;
  contextHash?: string;
  contextFieldsProvided?: string[];
}

export interface InputSufficiencyManifest {
  propositionId: string;
  legalSourceTargetEvaluability: SourceTargetEvaluability;
  precedentIdentityEvaluability: boolean;
  explicitProvisionInText: boolean;
  referencePresence?: ReferencePresence;
  reasonCode?: EvaluabilityReasonCode;
}

export type AssertionSpecKind =
  | "RULE_PROHIBITION"
  | "RULE_PERMISSION"
  | "RULE_OBLIGATION"
  | "COURT_RULING"
  | "ORGANIZATIONAL_DUTY"
  | "INTERPRETIVE_CLAIM";

export interface AssertionSpec {
  assertionId: string;
  propositionId: string;
  claimId: string;
  sourceSpan: SourceSpan;
  kind: AssertionSpecKind;
  normativeFunction?: NormativeFunction;
  subject: string;
  predicate: string;
  object: string;
  polarity: Polarity;
  modality: Modality;
  qualifiers: Qualifier[];
  legalSourceTarget: string;
  requiredEvidenceKind: "LEGISLATION" | "JUDICIAL_DECISION" | "ADMINISTRATIVE_ACT";
  goldenCorrectionReason?: string;
}

export type EvidenceDerivationMethod =
  | "LEGISLATION_STRUCTURE"
  | "ENUMERATED_DISPOSITIVO"
  | "EXACT_TEXT_RULE";

export interface JudicialDecisionLocator {
  type: "JUDICIAL_DECISION";
  court: "STF" | "STJ" | string;
  processClass: string;
  processNumber: number;
  incident?: number;
  dispositivoPoint?: number;
  idAndamento?: number;
  idDocumento?: number;
}

export type ExtendedEvidenceLocator = LegislationLocator | JudicialDecisionLocator;

export interface EvidenceAssertion {
  evidenceAssertionId: string;
  evidenceId: string;
  locator: ExtendedEvidenceLocator;
  subject: string;
  predicate: string;
  object: string;
  polarity: Polarity;
  modality: Modality;
  qualifiers: Qualifier[];
  derivationMethod: EvidenceDerivationMethod;
  evidenceText: string;
}

export type SupportLevel =
  | "DIRECT_LITERAL"
  | "DIRECT_NORMATIVE"
  | "NECESSARY_INFERENCE"
  | "INTERPRETIVE_INFERENCE"
  | "UNSUPPORTED"
  | "INDETERMINATE";

export type PropositionMaterialStatus =
  | "FULLY_SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "CONTAINS_UNSUPPORTED_ADDITIONS"
  | "CONTRADICTED"
  | "UNSUPPORTED"
  | "INDETERMINATE";

export interface InferenceRule {
  ruleId: string;
  premises: string[];
  conclusion: string;
  scope: string;
  version: string;
  sourceAuthority: string;
  sourceLocator: string;
}

export interface CanonicalEquivalenceRule {
  ruleId: string;
  expressionA: string;
  expressionB: string;
  canonicalConcept: string;
  scope: string;
  justification: string;
  version: string;
}

export type AssertionBindingReasonCode =
  | "INVALID_SOURCE_SPAN"
  | "UNCOVERED_MATERIAL_GAP"
  | "OVERLAPPING_CLAIMS"
  | "ILLEGAL_NON_MATERIAL_CLAIM"
  | "ASSERTION_SPEC_MISSING"
  | "EVIDENCE_ASSERTION_MISSING"
  | "EVIDENCE_SOURCE_MISMATCH"
  | "EVIDENCE_LOCATOR_MISMATCH"
  | "POLARITY_CONTRADICTION"
  | "MODALITY_CONTRADICTION"
  | "UNSUPPORTED_QUALIFIER_ADDITION"
  | "QUALIFIER_EVIDENCE_MISSING"
  | "QUALIFIER_CONTRADICTION"
  | "INFERENCE_RULE_MISSING"
  | "INFERENCE_SCOPE_MISMATCH"
  | "CANONICAL_EQUIVALENCE_MISSING"
  | "CANONICAL_EQUIVALENCE_SCOPE_MISMATCH"
  | "DIRECT_LITERAL_MATCH"
  | "DIRECT_NORMATIVE_MATCH"
  | "EXPLICIT_INFERENCE_RULE_APPLIED"
  | "INTERPRETIVE_GAP_NO_DISPOSITIVO_MATCH"
  | "ASSERTION_NOT_GROUNDED_IN_EVIDENCE";

export interface BoundClaimResult {
  claimId: string;
  assertionId: string;
  supportLevel: SupportLevel;
  matchedEvidenceAssertionId?: string;
  evidenceLocator?: ExtendedEvidenceLocator;
  reasonCode: AssertionBindingReasonCode | string;
  missingElements?: string[];
  inferenceRuleApplied?: string;
}

export interface MaterialBindingResult {
  propositionId: string;
  atomicClaimCount: number;
  supportedAtomicClaimCount: number;
  unsupportedAtomicClaimCount: number;
  indeterminateAtomicClaimCount: number;
  claims: BoundClaimResult[];
  status: PropositionMaterialStatus;
  reasonCodes: (AssertionBindingReasonCode | string)[];
}
