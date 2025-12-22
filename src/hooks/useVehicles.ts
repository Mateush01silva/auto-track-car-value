import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getVehicleRevisions } from "@/services/vehicleRevisionsCache";

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  version: string | null;
  year: number;
  year_fab?: number | null; // Ano de fabricação (opcional)
  plate: string;
  initial_km: number; // KM de cadastro/compra
  current_km: number; // KM atual (atualizado automaticamente)
  status: "up-to-date" | "due-soon" | "overdue";
  created_at: string;
  updated_at: string;
}

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVehicles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles((data || []) as Vehicle[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar veículos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const addVehicle = async (vehicleData: Omit<Vehicle, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert([{ ...vehicleData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista localmente primeiro
      setVehicles((prev) => [data as Vehicle, ...prev]);

      // Buscar revisões do fabricante em background (não bloqueia o fluxo)
      // Isso popula os alertas de manutenção para o veículo recém-adicionado
      getVehicleRevisions(
        data.id,
        vehicleData.brand,
        vehicleData.model,
        vehicleData.year
      ).then((revisions) => {
        console.log(`[VEHICLE] Fetched ${revisions.length} maintenance revisions for new vehicle`);
      }).catch((err) => {
        console.error('[VEHICLE] Error fetching revisions:', err);
        // Não mostrar erro ao usuário - é um processo em background
      });

      // Forçar refetch para garantir sincronização completa
      setTimeout(() => fetchVehicles(), 100);

      toast({
        title: "Veículo adicionado",
        description: "O veículo foi cadastrado com sucesso!",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar veículo",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setVehicles((prev) => prev.map((v) => (v.id === id ? (data as Vehicle) : v)));
      toast({
        title: "Veículo atualizado",
        description: "As informações foram atualizadas com sucesso!",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar veículo",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast({
        title: "Veículo excluído",
        description: "O veículo foi removido com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir veículo",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    vehicles,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refetch: fetchVehicles,
  };
};
