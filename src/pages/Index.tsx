import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, QrCode, ArrowRight, Wrench, Users, Bell, Shield, CheckCircle, Car, TrendingUp, DollarSign, BarChart3, Star, Crown, Building2, Rocket, ArrowLeftRight, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BenefitCard from "@/components/BenefitCard";
import StepCard from "@/components/StepCard";
import heroImage from "@/assets/hero-image.jpg";
import benefitTrust from "@/assets/benefit-trust.jpg";
import benefitHistory from "@/assets/benefit-history.jpg";
import benefitReports from "@/assets/benefit-reports.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-hover text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(39,174,96,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Transparência que <span className="text-success">valoriza</span> seu carro
              </h1>
              <p className="text-xl text-primary-foreground/90 leading-relaxed">
                Registre, comprove e valorize o histórico de manutenção do seu veículo.
                Mais confiança na revenda, mais segurança na compra.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Experimente agora
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    Ver Planos
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">100%</p>
                  <p className="text-sm text-primary-foreground/70">Digital</p>
                </div>
                <div className="w-px h-12 bg-primary-foreground/20" />
                <div className="text-center">
                  <p className="text-3xl font-bold">14-30d</p>
                  <p className="text-sm text-primary-foreground/70">Trial Grátis</p>
                </div>
                <div className="w-px h-12 bg-primary-foreground/20" />
                <div className="text-center">
                  <p className="text-3xl font-bold">2 Perfis</p>
                  <p className="text-sm text-primary-foreground/70">Oficina & Dono</p>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 bg-success/20 rounded-3xl blur-3xl" />
              <img
                src={heroImage}
                alt="Vybo Dashboard"
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section - NEW */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <ArrowLeftRight className="h-4 w-4" />
              Como funciona a integração
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Oficinas e Proprietários <span className="text-primary">conectados</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              O Vybo conecta oficinas mecânicas e proprietários de veículos em uma única plataforma,
              automatizando o registro de manutenções e criando um histórico confiável.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Oficina */}
              <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-200 animate-fade-in-up">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center bg-green-600 rounded-full p-4 mb-4">
                    <Wrench className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Oficina Mecânica</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Cadastra o serviço realizado no sistema
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Lança manutenção</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Anexa nota fiscal</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Adiciona fotos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seta de integração */}
              <div className="flex justify-center animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="text-center">
                  <ArrowRight className="h-12 w-12 text-primary mx-auto mb-3 hidden md:block" />
                  <div className="bg-primary/10 rounded-lg p-4">
                    <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold text-primary">Sincronização</p>
                    <p className="text-xs text-muted-foreground">Automática e instantânea</p>
                  </div>
                </div>
              </div>

              {/* Proprietário */}
              <div className="bg-blue-50 rounded-2xl p-8 border-2 border-blue-200 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center bg-blue-600 rounded-full p-4 mb-4">
                    <Car className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Proprietário</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Recebe tudo automaticamente no app
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span>Vê o histórico</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span>Acessa documentos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span>Exporta relatórios</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-gradient-to-r from-green-50 via-white to-blue-50 rounded-xl p-6 border text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                💡 Resultado: Histórico completo, confiável e valorizado
              </p>
              <p className="text-muted-foreground">
                O proprietário tem acesso a todas as manutenções realizadas pela oficina,
                criando um histórico verificado que aumenta o valor do veículo na revenda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Section - IMPROVED */}
      <section id="oficinas" className="py-20 md:py-28 bg-gradient-to-br from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Wrench className="h-4 w-4" />
              Para Oficinas Mecânicas
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              CRM completo para <span className="text-green-600">fidelizar clientes</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Gerencie seus atendimentos, mantenha contato com clientes e apareça no histórico
              do veículo como oficina de confiança.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
            {/* Feature Cards */}
            <div className="space-y-4">
              <Card className="border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    CRM de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Gerencie todos os seus clientes, veículos atendidos e histórico completo de serviços.
                    Score de fidelidade e oportunidades de negócio automáticas.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <Bell className="h-5 w-5 text-green-600" />
                    </div>
                    Lembretes Inteligentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Envie lembretes automáticos de revisão por email ou WhatsApp.
                    Traga seus clientes de volta sem esforço.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    Análises e Oportunidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Identifique oportunidades de venda baseadas no histórico.
                    Exportação de dados, relatórios e métricas de performance.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Preview */}
            <div className="space-y-4">
              <Card className="border-green-600 border-2 bg-white hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-green-600" />
                      Starter
                    </CardTitle>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      14 DIAS GRÁTIS
                    </div>
                  </div>
                  <CardDescription>Para oficinas começando</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">R$ 114,90</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      100 atendimentos/mês
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Dashboard básico
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Templates de serviço
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-green-600 border-2 bg-gradient-to-br from-green-600 to-green-700 text-white hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Rocket className="h-5 w-5" />
                      Professional
                    </CardTitle>
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                      RECOMENDADO
                    </div>
                  </div>
                  <CardDescription className="text-green-100">Para oficinas em crescimento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">R$ 219,90</span>
                    <span className="text-green-100">/mês</span>
                  </div>
                  <ul className="space-y-2 text-sm text-white">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Atendimentos ilimitados
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      CRM + Oportunidades + Score
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Análises avançadas + Emails
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="text-center">
            <Link to="/login?type=workshop">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 mr-4">
                Começar trial gratuito
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">
                Ver todos os planos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Owner Section - NEW & IMPROVED */}
      <section id="proprietarios" className="py-20 md:py-28 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Car className="h-4 w-4" />
              Para Proprietários de Veículos
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Gerencie seus veículos como um <span className="text-blue-600">profissional</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tenha controle total sobre seus veículos, receba alertas inteligentes e
              aumente o valor na revenda com histórico completo e verificado.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
            {/* Feature Cards */}
            <div className="space-y-4">
              <Card className="border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    Histórico Completo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Todas as manutenções registradas pelas oficinas aparecem automaticamente.
                    Notas fiscais, fotos e documentos organizados em um só lugar.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    Alertas Inteligentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Receba lembretes de revisão, troca de óleo, vencimento de documentos e muito mais.
                    Nunca mais esqueça uma manutenção importante.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    Valorização do Veículo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Acompanhe a valorização via tabela FIPE, custos de manutenção e
                    exporte relatórios profissionais em PDF para mostrar aos compradores.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Preview */}
            <div className="flex items-center">
              <Card className="border-blue-600 border-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-xl transition-shadow w-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="flex items-center gap-2 text-white text-2xl">
                      <Crown className="h-6 w-6 text-yellow-300" />
                      Vybo Pro
                    </CardTitle>
                    <div className="bg-yellow-300 text-blue-900 px-3 py-1 rounded-full text-xs font-bold">
                      30 DIAS GRÁTIS
                    </div>
                  </div>
                  <CardDescription className="text-blue-100">
                    Tudo que você precisa para gerenciar seus veículos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-bold">R$ 5,90</span>
                    <span className="text-blue-100">/mês</span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm">
                    <p className="font-semibold mb-2">✨ Recursos inclusos:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Veículos ilimitados</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Histórico completo e permanente</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Alertas inteligentes personalizados</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Consulta tabela FIPE automática</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Relatórios PDF e Excel</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Galeria de fotos e documentos</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-yellow-300/20 backdrop-blur-sm rounded-lg p-3 text-center text-sm">
                    <p className="font-semibold">🎁 Menos de R$ 0,20 por dia</p>
                    <p className="text-blue-100 text-xs">Para ter controle total dos seus veículos</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="text-center">
            <Link to="/login?type=owner">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 mr-4">
                Começar trial de 30 dias
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">
                Ver detalhes do plano
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section - NEW */}
      <section id="planos" className="py-20 md:py-28 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Planos para todos os <span className="text-primary">perfis</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Escolha o plano ideal para você. Todos incluem período de trial gratuito.
            </p>
            <Link to="/pricing">
              <Button size="lg" className="bg-primary hover:bg-primary-hover">
                Ver todos os planos e recursos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    Starter
                  </CardTitle>
                </div>
                <CardDescription>Oficinas iniciantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">R$ 114,90</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4 text-center">
                  <p className="text-sm font-semibold text-green-700">14 dias grátis</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 100 atendimentos/mês</li>
                  <li>• Dashboard básico</li>
                  <li>• Templates de serviço</li>
                </ul>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="border-2 border-green-600 relative hover:shadow-xl transition-shadow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                MAIS POPULAR
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-green-600" />
                  Professional
                </CardTitle>
                <CardDescription>Oficinas em crescimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-green-600">R$ 219,90</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4 text-center">
                  <p className="text-sm font-semibold text-green-700">14 dias grátis</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Atendimentos ilimitados</li>
                  <li>• CRM + Oportunidades</li>
                  <li>• Análises avançadas</li>
                </ul>
              </CardContent>
            </Card>

            {/* Owner Pro */}
            <Card className="border-2 border-blue-600 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-blue-600" />
                  Owner Pro
                </CardTitle>
                <CardDescription>Para proprietários</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-blue-600">R$ 5,90</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-4 text-center">
                  <p className="text-sm font-semibold text-blue-700">30 dias grátis</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Veículos ilimitados</li>
                  <li>• Alertas inteligentes</li>
                  <li>• Relatórios PDF/Excel</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="funcionalidades" className="py-20 md:py-28 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Por que usar o Vybo?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transforme o histórico de manutenção em um ativo de valor para seu veículo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <BenefitCard
              image={benefitTrust}
              title="Mais confiança na revenda"
              description="Comprove todo o histórico de cuidados do seu veículo e aumente o valor na hora de vender"
              delay={0}
            />
            <BenefitCard
              image={benefitHistory}
              title="Histórico completo em um só lugar"
              description="Todas as notas fiscais, fotos e documentos organizados digitalmente"
              delay={100}
            />
            <BenefitCard
              image={benefitReports}
              title="Relatórios automáticos e inteligentes"
              description="Gere relatórios profissionais com QR Code e compartilhe facilmente"
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary-hover text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Mais segurança para quem compra, mais valorização para quem vende
              e mais transparência para o mercado
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Vybo está revolucionando a forma como o histórico de veículos
              é compartilhado no Brasil
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button variant="hero" size="lg">
                  Começar agora
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  Ver Planos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
