import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Maintenance {
  id: string;
  vehicle_id: string;
  user_id: string;
  date: string;
  service_type: string;
  km: number;
  cost: number;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useMaintenances = (vehicleId?: string) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMaintenances = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from("maintenances")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMaintenances(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar manutenções",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
  }, [user, vehicleId]);

  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Type:', file.type, 'Size:', file.size);

      const { data, error: uploadError } = await supabase.storage
        .from('maintenance-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);
      return fileName;
    } catch (error: any) {
      console.error('Upload catch error:', error);
      toast({
        title: "Erro ao fazer upload do arquivo",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const addMaintenance = async (
    maintenanceData: Omit<Maintenance, "id" | "user_id" | "created_at" | "updated_at">,
    attachmentFile?: File
  ) => {
    if (!user) return;

    try {
      let attachment_url = maintenanceData.attachment_url;

      // Upload attachment if provided
      if (attachmentFile) {
        const uploadedPath = await uploadAttachment(attachmentFile);
        if (uploadedPath) {
          attachment_url = uploadedPath;
        }
      }

      const { data, error } = await supabase
        .from("maintenances")
        .insert([{ ...maintenanceData, attachment_url, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setMaintenances((prev) => [data, ...prev]);
      toast({
        title: "Manutenção registrada",
        description: "A manutenção foi cadastrada com sucesso!",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao registrar manutenção",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMaintenance = async (id: string, updates: Partial<Maintenance>) => {
    try {
      const { data, error } = await supabase
        .from("maintenances")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setMaintenances((prev) => prev.map((m) => (m.id === id ? data : m)));
      toast({
        title: "Manutenção atualizada",
        description: "As informações foram atualizadas com sucesso!",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar manutenção",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteMaintenance = async (id: string) => {
    try {
      const { error } = await supabase
        .from("maintenances")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMaintenances((prev) => prev.filter((m) => m.id !== id));
      toast({
        title: "Manutenção excluída",
        description: "A manutenção foi removida com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir manutenção",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getAttachmentUrl = async (path: string | null): Promise<string | null> => {
    if (!path) return null;

    try {
      const { data, error } = await supabase.storage
        .from('maintenance-attachments')
        .createSignedUrl(path, 60 * 60 * 24); // URL válida por 24h

      if (error) throw error;
      return data?.signedUrl ?? null;
    } catch (error) {
      console.error('Erro ao gerar URL assinada do anexo:', error);
      return null;
    }
  };

  const deleteAttachment = async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from('maintenance-attachments')
        .remove([path]);

      if (error) throw error;
    } catch (error: any) {
      console.error("Erro ao deletar anexo:", error);
    }
  };

  return {
    maintenances,
    loading,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    refetch: fetchMaintenances,
    getAttachmentUrl,
    deleteAttachment,
  };
};
