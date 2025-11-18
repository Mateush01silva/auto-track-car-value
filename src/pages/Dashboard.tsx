import { useState, useEffect, useMemo } from "react";
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
import { useMaintenanceAlerts } from "@/hooks/useMaintenanceAlerts";
import { useSubscription } from "@/hooks/useSubscription";
import { VehicleFormDialog } from "@/components/VehicleFormDialog";
import { MaintenanceFormDialog } from "@/components/MaintenanceFormDialog";
import { MaintenanceAlerts } from "@/components/MaintenanceAlerts";
import { ProfileEditDialog } from "@/components/ProfileEditDialog";
import { AttachmentViewer } from "@/components/AttachmentViewer";
import { KmUpdateReminder } from "@/components/KmUpdateReminder";
import TrialBanner from "@/components/TrialBanner";
import UpgradeDialog from "@/components/UpgradeDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MAINTENANCE_CATEGORIES, getSubcategoriesByCategory, getFullServiceLabel } from "@/constants/maintenanceCategories";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { 
  Car, 
  Plus, 
  FileText, 
  User, 
  Wrench,
  DollarSign,
  LogOut,
  QrCode as QrCodeIcon,
  Download,
  Upload,
  Edit,
  Trash2,
  Loader2,
  Share2,
  Filter,
  Bell
} from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("vehicles");
  const { vehicles, loading: loadingVehicles, deleteVehicle, refetch: refetchVehicles } = useVehicles();
  const { maintenances, loading: loadingMaintenances, addMaintenance, updateMaintenance, deleteMaintenance, getAttachmentUrl } = useMaintenances();
  const alerts = useMaintenanceAlerts(vehicles, maintenances);
  const { subscription, loading: loadingSubscription, refetch: refetchSubscription, showUpgradeMessage } = useSubscription();

  // Refetch vehicles when switching to vehicles tab
  useEffect(() => {
    if (activeTab === "vehicles") {
      refetchVehicles();
    }
  }, [activeTab]);
  
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [upgradeFeature, setUpgradeFeature] = useState<string>("");
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<any>(null);
  const [prefilledData, setPrefilledData] = useState<{ vehicleId?: string; serviceName?: string } | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Report filters
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [showQrDialog, setShowQrDialog] = useState(false);

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

  const handleRegisterMaintenanceFromAlert = (vehicleId: string, serviceName: string) => {
    setEditingMaintenance(null);
    setPrefilledData({ vehicleId, serviceName });
    setIsMaintenanceDialogOpen(true);
    setActiveTab("maintenance");
  };

  const handleMaintenanceSubmit = async (data: any, file?: File) => {
    if (!subscription?.canAddMaintenance && !editingMaintenance) {
      setUpgradeFeature("registrar mais manutenções este mês");
      setIsUpgradeDialogOpen(true);
      return;
    }

    if (editingMaintenance) {
      await updateMaintenance(editingMaintenance.id, data, file);
    } else {
      await addMaintenance(
        {
          ...data,
          attachment_url: null,
        },
        file
      );
    }
  };

  const handleEditMaintenance = (maintenance: any) => {
    setEditingMaintenance(maintenance);
    setIsMaintenanceDialogOpen(true);
  };

  const handleMaintenanceDialogClose = (open: boolean) => {
    setIsMaintenanceDialogOpen(open);
    if (!open) {
      setEditingMaintenance(null);
      setPrefilledData(null);
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

  // Filter maintenances based on selected filters
  const filteredMaintenances = useMemo(() => {
    return maintenances.filter(m => {
      const maintenanceDate = new Date(m.date);
      const matchesVehicle = selectedVehicleFilter === "all" || m.vehicle_id === selectedVehicleFilter;
      const matchesYear = selectedYear === "all" || maintenanceDate.getFullYear().toString() === selectedYear;
      const matchesMonth = selectedMonth === "all" || (maintenanceDate.getMonth() + 1).toString() === selectedMonth;

      return matchesVehicle && matchesYear && matchesMonth;
    });
  }, [maintenances, selectedVehicleFilter, selectedYear, selectedMonth]);

  // Calculate data for charts
  const monthlyData = useMemo(() => {
    const data: { [key: string]: { month: string; cost: number; count: number } } = {};
    
    filteredMaintenances.forEach(m => {
      const date = new Date(m.date);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!data[monthKey]) {
        data[monthKey] = { month: monthKey, cost: 0, count: 0 };
      }
      
      data[monthKey].cost += parseFloat(m.cost.toString());
      data[monthKey].count += 1;
    });
    
    return Object.values(data).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
    });
  }, [filteredMaintenances]);

  const categoryData = useMemo(() => {
    const data: { [key: string]: number } = {};
    
    filteredMaintenances.forEach(m => {
      const category = m.service_type.split(' - ')[0] || 'Outros';
      data[category] = (data[category] || 0) + parseFloat(m.cost.toString());
    });
    
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredMaintenances]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--danger))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  // Available years from maintenances
  const availableYears = useMemo(() => {
    const years = new Set(maintenances.map(m => new Date(m.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [maintenances]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!subscription?.canExportExcel) {
      setUpgradeFeature("exportar relatórios em Excel");
      setIsUpgradeDialogOpen(true);
      return;
    }

    const exportData = filteredMaintenances.map(m => {
      const vehicle = vehicles.find(v => v.id === m.vehicle_id);
      return {
        'Data': new Date(m.date).toLocaleDateString('pt-BR'),
        'Veículo': vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : 'N/A',
        'Tipo de Serviço': m.service_type,
        'Quilometragem': m.km,
        'Custo (R$)': parseFloat(m.cost.toString()).toFixed(2),
        'Observações': m.notes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Manutenções");
    
    const fileName = `wisedrive_manutencoes_${selectedYear}${selectedMonth !== 'all' ? `_${selectedMonth}` : ''}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Relatório exportado!",
      description: `Arquivo ${fileName} baixado com sucesso.`,
    });
  };

  // Generate QR Code
  const handleGenerateQrCode = async () => {
    if (!subscription?.canShareLink) {
      setUpgradeFeature("compartilhar histórico via QR Code");
      setIsUpgradeDialogOpen(true);
      return;
    }

    try {
      const vehicleId = selectedVehicleFilter !== "all" ? selectedVehicleFilter : vehicles[0]?.id;
      if (!vehicleId) {
        toast({
          title: "Erro",
          description: "Selecione um veículo para gerar o QR Code",
          variant: "destructive",
        });
        return;
      }

      const url = `${window.location.origin}/report/${vehicleId}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0A2540',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(qrDataUrl);
      setShowQrDialog(true);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive",
      });
    }
  };

  const filteredTotalCost = filteredMaintenances.reduce((sum, m) => sum + parseFloat(m.cost.toString()), 0);
  const filteredAverageCost = filteredMaintenances.length > 0 ? filteredTotalCost / filteredMaintenances.length : 0;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">WiseDrive</span>
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

        {/* Trial Banner */}
        {subscription && subscription.isTrialActive && (
          <div className="mb-6">
            <TrialBanner
              daysRemaining={subscription.trialDaysRemaining}
              maintenancesCount={maintenances.length}
              vehiclesCount={vehicles.length}
            />
          </div>
        )}

        {/* KM Update Reminder */}
        <div className="mb-6">
          <KmUpdateReminder
            onUpdateClick={() => {
              // Pega o primeiro veículo do usuário e abre o diálogo de edição
              if (vehicles.length > 0) {
                setEditingVehicle(vehicles[0]);
                setIsVehicleDialogOpen(true);
              }
            }}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted rounded-md">
            <TabsTrigger value="vehicles" className="flex-1 min-w-[80px] text-xs sm:text-sm">Veículos</TabsTrigger>
            <TabsTrigger value="maintenance" className="flex-1 min-w-[80px] text-xs sm:text-sm">Manutenções</TabsTrigger>
            <TabsTrigger value="alerts" className="flex-1 min-w-[80px] text-xs sm:text-sm">
              <Bell className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Alertas</span>
              {alerts.filter(a => a.status === "overdue").length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0 h-4">
                  {alerts.filter(a => a.status === "overdue").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 min-w-[80px] text-xs sm:text-sm">Relatórios</TabsTrigger>
            <TabsTrigger value="profile" className="flex-1 min-w-[80px] text-xs sm:text-sm">Perfil</TabsTrigger>
          </TabsList>

          {/* Veículos Tab */}
          <TabsContent value="vehicles" className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Meus Veículos</h2>
              <Button 
                variant="default" 
                onClick={() => {
                  if (!subscription?.canAddVehicle) {
                    setUpgradeFeature("adicionar mais veículos");
                    setIsUpgradeDialogOpen(true);
                    return;
                  }
                  setIsVehicleDialogOpen(true);
                }}
              >
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
                          <p className="text-sm text-muted-foreground">KM Atual</p>
                          <p className="text-lg font-semibold">{vehicle.current_km.toLocaleString()} km</p>
                          <p className="text-xs text-muted-foreground">Cadastro: {vehicle.initial_km?.toLocaleString() || vehicle.current_km.toLocaleString()} km</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">KM Rodados</p>
                          <p className="text-lg font-semibold">{((vehicle.current_km - (vehicle.initial_km || vehicle.current_km))).toLocaleString()} km</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Manutenções</p>
                          <p className="text-lg font-semibold">{getVehicleMaintenances(vehicle.id).length}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Gasto total</p>
                          <p className="text-lg font-semibold">R$ {getTotalCostForVehicle(vehicle.id).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
              <Button 
                variant="default" 
                disabled={vehicles.length === 0}
                onClick={() => {
                  if (!subscription?.canAddMaintenance) {
                    setUpgradeFeature("registrar mais manutenções este mês");
                    setIsUpgradeDialogOpen(true);
                    return;
                  }
                  setIsMaintenanceDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar manutenção
              </Button>
            </div>

            <MaintenanceFormDialog
              open={isMaintenanceDialogOpen}
              onOpenChange={handleMaintenanceDialogClose}
              vehicles={vehicles}
              onSubmit={handleMaintenanceSubmit}
              editingMaintenance={editingMaintenance}
              prefilledData={prefilledData}
            />

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
                          <th className="text-center p-4 font-semibold">Comprovante</th>
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
                                {maintenance.attachment_url ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAttachment(maintenance.attachment_url);
                                      setIsAttachmentViewerOpen(true);
                                    }}
                                  >
                                    <FileText className="h-4 w-4 text-primary" />
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditMaintenance(maintenance)}>
                                    <Edit className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteMaintenance(maintenance.id)}>
                                    <Trash2 className="h-4 w-4 text-danger" />
                                  </Button>
                                </div>
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

          {/* Alertas Tab */}
          <TabsContent value="alerts" className="space-y-6 animate-fade-in">
            <MaintenanceAlerts 
              alerts={alerts} 
              onRegisterMaintenance={handleRegisterMaintenanceFromAlert}
            />
          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="reports" className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
              <h2 className="text-xl sm:text-2xl font-semibold">Relatórios e Gráficos</h2>
              <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
                <Button onClick={handleExportExcel} disabled={filteredMaintenances.length === 0} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
                <Button onClick={handleGenerateQrCode} variant="outline" disabled={vehicles.length === 0} className="w-full sm:w-auto">
                  <QrCodeIcon className="mr-2 h-4 w-4" />
                  Compartilhar Relatório
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Veículo</Label>
                    <Select value={selectedVehicleFilter} onValueChange={setSelectedVehicleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os veículos</SelectItem>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.brand} {vehicle.model} ({vehicle.plate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os anos</SelectItem>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os meses</SelectItem>
                        <SelectItem value="1">Janeiro</SelectItem>
                        <SelectItem value="2">Fevereiro</SelectItem>
                        <SelectItem value="3">Março</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Maio</SelectItem>
                        <SelectItem value="6">Junho</SelectItem>
                        <SelectItem value="7">Julho</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Manutenções no Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{filteredMaintenances.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-success">
                    R$ {filteredTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Custo Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    R$ {filteredAverageCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            {filteredMaintenances.length > 0 ? (
              <>
                {/* Monthly Cost Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Custos por Mês</CardTitle>
                    <CardDescription>Evolução dos gastos ao longo do tempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [`R$ ${parseFloat(value).toFixed(2)}`, 'Custo']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="cost" 
                          stroke="hsl(var(--success))" 
                          strokeWidth={2}
                          name="Custo Total"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Distribution Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Custos por Categoria</CardTitle>
                      <CardDescription>Distribuição dos gastos por tipo de serviço</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Comparativo por Categoria</CardTitle>
                      <CardDescription>Valores em reais por tipo de serviço</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" name="Custo Total" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Maintenance History Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Manutenções</CardTitle>
                    <CardDescription>Lista detalhada das manutenções no período selecionado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-surface border-b">
                          <tr>
                            <th className="text-left p-4 font-semibold">Data</th>
                            <th className="text-left p-4 font-semibold">Veículo</th>
                            <th className="text-left p-4 font-semibold">Tipo de Serviço</th>
                            <th className="text-left p-4 font-semibold">KM</th>
                            <th className="text-left p-4 font-semibold">Custo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMaintenances.map((maintenance) => {
                            const vehicle = vehicles.find(v => v.id === maintenance.vehicle_id);
                            return (
                              <tr key={maintenance.id} className="border-b hover:bg-surface/50 transition-colors">
                                <td className="p-4">{new Date(maintenance.date).toLocaleDateString('pt-BR')}</td>
                                <td className="p-4">
                                  {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : "N/A"}
                                </td>
                                <td className="p-4">{maintenance.service_type}</td>
                                <td className="p-4">{maintenance.km.toLocaleString()} km</td>
                                <td className="p-4 font-semibold text-success">
                                  R$ {parseFloat(maintenance.cost.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
                <p className="text-muted-foreground">
                  Ajuste os filtros ou adicione manutenções para visualizar os relatórios
                </p>
              </Card>
            )}
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
              <CardContent className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações Básicas</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Nome completo</Label>
                      <p className="text-foreground font-medium">{profile?.full_name || "Não informado"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="text-foreground font-medium">{user?.email}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Telefone</Label>
                      <p className="text-foreground font-medium">{profile?.phone || "Não informado"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Data de nascimento</Label>
                      <p className="text-foreground font-medium">
                        {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('pt-BR') : "Não informado"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Sexo</Label>
                      <p className="text-foreground font-medium capitalize">{profile?.gender || "Não informado"}</p>
                    </div>
                  </div>
                </div>

                {/* Localização */}
                {(profile?.state || profile?.municipality) && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Localização</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Estado</Label>
                        <p className="text-foreground font-medium">{profile?.state || "Não informado"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Município</Label>
                        <p className="text-foreground font-medium">{profile?.municipality || "Não informado"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Perfil de Uso */}
                {(profile?.average_monthly_km || profile?.vehicles_count || profile?.vehicle_usage_type || profile?.residence_type) && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Perfil de Uso</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {profile?.average_monthly_km && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Km média mensal</Label>
                          <p className="text-foreground font-medium">{profile.average_monthly_km} km</p>
                        </div>
                      )}
                      {profile?.vehicles_count && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Veículos</Label>
                          <p className="text-foreground font-medium">{profile.vehicles_count}</p>
                        </div>
                      )}
                      {profile?.vehicle_usage_type && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Tipo de uso</Label>
                          <p className="text-foreground font-medium capitalize">{profile.vehicle_usage_type}</p>
                        </div>
                      )}
                      {profile?.residence_type && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Tipo de residência</Label>
                          <p className="text-foreground font-medium capitalize">{profile.residence_type}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Preferências */}
                {(profile?.preferred_contact || profile?.mechanical_knowledge || profile?.maintenance_frequency) && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Preferências</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {profile?.preferred_contact && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Canal preferido</Label>
                          <p className="text-foreground font-medium capitalize">{profile.preferred_contact}</p>
                        </div>
                      )}
                      {profile?.mechanical_knowledge && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Conhecimento mecânico</Label>
                          <p className="text-foreground font-medium capitalize">{profile.mechanical_knowledge}</p>
                        </div>
                      )}
                      {profile?.maintenance_frequency && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Frequência de manutenção</Label>
                          <p className="text-foreground font-medium">
                            {profile.maintenance_frequency === 'preventiva' ? 'Preventiva' : 'Só quando necessário'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dados Socioeconômicos */}
                {(profile?.income_range || profile?.profession) && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados Socioeconômicos</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {profile?.income_range && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Faixa de renda</Label>
                          <p className="text-foreground font-medium">
                            {profile.income_range === 'ate-2k' && 'Até R$ 2.000'}
                            {profile.income_range === '2k-5k' && 'R$ 2.000 - R$ 5.000'}
                            {profile.income_range === '5k-10k' && 'R$ 5.000 - R$ 10.000'}
                            {profile.income_range === '10k-20k' && 'R$ 10.000 - R$ 20.000'}
                            {profile.income_range === 'acima-20k' && 'Acima de R$ 20.000'}
                          </p>
                        </div>
                      )}
                      {profile?.profession && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Profissão</Label>
                          <p className="text-foreground font-medium capitalize">{profile.profession}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-surface/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  🚀 <strong>Versão Beta</strong> - Esta é uma demonstração do WiseDrive.
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
        onProfileUpdated={loadProfile}
      />

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>QR Code do Relatório</DialogTitle>
            <DialogDescription>
              Compartilhe este QR Code para que outros possam visualizar o histórico de manutenções
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeDataUrl && (
              <>
                <img src={qrCodeDataUrl} alt="QR Code" className="border-4 border-primary/20 rounded-lg" />
                <div className="w-full space-y-2">
                  <Label>Link compartilhável</Label>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/report/${selectedVehicleFilter !== "all" ? selectedVehicleFilter : vehicles[0]?.id}`}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/report/${selectedVehicleFilter !== "all" ? selectedVehicleFilter : vehicles[0]?.id}`);
                        toast({
                          title: "Link copiado!",
                          description: "O link foi copiado para a área de transferência",
                        });
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = 'wisedrive-qrcode.png';
                    link.href = qrCodeDataUrl;
                    link.click();
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar QR Code
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        feature={upgradeFeature}
        trialDaysRemaining={subscription?.trialDaysRemaining}
      />

      <AttachmentViewer
        open={isAttachmentViewerOpen}
        onOpenChange={setIsAttachmentViewerOpen}
        attachmentUrl={selectedAttachment}
        getAttachmentUrl={getAttachmentUrl}
      />
    </div>
  );
};

export default Dashboard;
