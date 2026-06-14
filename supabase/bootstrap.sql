-- ============================================================
-- T Pharma Gold — Bootstrap completo para proyecto Supabase NUEVO
-- Pegar en: Supabase Dashboard → SQL Editor → Run
-- Generado automáticamente. No editar a mano.
-- ============================================================

-- =============================================
-- T Pharma Gold — Schema de Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- =============================================
-- CATEGORÍAS
-- =============================================
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  created_at  timestamptz default now()
);

-- =============================================
-- PRODUCTOS
-- =============================================
create table if not exists products (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  slug             text not null unique,
  description      text,
  price            numeric(10,2) not null,
  compare_at_price numeric(10,2),
  stock            integer not null default 0,
  manage_stock     boolean not null default false,
  category_id      uuid references categories(id) on delete set null,
  images           text[] default '{}',
  tags             text[] default '{}',
  is_active        boolean default true,
  sort_order       integer default 0,
  created_at       timestamptz default now()
);

-- =============================================
-- PERFILES (extiende auth.users de Supabase)
-- =============================================
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  phone      text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Trigger para crear perfil automáticamente al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================
-- DIRECCIONES
-- =============================================
create table if not exists addresses (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid references profiles(id) on delete cascade,
  alias       text not null default 'Casa',
  street      text not null,
  city        text not null,
  state       text not null,
  zip_code    text not null,
  country     text not null default 'México',
  is_default  boolean default false,
  created_at  timestamptz default now()
);

-- =============================================
-- ÓRDENES
-- =============================================
create table if not exists orders (
  id                      uuid primary key default uuid_generate_v4(),
  profile_id              uuid references profiles(id) on delete set null,
  status                  text not null default 'pending'
                          check (status in ('pending','paid','shipped','delivered','cancelled')),
  subtotal                numeric(10,2) not null,
  shipping_cost           numeric(10,2) not null default 99,
  total                   numeric(10,2) not null,
  openpay_transaction_id  text,
  shipping_address        jsonb,
  customer_email          text,
  customer_name           text,
  customer_phone          text,
  wix_order_number        integer,
  created_at              timestamptz default now()
);

create unique index if not exists orders_wix_order_number_unique_idx
  on orders (wix_order_number)
  where wix_order_number is not null;

create or replace function set_next_wix_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.wix_order_number is null then
    perform pg_advisory_xact_lock(hashtext('orders_wix_order_number'));

    select coalesce(max(wix_order_number), 0) + 1
    into new.wix_order_number
    from orders;
  end if;

  return new;
end;
$$;

drop trigger if exists set_next_wix_order_number_before_insert on orders;
create trigger set_next_wix_order_number_before_insert
  before insert on orders
  for each row
  execute function set_next_wix_order_number();

-- =============================================
-- ITEMS DE ÓRDENES
-- =============================================
create table if not exists order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  quantity    integer not null,
  unit_price  numeric(10,2) not null
);

