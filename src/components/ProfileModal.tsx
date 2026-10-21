import React from 'react';
import { User } from 'firebase/auth';
import { X, User as UserIcon, Shield, Sparkles, CheckCircle2, FlaskConical, Award } from 'lucide-react';
import { TesterInvitePanel } from './TesterInvitePanel';
import type { AccessState } from '../services/studyProgressClient';

interface ProfileModalProps {
  user: User;
  isCEO: boolean;
  access: AccessState | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isCEO,
  access,
  isOpen,
  onClose,
  onLogout
}) => {
  if (!isOpen) return null;

  const formatDate = (ts?: number) => {
    if (!ts) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Cuiaba'
    }).format(ts) + ' (Cuiabá)';
  };

  const getAccessBadge = () => {
    if (isCEO || access?.ceo) {
      return {
        label: 'Acesso Integral — CEO',
        icon: <Award className="text-brand-gold" size={16} />,
        bg: 'bg-brand-gold/15 border-brand-gold/30 text-brand-gold',
        description: 'Privilégio administrativo com acesso irrestrito a todos os dias, catálogo e ferramentas.'
      };
    }
    if (access?.subscriptionActive) {
      return {
        label: 'Assinatura Ativa',
        icon: <Sparkles className="text-emerald-400" size={16} />,
        bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        description: 'Assinatura reconhecida pelo servidor. Acesso liberado conforme progressão da trilha.'
      };
    }
    if (access?.testerAccess?.active) {
      return {
        label: 'Acesso de Testador',
        icon: <FlaskConical className="text-sky-400" size={16} />,
        bg: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
        description: `Benefício de teste ativo${access.testerAccess.expiresAt ? ` até ${formatDate(access.testerAccess.expiresAt)}` : ''}. Progressão diária mantida.`
      };
    }
    return {
      label: 'Acesso Gratuito (Dias 1 e 2)',
      icon: <Shield className="text-slate-400" size={16} />,
      bg: 'bg-slate-800/80 border-white/10 text-slate-300',
      description: 'Acesso de demonstração aos dois primeiros dias do cronograma.'
    };
  };

  const badge = getAccessBadge();

  return (
    <div
      className="athena-ui fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-brand-gold/30 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 my-8">
        {/* Header com Nome e Fechar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-bold">
              <UserIcon size={24} />
            </div>
            <div>
              <h2 id="profile-title" className="text-lg font-serif font-bold text-slate-100 flex items-center gap-2">
                {user.displayName || (isCEO ? 'Jhonny (CEO)' : 'Aluno ATHENA')}
              </h2>
              <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            title="Fechar"
            aria-label="Fechar perfil"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tipo de Acesso Reconhecido pelo Servidor */}
        <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo de Acesso Servidor</span>
            <div className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${badge.bg}`}>
              {badge.icon}
              <span>{badge.label}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{badge.description}</p>
        </div>

        {/* Resgatar Convite de Teste */}
        <div className="space-y-2">
          <TesterInvitePanel key={user.uid} uid={user.uid} administrativeUI={isCEO} />
        </div>

        {/* Botão de Encerramento */}
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Voltar à Plataforma
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};
