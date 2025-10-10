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

    console.log('[tiny-test-connection] Testando token...');

    // Testar conexão com Tiny API
    const response = await fetch('https://api.tiny.com.br/api2/info.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, formato: 'JSON' })
    });

    if (!response.ok) {
      console.error(`[tiny-test-connection] HTTP ${response.status}`);
      throw new Error('Token inválido ou API Tiny indisponível');
    }

    const text = await response.text();
    
    // Validar se retornou XML (erro)
    if (text.trim().startsWith('<?xml')) {
      console.error('[tiny-test-connection] Resposta em XML:', text.slice(0, 200));
      const errorMatch = text.match(/<erro[^>]*>(.*?)<\/erro>/i);
      const errorMsg = errorMatch ? errorMatch[1] : 'token invalido';
      throw new Error(`Token inválido: ${errorMsg}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Resposta inválida da API Tiny');
    }

    if (data.retorno?.status === 'Erro' || data.retorno?.codigo_erro) {
      const erro = data.retorno?.erros?.[0]?.erro || 'Erro desconhecido';
      console.error('[tiny-test-connection] Erro na resposta:', erro);
      throw new Error(`Tiny API: ${erro}`);
    }

    console.log('[tiny-test-connection] ✅ Token válido');

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Conexão bem-sucedida com Tiny ERP',
        accountInfo: {
          name: data.retorno?.nome_empresa || 'Empresa'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[tiny-test-connection] Erro:', message);
    return new Response(
      JSON.stringify({
        ok: false,
        error: message
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
