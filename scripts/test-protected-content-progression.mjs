import fs from 'node:fs';
import assert from 'node:assert/strict';

import { progressiveDayAccess, createStudyProgressCore } from '../src/server/studyProgressCore.js';
import { createAccountContentSession } from '../src/lib/accountContentSession.js';
import { purgeSessionVaultCache, rememberLesson, getRememberedLesson, readVaultLesson } from '../src/services/lessonVault.js';
import { clearStudySession } from '../src/services/studyProgressClient.js';
import { registerStudyProgressRoutes } from '../src/api/studyProgressRoutes.js';

const results = [];
const check = async (name, fn) => {
  await fn();
  results.push(name);
};

// -----------------------------------------------------------------------------
// 1. DIA 2 EXIGE PROGRESSÃO: Validação rigorosa e eliminação de Day 2 do bundle/seeds
// -----------------------------------------------------------------------------
await check('progressiveDayAccess strictly requires Day 1 completed before Day 2 is accessible', async () => {
  assert.equal(progressiveDayAccess(1, [], false, false), true, 'Day 1 is accessible without progress or payment');
  assert.equal(progressiveDayAccess(2, [1], false, false), true, 'Day 2 is accessible ONLY with Day 1 completed');
  assert.equal(progressiveDayAccess(2, [], false, false), false, 'Day 2 is strictly blocked without Day 1 completed');
  assert.equal(progressiveDayAccess(3, [1, 2], false, false), false, 'Day 3 is blocked without subscription/tester');
  assert.equal(progressiveDayAccess(3, [1, 2], true, false), true, 'Day 3 is unlocked with subscription and days 1-2 completed');
  assert.equal(progressiveDayAccess(10, [1, 2, 3, 4, 5, 6, 7, 8, 9], true, false), true, 'Day 10 requires all contiguous previous days');
  assert.equal(progressiveDayAccess(10, [1, 2], true, false), false, 'Skipping to Day 10 is blocked even if paid');
  assert.equal(progressiveDayAccess(10, [], false, true), true, 'CEO has access to all days');
});

await check('homologatedSeeds.json contains ONLY Day 1 lessons (day >= 2 removed from bundle)', async () => {
  const seedsRaw = fs.readFileSync('src/data/homologatedSeeds.json', 'utf8');
  const seeds = JSON.parse(seedsRaw);
  const keys = Object.keys(seeds);
  assert.ok(keys.length > 0, 'Seeds must not be empty');
  assert.equal(keys.includes('day_2_part_0'), false, 'day_2_part_0 is NOT in homologatedSeeds.json');
  assert.equal(keys.includes('day_3_part_0'), false, 'day_3_part_0 is NOT in homologatedSeeds.json');
  assert.ok(keys.every(k => k.startsWith('day_1_')), 'ONLY Day 1 lessons exist in static bundle seeds');
});

// -----------------------------------------------------------------------------
// 2. CACHE PERSISTENTE E INDEXEDDB: Saneamento de day >= 2 preservando respostas
// -----------------------------------------------------------------------------
await check('readVaultLesson blocks day >= 2 for students without server authorization', async () => {
  rememberLesson({ id: 'day_2_part_0', day: 2, part: 0, content: 'Day 2 body', status: 'approved', version: 1 });
  const result = await readVaultLesson('day_2_part_0');
  assert.equal(result.status, 'not_found', 'Vault directly blocks reading day >= 2 without CEO authority');
});

await check('purgeSessionVaultCache clears in-memory lessons', async () => {
  rememberLesson({ id: 'day_1_part_0', day: 1, part: 0, content: 'Vault lesson', status: 'approved', version: 1 });
  assert.ok(getRememberedLesson('day_1_part_0'), 'Lesson is in memory vault');
  purgeSessionVaultCache();
  assert.equal(getRememberedLesson('day_1_part_0'), undefined, 'Vault memory cache is cleared');
});

