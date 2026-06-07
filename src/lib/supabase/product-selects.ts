/** Categoría principal (products.category_id) — explícito por FK tras product_categories */
export const PRODUCT_WITH_CATEGORY =
  '*, category:categories!products_category_id_fkey(*)'

export const PRODUCT_WITH_CATEGORY_NAME =
  '*, category:categories!products_category_id_fkey(name)'

export const ADMIN_PRODUCT_LIST_SELECT =
  'id, name, slug, price, compare_at_price, is_active, images, category:categories!products_category_id_fkey(name), options:product_options(id, values:product_option_values(id))'
