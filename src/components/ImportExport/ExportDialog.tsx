import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const [entity, setEntity] = useState<string>('products');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      let filename = '';

      if (entity === 'products') {
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        if (error) throw error;
        data = products || [];
        filename = 'produtos.csv';
      } else if (entity === 'contacts') {
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('*')
          .order('name');
        if (error) throw error;
        data = contacts || [];
        filename = 'contatos.csv';
      } else if (entity === 'inventory') {
        const { data: movements, error } = await supabase
          .from('inventory_movements')
          .select(`
            *,
            product:products(name, sku)
          `)
          .order('created_at', { ascending: false });
        if (error) throw error;
        data = movements || [];
        filename = 'movimentacoes.csv';
      }

      if (data.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhum registro encontrado',
        });
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'object') return JSON.stringify(value);
            return value;
          }).join(',')
        )
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: `${data.length} registros exportados`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Erro ao exportar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Tipo de Dados</Label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="products">Produtos</SelectItem>
                <SelectItem value="contacts">Contatos</SelectItem>
                <SelectItem value="inventory">Movimentações de Estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={loading} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
