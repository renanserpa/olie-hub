// PHASE 3 - E-commerce Sandbox Checkout
// INTEGRATIONS_MODE="OFF" | network_calls=0
// Creates orders, production_tasks, and inventory reservations locally

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
    if (!user) throw new Error('Unauthorized');

    const { cartId } = await req.json();

    // Get cart with items
    const { data: cart, error: cartError } = await supabaseClient
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
          products(id, name, sku, unit_price)
        )
      `)
      .eq('id', cartId)
      .single();

    if (cartError || !cart) throw new Error('Cart not found');
    const items = cart.cart_items || [];
    if (items.length === 0) throw new Error('Cart is empty');

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      const basePrice = Number(item.products.unit_price) || 0;
      const delta = Number(item.price_delta) || 0;
      return sum + (basePrice + delta) * item.quantity;
    }, 0);

    const total = subtotal; // No shipping/discount in sandbox

    // Generate order number
    const { data: orderNumData } = await supabaseClient.rpc('generate_order_number');
    const orderNumber = orderNumData || `OLIE-${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        created_by: user.id,
        contact_id: null, // Sandbox - no contact needed
        subtotal,
        total,
        status: 'pending_payment',
        source: 'e-commerce-sandbox',
        items: items.map((item: any) => ({
          productId: item.product_id,
          productName: item.products.name,
          sku: item.products.sku,
          quantity: item.quantity,
          unitPrice: item.products.unit_price,
          priceDelta: item.price_delta,
          config: item.config_json,
          preview: item.preview_png_url
        }))
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create production tasks
    for (const item of items) {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      await supabaseClient
        .from('production_tasks')
        .insert({
          order_id: order.id,
          product_name: product?.name || 'Unknown',
          quantity: item.quantity,
          status: 'pending',
          priority: 0,
          notes: item.config_json ? `Config: ${JSON.stringify(item.config_json).slice(0, 100)}` : null
        });
    }

    // Create inventory reservations (mock BOM)
    for (const item of items) {
      const { data: bom } = await supabaseClient
        .from('inventory_bom')
        .select('supply_product_id, quantity_per_unit')
        .eq('product_id', item.product_id);

      for (const bomItem of bom || []) {
        await supabaseClient
          .from('inventory_movements')
          .insert({
            product_id: bomItem.supply_product_id,
            type: 'out',
            quantity: item.quantity * bomItem.quantity_per_unit,
            reason: `Reserva: pedido ${orderNumber}`,
            reference_id: order.id,
            created_by: user.id
          });
      }
    }

    // Clear cart
    await supabaseClient.from('cart_items').delete().eq('cart_id', cartId);

    console.log(`[sandbox-checkout] Created order ${orderNumber}`.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: true, orderId: order.id, orderNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sandbox-checkout]', message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
