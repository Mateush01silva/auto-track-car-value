import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendMaintenanceEmail, formatServicesForEmail, formatVehicleInfo } from "@/lib/notifications";
import {
  ArrowLeft,
  Car,
  User,
  Plus,
  X,
  FileText,
  CheckCircle,
  Loader2,
  ChevronDown,
  Copy,
  MessageCircle,
  Mail,
  ExternalLink,
  ClipboardList
} from "lucide-react";

interface Workshop {
  id: string;
  name: string;
  plan: string;
  monthly_vehicle_limit: number;
  current_month_vehicles: number;
}

interface VehicleData {
  id?: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  km?: number;
  isNew: boolean;
}

interface ClientData {
  name: string;
  phone: string;
  email: string | null;
  sendWhatsApp: boolean;
  sendEmail: boolean;
  userId: string | null;
  isExistingUser: boolean;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
}

interface Template {
  name: string;
  items: { name: string; price: number }[];
  total: number;
}

// Default templates available to all plans
const DEFAULT_TEMPLATES: Template[] = [
  {
    name: "Troca de Oleo + Filtros",
    items: [
      { name: "Oleo motor (4L)", price: 100 },
      { name: "Filtro oleo", price: 35 },
      { name: "Filtro ar", price: 45 },
    ],
    total: 180,
  },
  {
    name: "Revisao 10.000 km",
    items: [
      { name: "Troca oleo + filtros", price: 180 },
      { name: "Check freios", price: 50 },
      { name: "Alinhamento", price: 80 },
    ],
    total: 310,
  },
  {
    name: "Revisao 20.000 km",
    items: [
      { name: "Revisao 10k", price: 310 },
      { name: "Velas", price: 120 },
      { name: "Filtro combustivel", price: 60 },
    ],
    total: 490,
  },
];

