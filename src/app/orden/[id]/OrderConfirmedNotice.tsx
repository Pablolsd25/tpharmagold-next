'use client'

interface Props {
  displayNumber: string
  email: string | null
}

export default function OrderConfirmedNotice({ displayNumber, email }: Props) {
  const copyId = () => {
    void navigator.clipboard?.writeText(displayNumber.replace(/^#/, ''))
  }

  return (
    <div className="mb-8 bg-zinc-950/80 border border-wix-gold/30 rounded-xl p-6 text-center max-w-lg mx-auto gold-glow">
      <p className="text-wix-gold text-xs uppercase tracking-widest font-semibold mb-2">
        Compra confirmada
      </p>
      <p className="text-white text-lg mb-1">Tu número de orden es</p>
      <p className="text-white font-mono text-3xl font-bold tracking-wider mb-3">{displayNumber}</p>
      <button
        type="button"
        onClick={copyId}
        className="text-wix-gold/80 text-xs hover:text-wix-gold underline mb-3"
      >
        Copiar número
      </button>
      {email && (
        <p className="text-zinc-400 text-sm">
          Enviamos el detalle a <span className="text-zinc-200">{email}</span>
        </p>
      )}
      <p className="text-zinc-500 text-xs mt-3">
        Guarda este número para dar seguimiento a tu pedido.
      </p>
    </div>
  )
}
