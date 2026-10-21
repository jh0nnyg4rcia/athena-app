import { Capacitor } from '@capacitor/core';
import { auth } from '../lib/firebase';
import { getApiUrl } from './geminiService';

export type StorePlatform = 'google_play' | 'app_store' | 'web';
export type SubscriptionStatus = 'active' | 'canceled' | 'in_grace_period' | 'expired' | 'refunded' | 'none';
export type SubscriptionPlanId = 'athena_mensal_100dias' | 'athena_anual_100dias';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  title: string;
  description: string;
  priceFormatted: string;
  billingPeriod: 'P1M' | 'P1Y';
  platform: StorePlatform;
}

export interface SubscriptionBenefitStatus {
  hasAccess: boolean;
  source: 'paid_subscription' | 'tester_invite' | 'ceo' | 'free_tier';
  subscription?: {
    provider: StorePlatform;
    status: SubscriptionStatus;
    currentPeriodEnd: number;
    autoRenewing: boolean;
    productId: string;
    isSimulatedLocal?: boolean;
  };
  testerInvite?: {
    active: boolean;
    expiresAt: number;
  };
  isCeo: boolean;
  progressionNote: string;
}

export interface PurchaseResult {
  success: boolean;
  platform: StorePlatform;
  productId: string;
  purchaseToken?: string;
  orderId?: string;
  simulated?: boolean;
  error?: string;
}

export interface RestoreResult {
  restored: boolean;
  count: number;
  message: string;
  subscription?: any;
}

export interface IStoreSubscriptionAdapter {
  readonly platform: StorePlatform;
  isAvailable(): Promise<boolean>;
  getPlans(): Promise<SubscriptionPlan[]>;
  purchase(planId: SubscriptionPlanId): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
}

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'athena_mensal_100dias',
    title: 'ATHENA Pro Mensal',
    description: 'Acesso completo a todos os 100 dias da Trilha Jurídica, revisões e simuladores',
    priceFormatted: 'R$ 47,99/mês',
    billingPeriod: 'P1M',
    platform: 'web'
  },
  {
    id: 'athena_anual_100dias',
    title: 'ATHENA Pro Anual',
    description: 'Acesso por 1 ano com desconto aos simuladores e conteúdos avançados',
    priceFormatted: 'R$ 479,90/ano',
    billingPeriod: 'P1Y',
    platform: 'web'
  }
];

async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Adaptador Web:
 * As compras NÃO acontecem na web (zero checkout web).
 * As assinaturas são processadas exclusivamente pela Google Play ou App Store.
 * No ambiente web, a conta do aluno reconhece e sincroniza o benefício automaticamente
 * quando contratada pelo celular.
 */
export class WebStoreSubscriptionAdapter implements IStoreSubscriptionAdapter {
  readonly platform: StorePlatform = 'web';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    return DEFAULT_PLANS.map(p => ({ ...p, platform: 'web' }));
  }

  async purchase(_planId: SubscriptionPlanId): Promise<PurchaseResult> {
    // Checkout web desabilitado por arquitetura. Assegura conformidade com as lojas.
    throw new Error(
      'O pagamento de assinaturas ATHENA é realizado exclusivamente pelas lojas Google Play (Android) ou App Store (iOS). ' +
      'Para assinar, baixe o aplicativo no celular. Ao entrar com a sua mesma conta ATHENA, o acesso web é liberado automaticamente.'
    );
  }

  async restorePurchases(): Promise<RestoreResult> {
    try {
      const headers = await getAuthHeader();
      if (!headers.Authorization) {
        return { restored: false, count: 0, message: 'Faça login para consultar suas assinaturas das lojas.' };
      }
      const response = await fetch(getApiUrl('/api/study/subscription-status'), { headers });
      if (!response.ok) {
        return { restored: false, count: 0, message: 'Não foi possível consultar as assinaturas no servidor.' };
      }
      const data = await response.json();
      if (data.hasSubscription) {
        return {
          restored: true,
          count: 1,
          message: 'Assinatura ativa reconhecida com sucesso.',
          subscription: data
        };
      }
      return {
        restored: false,
        count: 0,
        message: 'Nenhuma assinatura ativa encontrada para esta conta nas lojas.'
      };
    } catch {
      return { restored: false, count: 0, message: 'Sem conexão para verificar compras.' };
    }
  }
}

/**
 * Adaptador Nativo (Android / iOS):
 * Comunica com a ponte de faturamento da loja respectiva (Google Play Billing no Android, StoreKit no iOS).
 */
export class NativeStoreSubscriptionAdapter implements IStoreSubscriptionAdapter {
  readonly platform: StorePlatform;

  constructor() {
    this.platform = Capacitor.getPlatform() === 'ios' ? 'app_store' : 'google_play';
  }

  async isAvailable(): Promise<boolean> {
    return Capacitor.isNativePlatform();
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    return DEFAULT_PLANS.map(p => ({ ...p, platform: this.platform }));
  }

  async purchase(planId: SubscriptionPlanId): Promise<PurchaseResult> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Adaptador nativo disponível apenas em ambiente Android ou iOS.');
    }
    // Em execução nativa, aciona a ponte de faturamento da plataforma
    // O retorno da loja (purchaseToken) é enviado para /api/study/subscription-verify
    return {
      success: false,
      platform: this.platform,
      productId: planId,
      error: 'In-app billing da loja requer execução com chaves e produtos configurados no console nativo.'
    };
  }

  async restorePurchases(): Promise<RestoreResult> {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(getApiUrl('/api/study/subscription-status'), { headers });
      const data = await response.json();
      return {
        restored: Boolean(data.hasSubscription),
        count: data.hasSubscription ? 1 : 0,
        message: data.hasSubscription ? 'Assinatura restaurada com sucesso.' : 'Nenhuma assinatura encontrada.',
        subscription: data
      };
    } catch {
      return { restored: false, count: 0, message: 'Falha ao restaurar assinatura.' };
    }
  }
}

