import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map((e) => e.trim()).filter(Boolean)

/** GET /api/auth/me — info de sesión del lado del cliente */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ loggedIn: false })
  }

  const email = user.email ?? ''
  const profileName = user.user_metadata?.full_name as string | undefined

  return NextResponse.json({
    loggedIn: true,
    name:     profileName ?? email.split('@')[0] ?? 'Usuario',
    isAdmin:  ADMIN_EMAILS.includes(email),
    email,
  })
}
