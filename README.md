# SOLOVYEV STORE — Next.js

Improved rebuild of [solovyev.store](https://solovyev.store): streetwear aesthetic, WhatsApp-first checkout, SEO, GA4, Supabase-backed admin.

## Stack

- Next.js 15 (App Router)
- TypeScript + Supabase (catalog, FAQ, config, analytics)
- Admin panel at `/admin` (brutalist-improved UI)
- CSS from original site (`styles/globals.css`)

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin: [http://localhost:3000/admin](http://localhost:3000/admin).

Without Supabase env vars, the site falls back to [`data/products.json`](data/products.json).

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — admin API + seed |
| `ADMIN_PASSWORD` | Password for `/admin` |

## Supabase setup

1. Add API keys to `.env.local` (Dashboard → Project Settings → API)
2. Add `SUPABASE_DB_PASSWORD` (Dashboard → Project Settings → Database)
3. Run: `npm run setup:supabase` — applies migrations + seeds catalog

Manual fallback: paste SQL from `supabase/migrations/` into Supabase SQL Editor, then `npm run seed:supabase`

## Admin panel

- **Catalog** — CRUD, Sold / Reserved / New Drop, image upload to Storage
- **FAQ** — edit questions/answers (live on site)
- **Settings** — contacts, currency, announcements, hero image
- **Analytics** — views, cart, WhatsApp checkout from `analytics_events`
- **Publish** — revalidates site cache after changes

## Instagram import

- CLI: `npm run import:instagram` (from `data/instagram-raw.json`)
- Admin API: `POST /api/admin/instagram/import` (URL + caption + image)
- Cron stub: `POST /api/cron/instagram-sync` (set `INSTAGRAM_ACCESS_TOKEN`)

## Deploy

```bash
npm run build
npm start
```

Deploy to Vercel with Supabase env vars configured.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Main storefront |
| `/admin` | Store management |
| `/product/[slug]` | SEO product page |
| `/sell-trade` | Valuation portal |
| `/faq` | FAQ with JSON-LD |
| `/sitemap.xml` | Auto-generated |
