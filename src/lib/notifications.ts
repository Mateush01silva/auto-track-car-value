import { supabase } from "@/integrations/supabase/client";

interface SendMaintenanceEmailParams {
  clientName: string;
  clientEmail: string;
  workshopName: string;
  vehicleInfo: string; // "Chevrolet Onix 2022 (ABC-1234)"
  servicesSummary: string; // "Troca de oleo, Filtros"
  total: number;
  publicLink: string;
}

export async function sendMaintenanceEmail({
  clientName,
  clientEmail,
  workshopName,
  vehicleInfo,
  servicesSummary,
  total,
  publicLink
}: SendMaintenanceEmailParams) {
  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(total);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
        }
        .header {
          background: #16a34a;
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
        }
        .greeting {
          font-size: 20px;
          margin-bottom: 20px;
        }
        .vehicle-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .vehicle-card h3 {
          margin: 0 0 10px 0;
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
        }
        .vehicle-card p {
          margin: 0;
          font-size: 16px;
          font-weight: bold;
        }
        .services-card {
          background: white;
          border: 2px solid #16a34a;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .services-card h3 {
          margin: 0 0 15px 0;
          color: #16a34a;
        }
        .total {
          font-size: 24px;
          font-weight: bold;
          color: #16a34a;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
        .button {
          display: inline-block;
          background: #16a34a;
          color: white !important;
          padding: 14px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .promo {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
        }
        .promo strong {
          color: #d97706;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f9fafb;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${workshopName}</h1>
        </div>

        <div class="content">
          <p class="greeting">Ola ${clientName}!</p>

          <p>Seu veiculo foi atendido com sucesso em nossa oficina.</p>

          <div class="vehicle-card">
            <h3>Veiculo</h3>
            <p>${vehicleInfo}</p>
          </div>

          <div class="services-card">
            <h3>Servicos Realizados</h3>
            <p>${servicesSummary}</p>
            <div class="total">Total: R$ ${formattedTotal}</div>
          </div>

          <p>Acesse o historico completo do seu veiculo clicando no botao abaixo:</p>

          <div class="button-container">
            <a href="${publicLink}" class="button">Ver Historico Completo</a>
          </div>

          <div class="promo">
            <strong>Dica!</strong> Instale o WiseDrive como app no seu celular: abra o link acima no navegador, toque no menu (3 pontos) e selecione "Adicionar a tela inicial". Pronto!
          </div>
        </div>

        <div class="footer">
          <p>Este email foi enviado por <strong>${workshopName}</strong> via WiseDrive</p>
          <p>&copy; ${new Date().getFullYear()} WiseDrive - Sistema de Gestao Automotiva</p>
          <p>Transparencia que valoriza seu carro</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: clientEmail,
      subject: `[${workshopName}] Seu veiculo foi atendido`,
      html,
      from_name: workshopName
    }
  });

  if (error) {
    console.error('Error invoking send-email function:', error);
    throw error;
  }

  return data;
}

// Helper to format services for email
export function formatServicesForEmail(services: { name: string; price: number }[]): string {
  return services.map(s => s.name).join(', ');
}

// Helper to format vehicle info for email
export function formatVehicleInfo(brand: string, model: string, year: number, plate: string): string {
  const formattedPlate = plate.length === 7
    ? `${plate.slice(0, 3)}-${plate.slice(3)}`
    : plate;
  return `${brand} ${model} ${year} (${formattedPlate})`;
}

// WhatsApp notification (placeholder - opens WhatsApp Web for manual sending)
interface SendMaintenanceWhatsAppParams {
  clientName: string;
  clientPhone: string;
  workshopName: string;
  vehicleInfo: string;
  servicesSummary: string;
  total: number;
  publicLink: string;
}

export async function sendMaintenanceWhatsApp({
  clientName,
  clientPhone,
  workshopName,
  vehicleInfo,
  servicesSummary,
  total,
  publicLink
}: SendMaintenanceWhatsAppParams) {
  // TODO: Implementar integração com WhatsApp Business API
  // Por ora, apenas gerar link para envio manual

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(total);

  const message = encodeURIComponent(
    `🔧 *${workshopName}*\n\n` +
    `Olá ${clientName}! 👋\n\n` +
    `Seu ${vehicleInfo} foi atendido com sucesso.\n\n` +
    `📋 Serviços: ${servicesSummary}\n` +
    `💰 Total: R$ ${formattedTotal}\n\n` +
    `🔗 Veja seu histórico completo:\n${publicLink}\n\n` +
    `📱 Dica: Instale como app! Abra o link, toque no menu (⋮) e "Adicionar à tela inicial"`
  );

  // Remove non-digits from phone and ensure country code
  const cleanPhone = clientPhone.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

  const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${message}`;

  // Por ora, abrir WhatsApp Web
  window.open(whatsappUrl, '_blank');

  return { success: true, method: 'manual' };
}
