import {embedded} from './import-reviewed-questions.mjs';
const details=new WeakMap();
export const schemaDetailOf=error=>details.get(error)??null;
export function schemaType(value){
 if(value===undefined)return 'missing';if(value===null)return 'null';if(Array.isArray(value))return 'array';
 if(value instanceof Date)return 'Date';if(Buffer.isBuffer(value))return 'Bytes';
 if(typeof value==='object'){const name=value.constructor?.name;if(['Timestamp','GeoPoint','DocumentReference'].includes(name))return name;return Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null?'object':'non-json-object';}
 return ['string','number','boolean','bigint','function','symbol'].includes(typeof value)?typeof value:'unknown';
}
// Este catálogo descreve rejeições dos validadores existentes; não decide aceitação.
const RULES=[
 [/Snapshot de revisões por bloco incompleto/,'SECTION_SCOPES','sections','six-exact-scopes'],
 [/Consulta de revisões por bloco incompleta/,'SECTION_REVIEWS','sections[].reviews','array'],
 [/Revisão por bloco pendente\/desconhecida/,'SECTION_REVIEW_STATE','sections[].reviews[]','unique-id-correct-scope-terminal-status'],
 [/Revisões por bloco sem índice/,'SECTION_INDEX_MISSING','sections[].index','index-when-reviews-exist'],
 [/Lock\/índice desconhecido de revisão por bloco/,'SECTION_LOCK','sections[].index','correct-scope-no-processing-lock'],
 [/Índice por bloco incompleto/,'SECTION_INDEX_FIELDS','sections[].index','latestReviewId-and-latestStatus-present'],
 [/Índice por bloco inconsistente/,'SECTION_INDEX_STATE','sections[].index','null-latest-status-without-reviews'],
 [/Última revisão por bloco ausente\/inconsistente/,'SECTION_LATEST_REVIEW','sections[].index','latest-review-matches-query'],
 [/Estado das revisões não verificado/,'REVIEWS_UNCHECKED','reviewState','checked-true-and-reviews-array'],
 [/Revisão inválida\/duplicada/,'REVIEW_IDENTITY','reviewState.reviews[]','unique-id-correct-lesson'],
 [/Revisão administrativa em andamento ou desconhecida/,'REVIEW_PENDING','reviewState.reviews[].status','approved-or-rejected'],
 [/Revisões existentes sem índice confiável/,'REVIEW_INDEX_MISSING','reviewState.index','index-when-reviews-exist'],
 [/Índice desconhecido ou processamento em andamento/,'REVIEW_LOCK','reviewState.index','correct-lesson-processingReviewId-null'],
 [/Índice incompleto/,'REVIEW_INDEX_FIELDS','reviewState.index','latestReviewId-and-latestStatus-present'],
 [/Lock residual de revisão/,'REVIEW_RESIDUAL_LOCK','reviewState.index.processingStartedAt','null-or-missing'],
 [/Hash aprovado do índice diverge/,'REVIEW_APPROVED_HASH','reviewState.index.approvedHash','catalog-hash-match'],
 [/Índice inconsistente/,'REVIEW_INDEX_STATE','reviewState.index','null-latest-status-without-reviews'],
 [/Última revisão ausente\/inconsistente/,'REVIEW_LATEST','reviewState.index','latest-review-matches-query'],
 [/Identidade\/status da aula divergente/,'LESSON_IDENTITY','lesson','canonical-id-day-part-approved-status'],
 [/Versão original divergente\/ausente/,'LESSON_VERSION','lesson.version','positive-integer-matching-original'],
 [/questões ausentes/,'QUESTIONS_REQUIRED','lesson.challenge.questions','nonempty-array'],
 [/enunciado\/justificativa inválidos/,'QUESTION_TEXT','lesson.challenge.questions[].text','nonempty-text-and-explanation'],
 [/alternativas inválidas/,'QUESTION_OPTIONS','lesson.challenge.questions[].options','array-two-to-five-nonempty-strings'],
 [/gabarito fora do intervalo/,'QUESTION_ANSWER','lesson.challenge.questions[].correctIndex','integer-within-options-range'],
 [/identificador duplicado/,'QUESTION_DUPLICATE_ID','lesson.challenge.questions[].id','unique-optional-id'],
 [/origem: id inválido/,'QUESTION_ID','lesson.challenge.questions[].id','nonempty-string-if-present'],
 [/origem: subject inválido/,'QUESTION_SUBJECT','lesson.challenge.questions[].subject','nonempty-string-if-present'],
 [/Desafio estruturado ausente|challenge ou content ausente/,'CHALLENGE_REQUIRED','lesson.challenge','object-with-questions-array'],
 [/Desafio estruturado e conteúdo divergentes/,'CHALLENGE_MISMATCH','lesson.challenge','equal-to-embedded-json'],
 [/Conteúdo ausente/,'CONTENT_REQUIRED','lesson.content','string'],
 [/Marcador ausente ou duplicado|Marcador de desafio ambíguo/,'CONTENT_MARKER','lesson.content','one-exact-challenge-marker'],
 [/Blocos ausentes, duplicados ou fora de ordem|Blocos fonte ausentes/,'CONTENT_BLOCK_ORDER','lesson.content','six-exact-ordered-block-markers'],
 [/Desafio fora do bloco 5 ou rodapé legado/,'CONTENT_LAYOUT','lesson.content','canonical-block5-or-legacy-footer'],
 [/JSON do desafio ausente/,'CONTENT_JSON_MISSING','lesson.content','json-object-after-marker'],
 [/JSON do desafio incompleto/,'CONTENT_JSON_INCOMPLETE','lesson.content','complete-json-before-layout-boundary'],
 [/Rodapé legado com conteúdo após JSON desconhecido/,'LEGACY_SUFFIX','lesson.content','whitespace-only-after-legacy-json'],
 [/blocks possui formato não suportado/,'BLOCKS_TYPE','lesson.blocks','six-strings-or-absent'],
 [/blocks diverge/,'BLOCKS_MISMATCH','lesson.blocks','matching-raw-or-display-blocks'],
 [/Data ISO UTC inválida/,'UTC_DATE','capturedAt','valid-iso-utc-string'],
 [/campos ausentes ou desconhecidos/,'CONTRACT_KEYS','envelope','exact-contract-keys'],
 [/JSON|String JSON|Chave JSON|Separador JSON|Conteúdo extra após JSON/,'STRICT_JSON','lesson.content','strict-json-no-duplicates-safe-numbers-depth-size'],
 [/excede limite|900.000 bytes/,'DOCUMENT_SIZE','lesson','at-most-900000-bytes'],
 [/Hash original divergente|Hash inválido/,'BASELINE_HASH','lesson','official-original-hash-match']
];
const KNOWN_KEYS=new Set(['lesson','challenge','questions','content','blocks','version','id','day','part','status','subject','topic','approvedAt','updatedAt','createdAt','reviewState','sections','index','reviews','processingReviewId','processingStartedAt','latestReviewId','latestStatus','approvedHash','readVersions','seconds','nanoseconds','text','explanation','options','correctIndex']);
function safePath(path){const parts=path.split('.');return parts.map((k,n)=>KNOWN_KEYS.has(k)||(/^\d+$/.test(k)&&['questions','options','blocks','sections','reviews'].includes(parts[n-1]))?k:'<additional-field>').join('.');}
function valueAt(state,path){return path.split('.').reduce((v,k)=>k.endsWith('[]')?v?.[k.slice(0,-2)]?.[0]:v?.[k],state);}
// Apenas diagnóstico: não altera a lista de estados autorizados pelo publicador.
export function reviewRecordViolations(record,scopeId,previous=[]){
 const result=[];
 const add=(rule,field,expected,value)=>result.push({ruleCode:`ATHENA_SCHEMA_REVIEW_RECORD_${rule}`,field,expectedTypeOrRule:expected,foundType:schemaType(value)});
 if(!record||typeof record!=='object'||Array.isArray(record)){add('TYPE','','object',record);return result;}
 if(!Object.hasOwn(record,'id'))add('ID_MISSING','id','nonempty-unique-string',undefined);
 else if(typeof record.id!=='string')add('ID_TYPE','id','string',record.id);
 else if(!record.id)add('ID_EMPTY','id','nonempty-string',record.id);
 else if(previous.some(r=>r?.id===record.id))add('ID_DUPLICATE','id','unique-within-scope',record.id);
 if(record.lessonId!==scopeId)add('SCOPE','lessonId','exact-requested-scope',record.lessonId);
 if(!Object.hasOwn(record,'status'))add('STATUS_MISSING','status','approved-or-rejected',undefined);
 else if(typeof record.status!=='string')add('STATUS_TYPE','status','string',record.status);
 else if(!['approved','rejected'].includes(record.status)){
  const rule=['queued','processing','pending_approval','pending'].includes(record.status)?'STATUS_PENDING':['failed','uncertain_failure'].includes(record.status)?'STATUS_NONTERMINAL':'STATUS_UNKNOWN';
  add(rule,'status','approved-or-rejected',record.status);
 }
 return result;
}
function sectionIssue(s){
 if(!s||typeof s!=='object')return ['SECTION_SCOPES',''];
 if(!Array.isArray(s.reviews))return ['SECTION_REVIEWS','.reviews'];
 const seen=new Set();
 for(let n=0;n<s.reviews.length;n++){const r=s.reviews[n];if(!r||typeof r.id!=='string'||!r.id||seen.has(r.id)||r.lessonId!==s.scopeId||!['approved','rejected'].includes(r.status))return ['SECTION_REVIEW_STATE',`.reviews.${n}`];seen.add(r.id);}
 const i=s.index;
 if(i===null)return s.reviews.length?['SECTION_INDEX_MISSING','.index']:null;
 if(i?.lessonId!==s.scopeId||i.processingReviewId!==null||i.processingStartedAt!=null)return ['SECTION_LOCK','.index'];
 if(!Object.hasOwn(i,'latestReviewId')||!Object.hasOwn(i,'latestStatus'))return ['SECTION_INDEX_FIELDS','.index'];
 if(i.latestReviewId===null)return i.latestStatus!==null||s.reviews.length?['SECTION_INDEX_STATE','.index']:null;
 return s.reviews.some(r=>r.id===i.latestReviewId&&r.status===i.latestStatus)?null:['SECTION_LATEST_REVIEW','.index'];
}
export function annotateSnapshotSchemaFailure(error,state){
 const message=String(error?.message??'');let rule=RULES.find(([pattern])=>pattern.test(message));
 let code=rule?.[1]??'UNMAPPED',path=rule?.[2]??'envelope',expected=rule?.[3]??'existing-validator-rule',found=valueAt(state,path);
 if(code==='CHALLENGE_REQUIRED'){
  if(!state.lesson?.challenge){path='lesson.challenge';expected='object-with-questions-array';}
  else if(!Array.isArray(state.lesson.challenge.questions)){path='lesson.challenge.questions';expected='array';}
  else {code='CONTENT_REQUIRED';path='lesson.content';expected='string';}
  found=valueAt(state,path);
 }
 if(message==='updateTime confiável ausente'){
  if(typeof state.lesson?.id!=='string'){code='LESSON_ID_MISSING';path='lesson.id';expected='canonical-string';found=state.lesson?.id;}
  else{code='UPDATE_TIME';path='readVersions';expected='seconds-and-integer-nanoseconds';found=state.readVersions;}
 }
 if(code==='CONTRACT_KEYS'&&message.startsWith('reviewState:')){path='reviewState';found=state.reviewState;}
 if(code==='UNMAPPED'&&Array.isArray(state.sections)&&state.sections.some(s=>s===null||typeof s!=='object')){code='SECTION_SCOPES';path='sections';expected='six-object-scopes';found=state.sections;}
 if(code==='UNMAPPED'&&state.sections?.some?.(s=>Array.isArray(s?.reviews)&&s.reviews.some(r=>r===null||typeof r!=='object'))){code='SECTION_REVIEW_STATE';path='sections[].reviews[]';expected='review-object';found=null;}
 if(/transferência: campos ausentes ou desconhecidos/.test(message)&&state.lesson?.version===undefined){code='LESSON_VERSION_MISSING';path='lesson.version';expected='positive-integer';found=undefined;}
 if(/Valor Firestore não JSON em /.test(message)){code='FIRESTORE_TYPE';const raw=message.split(' em ')[1]?.split(';')[0]??'$';const rawPath=raw.replace(/^\$\.?/,'');path=safePath(rawPath);found=valueAt(state,rawPath);expected='lossless-json-native-type';}
 if(state.lesson?.version===undefined&&/originalVersion/.test(message)){code='LESSON_VERSION_MISSING';path='lesson.version';expected='positive-integer';found=undefined;}
 if(/Número não seguro/.test(message)){code='UNSAFE_NUMBER';const raw=message.slice(message.indexOf(':')+1).trim().replace(/^\$\.?/,'');path=safePath(raw);expected='finite-safe-number';found=valueAt(state,raw);}
 if(code.startsWith('SECTION_')&&Array.isArray(state.sections)){
  const n=state.sections.findIndex(s=>sectionIssue(s)?.[0]===code);
  if(n>=0){path=`sections.${n}${sectionIssue(state.sections[n])[1]}`;found=valueAt(state,path);}
 }
 if(['REVIEW_PENDING','REVIEW_IDENTITY'].includes(code)&&Array.isArray(state.reviewState?.reviews)){
  const rs=state.reviewState.reviews,seen=new Set();let n=-1;
  for(let i=0;i<rs.length;i++){const r=rs[i];const bad=code==='REVIEW_PENDING'?!['approved','rejected'].includes(r?.status):!r||typeof r.id!=='string'||!r.id.trim()||r.lessonId!==state.lesson?.id||seen.has(r.id);if(bad){n=i;break;}seen.add(r?.id);}
  if(n>=0){path=`reviewState.reviews.${n}${code==='REVIEW_PENDING'?'.status':''}`;found=valueAt(state,path);}
 }
 if(code.startsWith('QUESTION_')){
  const qs=state.lesson?.challenge?.questions;
  if(Array.isArray(qs)){
   let n=qs.findIndex((q,i)=>code==='QUESTION_TEXT'?typeof q?.text!=='string'||!q.text.trim()||typeof q?.explanation!=='string'||!q.explanation.trim():code==='QUESTION_OPTIONS'?!Array.isArray(q?.options)||q.options.length<2||q.options.length>5||q.options.some(x=>typeof x!=='string'||!x.trim()):code==='QUESTION_ANSWER'?!Number.isInteger(q?.correctIndex)||q.correctIndex<0||q.correctIndex>=q.options?.length:code==='QUESTION_DUPLICATE_ID'?q?.id!==undefined&&qs.slice(0,i).some(p=>p.id===q.id):code==='QUESTION_ID'?q&&Object.hasOwn(q,'id')&&(typeof q.id!=='string'||!q.id.trim()):code==='QUESTION_SUBJECT'?q?.subject!==undefined&&(typeof q.subject!=='string'||!q.subject.trim()):false);
   if(n>=0){path=path.replace('questions[]',`questions.${n}`);if(code==='QUESTION_TEXT'&&typeof qs[n]?.text==='string'&&qs[n].text.trim())path=path.replace(/\.text$/,'.explanation');found=valueAt(state,path);}
  }
 }
 let layout='unknown';try{layout=embedded(state.lesson?.content).layout;}catch{}
 let violations;
 if(code==='SECTION_REVIEW_STATE'){
  const match=/^sections\.(\d+)\.reviews\.(\d+)$/.exec(path);
  if(match){const s=state.sections[+match[1]],n=+match[2];violations=reviewRecordViolations(s.reviews[n],s.scopeId,s.reviews.slice(0,n)).map(v=>({...v,field:path+(v.field?'.'+v.field:'')}));}
 }
 const detail=Object.freeze({ruleCode:'ATHENA_SCHEMA_'+code,field:path,expectedTypeOrRule:expected,foundType:schemaType(found),contentLayout:layout,legacySupported:layout==='legacy-after-block-6',...(violations?{violations}:{})});
 details.set(error,detail);return error;
}
