import {
  ShoppingBag,
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  Check,
  Ban,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Línea de tiempo del estado del pedido (estilo seguimiento)
// Estados del sistema: pending → paid → shipped → delivered (+ cancelled)
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Pedido recibido', icon: ShoppingBag },
  { label: 'Pago confirmado', icon: CreditCard },
  { label: 'En preparación',  icon: Package },
  { label: 'Enviado',         icon: Truck },
  { label: 'Entregado',       icon: CheckCircle2 },
] as const

// Devuelve el índice del último paso completado según el estado
function getActiveStep(status: string): number {
  switch (status) {
    case 'pending':   return 0
    case 'paid':      return 2
    case 'shipped':   return 3
    case 'delivered': return 4
    default:          return 0
  }
}

export default function OrderTimeline({ status }: { status: string }) {
  const isCancelled = status === 'cancelled'

  if (isCancelled) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-xl p-5 mb-8 flex items-center justify-center gap-3">
        <Ban className="w-5 h-5 text-red-400" />
        <p className="text-red-300 font-semibold">Pedido cancelado</p>
      </div>
    )
  }

  const activeStep = getActiveStep(status)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
      <div className="flex items-start justify-between relative">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon
          const isDone    = index <= activeStep
          const isCurrent = index === activeStep

          return (
            <div key={index} className="flex flex-col items-center relative z-10 flex-1">
              {/* Línea conectora (excepto el primer paso) */}
              {index > 0 && (
                <div
                  className={`absolute top-5 right-1/2 w-full h-0.5 -z-10 ${
                    index <= activeStep ? 'bg-wix-gold' : 'bg-zinc-700'
                  }`}
                />
              )}

              {/* Círculo del paso */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? isCurrent
                      ? 'bg-white border-white text-black ring-4 ring-white/15'
                      : 'bg-wix-gold border-wix-gold text-black'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-600'
                }`}
              >
                {isDone && !isCurrent ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>

              {/* Etiqueta */}
              <p
                className={`mt-2 text-[11px] sm:text-xs font-medium text-center leading-tight px-1 ${
                  isDone ? 'text-white' : 'text-zinc-600'
                }`}
              >
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
