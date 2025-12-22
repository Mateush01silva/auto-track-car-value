import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileCheck } from "lucide-react";
import { MAINTENANCE_CATEGORIES, getSubcategoriesByCategory, getFullServiceLabel } from "@/constants/maintenanceCategories";
import type { Maintenance } from "@/hooks/useMaintenances";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: any[];
  onSubmit: (data: any, file?: File) => Promise<void>;
  editingMaintenance?: Maintenance | null;
  prefilledData?: { vehicleId?: string; serviceName?: string } | null;
}

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  vehicles,
  onSubmit,
  editingMaintenance,
  prefilledData,
}: MaintenanceFormDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    vehicle_id: "",
    date: "",
    category: "",
    subcategory: "",
    km: "",
    cost: "",
    notes: "",
  });

  useEffect(() => {
    if (editingMaintenance) {
      // Parse service_type to get category and subcategory
      const [category, subcategory] = editingMaintenance.service_type.split(" - ");
      const categoryItem = MAINTENANCE_CATEGORIES.find(c => c.label === category);

      // Formata o KM com pontos de milhar
      const formattedKm = editingMaintenance.km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

      setFormData({
        vehicle_id: editingMaintenance.vehicle_id,
        date: editingMaintenance.date,
        category: categoryItem?.value || "",
        subcategory: subcategory || "",
        km: formattedKm,
        cost: editingMaintenance.cost.toString(),
        notes: editingMaintenance.notes || "",
      });
    } else if (prefilledData?.vehicleId && prefilledData?.serviceName) {
      // Pré-preencher com dados do alerta
      const vehicle = vehicles.find(v => v.id === prefilledData.vehicleId);
      const formattedKm = vehicle?.current_km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') || "";
      const today = new Date().toISOString().split('T')[0];

      // Mapear serviceName para category/subcategory
      let foundCategory = "";
      let foundSubcategory = "";

      for (const cat of MAINTENANCE_CATEGORIES) {
        const subcategories = getSubcategoriesByCategory(cat.value);
        const matchingSubcat = subcategories.find(sub =>
          prefilledData.serviceName.toLowerCase().includes(sub.label.toLowerCase()) ||
          sub.label.toLowerCase().includes(prefilledData.serviceName.toLowerCase())
        );

        if (matchingSubcat) {
          foundCategory = cat.value;
          foundSubcategory = matchingSubcat.value;
          break;
        }
      }

      setFormData({
        vehicle_id: prefilledData.vehicleId,
        date: today,
        category: foundCategory,
        subcategory: foundSubcategory,
        km: formattedKm,
        cost: "",
        notes: "",
      });
    } else {
      setFormData({
        vehicle_id: "",
        date: "",
        category: "",
        subcategory: "",
        km: "",
        cost: "",
        notes: "",
      });
    }
    setAttachmentFile(null);
  }, [editingMaintenance, prefilledData, open, vehicles]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "category") {
        updated.subcategory = "";
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicle_id) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um veículo",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category || !formData.subcategory) {
      toast({
        title: "Erro",
        description: "Por favor, selecione a categoria e subcategoria do serviço",
        variant: "destructive",
      });
      return;
    }

    // Validar quilometragem: não pode ser menor que a última registrada
    const currentKm = parseInt(formData.km.replace(/\D/g, ''));
    if (!editingMaintenance) {
      try {
        const { data: lastMaintenance } = await supabase
          .from("maintenances")
          .select("km, date")
          .eq("vehicle_id", formData.vehicle_id)
          .order("date", { ascending: false })
          .limit(1)
          .single();

        if (lastMaintenance && currentKm < lastMaintenance.km) {
          toast({
            title: "Quilometragem inválida",
            description: `A quilometragem não pode ser menor que a última registrada (${lastMaintenance.km.toLocaleString()} km em ${new Date(lastMaintenance.date).toLocaleDateString('pt-BR')})`,
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        // Sem manutenções anteriores, pode continuar
        console.log("Nenhuma manutenção anterior encontrada");
      }
    }

    setSubmitting(true);
    try {
      const serviceType = getFullServiceLabel(formData.category, formData.subcategory);

      await onSubmit(
        {
          vehicle_id: formData.vehicle_id,
          date: formData.date,
          service_type: serviceType,
          km: parseInt(formData.km.replace(/\D/g, '')),
          cost: parseFloat(formData.cost),
          notes: formData.notes || null,
        },
        attachmentFile || undefined
      );

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar manutenção:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingMaintenance ? "Editar manutenção" : "Registrar nova manutenção"}
          </DialogTitle>
          <DialogDescription>
            {editingMaintenance
              ? "Atualize os detalhes da manutenção."
              : "Adicione os detalhes da manutenção realizada no seu veículo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle">Veículo</Label>
            <Select value={formData.vehicle_id} onValueChange={(value) => handleInputChange("vehicle_id", value)} required>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione o veículo" />
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
          <div className="space-y-2">
            <Label htmlFor="date">Data da manutenção</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria do serviço</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
              required
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg">
                {MAINTENANCE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formData.category && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Tipo de serviço</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => handleInputChange("subcategory", value)}
                required
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg">
                  {getSubcategoriesByCategory(formData.category).map((subcategory) => (
                    <SelectItem key={subcategory.value} value={subcategory.value}>
                      {subcategory.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="km">Quilometragem</Label>
            <Input
              id="km"
              type="text"
              placeholder="Ex: 45.000"
              value={formData.km}
              onChange={(e) => {
                // Remove tudo que não é número
                const numbers = e.target.value.replace(/\D/g, '');
                // Limita a 999999 (999.999 km)
                const limited = numbers.slice(0, 6);
                // Formata com pontos de milhar
                const formatted = limited.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                handleInputChange("km", formatted);
              }}
              maxLength={7}
              required
            />
            <p className="text-xs text-muted-foreground">
              Sugestão: arredonde para múltiplos de 1.000
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Custo (R$)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="Ex: 280.00"
              value={formData.cost}
              onChange={(e) => handleInputChange("cost", e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              placeholder="Notas adicionais..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment">Comprovante (opcional)</Label>
            <div className="relative">
              <Input
                id="attachment"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast({
                        title: "Arquivo muito grande",
                        description: "O arquivo deve ter no máximo 5MB",
                        variant: "destructive",
                      });
                      e.target.value = "";
                      return;
                    }
                    setAttachmentFile(file);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="attachment"
                className="flex items-center justify-center gap-2 w-full h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors duration-200 text-sm font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              >
                {attachmentFile ? (
                  <>
                    <FileCheck className="h-4 w-4 text-success" />
                    <span className="text-success">{attachmentFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Escolher arquivo</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: JPG, PNG, WEBP, PDF (máx. 5MB)
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingMaintenance ? "Atualizar" : "Salvar"} manutenção
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
