import test from 'node:test';import assert from 'node:assert/strict';
import {externalPolicyFixture} from './external-policy-fixtures.mjs';
import {evaluateExternalQuestionPolicy,verifyExternalPolicyBaseline} from './external-question-policy.mjs';
import {sha256,embedded} from './import-reviewed-questions.mjs';
import {hashLessonContent} from '../src/services/legalReviewRepository.ts';
import {validateSnapshotContent,ATHENA_TARGET} from './publish-reviewed-questions.mjs';
const now='2026-10-12T12:00:00Z';
function candidateQuestion(content,index,field,value){const s=embedded(content),c=structuredClone(s.challenge);c.questions[index][field]=value;return content.slice(0,s.start)+JSON.stringify(c)+content.slice(s.end);}
for(const [name,options]of [
 ['pendência de outro bloco',{candidateEdit:c=>c.replace('Lei sintética','Lei sintética revisada')}],
 ['pendência integral sem mudar questões',{whole:true,candidateEdit:c=>c.replace('Doutrina sintética','Doutrina revisada')}],
 ['pendência em outra questão',{whole:true,candidateEdit:c=>candidateQuestion(c,1,'explanation','Outra fundamentação sintética')}],
 ['revisão com falha sem candidato',{status:'failed'}],
 ['revisão rejeitada',{status:'rejected'}],['revisão aprovada',{status:'approved'}]
])test(`política externa permite avaliação: ${name}`,()=>{const f=externalPolicyFixture(options),before=structuredClone(f.state),r=evaluateExternalQuestionPolicy(f.state,f.input,now);assert.equal(r.coexistenceDemonstrated,true);assert.equal(r.productionEnabled,false);assert.equal(r.publicationReady,false);assert.equal(verifyExternalPolicyBaseline(r,f.state,f.input),true);assert.equal(r.requiresExplicitStaleReviewAcknowledgement,true);assert.deepEqual(f.state,before);assert.ok(!JSON.stringify(r).includes('Lei sintética'));assert.deepEqual(r.externalFields,['questions.0.explanation']);});
test('política externa bloqueia valores diferentes na mesma justificativa',()=>{const f=externalPolicyFixture({whole:true,candidateEdit:c=>candidateQuestion(c,0,'explanation','Proposta interna incompatível')}),r=evaluateExternalQuestionPolicy(f.state,f.input,now);assert.equal(r.coexistenceDemonstrated,false);assert.ok(r.blockers.some(b=>b.code==='POLICY_MATERIAL_QUESTION_CONFLICT'&&b.field==='questions.0.explanation'));assert.throws(()=>verifyExternalPolicyBaseline(r,f.state,f.input),/POLICY_BLOCKED/);});
test('política externa exige avaliação de outro campo da mesma questão',()=>{const f=externalPolicyFixture({whole:true,candidateEdit:c=>candidateQuestion(c,0,'correctIndex',1)}),r=evaluateExternalQuestionPolicy(f.state,f.input,now);assert.ok(r.blockers.some(b=>b.code==='POLICY_SAME_QUESTION_REQUIRES_REVIEW'));assert.equal(r.coexistenceDemonstrated,false);});
test('política externa reconhece mesma folha com redação idêntica',()=>{const f=externalPolicyFixture({whole:true});f.review.reviewedMarkdown=candidateQuestion(f.review.originalContent,0,'explanation',f.input.questions[0].revised.explanation);f.review.candidateHash=hashLessonContent(f.review.reviewedMarkdown);f.review.auditedCandidateHash=f.review.candidateHash;assert.equal(evaluateExternalQuestionPolicy(f.state,f.input,now).coexistenceDemonstrated,true);});
for(const [name,mutate,code]of [
 ['base histórica divergente',f=>f.review.originalHash='0'.repeat(64),'POLICY_BASELINE_UNRESOLVED'],
 ['candidato editado após auditoria',f=>f.review.auditedCandidateHash='0'.repeat(64),'POLICY_CANDIDATE_INTEGRITY'],
 ['integridade editorial não comprovada',f=>delete f.review.editorialIntegrity,'POLICY_EDITORIAL_INTEGRITY_UNRESOLVED'],
 ['falha com candidato desconhecido',f=>{f.review.status='failed';f.group.index.latestStatus='failed';},'POLICY_FAILED_CANDIDATE_UNKNOWN'],
 ['worker ativo',f=>{f.review.status='processing';f.group.index.latestStatus='processing';},'POLICY_REVIEW_STATE_UNSUPPORTED'],
 ['lock ativo',f=>f.group.index.processingReviewId='worker','POLICY_ACTIVE_OR_UNKNOWN_LOCK'],
 ['índice desconhecido',f=>delete f.group.index.latestStatus,'POLICY_INDEX_INCONSISTENT'],
 ['escopo divergente',f=>f.review.lessonId='other','POLICY_REVIEW_IDENTITY'],
 ['claims não resolvidos',f=>f.review.unverifiedClaims=[{excerpt:'secret'}],'POLICY_FINDINGS_UNRESOLVED']
])test(`política externa bloqueia: ${name}`,()=>{const f=externalPolicyFixture({whole:true});mutate(f);const r=evaluateExternalQuestionPolicy(f.state,f.input,now);assert.equal(r.coexistenceDemonstrated,false);assert.ok(r.blockers.some(b=>b.code===code));assert.ok(!JSON.stringify(r).includes('secret'));});
for(const [name,mutate]of [
 ['conteúdo',f=>f.state.lesson.content+='posterior'],['versão',f=>f.state.lesson.version++],
 ['updateTime',f=>f.state.readVersions[`homologated_lessons/${f.state.lesson.id}`].nanoseconds++],
 ['revisão',f=>f.review.syntheticMetadata.preserve=false],['JSON aprovado',f=>f.input.audit.reference+='posterior']
])test(`política externa detecta alteração posterior: ${name}`,()=>{const f=externalPolicyFixture(),r=evaluateExternalQuestionPolicy(f.state,f.input,now);mutate(f);assert.throws(()=>verifyExternalPolicyBaseline(r,f.state,f.input),/POLICY_CONCURRENT_CHANGE/);});
test('política externa tem hash determinístico e preserva folha exclusiva do Markdown',()=>{const f=externalPolicyFixture(),before=structuredClone(f.state),a=evaluateExternalQuestionPolicy(f.state,f.input,now),b=evaluateExternalQuestionPolicy(f.state,f.input,now);assert.deepEqual(a,b);const {assessmentSha256,...body}=a;assert.equal(sha256(body),assessmentSha256);assert.deepEqual(f.state,before);const proposed=validateSnapshotContent(f.state,f.input,now,ATHENA_TARGET).proposedLesson,s=embedded(before.lesson.content),p=embedded(proposed.content);assert.equal(before.lesson.content.slice(0,s.start),proposed.content.slice(0,p.start));assert.equal(before.lesson.content.slice(s.end),proposed.content.slice(p.end));assert.deepEqual(proposed.challenge.questions[1],before.lesson.challenge.questions[1]);assert.equal(proposed.challenge.questions[0].correctIndex,before.lesson.challenge.questions[0].correctIndex);assert.equal(a.proposedLessonSha256,sha256(proposed));});
test('política externa exige updateTime confiável',()=>{const f=externalPolicyFixture();delete f.state.readVersions;assert.throws(()=>evaluateExternalQuestionPolicy(f.state,f.input,now),/POLICY_UPDATE_TIME_MISSING/);});
test('política externa recalcula regras e rejeita relatório adulterado mesmo com hash refeito',()=>{const f=externalPolicyFixture({whole:true,candidateEdit:c=>candidateQuestion(c,0,'explanation','Conflito sintético')}),a=evaluateExternalQuestionPolicy(f.state,f.input,now);a.blockers=[];a.coexistenceDemonstrated=true;const {assessmentSha256,...body}=a;a.assessmentSha256=sha256(body);assert.throws(()=>verifyExternalPolicyBaseline(a,f.state,f.input),/POLICY_ASSESSMENT_TAMPERED/);});
