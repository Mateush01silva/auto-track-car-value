import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Zap, TrendingUp, CheckCircle2 } from "lucide-react";
import { SubscriptionData } from "@/hooks/useSubscription";

interface UpgradeCTAProps {
  subscription: SubscriptionData | null;
  onUpgrade: () => void;
  variant?: "banner" | "card" | "compact";
  context?: "vehicles" | "maintenances" | "reports" | "general";
}

const contextMessages = {
  vehicles: {
    title: "Adicione até 3 veículos!",
    description: "Com o Plano Pro, você pode gerenciar até 3 veículos e manter todo o histórico organizado.",
    features: ["Até 3 veículos", "Histórico ilimitado", "Alertas inteligentes"],
  },
  maintenances: {
    title: "Manutenções ilimitadas!",
    description: "Registre quantas manutenções precisar, sem limites mensais.",
    features: ["Manutenções ilimitadas", "Upload de comprovantes", "Alertas automáticos"],
  },
  reports: {
    title: "Relatórios completos",
    description: "Exporte dados em Excel e compartilhe relatórios via QR Code.",
    features: ["Exportar Excel", "Compartilhar QR Code", "Gráficos avançados"],
  },
  general: {
    title: "Desbloqueie todos os recursos!",
    description: "Aproveite ao máximo o Vybo com o Plano Pro.",
    features: ["Até 3 veículos", "Manutenções ilimitadas", "Exportação e compartilhamento"],
  },
};

export const UpgradeCTA = ({ subscription, onUpgrade, variant = "card", context = "general" }: UpgradeCTAProps) => {
  // Don't show if user is already Pro
  if (subscription?.isPro && !subscription?.isTrialActive) {
    return null;
  }

  const message = contextMessages[context];

  if (variant === "banner") {
    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 shadow-lg animate-fade-in">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-primary to-purple-600 rounded-full p-3 mt-1">
              <Crown className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-foreground">{message.title}</h3>
                <Badge variant="default" className="bg-gradient-to-r from-primary to-purple-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{message.description}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {message.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={onUpgrade}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
              >
                <Zap className="mr-2 h-4 w-4" />
                Fazer Upgrade Agora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30 rounded-lg">
        <Crown className="h-5 w-5 text-primary" />
        <p className="text-sm font-medium flex-1">{message.title}</p>
        <Button size="sm" onClick={onUpgrade} className="bg-gradient-to-r from-primary to-purple-600">
          <Sparkles className="mr-1 h-3 w-3" />
          Upgrade
        </Button>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-gradient-to-br from-primary to-purple-600 rounded-full p-4">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h3 className="font-bold text-xl text-foreground">{message.title}</h3>
              <Badge variant="default" className="bg-gradient-to-r from-primary to-purple-600">
                <Sparkles className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            </div>
            <p className="text-muted-foreground">{message.description}</p>
          </div>

          <div className="space-y-2 w-full">
            {message.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground text-left">{feature}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={onUpgrade}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
          >
            <Zap className="mr-2 h-5 w-5" />
            Fazer Upgrade Agora
          </Button>

          {subscription?.isTrialActive && subscription.trialDaysRemaining > 0 && (
            <p className="text-xs text-muted-foreground">
              Trial válido por mais {subscription.trialDaysRemaining} dias
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
