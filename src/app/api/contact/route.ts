import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isEmailConfigured, sendEmail } from '@/lib/email/send'

export async function POST(req: Request) {
  try {
    const { nombre, apellido, email, whatsapp, mensaje } = await req.json()

    if (!email || !mensaje) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const supabase = createAdminClient()
    await supabase.from('contact_submissions').insert({
      nombre:   nombre  ?? null,
      apellido: apellido ?? null,
      email,
      whatsapp: whatsapp ?? null,
      mensaje,
    })

    if (isEmailConfigured()) {
      try {
        await sendEmail({
          to:      'contacto@casaempire.net',
          replyTo: email,
          subject: `Nuevo mensaje de contacto — ${nombre ?? ''} ${apellido ?? ''}`.trim(),
          html: `
          <div style="font-family:sans-serif;background:#000;color:#fff;padding:32px;max-width:560px">
            <h2 style="color:#E8177A;font-size:24px;margin-bottom:16px;">Nuevo mensaje de contacto</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#aaa;width:140px">Nombre</td><td style="color:#fff">${nombre ?? '—'} ${apellido ?? ''}</td></tr>
              <tr><td style="padding:8px 0;color:#aaa">Email</td><td style="color:#fff">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#aaa">WhatsApp</td><td style="color:#fff">${whatsapp ?? '—'}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #333;margin:16px 0"/>
            <p style="color:#ccc;line-height:1.6;white-space:pre-wrap">${mensaje}</p>
          </div>
        `,
        })
      } catch (emailErr) {
        console.warn('[api/contact] No se envió notificación por correo:', emailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/contact]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
