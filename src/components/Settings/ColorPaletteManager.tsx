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
import { nullableTextSchema, toNullableString } from "@/lib/zod/configs";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface ColorPalette {
  id: string;
  name: string;
  descricao: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(120, "Nome muito longo"),
  descricao: nullableTextSchema,
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type StatusFilter = "all" | "active" | "inactive";

export function ColorPaletteManager() {
  const { isAdmin, loading: checkingAdmin } = useAdminAccess();
  const canEdit = isAdmin && !checkingAdmin;

  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ColorPalette | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      descricao: null,
      is_active: true,
    },
  });

  const loadPalettes = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await listConfigs<ColorPalette>(
      "config_color_palettes",
      {
        search: searchTerm,
        searchColumns: ["name"],
        filters: {
          is_active:
            statusFilter === "all" ? undefined : statusFilter === "active",
        },
        order: { column: "updated_at", ascending: false },
      },
    );

    if (fetchError) {
      setError(fetchError);
      setPalettes([]);
    } else {
      setPalettes(data);
    }

    setLoading(false);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadPalettes();
  }, [loadPalettes]);

  useEffect(() => {
    if (dialogOpen) {
      if (editing) {
        form.reset({
          name: editing.name,
          descricao: editing.descricao ?? null,
          is_active: editing.is_active,
        });
      } else {
        form.reset({ name: "", descricao: null, is_active: true });
      }
    }
  }, [dialogOpen, editing, form]);

  const handleCreateClick = () => {
    if (!canEdit) {
      toast.error("Apenas administradores podem criar paletas");
      return;
    }

    setEditing(null);
    setDialogOpen(true);
  };

  const handleEditClick = (palette: ColorPalette) => {
    if (!canEdit) {
      toast.error("Apenas administradores podem editar paletas");
      return;
    }

    setEditing(palette);
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar paletas");
      return;
    }

    const payload = {
      name: values.name.trim(),
      descricao: toNullableString(values.descricao ?? undefined),
      is_active: values.is_active,
    } satisfies Partial<ColorPalette>;

    const action = editing
      ? await updateConfig<ColorPalette>(
          "config_color_palettes",
          editing.id,
          payload,
        )
      : await createConfig<ColorPalette>("config_color_palettes", payload);

    if (action.error) {
      toast.error(action.error);
      return;
    }

    toast.success(
      editing ? "Paleta atualizada com sucesso" : "Paleta criada com sucesso",
    );
    setDialogOpen(false);
    setEditing(null);
    loadPalettes();
  };

  const handleToggleActive = async (palette: ColorPalette) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar paletas");
      return;
    }

    if (
      palette.is_active &&
      !confirm("Tem certeza que deseja arquivar esta paleta?")
    ) {
      return;
    }

    const { error: toggleError } = await updateConfig<ColorPalette>(
      "config_color_palettes",
      palette.id,
      {
        is_active: !palette.is_active,
      },
    );

    if (toggleError) {
      toast.error(toggleError);
      return;
    }

    toast.success(palette.is_active ? "Paleta arquivada" : "Paleta reativada");
    loadPalettes();
  };

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim().length > 0) {
      return "Nenhuma paleta encontrada com os filtros atuais";
    }
    return "Nenhuma paleta cadastrada ainda";
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold">Paletas de Cor</h3>
          <p className="text-sm text-muted-foreground">
            Organize coleções de cores para aplicar em tecidos e componentes
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          disabled={!canEdit || checkingAdmin}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Paleta
        </Button>
      </div>

      {!isAdmin && !checkingAdmin && (
        <Alert variant="default" className="border-dashed">
          <AlertTitle>Acesso de leitura</AlertTitle>
          <AlertDescription>
            Você não possui permissões de administrador. É possível visualizar
            as paletas, mas não criar ou editar.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar paletas</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="md:w-80"
        />
        <Select
          value={statusFilter}
          onValueChange={(value: StatusFilter) => setStatusFilter(value)}
        >
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

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando
            paletas...
          </div>
        ) : palettes.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden md:table-cell">
                  Atualizado em
                </TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {palettes.map((palette) => (
                <TableRow key={palette.id}>
                  <TableCell>
                    <div className="font-medium">{palette.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      Atualizado em{" "}
                      {new Date(palette.updated_at).toLocaleString("pt-BR")}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {palette.descricao || (
                      <span className="text-xs text-muted-foreground">
                        Sem descrição
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {new Date(palette.updated_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={palette.is_active ? "default" : "outline"}
                      >
                        {palette.is_active ? "Ativa" : "Arquivada"}
                      </Badge>
                      <Switch
                        checked={palette.is_active}
                        onCheckedChange={() => handleToggleActive(palette)}
                        disabled={!canEdit}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        onClick={() => handleEditClick(palette)}
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
            <DialogTitle>
              {editing ? "Editar paleta" : "Nova paleta"}
            </DialogTitle>
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
                      <Input placeholder="Ex: Neutros Inverno" {...field} />
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
                        placeholder="Notas adicionais sobre a paleta"
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
                      <FormLabel>Ativa</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Paletas desativadas ficam ocultas para usuários comuns.
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
                  {editing ? "Salvar alterações" : "Criar paleta"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
