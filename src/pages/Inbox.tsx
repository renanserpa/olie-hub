import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Instagram, Send, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { InboxConfigurator } from '@/components/Inbox/InboxConfigurator';

type Channel = 'wa' | 'ig';

interface Message {
  id: string;
  channel: string;
  content: string;
  sender_id: string | null;
  created_at: string;
  mentions: string[];
  attachments: string[];
}

const CHANNEL_LABELS = {
  wa: 'WhatsApp',
  ig: 'Instagram',
};

export default function Inbox() {
  const [activeChannel, setActiveChannel] = useState<Channel>('wa');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [waEnabled, setWaEnabled] = useState(false);
  const [igEnabled, setIgEnabled] = useState(false);

  useEffect(() => {
    fetchMessages();
    checkIntegrations();
  }, [activeChannel]);

  const checkIntegrations = () => {
    // Check if WA/IG tokens are configured (placeholder logic)
    const waToken = localStorage.getItem('WA_TOKEN');
    const igToken = localStorage.getItem('IG_APP_TOKEN');
    setWaEnabled(!!waToken);
    setIgEnabled(!!igToken);
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel', activeChannel)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'all') return true;
    // Add more filter logic later (priority, assigned, bot, etc.)
    return true;
  });

  const isChannelEnabled = activeChannel === 'wa' ? waEnabled : igEnabled;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inbox por Canal</h1>
          <p className="text-muted-foreground">
            Atendimento integrado WhatsApp e Instagram
          </p>
        </div>
        <div className="flex gap-2">
          <InboxConfigurator />
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeChannel} onValueChange={(v) => setActiveChannel(v as Channel)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wa">
            <MessageSquare className="w-4 h-4 mr-2" />
            WhatsApp
            {!waEnabled && <Badge variant="outline" className="ml-2 text-xs">Inativo</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ig">
            <Instagram className="w-4 h-4 mr-2" />
            Instagram
            {!igEnabled && <Badge variant="outline" className="ml-2 text-xs">Inativo</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wa" className="space-y-4">
          {!waEnabled && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="text-sm">WhatsApp não configurado</CardTitle>
                <CardDescription>
                  Configure o token do WhatsApp Business API nas configurações para ativar esta integração.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled>
                  Ativar WhatsApp (requer WA_TOKEN)
                </Button>
              </CardContent>
            </Card>
          )}
          <InboxContent
            messages={filteredMessages}
            loading={loading}
            enabled={waEnabled}
            channel="wa"
          />
        </TabsContent>

        <TabsContent value="ig" className="space-y-4">
          {!igEnabled && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="text-sm">Instagram não configurado</CardTitle>
                <CardDescription>
                  Configure o token do Instagram Graph API nas configurações para ativar esta integração.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled>
                  Ativar Instagram (requer IG_APP_TOKEN)
                </Button>
              </CardContent>
            </Card>
          )}
          <InboxContent
            messages={filteredMessages}
            loading={loading}
            enabled={igEnabled}
            channel="ig"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface InboxContentProps {
  messages: Message[];
  loading: boolean;
  enabled: boolean;
  channel: Channel;
}

function InboxContent({ messages, loading, enabled, channel }: InboxContentProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando mensagens...</p>
        </CardContent>
      </Card>
    );
  }

  if (!enabled) {
    return null;
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Mensagens</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">Meus</Badge>
            <Badge variant="outline">Aguardando Cliente</Badge>
            <Badge variant="outline">Prioridade</Badge>
            <Badge variant="outline">Bot</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {channel === 'wa' ? '📱' : '📷'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {msg.sender_id ? 'Agente' : 'Cliente'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                  {msg.attachments?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {msg.attachments.length} anexo(s)
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 flex gap-2">
          <Input placeholder="Digite sua mensagem..." disabled />
          <Button size="icon" disabled>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Resposta pelo canal desabilitada até chaves estarem válidas
        </p>
      </CardContent>
    </Card>
  );
}
