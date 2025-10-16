-- ============================================
-- OLIE OPS HUB - Database Schema
-- Sistema completo para gestão do Ateliê Olie
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ROLES E PERMISSÕES
-- ============================================

-- Tipo enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'atendimento', 'producao');

-- Tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- 2. PROFILES (dados adicionais dos usuários)
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. CONTACTS (Clientes)
-- ============================================

CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  cpf_cnpj TEXT,
  address JSONB, -- {street, number, complement, neighborhood, city, state, zip_code, country}
  notes TEXT,
  tags TEXT[],
  tiny_customer_id TEXT, -- ID do cliente no Tiny
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_contacts_phone ON public.contacts(phone);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_tiny_id ON public.contacts(tiny_customer_id);

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. PRODUCTS (Produtos e Estoque)
-- ============================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_quantity INTEGER DEFAULT 0,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  tiny_product_id TEXT, -- ID do produto no Tiny
  metadata JSONB, -- dados adicionais
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_tiny_id ON public.products(tiny_product_id);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. ORDERS (Pedidos)
-- ============================================

CREATE TYPE public.order_status AS ENUM (
  'pending_payment',
  'paid',
  'awaiting_production',
  'in_production',
  'awaiting_shipping',
  'shipped',
  'delivered',
  'cancelled'
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id),
  status order_status DEFAULT 'pending_payment',
  items JSONB NOT NULL, -- [{product_id, product_name, quantity, unit_price, total}]
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  
  -- Integração Tiny
  tiny_order_id TEXT,
  
  -- Informações de Pagamento
  payments JSONB, -- [{method, status, checkout_url, provider_ref, paid_at, amount}]
  
  -- Informações Fiscais (NFe)
  fiscal JSONB, -- {nfe_number, serie, xml_url, pdf_url, status, issued_at}
  
  -- Informações de Logística
  logistics JSONB, -- {mode, carrier, service, price, tracking, label_url, eta, shipped_at}
  
  -- Metadados
  source TEXT, -- 'whatsapp', 'instagram', 'website', 'manual'
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_contact ON public.orders(contact_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_tiny_id ON public.orders(tiny_order_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. PRODUCTION TASKS (Kanban de Produção)
-- ============================================

CREATE TYPE public.production_status AS ENUM (
  'pending',
  'cutting',
  'sewing',
  'finishing',
  'quality_check',
  'completed',
  'on_hold'
);

CREATE TABLE public.production_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status production_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0, -- maior = mais prioritário
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  attachments TEXT[], -- URLs de fotos/documentos
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_production_order ON public.production_tasks(order_id);
CREATE INDEX idx_production_status ON public.production_tasks(status);
CREATE INDEX idx_production_assigned ON public.production_tasks(assigned_to);
CREATE INDEX idx_production_due_date ON public.production_tasks(due_date);

CREATE TRIGGER update_production_tasks_updated_at
  BEFORE UPDATE ON public.production_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. MESSAGES (Comunicação Interna)
-- ============================================

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id),
  channel TEXT NOT NULL, -- 'general', 'producao', 'order:{order_id}'
  content TEXT NOT NULL,
  attachments TEXT[],
  mentions UUID[], -- IDs de usuários mencionados
  parent_id UUID REFERENCES public.messages(id), -- para threads
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_channel ON public.messages(channel);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- 8. TEMPLATES (Templates de Mensagens)
-- ============================================

CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- 'whatsapp', 'email', 'sms'
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[], -- placeholders disponíveis
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. INVENTORY MOVEMENTS (Movimentações de Estoque)
-- ============================================

CREATE TYPE public.movement_type AS ENUM ('in', 'out', 'adjustment');

CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  type movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID, -- order_id ou production_task_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_inventory_product ON public.inventory_movements(product_id);
CREATE INDEX idx_inventory_created_at ON public.inventory_movements(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Policies para USER_ROLES (apenas admins podem gerenciar)
CREATE POLICY "Admins podem gerenciar roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem ver suas próprias roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies para PROFILES
CREATE POLICY "Usuários podem ver todos os perfis"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policies para CONTACTS
CREATE POLICY "Usuários autenticados podem ver contatos"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar contatos"
  ON public.contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar contatos"
  ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies para PRODUCTS
CREATE POLICY "Usuários autenticados podem ver produtos"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar produtos"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies para ORDERS
CREATE POLICY "Usuários autenticados podem ver pedidos"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar pedidos"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar pedidos"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies para PRODUCTION_TASKS
CREATE POLICY "Usuários autenticados podem ver tarefas"
  ON public.production_tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Produção pode gerenciar tarefas"
  ON public.production_tasks
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'producao') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'producao') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Policies para MESSAGES
CREATE POLICY "Usuários autenticados podem ver mensagens"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem enviar mensagens"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Policies para TEMPLATES
CREATE POLICY "Usuários autenticados podem ver templates"
  ON public.templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem gerenciar templates"
  ON public.templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies para INVENTORY_MOVEMENTS
CREATE POLICY "Usuários autenticados podem ver movimentações"
  ON public.inventory_movements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem criar movimentações"
  ON public.inventory_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Gerar número de pedido automático
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  order_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.orders
  WHERE order_number LIKE 'OLIE-%';
  
  order_num := 'OLIE-' || LPAD(next_number::TEXT, 5, '0');
  RETURN order_num;
END;
$$;

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir templates padrão
INSERT INTO public.templates (name, category, subject, content, variables) VALUES
('Confirmação de Pedido', 'whatsapp', NULL, 
 'Olá {{customer_name}}! 🎉

Seu pedido #{{order_number}} foi confirmado com sucesso!

📦 Itens:
{{items}}

💰 Total: {{total}}

Em breve você receberá as informações de produção e envio.

— Olie · Ateliê',
 ARRAY['customer_name', 'order_number', 'items', 'total']),

('Pagamento Aprovado', 'whatsapp', NULL,
 'Oba! Pagamento aprovado! 💚

Pedido #{{order_number}} já está em produção.

Você pode acompanhar o andamento pelo nosso sistema.

— Olie · Ateliê',
 ARRAY['order_number']),

('Pedido Enviado', 'whatsapp', NULL,
 'Seu pedido saiu para entrega! 📦

🚚 Transportadora: {{carrier}}
📍 Código de rastreio: {{tracking}}

Acompanhe em: {{tracking_url}}

— Olie · Ateliê',
 ARRAY['carrier', 'tracking', 'tracking_url']);
