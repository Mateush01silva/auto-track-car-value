import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react";
import { Comprovante } from "@/components/GaleriaComprovantes";

interface ModalComprovanteProps {
  comprovante: Comprovante;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export const ModalComprovante = ({
  comprovante,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  currentIndex,
  totalCount,
}: ModalComprovanteProps) => {
  const handleDownload = () => {
    window.open(comprovante.url, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Comprovante
              {currentIndex !== undefined && totalCount !== undefined && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({currentIndex + 1} de {totalCount})
                </span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative px-6 pb-6">
          {/* Conteúdo do comprovante */}
          <div className="relative bg-muted rounded-lg overflow-hidden">
            {comprovante.tipo === "imagem" ? (
              <img
                src={comprovante.url}
                alt="Comprovante"
                className="w-full h-auto max-h-[calc(90vh-180px)] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="bg-primary/10 rounded-full p-6 inline-block">
                    <svg
                      className="h-16 w-16 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium mb-2">Documento PDF</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Clique no botão abaixo para visualizar o PDF
                    </p>
                    <Button onClick={handleDownload} className="gap-2">
                      <Download className="h-4 w-4" />
                      Abrir PDF
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navegação entre comprovantes */}
          {(onPrevious || onNext) && (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
              {onPrevious && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={onPrevious}
                  className="pointer-events-auto shadow-lg"
                  title="Anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              <div className="flex-1" />
              {onNext && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={onNext}
                  className="pointer-events-auto shadow-lg"
                  title="Próximo"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="px-6 pb-4 text-xs text-muted-foreground text-center border-t pt-4">
          Use as setas para navegar entre os comprovantes
          {comprovante.tipo === "pdf" && " • PDFs serão abertos em nova aba"}
        </div>
      </DialogContent>
    </Dialog>
  );
};
