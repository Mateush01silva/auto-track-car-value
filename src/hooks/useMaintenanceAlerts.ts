import { useMemo } from "react";
import { Vehicle } from "@/hooks/useVehicles";
import { Maintenance } from "@/hooks/useMaintenances";
import { MAINTENANCE_RECOMMENDATIONS, MaintenanceRecommendation } from "@/constants/maintenanceRecommendations";
import { differenceInMonths, differenceInDays } from "date-fns";

export interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  recommendation: MaintenanceRecommendation;
  status: "overdue" | "due-soon" | "ok";
  message: string;
  kmRemaining?: number;
  daysRemaining?: number;
  lastMaintenanceDate?: Date;
  lastMaintenanceKm?: number;
}

const KM_THRESHOLD = 500; // Alerta quando faltam 500km
const DAYS_THRESHOLD = 15; // Alerta quando faltam 15 dias

export const useMaintenanceAlerts = (
  vehicles: Vehicle[],
  maintenances: Maintenance[]
): MaintenanceAlert[] => {
  const alerts = useMemo(() => {
    const allAlerts: MaintenanceAlert[] = [];

    vehicles.forEach((vehicle) => {
      MAINTENANCE_RECOMMENDATIONS.forEach((recommendation) => {
        // Encontrar a última manutenção deste tipo para este veículo
        const relevantMaintenances = maintenances.filter(
          (m) =>
            m.vehicle_id === vehicle.id &&
            m.service_type.toLowerCase().includes(recommendation.item.toLowerCase())
        );

        const lastMaintenance = relevantMaintenances.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

        const currentKm = vehicle.current_km;
        const lastMaintenanceKm = lastMaintenance?.km || 0;
        const lastMaintenanceDate = lastMaintenance ? new Date(lastMaintenance.date) : null;
        const now = new Date();

        let status: "overdue" | "due-soon" | "ok" = "ok";
        let message = "";
        let kmRemaining: number | undefined;
        let daysRemaining: number | undefined;

        // Verificar por KM
        if (recommendation.kmInterval) {
          const kmSinceLastMaintenance = currentKm - lastMaintenanceKm;
          kmRemaining = recommendation.kmInterval - kmSinceLastMaintenance;

          if (kmRemaining <= 0) {
            status = "overdue";
            message = `${recommendation.item} atrasada — excedeu ${Math.abs(kmRemaining)} km`;
          } else if (kmRemaining <= KM_THRESHOLD && status === "ok") {
            status = "due-soon";
            message = `${recommendation.item} próxima — faltam ${kmRemaining} km`;
          }
        }

        // Verificar por tempo
        if (recommendation.timeInterval && lastMaintenanceDate) {
          const monthsSinceLastMaintenance = differenceInMonths(now, lastMaintenanceDate);
          const daysSinceLastMaintenance = differenceInDays(now, lastMaintenanceDate);
          const monthsRemaining = recommendation.timeInterval - monthsSinceLastMaintenance;
          daysRemaining = recommendation.timeInterval * 30 - daysSinceLastMaintenance;

          if (monthsRemaining <= 0) {
            status = "overdue";
            message = `${recommendation.item} atrasada — há ${Math.abs(monthsRemaining)} meses`;
          } else if (daysRemaining <= DAYS_THRESHOLD && status === "ok") {
            status = "due-soon";
            message = `${recommendation.item} próxima — faltam ${daysRemaining} dias`;
          }
        }

        // Se nunca foi feita a manutenção e passou do intervalo recomendado
        if (!lastMaintenance) {
          if (recommendation.kmInterval && currentKm >= recommendation.kmInterval) {
            status = "overdue";
            message = `${recommendation.item} nunca realizada — recomendada a cada ${recommendation.kmInterval.toLocaleString()} km`;
          } else if (recommendation.timeInterval) {
            // Alertar apenas para manutenções mais críticas que nunca foram feitas
            const criticalItems = ["Troca de óleo", "Filtro de óleo", "Revisão básica"];
            if (criticalItems.includes(recommendation.item)) {
              status = "due-soon";
              message = `${recommendation.item} nunca registrada — recomendada`;
            }
          }
        }

        // Adicionar alerta apenas se não estiver "ok"
        if (status !== "ok") {
          allAlerts.push({
            id: `${vehicle.id}-${recommendation.item}`,
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
            recommendation,
            status,
            message,
            kmRemaining,
            daysRemaining,
            lastMaintenanceDate: lastMaintenanceDate || undefined,
            lastMaintenanceKm: lastMaintenanceKm || undefined,
          });
        }
      });
    });

    // Ordenar por prioridade (overdue primeiro, depois due-soon)
    return allAlerts.sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (a.status !== "overdue" && b.status === "overdue") return 1;
      return 0;
    });
  }, [vehicles, maintenances]);

  return alerts;
};
