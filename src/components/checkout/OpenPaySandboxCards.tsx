'use client'

import {
  OPENPAY_SANDBOX_DECLINE_CARDS,
  OPENPAY_SANDBOX_SUCCESS_CARDS,
  OPENPAY_SANDBOX_VALIDITY_NOTE,
  type OpenPayTestCard,
  isOpenPaySandboxClient,
} from '@/lib/openpay-sandbox-cards'

type Props = {
  onApply: (card: OpenPayTestCard) => void
}

function CardButton({ card, onApply }: { card: OpenPayTestCard; onApply: (c: OpenPayTestCard) => void }) {
  const isDecline = card.outcome === 'decline'

  return (
    <button
      key={card.id}
      type="button"
      onClick={() => onApply(card)}
      className={`w-full text-left rounded-md border px-3 py-2.5 transition-colors ${
        isDecline
          ? 'border-red-900/60 bg-red-950/30 hover:border-red-700/50 hover:bg-red-950/50'
          : 'border-zinc-700/80 bg-zinc-900/80 hover:border-amber-500/40 hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-white text-sm font-medium">{card.label}</span>
        <span
          className={`text-[10px] uppercase tracking-wide shrink-0 ${
            isDecline ? 'text-red-300/80' : 'text-amber-200/70'
          }`}
        >
          {card.brand}
        </span>
      </div>
      <p className="mt-1 font-mono text-xs text-zinc-400 tracking-wide">
        {card.number.replace(/(\d{4})(?=\d)/g, '$1 ')}
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-600">
        {card.holder} · {card.expMonth}/{card.expYear} · CVV {card.cvv}
        {card.note ? ` — ${card.note}` : ''}
      </p>
      {card.expectedCode != null && (
        <p className="mt-1 text-[11px] text-red-300/70">
          OpenPay {card.expectedCode}: {card.expectedDescription}
        </p>
      )}
    </button>
  )
}

export default function OpenPaySandboxCards({ onApply }: Props) {
  if (!isOpenPaySandboxClient()) return null

  return (
    <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="text-amber-200/90 text-xs font-display uppercase tracking-wider mb-1">
        Modo prueba OpenPay (sandbox)
      </p>
      <p className="text-zinc-500 text-xs mb-1">
        Toca una tarjeta para rellenar el formulario. Solo con{' '}
        <code className="text-amber-200/80">NEXT_PUBLIC_OPENPAY_SANDBOX=true</code>.
      </p>
      <p className="text-zinc-600 text-[11px] mb-4">{OPENPAY_SANDBOX_VALIDITY_NOTE}</p>

      <p className="text-amber-200/80 text-[10px] font-display uppercase tracking-widest mb-2">
        Pagos aprobados
      </p>
      <div className="space-y-2 mb-5">
        {OPENPAY_SANDBOX_SUCCESS_CARDS.map((card) => (
          <CardButton key={card.id} card={card} onApply={onApply} />
        ))}
      </div>

      <p className="text-red-300/80 text-[10px] font-display uppercase tracking-widest mb-2">
        Rechazo y fallas (homologación)
      </p>
      <div className="space-y-2">
        {OPENPAY_SANDBOX_DECLINE_CARDS.map((card) => (
          <CardButton key={card.id} card={card} onApply={onApply} />
        ))}
      </div>
    </div>
  )
}
