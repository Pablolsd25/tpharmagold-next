import type { SupabaseClient } from '@supabase/supabase-js'

export const SALES_NOTIFICATION_EMAILS_KEY = 'sales_notification_emails'
export const MAX_SALES_NOTIFICATION_EMAILS = 2

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseEmailList(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0 && EMAIL_RE.test(e))
    ),
  ].slice(0, MAX_SALES_NOTIFICATION_EMAILS)
}

export function serializeEmailList(emails: string[]): string {
  return JSON.stringify(parseEmailList(emails.join(',')))
}

export async function getSalesNotificationEmails(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', SALES_NOTIFICATION_EMAILS_KEY)
    .maybeSingle()

  if (!data?.value) return []

  try {
    const parsed = JSON.parse(data.value) as unknown
    if (!Array.isArray(parsed)) return parseEmailList(data.value)
    return parseEmailList(parsed.join(','))
  } catch {
    return parseEmailList(data.value)
  }
}
