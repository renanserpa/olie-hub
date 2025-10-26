import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

const KEY = ['system_settings'];

export function useSystemSettings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .select('key, value, category, is_active');
      
      if (error) throw error;
      
      // Converter array em objeto key-value
      const map: Record<string, any> = {};
      (data || []).forEach((r: any) => {
        map[r.key] = r.value;
      });
      
      return map;
    },
  });

  const upsert = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const rows = Object.entries(patch).map(([key, value]) => ({
        key,
        value,
        is_active: true,
        updated_at: new Date().toISOString(),
      }));
      
      const { error } = await supabase
        .from('system_settings' as any)
        .upsert(rows, { onConflict: 'key' });
      
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return { 
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    upsert: upsert.mutateAsync,
    isUpserting: upsert.isPending,
  };
}
