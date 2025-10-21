import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  QrCode
} from "lucide-react";

const mockData = {
  vehicle: {
    model: "Honda Civic EXL 2.0",
    year: 2020,
    plate: "ABC-1234",
    currentKm: 45230
  },
  maintenances: [
    { date: "Jan 2025", type: "Troca de óleo", cost: 280, km: 45000 },
    { date: "Dez 2024", type: "Revisão completa", cost: 850, km: 40000 },
    { date: "Set 2024", type: "Alinhamento", cost: 180, km: 35000 },
    { date: "Jun 2024", type: "Pastilhas de freio", cost: 420, km: 30000 }
  ]
};

const Report = () => {
  const totalCost = mockData.maintenances.reduce((sum, m) => sum + m.cost, 0);
  const averageCost = (totalCost / mockData.maintenances.length).toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-primary rounded-lg p-2 group-hover:shadow-glow-primary transition-all duration-300">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">AutoTrack</span>
          </Link>
          
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Info Banner */}
        <div className="mb-8 p-4 bg-success/10 border border-success/20 rounded-lg animate-fade-in">
          <p className="text-sm text-center">
            <strong className="text-success">📱 Este é um exemplo de histórico gerado pelo AutoTrack</strong>
            <br />
            <span className="text-muted-foreground text-xs">
              Este relatório pode ser compartilhado via link ou QR Code com potenciais compradores
            </span>
          </p>
        </div>

        {/* Main Report Card */}
        <Card className="shadow-2xl mb-8 animate-scale-in">
          <CardHeader className="border-b bg-gradient-to-r from-primary to-primary-hover text-primary-foreground">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">
                  Histórico de Manutenção
                </CardTitle>
                <p className="text-primary-foreground/80">
                  {mockData.vehicle.model} • {mockData.vehicle.year}
                </p>
                <p className="text-sm text-primary-foreground/70 mt-1">
                  Placa: {mockData.vehicle.plate} | KM atual: {mockData.vehicle.currentKm.toLocaleString()}
                </p>
              </div>
              <Badge className="bg-success text-success-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-surface rounded-lg p-4 text-center">
                <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{mockData.maintenances.length}</p>
                <p className="text-sm text-muted-foreground">Manutenções</p>
              </div>
              <div className="bg-surface rounded-lg p-4 text-center">
                <DollarSign className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">R$ {totalCost.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Investimento Total</p>
              </div>
              <div className="bg-surface rounded-lg p-4 text-center">
                <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">R$ {averageCost}</p>
                <p className="text-sm text-muted-foreground">Custo Médio</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-1 mb-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded" />
                Linha do Tempo
              </h3>
              
              <div className="space-y-4">
                {mockData.maintenances.map((maintenance, index) => (
                  <div 
                    key={index}
                    className="relative pl-8 pb-4 border-l-2 border-primary/30 last:border-transparent"
                  >
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                    <div className="bg-surface rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{maintenance.type}</p>
                          <p className="text-sm text-muted-foreground">{maintenance.date}</p>
                        </div>
                        <p className="font-bold text-success">R$ {maintenance.cost.toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Quilometragem: {maintenance.km.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Chart (Simplified) */}
            <div className="bg-gradient-to-br from-primary/5 to-success/5 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Evolução dos Custos</h3>
              <div className="h-40 flex items-end gap-2 justify-around">
                {mockData.maintenances.map((m, i) => {
                  const height = (m.cost / Math.max(...mockData.maintenances.map(x => x.cost))) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-gradient-to-t from-success to-success-hover rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`R$ ${m.cost}`}
                      />
                      <p className="text-xs text-muted-foreground text-center">{m.date}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card className="shadow-lg animate-fade-in">
          <CardContent className="p-8 text-center">
            <div className="inline-block bg-card border-4 border-primary/20 p-6 rounded-2xl mb-4">
              <QrCode className="h-32 w-32 text-primary mx-auto" />
            </div>
            <h3 className="font-semibold text-xl mb-2">Compartilhe este histórico</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Escaneie o QR Code acima ou use o link abaixo para acessar este relatório
            </p>
            <div className="bg-surface rounded-lg p-3 font-mono text-xs text-muted-foreground break-all">
              https://autotrack.app/report/abc1234-sample
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Relatório gerado em {new Date().toLocaleDateString('pt-BR')} • Powered by{" "}
            <span className="font-semibold text-primary">AutoTrack</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Report;
