import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { 
  Car, 
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  QrCode
} from "lucide-react";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  current_km: number;
}

interface Maintenance {
  id: string;
  date: string;
  service_type: string;
  cost: number;
  km: number;
}

const Report = () => {
  const { vehicleId } = useParams<{ vehicleId?: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (vehicleId) {
        // Load specific vehicle
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", vehicleId)
          .single();

        if (vehicleError) throw vehicleError;
        setVehicle(vehicleData);

        // Load maintenances for this vehicle
        const { data: maintenancesData, error: maintenancesError } = await supabase
          .from("maintenances")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("date", { ascending: false });

        if (maintenancesError) throw maintenancesError;
        setMaintenances(maintenancesData || []);
      } else {
        // Load first vehicle from user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: vehiclesData, error: vehiclesError } = await supabase
            .from("vehicles")
            .select("*")
            .eq("user_id", user.id)
            .limit(1)
            .single();

          if (vehiclesError) throw vehiclesError;
          setVehicle(vehiclesData);

          // Load maintenances for this vehicle
          const { data: maintenancesData, error: maintenancesError } = await supabase
            .from("maintenances")
            .select("*")
            .eq("vehicle_id", vehiclesData.id)
            .order("date", { ascending: false });

          if (maintenancesError) throw maintenancesError;
          setMaintenances(maintenancesData || []);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Veículo não encontrado</h3>
          <Link to="/dashboard">
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const totalCost = maintenances.reduce((sum, m) => sum + parseFloat(m.cost.toString()), 0);
  const averageCost = maintenances.length > 0 ? (totalCost / maintenances.length).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-primary rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">WiseDrive</span>
          </Link>
          
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Info Banner */}
        <div className="mb-8 p-4 bg-success/10 border border-success/20 rounded-lg animate-fade-in">
          <p className="text-sm text-center">
            <strong className="text-success">📱 Este é um exemplo de histórico gerado pelo WiseDrive</strong>
            <br />
            <span className="text-muted-foreground text-xs">
              Este relatório pode ser compartilhado via link ou QR Code com potenciais compradores
            </span>
          </p>
        </div>

        {/* Main Report Card */}
        <Card className="shadow-2xl mb-8 animate-scale-in">
          <CardHeader className="border-b bg-gradient-to-r from-primary to-primary-hover text-primary-foreground">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">
                  Histórico de Manutenção
                </CardTitle>
                <p className="text-primary-foreground/80">
                  {vehicle.brand} {vehicle.model} • {vehicle.year}
                </p>
                <p className="text-sm text-primary-foreground/70 mt-1">
                  Placa: {vehicle.plate} | KM atual: {vehicle.current_km.toLocaleString()}
                </p>
              </div>
              <Badge className="bg-success text-success-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-surface rounded-lg p-4 text-center">
                <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{maintenances.length}</p>
                <p className="text-sm text-muted-foreground">Manutenções</p>
              </div>
              <div className="bg-surface rounded-lg p-4 text-center">
                <DollarSign className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-muted-foreground">Investimento Total</p>
              </div>
              <div className="bg-surface rounded-lg p-4 text-center">
                <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">R$ {averageCost}</p>
                <p className="text-sm text-muted-foreground">Custo Médio</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-1 mb-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded" />
                Linha do Tempo
              </h3>
              
              <div className="space-y-4">
                {maintenances.map((maintenance, index) => (
                  <div 
                    key={maintenance.id}
                    className="relative pl-8 pb-4 border-l-2 border-primary/30 last:border-transparent"
                  >
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                    <div className="bg-surface rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{maintenance.service_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(maintenance.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <p className="font-bold text-success">
                          R$ {parseFloat(maintenance.cost.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Quilometragem: {maintenance.km.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Chart (Simplified) */}
            {maintenances.length > 0 && (
              <div className="bg-gradient-to-br from-primary/5 to-success/5 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Evolução dos Custos</h3>
                <div className="h-56 flex items-end gap-3 justify-around px-2">
                  {maintenances.slice(0, 10).reverse().map((m, i) => {
                    const maxCost = Math.max(...maintenances.map(x => parseFloat(x.cost.toString())));
                    const minCost = Math.min(...maintenances.map(x => parseFloat(x.cost.toString())));
                    const costValue = parseFloat(m.cost.toString());

                    // Usar escala logarítmica para amplificar diferenças visuais
                    // Mapeia valores entre minCost e maxCost para altura entre 25% e 100%
                    let height;
                    if (maxCost === minCost) {
                      // Todos os valores iguais
                      height = 100;
                    } else {
                      // Normalizar entre 0 e 1
                      const normalized = (costValue - minCost) / (maxCost - minCost);
                      // Escalar para 25% a 100% com curva não-linear para amplificar diferenças
                      height = 25 + (Math.pow(normalized, 0.7) * 75);
                    }

                    const proportionalHeight = (costValue / maxCost) * 100;

                    return (
                      <div key={m.id} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:scale-110 hover:shadow-xl cursor-pointer border-2 border-green-700"
                          style={{ height: `${height}%`, minWidth: '20px' }}
                          title={`R$ ${costValue.toFixed(2)} - ${proportionalHeight.toFixed(0)}% do máximo`}
                        />
                        <p className="text-xs text-muted-foreground text-center font-medium">
                          {new Date(m.date).toLocaleDateString('pt-BR', { month: 'short' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card className="shadow-lg animate-fade-in">
          <CardContent className="p-8 text-center">
            <div className="inline-block bg-card border-4 border-primary/20 p-6 rounded-2xl mb-4">
              <QrCode className="h-32 w-32 text-primary mx-auto" />
            </div>
            <h3 className="font-semibold text-xl mb-2">Compartilhe este histórico</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Escaneie o QR Code acima ou use o link abaixo para acessar este relatório
            </p>
            <div className="bg-surface rounded-lg p-3 font-mono text-xs text-muted-foreground break-all">
              {window.location.origin}/report/{vehicle.id}
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Relatório gerado em {new Date().toLocaleDateString('pt-BR')} • Powered by{" "}
            <span className="font-semibold text-primary">WiseDrive</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Report;
