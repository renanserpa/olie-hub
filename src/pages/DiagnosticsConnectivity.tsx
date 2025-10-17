import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { humanize } from '@/lib/supabase/errors';
import { runtimeEnv } from '@/lib/runtime/env';

type JsonRecord = Record<string, unknown>;

interface WhoamiPayload {
  user_id?: string;
  roles?: string[];
  [key: string]: unknown;
}

interface DiagnosticsState {
  loading: boolean;
  env: {
    url: string;
    allowedRef: string;
    debug: boolean;
    currentRef: string;
  };
  whoami: {
    data: WhoamiPayload | null;
    error: string | null;
  };
  health: {
    data: unknown;
    error: string | null;
  };
  palettes: {
    rows: JsonRecord[];
    error: string | null;
  };
  textures: {
    rows: JsonRecord[];
    error: string | null;
  };
}

const initialState: DiagnosticsState = {
  loading: true,
  env: {
    url: '',
    allowedRef: '',
    debug: false,
    currentRef: 'desconhecido',
  },
  whoami: { data: null, error: null },
  health: { data: null, error: null },
  palettes: { rows: [], error: null },
  textures: { rows: [], error: null },
};

function readPublicEnv(key: keyof ImportMetaEnv): string | undefined {
  return (
    import.meta.env[key] ??
    (typeof window !== 'undefined' ? (window as any).ENV?.[key as string] : undefined)
  );
}

export default function DiagnosticsConnectivity() {
  const [state, setState] = useState<DiagnosticsState>(initialState);
  const [refreshToken, setRefreshToken] = useState(0);

  const envInfo = useMemo(() => {
    const url = readPublicEnv('NEXT_PUBLIC_SUPABASE_URL') ?? runtimeEnv.supabaseUrl;
    const allowedRef =
      readPublicEnv('NEXT_PUBLIC_SUPABASE_ALLOWED_REF') ?? runtimeEnv.allowedRef;
    const debugFlag = readPublicEnv('NEXT_PUBLIC_DEBUG_SUPABASE') === 'true';

    return {
      url: url || 'Não configurado',
      allowedRef: allowedRef || 'Não definido',
      currentRef: runtimeEnv.supabaseRef,
      debug: debugFlag,
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function runDiagnostics() {
      setState((prev) => ({ ...prev, loading: true }));

      const [whoami, health, palettes, textures] = await Promise.all([
        supabase.rpc('whoami' as any),
        supabase.rpc('health_probe' as any),
        supabase.from('config_color_palettes' as any).select('*').limit(5),
        supabase.from('config_fabric_textures' as any).select('*').limit(5),
      ]);

      if (!active) return;

      setState({
        loading: false,
        env: envInfo,
        whoami: {
          data: (whoami.data as unknown as WhoamiPayload | null) ?? null,
          error: whoami.error ? humanize(whoami.error) : null,
        },
        health: {
          data: health.data ?? null,
          error: health.error ? humanize(health.error) : null,
        },
        palettes: {
          rows: (palettes.data as unknown as JsonRecord[] | null) ?? [],
          error: palettes.error ? humanize(palettes.error) : null,
        },
        textures: {
          rows: (textures.data as unknown as JsonRecord[] | null) ?? [],
          error: textures.error ? humanize(textures.error) : null,
        },
      });
    }

    runDiagnostics();

    return () => {
      active = false;
    };
  }, [envInfo, refreshToken]);

  const renderRowsPreview = (rows: JsonRecord[]) => {
    if (!rows || rows.length === 0) {
      return <p className="text-sm text-muted-foreground">Nenhum registro retornado.</p>;
    }

    return (
      <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-4 text-xs">
        {JSON.stringify(rows, null, 2)}
      </pre>
    );
  };

  const renderError = (message: string | null) =>
    message ? <p className="text-sm text-destructive">{message}</p> : null;

  const roles = state.whoami.data?.roles;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            Diagnóstico de Conectividade
          </h1>
          <p className="text-muted-foreground">
            Verifique variáveis de ambiente, permissões e disponibilidade de tabelas no Supabase.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setRefreshToken((value) => value + 1)}
          disabled={state.loading}
        >
          {state.loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Recarregar
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ambiente</h2>
          <Badge variant={state.env.allowedRef === state.env.currentRef ? 'secondary' : 'destructive'}>
            ref atual: {state.env.currentRef}
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Supabase URL:</span> {state.env.url}
          </div>
          <div>
            <span className="font-medium">Projeto esperado:</span> {state.env.allowedRef}
          </div>
          <div>
            <span className="font-medium">Debug Supabase:</span>{' '}
            {state.env.debug ? (
              <Badge variant="outline" className="text-amber-600">
                ativo
              </Badge>
            ) : (
              <Badge variant="secondary">desativado</Badge>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Sessão atual (RPC whoami)</h2>
        {state.whoami.error ? (
          <p className="text-sm text-destructive">{state.whoami.error}</p>
        ) : (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">User ID:</span> {state.whoami.data?.user_id ?? 'desconhecido'}
            </div>
            <div>
              <span className="font-medium">Roles:</span>{' '}
              {Array.isArray(roles) && roles.length > 0 ? roles.join(', ') : 'nenhum papel retornado'}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Health probe</h2>
        {state.health.error ? (
          <p className="text-sm text-destructive">{state.health.error}</p>
        ) : (
          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(state.health.data, null, 2)}
          </pre>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Consultas diretas</h2>
        <div className="space-y-4">
          <section>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">config_color_palettes</h3>
              {state.palettes.error ? (
                <Badge variant="destructive">erro</Badge>
              ) : (
                <Badge variant="secondary">{state.palettes.rows.length} linhas</Badge>
              )}
            </div>
            {renderError(state.palettes.error)}
            {renderRowsPreview(state.palettes.rows)}
          </section>

          <Separator />

          <section>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">config_fabric_textures</h3>
              {state.textures.error ? (
                <Badge variant="destructive">erro</Badge>
              ) : (
                <Badge variant="secondary">{state.textures.rows.length} linhas</Badge>
              )}
            </div>
            {renderError(state.textures.error)}
            {renderRowsPreview(state.textures.rows)}
          </section>
        </div>
      </Card>
    </div>
  );
}
