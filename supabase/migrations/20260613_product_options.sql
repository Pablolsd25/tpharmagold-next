-- Opciones de producto (variantes: sabor, color, etc.)
-- SOLO este archivo — NO ejecutar bootstrap.sql completo.
-- Luego: npm run migrate:variants

create table if not exists product_options (
  id          uuid        primary key default uuid_generate_v4(),
  product_id  uuid        not null references products(id) on delete cascade,
  name        text        not null,
  sort_order  integer     not null default 0,
  created_at  timestamptz default now()
);

create index if not exists product_options_product_id_idx
  on product_options (product_id);

create table if not exists product_option_values (
  id          uuid        primary key default uuid_generate_v4(),
  option_id   uuid        not null references product_options(id) on delete cascade,
  value       text        not null,
  sort_order  integer     not null default 0,
  created_at  timestamptz default now()
);

create index if not exists product_option_values_option_id_idx
  on product_option_values (option_id);

alter table product_options enable row level security;
alter table product_option_values enable row level security;

grant select on product_options to anon, authenticated;
grant select on product_option_values to anon, authenticated;

drop policy if exists product_options_public_read on product_options;
create policy product_options_public_read on product_options
  for select to anon, authenticated
  using (true);

drop policy if exists product_option_values_public_read on product_option_values;
create policy product_option_values_public_read on product_option_values
  for select to anon, authenticated
  using (true);

drop policy if exists service_role_product_options on product_options;
create policy service_role_product_options on product_options
  for all to service_role
  using (true) with check (true);

drop policy if exists service_role_product_option_values on product_option_values;
create policy service_role_product_option_values on product_option_values
  for all to service_role
  using (true) with check (true);

notify pgrst, 'reload schema';
