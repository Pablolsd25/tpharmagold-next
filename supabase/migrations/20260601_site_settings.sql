-- ============================================================
-- site_settings: tabla key/value para configuraciones del sitio
-- que son editables desde el panel admin (sin redeploy).
--
-- Aplicar en: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Valor inicial del costo de envío (MXN)
INSERT INTO site_settings (key, value)
VALUES ('shipping_cost', '250')
ON CONFLICT (key) DO NOTHING;

-- Deshabilitar RLS (solo el service role / admin accede a esta tabla)
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;
