'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@/types'

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [loading, setLoading] = useState(false)

  const slugify = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, slug: newSlug }),
    })
    setNewName('')
    setNewSlug('')
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar categoría "${name}"?`)) return
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Agregar */}
      <form onSubmit={handleAdd} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-white font-semibold mb-4">Nueva categoría</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)) }}
            placeholder="Nombre"
            required
            className="flex-1 min-w-[160px] bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="slug-url"
            required
            className="flex-1 min-w-[140px] bg-zinc-950 border border-zinc-700 text-zinc-400 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent font-mono"
          />
          <button type="submit" disabled={loading} className="btn-accent px-4 py-2 rounded text-sm">
            {loading ? '...' : 'Agregar'}
          </button>
        </div>
      </form>

      {/* Lista */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-white text-sm font-medium">{cat.name}</p>
              <p className="text-zinc-600 text-xs font-mono">{cat.slug}</p>
            </div>
            <button
              onClick={() => handleDelete(cat.id, cat.name)}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
            >
              Eliminar
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="px-5 py-8 text-center text-zinc-600 text-sm">Sin categorías</p>
        )}
      </div>
    </div>
  )
}
