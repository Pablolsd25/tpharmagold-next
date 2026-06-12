export default function HomeSectionsSkeleton() {
  return (
    <div className="max-w-[980px] mx-auto px-4 sm:px-6 py-14 space-y-20">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-8 bg-zinc-800 rounded w-64 mx-auto mb-4" />
          <div className="h-3 bg-zinc-900 rounded w-96 max-w-full mx-auto mb-10" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="aspect-[3/4] bg-zinc-900 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
