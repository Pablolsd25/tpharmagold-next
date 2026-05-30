'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import type { Product } from '@/types'
import { uploadProductImage, deleteProductImage, validateImageFile } from '@/lib/utils/image-upload'

// Cargar el editor rico solo en el cliente
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor').then(m => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-48 bg-zinc-900 animate-pulse rounded" /> },
)

interface Category { id: string; name: string }
interface Props { product?: Product; categories: Category[] }

export default function ProductForm({ product, categories }: Props) {
  const router = useRouter()
  const isEdit = !!product

  const [form, setForm] = useState({
    name:             product?.name             ?? '',
    slug:             product?.slug             ?? '',
    description:      product?.description      ?? '',
    price:            product?.price            ?? '',
    compare_at_price: product?.compare_at_price ?? '',
    stock:            product?.stock            ?? 0,
    category_id:      product?.category_id      ?? '',
    tags:             (product?.tags ?? []).join(', '),
    is_active:        product?.is_active        ?? true,
  })

  // ── Imágenes ────────────────────────────────────────────────────────────
  // images[0] es la imagen principal; el resto son galería
  const [images,       setImages]       = useState<string[]>(product?.images ?? [])
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null) // índice mientras sube
  const [uploading,    setUploading]    = useState(false)
  const [galleryError, setGalleryError] = useState('')
  const featuredInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef  = useRef<HTMLInputElement>(null)

  // ── Estado del formulario ───────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // ── Descripción en modo editor rico ──────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false)

  // ── Helpers ─────────────────────────────────────────────────────────────
  const slugify = (s: string) =>
    s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      ...(name === 'name' && !isEdit ? { slug: slugify(value) } : {}),
    }))
  }

  // ── Subir imagen principal ──────────────────────────────────────────────
  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      validateImageFile(file)
    } catch (err: any) {
      setGalleryError(err.message); return
    }
    setGalleryError('')
    setUploadingIdx(0)
    try {
      const productId = product?.id ?? `new_${Date.now()}`
      const url = await uploadProductImage(file, productId)
      setImages(prev => {
        const next = [...prev]
        if (next.length === 0) next.push(url)
        else next[0] = url
        return next
      })
    } catch (err: any) {
      setGalleryError(err.message)
    } finally {
      setUploadingIdx(null)
      e.target.value = ''
    }
  }

  // ── Subir imágenes de galería (múltiple) ───────────────────────────────
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setGalleryError('')
    setUploading(true)
    try {
      const productId = product?.id ?? `new_${Date.now()}`
      const newUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        validateImageFile(files[i])
        const url = await uploadProductImage(files[i], productId)
        newUrls.push(url)
      }
      setImages(prev => [...prev, ...newUrls])
    } catch (err: any) {
      setGalleryError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = async (idx: number) => {
    const url = images[idx]
    setImages(prev => prev.filter((_, i) => i !== idx))
    // Intento silencioso de borrar del storage (no bloquea si falla)
    deleteProductImage(url).catch(() => {})
  }

  const moveToFirst = (idx: number) =>
    setImages(prev => [prev[idx], ...prev.filter((_, i) => i !== idx)])

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body = {
      name:             form.name,
      slug:             form.slug,
      description:      form.description || null,
      price:            Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock:            Number(form.stock),
      category_id:      form.category_id || null,
      images,
      tags:             form.tags.split(',').map(s => s.trim()).filter(Boolean),
      is_active:        form.is_active,
    }

    const url    = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al guardar el producto')
    } else {
      router.push('/admin/productos')
      router.refresh()
    }
    setLoading(false)
  }

  // ── Imagen principal (images[0]) ─────────────────────────────────────
  const featuredUrl = images[0] ?? null
  // Galería: todo excepto la primera imagen
  const galleryUrls = images.slice(1)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded p-3 text-sm">{error}</div>
      )}
      {galleryError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded p-3 text-sm">{galleryError}</div>
      )}

      {/* ── Información básica ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Información básica</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="sm:col-span-2">
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">Nombre *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </div>

          {/* Slug */}
          <div className="sm:col-span-2">
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">Slug (URL) *</label>
            <input name="slug" value={form.slug} onChange={handleChange} required
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-400 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent font-mono" />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">Precio (MXN) *</label>
            <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </div>

          {/* Precio comparación */}
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">Precio antes (tachado)</label>
            <input name="compare_at_price" type="number" step="0.01" min="0" value={form.compare_at_price} onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">Stock *</label>
            <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">Categoría</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-accent">
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div className="sm:col-span-2">
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">
              Tags <span className="text-zinc-600">(separados por coma)</span>
            </label>
            <input name="tags" value={form.tags} onChange={handleChange}
              placeholder="proteína, ganancia, mujer..."
              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
          </div>

          {/* Activo */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange}
                className="w-4 h-4 accent-accent" />
              <span className="text-zinc-300 text-sm">Producto activo (visible en la tienda)</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Imágenes ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Imagen principal */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">Imagen del producto</h2>

          <input ref={featuredInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFeaturedUpload} className="hidden" />

          {/* Preview o zona vacía */}
          <div
            onClick={() => featuredInputRef.current?.click()}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-zinc-700 hover:border-accent bg-zinc-950 cursor-pointer transition-colors flex items-center justify-center group"
          >
            {uploadingIdx === 0 ? (
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            ) : featuredUrl ? (
              <>
                <img src={featuredUrl} alt="Principal" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-8 w-8 text-white" />
                  <span className="text-white text-xs ml-2 font-medium">Cambiar</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-zinc-600 group-hover:text-zinc-400 transition-colors">
                <Upload className="h-10 w-10 mb-2" />
                <span className="text-xs font-medium">Subir imagen principal</span>
                <span className="text-xs mt-1">JPG, PNG, WebP (máx 5 MB)</span>
              </div>
            )}
          </div>

          {featuredUrl && (
            <div className="flex gap-3 mt-3">
              <button type="button" onClick={() => featuredInputRef.current?.click()}
                className="text-xs text-accent hover:underline">
                Cambiar imagen
              </button>
              <button type="button" onClick={() => removeImage(0)}
                className="text-xs text-red-400 hover:underline">
                Eliminar imagen
              </button>
            </div>
          )}
        </div>

        {/* Galería */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">Galería del producto</h2>

          <input ref={galleryInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple onChange={handleGalleryUpload} className="hidden" />

          <div className="flex gap-3 mb-4">
            <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-50">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {uploading ? 'Subiendo...' : '+ Añadir imágenes a la galería'}
            </button>
          </div>

          {/* Grid de galería */}
          {galleryUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {galleryUrls.map((url, i) => {
                const realIdx = i + 1 // índice real en images[]
                return (
                  <div key={url + i}
                    className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 group">
                    <img src={url} alt={`Galería ${i + 1}`} className="w-full h-full object-contain p-1" />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button type="button" onClick={() => moveToFirst(realIdx)}
                        title="Poner como principal"
                        className="bg-accent text-black text-[10px] font-bold px-1.5 py-1 rounded">
                        ★
                      </button>
                      <button type="button" onClick={() => removeImage(realIdx)}
                        className="bg-red-600 text-white rounded p-1 hover:bg-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {i + 1}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div
              onClick={() => galleryInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-600 transition-colors"
            >
              <ImageIcon className="h-8 w-8 mx-auto text-zinc-700 mb-2" />
              <p className="text-zinc-600 text-xs">Sin imágenes en la galería</p>
              <p className="text-zinc-700 text-xs mt-1">Haz clic para agregar</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Descripción completa (Editor Rico) ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <button
          type="button"
          onClick={() => setEditorOpen(v => !v)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
            Descripción Completa <span className="text-zinc-600 normal-case font-normal">(Con Videos, Imágenes y Formato)</span>
          </h2>
          <span className="text-zinc-400 text-xl leading-none">{editorOpen ? '∧' : '∨'}</span>
        </button>

        {!editorOpen && (
          <div className="mt-4 border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
            <p className="text-zinc-500 text-sm mb-3">
              {form.description
                ? `Descripción con ${form.description.replace(/<[^>]+>/g, '').length} caracteres`
                : 'Sin descripción completa aún'}
            </p>
            <button type="button" onClick={() => setEditorOpen(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-sm transition-colors">
              ✏️ Abrir Editor (carga imágenes)
            </button>
            <p className="text-zinc-600 text-xs mt-2">Las imágenes de la descripción se suben directamente al editor</p>
          </div>
        )}

        {editorOpen && (
          <div className="mt-4">
            <RichTextEditor
              value={form.description}
              onChange={val => setForm(prev => ({ ...prev, description: val }))}
              placeholder="Escribe la descripción completa del producto..."
            />
          </div>
        )}
      </div>

      {/* ── Descripción corta ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">Descripción Corta</h2>
        <p className="text-zinc-500 text-xs mb-3">Aparece en listados de productos</p>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3}
          placeholder="Descripción breve del producto..."
          className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent resize-y" />
      </div>

      {/* ── Acciones ── */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="btn-accent px-6 py-2.5 rounded text-sm disabled:opacity-50">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 rounded text-sm border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
