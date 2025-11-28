import { Vehicle } from "@/hooks/useVehicles";
import { Maintenance } from "@/hooks/useMaintenances";
import { MAINTENANCE_RECOMMENDATIONS, MaintenanceRecommendation } from "@/constants/maintenanceRecommendations";
import { differenceInMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type TipoSelo = "ouro" | "prata" | "bronze" | "nenhum";

export interface VeiculoSelo {
  id?: string;
  veiculo_id: string;
  tipo_selo: TipoSelo;
  percentual_criticas: number;
  percentual_altas: number;
  percentual_todas: number;
  total_atrasadas_criticas: number;
  total_atrasadas_altas: number;
  total_atrasadas_todas: number;
  total_sugestoes_criticas: number;
  total_sugestoes_altas: number;
  total_sugestoes_todas: number;
  data_calculo: string;
}

export interface SugestaoManutencao {
  recommendation: MaintenanceRecommendation;
  status: "em-dia" | "atrasada";
  kmAtrasado?: number;
  mesesAtrasado?: number;
}

/**
 * Determina o tipo de selo baseado nos percentuais de manutenções em dia
 */
export function determinarSelo(
  percentualCriticas: number,
  percentualAltas: number,
  percentualTodas: number
): TipoSelo {
  // Regras do selo OURO
  if (
    percentualCriticas >= 95 &&
    percentualAltas >= 90 &&
    percentualTodas >= 85
  ) {
    return "ouro";
  }

  // Regras do selo PRATA
  if (
    percentualCriticas >= 90 &&
    percentualAltas >= 80 &&
    percentualTodas >= 70
  ) {
    return "prata";
  }

  // Regras do selo BRONZE
  if (
    percentualCriticas >= 80 &&
    percentualAltas >= 65 &&
    percentualTodas >= 50
  ) {
    return "bronze";
  }

  // Sem selo
  return "nenhum";
}

/**
 * Gera todas as sugestões de manutenção para um veículo
 * baseadas na quilometragem e tempo
 */
export function gerarSugestoesManutencao(
  vehicle: Vehicle,
  maintenances: Maintenance[]
): SugestaoManutencao[] {
  const sugestoes: SugestaoManutencao[] = [];
  const currentKm = vehicle.current_km;
  const initialKm = vehicle.initial_km || vehicle.current_km;
  const now = new Date();

  MAINTENANCE_RECOMMENDATIONS.forEach((recommendation) => {
    // Encontrar a última manutenção deste tipo
    const relevantMaintenances = maintenances.filter(
      (m) =>
        m.vehicle_id === vehicle.id &&
        m.service_type.toLowerCase().includes(recommendation.item.toLowerCase())
    );

    const lastMaintenance = relevantMaintenances.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    const lastMaintenanceKm = lastMaintenance?.km || initialKm;
    const lastMaintenanceDate = lastMaintenance ? new Date(lastMaintenance.date) : null;

    let isAtrasada = false;
    let kmAtrasado: number | undefined;
    let mesesAtrasado: number | undefined;

    // Verificar atraso por KM
    if (recommendation.kmInterval) {
      const kmSinceLastMaintenance = currentKm - lastMaintenanceKm;
      const kmRemaining = recommendation.kmInterval - kmSinceLastMaintenance;

      if (kmRemaining <= 0) {
        isAtrasada = true;
        kmAtrasado = Math.abs(kmRemaining);
      }
    }

    // Verificar atraso por tempo (se houver última manutenção)
    if (recommendation.timeInterval && lastMaintenanceDate) {
      const monthsSinceLastMaintenance = differenceInMonths(now, lastMaintenanceDate);
      const monthsRemaining = recommendation.timeInterval - monthsSinceLastMaintenance;

      if (monthsRemaining <= 0) {
        isAtrasada = true;
        mesesAtrasado = Math.abs(monthsRemaining);
      }
    }

    // Se nunca foi feita e já passou do intervalo, está atrasada
    if (!lastMaintenance && recommendation.kmInterval && currentKm >= recommendation.kmInterval) {
      isAtrasada = true;
      kmAtrasado = currentKm - recommendation.kmInterval;
    }

    sugestoes.push({
      recommendation,
      status: isAtrasada ? "atrasada" : "em-dia",
      kmAtrasado,
      mesesAtrasado,
    });
  });

  return sugestoes;
}

/**
 * Calcula o selo de qualidade para um veículo
 */
export function calcularSeloVeiculo(
  vehicle: Vehicle,
  maintenances: Maintenance[]
): Omit<VeiculoSelo, "id" | "data_calculo"> {
  const sugestoes = gerarSugestoesManutencao(vehicle, maintenances);

  // Separar por criticidade
  const sugestoesCriticas = sugestoes.filter((s) => s.recommendation.criticidade === "Crítica");
  const sugestoesAltas = sugestoes.filter((s) => s.recommendation.criticidade === "Alta");

  // Contar atrasadas
  const atrasadasCriticas = sugestoesCriticas.filter((s) => s.status === "atrasada").length;
  const atrasadasAltas = sugestoesAltas.filter((s) => s.status === "atrasada").length;
  const atrasadasTodas = sugestoes.filter((s) => s.status === "atrasada").length;

  // Calcular percentuais (manutenções EM DIA)
  const totalCriticas = sugestoesCriticas.length;
  const totalAltas = sugestoesAltas.length;
  const totalTodas = sugestoes.length;

  const percentualCriticas = totalCriticas > 0
    ? ((totalCriticas - atrasadasCriticas) / totalCriticas) * 100
    : 100;

  const percentualAltas = totalAltas > 0
    ? ((totalAltas - atrasadasAltas) / totalAltas) * 100
    : 100;

  const percentualTodas = totalTodas > 0
    ? ((totalTodas - atrasadasTodas) / totalTodas) * 100
    : 100;

  const tipoSelo = determinarSelo(percentualCriticas, percentualAltas, percentualTodas);

  return {
    veiculo_id: vehicle.id,
    tipo_selo: tipoSelo,
    percentual_criticas: Math.round(percentualCriticas * 100) / 100,
    percentual_altas: Math.round(percentualAltas * 100) / 100,
    percentual_todas: Math.round(percentualTodas * 100) / 100,
    total_atrasadas_criticas: atrasadasCriticas,
    total_atrasadas_altas: atrasadasAltas,
    total_atrasadas_todas: atrasadasTodas,
    total_sugestoes_criticas: totalCriticas,
    total_sugestoes_altas: totalAltas,
    total_sugestoes_todas: totalTodas,
  };
}

/**
 * Salva ou atualiza o selo do veículo no banco de dados
 */
export async function salvarSeloVeiculo(seloData: Omit<VeiculoSelo, "id" | "data_calculo">): Promise<VeiculoSelo | null> {
  try {
    // Verificar se já existe um selo para este veículo
    const { data: seloExistente } = await supabase
      .from("veiculos_selos")
      .select("*")
      .eq("veiculo_id", seloData.veiculo_id)
      .single();

    if (seloExistente) {
      // Atualizar selo existente
      const { data, error } = await supabase
        .from("veiculos_selos")
        .update({
          ...seloData,
          data_calculo: new Date().toISOString(),
        })
        .eq("veiculo_id", seloData.veiculo_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Criar novo selo
      const { data, error } = await supabase
        .from("veiculos_selos")
        .insert({
          ...seloData,
          data_calculo: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Erro ao salvar selo do veículo:", error);
    return null;
  }
}

/**
 * Busca o selo de um veículo
 */
export async function buscarSeloVeiculo(veiculoId: string): Promise<VeiculoSelo | null> {
  try {
    const { data, error } = await supabase
      .from("veiculos_selos")
      .select("*")
      .eq("veiculo_id", veiculoId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao buscar selo do veículo:", error);
    return null;
  }
}

/**
 * Calcula e salva o selo de um veículo
 */
export async function calcularESalvarSelo(
  vehicle: Vehicle,
  maintenances: Maintenance[]
): Promise<VeiculoSelo | null> {
  const seloData = calcularSeloVeiculo(vehicle, maintenances);
  return await salvarSeloVeiculo(seloData);
}
