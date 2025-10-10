import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Team() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role)
        `)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Erro ao carregar equipe');
    } finally {
      setLoading(false);
    }
  }

  function getRoleLabel(roles: any[]): string {
    if (!roles || roles.length === 0) return 'Usuário';
    const role = roles[0].role;
    return role === 'admin' ? 'Admin' : role === 'atendimento' ? 'Atendimento' : 'Produção';
  }

  function getRoleVariant(roles: any[]): 'default' | 'secondary' | 'outline' {
    if (!roles || roles.length === 0) return 'outline';
    const role = roles[0].role;
    return role === 'admin' ? 'default' : 'secondary';
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground mt-1">Gestão de usuários e permissões</p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Convidar Membro
        </Button>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(profile => (
          <Card key={profile.id} className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(profile.full_name || profile.email)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{profile.full_name || 'Sem nome'}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{profile.email}</span>
                </div>

                <div className="mt-3">
                  <Badge variant={getRoleVariant(profile.user_roles)}>
                    {getRoleLabel(profile.user_roles)}
                  </Badge>
                </div>

                {profile.phone && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {profile.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Editar
              </Button>
              <Button variant="ghost" size="sm">
                Ver perfil
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum membro na equipe
        </div>
      )}
    </div>
  );
}
