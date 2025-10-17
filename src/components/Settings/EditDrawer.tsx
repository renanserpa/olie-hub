import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { humanize, isPermission, isMissingTable } from '@/lib/supabase/errors';

const UNIT_OPTIONS = ['pc', 'm', 'cm', 'mm', 'g', 'kg', 'ml', 'l'] as const;

const materialSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(180, 'Nome muito longo'),
  codigo: z
    .string({ required_error: 'Código é obrigatório' })
    .regex(/^[A-Z0-9_]{2,30}$/, 'Use 2-30 caracteres (letras maiúsculas, números ou _)'),
  unit: z.enum(UNIT_OPTIONS, { required_error: 'Selecione uma unidade' }),
  default_cost: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      if (typeof value === 'number') return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    },
    z
      .number({ required_error: 'Informe o custo padrão' })
      .min(0, 'Informe um valor maior ou igual a zero'),
  ),
  supply_group_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

type SupplyGroupOption = {
  value: string;
  label: string;
};

interface EditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<MaterialFormValues> & { id?: string };
  onSaved?: () => void;
  readOnly?: boolean;
  supplyGroups: SupplyGroupOption[];
}

export function EditDrawer({
  open,
  onOpenChange,
  initialData,
  onSaved,
  readOnly = false,
  supplyGroups,
}: EditDrawerProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      codigo: '',
      unit: 'pc',
      default_cost: 0,
      supply_group_id: null,
      is_active: true,
    },
  });

  const groupedOptions = useMemo(
    () => [{ value: '', label: 'Sem grupo' }, ...supplyGroups],
    [supplyGroups],
  );

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name ?? '',
        codigo: initialData?.codigo ?? '',
        unit: (initialData?.unit as MaterialFormValues['unit']) ?? 'pc',
        default_cost: Number(initialData?.default_cost ?? 0),
        supply_group_id: initialData?.supply_group_id ?? null,
        is_active: initialData?.is_active ?? true,
      });
    }
  }, [form, initialData, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (readOnly) {
      toast.info('Você não tem permissão para editar este material.');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: values.name.trim(),
      codigo: values.codigo.trim().toUpperCase(),
      unit: values.unit,
      default_cost: values.default_cost,
      supply_group_id: values.supply_group_id || null,
      is_active: values.is_active,
    } satisfies Partial<MaterialFormValues>;

    try {
      if (initialData?.id) {
        const { error } = await supabase
          .from('config_basic_materials' as any)
          .update(payload)
          .eq('id', initialData.id);

        if (error) {
          if (isMissingTable(error)) {
            toast.error('Migrations Pendentes', {
              description: 'Aplique as migrations no Supabase antes de continuar.',
            });
          } else if (isPermission(error)) {
            toast.error('Sem permissão para atualizar este material.');
          } else {
            toast.error(humanize(error));
          }
          return;
        }

        toast.success('Material atualizado com sucesso');
      } else {
        const { error } = await supabase.from('config_basic_materials' as any).insert(payload);

        if (error) {
          if (isMissingTable(error)) {
            toast.error('Migrations Pendentes', {
              description: 'Aplique as migrations no Supabase antes de continuar.',
            });
          } else if (isPermission(error)) {
            toast.error('Sem permissão para criar materiais.');
          } else {
            toast.error(humanize(error));
          }
          return;
        }

        toast.success('Material criado com sucesso');
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao salvar material';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="px-4 pb-4">
          <DrawerHeader>
            <DrawerTitle>{initialData?.id ? 'Editar material' : 'Novo material'}</DrawerTitle>
          </DrawerHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4 px-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Zíper de latão" disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="EXEMPLO_01"
                          disabled={readOnly}
                          onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="default_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo padrão (R$) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          {...field}
                          onChange={(event) => field.onChange(event.target.value)}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supply_group_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo de insumo</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={(value) => field.onChange(value || null)}
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {groupedOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <p className="text-sm text-muted-foreground">Materiais inativos não aparecem como sugestão no cadastro.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={readOnly} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DrawerFooter className="border-t bg-muted/30">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={readOnly || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData?.id ? 'Salvar alterações' : 'Criar material'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
