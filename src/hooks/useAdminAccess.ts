import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAccessState {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export function useAdminAccess(): AdminAccessState {
  const [state, setState] = useState<AdminAccessState>({
    isAdmin: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (!user) {
          setState({ isAdmin: false, loading: false, error: 'Usuário não autenticado' });
          return;
        }

        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (!isMounted) return;

        if (error) {
          console.error('Erro ao verificar papel de admin:', error);
          setState({ isAdmin: false, loading: false, error: error.message });
          return;
        }

        setState({ isAdmin: Boolean(data), loading: false, error: null });
      } catch (error: any) {
        console.error('Erro inesperado ao verificar papel de admin:', error);
        if (!isMounted) return;
        setState({
          isAdmin: false,
          loading: false,
          error: error?.message || 'Não foi possível verificar permissões',
        });
      }
    }

    checkAdminAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
