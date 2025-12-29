/**
 * Card #5: Funções de Exportação (Excel e PDF)
 * Disponível apenas para plano Professional
 */

import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface MaintenanceExportData {
  date: string;
  serviceType: string;
  description?: string;
  cost: number;
  km: number;
  vehicle?: string;
  workshop?: string;
}

export interface ExportOptions {
  title?: string;
  workshopName?: string;
  workshopLogo?: string; // URL ou base64
  period?: string;
}

/**
 * Exporta dados para Excel (.xlsx)
 */
export async function exportToExcel(
  data: MaintenanceExportData[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    title = 'Histórico de Atendimentos',
    workshopName = 'Vybo',
    period = new Date().toLocaleDateString('pt-BR'),
  } = options;

  // Criar workbook e worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Atendimentos');

  // Configurar propriedades do documento
  workbook.creator = workshopName;
  workbook.created = new Date();
  workbook.modified = new Date();

  // Adicionar título
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF16a34a' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFf0fdf4' },
  };
  worksheet.getRow(1).height = 30;

  // Adicionar informações do cabeçalho
  worksheet.mergeCells('A2:G2');
  const infoCell = worksheet.getCell('A2');
  infoCell.value = `${workshopName} - ${period}`;
  infoCell.font = { size: 11, italic: true };
  infoCell.alignment = { horizontal: 'center' };

  // Espaço
  worksheet.getRow(3).height = 10;

  // Cabeçalho da tabela
  const headerRow = worksheet.getRow(4);
  const headers = ['Data', 'Serviço', 'Descrição', 'Valor (R$)', 'KM', 'Veículo', 'Oficina'];

  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF16a34a' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;

  // Definir largura das colunas
  worksheet.columns = [
    { key: 'date', width: 12 },
    { key: 'serviceType', width: 20 },
    { key: 'description', width: 35 },
    { key: 'cost', width: 15 },
    { key: 'km', width: 12 },
    { key: 'vehicle', width: 20 },
    { key: 'workshop', width: 20 },
  ];

  // Adicionar dados
  data.forEach((maintenance, index) => {
    const row = worksheet.addRow([
      new Date(maintenance.date).toLocaleDateString('pt-BR'),
      maintenance.serviceType,
      maintenance.description || '-',
      maintenance.cost,
      maintenance.km.toLocaleString('pt-BR'),
      maintenance.vehicle || '-',
      maintenance.workshop || workshopName,
    ]);

    // Alternar cores das linhas
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFf9fafb' },
      };
    }

    // Formatar valor monetário
    const costCell = row.getCell(4);
    costCell.numFmt = 'R$ #,##0.00';
    costCell.alignment = { horizontal: 'right' };

    // Alinhar KM à direita
    row.getCell(5).alignment = { horizontal: 'right' };
  });

  // Adicionar linha de totais
  const totalRow = worksheet.addRow([
    '',
    '',
    'TOTAL',
    data.reduce((sum, m) => sum + m.cost, 0),
    '',
    '',
    '',
  ]);
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFdcfce7' },
  };
  const totalCostCell = totalRow.getCell(4);
  totalCostCell.numFmt = 'R$ #,##0.00';
  totalCostCell.alignment = { horizontal: 'right' };

  // Adicionar bordas a todas as células com dados
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFe5e7eb' } },
          left: { style: 'thin', color: { argb: 'FFe5e7eb' } },
          bottom: { style: 'thin', color: { argb: 'FFe5e7eb' } },
          right: { style: 'thin', color: { argb: 'FFe5e7eb' } },
        };
      });
    }
  });

  // Gerar arquivo e fazer download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `historico-atendimentos-${new Date().getTime()}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Exporta dados para PDF
 */
export async function exportToPDF(
  data: MaintenanceExportData[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    title = 'Histórico de Atendimentos',
    workshopName = 'Vybo',
    period = new Date().toLocaleDateString('pt-BR'),
  } = options;

  // Criar documento PDF
  const doc = new jsPDF();

  // Cores
  const primaryColor: [number, number, number] = [22, 163, 74]; // green-600
  const textColor: [number, number, number] = [31, 41, 55]; // gray-800

  // Adicionar logo (se fornecido)
  if (options.workshopLogo) {
    try {
      doc.addImage(options.workshopLogo, 'PNG', 15, 10, 30, 30);
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }
  }

  // Título
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text(title, options.workshopLogo ? 50 : 15, 20);

  // Informações do cabeçalho
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.text(workshopName, options.workshopLogo ? 50 : 15, 28);
  doc.text(`Período: ${period}`, options.workshopLogo ? 50 : 15, 34);

  // Data de geração
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    options.workshopLogo ? 50 : 15,
    40
  );

  // Preparar dados para tabela
  const tableData = data.map((m) => [
    new Date(m.date).toLocaleDateString('pt-BR'),
    m.serviceType,
    m.description || '-',
    `R$ ${m.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    m.km.toLocaleString('pt-BR'),
    m.vehicle || '-',
  ]);

  // Adicionar tabela
  autoTable(doc, {
    head: [['Data', 'Serviço', 'Descrição', 'Valor', 'KM', 'Veículo']],
    body: tableData,
    startY: 50,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 }, // Data
      1: { cellWidth: 35 }, // Serviço
      2: { cellWidth: 55 }, // Descrição
      3: { halign: 'right', cellWidth: 30 }, // Valor
      4: { halign: 'right', cellWidth: 20 }, // KM
      5: { cellWidth: 30 }, // Veículo
    },
    margin: { left: 15, right: 15 },
  });

  // Adicionar linha de totais
  const finalY = (doc as any).lastAutoTable.finalY || 50;

  doc.setFillColor(...primaryColor);
  doc.rect(15, finalY + 5, doc.internal.pageSize.width - 30, 10, 'F');

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL:', 20, finalY + 11.5);

  const total = data.reduce((sum, m) => sum + m.cost, 0);
  doc.text(
    `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    doc.internal.pageSize.width - 20,
    finalY + 11.5,
    { align: 'right' }
  );

  // Rodapé
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );

    doc.text(
      'Gerado por Vybo - Sistema de Gestão para Oficinas',
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 5,
      { align: 'center' }
    );
  }

  // Fazer download
  doc.save(`historico-atendimentos-${new Date().getTime()}.pdf`);
}

/**
 * Formata dados de manutenções para exportação
 */
export function formatMaintenancesForExport(maintenances: any[]): MaintenanceExportData[] {
  return maintenances.map((m) => ({
    date: m.date,
    serviceType: m.service_type || m.serviceType,
    description: m.description,
    cost: Number(m.cost),
    km: Number(m.km),
    vehicle: m.vehicle
      ? `${m.vehicle.brand} ${m.vehicle.model} ${m.vehicle.year}`
      : undefined,
    workshop: m.workshop?.name,
  }));
}
