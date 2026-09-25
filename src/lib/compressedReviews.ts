import { Review, ChatSession, Message } from '../types';
import { LocalPersistence } from '../services/localPersistence';
import { deleteVaultReview, persistLocalStorageSafe, putVaultReviews } from '../services/lessonVault';

const STORAGE_PREFIX = 'athena_compressed_reviews_';
const DELETED_PREFIX = 'athena_deleted_compressed_reviews_';
const PARTS_PER_DAY = 5;

function stripChallenge(text: string): string {
  return (text || '')
    .replace(/\[ATHENA_CHALLENGE\][\s\S]*$/i, '')
    .replace(/```+\s*$/g, '')
    .trim();
}

function isMostlyQuiz(text: string): boolean {
  const low = (text || '').toLowerCase();
  if (low.includes('[athena_challenge]')) return true;
  if ((low.match(/"correctindex"|"correctanswer"/g) || []).length >= 2) return true;
  if (low.includes('desafio athena') && !/revis[aã]o\s+comprimida/i.test(low)) return true;
  return false;
}

function sliceNamedBlock(content: string, n: number): string | null {
  const re = new RegExp(`\\[BLOCK[_\\s-]*${n}\\]`, 'i');
  const start = content.search(re);
  if (start === -1) return null;
  let text = content.slice(start).replace(re, '');
  const next = text.search(/\n\[BLOCK[_\\s-]*\d+\]/i);
  if (next !== -1) text = text.slice(0, next);
  return stripChallenge(text);
}

function sliceByHeading(content: string): string | null {
  const re = /revis[aã]o\s+comprimida(?:\s+pareto(?:\s*80\s*\/\s*20)?)?/i;
  const match = content.match(re);
  if (!match || match.index === undefined) return null;
  const headingStart = content.lastIndexOf('\n', match.index);
  let text = content.slice(headingStart === -1 ? match.index : headingStart);
  const nextBlock = text.search(/\n\[BLOCK[_\\s-]*\d+\]/i);
  if (nextBlock !== -1) text = text.slice(0, nextBlock);
  return stripChallenge(text);
}

function looksLikeCompressedReview(text?: string): boolean {
  if (!text || text.trim().length < 40) return false;
  if (isMostlyQuiz(text)) return false;
  const low = text.toLowerCase();
  const bullets = text.split('\n').filter((l) => {
    const t = l.trim();
    return t.startsWith('-') || t.startsWith('•') || t.startsWith('*') || /^\d+[\.)]/.test(t);
  }).length;
  return (
    bullets >= 4 ||
    low.includes('revisão comprimida') ||
    low.includes('revisao comprimida') ||
    low.includes('pareto 80')
  );
}

export function extractReviewBlock(content?: string, blocks?: string[]): string | null {
  if (content) {
    const named = sliceNamedBlock(content, 6);
    if (named && looksLikeCompressedReview(named)) return named;
    const headed = sliceByHeading(content);
    if (headed && looksLikeCompressedReview(headed)) return headed;
    if (named && named.length >= 80 && !isMostlyQuiz(named)) return named;
  }

  if (blocks && blocks.length) {
    const headed = [...blocks].reverse().find((b) => looksLikeCompressedReview(b));
    if (headed) return stripChallenge(headed);

    if (blocks.length >= 6) {
      const sixth = stripChallenge(blocks[5] || '');
      if (sixth.length >= 40 && !isMostlyQuiz(sixth)) return sixth;
    }

    const last = stripChallenge(blocks[blocks.length - 1] || '');
    if (looksLikeCompressedReview(last)) return last;
  }

  if (content) {
    const named = sliceNamedBlock(content, 6);
    if (named && named.length >= 40 && !isMostlyQuiz(named)) return named;
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
  const partLabel =
    input.day !== undefined && input.part !== undefined
      ? `Parte ${input.part + 1}`
      : '';
  const subject =
    input.day !== undefined
      ? `${partLabel ? `${partLabel} · ` : ''}${input.subject}`
      : input.subject || 'Estudo Geral';
  return {
    id,
    sessionId: input.sessionId || id,
    subject,
    article,
    content: input.content,
    timestamp: input.timestamp || Date.now(),
    day: input.day,
    part: input.part
  };
}

export function reviewDay(review: Review): number | undefined {
  if (typeof review.day === 'number') return review.day;
  const trilha = String(review.id || '').match(/^trilha:(\d+):/);
  if (trilha) return Number(trilha[1]);
  const sub = (review.subject || '').match(/Dia\s+(\d+)/i);
  if (sub) return Number(sub[1]);
  return undefined;
}

export function reviewPart(review: Review): number | undefined {
  if (typeof review.part === 'number') return review.part;
  const trilha = String(review.id || '').match(/^trilha:\d+:(\d+)/);
  if (trilha) return Number(trilha[1]);
  const sub = (review.subject || '').match(/Parte\s+(\d+)/i);
  if (sub) return Number(sub[1]) - 1;
  return undefined;
}

export function loadCompressedReviews(userId: string): Review[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as Review[]) : [];
  } catch {
    return [];
  }
}

function loadDeletedReviewIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${DELETED_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function rememberDeletedReview(userId: string, reviewId: string): void {
  const ids = loadDeletedReviewIds(userId);
  ids.add(reviewId);
  persistLocalStorageSafe(`${DELETED_PREFIX}${userId}`, JSON.stringify([...ids]));
}

function forgetDeletedReview(userId: string, reviewId: string): void {
  const ids = loadDeletedReviewIds(userId);
  if (!ids.delete(reviewId)) return;
  persistLocalStorageSafe(`${DELETED_PREFIX}${userId}`, JSON.stringify([...ids]));
}

export function saveCompressedReviews(userId: string, reviews: Review[]): void {
  const studied = selectUserStudiedReviews(reviews);
  persistLocalStorageSafe(`${STORAGE_PREFIX}${userId}`, JSON.stringify(studied));
  void putVaultReviews(studied);
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
      day: review.day ?? prev.day,
      part: review.part ?? prev.part,
      sessionId: review.sessionId && !String(review.sessionId).startsWith('trilha:') && !String(review.sessionId).startsWith('tema:')
        ? review.sessionId
        : prev.sessionId || review.sessionId,
      content: (review.content || '').length >= (prev.content || '').length ? review.content : prev.content,
      timestamp: Math.max(prev.timestamp || 0, review.timestamp || 0)
    };
  } else {
    next = [review, ...existing];
  }
  forgetDeletedReview(userId, review.id);
  saveCompressedReviews(userId, next);
  return selectUserStudiedReviews(next);
}

export function deleteCompressedReview(userId: string, reviewId: string, current?: Review[]): Review[] {
  rememberDeletedReview(userId, reviewId);
  const base = selectUserStudiedReviews([...(current || []), ...loadCompressedReviews(userId)]);
  const next = base.filter((review) => review.id !== reviewId);
  saveCompressedReviews(userId, next);
  void deleteVaultReview(reviewId);
  return next;
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
  const day = msg.trilhaDay ?? meta?.trilhaDay;
  const part = msg.trilhaMaterialIndex ?? meta?.trilhaMaterialIndex;
  const stored = selectUserStudiedReviews(loadCompressedReviews(userId));
  if (typeof day !== 'number' || typeof part !== 'number' || part < 0 || part >= PARTS_PER_DAY) {
    return stored;
  }
  const review = collectFromLesson(msg.content, msg.blocks, {
    subject: msg.subject || meta?.guidedSubject || 'Estudo Geral',
    article: meta?.currentArticle ?? msg.article,
    day,
    part,
    sessionId: meta?.sessionId
  });
  if (!review) return stored;
  return upsertCompressedReview(userId, {
    ...review,
    id: `trilha:${day}:${part}`,
    day,
    part
  });
}

function collectFromSessions(sessions: ChatSession[]): Review[] {
  const found: Review[] = [];
  for (const session of sessions || []) {
    if (session.reviews?.length) {
      found.push(...session.reviews.filter((r) => r?.id && r.content && !isMostlyQuiz(r.content)));
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

function mergeSessions(userId: string, extras?: ChatSession[]): ChatSession[] {
  const byId = new Map<string, ChatSession>();
  for (const session of [...LocalPersistence.getSessions(userId), ...(extras || [])]) {
    if (!session?.id) continue;
    const prev = byId.get(session.id);
    if (!prev) {
      byId.set(session.id, session);
      continue;
    }
    byId.set(session.id, {
      ...prev,
      ...session,
      messages: (session.messages?.length || 0) >= (prev.messages?.length || 0) ? session.messages : prev.messages,
      reviews: (session.reviews?.length || 0) >= (prev.reviews?.length || 0) ? session.reviews : prev.reviews,
      trilhaDay: session.trilhaDay ?? prev.trilhaDay,
      trilhaMaterialIndex: session.trilhaMaterialIndex ?? prev.trilhaMaterialIndex
    });
  }
  return Array.from(byId.values());
}

function mergeReviewIntoStore(store: Review[], review: Review): Review[] {
  const idx = store.findIndex((r) => r.id === review.id);
  if (idx >= 0) {
    const prev = store[idx];
    const next = [...store];
    next[idx] = {
      ...prev,
      ...review,
      day: review.day ?? prev.day,
      part: review.part ?? prev.part,
      content: (review.content || '').length >= (prev.content || '').length ? review.content : prev.content,
      timestamp: Math.max(prev.timestamp || 0, review.timestamp || 0)
    };
    return next;
  }
  return [review, ...store];
}

/** Até 5 partes (0–4) por dia, só as que este usuário gerou ao estudar. */
export function selectUserStudiedReviews(reviews: Review[]): Review[] {
  const normalized: Review[] = [];
  for (const review of reviews || []) {
    const day = reviewDay(review);
    const part = reviewPart(review);
    if (day === undefined || part === undefined) continue;
    if (!Number.isInteger(day) || day < 1) continue;
    if (!Number.isInteger(part) || part < 0 || part >= PARTS_PER_DAY) continue;
    if (!review.content || isMostlyQuiz(review.content)) continue;
    const sessionId = String(review.sessionId || '');
    if (!sessionId || sessionId.startsWith('trilha:') || sessionId.startsWith('tema:')) continue;
    normalized.push({
      ...review,
      id: `trilha:${day}:${part}`,
      day,
      part
    });
  }
  return mergeReviewLists(normalized);
}

/**
 * Reúne só as revisões que este usuário gerou ao estudar o dia.
 * O catálogo oficial das aulas não entra nesta lista.
 */
export function harvestCompressedReviewsLocal(
  userId: string,
  extras?: { sessions?: ChatSession[] }
): Review[] {
  const deleted = loadDeletedReviewIds(userId);
  let store = selectUserStudiedReviews(loadCompressedReviews(userId)).filter((review) => !deleted.has(review.id));
  for (const review of collectFromSessions(mergeSessions(userId, extras?.sessions))) {
    const [studied] = selectUserStudiedReviews([review]);
    if (!studied || deleted.has(studied.id)) continue;
    store = mergeReviewIntoStore(store, studied);
  }
  const selected = selectUserStudiedReviews(store).filter((review) => !deleted.has(review.id));
  saveCompressedReviews(userId, selected);
  return selected;
}

export async function harvestCompressedReviews(
  userId: string,
  extras?: { sessions?: ChatSession[] }
): Promise<Review[]> {
  return harvestCompressedReviewsLocal(userId, extras);
}

export function mergeReviewLists(...lists: Review[][]): Review[] {
  const map = new Map<string, Review>();
  for (const list of lists) {
    for (const review of list || []) {
      if (!review?.id || !review.content || isMostlyQuiz(review.content)) continue;
      const prev = map.get(review.id);
      if (!prev || (review.content.length >= prev.content.length && review.timestamp >= prev.timestamp)) {
        map.set(review.id, review);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const dayA = reviewDay(a) ?? 9999;
    const dayB = reviewDay(b) ?? 9999;
    if (dayA !== dayB) return dayA - dayB;
    const partA = reviewPart(a) ?? 99;
    const partB = reviewPart(b) ?? 99;
    if (partA !== partB) return partA - partB;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });
}
