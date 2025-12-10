import { useState, useEffect } from "react";
import { Vehicle } from "@/hooks/useVehicles";
import { Maintenance } from "@/hooks/useMaintenances";
import { MaintenanceRecommendation } from "@/constants/maintenanceRecommendations";
import { maintenanceApi } from "@/services/maintenanceApiAdapter";
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
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);

  useEffect(() => {
    const calculateAlerts = async () => {
      const allAlerts: MaintenanceAlert[] = [];

      // Processar cada veículo
      for (const vehicle of vehicles) {
        // Buscar recomendações usando o adapter (genérico ou fabricante)
        const result = await maintenanceApi.getRecommendations({
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
        });

        if (!result.success || !result.data) {
          console.warn(`Não foi possível carregar recomendações para ${vehicle.brand} ${vehicle.model} ${vehicle.year}`);
          continue;
        }

        const recommendations = result.data;

        recommendations.forEach((recommendation) => {
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
          const initialKm = vehicle.initial_km || vehicle.current_km; // Fallback para veículos antigos
          const lastMaintenanceKm = lastMaintenance?.km || initialKm; // Se nunca fez, usa initial_km
          const lastMaintenanceDate = lastMaintenance ? new Date(lastMaintenance.date) : null;
          const now = new Date();

          let status: "overdue" | "due-soon" | "ok" = "ok";
          let message = "";
          let kmRemaining: number | undefined;
          let daysRemaining: number | undefined;

          // Verificar por KM
          if (recommendation.kmInterval) {
            // Se nunca fez a manutenção, calcular o próximo marco APÓS initial_km
            if (!lastMaintenance) {
              // Exemplo: initial_km = 28000, kmInterval = 10000
              // Próximo marco = Math.ceil(28000/10000) * 10000 = 3 * 10000 = 30000
              const nextMilestone = Math.ceil(initialKm / recommendation.kmInterval) * recommendation.kmInterval;
              const kmUntilNextMilestone = nextMilestone - currentKm;

              // Só alertar se estiver próximo ou passou do próximo marco
              if (kmUntilNextMilestone <= 0) {
                status = "overdue";
                message = `${recommendation.item} atrasada — deveria ter sido feita aos ${nextMilestone.toLocaleString()} km`;
                kmRemaining = kmUntilNextMilestone;
              } else if (kmUntilNextMilestone <= KM_THRESHOLD) {
                status = "due-soon";
                message = `${recommendation.item} próxima — faltam ${kmUntilNextMilestone.toLocaleString()} km`;
                kmRemaining = kmUntilNextMilestone;
              }
            } else {
              // Se já fez a manutenção, calcular normalmente desde a última
              const kmSinceLastMaintenance = currentKm - lastMaintenanceKm;
              kmRemaining = recommendation.kmInterval - kmSinceLastMaintenance;

              if (kmRemaining <= 0) {
                status = "overdue";
                message = `${recommendation.item} atrasada — excedeu ${Math.abs(kmRemaining).toLocaleString()} km`;
              } else if (kmRemaining <= KM_THRESHOLD && status === "ok") {
                status = "due-soon";
                message = `${recommendation.item} próxima — faltam ${kmRemaining.toLocaleString()} km`;
              }
            }
          }

          // Verificar por tempo (apenas se já fez alguma vez)
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
      }

      // Ordenar por prioridade (overdue primeiro, depois due-soon)
      const sortedAlerts = allAlerts.sort((a, b) => {
        if (a.status === "overdue" && b.status !== "overdue") return -1;
        if (a.status !== "overdue" && b.status === "overdue") return 1;
        return 0;
      });

      setAlerts(sortedAlerts);
    };

    calculateAlerts();
  }, [vehicles, maintenances]);

  return alerts;
};
