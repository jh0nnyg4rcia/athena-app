import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { embedded, dryRun, sha256, contentSha256 } from './import-reviewed-questions.mjs';
import { syntheticFixture } from './revised-question-import-fixtures.mjs';
import { previewPublication } from './publish-reviewed-questions.mjs';
function rehash(f) { f.input.originalContentSha256=contentSha256(f.snapshot.lesson.content); f.input.originalLessonSha256=sha256(f.snapshot.lesson); }
function legacy(f) { const c=f.snapshot.lesson.content, s=embedded(c), marker=c.indexOf('[ATHENA_CHALLENGE]'); f.snapshot.lesson.content=c.slice(0,marker)+c.slice(s.end)+'\n[ATHENA_CHALLENGE]\n'+c.slice(s.start,s.end)+'\n'; rehash(f); }
for (const layout of ['canonical','legacy']) test(`${layout}: substituição exclusiva de folhas, preserva escapes e Markdown`,()=>{
 const f=syntheticFixture(); if(layout==='legacy') legacy(f);
 const before=f.snapshot.lesson.content; const result=dryRun(f.snapshot,f.input); assert.equal(result.ok,true);
 const expected=before.replace('"correctIndex": 0','"correctIndex": 1').replace(JSON.stringify(f.input.questions[0].original.explanation),JSON.stringify(f.input.questions[0].revised.explanation));
 assert.equal(result.proposedLesson.content,expected); assert.deepEqual(result.proposedLesson.challenge.questions[1],f.snapshot.lesson.challenge.questions[1]);
 assert.equal(embedded(result.proposedLesson.content).layout,layout==='legacy'?'legacy-after-block-6':'canonical-block-5');
});
for(const kind of ['duplicate','case','unknown-block','trailing']) test(`legado rejeita ${kind}`,()=>{
 const f=syntheticFixture(); legacy(f); if(kind==='duplicate')f.snapshot.lesson.content+='[ATHENA_CHALLENGE]';
 if(kind==='case')f.snapshot.lesson.content=f.snapshot.lesson.content.replace('[BLOCK_1]','[block_1]');
 if(kind==='unknown-block')f.snapshot.lesson.content+='[BLOCK_7]';
 if(kind==='trailing')f.snapshot.lesson.content+='rodapé desconhecido'; rehash(f); assert.equal(dryRun(f.snapshot,f.input).ok,false);
});
const seeds=JSON.parse(readFileSync('src/data/homologatedSeeds.json','utf8'));
for(const seed of Object.values(seeds)) test(`${seed.id}: plano legado e blocks reais locais`,async()=>{
 const f=syntheticFixture(); f.snapshot.lesson={...structuredClone(seed),version:1,status:'approved'};
 f.input.lessonId=seed.id; f.input.originalVersion=1;
 f.input.questions=seed.challenge.questions.map((q,index)=>({index,originalSha256:sha256(q),original:structuredClone(q),revised:structuredClone(q),approvedChanges:[]}));
 f.input.questions[0].revised.explanation+=' [TESTE LOCAL SINTÉTICO]'; f.input.questions[0].approvedChanges=[{field:'explanation',reason:'Teste local; sem publicação'}]; rehash(f);
 const state={lesson:f.snapshot.lesson,reviewState:f.snapshot.reviewState,sections:Array.from({length:6},(_,n)=>({scopeId:`${seed.id}_block_${n}`,index:null,reviews:[]}))};
 const plan=await previewPublication({mode:'mock',target:{projectId:'demo-athena-question-import',databaseId:'synthetic'},readState:async()=>state},f.input);
 assert.ok(['display-without-json','display-exact-whitespace'].includes(plan.blocksMode)); assert.deepEqual(plan.proposed.blocks,seed.blocks);
 assert.deepEqual(embedded(plan.proposed.content).challenge,plan.proposed.challenge); assert.deepEqual(plan.proposed.challenge.questions.slice(1),seed.challenge.questions.slice(1));
});
test('legado: blocks brutos sincronizam somente o sexto bloco', async()=>{
 const f=syntheticFixture(); legacy(f); const c=f.snapshot.lesson.content;const ms=[...c.matchAll(/\[BLOCK_\d+\]/g)];f.snapshot.lesson.blocks=ms.map((m,i)=>c.slice(m.index+m[0].length,ms[i+1]?.index??c.length).trim());rehash(f);
 const state={lesson:f.snapshot.lesson,reviewState:f.snapshot.reviewState,sections:Array.from({length:6},(_,n)=>({scopeId:`${f.input.lessonId}_block_${n}`,index:null,reviews:[]}))};
 const plan=await previewPublication({mode:'mock',target:{projectId:'demo-athena-question-import',databaseId:'synthetic'},readState:async()=>state},f.input);
 assert.equal(plan.blocksMode,'raw-with-json');assert.deepEqual(plan.proposed.blocks.slice(0,5),state.lesson.blocks.slice(0,5));assert.notEqual(plan.proposed.blocks[5],state.lesson.blocks[5]);
});
test('alternativa aprovada preserva escapes e espaços em todos os outros valores',()=>{
 const f=syntheticFixture();f.input.questions[0].revised.options[1]='Nova alternativa "B"\nsegunda linha \\ literal';f.input.questions[0].approvedChanges.push({field:'options[1]',reason:'Teste'});
 const before=f.snapshot.lesson.content;const r=dryRun(f.snapshot,f.input);assert.equal(r.ok,true);
 const expected=before.replace('"correctIndex": 0','"correctIndex": 1').replace(JSON.stringify(f.input.questions[0].original.explanation),JSON.stringify(f.input.questions[0].revised.explanation)).replace(JSON.stringify('Alternativa B'),JSON.stringify(f.input.questions[0].revised.options[1]));assert.equal(r.proposedLesson.content,expected);assert.deepEqual(embedded(r.proposedLesson.content).challenge,r.proposedLesson.challenge);
});
