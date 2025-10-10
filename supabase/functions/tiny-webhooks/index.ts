import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const processedEvents = new Map<string, number>();
const DEDUPE_TTL = 15 * 60 * 1000; // 15 min

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    const { topic, event, orderNumber, eventId, providerRef } = payload;

    // Idempotency check
    const dedupeKey = `${eventId || ''}-${providerRef || ''}-${orderNumber}`;
    if (processedEvents.has(dedupeKey)) {
      console.log(`[webhook] duplicate event: ${dedupeKey}`);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    processedEvents.set(dedupeKey, Date.now());
    setTimeout(() => processedEvents.delete(dedupeKey), DEDUPE_TTL);

    // Get order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (fetchError || !order) {
      console.error(`[webhook] order not found: ${orderNumber}`);
      return new Response(JSON.stringify({ ok: false, error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let updateData: any = {};

    switch (topic) {
      case 'payments':
        const payments = order.payments || [];
        if (payments[0]) {
          payments[0].status = event === 'paid' ? 'paid' : 'failed';
          payments[0].updatedAt = new Date().toISOString();
        }
        updateData.payments = payments;
        if (event === 'paid') updateData.status = 'paid';
        break;

      case 'fiscal':
        const fiscal = order.fiscal || {};
        if (event === 'authorized') {
          fiscal.status = 'authorized';
          fiscal.authorizedAt = new Date().toISOString();
        }
        updateData.fiscal = fiscal;
        if (event === 'authorized') updateData.status = 'production';
        break;

      case 'logistics':
        const logistics = order.logistics || {};
        logistics.status = event;
        logistics.updatedAt = new Date().toISOString();
        if (event === 'delivered') {
          logistics.deliveredAt = new Date().toISOString();
        }
        updateData.logistics = logistics;
        if (event === 'label_created') updateData.status = 'shipping';
        if (event === 'delivered') updateData.status = 'completed';
        break;

      case 'orders':
        if (event === 'cancelled') updateData.status = 'cancelled';
        break;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) throw updateError;

    console.log(`[webhook] processed: ${topic}/${event} for ${orderNumber}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[webhook]', error.message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
