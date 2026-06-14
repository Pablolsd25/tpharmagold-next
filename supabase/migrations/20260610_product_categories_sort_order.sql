-- Orden manual por categoría (espejo del orden en colecciones Wix)
alter table product_categories
  add column if not exists sort_order integer not null default 0;

create index if not exists product_categories_category_sort_idx
  on product_categories (category_id, sort_order);

notify pgrst, 'reload schema';
