import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Upload, QrCode, ArrowRight, Wrench, Users, Bell, Shield, CheckCircle } from "lucide-react";
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
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    Quero ser um dos primeiros
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
                  <p className="text-3xl font-bold">Grátis</p>
                  <p className="text-sm text-primary-foreground/70">Para testar</p>
                </div>
                <div className="w-px h-12 bg-primary-foreground/20" />
                <div className="text-center">
                  <p className="text-3xl font-bold">MVP</p>
                  <p className="text-sm text-primary-foreground/70">Em fase beta</p>
                </div>
              </div>
            </div>
            
            <div className="relative animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 bg-success/20 rounded-3xl blur-3xl" />
              <img 
                src={heroImage}
                alt="WiseDrive Dashboard"
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section id="funcionalidades" className="py-20 md:py-28 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Por que usar o WiseDrive?
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
      
      {/* How it Works Section */}
      <section id="como-funciona" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Como funciona?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simples, rápido e profissional
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <StepCard
              icon={FileText}
              step={1}
              title="Cadastre seu carro"
              description="Adicione as informações básicas do seu veículo em poucos minutos"
              delay={0}
            />
            <StepCard
              icon={Upload}
              step={2}
              title="Registre manutenções"
              description="Anexe notas fiscais e fotos de cada serviço realizado"
              delay={100}
            />
            <StepCard
              icon={QrCode}
              step={3}
              title="Gere o histórico"
              description="Compartilhe via PDF, link ou QR Code com potenciais compradores"
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* Workshop Section */}
      <section id="oficinas" className="py-20 md:py-28 bg-surface">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <Wrench className="h-4 w-4" />
                Para Oficinas Mecânicas
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Fidelize seus clientes e <span className="text-green-600">aumente o faturamento</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Cadastre serviços realizados e mantenha seus clientes sempre voltando.
                O histórico vai direto para o app do cliente!
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-2 mt-1">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">CRM Inteligente</h4>
                    <p className="text-muted-foreground text-sm">Gerencie todos os seus clientes e histórico de atendimentos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-2 mt-1">
                    <Bell className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Lembretes Automáticos</h4>
                    <p className="text-muted-foreground text-sm">Notifique clientes sobre revisões e traga-os de volta</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-2 mt-1">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Credibilidade Digital</h4>
                    <p className="text-muted-foreground text-sm">Seu nome aparece no histórico do veículo como oficina de confiança</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/login?type=workshop">
                  <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    Cadastrar minha oficina
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Features Card */}
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center bg-green-600 rounded-full p-4 mb-4">
                    <Wrench className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">WiseDrive para Oficinas</h3>
                  <p className="text-muted-foreground">Comece grátis, cresça com a gente</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">150 veículos/mês no plano gratuito</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Link compartilhável do histórico</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Templates de serviços reutilizáveis</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Envio automático por WhatsApp</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Plano Starter</p>
                  <p className="text-3xl font-bold text-green-600">Grátis</p>
                  <p className="text-xs text-muted-foreground">para sempre</p>
                </div>
              </div>
            </div>
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
              WiseDrive está revolucionando a forma como o histórico de veículos 
              é compartilhado no Brasil
            </p>
            <Link to="/login">
              <Button variant="hero" size="lg">
                Começar agora
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
