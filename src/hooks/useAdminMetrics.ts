/**
 * Hook para buscar métricas administrativas do dashboard
 *
 * Usa as views SQL criadas no Supabase para otimizar as queries
 * e fornecer dados para o dashboard de admin
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

// =====================================================
// Tipos
// =====================================================

export interface AdminOverview {
  total_users: number;
  new_users_last_30d: number;
  active_workshops: number;
  total_workshops: number;
  total_vehicles: number;
  total_maintenances: number;
  maintenances_last_30d: number;
  free_plans: number;
  starter_plans: number;
  professional_plans: number;
  owner_pro_plans: number;
  mrr_cents: number;
  arr_cents: number;
  active_trials: number;
  cancellations_last_30d: number;
  billable_api_calls_last_30d: number;
  api_cost_current_month_cents: number;
}

export interface GrowthByWeek {
  week_start: string;
  new_users: number;
  users_this_week: number;
}

export interface ApiUsageDaily {
  date: string;
  api_name: string;
  endpoint: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_response_time_ms: number;
  max_response_time_ms: number;
  min_response_time_ms: number;
}

export interface ApiUsageMonthly {
  month: string;
  api_name: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_response_time_ms: number;
  estimated_cost_cents: number;
}

export interface BillableApiCall {
  date: string;
  endpoint: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_response_time_ms: number;
  cost_cents: number;
}

export interface TopApiUser {
  user_name: string;
  email: string;
  workshop_name: string | null;
  total_api_calls: number;
  successful_calls: number;
  failed_calls: number;
  last_api_call: string;
}

export interface SubscriptionDistribution {
  plan_id: string;
  status: string;
  count: number;
  monthly_revenue_cents: number;
  avg_monthly_usage: number;
  max_monthly_usage: number;
}

export interface TrialConversion {
  signup_month: string;
  plan_id: string;
  total_trials: number;
  converted_to_active: number;
  canceled: number;
  still_trialing: number;
  conversion_rate_percent: number;
}

export interface WorkshopPerformance {
  id: string;
  name: string;
  plan: string;
  subscription_status: string;
  joined_at: string;
  total_maintenances: number;
  unique_vehicles: number;
  last_maintenance_date: string | null;
  avg_maintenances_per_month: number;
}

// =====================================================
// Hooks
// =====================================================

/**
 * Busca visão geral (Overview) com KPIs principais
 */
export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_overview')
        .select('*')
        .single();

      if (error) throw error;
      return data as AdminOverview;
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
}

/**
 * Busca crescimento de usuários por semana
 */
export function useAdminGrowth() {
  return useQuery({
    queryKey: ['admin', 'growth'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_growth_by_week')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(12); // Últimas 12 semanas

      if (error) throw error;
      return data as GrowthByWeek[];
    },
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });
}

/**
 * Busca uso de API por dia (últimos 30 dias)
 */
export function useApiUsageDaily() {
  return useQuery({
    queryKey: ['admin', 'api-usage', 'daily'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_api_usage_daily')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as ApiUsageDaily[];
    },
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });
}

/**
 * Busca uso de API por mês (últimos 12 meses)
 */
export function useApiUsageMonthly() {
  return useQuery({
    queryKey: ['admin', 'api-usage', 'monthly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_api_usage_monthly')
        .select('*')
        .order('month', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as ApiUsageMonthly[];
    },
    refetchInterval: 600000, // Atualiza a cada 10 minutos
  });
}

/**
 * Busca chamadas billable (que geram custo real)
 */
export function useBillableApiCalls() {
  return useQuery({
    queryKey: ['admin', 'api-usage', 'billable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_billable_api_calls')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as BillableApiCall[];
    },
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });
}

/**
 * Busca top usuários por uso de API
 */
export function useTopApiUsers() {
  return useQuery({
    queryKey: ['admin', 'api-usage', 'top-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_top_api_users')
        .select('*')
        .limit(10);

      if (error) throw error;
      return data as TopApiUser[];
    },
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });
}

/**
 * Busca distribuição de assinaturas
 */
export function useSubscriptionDistribution() {
  return useQuery({
    queryKey: ['admin', 'subscriptions', 'distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_subscription_distribution')
        .select('*')
        .order('monthly_revenue_cents', { ascending: false });

      if (error) throw error;
      return data as SubscriptionDistribution[];
    },
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });
}

/**
 * Busca conversão de trials
 */
export function useTrialConversion() {
  return useQuery({
    queryKey: ['admin', 'trials', 'conversion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_trial_conversion')
        .select('*')
        .order('signup_month', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as TrialConversion[];
    },
    refetchInterval: 600000, // Atualiza a cada 10 minutos
  });
}

/**
 * Busca performance das oficinas
 */
export function useWorkshopPerformance() {
  return useQuery({
    queryKey: ['admin', 'workshops', 'performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_workshop_performance')
        .select('*')
        .order('total_maintenances', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as WorkshopPerformance[];
    },
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Formata centavos para BRL
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/**
 * Formata data para exibição
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data e hora para exibição
 */
export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcula percentual
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
