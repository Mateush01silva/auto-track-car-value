import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendMaintenanceWhatsApp, formatVehicleInfo } from "@/lib/notifications";
import {
  ArrowLeft,
  Search,
  Users,
  Car,
  Calendar,
  DollarSign,
  CheckCircle,
  UserPlus,
  History,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  AlertCircle,
  Crown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { WorkshopBottomNav } from "@/components/workshop/BottomNav";

interface Workshop {
  id: string;
  name: string;
  plan: string;
  phone: string | null;
  email: string | null;
  notification_copy_email: string | null;
}

type ClientSegment = "vip" | "regular" | "at-risk" | "new";

interface ClientData {
  plate: string;
  brand: string;
  model: string;
  year: number;
  vehicleId: string;
  userId: string | null;
  clientName: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  totalMaintenances: number;
  totalSpent: number;
  lastVisit: string;
  lastKm: number;
  maintenances: MaintenanceItem[];
  segment?: ClientSegment;
  loyaltyScore?: number;
}

interface MaintenanceItem {
  id: string;
  date: string;
  service_type: string;
  cost: number;
  km: number;
  public_token: string | null;
}

const WorkshopClients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load workshop
  useEffect(() => {
    const loadWorkshop = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('workshops')
        .select('id, name, plan, phone, email, notification_copy_email')
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

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      if (!workshop) return;

      setLoading(true);

      try {
        // Get maintenance IDs from workshop_maintenances
        const { data: workshopMaintenances } = await supabase
          .from('workshop_maintenances')
          .select('maintenance_id')
          .eq('workshop_id', workshop.id);

        const maintenanceIds = workshopMaintenances?.map(wm => wm.maintenance_id) || [];

        if (maintenanceIds.length === 0) {
          setClients([]);
          setFilteredClients([]);
          setLoading(false);
          return;
        }

        // Get all maintenances with vehicle data
        const { data: maintenancesData, error } = await supabase
          .from('maintenances')
          .select(`
            id,
            date,
            service_type,
            cost,
            km,
            notes,
            public_token,
            metadata,
            vehicles (
              id,
              plate,
              brand,
              model,
              year,
              user_id
            )
          `)
          .in('id', maintenanceIds)
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching maintenances:', error);
          throw error;
        }

        // Collect unique user_ids to fetch profile data
        const userIds = new Set<string>();
        for (const m of maintenancesData || []) {
          const vehicle = m.vehicles as any;
          if (vehicle?.user_id) {
            userIds.add(vehicle.user_id);
          }
        }

        // Fetch profiles for users
        let profilesMap = new Map<string, { full_name: string | null; phone: string | null; email: string | null }>();
        if (userIds.size > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, phone, email')
            .in('id', Array.from(userIds));

          if (profilesData) {
            for (const profile of profilesData) {
              profilesMap.set(profile.id, {
                full_name: profile.full_name,
                phone: profile.phone,
                email: profile.email,
              });
            }
          }
        }

        // Group by vehicle plate
        const clientsMap = new Map<string, ClientData>();

        for (const m of maintenancesData || []) {
          const vehicle = m.vehicles as any;
          if (!vehicle) continue;

          const plate = vehicle.plate;

          // Extract client info from metadata (for non-registered users)
          const metadata = m.metadata as Record<string, string> | null;
          let clientName = metadata?.pending_user_name || null;
          let clientPhone = metadata?.pending_user_phone || null;
          let clientEmail = metadata?.pending_user_email || null;

          // If user is registered, get data from profiles
          if (vehicle.user_id && profilesMap.has(vehicle.user_id)) {
            const profile = profilesMap.get(vehicle.user_id)!;
            clientName = profile.full_name || clientName;
            clientPhone = profile.phone || clientPhone;
            clientEmail = profile.email || clientEmail;
          }

          if (clientsMap.has(plate)) {
            const existing = clientsMap.get(plate)!;
            existing.totalMaintenances++;
            existing.totalSpent += m.cost || 0;
            existing.maintenances.push({
              id: m.id,
              date: m.date,
              service_type: m.service_type,
              cost: m.cost,
              km: m.km,
              public_token: m.public_token,
            });
            // Update last visit if this is more recent
            if (m.date > existing.lastVisit) {
              existing.lastVisit = m.date;
              existing.lastKm = m.km;
            }
            // Update client info if we have newer data
            if (!existing.clientName && clientName) existing.clientName = clientName;
            if (!existing.clientPhone && clientPhone) existing.clientPhone = clientPhone;
            if (!existing.clientEmail && clientEmail) existing.clientEmail = clientEmail;
          } else {
            clientsMap.set(plate, {
              plate,
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year,
              vehicleId: vehicle.id,
              userId: vehicle.user_id,
              clientName,
              clientPhone,
              clientEmail,
              totalMaintenances: 1,
              totalSpent: m.cost || 0,
              lastVisit: m.date,
              lastKm: m.km,
              maintenances: [{
                id: m.id,
                date: m.date,
                service_type: m.service_type,
                cost: m.cost,
                km: m.km,
                public_token: m.public_token,
              }],
            });
          }
        }

        // Convert to array
        let clientsList = Array.from(clientsMap.values());

        // Calculate average spending for segmentation
        const avgSpent = clientsList.length > 0
          ? clientsList.reduce((sum, c) => sum + c.totalSpent, 0) / clientsList.length
          : 0;

        // Add segmentation and loyalty score to each client
        clientsList = clientsList.map(client => {
          const [year, month, day] = client.lastVisit.split('-').map(Number);
          const last = new Date(year, month - 1, day);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

          const segment = determineSegment(client, daysSince, avgSpent);
          const loyaltyScore = calculateLoyaltyScore(client, daysSince, avgSpent);

          return {
            ...client,
            segment,
            loyaltyScore
          };
        });

        // Sort by segment priority (VIP > At Risk > Regular > New), then by loyalty score
        clientsList.sort((a, b) => {
          const segmentPriority = { vip: 4, 'at-risk': 3, regular: 2, new: 1 };
          const aPriority = segmentPriority[a.segment || 'regular'];
          const bPriority = segmentPriority[b.segment || 'regular'];

          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }

          return (b.loyaltyScore || 0) - (a.loyaltyScore || 0);
        });

        setClients(clientsList);
        setFilteredClients(clientsList);
      } catch (error) {
        console.error('Error loading clients:', error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [workshop, toast]);

  // Filter clients
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const search = searchTerm.toLowerCase();
    const filtered = clients.filter(client => {
      const plateMatch = client.plate.toLowerCase().includes(search);
      const nameMatch = client.clientName?.toLowerCase().includes(search);
      const modelMatch = `${client.brand} ${client.model}`.toLowerCase().includes(search);
      return plateMatch || nameMatch || modelMatch;
    });

    setFilteredClients(filtered);
  }, [searchTerm, clients]);

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

  // Get initials
  const getInitials = (name: string | null, plate: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return plate.substring(0, 2).toUpperCase();
  };

  // Calculate days since last visit - using split to avoid timezone issues
  const getDaysSinceVisit = (lastVisit: string) => {
    const [year, month, day] = lastVisit.split('-').map(Number);
    const last = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = now.getTime() - last.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Get return priority
  const getReturnPriority = (daysSince: number) => {
    // Assuming 90 days is typical service interval
    const daysUntilReturn = 90 - daysSince;

    if (daysUntilReturn > 30) {
      return { color: 'bg-green-100 text-green-700', label: `${daysUntilReturn}d`, status: 'ok' };
    } else if (daysUntilReturn > 15) {
      return { color: 'bg-yellow-100 text-yellow-700', label: `${daysUntilReturn}d`, status: 'soon' };
    } else if (daysUntilReturn > 0) {
      return { color: 'bg-orange-100 text-orange-700', label: `${daysUntilReturn}d`, status: 'urgent' };
    } else {
      return { color: 'bg-red-100 text-red-700', label: 'Atrasado', status: 'overdue' };
    }
  };

  // Calculate loyalty score (0-100)
  const calculateLoyaltyScore = (client: ClientData, daysSince: number, avgSpent: number): number => {
    // Visits score (40 points max)
    const visitsScore = Math.min(40, client.totalMaintenances * 5);

    // Spending score (30 points max) - compare to average
    const spendingRatio = avgSpent > 0 ? client.totalSpent / avgSpent : 1;
    const spendingScore = Math.min(30, spendingRatio * 15);

    // Recency score (30 points max) - inverse of days since last visit
    let recencyScore = 30;
    if (daysSince > 180) recencyScore = 5;
    else if (daysSince > 120) recencyScore = 10;
    else if (daysSince > 90) recencyScore = 15;
    else if (daysSince > 60) recencyScore = 20;
    else if (daysSince > 30) recencyScore = 25;

    return Math.round(visitsScore + spendingScore + recencyScore);
  };

  // Determine client segment
  const determineSegment = (client: ClientData, daysSince: number, avgSpent: number): ClientSegment => {
    // New clients: 1-2 visits
    if (client.totalMaintenances <= 2) {
      return "new";
    }

    // At Risk: haven't visited in 120+ days
    if (daysSince > 120) {
      return "at-risk";
    }

    // VIP: high value + frequent visits
    const isHighSpender = client.totalSpent > avgSpent * 1.5;
    const isFrequent = client.totalMaintenances >= 5;

    if (isHighSpender && isFrequent) {
      return "vip";
    }

    // Regular: everyone else
    return "regular";
  };

  // Get segment badge info
  const getSegmentBadge = (segment: ClientSegment) => {
    switch (segment) {
      case "vip":
        return {
          color: 'bg-purple-100 text-purple-700 border-purple-300',
          label: 'VIP',
          icon: Crown,
          description: 'Cliente de alto valor'
        };
      case "new":
        return {
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          label: 'Novo',
          icon: UserPlus,
          description: 'Cliente novo'
        };
      case "at-risk":
        return {
          color: 'bg-red-100 text-red-700 border-red-300',
          label: 'Em Risco',
          icon: AlertCircle,
          description: 'Cliente inativo há muito tempo'
        };
      case "regular":
        return {
          color: 'bg-green-100 text-green-700 border-green-300',
          label: 'Regular',
          icon: CheckCircle,
          description: 'Cliente ativo'
        };
    }
  };

  // Get loyalty score color
  const getLoyaltyScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Open client details
  const handleClientClick = (client: ClientData) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  // Start new service for client
  const handleNewService = (client: ClientData) => {
    // Store vehicle data in localStorage
    const vehicleData = {
      id: client.vehicleId,
      plate: client.plate,
      brand: client.brand,
      model: client.model,
      year: client.year,
      km: client.lastKm,
      isNew: false,
    };
    localStorage.setItem('workshop_new_service_vehicle', JSON.stringify(vehicleData));

    // If we have client info, store that too
    if (client.clientName || client.clientPhone) {
      const clientInfo = {
        name: client.clientName || '',
        phone: client.clientPhone || '',
        email: client.clientEmail || '',
        sendWhatsApp: true,
        sendEmail: !!client.clientEmail,
        userId: client.userId,
        isExistingUser: !!client.userId,
      };
      localStorage.setItem('workshop_new_service_client', JSON.stringify(clientInfo));
      // Skip to step 3
      navigate('/workshop/new-service/details');
    } else {
      // Go to step 2
      navigate('/workshop/new-service/client');
    }

    setShowModal(false);
  };

  // Send reminder via WhatsApp
  const handleSendReminderWhatsApp = (client: ClientData) => {
    if (!workshop) return;

    const daysSince = getDaysSinceVisit(client.lastVisit);
    const message = encodeURIComponent(
      `🔧 *${workshop.name}*\n\n` +
      `Olá! 👋\n\n` +
      `Já se passaram ${daysSince} dias desde a última manutenção do seu ${client.brand} ${client.model} (${formatPlate(client.plate)}).\n\n` +
      `Que tal agendar uma revisão preventiva?\n\n` +
      `📞 Entre em contato conosco para agendar!\n\n` +
      `🎁 Clientes Vybo têm benefícios exclusivos!`
    );

    let phone = client.clientPhone?.replace(/\D/g, '') || '';

    // Validação e formatação do número
    if (!phone) {
      toast({
        title: "Telefone não disponível",
        description: "Este cliente não tem telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    // Remove código do país se existir e adiciona 55 (Brasil)
    if (phone.startsWith('55') && phone.length > 12) {
      phone = phone.substring(2);
    }

    // Valida formato brasileiro (DDD + número)
    if (phone.length < 10 || phone.length > 11) {
      toast({
        title: "Número inválido",
        description: "O telefone deve ter 10 ou 11 dígitos (DDD + número).",
        variant: "destructive",
      });
      return;
    }

    const phoneWithCountry = `55${phone}`;

    // Usar api.whatsapp.com ao invés de wa.me para melhor compatibilidade
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${message}`;

    window.open(whatsappUrl, '_blank');
    toast({
      title: "WhatsApp aberto!",
      description: "A conversa será aberta no WhatsApp Web ou App.",
    });
  };

  // Send reminder via Email
  const handleSendReminderEmail = async (client: ClientData) => {
    if (!workshop || !client.clientEmail) {
      toast({
        title: "E-mail não disponível",
        description: "Este cliente não tem e-mail cadastrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const daysSince = getDaysSinceVisit(client.lastVisit);

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: client.clientEmail,
          subject: `[${workshop.name}] Hora de agendar sua revisão!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">🔧 ${workshop.name}</h2>
              <p>Olá${client.clientName ? ` ${client.clientName}` : ''}!</p>
              <p>Já se passaram <strong>${daysSince} dias</strong> desde a última manutenção do seu <strong>${client.brand} ${client.model}</strong> (${formatPlate(client.plate)}).</p>
              <p>Que tal agendar uma revisão preventiva? Manter seu veículo em dia evita problemas maiores no futuro!</p>
              <p>Entre em contato conosco para agendar:</p>
              <p>📞 ${workshop.phone || 'Telefone não informado'}<br/>
              📧 ${workshop.email || 'E-mail não informado'}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
              <p style="color: #6b7280; font-size: 12px;">
                🎁 Clientes Vybo têm benefícios exclusivos!
              </p>
            </div>
          `,
          from_name: workshop.name,
          bcc: workshop.notification_copy_email || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "E-mail enviado!",
        description: `Lembrete enviado para ${client.clientEmail}`,
      });
    } catch (error) {
      console.error('Error sending reminder email:', error);
      toast({
        title: "Erro ao enviar e-mail",
        description: "Não foi possível enviar o lembrete por e-mail.",
        variant: "destructive",
      });
    }
  };

  const isProfessional = workshop?.plan === 'professional' || workshop?.plan === 'enterprise';

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
                <h1 className="text-xl font-bold flex items-center gap-2">
                  CRM Inteligente
                  <Badge variant="secondary">{clients.length}</Badge>
                </h1>
                <p className="text-sm text-gray-500">Gestão inteligente de relacionamento com clientes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* CRM Info Banner */}
        {clients.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 rounded-full p-2">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    🎯 CRM Inteligente
                  </h3>
                  <p className="text-sm text-blue-700">
                    Veja seus clientes segmentados automaticamente por valor e comportamento.
                    Clientes <strong>VIP</strong> têm alto gasto e frequência, <strong>Em Risco</strong> não retornam há tempo,
                    <strong>Regulares</strong> são fiéis, e <strong>Novos</strong> acabaram de conhecer sua oficina.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24 mb-4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm
                  ? "Tente buscar com outros termos."
                  : "Seus clientes aparecerao aqui apos o primeiro atendimento."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => navigate('/workshop/new-service')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Atendimento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => {
              const daysSince = getDaysSinceVisit(client.lastVisit);
              const priority = getReturnPriority(daysSince);

              return (
                <Card
                  key={client.plate}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleClientClick(client)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-green-100 text-green-700 font-medium">
                          {getInitials(client.clientName, client.plate)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium truncate">
                            {client.clientName || formatPlate(client.plate)}
                          </h3>
                          {client.segment && (() => {
                            const segmentInfo = getSegmentBadge(client.segment);
                            const SegmentIcon = segmentInfo.icon;
                            return (
                              <Badge className={`${segmentInfo.color} text-xs border`}>
                                <SegmentIcon className="h-3 w-3 mr-1" />
                                {segmentInfo.label}
                              </Badge>
                            );
                          })()}
                          {client.userId && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Vybo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {client.brand} {client.model} {client.year}
                        </p>

                        {/* Loyalty Score */}
                        {client.loyaltyScore !== undefined && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Score de Fidelidade</span>
                              <span className={`font-semibold ${getLoyaltyScoreColor(client.loyaltyScore)}`}>
                                {client.loyaltyScore}/100
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  client.loyaltyScore >= 80 ? 'bg-green-600' :
                                  client.loyaltyScore >= 60 ? 'bg-blue-600' :
                                  client.loyaltyScore >= 40 ? 'bg-yellow-600' : 'bg-orange-600'
                                }`}
                                style={{ width: `${client.loyaltyScore}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <History className="h-3 w-3 text-gray-400" />
                            <span>{client.totalMaintenances} atend.</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-gray-400" />
                            <span>{formatCurrency(client.totalSpent)}</span>
                          </div>
                          <div className="flex items-center gap-1 col-span-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>Ultima: {formatDate(client.lastVisit)}</span>
                          </div>
                        </div>

                        {/* Next Return (Pro only) */}
                        {isProfessional ? (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Retorno em:</span>
                              <Badge className={`${priority.color} text-xs`}>
                                {priority.status === 'overdue' && (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                {priority.label}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="mt-3 pt-3 border-t opacity-50">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Retorno em:</span>
                                    <Badge variant="secondary" className="text-xs blur-sm">
                                      <Crown className="h-3 w-3 mr-1" />
                                      Pro
                                    </Badge>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Recurso disponivel no plano Professional</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Client Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-green-100 text-green-700 text-xl font-medium">
                      {getInitials(selectedClient.clientName, selectedClient.plate)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle>
                      {selectedClient.clientName || formatPlate(selectedClient.plate)}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedClient.brand} {selectedClient.model} {selectedClient.year}
                    </DialogDescription>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedClient.segment && (() => {
                        const segmentInfo = getSegmentBadge(selectedClient.segment);
                        const SegmentIcon = segmentInfo.icon;
                        return (
                          <Badge className={`${segmentInfo.color} text-xs border`}>
                            <SegmentIcon className="h-3 w-3 mr-1" />
                            {segmentInfo.label}
                          </Badge>
                        );
                      })()}
                      {selectedClient.userId && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Usuario Vybo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Loyalty Score */}
                {selectedClient.loyaltyScore !== undefined && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Score de Fidelidade</p>
                        <p className="text-xs text-gray-500">
                          {selectedClient.segment && getSegmentBadge(selectedClient.segment).description}
                        </p>
                      </div>
                      <div className={`text-3xl font-bold ${getLoyaltyScoreColor(selectedClient.loyaltyScore)}`}>
                        {selectedClient.loyaltyScore}
                        <span className="text-lg text-gray-400">/100</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          selectedClient.loyaltyScore >= 80 ? 'bg-green-600' :
                          selectedClient.loyaltyScore >= 60 ? 'bg-blue-600' :
                          selectedClient.loyaltyScore >= 40 ? 'bg-yellow-600' : 'bg-orange-600'
                        }`}
                        style={{ width: `${selectedClient.loyaltyScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>100</span>
                    </div>
                  </div>
                )}
                {/* Contact Info */}
                {(selectedClient.clientPhone || selectedClient.clientEmail) && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {selectedClient.clientPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedClient.clientPhone}</span>
                      </div>
                    )}
                    {selectedClient.clientEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedClient.clientEmail}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedClient.totalMaintenances}
                    </p>
                    <p className="text-xs text-gray-500">Atendimentos</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedClient.totalSpent)}
                    </p>
                    <p className="text-xs text-gray-500">Total Gasto</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedClient.totalSpent / selectedClient.totalMaintenances)}
                    </p>
                    <p className="text-xs text-gray-500">Ticket Medio</p>
                  </div>
                </div>

                {/* Recent Maintenances */}
                <div>
                  <h4 className="font-medium mb-2">Ultimos Atendimentos</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedClient.maintenances.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <div>
                          <p className="font-medium">{m.service_type}</p>
                          <p className="text-xs text-gray-500">{formatDate(m.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{formatCurrency(m.cost)}</p>
                          <p className="text-xs text-gray-500">{m.km.toLocaleString('pt-BR')} km</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleNewService(selectedClient)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    Novo Atendimento
                  </Button>

                  {isProfessional && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Enviar Lembrete
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleSendReminderWhatsApp(selectedClient)}
                          disabled={!selectedClient.clientPhone}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          WhatsApp
                          {!selectedClient.clientPhone && (
                            <span className="text-xs text-gray-400 ml-2">(sem telefone)</span>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSendReminderEmail(selectedClient)}
                          disabled={!selectedClient.clientEmail}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          E-mail
                          {!selectedClient.clientEmail && (
                            <span className="text-xs text-gray-400 ml-2">(sem e-mail)</span>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {selectedClient.maintenances[0]?.public_token && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate(`/share/${selectedClient.maintenances[0].public_token}`);
                        setShowModal(false);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Historico Completo
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation - Mobile */}
      <WorkshopBottomNav />
    </div>
  );
};

export default WorkshopClients;
