import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, ArrowLeft, Download, Trash2, Eye, Shield, Mail, Cookie as CookieIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PrivacySettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [consents, setConsents] = useState({
    marketing: false,
    dataSharing: false,
    notifications: true,
  });
  const [cookiePrefs, setCookiePrefs] = useState<any>(null);

  useEffect(() => {
    loadUserData();
    loadCookiePreferences();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Carregar consentimentos
      const { data: consentData } = await supabase
        .from("consent_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (consentData) {
        const latestConsents = {
          marketing: consentData.find((c) => c.consent_type === "marketing")?.granted || false,
          dataSharing: consentData.find((c) => c.consent_type === "data_sharing")?.granted || false,
          notifications: consentData.find((c) => c.consent_type === "notifications")?.granted ?? true,
        };
        setConsents(latestConsents);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar seus dados");
    }
  };

  const loadCookiePreferences = () => {
    const prefs = localStorage.getItem("vybo_cookie_consent");
    if (prefs) {
      setCookiePrefs(JSON.parse(prefs));
    }
  };

  const updateConsent = async (type: string, granted: boolean) => {
    if (!user) return;

    try {
      const userAgent = navigator.userAgent;

      await supabase.from("consent_logs").insert({
        user_id: user.id,
        consent_type: type,
        granted: granted,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      });

      setConsents({ ...consents, [type]: granted });
      toast.success("Preferência atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar consentimento:", error);
      toast.error("Erro ao atualizar preferência");
    }
  };

  const exportUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar todos os dados do usuário
      const [profileData, vehiclesData, maintenancesData, consentsData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("vehicles").select("*").eq("user_id", user.id),
        supabase.from("maintenances").select("*").eq("user_id", user.id),
        supabase.from("consent_logs").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        profile: profileData.data,
        vehicles: vehiclesData.data,
        maintenances: maintenancesData.data,
        consents: consentsData.data,
      };

      // Criar arquivo JSON para download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vybo_dados_${user.id}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Erro ao exportar seus dados");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Anonimizar dados antes de excluir
      await supabase
        .from("profiles")
        .update({
          name: `Usuário Excluído ${user.id.slice(0, 8)}`,
          email: `deleted_${user.id.slice(0, 8)}@vybo.com.br`,
          phone: null,
          address: null,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      // Desassociar veículos (manter históricos anonimizados)
      await supabase
        .from("vehicles")
        .update({
          user_id: null,
        })
        .eq("user_id", user.id);

      // Registrar solicitação de exclusão
      await supabase.from("consent_logs").insert({
        user_id: user.id,
        consent_type: "account_deletion",
        granted: true,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      });

      // Excluir conta do Auth (isso também remove de profiles devido ao CASCADE)
      const { error } = await supabase.rpc("delete_user");

      if (error) throw error;

      toast.success("Conta excluída com sucesso. Redirecionando...");

      // Aguardar 2 segundos e fazer logout
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast.error("Erro ao excluir conta. Entre em contato com o suporte.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Por favor, faça login para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">Vybo</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            Privacidade e Dados
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências de privacidade, visualize e exporte seus dados conforme a LGPD.
          </p>
        </div>

        <Tabs defaultValue="consents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="consents">Consentimentos</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
            <TabsTrigger value="data">Meus Dados</TabsTrigger>
            <TabsTrigger value="delete">Exclusão</TabsTrigger>
          </TabsList>

          {/* Aba de Consentimentos */}
          <TabsContent value="consents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Gerenciar Consentimentos
                </CardTitle>
                <CardDescription>
                  Controle como a Vybo usa seus dados e se comunica com você.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="marketing" className="text-base font-semibold">
                      📧 Marketing e Comunicações
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receber e-mails com novidades, promoções e conteúdos relevantes da Vybo.
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={consents.marketing}
                    onCheckedChange={(checked) => updateConsent("marketing", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="dataSharing" className="text-base font-semibold">
                      📊 Compartilhamento de Dados Agregados
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir que a Vybo compartilhe dados anonimizados com parceiros para pesquisas e análises de
                      mercado.
                    </p>
                  </div>
                  <Switch
                    id="dataSharing"
                    checked={consents.dataSharing}
                    onCheckedChange={(checked) => updateConsent("dataSharing", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="notifications" className="text-base font-semibold">
                      🔔 Notificações de Manutenção
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receber lembretes e alertas sobre manutenções do seu veículo.
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={consents.notifications}
                    onCheckedChange={(checked) => updateConsent("notifications", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Cookies */}
          <TabsContent value="cookies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CookieIcon className="h-5 w-5" />
                  Preferências de Cookies
                </CardTitle>
                <CardDescription>
                  Suas preferências de cookies atuais. Você pode alterá-las a qualquer momento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cookiePrefs ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">🔒 Essenciais</span>
                      <span className="text-sm text-green-600 font-semibold">Sempre Ativo</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">⚙️ Funcionais</span>
                      <span className={`text-sm font-semibold ${cookiePrefs.functional ? "text-green-600" : "text-red-600"}`}>
                        {cookiePrefs.functional ? "Ativo" : "Desativado"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">📊 Analíticos</span>
                      <span className={`text-sm font-semibold ${cookiePrefs.analytics ? "text-green-600" : "text-red-600"}`}>
                        {cookiePrefs.analytics ? "Ativo" : "Desativado"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">📢 Marketing</span>
                      <span className={`text-sm font-semibold ${cookiePrefs.marketing ? "text-green-600" : "text-red-600"}`}>
                        {cookiePrefs.marketing ? "Ativo" : "Desativado"}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        localStorage.removeItem("vybo_cookie_consent");
                        window.location.reload();
                      }}
                    >
                      Alterar Preferências de Cookies
                    </Button>

                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Ao clicar no botão acima, o banner de cookies será exibido novamente para você reconfigurar suas
                      preferências.
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma preferência de cookies encontrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Meus Dados */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Visualizar e Exportar Dados
                </CardTitle>
                <CardDescription>
                  Conforme a LGPD, você tem direito de acessar todos os dados que a Vybo possui sobre você.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">Dados Armazenados:</h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ Dados cadastrais (nome, e-mail, telefone)</li>
                    <li>✓ Informações de veículos</li>
                    <li>✓ Histórico de manutenções</li>
                    <li>✓ Logs de consentimentos</li>
                    <li>✓ Preferências de privacidade</li>
                  </ul>
                </div>

                <Button onClick={exportUserData} disabled={loading} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Exportando..." : "Exportar Todos os Meus Dados (JSON)"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Os dados serão exportados em formato JSON, que pode ser aberto em qualquer editor de texto.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Exclusão */}
          <TabsContent value="delete" className="space-y-4">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Excluir Minha Conta
                </CardTitle>
                <CardDescription>
                  Esta ação é permanente e não pode ser desfeita. Todos os seus dados pessoais serão anonimizados ou
                  excluídos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-destructive">O que acontece ao excluir sua conta:</h3>
                      <ul className="text-sm space-y-1 mt-2 text-muted-foreground">
                        <li>• Seus dados pessoais serão anonimizados</li>
                        <li>• Você não poderá mais acessar sua conta</li>
                        <li>• Históricos de manutenção ficarão anonimizados</li>
                        <li>• O processo é irreversível após 7 dias</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={loading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Solicitar Exclusão da Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>
                          Esta ação não pode ser desfeita. Sua conta será permanentemente excluída e todos os seus dados
                          pessoais serão anonimizados.
                        </p>
                        <p className="font-semibold text-destructive">
                          Você tem 7 dias para cancelar esta solicitação entrando em contato com o suporte.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Sim, excluir permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Links úteis */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Documentos de Privacidade</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link to="/politica-de-privacidade">
              <Button variant="link" className="p-0">
                📄 Política de Privacidade
              </Button>
            </Link>
            <Link to="/politica-de-cookies">
              <Button variant="link" className="p-0">
                🍪 Política de Cookies
              </Button>
            </Link>
            <a href="mailto:privacidade@vybo.com.br">
              <Button variant="link" className="p-0">
                📧 Contatar DPO (Encarregado de Dados)
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PrivacySettings;
