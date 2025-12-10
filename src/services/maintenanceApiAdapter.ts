/**
 * Maintenance API Adapter
 *
 * Abstração que unifica dois modos de recomendações de manutenção:
 * - Generic: Tabela genérica hardcoded (gratuito)
 * - Manufacturer: Revisões específicas do fabricante via API (pago)
 *
 * O adapter escolhe automaticamente qual fonte usar baseado nas feature flags.
 */

import { featureConfig, isUsingManufacturerMaintenance } from '../config/featureFlags';
import { MAINTENANCE_RECOMMENDATIONS, MaintenanceRecommendation } from '../constants/maintenanceRecommendations';
import * as plateApi from './plateApi';

/**
 * Interface unificada para recomendações de manutenção
 * (já compatível com MaintenanceRecommendation existente)
 */
export type MaintenanceItem = MaintenanceRecommendation;

/**
 * Filtros para busca de recomendações
 */
export interface MaintenanceFilter {
  category?: string;
  type?: 'Preventiva' | 'Corretiva';
  criticidade?: 'Crítica' | 'Alta' | 'Média' | 'Baixa';
  maxKm?: number; // Retorna apenas itens com kmInterval <= maxKm
}

/**
 * Resultado da busca de recomendações
 */
export interface MaintenanceResult {
  success: boolean;
  data?: MaintenanceItem[];
  source: 'generic' | 'manufacturer' | 'error';
  error?: string;
}

/**
 * Informações do veículo para buscar revisões específicas
 */
export interface VehicleInfo {
  brand: string;
  model: string;
  year: number;
}

/**
 * Maintenance API Adapter Class
 */
class MaintenanceApiAdapter {
  /**
   * Cache de revisões do fabricante (para evitar múltiplas chamadas à API)
   * Key: `${brand}_${model}_${year}`
   */
  private manufacturerCache = new Map<string, MaintenanceItem[]>();

  /**
   * Verifica se está usando revisões do fabricante
   */
  isUsingManufacturerMode(): boolean {
    return isUsingManufacturerMaintenance();
  }

  /**
   * Verifica se está usando recomendações genéricas
   */
  isUsingGenericMode(): boolean {
    return !isUsingManufacturerMaintenance();
  }

