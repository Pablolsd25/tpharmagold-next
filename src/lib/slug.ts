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
}
