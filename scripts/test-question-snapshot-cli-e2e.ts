import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,existsSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {Firestore} from '@google-cloud/firestore';
import {syntheticFixture} from './revised-question-import-fixtures.mjs';
import {sha256,contentSha256} from './import-reviewed-questions.mjs';
import {ATHENA_TARGET} from './publish-reviewed-questions.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('Somente ambos os emuladores locais');
const app=initializeApp({projectId:'demo-athena-question-import'},'snapshot-e2e');const auth=getAuth(app);
const db=new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
const folder=mkdtempSync(join(tmpdir(),'athena-cli-e2e-'));
async function session(email:string,verified=true){const user=await auth.createUser({email,emailVerified:verified,password:'Synthetic-Local-123!'});const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=synthetic-local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Synthetic-Local-123!',returnSecureToken:true})});const json:any=await response.json();assert.equal(response.ok,true);return {user,token:json.idToken as string};}
const collections=['homologated_lessons','legal_reviews','legal_review_index','question_import_backups','question_import_receipts','question_import_authorizations'];
async function digest(){const docs=await Promise.all(collections.map(async c=>[c,(await db.collection(c).get()).docs.map(d=>({id:d.id,data:d.data()})).sort((a,b)=>a.id.localeCompare(b.id))]));const users=await auth.listUsers();return sha256({docs,users:users.users.map(u=>u.toJSON()).sort((a:any,b:any)=>a.uid.localeCompare(b.uid))});}
function cli(token:string,out:string){return spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/export-question-snapshot.ts','--emulator','--lesson','day_1_part_0','--out',out],{encoding:'utf8',env:{...process.env,ATHENA_SNAPSHOT_ADMIN_TOKEN:token},timeout:20000});}
let ceo:any;
test('CLI E2E: Auth real de emulador, snapshot, manifesto, hashes e zero escritas',async()=>{
 const f=syntheticFixture();await db.collection('homologated_lessons').doc(f.input.lessonId).create(f.snapshot.lesson);ceo=await session('jhonny.spider@gmail.com');const before=await digest();const out=join(folder,'valid');const r=cli(ceo.token,out);assert.equal(r.status,0,r.stderr);assert.ok(!r.stdout.includes(ceo.token)&&!r.stderr.includes(ceo.token));
 const snapshot=JSON.parse(readFileSync(join(out,'snapshot.json'),'utf8')),manifest=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8'));assert.deepEqual(snapshot.lesson,f.snapshot.lesson);assert.equal(manifest.snapshotSha256,sha256(snapshot));assert.equal(manifest.originalContentSha256,contentSha256(snapshot.lesson.content));assert.equal(manifest.originalLessonSha256,sha256(snapshot.lesson));assert.equal(manifest.actorUid,ceo.user.uid);assert.equal(await digest(),before);
});
for(const kind of ['student','unverified','invalid','expired','revoked'])test(`CLI E2E rejeita ${kind} sem leitura/escrita autorizada`,async()=>{
 let token:string;if(kind==='student')token=(await session('student@example.invalid')).token;
 else if(kind==='unverified'){await auth.updateUser(ceo.user.uid,{emailVerified:false});token=(await sessionToken()).token;await auth.updateUser(ceo.user.uid,{emailVerified:true});}
 else if(kind==='invalid')token='invalid-no-secrets';
 else if(kind==='expired'){const parts=ceo.token.split('.');const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString());payload.exp=1;token=parts[0]+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url')+'.';}
 else{await new Promise(r=>setTimeout(r,1100));await auth.revokeRefreshTokens(ceo.user.uid);token=ceo.token;}
 const before=await digest(),out=join(folder,kind),r=cli(token,out);assert.notEqual(r.status,0);assert.equal(existsSync(out),false);assert.ok(!r.stdout.includes(token)&&!r.stderr.includes(token));assert.equal(await digest(),before);
});
async function sessionToken(){const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=synthetic-local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'jhonny.spider@gmail.com',password:'Synthetic-Local-123!',returnSecureToken:true})});const j:any=await response.json();return {token:j.idToken};}
test.after(async()=>{await db.terminate();await deleteApp(app);});
