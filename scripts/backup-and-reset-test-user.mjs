import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const TARGET_UID = (process.argv.find(a => a.startsWith('--uid='))?.slice(6) || process.env.ATHENA_TARGET_UID || '').trim();
if (!/^[A-Za-z0-9]{20,128}$/.test(TARGET_UID)) {
  console.error('Informe o UID alvo: --uid=<UID> ou ATHENA_TARGET_UID=<UID>. Nenhum UID padrão é usado.');
  process.exit(2);
}
const PROJECT_ID = 'gen-lang-client-0822763072';
const DATABASE_ID = 'ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

const token = execSync('cmd.exe /c gcloud auth print-access-token', { encoding: 'utf8' }).trim();
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function getDoc(docPath) {
  const res = await fetch(`${BASE_URL}/${docPath}`, { headers });
  if (res.status === 200) {
    return await res.json();
  }
  return null;
}

async function listDocs(parentPath) {
  const documents = [];
  let pageToken = '';
  do {
    const url = `${BASE_URL}/${parentPath}${pageToken ? `?pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { headers });
    if (res.status === 200) {
      const data = await res.json();
      if (data.documents && data.documents.length) {
        documents.push(...data.documents);
      }
      pageToken = data.nextPageToken || '';
    } else {
      break;
    }
  } while (pageToken);
  return documents;
}

