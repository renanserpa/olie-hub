import { useState } from 'react';
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
  Info,
  Upload,
  Download,
  Truck,
  Layers
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CategoryManager } from '@/components/Settings/CategoryManager';
import { StatusManager } from '@/components/Settings/StatusManager';
import { ColorLibrary } from '@/components/Settings/ColorLibrary';
import { ImportDialog } from '@/components/ImportExport/ImportDialog';
import { ExportDialog } from '@/components/ImportExport/ExportDialog';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings2 className="w-8 h-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie integrações e preferências do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-7 gap-1">
          <TabsTrigger value="integrations" className="gap-2 text-xs lg:text-sm">
            <Plug className="w-4 h-4" />
            <span className="hidden lg:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="catalogs" className="gap-2 text-xs lg:text-sm">
            <Palette className="w-4 h-4" />
            <span className="hidden lg:inline">Catálogos</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="gap-2 text-xs lg:text-sm">
            <Layers className="w-4 h-4" />
            <span className="hidden lg:inline">Materiais</span>
          </TabsTrigger>
          <TabsTrigger value="logistics" className="gap-2 text-xs lg:text-sm">
            <Truck className="w-4 h-4" />
            <span className="hidden lg:inline">Logística</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2 text-xs lg:text-sm">
            <Settings2 className="w-4 h-4" />
            <span className="hidden lg:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 text-xs lg:text-sm">
            <Palette className="w-4 h-4" />
            <span className="hidden lg:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs lg:text-sm">
            <Shield className="w-4 h-4" />
            <span className="hidden lg:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        {/* A) Integrações */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pagamentos</h3>
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Integração com Mercado Pago/Stripe em breve
              </AlertDescription>
            </Alert>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Envios</h3>
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Integração com Correios/Melhor Envio em breve
              </AlertDescription>
            </Alert>
          </Card>
          
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

        {/* B) Catálogos & Personalização */}
        <TabsContent value="catalogs" className="space-y-6">
          <Tabs defaultValue="categories">
            <TabsList className="grid grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="fabric">Cores Tecido</TabsTrigger>
              <TabsTrigger value="zipper">Cores Zíper</TabsTrigger>
              <TabsTrigger value="lining">Cores Forro</TabsTrigger>
              <TabsTrigger value="bias">Cores Viés</TabsTrigger>
            </TabsList>
            
            <TabsContent value="categories" className="mt-6">
              <CategoryManager />
            </TabsContent>
            
            <TabsContent value="fabric" className="mt-6">
              <ColorLibrary type="fabric" />
            </TabsContent>
            
            <TabsContent value="zipper" className="mt-6">
              <ColorLibrary type="zipper" />
            </TabsContent>
            
            <TabsContent value="lining" className="mt-6">
              <ColorLibrary type="lining" />
            </TabsContent>
            
            <TabsContent value="bias" className="mt-6">
              <ColorLibrary type="bias" />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* C) Materiais (templates - NÃO Estoque) */}
        <TabsContent value="materials" className="space-y-6">
          <Alert className="mb-6">
            <Info className="w-4 h-4" />
            <AlertDescription>
              Esta seção gerencia <strong>modelos</strong> de materiais (unidade, custo padrão, grupo). 
              O <strong>estoque real</strong> é cadastrado em <strong>Estoque → Insumos</strong>.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong>Migrations pendentes.</strong> Aplique <code className="font-mono">db/migrations/*.sql</code> no Supabase <strong>qrfvdoecpmcnlpxklcsu</strong>.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* D) Logística & Operação */}
        <TabsContent value="logistics" className="space-y-6">
          <Tabs defaultValue="statuses">
            <TabsList>
              <TabsTrigger value="statuses">Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="statuses" className="mt-6">
              <Tabs defaultValue="order-status">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="order-status">Pedidos</TabsTrigger>
                  <TabsTrigger value="production-status">Produção</TabsTrigger>
                  <TabsTrigger value="shipping-status">Entregas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="order-status" className="mt-6">
                  <StatusManager type="order" />
                </TabsContent>
                
                <TabsContent value="production-status" className="mt-6">
                  <StatusManager type="production" />
                </TabsContent>
                
                <TabsContent value="shipping-status" className="mt-6">
                  <StatusManager type="shipping" />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* E) Sistema (preferências gerais) */}
        <TabsContent value="system" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Preferências Gerais</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Moeda</Label>
                <Input value="BRL" disabled />
              </div>
              
              <div>
                <Label>Timezone</Label>
                <Input value="America/Sao_Paulo" disabled />
              </div>
              
              <div>
                <Label>Prefixo de Pedido</Label>
                <Input defaultValue="OLIE-" />
              </div>
              
              <div>
                <Label>Lead Time de Produção (dias)</Label>
                <Input type="number" defaultValue={7} />
              </div>
              
              <div>
                <Label>SLA Atendimento (minutos)</Label>
                <Input type="number" defaultValue={30} />
              </div>
            </div>
            
            <Button className="mt-6">Salvar Preferências</Button>
          </Card>
        </TabsContent>

        {/* F) Aparência */}
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

        {/* G) Segurança */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Diagnóstico do Sistema</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Verificar integridade das configurações e tabelas do banco de dados
            </p>
            <Button asChild variant="outline">
              <a href="/admin/diagnostics/configs">
                <Shield className="w-4 h-4 mr-2" />
                Acessar Diagnóstico
              </a>
            </Button>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Notificações</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações sobre pedidos e atividades
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
            </div>
          </Card>
          
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

      <ImportDialog 
        open={importOpen} 
        onOpenChange={setImportOpen}
        onSuccess={() => {}}
      />
      <ExportDialog 
        open={exportOpen} 
        onOpenChange={setExportOpen}
      />
    </div>
  );
}
