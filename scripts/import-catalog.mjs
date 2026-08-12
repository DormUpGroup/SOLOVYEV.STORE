/**
 * Import catalog from data/products.json into Supabase (upsert by slug).
 * Uploads local /assets/products/* images to Supabase Storage as optimized WebP.
 * Does NOT wipe existing data — safe to re-run.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Usage: npm run import:catalog
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile(".env.local");
loadEnvFile(".env");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTS_PATH = path.join(root, "data", "products.json");
const PUBLIC_PRODUCTS_PATH = path.join(root, "public", "data", "products.json");
const BUCKET = "product-images";

const NEW_DROP_SLUGS = new Set([
  "off-white-spray-arrow-tee-cream",
  "project-gr-zip-hoodie-heather-grey",
  "stussy-desert-camo-waffle-ls",
]);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function extractShortcode(instagramUrl) {
  return instagramUrl?.match(/\/(?:p|reel)\/([^/]+)/)?.[1] ?? null;
}

function isRemoteUrl(img) {
  return typeof img === "string" && /^https?:\/\//i.test(img);
}

function resolveLocalImagePath(img) {
  if (!img || isRemoteUrl(img) || !img.startsWith("/")) return null;
  const relativePath = img.replace(/^[/\\]+/, "");
  const localPath = path.join(root, "public", relativePath);
  return fs.existsSync(localPath) ? localPath : null;
}

async function optimizeAndUpload(localPath) {
  const raw = fs.readFileSync(localPath);
  const optimized = await sharp(raw)
    .rotate()
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const objectPath = `${randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, optimized, {
    contentType: "image/webp",
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Upload failed for ${localPath}: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

function toRow(p, uploadedImageUrl) {
  const shortcode = extractShortcode(p.instagramUrl);
  const status = NEW_DROP_SLUGS.has(p.slug) ? "new_drop" : (p.status ?? "available");
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
    img: uploadedImageUrl ?? p.img ?? "",
    status,
    sold: p.sold ?? status === "sold",
    description: p.description ?? null,
    instagram_url: p.instagramUrl ?? null,
    instagram_shortcode: shortcode,
    source: p.source ?? "instagram",
    sort_order: p.id ?? 0,
  };
}

function writeProductsJson(products) {
  const json = `${JSON.stringify(products, null, 2)}\n`;
  fs.writeFileSync(PRODUCTS_PATH, json);
  fs.mkdirSync(path.dirname(PUBLIC_PRODUCTS_PATH), { recursive: true });
  fs.writeFileSync(PUBLIC_PRODUCTS_PATH, json);
}

async function importCatalog() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf8"));
  const rows = [];
  let uploaded = 0;
  let reusedRemote = 0;

  for (const p of products) {
    let imageUrl = p.img ?? "";

    if (isRemoteUrl(imageUrl)) {
      reusedRemote++;
    } else {
      const localPath = resolveLocalImagePath(imageUrl);
      if (localPath) {
        process.stdout.write(`Upload ${path.basename(localPath)}... `);
        imageUrl = await optimizeAndUpload(localPath);
        console.log("ok");
        uploaded++;
        p.img = imageUrl;
      } else if (imageUrl) {
        console.warn(`Missing local image for ${p.slug}: ${imageUrl}`);
      }
    }

    if (NEW_DROP_SLUGS.has(p.slug)) {
      p.status = "new_drop";
      p.sold = false;
    }

    rows.push(toRow(p, imageUrl));
  }

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

    const { data: existingRows, error: fetchErr } = await supabase
      .from("product_images")
      .select("id, image_url")
      .eq("product_id", row.id);

    if (fetchErr) throw fetchErr;

    const rowsForProduct = existingRows ?? [];
    if (rowsForProduct.some((r) => r.image_url === row.img)) {
      imagesSkipped++;
      continue;
    }

    // Keep multi-image admin galleries intact; only seed when empty or local leftovers.
    const onlyLocal =
      rowsForProduct.length > 0 &&
      rowsForProduct.every((r) => String(r.image_url).startsWith("/"));

    if (rowsForProduct.length > 0 && !onlyLocal) {
      imagesSkipped++;
      continue;
    }

    if (onlyLocal) {
      await supabase.from("product_images").delete().eq("product_id", row.id);
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

  writeProductsJson(products);

  const { count, error: countErr } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  if (countErr) throw countErr;

  console.log(`Done. Upserted ${rows.length} products.`);
  console.log(`Images uploaded: ${uploaded}, remote reused: ${reusedRemote}`);
  console.log(`Product images: ${imagesAdded} added, ${imagesSkipped} skipped.`);
  console.log(`Total products in Supabase: ${count ?? "?"}`);
}

importCatalog().catch((err) => {
  console.error(err);
  process.exit(1);
});
