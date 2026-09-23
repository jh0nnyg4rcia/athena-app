import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanData, isQuotaExhausted } from '../lib/firebase';
import { HomologatedLesson } from '../types';
import homologatedSeedsData from '../data/homologatedSeeds.json';
import {
  embedChallengeInContent,
  extractChallengeFromText,
  normalizeObjectiveChallenge
} from '../lib/objectiveChallenge';
import {
  deleteVaultLesson,
  getRememberedLesson,
  hydrateLessonVault,
  listRememberedLessons,
  putVaultLesson,
  rememberLesson
} from './lessonVault';

const staticSeeds: Record<string, HomologatedLesson> = (homologatedSeedsData || {}) as Record<string, HomologatedLesson>;

const LOCAL_STORAGE_PREFIX = 'athena_homologated_';
const FIRESTORE_SAFE_CHARS = 900_000;

void hydrateLessonVault().then(() => {
  try {
    for (const lesson of Object.values(readLocalStorageLessons())) {
      rememberLesson(lesson);
    }
  } catch {
    /* ignore */
  }
});

export function getLessonDocId(day: number, part: number): string {
  return `day_${day}_part_${part}`;
}

const officialPartIds = new Set<string>();

export function isOfficialPart(day: number, part: number): boolean {
  const id = getLessonDocId(day, part);
  return officialPartIds.has(id) || Boolean(getRememberedLesson(id));
}

export type OfficialPart = {
  id: string;
  day: number;
  part: number;
  subject: string;
  review: string;
  approvedAt?: number;
};

/** Índice leve: o que está publicado para todos, sem baixar o texto integral das aulas. */
export async function syncOfficialCatalog(): Promise<OfficialPart[]> {
  await hydrateLessonVault();
  try {
    const snap = await getDocs(collection(db, 'homologated_parts'));
    const parts: OfficialPart[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as OfficialPart;
      const id = data.id || docSnap.id;
      officialPartIds.add(id);
      parts.push({
        id,
        day: Number(data.day),
        part: Number(data.part),
        subject: data.subject || 'Trilha Jurídica',
        review: data.review || '',
        approvedAt: data.approvedAt
      });
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('athena-catalog-synced', { detail: { count: parts.length } }));
    }
    return parts;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'homologated_parts');
    return [];
  }
}

function isUsableLesson(lesson?: HomologatedLesson | null): lesson is HomologatedLesson {
  return Boolean(lesson && lesson.status === 'approved' && (lesson.content || lesson.blocks?.length));
}

function readLocalStorageLessons(): Record<string, HomologatedLesson> {
  const result: Record<string, HomologatedLesson> = {};
  if (typeof window === 'undefined') return result;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(LOCAL_STORAGE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as HomologatedLesson;
        if (parsed?.id) result[parsed.id] = parsed;
      } catch {
        /* ignore broken */
      }
    }
  } catch (e) {
    console.warn('[CuratedLessonService] Erro ao listar lições locais:', e);
  }
  return result;
}

/**
 * Busca rápida síncrona: memória (IndexedDB hidratado), localStorage ou sementes.
 */
export function getLocalHomologatedLesson(day: number, part: number): HomologatedLesson | null {
  const docId = getLessonDocId(day, part);
  const mem = getRememberedLesson(docId);
  if (isUsableLesson(mem)) return mem;

  try {
    const key = `${LOCAL_STORAGE_PREFIX}${docId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as HomologatedLesson;
      if (isUsableLesson(parsed)) {
        rememberLesson(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[CuratedLessonService] Erro ao ler lição do cache local:', e);
  }

  if (staticSeeds && isUsableLesson(staticSeeds[docId])) {
    return staticSeeds[docId];
  }

  return null;
}

/**
 * Salva a lição no cofre IndexedDB. O corpo não fica no localStorage:
 * 100 dias estouram a cota (~5 MB) e a atualização só deixa as sementes dos 3 primeiros dias.
 */
export function setLocalHomologatedLesson(lesson: HomologatedLesson): void {
  rememberLesson(lesson);
  const key = `${LOCAL_STORAGE_PREFIX}${lesson.id}`;
  void putVaultLesson(lesson).then(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  });
}

/**
 * Remove lição do armazenamento local.
 */
export function removeLocalHomologatedLesson(day: number, part: number): void {
  const docId = getLessonDocId(day, part);
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${docId}`);
  } catch (e) {
    console.warn('[CuratedLessonService] Falha ao remover lição do cache local:', e);
  }
  void deleteVaultLesson(docId);
}

