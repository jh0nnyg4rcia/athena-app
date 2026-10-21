import { createHash, randomUUID } from 'node:crypto';

export type StorePlatform = 'google_play' | 'app_store';
export type SubscriptionStatus = 'active' | 'canceled' | 'in_grace_period' | 'expired' | 'refunded';

export interface VerifyPurchaseInput {
  platform: StorePlatform;
  productId: string;
  purchaseToken: string;
  orderId?: string;
  signature?: string;
  isSimulatedLocal?: boolean;
}

export interface WebhookNotificationInput {
  platform: StorePlatform;
  notificationId?: string;
  eventType: string;
  purchaseToken?: string;
  orderId?: string;
  originalTransactionId?: string;
  eventTimestamp: number;
  rawPayload?: any;
}

export interface StoreVerificationResult {
  ok: true;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  orderId?: string;
  autoRenewing?: boolean;
}

type Actor = { uid: string; emailVerified: boolean; provider: string };

const digest = (data: string) => createHash('sha256').update(data).digest('hex');
const validUid = (s: unknown) => typeof s === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(s);

function requireValue(ok: unknown, code: string): asserts ok {
  if (!ok) throw Error(code);
}

/** Local emulator / explicit study-progress local only. Never production. */
export function localSubscriptionSimulationAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'production') return false;
  if (env.ATHENA_STUDY_PROGRESS_LOCAL !== 'true') return false;
  if (!env.GCLOUD_PROJECT?.startsWith('demo-')) return false;
  const fsHost = env.FIRESTORE_EMULATOR_HOST || '';
  const authHost = env.FIREBASE_AUTH_EMULATOR_HOST || '';
  return /^(127\.0\.0\.1|localhost):\d+$/.test(fsHost) && /^(127\.0\.0\.1|localhost):\d+$/.test(authHost);
}

/**
 * ITEM 11 HOOK — real store verification.
 * Wire Google Play Developer API (androidpublisher.purchases.subscriptions.get)
 * and App Store Server API (Get Transaction Info / verify credentials) here.
 * Until credentials + implementation exist, this MUST fail closed.
 */
export type StoreVerifier = (
  input: Pick<VerifyPurchaseInput, 'platform' | 'productId' | 'purchaseToken' | 'orderId' | 'signature'>
) => Promise<StoreVerificationResult>;

export function storeVerificationConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  // ITEM 11: set these when Play / App Store billing credentials are provisioned.
  const playReady = Boolean(env.ATHENA_PLAY_PACKAGE_NAME && env.ATHENA_PLAY_SERVICE_ACCOUNT_JSON);
  const appleReady = Boolean(env.ATHENA_APPLE_BUNDLE_ID && env.ATHENA_APPLE_ISSUER_ID && env.ATHENA_APPLE_KEY_ID && env.ATHENA_APPLE_PRIVATE_KEY);
  return playReady || appleReady;
}

export function createDefaultStoreVerifier(env: NodeJS.ProcessEnv = process.env): StoreVerifier {
  return async (input) => {
    if (!storeVerificationConfigured(env)) {
      throw Error('STORE_VERIFICATION_UNAVAILABLE');
    }
    // ITEM 11: implement platform-specific verification. Do not grant on token shape alone.
    if (input.platform === 'google_play') {
      // await androidpublisher.purchases.subscriptions.get({ packageName, subscriptionId: productId, token: purchaseToken })
      throw Error('STORE_VERIFICATION_UNAVAILABLE');
    }
    // await App Store Server API getTransactionInfo(purchaseToken)
    throw Error('STORE_VERIFICATION_UNAVAILABLE');
  };
}

/**
 * Validação e gerenciamento de assinaturas das lojas (Google Play e App Store).
 * O cliente JAMAIS concede benefício por conta própria. Toda concessão ou renovação
 * é efetuada no servidor e gravada em 'access_subscriptions/{uid}'.
 *
 * Fail-closed: sem verificação real da loja (ou simulação local explícita no emulador),
 * nenhuma escrita em access_subscriptions / processed_purchases.
 */
