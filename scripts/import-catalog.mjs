/**
 * Import catalog from data/products.json into Supabase (upsert by slug).
 * Does NOT wipe existing data — safe to re-run.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Usage: npm run import:catalog
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile(".env.local");
loadEnvFile(".env");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, "data", file), "utf8"));
}

function toRow(p) {
  const shortcode = p.instagramUrl?.match(/\/p\/([^/]+)/)?.[1] ?? null;
  return {
    slug: p.slug,
    title: p.title,
    category: p.category,
    price: p.price ?? 0,
    original_price: p.originalPrice ?? null,
    condition: p.condition ?? "See description",
    brand: p.brand,
    badge: p.badge ?? "hot",
    sizes: p.sizes ?? [],
    img: p.img ?? "",
    status: p.status ?? "available",
    sold: p.sold ?? false,
    description: p.description ?? null,
    instagram_url: p.instagramUrl ?? null,
    instagram_shortcode: shortcode,
    source: p.source ?? "instagram",
    sort_order: p.id ?? 0,
  };
}

async function importCatalog() {
  const products = readJson("products.json");
  const rows = products.map(toRow);

  console.log(`Upserting ${rows.length} products (by slug)...`);
  const { data: upserted, error: prodErr } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "slug" })
    .select("id, slug, img, title, sort_order");

  if (prodErr) throw prodErr;

  const bySlug = new Map((upserted ?? []).map((row) => [row.slug, row]));
  let imagesAdded = 0;
  let imagesSkipped = 0;

  for (const src of products) {
    const row = bySlug.get(src.slug);
    if (!row?.img) continue;

    const { data: existing, error: fetchErr } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", row.id)
      .eq("image_url", row.img)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existing) {
      imagesSkipped++;
      continue;
    }

    const { error: imgErr } = await supabase.from("product_images").insert({
      product_id: row.id,
      image_url: row.img,
      alt_text: src.title,
      sort_order: 0,
    });

    if (imgErr) throw imgErr;
    imagesAdded++;
  }

  for (const row of upserted ?? []) {
    if (row.sort_order && row.sort_order > 0) continue;
    await supabase.from("products").update({ sort_order: row.id }).eq("id", row.id);
  }

  const { count, error: countErr } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  if (countErr) throw countErr;

  console.log(`Done. Upserted ${rows.length} products.`);
  console.log(`Product images: ${imagesAdded} added, ${imagesSkipped} already existed.`);
  console.log(`Total products in Supabase: ${count ?? "?"}`);
}

importCatalog().catch((err) => {
  console.error(err);
  process.exit(1);
});
