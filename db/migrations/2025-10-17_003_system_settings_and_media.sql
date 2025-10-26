-- ============================================
-- Migration: System Settings + Media Library
-- Data: 2025-10-17
-- ============================================

-- Função auxiliar para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.has_role(auth.uid(), 'admin'::app_role), false);
$$;

-- ============================================
-- Tabela system_settings (K/V) + RLS
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  category    TEXT DEFAULT 'system',
  is_active   BOOLEAN DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_active 
  ON public.system_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_system_settings_category 
  ON public.system_settings(category);

-- Trigger para updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_system_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON public.system_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sysset_select ON public.system_settings;
CREATE POLICY sysset_select ON public.system_settings
  FOR SELECT USING (public.is_admin() OR is_active = true);

DROP POLICY IF EXISTS sysset_insert ON public.system_settings;
CREATE POLICY sysset_insert ON public.system_settings
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS sysset_update ON public.system_settings;
CREATE POLICY sysset_update ON public.system_settings
  FOR UPDATE USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS sysset_delete ON public.system_settings;
CREATE POLICY sysset_delete ON public.system_settings
  FOR DELETE USING (public.is_admin());

-- Seeds de configurações padrão
INSERT INTO public.system_settings(key, value, category, is_active)
VALUES
  ('currency', '{"code":"BRL","symbol":"R$"}'::jsonb, 'system', true),
  ('timezone', '{"iana":"America/Sao_Paulo"}'::jsonb, 'system', true),
  ('order_prefix', '{"prefix":"OLI-"}'::jsonb, 'orders', true),
  ('lead_times', '{"production_days":7,"sla_minutes":120}'::jsonb, 'system', true),
  ('appearance', '{"theme":"light","logo_url":null,"favicon_url":null}'::jsonb, 'appearance', true),
  ('defaults', '{"default_packaging_type_id":null}'::jsonb, 'system', true)
ON CONFLICT (key) DO UPDATE 
  SET value = EXCLUDED.value, 
      category = EXCLUDED.category, 
      is_active = EXCLUDED.is_active, 
      updated_at = now();

-- ============================================
-- Storage buckets para biblioteca de mídia
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('material-media', 'material-media', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Tabela media_assets (metadados das mídias)
-- ============================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket      TEXT NOT NULL,
  path        TEXT NOT NULL,
  mime_type   TEXT,
  width       INT,
  height      INT,
  size_bytes  BIGINT,
  tags        JSONB,
  created_by  UUID DEFAULT auth.uid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_bucket_path 
  ON public.media_assets(bucket, path);
CREATE INDEX IF NOT EXISTS idx_media_tags_gin 
  ON public.media_assets USING gin(tags);

-- RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_select ON public.media_assets;
CREATE POLICY media_select ON public.media_assets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS media_insert ON public.media_assets;
CREATE POLICY media_insert ON public.media_assets
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS media_delete ON public.media_assets;
CREATE POLICY media_delete ON public.media_assets
  FOR DELETE USING (public.is_admin());

-- ============================================
-- Join table: material_sample_assets
-- ============================================
CREATE TABLE IF NOT EXISTS public.material_sample_assets (
  material_id UUID NOT NULL 
    REFERENCES public.config_basic_materials(id) ON DELETE CASCADE,
  asset_id    UUID NOT NULL 
    REFERENCES public.media_assets(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, asset_id)
);

-- RLS
ALTER TABLE public.material_sample_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS msa_select ON public.material_sample_assets;
CREATE POLICY msa_select ON public.material_sample_assets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS msa_insert ON public.material_sample_assets;
CREATE POLICY msa_insert ON public.material_sample_assets
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS msa_delete ON public.material_sample_assets;
CREATE POLICY msa_delete ON public.material_sample_assets
  FOR DELETE USING (public.is_admin());

-- ============================================
-- Políticas de Storage para leitura pública
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' 
      AND tablename='objects' 
      AND policyname='Public access to media buckets'
  ) THEN
    CREATE POLICY "Public access to media buckets"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('product-media', 'material-media'));
  END IF;
END $$;

-- Permitir INSERT/UPDATE/DELETE apenas para admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' 
      AND tablename='objects' 
      AND policyname='Admin upload to media buckets'
  ) THEN
    CREATE POLICY "Admin upload to media buckets"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id IN ('product-media', 'material-media') 
      AND public.is_admin()
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' 
      AND tablename='objects' 
      AND policyname='Admin delete from media buckets'
  ) THEN
    CREATE POLICY "Admin delete from media buckets"
    ON storage.objects FOR DELETE
    USING (
      bucket_id IN ('product-media', 'material-media') 
      AND public.is_admin()
    );
  END IF;
END $$;
