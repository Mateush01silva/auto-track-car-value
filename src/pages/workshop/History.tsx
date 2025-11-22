import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendMaintenanceEmail, formatServicesForEmail, formatVehicleInfo } from "@/lib/notifications";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Mail,
  FileText,
  Car,
  DollarSign,
  Calendar,
  Users,
  Loader2,
  Crown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { WorkshopBottomNav } from "@/components/workshop/BottomNav";

interface Workshop {
  id: string;
  name: string;
  plan: string;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  service_type: string;
  cost: number;
  km: number;
  notes: string | null;
  attachments: string[] | null;
  public_token: string | null;
  vehicle: {
    id: string;
    plate: string;
    brand: string;
    model: string;
    year: number;
  };
  client_name?: string;
}

const ITEMS_PER_PAGE = 20;

const WorkshopHistory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(searchParams.get('start') || '');
  const [endDate, setEndDate] = useState(searchParams.get('end') || '');
  const [plateSearch, setPlateSearch] = useState(searchParams.get('plate') || '');
  const [clientSearch, setClientSearch] = useState(searchParams.get('client') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [sortField, setSortField] = useState<'date' | 'cost'>(
    (searchParams.get('sort') as 'date' | 'cost') || 'date'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  );

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    avgTicket: 0,
    uniqueVehicles: 0,
  });

  // Load workshop data
  useEffect(() => {
    const loadWorkshop = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('workshops')
        .select('id, name, plan')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching workshop:', error);
        navigate('/workshop/dashboard');
        return;
      }

      setWorkshop(data);
    };

    loadWorkshop();
  }, [user, navigate]);

  // Load maintenances
  useEffect(() => {
    const loadMaintenances = async () => {
      if (!workshop) return;

      setLoading(true);

      try {
        // Get maintenance IDs from workshop_maintenances
        const { data: workshopMaintenances, error: wmError } = await supabase
          .from('workshop_maintenances')
          .select('maintenance_id')
          .eq('workshop_id', workshop.id);

        if (wmError) {
          console.error('Error fetching workshop_maintenances:', wmError);
          throw wmError;
        }

        const maintenanceIds = workshopMaintenances?.map(wm => wm.maintenance_id) || [];

        if (maintenanceIds.length === 0) {
          setMaintenances([]);
          setTotalCount(0);
          setStats({ total: 0, totalValue: 0, avgTicket: 0, uniqueVehicles: 0 });
          setLoading(false);
          return;
        }

        // Build base query conditions
        const buildQuery = (isCount = false) => {
          let query = supabase
            .from('maintenances')
            .select(isCount ? 'id' : `
              id,
              date,
              service_type,
              cost,
              km,
              notes,
              attachments,
              public_token,
              vehicles (
                id,
                plate,
                brand,
                model,
                year
              )
            `, isCount ? { count: 'exact', head: true } : { count: 'exact' })
            .in('id', maintenanceIds);

          // Apply filters
          if (startDate) {
            query = query.gte('date', startDate);
          }
          if (endDate) {
            query = query.lte('date', endDate);
          }

          // Apply sorting
          query = query.order(sortField, { ascending: sortOrder === 'asc' });

          return query;
        };

        // Get total count
        const { count: totalFiltered, error: countError } = await buildQuery(true);

        if (countError) {
          console.error('Error fetching count:', countError);
          throw countError;
        }

        // Get paginated data
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const { data, error } = await buildQuery()
          .range(offset, offset + ITEMS_PER_PAGE - 1);

        if (error) {
          console.error('Error fetching maintenances:', error);
          throw error;
        }

        // Filter by plate if specified (client-side for ILIKE behavior)
        // Also filter out records without vehicles
        let filteredData = (data || []).filter(m => m.vehicles != null);
        if (plateSearch) {
          const searchLower = plateSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
          filteredData = filteredData.filter(m =>
            m.vehicles?.plate.toLowerCase().replace(/[^a-z0-9]/g, '').includes(searchLower)
          );
        }

        // Transform data
        const transformedData: MaintenanceRecord[] = filteredData.map(m => ({
          ...m,
          vehicle: m.vehicles as any,
        }));

        setMaintenances(transformedData);
        setTotalCount(totalFiltered || 0);

        // Calculate stats from all filtered data (not just current page)
        if (totalFiltered && totalFiltered > 0) {
          // For accurate stats, we need to query all filtered data
          let statsQuery = supabase
            .from('maintenances')
            .select('cost, vehicle_id')
            .in('id', maintenanceIds);

          if (startDate) statsQuery = statsQuery.gte('date', startDate);
          if (endDate) statsQuery = statsQuery.lte('date', endDate);

          const { data: statsData, error: statsError } = await statsQuery;

          if (statsError) {
            console.error('Error fetching stats:', statsError);
            // Don't throw, just log - stats are not critical
          }

          if (statsData) {
            const totalValue = statsData.reduce((sum, m) => sum + (m.cost || 0), 0);
            const uniqueVehicles = new Set(statsData.map(m => m.vehicle_id)).size;

            setStats({
              total: statsData.length,
              totalValue,
              avgTicket: statsData.length > 0 ? totalValue / statsData.length : 0,
              uniqueVehicles,
            });
          }
        } else {
          setStats({ total: 0, totalValue: 0, avgTicket: 0, uniqueVehicles: 0 });
        }
      } catch (error: any) {
        console.error('Error loading maintenances:', error);
        toast({
          title: "Erro ao carregar dados",
          description: error?.message || "Não foi possível carregar o histórico.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMaintenances();
  }, [workshop, startDate, endDate, plateSearch, currentPage, sortField, sortOrder, toast]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (plateSearch) params.set('plate', plateSearch);
    if (clientSearch) params.set('client', clientSearch);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortField !== 'date') params.set('sort', sortField);
    if (sortOrder !== 'desc') params.set('order', sortOrder);

    setSearchParams(params, { replace: true });
  }, [startDate, endDate, plateSearch, clientSearch, currentPage, sortField, sortOrder, setSearchParams]);

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
    return date.toLocaleDateString('pt-BR');
  };

  // Format plate
  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  // Handle sort
  const handleSort = (field: 'date' | 'cost') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Handle filter
  const handleFilter = () => {
    setCurrentPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPlateSearch('');
    setClientSearch('');
    setCurrentPage(1);
  };

  // Copy public link
  const copyPublicLink = (token: string) => {
    const link = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a area de transferencia.",
    });
  };

  // Resend notification
  const handleResendEmail = async (maintenance: MaintenanceRecord) => {
    if (!workshop) return;

    // For now, just show a toast since we don't have client email stored
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O reenvio de notificacoes estara disponivel em breve.",
    });
  };

  // Export to Excel
  const handleExport = async () => {
    if (!workshop) return;

    if (workshop.plan === 'starter') {
      setShowUpgradeModal(true);
      return;
    }

    toast({
      title: "Exportando...",
      description: "Gerando arquivo Excel com os dados filtrados.",
    });

    // Simple CSV export for now
    try {
      const headers = ['Data', 'Placa', 'Veículo', 'Serviço', 'Valor', 'KM'];
      const rows = maintenances.map(m => [
        formatDate(m.date),
        formatPlate(m.vehicle.plate),
        `${m.vehicle.brand} ${m.vehicle.model} ${m.vehicle.year}`,
        m.service_type,
        m.cost.toString(),
        m.km.toString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historico-atendimentos-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportacao concluida!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o arquivo.",
        variant: "destructive",
      });
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const showingFrom = totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  if (!workshop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-xl font-bold">Historico de Atendimentos</h1>
                <p className="text-sm text-gray-500">Visualize todos os atendimentos realizados</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              className="hidden sm:flex"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
              {workshop.plan === 'starter' && (
                <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Data Inicio</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data Fim</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Placa</label>
                <Input
                  placeholder="ABC-1234"
                  value={plateSearch}
                  onChange={(e) => setPlateSearch(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cliente</label>
                <Input
                  placeholder="Nome do cliente"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleFilter} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                {(startDate || endDate || plateSearch || clientSearch) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-500">Atendimentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-xs text-gray-500">Valor Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-xl font-bold">{formatCurrency(stats.avgTicket)}</p>
                  <p className="text-xs text-gray-500">Ticket Medio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.uniqueVehicles}</p>
                  <p className="text-xs text-gray-500">Veículos Unicos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 flex-1" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : maintenances.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Nenhum atendimento encontrado</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {startDate || endDate || plateSearch || clientSearch
                    ? "Tente ajustar os filtros para ver mais resultados."
                    : "Comece cadastrando seu primeiro atendimento."}
                </p>
                {startDate || endDate || plateSearch || clientSearch ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/workshop/new-service')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Novo Atendimento
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center gap-1">
                            Data
                            <ArrowUpDown className="h-4 w-4" />
                            {sortField === 'date' && (
                              sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('cost')}
                        >
                          <div className="flex items-center gap-1">
                            Valor
                            <ArrowUpDown className="h-4 w-4" />
                            {sortField === 'cost' && (
                              sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenances.map((maintenance) => (
                        <Collapsible key={maintenance.id} asChild>
                          <>
                            <CollapsibleTrigger asChild>
                              <TableRow
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => setExpandedRow(
                                  expandedRow === maintenance.id ? null : maintenance.id
                                )}
                              >
                                <TableCell>{formatDate(maintenance.date)}</TableCell>
                                <TableCell className="font-mono font-medium">
                                  {formatPlate(maintenance.vehicle.plate)}
                                </TableCell>
                                <TableCell>
                                  {maintenance.vehicle.brand} {maintenance.vehicle.model}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {maintenance.service_type}
                                </TableCell>
                                <TableCell className="font-medium text-green-600">
                                  {formatCurrency(maintenance.cost)}
                                </TableCell>
                                <TableCell>
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      expandedRow === maintenance.id ? 'rotate-180' : ''
                                    }`}
                                  />
                                </TableCell>
                              </TableRow>
                            </CollapsibleTrigger>
                            <CollapsibleContent asChild>
                              <TableRow className={expandedRow === maintenance.id ? '' : 'hidden'}>
                                <TableCell colSpan={6} className="bg-gray-50 p-4">
                                  <div className="space-y-3">
                                    {/* Details */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-gray-500">Quilometragem</p>
                                        <p className="font-medium">{maintenance.km.toLocaleString('pt-BR')} km</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500">Ano</p>
                                        <p className="font-medium">{maintenance.vehicle.year}</p>
                                      </div>
                                    </div>

                                    {/* Notes */}
                                    {maintenance.notes && (
                                      <div>
                                        <p className="text-sm text-gray-500 mb-1">Observacoes</p>
                                        <p className="text-sm bg-white p-2 rounded border whitespace-pre-wrap">
                                          {maintenance.notes}
                                        </p>
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                      {maintenance.public_token && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyPublicLink(maintenance.public_token!);
                                          }}
                                        >
                                          <Copy className="h-3 w-3 mr-1" />
                                          Copiar Link
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/share/${maintenance.public_token}`);
                                        }}
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Ver Historico
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleResendEmail(maintenance);
                                        }}
                                      >
                                        <Mail className="h-3 w-3 mr-1" />
                                        Reenviar
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleContent>
                          </>
                        </Collapsible>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 space-y-4">
                  {maintenances.map((maintenance) => (
                    <Card key={maintenance.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-mono font-bold">
                              {formatPlate(maintenance.vehicle.plate)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {maintenance.vehicle.brand} {maintenance.vehicle.model}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatCurrency(maintenance.cost)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(maintenance.date)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{maintenance.service_type}</p>
                        <div className="flex gap-2">
                          {maintenance.public_token && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => copyPublicLink(maintenance.public_token!)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Link
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/share/${maintenance.public_token}`)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-gray-500">
                      Mostrando {showingFrom}-{showingTo} de {totalCount}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Proxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Recurso Professional
            </DialogTitle>
            <DialogDescription>
              A exportacao para Excel esta disponivel apenas no plano Professional.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Faca upgrade para desbloquear:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Download className="h-4 w-4 text-green-600" />
                Exportacao para Excel/CSV
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Relatorios avancados
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                500 veiculos/mes
              </li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowUpgradeModal(false);
                navigate('/workshop/settings');
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Fazer Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation - Mobile */}
      <WorkshopBottomNav />
    </div>
  );
};

export default WorkshopHistory;
