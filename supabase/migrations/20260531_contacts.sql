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
