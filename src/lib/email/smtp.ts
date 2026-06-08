import nodemailer from 'nodemailer'
import { LEGAL } from '@/lib/site-legal'

export type SmtpSender = { name: string; email: string }

export type SmtpSendResult = {
  messageId: string | null
  recipients: string[]
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  )
}

export function getSmtpSender(): SmtpSender {
  const email =
    process.env.SMTP_FROM_EMAIL?.trim() ??
    process.env.SMTP_USER?.trim() ??
    LEGAL.email
  const name = process.env.SMTP_FROM_NAME?.trim() ?? LEGAL.tradeNameAlt
  return { name, email }
}

function createTransport() {
  const host = process.env.SMTP_HOST?.trim() ?? 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  if (!user || !pass) {
    throw new Error('SMTP_USER o SMTP_PASS no definidos')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendSmtpEmail(params: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  sender?: SmtpSender
  replyTo?: string
}): Promise<SmtpSendResult> {
  const recipients = (Array.isArray(params.to) ? params.to : [params.to])
    .map((e) => e.trim())
    .filter(Boolean)
  if (recipients.length === 0) {
    throw new Error('Sin destinatarios')
  }

  const sender = params.sender ?? getSmtpSender()
  const textContent =
    params.text ??
    `Empire Nutrition\n\n${params.subject}\n\nVer detalles en el sitio web.`

  const transporter = createTransport()
  let info
  try {
    info = await transporter.sendMail({
    from: `"${sender.name}" <${sender.email}>`,
    to: recipients.join(', '),
    subject: params.subject,
    html: params.html,
    text: textContent,
    ...(params.replyTo ? { replyTo: params.replyTo } : {}),
  })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (
      msg.includes('5.7.139') ||
      msg.includes('basic authentication is disabled') ||
      msg.includes('Invalid login') ||
      msg.includes('Username and Password not accepted')
    ) {
      throw new Error(
        'Google Workspace rechazó el inicio de sesión SMTP. ' +
          'Usa una contraseña de aplicación (no la contraseña normal) en SMTP_PASS. ' +
          'Admin de Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones.'
      )
    }
    throw err
  }

  console.info('[email] SMTP enviado:', {
    to: recipients,
    messageId: info.messageId,
    from: sender.email,
  })

  return {
    messageId: info.messageId ?? null,
    recipients,
  }
}