/**
 * Adaptador Simulado Local (Ambiente de Testes / Desenvolvimento):
 * Estritamente restrito a desenvolvimento local (`import.meta.env.DEV`).
 * Permite validar a interface, os contratos de idempotência e a resposta de verificação
 * sem custos e sem credenciais reais.
 */
export class SimulatedLocalStoreAdapter implements IStoreSubscriptionAdapter {
  readonly platform: StorePlatform = 'google_play';

  async isAvailable(): Promise<boolean> {
    return Boolean(import.meta.env.DEV);
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    return DEFAULT_PLANS.map(p => ({
      ...p,
      title: `[TESTE LOCAL] ${p.title}`,
      description: `[Simulação Local Restrita] ${p.description}`,
      platform: 'google_play'
    }));
  }

  async purchase(planId: SubscriptionPlanId): Promise<PurchaseResult> {
    if (!import.meta.env.DEV) {
      throw new Error('Ambiente simulado permitido apenas em desenvolvimento local.');
    }

    const mockToken = `simulated_token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const mockOrder = `GPA.SIMULATED-${Date.now()}`;

    // Enviar para verificação no servidor local
    const headers = await getAuthHeader();
    if (!headers.Authorization) {
      throw new Error('Autenticação local necessária para simular a compra.');
    }

    const response = await fetch(getApiUrl('/api/study/subscription-verify'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        platform: 'google_play',
        productId: planId,
        purchaseToken: mockToken,
        orderId: mockOrder,
        isSimulatedLocal: true
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao verificar compra simulada no servidor.');
    }

    return {
      success: true,
      platform: 'google_play',
      productId: planId,
      purchaseToken: mockToken,
      orderId: mockOrder,
      simulated: true
    };
  }

  async restorePurchases(): Promise<RestoreResult> {
    const headers = await getAuthHeader();
    const response = await fetch(getApiUrl('/api/study/subscription-status'), { headers });
    const data = await response.json();
    return {
      restored: Boolean(data.hasSubscription),
      count: data.hasSubscription ? 1 : 0,
      message: data.hasSubscription ? 'Assinatura simulada reconhecida com sucesso.' : 'Nenhuma assinatura ativa.',
      subscription: data
    };
  }
}

/**
 * Retorna o adaptador apropriado para a plataforma de execução atual.
 */
export function getStoreSubscriptionAdapter(): IStoreSubscriptionAdapter {
  if (Capacitor.isNativePlatform()) {
    return new NativeStoreSubscriptionAdapter();
  }
  return new WebStoreSubscriptionAdapter();
}

/**
 * Consulta o benefício completo do usuário separando:
 * - Assinatura paga (Google Play / App Store)
 * - Convite de testador
 * - Papel CEO
 * - Requisito obrigatório de progressão (nenhum papel dispensa a realização sequencial)
 */
export async function fetchSubscriptionBenefitStatus(): Promise<SubscriptionBenefitStatus> {
  const headers = await getAuthHeader();
  if (!headers.Authorization) {
    return {
      hasAccess: false,
      source: 'free_tier',
      isCeo: false,
      progressionNote: 'Os dias 1 e 2 são gratuitos. Dias 3 a 100 exigem assinatura ou convite e cumprimento sequencial.'
    };
  }

  try {
    const [accessRes, subRes] = await Promise.all([
      fetch(getApiUrl('/api/study/access'), { headers }),
      fetch(getApiUrl('/api/study/subscription-status'), { headers })
    ]);

    const accessData = accessRes.ok ? await accessRes.json().catch(() => ({})) : {};
    const subData = subRes.ok ? await subRes.json().catch(() => ({})) : {};

    const isCeo = Boolean(accessData.ceo);
    const hasTester = Boolean(accessData.tester);
    const hasPaid = Boolean(subData.hasSubscription || accessData.paid);

    let source: SubscriptionBenefitStatus['source'] = 'free_tier';
    if (isCeo) source = 'ceo';
    else if (hasPaid) source = 'paid_subscription';
    else if (hasTester) source = 'tester_invite';

    return {
      hasAccess: isCeo || hasPaid || hasTester,
      source,
      isCeo,
      subscription: subData.hasSubscription ? {
        provider: subData.provider || 'google_play',
        status: subData.status || 'active',
        currentPeriodEnd: subData.currentPeriodEnd || 0,
        autoRenewing: subData.autoRenewing ?? false,
        productId: subData.productId || 'athena_mensal_100dias',
        isSimulatedLocal: subData.isSimulatedLocal
      } : undefined,
      testerInvite: hasTester ? {
        active: true,
        expiresAt: accessData.accessUntil || 0
      } : undefined,
      progressionNote: 'Aviso pedagógico: O acesso aos dias 3 a 100 exige o cumprimento sequencial das aulas anteriores, mesmo para usuários com assinatura ou perfil especial.'
    };
  } catch (error) {
    return {
      hasAccess: false,
      source: 'free_tier',
      isCeo: false,
      progressionNote: 'Modo offline ou sem conexão com o servidor de validação.'
    };
  }
}
