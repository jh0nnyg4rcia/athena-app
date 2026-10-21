import test from 'node:test';import assert from 'node:assert/strict';
import {Firestore} from '@google-cloud/firestore';
import {externalPolicyFixture} from './external-policy-fixtures.mjs';
import {evaluateExternalQuestionPolicy,verifyExternalPolicyBaseline} from './external-question-policy.mjs';
import {createAdminEmulatorAdapter} from './admin-question-adapter.mjs';
import {createAdminOperations} from './admin-reviewed-questions-core.mjs';
import {ATHENA_TARGET} from './publish-reviewed-questions.mjs';
import {embedded,sha256} from './import-reviewed-questions.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189')throw Error('Somente emulador');
const db=new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
let part=0;
for(const conflict of [false,true])test(`política no emulador: ${conflict?'conflito material':'pendência disjunta'}`,async()=>{
 const f=externalPolicyFixture({day:88,part:part++,whole:conflict,candidateEdit:c=>{if(!conflict)return c.replace('Lei sintética','Lei sintética revisada');const s=embedded(c),challenge=structuredClone(s.challenge);challenge.questions[0].explanation='Conflito sintético';return c.slice(0,s.start)+JSON.stringify(challenge)+c.slice(s.end);}});
 await db.collection('homologated_lessons').doc(f.state.lesson.id).create(f.state.lesson);
 await db.collection('legal_reviews').doc(f.review.id+'-'+f.state.lesson.id).create({...f.review,id:f.review.id+'-'+f.state.lesson.id});
 const group=conflict?f.state.reviewState:f.state.sections[1],index={...group.index,latestReviewId:f.review.id+'-'+f.state.lesson.id};
 await db.collection('legal_review_index').doc(index.lessonId).create(index);
 const adapter=createAdminEmulatorAdapter(db,f.state.lesson.id),state=await adapter.readState(f.state.lesson.id);
 const before=sha256(state),assessment=evaluateExternalQuestionPolicy(state,f.input,'2026-10-12T12:00:00Z');assert.equal(assessment.coexistenceDemonstrated,!conflict);
 assert.equal(sha256(await adapter.readState(f.state.lesson.id)),before);
 // A avaliação nunca habilita a publicação: o fluxo atual conserva seu bloqueio.
 const core=createAdminOperations({adapter,authenticate:async()=>({id:'synthetic',authorized:true}),confirm:async()=>''});await assert.rejects(core.plan(f.input));
 if(!conflict){assert.equal(verifyExternalPolicyBaseline(assessment,state,f.input),true);await db.collection('homologated_lessons').doc(f.state.lesson.id).update({version:2});const changed=await adapter.readState(f.state.lesson.id);assert.throws(()=>verifyExternalPolicyBaseline(assessment,changed,f.input),/POLICY_CONCURRENT_CHANGE/);}
});
test.after(()=>db.terminate());
