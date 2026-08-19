/**
 * Import resale catalog from Resale.xlsx mapping + local photos in tmp/resale-images.
 *
 * Usage:
 *   node scripts/import-resale.mjs --max 9
 *   node scripts/import-resale.mjs --from 10
 *   node scripts/import-resale.mjs --all
 *   node scripts/import-resale.mjs --dry-run --max 9
 *   node scripts/import-resale.mjs --purge --max 9
 *
 * Requires tmp/resale-products.json + tmp/resale-images/
 * Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
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
const BUCKET = "product-images";
const PRODUCTS_PATH = path.join(root, "tmp", "resale-products.json");
const IMAGES_DIR = path.join(root, "tmp", "resale-images");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const all = args.includes("--all");
const purge = args.includes("--purge");
const maxIdx = argValue("--max");
const fromKey = argValue("--from");

function argValue(flag) {
  const i = args.indexOf(flag);
  if (i === -1) return null;
  return Number(args[i + 1]);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const BRAND_RULES = [
  ["Off-White", /^off[\s-]?white/i],
  ["Project g/r", /^project\s*g\/?r/i],
  ["Stussy", /^stussy/i],
  ["Palm Angels", /^palm\s*angels/i],
  ["Gucci", /^gucci/i],
  ["C.P. Company", /^c\.?\s*p\.?/i],
  ["Saint Laurent", /^saint\s*laun[ea]rt/i],
  ["Pleasures", /^pleasures/i],
  ["Fred Perry", /^fred\s*perry/i],
  ["Emporio Armani", /^emporio\s*armani/i],
  ["The North Face", /^the\s*north\s*face/i],
  ["Stone Island", /^stone\s*island/i],
  ["Polo Ralph Lauren", /^polo\s*ralph\s*lauren/i],
  ["Purple Brand", /^purple\s*brand/i],
  ["Moncler", /^moncler/i],
  ["Vivienne Westwood", /^vivienne\s*westwood/i],
  ["Jil Sander", /^jil\s*sander/i],
  ["Bape", /^bape/i],
  ["Puma", /^puma/i],
  ["Carhartt WIP", /^carhartt/i],
  ["Amiri", /^amiri/i],
  ["Comme des Garcons", /^comme\s*des\s*gar[cç]ons/i],
  ["Burberry", /^burberry/i],
  ["Balenciaga", /^balenciaga/i],
  ["Christian Louboutin", /^cristian\s*loubouten|^christian\s*louboutin/i],
  ["Louis Vuitton", /^louis\s*vuitton/i],
  ["Onitsuka Tiger", /^onitsuka/i],
  ["Valentino", /^valentino/i],
  ["Rockstone", /^rockstone/i],
  ["Adidas", /^adidas/i],
  ["Roberto Cavalli", /^roberto\s*cavalli/i],
  ["Jordan", /^jordan/i],
  ["Nike", /^nike/i],
  ["Maison Mihara Yasuhiro", /^maison\s*mihara/i],
  ["Reebok", /^reebok/i],
  ["Diesel", /^diesel/i],
  ["Acne Studios", /^acne\s*studios/i],
  ["Dsquared", /^dsquared/i],
  ["D&G", /^d\s*&\s*g\b|^dolce/i],
  ["JW Anderson", /^jw\s*anderson/i],
  ["True Religion", /^true\s*religion/i],
  ["Ferragamo", /^ferragamo/i],
  ["Tom Ford", /^tom\s*ford/i],
  ["Ron Arad by PQ", /^ron\s*ara[dg]/i],
  ["Tissot", /^tissot/i],
];

function detectBrand(title) {
  for (const [brand, re] of BRAND_RULES) {
    if (re.test(title)) return brand;
  }
  const words = title.trim().split(/\s+/);
  if (words.length >= 2 && /^(the|polo)$/i.test(words[0])) {
    return words.slice(0, 3).join(" ");
  }
  return words.slice(0, 2).join(" ") || "Unknown";
}

function detectCategory(title) {
  const t = title.toLowerCase();
  if (
    /sneaker|shoe|boot|trainer|dunk|high[\s-]?top|low[\s-]?top|speedcat|y3|loubout|velosamba|club c|track black/.test(
      t,
    )
  ) {
    return "sneakers";
  }
  if (/belt|glasses|watch|sunglasses/.test(t)) return "accessories";
  return "clothing";
}

/** Parse `4.2`, `4(1).2`, `32.1.jpg` → { major, minor, canon }. */
function parseImageName(name) {
  const base = path.basename(String(name));
  const stem = base.replace(/\.(jpe?g|png|webp|gif|heic|heif|avif|bmp|tiff?)$/i, "");
  const m = stem.match(/^(\d+)(?:\(\d+\))?\.(\d+)/);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    canon: `${m[1]}.${m[2]}`,
  };
}

