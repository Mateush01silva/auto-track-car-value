import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_CONFIG, formatPrice, getTrialDaysRemaining } from "@/config/stripe";
import { initiateStripeCheckout, createStripeCustomerPortal, getCurrentSubscription } from "@/utils/stripeHelpers";
import {
  ArrowLeft,
  Check,
  Star,
  Loader2,
  ExternalLink,
  Settings,
  Crown
} from "lucide-react";

interface Subscription {
  id: string;
  user_id: string;
  plan_id: 'workshop_starter' | 'workshop_professional' | 'owner_pro';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  current_period_end: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  monthly_usage: number;
}

const OwnerPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const data = await getCurrentSubscription(user.id);
        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, navigate]);

  const handleSelectPlan = async () => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Email do usuário não encontrado",
        variant: "destructive",
      });
      return;
    }

    setProcessingCheckout(true);

    try {
      const result = await initiateStripeCheckout('owner_pro', user.email, user.id);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar checkout');
      }

      toast({
        title: "Atenção",
        description: "Redirecionando para o checkout...",
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro ao processar checkout",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive",
      });
      setProcessingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.id) return;

    setLoadingPortal(true);
    try {
      const result = await createStripeCustomerPortal(user.id);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Erro ao acessar portal');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao acessar portal",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive",
      });
      setLoadingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasOwnerPro = subscription?.plan_id === 'owner_pro';
  const isTrialing = subscription?.status === 'trialing';
  const trialDaysRemaining = subscription?.trial_end
    ? getTrialDaysRemaining(new Date(subscription.trial_end))
    : 0;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Plano Vybo Pro</h1>
              {subscription && (
                <p className="text-xs text-muted-foreground">
                  {hasOwnerPro
                    ? `Plano ativo${isTrialing ? ` (Trial - ${trialDaysRemaining} dias restantes)` : ''}`
                    : 'Nenhum plano ativo'
                  }
                </p>
              )}
            </div>
          </div>
          {subscription && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              disabled={loadingPortal}
            >
              {loadingPortal ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Gerenciar Assinatura
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Trial Banner */}
        {isTrialing && trialDaysRemaining > 0 && (
          <Card className="mb-8 border-warning bg-warning/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    🎉 Você está em período de trial!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Aproveite {trialDaysRemaining} dia{trialDaysRemaining !== 1 ? 's' : ''} restante{trialDaysRemaining !== 1 ? 's' : ''} de acesso completo ao Vybo Proprietário Pro.
                    Após o período de trial, você será cobrado automaticamente.
                  </p>
                </div>
                <Button onClick={handleManageSubscription} variant="outline">
                  Gerenciar Trial
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-warning" />
            <h2 className="text-3xl font-bold">Vybo Proprietário Pro</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Gerencie todos os seus veículos com recursos profissionais, alertas inteligentes e relatórios completos.
            <br />
            <strong>30 dias de trial gratuito</strong> para você experimentar tudo!
          </p>
        </div>

        {/* Plan Card */}
        <div className="max-w-lg mx-auto mb-12">
          <Card className={`relative border-2 ${hasOwnerPro ? 'border-primary' : 'border-warning/50'}`}>
            {hasOwnerPro && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                Plano Atual
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Star className="h-6 w-6 text-warning" />
                Vybo Proprietário - Pro
              </CardTitle>
              <CardDescription>Tudo que você precisa para gerenciar seus veículos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold">{formatPrice(STRIPE_CONFIG.plans.ownerPro.price)}</span>
                <span className="text-muted-foreground text-lg">/mês</span>
              </div>

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm font-medium text-success text-center">
                  🎁 30 dias de trial gratuito - Sem cobrança inicial
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Recursos inclusos:
                </h4>
                <ul className="space-y-3">
                  {STRIPE_CONFIG.plans.ownerPro.features.owner?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span>{feature.replace('✅ ', '')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Veículos</span>
                    <span className="font-medium">Ilimitados</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Histórico</span>
                    <span className="font-medium">Ilimitado</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Alertas inteligentes</span>
                    <span className="font-medium text-success">Incluído</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">API FIPE</span>
                    <span className="font-medium text-success">Incluído</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Relatórios PDF/Excel</span>
                    <span className="font-medium text-success">Incluído</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {hasOwnerPro ? (
                <Button className="w-full" disabled>
                  <Check className="h-4 w-4 mr-2" />
                  Plano Ativo
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSelectPlan}
                  disabled={processingCheckout}
                >
                  {processingCheckout ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Começar Trial de 30 Dias
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Por que escolher o Vybo Pro?</h3>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Controle Total</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Gerencie quantos veículos quiser com histórico completo e ilimitado de manutenções, custos e documentos.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔔 Alertas Inteligentes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Receba alertas personalizados de revisão, troca de óleo, vencimento de documentos e muito mais.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📈 Análises Profissionais</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Visualize custos, valorização do veículo e exporte relatórios profissionais em PDF e Excel.
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Como funciona o trial de 30 dias?</h4>
                <p className="text-sm text-muted-foreground">
                  Você tem 30 dias de acesso completo a todos os recursos do Vybo Pro. Não cobramos nada durante o trial.
                  Após os 30 dias, você será cobrado automaticamente caso não cancele.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h4>
                <p className="text-sm text-muted-foreground">
                  Sim! Você pode cancelar sua assinatura a qualquer momento através do portal de gerenciamento.
                  Não há multas ou taxas de cancelamento.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Quantos veículos posso cadastrar?</h4>
                <p className="text-sm text-muted-foreground">
                  Com o Vybo Pro, você pode cadastrar quantos veículos quiser. Não há limites!
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Os dados ficam salvos se eu cancelar?</h4>
                <p className="text-sm text-muted-foreground">
                  Sim, todos os seus dados ficam salvos mesmo após o cancelamento. Você pode reativar a assinatura
                  a qualquer momento e continuar de onde parou.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OwnerPlans;
