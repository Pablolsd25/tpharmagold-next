/**
 * Actualiza site_settings con el video gym oficial de tpharmagold.com
 * y elimina el video showcase de Casa Empire.
 *
 * Uso: npx tsx scripts/fix-home-videos.ts
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import {
  DEFAULT_HOME_VIDEO_480,
  DEFAULT_HOME_VIDEO_1080,
} from '../src/lib/home-video'

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  const updates = [
    { key: 'home_video_480', value: DEFAULT_HOME_VIDEO_480 },
    { key: 'home_video_1080', value: DEFAULT_HOME_VIDEO_1080 },
  ]

  for (const row of updates) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: row.key, value: row.value, updated_at: new Date().toISOString() })
    if (error) throw error
    console.log('✓', row.key)
  }

  const { error: delErr } = await supabase
    .from('site_settings')
    .delete()
    .eq('key', 'home_showcase_video')

  if (delErr) throw delErr
  console.log('✓ home_showcase_video eliminado')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
