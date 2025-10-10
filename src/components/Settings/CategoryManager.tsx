import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, GripVertical } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'supply' | 'finished';
  properties: {
    unit?: string;
    has_color?: boolean;
    has_size?: boolean;
    has_pattern?: boolean;
    min_quantity?: number;
  };
  sort_order: number;
  is_active: boolean;
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase
      .from('product_categories' as any)
      .select('*')
      .order('sort_order');
    
    if (!error) setCategories((data as any) || []);
    setLoading(false);
  }

  async function handleSaveCategory(formData: Partial<Category>) {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('product_categories' as any)
          .update(formData)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        toast.success('Categoria atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('product_categories' as any)
          .insert(formData);
        
        if (error) throw error;
        toast.success('Categoria criada com sucesso');
      }
      
      loadCategories();
      setDialogOpen(false);
      setEditingCategory(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    const { error } = await supabase
      .from('product_categories' as any)
      .update({ is_active: !isActive })
      .eq('id', id);
    
    if (!error) {
      toast.success(isActive ? 'Categoria desativada' : 'Categoria ativada');
      loadCategories();
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Carregando categorias...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Categorias de Produtos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie categorias para insumos e produtos acabados
          </p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-3">
        {categories.map(cat => (
          <Card key={cat.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cat.name}</span>
                  <Badge variant={cat.type === 'supply' ? 'secondary' : 'default'}>
                    {cat.type === 'supply' ? 'Insumo' : 'Produto'}
                  </Badge>
                  {!cat.is_active && <Badge variant="outline">Inativo</Badge>}
                </div>
                {cat.properties?.unit && (
                  <span className="text-sm text-muted-foreground">
                    Unidade: {cat.properties.unit}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={cat.is_active}
                onCheckedChange={() => handleToggleActive(cat.id, cat.is_active)}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditingCategory(cat); setDialogOpen(true); }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
    </div>
  );
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSave: (data: Partial<Category>) => void;
}

function CategoryDialog({ open, onOpenChange, category, onSave }: CategoryDialogProps) {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    type: 'supply',
    properties: { unit: 'un', has_color: false },
    sort_order: 0
  });

  useEffect(() => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        name: '',
        type: 'supply',
        properties: { unit: 'un', has_color: false },
        sort_order: 0
      });
    }
  }, [category, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Zíper, Tecido, Linha..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select
              value={formData.type}
              onValueChange={(val: 'supply' | 'finished') => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supply">Insumo</SelectItem>
                <SelectItem value="finished">Produto Acabado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unidade de Medida</Label>
            <Select
              value={formData.properties?.unit || 'un'}
              onValueChange={(val) => setFormData({
                ...formData,
                properties: { ...formData.properties, unit: val }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="un">Unidade (un)</SelectItem>
                <SelectItem value="metro">Metro (m)</SelectItem>
                <SelectItem value="kg">Quilograma (kg)</SelectItem>
                <SelectItem value="litro">Litro (L)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Possui variação de cor?</Label>
            <Switch
              checked={formData.properties?.has_color}
              onCheckedChange={(val) => setFormData({
                ...formData,
                properties: { ...formData.properties, has_color: val }
              })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(formData)}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
