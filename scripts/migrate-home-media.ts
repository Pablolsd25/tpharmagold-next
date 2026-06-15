/**
 * Migra video hero, poster y imagen showcase de Wix → Supabase Storage.
 *
 * Uso: npx tsx scripts/migrate-home-media.ts
 */
import { createClient } from '@supabase/supabase-js'
import { execFile } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { promisify } from 'util'
import { loadEnvLocal } from './load-env-local'
import { buildFfmpegCompressArgs, VIDEO_HERO_PRESET } from '../src/lib/utils/video-compress-config'

loadEnvLocal()

const WIX_HERO_VIDEO =
  'https://video.wixstatic.com/video/98134b_6dd464ad60084e9aae7151a182b7f2fc/480p/mp4/file.mp4'
const WIX_HERO_POSTER =
  'https://static.wixstatic.com/media/98134b_6dd464ad60084e9aae7151a182b7f2fcf000.jpg/v1/fill/w_1920,h_1080,al_c,q_85/98134b_6dd464ad60084e9aae7151a182b7f2fcf000.jpg'
const WIX_SHOWCASE_IMAGE =
  'https://static.wixstatic.com/media/98134b_dbacde3932e040b1a07b7d51fdf28381~mv2.jpeg'

const execFileAsync = promisify(execFile)
const BUCKET = 'images'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !key) {
  console.error('Faltan variables Supabase')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

function publicUrl(filePath: string) {
  return `${url}/storage/v1/object/public/${BUCKET}/${filePath}`
}

async function download(src: string): Promise<Buffer> {
  const res = await fetch(src, { headers: { Referer: 'https://www.tpharmagold.com/' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${src}`)
  return Buffer.from(await res.arrayBuffer())
}

async function upload(filePath: string, buffer: Buffer, contentType: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, { contentType, upsert: true })
  if (error) throw error
  const pub = publicUrl(filePath)
  console.log('✅', pub)
  return pub
}

async function compressVideo(input: string, output: string) {
  await execFileAsync(
    'ffmpeg',
    buildFfmpegCompressArgs(input, output, {
      maxWidth: VIDEO_HERO_PRESET.maxWidth,
      crf: VIDEO_HERO_PRESET.crf,
      preset: VIDEO_HERO_PRESET.preset,
      includeAudio: false,
    }),
  )
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-home-'))
  try {
    // Hero video
    console.log('📹 Video hero...')
    const rawVid = path.join(tmp, 'hero-raw.mp4')
    const outVid = path.join(tmp, 'hero.mp4')
    fs.writeFileSync(rawVid, await download(WIX_HERO_VIDEO))
    await compressVideo(rawVid, outVid)
    const heroUrl = await upload('videos/home-hero-480.mp4', fs.readFileSync(outVid), 'video/mp4')

    // Poster
    console.log('🖼️  Poster hero...')
    const posterBuf = await download(WIX_HERO_POSTER)
    const posterUrl = await upload('videos/home-hero-poster.jpg', posterBuf, 'image/jpeg')

    // Showcase image
    console.log('🖼️  Imagen showcase...')
    const showcaseBuf = await download(WIX_SHOWCASE_IMAGE)
    const showcaseUrl = await upload('products/home-showcase.jpg', showcaseBuf, 'image/jpeg')

    const updates = [
      { key: 'home_video_480', value: heroUrl },
      { key: 'home_video_1080', value: heroUrl },
      { key: 'home_showcase_image', value: showcaseUrl },
    ]
    for (const row of updates) {
      await supabase.from('site_settings').upsert({
        key: row.key,
        value: row.value,
        updated_at: new Date().toISOString(),
      })
    }

    console.log('\n✓ site_settings actualizado')
    console.log('  home_video_480/1080 → Supabase')
    console.log('  poster:', posterUrl)
    console.log('  showcase:', showcaseUrl)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

main().catch((e) => {
  console.error('❌', e)
  process.exit(1)
})
