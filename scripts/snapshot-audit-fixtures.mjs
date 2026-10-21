// Apenas fixtures sintéticas, sem SDK, ADC, rede ou arquivos de produção.
import {syntheticFixture} from './revised-question-import-fixtures.mjs';
import {ATHENA_TARGET} from './publish-reviewed-questions.mjs';
import {createProductionSnapshotAdapter} from './admin-question-adapter.mjs';
import {createAdminOperations} from './admin-reviewed-questions-core.mjs';
export function auditFixture(status='pending_approval'){
 const f=syntheticFixture();
 const state={lesson:f.snapshot.lesson,reviewState:f.snapshot.reviewState,sections:Array.from({length:6},(_,n)=>({scopeId:`${f.input.lessonId}_block_${n}`,index:null,reviews:[]}))};
 const s=state.sections[1],r={id:'synthetic-review',lessonId:s.scopeId,status,legacyMetadata:{preserve:'synthetic'}};
 s.reviews=[r];s.index={lessonId:s.scopeId,processingReviewId:null,latestReviewId:r.id,latestStatus:status};
 let reads=0;
 const stamp={seconds:1,nanoseconds:0,toDate:()=>new Date(1000)};
 const document=(id,data)=>({id,exists:data!==null,data:()=>data,ref:{path:'legal_reviews/'+id},updateTime:stamp});
 const db={...ATHENA_TARGET,_settings:{},collection:name=>({doc:id=>({path:name+'/'+id}),where:()=>({query:name})}),runTransaction:async(callback,options)=>{
  if(options?.readOnly!==true)throw Error('Read-only required');reads++;
  return callback({get:async ref=>{
   if(ref.path){const [collection,id]=ref.path.split('/');return document(id,collection==='homologated_lessons'?state.lesson:state.sections.find(s=>s.scopeId===id)?.index??null);}
   return {docs:ref.query==='legal_reviews'?state.sections.flatMap(s=>s.reviews.map(r=>document(r.id,r))):[]};
  }});
 }};
 const core=createAdminOperations({adapter:createProductionSnapshotAdapter(db,f.input.lessonId),authenticate:async()=>({id:'synthetic',authorized:true}),confirm:async()=>{throw Error('No confirmation');}});
 return {...f,state,core,reads:()=>reads};
}
