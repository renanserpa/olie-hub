-- ENUMs (idempotent)
DO $$ BEGIN CREATE TYPE material_unit AS ENUM ('pc','m','cm','mm','g','kg','ml','l'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE customization_type AS ENUM ('bordado','laser','monograma','patch','sublimacao','aplicacao','outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE component_type AS ENUM ('ziper','cursor_puxador','forro','tecido_externo','vies','alca','ferragem','etiqueta','outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Supply Groups
CREATE TABLE IF NOT EXISTS public.config_supply_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_config_supply_groups_codigo_fmt CHECK (codigo ~ '^[A-Z0-9_]{2,30}$')
);
ALTER TABLE public.config_supply_groups ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_supply_groups' AND policyname='config_supply_groups_select') THEN
    CREATE POLICY config_supply_groups_select ON public.config_supply_groups FOR SELECT
      USING (is_active = true OR has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_supply_groups' AND policyname='config_supply_groups_insert') THEN
    CREATE POLICY config_supply_groups_insert ON public.config_supply_groups FOR INSERT
      WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_supply_groups' AND policyname='config_supply_groups_update') THEN
    CREATE POLICY config_supply_groups_update ON public.config_supply_groups FOR UPDATE
      USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_supply_groups' AND policyname='config_supply_groups_delete') THEN
    CREATE POLICY config_supply_groups_delete ON public.config_supply_groups FOR DELETE
      USING (has_role(auth.uid(),'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_upd_at_config_supply_groups ON public.config_supply_groups;
CREATE TRIGGER trg_upd_at_config_supply_groups
BEFORE UPDATE ON public.config_supply_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_config_supply_groups_lower_name ON public.config_supply_groups ((lower(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_supply_groups_codigo ON public.config_supply_groups (codigo);

-- Basic Materials
CREATE TABLE IF NOT EXISTS public.config_basic_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  unit material_unit NOT NULL,
  default_cost NUMERIC(12,2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  supply_group_id UUID REFERENCES public.config_supply_groups(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_config_basic_materials_codigo_fmt CHECK (codigo ~ '^[A-Z0-9_]{2,30}$')
);
ALTER TABLE public.config_basic_materials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_basic_materials' AND policyname='config_basic_materials_select') THEN
    CREATE POLICY config_basic_materials_select ON public.config_basic_materials FOR SELECT
      USING (is_active = true OR has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_basic_materials' AND policyname='config_basic_materials_insert') THEN
    CREATE POLICY config_basic_materials_insert ON public.config_basic_materials FOR INSERT
      WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_basic_materials' AND policyname='config_basic_materials_update') THEN
    CREATE POLICY config_basic_materials_update ON public.config_basic_materials FOR UPDATE
      USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_basic_materials' AND policyname='config_basic_materials_delete') THEN
    CREATE POLICY config_basic_materials_delete ON public.config_basic_materials FOR DELETE
      USING (has_role(auth.uid(),'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_upd_at_config_basic_materials ON public.config_basic_materials;
CREATE TRIGGER trg_upd_at_config_basic_materials
BEFORE UPDATE ON public.config_basic_materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_config_basic_materials_lower_name ON public.config_basic_materials ((lower(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_basic_materials_codigo ON public.config_basic_materials (codigo);
CREATE INDEX IF NOT EXISTS idx_config_basic_materials_supply_group_id ON public.config_basic_materials (supply_group_id);

-- Packaging Types
CREATE TABLE IF NOT EXISTS public.config_packaging_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  dimensions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  material TEXT,
  capacity TEXT,
  weight_limit_g INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_config_packaging_types_codigo_fmt CHECK (codigo ~ '^[A-Z0-9_]{2,30}$')
);
ALTER TABLE public.config_packaging_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_packaging_types' AND policyname='config_packaging_types_select') THEN
    CREATE POLICY config_packaging_types_select ON public.config_packaging_types FOR SELECT
      USING (is_active = true OR has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_packaging_types' AND policyname='config_packaging_types_insert') THEN
    CREATE POLICY config_packaging_types_insert ON public.config_packaging_types FOR INSERT
      WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_packaging_types' AND policyname='config_packaging_types_update') THEN
    CREATE POLICY config_packaging_types_update ON public.config_packaging_types FOR UPDATE
      USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_packaging_types' AND policyname='config_packaging_types_delete') THEN
    CREATE POLICY config_packaging_types_delete ON public.config_packaging_types FOR DELETE
      USING (has_role(auth.uid(),'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_upd_at_config_packaging_types ON public.config_packaging_types;
CREATE TRIGGER trg_upd_at_config_packaging_types
BEFORE UPDATE ON public.config_packaging_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_config_packaging_types_lower_name ON public.config_packaging_types ((lower(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_packaging_types_codigo ON public.config_packaging_types (codigo);

-- Bond Types
CREATE TABLE IF NOT EXISTS public.config_bond_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  payroll_effects_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_config_bond_types_codigo_fmt CHECK (codigo ~ '^[A-Z0-9_]{2,30}$')
);
ALTER TABLE public.config_bond_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_bond_types' AND policyname='config_bond_types_select') THEN
    CREATE POLICY config_bond_types_select ON public.config_bond_types FOR SELECT
      USING (is_active = true OR has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_bond_types' AND policyname='config_bond_types_insert') THEN
    CREATE POLICY config_bond_types_insert ON public.config_bond_types FOR INSERT
      WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_bond_types' AND policyname='config_bond_types_update') THEN
    CREATE POLICY config_bond_types_update ON public.config_bond_types FOR UPDATE
      USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_bond_types' AND policyname='config_bond_types_delete') THEN
    CREATE POLICY config_bond_types_delete ON public.config_bond_types FOR DELETE
      USING (has_role(auth.uid(),'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_upd_at_config_bond_types ON public.config_bond_types;
CREATE TRIGGER trg_upd_at_config_bond_types
BEFORE UPDATE ON public.config_bond_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_config_bond_types_lower_name ON public.config_bond_types ((lower(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_bond_types_codigo ON public.config_bond_types (codigo);

-- Customization Components
CREATE TABLE IF NOT EXISTS public.config_customization_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  type customization_type NOT NULL,
  allowed_positions_json JSONB[] DEFAULT ARRAY[]::JSONB[],
  max_colors INTEGER,
  price_extra NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_config_customization_components_codigo_fmt CHECK (codigo ~ '^[A-Z0-9_]{2,30}$')
);
ALTER TABLE public.config_customization_components ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_customization_components' AND policyname='config_customization_components_select') THEN
    CREATE POLICY config_customization_components_select ON public.config_customization_components FOR SELECT
      USING (is_active = true OR has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_customization_components' AND policyname='config_customization_components_insert') THEN
    CREATE POLICY config_customization_components_insert ON public.config_customization_components FOR INSERT
      WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_customization_components' AND policyname='config_customization_components_update') THEN
    CREATE POLICY config_customization_components_update ON public.config_customization_components FOR UPDATE
      USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_customization_components' AND policyname='config_customization_components_delete') THEN
    CREATE POLICY config_customization_components_delete ON public.config_customization_components FOR DELETE
      USING (has_role(auth.uid(),'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_upd_at_config_customization_components ON public.config_customization_components;
CREATE TRIGGER trg_upd_at_config_customization_components
BEFORE UPDATE ON public.config_customization_components
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_config_customization_components_lower_name ON public.config_customization_components ((lower(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_customization_components_codigo ON public.config_customization_components (codigo);

-- Component Options
CREATE TABLE IF NOT EXISTS public.config_component_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  component_type component_type NOT NULL,
  compatible_products_json JSONB[] DEFAULT ARRAY[]::JSONB[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  insumo_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_config_component_options_codigo_fmt CHECK (codigo ~ '^[A-Z0-9_]{2,30}$')
);
ALTER TABLE public.config_component_options ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_component_options' AND policyname='config_component_options_select') THEN
    CREATE POLICY config_component_options_select ON public.config_component_options FOR SELECT
      USING (is_active = true OR has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_component_options' AND policyname='config_component_options_insert') THEN
    CREATE POLICY config_component_options_insert ON public.config_component_options FOR INSERT
      WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_component_options' AND policyname='config_component_options_update') THEN
    CREATE POLICY config_component_options_update ON public.config_component_options FOR UPDATE
      USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config_component_options' AND policyname='config_component_options_delete') THEN
    CREATE POLICY config_component_options_delete ON public.config_component_options FOR DELETE
      USING (has_role(auth.uid(),'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_upd_at_config_component_options ON public.config_component_options;
CREATE TRIGGER trg_upd_at_config_component_options
BEFORE UPDATE ON public.config_component_options
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_config_component_options_lower_name ON public.config_component_options ((lower(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_component_options_codigo ON public.config_component_options (codigo);
CREATE INDEX IF NOT EXISTS idx_config_component_options_insumo_id ON public.config_component_options (insumo_id);

DO $$ BEGIN
  BEGIN
    ALTER TABLE public.config_component_options
      ADD CONSTRAINT fk_config_component_options_insumo
      FOREIGN KEY (insumo_id) REFERENCES public.insumo(id) ON DELETE SET NULL;
  EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN duplicate_object THEN NULL;
  END;
END $$;
