import { Review, HomologatedLesson, ChatSession, Message } from '../types';
import { TRILHA_JURIDICA_DATA } from '../data/trilhaData';
import { fetchAllHomologatedLessons, getLocalHomologatedList } from '../services/curatedLessonService';
import { listCachedTrilhaParts } from '../services/trilhaCacheService';
import { LocalPersistence } from '../services/localPersistence';
import homologatedSeedsData from '../data/homologatedSeeds.json';

const STORAGE_PREFIX = 'athena_compressed_reviews_';
const seeds = (homologatedSeedsData || {}) as Record<string, HomologatedLesson>;

function bulletCount(text: string): number {
  return (text || '').split('\n').filter((l) => {
    const t = l.trim();
    return t.startsWith('-') || t.startsWith('•') || t.startsWith('*') || /^\d+[\.)]/.test(t);
  }).length;
}

function looksLikeReview(text?: string): boolean {
  if (!text) return false;
  const low = text.toLowerCase();
  return bulletCount(text) >= 5 || low.includes('revisão comprimida') || low.includes('pareto 80');
}

export function extractReviewBlock(content?: string, blocks?: string[]): string | null {
  if (content) {
    const marker = content.search(/\[BLOCK_6\]/i);
    if (marker !== -1) {
      let text = content.slice(marker).replace(/^\[BLOCK_6\]/i, '');
      const nextBlock = text.search(/\n\[BLOCK_\d+\]/);
      if (nextBlock !== -1) text = text.slice(0, nextBlock);
      const nextTag = text.search(/\n\[ATHENA_/);
      if (nextTag !== -1) text = text.slice(0, nextTag);
      text = text.trim();
      if (text.length >= 20) return text;
    }
  }

  if (blocks && blocks.length) {
    const sixth = (blocks[5] || '').trim();
    if (blocks.length >= 6 && sixth.length >= 20 && !sixth.toLowerCase().includes('[athena_challenge]')) {
      return sixth;
    }
    const likely = [...blocks].reverse().find((b) => looksLikeReview(b) && !(b || '').includes('[ATHENA_CHALLENGE]'));
    if (likely && likely.trim().length >= 20) return likely.trim();
    const last = (blocks[blocks.length - 1] || '').trim();
    if (last.length >= 20 && bulletCount(last) >= 4) return last;
  }

  if (content && looksLikeReview(content) && !content.includes('[BLOCK_1]')) {
    return content.trim();
  }

  return null;
}

export function reviewFingerprint(input: {
  day?: number;
  part?: number;
  subject: string;
  article: number;
}): string {
  if (input.day !== undefined && input.part !== undefined) {
    return `trilha:${input.day}:${input.part}`;
  }
  return `tema:${(input.subject || 'geral').toLowerCase().trim()}:${input.article}`;
}

export function buildCompressedReview(input: {
  content: string;
  subject: string;
  article?: number;
  sessionId?: string;
  day?: number;
  part?: number;
  timestamp?: number;
}): Review {
  const article = input.article ?? (input.day !== undefined ? input.day : 0);
  const id = reviewFingerprint({
    day: input.day,
    part: input.part,
    subject: input.subject,
    article
  });
  const subject =
    input.day !== undefined
      ? `Dia ${input.day} · ${input.subject}`
      : input.subject || 'Estudo Geral';
  return {
    id,
    sessionId: input.sessionId || id,
    subject,
    article,
    content: input.content,
    timestamp: input.timestamp || Date.now()
  };
}

export function loadCompressedReviews(userId: string): Review[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as Review[]) : [];
  } catch {
    return [];
  }
}

export function saveCompressedReviews(userId: string, reviews: Review[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(reviews));
  } catch (e) {
    console.warn('[CompressedReviews] Falha ao persistir:', e);
  }
}

export function upsertCompressedReview(userId: string, review: Review): Review[] {
  const existing = loadCompressedReviews(userId);
  const idx = existing.findIndex((r) => r.id === review.id);
  let next: Review[];
  if (idx >= 0) {
    const prev = existing[idx];
    next = [...existing];
    next[idx] = {
      ...prev,
      ...review,
      sessionId: review.sessionId && !String(review.sessionId).startsWith('trilha:') && !String(review.sessionId).startsWith('tema:')
        ? review.sessionId
        : prev.sessionId || review.sessionId,
      content: (review.content || '').length >= (prev.content || '').length ? review.content : prev.content,
      timestamp: Math.max(prev.timestamp || 0, review.timestamp || 0)
    };
  } else {
    next = [review, ...existing];
  }
  saveCompressedReviews(userId, next);
  return next;
}

export function deleteCompressedReview(userId: string, reviewId: string): Review[] {
  const next = loadCompressedReviews(userId).filter((r) => r.id !== reviewId);
  saveCompressedReviews(userId, next);
  return next;
}

function trilhaSubject(day: number, part: number, fallback?: string): string {
  const item = TRILHA_JURIDICA_DATA.find((d) => d.dia === day);
  return item?.materias?.[part]?.nome || fallback || 'Trilha Jurídica';
}

function collectFromLesson(
  content: string | undefined,
  blocks: string[] | undefined,
  meta: { subject: string; article?: number; day?: number; part?: number; timestamp?: number; sessionId?: string }
): Review | null {
  const block = extractReviewBlock(content, blocks);
  if (!block) return null;
  return buildCompressedReview({
    content: block,
    subject: meta.subject,
    article: meta.article,
    day: meta.day,
    part: meta.part,
    timestamp: meta.timestamp,
    sessionId: meta.sessionId
  });
}

