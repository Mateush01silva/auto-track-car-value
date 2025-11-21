import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  Check,
  Calendar,
  Users,
  FileText,
  Camera,
  Bell
} from "lucide-react";

interface UpgradeLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  currentCount: number;
  limit: number;
  onUpgrade: () => void;
}

export function UpgradeLimitModal({
  open,
  onOpenChange,
  currentPlan,
  currentCount,
  limit,
  onUpgrade
}: UpgradeLimitModalProps) {
  // Calculate next month reset date
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetDate = nextMonth.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long'
  });

  const percentUsed = Math.round((currentCount / limit) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="h-6 w-6 text-primary" />
            Limite Atingido!
          </DialogTitle>
          <DialogDescription>
            Você atingiu o limite de veículos do seu plano este mês.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Usage */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Seu plano atual:</span>
              <Badge variant="outline" className="capitalize">{currentPlan}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Veículos este mês:</span>
              <span className="font-semibold text-danger">{currentCount}/{limit}</span>
            </div>
            <Progress value={percentUsed} className="h-2" />
          </div>

          {/* Professional Plan Card */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Plano Professional
                  </h3>
                  <Badge className="bg-primary">Recomendado</Badge>
                </div>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span><strong>400</strong> veículos/mês</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>CRM e lembretes automáticos</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>Templates ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>Scanner de placa</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>Exportação CSV</span>
                  </li>
                </ul>

                <div className="pt-2 border-t">
                  <p className="text-2xl font-bold text-primary">
                    R$ 199<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>
              Ou aguarde até <strong>{resetDate}</strong> quando o contador será resetado.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onUpgrade}
            className="flex-1"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Fazer Upgrade Agora
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Aguardar Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradeLimitModal;
