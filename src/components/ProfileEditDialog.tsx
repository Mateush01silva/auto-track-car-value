import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { BRAZILIAN_STATES, MUNICIPALITIES_BY_STATE } from "@/constants/brazilLocations";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: () => void;
}

export const ProfileEditDialog = ({ open, onOpenChange, onProfileUpdated }: ProfileEditDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Basic info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  
  // Location
  const [state, setState] = useState("");
  const [municipality, setMunicipality] = useState("");
  
  // Vehicle profile
  const [averageMonthlyKm, setAverageMonthlyKm] = useState("");
  const [vehiclesCount, setVehiclesCount] = useState("");
  const [vehicleUsageType, setVehicleUsageType] = useState("");
  const [residenceType, setResidenceType] = useState("");
  
  // Preferences
  const [preferredContact, setPreferredContact] = useState("email");
  const [mechanicalKnowledge, setMechanicalKnowledge] = useState("");
  const [maintenanceFrequency, setMaintenanceFrequency] = useState("");
  
  // Optional socioeconomic
  const [incomeRange, setIncomeRange] = useState("");
  const [profession, setProfession] = useState("");

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setDateOfBirth(data.date_of_birth || "");
        setGender(data.gender || "");
        setState(data.state || "");
        setMunicipality(data.municipality || "");
        setAverageMonthlyKm(data.average_monthly_km?.toString() || "");
        setVehiclesCount(data.vehicles_count?.toString() || "");
        setVehicleUsageType(data.vehicle_usage_type || "");
        setResidenceType(data.residence_type || "");
        setPreferredContact(data.preferred_contact || "email");
        setMechanicalKnowledge(data.mechanical_knowledge || "");
        setMaintenanceFrequency(data.maintenance_frequency || "");
        setIncomeRange(data.income_range || "");
        setProfession(data.profession || "");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          state: state || null,
          municipality: municipality || null,
          average_monthly_km: averageMonthlyKm ? parseInt(averageMonthlyKm) : null,
          vehicles_count: vehiclesCount ? parseInt(vehiclesCount) : null,
          vehicle_usage_type: vehicleUsageType || null,
          residence_type: residenceType || null,
          preferred_contact: preferredContact,
          mechanical_knowledge: mechanicalKnowledge || null,
          maintenance_frequency: maintenanceFrequency || null,
          income_range: incomeRange || null,
          profession: profession || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });

      onProfileUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableMunicipalities = state ? MUNICIPALITIES_BY_STATE[state] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações para melhorarmos seu acompanhamento.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Informações Básicas</h3>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Data de nascimento</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Sexo</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Localização</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select value={state} onValueChange={(value) => {
                    setState(value);
                    setMunicipality(""); // Reset municipality when state changes
                  }}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="municipality">Município</Label>
                  <Select 
                    value={municipality} 
                    onValueChange={setMunicipality}
                    disabled={!state}
                  >
                    <SelectTrigger id="municipality">
                      <SelectValue placeholder={state ? "Selecione..." : "Selecione o estado primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMunicipalities.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Perfil de Uso */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Perfil de Uso do Veículo</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="averageMonthlyKm">Km média mensal</Label>
                  <Input
                    id="averageMonthlyKm"
                    type="number"
                    placeholder="1000"
                    value={averageMonthlyKm}
                    onChange={(e) => setAverageMonthlyKm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehiclesCount">Quantos veículos possui</Label>
                  <Input
                    id="vehiclesCount"
                    type="number"
                    placeholder="1"
                    value={vehiclesCount}
                    onChange={(e) => setVehiclesCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleUsageType">Tipo de uso principal</Label>
                <Select value={vehicleUsageType} onValueChange={setVehicleUsageType}>
                  <SelectTrigger id="vehicleUsageType">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trabalho">Trabalho</SelectItem>
                    <SelectItem value="lazer">Lazer</SelectItem>
                    <SelectItem value="aplicativo">Aplicativo (Uber/99)</SelectItem>
                    <SelectItem value="frota">Frota/Empresa</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="residenceType">Tipo de residência</Label>
                <Select value={residenceType} onValueChange={setResidenceType}>
                  <SelectTrigger id="residenceType">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preferências e Comportamento */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Preferências e Comportamento</h3>
              
              <div className="space-y-2">
                <Label htmlFor="preferredContact">Canal preferido de contato</Label>
                <Select value={preferredContact} onValueChange={setPreferredContact}>
                  <SelectTrigger id="preferredContact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mechanicalKnowledge">Grau de conhecimento mecânico</Label>
                <Select value={mechanicalKnowledge} onValueChange={setMechanicalKnowledge}>
                  <SelectTrigger id="mechanicalKnowledge">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceFrequency">Frequência de manutenções</Label>
                <Select value={maintenanceFrequency} onValueChange={setMaintenanceFrequency}>
                  <SelectTrigger id="maintenanceFrequency">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventiva">Faço manutenções preventivas</SelectItem>
                    <SelectItem value="corretiva">Só quando dá problema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dados Socioeconômicos (Opcionais) */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Dados Socioeconômicos (Opcional)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="incomeRange">Faixa de renda aproximada</Label>
                <Select value={incomeRange} onValueChange={setIncomeRange}>
                  <SelectTrigger id="incomeRange">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ate-2k">Até R$ 2.000</SelectItem>
                    <SelectItem value="2k-5k">R$ 2.000 - R$ 5.000</SelectItem>
                    <SelectItem value="5k-10k">R$ 5.000 - R$ 10.000</SelectItem>
                    <SelectItem value="10k-20k">R$ 10.000 - R$ 20.000</SelectItem>
                    <SelectItem value="acima-20k">Acima de R$ 20.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profissão ou setor</Label>
                <Input
                  id="profession"
                  placeholder="Ex: Motorista, Engenheiro, Comerciante"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="default" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
