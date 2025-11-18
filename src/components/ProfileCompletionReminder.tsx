import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, UserCircle, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileCompletionReminderProps {
  onCompleteClick?: () => void;
}

export const ProfileCompletionReminder = ({ onCompleteClick }: ProfileCompletionReminderProps) => {
  const [showReminder, setShowReminder] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const { user } = useAuth();

  // Modo de teste: adicione ?test-profile-banner=true na URL para forçar exibição
  const isTestMode = new URLSearchParams(window.location.search).get('test-profile-banner') === 'true';

  useEffect(() => {
    if (!user) return;

    const checkProfileCompletion = async () => {
      // Em modo de teste, sempre mostra
      if (isTestMode) {
        setMissingFields(["Nome", "Telefone", "Estado"]);
        setShowReminder(true);
        return;
      }

      // Verificar se o usuário dispensou o banner recentemente
      const lastDismissed = localStorage.getItem(`profile-reminder-dismissed-${user.id}`);
      if (lastDismissed) {
        const dismissedDate = new Date(lastDismissed);
        const daysSinceDismiss = Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));

        // Se dispensou há menos de 14 dias, não mostrar
        if (daysSinceDismiss < 14) {
          return;
        }
      }

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, state, municipality")
        .eq("id", user.id)
        .single();

      if (profile) {
        const missing: string[] = [];

        // Campos essenciais que devem estar preenchidos
        if (!profile.full_name) missing.push("Nome");
        if (!profile.phone) missing.push("Telefone");
        if (!profile.state) missing.push("Estado");

        setMissingFields(missing);

        // Mostrar lembrete se algum campo essencial estiver faltando
        if (missing.length > 0) {
          setShowReminder(true);
        }
      }
    };

    checkProfileCompletion();
  }, [user, isTestMode]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`profile-reminder-dismissed-${user.id}`, new Date().toISOString());
    }
    setShowReminder(false);
  };

  if (!showReminder) return null;

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-md animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-purple-500 rounded-full p-2 mt-0.5">
            <UserCircle className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 mb-1">
              Complete seu perfil para uma melhor experiência
            </h3>
            <p className="text-sm text-purple-700">
              Faltam apenas alguns dados: <strong>{missingFields.join(", ")}</strong>.
              Um perfil completo nos ajuda a personalizar suas recomendações e melhorar sua experiência!
            </p>
            {isTestMode && (
              <p className="text-xs text-orange-600 mt-2 font-semibold">
                ⚠️ MODO DE TESTE ATIVO
              </p>
            )}
            <div className="mt-3">
              {onCompleteClick && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onCompleteClick}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Completar Perfil
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-purple-700 hover:text-purple-900 hover:bg-purple-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
