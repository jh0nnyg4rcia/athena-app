import type { Express, Request, Response } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createPersonalHighlightsBackend } from '../server/personalHighlightsVerification';

let highlightsBackendInstance: ReturnType<typeof createPersonalHighlightsBackend> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

function getHighlightsContext() {
  if (!highlightsBackendInstance) {
    if (process.env.ATHENA_STUDY_PROGRESS_LOCAL === 'true') {
      if (!process.env.GCLOUD_PROJECT?.startsWith('demo-') || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) {
        throw Error('LOCAL_STUDY_EMULATORS_REQUIRED');
      }
      const firebase = getApps().find(a => a.name === 'study-local') || initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-athena-client-safe' }, 'study-local');
      const db = getFirestore(firebase);
      try {
        db.settings({ ignoreUndefinedProperties: true });
      } catch {
        /* already initialized */
      }
      highlightsBackendInstance = createPersonalHighlightsBackend(db);
      authInstance = getAuth(firebase);
    } else {
      const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb';
      const firebase = getApps().length ? getApps()[0] : initializeApp();
      const db = getFirestore(firebase, DATABASE_ID);
      try {
        db.settings({ ignoreUndefinedProperties: true });
      } catch {
        /* already initialized */
      }
      highlightsBackendInstance = createPersonalHighlightsBackend(db);
      authInstance = getAuth(firebase);
    }
  }
  return {
    backend: highlightsBackendInstance,
    auth: authInstance!
  };
}

export function registerPersonalHighlightsRoutes(app: Express) {
  const actor = async (req: Request) => {
    const token = /^Bearer ([^ ]+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) throw Error('AUTHENTICATION_REQUIRED');
    let user;
    try {
      user = await getHighlightsContext().auth.verifyIdToken(token, true);
    } catch {
      throw Error('AUTHENTICATION_REQUIRED');
    }
    if (user.firebase?.sign_in_provider === 'anonymous') throw Error('AUTHENTICATION_REQUIRED');
    return {
      uid: user.uid,
      emailVerified: user.email_verified === true,
      provider: user.firebase?.sign_in_provider || ''
    };
  };

  /**
   * Consulta marcações pessoais da aula para o aluno autenticado.
   */
  app.get('/api/study/personal-highlights', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Authorization');
    try {
      const user = await actor(req);
      const lessonId = String(req.query.lessonId || '');
      const highlights = await getHighlightsContext().backend.getHighlights(user, lessonId);
      res.json({ highlights });
    } catch (e: any) {
      const raw = e instanceof Error ? e.message : 'UNAVAILABLE';
      const code = /^[A-Z_]{3,80}$/.test(raw) ? raw : 'UNAVAILABLE';
      const status = code === 'AUTHENTICATION_REQUIRED' ? 401 : code === 'PROGRESSION_OR_SUBSCRIPTION_REQUIRED' ? 403 : 400;
      res.status(status).json({ error: code });
    }
  });

  /**
   * Salva ou atualiza uma marcação pessoal.
   */
  app.post('/api/study/personal-highlights', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Authorization');
    try {
      const user = await actor(req);
      const highlight = await getHighlightsContext().backend.saveHighlight(user, req.body);
      res.json({ highlight });
    } catch (e: any) {
      const raw = e instanceof Error ? e.message : 'UNAVAILABLE';
      const code = /^[A-Z_]{3,80}$/.test(raw) ? raw : 'UNAVAILABLE';
      const status = code === 'AUTHENTICATION_REQUIRED' ? 401 : code === 'PROGRESSION_OR_SUBSCRIPTION_REQUIRED' ? 403 : 400;
      res.status(status).json({ error: code });
    }
  });

  /**
   * Remove uma marcação pessoal pelo ID.
   */
  app.delete('/api/study/personal-highlights/:id', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Authorization');
    try {
      const user = await actor(req);
      const id = String(req.params.id);
      await getHighlightsContext().backend.deleteHighlight(user, id);
      res.json({ success: true, id });
    } catch (e: any) {
      const raw = e instanceof Error ? e.message : 'UNAVAILABLE';
      const code = /^[A-Z_]{3,80}$/.test(raw) ? raw : 'UNAVAILABLE';
      const status = code === 'AUTHENTICATION_REQUIRED' ? 401 : 400;
      res.status(status).json({ error: code });
    }
  });
}
