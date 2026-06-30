# Case Study: SOLOVYEV STORE

**Client:** Israeli streetwear & sneakers consignment shop  
**Site:** [solovyev.store](https://solovyev.store)  
**Deliverable:** Next.js rebuild — same brand, measurable business layer

## Problem

- Polished Instagram-first storefront, but invisible in Google (`site:` returned zero results)
- Single-page SPA: `/robots.txt`, `/sitemap.xml`, product URLs all served the same HTML
- No analytics — owners couldn't measure drop performance or WhatsApp conversion
- Inventory chaos risk: no `SOLD` / `RESERVED` / `NEW DROP` states on cards
- Silent UX failures (add to cart without size selected)
- Unstructured WhatsApp messages → extra back-and-forth

## Constraints

- No online payments
- No user accounts
- Keep WhatsApp + Instagram as checkout channels

## Solution

| Layer | Implementation |
|-------|----------------|
| Frontend | Next.js 15 static export, original CSS preserved |
| Catalog | Typed JSON (`data/products.json`) with `status` field |
| SEO | Per-product routes, `sitemap.xml`, `robots.txt`, Open Graph, JSON-LD |
| Analytics | GA4 events: `view_item`, `add_to_cart`, `begin_checkout`, `sell_trade_submit` |
| WhatsApp 2.0 | Order refs (`SS-*`), SKU, size, product URL, shipping note in cart checkout |
| UX | Size validation toasts, sticky mobile CTA, `prefers-reduced-motion` |
| Ops hook | `lib/fetchProducts.ts` documented for Google Sheets sync |

## Architecture

```
JSON catalog → next build → static HTML/JS → CDN
                    ↓
              GA4 + GSC indexing
                    ↓
         WhatsApp structured leads
```

## Results (fill after client launch)

| Metric | Before | After |
|--------|--------|-------|
| Google indexed pages | ~0 | _TBD_ |
| WhatsApp checkout clicks / drop | _unknown_ | _TBD_ |
| Time to mark item sold on site | _manual_ | _TBD_ |
| Sell/Trade lead quality | _low_ | _TBD_ |

## Portfolio assets

- Before/after: Google Search Console impressions
- Screenshot: structured WhatsApp order message
- Screenshot: product page with JSON-LD + OG tags
- Screenshot: GA4 funnel (view → cart → checkout)

## Quote placeholder

> _"Add client testimonial after pilot."_  
> — Gosha, SOLOVYEV STORE
