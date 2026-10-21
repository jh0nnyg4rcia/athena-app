import{sha256,contentSha256,canonical,parseStrict}from'./import-reviewed-questions.mjs';import{validateEditorialCatalog}from'./editorial-catalog-scope.mjs';
const equal=(a,b)=>canonical(a)===canonical(b),need=(v,c)=>{if(!v)throw Error(c);};
export function createCatalogTechnicalRebase(raw,state,approval,createdAt=new Date().toISOString()){
 const x=parseStrict(raw);validateEditorialCatalog(state,x);
 need(Number.isSafeInteger(x.sourceVersion)&&x.sourceVersion>0&&state.lesson.version>x.sourceVersion,'REBASE_VERSION_DIRECTION');
 need(equal(x.originalQuestions,state.lesson.challenge?.questions),'REBASE_ORIGINAL_QUESTIONS');
 need(Array.isArray(x.revisedQuestions)&&x.revisedQuestions.length===x.originalQuestions.length&&x.revisedQuestions.every((q,i)=>q.correctIndex===x.originalQuestions[i].correctIndex),'REBASE_ANSWERS');
 need(approval?.schemaVersion==='athena-editorial-human-approval/v1'&&approval.authorization==='editorial-only'&&approval.lessonId===x.lessonId&&approval.fileSha256===contentSha256(raw),'REBASE_APPROVAL_BINDING');
 need(state.reviewState?.checked===true&&state.sections?.length===6&&state.readVersions?.['homologated_lessons/'+x.lessonId]?.seconds&&state.readVersions?.['homologated_parts/'+x.lessonId]?.seconds,'REBASE_TRUSTED_STATE');
 need(Number.isFinite(Date.parse(createdAt)),'REBASE_TIMESTAMP');
 const body={schemaVersion:'athena-editorial-catalog-rebase/v1',policy:'catalog-identical-original-questions',lessonId:x.lessonId,editorialFileSha256:contentSha256(raw),editorialApprovalSha256:sha256(approval),sourceVersion:x.sourceVersion,technicalVersion:state.lesson.version,originalQuestionsSha256:sha256(x.originalQuestions),technicalStateSha256:sha256(state),technicalReadVersionsSha256:sha256(state.readVersions),createdAt,legalTextModified:false,publicationAuthorization:false};return{...body,rebaseSha256:sha256(body)};
}
export function verifyCatalogTechnicalRebase(raw,state,approval,evidence){
 need(evidence&&typeof evidence==='object','REBASE_EVIDENCE_REQUIRED');const expected=createCatalogTechnicalRebase(raw,state,approval,evidence.createdAt);need(equal(expected,evidence),'REBASE_CONCURRENT_OR_EVIDENCE_CHANGE');return true;
}
