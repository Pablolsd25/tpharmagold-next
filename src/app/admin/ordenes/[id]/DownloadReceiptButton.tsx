'use client'

import { Download } from 'lucide-react'

export default function DownloadReceiptButton({ orderId }: { orderId: string }) {
  return (
    <a
      href={`/api/admin/orders/${orderId}/receipt`}
      download
      className="inline-flex items-center gap-2 border border-zinc-600 text-zinc-300
        hover:border-accent hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
    >
      <Download className="h-4 w-4" />
      Descargar recibo PDF
    </a>
  )
}
