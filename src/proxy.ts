import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rutas protegidas — requieren sesión activa
  const protectedRoutes = ['/cuenta']
  const isProtected = protectedRoutes.some((r) => request.nextUrl.pathname.startsWith(r))

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  /*
   * Corre en todas las rutas excepto archivos estáticos.
   * Requerido por Supabase SSR para refrescar el token de sesión
   * en cada request y que los Server Components vean el estado de auth.
   */
  matcher: [
    /*
     * Solo páginas HTML — excluir HMR, chunks, API e imágenes.
     * Evita llamadas a Supabase en cada recurso de dev (saturaba CPU).
     */
    '/((?!_next|api|favicon|icon\\.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
