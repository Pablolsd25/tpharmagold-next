import { createClient } from '@/lib/supabase/server'
import PageHero from '@/components/layout/PageHero'
import ReviewForm from '@/components/reviews/ReviewForm'
import ReviewCard from '@/components/reviews/ReviewCard'
import Stars from '@/components/reviews/Stars'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reseñas',
  description: 'Opiniones de nuestras clientas y clientes sobre nuestros productos.',
}

export default async function ResenasPage() {
  const supabase = await createClient()

  const [{ data: reviews }, { data: products }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, reviewer_name, rating, title, comment, created_at, product:products(name, slug)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return (
    <div>
      <PageHero
        title="Reseñas"
        subtitle="Lo que dicen quienes ya probaron nuestros productos."
        image="/hero-secondary.jpg"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {avgRating !== null && (
          <div className="flex items-center gap-3">
            <Stars rating={Math.round(avgRating)} size={22} />
            <span className="text-zinc-400 text-sm">
              {avgRating.toFixed(1)} de 5 · {reviews!.length}{' '}
              {reviews!.length === 1 ? 'reseña' : 'reseñas'}
            </span>
          </div>
        )}

        <ReviewForm products={products ?? []} />

        <section>
          <h2 className="text-white font-display font-bold text-xl uppercase tracking-wide mb-6">
            Reseñas publicadas
          </h2>
          {reviews && reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => {
                const product = Array.isArray(r.product) ? r.product[0] : r.product
                return (
                  <ReviewCard
                    key={r.id}
                    review={{
                      ...r,
                      product: product ?? null,
                    }}
                  />
                )
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-12 border border-zinc-800 rounded-xl">
              Aún no hay reseñas publicadas. ¡Sé el primero en compartir tu experiencia!
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