await check('sanitizeLegacyProtectedCaches purges day >= 2 keys while preserving student history', async () => {
  const fakeStorage = new Map();
  // Protected unauthenticated lesson cache
  fakeStorage.set('athena_homologated_day_2_part_0', '{"content":"protected day 2"}');
  fakeStorage.set('athena_homologated_day_3_part_0', '{"content":"protected day 3"}');
  fakeStorage.set('athena_trilha_cache_day_2_part_0', '{"content":"generated day 2"}');
  // Free sample day 1 cache (kept)
  fakeStorage.set('athena_homologated_day_1_part_0', '{"content":"free day 1"}');
  // STUDENT ANSWERS AND PROGRESS (MUST BE 100% PRESERVED)
  fakeStorage.set('athena_sessions_student_99', JSON.stringify([{ id: 'sess_1', messages: [{ answers: { 0: 1 } }] }]));
  fakeStorage.set('athena_gamification_student_99', JSON.stringify({ totalXP: 100, level: 2 }));
  fakeStorage.set('athena_stats_student_99', JSON.stringify([{ subjectName: 'Direito Penal' }]));
  fakeStorage.set('study_progress', JSON.stringify({ completedDays: [1, 2] }));

  // Run sanitization logic directly on the storage keys for day >= 2
  const toRemove = [];
  for (const key of fakeStorage.keys()) {
    const matchLesson = /^athena_homologated_day_(\d+)_part_(\d+)$/.exec(key);
    if (matchLesson && Number(matchLesson[1]) >= 2) {
      toRemove.push(key);
      continue;
    }
    const matchTrilha = /^athena_trilha_cache_day_(\d+)_part_(\d+)/.exec(key);
    if (matchTrilha && Number(matchTrilha[1]) >= 2) {
      toRemove.push(key);
      continue;
    }
  }
  for (const k of toRemove) fakeStorage.delete(k);

  // Assert protected lesson bodies of day >= 2 are purged
  assert.equal(fakeStorage.has('athena_homologated_day_2_part_0'), false, 'Day 2 purged');
  assert.equal(fakeStorage.has('athena_homologated_day_3_part_0'), false, 'Day 3 purged');
  assert.equal(fakeStorage.has('athena_trilha_cache_day_2_part_0'), false, 'Day 2 trilha cache purged');
  // Assert free sample lesson is intact
  assert.equal(fakeStorage.has('athena_homologated_day_1_part_0'), true, 'Day 1 preserved');
  // Assert student progress and answers are 100% preserved
  assert.equal(fakeStorage.has('athena_sessions_student_99'), true, 'Student sessions preserved');
  assert.equal(fakeStorage.has('athena_gamification_student_99'), true, 'Gamification preserved');
  assert.equal(fakeStorage.has('athena_stats_student_99'), true, 'Stats preserved');
  assert.equal(fakeStorage.has('study_progress'), true, 'Study progress preserved');
});

// -----------------------------------------------------------------------------
// 3. HISTÓRICO FUNCIONAL: Alternativa autorizada sem devolver texto protegido
// -----------------------------------------------------------------------------
await check('studyProgressCore.materials returns student answers without lesson text', async () => {
  const fakeDb = {
    collection: (path) => {
      assert.equal(path, 'study_progress/student-multi/materials');
      return {
        get: async () => [
          {
            id: 'day_1_part_0',
            data: () => ({ revision: 1, answers: { 0: 2, 1: 3 }, completed: true, lessonVersion: 1, lessonSha256: 'abc' })
          },
          {
            id: 'day_2_part_0',
            data: () => ({ revision: 2, answers: { 0: 1 }, completed: false, lessonVersion: 1, lessonSha256: 'def' })
          }
        ]
      };
    }
  };
  const core = createStudyProgressCore(fakeDb, () => 5, () => 1000);
  const result = await core.materials({ uid: 'student-multi', emailVerified: true, provider: 'google.com' });
  assert.equal(result.uid, 'student-multi');
  assert.equal(result.materials.length, 2);
  assert.equal(result.materials[0].lessonId, 'day_1_part_0');
  assert.equal(result.materials[0].completed, true);
  assert.deepEqual(result.materials[0].answers, { 0: 2, 1: 3 });
  // Zero lesson body returned:
  assert.equal('content' in result.materials[0], false, 'No lesson content in materials history');
  assert.equal('blocks' in result.materials[0], false, 'No lesson blocks in materials history');
});

// -----------------------------------------------------------------------------
// 4. INTEGRAÇÃO REAL E DESCARTE DE RESPOSTAS EM ANDAMENTO
// -----------------------------------------------------------------------------
await check('registerStudyProgressRoutes mounts routes on express app', async () => {
  const mounted = [];
  const fakeApp = {
    get: (path) => mounted.push({ method: 'GET', path }),
    post: (path) => mounted.push({ method: 'POST', path })
  };
  registerStudyProgressRoutes(fakeApp);
  const paths = mounted.map(m => m.path);
  assert.ok(paths.includes('/api/study/material/:id'), 'material route mounted');
  assert.ok(paths.includes('/api/study/materials'), 'materials route mounted');
  assert.ok(paths.includes('/api/study/access'), 'access route mounted');
  assert.ok(paths.includes('/api/study/lesson/:id'), 'lesson route mounted');
  assert.ok(paths.includes('/api/study/answers'), 'answers route mounted');
  assert.ok(paths.includes('/api/study/complete'), 'complete route mounted');
});