-- =============================================
-- BLOG
-- =============================================
create table if not exists blog_posts (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  slug         text not null unique,
  excerpt      text,
  content      text not null default '',
  cover_image  text,
  is_published boolean default false,
  published_at timestamptz,
  created_at   timestamptz default now()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
alter table categories  enable row level security;
alter table products    enable row level security;
alter table profiles    enable row level security;
alter table addresses   enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table blog_posts  enable row level security;

-- Lectura pública: categorías, productos activos, blog publicado
create policy "Categorias publicas" on categories for select using (true);
create policy "Productos activos publicos" on products for select using (is_active = true);
create policy "Blog publicado publico" on blog_posts for select using (is_published = true);

-- Perfiles: cada usuario solo ve y edita el suyo
create policy "Perfil propio" on profiles for all using (auth.uid() = id);

-- Direcciones: solo el dueño
create policy "Direcciones propias" on addresses for all using (auth.uid() = profile_id);

-- Órdenes: solo el dueño
create policy "Ordenes propias" on orders for select using (auth.uid() = profile_id);
create policy "Crear orden autenticado" on orders for insert with check (auth.uid() = profile_id);

-- Order items: visibles si la orden es del usuario
create policy "Items de orden propios" on order_items for select
  using (exists (
    select 1 from orders where orders.id = order_items.order_id and orders.profile_id = auth.uid()
  ));

-- =============================================
-- DATOS DE EJEMPLO (categorías)
-- =============================================
insert into categories (name, slug, description) values
  ('Nutrición Hombre', 'hombres',  'Suplementos y nutrición para hombres'),
  ('Nutrición Mujer',  'mujeres',  'Suplementos y nutrición para mujeres'),
  ('Ofertas',          'ofertas',  'Productos en oferta')
on conflict (slug) do nothing;

-- ── migration: 20260529_add_is_offer_column.sql ──
-- Migration: add is_offer flag to products table
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/frrdwgcycoeueavqhhqz/sql/new

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_offer boolean NOT NULL DEFAULT false;

-- Optional index so the /ofertas page query is fast
CREATE INDEX IF NOT EXISTS idx_products_is_offer ON products (is_offer)
  WHERE is_offer = true;

-- ── migration: 20260529_add_videos_column.sql ──
-- Migration: add videos column to products table
-- Run this once in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/frrdwgcycoeueavqhhqz/sql/new

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';

-- ── migration: 20260529_checkout_improvements.sql ──
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

-- ── migration: 20260529_fix_ofertas.sql ──
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

-- ── migration: 20260529_tracking_number.sql ──
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

-- ── migration: 20260529_webhook_events.sql ──
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

-- ── migration: 20260530_add_order_display_fields.sql ──
-- Migration: Add wix_order_number and customer_name columns to orders table
-- Apply this in: https://supabase.com/dashboard/project/frrdwgcycoeueavqhhqz/sql/new

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS wix_order_number integer,
  ADD COLUMN IF NOT EXISTS customer_name    text;

-- Index for fast sorting by Wix order number
CREATE INDEX IF NOT EXISTS orders_wix_order_number_idx
  ON orders (wix_order_number DESC NULLS LAST);

-- ── migration: 20260530_add_wix_id_column.sql ──
-- Añade columna wix_id a products para poder linkear órdenes históricas de Wix
-- a los productos migrados en Supabase.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS wix_id text;

-- Índice para búsqueda rápida por wix_id (usado en migrate-orders.ts)
CREATE INDEX IF NOT EXISTS idx_products_wix_id ON products (wix_id);

-- ── migration: 20260530_order_items_name_image.sql ──
-- Adds name and product_image to order_items so product details
-- from Wix can be stored and displayed in the admin orders table.
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS name          text,
  ADD COLUMN IF NOT EXISTS product_image text;

-- ── migration: 20260531_add_cost_to_products.sql ──
-- Añade columna cost (costo de la mercancía) a products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost numeric(10,2) DEFAULT NULL;

-- ── migration: 20260531_contact_submissions.sql ──
-- ============================================================
-- 20260531_contact_submissions.sql
-- Tabla para persistir mensajes del formulario de contacto
-- Aplicar en: https://supabase.com/dashboard/project/frrdwgcycoeueavqhhqz/sql/new
-- ============================================================

create table if not exists contact_submissions (
  id         uuid        primary key default uuid_generate_v4(),
  nombre     text,
  apellido   text,
  email      text        not null,
  whatsapp   text,
  mensaje    text        not null,
  leido      boolean     not null default false,
  created_at timestamptz default now()
);

create index if not exists contact_submissions_leido_idx on contact_submissions (leido);
create index if not exists contact_submissions_created_idx on contact_submissions (created_at desc);

-- ── migration: 20260531_contacts.sql ──
-- ============================================================
-- 20260531_contacts.sql
-- Tabla de contactos/clientes migrados desde Wix CRM
-- Aplicar manualmente en:
-- https://supabase.com/dashboard/project/frrdwgcycoeueavqhhqz/sql/new
-- ============================================================

create table if not exists contacts (
  id                uuid        primary key default uuid_generate_v4(),
  wix_contact_id    text        unique,
  first_name        text,
  last_name         text,
  email             text,
  phone             text,
  labels            text[]      default '{}',
  subscriber_status text,
  source            text,
  raw               jsonb,
  wix_created_date  timestamptz,
  created_at        timestamptz default now()
);

create index if not exists contacts_email_idx      on contacts (email);
create index if not exists contacts_name_idx       on contacts (first_name, last_name);
create index if not exists contacts_wix_id_idx     on contacts (wix_contact_id);

-- ── migration: 20260531_coupons.sql ──
-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: Sistema de cupones
-- Cómo ejecutar: Supabase Dashboard → SQL Editor → pegar y Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Tabla coupons ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text UNIQUE NOT NULL,
  type         text NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
  value        numeric(10,2) NOT NULL DEFAULT 0,   -- % (0-100) o monto $; ignorado en free_shipping
  min_purchase numeric(10,2) NOT NULL DEFAULT 0,   -- compra mínima (subtotal) para aplicar
  max_uses     int,                                -- NULL = ilimitado
  used_count   int NOT NULL DEFAULT 0,
  expires_at   timestamptz,                        -- NULL = sin expiración
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Búsqueda case-insensitive por código
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_lower ON coupons (lower(code));

-- RLS: la validación corre 100% server-side con service_role, así que
-- bloqueamos todo acceso público. service_role omite RLS por defecto.
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- ── 2. Columnas de descuento en orders ────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount    numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;

-- ── 3. Incremento atómico de uso ──────────────────────────────────────────────
-- Devuelve true si pudo incrementar (cupón válido y bajo el límite), false si no.
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected int;
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE lower(code) = lower(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR used_count < max_uses);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_coupon_usage(text) TO service_role;

-- ── migration: 20260531_reviews.sql ──
-- ============================================================
-- 20260531_reviews.sql
-- Tabla de reseñas de productos
-- Aplicar en: https://supabase.com/dashboard/project/frrdwgcycoeueavqhhqz/sql/new
-- ============================================================

create table if not exists reviews (
  id              uuid        primary key default uuid_generate_v4(),
  product_id      uuid        references products(id) on delete cascade,
  wix_review_id   text        unique,
  reviewer_name   text,
  reviewer_email  text,
  rating          integer     not null check (rating between 1 and 5),
  title           text,
  comment         text,
  is_approved     boolean     not null default false,
  wix_created_date timestamptz,
  created_at      timestamptz default now()
);

create index if not exists reviews_product_id_idx  on reviews (product_id);
create index if not exists reviews_is_approved_idx on reviews (is_approved);
create index if not exists reviews_rating_idx      on reviews (rating);

-- ── migration: 20260601_add_sort_order.sql ──
-- Add sort_order column to products table for manual ordering control
alter table products add column if not exists sort_order integer default 0;

-- ── migration: 20260601_customer_fixes.sql ──
-- Nuevos campos de dirección mexicana en tabla addresses
ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS num_exterior text,
  ADD COLUMN IF NOT EXISTS num_interior text,
  ADD COLUMN IF NOT EXISTS colonia      text,
  ADD COLUMN IF NOT EXISTS municipio    text,
  ADD COLUMN IF NOT EXISTS referencias  text;

-- Trigger: copiar full_name del user_metadata al crear perfil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── migration: 20260601_order_notes.sql ──
-- Agregar columna de nota interna en órdenes
-- Aplicar en: Supabase Dashboard → SQL Editor
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;

-- ── migration: 20260601_product_shipping.sql ──
-- Costo de envío por producto (null = usar global $250 de site_settings)
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2) DEFAULT NULL;

