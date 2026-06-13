'use client'

import { useState } from 'react'
import Stars from './Stars'

type ProductOption = { id: string; name: string }

interface Props {
  productId?: string
  productName?: string
  products?: ProductOption[]
}

export default function ReviewForm({ productId, productName, products }: Props) {
  const [selectedProductId, setSelectedProductId] = useState(productId ?? '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const showProductSelect = !productId && (products?.length ?? 0) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const pid = productId ?? selectedProductId
    if (!pid) {
      setError('Selecciona un producto.')
      return
    }
    if (rating < 1) {
      setError('Selecciona una calificación.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: pid,
          reviewer_name: name,
          reviewer_email: email,
          rating,
          title: title || null,
          comment,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo enviar la reseña.')
        return
      }
      setSuccess(data.message ?? 'Gracias. Tu reseña será publicada después de revisión.')
      setRating(0)
      setTitle('')
      setComment('')
      if (!productId) setSelectedProductId('')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-white font-semibold text-lg">Deja tu reseña</h3>
        <p className="text-zinc-500 text-sm mt-1">
          {productName
            ? `Sobre ${productName}. Revisamos cada reseña antes de publicarla.`
            : 'Comparte tu experiencia. Revisamos cada reseña antes de publicarla.'}
        </p>
      </div>

      {showProductSelect && (
        <div>
          <label className="block text-zinc-300 text-sm mb-1.5">Producto *</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            required
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Selecciona un producto</option>
            {products!.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-zinc-300 text-sm mb-1.5">Nombre *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-zinc-300 text-sm mb-1.5">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-zinc-300 text-sm mb-2">Calificación *</label>
        <Stars rating={rating} size={28} interactive onSelect={setRating} />
      </div>

      <div>
        <label className="block text-zinc-300 text-sm mb-1.5">Título (opcional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Ej. Excelente producto"
          className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="block text-zinc-300 text-sm mb-1.5">Tu reseña *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          maxLength={2000}
          rows={4}
          placeholder="Cuéntanos tu experiencia con el producto..."
          className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent resize-y min-h-[100px]"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-wix-gold text-sm bg-wix-gold/10 border border-wix-gold/30 rounded-lg px-3 py-2">{success}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-accent px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
      >
        {loading ? 'Enviando…' : 'Enviar reseña'}
      </button>
    </form>
  )
}
