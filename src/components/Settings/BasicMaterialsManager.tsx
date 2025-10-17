import { useEffect, useMemo, useState } from 'react';
import { TableManager } from '@/components/Settings/TableManager';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EditDrawer } from '@/components/Settings/EditDrawer';
import { supabase } from '@/integrations/supabase/client';
import { humanize, isMissingTable } from '@/lib/supabase/errors';
import { TableNotFoundCallout } from '@/components/common/TableNotFoundCallout';
import { Loader2 } from 'lucide-react';
import type { ConfigSupplyGroup } from '@/lib/supabase/types-override';

type BasicMaterial = {
  id: string;
  name: string;
  codigo: string;
  unit: string;
  default_cost: number | null;
  supply_group_id: string | null;
  is_active: boolean;
  updated_at: string;
};

type SupplyGroupOption = {
  value: string;
  label: string;
};

interface BasicMaterialsManagerProps {
  readOnly?: boolean;
  supplyGroupsVersion?: number;
}

export function BasicMaterialsManager({ readOnly = false, supplyGroupsVersion = 0 }: BasicMaterialsManagerProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BasicMaterial | null>(null);
  const [groupOptions, setGroupOptions] = useState<SupplyGroupOption[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupError, setGroupError] = useState<string | 'MISSING_TABLE' | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 2,
      }),
    [],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    [],
  );

  const groupsById = useMemo(() => {
    const map: Record<string, string> = {};
    groupOptions.forEach((option) => {
      if (option.value) {
        map[option.value] = option.label;
      }
    });
    return map;
  }, [groupOptions]);

  useEffect(() => {
    async function loadGroups() {
      setLoadingGroups(true);
      setGroupError(null);

      try {
        const { data, error } = await supabase
          .from('config_supply_groups' as any)
          .select('id, name, is_active')
          .order('name');

        if (error) {
          if (isMissingTable(error)) {
            setGroupError('MISSING_TABLE');
          } else {
            setGroupError(humanize(error));
          }
          setGroupOptions([]);
        } else {
          const typedData = (data || []) as unknown as ConfigSupplyGroup[];
          const options = typedData
            .filter((group) => group.is_active !== false)
            .map((group) => ({ value: group.id, label: group.name }));
          setGroupOptions(options);
        }
      } catch (err) {
        setGroupError('Erro ao carregar grupos de suprimento');
        setGroupOptions([]);
      }

      setLoadingGroups(false);
    }

    loadGroups();
  }, [supplyGroupsVersion]);

  const columns = useMemo(
    () => [
      { key: 'codigo', label: 'Código' },
      { key: 'name', label: 'Nome' },
      {
        key: 'unit',
        label: 'Unidade',
        render: (item: BasicMaterial) => item.unit?.toUpperCase() ?? '—',
      },
      {
        key: 'default_cost',
        label: 'Custo padrão',
        render: (item: BasicMaterial) =>
          currencyFormatter.format(Number(item.default_cost ?? 0)),
      },
      {
        key: 'supply_group_id',
        label: 'Grupo',
        render: (item: BasicMaterial) => groupsById[item.supply_group_id ?? ''] || 'Sem grupo',
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (item: BasicMaterial) =>
          item.is_active ? (
            <Badge variant="secondary">Ativo</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inativo
            </Badge>
          ),
      },
      {
        key: 'updated_at',
        label: 'Atualizado em',
        render: (item: BasicMaterial) =>
          item.updated_at ? dateFormatter.format(new Date(item.updated_at)) : '—',
      },
    ],
    [currencyFormatter, dateFormatter, groupsById],
  );

  const filters = useMemo(() => {
    const groupFilterOptions = [
      { label: 'Todos', value: 'all', queryValue: undefined },
      { label: 'Sem grupo', value: 'none', queryValue: null },
      ...groupOptions.map((option) => ({
        label: option.label,
        value: option.value,
        queryValue: option.value,
      })),
    ];

    return [
      {
        type: 'search' as const,
        fields: ['name', 'codigo'],
        placeholder: 'Buscar por nome ou código',
      },
      {
        type: 'select' as const,
        label: 'Status',
        field: 'is_active',
        defaultValue: 'true',
        options: [
          { label: 'Ativos', value: 'true', queryValue: true },
          { label: 'Inativos', value: 'false', queryValue: false },
          { label: 'Todos', value: 'all', queryValue: undefined },
        ],
      },
      {
        type: 'select' as const,
        label: 'Grupo',
        field: 'supply_group_id',
        defaultValue: 'all',
        options: groupFilterOptions,
      },
    ];
  }, [groupOptions]);

  const handleCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const handleEdit = (item: BasicMaterial) => {
    setEditing(item);
    setDrawerOpen(true);
  };

  const handleSaved = () => {
    setReloadKey((value) => value + 1);
  };

  if (groupError === 'MISSING_TABLE') {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTitle>Materiais básicos</AlertTitle>
          <AlertDescription>
            Esta seção gerencia <strong>modelos de materiais</strong> (unidade, custo padrão, grupo). O estoque real é
            cadastrado em <strong>Estoque → Insumos</strong>.
          </AlertDescription>
        </Alert>
        <TableNotFoundCallout 
          tableName="config_supply_groups" 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  const supplyGroupOptionsForForm: SupplyGroupOption[] = useMemo(() => {
    const options = groupOptions.map((option) => ({ value: option.value, label: option.label }));

    if (editing?.supply_group_id) {
      const alreadyIncluded = options.some((option) => option.value === editing.supply_group_id);
      if (!alreadyIncluded) {
        options.push({
          value: editing.supply_group_id,
          label: 'Grupo atual (inativo)',
        });
      }
    }

    return options;
  }, [editing?.supply_group_id, groupOptions]);

  const initialDrawerData = useMemo(() => {
    if (!editing) return undefined;
    return {
      id: editing.id,
      name: editing.name ?? '',
      codigo: editing.codigo ?? '',
      unit: (editing.unit as 'pc' | 'm' | 'cm' | 'mm' | 'g' | 'kg' | 'ml' | 'l') ?? 'pc',
      default_cost: Number(editing.default_cost ?? 0),
      supply_group_id: editing.supply_group_id,
      is_active: editing.is_active,
    };
  }, [editing]);

  const handleDrawerOpenChange = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setEditing(null);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Materiais básicos</AlertTitle>
        <AlertDescription>
          Esta seção gerencia <strong>modelos de materiais</strong> (unidade, custo padrão, grupo). O estoque real é
          cadastrado em <strong>Estoque → Insumos</strong>.
        </AlertDescription>
      </Alert>

      {groupError && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar os grupos de insumo</AlertTitle>
          <AlertDescription>{groupError}</AlertDescription>
        </Alert>
      )}

      {loadingGroups && !groupError && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando grupos de insumo...
        </div>
      )}

      <TableManager<BasicMaterial>
        title="Materiais básicos (templates)"
        table="config_basic_materials"
        columns={columns}
        filters={filters}
        onCreate={handleCreate}
        onEdit={handleEdit}
        readOnly={readOnly}
        emptyHelpText="Nenhum material cadastrado. Clique em 'Novo material' para começar."
        reloadKey={reloadKey}
        createLabel="Novo material"
      />

      <EditDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        initialData={initialDrawerData}
        onSaved={handleSaved}
        readOnly={readOnly}
        supplyGroups={supplyGroupOptionsForForm}
      />
    </div>
  );
}
