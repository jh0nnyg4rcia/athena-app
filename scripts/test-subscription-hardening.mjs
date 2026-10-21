import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import {
  createStoreSubscriptionVerification,
  localSubscriptionSimulationAllowed,
  storeVerificationConfigured,
  createDefaultStoreVerifier
} from '../src/server/storeSubscriptionVerification.ts';
import { assertPlayRtdnAuthorized, assertAppStoreWebhookAuthorized } from '../src/server/storeWebhookAuth.ts';
import { createStudyProgressCore } from '../src/server/studyProgressCore.ts';
import { TRILHA_JURIDICA_DATA } from '../src/data/trilhaData.ts';
import { initializeApp, getApps, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';

process.env.ATHENA_STUDY_PROGRESS_LOCAL = 'true';
process.env.GCLOUD_PROJECT = 'demo-athena-subfix';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8197';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
delete process.env.NODE_ENV;
delete process.env.ATHENA_PLAY_PACKAGE_NAME;
delete process.env.ATHENA_PLAY_SERVICE_ACCOUNT_JSON;
delete process.env.ATHENA_APPLE_BUNDLE_ID;
delete process.env.ATHENA_PLAY_RTDN_AUDIENCE;
delete process.env.ATHENA_PLAY_RTDN_SERVICE_ACCOUNT;
delete process.env.ATHENA_APPLE_WEBHOOK_ENABLED;

const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push({ name, ok: true }); console.log('PASS', name); }
  catch (e) { results.push({ name, ok: false, error: String(e?.message || e) }); console.log('FAIL', name, e?.message || e); }
};

const app = getApps().find(a => a.name === 'subfix') || initializeApp({ projectId: 'demo-athena-subfix' }, 'subfix');
const db = getFirestore(app);
const now = 1_700_000_000_000;
const curriculum = d => TRILHA_JURIDICA_DATA.find(x => x.dia === d)?.materias.length || 0;
const core = createStudyProgressCore(db, curriculum, () => now);
const verifier = createStoreSubscriptionVerification(db, () => now);

const questions = { questions: [
  { text: 'Q1', options: ['A', 'B'], correctIndex: 0, explanation: 'e' },
  { text: 'Q2', options: ['A', 'B'], correctIndex: 1, explanation: 'e' }
]};
const fixture = (day, part) => {
  const id = `day_${day}_part_${part}`;
  const content = Array.from({ length: 6 }, (_, i) => `[BLOCK_${i + 1}]\nS ${day}/${part}/${i}\n${i === 4 ? '[ATHENA_CHALLENGE]\n' + JSON.stringify(questions) + '\n' : ''}`).join('');
  return { id, day, part, content, challenge: questions, status: 'approved', version: 1, subject: 'Synthetic' };
};
for (const day of [1, 2, 3]) {
  for (let part = 0; part < curriculum(day); part++) {
    const l = fixture(day, part);
    await db.doc('homologated_lessons/' + l.id).set(l);
    await db.doc('homologated_parts/' + l.id).set({ id: l.id, day, part, status: 'approved', version: 1, subject: 'S', review: 'ok', approvedBy: 'ceo@example.invalid' });
  }
}

async function completeDay(actor, day) {
  for (let p = 0; p < curriculum(day); p++) {
    let v = await core.view(actor, `day_${day}_part_${p}`);
    if (!v.material.completed) {
      await core.saveAnswers(actor, { lessonId: v.lesson.id, lessonVersion: v.material.lessonVersion, lessonSha256: v.material.lessonSha256, expectedRevision: v.material.revision, requestId: randomUUID(), answers: { 0: 0, 1: 1 } });
      v = await core.view(actor, v.lesson.id);
      await core.completeMaterial(actor, { lessonId: v.lesson.id, lessonVersion: v.material.lessonVersion, lessonSha256: v.material.lessonSha256, expectedRevision: v.material.revision, requestId: randomUUID(), confirmStudied: true });
    }
  }
}

await check('config: store verification not configured; local sim allowed under emulator env', async () => {
  assert.equal(storeVerificationConfigured(), false);
  assert.equal(localSubscriptionSimulationAllowed(), true);
});

await check('forged token (no isSimulatedLocal) rejected; nothing written', async () => {
  const actor = { uid: 'forge-hard', emailVerified: true, provider: 'password' };
  await assert.rejects(() => verifier.verifyPurchase(actor, {
    platform: 'google_play', productId: 'athena_mensal', purchaseToken: 'forged-' + randomUUID()
  }), /STORE_VERIFICATION_UNAVAILABLE/);
  assert.equal((await db.doc('access_subscriptions/' + actor.uid).get()).exists, false);
  const snaps = await db.collection('processed_purchases').get();
  assert.equal(snaps.size, 0);
});

await check('isSimulatedLocal blocked when NODE_ENV=production', async () => {
  process.env.NODE_ENV = 'production';
  const actor = { uid: 'sim-prod', emailVerified: true, provider: 'password' };
  await assert.rejects(() => verifier.verifyPurchase(actor, {
    platform: 'google_play', productId: 'x', purchaseToken: 'y', isSimulatedLocal: true
  }), /SIMULATED_NOT_ALLOWED_IN_PRODUCTION/);
  delete process.env.NODE_ENV;
});

