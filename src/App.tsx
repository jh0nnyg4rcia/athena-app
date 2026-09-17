/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Send, 
  BookOpen, 
  Trophy, 
  Layers, 
  Zap, 
  MessageSquare,
  History,
  Menu,
  X,
  Target,
  FileSearch,
  Sparkles,
  ChevronRight,
  Clock,
  ShieldAlert,
  Gavel,
  Users,
  Plus,
  Trash2,
  LogOut,
  BarChart2,
  Paperclip,
  FileText,
  Library,
  Settings2,
  Columns,
  RotateCw,
  Database,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Circle,
  Square,
  Mic,
  Volume1,
  FastForward,
  Lock,
  Unlock,
  AlertTriangle,
  Cpu,
  Key,
  Check,
  Activity
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { memo } from 'react';
import { askATHENA, evaluateAnswer, getGeminiApiKey, setCustomApiKey, isNativeMobile, testGeminiConnection, type GeminiConnectionTestResult } from './services/geminiService';
import { TRILHA_JURIDICA_DATA } from './data/trilhaData';
import { calcularIncidenciaParaMaterias } from './utils/incidenciaUtils';
import { type UserProfile } from './types';
import { getCachedTrilhaPart, setCachedTrilhaPart } from './services/trilhaCacheService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  orderBy,
  where
} from 'firebase/firestore';
import { 
  db, 
  auth, 
  signInWithGoogle, 
  logOut, 
  handleFirestoreError, 
  OperationType, 
  cleanData,
  isQuotaExhausted,
  setQuotaExhausted 
} from './lib/firebase';
import { StatsChart } from './components/StatsChart';
import { ReviewList } from './components/ReviewList';
import { IncidenceChart } from './components/IncidenceChart';
import { cacheArticle, cacheQuestion } from './services/localCache';
import { OfflineKnowledgeBase } from './components/OfflineKnowledgeBase';
import { LocalPersistence } from './services/localPersistence';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'model';
  content: string;
  challenge?: ChallengeData;
  editalData?: EditalData;
  blocks?: string[];
  currentBlockIndex?: number;
  article?: number;
  subject?: string | null;
  answers?: Record<number, number>; // Map of questionIndex to selected answer index
  evaluations?: Record<number, {
    userAnswer: string;
    scores?: Record<string, number>;
    finalScore?: number;
    feedback?: string;
  }>;
  sourceType?: 'gemini' | 'offline_pareto';
  modelName?: string;
}

const getIsInstructionMessage = (msg: Message): boolean => {
  const isUser = msg.role === 'user';
  return isUser && (
    msg.content.includes('ATHENA, conforme nosso cronograma') ||
    msg.content.startsWith('[SIMULADOR') ||
    msg.content.startsWith('[INSTRUÇÃO') ||
    msg.content.startsWith('ATHENA, inicie o Módulo de Estudo') ||
    msg.content.includes('vamos iniciar o estudo EXAUSTIVO do tema') ||
    msg.content.includes('vamos realizar o re-estudo científico de uma questão') ||
    (msg.content.startsWith('ATHENA, pule para o Artigo') && msg.content.includes('da'))
  );
};

interface EditalData {
  title: string;
  raioX: {
    subject: string;
    topic: string;
    incidence: number;
    level: string;
  }[];
  cronograma: {
    dia: string;
    disciplina: string;
    topico: string;
    fontes: string;
    questoes: number;
    reviews?: any[];
  }[];
}

interface Schedule {
  id: string;
  title: string;
  raioX: any[];
  cronograma: {
    dia: string;
    disciplina: string;
    topico: string;
    fontes: string;
    questoes: number;
    reviews?: any[];
  }[];
  createdAt: number;
  completedIndices?: number[];
}

export interface Question {
  id?: string;
  subject?: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ChallengeData {
  questions: Question[];
}

interface Review {
  id: string;
  sessionId: string;
  subject: string;
  article: number;
  content: string;
  timestamp: number;
}

interface UserStat {
  subjectName: string;
  correctAnswers: number;
  totalQuestions: number;
  progress: number;
  xp: number;
}

interface GamificationData {
  totalXP: number;
  level: number;
  streak: number;
  lastActive: number;
  completedThemes: string[];
}

interface Mentee {
  id: string;
  displayName: string;
  photoURL?: string;
  email: string;
  stats: UserStat[];
  gamification?: GamificationData;
}

interface FailedQuestion extends Question {
  id: string;
  userId: string;
  timestamp: number;
  originalArticle?: number;
}

const MemoizedMarkdown = memo(({ content }: { content: string }) => (
  <ReactMarkdown>{content}</ReactMarkdown>
));

MemoizedMarkdown.displayName = 'MemoizedMarkdown';

function QuizQuestion({ 
  question, 
  onAnswer, 
  savedAnswer,
  savedEvaluation,
  onEvaluate,
  hideExplanationInitially = false,
  userName = "Mestre",
  onDelete
}: { 
  question: Question, 
  onAnswer?: (index: number, correct: boolean) => void,
  savedAnswer?: number,
  savedEvaluation?: {
    userAnswer: string;
    scores?: Record<string, number>;
    finalScore?: number;
    feedback?: string;
  },
  onEvaluate?: (userAnswer: string, evaluation: any) => void,
  hideExplanationInitially?: boolean,
  userName?: string,
  onDelete?: () => void
}) {
  const [selected, setSelected] = useState<number | null>(savedAnswer ?? null);
  const [showExplanation, setShowExplanation] = useState(savedAnswer !== undefined && !hideExplanationInitially);

  const [typedAnswer, setTypedAnswer] = useState(savedEvaluation?.userAnswer ?? "");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(savedEvaluation ?? null);

  // Audio system state and refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const selfAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSttSupported, setIsSttSupported] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [questionSpeechRate, setQuestionSpeechRate] = useState(1.0);
  const [micError, setMicError] = useState<string | null>(null);

  // Check SpeechRecognition support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSttSupported(!!SpeechRecognition);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (selfAudioPlayerRef.current) {
        selfAudioPlayerRef.current.pause();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const formatRecordingTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startOralRecording = async () => {
    setAudioUrl(null);
    setIsPlayingAudio(false);
    audioChunksRef.current = [];
    setRecordingDuration(0);
    setMicError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não possui suporte para capturar áudio ou você está acessando sob protocolo não-seguro (HTTP). Certifique-se de usar HTTPS ou abrir em uma aba segura.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        let startText = typedAnswer;
        if (startText.trim()) {
          startText += "\n";
        }

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            startText += finalTranscript + " ";
            setTypedAnswer(startText);
          }
        };

