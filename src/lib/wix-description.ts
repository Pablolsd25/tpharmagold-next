/**
 * Normaliza HTML de descripciones migradas desde Wix para mejor lectura en el sitio.
 */
export function normalizeWixDescription(html: string): string {
  if (!html?.trim()) return ''

  let out = html
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/gi, ' ')

  // Párrafos vacíos
  out = out.replace(/<p>\s*<\/p>/gi, '')
  out = out.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')

  // Párrafos con viñetas en <br> → lista
  out = out.replace(/<p>([\s\S]*?)<\/p>/gi, (_full: string, inner: string) => {
    const parts = inner
      .split(/<br\s*\/?>/i)
      .map((s: string) => s.trim())
      .filter(Boolean)

    if (parts.length < 2) return `<p>${inner.trim()}</p>`

    const isBullet = (line: string) =>
      /^[✅✔️•\-–]/.test(line.replace(/<[^>]+>/g, '').trim())

    const bulletCount = parts.filter(isBullet).length
    if (bulletCount >= 2 && bulletCount >= parts.length * 0.5) {
      return `<ul>${parts.map((line) => `<li>${line}</li>`).join('')}</ul>`
    }

    return `<p>${parts.join('<br>')}</p>`
  })

  // Espacios dobles fuera de tags
  out = out.replace(/>([^<]+)</g, (_, text: string) => {
    const collapsed = text.replace(/[ \t]{2,}/g, ' ')
    return `>${collapsed}<`
  })

  return out.trim()
}

/** Compara descripciones ignorando espacios y entidades nbsp. */
export function descriptionsEquivalent(a: string | null | undefined, b: string | null | undefined): boolean {
  const norm = (s: string) =>
    s
      .replace(/\u00a0/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  return norm(a ?? '') === norm(b ?? '')
}
