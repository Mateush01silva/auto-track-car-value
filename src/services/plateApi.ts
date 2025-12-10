/**
 * Plate API Service
 *
 * Serviço para integração com API de busca por placa.
 * Esta API permite buscar informações completas do veículo através da placa,
 * eliminando a necessidade do usuário selecionar marca/modelo/ano manualmente.
 *
 * ⚠️ Requer assinatura paga da API
 */

import { featureConfig } from '../config/featureFlags';

/**
 * Interface para resposta da busca por placa
 * NOTA: Ajuste esta interface de acordo com a estrutura real da sua API
 */
export interface PlateSearchResponse {
  plate: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  color?: string;
  fuel?: string;
  // Adicione outros campos que a API retorna
}

/**
 * Interface para resposta de revisões específicas do fabricante
 * NOTA: Ajuste de acordo com a estrutura real da API
 */
export interface ManufacturerRevision {
  id: string;
  category: string;
  item: string;
  description: string;
  kmInterval: number | null;
  timeInterval: number | null; // em meses
  type: 'Preventiva' | 'Corretiva';
  criticidade: 'Crítica' | 'Alta' | 'Média' | 'Baixa';
  // Campos opcionais que podem vir da API
  custoEstimado?: number;
  tempoEstimado?: number; // em minutos
}

/**
 * Classe de erro personalizada para a Plate API
 */
export class PlateApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PlateApiError';
  }
}

/**
 * Cliente HTTP base para a Plate API
 */
class PlateApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = featureConfig.carApi.url;
    this.apiKey = featureConfig.carApi.apiKey;

    if (!this.baseUrl || !this.apiKey) {
      console.warn('⚠️ Plate API não configurada. Configure VITE_CAR_API_URL e VITE_CAR_API_KEY no .env');
    }
  }

  /**
   * Realiza uma requisição HTTP para a API
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.baseUrl || !this.apiKey) {
      throw new PlateApiError('API não configurada. Verifique as variáveis de ambiente.');
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          // Ou dependendo da API: 'X-API-Key': this.apiKey,
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new PlateApiError(
          errorData.message || `Erro na API: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof PlateApiError) {
        throw error;
      }

      throw new PlateApiError(
        'Erro ao conectar com a API',
        undefined,
        error
      );
    }
  }

  /**
   * Busca informações do veículo pela placa
   *
   * @param plate - Placa do veículo (formato: ABC-1234 ou ABC1D23)
   * @returns Informações completas do veículo
   *
   * @example
   * const vehicle = await searchByPlate('ABC-1234');
   * console.log(vehicle.brand, vehicle.model, vehicle.year);
   */
  async searchByPlate(plate: string): Promise<PlateSearchResponse> {
    // Remove caracteres especiais da placa
    const cleanPlate = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    if (cleanPlate.length !== 7) {
      throw new PlateApiError('Placa inválida. Use o formato ABC-1234 ou ABC1D23');
    }

    // NOTA: Ajuste o endpoint de acordo com a documentação da sua API
    // Exemplos comuns:
    // - /vehicles/search?plate=${cleanPlate}
    // - /api/v1/vehicle/${cleanPlate}
    // - /consulta/placa/${cleanPlate}

    return this.request<PlateSearchResponse>(`/vehicles/search?plate=${cleanPlate}`);
  }

  /**
   * Busca revisões específicas do fabricante para um veículo
   *
   * @param brand - Marca do veículo
   * @param model - Modelo do veículo
   * @param year - Ano do veículo
   * @returns Lista de revisões recomendadas pelo fabricante
   */
  async getManufacturerRevisions(
    brand: string,
    model: string,
    year: number
  ): Promise<ManufacturerRevision[]> {
    // NOTA: Ajuste o endpoint de acordo com a documentação da sua API
    const params = new URLSearchParams({
      brand,
      model,
      year: year.toString(),
    });

    return this.request<ManufacturerRevision[]>(`/revisions?${params}`);
  }

  /**
   * Verifica se a API está configurada e funcionando
   */
  async healthCheck(): Promise<boolean> {
    try {
      // NOTA: Ajuste o endpoint de acordo com a sua API
      // Muitas APIs têm um endpoint /health ou /ping
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Instância singleton do cliente
const plateApiClient = new PlateApiClient();

/**
 * Busca veículo pela placa
 */
export const searchByPlate = (plate: string) => plateApiClient.searchByPlate(plate);

/**
 * Busca revisões do fabricante
 */
export const getManufacturerRevisions = (brand: string, model: string, year: number) =>
  plateApiClient.getManufacturerRevisions(brand, model, year);

/**
 * Verifica saúde da API
 */
export const checkApiHealth = () => plateApiClient.healthCheck();

/**
 * Formata placa para exibição (ABC1234 -> ABC-1234)
 */
export const formatPlate = (plate: string): string => {
  const clean = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  // Placa antiga: ABC-1234
  if (/^[A-Z]{3}[0-9]{4}$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }

  // Placa Mercosul: ABC1D23
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(clean)) {
    return `${clean.slice(0, 3)}${clean.slice(3, 4)}${clean.slice(4, 5)}${clean.slice(5)}`;
  }

  return clean;
};

/**
 * Valida formato de placa brasileira
 */
export const isValidPlate = (plate: string): boolean => {
  const clean = plate.replace(/[^A-Z0-9]/gi, '');

  // Placa antiga: ABC1234
  const oldFormat = /^[A-Z]{3}[0-9]{4}$/i.test(clean);

  // Placa Mercosul: ABC1D23
  const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/i.test(clean);

  return oldFormat || mercosulFormat;
};
