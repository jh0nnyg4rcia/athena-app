import { Review, ChatSession, Message } from '../types';
import { LocalPersistence } from '../services/localPersistence';
import { deleteVaultReview, persistLocalStorageSafe, putVaultReviews } from '../services/lessonVault';
import { TRILHA_JURIDICA_DATA } from '../data/trilhaData';

const STORAGE_PREFIX = 'athena_compressed_reviews_';
const DELETED_PREFIX = 'athena_deleted_compressed_reviews_';
const PARTS_PER_DAY = 5;

export function canonicalSubjectForDayPart(day?: number, part?: number): string | null {
  if (day === undefined || part === undefined) return null;
  const dayItem = TRILHA_JURIDICA_DATA.find((d) => d.dia === day);
  if (!dayItem || !dayItem.materias || part < 0 || part >= dayItem.materias.length) return null;
  return dayItem.materias[part].nome;
}

export function detectPartFromContent(day: number, content?: string): number | null {
  if (!content) return null;
  const low = content.toLowerCase();

  // 1. Explicit markers like "Bloco X" or "Parte X de 5" or "P1/5"
  const partMatch =
    content.match(/(?:Parte|Bloco)\s+(\d+)\s*(?:de\s+\d+|\/|\b)/i) ||
    content.match(/P(\d+)\s*\/\s*5/i);
  if (partMatch) {
    const p = parseInt(partMatch[1], 10) - 1;
    if (p >= 0 && p < PARTS_PER_DAY) return p;
  }

  // 2. Specific keyword markers for Day 1
  if (day === 1) {
    if (low.includes('lindb') || low.includes('dl 4657') || low.includes('vigência sincrônica') || low.includes('vacatio legis') || low.includes('repristina')) {
      return 4;
    }
    if (low.includes('processo penal') || low.includes('cpp') || low.includes('juiz das garantias') || low.includes('lex fori') || low.includes('territorialidade processual')) {
      return 3;
    }
    if (low.includes('processo civil') || low.includes('cpc') || low.includes('inércia vs. impulso') || low.includes('inércia da jurisdição') || low.includes('princípio do contraditório')) {
      return 2;
    }
    if (low.includes('código penal') || low.includes('mandado de legalidade') || low.includes('tempo do crime') || low.includes('extraterritorialidade') || low.includes('anterioridade da lei')) {
      return 1;
    }
    if (low.includes('constituição federal') || low.includes('so-ci-di-va-plu') || low.includes('fundamentos da república') || low.includes('art. 1º ao 4º da cf')) {
      return 0;
    }
  } else {
    const dayItem = TRILHA_JURIDICA_DATA.find((d) => d.dia === day);
    if (dayItem?.materias) {
      for (let p = 0; p < dayItem.materias.length; p++) {
        const matName = dayItem.materias[p].nome.toLowerCase();
        if (low.includes(matName)) return p;
      }
    }
  }

  return null;
}

export function isReviewContaminated(review: Pick<Review, 'day' | 'part' | 'content'>): boolean {
  const day = review.day;
  const part = review.part;
  if (!review.content) return false;
  const low = review.content.toLowerCase();

  if (day === 1 && typeof part === 'number') {
    if (part > 0 && (low.includes('so-ci-di-va-plu') || low.includes('fundamentos da república federativa'))) {
      if (part === 1 && !low.includes('penal') && !low.includes('crime') && !low.includes('legalidade')) return true;
      if (part === 2 && !low.includes('processo civil') && !low.includes('cpc') && !low.includes('inércia')) return true;
      if (part === 3 && !low.includes('processo penal') && !low.includes('cpp') && !low.includes('juiz das garantias') && !low.includes('territorialidade')) return true;
      if (part === 4 && !low.includes('lindb') && !low.includes('vigência') && !low.includes('vacatio')) return true;
    }
    if (part === 0 && (low.includes('vigência sincrônica') || low.includes('mandado de legalidade')) && !low.includes('constituição') && !low.includes('so-ci-di-va-plu')) {
      return true;
    }
  }
  return false;
}

