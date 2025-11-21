import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Loader2,
  FileText,
  Crown,
  Info,
  X,
  Lock,
} from "lucide-react";

interface Workshop {
  id: string;
  name: string;
  plan: string;
}

interface TemplateItem {
  name: string;
  price: number;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
  total_price: number;
  is_active: boolean;
  created_at: string;
}

// Default templates available to all plans
const DEFAULT_TEMPLATES: Omit<Template, 'id' | 'created_at'>[] = [
  {
    name: "Troca de Oleo + Filtros",
    description: "Servico completo de troca de oleo com filtros",
    items: [
      { name: "Oleo motor (4L)", price: 100 },
      { name: "Filtro oleo", price: 35 },
      { name: "Filtro ar", price: 45 },
    ],
    total_price: 180,
    is_active: true,
  },
  {
    name: "Revisao 10.000 km",
    description: "Revisao preventiva de 10 mil quilometros",
    items: [
      { name: "Troca oleo + filtros", price: 180 },
      { name: "Check freios", price: 50 },
      { name: "Alinhamento", price: 80 },
    ],
    total_price: 310,
    is_active: true,
  },
  {
    name: "Revisao 20.000 km",
    description: "Revisao preventiva de 20 mil quilometros",
    items: [
      { name: "Revisao 10k", price: 310 },
      { name: "Velas", price: 120 },
      { name: "Filtro combustivel", price: 60 },
    ],
    total_price: 490,
    is_active: true,
  },
];

