import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  current_km: number;
}

interface KmUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  onSuccess?: () => void;
}

export function KmUpdateDialog({
  open,
  onOpenChange,
  vehicles,
  onSuccess,
}: KmUpdateDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [newKm, setNewKm] = useState("");

  // Auto-select vehicle if only one exists
  useEffect(() => {
    if (vehicles.length === 1) {
      setSelectedVehicleId(vehicles[0].id);
    } else {
      setSelectedVehicleId("");
    }
    setNewKm("");
  }, [vehicles, open]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicleId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um veículo",
        variant: "destructive",
      });
      return;
    }

    const kmValue = parseInt(newKm.replace(/\D/g, ''));

    if (!kmValue || kmValue <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe uma quilometragem válida",
        variant: "destructive",
      });
      return;
    }

    if (selectedVehicle && kmValue < selectedVehicle.current_km) {
      toast({
        title: "Quilometragem inválida",
        description: `A quilometragem não pode ser menor que a atual (${selectedVehicle.current_km.toLocaleString('pt-BR')} km)`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({ current_km: kmValue })
        .eq("id", selectedVehicleId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Quilometragem atualizada com sucesso",
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao atualizar quilometragem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quilometragem",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-600" />
            Atualizar Quilometragem
          </DialogTitle>
          <DialogDescription>
            Mantenha a quilometragem atualizada para receber recomendações precisas de manutenção.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {vehicles.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="vehicle">Selecione o veículo</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} required>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Escolha um veículo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg">
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedVehicle && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-900">
                <strong>Veículo:</strong> {selectedVehicle.brand} {selectedVehicle.model}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <strong>KM atual:</strong> {selectedVehicle.current_km.toLocaleString('pt-BR')} km
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="km">Nova quilometragem</Label>
            <Input
              id="km"
              type="text"
              placeholder="Ex: 45.000"
              value={newKm}
              onChange={(e) => {
                const numbers = e.target.value.replace(/\D/g, '');
                const limited = numbers.slice(0, 6);
                const formatted = limited.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                setNewKm(formatted);
              }}
              maxLength={7}
              required
              disabled={!selectedVehicleId}
            />
            <p className="text-xs text-muted-foreground">
              Informe a quilometragem atual do veículo
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={submitting || !selectedVehicleId}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
