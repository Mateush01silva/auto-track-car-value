import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Send,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  email: string;
  name: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  lastVisit?: string;
  totalSpent?: number;
}

interface BulkEmailModalProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  workshopName: string;
}

interface SendResult {
  email: string;
  success: boolean;
  error?: string;
}

export const BulkEmailModal = ({
  open,
  onClose,
  clients,
  workshopName,
}: BulkEmailModalProps) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SendResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const mergeTags = [
    { tag: "{nome_cliente}", description: "Nome do cliente" },
    { tag: "{marca_veiculo}", description: "Marca do veículo" },
    { tag: "{modelo_veiculo}", description: "Modelo do veículo" },
    { tag: "{ano_veiculo}", description: "Ano do veículo" },
    { tag: "{placa}", description: "Placa do veículo" },
    { tag: "{ultimo_atendimento}", description: "Data do último atendimento" },
    { tag: "{total_gasto}", description: "Total gasto histórico" },
    { tag: "{oficina}", description: "Nome da oficina" },
  ];

  const replaceMergeTags = (text: string, client: Client): string => {
    return text
      .replace(/{nome_cliente}/g, client.name || "Cliente")
      .replace(/{marca_veiculo}/g, client.brand)
      .replace(/{modelo_veiculo}/g, client.model)
      .replace(/{ano_veiculo}/g, client.year.toString())
      .replace(/{placa}/g, client.plate)
      .replace(
        /{ultimo_atendimento}/g,
        client.lastVisit
          ? new Date(client.lastVisit).toLocaleDateString("pt-BR")
          : "N/A"
      )
      .replace(
        /{total_gasto}/g,
        client.totalSpent
          ? new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(client.totalSpent)
          : "R$ 0,00"
      )
      .replace(/{oficina}/g, workshopName);
  };

  const getPreviewEmail = () => {
    if (clients.length === 0) return { subject: "", body: "" };
    const firstClient = clients[0];
    return {
      subject: replaceMergeTags(subject, firstClient),
      body: replaceMergeTags(body, firstClient),
    };
  };

  const sendEmail = async (client: Client): Promise<SendResult> => {
    try {
      // Personalizar email para este cliente
      const personalizedSubject = replaceMergeTags(subject, client);
      const personalizedBody = replaceMergeTags(body, client);

      // Simular envio de email (substituir por integração real)
      // TODO: Integrar com serviço de email (Resend, SendGrid, etc)
      await new Promise((resolve) => setTimeout(resolve, 500)); // Delay para simular envio

      // Por enquanto, apenas loga o email
      console.log(`Enviando email para ${client.email}:`, {
        subject: personalizedSubject,
        body: personalizedBody,
      });

      // Em produção, usar API de email:
      // const { error } = await supabase.functions.invoke('send-email', {
      //   body: {
      //     to: client.email,
      //     subject: personalizedSubject,
      //     html: personalizedBody.replace(/\n/g, '<br>'),
      //   }
      // });
      //
      // if (error) throw error;

      return { email: client.email, success: true };
    } catch (error: any) {
      return {
        email: client.email,
        success: false,
        error: error.message || "Erro desconhecido",
      };
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o assunto e o corpo do email",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setProgress(0);
    setResults([]);

    const totalClients = clients.length;
    const sendResults: SendResult[] = [];

    // Enviar emails em lote com rate limiting (max 2 por segundo)
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];

      // Rate limiting: aguardar 500ms entre emails
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const result = await sendEmail(client);
      sendResults.push(result);

      // Atualizar progresso
      setProgress(((i + 1) / totalClients) * 100);
      setResults([...sendResults]);
    }

    setSending(false);

    const successCount = sendResults.filter((r) => r.success).length;
    const failureCount = sendResults.filter((r) => !r.success).length;

    toast({
      title: "Envio concluído",
      description: `${successCount} emails enviados, ${failureCount} falharam`,
      variant: successCount > 0 ? "default" : "destructive",
    });
  };

  const handleClose = () => {
    if (!sending) {
      setSubject("");
      setBody("");
      setResults([]);
      setProgress(0);
      onClose();
    }
  };

  const previewEmail = getPreviewEmail();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Email em Lote
          </DialogTitle>
          <DialogDescription>
            Enviar email personalizado para {clients.length} cliente
            {clients.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="compose" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">
              <Mail className="h-4 w-4 mr-2" />
              Compor
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4 mt-4">
            {/* Merge Tags Helper */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                <Info className="h-4 w-4" />
                Tags disponíveis (personalizadas para cada cliente):
              </div>
              <div className="flex flex-wrap gap-2">
                {mergeTags.map((tag) => (
                  <Badge
                    key={tag.tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      setBody(body + tag.tag);
                    }}
                    title={tag.description}
                  >
                    {tag.tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-blue-700">
                Clique em uma tag para inserir no corpo do email
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto</label>
              <Input
                placeholder="Ex: Olá {nome_cliente}, temos uma oferta especial!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea
                placeholder={`Ex: Olá {nome_cliente}!\n\nNotamos que você não visita a {oficina} há algum tempo. Que tal agendar uma revisão para seu {marca_veiculo} {modelo_veiculo}?\n\nTemos uma promoção especial para você!\n\nAguardamos seu contato.`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sending}
                rows={10}
                className="resize-none font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="text-sm text-gray-600">
                Preview baseado no primeiro cliente selecionado:
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Assunto:</div>
                  <div className="font-semibold">
                    {previewEmail.subject || "(Sem assunto)"}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="text-xs text-gray-500 mb-2">Mensagem:</div>
                  <div className="whitespace-pre-wrap text-sm">
                    {previewEmail.body || "(Sem mensagem)"}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                ⚠️ Cada cliente receberá uma versão personalizada com seus
                próprios dados
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Progress */}
        {(sending || results.length > 0) && (
          <div className="space-y-3 mt-4">
            {sending && (
              <>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-gray-600">
                  Enviando... {Math.round(progress)}%
                </p>
              </>
            )}

            {results.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <div className="space-y-1">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate flex-1">{result.email}</span>
                      {result.success ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            {results.length > 0 ? "Fechar" : "Cancelar"}
          </Button>
          {results.length === 0 && (
            <Button onClick={handleSend} disabled={sending || !subject || !body}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para {clients.length}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
