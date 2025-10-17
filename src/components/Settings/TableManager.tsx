import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Pencil, Plus, RefreshCw, Search } from 'lucide-react';
import { isPermission, isRelationMissing, humanize } from '@/lib/supabase/errors';

const PAGE_SIZE = 20;

type ColumnConfig<T> = {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
};

type SearchFilterConfig = {
  type: 'search';
  placeholder?: string;
  fields: string[];
};

type SelectFilterOption = {
  label: string;
  value: string;
  queryValue?: string | number | boolean | null;
};

type SelectFilterConfig = {
  type: 'select';
  label: string;
  field: string;
  options: SelectFilterOption[];
  defaultValue?: string;
};

type FilterConfig = SearchFilterConfig | SelectFilterConfig;

export type TableManagerProps<T extends { id?: string | number } = any> = {
  title: string;
  table: string;
  columns: ColumnConfig<T>[];
  filters?: FilterConfig[];
  onCreate?: () => void;
  onEdit?: (item: T) => void;
  readOnly?: boolean;
  emptyHelpText?: string;
  reloadKey?: number;
  helpText?: ReactNode;
  createLabel?: string;
};

function readDebugFlag(): boolean {
  const direct = import.meta.env.NEXT_PUBLIC_DEBUG_SUPABASE;
  if (direct) {
    return direct === 'true';
  }

  if (typeof window !== 'undefined') {
    const w = window as any;
    const fromWindow = w.ENV?.NEXT_PUBLIC_DEBUG_SUPABASE;
    if (fromWindow) {
      return fromWindow === 'true';
    }
  }

  return false;
}

export function TableManager<T extends { id?: string | number } = any>({
  title,
  table,
  columns,
  filters,
  onCreate,
  onEdit,
  readOnly = false,
  emptyHelpText,
  reloadKey,
  helpText,
  createLabel,
}: TableManagerProps<T>) {
  const debugSupabase = useMemo(() => readDebugFlag(), []);

  const searchFilter = useMemo(() => filters?.find((filter): filter is SearchFilterConfig => filter.type === 'search'), [
    filters,
  ]);
  const selectFilters = useMemo(
    () => filters?.filter((filter): filter is SelectFilterConfig => filter.type === 'select') ?? [],
    [filters],
  );

  const initialSelectValues = useMemo(() => {
    const defaults: Record<string, string> = {};
    selectFilters.forEach((filter) => {
      const defaultOption = filter.defaultValue ?? filter.options[0]?.value ?? 'all';
      defaults[filter.field] = defaultOption;
    });
    return defaults;
  }, [selectFilters]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectValues, setSelectValues] = useState<Record<string, string>>(initialSelectValues);
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSelectValues(initialSelectValues);
  }, [initialSelectValues]);

  useEffect(() => {
    setPage(1);
  }, [reloadKey]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table as any).select('*', { count: 'exact' });

      if (searchFilter && searchTerm.trim().length > 0) {
        const sanitized = searchTerm.trim();
        const orFilter = searchFilter.fields.map((field) => `${field}.ilike.%${sanitized}%`).join(',');
        query = query.or(orFilter);
      }

      selectFilters.forEach((filter) => {
        const currentValue = selectValues[filter.field] ?? filter.defaultValue;
        if (!currentValue) return;

        const option = filter.options.find((opt) => opt.value === currentValue);
        const queryValue = option?.queryValue ?? option?.value;

        if (queryValue === undefined || queryValue === 'all') {
          return;
        }

        if (queryValue === null) {
          query = query.is(filter.field, null);
          return;
        }

        query = query.eq(filter.field, queryValue as any);
      });

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await query.order('updated_at', { ascending: false }).range(from, to);

      if (error) {
        if (debugSupabase) {
          console.debug('[TableManager] Supabase error', { table, error });
        }
        setError(error);
        setData([]);
        setTotalCount(0);
      } else {
        setData(((data ?? []) as unknown as T[]) ?? []);
        setTotalCount(count ?? 0);
      }
    } catch (err) {
      if (debugSupabase) {
        console.debug('[TableManager] Unexpected error', err);
      }
      setError({
        code: 'unexpected',
        details: '',
        hint: '',
        message: err instanceof Error ? err.message : String(err),
        name: 'UnexpectedError',
      } as any);
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debugSupabase, page, searchFilter, searchTerm, selectFilters, selectValues, table]);

  useEffect(() => {
    fetchData();
  }, [fetchData, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleRetry = () => {
    fetchData();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleSelectChange = (field: string, value: string) => {
    setSelectValues((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleNextPage = () => {
    setPage((current) => Math.min(current + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setPage((current) => Math.max(current - 1, 1));
  };

  const renderFilters = () => {
    if (!searchFilter && selectFilters.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap items-center gap-3">
        {searchFilter && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchFilter.placeholder ?? 'Buscar...'}
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 w-64"
            />
          </div>
        )}

        {selectFilters.map((filter) => (
          <div key={filter.field} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filter.label}</span>
            <Select
              value={selectValues[filter.field] ?? filter.defaultValue ?? filter.options[0]?.value}
              onValueChange={(value) => handleSelectChange(filter.field, value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    );
  };

  const renderError = () => {
    if (!error) return null;

    if (isRelationMissing(error)) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Migrations pendentes</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>
              Não encontramos a tabela solicitada (<code className="font-mono">{table}</code>). Aplique as migrations em
              <strong> db/migrations</strong> e tente novamente.
            </span>
            <Button variant="outline" onClick={handleRetry} className="w-fit">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (isPermission(error)) {
      return (
        <Alert variant="default" className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertTitle>Sem permissão para editar</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>
              O Supabase retornou uma restrição de acesso (RLS). Entre com uma conta de administrador para realizar alterações.
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRetry} className="w-fit">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
              <Button variant="outline" disabled className="w-fit">
                <Lock className="mr-2 h-4 w-4" />
                Modo leitura ativo
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar dados</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{humanize(error)}</span>
          <Button variant="outline" onClick={handleRetry} className="w-fit">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando registros...
        </div>
      );
    }

    if (error) {
      return renderError();
    }

    if (data.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground">
          {emptyHelpText ?? 'Nenhum registro encontrado.'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
              {onEdit && <TableHead className="w-20 text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => {
              const rowKey = (item?.id ?? index) as React.Key;
              return (
                <TableRow key={rowKey}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className={column.className}>
                      {column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key as string] ?? '—')}
                    </TableCell>
                  ))}
                  {onEdit && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(item)}
                        disabled={readOnly}
                      >
                        {readOnly ? <Lock className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        <span className="sr-only">Editar</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    handlePreviousPage();
                  }}
                  aria-disabled={page === 1}
                  className={page === 1 ? 'pointer-events-none opacity-50' : undefined}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    href="#"
                    isActive={page === index + 1}
                    onClick={(event) => {
                      event.preventDefault();
                      setPage(index + 1);
                    }}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    handleNextPage();
                  }}
                  aria-disabled={page === totalPages}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  };

  const createButtonLabel = onCreate ? (readOnly ? 'Somente leitura' : createLabel ?? 'Novo registro') : null;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {readOnly && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Somente leitura
              </Badge>
            )}
          </div>
          {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
        </div>
        {onCreate && (
          <Button onClick={onCreate} disabled={readOnly}>
            {readOnly ? <Lock className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {createButtonLabel}
          </Button>
        )}
      </div>

      {renderFilters()}

      {renderTable()}
    </Card>
  );
}
