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
}

export interface UserStat {
  subjectName: string;
  correctAnswers: number;
  totalQuestions: number;
  progress: number;
  xp: number;
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

export interface FailedQuestion extends Question {
  id: string;
  userId: string;
  timestamp: number;
  originalArticle?: number;
}

export interface Message {
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
