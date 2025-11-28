import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench,
  LogOut,
  User,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  MessageCircle,
  Eye,
  ArrowUpDown,
  FileText,
  History,
  Users as UsersIcon,
  DollarSign,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { WorkshopBottomNav } from "@/components/workshop/BottomNav";
import { useMaintenanceAlerts, MaintenanceAlert } from "@/hooks/useMaintenanceAlerts";
import { Vehicle } from "@/hooks/useVehicles";
import { Maintenance } from "@/hooks/useMaintenances";
import { differenceInDays } from "date-fns";

interface ClientOpportunity {
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  alerts: MaintenanceAlert[];
  totalPendingItems: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  minRevenue: number;
  maxRevenue: number;
  avgRevenue: number;
  daysSinceLastVisit: number | null;
  publicToken: string | null;
}

const WorkshopOpportunities = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [opportunities, setOpportunities] = useState<ClientOpportunity[]>([]);
  const [sortBy, setSortBy] = useState<"criticality" | "revenue" | "days">("criticality");
  const [filterCriticality, setFilterCriticality] = useState<string>("all");

  const alerts = useMaintenanceAlerts(vehicles, maintenances);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get workshop
        const { data: workshopData, error: workshopError } = await supabase
          .from('workshops')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (workshopError || !workshopData) {
          console.error('Error fetching workshop:', workshopError);
          setLoading(false);
          return;
        }

        // Get maintenance IDs from workshop
        const { data: workshopMaintenances } = await supabase
          .from('workshop_maintenances')
          .select('maintenance_id')
          .eq('workshop_id', workshopData.id);

        const maintenanceIds = workshopMaintenances?.map(wm => wm.maintenance_id) || [];

        if (maintenanceIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch all maintenances with vehicle and profile data
        const { data: maintenancesData } = await supabase
          .from('maintenances')
          .select(`
            id,
            date,
            service_type,
            km,
            cost,
            public_token,
            vehicle_id,
            vehicles (
              id,
              plate,
              brand,
              model,
              year,
              current_km,
              initial_km,
              user_id,
              profiles (
                id,
                full_name,
                phone
              )
            )
          `)
          .in('id', maintenanceIds)
          .order('date', { ascending: false });

        if (maintenancesData) {
          // Extract unique vehicles
          const vehiclesMap = new Map<string, Vehicle>();
          const allMaintenances: Maintenance[] = [];

          maintenancesData.forEach((m: any) => {
            if (m.vehicles) {
              vehiclesMap.set(m.vehicles.id, {
                id: m.vehicles.id,
                plate: m.vehicles.plate,
                brand: m.vehicles.brand,
                model: m.vehicles.model,
                year: m.vehicles.year,
                current_km: m.vehicles.current_km,
                initial_km: m.vehicles.initial_km,
                user_id: m.vehicles.user_id,
              } as Vehicle);
            }

            allMaintenances.push({
              id: m.id,
              date: m.date,
              service_type: m.service_type,
              km: m.km,
              cost: m.cost,
              vehicle_id: m.vehicle_id,
            } as Maintenance);
          });

          setVehicles(Array.from(vehiclesMap.values()));
          setMaintenances(allMaintenances);

          // Store full maintenance data for later use
          (window as any).__workshopMaintenancesData = maintenancesData;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (alerts.length === 0 || vehicles.length === 0) {
      setOpportunities([]);
      return;
    }

    // Group alerts by vehicle/client
    const clientMap = new Map<string, ClientOpportunity>();

    alerts.forEach((alert) => {
      const vehicle = vehicles.find(v => v.id === alert.vehicleId);
      if (!vehicle) return;

      const maintenancesData = (window as any).__workshopMaintenancesData || [];
      const vehicleData = maintenancesData.find((m: any) => m.vehicles?.id === vehicle.id);

      const clientId = vehicle.user_id || alert.vehicleId;
      const clientName = vehicleData?.vehicles?.profiles?.full_name || 'Cliente não cadastrado';
      const clientPhone = vehicleData?.vehicles?.profiles?.phone || null;

      // Get last visit date
      const vehicleMaintenances = maintenances
        .filter(m => m.vehicle_id === vehicle.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastVisit = vehicleMaintenances[0];
      const daysSinceLastVisit = lastVisit
        ? differenceInDays(new Date(), new Date(lastVisit.date))
        : null;

      const publicToken = lastVisit ?
        (maintenancesData.find((m: any) => m.id === lastVisit.id)?.public_token || null) :
        null;

      const key = `${clientId}-${vehicle.id}`;

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          clientId,
          clientName,
          clientPhone,
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
          vehiclePlate: vehicle.plate,
          alerts: [],
          totalPendingItems: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          minRevenue: 0,
          maxRevenue: 0,
          avgRevenue: 0,
          daysSinceLastVisit,
          publicToken,
        });
      }

      const opportunity = clientMap.get(key)!;
      opportunity.alerts.push(alert);
      opportunity.totalPendingItems++;

      // Count by criticality
      switch (alert.recommendation.criticidade) {
        case "Crítica":
          opportunity.criticalCount++;
          break;
        case "Alta":
          opportunity.highCount++;
          break;
        case "Média":
          opportunity.mediumCount++;
          break;
        case "Baixa":
          opportunity.lowCount++;
          break;
      }

      // Sum revenue potential
      opportunity.minRevenue += alert.recommendation.custoMinimo;
      opportunity.maxRevenue += alert.recommendation.custoMaximo;
    });

    // Calculate average revenue
    clientMap.forEach((opp) => {
      opp.avgRevenue = (opp.minRevenue + opp.maxRevenue) / 2;
    });

    let opportunitiesArray = Array.from(clientMap.values());

    // Filter by criticality
    if (filterCriticality !== "all") {
      opportunitiesArray = opportunitiesArray.filter(opp => {
        switch (filterCriticality) {
          case "Crítica":
            return opp.criticalCount > 0;
          case "Alta":
            return opp.highCount > 0;
          case "Média":
            return opp.mediumCount > 0;
          case "Baixa":
            return opp.lowCount > 0;
          default:
            return true;
        }
      });
    }

    // Sort opportunities
    opportunitiesArray.sort((a, b) => {
      switch (sortBy) {
        case "criticality":
          // Sort by critical first, then high, then revenue
          if (a.criticalCount !== b.criticalCount) {
            return b.criticalCount - a.criticalCount;
          }
          if (a.highCount !== b.highCount) {
            return b.highCount - a.highCount;
          }
          return b.avgRevenue - a.avgRevenue;
        case "revenue":
          return b.avgRevenue - a.avgRevenue;
        case "days":
          if (a.daysSinceLastVisit === null) return 1;
          if (b.daysSinceLastVisit === null) return -1;
          return b.daysSinceLastVisit - a.daysSinceLastVisit;
        default:
          return 0;
      }
    });

    setOpportunities(opportunitiesArray);
  }, [alerts, vehicles, maintenances, sortBy, filterCriticality]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSendWhatsApp = (clientPhone: string | null, clientName: string, vehicleName: string) => {
    if (!clientPhone) {
      toast({
        title: "Telefone não disponível",
        description: "Este cliente não possui telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    let phone = clientPhone.replace(/\D/g, '');

    if (phone.startsWith('55') && phone.length > 12) {
      phone = phone.substring(2);
    }

    if (phone.length < 10 || phone.length > 11) {
      toast({
        title: "Número inválido",
        description: "O número de telefone não está no formato correto.",
        variant: "destructive",
      });
      return;
    }

    const phoneWithCountry = `55${phone}`;
    const message = encodeURIComponent(
      `Olá ${clientName}! 👋\n\nIdentificamos que seu ${vehicleName} possui manutenções pendentes. ` +
      `Que tal agendar uma revisão?\n\nEstamos à disposição!`
    );

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleViewDetails = (publicToken: string | null) => {
    if (publicToken) {
      window.open(`${window.location.origin}/share/${publicToken}`, '_blank');
    } else {
      toast({
        title: "Histórico não disponível",
        description: "Este veículo ainda não possui histórico público.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate summary metrics
  const totalOpportunities = opportunities.length;
  const totalRevenuePotential = opportunities.reduce((sum, opp) => sum + opp.avgRevenue, 0);
  const totalCritical = opportunities.reduce((sum, opp) => sum + opp.criticalCount, 0);
  const totalHigh = opportunities.reduce((sum, opp) => sum + opp.highCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-green-600 rounded-lg p-2">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-green-600">WiseDrive</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/workshop/dashboard")}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/workshop/history")}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                Histórico
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/workshop/clients")}
                className="flex items-center gap-2"
              >
                <UsersIcon className="h-4 w-4" />
                Clientes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/workshop/templates")}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Templates
              </Button>
            </nav>

            {/* Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Menu</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/workshop/settings")}>
                  <User className="h-4 w-4 mr-2" />
                  Perfil da Oficina
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
            Oportunidades de Negócio
          </h1>
          <p className="text-gray-500 mt-1">
            Clientes com manutenções pendentes e potencial de receita
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Oportunidades</CardTitle>
              <UsersIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOpportunities}</div>
              <p className="text-xs text-gray-500">clientes com pendências</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Receita Potencial</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenuePotential)}</div>
              <p className="text-xs text-gray-500">valor médio estimado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Manutenções Críticas</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{totalCritical}</div>
              <p className="text-xs text-gray-500">itens urgentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Manutenções Altas</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{totalHigh}</div>
              <p className="text-xs text-gray-500">itens importantes</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Sorting */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Lista de Oportunidades</CardTitle>
                <CardDescription>Clientes ordenados por prioridade e potencial</CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="criticality">Por Criticidade</SelectItem>
                    <SelectItem value="revenue">Por Receita</SelectItem>
                    <SelectItem value="days">Por Última Visita</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCriticality} onValueChange={setFilterCriticality}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Crítica">Só Críticas</SelectItem>
                    <SelectItem value="Alta">Só Altas</SelectItem>
                    <SelectItem value="Média">Só Médias</SelectItem>
                    <SelectItem value="Baixa">Só Baixas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-semibold mb-2">Nenhuma oportunidade encontrada</p>
                <p className="text-sm text-gray-400">
                  Todas as manutenções dos seus clientes estão em dia!
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente / Veículo</TableHead>
                        <TableHead>Pendências</TableHead>
                        <TableHead>Criticidade</TableHead>
                        <TableHead>Receita Potencial</TableHead>
                        <TableHead>Última Visita</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opportunities.map((opp, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{opp.clientName}</p>
                              <p className="text-sm text-gray-500">
                                {opp.vehicleName} • {opp.vehiclePlate}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{opp.totalPendingItems} itens</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {opp.criticalCount > 0 && (
                                <Badge className="bg-red-600 hover:bg-red-700">
                                  {opp.criticalCount} Crítica
                                </Badge>
                              )}
                              {opp.highCount > 0 && (
                                <Badge className="bg-orange-500 hover:bg-orange-600">
                                  {opp.highCount} Alta
                                </Badge>
                              )}
                              {opp.mediumCount > 0 && (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                                  {opp.mediumCount} Média
                                </Badge>
                              )}
                              {opp.lowCount > 0 && (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                  {opp.lowCount} Baixa
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-green-600">
                                {formatCurrency(opp.avgRevenue)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(opp.minRevenue)} - {formatCurrency(opp.maxRevenue)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {opp.daysSinceLastVisit !== null ? (
                              <span className={
                                opp.daysSinceLastVisit > 90
                                  ? "text-red-600 font-medium"
                                  : opp.daysSinceLastVisit > 30
                                  ? "text-orange-600"
                                  : "text-gray-600"
                              }>
                                {opp.daysSinceLastVisit} dias
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendWhatsApp(opp.clientPhone, opp.clientName, opp.vehicleName)}
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(opp.publicToken)}
                                title="Ver histórico"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {opportunities.map((opp, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-lg">{opp.clientName}</p>
                          <p className="text-sm text-gray-600">
                            {opp.vehicleName} • {opp.vehiclePlate}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleSendWhatsApp(opp.clientPhone, opp.clientName, opp.vehicleName)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Enviar WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewDetails(opp.publicToken)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver histórico
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Pendências:</span>
                          <Badge variant="outline">{opp.totalPendingItems} itens</Badge>
                        </div>

                        <div className="flex gap-1 flex-wrap">
                          {opp.criticalCount > 0 && (
                            <Badge className="bg-red-600 hover:bg-red-700 text-xs">
                              {opp.criticalCount} Crítica
                            </Badge>
                          )}
                          {opp.highCount > 0 && (
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">
                              {opp.highCount} Alta
                            </Badge>
                          )}
                          {opp.mediumCount > 0 && (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 text-xs">
                              {opp.mediumCount} Média
                            </Badge>
                          )}
                          {opp.lowCount > 0 && (
                            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                              {opp.lowCount} Baixa
                            </Badge>
                          )}
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-500">Receita potencial:</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(opp.avgRevenue)}
                            </span>
                          </div>
                          {opp.daysSinceLastVisit !== null && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Última visita:</span>
                              <span className={
                                opp.daysSinceLastVisit > 90
                                  ? "text-red-600 font-medium text-sm"
                                  : opp.daysSinceLastVisit > 30
                                  ? "text-orange-600 text-sm"
                                  : "text-gray-600 text-sm"
                              }>
                                {opp.daysSinceLastVisit} dias atrás
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Spacer for bottom nav on mobile */}
        <div className="h-20 md:hidden" />
      </main>

      {/* Bottom Navigation - Mobile */}
      <WorkshopBottomNav />
    </div>
  );
};

export default WorkshopOpportunities;
