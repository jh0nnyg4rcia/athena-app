import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronUp, Edit3, Layers, Search, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { diffLines } from "../lib/legalReviewDiff";
import type {
  ChangeResolutionState,
  CoordinatedQuestionGroup,
  HumanReviewDecision,
  LegalReviewChange,
  LegalReviewEvidence,
  LegalReviewView,
  LegalSourceType,
} from "../lib/legalReviewTypes";
import {
  evidenceMayBeShownAsProof,
  findQuestionCoordinationGroups,
  safeHttpsUrl,
} from "../lib/legalReviewValidate";

type Phase = "confirm" | "running" | "notice" | "result" | "edit";

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

function EvidenceBlock({ evidence }: { evidence: LegalReviewEvidence; confirmed?: boolean }) {
  const proof = evidenceMayBeShownAsProof(evidence);
  return (
    <div className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 space-y-1">
      <p className="font-bold text-slate-100">Evidência oficial</p>
      <p><span className="font-bold text-slate-100">Instituição: </span>{evidence.institution}</p>
      <p><span className="font-bold text-slate-100">Documento: </span>{proof ? <SourceLink url={evidence.url} title={evidence.title} /> : evidence.title}</p>
      <p><span className="font-bold text-slate-100">Tipo: </span>{SOURCE_TYPE_LABEL[evidence.sourceType] || evidence.sourceType}</p>
      <p><span className="font-bold text-slate-100">Fonte consultada: </span>{evidence.consulted ? "Sim" : "Não"}</p>
      <p><span className="font-bold text-slate-100">Status: </span>{evidenceStatusLabel(evidence)}</p>
      {!proof && <p className="text-amber-100">Esta URL não foi validada como fonte consultada.</p>}
      {evidence.supportExplanation && <p className="text-slate-400">{evidence.supportExplanation}</p>}
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
  testMode = false,
  sectionPreview = false,
  testDraft = "",
  onTestDraftChange,
  onEndTest,
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
  testMode?: boolean;
  sectionPreview?: boolean;
  testDraft?: string;
  onTestDraftChange?: (value: string) => void;
  onEndTest?: () => void;
}) {
  const [view, setView] = useState<"side" | "diff">("side");
  const [draft, setDraft] = useState("");
  const [showApplied, setShowApplied] = useState(false);
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
              <p>A OpenAI realizará uma auditoria jurídica desta parte e poderá consultar fontes oficiais para verificar legislação e jurisprudência.</p>
              <p>{preview ? "Esta revisão é uma prévia da parte aberta. A aula publicada não será alterada." : "A aula publicada não será modificada até que você aprove a revisão."}</p>
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
              {testing && (
                <p className="text-amber-100 bg-amber-500/10 border border-amber-500/40 rounded-2xl px-4 py-3 font-bold">MODO DE TESTE — este conteúdo não será publicado.</p>
              )}
              {preview && !testing && (
                <p className="text-sky-100 bg-sky-500/10 border border-sky-500/30 rounded-2xl px-4 py-3 text-sm">
                  Prévia da parte {typeof review.blockIndex === "number" ? review.blockIndex + 1 : ""}. Dia {review.day} · Bloco {review.part + 1}. A aula publicada não foi alterada.
                </p>
              )}
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

              {/* Seção 3: Alterações já aplicadas ou resolvidas */}
              {appliedOrResolvedChanges.length > 0 && (
                <section className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplied(!showApplied)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-white/10 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-400" />
                      Alterações já aplicadas ou resolvidas ({appliedOrResolvedChanges.length})
                    </span>
                    {showApplied ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showApplied && (
                    <div className="space-y-3 pl-2">
                      {appliedOrResolvedChanges.map((change) => {
                        const validation = validationResults.find((r) => r.changeId === change.id);
                        const isRejected = validation?.resolutionState === "REJECTED_BY_CEO";

                        return (
                          <article key={change.id} className="rounded-2xl border border-white/10 p-4 space-y-2 bg-slate-950/40">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h5 className="text-xs font-black uppercase tracking-wider text-brand-gold">
                                {change.id} — {TYPE_LABEL[change.type]} — {SEVERITY_LABEL[change.severity]}
                              </h5>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                isRejected
                                  ? "bg-slate-800 text-slate-300 border border-white/10"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}>
                                {isRejected
                                  ? "⊘ Rejeitada pelo CEO"
                                  : validation?.resolutionState === "APPLIED_BY_CEO"
                                    ? "✓ Aplicada pelo CEO"
                                    : validation?.resolutionState === "EDITED_BY_CEO"
                                      ? "✓ Editada pelo CEO"
                                      : "✓ Incorporada no texto"}
                              </span>
                            </div>

                            {validation?.detail && (
                              <p className="text-xs text-slate-400 italic">{validation.detail}</p>
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
                              />
                            ))}
                          </article>
                        );
                      })}
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
              <button type="button" onClick={onStart} disabled={busy} className="px-4 py-2.5 rounded-xl bg-brand-gold text-slate-950 text-xs font-black uppercase cursor-pointer flex items-center gap-1.5">
                <Search size={14} /> {testing ? "Iniciar teste" : "Iniciar revisão"}
              </button>
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
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={busy || review.editorialIntegrity?.passed === false || review.verificationLevel === "FALHA_NA_VERIFICACAO"}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all ${
                    review.editorialIntegrity?.passed === false || review.verificationLevel === "FALHA_NA_VERIFICACAO"
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-rose-500/30"
                      : "bg-brand-gold text-slate-950 cursor-pointer"
                  }`}
                  title={
                    review.editorialIntegrity?.passed === false
                      ? `Aprovação bloqueada: alterações ausentes ou inconsistentes no texto revisado (${review.editorialIntegrity.problematicChanges.join(", ")}).`
                      : review.verificationLevel === "FALHA_NA_VERIFICACAO"
                        ? "Aprovação bloqueada: a verificação em fontes oficiais falhou ou é insuficiente."
                        : "Aprovar versão revisada e substituir no catálogo oficial"
                  }
                >
                  <Check size={14} /> Aprovar e substituir
                </button>
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
