import { Question } from '../App';

const DB_NAME = 'athena_offline_cache';
const DB_VERSION = 1;

export interface CachedQuestion extends Question {
  timestamp: number;
  userAnswerIndex?: number;
  evaluation?: any;
}

export interface CachedArticle {
  id: string; // subject + '_' + article
  subject: string;
  article: number;
  content: string;
  timestamp: number;
  summary?: string;
}

/**
 * Initializes the IndexedDB database.
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('Este navegador não suporta o IndexedDB para cache offline.');
      reject(new Error('IndexedDB não suportado'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store for Cached Questions
      if (!db.objectStoreNames.contains('questions')) {
        db.createObjectStore('questions', { keyPath: 'id' });
      }

      // Store for Cached Articles
      if (!db.objectStoreNames.contains('articles')) {
        db.createObjectStore('articles', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('Falha ao abrir o IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Caches a question studied in the challenge phase.
 */
export async function cacheQuestion(
  question: Question,
  userAnswerIndex?: number,
  evaluation?: any
): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('questions', 'readwrite');
      const store = transaction.objectStore('questions');

      // Generate a unique ID based on text or use predefined ID
      const baseId = question.id || '';
      const textHash = simpleHash(question.text);
      const questionId = baseId || `${question.subject || 'geral'}_q_${textHash}`;

      const data: CachedQuestion = {
        ...question,
        id: questionId,
        timestamp: Date.now(),
        userAnswerIndex,
        evaluation
      };

      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Erro ao salvar questão no IndexedDB:', err);
  }
}

/**
 * Caches an article/content segment consultado.
 */
export async function cacheArticle(
  subject: string,
  articleNumber: number,
  content: string,
  summary?: string
): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('articles', 'readwrite');
      const store = transaction.objectStore('articles');

      const id = `${subject.toLowerCase().replace(/\s+/g, '_')}_art_${articleNumber}`;

      const data: CachedArticle = {
        id,
        subject,
        article: articleNumber,
        content,
        timestamp: Date.now(),
        summary
      };

      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Erro ao salvar artigo no IndexedDB:', err);
  }
}

/**
 * Retrieves all cached questions, optionally filtered by subject.
 */
export async function getCachedQuestions(subject?: string): Promise<CachedQuestion[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('questions', 'readonly');
      const store = transaction.objectStore('questions');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result as CachedQuestion[];
        if (subject) {
          const subLower = subject.toLowerCase();
          results = results.filter(q => q.subject && q.subject.toLowerCase().includes(subLower));
        }
        // Order by timestamp descending
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Erro ao ler questões do IndexedDB:', err);
    return [];
  }
}

/**
 * Retrieves all cached articles, optionally filtered by subject.
 */
export async function getCachedArticles(subject?: string): Promise<CachedArticle[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('articles', 'readonly');
      const store = transaction.objectStore('articles');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result as CachedArticle[];
        if (subject) {
          const subLower = subject.toLowerCase();
          results = results.filter(a => a.subject.toLowerCase().includes(subLower));
        }
        // Order by timestamp descending
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Erro ao ler artigos do IndexedDB:', err);
    return [];
  }
}

/**
 * Details of distinct subjects found in cached datasets.
 */
export async function getCachedSubjects(): Promise<string[]> {
  const [questions, articles] = await Promise.all([
    getCachedQuestions(),
    getCachedArticles()
  ]);

  const subjects = new Set<string>();
  questions.forEach(q => q.subject && subjects.add(q.subject));
  articles.forEach(a => subjects.add(a.subject));

  return Array.from(subjects);
}

/**
 * Obtains summary metrics for the offline cache.
 */
export async function getOfflineStats(): Promise<{ questionsCount: number; articlesCount: number }> {
  try {
    const db = await initDB();
    const countStore = (storeName: 'questions' | 'articles'): Promise<number> => {
      return new Promise((resolve) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    };

    const [questionsCount, articlesCount] = await Promise.all([
      countStore('questions'),
      countStore('articles')
    ]);

    return { questionsCount, articlesCount };
  } catch (e) {
    return { questionsCount: 0, articlesCount: 0 };
  }
}

/**
 * Formats content preview helper.
 */
export function extractFirstSentenceOrParagraph(text: string, maxLength: number = 120): string {
  if (!text) return '';
  // Remove markdown headings, etc.
  const clean = text
    .replace(/[#*`_~]/g, '')
    .replace(/\[BLOCK_[0-9]\]/g, '')
    .trim();
  
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength) + '...';
}

/**
 * Helper to wipe out cached items.
 */
export async function clearOfflineCache(): Promise<void> {
  const db = await initDB();
  const clearStore = (storeName: 'questions' | 'articles'): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  await Promise.all([
    clearStore('questions'),
    clearStore('articles')
  ]);
}

/**
 * Simple hash helper function to generate deterministic IDs from strings.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
