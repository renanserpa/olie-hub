import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type FilterValue = string | number | boolean | null | undefined | string[] | number[];

interface ListConfigsOptions {
  search?: string;
  searchColumns?: string[];
  filters?: Record<string, FilterValue>;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
}

function handleError(context: string, error: PostgrestError | null) {
  if (!error) return null;
  console.error(`${context}:`, error);
  return error.message;
}

export async function listConfigs<T = Record<string, unknown>>(
  table: string,
  options: ListConfigsOptions = {},
): Promise<{ data: T[]; error: string | null }> {
  const {
    search,
    searchColumns = ['name', 'codigo'],
    filters = {},
    order = { column: 'updated_at', ascending: false },
    limit,
  } = options;

  let query = supabase.from(table as any).select('*');

  if (search && search.trim().length > 0 && searchColumns.length > 0) {
    const normalized = search.trim();
    const expressions = searchColumns.map((column) => `${column}.ilike.%${normalized}%`).join(',');
    query = query.or(expressions);
  }

  Object.entries(filters).forEach(([column, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        query = query.in(column, value as any);
      }
    } else {
      query = query.eq(column, value as any);
    }
  });

  if (order?.column) {
    query = query.order(order.column, { ascending: order.ascending ?? false });
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: handleError(`Erro ao listar ${table}`, error) };
  }

  return { data: (data as T[]) ?? [], error: null };
}

export async function createConfig<T = Record<string, unknown>>(
  table: string,
  payload: Partial<T>,
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.from(table as any).insert(payload as any).select().single();

  if (error) {
    return { data: null, error: handleError(`Erro ao criar registro em ${table}`, error) };
  }

  return { data: (data as T) ?? null, error: null };
}

export async function updateConfig<T = Record<string, unknown>>(
  table: string,
  id: string,
  payload: Partial<T>,
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase
    .from(table as any)
    .update(payload as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: handleError(`Erro ao atualizar registro em ${table}`, error) };
  }

  return { data: (data as T) ?? null, error: null };
}
