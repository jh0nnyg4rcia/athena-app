// Adaptador independente: expõe apenas leitura consistente; não inicializa SDK.
import { ATHENA_TARGET } from './publish-reviewed-questions.mjs';
export function canonicalLessonId(id) {
 const m=typeof id==='string' && /^day_([1-9]\d{0,2})_part_(0|[1-9]\d?)$/.exec(id);
 if(!m || +m[1]>100) throw Error('Identificador canônico inválido');
 return id;
}
export function createSnapshotEmulatorReader(db) {
 const endpoint=db?._settings?.host ?? (db?._settings?.servicePath && `${db._settings.servicePath}:${db._settings.port}`);
 if(db?.projectId!=='demo-athena-question-import' || db.databaseId!==ATHENA_TARGET.databaseId || endpoint!=='127.0.0.1:8189' || db._settings.ssl!==false) throw Error('Leitura real bloqueada; exige projeto demo, banco nomeado e emulador fixo');
 return Object.freeze({mode:'emulator',target:{projectId:db.projectId,databaseId:db.databaseId},async readState(lessonId){
  canonicalLessonId(lessonId);
  return readSnapshotState(db,lessonId);
 }});
}

// Compartilhado entre adaptadores controlados; sem inicialização ou escrita.
export async function readSnapshotState(db,lessonId) {
 canonicalLessonId(lessonId);
 return db.runTransaction(async tx=>{
   const provenance=[];
   const get=async ref=>{const s=await tx.get(ref); if(ref.path)provenance.push({path:ref.path,exists:s.exists,updateTime:s.updateTime?.toDate().toISOString()??null,readTime:s.readTime?.toDate().toISOString()??null});return s;};
   const ref=(collection,id)=>db.collection(collection).doc(id);
   const document=await get(ref('homologated_lessons',lessonId));
   if(!document.exists)throw Error('Aula inexistente');
   const lesson=document.data();
   const catalog=await get(ref('homologated_parts',lessonId));
   const ids=[lessonId,...Array.from({length:6},(_,n)=>`${lessonId}_block_${n}`)];
   const indices=[];for(const id of ids){const s=await get(ref('legal_review_index',id));indices.push(s.exists?s.data():null);}
   const reviewDocs=(await get(db.collection('legal_reviews').where('lessonId','in',ids))).docs;
   const extraIndices=(await get(db.collection('legal_review_index').where('lessonId','in',ids))).docs;
   if(extraIndices.some(s=>!ids.includes(s.id)))throw Error('Índice com identidade incompatível');
   const reviews=reviewDocs.map(s=>{const r=s.data();if(r.id!==undefined&&r.id!==s.id)throw Error('Revisão com identidade incompatível');return {...r,id:s.id};});
   if(reviews.some(r=>!ids.includes(r.lessonId)))throw Error('Revisão fora do escopo');
   const group=id=>reviews.filter(r=>r.lessonId===id).sort((a,b)=>a.id.localeCompare(b.id));
   return {state:{lesson,...(catalog.exists?{catalogEntry:catalog.data()}:{}),reviewState:{checked:true,index:indices[0],reviews:group(lessonId)},sections:ids.slice(1).map((scopeId,i)=>({scopeId,index:indices[i+1],reviews:group(scopeId)}))},provenance};
  },{readOnly:true});
}

