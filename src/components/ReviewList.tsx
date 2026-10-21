import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, Trash2, X, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Review } from '../types';
import { reviewDay, reviewPart } from '../lib/compressedReviews';
import { emphasizeStudyMarkdown } from '../lib/emphasizeStudyMarkdown';
import { presentSavedLesson } from '../lib/presentSavedLesson';
import { ReviewCounterService } from '../services/reviewCounterService';
import { HighlightableContent } from './HighlightableContent';

export function ReviewList({
  reviews,
  onDelete,
  userId
}: {
  reviews: Review[];
  onDelete: (id: string) => void;
  userId?: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [counters, setCounters] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!userId) {
      setCounters({});
      return;
    }
    const local = ReviewCounterService.getLocalCounters(userId);
    const initial: Record<string, number> = {};
    for (const [k, v] of Object.entries(local)) {
      initial[k] = v.count;
    }
    setCounters(initial);
    void ReviewCounterService.syncFromCloud(userId).then((cloud) => {
      const updated: Record<string, number> = {};
      for (const [k, v] of Object.entries(cloud)) {
        updated[k] = v.count;
      }
      setCounters(updated);
    });

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.reviewId && typeof detail.count === 'number') {
        setCounters((prev) => ({ ...prev, [detail.reviewId]: detail.count }));
      }
    };
    window.addEventListener('athena-review-counter-updated', handler);
    return () => window.removeEventListener('athena-review-counter-updated', handler);
  }, [userId]);

  const handleDelta = async (reviewId: string, delta: number) => {
    if (!userId) return;
    const mutationId = `${userId}_${reviewId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCount = await ReviewCounterService.updateCounter(userId, reviewId, delta, mutationId);
    setCounters((prev) => ({ ...prev, [reviewId]: newCount }));
  };

  const groups = useMemo(() => {
    const byDay = new Map<number | 'outros', Review[]>();
    for (const review of reviews) {
      const day = reviewDay(review);
      const part = reviewPart(review);
      if (day === undefined || part === undefined || part < 0 || part > 4) continue;
      const key = day;
      const list = byDay.get(key) || [];
      list.push(review);
      byDay.set(key, list);
    }
    const days = Array.from(byDay.keys()).sort((a, b) => {
      if (a === 'outros') return 1;
      if (b === 'outros') return -1;
      return a - b;
    });
    return days.map((day) => ({
      day,
      items: (byDay.get(day) || []).sort((a, b) => (reviewPart(a) ?? 99) - (reviewPart(b) ?? 99))
    }));
  }, [reviews]);

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
        <div className="p-4 bg-slate-900 rounded-2xl mb-4">
          <BookOpen className="text-slate-700" size={32} />
        </div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nenhuma revisão comprimida ainda.</p>
        <p className="text-xs text-slate-600 mt-2">As cinco revisões do dia aparecem aqui quando você estuda essa parte da trilha.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={String(group.day)} className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-gold">
              {group.day === 'outros' ? 'Outros estudos' : `Dia ${group.day}`}
            </h3>
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {group.items.length} {group.items.length === 1 ? 'parte' : 'partes'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.items.map((review) => {
              const part = reviewPart(review);
              const open = openId === review.id;
              return (
                <motion.div
                  key={review.id}
                  className={`p-5 bg-slate-900 border border-white/5 hover:border-brand-gold/30 rounded-3xl group transition-all relative ${open ? 'md:col-span-2' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-black uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full max-w-[80%] truncate"
                      title={review.subject}
                    >
                      {part !== undefined ? `Bloco ${part + 1} · ${review.subject.replace(/^(?:Parte|Bloco)\s+\d+\s*·\s*/i, '')}` : review.subject}
                    </span>
                    <div className="relative flex items-center gap-1">
                      <AnimatePresence mode="wait">
                        {confirmDelete === review.id ? (
                          <motion.div
                            key="confirm"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-1"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(review.id);
                                setConfirmDelete(null);
                              }}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                              title="Confirmar Exclusão"
                            >
                              <X size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete(null);
                              }}
                              className="p-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition-all"
                              title="Cancelar"
                            >
                              <History size={12} />
                            </button>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="trash"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(review.id);
                            }}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div>
                    {open ? (
                      <div className="markdown-body text-sm text-slate-200">
                        <HighlightableContent content={review.content} lessonId={`review_${review.id}`} />
                      </div>
                    ) : (
                      <p className="text-sm font-serif font-bold text-slate-100 leading-relaxed line-clamp-3">
                        {review.content.split('\n').find((l) => l.trim() && !l.trim().startsWith('#'))?.replace(/^[•\s*#\d.)-]+/, '') || 'Revisão comprimida'}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : review.id)}
                        className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-brand-gold transition-colors"
                      >
                        <span>{open ? 'Recolher' : 'Ler revisão completa'}</span>
                        <ChevronRight size={12} className={open ? 'rotate-90 transition-transform' : ''} />
                      </button>

                      {/* Stepper counter: − 1x + */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hidden sm:inline">
                          Revisado:
                        </span>
                        <div 
                          className="inline-flex items-center bg-slate-950/80 border border-brand-gold/30 rounded-xl px-2 py-0.5 shadow-inner"
                          title="Contador individual de revisões (mínimo 0)"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDelta(review.id, -1);
                            }}
                            disabled={(counters[review.id] ?? 0) <= 0}
                            aria-label="Diminuir contagem de revisão"
                            className="w-5 h-5 flex items-center justify-center text-xs font-black text-slate-400 hover:text-brand-gold disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <span className="font-mono text-xs font-black text-brand-gold px-1.5 min-w-[28px] text-center select-none">
                            {(counters[review.id] ?? 0)}x
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDelta(review.id, 1);
                            }}
                            aria-label="Aumentar contagem de revisão"
                            className="w-5 h-5 flex items-center justify-center text-xs font-black text-slate-400 hover:text-brand-gold transition-colors active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
