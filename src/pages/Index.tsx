import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Upload, QrCode, ArrowRight } from "lucide-react";
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
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  Quero ser um dos primeiros
                </Button>
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
                alt="AutoTrack Dashboard"
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
              Por que usar o AutoTrack?
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
      
      {/* Impact Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary-hover text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Mais segurança para quem compra, mais valorização para quem vende 
              e mais transparência para o mercado
            </h2>
            <p className="text-xl text-primary-foreground/90">
              AutoTrack está revolucionando a forma como o histórico de veículos 
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
