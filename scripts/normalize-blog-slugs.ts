/**
 * Normaliza slugs de blog_posts a ASCII (sin acentos) para URLs estables.
 * Uso: npx tsx scripts/normalize-blog-slugs.ts [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import { normalizeSlug } from '../src/lib/slug'

loadEnvLocal()

const DRY_RUN = process.argv.includes('--dry-run')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data: posts, error } = await supabase.from('blog_posts').select('id, slug, title')
  if (error || !posts) {
    console.error('❌', error?.message)
    process.exit(1)
  }

  console.log(`\n📝 Normalizar slugs de blog${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  for (const post of posts) {
    const canonical = normalizeSlug(post.slug)
    if (canonical === post.slug) {
      console.log(`  ✓ ${post.slug}`)
      continue
    }

    const conflict = posts.find((p) => p.id !== post.id && normalizeSlug(p.slug) === canonical)
    if (conflict) {
      console.warn(`  ⚠️  Conflicto: "${post.slug}" → "${canonical}" ya usado por "${conflict.title}"`)
      continue
    }

    console.log(`  ✏️  ${post.slug} → ${canonical}`)
    if (!DRY_RUN) {
      const { error: updErr } = await supabase
        .from('blog_posts')
        .update({ slug: canonical })
        .eq('id', post.id)
      if (updErr) console.warn(`     ❌ ${updErr.message}`)
    }
  }

  console.log('\n✅ Listo')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
