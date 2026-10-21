// Sem inicialização de SDK, credenciais, rede ou CLI de publicação.
import { canonical, dryRun, embedded, sha256, contentSha256, reviewGuard } from './import-reviewed-questions.mjs';
import {annotateSnapshotSchemaFailure,schemaDetailOf} from './snapshot-schema-diagnostics.mjs';
import { isAdminAdapter, requireAdminMode } from './admin-question-adapter.mjs';
import {createEditorialAdministrativeBuilder} from './editorial-compatibility.mjs';

export const ATHENA_TARGET = Object.freeze({ projectId: 'gen-lang-client-0822763072', databaseId: 'ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb' });
export const PRODUCTION_PUBLICATION_ENABLED = false;
export function createProductionPublisher() { throw new Error('Publicação real bloqueada nesta versão; requer implementação de autenticação e habilitação revisada separadamente.'); }
const clone = x => structuredClone(x);
const equal = (a, b) => canonical(a) === canonical(b);
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
const scopes = id => [id, ...Array.from({ length: 6 }, (_, n) => `${id}_block_${n}`)];
function jsonOnly(value, path = '$') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { requireThat(Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value)), `Número não seguro: ${path}`); return; }
  requireThat(typeof value === 'object' && (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null), `Valor Firestore não JSON em ${path}; exige codec de backup antes da publicação`);
  for (const [key, child] of Object.entries(value)) jsonOnly(child, `${path}.${key}`);
}

function sectionGuard(state) {
  const ids = scopes(state.lesson.id).slice(1);
  requireThat(Array.isArray(state.sections) && equal(state.sections.map(s => s.scopeId).sort(), ids.sort()), 'Snapshot de revisões por bloco incompleto');
  for (const section of state.sections) {
    const { index, reviews } = section;
    requireThat(Array.isArray(reviews), 'Consulta de revisões por bloco incompleta');
    const seen = new Set();
    for (const r of reviews) {
      requireThat(typeof r.id === 'string' && r.id && !seen.has(r.id) && r.lessonId === section.scopeId && ['approved', 'rejected'].includes(r.status), 'Revisão por bloco pendente/desconhecida');
      seen.add(r.id);
    }
    if (index === null) { requireThat(reviews.length === 0, 'Revisões por bloco sem índice'); continue; }
    requireThat(index?.lessonId === section.scopeId && index.processingReviewId === null && index.processingStartedAt == null, 'Lock/índice desconhecido de revisão por bloco');
    requireThat(Object.hasOwn(index, 'latestReviewId') && Object.hasOwn(index, 'latestStatus'), 'Índice por bloco incompleto');
    if (index.latestReviewId === null) requireThat(index.latestStatus === null && !reviews.length, 'Índice por bloco inconsistente');
    else requireThat(reviews.some(r => r.id === index.latestReviewId && r.status === index.latestStatus), 'Última revisão por bloco ausente/inconsistente');
  }
}

// Formatos comprováveis: blocos brutos ou os blocos sem o JSON, como no parser da UI.
function splitBlocks(content, removeChallenge, collapseBlankLines = true) {
  let text = content;
  if (removeChallenge) { const s = embedded(text); const marker = text.indexOf('[ATHENA_CHALLENGE]'); text = text.slice(0, marker) + text.slice(s.end); if (collapseBlankLines) text = text.replace(/\n{3,}/g, '\n\n'); }
  const markers = [...text.matchAll(/\[BLOCK_(\d+)\]/g)];
  requireThat(equal(markers.map(m => Number(m[1])), [1, 2, 3, 4, 5, 6]), 'Blocos fonte ausentes, duplicados ou fora de ordem');
  // Keep the six positions: block 5 may contain only its structured question JSON.
  return markers.map((m, i) => text.slice(m.index + m[0].length, markers[i + 1]?.index ?? text.length).trim());
}
function synchronizeBlocks(original, proposed) {
  if (!Object.hasOwn(original, 'blocks')) return { proposed, mode: 'absent' };
  requireThat(Array.isArray(original.blocks) && original.blocks.length === 6 && original.blocks.every(b => typeof b === 'string'), 'blocks possui formato não suportado');
  for (const [remove, mode, collapse] of [[true, 'display-without-json', true], [true, 'display-exact-whitespace', false], [false, 'raw-with-json', false]]) {
    if (equal(original.blocks, splitBlocks(original.content, remove, collapse))) return { proposed: { ...proposed, blocks: splitBlocks(proposed.content, remove, collapse) }, mode };
  }
  throw new Error('blocks diverge do conteúdo; reparo automático não autorizado');
}

