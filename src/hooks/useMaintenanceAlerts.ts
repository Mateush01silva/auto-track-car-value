import { useState, useEffect } from "react";
import { Vehicle } from "@/hooks/useVehicles";
import { Maintenance } from "@/hooks/useMaintenances";
import { MaintenanceRecommendation } from "@/constants/maintenanceRecommendations";
import { getVehicleRevisions, CachedRevision } from "@/services/vehicleRevisionsCache";
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

const KM_THRESHOLD = 500;
const DAYS_THRESHOLD = 15;

function cachedRevisionToRecommendation(rev: CachedRevision): MaintenanceRecommendation {
  return {
    id: rev.id,
    category: rev.category,
    item: rev.item,
    description: rev.description,
    kmInterval: rev.km_interval,
    timeInterval: rev.time_interval,
    type: rev.type as 'Preventiva' | 'Corretiva',
    criticidade: rev.criticality as 'Crítica' | 'Alta' | 'Média' | 'Baixa',
    custoMinimo: rev.min_cost,
    custoMaximo: rev.max_cost,
    custoEstimado: rev.max_cost,
    tempoEstimado: rev.estimated_time,
  };
}

export const useMaintenanceAlerts = (
  vehicles: Vehicle[],
  maintenances: Maintenance[]
): MaintenanceAlert[] => {
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);

  // Busca proativa: quando o hook é montado, verifica e busca revisões se necessário
  useEffect(() => {
    const ensureRevisionsAreFetched = async () => {
      if (!vehicles || vehicles.length === 0) return;

      console.log('[ALERTS] Verificando revisões para', vehicles.length, 'veículos...');

      // Para cada veículo, garantir que as revisões foram buscadas
      for (const vehicle of vehicles) {
        try {
          // getVehicleRevisions já faz o check interno, mas vamos logar
          const revisions = await getVehicleRevisions(
            vehicle.id,
            vehicle.brand,
            vehicle.model,
            vehicle.year
          );

          if (revisions.length > 0) {
            console.log(`[ALERTS] ✅ ${vehicle.brand} ${vehicle.model}: ${revisions.length} revisões disponíveis`);
          } else {
            console.warn(`[ALERTS] ⚠️ ${vehicle.brand} ${vehicle.model}: Nenhuma revisão encontrada`);
          }
        } catch (error) {
          console.error(`[ALERTS] ❌ Erro ao buscar revisões para ${vehicle.brand} ${vehicle.model}:`, error);
        }
      }
    };

    ensureRevisionsAreFetched();
  }, [vehicles]); // Re-executa quando a lista de veículos muda

  useEffect(() => {
    const calculateAlerts = async () => {
      const allAlerts: MaintenanceAlert[] = [];

      for (const vehicle of vehicles) {
        const cachedRevisions = await getVehicleRevisions(
          vehicle.id,
          vehicle.brand,
          vehicle.model,
          vehicle.year
        );

        if (cachedRevisions.length === 0) {
          console.warn('[ALERTS] Sem revisões para', vehicle.brand, vehicle.model);
          continue;
        }

        const recommendations = cachedRevisions.map(cachedRevisionToRecommendation);

        recommendations.forEach((recommendation) => {
          const relevantMaintenances = maintenances.filter(
            (m) =>
              m.vehicle_id === vehicle.id &&
              m.service_type.toLowerCase().includes(recommendation.item.toLowerCase())
          );

          const lastMaintenance = relevantMaintenances.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

          const currentKm = vehicle.current_km;
          const initialKm = vehicle.initial_km || vehicle.current_km;
          const lastMaintenanceKm = lastMaintenance?.km || initialKm;
          const lastMaintenanceDate = lastMaintenance ? new Date(lastMaintenance.date) : null;
          const now = new Date();

          let status: "overdue" | "due-soon" | "ok" = "ok";
          let message = "";
          let kmRemaining: number | undefined;
          let daysRemaining: number | undefined;

          if (recommendation.kmInterval) {
            if (!lastMaintenance) {
              const nextMilestone = Math.ceil(initialKm / recommendation.kmInterval) * recommendation.kmInterval;
              const kmUntilNextMilestone = nextMilestone - currentKm;

              if (kmUntilNextMilestone <= 0) {
                status = "overdue";
                message = recommendation.item + ' atrasada — deveria ter sido feita aos ' + nextMilestone.toLocaleString() + ' km';
                kmRemaining = kmUntilNextMilestone;
              } else if (kmUntilNextMilestone <= KM_THRESHOLD) {
                status = "due-soon";
                message = recommendation.item + ' próxima — faltam ' + kmUntilNextMilestone.toLocaleString() + ' km';
                kmRemaining = kmUntilNextMilestone;
              }
            } else {
              const kmSinceLastMaintenance = currentKm - lastMaintenanceKm;
              kmRemaining = recommendation.kmInterval - kmSinceLastMaintenance;

              if (kmRemaining <= 0) {
                status = "overdue";
                message = recommendation.item + ' atrasada — excedeu ' + Math.abs(kmRemaining).toLocaleString() + ' km';
              } else if (kmRemaining <= KM_THRESHOLD && status === "ok") {
                status = "due-soon";
                message = recommendation.item + ' próxima — faltam ' + kmRemaining.toLocaleString() + ' km';
              }
            }
          }

          if (recommendation.timeInterval && lastMaintenanceDate) {
            const monthsSinceLastMaintenance = differenceInMonths(now, lastMaintenanceDate);
            const daysSinceLastMaintenance = differenceInDays(now, lastMaintenanceDate);
            const monthsRemaining = recommendation.timeInterval - monthsSinceLastMaintenance;
            daysRemaining = recommendation.timeInterval * 30 - daysSinceLastMaintenance;

            if (monthsRemaining <= 0) {
              status = "overdue";
              message = recommendation.item + ' atrasada — há ' + Math.abs(monthsRemaining) + ' meses';
            } else if (daysRemaining <= DAYS_THRESHOLD && status === "ok") {
              status = "due-soon";
              message = recommendation.item + ' próxima — faltam ' + daysRemaining + ' dias';
            }
          }

          if (status !== "ok") {
            allAlerts.push({
              id: vehicle.id + '-' + recommendation.item,
              vehicleId: vehicle.id,
              vehicleName: vehicle.brand + ' ' + vehicle.model + ' ' + vehicle.year,
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
