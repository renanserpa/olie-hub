// Tiny Sync On-Demand
// INTEGRATIONS_MODE="TINY_LIVE" | TINY_WRITE_MODE="READ_ONLY"
// MAX_CALLS_PER_ACTION=3 | PAGE_SIZE=50

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TINY_TOKEN = Deno.env.get('TINY_TOKEN');
const MAX_CALLS = 3;
const PAGE_SIZE = 50;

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

    if (!TINY_TOKEN) {
      console.error('[tiny-sync] ❌ TINY_TOKEN não configurado');
      throw new Error('❌ Token Tiny não configurado. Acesse Settings → Integrações → Conectar Tiny para configurar.');
    }

    // Validar formato antes de prosseguir
    if (!/^[a-f0-9]{64}$/i.test(TINY_TOKEN)) {
      console.error('[tiny-sync] ❌ Token com formato inválido:', TINY_TOKEN.length, 'caracteres');
      throw new Error('Token Tiny com formato inválido. Reconfigure em Settings.');
    }

    const { entity, dryRun, since, testOnly } = await req.json();

    // Se testOnly=true, apenas validar token e retornar
    if (testOnly) {
      console.log('[tiny-sync] Modo TEST-ONLY: validando token...');
      
      const testResponse = await fetch('https://api.tiny.com.br/api2/info.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: TINY_TOKEN, formato: 'JSON' })
      });
      
      const testText = await testResponse.text();
      
      if (testText.trim().startsWith('<?xml') || !testResponse.ok) {
        throw new Error('Token inválido ou expirado');
      }
      
      const testData = JSON.parse(testText);
      if (testData.retorno?.status === 'Erro') {
        throw new Error(testData.retorno?.erros?.[0]?.erro || 'Token inválido');
      }
      
      console.log('[tiny-sync] ✅ Token válido (test-only)');
      
      return new Response(
        JSON.stringify({ ok: true, message: 'Token válido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!['contacts', 'products', 'orders'].includes(entity)) {
      throw new Error('Invalid entity type');
    }

    console.log(`[tiny-sync] ${dryRun ? 'DRY-RUN' : 'APPLY'} ${entity} since=${since || 'all'}`);

    let apiCalls = 0;
    let itemsProcessed = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    let itemsSkipped = 0;
    const summary: any[] = [];

    // Helper function to call Tiny API with improved error handling
    async function callTinyAPI(endpoint: string) {
      if (apiCalls >= MAX_CALLS) {
        throw new Error(`Limite de ${MAX_CALLS} chamadas atingido. Use filtros ou aguarde próxima janela.`);
      }
      apiCalls++;

      console.log(`[tiny-sync] Chamando API (${apiCalls}/${MAX_CALLS}): ${endpoint}`);

      const response = await fetch(`https://api.tiny.com.br/api2/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: TINY_TOKEN, 
          formato: 'JSON' // UPPERCASE obrigatório
        })
      });

      if (!response.ok) {
        console.error(`[tiny-sync] HTTP ${response.status}: ${response.statusText}`);
        throw new Error(`API Tiny indisponível (HTTP ${response.status})`);
      }

      const text = await response.text();
      
      // Validação robusta de XML vs JSON
      if (text.trim().startsWith('<?xml')) {
        console.error('[tiny-sync] Resposta em XML detectada:', text.slice(0, 300));
        
        // Tentar extrair mensagem de erro do XML
        const errorMatch = text.match(/<erro[^>]*>(.*?)<\/erro>/i);
        const errorMsg = errorMatch ? errorMatch[1] : 'Token inválido ou formato incorreto';
        
        throw new Error(`❌ Tiny API: ${errorMsg}. Verifique o token em Settings → Integrações.`);
      }

      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch (parseError) {
        console.error('[tiny-sync] Falha ao parsear JSON:', text.slice(0, 300));
        throw new Error('Resposta inválida da API Tiny. Contate o suporte.');
      }

      // Validar erros na resposta JSON
      if (jsonData.retorno?.status === 'Erro' || jsonData.retorno?.codigo_erro) {
        const erro = jsonData.retorno?.erros?.[0]?.erro || 'Erro desconhecido';
        console.error('[tiny-sync] Erro na resposta:', erro);
        
        if (erro.toLowerCase().includes('token')) {
          throw new Error(`❌ Token inválido: ${erro}. Reconfigure em Settings → Integrações.`);
        }
        
        throw new Error(`Tiny API: ${erro}`);
      }

      console.log(`[tiny-sync] ✅ Resposta válida recebida`);
      return jsonData;
    }

    // Helper to generate hash for change detection
    function generateHash(data: any): string {
      const str = JSON.stringify(data);
      return createHash('sha256').update(str).digest('hex');
    }

    // Sync Contacts
    if (entity === 'contacts') {
      const tinyData = await callTinyAPI('contatos.pesquisa.php');
      const contacts = tinyData.retorno?.contatos || [];

      for (const item of contacts.slice(0, PAGE_SIZE)) {
        const contact = item.contato;
        itemsProcessed++;

        const hash = generateHash({
          name: contact.nome,
          cpfCnpj: contact.cpf_cnpj,
          email: contact.email,
        });

        // Check if exists
        const { data: existing } = await supabaseClient
          .from('contacts')
          .select('id, tiny_hash')
          .eq('tiny_customer_id', contact.id)
          .maybeSingle();

        if (existing && existing.tiny_hash === hash) {
          itemsSkipped++;
          continue;
        }

        const contactData = {
          tiny_customer_id: contact.id,
          name: contact.nome,
          cpf_cnpj: contact.cpf_cnpj,
          email: contact.email,
          phone: contact.fone,
          tiny_synced_at: new Date().toISOString(),
          tiny_hash: hash
        };

        summary.push({
          action: existing ? 'update' : 'create',
          entity: 'contact',
          tinyId: contact.id,
          name: contact.nome
        });

        if (!dryRun) {
          if (existing) {
            await supabaseClient
              .from('contacts')
              .update(contactData)
              .eq('id', existing.id);
            itemsUpdated++;
          } else {
            await supabaseClient.from('contacts').insert(contactData);
            itemsCreated++;
          }
        }
      }
    }

    // Sync Products
    if (entity === 'products') {
      const tinyData = await callTinyAPI('produtos.pesquisa.php');
      const products = tinyData.retorno?.produtos || [];

      for (const item of products.slice(0, PAGE_SIZE)) {
        const product = item.produto;
        itemsProcessed++;

        const hash = generateHash({
          name: product.nome,
          sku: product.codigo,
          price: product.preco,
        });

        const { data: existing } = await supabaseClient
          .from('products')
          .select('id, tiny_hash')
          .eq('tiny_product_id', product.id)
          .maybeSingle();

        if (existing && existing.tiny_hash === hash) {
          itemsSkipped++;
          continue;
        }

        const productData = {
          tiny_product_id: product.id,
          name: product.nome,
          sku: product.codigo,
          description: product.descricao || null,
          unit_price: parseFloat(product.preco) || 0,
          tiny_synced_at: new Date().toISOString(),
          tiny_hash: hash
        };

        summary.push({
          action: existing ? 'update' : 'create',
          entity: 'product',
          tinyId: product.id,
          sku: product.codigo
        });

        if (!dryRun) {
          if (existing) {
            await supabaseClient
              .from('products')
              .update(productData)
              .eq('id', existing.id);
            itemsUpdated++;
          } else {
            await supabaseClient.from('products').insert(productData);
            itemsCreated++;
          }
        }
      }
    }

    // Sync Orders
    if (entity === 'orders') {
      const tinyData = await callTinyAPI('pedidos.pesquisa.php');
      const orders = tinyData.retorno?.pedidos || [];

      for (const item of orders.slice(0, PAGE_SIZE)) {
        const order = item.pedido;
        itemsProcessed++;

        const hash = generateHash({
          orderNumber: order.numero,
          total: order.valor,
          status: order.situacao,
        });

        const { data: existing } = await supabaseClient
          .from('orders')
          .select('id, tiny_hash')
          .eq('tiny_order_id', order.id)
          .maybeSingle();

        if (existing && existing.tiny_hash === hash) {
          itemsSkipped++;
          continue;
        }

        const orderData = {
          tiny_order_id: order.id,
          order_number: order.numero,
          total: parseFloat(order.valor) || 0,
          subtotal: parseFloat(order.valor) || 0,
          items: order.itens || [],
          tiny_synced_at: new Date().toISOString(),
          tiny_hash: hash
        };

        summary.push({
          action: existing ? 'update' : 'create',
          entity: 'order',
          tinyId: order.id,
          number: order.numero
        });

        if (!dryRun) {
          if (existing) {
            await supabaseClient
              .from('orders')
              .update(orderData)
              .eq('id', existing.id);
            itemsUpdated++;
          } else {
            await supabaseClient.from('orders').insert(orderData);
            itemsCreated++;
          }
        }
      }
    }

    // Log sync operation
    await supabaseClient.from('sync_logs').insert({
      entity_type: entity,
      operation: dryRun ? 'dry_run' : 'apply',
      status: 'success',
      items_processed: itemsProcessed,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      items_skipped: itemsSkipped,
      api_calls_used: apiCalls,
      summary,
      created_by: user.id
    });

    console.log(`[tiny-sync] ${entity}: processed=${itemsProcessed}, created=${itemsCreated}, updated=${itemsUpdated}, skipped=${itemsSkipped}, calls=${apiCalls}`.slice(0, 200));

    return new Response(
      JSON.stringify({
        ok: true,
        dryRun,
        entity,
        stats: {
          itemsProcessed,
          itemsCreated,
          itemsUpdated,
          itemsSkipped,
          apiCallsUsed: apiCalls,
          maxCalls: MAX_CALLS
        },
        summary: summary.slice(0, 10) // First 10 for preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[tiny-sync]', message.slice(0, 200));
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
