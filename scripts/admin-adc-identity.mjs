import {GoogleAuth,OAuth2Client,UserRefreshClient} from 'google-auth-library';
const PROJECT='gen-lang-client-0822763072';
const SCOPES=['openid','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/cloud-platform'];
const fail=()=>{throw new Error('Identidade administrativa ADC não comprovada');};

// Recebe tokens somente do fluxo de renovação das ADC descobertas pela biblioteca.
// tokeninfo é usado exclusivamente para escopos, depois da validação do ID token.
export async function authenticateAdminAdc({isAuthorizedEmail,auth=new GoogleAuth({scopes:SCOPES}),verifier=new OAuth2Client(),now=()=>Date.now()}={}){
 let diagnosticStage='adc-discovery';
 try{
  if(typeof isAuthorizedEmail!=='function')fail();
  const client=await auth.getClient();
  if(!(client instanceof UserRefreshClient)||client.quotaProjectId!==PROJECT)fail();
  const audience=client._clientId;
  if(typeof audience!=='string'||!audience.endsWith('.apps.googleusercontent.com'))fail();
  diagnosticStage='adc-token-refresh';const renewed=await client.refreshAccessToken();
  const {id_token:idToken,access_token:accessToken}=renewed.credentials??{};
  if(!idToken||!accessToken)fail();
  diagnosticStage='adc-id-token';const ticket=await verifier.verifyIdToken({idToken,audience});
  const claims=ticket.getPayload();
  if(!claims||!['accounts.google.com','https://accounts.google.com'].includes(claims.iss)||claims.aud!==audience||
     (claims.azp&&claims.azp!==audience)||typeof claims.sub!=='string'||!claims.sub||
     !Number.isFinite(claims.exp)||claims.exp*1000<=now()||!Number.isFinite(claims.iat)||claims.iat*1000>now()+60000||
     claims.email_verified!==true||!isAuthorizedEmail(claims.email))fail();
  diagnosticStage='adc-scopes';const info=await verifier.getTokenInfo(accessToken);
  if(info.expiry_date<=now()||!SCOPES.every(scope=>info.scopes?.includes(scope)))fail();
  return {identity:{id:`google:${claims.sub}`,authorized:true},client};
 }catch(error){const failure=new Error('Identidade administrativa ADC não comprovada',{cause:error});failure.diagnosticStage=diagnosticStage;throw failure;}
}
