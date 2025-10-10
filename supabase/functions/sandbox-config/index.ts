// PHASE 3 - E-commerce Sandbox Config Presets
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

    const url = new URL(req.url);
    const configId = url.pathname.split('/').pop();

    // GET /sandbox-config/:id
    if (req.method === 'GET' && configId) {
      const { data: preset, error } = await supabaseClient
        .from('config_presets')
        .select('*')
        .eq('id', configId)
        .eq('is_active', true)
        .single();

      if (error || !preset) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Preset not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, preset }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /sandbox-config/save
    if (req.method === 'POST') {
      const { productId, name, configJson, previewPngDataUrl, priceDelta } = await req.json();
      const { data: { user } } = await supabaseClient.auth.getUser();

      const { data: preset, error } = await supabaseClient
        .from('config_presets')
        .insert({
          product_id: productId,
          name: name || 'Custom Config',
          config_json: configJson,
          preview_png_url: previewPngDataUrl || null,
          price_delta: priceDelta || 0
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`[sandbox-config/save] Saved preset ${preset.id}`.slice(0, 200));
      return new Response(
        JSON.stringify({ ok: true, configId: preset.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sandbox-config]', message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
