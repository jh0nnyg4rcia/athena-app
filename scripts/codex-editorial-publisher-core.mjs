// Orchestration only: existing contracts, policy, backup, transaction and receipts.
import {canonical,sha256,contentSha256} from './import-reviewed-questions.mjs';
import {analyzeEditorialTransfer,convertApprovedEditorialDraft} from './editorial-transfer.mjs';
import {createAdminOperations} from './admin-reviewed-questions-core.mjs';
import {validateEditorialCatalog} from './editorial-catalog-scope.mjs';
import {createCatalogTechnicalRebase} from './editorial-catalog-rebase.mjs';
const equal=(a,b)=>canonical(a)===canonical(b);
const check=(ok,code)=>{if(!ok)throw Error(code);};
export async function prepareCodexPublication({raw,evidence,adapter,authenticate,confirm,record,now=()=>Date.now(),operationalApprovalReference,authorizationExpiresAt,requirePublishedCatalog=false}){
 check(typeof raw==='string'&&typeof confirm==='function'&&typeof record==='function','CODEX_ARGUMENTS');
 const {report}=analyzeEditorialTransfer(raw),fileSha256=contentSha256(raw);
 check(evidence?.schemaVersion==='athena-codex-editorial-evidence/v1'&&evidence.lessonId===report.lessonId&&evidence.fileSha256===fileSha256,'CODEX_EDITORIAL_EVIDENCE');
 check(typeof evidence.humanApprovalReference==='string'&&evidence.humanApprovalReference.trim(),'CODEX_HUMAN_EDITORIAL_REFERENCE');
 check(equal(evidence.fields.slice().sort(),report.fields.map(c=>`${c.index}.${c.field}`).sort()),'CODEX_EDITORIAL_FIELDS');
 const bound=structuredClone(evidence),identity=await authenticate();
 check(identity?.authorized===true&&identity.id,'CODEX_IDENTITY');
 const state=await adapter.readState(report.lessonId);
 if(requirePublishedCatalog){
  const document=JSON.parse(raw);validateEditorialCatalog(state,document);
  if(state.lesson.version!==document.sourceVersion&&!bound.technicalRebase){
   bound.technicalRebase=createCatalogTechnicalRebase(raw,state,bound.editorialApproval,new Date(now()).toISOString());
   await record('technical-rebase',bound.technicalRebase);
  }
 }
 const context={raw,approval:bound.editorialApproval??null,externalApprovalReference:bound.humanApprovalReference,...(bound.technicalRebase?{technicalRebase:bound.technicalRebase}:{})};
 const input=convertApprovedEditorialDraft(raw,state,bound.audit,{editorialApproval:context.approval??undefined,technicalRebase:bound.technicalRebase});
 let approved=false,plan,summary;
 const core=createAdminOperations({adapter,authenticate,now,confirm:async c=>{
  check(plan&&c.action==='publish'&&c.planSha256===plan.planSha256&&c.lessonId===report.lessonId,'CODEX_CONFIRMATION_SCOPE');
  check(Date.parse(plan.expiresAt)>now(),'CODEX_PREVIEW_EXPIRED');
  if(!approved){
   check(await confirm(structuredClone(summary))===true,'CODEX_CONFIRMATION_REQUIRED');
   check(Date.parse(plan.expiresAt)>now(),'CODEX_PREVIEW_EXPIRED');
   await record('human-confirmation',{schemaVersion:'athena-codex-operational-approval/v1',lessonId:report.lessonId,fileSha256,planSha256:plan.planSha256,actorHash:sha256(identity.id),confirmedAt:new Date(now()).toISOString(),expiresAt:plan.expiresAt,editorialEvidenceSha256:sha256(bound),approvalReference:bound.humanApprovalReference});
   approved=true;
  }
  return c.expected;
 }});
 plan=await core.plan(input,{editorialContext:context});
 if(authorizationExpiresAt){
  check(Number.isFinite(Date.parse(authorizationExpiresAt))&&Date.parse(authorizationExpiresAt)>now(),'CODEX_REQUEST_EXPIRED');
  if(Date.parse(authorizationExpiresAt)<Date.parse(plan.expiresAt)){
   const {planSha256,...body}=plan;body.expiresAt=authorizationExpiresAt;plan={...body,planSha256:sha256(body)};
  }
 }
 check(plan.actorHash===sha256(identity.id),'CODEX_IDENTITY_CHANGED');
 summary={lessonId:report.lessonId,sourceVersion:JSON.parse(raw).sourceVersion,technicalVersion:state.lesson.version,questionCount:report.questionCount,changedFields:plan.publication.differences,answerChanges:0,fileSha256,planSha256:plan.planSha256,expiresAt:plan.expiresAt,reviewImpacts:plan.publication.precedence.impacts,remoteWriteEnabled:false};
 await record('preview',{plan,summary,editorialEvidence:bound});
 return {summary:structuredClone(summary),plan:structuredClone(plan),async publish(){
  try{
   const receipt=await core.publish(plan,operationalApprovalReference??`CEO single confirmation: ${plan.planSha256}; editorial ${fileSha256}`);
   // Save receipt before the additional verification: a later failure must not hide a commit.
   await record('receipt',receipt);
   const after=await adapter.readState(report.lessonId);
   check(equal(after.lesson,plan.publication.proposed),'CODEX_POST_READ_DIVERGENCE');
   check(equal(after.reviewState,state.reviewState)&&equal(after.sections,state.sections),'CODEX_POST_REVIEW_DIVERGENCE');
   check(equal(after.catalogEntry??null,state.catalogEntry??null),'CODEX_POST_CATALOG_DIVERGENCE');
   const verified={status:'PUBLISHED_AND_VERIFIED',lessonId:report.lessonId,planSha256:plan.planSha256,receiptSha256:receipt.receiptSha256,backupId:receipt.publication.backupId,afterLessonSha256:sha256(after.lesson),changedFields:summary.changedFields,verifiedAt:new Date(now()).toISOString()};
   await record('verification',verified);return {receipt,verification:verified};
  }finally{approved=false;await record('closed',{active:false,lessonId:report.lessonId,planSha256:plan.planSha256,at:new Date(now()).toISOString()});}
 }};
}

