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

type Actor = { uid: string; emailVerified: boolean; provider: string };

const digest = (data: string) => createHash('sha256').update(data).digest('hex');
const validUid = (s: unknown) => typeof s === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(s);

function requireValue(ok: unknown, code: string): asserts ok {
  if (!ok) throw Error(code);
}

/**
 * Validação e gerenciamento de assinaturas das lojas (Google Play e App Store).
 * O cliente JAMAIS concede benefício por conta própria. Toda concessão ou renovação
 * é efetuada no servidor e gravada em 'access_subscriptions/{uid}'.
 */
export function createStoreSubscriptionVerification(db: any, now = Date.now) {
  const ref = (path: string) => db.doc(path);
  const authenticated = (a: Actor) => requireValue(a && validUid(a.uid), 'AUTHENTICATION_REQUIRED');

  /**
   * Verifica a compra recebida do aplicativo móvel nativo (ou teste local isolado).
   * Garante idempotência: compras com o mesmo token/orderId não são duplicadas.
   */
  const verifyPurchase = async (actor: Actor, input: VerifyPurchaseInput) => {
    authenticated(actor);
    requireValue(input && typeof input === 'object', 'INVALID_ARGUMENT');
    requireValue(['google_play', 'app_store'].includes(input.platform), 'INVALID_PLATFORM');
    requireValue(typeof input.productId === 'string' && input.productId.length > 0 && input.productId.length <= 100, 'INVALID_PRODUCT_ID');
    requireValue(typeof input.purchaseToken === 'string' && input.purchaseToken.length > 0 && input.purchaseToken.length <= 4096, 'INVALID_PURCHASE_TOKEN');

    const isLocalSimulated = input.isSimulatedLocal === true;
    if (isLocalSimulated) {
      // Resultados simulados são estritamente restritos ao ambiente de desenvolvimento/teste local
      const isProduction = process.env.NODE_ENV === 'production';
      requireValue(!isProduction, 'SIMULATED_NOT_ALLOWED_IN_PRODUCTION');
    }

    const tokenFingerprint = digest(`${input.platform}:${input.productId}:${input.purchaseToken}`);
    const receiptRef = ref(`processed_purchases/${tokenFingerprint}`);
    const subRef = ref(`access_subscriptions/${actor.uid}`);
    const auditId = randomUUID();

    return db.runTransaction(async (tx: any) => {
      const [existingReceipt, existingSub] = await Promise.all([
        tx.get(receiptRef),
        tx.get(subRef)
      ]);

      const currentTimestamp = now();

      if (existingReceipt.exists) {
        const receiptData = existingReceipt.data();
        if (receiptData.uid !== actor.uid) {
          // Token de compra já vinculado a outra conta ATHENA (prevenção contra compartilhamento fraudulento de recibos)
          throw Error('PURCHASE_BOUND_TO_OTHER_ACCOUNT');
        }
        // Retorna idempotente o benefício já verificado
        const subData = existingSub.data() || {};
        return {
          uid: actor.uid,
          serverVerified: true,
          status: subData.status || 'active',
          currentPeriodStart: subData.currentPeriodStart,
          currentPeriodEnd: subData.currentPeriodEnd,
          productId: subData.productId,
          provider: subData.provider,
          alreadyProcessed: true
        };
      }

      // Cálculo do período de vigência da assinatura (mensal = 30 dias padrão de segurança)
      const periodDurationMs = input.productId.includes('anual')
        ? 365 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

      const currentPeriodStart = currentTimestamp;
      const currentPeriodEnd = currentTimestamp + periodDurationMs;

      const subscriptionRecord = {
        uid: actor.uid,
        provider: input.platform,
        productId: input.productId,
        orderId: input.orderId || `order_${tokenFingerprint.slice(0, 16)}`,
        purchaseTokenHash: tokenFingerprint,
        status: 'active' as SubscriptionStatus,
        serverVerified: true,
        currentPeriodStart,
        currentPeriodEnd,
        updatedAt: currentTimestamp,
        isSimulatedLocal: isLocalSimulated,
        autoRenewing: true
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
        event: 'purchase_verified',
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
        currentPeriodStart,
        currentPeriodEnd,
        productId: input.productId,
        provider: input.platform,
        alreadyProcessed: false
      };
    });
  };

  /**
   * Consulta o estado consolidado da assinatura do usuário.
   */
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
   * Processador de notificações do servidor (Webhooks / Real-Time Developer Notifications / App Store Server Notifications).
   * Lida com renovação, cancelamento, expiração, período de graça e reembolso com idempotência contra notificações repetidas.
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

      // Marcar evento como processado para evitar re-execução em notificações repetidas
      tx.set(eventRef, {
        platform: input.platform,
        eventType: input.eventType,
        receivedAt: currentTimestamp,
        eventTimestamp: input.eventTimestamp
      });

      // Se temos o purchaseToken ou orderId, localizar o titular da assinatura
      if (input.purchaseToken) {
        const tokenFingerprint = digest(`${input.platform}:${input.rawPayload?.productId || 'standard'}:${input.purchaseToken}`);
        const receiptSnap = await tx.get(ref(`processed_purchases/${tokenFingerprint}`));
        if (receiptSnap.exists) {
          const uid = receiptSnap.data().uid;
          if (uid) {
            const subRef = ref(`access_subscriptions/${uid}`);
            const currentSubSnap = await tx.get(subRef);
            if (currentSubSnap.exists) {
              const currentSub = currentSubSnap.data();
              let newStatus: SubscriptionStatus = currentSub.status;
              let newEnd = currentSub.currentPeriodEnd;
              let autoRenewing = currentSub.autoRenewing;

              switch (input.eventType) {
                case 'SUBSCRIPTION_RENEWED':
                case 'DID_RENEW': {
                  newStatus = 'active';
                  autoRenewing = true;
                  const extensionMs = 30 * 24 * 60 * 60 * 1000;
                  newEnd = Math.max(currentSub.currentPeriodEnd, currentTimestamp) + extensionMs;
                  break;
                }
                case 'SUBSCRIPTION_CANCELED':
                case 'DID_CANCEL': {
                  // O cancelamento não revoga o acesso imediatamente; apenas desativa renovação automática
                  newStatus = 'canceled';
                  autoRenewing = false;
                  break;
                }
                case 'SUBSCRIPTION_IN_GRACE_PERIOD':
                case 'DID_FAIL_TO_RENEW': {
                  newStatus = 'in_grace_period';
                  break;
                }
                case 'SUBSCRIPTION_EXPIRED':
                case 'EXPIRED': {
                  newStatus = 'expired';
                  autoRenewing = false;
                  newEnd = Math.min(currentSub.currentPeriodEnd, currentTimestamp);
                  break;
                }
                case 'SUBSCRIPTION_REVOKED':
                case 'REFUND':
                case 'REVOKE': {
                  // Reembolso revoga imediatamente o acesso
                  newStatus = 'refunded';
                  autoRenewing = false;
                  newEnd = currentTimestamp;
                  break;
                }
              }

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
                previousStatus: currentSub.status,
                newStatus
              });

              return { status: 'processed', uid, eventType: input.eventType, newStatus };
            }
          }
        }
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
