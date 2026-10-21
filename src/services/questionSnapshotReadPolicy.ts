import {verify,createHash} from 'node:crypto';
import {canonical} from '../../scripts/import-reviewed-questions.mjs';
import {ATHENA_TARGET} from '../../scripts/publish-reviewed-questions.mjs';
export const SNAPSHOT_READ_PERMISSIONS=Object.freeze(['datastore.entities.get','datastore.entities.list','datastore.databases.get']);
export const SNAPSHOT_WRITE_PERMISSIONS=Object.freeze(['datastore.entities.create','datastore.entities.update','datastore.entities.delete','datastore.databases.create','datastore.databases.update','datastore.databases.delete','datastore.databases.import','datastore.databases.bulkDelete','datastore.backups.restoreDatabase','datastore.databases.clone']);
export function verifySignedSnapshotReadGrant(envelope:any,publicKey:string,uid:string,lessonId:string,now=Date.now()){
 try{
  const grant=envelope.grant;
  if(!verify(null,Buffer.from(canonical(grant)),publicKey,Buffer.from(envelope.signature,'base64url')))throw Error();
  if(grant.schemaVersion!=='athena-snapshot-read-grant/v1'||grant.action!=='read-lesson-snapshot'||grant.actorUid!==uid||lessonId!=='day_1_part_0'||grant.lessonId!==lessonId||canonical(grant.target)!==canonical(ATHENA_TARGET)||typeof grant.grantId!=='string'||!grant.grantId||typeof grant.approvalReference!=='string'||!grant.approvalReference||!Number.isFinite(Date.parse(grant.issuedAt))||!Number.isFinite(Date.parse(grant.expiresAt))||Date.parse(grant.issuedAt)>now||Date.parse(grant.expiresAt)<=now||Date.parse(grant.expiresAt)-Date.parse(grant.issuedAt)>15*60_000)throw Error();
  if(typeof grant.serviceAccountEmail!=='string'||!/@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(grant.serviceAccountEmail))throw Error();
  return Object.freeze({...grant});
 }catch{throw Error('Concessão administrativa assinada inválida ou expirada');}
}
export function validateSnapshotIamPermissions(permissions:unknown){
 if(!Array.isArray(permissions)||!permissions.every(p=>typeof p==='string')||!SNAPSHOT_READ_PERMISSIONS.every(p=>permissions.includes(p))||SNAPSHOT_WRITE_PERMISSIONS.some(p=>permissions.includes(p)))throw Error('IAM de leitura insuficiente ou com permissões de escrita');
 return {readOnly:true,permissions:[...permissions].sort()};
}
// Mesma credencial Admin usada pelo getFirestore(app,banco). Não inicializa credenciais.
export async function checkSnapshotProjectIam(app:any,expectedServiceAccountEmail:string){
 try{
  if(app.options.projectId!==ATHENA_TARGET.projectId||!app.options.credential)throw Error();
  const credential=app.options.credential;
  const principal=typeof credential.getServiceAccountEmail==='function'?await credential.getServiceAccountEmail():credential.clientEmail;
  if(!expectedServiceAccountEmail||principal!==expectedServiceAccountEmail||!/@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(principal))throw Error();
  const token=await app.options.credential.getAccessToken();
  const response=await fetch(`https://cloudresourcemanager.googleapis.com/v3/projects/${ATHENA_TARGET.projectId}:testIamPermissions`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({permissions:[...SNAPSHOT_READ_PERMISSIONS,...SNAPSHOT_WRITE_PERMISSIONS]})});
  if(!response.ok)throw Error();
  const result:any=await response.json();return validateSnapshotIamPermissions(result.permissions);
 }catch{throw Error('Verificação IAM indisponível ou não aprovada');}
}
export const auditActorHash=(uid:string)=>createHash('sha256').update(uid).digest('hex');
