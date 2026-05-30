'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RefundButton({ orderId, disabled }: { orderId: string; disabled?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleRefund = async () => {
    const confirmed = window.confirm(
      '¿Confirmas el reembolso completo de esta orden?\n\nEsta acción no se puede deshacer. El cargo será revertido en OpenPay y la orden quedará como Cancelada.'
    )
    if (!confirmed) return

    setLoading(true)
    const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Reembolso solicitado por administrador' }),
    })
    setLoading(false)

    if (res.ok) {
      setDone(true)
      router.refresh()
    } else {
      const data = await res.json()
      alert(`Error al reembolsar: ${data.error ?? 'Error desconocido'}`)
    }
  }

  if (done) {
    return (
      <span className="px-4 py-2 rounded border border-green-700 text-green-400 text-sm font-medium">
        ✓ Reembolso procesado
      </span>
    )
  }

  return (
    <button
      onClick={handleRefund}
      disabled={loading || disabled}
      className="px-4 py-2 rounded border border-red-700 text-red-400 text-sm font-medium
        hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading ? 'Procesando…' : '↩ Reembolsar'}
    </button>
  )
}