export function shouldReplaceReviewContent(existing: Review, candidate: Review): boolean {
  const existingContaminated = isReviewContaminated(existing);
  const candidateContaminated = isReviewContaminated(candidate);

  if (existingContaminated && !candidateContaminated) return true;
  if (!existingContaminated && candidateContaminated) return false;

  if ((candidate.timestamp || 0) > (existing.timestamp || 0) + 1000) return true;

  return (candidate.content || '').length >= (existing.content || '').length;
}

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
  const canonical = canonicalSubjectForDayPart(input.day, input.part);
  const baseSubject = canonical || input.subject || 'Estudo Geral';
  const cleanBase = baseSubject.replace(/^(?:Parte|Bloco)\s+\d+\s*·\s*/i, '');
  const partLabel =
    input.day !== undefined && input.part !== undefined
      ? `Parte ${input.part + 1}`
      : '';
  const subject =
    input.day !== undefined
      ? `${partLabel ? `${partLabel} · ` : ''}${cleanBase}`
      : cleanBase;
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
    const replaceContent = shouldReplaceReviewContent(prev, review);
    next = [...existing];
    next[idx] = {
      ...prev,
      ...review,
      day: review.day ?? prev.day,
      part: review.part ?? prev.part,
      subject: review.subject || prev.subject,
      sessionId: review.sessionId && !String(review.sessionId).startsWith('trilha:') && !String(review.sessionId).startsWith('tema:')
        ? review.sessionId
        : prev.sessionId || review.sessionId,
      content: replaceContent ? review.content : prev.content,
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
  let part = msg.trilhaMaterialIndex ?? meta?.trilhaMaterialIndex;
  const stored = selectUserStudiedReviews(loadCompressedReviews(userId));
  if (typeof day !== 'number') return stored;
  if (typeof part !== 'number' || part < 0 || part >= PARTS_PER_DAY) {
    const detected = detectPartFromContent(day, msg.content);
    if (detected !== null) part = detected;
  }
  if (typeof part !== 'number' || part < 0 || part >= PARTS_PER_DAY) {
    return stored;
  }
  const canonical = canonicalSubjectForDayPart(day, part);
  const targetSubject = canonical || msg.subject || meta?.guidedSubject || 'Estudo Geral';

  const review = collectFromLesson(msg.content, msg.blocks, {
    subject: targetSubject,
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
      for (const r of session.reviews) {
        if (!r?.id || !r.content || isMostlyQuiz(r.content)) continue;
        const d = reviewDay(r);
        const p = reviewPart(r);
        const canonical = canonicalSubjectForDayPart(d, p);
        const cleanBase = (canonical || r.subject || 'Estudo Geral').replace(/^(?:Parte|Bloco)\s+\d+\s*·\s*/i, '');
        const partLabel = d !== undefined && p !== undefined ? `Parte ${p + 1}` : '';
        const subject = d !== undefined ? `${partLabel ? `${partLabel} · ` : ''}${cleanBase}` : cleanBase;
        found.push({
          ...r,
          subject,
          day: d ?? r.day,
          part: p ?? r.part
        });
      }
    }
    const modelMsgs = (session.messages || []).filter((m) => m.role === 'model' && (m.content || m.blocks?.length));
    for (let i = 0; i < modelMsgs.length; i++) {
      const msg = modelMsgs[i];
      const day = msg.trilhaDay ?? session.trilhaDay;
      if (typeof day !== 'number' || day < 1) continue;

      let part = msg.trilhaMaterialIndex;
      if (typeof part !== 'number' || part < 0 || part >= PARTS_PER_DAY) {
        const detected = detectPartFromContent(day, msg.content);
        if (detected !== null) {
          part = detected;
        } else if (modelMsgs.length <= PARTS_PER_DAY && i < PARTS_PER_DAY) {
          part = i;
        } else {
          part = session.trilhaMaterialIndex;
        }
      }

      if (typeof part !== 'number' || part < 0 || part >= PARTS_PER_DAY) continue;

      const canonicalSubject = canonicalSubjectForDayPart(day, part) || msg.subject || session.guidedSubject || 'Estudo Geral';

      const review = collectFromLesson(msg.content, msg.blocks, {
        subject: canonicalSubject,
        article: msg.article || session.currentArticle,
        day,
        part,
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
    const replaceContent = shouldReplaceReviewContent(prev, review);
    next[idx] = {
      ...prev,
      ...review,
      day: review.day ?? prev.day,
      part: review.part ?? prev.part,
      subject: review.subject || prev.subject,
      content: replaceContent ? review.content : prev.content,
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
    
    const canonical = canonicalSubjectForDayPart(day, part);
    const cleanBase = (canonical || review.subject || 'Estudo Geral').replace(/^(?:Parte|Bloco)\s+\d+\s*·\s*/i, '');
    const subject = `Parte ${part + 1} · ${cleanBase}`;

    normalized.push({
      ...review,
      subject,
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
      if (!prev || shouldReplaceReviewContent(prev, review)) {
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
