import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, Trash2, X, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Review } from '../types';
import { reviewDay, reviewPart } from '../lib/compressedReviews';

export function ReviewList({
  reviews,
  onSelect,
  onDelete
}: {
  reviews: Review[];
  onSelect: (review: Review) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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
              return (
                <motion.div
                  key={review.id}
                  className="p-5 bg-slate-900 border border-white/5 hover:border-brand-gold/30 rounded-3xl cursor-pointer group transition-all relative"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      onClick={() => onSelect(review)}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full max-w-[80%] truncate"
                      title={review.subject}
                    >
                      {part !== undefined ? `Parte ${part + 1} · ${review.subject.replace(/^Parte\s+\d+\s*·\s*/i, '')}` : review.subject}
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
                  <div
                    onClick={() => {
                      setOpenId(openId === review.id ? null : review.id);
                      onSelect(review);
                    }}
                  >
                    {openId === review.id ? (
                      <div className="markdown-body text-sm text-slate-200 leading-relaxed">
                        <ReactMarkdown>{review.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm font-serif font-bold text-slate-100 group-hover:text-brand-gold transition-colors line-clamp-3 leading-relaxed">
                        {review.content.split('\n').find((l) => l.trim() && !l.trim().startsWith('#'))?.replace(/^[•\s*#\d.)-]+/, '') || 'Revisão comprimida'}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-widest">
                      <span>{openId === review.id ? 'Recolher' : 'Ler revisão completa'}</span>
                      <ChevronRight size={12} className={openId === review.id ? 'rotate-90 transition-transform' : 'group-hover:translate-x-1 transition-transform'} />
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