const NewServiceDetails = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Workshop and data state
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Form state
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedData, setSavedData] = useState<{
    maintenanceId: string;
    publicToken: string;
    publicLink: string;
  } | null>(null);

  // Load data from localStorage and fetch workshop
  useEffect(() => {
    const loadData = async () => {
      // Load vehicle data
      const storedVehicle = localStorage.getItem('workshop_new_service_vehicle');
      if (!storedVehicle) {
        toast({
          title: "Dados nao encontrados",
          description: "Por favor, comece pela busca do veiculo.",
          variant: "destructive",
        });
        navigate('/workshop/new-service');
        return;
      }

      // Load client data
      const storedClient = localStorage.getItem('workshop_new_service_client');
      if (!storedClient) {
        toast({
          title: "Dados do cliente nao encontrados",
          description: "Por favor, preencha os dados do cliente.",
          variant: "destructive",
        });
        navigate('/workshop/new-service/client');
        return;
      }

      setVehicleData(JSON.parse(storedVehicle));
      setClientData(JSON.parse(storedClient));

      // Fetch workshop data
      if (user) {
        const { data, error } = await supabase
          .from('workshops')
          .select('id, name, plan, monthly_vehicle_limit, current_month_vehicles')
          .eq('owner_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching workshop:', error);
          navigate('/workshop/dashboard');
          return;
        }

        setWorkshop(data);
      }

      setLoading(false);
    };

    loadData();
  }, [user, navigate, toast]);

  // Generate unique ID for service items
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add new service item
  const addServiceItem = () => {
    setServiceItems([
      ...serviceItems,
      { id: generateId(), name: "", price: 0 }
    ]);
  };

  // Remove service item
  const removeServiceItem = (id: string) => {
    setServiceItems(serviceItems.filter(item => item.id !== id));
  };

  // Update service item
  const updateServiceItem = (id: string, field: 'name' | 'price', value: string | number) => {
    setServiceItems(serviceItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Apply template
  const applyTemplate = (template: Template) => {
    const newItems = template.items.map(item => ({
      id: generateId(),
      name: item.name,
      price: item.price,
    }));
    setServiceItems([...serviceItems, ...newItems]);
    toast({
      title: "Template aplicado",
      description: `${template.name} adicionado aos servicos.`,
    });
  };

  // Calculate total
  const calculateTotal = () => {
    return serviceItems.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Generate public token
  const generatePublicToken = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Handle save
  const handleSave = async () => {
    // Validations
    if (serviceItems.length === 0) {
      toast({
        title: "Adicione servicos",
        description: "Adicione pelo menos um servico realizado.",
        variant: "destructive",
      });
      return;
    }

    const invalidItems = serviceItems.filter(item => !item.name.trim() || item.price <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: "Itens invalidos",
        description: "Todos os itens devem ter nome e valor maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!workshop || !vehicleData || !clientData) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, reinicie o processo.",
        variant: "destructive",
      });
      return;
    }

    // Check monthly limit
    if (workshop.current_month_vehicles >= workshop.monthly_vehicle_limit) {
      toast({
        title: "Limite mensal atingido",
        description: `Voce atingiu o limite de ${workshop.monthly_vehicle_limit} veiculos. Faca upgrade do plano.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      let vehicleId = vehicleData.id;

      // A. If vehicle is new, create it
      if (vehicleData.isNew) {
        const { data: newVehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            plate: vehicleData.plate,
            brand: vehicleData.brand,
            model: vehicleData.model,
            year: vehicleData.year,
            color: vehicleData.color || null,
            current_mileage: vehicleData.km || null,
            user_id: clientData.userId || null,
          })
          .select('id')
          .single();

        if (vehicleError) {
          throw vehicleError;
        }

        vehicleId = newVehicle.id;
      }

      // B. Create maintenance record
      const publicToken = generatePublicToken();
      const servicesDescription = serviceItems.map(item => `${item.name}: ${formatCurrency(item.price)}`).join('\n');
      const total = calculateTotal();

      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenances')
        .insert({
          vehicle_id: vehicleId,
          user_id: clientData.userId || null,
          service_type: serviceItems.length === 1 ? serviceItems[0].name : 'Servicos Diversos',
          notes: `${servicesDescription}\n\n${notes}`.trim(),
          cost: total,
          date: new Date().toISOString().split('T')[0],
          km: vehicleData.km || 0,
          created_by_workshop_id: workshop.id,
          is_public: true,
          public_token: publicToken,
        })
        .select('id')
        .single();

      if (maintenanceError) {
        throw maintenanceError;
      }

      // C. Create workshop_maintenances record
      const { error: wmError } = await supabase
        .from('workshop_maintenances')
        .insert({
          maintenance_id: maintenance.id,
          workshop_id: workshop.id,
        });

      if (wmError) {
        throw wmError;
      }

      // D. Update workshop vehicle count
      const { error: updateError } = await supabase
        .from('workshops')
        .update({
          current_month_vehicles: workshop.current_month_vehicles + 1,
        })
        .eq('id', workshop.id);

      if (updateError) {
        console.error('Error updating vehicle count:', updateError);
      }

      // Generate public link
      const publicLink = `${window.location.origin}/report/${vehicleId}?token=${publicToken}`;

      // Set saved data and show success modal
      setSavedData({
        maintenanceId: maintenance.id,
        publicToken,
        publicLink,
      });

      // Clear localStorage
      localStorage.removeItem('workshop_new_service_vehicle');
      localStorage.removeItem('workshop_new_service_client');

      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('Error saving maintenance:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar o atendimento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Copy link to clipboard
  const copyLink = () => {
    if (savedData?.publicLink) {
      navigator.clipboard.writeText(savedData.publicLink);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a area de transferencia.",
      });
    }
  };

  // Send WhatsApp
  const sendWhatsApp = () => {
    if (!clientData || !savedData) return;

    const message = encodeURIComponent(
      `Ola ${clientData.name}!\n\n` +
      `Seu atendimento na ${workshop?.name} foi registrado.\n\n` +
      `Veiculo: ${vehicleData?.plate} - ${vehicleData?.brand} ${vehicleData?.model}\n` +
      `Total: ${formatCurrency(calculateTotal())}\n\n` +
      `Acesse o historico completo:\n${savedData.publicLink}`
    );

    window.open(`https://wa.me/55${clientData.phone}?text=${message}`, '_blank');
  };

  // Send Email via SendGrid
  const sendEmail = async () => {
    if (!clientData || !savedData || !vehicleData || !workshop) return;

    setSendingEmail(true);
    try {
      await sendMaintenanceEmail({
        clientName: clientData.name,
        clientEmail: clientData.email!,
        workshopName: workshop.name,
        vehicleInfo: formatVehicleInfo(
          vehicleData.brand,
          vehicleData.model,
          vehicleData.year,
          vehicleData.plate
        ),
        servicesSummary: formatServicesForEmail(
          serviceItems.map(s => ({ name: s.name, price: s.price }))
        ),
        total: calculateTotal(),
        publicLink: savedData.publicLink
      });

      toast({
        title: "Email enviado!",
        description: `Email enviado para ${clientData.email}`,
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Nao foi possivel enviar o email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workshop/new-service/client')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold">Novo Atendimento</h1>
              <p className="text-sm text-gray-500">Etapa 3 de 3 - Servicos Realizados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="w-16 h-1 bg-green-600 mx-2" />
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="w-16 h-1 bg-green-600 mx-2" />
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
              3
            </div>
          </div>
        </div>

        {/* Collapsible Summary */}
        <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
          <Card className="mb-6 bg-gray-50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-100 transition-colors pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Car className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-mono font-bold">
                        {vehicleData?.plate.slice(0, 3)}-{vehicleData?.plate.slice(3)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {vehicleData?.brand} {vehicleData?.model} | {clientData?.name}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${!isCollapsed ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 border-t">
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Veiculo</p>
                    <p className="text-sm">{vehicleData?.brand} {vehicleData?.model} {vehicleData?.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cliente</p>
                    <p className="text-sm">{clientData?.name}</p>
                    <p className="text-xs text-gray-500">{clientData?.phone}</p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Templates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Templates Rapidos
            </CardTitle>
            <CardDescription>Clique para adicionar servicos pre-definidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_TEMPLATES.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-between h-auto py-3"
                  onClick={() => applyTemplate(template)}
                >
                  <span>{template.name}</span>
                  <Badge variant="secondary">{formatCurrency(template.total)}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Servicos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum servico adicionado. Use um template ou adicione manualmente.
              </p>
            ) : (
              serviceItems.map((item) => (
                <div key={item.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Nome do servico/peca"
                      value={item.name}
                      onChange={(e) => updateServiceItem(item.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={item.price || ''}
                        onChange={(e) => updateServiceItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeServiceItem(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={addServiceItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </CardContent>
        </Card>

        {/* Total */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Total</span>
              <span className="text-3xl font-bold text-green-600">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Observacoes (opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Observacoes sobre os servicos realizados..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {notes.length}/500
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="container mx-auto max-w-2xl flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (serviceItems.length > 0) {
                if (confirm('Tem certeza que deseja cancelar? Os dados serao perdidos.')) {
                  localStorage.removeItem('workshop_new_service_vehicle');
                  localStorage.removeItem('workshop_new_service_client');
                  navigate('/workshop/dashboard');
                }
              } else {
                navigate('/workshop/dashboard');
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar e Enviar'
            )}
          </Button>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto bg-green-100 rounded-full p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center">Atendimento Registrado!</DialogTitle>
            <DialogDescription className="text-center">
              O atendimento foi salvo com sucesso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Veiculo</span>
                <span className="text-sm font-medium">
                  {vehicleData?.plate} - {vehicleData?.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cliente</span>
                <span className="text-sm font-medium">{clientData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {clientData?.sendWhatsApp && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={sendWhatsApp}
                >
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  Enviar WhatsApp
                </Button>
              )}

              {clientData?.sendEmail && clientData?.email && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={sendEmail}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2 text-blue-600" />
                      Enviar Email
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={copyLink}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/workshop/dashboard')}
              >
                Dashboard
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/workshop/new-service');
                }}
              >
                Novo Atendimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewServiceDetails;
