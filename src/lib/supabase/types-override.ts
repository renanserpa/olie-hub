// Tipos temporários para tabelas ainda não migradas no Supabase
// Este arquivo será removido após aplicar migrations em qrfvdoecpmcnlpxklcsu

export interface ConfigSupplyGroup {
  id: string;
  name: string;
  codigo: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfigBasicMaterial {
  id: string;
  name: string;
  codigo: string;
  unit: "pc" | "m" | "cm" | "mm" | "g" | "kg" | "ml" | "l";
  default_cost: number;
  supply_group_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfigPackagingType {
  id: string;
  name: string;
  codigo: string;
  dimensions: { width: number; height: number; depth: number };
  weight_limit_kg: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
