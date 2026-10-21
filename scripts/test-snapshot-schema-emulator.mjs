import test from 'node:test';import assert from 'node:assert/strict';
import {Firestore,Timestamp} from '@google-cloud/firestore';
import {syntheticFixture} from './revised-question-import-fixtures.mjs';
import {ATHENA_TARGET} from './publish-reviewed-questions.mjs';
import {createAdminEmulatorAdapter} from './admin-question-adapter.mjs';
import {createAdminOperations} from './admin-reviewed-questions-core.mjs';
import {diagnosticRecord} from './snapshot-diagnostics.mjs';
import {sha256,contentSha256,dryRun,embedded} from './import-reviewed-questions.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189')throw Error('Somente emulador fixo');
const db=new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
const cases=[
 ['LESSON_ID_MISSING',l=>delete l.id],['LESSON_VERSION_MISSING',l=>delete l.version],
 ['QUESTION_TEXT',l=>l.challenge.questions[0].explanation=42],
 ['CONTENT_MARKER',l=>l.content+='[ATHENA_CHALLENGE]'],
 ['BLOCKS_TYPE',l=>l.blocks=[{kind:'synthetic'}]],
 ['BLOCKS_MISMATCH',l=>l.blocks=Array(6).fill('synthetic')],
 ['FIRESTORE_TYPE',l=>l.updatedAt=new Timestamp(1,0)],
 ['SECTION_INDEX_FIELDS',()=>{}]
];
let part=0;
async function digest(){const result={};for(const c of ['homologated_lessons','legal_reviews','legal_review_index','question_import_backups','question_import_receipts','question_import_authorizations','question_import_restorations'])result[c]=(await db.collection(c).get()).docs.map(d=>[d.id,d.data(),d.updateTime.toMillis()]);return JSON.stringify(result);}
for(const [rule,mutate] of cases)test(`emulador esquema: ${rule}`,async()=>{
 const l=syntheticFixture().snapshot.lesson,id=`day_92_part_${part++}`;l.id=id;l.day=92;l.part=part-1;mutate(l);
 await db.collection('homologated_lessons').doc(id).create(l);
 if(rule==='SECTION_INDEX_FIELDS')await db.collection('legal_review_index').doc(`${id}_block_0`).create({lessonId:`${id}_block_0`,processingReviewId:null});
 const before=await digest();let reads=0;
 const scoped=Object.create(db);scoped.runTransaction=(callback,options)=>{assert.deepEqual(options,{readOnly:true});reads++;return db.runTransaction(callback,options);};
 const core=createAdminOperations({adapter:createAdminEmulatorAdapter(scoped,id),authenticate:async()=>({id:'synthetic',authorized:true}),confirm:async()=>assert.fail('confirmation')});
 await assert.rejects(core.snapshot(id),error=>{const record=diagnosticRecord(error);assert.equal(record.schema?.ruleCode,'ATHENA_SCHEMA_'+rule);assert.ok(['integrity','representations'].includes(record.stage));assert.ok(!JSON.stringify(record).includes('Justificativa original'));return true;});
 assert.equal(reads,1);assert.equal(await digest(),before);
});
for(const status of ['approved','rejected','pending_approval','queued','processing','failed','uncertain_failure','completed'])test(`emulador auditoria: ${status}`,async()=>{
 const f=syntheticFixture(),l=f.snapshot.lesson,id=`day_91_part_${part++}`;l.id=id;l.day=91;l.part=part-1;
 if(status==='completed'){const c=l.content,s=embedded(c);l.content=c.slice(0,c.indexOf('[ATHENA_CHALLENGE]'))+c.slice(s.end)+'\n[ATHENA_CHALLENGE]\n'+c.slice(s.start,s.end);}
 await db.collection('homologated_lessons').doc(id).create(l);
 const scope=`${id}_block_1`,record={lessonId:scope,status,extra:{preserve:'synthetic'}},reviewId=`synthetic-${id}`;
 // ID ausente no payload é legítimo: a identidade canônica vem do documento.
 await db.collection('legal_reviews').doc(reviewId).create(record);
 await db.collection('legal_review_index').doc(scope).create({lessonId:scope,processingReviewId:null,latestReviewId:reviewId,latestStatus:status});
 const core=createAdminOperations({adapter:createAdminEmulatorAdapter(db,id),authenticate:async()=>({id:'synthetic',authorized:true}),confirm:async()=>''}),before=await digest();
 const r=await core.snapshot(id,{auditOnly:true});assert.deepEqual(r.snapshot.lesson,l);assert.deepEqual(r.snapshot.sections[1].reviews[0],{...record,id:reviewId});assert.equal(r.snapshot.importReady,false);assert.equal(r.snapshot.publicationReady,false);assert.equal(r.manifest.snapshotSha256,sha256(r.snapshot));assert.equal(dryRun(r.snapshot,f.input).ok,false);
 assert.equal(r.snapshot.administrativeAssessment.conflictsPresent,!['approved','rejected'].includes(status));
 if(['approved','rejected'].includes(status))await core.snapshot(id);
 else{
  await assert.rejects(core.snapshot(id),e=>{assert.ok(diagnosticRecord(e).schema.violations.some(v=>v.field==='sections.1.reviews.0.status'));return true;});
  f.input.lessonId=id;f.input.originalContentSha256=contentSha256(l.content);f.input.originalLessonSha256=sha256(l);await assert.rejects(core.plan(f.input));
 }
 assert.equal(await digest(),before);assert.deepEqual((await db.collection('legal_reviews').doc(reviewId).get()).data(),record);
});
test('emulador auditoria: ID documental divergente continua bloqueado antes da exportação',async()=>{
 const l=syntheticFixture().snapshot.lesson;l.id='day_90_part_0';l.day=90;await db.collection('homologated_lessons').doc(l.id).create(l);
 await db.collection('legal_reviews').doc('synthetic-mismatched-id').create({id:'different',lessonId:`${l.id}_block_1`,status:'approved'});
 const before=await digest(),core=createAdminOperations({adapter:createAdminEmulatorAdapter(db,l.id),authenticate:async()=>({id:'synthetic',authorized:true}),confirm:async()=>''});await assert.rejects(core.snapshot(l.id,{auditOnly:true}));assert.equal(await digest(),before);
});
test.after(()=>db.terminate());
