/**
 * Vehicle Revisions Cache Service
 *
 * Gerencia o cache de planos de revisão do fabricante para economizar requisições na API.
 *
 * REGRA DE OURO: Consulta API apenas UMA VEZ por veículo!
 * Depois disso, todas as consultas vêm do banco de dados.
 */

import { supabase } from "@/integrations/supabase/client";
import { getManufacturerRevisions } from "@/services/plateApi";
import { ManufacturerRevision } from "@/services/plateApi";

export interface CachedRevision {
  id: string;
  vehicle_id: string;
  category: string;
  item: string;
  description: string;
  km_interval: number | null;
  time_interval: number | null;
  type: string;
  criticality: string;
  min_cost: number;
  max_cost: number;
  estimated_time: number | null;
  source: string;
}

/**
 * Busca revisões do banco de dados (SEMPRE tenta primeiro!)
 */
export async function getCachedRevisions(vehicleId: string): Promise<CachedRevision[]> {
  const { data, error } = await supabase
    .from('vehicle_manufacturer_revisions')
    .select('*')
    .eq('vehicle_id', vehicleId);

  if (error) {
    console.error('Error fetching cached revisions:', error);
    return [];
  }

  return data || [];
}

/**
 * Verifica se o veículo já tem revisões no cache
 */
export async function hasRevisionsCached(vehicleId: string): Promise<boolean> {
  const { data } = await supabase
    .from('vehicles')
    .select('revisions_fetched')
    .eq('id', vehicleId)
    .single();

  return data?.revisions_fetched === true;
}

/**
 * Busca revisões da API e salva no cache
 * ATENÇÃO: Esta função faz uma requisição à API SUIV! Use com cuidado!
 */
export async function fetchAndCacheRevisions(
  vehicleId: string,
  brand: string,
  model: string,
  year: number
): Promise<CachedRevision[]> {
  console.log(`[CACHE] Fetching revisions from API for ${brand} ${model} ${year}...`);

  try {
    // Busca revisões da API SUIV
    const apiRevisions = await getManufacturerRevisions(brand, model, year);

    if (!apiRevisions || apiRevisions.length === 0) {
      console.warn(`[CACHE] No revisions found for ${brand} ${model} ${year}`);

      // Mesmo sem revisões, marca como "fetched" para não tentar novamente
      await supabase
        .from('vehicles')
        .update({
          revisions_fetched: true,
          revisions_fetched_at: new Date().toISOString(),
        })
        .eq('id', vehicleId);

      return [];
    }

    // Converte revisões da API para o formato do banco
    const revisionsToInsert = apiRevisions.map((rev: ManufacturerRevision) => ({
      vehicle_id: vehicleId,
      category: rev.category,
      item: rev.item,
      description: rev.description,
      km_interval: rev.kmInterval,
      time_interval: rev.timeInterval,
      type: rev.type || 'Preventiva',
      criticality: rev.criticidade,
      min_cost: rev.custoEstimado ? rev.custoEstimado * 0.8 : 0, // Estimativa: 80% do custo
      max_cost: rev.custoEstimado || 0,
      estimated_time: rev.tempoEstimado,
      source: 'suiv',
    }));

    // Salva no banco de dados
    const { data, error } = await supabase
      .from('vehicle_manufacturer_revisions')
      .insert(revisionsToInsert)
      .select();

    if (error) {
      console.error('[CACHE] Error saving revisions to database:', error);
      throw error;
    }

    // Marca o veículo como "revisions_fetched"
    await supabase
      .from('vehicles')
      .update({
        revisions_fetched: true,
        revisions_fetched_at: new Date().toISOString(),
      })
      .eq('id', vehicleId);

    console.log(`[CACHE] Successfully cached ${data.length} revisions for vehicle ${vehicleId}`);

    return data as CachedRevision[];
  } catch (error) {
    console.error('[CACHE] Error fetching revisions from API:', error);

    // Marca como fetched mesmo com erro para evitar loops
    await supabase
      .from('vehicles')
      .update({
        revisions_fetched: true,
        revisions_fetched_at: new Date().toISOString(),
      })
      .eq('id', vehicleId);

    return [];
  }
}

/**
 * Função principal: Obtém revisões (do cache ou da API)
 *
 * Esta é a função que você deve usar em todo o app!
 * Ela SEMPRE busca do cache primeiro, e só consulta a API se necessário.
 */
export async function getVehicleRevisions(
  vehicleId: string,
  brand: string,
  model: string,
  year: number
): Promise<CachedRevision[]> {
  // 1. Tenta buscar do cache primeiro
  const cached = await getCachedRevisions(vehicleId);

  if (cached.length > 0) {
    console.log(`[CACHE] Using ${cached.length} cached revisions for vehicle ${vehicleId}`);
    return cached;
  }

  // 2. Verifica se já tentamos buscar antes (mesmo que não tenha encontrado nada)
  const alreadyFetched = await hasRevisionsCached(vehicleId);

  if (alreadyFetched) {
    console.log(`[CACHE] Revisions already fetched for vehicle ${vehicleId}, but none found`);
    return [];
  }

  // 3. Só agora busca da API (PRIMEIRA E ÚNICA VEZ!)
  console.log(`[CACHE] 🚨 MAKING API CALL for vehicle ${vehicleId} 🚨`);
  return await fetchAndCacheRevisions(vehicleId, brand, model, year);
}

/**
 * Limpa o cache de um veículo específico
 * (Útil para quando implementar a atualização anual)
 */
export async function clearVehicleCache(vehicleId: string): Promise<void> {
  // Deleta revisões do cache
  await supabase
    .from('vehicle_manufacturer_revisions')
    .delete()
    .eq('vehicle_id', vehicleId);

  // Marca como não-fetched
  await supabase
    .from('vehicles')
    .update({
      revisions_fetched: false,
      revisions_fetched_at: null,
    })
    .eq('id', vehicleId);

  console.log(`[CACHE] Cleared cache for vehicle ${vehicleId}`);
}

/**
 * Estatísticas de uso do cache (útil para monitorar economia)
 */
export async function getCacheStats(): Promise<{
  totalVehicles: number;
  vehiclesWithCache: number;
  totalRevisionsCached: number;
  estimatedApiCallsSaved: number;
}> {
  const { count: totalVehicles } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true });

  const { count: vehiclesWithCache } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('revisions_fetched', true);

  const { count: totalRevisionsCached } = await supabase
    .from('vehicle_manufacturer_revisions')
    .select('*', { count: 'exact', head: true });

  // Cada vez que busca do cache ao invés da API = 1 call economizado
  const estimatedAPICallsSaved = (vehiclesWithCache || 0) - (vehiclesWithCache || 0); // Será incrementado com uso

  return {
    totalVehicles: totalVehicles || 0,
    vehiclesWithCache: vehiclesWithCache || 0,
    totalRevisionsCached: totalRevisionsCached || 0,
    estimatedAPICallsSaved,
  };
}
