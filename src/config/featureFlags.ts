/**
 * Feature Flags Configuration
 *
 * Este arquivo centraliza o controle de features do WiseDrive,
 * permitindo alternar facilmente entre diferentes APIs e modos de operação.
 *
 * Para alternar entre os modos, modifique o arquivo .env na raiz do projeto.
 */

export type VehicleApiMode = 'fipe' | 'plate';
export type MaintenanceMode = 'generic' | 'manufacturer';

interface FeatureConfig {
  // Modo de cadastro de veículos
  vehicleApiMode: VehicleApiMode;

  // Modo de recomendações de manutenção
  maintenanceMode: MaintenanceMode;

  // Configurações da API com placa (se habilitada)
  carApi: {
    url: string;
    apiKey: string;
  };
}

/**
 * Configuração de feature flags baseada em variáveis de ambiente
 */
export const featureConfig: FeatureConfig = {
  vehicleApiMode: (import.meta.env.VITE_VEHICLE_API_MODE || 'fipe') as VehicleApiMode,
  maintenanceMode: (import.meta.env.VITE_MAINTENANCE_MODE || 'generic') as MaintenanceMode,
  carApi: {
    url: import.meta.env.VITE_CAR_API_URL || '',
    apiKey: import.meta.env.VITE_CAR_API_KEY || '',
  },
};

/**
 * Helper functions para verificar o modo atual
 */
export const isUsingFipeApi = () => featureConfig.vehicleApiMode === 'fipe';
export const isUsingPlateApi = () => featureConfig.vehicleApiMode === 'plate';
export const isUsingGenericMaintenance = () => featureConfig.maintenanceMode === 'generic';
export const isUsingManufacturerMaintenance = () => featureConfig.maintenanceMode === 'manufacturer';

/**
 * Validação de configuração
 * Retorna erros se a configuração estiver incompleta
 */
export const validateConfig = (): string[] => {
  const errors: string[] = [];

  // Valida configuração da API com placa
  if (isUsingPlateApi() || isUsingManufacturerMaintenance()) {
    if (!featureConfig.carApi.url) {
      errors.push('VITE_CAR_API_URL não configurada. Necessária para mode="plate" ou "manufacturer"');
    }
    if (!featureConfig.carApi.apiKey) {
      errors.push('VITE_CAR_API_KEY não configurada. Necessária para mode="plate" ou "manufacturer"');
    }
  }

  // Valida valores dos modos
  if (!['fipe', 'plate'].includes(featureConfig.vehicleApiMode)) {
    errors.push(`VITE_VEHICLE_API_MODE inválido: "${featureConfig.vehicleApiMode}". Use "fipe" ou "plate"`);
  }

  if (!['generic', 'manufacturer'].includes(featureConfig.maintenanceMode)) {
    errors.push(`VITE_MAINTENANCE_MODE inválido: "${featureConfig.maintenanceMode}". Use "generic" ou "manufacturer"`);
  }

  return errors;
};

/**
 * Log de configuração atual (útil para debug)
 */
export const logCurrentConfig = () => {
  console.group('🚗 WiseDrive - Feature Flags');
  console.log('Modo de Veículos:', featureConfig.vehicleApiMode);
  console.log('Modo de Manutenção:', featureConfig.maintenanceMode);
  console.log('API URL:', featureConfig.carApi.url || '(não configurada)');
  console.log('API Key:', featureConfig.carApi.apiKey ? '***configurada***' : '(não configurada)');

  const errors = validateConfig();
  if (errors.length > 0) {
    console.warn('⚠️ Avisos de configuração:');
    errors.forEach(error => console.warn(`  - ${error}`));
  } else {
    console.log('✅ Configuração válida');
  }

  console.groupEnd();
};
