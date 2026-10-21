import {UserRefreshClient} from 'google-auth-library';
import {ATHENA_TARGET} from './publish-reviewed-questions.mjs';

const failure=()=>new Error('Cabeçalhos ADC incompatíveis com gRPC');

// google-auth v10 retorna Headers; grpc-js instalado espera Record<string,string>.
// Não decodifica tokens, não gera credenciais e não registra cabeçalhos.
export function normalizeGrpcAuthHeaders(headers){
 try{
  const entries=typeof headers?.entries==='function'?headers.entries():Object.entries(headers??{});
  const result=Object.create(null);
  for(const [name,value] of entries){
   if(typeof name!=='string'||typeof value!=='string'||!/^[-a-zA-Z0-9]+$/.test(name)||/[\r\n\0]/.test(value))throw failure();
   const key=name.toLowerCase();if(Object.hasOwn(result,key))throw failure();result[key]=value;
  }
  if(!/^Bearer [A-Za-z0-9._~+\/-]+=*$/i.test(result.authorization??'')||result['x-goog-user-project']!==ATHENA_TARGET.projectId)throw failure();
  return result;
 }catch{throw failure();}
}

// Proxy por instância: métodos e estado continuam pertencendo à ADC validada.
// Apenas o formato de retorno da API pública getRequestHeaders é adaptado.
export function createGrpcCompatibleAdcClient(client){
 if(!(client instanceof UserRefreshClient)||client.quotaProjectId!==ATHENA_TARGET.projectId||typeof client.getRequestHeaders!=='function')throw failure();
 const methods=new Map();
 const getRequestHeaders=async url=>{
  try{return normalizeGrpcAuthHeaders(await client.getRequestHeaders(url));}
  catch{throw failure();}
 };
 return new Proxy(client,{get(target,key){
  if(key==='getRequestHeaders')return getRequestHeaders;
  const value=Reflect.get(target,key,target);
  if(typeof value!=='function'||key==='constructor')return value;
  if(!methods.has(key)||methods.get(key).original!==value)methods.set(key,{original:value,bound:value.bind(target)});
  return methods.get(key).bound;
 }});
}
