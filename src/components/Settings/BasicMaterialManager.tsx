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
  jsonMetadataStringSchema,
  nullableTextSchema,
  optionalNumberSchema,
  parseJsonOrNull,
  stringifyJson,
  toNullableString,
} from "@/lib/zod/configs";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const MATERIAL_UNITS = ["pc", "m", "cm", "mm", "g", "kg", "ml", "l"] as const;

type MaterialUnit = (typeof MATERIAL_UNITS)[number];

type StatusFilter = "all" | "active" | "inactive";

type UnitFilter = "all" | MaterialUnit;

type GroupFilter = "all" | string;

interface SupplyGroupOption {
  id: string;
  name: string;
}

interface BasicMaterial {
  id: string;
  name: string;
  codigo: string;
  unit: MaterialUnit;
  default_cost: number | null;
  metadata: Record<string, unknown> | null;
  supply_group_id: string | null;
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
  unit: z.enum(MATERIAL_UNITS, { required_error: "Unidade é obrigatória" }),
  default_cost: optionalNumberSchema.refine(
    (value) => value === undefined || value >= 0,
    { message: "Informe um valor maior ou igual a zero" },
  ),
  metadata: jsonMetadataStringSchema,
  supply_group_id: nullableTextSchema,
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function BasicMaterialManager() {
  const { isAdmin, loading: checkingAdmin } = useAdminAccess();
  const canEdit = isAdmin && !checkingAdmin;

  const [materials, setMaterials] = useState<BasicMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [unitFilter, setUnitFilter] = useState<UnitFilter>("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BasicMaterial | null>(null);
  const [groups, setGroups] = useState<SupplyGroupOption[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      codigo: "",
      unit: "pc",
      default_cost: undefined,
      metadata: undefined,
      supply_group_id: null,
      is_active: true,
    },
  });

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await listConfigs<BasicMaterial>(
      "config_basic_materials",
      {
        search: searchTerm,
        searchColumns: ["name", "codigo"],
        filters: {
          is_active:
            statusFilter === "all" ? undefined : statusFilter === "active",
          unit: unitFilter === "all" ? undefined : unitFilter,
          supply_group_id: groupFilter === "all" ? undefined : groupFilter,
        },
        order: { column: "updated_at", ascending: false },
      },
    );

    if (fetchError) {
      setError(fetchError);
      setMaterials([]);
    } else {
      setMaterials(data);
    }

