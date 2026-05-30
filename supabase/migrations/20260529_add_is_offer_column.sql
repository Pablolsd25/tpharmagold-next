-- Migration: add is_offer flag to products table
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/frrdwgcycoeueavqhhqz/sql/new

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_offer boolean NOT NULL DEFAULT false;

-- Optional index so the /ofertas page query is fast
CREATE INDEX IF NOT EXISTS idx_products_is_offer ON products (is_offer)
  WHERE is_offer = true;