function listLocalImages(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Missing images dir: ${dir}`);
    process.exit(1);
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => {
      const parsed = parseImageName(d.name);
      if (!parsed) return null;
      return {
        name: d.name,
        path: path.join(dir, d.name),
        ...parsed,
      };
    })
    .filter(Boolean);
}

function filesForProduct(product, localFiles) {
  const ov = product.override;
  if (ov?.files) {
    const set = new Set(ov.files);
    return localFiles.filter((f) => set.has(f.canon));
  }
  const majors = new Set(ov?.majors ?? product.default_majors);
  return localFiles.filter((f) => majors.has(f.major));
}

function sortFiles(files) {
  return [...files].sort((a, b) => {
    const dMajor = a.major - b.major;
    if (dMajor) return dMajor;
    const dMinor = a.minor - b.minor;
    if (dMinor) return dMinor;
    return String(a.name).localeCompare(String(b.name));
  });
}

function sniffImageKind(buffer) {
  if (buffer.length < 12) return "unknown";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  const brand = buffer.toString("ascii", 4, 12);
  if (brand.startsWith("ftyp")) return "heif";
  return "unknown";
}

async function optimizeImage(buffer) {
  const kind = sniffImageKind(buffer);
  try {
    return await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch (err) {
    throw new Error(`optimize ${kind} failed: ${err.message}`);
  }
}

async function uploadImage(buffer) {
  const objectPath = `${randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: "image/webp",
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

function parseStorageUrl(imageUrl) {
  try {
    const parsed = new URL(imageUrl);
    const marker = "/storage/v1/object/public/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    const rest = parsed.pathname.slice(idx + marker.length);
    const slash = rest.indexOf("/");
    if (slash === -1) return null;
    return {
      bucket: rest.slice(0, slash),
      path: decodeURIComponent(rest.slice(slash + 1)),
    };
  } catch {
    return null;
  }
}

async function deleteStorageUrl(imageUrl) {
  const parsed = parseStorageUrl(imageUrl);
  if (!parsed) return;
  await supabase.storage.from(parsed.bucket).remove([parsed.path]);
}

async function purgeProducts(selected) {
  const suffixes = selected.map((p) => `-resale-${p.key}`);
  const { data, error } = await supabase.from("products").select("id, slug, img");
  if (error) throw error;
  const matches = (data ?? []).filter((row) => suffixes.some((suffix) => row.slug.endsWith(suffix)));
  if (!matches.length) {
    console.log("  no existing products in range");
    return;
  }
  for (const row of matches) {
    const { data: images } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", row.id);
    const urls = (images ?? []).map((img) => img.image_url);
    if (row.img && !urls.includes(row.img)) urls.push(row.img);
    const { error: delErr } = await supabase.from("products").delete().eq("id", row.id);
    if (delErr) throw delErr;
    await Promise.allSettled(urls.map((u) => deleteStorageUrl(u)));
    console.log(`  purged id=${row.id} slug=${row.slug} files=${urls.length}`);
  }
}

async function createProduct(def, imageUrls) {
  const primary = imageUrls[0] ?? "";
  const row = {
    slug: def.slug,
    title: def.title,
    category: def.category,
    price: def.price,
    original_price: null,
    condition: "",
    brand: def.brand,
    badge: "hot",
    sizes: def.sizes,
    img: primary,
    status: "available",
    sold: false,
    description: def.title,
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
    return { id: existing.id, skipped: true };
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
  return { id: data.id, skipped: false };
}

function selectProducts(products) {
  let list = products;
  if (fromKey != null && !Number.isNaN(fromKey)) {
    list = list.filter((p) => p.key >= fromKey);
  }
  if (maxIdx != null && !Number.isNaN(maxIdx)) {
    list = list.filter((p) => p.key <= maxIdx);
  }
  if (!all && fromKey == null && maxIdx == null) {
    console.error("Specify --max N, --from N, or --all");
    process.exit(1);
  }
  return list;
}

async function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf8"));
  const localFiles = listLocalImages(IMAGES_DIR);

  const selected = selectProducts(products);
  console.log(
    `Importing ${selected.length} products` +
      (dryRun ? " (dry-run)" : "") +
      (purge ? " (purge first)" : "") +
      ` from ${selected[0]?.key}…${selected.at(-1)?.key}` +
      ` | local numbered photos=${localFiles.length}`,
  );

  if (purge && !dryRun) {
    console.log("\nPurging existing resale products in range…");
    await purgeProducts(selected);
  } else if (purge && dryRun) {
    console.log("\nWould purge existing -resale-{key} products in range (dry-run).");
  }

  const usedNames = new Set();
  const results = [];

  for (const product of selected) {
    const files = sortFiles(filesForProduct(product, localFiles));
    for (const f of files) usedNames.add(f.path);

    const brand = detectBrand(product.title);
    const category = detectCategory(product.title);
    const slug = `${slugify(product.title)}-resale-${product.key}`;
    const sizes = product.size ? [product.size] : [];

    console.log(
      `\n[#${product.key}] ${product.title} | ${brand} | ${category} | ${product.price} | size=${product.size || "—"} | photos=${files.length}`,
    );
    console.log(`  files: ${files.map((f) => f.name).join(", ") || "(none)"}`);

    if (!files.length) {
      console.error(`  SKIP: no photos for product ${product.key}`);
      results.push({ key: product.key, ok: false, reason: "no photos" });
      continue;
    }

    if (dryRun) {
      results.push({ key: product.key, ok: true, dryRun: true, photos: files.length });
      continue;
    }

    const urls = [];
    for (const file of files) {
      process.stdout.write(`  ${file.name} read… `);
      try {
        const raw = fs.readFileSync(file.path);
        if (raw.length < 1000) throw new Error("file too small");
        process.stdout.write(`optimize… `);
        const optimized = await optimizeImage(raw);
        process.stdout.write(`upload… `);
        const publicUrl = await uploadImage(optimized);
        console.log("ok");
        urls.push(publicUrl);
      } catch (err) {
        console.warn(`SKIP ${file.name}: ${err.message}`);
      }
    }
    if (!urls.length) {
      console.error(`  SKIP: all photos failed for product ${product.key}`);
      results.push({ key: product.key, ok: false, reason: "all photos failed" });
      continue;
    }

    const def = {
      slug,
      title: product.title,
      category,
      brand,
      price: product.price,
      sizes,
    };
    const created = await createProduct(def, urls);
    console.log(
      created.skipped
        ? `  skipped existing slug ${slug} (id=${created.id})`
        : `  created id=${created.id} slug=${slug}`,
    );
    results.push({ key: product.key, ok: true, id: created.id, skipped: created.skipped });
  }

  const majorsInScope = new Set();
  for (const p of selected) {
    const ov = p.override;
    if (ov?.files) {
      for (const name of ov.files) {
        const parsed = parseImageName(name);
        if (parsed) majorsInScope.add(parsed.major);
      }
    } else {
      for (const maj of ov?.majors ?? p.default_majors) majorsInScope.add(maj);
    }
  }

  const unused = localFiles.filter((f) => majorsInScope.has(f.major) && !usedNames.has(f.path));

  if (unused.length) {
    console.log("\nUnused local files in scope:");
    for (const f of unused) console.log(`  ${f.name}`);
  }

  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\nDone. ok=${ok} fail=${fail} mapped=${products.length}`);
  if (fail) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
