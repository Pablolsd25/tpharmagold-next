export type PostalSettlement = {
  nombre: string
  tipo: string
  ciudad: string
}

export type PostalCodeResult = {
  cp: string
  estado: string
  municipio: string
  asentamientos: PostalSettlement[]
}

function normalizeAddressText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
}

/** Empareja colonia autocompletada o escrita con el catálogo SEPOMEX */
export function matchColonia(
  asentamientos: PostalSettlement[],
  input: string,
): PostalSettlement | null {
  const q = normalizeAddressText(input)
  if (!q || asentamientos.length === 0) return null

  const exact = asentamientos.find(
    (a) => normalizeAddressText(a.nombre) === q,
  )
  if (exact) return exact

  const byCiudad = asentamientos.find(
    (a) => normalizeAddressText(a.ciudad) === q,
  )
  if (byCiudad) return byCiudad

  const partial = asentamientos.filter((a) => {
    const n = normalizeAddressText(a.nombre)
    const c = normalizeAddressText(a.ciudad)
    return n.includes(q) || q.includes(n) || c.includes(q) || q.includes(c)
  })
  if (partial.length === 1) return partial[0]

  return null
}
