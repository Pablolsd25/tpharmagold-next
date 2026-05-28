import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ProductForm from '../ProductForm'

export const metadata = { title: 'Editar Producto | Admin' }

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name').order('name'),
  ])

  if (!product) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-white font-display font-bold text-3xl uppercase tracking-wide">Editar Producto</h1>
        <p className="text-zinc-500 text-sm mt-1 truncate">{product.name}</p>
      </div>
      <ProductForm product={product} categories={categories ?? []} />
    </div>
  )
}
