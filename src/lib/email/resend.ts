import { Resend } from 'resend'

export type ResendSender = { name: string; email: string }

export type ResendSendResult = {
  messageId: string | null
  recipients: string[]
}

const SANDBOX_FROM = 'onboarding@resend.dev'

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

export function getResendSender(): ResendSender {
  const name = process.env.RESEND_FROM_NAME?.trim() ?? 'Empire Nutrition'
  const email = process.env.RESEND_FROM_EMAIL?.trim() ?? SANDBOX_FROM
  return { name, email }
}

export function isResendSandboxMode(): boolean {
  const from = getResendSender().email.toLowerCase()
  return from === SANDBOX_FROM || from.endsWith('@resend.dev')
}

export function getResendAccountEmail(): string | null {
  return process.env.RESEND_ACCOUNT_EMAIL?.trim().toLowerCase() ?? null
}

function formatFrom(sender: ResendSender): string {
  return `${sender.name} <${sender.email}>`
}

function extractResendAccountEmailFromError(message: string): string | null {
  const match = message.match(/your own email address \(([^)]+)\)/i)
  return match?.[1]?.trim().toLowerCase() ?? null
}

function parseResendError(message: string): string {
  if (message.includes('only send testing emails to your own email')) {
    const account = extractResendAccountEmailFromError(message)
    return (
      'Resend en modo prueba: solo envía a ' +
      (account ?? 'el correo con el que te registraste en resend.com') +
      '. Ponlo en RESEND_ACCOUNT_EMAIL y revisa esa bandeja (y spam). ' +
      'Para enviar a cualquier cliente, verifica un subdominio en Resend.'
    )
  }
  if (message.includes('domain is not verified')) {
    return (
      'El dominio del remitente no está verificado en Resend. ' +
      'Para pruebas usa RESEND_FROM_EMAIL=onboarding@resend.dev sin dominio.'
    )
  }
  return message
}

function sandboxBanner(originalRecipients: string[], deliveredTo: string): string {
  return (
    `<div style="background:#422006;border:1px solid #a16207;border-radius:8px;padding:14px 16px;margin:0 0 20px;color:#fef08a;font-size:13px;line-height:1.5;">` +
    `<strong>Modo prueba Resend</strong> — Este correo iba para <strong>${originalRecipients.join(', ')}</strong> ` +
    `pero se entregó a <strong>${deliveredTo}</strong> (sin dominio verificado Resend solo permite un buzón).` +
    `</div>`
  )
}

/** En sandbox redirige al buzón de la cuenta Resend para que las pruebas no fallen. */
function resolveSandboxRecipients(recipients: string[]): {
  to: string[]
  redirectedFrom: string[] | null
} {
  if (!isResendSandboxMode()) {
    return { to: recipients, redirectedFrom: null }
  }

  const allowed = getResendAccountEmail()
  if (!allowed) {
    return { to: recipients, redirectedFrom: null }
  }

  const normalized = recipients.map((r) => r.toLowerCase())
  if (normalized.every((r) => r === allowed)) {
    return { to: recipients, redirectedFrom: null }
  }

  console.warn(
    '[email] Resend sandbox: redirigiendo',
    recipients.join(', '),
    '→',
    allowed
  )
  return { to: [allowed], redirectedFrom: recipients }
}

export async function sendResendEmail(params: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  sender?: ResendSender
  replyTo?: string
}): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) throw new Error('RESEND_API_KEY no definido')

  const originalRecipients = (Array.isArray(params.to) ? params.to : [params.to])
    .map((e) => e.trim())
    .filter(Boolean)
  if (originalRecipients.length === 0) throw new Error('Sin destinatarios')

  const { to: recipients, redirectedFrom } =
    resolveSandboxRecipients(originalRecipients)

  const sender = params.sender ?? getResendSender()
  let html = params.html
  let textContent =
    params.text ??
    `Empire Nutrition\n\n${params.subject}\n\nVer detalles en el sitio web.`

  if (redirectedFrom) {
    const banner = sandboxBanner(redirectedFrom, recipients[0])
    html = banner + html
    textContent =
      `[Modo prueba Resend — destinatario original: ${redirectedFrom.join(', ')}]\n\n` +
      textContent
  }

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: formatFrom(sender),
    to: recipients,
    subject: params.subject,
    html,
    text: textContent,
    ...(params.replyTo ? { replyTo: params.replyTo } : {}),
  })

  if (error) {
    const msg = parseResendError(error.message)
    console.error('[email] Resend rechazó envío:', error)
    throw new Error(msg)
  }

  console.info('[email] Resend enviado:', {
    to: recipients,
    originalTo: redirectedFrom ?? originalRecipients,
    messageId: data?.id,
    from: sender.email,
    sandbox: isResendSandboxMode(),
  })

  return {
    messageId: data?.id ?? null,
    recipients: redirectedFrom ?? originalRecipients,
  }
}