async function deleteDoc(docRelativePath) {
  // docRelativePath: e.g. "study_progress/<UID>"
  const url = `${BASE_URL}/${docRelativePath}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  return res.status === 200 || res.status === 204;
}

async function run() {
  console.log(`=== ATHENA: BACKUP E RESET CONTROLADO DO ALUNO DE TESTE [${TARGET_UID}] ===\n`);

  // 1. Verificação estrita de identidade
  const userDoc = await getDoc(`users/${TARGET_UID}`);
  if (!userDoc) {
    throw new Error(`Usuário ${TARGET_UID} não encontrado.`);
  }
  const email = userDoc.fields?.email?.stringValue;
  console.log(`[1] Usuário confirmado: UID=${TARGET_UID}, Email=${email}`);

  // 2. Coleta integral dos registros de desempenho exclusivos deste UID
  console.log(`[2] Coletando registros de desempenho exclusivos...`);
  const backup = {
    uid: TARGET_UID,
    email,
    timestamp: Date.now(),
    isoDate: new Date().toISOString(),
    documents: {}
  };

  // 2a. study_progress
  const studyProgress = await getDoc(`study_progress/${TARGET_UID}`);
  if (studyProgress) backup.documents[`study_progress/${TARGET_UID}`] = studyProgress;

  const materials = await listDocs(`study_progress/${TARGET_UID}/materials`);
  materials.forEach(doc => {
    const relPath = doc.name.split('/documents/')[1];
    backup.documents[relPath] = doc;
  });

  const requests = await listDocs(`study_progress/${TARGET_UID}/requests`);
  requests.forEach(doc => {
    const relPath = doc.name.split('/documents/')[1];
    backup.documents[relPath] = doc;
  });

  // 2b. users subcollections
  const stats = await listDocs(`users/${TARGET_UID}/stats`);
  stats.forEach(doc => {
    const relPath = doc.name.split('/documents/')[1];
    backup.documents[relPath] = doc;
  });

  const gami = await getDoc(`users/${TARGET_UID}/gamification/status`);
  if (gami) backup.documents[`users/${TARGET_UID}/gamification/status`] = gami;

  const failed = await listDocs(`users/${TARGET_UID}/failed_questions`);
  failed.forEach(doc => {
    const relPath = doc.name.split('/documents/')[1];
    backup.documents[relPath] = doc;
  });

  const sessions = await listDocs(`users/${TARGET_UID}/sessions`);
  sessions.forEach(doc => {
    const relPath = doc.name.split('/documents/')[1];
    backup.documents[relPath] = doc;
  });

  const schedules = await listDocs(`users/${TARGET_UID}/schedules`);
  schedules.forEach(doc => {
    const relPath = doc.name.split('/documents/')[1];
    backup.documents[relPath] = doc;
  });

  const trilhaProgress = await getDoc(`users/${TARGET_UID}/trilha/progress`);
  if (trilhaProgress) backup.documents[`users/${TARGET_UID}/trilha/progress`] = trilhaProgress;

  const docCount = Object.keys(backup.documents).length;
  console.log(`Total de documentos de desempenho identificados: ${docCount}`);

  // 3. Gravar e verificar backup local
  const backupDir = path.resolve('outputs/backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `backup-${TARGET_UID}-${backup.timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');

  // Validação do arquivo gravado
  const written = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  if (Object.keys(written.documents).length !== docCount) {
    throw new Error('Falha na integridade do backup gravado em disco.');
  }
  console.log(`[3] Backup verificado com sucesso (${docCount} documentos gravados em ${backupFile})`);

  // 4. Executar reset estrito e individual dos documentos de desempenho
  console.log(`[4] Executando exclusão controlada dos ${docCount} registros de desempenho...`);
  let deletedCount = 0;
  for (const relPath of Object.keys(backup.documents)) {
    // Verificação de segurança: garantir que NENHUM caminho de aula ou outro usuário seja tocado
    if (!relPath.includes(TARGET_UID)) {
      throw new Error(`Abortado: caminho ${relPath} não contém o UID alvo!`);
    }
    if (relPath.includes('homologated') || relPath.includes('access_admins') || relPath.includes('catalog')) {
      throw new Error(`Abortado: tentativa inadmissível de acessar conteúdo educacional/administrativo (${relPath})!`);
    }
    const ok = await deleteDoc(relPath);
    if (ok) deletedCount++;
  }
  console.log(`Documentos excluídos com sucesso: ${deletedCount}/${docCount}`);

  // 5. Inicializar gamification e progresso em estado virgem
  console.log(`[5] Inicializando gamification em estado virgem...`);
  const initGamiRes = await fetch(`${BASE_URL}/users/${TARGET_UID}/gamification?documentId=status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        totalXP: { integerValue: '0' },
        level: { integerValue: '1' },
        streak: { integerValue: '0' },
        lastActive: { integerValue: String(Date.now()) }
      }
    })
  });
  console.log('Gamification inicializado status HTTP:', initGamiRes.status);

  // 6. Verificação pós-reset por leitura direta
  console.log(`[6] Verificação final pós-reset...`);
  const postStudyProgress = await getDoc(`study_progress/${TARGET_UID}`);
  const postMaterials = await listDocs(`study_progress/${TARGET_UID}/materials`);
  const postStats = await listDocs(`users/${TARGET_UID}/stats`);
  const postSessions = await listDocs(`users/${TARGET_UID}/sessions`);
  const postFailed = await listDocs(`users/${TARGET_UID}/failed_questions`);
  const postGami = await getDoc(`users/${TARGET_UID}/gamification/status`);

  console.log('--- ESTADO FINAL DO ALUNO DE TESTE ---');
  console.log(`study_progress existe: ${!!postStudyProgress}`);
  console.log(`materials restantes: ${postMaterials.length}`);
  console.log(`stats restantes: ${postStats.length}`);
  console.log(`sessions restantes: ${postSessions.length}`);
  console.log(`failed_questions restantes: ${postFailed.length}`);
  console.log(`totalXP pós-reset: ${postGami?.fields?.totalXP?.integerValue || 0}`);
  console.log(`level pós-reset: ${postGami?.fields?.level?.integerValue || 1}`);

  if (postMaterials.length === 0 && postStats.length === 0 && postSessions.length === 0 && postFailed.length === 0) {
    console.log('\n>>> SUCESSO: RESET CONTROLADO CONCLUÍDO COM SUCESSO E COMPLETA ISOLAMENTO <<<');
  } else {
    throw new Error('Inconsistência encontrada na verificação pós-reset.');
  }
}

run().catch(err => {
  console.error('[ERRO NO RESET]:', err);
  process.exit(1);
});