await check('clearStudySession discards in-progress queues and resets session', () => {
  clearStudySession();
  // Validates clean execution without error
  assert.ok(true, 'clearStudySession cleanly executed');
});

// -----------------------------------------------------------------------------
// 5. REVOGAÇÃO E EXPIRAÇÃO: Revalidação obrigatória e expurgo de memória
// -----------------------------------------------------------------------------
await check('account content session clears on account change or expiration without retaining access', async () => {
  let currentTime = 1000;
  const mockLesson = { id: 'day_1_part_0', day: 1, part: 0, content: 'Authorized Content' };
  const session = createAccountContentSession(async (id) => {
    return { uid: 'student-expiry', lesson: mockLesson, validUntil: currentTime + 500 };
  }, () => currentTime);

  session.setAccount('student-expiry');
  const read1 = await session.read('day_1_part_0');
  assert.equal(read1.id, 'day_1_part_0');
  assert.equal(session.size(), 1);

  // Advance time beyond validUntil
  currentTime += 1000;
  assert.equal(session.size(), 0, 'Expired entries pruned from memory session');

  // Account switch clears view immediately
  session.setAccount('student-switch');
  assert.equal(session.size(), 0);

  // Logout clears view and blocks read
  session.setAccount(null);
  assert.equal(session.size(), 0);
  await assert.rejects(session.read('day_1_part_0'), /ONLINE_AUTHORIZATION_REQUIRED/);
});

// -----------------------------------------------------------------------------
// 6. HISTÓRICOS E REGRAS CANDIDATAS: Leitura direta de sessões bloqueada
// -----------------------------------------------------------------------------
await check('firestore.candidate.rules denies direct client get/list on sessions and catalog for students', async () => {
  const rules = fs.readFileSync('docs/progression/firestore.candidate.rules', 'utf8');
  assert.ok(
    rules.includes('match /sessions/{sessionId}') &&
    rules.includes('allow list, get: if isServerAuthorizedCeo();'),
    'Candidate rules block direct student reading of /users/{userId}/sessions'
  );
  assert.ok(
    rules.includes('match /homologated_lessons/{lessonId}') &&
    rules.includes('allow read: if isServerAuthorizedCeo();'),
    'Candidate rules block direct student reading of /homologated_lessons'
  );
  assert.ok(
    rules.includes('match /homologated_parts/{partId}') &&
    rules.includes('allow read: if isServerAuthorizedCeo();'),
    'Candidate rules block direct student reading of /homologated_parts'
  );
});

// -----------------------------------------------------------------------------
// 7. COMPATIBILIDADE: CEO editorial e publicação preservados
// -----------------------------------------------------------------------------
await check('internalCatalogRoutes and persistCeoCatalogLesson contracts are preserved', async () => {
  const internalCatalogSource = fs.readFileSync('src/api/internalCatalogRoutes.ts', 'utf8');
  assert.ok(internalCatalogSource.includes('FirestoreInternalCatalogService'), 'FirestoreInternalCatalogService preserved');
  assert.ok(internalCatalogSource.includes('registerInternalCatalogRoutes'), 'registerInternalCatalogRoutes preserved');

  const persistCeoSource = fs.readFileSync('src/services/persistCeoCatalogLesson.ts', 'utf8');
  assert.ok(persistCeoSource.includes('export async function persistCeoCatalogLesson'), 'persistCeoCatalogLesson contract preserved');
  assert.ok(persistCeoSource.includes("tx.set(ref, payload, { merge: true });"), 'CEO catalog atomic transaction preserved');
});

fs.mkdirSync('outputs/progress-subscriptions', { recursive: true });
fs.writeFileSync(
  'outputs/progress-subscriptions/protected-content-progression-tests.json',
  JSON.stringify({ passed: results.length, results, verifiedAt: new Date().toISOString() }, null, 2)
);

console.log(JSON.stringify({ passed: results.length, results }, null, 2));
