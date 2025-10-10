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

    const { orderId, cepDestino, peso, valorDeclarado } = await req.json();
    if (!orderId || !cepDestino) throw new Error('orderId and cepDestino required');

    callCounter++;
    console.log(`[tiny-shipping-quote] call #${callCounter}`);

    const isDryRun = Deno.env.get('DRY_RUN') === 'true';
    let quotes = [];

    if (isDryRun) {
      quotes = [
        { carrier: 'Correios', service: 'PAC', price: 25.5, prazoDias: 7, serviceId: 'PAC' },
        { carrier: 'Correios', service: 'SEDEX', price: 45.0, prazoDias: 3, serviceId: 'SEDEX' },
      ];
    } else {
      const tinyToken = Deno.env.get('TINY_API_TOKEN');
      if (!tinyToken) throw new Error('TINY_API_TOKEN not configured');

      const tinyRes = await fetch('https://api.tiny.com.br/api2/calculo.frete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tinyToken,
          formato: 'json',
          cep_destino: cepDestino,
          peso: peso || 1,
          valor_declarado: valorDeclarado || 100,
        }),
      });

      const tinyData = await tinyRes.json();
      if (tinyData.retorno?.status_processamento !== '1') {
        throw new Error(`Tiny error: ${tinyData.retorno?.erros?.[0]?.erro || 'unknown'}`);
      }

      quotes = tinyData.retorno.servicos.map((s: any) => ({
        carrier: s.transportadora,
        service: s.servico,
        price: parseFloat(s.valor),
        prazoDias: parseInt(s.prazo),
        serviceId: s.codigo,
      }));
    }

    return new Response(
      JSON.stringify(quotes),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[tiny-shipping-quote]', message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
