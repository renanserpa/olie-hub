export const runtimeEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseRef: extractSupabaseRef(import.meta.env.VITE_SUPABASE_URL),
  allowedRef: import.meta.env.VITE_SUPABASE_ALLOWED_REF || 'qrfvdoecpmcnlpxklcsu',
  appEnv: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development',
  isProduction: import.meta.env.PROD,
} as const;

function extractSupabaseRef(url: string): string {
  const match = url?.match(/https:\/\/([a-z]+)\.supabase\.co/);
  return match?.[1] || 'unknown';
}

export function isCorrectEnvironment(): boolean {
  return runtimeEnv.supabaseRef === runtimeEnv.allowedRef;
}
