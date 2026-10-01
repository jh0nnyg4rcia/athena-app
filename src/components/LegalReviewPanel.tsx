import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { diffLines } from "../lib/legalReviewDiff";
import type { LegalReviewChange, LegalReviewEvidence, LegalReviewView, LegalSourceType } from "../lib/legalReviewTypes";
import { evidenceMayBeShownAsProof, safeHttpsUrl } from "../lib/legalReviewValidate";

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

function EvidenceBlock({ evidence, confirmed }: { evidence: LegalReviewEvidence; confirmed: boolean }) {
  const proof = evidenceMayBeShownAsProof(evidence);
  return (
    <div className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 space-y-1">
      <p className="font-bold text-slate-100">Evidência oficial</p>
      <p><span className="font-bold text-slate-100">Instituição: </span>{evidence.institution}</p>
      <p><span className="font-bold text-slate-100">Documento: </span>{proof ? <SourceLink url={evidence.url} title={evidence.title} /> : evidence.title}</p>
      <p><span className="font-bold text-slate-100">Tipo: </span>{SOURCE_TYPE_LABEL[evidence.sourceType] || evidence.sourceType}</p>
      <p><span className="font-bold text-slate-100">Fonte consultada: </span>{evidence.consulted ? "Sim" : "Não"}</p>
      <p><span className="font-bold text-slate-100">Status: </span>{confirmed && evidence.supportsChange ? "Confirmado" : "Não confirmado"}</p>
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
}) {
  const [view, setView] = useState<"side" | "diff">("side");
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (phase !== "edit") return;
    setDraft(review?.reviewedMarkdown || "");
  }, [phase, review?.reviewedMarkdown]);
  const diff = useMemo(
    () => (review ? diffLines(review.originalContent, review.reviewedMarkdown) : []),
    [review]
  );
  if (!open) return null;

  const summary = review?.summary;
  const consulted = review?.consultedSources || [];

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-brand-gold/30 rounded-[2rem] max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-left">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-gold">Auditoria jurídica com fontes oficiais</p>
            <h3 className="text-lg font-serif font-bold text-slate-100 mt-1">
              {phase === "confirm" && "Revisão Jurídica com IA"}
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

          {phase === "confirm" && (
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>A OpenAI realizará uma auditoria jurídica desta aula e poderá consultar fontes oficiais para verificar legislação e jurisprudência.</p>
              <p>A aula publicada não será modificada até que você aprove a revisão.</p>
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
                    <p className="text-[11px] text-slate-500 mb-2">versão atualmente publicada</p>
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

              <section className="space-y-3">
                <h4 className="text-sm font-bold text-slate-100">Alterações realizadas</h4>
                {review.changes.length === 0 && <p className="text-sm text-slate-400">Nenhuma alteração material.</p>}
                {review.changes.map((change) => (
                  <article key={change.id} className="rounded-2xl border border-white/10 p-4 space-y-2 bg-slate-950/40">
                    <h5 className="text-xs font-black uppercase tracking-wider text-brand-gold">
                      {TYPE_LABEL[change.type]} — {SEVERITY_LABEL[change.severity]} — {change.confirmation === "CONFIRMADO" ? "confirmado" : "não confirmado"}
                    </h5>
                    {change.originalExcerpt && (
                      <p className="text-sm text-slate-300"><span className="font-bold text-slate-100">Trecho original: </span>{change.originalExcerpt}</p>
                    )}
                    {change.revisedExcerpt && (
                      <p className="text-sm text-slate-300"><span className="font-bold text-slate-100">Trecho revisado: </span>{change.revisedExcerpt}</p>
                    )}
                    <h6 className="text-sm font-bold text-slate-100">Alteração</h6>
                    <p className="text-sm text-slate-300">{change.revisedExcerpt || change.originalExcerpt}</p>
                    <h6 className="text-sm font-bold text-slate-100">Motivo</h6>
                    <p className="text-sm text-slate-300">{change.reason}</p>
                    {(change.evidence || []).length === 0 && (
                      <p className="text-sm text-amber-100">Não confirmado. Esta alteração não tem evidência validada.</p>
                    )}
                    {(change.evidence || []).map((evidence) => (
                      <EvidenceBlock key={`${change.id}-${evidence.url}-${evidence.sourceType}`} evidence={evidence} confirmed={change.confirmation === "CONFIRMADO"} />
                    ))}
                  </article>
                ))}
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-bold text-slate-100">Fonte oficial consultada</h4>
                <p className="text-xs text-slate-400">Endereços recuperados pela pesquisa. Consultar uma página não significa que ela comprova uma alteração.</p>
                {consulted.length === 0 && (
                  <p className="text-sm text-slate-400">A ferramenta não devolveu fontes consultadas.</p>
                )}
                <ul className="space-y-2 text-sm text-slate-300">
                  {consulted.map((source) => (
                    <li key={source.url} className="rounded-xl border border-white/10 px-3 py-2">
                      <p>{source.official ? source.institution : "Fonte consultada, sem instituição oficial reconhecida"}</p>
                      {source.official ? <SourceLink url={source.url} title={source.url} /> : <p className="break-all text-slate-400">{source.url}</p>}
                    </li>
                  ))}
                </ul>
              </section>

              {review.unverifiedClaims.length > 0 && (
                <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
                  <h4 className="text-sm font-bold text-amber-100">Informações que exigem conferência humana</h4>
                  {review.unverifiedClaims.map((claim) => (
                    <p key={claim.excerpt} className="text-sm text-amber-50">
                      <span className="font-bold">Não confirmado. </span>
                      {claim.excerpt} {claim.reason}
                    </p>
                  ))}
                </section>
              )}
            </div>
          )}

          {phase === "edit" && (
            <div className="flex flex-col gap-2 min-h-[50vh]">
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
                <Search size={14} /> Iniciar revisão
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
              <button type="button" onClick={onReject} disabled={busy} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">Rejeitar revisão</button>
              <button type="button" onClick={() => onEdit()} disabled={busy} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer">Editar versão revisada</button>
              {review.manuallyEdited && (
                <button type="button" onClick={onReaudit} disabled={busy} className="px-4 py-2.5 rounded-xl bg-slate-800 text-sky-200 text-xs font-bold cursor-pointer">Revisar novamente esta versão</button>
              )}
              <button type="button" onClick={onApprove} disabled={busy} className="px-4 py-2.5 rounded-xl bg-brand-gold text-slate-950 text-xs font-black uppercase cursor-pointer flex items-center gap-1.5">
                <Check size={14} /> Aprovar e substituir
              </button>
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
