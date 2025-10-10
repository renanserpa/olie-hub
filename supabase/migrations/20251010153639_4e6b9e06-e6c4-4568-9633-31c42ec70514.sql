-- Add Tiny sync columns to existing tables
-- INTEGRATIONS_MODE="TINY_LIVE" | TINY_WRITE_MODE="READ_ONLY"

-- Contacts: tiny sync columns
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS tiny_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS tiny_hash text;

-- Products: tiny sync columns
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS tiny_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS tiny_hash text;

-- Orders: tiny sync columns
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tiny_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS tiny_hash text;

-- Create sync_logs table for tracking sync operations
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('contacts', 'products', 'orders')),
  operation text NOT NULL CHECK (operation IN ('dry_run', 'apply')),
  status text NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  items_processed integer NOT NULL DEFAULT 0,
  items_created integer NOT NULL DEFAULT 0,
  items_updated integer NOT NULL DEFAULT 0,
  items_skipped integer NOT NULL DEFAULT 0,
  api_calls_used integer NOT NULL DEFAULT 0,
  error_message text,
  summary jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs"
ON public.sync_logs FOR SELECT
USING (true);

CREATE POLICY "Admins can create sync logs"
ON public.sync_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_tiny_customer_id ON public.contacts(tiny_customer_id);
CREATE INDEX IF NOT EXISTS idx_products_tiny_product_id ON public.products(tiny_product_id);
CREATE INDEX IF NOT EXISTS idx_orders_tiny_order_id ON public.orders(tiny_order_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_entity_type ON public.sync_logs(entity_type);