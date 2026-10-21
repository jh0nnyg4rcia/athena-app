/** Memory-only session view. Never imports the global legacy lesson vault or grants access offline. */
export function createAccountContentSession<T>(loadAuthorized: (id: string) => Promise<{uid: string; lesson: T; validUntil: number}>, now = Date.now) {
  let uid: string | null = null, generation = 0, online = true;
  const rows = new Map<string, { lesson: T; validUntil: number }>();
  const clear = () => { generation++; rows.clear(); };
  return {
    setAccount(next: string | null) { if (next !== uid) { clear(); uid = next; } },
    setOnline(next: boolean) { online = next; if (!next) clear(); },
    clear,
    async read(id: string): Promise<T> {
      if (!uid || !online) throw Error('ONLINE_AUTHORIZATION_REQUIRED');
      const expected = uid, epoch = generation;
      // Every read reauthorizes at the source; a cache entry or local flag is never sufficient.
      let value;
      try { value = await loadAuthorized(id); } catch (error) { clear(); throw error; }
      if (epoch !== generation || uid !== expected || !online || value.uid !== expected || !Number.isSafeInteger(value.validUntil) || now() >= value.validUntil) {
        clear(); throw Error('ACCOUNT_OR_ACCESS_CHANGED');
      }
      rows.set(id, { lesson: value.lesson, validUntil: value.validUntil });
      return value.lesson;
    },
    // Exposed only for focused tests/diagnostics, never contains content or user identity.
    size() {
      // Prune expired rows
      const current = now();
      for (const [k, v] of Array.from(rows.entries())) {
        if (current >= v.validUntil) rows.delete(k);
      }
      return rows.size;
    }
  };
}
