import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Wrench,
  User,
  ChevronDown,
  LogOut,
  Loader2,
} from "lucide-react";
import { WorkshopBottomNav } from "@/components/workshop/BottomNav";

interface ServicePrice {
  id: string;
  service_category: string;
  service_item: string;
  service_description: string | null;
  min_price: number; // em centavos
  max_price: number; // em centavos
  labor_percentage: number;
}

// Categorias comuns de serviços
const SERVICE_CATEGORIES = [
  "Motor",
  "Freios",
  "Suspensão",
  "Transmissão",
  "Sistema Elétrico",
  "Ar Condicionado",
  "Filtros",
  "Fluidos",
  "Pneus",
  "Bateria",
  "Alinhamento e Balanceamento",
  "Outros",
];

const WorkshopPricing = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [workshopId, setWorkshopId] = useState<string | null>(null);
  const [prices, setPrices] = useState<ServicePrice[]>([]);

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ServicePrice | null>(null);

  // Form states
  const [category, setCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [laborPercentage, setLaborPercentage] = useState("25");

  // Filter
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get workshop
      const { data: workshopData, error: workshopError } = await supabase
        .from('workshops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (workshopError || !workshopData) {
        console.error('Error fetching workshop:', workshopError);
        return;
      }

      setWorkshopId(workshopData.id);

      // Get service prices
      const { data: pricesData, error: pricesError } = await supabase
        .from('workshop_service_prices')
        .select('*')
        .eq('workshop_id', workshopData.id)
        .order('service_category', { ascending: true })
        .order('service_item', { ascending: true });

      if (pricesError) {
        console.error('Error fetching prices:', pricesError);
        toast({
          title: "Erro ao carregar preços",
          description: "Ocorreu um erro ao carregar seus preços cadastrados.",
          variant: "destructive",
        });
        return;
      }

      setPrices(pricesData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (price?: ServicePrice) => {
    if (price) {
      setEditingPrice(price);
      setCategory(price.service_category);
      setItemName(price.service_item);
      setDescription(price.service_description || "");
      setMinPrice((price.min_price / 100).toFixed(2));
      setMaxPrice((price.max_price / 100).toFixed(2));
      setLaborPercentage(price.labor_percentage.toString());
    } else {
      setEditingPrice(null);
      setCategory("");
      setItemName("");
      setDescription("");
      setMinPrice("");
      setMaxPrice("");
      setLaborPercentage("25");
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!workshopId || !category || !itemName || !minPrice || !maxPrice) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha categoria, nome do serviço e preços.",
        variant: "destructive",
      });
      return;
    }

    const minPriceCents = Math.round(parseFloat(minPrice) * 100);
    const maxPriceCents = Math.round(parseFloat(maxPrice) * 100);

    if (maxPriceCents < minPriceCents) {
      toast({
        title: "Preço inválido",
        description: "O preço máximo deve ser maior ou igual ao mínimo.",
        variant: "destructive",
      });
      return;
    }

    const priceData = {
      workshop_id: workshopId,
      service_category: category,
      service_item: itemName,
      service_description: description || null,
      min_price: minPriceCents,
      max_price: maxPriceCents,
      labor_percentage: parseInt(laborPercentage) || 25,
    };

    try {
      if (editingPrice) {
        // Update
        const { error } = await supabase
          .from('workshop_service_prices')
          .update(priceData)
          .eq('id', editingPrice.id);

        if (error) throw error;

        toast({
          title: "Preço atualizado",
          description: "O preço do serviço foi atualizado com sucesso.",
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('workshop_service_prices')
          .insert([priceData]);

        if (error) {
          // Check for unique constraint violation
          if (error.code === '23505') {
            toast({
              title: "Serviço já cadastrado",
              description: "Este serviço já possui um preço cadastrado. Edite o existente.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Preço cadastrado",
          description: "O preço do serviço foi cadastrado com sucesso.",
        });
      }

      setShowDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving price:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o preço.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (priceId: string) => {
    if (!confirm("Tem certeza que deseja excluir este preço?")) return;

    try {
      const { error } = await supabase
        .from('workshop_service_prices')
        .delete()
        .eq('id', priceId);

      if (error) throw error;

      toast({
        title: "Preço excluído",
        description: "O preço foi removido com sucesso.",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting price:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o preço.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  // Filter prices by category
  const filteredPrices = filterCategory === "all"
    ? prices
    : prices.filter(p => p.service_category === filterCategory);

  // Group prices by category for display
  const pricesByCategory = filteredPrices.reduce((acc, price) => {
    if (!acc[price.service_category]) {
      acc[price.service_category] = [];
    }
    acc[price.service_category].push(price);
    return acc;
  }, {} as Record<string, ServicePrice[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 rounded-lg p-2">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-green-600">Vybo</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Menu</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/workshop/settings")}>
                  <User className="h-4 w-4 mr-2" />
                  Perfil da Oficina
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Tabela de Preços de Serviços
          </h1>
          <p className="text-gray-500 mt-1">
            Cadastre os preços dos serviços da sua oficina para cálculo automático de oportunidades
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {SERVICE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Preço
          </Button>
        </div>

        {/* Prices List */}
        {filteredPrices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-semibold mb-2">Nenhum preço cadastrado</p>
              <p className="text-sm text-gray-400 mb-4">
                Comece cadastrando os preços dos serviços que sua oficina realiza
              </p>
              <Button onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Preço
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(pricesByCategory).map(([category, categoryPrices]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <CardDescription>{categoryPrices.length} serviço(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Preço Mínimo</TableHead>
                          <TableHead>Preço Máximo</TableHead>
                          <TableHead>Mão de Obra</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryPrices.map((price) => (
                          <TableRow key={price.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{price.service_item}</p>
                                {price.service_description && (
                                  <p className="text-sm text-gray-500">{price.service_description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(price.min_price)}</TableCell>
                            <TableCell>{formatCurrency(price.max_price)}</TableCell>
                            <TableCell>{price.labor_percentage}%</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDialog(price)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(price.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Spacer for bottom nav on mobile */}
        <div className="h-20 md:hidden" />
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPrice ? "Editar Preço" : "Adicionar Novo Preço"}</DialogTitle>
            <DialogDescription>
              {editingPrice ? "Atualize" : "Cadastre"} o preço de um serviço da sua oficina
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">Nome do Serviço *</Label>
              <Input
                id="itemName"
                placeholder="Ex: Troca de óleo do motor"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Detalhes adicionais do serviço"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Preço Mínimo *</Label>
                <Input
                  id="minPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice">Preço Máximo *</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="laborPercentage">Percentual de Mão de Obra (%)</Label>
              <Input
                id="laborPercentage"
                type="number"
                min="0"
                max="100"
                placeholder="25"
                value={laborPercentage}
                onChange={(e) => setLaborPercentage(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Percentual sobre o valor das peças (padrão: 25%)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              {editingPrice ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation - Mobile */}
      <WorkshopBottomNav />
    </div>
  );
};

export default WorkshopPricing;
