import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkshopLimits {
  plan: string;
  monthlyVehicleLimit: number;
  currentMonthVehicles: number;
  percentUsed: number;
  canAddVehicle: boolean;
  isNearLimit: boolean; // 70%+
  isAlmostFull: boolean; // 90%+
}

interface LimitCheckResult {
  allowed: boolean;
  message?: string;
  currentCount?: number;
  limit?: number;
}

export const useWorkshopLimits = (workshopId: string | null) => {
  const [limits, setLimits] = useState<WorkshopLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLimits = useCallback(async () => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    try {
      const { data: workshop, error } = await supabase
        .from("workshops")
        .select("plan, monthly_vehicle_limit, current_month_vehicles")
        .eq("id", workshopId)
        .single();

      if (error) throw error;

      const current = workshop.current_month_vehicles || 0;
      const limit = workshop.monthly_vehicle_limit || 150;
      const percent = Math.round((current / limit) * 100);

      setLimits({
        plan: workshop.plan || 'starter',
        monthlyVehicleLimit: limit,
        currentMonthVehicles: current,
        percentUsed: percent,
        canAddVehicle: current < limit,
        isNearLimit: percent >= 70 && percent < 90,
        isAlmostFull: percent >= 90
      });
    } catch (error: any) {
      console.error("Error fetching workshop limits:", error);
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // Check if can add a new vehicle
  const checkLimit = useCallback(async (): Promise<LimitCheckResult> => {
    if (!workshopId) {
      return { allowed: false, message: "Workshop não identificado" };
    }

    try {
      const { data: workshop, error } = await supabase
        .from("workshops")
        .select("plan, monthly_vehicle_limit, current_month_vehicles")
        .eq("id", workshopId)
        .single();

      if (error) throw error;

      const current = workshop.current_month_vehicles || 0;
      const limit = workshop.monthly_vehicle_limit || 150;

      if (current >= limit) {
        return {
          allowed: false,
          message: `Você atingiu o limite de ${limit} veículos/mês do plano ${workshop.plan}.`,
          currentCount: current,
          limit: limit
        };
      }

      return {
        allowed: true,
        currentCount: current,
        limit: limit
      };
    } catch (error: any) {
      return {
        allowed: false,
        message: error.message || "Erro ao verificar limite"
      };
    }
  }, [workshopId]);

  // Increment the vehicle count after successful save
  const incrementVehicleCount = useCallback(async () => {
    if (!workshopId) return;

    try {
      const { error } = await supabase.rpc('increment_workshop_vehicle_count', {
        workshop_id: workshopId
      });

      if (error) {
        // Fallback: manual increment
        const { data: workshop } = await supabase
          .from("workshops")
          .select("current_month_vehicles")
          .eq("id", workshopId)
          .single();

        if (workshop) {
          await supabase
            .from("workshops")
            .update({
              current_month_vehicles: (workshop.current_month_vehicles || 0) + 1
            })
            .eq("id", workshopId);
        }
      }

      // Refresh limits
      await fetchLimits();
    } catch (error) {
      console.error("Error incrementing vehicle count:", error);
    }
  }, [workshopId, fetchLimits]);

  // Show soft incentive toasts based on usage
  const showSoftIncentives = useCallback(() => {
    if (!limits) return;

    if (limits.isAlmostFull && !limits.canAddVehicle) {
      // Don't show toast if already at limit (modal will show)
      return;
    }

    if (limits.isAlmostFull) {
      toast({
        title: "Limite Quase Atingido!",
        description: `Você usou ${limits.currentMonthVehicles} de ${limits.monthlyVehicleLimit} veículos este mês. Considere fazer upgrade para não ficar sem atendimentos.`,
        variant: "destructive",
      });
    } else if (limits.isNearLimit) {
      toast({
        title: "Atenção ao seu limite",
        description: `Você usou ${limits.currentMonthVehicles} de ${limits.monthlyVehicleLimit} veículos este mês. Considere upgrade para não ficar sem atendimentos.`,
      });
    }
  }, [limits, toast]);

  return {
    limits,
    loading,
    checkLimit,
    incrementVehicleCount,
    showSoftIncentives,
    refetch: fetchLimits
  };
};

export default useWorkshopLimits;
