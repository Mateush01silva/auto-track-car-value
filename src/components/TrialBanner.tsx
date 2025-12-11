import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";
import { useState } from "react";
import UpgradeDialog from "./UpgradeDialog";

interface TrialBannerProps {
  daysRemaining: number;
  maintenancesCount?: number;
  vehiclesCount?: number;
}

const TrialBanner = ({ daysRemaining, maintenancesCount = 0, vehiclesCount = 0 }: TrialBannerProps) => {
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Determinar mensagem baseada nos dias restantes
  const getMessage = () => {
    if (daysRemaining > 75) {
      return {
        title: "🎉 Bem-vindo ao Vybo!",
        description: `Você tem ${daysRemaining} dias para explorar todos os recursos gratuitamente.`,
        variant: "default" as const,
        showButton: false,
      };
    } else if (daysRemaining >= 60) {
      return {
        title: "⏰ Faltam 60 dias!",
        description: "Aproveite todos os recursos e veja como o Vybo pode transformar a gestão do seu veículo.",
        variant: "default" as const,
        showButton: false,
      };
    } else if (daysRemaining >= 30) {
      return {
        title: "💡 Faltam 30 dias do trial!",
        description: `Você já registrou ${maintenancesCount} manutenções. Considere o Plano Pro para recursos ilimitados!`,
        variant: "default" as const,
        showButton: true,
        buttonText: "Ver Plano Pro",
      };
    } else if (daysRemaining >= 15) {
      return {
        title: "🔥 Últimos 15 dias!",
        description: "Garanta 20% OFF no plano anual e proteja todo o seu histórico para sempre!",
        variant: "default" as const,
        showButton: true,
        buttonText: "Garantir Desconto",
        highlight: true,
      };
    } else if (daysRemaining >= 5) {
      return {
        title: "⚠️ 5 dias restantes!",
        description: "Não perca seu histórico! Migre para o Plano Pro agora.",
        variant: "destructive" as const,
        showButton: true,
        buttonText: "Salvar Meu Histórico",
        highlight: true,
      };
    } else {
      return {
        title: "🚨 Últimos dias do trial!",
        description: `Restam apenas ${daysRemaining} dias! Seu histórico de ${maintenancesCount} manutenções será perdido.`,
        variant: "destructive" as const,
        showButton: true,
        buttonText: "Upgrade Agora",
        highlight: true,
      };
    }
  };

  const message = getMessage();

  // Não mostrar banner nos primeiros dias (>75 dias restantes) a menos que tenha atividade
  if (daysRemaining > 75 && maintenancesCount === 0) {
    return null;
  }

  return (
    <>
      <Alert variant={message.variant} className={message.highlight ? "border-2 animate-pulse" : ""}>
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold">{message.title}</p>
            <p className="text-sm mt-1">{message.description}</p>
          </div>
          {message.showButton && (
            <Button
              variant={message.highlight ? "hero" : "default"}
              size="sm"
              onClick={() => setShowUpgrade(true)}
              className="flex-shrink-0"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {message.buttonText}
            </Button>
          )}
        </AlertDescription>
      </Alert>

      <UpgradeDialog 
        open={showUpgrade} 
        onOpenChange={setShowUpgrade}
        trialDaysRemaining={daysRemaining}
      />
    </>
  );
};

export default TrialBanner;
