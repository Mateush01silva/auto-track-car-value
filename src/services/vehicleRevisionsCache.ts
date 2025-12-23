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
  console.log(`[CACHE] 🔍 getCachedRevisions: Buscando do banco para vehicle_id = ${vehicleId}`);

  const { data, error } = await supabase
    .from('vehicle_manufacturer_revisions')
    .select('*')
    .eq('vehicle_id', vehicleId);

  if (error) {
    console.error('[CACHE] ❌ Error fetching cached revisions:', error);
    console.error('[CACHE] Erro detalhado:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return [];
  }

  console.log(`[CACHE] 📊 getCachedRevisions: Encontrou ${data?.length || 0} revisões no banco`);

  if (data && data.length > 0) {
    console.log(`[CACHE] ✅ Revisões encontradas:`, data.map(r => `${r.category} - ${r.item}`));
  } else {
    console.log(`[CACHE] ⚠️ Nenhuma revisão encontrada no banco para vehicle_id ${vehicleId}`);
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
  console.log(`[CACHE] 🔄 Iniciando busca de revisões da API SUIV para ${brand} ${model} ${year}...`);
  console.log(`[CACHE] 📋 Vehicle ID: ${vehicleId}`);

  try {
    // Busca revisões da API SUIV
    console.log(`[CACHE] 📡 Chamando getManufacturerRevisions...`);
    const apiRevisions = await getManufacturerRevisions(brand, model, year);
    console.log(`[CACHE] ✅ API retornou ${apiRevisions?.length || 0} revisões`);

    if (!apiRevisions || apiRevisions.length === 0) {
      console.warn(`[CACHE] ⚠️ Nenhuma revisão encontrada para ${brand} ${model} ${year}`);
      console.warn(`[CACHE] Isso pode significar:`);
      console.warn(`  1. O fabricante não tem plano de revisão para este modelo/ano`);
      console.warn(`  2. A API SUIV não tem dados para este veículo`);
      console.warn(`  3. Houve erro na busca por marca/modelo/versão`);

      // ⚠️ NÃO marca como fetched quando retorna vazio
      // Isso permite tentar novamente depois (pode ser problema temporário da API)
      console.warn(`[CACHE] ⚠️ NÃO marcando como fetched - permitirá nova tentativa`);

      return [];
    }

    console.log(`[CACHE] 💾 Salvando ${apiRevisions.length} revisões no banco de dados...`);

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

    // Salva no banco de dados usando UPSERT (atualiza se já existe)
    // Isso evita erro de duplicate key quando já existem revisões
    const { data, error } = await supabase
      .from('vehicle_manufacturer_revisions')
      .upsert(revisionsToInsert, {
        onConflict: 'vehicle_id,category,item',
        ignoreDuplicates: false, // Atualiza os registros existentes
      })
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

    console.log(`[CACHE] ✅ Successfully cached ${data.length} revisions for vehicle ${vehicleId}`);

    return data as CachedRevision[];
  } catch (error) {
    console.error('[CACHE] ❌ ERRO ao buscar revisões da API:', error);

    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('[CACHE] Tipo de erro:', error.name);
      console.error('[CACHE] Mensagem:', error.message);
      console.error('[CACHE] Stack:', error.stack);
    }

    // IMPORTANTE: NÃO marcar como fetched em caso de erro
    // Permite tentar novamente na próxima vez
    console.warn('[CACHE] ⚠️ Não marcando como fetched devido ao erro - tentará novamente na próxima vez');

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
  console.log(`[CACHE] 🔍 getVehicleRevisions chamado para: ${brand} ${model} ${year} (ID: ${vehicleId})`);

  // 1. Tenta buscar do cache primeiro
  console.log(`[CACHE] 1️⃣ Verificando cache local...`);
  const cached = await getCachedRevisions(vehicleId);

  if (cached.length > 0) {
    console.log(`[CACHE] ✅ Usando ${cached.length} revisões do cache para veículo ${vehicleId}`);
    console.log(`[CACHE] 💰 API call economizado! 🎉`);
    return cached;
  }

  console.log(`[CACHE] Cache vazio, verificando se já foi consultado antes...`);

  // 2. Verifica se já tentamos buscar antes (mesmo que não tenha encontrado nada)
  const alreadyFetched = await hasRevisionsCached(vehicleId);

  if (alreadyFetched) {
    console.log(`[CACHE] ⚠️ Revisões já foram consultadas anteriormente, mas nenhuma foi encontrada`);
    console.log(`[CACHE] Este veículo provavelmente não tem plano de revisão disponível na API SUIV`);
    return [];
  }

  // 3. Só agora busca da API (PRIMEIRA E ÚNICA VEZ!)
  console.log(`[CACHE] 🚨 FAZENDO CHAMADA À API SUIV 🚨`);
  console.log(`[CACHE] Vehicle: ${brand} ${model} ${year}`);
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
