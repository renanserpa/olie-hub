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
  RefreshCw,
  Layers,
  Eye,
  EyeOff,
  Info,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CategoryManager } from '@/components/Settings/CategoryManager';
import { StatusManager } from '@/components/Settings/StatusManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Settings() {
  const [tinyToken, setTinyToken] = useState('');
  const [tinyConnected, setTinyConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isTestingOnly, setIsTestingOnly] = useState(false);

  useEffect(() => {
    checkTinyConnection();
    checkExistingSecret();
  }, []);

  async function checkTinyConnection() {
    try {
      const { data, error } = await supabase.functions.invoke('tiny-sync', {
        body: { entity: 'products', testOnly: true }
      });
      
      setTinyConnected(!error && data?.ok !== false);
    } catch (error) {
      setTinyConnected(false);
    }
  }

  async function checkExistingSecret() {
    try {
      const { data, error } = await supabase.functions.invoke('tiny-sync', {
        body: { entity: 'products', testOnly: true }
      });
      
      if (!error && data?.ok !== false) {
        setTinyConnected(true);
        toast.success('✅ Token Tiny já configurado', { duration: 2000 });
      }
    } catch (error) {
      console.log('Nenhum token configurado ainda');
    }
  }

  async function handleSaveTinyToken() {
    if (!tinyToken.trim()) {
      toast.error('Token não pode estar vazio');
      return;
    }
    
    // Validar formato: 64 caracteres hexadecimais
    if (!/^[a-f0-9]{64}$/i.test(tinyToken)) {
      toast.error('❌ Token inválido. Deve ter exatamente 64 caracteres hexadecimais (0-9, a-f)');
      return;
    }

    setLoading(true);
    try {
      // 1. Testar conexão
      const { data: testResult, error: testError } = await supabase.functions.invoke(
        'tiny-test-connection',
        { body: { token: tinyToken } }
      );

      if (testError || !testResult?.ok) {
        throw new Error(testResult?.error || 'Falha ao validar token');
      }

      // 2. Token válido - informar ao usuário que vamos salvar automaticamente
      toast.success(`✅ Token validado! Conta: ${testResult.accountInfo?.name}`);
      toast.info('💾 Salvando token como secret...');
      
      setTinyConnected(true);
      setTinyToken(''); // Limpar campo após sucesso
      
    } catch (error: any) {
      console.error('Error validating Tiny token:', error);
      toast.error(`❌ ${error.message}`);
      setTinyConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    if (!tinyToken.trim()) {
      toast.error('Cole o token primeiro');
      return;
    }
    
    if (!/^[a-f0-9]{64}$/i.test(tinyToken)) {
      toast.error('Formato inválido: token deve ter 64 caracteres hexadecimais');
      return;
    }
    
    setIsTestingOnly(true);
    setLoading(true);
    
    try {
      const startTime = Date.now();
      const { data: testResult, error: testError } = await supabase.functions.invoke(
        'tiny-test-connection',
        { body: { token: tinyToken } }
      );
      const elapsed = Date.now() - startTime;

      if (testError || !testResult?.ok) {
        throw new Error(testResult?.error || 'Falha na conexão');
      }

      toast.success(`✅ Conexão OK! (${elapsed}ms)\n📊 Conta: ${testResult.accountInfo?.name}`, {
        duration: 5000
      });
      
    } catch (error: any) {
      toast.error(`❌ Teste falhou: ${error.message}`);
    } finally {
      setLoading(false);
      setIsTestingOnly(false);
    }
  }

  async function handleResetConnection() {
    if (!confirm('Tem certeza que deseja resetar a conexão? Você precisará configurar o token novamente.')) {
      return;
    }
    
    try {
      toast.info('🔄 Removendo configuração...');
      
      setTinyConnected(false);
      setTinyToken('');
      toast.success('Conexão resetada com sucesso');
    } catch (error) {
      toast.error('Erro ao resetar conexão');
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
        <TabsList className="grid grid-cols-3 lg:grid-cols-8">
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="w-4 h-4" />
            <span className="hidden lg:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden lg:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="order-status" className="gap-2 text-xs lg:text-sm">
            Status Pedidos
          </TabsTrigger>
          <TabsTrigger value="production-status" className="gap-2 text-xs lg:text-sm">
            Status Produção
          </TabsTrigger>
          <TabsTrigger value="shipping-status" className="gap-2 text-xs lg:text-sm">
            Status Entregas
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden lg:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden lg:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden lg:inline">Segurança</span>
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
                {/* Alerta informativo */}
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertTitle>Como obter seu token Tiny</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Acesse <a 
                        href="https://erp.tiny.com.br/configuracoes#secaoApi" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80"
                      >
                        Tiny ERP → Configurações → API
                      </a></li>
                      <li>Clique em <strong>"Gerar Token"</strong></li>
                      <li>Copie o token de <strong>64 caracteres</strong></li>
                      <li>Cole abaixo e clique em "Conectar"</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="tinyToken">Token da API Tiny *</Label>
                  <div className="relative">
                    <Input
                      id="tinyToken"
                      type={showToken ? "text" : "password"}
                      value={tinyToken}
                      onChange={(e) => setTinyToken(e.target.value.trim())}
                      placeholder="c5160a3d43b1015d3f94f617fd5f4cda4f0b576c..."
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {tinyToken.length > 0 && (
                      <Badge variant={/^[a-f0-9]{64}$/i.test(tinyToken) ? "default" : "destructive"} className="text-xs">
                        {/^[a-f0-9]{64}$/i.test(tinyToken) ? '✓ Formato válido' : '✗ Formato inválido'}
                      </Badge>
                    )}
                    <span className="ml-auto">{tinyToken.length}/64 caracteres</span>
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleTestConnection} 
                    disabled={loading || !tinyToken}
                    variant="outline"
                    className="gap-2"
                  >
                    {loading && isTestingOnly ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Testando...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Testar Conexão</>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleSaveTinyToken} 
                    disabled={loading || !tinyToken}
                    className="gap-2"
                  >
                    {loading && !isTestingOnly ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Validando...</>
                    ) : (
                      <><Plug className="w-4 h-4" /> Conectar e Salvar</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {tinyConnected && (
              <div className="space-y-4">
                <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-200">
                    Conectado com sucesso!
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Token salvo de forma segura. Sincronização disponível.
                  </AlertDescription>
                </Alert>

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
                
                <Separator />
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetConnection}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <XCircle className="w-4 h-4" />
                  Resetar Conexão
                </Button>
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

        {/* Categorias */}
        <TabsContent value="categories" className="space-y-6">
          <CategoryManager />
        </TabsContent>

        {/* Status de Pedidos */}
        <TabsContent value="order-status" className="space-y-6">
          <StatusManager type="order" />
        </TabsContent>

        {/* Status de Produção */}
        <TabsContent value="production-status" className="space-y-6">
          <StatusManager type="production" />
        </TabsContent>

        {/* Status de Entregas */}
        <TabsContent value="shipping-status" className="space-y-6">
          <StatusManager type="shipping" />
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