    setLoading(false);
  }, [searchTerm, statusFilter, unitFilter, groupFilter]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  useEffect(() => {
    async function fetchGroups() {
      const { data } = await listConfigs<SupplyGroupOption>(
        "config_supply_groups",
        {
          filters: { is_active: true },
          searchColumns: ["name", "codigo"],
          order: { column: "name", ascending: true },
        },
      );
      setGroups(data);
    }

    fetchGroups();
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      if (editing) {
        form.reset({
          name: editing.name,
          codigo: editing.codigo,
          unit: editing.unit,
          default_cost: editing.default_cost ?? undefined,
          metadata: stringifyJson(editing.metadata),
          supply_group_id: editing.supply_group_id,
          is_active: editing.is_active,
        });
      } else {
        form.reset({
          name: "",
          codigo: "",
          unit: "pc",
          default_cost: undefined,
          metadata: undefined,
          supply_group_id: null,
          is_active: true,
        });
      }
    }
  }, [dialogOpen, editing, form]);

  const handleCreateClick = () => {
    if (!canEdit) {
      toast.error("Apenas administradores podem criar materiais");
      return;
    }

    setEditing(null);
    setDialogOpen(true);
  };

  const handleEditClick = (material: BasicMaterial) => {
    if (!canEdit) {
      toast.error("Apenas administradores podem editar materiais");
      return;
    }

    setEditing(material);
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar materiais");
      return;
    }

    const payload = {
      name: values.name.trim(),
      codigo: values.codigo.trim(),
      unit: values.unit,
      default_cost: values.default_cost ?? null,
      metadata:
        values.metadata && values.metadata.trim().length > 0
          ? (parseJsonOrNull<Record<string, unknown>>(values.metadata) ?? {})
          : {},
      supply_group_id: toNullableString(values.supply_group_id ?? undefined),
      is_active: values.is_active,
    } satisfies Partial<BasicMaterial>;

    const action = editing
      ? await updateConfig<BasicMaterial>(
          "config_basic_materials",
          editing.id,
          payload,
        )
      : await createConfig<BasicMaterial>("config_basic_materials", payload);

    if (action.error) {
      toast.error(action.error);
      return;
    }

    toast.success(
      editing
        ? "Material atualizado com sucesso"
        : "Material criado com sucesso",
    );
    setDialogOpen(false);
    setEditing(null);
    loadMaterials();
  };

  const handleToggleActive = async (material: BasicMaterial) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar materiais");
      return;
    }

    if (
      material.is_active &&
      !confirm("Tem certeza que deseja arquivar este material?")
    ) {
      return;
    }

    const { error: toggleError } = await updateConfig<BasicMaterial>(
      "config_basic_materials",
      material.id,
      {
        is_active: !material.is_active,
      },
    );

    if (toggleError) {
      toast.error(toggleError);
      return;
    }

    toast.success(
      material.is_active ? "Material arquivado" : "Material reativado",
    );
    loadMaterials();
  };

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim().length > 0) {
      return "Nenhum material encontrado com os filtros atuais";
    }
    return "Nenhum material cadastrado ainda";
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
          <h3 className="text-lg font-semibold">Materiais Básicos</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre matérias-primas e insumos com custos padrão e agrupamentos
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          disabled={!canEdit || checkingAdmin}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Material
        </Button>
      </div>

      {!isAdmin && !checkingAdmin && (
        <Alert variant="default" className="border-dashed">
          <AlertTitle>Acesso de leitura</AlertTitle>
          <AlertDescription>
            Você não possui permissões de administrador. É possível visualizar
            os materiais, mas não criar ou editar.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar materiais</AlertTitle>
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
        <div className="flex flex-wrap gap-2">
          <Select
            value={unitFilter}
            onValueChange={(value: UnitFilter) => setUnitFilter(value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas unidades</SelectItem>
              {MATERIAL_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={groupFilter}
            onValueChange={(value: GroupFilter) => setGroupFilter(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os grupos</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value: StatusFilter) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[160px]">
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
            materiais...
          </div>
        ) : materials.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Código</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="hidden md:table-cell">Grupo</TableHead>
                <TableHead className="hidden md:table-cell">
                  Custo padrão
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Atualizado em
                </TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const groupName = groups.find(
                  (group) => group.id === material.supply_group_id,
                )?.name;

                return (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="font-medium">{material.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">
                        Código: {material.codigo}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {material.codigo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase">
                        {material.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {groupName || "—"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {material.default_cost !== null
                        ? currencyFormatter.format(material.default_cost)
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {new Date(material.updated_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={material.is_active ? "default" : "outline"}
                        >
                          {material.is_active ? "Ativo" : "Arquivado"}
                        </Badge>
                        <Switch
                          checked={material.is_active}
                          onCheckedChange={() => handleToggleActive(material)}
                          disabled={!canEdit}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto"
                          onClick={() => handleEditClick(material)}
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
            <DialogTitle>
              {editing ? "Editar material" : "Novo material"}
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
                        <Input
                          placeholder="Ex: Tecido Oxford Azul"
                          {...field}
                        />
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
                        <Input placeholder="Ex: MAT_OXFORD_AZUL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MATERIAL_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
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
                  name="default_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo padrão (R$)</FormLabel>
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
                name="supply_group_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo de insumo</FormLabel>
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um grupo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem grupo</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
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
                name="metadata"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metadados (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Ex: {"gramatura": 280, "fornecedor": "Acme"}'
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
                        Materiais desativados ficam ocultos para usuários
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
                  {editing ? "Salvar alterações" : "Criar material"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
