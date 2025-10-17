import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import {
  listConfigs,
  createConfig,
  updateConfig,
} from "@/lib/supabase/configs";
import {
  codigoSchema,
  jsonObjectStringSchema,
  nullableTextSchema,
  optionalIntegerSchema,
  parseJsonOrNull,
  stringifyJson,
  toNullableString,
} from "@/lib/zod/configs";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface PackagingType {
  id: string;
  name: string;
  codigo: string;
  dimensions_json: Record<string, unknown> | null;
  material: string | null;
  capacity: string | null;
  weight_limit_g: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type StatusFilter = "all" | "active" | "inactive";

const formSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(180, "Nome muito longo"),
  codigo: codigoSchema,
  dimensions_json: jsonObjectStringSchema,
  material: nullableTextSchema,
  capacity: nullableTextSchema,
  weight_limit_g: optionalIntegerSchema.refine(
    (value) => value === undefined || value >= 0,
    { message: "Informe um valor maior ou igual a zero" },
  ),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function PackagingTypeManager() {
  const { isAdmin, loading: checkingAdmin } = useAdminAccess();
  const canEdit = isAdmin && !checkingAdmin;

  const [types, setTypes] = useState<PackagingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PackagingType | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      codigo: "",
      dimensions_json: undefined,
      material: null,
      capacity: null,
      weight_limit_g: undefined,
      is_active: true,
    },
  });

  const loadTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await listConfigs<PackagingType>(
      "config_packaging_types",
      {
        search: searchTerm,
        searchColumns: ["name", "codigo"],
        filters: {
          is_active:
            statusFilter === "all" ? undefined : statusFilter === "active",
        },
        order: { column: "updated_at", ascending: false },
      },
    );

    if (fetchError) {
      setError(fetchError);
      setTypes([]);
    } else {
      setTypes(data);
    }

    setLoading(false);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    if (dialogOpen) {
      if (editing) {
        form.reset({
          name: editing.name,
          codigo: editing.codigo,
          dimensions_json: stringifyJson(editing.dimensions_json),
          material: editing.material,
          capacity: editing.capacity,
          weight_limit_g: editing.weight_limit_g ?? undefined,
          is_active: editing.is_active,
        });
      } else {
        form.reset({
          name: "",
          codigo: "",
          dimensions_json: undefined,
          material: null,
          capacity: null,
          weight_limit_g: undefined,
          is_active: true,
        });
      }
    }
  }, [dialogOpen, editing, form]);

  const handleCreateClick = () => {
    if (!canEdit) {
      toast.error("Apenas administradores podem criar tipos de embalagem");
      return;
    }

    setEditing(null);
    setDialogOpen(true);
  };

  const handleEditClick = (type: PackagingType) => {
    if (!canEdit) {
      toast.error("Apenas administradores podem editar tipos de embalagem");
      return;
    }

    setEditing(type);
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar tipos de embalagem");
      return;
    }

    const payload = {
      name: values.name.trim(),
      codigo: values.codigo.trim(),
      dimensions_json:
        values.dimensions_json && values.dimensions_json.trim().length > 0
          ? (parseJsonOrNull<Record<string, unknown>>(values.dimensions_json) ??
            {})
          : {},
      material: toNullableString(values.material ?? undefined),
      capacity: toNullableString(values.capacity ?? undefined),
      weight_limit_g: values.weight_limit_g ?? null,
      is_active: values.is_active,
    } satisfies Partial<PackagingType>;

    const action = editing
      ? await updateConfig<PackagingType>(
          "config_packaging_types",
          editing.id,
          payload,
        )
      : await createConfig<PackagingType>("config_packaging_types", payload);

    if (action.error) {
      toast.error(action.error);
      return;
    }

    toast.success(
      editing ? "Tipo atualizado com sucesso" : "Tipo criado com sucesso",
    );
    setDialogOpen(false);
    setEditing(null);
    loadTypes();
  };

  const handleToggleActive = async (type: PackagingType) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar tipos de embalagem");
      return;
    }

    if (
      type.is_active &&
      !confirm("Tem certeza que deseja arquivar este tipo de embalagem?")
    ) {
      return;
    }

    const { error: toggleError } = await updateConfig<PackagingType>(
      "config_packaging_types",
      type.id,
      {
        is_active: !type.is_active,
      },
    );

    if (toggleError) {
      toast.error(toggleError);
      return;
    }

    toast.success(type.is_active ? "Tipo arquivado" : "Tipo reativado");
    loadTypes();
  };

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim().length > 0) {
      return "Nenhum tipo encontrado com os filtros atuais";
    }
    return "Nenhum tipo de embalagem cadastrado ainda";
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold">Tipos de Embalagem</h3>
          <p className="text-sm text-muted-foreground">
            Estruture embalagens padrão com dimensões, materiais e limites de
            peso
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          disabled={!canEdit || checkingAdmin}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Tipo
        </Button>
      </div>

      {!isAdmin && !checkingAdmin && (
        <Alert variant="default" className="border-dashed">
          <AlertTitle>Acesso de leitura</AlertTitle>
          <AlertDescription>
            Você não possui permissões de administrador. É possível visualizar
            as embalagens, mas não criar ou editar.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar tipos</AlertTitle>
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
        <Select
          value={statusFilter}
          onValueChange={(value: StatusFilter) => setStatusFilter(value)}
        >
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando
            tipos...
          </div>
        ) : types.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Código</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="hidden md:table-cell">
                  Capacidade
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Limite (g)
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Atualizado em
                </TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      Código: {type.codigo}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dimensões:{" "}
                      {JSON.stringify(type.dimensions_json ?? {}, null, 0)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {type.codigo}
                  </TableCell>
                  <TableCell>{type.material || "—"}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {type.capacity || "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {type.weight_limit_g ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {new Date(type.updated_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={type.is_active ? "default" : "outline"}>
                        {type.is_active ? "Ativo" : "Arquivado"}
                      </Badge>
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={() => handleToggleActive(type)}
                        disabled={!canEdit}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        onClick={() => handleEditClick(type)}
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
            <DialogTitle>
              {editing ? "Editar tipo" : "Novo tipo de embalagem"}
            </DialogTitle>
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
                        <Input placeholder="Ex: Caixa média" {...field} />
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
                        <Input placeholder="Ex: PKG_CAIXA_M" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Papelão"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Até 12 itens"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight_limit_g"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de peso (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(
                              value === "" ? undefined : Number(value),
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dimensions_json"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimensões (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Ex: {"width_cm": 30, "height_cm": 20, "depth_cm": 10}'
                        value={field.value ?? ""}
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
                        Tipos desativados ficam ocultos para usuários comuns.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editing ? "Salvar alterações" : "Criar tipo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
