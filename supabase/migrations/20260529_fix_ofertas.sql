-- ============================================================
-- FIX OFERTAS  —  ejecutar en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/frrdwgcycoeueavqhhqz/sql/new
-- ============================================================

-- 1. Agregar columna is_offer (si no existe)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_offer boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_offer
  ON products (is_offer)
  WHERE is_offer = true;

-- 2. Marcar los 3 productos de "Nuestras Ofertas" como is_offer = true
UPDATE products
SET is_offer = true
WHERE
  name ILIKE '%PINK KIT%PIERNAS%'
  OR name ILIKE '%PINK KIT%CADERAS%'
  OR name ILIKE '%PEACH%REDUCTOR%'
  OR name ILIKE '%EXTREME PINK KIT%';

-- 3. Verificar — debe mostrar los 3 productos marcados
SELECT id, name, is_offer
FROM products
WHERE is_offer = true;
