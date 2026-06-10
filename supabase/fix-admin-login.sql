-- =============================================================================
-- ACCESO AL PANEL ADMIN — ejecutar en Supabase → SQL Editor
-- =============================================================================
-- La tabla "profiles" NO define quién es administrador.
-- Solo cuenta la clave "admin_emails" en "site_settings".
-- =============================================================================

INSERT INTO site_settings (key, value, updated_at)
VALUES (
  'admin_emails',
  '["contacto@tpharmagold.com"]',
  now()
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  updated_at = now();

-- Verificar lista de admins:
SELECT key, value FROM site_settings WHERE key = 'admin_emails';

-- Los usuarios en Authentication deben tener la MISMA contraseña que definas aquí.
-- Si solo uno entra, restablece contraseña en Admin → Usuarios (icono llave)
-- o ejecuta: ADMIN_SEED_PASSWORD='...' npx tsx scripts/ensure-admin-users.ts