// A request records the CEO's existing instruction; it is not a credential.
// Its authority still requires the authenticated administrative identity.
export function validateCodexPublicationRequest(raw,evidence,request,now=Date.now()){
 const fail=()=>{throw Error('CODEX_PUBLICATION_REQUEST_INVALID');};
 const keys=['schemaVersion','action','lessonId','fileSha256','editorialEvidenceSha256','requestReference','requestText','requestedAt','expiresAt'];
 if(!request||!equal(Object.keys(request).sort(),keys.sort()))fail();
 const {report}=analyzeEditorialTransfer(raw),start=Date.parse(request.requestedAt),end=Date.parse(request.expiresAt);
 if(request.schemaVersion!=='athena-codex-publication-request/v1'||request.action!=='publish-editorial'||request.lessonId!==report.lessonId||request.fileSha256!==contentSha256(raw)||request.editorialEvidenceSha256!==sha256(evidence))fail();
 if(typeof request.requestReference!=='string'||!request.requestReference.trim()||typeof request.requestText!=='string'||!request.requestText.trim())fail();
 if(!Number.isFinite(start)||!Number.isFinite(end)||start>now||end<=now||end<=start||end-start>24*60*60000)fail();
 return structuredClone(request);
}
export async function prepareAutomaticCodexPublication(options){
 const now=options.now??(()=>Date.now()),request=validateCodexPublicationRequest(options.raw,options.evidence,options.request,now()),record=options.record;
 check(typeof options.onAuthorizedPlan==='function','CODEX_SCOPE_REQUIRED');
 const requestSha256=sha256(request);let session,attempted=false,result;
 const prepare=async(prefix='')=>prepareCodexPublication({...options,now,requirePublishedCatalog:true,authorizationExpiresAt:request.expiresAt,record:async(name,value)=>{
  if(name==='human-confirmation')value={...value,authorizationMode:'explicit-json-publication-request',requestSha256,requestReference:request.requestReference,sourceEditorialEvidenceSha256:request.editorialEvidenceSha256};
  return record(prefix+name,value);
 },operationalApprovalReference:`CEO explicit JSON publication request ${requestSha256}: ${request.requestReference}`,confirm:async summary=>{
  validateCodexPublicationRequest(options.raw,options.evidence,request,now());
  check(summary.planSha256===session.plan.planSha256,'CODEX_REQUEST_PLAN_BINDING');
  check(summary.reviewImpacts.every(i=>i.conflictingFields.length===0),'CODEX_MATERIAL_REVIEW_CONFLICT');
  await options.onAuthorizedPlan(structuredClone(session.plan));return true;
 }});
 session=await prepare();
 check(session.summary.reviewImpacts.every(i=>i.conflictingFields.length===0),'CODEX_MATERIAL_REVIEW_CONFLICT');
 await record('publication-request',{request,requestSha256,editorialEvidenceSha256:sha256(options.evidence)});
 return {get summary(){return session.summary;},get plan(){return session.plan;},async publish(){
  if(result)return structuredClone(result);
  check(!attempted,'CODEX_OPERATION_ALREADY_ATTEMPTED');
  validateCodexPublicationRequest(options.raw,options.evidence,request,now());
  // Renew only before the first attempt, with the entire baseline unchanged.
  // Never retry an operation that may have committed.
  if(Date.parse(session.plan.expiresAt)<=now()){
   const old=session;session=await prepare('renewal-1-');
   check(equal(old.plan.publication.baseline,session.plan.publication.baseline)&&equal(old.plan.publication.input,session.plan.publication.input),'CODEX_RENEWAL_STATE_CHANGED');
   check(session.summary.reviewImpacts.every(i=>i.conflictingFields.length===0),'CODEX_MATERIAL_REVIEW_CONFLICT');
  }
  attempted=true;result=await session.publish();return structuredClone(result);
 }};
}
