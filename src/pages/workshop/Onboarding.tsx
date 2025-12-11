import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Rocket,
  Building2,
  Image,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  Check,
  Loader2,
  Phone,
  MapPin,
  FileText,
  Star,
  Sparkles
} from "lucide-react";

interface WorkshopData {
  name: string;
  cnpj: string;
  phone: string;
  city: string;
  state: string;
}

const STEPS = [
  { id: 1, title: "Bem-vindo", icon: Rocket },
  { id: 2, title: "Dados", icon: Building2 },
  { id: 3, title: "Logo", icon: Image },
  { id: 4, title: "Plano", icon: CreditCard },
];

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const WorkshopOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [workshopId, setWorkshopId] = useState<string | null>(null);

  // Form data
  const [workshopData, setWorkshopData] = useState<WorkshopData>({
    name: "",
    cnpj: "",
    phone: "",
    city: "",
    state: "",
  });

  // Logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Selected plan
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "professional">("starter");

  // Load existing workshop data
  useEffect(() => {
    const loadWorkshop = async () => {
      if (!user) {
        navigate('/workshop/login');
        return;
      }

      // Check if there's saved progress
      const savedProgress = localStorage.getItem(`workshop_onboarding_${user.id}`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setCurrentStep(progress.step || 1);
        setWorkshopData(progress.data || workshopData);
      }

      // Fetch workshop data
      const { data: workshop, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching workshop:', error);
        // If no workshop exists, create one
        const { data: newWorkshop, error: createError } = await supabase
          .from('workshops')
          .insert({
            owner_id: user.id,
            name: user.user_metadata?.full_name || 'Minha Oficina',
            plan: 'starter',
            monthly_vehicle_limit: 150,
            current_month_vehicles: 0,
          })
          .select()
          .single();

        if (createError) {
          toast({
            title: "Erro",
            description: "Não foi possível criar a oficina.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setWorkshopId(newWorkshop.id);
        setWorkshopData({
          name: newWorkshop.name,
          cnpj: "",
          phone: "",
          city: "",
          state: "",
        });
      } else {
        setWorkshopId(workshop.id);
        setWorkshopData({
          name: workshop.name || "",
          cnpj: workshop.cnpj || "",
          phone: workshop.phone || "",
          city: workshop.city || "",
          state: workshop.state || "",
        });

        if (workshop.logo_url) {
          setLogoPreview(workshop.logo_url);
        }
      }
    };

    loadWorkshop();
  }, [user, navigate]);

  // Save progress to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`workshop_onboarding_${user.id}`, JSON.stringify({
        step: currentStep,
        data: workshopData,
      }));
    }
  }, [currentStep, workshopData, user]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O logo deve ter no máximo 2MB.",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !workshopId) return null;

    setUploadingLogo(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${workshopId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('workshop-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('workshop-logos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do logo.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleComplete = async () => {
    if (!workshopId) return;

    setLoading(true);
    try {
      // Upload logo if selected
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      // Calculate trial end date (30 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);

      // Update workshop with all data
      const updateData: any = {
        name: workshopData.name,
        phone: workshopData.phone,
        plan: selectedPlan,
        monthly_vehicle_limit: selectedPlan === 'professional' ? 400 : 150,
        onboarding_completed: true,
        trial_ends_at: trialEndsAt.toISOString(),
      };

      if (workshopData.cnpj) updateData.cnpj = workshopData.cnpj;
      if (workshopData.city) updateData.city = workshopData.city;
      if (workshopData.state) updateData.state = workshopData.state;
      if (logoUrl) updateData.logo_url = logoUrl;

      const { error } = await supabase
        .from('workshops')
        .update(updateData)
        .eq('id', workshopId);

      if (error) throw error;

      // Clear saved progress
      localStorage.removeItem(`workshop_onboarding_${user?.id}`);

      toast({
        title: "Tudo pronto!",
        description: "Comece cadastrando seu primeiro atendimento.",
      });

      navigate('/workshop/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-surface flex flex-col">
      {/* Progress Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              Passo {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm font-medium">{STEPS[currentStep - 1].title}</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCurrent ? 'bg-primary text-primary-foreground' :
                    isCompleted ? 'bg-success text-success-foreground' :
                    'bg-muted'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto max-w-2xl p-4 flex items-center justify-center">
        <Card className="w-full shadow-lg">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Bem-vindo ao Vybo!</CardTitle>
                <CardDescription className="text-base">
                  Vamos configurar sua oficina em 3 passos rápidos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 text-center">
                  <p className="text-muted-foreground">
                    O Vybo ajuda você a gerenciar atendimentos, manter histórico dos veículos
                    e fidelizar seus clientes.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">Histórico Digital</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Phone className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">Notificações</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Star className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">Fidelização</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  Começar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 2: Workshop Data */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Oficina
                </CardTitle>
                <CardDescription>
                  Informe os dados básicos da sua oficina
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Oficina *</Label>
                  <Input
                    id="name"
                    value={workshopData.name}
                    onChange={(e) => setWorkshopData({ ...workshopData, name: e.target.value })}
                    placeholder="Ex: Auto Center Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                  <Input
                    id="phone"
                    value={workshopData.phone}
                    onChange={(e) => setWorkshopData({ ...workshopData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                  <Input
                    id="cnpj"
                    value={workshopData.cnpj}
                    onChange={(e) => setWorkshopData({ ...workshopData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade (opcional)</Label>
                    <Input
                      id="city"
                      value={workshopData.city}
                      onChange={(e) => setWorkshopData({ ...workshopData, city: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado (opcional)</Label>
                    <select
                      id="state"
                      value={workshopData.state}
                      onChange={(e) => setWorkshopData({ ...workshopData, state: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Selecione</option>
                      {BRAZILIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                    disabled={!workshopData.name || !workshopData.phone}
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Logo Upload */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Logo da Oficina
                </CardTitle>
                <CardDescription>
                  Seu logo aparecerá nos relatórios enviados aos clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-32 h-32 object-contain rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-full cursor-pointer">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium">Clique para selecionar</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG até 2MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleNext}
                    className="flex-1"
                  >
                    Pular por enquanto
                  </Button>
                  {logoPreview && (
                    <Button onClick={handleNext} className="flex-1">
                      Próximo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Plan Selection */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Escolha seu Plano
                </CardTitle>
                <CardDescription>
                  Comece gratuitamente e faça upgrade quando precisar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-success/10 text-success text-sm p-3 rounded-lg text-center font-medium">
                  30 dias grátis para testar todos os recursos!
                </div>

                <div className="grid gap-4">
                  {/* Starter Plan */}
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPlan === 'starter'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlan('starter')}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          Starter
                          {selectedPlan === 'starter' && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </h3>
                        <p className="text-2xl font-bold mt-1">Grátis</p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-success" />
                        150 veículos/mês
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-success" />
                        Cadastro de serviços
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-success" />
                        Link público
                      </li>
                    </ul>
                  </div>

                  {/* Professional Plan */}
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                      selectedPlan === 'professional'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlan('professional')}
                  >
                    <Badge className="absolute -top-2 right-4 bg-success">
                      Recomendado
                    </Badge>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          Professional
                          {selectedPlan === 'professional' && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </h3>
                        <p className="text-2xl font-bold mt-1">
                          R$ 199<span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-success" />
                        400 veículos/mês
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-success" />
                        CRM de clientes
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-success" />
                        Lembretes automáticos
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-success" />
                        Exportação CSV
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        Começar com {selectedPlan === 'starter' ? 'Starter' : 'Professional'}
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
        </p>
      </div>
    </div>
  );
};

export default WorkshopOnboarding;
