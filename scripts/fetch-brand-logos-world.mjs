import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets", "brands");
const MANIFEST_PATH = path.join(ROOT, "data", "brand-logos.json");

const USER_AGENT = "Mozilla/5.0 (compatible; SolovyevStore/1.0)";

function titleFromSlug(slug) {
  return slug
    .replace(/\band\b/g, "&")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace("Dandg", "D&G")
    .replace("Cp Company", "C.P. Company");
}

function readPlaceholders() {
  const result = [];
  const files = fs.readdirSync(OUT_DIR);
  for (const file of files) {
    if (!file.endsWith(".svg")) continue;
    const slug = file.slice(0, -4);
    const content = fs.readFileSync(path.join(OUT_DIR, file), "utf8");
    if (content.includes('text-anchor="middle"')) result.push(slug);
  }
  return result;
}

function removeExisting(slug) {
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.startsWith(`${slug}.`)) fs.unlinkSync(path.join(OUT_DIR, file));
  }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  return await res.text();
}

async function fetchBytes(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("image")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) return null;
  return { buf, contentType };
}

function pickFirstUnique(values) {
  const seen = new Set();
  const out = [];
  for (const v of values) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function extractBrandPageUrls(searchHtml) {
  const links = [...searchHtml.matchAll(/href="(https:\/\/logos-world\.net\/[^"]+)"/g)].map(
    (m) => m[1],
  );
  return pickFirstUnique(
    links.filter(
      (href) =>
        !href.includes("/wp-content/") &&
        !href.includes("/feed/") &&
        !href.includes("/tag/") &&
        !href.includes("/category/"),
    ),
  );
}

function extractImageUrls(pageHtml) {
  const urls = [...pageHtml.matchAll(/https:\/\/logos-world\.net\/wp-content\/uploads\/[^"')\s]+/g)].map(
    (m) => m[0],
  );
  const preferred = urls.filter((u) => /\.(png|webp|jpg|jpeg)$/i.test(u));
  return pickFirstUnique(preferred);
}

async function resolveFromLogosWorld(brandName) {
  const searchUrl = `https://logos-world.net/?s=${encodeURIComponent(brandName)}`;
  const searchHtml = await fetchText(searchUrl);
  if (!searchHtml) return null;

  const pages = extractBrandPageUrls(searchHtml).slice(0, 5);
  for (const pageUrl of pages) {
    const pageHtml = await fetchText(pageUrl);
    if (!pageHtml) continue;
    const images = extractImageUrls(pageHtml);
    for (const imageUrl of images) {
      const image = await fetchBytes(imageUrl);
      if (!image) continue;
      return image;
    }
  }
  return null;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const placeholders = readPlaceholders();
  let updated = 0;
  let skipped = 0;

  for (const slug of placeholders) {
    const brandName = titleFromSlug(slug);
    try {
      const image = await resolveFromLogosWorld(brandName);
      if (!image) {
        skipped += 1;
        console.log(`[skip] ${slug} (${brandName})`);
        continue;
      }
      const ext = image.contentType.includes("webp")
        ? "webp"
        : image.contentType.includes("jpeg")
          ? "jpg"
          : "png";
      removeExisting(slug);
      const filename = `${slug}.${ext}`;
      fs.writeFileSync(path.join(OUT_DIR, filename), image.buf);
      manifest[slug] = `/assets/brands/${filename}`;
      updated += 1;
      console.log(`[ok] ${slug} -> ${filename}`);
    } catch {
      skipped += 1;
      console.log(`[skip] ${slug} (${brandName})`);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nupdated=${updated} skipped=${skipped}`);
}

main();
