// CLI apenas para emuladores locais. Não aceita endpoint/projeto de produção.
import { Firestore } from '@google-cloud/firestore';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSnapshotEmulatorReader, canonicalLessonId } from './question-snapshot-reader.mjs';
import { createQuestionSnapshotExporter } from '../src/services/questionSnapshotExport';
import { ATHENA_TARGET } from './publish-reviewed-questions.mjs';
import { createPreparedProductionSnapshotExporter, PRODUCTION_SNAPSHOT_READ_ENABLED } from '../src/services/questionSnapshotProduction';
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==5||!['--emulator','--production-read'].includes(args[0])||args[1]!=='--lesson'||args[3]!=='--out')throw Error('Argumentos de exportação inválidos');
 const id=canonicalLessonId(args[2]);
 if(args[0]==='--production-read'){
  if(!PRODUCTION_SNAPSHOT_READ_ENABLED)throw Error('Leitura real bloqueada');
  if(id!=='day_1_part_0'||process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('Contexto de leitura inválido');
  const token=process.env.ATHENA_SNAPSHOT_ADMIN_TOKEN;if(!token)throw Error('Sessão ausente');
  const app=initializeApp({projectId:ATHENA_TARGET.projectId},'snapshot-production');
  try{const result=await createPreparedProductionSnapshotExporter().exportLesson(`Bearer ${token}`,id);
   if(!result.ok){process.stdout.write(JSON.stringify(result,null,2)+'\n');process.exitCode=1;return;}
   mkdirSync(args[4]);writeFileSync(join(args[4],'snapshot.json'),JSON.stringify(result.snapshot,null,2)+'\n',{flag:'wx',mode:0o600});writeFileSync(join(args[4],'manifest.json'),JSON.stringify(result.manifest,null,2)+'\n',{flag:'wx',mode:0o600});process.stdout.write(JSON.stringify({ok:true,remoteWriteEnabled:false,lessonId:id})+'\n');
  }finally{await deleteApp(app);}return;
 }
 if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('Exige Firestore e Auth Emulators locais nos endpoints fixos');
 const token=process.env.ATHENA_SNAPSHOT_ADMIN_TOKEN;
 if(!token)throw Error('Sessão administrativa local ausente');
 const db=new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
 const app=initializeApp({projectId:'demo-athena-question-import'},'snapshot-local');
 try{
  const exporter=createQuestionSnapshotExporter({reader:createSnapshotEmulatorReader(db),verifyToken:async token=>{const u=await getAuth(app).verifyIdToken(token,true);return {uid:u.uid,email:u.email??'',emailVerified:u.email_verified===true};},authorizeRead:async (_uid,lessonId)=>lessonId===id});
  const result=await exporter.exportLesson(`Bearer ${token}`,id);
  if(!result.ok){process.stdout.write(JSON.stringify(result,null,2)+'\n');process.exitCode=1;return;}
  mkdirSync(args[4]); // Pasta nova obrigatória: nunca sobrescreve exportação anterior.
  writeFileSync(join(args[4],'snapshot.json'),JSON.stringify(result.snapshot,null,2)+'\n',{flag:'wx',mode:0o600});
  writeFileSync(join(args[4],'manifest.json'),JSON.stringify(result.manifest,null,2)+'\n',{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify({ok:true,importReady:true,remoteWriteEnabled:false,lessonId:id})+'\n');
 }finally{await db.terminate();await deleteApp(app);}
}
main().catch(()=>{process.stderr.write('Exportação recusada. Verifique argumentos, emuladores, sessão administrativa e pasta de saída nova. Nenhum erro de credencial foi registrado.\n');process.exitCode=1;});
