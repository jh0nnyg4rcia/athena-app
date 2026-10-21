/** Prepared boundary for the existing athenaapi. Not registered until progression is approved. */
export type ServerIdentity = Readonly<{ uid: string }>;
export type ServerDecision = Readonly<{ uid: string; lessonId: string; allowed: boolean; revision: string; validUntil: number }>;
export type CanonicalLesson = { id: string; day: number; part: number; status: string; [key: string]: unknown };
const resource = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const m = /^day_([1-9][0-9]?)_part_(0|[1-9][0-9]?)$|^day_(100)_part_(0|[1-9][0-9]?)$/.exec(value);
  if (!m) return null;
  const day = Number(m[1] ?? m[3]), part = Number(m[2] ?? m[4]);
  return part <= 20 ? { day, part } : null;
};
export function createProtectedContentDelivery(deps: {
  // Only server adapters may implement these. Never deserialize identities/decisions from body.
  authenticate: (credential: string) => Promise<ServerIdentity>;
  authorize: (uid: string, lessonId: string) => Promise<ServerDecision>;
  readCanonical: (lessonId: string) => Promise<CanonicalLesson | null>;
  now: () => number;
}) {
  const valid = (d: ServerDecision, uid: string, id: string) => d?.uid === uid && d.lessonId === id && d.allowed === true
    && typeof d.revision === 'string' && d.revision.length > 0 && Number.isSafeInteger(d.validUntil) && deps.now() < d.validUntil;
  return async (body: unknown, credential: string) => {
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'lessonId')) throw Error('INVALID_RESOURCE');
    const id = (body as {lessonId: unknown}).lessonId, identity = resource(id);
    if (!identity || typeof id !== 'string') throw Error('INVALID_RESOURCE');
    const actor = await deps.authenticate(credential);
    if (!actor?.uid) throw Error('AUTHENTICATION_REQUIRED');
    const before = await deps.authorize(actor.uid, id);
    if (!valid(before, actor.uid, id)) throw Error('CONTENT_ACCESS_DENIED');
    const lesson = await deps.readCanonical(id);
    if (!lesson || lesson.id !== id || lesson.day !== identity.day || lesson.part !== identity.part || lesson.status !== 'approved') throw Error('CONTENT_UNAVAILABLE');
    const after = await deps.authorize(actor.uid, id);
    if (!valid(after, actor.uid, id) || after.revision !== before.revision) throw Error('CONTENT_ACCESS_CHANGED');
    return { uid: actor.uid, lesson, accessRevision: after.revision, validUntil: after.validUntil };
  };
}
