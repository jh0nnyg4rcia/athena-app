import { HomologatedLesson, Review, TrilhaPartCache } from '../types';

const DB_NAME = 'athena_lesson_vault';
const DB_VERSION = 2;
const LESSONS_STORE = 'lessons';
const TRILHA_STORE = 'trilha_parts';
const REVIEWS_STORE = 'compressed_reviews';

export type VaultTrilhaPart = TrilhaPartCache & {
  id: string;
  day: number;
  part: number;
  style: string;
};

const memoryLessons = new Map<string, HomologatedLesson>();
const memoryTrilha = new Map<string, VaultTrilhaPart>();

let dbPromise: Promise<IDBDatabase> | null = null;

function openVault(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LESSONS_STORE)) {
        db.createObjectStore(LESSONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(TRILHA_STORE)) {
        db.createObjectStore(TRILHA_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(REVIEWS_STORE)) {
        db.createObjectStore(REVIEWS_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

function idbPut<T>(storeName: string, value: T): Promise<void> {
  return openVault().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(value);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
    () => undefined
  );
}

function idbDelete(storeName: string, key: string): Promise<void> {
  return openVault().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
    () => undefined
  );
}

function idbGetAll<T>(storeName: string): Promise<T[]> {
  return openVault().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve((req.result || []) as T[]);
        req.onerror = () => reject(req.error);
      }),
    () => [] as T[]
  );
}

export function rememberLesson(lesson: HomologatedLesson): void {
  if (lesson?.id) memoryLessons.set(lesson.id, lesson);
}

export function forgetLesson(id: string): void {
  memoryLessons.delete(id);
}

export function getRememberedLesson(id: string): HomologatedLesson | undefined {
  return memoryLessons.get(id);
}

export function listRememberedLessons(): HomologatedLesson[] {
  return Array.from(memoryLessons.values());
}

export async function putVaultLesson(lesson: HomologatedLesson): Promise<void> {
  rememberLesson(lesson);
  try {
    await idbPut(LESSONS_STORE, lesson);
  } catch (err) {
    console.warn('[LessonVault] Falha ao gravar lição no IndexedDB:', err);
  }
}

export async function deleteVaultLesson(id: string): Promise<void> {
  forgetLesson(id);
  try {
    await idbDelete(LESSONS_STORE, id);
  } catch (err) {
    console.warn('[LessonVault] Falha ao remover lição do IndexedDB:', err);
  }
}

export function trilhaVaultId(day: number, part: number, style: string): string {
  return `d${day}_p${part}_${style}`;
}

export function rememberTrilhaPart(entry: VaultTrilhaPart): void {
  if (entry?.id) memoryTrilha.set(entry.id, entry);
}

export function getRememberedTrilhaPart(id: string): VaultTrilhaPart | undefined {
  return memoryTrilha.get(id);
}

export function listRememberedTrilhaParts(): VaultTrilhaPart[] {
  return Array.from(memoryTrilha.values());
}

export async function putVaultTrilhaPart(entry: VaultTrilhaPart): Promise<void> {
  rememberTrilhaPart(entry);
  try {
    await idbPut(TRILHA_STORE, entry);
  } catch (err) {
    console.warn('[LessonVault] Falha ao gravar parte da trilha no IndexedDB:', err);
  }
}

export async function putVaultReviews(reviews: Review[]): Promise<void> {
  try {
    await Promise.all(reviews.filter((r) => r?.id && r.content).map((r) => idbPut(REVIEWS_STORE, r)));
  } catch (err) {
    console.warn('[LessonVault] Falha ao gravar revisões comprimidas no IndexedDB:', err);
  }
}

export async function deleteVaultReview(reviewId: string): Promise<void> {
  if (!reviewId) return;
  try {
    await idbDelete(REVIEWS_STORE, reviewId);
  } catch (err) {
    console.warn('[LessonVault] Falha ao remover revisão comprimida do IndexedDB:', err);
  }
}

export async function listVaultReviews(): Promise<Review[]> {
  try {
    return await idbGetAll<Review>(REVIEWS_STORE);
  } catch {
    return [];
  }
}

function migrateLocalStorageIntoVault(): void {
  if (typeof window === 'undefined') return;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        if (key.startsWith('athena_homologated_')) {
          const lesson = JSON.parse(raw) as HomologatedLesson;
          if (lesson?.id) {
            memoryLessons.set(lesson.id, lesson);
            void idbPut(LESSONS_STORE, lesson);
          }
        } else if (key.startsWith('athena_compressed_reviews_')) {
          const parsed = JSON.parse(raw) as Review[];
          if (Array.isArray(parsed)) {
            parsed.forEach((review) => {
              if (review?.id && review.content) void idbPut(REVIEWS_STORE, review);
            });
          }
        } else if (key.startsWith('athena_trilha_cache_')) {
          const match = key.match(/athena_trilha_cache_d(\d+)_p(\d+)_(.+)$/);
          const parsed = JSON.parse(raw) as TrilhaPartCache;
          if (match && parsed?.text) {
            const entry: VaultTrilhaPart = {
              id: `d${match[1]}_p${match[2]}_${match[3]}`,
              day: Number(match[1]),
              part: Number(match[2]),
              style: match[3],
              text: parsed.text,
              model: parsed.model,
              timestamp: parsed.timestamp || Date.now()
            };
            memoryTrilha.set(entry.id, entry);
            void idbPut(TRILHA_STORE, entry);
          }
        }
      } catch {
        /* ignore broken keys */
      }
    }
  } catch {
    /* ignore */
  }
}

export async function loadVaultIntoMemory(): Promise<{ lessons: number; trilhaParts: number }> {
  try {
    const [lessons, parts] = await Promise.all([
      idbGetAll<HomologatedLesson>(LESSONS_STORE),
      idbGetAll<VaultTrilhaPart>(TRILHA_STORE)
    ]);
    for (const lesson of lessons) {
      if (lesson?.id) memoryLessons.set(lesson.id, lesson);
    }
    for (const part of parts) {
      if (part?.id) memoryTrilha.set(part.id, part);
    }
    migrateLocalStorageIntoVault();
    return { lessons: lessons.length, trilhaParts: parts.length };
  } catch (err) {
    console.warn('[LessonVault] Falha ao hidratar IndexedDB:', err);
    return { lessons: 0, trilhaParts: 0 };
  }
}

let hydrateOnce: Promise<{ lessons: number; trilhaParts: number }> | null = null;

export function hydrateLessonVault(): Promise<{ lessons: number; trilhaParts: number }> {
  if (!hydrateOnce) {
    hydrateOnce = loadVaultIntoMemory().then((stats) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('athena-vault-ready', { detail: stats }));
      }
      return stats;
    });
  }
  return hydrateOnce;
}

export function persistLocalStorageSafe(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    evictOldestAthenaCache(6, key);
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.warn('[LessonVault] localStorage cheio; conteúdo permanece no IndexedDB:', err);
      return false;
    }
  }
}

function evictOldestAthenaCache(count: number, keepKey?: string): void {
  try {
    const prefixes = ['athena_homologated_', 'athena_trilha_cache_'];
    const ranked: Array<{ key: string; ts: number }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key === keepKey || !prefixes.some((p) => key.startsWith(p))) continue;
      let ts = 0;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
        ts = Number(parsed.approvedAt || parsed.timestamp || 0);
      } catch {
        ts = 0;
      }
      ranked.push({ key, ts });
    }
    ranked.sort((a, b) => a.ts - b.ts);
    ranked.slice(0, count).forEach((item) => localStorage.removeItem(item.key));
  } catch {
    /* ignore */
  }
}