export function createStoreSubscriptionVerification(
  db: any,
  now = Date.now,
  storeVerifier: StoreVerifier = createDefaultStoreVerifier()
) {
  const ref = (path: string) => db.doc(path);
  const authenticated = (a: Actor) => requireValue(a && validUid(a.uid), 'AUTHENTICATION_REQUIRED');

  const verifyPurchase = async (actor: Actor, input: VerifyPurchaseInput) => {
    authenticated(actor);
    requireValue(input && typeof input === 'object', 'INVALID_ARGUMENT');
    requireValue(['google_play', 'app_store'].includes(input.platform), 'INVALID_PLATFORM');
    requireValue(typeof input.productId === 'string' && input.productId.length > 0 && input.productId.length <= 100, 'INVALID_PRODUCT_ID');
    requireValue(typeof input.purchaseToken === 'string' && input.purchaseToken.length > 0 && input.purchaseToken.length <= 4096, 'INVALID_PURCHASE_TOKEN');

    const wantsSimulation = input.isSimulatedLocal === true;
    if (wantsSimulation) {
      requireValue(localSubscriptionSimulationAllowed(), 'SIMULATED_NOT_ALLOWED_IN_PRODUCTION');
    } else {
      // Production / non-local: must verify with the real store. No token-trust shortcut.
      const verified = await storeVerifier({
        platform: input.platform,
        productId: input.productId,
        purchaseToken: input.purchaseToken,
        orderId: input.orderId,
        signature: input.signature
      });
      requireValue(verified?.ok === true, 'STORE_VERIFICATION_FAILED');
      return persistVerifiedPurchase(actor, input, verified, /*simulated*/ false);
    }

    // Emulator-only simulation path (ATHENA_STUDY_PROGRESS_LOCAL + demo project + emulators).
    const periodDurationMs = input.productId.includes('anual')
      ? 365 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
    const currentTimestamp = now();
    const simulated: StoreVerificationResult = {
      ok: true,
      status: 'active',
      currentPeriodStart: currentTimestamp,
      currentPeriodEnd: currentTimestamp + periodDurationMs,
      orderId: input.orderId || `GPA.SIMULATED-${digest(input.purchaseToken).slice(0, 12)}`,
      autoRenewing: true
    };
    return persistVerifiedPurchase(actor, input, simulated, /*simulated*/ true);
  };

  const persistVerifiedPurchase = async (
    actor: Actor,
    input: VerifyPurchaseInput,
    verified: StoreVerificationResult,
    isLocalSimulated: boolean
  ) => {
    const tokenFingerprint = digest(`${input.platform}:${input.productId}:${input.purchaseToken}`);
    const receiptRef = ref(`processed_purchases/${tokenFingerprint}`);
    const subRef = ref(`access_subscriptions/${actor.uid}`);
    const auditId = randomUUID();

    return db.runTransaction(async (tx: any) => {
      const [existingReceipt, existingSub] = await Promise.all([
        tx.get(receiptRef),
        tx.get(subRef)
      ]);

      if (existingReceipt.exists) {
        const receiptData = existingReceipt.data();
        if (receiptData.uid !== actor.uid) {
          throw Error('PURCHASE_BOUND_TO_OTHER_ACCOUNT');
        }
        const subData = existingSub.data() || {};
        return {
          uid: actor.uid,
          serverVerified: true,
          status: subData.status || verified.status,
          currentPeriodStart: subData.currentPeriodStart,
          currentPeriodEnd: subData.currentPeriodEnd,
          productId: subData.productId,
          provider: subData.provider,
          alreadyProcessed: true
        };
      }

      const currentTimestamp = now();
      const subscriptionRecord = {
        uid: actor.uid,
        provider: input.platform,
        productId: input.productId,
        orderId: verified.orderId || input.orderId || `order_${tokenFingerprint.slice(0, 16)}`,
        purchaseTokenHash: tokenFingerprint,
        status: verified.status,
        serverVerified: true,
        currentPeriodStart: verified.currentPeriodStart,
        currentPeriodEnd: verified.currentPeriodEnd,
        updatedAt: currentTimestamp,
        isSimulatedLocal: isLocalSimulated,
        autoRenewing: verified.autoRenewing ?? true,
        storeVerifiedAt: currentTimestamp
      };

      tx.set(subRef, subscriptionRecord);
      tx.set(receiptRef, {
        uid: actor.uid,
        platform: input.platform,
        productId: input.productId,
        processedAt: currentTimestamp,
        isSimulatedLocal: isLocalSimulated
      });
      tx.set(ref(`subscription_audit/${auditId}`), {
        event: isLocalSimulated ? 'purchase_simulated_local' : 'purchase_verified',
        uid: actor.uid,
        platform: input.platform,
        productId: input.productId,
        at: currentTimestamp,
        isSimulatedLocal: isLocalSimulated
      });

      return {
        uid: actor.uid,
        serverVerified: true,
        status: subscriptionRecord.status,
        currentPeriodStart: subscriptionRecord.currentPeriodStart,
        currentPeriodEnd: subscriptionRecord.currentPeriodEnd,
        productId: input.productId,
        provider: input.platform,
        alreadyProcessed: false
      };
    });
  };

  const getSubscriptionStatus = async (actor: Actor) => {
    authenticated(actor);
    const subSnap = await ref(`access_subscriptions/${actor.uid}`).get();
    if (!subSnap.exists) {
      return {
        uid: actor.uid,
        hasSubscription: false,
        status: 'none'
      };
    }
    const data = subSnap.data();
    const current = now();
    const isCurrent = data.serverVerified === true &&
      ['active', 'canceled', 'in_grace_period'].includes(data.status) &&
      Number.isSafeInteger(data.currentPeriodStart) &&
      Number.isSafeInteger(data.currentPeriodEnd) &&
      data.currentPeriodStart <= current && current < data.currentPeriodEnd;

    return {
      uid: actor.uid,
      hasSubscription: isCurrent,
      status: data.status,
      provider: data.provider,
      productId: data.productId,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      autoRenewing: data.autoRenewing ?? false,
      isSimulatedLocal: data.isSimulatedLocal ?? false
    };
  };

  /**
   * Processador de notificações do servidor.
   * Chamado SOMENTE após autenticação do webhook na camada HTTP (OIDC / JWS).
   * Não concede assinatura nova sem recibo prévio de compra verificada.
   */
  const processServerNotification = async (input: WebhookNotificationInput) => {
    requireValue(input && typeof input === 'object', 'INVALID_ARGUMENT');
    requireValue(['google_play', 'app_store'].includes(input.platform), 'INVALID_PLATFORM');
    requireValue(typeof input.eventType === 'string' && input.eventType.length > 0, 'INVALID_EVENT_TYPE');

    const eventId = input.notificationId || digest(`${input.platform}:${input.eventType}:${input.eventTimestamp}:${input.purchaseToken || input.orderId || ''}`);
    const eventRef = ref(`processed_webhook_events/${eventId}`);
    const currentTimestamp = now();

    return db.runTransaction(async (tx: any) => {
      const existingEvent = await tx.get(eventRef);
      if (existingEvent.exists) {
        return { status: 'duplicate_ignored', eventId };
      }

      let uid: string | undefined;
      let currentSub: any;
      let subRef: any;
      let newStatus: SubscriptionStatus | undefined;
      let newEnd: number | undefined;
      let autoRenewing: boolean | undefined;
      let previousStatus: string | undefined;
      let shouldUpdate = false;

      if (input.purchaseToken) {
        const tokenFingerprint = digest(`${input.platform}:${input.rawPayload?.productId || 'standard'}:${input.purchaseToken}`);
        const receiptSnap = await tx.get(ref(`processed_purchases/${tokenFingerprint}`));
        if (receiptSnap.exists) {
          uid = receiptSnap.data().uid;
          if (uid) {
            subRef = ref(`access_subscriptions/${uid}`);
            const currentSubSnap = await tx.get(subRef);
            if (currentSubSnap.exists) {
              currentSub = currentSubSnap.data();
              previousStatus = currentSub.status;
              newStatus = currentSub.status;
              newEnd = currentSub.currentPeriodEnd;
              autoRenewing = currentSub.autoRenewing;

              switch (input.eventType) {
                case 'SUBSCRIPTION_RENEWED':
                case 'DID_RENEW': {
                  newStatus = 'active';
                  autoRenewing = true;
                  const extensionMs = 30 * 24 * 60 * 60 * 1000;
                  newEnd = Math.max(currentSub.currentPeriodEnd, currentTimestamp) + extensionMs;
                  shouldUpdate = true;
                  break;
                }
                case 'SUBSCRIPTION_CANCELED':
                case 'DID_CANCEL': {
                  newStatus = 'canceled';
                  autoRenewing = false;
                  shouldUpdate = true;
                  break;
                }
                case 'SUBSCRIPTION_IN_GRACE_PERIOD':
                case 'DID_FAIL_TO_RENEW': {
                  newStatus = 'in_grace_period';
                  shouldUpdate = true;
                  break;
                }
                case 'SUBSCRIPTION_EXPIRED':
                case 'EXPIRED': {
                  newStatus = 'expired';
                  autoRenewing = false;
                  newEnd = Math.min(currentSub.currentPeriodEnd, currentTimestamp);
                  shouldUpdate = true;
                  break;
                }
                case 'SUBSCRIPTION_REVOKED':
                case 'REFUND':
                case 'REVOKE': {
                  newStatus = 'refunded';
                  autoRenewing = false;
                  newEnd = currentTimestamp;
                  shouldUpdate = true;
                  break;
                }
              }
            }
          }
        }
      }

      // All reads complete before writes (Firestore transaction ordering).
      tx.set(eventRef, {
        platform: input.platform,
        eventType: input.eventType,
        receivedAt: currentTimestamp,
        eventTimestamp: input.eventTimestamp
      });

      if (shouldUpdate && uid && subRef && newStatus !== undefined) {
        tx.update(subRef, {
          status: newStatus,
          currentPeriodEnd: newEnd,
          autoRenewing,
          updatedAt: currentTimestamp
        });
        tx.set(ref(`subscription_audit/${randomUUID()}`), {
          event: `webhook_${input.eventType.toLowerCase()}`,
          uid,
          platform: input.platform,
          at: currentTimestamp,
          previousStatus,
          newStatus
        });
        return { status: 'processed', uid, eventType: input.eventType, newStatus };
      }

      return { status: 'recorded_unlinked', eventId };
    });
  };

  return {
    verifyPurchase,
    getSubscriptionStatus,
    processServerNotification
  };
}
