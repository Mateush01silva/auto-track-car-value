import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Gauge, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface KmUpdateReminderProps {
  onUpdateClick?: () => void;
  vehicles?: any[]; // Add vehicles prop to force re-render
}

export const KmUpdateReminder = ({ onUpdateClick, vehicles }: KmUpdateReminderProps) => {
  const [showReminder, setShowReminder] = useState(false);
  const [daysSinceUpdate, setDaysSinceUpdate] = useState(0);
  const { user } = useAuth();

  // Modo de teste: adicione ?test-km-banner=true na URL para forçar exibição
  const isTestMode = new URLSearchParams(window.location.search).get('test-km-banner') === 'true';

  useEffect(() => {
    if (!user) return;

    const checkLastUpdate = async () => {
      // Em modo de teste, sempre mostra
      if (isTestMode) {
        setDaysSinceUpdate(14);
        setShowReminder(true);
        return;
      }

      // Verificar se o usuário dispensou o banner recentemente
      const lastDismissed = localStorage.getItem(`km-reminder-dismissed-${user.id}`);
      if (lastDismissed) {
        const dismissedDate = new Date(lastDismissed);
        const daysSinceDismiss = Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));

        // Se dispensou há menos de 7 dias, não mostrar
        if (daysSinceDismiss < 7) {
          setShowReminder(false);
          return;
        }
      }

      // Buscar a última manutenção do usuário
      const { data: lastMaintenance } = await supabase
        .from("maintenances")
        .select("date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      // Buscar a última atualização de veículo (updated_at)
      const { data: lastVehicleUpdate } = await supabase
        .from("vehicles")
        .select("updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      // Pegar a data mais recente entre manutenção e atualização de veículo
      let mostRecentDate: Date | null = null;

      if (lastMaintenance && lastVehicleUpdate) {
        const maintenanceDate = new Date(lastMaintenance.date);
        const vehicleUpdateDate = new Date(lastVehicleUpdate.updated_at);
        mostRecentDate = maintenanceDate > vehicleUpdateDate ? maintenanceDate : vehicleUpdateDate;
      } else if (lastMaintenance) {
        mostRecentDate = new Date(lastMaintenance.date);
      } else if (lastVehicleUpdate) {
        mostRecentDate = new Date(lastVehicleUpdate.updated_at);
      }

      if (mostRecentDate) {
        const daysSince = Math.floor((Date.now() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
        setDaysSinceUpdate(daysSince);

        // Mostrar lembrete se passou mais de 7 dias
        if (daysSince >= 7) {
          setShowReminder(true);
        } else {
          setShowReminder(false);
        }
      } else {
        // Se não tem manutenções nem veículos, verificar há quanto tempo criou a conta
        const { data: profile } = await supabase
          .from("profiles")
          .select("created_at")
          .eq("id", user.id)
          .single();

        if (profile) {
          const accountCreated = new Date(profile.created_at);
          const daysSince = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

          // Mostrar após 7 dias de conta criada sem manutenções
          if (daysSince >= 7) {
            setDaysSinceUpdate(daysSince);
            setShowReminder(true);
          } else {
            setShowReminder(false);
          }
        }
      }
    };

    checkLastUpdate();
  }, [user, isTestMode, vehicles]); // Add vehicles to dependencies to re-check when vehicles change

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`km-reminder-dismissed-${user.id}`, new Date().toISOString());
    }
    setShowReminder(false);
  };

  if (!showReminder) return null;

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 rounded-full p-2 mt-0.5">
            <Gauge className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              Que tal atualizar a quilometragem do seu veículo?
            </h3>
            <p className="text-sm text-blue-700">
              Faz {daysSinceUpdate} dias desde a última atualização. Manter a quilometragem atualizada
              nos ajuda a fornecer recomendações de manutenção mais precisas para você!
            </p>
            {isTestMode && (
              <p className="text-xs text-orange-600 mt-2 font-semibold">
                ⚠️ MODO DE TESTE ATIVO
              </p>
            )}
            <div className="mt-3">
              {onUpdateClick && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onUpdateClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Atualizar KM
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