function buildPlan(state, input, capturedAt, target) {
  jsonOnly(state); jsonOnly(input);
  sectionGuard(state);
  const snapshot = { schemaVersion: 'athena-question-snapshot/v1', capturedAt, lesson: state.lesson, reviewState: state.reviewState };
  const validation = dryRun(snapshot, input);
  requireThat(validation.ok, validation.conflicts.join('; '));
  const { proposed, mode } = synchronizeBlocks(state.lesson, validation.proposedLesson);
  requireThat(equal(embedded(proposed.content).challenge, proposed.challenge), 'Proposta contém marcadores ambíguos ou desafio não sincronizado');
  const patch = {};
  if (!equal(state.lesson.challenge.questions, proposed.challenge.questions)) patch['challenge.questions'] = proposed.challenge.questions;
  if (state.lesson.content !== proposed.content) patch.content = proposed.content;
  if (!equal(state.lesson.blocks, proposed.blocks)) patch.blocks = proposed.blocks;
  requireThat(Buffer.byteLength(JSON.stringify(proposed)) <= 900_000, 'Documento proposto excede limite seguro');
  const body = { schemaVersion: 'athena-question-publication/v1', target, lessonId: input.lessonId, capturedAt, input, baseline: state, proposed, patch, blocksMode: mode, differences: validation.differences };
  return { ...body, planSha256: sha256(body), remoteWriteEnabled: false };
}
export async function previewPublication(adapter, input, capturedAt = new Date().toISOString()) {
  requireThat(adapter?.mode === 'mock' || adapter?.mode === 'emulator', 'Somente mocks/emulador são permitidos');
  const state = await adapter.readState(input.lessonId);
  return clone(buildPlan(state, input, capturedAt, adapter.target));
}

// Projeção explícita apenas para verificar conteúdo. O estado original é validado
// como JSON sem perda e preservado no artefato de auditoria; nunca vira um plano.
export function validateSnapshotContent(state,input,capturedAt,target){
  jsonOnly(state);
  const projection={...state,reviewState:{checked:true,index:null,reviews:[]},sections:scopes(state.lesson.id).slice(1).map(scopeId=>({scopeId,index:null,reviews:[]}))};
  const result=buildPlan(projection,input,capturedAt,target);
  return {blocksMode:result.blocksMode,proposedLesson:result.proposed};
}
export function assessSnapshotAdministration(state){
  const issues=[];
  const capture=(action,context=state)=>{try{action();}catch(error){annotateSnapshotSchemaFailure(error,context);issues.push(schemaDetailOf(error));}};
  // As mesmas regras de publicação, sem alterar dados, locks ou status.
  if(!Array.isArray(state.sections))capture(()=>sectionGuard(state));
  else{
    capture(()=>sectionGuard({...state,sections:state.sections.map(s=>({...s,index:null,reviews:[]}))}));
    for(let n=0;n<state.sections.length;n++){const context={...state,sections:state.sections.map((s,i)=>i===n?s:{...s,index:null,reviews:[]})};capture(()=>sectionGuard(context),context);}
  }
  capture(()=>reviewGuard(state.reviewState,state.lesson));
  return {checked:true,conflictsPresent:issues.length>0,blockingIssues:issues};
}
// Entrada separada para CLI administrativa; preserva os bloqueios dos fluxos antigos.
export async function previewAdministrativePublication(adapter,input,capturedAt=new Date().toISOString(),editorialContext=null) {
  requireThat(isAdminAdapter(adapter), 'Adaptador administrativo não reconhecido');
  requireAdminMode(adapter.mode === 'emulator' ? 'emulator' : 'production');
  const builder=editorialContext?createEditorialAdministrativeBuilder(editorialContext):buildPlan;
  const state=await adapter.readState(input.lessonId);jsonOnly(state);jsonOnly(input);if(editorialContext)jsonOnly(editorialContext);
  return clone(builder(state,input,capturedAt,adapter.target));
}
export function recoverBackupInMemory(backup) {
  jsonOnly(backup);
  requireThat(backup?.schemaVersion === 'athena-question-backup/v1' && backup.state?.lesson?.id === backup.lessonId && backup.state.lesson.version === backup.previousVersion && sha256(backup.state) === backup.stateSha256 && sha256(backup.state.lesson) === backup.lessonSha256, 'Backup inválido para recuperação');
  return clone(backup.state.lesson);
}

