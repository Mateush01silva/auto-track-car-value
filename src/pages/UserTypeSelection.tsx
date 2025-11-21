import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, User, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (loading) return;

      if (user) {
        // Check if user has a workshop
        const { data: workshop } = await supabase
          .from('workshops')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (workshop) {
          navigate("/workshop/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    };

    checkUserAndRedirect();
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-primary-hover">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-hover flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(39,174,96,0.15),transparent_70%)]" />

      <div className="relative z-10 w-full max-w-4xl space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <Car className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">WiseDrive</h1>
          </div>
          <p className="text-xl text-white/80">
            Como você deseja usar o WiseDrive?
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Use Card */}
          <Card
            className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-primary/50 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
            onClick={() => navigate("/login?type=user")}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-primary/10 rounded-full p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <User className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Uso Pessoal</CardTitle>
              <CardDescription className="text-base">
                Gerencie a manutencao do seu veiculo
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-primary">&#x2022;</span>
                  Registre manutencoes e servicos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">&#x2022;</span>
                  Gere relatorios com QR Code
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">&#x2022;</span>
                  Valorize seu veiculo na revenda
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Continuar
              </Button>
            </CardContent>
          </Card>

          {/* Workshop Card */}
          <Card
            className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-green-500/50 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
            onClick={() => navigate("/login?type=workshop")}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-green-500/10 rounded-full p-4 mb-4 group-hover:bg-green-500/20 transition-colors">
                <Wrench className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Sou Oficina</CardTitle>
              <CardDescription className="text-base">
                Gerencie seus clientes e atendimentos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">&#x2022;</span>
                  Cadastre manutencoes para clientes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">&#x2022;</span>
                  Gerencie servicos e orcamentos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">&#x2022;</span>
                  Fidelize clientes automaticamente
                </li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                Acessar Painel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer text */}
        <p className="text-center text-white/60 text-sm animate-fade-in" style={{ animationDelay: '300ms' }}>
          Transparencia que valoriza seu carro
        </p>
      </div>
    </div>
  );
};

export default UserTypeSelection;
