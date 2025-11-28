import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TipoSelo, VeiculoSelo } from "@/services/seloQualidade";
import { Award, TrendingUp, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SeloVeiculoProps {
  selo: VeiculoSelo;
  compact?: boolean;
}

export const SeloVeiculo = ({ selo, compact = false }: SeloVeiculoProps) => {
  const getSeloIcon = (tipo: TipoSelo) => {
    switch (tipo) {
      case "ouro":
        return <Award className="h-12 w-12" style={{ color: "#FFD700" }} />;
      case "prata":
        return <Award className="h-12 w-12" style={{ color: "#C0C0C0" }} />;
      case "bronze":
        return <Award className="h-12 w-12" style={{ color: "#CD7F32" }} />;
      default:
        return <AlertCircle className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getSeloColor = (tipo: TipoSelo) => {
    switch (tipo) {
      case "ouro":
        return "bg-gradient-to-r from-yellow-200 to-yellow-400 border-yellow-500";
      case "prata":
        return "bg-gradient-to-r from-gray-200 to-gray-400 border-gray-500";
      case "bronze":
        return "bg-gradient-to-r from-orange-200 to-orange-400 border-orange-500";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300";
    }
  };

  const getSeloMessage = (tipo: TipoSelo) => {
    switch (tipo) {
      case "ouro":
        return { title: "Selo Ouro", message: "Parabéns! Manutenção exemplar" };
      case "prata":
        return { title: "Selo Prata", message: "Muito bem! Continue assim" };
      case "bronze":
        return { title: "Selo Bronze", message: "Bom trabalho! Há melhorias possíveis" };
      default:
        return { title: "Sem Selo", message: "⚠️ Atenção! Manutenções críticas pendentes" };
    }
  };

  const { title, message } = getSeloMessage(selo.tipo_selo);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="scale-75">{getSeloIcon(selo.tipo_selo)}</div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">
                  {selo.percentual_todas.toFixed(0)}% em dia
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64">
            <div className="space-y-2">
              <p className="font-medium">{message}</p>
              <div className="text-xs space-y-1">
                <p>Críticas: {selo.percentual_criticas.toFixed(1)}%</p>
                <p>Altas: {selo.percentual_altas.toFixed(1)}%</p>
                <p>Todas: {selo.percentual_todas.toFixed(1)}%</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={`border-2 ${getSeloColor(selo.tipo_selo)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getSeloIcon(selo.tipo_selo)}
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="mt-1">{message}</CardDescription>
            </div>
          </div>
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Críticas</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {selo.percentual_criticas.toFixed(0)}%
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-muted-foreground">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {selo.total_sugestoes_criticas - selo.total_atrasadas_criticas} em dia de {selo.total_sugestoes_criticas}
                      </p>
                      {selo.total_atrasadas_criticas > 0 && (
                        <p className="text-xs text-destructive">
                          {selo.total_atrasadas_criticas} atrasada(s)
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {selo.total_atrasadas_criticas > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {selo.total_atrasadas_criticas} atrasada(s)
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Altas</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {selo.percentual_altas.toFixed(0)}%
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-muted-foreground">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {selo.total_sugestoes_altas - selo.total_atrasadas_altas} em dia de {selo.total_sugestoes_altas}
                      </p>
                      {selo.total_atrasadas_altas > 0 && (
                        <p className="text-xs text-warning">
                          {selo.total_atrasadas_altas} atrasada(s)
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {selo.total_atrasadas_altas > 0 && (
                <Badge variant="outline" className="text-xs border-warning text-warning">
                  {selo.total_atrasadas_altas} atrasada(s)
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Total</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">
                  {selo.percentual_todas.toFixed(0)}%
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-muted-foreground">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {selo.total_sugestoes_todas - selo.total_atrasadas_todas} em dia de {selo.total_sugestoes_todas}
                      </p>
                      {selo.total_atrasadas_todas > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {selo.total_atrasadas_todas} atrasada(s)
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {selo.total_atrasadas_todas > 0 && (
                <Badge variant="outline" className="text-xs">
                  {selo.total_atrasadas_todas} atrasada(s)
                </Badge>
              )}
            </div>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Última atualização: {new Date(selo.data_calculo).toLocaleDateString("pt-BR")} às {new Date(selo.data_calculo).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
