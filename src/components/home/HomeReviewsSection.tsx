import Link from 'next/link'
import ReviewCard, { type ReviewItem } from '@/components/reviews/ReviewCard'
import Stars from '@/components/reviews/Stars'

interface Props {
  reviews: ReviewItem[]
}

export default function HomeReviewsSection({ reviews }: Props) {
  if (reviews.length === 0) return null

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <section className="border-t border-zinc-900 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-white font-display font-bold text-3xl uppercase tracking-tight">
              Lo que dicen nuestros clientes
            </h2>
            <div className="mt-2 h-[3px] w-10 bg-accent rounded-full" />
            <div className="flex items-center gap-2 mt-4">
              <Stars rating={Math.round(avgRating)} size={18} />
              <span className="text-zinc-400 text-sm">
                {avgRating.toFixed(1)} · reseñas verificadas
              </span>
            </div>
          </div>
          <Link
            href="/resenas"
            className="text-accent hover:text-white text-xs font-display uppercase tracking-widest transition-colors flex items-center gap-1 group shrink-0"
          >
            Ver todas
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </div>
    </section>
  )
}
