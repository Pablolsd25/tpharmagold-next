-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: campo tracking_number en orders
-- Propósito: guardar el número de guía del paquete cuando se envía el pedido.
--            Se muestra al cliente en /orden/[id] y se incluye en el email de envío.
-- Cómo ejecutar: Supabase Dashboard → SQL Editor → pegar y Run
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Índice útil si se necesita buscar órdenes por guía
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number
  ON orders (tracking_number)
  WHERE tracking_number IS NOT NULL;
