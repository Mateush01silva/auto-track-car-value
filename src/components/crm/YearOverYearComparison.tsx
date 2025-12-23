import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface YearData {
  year: number;
  totalSpent: number;
  maintenanceCount: number;
}

interface YearOverYearComparisonProps {
  maintenances: Array<{
    date: string;
    cost: number;
  }>;
}

export const YearOverYearComparison = ({ maintenances }: YearOverYearComparisonProps) => {
  const yearlyData = useMemo(() => {
    // Agrupar gastos por ano
    const grouped = maintenances.reduce((acc, maintenance) => {
      const year = new Date(maintenance.date).getFullYear();

      if (!acc[year]) {
        acc[year] = {
          year,
          totalSpent: 0,
          maintenanceCount: 0,
        };
      }

      acc[year].totalSpent += maintenance.cost;
      acc[year].maintenanceCount += 1;

      return acc;
    }, {} as Record<number, YearData>);

    // Converter para array e ordenar por ano (mais recente primeiro)
    return Object.values(grouped)
      .sort((a, b) => b.year - a.year)
      .filter(data => data.totalSpent > 0); // Apenas anos com gastos
  }, [maintenances]);

  // Não mostrar se tiver dados de apenas 1 ano ou menos
  if (yearlyData.length < 2) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          Comparativo Ano vs Ano
        </h4>

        <div className="space-y-3">
          {yearlyData.map((yearData, index) => {
            const previousYearData = yearlyData[index + 1];
            const variation = previousYearData
              ? calculateVariation(yearData.totalSpent, previousYearData.totalSpent)
              : null;

            const isIncrease = variation !== null && variation > 0;
            const isDecrease = variation !== null && variation < 0;
            const isStable = variation !== null && Math.abs(variation) < 5; // Variação < 5% = estável

            return (
              <div
                key={yearData.year}
                className="bg-white rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-800">
                        {yearData.year}
                      </span>
                      {variation !== null && (
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isStable
                              ? 'bg-gray-100 text-gray-700'
                              : isIncrease
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isStable ? (
                            <Minus className="h-3 w-3" />
                          ) : isIncrease ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(variation).toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {yearData.maintenanceCount} atendimento{yearData.maintenanceCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg text-blue-600">
                      {formatCurrency(yearData.totalSpent)}
                    </p>
                    {previousYearData && (
                      <p className="text-xs text-gray-500">
                        vs {formatCurrency(previousYearData.totalSpent)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Insights automáticos */}
                {variation !== null && !isStable && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      {isIncrease ? (
                        <>
                          📈 Cliente gastou <strong>{Math.abs(variation).toFixed(1)}% mais</strong> que no ano anterior.
                          {variation > 50 && " Excelente fidelização!"}
                        </>
                      ) : (
                        <>
                          📉 Cliente gastou <strong>{Math.abs(variation).toFixed(1)}% menos</strong> que no ano anterior.
                          {variation < -30 && " ⚠️ Atenção: pode estar indo para concorrência."}
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumo total */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total histórico</span>
            <span className="font-bold text-gray-800">
              {formatCurrency(yearlyData.reduce((sum, year) => sum + year.totalSpent, 0))}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Dados de {yearlyData.length} ano{yearlyData.length !== 1 ? 's' : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
