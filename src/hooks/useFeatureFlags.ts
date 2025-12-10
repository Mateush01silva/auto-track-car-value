/**
 * Custom Hooks for Feature Flags
 *
 * Hooks React para facilitar o uso dos feature flags e adapters de API
 */

import { useState, useEffect, useCallback } from 'react';
import { vehicleApi, VehicleData, PlateSearchResult } from '../services/vehicleApiAdapter';
import {
  maintenanceApi,
  MaintenanceItem,
  MaintenanceFilter,
  VehicleInfo,
} from '../services/maintenanceApiAdapter';
import { featureConfig } from '../config/featureFlags';

/**
 * Hook para verificar o modo de veículos atual
 */
export function useVehicleMode() {
  return {
    mode: featureConfig.vehicleApiMode,
    isPlateMode: vehicleApi.supportsPlateSearch(),
    isFipeMode: vehicleApi.requiresManualSelection(),
    info: vehicleApi.getCurrentMode(),
  };
}

/**
 * Hook para verificar o modo de manutenção atual
 */
export function useMaintenanceMode() {
  return {
    mode: featureConfig.maintenanceMode,
    isManufacturerMode: maintenanceApi.isUsingManufacturerMode(),
    isGenericMode: maintenanceApi.isUsingGenericMode(),
    info: maintenanceApi.getCurrentMode(),
  };
}

/**
 * Hook para busca de veículo por placa
 */
export function usePlateSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VehicleData | null>(null);

  const searchByPlate = useCallback(async (plate: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const searchResult = await vehicleApi.searchByPlate(plate);

      if (searchResult.success && searchResult.data) {
        setResult(searchResult.data);
      } else {
        setError(searchResult.error || 'Erro ao buscar veículo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    searchByPlate,
    isLoading,
    error,
    result,
    reset,
    isAvailable: vehicleApi.supportsPlateSearch(),
  };
}

/**
 * Hook para buscar recomendações de manutenção
 */
export function useMaintenanceRecommendations(
  vehicleInfo?: VehicleInfo,
  filter?: MaintenanceFilter
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MaintenanceItem[]>([]);
  const [source, setSource] = useState<'generic' | 'manufacturer' | 'error'>('generic');

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await maintenanceApi.getRecommendations(vehicleInfo, filter);

      if (result.success && result.data) {
        setRecommendations(result.data);
        setSource(result.source);
      } else {
        setError(result.error || 'Erro ao buscar recomendações');
        setSource('error');
        // Usa fallback em caso de erro
        if (result.data) {
          setRecommendations(result.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setSource('error');
    } finally {
      setIsLoading(false);
    }
  }, [vehicleInfo, filter]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    source,
    refetch: fetchRecommendations,
  };
}

/**
 * Hook para buscar manutenções vencidas
 */
export function useDueMaintenances(
  currentKm: number,
  lastMaintenanceKm: number,
  vehicleInfo?: VehicleInfo,
  thresholdKm: number = 1000
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueItems, setDueItems] = useState<MaintenanceItem[]>([]);

  const fetchDueMaintenances = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await maintenanceApi.getDueRecommendations(
        currentKm,
        lastMaintenanceKm,
        vehicleInfo,
        thresholdKm
      );

      if (result.success && result.data) {
        setDueItems(result.data);
      } else {
        setError(result.error || 'Erro ao buscar manutenções vencidas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [currentKm, lastMaintenanceKm, vehicleInfo, thresholdKm]);

  useEffect(() => {
    fetchDueMaintenances();
  }, [fetchDueMaintenances]);

  return {
    dueItems,
    isLoading,
    error,
    refetch: fetchDueMaintenances,
  };
}

/**
 * Hook para buscar categorias de manutenção
 */
export function useMaintenanceCategories(vehicleInfo?: VehicleInfo) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);

    try {
      const cats = await maintenanceApi.getCategories(vehicleInfo);
      setCategories(cats);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleInfo]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    refetch: fetchCategories,
  };
}

/**
 * Hook para validação de placa
 */
export function usePlateValidation() {
  const isValid = useCallback((plate: string) => {
    return vehicleApi.isValidPlate(plate);
  }, []);

  const format = useCallback((plate: string) => {
    return vehicleApi.formatPlate(plate);
  }, []);

  return {
    isValid,
    format,
  };
}

/**
 * Hook completo que combina todos os feature flags
 */
export function useAllFeatureFlags() {
  const vehicleMode = useVehicleMode();
  const maintenanceMode = useMaintenanceMode();

  return {
    vehicle: vehicleMode,
    maintenance: maintenanceMode,
    config: featureConfig,
  };
}
