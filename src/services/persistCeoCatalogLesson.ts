import { doc, runTransaction, type Firestore } from 'firebase/firestore';
import type { HomologatedLesson } from '../types';
import { exactPublishedLesson } from '../lib/ceoLessonEditing';

/** Only the official lesson and its catalog entry; never reads or rewrites legal reviews. */
export async function persistCeoCatalogLesson(db: Firestore, lesson: HomologatedLesson, clean: (value: any) => any): Promise<HomologatedLesson> {
  const ref = doc(db, 'homologated_lessons', lesson.id);
  return runTransaction(db, async tx => {
    const previous = await tx.get(ref);
    const existing = previous.data();
    if (existing?.blocks !== undefined && (!Array.isArray(existing.blocks) || existing.blocks.length !== 6 || existing.blocks.some((b: unknown) => typeof b !== 'string'))) throw new Error('Formato publicado de blocks incompatível.');
    // Existing blocks determine their representation, including older catalog documents.
    let published = { ...lesson };
    if (existing?.blocks !== undefined && published.blocks === undefined) published.blocks = existing.blocks;
    if (/\[ATHENA_CHALLENGE\]/i.test(published.content)) published = exactPublishedLesson(published);
    if (existing?.version !== undefined && (!Number.isInteger(existing.version) || existing.version < 1)) throw new Error('Versão publicada incompatível.');
    published.version = (existing?.version || 0) + 1;
    published.approvedAt = Math.max(lesson.approvedAt, (existing?.approvedAt || 0) + 1);
    const payload = clean({ id: published.id, day: Math.round(published.day), part: Math.round(published.part),
      subject: published.subject, topic: published.topic, content: published.content, status: 'approved',
      approvedBy: 'jhonny.spider@gmail.com', approvedAt: published.approvedAt, version: published.version,
      modelUsed: published.modelUsed, review: published.review, challenge: published.challenge, blocks: published.blocks });
    if (JSON.stringify(payload).length > 900000 || new TextEncoder().encode(JSON.stringify(payload)).length > 900000) throw new Error('A aula excede o limite seguro; nenhum conteúdo foi truncado.');
    tx.set(ref, payload, { merge: true });
    tx.set(doc(db, 'homologated_parts', lesson.id), clean({ id: published.id, day: published.day, part: published.part,
      subject: published.subject, status: 'approved', approvedBy: 'jhonny.spider@gmail.com', approvedAt: published.approvedAt,
      version: published.version,
      review: (published.review || '').slice(0, 20000) }), { merge: true });
    return published;
  });
}
