import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ArrowLeft,
  Building2,
  Upload,
  Loader2,
  CheckCircle,
  CreditCard,
  Bell,
  Puzzle,
  Image as ImageIcon,
  Save,
  Mail,
  MessageCircle,
  Crown,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface Workshop {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  monthly_vehicle_limit: number;
  current_month_vehicles: number;
}

// Brazilian states
const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapa" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceara" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espirito Santo" },
  { value: "GO", label: "Goias" },
  { value: "MA", label: "Maranhao" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Para" },
  { value: "PB", label: "Paraiba" },
  { value: "PR", label: "Parana" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piaui" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondonia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "Sao Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const WorkshopSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
  });

  // Notification settings (local state for now)
  const [notificationSettings, setNotificationSettings] = useState({
    defaultSendEmail: true,
    defaultSendWhatsApp: true,
    copyEmail: "",
  });

  // Load workshop data
  useEffect(() => {
    const loadWorkshop = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching workshop:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Nao foi possivel carregar os dados da oficina.",
          variant: "destructive",
        });
        navigate('/workshop/dashboard');
        return;
      }

      setWorkshop(data);
      setFormData({
        name: data.name || "",
        cnpj: data.cnpj || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
      });
      setLoading(false);
    };

    loadWorkshop();
  }, [user, navigate, toast]);

  // Format CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  // Format phone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !workshop) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo invalido",
        description: "Por favor, selecione uma imagem (PNG, JPG).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho maximo e 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${workshop.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('workshop-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('workshop-logos')
        .getPublicUrl(filePath);

      // Update workshop with new logo URL
      const { error: updateError } = await supabase
        .from('workshops')
        .update({ logo_url: publicUrl })
        .eq('id', workshop.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setWorkshop(prev => prev ? { ...prev, logo_url: publicUrl } : null);

      toast({
        title: "Logo atualizado!",
        description: "O logo da oficina foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erro ao enviar logo",
        description: error.message || "Nao foi possivel enviar o logo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!workshop) return;

    // Validate name
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatorio",
        description: "Por favor, informe o nome da oficina.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Email invalido",
        description: "Por favor, informe um email valido.",
        variant: "destructive",
      });
      return;
    }

    // Validate CNPJ format if provided
    if (formData.cnpj && formData.cnpj.replace(/\D/g, '').length !== 14) {
      toast({
        title: "CNPJ invalido",
        description: "Por favor, informe um CNPJ valido com 14 digitos.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('workshops')
        .update({
          name: formData.name.trim(),
          cnpj: formData.cnpj.replace(/\D/g, '') || null,
          phone: formData.phone.replace(/\D/g, '') || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state || null,
        })
        .eq('id', workshop.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Alteracoes salvas!",
        description: "Os dados da oficina foram atualizados.",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Nao foi possivel salvar as alteracoes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate trial days remaining
  const getTrialDaysRemaining = () => {
    if (!workshop?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(workshop.trial_ends_at);
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Calculate days until reset
  const getDaysUntilReset = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diff = nextMonth.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Get plan display name
  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'starter': return 'Starter';
      case 'professional': return 'Professional';
      case 'enterprise': return 'Enterprise';
      default: return plan;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <Badge className="bg-yellow-500">Trial</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
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
              <h1 className="text-xl font-bold">Configuracoes</h1>
              <p className="text-sm text-gray-500">{workshop?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="profile" className="text-xs sm:text-sm">
              <Building2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-xs sm:text-sm">
              <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Plano</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              <Bell className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Notificacoes</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs sm:text-sm">
              <Puzzle className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Integracoes</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Perfil da Oficina</CardTitle>
                <CardDescription>
                  Informacoes que aparecerao nos relatorios enviados aos clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label>Logo da Oficina</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-20 border rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                      {workshop?.logo_url ? (
                        <img
                          src={workshop.logo_url}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Alterar Logo
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG ou JPG, max 2MB. Ideal: 400x160px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Oficina *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome da sua oficina"
                  />
                </div>

                {/* CNPJ */}
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>

                {/* Phone and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contato@oficina.com"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Endereco</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Rua, numero, bairro..."
                    rows={2}
                  />
                </div>

                {/* City and State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Sao Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => handleInputChange('state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZILIAN_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alteracoes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan">
            <div className="space-y-6">
              {/* Current Plan Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Plano {getPlanName(workshop?.plan || 'starter')}
                      </CardTitle>
                      <CardDescription>Seu plano atual</CardDescription>
                    </div>
                    {getStatusBadge(workshop?.subscription_status || 'trial')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trial Info */}
                  {workshop?.subscription_status === 'trial' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                          {getTrialDaysRemaining()} dias restantes no periodo de teste
                        </span>
                      </div>
                      <Progress
                        value={(getTrialDaysRemaining() / 30) * 100}
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Monthly Usage */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Uso Mensal</span>
                      <span className="text-sm text-gray-500">
                        {workshop?.current_month_vehicles} de {workshop?.monthly_vehicle_limit} veiculos
                      </span>
                    </div>
                    <Progress
                      value={((workshop?.current_month_vehicles || 0) / (workshop?.monthly_vehicle_limit || 150)) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Reseta em {getDaysUntilReset()} dias
                    </p>
                  </div>

                  {/* Plan Benefits */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Beneficios inclusos:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Ate {workshop?.monthly_vehicle_limit} veiculos/mes
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Notificacoes por Email
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Notificacoes por WhatsApp (manual)
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Link publico para clientes
                      </li>
                      {workshop?.plan === 'professional' && (
                        <>
                          <li className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Templates personalizados
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Relatorios avancados
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Upgrade Card */}
              {workshop?.plan === 'starter' && (
                <Card className="border-2 border-green-500">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Upgrade para Professional</h3>
                      <p className="text-gray-600 mb-4">
                        Desbloqueie recursos avancados e aumente seu limite mensal
                      </p>
                      <ul className="text-left space-y-2 mb-6 max-w-xs mx-auto">
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          500 veiculos/mes
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Templates personalizados
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Relatorios avancados
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Suporte prioritario
                        </li>
                      </ul>
                      <Button className="bg-green-600 hover:bg-green-700">
                        Fazer Upgrade
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configuracoes de Notificacao</CardTitle>
                <CardDescription>
                  Defina como deseja notificar seus clientes por padrao
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Email */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Enviar email por padrao
                    </Label>
                    <p className="text-sm text-gray-500">
                      Checkbox de email vira marcado ao cadastrar atendimento
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.defaultSendEmail}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, defaultSendEmail: checked }))
                    }
                  />
                </div>

                {/* Default WhatsApp */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Enviar WhatsApp por padrao
                    </Label>
                    <p className="text-sm text-gray-500">
                      Checkbox de WhatsApp vira marcado ao cadastrar atendimento
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.defaultSendWhatsApp}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, defaultSendWhatsApp: checked }))
                    }
                  />
                </div>

                {/* Copy Email */}
                <div className="space-y-2">
                  <Label htmlFor="copyEmail">Email para copia (opcional)</Label>
                  <Input
                    id="copyEmail"
                    type="email"
                    value={notificationSettings.copyEmail}
                    onChange={(e) =>
                      setNotificationSettings(prev => ({ ...prev, copyEmail: e.target.value }))
                    }
                    placeholder="copia@oficina.com"
                  />
                  <p className="text-xs text-gray-500">
                    Receba uma copia de todos os emails enviados aos clientes
                  </p>
                </div>

                {/* Preview Button */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreviewModal(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Ver Preview da Notificacao
                  </Button>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      toast({
                        title: "Configuracoes salvas!",
                        description: "As preferencias de notificacao foram atualizadas.",
                      });
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Preferencias
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integracoes</CardTitle>
                <CardDescription>
                  Conecte o WiseDrive com outros sistemas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Puzzle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Em Breve
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Estamos trabalhando em integracoes com sistemas de gestao para facilitar seu dia a dia.
                  </p>

                  <div className="space-y-3 max-w-xs mx-auto">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-50">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500">API</span>
                      </div>
                      <span className="text-sm text-gray-600">API REST</span>
                      <Badge variant="secondary" className="ml-auto text-xs">Em breve</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-50">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500">WH</span>
                      </div>
                      <span className="text-sm text-gray-600">Webhooks</span>
                      <Badge variant="secondary" className="ml-auto text-xs">Em breve</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-50">
                      <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600">Z</span>
                      </div>
                      <span className="text-sm text-gray-600">Zapier</span>
                      <Badge variant="secondary" className="ml-auto text-xs">Em breve</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Email Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Email</DialogTitle>
            <DialogDescription>
              Exemplo de como o cliente recebera a notificacao
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            {/* Email Header */}
            <div className="bg-green-600 text-white p-6 text-center">
              <h2 className="text-xl font-bold">{workshop?.name || 'Sua Oficina'}</h2>
            </div>
            {/* Email Content */}
            <div className="p-6 space-y-4">
              <p className="text-lg">Ola Cliente!</p>
              <p>Seu veiculo foi atendido com sucesso em nossa oficina.</p>
              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Veiculo</p>
                <p className="font-bold">Chevrolet Onix 2022 (ABC-1234)</p>
              </div>
              <div className="border-2 border-green-600 rounded-lg p-4">
                <p className="text-green-600 font-bold mb-2">Servicos Realizados</p>
                <p>Troca de oleo, Filtro ar, Alinhamento</p>
                <div className="border-t mt-3 pt-3">
                  <p className="text-xl font-bold text-green-600">Total: R$ 310,00</p>
                </div>
              </div>
              <div className="text-center">
                <Button className="bg-green-600 hover:bg-green-700">
                  Ver Historico Completo
                </Button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <strong className="text-yellow-700">Novidade!</strong> Baixe o app WiseDrive e tenha todo o historico de manutencao do seu veiculo na palma da mao. Gratis!
              </div>
            </div>
            {/* Email Footer */}
            <div className="bg-gray-50 border-t p-4 text-center text-xs text-gray-500">
              <p>Este email foi enviado por <strong>{workshop?.name}</strong> via WiseDrive</p>
              <p>&copy; 2024 WiseDrive - Sistema de Gestao Automotiva</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkshopSettings;
