# SOLOVYEV STORE — Next.js

Improved rebuild of [solovyev.store](https://solovyev.store): same streetwear aesthetic, WhatsApp-first checkout, with SEO, GA4, inventory statuses, and structured leads.

## Stack

- Next.js 15 (App Router, static export)
- TypeScript
- CSS from original site (`styles/globals.css`)
- JSON catalog in `data/`

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (default: `https://solovyev.store`) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement ID |

## Update catalog

Edit [`data/products.json`](data/products.json):

```json
{
  "id": 9,
  "slug": "item-slug",
  "title": "Item Name",
  "category": "sneakers",
  "price": 1200,
  "condition": "10/10 DS",
  "brand": "Nike",
  "badge": "hype",
  "sizes": ["42", "43"],
  "img": "/assets/your-image.png",
  "status": "available"
}
```

**Status values:** `available` | `new_drop` | `reserved` | `sold`

## Deploy

```bash
npm run build
```

Static output is in `out/`. Deploy to Vercel, Cloudflare Pages, or Netlify.

## Google Sheets (Phase 2)

See [`lib/fetchProducts.ts`](lib/fetchProducts.ts) for the planned Sheets → JSON sync schema.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Main storefront |
| `/product/[slug]` | SEO product page |
| `/sell-trade` | Valuation portal deep link |
| `/faq` | FAQ with JSON-LD |
| `/privacy` | Privacy policy |
| `/sitemap.xml` | Auto-generated |
| `/robots.txt` | Auto-generated |
