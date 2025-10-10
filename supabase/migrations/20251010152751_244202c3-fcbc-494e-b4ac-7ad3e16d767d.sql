-- ==========================================
-- PHASE 3: E-commerce Sandbox + Testador
-- INTEGRATIONS_MODE="OFF" | network_calls=0
-- ==========================================

-- Product Media (imagens/vídeos)
CREATE TABLE IF NOT EXISTS public.product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  alt text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product media"
ON public.product_media FOR SELECT
USING (true);

CREATE POLICY "Admins can manage product media"
ON public.product_media FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Bill of Materials (BOM) - insumos por produto
CREATE TABLE IF NOT EXISTS public.inventory_bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  supply_product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity_per_unit numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'un',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_bom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view BOM"
ON public.inventory_bom FOR SELECT
USING (true);

CREATE POLICY "Admins can manage BOM"
ON public.inventory_bom FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Carts (carrinho de compras)
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own carts"
ON public.carts FOR SELECT
USING (user_id = auth.uid() OR session_id IS NOT NULL);

CREATE POLICY "Users can create carts"
ON public.carts FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own carts"
ON public.carts FOR UPDATE
USING (user_id = auth.uid() OR session_id IS NOT NULL);

-- Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  config_json jsonb,
  preview_png_url text,
  price_delta numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cart items"
ON public.cart_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.carts
  WHERE carts.id = cart_items.cart_id
  AND (carts.user_id = auth.uid() OR carts.session_id IS NOT NULL)
));

CREATE POLICY "Users can manage cart items"
ON public.cart_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.carts
  WHERE carts.id = cart_items.cart_id
  AND (carts.user_id = auth.uid() OR carts.session_id IS NOT NULL)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.carts
  WHERE carts.id = cart_items.cart_id
  AND (carts.user_id = auth.uid() OR carts.session_id IS NOT NULL)
));

-- Config Presets (configurações prontas para PDP inteligente)
CREATE TABLE IF NOT EXISTS public.config_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  config_json jsonb NOT NULL,
  preview_png_url text,
  price_delta numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.config_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active presets"
ON public.config_presets FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage presets"
ON public.config_presets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at em carts
CREATE TRIGGER update_carts_updated_at
BEFORE UPDATE ON public.carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON public.product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_bom_product_id ON public.inventory_bom(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_config_presets_product_id ON public.config_presets(product_id);