import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanData, isQuotaExhausted, isQuotaExceededError, setQuotaExhausted } from '../lib/firebase';
import { HomologatedLesson } from '../types';
import homologatedSeedsData from '../data/homologatedSeeds.json';
import {
  embedChallengeInContent,
  extractChallengeFromText,
  normalizeObjectiveChallenge
} from '../lib/objectiveChallenge';
import { catalogSaveFailureMessage, lessonHasBody, shouldAdoptCloudLesson } from '../lib/officialCacheRestore';
import {
  assembleHomologatedLesson,
  cloudMayReplaceLocal,
  mayAdoptRemoteLesson,
  maySyncDisplayedLesson,
  reportLessonLoad,
  storedLessonUsable
} from '../lib/lessonLoad';
import {
  confirmVaultLesson,
  deleteVaultLesson,
  getRememberedLesson,
  hydrateLessonVault,
  listRememberedLessons,
  persistCatalogLesson,
  putVaultLesson,
  readVaultLesson,
  rememberLegacyLessonIfSafe,
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
      rememberLegacyLessonIfSafe(lesson);
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

function readLegacyHomologatedLesson(docId: string): HomologatedLesson | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${docId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as HomologatedLesson;
      if (parsed?.id || parsed?.content) return { ...parsed, id: parsed.id || docId };
    }
  } catch {
    /* chave legada ilegível não autoriza apagar o IndexedDB */
  }
  if (staticSeeds && staticSeeds[docId]) return staticSeeds[docId];
  return null;
}

async function localLessonStillWins(docId: string, cloud: HomologatedLesson): Promise<boolean> {
  const presence = await confirmVaultLesson(docId);
  const legacy = readLegacyHomologatedLesson(docId);
  const remembered = getRememberedLesson(docId);
  if (!mayAdoptRemoteLesson(presence, storedLessonUsable(legacy) || lessonHasBody(remembered))) return true;
  if (!shouldAdoptCloudLesson(remembered || legacy, cloud)) return true;
  return false;
}

async function restoreOfficialLessonsNow(
  slots: Array<{ day: number; part: number }>
): Promise<number> {
  const pending: Array<{ day: number; part: number }> = [];
  for (const slot of slots) {
    const id = getLessonDocId(slot.day, slot.part);
    const presence = await confirmVaultLesson(id);
    const legacy = readLegacyHomologatedLesson(id);
    const remembered = getRememberedLesson(id);
    if (mayAdoptRemoteLesson(presence, storedLessonUsable(legacy) || lessonHasBody(remembered))) {
      pending.push(slot);
    }
  }

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
        if (await localLessonStillWins(docId, cloud)) continue;
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
        rememberLegacyLessonIfSafe(parsed);
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

async function readCloudHomologatedLesson(docId: string): Promise<HomologatedLesson | null> {
  try {
    const snap = await getDoc(doc(db, 'homologated_lessons', docId));
    if (!snap.exists()) return null;
    const data = ensureObjectiveChallenge(normalizeLesson(docId, snap.data() as HomologatedLesson));
    return lessonHasBody(data) ? data : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `homologated_lessons/${docId}`);
    return null;
  }
}

function refreshHomologatedLesson(docId: string, shown: HomologatedLesson): void {
  void readCloudHomologatedLesson(docId).then(async (cloud) => {
    const current = getRememberedLesson(docId) || shown;
    if (!cloudMayReplaceLocal(current, cloud) || !cloud) return;
    const again = getRememberedLesson(docId) || current;
    if (!cloudMayReplaceLocal(again, cloud)) return;
    await setLocalHomologatedLesson({ ...cloud, pendingCloud: false });
  }).catch(() => undefined);
}

export async function getHomologatedLesson(day: number, part: number): Promise<HomologatedLesson | null> {
  const docId = getLessonDocId(day, part);
  const loaded = await assembleHomologatedLesson({
    readVault: () => readVaultLesson(docId),
    readLegacy: () => readLegacyHomologatedLesson(docId),
    readCloud: () => readCloudHomologatedLesson(docId),
    writeLocal: (lesson) => setLocalHomologatedLesson({ ...lesson, pendingCloud: false })
  });
  if (loaded.source) reportLessonLoad(loaded.source, docId, loaded.ms);
  if (maySyncDisplayedLesson(loaded) && loaded.lesson) {
    refreshHomologatedLesson(docId, loaded.lesson);
  }
  return loaded.lesson;
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
    const byId = new Map<string, HomologatedLesson>();
    for (const lesson of local) {
      if (lesson?.id) byId.set(lesson.id, lesson);
    }
    for (const docSnap of snap.docs) {
      const data = normalizeLesson(docSnap.id, docSnap.data() as HomologatedLesson);
      if (!data.content && !data.blocks?.length && !data.review) continue;
      if (data.status && data.status !== 'approved') continue;
      const persisted = await persistCatalogLesson(data, readLegacyHomologatedLesson);
      if (!persisted) continue;
      byId.set(data.id, data);
      cloud.push(data);
    }
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
