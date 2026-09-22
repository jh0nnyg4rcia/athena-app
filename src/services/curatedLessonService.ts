import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanData, isQuotaExhausted } from '../lib/firebase';
import { HomologatedLesson } from '../types';
import homologatedSeedsData from '../data/homologatedSeeds.json';

const staticSeeds: Record<string, HomologatedLesson> = (homologatedSeedsData || {}) as Record<string, HomologatedLesson>;

const LOCAL_STORAGE_PREFIX = 'athena_homologated_';

export function getLessonDocId(day: number, part: number): string {
  return `day_${day}_part_${part}`;
}

/**
 * Busca rápida síncrona no armazenamento local persistente ou no banco de sementes embutido.
 * Garante disponibilidade imediata (0ms) mesmo após reinstalação ou sem internet.
 */
export function getLocalHomologatedLesson(day: number, part: number): HomologatedLesson | null {
  const docId = getLessonDocId(day, part);
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${docId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as HomologatedLesson;
      if (parsed && parsed.status === 'approved' && parsed.content) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[CuratedLessonService] Erro ao ler lição do cache local:', e);
  }

  // Fallback 1: Sementes estáticas embutidas no código/APK (0s, ultra persistente)
  if (staticSeeds && staticSeeds[docId] && staticSeeds[docId].status === 'approved' && staticSeeds[docId].content) {
    return staticSeeds[docId];
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
 * Possui timeout de proteção de 6 segundos para NUNCA travar a interface do usuário.
 */
export async function saveHomologatedLesson(lesson: HomologatedLesson): Promise<void> {
  // 1. Salva no cache local imediatamente (0ms)
  setLocalHomologatedLesson(lesson);

  // 2. Dispara evento para atualização instantânea na UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('athena-lesson-homologated', { detail: lesson }));
  }

  if (isQuotaExhausted()) {
    console.warn('[CuratedLessonService] Firestore com cota excedida. Lição salva localmente com sucesso!');
    return;
  }

  const docId = lesson.id;
  try {
    const docRef = doc(db, 'homologated_lessons', docId);
    const cleaned = cleanData(lesson);

    // Timeout estrito de 6 segundos via Promise.race
    const writePromise = setDoc(docRef, cleaned, { merge: true });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore write timeout: rede demorou mais de 6 segundos')), 6000)
    );

    await Promise.race([writePromise, timeoutPromise]);
    console.log(`[CuratedLessonService] Lição ${docId} homologada e gravada com sucesso no Firestore!`);
  } catch (error: any) {
    console.warn(`[CuratedLessonService] Aviso na sincronização do Firestore para ${docId} (conteúdo seguro no cache local):`, error?.message || error);
    // Não lança exceção fatal para não bloquear a UI do CEO se o cache local já salvou com sucesso!
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

let lastCloudFetchAt = 0;
let lastCloudFetch: HomologatedLesson[] | null = null;

/**
 * Baixa todas as lições homologadas da nuvem e replica no cache local.
 */
export async function fetchAllHomologatedLessons(): Promise<HomologatedLesson[]> {
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
    return lastCloudFetch;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'homologated_lessons');
    return local;
  }
}
