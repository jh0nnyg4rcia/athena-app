import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronUp, Clock, Database, Edit3, ExternalLink, Layers, Lock, Search, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { diffLines } from "../lib/legalReviewDiff";
import type {
  ChangeResolutionState,
  ConsultedLegalSource,
  CoordinatedQuestionGroup,
  HumanReviewDecision,
  HumanFindingAction,
  HumanFindingDecision,
  FindingEvidenceDeclaration,
  LegalReviewChange,
  LegalReviewEvidence,
  LegalReviewView,
  LegalSourceType,
  SupplementFindingItem,
} from "../lib/legalReviewTypes";
import { getFindingStableKey } from "../lib/legalReviewTypes";
import {
  LegalClaimNature,
  LegalVerificationOutcome,
  extractMetadataForNature,
  inferNatureFromLegacyCategory,
  isGenericDoctrinalAuthor,
  isGenericDoctrinalWork,
  readClaimNatureSafe,
  readClaimOutcomeSafe,
  NormativeEvidenceMetadata,
  JurisprudentialEvidenceMetadata,
  DoctrinalEvidenceMetadata,
  EmpiricalEvidenceMetadata,
  PedagogicalEvidenceMetadata,
} from "../lib/legalReviewTaxonomy";
import {
  evidenceMayBeShownAsProof,
  findQuestionCoordinationGroups,
  safeHttpsUrl,
  validateFindingsForClosure,
  validateFindingsHomologation,
} from "../lib/legalReviewValidate";

type Phase = "confirm" | "running" | "notice" | "result" | "edit" | "error";

const TYPE_LABEL: Record<LegalReviewChange["type"], string> = {
  CORRECAO: "Correção jurídica",
  ATUALIZACAO: "Atualização",
  ACRESCIMO: "Complementação",
  REMOCAO: "Remoção",
  PRECISAO: "Precisão",
  REESTRUTURACAO: "Reestruturação",
};

const SEVERITY_LABEL: Record<LegalReviewChange["severity"], string> = {
  ALTA: "alta relevância",
  MEDIA: "relevância média",
  BAIXA: "baixa relevância",
};

const SOURCE_TYPE_LABEL: Record<LegalSourceType, string> = {
  LEI: "Lei",
  CONSTITUICAO: "Constituição",
  DECRETO: "Decreto",
  RESOLUCAO: "Resolução",
  SUMULA: "Súmula",
  ACORDAO: "Acórdão",
  REPERCUSSAO_GERAL: "Repercussão geral",
  REPETITIVO: "Repetitivo",
  INFORMATIVO: "Informativo",
  ATO_NORMATIVO: "Ato normativo",
  OUTRO_OFICIAL: "Documento oficial",
};

const CLAIM_NATURE_LABEL: Record<LegalClaimNature, string> = {
  NORMA_JURIDICA: "Legislação e Texto Normativo",
  PRECEDENTE_VINCULANTE: "Precedente Vinculante",
  JURISPRUDENCIA_NAO_VINCULANTE: "Jurisprudência Persuasiva",
  DOUTRINA: "Doutrina Jurídica",
  DIVERGENCIA_DOUTRINARIA: "Divergência Doutrinária",
  AFIRMACAO_EMPIRICA: "Dados Empíricos / Estatísticos",
  RECURSO_PEDAGOGICO: "Recurso Pedagógico / Didático",
};

const CLAIM_OUTCOME_LABEL: Record<LegalVerificationOutcome, string> = {
  CONFIRMADA: "Confirmada",
  PARCIALMENTE_CONFIRMADA: "Parcialmente Confirmada",
  CONTROVERSA: "Controversa",
  NAO_VERIFICADA: "Não Verificada",
  INCORRETA: "Incorreta",
  NAO_APLICAVEL: "Não Aplicável",
};

const CLAIM_OUTCOME_BADGE_STYLE: Record<LegalVerificationOutcome, string> = {
  CONFIRMADA: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  PARCIALMENTE_CONFIRMADA: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  CONTROVERSA: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  NAO_VERIFICADA: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  INCORRETA: "bg-rose-600/30 text-rose-200 border-rose-500/50",
  NAO_APLICAVEL: "bg-slate-800 text-slate-400 border-white/10",
};

function verificationCopy(review: LegalReviewView): string {
  if (review.manuallyEdited) return "Verificação parcial — o texto foi modificado após a auditoria jurídica.";
  if (review.verificationLevel === "VERIFICADO_COM_FONTES") return "Auditoria jurídica com fontes oficiais";
  if (review.verificationLevel === "VERIFICACAO_PARCIAL") return "Verificação parcial — há pontos sem confirmação em fonte oficial";
  return "A pesquisa em fontes oficiais não pôde ser concluída. Esta versão não está verificada.";
}

function SourceLink({ url, title }: { url: string; title: string }) {
  const href = safeHttpsUrl(url);
  if (!href) return <span>{title}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline underline-offset-2 break-all">
      {title}
    </a>
  );
}

function evidenceStatusLabel(evidence: LegalReviewEvidence): string {
  if (evidence.official && evidence.consulted && evidence.supportsChange) {
    return "Evidência oficial válida";
  }
  if (!evidence.consulted) return "Não consultada";
  if (!evidence.supportsChange) return "Sem suporte à alteração";
  if (!evidence.official) return "Fonte não oficial";
  return "Não confirmado";
}

