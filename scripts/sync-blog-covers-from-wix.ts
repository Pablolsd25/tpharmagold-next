/**
 * Sincroniza portadas de blog desde Wix → Supabase.
 * Uso: npx tsx scripts/sync-blog-covers-from-wix.ts
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import { wixMediaUrl } from '../src/lib/wix-media'

loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan variables Supabase')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

/** slug → fileId Wix (og:image de cada post) */
const COVERS: Record<string, string> = {
  'testimonios-de-nuestras-clientas-pinkkit-glúteos-piernas-busto-bye-bye-abdomen':
    '98134b_29ec53796b7541f1a035437a918cf66d~mv2.jpeg',
  'escribe-en-tu-blog-desde-tu-sitio-web-o-móvil':
    '98134b_ddfc908fc3b241608c8c912113c414a1~mv2.jpeg',
}

async function fetchOgImage(slug: string): Promise<string | null> {
  const url = `https://www.tpharmagold.com/post/${encodeURI(slug)}`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'tpharmagold-sync/1.0' } })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/property="og:image"\s+content="[^"]*media\/([^"/?]+)/)
    if (m) return m[1].includes('.') ? m[1] : `${m[1]}.jpeg`
  } catch {
    /* fallback estático */
  }
  return COVERS[slug] ?? null
}

async function main() {
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, cover_image')
    .eq('is_published', true)

  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  console.log(`\n${posts?.length ?? 0} posts publicados\n`)

  for (const post of posts ?? []) {
    const fileId = (await fetchOgImage(post.slug)) ?? COVERS[post.slug]
    if (!fileId) {
      console.log(`⚠️  Sin portada para: ${post.slug}`)
      continue
    }
    const coverUrl = wixMediaUrl(fileId)
    if (post.cover_image === coverUrl) {
      console.log(`✓ Ya actualizado: ${post.title}`)
      continue
    }
    const { error: upErr } = await supabase
      .from('blog_posts')
      .update({ cover_image: coverUrl })
      .eq('id', post.id)
    if (upErr) {
      console.error(`❌ ${post.slug}:`, upErr.message)
    } else {
      console.log(`✅ ${post.title}`)
      console.log(`   ${coverUrl}`)
    }
  }
}

main()
