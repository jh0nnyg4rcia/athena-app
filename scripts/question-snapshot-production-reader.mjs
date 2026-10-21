import { readSnapshotState } from './question-snapshot-reader.mjs';
import { ATHENA_TARGET } from './publish-reviewed-questions.mjs';
const registered = new WeakSet();
export const isProductionSnapshotReader = reader => registered.has(reader);
export function createProductionSnapshotReader(db, controls) {
 if(db?.projectId!==ATHENA_TARGET.projectId||db.databaseId!==ATHENA_TARGET.databaseId||db._settings?.ssl===false||process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('Destino de produção inválido');
 const endpoint=db._settings?.host??db._settings?.servicePath??'firestore.googleapis.com';
 if(!['firestore.googleapis.com','firestore.googleapis.com:443'].includes(endpoint))throw Error('Endpoint de produção inválido');
 for(const key of ['authorize','checkIam','audit'])if(typeof controls?.[key]!=='function')throw Error('Controles administrativos obrigatórios');
 const reader=Object.freeze({mode:'production-readonly',target:ATHENA_TARGET,async readState(id){
  if(id!=='day_1_part_0')throw Error('Aula fora do escopo autorizado');
  if(await controls.authorize(id)!==true)throw Error('Autorização administrativa ausente');
  const iam=await controls.checkIam();
  if(iam?.readOnly!==true)throw Error('IAM não confirmado');
  // Falha de auditoria bloqueia a consulta. Apenas eventos locais, sem documentos ou tokens.
  await controls.audit({event:'snapshot-read-started',lessonId:id});
  try {const result=await readSnapshotState(db,id);await controls.audit({event:'snapshot-read-completed',lessonId:id});return result;}
  catch {await controls.audit({event:'snapshot-read-failed',lessonId:id});throw Error('Leitura administrativa indisponível');}
 }});
 registered.add(reader);return reader;
}
