#!/usr/bin/env npx tsx
/**
 * Aplica supabase/migrations/20260613_product_options.sql vía conexión Postgres.
 *
 * Uso (elige una):
 *   DATABASE_URL='postgresql://...' npx tsx scripts/apply-product-options-migration.ts
 *   npx tsx scripts/apply-product-options-migration.ts --db-password=TU_PASSWORD_DB
 *
 * La contraseña está en Supabase Dashboard → Project Settings → Database.
 */
import * as fs from 'fs'
import * as path from 'path'
import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

function getDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const passwordArg = process.argv.find((a) => a.startsWith('--db-password='))
  const password = passwordArg?.split('=').slice(1).join('=') ?? process.env.SUPABASE_DB_PASSWORD
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!password || !supabaseUrl) return null

  const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (!ref) return null

  const encoded = encodeURIComponent(password)
  // Conexión directa (Settings → Database → Connection string → URI)
  return `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`
}

async function main() {
  const dbUrl = getDatabaseUrl()
  const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  const sqlUrl = ref
    ? `https://supabase.com/dashboard/project/${ref}/sql/new`
    : 'https://supabase.com/dashboard'

  const sqlPath = path.resolve('supabase/migrations/20260613_product_options.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  if (!dbUrl) {
    console.log(`
❌ Sin conexión directa a Postgres.

Opción A — SQL Editor (manual):
  1. ${sqlUrl}
  2. Ejecuta: ${sqlPath}

Opción B — CLI con contraseña de DB:
  npx tsx scripts/apply-product-options-migration.ts --db-password=TU_PASSWORD

Opción C — variable de entorno:
  DATABASE_URL='postgresql://...' npx tsx scripts/apply-product-options-migration.ts
`)
    process.exit(1)
  }

  let pg: typeof import('pg')
  try {
    pg = await import('pg')
  } catch {
    console.error('❌ Instala pg: npm install pg')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(sql)
    console.log('✅ Migración product_options aplicada.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('❌', err.message ?? err)
  process.exit(1)
})
