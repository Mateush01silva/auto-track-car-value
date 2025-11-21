import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface AttachmentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachmentUrl: string | null;
  getAttachmentUrl: (path: string | null) => Promise<string | null>;
}

export function AttachmentViewer({
  open,
  onOpenChange,
  attachmentUrl,
  getAttachmentUrl,
}: AttachmentViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown');

  useEffect(() => {
    if (open && attachmentUrl) {
      loadAttachment();
    }
  }, [open, attachmentUrl]);

  const loadAttachment = async () => {
    if (!attachmentUrl) return;

    setLoading(true);
    try {
      let url: string | null;

      // If it's already a full URL (public URL), use it directly
      if (attachmentUrl.startsWith('http://') || attachmentUrl.startsWith('https://')) {
        url = attachmentUrl;
      } else {
        // Otherwise, get a signed URL for the file path
        url = await getAttachmentUrl(attachmentUrl);
      }

      setSignedUrl(url);

      // Detecta o tipo de arquivo pela extensão
      const extension = attachmentUrl.toLowerCase().split('.').pop();
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '')) {
        setFileType('image');
      } else if (extension === 'pdf') {
        setFileType('pdf');
      } else {
        setFileType('unknown');
      }
    } catch (error) {
      console.error('Erro ao carregar anexo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (signedUrl) {
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = attachmentUrl?.split('/').pop() || 'anexo';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {fileType === 'image' ? (
                <ImageIcon className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              Visualizar Anexo
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : !signedUrl ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Erro ao carregar anexo</p>
            </div>
          ) : fileType === 'image' ? (
            <div className="flex items-center justify-center p-4">
              <img
                src={signedUrl}
                alt="Anexo"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          ) : fileType === 'pdf' ? (
            <div className="w-full h-[70vh]">
              <iframe
                src={signedUrl}
                className="w-full h-full border-0 rounded-lg"
                title="Visualização de PDF"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Tipo de arquivo não suportado para visualização
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar arquivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