function DoctrinalEvidenceDetails({
  doctrinal,
  hasOfficialProof,
}: {
  doctrinal: DoctrinalEvidenceMetadata;
  hasOfficialProof: boolean;
}) {
  const isGenericAuthor = isGenericDoctrinalAuthor(doctrinal.autor || "");
  const isGenericWork = isGenericDoctrinalWork(doctrinal.obra || "");
  const isFormallyValid = Boolean(
    doctrinal.autor &&
    doctrinal.obra &&
    !isGenericAuthor &&
    !isGenericWork
  );

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 space-y-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-purple-500/20 pb-1.5">
        <span className="font-bold text-purple-200 uppercase tracking-wider text-[11px]">
          Metadados Doutrinários
        </span>
        {/* 3 Níveis de Distinção Visual Exigidos na Fase 3 */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10 uppercase" title="Citação e indicação bibliográfica gerada pelo modelo de IA">
            Referência IA
          </span>
          {isFormallyValid ? (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase" title="Autor e obra preenchidos e validados pelo validador determinístico (não genéricos)">
              ✓ Formalmente Validada
            </span>
          ) : (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase" title="Referência genérica ou incompleta (exige auditoria)">
              ⚠️ Referência Genérica
            </span>
          )}
          {hasOfficialProof ? (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase" title="Obra com rastreabilidade oficial confirmada">
              ✓ Efetivamente Conferida
            </span>
          ) : (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30 uppercase" title="Autor e obra plausíveis, mas sem conferência de acervo físico/biblioteca">
              ⏳ Aguardando Conferência de Acervo
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
        <div>
          <span className="font-bold text-slate-100">Autor: </span>
          <span>{doctrinal.autor || "Não especificado"}</span>
        </div>
        <div>
          <span className="font-bold text-slate-100">Obra: </span>
          <span>{doctrinal.obra || "Não especificada"}</span>
        </div>
        {doctrinal.edicao && (
          <div>
            <span className="font-bold text-slate-100">Edição: </span>
            <span>{doctrinal.edicao}</span>
          </div>
        )}
        {doctrinal.grauConfirmacao && (
          <div>
            <span className="font-bold text-slate-100">Posição: </span>
            <span className="font-mono text-purple-300">
              {doctrinal.grauConfirmacao === "DOMINANTE"
                ? "Doutrina Majoritária / Dominante"
                : doctrinal.grauConfirmacao === "DIVIDIDA"
                  ? "Doutrina Dividida / Divergente"
                  : "Posição Minoritária / Isolada"}
            </span>
          </div>
        )}
      </div>

      {doctrinal.referenciaBibliografica && (
        <p className="text-[11px] text-slate-400 font-mono bg-slate-950/60 p-2 rounded-lg border border-white/5">
          {doctrinal.referenciaBibliografica}
        </p>
      )}

      {!hasOfficialProof && (
        <p className="text-[11px] text-amber-300/90 italic">
          ℹ️ A validação formal atesta o preenchimento de autor e obra sem termos genéricos, mas não constitui prova de acervo físico. A confirmação semântica da tese depende do escrutínio do CEO.
        </p>
      )}
    </div>
  );
}

function SpecializedEvidenceBlock({
  nature,
  evidence,
  hasOfficialProof,
}: {
  nature: LegalClaimNature;
  evidence: LegalReviewEvidence;
  hasOfficialProof: boolean;
}) {
  const meta = extractMetadataForNature(nature, evidence.evidenceMetadata, [evidence]);

  if (!meta && (nature === "NORMA_JURIDICA" || nature === "JURISPRUDENCIA_NAO_VINCULANTE" || nature === "PRECEDENTE_VINCULANTE")) {
    return null;
  }

  if (nature === "DOUTRINA" || nature === "DIVERGENCIA_DOUTRINARIA") {
    const doctrinal = (meta as unknown) as DoctrinalEvidenceMetadata | null;
    if (!doctrinal) return null;
    return <DoctrinalEvidenceDetails doctrinal={doctrinal} hasOfficialProof={hasOfficialProof} />;
  }

  if (nature === "NORMA_JURIDICA") {
    const norm = (meta as unknown) as NormativeEvidenceMetadata | null;
    if (!norm) return null;
    return (
      <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 space-y-1.5 text-xs">
        <p className="font-bold text-sky-200 uppercase tracking-wider text-[11px]">Metadados Normativos (Legislação)</p>
        <p><span className="font-bold text-slate-100">Diploma Legal: </span>{norm.diploma}</p>
        <p><span className="font-bold text-slate-100">Dispositivo: </span>{norm.dispositivo}</p>
        {norm.vigencia && <p><span className="font-bold text-slate-100">Vigência: </span>{norm.vigencia}</p>}
        {norm.fonteOficial && (
          <p>
            <span className="font-bold text-slate-100">Fonte Oficial Declarada: </span>
            <SourceLink url={norm.fonteOficial} title={norm.fonteOficial} />
          </p>
        )}
      </div>
    );
  }

  if (nature === "PRECEDENTE_VINCULANTE" || nature === "JURISPRUDENCIA_NAO_VINCULANTE") {
    const juris = (meta as unknown) as JurisprudentialEvidenceMetadata | null;
    if (!juris) return null;
    const isBinding = nature === "PRECEDENTE_VINCULANTE" || juris.vinculante === true;
    return (
      <div className={`rounded-xl border p-3 space-y-1.5 text-xs ${
        isBinding ? "border-amber-500/30 bg-amber-950/20" : "border-indigo-500/30 bg-indigo-950/20"
      }`}>
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
            {isBinding ? "Precedente com Força Vinculante" : "Jurisprudência Persuasiva / Não Vinculante"}
          </p>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
            isBinding ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
          }`}>
            {isBinding ? "Vinculante (Súmula Vinculante / Repetitivo / RG)" : "Persuasiva"}
          </span>
        </div>
        <p><span className="font-bold text-slate-100">Tribunal: </span>{juris.tribunal}</p>
        {juris.orgaoJulgador && <p><span className="font-bold text-slate-100">Órgão Julgador: </span>{juris.orgaoJulgador}</p>}
        <p><span className="font-bold text-slate-100">Processo / Tema: </span>{juris.processo}</p>
        {juris.tese && <p><span className="font-bold text-slate-100">Tese Fixada: </span>{juris.tese}</p>}
        {juris.fonteOficial && (
          <p>
            <span className="font-bold text-slate-100">Fonte Oficial: </span>
            <SourceLink url={juris.fonteOficial} title={juris.fonteOficial} />
          </p>
        )}
      </div>
    );
  }

  if (nature === "AFIRMACAO_EMPIRICA") {
    const emp = (meta as unknown) as EmpiricalEvidenceMetadata | null;
    if (!emp) return null;
    return (
      <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3 space-y-1.5 text-xs">
        <p className="font-bold text-teal-200 uppercase tracking-wider text-[11px]">Metadados Empíricos e Amostragem</p>
        <p><span className="font-bold text-slate-100">Origem dos Dados: </span>{emp.origem}</p>
        {emp.metodologia && <p><span className="font-bold text-slate-100">Metodologia: </span>{emp.metodologia}</p>}
        {emp.periodo && <p><span className="font-bold text-slate-100">Período de Apuração: </span>{emp.periodo}</p>}
        {emp.amostra && <p><span className="font-bold text-slate-100">Amostragem: </span>{emp.amostra}</p>}
      </div>
    );
  }

  if (nature === "RECURSO_PEDAGOGICO") {
    const ped = (meta as unknown) as PedagogicalEvidenceMetadata | null;
    if (!ped) return null;
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1.5 text-xs">
        <p className="font-bold text-emerald-200 uppercase tracking-wider text-[11px]">Recurso Pedagógico / Didático</p>
        <p><span className="font-bold text-slate-100">Finalidade Didática: </span>{ped.justificativa}</p>
        <p><span className="font-bold text-slate-100">Compatibilidade Jurídica: </span>{ped.compatibilidadeJuridica}</p>
      </div>
    );
  }

  return null;
}

function EvidenceBlock({
  evidence,
  nature,
}: {
  evidence: LegalReviewEvidence;
  confirmed?: boolean;
  nature?: LegalClaimNature;
}) {
  const proof = evidenceMayBeShownAsProof(evidence);
  return (
    <div className="rounded-xl border border-white/10 px-3.5 py-3 text-sm text-slate-300 space-y-2 bg-slate-900/60">
      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-100">Evidência Oficial Consultada</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
          proof ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-white/10"
        }`}>
          {evidenceStatusLabel(evidence)}
        </span>
      </div>
      <p><span className="font-bold text-slate-100">Instituição: </span>{evidence.institution}</p>
      <p><span className="font-bold text-slate-100">Documento: </span>{proof ? <SourceLink url={evidence.url} title={evidence.title} /> : evidence.title}</p>
      <p><span className="font-bold text-slate-100">Tipo da Fonte: </span>{SOURCE_TYPE_LABEL[evidence.sourceType] || evidence.sourceType}</p>
      <p><span className="font-bold text-slate-100">Fonte Consultada: </span>{evidence.consulted ? "Sim" : "Não"}</p>
      {!proof && <p className="text-amber-200/90 text-xs">Esta URL não foi validada como fonte oficial homologada do Estado.</p>}
      {evidence.supportExplanation && <p className="text-slate-400 text-xs">{evidence.supportExplanation}</p>}

      {nature && (
        <SpecializedEvidenceBlock
          nature={nature}
          evidence={evidence}
          hasOfficialProof={proof}
        />
      )}
    </div>
  );
}

export function LegalReviewPanel({
  open,
  phase,
  stageLabel,
  error,
  notice,
  review,
  busy,
  onClose,
  onStart,
  onForce,
  onApprove,
  onReject,
  onEdit,
  onBack,
  onSaveCandidate,
  onReaudit,
  onResolveChange,
  onResolveQuestion,
  onResolveFinding,
  onCloseSupplement,
  testMode = false,
  sectionPreview = false,
  testDraft = "",
  onTestDraftChange,
  onEndTest,
  onRetryFetch,
  onRequestSupplement,
  conflict = false,
  onViewHistorical,
}: {
  open: boolean;
  phase: Phase;
  stageLabel: string;
  error: string | null;
  notice: { lastReviewDate: string } | null;
  review: LegalReviewView | null;
  busy: boolean;
  onClose: () => void;
  onStart: () => void;
  onForce: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onBack: () => void;
  onSaveCandidate: (markdown: string) => void;
  onReaudit: () => void;
  onResolveChange?: (params: {
    changeId: string;
    action: "APPLY" | "EDIT" | "REJECT";
    customText?: string;
    rejectionReason?: string;
    targetContext?: string;
  }) => Promise<void>;
  onResolveQuestion?: (params: {
    questionIndex: number;
    changeIds: string[];
    question: {
      text: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    };
  }) => Promise<void>;
  onResolveFinding?: (params: {
    findingKey?: string;
    pendingId?: string;
    changeId?: string;
    action: HumanFindingAction;
    justification: string;
    evidenceDeclaration?: FindingEvidenceDeclaration;
    divergenceNature?: string;
    correctionChangeId?: string;
    expurgationConfirmed?: boolean;
  }) => Promise<void>;
  onCloseSupplement?: (params: {
    overallJustification: string;
  }) => Promise<void>;
  testMode?: boolean;
  sectionPreview?: boolean;
  testDraft?: string;
  onTestDraftChange?: (value: string) => void;
  onEndTest?: () => void;
  onRetryFetch?: () => void;
  onRequestSupplement?: () => Promise<void>;
  conflict?: boolean;
  onViewHistorical?: () => void;
}) {
  const [view, setView] = useState<"side" | "diff">("side");
  const [draft, setDraft] = useState("");
  const [showApplied, setShowApplied] = useState(true);
  const [showConsultedSources, setShowConsultedSources] = useState(false);
  const [sourceSearchTerm, setSourceSearchTerm] = useState("");
  const [showAttemptsHistory, setShowAttemptsHistory] = useState(true);
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);
  const [editingActionType, setEditingActionType] = useState<"edit" | "reject" | null>(null);
  const [manualEditText, setManualEditText] = useState("");
  const [manualTargetContext, setManualTargetContext] = useState("");
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [coordQuestionDraft, setCoordQuestionDraft] = useState<{
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  } | null>(null);

  // Estados locais para Deliberação de Achados (Etapa 5F)
  const [deliberatingFindingKey, setDeliberatingFindingKey] = useState<string | null>(null);
  const [findingAction, setFindingAction] = useState<HumanFindingAction>("CONFIRMAR");
  const [findingJustification, setFindingJustification] = useState("");
  const [findingDeclaredSource, setFindingDeclaredSource] = useState("");
  const [findingDeclaredUrl, setFindingDeclaredUrl] = useState("");
  const [findingDeclaredExcerpt, setFindingDeclaredExcerpt] = useState("");
  const [findingDocumentaryVerified, setFindingDocumentaryVerified] = useState(false);
  const [findingBibliographicRef, setFindingBibliographicRef] = useState("");
  const [findingSemanticJustification, setFindingSemanticJustification] = useState("");
  const [findingExpurgationConfirmed, setFindingExpurgationConfirmed] = useState(false);
  const [findingDivergenceNature, setFindingDivergenceNature] = useState("");
  const [findingCorrectionChangeId, setFindingCorrectionChangeId] = useState("");
  const [expandedFindingHistoryKey, setExpandedFindingHistoryKey] = useState<string | null>(null);
  const [closureJustification, setClosureJustification] = useState("");
  const [isClosingSupplement, setIsClosingSupplement] = useState(false);


  useEffect(() => {
    if (phase !== "edit") return;
    setDraft(review?.reviewedMarkdown || "");
  }, [phase, review?.reviewedMarkdown]);

  const diff = useMemo(
    () => (review ? diffLines(review.originalContent, review.reviewedMarkdown) : []),
    [review]
  );

  const validationResults = review?.editorialIntegrity?.changeResults || [];

  const questionGroups = useMemo(() => {
    if (!review?.reviewedMarkdown || !review.changes) return [];
    const probIds = review.editorialIntegrity?.problematicChanges || [];
    return findQuestionCoordinationGroups(review.reviewedMarkdown, review.changes, probIds);
  }, [review?.reviewedMarkdown, review?.changes, review?.editorialIntegrity?.problematicChanges]);

  const pendingChanges = useMemo(() => {
    if (!review?.changes) return [];
    return review.changes.filter((c) => {
      const v = validationResults.find((r) => r.changeId === c.id);
      return !v || v.status !== "APPLIED" || v.resolutionState === "PENDING" || v.resolutionState === "BLOCKED";
    });
  }, [review?.changes, validationResults]);

  const appliedOrResolvedChanges = useMemo(() => {
    if (!review?.changes) return [];
    return review.changes.filter((c) => {
      const v = validationResults.find((r) => r.changeId === c.id);
      return v && (v.status === "APPLIED" || v.resolutionState === "APPLIED_AUTOMATICALLY" || v.resolutionState === "APPLIED_BY_CEO" || v.resolutionState === "EDITED_BY_CEO" || v.resolutionState === "REJECTED_BY_CEO");
    });
  }, [review?.changes, validationResults]);

  const changeStats = useMemo(() => {
    if (!review?.changes) return { proposed: 0, appliedInPreview: 0, approvedByCeo: 0, unverified: 0 };
    const proposed = review.changes.length;
    let appliedInPreview = 0;
    let approvedByCeo = 0;
    let unverified = 0;

    for (const change of review.changes) {
      const v = validationResults.find((r) => r.changeId === change.id);
      if (
        v?.status === "APPLIED" ||
        v?.resolutionState === "APPLIED_AUTOMATICALLY" ||
        v?.resolutionState === "APPLIED_BY_CEO" ||
        v?.resolutionState === "EDITED_BY_CEO"
      ) {
        appliedInPreview++;
      }
      if (v?.resolutionState === "APPLIED_BY_CEO" || v?.resolutionState === "EDITED_BY_CEO") {
        approvedByCeo++;
      }
      const isUnverified =
        (change.evidence || []).length === 0 ||
        change.confirmation === "NAO_CONFIRMADO" ||
        review.supplement?.findings?.some(
          (f) => (f.changeId === change.id || f.pendingId === `chg_${change.id}`) && f.status === "nao_verificada"
        );
      if (isUnverified) {
        unverified++;
      }
    }

    return { proposed, appliedInPreview, approvedByCeo, unverified };
  }, [review?.changes, validationResults, review?.supplement?.findings]);

  const supplementAttempts = useMemo(() => {
    if (!review?.supplement) return [];
    interface AttemptView {
      attemptId: string;
      status: string;
      durationMs?: number;
      tokensUsed?: number;
      costUsd?: number;
      note?: string;
      completedAt?: number;
      recovered?: boolean;
    }
    const list: AttemptView[] = [];
    const seen = new Set<string>();

    const rawHistory = (review.supplement as unknown as Record<string, unknown>).history;
    if (Array.isArray(rawHistory)) {
      for (const item of rawHistory) {
        const h = item as Record<string, unknown>;
        const id = String(h.attemptId || `att-${list.length}`);
        if (!seen.has(id)) {
          seen.add(id);
          list.push({
            attemptId: id,
            status: String(h.status || "inconclusive"),
            durationMs: typeof h.durationMs === "number" ? h.durationMs : undefined,
            tokensUsed: typeof h.tokensUsed === "number" ? h.tokensUsed : undefined,
            costUsd: typeof h.costEstimatedUsd === "number" ? h.costEstimatedUsd : undefined,
            note: String(h.finalNote || h.errorReason || ""),
            completedAt: typeof h.completedAt === "number" ? h.completedAt : undefined,
          });
        }
      }
    }

    const prev = (review.supplement as unknown as Record<string, unknown>).previousAttempt;
    if (prev && typeof prev === "object") {
      const p = prev as Record<string, unknown>;
      const id = String(p.attemptId || "att-1");
      if (!seen.has(id)) {
        seen.add(id);
        list.push({
          attemptId: id,
          status: String(p.status || "inconclusive"),
          durationMs: typeof p.durationMs === "number" ? p.durationMs : undefined,
          tokensUsed: typeof p.tokensUsed === "number" ? p.tokensUsed : undefined,
          costUsd: typeof p.costEstimatedUsd === "number" ? p.costEstimatedUsd : undefined,
          note: String(p.finalNote || ""),
          completedAt: typeof p.completedAt === "number" ? p.completedAt : undefined,
        });
      }
    }

    const currentId = review.supplement.attemptId || (review.supplement.attemptCount ? `att-${review.supplement.attemptCount}` : "att-2");
    if (!seen.has(currentId)) {
      seen.add(currentId);
      list.push({
        attemptId: currentId,
        status: review.supplement.status,
        durationMs: review.supplement.durationMs,
        tokensUsed: review.supplement.tokensUsed,
        costUsd: review.supplement.costEstimatedUsd,
        note: review.supplement.finalNote || String((review.supplement as unknown as Record<string, unknown>).recoveryReason || ""),
        completedAt: review.supplement.completedAt,
        recovered: currentId === "att-2" && (review.supplement.findings?.length || 0) > 0,
      });
    }

    return list.sort((a, b) => a.attemptId.localeCompare(b.attemptId));
  }, [review?.supplement]);

  const filteredConsultedSources = useMemo(() => {
    if (!review?.consultedSources) return [];
    if (!sourceSearchTerm.trim()) return review.consultedSources;
    const term = sourceSearchTerm.toLowerCase();
    return review.consultedSources.filter(
      (s) =>
        (s.institution && s.institution.toLowerCase().includes(term)) ||
        (s.title && s.title.toLowerCase().includes(term)) ||
        (s.url && s.url.toLowerCase().includes(term)) ||
        (s.snippet && s.snippet.toLowerCase().includes(term))
    );
  }, [review?.consultedSources, sourceSearchTerm]);

  const officialSourcesCount = useMemo(() => {
    if (!review?.consultedSources) return 0;
    return review.consultedSources.filter((s) => s.official).length;
  }, [review?.consultedSources]);

  const handleOpenEditChange = (change: LegalReviewChange) => {
    setEditingChangeId(change.id);
    setEditingActionType("edit");
    setManualEditText(change.revisedExcerpt || "");
    setManualTargetContext(change.originalExcerpt || "");
  };

  const handleOpenRejectChange = (change: LegalReviewChange) => {
    setEditingChangeId(change.id);
    setEditingActionType("reject");
    setRejectionReasonText("");
  };

  const handleCancelAction = () => {
    setEditingChangeId(null);
    setEditingActionType(null);
    setManualEditText("");
    setManualTargetContext("");
    setRejectionReasonText("");
  };

  const handleApplyProposed = async (changeId: string) => {
    if (!onResolveChange) return;
    await onResolveChange({ changeId, action: "APPLY" });
    handleCancelAction();
  };

  const handleConfirmManualEdit = async (changeId: string) => {
    if (!onResolveChange) return;
    await onResolveChange({
      changeId,
      action: "EDIT",
      customText: manualEditText,
      targetContext: manualTargetContext || undefined,
    });
    handleCancelAction();
  };

  const handleConfirmReject = async (changeId: string) => {
    if (!onResolveChange || !rejectionReasonText.trim()) return;
    await onResolveChange({
      changeId,
      action: "REJECT",
      rejectionReason: rejectionReasonText.trim(),
    });
    handleCancelAction();
  };

  const handleOpenEditQuestion = (group: CoordinatedQuestionGroup) => {
    setEditingQuestionIndex(group.questionIndex);
    setCoordQuestionDraft({
      text: group.text,
      options: [...group.options],
      correctIndex: group.correctIndex,
      explanation: group.explanation,
    });
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionIndex(null);
    setCoordQuestionDraft(null);
  };

  const handleSaveCoordinatedQuestion = async (group: CoordinatedQuestionGroup) => {
    if (!onResolveQuestion || !coordQuestionDraft) return;
    await onResolveQuestion({
      questionIndex: group.questionIndex,
      changeIds: group.changeIds,
      question: coordQuestionDraft,
    });
    handleCancelEditQuestion();
  };
  if (!open) return null;

  const summary = review?.summary;
  const testing = testMode || review?.testMode === true;
  const preview = sectionPreview || review?.previewOnly === true || typeof review?.blockIndex === "number";

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-brand-gold/30 rounded-[2rem] max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-left">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-gold">Auditoria jurídica com fontes oficiais</p>
            <h3 className="text-lg font-serif font-bold text-slate-100 mt-1">
              {phase === "confirm" && (testing ? "Teste do Revisor Jurídico" : "Revisão Jurídica com IA")}
              {phase === "running" && "Auditando conteúdo jurídico..."}
              {phase === "notice" && "Esta versão já foi revisada."}
              {phase === "result" && "Revisão Jurídica concluída"}
              {phase === "edit" && "Editar versão revisada"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer" aria-label="Fechar revisão">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <p className="text-sm text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3">{error}</p>
          )}

          {phase === "confirm" && testing && (
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p className="text-amber-100 bg-amber-500/10 border border-amber-500/40 rounded-2xl px-4 py-3 font-bold">MODO DE TESTE — este conteúdo não será publicado.</p>
              <p>O mesmo auditor das aulas vai pesquisar este material. Nada é gravado no catálogo dos alunos.</p>
              <textarea
                value={testDraft}
                onChange={(event) => onTestDraftChange?.(event.target.value)}
                className="w-full min-h-[40vh] bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-brand-gold/50 resize-y leading-relaxed"
              />
            </div>
          )}

          {phase === "confirm" && !testing && (
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              {conflict && review?.status === "pending_approval" ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                    <AlertTriangle size={16} />
                    <span>Revisão Histórica Disponível (Divergência de Catálogo)</span>
                  </div>
                  <p>
                    Existe uma revisão jurídica pendente de aprovação cujo snapshot difere do catálogo atual.
                    Para evitar custos com uma nova chamada à OpenAI, você pode visualizar os resultados e fontes da auditoria existente.
                  </p>
                </div>
              ) : (
                <>
                  <p>A OpenAI realizará uma auditoria jurídica desta parte e poderá consultar fontes oficiais para verificar legislação e jurisprudência.</p>
                  <p>{preview ? "Esta revisão é uma prévia da parte aberta. A aula publicada não será alterada." : "A aula publicada não será modificada até que você aprove a revisão."}</p>
                </>
              )}
            </div>
          )}

          {phase === "error" && (
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p className="text-slate-300">
                Não foi possível consultar a revisão jurídica desta aula. Nenhuma chamada foi enviada à OpenAI e nenhuma cobrança foi gerada.
              </p>
              <p className="text-xs text-slate-400">
                Você pode tentar recuperar o histórico novamente ou cancelar. O catálogo oficial dos alunos permanece inalterado.
              </p>
            </div>
          )}

          {phase === "running" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-200">{stageLabel}</p>
              <p className="text-xs text-slate-400">A aula publicada permanece intacta durante a auditoria. Não há percentual estimado.</p>
            </div>
          )}

          {phase === "notice" && notice && (
            <div className="space-y-2 text-sm text-slate-200">
              <p>Esta versão já foi revisada.</p>
              <p>Última revisão: {notice.lastReviewDate}</p>
              <p className="text-slate-400">A legislação pode ter mudado. Você pode pedir uma nova revisão.</p>
            </div>
          )}

          {phase === "result" && review && summary && (
            <div className="space-y-5">
              {conflict && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                    <AlertTriangle size={16} />
                    <span>Divergência com Catálogo — Visualização Histórica (Aprovação Bloqueada)</span>
                  </div>
                  <p>
                    O conteúdo do catálogo oficial difere do snapshot original desta auditoria. A visualização das pendências, fontes e resultados está disponível em modo histórico, mas a substituição da aula publicada está bloqueada para preservar a integridade do catálogo.
                  </p>
                </div>
              )}
              {testing && (
                <p className="text-amber-100 bg-amber-500/10 border border-amber-500/40 rounded-2xl px-4 py-3 font-bold">MODO DE TESTE — este conteúdo não será publicado.</p>
              )}
              {preview && !testing && (
                <p className="text-sky-100 bg-sky-500/10 border border-sky-500/30 rounded-2xl px-4 py-3 text-sm">
                  Prévia da parte {typeof review.blockIndex === "number" ? review.blockIndex + 1 : ""}. Dia {review.day} · Bloco {review.part + 1}. A aula publicada não foi alterada.
                </p>
              )}

              {/* Badges de Status Principais: Revisão e Complementação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 block uppercase font-bold tracking-wider">Status da Revisão Jurídica</span>
                    <span className="text-sm font-bold text-amber-200">
                      {review.status === "pending_approval"
                        ? "Pendente de Aprovação (pending_approval)"
                        : review.status === "approved"
                          ? "Aprovada (approved)"
                          : review.status === "rejected"
                            ? "Rejeitada (rejected)"
                            : review.status}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Aguardando CEO
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-white/10 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider">Status da Complementação (IA)</span>
                    <span className={`text-sm font-bold ${
                      review.supplement?.status === "inconclusive"
                        ? "text-amber-300"
                        : review.supplement?.status === "completed"
                          ? "text-emerald-300"
                          : "text-slate-200"
                    }`}>
                      {review.supplement?.status === "inconclusive"
                        ? "Inconclusiva (inconclusive)"
                        : review.supplement?.status === "completed"
                          ? "Concluída (completed)"
                          : review.supplement?.status === "running"
                            ? "Em andamento (running)"
                            : review.supplement?.status === "reserved"
                              ? "Aguardando fila (reserved)"
                              : review.supplement?.status || "Não executada"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/10">
                    {review.supplement?.attemptId || "att-2"} · {review.supplement?.findings?.length || 0} achados
                  </span>
                </div>
              </div>

              {/* Histórico Consolidado de Tentativas da Auditoria e da Complementação */}
              <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <Clock size={14} className="text-brand-gold" />
                    <span>Histórico de Tentativas ({supplementAttempts.length + 1} execuções registradas)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAttemptsHistory(!showAttemptsHistory)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showAttemptsHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {showAttemptsHistory && (
                  <div className="space-y-2 pt-1">
                    {/* Tentativa Principal da Auditoria */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-sky-300">
                          Revisão Principal · {review.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Concluída
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1">
                        <div><span className="text-slate-500">Modelo:</span> {review.model || "gpt-5.6-turbo"}</div>
                        <div><span className="text-slate-500">Alterações:</span> {review.changes?.length || 0}</div>
                        <div><span className="text-slate-500">Fontes:</span> {review.consultedSources?.length || 0}</div>
                        <div><span className="text-slate-500">Data:</span> {review.reviewDate}</div>
                      </div>
                    </div>

                    {/* Tentativas da Complementação */}
                    {supplementAttempts.map((att) => (
                      <div
                        key={att.attemptId}
                        className={`rounded-xl border p-3 text-xs space-y-1.5 ${
                          att.attemptId === "att-2"
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-white/5 bg-slate-900/40 text-slate-400"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono font-bold text-slate-200">
                            Complementação · {att.attemptId}
                            {att.recovered && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                Recuperada da OpenAI
                              </span>
                            )}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              att.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : att.status === "inconclusive"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-slate-800 text-slate-400 border border-white/10"
                            }`}
                          >
                            {att.status === "completed"
                              ? "Concluída"
                              : att.status === "inconclusive"
                                ? "Inconclusiva"
                                : att.status === "uncertain_interrupted"
                                  ? "Interrompida pré-chamada"
                                  : att.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-slate-500">Duração:</span>{" "}
                            <span className="text-slate-300 font-mono">
                              {typeof att.durationMs === "number" ? `${(att.durationMs / 1000).toFixed(1)}s` : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Tokens:</span>{" "}
                            <span className="text-slate-300 font-mono">
                              {typeof att.tokensUsed === "number" && att.tokensUsed > 0 ? att.tokensUsed.toLocaleString("pt-BR") : "0"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Custo:</span>{" "}
                            <span className="text-slate-300 font-mono">
                              {typeof att.costUsd === "number" && att.costUsd > 0 ? `US$ ${att.costUsd.toFixed(6)}` : "US$ 0,00"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Identificador:</span>{" "}
                            <span className="text-slate-300 font-mono">{att.attemptId}</span>
                          </div>
                        </div>

                        {att.note && (
                          <p className="text-[11px] text-slate-400 pt-0.5 italic">
                            {att.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {review.editorialIntegrity && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
                  <div className="p-3 rounded-xl border border-white/10 bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">1. Execução Técnica</span>
                    <span className="text-xs font-bold text-emerald-400">Concluída</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    review.editorialIntegrity.passed
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-rose-500/30 bg-rose-500/10"
                  }`}>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">2. Integridade Editorial</span>
                    <span className={`text-xs font-bold ${
                      review.editorialIntegrity.passed ? "text-emerald-300" : "text-rose-300"
                    }`}>
                      {review.editorialIntegrity.passed ? "Aprovada (100% no texto)" : "Incompleta / Divergente"}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    review.verificationLevel === "VERIFICADO_COM_FONTES"
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : review.verificationLevel === "VERIFICACAO_PARCIAL"
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-rose-500/30 bg-rose-500/10"
                  }`}>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">3. Verificação Jurídica</span>
                    <span className={`text-xs font-bold ${
                      review.verificationLevel === "VERIFICADO_COM_FONTES"
                        ? "text-emerald-300"
                        : review.verificationLevel === "VERIFICACAO_PARCIAL"
                          ? "text-amber-300"
                          : "text-rose-300"
                    }`}>
                      {review.verificationLevel === "VERIFICADO_COM_FONTES"
                        ? "Verificado com fontes"
                        : review.verificationLevel === "VERIFICACAO_PARCIAL"
                          ? "Verificação parcial"
                          : "Falha na verificação"}
                    </span>
                  </div>
                </div>
              )}

              {review.editorialIntegrity && !review.editorialIntegrity.passed && (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 space-y-2">
                  <h4 className="text-sm font-bold text-rose-200">
                    ⚠️ Integridade Editorial Incompleta — Aprovação Bloqueada
                  </h4>
                  <p className="text-xs text-rose-300 leading-relaxed">
                    Foram identificadas alterações propostas que não constam no Markdown revisado ou estão inconsistentes: <strong>{review.editorialIntegrity.problematicChanges.join(", ")}</strong>. A substituição da aula publicada está bloqueada para preservar o catálogo.
                  </p>
                </div>
              )}

              {/* Seção de Complementação Jurídica de Evidências */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers size={14} className="text-brand-gold" />
                      Complementação Jurídica de Evidências (Etapa Única)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {!review.supplement || review.supplement.status === "idle" || (review.supplement.attemptCount === 0 && review.supplement.status !== "pre_call_failure") ? (
                        <span className="text-emerald-400 font-semibold">Complementação disponível</span>
                      ) : review.supplement.status === "reserved" ? (
                        <span className="text-sky-400 font-semibold">Aguardando processamento...</span>
                      ) : review.supplement.status === "running" ? (
                        <span className="text-amber-400 font-semibold">Em execução...</span>
                      ) : review.supplement.status === "completed" ? (
                        <span className="text-emerald-300 font-semibold">Concluída (encerramento definitivo)</span>
                      ) : review.supplement.status === "inconclusive" ? (
                        <span className="text-amber-300 font-semibold">Inconclusiva (encerramento definitivo)</span>
                      ) : review.supplement.status === "pre_call_failure" ? (
                        <span className="text-rose-300 font-semibold">Falha pré-chamada (tentativa preservada — tente novamente)</span>
                      ) : review.supplement.status === "uncertain_interrupted" ? (
                        <span className="text-amber-400 font-semibold">Interrompida com incerteza (verificação do CEO necessária)</span>
                      ) : (
                        <span className="text-slate-400 font-semibold">Complementação já utilizada (bloqueada para repetição)</span>
                      )}
                      {" — "}
                      {!review.supplement || review.supplement.attemptCount === 0
                        ? review.supplement?.status === "pre_call_failure"
                          ? review.supplement.finalNote || "A falha ocorreu antes da chamada paga. A tentativa foi preservada."
                          : "Permite buscar comprovação oficial focada nas pendências sem reauditar a aula inteira."
                        : review.supplement.finalNote || "A etapa de complementação já foi exercida de forma única."}
                    </p>
                  </div>
                  {onRequestSupplement && (!review.supplement || review.supplement.attemptCount === 0 || review.supplement.status === "pre_call_failure") && review.supplement?.status !== "running" && review.supplement?.status !== "reserved" && !testing && (
                    <button
                      type="button"
                      onClick={() => { void onRequestSupplement(); }}
                      disabled={busy}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-gold text-xs font-bold border border-brand-gold/30 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      title="Executa etapa única e controlada de complementação das pendências jurídicas."
                    >
                      <Search size={13} />
                      Executar complementação
                    </button>
                  )}
                  {review.supplement && review.supplement.attemptCount >= 1 && (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-white/5 shrink-0">
                      Trava de execução única ativa
                    </span>
                  )}
                </div>

                {/* Achados detalhados da complementação */}
                {review.supplement?.findings && review.supplement.findings.length > 0 && (
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Achados da Complementação ({review.supplement.findings.length})
                      </h5>
                      <span className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/20">
                        ✓ Deliberação individual do CEO ativa (Etapa 5F)
                      </span>
                    </div>
                    {review.supplement.findings.some(f => f.status === "nao_verificada") && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 space-y-1">
                        <p className="font-bold text-amber-300">
                          ⚠️ Existem achados com status "Não verificada" na IA original
                        </p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Conforme a blindagem do Athena, o resultado da IA permanece imutável em supplement.findings. Deliberações humanas do CEO são registradas de forma independente com histórico e fundamentação obrigatória.
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {review.supplement.findings.map((f, idx) => {
                        const stableKey = getFindingStableKey(f);
                        const humanDecision = review.findingDecisions?.[stableKey];
                        const isDeliberating = deliberatingFindingKey === stableKey;
                        const isHistoryExpanded = expandedFindingHistoryKey === stableKey;

                        return (
                          <div key={`${f.pendingId}-${idx}`} className="rounded-xl border border-white/10 bg-slate-900/80 p-3.5 space-y-3 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold text-brand-gold">
                                  {f.changeId ? `Alteração ${f.changeId}` : f.pendingId}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  [{stableKey}]
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    f.status === "confirmada"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : f.status === "refutada"
                                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  }`}
                                  title="Classificação probatória original gerada pela IA (imutável)"
                                >
                                  IA: {f.status === "confirmada" ? "Confirmada" : f.status === "refutada" ? "Refutada" : "Não verificada"}
                                </span>

                                {/* Crachá da Deliberação Humana do CEO */}
                                {humanDecision ? (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                      humanDecision.state === "CONFIRMADO_PELO_CEO"
                                        ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                                        : humanDecision.state === "DIVERGENCIA_LEGITIMA"
                                          ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                          : humanDecision.state === "CORRECAO_NECESSARIA"
                                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                            : humanDecision.state === "NAO_COMPROVADO"
                                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                              : "bg-slate-800 text-slate-400 border-white/10"
                                    }`}
                                  >
                                    CEO: {humanDecision.state}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-white/5">
                                    CEO: Aguardando Deliberação
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-400">Afirmação analisada: </span>
                              <span className="text-slate-200 font-medium">"{f.statementAnalyzed}"</span>
                            </div>

                            {f.officialSourceConsulted && (
                              <div>
                                <span className="text-slate-400">Fonte consultada pela IA: </span>
                                <span className="text-slate-200">{f.officialSourceConsulted}</span>
                                {f.verifiableUrl && (
                                  <a
                                    href={f.verifiableUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-sky-400 hover:text-sky-300 underline inline-flex items-center gap-1"
                                  >
                                    Ver fonte
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            )}

                            {f.relevantExcerptOrBasis && (
                              <div className="font-mono text-[11px] bg-slate-950/80 border border-white/5 rounded-lg p-2 text-slate-300 whitespace-pre-wrap">
                                {f.relevantExcerptOrBasis}
                              </div>
                            )}

                            {f.objectiveJustification && (
                              <div className="text-slate-400 text-[11px]">
                                <strong>Justificativa da IA:</strong> {f.objectiveJustification}
                              </div>
                            )}

                            {/* Exibição detalhada da Deliberação Humana Existente */}
                            {humanDecision && (
                              <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-2.5 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sky-300 text-[11px] uppercase tracking-wide">
                                    Deliberação do CEO Registrada
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(humanDecision.decidedAt).toLocaleString("pt-BR")} ({humanDecision.decidedByEmail})
                                  </span>
                                </div>
                                <p className="text-slate-300">
                                  <strong>Fundamentação:</strong> {humanDecision.justification}
                                </p>
                                {humanDecision.divergenceNature && (
                                  <p className="text-purple-300">
                                    <strong>Corrente / Divergência:</strong> {humanDecision.divergenceNature}
                                  </p>
                                )}
                                {humanDecision.evidenceDeclaration && (
                                  <div className="space-y-0.5 text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-white/5">
                                    <p><strong>Evidência Declarada pelo CEO:</strong> {humanDecision.evidenceDeclaration.declaredSource}</p>
                                    {humanDecision.evidenceDeclaration.declaredUrl && (
                                      <p><strong>URL indicada:</strong> <SourceLink url={humanDecision.evidenceDeclaration.declaredUrl} title={humanDecision.evidenceDeclaration.declaredUrl} /></p>
                                    )}
                                    <p className="flex items-center gap-1.5">
                                      <strong>Status Probatório:</strong>
                                      {humanDecision.evidenceDeclaration.documentaryVerified ? (
                                        <span className="text-emerald-400 font-bold">✓ Evidência Documental Efetivamente Conferida</span>
                                      ) : (
                                        <span className="text-amber-400 font-medium">⚠️ Evidência Declarada pelo CEO (Sem Conferência Automática Presumida)</span>
                                      )}
                                    </p>
                                  </div>
                                )}
                                {humanDecision.history && humanDecision.history.length > 0 && (
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedFindingHistoryKey(isHistoryExpanded ? null : stableKey)}
                                      className="text-[10px] text-sky-400 hover:text-sky-300 underline flex items-center gap-1"
                                    >
                                      {isHistoryExpanded ? "Ocultar histórico de deliberações" : `Ver histórico imutável (${humanDecision.history.length})`}
                                    </button>
                                    {isHistoryExpanded && (
                                      <div className="mt-1.5 space-y-1.5 pl-2 border-l border-white/10 text-[10px] text-slate-400">
                                        {humanDecision.history.map((hist, hIdx) => (
                                          <div key={hIdx} className="space-y-0.5">
                                            <p className="font-mono text-slate-300">
                                              #{hIdx + 1} — {hist.state} ({new Date(hist.decidedAt).toLocaleString("pt-BR")})
                                            </p>
                                            <p>Justificativa: {hist.justification}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Botão de Abertura do Formulário de Deliberação */}
                            {!isDeliberating ? (
                              <div className="pt-1 flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeliberatingFindingKey(stableKey);
                                    setFindingAction(humanDecision?.action || "CONFIRMAR");
                                    setFindingJustification(humanDecision?.justification || "");
                                    setFindingDeclaredSource(humanDecision?.evidenceDeclaration?.declaredSource || "");
                                    setFindingDeclaredUrl(humanDecision?.evidenceDeclaration?.declaredUrl || "");
                                    setFindingDeclaredExcerpt(humanDecision?.evidenceDeclaration?.declaredExcerpt || "");
                                    setFindingDocumentaryVerified(humanDecision?.evidenceDeclaration?.documentaryVerified || false);
                                    setFindingBibliographicRef(humanDecision?.evidenceDeclaration?.bibliographicReference || "");
                                    setFindingSemanticJustification(humanDecision?.evidenceDeclaration?.semanticJustification || "");
                                    setFindingExpurgationConfirmed(humanDecision?.expurgationConfirmed || false);
                                    setFindingDivergenceNature(humanDecision?.divergenceNature || "");
                                    setFindingCorrectionChangeId(humanDecision?.correctionChangeId || f.changeId || "");
                                  }}
                                  disabled={busy}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                                >
                                  <Edit3 size={12} />
                                  {humanDecision ? "Reavaliar Deliberação" : "Deliberar sobre Achado"}
                                </button>
                              </div>
                            ) : (
                              /* Formulário Inline de Deliberação do CEO */
                              <div className="rounded-xl border border-sky-500/40 bg-slate-950 p-3.5 space-y-3 mt-2">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                  <h6 className="font-bold text-sky-300 text-xs uppercase tracking-wide">
                                    Deliberação Individual do CEO — {stableKey}
                                  </h6>
                                  <button
                                    type="button"
                                    onClick={() => setDeliberatingFindingKey(null)}
                                    className="text-slate-400 hover:text-slate-200"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-300">Ação Jurídica:</label>
                                  <select
                                    value={findingAction}
                                    onChange={(e) => setFindingAction(e.target.value as HumanFindingAction)}
                                    className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                                  >
                                    <option value="CONFIRMAR">Confirmar com Evidência (CONFIRMADO_PELO_CEO)</option>
                                    <option value="DECLARAR_DIVERGENCIA">Declarar Divergência Legítima (DIVERGENCIA_LEGITIMA)</option>
                                    <option value="APONTAR_CORRECAO">Apontar Necessidade de Correção (CORRECAO_NECESSARIA)</option>
                                    <option value="DECLARAR_NAO_COMPROVADO">Declarar Não Comprovado (NAO_COMPROVADO)</option>
                                    <option value="MANTER_PENDENTE">Manter Pendente (PENDENTE)</option>
                                  </select>
                                </div>

                                {findingAction === "CONFIRMAR" && (
                                  <div className="space-y-2 p-2.5 rounded-lg bg-sky-950/20 border border-sky-500/20">
                                    <div>
                                      <label className="text-[11px] font-bold text-slate-300">Fonte Oficial / Dispositivo Comprobatório (Obrigatório):</label>
                                      <input
                                        type="text"
                                        value={findingDeclaredSource}
                                        onChange={(e) => setFindingDeclaredSource(e.target.value)}
                                        placeholder="Ex: CF/88 art. 5º, STF Tema 1234, Lei 8.666 art. 2º"
                                        className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[11px] text-slate-400">URL Oficial (Opcional):</label>
                                      <input
                                        type="text"
                                        value={findingDeclaredUrl}
                                        onChange={(e) => setFindingDeclaredUrl(e.target.value)}
                                        placeholder="https://www.planalto.gov.br/..."
                                        className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[11px] font-bold text-slate-300">Referência Bibliográfica / Obra Doutrinária:</label>
                                      <input
                                        type="text"
                                        value={findingBibliographicRef}
                                        onChange={(e) => setFindingBibliographicRef(e.target.value)}
                                        placeholder="Ex: MEIRELLES, Hely Lopes. Direito Administrativo Brasileiro, 42ª ed., Malheiros, p. 89"
                                        className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[11px] text-slate-400">Justificativa Semântica / Correspondência (Opcional):</label>
                                      <input
                                        type="text"
                                        value={findingSemanticJustification}
                                        onChange={(e) => setFindingSemanticJustification(e.target.value)}
                                        placeholder="Explique como a fonte citada dá suporte pontual ao trecho em análise"
                                        className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 mt-1"
                                      />
                                    </div>
                                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-1">
                                      <input
                                        type="checkbox"
                                        checked={findingDocumentaryVerified}
                                        onChange={(e) => setFindingDocumentaryVerified(e.target.checked)}
                                        className="rounded border-white/20 bg-slate-900"
                                      />
                                      <span>Confirmo que verifiquei documentalmente o texto oficial desta fonte (não apenas presumi)</span>
                                    </label>
                                  </div>
                                )}

                                {findingAction === "DECLARAR_DIVERGENCIA" && (
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-300">Corrente Doutrinária ou Jurisprudencial (Obrigatório):</label>
                                    <input
                                      type="text"
                                      value={findingDivergenceNature}
                                      onChange={(e) => setFindingDivergenceNature(e.target.value)}
                                      placeholder="Ex: Corrente majoritária sustentada por Nelson Nery Jr. e STJ Resp 12345"
                                      className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                                    />
                                  </div>
                                )}

                                {findingAction === "APONTAR_CORRECAO" && (
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-300">Identificador da Alteração a Corrigir:</label>
                                    <input
                                      type="text"
                                      value={findingCorrectionChangeId}
                                      onChange={(e) => setFindingCorrectionChangeId(e.target.value)}
                                      placeholder="Ex: CHG-001 ou código da alteração"
                                      className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                                    />
                                  </div>
                                )}

                                {findingAction === "DECLARAR_NAO_COMPROVADO" && (
                                  <div className="space-y-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20">
                                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={findingExpurgationConfirmed}
                                        onChange={(e) => setFindingExpurgationConfirmed(e.target.checked)}
                                        className="rounded border-white/20 bg-slate-900"
                                      />
                                      <span className="font-semibold text-rose-300">
                                        Confirmo a retirada (expurgo) da afirmação não comprovada do texto da aula (expurgationConfirmed)
                                      </span>
                                    </label>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-300">
                                    Fundamentação Obrigatória do CEO (mínimo 10 caracteres):
                                  </label>
                                  <textarea
                                    value={findingJustification}
                                    onChange={(e) => setFindingJustification(e.target.value)}
                                    placeholder="Explicite as razões jurídicas da sua deliberação..."
                                    rows={3}
                                    className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                                  />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => setDeliberatingFindingKey(null)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy || (findingAction !== "MANTER_PENDENTE" && findingJustification.trim().length < 10)}
                                    onClick={async () => {
                                      if (!onResolveFinding) return;
                                      await onResolveFinding({
                                        findingKey: stableKey,
                                        pendingId: f.pendingId,
                                        changeId: f.changeId,
                                        action: findingAction,
                                        justification: findingJustification,
                                        evidenceDeclaration: findingAction === "CONFIRMAR" ? {
                                          declaredSource: findingDeclaredSource,
                                          declaredUrl: findingDeclaredUrl || undefined,
                                          declaredExcerpt: findingDeclaredExcerpt || undefined,
                                          bibliographicReference: findingBibliographicRef || undefined,
                                          semanticJustification: findingSemanticJustification || undefined,
                                          documentaryVerified: findingDocumentaryVerified,
                                        } : undefined,
                                        expurgationConfirmed: findingAction === "DECLARAR_NAO_COMPROVADO" ? findingExpurgationConfirmed : undefined,
                                        divergenceNature: findingAction === "DECLARAR_DIVERGENCIA" ? findingDivergenceNature : undefined,
                                        correctionChangeId: findingAction === "APONTAR_CORRECAO" ? findingCorrectionChangeId : undefined,
                                      });
                                      setDeliberatingFindingKey(null);
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg bg-brand-gold text-slate-950 text-xs font-bold hover:bg-amber-400 disabled:opacity-50"
                                  >
                                    Salvar Deliberação
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Estágio B: Encerramento Administrativo da Complementação Jurídica */}
                {review.supplement && (
                  <div className="rounded-2xl border border-sky-500/30 bg-slate-950/70 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-sky-400" />
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                          Estágio B: Encerramento da Complementação Jurídica
                        </h5>
                      </div>
                      {review.supplement.resolution ? (
                        review.supplement.resolution.candidateHashAtClosure === review.candidateHash ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ Encerrado pelo CEO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ⚠️ Invalidado por Edição Posterior
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Pendente de Encerramento
                        </span>
                      )}
                    </div>

                    {review.supplement.resolution && review.supplement.resolution.candidateHashAtClosure === review.candidateHash ? (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                          <span>
                            Encerrado em: <strong>{new Date(review.supplement.resolution.closedAt).toLocaleString("pt-BR")}</strong>
                          </span>
                          <span>
                            Por: <strong>{review.supplement.resolution.closedByEmail}</strong>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            Hash: {review.supplement.resolution.candidateHashAtClosure.slice(0, 12)}...
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-200 italic">
                          "{review.supplement.resolution.overallJustification}"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {review.supplement.resolution && review.supplement.resolution.candidateHashAtClosure !== review.candidateHash && (
                          <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3 text-xs text-rose-200">
                            <p className="font-bold text-rose-300">
                              ⚠️ O encerramento anterior foi invalidado porque o texto da aula foi editado após o ato do CEO!
                            </p>
                            <p className="text-[11px] text-slate-300 mt-1">
                              Hash no encerramento: <span className="font-mono">{review.supplement.resolution.candidateHashAtClosure}</span> | Hash atual: <span className="font-mono">{review.candidateHash}</span>
                              <br />
                              Conforme a blindagem estrita do Athena, é necessário realizar um novo ato expresso de encerramento.
                            </p>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-300">
                            Justificativa Global de Encerramento do CEO (mínimo 15 caracteres):
                          </label>
                          <textarea
                            value={closureJustification}
                            onChange={(e) => setClosureJustification(e.target.value)}
                            placeholder="Descreva a fundamentação global para o encerramento formal da complementação jurídica..."
                            rows={2}
                            className="w-full bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                          />
                        </div>

                        {(() => {
                          const closureCheck = review.supplement ? validateFindingsForClosure(review) : { ok: true, failureReasons: [] };
                          const isBlocked = busy || isClosingSupplement || closureJustification.trim().length < 15 || !onCloseSupplement || !closureCheck.ok;

                          return (
                            <>
                              {!closureCheck.ok && (
                                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
                                  <p className="font-semibold mb-1">Pendências nos achados individuais (Estágio A):</p>
                                  <ul className="list-disc list-inside space-y-0.5 text-amber-300/90">
                                    {closureCheck.failureReasons.map((r, i) => (
                                      <li key={i}>{r}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  disabled={isBlocked}
                                  title={
                                    !closureCheck.ok
                                      ? `Encerramento bloqueado: pendências nos achados:\n- ${closureCheck.failureReasons.join("\n- ")}`
                                      : closureJustification.trim().length < 15
                                        ? "A justificativa global do CEO deve conter ao menos 15 caracteres."
                                        : "Encerrar formalmente a complementação jurídica (Estágio B)"
                                  }
                                  onClick={async () => {
                                    if (!onCloseSupplement) return;
                                    setIsClosingSupplement(true);
                                    try {
                                      await onCloseSupplement({ overallJustification: closureJustification.trim() });
                                      setClosureJustification("");
                                    } finally {
                                      setIsClosingSupplement(false);
                                    }
                                  }}
                                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Lock size={12} />
                                  Encerrar Complementação Jurídica (Estágio B)
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-200">{verificationCopy(review)}</p>
              {review.manuallyEdited && (
                <p className="text-sm text-amber-100 bg-amber-500/10 border border-amber-500/40 rounded-2xl px-4 py-3">
                  ⚠️ Esta versão foi editada após a auditoria jurídica. As fontes abaixo correspondem à revisão anterior.
                </p>
              )}
              <p className="text-sm font-semibold text-slate-100">{summary.totalChanges} alterações identificadas</p>
              <ul className="text-sm text-slate-200 space-y-1">
                <li>Correções jurídicas: {summary.corrections}</li>
                <li>Atualizações: {summary.updates}</li>
                <li>Complementações: {summary.additions}</li>
                <li>Remoções: {summary.removals}</li>
                <li>Precisões: {summary.precisions}</li>
                <li>Reestruturações: {summary.restructures}</li>
              </ul>
              {review.reviewNotes && <p className="text-sm text-slate-300 whitespace-pre-wrap">{review.reviewNotes}</p>}

              <div className="flex gap-2">
                <button type="button" onClick={() => setView("side")} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${view === "side" ? "bg-brand-gold text-slate-950 border-brand-gold" : "bg-slate-800 text-slate-200 border-white/10"}`}>Lado a lado</button>
                <button type="button" onClick={() => setView("diff")} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${view === "diff" ? "bg-brand-gold text-slate-950 border-brand-gold" : "bg-slate-800 text-slate-200 border-white/10"}`}>Alterações</button>
              </div>

              {view === "side" ? (
                <div className="grid md:grid-cols-2 gap-3">
                  <section className="rounded-2xl border border-white/10 p-3 bg-slate-950/60 min-h-40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Original</h4>
                    <p className="text-[11px] text-slate-500 mb-2">{testing ? "material enviado ao teste" : "versão atualmente publicada"}</p>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-200"><ReactMarkdown>{review.originalContent}</ReactMarkdown></div>
                  </section>
                  <section className="rounded-2xl border border-emerald-500/20 p-3 bg-slate-950/60 min-h-40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">Revisado</h4>
                    <p className="text-[11px] text-slate-500 mb-2">versão candidata produzida pela OpenAI</p>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-200"><ReactMarkdown>{review.reviewedMarkdown}</ReactMarkdown></div>
                  </section>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 font-mono text-xs leading-relaxed space-y-1">
                  {diff.map((line, index) => (
                    <p
                      key={`${line.kind}-${index}`}
                      className={
                        line.kind === "add"
                          ? "bg-emerald-500/15 text-emerald-100 px-2 py-0.5 rounded"
                          : line.kind === "remove"
                            ? "bg-rose-500/15 text-rose-100 px-2 py-0.5 rounded"
                            : "text-slate-500 px-2"
                      }
                    >
                      <span className="mr-2 text-[10px] uppercase">
                        {line.kind === "add" ? "acrescentado" : line.kind === "remove" ? "removido" : "igual"}
                      </span>
                      {line.text || " "}
                    </p>
                  ))}
                </div>
              )}

              {/* Seção 1: Pendências para revisão humana */}
              {pendingChanges.length > 0 && (
                <section className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-amber-200 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-400" />
                        Pendências para revisão humana ({pendingChanges.length})
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Resolva as alterações problemáticas individualmente ou na coordenação de questões. Cada pendência pode ser aplicada, editada ou rejeitada com justificativa.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {pendingChanges.map((change) => {
                      const validation = validationResults.find((r) => r.changeId === change.id);
                      const isEditing = editingChangeId === change.id;
                      const isAmbiguous = validation?.status === "AMBIGUOUS";
                      const partOfQuestion = questionGroups.find((g) => g.changeIds.includes(change.id));

                        const isLegacy = !change.nature && !change.outcome;
                        const effectiveNature = change.nature || inferNatureFromLegacyCategory(change.category);
                        const effectiveOutcome = change.outcome || (change.confirmation === "CONFIRMADO" && change.verified ? "CONFIRMADA" : "NAO_VERIFICADA");

                        return (
                          <article key={change.id} className="rounded-2xl border border-white/10 p-4 space-y-3 bg-slate-950/70">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg border border-brand-gold/30">
                                  {change.id}
                                </span>
                                <span className="text-xs font-bold text-slate-200">
                                  {TYPE_LABEL[change.type]} — {SEVERITY_LABEL[change.severity]}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                                validation?.resolutionState === "BLOCKED"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}>
                                {validation?.resolutionState === "BLOCKED"
                                  ? "⛔ Bloqueada (ambígua / conflito)"
                                  : "⏳ Pendente de decisão"}
                              </span>
                            </div>

                            {/* Badges de Taxonomia Jurídica (Etapa 5E) */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {effectiveNature && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-500/30">
                                  Natureza: {CLAIM_NATURE_LABEL[effectiveNature] || effectiveNature}
                                  {isLegacy && " (inferida)"}
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                CLAIM_OUTCOME_BADGE_STYLE[effectiveOutcome] || "bg-slate-800 text-slate-300 border-white/10"
                              }`}>
                                Resultado: {CLAIM_OUTCOME_LABEL[effectiveOutcome] || effectiveOutcome}
                                {isLegacy && " (inferido)"}
                              </span>
                              {isLegacy && (
                                <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/5" title="Registro histórico anterior à Etapa 5B">
                                  Legado
                                </span>
                              )}
                            </div>

                          {validation && (
                            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-2 font-medium">
                              <strong>Motivo da inconsistência:</strong> {validation.detail}
                            </div>
                          )}

                          {partOfQuestion && (
                            <div className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                              <Layers size={14} />
                              <span>Esta alteração afeta a <strong>Questão {partOfQuestion.questionIndex + 1} ({partOfQuestion.questionId})</strong>. Recomendado coordenar na seção de questões abaixo.</span>
                            </div>
                          )}

                          {change.originalExcerpt && (
                            <div className="text-xs space-y-1">
                              <p className="font-bold text-slate-300">Trecho original:</p>
                              <p className="font-mono text-slate-200 bg-slate-900 border border-white/5 rounded-xl p-2.5 whitespace-pre-wrap">{change.originalExcerpt}</p>
                              {change.beforeContext && (
                                <p className="text-[11px] text-slate-400 font-mono">Contexto anterior: "{change.beforeContext}"</p>
                              )}
                              {change.afterContext && (
                                <p className="text-[11px] text-slate-400 font-mono">Contexto posterior: "{change.afterContext}"</p>
                              )}
                            </div>
                          )}

                          <div className="text-xs space-y-1">
                            <p className="font-bold text-emerald-300">Correção proposta pela IA:</p>
                            <p className="font-mono text-emerald-100 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-2.5 whitespace-pre-wrap">
                              {change.revisedExcerpt || "(Remoção determinada sem texto substituto)"}
                            </p>
                          </div>

                          <div className="text-xs space-y-1">
                            <p className="font-bold text-slate-300">Trecho atualmente presente na aula revisada:</p>
                            <p className="font-mono text-amber-200/90 bg-slate-900 border border-white/5 rounded-xl p-2.5 whitespace-pre-wrap">
                              {validation?.currentReviewedExcerpt || "Não localizado"}
                            </p>
                          </div>

                          <div className="text-xs space-y-1">
                            <p className="font-bold text-slate-300">Justificativa jurídica:</p>
                            <p className="text-slate-300 leading-relaxed">{change.reason}</p>
                          </div>

                          {(change.evidence || []).map((evidence) => (
                            <EvidenceBlock
                              key={`${change.id}-${evidence.url}-${evidence.sourceType}`}
                              evidence={evidence}
                              confirmed={change.confirmation === "CONFIRMADO"}
                              nature={effectiveNature}
                            />
                          ))}

                          {/* Botões de Ação */}
                          {!isEditing && onResolveChange && (
                            <div className="pt-2 flex flex-wrap gap-2 border-t border-white/10">
                              <button
                                type="button"
                                onClick={() => handleApplyProposed(change.id)}
                                disabled={busy || isAmbiguous}
                                title={isAmbiguous ? "O trecho possui múltiplas ocorrências. Use 'Editar manualmente' para desambiguar." : "Aplicar alteração proposta"}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                  isAmbiguous || busy
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                }`}
                              >
                                <Check size={14} /> A — Aplicar correção proposta
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditChange(change)}
                                disabled={busy}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit3 size={14} /> B — Editar manualmente
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenRejectChange(change)}
                                disabled={busy}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 size={14} /> C — Rejeitar alteração
                              </button>
                            </div>
                          )}

                          {/* Formulário de Edição Manual */}
                          {isEditing && editingActionType === "edit" && (
                            <div className="pt-3 border-t border-white/10 space-y-3 bg-slate-900/80 p-3.5 rounded-xl border border-sky-500/30">
                              <div className="flex items-center justify-between">
                                <h6 className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                                  <Edit3 size={14} /> B — Editar manualmente alteração {change.id}
                                </h6>
                                <button type="button" onClick={handleCancelAction} className="text-slate-400 hover:text-white text-xs">Cancelar</button>
                              </div>

                              {isAmbiguous && (
                                <div className="text-xs space-y-1">
                                  <label className="text-[11px] font-bold text-amber-200">Trecho de destino com contexto (para desambiguar):</label>
                                  <textarea
                                    value={manualTargetContext}
                                    onChange={(e) => setManualTargetContext(e.target.value)}
                                    placeholder="Cole o trecho com linhas anteriores/posteriores para localizar a ocorrência exata..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-slate-200 min-h-16"
                                  />
                                </div>
                              )}

                              <div className="text-xs space-y-1">
                                <label className="text-[11px] font-bold text-slate-300">Novo texto substituto a aplicar:</label>
                                <textarea
                                  value={manualEditText}
                                  onChange={(e) => setManualEditText(e.target.value)}
                                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-emerald-200 min-h-20"
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={handleCancelAction} className="px-3 py-1.5 rounded-xl text-xs bg-slate-800 text-slate-300">Cancelar</button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmManualEdit(change.id)}
                                  disabled={busy}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
                                >
                                  Salvar e Aplicar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Formulário de Rejeição */}
                          {isEditing && editingActionType === "reject" && (
                            <div className="pt-3 border-t border-white/10 space-y-3 bg-rose-950/20 p-3.5 rounded-xl border border-rose-500/30">
                              <div className="flex items-center justify-between">
                                <h6 className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                                  <Trash2 size={14} /> C — Rejeitar alteração {change.id}
                                </h6>
                                <button type="button" onClick={handleCancelAction} className="text-slate-400 hover:text-white text-xs">Cancelar</button>
                              </div>

                              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                                A alteração rejeitada é registrada com justificativa e <strong>não conta como correção jurídica confirmada</strong>, mas resolve a pendência de integridade permitindo prosseguir com a aula.
                              </p>

                              <div className="text-xs space-y-1">
                                <label className="text-[11px] font-bold text-slate-200">Justificativa jurídica obrigatória da rejeição:</label>
                                <textarea
                                  value={rejectionReasonText}
                                  onChange={(e) => setRejectionReasonText(e.target.value)}
                                  placeholder="Descreva o motivo pelo qual esta alteração não deve ser incorporada à aula..."
                                  className="w-full bg-slate-950 border border-rose-500/30 rounded-xl p-2.5 text-xs text-slate-200 min-h-16"
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={handleCancelAction} className="px-3 py-1.5 rounded-xl text-xs bg-slate-800 text-slate-300">Cancelar</button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmReject(change.id)}
                                  disabled={busy || !rejectionReasonText.trim()}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                                    !rejectionReasonText.trim() || busy
                                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                      : "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                                  }`}
                                >
                                  Confirmar Rejeição
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Seção 2: Coordenação de Questões do Desafio */}
              {questionGroups.length > 0 && (
                <section className="space-y-4 rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 border-b border-sky-500/20 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-sky-200 flex items-center gap-2">
                        <Layers size={18} className="text-sky-400" />
                        Coordenação de Questões do Desafio ({questionGroups.length})
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Questões que concentram múltiplas alterações correlatas. Edite o enunciado, alternativas e explicação conjuntamente para prevenir estados contraditórios.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {questionGroups.map((group) => {
                      const isEditingQ = editingQuestionIndex === group.questionIndex;

                      return (
                        <article key={group.questionId} className="rounded-2xl border border-white/10 p-4 space-y-3 bg-slate-950/70">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-sky-400 bg-sky-400/10 px-2.5 py-1 rounded-lg border border-sky-400/30">
                                Questão {group.questionIndex + 1} ({group.questionId})
                              </span>
                              <span className="text-xs font-bold text-slate-300">
                                Disciplina: {group.subject}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <span>Alterações vinculadas:</span>
                              {group.changeIds.map((cid) => (
                                <span key={cid} className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                                  group.pendingChangeIds.includes(cid)
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`}>
                                  {cid}
                                </span>
                              ))}
                            </div>
                          </div>

                          {!isEditingQ && (
                            <div className="space-y-3 text-xs">
                              <div>
                                <p className="font-bold text-slate-300 mb-1">Enunciado:</p>
                                <p className="text-slate-200 bg-slate-900 border border-white/5 rounded-xl p-3 leading-relaxed">{group.text}</p>
                              </div>

                              <div>
                                <p className="font-bold text-slate-300 mb-1">Alternativas:</p>
                                <div className="space-y-1.5">
                                  {group.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                                        oIdx === group.correctIndex
                                          ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200 font-medium"
                                          : "bg-slate-900 border-white/5 text-slate-300"
                                      }`}
                                    >
                                      {opt} {oIdx === group.correctIndex && <span className="ml-2 text-[10px] uppercase font-bold text-emerald-400 font-mono">Gabarito</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="font-bold text-slate-300 mb-1">Explicação / Justificativa:</p>
                                <p className="text-slate-300 bg-slate-900 border border-white/5 rounded-xl p-3 leading-relaxed">{group.explanation}</p>
                              </div>

                              {onResolveQuestion && (
                                <div className="pt-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditQuestion(group)}
                                    disabled={busy}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Edit3 size={14} /> Editar Questão em Conjunto
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {isEditingQ && coordQuestionDraft && (
                            <div className="space-y-3 text-xs pt-2 border-t border-white/10">
                              <div>
                                <label className="font-bold text-slate-200 mb-1 block">Enunciado:</label>
                                <textarea
                                  value={coordQuestionDraft.text}
                                  onChange={(e) => setCoordQuestionDraft({ ...coordQuestionDraft, text: e.target.value })}
                                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-slate-200 min-h-20"
                                />
                              </div>

                              <div>
                                <label className="font-bold text-slate-200 mb-1 block">Alternativas (selecione o gabarito):</label>
                                <div className="space-y-2">
                                  {coordQuestionDraft.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setCoordQuestionDraft({ ...coordQuestionDraft, correctIndex: oIdx })}
                                        className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                                          coordQuestionDraft.correctIndex === oIdx
                                            ? "bg-emerald-500 text-slate-950 font-black"
                                            : "bg-slate-800 text-slate-400"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + oIdx)}
                                      </button>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const nextOpts = [...coordQuestionDraft.options];
                                          nextOpts[oIdx] = e.target.value;
                                          setCoordQuestionDraft({ ...coordQuestionDraft, options: nextOpts });
                                        }}
                                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="font-bold text-slate-200 mb-1 block">Explicação:</label>
                                <textarea
                                  value={coordQuestionDraft.explanation}
                                  onChange={(e) => setCoordQuestionDraft({ ...coordQuestionDraft, explanation: e.target.value })}
                                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-slate-200 min-h-24"
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={handleCancelEditQuestion} className="px-3.5 py-1.5 rounded-xl text-xs bg-slate-800 text-slate-300">Cancelar</button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveCoordinatedQuestion(group)}
                                  disabled={busy}
                                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                >
                                  Salvar e Coordenar Alterações
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Seção 3: Alterações Jurídicas (13 Alterações) */}
              {appliedOrResolvedChanges.length > 0 && (
                <section className="space-y-3 pt-2">
                  {/* Barra de Diferenciação das 13 Alterações */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-950/60 border border-white/10 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Propostas pela IA</span>
                      <span className="text-sm font-bold text-brand-gold font-mono">{changeStats.proposed} alterações</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">2. Na Pré-visualização</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{changeStats.appliedInPreview} aplicadas</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">3. Aprovadas pelo CEO</span>
                      <span className="text-sm font-bold text-sky-400 font-mono">{changeStats.approvedByCeo} deliberadas</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">4. Sem Fonte Oficial</span>
                      <span className="text-sm font-bold text-amber-400 font-mono">{changeStats.unverified} pendentes</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowApplied(!showApplied)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-white/10 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-400" />
                      Alterações propostas e aplicadas na pré-visualização ({appliedOrResolvedChanges.length})
                    </span>
                    {showApplied ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showApplied && (
                    <div className="space-y-3 pl-2">
                      {appliedOrResolvedChanges.map((change) => {
                        const validation = validationResults.find((r) => r.changeId === change.id);
                        const isRejected = validation?.resolutionState === "REJECTED_BY_CEO";
                        const isAppliedByCeo = validation?.resolutionState === "APPLIED_BY_CEO";
                        const isEditedByCeo = validation?.resolutionState === "EDITED_BY_CEO";
                        const isAppliedInPreview = validation?.status === "APPLIED" || validation?.resolutionState === "APPLIED_AUTOMATICALLY" || isAppliedByCeo || isEditedByCeo;

                        const relatedFinding = review.supplement?.findings?.find(
                          (f) => f.changeId === change.id || f.pendingId === `chg_${change.id}`
                        );
                        const hasOfficialEvidence = (change.evidence || []).some((e) => e.official && e.supportsChange && e.consulted);
                        const isUnverified = !hasOfficialEvidence || relatedFinding?.status === "nao_verificada" || change.confirmation === "NAO_CONFIRMADO";

                        const isLegacy = !change.nature && !change.outcome;
                        const effectiveNature = change.nature || inferNatureFromLegacyCategory(change.category);
                        const effectiveOutcome = change.outcome || (change.confirmation === "CONFIRMADO" && change.verified ? "CONFIRMADA" : "NAO_VERIFICADA");

                        return (
                          <article key={change.id} className="rounded-2xl border border-white/10 p-4 space-y-3 bg-slate-950/40">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                              <h5 className="text-xs font-black uppercase tracking-wider text-brand-gold">
                                {change.id} — {TYPE_LABEL[change.type]} — {SEVERITY_LABEL[change.severity]}
                              </h5>

                              {/* 4 Badges de Diferenciação Clara */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {/* 1. Proposta pela IA */}
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10 uppercase" title="Alteração formulada pelo modelo de IA na auditoria inicial">
                                  Proposta IA
                                </span>

                                {/* 2. Efetivamente aplicada no texto de pré-visualização */}
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                  isAppliedInPreview
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`} title={isAppliedInPreview ? "Alteração inserida e ativa no texto revisado (prévia)" : "Alteração ausente no texto revisado"}>
                                  {isAppliedInPreview ? "✓ Aplicada na prévia" : "Ausente na prévia"}
                                </span>

                                {/* 3. Deliberação do CEO */}
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                  isRejected
                                    ? "bg-slate-800 text-slate-300 border border-white/10"
                                    : isAppliedByCeo || isEditedByCeo
                                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                      : "bg-slate-900 text-slate-400 border border-white/5"
                                }`}>
                                  {isRejected
                                    ? "⊘ Rejeitada pelo CEO"
                                    : isAppliedByCeo
                                      ? "✓ Aprovada pelo CEO"
                                      : isEditedByCeo
                                        ? "✓ Editada pelo CEO"
                                        : "Aguardando CEO"}
                                </span>

                                {/* 4. Verificação de fontes */}
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                  isUnverified
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`} title={isUnverified ? "Sem comprovação direta em fonte oficial externa (ou inconclusiva na complementação)" : "Comprovada em documento oficial consultado"}>
                                  {isUnverified ? "⚠️ Não verificada" : "✓ Comprovada"}
                                </span>
                              </div>
                            </div>

                            {/* Badges de Taxonomia Jurídica (Etapa 5E) */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {effectiveNature && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-500/30">
                                  Natureza: {CLAIM_NATURE_LABEL[effectiveNature] || effectiveNature}
                                  {isLegacy && " (inferida)"}
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                CLAIM_OUTCOME_BADGE_STYLE[effectiveOutcome] || "bg-slate-800 text-slate-300 border-white/10"
                              }`}>
                                Resultado: {CLAIM_OUTCOME_LABEL[effectiveOutcome] || effectiveOutcome}
                                {isLegacy && " (inferido)"}
                              </span>
                              {isLegacy && (
                                <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/5" title="Registro histórico anterior à Etapa 5B">
                                  Legado
                                </span>
                              )}
                            </div>

                            {validation?.detail && (
                              <p className="text-xs text-slate-400 italic">{validation.detail}</p>
                            )}

                            {relatedFinding && (
                              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-200/90 space-y-1">
                                <span className="font-bold text-amber-300 text-[11px] block">
                                  Achado da Complementação ({relatedFinding.status === "nao_verificada" ? "Não verificada" : relatedFinding.status}):
                                </span>
                                <p className="text-[11px] text-slate-300">{relatedFinding.statementAnalyzed}</p>
                                {relatedFinding.objectiveJustification && (
                                  <p className="text-[10px] text-slate-400 italic">Justificativa: {relatedFinding.objectiveJustification}</p>
                                )}
                              </div>
                            )}

                            {change.originalExcerpt && (
                              <p className="text-xs text-slate-300"><span className="font-bold text-slate-100">Original: </span>{change.originalExcerpt}</p>
                            )}
                            {change.revisedExcerpt && (
                              <p className="text-xs text-slate-300"><span className="font-bold text-slate-100">Revisado: </span>{change.revisedExcerpt}</p>
                            )}
                            <p className="text-xs text-slate-400"><span className="font-bold text-slate-300">Motivo: </span>{change.reason}</p>

                            {(change.evidence || []).map((evidence) => (
                              <EvidenceBlock
                                key={`${change.id}-${evidence.url}-${evidence.sourceType}`}
                                evidence={evidence}
                                confirmed={change.confirmation === "CONFIRMADO"}
                                nature={effectiveNature}
                              />
                            ))}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* Seção Expansível: Fontes Consultadas (71 Fontes) */}
              {review.consultedSources && review.consultedSources.length > 0 && (
                <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConsultedSources(!showConsultedSources)}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white cursor-pointer"
                    >
                      <Database size={15} className="text-brand-gold" />
                      <span>Fontes Oficiais e Documentos Consultados ({review.consultedSources.length})</span>
                      <span className="text-[10px] font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {officialSourcesCount} oficiais
                      </span>
                      {showConsultedSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {showConsultedSources && (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Acervo integral de documentos legislativos, jurisprudenciais e acórdãos consultados pela OpenAI e pelos serviços de recuperação jurídica durante a auditoria.
                      </p>

                      {/* Filtro de busca de fontes */}
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={sourceSearchTerm}
                          onChange={(e) => setSourceSearchTerm(e.target.value)}
                          placeholder="Filtrar por instituição, título ou URL (ex.: STF, CF/88, planalto)..."
                          className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-gold/50"
                        />
                      </div>

                      {/* Lista rolável de fontes */}
                      <div className="max-h-96 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
                        {filteredConsultedSources.length === 0 ? (
                          <p className="text-xs text-slate-500 py-3 text-center">Nenhuma fonte corresponde à busca informada.</p>
                        ) : (
                          filteredConsultedSources.map((source, sIdx) => (
                            <div key={`${source.url}-${sIdx}`} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="font-bold text-slate-200">
                                  {source.institution || "Documento Oficial"}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                  source.official
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-slate-800 text-slate-400 border border-white/10"
                                }`}>
                                  {source.official ? "Fonte Oficial" : "Referência Complementar"}
                                </span>
                              </div>

                              <div>
                                <SourceLink url={source.url} title={source.title || source.url} />
                              </div>

                              {source.snippet && (
                                <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                                  {source.snippet}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {review.unverifiedClaims.length > 0 && (
                <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                  <h4 className="text-sm font-bold text-amber-100">Informações que exigem conferência humana</h4>
                  {review.unverifiedClaims.map((claim, idx) => (
                    <div key={`${claim.excerpt}-${idx}`} className="text-sm border-l-2 border-amber-400/60 pl-3 py-1 space-y-0.5">
                      <p className="font-bold text-amber-100">
                        <span className="text-amber-400 mr-1.5">•</span>
                        {claim.excerpt}
                      </p>
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        {claim.reason}
                      </p>
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}

          {phase === "edit" && (
            <div className="flex flex-col gap-2 min-h-[50vh]">
              {preview && (
                <p className="text-sky-100 bg-sky-500/10 border border-sky-500/30 rounded-2xl px-4 py-3 text-sm">
                  Este ajuste altera somente a versão candidata desta prévia. Não há publicação nem substituição da aula.
                </p>
              )}
              <label className="text-xs font-bold text-slate-300">Texto integral da versão candidata (Markdown com marcadores [BLOCK_1] a [BLOCK_6]):</label>
              <textarea
                defaultValue={review?.reviewedMarkdown || ""}
                onChange={(event) => setDraft(event.target.value)}
                className="flex-1 w-full min-h-[50vh] bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-brand-gold/50 resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 py-4 border-t border-white/10">
          {phase === "confirm" && (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">Cancelar</button>
              {conflict && review?.status === "pending_approval" ? (
                <>
                  {onViewHistorical && (
                    <button
                      type="button"
                      onClick={onViewHistorical}
                      disabled={busy}
                      className="px-4 py-2.5 rounded-xl bg-brand-gold text-slate-950 text-xs font-black uppercase cursor-pointer flex items-center gap-1.5"
                    >
                      <Layers size={14} /> Ver revisão existente
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={true}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-500 border border-white/5 text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
                    title="Opção bloqueada: o backend utiliza um único ponteiro latestReviewId por aula. Uma nova revisão sobrescreveria o índice do catálogo, tornando inacessível a auditoria existente e os achados da att-2."
                  >
                    <Lock size={13} /> Nova revisão bloqueada
                  </button>
                </>
              ) : (
                <button type="button" onClick={onStart} disabled={busy} className="px-4 py-2.5 rounded-xl bg-brand-gold text-slate-950 text-xs font-black uppercase cursor-pointer flex items-center gap-1.5">
                  <Search size={14} /> {testing ? "Iniciar teste" : "Iniciar revisão"}
                </button>
              )}
            </>
          )}
          {phase === "error" && (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">Cancelar</button>
              {onRetryFetch && (
                <button
                  type="button"
                  onClick={onRetryFetch}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-xl bg-brand-gold text-slate-950 text-xs font-black uppercase cursor-pointer flex items-center gap-1.5"
                >
                  <Search size={14} /> Tentar novamente
                </button>
              )}
            </>
          )}
          {phase === "notice" && (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">Cancelar</button>
              <button type="button" onClick={onForce} disabled={busy} className="px-4 py-2.5 rounded-xl bg-brand-gold text-slate-950 text-xs font-black uppercase cursor-pointer">Revisar mesmo assim</button>
            </>
          )}
          {phase === "result" && review && (
            <>
              {!testing && (
                <button type="button" onClick={onReject} disabled={busy} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">Rejeitar revisão</button>
              )}
              <button type="button" onClick={() => onEdit()} disabled={busy} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer">Editar versão revisada</button>
              {review.manuallyEdited && (
                <button type="button" onClick={onReaudit} disabled={busy} className="px-4 py-2.5 rounded-xl bg-slate-800 text-sky-200 text-xs font-bold cursor-pointer">Revisar novamente esta versão</button>
              )}
              {testing ? (
                <button type="button" onClick={onEndTest} disabled={busy} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer">Encerrar teste</button>
              ) : preview ? null : (
                (() => {
                  const homologation = review.supplement ? validateFindingsHomologation(review) : { ok: true, failureReasons: [] };
                  const hasInconclusiveSupplement = !homologation.ok;
                  const isBlocked = busy || conflict || review.editorialIntegrity?.passed === false || review.verificationLevel === "FALHA_NA_VERIFICACAO" || hasInconclusiveSupplement;
                  return (
                    <button
                      type="button"
                      onClick={onApprove}
                      disabled={isBlocked}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all ${
                        isBlocked
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-rose-500/30"
                          : "bg-brand-gold text-slate-950 cursor-pointer"
                      }`}
                      title={
                        conflict
                          ? "Aprovação bloqueada: existe divergência entre o snapshot da revisão e o texto atual do catálogo oficial."
                          : review.editorialIntegrity?.passed === false
                            ? `Aprovação bloqueada: alterações ausentes ou inconsistentes no texto revisado (${review.editorialIntegrity.problematicChanges.join(", ")}).`
                            : review.verificationLevel === "FALHA_NA_VERIFICACAO"
                              ? "Aprovação bloqueada: a verificação em fontes oficiais falhou ou é insuficiente."
                              : hasInconclusiveSupplement
                                ? `Aprovação bloqueada: pendências na complementação jurídica:\n- ${homologation.failureReasons.join("\n- ")}`
                                : "Aprovar versão revisada e substituir no catálogo oficial"
                      }
                    >
                      <Check size={14} /> Aprovar e substituir
                    </button>
                  );
                })()
              )}
            </>
          )}
          {phase === "edit" && (
            <>
              <button type="button" onClick={onBack} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">Voltar</button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onSaveCandidate(draft)}
                className="px-4 py-2.5 rounded-xl bg-brand-gold text-slate-950 text-xs font-black uppercase cursor-pointer"
              >
                Salvar ajustes da candidata
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
