import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Empire Nutrition',
  description:
    'Política de privacidad de Comercializadora Casa Empire Nutrition SA de CV.',
}

const SECTIONS = [
  {
    title: null,
    body: `El presente Política de Privacidad establece los términos en qué Comercializadora Casa Empire Nutrition SA de CV usa y protege la información que es proporcionada por sus usuarios al momento de utilizar este sitio web.

Esta compañía está comprometida con la seguridad de los datos de sus usuarios. Cuando le pedimos llenar los campos de información personal con la cual usted pueda ser identificado, lo hacemos asegurando que sólo se empleará de acuerdo con los términos de este documento. Sin embargo esta Política de Privacidad puede cambiar con el tiempo o ser actualizada por lo que le recomendamos y enfatizamos revisar continuamente esta página para asegurarse que está de acuerdo con dichos cambios.`,
  },
  {
    title: 'Información que es recogida',
    body: `Nuestro sitio web podrá recoger información personal por ejemplo: Nombre, información de contacto como su dirección de correo electrónica e información demográfica. Así mismo cuando sea necesario podrá ser requerida información específica para procesar algún pedido o realizar una entrega o facturación.`,
  },
  {
    title: 'Uso de la información recogida',
    body: `Nuestro sitio web emplea la información con el fin de proporcionar el mejor servicio posible, particularmente para mantener un registro de usuarios, de pedidos en caso que aplique, y mejorar nuestros productos y servicios. Es posible que sean enviados correos electrónicos periódicamente a través de nuestro sitio con ofertas especiales, nuevos productos y otra información publicitaria que consideremos relevante para usted o que pueda brindarle algún beneficio, estos correos electrónicos serán enviados a la dirección que usted proporcione y podrán ser cancelados en cualquier momento.

Esta compañía está altamente comprometida para cumplir con el compromiso de mantener su información segura. Usamos los sistemas más avanzados y los actualizamos constantemente para asegurarnos que no exista ningún acceso no autorizado.`,
  },
  {
    title: 'Cookies',
    body: `Una cookie se refiere a un fichero que es enviado con la finalidad de solicitar permiso para almacenarse en su ordenador. Al aceptar dicho fichero se crea y la cookie sirve entonces para tener información respecto al tráfico web, y también facilita las futuras visitas a una web recurrente. Otra función que tienen las cookies es que con ellas las web pueden reconocerte individualmente y por tanto brindarte el mejor servicio personalizado.

Nuestro sitio web emplea las cookies para poder identificar las páginas que son visitadas y su frecuencia. Esta información es empleada únicamente para análisis estadístico y después la información se elimina de forma permanente. Usted puede eliminar las cookies en cualquier momento desde su ordenador. Sin embargo las cookies ayudan a proporcionar un mejor servicio; no dan acceso a información de su ordenador ni de usted, a menos de que usted así lo quiera y la proporcione directamente. Usted puede aceptar o negar el uso de cookies, sin embargo la mayoría de navegadores aceptan cookies automáticamente. También usted puede cambiar la configuración de su ordenador para declinar las cookies. Si se declinan es posible que no pueda utilizar algunos de nuestros servicios.`,
  },
  {
    title: 'Enlaces a Terceros',
    body: `Este sitio web pudiera contener enlaces a otros sitios que pudieran ser de su interés. Una vez que usted de clic en estos enlaces y abandone nuestra página, ya no tenemos control sobre el sitio al que es redirigido y por lo tanto no somos responsables de los términos o privacidad ni de la protección de sus datos en esos otros sitios terceros. Dichos sitios están sujetos a sus propias políticas de privacidad por lo cual es recomendable que los consulte para confirmar que usted está de acuerdo con estas.`,
  },
  {
    title: 'Control de su información personal',
    body: `En cualquier momento usted puede restringir la recopilación o el uso de la información personal que es proporcionada a nuestro sitio web. Cada vez que se le solicite rellenar un formulario, como el de alta de usuario, puede marcar o desmarcar la opción de recibir información por correo electrónico. En caso de que haya marcado la opción de recibir nuestro boletín o publicidad usted puede cancelarla en cualquier momento.

Esta compañía no venderá, cederá ni distribuirá la información personal que es recopilada sin su consentimiento, salvo que sea requerido por un juez con una orden judicial.

Se reserva el derecho de cambiar los términos de la presente Política de Privacidad en cualquier momento.`,
  },
]

export default function PrivacidadPage() {
  return (
    <div className="relative bg-black min-h-screen overflow-hidden">

      {/* Background glow — top center */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(ellipse, #E8177A 0%, transparent 70%)' }}
      />

      {/* ── Hero title ─────────────────────────────────────── */}
      <section className="relative pt-16 pb-12 text-center px-6">
        <h1
          className="font-display font-black uppercase leading-none tracking-tight"
          style={{
            color: '#E8177A',
            fontSize: 'clamp(2.8rem, 8vw, 7rem)',
            textShadow: '0 0 60px rgba(232,23,122,0.35)',
          }}
        >
          POLÍTICA DE<br />PRIVACIDAD
        </h1>

        {/* pink divider */}
        <div className="mt-8 mx-auto w-24 h-[3px] rounded-full" style={{ background: '#E8177A' }} />
      </section>

      {/* ── Content ────────────────────────────────────────── */}
      <section className="relative max-w-3xl mx-auto px-6 pb-24 space-y-10">
        {SECTIONS.map((s, i) => (
          <div key={i}>
            {s.title && (
              <h2
                className="font-display font-bold text-xl uppercase tracking-wide mb-3"
                style={{ color: '#E8177A' }}
              >
                {s.title}
              </h2>
            )}
            <div className="space-y-4">
              {s.body.split('\n\n').map((para, j) => (
                <p key={j} className="text-zinc-300 text-sm leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
            {/* subtle separator between sections */}
            {i < SECTIONS.length - 1 && (
              <div className="mt-10 h-px w-full" style={{ background: 'rgba(232,23,122,0.12)' }} />
            )}
          </div>
        ))}

        {/* Footer note */}
        <p className="text-zinc-600 text-xs pt-4 border-t border-zinc-900">
          Última actualización: 2024 · Comercializadora Casa Empire Nutrition SA de CV
        </p>
      </section>
    </div>
  )
}
