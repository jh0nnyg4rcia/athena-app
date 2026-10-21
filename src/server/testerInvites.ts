import {createHash,randomBytes,randomUUID} from 'node:crypto';
type Actor={uid:string;emailVerified:boolean;provider:string};
const digest=(code:string)=>createHash('sha256').update('ATHENA_TEST_INVITE_V1\0'+code).digest('hex');
const uuid=(s:unknown)=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const validUid=(s:unknown)=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(s);
function requireValue(ok:unknown,code:string):asserts ok{if(!ok)throw Error(code);}
export function testerIsCurrent(grant:any,uid:string,now:number){return !!grant&&grant.uid===uid&&grant.source==='invite_redemption'&&uuid(grant.inviteId)&&grant.revoked===false&&Number.isSafeInteger(grant.grantedAt)&&grant.grantedAt<=now&&Number.isSafeInteger(grant.expiresAt)&&now<grant.expiresAt;}
/** Same existing server/Firestore; all collections are private and codes are returned once only. */
export function createTesterInvites(db:any,now=Date.now){
  const ref=(path:string)=>db.doc(path);
  const authenticated=(a:Actor)=>requireValue(a&&validUid(a.uid),'AUTHENTICATION_REQUIRED');
  const ceo=async(tx:any,a:Actor)=>{authenticated(a);const g=(await tx.get(ref('access_admins/'+a.uid))).data();const isLocal = process.env.ATHENA_STUDY_PROGRESS_LOCAL === 'true';const validProvider = a.provider === 'google.com' || (isLocal && a.provider === 'password');requireValue(a.emailVerified&&validProvider&&g?.uid===a.uid&&g?.enabled===true&&g?.role==='ceo','CEO_REQUIRED');};
  const issue=async(actor:Actor,input:any)=>{
    authenticated(actor);requireValue(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>['requestId','redeemUntil','benefitUntil','intendedUid'].includes(k))&&uuid(input.requestId),'INVALID_ARGUMENT');
    requireValue(Number.isSafeInteger(input.redeemUntil)&&Number.isSafeInteger(input.benefitUntil)&&now()<input.redeemUntil&&input.redeemUntil<=input.benefitUntil,'INVALID_VALIDITY');
    requireValue(input.intendedUid===undefined||validUid(input.intendedUid),'INVALID_RECIPIENT');
    const inviteId=randomUUID(),code='AT1-'+randomBytes(32).toString('base64url'),codeHash=digest(code),auditId=randomUUID();
    const request=ref('tester_invite_issuance/'+digest(actor.uid+'/'+input.requestId));
    const inputHash=digest(JSON.stringify({redeemUntil:input.redeemUntil,benefitUntil:input.benefitUntil,intendedUid:input.intendedUid??null}));
    return db.runTransaction(async(tx:any)=>{
      await ceo(tx,actor);const previous=await tx.get(request);
      if(previous.exists){requireValue(previous.data().inputHash===inputHash,'IDEMPOTENCY_CONFLICT');return{uid:actor.uid,inviteId:previous.data().inviteId,code:null,alreadyIssued:true};}
      requireValue(now()<input.redeemUntil,'INVALID_VALIDITY');
      const record={inviteId,codeHash,state:'issued',issuedBy:actor.uid,issuedAt:now(),redeemUntil:input.redeemUntil,benefitUntil:input.benefitUntil,intendedUid:input.intendedUid??null,boundUid:null};
      tx.create(ref('tester_invites/'+inviteId),record);tx.create(ref('tester_invite_lookup/'+codeHash),{inviteId});
      tx.create(request,{inviteId,inputHash,createdAt:now()});tx.create(ref('tester_invite_audit/'+auditId),{event:'issued',inviteId,actorUid:actor.uid,at:now()});
      // No raw code is written to a document, log, URL, or persistent client storage.
      return{uid:actor.uid,inviteId,code,redeemUntil:input.redeemUntil,benefitUntil:input.benefitUntil,alreadyIssued:false};
    });
  };
  const redeem=async(actor:Actor,input:any)=>{
    authenticated(actor);requireValue(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).length===1&&Object.hasOwn(input,'code')&&typeof input.code==='string'&&input.code.length<=128,'INVALID_ARGUMENT');
    const code=input.code,shape=/^AT1-[A-Za-z0-9_-]{43}$/.test(code),key=shape?digest(code):null,auditId=randomUUID();
    const outcome=await db.runTransaction(async(tx:any)=>{
      const stamp=now(),attemptRef=ref('tester_invite_attempts/'+actor.uid),attempt=(await tx.get(attemptRef)).data()||{};
      const minute=Math.floor(stamp/60000),day=Math.floor(stamp/86400000),minuteCount=attempt.minute===minute?attempt.minuteCount:0,dayCount=attempt.day===day?attempt.dayCount:0;
      requireValue(Number.isSafeInteger(minuteCount)&&minuteCount>=0&&Number.isSafeInteger(dayCount)&&dayCount>=0,'INVITE_LIMIT_UNAVAILABLE');
      if(minuteCount>=5||dayCount>=20)return{error:'INVITE_RATE_LIMITED'};
      const lookup=key?await tx.get(ref('tester_invite_lookup/'+key)):null,inviteId=lookup?.data()?.inviteId;
      const invite=uuid(inviteId)?await tx.get(ref('tester_invites/'+inviteId)):null,record=invite?.data();
      const grantRef=ref('tester_access/'+actor.uid),existing=(await tx.get(grantRef)).data();
      const finish=now();
      const available=record&&record.codeHash===key&&record.state==='issued'&&finish<record.redeemUntil&&finish<record.benefitUntil&&(!record.intendedUid||record.intendedUid===actor.uid);
      const alreadyActive=testerIsCurrent(existing,actor.uid,stamp);
      tx.set(attemptRef,{minute,day,minuteCount:minuteCount+1,dayCount:dayCount+1,updatedAt:stamp});
      if(!available||alreadyActive)return{error:'INVITE_UNAVAILABLE'};
      tx.update(ref('tester_invites/'+inviteId),{state:'redeemed',boundUid:actor.uid,redeemedAt:stamp});
      tx.set(grantRef,{uid:actor.uid,source:'invite_redemption',inviteId,grantedAt:stamp,expiresAt:record.benefitUntil,revoked:false});
      tx.create(ref('tester_invite_audit/'+auditId),{event:'redeemed',inviteId,actorUid:actor.uid,at:stamp});
      return{uid:actor.uid,active:true,expiresAt:record.benefitUntil};
    });
    // Throw after commit so a failed attempt cannot roll back its rate-limit counter.
    if(outcome.error)throw Error(outcome.error);return outcome;
  };
  const revoke=async(actor:Actor,input:any)=>{
    authenticated(actor);requireValue(input&&typeof input==='object'&&Object.keys(input).length===1&&uuid(input.inviteId),'INVALID_ARGUMENT');const auditId=randomUUID();
    return db.runTransaction(async(tx:any)=>{
      await ceo(tx,actor);const inviteRef=ref('tester_invites/'+input.inviteId),snap=await tx.get(inviteRef),record=snap.data();requireValue(record,'INVITE_NOT_FOUND');
      if(record.state==='revoked')return{uid:actor.uid,inviteId:input.inviteId,revoked:true};
      const grant=record.boundUid?await tx.get(ref('tester_access/'+record.boundUid)):null;
      tx.update(inviteRef,{state:'revoked',revokedAt:now(),revokedBy:actor.uid});
      if(grant?.data()?.inviteId===input.inviteId)tx.update(ref('tester_access/'+record.boundUid),{revoked:true,revokedAt:now()});
      tx.create(ref('tester_invite_audit/'+auditId),{event:'revoked',inviteId:input.inviteId,actorUid:actor.uid,at:now()});
      return{uid:actor.uid,inviteId:input.inviteId,revoked:true};
    });
  };
  const list=async(actor:Actor)=>db.runTransaction(async(tx:any)=>{await ceo(tx,actor);const snap=await tx.get(db.collection('tester_invites').orderBy('issuedAt','desc').limit(50));return{uid:actor.uid,invites:snap.docs.map((d:any)=>{const r=d.data();return{inviteId:r.inviteId,state:r.state,issuedAt:r.issuedAt,redeemUntil:r.redeemUntil,benefitUntil:r.benefitUntil,boundUid:r.boundUid,intendedUid:r.intendedUid};})};});
  return{issue,redeem,revoke,list};
}
