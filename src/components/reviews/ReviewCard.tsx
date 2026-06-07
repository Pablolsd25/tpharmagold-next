import Link from 'next/link'
import Stars from './Stars'

export type ReviewItem = {
  id: string
  reviewer_name: string | null
  rating: number
  title: string | null
  comment: string | null
  created_at: string
  product?: { name: string; slug: string } | null
}

export default function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Stars rating={review.rating} size={14} />
        <span className="text-zinc-600 text-xs shrink-0">
          {new Date(review.created_at).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>
      {review.product && (
        <Link
          href={`/producto/${review.product.slug}`}
          className="text-accent text-xs hover:underline block"
        >
          {review.product.name}
        </Link>
      )}
      {review.title && <p className="text-white text-sm font-semibold">{review.title}</p>}
      {review.comment && (
        <p className="text-zinc-400 text-sm leading-relaxed">{review.comment}</p>
      )}
      <p className="text-zinc-600 text-xs">— {review.reviewer_name ?? 'Cliente verificado'}</p>
    </div>
  )
}
