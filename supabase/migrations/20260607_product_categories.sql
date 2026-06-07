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
