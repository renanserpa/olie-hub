/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_SUPABASE_URL?: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly NEXT_PUBLIC_SUPABASE_ALLOWED_REF?: string;
  readonly NEXT_PUBLIC_DEBUG_SUPABASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    ENV?: Record<string, string | undefined>;
  }
}
