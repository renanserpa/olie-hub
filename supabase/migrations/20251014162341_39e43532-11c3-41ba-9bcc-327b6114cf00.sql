-- Add new fields to products table for enhanced product details
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slugs for existing products based on SKU or name
UPDATE products 
SET slug = COALESCE(
  LOWER(REGEXP_REPLACE(sku, '[^a-zA-Z0-9]+', '-', 'g')),
  LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
)
WHERE slug IS NULL;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);