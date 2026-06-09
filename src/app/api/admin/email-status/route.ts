import { NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/admin-auth'
import { getEmailDiagnostics } from '@/lib/email/diagnostics'

/** GET /api/admin/email-status — diagnóstico SMTP del servidor (sin secretos) */
export async function GET() {
  const denied = await checkAdminAccess()
  if (denied) return denied

  return NextResponse.json(getEmailDiagnostics())
}
