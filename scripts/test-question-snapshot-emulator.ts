import test from 'node:test';
import assert from 'node:assert/strict';
import { Firestore } from '@google-cloud/firestore';
import { createQuestionSnapshotExporter } from '../src/services/questionSnapshotExport';
import { createSnapshotEmulatorReader } from './question-snapshot-reader.mjs';
import { syntheticFixture } from './revised-question-import-fixtures.mjs';
import { embedded } from './import-reviewed-questions.mjs';
import { ATHENA_TARGET } from './publish-reviewed-questions.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189')throw Error('Somente emulador local');
const db=new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
const reader=createSnapshotEmulatorReader(db);
const options={reader,verifyToken:async()=>({uid:'synthetic-ceo',email:'jhonny.spider@gmail.com',emailVerified:true}),authorizeRead:async()=>true};
let part=0;
for(const kind of ['valid','missing','legacy','no-challenge','divergent','pending','unauthorized','invalid-id','wrong-db'])test(`snapshot emulador: ${kind}`,async()=>{
 const f=syntheticFixture(),l:any=f.snapshot.lesson; l.id=`day_97_part_${part++}`;l.day=97;l.part=part-1;
 if(kind==='legacy'){const c=l.content,s=embedded(c);l.content=c.slice(0,c.indexOf('[ATHENA_CHALLENGE]'))+c.slice(s.end)+'\n[ATHENA_CHALLENGE]\n'+c.slice(s.start,s.end);}
 if(kind==='no-challenge')delete l.challenge;if(kind==='divergent')l.challenge.questions[0].text+=' x';
 const ref=db.collection('homologated_lessons').doc(l.id);
 // Somente preparação de fixtures sintéticas: fora do exportador.
 if(kind!=='missing')await ref.create(l);
 if(kind==='pending')await db.collection('legal_reviews').doc(`snapshot-${l.id}`).create({lessonId:`${l.id}_block_0`,status:'pending'});
 const before=(await ref.get()).data();
 const collections=['homologated_lessons','legal_reviews','legal_review_index','question_import_backups','question_import_receipts','question_import_authorizations'];
 const counts=await Promise.all(collections.map(c=>db.collection(c).get().then(s=>s.size)));
 if(kind==='wrong-db'){assert.throws(()=>createSnapshotEmulatorReader({projectId:db.projectId,databaseId:'(default)',_settings:db._settings}));return;}
 const exporter=createQuestionSnapshotExporter({...options,authorizeRead:async()=>kind!=='unauthorized'});
 if(kind==='unauthorized'||kind==='invalid-id')await assert.rejects(exporter.exportLesson('Bearer synthetic',kind==='invalid-id'?'day_0_part_0':l.id));
 else {const r=await exporter.exportLesson('Bearer synthetic',l.id);assert.equal(r.ok,['valid','legacy'].includes(kind));if(r.ok){assert.deepEqual(r.snapshot?.lesson,l);assert.equal(r.manifest?.provenance.length,8);assert.equal(r.manifest?.target.databaseId,ATHENA_TARGET.databaseId);}else assert.equal('snapshot'in r,false);}
 assert.deepEqual((await ref.get()).data(),before);
 assert.deepEqual(await Promise.all(collections.map(c=>db.collection(c).get().then(s=>s.size))),counts,'exportador não escreve documentos');
});
test.after(async()=>{await db.terminate();});

