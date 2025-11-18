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
      // Formata o KM com pontos de milhar
      const formattedKm = vehicle.current_km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      setCurrentKm(formattedKm);
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
      // Se estiver editando, use os valores já salvos
      const brandName = vehicle ? vehicle.brand : (brands.find((b) => b.codigo === selectedBrand)?.nome || "");
      const modelName = vehicle ? vehicle.model : (models.find((m) => m.codigo.toString() === selectedModel)?.nome || "");
      const yearNumber = vehicle ? vehicle.year : parseInt(years.find((y) => y.codigo === selectedYear)?.nome.split("-")[0] || "0");

      const vehicleData = {
        brand: brandName,
        model: modelName,
        version: null,
        year: yearNumber,
        plate: plate.toUpperCase(),
        current_km: parseInt(currentKm.replace(/\D/g, '')),
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
              placeholder="ABC-1234 ou ABC1D34"
              value={plate}
              onChange={(e) => {
                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

                // Aplicar máscara baseado no formato
                if (value.length <= 7) {
                  // Formato antigo: ABC-1234
                  if (value.length > 3) {
                    value = value.slice(0, 3) + '-' + value.slice(3, 7);
                  }
                } else {
                  // Formato Mercosul: ABC1D34
                  value = value.slice(0, 7);
                }

                setPlate(value);
              }}
              maxLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: ABC-1234 (antigo) ou ABC1D34 (Mercosul)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="km">Quilometragem atual</Label>
            <Input
              id="km"
              type="text"
              placeholder="45.000"
              value={currentKm}
              onChange={(e) => {
                // Remove tudo que não é número
                const numbers = e.target.value.replace(/\D/g, '');

                // Limita a 999999 (999.999 km)
                const limited = numbers.slice(0, 6);

                // Formata com pontos de milhar
                const formatted = limited.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

                setCurrentKm(formatted);
              }}
              maxLength={7}
              required
            />
            <p className="text-xs text-muted-foreground">
              Sugestão: arredonde para múltiplos de 1.000 (ex: 45.000)
            </p>
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
