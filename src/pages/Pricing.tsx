import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STRIPE_CONFIG, formatPrice } from "@/config/stripe";
import {
  Check,
  X,
  Wrench,
  Car,
  Crown,
  Zap,
  ArrowRight,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly">("monthly");

  const handleSelectPlan = (planId: string, userType: "workshop" | "owner") => {
    // Redireciona para página de cadastro com parâmetros
    navigate(`/login?type=${userType}&plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 rounded-lg p-2">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-green-600">Vybo</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/")}>
                Voltar
              </Button>
              <Button onClick={() => navigate("/login")} className="bg-green-600 hover:bg-green-700">
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
            Planos e Preços
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha o plano ideal para você
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Seja você uma oficina ou proprietário de veículo, temos o plano perfeito para suas necessidades
          </p>
        </div>

        {/* Tabs: Oficinas vs Proprietários */}
        <Tabs defaultValue="workshop" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
            <TabsTrigger value="workshop" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Oficinas
            </TabsTrigger>
            <TabsTrigger value="owner" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Proprietários
            </TabsTrigger>
          </TabsList>

          {/* Workshop Plans */}
          <TabsContent value="workshop">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Free Plan */}
              <Card className="relative border-2 border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <CardTitle>Gratuito</CardTitle>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">R$ 0</span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <CardDescription>
                    Experimente por 30 dias gratuitamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {STRIPE_CONFIG.plans.free.features.workshop?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleSelectPlan("free", "workshop")}
                  >
                    Começar Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Starter Plan */}
              <Card className="relative border-2 border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <CardTitle>Starter</CardTitle>
                    <Badge className="ml-auto bg-blue-100 text-blue-700">
                      Mais Popular
                    </Badge>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      {formatPrice(STRIPE_CONFIG.plans.workshopStarter.price)}
                    </span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <CardDescription>
                    14 dias grátis • Cancele quando quiser
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {STRIPE_CONFIG.plans.workshopStarter.features.workshop?.map((feature, i) => {
                      const isNegative = feature.startsWith('❌');
                      return (
                        <li key={i} className="flex items-start gap-2">
                          {isNegative ? (
                            <X className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-sm ${isNegative ? 'text-gray-400' : 'text-gray-700'}`}>
                            {feature.replace('✅ ', '').replace('❌ ', '')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSelectPlan("workshop_starter", "workshop")}
                  >
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Professional Plan */}
              <Card className="relative border-2 border-green-300 hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-green-50">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1">
                    <Crown className="h-3 w-3 mr-1" />
                    Recomendado
                  </Badge>
                </div>
                <CardHeader className="pt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-green-600" />
                    <CardTitle>Professional</CardTitle>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      {formatPrice(STRIPE_CONFIG.plans.workshopProfessional.price)}
                    </span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <CardDescription>
                    14 dias grátis • Tudo ilimitado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {STRIPE_CONFIG.plans.workshopProfessional.features.workshop?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 font-medium">
                          {feature.replace('✅ ', '')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={() => handleSelectPlan("workshop_professional", "workshop")}
                  >
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Features Comparison Table */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-center mb-8">Compare os Planos</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-4 px-4">Funcionalidade</th>
                          <th className="text-center py-4 px-4">Gratuito</th>
                          <th className="text-center py-4 px-4 bg-blue-50">Starter</th>
                          <th className="text-center py-4 px-4 bg-green-50">Professional</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        <tr className="border-b">
                          <td className="py-3 px-4">Atendimentos/mês</td>
                          <td className="text-center py-3 px-4">10</td>
                          <td className="text-center py-3 px-4 bg-blue-50">100</td>
                          <td className="text-center py-3 px-4 bg-green-50 font-medium">Ilimitados</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Histórico</td>
                          <td className="text-center py-3 px-4">Completo</td>
                          <td className="text-center py-3 px-4 bg-blue-50">6 meses</td>
                          <td className="text-center py-3 px-4 bg-green-50 font-medium">Ilimitado</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Templates</td>
                          <td className="text-center py-3 px-4">-</td>
                          <td className="text-center py-3 px-4 bg-blue-50">5</td>
                          <td className="text-center py-3 px-4 bg-green-50 font-medium">Ilimitados</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Exportação</td>
                          <td className="text-center py-3 px-4">-</td>
                          <td className="text-center py-3 px-4 bg-blue-50">CSV</td>
                          <td className="text-center py-3 px-4 bg-green-50 font-medium">CSV + Excel + PDF</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Oportunidades de Negócio</td>
                          <td className="text-center py-3 px-4"><X className="h-4 w-4 text-gray-300 mx-auto" /></td>
                          <td className="text-center py-3 px-4 bg-blue-50"><X className="h-4 w-4 text-gray-300 mx-auto" /></td>
                          <td className="text-center py-3 px-4 bg-green-50"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Score de Fidelidade</td>
                          <td className="text-center py-3 px-4"><X className="h-4 w-4 text-gray-300 mx-auto" /></td>
                          <td className="text-center py-3 px-4 bg-blue-50"><X className="h-4 w-4 text-gray-300 mx-auto" /></td>
                          <td className="text-center py-3 px-4 bg-green-50"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">CRM Avançado</td>
                          <td className="text-center py-3 px-4"><X className="h-4 w-4 text-gray-300 mx-auto" /></td>
                          <td className="text-center py-3 px-4 bg-blue-50"><X className="h-4 w-4 text-gray-300 mx-auto" /></td>
                          <td className="text-center py-3 px-4 bg-green-50"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Owner Plans */}
          <TabsContent value="owner">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <Card className="relative border-2 border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-5 w-5 text-gray-600" />
                    <CardTitle>Gratuito</CardTitle>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">R$ 0</span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <CardDescription>
                    30 dias grátis + Plano gratuito para sempre
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {STRIPE_CONFIG.plans.free.features.owner?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleSelectPlan("free", "owner")}
                  >
                    Começar Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Owner Pro Plan */}
              <Card className="relative border-2 border-green-300 hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-green-50">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1">
                    <Crown className="h-3 w-3 mr-1" />
                    Recomendado
                  </Badge>
                </div>
                <CardHeader className="pt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <CardTitle>Pro</CardTitle>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      {formatPrice(STRIPE_CONFIG.plans.ownerPro.price)}
                    </span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <CardDescription>
                    30 dias grátis • Tudo ilimitado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {STRIPE_CONFIG.plans.ownerPro.features.owner?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 font-medium">
                          {feature.replace('✅ ', '')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={() => handleSelectPlan("owner_pro", "owner")}
                  >
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Owner Comparison */}
            <div className="mt-12 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-8">Compare os Planos</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-4 px-4">Funcionalidade</th>
                          <th className="text-center py-4 px-4">Gratuito</th>
                          <th className="text-center py-4 px-4 bg-green-50">Pro</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        <tr className="border-b">
                          <td className="py-3 px-4">Veículos</td>
                          <td className="text-center py-3 px-4">1</td>
                          <td className="text-center py-3 px-4 bg-green-50 font-medium">Ilimitados</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Histórico</td>
                          <td className="text-center py-3 px-4">6 meses</td>
                          <td className="text-center py-3 px-4 bg-green-50 font-medium">Ilimitado</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Alertas</td>
                          <td className="text-center py-3 px-4">Genéricos</td>
                          <td className="text-center py-3 px-4 bg-green-50 font-medium">Inteligentes + API</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Exportação de Relatórios</td>
                          <td className="text-center py-3 px-4"><X className="h-4 w-4 text-gray-300 mx-auto" /></td>
                          <td className="text-center py-3 px-4 bg-green-50"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Análise de Custos</td>
                          <td className="text-center py-3 px-4"><X className="h-4 w-4 text-gray-300 mx-auto" /></td>
                          <td className="text-center py-3 px-4 bg-green-50"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Suporte Prioritário</td>
                          <td className="text-center py-3 px-4"><X className="h-4 w-4 text-gray-300 mx-auto" /></td>
                          <td className="text-center py-3 px-4 bg-green-50"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sim! Não há período de fidelidade. Você pode cancelar sua assinatura quando quiser
                  e continuará tendo acesso até o final do período pago.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funcionam os períodos de teste?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Oficinas têm 14 dias de teste grátis nos planos Starter e Professional. Proprietários
                  têm 30 dias grátis no plano Pro. Não cobramos nada durante o período de teste.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso fazer upgrade ou downgrade?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sim! Você pode mudar de plano a qualquer momento. No upgrade, você terá acesso
                  imediato às novas funcionalidades. No downgrade, as mudanças entram em vigor no
                  próximo período de cobrança.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quais formas de pagamento vocês aceitam?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Aceitamos cartão de crédito e PIX através do Stripe, nossa plataforma de pagamentos segura.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-20 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-green-600 to-emerald-600 border-none text-white">
            <CardContent className="pt-8 pb-8">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Junte-se a centenas de oficinas</h3>
              <p className="text-green-50 mb-6">
                Comece hoje mesmo a gerenciar seus atendimentos de forma profissional
              </p>
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100"
                onClick={() => navigate("/login?type=workshop")}
              >
                Começar Agora Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Car className="h-6 w-6 text-green-500" />
              <span className="text-xl font-bold text-white">Vybo</span>
            </div>
            <p className="text-sm">
              © 2025 Vybo - Gestão inteligente de veículos e oficinas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
