// PHASE 3 - E-commerce Sandbox Cart
// INTEGRATIONS_MODE="OFF" | network_calls=0

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // POST /sandbox-cart/add
    if (req.method === 'POST' && path === 'add') {
      const { productId, quantity, configJson, previewPngDataUrl, priceDelta } = await req.json();

      // Get or create cart
      let { data: cart } = await supabaseClient
        .from('carts')
        .select('id')
        .eq('user_id', user?.id || null)
        .maybeSingle();

      if (!cart) {
        const { data: newCart, error: cartError } = await supabaseClient
          .from('carts')
          .insert({ user_id: user?.id || null })
          .select('id')
          .single();
        
        if (cartError) throw cartError;
        cart = newCart;
      }

      // Add item to cart
      const { data: item, error: itemError } = await supabaseClient
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          quantity,
          config_json: configJson || null,
          preview_png_url: previewPngDataUrl || null,
          price_delta: priceDelta || 0
        })
        .select()
        .single();

      if (itemError) throw itemError;

      console.log(`[sandbox-cart/add] Added item to cart ${cart.id}`.slice(0, 200));
      return new Response(
        JSON.stringify({ ok: true, cartId: cart.id, item }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /sandbox-cart
    if (req.method === 'GET') {
      const { data: cart } = await supabaseClient
        .from('carts')
        .select(`
          id,
          cart_items(
            id,
            product_id,
            quantity,
            config_json,
            preview_png_url,
            price_delta,
            products(id, name, sku, unit_price, images)
          )
        `)
        .eq('user_id', user?.id || null)
        .maybeSingle();

      return new Response(
        JSON.stringify({ ok: true, cart: cart || { items: [] } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sandbox-cart]', message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
