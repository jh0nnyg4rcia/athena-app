import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanData, isQuotaExhausted } from '../lib/firebase';
import { HomologatedLesson } from '../types';
import homologatedSeedsData from '../data/homologatedSeeds.json';
import {
  deleteVaultLesson,
  getRememberedLesson,
  hydrateLessonVault,
  listRememberedLessons,
  persistLocalStorageSafe,
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
 * Salva lição homologada na memória, IndexedDB e localStorage.
 */
export function setLocalHomologatedLesson(lesson: HomologatedLesson): void {
  rememberLesson(lesson);
  const key = `${LOCAL_STORAGE_PREFIX}${lesson.id}`;
  persistLocalStorageSafe(key, JSON.stringify(lesson));
  void putVaultLesson(lesson);
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
  const local = getLocalHomologatedLesson(day, part);
  if (local) return local;

  if (isQuotaExhausted()) return null;

  const docId = getLessonDocId(day, part);
  try {
    const docRef = doc(db, 'homologated_lessons', docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = { id: docId, ...(snap.data() as HomologatedLesson) };
      if (data && (data.content || data.blocks?.length)) {
        setLocalHomologatedLesson({ ...data, status: data.status || 'approved' });
        return getLocalHomologatedLesson(day, part);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `homologated_lessons/${docId}`);
  }

  return null;
}

function compactForFirestore(lesson: HomologatedLesson): HomologatedLesson {
  const payload: HomologatedLesson = { ...lesson };
  let encoded = JSON.stringify(cleanData(payload));
  if (encoded.length <= FIRESTORE_SAFE_CHARS) return payload;

  if (payload.blocks?.length) {
    payload.content = payload.blocks.join('\n\n');
    encoded = JSON.stringify(cleanData(payload));
  }
  if (encoded.length > FIRESTORE_SAFE_CHARS && payload.challenge) {
    const { challenge: _drop, ...rest } = payload;
    return rest as HomologatedLesson;
  }
  return payload;
}

async function writeFirestoreWithRetry(lesson: HomologatedLesson): Promise<void> {
  if (isQuotaExhausted()) {
    console.warn('[CuratedLessonService] Firestore com cota excedida. Lição preservada no cofre local.');
    return;
  }

  const docId = lesson.id;
  const docRef = doc(db, 'homologated_lessons', docId);
  const cleaned = cleanData(compactForFirestore(lesson));
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await setDoc(docRef, cleaned, { merge: true });
      console.log(`[CuratedLessonService] Lição ${docId} gravada no Firestore (tentativa ${attempt + 1}).`);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  handleFirestoreError(lastError, OperationType.WRITE, `homologated_lessons/${docId}`);
}

/**
 * Homologa na memória + IndexedDB de imediato e sincroniza o Firestore em segundo plano.
 */
export async function saveHomologatedLesson(lesson: HomologatedLesson): Promise<void> {
  setLocalHomologatedLesson(lesson);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('athena-lesson-homologated', { detail: lesson }));
  }

  void writeFirestoreWithRetry(lesson);
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
  if (isQuotaExhausted() || typeof window === 'undefined') {
    return local;
  }
  if (lastCloudFetch && Date.now() - lastCloudFetchAt < 30000) {
    return lastCloudFetch;
  }

  try {
    const snap = await getDocs(collection(db, 'homologated_lessons'));
    const cloud: HomologatedLesson[] = [];
    snap.forEach((docSnap) => {
      const data = { id: docSnap.id, ...(docSnap.data() as HomologatedLesson) };
      if (!data.content && !data.blocks?.length) return;
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
      window.dispatchEvent(new CustomEvent('athena-lessons-restored', { detail: { count: lastCloudFetch.length } }));
    }
    return lastCloudFetch;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'homologated_lessons');
    return local;
  }
}
