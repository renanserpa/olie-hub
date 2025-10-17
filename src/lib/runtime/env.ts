function readPublicEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (value) return value;

  if (typeof window !== 'undefined') {
    const w = window as any;
    const fromWindow = w.ENV?.[key as string];
    if (fromWindow) return fromWindow;
  }

  return '';
}

const supabaseUrl = readPublicEnv('NEXT_PUBLIC_SUPABASE_URL');

export const runtimeEnv = {
  supabaseUrl,
  supabaseRef: extractSupabaseRef(supabaseUrl),
  allowedRef: readPublicEnv('NEXT_PUBLIC_SUPABASE_ALLOWED_REF') || 'qrfvdoecpmcnlpxklcsu',
  appEnv: import.meta.env.MODE || 'development',
  isProduction: import.meta.env.PROD,
} as const;

function extractSupabaseRef(url: string): string {
  const match = url?.match(/https:\/\/([a-z]+)\.supabase\.co/);
  return match?.[1] || 'unknown';
}

export function isCorrectEnvironment(): boolean {
  return runtimeEnv.supabaseRef === runtimeEnv.allowedRef;
}
