import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let callCounter = 0;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const orderNumber = url.searchParams.get('number');
    if (!orderNumber) throw new Error('number query param required');

    callCounter++;
    console.log(`[tiny-order-status] call #${callCounter}`);

    const isDryRun = Deno.env.get('DRY_RUN') === 'true';
    let status = {};

    if (isDryRun) {
      status = {
        orderNumber,
        status: 'processing',
        lastUpdate: new Date().toISOString(),
      };
    } else {
      const tinyToken = Deno.env.get('TINY_API_TOKEN');
      if (!tinyToken) throw new Error('TINY_API_TOKEN not configured');

      const tinyRes = await fetch(
        `https://api.tiny.com.br/api2/pedido.obter.php?token=${tinyToken}&formato=json&numero=${orderNumber}`
      );

      const tinyData = await tinyRes.json();
      if (tinyData.retorno?.status_processamento !== '1') {
        throw new Error(`Tiny error: ${tinyData.retorno?.erros?.[0]?.erro || 'unknown'}`);
      }

      status = {
        orderNumber,
        status: tinyData.retorno.pedido.situacao,
        lastUpdate: tinyData.retorno.pedido.data_atualizacao,
      };
    }

    return new Response(
      JSON.stringify({ ok: true, ...status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[tiny-order-status]', error.message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
