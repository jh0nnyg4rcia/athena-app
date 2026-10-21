import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analyzeEditorialTransfer,previewEditorialTransfer,convertApprovedEditorial} from './editorial-transfer.mjs';
import {sha256,contentSha256,embedded,dryRun} from './import-reviewed-questions.mjs';
const at='2026-10-12T12:00:00Z';
function fixture(){
 const questions=Array.from({length:10},(_,n)=>({text:`Questão sintética ${n}`,options:['A sintética','B sintética'],correctIndex:0,explanation:'Original sintética'}));
 const challenge={questions,metadata:{preserve:true}};
 const content=Array.from({length:6},(_,n)=>`[BLOCK_${n+1}]\nTexto sintético ${n}\n${n===4?'[ATHENA_CHALLENGE]\n'+JSON.stringify(challenge,null,2)+'\n':''}`).join('\n');
 const lesson={id:'day_1_part_3',day:1,part:3,version:1,status:'approved',content,challenge,approvedAt:1,subject:'Sintética',metadata:{keep:true}};
 const state={lesson,reviewState:{checked:true,index:null,reviews:[]},sections:Array.from({length:6},(_,n)=>({scopeId:`${lesson.id}_block_${n}`,index:null,reviews:[]})),readVersions:{}};
 const editorial={format:'athena-editorial-transfer/v1',lessonId:lesson.id,subject:lesson.subject,sourceVersion:1,originalQuestions:structuredClone(questions),revisedQuestions:structuredClone(questions),approvedChanges:[{questionIndex:0,field:'explanation',approvalStatus:'approved',reason:'Razão sintética'}]};
 editorial.revisedQuestions[0].explanation='Revisada sintética\n\nFormatação preservada.';
 const audit={reference:'Auditoria sintética',approvedBy:'CEO sintético',approvedAt:at,approvalReference:'Aprovação sintética',sources:['https://example.invalid/synthetic']};
 return {editorial,state,audit};
}
test('approved conversion uses official hashes, exact wording and unchanged questions',()=>{const f=fixture(),before=sha256(f);const input=convertApprovedEditorial(f.editorial,f.state,f.audit);assert.equal(input.originalLessonSha256,sha256(f.state.lesson));assert.equal(input.originalContentSha256,contentSha256(f.state.lesson.content));assert.equal(input.questions[0].revised.explanation,f.editorial.revisedQuestions[0].explanation);assert.deepEqual(input.questions[1].original,input.questions[1].revised);assert.equal(sha256(f),before);const r=dryRun({schemaVersion:'athena-question-snapshot/v1',capturedAt:at,lesson:f.state.lesson,reviewState:f.state.reviewState},input);assert.equal(r.ok,true);assert.deepEqual(embedded(r.proposedLesson.content).challenge.questions,f.editorial.revisedQuestions);assert.deepEqual(r.proposedLesson.metadata,f.state.lesson.metadata);});
test('pending changes produce only a technical report',()=>{const f=fixture();f.editorial.approvedChanges[0].approvalStatus='pending';const r=previewEditorialTransfer(f.editorial,f.state,at);assert.equal(r.technicalValid,true);assert.equal(r.approvalReady,false);assert.equal(r.publicationReady,false);assert.equal(r.input,undefined);assert.throws(()=>convertApprovedEditorial(f.editorial,f.state,f.audit),/APPROVAL_PENDING/);});
test('constitutional cannot be promoted by matching fields or a forged status',()=>{const f=fixture();f.editorial.lessonId=f.state.lesson.id='day_1_part_0';assert.throws(()=>convertApprovedEditorial(f.editorial,f.state,f.audit),/CONSTITUTIONAL_LITERAL_PROOF/);});
for(const part of [1,2])test(`discipline ${part} stays pending even with edited statuses`,()=>{const f=fixture();f.editorial.lessonId=f.state.lesson.id=`day_1_part_${part}`;assert.throws(()=>convertApprovedEditorial(f.editorial,f.state,f.audit),/DISCIPLINE_APPROVAL_PENDING/);});
for(const [name,edit,code]of[
 ['duplicate declarations',f=>f.editorial.approvedChanges.push({...f.editorial.approvedChanges[0]}),'UNDECLARED_OR_DUPLICATE'],
 ['undeclared text',f=>f.editorial.revisedQuestions[1].text+='X','UNDECLARED_OR_DUPLICATE'],
 ['answer change',f=>f.editorial.revisedQuestions[0].correctIndex=1,'ANSWER_CHANGE'],
 ['question count',f=>f.editorial.revisedQuestions.pop(),'COUNT'],
 ['wrong answer index',f=>f.editorial.originalQuestions[0].correctIndex=9,'QUESTION'],
 ['unknown status',f=>f.editorial.approvedChanges[0].approvalStatus='yes','CHANGE'],
 ['unknown fields',f=>f.editorial.approved=true,'KEYS'],
 ['reordered options',f=>f.editorial.revisedQuestions[0].options.reverse(),'OPTIONS_REORDERED'],
 ['options count',f=>f.editorial.revisedQuestions[0].options.push('C'),'OPTIONS_COUNT'],
 ['invalid lesson',f=>f.editorial.lessonId='day_101_part_3','SCOPE'],
 ['empty reason',f=>f.editorial.approvedChanges[0].reason='','CHANGE']
])test(name,()=>{const f=fixture();edit(f);assert.throws(()=>analyzeEditorialTransfer(f.editorial),new RegExp(code));});
test('duplicate JSON keys rejected by official parser',()=>{assert.throws(()=>analyzeEditorialTransfer('{"format":1,"format":2}'),/duplicada/);});
test('version and current questions must match exactly',()=>{const f=fixture();f.state.lesson.version++;assert.throws(()=>convertApprovedEditorial(f.editorial,f.state,f.audit),/BASELINE_VERSION/);f.state.lesson.version--;f.state.lesson.challenge.questions[0].text+='X';assert.throws(()=>convertApprovedEditorial(f.editorial,f.state,f.audit),/BASELINE_QUESTIONS/);});
test('optionIndex maps to importer leaf with exact formatting',()=>{const f=fixture();f.editorial.revisedQuestions[0].options[1]='B revisada\nexata';f.editorial.approvedChanges.push({questionIndex:0,field:'options',optionIndex:1,approvalStatus:'approved',reason:'Sintética'});const i=convertApprovedEditorial(f.editorial,f.state,f.audit);assert.equal(i.questions[0].approvedChanges[1].field,'options[1]');assert.equal(i.questions[0].revised.options[1],'B revisada\nexata');});
test('technical preview preserves internal pending/failed records',()=>{const f=fixture();f.state.sections[1].reviews=[{id:'synthetic-pending',status:'pending_approval'},{id:'synthetic-failed',status:'failed'}];const before=sha256(f.state);assert.equal(previewEditorialTransfer(f.editorial,f.state,at).technicalValid,true);assert.equal(sha256(f.state),before);});
test('Markdown disagreement fails instead of silent repair',()=>{const f=fixture();f.state.lesson.content=f.state.lesson.content.replace('Original sintética','Divergência sintética');assert.throws(()=>previewEditorialTransfer(f.editorial,f.state,at),/divergentes/);});
test('no SDK, filesystem, network or publication operations in bridge',()=>{const code=readFileSync(new URL('./editorial-transfer.mjs',import.meta.url),'utf8');assert.doesNotMatch(code,/from ['"](?:firebase|@google-cloud|node:fs)|\bfetch\s*\(|\.publish\s*\(|\.set\s*\(|\.update\s*\(/);});
function constitutional(){
 const f=fixture();f.editorial.lessonId=f.state.lesson.id='day_1_part_0';f.state.lesson.part=0;
 f.editorial.revisedQuestions=structuredClone(f.editorial.originalQuestions);
 const changes=[[1,'explanation'],[3,'options',1],[3,'explanation'],[4,'explanation'],[5,'explanation'],[6,'text'],[6,'explanation'],[8,'explanation']];
 f.editorial.approvedChanges=changes.map(([questionIndex,field,optionIndex])=>{if(field==='options')f.editorial.revisedQuestions[questionIndex].options[optionIndex]+=' revisada';else f.editorial.revisedQuestions[questionIndex][field]+=' revisada';return{questionIndex,field,...(optionIndex!==undefined?{optionIndex}:{}),approvalStatus:'pending',reason:'Sintética'};});
 const raw=JSON.stringify(f.editorial);
 const evidence={schemaVersion:'athena-editorial-human-approval/v1',lessonId:f.editorial.lessonId,fileSha256:contentSha256(raw),fields:changes.map(([i,k,n])=>`${i}.${k==='options'?`options[${n}]`:k}`),approvalReference:'subsequent synthetic human decision',recordedAt:at,authorization:'editorial-only'};
 f.audit.approvalReference=evidence.approvalReference;
 return{...f,raw,evidence};
}
test('subsequent Constitutional approval binds exact received bytes and eight fields',()=>{const f=constitutional();const i=convertApprovedEditorial(f.raw,f.state,f.audit,{editorialApproval:f.evidence});assert.equal(i.questions.filter(q=>q.approvedChanges.length).length,6);for(const n of [0,2,7,9])assert.deepEqual(i.questions[n].original,i.questions[n].revised);assert.ok(i.questions.every(q=>q.original.correctIndex===q.revised.correctIndex));assert.ok(f.editorial.approvedChanges.every(c=>c.approvalStatus==='pending'));const p=previewEditorialTransfer(f.raw,f.state,at,{editorialApproval:f.evidence});assert.equal(p.allApproved,false);assert.equal(p.approvalReady,true);assert.equal(p.publicationReady,false);});
test('subsequent approval cannot be reused for changed bytes',()=>{const f=constitutional();assert.throws(()=>convertApprovedEditorial(f.raw+' ',f.state,f.audit,{editorialApproval:f.evidence}),/APPROVAL_EVIDENCE/);});
test('subsequent approval rejects wrong or incomplete field scope',()=>{const f=constitutional();f.evidence.fields.pop();assert.throws(()=>convertApprovedEditorial(f.raw,f.state,f.audit,{editorialApproval:f.evidence}),/APPROVAL_FIELDS/);});
test('subsequent approval cannot authorize another discipline or write',()=>{const f=fixture(),c=constitutional();assert.throws(()=>convertApprovedEditorial(JSON.stringify(f.editorial),f.state,f.audit,{editorialApproval:c.evidence}),/APPROVAL_EVIDENCE/);c.evidence.authorization='publish';assert.throws(()=>convertApprovedEditorial(c.raw,c.state,c.audit,{editorialApproval:c.evidence}),/APPROVAL_EVIDENCE/);});
test('subsequent approval reference must survive in reviewed audit metadata',()=>{const f=constitutional();f.audit.approvalReference='other';assert.throws(()=>convertApprovedEditorial(f.raw,f.state,f.audit,{editorialApproval:f.evidence}),/APPROVAL_REFERENCE/);});
