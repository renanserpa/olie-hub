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
  jsonArrayStringSchema,
  optionalIntegerSchema,
  optionalNumberSchema,
  parseJsonArrayOrEmpty,
  stringifyJson,
} from "@/lib/zod/configs";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const CUSTOMIZATION_TYPES = [
  "bordado",
  "laser",
  "monograma",
  "patch",
  "sublimacao",
  "aplicacao",
  "outro",
] as const;

type CustomizationType = (typeof CUSTOMIZATION_TYPES)[number];

type StatusFilter = "all" | "active" | "inactive";

type TypeFilter = "all" | CustomizationType;

interface CustomizationComponent {
  id: string;
  name: string;
  codigo: string;
  type: CustomizationType;
  allowed_positions_json: unknown[];
  max_colors: number | null;
  price_extra: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(180, "Nome muito longo"),
  codigo: codigoSchema,
  type: z.enum(CUSTOMIZATION_TYPES, { required_error: "Tipo é obrigatório" }),
  allowed_positions_json: jsonArrayStringSchema,
  max_colors: optionalIntegerSchema.refine(
    (value) => value === undefined || value >= 0,
    { message: "Informe um número inteiro maior ou igual a zero" },
  ),
  price_extra: optionalNumberSchema.refine(
    (value) => value === undefined || value >= 0,
    { message: "Informe um valor maior ou igual a zero" },
  ),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function CustomizationComponentManager() {
  const { isAdmin, loading: checkingAdmin } = useAdminAccess();
  const canEdit = isAdmin && !checkingAdmin;

  const [components, setComponents] = useState<CustomizationComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomizationComponent | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      codigo: "",
      type: "bordado",
      allowed_positions_json: undefined,
      max_colors: undefined,
      price_extra: undefined,
      is_active: true,
    },
  });

  const loadComponents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } =
      await listConfigs<CustomizationComponent>(
        "config_customization_components",
        {
          search: searchTerm,
          searchColumns: ["name", "codigo"],
          filters: {
            is_active:
              statusFilter === "all" ? undefined : statusFilter === "active",
            type: typeFilter === "all" ? undefined : typeFilter,
          },
          order: { column: "updated_at", ascending: false },
        },
      );

    if (fetchError) {
      setError(fetchError);
      setComponents([]);
    } else {
      setComponents(data);
    }

    setLoading(false);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  useEffect(() => {
    if (dialogOpen) {
      if (editing) {
        form.reset({
          name: editing.name,
          codigo: editing.codigo,
          type: editing.type,
          allowed_positions_json: stringifyJson(
            editing.allowed_positions_json ?? [],
          ),
          max_colors: editing.max_colors ?? undefined,
          price_extra: editing.price_extra ?? undefined,
          is_active: editing.is_active,
        });
      } else {
        form.reset({
          name: "",
          codigo: "",
          type: "bordado",
          allowed_positions_json: undefined,
          max_colors: undefined,
          price_extra: undefined,
          is_active: true,
        });
      }
    }
  }, [dialogOpen, editing, form]);

  const handleCreateClick = () => {
    if (!canEdit) {
      toast.error("Apenas administradores podem criar componentes");
      return;
    }

    setEditing(null);
    setDialogOpen(true);
  };

  const handleEditClick = (component: CustomizationComponent) => {
    if (!canEdit) {
      toast.error("Apenas administradores podem editar componentes");
      return;
    }

    setEditing(component);
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar componentes");
      return;
    }

    const payload = {
      name: values.name.trim(),
      codigo: values.codigo.trim(),
      type: values.type,
      allowed_positions_json:
        values.allowed_positions_json &&
        values.allowed_positions_json.trim().length > 0
          ? parseJsonArrayOrEmpty(values.allowed_positions_json)
          : [],
      max_colors: values.max_colors ?? null,
      price_extra: values.price_extra ?? null,
      is_active: values.is_active,
    } satisfies Partial<CustomizationComponent>;

    const action = editing
      ? await updateConfig<CustomizationComponent>(
          "config_customization_components",
          editing.id,
          payload,
        )
      : await createConfig<CustomizationComponent>(
          "config_customization_components",
          payload,
        );

    if (action.error) {
      toast.error(action.error);
      return;
    }

    toast.success(
      editing
        ? "Componente atualizado com sucesso"
        : "Componente criado com sucesso",
    );
    setDialogOpen(false);
    setEditing(null);
    loadComponents();
  };

  const handleToggleActive = async (component: CustomizationComponent) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar componentes");
      return;
    }

    if (
      component.is_active &&
      !confirm("Tem certeza que deseja arquivar este componente?")
    ) {
      return;
    }

    const { error: toggleError } = await updateConfig<CustomizationComponent>(
      "config_customization_components",
      component.id,
      {
        is_active: !component.is_active,
      },
    );

    if (toggleError) {
      toast.error(toggleError);
      return;
    }

    toast.success(
      component.is_active ? "Componente arquivado" : "Componente reativado",
    );
    loadComponents();
  };

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim().length > 0) {
      return "Nenhum componente encontrado com os filtros atuais";
    }
    return "Nenhum componente de customização cadastrado ainda";
  }, [searchTerm]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold">Componentes de Customização</h3>
          <p className="text-sm text-muted-foreground">
            Defina opções adicionais para personalização e suas regras de cores
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          disabled={!canEdit || checkingAdmin}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Componente
        </Button>
      </div>

      {!isAdmin && !checkingAdmin && (
        <Alert variant="default" className="border-dashed">
          <AlertTitle>Acesso de leitura</AlertTitle>
          <AlertDescription>
            Você não possui permissões de administrador. É possível visualizar
            os componentes, mas não criar ou editar.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar componentes</AlertTitle>
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
          <Select
            value={typeFilter}
            onValueChange={(value: TypeFilter) => setTypeFilter(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {CUSTOMIZATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando
            componentes...
          </div>
        ) : components.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Posições</TableHead>
                <TableHead className="hidden md:table-cell">Cores</TableHead>
                <TableHead className="hidden md:table-cell">
                  Adicional
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Atualizado em
                </TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow key={component.id}>
                  <TableCell>
                    <div className="font-medium">{component.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      Código: {component.codigo}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {component.codigo}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {component.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {component.allowed_positions_json?.length ?? 0}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {component.max_colors ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {component.price_extra !== null
                      ? currencyFormatter.format(component.price_extra)
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {new Date(component.updated_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={component.is_active ? "default" : "outline"}
                      >
                        {component.is_active ? "Ativo" : "Arquivado"}
                      </Badge>
                      <Switch
                        checked={component.is_active}
                        onCheckedChange={() => handleToggleActive(component)}
                        disabled={!canEdit}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        onClick={() => handleEditClick(component)}
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
              {editing
                ? "Editar componente"
                : "Novo componente de customização"}
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
                        <Input placeholder="Ex: Bordado inicial" {...field} />
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
                        <Input
                          placeholder="Ex: CUSTOM_BORDADO_INICIAL"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
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
                        {CUSTOMIZATION_TYPES.map((type) => (
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
                name="allowed_positions_json"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posições permitidas (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Ex: ["frente", "costas"]'
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="max_colors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de cores</FormLabel>
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

                <FormField
                  control={form.control}
                  name="price_extra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adicional de preço (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
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
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Ativo</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Componentes desativados ficam ocultos para usuários
                        comuns.
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
                  {editing ? "Salvar alterações" : "Criar componente"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
