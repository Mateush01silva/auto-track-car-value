import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fipeApi, FipeBrand, FipeModel, FipeYear } from "@/services/fipeApi";
import { useVehicles, Vehicle } from "@/hooks/useVehicles";
import { useVehicleMode, usePlateSearch, usePlateValidation } from "@/hooks/useFeatureFlags";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { searchVehicleComplete, type CompleteVehicleResponse } from "@/services/plateApi";
import { supabase } from "@/integrations/supabase/client";

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
  const vehicleMode = useVehicleMode();
  const plateSearch = usePlateSearch();
  const plateValidation = usePlateValidation();

  const [loading, setLoading] = useState(false);
  const [loadingFipe, setLoadingFipe] = useState(false);

  // Estados do modo Fipe
  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [models, setModels] = useState<FipeModel[]>([]);
  const [years, setYears] = useState<FipeYear[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Estados compartilhados
  const [plate, setPlate] = useState("");
  const [currentKm, setCurrentKm] = useState("");

  // Estados do modo Plate API
  const [plateSearchInput, setPlateSearchInput] = useState("");
  const [plateSearching, setPlateSearching] = useState(false);
  const [vehicleData, setVehicleData] = useState<{
    brand: string;
    model: string;
    year: number;
    yearFab?: number;
    version?: string;
    versionId?: number;
    yearModel?: number;
  } | null>(null);
  const [vehicleRevisions, setVehicleRevisions] = useState<any[]>([]);

  useEffect(() => {
    if (open && !vehicle) {
      // Modo Fipe: carrega marcas
      if (vehicleMode.isFipeMode) {
        loadBrands();
      }
      // Modo Plate: limpa estado
      if (vehicleMode.isPlateMode) {
        setPlateSearchInput("");
        setVehicleData(null);
      }
    }
    if (vehicle) {
      setSelectedBrand(vehicle.brand);
      setPlate(vehicle.plate);
      setPlateSearchInput(vehicle.plate);
      // Formata o KM com pontos de milhar
      const formattedKm = vehicle.current_km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      setCurrentKm(formattedKm);

      // Se estiver editando no modo Plate, preenche os dados do veículo
      if (vehicleMode.isPlateMode) {
        setVehicleData({
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          version: vehicle.version || undefined,
        });
      }
    }
  }, [open, vehicle, vehicleMode.isFipeMode, vehicleMode.isPlateMode]);

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

  const handlePlateSearch = async () => {
    if (!plateSearchInput || !plateValidation.isValid(plateSearchInput)) {
      return;
    }

    setPlateSearching(true);
    try {
      console.log('[VEHICLE_FORM] Buscando veículo + revisões para placa:', plateSearchInput);

      // ⭐ NOVA IMPLEMENTAÇÃO: busca veículo + revisões em UMA sessão (R$ 1,10)
      const result: CompleteVehicleResponse = await searchVehicleComplete(plateSearchInput);

      // Se encontrou o veículo, preenche os dados
      if (result.vehicle) {
        // Garante que a placa sempre seja preenchida (API retorna ou usa input)
        const finalPlate = result.vehicle.plate || plateSearchInput;

        console.log('[VEHICLE_FORM] ✅ Veículo encontrado:', result.vehicle);
        console.log('[VEHICLE_FORM] 📋 Revisões encontradas:', result.revisions.length);

        setVehicleData({
          brand: result.vehicle.brand,
          model: result.vehicle.model,
          year: result.vehicle.year,
          yearFab: result.vehicle.yearFab,
          version: result.vehicle.version,
          versionId: result.vehicle.versionId,
          yearModel: result.vehicle.yearModel,
        });
        setVehicleRevisions(result.revisions);
        setPlate(finalPlate);

        console.log('[DEBUG] Dados preenchidos:', {
          vehicleData: 'SET',
          plate: finalPlate,
          revisions: result.revisions.length,
          canSubmitNow: 'precisa preencher KM'
        });
      }
    } catch (error) {
      console.error('[VEHICLE_FORM] ❌ Erro ao buscar veículo:', error);
    } finally {
      setPlateSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let brandName = "";
      let modelName = "";
      let yearNumber = 0;
      let version: string | null = null;

      let yearFab: number | null = null;

      // Modo Plate: usa dados da busca
      if (vehicleMode.isPlateMode) {
        if (!vehicleData) {
          throw new Error("Busque o veículo pela placa antes de salvar");
        }
        brandName = vehicleData.brand;
        modelName = vehicleData.model;
        yearNumber = vehicleData.year;
        yearFab = vehicleData.yearFab || null;
        version = vehicleData.version || null;
      }
      // Modo Fipe: usa seleções dos dropdowns
      else {
        // Se estiver editando, use os valores já salvos
        brandName = vehicle ? vehicle.brand : (brands.find((b) => b.codigo === selectedBrand)?.nome || "");
        modelName = vehicle ? vehicle.model : (models.find((m) => m.codigo.toString() === selectedModel)?.nome || "");
        yearNumber = vehicle ? vehicle.year : parseInt(years.find((y) => y.codigo === selectedYear)?.nome.split("-")[0] || "0");
      }

      const kmValue = parseInt(currentKm.replace(/\D/g, ''));

      const vehicleDataToSave = {
        brand: brandName,
        model: modelName,
        version,
        year: yearNumber,
        year_fab: yearFab,
        plate: plate.toUpperCase(),
        initial_km: vehicle ? vehicle.initial_km : kmValue, // Mantém initial_km em edição
        current_km: kmValue,
        status: "up-to-date" as const,
      };

      let vehicleId: string;

      if (vehicle) {
        await updateVehicle(vehicle.id, vehicleDataToSave);
        vehicleId = vehicle.id;
      } else {
        const newVehicle = await addVehicle(vehicleDataToSave);
        vehicleId = newVehicle.id;
      }

      // ⭐ SALVAR REVISÕES se foram buscadas junto com a placa
      if (vehicleRevisions.length > 0 && vehicleId) {
        console.log('[VEHICLE_FORM] Salvando', vehicleRevisions.length, 'revisões para o veículo', vehicleId);

        try {
          const { error: revisionsError } = await supabase
            .from('manufacturer_revisions')
            .upsert(
              vehicleRevisions.map(revision => ({
                vehicle_id: vehicleId,
                km: revision.km,
                months: revision.months,
                service_type: revision.service_type,
                description: revision.description || null,
                items: revision.items || null,
              })),
              { onConflict: 'vehicle_id,km,months' }
            );

          if (revisionsError) {
            console.error('[VEHICLE_FORM] ❌ Erro ao salvar revisões:', revisionsError);
          } else {
            console.log('[VEHICLE_FORM] ✅ Revisões salvas com sucesso');
          }
        } catch (revError) {
          console.error('[VEHICLE_FORM] ❌ Exceção ao salvar revisões:', revError);
        }
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
    setPlateSearchInput("");
    setVehicleData(null);
    setVehicleRevisions([]);
    setPlateSearching(false);
  };

  // Determina se o formulário pode ser submetido
  const canSubmit = () => {
    if (vehicle) {
      // Se estiver editando, só precisa de placa e KM
      return plate && currentKm;
    }

    if (vehicleMode.isPlateMode) {
      // Modo Plate: precisa ter buscado o veículo
      const result = !!(vehicleData && plate && currentKm);
      console.log('[DEBUG] canSubmit:', { vehicleData: !!vehicleData, plate: !!plate, currentKm: !!currentKm, result });
      return result;
    }

    // Modo Fipe: precisa de todos os selects
    return selectedBrand && selectedModel && selectedYear && plate && currentKm;
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

        {/* Indicador de modo (apenas em desenvolvimento) */}
        {import.meta.env.DEV && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Modo atual:</strong> {vehicleMode.info.description}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* MODO PLATE API - Busca por placa */}
          {vehicleMode.isPlateMode && !vehicle && (
            <div className="space-y-4 pb-4 border-b">
              <div className="space-y-2">
                <Label htmlFor="plate-search">Buscar veículo pela placa</Label>
                <div className="flex gap-2">
                  <Input
                    id="plate-search"
                    placeholder="ABC-1234 ou ABC1D34"
                    value={plateSearchInput}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      if (value.length > 3) {
                        value = value.slice(0, 3) + '-' + value.slice(3, 7);
                      }
                      setPlateSearchInput(value);
                    }}
                    maxLength={8}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handlePlateSearch}
                    disabled={!plateSearchInput || !plateValidation.isValid(plateSearchInput) || plateSearching}
                  >
                    {plateSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {vehicleData && (
                  <Alert className="bg-primary/5 border-primary/20">
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">VEÍCULO ENCONTRADO</div>
                        <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                          <span className="font-medium text-muted-foreground">Marca:</span>
                          <span className="font-semibold">{vehicleData.brand}</span>

                          <span className="font-medium text-muted-foreground">Modelo:</span>
                          <span className="font-semibold">{vehicleData.model}</span>

                          {vehicleData.version && (
                            <>
                              <span className="font-medium text-muted-foreground">Versão:</span>
                              <span className="font-semibold">{vehicleData.version}</span>
                            </>
                          )}

                          <span className="font-medium text-muted-foreground">Ano:</span>
                          <span className="font-semibold">
                            {vehicleData.yearFab && vehicleData.yearFab !== vehicleData.year
                              ? `${vehicleData.yearFab}/${vehicleData.year}`
                              : vehicleData.year}
                          </span>
                        </div>
                        {vehicleRevisions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-primary/20">
                            <span className="text-xs font-semibold text-primary">✅ {vehicleRevisions.length} planos de revisão encontrados</span>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* MODO FIPE - Seleção manual */}
          {vehicleMode.isFipeMode && !vehicle && (
            <>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select value={selectedBrand} onValueChange={handleBrandChange} disabled={loadingFipe}>
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
                <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedBrand || loadingFipe}>
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
                <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!selectedModel || loadingFipe}>
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
            </>
          )}

          {/* Campos compartilhados entre os modos */}
          {(vehicleMode.isFipeMode || vehicleData || vehicle) && (
            <>
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
                  disabled={vehicleMode.isPlateMode && !vehicle}
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
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={loading || !canSubmit()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {vehicle ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
