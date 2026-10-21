import test from 'node:test';import assert from 'node:assert/strict';
import {auditFixture} from './snapshot-audit-fixtures.mjs';
import {reviewRecordViolations,annotateSnapshotSchemaFailure,schemaDetailOf} from './snapshot-schema-diagnostics.mjs';
import {previewPublication,ATHENA_TARGET,assessSnapshotAdministration} from './publish-reviewed-questions.mjs';
import {sha256,dryRun,embedded} from './import-reviewed-questions.mjs';

for(const status of ['approved','rejected','pending_approval','queued','processing','failed','uncertain_failure','completed'])test(`snapshot auditoria: ${status}`,async()=>{
 const f=auditFixture(status),before=JSON.stringify(f.state),r=await f.core.snapshot(f.input.lessonId,{auditOnly:true});
 assert.deepEqual(r.snapshot.lesson,f.state.lesson);assert.deepEqual(r.snapshot.sections,f.state.sections);
 assert.equal(r.snapshot.importReady,false);assert.equal(r.snapshot.publicationReady,false);
 assert.equal(r.snapshot.administrativeAssessment.conflictsPresent,!['approved','rejected'].includes(status));
 assert.equal(sha256(r.snapshot),r.manifest.snapshotSha256);assert.equal(r.manifest.originalLessonSha256,sha256(f.state.lesson));
 const {manifestSha256,...manifestBody}=r.manifest;assert.equal(manifestSha256,sha256(manifestBody));
 assert.equal(JSON.stringify(f.state),before);assert.equal(f.reads(),1);assert.equal(dryRun(r.snapshot,f.input).ok,false);
 if(['approved','rejected'].includes(status))await f.core.snapshot(f.input.lessonId);
 else{await assert.rejects(f.core.snapshot(f.input.lessonId));await assert.rejects(previewPublication({mode:'mock',target:ATHENA_TARGET,readState:async()=>f.state},f.input));}
});
for(const [name,record,prior,expected] of [
 ['ID ausente',{lessonId:'scope',status:'approved'},[],'ID_MISSING'],
 ['ID inválido',{id:42,lessonId:'scope',status:'approved'},[],'ID_TYPE'],
 ['ID vazio',{id:'',lessonId:'scope',status:'approved'},[],'ID_EMPTY'],
 ['ID duplicado',{id:'r',lessonId:'scope',status:'approved'},[{id:'r'}],'ID_DUPLICATE'],
 ['escopo divergente',{id:'r',lessonId:'other',status:'approved'},[],'SCOPE'],
 ['status ausente',{id:'r',lessonId:'scope'},[],'STATUS_MISSING'],
 ['status inválido',{id:'r',lessonId:'scope',status:42},[],'STATUS_TYPE'],
 ['status pendente',{id:'r',lessonId:'scope',status:'pending_approval'},[],'STATUS_PENDING'],
 ['legado não inferido',{id:'r',lessonId:'scope',status:'completed',oldField:'secret'},[],'STATUS_UNKNOWN'],
 ['registro inválido',null,[],'TYPE']
])test(`diagnóstico individual: ${name}`,()=>{const issues=reviewRecordViolations(record,'scope',prior);assert.equal(issues[0].ruleCode,'ATHENA_SCHEMA_REVIEW_RECORD_'+expected);assert.ok(!JSON.stringify(issues).includes('secret'));});
test('snapshot auditoria mantém Markdown legado e registros legados sem convertê-los',async()=>{
 const f=auditFixture('completed'),l=f.state.lesson,c=l.content,s=embedded(c);l.content=c.slice(0,c.indexOf('[ATHENA_CHALLENGE]'))+c.slice(s.end)+'\n[ATHENA_CHALLENGE]\n'+c.slice(s.start,s.end);
 const r=await f.core.snapshot(f.input.lessonId,{auditOnly:true});assert.equal(r.snapshot.lesson.content,l.content);assert.equal(r.snapshot.sections[1].reviews[0].status,'completed');assert.equal(r.snapshot.administrativeAssessment.blockingIssues[0].violations[0].ruleCode,'ATHENA_SCHEMA_REVIEW_RECORD_STATUS_UNKNOWN');
});
test('snapshot auditoria continua rejeitando conteúdo divergente',async()=>{const f=auditFixture();f.state.lesson.challenge.questions[0].explanation+='changed';await assert.rejects(f.core.snapshot(f.input.lessonId,{auditOnly:true}));});
test('snapshot auditoria não dá acesso a plan/publish/restore em produção',async()=>{const f=auditFixture();for(const action of ['plan','publish','restore'])await assert.rejects(f.core[action]({}),/Somente snapshot autorizado/);});
test('diagnóstico individual aponta segunda revisão duplicada e escopo sem valores',()=>{const f=auditFixture('approved'),s=f.state.sections[1];s.reviews.push({...s.reviews[0],lessonId:'SECRET-SCOPE'});const e=annotateSnapshotSchemaFailure(Error('Revisão por bloco pendente/desconhecida'),f.state),d=schemaDetailOf(e);assert.equal(d.field,'sections.1.reviews.1');assert.deepEqual(d.violations.map(v=>v.ruleCode),['ATHENA_SCHEMA_REVIEW_RECORD_ID_DUPLICATE','ATHENA_SCHEMA_REVIEW_RECORD_SCOPE']);assert.ok(!JSON.stringify(d).includes('SECRET'));});
test('avaliação preserva impedimentos de dois blocos sem confundir os campos',()=>{const f=auditFixture();f.state.sections[3].reviews=[{id:'other',lessonId:f.state.sections[3].scopeId,status:'processing'}];const a=assessSnapshotAdministration(f.state);assert.deepEqual(a.blockingIssues.map(i=>i.field),['sections.1.reviews.0','sections.3.reviews.0']);});
for(const [name,mutate] of [
 ['duplicação de ID',s=>s.reviews.push({...s.reviews[0]})],
 ['escopo divergente',s=>s.reviews[0].lessonId='other'],
 ['registro legado sem status',s=>{delete s.reviews[0].status;s.reviews[0].oldStatus='completed';}]
])test(`publicação estrita mantém bloqueio: ${name}`,async()=>{const f=auditFixture('approved');mutate(f.state.sections[1]);const before=JSON.stringify(f.state);assert.equal(assessSnapshotAdministration(f.state).conflictsPresent,true);await assert.rejects(previewPublication({mode:'mock',target:ATHENA_TARGET,readState:async()=>f.state},f.input));assert.equal(JSON.stringify(f.state),before);});
