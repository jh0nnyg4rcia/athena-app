// Explicit JSON publication request; production gates are never toggled here.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {Firestore} from '@google-cloud/firestore';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {parseStrict,sha256} from './import-reviewed-questions.mjs';
import {analyzeEditorialTransfer} from './editorial-transfer.mjs';
import {prepareCodexPublication,prepareAutomaticCodexPublication,validateCodexPublicationRequest} from './codex-editorial-publisher-core.mjs';
import {createAdminAdapter,createCodexOperationScope,requireAdminMode} from './admin-question-adapter.mjs';
import {ATHENA_TARGET} from './publish-reviewed-questions.mjs';
import {authenticateAdminAdc} from './admin-adc-identity.mjs';
import {createGrpcCompatibleAdcClient} from './admin-grpc-auth.mjs';
import {assertPrivateDirectory,disableSnapshotReadRetries} from './snapshot-diagnostics.mjs';
import {isCeoEmail} from '../src/lib/contentProvider.ts';
function privateOutput(path){
 if(existsSync(path))throw Error('CODEX_OUTPUT_EXISTS');mkdirSync(path,{recursive:true,mode:0o700});
 if(process.platform==='win32'){
  const who=spawnSync('whoami',[],{encoding:'utf8',windowsHide:true});if(who.status!==0)throw Error('CODEX_LOCAL_IDENTITY');
  const acl=spawnSync('icacls',[path,'/inheritance:r','/grant:r',`${who.stdout.trim()}:(OI)(CI)F`,'SYSTEM:(OI)(CI)F'],{encoding:'utf8',windowsHide:true});if(acl.status!==0)throw Error('CODEX_OUTPUT_ACL');
 }
 assertPrivateDirectory(path);const probe=join(path,'.write-probe');writeFileSync(probe,'',{flag:'wx',mode:0o600});
}
async function main(){
 const args=process.argv.slice(2);if(args[0]==='--help'){console.log('node node_modules/tsx/dist/cli.mjs scripts/codex-publish-editorial.mjs ARQUIVO.json [--request REGISTRO.json] [--emulator] [--out PASTA_NOVA]\nEvidência editorial: ARQUIVO.json.approval.json; solicitação humana: ARQUIVO.json.publish-request.json. Automático, sem segunda confirmação. --interactive preserva o modo legado PUBLICAR. Produção permanece bloqueada.');return;}
 const file=args.shift(),flags={};while(args.length){const f=args.shift();if(Object.hasOwn(flags,f))throw Error('CODEX_DUPLICATE_FLAG');if(['--emulator','--interactive'].includes(f))flags[f]=true;else if(['--out','--request'].includes(f)&&args.length)flags[f]=args.shift();else throw Error('CODEX_ARGUMENTS');}
 if(!file)throw Error('CODEX_INPUT_REQUIRED');const raw=readFileSync(resolve(file),'utf8'),{report}=analyzeEditorialTransfer(raw),evidence=parseStrict(readFileSync(resolve(file)+'.approval.json','utf8'));
 if(flags['--interactive']&&flags['--request'])throw Error('CODEX_ARGUMENTS');
 const requestPath=resolve(flags['--request']??(resolve(file)+'.publish-request.json'));
 const request=flags['--interactive']?null:validateCodexPublicationRequest(raw,evidence,parseStrict(readFileSync(requestPath,'utf8')));
 const mode=flags['--emulator']?'emulator':'production';requireAdminMode(mode); // before ADC or any remote access
 const out=resolve(flags['--out']??join(process.env.USERPROFILE??'.','Documents','Codex','athena-private','runs',randomUUID()));privateOutput(out);
 let app,db,identity,session,scope,publishStarted=false;const record=async(name,value)=>writeFileSync(join(out,name+'.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
 try{
  if(mode==='emulator'){
   if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('CODEX_EMULATOR_REQUIRED');
   app=initializeApp({projectId:'demo-athena-question-import'},'codex-publisher-'+randomUUID());
   const claims=await getAuth(app).verifyIdToken(process.env.ATHENA_SNAPSHOT_ADMIN_TOKEN??'',true);
   if(!claims.email_verified||!isCeoEmail(claims.email))throw Error('CODEX_UNAUTHORIZED');identity={id:`firebase:${claims.uid}`,authorized:true};
   db=new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
  }else{
   if(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('CODEX_REMOTE_CONTEXT');
   const verified=await authenticateAdminAdc({isAuthorizedEmail:isCeoEmail});identity=verified.identity;
   db=new Firestore({projectId:ATHENA_TARGET.projectId,databaseId:ATHENA_TARGET.databaseId,authClient:createGrpcCompatibleAdcClient(verified.client)});
  }
  disableSnapshotReadRetries(db);scope=createCodexOperationScope(report.lessonId,undefined,mode);const adapter=createAdminAdapter(db,report.lessonId,mode,scope);
  const options={raw,evidence,adapter,authenticate:async()=>identity,record};
  session=request?await prepareAutomaticCodexPublication({...options,request,onAuthorizedPlan:async plan=>{
   if(readFileSync(resolve(file),'utf8')!==raw||sha256(parseStrict(readFileSync(resolve(file)+'.approval.json','utf8')))!==sha256(evidence)||sha256(parseStrict(readFileSync(requestPath,'utf8')))!==sha256(request))throw Error('CODEX_FILES_CHANGED');
   scope.arm(plan);
  }}):await prepareCodexPublication({...options,confirm:async summary=>{
   if(mode==='production'&&!process.stdin.isTTY)throw Error('CODEX_INTERACTIVE_REQUIRED');
   const rl=createInterface({input:process.stdin,output:process.stderr});try{const yes=(await rl.question('Confirma a aprovação editorial e a publicação SOMENTE desta prévia? Digite PUBLICAR ou cancele:\n'))==='PUBLICAR';if(yes)scope.arm(session.plan);return yes;}finally{rl.close();}
  }});
  const s=session.summary,labels={text:'enunciado',explanation:'justificativa'};
  console.log(`Prévia: ${s.lessonId} — versão ${s.technicalVersion}; ${s.questionCount} questões; ${s.changedFields.length} campos. Gabaritos preservados.`);
  for(const c of s.changedFields){const option=/^options\[(\d+)\]$/.exec(c.field);console.log(`Q${c.questionIndex+1}: ${labels[c.field]??(option?'alternativa '+String.fromCharCode(65+Number(option[1])):c.field)}`);}
  console.log(`Validade: ${new Date(s.expiresAt).toLocaleString('pt-BR',{timeZone:'America/Cuiaba'})} (Cuiabá). Revisões avaliadas: ${s.reviewImpacts.length}; divergências materiais registradas: ${s.reviewImpacts.reduce((n,r)=>n+r.conflictingFields.length,0)}.`);
  console.log(JSON.stringify({phase:'preview',...s}));
  publishStarted=true;const result=await session.publish();console.log(JSON.stringify({phase:'verified',...result.verification,outputDirectory:out}));
 }catch(error){
  const msg=String(error?.message??'');const category=/expir/i.test(msg)?'EXPIRED':/Conflito|DIVERGENCE|BASELINE/i.test(msg)?'CONFLICT':/CONFIRMATION|autoriz|UNAUTHORIZED|Identidade/i.test(msg)?'AUTHORIZATION':/backup/i.test(msg)?'BACKUP':'VALIDATION_OR_TECHNICAL';
  writeFileSync(join(out,'safe-diagnostic.json'),JSON.stringify({category,providerCode:Number.isInteger(error?.code)?error.code:null,automaticRetry:false,publicationMayHaveCommitted:publishStarted,localReceiptAvailable:existsSync(join(out,'receipt.json'))},null,2),{mode:0o600});
  throw Error('CODEX_'+category);
 }finally{scope?.close();if(db)await db.terminate();if(app)await deleteApp(app);}
}
main().catch(()=>{console.error('Operação interrompida; nenhuma repetição automática. Confira diagnóstico local e eventual recibo antes de nova operação. Produção permanece sujeita às travas existentes.');process.exitCode=1;});
