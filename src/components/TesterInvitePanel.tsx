import {useEffect,useState,useRef,type FormEvent} from 'react';
import {refreshStudyAccess,studyRequest,type AccessState} from '../services/studyProgressClient';
type Invite={inviteId:string;state:string;redeemUntil:number;benefitUntil:number;boundUid:string|null;intendedUid:string|null};
const date=(n:number)=>new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Cuiaba'}).format(n)+' (Cuiabá)';
const localDate=(n:number)=>{const d=new Date(n);return new Date(n-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
export function TesterInvitePanel({uid,administrativeUI}:{uid:string;administrativeUI:boolean}){
  const [access,setAccess]=useState<AccessState|null>(null),[code,setCode]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[issued,setIssued]=useState<{inviteId:string;code:string|null}|null>(null),[invites,setInvites]=useState<Invite[]>([]);
  const [redeemUntil,setRedeemUntil]=useState(()=>localDate(Date.now()+86400000)),[benefitUntil,setBenefitUntil]=useState(()=>localDate(Date.now()+7*86400000)),[intendedUid,setIntendedUid]=useState('');
  const pendingIssue=useRef<{fingerprint:string;requestId:string}|null>(null);
  const reload=async()=>{const current=await refreshStudyAccess();setAccess(current);if(current.ceo&&administrativeUI)setInvites((await studyRequest<{uid:string;invites:Invite[]}>('/api/study/test-invites')).invites);};
  useEffect(()=>{let active=true;pendingIssue.current=null;setCode('');setIssued(null);setInvites([]);setAccess(null);setNotice('');void refreshStudyAccess().then(async current=>{if(!active)return;setAccess(current);if(current.ceo&&administrativeUI){const list=await studyRequest<{uid:string;invites:Invite[]}>('/api/study/test-invites');if(active)setInvites(list.invites);}}).catch(()=>{if(active)setNotice('Conecte-se para confirmar o acesso de teste.');});return()=>{active=false;};},[uid,administrativeUI]);
  const failure=(e:unknown)=>setNotice(e instanceof Error&&e.message==='INVITE_RATE_LIMITED'?'Limite de tentativas atingido. Aguarde antes de tentar novamente.':'Não foi possível confirmar a operação. O convite pode estar indisponível ou a conexão ter falhado.');
  const redeem=async(e:FormEvent)=>{e.preventDefault();if(busy)return;setBusy(true);setNotice('');try{await studyRequest('/api/study/test-invites/redeem',{code});setCode('');await reload();setNotice('Convite resgatado e vinculado à sua conta. A progressão dos dias continua obrigatória.');}catch(e){failure(e);}finally{setBusy(false);}};
  const issue=async(e:FormEvent)=>{e.preventDefault();if(busy)return;setBusy(true);setIssued(null);try{const payload={redeemUntil:new Date(redeemUntil).getTime(),benefitUntil:new Date(benefitUntil).getTime(),...(intendedUid?{intendedUid}:{})};const fingerprint=JSON.stringify(payload);if(pendingIssue.current?.fingerprint!==fingerprint)pendingIssue.current={fingerprint,requestId:crypto.randomUUID()};const result=await studyRequest<{uid:string;inviteId:string;code:string|null}>('/api/study/test-invites/issue',{...payload,requestId:pendingIssue.current.requestId});pendingIssue.current=null;setIssued({inviteId:result.inviteId,code:result.code});await reload();setNotice(result.code?'Código exibido somente nesta emissão. Compartilhe privadamente com uma pessoa.':'Este convite já foi emitido; o código não pode ser recuperado.');}catch(e){failure(e);}finally{setBusy(false);}};
  const revoke=async(inviteId:string)=>{if(busy||!window.confirm('Revogar este convite e seu benefício de teste? A assinatura e o progresso serão preservados.'))return;setBusy(true);try{await studyRequest('/api/study/test-invites/revoke',{inviteId});if(issued?.inviteId===inviteId)setIssued(null);await reload();setNotice('Convite revogado.');}catch(e){failure(e);}finally{setBusy(false);}};
  return <section aria-label="Convites de teste" className="rounded-2xl border border-white/10 p-4 space-y-3 text-left">
    <h3 className="font-bold">Resgatar convite de teste</h3>
    <form onSubmit={redeem} className="flex flex-wrap gap-2">
      <label>Código de convite <input aria-label="Código de convite" type="password" value={code} maxLength={47} autoComplete="off" spellCheck={false} onChange={e=>setCode(e.target.value)} className="text-slate-950 rounded px-2"/></label>
      <button type="submit" disabled={busy||!code} className="px-3 py-2 border rounded">Resgatar convite de teste</button>
    </form>
    {access?.testerAccess?.expiresAt&&<p>{access.testerAccess.active?'Acesso de teste válido até':access.testerAccess.state==='revoked'?'Acesso de teste revogado. Validade original:':'Acesso de teste expirado em'} {date(access.testerAccess.expiresAt)}. A assinatura vigente, se houver, continua válida.</p>}
    <p className="text-sm">O convite não antecipa os dias nem concede ferramentas administrativas. Respostas e progresso são preservados ao terminar o benefício.</p>
    {notice&&<p role="status" aria-live="polite">{notice}</p>}
    {access?.ceo&&administrativeUI&&<div className="space-y-3 border-t pt-3">
      <h4>Convites individuais — CEO</h4><p>Datas no horário deste dispositivo; validade confirmada em Cuiabá.</p>
      <form onSubmit={issue} className="space-y-2">
        <label className="block">Resgate permitido até <input type="datetime-local" value={redeemUntil} required onChange={e=>setRedeemUntil(e.target.value)} className="text-slate-950"/></label>
        <label className="block">Benefício válido até <input type="datetime-local" value={benefitUntil} required onChange={e=>setBenefitUntil(e.target.value)} className="text-slate-950"/></label>
        <label className="block">UID destinatário (opcional) <input value={intendedUid} autoComplete="off" onChange={e=>setIntendedUid(e.target.value)} className="text-slate-950"/></label>
        <button disabled={busy} type="submit" className="px-3 py-2 border rounded">Emitir convite individual</button>
      </form>
      {issued?.code&&<div><label>Código emitido <output className="select-all break-all">{issued.code}</output></label><button type="button" onClick={()=>setIssued(null)} className="ml-2 underline">Ocultar código</button></div>}
      <ul>{invites.map(i=><li key={i.inviteId} className="py-2 break-all">{i.inviteId} — {i.state} — benefício até {date(i.benefitUntil)} <button type="button" disabled={busy||i.state==='revoked'} onClick={()=>void revoke(i.inviteId)} className="ml-2 underline">Revogar convite</button></li>)}</ul>
    </div>}
  </section>;
}
