import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  trialDaysRemaining?: number;
}

const UpgradeDialog = ({ open, onOpenChange, feature, trialDaysRemaining }: UpgradeDialogProps) => {
  const handleUpgrade = (plan: "monthly" | "yearly") => {
    // TODO: Integrar com sistema de pagamento
    console.log("Upgrade to:", plan);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-success" />
            Upgrade para o Plano Pro
          </DialogTitle>
          {feature && (
            <DialogDescription className="text-base">
              Para {feature}, você precisa do Plano Pro
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Plano Gratuito */}
          <Card className="p-6 border-2 border-border">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-2">Plano Gratuito</h3>
              <div className="text-3xl font-bold text-primary mb-1">R$ 0</div>
              <p className="text-sm text-muted-foreground">
                {trialDaysRemaining ? `${trialDaysRemaining} dias restantes` : "90 dias de teste"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm">1 veículo</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm">Até 3 manutenções/mês</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm">Relatórios básicos</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="h-5 w-5 text-danger mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Sem compartilhamento via link/QR Code</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="h-5 w-5 text-danger mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Sem exportar Excel</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                ⏰ Expira em 90 dias
              </p>
            </div>
          </Card>

          {/* Plano Pro */}
          <Card className="p-6 border-2 border-success bg-gradient-to-br from-success/5 to-success/10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground px-4 py-1 rounded-full text-xs font-bold">
              RECOMENDADO
            </div>
            
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-2">Plano Pro</h3>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-success">R$ 19,90</div>
                <p className="text-sm text-muted-foreground">/mês</p>
                <p className="text-xs text-success font-semibold">
                  ou R$ 199/ano (17% OFF)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Até 3 veículos</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Manutenções ilimitadas</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Compartilhamento via link e QR Code 🔑</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Exportar Excel 🔑</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Relatórios avançados com gráficos</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Alertas inteligentes por email</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">Histórico completo sem limite</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => handleUpgrade("monthly")}
              >
                Assinar Mensal - R$ 19,90/mês
              </Button>
              <Button 
                variant="success" 
                className="w-full"
                onClick={() => handleUpgrade("yearly")}
              >
                Assinar Anual - R$ 199/ano
                <span className="ml-2 text-xs">(17% OFF)</span>
              </Button>
            </div>

            <div className="mt-4 p-3 bg-card rounded-lg border border-success/20">
              <p className="text-xs text-center">
                💰 <strong>Um histórico completo pode aumentar o valor do seu carro em até R$ 3.000!</strong>
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            ✅ Garantia de 7 dias - Não gostou? Devolvemos 100% do valor
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;