  /**
   * Busca recomendações de manutenção
   *
   * @param vehicleInfo - Informações do veículo (necessário apenas para modo manufacturer)
   * @param filter - Filtros opcionais
   * @returns Lista de recomendações
   */
  async getRecommendations(
    vehicleInfo?: VehicleInfo,
    filter?: MaintenanceFilter
  ): Promise<MaintenanceResult> {
    try {
      let recommendations: MaintenanceItem[];

      // Modo Manufacturer: busca revisões específicas da API
      if (this.isUsingManufacturerMode()) {
        if (!vehicleInfo) {
          return {
            success: false,
            source: 'error',
            error: 'Informações do veículo são necessárias para buscar revisões do fabricante',
          };
        }

        recommendations = await this.fetchManufacturerRevisions(vehicleInfo);
      }
      // Modo Generic: usa tabela hardcoded
      else {
        recommendations = [...MAINTENANCE_RECOMMENDATIONS];
      }

      // Aplica filtros se fornecidos
      if (filter) {
        recommendations = this.applyFilters(recommendations, filter);
      }

      return {
        success: true,
        data: recommendations,
        source: this.isUsingManufacturerMode() ? 'manufacturer' : 'generic',
      };
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);

      // Fallback para genérico em caso de erro
      return {
        success: false,
        source: 'error',
        data: filter ? this.applyFilters([...MAINTENANCE_RECOMMENDATIONS], filter) : [...MAINTENANCE_RECOMMENDATIONS],
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar recomendações',
      };
    }
  }

  /**
   * Busca revisões específicas do fabricante via API
   */
  private async fetchManufacturerRevisions(vehicleInfo: VehicleInfo): Promise<MaintenanceItem[]> {
    const cacheKey = `${vehicleInfo.brand}_${vehicleInfo.model}_${vehicleInfo.year}`;

    // Verifica cache primeiro
    if (this.manufacturerCache.has(cacheKey)) {
      return this.manufacturerCache.get(cacheKey)!;
    }

    // Busca da API
    const revisions = await plateApi.getManufacturerRevisions(
      vehicleInfo.brand,
      vehicleInfo.model,
      vehicleInfo.year
    );

    // Converte formato da API para MaintenanceItem
    const items: MaintenanceItem[] = revisions.map(revision => ({
      category: revision.category,
      item: revision.item,
      description: revision.description,
      kmInterval: revision.kmInterval,
      timeInterval: revision.timeInterval,
      type: revision.type,
      criticidade: revision.criticidade,
      custoMinimo: revision.custoEstimado || 0,
      custoMaximo: revision.custoEstimado ? revision.custoEstimado * 1.5 : 0,
    }));

    // Salva no cache
    this.manufacturerCache.set(cacheKey, items);

    return items;
  }

  /**
   * Aplica filtros às recomendações
   */
  private applyFilters(
    recommendations: MaintenanceItem[],
    filter: MaintenanceFilter
  ): MaintenanceItem[] {
    let filtered = recommendations;

    if (filter.category) {
      filtered = filtered.filter(item => item.category === filter.category);
    }

    if (filter.type) {
      filtered = filtered.filter(item => item.type === filter.type);
    }

    if (filter.criticidade) {
      filtered = filtered.filter(item => item.criticidade === filter.criticidade);
    }

    if (filter.maxKm !== undefined) {
      filtered = filtered.filter(
        item => item.kmInterval !== null && item.kmInterval <= filter.maxKm!
      );
    }

    return filtered;
  }

  /**
   * Busca recomendações que estão vencidas ou próximas do vencimento
   *
   * @param currentKm - Quilometragem atual do veículo
   * @param lastMaintenanceKm - Quilometragem da última manutenção
   * @param vehicleInfo - Informações do veículo
   * @param thresholdKm - Limite em km para considerar "próximo do vencimento" (padrão: 1000km)
   */
  async getDueRecommendations(
    currentKm: number,
    lastMaintenanceKm: number,
    vehicleInfo?: VehicleInfo,
    thresholdKm: number = 1000
  ): Promise<MaintenanceResult> {
    const result = await this.getRecommendations(vehicleInfo);

    if (!result.success || !result.data) {
      return result;
    }

    const kmSinceLastMaintenance = currentKm - lastMaintenanceKm;

    const dueItems = result.data.filter(item => {
      if (item.kmInterval === null) return false;

      const remainingKm = item.kmInterval - kmSinceLastMaintenance;
      return remainingKm <= thresholdKm;
    });

    return {
      ...result,
      data: dueItems,
    };
  }

  /**
   * Busca todas as categorias disponíveis
   */
  async getCategories(vehicleInfo?: VehicleInfo): Promise<string[]> {
    const result = await this.getRecommendations(vehicleInfo);

    if (!result.success || !result.data) {
      return [];
    }

    const categories = new Set(result.data.map(item => item.category));
    return Array.from(categories).sort();
  }

  /**
   * Limpa o cache de revisões do fabricante
   */
  clearCache(): void {
    this.manufacturerCache.clear();
  }

  /**
   * Retorna informações sobre o modo atual
   */
  getCurrentMode() {
    return {
      mode: featureConfig.maintenanceMode,
      isManufacturerMode: this.isUsingManufacturerMode(),
      isGenericMode: this.isUsingGenericMode(),
      description:
        featureConfig.maintenanceMode === 'generic'
          ? 'Modo Genérico - Tabela de manutenções padrão (gratuito)'
          : 'Modo Fabricante - Revisões específicas do fabricante (requer assinatura)',
    };
  }

  /**
   * Busca uma recomendação específica por item
   */
  async findByItem(
    itemName: string,
    vehicleInfo?: VehicleInfo
  ): Promise<MaintenanceItem | undefined> {
    const result = await this.getRecommendations(vehicleInfo);

    if (!result.success || !result.data) {
      return undefined;
    }

    return result.data.find(
      item => item.item.toLowerCase() === itemName.toLowerCase()
    );
  }
}

// Exporta instância singleton
export const maintenanceApi = new MaintenanceApiAdapter();

/**
 * Funções auxiliares para facilitar o uso
 */

/**
 * Busca recomendações de manutenção
 */
export const getMaintenanceRecommendations = (
  vehicleInfo?: VehicleInfo,
  filter?: MaintenanceFilter
) => maintenanceApi.getRecommendations(vehicleInfo, filter);

/**
 * Busca recomendações vencidas ou próximas
 */
export const getDueMaintenances = (
  currentKm: number,
  lastMaintenanceKm: number,
  vehicleInfo?: VehicleInfo,
  thresholdKm?: number
) => maintenanceApi.getDueRecommendations(currentKm, lastMaintenanceKm, vehicleInfo, thresholdKm);

/**
 * Busca categorias disponíveis
 */
export const getMaintenanceCategories = (vehicleInfo?: VehicleInfo) =>
  maintenanceApi.getCategories(vehicleInfo);
