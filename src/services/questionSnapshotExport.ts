import { sha256, contentSha256 } from '../../scripts/import-reviewed-questions.mjs';
import { ATHENA_TARGET, previewPublication } from '../../scripts/publish-reviewed-questions.mjs';
import { canonicalLessonId } from '../../scripts/question-snapshot-reader.mjs';
import { isCeoEmail } from '../lib/contentProvider';
import { isProductionSnapshotReader } from '../../scripts/question-snapshot-production-reader.mjs';

/** verifyToken e authorizeRead são dependências confiáveis do backend, nunca campos do pedido. */
export function createQuestionSnapshotExporter(options: {
 reader: any; verifyToken: (token: string) => Promise<{uid:string;email:string;emailVerified:boolean}>;
 authorizeRead: (uid:string,lessonId:string) => Promise<boolean>; now?:()=>number;
}) {
 const local=options.reader?.mode==='emulator' && options.reader.target?.projectId==='demo-athena-question-import' && options.reader.target.databaseId===ATHENA_TARGET.databaseId;
 if(!local && !isProductionSnapshotReader(options.reader)) throw Error('Adaptador administrativo não reconhecido');
 return {async exportLesson(bearer:string,lessonId:string){
  canonicalLessonId(lessonId);
  if(typeof bearer!=='string'||!bearer.startsWith('Bearer ')||!bearer.slice(7).trim())throw Error('Autenticação administrativa obrigatória');
  // Não propaga mensagens do provedor que poderiam incluir dados de sessão.
  let user;
  try { user=await options.verifyToken(bearer.slice(7)); } catch {throw Error('Sessão administrativa inválida');}
  if(!user?.uid||!user.emailVerified||!isCeoEmail(user.email))throw Error('Leitura não autorizada');
  let allowed=false;
  try { allowed=await options.authorizeRead(user.uid,lessonId)===true; } catch { throw Error('Leitura não autorizada'); }
  if(!allowed)throw Error('Leitura não autorizada');
  const capturedAt=new Date((options.now??Date.now)()).toISOString();
  try {
   const {state,provenance}=await options.reader.readState(lessonId);
   const lesson=state.lesson;
   if(lesson?.id!==lessonId)throw Error('Identidade da aula divergente');
   const input={schemaVersion:'athena-reviewed-questions/v1',lessonId,originalVersion:lesson.version,originalContentSha256:contentSha256(lesson.content),originalLessonSha256:sha256(lesson),
    // Metadados somente para validar uma proposta sem diferenças; não são auditoria/aprovação jurídica.
    audit:{reference:'snapshot-integrity-check',approvedBy:'validation-only',approvedAt:capturedAt,approvalReference:'not-a-publication-approval',sources:['https://example.invalid/snapshot-validation']},
    questions:lesson.challenge?.questions?.map((q:any,index:number)=>({index,originalSha256:sha256(q),original:structuredClone(q),revised:structuredClone(q),approvedChanges:[]}))};
   await previewPublication({mode:'mock',target:options.reader.target,readState:async()=>state},input,capturedAt);
   const snapshot={schemaVersion:'athena-question-snapshot/v1',capturedAt,lesson:structuredClone(lesson),reviewState:structuredClone(state.reviewState)};
   return {ok:true,importReady:true,remoteWriteEnabled:false,snapshot,manifest:{schemaVersion:'athena-question-snapshot-manifest/v1',target:options.reader.target,lessonId,capturedAt,actorUid:user.uid,provenance,sections:structuredClone(state.sections),originalVersion:lesson.version,originalLessonSha256:sha256(lesson),originalContentSha256:contentSha256(lesson.content),originalQuestionSha256:lesson.challenge.questions.map((q:any,index:number)=>({index,sha256:sha256(q)})),snapshotSha256:sha256(snapshot),stateSha256:sha256(state)}};
  }catch(error){
   // Apenas diagnósticos locais conhecidos; erros remotos não são serializados.
   const message=error instanceof Error?error.message:'';
   const safe=/^(Aula inexistente|Identidade da aula divergente|blocks |Blocos |Desafio |Marcador |Revisão |Índice |Lock|Snapshot |Valor Firestore|Número não seguro|Hash aprovado|Última revisão|Estado das revisões|Questão|origem:|Desafio estruturado|Identidade\/status|Versão original|JSON |Conteúdo ausente|Rodapé legado)/.test(message);
   return {ok:false,importReady:false,remoteWriteEnabled:false,inconsistencies:[safe?message:'Documento incompatível ou leitura indisponível; snapshot não emitido']};
  }
 }};
}
