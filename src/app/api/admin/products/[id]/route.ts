import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { pickPrimaryCategoryId, syncProductCategories } from '@/lib/product-categories'

// PUT /api/admin/products/[id] — actualizar
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await checkAdminAccess()
  if (denied) return denied

  const { id } = await params
  const supabase = createAdminClient()
  const raw = await req.json()
  const categoryIds: string[] | undefined = Array.isArray(raw.category_ids)
    ? raw.category_ids
    : undefined

  const { data: categories } = await supabase.from('categories').select('id, name, slug')

  const body: Record<string, unknown> = {
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    price: raw.price,
    compare_at_price: raw.compare_at_price,
    shipping_cost: raw.shipping_cost,
    stock: raw.stock ?? 0,
    manage_stock: raw.manage_stock ?? false,
    images: raw.images,
    videos: raw.videos,
    tags: raw.tags,
    is_active: raw.is_active,
    is_offer: raw.is_offer,
    sort_order: raw.sort_order,
  }

  if (categoryIds !== undefined) {
    body.category_id = pickPrimaryCategoryId(categoryIds, categories ?? [])
  } else if (raw.category_id !== undefined) {
    body.category_id = raw.category_id
  }

  if (raw.cost !== undefined) body.cost = raw.cost

  const { data, error } = await supabase.from('products').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (categoryIds !== undefined) {
    const sync = await syncProductCategories(supabase, id, categoryIds, categories ?? [])
    if (sync.error) return NextResponse.json({ error: sync.error }, { status: 400 })
  }

  return NextResponse.json(data)
}

// DELETE /api/admin/products/[id] — eliminar
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await checkAdminAccess()
  if (denied) return denied

  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