function authorizationGuard(auth, plan, now, verifyAuthorization) {
  requireThat(auth && auth.action === 'publish-reviewed-questions' && auth.planSha256 === plan.planSha256 && auth.lessonId === plan.lessonId && equal(auth.target, plan.target), 'Autorização ausente ou não vinculada à prévia');
  requireThat(typeof auth.authorizationId === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(auth.authorizationId), 'Identificador de autorização inválido');
  requireThat(typeof auth.actorUid === 'string' && auth.actorUid && Number.isFinite(Date.parse(auth.approvedAt)) && Number.isFinite(Date.parse(auth.expiresAt)) && Date.parse(auth.approvedAt) <= now && Date.parse(auth.expiresAt) > now, 'Autorização expirada/inválida');
  requireThat(verifyAuthorization(auth, plan) === true, 'Identidade/autorização do CEO não verificada');
}

/** @param {any} adapter @param {{verifyAuthorization?: (auth: any, plan: any) => boolean, now?: () => number}} options */
export function createOfflinePublisher(adapter, { verifyAuthorization, now = () => Date.now() } = {}) {
  requireThat(['mock', 'emulator'].includes(adapter?.mode), 'Publicação de produção desabilitada');
  return createPublisher(adapter,{verifyAuthorization,now});
}
// Alternate preparation is restricted to local simulation. Production and the
// administrative CLI continue to use the original strict builder.
export function createOfflinePreparedPublisher(adapter,options,planBuilder){
  requireThat(['mock','emulator'].includes(adapter?.mode)&&typeof planBuilder==='function','Preparação alternativa restrita a mocks/emulador');
  return createPublisher(adapter,options,planBuilder);
}
export function createAdministrativePublisher(adapter,options) {
  requireThat(isAdminAdapter(adapter), 'Adaptador administrativo não reconhecido');
  requireAdminMode(adapter.mode === 'emulator' ? 'emulator' : 'production');
  if(adapter.mode !== 'emulator') requireThat(PRODUCTION_PUBLICATION_ENABLED, 'Publicação real bloqueada');
  const metadata=clone(options.receiptMetadata??{});
  requireThat(Object.keys(metadata).every(k=>['adminPlanSha256','operationalApprovalReference','baselineReadVersionsSha256'].includes(k)), 'Metadados administrativos desconhecidos');
  const context=options.editorialContext??null,builder=context?createEditorialAdministrativeBuilder(context):buildPlan;
  const assessment=context?clone(options.externalAssessment):null;
  requireThat(!context||assessment?.policyPrepared===true,'Avaliação externa obrigatória');
  const external=context?{externalPolicy:'external-approved-question-leaves/v1',editorialContextSha256:sha256(context),editorialSourceSha256:contentSha256(context.raw),externalApprovalReference:context.externalApprovalReference,externalAssessmentSha256:sha256(assessment),...(context.technicalRebase?{technicalRebaseSha256:context.technicalRebase.rebaseSha256,editorialSourceVersion:context.technicalRebase.sourceVersion,technicalBaselineVersion:context.technicalRebase.technicalVersion}:{}),externalDivergences:assessment.impacts.filter(i=>i.conflictingFields.length).map(i=>({scopeId:i.scopeId,ordinal:i.ordinal,recordSha256:i.recordSha256,conflictingFields:i.conflictingFields,staleWholeLessonApprovalBlocked:i.staleWholeLessonApprovalBlocked}))}:{};
  const wrapped={...adapter,runTransaction:callback=>adapter.runTransaction(tx=>callback({...tx,createReceipt:(id,data)=>tx.createReceipt(id,{...data,...metadata,...external})}))};
  return createPublisher(wrapped,options,(state,input,at,target)=>{jsonOnly(state);jsonOnly(input);if(context)jsonOnly(context);const result=builder(state,input,at,target);requireThat(!context||equal(result.precedence,assessment),'Avaliação externa divergente');return result;});
}
function createPublisher(adapter, { verifyAuthorization, now = () => Date.now() } = {}, planBuilder=buildPlan) {
  requireThat(typeof verifyAuthorization === 'function', 'Verificador explícito obrigatório');
  return {
    async publish(planArgument, authArgument) {
      const plan = clone(planArgument), auth = clone(authArgument);
      requireThat(equal(plan.target, adapter.target), 'Destino divergente');
      const rebuilt = planBuilder(plan.baseline, plan.input, plan.capturedAt, plan.target);
      requireThat(equal(rebuilt, plan), 'Plano adulterado');
      authorizationGuard(auth, plan, now(), verifyAuthorization);
      requireThat(Object.keys(plan.patch).length > 0, 'Plano sem alterações');
      const operationId = plan.planSha256;
      const previous = await adapter.readReceipt(operationId);
      if (previous) {
        requireThat(previous.planSha256 === operationId && previous.authorizationId === auth.authorizationId && sha256((await adapter.readState(plan.lessonId)).lesson) === previous.afterLessonSha256, 'Repetição com recibo divergente ou alteração posterior');
        return { ...previous, repeated: true };
      }
      const fresh = await adapter.readState(plan.lessonId);
      requireThat(equal(fresh, plan.baseline), 'Conflito: aula/revisões mudaram após a prévia');
      planBuilder(fresh, plan.input, plan.capturedAt, plan.target);
      const backup = { schemaVersion: 'athena-question-backup/v1', lessonId: plan.lessonId, createdAt: new Date(now()).toISOString(), previousVersion: fresh.lesson.version, target: plan.target, planSha256: operationId, authorizationId: auth.authorizationId, state: fresh, stateSha256: sha256(fresh), lessonSha256: sha256(fresh.lesson) };
      // Create-only + leitura independente. Backup pode permanecer se a transação falhar.
      const backupId = `${plan.lessonId}_v${fresh.lesson.version}_${operationId}`;
      await adapter.createBackup(backupId, backup);
      const confirmed = await adapter.readBackup(backupId);
      requireThat(confirmed && confirmed.schemaVersion === backup.schemaVersion && confirmed.lessonId === plan.lessonId && confirmed.previousVersion === fresh.lesson.version && equal(confirmed.state, fresh) && confirmed.stateSha256 === sha256(fresh) && confirmed.lessonSha256 === sha256(fresh.lesson) && confirmed.planSha256 === operationId && confirmed.authorizationId === auth.authorizationId && equal(confirmed.target, plan.target), 'Backup não confirmado/íntegro');
      return adapter.runTransaction(async tx => {
        authorizationGuard(auth, plan, now(), verifyAuthorization);
        const receipt = await tx.readReceipt(operationId);
        const consumed = await tx.readAuthorization(auth.authorizationId);
        const state = await tx.readState(plan.lessonId);
        const savedBackup = await tx.readBackup(backupId);
        if (receipt) {
          requireThat(receipt.authorizationId === auth.authorizationId && sha256(state.lesson) === receipt.afterLessonSha256, 'Recibo concorrente divergente');
          return { ...receipt, repeated: true };
        }
        requireThat(!consumed, 'Autorização já utilizada');
        requireThat(equal(state, plan.baseline), 'Conflito transacional de versão/hash/questões/revisões');
        planBuilder(state, plan.input, plan.capturedAt, plan.target);
        requireThat(equal(savedBackup, confirmed), 'Backup alterado após confirmação');
        const receiptData = { schemaVersion: 'athena-question-publication-receipt/v1', planSha256: operationId, lessonId: plan.lessonId, target: plan.target, authorizationId: auth.authorizationId, actorUid: auth.actorUid, publishedAt: new Date(now()).toISOString(), previousVersion: state.lesson.version, resultingVersion: plan.proposed.version, beforeLessonSha256: sha256(state.lesson), afterLessonSha256: sha256(plan.proposed), fieldsModified: Object.keys(plan.patch), backupId, repeated: false, production: adapter.mode === 'admin-production' };
        tx.updateLesson(plan.lessonId, clone(plan.patch));
        tx.createReceipt(operationId, receiptData);
        tx.consumeAuthorization(auth.authorizationId, { planSha256: operationId, actorUid: auth.actorUid });
        return receiptData;
      });
    }
  };
}

