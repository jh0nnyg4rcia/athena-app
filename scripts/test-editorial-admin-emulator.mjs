import test from 'node:test';
import assert from 'node:assert/strict';
import {Firestore} from '@google-cloud/firestore';
import {sha256,contentSha256} from './import-reviewed-questions.mjs';
import {convertApprovedEditorialDraft} from './editorial-transfer.mjs';
import {ATHENA_TARGET} from './publish-reviewed-questions.mjs';
import {createAdminEmulatorAdapter} from './admin-question-adapter.mjs';
import {createAdminOperations} from './admin-reviewed-questions-core.mjs';
import {hashCatalogSnapshot} from '../src/services/legalReviewRepository.ts';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189')throw Error('Local named emulator required');
const db=new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
const fieldLists=[
 '1:explanation,3:options[1],3:explanation,4:explanation,5:explanation,6:text,6:explanation,8:explanation',
 '0:explanation,3:explanation,5:explanation,7:explanation,8:explanation,9:options[2],9:explanation',
 '0:text,0:explanation,3:explanation,4:explanation,5:text,5:explanation,7:options[1],7:explanation,9:text',
 '0:options[2],0:explanation,1:explanation,2:options[0],2:explanation,3:options[0],3:explanation,4:options[0],4:options[1],4:options[3],4:explanation,5:explanation,6:explanation,8:text,8:options[0],8:explanation,9:explanation',
 '0:options[1],0:options[3],0:explanation,1:options[1],1:explanation,3:explanation,4:explanation,5:text,5:options[0],5:explanation,6:options[1],6:explanation,7:text,7:options[1],7:explanation,8:explanation,9:options[0],9:explanation'
];
const at=new Date().toISOString(),reference='Synthetic CEO current editorial decision',created=[];
function make(part){
 const id=`day_1_part_${part}`,questions=Array.from({length:10},(_,i)=>({text:`Synthetic question ${i}`,options:['A','B','C','D'],correctIndex:i%4,explanation:`Synthetic explanation ${i}`}));
 const lesson={id,day:1,part,status:'approved',subject:'Synthetic',version:1,approvedAt:1,metadata:{preserve:true},challenge:{questions}};
 lesson.content=Array.from({length:6},(_,i)=>`${part===2&&i===3?'':`[BLOCK_${i+1}]`}\nSynthetic theory ${i}\n${i===4?'[ATHENA_CHALLENGE]\n'+JSON.stringify(lesson.challenge,null,2):''}`).join('\n');
 if(part!==0)lesson.blocks=Array.from({length:6},(_,i)=>`Synthetic older theory ${i}`);
 const editorial={format:'athena-editorial-transfer/v1',lessonId:id,subject:'Synthetic',sourceVersion:1,originalQuestions:structuredClone(questions),revisedQuestions:structuredClone(questions),approvedChanges:[]};
 for(const leaf of fieldLists[part].split(',')){const [s,field]=leaf.split(':'),i=+s,option=/options\[(\d+)\]/.exec(field);if(option)editorial.revisedQuestions[i].options[+option[1]]+=' external';else editorial.revisedQuestions[i][field]+=' external\n\nLiteral formatting';editorial.approvedChanges.push({questionIndex:i,field:option?'options':field,...(option?{optionIndex:+option[1]}:{}),approvalStatus:part<3?'pending':'approved',reason:'Synthetic approved change'});}
 const raw=JSON.stringify(editorial),approval=part<3?{schemaVersion:'athena-editorial-human-approval/v1',lessonId:id,fileSha256:contentSha256(raw),fields:fieldLists[part].split(',').map(f=>f.replace(':','.')),approvalReference:reference,recordedAt:at,authorization:'editorial-only'}:null;
 const audit={reference:'Synthetic',approvedBy:'Synthetic audit',approvedAt:at,approvalReference:reference,sources:['https://example.invalid/fixture']};
 const input=convertApprovedEditorialDraft(raw,{lesson},audit,{editorialApproval:approval??undefined});
 return{lesson,input,context:{raw,approval,externalApprovalReference:reference}};
}
async function seed(part){const f=make(part),ref=db.collection('homologated_lessons').doc(f.lesson.id);await ref.create(f.lesson);
 const internal=structuredClone(f.lesson.challenge);internal.questions[3].options[1]='Internal B';internal.questions[3].explanation='Internal explanation 3';
 const scope=part===0?f.lesson.id:`${f.lesson.id}_block_1`,review={id:`synthetic_external_${part}`,lessonId:scope,status:'pending_approval',originalContent:part===0?f.lesson.content:'Synthetic independent theory',reviewedMarkdown:part===0?f.lesson.content.replace(JSON.stringify(f.lesson.challenge,null,2),JSON.stringify(internal,null,2)):'Synthetic independent reviewed theory',originalHash:hashCatalogSnapshot(f.lesson)};
 await db.collection('legal_reviews').doc(review.id).create(review);await db.collection('legal_review_index').doc(scope).create({lessonId:scope,processingReviewId:null,processingStartedAt:null,latestReviewId:review.id,latestStatus:review.status});
 const adapter=createAdminEmulatorAdapter(db,f.lesson.id),core=createAdminOperations({adapter,authenticate:async()=>({id:'synthetic_admin',authorized:true}),confirm:async c=>c.expected});return{...f,ref,adapter,core,review};}