        recognition.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
        };

        recognition.start();
      }
    } catch (err: any) {
      console.error("Erro ao acessar microfone:", err);
      let errorMsg = "Não foi possível acessar seu microfone.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('denied') || err.message?.includes('Permission')) {
        errorMsg = "Permissão ao microfone negada. Clique no ícone de cadeado (ao lado da URL do navegador) para permitir o uso de microfone. DICA: Por estar sendo visualizado na pré-visualização, clique em 'Abrir em nova aba'/ícone de nova aba no topo para poder autorizar e utilizar o microfone diretamente e de forma segura!";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = "Nenhum microfone físico ou dispositivo de captura foi encontrado. Conecte um fone de ouvido ou microfone e tente novamente.";
      } else {
        errorMsg = `Erro de captura: ${err.message || err}`;
      }
      setMicError(errorMsg);
    }
  };

  const stopOralRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const togglePlaySelfAudio = () => {
    if (!audioUrl) return;

    if (!selfAudioPlayerRef.current) {
      const audio = new Audio(audioUrl);
      selfAudioPlayerRef.current = audio;
      audio.onended = () => {
        setIsPlayingAudio(false);
      };
    }

    if (isPlayingAudio) {
      selfAudioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsPlayingQuestion(false);
      }
      selfAudioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const clearSelfAudio = () => {
    if (selfAudioPlayerRef.current) {
      selfAudioPlayerRef.current.pause();
      selfAudioPlayerRef.current = null;
    }
    setAudioUrl(null);
    setIsPlayingAudio(false);
  };

  // Speaks the question
  const toggleSpeakQuestion = () => {
    if (isPlayingQuestion) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingQuestion(false);
    } else {
      if (selfAudioPlayerRef.current) {
        selfAudioPlayerRef.current.pause();
        setIsPlayingAudio(false);
      }
      speakQuestion(questionSpeechRate);
    }
  };

  const speakQuestion = (rate: number) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    setIsPlayingQuestion(true);
    const cleanText = question.text
      .replace(/[\#\*\_]/g, '')
      .replace(/\n+/g, ' ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    utterance.rate = rate;

    // Try finding Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes("pt") || v.lang.includes("PT"));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onend = () => setIsPlayingQuestion(false);
    utterance.onerror = () => setIsPlayingQuestion(false);
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (savedAnswer !== undefined && selected === null) {
      setSelected(savedAnswer);
      setShowExplanation(!hideExplanationInitially);
    }
  }, [savedAnswer, selected, hideExplanationInitially]);

  useEffect(() => {
    if (savedEvaluation) {
      setEvaluation(savedEvaluation);
      setTypedAnswer(savedEvaluation.userAnswer);
    }
  }, [savedEvaluation]);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    const isCorrect = index === question.correctIndex;
    setSelected(index);
    if (onAnswer) onAnswer(index, isCorrect);
    // Add a small delay for dramatic effect before showing explanation
    setTimeout(() => setShowExplanation(true), 400);
  };

  const isSubjective = question.correctIndex === -1;
  const isOral = question.correctIndex === -2;

  const handleEvaluateSubmit = async () => {
    if (!typedAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await evaluateAnswer(
        question.text,
        typedAnswer,
        question.explanation,
        isSubjective ? 'subjetiva' : 'oral',
        userName
      );
      if (res && res.evaluation) {
        setEvaluation(structuredClone(res.evaluation));
        if (onEvaluate) {
          onEvaluate(typedAnswer, res.evaluation);
        }
        if (onAnswer) {
          onAnswer(isSubjective ? -1 : -2, res.evaluation.finalScore >= 6.0);
        }
      } else {
        const fallbackEval = {
          userAnswer: typedAnswer,
          feedback: res.text,
          scores: isSubjective ? { tecnico: 7.0, estrutura: 7.0, linguagem: 7.0 } : { materia: 7.0, eloquencia: 7.0 },
          finalScore: 7.0
        };
        setEvaluation(fallbackEval);
        if (onEvaluate) onEvaluate(typedAnswer, fallbackEval);
        if (onAnswer) onAnswer(isSubjective ? -1 : -2, true);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (isSubjective || isOral) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 mt-4 p-4 lg:p-6 bg-slate-800/40 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold/30 group-hover:bg-brand-gold transition-colors" />
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-gold/10 rounded-lg">
              <Trophy className="text-brand-gold" size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold/80">
              {isSubjective ? "Arguição Discursiva (2ª Fase)" : "Prova Oral Simulada (3ª Fase)"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-950 rounded-lg border border-red-500/20 hover:border-transparent transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2"
                title="Excluir lição dos erros"
              >
                <Trash2 size={12} />
                <span>Excluir</span>
              </button>
            )}

            {evaluation && (
              <span className={cn(
                "text-xs font-bold uppercase py-1 px-3 rounded-full border flex items-center gap-1.5",
                evaluation.finalScore >= 6.0 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                Nota: {evaluation.finalScore?.toFixed(2)} / 10.00
              </span>
            )}
          </div>
        </div>
        
        <h3 className="text-xl font-serif font-bold text-slate-100 leading-tight">
          {question.text}
        </h3>

        {/* Examiner Audio controls (Text-to-Speech) */}
        <div className="flex flex-wrap items-center gap-3 p-3.5 bg-slate-900/40 rounded-2xl border border-white/5 mt-3">
          <button
            type="button"
            onClick={toggleSpeakQuestion}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition duration-200 cursor-pointer",
              isPlayingQuestion 
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25" 
                : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20"
            )}
          >
            {isPlayingQuestion ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isPlayingQuestion ? "Silenciar Pergunta" : "Ouvir Examinador (Áudio)"}
          </button>
          
          {isPlayingQuestion && (
            <div className="flex items-center gap-1.5 px-2">
              <span className="w-1.5 h-3 bg-brand-gold/75 rounded-full animate-[bounce_0.8s_infinite_100ms]" />
              <span className="w-1.5 h-4 bg-brand-gold/90 rounded-full animate-[bounce_0.8s_infinite_200ms]" />
              <span className="w-1.5 h-2.5 bg-brand-gold/60 rounded-full animate-[bounce_0.8s_infinite_300ms]" />
              <span className="w-1.5 h-4 bg-brand-gold/80 rounded-full animate-[bounce_0.8s_infinite_400ms]" />
              <span className="w-1.5 h-2.5 bg-brand-gold/50 rounded-full animate-[bounce_0.8s_infinite_500ms]" />
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Velocidade:</span>
            {[1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  setQuestionSpeechRate(rate);
                  if (isPlayingQuestion) {
                    speakQuestion(rate);
                  }
                }}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold transition",
                  questionSpeechRate === rate 
                    ? "bg-brand-gold text-slate-950" 
                    : "text-slate-450 hover:text-slate-200"
                )}
              >
                {rate.toFixed(2)}x
              </button>
            ))}
          </div>
        </div>

        {!evaluation ? (
          <div className="space-y-4 mt-4">
            <div className="relative">
              <textarea
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder={isSubjective 
                  ? "Desenvolva sua fundamentação jurídica de forma estruturada: 1) Resumo temático, 2) Embasamento legal e jurisprudencial, e 3) Conclusão do parecer..." 
                  : "Esboce os tópicos que você arguiria oralmente ou digite na íntegra seu discurso à banca (ex: 'Excelência, em resposta ao questionamento, colaciona-se o entendimento do STF...')"
                }
                rows={8}
                disabled={isEvaluating}
                className="w-full bg-slate-900/80 text-sm text-slate-200 border border-white/5 rounded-2xl p-4 lg:p-5 focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 outline-none transition duration-300 resize-y leading-relaxed font-sans shadow-inner placeholder:text-slate-500 disabled:opacity-50"
              />
              {isOral && (
                <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono select-none pointer-events-none">
                  Foco: Dicção & Fundamentação Expressa
                </div>
              )}
            </div>

            {/* Mic / Audio controls for response dictate and recorder */}
            <div className="flex flex-col gap-3.5 p-4 bg-slate-900/40 rounded-2xl border border-white/5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full bg-brand-gold", isRecording && "animate-ping")} />
                  {isOral ? "Sustentação Verbal & Gravação" : "Ditado por Voz Inteligente"}
                </span>
                {isRecording && (
                  <span className="text-xs font-mono text-red-500 font-bold bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    GRAVANDO: {formatRecordingTime(recordingDuration)}
                  </span>
                )}
              </div>

              {micError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 leading-relaxed font-sans flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    Acesso ao Microfone Impedido
                  </div>
                  <p>{micError}</p>
                  <button 
                    type="button" 
                    onClick={() => setMicError(null)} 
                    className="self-end text-[10px] text-red-400 hover:text-red-200 underline cursor-pointer"
                  >
                    Ignorar Aviso
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startOralRecording}
                    disabled={isEvaluating}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
                  >
                    <Mic size={14} className="animate-pulse" />
                    Iniciar Resposta Gravada
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopOralRecording}
                    className="px-4 py-2.5 bg-slate-950 text-red-400 border border-red-500/50 hover:bg-red-955 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer font-mono"
                  >
                    <Square size={14} className="fill-red-500 animate-pulse" />
                    Parar e Concluir Resposta
                  </button>
                )}

                {audioUrl && !isRecording && (
                  <div className="flex flex-wrap items-center gap-3 p-1 px-1.5 bg-slate-950/50 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={togglePlaySelfAudio}
                      className="p-2 bg-brand-gold text-slate-950 rounded-lg hover:bg-brand-gold/85 transition cursor-pointer flex items-center justify-center"
                      title="Ouvir minha gravação de resposta"
                    >
                      {isPlayingAudio ? <Pause size={12} className="fill-slate-950" /> : <Play size={12} className="fill-slate-950" />}
                    </button>
                    <span className="text-xs text-slate-300 font-medium">Sua Gravação</span>
                    
                    {isPlayingAudio && (
                      <div className="flex items-center gap-1 px-1">
                        <span className="w-1 h-2 bg-emerald-400/90 rounded-full animate-[bounce_0.6s_infinite_50ms]" />
                        <span className="w-1 h-3.5 bg-emerald-400/100 rounded-full animate-[bounce_0.6s_infinite_150ms]" />
                        <span className="w-1 h-2 bg-emerald-400/80 rounded-full animate-[bounce_0.6s_infinite_250ms]" />
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={clearSelfAudio}
                      className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      title="Apagar gravação"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
                
                {!isSttSupported && (
                  <span className="text-[10px] text-slate-500 ml-auto">
                    * Transcrição não suportada neste navegador
                  </span>
                )}
                {isSttSupported && isRecording && (
                  <span className="text-[11px] text-brand-gold/80 italic animate-pulse ml-auto flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    Transcrevendo discurso oral na caixa de texto...
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleEvaluateSubmit}
                disabled={isEvaluating || !typedAnswer.trim()}
                className="relative overflow-hidden group/sub-btn bg-brand-gold text-slate-950 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-[0_10px_25px_-5px_rgba(212,175,55,0.3)] flex items-center gap-2"
              >
                {isEvaluating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Banca Avaliando...
                  </>
                ) : (
                  <>
                    <Zap size={14} className="fill-slate-950/20 animate-pulse" />
                    Submeter à Banca Examinadora
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900/30 rounded-2xl border border-white/5 text-xs text-slate-400">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Sua Manifestação</span>
              <p className="whitespace-pre-wrap italic leading-relaxed font-sans text-slate-300">"{evaluation.userAnswer || typedAnswer}"</p>
            </div>

            <div className="bg-slate-900/80 border border-brand-gold/15 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
              <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                <Gavel className="text-brand-gold" size={14} />
                Ficha de Avaliação Oficial da Banca
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-white/5 shadow-md shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resultado Final</span>
                  <div className="text-3xl font-serif font-black text-brand-gold mt-2">
                    {evaluation.finalScore?.toFixed(1) || "0.0"}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full",
                    (evaluation.finalScore || 0) >= 6.0 ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                  )}>
                    {(evaluation.finalScore || 0) >= 6.0 ? "APROVADO" : "REPROVADO"}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Critérios Analíticos</span>
                  {evaluation.scores && Object.entries(evaluation.scores).map(([crit, val]: [string, any]) => (
                    <div key={crit} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 capitalize font-medium">
                          {crit === 'tecnico' ? 'Fundamentação Técnica' : 
                           crit === 'estrutura' ? 'Estrutura Redacional' : 
                           crit === 'linguagem' ? 'Norma Culta & Expressão' : 
                           crit === 'materia' ? 'Domínio da Matéria' : 
                           crit === 'eloquencia' ? 'Eloquência e Dicção' : 
                           crit === 'citacoes' ? 'Citação de Súmulas/Leis' : crit}
                        </span>
                        <span className="font-bold text-brand-gold">{val?.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-brand-gold rounded-full transition-all duration-1000" 
                          style={{ width: `${(val || 0) * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-xs text-slate-300 leading-relaxed space-y-2">
                <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500 block mb-1.5 flex items-center gap-1">
                  <Layers size={12} className="text-slate-500" />
                  Razões de Decisão (Crivo da Banca)
                </span>
                <p className="whitespace-pre-wrap leading-relaxed font-sans">{evaluation.feedback}</p>
              </div>
            </div>

            {evaluation.finalScore >= 6.0 && onDelete && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="px-6 py-3 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group shadow-xl active:scale-95 cursor-pointer font-bold"
                >
                  <span>Remover dos Erros e Continuar</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

            <div className="border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold/80 hover:text-brand-gold transition duration-200"
              >
                <BookOpen size={14} />
                {showExplanation ? "Ocultar Espelho de Correção" : "Visualizar Espelho de Correção Oficial"}
              </button>

              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl italic text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                      <span className="font-black text-[10px] uppercase tracking-wider text-slate-500 block mb-2 font-mono">Gabarito Esperado (Espelho de Notas Máximas)</span>
                      {question.explanation}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 lg:space-y-6 mt-4 p-4 lg:p-6 bg-slate-800/40 rounded-3xl border border-brand-gold/20 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold/30 group-hover:bg-brand-gold transition-colors" />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-gold/10 rounded-lg">
            <Trophy className="text-brand-gold" size={16} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold/80">Desafio ATHENA</span>
        </div>
        
        <div className="flex items-center gap-3">
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-950 rounded-lg border border-red-500/20 hover:border-transparent transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 z-10"
              title="Excluir lição dos erros"
            >
              <Trash2 size={12} />
              <span>Excluir</span>
            </button>
          )}

          {selected !== null && (
            <span className={cn(
              "text-[10px] font-bold uppercase py-1 px-3 rounded-full border flex items-center gap-1.5",
              selected === question.correctIndex 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            )}>
              {selected === question.correctIndex ? (
                <>
                  <Zap size={10} className="fill-emerald-400/20" />
                  Correto! +50 XP
                </>
              ) : (
                <>
                  <Zap size={10} className="fill-amber-400/20" />
                  Incorreto +10 XP
                </>
              )}
            </span>
          )}
        </div>
      </div>
      
      <h3 className="text-xl font-serif font-bold text-slate-100 leading-tight">
        {question.text}
      </h3>

      <div className="space-y-3">
        {question.options.map((opt, idx) => {
          const isCorrect = idx === question.correctIndex;
          const isSelected = selected === idx;
          
          let stateStyles = "bg-slate-900/60 border-white/5 hover:border-brand-gold/30 hover:bg-slate-800/80";
          if (selected !== null) {
            if (isCorrect) stateStyles = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/20";
            else if (isSelected) stateStyles = "bg-red-500/20 border-red-500/50 text-red-300 ring-2 ring-red-500/20";
            else stateStyles = "bg-slate-900/30 border-white/5 opacity-40 grayscale-[0.5]";
          }

          return (
            <motion.button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              whileHover={selected === null ? { x: 4 } : {}}
              animate={isSelected && !isCorrect ? { x: [-4, 4, -4, 4, 0] } : isSelected && isCorrect ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.4 }}
              className={cn(
                "w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 group/btn relative overflow-hidden",
                stateStyles
              )}
            >
              {isSelected && isCorrect && (
                <motion.div 
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                />
              )}
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all",
                selected !== null && isCorrect ? "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : 
                selected !== null && isSelected ? "bg-red-500 text-slate-950 shadow-[0_0_15px_rgba(239,68,68,0.4)]" : 
                "bg-slate-800 text-slate-400 group-hover/btn:bg-brand-gold group-hover/btn:text-slate-950"
              )}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="text-sm font-medium leading-relaxed flex-1">{opt}</span>
              {selected !== null && isCorrect && <Zap className="text-emerald-400 shrink-0" size={16} />}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 mt-2 border-t border-white/5"
          >
            <div className="flex flex-col gap-4 p-5 bg-slate-900/60 rounded-2xl border border-white/5 ring-1 ring-white/5 shadow-inner">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-brand-gold/10 rounded-full mt-1 shrink-0">
                  <BookOpen className="text-brand-gold" size={16} />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Entendimento Técnico</span>
                  <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-brand-gold/30 pl-4 py-1 font-sans">
                     {question.explanation}
                  </p>
                </div>
              </div>

              {selected === question.correctIndex && onDelete && (
                <div className="flex justify-end pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="px-6 py-3 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group shadow-xl active:scale-95 cursor-pointer font-bold"
                  >
                    <span>Remover dos Erros e Continuar</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ChatSession {
  id: string;
  title: string;
  userId: string;
  messages: Message[];
  guidedSubject: string | null;
  currentArticle: number;
  lastUpdatedAt: number;
  reviews?: Review[];
  trilhaDay?: number;
  trilhaMaterialIndex?: number;
  trilhaSessionType?: 'estudo' | 'discursivo' | 'oral';
}

const ChatMessage = memo(({ 
  msg, 
  msgIdx, 
  messages, 
  setMessages, 
  saveSession, 
  updateStats, 
  activeStudyItem, 
  setActiveStudyItem, 
  setActiveTab, 
  handleSendMessageRequest,
  advanceStage,
  reviews,
  saveReview,
  currentArticle,
  guidedSubject,
  markScheduleItemComplete,
  saveToSchedules,
  trilhaDay,
  trilhaMaterialIndex,
  trilhaTotalMaterials,
  skipTrilhaLesson,
  retryMessage
}: { 
  msg: Message,
  msgIdx: number,
  messages: Message[],
  setMessages: (msgs: Message[]) => void,
  saveSession: (data: any) => void,
  updateStats: (subject: string, correct: boolean, q: Question, answerIndex: number) => void,
  activeStudyItem: { scheduleId: string, itemIndex: number } | null,
  setActiveStudyItem: (item: any) => void,
  setActiveTab: (tab: any) => void,
  handleSendMessageRequest: (text: string, auto: boolean) => void,
  advanceStage: (idx: number) => void,
  reviews: Review[],
  saveReview: (idx: number) => void,
  currentArticle: number,
  guidedSubject: string | null,
  markScheduleItemComplete: (sId: string, idx: number) => Promise<void>,
  saveToSchedules: (data: EditalData) => Promise<void>,
  trilhaDay?: number,
  trilhaMaterialIndex?: number,
  trilhaTotalMaterials?: number,
  skipTrilhaLesson?: (idx: number) => Promise<void>,
  retryMessage?: (idx: number) => Promise<void>
}) => {
  const isUser = msg.role === 'user';
  const isError = !isUser && Boolean(
    msg.content && (
      msg.content.includes("problema na conexão") ||
      msg.content.includes("Detalhes do Erro") ||
      msg.content.includes("Tempo limite excedido") ||
      msg.content.includes("Não foi possível obter uma resposta") ||
      msg.content.toLowerCase().includes("meditando") ||
      msg.content.toLowerCase().includes("meditar") ||
      msg.content.toLowerCase().includes("tente novamente") ||
      msg.content.toLowerCase().includes("não carrega")
    )
  );
  
  const isInstruction = getIsInstructionMessage(msg);

  if (isInstruction) return null;
  
  return (
    <motion.div
      id={msg.subject && msg.article ? `review-${msg.subject.replace(/\s+/g, '-').toLowerCase()}-${msg.article}` : `msg-${msgIdx}`}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.05 
      }}
      className={cn(
        "flex flex-col gap-3",
        isUser ? "items-end" : "items-start"
      )}
    >
      {isUser && (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold pr-4">Comando Jurídico</span>
      )}
      
      <div className={cn(
        "max-w-[92%] lg:max-w-[85%] rounded-[2rem] p-5 lg:p-6 transition-all relative group",
        isUser 
          ? "bg-linear-to-br from-slate-900 to-slate-950 shadow-[0_20px_40px_-10px_rgba(212,175,55,0.2)] border-2 border-brand-gold/40 text-slate-100 font-medium" 
          : "bg-slate-900 shadow-2xl border border-white/5 text-slate-200"
      )}>
        {isUser && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 border border-brand-gold/30 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Users size={14} className="text-brand-gold" />
          </div>
        )}
        {!isUser && (
          <div className="absolute -top-4 -left-4 w-10 h-10 bg-brand-gold rounded-xl flex items-center justify-center shadow-lg border-2 border-slate-950 z-10 transition-transform group-hover:scale-110">
            <Scale size={20} className="text-slate-950" />
          </div>
        )}
        
        <div className="space-y-8">
          {!isUser && !isError && (
            <div className="flex items-center gap-2 -mt-1 -mb-3">
              {(msg.sourceType === 'offline_pareto' || msg.content?.includes("Modo de Alta Disponibilidade Local Ativado (Pareto 80/20)")) ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Modo Offline • Material Compilado (Pareto 80/20)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Gerado via IA Gemini ({msg.modelName || 'gemini-flash-latest'})</span>
                </div>
              )}
            </div>
          )}

          {!isUser && msg.blocks ? (
            <>
              {msg.blocks.slice(0, (msg.currentBlockIndex ?? 0) + 1).map((block, blockIdx) => (
                <motion.div 
                  key={blockIdx}
                  id={`block-${msgIdx}-${blockIdx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "markdown-body scroll-mt-24",
                    blockIdx > 0 && "pt-8 border-t border-white/10"
                  )}
                >
                  <MemoizedMarkdown content={block.replace(/\[ATHENA_AVAILABILITY\]/g, '')} />
                  
                  {blockIdx === msg.blocks.length - 1 && !isUser && (msg.content.includes('[ATHENA_AVAILABILITY]') || msg.content.toLowerCase().includes('2 horas ou 4 horas')) && msgIdx === messages.length - 1 && (
                    <div className="mt-10 p-6 bg-slate-900/50 border border-brand-gold/20 rounded-3xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-6 duration-700">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-6 flex items-center gap-2">
                        <Target size={12} className="text-brand-gold" />
                        Selecione sua disponibilidade
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => handleSendMessageRequest("Minha disponibilidade é de 2 horas diárias.", false)}
                          className="group flex-1 bg-slate-950 border-2 border-brand-gold/30 text-brand-gold hover:border-brand-gold hover:bg-brand-gold hover:text-slate-950 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-95 flex items-center justify-center gap-3"
                        >
                          <Clock size={20} className="group-hover:scale-110 transition-transform" />
                          2 Horas Diárias
                        </button>
                        <button
                          onClick={() => handleSendMessageRequest("Minha disponibilidade é de 4 horas diárias.", false)}
                          className="group flex-1 bg-brand-gold text-slate-950 hover:bg-white px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_15px_40px_rgba(212,175,55,0.3)] active:scale-95 flex items-center justify-center gap-3"
                        >
                          <Zap size={20} className="group-hover:scale-110 transition-transform" />
                          4 Horas Diárias
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {blockIdx === 4 && msg.challenge && (
                    <div className="mt-8">
                      {msg.challenge.questions.map((q, qIdx) => (
                        <QuizQuestion 
                          key={qIdx} 
                          question={q} 
                          savedAnswer={msg.answers?.[qIdx]}
                          savedEvaluation={msg.evaluations?.[qIdx]}
                          userName={auth.currentUser?.displayName || "Mestre"}
                          onEvaluate={(userAnswer, evalObj) => {
                            const updatedMessages = (messages || []).map((m, mIdx) => {
                              if (mIdx === msgIdx) {
                                return { 
                                  ...m, 
                                  evaluations: { 
                                    ...(m.evaluations || {}), 
                                    [qIdx]: {
                                      userAnswer,
                                      scores: evalObj.scores,
                                      finalScore: evalObj.finalScore,
                                      feedback: evalObj.feedback
                                    } 
                                  } 
                                };
                              }
                              return m;
                            });
                            setMessages(updatedMessages);
                            saveSession({ messages: updatedMessages });
                            // Cache to IndexedDB
                            cacheQuestion({
                              ...q,
                              subject: msg.subject || 'Conteúdo Geral'
                            }, msg.answers?.[qIdx], {
                              userAnswer,
                              scores: evalObj.scores,
                              finalScore: evalObj.finalScore,
                              feedback: evalObj.feedback
                            });
                          }}
                          onAnswer={(answerIndex, correct) => {
                            if (msg.subject) {
                              updateStats(msg.subject, correct, q, answerIndex);
                              
                              const updatedMessages = (messages || []).map((m, mIdx) => {
                                if (mIdx === msgIdx) {
                                  return { 
                                    ...m, 
                                    answers: { ...(m.answers || {}), [qIdx]: answerIndex } 
                                  };
                                }
                                return m;
                              });
                              setMessages(updatedMessages);
                              saveSession({ messages: updatedMessages });
                              // Cache to IndexedDB
                              cacheQuestion({
                                ...q,
                                subject: msg.subject || 'Conteúdo Geral'
                              }, answerIndex);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {msg.blocks && msg.blocks.length > 0 && (msg.currentBlockIndex ?? 0) === msg.blocks.length - 1 && msg.blocks[msg.blocks.length-1]?.toLowerCase().includes("concluído com sucesso") && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="pt-8 border-t border-white/10 flex justify-center"
                >
                  <button
                    onClick={async () => {
                      if (activeStudyItem) {
                        await markScheduleItemComplete(activeStudyItem.scheduleId, activeStudyItem.itemIndex);
                        setActiveStudyItem(null);
                      }
                      setActiveTab('schedules');
                      handleSendMessageRequest("Ótimo, o tema anterior foi concluído. Vamos seguir para o cronograma ou deseja revisitar algum ponto?", true);
                    }}
                    className="bg-brand-gold text-slate-950 font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl shadow-xl hover:shadow-brand-gold/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-2 border-slate-950"
                  >
                    <Zap size={18} className="animate-pulse" />
                    Avançar e Concluir Meta
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <div className="markdown-body">
              <MemoizedMarkdown content={(msg.content || '').replace(/\[ATHENA_AVAILABILITY\]/g, '')} />
              
              {!isUser && msg.content && (msg.content.includes('[ATHENA_AVAILABILITY]') || msg.content.toLowerCase().includes('2 horas ou 4 horas')) && msgIdx === messages.length - 1 && (
                <div className="mt-10 p-6 bg-slate-900/50 border border-brand-gold/20 rounded-3xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-6 flex items-center gap-2">
                    <Target size={12} className="text-brand-gold" />
                    Selecione sua disponibilidade
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => handleSendMessageRequest("Minha disponibilidade é de 2 horas diárias.", false)}
                      className="group flex-1 bg-slate-950 border-2 border-brand-gold/30 text-brand-gold hover:border-brand-gold hover:bg-brand-gold hover:text-slate-950 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Clock size={20} className="group-hover:scale-110 transition-transform" />
                      2 Horas Diárias
                    </button>
                    <button
                      onClick={() => handleSendMessageRequest("Minha disponibilidade é de 4 horas diárias.", false)}
                      className="group flex-1 bg-brand-gold text-slate-950 hover:bg-white px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_15px_40px_rgba(212,175,55,0.3)] active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Zap size={20} className="group-hover:scale-110 transition-transform" />
                      4 Horas Diárias
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isUser && msg.editalData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-8 p-6 bg-slate-900 border border-brand-gold/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold/0 via-brand-gold/40 to-brand-gold/0" />
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-slate-100">{msg.editalData.title}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Raio-X Estatístico de Performance</p>
                </div>
                <button
                  onClick={() => msg.editalData && saveToSchedules(msg.editalData)}
                  className="bg-brand-gold text-slate-950 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95"
                >
                  <Target size={14} />
                  Salvar Cronograma
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-serif font-bold text-brand-gold uppercase tracking-[0.2em] flex items-center gap-2">
                  <BarChart2 size={16} />
                  Incidência por Disciplina/Tema
                </h4>
                <Suspense fallback={<div className="h-44 bg-slate-950/40 rounded-3xl border border-white/5 animate-pulse flex items-center justify-center text-xs text-slate-500 font-medium">Processando mapa estocástico de incidência...</div>}>
                  <IncidenceChart data={msg.editalData.raioX} />
                </Suspense>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-serif font-bold text-brand-gold uppercase tracking-[0.2em] flex items-center gap-2">
                  <Target size={16} />
                  Cronograma Ciclo-Evolutivo
                </h4>
                <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-950/40 -mx-2 sm:mx-0">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-white/5">
                        <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Dia</th>
                        <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Disciplina</th>
                        <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tópico</th>
                        <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Questões</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {msg.editalData.cronograma.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-300 text-xs">{item.dia}</td>
                          <td className="px-5 py-4 text-brand-gold font-medium text-xs whitespace-nowrap">{item.disciplina}</td>
                          <td className="px-5 py-4 text-slate-400 text-[11px] leading-relaxed max-w-xs">{item.topico}</td>
                          <td className="px-5 py-4 text-center">
                            <div className="bg-brand-gold/10 text-brand-gold text-[10px] font-black py-1 px-2 rounded-lg border border-brand-gold/20 inline-block min-w-[32px]">
                              {item.questoes}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {!isUser && msg.blocks && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-4 flex flex-wrap gap-3"
            >
              {(msg.currentBlockIndex ?? 0) < msg.blocks.length - 1 ? (
                <div className="flex flex-wrap gap-3 items-center w-full pt-2">
                  {isError && retryMessage && (
                    <button
                      type="button"
                      onClick={() => retryMessage(msgIdx)}
                      className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white border border-blue-500/40 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group shadow-xl active:scale-95 cursor-pointer animate-pulse"
                    >
                      <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                      <span>Recarregar Lição</span>
                    </button>
                  )}

                  {!isError && (
                    <button
                      onClick={(e) => {
                        advanceStage(msgIdx);
                        setTimeout(() => {
                          e.currentTarget?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }, 120);
                      }}
                      className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-400 via-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] border border-amber-300/60 active:scale-98 transition-all cursor-pointer group"
                    >
                      <span className="font-extrabold tracking-wider">AVANÇAR BLOCO</span>
                      <ChevronRight size={18} className="group-hover:translate-x-1.5 transition-transform stroke-[2.5]" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full pt-2">
                  <div className="flex flex-wrap gap-3 items-center">
                    {isError && retryMessage && (
                      <button
                        type="button"
                        onClick={() => retryMessage(msgIdx)}
                        className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white border border-blue-500/40 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group shadow-xl active:scale-95 cursor-pointer animate-pulse"
                      >
                        <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span>Recarregar Lição</span>
                      </button>
                    )}

                    {!isError && trilhaDay !== undefined && trilhaMaterialIndex !== undefined && trilhaTotalMaterials !== undefined ? (
                      trilhaMaterialIndex < trilhaTotalMaterials - 1 ? (
                        <button
                          onClick={(e) => {
                            advanceStage(msgIdx);
                            setTimeout(() => {
                              e.currentTarget?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                            }, 120);
                          }}
                          className="w-full sm:w-auto min-w-[260px] flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-400 via-brand-gold to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] border border-amber-300/60 active:scale-98 transition-all cursor-pointer group"
                        >
                          <span className="font-extrabold tracking-wider">
                            IR PARA PARTE {trilhaMaterialIndex + 2} DE {trilhaTotalMaterials}
                          </span>
                          <ChevronRight size={18} className="group-hover:translate-x-1.5 transition-transform stroke-[2.5]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => advanceStage(msgIdx)}
                          className="w-full sm:w-auto min-w-[260px] flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.35)] active:scale-98 transition-all cursor-pointer group"
                        >
                          <span>CONCLUIR DIA {trilhaDay} DA TRILHA</span>
                          <Trophy size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                      )
                    ) : !isError && msg.subject ? (
                      <button
                        onClick={() => advanceStage(msgIdx)}
                        className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.35)] active:scale-98 transition-all cursor-pointer group"
                      >
                        <span>Aprofundar Estudo: Art. {(msg.article || 0) + 1}</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default function App() {
  const [user, setUser] = useState<User | any | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showCeoModal, setShowCeoModal] = useState(false);
  const [ceoPinInput, setCeoPinInput] = useState('');
  const [ceoPinError, setCeoPinError] = useState<string | null>(null);

  const handleLoginAsCEO = () => {
    const ceoUser = {
      uid: 'jhonny-spider-ceo',
      displayName: 'Jhonny (CEO)',
      email: 'jhonny.spider@gmail.com',
      photoURL: '',
      emailVerified: true
    };
    localStorage.setItem('athena_local_user', JSON.stringify(ceoUser));
    setUser(ceoUser as any);
    setAuthError(null);
  };

  const handleVerifyCeoPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (ceoPinInput.trim() === '7777') {
      handleLoginAsCEO();
      setShowCeoModal(false);
      setCeoPinInput('');
      setCeoPinError(null);
    } else {
      setCeoPinError('PIN de segurança incorreto. Acesso exclusivo ao Administrador.');
    }
  };

  const handleLoginAsGuest = () => {
    const guestUser = {
      uid: `aluno-${Date.now()}`,
      displayName: 'Aluno(a) ATHENA',
      email: 'aluno@athena.app',
      photoURL: '',
      emailVerified: false
    };
    localStorage.setItem('athena_local_user', JSON.stringify(guestUser));
    setUser(guestUser as any);
    setAuthError(null);
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn("Erro ao fazer login com Google:", err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setAuthError("Domínio não autorizado no Firebase. Para testar imediatamente no celular ou navegador, clique em 'Entrar como Aluno'.");
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError("A janela do Google foi fechada antes de concluir o login.");
      } else if (isNativeMobile() || err?.code === 'auth/operation-not-supported-in-this-environment') {
        setAuthError("O Google Sign-In no Android exige certificado SHA-1 no Firebase Console. Para testar o app agora mesmo com 7 dias de acesso grátis, clique em 'Entrar como Aluno' abaixo.");
      } else {
        setAuthError(err?.message || "Não foi possível conectar com o Google no momento. Utilize o acesso de Aluno abaixo.");
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('athena_local_user');
    try {
      await logOut();
    } catch (e) {}
    setUser(null);
  };

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [navInput, setNavInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSendFeedback, setShowSendFeedback] = useState(false);
  const [guidedSubject, setGuidedSubject] = useState<string | null>(null);
  const [currentArticle, setCurrentArticle] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'stats' | 'reviews' | 'mentees' | 'schedules' | 'trilha'>('chat');
  const [trilhaCompletedDays, setTrilhaCompletedDays] = useState<number[]>([]);
  const [selectedTrilhaWeek, setSelectedTrilhaWeek] = useState<number>(1);
  const [dashboardDay, setDashboardDay] = useState<number | null>(null);
  const reviews = useMemo(() => {
    const all: Review[] = [];
    sessions.forEach(s => {
      if (s.reviews) all.push(...s.reviews);
    });
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }, [sessions]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [gamification, setGamification] = useState<GamificationData>({
    totalXP: 0,
    level: 1,
    streak: 0,
    lastActive: Date.now(),
    completedThemes: []
  });
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [failedQuestions, setFailedQuestions] = useState<FailedQuestion[]>([]);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string, mimeType: string, data: string } | null>(null);
  const [visibleSchedulesColumns, setVisibleSchedulesColumns] = useState<string[]>(['dia', 'disciplina', 'topico', 'questoes']);
  const [activeStudyItem, setActiveStudyItem] = useState<{ scheduleId: string, itemIndex: number } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);
  const [inspectedTrilhaFonte, setInspectedTrilhaFonte] = useState<{ dia: number; title: string; content: string } | null>(null);
  const [firestoreQuotaReached, setFirestoreQuotaReached] = useState(() => isQuotaExhausted());
  const saveSessionDebounceRef = useRef<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onQuota = () => setFirestoreQuotaReached(true);
    window.addEventListener('firestore-quota-exceeded', onQuota);
    return () => window.removeEventListener('firestore-quota-exceeded', onQuota);
  }, []);

  const CEO_EMAIL = 'jhonny.spider@gmail.com';

  const userProfile: UserProfile | null = useMemo(() => {
    if (!user) return null;
    const isCeoUser = user.email?.toLowerCase().trim() === CEO_EMAIL.toLowerCase();
    if (isCeoUser) {
      return {
        uid: user.uid,
        email: user.email || CEO_EMAIL,
        displayName: user.displayName || 'Mestre CEO (Jhonny)',
        photoURL: user.photoURL || '',
        role: 'ceo',
        profile: 'custom',
        allowedPhases: ['objetiva', 'subjetiva', 'oral'],
        isTrialMode: false,
      };
    }
    const savedTrial = localStorage.getItem(`athena_trial_mode_${user.uid}`);
    const isTrial = savedTrial !== null ? savedTrial === 'true' : true;
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Aluno ATHENA',
      photoURL: user.photoURL || '',
      role: 'default',
      profile: 'automatic',
      allowedPhases: ['objetiva'],
      isTrialMode: isTrial,
    };
  }, [user]);

  const isCEO = userProfile?.role === 'ceo' || user?.email?.toLowerCase().trim() === CEO_EMAIL.toLowerCase();

  const [tokenExhaustedBanner, setTokenExhaustedBanner] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  const [mentorshipStyle, setMentorshipStyle] = useState<'teorico' | 'jurisprudente' | 'pratico' | 'automatico'>(() => {
    return (localStorage.getItem('athena_mentorship_style') as any) || 'automatico';
  });

  const [mentorshipPhase, setMentorshipPhase] = useState<'objetiva' | 'subjetiva' | 'oral'>(() => {
    return (localStorage.getItem('athena_mentorship_phase') as any) || 'objetiva';
  });

  const hasCompletedDay50 = trilhaCompletedDays.includes(50) || trilhaCompletedDays.length >= 50;
  const hasCompletedDay75 = trilhaCompletedDays.includes(75) || trilhaCompletedDays.length >= 75;

  useEffect(() => {
    if (!user) return;
    if (mentorshipPhase !== 'objetiva' && !isCEO) {
      setMentorshipPhase('objetiva');
    }
  }, [mentorshipPhase, user, isCEO]);

  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [customApiKeyInput, setCustomApiKeyInput] = useState(() => getGeminiApiKey());
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const [testAiLoading, setTestAiLoading] = useState(false);
  const [testAiResult, setTestAiResult] = useState<GeminiConnectionTestResult | null>(null);

  const handleTestGeminiConnection = async () => {
    setTestAiLoading(true);
    setTestAiResult(null);
    try {
      const res = await testGeminiConnection();
      setTestAiResult(res);
    } catch (err: any) {
      setTestAiResult({
        success: false,
        model: "Falha Geral",
        latencyMs: 0,
        message: err?.message || err?.toString() || "Erro desconhecido ao testar conexão.",
        apiKeyPreview: ""
      });
    } finally {
      setTestAiLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('athena_mentorship_style', mentorshipStyle);
  }, [mentorshipStyle]);

  useEffect(() => {
    localStorage.setItem('athena_mentorship_phase', mentorshipPhase);
  }, [mentorshipPhase]);

  // Scroll Listener for FAB
  useEffect(() => {
    const handleScroll = (e: any) => {
      if (e.target.scrollTop > 500) setShowScrollTop(true);
      else setShowScrollTop(false);
    };
    const mainContent = document.getElementById('main-scroller');
    mainContent?.addEventListener('scroll', handleScroll);
    return () => mainContent?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    document.getElementById('main-scroller')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Observer
  useEffect(() => {
    // 1. Tenta restaurar sessão local se existir
    const savedLocalUser = localStorage.getItem('athena_local_user');
    if (savedLocalUser) {
      try {
        const parsed = JSON.parse(savedLocalUser);
        setUser(parsed);
        setLoadingAuth(false);
      } catch (e) {
        console.warn("Erro ao restaurar usuário local:", e);
      }
    } else {
      // Nenhum usuário local persistido: aguarda autenticação oficial via Google Sign-In
      setLoadingAuth(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        localStorage.removeItem('athena_local_user');
      } else if (!localStorage.getItem('athena_local_user')) {
        setUser(null);
      }
      setLoadingAuth(false);

      if (u && !isQuotaExhausted()) {
        // Save user profile to Firestore only once per session to preserve quota
        const syncKey = `lastLoginSynced_${u.uid}`;
        if (!sessionStorage.getItem(syncKey)) {
          sessionStorage.setItem(syncKey, 'true');
          const userRef = doc(db, 'users', u.uid);
          try {
            const cleaned = cleanData({
              displayName: u.displayName || 'Usuário',
              email: u.email || '',
              photoURL: u.photoURL || '',
              lastLogin: Date.now()
            });
            await setDoc(userRef, cleaned, { merge: true });
          } catch (error) {
            console.warn("Notice: User profile sync postponed (resilient local mode active):", error);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Sessions from Firestore + Local Cache
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
      return;
    }

    // 1. Preload instantly from LocalPersistence
    const localSessions = LocalPersistence.getSessions(user.uid);
    if (localSessions.length > 0) {
      setSessions(localSessions);
      if (!currentSessionId) {
        const last = localSessions[0];
        setCurrentSessionId(last.id);
        setMessages(last.messages || []);
        setGuidedSubject(last.guidedSubject || null);
        setCurrentArticle(last.currentArticle || 1);
      }
    }

    // 2. Attach Firestore onSnapshot listener only if Firebase Auth is signed in
    if (!auth.currentUser || isQuotaExhausted()) {
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/sessions`),
      where('userId', '==', user.uid),
      orderBy('lastUpdatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
      if (docs.length > 0) {
        setSessions(docs);
        docs.forEach(s => LocalPersistence.saveSession(user.uid, s));
        
        if (!currentSessionId) {
          const last = docs[0];
          setCurrentSessionId(last.id);
          setMessages(last.messages);
          setGuidedSubject(last.guidedSubject);
          setCurrentArticle(last.currentArticle);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sessions`);
      // Keep local sessions active on quota or network error
      const fallback = LocalPersistence.getSessions(user.uid);
      if (fallback.length > 0 && sessions.length === 0) {
        setSessions(fallback);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Statistics and Schedules
  useEffect(() => {
    if (!user) {
      setUserStats([]);
      return;
    }

    // Preload instantly from LocalPersistence
    const localStats = LocalPersistence.getStats(user.uid);
    if (localStats.length > 0) setUserStats(localStats);

    const localGami = LocalPersistence.getGamification(user.uid);
    if (localGami) setGamification(localGami);

    const localScheds = LocalPersistence.getSchedules(user.uid);
    if (localScheds.length > 0) setSchedules(localScheds);

    const localFailed = LocalPersistence.getFailedQuestions(user.uid);
    if (localFailed.length > 0) setFailedQuestions(localFailed);

    const localTrilha = LocalPersistence.getTrilhaProgress(user.uid);
    if (localTrilha.length > 0) setTrilhaCompletedDays(localTrilha);

    // Attach Firestore listeners only if Firebase Auth is signed in
    if (!auth.currentUser || isQuotaExhausted()) {
      return;
    }

    // Stats
    const statsRef = collection(db, `users/${user.uid}/stats`);
    const qStats = query(statsRef, where('userId', '==', user.uid));
    const unsubStats = onSnapshot(qStats, (snapshot) => {
      const stats = snapshot.docs.map(doc => doc.data() as UserStat);
      setUserStats(stats);
      stats.forEach(st => LocalPersistence.saveStat(user.uid, st));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/stats`));

    // Gamification
    const gamiRef = doc(db, `users/${user.uid}/gamification`, 'status');
    const unsubGami = onSnapshot(gamiRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as GamificationData;
        setGamification(data);
        LocalPersistence.saveGamification(user.uid, data);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/gamification/status`));

    // Schedules
    const schedulesRef = collection(db, `users/${user.uid}/schedules`);
    const qSchedules = query(schedulesRef, where('userId', '==', user.uid));
    const unsubSchedules = onSnapshot(qSchedules, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
      setSchedules(docs);
      docs.forEach(sc => LocalPersistence.saveSchedule(user.uid, sc));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/schedules`));

    // Failed Questions
    const failedRef = collection(db, `users/${user.uid}/failed_questions`);
    const qFailed = query(failedRef, where('userId', '==', user.uid));
    const unsubFailed = onSnapshot(qFailed, (snapshot) => {
      const failed = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: data.id || doc.id
        } as FailedQuestion;
      });
      setFailedQuestions(failed);
      failed.forEach(fq => LocalPersistence.saveFailedQuestion(user.uid, fq));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/failed_questions`));

    // Trilha Progress
    const trilhaRef = doc(db, `users/${user.uid}/trilha`, 'progress');
    const unsubTrilha = onSnapshot(trilhaRef, (doc) => {
      if (doc.exists()) {
        const days = doc.data().completedDays || [];
        setTrilhaCompletedDays(days);
        LocalPersistence.saveTrilhaProgress(user.uid, days);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/trilha/progress`));

    return () => {
      unsubStats();
      unsubGami();
      unsubSchedules();
      unsubFailed();
      unsubTrilha();
    };
  }, [user]);

  // Sync All Mentees (for Mentorandos tab)
  useEffect(() => {
    if (!auth.currentUser || !user || user.email?.toLowerCase() !== 'jhonny.spider@gmail.com') {
      setMentees([]);
      return;
    }

    const usersRef = collection(db, 'users');
    const unsubStats: Record<string, () => void> = {};

    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        stats: []
      } as Mentee));
      
      setMentees(usersData);

      // Manage stats listeners
      snapshot.docs.forEach(userDoc => {
        const userId = userDoc.id;
        if (!unsubStats[userId]) {
          const statsRef = collection(db, `users/${userId}/stats`);
          unsubStats[userId] = onSnapshot(statsRef, (statsSnapshot) => {
            const stats = statsSnapshot.docs.map(d => d.data() as UserStat);
            setMentees(prev => prev.map(m => 
              m.id === userId ? { ...m, stats } : m
            ));
          });
        }
      });

      // Cleanup listeners for deleted users
      Object.keys(unsubStats).forEach(userId => {
        if (!snapshot.docs.some(doc => doc.id === userId)) {
          unsubStats[userId]();
          delete unsubStats[userId];
        }
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => {
      unsubUsers();
      Object.values(unsubStats).forEach(unsub => unsub());
    };
  }, [user]);

  const saveSession = async (updatedData: Partial<ChatSession>, sessionIdOverride?: string, immediate: boolean = false) => {
    const targetId = sessionIdOverride || currentSessionId;
    if (!targetId) return;
    const activeUserId = user?.uid || 'jhonny-spider-ceo';

    // 1. Immediately persist locally (instant UI response, zero data loss)
    const existingSession = sessions.find(s => s.id === targetId);
    const mergedData = {
      id: targetId,
      userId: activeUserId,
      title: existingSession?.title || "Nova Mentoria",
      ...existingSession,
      ...updatedData,
      lastUpdatedAt: Date.now()
    };
    const updatedLocal = LocalPersistence.saveSession(activeUserId, mergedData);
    setSessions(updatedLocal);

    // 2. Clear any pending debounce timer for this session
    if (saveSessionDebounceRef.current[targetId]) {
      clearTimeout(saveSessionDebounceRef.current[targetId]);
      delete saveSessionDebounceRef.current[targetId];
    }

    const performCloudSave = async () => {
      if (!auth.currentUser || !user || isQuotaExhausted()) return;
      try {
        const sessionRef = doc(db, `users/${user.uid}/sessions`, targetId);
        const cleaned = cleanData(mergedData);
        await setDoc(sessionRef, cleaned, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/sessions/${targetId}`);
      }
    };

    if (immediate) {
      await performCloudSave();
    } else {
      // Debounce writes to conserve Firestore free tier write quota
      saveSessionDebounceRef.current[targetId] = setTimeout(() => {
        performCloudSave();
      }, 2500);
    }
  };

  const awardXP = async (amount: number) => {
    if (!user) return;
    const newTotalXP = (gamification.totalXP || 0) + amount;
    const newLevel = Math.floor(newTotalXP / 500) + 1;
    
    const today = new Date().setHours(0,0,0,0);
    const lastActive = new Date(gamification.lastActive || 0).setHours(0,0,0,0);
    let newStreak = gamification.streak || 0;
    
    if (today > lastActive) {
      if (today === lastActive + 86400000) newStreak += 1;
      else newStreak = 1;
    } else if (newStreak === 0) {
      newStreak = 1;
    }

    if (newLevel > (gamification.level || 1)) {
      setShowLevelUp(newLevel);
    }

    const updatedGami: GamificationData = {
      totalXP: newTotalXP,
      level: newLevel,
      streak: newStreak,
      lastActive: Date.now(),
      completedThemes: gamification.completedThemes || []
    };

    setGamification(updatedGami);
    LocalPersistence.saveGamification(user.uid, updatedGami);

    if (auth.currentUser && !isQuotaExhausted()) {
      try {
        const gamiRef = doc(db, `users/${user.uid}/gamification`, 'status');
        await setDoc(gamiRef, cleanData(updatedGami), { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/gamification/status`);
      }
    }
  };

  const scheduleReviewForFailedQuestion = async (question: Question, subject: string) => {
    if (!user) return;

    let targetSchedules = [...schedules];

    if (targetSchedules.length === 0) {
      // Cria um cronograma de revisão inteligente de 7 dias caso o usuário ainda não possua nenhum
      const newScheduleId = crypto.randomUUID();
      const mockCronograma = Array.from({ length: 7 }, (_, i) => ({
        dia: `Dia ${i + 1}`,
        disciplina: "Revisão Geral",
        topico: "Consolidação de Pontos Fracos",
        fontes: "Revisão Imediata das Questões Incorretas",
        questoes: 0,
        reviews: []
      }));

      const newSchedule: Schedule = {
        id: newScheduleId,
        title: "🔥 Cronograma de Revisão de Questões Erradas",
        raioX: [{ subject: "Revisão Geral", topic: "Revisões Agendadas", incidence: 100, level: "Médio" }],
        cronograma: mockCronograma,
        createdAt: Date.now(),
        completedIndices: []
      };

      const cleaned = cleanData({
        ...newSchedule,
        userId: user.uid
      });

      LocalPersistence.saveSchedule(user.uid, newSchedule);
      setSchedules([newSchedule]);
      targetSchedules = [newSchedule];

      if (!isQuotaExhausted()) {
        try {
          await setDoc(doc(db, `users/${user.uid}/schedules`, newScheduleId), cleaned);
        } catch (err) {
          console.error("Erro ao criar cronograma de revisão automática:", err);
        }
      }
    }

    // Seleciona o cronograma atualmente ativo ou do item de estudo ativo ou o primeiro do usuário
    const activeSched = targetSchedules.find(s => s.id === activeStudyItem?.scheduleId) || targetSchedules[0];
    if (!activeSched || !activeSched.cronograma) return;

    const updatedCronograma = [...activeSched.cronograma];

    const completed = activeSched.completedIndices || [];
    let currentIdx = 0;
    for (let i = 0; i < updatedCronograma.length; i++) {
      if (!completed.includes(i)) {
        currentIdx = i;
        break;
      }
    }

    // Distribui ao longo dos próximos 7 dias (ou o que estiver disponível na janela do cronograma)
    const rangeStartIndex = currentIdx;
    const rangeEndIndex = Math.min(updatedCronograma.length - 1, currentIdx + 6);

    let bestDayIndex = rangeStartIndex;
    let minReviewsCount = Infinity;

    // Load-balancing: escolhe o dia nos próximos 7 dias que tiver menos revisões agendadas
    for (let i = rangeStartIndex; i <= rangeEndIndex; i++) {
      const item = updatedCronograma[i];
      const itemReviews = item.reviews || [];
      if (itemReviews.length < minReviewsCount) {
        minReviewsCount = itemReviews.length;
        bestDayIndex = i;
      }
    }

    if (bestDayIndex < 0 || bestDayIndex >= updatedCronograma.length) {
      bestDayIndex = updatedCronograma.length - 1;
    }

    const targetDayItem = { ...updatedCronograma[bestDayIndex] };
    const currentDayReviews = targetDayItem.reviews ? [...targetDayItem.reviews] : [];

    // Insere se não for questão duplicada no dia de destino
    if (!currentDayReviews.some((q: any) => q.text === question.text)) {
      currentDayReviews.push({
        id: question.id || crypto.randomUUID(),
        text: question.text,
        options: question.options || [],
        correctIndex: question.correctIndex,
        explanation: question.explanation || "",
        subject: subject,
        timestamp: Date.now()
      });

      targetDayItem.reviews = currentDayReviews;
      targetDayItem.questoes = (targetDayItem.questoes || 0) + 1;

      updatedCronograma[bestDayIndex] = targetDayItem;
      const updatedScheduleObj = { ...activeSched, cronograma: updatedCronograma };
      LocalPersistence.saveSchedule(user.uid, updatedScheduleObj);
      setSchedules(prev => prev.map(s => s.id === activeSched.id ? updatedScheduleObj : s));

      if (!isQuotaExhausted()) {
        try {
          await updateDoc(doc(db, `users/${user.uid}/schedules`, activeSched.id), {
            cronograma: updatedCronograma
          });
          console.log(`Sucesso: Questão errada agendada automaticamente na revisão do dia ${targetDayItem.dia}`);
        } catch (err) {
          console.error("Erro ao salvar revisão agendada no cronograma:", err);
        }
      }
    }
  };

  const updateStats = async (subject: string, isCorrect: boolean, question?: Question, answerIndex?: number) => {
    if (!user) return;
    
    // XP Logic
    const xpReward = isCorrect ? 50 : 10;
    await awardXP(xpReward);

    // Calculate progress for this subject
    const subjectData = subjects.find(s => s.name === subject);
    const calculatedProgress = subjectData ? (currentArticle / subjectData.maxArticles) * 100 : 0;

    // Normalize string to remove accents/diacritics and replace spaces for Firestore compatibility
    const subjectId = subject.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '');
    
    const statRef = doc(db, `users/${user.uid}/stats`, subjectId);
    
    const current = userStats.find(s => s.subjectName === subject) || { 
      subjectName: subject, 
      correctAnswers: 0, 
      totalQuestions: 0, 
      progress: 0,
      xp: 0
    };

    const cleaned = cleanData({
      subjectName: subject,
      correctAnswers: current.correctAnswers + (isCorrect ? 1 : 0),
      totalQuestions: current.totalQuestions + 1,
      progress: Math.max(current.progress, calculatedProgress),
      xp: (current.xp || 0) + xpReward,
      userId: user.uid
    });

    LocalPersistence.saveStat(user.uid, cleaned);
    setUserStats(prev => {
      const idx = prev.findIndex(s => s.subjectName === subject);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = cleaned;
        return copy;
      }
      return [...prev, cleaned];
    });

    if (auth.currentUser && !isQuotaExhausted()) {
      try {
        await setDoc(statRef, cleaned, { merge: true });

        // Handle Failed Questions tracking
        if (!isCorrect && question) {
          const questionId = crypto.randomUUID();
          const failedRef = doc(db, `users/${user.uid}/failed_questions`, questionId);
          const failedObj: FailedQuestion = {
            ...question,
            id: questionId,
            userId: user.uid,
            subject,
            timestamp: Date.now(),
            originalArticle: currentArticle
          };
          LocalPersistence.saveFailedQuestion(user.uid, failedObj);
          setFailedQuestions(prev => [failedObj, ...prev]);

          try {
            await setDoc(failedRef, cleanData(failedObj));
          } catch (fErr) {
            handleFirestoreError(fErr, OperationType.CREATE, `users/${user.uid}/failed_questions/${questionId}`);
          }

          // Dispara o agendamento de revisão distribuído nos próximos 7 dias!
          await scheduleReviewForFailedQuestion({ ...question, id: questionId }, subject);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/stats/${subjectId}`);
      }
    } else {
      // Local-only flow when quota is exhausted
      if (!isCorrect && question) {
        const questionId = crypto.randomUUID();
        const failedObj: FailedQuestion = {
          ...question,
          id: questionId,
          userId: user.uid,
          subject,
          timestamp: Date.now(),
          originalArticle: currentArticle
        };
        LocalPersistence.saveFailedQuestion(user.uid, failedObj);
        setFailedQuestions(prev => [failedObj, ...prev]);
        await scheduleReviewForFailedQuestion({ ...question, id: questionId }, subject);
      }
    }
  };

  const startNewSession = async (title: string = "Nova Mentoria", sub: string | null = null, art: number = 1) => {
    if (!user) return;
    
    const id = crypto.randomUUID();
    const newSession: ChatSession = {
      id,
      title,
      userId: user.uid,
      messages: [],
      guidedSubject: sub,
      currentArticle: art,
      lastUpdatedAt: Date.now()
    };

    LocalPersistence.saveSession(user.uid, newSession);
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(id);
    setMessages([]);
    setGuidedSubject(sub);
    setCurrentArticle(art);
    setActiveTab('chat');
    
    if (auth.currentUser && !isQuotaExhausted()) {
      try {
        const cleaned = cleanData(newSession);
        await setDoc(doc(db, `users/${user.uid}/sessions`, id), cleaned);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/sessions/${id}`);
      }
    }
  };

  const switchSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages || []);
      setGuidedSubject(session.guidedSubject);
      setCurrentArticle(session.currentArticle || 1);
      setActiveTab('chat');
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    LocalPersistence.deleteSession(user.uid, id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setMessages([]);
      setGuidedSubject(null);
      setCurrentArticle(1);
    }
    setSessionToDelete(null);
    
    if (auth.currentUser && !isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/sessions`, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/sessions/${id}`);
      }
    }
  };

  const deleteReview = async (reviewId: string, sessionId?: string) => {
    if (!user) return;
    try {
      let targetSessionId = sessionId;
      
      // Fallback for older reviews missing sessionId
      if (!targetSessionId) {
        const sessionWithReview = sessions.find(s => s.reviews?.some(r => r.id === reviewId));
        if (sessionWithReview) targetSessionId = sessionWithReview.id;
      }

      if (!targetSessionId) return;

      const session = sessions.find(s => s.id === targetSessionId);
      if (!session || !session.reviews) return;
      
      const updatedReviews = session.reviews.filter(r => r.id !== reviewId);
      const updatedSession = { ...session, reviews: updatedReviews };
      LocalPersistence.saveSession(user.uid, updatedSession);
      setSessions(prev => prev.map(s => s.id === targetSessionId ? updatedSession : s));

      if (auth.currentUser && !isQuotaExhausted()) {
        const sessionRef = doc(db, `users/${user.uid}/sessions`, targetSessionId);
        const cleaned = cleanData({ reviews: updatedReviews });
        await setDoc(sessionRef, cleaned, { merge: true });
      }
    } catch (error) {
      console.error("Delete review error:", error);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const articleGridRef = useRef<HTMLDivElement>(null);

  const subjects = [
    { id: 'estudo_edital', name: 'Estudo pelo Edital', icon: <FileSearch size={20} />, maxArticles: 1 },
    { id: 'cf', name: 'Constituição Federal', icon: <Scale size={20} />, maxArticles: 250 },
    { id: 'cp', name: 'Código Penal', icon: <ShieldAlert size={20} />, maxArticles: 361 },
    { id: 'cpp', name: 'Processo Penal', icon: <Gavel size={20} />, maxArticles: 811 },
    { id: 'cc', name: 'Código Civil', icon: <Users size={20} />, maxArticles: 2046 },
    { id: 'cpc', name: 'Processo Civil', icon: <BookOpen size={20} />, maxArticles: 1071 },
    { id: 'doutrina_contratos', name: 'Doutrina: Contratos', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_nulidades', name: 'Doutrina: Nulidades', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_controle', name: 'Doutrina: Controle', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'sigilo_lc105', name: 'Sigilo: LC 105', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_precedentes', name: 'Doutrina: Precedentes', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_tutela', name: 'Doutrina: Tutelas', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_recursos_cpc_2026', name: 'Doutrina: Recursos (CPC) 2026', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_sistemas', name: 'Sistemas e Princípios PP', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_procedimentos_pp', name: 'Procedimentos Criminais', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_recursos_pp', name: 'Recursos PP', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_especiais', name: 'Procedimentos Especiais', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_provas_civil', name: 'Provas (Civil)', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'reparticao_receitas', name: 'Repartição Receitas', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_respostas_reu', name: 'Doutrina: Respostas do Réu', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_teoria_constituicao', name: 'Doutrina: Teoria da Constituição', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_prescricao_penal', name: 'Doutrina: Prescrição Penal', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_sujeitos_relacoes', name: 'Doutrina: Sujeitos da Relação PP', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_sentenca_coisa_julgada_penal', name: 'Doutrina: Sentença e Coisa Julgada (Penal)', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_sentenca_coisa_julgada_civil_2026', name: 'Doutrina: Sentença e Coisa Julgada (Civil) 2026', icon: <BookOpen size={20} />, maxArticles: 1 },
    { id: 'doutrina_punibilidade', name: 'Doutrina: Punibilidade', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_normas_fundamentais_pc', name: 'Doutrina: Normas Fundamentais PC', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_prisoes', name: 'Doutrina: Prisões', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_poder_judiciario', name: 'Doutrina: Poder Judiciário', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_consumidor', name: 'Doutrina: Princípios Consumidor', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_lei_penal', name: 'Doutrina: Teoria da Lei Penal', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'doutrina_sujeitos_2026', name: 'Doutrina: Sujeitos do Processo 2026', icon: <Users size={20} />, maxArticles: 1 },
    { id: 'doutrina_juri_2026', name: 'Doutrina: Tribunal do Júri 2026', icon: <Gavel size={20} />, maxArticles: 1 },
    { id: 'doutrina_recursos_2026', name: 'Doutrina: Recursos Penal 2026', icon: <Layers size={20} />, maxArticles: 1 },
    { id: 'juris_stj_2025', name: 'Informativo STJ 2025', icon: <Sparkles size={20} />, maxArticles: 1 },
    { id: 'juris_stj_2026', name: 'Informativo STJ 2026', icon: <Sparkles size={20} />, maxArticles: 1 },
    { id: 'juris_stj_2024', name: 'Informativo STJ 2024', icon: <Sparkles size={20} />, maxArticles: 1 },
    { id: 'doutrina_questoes_nelma', name: 'Questões: Doutrina Especial', icon: <Trophy size={20} />, maxArticles: 1 },
    { id: 'questoes_concursos', name: 'Questões: Provas Anteriores', icon: <Library size={20} />, maxArticles: 1 },
  ];

  const parseATHENAResponse = (text: string): { content: string, blocks: string[], challenge?: ChallengeData, editalData?: EditalData } => {
    const challengeKey = "[ATHENA_CHALLENGE]";
    const editalKey = "[ATHENA_EDITAL_DATA]";
    let rawContent = text;
    let challenge: ChallengeData | undefined;
    let editalData: EditalData | undefined;

    // Extract Edital JSON
    if (text.includes(editalKey)) {
      const parts = text.split(editalKey);
      const afterTag = parts[1].trim();
      try {
        const firstBrace = afterTag.indexOf("{");
        const lastBrace = afterTag.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = afterTag.substring(firstBrace, lastBrace + 1);
          editalData = JSON.parse(jsonStr);
          rawContent = parts[0] + (afterTag.substring(lastBrace + 1));
        }
      } catch (e) {
        console.error("Failed to parse Edital JSON:", e);
      }
    }

    // Extract Challenge JSON
    if (rawContent.includes(challengeKey)) {
      const parts = rawContent.split(challengeKey);
      const afterTag = parts[1].trim();
      
      try {
        const firstBrace = afterTag.indexOf("{");
        const lastBrace = afterTag.lastIndexOf("}");
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const challengeJson = afterTag.substring(firstBrace, lastBrace + 1);
          challenge = JSON.parse(challengeJson);
          
          rawContent = parts[0] + (afterTag.substring(lastBrace + 1));
        }
      } catch (e) {
        console.error("Failed to parse challenge JSON:", e);
      }
    }

    // Improved block splitting strategy
    const blocks: string[] = [];
    const blockMarkers = Array.from({ length: 6 }, (_, i) => `[BLOCK_${i + 1}]`);
    let tempContent = rawContent;

    // Check if markers exist
    const hasMarkers = blockMarkers.some(m => tempContent.includes(m));

    if (hasMarkers) {
      // Find all markers and their positions
      const positions: { index: number, marker: string }[] = [];
      blockMarkers.forEach(m => {
        const idx = tempContent.indexOf(m);
        if (idx !== -1) positions.push({ index: idx, marker: m });
      });
      positions.sort((a, b) => a.index - b.index);

      if (positions.length > 0) {
        // Add preamble if exists
        if (positions[0].index > 0) {
          const preamble = tempContent.substring(0, positions[0].index).trim();
          if (preamble) blocks.push(preamble);
        }

        // Add blocks
        for (let i = 0; i < positions.length; i++) {
          const start = positions[i].index + positions[i].marker.length;
          const end = (i < positions.length - 1) ? positions[i + 1].index : tempContent.length;
          const content = tempContent.substring(start, end).trim();
          
          if (i === 0 && blocks.length > 0) {
            // Merge preamble into the first block instead of making it a separate block
            blocks[0] = blocks[0] + "\n\n" + content;
          } else {
            blocks.push(content);
          }
        }
      }
    } else {
      blocks.push(tempContent);
    }

    // Capture all generated blocks, but try to stay within 6-7 logical ones
    const finalBlocks = blocks;

    return { content: rawContent, blocks: finalBlocks, challenge, editalData };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (guidedSubject && articleGridRef.current) {
      const activeBtn = articleGridRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentArticle, guidedSubject]);

  const startGuidedStudy = async (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject || !user) return;
    
    const id = crypto.randomUUID();
    const newSession: ChatSession = {
      id,
      title: subject.name,
      userId: user.uid,
      messages: [],
      guidedSubject: subject.name,
      currentArticle: 1,
      lastUpdatedAt: Date.now()
    };

    LocalPersistence.saveSession(user.uid, newSession);
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(id);
    setMessages([]);
    setGuidedSubject(subject.name);
    
    const initialArticle = subjectId === 'estudo_edital' ? 0 : 1;
    setCurrentArticle(initialArticle);
    setActiveTab('chat');

    if (auth.currentUser && !isQuotaExhausted()) {
      try {
        const cleaned = cleanData(newSession);
        await setDoc(doc(db, `users/${user.uid}/sessions`, id), cleaned);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/sessions/${id}`);
      }
    }
      
    // Trigger the first article explanation WITHOUT an hardcoded initial message
    if (subjectId === 'estudo_edital') {
        handleSendMessageRequest(`ATHENA, inicie o Módulo de Estudo pelo Edital. Apresente-se, explique que o primeiro passo é o Raio-X Estatístico e me peça para anexar o edital para que possamos começar. Não inicie conteúdos de estudo ainda.`, true, id, 0, subject.name);
      } else if (subjectId === 'questoes_concursos' || subjectId === 'doutrina_questoes_nelma') {
        handleSendMessageRequest(`Gere um desafio estatístico de questões reais baseadas no banco de dados fornecido (concursos anteriores). Foque em diversidade de matérias.`, true, id, initialArticle, subject.name);
      } else {
        handleSendMessageRequest(`Vamos iniciar o estudo do Artigo 1º da ${subject.name}`, true, id, 1, subject.name);
      }
  };

  const jumpToArticle = (articleNum: number) => {
    if (!guidedSubject || isNaN(articleNum) || articleNum < 1) return;
    
    setCurrentArticle(articleNum);
    setNavInput('');
    handleSendMessageRequest(`ATHENA, pule para o Artigo ${articleNum} da ${guidedSubject}.`, true, currentSessionId, articleNum);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSendMessage = async (customMessage?: string, isAuto?: boolean, forcedArticle?: number, forcedSubject?: string | null) => {
    handleSendMessageRequest(customMessage, isAuto, currentSessionId, forcedArticle, forcedSubject);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande. Limite de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(',')[1];
      setAttachedFile({
        name: file.name,
        mimeType: file.type || 'application/pdf',
        data: base64Data
      });
    };
    reader.readAsDataURL(file);
  };

    const handleSendMessageRequest = async (
      customMessage?: string, 
      isAuto?: boolean, 
      sessionId?: string | null, 
      forcedArticle?: number, 
      forcedSubject?: string | null,
      forcedTrilhaDay?: number
    ) => {
    const userMessage = customMessage || input;
    if (!userMessage.trim() && !attachedFile && !isLoading) return;
    if (isLoading) return;

    let targetSessionId = sessionId;
    const activeArticle = forcedArticle !== undefined ? forcedArticle : currentArticle;
    const activeSubject = forcedSubject !== undefined ? forcedSubject : guidedSubject;

    const currentAttachedFile = attachedFile;

    if (!isAuto) {
      const displayMessage = currentAttachedFile ? `${userMessage} [Arquivo: ${currentAttachedFile.name}]` : userMessage;
      
      if (!targetSessionId) {
        // Create new session if none exists
        const id = crypto.randomUUID();
        const activeUserId = user?.uid || 'jhonny-spider-ceo';
        const newSession: ChatSession = {
          id,
          title: userMessage.substring(0, 30) || currentAttachedFile?.name || "Nova Mentoria",
          userId: activeUserId,
          messages: [{ role: 'user', content: displayMessage }],
          guidedSubject: activeSubject,
          currentArticle: activeArticle,
          lastUpdatedAt: Date.now()
        };
        LocalPersistence.saveSession(activeUserId, newSession);
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(id);
        targetSessionId = id;
        setMessages([{ role: 'user', content: displayMessage }]);
      } else {
        setMessages(prev => [...prev, { role: 'user', content: displayMessage }]);
      }
      setInput('');
      setAttachedFile(null);
    }

    setIsLoading(true);

    try {
      const activeUserId = user?.uid || 'jhonny-spider-ceo';
      const activeSession = sessions.find(s => s.id === (targetSessionId || currentSessionId))
        || LocalPersistence.getSessions(activeUserId).find(s => s.id === (targetSessionId || currentSessionId));
      const dayNum = forcedTrilhaDay ?? activeSession?.trilhaDay;
      let resolvedPhase = mentorshipPhase;
      if (activeSession?.trilhaSessionType === 'discursivo') {
        resolvedPhase = 'subjetiva';
      } else if (activeSession?.trilhaSessionType === 'oral') {
        resolvedPhase = 'oral';
      } else if (dayNum !== undefined) {
        if (dayNum % 5 === 0) {
          resolvedPhase = 'subjetiva';
        } else if (dayNum % 7 === 0 || dayNum % 10 === 3) {
          resolvedPhase = 'oral';
        } else {
          resolvedPhase = 'objetiva';
        }
      }

      // If isAuto is true, history should NOT duplicate the initial prompt that is already queued in messages!
      const history = isAuto ? [] : (messages || []).map(m => ({
        role: m.role,
        parts: [{ text: m.content || "" }]
      }));

      const { text: responseText, model: usedModel } = await askATHENA(userMessage, history, user?.displayName || "Mestre", currentAttachedFile, mentorshipStyle, resolvedPhase);
      const parsed = parseATHENAResponse(responseText);

      const botMessage: Message = {
        role: 'model',
        content: parsed.content,
        challenge: parsed.challenge,
        editalData: parsed.editalData,
        blocks: parsed.blocks,
        currentBlockIndex: 0,
        subject: activeSubject,
        article: activeArticle,
        sourceType: 'gemini',
        modelName: usedModel
      };

      setMessages(prev => [...prev, botMessage]);

      if (dayNum !== undefined) {
        const matIdx = activeSession?.trilhaMaterialIndex ?? 0;
        setCachedTrilhaPart(dayNum, matIdx, resolvedPhase, {
          text: responseText,
          model: usedModel,
          timestamp: Date.now()
        });
        prefetchNextTrilhaPart(dayNum, matIdx + 1, resolvedPhase, mentorshipStyle);
      }

      // Automatically sync dynamic content to IndexedDB for offline viewing
      if (activeSubject && activeArticle !== undefined) {
        cacheArticle(activeSubject, activeArticle, parsed.content);
      }
      if (parsed.challenge?.questions) {
        parsed.challenge.questions.forEach(q => {
          cacheQuestion({
            ...q,
            subject: activeSubject || 'Conteúdo Geral'
          });
        });
      }

      if (targetSessionId) {
        const activeUserId = user?.uid || 'jhonny-spider-ceo';
        const session = sessions.find(s => s.id === targetSessionId)
          || LocalPersistence.getSessions(activeUserId).find(s => s.id === targetSessionId);
        let currentMessages = session?.messages || [];
        if (currentMessages.length === 0) {
          currentMessages = [{ role: 'user' as const, content: userMessage }];
        }
        
        const newUserMsg = isAuto ? [] : [{ role: 'user' as const, content: userMessage }];
        const updatedMessages = [...currentMessages, ...newUserMsg, botMessage];
        
        try {
          await saveSession({ 
            messages: updatedMessages,
            guidedSubject: activeSubject,
            currentArticle: activeArticle
          }, targetSessionId, true);
        } catch (saveErr) {
          console.warn("Notice: Cloud sync deferred (quota/network fallback active):", saveErr);
        }
      }
    } catch (error: any) {
      console.error("[ATHENA Error]", error);
      const errorMessage = error?.message || error?.toString() || "Erro inesperado";
      if (errorMessage.includes('[API_TOKEN_EXHAUSTED]') || isQuotaExhausted()) {
        setTokenExhaustedBanner(true);
      }
      
      const activeUserId = user?.uid || 'jhonny-spider-ceo';
      const activeSession = sessions.find(s => s.id === (targetSessionId || currentSessionId))
        || LocalPersistence.getSessions(activeUserId).find(s => s.id === (targetSessionId || currentSessionId));
      const dayNum = forcedTrilhaDay ?? activeSession?.trilhaDay;
      const dayItem = dayNum ? TRILHA_JURIDICA_DATA.find(d => d.dia === dayNum) : undefined;

      // Resiliência de Elite: se a API Gemini falhar ou demorar, sintetiza o material compilado Pareto do Dia
      if (dayItem) {
        console.warn(`[ATHENA Trilha] Conexão Gemini indisponível. Ativando síntese local Pareto 80/20 do Dia ${dayNum}...`);
        let fallbackText = '';
        if (dayItem.fonteCompleta && dayNum === 1) {
          fallbackText = `[BLOCK_1]
# ⚖️ Trilha Jurídica • Dia ${dayNum} | ${activeSubject || 'Direito Constitucional'}
*Modo de Alta Disponibilidade Local Ativado (Pareto 80/20)*

Bem-vindo(a) à sua sessão de estudos do **Dia ${dayNum}** da Trilha Jurídica!
Mesmo diante de instabilidades de rede com os servidores de IA, seu material de elite compilado pelo método 80/20 está integralmente disponível para você dominar a matéria.

---

### **1. CONCEPÇÕES E FUNDAMENTOS DE CONSTITUIÇÃO**
- **Sociológica (Ferdinand Lassalle):** A Constituição é a soma dos fatores reais de poder. O texto escrito que não reflete a realidade social não passa de uma "mera folha de papel".
- **Política (Carl Schmitt):** A Constituição é a decisão política fundamental tomada pelo titular do poder constituinte (teoria decisionista/voluntarista). Schmitt distingue *Constituição* (decisão fundamental) de *leis constitucionais* (outros preceitos no texto formal).
- **Jurídica (Hans Kelsen):** Norma pura desvinculada de sociologia ou política. No sentido lógico-jurídico, é a *Norma Hipotética Fundamental* (pressuposto transcendental). No sentido jurídico-positivo, é o vértice do ordenamento e pressuposto de validade de todas as leis infraconstitucionais.
- **Força Normativa (Konrad Hesse):** Em resposta direta a Lassalle, defende que a Constituição escrita possui força normativa própria para ordenar e conformar a realidade social e política, mantendo com ela relação de mútua influência e eficácia.

[BLOCK_2]
### **2. ELEMENTOS DAS CONSTITUIÇÕES**
As normas constitucionais dividem-se em cinco grandes grupos estruturais segundo a doutrina clássica (José Afonso da Silva):
1. **Orgânicos:** Normas que disciplinam a estrutura do Estado e a repartição dos Poderes (Ex: arts. 44 a 135 da CF/88).
2. **Limitativos:** Normas que fixam os direitos e garantias fundamentais com perfil negativo/abstencionista, criando barreiras contra o arbítrio estatal (Ex: art. 5º da CF/88).
3. **Socioideológicos:** Normas que consagram a ideologia do Estado social, equilibrando princípios liberais e direitos prestacionais (Ex: arts. 6º e seguintes da CF/88).
4. **De Estabilização Institucional:** Mecanismos de contenção e defesa do Estado e das instituições democráticas para solução de crises constitucionais (Ex: Estado de Defesa, Estado de Sítio, Forças Armadas e Segurança Pública).
5. **Formais de Aplicabilidade:** Normas que estabelecem regras de interpretação, vigência e eficácia das disposições constitucionais (Ex: Preâmbulo, art. 5º, § 1º, e ADCT).

[BLOCK_3]
### **3. CLASSIFICAÇÃO DA CONSTITUIÇÃO BRASILEIRA (CF/88)**
Para gabaritar qualquer prova de 1ª Fase, memorize a fórmula mnemônica da CF/88:
- **Quanto ao Conteúdo:** Formal (todas as matérias inseridas no texto gozam de supremacia hierárquica).
- **Quanto à Forma:** Escrita (documento formal solene codificado).
- **Quanto ao Modo de Elaboração:** Dogmática (fruto de trabalho legislativo constituinte congregando valores e dogmas de uma época).
- **Quanto à Origem:** Promulgada / Democrática / Votada (feita com participação popular via Assembleia Nacional Constituinte de 1987/1988).
- **Quanto à Extensão:** Analítica / Prolixa (minudente, disciplinando matérias substancialmente constitucionais e temas outros).
- **Quanto à Ideologia:** Eclética / Compromissória (concilia correntes liberais, sociais e desenvolvimentistas).
- **Quanto à Estabilidade/Alterabilidade:** Rígida (processo de reforma qualificado por Emendas - art. 60) ou *Super-rígida* (para parte da doutrina, devido à presença das Cláusulas Pétreas intangíveis).
- **Quanto à Essência (Karl Loewenstein):** Normativa na pretensão de eficácia (embora autores como Novelino admitam traços nominais pontuais em certos direitos prestacionais).

[BLOCK_4]
### **4. MÉTODOS E PRINCÍPIOS DE HERMENÊUTICA CONSTITUCIONAL**
#### **Métodos de Destaque:**
- **Tópico-Problemático (Theodor Viehweg):** Parte do *problema para a norma* (problema-norma). O intérprete busca os tópicos de consenso para achar a solução mais justa no caso concreto.
- **Hermenêutico-Concretizador (Konrad Hesse):** Parte da *norma para o problema* (norma-problema). Concretiza o sentido normativo com base nas pré-compreensões do aplicador vinculadas à força normativa do texto.
- **Normativo-Estruturante (Friedrich Müller):** O texto é apenas o programa da norma; a verdadeira norma jurídica é construída pelo âmbito material retirado dos dados da realidade fática.

#### **Princípios Próprios de Interpretação:**
1. **Unidade da Constituição:** O texto constitucional deve ser interpretado em sua globalidade orgânica, vedando-se antinomias reais entre normas originárias (não existe norma constitucional originária inconstitucional).
2. **Efeito Integrador:** Na resolução de conflitos, deve-se priorizar a solução que preserve a estabilidade institucional e a unidade da federação.
3. **Concordância Prática ou Harmonização:** Havendo colisão entre bens e direitos fundamentais, deve-se coordenar e balancear os direitos sem supressão integral de um em detrimento do outro.
4. **Proporcionalidade / Razoabilidade:** Exame tripartite de adequação, necessidade e proporcionalidade em sentido estrito.

[BLOCK_5]
### **5. PREÂMBULO E JURISPRUDÊNCIA DO STF**
- **Valor Jurídico do Preâmbulo Constitucional:** O Supremo Tribunal Federal consolidou a **Tese da Irrelevância Jurídica** do preâmbulo.
  - Ele se situa na esfera da política e da diretriz de intenções.
  - Não faz parte do bloco de constitucionalidade.
  - Não serve como parâmetro autônomo para Ação Direta de Inconstitucionalidade (ADI).
  - Não confere direitos subjetivos nem impõe deveres jurídicos vinculantes.
- **Invocação da "Proteção de Deus":** Na **ADI 2076**, o STF declarou que a invocação de Deus no preâmbulo não é norma de reprodução obrigatória para os Estados-Membros, não vincula as Constituições Estaduais e não viola a laicidade do Estado Brasileiro (Estado Laico).

[BLOCK_6]
### **6. SIMULADO DE FIXAÇÃO & QUESTÕES DE BANCA (PARETO 80/20)**
Teste agora a fixação deste tema com questões de alto nível:

[ATHENA_CHALLENGE]
{
  "questions": [
    {
      "id": 1,
      "text": "(Banca de Concurso - Magistratura/MP) Sobre os conceitos e classificações de Constituição, assinale a opção correta à luz da doutrina e jurisprudência constitucional:",
      "options": [
        "A) Para Ferdinand Lassalle, a Constituição jurídica goza de força normativa soberana sobre os fatores reais de poder.",
        "B) Carl Schmitt defendia que todas as normas inseridas no texto constitucional possuem a mesma natureza de decisão política fundamental.",
        "C) Segundo a jurisprudência do STF (ADI 2076), a invocação da 'proteção de Deus' contida no preâmbulo da CF/88 é norma de reprodução compulsória pelos Estados federados.",
        "D) A CF/88 classifica-se como formal, escrita, promulgada, dogmática, analítica e rígida (ou super-rígida em virtude das cláusulas pétreas)."
      ],
      "correctAnswer": 3,
      "explanation": "Correto item D. A CF/88 é formal (todas as matérias inseridas no texto solene têm hierarquia suprema), escrita, promulgada, dogmática, analítica e rígida/super-rígida. A alternativa A inverte a tese de Lassalle (para ele, é folha de papel); a B ignora a distinção schmittiana entre constituição e leis constitucionais; e a C colide frontalmente com a ADI 2076 do STF."
    },
    {
      "id": 2,
      "text": "(FCC / VUNESP) O método hermenêutico que sustenta que a interpretação constitucional deve partir do 'problema para a norma' (problema-norma), utilizando tópicos como premissas de consenso, é atribuído a:",
      "options": [
        "A) Hans Kelsen (Método Positivista Puro)",
        "B) Theodor Viehweg (Método Tópico-Problemático)",
        "C) Konrad Hesse (Método Hermenêutico-Concretizador)",
        "D) Friedrich Müller (Método Normativo-Estruturante)"
      ],
      "correctAnswer": 1,
      "explanation": "Correto item B. O método tópico-problemático, formulado por Theodor Viehweg, tem caráter eminentemente casuístico, partindo do problema para a busca da norma aplicável (problema-norma)."
    }
  ]
}`;
        } else if (dayItem.materias && dayItem.materias.length > 0) {
          const matList = dayItem.materias.map((m, i) => `**${i + 1}. ${m.nome}**: ${m.conteudo}`).join('\n');
          fallbackText = `[BLOCK_1]
# ⚖️ Trilha Jurídica • Dia ${dayNum} | ${activeSubject || dayItem.materias[0].nome}
*Plano de Estudos Pareto 80/20 (Alta Disponibilidade)*

Bem-vindo(a) à sua sessão de estudos do **Dia ${dayNum}** da Trilha Jurídica!

As disciplinas e matérias programadas para hoje são:
${matList}

[BLOCK_2]
### **Foco Estratégico do Dia ${dayNum}**
- **Meta**: Leitura atenta dos dispositivos de lei seca indicados e consolidação dos pontos mais cobrados pelas bancas.
- **Técnica 80/20**: Dedique 80% do seu tempo de estudo aos artigos centrais e súmulas correlatas.

[BLOCK_3]
### **Recomendações Práticas de Estudo**
1. **Leitura Ativa**: Grife os verbos nucleares e prazos de cada artigo indicado.
2. **Mapeamento de Pegadinhas**: Fique atento a exceções e remissões normativas.
3. **Fixação Contínua**: Resolva questões comentadas ao final de cada bloco de leitura.

[BLOCK_4]
### **Simulado Rápido de Fixação**
[ATHENA_CHALLENGE]
{
  "questions": [
    {
      "id": 1,
      "text": "Ao estudar a lei seca pelo método Pareto 80/20, qual deve ser a postura do candidato em relação às exceções e prazos legais?",
      "options": [
        "A) Ignorar exceções e focar exclusivamente nas regras gerais.",
        "B) Mapear e memorizar ativamente as exceções e prazos, pois representam o maior índice de pegadinhas das bancas.",
        "C) Memorizar apenas o número dos artigos sem ler o texto da norma.",
        "D) Deixar o estudo da lei seca apenas para a véspera da prova."
      ],
      "correctAnswer": 1,
      "explanation": "Correto item B. As bancas examinadoras de concursos de alto nível cobram intensamente exceções e prazos legais literais."
    }
  ]
}`;
        }

        if (fallbackText) {
          const parsed = parseATHENAResponse(fallbackText);
          const botMessage: Message = {
            role: 'model',
            content: parsed.content,
            challenge: parsed.challenge,
            blocks: parsed.blocks,
            currentBlockIndex: 0,
            subject: activeSubject,
            article: activeArticle,
            sourceType: 'offline_pareto',
            modelName: 'Material Local Pareto 80/20'
          };
          setMessages(prev => [...prev, botMessage]);

          const activeId = (targetSessionId || currentSessionId);
          if (activeId) {
            const activeUserId = user?.uid || 'jhonny-spider-ceo';
            const session = sessions.find(s => s.id === activeId)
              || LocalPersistence.getSessions(activeUserId).find(s => s.id === activeId);
            let currentMessages = session?.messages || [];
            if (currentMessages.length === 0) {
              currentMessages = [{ role: 'user' as const, content: userMessage }];
            }
            const newUserMsg = isAuto ? [] : [{ role: 'user' as const, content: userMessage }];
            const updatedMessages = [...currentMessages, ...newUserMsg, botMessage];
            saveSession({
              messages: updatedMessages,
              guidedSubject: activeSubject,
              currentArticle: activeArticle
            }, activeId, true);
          }
          return;
        }
      }

      const botErrorMessage: Message = {
        role: 'model',
        content: `⚠️ **Ocorreu um problema na conexão com ATHENA**\n\nNão foi possível obter uma resposta do mentor. \n\n**Detalhes do Erro:** \`${errorMessage}\`\n\n*Por favor, clique em **Recarregar Lição** ou tente reiniciar o estudo da trilha.*`,
        blocks: [`⚠️ **Ocorreu um problema na conexão com ATHENA**\n\nNão foi possível obter uma resposta do mentor. Se estiver em pré-visualização, verifique sua conexão.\n\n**Detalhes do Erro de Conexão:** \`${errorMessage}\``],
        currentBlockIndex: 0,
        subject: activeSubject,
        article: activeArticle
      };
      setMessages(prev => [...prev, botErrorMessage]);

      if (targetSessionId || currentSessionId) {
        const activeId = (targetSessionId || currentSessionId)!;
        const activeUserId = user?.uid || 'jhonny-spider-ceo';
        const session = sessions.find(s => s.id === activeId)
          || LocalPersistence.getSessions(activeUserId).find(s => s.id === activeId);
        const currentMsgs = session?.messages || [];
        const updatedMessages = [...currentMsgs, botErrorMessage];
        saveSession({
          messages: updatedMessages,
          guidedSubject: activeSubject,
          currentArticle: activeArticle
        }, activeId, true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveToSchedules = async (data: EditalData) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const newSchedule: Schedule = {
      ...data,
      id,
      createdAt: Date.now(),
      completedIndices: []
    };

    LocalPersistence.saveSchedule(user.uid, newSchedule);
    setSchedules(prev => [newSchedule, ...prev]);
    alert("Cronograma salvo com sucesso!");

    if (auth.currentUser && !isQuotaExhausted()) {
      try {
        const cleaned = cleanData({
          ...newSchedule,
          userId: user.uid
        });
        await setDoc(doc(db, `users/${user.uid}/schedules`, id), cleaned);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/schedules/${id}`);
      }
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!user) return;
    LocalPersistence.deleteSchedule(user.uid, id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    if (auth.currentUser && !isQuotaExhausted()) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/schedules`, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/schedules/${id}`);
      }
    }
  };

  const markScheduleItemComplete = async (scheduleId: string, itemIndex: number) => {
    if (!user) return;
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const currentCompleted = schedule.completedIndices || [];
    if (currentCompleted.includes(itemIndex)) return;

    const newCompleted = [...currentCompleted, itemIndex];
    const updatedSchedule = { ...schedule, completedIndices: newCompleted };
    LocalPersistence.saveSchedule(user.uid, updatedSchedule);
    setSchedules(prev => prev.map(s => s.id === scheduleId ? updatedSchedule : s));

    // Award XP for completing a topic
    await awardXP(100);

    if (!isQuotaExhausted()) {
      try {
        await updateDoc(doc(db, `users/${user.uid}/schedules`, scheduleId), {
          completedIndices: newCompleted
        });
      } catch (error) {
        console.error("Mark complete error:", error);
      }
    }
  };

  const toggleTrilhaDayComplete = async (dayNumber: number) => {
    if (!user) return;
    const isCompleted = trilhaCompletedDays.includes(dayNumber);
    const newCompleted = isCompleted 
      ? trilhaCompletedDays.filter(d => d !== dayNumber)
      : [...trilhaCompletedDays, dayNumber];
    
    setTrilhaCompletedDays(newCompleted);
    LocalPersistence.saveTrilhaProgress(user.uid, newCompleted);

    if (!isCompleted) {
      await awardXP(150); // Premium reward of 150 XP!
    }

    if (auth.currentUser && !isQuotaExhausted()) {
      try {
        await setDoc(doc(db, `users/${user.uid}/trilha`, 'progress'), {
          completedDays: newCompleted,
          lastUpdated: Date.now()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/trilha/progress`);
      }
    }
  };

  const getTrilhaDayMessage = (dayNum: number, materias: { nome: string; conteudo: string }[], semana: number, style: string) => {
    const incidencia = calcularIncidenciaParaMaterias(dayNum, materias);
    const materialsList = materias.map(m => `- **${m.nome}**: ${m.conteudo}`).join('\n');
    
    let prep = '';
    if (style === 'automatico') {
      prep = `[INSTRUÇÃO DE INCIDÊNCIA DE BANCA - SISTEMA INTELIGENTE DE PRIORIZAÇÃO AUTOMÁTICA EM ATIVIDADE]
Nesta sessão de mentoria do Módulo Automático, as estatísticas históricas de alta performance (Magistratura, Ministério Público, Defensoria e Delegado) indicam que o estudo deste tema (Dia ${dayNum}) deve priorizar: ${incidencia.label}.
Percentuais exatíssimos de cobrança em provas de primeira, segunda e fase oral:
- Lei Seca (Texto da Lei): ${incidencia.porcentagens.leiSeca}%
- Doutrina (Teoria Densa): ${incidencia.porcentagens.doutrina}%
- Jurisprudência (Precedentes/Súmulas STF e STJ): ${incidencia.porcentagens.jurisprudencia}%

Justificativa Estatística e Metodológica:
${incidencia.justificativa}
Provas e Concursos de Referência Recente:
${incidencia.concursoHistorico}

Adote rigores condizentes com estes dados, concentrando a explanação guiada nesta prioridade definida e apresentando as porcentagens e referências logo após a sua saudação inicial para o aluno!
------
`;
    }
    
    return `${prep}ATHENA, conforme nosso cronograma da Trilha Jurídica de 100 Dias (Elite), hoje vamos para o estudo focado do DIA ${dayNum} (Semana ${semana}). Os materiais de hoje são:\n\n${materialsList}\n\nFaça um estudo aprofundado destes artigos focando especialmente na jurisprudência recente e questões de provas anteriores de Magistratura/Ministério Público. Siga o fluxo de estudos em blocos!`;
  };

  const getTrilhaDayDiscursiveMessage = (dayNum: number, materias: { nome: string; conteudo: string }[], semana: number) => {
    const list = materias.map(m => `- ${m.nome}: ${m.conteudo}`).join('\n');
    return `[SIMULADOR DE 2ª FASE - PROVA DISCURSIVA]
ATHENA, conforme nosso cronograma da Trilha Jurídica de 100 Dias (Elite), hoje vamos realizar um SIMULADO ESCRITO (2ª Fase) correspondente aos temas do DIA ${dayNum} (Semana ${semana}):
${list}

Sua missão como Examinadora de Elite da 2ª Fase:
1. Elabore uma única questão discursiva complexa e aprofundada baseada em um ou mais temas listados acima, simulando desafios reais das principais bancas (CESPE, VUNESP, FGV).
2. O problema deve conter um caso hipotético denso com desdobramentos de direito material e processual ou debate jurisprudencial intrigante (STF/STJ).
3. Apresente a questão ao candidato e instrua-o a redigir sua resposta fundamentada por escrito. Não dê a resposta ou o gabarito ainda! Aguarde a submissão para realizar o crivo rigoroso da banca.`;
  };

  const getTrilhaDayOralMessage = (dayNum: number, materias: { nome: string; conteudo: string }[], semana: number) => {
    const list = materias.map(m => `- ${m.nome}: ${m.conteudo}`).join('\n');
    return `[SIMULADOR DE EXAME ORAL - BANCA EXAMINADORA]
ATHENA, conforme nosso cronograma da Trilha Jurídica de 100 Dias (Elite), hoje vamos realizar uma ARGUIÇÃO EM EXAME ORAL (Prova Oral) baseada nos temas do DIA ${dayNum} (Semana ${semana}):
${list}

Sua conduta como Presidente da Mesa Examinadora:
1. Elabore um questionamento oral certeiro, claro e imponente (para ser respondido de forma falada pelo candidato). 
2. Divida-o de forma clara no texto. Instrua o candidato a utilizar os recursos de áudio e ditado por voz para fazer sua sustentação verbal com postura à banca examinadora.
3. Não mostre respostas, resoluções ou gabarito! Apresente apenas a pergunta direta e formal (Ex: "Candidato, em relação ao tema... disserte sobre..."). Aguarde a sustentação para proferir sua nota oficial das bancas.`;
  };

  const getTrilhaDayPartitionMessage = (dayNum: number, materias: { nome: string; conteudo: string }[], materialIndex: number, semana: number, style: string) => {
    const totalMaterials = materias.length;
    const currentMat = materias[materialIndex];
    if (!currentMat) return '';

    const incidencia = calcularIncidenciaParaMaterias(dayNum, [currentMat]);
    
    let prep = '';
    if (style === 'automatico') {
      prep = `[INSTRUÇÃO DE INCIDÊNCIA DE BANCA - SISTEMA INTELIGENTE DE PRIORIZAÇÃO AUTOMÁTICA EM ATIVIDADE]
Nesta sessão de mentoria do Módulo Automático, as estatísticas históricas de alta performance (Magistratura, Ministério Público, Defensoria e Delegado) indicam que o estudo de "${currentMat.nome}" (Dia ${dayNum}) deve priorizar: ${incidencia.label}.
Percentuais exatíssimos de cobrança em provas de primeira, segunda e fase oral:
- Lei Seca (Texto da Lei): ${incidencia.porcentagens.leiSeca}%
- Doutrina (Teoria Densa): ${incidencia.porcentagens.doutrina}%
- Jurisprudência (Precedentes/Súmulas STF e STJ): ${incidencia.porcentagens.jurisprudencia}%

Justificativa Estatística e Metodológica:
${incidencia.justificativa}
Provas e Concursos de Referência Recente:
${incidencia.concursoHistorico}

Adote rigores condizentes com estes dados, concentrando a explanação guiada nesta prioridade definida e apresentando as porcentagens e referências logo após a sua saudação inicial para o aluno!
------
`;
    }
    
    const dayItem = TRILHA_JURIDICA_DATA.find(d => d.dia === dayNum);
    
    // Eventual automatic trigger of discursive or oral challenges during the 100 days flow
    let hybridDirective = "";
    if (dayNum % 10 === 5 || dayNum % 5 === 0) {
      hybridDirective = `\n\n[ALERTA DE DESAFIO ESPECIAL - QUESTÃO DISCURSIVA (2ª FASE)]
Mesmo que o aluno esteja estudando no fluxo geral de 100 dias, hoje é um Dia de Desafio Especial Athena de 2ª Fase!
No Último Bloco (Bloco de Exercícios/Fixação / Questões), em vez de questões objetivas de múltipla escolha normais, elabore obrigatoriamente uma única QUESTÃO DISCURSIVA (2ª Fase) densa do tema estudado hoje para treinar o aluno, instruindo-o a redigir sua resposta fundamentada por escrito. Aguarde a submissão de sua resposta para proferir uma correção analítica rigorosa com nota final de banca.`;
    } else if (dayNum % 10 === 3 || dayNum % 7 === 0) {
      hybridDirective = `\n\n[ALERTA DE DESAFIO ESPECIAL - SIMULADO EXAME ORAL (3ª FASE)]
Mesmo que o aluno esteja estudando no fluxo geral de 100 dias, hoje é um Dia de Desafio Especial Athena de Exame Oral da 3ª Fase!
No Último Bloco (Bloco de Exercícios/Fixação / Questões), em vez de questões objetivas normais, apresente uma única ARGUIÇÃO ORAL (Pergunta de Exame Oral) formal de banca examinadora, instruindo o aluno a utilizar gravação de áudio ou digitação por ditado de voz para responder verbalmente sob pressão à banca. Aguarde a sustentação para proferir nota oficial de oratória jurídica.`;
    }

    let extraSource = `\n\n[DIRETRIZ DE PARETO (80/20) - ESTRATÉGIA DE ALTA PERFORMANCE PARA O DIA ${dayNum}]:
1. Aplique o PRINCÍPIO DE PARETO (80/20): com base nas provas de concursos jurídicos de elite (Magistratura, MP, Defensoria e Delegado), concentre o estudo nos temas de maior recorrência prática e cobrança em provas para ${currentMat.nome} (${currentMat.conteudo}).
2. Faça uma abordagem cirúrgica, enriquecida com pegadinhas, precedentes vinculantes do STF/STJ, súmulas e divergências doutrinárias de ponta.
3. Decodifique os conceitos e artigos no formato de 6 blocos pedagógicos estruturados.${hybridDirective}`;

    return `${prep}ATHENA, conforme nosso cronograma da Trilha Jurídica de 100 Dias (Elite), hoje vamos estudar de forma PARTICIONADA o tema do DIA ${dayNum} (Semana ${semana}) para garantir profundidade monumental sem sobrecarga de processamento.

Dentre os temas programados para hoje, este comando refere-se especificamente à seguinte parte:
**Parte ${materialIndex + 1} de ${totalMaterials}**: **${currentMat.nome}**: ${currentMat.conteudo}${extraSource}

Faça um estudo extremamente aprofundado, completo e detalhado deste conteúdo específico, com base na melhor doutrina, jurisprudência e na sua complementação por inteligência artificial sob o Princípio de Pareto aplicável a provas anteriores. Siga rigorosamente o fluxo de estudos em 6 blocos!`;
  };

  const prefetchNextTrilhaPart = async (dayNum: number, nextMatIdx: number, resolvedPhase: string, mStyle: any) => {
    const dayItem = TRILHA_JURIDICA_DATA.find(d => d.dia === dayNum);
    if (!dayItem || !dayItem.materias || nextMatIdx >= dayItem.materias.length) return;
    
    // Check if already in cache
    if (getCachedTrilhaPart(dayNum, nextMatIdx, resolvedPhase)) return;

    const nextMat = dayItem.materias[nextMatIdx];
    const nextMsg = getTrilhaDayPartitionMessage(
      dayNum,
      dayItem.materias,
      nextMatIdx,
      dayItem.semana,
      mStyle
    );

    try {
      console.log(`[ATHENA Pre-fetch] Disparando em background geração da Parte ${nextMatIdx + 1} de ${dayItem.materias.length} (Dia ${dayNum} - ${nextMat.nome})...`);
      const { text, model } = await askATHENA(nextMsg, [], user?.displayName || "Mestre", undefined, mStyle, resolvedPhase as any);
      setCachedTrilhaPart(dayNum, nextMatIdx, resolvedPhase, {
        text,
        model,
        timestamp: Date.now()
      });
      console.log(`[ATHENA Pre-fetch] Parte ${nextMatIdx + 1} (Dia ${dayNum}) salva em cache local com sucesso!`);
    } catch (err) {
      console.warn(`[ATHENA Pre-fetch] Não foi possível pré-carregar Parte ${nextMatIdx + 1}:`, err);
    }
  };

  const handleStartTrilhaStudy = async (dayNum: number, sessionType: 'estudo' | 'discursivo' | 'oral' = 'estudo') => {
    const dayItem = TRILHA_JURIDICA_DATA.find(d => d.dia === dayNum);
    if (!dayItem || !dayItem.materias || dayItem.materias.length === 0) return;

    setActiveTab('chat');

    const materialIndex = 0;
    let initialMsg = '';
    let titleStr = '';
    let guidedSubjectName = '';

    if (sessionType === 'discursivo') {
      initialMsg = getTrilhaDayDiscursiveMessage(dayNum, dayItem.materias, dayItem.semana);
      titleStr = `Dia ${dayNum} [2ª Fase Escrita]`;
      guidedSubjectName = 'Simulado 2ª Fase';
    } else if (sessionType === 'oral') {
      initialMsg = getTrilhaDayOralMessage(dayNum, dayItem.materias, dayItem.semana);
      titleStr = `Dia ${dayNum} [Exame Oral]`;
      guidedSubjectName = 'Simulado Exame Oral';
    } else {
      initialMsg = getTrilhaDayPartitionMessage(
        dayNum,
        dayItem.materias,
        materialIndex,
        dayItem.semana,
        mentorshipStyle
      );
      titleStr = `Trilha Dia ${dayNum}: P${materialIndex + 1}/${dayItem.materias.length}`;
      guidedSubjectName = dayItem.materias[materialIndex].nome;
    }

    let resolvedPhase: 'objetiva' | 'subjetiva' | 'oral' = mentorshipPhase;
    if (sessionType === 'discursivo') {
      resolvedPhase = 'subjetiva';
    } else if (sessionType === 'oral') {
      resolvedPhase = 'oral';
    } else if (dayNum % 5 === 0) {
      resolvedPhase = 'subjetiva';
    } else if (dayNum % 7 === 0 || dayNum % 10 === 3) {
      resolvedPhase = 'oral';
    } else {
      resolvedPhase = 'objetiva';
    }

    const id = crypto.randomUUID();
    const activeUserId = user?.uid || 'jhonny-spider-ceo';
    const newSession: ChatSession = {
      id,
      title: titleStr,
      userId: activeUserId,
      messages: [{ role: 'user', content: initialMsg }],
      guidedSubject: guidedSubjectName,
      currentArticle: 1,
      lastUpdatedAt: Date.now(),
      trilhaDay: dayNum,
      trilhaMaterialIndex: sessionType === 'estudo' ? materialIndex : undefined,
      trilhaSessionType: sessionType
    };

    if (sessionType === 'discursivo') {
      setMentorshipPhase('subjetiva');
    } else if (sessionType === 'oral') {
      setMentorshipPhase('oral');
    }

    // 1. Verificação de Cache Instantâneo (0s de espera)
    if (sessionType === 'estudo') {
      const cached = getCachedTrilhaPart(dayNum, 0, resolvedPhase);
      if (cached) {
        console.log(`[ATHENA Cache] Hit para Dia ${dayNum} Parte 1! Carregando instantaneamente (0s).`);
        const parsed = parseATHENAResponse(cached.text);
        const botMessage: Message = {
          role: 'model',
          content: parsed.content,
          challenge: parsed.challenge,
          blocks: parsed.blocks,
          currentBlockIndex: 0,
          subject: guidedSubjectName,
          article: 1,
          sourceType: 'gemini',
          modelName: `${cached.model} (Cache Instantâneo)`
        };

        const cachedSession: ChatSession = {
          ...newSession,
          messages: [{ role: 'user', content: initialMsg }, botMessage]
        };

        LocalPersistence.saveSession(activeUserId, cachedSession);
        setSessions(prev => [cachedSession, ...prev]);
        setCurrentSessionId(id);
        setGuidedSubject(guidedSubjectName);
        setCurrentArticle(1);
        setMessages([{ role: 'user', content: initialMsg }, botMessage]);
        setIsLoading(false);

        if (auth.currentUser && !isQuotaExhausted()) {
          try {
            const cleaned = cleanData(cachedSession);
            await setDoc(doc(db, `users/${user.uid}/sessions`, id), cleaned);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/sessions/${id}`);
          }
        }

        // Pré-carregamento em background da Parte 2
        prefetchNextTrilhaPart(dayNum, 1, resolvedPhase, mentorshipStyle);
        return;
      }
    }

    LocalPersistence.saveSession(activeUserId, newSession);
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(id);
    setGuidedSubject(guidedSubjectName);
    setCurrentArticle(1);
    setMessages([{ role: 'user', content: initialMsg }]);

    if (auth.currentUser && !isQuotaExhausted()) {
      try {
        const cleaned = cleanData(newSession);
        await setDoc(doc(db, `users/${user.uid}/sessions`, id), cleaned);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/sessions/${id}`);
      }
    }

    try {
      await handleSendMessageRequest(initialMsg, true, id, 1, guidedSubjectName, dayNum);
    } catch (sendErr) {
      console.error("[handleStartTrilhaStudy] Error sending initial trilha message:", sendErr);
    }
  };

  const advanceStage = async (msgIdx: number) => {
    const msg = messages[msgIdx];
    if (!msg || !msg.blocks) return;
    
    const isLastBlock = (msg.currentBlockIndex ?? 0) >= msg.blocks.length - 1;
    
    if (isLastBlock) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session && session.trilhaDay) {
        const dayNum = session.trilhaDay;
        const currentMatIdx = session.trilhaMaterialIndex ?? 0;
        const dayItem = TRILHA_JURIDICA_DATA.find(d => d.dia === dayNum);
        
        if (dayItem && dayItem.materias) {
          const nextMatIdx = currentMatIdx + 1;
          if (nextMatIdx < dayItem.materias.length) {
            const nextMat = dayItem.materias[nextMatIdx];
            const nextMsg = getTrilhaDayPartitionMessage(
              dayNum,
              dayItem.materias,
              nextMatIdx,
              dayItem.semana,
              mentorshipStyle
            );
            
            const updatedMessages: Message[] = [
              ...messages,
              { role: 'user', content: `Entendido. Vamos avançar para a Parte ${nextMatIdx + 1} de ${dayItem.materias.length} (${nextMat.nome})!` }
            ];
            setMessages(updatedMessages);
            setIsLoading(true);

            setGuidedSubject(nextMat.nome);
            setCurrentArticle(1);

            const updatedSessions = sessions.map(s => {
              if (s.id === currentSessionId) {
                return {
                  ...s,
                  title: `Trilha Dia ${dayNum}: P${nextMatIdx + 1}/${dayItem.materias.length}`,
                  guidedSubject: nextMat.nome,
                  trilhaMaterialIndex: nextMatIdx,
                  messages: updatedMessages
                };
              }
              return s;
            });
            setSessions(updatedSessions);
            await saveSession({
              title: `Trilha Dia ${dayNum}: P${nextMatIdx + 1}/${dayItem.materias.length}`,
              guidedSubject: nextMat.nome,
              trilhaMaterialIndex: nextMatIdx,
              messages: updatedMessages
            }, currentSessionId);

            let resolvedPhase: 'objetiva' | 'subjetiva' | 'oral' = mentorshipPhase;
              if (session?.trilhaSessionType === 'discursivo') {
                resolvedPhase = 'subjetiva';
              } else if (session?.trilhaSessionType === 'oral') {
                resolvedPhase = 'oral';
              } else if (session?.trilhaDay !== undefined) {
                const dayNumVal = session.trilhaDay;
                if (dayNumVal % 5 === 0) {
                  resolvedPhase = 'subjetiva';
                } else if (dayNumVal % 7 === 0 || dayNumVal % 10 === 3) {
                  resolvedPhase = 'oral';
                } else {
                  resolvedPhase = 'objetiva';
                }
              }

              // 1. Verificação Instantânea de Cache (0s)
              const cached = getCachedTrilhaPart(dayNum, nextMatIdx, resolvedPhase);
              if (cached) {
                console.log(`[ATHENA Cache] Hit para Dia ${dayNum} Parte ${nextMatIdx + 1}! Carregamento instantâneo (0s).`);
                const parsed = parseATHENAResponse(cached.text);
                const botMessage: Message = {
                  role: 'model',
                  content: parsed.content,
                  challenge: parsed.challenge,
                  blocks: parsed.blocks,
                  currentBlockIndex: 0,
                  subject: nextMat.nome,
                  article: 1,
                  sourceType: 'gemini',
                  modelName: `${cached.model} (Cache Instantâneo)`
                };
                const finalMessages = [...updatedMessages, botMessage];
                setMessages(finalMessages);
                setIsLoading(false);

                const updatedSessions = sessions.map(s => {
                  if (s.id === currentSessionId) {
                    return {
                      ...s,
                      title: `Trilha Dia ${dayNum}: P${nextMatIdx + 1}/${dayItem.materias.length}`,
                      guidedSubject: nextMat.nome,
                      trilhaMaterialIndex: nextMatIdx,
                      messages: finalMessages
                    };
                  }
                  return s;
                });
                setSessions(updatedSessions);
                await saveSession({
                  title: `Trilha Dia ${dayNum}: P${nextMatIdx + 1}/${dayItem.materias.length}`,
                  guidedSubject: nextMat.nome,
                  trilhaMaterialIndex: nextMatIdx,
                  messages: finalMessages
                }, currentSessionId);

                setTimeout(() => {
                  const firstBlock = document.getElementById(`block-${finalMessages.length - 1}-0`);
                  if (firstBlock) {
                    firstBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 120);

                // Dispara pre-fetch da próxima parte em background
                prefetchNextTrilhaPart(dayNum, nextMatIdx + 1, resolvedPhase, mentorshipStyle);
                return;
              }

              try {
                // Cada parte da trilha possui comando autocontido com escopo exato.
                // Usamos histórico limpo ([]), idêntico ao prefetch, para máxima agilidade e sem poluição de contexto.
                const { text: responseText, model: usedModel } = await askATHENA(nextMsg, [], user?.displayName || "Mestre", undefined, mentorshipStyle, resolvedPhase);
                const parsed = parseATHENAResponse(responseText);
                const botMessage: Message = {
                  role: 'model',
                  content: parsed.content,
                  challenge: parsed.challenge,
                  blocks: parsed.blocks,
                  currentBlockIndex: 0,
                  subject: nextMat.nome,
                  article: 1,
                  sourceType: 'gemini',
                  modelName: usedModel
                };
                
                const finalMessages = [...updatedMessages, botMessage];
                setMessages(finalMessages);

                // Armazena no cache local persistente
                setCachedTrilhaPart(dayNum, nextMatIdx, resolvedPhase, {
                  text: responseText,
                  model: usedModel,
                  timestamp: Date.now()
                });

                // Automatically sync trilha content to IndexedDB for offline viewing
                cacheArticle(nextMat.nome, 1, parsed.content);
                if (parsed.challenge?.questions) {
                  parsed.challenge.questions.forEach(q => {
                    cacheQuestion({
                      ...q,
                      subject: nextMat.nome
                    });
                  });
                }
                
                await saveSession({
                  messages: finalMessages
                }, currentSessionId);

                setTimeout(() => {
                  const firstBlock = document.getElementById(`block-${finalMessages.length - 1}-0`);
                  if (firstBlock) {
                    firstBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 120);

                // Pré-carrega a parte subsequente em background
                prefetchNextTrilhaPart(dayNum, nextMatIdx + 1, resolvedPhase, mentorshipStyle);
              } catch (err: any) {
                console.error("Error generating next trilha part:", err);
                const errorMessage = err?.message || err?.toString() || "Erro na conexão com ATHENA";
                if (errorMessage.includes('[API_TOKEN_EXHAUSTED]') || isQuotaExhausted()) {
                  setTokenExhaustedBanner(true);
                }
                const botErrorMessage: Message = {
                  role: 'model',
                  content: `⚠️ **Ocorreu um problema na conexão com ATHENA**\n\nNão foi possível obter uma resposta do mentor para a Parte ${nextMatIdx + 1} (${nextMat.nome}).\n\n**Detalhes do Erro:** \`${errorMessage}\`\n\n*Clique em **Recarregar Lição** para tentar novamente.*`,
                  blocks: [`⚠️ **Ocorreu um problema na conexão com ATHENA**\n\nNão foi possível obter uma resposta do mentor para a Parte ${nextMatIdx + 1} (${nextMat.nome}).\n\n**Detalhes do Erro de Conexão:** \`${errorMessage}\``],
                  currentBlockIndex: 0,
                  subject: nextMat.nome,
                  article: 1
                };
                const finalMessages = [...updatedMessages, botErrorMessage];
                setMessages(finalMessages);
                await saveSession({
                  messages: finalMessages
                }, currentSessionId);
              } finally {
                setIsLoading(false);
              }
            } else {
              // No more parts remaining! Congratulate and complete the Trilha day.
              if (!trilhaCompletedDays.includes(dayNum)) {
                await toggleTrilhaDayComplete(dayNum);
              }
              
              const congratMsg = `🎉 **Parabéns de Elite!** Você completou todos os blocos de estudo do **Dia ${dayNum} da Trilha Jurídica de 100 Dias!**\n\nTodos os temas programados foram vencidos de forma fracionada e aprofundada. Você faturou **+150 XP**!\n\nContinue obstinado rumo à posse! Deseja programar os estudos de amanhã ou revisar o conteúdo de hoje?`;
              
              const finalMessages: Message[] = [
                ...messages,
                {
                  role: 'model',
                  content: congratMsg,
                  blocks: [congratMsg],
                  currentBlockIndex: 0
                }
              ];
              
              setMessages(finalMessages);
              await saveSession({
                messages: finalMessages
              }, currentSessionId);
            }
          }
          return;
        }

        // Default (non-trilha) flow
        const nextArt = (msg.article || currentArticle) + 1;
        setCurrentArticle(nextArt);
        handleSendMessage(`Excelente. Vamos avançar para o Artigo ${nextArt} da ${guidedSubject}?`, true, nextArt);
        return;
      }

      const updatedMessages = (messages || []).map((m, i) => {
        if (i === msgIdx) {
          const nextIndex = (m.currentBlockIndex ?? 0) + 1;
          
          // If it's the last block, and we have an active study item, mark it complete
          if (nextIndex === (m.blocks?.length ?? 0) - 1 && activeStudyItem) {
            markScheduleItemComplete(activeStudyItem.scheduleId, activeStudyItem.itemIndex);
          }

          return { ...m, currentBlockIndex: nextIndex };
        }
        return m;
      });
      setMessages(updatedMessages);
      saveSession({ messages: updatedMessages });

      // Transição suave com scroll automático para o novo bloco revelado
      const targetBlockIndex = (messages[msgIdx]?.currentBlockIndex ?? 0) + 1;
      setTimeout(() => {
        const nextBlockEl = document.getElementById(`block-${msgIdx}-${targetBlockIndex}`);
        if (nextBlockEl) {
          nextBlockEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 120);
    };

  const skipTrilhaLesson = async (msgIdx: number) => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (session && session.trilhaDay !== undefined) {
      const dayNum = session.trilhaDay;
      const currentMatIdx = session.trilhaMaterialIndex ?? 0;
      const dayItem = TRILHA_JURIDICA_DATA.find(d => d.dia === dayNum);
      const isEstudo = session.trilhaSessionType === 'estudo' || !session.trilhaSessionType;
      
      if (dayItem && dayItem.materias && isEstudo) {
        const nextMatIdx = currentMatIdx + 1;
        if (nextMatIdx < dayItem.materias.length) {
          const nextMat = dayItem.materias[nextMatIdx];
          const nextMsg = getTrilhaDayPartitionMessage(
            dayNum,
            dayItem.materias,
            nextMatIdx,
            dayItem.semana,
            mentorshipStyle
          );
          
          const updatedMessages: Message[] = [
            ...messages,
            { role: 'user', content: `[PULADO] Quero pular esta lição e avançar diretamente para o próximo tema da Trilha (${nextMat.nome})!` }
          ];
          setMessages(updatedMessages);
          setIsLoading(true);

          setGuidedSubject(nextMat.nome);
          setCurrentArticle(1);

          const updatedSessions = sessions.map(s => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                title: `Trilha Dia ${dayNum}: P${nextMatIdx + 1}/${dayItem.materias.length}`,
                guidedSubject: nextMat.nome,
                trilhaMaterialIndex: nextMatIdx,
                messages: updatedMessages
              };
            }
            return s;
          });
          setSessions(updatedSessions);
          await saveSession({
            title: `Trilha Dia ${dayNum}: P${nextMatIdx + 1}/${dayItem.materias.length}`,
            guidedSubject: nextMat.nome,
            trilhaMaterialIndex: nextMatIdx,
            messages: updatedMessages
          }, currentSessionId);

          try {
            const history = updatedMessages.slice(0, -1).map(m => ({
              role: m.role,
              parts: [{ text: m.content }]
            }));
            let resolvedPhase = mentorshipPhase;
            if (session?.trilhaSessionType === 'discursivo') {
              resolvedPhase = 'subjetiva';
            } else if (session?.trilhaSessionType === 'oral') {
              resolvedPhase = 'oral';
            } else if (session?.trilhaDay !== undefined) {
              const dayNumVal = session.trilhaDay;
              if (dayNumVal % 5 === 0) {
                resolvedPhase = 'subjetiva';
              } else if (dayNumVal % 7 === 0 || dayNumVal % 10 === 3) {
                resolvedPhase = 'oral';
              } else {
                resolvedPhase = 'objetiva';
              }
            }
            const { text: responseText, model: usedModel } = await askATHENA(nextMsg, history, user?.displayName || "Mestre", undefined, mentorshipStyle, resolvedPhase);
            const parsed = parseATHENAResponse(responseText);
            const botMessage: Message = {
              role: 'model',
              content: parsed.content,
              challenge: parsed.challenge,
              blocks: parsed.blocks,
              currentBlockIndex: 0,
              subject: nextMat.nome,
              article: 1,
              sourceType: 'gemini',
              modelName: usedModel
            };
            
            const finalMessages = [...updatedMessages, botMessage];
            setMessages(finalMessages);
            await saveSession({
              messages: finalMessages
            }, currentSessionId);
          } catch (err: any) {
            console.error("Error skipping lesson and generating next part:", err);
            const errorMessage = err?.message || err?.toString() || "Erro na conexão com ATHENA";
            const botErrorMessage: Message = {
              role: 'model',
              content: `⚠️ **Ocorreu um problema na conexão com ATHENA**\n\nNão foi possível obter uma resposta do mentor para a Parte ${nextMatIdx + 1} (${nextMat.nome}).\n\n**Detalhes do Erro:** \`${errorMessage}\`\n\n*Clique em **Recarregar Lição** para tentar novamente.*`,
              blocks: [`⚠️ **Ocorreu um problema na conexão com ATHENA**\n\nNão foi possível obter uma resposta do mentor para a Parte ${nextMatIdx + 1} (${nextMat.nome}).\n\n**Detalhes do Erro de Conexão:** \`${errorMessage}\``],
              currentBlockIndex: 0,
              subject: nextMat.nome,
              article: 1
            };
            const finalMessages = [...updatedMessages, botErrorMessage];
            setMessages(finalMessages);
            await saveSession({
              messages: finalMessages
            }, currentSessionId);
          } finally {
            setIsLoading(false);
          }
          return;
        }
      }

      // Conclude Day!
      if (!trilhaCompletedDays.includes(dayNum)) {
        await toggleTrilhaDayComplete(dayNum);
      }
      
      const activityLabel = session.trilhaSessionType === 'discursivo' ? 'Treino Discursivo de 2ª Fase' 
                          : session.trilhaSessionType === 'oral' ? 'Treino de Exame Oral'
                          : 'Estudo do Dia';

      const congratMsg = `⏭️ **Lição Pulada!** Você decidiu pular esta atividade de **${activityLabel}** correspondente ao **Dia ${dayNum}** da Trilha Jurídica. Ela foi arquivada e o dia foi assinalado como vencido em seu cronograma para manter o seu bônus de consistência diária!\n\nContinue prosseguindo obstinado para os próximos tópicos de elite!`;
      
      const finalMessages: Message[] = [
        ...messages,
        {
          role: 'model',
          content: congratMsg,
          blocks: [congratMsg],
          currentBlockIndex: 0
        }
      ];
      
      setMessages(finalMessages);
      await saveSession({
        messages: finalMessages
      }, currentSessionId);
    } else {
      // Non-trilha or just generic
      const nextArt = currentArticle + 1;
      setCurrentArticle(nextArt);
      handleSendMessage(`Excelente. Decidimos pular e vamos avançar para o próximo artigo (Art. ${nextArt})!`, true, nextArt);
    }
  };

  const retryMessage = async (msgIdx: number) => {
    if (isLoading) return;
    const msg = messages[msgIdx];
    if (!msg || msg.role !== 'model') return;

    const prevMsgIdx = msgIdx - 1;
    if (prevMsgIdx < 0) return;
    const prevMsg = messages[prevMsgIdx];
    if (!prevMsg) return;

    const activeUserId = user?.uid || 'jhonny-spider-ceo';
    const activeSession = sessions.find(s => s.id === currentSessionId)
      || LocalPersistence.getSessions(activeUserId).find(s => s.id === currentSessionId);
    const dayNum = activeSession?.trilhaDay;

    // Remove the failed bot message from state
    const truncatedMessages = messages.slice(0, msgIdx);
    setMessages(truncatedMessages);

    try {
      await handleSendMessageRequest(
        prevMsg.content,
        true,
        currentSessionId,
        msg.article || currentArticle,
        msg.subject || guidedSubject,
        dayNum
      );
    } catch (err) {
      console.error("Error retrying lesson:", err);
    }
  };

  const saveReview = async (msgIdx: number) => {
    const msg = messages[msgIdx];
    const targetSubject = msg.subject || guidedSubject || 'Estudo Geral';
    const targetArticle = msg.article || currentArticle || 0;
    
    if (!msg.blocks || !currentSessionId) return;
    
    // Try to find the review block
    let reviewText = msg.blocks[msg.blocks.length - 1];
    
    if (msg.blocks.length >= 6) {
      reviewText = msg.blocks[5];
    } else {
      const likelyReview = msg.blocks.find(b => 
        b.toLowerCase().includes('revisão') || 
        (b.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•')).length >= 5)
      );
      if (likelyReview) reviewText = likelyReview;
    }
    
    if (!reviewText || reviewText.length < 20) return;

    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    
    const currentReviews = session.reviews || [];
    
    // Check if duplicate in this session
    const isDuplicate = currentReviews.some(r => 
      r.subject === targetSubject && 
      r.article === targetArticle && 
      r.content === reviewText
    );
    
    if (isDuplicate) return;

    const newReview: Review = {
      id: crypto.randomUUID(),
      sessionId: currentSessionId,
      subject: targetSubject,
      article: targetArticle,
      content: reviewText,
      timestamp: Date.now()
    };

    await saveSession({ reviews: [...currentReviews, newReview] });
    // Save to local IndexedDB cache
    cacheArticle(targetSubject, targetArticle, reviewText);
  };

  const getStageLabel = (index: number) => {
    const labels = [
      "Saudação & Contexto",
      "Lei Seca",
      "Jurisprudência & Súmulas",
      "Doutrina & Exemplos",
      "Desafio ATHENA",
      "Revisão Célere"
    ];
    return labels[index] || "Próxima Etapa";
  };

  const currentSubject = subjects.find(s => s.name === guidedSubject);
  const progress = currentSubject ? (currentArticle / currentSubject.maxArticles) * 100 : 0;

  // Find the last model message with blocks to create the interactive side-scroller tracker
  const lastModelMsgWithBlocks = useMemo(() => {
    return [...messages].reverse().find(m => m.role === 'model' && m.blocks && m.blocks.length > 0);
  }, [messages]);

  const activeBlockCount = lastModelMsgWithBlocks?.blocks?.length ?? 0;
  const currentBlockIndex = lastModelMsgWithBlocks?.currentBlockIndex ?? 0;
  const lastModelMsgIdx = useMemo(() => {
    if (!lastModelMsgWithBlocks) return -1;
    return messages.findIndex(m => m === lastModelMsgWithBlocks);
  }, [messages, lastModelMsgWithBlocks]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-50 font-sans athena-gradient overflow-hidden">
      {/* Top Header */}
      <header className="h-16 border-b border-white/5 flex items-center px-4 lg:px-8 justify-between bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-brand-gold border-2 border-slate-950 flex items-center justify-center shadow-lg">
              <Scale size={16} className="text-slate-950 w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-100 font-serif font-bold tracking-tight">ATHENA</p>
            <div className="flex items-center gap-1.5 px-0.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div className="flex flex-col">
                <span className="text-[10px] lg:text-[10px] uppercase tracking-widest text-slate-500 font-bold truncate max-w-[120px] sm:max-w-none">
                  {guidedSubject 
                    ? (guidedSubject.includes('Edital') && currentArticle === 0 
                      ? `${guidedSubject.split(' ')[0]} • Raio-X` 
                      : `${guidedSubject.split(' ')[0]} • Art. ${currentArticle}`)
                    : "Online • Mentoria Ativa"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 lg:gap-6">
           {guidedSubject && activeTab === 'chat' && (
             <button 
              onClick={() => setGuidedSubject(null)}
              className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-red-100 hover:text-white transition-all border border-red-500/40 px-3 py-1.5 rounded-xl bg-red-500/20 active:scale-95 shadow-lg shadow-red-500/10"
             >
               Sair
             </button>
           )}
            {/* Botão de Configurações de IA */}
            <button
              onClick={() => setIsAiSettingsOpen(true)}
              className="px-2.5 py-1.5 text-brand-gold hover:text-white transition-all rounded-xl bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/25 flex items-center gap-1.5 active:scale-95 text-[10px] font-bold cursor-pointer shadow-sm"
              title="Status e Diagnóstico da IA Gemini"
            >
              <Cpu size={14} className="animate-pulse text-brand-gold shrink-0" />
              <span className="font-mono text-[9px] sm:text-[10px] tracking-wider uppercase">IA Status</span>
            </button>

           {user && (
             <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-white/10">
               <div className="hidden sm:flex flex-col items-end">
                 <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                   {isCEO && (
                     <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded-md shadow-sm">
                       👑 CEO
                     </span>
                   )}
                   {user.displayName || (isCEO ? 'Jhonny' : 'Aluno')}
                 </span>
                 <span className="text-[9px] text-slate-500 font-mono truncate max-w-[140px]">{user.email}</span>
               </div>
               <button 
                onClick={() => handleLogout()}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10 active:scale-95"
                title="Sair da Conta"
               >
                 <LogOut size={17} />
               </button>
             </div>
           )}
           
           {/* Mobile Sidebar Toggle - Positioned within header now */}
           <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 bg-slate-900 border border-brand-gold/30 rounded-xl text-brand-gold ml-1 shadow-lg active:scale-95 transition-transform"
            title="Abrir Menu e Histórico"
           >
              <Menu size={20} />
           </button>
        </div>
      </header>

      {/* Resilient Quota Notification Banner */}
      {firestoreQuotaReached && (
        <div id="firestore-quota-banner" className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between gap-3 shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Resiliente Local Ativo:</strong> A cota diária de gravações do Firestore foi atingida. Seus estudos, questões e progresso continuam sendo salvos com segurança localmente neste navegador e serão sincronizados automaticamente na nuvem quando a cota resetar.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setQuotaExhausted(false);
                setFirestoreQuotaReached(false);
              }}
              className="px-2.5 py-1 text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              Reconectar Nuvem
            </button>
            <a 
              href="https://console.firebase.google.com/project/gen-lang-client-0822763072/firestore/databases/ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb/data?openUpgradeDialog=true" 
              target="_blank" 
              rel="noreferrer"
              className="underline text-amber-300 hover:text-white font-medium whitespace-nowrap"
            >
              Ver Cota Firebase
            </a>
            <button 
              onClick={() => setFirestoreQuotaReached(false)} 
              className="text-amber-400 hover:text-amber-100 p-1"
              title="Fechar aviso"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-md lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Edge Swipe Handle (Mobile Only) - Allows swiping from edge to open sidebar */}
      {!isSidebarOpen && (
        <motion.div 
          className="lg:hidden fixed inset-y-0 left-0 w-8 z-50 cursor-e-resize"
          onPan={(_, info) => {
            if (info.offset.x > 20) setIsSidebarOpen(true);
          }}
          style={{ touchAction: 'none' }}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50) setIsSidebarOpen(false);
          if (info.offset.x > 50) setIsSidebarOpen(true);
        }}
        initial={false}
        animate={isSidebarOpen ? { x: 0 } : { x: window.innerWidth < 1024 ? "-100%" : 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[85vw] max-w-sm bg-slate-900 shadow-[20px_0_60px_rgba(0,0,0,0.5)] border-r border-brand-gold/10 lg:relative lg:w-72 lg:shadow-none lg:bg-slate-900/80 lg:backdrop-blur-xl lg:translate-x-0",
          !isSidebarOpen && "pointer-events-none lg:pointer-events-auto"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-brand-gold/15 p-6 pointer-events-auto">
          <div className="flex items-center justify-between mb-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-gold/10 rounded-xl border border-brand-gold/20">
                <Scale className="text-brand-gold" size={24} />
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold tracking-tight text-slate-100">ATHENA</h1>
                <p className="text-[10px] uppercase tracking-widest text-brand-gold/70 font-semibold">Mentoria Jurídica</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 bg-slate-800/80 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 flex flex-col lg:min-h-0 space-y-6 shrink-0">
            {/* Gamification Progress */}
            {user && (
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-brand-gold/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy size={40} className="text-brand-gold" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Nível {gamification.level}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{gamification.totalXP % 500} / 500 XP</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mb-3 border border-white/5">
                    <motion.div 
                      key={gamification.totalXP}
                      initial={{ width: 0 }}
                      animate={{ width: `${(gamification.totalXP % 500) / 5}%` }}
                      className="h-full bg-gradient-to-r from-brand-gold/50 to-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap size={10} className="text-brand-gold" />
                      <span className="text-[10px] font-bold text-slate-300">{gamification.streak} Dias Siga</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy size={10} className="text-brand-gold" />
                      <span className="text-[10px] font-bold text-slate-300">{gamification.totalXP} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estilo de Mentoria */}
            {user && (
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2 mx-4 lg:mx-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Settings2 size={12} className="text-brand-gold" />
                    Estilo de Mentoria
                  </span>
                </div>
                
                <div className="w-full text-left p-2.5 rounded-xl border bg-brand-gold/5 border-brand-gold/15 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg shrink-0 mt-0.5 border text-brand-gold bg-brand-gold/10 border-brand-gold/20">
                    <Sparkles size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold leading-tight text-brand-gold">
                      Perfil Automático (Ativo)
                    </span>
                    <span className="text-[9px] text-slate-500 leading-none mt-0.5 block">
                      A Athena inteligente alternará dinamicamente entre Lei Seca, Doutrina e Jurisprudência conforme a incidência do tema.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Fase do Concurso */}
            {user && (
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-3 mx-4 lg:mx-0 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers size={12} className="text-brand-gold" />
                    Fase do Concurso
                  </span>
                  <span className="text-[9px] font-bold text-brand-gold/70 bg-brand-gold/5 px-2 py-0.5 rounded border border-brand-gold/10 uppercase tracking-tighter">
                    Ativa
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  {[
                    {
                      id: 'objetiva',
                      label: 'Provas Objetivas (1ª Fase)',
                      desc: 'Múltipla escolha, lei seca e súmulas',
                      icon: Zap,
                      unlocked: true,
                    },
                    {
                      id: 'subjetiva',
                      label: 'Provas Subjetivas (2ª Fase)',
                      desc: isCEO ? 'Casos discursivos, dissertações e peças (Acesso CEO Ilimitado)' : 'Exclusivo Perfil Mestre / Assinatura Premium',
                      icon: FileText,
                      unlocked: isCEO,
                    },
                    {
                      id: 'oral',
                      label: 'Provas Orais (3ª Fase)',
                      desc: isCEO ? 'Simulações de arguições sob pressão (Acesso CEO Ilimitado)' : 'Exclusivo Perfil Mestre / Assinatura Premium',
                      icon: MessageSquare,
                      unlocked: isCEO,
                    }
                  ].map((phase) => {
                    const isSelected = mentorshipPhase === phase.id;
                    const IconComp = phase.icon;
                    const isPlLocked = !phase.unlocked;
                    return (
                      <button
                        key={phase.id}
                        type="button"
                        onClick={() => {
                          if (!isPlLocked) {
                            setMentorshipPhase(phase.id as any);
                          } else {
                            setShowPaywallModal(true);
                          }
                        }}
                        className={cn(
                          "w-full text-left p-2 rounded-xl border flex items-start gap-2 transition-all outline-none",
                          isSelected 
                            ? "bg-brand-gold/10 border-brand-gold/30 shadow-md shadow-brand-gold/5" 
                            : isPlLocked
                              ? "bg-slate-950/20 border-transparent opacity-50 cursor-not-allowed"
                              : "bg-slate-900/20 border-transparent hover:border-white/10 hover:bg-slate-800/20"
                        )}
                      >
                        <div className={cn(
                          "p-1 rounded-lg shrink-0 mt-0.5 border",
                          isSelected 
                            ? "text-brand-gold bg-brand-gold/10 border-brand-gold/20" 
                            : isPlLocked
                              ? "text-slate-650 bg-slate-950/20 border-transparent"
                              : "text-slate-500 bg-slate-950/40 border-white/5"
                        )}>
                          {isPlLocked ? <Lock size={12} className="text-slate-500" /> : <IconComp size={12} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-[11px] font-bold leading-tight transition-colors flex items-center gap-1.5",
                              isSelected ? "text-brand-gold" : isPlLocked ? "text-slate-500" : "text-slate-300"
                            )}>
                              {phase.label}
                            </span>
                            {isSelected ? (
                              <div className="w-1.5 h-1.5 bg-brand-gold rounded-full shrink-0" />
                            ) : isPlLocked ? (
                              <Lock size={10} className="text-slate-600 shrink-0" />
                            ) : null}
                          </div>
                          <span className={cn(
                            "text-[9px] leading-none mt-0.5 block truncate",
                            isPlLocked ? "text-slate-600 font-medium" : "text-slate-500"
                          )}>
                            {phase.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => {
                  setCurrentSessionId(null);
                  setMessages([]);
                  setGuidedSubject(null);
                  setCurrentArticle(1);
                  setActiveTab('chat');
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-gold text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-brand-gold/20 mb-4 active:scale-95"
              >
                <Scale size={16} />
                Página Inicial
              </button>

               {[
                 { icon: BookOpen, label: 'Fluxo de Estudo', id: 'chat' },
                 { icon: Trophy, label: 'Trilha 100 Dias', id: 'trilha' },
                 { icon: Target, label: 'Cronogramas', id: 'schedules' },
                 { icon: BarChart2, label: 'Estatística', id: 'stats' },
                 { icon: Zap, label: 'Revisão Comprimida', id: 'reviews' },
                 // Biblioteca Offline removed
                 { icon: Users, label: 'Mentorandos', id: 'mentees' },
               ].filter(item => item.id !== 'mentees' || user?.email?.toLowerCase() === 'jhonny.spider@gmail.com').map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm",
                    activeTab === item.id 
                      ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/20" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  )}
                >
                  <item.icon size={18} className={cn(activeTab === item.id ? "text-brand-gold" : "text-slate-500 group-hover:text-brand-gold/70")} />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Histórico de Mentoria</span>
                <History size={12} className="text-slate-600" />
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-52 lg:max-h-none space-y-1.5 scrollbar-thin pr-1">
                {sessions.length === 0 ? (
                  <div className="px-4 py-8 text-center border border-dashed border-white/5 rounded-2xl">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">Nenhuma sessão anterior encontrada.</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => switchSession(session.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-300 group relative flex items-center justify-between gap-3 border cursor-pointer overflow-hidden",
                        currentSessionId === session.id 
                          ? "bg-slate-800/90 shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-brand-gold/30 ring-1 ring-brand-gold/10" 
                          : "bg-slate-900/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                      )}
                    >
                      {currentSessionId === session.id && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-brand-gold shadow-[2px_0_10px_rgba(212,175,55,0.4)]"
                        />
                      )}
                      <div className="flex-1 min-w-0 pl-1">
                        <p className={cn(
                          "text-xs font-bold truncate transition-colors",
                          currentSessionId === session.id ? "text-brand-gold" : "text-slate-300 group-hover:text-slate-100"
                        )}>
                          {session.title}
                        </p>
                        <p className={cn(
                          "text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors",
                          currentSessionId === session.id ? "text-slate-400" : "text-slate-600"
                        )}>
                          {new Date(session.lastUpdatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0 relative z-10" onClick={(e) => e.stopPropagation()}>
                        <AnimatePresence mode="wait">
                          {sessionToDelete === session.id ? (
                            <motion.div 
                              key="confirm"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex items-center gap-1"
                            >
                              <button 
                                onClick={(e) => deleteSession(e, session.id)}
                                className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                                title="Confirmar Exclusão"
                              >
                                <X size={12} />
                              </button>
                              <button 
                                onClick={() => setSessionToDelete(null)}
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
                              animate={{ opacity: sessions.length > 0 ? 1 : 0 }}
                              exit={{ opacity: 0 }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSessionToDelete(session.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                              title="Excluir Mentoria"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {guidedSubject && !guidedSubject.includes('Edital') && (
              <div className="pt-4 flex flex-col h-[300px] border-t border-white/5">
                <div className="px-4 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold block mb-1">Sumário Nobre</span>
                    <h3 className="text-xs font-serif font-bold text-slate-100">{guidedSubject}</h3>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                        />
                      </div>
                      <span className="text-[9px] font-black text-brand-gold/80 tabular-nums">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <div className="p-2 bg-brand-gold/10 rounded-xl border border-brand-gold/20 text-brand-gold">
                    <History size={14} />
                  </div>
                </div>

                <div 
                  ref={articleGridRef}
                  className="flex-1 overflow-y-auto max-h-52 lg:max-h-none px-4 lg:px-4 pr-2 mt-2 space-y-6 scroll-smooth scrollbar-thin"
                >
                  <div className="grid grid-cols-5 lg:grid-cols-4 gap-2 pb-10">
                    {Array.from({ length: subjects.find(s => s.name === guidedSubject)?.maxArticles || 0 }, (_, i) => i + 1).map((artNum) => {
                      const isCurrent = currentArticle === artNum;
                      const isStudied = currentArticle > artNum;
                      
                      return (
                        <button
                          key={artNum}
                          onClick={() => jumpToArticle(artNum)}
                          data-active={isCurrent}
                          className={cn(
                            "aspect-square flex items-center justify-center rounded-xl text-xs transition-all font-black border",
                            isCurrent 
                              ? "bg-brand-gold text-slate-950 shadow-[0_0_20px_rgba(212,175,55,0.5)] border-brand-gold scale-110 z-10" 
                              : isStudied
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60"
                                : "bg-slate-950 text-slate-500 hover:text-brand-gold hover:bg-slate-800 border-white/10"
                          )}
                        >
                          {artNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Navigation Input */}
                <div className="px-4 pt-4 mt-auto border-t border-white/5 bg-slate-900/50 pb-2">
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <input 
                        type="number"
                        value={navInput}
                        onChange={(e) => setNavInput(e.target.value)}
                        placeholder="Saltar p/ Art."
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] focus:border-brand-gold/50 outline-none text-slate-100 placeholder:text-slate-700"
                        onKeyDown={(e) => e.key === 'Enter' && jumpToArticle(parseInt(navInput))}
                      />
                    </div>
                    <button 
                      onClick={() => jumpToArticle(parseInt(navInput))}
                      className="p-2 bg-brand-gold rounded-xl text-slate-950 hover:scale-105 transition-transform"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-tight">
                    Total: {subjects.find(s => s.name === guidedSubject)?.maxArticles} Artigos
                  </p>
                </div>
              </div>
            )}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Main Content Area */}
        <div id="main-scroller" className="flex-1 overflow-y-auto px-4 md:px-8 py-6 lg:py-10 scrollbar-thin pr-1 pb-10">
          <div className="max-w-4xl mx-auto space-y-12">
            {loadingAuth ? (
              <div className="flex flex-col items-center justify-center pt-40">
                <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !user ? (
                <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center space-y-8 pt-16 max-w-md mx-auto"
              >
                <div className="p-6 bg-brand-gold/5 rounded-[3rem] border border-brand-gold/20 shadow-2xl relative">
                   <div className="absolute inset-0 bg-brand-gold/10 blur-3xl rounded-full" />
                   <Scale className="text-brand-gold relative z-10" size={64} />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-serif font-bold text-slate-100">Bem-vindo à <span className="text-brand-gold">ATHENA</span></h2>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
                    Mentoria jurídica de elite com análise de edital, 6 blocos estruturados e simulação de prova oral por inteligência artificial.
                  </p>
                </div>

                {authError && (
                  <div className="w-full p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 text-center space-y-1">
                    <p className="font-bold flex items-center justify-center gap-1.5">
                      <AlertTriangle size={14} />
                      Aviso de Autenticação
                    </p>
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">{authError}</p>
                  </div>
                )}

                <div className="w-full space-y-3">
                  {/* Botão Oficial Google Sign-In em Destaque */}
                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-wider text-xs rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_15px_35px_rgba(255,255,255,0.25)] transition-all active:scale-95 cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Entrar com Conta Google</span>
                  </button>

                  {/* Acesso para Estudantes e Testadores (Trial 7 Dias) */}
                  <button 
                    onClick={handleLoginAsGuest}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-brand-gold/30 hover:border-brand-gold/60 font-bold uppercase tracking-wider text-[11px] rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={15} className="text-brand-gold" />
                    <span>Entrar como Aluno (7 Dias Grátis)</span>
                  </button>

                  <div className="pt-2 text-center">
                    <button 
                      onClick={() => {
                        setShowCeoModal(true);
                        setCeoPinError(null);
                        setCeoPinInput('');
                      }}
                      className="text-[10px] text-slate-600 hover:text-brand-gold uppercase tracking-widest transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Lock size={11} />
                      <span>Acesso Mestre (Restrito ao Administrador)</span>
                    </button>
                  </div>
                </div>

                {/* Modal Seguro de Validação do PIN Mestre para CEO */}
                {showCeoModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-slate-900 border border-brand-gold/40 rounded-3xl p-6 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-brand-gold">
                          <Lock size={18} />
                          <h3 className="font-serif font-bold text-sm text-slate-100">Acesso Restrito CEO</h3>
                        </div>
                        <button 
                          onClick={() => setShowCeoModal(false)}
                          className="text-slate-400 hover:text-white p-1 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Insira o PIN Mestre de Segurança para autenticar como <span className="text-brand-gold font-mono font-bold">jhonny.spider@gmail.com</span>:
                      </p>

                      <form onSubmit={handleVerifyCeoPin} className="space-y-4">
                        <div>
                          <input
                            type="password"
                            maxLength={6}
                            value={ceoPinInput}
                            onChange={(e) => setCeoPinInput(e.target.value)}
                            placeholder="Digite o PIN Mestre (ex: 7777)"
                            autoFocus
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-brand-gold rounded-xl text-center text-lg tracking-widest text-slate-100 outline-none transition-colors"
                          />
                          {ceoPinError && (
                            <p className="text-[11px] text-rose-400 mt-2 text-center font-medium">{ceoPinError}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCeoModal(false)}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 shadow-lg transition-all"
                          >
                            Validar PIN
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'stats' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="text-center space-y-4">
                   <h2 className="text-3xl font-serif font-bold text-slate-100">Suas <span className="text-brand-gold">Estatísticas</span></h2>
                   <p className="text-slate-400 text-sm">Acompanhe seu desempenho e precisão em cada matéria.</p>
                </div>
                <Suspense fallback={<div className="h-64 bg-slate-900 border border-white/5 rounded-[2.5rem] animate-pulse flex items-center justify-center text-xs text-slate-500 font-medium">Carregando métricas de performance acadêmica...</div>}>
                  <StatsChart data={userStats} />
                </Suspense>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {userStats.length === 0 ? (
                     <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                       <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Sem estatísticas disponíveis ainda.</p>
                     </div>
                   ) : userStats.map((stat, i) => (
                     <div key={i} className="p-6 bg-slate-900 border border-white/5 rounded-[2rem] space-y-4 hover:border-brand-gold/30 transition-all group shadow-xl">
                       <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">{stat.subjectName}</p>
                         <Trophy size={14} className="text-slate-700 group-hover:text-brand-gold transition-colors" />
                       </div>
                       
                       <div className="space-y-1">
                         <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500">
                           <span>Progresso</span>
                           <span>{Math.round(stat.progress || 0)}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${stat.progress}%` }}
                             className="h-full bg-slate-200"
                           />
                         </div>
                       </div>

                       <div className="flex items-end justify-between pt-2">
                         <div className="space-y-1">
                           <p className="text-2xl font-serif font-bold text-slate-100">
                             {stat.totalQuestions > 0 ? Math.round((stat.correctAnswers / stat.totalQuestions) * 100) : 0}%
                           </p>
                           <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-none">Precisão Geral</p>
                         </div>
                         <div className="text-right">
                           <p className="text-lg font-bold text-brand-gold">{stat.xp || 0}</p>
                           <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-none">XP Obtido</p>
                         </div>
                       </div>
                       
                       <div className="pt-2 flex items-center justify-between border-t border-white/5">
                          <span className="text-[9px] text-slate-500 uppercase font-black">{stat.correctAnswers} / {stat.totalQuestions} Acertos</span>
                          {stat.progress >= 100 && (
                            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-black uppercase">
                              <Sparkles size={10} />
                              Concluído
                            </span>
                          )}
                       </div>
                     </div>
                   ))}
                </div>

                {/* Failed Questions Review Section */}
                <div className="space-y-6 pt-10 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                      <ShieldAlert className="text-red-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-bold text-slate-100">Refazer Questões Incorretas</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Domine seus pontos fracos</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {failedQuestions.length === 0 ? (
                      <div className="py-12 text-center bg-slate-900 shadow-sm border border-brand-gold/10 rounded-3xl border-dashed">
                        <Trophy className="text-slate-700 mx-auto mb-3" size={32} />
                        <p className="text-xs text-slate-500 font-medium">Parabéns! Você não tem questões pendentes para revisão.</p>
                      </div>
                    ) : (
                      failedQuestions.map((q) => (
                        <QuizQuestion 
                          key={q.id}
                          question={q}
                          hideExplanationInitially={true}
                          onAnswer={(answerIndex, correct) => {
                            if (q.subject) {
                               updateStats(q.subject, correct, q, answerIndex);
                            }
                          }}
                          onDelete={async () => {
                            if (q.id && user) {
                              LocalPersistence.deleteFailedQuestion(user.uid, q.id);
                              setFailedQuestions(prev => prev.filter(item => item.id !== q.id));
                              if (!isQuotaExhausted()) {
                                try {
                                  await deleteDoc(doc(db, `users/${user.uid}/failed_questions`, q.id));
                                } catch (err) {
                                  console.error("Error deleting failed question:", err);
                                }
                              }
                            }
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'reviews' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="text-center space-y-4">
                   <h2 className="text-3xl font-serif font-bold text-slate-100"><span className="text-brand-gold">Revisão</span> Comprimida</h2>
                   <p className="text-slate-400 text-sm">Acesse rapidamente os pontos-chave de todos os artigos já estudados.</p>
                </div>
                <Suspense fallback={<div className="h-48 bg-slate-900 border border-white/5 rounded-[2.5rem] animate-pulse flex items-center justify-center text-xs text-slate-500 font-medium">Carregando lista de revisões comprimidas...</div>}>
                  <ReviewList 
                    reviews={reviews} 
                    onSelect={(rev) => {
                      switchSession(rev.sessionId);
                      // Force a scroll to the specific section after a small delay for DOM updates
                      setTimeout(() => {
                        const id = `review-${rev.subject.replace(/\s+/g, '-').toLowerCase()}-${rev.article}`;
                        const element = document.getElementById(id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 300);
                    }} 
                    onDelete={(id) => {
                      const rev = reviews.find(r => r.id === id);
                      deleteReview(id, rev?.sessionId);
                    }}
                  />
                </Suspense>
              </motion.div>
            ) : activeTab === 'schedules' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="text-left space-y-2">
                    <h2 className="text-3xl font-serif font-bold text-slate-100 flex items-center gap-3">
                      Meus <span className="text-brand-gold">Cronogramas</span>
                    </h2>
                    <p className="text-slate-400 text-sm">Gerencie seus planos de estudos e personalize o que deseja visualizar.</p>
                  </div>

                        <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-md -mx-2 sm:mx-0">
                          <div className="flex items-center gap-3 mb-3 px-2">
                            <Settings2 size={14} className="text-brand-gold" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Colunas Visíveis</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'dia', label: 'Dia' },
                              { id: 'disciplina', label: 'Disciplina' },
                              { id: 'topico', label: 'Tópico' },
                              { id: 'fontes', label: 'Fontes' },
                              { id: 'questoes', label: 'Meta' }
                            ].map(col => (
                              <button
                                key={col.id}
                                onClick={() => {
                                  setVisibleSchedulesColumns(prev => 
                                    prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id]
                                  );
                                }}
                                className={cn(
                                  "px-2 sm:px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-bold transition-all border",
                                  visibleSchedulesColumns.includes(col.id)
                                    ? "bg-brand-gold/20 border-brand-gold/30 text-brand-gold"
                                    : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                                )}
                              >
                                {col.label}
                              </button>
                            ))}
                          </div>
                        </div>
                </div>
                
                {schedules.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/30">
                    <History className="text-slate-700 mx-auto mb-4" size={48} />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                      Nenhum cronograma salvo.<br/>
                      <span className="text-[10px] lowercase font-normal opacity-60">Inicie um estudo por edital para gerar um novo plano.</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-12 pb-20">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="bg-slate-900/60 rounded-[2.5rem] border border-white/5 p-8 space-y-8 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                            onClick={() => deleteSchedule(schedule.id)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                            title="Excluir Cronograma"
                           >
                             <Trash2 size={20} />
                           </button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                           <div className="space-y-2">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-brand-gold rounded-full" />
                               <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/60">Edital Analisado</span>
                             </div>
                             <h3 className="text-2xl font-serif font-bold text-slate-50">{schedule.title}</h3>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Gerado em: {new Date(schedule.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-sm font-serif font-bold text-brand-gold flex items-center gap-2">
                             <BarChart2 size={16} />
                             Resumo do Raio-X
                           </h4>
                           <Suspense fallback={<div className="h-44 bg-slate-950/40 rounded-3xl border border-white/5 animate-pulse flex items-center justify-center text-xs text-slate-500 font-medium whitespace-normal">Processando mapa estocástico de incidência...</div>}>
                             <IncidenceChart data={schedule.raioX} />
                           </Suspense>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-sm font-serif font-bold text-brand-gold flex items-center gap-2">
                             <Target size={16} />
                             Cronograma Semanal
                           </h4>
                           <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-950/40">
                             <table className="w-full text-left border-collapse min-w-[500px]">
                               <thead>
                                 <tr className="bg-slate-900/80 border-b border-white/5">
                                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-12 text-center">Status</th>
                                   {visibleSchedulesColumns.includes('dia') && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Dia</th>}
                                   {visibleSchedulesColumns.includes('disciplina') && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Disciplina</th>}
                                   {visibleSchedulesColumns.includes('topico') && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tópico</th>}
                                   {visibleSchedulesColumns.includes('fontes') && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Fontes Sugeridas</th>}
                                   {visibleSchedulesColumns.includes('questoes') && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Meta de Questões</th>}
                                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-white/5">
                                 {schedule.cronograma.map((item, idx) => {
                                   const isCompleted = schedule.completedIndices?.includes(idx);
                                   
                                   return (
                                     <tr key={idx} className={cn(
                                       "hover:bg-white/[0.02] transition-colors relative group/row",
                                       isCompleted && "bg-emerald-500/[0.02]"
                                     )}>
                                       <td className="px-6 py-4 text-center">
                                         <div className={cn(
                                           "w-5 h-5 rounded-md border flex items-center justify-center transition-all mx-auto",
                                           isCompleted 
                                             ? "bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                                             : "border-white/10 bg-slate-950/50"
                                         )}>
                                           {isCompleted && <Zap size={10} className="text-slate-950" />}
                                         </div>
                                       </td>
                                       {visibleSchedulesColumns.includes('dia') && (
                                         <td className={cn(
                                           "px-6 py-4 font-bold text-sm whitespace-nowrap",
                                           isCompleted ? "text-emerald-500/60" : "text-slate-300"
                                         )}>{item.dia}</td>
                                       )}
                                       {visibleSchedulesColumns.includes('disciplina') && (
                                         <td className={cn(
                                           "px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors",
                                           isCompleted ? "text-emerald-500/40" : "text-brand-gold"
                                         )}>{item.disciplina}</td>
                                       )}
                                       {visibleSchedulesColumns.includes('topico') && (
                                         <td className={cn(
                                           "px-6 py-4 text-xs leading-relaxed max-w-xs transition-opacity",
                                           isCompleted ? "text-slate-500 line-through opacity-50" : "text-slate-400"
                                         )}>
                                           <div className="font-semibold text-slate-200">{item.topico}</div>
                                           {item.reviews && item.reviews.length > 0 && (
                                             <div className="mt-3.5 space-y-2 border-t border-dashed border-brand-gold/15 pt-2.5">
                                               <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-amber-400">
                                                 <Sparkles size={10} className="animate-pulse" />
                                                 <span>{item.reviews.length} {item.reviews.length === 1 ? 'Revisão Agendada' : 'Revisões Agendadas'}</span>
                                               </div>
                                               {item.reviews.map((rev: any, revIdx: number) => (
                                                 <div key={revIdx} className="flex items-start md:items-center justify-between gap-3 p-2 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/20 transition-all pointer-events-auto">
                                                   <div className="flex flex-col min-w-0">
                                                     <span className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider truncate max-w-[170px]">
                                                       {rev.subject || item.disciplina}
                                                     </span>
                                                     <span className="text-[10px] text-slate-300 font-medium truncate max-w-[170px]" title={rev.text}>
                                                       {rev.text}
                                                     </span>
                                                   </div>
                                                   <button
                                                     type="button"
                                                     onClick={(e) => {
                                                       e.preventDefault();
                                                       e.stopPropagation();
                                                       setActiveTab('chat');
                                                       handleSendMessageRequest(`ATHENA, vamos realizar o re-estudo científico de uma questão que errei na matéria de "${rev.subject || item.disciplina}".
                                                      
Questão Errada: "${rev.text}"
Opções propostas anteriormente:
${rev.options?.map((opt: string, optI: number) => `[${optI}] ${opt}`).join('\n') || ''}

A explicação original do erro:
"${rev.explanation || ''}"

Por favor, me ensine a doutrina e jurisprudência envolvidas, explique de forma clínica por que errei, e me forneça 1 nova questão inédita para ver se agora estou dominando o assunto!`, false);
                                                     }}
                                                     className="px-2 py-1 rounded-lg bg-brand-gold hover:bg-white text-slate-950 text-[9px] font-black uppercase transition-all shadow-sm shrink-0 cursor-pointer"
                                                   >
                                                     Revisar
                                                   </button>
                                                 </div>
                                               ))}
                                              </div>
                                            )}
                                         </td>
                                       )}
                                       {visibleSchedulesColumns.includes('fontes') && (
                                         <td className={cn(
                                           "px-6 py-4 text-[10px] leading-relaxed italic transition-opacity",
                                           isCompleted ? "text-slate-700 opacity-30" : "text-slate-500"
                                         )}>{item.fontes}</td>
                                       )}
                                       {visibleSchedulesColumns.includes('questoes') && (
                                         <td className="px-6 py-4 text-center">
                                           <span className={cn(
                                             "text-[10px] font-black py-1 px-2 rounded-lg border transition-all",
                                             isCompleted 
                                               ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/40" 
                                               : "bg-brand-gold/10 border-brand-gold/20 text-brand-gold"
                                           )}>
                                             {item.questoes}
                                           </span>
                                         </td>
                                       )}
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                           <button
                                             onClick={() => {
                                               setActiveTab('chat');
                                               setActiveStudyItem({ scheduleId: schedule.id, itemIndex: idx });
                                               handleSendMessageRequest(`ATHENA, conforme nosso cronograma do edital "${schedule.title}", vamos iniciar o estudo EXAUSTIVO do tema: "${item.topico}" da disciplina "${item.disciplina}". Siga rigorosamente o fluxo de 6 blocos, fornecendo profundidade máxima para nível de MP/Magistratura e gerando exatamente ${Math.max(10, item.questoes)} questões desafiadoras no final.`, false);
                                             }}
                                             className={cn(
                                               "text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto justify-end transition-all",
                                               isCompleted 
                                                 ? "text-emerald-500 hover:text-emerald-400" 
                                                 : "text-brand-gold hover:text-brand-gold/80"
                                             )}
                                           >
                                             <Zap size={12} className={isCompleted ? "animate-none" : "animate-pulse"} />
                                             {isCompleted ? "Reestudar" : "Estudar Agora"}
                                           </button>
                                         </td>
                                     </tr>
                                   );
                                 })}
                               </tbody>
                             </table>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'trilha' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 text-left"
              >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-black text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">Módulo de Elite</span>
                    <h2 className="text-3xl font-serif font-bold text-slate-100">
                      Trilha Jurídica <span className="text-brand-gold">100 Dias</span>
                    </h2>
                    <p className="text-slate-400 text-sm max-w-xl">
                      Cronograma completo adaptado pela ATHENA. Monitore suas metas de leitura de artigos da Constituição, Códigos Civil, Penal, Processos e Leis Especiais.
                    </p>
                  </div>

                  {/* Circular progress indicator */}
                  <div className="bg-slate-950/60 p-6 rounded-3xl border border-white/5 flex items-center gap-4 shrink-0">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" className="text-white/5" strokeWidth="4" fill="transparent" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" className="text-brand-gold" strokeWidth="4" fill="transparent"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - (trilhaCompletedDays.length / 100))}
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-slate-100">{Math.round((trilhaCompletedDays.length / 100) * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Progresso Trilhado</span>
                      <span className="text-xl font-bold font-mono text-slate-100">{trilhaCompletedDays.length}<span className="text-slate-600 text-sm"> / 100 dias</span></span>
                      <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-2 font-mono">+{trilhaCompletedDays.length * 150} XP</span>
                    </div>
                  </div>
                </div>

                {/* Week Selector Grid (14 Weeks) */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-widest font-black text-slate-500 flex items-center gap-2">
                    <BookOpen size={14} className="text-brand-gold" />
                    Selecione a Semana de Estudos
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-7 gap-2">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const weekNum = i + 1;
                      const isSelected = selectedTrilhaWeek === weekNum;
                      const weekDays = TRILHA_JURIDICA_DATA.filter(d => d.semana === weekNum).map(d => d.dia);
                      const completedInWeek = weekDays.filter(d => trilhaCompletedDays.includes(d)).length;
                      const isWeekFullyCompleted = completedInWeek === weekDays.length && weekDays.length > 0;

                      return (
                        <button
                          key={weekNum}
                          onClick={() => setSelectedTrilhaWeek(weekNum)}
                          className={cn(
                            "py-3 px-2 rounded-2xl text-center border transition-all relative flex flex-col justify-center items-center gap-1 active:scale-95 group",
                            isSelected
                              ? "bg-brand-gold/20 border-brand-gold/30 text-brand-gold shadow-lg shadow-brand-gold/5"
                              : isWeekFullyCompleted
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                          )}
                        >
                          <span className="text-[10px] font-bold block leading-none">Semana</span>
                          <span className="text-base font-serif font-black">{weekNum}</span>
                          <div className="flex gap-0.5 mt-0.5 max-w-full flex-wrap justify-center">
                            {weekDays.map((dayNum) => {
                              const isDayDone = trilhaCompletedDays.includes(dayNum);
                              return (
                                <div key={dayNum} className={cn("w-1 h-1 rounded-full", isDayDone ? "bg-emerald-400" : "bg-white/10")} />
                              );
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Days of Selected Week */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-lg font-serif font-bold text-brand-gold flex items-center gap-2">
                      <Target size={18} />
                      Atividades da Semana {selectedTrilhaWeek}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      Filtrado: {TRILHA_JURIDICA_DATA.filter(d => d.semana === selectedTrilhaWeek).length} Dias organizados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-6 text-slate-100">
                    {TRILHA_JURIDICA_DATA.filter(d => d.semana === selectedTrilhaWeek).map((dayItem) => {
                      const isCompleted = trilhaCompletedDays.includes(dayItem.dia);
                      const incidencia = calcularIncidenciaParaMaterias(dayItem.dia, dayItem.materias);
                      
                      return (
                        <div
                          key={dayItem.dia}
                          className={cn(
                            "bg-slate-900/40 border rounded-[2rem] p-6 lg:p-8 flex flex-col gap-6 transition-all group relative overflow-hidden",
                            isCompleted ? "border-emerald-500/20 bg-emerald-500/[0.01]" : "border-white/5 hover:border-white/10"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0 left-0 w-1 h-full transition-all",
                            isCompleted ? "bg-emerald-500" : "bg-brand-gold"
                          )} />

                          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center w-full">
                            <div className="space-y-4 flex-1 w-full">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className={cn(
                                  "text-xs font-black uppercase tracking-widest px-3 py-1 rounded-xl font-mono",
                                  isCompleted ? "bg-emerald-500/15 text-emerald-400" : "bg-brand-gold/15 text-brand-gold"
                                )}>
                                  DIA {dayItem.dia}
                                </span>
                                {false && dayItem.fonteCompleta && (
                                  <button
                                    onClick={() => setInspectedTrilhaFonte({
                                      dia: dayItem.dia,
                                      title: `Material de Apoio (Fonte Sugerida) - Dia ${dayItem.dia}`,
                                      content: dayItem.fonteCompleta!
                                    })}
                                    className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-slate-950 border border-brand-gold/20 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-mono cursor-pointer transition-all active:scale-95"
                                  >
                                    <Sparkles size={10} className="animate-pulse" />
                                    <span>Material de Apoio (Fonte)</span>
                                  </button>
                                )}
                                {isCompleted && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                                    <Zap size={10} /> Concluído (+150 XP)
                                  </span>
                                )}
                                {dayItem.dia > 7 && !isCEO && (
                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                                    <Sparkles size={10} /> Trial (Homologação)
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                                {dayItem.materias.map((mat, mIdx) => (
                                  <div key={mIdx} className="bg-slate-950/40 p-3 rounded-2xl border border-white/5 flex flex-col justify-center min-h-[56px]">
                                    <span className="text-[10px] font-black uppercase text-brand-gold/70 tracking-tight block leading-tight truncate">{mat.nome}</span>
                                    <span className={cn("text-xs font-medium text-slate-200 mt-1 block leading-tight", isCompleted && "line-through opacity-40 text-slate-500")}>
                                      {mat.conteudo}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-row sm:flex-row lg:flex-col lg:items-end justify-between lg:justify-center w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5 shrink-0">
                              <button
                                onClick={() => toggleTrilhaDayComplete(dayItem.dia)}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border w-full sm:w-auto lg:w-full justify-center",
                                  isCompleted
                                    ? "bg-slate-800/40 border-emerald-500/30 text-emerald-450 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                                    : "bg-slate-950/60 border-white/5 text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400"
                                )}
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                  isCompleted ? "bg-emerald-500 border-emerald-500" : "border-slate-600"
                                )}>
                                  {isCompleted && <Zap size={8} className="text-slate-950" />}
                                </div>
                                {isCompleted ? "Desmarcar Dia" : "Concluir Dia"}
                              </button>

                              <button
                                onClick={() => {
                                  handleStartTrilhaStudy(dayItem.dia);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-brand-gold text-slate-950 hover:bg-white hover:shadow-lg active:scale-95 w-full sm:w-auto lg:w-full justify-center"
                              >
                                <Scale size={13} />
                                Estudar Agora
                              </button>
                            </div>
                          </div>

                          {/* Estatística de Incidência do Dia */}
                          <div className="bg-slate-950/20 rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row gap-4 items-stretch justify-between">
                            <div className="space-y-1.5 flex-1 min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded font-mono",
                                  incidencia.prioridade === 'lei_seca' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                  incidencia.prioridade === 'doutrina' ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/20" :
                                  "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                )}>
                                  Foco Inteligente: {incidencia.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
                                💡 <strong className="text-slate-350">Análise das Bancas:</strong> {incidencia.justificativa}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                🎯 <strong className="text-slate-400">Referência Histórica:</strong> {incidencia.concursoHistorico}
                              </p>
                            </div>
                            
                            <div className="flex flex-row md:flex-col justify-around gap-4 items-center md:items-stretch min-w-[200px] border-t md:border-t-0 md:border-l border-white/5 pt-2 md:pt-0 md:pl-4">
                              <div className="space-y-1 w-full text-left">
                                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                  <span>Lei Seca</span>
                                  <span className="text-emerald-400 font-bold">{incidencia.porcentagens.leiSeca}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                  <div className="bg-emerald-450 h-full rounded-full" style={{ width: `${incidencia.porcentagens.leiSeca}%` }} />
                                </div>
                              </div>
                              
                              <div className="space-y-1 w-full text-left">
                                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                  <span>Doutrina</span>
                                  <span className="text-brand-gold font-bold">{incidencia.porcentagens.doutrina}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                  <div className="bg-brand-gold h-full rounded-full" style={{ width: `${incidencia.porcentagens.doutrina}%` }} />
                                </div>
                              </div>
                              
                              <div className="space-y-1 w-full text-left">
                                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                  <span>Jurisprudência</span>
                                  <span className="text-sky-400 font-bold">{incidencia.porcentagens.jurisprudencia}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                  <div className="bg-sky-400 h-full rounded-full" style={{ width: `${incidencia.porcentagens.jurisprudencia}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'mentees' && user?.email?.toLowerCase() === 'jhonny.spider@gmail.com' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-serif font-bold text-slate-100">
                    Nossos <span className="text-brand-gold">Mentorandos</span>
                  </h2>
                  <p className="text-slate-400 text-sm">Acompanhe o progresso e a evolução de cada aluno na plataforma.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {mentees.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Nenhum mentorando encontrado.</p>
                    </div>
                  ) : (() => {
                    const mainSubjects = subjects.filter(s => !s.id.startsWith('doutrina') && !s.id.startsWith('sigilo') && !s.id.startsWith('reparticao'));
                    const totalPossible = mainSubjects.length * 100;

                    return mentees.sort((a, b) => b.id === user?.uid ? -1 : 1).map((mentee) => {
                      const currentProgressTotal = mentee.stats.reduce((acc, s) => acc + (s.progress || 0), 0);
                      const overallPercentage = totalPossible > 0 ? Math.min(100, Math.round((currentProgressTotal / totalPossible))) : 0;

                      return (
                        <div key={mentee.id} className="bg-slate-900/60 border border-white/5 rounded-3xl lg:rounded-[2rem] p-5 lg:p-8 flex flex-col md:flex-row gap-6 lg:gap-8 items-center md:items-start group transition-all hover:border-brand-gold/30">
                          <div className="relative">
                            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl bg-slate-800 border-2 border-brand-gold/20 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform">
                              {mentee.photoURL ? (
                                <img src={mentee.photoURL} alt={mentee.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Users size={28} className="text-brand-gold/40" />
                              )}
                            </div>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 lg:border-4 border-slate-900 flex items-center justify-center text-[8px] lg:text-[10px] font-black",
                              mentee.id === user?.uid ? "bg-emerald-500 text-emerald-950" : "bg-brand-gold text-slate-950"
                            )}>
                              {mentee.id === user?.uid ? "VC" : "M"}
                            </div>
                          </div>

                          <div className="flex-1 space-y-4 lg:space-y-6 w-full">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 lg:gap-4">
                              <div className="text-center md:text-left">
                                <h3 className="text-lg lg:text-xl font-serif font-bold text-slate-100">{mentee.displayName}</h3>
                                <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5 leading-none">{mentee.email}</p>
                              </div>
                              <div className="text-center md:text-right">
                                <span className="text-2xl lg:text-3xl font-serif font-black text-brand-gold leading-none">{overallPercentage}%</span>
                                <p className="text-[8px] lg:text-[9px] text-slate-600 font-bold uppercase tracking-tighter mt-1">Conclusão</p>
                              </div>
                            </div>

                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${overallPercentage}%` }}
                                className="h-full bg-brand-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                              />
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {mentee.stats.length === 0 ? (
                                <p className="text-[10px] text-slate-600 font-bold uppercase italic">Iniciando a jornada acadêmica...</p>
                              ) : (
                                mentee.stats.slice(0, 5).map((s, idx) => (
                                  <div key={idx} className="px-3 py-1.5 bg-slate-950/50 border border-white/5 rounded-xl flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.subjectName.split(' ')[0]}</span>
                                    <div className="w-8 bg-white/5 h-1 rounded-full overflow-hidden">
                                      <div className="h-full bg-brand-gold/60" style={{ width: `${s.progress}%` }} />
                                    </div>
                                    <span className="text-[9px] font-bold text-brand-gold/80 tabular-nums">{Math.round(s.progress)}%</span>
                                  </div>
                                ))
                              )}
                              {mentee.stats.length > 5 && (
                                <div className="px-3 py-1.5 bg-slate-950/50 border border-white/5 rounded-xl flex items-center">
                                  <span className="text-[9px] font-black text-slate-600">+{mentee.stats.length - 5}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
            ) : (
              <>
            {messages.length === 0 && !guidedSubject && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-12 pt-10"
              >
                <div className="space-y-6">
                  <div className="inline-flex p-4 bg-brand-gold/5 rounded-3xl border border-brand-gold/10">
                     <Sparkles className="text-brand-gold" size={40} />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-serif font-bold text-slate-100 tracking-tight">O que vamos <span className="text-brand-gold">dominar</span> hoje, {user.displayName?.split(' ')[0]}?</h2>
                    <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm">
                      Envie sua consulta jurídica, dúvida de doutrina ou tema de estudo abaixo para a mentoria ativa da ATHENA.
                    </p>
                    
                    {/* Active Mentorship Style Indicator */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-brand-gold/10 rounded-full text-[11px] font-bold text-slate-300 shadow-lg mt-2">
                      <Sparkles size={12} className="text-brand-gold animate-pulse" />
                      <span>Athena configurada para o perfil:</span>
                      <span className="text-brand-gold font-extrabold uppercase tracking-widest text-[10px]">
                        {mentorshipStyle === 'automatico' ? 'Automático Inteligente (Doutrina, Jurisprudência ou Lei Seca por Incidência)' :
                         mentorshipStyle === 'teorico' ? 'Teórico-Doutrinário' : 
                         mentorshipStyle === 'jurisprudente' ? 'Jurisprudência / Precedentes' : 
                         'Prático e Casuística'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Módulo de Trilha Jurídica - Página Inicial */}
                {(() => {
                  const nextUncompletedTrilhaDayNum = Array.from({ length: 100 }, (_, idx) => idx + 1).find(d => !trilhaCompletedDays.includes(d)) || 100;
                  const activeInspectedDayNum = dashboardDay || nextUncompletedTrilhaDayNum;
                  const activeTrilhaDayItem = TRILHA_JURIDICA_DATA.find(d => d.dia === activeInspectedDayNum) || TRILHA_JURIDICA_DATA[0];
                  
                  const completedDaysInTrilha = TRILHA_JURIDICA_DATA.filter(d => trilhaCompletedDays.includes(d.dia)).length;
                  const totalPercent = Math.round((completedDaysInTrilha / TRILHA_JURIDICA_DATA.length) * 100);

                  const isInspectedCompleted = trilhaCompletedDays.includes(activeInspectedDayNum);
                  const activeIncidencia = calcularIncidenciaParaMaterias(activeInspectedDayNum, activeTrilhaDayItem.materias);

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-4xl mx-auto bg-slate-900/40 border border-brand-gold/20 rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden text-left shadow-2xl backdrop-blur-md"
                    >
                      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        
                        {/* Left Side: Day Inspector (Col-span 7) */}
                        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] uppercase tracking-widest font-black text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20 flex items-center gap-1">
                                <Trophy size={11} /> TRILHA DE ELITE
                              </span>
                              <span className="text-[10px] font-bold font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                Progresso: {completedDaysInTrilha}/100 dias ({totalPercent}%)
                              </span>
                              {isInspectedCompleted ? (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
                                  <Zap size={10} /> Concluído (+150 XP)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-brand-gold/90 bg-brand-gold/5 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
                                  <Target size={10} /> Pendente
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-serif font-bold text-slate-100">
                                  Dia {activeInspectedDayNum}
                                </h3>
                                <span className="text-xs text-slate-400">
                                  (Semana {activeTrilhaDayItem.semana})
                                </span>
                              </div>
                              {activeInspectedDayNum === nextUncompletedTrilhaDayNum && (
                                <p className="text-slate-400 text-xs flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
                                  <span className="text-[9px] bg-brand-gold/15 text-brand-gold px-1.5 py-0.5 rounded font-bold font-mono uppercase tracking-wide">
                                    Sua meta de hoje
                                  </span>
                                </p>
                              )}
                            </div>

                            {/* List of study areas of the selected day */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
                              {activeTrilhaDayItem.materias.map((mat, mIdx) => (
                                <div 
                                  key={mIdx} 
                                  className={cn(
                                    "p-3 rounded-2xl border transition-all flex flex-col justify-center min-h-[52px]",
                                    isInspectedCompleted 
                                      ? "bg-slate-950/20 border-emerald-500/10 opacity-70" 
                                      : "bg-slate-950/50 border-white/5 hover:border-white/10"
                                  )}
                                >
                                  <span className="text-[9px] font-black uppercase text-brand-gold/80 tracking-tight block leading-tight">{mat.nome}</span>
                                  <span className={cn(
                                    "text-xs font-semibold text-slate-300 mt-0.5 block leading-tight",
                                    isInspectedCompleted && "line-through text-slate-550"
                                  )}>
                                    {mat.conteudo}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Bloco de Priorização de Incidência na Home */}
                            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-3.5 space-y-2 mt-3">
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded font-mono",
                                  activeIncidencia.prioridade === 'lei_seca' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                  activeIncidencia.prioridade === 'doutrina' ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/20" :
                                  "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                )}>
                                  Foco de Banca: {activeIncidencia.label}
                                </span>
                                <span className="text-[9px] font-bold font-mono text-slate-500">Mapeamento Estatístico</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-normal">
                                💡 <strong className="text-slate-300">Análise de Incidência:</strong> {activeIncidencia.justificativa}
                              </p>
                              <p className="text-[9px] text-slate-500 font-mono">
                                🏛️ <strong className="text-slate-450">Referência Prova:</strong> {activeIncidencia.concursoHistorico}
                              </p>
                              
                              <div className="grid grid-cols-3 gap-3 pt-2.5 border-t border-white/5">
                                <div>
                                  <div className="flex justify-between text-[8px] font-mono text-slate-450 leading-tight">
                                    <span>Lei Seca</span>
                                    <span className="text-emerald-400 font-bold">{activeIncidencia.porcentagens.leiSeca}%</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-0.5 mt-0.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-400 h-full" style={{ width: `${activeIncidencia.porcentagens.leiSeca}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-[8px] font-mono text-slate-450 leading-tight">
                                    <span>Doutrina</span>
                                    <span className="text-brand-gold font-bold">{activeIncidencia.porcentagens.doutrina}%</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-0.5 mt-0.5 rounded-full overflow-hidden">
                                    <div className="bg-brand-gold h-full" style={{ width: `${activeIncidencia.porcentagens.doutrina}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-[8px] font-mono text-slate-450 leading-tight">
                                    <span>Jurisprudência</span>
                                    <span className="text-sky-450 font-bold">{activeIncidencia.porcentagens.jurisprudencia}%</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-0.5 mt-0.5 rounded-full overflow-hidden">
                                    <div className="bg-sky-400 h-full" style={{ width: `${activeIncidencia.porcentagens.jurisprudencia}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quick action buttons for the inspected day */}
                          <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/5">
                            <button
                              onClick={() => toggleTrilhaDayComplete(activeInspectedDayNum)}
                              className={cn(
                                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border",
                                isInspectedCompleted
                                  ? "bg-slate-950/20 border-red-500/25 text-red-450 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                                  : "bg-slate-950/65 border-white/5 text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-450"
                              )}
                            >
                              <div className={cn(
                                "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all",
                                isInspectedCompleted ? "bg-emerald-500 border-emerald-500" : "border-slate-600"
                              )}>
                                {isInspectedCompleted && <Zap size={8} className="text-slate-950" />}
                              </div>
                              {isInspectedCompleted ? "Desmarcar Dia" : "Concluir Dia"}
                            </button>

                            <button
                              onClick={() => {
                                handleStartTrilhaStudy(activeInspectedDayNum, 'estudo');
                              }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-brand-gold text-slate-950 hover:bg-white hover:shadow-lg hover:shadow-brand-gold/10 active:scale-95 cursor-pointer"
                              title="Iniciar estudo teórico guiado dividido em blocos"
                            >
                              <Sparkles size={11} />
                              Estudar
                            </button>

                            <button
                              disabled={!isCEO && !hasCompletedDay50}
                              onClick={() => {
                                handleStartTrilhaStudy(activeInspectedDayNum, 'discursivo');
                              }}
                              className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border outline-none",
                                (isCEO || hasCompletedDay50)
                                  ? "bg-slate-950 border-brand-gold/25 text-brand-gold hover:bg-brand-gold/10 hover:border-brand-gold/50 active:scale-95 cursor-pointer"
                                  : "bg-slate-950/20 border-transparent text-slate-600 opacity-40 cursor-not-allowed"
                              )}
                              title={(isCEO || hasCompletedDay50) ? "Treino de 2ª Fase (Discursiva/Escrita) para os temas deste dia" : "Disponível após concluir o Dia 50"}
                            >
                              {(!isCEO && !hasCompletedDay50) ? <Lock size={11} /> : <FileText size={11} />}
                              Treino 2ª Fase
                            </button>

                            <button
                              disabled={!isCEO && !hasCompletedDay75}
                              onClick={() => {
                                handleStartTrilhaStudy(activeInspectedDayNum, 'oral');
                              }}
                              className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border outline-none",
                                (isCEO || hasCompletedDay75)
                                  ? "bg-slate-950 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 active:scale-95 cursor-pointer"
                                  : "bg-slate-950/20 border-transparent text-slate-600 opacity-40 cursor-not-allowed"
                              )}
                              title={(isCEO || hasCompletedDay75) ? "Simulado de Prova Oral com arguições faladas de banca" : "Disponível após concluir o Dia 75"}
                            >
                              {(!isCEO && !hasCompletedDay75) ? <Lock size={11} /> : <Volume2 size={11} />}
                              Treino Oral
                            </button>
                          </div>
                        </div>

                        {/* Right Side: Interactive 10x10 microgrid (Col-span 5) */}
                        <div className="lg:col-span-5 bg-slate-950/30 rounded-3xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">
                                Mapa da Jornada
                              </span>
                              <button 
                                onClick={() => {
                                  setDashboardDay(null);
                                }}
                                className="text-[9px] font-black uppercase tracking-tight text-brand-gold bg-brand-gold/5 border border-brand-gold/10 hover:bg-brand-gold hover:text-slate-950 px-2 py-0.5 rounded transition-all"
                                title="Voltar para a meta recomendada de hoje"
                              >
                                Hoje
                              </button>
                            </div>
                            
                            {/* The 10x10 Grid */}
                            <div className="grid grid-cols-10 gap-1.5 pt-1">
                              {Array.from({ length: 100 }).map((_, idx) => {
                                const dNo = idx + 1;
                                const isDone = trilhaCompletedDays.includes(dNo);
                                const isInspected = activeInspectedDayNum === dNo;
                                const isRealToday = nextUncompletedTrilhaDayNum === dNo;

                                return (
                                  <button
                                    key={dNo}
                                    onClick={() => setDashboardDay(dNo)}
                                    title={`Dia ${dNo}${isDone ? ' (Concluído)' : ''}${isRealToday ? ' (Meta Recomendada)' : ''}`}
                                    className={cn(
                                      "aspect-square w-full rounded-[4px] border transition-all relative flex items-center justify-center text-[8px] font-mono",
                                      isInspected
                                        ? "bg-brand-gold text-slate-950 border-brand-gold shadow-md shadow-brand-gold/20 font-bold scale-110 z-10"
                                        : isDone
                                        ? "bg-brand-gold/20 border-brand-gold/25 text-brand-gold hover:bg-brand-gold/30"
                                        : isRealToday
                                        ? "bg-slate-950 border-brand-gold text-brand-gold animate-pulse hover:bg-brand-gold/10"
                                        : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/20 hover:bg-slate-800"
                                    )}
                                  >
                                    {dNo}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                              <span>Concluído</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-brand-gold" />
                              <span>Recomendado</span>
                            </div>
                            <button
                              onClick={() => {
                                setActiveTab('trilha');
                              }}
                              className="text-brand-gold hover:underline text-[9px] font-bold uppercase tracking-wider"
                            >
                              Ver Tudo →
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })()}

                <div className="flex justify-center max-w-xl mx-auto w-full mt-8">
                  <div 
                    onClick={() => startNewSession()}
                    className="w-full p-8 bg-slate-900 border border-brand-gold/10 hover:border-brand-gold/40 rounded-3xl flex flex-col justify-center items-center text-center gap-4 border-dashed group transition-all cursor-pointer shadow-lg hover:shadow-brand-gold/5"
                  >
                    <div className="p-3 bg-brand-gold/5 group-hover:bg-brand-gold/10 rounded-2xl text-brand-gold transition-colors">
                      <MessageSquare size={28} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-slate-100 group-hover:text-brand-gold transition-colors">Mentoria Avulsa ou Dúvida Específica</h3>
                      <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">Quer focar em outro assunto? Clique aqui para abrir uma nova conversa com ATHENA ou envie uma dúvida no campo abaixo.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tokenExhaustedBanner && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-3xl w-full mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-rose-300 shadow-xl"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <AlertTriangle className="text-rose-400 shrink-0 mt-0.5 sm:mt-0" size={18} />
                  <div>
                    <p className="font-bold text-rose-200">Limite de Requisições / Tokens da API Atingido</p>
                    <p className="text-[11px] text-rose-300/80 leading-relaxed mt-0.5">
                      A cota do Google AI Studio foi temporariamente esgotada. Aguarde um instante para renovação ou insira sua chave pessoal do Gemini em Configurações para continuar sem limites.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => setIsAiSettingsOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    Inserir Minha Chave
                  </button>
                  <button
                    onClick={() => setTokenExhaustedBanner(false)}
                    className="text-rose-400 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}

                    <AnimatePresence mode="popLayout">
                      {(() => {
                        const activeSess = sessions.find(s => s.id === currentSessionId);
                        const tDay = activeSess?.trilhaDay;
                        const tMatIdx = activeSess?.trilhaMaterialIndex;
                        const tTotal = tDay ? (TRILHA_JURIDICA_DATA.find(d => d.dia === tDay)?.materias?.length || 0) : 0;
                        
                        const visibleMessages = (messages || []).filter(m => !getIsInstructionMessage(m));
                        
                        if (visibleMessages.length === 0 && guidedSubject) {
                          if (!isLoading) {
                            return (
                              <motion.div
                                key="ready-activity"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                className="p-8 mx-auto max-w-2xl bg-slate-900/80 border border-brand-gold/30 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-md text-left w-full space-y-6"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-brand-gold/10 rounded-2xl border border-brand-gold/25 text-brand-gold">
                                    <Scale size={24} />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded-full border border-brand-gold/15">
                                      {tDay ? `Trilha Jurídica • Dia ${tDay}` : "Nova Atividade"}
                                    </span>
                                    <h3 className="text-xl font-serif font-bold text-slate-100 mt-1">
                                      {guidedSubject}
                                    </h3>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                  {tDay ? (
                                    <>Sessão de estudos pronta para o <strong>Dia {tDay} ({guidedSubject})</strong>. Clique abaixo para gerar sua mentoria analítica em 6 blocos com o Princípio de Pareto (80/20).</>
                                  ) : (
                                    <>Sessão pronta para <strong>{guidedSubject}</strong>. Clique no botão abaixo para iniciar a mentoria guiada.</>
                                  )}
                                </p>

                                <button
                                  onClick={() => {
                                    const sess = sessions.find(s => s.id === currentSessionId);
                                    const firstMsg = sess?.messages?.[0]?.content || `ATHENA, inicie o estudo de ${guidedSubject}`;
                                    handleSendMessageRequest(firstMsg, true, currentSessionId, undefined, undefined, sess?.trilhaDay);
                                  }}
                                  className="w-full py-4 bg-brand-gold hover:bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-brand-gold/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Sparkles size={16} />
                                  Iniciar Estudo Agora
                                </button>
                              </motion.div>
                            );
                          }

                          return (
                            <motion.div
                              key="loading-activity"
                              initial={{ opacity: 0, scale: 0.98, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98, y: -10 }}
                              className="p-8 mx-auto max-w-2xl bg-slate-900/60 border border-brand-gold/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-md text-left w-full"
                            >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                              <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-brand-gold/10 rounded-2xl border border-brand-gold/25 text-brand-gold animate-bounce">
                                    <Scale size={24} />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded-full border border-brand-gold/15">
                                      {tDay ? `Trilha Jurídica • Dia ${tDay}` : "Nova Atividade"}
                                    </span>
                                    <h3 className="text-xl font-serif font-bold text-slate-100 mt-1">
                                      {guidedSubject}
                                    </h3>
                                  </div>
                                </div>

                                <div className="space-y-3.5 border-t border-white/5 pt-5">
                                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                                    {tDay ? (
                                      <>
                                        Iniciando a sessão de estudos para a <strong>Parte {(tMatIdx !== undefined) ? tMatIdx + 1 : 1} de {tTotal}</strong> do seu cronograma. ATHENA está processando a fonte, jurisprudências e regulamentos doutrinários para moldar um material otimizado.
                                      </>
                                    ) : (
                                      <>
                                        Preparando uma mentoria profunda e customizada baseada na metodologia ativa sobre <strong>{guidedSubject}</strong>.
                                      </>
                                    )}
                                  </p>

                                  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-ping" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Análise em Andamento</span>
                                      </div>
                                      <span className="text-[10px] font-mono text-brand-gold/80 animate-pulse">Conectando ao Gemini...</span>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                        <span>Processando Camadas Cognitivas (ATHENA 80/20)</span>
                                        <span>Aguarde...</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                        <motion.div 
                                          animate={{ x: ["-100%", "100%"] }}
                                          transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                                          className="h-full w-1/3 bg-gradient-to-r from-transparent via-brand-gold to-transparent"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        }
                        
                        return (messages || []).map((msg, msgIdx) => (
                          <ChatMessage
                            key={msgIdx}
                            msg={msg}
                            msgIdx={msgIdx}
                            messages={messages}
                            setMessages={setMessages}
                            saveSession={saveSession}
                            updateStats={updateStats}
                            activeStudyItem={activeStudyItem}
                            setActiveStudyItem={setActiveStudyItem}
                            setActiveTab={setActiveTab}
                            handleSendMessageRequest={handleSendMessageRequest}
                            advanceStage={advanceStage}
                            reviews={reviews}
                            saveReview={saveReview}
                            currentArticle={currentArticle}
                            guidedSubject={guidedSubject}
                            markScheduleItemComplete={markScheduleItemComplete}
                            saveToSchedules={saveToSchedules}
                            trilhaDay={tDay}
                            trilhaMaterialIndex={tMatIdx}
                            trilhaTotalMaterials={tTotal}
                            skipTrilhaLesson={skipTrilhaLesson}
                            retryMessage={retryMessage}
                          />
                        ));
                      })()}
                    </AnimatePresence>
            
            {isLoading && (
              <div className="flex flex-col items-start gap-4">
                <div className="bg-slate-900 border border-white/5 rounded-3xl rounded-tl-none p-6 min-w-[200px]">
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 bg-brand-gold rounded-full"
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">ATHENA está processando as camadas...</p>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>

        {/* Input Bar */}
        {user && activeTab === 'chat' && (
          <div className="p-4 lg:p-6 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 relative z-30 pb-6">
            
            {/* Scroll to Top FAB */}
            <AnimatePresence>
              {showScrollTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={scrollToTop}
                  className="absolute -top-16 right-4 sm:right-8 p-3 bg-brand-gold text-slate-950 rounded-full shadow-[0_10px_30px_rgba(212,175,55,0.4)] hover:scale-110 active:scale-95 transition-all z-30 mb-0"
                  title="Voltar ao Topo"
                >
                  <ChevronRight size={20} className="-rotate-90" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Attachment Preview */}
            <AnimatePresence>
              {attachedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="max-w-4xl mx-auto mb-4"
                >
                  <div className="inline-flex items-center gap-3 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl px-4 py-2 ring-1 ring-white/5">
                    <FileText size={16} className="text-brand-gold" />
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{attachedFile.name}</span>
                    <button 
                      onClick={() => setAttachedFile(null)}
                      type="button"
                      className="p-1 hover:bg-brand-gold/20 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>



            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-4xl mx-auto relative group flex items-stretch gap-2 lg:gap-4"
            >
              <div className="relative flex-1">
                <motion.div
                  animate={showSendFeedback ? {
                    boxShadow: ["0 0 0px rgba(212,175,55,0)", "0 0 20px rgba(212,175,55,0.4)", "0 0 0px rgba(212,175,55,0)"],
                    scale: [1, 0.98, 1]
                  } : {}}
                  transition={{ duration: 0.6 }}
                  className="relative w-full rounded-2xl lg:rounded-3xl"
                >
                  <input
                    id="message-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={guidedSubject === 'Estudo pelo Edital' ? "Anexe o edital ou mande um tema..." : "Tema, artigo ou súmula..."}
                    className="w-full bg-slate-900/50 text-slate-100 pl-5 pr-14 py-4 lg:pl-6 lg:pr-16 lg:py-5 rounded-2xl lg:rounded-3xl border border-white/10 focus:border-brand-gold/50 outline-none transition-all shadow-inner placeholder:text-slate-600 font-medium text-sm lg:text-base"
                  />
                </motion.div>

                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl transition-all",
                    attachedFile ? "text-brand-gold" : "text-slate-500"
                  )}
                  title="Anexar Edital (PDF)"
                >
                  <Paperclip size={20} />
                </button>
              </div>

              <button
                id="send-button"
                disabled={isLoading || (!input.trim() && !attachedFile)}
                className="p-3.5 lg:p-4 bg-brand-gold hover:bg-white text-slate-950 rounded-2xl lg:rounded-3xl transition-all shadow-[0_4px_20px_rgba(212,175,55,0.4)] active:scale-90 disabled:opacity-50 disabled:shadow-none group shrink-0"
              >
                <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </form>
          </div>
        )}

        {/* Vertical Stage Scroller/Elevator ("Barra de Rodagem Lateral de Etapas") */}
        {activeTab === 'chat' && lastModelMsgWithBlocks && activeBlockCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed right-2.5 bottom-24 md:right-4 md:top-1/2 md:-translate-y-1/2 md:bottom-auto z-30 flex flex-col items-center gap-2 p-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-brand-gold/30 shadow-[0_15px_40px_rgba(0,0,0,0.6)] max-w-[48px]"
          >
            <div className="text-[8px] font-black text-brand-gold select-none pb-1 border-b border-white/5 uppercase tracking-tighter text-center leading-none">
              Bloco
            </div>
            <div className="flex flex-col gap-2 relative my-1">
              {/* Vertical connecting line */}
              <div className="absolute left-1/2 top-2.5 bottom-2.5 w-[1px] bg-slate-800 -translate-x-1/2 z-0" />
              
              {Array.from({ length: currentBlockIndex + 1 }).map((_, idx) => {
                const isCurrent = idx === currentBlockIndex;
                const stageLabels = ['Introdução', 'Lei Seca', 'Jurisprudência', 'Doutrina', 'Desafio', 'Revisão'];
                const shortLabel = stageLabels[idx] || `${idx + 1}`;
                const targetId = `block-${lastModelMsgIdx}-${idx}`;
                
                const handleScrollToBlock = () => {
                  const element = document.getElementById(targetId);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                };

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={handleScrollToBlock}
                    className="relative z-10 group/dot flex flex-col items-center outline-none active:scale-90 transition-transform"
                    title={stageLabels[idx]}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 shadow",
                      isCurrent 
                        ? "bg-brand-gold text-slate-950 scale-110 ring-2 ring-brand-gold/30 font-extrabold" 
                        : "bg-slate-950 text-slate-400 border border-white/10 hover:border-brand-gold/50 hover:text-brand-gold"
                    )}>
                      {idx + 1}
                    </div>
                    
                    {/* Tooltip on hover/touch */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-950/95 backdrop-blur border border-brand-gold/20 rounded-lg text-[9px] text-slate-200 opacity-0 pointer-events-none group-hover/dot:opacity-100 transition-opacity whitespace-nowrap shadow-xl font-bold uppercase tracking-wider">
                      {shortLabel}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="text-[7px] font-black text-slate-500 uppercase tracking-tighter text-center pt-1 border-t border-white/5 select-none font-mono">
              {currentBlockIndex + 1}/{activeBlockCount}
            </div>
          </motion.div>
        )}
      </main>

    {/* Level Up Modal */}
    <AnimatePresence>
      {showLevelUp !== null && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="bg-slate-900 border-2 border-brand-gold p-10 rounded-[3rem] max-w-sm w-full text-center relative overflow-hidden shadow-[0_20px_80px_rgba(212,175,55,0.4)]"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-brand-gold/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-brand-gold/10 blur-3xl rounded-full" />
            
            <motion.div 
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="relative z-10 w-20 h-20 bg-brand-gold rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl"
            >
              <Trophy size={40} className="text-slate-950" />
            </motion.div>

            <h2 className="text-2xl font-serif font-black text-slate-100 mb-2">Subiu de Nível!</h2>
            <p className="text-brand-gold font-black uppercase tracking-[0.3em] text-[10px] mb-6">ATHENA Nível {showLevelUp}</p>
            
            <p className="text-slate-400 text-xs mb-8 leading-relaxed">
              Sua maestria jurídica está evoluindo. Você acaba de desbloquear novas capacidades analíticas na nossa mentoria.
            </p>

            <button 
              onClick={() => setShowLevelUp(null)}
              className="w-full bg-brand-gold text-slate-950 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95"
            >
              Continuar Jornada
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Trilha detailed study notes modal */}
    <AnimatePresence>
      {inspectedTrilhaFonte !== null && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 30 }}
            className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full h-[85vh] flex flex-col relative overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/40 shrink-0">
              <div className="space-y-1 text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded-full border border-brand-gold/15">
                  Dia {inspectedTrilhaFonte.dia} • Trilha Jurídica
                </span>
                <h3 className="text-xl font-serif font-bold text-slate-100">{inspectedTrilhaFonte.title}</h3>
              </div>
              <button 
                onClick={() => setInspectedTrilhaFonte(null)}
                className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 text-slate-350 pr-4 select-text text-left">
              <div className="prose prose-invert prose-amber max-w-none text-xs md:text-sm font-sans leading-relaxed whitespace-pre-line">
                {inspectedTrilhaFonte.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-slate-950/20 shrink-0">
              <button 
                onClick={() => {
                  setInspectedTrilhaFonte(null);
                  handleStartTrilhaStudy(inspectedTrilhaFonte.dia, 'estudo');
                }}
                className="bg-brand-gold text-slate-950 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer font-bold"
              >
                <Scale size={14} />
                Iniciar Estudo Deste Dia
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Modal de Configuração de IA e Chave Gemini */}
    <AnimatePresence>
      {isAiSettingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-slate-900 border border-brand-gold/30 p-6 md:p-8 rounded-[2.5rem] max-w-md w-full relative shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-left"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-gold/10 rounded-2xl border border-brand-gold/20 text-brand-gold">
                  <Cpu size={22} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-100">Cérebro IA ATHENA</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-gold">Google Gemini 2026</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiSettingsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modelo Ativo</span>
                  <span className="text-[9px] font-mono uppercase bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded border border-brand-gold/20">
                    {isNativeMobile() ? 'Nativo Móvel' : 'Web Resiliente'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  gemini-flash-latest (Alta Velocidade)
                </span>
              </div>

              {/* Diagnóstico de Conexão ao Vivo */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Activity size={14} className="text-brand-gold" />
                    <span className="text-xs font-bold">Diagnóstico de Conexão IA</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestGeminiConnection}
                    disabled={testAiLoading}
                    className="px-2.5 py-1 bg-brand-gold/15 hover:bg-brand-gold/30 text-brand-gold border border-brand-gold/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw size={11} className={testAiLoading ? "animate-spin" : ""} />
                    <span>{testAiLoading ? "Testando..." : "Testar Conexão"}</span>
                  </button>
                </div>

                {testAiResult && (
                  <div className={`p-2.5 rounded-xl border text-xs font-mono ${
                    testAiResult.success 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                      <span>{testAiResult.success ? "✓ Conectado ao Google Gemini" : "✕ Falha na Comunicação"}</span>
                      {testAiResult.latencyMs > 0 && (
                        <span className="text-[10px] text-slate-400 font-normal">{testAiResult.latencyMs}ms</span>
                      )}
                    </div>
                    <div className="text-[10px] space-y-0.5 text-slate-300">
                      <p><span className="text-slate-400">Modelo:</span> {testAiResult.model}</p>
                      <p><span className="text-slate-400">Chave:</span> {testAiResult.apiKeyPreview}</p>
                      <p><span className="text-slate-400">Retorno:</span> {testAiResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
                  Chave da API Gemini (Google AI Studio)
                </label>
                <input
                  type="password"
                  value={customApiKeyInput}
                  onChange={(e) => setCustomApiKeyInput(e.target.value)}
                  placeholder="Chave API..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-gold font-mono tracking-wider"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  O aplicativo já inclui uma chave de alta performance embutida pelo Mestre Jhonny. Caso queira usar sua chave pessoal do Google AI Studio, basta colá-la acima.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomApiKey(customApiKeyInput);
                    setKeySaveSuccess(true);
                    setTimeout(() => setKeySaveSuccess(false), 3000);
                  }}
                  className="w-full py-3 bg-brand-gold text-slate-950 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  {keySaveSuccess ? <Check size={14} /> : <Key size={14} />}
                  <span>{keySaveSuccess ? "Chave Salva com Sucesso!" : "Salvar Chave"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomApiKey("");
                    setCustomApiKeyInput(getGeminiApiKey());
                    setKeySaveSuccess(true);
                    setTimeout(() => setKeySaveSuccess(false), 2000);
                  }}
                  className="w-full py-2 bg-slate-950 text-slate-400 hover:text-slate-200 rounded-xl text-[11px] font-bold border border-white/5 transition-colors cursor-pointer"
                >
                  Restaurar Chave Padrão
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Modal de Assinatura / Paywall (Trial Mode) */}
    <AnimatePresence>
      {showPaywallModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-slate-900 border border-brand-gold/30 p-6 md:p-8 rounded-[2.5rem] max-w-md w-full relative shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-left"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-gold/10 rounded-2xl border border-brand-gold/20 text-brand-gold">
                  <Trophy size={22} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-100">ATHENA Premium</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-gold">Plano Completo de Carreira</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaywallModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                  Período de Demonstração (Trial)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Os primeiros <strong>7 dias</strong> da Trilha de 100 Dias e o módulo de <strong>Provas Objetivas (1ª Fase)</strong> são gratuitos para degustação.
                </p>
                <div className="pt-2 border-t border-white/5 text-[11px] text-emerald-400 font-mono">
                  ✓ Durante esta fase de homologação geral, o acesso irrestrito aos dias seguintes está liberado para testes.
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <p className="flex items-center gap-2 text-slate-300">
                  <Check size={14} className="text-brand-gold shrink-0" />
                  100 Dias de Cronograma Estruturado Completo
                </p>
                <p className="flex items-center gap-2 text-slate-300">
                  <Check size={14} className="text-brand-gold shrink-0" />
                  Simulador de Peças e Discursivas (2ª Fase)
                </p>
                <p className="flex items-center gap-2 text-slate-300">
                  <Check size={14} className="text-brand-gold shrink-0" />
                  Banca Examinadora em Prova Oral com IA (3ª Fase)
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaywallModal(false)}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold text-slate-950 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  <span>Continuar Estudando (Trial)</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  </div>
);
}
