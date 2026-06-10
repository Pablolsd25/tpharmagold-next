# Setup T Pharma Gold — Guía paso a paso

Proyecto **independiente** de Casa Empire. Sigue estos pasos en orden.

## 1. Supabase (proyecto nuevo)

1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Nombre sugerido: `tpharmagold`
3. Copia en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → service_role)
4. En **SQL Editor**, pega y ejecuta todo el archivo `supabase/bootstrap.sql`
   - Regenerar: `npm run setup:bootstrap`
5. En **Storage**, verifica que exista el bucket público `images` (se crea al migrar productos si falta)

## 2. Wix (productos de tpharmagold.com)

1. En Wix Dashboard → Settings → API Keys, usa la key con permisos **Stores** y **Blog**
2. En `.env.local` define:
   ```
   WIX_API_KEY=...
   WIX_ACCOUNT_ID=...
   ```
3. Descubre el Site ID:
   ```bash
   npm run setup:wix
   ```
4. Copia el `WIX_SITE_ID` de tpharmagold.com a `.env.local`

## 3. Variables locales completas

```bash
cp .env.example .env.local
```

Mínimo para arrancar:

| Variable | Ejemplo |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.tpharmagold.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `WIX_API_KEY` | `IST...` |
| `WIX_SITE_ID` | uuid del sitio Wix |
| `WIX_ACCOUNT_ID` | uuid de tu cuenta Wix |
| `ADMIN_EMAILS` | `tu@email.com` |
| `CONTACT_INBOX_EMAIL` | `contacto@tpharmagold.com` |

OpenPay (pagos): credenciales sandbox o producción según el entorno.

## 4. Verificar y migrar

```bash
npm run setup:verify    # comprueba Supabase + Wix
npm run migrate:api     # productos, imágenes y blog Wix → Supabase
```

Opcional después:

```bash
npm run migrate:reviews
npm run import:media
```

## 5. Admin y usuarios

1. En Supabase → Authentication → Users, crea un usuario con el email de `ADMIN_EMAILS`
2. O ejecuta:
   ```bash
   ADMIN_SEED_PASSWORD='TuPassword' npx tsx scripts/ensure-admin-users.ts
   ```
3. Inicia sesión en `/login` y entra al panel `/admin`

## 6. Assets de marca

Coloca en `public/`:

- `logo.jpg`
- `favicon.jpg`
- `brand-banner.png` (opcional)

## 7. GitHub (repo nuevo)

```bash
git remote add origin https://github.com/Pablolsd25/tpharmagold-next.git
git push -u origin main
```

## 8. Vercel

1. Importa el repo `tpharmagold-next`
2. Pega todas las variables de `.env.local` en Vercel → Settings → Environment Variables
3. Dominio: `www.tpharmagold.com`
4. Redeploy después de cambiar variables

## Comandos útiles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor local |
| `npm run setup:bootstrap` | Regenera SQL de Supabase |
| `npm run setup:wix` | Lista sitios y colecciones Wix |
| `npm run setup:verify` | Valida configuración |
| `npm run migrate:api` | Importa catálogo desde Wix |
