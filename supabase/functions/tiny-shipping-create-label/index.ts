import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let callCounter = 0;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('Unauthorized');

    const { data: hasRole } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!hasRole) {
      const { data: hasAtendimento } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'atendimento' });
      if (!hasAtendimento) throw new Error('Forbidden: admin or atendimento role required');
    }

    const { orderId, serviceId, carrier, service, price } = await req.json();
    if (!orderId || !serviceId) throw new Error('orderId and serviceId required');

    callCounter++;
    console.log(`[tiny-shipping-create-label] call #${callCounter}`);

    const isDryRun = Deno.env.get('DRY_RUN') === 'true';
    let tracking = '';
    let labelUrl = '';
    let eta = '';

    if (isDryRun) {
      tracking = `BR${Date.now()}`;
      labelUrl = `https://tiny-mock.com/label/${orderId}.pdf`;
      eta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      const tinyToken = Deno.env.get('TINY_API_TOKEN');
      if (!tinyToken) throw new Error('TINY_API_TOKEN not configured');

      const tinyRes = await fetch('https://api.tiny.com.br/api2/gerar.envio.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tinyToken,
          formato: 'json',
          pedido_id: orderId,
          servico_id: serviceId,
        }),
      });

      const tinyData = await tinyRes.json();
      if (tinyData.retorno?.status_processamento !== '1') {
        throw new Error(`Tiny error: ${tinyData.retorno?.erros?.[0]?.erro || 'unknown'}`);
      }

      tracking = tinyData.retorno.envio.rastreamento;
      labelUrl = tinyData.retorno.envio.link_etiqueta;
      eta = tinyData.retorno.envio.previsao_entrega;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        logistics: {
          tracking,
          labelUrl,
          carrier,
          service,
          price,
          eta,
          status: 'label_created',
          createdAt: new Date().toISOString(),
        },
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ ok: true, tracking, labelUrl, carrier, service, price, eta }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[tiny-shipping-create-label]', message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
