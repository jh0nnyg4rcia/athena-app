// Só emulador nesta versão. A produção é recusada antes da descoberta de ADC.
import {readSnapshotState,canonicalLessonId} from './question-snapshot-reader.mjs';
import {createEmulatorFirestoreAdapter,ATHENA_TARGET,PRODUCTION_PUBLICATION_ENABLED} from './publish-reviewed-questions.mjs';
import {canonical,sha256} from './import-reviewed-questions.mjs';
export const ADMIN_PRODUCTION_ENABLED=false;
export function requireProductionSnapshotScope(operation,id){
 if(operation!=='snapshot'||id!=='day_1_part_0')throw Error('Somente snapshot de day_1_part_0 autorizado');
}
const registered=new WeakSet();
const scopedOperations=new WeakSet();
export const isAdminAdapter=adapter=>registered.has(adapter);
export function createProductionSnapshotAdapter(db,lessonId){
 requireProductionSnapshotScope('snapshot',lessonId);
 return createProductionReadOnlyAdapter(db,lessonId);
}
export function createProductionCpcSnapshotAdapter(db,lessonId){
 if(lessonId!=='day_1_part_2')throw Error('Somente snapshot de Processo Civil autorizado');
 return createProductionReadOnlyAdapter(db,lessonId);
}
function createProductionReadOnlyAdapter(db,lessonId){
 if(db?.projectId!==ATHENA_TARGET.projectId||db.databaseId!==ATHENA_TARGET.databaseId||
    process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST||db._settings?.ssl===false)throw Error('Destino snapshot inválido');
 const endpoint=db._settings?.host??db._settings?.servicePath??'firestore.googleapis.com';
 if(!['firestore.googleapis.com','firestore.googleapis.com:443'].includes(endpoint))throw Error('Endpoint snapshot inválido');
 const adapter=Object.freeze({mode:'production-snapshot',target:ATHENA_TARGET,
  readState:id=>{if(id!==lessonId)throw Error('Aula fora do escopo somente leitura');return db.runTransaction(tx=>versionedState(db,id,r=>tx.get(r)),{readOnly:true});}
 });registered.add(adapter);return adapter;
}
export function requireAdminMode(mode){if(!['emulator','production'].includes(mode)||mode==='production'&&!ADMIN_PRODUCTION_ENABLED)throw Error('Produção bloqueada nesta etapa');}
const time=s=>s?{seconds:String(s.seconds),nanoseconds:s.nanoseconds}:null;
export async function versionedState(db,id,get){
 canonicalLessonId(id);const versions={};
 const capture=s=>{if(s.ref?.path)versions[s.ref.path]=time(s.updateTime);};
 const wrapped=async ref=>{const s=await get(ref);if(ref.path)versions[ref.path]=time(s.updateTime);else for(const d of s.docs)capture(d);return s;};
 const proxy={collection:db.collection.bind(db),runTransaction:callback=>callback({get:wrapped})};
 const result=await readSnapshotState(proxy,id);
 return {...result.state,readVersions:versions};
}
export function createAdminEmulatorAdapter(db,lessonId){
 return createAdminAdapter(db,lessonId,'emulator');
}
// Scope is process-local, not an authentication mechanism. Both existing
// production flags and the normal ADC/core authorization remain mandatory.
export function createCodexOperationScope(lessonId,now=()=>Date.now(),mode='production'){
 canonicalLessonId(lessonId);let bound=null;
 if(!['production','emulator'].includes(mode)||mode==='emulator'&&process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189')throw Error('Escopo exige destino explícito');
 const target=mode==='emulator'?{...ATHENA_TARGET,projectId:'demo-athena-question-import'}:ATHENA_TARGET;
 const equal=(a,b)=>canonical(a)===canonical(b),deny=()=>{throw Error('CODEX_OPERATION_SCOPE_DENIED');};
 const scope={lessonId,arm(plan){
  const {planSha256,...body}=plan??{};
  if(bound||plan?.schemaVersion!=='athena-admin-plan/v1'||plan.lessonId!==lessonId||sha256(body)!==planSha256||!equal(plan.target,target)||Date.parse(plan.expiresAt)<=now()||!Number.isFinite(Date.parse(plan.expiresAt)))deny();
  if(plan.publication?.lessonId!==lessonId||Object.keys(plan.publication.patch).sort().join()!=='challenge.questions,content')deny();
  bound=structuredClone(plan);
 },close(){bound=null;},assert(stage,id,data){
  if(!bound||Date.parse(bound.expiresAt)<=now())deny();const p=bound.publication,op=p.planSha256;
  if(stage==='lesson'){if(id!==lessonId||!equal(data,p.patch))deny();return;}
  if(stage==='backup'){if(id!==`${lessonId}_v${p.baseline.lesson.version}_${op}`||data.lessonId!==lessonId||data.planSha256!==op||!equal(data.state,p.baseline)||!equal(data.target,target))deny();return;}
  if(stage==='receipt'){if(id!==op||data.lessonId!==lessonId||data.adminPlanSha256!==bound.planSha256||data.beforeLessonSha256!==sha256(p.baseline.lesson)||data.afterLessonSha256!==sha256(p.proposed)||sha256(data.actorUid)!==bound.actorHash)deny();return;}
  if(stage==='authorization'){if(data.planSha256!==op||sha256(data.actorUid)!==bound.actorHash)deny();return;}
  deny(); // restore is never part of this command
 }};scopedOperations.add(scope);return scope;
}
export function createAdminAdapter(db,lessonId,mode,operationScope=null){
 requireAdminMode(mode);
 canonicalLessonId(lessonId);
 if(operationScope&&(!scopedOperations.has(operationScope)||operationScope.lessonId!==lessonId))throw Error('Escopo operacional inválido');
 let base;
 if(mode==='emulator'){
  base=createEmulatorFirestoreAdapter(db);
  if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189')throw Error('Emulador fixo obrigatório');
 }else{
  if(lessonId!=='day_1_part_0'&&!operationScope)throw Error('Escopo inicial de produção restrito a day_1_part_0');
  if(db?.projectId!==ATHENA_TARGET.projectId||db.databaseId!==ATHENA_TARGET.databaseId||process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST||db._settings?.ssl===false)throw Error('Destino administrativo inválido');
  const endpoint=db._settings?.host??db._settings?.servicePath??'firestore.googleapis.com';
  if(!['firestore.googleapis.com','firestore.googleapis.com:443'].includes(endpoint))throw Error('Endpoint administrativo inválido');
  const get=async(collection,id)=>{const s=await db.collection(collection).doc(id).get();return s.exists?s.data():null;};
  base={target:ATHENA_TARGET,readBackup:id=>get('question_import_backups',id),readReceipt:id=>get('question_import_receipts',id),createBackup:async(id,data)=>{try{await db.collection('question_import_backups').doc(id).create(data);}catch(e){if(e.code!==6&&e.code!=='already-exists')throw e;}}};
 }
 const scope=id=>{if(id!==lessonId)throw Error('Aula fora do escopo');return id;};
 const ref=(collection,id)=>db.collection(collection).doc(id);
 const record=async(get,collection,id)=>{const s=await get(ref(collection,id));return s.exists?{data:s.data(),updateTime:time(s.updateTime)}:null;};
 const safeId=id=>{if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,250}$/.test(id))throw Error('Identificador de registro inválido');return id;};
 const writeGuard=()=>{if(mode==='production'&&(!ADMIN_PRODUCTION_ENABLED||!PRODUCTION_PUBLICATION_ENABLED))throw Error('Escrita real bloqueada');};
 const adapter={mode:mode==='emulator'?'emulator':'admin-production',target:base.target,
  readState:id=>db.runTransaction(tx=>versionedState(db,scope(id),r=>tx.get(r)),{readOnly:true}),
  readBackup:id=>base.readBackup(safeId(id)),
  createBackup:async(id,data)=>{writeGuard();operationScope?.assert('backup',id,data);if(data.lessonId!==lessonId||Buffer.byteLength(JSON.stringify(data))>900000)throw Error('Backup incompatível ou excessivo');await base.createBackup(safeId(id),data);},
  readReceipt:id=>base.readReceipt(safeId(id)),
  readPublication:id=>record(r=>r.get(),'question_import_receipts',safeId(id)),
  readRestoration:id=>record(r=>r.get(),'question_import_restorations',safeId(id)),
  runTransaction:callback=>db.runTransaction(tx=>callback({
   readState:id=>versionedState(db,scope(id),r=>tx.get(r)),
   readBackup:id=>record(r=>tx.get(r),'question_import_backups',safeId(id)).then(s=>s?.data??null),
   readReceipt:id=>record(r=>tx.get(r),'question_import_receipts',safeId(id)).then(s=>s?.data??null),
   readPublication:id=>record(r=>tx.get(r),'question_import_receipts',safeId(id)),
   readRestoration:id=>record(r=>tx.get(r),'question_import_restorations',safeId(id)),
   readAuthorization:id=>record(r=>tx.get(r),'question_import_authorizations',safeId(id)).then(s=>s?.data??null),
   updateLesson:(id,patch)=>{writeGuard();operationScope?.assert('lesson',id,patch);scope(id);if(Object.keys(patch).some(k=>!['challenge.questions','content','blocks'].includes(k)))throw Error('Campo de escrita não autorizado');tx.update(ref('homologated_lessons',id),patch);},
   createReceipt:(id,data)=>{writeGuard();operationScope?.assert('receipt',id,data);tx.create(ref('question_import_receipts',safeId(id)),data);},
   createRestoration:(id,data)=>{writeGuard();operationScope?.assert('restoration',id,data);tx.create(ref('question_import_restorations',safeId(id)),data);},
   consumeAuthorization:(id,data)=>{writeGuard();operationScope?.assert('authorization',id,data);tx.create(ref('question_import_authorizations',safeId(id)),data);}
  }),operationScope?{maxAttempts:1}:undefined)
 };registered.add(adapter);return adapter;
}
