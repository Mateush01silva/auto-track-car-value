/**
 * Configuração dos produtos e planos Stripe - Vybo
 * Card #1: Produtos criados no Stripe Dashboard
 */

export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',

  // Price IDs dos produtos (serão preenchidos após criar no Stripe Dashboard)
  prices: {
    workshopStarter: import.meta.env.VITE_STRIPE_PRICE_WORKSHOP_STARTER || '',
    workshopProfessional: import.meta.env.VITE_STRIPE_PRICE_WORKSHOP_PROFESSIONAL || '',
    ownerPro: import.meta.env.VITE_STRIPE_PRICE_OWNER_PRO || '',
  },

  // Definição dos planos
  plans: {
    workshopStarter: {
      id: 'workshop_starter',
      name: 'Vybo Oficina - Starter',
      price: 114.90,
      interval: 'month' as const,
      trialDays: 14,
      monthlyLimit: 100,
      features: {
        workshop: [
          '✅ 100 atendimentos/mês',
          '✅ Dashboard básico',
          '✅ Cadastro e busca por placa',
          '✅ Notificações por email',
          '✅ Histórico 6 meses',
          '✅ Exportação CSV',
          '✅ Até 5 templates',
          '✅ Lista de clientes com busca',
          '❌ Sem Oportunidades',
          '❌ Sem Score de Fidelidade',
          '❌ Sem exportação Excel/PDF',
        ],
      },
      limitations: {
        workshop: {
          monthlyServices: 100,
          historyMonths: 6,
          templates: 5,
          exportFormats: ['csv'],
          hasOpportunities: false,
          hasLoyaltyScore: false,
          hasCRM: false,
        },
      },
    },

    workshopProfessional: {
      id: 'workshop_professional',
      name: 'Vybo Oficina - Professional',
      price: 219.90,
      interval: 'month' as const,
      trialDays: 14,
      monthlyLimit: null, // ilimitado
      features: {
        workshop: [
          '✅ Atendimentos ilimitados',
          '✅ Dashboard completo',
          '✅ Cadastro e busca por placa',
          '✅ Notificações por email',
          '✅ Histórico ilimitado',
          '✅ Exportação CSV + Excel + PDF',
          '✅ Templates ilimitados',
          '✅ Oportunidades de Negócio',
          '✅ Score de Fidelidade completo',
          '✅ CRM avançado (lembretes, análises)',
          '✅ Envio de emails em lote',
          '✅ Análises avançadas (heatmap)',
          '✅ Tags personalizadas',
          '✅ Histórico de interações',
        ],
      },
      limitations: {
        workshop: {
          monthlyServices: null, // ilimitado
          historyMonths: null, // ilimitado
          templates: null, // ilimitado
          exportFormats: ['csv', 'excel', 'pdf'],
          hasOpportunities: true,
          hasLoyaltyScore: true,
          hasCRM: true,
        },
      },
    },

    ownerPro: {
      id: 'owner_pro',
      name: 'Vybo Proprietário - Pro',
      price: 5.90,
      interval: 'month' as const,
      trialDays: 30,
      monthlyLimit: null,
      features: {
        owner: [
          '✅ Veículos ilimitados',
          '✅ Histórico ilimitado',
          '✅ Alertas inteligentes personalizados',
          '✅ Integração com API FIPE',
          '✅ Alertas de revisão por KM',
          '✅ Dashboard completo com estatísticas',
          '✅ Exportação de relatórios (PDF/Excel)',
          '✅ Análise de custos e valorização',
          '✅ Relatórios profissionais',
          '✅ Compartilhamento via QR Code',
          '✅ Galeria de comprovantes ilimitada',
          '✅ Suporte prioritário',
        ],
      },
      limitations: {
        owner: {
          maxVehicles: null, // ilimitado
          historyMonths: null, // ilimitado
          hasSmartAlerts: true,
          hasAPIIntegration: true,
          hasAdvancedReports: true,
          hasExport: true,
        },
      },
    },
  },
} as const;

export type PlanId = 'workshop_starter' | 'workshop_professional' | 'owner_pro';

export type UserRole = 'owner' | 'workshop';

export interface Subscription {
  id: string;
  userId: string;
  planId: PlanId;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  monthlyUsage: number; // Contador de atendimentos/veículos no período atual
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Verifica se usuário tem acesso a uma feature específica
 */
export function hasFeatureAccess(planId: PlanId, feature: string, role: UserRole): boolean {
  const plan = STRIPE_CONFIG.plans[planId];

  // Free tier tem acesso limitado
  if (planId === 'free') {
    const basicWorkshopFeatures = ['gestão básica', 'histórico'];
    const basicOwnerFeatures = ['1 veículo', 'histórico', 'alertas básicos'];

    if (role === 'workshop') {
      return basicWorkshopFeatures.some(f => feature.toLowerCase().includes(f));
    }
    return basicOwnerFeatures.some(f => feature.toLowerCase().includes(f));
  }

  // Planos pagos
  const planFeatures = plan.features[role] || [];
  return planFeatures.some(f =>
    f.toLowerCase().includes(feature.toLowerCase()) ||
    feature.toLowerCase().includes(f.toLowerCase())
  );
}

/**
 * Verifica se usuário pode criar mais atendimentos/veículos
 */
export function canCreateMore(
  planId: PlanId,
  currentUsage: number
): { allowed: boolean; reason?: string } {
  const plan = STRIPE_CONFIG.plans[planId];

  // Planos ilimitados
  if (plan.monthlyLimit === null) {
    return { allowed: true };
  }

  // Verificar limite
  if (currentUsage >= plan.monthlyLimit) {
    return {
      allowed: false,
      reason: `Limite de ${plan.monthlyLimit} atingido. Faça upgrade para continuar.`,
    };
  }

  return { allowed: true };
}

/**
 * Calcula dias restantes de trial
 */
export function getTrialDaysRemaining(trialEnd?: Date): number {
  if (!trialEnd) return 0;

  const now = new Date();
  const diff = trialEnd.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(0, days);
}

/**
 * Formata preço em BRL
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}
