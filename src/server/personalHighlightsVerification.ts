import type { HighlightColor, PersonalHighlight } from '../types';
import { progressiveDayAccess, subscriptionIsCurrent } from './studyProgressCore';
import { testerIsCurrent } from './testerInvites';

type Actor = { uid: string; emailVerified: boolean; provider: string };

const validUid = (s: unknown): s is string => typeof s === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(s);
const validId = (s: unknown): s is string => typeof s === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(s);
const validColors: HighlightColor[] = ['yellow', 'red', 'green', 'pink', 'blue'];

function requireValue(ok: unknown, code: string): asserts ok {
  if (!ok) throw Error(code);
}

function parseLessonId(id: string): { day?: number; part?: number } {
  const match = /^day_([1-9][0-9]?|100)_part_([0-9]|1[0-9]|20)$/.exec(id);
  if (match) {
    return { day: Number(match[1]), part: Number(match[2]) };
  }
  return {};
}

/**
 * Serviço de backend para marcações pessoais de texto.
 * Garante que:
 * 1. O acesso às marcações seja estritamente restrito ao proprietário autenticado.
 * 2. As marcações não sejam usadas para violar a autorização de leitura da aula.
 * 3. O Markdown oficial e o acervo permaneçam intactos.
 */
export function createPersonalHighlightsBackend(db: any, now = Date.now) {
  const ref = (path: string) => db.doc(path);
  const col = (path: string) => db.collection(path);

  const checkReadAuthorization = async (actor: Actor, lessonId: string) => {
    const { day } = parseLessonId(lessonId);
    if (day !== undefined && day > 2) {
      // Para dias acima do 2, validar se o aluno tem direito de leitura
      const [progSnap, subSnap, adminSnap, testerSnap] = await Promise.all([
        ref(`study_progress/${actor.uid}`).get(),
        ref(`access_subscriptions/${actor.uid}`).get(),
        ref(`access_admins/${actor.uid}`).get(),
        ref(`tester_access/${actor.uid}`).get()
      ]);

      const progress = progSnap.data() || {};
      const adminData = adminSnap.data();
      const isLocal = process.env.ATHENA_STUDY_PROGRESS_LOCAL === 'true';
      const validProvider = actor.provider === 'google.com' || (isLocal && actor.provider === 'password');
      const isCeo = actor.emailVerified && validProvider &&
        adminData?.uid === actor.uid && adminData?.role === 'ceo' && adminData?.enabled === true;

      const currentStamp = now();
      const isPaid = subscriptionIsCurrent(subSnap.data(), currentStamp);
      const isTester = testerIsCurrent(testerSnap.data(), actor.uid, currentStamp);

      const completed = Array.isArray(progress.verifiedDays) ? progress.verifiedDays : [];
      const hasAccess = progressiveDayAccess(day, completed, isPaid || isTester, isCeo);

      if (!hasAccess) {
        throw Error('PROGRESSION_OR_SUBSCRIPTION_REQUIRED');
      }
    }
  };

  /**
   * Recupera todas as marcações pessoais do aluno para determinada aula/seção.
   */
  const getHighlights = async (actor: Actor, lessonId: string): Promise<PersonalHighlight[]> => {
    requireValue(actor && validUid(actor.uid), 'AUTHENTICATION_REQUIRED');
    requireValue(validId(lessonId), 'INVALID_LESSON_ID');

    // Valida autorização de leitura para impedir vazamento de aula bloqueada
    await checkReadAuthorization(actor, lessonId);

    const snapshot = await col(`users/${actor.uid}/personal_highlights`)
      .where('lessonId', '==', lessonId)
      .get();

    const highlights: PersonalHighlight[] = [];
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      if (data && data.selectedText) {
        highlights.push(data as PersonalHighlight);
      }
    });

    return highlights;
  };

  /**
   * Salva ou atualiza uma marcação pessoal de texto.
   */
  const saveHighlight = async (actor: Actor, input: any): Promise<PersonalHighlight> => {
    requireValue(actor && validUid(actor.uid), 'AUTHENTICATION_REQUIRED');
    requireValue(input && typeof input === 'object', 'INVALID_ARGUMENT');
    requireValue(validId(input.id), 'INVALID_HIGHLIGHT_ID');
    requireValue(validId(input.lessonId), 'INVALID_LESSON_ID');
    requireValue(validColors.includes(input.color), 'INVALID_COLOR');
    requireValue(typeof input.selectedText === 'string' && input.selectedText.trim().length > 0 && input.selectedText.length <= 2000, 'INVALID_TEXT');

    await checkReadAuthorization(actor, input.lessonId);

    const currentTimestamp = now();
    const docRef = ref(`users/${actor.uid}/personal_highlights/${input.id}`);
    const existing = await docRef.get();

    const highlightRecord: PersonalHighlight = {
      id: input.id,
      uid: actor.uid,
      lessonId: input.lessonId,
      blockIndex: Number.isInteger(input.blockIndex) ? input.blockIndex : 0,
      selectedText: input.selectedText.trim(),
      prefix: typeof input.prefix === 'string' ? input.prefix.slice(-50) : '',
      suffix: typeof input.suffix === 'string' ? input.suffix.slice(0, 50) : '',
      color: input.color,
      createdAt: existing.exists && existing.data()?.createdAt ? existing.data().createdAt : currentTimestamp,
      updatedAt: currentTimestamp,
      status: input.status === 'pending_match' ? 'pending_match' : 'active'
    };

    if (Number.isInteger(input.lessonVersion)) {
      highlightRecord.lessonVersion = input.lessonVersion;
    }
    if (typeof input.lessonSha256 === 'string' && input.lessonSha256) {
      highlightRecord.lessonSha256 = input.lessonSha256;
    }

    await docRef.set(highlightRecord, { merge: true });
    return highlightRecord;
  };

  /**
   * Remove uma marcação pessoal existente.
   */
  const deleteHighlight = async (actor: Actor, highlightId: string): Promise<boolean> => {
    requireValue(actor && validUid(actor.uid), 'AUTHENTICATION_REQUIRED');
    requireValue(validId(highlightId), 'INVALID_HIGHLIGHT_ID');

    const docRef = ref(`users/${actor.uid}/personal_highlights/${highlightId}`);
    const snap = await docRef.get();
    if (!snap.exists) {
      return true; // Idempotente
    }

    if (snap.data()?.uid !== actor.uid) {
      throw Error('UNAUTHORIZED');
    }

    await docRef.delete();
    return true;
  };

  return {
    getHighlights,
    saveHighlight,
    deleteHighlight
  };
}
