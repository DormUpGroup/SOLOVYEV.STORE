import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets", "brands");
const MANIFEST_PATH = path.join(ROOT, "data", "brand-logos.json");
const USER_AGENT = "Mozilla/5.0 (compatible; SolovyevStore/1.0)";

const TARGETS = {
  "c-p-company": "C.P. Company",
  "fear-of-god": "Fear of God",
  "jw-anderson": "JW Anderson",
  "palm-angels": "Palm Angels",
  "project-g-r": "Project G/R",
  represent: "Represent",
  rockstone: "Rockstone",
  "tom-ford": "Tom Ford",
};

const DIRECT = {
  "project-g-r":
    "https://projectgrr.com/wp-content/uploads/2025/07/cropped-projectgrr-favicon-180x180.png",
};

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
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 700) return null;
  return { bytes, contentType };
}

function extractBrandPageUrls(searchHtml) {
  const links = [...searchHtml.matchAll(/href="(https:\/\/logos-world\.net\/[^"]+)"/g)].map(
    (m) => m[1],
  );
  return [...new Set(links.filter((href) => !href.includes("/wp-content/")))];
}

function extractImageUrls(pageHtml) {
  const urls = [...pageHtml.matchAll(/https:\/\/logos-world\.net\/wp-content\/uploads\/[^"')\s]+/g)].map(
    (m) => m[0],
  );
  return [...new Set(urls.filter((u) => /\.(png|webp|jpg|jpeg)$/i.test(u)))];
}

async function fromLogosWorld(name) {
  const searchHtml = await fetchText(
    `https://logos-world.net/?s=${encodeURIComponent(name)}`,
  );
  if (!searchHtml) return null;
  for (const pageUrl of extractBrandPageUrls(searchHtml).slice(0, 6)) {
    const pageHtml = await fetchText(pageUrl);
    if (!pageHtml) continue;
    for (const imageUrl of extractImageUrls(pageHtml)) {
      const image = await fetchBytes(imageUrl);
      if (image) return image;
    }
  }
  return null;
}

async function resolveLogo(slug, name) {
  const direct = DIRECT[slug];
  if (direct) {
    const image = await fetchBytes(direct);
    if (image) return image;
  }
  return await fromLogosWorld(name);
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  let ok = 0;
  let fail = 0;

  for (const [slug, name] of Object.entries(TARGETS)) {
    const logo = await resolveLogo(slug, name);
    if (!logo) {
      fail += 1;
      console.log(`[fail] ${slug}`);
      continue;
    }
    const ext = logo.contentType.includes("webp")
      ? "webp"
      : logo.contentType.includes("jpeg")
        ? "jpg"
        : "png";
    removeExisting(slug);
    const fileName = `${slug}.${ext}`;
    fs.writeFileSync(path.join(OUT_DIR, fileName), logo.bytes);
    manifest[slug] = `/assets/brands/${fileName}`;
    ok += 1;
    console.log(`[ok] ${slug} -> ${fileName}`);
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nok=${ok} fail=${fail}`);
}

main();
