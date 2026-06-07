export default function Stars({
  rating,
  size = 16,
  interactive = false,
  onSelect,
}: {
  rating: number
  size?: number
  interactive?: boolean
  onSelect?: (rating: number) => void
}) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rating
        const Star = interactive ? 'button' : 'span'
        return (
          <Star
            key={i}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onSelect?.(i) : undefined}
            className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : undefined}
            aria-label={interactive ? `${i} estrellas` : undefined}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              className={filled ? 'text-yellow-400' : 'text-zinc-600'}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </Star>
        )
      })}
    </span>
  )
}
