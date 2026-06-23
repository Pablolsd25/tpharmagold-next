/**
 * Descarga portadas del blog desde Wix API y las sube a Supabase Storage.
 * Reemplaza URLs wixstatic.com por URLs del bucket images/blog/.
 *
 * Uso: npx tsx scripts/sync-blog-covers-to-supabase.ts [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import { compressImageBuffer } from '../src/lib/utils/image-compress-server'

loadEnvLocal()

const DRY_RUN = process.argv.includes('--dry-run')
const WIX_API_KEY = process.env.WIX_API_KEY!
const WIX_SITE_ID = process.env.WIX_SITE_ID!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!WIX_API_KEY || !WIX_SITE_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const wixHeaders: Record<string, string> = {
  Authorization: WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
  'Content-Type': 'application/json',
}
if (process.env.WIX_ACCOUNT_ID) wixHeaders['wix-account-id'] = process.env.WIX_ACCOUNT_ID

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function uploadCover(buffer: Buffer, slug: string): Promise<string | null> {
  const compressed = await compressImageBuffer(buffer)
  const safeSlug = slugify(slug)
  const path = `blog/${safeSlug}-cover.${compressed.extension}`
  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, compressed.buffer, { contentType: compressed.contentType, upsert: true })
  if (error) {
    console.warn(`     storage error (${path}):`, error.message)
    return null
  }
  const { data: pub } = supabase.storage.from('images').getPublicUrl(data.path)
  return pub.publicUrl
}

interface WixPost {
  title: string
  slug?: string
  coverMedia?: { image?: { url?: string } }
  media?: {
    wixMedia?: { image?: { url?: string } }
    displayed?: boolean
  }
}

/** slug → fileId Wix (fallback si la API no devuelve media) */
const COVER_FALLBACK: Record<string, string> = {
  'testimonios-de-nuestras-clientas-pinkkit-glúteos-piernas-busto-bye-bye-abdomen':
    'https://static.wixstatic.com/media/98134b_29ec53796b7541f1a035437a918cf66d~mv2.jpeg',
  'escribe-en-tu-blog-desde-tu-sitio-web-o-móvil':
    'https://static.wixstatic.com/media/98134b_ddfc908fc3b241608c8c912113c414a1~mv2.jpeg',
}

function resolveCoverUrl(post: WixPost): string | null {
  return (
    post.coverMedia?.image?.url ??
    post.media?.wixMedia?.image?.url ??
    (post.slug ? COVER_FALLBACK[post.slug] ?? null : null)
  )
}

async function main() {
  console.log(`\n📝 Blog: portadas Wix → Supabase${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  const res = await fetch('https://www.wixapis.com/blog/v3/posts/query', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({ query: { paging: { limit: 100 } } }),
  })
  if (!res.ok) {
    console.error('❌ Blog API:', await res.text())
    process.exit(1)
  }

  const { posts } = (await res.json()) as { posts?: WixPost[] }
  console.log(`Posts en Wix: ${posts?.length ?? 0}\n`)

  let updated = 0
  for (const post of posts ?? []) {
    const slug = post.slug ?? slugify(post.title)
    const coverUrl = resolveCoverUrl(post)
    if (!coverUrl) {
      console.warn(`  ⚠️  Sin portada: ${post.title}`)
      continue
    }

    const { data: existing } = await supabase.from('blog_posts').select('id, cover_image').eq('slug', slug).maybeSingle()
    if (!existing) {
      console.warn(`  ⚠️  Post no en SB: ${slug}`)
      continue
    }

    if (existing.cover_image?.includes('.supabase.co/storage/')) {
      console.log(`  ✓ Ya en Supabase: ${post.title}`)
      continue
    }

    console.log(`  📥 ${post.title}`)

    if (DRY_RUN) {
      console.log(`     → images/blog/${slug}-cover.jpg`)
      updated++
      continue
    }

    const buffer = await downloadImage(coverUrl)
    if (!buffer) {
      console.warn(`     ❌ No se pudo descargar`)
      continue
    }

    const publicUrl = await uploadCover(buffer, slug)
    if (!publicUrl) {
      console.warn(`     ❌ Error subiendo`)
      continue
    }

    const { error } = await supabase.from('blog_posts').update({ cover_image: publicUrl }).eq('id', existing.id)
    if (error) {
      console.warn(`     ❌ DB:`, error.message)
      continue
    }

    console.log(`     ✅ ${publicUrl}`)
    updated++
  }

  console.log(`\n🎉 Actualizados: ${updated}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
