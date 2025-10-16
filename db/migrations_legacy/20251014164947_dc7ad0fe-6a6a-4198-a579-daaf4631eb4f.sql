-- Criar bucket para SVGs
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-svgs', 'product-svgs', true);

-- Políticas de storage para SVGs
CREATE POLICY "Admins podem fazer upload de SVGs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-svgs' AND 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "SVGs são públicos para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-svgs');

CREATE POLICY "Admins podem deletar SVGs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-svgs' AND 
  has_role(auth.uid(), 'admin')
);

-- Tabela de mapeamento de SVG
CREATE TABLE public.product_svg_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  svg_url TEXT NOT NULL,
  svg_mapping JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_svg_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar SVG maps"
ON public.product_svg_maps FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados podem ver SVG maps"
ON public.product_svg_maps FOR SELECT
USING (true);

-- Tabela de cores de tecido
CREATE TABLE public.fabric_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  cmyk TEXT NOT NULL,
  stock_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  price_per_meter NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fabric_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar cores de tecido"
ON public.fabric_colors FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados podem ver cores de tecido ativas"
ON public.fabric_colors FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

-- Tabela de cores de zíper
CREATE TABLE public.zipper_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  cmyk TEXT NOT NULL,
  stock_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  price_delta NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.zipper_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar cores de zíper"
ON public.zipper_colors FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados podem ver cores de zíper ativas"
ON public.zipper_colors FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

-- Tabela de cores de forro
CREATE TABLE public.lining_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  cmyk TEXT NOT NULL,
  stock_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  price_per_meter NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lining_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar cores de forro"
ON public.lining_colors FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados podem ver cores de forro ativas"
ON public.lining_colors FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

-- Tabela de cores de viés
CREATE TABLE public.bias_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  cmyk TEXT NOT NULL,
  stock_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  price_per_meter NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bias_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar cores de viés"
ON public.bias_colors FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autenticados podem ver cores de viés ativas"
ON public.bias_colors FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

-- Tabela de configurações de produto (salvar configs dos clientes)
CREATE TABLE public.product_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  fabric_color_id UUID REFERENCES public.fabric_colors(id) ON DELETE SET NULL,
  zipper_color_id UUID REFERENCES public.zipper_colors(id) ON DELETE SET NULL,
  lining_color_id UUID REFERENCES public.lining_colors(id) ON DELETE SET NULL,
  bias_color_id UUID REFERENCES public.bias_colors(id) ON DELETE SET NULL,
  customization_text TEXT,
  preview_png_url TEXT,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  config_json JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem criar suas próprias configurações"
ON public.product_configurations FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Usuários podem ver suas próprias configurações"
ON public.product_configurations FOR SELECT
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem ver todas configurações"
ON public.product_configurations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Atualizar product_bom_items para incluir color_id
ALTER TABLE public.inventory_bom ADD COLUMN IF NOT EXISTS color_type TEXT;
ALTER TABLE public.inventory_bom ADD COLUMN IF NOT EXISTS color_id UUID;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_svg_maps_updated_at
BEFORE UPDATE ON public.product_svg_maps
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fabric_colors_updated_at
BEFORE UPDATE ON public.fabric_colors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zipper_colors_updated_at
BEFORE UPDATE ON public.zipper_colors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lining_colors_updated_at
BEFORE UPDATE ON public.lining_colors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bias_colors_updated_at
BEFORE UPDATE ON public.bias_colors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais de exemplo
INSERT INTO public.fabric_colors (name, hex, cmyk) VALUES
('Azul Marinho', '#001F3F', '100,70,0,75'),
('Vermelho Cardinal', '#C41E3A', '0,85,70,23'),
('Verde Oliva', '#556B2F', '50,0,70,58'),
('Preto', '#000000', '0,0,0,100'),
('Cinza Chumbo', '#4A4A4A', '0,0,0,71');

INSERT INTO public.zipper_colors (name, hex, cmyk, price_delta) VALUES
('Dourado', '#FFD700', '0,15,100,0', 2.50),
('Prateado', '#C0C0C0', '0,0,0,25', 1.50),
('Preto', '#000000', '0,0,0,100', 0),
('Branco', '#FFFFFF', '0,0,0,0', 0);

INSERT INTO public.lining_colors (name, hex, cmyk) VALUES
('Cetim Branco', '#F8F8F8', '0,0,0,3'),
('Cetim Creme', '#FFFDD0', '0,0,18,0'),
('Cetim Preto', '#1C1C1C', '0,0,0,89');

INSERT INTO public.bias_colors (name, hex, cmyk) VALUES
('Preto', '#000000', '0,0,0,100'),
('Branco', '#FFFFFF', '0,0,0,0'),
('Cinza', '#808080', '0,0,0,50');