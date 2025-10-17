// Feature flags para controlar integrações e funcionalidades
export const FEATURES = {
  TINY_ERP: false, // Tiny ERP desativado
  MEDIA_LIBRARY: false, // Biblioteca de mídia (futuro)
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
