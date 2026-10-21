import {auth} from '../lib/firebase';
import {getApiUrl} from './geminiService';
import {assertStudyBaseline,type StudyBaseline} from '../lib/studyBaseline';
import {createAccountContentSession} from '../lib/accountContentSession';
export type StudyState={uid:string;material:{revision:number;answers:Record<string,number>;completed:boolean;lessonVersion:number;lessonSha256:string};completedDays:number[]};
export async function studyRequest<T>(path:string,body?:unknown):Promise<T>{
  const user=auth.currentUser;if(!user)throw Error('AUTHENTICATION_REQUIRED');
  const token=await user.getIdToken();
  const r=await fetch(getApiUrl(path),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...body?{'Content-Type':'application/json'}:{}},cache:'no-store',...(body?{body:JSON.stringify(body)}:{})});
  const data=await r.json().catch(()=>({}));
  if(auth.currentUser?.uid!==user.uid)throw Error('ACCOUNT_CHANGED');
  if(!r.ok)throw Error(/^[A-Z_]+$/.test(data.error)?data.error:'CONFIRMATION_PENDING');
  if(data.uid!==user.uid)throw Error('ACCOUNT_CHANGED');return data;
}
export const loadStudyMaterial=(id:string)=>studyRequest<StudyState>('/api/study/material/'+encodeURIComponent(id));
export type AccessState={uid:string;completedDays:number[];verifiedDays:number[];legacyDays:number[];unreviewedLegacyDays:number[];allowedDays:number[];ceo:boolean;subscriptionActive:boolean;testerAccess:{active:boolean;expiresAt:number|null;state:'none'|'revoked'|'active'|'expired'};validUntil:number};
let snapshot:AccessState|null=null;
export async function refreshStudyAccess(){snapshot=null;const s=await studyRequest<AccessState>('/api/study/access');snapshot=Object.freeze({...s,allowedDays:Object.freeze([...s.allowedDays]) as unknown as number[]});return s;}
export function studyEditorialAccess(){return !!snapshot&&snapshot.uid===auth.currentUser?.uid&&snapshot.ceo&&Date.now()<snapshot.validUntil;}

export type StudyLessonEnvelope = {
  uid: string;
  lesson: import('../types').HomologatedLesson;
  material: StudyState['material'];
  completedDays: number[];
  allowedDays: number[];
  validUntil: number;
};

export async function loadAuthorizedLessonEnvelope(id: string): Promise<StudyLessonEnvelope> {
  return studyRequest<StudyLessonEnvelope>('/api/study/lesson/' + encodeURIComponent(id));
}

export const studyContentSession = createAccountContentSession<import('../types').HomologatedLesson>(
  async (id: string) => {
    return loadAuthorizedLessonEnvelope(id);
  }
);

export async function readStudyLesson(id: string) {
  return studyContentSession.read(id);
}
const queues=new Map<string,Promise<unknown>>();
export function saveStudyAnswer(id:string,index:number,value:number,shown?:StudyBaseline){
  const uid=auth.currentUser?.uid;if(!uid)return Promise.reject(Error('AUTHENTICATION_REQUIRED'));
  const key=uid+'/'+id;
  const next=(queues.get(key)||Promise.resolve()).catch(()=>undefined).then(async()=>{
    if(auth.currentUser?.uid!==uid)throw Error('ACCOUNT_CHANGED');const s=await loadStudyMaterial(id);
    assertStudyBaseline(s.material,shown);
    if(s.material.completed||s.material.answers[String(index)]===value)return s;
    return studyRequest<StudyState>('/api/study/answers',{lessonId:id,lessonVersion:s.material.lessonVersion,lessonSha256:s.material.lessonSha256,expectedRevision:s.material.revision,requestId:crypto.randomUUID(),answers:{[index]:value}});
  });queues.set(key,next);return next;
}
export async function completeStudyMaterial(id:string,answers:Record<string,number>,shown?:StudyBaseline){
  const uid=auth.currentUser?.uid;await queues.get(uid+'/'+id)?.catch(()=>undefined);
  let s=await loadStudyMaterial(id);
  assertStudyBaseline(s.material,shown);
  if(!s.material.completed){
    const delta=Object.fromEntries(Object.entries(answers||{}).filter(([k,v])=>s.material.answers[k]!==v));
    if(Object.keys(delta).length)s=await studyRequest<StudyState>('/api/study/answers',{lessonId:id,lessonVersion:s.material.lessonVersion,lessonSha256:s.material.lessonSha256,expectedRevision:s.material.revision,requestId:crypto.randomUUID(),answers:delta});
  }
  return studyRequest<StudyState&{dayCompleted:boolean}>('/api/study/complete',{lessonId:id,lessonVersion:s.material.lessonVersion,lessonSha256:s.material.lessonSha256,expectedRevision:s.material.revision,requestId:crypto.randomUUID(),confirmStudied:true});
}

export type StudentMaterialSummary = {
  lessonId: string;
  revision: number;
  answers: Record<string, number>;
  completed: boolean;
  lessonVersion: number;
  lessonSha256: string;
  updatedAt?: number;
  completedAt?: number;
};

export async function loadStudentMaterials(): Promise<{ uid: string; materials: StudentMaterialSummary[] }> {
  return studyRequest<{ uid: string; materials: StudentMaterialSummary[] }>('/api/study/materials');
}

export async function loadAuthorizedStudentSessions(): Promise<{ uid: string; sessions: import('../types').ChatSession[] }> {
  return studyRequest<{ uid: string; sessions: import('../types').ChatSession[] }>('/api/study/sessions');
}

export function clearStudySession(): void {
  queues.clear();
  snapshot = null;
  studyContentSession.clear();
}

