import {createHash} from 'node:crypto';
/** Preview only. Accepts an administrative server snapshot, never browser localStorage or a client request. */
export function planLegacyProgress(snapshot:{uid:string;sourcePath:string;updateTime:string;data:{completedDays?:unknown}},review:{reference:string;reviewerId:string;approvedDays:number[]}) {
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(snapshot.uid)||snapshot.sourcePath!==`users/${snapshot.uid}/trilha/progress`||!snapshot.updateTime||!review.reference||!review.reviewerId)throw Error('LEGACY_ORIGIN_REQUIRED');
  const source=snapshot.data.completedDays;
  if(!Array.isArray(source)||source.some(d=>!Number.isInteger(d)||d<1||d>100))throw Error('INVALID_LEGACY_HISTORY');
  if(review.approvedDays.some(d=>!source.includes(d)))throw Error('LEGACY_APPROVAL_OUTSIDE_SOURCE');
  const sourceSha256=createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  return {uid:snapshot.uid,sourcePath:snapshot.sourcePath,sourceUpdateTime:snapshot.updateTime,sourceSha256,targetPath:`study_progress/${snapshot.uid}`,legacyImport:{source:'legacy_administrative_review',approvedDays:[...new Set(review.approvedDays)].sort((a,b)=>a-b),originalDays:[...source],reference:review.reference,reviewerId:review.reviewerId},verifiedDays:[],requiresBackup:true,requiresExplicitMigrationAuthorization:true,preconditions:['source updateTime/hash unchanged','target has no existing legacyImport','preserve existing verifiedDays'],grantsSubscription:false,grantsCeo:false};
}
