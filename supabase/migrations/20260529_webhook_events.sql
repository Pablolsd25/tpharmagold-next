-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: tabla webhook_events
-- Propósito: auditoría completa de todos los eventos recibidos de OpenPay
-- Cómo ejecutar: Supabase Dashboard → SQL Editor → pegar y ejecutar
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_events (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Tipo de evento OpenPay (ej: charge.succeeded, charge.failed, charge.chargeback.accepted)
  event_type       text        NOT NULL,

  -- ID de transacción de OpenPay (charge ID)
  transaction_id   text,

  -- UUID de la orden en nuestra DB (puede ser NULL si no se encontró)
  order_id         uuid        REFERENCES orders(id) ON DELETE SET NULL,

  -- Payload completo tal como llegó de OpenPay
  raw_payload      jsonb       NOT NULL DEFAULT '{}'::jsonb,

  -- Estado del procesamiento de este evento
  status           text        NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'ignored', 'error')),

  -- Si hubo error al procesar, el mensaje va aquí
  error_message    text,

  created_at       timestamptz DEFAULT now()
);

-- Índices para búsqueda eficiente en la vista admin
CREATE INDEX IF NOT EXISTS idx_webhook_events_transaction_id
  ON webhook_events (transaction_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type
  ON webhook_events (event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at
  ON webhook_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id
  ON webhook_events (order_id);

-- RLS: solo service_role (backend) puede leer y escribir
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si se re-ejecuta la migración
DROP POLICY IF EXISTS "service_role_all" ON webhook_events;

CREATE POLICY "service_role_all"
  ON webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
