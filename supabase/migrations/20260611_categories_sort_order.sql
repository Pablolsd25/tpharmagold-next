-- Orden de categorías alineado con el menú Wix (MENÚ → Premium → … → Factores de Crecimiento)
alter table categories add column if not exists sort_order integer not null default 0;

create index if not exists categories_sort_order_idx on categories (sort_order);
