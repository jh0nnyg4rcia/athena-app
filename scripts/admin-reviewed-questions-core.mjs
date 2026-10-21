import {canonical,sha256,contentSha256,parseStrict} from './import-reviewed-questions.mjs';
import {previewPublication,previewAdministrativePublication,createAdministrativePublisher,recoverBackupInMemory,validateSnapshotContent,assessSnapshotAdministration} from './publish-reviewed-questions.mjs';
import {isAdminAdapter,requireAdminMode} from './admin-question-adapter.mjs';
import {canonicalLessonId} from './question-snapshot-reader.mjs';
import {snapshotStep} from './snapshot-diagnostics.mjs';
import {annotateSnapshotSchemaFailure} from './snapshot-schema-diagnostics.mjs';
import {prepareEditorialCompatibility} from './editorial-compatibility.mjs';
const equal=(a,b)=>canonical(a)===canonical(b);
const requireThat=(ok,message)=>{if(!ok)throw Error(message);};
const copy=x=>structuredClone(x);
function validateBackup(backup,target,id){requireThat(equal(backup?.target,target)&&backup.lessonId===id,'Destino de backup divergente');return recoverBackupInMemory(backup);}
export function checkConstitutionalScope(input){
 if(input.lessonId!=='day_1_part_0')return;
 requireThat(input.questions?.length===10,'Constitucional exige dez questões');
 const fields={1:['explanation'],3:['options[1]','explanation'],4:['explanation'],5:['explanation'],6:['text','explanation'],8:['explanation']};
 for(const q of input.questions){requireThat(q.original?.correctIndex===q.revised?.correctIndex,'Gabaritos de Constitucional são imutáveis');requireThat(Array.isArray(q.approvedChanges)&&equal(q.approvedChanges.map(c=>c.field).sort(),[...(fields[q.index]??[])].sort()),'Campos divergentes das oito correções aprovadas de Constitucional');if(!fields[q.index])requireThat(equal(q.original,q.revised),'Questão não aprovada para alteração');}
}
export const confirmationText=(action,id,hash)=>`${action==='publish'?'PUBLICAR':'RESTAURAR'} ${id} ${hash}`;
export function createAdminOperations({adapter,authenticate,confirm,now=()=>Date.now()}){
 requireThat(isAdminAdapter(adapter),'Adaptador administrativo não reconhecido');if(adapter.mode!=='production-snapshot')requireAdminMode(adapter.mode==='emulator'?'emulator':'production');
 requireThat(typeof authenticate==='function'&&typeof confirm==='function','Identidade e confirmação obrigatórias');
 async function actor(){const a=await authenticate();requireThat(a?.id&&a.authorized===true,'Identidade administrativa não autorizada');return a;}
 const lessonVersion=state=>state.readVersions?.[`homologated_lessons/${state.lesson.id}`];
 async function validateState(state,capturedAt,contentOnly=false){
  requireThat(lessonVersion(state)?.seconds&&Number.isInteger(lessonVersion(state).nanoseconds),'updateTime confiável ausente');
  const l=state.lesson;
  const unchanged={schemaVersion:'athena-reviewed-questions/v1',lessonId:l.id,originalVersion:l.version,originalContentSha256:contentSha256(l.content),originalLessonSha256:sha256(l),audit:{reference:'integrity-check-only',approvedBy:'validation-only',approvedAt:capturedAt,approvalReference:'not-publication-approval',sources:['https://example.invalid/integrity']},questions:l.challenge?.questions?.map((q,index)=>({index,originalSha256:sha256(q),original:copy(q),revised:copy(q),approvedChanges:[]}))};
  if(contentOnly==='external')return prepareEditorialCompatibility(state,unchanged,capturedAt);
  if(contentOnly)return validateSnapshotContent(state,unchanged,capturedAt,adapter.target);
  await previewPublication({mode:'mock',target:adapter.target,readState:async()=>state},unchanged,capturedAt);
 }
 async function approve(action,id,hash,reference){
  requireThat(typeof reference==='string'&&reference.trim(),'Referência operacional obrigatória');
  const expected=confirmationText(action,id,hash);requireThat(await confirm({action,lessonId:id,planSha256:hash,expected,approvalReference:reference})===expected,'Confirmação humana ausente ou divergente');
 }
 function checkEnvelope(value,schema,hashKey){requireThat(value?.schemaVersion===schema,'Envelope inválido');const body={...value};delete body[hashKey];requireThat(sha256(body)===value[hashKey],'Hash do envelope divergente');}
 async function receiptEnvelope(operationId,planHash){
  const stored=await adapter.readPublication(operationId);requireThat(stored?.data?.adminPlanSha256===planHash,'Recibo remoto ausente ou divergente');
  const state=await adapter.readState(stored.data.lessonId);
  requireThat(sha256(state.lesson)===stored.data.afterLessonSha256&&equal(lessonVersion(state),stored.updateTime),'Aula mudou após publicação');
  const body={schemaVersion:'athena-admin-receipt/v1',target:adapter.target,lessonId:state.lesson.id,planSha256:planHash,publication:stored.data,commitUpdateTime:stored.updateTime};return {...body,receiptSha256:sha256(body)};
 }
 return {
  async snapshot(id,{auditOnly=false}={}){await snapshotStep('configuration',()=>{canonicalLessonId(id);requireThat(typeof auditOnly==='boolean','Modo de snapshot inválido');});const a=await snapshotStep('authorization',actor),state=await snapshotStep('read-state',()=>adapter.readState(id)),capturedAt=new Date(now()).toISOString();
   await snapshotStep('representations',()=>{if(!state.lesson?.challenge||!Array.isArray(state.lesson.challenge.questions)||typeof state.lesson.content!=='string')throw annotateSnapshotSchemaFailure(Error('challenge ou content ausente/incompatível'),state);});
   await snapshotStep('integrity',async()=>{try{await validateState(state,capturedAt,auditOnly);}catch(error){throw annotateSnapshotSchemaFailure(error,state);}});
   return snapshotStep('hashes',()=>{
   const snapshot={schemaVersion:'athena-question-snapshot/v1',capturedAt,lesson:copy(state.lesson),reviewState:copy(state.reviewState)};
   if(auditOnly)Object.assign(snapshot,{schemaVersion:'athena-question-audit-snapshot/v1',purpose:'audit-only',importReady:false,publicationReady:false,...(state.catalogEntry?{catalogEntry:copy(state.catalogEntry)}:{}),sections:copy(state.sections),readVersions:copy(state.readVersions),administrativeAssessment:assessSnapshotAdministration(state)});
   const manifest={schemaVersion:'athena-admin-snapshot-manifest/v1',target:adapter.target,lessonId:id,actorHash:sha256(a.id),snapshotSha256:sha256(snapshot),originalLessonSha256:sha256(state.lesson),originalContentSha256:contentSha256(state.lesson.content),originalQuestionSha256:state.lesson.challenge.questions.map((q,index)=>({index,sha256:sha256(q)})),sections:copy(state.sections),readVersions:copy(state.readVersions)};
   if(auditOnly){Object.assign(manifest,{schemaVersion:'athena-admin-audit-snapshot-manifest/v1',purpose:'audit-only',importReady:false,publicationReady:false,administrativeAssessment:copy(snapshot.administrativeAssessment),originalStateSha256:sha256(state)});manifest.manifestSha256=sha256(manifest);}
   return {snapshot,manifest};
   });
  },
  async plan(input,{editorialContext=null}={}){requireThat(adapter.mode!=='production-snapshot','Somente snapshot autorizado');input=parseStrict(JSON.stringify(input));canonicalLessonId(input.lessonId);const a=await actor();if(!editorialContext)checkConstitutionalScope(input);const createdAt=new Date(now()).toISOString();
   const publication=await previewAdministrativePublication(adapter,input,createdAt,editorialContext);requireThat(lessonVersion(publication.baseline)?.seconds,'updateTime ausente');
   const body={schemaVersion:'athena-admin-plan/v1',target:adapter.target,lessonId:input.lessonId,actorHash:sha256(a.id),createdAt,expiresAt:new Date(now()+30*60000).toISOString(),publication};return {...body,planSha256:sha256(body)};
  },
  async publish(plan,approvalReference){
   requireThat(adapter.mode!=='production-snapshot','Somente snapshot autorizado');
   plan=parseStrict(JSON.stringify(plan));checkEnvelope(plan,'athena-admin-plan/v1','planSha256');const a=await actor();requireThat(equal(plan.target,adapter.target)&&plan.lessonId===plan.publication.lessonId&&plan.actorHash===sha256(a.id),'Plano de outra identidade ou destino');
   requireThat(Number.isFinite(Date.parse(plan.expiresAt))&&Date.parse(plan.expiresAt)>now(),'Plano expirado');if(!plan.publication.editorialContext)checkConstitutionalScope(plan.publication.input);
   await approve('publish',plan.lessonId,plan.planSha256,approvalReference);
   requireThat(Date.parse(plan.expiresAt)>now(),'Plano expirou durante confirmação');
   const authorizationId=sha256({action:'publish',planSha256:plan.planSha256,actorHash:plan.actorHash,approvalReference});
   const auth={action:'publish-reviewed-questions',authorizationId,actorUid:a.id,lessonId:plan.lessonId,target:adapter.target,planSha256:plan.publication.planSha256,approvedAt:new Date(now()).toISOString(),expiresAt:new Date(Math.min(now()+5*60000,Date.parse(plan.expiresAt))).toISOString()};
   await createAdministrativePublisher(adapter,{now,verifyAuthorization:candidate=>equal(candidate,auth),editorialContext:plan.publication.editorialContext??null,externalAssessment:plan.publication.precedence??null,receiptMetadata:{adminPlanSha256:plan.planSha256,operationalApprovalReference:approvalReference,baselineReadVersionsSha256:sha256(plan.publication.baseline.readVersions)}}).publish(plan.publication,auth);
   return receiptEnvelope(plan.publication.planSha256,plan.planSha256);
  },
  async restore(receipt,approvalReference){
   requireThat(adapter.mode!=='production-snapshot','Somente snapshot autorizado');
   receipt=parseStrict(JSON.stringify(receipt));checkEnvelope(receipt,'athena-admin-receipt/v1','receiptSha256');const a=await actor();requireThat(equal(receipt.target,adapter.target)&&receipt.lessonId===receipt.publication.lessonId&&receipt.publication.actorUid===a.id,'Recibo de outra identidade ou destino');
   const operationId=receipt.publication.planSha256,restoreId=`restore_${operationId}`;
   await approve('restore',receipt.lessonId,receipt.receiptSha256,approvalReference);
   const approvedUntil=now()+5*60000;
   const authoritative=await adapter.readPublication(operationId);requireThat(equal(authoritative?.data,receipt.publication)&&equal(authoritative?.updateTime,receipt.commitUpdateTime),'Recibo adulterado ou remoto divergente');
   const backup=await adapter.readBackup(receipt.publication.backupId),original=validateBackup(backup,adapter.target,receipt.lessonId);
   requireThat(sha256(original)===receipt.publication.beforeLessonSha256&&backup.planSha256===operationId,'Backup não corresponde à publicação');
   const previous=await adapter.readRestoration(restoreId);
   if(previous){const state=await adapter.readState(receipt.lessonId);requireThat(previous.data.actorUid===a.id&&previous.data.sourceReceiptSha256===receipt.receiptSha256&&sha256(state.lesson)===previous.data.afterLessonSha256&&equal(lessonVersion(state),previous.updateTime),'Restauração repetida com alterações posteriores');return {...previous.data,repeated:true};}
   const fresh=await adapter.readState(receipt.lessonId);
   requireThat(sha256(fresh.lesson)===receipt.publication.afterLessonSha256&&equal(lessonVersion(fresh),receipt.commitUpdateTime),'Alteração posterior impede restauração');
   requireThat(equal(fresh.reviewState,backup.state.reviewState)&&equal(fresh.sections,backup.state.sections),'Revisões administrativas mudaram');
   const beforeReviewVersions={...backup.state.readVersions},currentReviewVersions={...fresh.readVersions};delete beforeReviewVersions[`homologated_lessons/${receipt.lessonId}`];delete currentReviewVersions[`homologated_lessons/${receipt.lessonId}`];requireThat(equal(beforeReviewVersions,currentReviewVersions),'updateTime das revisões mudou');
   await validateState(backup.state,new Date(now()).toISOString(),receipt.publication.externalPolicy==='external-approved-question-leaves/v1'?'external':false);
   const checkpoint={schemaVersion:'athena-question-backup/v1',lessonId:receipt.lessonId,createdAt:new Date(now()).toISOString(),previousVersion:fresh.lesson.version,target:adapter.target,planSha256:receipt.receiptSha256,authorizationId:restoreId,state:fresh,stateSha256:sha256(fresh),lessonSha256:sha256(fresh.lesson)};
   const checkpointId=`before_${restoreId}`;const existingCheckpoint=await adapter.readBackup(checkpointId);
   if(existingCheckpoint)requireThat(existingCheckpoint.planSha256===receipt.receiptSha256&&equal(existingCheckpoint.state,fresh),'Backup de reversão anterior divergente');
   else await adapter.createBackup(checkpointId,checkpoint);
   const confirmed=await adapter.readBackup(checkpointId);requireThat(equal(confirmed,existingCheckpoint??checkpoint),'Backup de reversão não confirmado');validateBackup(confirmed,adapter.target,receipt.lessonId);
   return adapter.runTransaction(async tx=>{
    const current=await tx.readState(receipt.lessonId),stored=await tx.readPublication(operationId),oldBackup=await tx.readBackup(receipt.publication.backupId),reverseBackup=await tx.readBackup(checkpointId),prior=await tx.readRestoration(restoreId);
    if(prior){requireThat(prior.data.actorUid===a.id&&prior.data.sourceReceiptSha256===receipt.receiptSha256&&sha256(current.lesson)===prior.data.afterLessonSha256&&equal(lessonVersion(current),prior.updateTime),'Restauração concorrente divergente');return {...prior.data,repeated:true};}
    requireThat(now()<approvedUntil,'Confirmação de restauração expirada');requireThat(equal(current,fresh)&&equal(stored,authoritative)&&equal(oldBackup,backup)&&equal(reverseBackup,confirmed),'Conflito transacional de restauração');
    const patch={};for(const field of receipt.publication.fieldsModified){requireThat(['challenge.questions','content','blocks'].includes(field),'Campo de restauração desconhecido');patch[field]=field==='challenge.questions'?original.challenge.questions:original[field];}
    const proposed=copy(current.lesson);for(const [field,value] of Object.entries(patch)){if(field==='challenge.questions')proposed.challenge.questions=value;else proposed[field]=value;}requireThat(sha256(proposed)===sha256(original),'Restauração não reproduz backup integral');
    const result={schemaVersion:'athena-admin-restoration/v1',lessonId:receipt.lessonId,target:adapter.target,sourceReceiptSha256:receipt.receiptSha256,sourceOperationId:operationId,actorUid:a.id,operationalApprovalReference:approvalReference,restoredAt:new Date(now()).toISOString(),beforeLessonSha256:sha256(current.lesson),afterLessonSha256:sha256(original),checkpointId,repeated:false};
    tx.updateLesson(receipt.lessonId,patch);tx.createRestoration(restoreId,result);return result;
   });
  }
 };
}
