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
  nullableTextSchema,
  toNullableString,
} from "@/lib/zod/configs";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface SupplyGroup {
  id: string;
  name: string;
  codigo: string;
  descricao: string | null;
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
  descricao: nullableTextSchema,
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function SupplyGroupManager() {
  const { isAdmin, loading: checkingAdmin } = useAdminAccess();
  const canEdit = isAdmin && !checkingAdmin;

  const [groups, setGroups] = useState<SupplyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplyGroup | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      codigo: "",
      descricao: null,
      is_active: true,
    },
  });

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await listConfigs<SupplyGroup>(
      "config_supply_groups",
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
      setGroups([]);
    } else {
      setGroups(data);
    }

    setLoading(false);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (dialogOpen) {
      if (editing) {
        form.reset({
          name: editing.name,
          codigo: editing.codigo,
          descricao: editing.descricao,
          is_active: editing.is_active,
        });
      } else {
        form.reset({ name: "", codigo: "", descricao: null, is_active: true });
      }
    }
  }, [dialogOpen, editing, form]);

  const handleCreateClick = () => {
    if (!canEdit) {
      toast.error("Apenas administradores podem criar grupos");
      return;
    }

    setEditing(null);
    setDialogOpen(true);
  };

  const handleEditClick = (group: SupplyGroup) => {
    if (!canEdit) {
      toast.error("Apenas administradores podem editar grupos");
      return;
    }

    setEditing(group);
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar grupos");
      return;
    }

    const payload = {
      name: values.name.trim(),
      codigo: values.codigo.trim(),
      descricao: toNullableString(values.descricao ?? undefined),
      is_active: values.is_active,
    } satisfies Partial<SupplyGroup>;

    const action = editing
      ? await updateConfig<SupplyGroup>(
          "config_supply_groups",
          editing.id,
          payload,
        )
      : await createConfig<SupplyGroup>("config_supply_groups", payload);

    if (action.error) {
      toast.error(action.error);
      return;
    }

    toast.success(
      editing ? "Grupo atualizado com sucesso" : "Grupo criado com sucesso",
    );
    setDialogOpen(false);
    setEditing(null);
    loadGroups();
  };

  const handleToggleActive = async (group: SupplyGroup) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar grupos");
      return;
    }

    if (
      group.is_active &&
      !confirm("Tem certeza que deseja arquivar este grupo?")
    ) {
      return;
    }

    const { error: toggleError } = await updateConfig<SupplyGroup>(
      "config_supply_groups",
      group.id,
      {
        is_active: !group.is_active,
      },
    );

    if (toggleError) {
      toast.error(toggleError);
      return;
    }

    toast.success(group.is_active ? "Grupo arquivado" : "Grupo reativado");
    loadGroups();
  };

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim().length > 0) {
      return "Nenhum grupo encontrado com os filtros atuais";
    }
    return "Nenhum grupo cadastrado ainda";
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold">Grupos de Insumos</h3>
          <p className="text-sm text-muted-foreground">
            Organize conjuntos de materiais para relatórios e segmentações
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          disabled={!canEdit || checkingAdmin}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Grupo
        </Button>
      </div>

      {!isAdmin && !checkingAdmin && (
        <Alert variant="default" className="border-dashed">
          <AlertTitle>Acesso de leitura</AlertTitle>
          <AlertDescription>
            Você não possui permissões de administrador. É possível visualizar
            os grupos, mas não criar ou editar.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar grupos</AlertTitle>
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
            grupos...
          </div>
        ) : groups.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden md:table-cell">
                  Atualizado em
                </TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div className="font-medium">{group.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      Código: {group.codigo}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {group.codigo}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {group.descricao || (
                      <span className="text-xs text-muted-foreground">
                        Sem descrição
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {new Date(group.updated_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={group.is_active ? "default" : "outline"}>
                        {group.is_active ? "Ativo" : "Arquivado"}
                      </Badge>
                      <Switch
                        checked={group.is_active}
                        onCheckedChange={() => handleToggleActive(group)}
                        disabled={!canEdit}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        onClick={() => handleEditClick(group)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar grupo" : "Novo grupo"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Tecidos planos" {...field} />
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
                      <Input placeholder="Ex: GRP_TECIDOS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionais sobre o grupo"
                        value={field.value ?? ""}
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
                      <FormLabel>Ativo</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Grupos desativados ficam ocultos para usuários comuns.
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
                  {editing ? "Salvar alterações" : "Criar grupo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
