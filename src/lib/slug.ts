/** Slug normalizado: sin acentos, minúsculas (Wix vs Supabase pueden diferir en tildes). */
export function normalizeSlug(slug: string): string {
  return slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Slugs equivalentes entre Wix y Supabase (mismo producto, distinto slug). */
export const SLUG_ALIASES: Record<string, string[]> = {
  'combo-beach-peach': ['pink-booty-boobs-kit'],
  'pink-booty-boobs-kit': ['combo-beach-peach'],
  stanozolo: ['stanozol'],
  stanozol: ['stanozolo'],
  nondrolone: ['nandrolone'],
  nandrolone: ['nondrolone'],
  'jintropin-100ui': ['jintropin100ui'],
  jintropin100ui: ['jintropin-100ui'],
}

function aliasKeys(slug: string): string[] {
  const norm = normalizeSlug(slug)
  return [slug, norm, ...(SLUG_ALIASES[slug] ?? []), ...(SLUG_ALIASES[norm] ?? [])]
}

/** Busca producto por slug Wix, probando alias y normalización de acentos. */
export function findProductBySlug<T extends { slug: string }>(
  byNorm: Map<string, T>,
  slug: string,
): T | undefined {
  for (const key of aliasKeys(slug)) {
    const match = byNorm.get(normalizeSlug(key))
    if (match) return match
  }
  return undefined
}
