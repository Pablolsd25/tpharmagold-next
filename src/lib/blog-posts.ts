import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeSlug } from '@/lib/slug'
import type { BlogPost } from '@/types'

/** Ruta pública canónica (sin acentos) para un post del blog. */
export function blogPostPath(slug: string): string {
  return `/blog/${normalizeSlug(slug)}`
}

/** Busca post publicado por slug de URL (tolera acentos Wix vs ASCII en la barra). */
export async function fetchPublishedBlogPostBySlug(
  supabase: SupabaseClient,
  urlSlug: string,
): Promise<BlogPost | null> {
  const target = normalizeSlug(decodeURIComponent(urlSlug))

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)

  if (error || !data) return null

  return (data as BlogPost[]).find((p) => normalizeSlug(p.slug) === target) ?? null
}
