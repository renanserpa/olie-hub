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

    const { orderId, amount, description, customer } = await req.json();
    if (!orderId || !amount) throw new Error('orderId and amount required');

    callCounter++;
    console.log(`[tiny-payments-create-link] call #${callCounter}`);

    const isDryRun = Deno.env.get('DRY_RUN') === 'true';
    let checkoutUrl = '';
    let providerRef = '';

    if (isDryRun) {
      checkoutUrl = `https://tiny-mock.com/pay/${orderId}`;
      providerRef = `mock-${Date.now()}`;
    } else {
      const tinyToken = Deno.env.get('TINY_API_TOKEN');
      if (!tinyToken) throw new Error('TINY_API_TOKEN not configured');

      const tinyRes = await fetch('https://api.tiny.com.br/api2/pagamentos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tinyToken,
          formato: 'json',
          pedido: orderId,
          valor: amount,
          descricao: description,
          cliente: customer,
        }),
      });

      const tinyData = await tinyRes.json();
      if (tinyData.retorno?.status_processamento !== '1') {
        throw new Error(`Tiny error: ${tinyData.retorno?.erros?.[0]?.erro || 'unknown'}`);
      }

      checkoutUrl = tinyData.retorno.pagamento.link;
      providerRef = tinyData.retorno.pagamento.id;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payments: [
          {
            method: 'pix',
            status: 'pending',
            checkoutUrl,
            providerRef,
            createdAt: new Date().toISOString(),
          },
        ],
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ ok: true, checkoutUrl, providerRef }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[tiny-payments-create-link]', message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
