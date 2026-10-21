import fs from'node:fs';import assert from'node:assert/strict';
const host='http://127.0.0.1:8197',project='demo-athena-client-safe',base=host+'/v1/projects/'+project+'/databases/(default)/documents',results=[];
const r=await fetch(host+'/emulator/v1/projects/'+project+':securityRules',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules:{files:[{name:'firestore.rules',content:fs.readFileSync('work/athena-progress-subscriptions/docs/progression/firestore.candidate.rules','utf8')}]}})});assert.equal(r.status,200,await r.text());
const jwt=(uid,google=false)=>['eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',Buffer.from(JSON.stringify({iss:'https://securetoken.google.com/'+project,aud:project,sub:uid,user_id:uid,email:uid==='ceo'?'jhonny.spider@gmail.com':'synthetic@example.invalid',email_verified:true,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,firebase:{sign_in_provider:google?'google.com':'password',identities:{}}})).toString('base64url'),''].join('.');
const value=v=>typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:Array.isArray(v)?{arrayValue:{values:v.map(value)}}:{mapValue:{fields:fields(v)}};
const fields=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,value(v)]));
const req=(path,data={},token=jwt('student'),method='PATCH')=>fetch(base+'/'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify({fields:fields(data)})})});
const check=async(name,status,p)=>{const r=await p;assert.equal(r.status,status,name+' '+await r.text());results.push(name);};
for(const collection of ['tester_invites','tester_invite_lookup','tester_invite_issuance','tester_access','tester_invite_attempts','tester_invite_audit']){
 await check(collection+' cannot be read directly',403,req(collection+'/student',{},jwt('student'),'GET'));
 await check(collection+' cannot be self-assigned',403,req(collection+'/student',{uid:'student',revoked:false,expiresAt:9999999999999}));
}
await check('CEO browser cannot bypass invite issuance service',403,req('tester_invites/direct',{state:'issued'},jwt('ceo',true)));
fs.writeFileSync('outputs/progress-subscriptions/invite-rules-results.json',JSON.stringify({passed:results.length,results,emulatorOnly:true},null,2));console.log(JSON.stringify({passed:results.length,results}));