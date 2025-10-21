import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Car, 
  Plus, 
  FileText, 
  TrendingUp, 
  User, 
  Calendar,
  Wrench,
  DollarSign,
  Image as ImageIcon,
  LogOut,
  QrCode,
  Download
} from "lucide-react";

// Mock data
const mockVehicle = {
  model: "Honda Civic EXL 2.0",
  year: 2020,
  plate: "ABC-1234",
  km: 45230,
  status: "up-to-date" as const
};

const mockMaintenances = [
  {
    id: 1,
    date: "15/01/2025",
    type: "Troca de óleo",
    km: 45000,
    cost: 280,
    hasAttachment: true
  },
  {
    id: 2,
    date: "10/12/2024",
    type: "Revisão completa",
    km: 40000,
    cost: 850,
    hasAttachment: true
  },
  {
    id: 3,
    date: "05/09/2024",
    type: "Alinhamento e balanceamento",
    km: 35000,
    cost: 180,
    hasAttachment: false
  },
  {
    id: 4,
    date: "20/06/2024",
    type: "Troca de pastilhas de freio",
    km: 30000,
    cost: 420,
    hasAttachment: true
  }
];

const statusConfig = {
  "up-to-date": { label: "Em dia", color: "success" as const },
  "due-soon": { label: "Próxima revisão", color: "warning" as const },
  "overdue": { label: "Atrasada", color: "danger" as const }
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("vehicles");
  const totalCost = mockMaintenances.reduce((sum, m) => sum + m.cost, 0);

  const getStatusBadgeClass = (color: "success" | "warning" | "danger") => {
    switch (color) {
      case "success":
        return "bg-success text-success-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "danger":
        return "bg-danger text-danger-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">AutoTrack</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">João Silva</span>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Gerencie seus veículos e histórico de manutenção</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="vehicles">Veículos</TabsTrigger>
            <TabsTrigger value="maintenance">Manutenções</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          {/* Veículos Tab */}
          <TabsContent value="vehicles" className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Meus Veículos</h2>
              <Button variant="success">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar veículo
              </Button>
            </div>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{mockVehicle.model}</CardTitle>
                    <CardDescription>
                      {mockVehicle.year} • {mockVehicle.plate}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusBadgeClass(statusConfig[mockVehicle.status].color)}>
                    {statusConfig[mockVehicle.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Quilometragem</p>
                    <p className="text-lg font-semibold">{mockVehicle.km.toLocaleString()} km</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Manutenções</p>
                    <p className="text-lg font-semibold">{mockMaintenances.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Gasto total</p>
                    <p className="text-lg font-semibold">R$ {totalCost.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold text-success">Ativo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manutenções Tab */}
          <TabsContent value="maintenance" className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Histórico de Manutenções</h2>
              <Button variant="success">
                <Plus className="mr-2 h-4 w-4" />
                Registrar manutenção
              </Button>
            </div>

            <Card className="shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface border-b">
                      <tr>
                        <th className="text-left p-4 font-semibold">Data</th>
                        <th className="text-left p-4 font-semibold">Tipo de serviço</th>
                        <th className="text-left p-4 font-semibold">KM</th>
                        <th className="text-left p-4 font-semibold">Custo</th>
                        <th className="text-center p-4 font-semibold">Anexo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockMaintenances.map((maintenance) => (
                        <tr key={maintenance.id} className="border-b hover:bg-surface/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {maintenance.date}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-primary" />
                              {maintenance.type}
                            </div>
                          </td>
                          <td className="p-4">{maintenance.km.toLocaleString()} km</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 font-semibold text-success">
                              <DollarSign className="h-4 w-4" />
                              R$ {maintenance.cost.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {maintenance.hasAttachment && (
                              <ImageIcon className="h-5 w-5 text-primary mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="reports" className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Relatórios</h2>
              <p className="text-muted-foreground">
                Gere relatórios profissionais do histórico do seu veículo
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Relatório Completo
                  </CardTitle>
                  <CardDescription>
                    Histórico detalhado com todas as manutenções realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-surface p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total de manutenções:</span>
                      <span className="font-semibold">{mockMaintenances.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Investimento total:</span>
                      <span className="font-semibold text-success">R$ {totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Período:</span>
                      <span className="font-semibold">Jun/2024 - Jan/2025</span>
                    </div>
                  </div>
                  <Link to="/report">
                    <Button variant="default" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Relatório
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-success" />
                    Compartilhar via QR Code
                  </CardTitle>
                  <CardDescription>
                    Gere um link com QR Code para compartilhar o histórico
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-br from-primary/10 to-success/10 p-6 rounded-lg flex items-center justify-center">
                    <div className="bg-card p-4 rounded-lg">
                      <QrCode className="h-24 w-24 text-primary" />
                    </div>
                  </div>
                  <Link to="/report">
                    <Button variant="success" className="w-full">
                      <QrCode className="mr-2 h-4 w-4" />
                      Gerar QR Code
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg bg-gradient-to-br from-success/5 to-primary/5 border-success/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-success/10 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Valorize seu veículo!</h3>
                    <p className="text-muted-foreground text-sm">
                      Veículos com histórico completo de manutenção podem valer até 15% a mais na revenda. 
                      Continue registrando todas as manutenções para maximizar o valor do seu carro.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Perfil Tab */}
          <TabsContent value="profile" className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-semibold">Meu Perfil</h2>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Informações pessoais</CardTitle>
                <CardDescription>Seus dados cadastrados no AutoTrack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary rounded-full p-4">
                    <User className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">João Silva</p>
                    <p className="text-sm text-muted-foreground">Membro desde Janeiro 2025</p>
                  </div>
                </div>

                <div className="grid gap-4 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                    <p className="font-medium">joao.silva@email.com</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cidade</p>
                    <p className="font-medium">São Paulo, SP</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                    <p className="font-medium">(11) 98765-4321</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    Editar perfil
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-surface-light">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    🚀 <strong>Esta é uma versão MVP (beta)</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Todos os dados exibidos são simulados para fins de demonstração. 
                    Em breve, você poderá cadastrar seus veículos reais!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
