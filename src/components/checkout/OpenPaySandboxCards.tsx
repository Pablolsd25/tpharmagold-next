'use client'

import {
  OPENPAY_SANDBOX_TEST_CARDS,
  type OpenPayTestCard,
  isOpenPaySandboxClient,
} from '@/lib/openpay-sandbox-cards'

type Props = {
  onApply: (card: OpenPayTestCard) => void
}

export default function OpenPaySandboxCards({ onApply }: Props) {
  if (!isOpenPaySandboxClient()) return null

  return (
    <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="text-amber-200/90 text-xs font-display uppercase tracking-wider mb-1">
        Modo prueba OpenPay (sandbox)
      </p>
      <p className="text-zinc-500 text-xs mb-3">
        Toca una tarjeta para rellenar el formulario. Solo funcionan con{' '}
        <code className="text-amber-200/80">NEXT_PUBLIC_OPENPAY_SANDBOX=true</code>.
      </p>
      <div className="space-y-2">
        {OPENPAY_SANDBOX_TEST_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onApply(card)}
            className="w-full text-left rounded-md border border-zinc-700/80 bg-zinc-900/80 px-3 py-2.5
              hover:border-amber-500/40 hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-white text-sm font-medium">{card.label}</span>
              <span className="text-amber-200/70 text-[10px] uppercase tracking-wide shrink-0">
                {card.brand}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-zinc-400 tracking-wide">
              {card.number.replace(/(\d{4})(?=\d)/g, '$1 ')}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-600">
              {card.holder} · {card.expMonth}/{card.expYear} · CVV {card.cvv}
              {card.note ? ` (${card.note})` : ''}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
