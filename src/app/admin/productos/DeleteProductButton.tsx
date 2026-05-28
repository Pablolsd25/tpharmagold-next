'use client'

import { useRouter } from 'next/navigation'

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return

    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Error al eliminar el producto')
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
    >
      Eliminar
    </button>
  )
}