export function persistReviewFromMessage(
  userId: string,
  msg: Pick<Message, 'content' | 'blocks' | 'subject' | 'article' | 'trilhaDay' | 'trilhaMaterialIndex'>,
  meta?: {
    sessionId?: string;
    guidedSubject?: string | null;
    currentArticle?: number;
    trilhaDay?: number;
    trilhaMaterialIndex?: number;
  }
): Review[] {
  const review = collectFromLesson(msg.content, msg.blocks, {
    subject: msg.subject || meta?.guidedSubject || 'Estudo Geral',
    article: msg.article || meta?.currentArticle,
    day: msg.trilhaDay ?? meta?.trilhaDay,
    part: msg.trilhaMaterialIndex ?? meta?.trilhaMaterialIndex,
    sessionId: meta?.sessionId
  });
  if (!review) return loadCompressedReviews(userId);
  return upsertCompressedReview(userId, review);
}

function collectFromSessions(sessions: ChatSession[]): Review[] {
  const found: Review[] = [];
  for (const session of sessions || []) {
    if (session.reviews?.length) {
      found.push(...session.reviews.filter((r) => r?.id && r.content));
    }
    for (const msg of session.messages || []) {
      if (msg.role !== 'model') continue;
      const review = collectFromLesson(msg.content, msg.blocks, {
        subject: msg.subject || session.guidedSubject || 'Estudo Geral',
        article: msg.article || session.currentArticle,
        day: msg.trilhaDay ?? session.trilhaDay,
        part: msg.trilhaMaterialIndex ?? session.trilhaMaterialIndex,
        timestamp: session.lastUpdatedAt,
        sessionId: session.id
      });
      if (review) found.push(review);
    }
  }
  return found;
}

export type HarvestArticle = {
  subject: string;
  article: number;
  content: string;
  timestamp?: number;
  summary?: string;
};

/**
 * Colheita síncrona (sementes, cache, sessões). Não espera Firestore.
 */
export function harvestCompressedReviewsLocal(
  userId: string,
  extras?: { sessions?: ChatSession[]; articles?: HarvestArticle[]; homologated?: HomologatedLesson[] }
): Review[] {
  const found: Review[] = [];

  const homologated: HomologatedLesson[] = [
    ...Object.values(seeds || {}),
    ...Object.values(getLocalHomologatedList()),
    ...(extras?.homologated || [])
  ];

  const seenLesson = new Set<string>();
  for (const lesson of homologated) {
    if (!lesson) continue;
    const key = lesson.id || `${lesson.day}:${lesson.part}`;
    if (seenLesson.has(key)) continue;
    seenLesson.add(key);
    if (lesson.status && lesson.status !== 'approved') continue;
    const review = collectFromLesson(lesson.content, lesson.blocks, {
      subject: lesson.subject || trilhaSubject(lesson.day, lesson.part),
      article: lesson.day,
      day: lesson.day,
      part: lesson.part,
      timestamp: lesson.approvedAt
    });
    if (review) found.push(review);
  }

  for (const cached of listCachedTrilhaParts()) {
    const review = collectFromLesson(cached.text, undefined, {
      subject: trilhaSubject(cached.day, cached.part),
      article: cached.day,
      day: cached.day,
      part: cached.part,
      timestamp: cached.timestamp
    });
    if (review) found.push(review);
  }

  const sessions = extras?.sessions?.length ? extras.sessions : LocalPersistence.getSessions(userId);
  found.push(...collectFromSessions(sessions));

  for (const article of extras?.articles || []) {
    const review = collectFromLesson(article.content || article.summary, undefined, {
      subject: article.subject || 'Estudo Geral',
      article: article.article,
      timestamp: article.timestamp
    });
    if (review) found.push(review);
  }

  let store = loadCompressedReviews(userId);
  for (const review of found) {
    const idx = store.findIndex((r) => r.id === review.id);
    if (idx >= 0) {
      const prev = store[idx];
      store[idx] = {
        ...prev,
        ...review,
        content: (review.content || '').length >= (prev.content || '').length ? review.content : prev.content,
        timestamp: Math.max(prev.timestamp || 0, review.timestamp || 0)
      };
    } else {
      store = [review, ...store];
    }
  }
  saveCompressedReviews(userId, store);
  return store;
}

export async function harvestCompressedReviews(
  userId: string,
  extras?: { sessions?: ChatSession[]; articles?: HarvestArticle[]; fetchCloud?: boolean }
): Promise<Review[]> {
  const immediate = harvestCompressedReviewsLocal(userId, extras);
  if (extras?.fetchCloud === false) return immediate;

  try {
    const cloud = await Promise.race([
      fetchAllHomologatedLessons(),
      new Promise<HomologatedLesson[]>((resolve) => setTimeout(() => resolve([]), 4000))
    ]);
    if (cloud.length) {
      return harvestCompressedReviewsLocal(userId, { ...extras, homologated: cloud });
    }
  } catch {
    /* cache/sementes já cobrem o offline */
  }
  return harvestCompressedReviewsLocal(userId, extras);
}

export function mergeReviewLists(...lists: Review[][]): Review[] {
  const map = new Map<string, Review>();
  for (const list of lists) {
    for (const review of list || []) {
      if (!review?.id || !review.content) continue;
      const prev = map.get(review.id);
      if (!prev || (review.content.length >= prev.content.length && review.timestamp >= prev.timestamp)) {
        map.set(review.id, review);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
}
