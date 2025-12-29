/**
 * Card #5: Menu de Exportação (Excel, PDF, CSV)
 * Features Excel/PDF disponíveis apenas para plano Professional
 */

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, FileText, Loader2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  exportToExcel,
  exportToPDF,
  formatMaintenancesForExport,
  type ExportOptions,
} from '@/utils/exportHelpers';

interface ExportMenuProps {
  data: any[]; // Dados de manutenções para exportar
  isPro?: boolean; // Se usuário tem plano Professional
  options?: ExportOptions; // Opções de personalização
  onExportCSV?: () => void; // Função customizada para exportar CSV
}

export const ExportMenu = ({
  data,
  isPro = false,
  options = {},
  onExportCSV,
}: ExportMenuProps) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<'excel' | 'pdf' | 'csv' | null>(null);

  const handleExportExcel = async () => {
    if (!isPro) {
      toast({
        title: 'Feature Premium',
        description: 'Exportação Excel disponível apenas no plano Professional',
        variant: 'default',
      });
      return;
    }

    setExporting('excel');
    try {
      const formattedData = formatMaintenancesForExport(data);
      await exportToExcel(formattedData, options);

      toast({
        title: 'Exportado com sucesso!',
        description: `${data.length} registro${data.length !== 1 ? 's' : ''} exportado${data.length !== 1 ? 's' : ''} para Excel`,
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o arquivo Excel',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!isPro) {
      toast({
        title: 'Feature Premium',
        description: 'Exportação PDF disponível apenas no plano Professional',
        variant: 'default',
      });
      return;
    }

    setExporting('pdf');
    try {
      const formattedData = formatMaintenancesForExport(data);
      await exportToPDF(formattedData, options);

      toast({
        title: 'Exportado com sucesso!',
        description: `${data.length} registro${data.length !== 1 ? 's' : ''} exportado${data.length !== 1 ? 's' : ''} para PDF`,
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o arquivo PDF',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportCSV = () => {
    setExporting('csv');
    try {
      if (onExportCSV) {
        onExportCSV();
      } else {
        // Implementação padrão de CSV
        const csvContent = generateCSV(data);
        downloadCSV(csvContent, `exportacao-${new Date().getTime()}.csv`);
      }

      toast({
        title: 'Exportado com sucesso!',
        description: `${data.length} registro${data.length !== 1 ? 's' : ''} exportado${data.length !== 1 ? 's' : ''} para CSV`,
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o arquivo CSV',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const generateCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    // Cabeçalhos
    const headers = ['Data', 'Serviço', 'Descrição', 'Valor', 'KM', 'Veículo'];
    let csv = headers.join(';') + '\n';

    // Dados
    data.forEach((item) => {
      const row = [
        new Date(item.date).toLocaleDateString('pt-BR'),
        item.service_type || item.serviceType || '',
        item.description || '',
        item.cost || 0,
        item.km || 0,
        item.vehicle
          ? `${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.year}`
          : '',
      ];
      csv += row.map((field) => `"${field}"`).join(';') + '\n';
    });

    return csv;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (data.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting !== null}>
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Excel - PRO */}
        <DropdownMenuItem
          onClick={handleExportExcel}
          disabled={!isPro || exporting !== null}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <span>Exportar Excel</span>
          </div>
          {!isPro && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <Lock className="h-2.5 w-2.5 mr-0.5" />
              PRO
            </Badge>
          )}
        </DropdownMenuItem>

        {/* PDF - PRO */}
        <DropdownMenuItem
          onClick={handleExportPDF}
          disabled={!isPro || exporting !== null}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-red-600" />
            <span>Exportar PDF</span>
          </div>
          {!isPro && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <Lock className="h-2.5 w-2.5 mr-0.5" />
              PRO
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* CSV - Disponível para todos */}
        <DropdownMenuItem
          onClick={handleExportCSV}
          disabled={exporting !== null}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4 text-blue-600" />
          <span>Exportar CSV</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
            Grátis
          </Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
