import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Settings, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Sempre true, não pode ser desativado
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Verificar se já existe consentimento salvo
    const consent = localStorage.getItem("vybo_cookie_consent");
    if (!consent) {
      // Aguardar 1 segundo para mostrar o banner (melhor UX)
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Carregar preferências salvas
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
      } catch (error) {
        console.error("Erro ao carregar preferências de cookies:", error);
      }
    }
  }, []);

  const saveConsent = async (prefs: CookiePreferences) => {
    // Salvar no localStorage
    localStorage.setItem("vybo_cookie_consent", JSON.stringify(prefs));
    localStorage.setItem("vybo_cookie_consent_date", new Date().toISOString());

    // Tentar salvar no banco de dados (se usuário estiver logado)
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Pegar IP e User Agent para log
        const userAgent = navigator.userAgent;

        await supabase.from("consent_logs").insert({
          user_id: user.id,
          consent_type: "cookies",
          consent_data: prefs,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Erro ao salvar consentimento no banco:", error);
      // Não bloquear a UX se falhar, pois já salvamos no localStorage
    }

    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);

    // Aplicar as preferências (ativar/desativar scripts)
    applyPreferences(prefs);
  };

  const applyPreferences = (prefs: CookiePreferences) => {
    // Google Analytics
    if (prefs.analytics) {
      // Ativar Google Analytics (se estiver configurado)
      if (window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "granted",
        });
      }
    } else {
      // Desativar Google Analytics
      if (window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
        });
      }
    }

    // Google Ads / Meta Pixel
    if (prefs.marketing) {
      if (window.gtag) {
        window.gtag("consent", "update", {
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
        });
      }
    } else {
      if (window.gtag) {
        window.gtag("consent", "update", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
    }
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const rejectOptional = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    saveConsent(onlyEssential);
  };

  const saveCustomPreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Banner de Cookies */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Cookies e Privacidade</h3>
                <p className="text-sm text-muted-foreground">
                  Usamos cookies para melhorar sua experiência, personalizar conteúdo e analisar o tráfego.{" "}
                  <Link to="/politica-de-cookies" className="text-primary hover:underline">
                    Saiba mais
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="flex-1 md:flex-none"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectOptional}
                className="flex-1 md:flex-none"
              >
                Rejeitar opcionais
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={acceptAll}
                className="flex-1 md:flex-none bg-success hover:bg-success/90"
              >
                Aceitar todos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de Configurações */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Configurações de Cookies
            </DialogTitle>
            <DialogDescription>
              Escolha quais tipos de cookies você deseja aceitar. Cookies essenciais são necessários para o
              funcionamento do site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Essenciais */}
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <Label className="text-base font-semibold">Cookies Essenciais</Label>
                <p className="text-sm text-muted-foreground">
                  Necessários para o funcionamento básico do site (login, navegação, segurança).
                </p>
              </div>
              <Switch checked={true} disabled className="mt-1" />
            </div>

            {/* Funcionais */}
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <Label htmlFor="functional" className="text-base font-semibold">
                  Cookies Funcionais
                </Label>
                <p className="text-sm text-muted-foreground">
                  Lembram suas preferências e configurações personalizadas.
                </p>
              </div>
              <Switch
                id="functional"
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, functional: checked })
                }
                className="mt-1"
              />
            </div>

            {/* Analíticos */}
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <Label htmlFor="analytics" className="text-base font-semibold">
                  Cookies Analíticos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Nos ajudam a entender como você usa o site para melhorar a experiência.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
                className="mt-1"
              />
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <Label htmlFor="marketing" className="text-base font-semibold">
                  Cookies de Marketing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permitem mostrar anúncios relevantes em outros sites.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={rejectOptional} className="w-full sm:w-auto">
              Rejeitar todos opcionais
            </Button>
            <Button onClick={saveCustomPreferences} className="w-full sm:w-auto bg-success hover:bg-success/90">
              Salvar preferências
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Declaração de tipos para window.gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default CookieConsent;
