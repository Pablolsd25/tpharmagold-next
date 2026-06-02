-- Administradores del panel (NO usar tabla profiles para esto)
INSERT INTO site_settings (key, value, updated_at)
VALUES (
  'admin_emails',
  '["contacto@casaempire.net","marci_bun@hotmail.com","pablot_comercial.alamo@hotmail.com"]',
  now()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