const WorkshopTemplates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formItems, setFormItems] = useState<TemplateItem[]>([{ name: "", price: 0 }]);
  const [formIsActive, setFormIsActive] = useState(true);

  // Load workshop and templates
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      // Get workshop
      const { data: workshopData, error: workshopError } = await supabase
        .from('workshops')
        .select('id, name, plan')
        .eq('owner_id', user.id)
        .single();

      if (workshopError) {
        console.error('Error fetching workshop:', workshopError);
        navigate('/workshop/dashboard');
        return;
      }

      setWorkshop(workshopData);

      // Get templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('workshop_service_templates')
        .select('*')
        .eq('workshop_id', workshopData.id)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
      } else {
        // Parse items JSON
        const parsedTemplates = templatesData?.map(t => ({
          ...t,
          items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items || []
        })) || [];
        setTemplates(parsedTemplates);
      }

      setLoading(false);
    };

    loadData();
  }, [user, navigate]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate total from items
  const calculateTotal = (items: TemplateItem[]) => {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  // Open modal for new template
  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormDescription("");
    setFormItems([{ name: "", price: 0 }]);
    setFormIsActive(true);
    setShowModal(true);
  };

  // Open modal for editing
  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description || "");
    setFormItems(template.items.length > 0 ? [...template.items] : [{ name: "", price: 0 }]);
    setFormIsActive(template.is_active);
    setShowModal(true);
  };

  // Duplicate template
  const handleDuplicateTemplate = async (template: Template) => {
    if (!workshop) return;

    try {
      const { data, error } = await supabase
        .from('workshop_service_templates')
        .insert({
          workshop_id: workshop.id,
          name: `${template.name} (Copia)`,
          description: template.description,
          items: template.items,
          total_price: template.total_price,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const newTemplate = {
        ...data,
        items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items || []
      };

      setTemplates([newTemplate, ...templates]);
      toast({
        title: "Template duplicado!",
        description: "O template foi duplicado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error duplicating template:', error);
      toast({
        title: "Erro ao duplicar",
        description: error.message || "Nao foi possivel duplicar o template.",
        variant: "destructive",
      });
    }
  };

  // Toggle template active status
  const handleToggleActive = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('workshop_service_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      setTemplates(templates.map(t =>
        t.id === template.id ? { ...t, is_active: !t.is_active } : t
      ));

      toast({
        title: template.is_active ? "Template desativado" : "Template ativado",
        description: template.is_active
          ? "O template nao aparecera mais nas opcoes."
          : "O template agora esta disponivel para uso.",
      });
    } catch (error: any) {
      console.error('Error toggling template:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Nao foi possivel atualizar o template.",
        variant: "destructive",
      });
    }
  };

  // Confirm delete
  const handleConfirmDelete = (template: Template) => {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  };

  // Delete template
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('workshop_service_templates')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== templateToDelete.id));
      setShowDeleteDialog(false);
      setTemplateToDelete(null);

      toast({
        title: "Template excluido",
        description: "O template foi excluido permanentemente.",
      });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Nao foi possivel excluir o template.",
        variant: "destructive",
      });
    }
  };

  // Add item to form
  const addFormItem = () => {
    setFormItems([...formItems, { name: "", price: 0 }]);
  };

  // Remove item from form
  const removeFormItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // Update form item
  const updateFormItem = (index: number, field: 'name' | 'price', value: string | number) => {
    setFormItems(formItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!workshop) return;

    // Validate
    if (!formName.trim()) {
      toast({
        title: "Nome obrigatorio",
        description: "Por favor, informe o nome do template.",
        variant: "destructive",
      });
      return;
    }

    const validItems = formItems.filter(item => item.name.trim() && item.price > 0);
    if (validItems.length === 0) {
      toast({
        title: "Itens obrigatorios",
        description: "Adicione pelo menos um item com nome e valor.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const templateData = {
        workshop_id: workshop.id,
        name: formName.trim(),
        description: formDescription.trim() || null,
        items: validItems,
        total_price: calculateTotal(validItems),
        is_active: formIsActive,
      };

      if (editingTemplate) {
        // Update
        const { error } = await supabase
          .from('workshop_service_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;

        setTemplates(templates.map(t =>
          t.id === editingTemplate.id
            ? { ...t, ...templateData, items: validItems }
            : t
        ));

        toast({
          title: "Template atualizado!",
          description: "As alteracoes foram salvas.",
        });
      } else {
        // Create
        const { data, error } = await supabase
          .from('workshop_service_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) throw error;

        const newTemplate = {
          ...data,
          items: validItems
        };

        setTemplates([newTemplate, ...templates]);

        toast({
          title: "Template criado!",
          description: "O template foi criado com sucesso.",
        });
      }

      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Nao foi possivel salvar o template.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const isProfessional = workshop?.plan === 'professional' || workshop?.plan === 'enterprise';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workshop/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold">Templates de Servicos</h1>
                <p className="text-sm text-gray-500">Crie templates para agilizar atendimentos</p>
              </div>
            </div>
            {isProfessional && (
              <Button
                onClick={handleNewTemplate}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Upgrade Banner for Starter */}
        {!isProfessional && (
          <Card className="mb-6 border-2 border-yellow-400 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-shrink-0">
                  <Crown className="h-10 w-10 text-yellow-500" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-bold text-lg">Crie Templates Personalizados</h3>
                  <p className="text-sm text-gray-600">
                    Faca upgrade para o plano Professional e crie templates customizados para agilizar seus atendimentos.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/workshop/settings')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Fazer Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Default Templates */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">Templates Padrao</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Templates padrao nao podem ser editados</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid gap-4">
            {DEFAULT_TEMPLATES.map((template, index) => (
              <Card key={index} className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{template.name}</h3>
                        <Badge variant="secondary" className="text-xs">Padrao</Badge>
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                      )}
                      <div className="text-sm text-gray-600">
                        {template.items.slice(0, 3).map((item, i) => (
                          <span key={i}>
                            {item.name}
                            {i < Math.min(template.items.length, 3) - 1 && ", "}
                          </span>
                        ))}
                        {template.items.length > 3 && (
                          <span className="text-gray-400"> ...+{template.items.length - 3}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(template.total_price)}
                      </p>
                      <Lock className="h-4 w-4 text-gray-400 ml-auto mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Templates (Professional only) */}
        {isProfessional && (
          <div>
            <h2 className="text-lg font-bold mb-4">Seus Templates</h2>

            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Nenhum template criado</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Crie templates para agilizar seus atendimentos
                  </p>
                  <Button onClick={handleNewTemplate} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className={!template.is_active ? "opacity-60" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold">{template.name}</h3>
                            <Badge variant={template.is_active ? "default" : "secondary"}>
                              {template.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          {template.description && (
                            <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                          )}
                          <div className="text-sm text-gray-600">
                            {template.items.slice(0, 3).map((item, i) => (
                              <span key={i}>
                                {item.name}
                                {i < Math.min(template.items.length, 3) - 1 && ", "}
                              </span>
                            ))}
                            {template.items.length > 3 && (
                              <span className="text-gray-400"> ...+{template.items.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(template.total_price)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicar
                        </Button>
                        <div className="flex items-center gap-2 ml-auto">
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={() => handleToggleActive(template)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmDelete(template)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Atualize as informacoes do template"
                : "Crie um template para agilizar seus atendimentos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="templateName">Nome do Template *</Label>
              <Input
                id="templateName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Troca de Oleo Completa"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Descricao (opcional)</Label>
              <Textarea
                id="templateDescription"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva os servicos incluidos..."
                rows={2}
              />
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>Itens do Servico</Label>
              <div className="space-y-2">
                {formItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateFormItem(index, 'name', e.target.value)}
                      placeholder="Nome do item"
                      className="flex-1"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                      <Input
                        type="number"
                        value={item.price || ''}
                        onChange={(e) => updateFormItem(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFormItem(index)}
                      disabled={formItems.length === 1}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addFormItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {/* Total */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(calculateTotal(formItems))}
                </span>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="templateActive">Ativar este template</Label>
              <Switch
                id="templateActive"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"?
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkshopTemplates;
