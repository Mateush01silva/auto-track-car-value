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

// Marcas mais populares no Brasil (serão exibidas primeiro)
const POPULAR_BRANDS = [
  'Volkswagen', 'Chevrolet', 'Fiat', 'Ford', 'Toyota',
  'Hyundai', 'Honda', 'Renault', 'Nissan', 'Jeep'
];

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
      // Tentar carregar do cache primeiro
      const cached = sessionStorage.getItem('fipe_brands');
      if (cached) {
        const sortedBrands = sortBrandsByPopularity(JSON.parse(cached));
        setBrands(sortedBrands);
        setLoadingFipe(false);
        return;
      }

      // Se não estiver no cache, buscar da API
      const data = await fipeApi.getBrands();
      const sortedBrands = sortBrandsByPopularity(data);
      setBrands(sortedBrands);

      // Salvar no cache (já ordenado)
      sessionStorage.setItem('fipe_brands', JSON.stringify(sortedBrands));
    } catch (error) {
      console.error("Erro ao carregar marcas:", error);
    } finally {
      setLoadingFipe(false);
    }
  };

  const sortBrandsByPopularity = (brandsData: FipeBrand[]) => {
    return [...brandsData].sort((a, b) => {
      const aIsPopular = POPULAR_BRANDS.includes(a.nome);
      const bIsPopular = POPULAR_BRANDS.includes(b.nome);

      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;

      // Se ambos são populares, ordenar pela ordem da lista POPULAR_BRANDS
      if (aIsPopular && bIsPopular) {
        return POPULAR_BRANDS.indexOf(a.nome) - POPULAR_BRANDS.indexOf(b.nome);
      }

      // Se nenhum é popular, manter ordem alfabética
      return a.nome.localeCompare(b.nome);
    });
  };

  const loadModels = async (brandCode: string) => {
    setLoadingFipe(true);
    try {
      // Tentar carregar do cache primeiro
      const cacheKey = `fipe_models_${brandCode}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setModels(JSON.parse(cached));
        setYears([]);
        setLoadingFipe(false);
        return;
      }

      // Se não estiver no cache, buscar da API
      const data = await fipeApi.getModels(brandCode);
      setModels(data.modelos);
      setYears([]);

      // Salvar no cache
      sessionStorage.setItem(cacheKey, JSON.stringify(data.modelos));
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
    } finally {
      setLoadingFipe(false);
    }
  };

  const loadYears = async (brandCode: string, modelCode: string) => {
    setLoadingFipe(true);
    try {
      // Tentar carregar do cache primeiro
      const cacheKey = `fipe_years_${brandCode}_${modelCode}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setYears(JSON.parse(cached));
        setLoadingFipe(false);
        return;
      }

      // Se não estiver no cache, buscar da API
      const data = await fipeApi.getYears(brandCode, parseInt(modelCode));
      setYears(data);

      // Salvar no cache
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
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

      const kmValue = parseInt(currentKm.replace(/\D/g, ''));

      const vehicleData = {
        brand: brandName,
        model: modelName,
        version: null,
        year: yearNumber,
        plate: plate.toUpperCase(),
        initial_km: vehicle ? vehicle.initial_km : kmValue, // Mantém initial_km em edição
        current_km: kmValue,
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
              <SelectTrigger className="bg-background">
                {loadingFipe && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <SelectValue placeholder={loadingFipe ? "Carregando marcas..." : "Selecione a marca"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg">
                {brands.map((brand, index) => (
                  <SelectItem key={brand.codigo} value={brand.codigo} className={index < POPULAR_BRANDS.length ? "font-medium" : ""}>
                    {brand.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedBrand || loadingFipe || !!vehicle}>
              <SelectTrigger className="bg-background">
                {loadingFipe && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <SelectValue placeholder={loadingFipe ? "Carregando modelos..." : "Selecione o modelo"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg">
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
              <SelectTrigger className="bg-background">
                {loadingFipe && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <SelectValue placeholder={loadingFipe ? "Carregando anos..." : "Selecione o ano"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg">
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
