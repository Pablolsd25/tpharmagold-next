'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TrackingInput({
  orderId,
  initialValue,
}: {
  orderId: string
  initialValue: string | null
}) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_number: value }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    } else {
      alert('Error al guardar el número de guía')
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ej: 7899123456001"
        className="flex-1 bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm
          focus:outline-none focus:border-zinc-500 font-mono"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white
          rounded text-sm font-medium transition-colors whitespace-nowrap"
      >
        {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar guía'}
      </button>
    </div>
  )
}
