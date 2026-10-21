// CLI administrativa: produção somente snapshot com escopo fixo; escrita bloqueada.
import {readFileSync,mkdirSync,writeFileSync,existsSync,unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {join,dirname} from 'node:path';
import {snapshotStep,SnapshotDiagnosticError,saveDiagnostic,assertPrivateDirectory,disableSnapshotReadRetries,diagnosticRecord} from './snapshot-diagnostics.mjs';
import {createInterface} from 'node:readline/promises';
import {Firestore} from '@google-cloud/firestore';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {authenticateAdminAdc} from './admin-adc-identity.mjs';
import {createGrpcCompatibleAdcClient} from './admin-grpc-auth.mjs';
import {isCeoEmail} from '../src/lib/contentProvider.ts';
import {ATHENA_TARGET,PRODUCTION_PUBLICATION_ENABLED} from './publish-reviewed-questions.mjs';
import {parseStrict} from './import-reviewed-questions.mjs';
import {createAdminOperations} from './admin-reviewed-questions-core.mjs';
import {createAdminAdapter,createProductionSnapshotAdapter,requireProductionSnapshotScope,requireAdminMode} from './admin-question-adapter.mjs';
const usage='snapshot --lesson ID --out PASTA [--audit-only] | plan --input JSON --out PASTA [--editorial-file JSON --editorial-approval JSON --external-reference REFERENCIA] | publish --plan JSON --approval-reference REFERENCIA --out PASTA | restore --receipt JSON --approval-reference REFERENCIA --out PASTA; adicionar --emulator para testes locais; produção continua bloqueada';
let diagnosticPath,diagnosticStage='configuration';
async function main(){
 const args=process.argv.slice(2),operation=args.shift();if(operation==='--help'){process.stdout.write(usage+'\n');return;}
 if(!['snapshot','plan','publish','restore'].includes(operation))throw Error('Operação inválida');
 const flags={};while(args.length){const flag=args.shift();if(Object.hasOwn(flags,flag))throw Error('Argumento duplicado');if(['--emulator','--audit-only'].includes(flag)){flags[flag]=true;continue;}if(!flag?.startsWith('--')||!args.length)throw Error('Argumento inválido');flags[flag]=args.shift();}
 const allowed={snapshot:['--lesson','--out','--emulator','--diagnostic-log','--audit-only'],plan:['--input','--out','--emulator','--editorial-file','--editorial-approval','--external-reference'],publish:['--plan','--approval-reference','--out','--emulator'],restore:['--receipt','--approval-reference','--out','--emulator']}[operation];if(Object.keys(flags).some(k=>!allowed.includes(k)))throw Error('Argumento desconhecido');
 if(operation==='plan'&&Boolean(flags['--editorial-file'])!==Boolean(flags['--external-reference']))throw Error('Arquivo editorial e referência externa são obrigatórios em conjunto');
 if(flags['--editorial-approval']&&!flags['--editorial-file'])throw Error('Aprovação editorial sem arquivo literal');
 if(operation==='snapshot'&&typeof flags['--out']==='string'){
  diagnosticPath=flags['--diagnostic-log']??(flags['--emulator']?undefined:join(dirname(flags['--out']),'snapshot-diagnostic.jsonl'));
  if(diagnosticPath)await snapshotStep('diagnostic-log',()=>assertPrivateDirectory(dirname(diagnosticPath)));
 }
 const mode=flags['--emulator']?'emulator':'production';if(mode==='production'&&operation==='snapshot')requireProductionSnapshotScope(operation,flags['--lesson']);else requireAdminMode(mode);
 if(mode==='production'&&['publish','restore'].includes(operation)&&!PRODUCTION_PUBLICATION_ENABLED)throw Error('Escrita real bloqueada');
 diagnosticStage='local-files';if(typeof flags['--out']!=='string'||existsSync(flags['--out']))throw Error('Pasta de saída deve ser nova');
 if(mode==='production')assertPrivateDirectory(dirname(flags['--out']));
 if(operation==='snapshot'||mode==='production'){
  const probe=join(dirname(flags['--out']),`.athena-write-probe-${randomUUID()}`);
  writeFileSync(probe,'',{flag:'wx',mode:0o600});unlinkSync(probe);
 }
 const fileFlag={plan:'--input',publish:'--plan',restore:'--receipt'}[operation];const document=fileFlag?parseStrict(readFileSync(flags[fileFlag],'utf8')):null;
 const editorialContext=flags['--editorial-file']?{raw:readFileSync(flags['--editorial-file'],'utf8'),approval:flags['--editorial-approval']?parseStrict(readFileSync(flags['--editorial-approval'],'utf8')):null,externalApprovalReference:flags['--external-reference']}:null;
 const id=operation==='snapshot'?flags['--lesson']:document.lessonId;
 let app,db,identity;
 try{
  diagnosticStage='configuration';
  if(mode==='emulator'){
   if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8189'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099')throw Error('Exige ambos os emuladores fixos');
   const token=process.env.ATHENA_SNAPSHOT_ADMIN_TOKEN;if(!token)throw Error('Sessão local ausente');
   diagnosticStage='sdk-init';app=initializeApp({projectId:'demo-athena-question-import'},'admin-cli-local');
   diagnosticStage='authentication';const verified=await getAuth(app).verifyIdToken(token,true);
   diagnosticStage='authorization';
   if(!verified.email_verified||!isCeoEmail(verified.email))throw Error('Administrador não autorizado');
   identity={id:`firebase:${verified.uid}`,authorized:true};
   diagnosticStage='sdk-init';db=new Firestore({projectId:'demo-athena-question-import',databaseId:ATHENA_TARGET.databaseId,host:'127.0.0.1:8189',ssl:false,credentials:{client_email:'synthetic@example.invalid',private_key:'unused-emulator'}});
  }else{
   // Other operations remain behind requireAdminMode and both write guards.
   if(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw Error('Contexto remoto incompatível');
   diagnosticStage='authentication';const administrative=await authenticateAdminAdc({isAuthorizedEmail:isCeoEmail});
   identity=administrative.identity;
   // Ponte de formato sobre a mesma ADC validada; nenhum novo login/credencial.
   diagnosticStage='sdk-init';db=new Firestore({projectId:ATHENA_TARGET.projectId,databaseId:ATHENA_TARGET.databaseId,authClient:createGrpcCompatibleAdcClient(administrative.client)});
  }
  if(operation==='snapshot')disableSnapshotReadRetries(db);
  diagnosticStage='adapter-scope';const adapter=mode==='production'&&operation==='snapshot'?createProductionSnapshotAdapter(db,id):createAdminAdapter(db,id,mode);
  const confirm=async context=>{if(mode==='production'&&!process.stdin.isTTY)throw Error('Confirmação interativa obrigatória');const rl=createInterface({input:process.stdin,output:process.stderr});try{return await rl.question(`Aprovação operacional ${context.approvalReference}. Digite exatamente: ${context.expected}\n`);}finally{rl.close();}};
  const operations=createAdminOperations({adapter,authenticate:async()=>identity,confirm});
  diagnosticStage='snapshot';const result=operation==='snapshot'?await operations.snapshot(id,{auditOnly:flags['--audit-only']===true}):operation==='plan'?await operations.plan(document,{editorialContext}):await operations[operation](document,flags['--approval-reference']);
  diagnosticStage='local-files';
  mkdirSync(flags['--out']);const save=(name,value)=>writeFileSync(join(flags['--out'],name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  if(operation==='snapshot'){save('snapshot.json',result.snapshot);save('manifest.json',result.manifest);}else{save(operation==='plan'?'plan.json':operation==='publish'?'receipt.json':'restoration.json',result);}
  process.stdout.write(JSON.stringify({ok:true,operation,lessonId:id,...(flags['--audit-only']?{purpose:'audit-only',importReady:false,publicationReady:false,administrativeConflicts:result.snapshot.administrativeAssessment.conflictsPresent}:{}),...(operation==='plan'?{planSha256:result.planSha256,reportFile:join(flags['--out'],'plan.json')}:{}),production:mode==='production'})+'\n');
 }finally{if(db)await db.terminate();if(app)await deleteApp(app);}
}
main().catch(error=>{
 if(process.argv[2]==='snapshot'){
  const diagnostic=error instanceof SnapshotDiagnosticError?error:new SnapshotDiagnosticError(diagnosticStage,error);
  let logged=false;if(diagnosticPath){try{saveDiagnostic(diagnosticPath,diagnostic);logged=true;}catch{}}
  const schema=diagnosticRecord(diagnostic).schema;
  process.stderr.write(`${diagnostic.message}; etapa=${diagnostic.stage}; logProtegido=${logged?'registrado':'não registrado'}${schema?`; regra=${schema.ruleCode}; campo=${schema.field}; esperado=${schema.expectedTypeOrRule}; encontrado=${schema.foundType}${schema.violations?.length?`; detalhes=${JSON.stringify(schema.violations)}`:''}`:''}. Nenhuma credencial foi registrada.\n`);
 }else process.stderr.write('Operação recusada: confira bloqueio de produção, autenticação, argumentos, integridade, conflitos, confirmação e pasta nova. Nenhuma credencial foi registrada.\n');
 process.exitCode=1;
});
