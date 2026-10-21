// Local preparation only. No SDK, persistence, authorization or publication.
import {canonical,sha256,contentSha256,parseStrict,embedded,dryRun} from './import-reviewed-questions.mjs';
import {hashCatalogSnapshot} from '../src/services/legalReviewRepository.ts';
import {validateReconciliationIntegrity} from '../src/lib/legalReviewValidate.ts';
import {convertApprovedEditorialDraft} from './editorial-transfer.mjs';
import {editorialSlot,validateEditorialCatalog} from './editorial-catalog-scope.mjs';
const equal=(a,b)=>canonical(a)===canonical(b);
const requireThat=(ok,code)=>{if(!ok)throw Error(code);};
export function locateEditorialJson(content,lessonId){
 requireThat(typeof content==='string','COMPAT_CONTENT_TYPE');
 const tags=[...content.matchAll(/\[BLOCK_(\d+)\]/gi)].map(m=>m[0]);
 const canonicalTags=Array.from({length:6},(_,i)=>`[BLOCK_${i+1}]`);
 const missingFour=lessonId==='day_1_part_2'&&equal(tags,canonicalTags.filter(t=>t!=='[BLOCK_4]'));
 requireThat(equal(tags,canonicalTags)||missingFour,'COMPAT_UNKNOWN_MARKERS');
 requireThat((content.match(/\[ATHENA_CHALLENGE\]/gi)||[]).length===1&&content.includes('[ATHENA_CHALLENGE]'),'COMPAT_AMBIGUOUS_JSON');
 const marker=content.indexOf('[ATHENA_CHALLENGE]'),b5=content.indexOf('[BLOCK_5]'),b6=content.indexOf('[BLOCK_6]');
 requireThat(marker>b5&&b6>b5,'COMPAT_JSON_POSITION');
 const limit=marker<b6?b6:content.length;
 let start=marker+'[ATHENA_CHALLENGE]'.length;while(/\s/.test(content[start]||'')&&start<limit)start++;
 requireThat(content[start]==='{','COMPAT_JSON_MISSING');
 let depth=0,quoted=false,escaped=false;
 for(let i=start;i<limit;i++){const c=content[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){requireThat(marker<b6||!content.slice(i+1).trim(),'COMPAT_UNKNOWN_FOOTER');return{start,end:i+1,challenge:parseStrict(content.slice(start,i+1)),missingFour};}}
 throw Error('COMPAT_JSON_INCOMPLETE');
}
export function prepareEditorialCompatibility(state,input,capturedAt){
 editorialSlot(input.lessonId);requireThat(state.lesson.id===input.lessonId,'COMPAT_SCOPE');
 if(!/^day_1_part_[0-4]$/.test(input.lessonId))validateEditorialCatalog(state,{lessonId:input.lessonId,subject:state.lesson.subject});
 requireThat(state.reviewState?.checked===true&&Array.isArray(state.sections)&&state.sections.length===6,'COMPAT_REVIEWS_UNCHECKED');
 requireThat(input.originalLessonSha256===sha256(state.lesson)&&input.originalContentSha256===contentSha256(state.lesson.content),'COMPAT_BASELINE_HASH');
 const source=state.lesson,span=locateEditorialJson(source.content,source.id);
 requireThat(equal(span.challenge,source.challenge),'COMPAT_JSON_DIVERGENCE');
 if(Object.hasOwn(source,'blocks')){
  requireThat(Array.isArray(source.blocks)&&source.blocks.length===6&&source.blocks.every(b=>typeof b==='string'),'COMPAT_BLOCKS_UNKNOWN');
  // A second challenge or structured questions in a block cannot be preserved stale.
  requireThat(source.blocks.every(b=>!/(\[ATHENA_CHALLENGE\]|"questions"\s*:|"correctIndex"\s*:)/i.test(b)),'COMPAT_BLOCKS_CONTAIN_QUESTIONS');
 }
 // Validate all official contract rules on an isolated synthetic Markdown shell.
 // This shell never replaces persisted content or purports to repair its markers.
 const shell=Array.from({length:6},(_,i)=>`[BLOCK_${i+1}]\n${i===4?'[ATHENA_CHALLENGE]\n'+source.content.slice(span.start,span.end):'synthetic-validation-shell'}`).join('\n');
 const virtualLesson={...source,content:shell};
 const virtualInput={...input,originalContentSha256:contentSha256(shell),originalLessonSha256:sha256(virtualLesson)};
 const result=dryRun({schemaVersion:'athena-question-snapshot/v1',capturedAt,lesson:virtualLesson,reviewState:{checked:true,index:null,reviews:[]}},virtualInput);
 requireThat(result.ok,`COMPAT_CONTRACT: ${result.conflicts?.join('; ')}`);
 const replacement=embedded(result.proposedLesson.content);
 const content=source.content.slice(0,span.start)+result.proposedLesson.content.slice(replacement.start,replacement.end)+source.content.slice(span.end);
 const proposed={...structuredClone(source),content,challenge:structuredClone(result.proposedLesson.challenge)};
 requireThat(equal(locateEditorialJson(content,source.id).challenge,proposed.challenge),'COMPAT_PROPOSED_DIVERGENCE');
 requireThat(Buffer.byteLength(JSON.stringify(proposed))<=900000,'COMPAT_SIZE');
 const body={schemaVersion:'athena-editorial-compatibility-draft/v1',lessonId:source.id,capturedAt,baselineStateSha256:sha256(state),inputSha256:sha256(input),baselineReadVersionsSha256:sha256(state.readVersions??null),proposedLessonSha256:sha256(proposed),fieldsModified:['challenge.questions','content'],changedQuestionFields:result.differences.flatMap(q=>q.changes.map(c=>({questionIndex:q.index,field:c.field}))),blocksPreserved:equal(source.blocks,proposed.blocks),structure:{missingBlockFour:span.missingFour,blocks:source.blocks===undefined?'absent':'six-strings-without-structured-questions',existingStructuralDivergenceNotRepaired:source.blocks!==undefined||span.missingFour},publicationReady:false,remoteWriteEnabled:false};
 return{report:{...body,draftSha256:sha256(body)},proposedLesson:proposed,input:structuredClone(input)};
}
export function verifyEditorialDraftBaseline(report,state,input){
 const {draftSha256,...body}=report;
 requireThat(sha256(body)===draftSha256&&sha256(state)===report.baselineStateSha256&&sha256(input)===report.inputSha256&&sha256(state.readVersions??null)===report.baselineReadVersionsSha256,'COMPAT_CONCURRENT_OR_TAMPERED');
 return true;
}
// Explicit external precedence is preparation evidence, never operational consent.
export function assessEditorialReviewPrecedence(state,draft,approvalReference){
 requireThat(typeof approvalReference==='string'&&approvalReference.trim(),'PRECEDENCE_REFERENCE');
 verifyEditorialDraftBaseline(draft.report,state,draft.input);
 const impacts=[],blockers=[];
 const groups=[{scopeId:state.lesson.id,...state.reviewState},...state.sections];
 requireThat(equal(state.sections.map(s=>s.scopeId),Array.from({length:6},(_,i)=>`${state.lesson.id}_block_${i}`)),'PRECEDENCE_SCOPE');
 for(const g of groups){
  if(g.index?.processingReviewId||g.index?.processingStartedAt)blockers.push({scopeId:g.scopeId,rule:'ACTIVE_PROCESSING_LOCK'});
  requireThat(Array.isArray(g.reviews),'PRECEDENCE_REVIEWS');
  const seen=new Set();
  for(const [ordinal,r] of g.reviews.entries()){
   requireThat(typeof r.id==='string'&&r.id&&!seen.has(r.id)&&r.lessonId===g.scopeId,'PRECEDENCE_REVIEW_IDENTITY');seen.add(r.id);
   const item={scopeId:g.scopeId,ordinal,recordSha256:sha256(r),status:r.status,conflictingFields:[],statusModified:false};impacts.push(item);
   if(['approved','rejected'].includes(r.status)){item.outcome='historical-preserved';continue;}
   if(r.status==='failed'&&r.reviewedMarkdown===''&&r.changes?.length===0){item.outcome='failed-without-candidate-preserved';continue;}
   if(r.status!=='pending_approval'){blockers.push({scopeId:g.scopeId,ordinal,rule:'UNKNOWN_REVIEW_STATE'});continue;}
   if(g.scopeId!==state.lesson.id&&!/\[ATHENA_CHALLENGE\]/i.test((r.originalContent??'')+(r.reviewedMarkdown??''))){item.outcome='independent-block-preserved';continue;}
   try{
    const a=locateEditorialJson(r.originalContent,state.lesson.id).challenge,b=locateEditorialJson(r.reviewedMarkdown,state.lesson.id).challenge;
    requireThat(equal(a.questions,state.lesson.challenge.questions)&&Array.isArray(b.questions)&&b.questions.length===10,'PRECEDENCE_BASELINE');
    for(const change of draft.report.changedQuestionFields){const field=change.field,m=/^options\[(\d+)\]$/.exec(field),get=q=>m?q.options[+m[1]]:q[field];const i=change.questionIndex;
     if(!equal(get(a.questions[i]),get(b.questions[i]))&&!equal(get(b.questions[i]),get(draft.proposedLesson.challenge.questions[i])))item.conflictingFields.push({questionIndex:i,field,internalValueSha256:sha256(get(b.questions[i])),externalValueSha256:sha256(get(draft.proposedLesson.challenge.questions[i]))});
    }
    const nextHash=hashCatalogSnapshot(draft.proposedLesson);
    item.staleWholeLessonApprovalBlocked=r.originalHash!==nextHash&&(!r.reconciliation||!validateReconciliationIntegrity(r,nextHash).valid);
    requireThat(item.staleWholeLessonApprovalBlocked,'PRECEDENCE_STALE_APPROVAL_NOT_BLOCKED');
    item.outcome=item.conflictingFields.length?'external-reference-wins-conflict-recorded':'whole-lesson-candidate-preserved';
   }catch{blockers.push({scopeId:g.scopeId,ordinal,rule:'CANDIDATE_OR_STALE_GUARD_UNRESOLVED'});}
  }
 }
 const body={schemaVersion:'athena-external-precedence-draft/v1',approvalReference,baselineStateSha256:sha256(state),draftSha256:draft.report.draftSha256,impacts,blockers,policyPrepared:blockers.length===0,publicationReady:false,productionEnabled:false};
 return{...body,assessmentSha256:sha256(body)};
}
export function createEditorialSimulationBuilder(decision){
 const bound=structuredClone(decision);
 return(state,input,capturedAt,target)=>{
  requireThat(bound.baselineStateSha256===sha256(state)&&bound.inputSha256===sha256(input),'SIMULATION_DECISION_BINDING');
  const draft=prepareEditorialCompatibility(state,input,capturedAt),policy=assessEditorialReviewPrecedence(state,draft,bound.approvalReference);
  requireThat(policy.policyPrepared,'SIMULATION_POLICY_BLOCKED');
  const proposed=draft.proposedLesson,patch={};
  if(!equal(state.lesson.challenge.questions,proposed.challenge.questions))patch['challenge.questions']=proposed.challenge.questions;
  if(state.lesson.content!==proposed.content)patch.content=proposed.content;
  const body={schemaVersion:'athena-question-publication/v1',target,lessonId:input.lessonId,capturedAt,input,baseline:state,proposed,patch,blocksMode:'preserve-existing-question-free-blocks',differences:draft.report.changedQuestionFields,editorialDecision:bound,compatibility:draft.report,precedence:policy};
  return{...body,planSha256:sha256(body),remoteWriteEnabled:false};
 };
}
// The administrative entry revalidates literal source/approval against every
// fresh baseline. JSON evidence never replaces ADC or operational confirmation.
export function createEditorialAdministrativeBuilder(context){
 const bound=structuredClone(context);
 requireThat(bound&&typeof bound.raw==='string'&&typeof bound.externalApprovalReference==='string'&&bound.externalApprovalReference.trim(),'ADMIN_EDITORIAL_CONTEXT');
 requireThat(equal(Object.keys(bound).sort(),(Object.hasOwn(bound,'technicalRebase')?['raw','approval','externalApprovalReference','technicalRebase']:['raw','approval','externalApprovalReference']).sort()),'ADMIN_EDITORIAL_CONTEXT_KEYS');
 return(state,input,capturedAt,target)=>{
  const converted=convertApprovedEditorialDraft(bound.raw,state,input.audit,{editorialApproval:bound.approval??undefined,technicalRebase:bound.technicalRebase});
  requireThat(equal(converted,input),'ADMIN_EDITORIAL_INPUT_DIVERGENCE');
  const decision={baselineStateSha256:sha256(state),inputSha256:sha256(input),approvalReference:bound.externalApprovalReference,editorialSourceSha256:contentSha256(bound.raw),editorialContextSha256:sha256(bound)};
  const result=createEditorialSimulationBuilder(decision)(state,input,capturedAt,target);
  if(bound.technicalRebase)requireThat(result.precedence.impacts.every(i=>i.conflictingFields.length===0),'REBASE_MATERIAL_REVIEW_CONFLICT');
  const {planSha256,...body}=result;
  return{...body,editorialContext:bound,planSha256:sha256({...body,editorialContext:bound})};
 };
}
