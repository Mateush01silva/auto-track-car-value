import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Calendar, Clock, TrendingUp } from "lucide-react";

interface MaintenanceData {
  date: string;
  cost: number;
}

interface MaintenanceHeatmapProps {
  maintenances: MaintenanceData[];
}

type Period = "week" | "month" | "hour";

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const MaintenanceHeatmap = ({ maintenances }: MaintenanceHeatmapProps) => {
  const [viewType, setViewType] = useState<Period>("week");

  // Análise por dia da semana
  const weekData = useMemo(() => {
    const grouped = maintenances.reduce((acc, m) => {
      const dayOfWeek = new Date(m.date).getDay();
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = { count: 0, revenue: 0 };
      }
      acc[dayOfWeek].count += 1;
      acc[dayOfWeek].revenue += m.cost;
      return acc;
    }, {} as Record<number, { count: number; revenue: number }>);

    return DAYS_OF_WEEK.map((day, index) => ({
      day,
      count: grouped[index]?.count || 0,
      revenue: grouped[index]?.revenue || 0,
      avgTicket: grouped[index]
        ? grouped[index].revenue / grouped[index].count
        : 0,
    }));
  }, [maintenances]);

  // Análise por mês (sazonalidade)
  const monthData = useMemo(() => {
    const grouped = maintenances.reduce((acc, m) => {
      const month = new Date(m.date).getMonth();
      if (!acc[month]) {
        acc[month] = { count: 0, revenue: 0 };
      }
      acc[month].count += 1;
      acc[month].revenue += m.cost;
      return acc;
    }, {} as Record<number, { count: number; revenue: number }>);

    return MONTHS.map((month, index) => ({
      month,
      count: grouped[index]?.count || 0,
      revenue: grouped[index]?.revenue || 0,
      avgTicket: grouped[index]
        ? grouped[index].revenue / grouped[index].count
        : 0,
    }));
  }, [maintenances]);

  // Análise por horário (se disponível)
  const hourData = useMemo(() => {
    const grouped = maintenances.reduce((acc, m) => {
      const hour = new Date(m.date).getHours();
      if (!acc[hour]) {
        acc[hour] = { count: 0, revenue: 0 };
      }
      acc[hour].count += 1;
      acc[hour].revenue += m.cost;
      return acc;
    }, {} as Record<number, { count: number; revenue: number }>);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}h`,
      count: grouped[hour]?.count || 0,
      revenue: grouped[hour]?.revenue || 0,
    }));
  }, [maintenances]);

  // Insights automáticos
  const insights = useMemo(() => {
    const insights: string[] = [];

    if (viewType === "week") {
      const maxDay = weekData.reduce((max, day) =>
        day.count > max.count ? day : max
      );
      const minDay = weekData.reduce((min, day) =>
        day.count > 0 && day.count < min.count ? day : min
      );

      if (maxDay.count > 0) {
        insights.push(
          `📊 ${maxDay.day} é o dia com mais atendimentos (${maxDay.count})`
        );
      }

      if (minDay.count > 0 && minDay.day !== maxDay.day) {
        const diff = ((maxDay.count - minDay.count) / maxDay.count) * 100;
        insights.push(
          `📉 ${minDay.day} é ${diff.toFixed(0)}% mais vazio - ideal para promoções`
        );
      }
    }

    if (viewType === "month") {
      const maxMonth = monthData.reduce((max, month) =>
        month.count > max.count ? month : max
      );
      const minMonth = monthData.reduce((min, month) =>
        month.count > 0 && month.count < min.count ? month : min
      );

      if (maxMonth.count > 0) {
        insights.push(
          `📈 ${maxMonth.month} é o mês com mais movimento (${maxMonth.count} atendimentos)`
        );
      }

      if (minMonth.count > 0 && minMonth.month !== maxMonth.month) {
        insights.push(
          `📉 ${minMonth.month} é mais fraco - considere campanhas de reativação`
        );
      }
    }

    if (viewType === "hour") {
      const businessHours = hourData.filter(
        (h) => parseInt(h.hour) >= 8 && parseInt(h.hour) <= 18
      );
      const maxHour = businessHours.reduce((max, hour) =>
        hour.count > max.count ? hour : max
      );

      if (maxHour.count > 0) {
        insights.push(
          `⏰ Horário de pico: ${maxHour.hour} (${maxHour.count} atendimentos)`
        );
      }

      const emptyHours = businessHours.filter((h) => h.count === 0);
      if (emptyHours.length > 0) {
        insights.push(
          `💡 ${emptyHours.length} horários vazios - oportunidade para agendamentos`
        );
      }
    }

    return insights;
  }, [weekData, monthData, hourData, viewType]);

  const getColor = (value: number, max: number) => {
    const intensity = value / max;
    if (intensity === 0) return "#e5e7eb"; // gray-200
    if (intensity < 0.25) return "#bfdbfe"; // blue-200
    if (intensity < 0.5) return "#93c5fd"; // blue-300
    if (intensity < 0.75) return "#60a5fa"; // blue-400
    return "#3b82f6"; // blue-500
  };

  const currentData =
    viewType === "week" ? weekData : viewType === "month" ? monthData : hourData;
  const maxCount = Math.max(...currentData.map((d) => d.count));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (maintenances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Mapa de Calor de Atendimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            Não há dados suficientes para gerar análises.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Mapa de Calor de Atendimentos
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewType === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("week")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Semana
            </Button>
            <Button
              variant={viewType === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("month")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Mês
            </Button>
            <Button
              variant={viewType === "hour" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("hour")}
            >
              <Clock className="h-4 w-4 mr-1" />
              Horário
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={
                  viewType === "week"
                    ? "day"
                    : viewType === "month"
                    ? "month"
                    : "hour"
                }
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-sm mb-2">
                        {data.day || data.month || data.hour}
                      </p>
                      <p className="text-sm">
                        Atendimentos: <strong>{data.count}</strong>
                      </p>
                      {data.revenue > 0 && (
                        <>
                          <p className="text-sm">
                            Receita: <strong>{formatCurrency(data.revenue)}</strong>
                          </p>
                          {data.avgTicket > 0 && (
                            <p className="text-sm text-gray-600">
                              Ticket médio: {formatCurrency(data.avgTicket)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {currentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColor(entry.count, maxCount)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights automáticos */}
        {insights.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900 flex items-center gap-2">
              💡 Insights Automáticos
            </h4>
            <ul className="space-y-1">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-blue-800">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#e5e7eb" }} />
            <span>Vazio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#bfdbfe" }} />
            <span>Baixo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#60a5fa" }} />
            <span>Médio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <span>Alto</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
