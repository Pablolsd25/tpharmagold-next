/**
 * Comprime imágenes ya alojadas en Supabase Storage.
 *
 * Uso:
 *   npm run compress:images
 *   npm run compress:images -- --dry-run
 *   npm run compress:images -- --folder=products --limit=20
 */
import { createClient } from '@supabase/supabase-js'
import { compressImageBuffer, formatBytes } from '../src/lib/utils/image-compress-server'
import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

const DRY_RUN = process.argv.includes('--dry-run')
const FOLDER_ARG = process.argv.find((a) => a.startsWith('--folder='))?.split('=')[1]
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables Supabase en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const BUCKET = 'images'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

async function listFilesRecursive(prefix: string): Promise<string[]> {
  const paths: string[] = []
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  })

  if (error || !data) return paths

  for (const item of data) {
    const path = prefix ? `${prefix}/${item.name}` : item.name
    if (item.metadata === null) {
      paths.push(...(await listFilesRecursive(path)))
      continue
    }
    const lower = item.name.toLowerCase()
    if ([...IMAGE_EXT].some((ext) => lower.endsWith(ext))) {
      paths.push(path)
    }
  }

  return paths
}

async function downloadFile(path: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}

async function main() {
  console.log(`\n🗜️  Comprimir imágenes en Storage${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  const roots = FOLDER_ARG ? [FOLDER_ARG] : ['products', 'blog', 'categories', 'home']
  let files: string[] = []
  for (const root of roots) {
    const found = await listFilesRecursive(root)
    files = files.concat(found)
  }

  files = [...new Set(files)].sort()
  if (LIMIT > 0) files = files.slice(0, LIMIT)

  console.log(`Archivos a revisar: ${files.length}`)

  let processed = 0
  let savedBytes = 0
  let skipped = 0
  let failed = 0

  for (const path of files) {
    const buffer = await downloadFile(path)
    if (!buffer) {
      failed++
      continue
    }

    const compressed = await compressImageBuffer(buffer)

    if (compressed.afterBytes >= compressed.beforeBytes * 0.95) {
      skipped++
      continue
    }

    const reduction = compressed.beforeBytes - compressed.afterBytes
    console.log(
      `  ${path}: ${formatBytes(compressed.beforeBytes)} → ${formatBytes(compressed.afterBytes)} (-${formatBytes(reduction)})`,
    )

    if (DRY_RUN) {
      processed++
      savedBytes += reduction
      continue
    }

    const { error } = await supabase.storage.from(BUCKET).upload(path, compressed.buffer, {
      contentType: compressed.contentType,
      upsert: true,
    })

    if (error) {
      console.warn(`    ❌ ${error.message}`)
      failed++
      continue
    }

    processed++
    savedBytes += reduction
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Comprimidas:  ${processed}
⏭️  Sin cambio:   ${skipped}
❌ Fallidas:     ${failed}
💾 Ahorro total: ${formatBytes(savedBytes)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
