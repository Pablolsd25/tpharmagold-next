import { createAdminClient } from '@/lib/supabase/admin'
import ProductForm from '../ProductForm'

export const metadata = { title: 'Nuevo Producto | Admin' }

export default async function NuevoProductoPage() {
  const supabase = createAdminClient()
  const { data: categories } = await supabase.from('categories').select('id, name').order('name')

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-white font-display font-bold text-3xl uppercase tracking-wide">Nuevo Producto</h1>
        <p className="text-zinc-500 text-sm mt-1">Completa los datos del producto</p>
      </div>
      <ProductForm categories={categories ?? []} />
    </div>
  )
}
