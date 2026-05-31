-- Costo de envío por producto (null = usar global $250 de site_settings)
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2) DEFAULT NULL;
