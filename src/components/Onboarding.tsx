import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Car, Wrench, Bell, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const onboardingSteps = [
  {
    icon: Car,
    title: "Gerencie seus veículos",
    description: "Cadastre todos os seus veículos em um só lugar. Mantenha informações atualizadas sobre quilometragem e dados importantes.",
    color: "bg-blue-500",
  },
  {
    icon: Wrench,
    title: "Registre manutenções",
    description: "Acompanhe todo o histórico de manutenções do seu veículo. Anexe comprovantes e notas fiscais para referência futura.",
    color: "bg-green-500",
  },
  {
    icon: Bell,
    title: "Alertas inteligentes",
    description: "Receba lembretes automáticos quando suas manutenções estiverem próximas ou atrasadas, baseados em quilometragem e tempo.",
    color: "bg-orange-500",
  },
  {
    icon: BarChart3,
    title: "Relatórios detalhados",
    description: "Visualize gráficos e relatórios completos sobre seus gastos com manutenção. Exporte dados em Excel ou compartilhe via QR Code.",
    color: "bg-purple-500",
  },
];

export const Onboarding = ({ open, onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="relative">
          {/* Header with progress */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 pb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Bem-vindo ao Vybo!</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-white hover:bg-white/20"
              >
                Pular
              </Button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 justify-center">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-white"
                      : index < currentStep
                      ? "w-2 bg-white/70"
                      : "w-2 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="flex justify-center">
              <div className={`${step.color} rounded-full p-6 animate-fade-in`}>
                <Icon className="h-16 w-16 text-white" />
              </div>
            </div>

            <div className="text-center space-y-3 animate-fade-in">
              <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Feature highlights */}
            {currentStep === 0 && (
              <div className="mt-6 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Integração com FIPE para dados dos veículos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Acompanhamento de quilometragem em tempo real</span>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="mt-6 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Categorias organizadas de serviços</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Upload de comprovantes em PDF ou imagem</span>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="mt-6 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Baseado em intervalos de KM e tempo</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Nunca perca o prazo das suas manutenções</span>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="mt-6 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Gráficos de custos e histórico</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Compartilhamento fácil via QR Code</span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1"
                >
                  Voltar
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={`${currentStep === 0 ? "w-full" : "flex-1"}`}
              >
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Começar
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
