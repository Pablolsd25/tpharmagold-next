import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mis direcciones' }

export default async function DireccionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('profile_id', user.id)
    .order('is_default', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cuenta" className="text-zinc-500 hover:text-white transition-colors text-sm">← Cuenta</Link>
        <h1 className="text-white font-black text-3xl">Mis direcciones</h1>
      </div>

      {!addresses || addresses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-lg">No tienes direcciones guardadas.</p>
          <p className="text-zinc-600 text-sm mt-2">
            Las direcciones se guardan automáticamente al realizar un pedido.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-zinc-400 text-sm font-medium">{addr.alias}</span>
                {addr.is_default && (
                  <span className="bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded">Principal</span>
                )}
              </div>
              <p className="text-white text-sm">
                {[addr.street, addr.num_exterior ? `No. ${addr.num_exterior}` : '', addr.num_interior ? `Int. ${addr.num_interior}` : ''].filter(Boolean).join(' ')}
              </p>
              {addr.colonia && <p className="text-zinc-400 text-sm">Col. {addr.colonia}</p>}
              <p className="text-zinc-400 text-sm">
                {[addr.municipio ?? addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ')}
              </p>
              <p className="text-zinc-500 text-sm">{addr.country}</p>
              {addr.referencias && (
                <p className="text-zinc-600 text-xs mt-1">Ref: {addr.referencias}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
