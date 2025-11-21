import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface ServiceItem {
  name: string;
  price: number;
}

interface ReceiptData {
  workshopName: string;
  workshopLogo?: string;
  date: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  clientName: string;
  services: ServiceItem[];
  total: number;
  publicLink: string;
  notes?: string;
}

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// Format plate
const formatPlate = (plate: string): string => {
  if (plate.length === 7) {
    return `${plate.slice(0, 3)}-${plate.slice(3)}`;
  }
  return plate;
};

export const generateReceipt = async (data: ReceiptData): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Colors
  const primaryColor: [number, number, number] = [22, 163, 74]; // green-600
  const textColor: [number, number, number] = [31, 41, 55]; // gray-800
  const lightGray: [number, number, number] = [156, 163, 175]; // gray-400

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Workshop name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.workshopName, pageWidth / 2, 20, { align: 'center' });

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprovante de Serviço', pageWidth / 2, 30, { align: 'center' });

  // Date
  doc.setFontSize(10);
  doc.text(formatDate(data.date), pageWidth / 2, 38, { align: 'center' });

  yPosition = 55;

  // Vehicle info section
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Veículo', margin, yPosition);
  yPosition += 8;

  // Vehicle details box
  doc.setFillColor(249, 250, 251); // gray-50
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 25, 3, 3, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPlate(data.vehiclePlate), margin + 5, yPosition + 10);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.vehicleBrand} ${data.vehicleModel} - ${data.vehicleYear}`, margin + 5, yPosition + 18);

  yPosition += 35;

  // Client info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clientName, margin, yPosition);
  yPosition += 15;

  // Services section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Serviços Realizados', margin, yPosition);
  yPosition += 10;

  // Services table header
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrição', margin + 3, yPosition + 5.5);
  doc.text('Valor', pageWidth - margin - 3, yPosition + 5.5, { align: 'right' });

  yPosition += 10;

  // Services list
  doc.setFont('helvetica', 'normal');
  data.services.forEach((service, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251); // gray-50
      doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 7, 'F');
    }

    doc.setTextColor(...textColor);
    doc.text(service.name, margin + 3, yPosition + 3);
    doc.text(formatCurrency(service.price), pageWidth - margin - 3, yPosition + 3, { align: 'right' });

    yPosition += 7;
  });

  // Total line
  yPosition += 3;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', margin, yPosition);
  doc.setTextColor(...primaryColor);
  doc.text(formatCurrency(data.total), pageWidth - margin, yPosition, { align: 'right' });

  yPosition += 15;

  // Notes section (if exists)
  if (data.notes && data.notes.trim()) {
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações', margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);

    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPosition);
    yPosition += splitNotes.length * 4 + 10;
  }

  // QR Code section
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data.publicLink, {
      width: 200,
      margin: 1,
      color: {
        dark: '#16a34a',
        light: '#ffffff'
      }
    });

    const qrSize = 35;
    const qrX = (pageWidth - qrSize) / 2;

    // Check if we need a new page
    if (yPosition + qrSize + 30 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico Completo do Veículo', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;

    doc.addImage(qrCodeDataUrl, 'PNG', qrX, yPosition, qrSize, qrSize);
    yPosition += qrSize + 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);
    doc.text('Escaneie o QR Code para ver o histórico', pageWidth / 2, yPosition, { align: 'center' });
  } catch (error) {
    console.error('Error generating QR code:', error);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.text('Gerado por WiseDrive - wisedrive.com.br', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Return as blob
  return doc.output('blob');
};

export const generateReceiptFileName = (plate: string, date: string): string => {
  const formattedDate = date.replace(/-/g, '');
  return `comprovante_${plate}_${formattedDate}.pdf`;
};
