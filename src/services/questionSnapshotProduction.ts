import {getApps} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {readFileSync,appendFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {verifyExistingAthenaAdminToken} from './questionImportAdmin';
import {createQuestionSnapshotExporter} from './questionSnapshotExport';
import {createProductionSnapshotReader} from '../../scripts/question-snapshot-production-reader.mjs';
import {verifySignedSnapshotReadGrant,checkSnapshotProjectIam,auditActorHash} from './questionSnapshotReadPolicy';
import {ATHENA_TARGET} from '../../scripts/publish-reviewed-questions.mjs';
// Bloqueio de execução: exige autorização humana posterior e revisão local separada.
export const PRODUCTION_SNAPSHOT_READ_ENABLED=false;
const configFile=(name:string)=>fileURLToPath(new URL(`../../config/${name}`,import.meta.url));
export function createPreparedProductionSnapshotExporter(){return {async exportLesson(bearer:string,lessonId:string){
 if(!PRODUCTION_SNAPSHOT_READ_ENABLED)throw Error('Consulta real bloqueada; aguarda autorização expressa para day_1_part_0');
 if(lessonId!=='day_1_part_0'||process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('Contexto administrativo inválido');
 if(!bearer?.startsWith('Bearer '))throw Error('Sessão administrativa obrigatória');
 let user;try{user=await verifyExistingAthenaAdminToken(bearer.slice(7));}catch{throw Error('Sessão administrativa inválida');}
 let envelope:any,publicKey:string;
 try{envelope=JSON.parse(readFileSync(configFile('snapshot-read-grant.json'),'utf8'));publicKey=readFileSync(configFile('snapshot-read-authority.pub.pem'),'utf8');}catch{throw Error('Concessão administrativa do servidor indisponível');}
 const grant=verifySignedSnapshotReadGrant(envelope,publicKey,user.uid,lessonId);
 const app=getApps().find(a=>a.options.projectId===ATHENA_TARGET.projectId);
 if(!app)throw Error('Backend ATHENA não inicializado');
 const operationId=randomUUID();
 const audit=async(event:any)=>{appendFileSync(configFile('snapshot-read-audit.jsonl'),JSON.stringify({...event,operationId,grantId:grant.grantId,actorHash:auditActorHash(user.uid),target:ATHENA_TARGET,at:new Date().toISOString()})+'\n',{mode:0o600});};
 const reader=createProductionSnapshotReader(getFirestore(app,ATHENA_TARGET.databaseId),{authorize:async(id:string)=>{verifySignedSnapshotReadGrant(envelope,publicKey,user.uid,id);return true;},checkIam:()=>checkSnapshotProjectIam(app,grant.serviceAccountEmail),audit});
 const exporter=createQuestionSnapshotExporter({reader,verifyToken:async()=>user,authorizeRead:async(uid,id)=>{verifySignedSnapshotReadGrant(envelope,publicKey,uid,id);return true;}});
 try{const result=await exporter.exportLesson(bearer,lessonId);await audit({event:result.ok?'snapshot-validated':'snapshot-rejected',lessonId});return result;}
 catch{await audit({event:'snapshot-export-failed',lessonId});throw Error('Exportação administrativa recusada');}
}};}
