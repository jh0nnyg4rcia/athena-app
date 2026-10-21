import test from 'node:test';import assert from 'node:assert/strict';
import {syntheticFixture} from './revised-question-import-fixtures.mjs';
import {previewPublication,ATHENA_TARGET} from './publish-reviewed-questions.mjs';
import {annotateSnapshotSchemaFailure,schemaDetailOf} from './snapshot-schema-diagnostics.mjs';
const index=id=>({lessonId:id,processingReviewId:null,latestReviewId:null,latestStatus:null});
const cases=[
 ['SECTION_SCOPES',s=>s.sections=[]],
 ['SECTION_SCOPES',s=>s.sections[0]=null],
 ['SECTION_REVIEWS',s=>s.sections[0].reviews=null],
 ['SECTION_REVIEW_STATE',s=>s.sections[0].reviews=[null]],
 ['SECTION_REVIEW_STATE',s=>s.sections[0].reviews=[{id:'r',lessonId:s.sections[0].scopeId,status:'pending'}]],
 ['SECTION_INDEX_MISSING',s=>s.sections[0].reviews=[{id:'r',lessonId:s.sections[0].scopeId,status:'approved'}]],
 ['SECTION_LOCK',s=>s.sections[0].index={}],
 ['SECTION_INDEX_FIELDS',s=>s.sections[0].index={lessonId:s.sections[0].scopeId,processingReviewId:null}],
 ['SECTION_INDEX_STATE',s=>s.sections[0].index={...index(s.sections[0].scopeId),latestStatus:'approved'}],
 ['SECTION_LATEST_REVIEW',s=>s.sections[0].index={...index(s.sections[0].scopeId),latestReviewId:'missing'}],
 ['CONTRACT_KEYS',s=>delete s.reviewState.checked],
 ['REVIEWS_UNCHECKED',s=>s.reviewState.checked=false],
 ['REVIEW_IDENTITY',s=>s.reviewState.reviews=[{id:'r',lessonId:'wrong',status:'approved'}]],
 ['REVIEW_PENDING',s=>s.reviewState.reviews=[{id:'r',lessonId:s.lesson.id,status:'processing'}]],
 ['REVIEW_INDEX_MISSING',s=>s.reviewState.reviews=[{id:'r',lessonId:s.lesson.id,status:'approved'}]],
 ['REVIEW_LOCK',s=>s.reviewState.index={}],
 ['REVIEW_INDEX_FIELDS',s=>s.reviewState.index={lessonId:s.lesson.id,processingReviewId:null}],
 ['REVIEW_RESIDUAL_LOCK',s=>s.reviewState.index={...index(s.lesson.id),processingStartedAt:1}],
 ['REVIEW_APPROVED_HASH',s=>s.reviewState.index={...index(s.lesson.id),approvedHash:'0'.repeat(64)}],
 ['REVIEW_INDEX_STATE',s=>s.reviewState.index={...index(s.lesson.id),latestStatus:'approved'}],
 ['REVIEW_LATEST',s=>s.reviewState.index={...index(s.lesson.id),latestReviewId:'missing'}]
];
for(const [rule,mutate] of cases)test(`schema revisões: ${rule}`,async()=>{
 const f=syntheticFixture(),state={lesson:f.snapshot.lesson,reviewState:f.snapshot.reviewState,sections:Array.from({length:6},(_,n)=>({scopeId:`${f.input.lessonId}_block_${n}`,index:null,reviews:[]}))};mutate(state);
 const before=JSON.stringify(state);
 await assert.rejects(previewPublication({mode:'mock',target:ATHENA_TARGET,readState:async()=>state},f.input),error=>{annotateSnapshotSchemaFailure(error,state);assert.equal(schemaDetailOf(error).ruleCode,'ATHENA_SCHEMA_'+rule);return true;});assert.equal(JSON.stringify(state),before);
});
