'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] bg-black flex flex-col items-center justify-center px-4 text-center">
      <p className="text-white font-display text-lg uppercase tracking-wide mb-2">
        Algo salió mal
      </p>
      <p className="text-zinc-500 text-sm max-w-md mb-6">
        {error.message || 'No pudimos cargar esta página.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn-accent px-8 py-2.5 rounded-sm text-sm"
      >
        Reintentar
      </button>
    </div>
  )
}