-- ── migration: 20260601_site_settings.sql ──
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

-- ── migration: 20260602_admin_emails.sql ──
-- Lista de administradores gestionada desde el panel (JSON array de emails)
INSERT INTO site_settings (key, value)
VALUES (
  'admin_emails',
  '["contacto@tpharmagold.com"]'
)
ON CONFLICT (key) DO NOTHING;

-- ── migration: 20260602_home_video_settings.sql ──
-- URLs del video de portada (editables desde admin → Configuración)
INSERT INTO site_settings (key, value)
VALUES
  ('home_video_480',  'https://video.wixstatic.com/video/98134b_6dd464ad60084e9aae7151a182b7f2fc/480p/mp4/file.mp4'),
  ('home_video_1080', 'https://video.wixstatic.com/video/98134b_6dd464ad60084e9aae7151a182b7f2fc/480p/mp4/file.mp4')
ON CONFLICT (key) DO NOTHING;

-- ── migration: 20260603_admin_emails_seed.sql ──
-- Administradores del panel (NO usar tabla profiles para esto)
INSERT INTO site_settings (key, value, updated_at)
VALUES (
  'admin_emails',
  '["contacto@tpharmagold.com"]',
  now()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;

-- ── migration: 20260603_order_number_sequence.sql ──
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

-- ── migration: 20260604_sales_notification_emails.sql ──
-- Correos para avisos de ventas (editable en Admin → Configuración)
INSERT INTO site_settings (key, value, updated_at)
VALUES ('sales_notification_emails', '[]', now())
ON CONFLICT (key) DO NOTHING;

-- ── migration: 20260605_rls_contact_reviews.sql ──
-- RLS para tablas sin políticas: solo service_role (backend) puede acceder.
-- El cliente anon/authenticated no tiene políticas → acceso denegado por defecto.

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Revocar acceso directo de roles públicos si existiera por grants heredados
REVOKE ALL ON contact_submissions FROM anon, authenticated;
REVOKE ALL ON contacts FROM anon, authenticated;
REVOKE ALL ON reviews FROM anon, authenticated;

-- service_role omite RLS; estas políticas documentan la intención
CREATE POLICY service_role_contact_submissions ON contact_submissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_contacts ON contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_reviews ON reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── migration: 20260607_product_categories.sql ──
-- Productos en varias categorías (ej. Women's Nutrition + Nuestras Ofertas)

create table if not exists product_categories (
  product_id  uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create index if not exists product_categories_category_id_idx
  on product_categories (category_id);

insert into product_categories (product_id, category_id)
select id, category_id
from products
where category_id is not null
on conflict do nothing;

alter table product_categories enable row level security;

grant select on product_categories to anon, authenticated;

create policy product_categories_public_read on product_categories
  for select to anon, authenticated
  using (true);

create policy service_role_product_categories on product_categories
  for all to service_role
  using (true) with check (true);

-- Refrescar cache del API de Supabase
notify pgrst, 'reload schema';

-- ── migration: 20260607_reviews_public_read.sql ──
-- Reseñas aprobadas visibles en tienda; escritura solo vía API (service_role)

GRANT SELECT ON reviews TO anon, authenticated;

CREATE POLICY reviews_select_approved ON reviews
  FOR SELECT TO anon, authenticated
  USING (is_approved = true);

-- ── migration: 20260608_confirmation_email_sent.sql ──
-- Marca si ya se envió la confirmación al cliente (evita duplicados y permite reintento vía webhook)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;

-- ── migration: 20260608_customer_phone.sql ──
-- Teléfono del cliente en órdenes (checkout)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;

-- ── migration: 20260610_product_categories_sort_order.sql ──
alter table product_categories
  add column if not exists sort_order integer not null default 0;

create index if not exists product_categories_category_sort_idx
  on product_categories (category_id, sort_order);

