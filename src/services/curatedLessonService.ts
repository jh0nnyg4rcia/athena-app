import { doc, getDoc, getDocFromServer, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { persistCeoCatalogLesson } from './persistCeoCatalogLesson';
import { mayRefreshPublishedQuestions, refreshPublishedQuestions } from '../lib/questionCacheRefresh';
import { exactPublishedLesson } from '../lib/ceoLessonEditing';
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
  rememberLesson,
  sanitizePersistentVaultCache
} from './lessonVault';
import { studyContentSession, studyEditorialAccess } from './studyProgressClient';

const staticSeeds: Record<string, HomologatedLesson> = (homologatedSeedsData || {}) as Record<string, HomologatedLesson>;

const LOCAL_STORAGE_PREFIX = 'athena_homologated_';

export function sanitizeLegacyProtectedCaches(): void {
  // Exclusões automáticas de aulas desativadas na candidata até haver preservação formal comprovada.
  // O conteúdo local legado permanece intocado nos depósitos, mas bloqueado contra leitura indevida por studyEditorialAccess().
  void sanitizePersistentVaultCache();
}

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
  if (!studyEditorialAccess()) return [];
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
  if (!studyEditorialAccess()) return Promise.resolve(0);
  if (restoreFlight) return restoreFlight;
  restoreFlight = restoreOfficialLessonsNow(slots).finally(() => {
    restoreFlight = null;
  });
  return restoreFlight;
}

function readLegacyHomologatedLesson(docId: string): HomologatedLesson | null {
  const match = /^day_(\d+)_part_(\d+)$/.exec(docId);
  const day = match ? Number(match[1]) : 0;
  if (day >= 2 && !studyEditorialAccess()) return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${docId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as HomologatedLesson;
      if (parsed?.id || parsed?.content) return { ...parsed, id: parsed.id || docId };
    }
  } catch {
    /* chave legada ilegível não autoriza apagar o IndexedDB */
  }
  if (staticSeeds && staticSeeds[docId] && (day === 1 || studyEditorialAccess())) return staticSeeds[docId];
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
  if (day >= 2 && !studyEditorialAccess()) return null;
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

  if (staticSeeds && isUsableLesson(staticSeeds[docId]) && (day === 1 || studyEditorialAccess())) {
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
  if (!studyEditorialAccess()) return null;
  try {
    const snap = await withTimeout(getDocFromServer(doc(db, 'homologated_lessons', docId)), 4000);
    if (!snap.exists()) return null;
    const data = ensureObjectiveChallenge(normalizeLesson(docId, snap.data() as HomologatedLesson));
    return lessonHasBody(data) ? data : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `homologated_lessons/${docId}`);
    return null;
  }
}

async function refreshHomologatedLesson(docId: string, shown: HomologatedLesson): Promise<HomologatedLesson> {
  return refreshPublishedQuestions({
    shown,
    readServer: () => readCloudHomologatedLesson(docId),
    current: () => getRememberedLesson(docId) || shown,
    canReplace: (local, cloud) => cloudMayReplaceLocal(local, cloud) || mayRefreshPublishedQuestions(local, cloud),
    writeLocal: async cloud => {
      if (await confirmVaultLesson(docId) === 'not_loaded') throw new Error('Cofre não confirmado');
      const current = getRememberedLesson(docId) || shown;
      if (current.pendingCloud || !(cloudMayReplaceLocal(current, cloud) || mayRefreshPublishedQuestions(current, cloud))) throw new Error('Cache mudou durante leitura');
      await setLocalHomologatedLesson({ ...cloud, pendingCloud: false });
    }
  });
}

export async function getHomologatedLesson(day: number, part: number): Promise<HomologatedLesson | null> {
  const docId = getLessonDocId(day, part);

  if (day >= 2 && !studyEditorialAccess()) {
    try {
      const authorized = await studyContentSession.read(docId);
      return authorized ? ensureObjectiveChallenge(normalizeLesson(docId, authorized)) : null;
    } catch {
      return null;
    }
  }

  if (!studyEditorialAccess()) {
    try {
      const authorized = await studyContentSession.read(docId);
      if (authorized) return ensureObjectiveChallenge(normalizeLesson(docId, authorized));
    } catch {
      // Offline fallback only for day 1 initial sample
    }
  }

  const loaded = await assembleHomologatedLesson({
    readVault: () => readVaultLesson(docId),
    readLegacy: () => readLegacyHomologatedLesson(docId),
    readCloud: () => readCloudHomologatedLesson(docId),
    writeLocal: (lesson) => setLocalHomologatedLesson({ ...lesson, pendingCloud: false })
  });
  if (loaded.source) reportLessonLoad(loaded.source, docId, loaded.ms);
  if (maySyncDisplayedLesson(loaded) && loaded.lesson) {
    return refreshHomologatedLesson(docId, loaded.lesson);
  }
  if (loaded.source === 'legacy' && loaded.lesson && await confirmVaultLesson(docId) === 'not_found') {
    return refreshHomologatedLesson(docId, loaded.lesson);
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
  const embedded = extractChallengeFromText(lesson.content || '').challenge;
  if (embedded && JSON.stringify(embedded) === JSON.stringify(quiz)) {
    return { ...lesson, challenge: lesson.challenge || embedded };
  }
  return {
    ...lesson,
    challenge: quiz,
    content: embedChallengeInContent(lesson.content, quiz)
  };
}

export type LessonSaveResult = { cloud: boolean; error?: string; lesson?: HomologatedLesson };

async function writeOfficialCatalog(lesson: HomologatedLesson): Promise<void> {
  const published = await persistCeoCatalogLesson(db, lesson, cleanData);
  Object.assign(lesson, published);
  officialPartIds.add(lesson.id);
}
/**
 * Grava o tema novo no cofre do aparelho e tenta publicar no catálogo.
 * Se a nuvem recusar, o texto novo permanece no aparelho e o botão de publicar continua disponível.
 */
export async function saveHomologatedLesson(lesson: HomologatedLesson): Promise<LessonSaveResult> {
  lesson = /\[ATHENA_CHALLENGE\]/i.test(lesson.content) ? exactPublishedLesson(lesson) : ensureObjectiveChallenge(lesson);

  try {
    await writeOfficialCatalog(lesson);
    const published = { ...lesson, pendingCloud: false };
    await setLocalHomologatedLesson(published);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('athena-lesson-homologated', { detail: published }));
    }
    return { cloud: true, lesson: published };
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
  if (!studyEditorialAccess()) return local;
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
