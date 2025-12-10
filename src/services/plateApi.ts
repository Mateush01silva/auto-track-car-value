/**
 * SUIV API Service
 *
 * Serviço para integração com API SUIV (https://api.suiv.com.br).
 * Esta API permite buscar informações completas do veículo através da placa,
 * eliminando a necessidade do usuário selecionar marca/modelo/ano manualmente.
 *
 * ⚠️ Requer assinatura paga da API SUIV
 *
 * Documentação: https://api.suiv.com.br/documentation/
 */

import { featureConfig } from '../config/featureFlags';

/**
 * Interface para resposta da busca por placa (API SUIV)
 * Baseada na resposta da API /api/v4/VehicleInfo/byplate
 */
export interface PlateSearchResponse {
  plate: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  color?: string;
  fuel?: string;
  vin?: string;
  yearFab?: number;
  type?: string;
  species?: string;
  power?: number;
  cubicCentimeters?: number;
  seatCount?: number;
}

/**
 * Interface para uma peça trocada no plano de revisão
 */
export interface ChangedPart {
  nicknameId: number;
  setId: number;
  setDescription: string;
  description: string;
  amount: number;
}

/**
 * Interface para uma inspeção no plano de revisão
 */
export interface Inspection {
  description: string;
  inspectionId: number;
}

/**
 * Interface para um item do plano de revisão (API SUIV)
 * Baseada na resposta da API /api/v4/RevisionPlan
 */
export interface RevisionPlanItem {
  kilometers: number;
  months: number;
  parcels: number;
  durationMinutes: number;
  fullPrice: number | null;
  parcelPrice: number | null;
  changedParts: ChangedPart[];
  inspections: Inspection[];
}

