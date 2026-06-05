import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminAccess } from '@/lib/admin-auth'
import {
  MAX_SALES_NOTIFICATION_EMAILS,
  SALES_NOTIFICATION_EMAILS_KEY,
  parseEmailList,
  serializeEmailList,
} from '@/lib/sales-notifications'

const READABLE_KEYS = new Set([SALES_NOTIFICATION_EMAILS_KEY])

function normalizeSettingValue(key: string, value: unknown): string {
  if (key === SALES_NOTIFICATION_EMAILS_KEY) {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as unknown
        if (Array.isArray(parsed)) {
          return serializeEmailList(parsed.filter((e): e is string => typeof e === 'string'))
        }
      } catch {
        /* texto plano con comas o saltos de línea */
      }
      return serializeEmailList(parseEmailList(value))
    }
    if (Array.isArray(value)) {
      return serializeEmailList(value.filter((e): e is string => typeof e === 'string'))
    }
    throw new Error('Formato de correos inválido.')
  }
  return String(value)
}

/** GET /api/admin/settings?key=... — leer configuración (solo admins) */
export async function GET(req: NextRequest) {
  const denied = await checkAdminAccess()
  if (denied) return denied

  const key = req.nextUrl.searchParams.get('key')
  if (!key || !READABLE_KEYS.has(key)) {
    return NextResponse.json({ error: 'Clave no permitida' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (key === SALES_NOTIFICATION_EMAILS_KEY) {
    const emails = data?.value ? parseEmailList(
      (() => {
        try {
          const parsed = JSON.parse(data.value) as unknown
          return Array.isArray(parsed) ? parsed.join(',') : data.value
        } catch {
          return data.value
        }
      })()
    ) : []
    return NextResponse.json({ key, emails })
  }

  return NextResponse.json({ key, value: data?.value ?? '' })
}

/** POST /api/admin/settings — actualiza una clave en site_settings (solo admins) */
export async function POST(req: NextRequest) {
  const denied = await checkAdminAccess()
  if (denied) return denied

  let body: { key?: string; value?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { key, value } = body
  if (!key || value === undefined || value === null) {
    return NextResponse.json({ error: 'key y value son requeridos' }, { status: 400 })
  }

  let stored: string
  try {
    stored = normalizeSettingValue(key, value)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Valor inválido' },
      { status: 400 }
    )
  }

  if (key === SALES_NOTIFICATION_EMAILS_KEY) {
    const emails = JSON.parse(stored) as string[]
    if (emails.length === 0 && String(value).trim().length > 0) {
      return NextResponse.json(
        { error: 'Ningún correo válido. Usa formato usuario@dominio.com' },
        { status: 400 }
      )
    }
    if (emails.length > MAX_SALES_NOTIFICATION_EMAILS) {
      return NextResponse.json(
        { error: `Máximo ${MAX_SALES_NOTIFICATION_EMAILS} correos de notificación.` },
        { status: 400 }
      )
    }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value: stored, updated_at: new Date().toISOString() })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (key === SALES_NOTIFICATION_EMAILS_KEY) {
    return NextResponse.json({ ok: true, emails: JSON.parse(stored) as string[] })
  }

  return NextResponse.json({ ok: true })
}
