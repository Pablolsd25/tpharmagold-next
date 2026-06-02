'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ACCESS_ERRORS: Record<string, string> = {
  no_access:
    'Tu correo no está en la lista de administradores (site_settings → admin_emails). Pide a otro admin que te agregue en Admin → Usuarios.',
  session:
    'No se pudo validar la sesión. Intenta de nuevo. Si persiste, revisa que Vercel use el mismo proyecto Supabase donde están tus usuarios.',
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Correo o contraseña incorrectos. Si el usuario existe en Supabase Auth, restablece la contraseña en Authentication → Users.'
  }
  if (m.includes('email not confirmed')) {
    return 'Confirma el correo en Supabase o marca el usuario como confirmado en Authentication → Users.'
  }
  return message
}

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect') ?? '/admin'
  const redirect = `/api/auth/post-login?redirect=${encodeURIComponent(redirectParam)}`
  const accessError = ACCESS_ERRORS[searchParams.get('error') ?? '']

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(accessError)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const normalizedEmail = email.trim().toLowerCase()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })
    if (signInError) {
      setError(mapAuthError(signInError.message))
      setLoading(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError(ACCESS_ERRORS.session)
      setLoading(false)
      return
    }

    if (redirectParam.startsWith('/admin')) {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      const me = (await meRes.json()) as { loggedIn?: boolean; isAdmin?: boolean }
      if (!me.loggedIn) {
        setError(ACCESS_ERRORS.session)
        setLoading(false)
        return
      }
      if (!me.isAdmin) {
        await supabase.auth.signOut()
        setError(ACCESS_ERRORS.no_access)
        setLoading(false)
        return
      }
    }

    window.location.href = redirect
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-white font-bold text-2xl tracking-widest uppercase">
            Casa Empire
          </p>
          <p className="text-zinc-400 mt-2 text-sm">
            {redirectParam.startsWith('/admin')
              ? 'Panel de administración'
              : 'Inicia sesión en tu cuenta'}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Correo electrónico</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2.5 border border-zinc-700
                  focus:outline-none focus:border-zinc-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Contraseña</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2.5 border border-zinc-700
                  focus:outline-none focus:border-zinc-500 text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 rounded-xl
                hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-zinc-600 text-xs text-center mt-6">
          Solo personal autorizado.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p className="text-zinc-500">Cargando...</p></div>}>
      <LoginForm />
    </Suspense>
  )
}
