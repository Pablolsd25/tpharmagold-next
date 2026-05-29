import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = 'Empire Nutrition <no-reply@empirenutrition.mx>'

interface OrderItem {
  name:     string
  quantity: number
  price:    number
}

interface OrderConfirmationArgs {
  to:       string
  orderId:  string
  items:    OrderItem[]
  subtotal: number
  shipping: number
  total:    number
  name:     string
}

function orderConfirmationHtml(args: OrderConfirmationArgs): string {
  const { orderId, items, subtotal, shipping, total, name } = args
  const shortId = orderId.slice(0, 8).toUpperCase()

  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:14px;">${i.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:14px;text-align:center;">×${i.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#ffffff;font-size:14px;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#18181b;border:1px solid #27272a;border-radius:12px 12px 0 0;padding:32px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:4px;color:#23F30E;text-transform:uppercase;font-weight:700;">Empire Nutrition</p>
            <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:900;letter-spacing:-0.5px;">¡Pedido confirmado!</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#09090b;border-left:1px solid #27272a;border-right:1px solid #27272a;padding:32px 36px;">
            <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Hola <strong style="color:#ffffff;">${name}</strong>,<br>
              tu pedido ha sido recibido y está siendo procesado. Recibirás tu número de guía en un plazo de 24–48 horas hábiles.
            </p>

            <!-- Order ID -->
            <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
              <p style="margin:0;font-size:11px;color:#71717a;letter-spacing:3px;text-transform:uppercase;">Número de pedido</p>
              <p style="margin:6px 0 0;font-size:20px;color:#23F30E;font-weight:700;font-family:monospace;">#${shortId}</p>
            </div>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <th style="text-align:left;font-size:11px;color:#71717a;letter-spacing:3px;text-transform:uppercase;padding-bottom:12px;">Producto</th>
                <th style="text-align:center;font-size:11px;color:#71717a;letter-spacing:3px;text-transform:uppercase;padding-bottom:12px;">Cant.</th>
                <th style="text-align:right;font-size:11px;color:#71717a;letter-spacing:3px;text-transform:uppercase;padding-bottom:12px;">Precio</th>
              </tr>
              ${rows}
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#71717a;font-size:13px;padding:6px 0;">Subtotal</td>
                <td style="color:#a1a1aa;font-size:13px;padding:6px 0;text-align:right;">$${subtotal.toFixed(2)} MXN</td>
              </tr>
              <tr>
                <td style="color:#71717a;font-size:13px;padding:6px 0;">Envío</td>
                <td style="color:#a1a1aa;font-size:13px;padding:6px 0;text-align:right;">$${shipping.toFixed(2)} MXN</td>
              </tr>
              <tr>
                <td colspan="2" style="border-top:1px solid #27272a;padding-top:12px;"></td>
              </tr>
              <tr>
                <td style="color:#ffffff;font-size:16px;font-weight:700;padding:4px 0;">Total pagado</td>
                <td style="color:#23F30E;font-size:16px;font-weight:700;padding:4px 0;text-align:right;">$${total.toFixed(2)} MXN</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#18181b;border:1px solid #27272a;border-top:none;border-radius:0 0 12px 12px;padding:24px 36px;text-align:center;">
            <p style="margin:0 0 12px;color:#52525b;font-size:12px;line-height:1.6;">
              ¿Tienes dudas sobre tu pedido? Contáctanos por WhatsApp:<br>
              <a href="https://wa.me/525547017318" style="color:#23F30E;text-decoration:none;font-weight:600;">55-47-01-73-18</a>
            </p>
            <p style="margin:0;color:#3f3f46;font-size:11px;">© 2025 Empire Nutrition — México</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendOrderConfirmation(args: OrderConfirmationArgs): Promise<void> {
  if (!resend) {
    // Resend no configurado — log en desarrollo
    console.info('[email] RESEND_API_KEY no definido — correo no enviado para orden', args.orderId)
    return
  }

  await resend.emails.send({
    from:    FROM,
    to:      args.to,
    subject: `✔ Pedido #${args.orderId.slice(0, 8).toUpperCase()} confirmado — Empire Nutrition`,
    html:    orderConfirmationHtml(args),
  })
}
