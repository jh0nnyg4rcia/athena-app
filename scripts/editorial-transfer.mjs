import {verifyCpcTechnicalRebase} from './editorial-technical-rebase.mjs';
import {editorialSlot,validateEditorialCatalog} from './editorial-catalog-scope.mjs';
import {verifyCatalogTechnicalRebase} from './editorial-catalog-rebase.mjs';
// Pure local bridge. No SDK, credentials, filesystem or publication operations.
import {canonical,sha256,contentSha256,parseStrict} from './import-reviewed-questions.mjs';
import {validateSnapshotContent,ATHENA_TARGET} from './publish-reviewed-questions.mjs';
const equal=(a,b)=>canonical(a)===canonical(b);
const requireThat=(ok,code)=>{if(!ok)throw Error(code);};
const keys=(x,list)=>x&&typeof x==='object'&&!Array.isArray(x)&&equal(Object.keys(x).sort(),[...list].sort());
const text=x=>typeof x==='string'&&x.trim().length>0;
// Evidence records the explicit subsequent human decision. It is a local
// editorial record, never an authentication credential or write authorization.
function effectiveApproval(value,report,evidence){
 if(!evidence)return report.allApproved&&/^day_1_part_[34]$/.test(report.lessonId);
 requireThat(typeof value==='string','EDITORIAL_APPROVAL_SCOPE');editorialSlot(report.lessonId);
 requireThat(keys(evidence,['schemaVersion','lessonId','fileSha256','fields','approvalReference','recordedAt','authorization']),'EDITORIAL_APPROVAL_EVIDENCE');
 requireThat(evidence.schemaVersion==='athena-editorial-human-approval/v1'&&evidence.authorization==='editorial-only'&&evidence.lessonId===report.lessonId&&evidence.fileSha256===contentSha256(value)&&text(evidence.approvalReference)&&Number.isFinite(Date.parse(evidence.recordedAt)),'EDITORIAL_APPROVAL_EVIDENCE');
 const expected=report.fields.map(c=>`${c.index}.${c.field}`).sort();
 requireThat(Array.isArray(evidence.fields)&&equal(evidence.fields.slice().sort(),expected)&&equal(report.fields.map(c=>`${c.index}.${c.field}`).sort(),expected),'EDITORIAL_APPROVAL_FIELDS');
 return true;
}
export function analyzeEditorialTransfer(value){
 const x=parseStrict(typeof value==='string'?value:JSON.stringify(value));
 requireThat(keys(x,['format','lessonId','subject','sourceVersion','originalQuestions','revisedQuestions','approvedChanges']),'EDITORIAL_KEYS');
 requireThat(x.format==='athena-editorial-transfer/v1','EDITORIAL_SCOPE');editorialSlot(x.lessonId);
 requireThat(text(x.subject)&&Number.isSafeInteger(x.sourceVersion)&&x.sourceVersion>0,'EDITORIAL_METADATA');
 for(const list of [x.originalQuestions,x.revisedQuestions]){
  requireThat(Array.isArray(list)&&list.length===10,'EDITORIAL_COUNT');
  for(const q of list)requireThat(keys(q,['text','options','correctIndex','explanation'])&&text(q.text)&&text(q.explanation)&&Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=5&&q.options.every(text)&&Number.isInteger(q.correctIndex)&&q.correctIndex>=0&&q.correctIndex<q.options.length,'EDITORIAL_QUESTION');
 }
 const differences=[];
 x.originalQuestions.forEach((q,index)=>{
  const r=x.revisedQuestions[index];requireThat(q.correctIndex===r.correctIndex,'EDITORIAL_ANSWER_CHANGE');
  requireThat(q.options.length===r.options.length,'EDITORIAL_OPTIONS_COUNT');
  requireThat(equal(q.options,r.options)||!equal([...q.options].sort(),[...r.options].sort()),'EDITORIAL_OPTIONS_REORDERED');
  for(const field of ['text','explanation'])if(q[field]!==r[field])differences.push({index,field});
  q.options.forEach((v,n)=>{if(v!==r.options[n])differences.push({index,field:`options[${n}]`});});
  requireThat(!x.originalQuestions.some((other,n)=>n!==index&&equal(other,r)&&!equal(q,r)),'EDITORIAL_QUESTIONS_REORDERED');
 });
 requireThat(Array.isArray(x.approvedChanges),'EDITORIAL_CHANGES');
 const declarations=x.approvedChanges.map(c=>{
  requireThat(keys(c,c.field==='options'?['questionIndex','field','optionIndex','approvalStatus','reason']:['questionIndex','field','approvalStatus','reason']),'EDITORIAL_CHANGE_KEYS');
  requireThat(Number.isInteger(c.questionIndex)&&c.questionIndex>=0&&c.questionIndex<10&&['text','explanation','options'].includes(c.field)&&['approved','pending'].includes(c.approvalStatus)&&text(c.reason),'EDITORIAL_CHANGE');
  if(c.field==='options')requireThat(Number.isInteger(c.optionIndex)&&c.optionIndex>=0&&c.optionIndex<x.originalQuestions[c.questionIndex].options.length,'EDITORIAL_OPTION_INDEX');
  return {index:c.questionIndex,field:c.field==='options'?`options[${c.optionIndex}]`:c.field,status:c.approvalStatus,reason:c.reason};
 });
 const paths=list=>list.map(c=>`${c.index}.${c.field}`).sort();
 requireThat(equal(paths(declarations),paths(differences)),'EDITORIAL_UNDECLARED_OR_DUPLICATE_CHANGE');
 return {document:x,report:{lessonId:x.lessonId,questionCount:10,changedQuestions:new Set(differences.map(d=>d.index)).size,changeCount:differences.length,answerChanges:0,fields:declarations.map(({reason,...d})=>d),allApproved:declarations.length>0&&declarations.every(c=>c.status==='approved'),editorialSha256:sha256(x)}};
}
function prepare(value,state,audit,{editorialApproval,technicalRebase}={}){
 const {document:x,report}=analyzeEditorialTransfer(value),lesson=state.lesson;
 requireThat(lesson?.id===x.lessonId,'EDITORIAL_BASELINE_VERSION');
 if(!/^day_1_part_[0-4]$/.test(x.lessonId))validateEditorialCatalog(state,x);
 if(lesson.version!==x.sourceVersion){requireThat(technicalRebase,'EDITORIAL_BASELINE_VERSION');if(technicalRebase.schemaVersion==='athena-editorial-catalog-rebase/v1')verifyCatalogTechnicalRebase(value,state,editorialApproval,technicalRebase);else verifyCpcTechnicalRebase(value,state,editorialApproval,technicalRebase);}
 else requireThat(!technicalRebase,'REBASE_UNEXPECTED');
 requireThat(equal(lesson.challenge?.questions,x.originalQuestions),'EDITORIAL_BASELINE_QUESTIONS');
 const input={schemaVersion:'athena-reviewed-questions/v1',lessonId:x.lessonId,originalVersion:lesson.version,originalContentSha256:contentSha256(lesson.content),originalLessonSha256:sha256(lesson),audit:structuredClone(audit),questions:x.originalQuestions.map((q,index)=>({index,originalSha256:sha256(q),original:structuredClone(q),revised:structuredClone(x.revisedQuestions[index]),approvedChanges:x.approvedChanges.filter(c=>c.questionIndex===index).map(c=>({field:c.field==='options'?`options[${c.optionIndex}]`:c.field,reason:c.reason}))}))};
 return {input,report};
}
// Pending fields can be examined technically, but never leave this function as
// a reviewed contract or a publishable plan. Original reviews are not mutated.
export function previewEditorialTransfer(value,state,capturedAt,{editorialApproval}={}){
 const audit={reference:'technical-editorial-preview',approvedBy:'NOT_APPROVAL',approvedAt:capturedAt,approvalReference:'NOT_OPERATIONAL_AUTHORIZATION',sources:['https://example.invalid/technical-validation']};
 const {input,report}=prepare(value,state,audit);
 const approvalReady=effectiveApproval(value,report,editorialApproval);
 const result=validateSnapshotContent(state,input,capturedAt,ATHENA_TARGET);
 return {schemaVersion:'athena-editorial-technical-preview/v1',...report,technicalValid:true,approvalReady,approvalSource:editorialApproval?'subsequent-human-record':'file-status-and-current-human-instruction',publicationReady:false,remoteWriteEnabled:false,blocksMode:result.blocksMode,originalLessonSha256:input.originalLessonSha256,proposedLessonSha256:sha256(result.proposedLesson),previewSha256:sha256({state,input,editorialApproval:editorialApproval??null}),fieldsToUpdate:equal(state.lesson,result.proposedLesson)?[]:['challenge.questions','content',...(equal(state.lesson.blocks,result.proposedLesson.blocks)?[]:['blocks'])]};
}
export function convertApprovedEditorial(value,state,audit,{editorialApproval,technicalRebase}={}){
 const input=convertApprovedEditorialDraft(value,state,audit,{editorialApproval,technicalRebase});
 validateSnapshotContent(state,input,audit.approvedAt,ATHENA_TARGET);
 return input;
}
// Approved editorial contract only; structural validation must be performed
// separately. This draft is never a publication plan or a write authorization.
export function convertApprovedEditorialDraft(value,state,audit,{editorialApproval,technicalRebase}={}){
 const {input,report}=prepare(value,state,audit,{editorialApproval,technicalRebase});
 if(input.lessonId==='day_1_part_0')requireThat(editorialApproval,'EDITORIAL_CONSTITUTIONAL_LITERAL_PROOF_REQUIRED');
 if(/^day_1_part_[12]$/.test(input.lessonId))requireThat(editorialApproval,'EDITORIAL_DISCIPLINE_APPROVAL_PENDING');
 if(!/^day_1_part_[0-4]$/.test(input.lessonId))requireThat(editorialApproval,'EDITORIAL_HUMAN_APPROVAL_REQUIRED');
 requireThat(effectiveApproval(value,report,editorialApproval),'EDITORIAL_APPROVAL_PENDING');
 if(editorialApproval)requireThat(audit.approvalReference===editorialApproval.approvalReference,'EDITORIAL_APPROVAL_REFERENCE');
 return input;
}
