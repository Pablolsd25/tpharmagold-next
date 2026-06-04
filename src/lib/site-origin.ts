import type { NextRequest } from 'next/server'

export function isLocalOrigin(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url)
}

/** URL pública del sitio (redirect_url de 3D Secure, enlaces en correos, etc.) */
export function getPublicSiteOrigin(req?: NextRequest): string {
  // En Vercel/producción: priorizar el host real del request (evita NEXT_PUBLIC_SITE_URL=localhost)
  if (req) {
    const host = (req.headers.get('x-forwarded-host') ?? req.headers.get('host'))
      ?.split(',')[0]
      ?.trim()
    if (host && !host.includes('localhost') && !host.startsWith('127.')) {
      const proto = req.headers.get('x-forwarded-proto') ?? 'https'
      return `${proto}://${host}`
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (fromEnv && !isLocalOrigin(fromEnv)) return fromEnv

  return 'https://casaempire-next.vercel.app'
}
