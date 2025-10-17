import type { PostgrestError } from '@supabase/supabase-js';

type SupabaseErrorLike = Pick<PostgrestError, 'code' | 'message'> & { status?: number | string };

export function isRelationMissing(error: SupabaseErrorLike | null | undefined): boolean {
  if (!error) return false;
  if (error.code === '42P01') return true;
  return /relation .* does not exist/i.test(error.message);
}

export function isRlsError(error: SupabaseErrorLike | null | undefined): boolean {
  if (!error) return false;
  return !!error.message && /row-level security/i.test(error.message);
}

export function isMissingTable(error: SupabaseErrorLike | null | undefined): boolean {
  return isRelationMissing(error);
}

export function isPermission(error: SupabaseErrorLike | null | undefined): boolean {
  if (!error) return false;
  return ['42501', 'PGRST301', '401', '403'].includes(error.code ?? String(error.status ?? ''));
}

export function humanize(error: SupabaseErrorLike | null | undefined): string {
  if (!error) return 'Erro desconhecido';

  if (isRelationMissing(error)) {
    return 'Tabela não encontrada. Aplique as migrations pendentes no Supabase.';
  }

  if (isPermission(error)) {
    return 'Você não tem permissão para executar esta operação. Entre como administrador.';
  }

  switch (error.code) {
    case 'PGRST116':
      return 'Sessão expirada. Faça login novamente.';
    case 'PGRST302':
      return 'Requisição inválida. Verifique os filtros utilizados.';
    default:
      return error.message || 'Ocorreu um erro ao comunicar com o Supabase.';
  }
}
