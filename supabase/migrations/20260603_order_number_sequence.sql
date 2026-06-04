ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS wix_order_number integer;

WITH numbered_orders AS (
  SELECT
    id,
    (SELECT COALESCE(MAX(wix_order_number), 0) FROM orders) + ROW_NUMBER() OVER (ORDER BY created_at, id) AS next_order_number
  FROM orders
  WHERE wix_order_number IS NULL
)
UPDATE orders
SET wix_order_number = numbered_orders.next_order_number
FROM numbered_orders
WHERE orders.id = numbered_orders.id;

CREATE UNIQUE INDEX IF NOT EXISTS orders_wix_order_number_unique_idx
  ON orders (wix_order_number)
  WHERE wix_order_number IS NOT NULL;

CREATE OR REPLACE FUNCTION set_next_wix_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.wix_order_number IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('orders_wix_order_number'));

    SELECT COALESCE(MAX(wix_order_number), 0) + 1
    INTO NEW.wix_order_number
    FROM orders;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_next_wix_order_number_before_insert ON orders;
CREATE TRIGGER set_next_wix_order_number_before_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_next_wix_order_number();