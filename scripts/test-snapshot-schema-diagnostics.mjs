import test from 'node:test';
import assert from 'node:assert/strict';
import {Timestamp} from '@google-cloud/firestore';
import {syntheticFixture} from './revised-question-import-fixtures.mjs';
import {createProductionSnapshotAdapter} from './admin-question-adapter.mjs';
import {createAdminOperations} from './admin-reviewed-questions-core.mjs';
import {ATHENA_TARGET} from './publish-reviewed-questions.mjs';
import {annotateSnapshotSchemaFailure,schemaDetailOf,schemaType} from './snapshot-schema-diagnostics.mjs';
import {diagnosticRecord} from './snapshot-diagnostics.mjs';
import {embedded} from './import-reviewed-questions.mjs';

// Backend inteiramente em memória: nenhum SDK ou acesso de rede nesta suíte.
export function syntheticSnapshotBackend(mutate=()=>{}){
 const lesson=syntheticFixture().snapshot.lesson;mutate(lesson);
 let reads=0;
 const db={...ATHENA_TARGET,_settings:{},collection:name=>({doc:id=>({path:`${name}/${id}`}),where:()=>({query:name})}),runTransaction:async(callback,options)=>{
  assert.deepEqual(options,{readOnly:true});reads++;
  return callback({get:async ref=>ref.path?{exists:ref.path==='homologated_lessons/day_1_part_0',data:()=>lesson,updateTime:new Timestamp(1,0)}:{docs:[]}});
 }};
 return {lesson,reads:()=>reads,core:createAdminOperations({adapter:createProductionSnapshotAdapter(db,'day_1_part_0'),authenticate:async()=>({id:'synthetic',authorized:true}),confirm:async()=>assert.fail('confirmation must not run')})};
}
const cases=[
 ['id ausente',l=>delete l.id,'LESSON_ID_MISSING','lesson.id'],
 ['versão ausente',l=>delete l.version,'LESSON_VERSION_MISSING','lesson.version'],
 ['versão string',l=>l.version='1','LESSON_VERSION','lesson.version'],
 ['status inválido',l=>l.status='draft','LESSON_IDENTITY','lesson'],
 ['challenge ausente',l=>delete l.challenge,'CHALLENGE_REQUIRED','lesson.challenge'],
 ['questions ausente',l=>delete l.challenge.questions,'CHALLENGE_REQUIRED','lesson.challenge.questions'],
 ['content inválido',l=>l.content=null,'CONTENT_REQUIRED','lesson.content'],
 ['questões vazias',l=>l.challenge.questions=[],'QUESTIONS_REQUIRED','lesson.challenge.questions'],
 ['texto inválido',l=>l.challenge.questions[0].text=42,'QUESTION_TEXT','lesson.challenge.questions.0.text'],
 ['justificativa inválida',l=>l.challenge.questions[0].explanation=42,'QUESTION_TEXT','lesson.challenge.questions.0.explanation'],
 ['alternativas inválidas',l=>l.challenge.questions[0].options=['A'],'QUESTION_OPTIONS','lesson.challenge.questions.0.options'],
 ['gabarito inválido',l=>l.challenge.questions[0].correctIndex=8,'QUESTION_ANSWER','lesson.challenge.questions.0.correctIndex'],
 ['id duplicado',l=>l.challenge.questions[1].id=l.challenge.questions[0].id,'QUESTION_DUPLICATE_ID','lesson.challenge.questions.1.id'],
 ['id inválido',l=>l.challenge.questions[0].id=42,'QUESTION_ID','lesson.challenge.questions.0.id'],
 ['disciplina inválida',l=>l.challenge.questions[0].subject=42,'QUESTION_SUBJECT','lesson.challenge.questions.0.subject'],
 ['marcador ausente',l=>l.content=l.content.replace('[ATHENA_CHALLENGE]',''),'CONTENT_MARKER','lesson.content'],
 ['marcador duplicado',l=>l.content+='[ATHENA_CHALLENGE]','CONTENT_MARKER','lesson.content'],
 ['marcador ambíguo',l=>l.content+='[athena_challenge]','CONTENT_MARKER','lesson.content'],
 ['JSON ausente',l=>{const s=embedded(l.content);l.content=l.content.slice(0,s.start)+'[]'+l.content.slice(s.end);},'CONTENT_JSON_MISSING','lesson.content'],
 ['JSON incompleto',l=>{const s=embedded(l.content);l.content=l.content.slice(0,s.start)+'{'+l.content.slice(s.end);},'CONTENT_JSON_INCOMPLETE','lesson.content'],
 ['chaves JSON duplicadas',l=>l.content=l.content.replace('"questions":','"questions":[],"questions":'),'STRICT_JSON','lesson.content'],
 ['posição incompatível',l=>{const c=l.content,s=embedded(c),m=c.indexOf('[ATHENA_CHALLENGE]');l.content=c.slice(m,s.end)+'\n'+c.slice(0,m)+c.slice(s.end);},'CONTENT_LAYOUT','lesson.content'],
 ['rodapé legado desconhecido',l=>{const c=l.content,s=embedded(c);l.content=c.slice(0,c.indexOf('[ATHENA_CHALLENGE]'))+c.slice(s.end)+'\n[ATHENA_CHALLENGE]\n'+c.slice(s.start,s.end)+'\nUNKNOWN';},'LEGACY_SUFFIX','lesson.content'],
 ['bloco ausente',l=>l.content=l.content.replace('[BLOCK_2]',''),'CONTENT_BLOCK_ORDER','lesson.content'],
 ['blocks desconhecidos',l=>l.blocks=[{}],'BLOCKS_TYPE','lesson.blocks'],
 ['blocks divergentes',l=>l.blocks=Array(6).fill('synthetic'),'BLOCKS_MISMATCH','lesson.blocks'],
 ['representações divergentes',l=>l.challenge.questions[0].explanation+=' synthetic','CHALLENGE_MISMATCH','lesson.challenge'],
 ['Timestamp preservado e rejeitado',l=>l.updatedAt=new Timestamp(1,0),'FIRESTORE_TYPE','lesson.updatedAt'],
 ['Date rejeitado',l=>l.updatedAt=new Date(0),'FIRESTORE_TYPE','lesson.updatedAt'],
 ['metadado desconhecido sensível',l=>l['DO-NOT-LOG-SECRET']=new Date(0),'FIRESTORE_TYPE','lesson.<additional-field>'],
 ['número inseguro',l=>l.version=Number.MAX_SAFE_INTEGER+1,'UNSAFE_NUMBER','lesson.version'],
 ['documento excessivo',l=>l.otherMetadata.extra='x'.repeat(910000),'DOCUMENT_SIZE','lesson']
];
for(const [name,mutate,rule,field] of cases)test(`schema: ${name}`,async()=>{
 const f=syntheticSnapshotBackend(mutate),before=JSON.stringify(f.lesson);
 await assert.rejects(f.core.snapshot('day_1_part_0'),error=>{
  const record=diagnosticRecord(error);assert.equal(record.schema?.ruleCode,'ATHENA_SCHEMA_'+rule);assert.equal(record.schema.field,field);
  assert.ok(!JSON.stringify(record).includes('DO-NOT-LOG-SECRET'));assert.ok(!JSON.stringify(record).includes('Justificativa original'));return true;
 });assert.equal(f.reads(),1);assert.equal(JSON.stringify(f.lesson),before);
});
test('schema: canônico e legado preservam integralmente os dados e campos opcionais ausentes',async()=>{
 for(const legacy of [false,true]){const f=syntheticSnapshotBackend(l=>{delete l.approvedAt;if(legacy){const c=l.content,s=embedded(c);l.content=c.slice(0,c.indexOf('[ATHENA_CHALLENGE]'))+c.slice(s.end)+'\n[ATHENA_CHALLENGE]\n'+c.slice(s.start,s.end);}});const r=await f.core.snapshot('day_1_part_0');assert.deepEqual(r.snapshot.lesson,f.lesson);}
});
test('schema: diagnóstico não converte tipos especiais nem registra mensagens arbitrárias',()=>{
 const state={lesson:{updatedAt:new Timestamp(1,0)}};
 const e=annotateSnapshotSchemaFailure(Error('Valor Firestore não JSON em $.lesson.updatedAt; exige codec de backup antes da publicação'),state);
 assert.equal(schemaDetailOf(e).foundType,'Timestamp');assert.equal(schemaType(Buffer.from('secret')),'Bytes');
 const unknown=annotateSnapshotSchemaFailure(Error('SECRET arbitrary provider detail'),state);assert.ok(!JSON.stringify(schemaDetailOf(unknown)).includes('SECRET'));
});
