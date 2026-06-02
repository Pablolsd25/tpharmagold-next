'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { readLastOrder } from '@/lib/checkout-session'

/** Si hay una compra reciente en esta sesión, lleva al detalle sin pedir correo */
export default function RecentOrderRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('email') || searchParams.get('order')) return

    const last = readLastOrder()
    if (last?.id) {
      router.replace(`/orden/${last.id}?confirmed=1`)
    }
  }, [router, searchParams])

  return null
}
