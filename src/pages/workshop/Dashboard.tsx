import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Wrench,
  LogOut,
  Plus,
  Car,
  Calendar,
  TrendingUp,
  CreditCard,
  Settings,
  User,
  ChevronDown,
  Eye,
  Send,
  FileText,
  MoreVertical
} from "lucide-react";
import { WorkshopBottomNav } from "@/components/workshop/BottomNav";

interface Workshop {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  monthly_vehicle_limit: number;
  current_month_vehicles: number;
}

interface RecentMaintenance {
  id: string;
  date: string;
  service_type: string;
  cost: number;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
  };
  profile: {
    full_name: string | null;
  } | null;
}

const WorkshopDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [recentMaintenances, setRecentMaintenances] = useState<RecentMaintenance[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch workshop data
      const { data: workshopData, error: workshopError } = await supabase
        .from('workshops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (workshopError) {
        console.error('Error fetching workshop:', workshopError);
        if (workshopError.code === 'PGRST116') {
          setLoading(false);
          return;
        }
      }

      setWorkshop(workshopData);

      if (workshopData) {
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

        // Get month's date range
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        // Fetch maintenance IDs from workshop_maintenances
        const { data: workshopMaintenances } = await supabase
          .from('workshop_maintenances')
          .select('maintenance_id')
          .eq('workshop_id', workshopData.id);

        const maintenanceIds = workshopMaintenances?.map(wm => wm.maintenance_id) || [];

        if (maintenanceIds.length > 0) {
          // Fetch today's count
          const { count: todayCountData } = await supabase
            .from('maintenances')
            .select('*', { count: 'exact', head: true })
            .in('id', maintenanceIds)
            .gte('created_at', startOfDay)
            .lt('created_at', endOfDay);

          setTodayCount(todayCountData || 0);

          // Fetch month's count
          const { count: monthCountData } = await supabase
            .from('maintenances')
            .select('*', { count: 'exact', head: true })
            .in('id', maintenanceIds)
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth);

          setMonthCount(monthCountData || 0);

          // Fetch recent maintenances with vehicle and profile data
          const { data: maintenancesData } = await supabase
            .from('maintenances')
            .select(`
              id,
              date,
              service_type,
              cost,
              vehicles (
                plate,
                brand,
                model
              ),
              profiles (
                full_name
              )
            `)
            .in('id', maintenanceIds)
            .order('created_at', { ascending: false })
            .limit(10);

          if (maintenancesData) {
            const formattedMaintenances = maintenancesData.map((m: any) => ({
              id: m.id,
              date: m.date,
              service_type: m.service_type,
              cost: m.cost,
              vehicle: {
                plate: m.vehicles?.plate || 'N/A',
                brand: m.vehicles?.brand || '',
                model: m.vehicles?.model || '',
              },
              profile: m.profiles ? { full_name: m.profiles.full_name } : null,
            }));
            setRecentMaintenances(formattedMaintenances);
          }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-yellow-100 rounded-full p-4 mb-4">
              <Wrench className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle>Oficina nao encontrada</CardTitle>
            <CardDescription>
              Nenhuma oficina esta associada a sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => navigate("/login?type=workshop")}
            >
              Criar Nova Oficina
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trialDaysLeft = workshop.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(workshop.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const usagePercentage = (workshop.current_month_vehicles / workshop.monthly_vehicle_limit) * 100;

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

            {/* Workshop Name */}
            <div className="hidden md:block text-center">
              <h1 className="text-lg font-semibold text-gray-900">{workshop.name}</h1>
              <p className="text-xs text-gray-500">Painel da Oficina</p>
            </div>

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
                <DropdownMenuItem onClick={() => navigate("/workshop/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Perfil da Oficina
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/workshop/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configuracoes
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

      {/* Mobile Workshop Name */}
      <div className="md:hidden bg-white border-b px-4 py-2">
        <h1 className="text-lg font-semibold text-gray-900 text-center">{workshop.name}</h1>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Today Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayCount}</div>
              <p className="text-xs text-gray-500">atendimentos</p>
            </CardContent>
          </Card>

          {/* This Month Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Este Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{monthCount}</div>
              <p className="text-xs text-gray-500 mb-2">
                {workshop.current_month_vehicles} de {workshop.monthly_vehicle_limit} veiculos
              </p>
              <Progress value={usagePercentage} className="h-2" />
            </CardContent>
          </Card>

          {/* Plan Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Plano Atual</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{workshop.plan}</div>
              <p className="text-xs text-gray-500">
                {workshop.subscription_status === 'trial' ? (
                  <span className="text-yellow-600">{trialDaysLeft} dias restantes no teste</span>
                ) : workshop.subscription_status === 'active' ? (
                  <span className="text-green-600">Ativo</span>
                ) : (
                  <span className="text-red-600">Cancelado</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Card */}
        <Card className="mb-6 border-2 border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-600 rounded-full p-4">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Novo Atendimento</h3>
                  <p className="text-gray-500">Registre um servico para seu cliente</p>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                onClick={() => navigate("/workshop/new-service")}
              >
                <Plus className="h-5 w-5 mr-2" />
                Iniciar Cadastro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Atendimentos Recentes
            </CardTitle>
            <CardDescription>Ultimos 10 atendimentos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMaintenances.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">Nenhum atendimento registrado</p>
                <p className="text-sm text-gray-400 mb-4">
                  Comece registrando o primeiro servico para um cliente
                </p>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => navigate("/workshop/new-service")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Atendimento
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Veiculo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentMaintenances.map((maintenance) => (
                        <TableRow key={maintenance.id}>
                          <TableCell className="font-medium">
                            {maintenance.vehicle.plate}
                          </TableCell>
                          <TableCell>
                            {maintenance.vehicle.brand} {maintenance.vehicle.model}
                          </TableCell>
                          <TableCell>
                            {maintenance.profile?.full_name || (
                              <span className="text-gray-400">Nao cadastrado</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(maintenance.date)}</TableCell>
                          <TableCell>{formatCurrency(maintenance.cost)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/workshop/service/${maintenance.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {/* TODO: Implement resend link */}}
                              >
                                <Send className="h-4 w-4" />
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
                  {recentMaintenances.map((maintenance) => (
                    <div
                      key={maintenance.id}
                      className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-lg">{maintenance.vehicle.plate}</p>
                          <p className="text-sm text-gray-600">
                            {maintenance.vehicle.brand} {maintenance.vehicle.model}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/workshop/service/${maintenance.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {/* TODO: Implement resend link */}}>
                              <Send className="h-4 w-4 mr-2" />
                              Reenviar link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          {maintenance.profile?.full_name || 'Cliente não cadastrado'}
                        </span>
                        <span className="text-gray-500">{formatDate(maintenance.date)}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(maintenance.cost)}
                        </span>
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

      {/* Floating Action Button - Mobile */}
      <Button
        className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 z-40"
        onClick={() => navigate("/workshop/new-service")}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Bottom Navigation - Mobile */}
      <WorkshopBottomNav />
    </div>
  );
};

export default WorkshopDashboard;
