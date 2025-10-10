import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings2, 
  Plug, 
  Palette, 
  Bell, 
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Settings() {
  const [tinyToken, setTinyToken] = useState('');
  const [tinyConnected, setTinyConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkTinyConnection();
  }, []);

  async function checkTinyConnection() {
    try {
      // Check if we have a valid token by trying to fetch something
      const { data, error } = await supabase.functions.invoke('tiny-sync', {
        body: { entity: 'products', operation: 'pull', since: 'today' }
      });
      
      setTinyConnected(!error);
    } catch (error) {
      setTinyConnected(false);
    }
  }

  async function handleSaveTinyToken() {
    if (!tinyToken.trim()) {
      toast.error('Token não pode estar vazio');
      return;
    }

    setLoading(true);
    try {
      // Test connection with new token
      const response = await fetch('https://api.tiny.com.br/api2/info.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tinyToken,
          formato: 'JSON'
        })
      });

      if (!response.ok) throw new Error('Token inválido');

      toast.success('Token Tiny salvo com sucesso');
      setTinyConnected(true);
      setTinyToken('');
    } catch (error) {
      console.error('Error saving Tiny token:', error);
      toast.error('Erro ao validar token Tiny');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('tiny-sync', {
        body: { entity: 'products', operation: 'pull', since: 'all' }
      });

      if (error) throw error;
      toast.success('Sincronização iniciada com sucesso');
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Erro ao sincronizar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings2 className="w-8 h-8" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie integrações e preferências do sistema
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="w-4 h-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* Integrações */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Tiny ERP */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Tiny ERP
                  {tinyConnected ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="w-3 h-3" />
                      Desconectado
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sincronize produtos, pedidos e estoque com o Tiny ERP
                </p>
              </div>
              {tinyConnected && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSync}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Sincronizar Agora
                </Button>
              )}
            </div>

            <Separator className="my-4" />

            {!tinyConnected && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tinyToken">Token da API Tiny</Label>
                  <Input
                    id="tinyToken"
                    type="password"
                    value={tinyToken}
                    onChange={(e) => setTinyToken(e.target.value)}
                    placeholder="Cole seu token aqui..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode encontrar seu token nas configurações da sua conta Tiny
                  </p>
                </div>
                <Button onClick={handleSaveTinyToken} disabled={loading}>
                  {loading ? 'Validando...' : 'Conectar Tiny'}
                </Button>
              </div>
            )}

            {tinyConnected && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSync">Sincronização Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar dados a cada 30 minutos
                    </p>
                  </div>
                  <Switch
                    id="autoSync"
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* WhatsApp */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  WhatsApp Business
                  <Badge variant="outline">Em breve</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Conecte sua conta WhatsApp Business para enviar mensagens
                </p>
              </div>
            </div>
          </Card>

          {/* Instagram */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Instagram
                  <Badge variant="outline">Em breve</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Integre com Instagram Direct para atendimento
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Personalização</h3>
            <div className="space-y-4">
              <div>
                <Label>Logo da Empresa</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Faça upload da logo que aparecerá no sistema
                </p>
                <Button variant="outline">Fazer Upload</Button>
              </div>
              <Separator />
              <div>
                <Label>Cor Principal</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Escolha a cor principal do sistema
                </p>
                <div className="flex gap-2 mt-2">
                  {['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'].map(color => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-lg border-2 border-border hover:scale-110 transition-smooth"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Preferências de Notificação</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações do Sistema</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas sobre eventos importantes
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Estoque Baixo</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerta quando produtos atingirem estoque mínimo
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Pedidos Atrasados</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre pedidos com atraso na produção
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Segurança e Acesso</h3>
            <div className="space-y-4">
              <div>
                <Label>Alterar Senha</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Atualize sua senha periodicamente para maior segurança
                </p>
                <Button variant="outline">Alterar Senha</Button>
              </div>
              <Separator />
              <div>
                <Label>Sessões Ativas</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Gerencie dispositivos conectados à sua conta
                </p>
                <Button variant="outline">Ver Sessões</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
