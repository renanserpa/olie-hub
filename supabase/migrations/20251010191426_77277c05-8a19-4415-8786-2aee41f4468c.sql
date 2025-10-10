-- Sprint 2: Adicionar config_json em production_tasks para visibilidade de configurações
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS config_json JSONB;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS product_sku TEXT;

-- Popular config_json a partir de orders.items quando houver order_id
UPDATE production_tasks pt
SET config_json = (
  SELECT (item->>'config')::jsonb
  FROM orders o,
  JSONB_ARRAY_ELEMENTS(o.items) item
  WHERE o.id = pt.order_id
  AND item->>'productName' = pt.product_name
  LIMIT 1
)
WHERE pt.order_id IS NOT NULL AND pt.config_json IS NULL;