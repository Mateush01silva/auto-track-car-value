import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Check,
  X,
  Star,
  Rocket,
  Building2,
  Users,
  FileText,
  Camera,
  Bell,
  Download,
  MessageCircle,
  Loader2,
  Mail
} from "lucide-react";

interface Workshop {
  id: string;
  name: string;
  plan: string;
  monthly_vehicle_limit: number;
  current_month_vehicles: number;
}

interface PlanFeature {
  name: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const PLAN_FEATURES: PlanFeature[] = [
  { name: "Veículos por mês", starter: "150", professional: "400", enterprise: "Ilimitado" },
  { name: "Cadastro de serviços", starter: true, professional: true, enterprise: true },
  { name: "Link público do histórico", starter: true, professional: true, enterprise: true },
  { name: "Templates padrão", starter: true, professional: true, enterprise: true },
  { name: "Templates customizados", starter: false, professional: true, enterprise: true },
  { name: "CRM de clientes", starter: false, professional: true, enterprise: true },
  { name: "Lembretes automáticos", starter: false, professional: true, enterprise: true },
  { name: "Exportação CSV", starter: false, professional: true, enterprise: true },
  { name: "Scanner de placa", starter: false, professional: true, enterprise: true },
  { name: "Relatórios avançados", starter: false, professional: true, enterprise: true },
  { name: "API de integração", starter: false, professional: false, enterprise: true },
  { name: "Múltiplos usuários", starter: false, professional: false, enterprise: true },
  { name: "Suporte prioritário", starter: false, professional: true, enterprise: true },
  { name: "Whitelabel", starter: false, professional: false, enterprise: true },
];

const Plans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkshop = async () => {
      if (!user) {
        navigate('/workshop/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('workshops')
          .select('id, name, plan, monthly_vehicle_limit, current_month_vehicles')
          .eq('owner_id', user.id)
          .single();

        if (error) throw error;
        setWorkshop(data);
      } catch (error) {
        console.error('Error fetching workshop:', error);
        navigate('/workshop/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshop();
  }, [user, navigate]);

  const handleUpgrade = (plan: string) => {
    // For now, open email contact
    const subject = encodeURIComponent(`Upgrade para plano ${plan} - ${workshop?.name}`);
    const body = encodeURIComponent(
      `Olá,\n\nGostaria de fazer upgrade para o plano ${plan}.\n\n` +
      `Oficina: ${workshop?.name}\n` +
      `Email: ${user?.email}\n\n` +
      `Aguardo contato.\n\nObrigado!`
    );
    window.open(`mailto:contato@wisedrive.com.br?subject=${subject}&body=${body}`, '_blank');

    toast({
      title: "Solicitação de upgrade",
      description: "Um email foi aberto para você entrar em contato conosco. Em breve teremos pagamento online!",
    });
  };

  const handleContact = () => {
    const subject = encodeURIComponent(`Interesse no plano Enterprise - ${workshop?.name}`);
    const body = encodeURIComponent(
      `Olá,\n\nTenho interesse no plano Enterprise.\n\n` +
      `Oficina: ${workshop?.name}\n` +
      `Email: ${user?.email}\n\n` +
      `Gostaria de mais informações.\n\nObrigado!`
    );
    window.open(`mailto:contato@wisedrive.com.br?subject=${subject}&body=${body}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = workshop?.plan || 'starter';

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
              <p className="text-xs text-muted-foreground">{workshop?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Escolha o plano ideal para sua oficina</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comece gratuitamente e faça upgrade quando precisar de mais recursos.
            Todos os planos incluem suporte e atualizações.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* Starter Plan */}
          <Card className={`relative ${currentPlan === 'starter' ? 'border-primary' : ''}`}>
            {currentPlan === 'starter' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                Plano Atual
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Starter
              </CardTitle>
              <CardDescription>Para oficinas começando</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold">Grátis</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>150 veículos/mês</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Cadastro de serviços</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Link público</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Templates padrão</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>CRM de clientes</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Lembretes automáticos</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              {currentPlan === 'starter' ? (
                <Button className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : (
                <Button className="w-full" variant="outline" disabled>
                  Downgrade não disponível
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Professional Plan */}
          <Card className={`relative border-2 ${currentPlan === 'professional' ? 'border-primary' : 'border-primary/50'}`}>
            {currentPlan === 'professional' ? (
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
                Professional
              </CardTitle>
              <CardDescription>Para oficinas em crescimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold">R$ 199</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span><strong>400</strong> veículos/mês</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Tudo do Starter</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Templates ilimitados</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>CRM de clientes</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Lembretes automáticos</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Exportação CSV</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              {currentPlan === 'professional' ? (
                <Button className="w-full" disabled>
                  Plano Atual
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade('Professional')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Fazer Upgrade
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative opacity-75">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="secondary">
              Em Breve
            </Badge>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Enterprise
              </CardTitle>
              <CardDescription>Para redes e franquias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold">Sob consulta</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span><strong>Ilimitado</strong> veículos/mês</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Tudo do Professional</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>API de integração</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Múltiplos usuários</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Whitelabel</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" />
                  <span>Suporte dedicado</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleContact}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Entrar em Contato
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <Card className="max-w-5xl mx-auto">
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
                    <th className="text-center p-3 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_FEATURES.map((feature, index) => (
                    <tr key={feature.name} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="p-3 text-sm">{feature.name}</td>
                      <td className="p-3 text-center">
                        {typeof feature.starter === 'boolean' ? (
                          feature.starter ? (
                            <Check className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.starter}</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {typeof feature.professional === 'boolean' ? (
                          feature.professional ? (
                            <Check className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.professional}</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {typeof feature.enterprise === 'boolean' ? (
                          feature.enterprise ? (
                            <Check className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ or Contact */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Tem dúvidas? Entre em contato conosco.
          </p>
          <Button variant="outline" onClick={handleContact}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Falar com Vendas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Plans;
