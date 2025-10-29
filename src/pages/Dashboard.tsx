import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicles } from "@/hooks/useVehicles";
import { useMaintenances } from "@/hooks/useMaintenances";
import { VehicleFormDialog } from "@/components/VehicleFormDialog";
import { ProfileEditDialog } from "@/components/ProfileEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, 
  Plus, 
  FileText, 
  User, 
  Wrench,
  DollarSign,
  LogOut,
  QrCode,
  Download,
  Upload,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("vehicles");
  const { vehicles, loading: loadingVehicles, deleteVehicle } = useVehicles();
  const { maintenances, loading: loadingMaintenances, addMaintenance, deleteMaintenance } = useMaintenances();
  
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [maintenanceFormData, setMaintenanceFormData] = useState({
    vehicle_id: "",
    date: "",
    service_type: "",
    km: "",
    cost: "",
    notes: "",
  });

  const statusConfig = {
    "up-to-date": { label: "Em dia", color: "success" as const },
    "due-soon": { label: "Próxima revisão", color: "warning" as const },
    "overdue": { label: "Atrasada", color: "danger" as const }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleMaintenanceInputChange = (field: string, value: string) => {
    setMaintenanceFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!maintenanceFormData.vehicle_id) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um veículo",
        variant: "destructive",
      });
      return;
    }

    setSubmittingMaintenance(true);
    try {
      await addMaintenance({
        vehicle_id: maintenanceFormData.vehicle_id,
        date: maintenanceFormData.date,
        service_type: maintenanceFormData.service_type,
        km: parseInt(maintenanceFormData.km),
        cost: parseFloat(maintenanceFormData.cost),
        notes: maintenanceFormData.notes || null,
        attachment_url: null,
      });

      setMaintenanceFormData({
        vehicle_id: "",
        date: "",
        service_type: "",
        km: "",
        cost: "",
        notes: "",
      });
      setIsMaintenanceDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar manutenção:", error);
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (confirm("Tem certeza que deseja excluir este veículo? Todas as manutenções associadas também serão excluídas.")) {
      await deleteVehicle(vehicleId);
    }
  };

  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setIsVehicleDialogOpen(true);
  };

  const handleVehicleDialogClose = (open: boolean) => {
    setIsVehicleDialogOpen(open);
    if (!open) {
      setEditingVehicle(null);
    }
  };

  const handleDeleteMaintenance = async (maintenanceId: string) => {
    if (confirm("Tem certeza que deseja excluir esta manutenção?")) {
      await deleteMaintenance(maintenanceId);
    }
  };

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

  const getVehicleMaintenances = (vehicleId: string) => {
    return maintenances.filter(m => m.vehicle_id === vehicleId);
  };

  const getTotalCostForVehicle = (vehicleId: string) => {
    return getVehicleMaintenances(vehicleId).reduce((sum, m) => sum + parseFloat(m.cost.toString()), 0);
  };

  const totalCost = maintenances.reduce((sum, m) => sum + parseFloat(m.cost.toString()), 0);

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">AutoTrack</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || user?.user_metadata?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "U")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email}</strong>
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
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
              <Button variant="default" onClick={() => setIsVehicleDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar veículo
              </Button>
            </div>

            {loadingVehicles ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : vehicles.length === 0 ? (
              <Card className="p-12 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum veículo cadastrado</h3>
                <p className="text-muted-foreground mb-4">Adicione seu primeiro veículo para começar</p>
                <Button onClick={() => setIsVehicleDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar veículo
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6">
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{vehicle.brand} {vehicle.model}</CardTitle>
                          <CardDescription>
                            {vehicle.year} • {vehicle.plate}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge className={getStatusBadgeClass(statusConfig[vehicle.status].color)}>
                            {statusConfig[vehicle.status].label}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => handleEditVehicle(vehicle)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteVehicle(vehicle.id)}>
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Quilometragem</p>
                          <p className="text-lg font-semibold">{vehicle.current_km.toLocaleString()} km</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Manutenções</p>
                          <p className="text-lg font-semibold">{getVehicleMaintenances(vehicle.id).length}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Gasto total</p>
                          <p className="text-lg font-semibold">R$ {getTotalCostForVehicle(vehicle.id).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="text-lg font-semibold text-success">Ativo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Manutenções Tab */}
          <TabsContent value="maintenance" className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Histórico de Manutenções</h2>
              <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" disabled={vehicles.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar manutenção
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Registrar nova manutenção</DialogTitle>
                    <DialogDescription>
                      Adicione os detalhes da manutenção realizada no seu veículo.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleMaintenanceSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle">Veículo</Label>
                      <Select value={maintenanceFormData.vehicle_id} onValueChange={(value) => handleMaintenanceInputChange("vehicle_id", value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.brand} {vehicle.model} - {vehicle.plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Data da manutenção</Label>
                      <Input
                        id="date"
                        type="date"
                        value={maintenanceFormData.date}
                        onChange={(e) => handleMaintenanceInputChange("date", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de serviço</Label>
                      <Input
                        id="type"
                        placeholder="Ex: Troca de óleo, Revisão completa..."
                        value={maintenanceFormData.service_type}
                        onChange={(e) => handleMaintenanceInputChange("service_type", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="km">Quilometragem</Label>
                      <Input
                        id="km"
                        type="number"
                        placeholder="Ex: 45000"
                        value={maintenanceFormData.km}
                        onChange={(e) => handleMaintenanceInputChange("km", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost">Custo (R$)</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 280.00"
                        value={maintenanceFormData.cost}
                        onChange={(e) => handleMaintenanceInputChange("cost", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações (opcional)</Label>
                      <Input
                        id="notes"
                        placeholder="Notas adicionais..."
                        value={maintenanceFormData.notes}
                        onChange={(e) => handleMaintenanceInputChange("notes", e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button type="submit" variant="default" className="flex-1" disabled={submittingMaintenance}>
                        {submittingMaintenance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar manutenção
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {vehicles.length === 0 ? (
              <Card className="p-12 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Adicione um veículo primeiro</h3>
                <p className="text-muted-foreground mb-4">Você precisa cadastrar um veículo antes de registrar manutenções</p>
                <Button onClick={() => setActiveTab("vehicles")}>
                  Ir para Veículos
                </Button>
              </Card>
            ) : loadingMaintenances ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : maintenances.length === 0 ? (
              <Card className="p-12 text-center">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma manutenção registrada</h3>
                <p className="text-muted-foreground mb-4">Comece a registrar suas manutenções</p>
                <Button onClick={() => setIsMaintenanceDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar manutenção
                </Button>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface border-b">
                        <tr>
                          <th className="text-left p-4 font-semibold">Veículo</th>
                          <th className="text-left p-4 font-semibold">Data</th>
                          <th className="text-left p-4 font-semibold">Tipo de serviço</th>
                          <th className="text-left p-4 font-semibold">KM</th>
                          <th className="text-left p-4 font-semibold">Custo</th>
                          <th className="text-center p-4 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maintenances.map((maintenance) => {
                          const vehicle = vehicles.find(v => v.id === maintenance.vehicle_id);
                          return (
                            <tr key={maintenance.id} className="border-b hover:bg-surface/50 transition-colors">
                              <td className="p-4">
                                {vehicle ? `${vehicle.brand} ${vehicle.model}` : "N/A"}
                              </td>
                              <td className="p-4">{new Date(maintenance.date).toLocaleDateString('pt-BR')}</td>
                              <td className="p-4">{maintenance.service_type}</td>
                              <td className="p-4">{maintenance.km.toLocaleString()} km</td>
                              <td className="p-4 font-semibold text-success">R$ {parseFloat(maintenance.cost.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="p-4 text-center">
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMaintenance(maintenance.id)}>
                                  <Trash2 className="h-4 w-4 text-danger" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="reports" className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-semibold">Relatórios</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Relatório Completo
                  </CardTitle>
                  <CardDescription>Gere um relatório completo com todo o histórico</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/report">
                    <Button className="w-full" variant="default">
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Relatório
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code
                  </CardTitle>
                  <CardDescription>Compartilhe seu histórico via QR Code</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" disabled>
                    <QrCode className="mr-2 h-4 w-4" />
                    Em breve
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total de veículos</p>
                    <p className="text-3xl font-bold">{vehicles.length}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total de manutenções</p>
                    <p className="text-3xl font-bold">{maintenances.length}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Gasto total</p>
                    <p className="text-3xl font-bold text-success">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Perfil Tab */}
          <TabsContent value="profile" className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Meu Perfil</h2>
              <Button variant="default" onClick={() => setIsProfileDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Perfil
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {(profile?.full_name || user?.email || "U")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{profile?.full_name || "Usuário"}</CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <p className="text-foreground font-medium">{profile?.full_name || "Não informado"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-foreground font-medium">{user?.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <p className="text-foreground font-medium">{profile?.phone || "Não informado"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <p className="text-foreground font-medium">{profile?.city || "Não informado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  🚀 <strong>Versão Beta</strong> - Esta é uma demonstração do AutoTrack.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <VehicleFormDialog
        open={isVehicleDialogOpen}
        onOpenChange={handleVehicleDialogClose}
        vehicle={editingVehicle}
      />

      <ProfileEditDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />
    </div>
  );
};

export default Dashboard;
