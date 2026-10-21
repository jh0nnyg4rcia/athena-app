export interface Question {
  id?: string;
  subject?: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChallengeData {
  questions: Question[];
}

export interface EditalData {
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

export interface Schedule {
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

export interface Review {
  id: string;
  sessionId: string;
  subject: string;
  article: number;
  content: string;
  timestamp: number;
  day?: number;
  part?: number;
}

export interface ReviewCounterEntry {
  reviewId: string;
  count: number;
  lastUpdatedAt: number;
  lastMutationId?: string;
}

export interface UserStat {
  subjectName: string;
  correctAnswers: number;
  totalQuestions: number;
  progress: number;
  xp: number;
  uniqueQuestions?: number;
  totalAttempts?: number;
  evolution?: {
    firstAttemptAccuracy?: number;
    resolvedErrors?: number;
  };
}

export interface GamificationData {
  totalXP: number;
  level: number;
  streak: number;
  lastActive: number;
  completedThemes: string[];
}

export interface Mentee {
  id: string;
  displayName: string;
  photoURL?: string;
  email: string;
  stats: UserStat[];
  gamification?: GamificationData;
}

export interface FailedQuestionAttempt {
  timestamp: number;
  selectedOption: number;
  correct: boolean;
}

export interface FailedQuestion extends Question {
  id: string;
  userId: string;
  timestamp: number;
  originalArticle?: number;
  trilhaDay?: number;
  trilhaMaterialIndex?: number;
  resolved?: boolean;
  resolvedAt?: number;
  attempts?: FailedQuestionAttempt[];
  studyBaseline?: { version: number; sha256: string };
}

export interface Message {
  studyBaseline?: {version:number;sha256:string};
  role: 'user' | 'model';
  content: string;
  challenge?: ChallengeData;
  editalData?: EditalData;
  blocks?: string[];
  currentBlockIndex?: number;
  article?: number;
  subject?: string | null;
  answers?: Record<number, number>;
  evaluations?: Record<number, {
    userAnswer: string;
    scores?: Record<string, number>;
    finalScore?: number;
    feedback?: string;
  }>;
  sourceType?: 'gemini' | 'offline_pareto';
  modelName?: string;
  /** Markdown approved manually; preserve its exact wording during publication. */
  ceoEdited?: boolean;
  trilhaDay?: number;
  trilhaMaterialIndex?: number;
}

export interface ChatSession {
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

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'ceo' | 'default';
  profile: 'automatic' | 'custom';
  allowedPhases: ('objetiva' | 'subjetiva' | 'oral')[];
  isTrialMode: boolean;
}

export interface TrilhaPartCache {
  text: string;
  model: string;
  timestamp: number;
}

export interface HomologatedLesson {
  id: string; // ex: "day_1_part_0"
  day: number;
  part: number;
  subject: string;
  topic?: string;
  content: string;
  blocks?: string[];
  challenge?: ChallengeData | null;
  status: 'approved' | 'draft';
  approvedBy: string;
  approvedAt: number;
  modelUsed?: string;
  version?: number;
  review?: string;
  /** Só no aparelho: o texto novo já está no cofre, mas o catálogo oficial ainda não. */
  pendingCloud?: boolean;
}

export interface RegisteredStudent {
  uid: string;
  fullName: string;
  email: string;
  createdAt: number;
}

export type HighlightColor = 'yellow' | 'red' | 'green' | 'pink' | 'blue';

export interface PersonalHighlight {
  id: string;
  uid: string;
  lessonId: string;
  blockIndex: number;
  selectedText: string;
  prefix: string;
  suffix: string;
  color: HighlightColor;
  lessonVersion?: number;
  lessonSha256?: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'pending_match';
}

