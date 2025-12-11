import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import {
  Car,
  Wrench,
  Calendar,
  Gauge,
  DollarSign,
  ChevronDown,
  CheckCircle,
  Gift,
  Download,
  User,
  Building2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { SeloVeiculo } from "@/components/SeloVeiculo";
import { calcularSeloVeiculo, buscarSeloVeiculo, VeiculoSelo } from "@/services/seloQualidade";
import { GaleriaComprovantes, Comprovante } from "@/components/GaleriaComprovantes";

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  current_mileage: number | null;
  current_km: number;
  initial_km?: number;
  user_id: string | null;
  mostrar_selo_publico?: boolean;
}

interface Maintenance {
  id: string;
  vehicle_id: string;
  user_id: string | null;
  service_type: string;
  date: string;
  km: number;
  cost: number;
  notes: string | null;
  attachments: string[] | null;
  created_by_workshop_id: string | null;
  workshop?: {
    name: string;
  } | null;
}

const PublicVehicleHistory = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [selo, setSelo] = useState<VeiculoSelo | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // First, find the maintenance with this token
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenances')
          .select('vehicle_id')
          .eq('public_token', token)
          .eq('is_public', true)
          .single();

        if (maintenanceError || !maintenanceData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Get vehicle data
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', maintenanceData.vehicle_id)
          .single();

        if (vehicleError || !vehicleData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setVehicle(vehicleData);

        // Get ALL maintenances for this vehicle
        const { data: allMaintenances, error: allMaintenancesError } = await supabase
          .from('maintenances')
          .select(`
            *,
            workshop:created_by_workshop_id (
              name
            )
          `)
          .eq('vehicle_id', vehicleData.id)
          .order('date', { ascending: false });

        if (allMaintenancesError) {
          console.error('Error fetching maintenances:', allMaintenancesError);
        }

        setMaintenances(allMaintenances || []);

        // Calcular selo se temos veículo e manutenções
        if (vehicleData && allMaintenances) {
          await calcularESalvarSelo(vehicleData, allMaintenances);
        }
      } catch (error) {
        console.error('Error:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const calcularESalvarSelo = async (vehicleData: Vehicle, maintenancesData: Maintenance[]) => {
    try {
      // Buscar selo existente
      const seloExistente = await buscarSeloVeiculo(vehicleData.id);

      if (seloExistente) {
        setSelo(seloExistente);
      } else {
        // Calcular novo selo
        const seloCalculado = calcularSeloVeiculo(vehicleData as any, maintenancesData as any);
        setSelo({
          ...seloCalculado,
          id: vehicleData.id,
          data_calculo: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Erro ao calcular selo:", error);
    }
  };

  // Toggle expanded state for maintenance item
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format date - using split to avoid timezone issues
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      day: day.toString().padStart(2, '0'),
      month: date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
      year: year,
      full: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    };
  };

  // Format mileage
  const formatKm = (km: number) => {
    return new Intl.NumberFormat('pt-BR').format(km);
  };

  // Calculate stats
  const calculateStats = () => {
    if (maintenances.length === 0) {
      return {
        total: 0,
        lastDate: null,
        totalCost: 0,
        avgKm: 0
      };
    }

    const totalCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
    const sortedByDate = [...maintenances].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastDate = sortedByDate[0]?.date;

    // Calculate average km between maintenances
    let avgKm = 0;
    if (maintenances.length > 1) {
      const sortedByKm = [...maintenances].sort((a, b) => a.km - b.km);
      const kmDiffs = [];
      for (let i = 1; i < sortedByKm.length; i++) {
        const diff = sortedByKm[i].km - sortedByKm[i - 1].km;
        if (diff > 0) kmDiffs.push(diff);
      }
      if (kmDiffs.length > 0) {
        avgKm = Math.round(kmDiffs.reduce((a, b) => a + b, 0) / kmDiffs.length);
      }
    }

    return {
      total: maintenances.length,
      lastDate,
      totalCost,
      avgKm
    };
  };

  const stats = calculateStats();

  // Format plate
  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Hero Skeleton */}
          <div className="text-center mb-8">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-12 w-32 mx-auto mb-2" />
            <Skeleton className="h-6 w-40 mx-auto" />
          </div>

          {/* Stats Skeleton */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Skeleton */}
          {[1, 2, 3].map(i => (
            <Card key={i} className="mb-4">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-16" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </main>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Link Inválido ou Expirado</h1>
          <p className="text-gray-600 mb-6">
            Este link não existe ou não está mais disponível.
          </p>
          <Button onClick={() => navigate('/')}>
            Ir para Página Inicial
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <header className="bg-white border-b print:hidden">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-xl font-bold text-green-600 hover:text-green-700">
            Vybo
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Car className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Histórico do Veículo</h1>
          <p className="text-4xl font-mono font-bold text-green-600 mb-2">
            {formatPlate(vehicle?.plate || '')}
          </p>
          <p className="text-lg text-gray-600">
            {vehicle?.brand} {vehicle?.model} {vehicle?.year}
          </p>
          {vehicle?.color && (
            <p className="text-sm text-gray-500">Cor: {vehicle.color}</p>
          )}
        </div>

        {/* Stats Card */}
        <Card className="mb-8 border-green-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Wrench className="h-5 w-5 text-green-600 mr-1" />
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                <p className="text-xs text-gray-500">Manutenções</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="h-5 w-5 text-blue-600 mr-1" />
                  <span className="text-sm font-medium">
                    {stats.lastDate ? formatDate(stats.lastDate).full : '-'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Última</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <DollarSign className="h-5 w-5 text-yellow-600 mr-1" />
                  <span className="text-lg font-bold">{formatCurrency(stats.totalCost)}</span>
                </div>
                <p className="text-xs text-gray-500">Total Investido</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Gauge className="h-5 w-5 text-purple-600 mr-1" />
                  <span className="text-lg font-bold">{stats.avgKm > 0 ? formatKm(stats.avgKm) : '-'}</span>
                </div>
                <p className="text-xs text-gray-500">Média km/manut.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selo de Qualidade */}
        {selo && vehicle?.mostrar_selo_publico !== false && (
          <div className="mb-8">
            <SeloVeiculo selo={selo} compact={false} />
          </div>
        )}

        {/* Timeline */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Manutenções
          </h2>

          {maintenances.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Nenhuma manutenção registrada ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {maintenances.map((maintenance) => {
                const date = formatDate(maintenance.date);
                const isExpanded = expandedItems.has(maintenance.id);
                const hasAttachments = maintenance.attachments && maintenance.attachments.length > 0;

                return (
                  <Card key={maintenance.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Date Column */}
                        <div className="bg-gray-100 p-4 flex flex-col items-center justify-center min-w-[80px] print:bg-gray-200">
                          <span className="text-2xl font-bold text-gray-900">{date.day}</span>
                          <span className="text-xs font-medium text-gray-600">{date.month}</span>
                          <span className="text-xs text-gray-500">{date.year}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4">
                          {/* Workshop/Source */}
                          <div className="flex items-center gap-2 mb-2">
                            {maintenance.created_by_workshop_id && maintenance.workshop ? (
                              <>
                                <Building2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                  {maintenance.workshop.name}
                                </span>
                              </>
                            ) : (
                              <>
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">
                                  Manutenção Própria
                                </span>
                              </>
                            )}
                          </div>

                          {/* Service Type */}
                          <h3 className="font-medium text-gray-900 mb-1">
                            {maintenance.service_type}
                          </h3>

                          {/* KM */}
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                            <Gauge className="h-3 w-3" />
                            <span>{formatKm(maintenance.km)} km</span>
                          </div>

                          {/* Cost */}
                          <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(maintenance.cost || 0)}</span>
                          </div>

                          {/* Notes Preview */}
                          {maintenance.notes && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {maintenance.notes}
                            </p>
                          )}

                          {/* Expandable Section */}
                          {(hasAttachments || (maintenance.notes && maintenance.notes.length > 100)) && (
                            <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(maintenance.id)}>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-gray-500 hover:text-gray-700 p-0 h-auto"
                                >
                                  <span className="text-xs">
                                    {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                                  </span>
                                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-3">
                                {/* Full Notes */}
                                {maintenance.notes && maintenance.notes.length > 100 && (
                                  <div className="bg-gray-50 rounded p-3 mb-3">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {maintenance.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Attachments - Galeria de Comprovantes */}
                                {hasAttachments && (
                                  <GaleriaComprovantes
                                    comprovantes={maintenance.attachments!.map((url) => {
                                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                      return {
                                        url,
                                        tipo: isImage ? "imagem" : "pdf",
                                      } as Comprovante;
                                    })}
                                  />
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <Card className="mb-8 border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 print:hidden">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Badge className="bg-yellow-500 text-white text-sm px-3 py-1">
                  <Gift className="h-4 w-4 mr-1" />
                  3 MESES GRÁTIS
                </Badge>
              </div>

              <h3 className="text-xl font-bold mb-4">
                {vehicle?.user_id
                  ? "É seu veículo? Entre no Vybo!"
                  : "Quer Gerenciar Seu Veículo?"}
              </h3>

              <div className="text-left max-w-xs mx-auto mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Alertas automáticos de manutenção</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Histórico vitalício em um só lugar</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Relatórios profissionais</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Valorização na revenda</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 mb-3"
                onClick={() => navigate(`/login?type=user&ref=share&token=${token}`)}
              >
                {vehicle?.user_id ? "Fazer Login" : "Criar Conta Grátis"}
              </Button>

              <p className="text-xs text-gray-500">
                Baixe o app e tenha tudo na palma da mão
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 pb-8 print:hidden">
          <p className="mb-2">Gerado por <strong>Vybo</strong></p>
          <div className="flex justify-center gap-4 mb-2">
            <Link to="/about" className="hover:text-gray-700">Sobre</Link>
            <Link to="/terms" className="hover:text-gray-700">Termos</Link>
            <Link to="/privacy" className="hover:text-gray-700">Privacidade</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Vybo - Transparência que valoriza seu carro</p>
        </footer>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicVehicleHistory;
