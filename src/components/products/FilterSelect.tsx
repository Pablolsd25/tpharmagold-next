'use client'

import { useRouter } from 'next/navigation'

interface Props {
  currentOrden?: string
  currentCategoria?: string
}

export default function FilterSelect({ currentOrden, currentCategoria }: Props) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = new URL(window.location.href)
    e.target.value
      ? url.searchParams.set('orden', e.target.value)
      : url.searchParams.delete('orden')
    router.push(url.pathname + url.search)
  }

  return (
    <select
      className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 border border-zinc-700
        focus:outline-none focus:border-zinc-500"
      defaultValue={currentOrden ?? ''}
      onChange={handleChange}
    >
      <option value="">Más recientes</option>
      <option value="precio-asc">Precio: menor a mayor</option>
      <option value="precio-desc">Precio: mayor a menor</option>
    </select>
  )
}
