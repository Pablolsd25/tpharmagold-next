const BREVO_API = 'https://api.brevo.com/v3/smtp/email'

export type BrevoSender = { name: string; email: string }

export type BrevoSendResult = {
  messageId: string | null
  recipients: string[]
}

type BrevoSenderRow = {
  email: string
  active: boolean
  verified: boolean
}

export function parseSender(from: string): BrevoSender {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() }
  }
  return { name: 'Empire Nutrition', email: from.trim() }
}

export function getDefaultSender(): BrevoSender {
  const raw =
    process.env.BREVO_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    'contacto@casaempire.net'
  const name = process.env.BREVO_FROM_NAME ?? 'Empire Nutrition'
  if (raw.includes('<')) return parseSender(raw)
  return { name, email: raw }
}

export async function getBrevoSenderStatus(): Promise<{
  configured: boolean
  fromEmail: string
  verified: boolean
  senders: BrevoSenderRow[]
}> {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const fromEmail = getDefaultSender().email.toLowerCase()
  if (!apiKey) {
    return { configured: false, fromEmail, verified: false, senders: [] }
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/senders', {
      headers: { 'api-key': apiKey, accept: 'application/json' },
    })
    if (!res.ok) {
      return { configured: true, fromEmail, verified: false, senders: [] }
    }
    const data = (await res.json()) as { senders?: BrevoSenderRow[] }
    const senders = data.senders ?? []
    const match = senders.find((s) => s.email.toLowerCase() === fromEmail)
    return {
      configured: true,
      fromEmail,
      verified: Boolean(match?.verified && match?.active),
      senders,
    }
  } catch {
    return { configured: true, fromEmail, verified: false, senders: [] }
  }
}

export async function sendBrevoEmail(params: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  sender?: BrevoSender
  replyTo?: string
}): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error('BREVO_API_KEY no definido')
  }

  const recipients = (Array.isArray(params.to) ? params.to : [params.to])
    .map((e) => e.trim())
    .filter(Boolean)
  if (recipients.length === 0) {
    throw new Error('Sin destinatarios')
  }

  const sender = params.sender ?? getDefaultSender()
  const textContent =
    params.text ??
    `Empire Nutrition\n\n${params.subject}\n\nVer detalles en el sitio web.`

  const res = await fetch(BREVO_API, {
    method:  'POST',
    headers: {
      'api-key':      apiKey,
      'Content-Type': 'application/json',
      accept:         'application/json',
    },
    body: JSON.stringify({
      sender,
      to:          recipients.map((email) => ({ email })),
      subject:     params.subject,
      htmlContent: params.html,
      textContent,
      ...(params.replyTo ? { replyTo: { email: params.replyTo } } : {}),
    }),
  })

  const raw = await res.text()
  let messageId: string | null = null
  try {
    const parsed = JSON.parse(raw) as { messageId?: string }
    messageId = parsed.messageId ?? null
  } catch {
    /* respuesta no JSON */
  }

  if (!res.ok) {
    console.error('[email] Brevo rechazó envío:', res.status, raw)
    throw new Error(`Brevo ${res.status}: ${raw}`)
  }

  console.info('[email] Brevo aceptado:', {
    to: recipients,
    messageId,
    from: sender.email,
  })

  return { messageId, recipients }
}

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim())
}

export async function sendBrevoTestEmail(to: string): Promise<BrevoSendResult & { senderStatus: Awaited<ReturnType<typeof getBrevoSenderStatus>> }> {
  const senderStatus = await getBrevoSenderStatus()
  const result = await sendBrevoEmail({
    to,
    subject: 'Prueba de correo — Empire Nutrition',
    html: `<p>Si lees esto, Brevo está enviando correctamente desde <strong>${senderStatus.fromEmail}</strong>.</p><p>Fecha: ${new Date().toLocaleString('es-MX')}</p>`,
    text: `Prueba Empire Nutrition. Remitente: ${senderStatus.fromEmail}. ${new Date().toLocaleString('es-MX')}`,
  })
  return { ...result, senderStatus }
}
