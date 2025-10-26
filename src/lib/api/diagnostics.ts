import { supabase } from "@/integrations/supabase/client";

export interface DiagnosticCheck {
  name: string;
  status: "ok" | "error" | "warning";
  details: string;
  error?: string;
}

export async function runConfigsDiagnostics(): Promise<DiagnosticCheck[]> {
  const checks: DiagnosticCheck[] = [];

  // Lista de tabelas para verificar
  const tablesToCheck = [
    { table: "config_color_palettes", name: "Paletas de Cor" },
    { table: "config_fabric_textures", name: "Texturas de Tecido" },
    { table: "config_basic_materials", name: "Materiais Básicos" },
    { table: "config_supply_groups", name: "Grupos de Insumo" },
    { table: "config_packaging_types", name: "Tipos de Embalagem" },
    { table: "config_bond_types", name: "Tipos de Vínculo" },
    {
      table: "config_customization_components",
      name: "Componentes de Personalização",
    },
    { table: "config_component_options", name: "Opções de Componentes" },
    { table: "order_statuses", name: "Status de Pedidos" },
    { table: "production_statuses", name: "Status de Produção" },
    { table: "shipping_statuses", name: "Status de Entregas" },
    { table: "system_settings", name: "Preferências do Sistema" },
    { table: "media_assets", name: "Biblioteca de Mídia" },
    { table: "material_sample_assets", name: "Amostras de Materiais" },
  ];

  for (const { table, name } of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table as any)
        .select("id", { count: "exact", head: true });

      if (error) {
        // Verificar se é erro de tabela não encontrada
        if (
          error.code === "PGRST204" ||
          error.message.includes("does not exist") ||
          (error.message.includes("relation") &&
            error.message.includes("does not exist"))
        ) {
          checks.push({
            name,
            status: "error",
            details: "Tabela não encontrada - Migrations pendentes",
            error: `Tabela "${table}" não existe no banco de dados`,
          });
        } else {
          checks.push({
            name,
            status: "error",
            details: "Erro ao consultar tabela",
            error: error.message,
          });
        }
      } else {
        checks.push({
          name,
          status: "ok",
          details: `${count || 0} registros`,
        });
      }
    } catch (e: any) {
      checks.push({
        name,
        status: "error",
        details: "Erro inesperado",
        error: e.message,
      });
    }
  }

  // Verificar storage buckets
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasProd = buckets?.some(b => b.id === 'product-media');
    const hasMat = buckets?.some(b => b.id === 'material-media');
    
    checks.push({
      name: 'Storage Buckets',
      status: (hasProd && hasMat) ? 'ok' : 'error',
      details: hasProd && hasMat 
        ? 'Buckets configurados (product-media, material-media)' 
        : `Faltam buckets: ${!hasProd ? 'product-media' : ''} ${!hasMat ? 'material-media' : ''}`.trim(),
    });
  } catch (e: any) {
    checks.push({
      name: 'Storage Buckets',
      status: 'error',
      details: 'Erro ao verificar buckets',
      error: e.message,
    });
  }

  // Verificar chaves obrigatórias em system_settings
  try {
    const { data, error } = await supabase
      .from('system_settings' as any)
      .select('key')
      .in('key', ['currency', 'timezone', 'order_prefix', 'lead_times', 'appearance', 'defaults']);
    
    if (!error && data) {
      const keys = data?.map((r: any) => r.key) || [];
      const required = ['currency', 'timezone', 'order_prefix', 'lead_times', 'appearance', 'defaults'];
      const missing = required.filter(k => !keys.includes(k));
      
      checks.push({
        name: 'System Settings - Chaves',
        status: missing.length === 0 ? 'ok' : 'warning',
        details: missing.length === 0 
          ? 'Todas chaves obrigatórias presentes' 
          : `Faltam chaves: ${missing.join(', ')}`,
      });
    }
  } catch (e: any) {
    // Silenciar erro se tabela não existir (já reportado acima)
  }

  return checks;
}
