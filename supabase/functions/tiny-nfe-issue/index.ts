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
    if (!hasRole) throw new Error('Forbidden: admin role required');

    const { orderId } = await req.json();
    if (!orderId) throw new Error('orderId required');

    callCounter++;
    console.log(`[tiny-nfe-issue] call #${callCounter}`);

    const isDryRun = Deno.env.get('DRY_RUN') === 'true';
    let nfeNumber = '';
    let serie = '';
    let xmlUrl = '';
    let pdfUrl = '';
    let status = 'processing';

    if (isDryRun) {
      nfeNumber = '123456';
      serie = '1';
      xmlUrl = `https://tiny-mock.com/nfe/${orderId}.xml`;
      pdfUrl = `https://tiny-mock.com/nfe/${orderId}.pdf`;
      status = 'authorized';
    } else {
      const tinyToken = Deno.env.get('TINY_API_TOKEN');
      if (!tinyToken) throw new Error('TINY_API_TOKEN not configured');

      const tinyRes = await fetch('https://api.tiny.com.br/api2/nota.fiscal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tinyToken,
          formato: 'json',
          pedido_id: orderId,
        }),
      });

      const tinyData = await tinyRes.json();
      if (tinyData.retorno?.status_processamento !== '1') {
        throw new Error(`Tiny error: ${tinyData.retorno?.erros?.[0]?.erro || 'unknown'}`);
      }

      nfeNumber = tinyData.retorno.nota.numero;
      serie = tinyData.retorno.nota.serie;
      xmlUrl = tinyData.retorno.nota.link_xml;
      pdfUrl = tinyData.retorno.nota.link_pdf;
      status = tinyData.retorno.nota.situacao;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        fiscal: {
          nfeNumber,
          serie,
          xmlUrl,
          pdfUrl,
          status,
          issuedAt: new Date().toISOString(),
        },
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ ok: true, nfeNumber, serie, xmlUrl, pdfUrl, status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[tiny-nfe-issue]', error.message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
