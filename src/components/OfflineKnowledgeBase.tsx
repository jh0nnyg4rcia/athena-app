import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  HelpCircle, 
  Search, 
  RefreshCw, 
  Trash2, 
  Database, 
  ChevronDown, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Wifi, 
  WifiOff, 
  Eye, 
  Download,
  Award,
  BookMarked
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  getCachedQuestions, 
  getCachedArticles, 
  getCachedSubjects, 
  clearOfflineCache, 
  getOfflineStats, 
  CachedQuestion, 
  CachedArticle,
  extractFirstSentenceOrParagraph
} from '../services/localCache';

// Helper to highlight search keywords
function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-brand-gold/30 text-brand-gold font-bold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export function OfflineKnowledgeBase() {
  const [activeTab, setActiveTab] = useState<'articles' | 'questions'>('articles');
  const [articles, setArticles] = useState<CachedArticle[]>([]);
  const [questions, setQuestions] = useState<CachedQuestion[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Interactive test answers state (questionId -> chosen index)
  const [offlineAnswers, setOfflineAnswers] = useState<Record<string, number>>({});
  
  // Expanded article control (articleId -> boolean)
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({});
  
  // Stats
  const [stats, setStats] = useState({ questionsCount: 0, articlesCount: 0 });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allArticles, allQuestions, allSubjects, dbStats] = await Promise.all([
        getCachedArticles(),
        getCachedQuestions(),
        getCachedSubjects(),
        getOfflineStats()
      ]);

      setArticles(allArticles);
      setQuestions(allQuestions);
      setSubjects(allSubjects);
      setStats(dbStats);
    } catch (e) {
      console.error('Error loading offline cache:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearCache = async () => {
    await clearOfflineCache();
    await loadData();
    setShowClearConfirm(false);
    setOfflineAnswers({});
    setExpandedArticles({});
  };

  // Filter lists based on subject and search query
  const filteredArticles = articles.filter(art => {
    const matchesSubject = selectedSubject === 'all' || art.subject === selectedSubject;
    const matchesSearch = searchQuery.trim() === '' || 
      art.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(art.article).includes(searchQuery);
    return matchesSubject && matchesSearch;
  });

  const filteredQuestions = questions.filter(q => {
    const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
    const matchesSearch = searchQuery.trim() === '' || 
      (q.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.options.some(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  const handleTryAnswer = (qId: string, index: number) => {
    setOfflineAnswers(prev => ({ ...prev, [qId]: index }));
  };

  return (
    <div className="space-y-6">
      {/* Upper Status & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900/60 border border-white/5 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-brand-gold/10 text-brand-gold rounded-2xl border border-brand-gold/20">
            <Database size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100 font-serif">Banco Offline • IndexedDB</h3>
              {isOnline ? (
                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-wider">
                  <Wifi size={10} /> Sincronizado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 uppercase tracking-wider">
                  <WifiOff size={10} /> Modo Offline Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Todos os artigos e desafios estudados são salvos automaticamente no cache de contingência do seu navegador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-950/40 text-slate-300 hover:text-brand-gold border border-white/5 hover:border-brand-gold/20 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs"
            title="Sincronizar localmente"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-brand-gold" : ""} />
            <span>Atualizar</span>
          </button>
          
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs"
            title="Limpar cache local"
          >
            <Trash2 size={14} />
            <span>Limpar Banco</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 bg-slate-900 border border-red-500/30 rounded-3xl max-w-md w-full text-center space-y-4 shadow-xl"
            >
              <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
                <AlertTriangle size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-100 font-serif">Deseja limpar todo o cache offline?</h4>
              <p className="text-xs text-slate-400">
                Isso removerá instantaneamente todos os {stats.articlesCount} artigos e {stats.questionsCount} questões armazenados localmente no IndexedDB. O download original das mensagens continuará disponível na nuvem.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 bg-slate-950 text-slate-400 border border-white/5 hover:bg-slate-800 rounded-xl transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500 text-slate-100 hover:text-white border border-red-500/30 rounded-xl transition-all text-xs"
                >
                  Sim, Limpar Tudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Database Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded-xl border border-white/5 text-slate-400 shrink-0">
            <BookMarked size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Artigos Salvos</span>
            <span className="text-xl font-bold text-brand-gold mt-1 block">{stats.articlesCount}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded-xl border border-white/5 text-slate-400 shrink-0">
            <HelpCircle size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Questões Salvas</span>
            <span className="text-xl font-bold text-brand-gold mt-1 block">{stats.questionsCount}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded-xl border border-white/5 text-slate-400 shrink-0">
            <Award size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Disciplinas</span>
            <span className="text-xl font-bold text-brand-gold mt-1 block">{subjects.length}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded-xl border border-white/5 text-slate-400 shrink-0">
            <Download size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Status Local</span>
            <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-1.5 py-0.5 rounded uppercase mt-1 block text-center leading-none">
              Pronto
            </span>
          </div>
        </div>
      </div>

      {/* Filter Options Line */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Pesquisar por termo, artigo ou assunto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-gold/40 focus:border-brand-gold/40"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 md:pb-0">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0 transition-all ${
              selectedSubject === 'all'
                ? 'bg-brand-gold/15 border-brand-gold/30 text-brand-gold'
                : 'bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tudo
          </button>
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0 transition-all ${
                selectedSubject === subject
                  ? 'bg-brand-gold/15 border-brand-gold/30 text-brand-gold'
                  : 'bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {subject.split(' ')[0]} ({subject.slice(0, 15)}...)
            </button>
          ))}
        </div>
      </div>

      {/* Tab Switcher for Articles / Questions */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider border-b-2 transition-all relative ${
            activeTab === 'articles'
              ? 'border-brand-gold text-brand-gold font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BookMarked size={14} />
            <span>Artigos & Resumos Consultados ({filteredArticles.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider border-b-2 transition-all relative ${
            activeTab === 'questions'
              ? 'border-brand-gold text-brand-gold font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <HelpCircle size={14} />
            <span>Questões de Desafio Resolvidas ({filteredQuestions.length})</span>
          </div>
        </button>
      </div>

      {/* Render Lists */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3">
            <RefreshCw className="animate-spin text-brand-gold text-xl" />
            <span className="text-xs text-slate-400">Consultando base local IndexedDB...</span>
          </div>
        ) : activeTab === 'articles' ? (
          <div>
            {filteredArticles.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-2xl text-slate-500">
                <BookOpen size={30} className="mx-auto text-slate-700 mb-3" />
                <span className="text-xs">Nenhum artigo offline encontrado para os filtros ativos.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((art) => {
                  const isExpanded = !!expandedArticles[art.id];
                  const preview = extractFirstSentenceOrParagraph(art.content, 180);
                  
                  return (
                    <div 
                      key={art.id} 
                      className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10"
                    >
                      <button
                        onClick={() => setExpandedArticles(prev => ({ ...prev, [art.id]: !isExpanded }))}
                        className="w-full text-left p-4 flex items-start justify-between gap-4 hover:bg-slate-800/20 active:bg-slate-800/40 outline-none"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded">
                              {art.subject}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {new Date(art.timestamp).toLocaleDateString('pt-BR')} • {new Date(art.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 font-serif">
                            {art.subject.includes('Edital') ? 'Análise do Edital' : `Disposições do Artigo ${art.article}`}
                          </h4>
                        </div>
                        <div className="text-slate-400 p-1 bg-slate-950 rounded-lg">
                          <ChevronDown size={14} className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {/* Expandable detailed content retrieved offline */}
                      <AnimatePresence>
                        {isExpanded ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/5"
                          >
                            <div className="p-5 bg-slate-950/40 text-xs text-slate-300 leading-relaxed max-h-[350px] overflow-y-auto scrollbar-thin space-y-3">
                              <div className="markdown-body text-slate-200">
                                <ReactMarkdown>{art.content}</ReactMarkdown>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="px-4 pb-4 text-[11px] text-slate-400/80 leading-relaxed flex items-center gap-1.5 border-t border-white/5 pt-2">
                            <Eye size={12} className="text-brand-gold shrink-0" />
                            <span className="truncate italic">"{preview}"</span>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-2xl text-slate-500">
                <HelpCircle size={30} className="mx-auto text-slate-700 mb-3" />
                <span className="text-xs">Nenhuma questão de desafio offline correspondente aos filtros ativos.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => {
                  const userPreviousChoice = q.userAnswerIndex;
                  const currentOfflineChoice = offlineAnswers[q.id ?? ''] ?? userPreviousChoice;
                  const hasAnswered = currentOfflineChoice !== undefined && currentOfflineChoice !== -1 && currentOfflineChoice !== -2;
                  
                  // Special cases for discursivas/orais
                  const isSubjective = q.correctIndex === -1;
                  const isOral = q.correctIndex === -2;

                  return (
                    <div 
                      key={q.id} 
                      className="p-5 bg-slate-900 border border-white/5 rounded-2xl space-y-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2.0 py-0.5 rounded">
                          {q.subject || 'Conteúdo Geral'}
                        </span>
                        
                        <span className="text-[10px] text-slate-400/80 font-bold block">
                          {isSubjective ? 'PROVA DISCURSIVA' : isOral ? 'BANCA ORAL' : 'Fase Objetiva'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-100 leading-relaxed font-serif">
                        <HighlightedText text={q.text} highlight={searchQuery} />
                      </div>

                      {/* Display Question type */}
                      {!isSubjective && !isOral ? (
                        /* Multiple Choice */
                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt, oIdx) => {
                            const isChosenByOffline = currentOfflineChoice === oIdx;
                            const isCorrect = q.correctIndex === oIdx;
                            const showAnswerColors = hasAnswered;

                            let optionClass = "bg-slate-950 border-white/5 text-slate-450 hover:border-white/10 hover:bg-slate-800/30";
                            
                            if (showAnswerColors) {
                              if (isCorrect) {
                                optionClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold";
                              } else if (isChosenByOffline) {
                                optionClass = "bg-red-500/10 border-red-500/30 text-red-400";
                              }
                            } else if (isChosenByOffline) {
                              optionClass = "bg-brand-gold/10 border-brand-gold/30 text-brand-gold";
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={hasAnswered}
                                onClick={() => handleTryAnswer(q.id ?? '', oIdx)}
                                className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${optionClass}`}
                              >
                                <span>
                                  <span className="opacity-40 italic mr-2">{['A', 'B', 'C', 'D', 'E'][oIdx] || oIdx + 1}.</span>
                                  <HighlightedText text={opt} highlight={searchQuery} />
                                </span>

                                {showAnswerColors && isCorrect && <CheckCircle2 size={13} className="text-emerald-400" />}
                                {showAnswerColors && isChosenByOffline && !isCorrect && <XCircle size={13} className="text-red-400" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Case Law / Subjetiva / Oral */
                        <div className="p-3 bg-slate-950 border border-white/5 rounded-xl space-y-2">
                          <span className="text-[10px] font-black uppercase text-brand-gold flex items-center gap-1">
                            <AlertTriangle size={12} className="text-brand-gold animate-pulse" />
                            Ambiente de Estudo Prático / Oral
                          </span>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Esta questão representa um caso prático discursivo ou arguição oral simulada realizada com feedback e critérios de pontuação da ATHENA. O espelho com critérios e orientações completas está documentado na explicação abaixo.
                          </p>
                        </div>
                      )}

                      {/* Explanation details */}
                      {(hasAnswered || isSubjective || isOral) && (
                        <div className="p-4 bg-slate-950/80 rounded-xl border border-brand-gold/15 space-y-2 animate-in fade-in duration-250">
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-gold block-title flex items-center gap-1.5">
                            <BookOpen size={12} className="text-brand-gold" />
                            Gabarito & Espelho de Correção (Offline)
                          </span>
                          
                          <div className="text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-line max-h-48 overflow-y-auto pr-1 parsed-explanation">
                            <ReactMarkdown>{q.explanation}</ReactMarkdown>
                          </div>

                          {/* Evaluation feedback if cached under question.evaluation */}
                          {q.evaluation && (
                            <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <Award size={12} className="text-emerald-400" />
                                Nota Atribuída: {q.evaluation.finalScore?.toFixed(2) ?? '8.00'} / 10.00
                              </span>
                              
                              {q.evaluation.feedback && (
                                <p className="text-[10px] text-slate-400 italic">
                                  " {q.evaluation.feedback} "
                                </p>
                              )}
                            </div>
                          )}

                          {/* Try again (for Objective multiple choice questions) */}
                          {!isSubjective && !isOral && (
                            <button
                              onClick={() => {
                                setOfflineAnswers(prev => {
                                  const copy = { ...prev };
                                  delete copy[q.id ?? ''];
                                  return copy;
                                });
                              }}
                              className="mt-2 text-[9px] font-black uppercase tracking-widest text-brand-gold hover:text-brand-gold/80 block outline-none"
                            >
                              Tentar Novamente (Limpar Resposta)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
