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
import {
  codigoSchema,
  jsonObjectStringSchema,
  nullableTextSchema,
  parseJsonOrNull,
  stringifyJson,
  toNullableString,
} from '@/lib/zod/configs';
import { useAdminAccess } from '@/hooks/useAdminAccess';

const TEXTURE_TYPES = ['plain', 'pattern', 'leather', 'synthetic', 'other'] as const;

type TextureType = (typeof TEXTURE_TYPES)[number];

type StatusFilter = 'all' | 'active' | 'inactive';

type TextureTypeFilter = 'all' | TextureType;

interface FabricTexture {
  id: string;
  name: string;
  codigo: string;
  texture_type: TextureType;
  repeat_json: Record<string, unknown> | null;
  thumbnail_url: string | null;
  tile_url: string | null;
  composition: string | null;
  care_instructions: string | null;
  palette_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ColorPaletteOption {
  id: string;
  name: string;
}

const formSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(150, 'Nome muito longo'),
  codigo: codigoSchema,
  texture_type: z.enum(TEXTURE_TYPES, { required_error: 'Tipo é obrigatório' }),
  repeat_json: jsonObjectStringSchema,
  thumbnail_url: nullableTextSchema,
  tile_url: nullableTextSchema,
  composition: nullableTextSchema,
  care_instructions: nullableTextSchema,
  palette_id: nullableTextSchema,
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function FabricTextureManager() {
  const { isAdmin, loading: checkingAdmin } = useAdminAccess();
  const canEdit = isAdmin && !checkingAdmin;

  const [textures, setTextures] = useState<FabricTexture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [typeFilter, setTypeFilter] = useState<TextureTypeFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FabricTexture | null>(null);
  const [palettes, setPalettes] = useState<ColorPaletteOption[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      codigo: '',
      texture_type: 'plain',
      repeat_json: undefined,
      thumbnail_url: null,
      tile_url: null,
      composition: null,
      care_instructions: null,
      palette_id: null,
      is_active: true,
    },
  });

  const loadTextures = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await listConfigs<FabricTexture>('config_fabric_textures', {
      search: searchTerm,
      searchColumns: ['name', 'codigo'],
      filters: {
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        texture_type: typeFilter === 'all' ? undefined : typeFilter,
      },
      order: { column: 'updated_at', ascending: false },
    });

    if (fetchError) {
      setError(fetchError);
      setTextures([]);
    } else {
      setTextures(data);
    }

    setLoading(false);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    loadTextures();
  }, [loadTextures]);

  useEffect(() => {
    async function fetchPalettes() {
      const { data } = await listConfigs<ColorPaletteOption>('config_color_palettes', {
        filters: { is_active: true },
        searchColumns: ['name'],
        order: { column: 'name', ascending: true },
      });
      setPalettes(data);
    }

    fetchPalettes();
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      if (editing) {
        form.reset({
          name: editing.name,
          codigo: editing.codigo,
          texture_type: editing.texture_type,
          repeat_json: stringifyJson(editing.repeat_json),
          thumbnail_url: editing.thumbnail_url,
          tile_url: editing.tile_url,
          composition: editing.composition,
          care_instructions: editing.care_instructions,
          palette_id: editing.palette_id,
          is_active: editing.is_active,
        });
      } else {
        form.reset({
          name: '',
          codigo: '',
          texture_type: 'plain',
          repeat_json: undefined,
          thumbnail_url: null,
          tile_url: null,
          composition: null,
          care_instructions: null,
          palette_id: null,
          is_active: true,
        });
      }
    }
  }, [dialogOpen, editing, form]);

  const handleCreateClick = () => {
    if (!canEdit) {
      toast.error('Apenas administradores podem criar texturas');
      return;
    }

    setEditing(null);
    setDialogOpen(true);
  };

  const handleEditClick = (texture: FabricTexture) => {
    if (!canEdit) {
      toast.error('Apenas administradores podem editar texturas');
      return;
    }

    setEditing(texture);
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para alterar texturas');
      return;
    }

    let repeatJson: Record<string, unknown> | null = null;
    if (values.repeat_json && values.repeat_json.trim().length > 0) {
      repeatJson = parseJsonOrNull<Record<string, unknown>>(values.repeat_json) ?? null;
    }

    const payload = {
      name: values.name.trim(),
      codigo: values.codigo.trim(),
      texture_type: values.texture_type,
      repeat_json: repeatJson,
      thumbnail_url: toNullableString(values.thumbnail_url ?? undefined),
      tile_url: toNullableString(values.tile_url ?? undefined),
      composition: toNullableString(values.composition ?? undefined),
      care_instructions: toNullableString(values.care_instructions ?? undefined),
      palette_id: toNullableString(values.palette_id ?? undefined),
      is_active: values.is_active,
    } satisfies Partial<FabricTexture>;

    const action = editing
      ? await updateConfig<FabricTexture>('config_fabric_textures', editing.id, payload)
      : await createConfig<FabricTexture>('config_fabric_textures', payload);

    if (action.error) {
      toast.error(action.error);
      return;
    }

    toast.success(editing ? 'Textura atualizada com sucesso' : 'Textura criada com sucesso');
    setDialogOpen(false);
    setEditing(null);
    loadTextures();
  };

  const handleToggleActive = async (texture: FabricTexture) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para alterar texturas');
      return;
    }

    if (texture.is_active && !confirm('Tem certeza que deseja arquivar esta textura?')) {
      return;
    }

    const { error: toggleError } = await updateConfig<FabricTexture>('config_fabric_textures', texture.id, {
      is_active: !texture.is_active,
    });

    if (toggleError) {
      toast.error(toggleError);
      return;
    }

    toast.success(texture.is_active ? 'Textura arquivada' : 'Textura reativada');
    loadTextures();
  };

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim().length > 0) {
      return 'Nenhuma textura encontrada com os filtros atuais';
    }
    return 'Nenhuma textura cadastrada ainda';
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold">Texturas de Tecido</h3>
          <p className="text-sm text-muted-foreground">
            Centralize amostras de texturas com códigos, repetições e paletas associadas
          </p>
        </div>
        <Button onClick={handleCreateClick} disabled={!canEdit || checkingAdmin}>
          <Plus className="mr-2 h-4 w-4" /> Nova Textura
        </Button>
      </div>

      {(!isAdmin && !checkingAdmin) && (
        <Alert variant="default" className="border-dashed">
          <AlertTitle>Acesso de leitura</AlertTitle>
          <AlertDescription>
            Você não possui permissões de administrador. É possível visualizar as texturas, mas não criar ou editar.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar texturas</AlertTitle>
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
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(value: TextureTypeFilter) => setTypeFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {TEXTURE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Arquivados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando texturas...
          </div>
        ) : textures.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">{emptyMessage}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Paleta</TableHead>
                <TableHead className="hidden md:table-cell">Atualizado em</TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {textures.map((texture) => {
                const paletteName = palettes.find((palette) => palette.id === texture.palette_id)?.name;

                return (
                  <TableRow key={texture.id}>
                    <TableCell>
                      <div className="font-medium">{texture.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">Código: {texture.codigo}</div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {texture.codigo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {texture.texture_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {paletteName || '—'}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {new Date(texture.updated_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={texture.is_active ? 'default' : 'outline'}>
                          {texture.is_active ? 'Ativa' : 'Arquivada'}
                        </Badge>
                        <Switch
                          checked={texture.is_active}
                          onCheckedChange={() => handleToggleActive(texture)}
                          disabled={!canEdit}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto"
                          onClick={() => handleEditClick(texture)}
                          disabled={!canEdit}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar textura' : 'Nova textura'}</DialogTitle>
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
                        <Input placeholder="Ex: Couro Liso Marrom" {...field} />
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
                        <Input placeholder="Ex: TEX_001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="texture_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEXTURE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="palette_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paleta associada</FormLabel>
                      <Select
                        value={field.value ?? 'none'}
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma paleta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sem paleta</SelectItem>
                          {palettes.map((palette) => (
                            <SelectItem key={palette.id} value={palette.id}>
                              {palette.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="thumbnail_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tile_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tile URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="composition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Composição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes da composição do tecido"
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="care_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções de cuidado</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Recomendações de cuidado e lavagem"
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repeat_json"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuração de repetição (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Ex: {"width": 64, "height": 64}'
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
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
                      <FormLabel>Ativa</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Texturas desativadas ficam ocultas para usuários comuns.
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
                  {editing ? 'Salvar alterações' : 'Criar textura'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
