/**
 * API Usage Logger
 *
 * Serviço para logar todas as chamadas de API externa no Supabase
 * para controle de custos e analytics no dashboard administrativo
 */

import { supabase } from '../integrations/supabase/client';

export interface ApiLogParams {
  userId?: string;
  workshopId?: string;
  apiName: 'suiv' | 'fipe' | 'other';
  endpoint: string;
  method?: string;
  success: boolean;
  responseTimeMs: number;
  statusCode?: number;
  errorMessage?: string;
  requestParams?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Loga uma chamada de API no banco de dados
 *
 * @param params - Parâmetros da chamada de API
 */
export async function logApiUsage(params: ApiLogParams): Promise<void> {
  try {
    const { error } = await supabase.from('api_usage_logs').insert({
      user_id: params.userId || null,
      workshop_id: params.workshopId || null,
      api_name: params.apiName,
      endpoint: params.endpoint,
      method: params.method || 'GET',
      success: params.success,
      response_time_ms: params.responseTimeMs,
      status_code: params.statusCode,
      error_message: params.errorMessage,
      request_params: params.requestParams,
      metadata: params.metadata,
    });

    if (error) {
      // Log do erro mas não faz throw para não quebrar a aplicação
      console.error('[API Logger] Erro ao salvar log de API:', error);
    }
  } catch (error) {
    // Fail silently - logging não deve quebrar a aplicação
    console.error('[API Logger] Erro inesperado ao salvar log:', error);
  }
}

/**
 * Helper para medir tempo de execução e logar automaticamente
 *
 * @example
 * const result = await withApiLogging(
 *   { apiName: 'suiv', endpoint: '/api/v4/VehicleInfo/byplate' },
 *   async () => fetch('...')
 * );
 */
export async function withApiLogging<T>(
  logInfo: Omit<ApiLogParams, 'success' | 'responseTimeMs' | 'statusCode' | 'errorMessage'>,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  let success = false;
  let statusCode: number | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await apiCall();
    success = true;
    statusCode = 200; // Assume sucesso se não houver erro
    return result;
  } catch (error: any) {
    success = false;
    errorMessage = error?.message || 'Unknown error';
    statusCode = error?.statusCode || 500;
    throw error; // Re-throw para não quebrar o fluxo
  } finally {
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);

    // Loga em background (fire and forget)
    logApiUsage({
      ...logInfo,
      success,
      responseTimeMs,
      statusCode,
      errorMessage,
    }).catch(() => {
      // Ignora erros do logging
    });
  }
}

/**
 * Busca o userId do contexto atual (se disponível)
 * Você pode expandir isso para buscar do AuthContext
 */
export function getCurrentUserId(): string | undefined {
  try {
    const { data } = supabase.auth.getUser();
    return data?.user?.id;
  } catch {
    return undefined;
  }
}

/**
 * Busca o workshopId do contexto atual (se disponível)
 * Você pode expandir isso para buscar do contexto de oficina
 */
export async function getCurrentWorkshopId(): Promise<string | undefined> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    const { data } = await supabase
      .from('workshops')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    return data?.id;
  } catch {
    return undefined;
  }
}
