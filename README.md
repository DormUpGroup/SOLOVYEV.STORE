# SOLOVYEV STORE — Next.js

Improved rebuild of [solovyev.store](https://solovyev.store): streetwear aesthetic, account-backed WhatsApp checkout, SEO, GA4, Supabase-backed admin.

## Stack

- Next.js 15 (App Router)
- TypeScript + Supabase (catalog, FAQ, config, analytics)
- Admin panel at `/admin` (brutalist-improved UI)
- Email/password customer accounts (favorites, synced cart, order history)
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

### Customer authentication

1. Apply `supabase/migrations/006_customer_accounts.sql` (or run the full setup).
2. In Supabase Authentication → URL Configuration, set the Site URL and add
   `https://your-domain/auth/callback` as an allowed redirect.
3. In Authentication → Providers → Email, enable email/password.
   Registration creates a confirmed account immediately via the server API
   (email is only used as the login identifier).
4. Configure the Reset Password email template and keep
   `{{ .ConfirmationURL }}` as the recovery link.
5. Customer login is `/login`, registration is `/register`, and password
   recovery starts at `/forgot-password`; authenticated account data is available at
   `/account`. Checkout requires a customer session and persists an order before
   opening WhatsApp.

Customer tables use RLS tied to `auth.uid()`. The separate admin JWT flow remains
independent from customer Supabase Auth.

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
| `/login` | Email/password sign in |
| `/register` | Customer registration |
| `/forgot-password` | Password recovery |
| `/account` | Profile, favorites, cart and WhatsApp order history |
| `/sell-trade` | Valuation portal |
| `/faq` | FAQ with JSON-LD |
| `/sitemap.xml` | Auto-generated |
