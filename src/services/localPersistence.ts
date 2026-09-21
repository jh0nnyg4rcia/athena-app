import { ChatSession, GamificationData, UserStat, Schedule, FailedQuestion } from '../types';

export const LocalPersistence = {
  getSessions(userId: string): ChatSession[] {
    try {
      const raw = localStorage.getItem(`athena_sessions_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveSession(userId: string, session: Partial<ChatSession> & { id: string }): ChatSession[] {
    try {
      const existing = this.getSessions(userId);
      const idx = existing.findIndex(s => s.id === session.id);
      let updated: ChatSession[];
      if (idx >= 0) {
        const merged: ChatSession = {
          ...existing[idx],
          ...session,
          lastUpdatedAt: Date.now()
        };
        updated = [...existing];
        updated[idx] = merged;
      } else {
        const full: ChatSession = {
          id: session.id,
          title: session.title || "Nova Mentoria",
          userId,
          messages: session.messages || [],
          guidedSubject: session.guidedSubject || null,
          currentArticle: session.currentArticle || 1,
          lastUpdatedAt: Date.now(),
          ...session
        };
        updated = [full, ...existing];
      }
      localStorage.setItem(`athena_sessions_${userId}`, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  deleteSession(userId: string, sessionId: string): void {
    try {
      const existing = this.getSessions(userId);
      const filtered = existing.filter(s => s.id !== sessionId);
      localStorage.setItem(`athena_sessions_${userId}`, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Local storage delete session error:", e);
    }
  },

  getGamification(userId: string): GamificationData | null {
    try {
      const raw = localStorage.getItem(`athena_gamification_${userId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveGamification(userId: string, data: GamificationData): void {
    try {
      localStorage.setItem(`athena_gamification_${userId}`, JSON.stringify(data));
    } catch (e) {
      console.warn("Local storage save gamification error:", e);
    }
  },

  getStats(userId: string): UserStat[] {
    try {
      const raw = localStorage.getItem(`athena_stats_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveStat(userId: string, stat: UserStat): void {
    try {
      const existing = this.getStats(userId);
      const idx = existing.findIndex(s => s.subjectName === stat.subjectName);
      let updated: UserStat[];
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = stat;
      } else {
        updated = [...existing, stat];
      }
      localStorage.setItem(`athena_stats_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("Local storage save stat error:", e);
    }
  },

  getSchedules(userId: string): Schedule[] {
    try {
      const raw = localStorage.getItem(`athena_schedules_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveSchedule(userId: string, schedule: Schedule): void {
    try {
      const existing = this.getSchedules(userId);
      const idx = existing.findIndex(s => s.id === schedule.id);
      let updated: Schedule[];
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = schedule;
      } else {
        updated = [schedule, ...existing];
      }
      localStorage.setItem(`athena_schedules_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("Local storage save schedule error:", e);
    }
  },

  deleteSchedule(userId: string, scheduleId: string): void {
    try {
      const existing = this.getSchedules(userId);
      const filtered = existing.filter(s => s.id !== scheduleId);
      localStorage.setItem(`athena_schedules_${userId}`, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Local storage delete schedule error:", e);
    }
  },

  getFailedQuestions(userId: string): FailedQuestion[] {
    try {
      const raw = localStorage.getItem(`athena_failed_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveFailedQuestion(userId: string, question: FailedQuestion): void {
    try {
      const existing = this.getFailedQuestions(userId);
      const idx = existing.findIndex(q => q.id === question.id);
      let updated: FailedQuestion[];
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = question;
      } else {
        updated = [question, ...existing];
      }
      localStorage.setItem(`athena_failed_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("Local storage save failed question error:", e);
    }
  },

  deleteFailedQuestion(userId: string, questionId: string): void {
    try {
      const existing = this.getFailedQuestions(userId);
      const filtered = existing.filter(q => q.id !== questionId);
      localStorage.setItem(`athena_failed_${userId}`, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Local storage delete failed question error:", e);
    }
  },

  getTrilhaProgress(userId: string): number[] {
    try {
      const raw = localStorage.getItem(`athena_trilha_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveTrilhaProgress(userId: string, days: number[]): void {
    try {
      localStorage.setItem(`athena_trilha_${userId}`, JSON.stringify(days));
    } catch (e) {
      console.warn("Local storage save trilha progress error:", e);
    }
  },

  /**
   * Sanitiza as sessões salvas para cursos de 1ª Fase (Objetiva):
   * Remove questões subjetivas (correctIndex: -1) e orais (correctIndex: -2)
   * das mensagens já gravadas no histórico de sessões do usuário.
   */
  sanitizeSessionsForObjectivePhase(specificUserId?: string): void {
    try {
      const keys: string[] = [];
      if (specificUserId) {
        keys.push(`athena_sessions_${specificUserId}`);
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('athena_sessions_') && !keys.includes(key)) {
          keys.push(key);
        }
      }

      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        let modified = false;
        try {
          const sessions = JSON.parse(raw) as ChatSession[];
          if (!Array.isArray(sessions)) continue;

          for (const s of sessions) {
            // Se for sessão de estudo regular da 1ª fase
            if (s.trilhaSessionType !== 'discursivo' && s.trilhaSessionType !== 'oral') {
              if (Array.isArray(s.messages)) {
                for (const m of s.messages) {
                  if (m.challenge && Array.isArray(m.challenge.questions)) {
                    const originalLength = m.challenge.questions.length;
                    m.challenge.questions = m.challenge.questions.filter(
                      (q: any) => q.correctIndex !== -1 && q.correctIndex !== -2 && q.correctIndex >= 0
                    );
                    if (m.challenge.questions.length !== originalLength) {
                      modified = true;
                    }
                  }
                }
              }
            }
          }

          if (modified) {
            localStorage.setItem(key, JSON.stringify(sessions));
            console.log(`[LocalPersistence] Sessões sanitizadas para 1ª Fase em: ${key}`);
          }
        } catch (err) {
          console.warn(`[LocalPersistence] Erro ao sanitizar sessões em ${key}:`, err);
        }
      }
    } catch (e) {
      console.warn('[LocalPersistence] Falha geral ao sanitizar sessões para 1ª fase:', e);
    }
  }
};

