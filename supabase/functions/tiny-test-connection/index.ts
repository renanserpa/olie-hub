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
    const { token } = await req.json();
    
    if (!token) {
      throw new Error('Token é obrigatório');
    }

    // LOGS DETALHADOS
    console.log('[tiny-test-connection] ═══════════════════════════════');
    console.log('[tiny-test-connection] Iniciando validação...');
    console.log('[tiny-test-connection] Token length:', token.length);
    console.log('[tiny-test-connection] Token format:', /^[a-f0-9]{64}$/i.test(token) ? '✓ Válido' : '✗ Inválido');
    console.log('[tiny-test-connection] Token preview:', token.slice(0, 8) + '...' + token.slice(-8));
    console.log('[tiny-test-connection] Testando conexão com Tiny API...');

    const startTime = Date.now();
    const response = await fetch('https://api.tiny.com.br/api2/info.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, formato: 'JSON' })
    });
    const elapsed = Date.now() - startTime;

    console.log('[tiny-test-connection] HTTP Status:', response.status);
    console.log('[tiny-test-connection] Tempo de resposta:', elapsed + 'ms');

    if (!response.ok) {
      console.error(`[tiny-test-connection] ✗ HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Token inválido ou API Tiny indisponível (HTTP ${response.status})`);
    }

    const text = await response.text();
    console.log('[tiny-test-connection] Response length:', text.length, 'bytes');
    console.log('[tiny-test-connection] Response preview:', text.slice(0, 100) + '...');
    
    // Validar se retornou XML (erro)
    if (text.trim().startsWith('<?xml')) {
      console.error('[tiny-test-connection] ✗ Resposta em XML (erro)');
      console.error('[tiny-test-connection] XML completo:', text.slice(0, 500));
      
      const errorMatch = text.match(/<erro[^>]*>(.*?)<\/erro>/i);
      const errorMsg = errorMatch ? errorMatch[1] : 'token invalido';
      
      throw new Error(`Token inválido: ${errorMsg}`);
    }

    let data;
    try {
      data = JSON.parse(text);
      console.log('[tiny-test-connection] ✓ JSON parseado com sucesso');
    } catch (parseError) {
      console.error('[tiny-test-connection] ✗ Falha ao parsear JSON:', parseError);
      throw new Error('Resposta inválida da API Tiny');
    }

    if (data.retorno?.status === 'Erro' || data.retorno?.codigo_erro) {
      const erro = data.retorno?.erros?.[0]?.erro || 'Erro desconhecido';
      console.error('[tiny-test-connection] ✗ Erro na resposta:', erro);
      throw new Error(`Tiny API: ${erro}`);
    }

    const accountName = data.retorno?.nome_empresa || data.retorno?.razao_social || 'Empresa';
    console.log('[tiny-test-connection] ✅ Token válido!');
    console.log('[tiny-test-connection] Conta:', accountName);
    console.log('[tiny-test-connection] ═══════════════════════════════');

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Conexão bem-sucedida com Tiny ERP',
        accountInfo: {
          name: accountName,
          responseTime: elapsed
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[tiny-test-connection] ═══════════════════════════════');
    console.error('[tiny-test-connection] ❌ ERRO FINAL:', message);
    console.error('[tiny-test-connection] ═══════════════════════════════');
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: message
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
