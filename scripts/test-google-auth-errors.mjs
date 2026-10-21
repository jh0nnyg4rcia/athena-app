import fs from 'node:fs';import assert from 'node:assert/strict';import {transformSync} from '../../athena-integration/node_modules/esbuild/lib/main.js';
const path='work/athena-platform-preparation/src/services/authClient.ts',source=fs.readFileSync(path,'utf8');
const section=source.slice(source.indexOf('const SAFE_MESSAGES'),source.indexOf('async function postAuth'));
const {code}=transformSync(section,{loader:'ts',format:'esm'});
const {publicClientAuthError:format}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const cases=[
 ['closed popup is ambiguous',{code:'auth/popup-closed-by-user'},'A janela do Google foi fechada antes de concluir o login. Se você não cancelou, pode haver uma falha de autenticação.'],
 ['explicit cancellation remains cancellation',{code:'canceled'},'O login com o Google foi cancelado.'],
 ['redirect mismatch is configuration',{code:'redirect_uri_mismatch'},'Não foi possível entrar com o Google por uma configuração de autenticação. Informe o erro ao suporte.'],
 ['known mismatch in SDK message is configuration',new Error('redirect_uri_mismatch'),'Não foi possível entrar com o Google por uma configuração de autenticação. Informe o erro ao suporte.'],
 ['unauthorized domain is configuration',{code:'auth/unauthorized-domain'},'Não foi possível entrar com o Google por uma configuração de autenticação. Informe o erro ao suporte.'],
 ['popup blocked remains actionable',{code:'auth/popup-blocked'},'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.'],
 ['unknown error cannot be blamed on user',{code:'unknown-cancelled-provider-failure'},'Não foi possível concluir a autenticação. Tente novamente.'],
 ['untrusted detail is not exposed',new Error('synthetic-private-detail'),'Não foi possível concluir a autenticação. Tente novamente.'],
];
for(const[name,input,expected]of cases)assert.equal(format(input),expected,name);
fs.writeFileSync('outputs/platform-round1/google-auth-errors-tests.json',JSON.stringify({passed:cases.length,cases:cases.map(x=>x[0]),realOAuth:false},null,2));console.log(JSON.stringify({passed:cases.length}));
