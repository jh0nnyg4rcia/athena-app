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
  }
};
