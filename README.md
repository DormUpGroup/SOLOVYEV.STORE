# SOLOVYEV STORE — Next.js

Improved rebuild of [solovyev.store](https://solovyev.store): streetwear aesthetic, account-backed Grow card checkout, SEO, GA4, Supabase-backed admin.

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
| `MAKE_GROW_WEBHOOK_URL` | Make webhook that creates a Grow payment link and approves the callback |
| `MAKE_GROW_SECRET` | Optional shared secret sent as `x-grow-webhook-secret` |
| `GROW_USER_ID` | Direct Grow API user id. Only if the paid API add-on is enabled |
| `GROW_PAGE_CODE` | Direct Grow API page code |
| `GROW_API_BASE` | Sandbox: `https://sandbox.meshulam.co.il/api/light/server/1.0`. Production: `https://secure.meshulam.co.il/api/light/server/1.0` |

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
   `/account`. Checkout requires a customer session, an Israeli mobile number,
   and a Make webhook (`MAKE_GROW_WEBHOOK_URL`). The customer pays on Grow’s
   page; the order becomes Paid after Grow’s server callback.

### Grow checkout

1. Apply `013_payplus_checkout.sql` (order statuses / shipping) and
   `014_grow_checkout.sql` (`node scripts/apply-migration.mjs 014_grow_checkout.sql`).
2. In [Make](https://www.make.com), connect the Grow app with the business ID (ת.ז / ח.פ) and the account phone. Do not enter Grow account number `10764508`.
3. Scenario: Custom webhook → Grow **Create Payment Link** when `action` is `create` → **Webhook response** with `paymentUrl`, `processId`, and `processToken`. A second route, when `action` is `approve`, runs Grow **Approve Transaction**.
4. Set `MAKE_GROW_WEBHOOK_URL` and `MAKE_GROW_SECRET` in `.env.local` and Vercel, then redeploy.
5. Direct API keys (`GROW_USER_ID`, `GROW_PAGE_CODE`) are optional and replace Make when both are set.
6. Client go-live checklist: [docs/PAYMENT_PROVIDERS_CLIENT.md](docs/PAYMENT_PROVIDERS_CLIENT.md).

Customer tables use RLS tied to `auth.uid()`. The separate admin JWT flow remains
independent from customer Supabase Auth.

## Admin panel

Секретный URL: `/{ADMIN_PATH}` (см. `.env`). Публичный `/admin` для посторонних недоступен.

**Памятка для менеджеров (RU):** [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)

- **Catalog / Made to order / Brand new** — CRUD товаров, статусы наличия, фото
- **Users** — клиенты, поиск, фильтр «есть заказы», карточка с историей
- **Orders** — заказы с сайта (`SS-…`), статусы, оплата Grow, Copy order ref / Copy reply, сводка 7/30/90д
- **FAQ** — вопросы/ответы на сайте
- **Settings** — контакты (в т.ч. WhatsApp), валюта, анонсы, hero
- **Analytics** — события витрины (`analytics_events`)
- **Publish** — сброс кэша сайта после изменений

Статусы заказа: `pending_payment` → `paid` → `shipped` → `completed` | `cancelled`.
Checkout создаёт заказ, затем редирект на Grow; Paid ставится по callback.

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
