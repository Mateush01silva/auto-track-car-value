import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_CONFIG, PlanId, formatPrice, getTrialDaysRemaining } from "@/config/stripe";
import { initiateStripeCheckout, createStripeCustomerPortal, getCurrentSubscription } from "@/utils/stripeHelpers";
import {
  ArrowLeft,
  Check,
  X,
  Rocket,
  Building2,
  Loader2,
  ExternalLink,
  Settings
} from "lucide-react";

interface Subscription {
  id: string;
  user_id: string;
  plan_id: PlanId;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  current_period_end: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  monthly_usage: number;
}

const Plans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState<PlanId | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        navigate('/workshop/login');
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

  const handleSelectPlan = async (planId: PlanId) => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Email do usuário não encontrado",
        variant: "destructive",
      });
      return;
    }

    setProcessingCheckout(planId);

    try {
      const result = await initiateStripeCheckout(planId, user.email, user.id);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar checkout');
      }

      // Se chegou aqui e não redirecionou, algo deu errado
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
      setProcessingCheckout(null);
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

  const currentPlanId = subscription?.plan_id;
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
              onClick={() => navigate('/workshop/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Planos e Preços</h1>
              {subscription && (
                <p className="text-xs text-muted-foreground">
                  Plano atual: {STRIPE_CONFIG.plans[currentPlanId!]?.name || 'Nenhum'}
                  {isTrialing && ` (Trial - ${trialDaysRemaining} dias restantes)`}
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
                    Aproveite {trialDaysRemaining} dia{trialDaysRemaining !== 1 ? 's' : ''} restante{trialDaysRemaining !== 1 ? 's' : ''} de acesso completo ao plano {STRIPE_CONFIG.plans[currentPlanId!]?.name}.
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
          <h2 className="text-3xl font-bold mb-4">Escolha o plano ideal para sua oficina</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Todos os planos incluem 14 dias de trial gratuito. Sem cartão de crédito necessário para começar.
            Cancele quando quiser.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Starter Plan */}
          <Card className={`relative ${currentPlanId === 'workshop_starter' ? 'border-primary border-2' : ''}`}>
            {currentPlanId === 'workshop_starter' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                Plano Atual
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vybo Oficina - Starter
              </CardTitle>
              <CardDescription>Para oficinas começando</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold">{formatPrice(STRIPE_CONFIG.plans.workshopStarter.price)}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-sm font-medium text-success">
                  ✅ 14 dias de trial gratuito
                </p>
              </div>
              <ul className="space-y-2">
                {STRIPE_CONFIG.plans.workshopStarter.features.workshop?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    {feature.startsWith('✅') ? (
                      <>
                        <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{feature.replace('✅ ', '')}</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature.replace('❌ ', '')}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {currentPlanId === 'workshop_starter' ? (
                <Button className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : currentPlanId === 'workshop_professional' ? (
                <Button className="w-full" variant="outline" disabled>
                  Downgrade não disponível
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan('workshop_starter')}
                  disabled={processingCheckout !== null}
                >
                  {processingCheckout === 'workshop_starter' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Começar Trial de 14 Dias
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Professional Plan */}
          <Card className={`relative border-2 ${currentPlanId === 'workshop_professional' ? 'border-primary' : 'border-primary/50'}`}>
            {currentPlanId === 'workshop_professional' ? (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                Plano Atual
              </Badge>
            ) : (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success">
                Recomendado
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Vybo Oficina - Professional
              </CardTitle>
              <CardDescription>Para oficinas em crescimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold">{formatPrice(STRIPE_CONFIG.plans.workshopProfessional.price)}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-sm font-medium text-success">
                  ✅ 14 dias de trial gratuito
                </p>
              </div>
              <ul className="space-y-2">
                {STRIPE_CONFIG.plans.workshopProfessional.features.workshop?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>{feature.replace('✅ ', '')}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {currentPlanId === 'workshop_professional' ? (
                <Button className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan('workshop_professional')}
                  disabled={processingCheckout !== null}
                >
                  {processingCheckout === 'workshop_professional' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {currentPlanId === 'workshop_starter' ? 'Fazer Upgrade' : 'Começar Trial de 14 Dias'}
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Comparação completa de recursos</CardTitle>
            <CardDescription>Veja todas as diferenças entre os planos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Recurso</th>
                    <th className="text-center p-3 font-semibold">Starter</th>
                    <th className="text-center p-3 font-semibold">Professional</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-muted/30">
                    <td className="p-3 text-sm font-medium">Atendimentos por mês</td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-medium">100</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-medium text-success">Ilimitado</span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm">Histórico de serviços</td>
                    <td className="p-3 text-center text-sm">6 meses</td>
                    <td className="p-3 text-center text-sm">Ilimitado</td>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <td className="p-3 text-sm">Templates de serviço</td>
                    <td className="p-3 text-center text-sm">Até 5</td>
                    <td className="p-3 text-center text-sm">Ilimitado</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm">Exportação de dados</td>
                    <td className="p-3 text-center text-sm">CSV</td>
                    <td className="p-3 text-center text-sm">CSV + Excel + PDF</td>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <td className="p-3 text-sm">Oportunidades de Negócio</td>
                    <td className="p-3 text-center">
                      <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <Check className="h-4 w-4 text-success mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm">Score de Fidelidade</td>
                    <td className="p-3 text-center">
                      <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <Check className="h-4 w-4 text-success mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <td className="p-3 text-sm">CRM Avançado</td>
                    <td className="p-3 text-center">
                      <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <Check className="h-4 w-4 text-success mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm">Envio de emails em lote</td>
                    <td className="p-3 text-center">
                      <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <Check className="h-4 w-4 text-success mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="p-3 text-sm">Análises avançadas</td>
                    <td className="p-3 text-center">
                      <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    </td>
                    <td className="p-3 text-center">
                      <Check className="h-4 w-4 text-success mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <h3 className="font-semibold mb-3">Como funciona o trial?</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Você tem 14 dias de acesso completo ao plano escolhido
            </p>
            <p>
              • Não cobramos nada durante o período de trial
            </p>
            <p>
              • Após o trial, a cobrança é feita automaticamente
            </p>
            <p>
              • Você pode cancelar a qualquer momento através do portal de assinatura
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
