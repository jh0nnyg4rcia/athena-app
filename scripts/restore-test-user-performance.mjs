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

async function patchDoc(docRelativePath, fields) {
  const url = `${BASE_URL}/${docRelativePath}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields })
  });
  return res.status === 200;
}

async function run() {
  const backupDir = path.resolve('outputs/backups');
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith(`backup-${TARGET_UID}-`)).sort().reverse();
  if (!files.length) {
    throw new Error('Nenhum backup encontrado.');
  }
  const latestBackup = path.join(backupDir, files[0]);
  console.log(`Restaurando a partir de: ${latestBackup}`);
  const backup = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));

  let restored = 0;
  for (const [relPath, docData] of Object.entries(backup.documents)) {
    if (!relPath.includes(TARGET_UID)) continue;
    const ok = await patchDoc(relPath, docData.fields);
    if (ok) restored++;
  }
  console.log(`Restaurados com sucesso: ${restored}/${Object.keys(backup.documents).length}`);
}

run().catch(err => {
  console.error('[ERRO NA RESTAURAÇÃO]:', err);
  process.exit(1);
});