// Adaptador para API de Firestore injetada. Nunca inicializa Admin SDK.
// Destino permitido nesta versão: projeto demo e endpoint loopback do emulador.
export function createEmulatorFirestoreAdapter(db) {
  const endpoint = db?._settings?.host ?? (db?._settings?.servicePath && `${db._settings.servicePath}:${db._settings.port}`);
  requireThat(db?.projectId === 'demo-athena-question-import' && db.databaseId === ATHENA_TARGET.databaseId && /^(localhost|127\.0\.0\.1):\d+$/.test(endpoint || '') && db._settings.ssl === false, 'Adaptador restrito ao projeto demo, banco nomeado e emulador local sem TLS');
  const target = { projectId: db.projectId, databaseId: db.databaseId };
  const ref = (collection, id) => db.collection(collection).doc(id);
  const getValue = async (get, r) => { const s = await get(r); return s.exists ? s.data() : null; };
  const readState = async (get, id) => {
    requireThat(/^day_([1-9]\d{0,2})_part_(0|[1-9]\d?)$/.test(id), 'Identificador inválido');
    const lesson = await getValue(get, ref('homologated_lessons', id));
    requireThat(lesson?.id === id, 'Aula não encontrada');
    const ids = scopes(id);
    const indices = [];
    for (const scope of ids) indices.push(await getValue(get, ref('legal_review_index', scope)));
    const query = collection => db.collection(collection).where('lessonId', 'in', ids);
    const reviews = (await get(query('legal_reviews'))).docs.map(s => ({ ...s.data(), id: s.id }));
    const extraIndices = (await get(query('legal_review_index'))).docs;
    for (const s of extraIndices) requireThat(ids.includes(s.id), 'Índice de revisão com escopo desconhecido');
    for (const r of reviews) requireThat(ids.includes(r.lessonId), 'Revisão com escopo desconhecido');
    const group = scope => reviews.filter(r => r.lessonId === scope).sort((a, b) => a.id.localeCompare(b.id));
    return { lesson, reviewState: { checked: true, index: indices[0], reviews: group(id) }, sections: ids.slice(1).map((scopeId, i) => ({ scopeId, index: indices[i + 1], reviews: group(scopeId) })) };
  };
  const reader = get => ({ readState: id => readState(get, id), readReceipt: id => getValue(get, ref('question_import_receipts', id)), readAuthorization: id => getValue(get, ref('question_import_authorizations', id)), readBackup: id => getValue(get, ref('question_import_backups', id)) });
  return {
    mode: 'emulator', target, ...reader(r => r.get()),
    async createBackup(id, data) {
      try { await ref('question_import_backups', id).create(data); }
      catch (e) { if (e.code !== 6 && e.code !== 'already-exists') throw e; }
    },
    runTransaction: callback => db.runTransaction(tx => callback({ ...reader(r => tx.get(r)), updateLesson: (id, patch) => tx.update(ref('homologated_lessons', id), patch), createReceipt: (id, data) => tx.create(ref('question_import_receipts', id), data), consumeAuthorization: (id, data) => tx.create(ref('question_import_authorizations', id), data) }))
  };
}
