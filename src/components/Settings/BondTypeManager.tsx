import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { listConfigs, createConfig, updateConfig } from '@/lib/supabase/configs';
import { codigoSchema, jsonObjectStringSchema, parseJsonOrNull } from '@/lib/zod/configs';
import { useAdminAccess } from '@/hooks/useAdminAccess';

interface BondType {
  id: string;
  name: string;
  codigo: string;
  payroll_effects_json: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';

const formSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(180, 'Nome muito longo'),
  codigo: codigoSchema,
  payroll_effects_json: jsonObjectStringSchema,
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function BondTypeManager() {
  const { isAdmin, loading: checkingAdmin } = useAdminAccess();
  const canEdit = isAdmin && !checkingAdmin;

  const [bondTypes, setBondTypes] = useState<BondType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BondType | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      codigo: '',
      payroll_effects_json: undefined,
      is_active: true,
    },
  });

  const loadBondTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await listConfigs<BondType>('config_bond_types', {
      search: searchTerm,
      searchColumns: ['name', 'codigo'],
      filters: {
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      },
      order: { column: 'updated_at', ascending: false },
    });

    if (fetchError) {
      setError(fetchError);
      setBondTypes([]);
    } else {
      setBondTypes(data);
    }

    setLoading(false);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadBondTypes();
  }, [loadBondTypes]);

  useEffect(() => {
    if (dialogOpen) {
      if (editing) {
        form.reset({
          name: editing.name,
          codigo: editing.codigo,
          payroll_effects_json: JSON.stringify(editing.payroll_effects_json ?? {}, null, 2),
          is_active: editing.is_active,
        });
      } else {
        form.reset({
          name: '',
          codigo: '',
          payroll_effects_json: undefined,
          is_active: true,
        });
      }
    }
  }, [dialogOpen, editing, form]);

  const handleCreateClick = () => {
    if (!canEdit) {
      toast.error('Apenas administradores podem criar vínculos');
      return;
    }

    setEditing(null);
    setDialogOpen(true);
  };

  const handleEditClick = (bondType: BondType) => {
    if (!canEdit) {
      toast.error('Apenas administradores podem editar vínculos');
      return;
    }

    setEditing(bondType);
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para alterar vínculos');
      return;
    }

    const payload = {
      name: values.name.trim(),
      codigo: values.codigo.trim(),
      payroll_effects_json: values.payroll_effects_json && values.payroll_effects_json.trim().length > 0
        ? parseJsonOrNull<Record<string, unknown>>(values.payroll_effects_json) ?? {}
        : {},
      is_active: values.is_active,
    } satisfies Partial<BondType>;

    const action = editing
      ? await updateConfig<BondType>('config_bond_types', editing.id, payload)
      : await createConfig<BondType>('config_bond_types', payload);

    if (action.error) {
      toast.error(action.error);
      return;
    }

    toast.success(editing ? 'Vínculo atualizado com sucesso' : 'Vínculo criado com sucesso');
    setDialogOpen(false);
    setEditing(null);
    loadBondTypes();
  };

  const handleToggleActive = async (bondType: BondType) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para alterar vínculos');
      return;
    }

    if (bondType.is_active && !confirm('Tem certeza que deseja arquivar este vínculo?')) {
      return;
    }

    const { error: toggleError } = await updateConfig<BondType>('config_bond_types', bondType.id, {
      is_active: !bondType.is_active,
    });

    if (toggleError) {
      toast.error(toggleError);
      return;
    }

    toast.success(bondType.is_active ? 'Vínculo arquivado' : 'Vínculo reativado');
    loadBondTypes();
  };

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim().length > 0) {
      return 'Nenhum vínculo encontrado com os filtros atuais';
    }
    return 'Nenhum tipo de vínculo cadastrado ainda';
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold">Tipos de Vínculo</h3>
          <p className="text-sm text-muted-foreground">
            Configure vínculos trabalhistas e seus efeitos em folha de pagamento
          </p>
        </div>
        <Button onClick={handleCreateClick} disabled={!canEdit || checkingAdmin}>
          <Plus className="mr-2 h-4 w-4" /> Novo Vínculo
        </Button>
      </div>

      {(!isAdmin && !checkingAdmin) && (
        <Alert variant="default" className="border-dashed">
          <AlertTitle>Acesso de leitura</AlertTitle>
          <AlertDescription>
            Você não possui permissões de administrador. É possível visualizar os vínculos, mas não criar ou editar.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar vínculos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome ou código"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="md:w-80"
        />
        <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Arquivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando vínculos...
          </div>
        ) : bondTypes.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">{emptyMessage}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Código</TableHead>
                <TableHead>Efeitos em folha</TableHead>
                <TableHead className="hidden md:table-cell">Atualizado em</TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bondTypes.map((bondType) => (
                <TableRow key={bondType.id}>
                  <TableCell>
                    <div className="font-medium">{bondType.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">Código: {bondType.codigo}</div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {bondType.codigo}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {JSON.stringify(bondType.payroll_effects_json ?? {}, null, 0)}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {new Date(bondType.updated_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={bondType.is_active ? 'default' : 'outline'}>
                        {bondType.is_active ? 'Ativo' : 'Arquivado'}
                      </Badge>
                      <Switch
                        checked={bondType.is_active}
                        onCheckedChange={() => handleToggleActive(bondType)}
                        disabled={!canEdit}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        onClick={() => handleEditClick(bondType)}
                        disabled={!canEdit}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar vínculo' : 'Novo tipo de vínculo'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CLT Parcial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: BOND_CLT_PARCIAL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="payroll_effects_json"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Efeitos em folha (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Ex: {"fgts": true, "inss": "reduzido"}'
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Ativo</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Vínculos desativados ficam ocultos para usuários comuns.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} type="button">
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editing ? 'Salvar alterações' : 'Criar vínculo'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
