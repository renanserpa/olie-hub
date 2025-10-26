import { useSystemSettings } from '@/lib/settings/useSystemSettings';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function SystemSettingsManager() {
  const { data, isLoading, upsert, isUpserting } = useSystemSettings();
  const { isAdmin } = useAdminAccess();

  // Estados locais para formulário
  const [currency, setCurrency] = useState('BRL');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [orderPrefix, setOrderPrefix] = useState('OLI-');
  const [productionDays, setProductionDays] = useState(7);
  const [slaMinutes, setSlaMinutes] = useState(120);

  // Hidratar estados quando data carregar
  useEffect(() => {
    if (data) {
      setCurrency(data.currency?.code || 'BRL');
      setTimezone(data.timezone?.iana || 'America/Sao_Paulo');
      setOrderPrefix(data.order_prefix?.prefix || 'OLI-');
      setProductionDays(data.lead_times?.production_days || 7);
      setSlaMinutes(data.lead_times?.sla_minutes || 120);
    }
  }, [data]);

  const disabled = !isAdmin || isUpserting;

  async function handleSave() {
    try {
      await upsert({
        currency: { code: currency, symbol: currency === 'BRL' ? 'R$' : '' },
        timezone: { iana: timezone },
        order_prefix: { prefix: orderPrefix },
        lead_times: { production_days: productionDays, sla_minutes: slaMinutes },
      });
      toast.success('Preferências salvas com sucesso!');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar preferências.');
    }
  }

  if (isLoading) {
    return <div className="p-6">Carregando preferências...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências Gerais do Sistema</CardTitle>
        <CardDescription>
          Configure moeda, timezone, prefixos e lead times
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAdmin && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Você não possui permissões de administrador. As preferências estão em modo somente leitura.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="currency">Moeda (código)</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={disabled}
              placeholder="BRL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone (IANA)</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={disabled}
              placeholder="America/Sao_Paulo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderPrefix">Prefixo de Pedido</Label>
            <Input
              id="orderPrefix"
              value={orderPrefix}
              onChange={(e) => setOrderPrefix(e.target.value)}
              disabled={disabled}
              placeholder="OLI-"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productionDays">Lead Time Produção (dias)</Label>
              <Input
                id="productionDays"
                type="number"
                min="1"
                value={productionDays}
                onChange={(e) => setProductionDays(Number(e.target.value))}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slaMinutes">SLA Atendimento (minutos)</Label>
              <Input
                id="slaMinutes"
                type="number"
                min="1"
                value={slaMinutes}
                onChange={(e) => setSlaMinutes(Number(e.target.value))}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={disabled}>
            {isUpserting ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
