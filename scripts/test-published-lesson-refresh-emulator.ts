import test from 'node:test';
import assert from 'node:assert/strict';
import {Firestore} from '@google-cloud/firestore';
import {initializeApp,deleteApp} from 'firebase/app';
import {getFirestore,connectFirestoreEmulator,doc,getDocFromServer,onSnapshot,terminate,disableNetwork,enableNetwork} from 'firebase/firestore';
import {watchPublishedLesson} from '../src/lib/publishedLessonRefresh';
import {refreshPublishedQuestions,mayRefreshPublishedQuestions} from '../src/lib/questionCacheRefresh';
import {resolveDisplayedChallenge} from '../src/lib/objectiveChallenge';
import {syntheticFixture} from './revised-question-import-fixtures.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189')throw Error('Local emulator only');
const databaseId='ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb',projectId='demo-athena-question-import';
const admin=new Firestore({projectId,databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
const app=initializeApp({projectId,apiKey:'synthetic-local'},'published-propagation'),db=getFirestore(app,databaseId);connectFirestoreEmulator(db,'127.0.0.1',8189);
async function until(check:()=>boolean){for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,25));}assert.ok(check(),'Synthetic content did not propagate');}
test('real local Firestore change refreshes active questions, keeps sessions/answers and survives reconnect',async()=>{
 const f=syntheticFixture();f.snapshot.lesson.id='day_87_part_0';f.snapshot.lesson.day=87;f.input.lessonId=f.snapshot.lesson.id;
 const local=f.snapshot.lesson,cloud=structuredClone(local);cloud.challenge.questions[0].explanation='Synthetic externally approved explanation';cloud.content=cloud.content.replace('Justificativa original sintética.','Synthetic externally approved explanation');
 const ref=admin.collection('homologated_lessons').doc(local.id);await ref.create(local);
 const target=new EventTarget(),visibility=new EventTarget();let stored=structuredClone(local),shown=local,online=true,writes=0;const progress={xp:55,completedDays:[1]},session={answers:{0:0},messages:[{content:local.content,challenge:local.challenge}]},before=JSON.stringify({progress,session});
 const stop=watchPublishedLesson({target,visibilityTarget:visibility,visible:()=>true,subscribe:invalidate=>onSnapshot(doc(db,'homologated_lessons',local.id),{includeMetadataChanges:true},snapshot=>{if(!snapshot.metadata.fromCache&&!snapshot.metadata.hasPendingWrites)invalidate();}),read:()=>refreshPublishedQuestions({shown:stored,current:()=>stored,readServer:async()=>{if(!online)throw Error('synthetic offline');return(await getDocFromServer(doc(db,'homologated_lessons',local.id))).data() as any;},canReplace:mayRefreshPublishedQuestions,writeLocal:async value=>{stored=structuredClone(value);writes++;}}),apply:value=>{shown=value;}});
 try{
  await until(()=>shown===stored);await ref.update({challenge:cloud.challenge,content:cloud.content});await until(()=>shown.challenge.questions[0].explanation===cloud.challenge.questions[0].explanation);assert.equal(writes,1);
  const quiz=resolveDisplayedChallenge({messageChallenge:session.messages[0].challenge,messageContent:session.messages[0].content,officialChallenge:shown.challenge,officialContent:shown.content,preferOfficialForMatchingContent:true});assert.equal(quiz?.questions[0].explanation,cloud.challenge.questions[0].explanation);assert.equal(JSON.stringify({progress,session}),before);
  online=false;await disableNetwork(db);const later=structuredClone(cloud);later.challenge.questions[0].explanation='Synthetic after reconnect';later.content=later.content.replace('Synthetic externally approved explanation','Synthetic after reconnect');await ref.update({challenge:later.challenge,content:later.content});await new Promise(r=>setTimeout(r,100));assert.equal(shown.challenge.questions[0].explanation,cloud.challenge.questions[0].explanation);
  online=true;await enableNetwork(db);target.dispatchEvent(new Event('online'));await until(()=>shown.challenge.questions[0].explanation==='Synthetic after reconnect');assert.equal(JSON.stringify({progress,session}),before);
  stored={...stored,pendingCloud:true};const pending=structuredClone(stored);await ref.update({challenge:cloud.challenge,content:cloud.content});await new Promise(r=>setTimeout(r,150));assert.deepEqual(stored,pending);assert.equal(writes,2);
 }finally{stop();}
});
test.after(async()=>{await terminate(db);await deleteApp(app);await admin.terminate();});
