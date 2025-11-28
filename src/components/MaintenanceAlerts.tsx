import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenanceAlert } from "@/hooks/useMaintenanceAlerts";
import { AlertCircle, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { useState } from "react";

interface MaintenanceAlertsProps {
  alerts: MaintenanceAlert[];
  onRegisterMaintenance?: (vehicleId: string, serviceName: string) => void;
}

export const MaintenanceAlerts = ({ alerts, onRegisterMaintenance }: MaintenanceAlertsProps) => {
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCriticality, setFilterCriticality] = useState<string>("all");

  const filteredAlerts = alerts.filter((alert) => {
    if (filterVehicle !== "all" && alert.vehicleId !== filterVehicle) return false;
    if (filterStatus !== "all" && alert.status !== filterStatus) return false;
    if (filterCriticality !== "all" && alert.recommendation.criticidade !== filterCriticality) return false;
    return true;
  });

  const vehicleOptions = Array.from(new Set(alerts.map((a) => ({ id: a.vehicleId, name: a.vehicleName }))))
    .reduce((acc, curr) => {
      if (!acc.find((v) => v.id === curr.id)) acc.push(curr);
      return acc;
    }, [] as { id: string; name: string }[]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "due-soon":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "overdue":
        return <Badge variant="destructive">Atrasada</Badge>;
      case "due-soon":
        return <Badge variant="outline" className="border-warning text-warning">Próxima</Badge>;
      default:
        return <Badge variant="outline" className="border-success text-success">Em dia</Badge>;
    }
  };

  const getCriticalityBadge = (criticidade: string) => {
    switch (criticidade) {
      case "Crítica":
        return <Badge className="bg-[#FF0000] hover:bg-[#FF0000]/90 text-white">Crítica</Badge>;
      case "Alta":
        return <Badge className="bg-[#FFA500] hover:bg-[#FFA500]/90 text-white">Alta</Badge>;
      case "Média":
        return <Badge className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-gray-900">Média</Badge>;
      case "Baixa":
        return <Badge className="bg-[#90EE90] hover:bg-[#90EE90]/90 text-gray-900">Baixa</Badge>;
      default:
        return null;
    }
  };

  const overdueCount = filteredAlerts.filter((a) => a.status === "overdue").length;
  const dueSoonCount = filteredAlerts.filter((a) => a.status === "due-soon").length;

  // Contadores por criticidade
  const criticaCount = filteredAlerts.filter((a) => a.recommendation.criticidade === "Crítica").length;
  const altaCount = filteredAlerts.filter((a) => a.recommendation.criticidade === "Alta").length;
  const mediaCount = filteredAlerts.filter((a) => a.recommendation.criticidade === "Média").length;
  const baixaCount = filteredAlerts.filter((a) => a.recommendation.criticidade === "Baixa").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold">Alertas de Manutenção</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {overdueCount > 0 && (
              <span className="text-destructive font-medium">{overdueCount} atrasada(s)</span>
            )}
            {overdueCount > 0 && dueSoonCount > 0 && " • "}
            {dueSoonCount > 0 && (
              <span className="text-warning font-medium">{dueSoonCount} próxima(s)</span>
            )}
            {overdueCount === 0 && dueSoonCount === 0 && (
              <span className="text-success font-medium">Todas as manutenções em dia!</span>
            )}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
          <Select value={filterVehicle} onValueChange={setFilterVehicle}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por veículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os veículos</SelectItem>
              {vehicleOptions.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="overdue">Atrasadas</SelectItem>
              <SelectItem value="due-soon">Próximas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCriticality} onValueChange={setFilterCriticality}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Criticidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ({alerts.length})</SelectItem>
              <SelectItem value="Crítica">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF0000]" />
                  Crítica ({criticaCount})
                </div>
              </SelectItem>
              <SelectItem value="Alta">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FFA500]" />
                  Alta ({altaCount})
                </div>
              </SelectItem>
              <SelectItem value="Média">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
                  Média ({mediaCount})
                </div>
              </SelectItem>
              <SelectItem value="Baixa">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#90EE90]" />
                  Baixa ({baixaCount})
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-success mb-4" />
            <p className="text-lg font-semibold">Nenhum alerta no momento</p>
            <p className="text-sm text-muted-foreground">
              Todas as manutenções estão em dia!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={
              alert.status === "overdue" 
                ? "border-destructive/50" 
                : alert.status === "due-soon" 
                ? "border-warning/50" 
                : ""
            }>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(alert.status)}
                    <div>
                      <CardTitle className="text-lg">{alert.recommendation.item}</CardTitle>
                      <CardDescription className="mt-1">
                        {alert.vehicleName} • {alert.recommendation.category}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {getStatusBadge(alert.status)}
                    {getCriticalityBadge(alert.recommendation.criticidade)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm">{alert.message}</p>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {alert.recommendation.kmInterval && (
                      <span>
                        📍 Intervalo: {alert.recommendation.kmInterval.toLocaleString()} km
                      </span>
                    )}
                    {alert.recommendation.timeInterval && (
                      <span>
                        🕐 Intervalo: {alert.recommendation.timeInterval} meses
                      </span>
                    )}
                    {alert.lastMaintenanceDate && (
                      <span>
                        📅 Última: {new Date(alert.lastMaintenanceDate).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {alert.lastMaintenanceKm && (
                      <span>
                        🚗 Última KM: {alert.lastMaintenanceKm.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">
                      💰 Custo estimado: R$ {alert.recommendation.custoMinimo.toLocaleString('pt-BR')} - R$ {alert.recommendation.custoMaximo.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-muted-foreground italic">
                      (referência 2024)
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    {alert.recommendation.description}
                  </p>

                  {onRegisterMaintenance && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRegisterMaintenance(alert.vehicleId, alert.recommendation.item)}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar manutenção
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
