/**
 * Vehicle API Adapter
 *
 * Abstração que unifica as duas APIs de veículos:
 * - Fipe API (gratuita, requer seleção manual de marca/modelo/ano)
 * - Plate API (paga, busca automática por placa)
 *
 * O adapter escolhe automaticamente qual API usar baseado nas feature flags.
 */

import { featureConfig, isUsingPlateApi } from '../config/featureFlags';
import { fipeApi } from './fipeApi';
import * as plateApi from './plateApi';

/**
 * Interface unificada para dados de veículo
 * Compatível com ambas as APIs
 */
export interface VehicleData {
  brand: string;
  model: string;
  version?: string;
  year: number;
  yearFab?: number;
  plate?: string;
  // Campos adicionais da Plate API (opcionais)
  color?: string;
  fuel?: string;
}

/**
 * Interface para marca de veículo
 */
export interface VehicleBrand {
  code: string;
  name: string;
}

/**
 * Interface para modelo de veículo
 */
export interface VehicleModel {
  code: string;
  name: string;
}

/**
 * Interface para ano de veículo
 */
export interface VehicleYear {
  code: string;
  name: string;
}

/**
 * Resultado de busca por placa
 */
export interface PlateSearchResult {
  success: boolean;
  data?: VehicleData;
  error?: string;
}

/**
 * Vehicle API Adapter Class
 */
class VehicleApiAdapter {
  /**
   * Verifica se o modo atual suporta busca por placa
   */
  supportsPlateSearch(): boolean {
    return isUsingPlateApi();
  }

  /**
   * Verifica se o modo atual requer seleção manual (marca/modelo/ano)
   */
  requiresManualSelection(): boolean {
    return !isUsingPlateApi();
  }

  /**
   * Busca veículo pela placa (apenas no modo Plate API)
   *
   * @param plate - Placa do veículo
   * @returns Dados do veículo ou erro
   */
  async searchByPlate(plate: string): Promise<PlateSearchResult> {
    if (!this.supportsPlateSearch()) {
      return {
        success: false,
        error: 'Busca por placa não disponível no modo atual. Configure VITE_VEHICLE_API_MODE="plate"',
      };
    }

    try {
      const result = await plateApi.searchByPlate(plate);

      return {
        success: true,
        data: {
          brand: result.brand,
          model: result.model,
          version: result.version,
          year: result.year,
          yearFab: result.yearFab,
          plate: result.plate,
          color: result.color,
          fuel: result.fuel,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar veículo pela placa',
      };
    }
  }

  /**
   * Busca marcas de veículos (apenas no modo Fipe)
   */
  async getBrands(): Promise<VehicleBrand[]> {
    if (!this.requiresManualSelection()) {
      throw new Error('Busca de marcas não necessária no modo Plate API');
    }

    const brands = await fipeApi.getBrands();
    return brands.map((brand: any) => ({
      code: brand.codigo,
      name: brand.nome,
    }));
  }

  /**
   * Busca modelos de uma marca (apenas no modo Fipe)
   */
  async getModels(brandCode: string): Promise<VehicleModel[]> {
    if (!this.requiresManualSelection()) {
      throw new Error('Busca de modelos não necessária no modo Plate API');
    }

    const models = await fipeApi.getModels(brandCode);
    return models.modelos.map((model: any) => ({
      code: model.codigo.toString(),
      name: model.nome,
    }));
  }

  /**
   * Busca anos de um modelo (apenas no modo Fipe)
   */
  async getYears(brandCode: string, modelCode: string): Promise<VehicleYear[]> {
    if (!this.requiresManualSelection()) {
      throw new Error('Busca de anos não necessária no modo Plate API');
    }

    const years = await fipeApi.getYears(brandCode, modelCode);
    return years.map((year: any) => ({
      code: year.codigo,
      name: year.nome,
    }));
  }

  /**
   * Busca detalhes completos de um veículo (apenas no modo Fipe)
   */
  async getVehicleDetails(
    brandCode: string,
    modelCode: string,
    yearCode: string
  ): Promise<VehicleData> {
    if (!this.requiresManualSelection()) {
      throw new Error('Busca de detalhes não necessária no modo Plate API');
    }

    const details = await fipeApi.getVehicleDetails(brandCode, modelCode, yearCode);

    // Extrai o ano numérico do formato "2020-1" ou "2020 Gasolina"
    const yearMatch = details.AnoModelo.toString().match(/^\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

    return {
      brand: details.Marca,
      model: details.Modelo,
      version: details.Modelo, // Fipe já retorna o nome completo em Modelo
      year,
      fuel: details.Combustivel,
    };
  }

  /**
   * Valida se uma placa é válida
   */
  isValidPlate(plate: string): boolean {
    return plateApi.isValidPlate(plate);
  }

  /**
   * Formata uma placa para exibição
   */
  formatPlate(plate: string): string {
    return plateApi.formatPlate(plate);
  }

  /**
   * Retorna informações sobre o modo atual
   */
  getCurrentMode() {
    return {
      mode: featureConfig.vehicleApiMode,
      supportsPlateSearch: this.supportsPlateSearch(),
      requiresManualSelection: this.requiresManualSelection(),
      description:
        featureConfig.vehicleApiMode === 'fipe'
          ? 'Modo FIPE - Seleção manual de marca/modelo/ano (gratuito)'
          : 'Modo Placa - Busca automática por placa (requer assinatura)',
    };
  }
}

// Exporta instância singleton
export const vehicleApi = new VehicleApiAdapter();

/**
 * Hooks e funções auxiliares para facilitar o uso
 */

/**
 * Hook para verificar se está no modo de busca por placa
 */
export const useIsPlateMode = () => vehicleApi.supportsPlateSearch();

/**
 * Hook para verificar se está no modo Fipe
 */
export const useIsFipeMode = () => vehicleApi.requiresManualSelection();
