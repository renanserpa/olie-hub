-- Extensões (se necessário)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função utilitária updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- Paletas
CREATE TABLE IF NOT EXISTS public.config_color_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  descricao TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.config_color_palettes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_color_palettes' AND policyname='config_palettes_select') THEN
    CREATE POLICY config_palettes_select ON public.config_color_palettes FOR SELECT
      USING (is_active = true OR has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_color_palettes' AND policyname='config_palettes_insert') THEN
    CREATE POLICY config_palettes_insert ON public.config_color_palettes FOR INSERT
      WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_color_palettes' AND policyname='config_palettes_update') THEN
    CREATE POLICY config_palettes_update ON public.config_color_palettes FOR UPDATE
      USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_color_palettes' AND policyname='config_palettes_delete') THEN
    CREATE POLICY config_palettes_delete ON public.config_color_palettes FOR DELETE
      USING (has_role(auth.uid(),'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_upd_at_config_color_palettes ON public.config_color_palettes;
CREATE TRIGGER trg_upd_at_config_color_palettes
BEFORE UPDATE ON public.config_color_palettes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar palette_id nas 4 tabelas de cor (sem quebrar dado)
ALTER TABLE IF EXISTS public.fabric_colors ADD COLUMN IF NOT EXISTS palette_id UUID REFERENCES public.config_color_palettes(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.zipper_colors ADD COLUMN IF NOT EXISTS palette_id UUID REFERENCES public.config_color_palettes(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.lining_colors ADD COLUMN IF NOT EXISTS palette_id UUID REFERENCES public.config_color_palettes(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.bias_colors   ADD COLUMN IF NOT EXISTS palette_id UUID REFERENCES public.config_color_palettes(id) ON DELETE SET NULL;

-- Constraints HEX (se não existirem)
DO $$ BEGIN
  BEGIN ALTER TABLE public.fabric_colors ADD CONSTRAINT chk_fabric_colors_hex_fmt  CHECK (hex ~* '^#([0-9A-F]{6}|[0-9A-F]{8})$'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TABLE public.zipper_colors ADD CONSTRAINT chk_zipper_colors_hex_fmt  CHECK (hex ~* '^#([0-9A-F]{6}|[0-9A-F]{8})$'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TABLE public.lining_colors ADD CONSTRAINT chk_lining_colors_hex_fmt  CHECK (hex ~* '^#([0-9A-F]{6}|[0-9A-F]{8})$'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TABLE public.bias_colors   ADD CONSTRAINT chk_bias_colors_hex_fmt    CHECK (hex ~* '^#([0-9A-F]{6}|[0-9A-F]{8})$'); EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_fabric_colors_palette_name ON public.fabric_colors (palette_id, name);
CREATE INDEX IF NOT EXISTS idx_zipper_colors_palette_name ON public.zipper_colors (palette_id, name);
CREATE INDEX IF NOT EXISTS idx_lining_colors_palette_name ON public.lining_colors (palette_id, name);
CREATE INDEX IF NOT EXISTS idx_bias_colors_palette_name   ON public.bias_colors   (palette_id, name);

-- Texturas (exemplo de nova config)
DO $$ BEGIN CREATE TYPE fabric_texture_type AS ENUM ('plain','pattern','leather','synthetic','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.config_fabric_textures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  texture_type fabric_texture_type NOT NULL,
  repeat_json JSONB,
  thumbnail_url TEXT,
  tile_url TEXT,
  composition TEXT,
  care_instructions TEXT,
  palette_id UUID REFERENCES public.config_color_palettes(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_config_fabric_textures_codigo_fmt CHECK (codigo ~ '^[A-Z0-9_]{2,30}$')
);
ALTER TABLE public.config_fabric_textures ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_fabric_textures' AND policyname='textures_select') THEN
    CREATE POLICY textures_select ON public.config_fabric_textures FOR SELECT
      USING (is_active = true OR has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_fabric_textures' AND policyname='textures_insert') THEN
    CREATE POLICY textures_insert ON public.config_fabric_textures FOR INSERT
      WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_fabric_textures' AND policyname='textures_update') THEN
    CREATE POLICY textures_update ON public.config_fabric_textures FOR UPDATE
      USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_fabric_textures' AND policyname='textures_delete') THEN
    CREATE POLICY textures_delete ON public.config_fabric_textures FOR DELETE
      USING (has_role(auth.uid(),'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_upd_at_config_fabric_textures ON public.config_fabric_textures;
CREATE TRIGGER trg_upd_at_config_fabric_textures
BEFORE UPDATE ON public.config_fabric_textures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VIEW unificada de cores
CREATE OR REPLACE VIEW public.config_all_colors AS
  SELECT id, name, hex, cmyk, palette_id, 'fabric'::text AS color_type FROM public.fabric_colors
  UNION ALL SELECT id, name, hex, cmyk, palette_id, 'zipper'  FROM public.zipper_colors
  UNION ALL SELECT id, name, hex, cmyk, palette_id, 'lining'  FROM public.lining_colors
  UNION ALL SELECT id, name, hex, cmyk, palette_id, 'bias'    FROM public.bias_colors;

-- Ponte com estoque (se existir insumo)
DO $$ BEGIN
  ALTER TABLE public.config_component_options
    ADD COLUMN IF NOT EXISTS insumo_id UUID REFERENCES public.insumo(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
-- ==== CI/Local helpers (idempotentes) =====================================

-- 1) Garantir schema auth + função uid() (stub em ambientes sem Supabase)
CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  CREATE OR REPLACE FUNCTION auth.uid()
  RETURNS uuid
  LANGUAGE sql STABLE
AS $func$
  SELECT gen_random_uuid()
$func$;
EXCEPTION
  WHEN others THEN
    -- Se existir implementação gerenciada (Supabase), ignorar
    NULL;
END
$$;

-- 2) Garantir função has_role(uid, role) em ambientes de CI
DO $$
BEGIN
  CREATE FUNCTION public.has_role(uid uuid, role text)
  RETURNS boolean
  LANGUAGE sql STABLE
AS $func$
  SELECT false
$func$;
EXCEPTION
  WHEN duplicate_function THEN
    -- Já existe no projeto: manter a original
    NULL;
END
$$;

-- 3) Usuário de teste sem privilégios elevados (para validar RLS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'olie_app_user') THEN
    CREATE ROLE olie_app_user LOGIN PASSWORD 'test' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

-- 4) Grants mínimos para SELECT (RLS fará o filtro de linhas)
GRANT USAGE ON SCHEMA public TO olie_app_user;

GRANT SELECT ON TABLE public.config_color_palettes TO olie_app_user;
GRANT SELECT ON TABLE public.config_fabric_textures TO olie_app_user;

-- (se precisar testar mais tabelas, adicione GRANTs equivalentes)
