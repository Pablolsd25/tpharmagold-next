import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadProductCategoryIds, syncProductCategories } from '@/lib/product-categories'

// POST /api/admin/categories/[id]/products
// Body: { add?: string[], remove?: string[] }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await checkAdminAccess()
  if (denied) return denied

  const { id: categoryId } = await params
  const { add = [], remove = [] } = await req.json().catch(() => ({}))
  const supabase = createAdminClient()
  const { data: categories } = await supabase.from('categories').select('id, name, slug')

  const updateProduct = async (productId: string, nextIds: string[]) => {
    const sync = await syncProductCategories(supabase, productId, nextIds, categories ?? [])
    if (sync.error) throw new Error(sync.error)
  }

  try {
    if (Array.isArray(add)) {
      for (const productId of add) {
        const { data: product } = await supabase
          .from('products')
          .select('category_id')
          .eq('id', productId)
          .single()
        if (!product) continue

        const current = await loadProductCategoryIds(supabase, productId, product.category_id)
        if (current.includes(categoryId)) continue
        await updateProduct(productId, [...current, categoryId])
      }
    }

    if (Array.isArray(remove)) {
      for (const productId of remove) {
        const { data: product } = await supabase
          .from('products')
          .select('category_id')
          .eq('id', productId)
          .single()
        if (!product) continue

        const current = await loadProductCategoryIds(supabase, productId, product.category_id)
        await updateProduct(
          productId,
          current.filter((id) => id !== categoryId),
        )
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar categorías'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
