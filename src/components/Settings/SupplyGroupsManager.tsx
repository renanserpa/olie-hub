import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TableManager } from "@/components/Settings/TableManager";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { humanize, isPermission, isMissingTable } from "@/lib/supabase/errors";
import { TableNotFoundCallout } from "@/components/common/TableNotFoundCallout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type SupplyGroup = {
  id: string;
  codigo: string;
  name: string;
  descricao: string | null;
  is_active: boolean;
  updated_at: string;
};

interface SupplyGroupsManagerProps {
  readOnly?: boolean;
  onChanged?: () => void;
}

export function SupplyGroupsManager({
  readOnly = false,
  onChanged,
}: SupplyGroupsManagerProps) {
  const [nonce, setNonce] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SupplyGroup | null>(null);
  const [error, setError] = useState<string | "TABLE_NOT_FOUND" | "PERMISSION_DENIED" | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = !readOnly;

  useEffect(() => {
    async function checkTable() {
      setLoading(true);
      const { error } = await supabase
        .from("config_supply_groups" as any)
        .select("id")
        .limit(1);
      
      if (error) {
        if (isMissingTable(error)) {
          setError("TABLE_NOT_FOUND");
        } else if (isPermission(error)) {
          setError("PERMISSION_DENIED");
        } else {
          setError(humanize(error));
        }
      }
      setLoading(false);
    }
    checkTable();
  }, [nonce]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    [],
  );

  const columns = useMemo(
    () => [
      { key: "codigo", label: "Código" },
      { key: "name", label: "Nome" },
      {
        key: "descricao",
        label: "Descrição",
        render: (item: SupplyGroup) => (
          <span className="block max-w-xs truncate text-sm text-muted-foreground">
            {item.descricao?.trim() || "—"}
          </span>
        ),
      },
      {
        key: "is_active",
        label: "Status",
        render: (item: SupplyGroup) =>
          item.is_active ? (
            <Badge variant="secondary">Ativo</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inativo
            </Badge>
          ),
      },
      {
        key: "updated_at",
        label: "Atualizado em",
        render: (item: SupplyGroup) =>
          item.updated_at
            ? dateFormatter.format(new Date(item.updated_at))
            : "—",
      },
    ],
    [dateFormatter],
  );

  const filters = useMemo(
    () => [
      {
        type: "search" as const,
        fields: ["name", "codigo"],
        placeholder: "Buscar por nome ou código",
      },
      {
        type: "select" as const,
        label: "Status",
        field: "is_active",
        defaultValue: "true",
        options: [
          { label: "Ativos", value: "true", queryValue: true },
          { label: "Inativos", value: "false", queryValue: false },
          { label: "Todos", value: "all", queryValue: undefined },
        ],
      },
    ],
    [],
  );

  const handleCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const handleEdit = (item: SupplyGroup) => {
    setEditing(item);
    setDrawerOpen(true);
  };

  const handleSaved = () => {
    setNonce((value) => value + 1);
    onChanged?.();
  };

  const handleDrawerOpenChange = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setEditing(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>;
  }

  if (error === "TABLE_NOT_FOUND") {
    return (
      <TableNotFoundCallout
        tableName="config_supply_groups"
        onRetry={() => setNonce((k) => k + 1)}
      />
    );
  }

  if (error === "PERMISSION_DENIED") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Você não tem permissão para acessar esta área. Entre como{" "}
          <strong>admin</strong> ou peça acesso.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive">Erro: {error}</div>;
  }

  return (
    <>
      <TableManager
        title="Grupos de insumo"
        table="config_supply_groups"
        columns={columns}
        filters={filters}
        onCreate={handleCreate}
        onEdit={handleEdit}
        isReadOnly={!isAdmin}
        onRetry={() => setNonce((n) => n + 1)}
      />

      <SupplyGroupDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        initialData={editing || undefined}
        onSaved={handleSaved}
        readOnly={readOnly}
      />
    </>
  );
}

const groupSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Informe pelo menos 2 caracteres")
    .max(180, "Nome muito longo"),
  codigo: z
    .string({ required_error: "Código é obrigatório" })
    .regex(
      /^[A-Z0-9_]{2,30}$/,
      "Use 2-30 caracteres (letras maiúsculas, números ou _)",
    ),
  descricao: z.string().max(300, "Máximo de 300 caracteres").optional(),
  is_active: z.boolean(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

interface SupplyGroupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: SupplyGroup;
  onSaved?: () => void;
  readOnly?: boolean;
}

function SupplyGroupDrawer({
  open,
  onOpenChange,
  initialData,
  onSaved,
  readOnly = false,
}: SupplyGroupDrawerProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      codigo: "",
      descricao: "",
      is_active: true,
    },
  });

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset({
        name: "",
        codigo: "",
        descricao: "",
        is_active: true,
      });
      setSubmitting(false);
      onOpenChange(nextOpen);
      return;
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (readOnly) {
      toast.info("Somente administradores podem alterar grupos.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: values.name.trim(),
      codigo: values.codigo.trim().toUpperCase(),
      descricao: values.descricao?.trim() ? values.descricao.trim() : null,
      is_active: values.is_active,
    };

    try {
      if (initialData) {
        const { error } = await supabase
          .from("config_supply_groups" as any)
          .update(payload)
          .eq("id", initialData.id);

        if (error) {
          toast.error(
            isPermission(error)
              ? "Sem permissão para atualizar grupos."
              : humanize(error),
          );
          return;
        }

        toast.success("Grupo atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("config_supply_groups" as any)
          .insert(payload);

        if (error) {
          toast.error(
            isPermission(error)
              ? "Sem permissão para criar grupos."
              : humanize(error),
          );
          return;
        }

        toast.success("Grupo criado com sucesso");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao salvar grupo";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name ?? "",
        codigo: initialData?.codigo ?? "",
        descricao: initialData?.descricao ?? "",
        is_active: initialData?.is_active ?? true,
      });
    }
  }, [form, initialData, open]);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <div className="px-4 pb-4">
          <DrawerHeader>
            <DrawerTitle>
              {initialData ? "Editar grupo" : "Novo grupo de insumo"}
            </DrawerTitle>
          </DrawerHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4 px-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Metais"
                        disabled={readOnly}
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
                      <Input
                        {...field}
                        placeholder="GRUPO_METAL"
                        disabled={readOnly}
                        onChange={(event) =>
                          field.onChange(event.target.value.toUpperCase())
                        }
                      />
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
                        {...field}
                        placeholder="Detalhes sobre o grupo"
                        disabled={readOnly}
                        rows={3}
                        maxLength={300}
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Grupos inativos não aparecem em novos cadastros.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={readOnly}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DrawerFooter className="border-t bg-muted/30">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={readOnly || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Salvar alterações" : "Criar grupo"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
