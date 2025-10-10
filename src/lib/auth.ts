import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'atendimento' | 'producao';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  roles: UserRole[];
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Buscar roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) throw rolesError;

    return {
      ...profile,
      roles: roles?.map(r => r.role as UserRole) || [],
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: userId, _role: role });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}
