import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Image as ImageIcon, Download, ZoomIn } from "lucide-react";
import { ModalComprovante } from "@/components/ModalComprovante";

export interface Comprovante {
  url: string;
  tipo: "imagem" | "pdf";
  nome?: string;
}

interface GaleriaComprovantesProps {
  comprovantes: Comprovante[];
  className?: string;
}

export const GaleriaComprovantes = ({ comprovantes, className = "" }: GaleriaComprovantesProps) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [comprovanteAtual, setComprovanteAtual] = useState<Comprovante | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);

  if (!comprovantes || comprovantes.length === 0) {
    return null;
  }

  const abrirModal = (comprovante: Comprovante, indice: number) => {
    setComprovanteAtual(comprovante);
    setIndiceAtual(indice);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setComprovanteAtual(null);
  };

  const navegarProximo = () => {
    const proximoIndice = (indiceAtual + 1) % comprovantes.length;
    setIndiceAtual(proximoIndice);
    setComprovanteAtual(comprovantes[proximoIndice]);
  };

  const navegarAnterior = () => {
    const anteriorIndice = indiceAtual === 0 ? comprovantes.length - 1 : indiceAtual - 1;
    setIndiceAtual(anteriorIndice);
    setComprovanteAtual(comprovantes[anteriorIndice]);
  };

  return (
    <>
      <div className={`mt-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Comprovantes ({comprovantes.length})
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {comprovantes.map((comprovante, index) => (
            <Card
              key={index}
              className="relative group cursor-pointer overflow-hidden border-2 border-border hover:border-primary transition-all duration-200 hover:shadow-lg"
              onClick={() => abrirModal(comprovante, index)}
            >
              <div className="aspect-square relative bg-muted flex items-center justify-center">
                {comprovante.tipo === "imagem" ? (
                  <>
                    <img
                      src={comprovante.url}
                      alt={`Comprovante ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center p-2">
                      <FileText className="h-8 w-8 text-primary mb-2" />
                      <span className="text-xs text-muted-foreground text-center">PDF</span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                )}

                {/* Badge de tipo no canto superior direito */}
                <div className="absolute top-1 right-1">
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0.5 h-5 bg-background/90 backdrop-blur-sm"
                  >
                    {comprovante.tipo === "imagem" ? (
                      <ImageIcon className="h-3 w-3" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-2 italic">
          Clique em um comprovante para visualizar em tamanho maior
        </p>
      </div>

      {comprovanteAtual && (
        <ModalComprovante
          comprovante={comprovanteAtual}
          isOpen={modalAberto}
          onClose={fecharModal}
          onNext={comprovantes.length > 1 ? navegarProximo : undefined}
          onPrevious={comprovantes.length > 1 ? navegarAnterior : undefined}
          currentIndex={indiceAtual}
          totalCount={comprovantes.length}
        />
      )}
    </>
  );
};
