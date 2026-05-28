'use client'

import { useRouter } from 'next/navigation'

const STATUS_COLORS: Record<string, string> = {
  paid:      'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
  shipped:   'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  delivered: 'bg-accent/20 text-accent border-accent/30 hover:bg-accent/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
}

export default function OrderStatusButton({
  orderId,
  newStatus,
  label,
}: {
  orderId: string
  newStatus: string
  label: string
}) {
  const router = useRouter()

  const handleUpdate = async () => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Error al actualizar el estado')
    }
  }

  return (
    <button
      onClick={handleUpdate}
      className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${STATUS_COLORS[newStatus] ?? 'border-zinc-700 text-zinc-400'}`}
    >
      Marcar como {label}
    </button>
  )
}
