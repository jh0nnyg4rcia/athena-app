// Pré-verificação local de uma política proposta. Não é autorização nem plano
// publicável; não inicializa SDK, não lê arquivos, não escreve e não usa rede.
import {canonical,sha256,embedded} from './import-reviewed-questions.mjs';
import {validateSnapshotContent,ATHENA_TARGET} from './publish-reviewed-questions.mjs';
import {checkConstitutionalScope} from './admin-reviewed-questions-core.mjs';
import {extractCatalogBlock} from '../src/lib/catalogBlock.ts';
import {hashCatalogSnapshot,hashLessonContent} from '../src/services/legalReviewRepository.ts';
import {validateReconciliationIntegrity} from '../src/lib/legalReviewValidate.ts';
const equal=(a,b)=>canonical(a)===canonical(b);
const requireThat=(ok,message)=>{if(!ok)throw Error(message);};
function questionLeaves(before,after){
 requireThat(Array.isArray(before)&&Array.isArray(after)&&before.length===after.length,'POLICY_CANDIDATE_UNKNOWN');
 const result=new Map();
 before.forEach((q,n)=>{
  const r=after[n];requireThat(r&&equal(Object.keys(q).sort(),Object.keys(r).sort()),'POLICY_CANDIDATE_UNKNOWN');
  requireThat(typeof r.text==='string'&&r.text.trim()&&typeof r.explanation==='string'&&r.explanation.trim(),'POLICY_CANDIDATE_UNKNOWN');
  for(const key of Object.keys(q))if(!['text','explanation','correctIndex','options'].includes(key))requireThat(equal(q[key],r[key]),'POLICY_CANDIDATE_UNKNOWN');
  requireThat(Array.isArray(r.options)&&r.options.length===q.options.length,'POLICY_CANDIDATE_UNKNOWN');
  requireThat(r.options.every(v=>typeof v==='string'&&v.trim())&&Number.isInteger(r.correctIndex)&&r.correctIndex>=0&&r.correctIndex<r.options.length,'POLICY_CANDIDATE_UNKNOWN');
  requireThat(!before.some((other,i)=>i!==n&&equal(other,r)&&!equal(q,r)),'POLICY_CANDIDATE_UNKNOWN');
  for(const key of ['text','explanation','correctIndex'])if(!equal(q[key],r[key]))result.set(`questions.${n}.${key}`,r[key]);
  q.options.forEach((v,i)=>{if(!equal(v,r.options[i]))result.set(`questions.${n}.options.${i}`,r.options[i]);});
 });return result;
}
export function evaluateExternalQuestionPolicy(state,input,capturedAt=new Date().toISOString()){
 // Os mesmos hashes, JSON estrito, folhas aprovadas, Markdown e blocks.
 const contentValidation=validateSnapshotContent(state,input,capturedAt,ATHENA_TARGET);checkConstitutionalScope(input);
 requireThat(input.questions.every(q=>q.original.correctIndex===q.revised.correctIndex),'POLICY_ANSWER_CHANGE');
 const updateTime=state.readVersions?.[`homologated_lessons/${state.lesson.id}`];
 requireThat(updateTime&&typeof updateTime.seconds==='string'&&/^-?\d+$/.test(updateTime.seconds)&&Number.isInteger(updateTime.nanoseconds)&&updateTime.nanoseconds>=0&&updateTime.nanoseconds<1e9,'POLICY_UPDATE_TIME_MISSING');
 const proposed=contentValidation.proposedLesson,external=questionLeaves(state.lesson.challenge.questions,proposed.challenge.questions);
 requireThat(external.size>0,'POLICY_NO_CHANGES');
 const blockers=[],impacts=[];
 const block=(code,scopeIndex,reviewOrdinal,field)=>blockers.push({code,scopeIndex,reviewOrdinal,...(field?{field}:{})});
 const expected=Array.from({length:6},(_,n)=>`${state.lesson.id}_block_${n}`);
 requireThat(Array.isArray(state.sections)&&equal(state.sections.map(s=>s.scopeId),expected),'POLICY_SCOPES_UNKNOWN');
 requireThat(state.reviewState?.checked===true&&Array.isArray(state.reviewState.reviews)&&equal(Object.keys(state.reviewState).sort(),['checked','index','reviews']),'POLICY_REVIEWS_UNCHECKED');
 const groups=[{scopeIndex:null,scopeId:state.lesson.id,index:state.reviewState.index,reviews:state.reviewState.reviews},...state.sections.map((s,scopeIndex)=>({...s,scopeIndex}))];
 for(const group of groups){
  const {scopeIndex,scopeId,index,reviews}=group;
  requireThat(Array.isArray(reviews),'POLICY_REVIEWS_UNCHECKED');
  const content=scopeIndex===null?state.lesson.content:extractCatalogBlock(state.lesson.content,scopeIndex);
  const nextContent=scopeIndex===null?proposed.content:extractCatalogBlock(proposed.content,scopeIndex);
  const beforeCatalogHash=hashCatalogSnapshot({...state.lesson,content}),afterCatalogHash=hashCatalogSnapshot({...proposed,content:nextContent});
  if(index===null){if(reviews.length)block('POLICY_INDEX_MISSING',scopeIndex,null);}
  else if(!index||index.lessonId!==scopeId||index.processingReviewId!==null||index.processingStartedAt!=null)block('POLICY_ACTIVE_OR_UNKNOWN_LOCK',scopeIndex,null);
  else{
   if(!Object.hasOwn(index,'latestReviewId')||!Object.hasOwn(index,'latestStatus')||(index.latestReviewId===null?(index.latestStatus!==null||reviews.length>0):!reviews.some(r=>r?.id===index.latestReviewId&&r.status===index.latestStatus)))block('POLICY_INDEX_INCONSISTENT',scopeIndex,null);
   if(index.approvedHash!=null&&index.approvedHash!==beforeCatalogHash)block('POLICY_APPROVED_HASH_DIVERGENT',scopeIndex,null);
  }
  const seen=new Set();
  reviews.forEach((r,reviewOrdinal)=>{
   if(!r||typeof r.id!=='string'||!r.id||seen.has(r.id)||r.lessonId!==scopeId){block('POLICY_REVIEW_IDENTITY',scopeIndex,reviewOrdinal);return;}seen.add(r.id);
   const impact={scopeIndex,reviewOrdinal,reviewSha256:sha256(r),beforeCatalogHash,afterCatalogHash,catalogBindingChanges:beforeCatalogHash!==afterCatalogHash,outcome:'unresolved'};
   impacts.push(impact);
   if(['approved','rejected'].includes(r.status)){impact.outcome='historical-record-preserved';return;}
   if(r.status==='failed'){
    if(r.reviewedMarkdown===''&&Array.isArray(r.changes)&&r.changes.length===0){impact.outcome='failed-without-candidate';return;}
    block('POLICY_FAILED_CANDIDATE_UNKNOWN',scopeIndex,reviewOrdinal);return;
   }
   if(r.status!=='pending_approval'){block('POLICY_REVIEW_STATE_UNSUPPORTED',scopeIndex,reviewOrdinal);return;}
   if(scopeIndex!==null&&(r.blockIndex!==scopeIndex||r.catalogLessonId!==state.lesson.id||r.previewOnly!==true)){block('POLICY_SCOPE_METADATA_UNKNOWN',scopeIndex,reviewOrdinal);return;}
   if(typeof r.reviewedMarkdown!=='string'||!r.reviewedMarkdown||r.candidateHash!==hashLessonContent(r.reviewedMarkdown)||r.auditedCandidateHash!==r.candidateHash){block('POLICY_CANDIDATE_INTEGRITY',scopeIndex,reviewOrdinal);return;}
   if(r.editorialIntegrity?.passed!==true){block('POLICY_EDITORIAL_INTEGRITY_UNRESOLVED',scopeIndex,reviewOrdinal);return;}
   const reconciled=r.reconciliation&&validateReconciliationIntegrity(r,beforeCatalogHash).valid;
   if(r.originalHash!==beforeCatalogHash&&!reconciled){block('POLICY_BASELINE_UNRESOLVED',scopeIndex,reviewOrdinal);return;}
   // Um bloco sem o JSON, cujo texto permanece intacto, não sobrepõe questões.
   if(scopeIndex!==null&&content===nextContent){
    if(r.originalContent!==content){block('POLICY_BASELINE_UNRESOLVED',scopeIndex,reviewOrdinal);return;}
    impact.outcome='disjoint-block-with-stale-hash-notice';return;
   }
   if(!Array.isArray(r.unverifiedClaims)||r.unverifiedClaims.length||r.supplement||r.addenda?.length){block('POLICY_FINDINGS_UNRESOLVED',scopeIndex,reviewOrdinal);return;}
   try{
    const baseline=embedded(r.originalContent).challenge,candidate=embedded(r.reviewedMarkdown).challenge;
    requireThat(equal(baseline,state.lesson.challenge),'POLICY_BASELINE_UNRESOLVED');
    requireThat(equal({...candidate,questions:baseline.questions},baseline),'POLICY_CANDIDATE_UNKNOWN');
    const internal=questionLeaves(baseline.questions,candidate.questions);let conflict=false;
    for(const [field,value]of internal){
     if(external.has(field)&&!equal(value,external.get(field))){conflict=true;block('POLICY_MATERIAL_QUESTION_CONFLICT',scopeIndex,reviewOrdinal,field);}
     else if(!external.has(field)&&[...external.keys()].some(e=>e.split('.').slice(0,2).join('.')===field.split('.').slice(0,2).join('.'))){conflict=true;block('POLICY_SAME_QUESTION_REQUIRES_REVIEW',scopeIndex,reviewOrdinal,field);}
    }
    impact.outcome=conflict?'material-conflict':'disjoint-or-aligned-question-leaves';
   }catch(error){block(['POLICY_BASELINE_UNRESOLVED','POLICY_CANDIDATE_UNKNOWN'].includes(error.message)?error.message:'POLICY_CANDIDATE_UNKNOWN',scopeIndex,reviewOrdinal);}
  });
 }
 const body={schemaVersion:'athena-external-question-policy-assessment/v1',policy:'external-approved-question-leaves/v1',capturedAt,lessonId:state.lesson.id,baselineStateSha256:sha256(state),inputSha256:sha256(input),beforeLessonSha256:sha256(state.lesson),proposedLessonSha256:sha256(proposed),externalFields:[...external.keys()],blockers,reviewImpacts:impacts,coexistenceDemonstrated:blockers.length===0,requiresExplicitStaleReviewAcknowledgement:impacts.some(i=>i.catalogBindingChanges),productionEnabled:false,publicationReady:false};
 return {...body,assessmentSha256:sha256(body)};
}
export function verifyExternalPolicyBaseline(assessment,state,input){
 const {assessmentSha256,...body}=assessment;
 requireThat(sha256(body)===assessmentSha256&&sha256(state)===assessment.baselineStateSha256&&sha256(input)===assessment.inputSha256,'POLICY_CONCURRENT_CHANGE');
 requireThat(equal(evaluateExternalQuestionPolicy(state,input,assessment.capturedAt),assessment),'POLICY_ASSESSMENT_TAMPERED');
 requireThat(assessment.coexistenceDemonstrated&&assessment.blockers.length===0,'POLICY_BLOCKED');
 return true;
}
