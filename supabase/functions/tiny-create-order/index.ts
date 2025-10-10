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

    const orderData = await req.json();
    if (!orderData.orderId) throw new Error('orderId required');

    callCounter++;
    console.log(`[tiny-create-order] call #${callCounter}`);

    const isDryRun = Deno.env.get('DRY_RUN') === 'true';
    let tinyOrderId = '';

    if (isDryRun) {
      tinyOrderId = `tiny-mock-${Date.now()}`;
    } else {
      const tinyToken = Deno.env.get('TINY_API_TOKEN');
      if (!tinyToken) throw new Error('TINY_API_TOKEN not configured');

      const tinyRes = await fetch('https://api.tiny.com.br/api2/pedido.incluir.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tinyToken,
          formato: 'json',
          pedido: orderData,
        }),
      });

      const tinyData = await tinyRes.json();
      if (tinyData.retorno?.status_processamento !== '1') {
        throw new Error(`Tiny error: ${tinyData.retorno?.erros?.[0]?.erro || 'unknown'}`);
      }

      tinyOrderId = tinyData.retorno.pedido.id;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ tiny_order_id: tinyOrderId })
      .eq('id', orderData.orderId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ ok: true, tinyOrderId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[tiny-create-order]', message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
