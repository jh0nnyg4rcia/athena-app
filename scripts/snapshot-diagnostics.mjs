import {appendFileSync,lstatSync,statSync,constants,openSync,closeSync} from 'node:fs';
import {dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {schemaDetailOf} from './snapshot-schema-diagnostics.mjs';

const MESSAGES={CONFIG:'Configuração inválida',AUTHENTICATION:'Autenticação não comprovada',AUTHORIZATION:'Acesso não autorizado',CONNECTION:'Conexão indisponível',NOT_FOUND:'Aula inexistente',FORMAT:'Formato incompatível',DIVERGENCE:'Representações ou metadados divergentes',HASH:'Falha no cálculo dos hashes',LOCAL_WRITE:'Falha na gravação local',INTERNAL:'Falha interna'};
const SAFE_PROVIDER=new Set(['EACCES','EPERM','ENOENT','EEXIST','ENOSPC','ECONNREFUSED','ETIMEDOUT','ENOTFOUND','auth/id-token-expired','auth/id-token-revoked','auth/argument-error','auth/invalid-id-token']);
const SAFE_REASONS=new Set(['USER_PROJECT_DENIED','SERVICE_DISABLED','ACCESS_TOKEN_SCOPE_INSUFFICIENT','IAM_PERMISSION_DENIED']);
function classify(stage,error){
 let provider=error;for(let n=0;n<5&&provider?.cause&&provider?.code===undefined&&provider?.response?.status===undefined;n++)provider=provider.cause;
 const status=provider?.response?.status,code=provider?.code,message=String(error?.message??'');
 if(stage==='local-files'||stage==='diagnostic-log')return ['LOCAL_WRITE','local-io'];
 if(stage==='configuration'||stage==='sdk-init'||stage==='adapter-scope')return ['CONFIG','configuration'];
 if(status===401||code===16||String(code).startsWith('auth/'))return ['AUTHENTICATION','credential-rejected'];
 if(status===403||code===7)return ['AUTHORIZATION','provider-denied'];
 if(code===9)return ['CONFIG','firestore-precondition'];
 if([4,14].includes(code)||[408,429,500,502,503,504].includes(status)||['ECONNREFUSED','ETIMEDOUT','ENOTFOUND'].includes(code))return ['CONNECTION','transport-unavailable'];
 if(stage==='authentication'||stage.startsWith('adc-'))return ['AUTHENTICATION','identity-unproven'];
 if(stage==='authorization')return ['AUTHORIZATION','identity-not-allowed'];
 if(code===5||message==='Aula inexistente')return ['NOT_FOUND','lesson-not-found'];
 if(/Firestore não JSON/.test(message))return ['FORMAT','unsupported-firestore-type'];
 if(/challenge/i.test(message)&&/ausen|inválid|incompat|obrigat/i.test(message))return ['FORMAT','challenge-invalid'];
 if(/diverg|inconsisten|não sincroniz|não corresponde|identidade incompatível/i.test(message))return ['DIVERGENCE','representation-mismatch'];
 if(stage==='hashes')return ['HASH','hash-computation'];
 if(stage==='integrity'||stage==='representations')return ['FORMAT','unsupported-schema'];
 return ['INTERNAL','unclassified'];
}
// Controles por instância para a versão instalada do SDK. Falha se a API
// interna mudar; nunca altera o cliente usado em publish ou restore.
export function disableSnapshotReadRetries(db){
 if(typeof db._retry!=='function'||typeof db.createCallOptions!=='function')throw Error('SDK sem controle de retries compatível');
 const options=db.createCallOptions.bind(db);
 db._retry=(_method,_tag,action)=>action();
 db.createCallOptions=(method)=>options(method,[]);
 return db;
}
export class SnapshotDiagnosticError extends Error{
 constructor(stage,error){if(stage==='authentication'&&['adc-discovery','adc-token-refresh','adc-id-token','adc-scopes'].includes(error?.diagnosticStage))stage=error.diagnosticStage;const [category,reason]=classify(stage,error);super(`${MESSAGES[category]} [ATHENA_SNAPSHOT_${category}]`,{cause:error});this.stage=stage;this.code=`ATHENA_SNAPSHOT_${category}`;this.reason=reason;}
}
export async function snapshotStep(stage,action){try{return await action();}catch(error){if(error instanceof SnapshotDiagnosticError)throw error;throw new SnapshotDiagnosticError(stage,error);}}
export function diagnosticRecord(error){
 const e=error instanceof SnapshotDiagnosticError?error:new SnapshotDiagnosticError('configuration',error);
 const causes=[];let cause=e.cause;
 for(let n=0;cause&&n<5;n++,cause=cause.cause){const rawCode=cause.code,status=cause.response?.status;causes.push({providerCode:Number.isInteger(rawCode)&&rawCode>=0&&rawCode<=16?rawCode:SAFE_PROVIDER.has(rawCode)?rawCode:null,httpStatus:Number.isInteger(status)&&status>=100&&status<=599?status:null,providerReasons:(cause.response?.data?.error?.details??[]).map(d=>d.reason).filter(r=>SAFE_REASONS.has(r))});}
 return {schemaVersion:'athena-snapshot-diagnostic/v1',time:new Date().toISOString(),code:e.code,stage:e.stage,reason:e.reason,causes,...(schemaDetailOf(e.cause)?{schema:schemaDetailOf(e.cause)}:{})};
}
export function assertPrivateDirectory(directory){
 if(!statSync(directory).isDirectory()||lstatSync(directory).isSymbolicLink())throw Error('Private directory required');
 if(process.platform!=='win32'){if(statSync(directory).mode&0o077)throw Error('Private directory required');return;}
 const script="$ErrorActionPreference='Stop';$a=Get-Acl -LiteralPath $env:ATHENA_DIAGNOSTIC_DIRECTORY;$s=[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value;if(!$a.AreAccessRulesProtected){throw 'Unprotected ACL'};foreach($r in $a.Access){$v=$r.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value;if($r.AccessControlType -eq 'Allow' -and $v -notin @($s,'S-1-5-18')){throw 'Unexpected ACL'}}";
 const result=spawnSync('pwsh.exe',['-NoProfile','-NonInteractive','-Command',script],{env:{...process.env,ATHENA_DIAGNOSTIC_DIRECTORY:directory},encoding:'utf8',timeout:10000,windowsHide:true});
 if(result.status!==0)throw Error('Private directory required');
}
export function saveDiagnostic(path,error){
 assertPrivateDirectory(dirname(path));
 try{if(lstatSync(path).isSymbolicLink())throw Error('Symlink refused');}catch(e){if(e.code!=='ENOENT')throw e;}
 const noFollow=process.platform==='win32'?0:(constants.O_NOFOLLOW??0);
 const fd=openSync(path,constants.O_CREAT|constants.O_APPEND|constants.O_WRONLY|noFollow,0o600);
 try{appendFileSync(fd,JSON.stringify(diagnosticRecord(error))+'\n');}finally{closeSync(fd);}
}
