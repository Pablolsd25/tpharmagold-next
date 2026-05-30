-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: Mejoras de checkout — Parte 4
-- Cómo ejecutar: Supabase Dashboard → SQL Editor → pegar y Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Columna idempotency_key en orders ─────────────────────────────────────
-- Previene cargos dobles si el usuario recarga o reintenta el formulario.
-- El cliente genera un UUID al cargar la página de checkout y lo envía siempre
-- con el mismo intento de compra. Si ya existe una orden con esa clave,
-- se retorna la orden existente sin volver a cobrar.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Índice UNIQUE parcial (solo filas no-NULL para no chocar con guest orders antiguas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ── 2. Función decrement_stock ────────────────────────────────────────────────
-- Decremento atómico de stock al confirmar una compra.
-- Usar stock = GREATEST(0, stock - qty) garantiza que nunca quede negativo.
-- Ejecutar vía: supabase.rpc('decrement_stock', { p_product_id, p_quantity })

CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_product_id;
END;
$$;

-- Dar permiso de ejecución al rol service_role (usado por el backend)
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INT) TO service_role;
