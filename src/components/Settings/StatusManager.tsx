import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface StatusManagerProps {
  type: 'order' | 'production' | 'shipping';
}

interface Status {
  id: string;
  name: string;
  label: string;
  color: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
}

export function StatusManager({ type }: StatusManagerProps) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    color: 'bg-gray-500',
    icon: '',
    sort_order: 0,
    is_active: true,
  });

  const tableName = `${type}_statuses`;
  const typeLabel = {
    order: 'Pedidos',
    production: 'Produção',
    shipping: 'Entregas',
  }[type];

  const colorOptions = [
    { name: 'Cinza', value: 'bg-gray-500' },
    { name: 'Vermelho', value: 'bg-red-500' },
    { name: 'Laranja', value: 'bg-orange-500' },
    { name: 'Amarelo', value: 'bg-yellow-500' },
    { name: 'Verde', value: 'bg-green-500' },
    { name: 'Azul', value: 'bg-blue-500' },
    { name: 'Roxo', value: 'bg-purple-500' },
    { name: 'Rosa', value: 'bg-pink-500' },
    { name: 'Indigo', value: 'bg-indigo-500' },
    { name: 'Teal', value: 'bg-teal-500' },
  ];

  useEffect(() => {
    loadStatuses();
  }, [type]);

  async function loadStatuses() {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setStatuses((data as unknown as Status[]) || []);
    } catch (error: any) {
      console.error('Error loading statuses:', error);
      toast.error('Erro ao carregar status');
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    setEditingStatus(null);
    setFormData({
      name: '',
      label: '',
      color: 'bg-gray-500',
      icon: '',
      sort_order: statuses.length,
      is_active: true,
    });
    setDialogOpen(true);
  }

  function handleEdit(status: Status) {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      label: status.label,
      color: status.color,
      icon: status.icon || '',
      sort_order: status.sort_order,
      is_active: status.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name || !formData.label) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingStatus) {
        // Atualizar
        const { error } = await supabase
          .from(tableName as any)
          .update({
            label: formData.label,
            color: formData.color,
            icon: formData.icon || null,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          })
          .eq('id', editingStatus.id);

        if (error) throw error;
        toast.success('Status atualizado com sucesso');
      } else {
        // Criar
        const { error } = await supabase
          .from(tableName as any)
          .insert([{
            name: formData.name.toLowerCase().replace(/\s+/g, '_'),
            label: formData.label,
            color: formData.color,
            icon: formData.icon || null,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
            is_system: false,
          }]);

        if (error) throw error;
        toast.success('Status criado com sucesso');
      }

      loadStatuses();
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving status:', error);
      toast.error(error.message);
    }
  }

  async function handleDelete(id: string, isSystem: boolean) {
    if (isSystem) {
      toast.error('Status do sistema não podem ser deletados');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este status?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Status deletado com sucesso');
      loadStatuses();
    } catch (error: any) {
      console.error('Error deleting status:', error);
      toast.error(error.message);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from(tableName as any)
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      loadStatuses();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error(error.message);
    }
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status de {typeLabel}</CardTitle>
              <CardDescription>
                Gerencie os status disponíveis para {typeLabel.toLowerCase()}
              </CardDescription>
            </div>
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statuses.map((status) => (
              <div
                key={status.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <div>
                    <p className="font-medium">{status.label}</p>
                    <p className="text-sm text-muted-foreground">{status.name}</p>
                  </div>
                  {status.is_system && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="w-3 h-3" />
                      Sistema
                    </Badge>
                  )}
                  {!status.is_active && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={status.is_active}
                    onCheckedChange={() => handleToggleActive(status.id, status.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(status)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!status.is_system && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(status.id, status.is_system)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Editar Status' : 'Novo Status'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Identificador *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: em_analise"
                disabled={!!editingStatus}
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas e underscores
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nome de Exibição *</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="ex: Em Análise"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-10 rounded border-2 transition-all ${color.value} ${
                      formData.color === color.value ? 'ring-2 ring-primary scale-110' : ''
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}