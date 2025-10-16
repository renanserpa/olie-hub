-- Criar tabelas para status customizados
CREATE TABLE IF NOT EXISTS public.order_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-gray-100',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.production_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-gray-100',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shipping_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-gray-100',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir status padrão do sistema para pedidos
INSERT INTO public.order_statuses (name, label, color, is_system, sort_order) VALUES
  ('pending_payment', 'Aguardando Pagamento', 'bg-yellow-500', true, 1),
  ('paid', 'Pago', 'bg-green-500', true, 2),
  ('in_production', 'Em Produção', 'bg-blue-500', true, 3),
  ('awaiting_shipping', 'Pronto p/ Envio', 'bg-purple-500', true, 4),
  ('shipped', 'Enviado', 'bg-indigo-500', true, 5),
  ('delivered', 'Entregue', 'bg-emerald-500', true, 6),
  ('cancelled', 'Cancelado', 'bg-red-500', true, 7)
ON CONFLICT (name) DO NOTHING;

-- Inserir status padrão para produção
INSERT INTO public.production_statuses (name, label, color, is_system, sort_order) VALUES
  ('pending', 'Fila', 'bg-gray-500', true, 1),
  ('cutting', 'Corte', 'bg-red-500', true, 2),
  ('embroidery', 'Bordado', 'bg-pink-500', true, 3),
  ('sewing', 'Costura', 'bg-blue-500', true, 4),
  ('qa', 'Qualidade', 'bg-yellow-500', true, 5),
  ('packaging', 'Embalagem', 'bg-purple-500', true, 6),
  ('completed', 'Concluído', 'bg-green-500', true, 7)
ON CONFLICT (name) DO NOTHING;

-- Inserir status padrão para logística
INSERT INTO public.shipping_statuses (name, label, color, is_system, sort_order) VALUES
  ('pending', 'Aguardando Cotação', 'bg-gray-500', true, 1),
  ('quoted', 'Cotado', 'bg-blue-500', true, 2),
  ('label_created', 'Etiquetado', 'bg-purple-500', true, 3),
  ('in_transit', 'Em Trânsito', 'bg-yellow-500', true, 4),
  ('delivered', 'Entregue', 'bg-green-500', true, 5)
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.order_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_statuses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para order_statuses
CREATE POLICY "Admins podem gerenciar status de pedidos"
  ON public.order_statuses FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem ver status ativos de pedidos"
  ON public.order_statuses FOR SELECT
  USING (is_active = true);

-- Políticas RLS para production_statuses
CREATE POLICY "Admins podem gerenciar status de produção"
  ON public.production_statuses FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem ver status ativos de produção"
  ON public.production_statuses FOR SELECT
  USING (is_active = true);

-- Políticas RLS para shipping_statuses
CREATE POLICY "Admins podem gerenciar status de entregas"
  ON public.shipping_statuses FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem ver status ativos de entregas"
  ON public.shipping_statuses FOR SELECT
  USING (is_active = true);

-- Trigger para updated_at
CREATE TRIGGER update_order_statuses_updated_at
  BEFORE UPDATE ON public.order_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_production_statuses_updated_at
  BEFORE UPDATE ON public.production_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_statuses_updated_at
  BEFORE UPDATE ON public.shipping_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();