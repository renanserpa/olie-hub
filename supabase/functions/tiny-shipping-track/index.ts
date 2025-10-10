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
    const tracking = url.pathname.split('/').pop();
    if (!tracking) throw new Error('tracking code required');

    callCounter++;
    console.log(`[tiny-shipping-track] call #${callCounter}`);

    const isDryRun = Deno.env.get('DRY_RUN') === 'true';
    let status = '';
    let events: any[] = [];

    if (isDryRun) {
      status = 'in_transit';
      events = [
        { at: new Date().toISOString(), desc: 'Objeto postado' },
        { at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), desc: 'Objeto em trânsito' },
      ];
    } else {
      const tinyToken = Deno.env.get('TINY_API_TOKEN');
      if (!tinyToken) throw new Error('TINY_API_TOKEN not configured');

      const tinyRes = await fetch(
        `https://api.tiny.com.br/api2/rastreamento.obter.php?token=${tinyToken}&formato=json&codigo=${tracking}`
      );

      const tinyData = await tinyRes.json();
      if (tinyData.retorno?.status_processamento !== '1') {
        throw new Error(`Tiny error: ${tinyData.retorno?.erros?.[0]?.erro || 'unknown'}`);
      }

      status = tinyData.retorno.rastreamento.status;
      events = tinyData.retorno.rastreamento.eventos.map((e: any) => ({
        at: e.data,
        desc: e.descricao,
      }));
    }

    return new Response(
      JSON.stringify({ ok: true, status, events }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[tiny-shipping-track]', error.message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
