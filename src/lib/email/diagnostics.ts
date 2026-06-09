import { getActiveEmailProvider, getDefaultSender } from '@/lib/email/send'
import { isSmtpConfigured } from '@/lib/email/smtp'

const SMTP_VARS = [
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_FROM_EMAIL',
  'SMTP_FROM_NAME',
] as const

function smtpMissingVars(): string[] {
  const missing: string[] = []
  if (!process.env.SMTP_USER?.trim()) missing.push('SMTP_USER')
  if (!process.env.SMTP_PASS?.trim()) missing.push('SMTP_PASS')
  return missing
}

/** Detecta typo común SNTP_* en lugar de SMTP_*. */
function detectSntpTypo(): string[] {
  const typos: string[] = []
  if (process.env.SNTP_USER?.trim()) typos.push('SNTP_USER (debe ser SMTP_USER)')
  if (process.env.SNTP_PASS?.trim()) typos.push('SNTP_PASS (debe ser SMTP_PASS)')
  if (process.env.SNTP_HOST?.trim()) typos.push('SNTP_HOST (debe ser SMTP_HOST)')
  return typos
}

export function getEmailDiagnostics() {
  const provider = getActiveEmailProvider()
  const sender = getDefaultSender()
  const missing = smtpMissingVars()
  const typos = detectSntpTypo()

  return {
    configured: provider !== null,
    provider:   provider ?? 'ninguno',
    fromName:   sender.name,
    fromEmail:  sender.email,
    smtp: {
      configured: isSmtpConfigured(),
      host:       process.env.SMTP_HOST?.trim() ?? 'smtp.gmail.com (default)',
      port:       process.env.SMTP_PORT?.trim() ?? '587 (default)',
      user:       process.env.SMTP_USER?.trim() ?? null,
      hasPass:    Boolean(process.env.SMTP_PASS?.trim()),
      missingRequired: missing,
    },
    emailProviderEnv: process.env.EMAIL_PROVIDER?.trim() ?? null,
    envVarsPresent: Object.fromEntries(
      SMTP_VARS.map((key) => [key, Boolean(process.env[key]?.trim())])
    ),
    typoVars: typos,
    hint:
      missing.length > 0
        ? `Faltan en el servidor: ${missing.join(', ')}. Tras guardar en Vercel, haz Redeploy.`
        : typos.length > 0
          ? `Variables mal nombradas: ${typos.join(', ')}`
          : provider === 'smtp'
            ? 'SMTP listo en este servidor.'
            : null,
  }
}

export function logEmailDiagnostics(context: string): void {
  const d = getEmailDiagnostics()
  console.error(`[email] Diagnóstico (${context}):`, JSON.stringify(d))
}
