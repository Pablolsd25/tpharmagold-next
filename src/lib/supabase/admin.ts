import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente con service_role — bypasea RLS.
 * Solo usar en API routes del admin (server-side únicamente).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
