import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function readEnvValue(
  key: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) {
  // Suporte Vite (VITE_*)
  const viteKey = `VITE_${key.replace("NEXT_PUBLIC_", "")}`;
  const viteValue = import.meta.env[viteKey as keyof ImportMetaEnv] as
    | string
    | undefined;
  if (viteValue) {
    return viteValue;
  }

  // Suporte Next (NEXT_PUBLIC_*)
  const nextValue = import.meta.env[key as keyof ImportMetaEnv] as
    | string
    | undefined;
  if (nextValue) {
    return nextValue;
  }

  // Fallback window
  if (typeof window !== "undefined") {
    const fromWindow = (
      window as unknown as { ENV?: Record<string, string | undefined> }
    )?.ENV?.[key];
    if (fromWindow) {
      return fromWindow;
    }
  }

  return undefined;
}

const url = readEnvValue("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = readEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!url || !anonKey) {
  console.warn(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined.",
  );
  throw new Error("Missing Supabase public environment variables");
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
