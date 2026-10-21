import { createHash } from 'node:crypto';
import { readCeoMarkdown } from '../lib/ceoLessonEditing';
import {testerIsCurrent} from './testerInvites';

type Actor = { uid: string; emailVerified: boolean; provider: string };
type Material = { revision: number; answers: Record<string, number>; completed: boolean; lessonVersion: number; lessonSha256: string };
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const uidValid = (uid: string) => typeof uid === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(uid);
function fail(ok: unknown, code: string): asserts ok { if (!ok) throw Error(code); }
const parseId = (id: unknown) => {
  fail(typeof id === 'string', 'INVALID_LESSON');
  const m = /^day_([1-9][0-9]?|100)_part_(0|[1-9][0-9]?)$/.exec(id as string);
  fail(m && Number(m[2]) <= 20, 'INVALID_LESSON'); return { day: Number(m![1]), part: Number(m![2]) };
};
const days = (x: unknown): number[] => Array.isArray(x) ? [...new Set(x.filter(n => Number.isInteger(n) && n >= 1 && n <= 100))] : [];
export function subscriptionIsCurrent(s: any, now: number) {
  return !!s && ['google_play', 'app_store'].includes(s.provider) && s.serverVerified === true
    && ['active', 'canceled'].includes(s.status) && Number.isSafeInteger(s.currentPeriodStart) && Number.isSafeInteger(s.currentPeriodEnd)
    && s.currentPeriodStart <= now && now < s.currentPeriodEnd;
}
export function progressiveDayAccess(day: number, completed: number[], paid: boolean, ceo: boolean) {
  if (!Number.isInteger(day) || day < 1 || day > 100) return false;
  if (ceo) return true;
  if (day > 2 && !paid) return false;
  // Contiguous prerequisites prevent isolated or forged high-day values from unlocking the track.
  for (let previous = 1; previous < day; previous++) if (!completed.includes(previous)) return false;
  return true;
}
/** Invoked only after token verification. Uses the existing Firestore Admin transaction, no public writer. */
export function createStudyProgressCore(db: any, curriculumParts: (day: number) => number, now = Date.now) {
  const actorCheck = (actor: Actor) => fail(actor && uidValid(actor.uid), 'AUTHENTICATION_REQUIRED');
  const ref = (path: string) => db.doc(path);
  const context = async (tx: any, actor: Actor) => {
    const [p, s, a, legacy, t] = await Promise.all([tx.get(ref('study_progress/' + actor.uid)), tx.get(ref('access_subscriptions/' + actor.uid)), tx.get(ref('access_admins/' + actor.uid)),tx.get(ref('users/'+actor.uid+'/trilha/progress')),tx.get(ref('tester_access/'+actor.uid))]);
    const progress = p.data() || {}, grant = a.data();
    const isLocal = process.env.ATHENA_STUDY_PROGRESS_LOCAL === 'true';
    const validProvider = actor.provider === 'google.com' || (isLocal && actor.provider === 'password');
    const ceo = actor.emailVerified && validProvider && grant?.uid === actor.uid && grant?.role === 'ceo' && grant?.enabled === true;
    const completed = [...new Set([...days(progress.verifiedDays), ...days(progress.legacyImport?.approvedDays)])];
    const paid=subscriptionIsCurrent(s.data(),now()),tester=testerIsCurrent(t.data(),actor.uid,now());
    return { progress, completed, ceo, unreviewedLegacyDays:progress.legacyImport?[]:days(legacy.data()?.completedDays),paid,tester,testerGrant:t.data(),subscription:s.data(),accessUntil:Math.max(paid?s.data().currentPeriodEnd:0,tester?t.data().expiresAt:0) };
  };
  const canonical = (id: string, raw: any) => {
    const {day, part} = parseId(id), count = curriculumParts(day);
    fail(Number.isInteger(count) && count > 0 && part < count, 'NOT_IN_CURRICULUM');
    fail(raw?.id === id && raw.day === day && raw.part === part && raw.status === 'approved' && Number.isSafeInteger(raw.version) && raw.version >= 1, 'CATALOG_UNAVAILABLE');
    const parsed = readCeoMarkdown(raw.content);
    fail(parsed.challenge && parsed.challenge.questions.length <= 100, 'QUESTIONS_UNAVAILABLE');
    if (raw.challenge) fail(JSON.stringify(raw.challenge) === JSON.stringify(parsed.challenge), 'QUESTIONS_INCONSISTENT');
    return { raw, day, part, questions: parsed.challenge!.questions, lessonVersion: raw.version, lessonSha256: hash(raw.content) };
  };
  const materialState = (raw: any, lesson: ReturnType<typeof canonical>): Material => {
    if (!raw) return {revision: 0, answers: {}, completed: false, lessonVersion: lesson.lessonVersion, lessonSha256: lesson.lessonSha256};
    fail(raw.lessonVersion === lesson.lessonVersion && raw.lessonSha256 === lesson.lessonSha256, 'LESSON_CHANGED_REVIEW_REQUIRED');
    return raw;
  };
  const view = async (actor: Actor, id: string) => {
    actorCheck(actor);const identity = parseId(id);
    return db.runTransaction(async (tx: any) => {
      const ctx = await context(tx, actor);
      fail(progressiveDayAccess(identity.day, ctx.completed, ctx.paid||ctx.tester, ctx.ceo), 'PROGRESSION_OR_SUBSCRIPTION_REQUIRED');
      const [l, c, m] = await Promise.all([tx.get(ref('homologated_lessons/' + id)), tx.get(ref('homologated_parts/' + id)), tx.get(ref('study_progress/' + actor.uid + '/materials/' + id))]);
      const lesson = canonical(id, l.data()), catalog = c.data();
      const catalogVersionMatches = catalog?.version === undefined || catalog.version === lesson.lessonVersion;
      fail(catalog?.id === id && catalogVersionMatches && catalog.day === identity.day && catalog.part === identity.part && catalog.status === 'approved', 'CATALOG_INCONSISTENT');
      const state = materialState(m.data(), lesson);
      if(identity.day>2&&!ctx.ceo)fail(subscriptionIsCurrent(ctx.subscription,now())||testerIsCurrent(ctx.testerGrant,actor.uid,now()),'ACCESS_EXPIRED');
      return {uid: actor.uid, lesson: lesson.raw, material: state, completedDays: ctx.completed, allowedDays: Array.from({length:100},(_,i)=>i+1).filter(d=>progressiveDayAccess(d,ctx.completed,ctx.paid||ctx.tester,ctx.ceo)), validUntil: ctx.ceo || identity.day<=2 ? now()+15000 : Math.min(now()+15000,ctx.accessUntil)};
    });
  };
  const mutate = async (actor: Actor, input: any, finalize: boolean) => {
    actorCheck(actor);fail(input && typeof input === 'object' && !Array.isArray(input), 'INVALID_ARGUMENT');
    const keys = ['lessonId','lessonVersion','lessonSha256','expectedRevision','requestId',finalize?'confirmStudied':'answers'];
    fail(Object.keys(input).length === keys.length && Object.keys(input).every(k=>keys.includes(k)), 'INVALID_ARGUMENT');
    const {day} = parseId(input.lessonId), id = input.lessonId;
    fail(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId) && Number.isSafeInteger(input.expectedRevision) && input.expectedRevision >= 0, 'INVALID_ARGUMENT');
    if (finalize) fail(input.confirmStudied === true, 'EXPLICIT_COMPLETION_REQUIRED');
    else fail(input.answers && typeof input.answers === 'object' && !Array.isArray(input.answers) && Object.keys(input.answers).length <= 100 && Object.keys(input.answers).length > 0, 'INVALID_ANSWERS');
    const payloadHash = hash(JSON.stringify({finalize,input})), materialRef = ref('study_progress/'+actor.uid+'/materials/'+id), receiptRef = ref('study_progress/'+actor.uid+'/requests/'+input.requestId);
    return db.runTransaction(async (tx: any) => {
      const ctx = await context(tx, actor);
      fail(progressiveDayAccess(day,ctx.completed,ctx.paid||ctx.tester,ctx.ceo),'PROGRESSION_OR_SUBSCRIPTION_REQUIRED');
      const [l,c,m,receipt] = await Promise.all([tx.get(ref('homologated_lessons/'+id)),tx.get(ref('homologated_parts/'+id)),tx.get(materialRef),tx.get(receiptRef)]);
      if(receipt.exists){fail(receipt.data().payloadHash===payloadHash,'IDEMPOTENCY_CONFLICT');return receipt.data().result;}
      const lesson = canonical(id,l.data());
      const cVersionMatches = c.data()?.version === undefined || c.data()?.version === lesson.lessonVersion;
      fail(cVersionMatches && c.data()?.id===id && c.data()?.status==='approved','CATALOG_INCONSISTENT');
      fail(input.lessonVersion===lesson.lessonVersion && input.lessonSha256===lesson.lessonSha256,'BASELINE_CHANGED');
      const state=materialState(m.data(),lesson);fail(input.expectedRevision===state.revision,'REVISION_CONFLICT');
      if(finalize&&state.completed){
        if(day>2&&!ctx.ceo)fail(subscriptionIsCurrent(ctx.subscription,now())||testerIsCurrent(ctx.testerGrant,actor.uid,now()),'ACCESS_EXPIRED');
        const result={uid:actor.uid,lessonId:id,material:state,dayCompleted:ctx.completed.includes(day),completedDays:ctx.completed,source:'server_confirmed'};
        tx.create(receiptRef,{payloadHash,result,createdAt:now()});return result;
      }
      const answers={...state.answers};
      if(!finalize){fail(!state.completed,'ALREADY_COMPLETED');for(const [key,value]of Object.entries(input.answers)){fail(/^(0|[1-9][0-9]?)$/.test(key) && Number(key)<lesson.questions.length && Number.isInteger(value) && (value as number)>=0 && (value as number)<lesson.questions[Number(key)].options.length,'INVALID_ANSWERS');answers[key]=value as number;}}
      const verifiedDays=days(ctx.progress.verifiedDays);let dayCompleted=ctx.completed.includes(day);
      if(finalize){
        fail(lesson.questions.every((_,i)=>Object.hasOwn(answers,String(i))),'ANSWERS_INCOMPLETE');
        const count=curriculumParts(day),all=[];
        // All reads occur before any write; concurrent completions retry against the same progress head.
        for(let part=0;part<count;part++){
          const otherId='day_'+day+'_part_'+part;
          if(otherId===id){all.push(true);continue;}
          const [ol,om,oc]=await Promise.all([tx.get(ref('homologated_lessons/'+otherId)),tx.get(ref('study_progress/'+actor.uid+'/materials/'+otherId)),tx.get(ref('homologated_parts/'+otherId))]);
          const other=canonical(otherId,ol.data()),done=om.data();
          const ocVersionMatches = oc.data()?.version === undefined || oc.data()?.version === other.lessonVersion;
          fail(oc.data()?.id===otherId && ocVersionMatches && oc.data()?.status==='approved','CATALOG_INCONSISTENT');
          all.push(done?.completed===true && done.lessonVersion===other.lessonVersion && done.lessonSha256===other.lessonSha256);
        }
        dayCompleted=dayCompleted||all.every(Boolean);if(dayCompleted&&!verifiedDays.includes(day))verifiedDays.push(day);
      }
      const next={...state,answers,revision:state.revision+1,completed:finalize||state.completed,updatedAt:now(),...(finalize?{completionSource:'server_verified',completedAt:now()}: {})};
      const result={uid:actor.uid,lessonId:id,material:next,dayCompleted,completedDays:[...new Set([...ctx.completed,...verifiedDays])],source:'server_confirmed'};
      if(day>2&&!ctx.ceo)fail(subscriptionIsCurrent(ctx.subscription,now())||testerIsCurrent(ctx.testerGrant,actor.uid,now()),'ACCESS_EXPIRED');
      tx.set(materialRef,next);tx.set(ref('study_progress/'+actor.uid),{...ctx.progress,verifiedDays,revision:(ctx.progress.revision||0)+1,updatedAt:now()});tx.create(receiptRef,{payloadHash,result,createdAt:now()});return result;
    });
  };
  const access=async(actor:Actor)=>{actorCheck(actor);return db.runTransaction(async(tx:any)=>{const ctx=await context(tx,actor);const grant=ctx.testerGrant;return {uid:actor.uid,completedDays:ctx.completed,verifiedDays:days(ctx.progress.verifiedDays),legacyDays:days(ctx.progress.legacyImport?.approvedDays),unreviewedLegacyDays:ctx.unreviewedLegacyDays,ceo:ctx.ceo,allowedDays:Array.from({length:100},(_,i)=>i+1).filter(d=>progressiveDayAccess(d,ctx.completed,ctx.paid||ctx.tester,ctx.ceo)),subscriptionActive:ctx.paid,testerAccess:{active:ctx.tester,expiresAt:grant?.uid===actor.uid?grant.expiresAt:null,state:!grant?'none':grant.revoked?'revoked':ctx.tester?'active':'expired'},validUntil:(ctx.paid||ctx.tester)&&!ctx.ceo?Math.min(now()+15000,ctx.accessUntil):now()+15000};});};
  const materials=async(actor:Actor)=>{actorCheck(actor);const snap=await db.collection('study_progress/'+actor.uid+'/materials').get();const items:Array<{lessonId:string;revision:number;answers:Record<string,number>;completed:boolean;lessonVersion:number;lessonSha256:string;updatedAt?:number;completedAt?:number}>=[];snap.forEach((docSnap:any)=>{const data=docSnap.data();items.push({lessonId:docSnap.id,revision:data.revision||0,answers:data.answers||{},completed:data.completed===true,lessonVersion:data.lessonVersion||1,lessonSha256:data.lessonSha256||'',updatedAt:data.updatedAt,completedAt:data.completedAt});});return {uid:actor.uid,materials:items};};
  const sessions=async(actor:Actor)=>{actorCheck(actor);return db.runTransaction(async(tx:any)=>{const ctx=await context(tx,actor);const snap=await db.collection('users/'+actor.uid+'/sessions').get();const list:any[]=[];snap.forEach((docSnap:any)=>{const data=docSnap.data();const rawMessages=Array.isArray(data.messages)?data.messages:[];const sanitizedMessages=rawMessages.map((m:any)=>{if(!m||typeof m!=='object')return m;if(m.role==='user')return m;let trilhaDay=Number(m.trilhaDay??data.trilhaDay);if(!Number.isInteger(trilhaDay)||trilhaDay<1){const tm=/Dia\s+([1-9][0-9]?)/i.exec(String(data.title||''));if(tm)trilhaDay=Number(tm[1]);else{const lm=/day_([1-9][0-9]?)_part_/i.exec(String(m.lessonId||data.lessonId||m.content||''));if(lm)trilhaDay=Number(lm[1]);}}const hasProtectedBlocks=typeof m.content==='string'&&(/\[BLOCK_[1-6]\]/i.test(m.content)||/\[ATHENA_CHALLENGE\]/i.test(m.content));if(Number.isInteger(trilhaDay)&&hasProtectedBlocks){const hasAccess=progressiveDayAccess(trilhaDay,ctx.completed,ctx.paid||ctx.tester,ctx.ceo);if(!hasAccess){return {...m,content:'[Conteúdo da aula protegido — Exige progressão e benefício ativo para visualização.]'};}}return m;});list.push({id:docSnap.id,userId:actor.uid,title:data.title||'Nova Mentoria',messages:sanitizedMessages,guidedSubject:data.guidedSubject??null,currentArticle:data.currentArticle??1,lastUpdatedAt:data.lastUpdatedAt??0,reviews:Array.isArray(data.reviews)?data.reviews:[],trilhaDay:data.trilhaDay??null,trilhaMaterialIndex:data.trilhaMaterialIndex??null,trilhaSessionType:data.trilhaSessionType??null});});return {uid:actor.uid,sessions:list};});};
  return {view,access,materials,sessions,saveAnswers:(a:Actor,i:any)=>mutate(a,i,false),completeMaterial:(a:Actor,i:any)=>mutate(a,i,true)};
}
