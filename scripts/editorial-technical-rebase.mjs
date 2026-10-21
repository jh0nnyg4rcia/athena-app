import{canonical,sha256,contentSha256,parseStrict,embedded}from'./import-reviewed-questions.mjs';
import{extractChallengeFromText}from'../src/lib/objectiveChallenge.ts';
const equal=(a,b)=>canonical(a)===canonical(b),need=(v,code)=>{if(!v)throw Error(code);};
const policy='cpc-day1-v1-to-v3-identical-original-questions';
const fields=['0.text','0.explanation','3.explanation','4.explanation','5.text','5.explanation','7.options[1]','7.explanation','9.text'].sort();
function inspect(raw,state,approval){
 need(typeof raw==='string','REBASE_LITERAL_SOURCE_REQUIRED');const x=parseStrict(raw),l=state.lesson;
 need(x.format==='athena-editorial-transfer/v1'&&x.lessonId==='day_1_part_2'&&x.sourceVersion===1&&l?.id===x.lessonId&&l.version===3,'REBASE_SCOPE');
 need(x.originalQuestions?.length===10&&equal(l.challenge?.questions,x.originalQuestions),'REBASE_ORIGINAL_QUESTIONS');
 need(x.revisedQuestions?.length===10&&x.revisedQuestions.every((q,i)=>q.correctIndex===x.originalQuestions[i].correctIndex),'REBASE_ANSWERS');
 need(approval?.schemaVersion==='athena-editorial-human-approval/v1'&&approval.authorization==='editorial-only'&&approval.lessonId===l.id&&approval.fileSha256===contentSha256(raw)&&equal(approval.fields?.slice().sort(),fields),'REBASE_APPROVAL_BINDING');
 const span=embedded(l.content);need(equal(span.challenge,l.challenge),'REBASE_CHALLENGE_DIVERGENCE');
 const split=s=>{const m=[...s.matchAll(/\[BLOCK_(\d+)\]/g)];need(equal(m.map(v=>+v[1]),[1,2,3,4,5,6]),'REBASE_BLOCK_MARKERS');return m.map((v,i)=>s.slice(v.index+v[0].length,m[i+1]?.index??s.length).trim());};
 const rawBlocks=split(l.content),displayBlocks=split(extractChallengeFromText(l.content).content);
 need(rawBlocks.every(b=>b.length>0),'REBASE_EMPTY_BLOCK');
 need(Array.isArray(l.blocks)&&l.blocks.length===6&&l.blocks.every(b=>typeof b==='string')&&(equal(l.blocks,rawBlocks)||equal(l.blocks,displayBlocks)),'REBASE_BLOCKS_DIVERGENCE');
 need(state.reviewState?.checked===true&&state.sections?.length===6,'REBASE_ADMINISTRATIVE_SNAPSHOT');
 const update=state.readVersions?.['homologated_lessons/'+l.id];need(typeof update?.seconds==='string'&&Number.isInteger(update.nanoseconds),'REBASE_UPDATE_TIME');
 return x;
}
export function createCpcTechnicalRebase(raw,sourceState,state,approval,createdAt=new Date().toISOString()){
 const x=inspect(raw,state,approval),source=sourceState.lesson;
 need(source?.id===x.lessonId&&source.version===1&&equal(source.challenge?.questions,x.originalQuestions),'REBASE_SOURCE_SNAPSHOT');
 need(Number.isFinite(Date.parse(createdAt)),'REBASE_TIMESTAMP');
 const body={schemaVersion:'athena-editorial-technical-rebase/v1',policy,lessonId:x.lessonId,editorialFileSha256:contentSha256(raw),editorialApprovalSha256:sha256(approval),sourceVersion:1,technicalVersion:3,sourceSnapshot:structuredClone(sourceState),sourceStateSha256:sha256(sourceState),sourceLessonSha256:sha256(source),sourceQuestionsSha256:sha256(source.challenge.questions),technicalStateSha256:sha256(state),technicalLessonSha256:sha256(state.lesson),technicalContentSha256:contentSha256(state.lesson.content),technicalBlocksSha256:sha256(state.lesson.blocks),technicalReadVersionsSha256:sha256(state.readVersions),originalQuestionsSha256:sha256(x.originalQuestions),createdAt,legalTextModified:false,publicationAuthorization:false};
 return{...body,rebaseSha256:sha256(body)};
}
export function verifyCpcTechnicalRebase(raw,state,approval,evidence){
 need(evidence&&typeof evidence==='object','REBASE_EVIDENCE_REQUIRED');const{rebaseSha256,...body}=evidence;
 const keys=['schemaVersion','policy','lessonId','editorialFileSha256','editorialApprovalSha256','sourceVersion','technicalVersion','sourceSnapshot','sourceStateSha256','sourceLessonSha256','sourceQuestionsSha256','technicalStateSha256','technicalLessonSha256','technicalContentSha256','technicalBlocksSha256','technicalReadVersionsSha256','originalQuestionsSha256','createdAt','legalTextModified','publicationAuthorization'];
 need(equal(Object.keys(body).sort(),keys.sort())&&sha256(body)===rebaseSha256,'REBASE_EVIDENCE_INTEGRITY');const x=inspect(raw,state,approval);
 need(body.schemaVersion==='athena-editorial-technical-rebase/v1'&&body.policy===policy&&body.lessonId===x.lessonId&&body.sourceVersion===1&&body.technicalVersion===3&&body.legalTextModified===false&&body.publicationAuthorization===false&&Number.isFinite(Date.parse(body.createdAt)),'REBASE_EVIDENCE_SCOPE');
 need(body.editorialFileSha256===contentSha256(raw)&&body.editorialApprovalSha256===sha256(approval)&&body.originalQuestionsSha256===sha256(x.originalQuestions)&&body.sourceQuestionsSha256===body.originalQuestionsSha256,'REBASE_SOURCE_BINDING');
 need(body.sourceStateSha256===sha256(body.sourceSnapshot)&&body.sourceLessonSha256===sha256(body.sourceSnapshot?.lesson)&&body.sourceSnapshot?.lesson?.id===x.lessonId&&body.sourceSnapshot.lesson.version===1&&equal(body.sourceSnapshot.lesson.challenge?.questions,x.originalQuestions),'REBASE_SOURCE_SNAPSHOT_BINDING');
 need([body.sourceStateSha256,body.sourceLessonSha256].every(v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v)),'REBASE_SOURCE_HASH');
 need(body.technicalStateSha256===sha256(state)&&body.technicalLessonSha256===sha256(state.lesson)&&body.technicalContentSha256===contentSha256(state.lesson.content)&&body.technicalBlocksSha256===sha256(state.lesson.blocks)&&body.technicalReadVersionsSha256===sha256(state.readVersions),'REBASE_CONCURRENT_OR_BASELINE_CHANGE');
 return true;
}
