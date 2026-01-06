/**
 * Admin Dashboard
 *
 * Painel administrativo com métricas, KPIs, e analytics para gestão do negócio
 * Apenas usuários com flag is_admin = true podem acessar
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  Users,
  Wrench,
  Car,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  useAdminOverview,
  useAdminGrowth,
  useApiUsageDaily,
  useApiUsageMonthly,
  useBillableApiCalls,
  useTopApiUsers,
  useSubscriptionDistribution,
  useTrialConversion,
  useWorkshopPerformance,
  formatCurrency,
  formatDate,
  calculatePercentage,
} from '../hooks/useAdminMetrics';
import { supabase } from '../integrations/supabase/client';

// =====================================================
// Componente Principal
// =====================================================

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Verifica se usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        navigate('/');
      }
    };

    checkAdmin();
  }, [navigate]);

  // Busca dados
  const { data: overview, isLoading: overviewLoading } = useAdminOverview();
  const { data: growth } = useAdminGrowth();
  const { data: apiUsageDaily } = useApiUsageDaily();
  const { data: apiUsageMonthly } = useApiUsageMonthly();
  const { data: billableApiCalls } = useBillableApiCalls();
  const { data: topApiUsers } = useTopApiUsers();
  const { data: subscriptionDist } = useSubscriptionDistribution();
  const { data: trialConversion } = useTrialConversion();
  const { data: workshopPerformance } = useWorkshopPerformance();

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral do negócio e métricas em tempo real
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          title="MRR"
          value={formatCurrency(overview?.mrr_cents || 0)}
          description="Receita Recorrente Mensal"
          icon={<DollarSign className="w-6 h-6" />}
          trend="+12%"
        />
        <KpiCard
          title="Custo API (Mês)"
          value={formatCurrency(overview?.api_cost_current_month_cents || 0)}
          description={`${overview?.billable_api_calls_last_30d || 0} veículos consultados (30d)`}
          icon={<Activity className="w-6 h-6" />}
        />
        <KpiCard
          title="ARR"
          value={formatCurrency(overview?.arr_cents || 0)}
          description="Receita Recorrente Anual"
          icon={<TrendingUp className="w-6 h-6" />}
          trend="+15%"
        />
        <KpiCard
          title="Usuários Ativos"
          value={overview?.total_users.toLocaleString() || '0'}
          description={`+${overview?.new_users_last_30d || 0} nos últimos 30 dias`}
          icon={<Users className="w-6 h-6" />}
        />
        <KpiCard
          title="Oficinas Ativas"
          value={overview?.active_workshops.toLocaleString() || '0'}
          description={`${overview?.total_workshops || 0} total cadastradas`}
          icon={<Wrench className="w-6 h-6" />}
        />
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="api">Uso de API</TabsTrigger>
          <TabsTrigger value="workshops">Oficinas</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribuição de Planos */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Assinaturas</CardTitle>
                <CardDescription>Por plano e status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionDist?.filter(s => s.status === 'active') || []}
                      dataKey="count"
                      nameKey="plan_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {subscriptionDist?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversão de Trials */}
            <Card>
              <CardHeader>
                <CardTitle>Conversão de Trials</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trialConversion?.slice(0, 6) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="signup_month"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getFullYear()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="converted_to_active" fill="#10b981" name="Convertidos" />
                    <Bar dataKey="canceled" fill="#ef4444" name="Cancelados" />
                    <Bar dataKey="still_trialing" fill="#f59e0b" name="Em Trial" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Veículos Cadastrados"
              value={overview?.total_vehicles.toLocaleString() || '0'}
              icon={<Car className="w-5 h-5" />}
            />
            <StatCard
              title="Manutenções Totais"
              value={overview?.total_maintenances.toLocaleString() || '0'}
              description={`${overview?.maintenances_last_30d || 0} nos últimos 30 dias`}
              icon={<Wrench className="w-5 h-5" />}
            />
            <StatCard
              title="Trials Ativos"
              value={overview?.active_trials.toLocaleString() || '0'}
              description={`${overview?.cancellations_last_30d || 0} cancelamentos (30d)`}
              icon={<Activity className="w-5 h-5" />}
            />
          </div>
        </TabsContent>

        {/* Tab: Crescimento */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Usuários</CardTitle>
              <CardDescription>Novos usuários por semana (últimas 12 semanas)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={growth?.slice(0, 12).reverse() || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week_start"
                    tickFormatter={(value) => formatDate(value)}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => `Semana de ${formatDate(value)}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="new_users"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="Novos Usuários"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Uso de API */}
        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Uso diário */}
            <Card>
              <CardHeader>
                <CardTitle>Veículos Consultados - Últimos 7 dias</CardTitle>
                <CardDescription>R$ 1,10 por veículo (inclui placa + revisões)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={apiUsageDaily
                      ?.slice(0, 7)
                      .reverse()
                      .map((d) => ({
                        date: d.date,
                        total: d.total_calls,
                        success: d.successful_calls,
                        failed: d.failed_calls,
                      })) || []}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="success" stroke="#10b981" name="Sucesso" />
                    <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Falhas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Custo mensal */}
            <Card>
              <CardHeader>
                <CardTitle>Custo de API - Últimos 6 meses</CardTitle>
                <CardDescription>R$ 1,10 por veículo único (placa + revisões = 1 custo)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={apiUsageMonthly?.slice(0, 6).reverse() || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getFullYear()}`;
                      }}
                    />
                    <YAxis
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="estimated_cost_cents" fill="#f59e0b" name="Custo Estimado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top usuários de API */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Usuários - Uso de API</CardTitle>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Usuário</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-right p-2">Total</th>
                      <th className="text-right p-2">Sucesso</th>
                      <th className="text-right p-2">Falhas</th>
                      <th className="text-right p-2">Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topApiUsers?.map((user, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="font-medium">{user.user_name}</div>
                          {user.workshop_name && (
                            <div className="text-xs text-muted-foreground">
                              {user.workshop_name}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-sm">{user.email}</td>
                        <td className="p-2 text-right font-mono">
                          {user.total_api_calls.toLocaleString()}
                        </td>
                        <td className="p-2 text-right text-green-600 font-mono">
                          {user.successful_calls.toLocaleString()}
                        </td>
                        <td className="p-2 text-right text-red-600 font-mono">
                          {user.failed_calls.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          <span className="text-xs">
                            {calculatePercentage(user.successful_calls, user.total_api_calls)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Oficinas */}
        <TabsContent value="workshops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance das Oficinas</CardTitle>
              <CardDescription>Top 20 oficinas por volume de atendimentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Oficina</th>
                      <th className="text-center p-2">Plano</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-right p-2">Atendimentos</th>
                      <th className="text-right p-2">Veículos</th>
                      <th className="text-right p-2">Média/Mês</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workshopPerformance?.map((workshop) => (
                      <tr key={workshop.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="font-medium">{workshop.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Desde {formatDate(workshop.joined_at)}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <PlanBadge plan={workshop.plan} />
                        </td>
                        <td className="p-2 text-center">
                          <StatusBadge status={workshop.subscription_status} />
                        </td>
                        <td className="p-2 text-right font-mono">
                          {workshop.total_maintenances}
                        </td>
                        <td className="p-2 text-right font-mono">
                          {workshop.unique_vehicles}
                        </td>
                        <td className="p-2 text-right font-mono">
                          {workshop.avg_maintenances_per_month.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// Componentes Auxiliares
// =====================================================

interface KpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
}

function KpiCard({ title, value, description, icon, trend }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const badges: Record<string, { label: string; color: string }> = {
    starter: { label: 'Starter', color: 'bg-blue-100 text-blue-800' },
    professional: { label: 'Pro', color: 'bg-purple-100 text-purple-800' },
    enterprise: { label: 'Enterprise', color: 'bg-indigo-100 text-indigo-800' },
  };

  const badge = badges[plan] || { label: plan, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const badges: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    active: {
      label: 'Ativo',
      icon: <CheckCircle className="w-3 h-3" />,
      color: 'bg-green-100 text-green-800',
    },
    trial: {
      label: 'Trial',
      icon: <AlertCircle className="w-3 h-3" />,
      color: 'bg-yellow-100 text-yellow-800',
    },
    cancelled: {
      label: 'Cancelado',
      icon: <XCircle className="w-3 h-3" />,
      color: 'bg-red-100 text-red-800',
    },
  };

  const badge = badges[status] || {
    label: status,
    icon: null,
    color: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
      {badge.icon}
      {badge.label}
    </span>
  );
}

// Cores para gráficos
const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
