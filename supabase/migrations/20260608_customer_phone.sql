-- Teléfono del cliente en órdenes (checkout)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
