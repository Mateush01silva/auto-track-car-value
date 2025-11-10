import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type SubscriptionPlan = "free_trial" | "pro_monthly" | "pro_yearly";
export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface SubscriptionData {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  isPro: boolean;
  isTrialActive: boolean;
  canAddVehicle: boolean;
  canAddMaintenance: boolean;
  canShareLink: boolean;
  canExportExcel: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchSubscriptionData();
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_status, trial_ends_at")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Count vehicles
      const { count: vehiclesCount, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (vehiclesError) throw vehiclesError;

      // Count maintenances this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: maintenancesCount, error: maintenancesError } = await supabase
        .from("maintenances")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString());

      if (maintenancesError) throw maintenancesError;

      // Calculate trial days remaining
      const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const now = new Date();
      const trialDaysRemaining = trialEndsAt 
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      const isPro = profile.subscription_plan === "pro_monthly" || profile.subscription_plan === "pro_yearly";
      const isTrialActive = profile.subscription_plan === "free_trial" 
        && profile.subscription_status === "active" 
        && trialDaysRemaining > 0;

      // Define limits
      const canAddVehicle = isPro ? (vehiclesCount || 0) < 3 : (vehiclesCount || 0) < 1;
      const canAddMaintenance = isPro ? true : (maintenancesCount || 0) < 3;
      const canShareLink = isPro;
      const canExportExcel = isPro;

      setSubscription({
        plan: profile.subscription_plan as SubscriptionPlan,
        status: profile.subscription_status as SubscriptionStatus,
        trialEndsAt: profile.trial_ends_at,
        trialDaysRemaining,
        isPro,
        isTrialActive,
        canAddVehicle,
        canAddMaintenance,
        canShareLink,
        canExportExcel,
      });
    } catch (error: any) {
      console.error("Error fetching subscription data:", error);
      toast({
        title: "Erro ao carregar dados da assinatura",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showUpgradeMessage = (feature: string) => {
    toast({
      title: "🔒 Recurso Premium",
      description: `Para ${feature}, você precisa do Plano Pro.`,
      variant: "default",
    });
  };

  return {
    subscription,
    loading,
    refetch: fetchSubscriptionData,
    showUpgradeMessage,
  };
};
