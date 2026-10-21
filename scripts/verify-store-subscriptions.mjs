import { createStoreSubscriptionVerification } from '../src/server/storeSubscriptionVerification.js';

console.log('=== INICIANDO SUÍTE DE TESTES: ASSINATURAS DAS LOJAS & CONTRATOS ===\n');

// Mock Firestore em memória para teste isolado
class MockDocRef {
  constructor(path, storage) {
    this.path = path;
    this.storage = storage;
  }
  async get() {
    return {
      exists: Boolean(this.storage[this.path]),
      data: () => this.storage[this.path]
    };
  }
}

class MockFirestore {
  constructor() {
    this.data = {};
  }
  doc(path) {
    return new MockDocRef(path, this.data);
  }
  async runTransaction(updateFn) {
    const tx = {
      get: async (ref) => ref.get(),
      set: (ref, val) => { this.data[ref.path] = { ...val }; },
      create: (ref, val) => {
        if (this.data[ref.path]) throw new Error('ALREADY_EXISTS');
        this.data[ref.path] = { ...val };
      },
      update: (ref, val) => {
        if (!this.data[ref.path]) throw new Error('NOT_FOUND');
        this.data[ref.path] = { ...this.data[ref.path], ...val };
      }
    };
    return updateFn(tx);
  }
}

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (!condition) {
    console.error(`❌ FALHOU: ${testName}`);
    process.exit(1);
  }
  passed++;
  console.log(`✔ PASSOU: ${testName}`);
}

async function run() {
  const db = new MockFirestore();
  let fakeNow = 1700000000000;
  const verifier = createStoreSubscriptionVerification(db, () => fakeNow);

  const actor = { uid: 'user_athena_123', emailVerified: true, provider: 'google.com' };

  // TEST 1: Verificação inicial de compra Google Play (simulada local)
  console.log('TEST 1: Verificação de compra inicial...');
  const res1 = await verifier.verifyPurchase(actor, {
    platform: 'google_play',
    productId: 'athena_mensal_100dias',
    purchaseToken: 'token_google_play_xyz_1',
    orderId: 'GPA.1234-5678-9012',
    isSimulatedLocal: true
  });
  assert(res1.serverVerified === true, 'Assinatura validada pelo servidor');
  assert(res1.status === 'active', 'Status ativo');
  assert(res1.alreadyProcessed === false, 'Primeiro processamento registrado');
  assert(res1.currentPeriodEnd > fakeNow, 'Vigência futura calculada');

  // TEST 2: Idempotência de compra (mesmo token de compra)
  console.log('\nTEST 2: Idempotência de token de compra repetido...');
  const res2 = await verifier.verifyPurchase(actor, {
    platform: 'google_play',
    productId: 'athena_mensal_100dias',
    purchaseToken: 'token_google_play_xyz_1',
    orderId: 'GPA.1234-5678-9012',
    isSimulatedLocal: true
  });
  assert(res2.alreadyProcessed === true, 'Reconhecido como já processado de forma idempotente');
  assert(res2.status === 'active', 'Status mantido consistente');

  // TEST 3: Prevenção contra reutilização de recibo por conta diferente
  console.log('\nTEST 3: Rejeição de recibo já vinculado a outro UID...');
  const otherActor = { uid: 'fraud_user_456', emailVerified: true, provider: 'google.com' };
  let errorCaught = false;
  try {
    await verifier.verifyPurchase(otherActor, {
      platform: 'google_play',
      productId: 'athena_mensal_100dias',
      purchaseToken: 'token_google_play_xyz_1', // Mesmo token do actor 1
      isSimulatedLocal: true
    });
  } catch (e) {
    errorCaught = e.message === 'PURCHASE_BOUND_TO_OTHER_ACCOUNT';
  }
  assert(errorCaught, 'Recibo duplicado entre usuários diferentes é estritamente bloqueado');

  // TEST 4: Consulta de status de benefício
  console.log('\nTEST 4: Consulta consolidada do status da assinatura...');
  const statusRes = await verifier.getSubscriptionStatus(actor);
  assert(statusRes.hasSubscription === true, 'Status confirma benefício ativo');
  assert(statusRes.provider === 'google_play', 'Provedor Google Play preservado');

  // TEST 5: Processamento de Webhook (Renovação, Cancelamento, Expiração, Reembolso)
  console.log('\nTEST 5: Processamento de eventos do webhook com idempotência...');
  // 5a: Renovação
  const renewalWebhook = await verifier.processServerNotification({
    platform: 'google_play',
    notificationId: 'notif_renew_1',
    eventType: 'SUBSCRIPTION_RENEWED',
    purchaseToken: 'token_google_play_xyz_1',
    eventTimestamp: fakeNow + 1000,
    rawPayload: { productId: 'athena_mensal_100dias' }
  });
  assert(renewalWebhook.status === 'processed', 'Evento de renovação processado');
  assert(renewalWebhook.newStatus === 'active', 'Status ativo após renovação');

  // 5b: Notificação duplicada ignorada
  const dupWebhook = await verifier.processServerNotification({
    platform: 'google_play',
    notificationId: 'notif_renew_1',
    eventType: 'SUBSCRIPTION_RENEWED',
    purchaseToken: 'token_google_play_xyz_1',
    eventTimestamp: fakeNow + 1000,
    rawPayload: { productId: 'athena_mensal_100dias' }
  });
  assert(dupWebhook.status === 'duplicate_ignored', 'Notificação repetida ignorada com idempotência');

  // 5c: Cancelamento (preserva vigência até o fim do ciclo)
  const cancelWebhook = await verifier.processServerNotification({
    platform: 'google_play',
    notificationId: 'notif_cancel_2',
    eventType: 'SUBSCRIPTION_CANCELED',
    purchaseToken: 'token_google_play_xyz_1',
    eventTimestamp: fakeNow + 2000,
    rawPayload: { productId: 'athena_mensal_100dias' }
  });
  assert(cancelWebhook.newStatus === 'canceled', 'Status marcado como cancelado');
  const statusAfterCancel = await verifier.getSubscriptionStatus(actor);
  assert(statusAfterCancel.hasSubscription === true, 'Acesso permanece ativo até o final do período vigente');

  // 5d: Reembolso (revogação imediata)
  const refundWebhook = await verifier.processServerNotification({
    platform: 'google_play',
    notificationId: 'notif_refund_3',
    eventType: 'REFUND',
    purchaseToken: 'token_google_play_xyz_1',
    eventTimestamp: fakeNow + 3000,
    rawPayload: { productId: 'athena_mensal_100dias' }
  });
  assert(refundWebhook.newStatus === 'refunded', 'Status alterado para refunded');
  const statusAfterRefund = await verifier.getSubscriptionStatus(actor);
  assert(statusAfterRefund.hasSubscription === false, 'Acesso cancelado imediatamente após reembolso');

  console.log('\n==========================================');
  console.log(`TODOS OS ${passed}/${total} TESTES DE ASSINATURA PASSARAM COM SUCESSO!`);
  console.log('==========================================');
}

run().catch(err => {
  console.error('Falha geral no teste:', err);
  process.exit(1);
});