export async function getHomologatedLesson(day: number, part: number): Promise<HomologatedLesson | null> {
  await hydrateLessonVault();
  const local = getLocalHomologatedLesson(day, part);
  const docId = getLessonDocId(day, part);

  try {
    const snap = await getDoc(doc(db, 'homologated_lessons', docId));
    if (snap.exists()) {
      const data = ensureObjectiveChallenge(normalizeLesson(docId, snap.data() as HomologatedLesson));
      if (data.content || data.blocks?.length) {
        setLocalHomologatedLesson(data);
        return data;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `homologated_lessons/${docId}`);
  }

  return local;
}

function normalizeLesson(docId: string, raw: HomologatedLesson): HomologatedLesson {
  return {
    ...raw,
    id: raw.id || docId,
    status: raw.status || 'approved'
  };
}

function challengeOf(lesson?: HomologatedLesson | null) {
  if (!lesson) return undefined;
  return normalizeObjectiveChallenge(lesson.challenge) || extractChallengeFromText(lesson.content || '').challenge;
}

/**
 * A publicação nova não pode apagar as questões objetivas já homologadas.
 * Se o texto recém-salvo veio sem o JSON do desafio, reaproveita o desafio anterior ou a semente.
 */
export function ensureObjectiveChallenge(lesson: HomologatedLesson): HomologatedLesson {
  const own = challengeOf(lesson);
  const seed = challengeOf(staticSeeds[lesson.id]);
  const quiz = own || seed;
  if (!quiz) return lesson;
  return {
    ...lesson,
    challenge: quiz,
    content: embedChallengeInContent(lesson.content, quiz)
  };
}

function compactForFirestore(lesson: HomologatedLesson): HomologatedLesson {
  const payload: HomologatedLesson = {
    id: lesson.id,
    day: Math.round(lesson.day),
    part: Math.round(lesson.part),
    subject: (lesson.subject || 'Trilha Jurídica').slice(0, 200),
    topic: lesson.topic,
    content: lesson.content,
    status: 'approved',
    approvedBy: 'jhonny.spider@gmail.com',
    approvedAt: lesson.approvedAt || Date.now(),
    modelUsed: lesson.modelUsed,
    version: lesson.version || 1,
    review: lesson.review
  };
  if (lesson.challenge) payload.challenge = lesson.challenge;

  let encoded = JSON.stringify(cleanData(payload));
  if (encoded.length > FIRESTORE_SAFE_CHARS) {
    payload.content = payload.content.slice(0, 850000);
    encoded = JSON.stringify(cleanData(payload));
  }
  if (encoded.length > FIRESTORE_SAFE_CHARS && payload.challenge) {
    delete payload.challenge;
  }
  return payload;
}

export type LessonSaveResult = { cloud: boolean; error?: string };

async function writeFirestoreWithRetry(lesson: HomologatedLesson): Promise<void> {
  const docId = lesson.id;
  const cleaned = cleanData(compactForFirestore(lesson));
  const partStub = cleanData({
    id: docId,
    day: Math.round(lesson.day),
    part: Math.round(lesson.part),
    subject: (lesson.subject || 'Trilha Jurídica').slice(0, 200),
    status: 'approved',
    approvedBy: 'jhonny.spider@gmail.com',
    approvedAt: lesson.approvedAt || Date.now(),
    review: (lesson.review || '').slice(0, 20000)
  });
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await setDoc(doc(db, 'homologated_lessons', docId), cleaned, { merge: true });
      await setDoc(doc(db, 'homologated_parts', docId), partStub, { merge: true });
      officialPartIds.add(docId);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  handleFirestoreError(lastError, OperationType.WRITE, `homologated_lessons/${docId}`);
  const message = lastError instanceof Error ? lastError.message : String(lastError || 'falha ao gravar');
  throw new Error(message);
}

/**
 * Grava no cofre local e espera o Firestore. O catálogo oficial é a nuvem:
 * sem essa gravação, a atualização do app volta só para as sementes dos dias 1 a 3.
 */
export async function saveHomologatedLesson(lesson: HomologatedLesson): Promise<LessonSaveResult> {
  lesson = ensureObjectiveChallenge(lesson);
  setLocalHomologatedLesson(lesson);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('athena-lesson-homologated', { detail: lesson }));
  }

  try {
    await writeFirestoreWithRetry(lesson);
    return { cloud: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { cloud: false, error: message };
  }
}

export async function revokeHomologatedLesson(day: number, part: number): Promise<void> {
  const docId = getLessonDocId(day, part);
  removeLocalHomologatedLesson(day, part);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('athena-lesson-revoked', { detail: { day, part, docId } }));
  }

  if (isQuotaExhausted()) return;

  try {
    const docRef = doc(db, 'homologated_lessons', docId);
    await deleteDoc(docRef);
    console.log(`[CuratedLessonService] Lição ${docId} revogada no Firestore.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `homologated_lessons/${docId}`);
  }
}

export function getLocalHomologatedList(): Record<string, HomologatedLesson> {
  const result: Record<string, HomologatedLesson> = { ...readLocalStorageLessons() };
  for (const lesson of listRememberedLessons()) {
    if (lesson?.id) result[lesson.id] = lesson;
  }
  return result;
}

let lastCloudFetchAt = 0;
let lastCloudFetch: HomologatedLesson[] | null = null;

export async function fetchAllHomologatedLessons(): Promise<HomologatedLesson[]> {
  await hydrateLessonVault();
  const local = Object.values(getLocalHomologatedList());
  if (typeof window === 'undefined') return local;
  if (lastCloudFetch && Date.now() - lastCloudFetchAt < 30000) {
    return lastCloudFetch;
  }

  try {
    const snap = await getDocs(collection(db, 'homologated_lessons'));
    const cloud: HomologatedLesson[] = [];
    snap.forEach((docSnap) => {
      const data = normalizeLesson(docSnap.id, docSnap.data() as HomologatedLesson);
      if (!data.content && !data.blocks?.length && !data.review) return;
      if (data.status && data.status !== 'approved') return;
      setLocalHomologatedLesson(data);
      cloud.push(data);
    });
    const byId = new Map<string, HomologatedLesson>();
    [...local, ...cloud].forEach((lesson) => {
      if (lesson?.id) byId.set(lesson.id, lesson);
    });
    lastCloudFetch = Array.from(byId.values());
    lastCloudFetchAt = Date.now();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('athena-lessons-restored', { detail: { count: cloud.length, total: lastCloudFetch.length } }));
    }
    return lastCloudFetch;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'homologated_lessons');
    return local;
  }
}
