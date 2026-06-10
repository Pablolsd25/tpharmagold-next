# T Pharma Gold — Tienda Next.js

Tienda en línea para [tpharmagold.com](https://www.tpharmagold.com/), basada en la misma arquitectura de Casa Empire pero como **proyecto independiente**.

## Requisitos

- Node.js 20+
- Proyecto **nuevo** de Supabase (no reutilizar el de Casa Empire)
- Cuenta OpenPay para pagos

## Configuración

1. Copia `.env.example` a `.env.local` y completa las variables.
2. Crea un proyecto Supabase nuevo y ejecuta las migraciones en `supabase/migrations/`.
3. Instala dependencias e inicia el servidor de desarrollo:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue

Despliega en Vercel (o similar) con las variables de entorno de producción. Define `NEXT_PUBLIC_SITE_URL=https://www.tpharmagold.com`.

## GitHub

Este repositorio **no** está vinculado al repo de Casa Empire. Para publicarlo:

```bash
git remote add origin https://github.com/TU_USUARIO/tpharmagold-next.git
git push -u origin main
```

## Personalización de marca

Los datos del comercio están centralizados en `src/lib/site-legal.ts`. Coloca el logo en `public/logo.jpg` y el favicon en `public/favicon.jpg`.