for(let part=0;part<5;part++)test(`administrative editorial ${part}: plan, publish, backup, repeat and restore`,async()=>{
 const f=await seed(part);created[part]=f;const original=await f.adapter.readState(f.lesson.id),plan=await f.core.plan(f.input,{editorialContext:f.context});
 assert.equal(plan.publication.compatibility.changedQuestionFields.length,[8,7,9,17,18][part]);assert.deepEqual((await f.ref.get()).data(),f.lesson);
 const receipt=await f.core.publish(plan,'Synthetic operational confirmation');assert.equal(receipt.publication.externalPolicy,'external-approved-question-leaves/v1');
 const proposed=(await f.ref.get()).data();assert.deepEqual(proposed,plan.publication.proposed);assert.deepEqual(proposed.blocks,f.lesson.blocks);assert.deepEqual(proposed.metadata,f.lesson.metadata);
 assert.ok(proposed.challenge.questions.every((q,i)=>q.correctIndex===f.lesson.challenge.questions[i].correctIndex));assert.deepEqual((await db.collection('legal_reviews').doc(f.review.id).get()).data(),f.review);
 assert.deepEqual((await f.adapter.readBackup(receipt.publication.backupId)).state,original);assert.deepEqual(await f.core.publish(plan,'Synthetic operational confirmation'),receipt);
 if(part===0){assert.equal(receipt.publication.externalDivergences[0].conflictingFields.length,2);assert.equal(receipt.publication.externalDivergences[0].staleWholeLessonApprovalBlocked,true);}
 await f.core.restore(receipt,'Synthetic restoration confirmation');assert.deepEqual((await f.ref.get()).data(),f.lesson);assert.equal((await f.core.restore(receipt,'Synthetic restoration confirmation')).repeated,true);
});
test('editorial approvals and changed files cannot be substituted',async()=>{const f=created[1],context=structuredClone(f.context);context.raw+=' ';await assert.rejects(f.core.plan(f.input,{editorialContext:context}),/EVIDENCE/);context.raw=f.context.raw;context.approval.fields=[];await assert.rejects(f.core.plan(f.input,{editorialContext:context}),/FIELDS/);const changed=structuredClone(f.input);changed.questions[0].revised.correctIndex=1;await assert.rejects(f.core.plan(changed,{editorialContext:f.context}),/DIVERGENCE/);});
test('administrative external plan fails on updateTime-only conflict',async()=>{const f=created[2],plan=await f.core.plan(f.input,{editorialContext:f.context});await f.ref.update({version:2});await f.ref.update({version:1});await assert.rejects(f.core.publish(plan,'Synthetic conflict confirmation'),/Conflito/);assert.deepEqual((await f.ref.get()).data(),f.lesson);});
test('administrative external confirmation denial has no write',async()=>{const f=created[3],plan=await f.core.plan(f.input,{editorialContext:f.context}),before=sha256(await f.adapter.readState(f.lesson.id)),denied=createAdminOperations({adapter:f.adapter,authenticate:async()=>({id:'synthetic_admin',authorized:true}),confirm:async()=>''});await assert.rejects(denied.publish(plan,'Synthetic denied'),/Confirmação/);assert.equal(sha256(await f.adapter.readState(f.lesson.id)),before);});
test('administrative external concurrent plans allow one commit and reject late restore',async()=>{const f=created[4],p=await f.core.plan(f.input,{editorialContext:f.context}),q=await f.core.plan(f.input,{editorialContext:f.context});const outcomes=await Promise.allSettled([f.core.publish(p,'Synthetic competing A'),f.core.publish(q,'Synthetic competing B')]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);const receipt=outcomes.find(r=>r.status==='fulfilled').value;await f.ref.update({topic:'Synthetic later change'});await assert.rejects(f.core.restore(receipt,'Synthetic late restore'),/posterior/);});
test('editorial CLI E2E uses verified Auth Emulator identity and existing confirmation',{skip:process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099'},async()=>{
 const f=created[0],folder=mkdtempSync(join(tmpdir(),'athena-editorial-cli-')),app=initializeApp({projectId:'demo-athena-question-import'},'editorial-cli-test');
 try{try{await getAuth(app).createUser({email:'jhonny.spider@gmail.com',emailVerified:true,password:'Synthetic-Local-123!'});}catch(e){if(e.code!=='auth/email-already-exists')throw e;}
 const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=synthetic-local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'jhonny.spider@gmail.com',password:'Synthetic-Local-123!',returnSecureToken:true})}),token=(await r.json()).idToken;assert.ok(token);
 const save=(name,value)=>writeFileSync(join(folder,name),typeof value==='string'?value:JSON.stringify(value));save('input.json',f.input);save('editorial.json',f.context.raw);save('approval.json',f.context.approval);
 const cli=(args,input='')=>spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/admin-reviewed-questions.mjs',...args,'--emulator'],{encoding:'utf8',input,env:{...process.env,ATHENA_SNAPSHOT_ADMIN_TOKEN:token},timeout:25000});
 let result=cli(['plan','--input',join(folder,'input.json'),'--editorial-file',join(folder,'editorial.json'),'--editorial-approval',join(folder,'approval.json'),'--external-reference',reference,'--out',join(folder,'plan')]);assert.equal(result.status,0,result.stderr);const plan=JSON.parse(readFileSync(join(folder,'plan/plan.json')));
 result=cli(['publish','--plan',join(folder,'plan/plan.json'),'--approval-reference','Synthetic CLI operational','--out',join(folder,'denied')],'DENY\n');assert.notEqual(result.status,0);
 result=cli(['publish','--plan',join(folder,'plan/plan.json'),'--approval-reference','Synthetic CLI operational','--out',join(folder,'published')],`PUBLICAR ${f.lesson.id} ${plan.planSha256}\n`);assert.equal(result.status,0,result.stderr);const receipt=JSON.parse(readFileSync(join(folder,'published/receipt.json')));
 result=cli(['restore','--receipt',join(folder,'published/receipt.json'),'--approval-reference','Synthetic CLI restore','--out',join(folder,'restored')],`RESTAURAR ${f.lesson.id} ${receipt.receiptSha256}\n`);assert.equal(result.status,0,result.stderr);assert.deepEqual((await f.ref.get()).data(),f.lesson);assert.ok(!result.stderr.includes(token));
 }finally{await deleteApp(app);}
});
test.after(()=>db.terminate());
