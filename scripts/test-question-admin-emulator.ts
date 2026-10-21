import test from 'node:test';
import assert from 'node:assert/strict';
import { Firestore } from '@google-cloud/firestore';
import { createQuestionImportAdmin, verifyExistingAthenaAdminToken } from '../src/services/questionImportAdmin';
import { syntheticFixture } from './revised-question-import-fixtures.mjs';
import { sha256 } from './import-reviewed-questions.mjs';
import { ATHENA_TARGET, createEmulatorFirestoreAdapter } from './publish-reviewed-questions.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8189') throw Error('Somente emulador local explícito');
const db = new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
const read = async (collection:string,id:string) => (await db.collection(collection).doc(id).get()).data();
const admin = createQuestionImportAdmin({adapter:createEmulatorFirestoreAdapter(db),verifyToken:async token => {
  if(!['ceo-token','other-token'].includes(token)) throw Error('Token sintético inválido');
  return {uid:token==='ceo-token'?'ceo-synthetic':'other-synthetic',email:'jhonny.spider@gmail.com',emailVerified:true};
},records:{
  createPreview:async(id,data)=>{await db.collection('question_import_previews').doc(id).create(data as object);},readPreview:id=>read('question_import_previews',id),
  createApproval:async(id,data)=>{await db.collection('question_import_approvals').doc(id).create(data as object);},readApproval:id=>read('question_import_approvals',id)
}});
test('Emulador: backend emite aprovação no servidor e registra consumo/identidade atomicamente',async()=>{
  const f=syntheticFixture();f.snapshot.lesson.id='day_98_part_0';f.snapshot.lesson.day=98;f.input.lessonId=f.snapshot.lesson.id;f.input.originalLessonSha256=sha256(f.snapshot.lesson);
  await db.collection('homologated_lessons').doc(f.input.lessonId).create(f.snapshot.lesson);
  const p=await admin.preview('Bearer ceo-token',f.input);
  await assert.rejects(admin.approve('Bearer other-token',p.previewId,p.plan.planSha256));
  const a=await admin.approve('Bearer ceo-token',p.previewId,p.plan.planSha256);
  await assert.rejects(admin.publish('Bearer other-token',a.authorizationId));
  await assert.rejects(admin.publish('Bearer ceo-token','json-forjado'));
  const receipt=await admin.publish('Bearer ceo-token',a.authorizationId);
  assert.equal(receipt.actorUid,'ceo-synthetic');
  assert.equal((await read('question_import_authorizations',a.authorizationId))?.planSha256,p.plan.planSha256);
  assert.equal((await admin.publish('Bearer ceo-token',a.authorizationId)).repeated,true);
});
test('Backend real não inicializa credenciais nem aceita sessão JSON sem app ATHENA existente',async()=>{
  await assert.rejects(verifyExistingAthenaAdminToken('synthetic-not-a-real-token'),/não inicializado/);
});
test.after(async()=>{await db.terminate();});
