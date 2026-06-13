import type { SupabaseClient } from '@supabase/supabase-js'
import { CATEGORY_WITH_PRODUCT_COUNTS, getCategoryProductCount } from '@/lib/supabase/product-selects'
import type { Category } from '@/types'

type CategoryWithProductCounts = Category & {
  product_categories?: Array<{ count: number }>
  products?: Array<{ count: number }>
}

const HOME_FEATURED_SLUGS = ['mujeres', 'hombres'] as const

export async function getHomeFeaturedCategories(supabase: SupabaseClient) {
  const { data: rawCats } = await supabase
    .from('categories')
    .select(CATEGORY_WITH_PRODUCT_COUNTS)
    .order('name')

  const cats = (rawCats ?? []).filter((c) => getCategoryProductCount(c) > 0) as CategoryWithProductCounts[]
  const bySlug = new Map(cats.map((c) => [c.slug, c]))

  return HOME_FEATURED_SLUGS
    .map((slug) => bySlug.get(slug))
    .filter((c): c is CategoryWithProductCounts => Boolean(c))
}

export function buildHomeCategoryCards(categories: CategoryWithProductCounts[], totalProducts: number) {
  const themes: Record<string, { stripe: string; pillBg: string; pillText: string; pillBorder: string; cardBg: string; cardBorder: string; cardShadow: string; arrowColor: string; sub: string }> = {
    hombres: {
      sub: 'Suplementos y fórmulas para alto rendimiento',
      stripe: '#6366f1',
      pillBg: 'bg-indigo-500/20',
      pillText: 'text-indigo-300',
      pillBorder: 'border-indigo-500/40',
      cardBg: 'bg-gradient-to-br from-indigo-950/50 via-zinc-950 to-zinc-950',
      cardBorder: 'border-indigo-500/30',
      cardShadow: 'hover:shadow-[0_0_32px_rgba(99,102,241,0.18)]',
      arrowColor: 'group-hover:text-indigo-400',
    },
    mujeres: {
      sub: 'Pink Kit, proteínas y línea premium para ellas',
      stripe: '#ec4899',
      pillBg: 'bg-pink-500/20',
      pillText: 'text-pink-300',
      pillBorder: 'border-pink-500/40',
      cardBg: 'bg-gradient-to-br from-pink-950/50 via-zinc-950 to-zinc-950',
      cardBorder: 'border-pink-500/30',
      cardShadow: 'hover:shadow-[0_0_32px_rgba(236,72,153,0.18)]',
      arrowColor: 'group-hover:text-pink-400',
    },
    premium: {
      sub: 'Productos legendarios y más vendidos',
      stripe: '#f59e0b',
      pillBg: 'bg-amber-500/20',
      pillText: 'text-amber-300',
      pillBorder: 'border-amber-500/40',
      cardBg: 'bg-gradient-to-br from-amber-950/40 via-zinc-950 to-zinc-950',
      cardBorder: 'border-amber-500/30',
      cardShadow: 'hover:shadow-[0_0_32px_rgba(245,158,11,0.15)]',
      arrowColor: 'group-hover:text-amber-400',
    },
  }

  const defaultTheme = {
    sub: 'Explora esta línea de productos',
    stripe: '#D4AF37',
    pillBg: 'bg-wix-gold/15',
    pillText: 'text-wix-gold',
    pillBorder: 'border-wix-gold/35',
    cardBg: 'bg-gradient-to-br from-zinc-950 via-black to-zinc-950',
    cardBorder: 'border-wix-gold/20',
    cardShadow: 'hover:shadow-[0_0_32px_rgba(201,162,39,0.12)]',
    arrowColor: 'group-hover:text-wix-gold',
  }

  const cards = categories.slice(0, 2).map((cat) => {
    const theme = themes[cat.slug] ?? defaultTheme
    const count = getCategoryProductCount(cat)
    return {
      href: `/categoria/${cat.slug}`,
      label: cat.name,
      tag: `${count} Producto${count === 1 ? '' : 's'}`,
      ...theme,
    }
  })

  cards.push({
    href: '/tienda',
    label: 'Ver Tienda',
    sub: 'Todos nuestros productos disponibles',
    tag: `${totalProducts} Producto${totalProducts === 1 ? '' : 's'}`,
    stripe: '#D4AF37',
    pillBg: 'bg-wix-gold/15',
    pillText: 'text-wix-gold',
    pillBorder: 'border-wix-gold/35',
    cardBg: 'bg-gradient-to-br from-zinc-950 via-black to-zinc-950',
    cardBorder: 'border-wix-gold/20',
    cardShadow: 'hover:shadow-[0_0_32px_rgba(201,162,39,0.12)]',
    arrowColor: 'group-hover:text-wix-gold',
  })

  return cards
}
