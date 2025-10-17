import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { humanize } from '@/lib/supabase/errors';

interface AdminAccessState {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

let cachedRoles: string[] | null = null;
let cachedError: string | null = null;
let inflightPromise: Promise<string[] | null> | null = null;
let subscribedToAuthChanges = false;

function ensureAuthSubscription() {
  if (subscribedToAuthChanges) return;
  supabase.auth.onAuthStateChange(() => {
    cachedRoles = null;
    cachedError = null;
  });
  subscribedToAuthChanges = true;
}

async function loadRoles(): Promise<string[] | null> {
  ensureAuthSubscription();

  if (cachedRoles) {
    return cachedRoles;
  }

  if (inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    const { data, error } = await supabase.rpc('whoami' as any);

    if (error) {
      cachedError = humanize(error);
      cachedRoles = null;
      return null;
    }

    const roles = Array.isArray((data as any)?.roles) ? ((data as any).roles as string[]) : [];
    cachedRoles = roles;
    cachedError = null;
    return roles;
  })();

  const roles = await inflightPromise;
  inflightPromise = null;
  return roles;
}

export function useAdminAccess(): AdminAccessState {
  const [state, setState] = useState<AdminAccessState>({
    isAdmin: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function resolveRoles() {
      try {
        const roles = await loadRoles();
        if (!mounted) return;

        setState({
          isAdmin: Boolean(roles?.includes('admin')),
          loading: false,
          error: cachedError,
        });
      } catch (err) {
        if (!mounted) return;

        const message = err instanceof Error ? err.message : 'Não foi possível verificar permissões';
        cachedError = message;
        cachedRoles = null;
        setState({
          isAdmin: false,
          loading: false,
          error: message,
        });
      }
    }

    resolveRoles();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
