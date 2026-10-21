/** Read-only lifecycle for the currently displayed official lesson. */
export function watchPublishedLesson<T>(input: {
  target: EventTarget;
  visibilityTarget: EventTarget;
  visible: () => boolean;
  read: () => Promise<T | null>;
  apply: (lesson: T) => void;
  subscribe: (invalidate: () => void) => () => void;
}): () => void {
  let disposed = false;
  let running = false;
  let pending = false;
  const refresh = () => {
    if (disposed) return;
    pending = true;
    if (running) return;
    running = true;
    void (async () => {
      try {
        while (pending && !disposed) {
          pending = false;
          try {
            const lesson = await input.read();
            if (!disposed && lesson) input.apply(lesson);
          } catch { /* Keep the current offline view. */ }
        }
      } finally { running = false; }
    })();
  };
  const onVisible = () => { if (input.visible()) refresh(); };
  const unsubscribe = input.subscribe(refresh);
  input.target.addEventListener('online', refresh);
  input.target.addEventListener('focus', onVisible);
  input.visibilityTarget.addEventListener('visibilitychange', onVisible);
  refresh();
  return () => {
    disposed = true;
    unsubscribe();
    input.target.removeEventListener('online', refresh);
    input.target.removeEventListener('focus', onVisible);
    input.visibilityTarget.removeEventListener('visibilitychange', onVisible);
  };
}
