import type { Express, Request } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { TRILHA_JURIDICA_DATA } from '../data/trilhaData';
import { createStudyProgressCore } from '../server/studyProgressCore';
import { createTesterInvites } from '../server/testerInvites';

let contextInstance: {
  core: ReturnType<typeof createStudyProgressCore>;
  invites: ReturnType<typeof createTesterInvites>;
  auth: ReturnType<typeof getAuth>;
} | null = null;

function getStudyContext() {
  if (!contextInstance) {
    if (process.env.ATHENA_STUDY_PROGRESS_LOCAL === 'true') {
      if (!process.env.GCLOUD_PROJECT?.startsWith('demo-') || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) {
        throw Error('LOCAL_STUDY_EMULATORS_REQUIRED');
      }
      const firebase = getApps().find(a => a.name === 'study-local') || initializeApp({ projectId: process.env.GCLOUD_PROJECT }, 'study-local');
      contextInstance = {
        core: createStudyProgressCore(getFirestore(firebase), day => TRILHA_JURIDICA_DATA.find(d => d.dia === day)?.materias.length || 0),
        invites: createTesterInvites(getFirestore(firebase)),
        auth: getAuth(firebase)
      };
    } else {
      const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb';
      const firebase = getApps().length ? getApps()[0] : initializeApp();
      const db = getFirestore(firebase, DATABASE_ID);
      try {
        db.settings({ ignoreUndefinedProperties: true });
      } catch {
        /* already initialized */
      }
      contextInstance = {
        core: createStudyProgressCore(db, day => TRILHA_JURIDICA_DATA.find(d => d.dia === day)?.materias.length || 0),
        invites: createTesterInvites(db),
        auth: getAuth(firebase)
      };
    }
  }
  return contextInstance;
}

export function registerStudyProgressRoutes(app: Express) {
  const actor = async (req: Request) => {
    const token = /^Bearer ([^ ]+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) throw Error('AUTHENTICATION_REQUIRED');
    let user;
    try {
      user = await getStudyContext().auth.verifyIdToken(token, true);
    } catch {
      throw Error('AUTHENTICATION_REQUIRED');
    }
    if (user.firebase?.sign_in_provider === 'anonymous') throw Error('AUTHENTICATION_REQUIRED');
    return { uid: user.uid, emailVerified: user.email_verified === true, provider: user.firebase?.sign_in_provider || '' };
  };

  const route = (method: 'get' | 'post', path: string, fn: (req: Request) => Promise<unknown>) => app[method](path, async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Authorization');
    try {
      res.json(await fn(req));
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'UNAVAILABLE';
      const code = /^[A-Z_]{3,80}$/.test(raw) ? raw : 'UNAVAILABLE';
      const status = code === 'INVITE_RATE_LIMITED' ? 429 : code === 'AUTHENTICATION_REQUIRED' ? 401 : ['PROGRESSION_OR_SUBSCRIPTION_REQUIRED', 'CEO_REQUIRED'].includes(code) ? 403 : code.includes('CONFLICT') || code.includes('CHANGED') ? 409 : 400;
      res.status(status).json({ error: code });
    }
  });

  route('get', '/api/study/material/:id', async req => {
    const v = await getStudyContext().core.view(await actor(req), String(req.params.id));
    const { lesson, ...state } = v;
    return state;
  });
  route('get', '/api/study/materials', async req => getStudyContext().core.materials(await actor(req)));
  route('get', '/api/study/sessions', async req => getStudyContext().core.sessions(await actor(req)));
  route('get', '/api/study/access', async req => getStudyContext().core.access(await actor(req)));
  route('get', '/api/study/lesson/:id', async req => getStudyContext().core.view(await actor(req), String(req.params.id)));
  route('post', '/api/study/answers', async req => getStudyContext().core.saveAnswers(await actor(req), req.body));
  route('post', '/api/study/complete', async req => getStudyContext().core.completeMaterial(await actor(req), req.body));
  route('post', '/api/study/test-invites/redeem', async req => getStudyContext().invites.redeem(await actor(req), req.body));
  route('post', '/api/study/test-invites/issue', async req => getStudyContext().invites.issue(await actor(req), req.body));
  route('post', '/api/study/test-invites/revoke', async req => getStudyContext().invites.revoke(await actor(req), req.body));
  route('get', '/api/study/test-invites', async req => getStudyContext().invites.list(await actor(req)));
}

export const registerLocalStudyProgressRoutes = registerStudyProgressRoutes;
