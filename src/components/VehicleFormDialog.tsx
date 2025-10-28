import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fipeApi, FipeBrand, FipeModel, FipeYear } from "@/services/fipeApi";
import { useVehicles, Vehicle } from "@/hooks/useVehicles";
import { Loader2 } from "lucide-react";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
}

export const VehicleFormDialog = ({ open, onOpenChange, vehicle }: VehicleFormDialogProps) => {
  const { addVehicle, updateVehicle } = useVehicles();
  const [loading, setLoading] = useState(false);
  const [loadingFipe, setLoadingFipe] = useState(false);

  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [models, setModels] = useState<FipeModel[]>([]);
  const [years, setYears] = useState<FipeYear[]>([]);

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [plate, setPlate] = useState("");
  const [currentKm, setCurrentKm] = useState("");

  useEffect(() => {
    if (open && !vehicle) {
      loadBrands();
    }
    if (vehicle) {
      setSelectedBrand(vehicle.brand);
      setPlate(vehicle.plate);
      setCurrentKm(vehicle.current_km.toString());
    }
  }, [open, vehicle]);

  const loadBrands = async () => {
    setLoadingFipe(true);
    try {
      const data = await fipeApi.getBrands();
      setBrands(data);
    } catch (error) {
      console.error("Erro ao carregar marcas:", error);
    } finally {
      setLoadingFipe(false);
    }
  };

  const loadModels = async (brandCode: string) => {
    setLoadingFipe(true);
    try {
      const data = await fipeApi.getModels(brandCode);
      setModels(data.modelos);
      setYears([]);
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
    } finally {
      setLoadingFipe(false);
    }
  };

  const loadYears = async (brandCode: string, modelCode: string) => {
    setLoadingFipe(true);
    try {
      const data = await fipeApi.getYears(brandCode, parseInt(modelCode));
      setYears(data);
    } catch (error) {
      console.error("Erro ao carregar anos:", error);
    } finally {
      setLoadingFipe(false);
    }
  };

  const handleBrandChange = (brandCode: string) => {
    setSelectedBrand(brandCode);
    setSelectedModel("");
    setSelectedYear("");
    setModels([]);
    setYears([]);
    loadModels(brandCode);
  };

  const handleModelChange = (modelCode: string) => {
    setSelectedModel(modelCode);
    setSelectedYear("");
    setYears([]);
    loadYears(selectedBrand, modelCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const brandName = brands.find((b) => b.codigo === selectedBrand)?.nome || "";
      const modelName = models.find((m) => m.codigo.toString() === selectedModel)?.nome || "";
      const yearValue = years.find((y) => y.codigo === selectedYear)?.nome || "";
      const yearNumber = parseInt(yearValue.split("-")[0]);

      const vehicleData = {
        brand: brandName,
        model: modelName,
        version: null,
        year: yearNumber,
        plate: plate.toUpperCase(),
        current_km: parseInt(currentKm),
        status: "up-to-date" as const,
      };

      if (vehicle) {
        await updateVehicle(vehicle.id, vehicleData);
      } else {
        await addVehicle(vehicleData);
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
    setPlate("");
    setCurrentKm("");
    setModels([]);
    setYears([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Editar veículo" : "Adicionar novo veículo"}</DialogTitle>
          <DialogDescription>
            {vehicle ? "Atualize as informações do seu veículo." : "Cadastre um novo veículo para começar a registrar seu histórico de manutenções."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Select value={selectedBrand} onValueChange={handleBrandChange} disabled={loadingFipe || !!vehicle}>
              <SelectTrigger>
                <SelectValue placeholder={loadingFipe ? "Carregando..." : "Selecione a marca"} />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.codigo} value={brand.codigo}>
                    {brand.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedBrand || loadingFipe || !!vehicle}>
              <SelectTrigger>
                <SelectValue placeholder={loadingFipe ? "Carregando..." : "Selecione o modelo"} />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.codigo} value={model.codigo.toString()}>
                    {model.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!selectedModel || loadingFipe || !!vehicle}>
              <SelectTrigger>
                <SelectValue placeholder={loadingFipe ? "Carregando..." : "Selecione o ano"} />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.codigo} value={year.codigo}>
                    {year.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plate">Placa</Label>
            <Input
              id="plate"
              placeholder="ABC-1234"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="km">Quilometragem atual</Label>
            <Input
              id="km"
              type="number"
              placeholder="45000"
              value={currentKm}
              onChange={(e) => setCurrentKm(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {vehicle ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
