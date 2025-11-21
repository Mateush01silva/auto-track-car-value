import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Users, FileText, Settings, LogOut, Plus, Car } from "lucide-react";

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

const WorkshopDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkshop = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching workshop:', error);
        // If no workshop found, redirect to create one
        if (error.code === 'PGRST116') {
          // No workshop found - could redirect to onboarding
          setLoading(false);
          return;
        }
      }

      setWorkshop(data);
      setLoading(false);
    };

    fetchWorkshop();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 rounded-lg p-2">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{workshop.name}</h1>
                <p className="text-sm text-gray-500">Painel da Oficina</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {workshop.subscription_status === 'trial' && (
                <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                  {trialDaysLeft} dias restantes no teste
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Veiculos este mes</CardDescription>
              <CardTitle className="text-3xl">
                {workshop.current_month_vehicles}/{workshop.monthly_vehicle_limit}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Plano</CardDescription>
              <CardTitle className="text-3xl capitalize">{workshop.plan}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-3xl capitalize">
                {workshop.subscription_status === 'trial' ? 'Teste' :
                 workshop.subscription_status === 'active' ? 'Ativo' : 'Cancelado'}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Este mes</CardDescription>
              <CardTitle className="text-3xl">R$ 0,00</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold mb-4">Acoes Rapidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Nova Manutencao</h3>
                  <p className="text-sm text-gray-500">Registrar servico para cliente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Buscar Veiculo</h3>
                  <p className="text-sm text-gray-500">Pesquisar por placa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Templates</h3>
                  <p className="text-sm text-gray-500">Gerenciar servicos padrao</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <h2 className="text-lg font-semibold mb-4">Atividade Recente</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma atividade recente</p>
              <p className="text-sm">Comece registrando uma manutencao para um cliente</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WorkshopDashboard;
