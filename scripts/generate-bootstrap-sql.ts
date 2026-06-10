// Genera supabase/bootstrap.sql (schema + todas las migraciones en orden)
// Uso: npx tsx scripts/generate-bootstrap-sql.ts

import * as fs from 'fs'
import * as path from 'path'

const root = process.cwd()
const schemaPath = path.join(root, 'src/supabase/schema.sql')
const migrationsDir = path.join(root, 'supabase/migrations')
const outPath = path.join(root, 'supabase/bootstrap.sql')

const schema = fs.readFileSync(schemaPath, 'utf-8')
const migrations = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

const parts = [
  '-- ============================================================',
  '-- T Pharma Gold — Bootstrap completo para proyecto Supabase NUEVO',
  '-- Pegar en: Supabase Dashboard → SQL Editor → Run',
  '-- Generado automáticamente. No editar a mano.',
  '-- ============================================================\n',
  schema.trim(),
  '',
]

for (const file of migrations) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8').trim()
  parts.push(`-- ── migration: ${file} ──`)
  parts.push(sql)
  parts.push('')
}

fs.writeFileSync(outPath, parts.join('\n') + '\n')
console.log(`✅ Generado ${outPath}`)
console.log(`   ${migrations.length} migraciones incluidas`)
