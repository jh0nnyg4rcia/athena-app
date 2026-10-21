import type { Express, Request, Response } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createStoreSubscriptionVerification } from '../server/storeSubscriptionVerification';

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
   * O cliente nativo envia o token recebido da loja; o servidor valida e registra a vigência.
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
      const status = code === 'AUTHENTICATION_REQUIRED' ? 401 : code === 'PURCHASE_BOUND_TO_OTHER_ACCOUNT' ? 409 : 400;
      res.status(status).json({ error: code });
    }
  });

  /**
   * Consulta de estado da assinatura da loja para a conta autenticada.
   */
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
   * Webhook do Google Play (Cloud Pub/Sub RTDN)
   */
  app.post('/api/study/webhooks/google-play', async (req: Request, res: Response) => {
    try {
      // Mensagem Pub/Sub recebida no formato base64
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
      res.status(200).json({ status: 'error_logged' }); // 200 para evitar retentativas agressivas de payloads malformados
    }
  });

  /**
   * Webhook da App Store (App Store Server Notifications V2)
   */
  app.post('/api/study/webhooks/app-store', async (req: Request, res: Response) => {
    try {
      const signedPayload = req.body?.signedPayload;
      // Em produção real, o signedPayload (JWS) é decodificado e verificado com a chave pública da Apple.
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
