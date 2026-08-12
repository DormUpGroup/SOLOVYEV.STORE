/**
 * One-shot: download Drive photos → optimize → Supabase storage + products.
 * Usage: node scripts/add-drive-products.mjs
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const PRODUCTS = [
  {
    title: "Off-White spray arrow tee cream",
    slug: "off-white-spray-arrow-tee-cream",
    category: "clothing",
    brand: "Off-White",
    badge: "hot",
    status: "available",
    price: 580,
    condition: "9 out 10",
    sizes: ["M-L"],
    description:
      "Off-White spray arrow tee cream\nCondition: 9 out 10\nSize: M-L\nPrice: 580",
    images: [
      { name: "DSC01641.jpg", id: "1rdMiV4yLB2KrdKjiKJxTwrmJh36k3zrS" },
      { name: "DSC01644.jpg", id: "1-hYKi3TrILa6ibjSE47XiCG6jTwiQc9j" },
      { name: "DSC01647.jpg", id: "13ezp6QDY0mNNEJVKgmQC4Q9e7VR6Qpe2" },
      { name: "DSC01650.jpg", id: "1fGmfHmX4dFFcBltHfxr2kQEp78jnt8ud" },
    ],
  },
  {
    title: "PROJECT G/R zip hoodie heather grey",
    slug: "project-gr-zip-hoodie-heather-grey",
    category: "clothing",
    brand: "PROJECT G/R",
    badge: "hot",
    status: "available",
    price: 450,
    condition: "10 of 10",
    sizes: ["L"],
    description:
      "PROJECT G/R zip hoodie heather grey\nCondition: 10 of 10\nSize: L\nPrice: 450",
    images: [
      { name: "DSC01652.jpg", id: "1F-08oAoK1kLqsFcVk6aMycVDNcuc-6eW" },
      { name: "DSC01656.jpg", id: "1dX5ParTML6CPM7aqc6zn8dU2TDkz2iPz" },
      { name: "DSC01658.jpg", id: "1GqeQHIA0KU8IjYR3psFby8iNlSBPTY6G" },
      { name: "DSC01659.jpg", id: "1VEUs1PCY8WhcukbgwQCFFVVUc5NJTOre" },
      { name: "DSC01667.jpg", id: "1gqLgxN6frgBfwpS-HMRoF445VCBC203d" },
    ],
  },
  {
    title: "Stussy desert camo waffle LS",
    slug: "stussy-desert-camo-waffle-ls",
    category: "clothing",
    brand: "Stussy",
    badge: "hot",
    status: "available",
    price: 320,
    condition: "9 out 10",
    sizes: ["M"],
    description:
      "Stussy desert camo waffle LS\nCondition: 9 out 10\nSize: M\nPrice: 320",
    images: [
      { name: "DSC01670.jpg", id: "1T4jPvI9N7V7kaHvTDYl7GdBtT_RlZztn" },
      { name: "DSC01674.jpg", id: "17WzFWq9phyaIXPCkQkcF-Dwxc-JqrFUz" },
      { name: "DSC01675.jpg", id: "1KhallkIcpfL1Ew3TA0EBBTtkUuP-GEn1" },
      { name: "DSC01679.jpg", id: "18CFAsu1v3ul2nFGC5o2zRIWPDVjevtmZ" },
      { name: "DSC01681.jpg", id: "1fvPsdj3_s9XtY6wERYsB6QWuPQe_AIdn" },
    ],
  },
];

async function downloadDriveFile(fileId) {
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(downloadUrl, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Download failed for ${fileId}: ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    // Confirm-virus interstitial for larger files — retry with confirm token
    const html = await res.text();
    const confirm =
      html.match(/confirm=([0-9A-Za-z_-]+)/)?.[1] ||
      html.match(/name="confirm" value="([^"]+)"/)?.[1];
    if (!confirm) {
      throw new Error(`Got HTML instead of image for ${fileId}`);
    }
    const retry = await fetch(
      `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirm}`,
      { redirect: "follow" },
    );
    if (!retry.ok) {
      throw new Error(`Confirm download failed for ${fileId}: ${retry.status}`);
    }
    return Buffer.from(await retry.arrayBuffer());
  }
  return Buffer.from(await res.arrayBuffer());
}

async function optimizeImage(buffer) {
  const optimized = await sharp(buffer)
    .rotate()
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return optimized;
}

async function uploadImage(buffer) {
  const pathName = `${randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(pathName, buffer, {
    contentType: "image/webp",
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(pathName);
  return data.publicUrl;
}

async function createProduct(def, imageUrls) {
  const primary = imageUrls[0];
  const row = {
    slug: def.slug,
    title: def.title,
    category: def.category,
    price: def.price,
    original_price: null,
    condition: def.condition,
    brand: def.brand,
    badge: def.badge,
    sizes: def.sizes,
    img: primary,
    status: def.status,
    sold: false,
    description: def.description,
    instagram_url: null,
    instagram_shortcode: null,
    source: "admin",
    sort_order: 0,
  };

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", def.slug)
    .maybeSingle();

  if (existing) {
    console.log(`Slug already exists, skipping insert: ${def.slug} (id=${existing.id})`);
    return { id: existing.id, skipped: true, img: primary };
  }

  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) throw error;

  const imageRows = imageUrls.map((imageUrl, i) => ({
    product_id: data.id,
    image_url: imageUrl,
    alt_text: def.title,
    sort_order: i,
    object_position: "50% 50%",
  }));
  const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
  if (imgErr) {
    await supabase.from("products").delete().eq("id", data.id);
    throw imgErr;
  }

  await supabase.from("products").update({ sort_order: data.id }).eq("id", data.id);

  return { id: data.id, skipped: false, img: primary };
}

function syncJson(created) {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf8"));
  const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);

  const additions = created.map((c, i) => {
    const def = PRODUCTS[i];
    return {
      id: maxId + i + 1,
      slug: def.slug,
      title: def.title,
      category: def.category,
      price: def.price,
      condition: def.condition,
      brand: def.brand,
      badge: def.badge,
      sizes: def.sizes,
      img: c.img,
      status: def.status,
      description: def.description,
      source: "admin",
    };
  });

  const bySlug = new Set(products.map((p) => p.slug));
  for (const add of additions) {
    if (bySlug.has(add.slug)) {
      const idx = products.findIndex((p) => p.slug === add.slug);
      products[idx] = { ...products[idx], ...add, id: products[idx].id };
    } else {
      products.push(add);
    }
  }

  const json = `${JSON.stringify(products, null, 2)}\n`;
  fs.writeFileSync(PRODUCTS_PATH, json);
  fs.mkdirSync(path.dirname(PUBLIC_PRODUCTS_PATH), { recursive: true });
  fs.writeFileSync(PUBLIC_PRODUCTS_PATH, json);
  console.log(`Synced ${additions.length} products into products.json`);
}

async function main() {
  const created = [];

  for (const def of PRODUCTS) {
    console.log(`\n=== ${def.title} ===`);
    const urls = [];
    for (const img of def.images) {
      process.stdout.write(`  download ${img.name}... `);
      const raw = await downloadDriveFile(img.id);
      process.stdout.write(`optimize (${(raw.length / 1024).toFixed(0)} KB)... `);
      const optimized = await optimizeImage(raw);
      process.stdout.write(`upload... `);
      const publicUrl = await uploadImage(optimized);
      console.log("ok");
      urls.push(publicUrl);
    }
    const result = await createProduct(def, urls);
    console.log(
      result.skipped
        ? `  product skipped (exists): id=${result.id}`
        : `  product created: id=${result.id}`,
    );
    created.push(result);
  }

  syncJson(created);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