await check('local sim still works under emulator flags', async () => {
  const actor = { uid: 'sim-ok', emailVerified: true, provider: 'password' };
  const r = await verifier.verifyPurchase(actor, {
    platform: 'google_play', productId: 'athena_mensal', purchaseToken: 'sim-' + randomUUID(), isSimulatedLocal: true
  });
  assert.equal(r.serverVerified, true);
  assert.equal((await db.doc('access_subscriptions/' + actor.uid).get()).exists, true);
});

await check('existing valid subscription doc still grants day3 after progression', async () => {
  const actor = { uid: 'preseed-sub', emailVerified: true, provider: 'password' };
  await completeDay(actor, 1); await completeDay(actor, 2);
  await db.doc('access_subscriptions/' + actor.uid).set({
    uid: actor.uid, provider: 'google_play', serverVerified: true, status: 'active',
    currentPeriodStart: now - 1000, currentPeriodEnd: now + 99_000_000, productId: 'athena_mensal'
  });
  const v = await core.view(actor, 'day_3_part_0');
  assert.ok(v.lesson.content.includes('[BLOCK_1]'));
});

await check('free user days 1-2 unaffected; day3 blocked', async () => {
  const actor = { uid: 'free-hard', emailVerified: true, provider: 'password' };
  await core.view(actor, 'day_1_part_0');
  await completeDay(actor, 1);
  await core.view(actor, 'day_2_part_0');
  await completeDay(actor, 2);
  await assert.rejects(() => core.view(actor, 'day_3_part_0'), /PROGRESSION_OR_SUBSCRIPTION_REQUIRED/);
});

await check('CEO unaffected', async () => {
  const ceo = { uid: 'ceo-hard', emailVerified: true, provider: 'google.com' };
  await db.doc('access_admins/' + ceo.uid).set({ uid: ceo.uid, role: 'ceo', enabled: true });
  // seed day 100 minimal
  const l = fixture(100, 0);
  // only if curriculum has day 100
  if (curriculum(100) > 0) {
    for (let p = 0; p < curriculum(100); p++) {
      const x = fixture(100, p);
      await db.doc('homologated_lessons/' + x.id).set(x);
      await db.doc('homologated_parts/' + x.id).set({ id: x.id, day: 100, part: p, status: 'approved', version: 1, subject: 'S', review: 'ok', approvedBy: 'c' });
    }
    const v = await core.view(ceo, 'day_100_part_0');
    assert.equal(v.allowedDays.length, 100);
  }
});

await check('tester unaffected', async () => {
  const actor = { uid: 'tester-hard', emailVerified: true, provider: 'password' };
  await completeDay(actor, 1); await completeDay(actor, 2);
  await db.doc('tester_access/' + actor.uid).set({
    uid: actor.uid, source: 'invite_redemption', inviteId: '11111111-1111-4111-8111-111111111111',
    grantedAt: now - 1000, expiresAt: now + 99_000_000, revoked: false
  });
  assert.ok((await core.view(actor, 'day_3_part_0')).lesson);
});

await check('webhook unauth helpers reject before any write', async () => {
  const before = (await db.collection('processed_webhook_events').get()).size;
  await assert.rejects(() => assertPlayRtdnAuthorized({ headers: {}, body: {} }), /WEBHOOK_AUTH_UNAVAILABLE/);
  await assert.rejects(() => assertAppStoreWebhookAuthorized({ headers: {}, body: {} }), /WEBHOOK_AUTH_UNAVAILABLE/);
  // even with fake bearer, still unavailable until ITEM 11 implemented
  process.env.ATHENA_PLAY_RTDN_AUDIENCE = 'https://example.invalid/hook';
  process.env.ATHENA_PLAY_RTDN_SERVICE_ACCOUNT = 'pubsub@example.invalid';
  await assert.rejects(() => assertPlayRtdnAuthorized({ headers: { authorization: 'Bearer aaa.bbb.ccc' }, body: {} }), /WEBHOOK_AUTH_UNAVAILABLE/);
  delete process.env.ATHENA_PLAY_RTDN_AUDIENCE;
  delete process.env.ATHENA_PLAY_RTDN_SERVICE_ACCOUNT;
  assert.equal((await db.collection('processed_webhook_events').get()).size, before);
});

await check('default store verifier fails closed when env present but impl missing', async () => {
  process.env.ATHENA_PLAY_PACKAGE_NAME = 'br.app.athena';
  process.env.ATHENA_PLAY_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}';
  const v = createDefaultStoreVerifier();
  await assert.rejects(() => v({ platform: 'google_play', productId: 'p', purchaseToken: 't' }), /STORE_VERIFICATION_UNAVAILABLE/);
  delete process.env.ATHENA_PLAY_PACKAGE_NAME;
  delete process.env.ATHENA_PLAY_SERVICE_ACCOUNT_JSON;
});

const summary = { passed: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results };
writeFileSync('outputs/subscription-hardening-results.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
await deleteApp(app);
process.exit(summary.failed ? 1 : 0);
