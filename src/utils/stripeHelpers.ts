import { supabase } from "@/integrations/supabase/client";
import { STRIPE_CONFIG, PlanId } from "@/config/stripe";

/**
 * Inicia o processo de checkout do Stripe
 * Cria uma sessão de checkout e redireciona o usuário para o Stripe
 */
export async function initiateStripeCheckout(
  planId: PlanId,
  userEmail: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Não fazer checkout para plano free
    if (planId === 'free') {
      return { success: true };
    }

    // Obter o Price ID correto baseado no plano
    let priceId: string | undefined;
    switch (planId) {
      case 'workshop_starter':
        priceId = STRIPE_CONFIG.prices.workshopStarter;
        break;
      case 'workshop_professional':
        priceId = STRIPE_CONFIG.prices.workshopProfessional;
        break;
      case 'owner_pro':
        priceId = STRIPE_CONFIG.prices.ownerPro;
        break;
      default:
        return { success: false, error: 'Plano inválido' };
    }

    if (!priceId) {
      return {
        success: false,
        error: 'Price ID não configurado. Verifique as variáveis de ambiente.',
      };
    }

    // Chamar Edge Function para criar checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        userId,
        userEmail,
        planId,
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing?checkout=canceled`,
      },
    });

    if (error) {
      console.error('Erro ao criar checkout session:', error);
      return { success: false, error: error.message };
    }

    // Redirecionar para o Stripe Checkout
    if (data?.url) {
      window.location.href = data.url;
      return { success: true };
    }

    return { success: false, error: 'URL de checkout não retornada' };
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    return { success: false, error: error.message || 'Erro ao processar checkout' };
  }
}

/**
 * Cria o portal do cliente Stripe para gerenciar assinatura
 * Permite cancelar, atualizar forma de pagamento, etc.
 */
export async function createStripeCustomerPortal(
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('create-customer-portal', {
      body: {
        userId,
        returnUrl: `${window.location.origin}/workshop/settings?tab=plan`,
      },
    });

    if (error) {
      console.error('Erro ao criar portal do cliente:', error);
      return { success: false, error: error.message };
    }

    if (data?.url) {
      return { success: true, url: data.url };
    }

    return { success: false, error: 'URL do portal não retornada' };
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    return { success: false, error: error.message || 'Erro ao acessar portal' };
  }
}

/**
 * Obtém a assinatura atual do usuário
 */
export async function getCurrentSubscription(userId: string) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Se não existir assinatura, retorna free
      if (error.code === 'PGRST116') {
        return {
          plan_id: 'free' as PlanId,
          status: 'active',
          monthly_usage: 0,
        };
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return {
      plan_id: 'free' as PlanId,
      status: 'active',
      monthly_usage: 0,
    };
  }
}

/**
 * Verifica se o usuário tem acesso a uma feature
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string,
  role: 'owner' | 'workshop'
): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription(userId);
    const planId = subscription.plan_id as PlanId;

    // Verificar limites específicos
    if (planId === 'free') {
      const basicWorkshopFeatures = ['gestão básica', 'histórico', 'notificações'];
      const basicOwnerFeatures = ['1 veículo', 'histórico', 'alertas básicos'];

      if (role === 'workshop') {
        return basicWorkshopFeatures.some((f) =>
          feature.toLowerCase().includes(f)
        );
      }
      return basicOwnerFeatures.some((f) => feature.toLowerCase().includes(f));
    }

    // Planos pagos
    const plan = STRIPE_CONFIG.plans[planId];
    const planFeatures = plan.features[role] || [];

    return planFeatures.some(
      (f) =>
        f.toLowerCase().includes(feature.toLowerCase()) ||
        feature.toLowerCase().includes(f.toLowerCase())
    );
  } catch (error) {
    console.error('Erro ao verificar acesso:', error);
    return false;
  }
}

/**
 * Formata informações de assinatura para exibição
 */
export function formatSubscriptionInfo(subscription: any) {
  const planId = subscription.plan_id as PlanId;
  const plan = STRIPE_CONFIG.plans[planId];

  return {
    planName: plan.name,
    price: plan.price,
    interval: plan.interval,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    monthlyUsage: subscription.monthly_usage,
    monthlyLimit: plan.monthlyLimit,
  };
}
