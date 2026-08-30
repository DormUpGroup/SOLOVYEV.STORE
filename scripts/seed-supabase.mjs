/**
 * Seed Supabase from local JSON files.
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env
 *
 * Usage: npm run seed:supabase
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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
    clothing_type: p.category === "clothing" ? (p.clothingType ?? null) : null,
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
  };
}

async function seed() {
  const products = readJson("products.json");
  const config = readJson("config.json");
  const faq = readJson("faq.json");

  console.log("Clearing existing data...");
  await supabase.from("analytics_events").delete().neq("id", 0);
  await supabase.from("product_images").delete().neq("id", 0);
  await supabase.from("products").delete().neq("id", 0);
  await supabase.from("faq_items").delete().neq("id", 0);

  const rows = products.map(toRow);
  const { data: inserted, error: prodErr } = await supabase.from("products").insert(rows).select("id, img, title");
  if (prodErr) throw prodErr;
  console.log(`Inserted ${rows.length} products`);

  const imageRows = [];
  for (let i = 0; i < (inserted ?? []).length; i++) {
    const row = inserted[i];
    const src = products[i];
    if (row?.img) {
      imageRows.push({
        product_id: row.id,
        image_url: row.img,
        alt_text: src.title,
        sort_order: 0,
      });
    }
  }
  if (imageRows.length) {
    const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
    if (imgErr) throw imgErr;
    console.log(`Inserted ${imageRows.length} product images`);
  }

  for (const row of inserted ?? []) {
    await supabase.from("products").update({ sort_order: row.id }).eq("id", row.id);
  }

  const faqRows = faq.map((item, i) => ({
    sort_order: i,
    question: item.question,
    answer: item.answer,
  }));
  const { error: faqErr } = await supabase.from("faq_items").insert(faqRows);
  if (faqErr) throw faqErr;
  console.log(`Inserted ${faqRows.length} FAQ items`);

  const announcements = {
    freeShipping: "FREE SHIPPING ON ORDERS OVER ₪1000",
    authenticity: "100% AUTHENTICITY GUARANTEED",
    newDrops: "NEW DROPS EVERY FRIDAY",
  };

  const { error: cfgErr } = await supabase.from("store_config").upsert({
    id: 1,
    data: { ...config, announcements },
  });
  if (cfgErr) throw cfgErr;
  console.log("Upserted store_config");

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
