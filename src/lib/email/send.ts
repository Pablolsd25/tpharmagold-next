import {
  getBrevoSenderStatus,
  isBrevoConfigured,
  sendBrevoEmail,
  type BrevoSender,
} from '@/lib/email/brevo'
import {
  getResendAccountEmail,
  getResendSender,
  isResendConfigured,
  isResendSandboxMode,
  sendResendEmail,
  type ResendSender,
} from '@/lib/email/resend'
import {
  getSmtpSender,
  isSmtpConfigured,
  sendSmtpEmail,
  type SmtpSender,
} from '@/lib/email/smtp'

export type EmailProvider = 'resend' | 'smtp' | 'brevo'

export type EmailSender = { name: string; email: string }

export type SendEmailResult = {
  messageId: string | null
  recipients: string[]
  provider: EmailProvider
}

export function getActiveEmailProvider(): EmailProvider | null {
  const forced = process.env.EMAIL_PROVIDER?.trim().toLowerCase()
  if (forced === 'resend') return isResendConfigured() ? 'resend' : null
  if (forced === 'smtp') return isSmtpConfigured() ? 'smtp' : null
  if (forced === 'brevo') return isBrevoConfigured() ? 'brevo' : null

  if (isSmtpConfigured()) return 'smtp'
  if (isBrevoConfigured()) return 'brevo'
  // Resend solo si EMAIL_PROVIDER=resend — evita sandbox accidental en producción
  return null
}

export function isEmailConfigured(): boolean {
  return getActiveEmailProvider() !== null
}

export function getDefaultSender(): EmailSender {
  const provider = getActiveEmailProvider()
  if (provider === 'resend') return getResendSender()
  if (provider === 'smtp') return getSmtpSender()
  if (provider === 'brevo') {
    const raw =
      process.env.BREVO_FROM_EMAIL ??
      process.env.RESEND_FROM_EMAIL ??
      'contacto@casaempire.net'
    const name = process.env.BREVO_FROM_NAME ?? 'Empire Nutrition'
    if (raw.includes('<')) {
      const match = raw.match(/^(.+?)\s*<([^>]+)>$/)
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() }
      }
    }
    return { name, email: raw }
  }
  return { name: 'Empire Nutrition', email: 'noreply@localhost' }
}

export async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  sender?: EmailSender
  replyTo?: string
}): Promise<SendEmailResult> {
  const provider = getActiveEmailProvider()
  if (!provider) {
    const forced = process.env.EMAIL_PROVIDER?.trim().toLowerCase()
    if (forced === 'smtp' && !isSmtpConfigured()) {
      throw new Error(
        'EMAIL_PROVIDER=smtp pero faltan SMTP_USER y SMTP_PASS en Vercel.'
      )
    }
    throw new Error('Correo no configurado (SMTP o Brevo)')
  }

  console.info('[email] Enviando con proveedor:', provider)

  if (provider === 'resend') {
    const result = await sendResendEmail({
      ...params,
      sender: params.sender as ResendSender | undefined,
    })
    return { ...result, provider: 'resend' }
  }

  if (provider === 'smtp') {
    const result = await sendSmtpEmail({
      ...params,
      sender: params.sender as SmtpSender | undefined,
    })
    return { ...result, provider: 'smtp' }
  }

  const result = await sendBrevoEmail({
    ...params,
    sender: params.sender as BrevoSender | undefined,
  })
  return { ...result, provider: 'brevo' }
}

export async function sendTestEmail(to: string): Promise<
  SendEmailResult & {
    fromEmail: string
    provider: EmailProvider
    senderVerified: boolean | null
    hint: string
  }
> {
  const provider = getActiveEmailProvider()
  if (!provider) {
    throw new Error(
      'Correo no configurado. Define SMTP_USER, SMTP_PASS y EMAIL_PROVIDER=smtp en Vercel.'
    )
  }

  const fromEmail = getDefaultSender().email
  const subject = 'Prueba de correo — Empire Nutrition'
  const html = `<p>Si lees esto, el correo funciona desde <strong>${fromEmail}</strong> (${provider.toUpperCase()}).</p><p>Fecha: ${new Date().toLocaleString('es-MX')}</p>`
  const text = `Prueba Empire Nutrition. Remitente: ${fromEmail}. ${new Date().toLocaleString('es-MX')}`

  const result = await sendEmail({ to, subject, html, text })

  if (provider === 'resend') {
    const accountEmail = getResendAccountEmail()
    const sandbox = isResendSandboxMode()
    return {
      ...result,
      fromEmail,
      senderVerified: sandbox ? null : true,
      hint: sandbox
        ? accountEmail
          ? `Resend (prueba) envió a ${to}. Sin dominio solo llega al correo de tu cuenta Resend (${accountEmail}). Revisa bandeja y spam.`
          : 'Resend (prueba) envió. Sin dominio solo llega al correo con el que te registraste en resend.com. Ponlo en RESEND_ACCOUNT_EMAIL.'
        : 'Resend envió el correo. Revisa bandeja y spam.',
    }
  }

  if (provider === 'smtp') {
    return {
      ...result,
      fromEmail,
      senderVerified: null,
      hint:
        `Enviado por Google Workspace (${fromEmail}). Revisa bandeja y spam.`,
    }
  }

  const senderStatus = await getBrevoSenderStatus()
  return {
    ...result,
    fromEmail: senderStatus.fromEmail,
    senderVerified: senderStatus.verified,
    hint: senderStatus.verified
      ? 'Brevo aceptó el envío. Si no llega, revisa spam y Brevo → Transaccional → Logs.'
      : `El remitente ${senderStatus.fromEmail} NO está verificado en Brevo. Usa Resend para pruebas.`,
  }
}
