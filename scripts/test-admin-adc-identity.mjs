import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createSign} from 'node:crypto';
import {OAuth2Client,UserRefreshClient} from 'google-auth-library';
import {authenticateAdminAdc} from './admin-adc-identity.mjs';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const audience='synthetic.apps.googleusercontent.com',seconds=Math.floor(Date.now()/1000);
function fixture(kind){
 const claims={iss:'https://accounts.google.com',aud:audience,sub:'synthetic-subject',email:'admin@example.invalid',email_verified:true,iat:seconds,exp:seconds+3600};
 if(kind==='identity')claims.email='other@example.invalid';if(kind==='unverified')claims.email_verified=false;
 if(kind==='expired')claims.exp=seconds-600;if(kind==='audience')claims.aud='other';if(kind==='issuer')claims.iss='https://untrusted.invalid';
 const header=Buffer.from(JSON.stringify({alg:'RS256',kid:'synthetic'})).toString('base64url');const body=Buffer.from(JSON.stringify(claims)).toString('base64url');const unsigned=`${header}.${body}`;
 const signature=createSign('RSA-SHA256').update(unsigned).sign(privateKey).toString('base64url');let idToken=`${unsigned}.${signature}`;if(kind==='signature')idToken=`${unsigned}.AAAA`;
 const client=new UserRefreshClient(audience,'synthetic-secret','synthetic-refresh');client.quotaProjectId=kind==='quota'?'wrong-project':'gen-lang-client-0822763072';
 client.refreshAccessToken=async()=>{if(kind==='unavailable')throw Error('offline');if(kind==='403')throw Object.assign(Error('denied'),{response:{status:403}});if(kind==='invalid-adc')throw Error('invalid_grant');return {credentials:{id_token:kind==='missing-id'?undefined:idToken,access_token:'synthetic-access'}};};
 const verifier=new OAuth2Client();verifier.getFederatedSignonCertsAsync=async()=>({certs:{synthetic:publicKey.export({type:'spki',format:'pem'})},format:'PEM'});
 verifier.getTokenInfo=async()=>({expiry_date:Date.now()+3600000,scopes:kind==='scope'?['openid']:['openid','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/cloud-platform']});
 return {auth:{getClient:async()=>client},verifier,isAuthorizedEmail:e=>e==='admin@example.invalid'};
}
test('ADC: ID token assinado válido identifica administrador e mantém o mesmo cliente',async()=>{const options=fixture(),result=await authenticateAdminAdc(options);assert.deepEqual(result.identity,{id:'google:synthetic-subject',authorized:true});assert.equal(result.client,await options.auth.getClient());});
for(const kind of ['identity','unverified','expired','audience','issuer','signature','quota','unavailable','403','invalid-adc','missing-id','scope'])test(`ADC: rejeita ${kind} sem expor erros ou tokens`,async()=>{await assert.rejects(authenticateAdminAdc(fixture(kind)),{message:'Identidade administrativa ADC não comprovada'});});
test('ADC: tokeninfo não é chamado antes da comprovação criptográfica',async()=>{const f=fixture('signature');let calls=0;f.verifier.getTokenInfo=async()=>{calls++;return {};};await assert.rejects(authenticateAdminAdc(f));assert.equal(calls,0);});
test('ADC: credencial de serviço incompatível é recusada',async()=>{const f=fixture();f.auth.getClient=async()=>new OAuth2Client();await assert.rejects(authenticateAdminAdc(f));});
