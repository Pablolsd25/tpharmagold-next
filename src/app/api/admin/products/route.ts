import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getProductIdsInCategory,
  pickPrimaryCategoryId,
  syncProductCategories,
} from '@/lib/product-categories'

// GET /api/admin/products — lista (para pickers/asignación). Soporta ?q= y ?cat=
export async function GET(req: NextRequest) {
  const denied = await checkAdminAccess()
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const q   = searchParams.get('q')
  const cat = searchParams.get('cat')

  const supabase = createAdminClient()
  let query = supabase
    .from('products')
    .select('id, name, slug, price, images, category_id, is_active')
    .order('name')

  if (q) query = query.ilike('name', `%${q}%`)

  if (cat) {
    const ids = await getProductIdsInCategory(supabase, cat)
    if (ids.length === 0) return NextResponse.json([])
    query = query.in('id', ids)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST /api/admin/products — crear producto
export async function POST(req: NextRequest) {
  const denied = await checkAdminAccess()
  if (denied) return denied

  const supabase = createAdminClient()
  const raw = await req.json()
  const categoryIds: string[] = Array.isArray(raw.category_ids) ? raw.category_ids : []

  const { data: categories } = await supabase.from('categories').select('id, name, slug')
  const primaryId = pickPrimaryCategoryId(categoryIds, categories ?? [])

  const body = { ...raw }
  delete body.category_ids
  body.category_id = primaryId

  const { data, error } = await supabase.from('products').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const sync = await syncProductCategories(
    supabase,
    data.id,
    categoryIds,
    categories ?? [],
  )
  if (sync.error) return NextResponse.json({ error: sync.error }, { status: 400 })

  return NextResponse.json(data, { status: 201 })
}
