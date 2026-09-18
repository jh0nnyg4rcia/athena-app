import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanData, isQuotaExhausted } from '../lib/firebase';
import { HomologatedLesson } from '../types';

const LOCAL_STORAGE_PREFIX = 'athena_homologated_';

export function getLessonDocId(day: number, part: number): string {
  return `day_${day}_part_${part}`;
}

/**
 * Busca rápida síncrona no armazenamento local persistente.
 */
export function getLocalHomologatedLesson(day: number, part: number): HomologatedLesson | null {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${getLessonDocId(day, part)}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomologatedLesson;
    if (parsed && parsed.status === 'approved' && parsed.content) {
      return parsed;
    }
  } catch (e) {
    console.warn('[CuratedLessonService] Erro ao ler lição do cache local:', e);
  }
  return null;
}

/**
 * Salva lição homologada no armazenamento local para acesso instantâneo (0s).
 */
export function setLocalHomologatedLesson(lesson: HomologatedLesson): void {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${lesson.id}`;
    localStorage.setItem(key, JSON.stringify(lesson));
  } catch (e) {
    console.warn('[CuratedLessonService] Falha ao gravar lição no cache local:', e);
  }
}

/**
 * Remove lição do armazenamento local.
 */
export function removeLocalHomologatedLesson(day: number, part: number): void {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${getLessonDocId(day, part)}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('[CuratedLessonService] Falha ao remover lição do cache local:', e);
  }
}

/**
 * Busca lição homologada: primeiro no cache local (0s) e, em seguida ou caso ausente,
 * consulta a coleção centralizada no Cloud Firestore.
 */
export async function getHomologatedLesson(day: number, part: number): Promise<HomologatedLesson | null> {
  const local = getLocalHomologatedLesson(day, part);
  if (local) {
    // Retorna imediatamente o local para performance instantânea
    return local;
  }

  // Se cota estourada ou offline, não tenta a rede
  if (isQuotaExhausted()) {
    return null;
  }

  const docId = getLessonDocId(day, part);
  try {
    const docRef = doc(db, 'homologated_lessons', docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as HomologatedLesson;
      if (data && data.status === 'approved') {
        setLocalHomologatedLesson(data);
        return data;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `homologated_lessons/${docId}`);
  }

  return null;
}

/**
 * Homologa e publica uma lição na nuvem (Firestore) e no cache local.
 * Exclusivo para curadoria do CEO.
 */
export async function saveHomologatedLesson(lesson: HomologatedLesson): Promise<void> {
  // Salva no cache local imediatamente
  setLocalHomologatedLesson(lesson);

  // Dispara evento para atualização instantânea na UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('athena-lesson-homologated', { detail: lesson }));
  }

  if (isQuotaExhausted()) {
    console.warn('[CuratedLessonService] Firestore indisponível no momento. Lição salva localmente.');
    return;
  }

  const docId = lesson.id;
  try {
    const docRef = doc(db, 'homologated_lessons', docId);
    const cleaned = cleanData(lesson);
    await setDoc(docRef, cleaned, { merge: true });
    console.log(`[CuratedLessonService] Lição ${docId} homologada e gravada com sucesso no Firestore!`);
  } catch (error) {
    console.error(`[CuratedLessonService] Falha ao persistir ${docId} no Firestore:`, error);
    handleFirestoreError(error, OperationType.WRITE, `homologated_lessons/${docId}`);
    throw error;
  }
}

/**
 * Revoga / despublica uma lição homologada.
 */
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

/**
 * Lista todas as lições homologadas conhecidas no cache local.
 */
export function getLocalHomologatedList(): Record<string, HomologatedLesson> {
  const result: Record<string, HomologatedLesson> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as HomologatedLesson;
          if (parsed && parsed.id) {
            result[parsed.id] = parsed;
          }
        }
      }
    }
  } catch (e) {
    console.warn('[CuratedLessonService] Erro ao listar lições locais:', e);
  }
  return result;
}
