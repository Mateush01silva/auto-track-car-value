import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Search,
  Car,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Gauge,
  Wrench as WrenchIcon
} from "lucide-react";

interface Workshop {
  id: string;
  name: string;
  monthly_vehicle_limit: number;
  current_month_vehicles: number;
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  user_id: string | null;
}

interface Maintenance {
  id: string;
  date: string;
  service_type: string;
  cost: number;
  created_by_workshop_id: string | null;
}

interface FipeBrand {
  codigo: string;
  nome: string;
}

interface FipeModel {
  codigo: number;
  nome: string;
}

interface FipeYear {
  codigo: string;
  nome: string;
}

const NewService = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Workshop state
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);

  // Search state
  const [plate, setPlate] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);

  // Vehicle found state
  const [vehicleFound, setVehicleFound] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<Maintenance[]>([]);

  // Manual registration state
  const [showManualForm, setShowManualForm] = useState(false);
  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [models, setModels] = useState<FipeModel[]>([]);
  const [years, setYears] = useState<FipeYear[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [color, setColor] = useState("");
  const [km, setKm] = useState("");

  // Fetch workshop data
  useEffect(() => {
    const fetchWorkshop = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('workshops')
        .select('id, name, monthly_vehicle_limit, current_month_vehicles')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching workshop:', error);
        navigate('/workshop/dashboard');
        return;
      }

      setWorkshop(data);
      setLoading(false);
    };

    fetchWorkshop();
  }, [user, navigate]);

  // Format plate as user types
  const handlePlateChange = (value: string) => {
    // Remove non-alphanumeric characters
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Limit to 7 characters
    cleaned = cleaned.slice(0, 7);

    // Add hyphen after 3 characters
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
    }

    setPlate(cleaned);
    setSearchComplete(false);
    setVehicleFound(null);
    setShowManualForm(false);
  };

  // Validate Brazilian plate format
  const isValidPlate = (plate: string) => {
    // Old format: ABC-1234
    // New format (Mercosul): ABC-1D23
    const regex = /^[A-Z]{3}-[0-9][A-Z0-9][0-9]{2}$/;
    return regex.test(plate);
  };

  // Search for vehicle
  const handleSearch = async () => {
    if (!isValidPlate(plate)) {
      toast({
        title: "Placa invalida",
        description: "Digite uma placa no formato ABC-1234",
        variant: "destructive",
      });
      return;
    }

    // Check monthly limit
    if (workshop && workshop.current_month_vehicles >= workshop.monthly_vehicle_limit) {
      toast({
        title: "Limite mensal atingido",
        description: `Voce atingiu o limite de ${workshop.monthly_vehicle_limit} veiculos este mes. Faca upgrade do seu plano.`,
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setVehicleFound(null);
    setShowManualForm(false);

    try {
      // Search for vehicle by plate
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('plate', plate.replace('-', '').toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (vehicle) {
        setVehicleFound(vehicle);

        // Fetch maintenance history
        const { data: maintenances } = await supabase
          .from('maintenances')
          .select('id, date, service_type, cost, created_by_workshop_id')
          .eq('vehicle_id', vehicle.id)
          .order('date', { ascending: false })
          .limit(3);

        setVehicleHistory(maintenances || []);
      } else {
        // Vehicle not found, show manual form
        setShowManualForm(true);
        loadBrands();
      }

      setSearchComplete(true);
    } catch (error) {
      console.error('Error searching vehicle:', error);
      toast({
        title: "Erro na busca",
        description: "Ocorreu um erro ao buscar o veiculo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // Load FIPE brands
  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const response = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error loading brands:', error);
      toast({
        title: "Erro ao carregar marcas",
        description: "Nao foi possivel carregar as marcas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingBrands(false);
    }
  };

  // Load FIPE models when brand changes
  const handleBrandChange = async (brandCode: string) => {
    setSelectedBrand(brandCode);
    setSelectedModel("");
    setSelectedYear("");
    setModels([]);
    setYears([]);

    if (!brandCode) return;

    setLoadingModels(true);
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos`);
      const data = await response.json();
      setModels(data.modelos || []);
    } catch (error) {
      console.error('Error loading models:', error);
      toast({
        title: "Erro ao carregar modelos",
        description: "Nao foi possivel carregar os modelos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingModels(false);
    }
  };

  // Load FIPE years when model changes
  const handleModelChange = async (modelCode: string) => {
    setSelectedModel(modelCode);
    setSelectedYear("");
    setYears([]);

    if (!modelCode) return;

    setLoadingYears(true);
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${selectedBrand}/modelos/${modelCode}/anos`);
      const data = await response.json();
      setYears(data);
    } catch (error) {
      console.error('Error loading years:', error);
      toast({
        title: "Erro ao carregar anos",
        description: "Nao foi possivel carregar os anos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingYears(false);
    }
  };

  // Continue with found vehicle
  const handleContinueWithVehicle = () => {
    if (!vehicleFound) return;

    // Store vehicle data and navigate to next step
    localStorage.setItem('workshop_new_service_vehicle', JSON.stringify({
      id: vehicleFound.id,
      plate: vehicleFound.plate,
      brand: vehicleFound.brand,
      model: vehicleFound.model,
      year: vehicleFound.year,
      color: vehicleFound.color,
      isNew: false,
    }));

    navigate('/workshop/new-service/client');
  };

  // Continue with new vehicle
  const handleContinueWithNewVehicle = () => {
    if (!selectedBrand || !selectedModel || !selectedYear) {
      toast({
        title: "Campos obrigatorios",
        description: "Selecione marca, modelo e ano do veiculo.",
        variant: "destructive",
      });
      return;
    }

    const brandName = brands.find(b => b.codigo === selectedBrand)?.nome || '';
    const modelName = models.find(m => m.codigo.toString() === selectedModel)?.nome || '';
    const yearValue = years.find(y => y.codigo === selectedYear)?.nome || '';

    // Store vehicle data and navigate to next step
    localStorage.setItem('workshop_new_service_vehicle', JSON.stringify({
      plate: plate.replace('-', '').toUpperCase(),
      brand: brandName,
      model: modelName,
      year: parseInt(yearValue) || new Date().getFullYear(),
      color: color || null,
      km: km ? parseInt(km) : null,
      isNew: true,
    }));

    navigate('/workshop/new-service/client');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workshop/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold">Novo Atendimento</h1>
              <p className="text-sm text-gray-500">Etapa 1 de 3 - Identificar Veiculo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div className="w-16 h-1 bg-gray-200 mx-2" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div className="w-16 h-1 bg-gray-200 mx-2" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              3
            </div>
          </div>
        </div>

        {/* Plate Search Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Veiculo por Placa
            </CardTitle>
            <CardDescription>
              Digite a placa do veiculo para verificar se ja esta cadastrado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="ABC-1234"
                  value={plate}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  className="text-2xl text-center font-mono tracking-wider h-14"
                  maxLength={8}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!plate || searching}
                className="bg-green-600 hover:bg-green-700 h-14 px-6"
              >
                {searching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Found */}
        {vehicleFound && (
          <Card className="mb-6 border-green-200 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Veiculo Encontrado
                </CardTitle>
                {vehicleFound.user_id && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Cliente WiseDrive
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Vehicle Info */}
                <div className="flex items-center gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <Car className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono">{plate}</p>
                    <p className="text-lg">{vehicleFound.brand} {vehicleFound.model}</p>
                    <p className="text-gray-500">{vehicleFound.year} {vehicleFound.color && `- ${vehicleFound.color}`}</p>
                  </div>
                </div>

                {/* Maintenance History */}
                {vehicleHistory.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-500 mb-3">Ultimas manutencoes</p>
                    <div className="space-y-2">
                      {vehicleHistory.map((maintenance) => (
                        <div key={maintenance.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{maintenance.service_type}</p>
                              <p className="text-xs text-gray-500">{formatDate(maintenance.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(maintenance.cost)}</p>
                            <p className="text-xs text-gray-500">
                              {maintenance.created_by_workshop_id ? 'Oficina' : 'Usuario'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleContinueWithVehicle}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <WrenchIcon className="h-5 w-5 mr-2" />
                  Registrar Nova Manutencao
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Registration Form */}
        {showManualForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Veiculo Nao Encontrado
              </CardTitle>
              <CardDescription>
                Cadastre o veiculo manualmente usando a tabela FIPE
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Brand Select */}
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Select value={selectedBrand} onValueChange={handleBrandChange} disabled={loadingBrands}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBrands ? "Carregando..." : "Selecione a marca"} />
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

              {/* Model Select */}
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Select
                  value={selectedModel}
                  onValueChange={handleModelChange}
                  disabled={!selectedBrand || loadingModels}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingModels ? "Carregando..." : "Selecione o modelo"} />
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

              {/* Year Select */}
              <div className="space-y-2">
                <Label>Ano *</Label>
                <Select
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                  disabled={!selectedModel || loadingYears}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingYears ? "Carregando..." : "Selecione o ano"} />
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

              {/* Color */}
              <div className="space-y-2">
                <Label>Cor (opcional)</Label>
                <Input
                  placeholder="Ex: Prata, Preto, Branco"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>

              {/* KM */}
              <div className="space-y-2">
                <Label>Quilometragem Atual</Label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Ex: 45000"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                onClick={handleContinueWithNewVehicle}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={!selectedBrand || !selectedModel || !selectedYear}
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default NewService;
