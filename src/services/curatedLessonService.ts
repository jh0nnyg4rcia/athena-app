import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanData, isQuotaExhausted, isQuotaExceededError, setQuotaExhausted } from '../lib/firebase';
import { HomologatedLesson } from '../types';
import homologatedSeedsData from '../data/homologatedSeeds.json';
import {
  embedChallengeInContent,
  extractChallengeFromText,
  normalizeObjectiveChallenge
} from '../lib/objectiveChallenge';
import { catalogSaveFailureMessage, lessonHasBody, pickFresherLesson, shouldAdoptCloudLesson } from '../lib/officialCacheRestore';
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
const FIRESTORE_SAFE_BYTES = 900_000;
const CATALOG_WRITE_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tempo esgotado ao gravar a aula no catálogo.')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function payloadBytes(value: unknown): number {
  const encoded = JSON.stringify(value);
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(encoded).length;
  return encoded.length;
}

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
  return Boolean(lesson && lesson.status === 'approved' && lessonHasBody(lesson));
}

const RESTORE_CONCURRENCY = 4;
let restoreFlight: Promise<number> | null = null;

/**
 * Repõe no cofre local as aulas oficiais que faltam.
 * Cada documento é lido por id (a listagem da coleção pode ser negada).
 * Não apaga aula local, não grava no Firestore e não chama o proxy Gemini.
 */
export function restoreOfficialLessonsFromCloud(
  slots: Array<{ day: number; part: number }>
): Promise<number> {
  if (restoreFlight) return restoreFlight;
  restoreFlight = restoreOfficialLessonsNow(slots).finally(() => {
    restoreFlight = null;
  });
  return restoreFlight;
}

async function restoreOfficialLessonsNow(
  slots: Array<{ day: number; part: number }>
): Promise<number> {
  await hydrateLessonVault();
  const pending = slots.filter((slot) => {
    const id = getLessonDocId(slot.day, slot.part);
    return !lessonHasBody(getRememberedLesson(id));
  });

  let restored = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < pending.length) {
      const slot = pending[cursor];
      cursor += 1;
      const docId = getLessonDocId(slot.day, slot.part);
      try {
        const snap = await getDoc(doc(db, 'homologated_lessons', docId));
        if (!snap.exists()) continue;
        const cloud = ensureObjectiveChallenge(normalizeLesson(docId, snap.data() as HomologatedLesson));
        if (!shouldAdoptCloudLesson(getRememberedLesson(docId), cloud)) continue;
        setLocalHomologatedLesson(cloud);
        officialPartIds.add(docId);
        restored += 1;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `homologated_lessons/${docId}`);
      }
    }
  };

  const workers = Math.min(RESTORE_CONCURRENCY, pending.length);
  if (workers > 0) {
    await Promise.all(Array.from({ length: workers }, () => worker()));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('athena-lessons-restored', {
        detail: { count: restored, total: listRememberedLessons().length }
      })
    );
  }
  return restored;
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
export function setLocalHomologatedLesson(lesson: HomologatedLesson): Promise<void> {
  rememberLesson(lesson);
  const key = `${LOCAL_STORAGE_PREFIX}${lesson.id}`;
  return putVaultLesson(lesson).then(() => {
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
  const docId = getLessonDocId(day, part);
  const local = getRememberedLesson(docId) || getLocalHomologatedLesson(day, part);

  let cloud: HomologatedLesson | null = null;
  try {
    const snap = await getDoc(doc(db, 'homologated_lessons', docId));
    if (snap.exists()) {
      const data = ensureObjectiveChallenge(normalizeLesson(docId, snap.data() as HomologatedLesson));
      if (lessonHasBody(data)) cloud = data;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `homologated_lessons/${docId}`);
  }

  const chosen = pickFresherLesson(local, cloud);
  if (!chosen) return null;

  const memory = getRememberedLesson(docId);
  const memoryIsNewer = Boolean(memory && lessonHasBody(memory) && lessonStamp(memory) > lessonStamp(chosen));
  if (memoryIsNewer) return memory || chosen;

  if (chosen === cloud) {
    const published = { ...chosen, pendingCloud: false };
    await setLocalHomologatedLesson(published);
    return published;
  }

  if (cloud && lessonStamp(local) > lessonStamp(cloud)) {
    return { ...chosen, pendingCloud: true };
  }
  return chosen;
}

function lessonStamp(lesson?: HomologatedLesson | null): number {
  return lesson?.approvedAt || 0;
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
  if (lesson.review) payload.review = lesson.review.slice(0, 20000);
  if (lesson.challenge) payload.challenge = lesson.challenge;

  let encoded = JSON.stringify(cleanData(payload));
  while ((encoded.length > FIRESTORE_SAFE_CHARS || payloadBytes(cleanData(payload)) > FIRESTORE_SAFE_BYTES) && payload.content.length > 20000) {
    payload.content = payload.content.slice(0, Math.floor(payload.content.length * 0.85));
    encoded = JSON.stringify(cleanData(payload));
  }
  if ((encoded.length > FIRESTORE_SAFE_CHARS || payloadBytes(cleanData(payload)) > FIRESTORE_SAFE_BYTES) && payload.challenge) {
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
  let lessonWritten = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (!lessonWritten) {
        await withTimeout(setDoc(doc(db, 'homologated_lessons', docId), cleaned, { merge: true }), CATALOG_WRITE_TIMEOUT_MS);
        lessonWritten = true;
      }
      try {
        await withTimeout(setDoc(doc(db, 'homologated_parts', docId), partStub, { merge: true }), CATALOG_WRITE_TIMEOUT_MS);
      } catch (partError) {
        if (isQuotaExceededError(partError)) setQuotaExhausted(true);
        else handleFirestoreError(partError, OperationType.WRITE, `homologated_parts/${docId}`);
      }
      officialPartIds.add(docId);
      return;
    } catch (error) {
      lastError = error;
      if (isQuotaExceededError(error)) {
        setQuotaExhausted(true);
        break;
      }
      if (lessonWritten) {
        officialPartIds.add(docId);
        return;
      }
      await new Promise((r) => setTimeout(r, 800));
    }
  }
  handleFirestoreError(lastError, OperationType.WRITE, `homologated_lessons/${docId}`);
  const message = lastError instanceof Error ? lastError.message : String(lastError || 'falha ao gravar');
  throw new Error(message);
}

/**
 * Grava o tema novo no cofre do aparelho e tenta publicar no catálogo.
 * Se a nuvem recusar, o texto novo permanece no aparelho e o botão de publicar continua disponível.
 */
export async function saveHomologatedLesson(lesson: HomologatedLesson): Promise<LessonSaveResult> {
  lesson = ensureObjectiveChallenge(lesson);

  try {
    await writeFirestoreWithRetry(lesson);
    const published = { ...lesson, pendingCloud: false };
    await setLocalHomologatedLesson(published);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('athena-lesson-homologated', { detail: published }));
    }
    return { cloud: true };
  } catch (error) {
    if (isQuotaExceededError(error)) setQuotaExhausted(true);
    const kept = { ...lesson, pendingCloud: true };
    await setLocalHomologatedLesson(kept);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('athena-lesson-homologated', { detail: kept }));
    }
    const quota = isQuotaExceededError(error) || isQuotaExhausted();
    return {
      cloud: false,
      error: catalogSaveFailureMessage(quota ? new Error('resource-exhausted') : error)
    };
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
