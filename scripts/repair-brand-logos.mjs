import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets", "brands");
const MANIFEST_PATH = path.join(ROOT, "data", "brand-logos.json");

const USER_AGENT = "Mozilla/5.0 (compatible; SolovyevStore/1.0)";

const DOMAIN_BY_SLUG = {
  "acne-studios": "acnestudios.com",
  adidas: "adidas.com",
  amiri: "amiri.com",
  balenciaga: "balenciaga.com",
  bape: "bape.com",
  burberry: "burberry.com",
  "c-p-company": "cpcompany.com",
  "carhartt-wip": "carhartt-wip.com",
  "christian-louboutin": "christianlouboutin.com",
  "chrome-hearts": "chromehearts.com",
  "comme-des-garcons": "commedesgarcons.com",
  converse: "converse.com",
  dandg: "dolcegabbana.com",
  diesel: "diesel.com",
  "dolce-and-gabbana": "dolcegabbana.com",
  dsquared: "dsquared2.com",
  "emporio-armani": "armani.com",
  "fear-of-god": "fearofgod.com",
  ferragamo: "ferragamo.com",
  "fred-perry": "fredperry.com",
  gucci: "gucci.com",
  "jil-sander": "jilsander.com",
  jordan: "jumpman23.com",
  "jw-anderson": "jw-anderson.com",
  "louis-vuitton": "louisvuitton.com",
  "maison-mihara-yasuhiro": "miharayasuhiro.jp",
  moncler: "moncler.com",
  nike: "nike.com",
  "off-white": "off---white.com",
  "onitsuka-tiger": "onitsukatiger.com",
  "palm-angels": "palmangels.com",
  pleasures: "pleasuresnow.com",
  "polo-ralph-lauren": "ralphlauren.com",
  prada: "prada.com",
  "project-g-r": "projectgrr.com",
  puma: "puma.com",
  "purple-brand": "purple-brand.com",
  reebok: "reebok.com",
  represent: "representclo.com",
  "roberto-cavalli": "robertocavalli.com",
  rockstone: "rockstone.com",
  "ron-arad-by-pq": "pqswim.com",
  "saint-laurent": "ysl.com",
  "stone-island": "stoneisland.com",
  stussy: "stussy.com",
  supreme: "supremenewyork.com",
  "the-north-face": "thenorthface.com",
  tissot: "tissotwatches.com",
  "tom-ford": "tomford.com",
  "true-religion": "truereligion.com",
  valentino: "valentino.com",
  "vivienne-westwood": "viviennewestwood.com",
};

const VECTOR_CANDIDATES = {
  dandg: ["d-and-g", "dolce-and-gabbana", "dolce-gabbana", "dolcegabbana", "dandg"],
  "dolce-and-gabbana": ["dolce-and-gabbana", "dolce-gabbana", "dolcegabbana"],
  "c-p-company": ["c-p-company", "cp-company", "cpcompany"],
  "carhartt-wip": ["carhartt-wip", "carhartt", "carhartt-wip-1"],
  ferragamo: ["salvatore-ferragamo", "ferragamo"],
  "louis-vuitton": ["louis-vuitton", "louis-vuitton-1", "louis-vuitton-logo"],
  "palm-angels": ["palm-angels", "palmangels"],
  "tom-ford": ["tom-ford", "tomford"],
  "true-religion": ["true-religion", "truereligion"],
  "project-g-r": ["project-g-r", "project-gr", "projectgr"],
  pleasures: ["pleasures", "pleasures-1"],
  amiri: ["amiri", "amiri-1"],
};

function removeExisting(slug) {
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.startsWith(`${slug}.`)) fs.unlinkSync(path.join(OUT_DIR, file));
  }
}

function currentFilePath(slug, manifestPath) {
  return path.join(ROOT, "public", manifestPath.replace(/^\/+/, ""));
}

function isBadPlaceholder(filePath) {
  if (!fs.existsSync(filePath)) return true;
  const ext = path.extname(filePath).toLowerCase();
  const size = fs.statSync(filePath).size;
  // Red anti-hotlink placeholder downloaded from blocked sources.
  if (ext === ".png" && size <= 700) return true;
  return false;
}

async function fetchBytes(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 250) return null;
    return { bytes, contentType };
  } catch {
    return null;
  }
}

function extFrom(contentType, url) {
  if (contentType.includes("svg") || url.toLowerCase().endsWith(".svg")) return "svg";
  if (contentType.includes("webp") || url.toLowerCase().endsWith(".webp")) return "webp";
  if (contentType.includes("jpeg") || url.toLowerCase().endsWith(".jpg") || url.toLowerCase().endsWith(".jpeg")) return "jpg";
  return "png";
}

function vectorNames(slug) {
  const base = [slug, slug.replace(/-/g, ""), slug.replace(/-/g, "_")];
  const extra = VECTOR_CANDIDATES[slug] ?? [];
  return [...new Set([...extra, ...base])];
}

async function tryWorldVector(slug) {
  for (const name of vectorNames(slug)) {
    const url = `https://cdn.worldvectorlogo.com/logos/${name}.svg`;
    const data = await fetchBytes(url);
    if (!data) continue;
    const text = data.bytes.toString("utf8", 0, 500);
    if (!text.includes("<svg")) continue;
    return { ext: "svg", bytes: data.bytes, source: `worldvector:${name}` };
  }
  return null;
}

async function trySimpleIcons(slug) {
  const candidates = [slug, slug.replace(/-/g, "")];
  for (const name of candidates) {
    const url = `https://cdn.simpleicons.org/${name}/000000`;
    const data = await fetchBytes(url);
    if (!data) continue;
    if (!data.contentType.includes("svg")) continue;
    return { ext: "svg", bytes: data.bytes, source: `simpleicons:${name}` };
  }
  return null;
}

async function tryGoogleFavicon(slug) {
  const domain = DOMAIN_BY_SLUG[slug];
  if (!domain) return null;
  const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`;
  const data = await fetchBytes(url);
  if (!data) return null;
  // Small but valid fallback. Avoid tiny blocked images.
  if (data.bytes.length < 800) return null;
  return { ext: "png", bytes: data.bytes, source: `google-favicon:${domain}` };
}

async function resolveLogo(slug) {
  return (
    (await tryWorldVector(slug)) ??
    (await trySimpleIcons(slug)) ??
    (await tryGoogleFavicon(slug))
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const slugs = Object.keys(manifest);
  let updated = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const current = currentFilePath(slug, manifest[slug]);
    if (!isBadPlaceholder(current)) continue;

    const logo = await resolveLogo(slug);
    if (!logo) {
      skipped += 1;
      console.log(`[skip] ${slug}`);
      continue;
    }
    removeExisting(slug);
    const fileName = `${slug}.${logo.ext}`;
    fs.writeFileSync(path.join(OUT_DIR, fileName), logo.bytes);
    manifest[slug] = `/assets/brands/${fileName}`;
    updated += 1;
    console.log(`[ok] ${slug} <- ${logo.source}`);
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nupdated=${updated} skipped=${skipped}`);
}

main();
