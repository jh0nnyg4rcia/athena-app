import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { Firestore } from '@google-cloud/firestore';
import fs from 'node:fs';
import path from 'node:path';

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8197';

const PROJECT_ID = 'demo-athena-client-safe';

const app = getApps().find(a => a.name === 'demo-seeder') || initializeApp({ projectId: PROJECT_ID }, 'demo-seeder');
const auth = getAuth(app);
const db = new Firestore({
  projectId: PROJECT_ID,
  host: process.env.FIRESTORE_EMULATOR_HOST,
  ssl: false,
  credentials: { client_email: 'synthetic@example.invalid', private_key: 'unused-emulator' }
});

export async function seedEmulatorDemo() {
  console.log('[Seeder] Populando contas sinteticas no Auth Emulator...');
  
  // 1. Aluno Sintetico
  try {
    const existing = await auth.getUserByEmail('aluno.sintetico@athena.local');
    if (existing) await auth.deleteUser(existing.uid);
  } catch {}
  try { await auth.deleteUser('synthetic-student-01'); } catch {}
  await auth.createUser({
    uid: 'synthetic-student-01',
    email: 'aluno.sintetico@athena.local',
    password: 'AthenaDemo2026!',
    displayName: 'Aluno Sintético ATHENA',
    emailVerified: true
  });

  // 2. CEO Sintetico
  try {
    const existing = await auth.getUserByEmail('jhonny.spider@gmail.com');
    if (existing) await auth.deleteUser(existing.uid);
  } catch {}
  try { await auth.deleteUser('synthetic-ceo-01'); } catch {}
  await auth.createUser({
    uid: 'synthetic-ceo-01',
    email: 'jhonny.spider@gmail.com',
    password: 'AthenaDemo2026!',
    displayName: 'CEO Sintético ATHENA',
    emailVerified: true
  });

  // Vincular provedor google.com ao CEO sintetico via signInWithIdp
  const fakePayload = JSON.stringify({
    sub: 'synthetic-ceo-01',
    email: 'jhonny.spider@gmail.com',
    email_verified: true
  });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestUri: 'http://localhost:3000',
      postBody: 'id_token=' + encodeURIComponent(fakePayload) + '&providerId=google.com',
      returnSecureToken: true
    })
  });

  console.log('[Seeder] Populando documentos de controle no Firestore Emulator...');

  // 3. Documento de privilegio do CEO
  await db.doc('access_admins/synthetic-ceo-01').set({
    uid: 'synthetic-ceo-01',
    enabled: true,
    role: 'ceo'
  });

  // 4. Perfis de usuario
  await db.doc('users/synthetic-ceo-01').set({
    displayName: 'CEO Sintético ATHENA',
    email: 'jhonny.spider@gmail.com',
    role: 'ceo'
  });

  await db.doc('users/synthetic-student-01').set({
    displayName: 'Aluno Sintético ATHENA',
    email: 'aluno.sintetico@athena.local',
    role: 'student',
    reviewCounters: {
      day_1_part_0: {
        reviewId: 'day_1_part_0',
        count: 1,
        lastUpdatedAt: Date.now()
      }
    }
  });

  // 5. Aulas e partes homologadas do Dia 1
  const seedsPath = path.resolve('src/data/homologatedSeeds.json');
  if (fs.existsSync(seedsPath)) {
    const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
    for (let p = 0; p < 5; p++) {
      const id = `day_1_part_${p}`;
      const lesson = seeds[id];
      if (lesson) {
        await db.doc(`homologated_lessons/${id}`).set(lesson);
        await db.doc(`homologated_parts/${id}`).set({
          id,
          day: 1,
          part: p,
          status: 'approved',
          version: lesson.version || 1
        });
      }
    }
  }

  // 6. Marcacao pessoal de teste para o aluno no Dia 1 Parte 0
  await db.doc('personal_highlights/synthetic-student-01_day_1_part_0').set({
    uid: 'synthetic-student-01',
    lessonId: 'day_1_part_0',
    highlights: [{
      id: 'hl-demo-initial',
      uid: 'synthetic-student-01',
      lessonId: 'day_1_part_0',
      blockIndex: 0,
      color: 'yellow',
      selectedText: 'Art. 1º A República Federativa do Brasil, formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal',
      prefix: '',
      suffix: '',
      lessonVersion: 1,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }],
    updatedAt: Date.now()
  });

  console.log('[Seeder] Emulador Firestore e Auth populados com sucesso com contas sinteticas isoladas.');
}

if (process.argv[1]?.endsWith('seed-emulator-demo.mjs')) {
  seedEmulatorDemo().catch(err => {
    console.error('[Seeder Error]', err);
    process.exit(1);
  });
}
