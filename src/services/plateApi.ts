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

    console.log(`[SUIV API] 🔍 Nome original da marca: "${brandName}"`);

    // Normalizar nome da marca (remover extras como modelo/versão)
    const normalizedBrand = this.normalizeBrandName(brandName);
    console.log(`[SUIV API] 🔧 Nome normalizado da marca: "${normalizedBrand}"`);

    const makers = await this.request<Maker[]>('/api/v4/Makers');

    // Busca exata primeiro
    let maker = makers.find(m =>
      m.description.toUpperCase() === normalizedBrand.toUpperCase()
    );

    // Se não encontrar, tenta busca parcial
    if (!maker) {
      console.log(`[SUIV API] Busca exata falhou, tentando busca parcial...`);
      maker = makers.find(m =>
        normalizedBrand.toUpperCase().includes(m.description.toUpperCase()) ||
        m.description.toUpperCase().includes(normalizedBrand.toUpperCase())
      );
    }

    if (maker) {
      console.log(`[SUIV API] ✅ Marca encontrada: "${maker.description}" (ID: ${maker.id})`);
    }

    return maker?.id || null;
  }

  /**
   * Normaliza o nome da marca removendo sufixos e extras
   * @private
   */
  private normalizeBrandName(brand: string): string {
    // Remove tudo após hífen (ex: "GM - Chevrolet" → "GM")
    let normalized = brand.split('-')[0].trim();

    // Mapeia aliases conhecidos
    const brandAliases: { [key: string]: string } = {
      'GM': 'CHEVROLET',
      'VW': 'VOLKSWAGEN',
      'MERCEDES': 'MERCEDES-BENZ',
      'LAND': 'LAND ROVER',
    };

    const upper = normalized.toUpperCase();
    for (const [alias, fullName] of Object.entries(brandAliases)) {
      if (upper === alias) {
        console.log(`[SUIV API] 🔄 Mapeando alias "${alias}" → "${fullName}"`);
        return fullName;
      }
    }

    return normalized;
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

    console.log(`[SUIV API] 🔍 Nome original do modelo: "${modelName}"`);

    // Normalizar nome do modelo (remover versão/motor/transmissão)
    const normalizedModel = this.normalizeModelName(modelName);
    console.log(`[SUIV API] 🔧 Nome normalizado do modelo: "${normalizedModel}"`);

    const models = await this.request<Model[]>('/api/v4/Models', {
      makerId: makerId.toString(),
    });

    // Busca exata primeiro
    let model = models.find(m =>
      m.description.toUpperCase() === normalizedModel.toUpperCase()
    );

    // Se não encontrar, busca por substring (modelo pode ter variações na API)
    if (!model) {
      console.log(`[SUIV API] Busca exata falhou, tentando busca por substring...`);
      model = models.find(m =>
        m.description.toUpperCase().includes(normalizedModel.toUpperCase()) ||
        normalizedModel.toUpperCase().includes(m.description.toUpperCase())
      );
    }

    if (model) {
      console.log(`[SUIV API] ✅ Modelo encontrado: "${model.description}" (ID: ${model.id})`);
    }

    return model?.id || null;
  }

  /**
   * Normaliza o nome do modelo removendo versões e detalhes
   * @private
   */
  private normalizeModelName(model: string): string {
    // Remove números de motor, anos, e detalhes técnicos
    // Ex: "COBALT LTZ 1.8 8V Econo.Flex 4p Aut." → "COBALT"

    // Lista de palavras-chave que indicam início de versão/detalhes
    const versionKeywords = [
      'LTZ', 'LT', 'LS', 'LX', 'LXS', 'EX', 'EXL', 'DX', 'SX',
      'PREMIER', 'COMFORT', 'STYLE', 'TECH', 'SPORT', 'TURBO',
      'PLUS', 'ACTIV', 'MIDNIGHT', 'RS', 'SS',
      'FLEX', 'ECONO', 'AUTOMÁTICO', 'MANUAL', 'AUT', 'MEC',
      'ADVANTAGE', 'ESSENCE', 'INTENSE', 'ZEN',
      '1.0', '1.4', '1.6', '1.8', '2.0', '2.4', '3.0',
      '4P', '5P', '2P', // portas
    ];

    const words = model.trim().split(/\s+/);
    const normalizedWords: string[] = [];

    for (const word of words) {
      const upperWord = word.toUpperCase();

      // Para se encontrar número ou palavra-chave de versão
      if (/^\d/.test(upperWord) || versionKeywords.some(kw => upperWord.includes(kw))) {
        break;
      }

      normalizedWords.push(word);
    }

    // Pega no máximo 2 palavras (ex: "LAND CRUISER", "SANTA FE")
    const normalized = normalizedWords.slice(0, 2).join(' ');

    return normalized || model.split(/\s+/)[0]; // Fallback: primeira palavra
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
    console.log(`[SUIV API] 🚀 Iniciando busca de revisões para ${brand} ${model} ${year}`);

    try {
      // Passo 1: Buscar ID da marca
      console.log(`[SUIV API] 1️⃣ Buscando ID da marca "${brand}"...`);
      const makerId = await this.getMakerId(brand);
      if (!makerId) {
        console.error(`[SUIV API] ❌ Marca "${brand}" não encontrada na API SUIV`);
        throw new PlateApiError(`Marca "${brand}" não encontrada na API SUIV`);
      }
      console.log(`[SUIV API] ✅ Marca encontrada! ID: ${makerId}`);

      // Passo 2: Buscar ID do modelo
      console.log(`[SUIV API] 2️⃣ Buscando ID do modelo "${model}" (makerId: ${makerId})...`);
      const modelId = await this.getModelId(makerId, model);
      if (!modelId) {
        console.error(`[SUIV API] ❌ Modelo "${model}" não encontrado para a marca "${brand}"`);
        throw new PlateApiError(`Modelo "${model}" não encontrado para a marca "${brand}"`);
      }
      console.log(`[SUIV API] ✅ Modelo encontrado! ID: ${modelId}`);

      // Passo 3: Buscar ID da versão
      console.log(`[SUIV API] 3️⃣ Buscando ID da versão para ano ${year} (modelId: ${modelId})...`);
      const versionId = await this.getVersionId(modelId, year);
      if (!versionId) {
        console.error(`[SUIV API] ❌ Versão não encontrada para ${brand} ${model} (${year})`);
        throw new PlateApiError(`Versão não encontrada para ${brand} ${model} (${year})`);
      }
      console.log(`[SUIV API] ✅ Versão encontrada! ID: ${versionId}`);

      // Passo 4: Buscar plano de revisão
      console.log(`[SUIV API] 4️⃣ Buscando plano de revisão (versionId: ${versionId}, year: ${year})...`);
      const revisionPlan = await this.request<RevisionPlanItem[]>('/api/v4/RevisionPlan', {
        versionId: versionId.toString(),
        year: year.toString(),
      });
      console.log(`[SUIV API] ✅ Plano de revisão retornado! ${revisionPlan?.length || 0} itens`);

      if (revisionPlan && revisionPlan.length > 0) {
        console.log(`[SUIV API] 📋 Primeiro item do plano:`, JSON.stringify(revisionPlan[0], null, 2));
      }

      // Converte o plano de revisão SUIV para o formato ManufacturerRevision
      console.log(`[SUIV API] 🔄 Convertendo plano de revisão para formato interno...`);
      const converted = this.convertRevisionPlanToManufacturerRevisions(revisionPlan);
      console.log(`[SUIV API] ✅ Conversão concluída! ${converted.length} revisões geradas`);

      return converted;
    } catch (error) {
      console.error(`[SUIV API] ❌ Erro durante busca de revisões:`, error);
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
    console.log(`[SUIV CONVERT] 🔄 Iniciando conversão de ${revisionPlan?.length || 0} itens do plano...`);

    if (!revisionPlan || revisionPlan.length === 0) {
      console.warn(`[SUIV CONVERT] ⚠️ Plano de revisão vazio ou null`);
      return [];
    }

    const revisions: ManufacturerRevision[] = [];
    let totalParts = 0;
    let totalInspections = 0;

    for (const item of revisionPlan) {
      console.log(`[SUIV CONVERT] 📦 Item ${item.kilometers}km/${item.months}m: ${item.changedParts?.length || 0} peças, ${item.inspections?.length || 0} inspeções`);

      // Adiciona peças a serem trocadas
      if (item.changedParts && item.changedParts.length > 0) {
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
          totalParts++;
        }
      }

      // Adiciona inspeções
      if (item.inspections && item.inspections.length > 0) {
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
          totalInspections++;
        }
      }
    }

    console.log(`[SUIV CONVERT] ✅ Conversão concluída: ${totalParts} peças + ${totalInspections} inspeções = ${revisions.length} revisões totais`);
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
