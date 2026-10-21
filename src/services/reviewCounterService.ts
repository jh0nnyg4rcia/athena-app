import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { LocalPersistence } from './localPersistence';
import { ReviewCounterEntry } from '../types';

const processedMutations = new Map<string, number>();

function sanitizeId(id: string): string {
  return id.replace(/[:.]/g, '_');
}

export const ReviewCounterService = {
  /**
   * Obtém os contadores locais para o usuário ativo.
   */
  getLocalCounters(userId: string): Record<string, ReviewCounterEntry> {
    return LocalPersistence.getReviewCounters(userId);
  },

  /**
   * Obtém a contagem atual de uma revisão (mínimo 0).
   */
  getCount(userId: string, reviewId: string): number {
    const counters = this.getLocalCounters(userId);
    return Math.max(0, counters[reviewId]?.count || 0);
  },

  /**
   * Sincroniza os contadores com o Firestore (users/{uid}).
   * Não sobrescreve dados mais novos nem concede benefícios.
   */
  async syncFromCloud(userId: string): Promise<Record<string, ReviewCounterEntry>> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return this.getLocalCounters(userId);
    }
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return this.getLocalCounters(userId);

      const data = snap.data();
      const cloudMap = (data?.reviewCounters || {}) as Record<string, ReviewCounterEntry>;
      const localMap = this.getLocalCounters(userId);
      const merged: Record<string, ReviewCounterEntry> = { ...localMap };

      for (const [key, entry] of Object.entries(cloudMap)) {
        const reviewId = entry.reviewId || key.replace(/_/g, ':');
        const localEntry = localMap[reviewId];
        if (!localEntry || (entry.lastUpdatedAt || 0) >= (localEntry.lastUpdatedAt || 0)) {
          merged[reviewId] = {
            reviewId,
            count: Math.max(0, entry.count || 0),
            lastUpdatedAt: entry.lastUpdatedAt || Date.now(),
            lastMutationId: entry.lastMutationId
          };
        }
      }

      LocalPersistence.saveReviewCounters(userId, merged);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('athena-review-counters-synced', { detail: { userId, counters: merged } }));
      }
      return merged;
    } catch (err) {
      console.warn('[ReviewCounter] Erro ao sincronizar contadores do Firestore:', err);
      return this.getLocalCounters(userId);
    }
  },

  /**
   * Incrementa ou decrementa o contador individual de revisões (delta = +1 ou -1).
   * Mínimo 0.
   * Protegido contra duplicidade por reenvio e perda por concorrência.
   * O contador é acompanhamento pessoal: não concede conclusão diária, assinatura ou desbloqueio.
   */
  async updateCounter(
    userId: string,
    reviewId: string,
    delta: number,
    mutationId?: string
  ): Promise<number> {
    if (!userId || !reviewId) return 0;

    // Proteção contra duplicação por reenvio
    if (mutationId) {
      const now = Date.now();
      const lastSeen = processedMutations.get(mutationId);
      if (lastSeen && now - lastSeen < 300_000) {
        return this.getCount(userId, reviewId);
      }
      processedMutations.set(mutationId, now);
      // Limpeza de cache de mutações antigas (> 10 min)
      if (processedMutations.size > 200) {
        for (const [mid, time] of processedMutations.entries()) {
          if (now - time > 600_000) processedMutations.delete(mid);
        }
      }
    }

    const localMap = this.getLocalCounters(userId);
    const current = Math.max(0, localMap[reviewId]?.count || 0);
    const newCount = Math.max(0, current + delta);
    const now = Date.now();

    const entry: ReviewCounterEntry = {
      reviewId,
      count: newCount,
      lastUpdatedAt: now,
      lastMutationId: mutationId
    };

    localMap[reviewId] = entry;
    LocalPersistence.saveReviewCounters(userId, localMap);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('athena-review-counter-updated', {
        detail: { userId, reviewId, count: newCount }
      }));
    }

    // Persistência em nuvem (users/{uid}) com isolamento de conta e campo aninhado seguro
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const safeKey = sanitizeId(reviewId);
        await setDoc(
          doc(db, 'users', userId),
          {
            reviewCounters: {
              [safeKey]: entry
            }
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('[ReviewCounter] Falha ao persistir contador no Firestore (mantido localmente):', err);
      }
    }

    return newCount;
  }
};
