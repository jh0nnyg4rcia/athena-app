import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, Trash2, X, History } from 'lucide-react';

interface Review {
  id: string;
  sessionId: string;
  subject: string;
  article: number;
  content: string;
  timestamp: number;
}

export function ReviewList({ 
  reviews, 
  onSelect, 
  onDelete 
}: { 
  reviews: Review[], 
  onSelect: (review: Review) => void,
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
        <div className="p-4 bg-slate-900 rounded-2xl mb-4">
          <BookOpen className="text-slate-700" size={32} />
        </div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nenhuma revisão comprimida ainda.</p>
        <p className="text-xs text-slate-600 mt-2">Conclua lições no estudo guiado para salvar revisões.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reviews.sort((a, b) => b.timestamp - a.timestamp).map((review) => (
        <motion.div
          key={review.id}
          whileHover={{ y: -4, border: '1px solid rgba(212, 175, 55, 0.3)' }}
          className="p-5 bg-slate-900 border border-white/5 rounded-3xl cursor-pointer group transition-all relative"
        >
          <div className="flex items-center justify-between mb-3">
            <span 
              onClick={() => onSelect(review)}
              className="text-[10px] font-black uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full"
            >
              {review.subject.split(' ')[0]}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-bold">Art. {review.article}</span>
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
          </div>
          <div onClick={() => onSelect(review)}>
            <p className="text-sm font-serif font-bold text-slate-100 group-hover:text-brand-gold transition-colors line-clamp-2 leading-relaxed">
              {review.content.split('\n')[0].replace(/^[•\s*-]+/, '')}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-widest">
              <span>Reler revisão</span>
              <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
