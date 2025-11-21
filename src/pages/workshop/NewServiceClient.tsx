import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Car,
  User,
  Phone,
  Mail,
  CheckCircle,
  Info,
  Loader2,
  MessageCircle
} from "lucide-react";

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

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

const NewServiceClient = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Vehicle data from previous step
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);

  // Client form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);

  // User verification state
  const [checkingUser, setCheckingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [vehicleOwner, setVehicleOwner] = useState<UserProfile | null>(null);

  // Load vehicle data from localStorage
  useEffect(() => {
    const storedVehicle = localStorage.getItem('workshop_new_service_vehicle');
    if (!storedVehicle) {
      toast({
        title: "Veiculo nao encontrado",
        description: "Por favor, comece pela busca do veiculo.",
        variant: "destructive",
      });
      navigate('/workshop/new-service');
      return;
    }

    const vehicle = JSON.parse(storedVehicle);
    setVehicleData(vehicle);

    // If vehicle has owner, fetch their data
    if (vehicle.id && !vehicle.isNew) {
      fetchVehicleOwner(vehicle.id);
    } else {
      setLoading(false);
    }
  }, [navigate, toast]);

  // Fetch vehicle owner data
  const fetchVehicleOwner = async (vehicleId: string) => {
    try {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('user_id')
        .eq('id', vehicleId)
        .single();

      if (vehicle?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .eq('id', vehicle.user_id)
          .single();

        if (profile) {
          setVehicleOwner(profile);
          // Pre-fill form with owner data
          if (profile.full_name) setClientName(profile.full_name);
          if (profile.phone) setClientPhone(formatPhone(profile.phone));
          if (profile.email) {
            setClientEmail(profile.email);
            setSendEmail(true);
          }
          setFoundUser(profile);
        }
      }
    } catch (error) {
      console.error('Error fetching vehicle owner:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format phone as user types
  const formatPhone = (value: string) => {
    // Remove non-numeric characters
    let cleaned = value.replace(/\D/g, '');

    // Limit to 11 digits
    cleaned = cleaned.slice(0, 11);

    // Apply mask
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setClientPhone(formatted);

    // Check for existing user when phone is complete
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11 && !vehicleOwner) {
      checkExistingUser(null, cleaned);
    }
  };

  const handleEmailChange = (value: string) => {
    setClientEmail(value);

    // Enable email notification if email is valid
    if (isValidEmail(value)) {
      setSendEmail(true);
      // Check for existing user
      if (!vehicleOwner) {
        checkExistingUser(value, null);
      }
    }
  };

  // Validate email format
  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validate phone format
  const isValidPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  };

  // Check if client is already a WiseDrive user
  const checkExistingUser = async (email: string | null, phone: string | null) => {
    if (!email && !phone) return;

    setCheckingUser(true);
    try {
      let query = supabase.from('profiles').select('id, full_name, email, phone');

      if (email) {
        query = query.eq('email', email);
      } else if (phone) {
        query = query.eq('phone', phone);
      }

      const { data } = await query.single();

      if (data) {
        setFoundUser(data);
        // Pre-fill name if not already filled
        if (!clientName && data.full_name) {
          setClientName(data.full_name);
        }
      } else {
        setFoundUser(null);
      }
    } catch (error) {
      // User not found is expected
      setFoundUser(null);
    } finally {
      setCheckingUser(false);
    }
  };

  // Handle form submission
  const handleContinue = () => {
    // Validate required fields
    if (!clientName.trim()) {
      toast({
        title: "Nome obrigatorio",
        description: "Por favor, informe o nome do cliente.",
        variant: "destructive",
      });
      return;
    }

    if (!clientPhone.trim() || !isValidPhone(clientPhone)) {
      toast({
        title: "Telefone invalido",
        description: "Por favor, informe um telefone valido.",
        variant: "destructive",
      });
      return;
    }

    // Validate notification preferences
    if (!sendWhatsApp && !sendEmail) {
      toast({
        title: "Selecione uma opcao",
        description: "Selecione pelo menos um metodo de notificacao.",
        variant: "destructive",
      });
      return;
    }

    if (sendEmail && (!clientEmail || !isValidEmail(clientEmail))) {
      toast({
        title: "Email invalido",
        description: "Por favor, informe um email valido para enviar notificacao.",
        variant: "destructive",
      });
      return;
    }

    // Store client data for next step
    const clientData = {
      name: clientName.trim(),
      phone: clientPhone.replace(/\D/g, ''),
      email: clientEmail.trim() || null,
      sendWhatsApp,
      sendEmail,
      userId: foundUser?.id || vehicleOwner?.id || null,
      isExistingUser: !!(foundUser || vehicleOwner),
    };

    localStorage.setItem('workshop_new_service_client', JSON.stringify(clientData));
    navigate('/workshop/new-service/details');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workshop/new-service')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold">Novo Atendimento</h1>
              <p className="text-sm text-gray-500">Etapa 2 de 3 - Dados do Cliente</p>
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
              2
            </div>
            <div className="w-16 h-1 bg-gray-200 mx-2" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              3
            </div>
          </div>
        </div>

        {/* Vehicle Summary */}
        {vehicleData && (
          <Card className="mb-6 bg-gray-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Car className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-mono font-bold text-lg">
                    {vehicleData.plate.slice(0, 3)}-{vehicleData.plate.slice(3)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {vehicleData.brand} {vehicleData.model} {vehicleData.year}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Cliente
            </CardTitle>
            <CardDescription>
              Informe os dados de quem trouxe o veiculo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome completo *</Label>
              <Input
                id="client-name"
                placeholder="Joao da Silva"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="client-phone">Telefone/WhatsApp *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="client-phone"
                  placeholder="(11) 99999-9999"
                  value={clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="client-email">Email (opcional, mas recomendado)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="client-email"
                  type="email"
                  placeholder="joao@email.com"
                  value={clientEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User Found Badge */}
            {checkingUser && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Verificando cadastro...</span>
              </div>
            )}

            {(foundUser || vehicleOwner) && !checkingUser && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium text-sm">Cliente ja cadastrado no WiseDrive</span>
                </div>
                <p className="text-xs text-green-600">
                  Este atendimento aparecera automaticamente no app do cliente.
                </p>
              </div>
            )}

            {!foundUser && !vehicleOwner && !checkingUser && (clientPhone || clientEmail) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Info className="h-4 w-4" />
                  <span className="font-medium text-sm">Cliente recebera convite</span>
                </div>
                <p className="text-xs text-blue-600">
                  Enviaremos um link para ele ver o historico e criar conta no WiseDrive.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Enviar notificacao por:
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-whatsapp"
                checked={sendWhatsApp}
                onCheckedChange={(checked) => setSendWhatsApp(checked as boolean)}
              />
              <Label htmlFor="send-whatsapp" className="flex items-center gap-2 cursor-pointer">
                WhatsApp
                <Badge variant="secondary" className="text-xs">Recomendado</Badge>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                disabled={!clientEmail || !isValidEmail(clientEmail)}
              />
              <Label
                htmlFor="send-email"
                className={`cursor-pointer ${!clientEmail || !isValidEmail(clientEmail) ? 'text-gray-400' : ''}`}
              >
                Email {(!clientEmail || !isValidEmail(clientEmail)) && '(informe um email valido)'}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mb-6 bg-gray-50 border-dashed">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-700">Como funciona?</p>
                {foundUser || vehicleOwner ? (
                  <p className="text-xs text-gray-500 mt-1">
                    O cliente ja tem conta no WiseDrive. A manutencao aparecera automaticamente no app dele assim que voce finalizar o cadastro.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    O cliente recebera uma mensagem com link para ver o historico do veiculo. Ele podera criar uma conta gratuita para acompanhar todas as manutencoes.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/workshop/new-service')}
          >
            Voltar
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleContinue}
          >
            Continuar
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NewServiceClient;
