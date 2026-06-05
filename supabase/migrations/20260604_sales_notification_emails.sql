-- Correos para avisos de ventas (editable en Admin → Configuración)
INSERT INTO site_settings (key, value, updated_at)
VALUES ('sales_notification_emails', '[]', now())
ON CONFLICT (key) DO NOTHING;
