import type { Express, Request, Response } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createStoreSubscriptionVerification } from '../server/storeSubscriptionVerification';
import { assertAppStoreWebhookAuthorized, assertPlayRtdnAuthorized } from '../server/storeWebhookAuth';

let subscriptionVerifierInstance: ReturnType<typeof createStoreSubscriptionVerification> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

function getSubscriptionContext() {
  if (!subscriptionVerifierInstance) {
    if (process.env.ATHENA_STUDY_PROGRESS_LOCAL === 'true') {
      if (!process.env.GCLOUD_PROJECT?.startsWith('demo-') || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) {
        throw Error('LOCAL_STUDY_EMULATORS_REQUIRED');
      }
      const firebase = getApps().find(a => a.name === 'study-local') || initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-athena-client-safe' }, 'study-local');
      const db = getFirestore(firebase);
      subscriptionVerifierInstance = createStoreSubscriptionVerification(db);
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
      subscriptionVerifierInstance = createStoreSubscriptionVerification(db);
      authInstance = getAuth(firebase);
    }
  }
  return {
    verifier: subscriptionVerifierInstance,
    auth: authInstance!
  };
}

function mapSubscriptionError(raw: string): number {
  if (raw === 'AUTHENTICATION_REQUIRED' || raw === 'WEBHOOK_AUTH_REQUIRED') return 401;
  if (raw === 'PURCHASE_BOUND_TO_OTHER_ACCOUNT') return 409;
  if (raw === 'STORE_VERIFICATION_UNAVAILABLE' || raw === 'WEBHOOK_AUTH_UNAVAILABLE') return 503;
  if (raw === 'STORE_VERIFICATION_FAILED' || raw === 'SIMULATED_NOT_ALLOWED_IN_PRODUCTION') return 400;
  return 400;
}

export function registerSubscriptionRoutes(app: Express) {
  const actor = async (req: Request) => {
    const token = /^Bearer ([^ ]+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) throw Error('AUTHENTICATION_REQUIRED');
    let user;
    try {
      user = await getSubscriptionContext().auth.verifyIdToken(token, true);
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
   * Endpoint de verificação de compras nas lojas (Google Play e App Store).
   * Fail-closed: sem verificação real da loja (ITEM 11) não grava benefício.
   */
  app.post('/api/study/subscription-verify', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Authorization');
    try {
      const user = await actor(req);
      const result = await getSubscriptionContext().verifier.verifyPurchase(user, req.body);
      res.json(result);
    } catch (e: any) {
      const raw = e instanceof Error ? e.message : 'UNAVAILABLE';
      const code = /^[A-Z_]{3,80}$/.test(raw) ? raw : 'UNAVAILABLE';
      res.status(mapSubscriptionError(code)).json({ error: code });
    }
  });

  app.get('/api/study/subscription-status', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Authorization');
    try {
      const user = await actor(req);
      const result = await getSubscriptionContext().verifier.getSubscriptionStatus(user);
      res.json(result);
    } catch (e: any) {
      const raw = e instanceof Error ? e.message : 'UNAVAILABLE';
      const code = /^[A-Z_]{3,80}$/.test(raw) ? raw : 'UNAVAILABLE';
      const status = code === 'AUTHENTICATION_REQUIRED' ? 401 : 400;
      res.status(status).json({ error: code });
    }
  });

  /**
   * Webhook do Google Play (Cloud Pub/Sub RTDN) — exige OIDC; fail-closed.
   */
  app.post('/api/study/webhooks/google-play', async (req: Request, res: Response) => {
    try {
      await assertPlayRtdnAuthorized(req);
    } catch (e: any) {
      const raw = e instanceof Error ? e.message : 'WEBHOOK_AUTH_REQUIRED';
      const code = /^[A-Z_]{3,80}$/.test(raw) ? raw : 'WEBHOOK_AUTH_REQUIRED';
      res.status(mapSubscriptionError(code)).json({ error: code });
      return;
    }

    try {
      const message = req.body?.message;
      let payload: any = {};
      if (message?.data) {
        const decoded = Buffer.from(message.data, 'base64').toString('utf-8');
        try {
          payload = JSON.parse(decoded);
        } catch {
          payload = { raw: decoded };
        }
      } else {
        payload = req.body || {};
      }

      const subscriptionNotification = payload.subscriptionNotification;
      let eventType = 'SUBSCRIPTION_NOTIFICATION';
      if (subscriptionNotification?.notificationType) {
        const typeMap: Record<number, string> = {
          1: 'SUBSCRIPTION_RECOVERED',
          2: 'SUBSCRIPTION_RENEWED',
          3: 'SUBSCRIPTION_CANCELED',
          4: 'SUBSCRIPTION_PURCHASED',
          5: 'SUBSCRIPTION_ON_HOLD',
          6: 'SUBSCRIPTION_IN_GRACE_PERIOD',
          7: 'SUBSCRIPTION_RESTARTED',
          8: 'SUBSCRIPTION_PRICE_CHANGE_CONFIRMED',
          9: 'SUBSCRIPTION_DEFERRED',
          10: 'SUBSCRIPTION_PAUSED',
          11: 'SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED',
          12: 'SUBSCRIPTION_REVOKED',
          13: 'SUBSCRIPTION_EXPIRED'
        };
        eventType = typeMap[subscriptionNotification.notificationType] || `TYPE_${subscriptionNotification.notificationType}`;
      }

      const result = await getSubscriptionContext().verifier.processServerNotification({
        platform: 'google_play',
        notificationId: message?.messageId || undefined,
        eventType,
        purchaseToken: subscriptionNotification?.purchaseToken,
        eventTimestamp: Number(payload.eventTimeMillis) || Date.now(),
        rawPayload: payload
      });

      res.status(200).json(result);
    } catch (error) {
      console.warn('[Webhook Google Play] Falha no processamento:', error);
      res.status(200).json({ status: 'error_logged' });
    }
  });

  /**
   * Webhook da App Store (App Store Server Notifications V2) — exige JWS; fail-closed.
   */
  app.post('/api/study/webhooks/app-store', async (req: Request, res: Response) => {
    try {
      await assertAppStoreWebhookAuthorized(req);
    } catch (e: any) {
      const raw = e instanceof Error ? e.message : 'WEBHOOK_AUTH_REQUIRED';
      const code = /^[A-Z_]{3,80}$/.test(raw) ? raw : 'WEBHOOK_AUTH_REQUIRED';
      res.status(mapSubscriptionError(code)).json({ error: code });
      return;
    }

    try {
      const signedPayload = req.body?.signedPayload;
      let eventType = req.body?.notificationType || 'APPLE_NOTIFICATION';
      const notificationUUID = req.body?.notificationUUID;
      const subtype = req.body?.subtype;
      if (subtype) {
        eventType = `${eventType}_${subtype}`;
      }

      const result = await getSubscriptionContext().verifier.processServerNotification({
        platform: 'app_store',
        notificationId: notificationUUID,
        eventType,
        purchaseToken: req.body?.data?.originalTransactionId,
        eventTimestamp: Number(req.body?.data?.signedDate) || Date.now(),
        rawPayload: req.body
      });

      res.status(200).json(result);
    } catch (error) {
      console.warn('[Webhook App Store] Falha no processamento:', error);
      res.status(200).json({ status: 'error_logged' });
    }
  });
}