/**
 * Interface unificada para compatibilidade com o maintenanceApiAdapter
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
   * Realiza uma requisição HTTP para a API SUIV
   * SUIV usa query parameter 'key' para autenticação, não header
   */
  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    if (!this.baseUrl || !this.apiKey) {
      throw new PlateApiError('API SUIV não configurada. Verifique VITE_CAR_API_URL e VITE_CAR_API_KEY no .env');
    }

    // Adiciona a API key aos parâmetros
    const queryParams = new URLSearchParams({
      key: this.apiKey,
      ...params,
    });

    const url = `${this.baseUrl}${endpoint}?${queryParams}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text().catch(() => '');
        throw new PlateApiError(
          `Erro na API SUIV: ${response.status} ${response.statusText}`,
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
        'Erro ao conectar com a API SUIV',
        undefined,
        error
      );
    }
  }

  /**
   * Busca informações do veículo pela placa (API SUIV)
   *
   * @param plate - Placa do veículo (formato: ABC-1234 ou ABC1D23)
   * @returns Informações completas do veículo
   *
   * @example
   * const vehicle = await searchByPlate('PGR4B43');
   * console.log(vehicle.brand, vehicle.model, vehicle.year);
   */
  async searchByPlate(plate: string): Promise<PlateSearchResponse> {
    // Remove caracteres especiais da placa
    const cleanPlate = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    if (cleanPlate.length !== 7) {
      throw new PlateApiError('Placa inválida. Use o formato ABC-1234 ou ABC1D23');
    }

    // Endpoint: GET /api/v4/VehicleInfo/byplate
    // Parâmetros: plate, withFipe=false, searchOtherProviders=true
    interface SuivVehicleResponse {
      maker: string;
      model: string;
      version?: string;
      plate: string;
      yearModel: number;
      yearFab: number;
      fuel: string;
      vin?: string;
      type?: string;
      species?: string;
      color?: string;
      power?: number;
      cubicCentimeters?: number;
      seatCount?: number;
    }

    const response = await this.request<SuivVehicleResponse>('/api/v4/VehicleInfo/byplate', {
      plate: cleanPlate,
      withFipe: 'false',
      searchOtherProviders: 'true',
    });

    // Mapeia para a interface PlateSearchResponse
    return {
      plate: response.plate,
      brand: response.maker,
      model: response.model,
      version: response.version,
      year: response.yearModel,
      yearFab: response.yearFab,
      fuel: response.fuel,
      vin: response.vin,
      type: response.type,
      species: response.species,
      color: response.color,
      power: response.power,
      cubicCentimeters: response.cubicCentimeters,
      seatCount: response.seatCount,
    };
  }

  /**
   * Busca o ID da marca na API SUIV
   * @private
   */
  private async getMakerId(brandName: string): Promise<number | null> {
    interface Maker {
      id: number;
      description: string;
    }

    const makers = await this.request<Maker[]>('/api/v4/Makers');
    const maker = makers.find(m =>
      m.description.toUpperCase() === brandName.toUpperCase()
    );

    return maker?.id || null;
  }

  /**
   * Busca o ID do modelo na API SUIV
   * @private
   */
  private async getModelId(makerId: number, modelName: string): Promise<number | null> {
    interface Model {
      id: number;
      description: string;
    }

    const models = await this.request<Model[]>('/api/v4/Models', {
      makerId: makerId.toString(),
    });

    // Busca aproximada por substring (modelo pode vir com anos e detalhes)
    const model = models.find(m =>
      m.description.toUpperCase().includes(modelName.toUpperCase())
    );

    return model?.id || null;
  }

  /**
   * Busca o ID da versão na API SUIV
   * @private
   */
  private async getVersionId(modelId: number, year: number): Promise<number | null> {
    interface Version {
      id: number;
      description: string;
      startingYear: number;
      endingYear: number;
    }

    const versions = await this.request<Version[]>('/api/v4/Versions', {
      modelId: modelId.toString(),
    });

    // Busca versão que inclui o ano especificado
    const version = versions.find(v =>
      v.startingYear <= year && v.endingYear >= year
    );

    return version?.id || null;
  }

  /**
   * Busca revisões específicas do fabricante para um veículo (API SUIV)
   *
   * IMPORTANTE: Este método requer múltiplas chamadas à API SUIV:
   * 1. Buscar ID da marca (Makers)
   * 2. Buscar ID do modelo (Models)
   * 3. Buscar ID da versão (Versions)
   * 4. Buscar plano de revisão (RevisionPlan)
   *
   * @param brand - Marca do veículo (ex: "CHEVROLET")
   * @param model - Modelo do veículo (ex: "COBALT")
   * @param year - Ano do veículo (ex: 2014)
   * @returns Lista de revisões recomendadas pelo fabricante
   */
  async getManufacturerRevisions(
    brand: string,
    model: string,
    year: number
  ): Promise<ManufacturerRevision[]> {
    try {
      // Passo 1: Buscar ID da marca
      const makerId = await this.getMakerId(brand);
      if (!makerId) {
        throw new PlateApiError(`Marca "${brand}" não encontrada na API SUIV`);
      }

      // Passo 2: Buscar ID do modelo
      const modelId = await this.getModelId(makerId, model);
      if (!modelId) {
        throw new PlateApiError(`Modelo "${model}" não encontrado para a marca "${brand}"`);
      }

      // Passo 3: Buscar ID da versão
      const versionId = await this.getVersionId(modelId, year);
      if (!versionId) {
        throw new PlateApiError(`Versão não encontrada para ${brand} ${model} (${year})`);
      }

      // Passo 4: Buscar plano de revisão
      const revisionPlan = await this.request<RevisionPlanItem[]>('/api/v4/RevisionPlan', {
        versionId: versionId.toString(),
        year: year.toString(),
      });

      // Converte o plano de revisão SUIV para o formato ManufacturerRevision
      return this.convertRevisionPlanToManufacturerRevisions(revisionPlan);
    } catch (error) {
      if (error instanceof PlateApiError) {
        throw error;
      }
      throw new PlateApiError('Erro ao buscar plano de revisão', undefined, error);
    }
  }

  /**
   * Converte o plano de revisão da SUIV para o formato ManufacturerRevision
   * @private
   */
  private convertRevisionPlanToManufacturerRevisions(
    revisionPlan: RevisionPlanItem[]
  ): ManufacturerRevision[] {
    const revisions: ManufacturerRevision[] = [];

    for (const item of revisionPlan) {
      // Adiciona peças a serem trocadas
      for (const part of item.changedParts) {
        revisions.push({
          id: `part_${item.kilometers}_${part.nicknameId}`,
          category: part.setDescription,
          item: part.description,
          description: `Troca de ${part.description} (${part.amount}x)`,
          kmInterval: item.kilometers,
          timeInterval: item.months,
          type: 'Preventiva',
          criticidade: this.estimateCriticality(part.setDescription),
          custoEstimado: item.fullPrice || undefined,
          tempoEstimado: item.durationMinutes || undefined,
        });
      }

      // Adiciona inspeções
      for (const inspection of item.inspections) {
        revisions.push({
          id: `inspection_${item.kilometers}_${inspection.inspectionId}`,
          category: 'Inspeção',
          item: inspection.description,
          description: `Inspeção: ${inspection.description}`,
          kmInterval: item.kilometers,
          timeInterval: item.months,
          type: 'Preventiva',
          criticidade: 'Baixa',
          custoEstimado: 0,
          tempoEstimado: item.durationMinutes || undefined,
        });
      }
    }

    return revisions;
  }

  /**
   * Estima a criticidade baseada na categoria
   * @private
   */
  private estimateCriticality(category: string): 'Crítica' | 'Alta' | 'Média' | 'Baixa' {
    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes('motor') || lowerCategory.includes('freio')) {
      return 'Crítica';
    }
    if (lowerCategory.includes('combustível') || lowerCategory.includes('óleo')) {
      return 'Alta';
    }
    if (lowerCategory.includes('filtro')) {
      return 'Média';
    }
    return 'Baixa';
  }

  /**
   * Verifica se a API SUIV está configurada e funcionando
   * Testa fazendo uma chamada simples à API de marcas
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        return false;
      }
      // Testa com endpoint de marcas (leve e rápido)
      await this.request('/api/v4/Makers');
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
