import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {Firestore} from '@google-cloud/firestore';
import {syntheticFixture} from './revised-question-import-fixtures.mjs';
import {sha256,contentSha256} from './import-reviewed-questions.mjs';
import {ATHENA_TARGET} from './publish-reviewed-questions.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('Somente emuladores locais');
const app=initializeApp({projectId:'demo-athena-question-import'},'admin-cli-e2e');const auth=getAuth(app);
const db=new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
const folder=mkdtempSync(join(tmpdir(),'athena-admin-cli-'));let token:string;let plan:any;let receipt:any;const f=syntheticFixture();
f.snapshot.lesson.id='day_94_part_0';f.snapshot.lesson.day=94;f.input.lessonId=f.snapshot.lesson.id;f.input.originalLessonSha256=sha256(f.snapshot.lesson);f.input.originalContentSha256=contentSha256(f.snapshot.lesson.content);
function cli(args:string[],input=''){return spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/admin-reviewed-questions.mjs',...args,'--emulator'],{encoding:'utf8',input,env:{...process.env,ATHENA_SNAPSHOT_ADMIN_TOKEN:token},timeout:25000});}
const read=(dir:string,file:string)=>JSON.parse(readFileSync(join(folder,dir,file),'utf8'));
test('CLI administrativa E2E: snapshot e plan autenticados não modificam aula',async()=>{
 try{await auth.createUser({email:'jhonny.spider@gmail.com',emailVerified:true,password:'Synthetic-Local-123!'});}catch(e:any){if(e.code!=='auth/email-already-exists')throw e;}
 const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=synthetic-local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'jhonny.spider@gmail.com',password:'Synthetic-Local-123!',returnSecureToken:true})});token=(await response.json() as any).idToken;assert.ok(token);
 await db.collection('homologated_lessons').doc(f.input.lessonId).create(f.snapshot.lesson);
 let result=cli(['snapshot','--lesson',f.input.lessonId,'--out',join(folder,'snapshot')]);assert.equal(result.status,0,result.stderr);assert.deepEqual(read('snapshot','snapshot.json').lesson,f.snapshot.lesson);
 writeFileSync(join(folder,'input.json'),JSON.stringify(f.input));result=cli(['plan','--input',join(folder,'input.json'),'--out',join(folder,'plan')]);assert.equal(result.status,0,result.stderr);plan=read('plan','plan.json');assert.ok(plan.planSha256);assert.deepEqual((await db.collection('homologated_lessons').doc(f.input.lessonId).get()).data(),f.snapshot.lesson);
});
test('CLI administrativa E2E: publicação sem confirmação é recusada',()=>{const result=cli(['publish','--plan',join(folder,'plan','plan.json'),'--approval-reference','synthetic-human','--out',join(folder,'denied')],'RECUSAR\n');assert.notEqual(result.status,0);assert.ok(!result.stderr.includes(token));});
test('CLI administrativa E2E: publish e repetição produzem recibo verificável',()=>{const args=['publish','--plan',join(folder,'plan','plan.json'),'--approval-reference','synthetic-human','--out',join(folder,'published')];let result=cli(args,`PUBLICAR ${f.input.lessonId} ${plan.planSha256}\n`);assert.equal(result.status,0,result.stderr);receipt=read('published','receipt.json');const {receiptSha256,...body}=receipt;assert.equal(receiptSha256,sha256(body));args[args.length-1]=join(folder,'repeated');result=cli(args,`PUBLICAR ${f.input.lessonId} ${plan.planSha256}\n`);assert.equal(result.status,0,result.stderr);assert.deepEqual(read('repeated','receipt.json'),receipt);});
test('CLI administrativa E2E: restore exige confirmação e recupera documento integral',async()=>{const args=['restore','--receipt',join(folder,'published','receipt.json'),'--approval-reference','synthetic-restore','--out',join(folder,'restore-denied')];assert.notEqual(cli(args,'RECUSAR\n').status,0);args[args.length-1]=join(folder,'restored');const result=cli(args,`RESTAURAR ${f.input.lessonId} ${receipt.receiptSha256}\n`);assert.equal(result.status,0,result.stderr);assert.deepEqual((await db.collection('homologated_lessons').doc(f.input.lessonId).get()).data(),f.snapshot.lesson);});
test('CLI administrativa E2E: token inválido é rejeitado',()=>{token='synthetic-invalid';const result=cli(['snapshot','--lesson',f.input.lessonId,'--out',join(folder,'invalid')]);assert.notEqual(result.status,0);});
test('CLI diagnóstico E2E: configuração e autenticação são distinguidas',()=>{
 let result=cli(['snapshot','--lesson','invalid','--out',join(folder,'bad-id')]);
 // Credencial inválida é recusada antes de qualquer consulta.
 assert.match(result.stderr,/ATHENA_SNAPSHOT_AUTHENTICATION/);
 result=cli(['snapshot','--unknown','x','--out',join(folder,'bad-flag')]);assert.match(result.stderr,/ATHENA_SNAPSHOT_CONFIG/);
});
test('CLI diagnóstico E2E: inexistente, challenge ausente e divergência sem escrita',async()=>{
 const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=synthetic-local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'jhonny.spider@gmail.com',password:'Synthetic-Local-123!',returnSecureToken:true})});token=(await response.json() as any).idToken;
 const collections=['homologated_lessons','legal_reviews','legal_review_index','question_import_backups','question_import_receipts','question_import_authorizations','question_import_restorations'];
 const digest=async()=>sha256(await Promise.all(collections.map(async c=>[c,(await db.collection(c).get()).docs.map(d=>({id:d.id,data:d.data()})).sort((a,b)=>a.id.localeCompare(b.id))])));
 for(const [part,kind,code]of [[0,'missing','NOT_FOUND'],[1,'challenge','FORMAT'],[2,'blocks','DIVERGENCE'],[3,'timestamp','FORMAT']] as const){
  const lesson=structuredClone(f.snapshot.lesson);lesson.id=`day_93_part_${part}`;lesson.day=93;lesson.part=part;
  if(kind==='challenge')delete lesson.challenge;if(kind==='blocks')lesson.blocks=Array(6).fill('divergent');
  if(kind==='timestamp')lesson.extraDate=new Date();
  if(kind!=='missing')await db.collection('homologated_lessons').doc(lesson.id).create(lesson);
  const before=await digest(),result=cli(['snapshot','--lesson',lesson.id,'--out',join(folder,'diagnostic-'+kind)]);
  assert.notEqual(result.status,0);assert.match(result.stderr,new RegExp('ATHENA_SNAPSHOT_'+code));assert.ok(!result.stderr.includes(token));assert.equal(await digest(),before);
 }
});
test('CLI auditoria: pendência preservada, artefato distinto e publicação recusada',async()=>{
 const lesson=structuredClone(f.snapshot.lesson);lesson.id='day_89_part_0';lesson.day=89;const scope=lesson.id+'_block_1';
 await db.collection('homologated_lessons').doc(lesson.id).create(lesson);
 const review={lessonId:scope,status:'pending_approval',legacyMetadata:{preserve:true}};
 await db.collection('legal_reviews').doc('synthetic-cli-pending').create(review);
 const before=sha256((await db.collection('legal_reviews').get()).docs.map(d=>[d.id,d.data()]));
 const result=cli(['snapshot','--audit-only','--lesson',lesson.id,'--out',join(folder,'audit')]);assert.equal(result.status,0,result.stderr);
 assert.ok(!result.stdout.includes(token));assert.ok(!result.stderr.includes(token));
 const snapshot=read('audit','snapshot.json'),manifest=read('audit','manifest.json');
 assert.equal(snapshot.schemaVersion,'athena-question-audit-snapshot/v1');assert.equal(snapshot.importReady,false);assert.equal(snapshot.publicationReady,false);assert.equal(manifest.snapshotSha256,sha256(snapshot));assert.deepEqual(snapshot.sections[1].reviews[0],{...review,id:'synthetic-cli-pending'});assert.equal(snapshot.administrativeAssessment.conflictsPresent,true);
 const strict=cli(['snapshot','--lesson',lesson.id,'--out',join(folder,'audit-strict')]);assert.notEqual(strict.status,0);assert.match(strict.stderr,/ATHENA_SCHEMA_REVIEW_RECORD_STATUS_PENDING/);assert.ok(!strict.stderr.includes('Justificativa original'));
 const input=structuredClone(f.input);input.lessonId=lesson.id;input.originalLessonSha256=sha256(lesson);writeFileSync(join(folder,'audit-input.json'),JSON.stringify(input));
 const denied=cli(['plan','--input',join(folder,'audit-input.json'),'--out',join(folder,'audit-plan-denied')]);assert.notEqual(denied.status,0);
 assert.equal(sha256((await db.collection('legal_reviews').get()).docs.map(d=>[d.id,d.data()])),before);assert.deepEqual((await db.collection('homologated_lessons').doc(lesson.id).get()).data(),lesson);
});
test.after(async()=>{await db.terminate();await deleteApp(app);});
