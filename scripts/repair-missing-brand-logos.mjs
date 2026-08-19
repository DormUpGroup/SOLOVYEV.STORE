import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets", "brands");
const MANIFEST_PATH = path.join(ROOT, "data", "brand-logos.json");
const USER_AGENT = "Mozilla/5.0 (compatible; SolovyevStore/1.0)";

const TARGETS = {
  "c-p-company": "https://www.cpcompany.com/",
  "fear-of-god": "https://fearofgod.com/",
  "jw-anderson": "https://www.jwanderson.com/",
  "project-g-r": "https://projectgrr.com/",
  represent: "https://representclo.com/",
  rockstone: "https://rockstone.com/",
  dsquared: "https://www.dsquared2.com/",
  pleasures: "https://pleasuresnow.com/",
  "purple-brand": "https://purple-brand.com/",
  "maison-mihara-yasuhiro": "https://miharayasuhiro.jp/",
  "ron-arad-by-pq": "https://pqswim.com/",
};

const DOMAIN_FALLBACK = {
  "c-p-company": "cpcompany.com",
  "fear-of-god": "fearofgod.com",
  "jw-anderson": "jwanderson.com",
  "project-g-r": "projectgrr.com",
  represent: "representclo.com",
  rockstone: "rockstone.com",
  dsquared: "dsquared2.com",
  pleasures: "pleasuresnow.com",
  "purple-brand": "purple-brand.com",
  "maison-mihara-yasuhiro": "miharayasuhiro.jp",
  "ron-arad-by-pq": "pqswim.com",
};

function md5(buf) {
  return crypto.createHash("md5").update(buf).digest("hex");
}

function removeExisting(slug) {
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.startsWith(`${slug}.`)) fs.unlinkSync(path.join(OUT_DIR, file));
  }
}

function extFrom(contentType, url) {
  const lower = url.toLowerCase();
  if (contentType.includes("svg") || lower.endsWith(".svg")) return "svg";
  if (contentType.includes("webp") || lower.endsWith(".webp")) return "webp";
  if (contentType.includes("jpeg") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpg";
  return "png";
}

function toAbs(baseUrl, maybeRelative) {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchBytes(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("image") && !contentType.includes("svg")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 300) return null;
    return { bytes, contentType, url };
  } catch {
    return null;
  }
}

function extractCandidates(html, baseUrl) {
  const out = [];

  const metaPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
  ];
  for (const pattern of metaPatterns) {
    for (const m of html.matchAll(pattern)) {
      const abs = toAbs(baseUrl, m[1]);
      if (abs) out.push(abs);
    }
  }

  const linkPatterns = [
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/gi,
  ];
  for (const pattern of linkPatterns) {
    for (const m of html.matchAll(pattern)) {
      const abs = toAbs(baseUrl, m[1]);
      if (abs) out.push(abs);
    }
  }

  const imgPatterns = [
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
  ];
  for (const pattern of imgPatterns) {
    for (const m of html.matchAll(pattern)) {
      const src = m[1];
      if (!/logo|brand|symbol|mark/i.test(src)) continue;
      const abs = toAbs(baseUrl, src);
      if (abs) out.push(abs);
    }
  }

  return [...new Set(out)];
}

function chooseBestImage(images) {
  // Prefer svg and larger files.
  return images.sort((a, b) => {
    const score = (x) =>
      (x.contentType.includes("svg") ? 4 : 0) +
      (x.url.includes("logo") ? 2 : 0) +
      Math.min(3, Math.floor(x.bytes.length / 8000));
    return score(b) - score(a);
  })[0] ?? null;
}

async function fromSite(slug, homeUrl, badHashes) {
  const html = await fetchText(homeUrl);
  if (!html) return null;
  const candidates = extractCandidates(html, homeUrl).slice(0, 20);
  const images = [];
  for (const url of candidates) {
    const img = await fetchBytes(url);
    if (!img) continue;
    if (badHashes.has(md5(img.bytes))) continue;
    // Reject tiny placeholder icons.
    if (!img.contentType.includes("svg") && img.bytes.length < 1200) continue;
    images.push(img);
  }
  const best = chooseBestImage(images);
  if (!best) return null;
  return { ...best, source: `site:${homeUrl}` };
}

async function fromFavicon(slug, badHashes) {
  const domain = DOMAIN_FALLBACK[slug];
  if (!domain) return null;
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  const img = await fetchBytes(url);
  if (!img) return null;
  if (badHashes.has(md5(img.bytes))) return null;
  if (img.bytes.length < 500) return null;
  return { ...img, source: `favicon:${domain}` };
}

function buildBadHashes() {
  const hashes = new Set();
  for (const file of fs.readdirSync(OUT_DIR)) {
    const fp = path.join(OUT_DIR, file);
    const size = fs.statSync(fp).size;
    if (size === 4718 || size === 535) {
      hashes.add(md5(fs.readFileSync(fp)));
    }
  }
  return hashes;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const badHashes = buildBadHashes();

  let ok = 0;
  let fail = 0;
  for (const [slug, homeUrl] of Object.entries(TARGETS)) {
    const resolved =
      (await fromSite(slug, homeUrl, badHashes)) ??
      (await fromFavicon(slug, badHashes));
    if (!resolved) {
      fail += 1;
      console.log(`[fail] ${slug}`);
      continue;
    }
    const ext = extFrom(resolved.contentType, resolved.url);
    removeExisting(slug);
    const fileName = `${slug}.${ext}`;
    fs.writeFileSync(path.join(OUT_DIR, fileName), resolved.bytes);
    manifest[slug] = `/assets/brands/${fileName}`;
    ok += 1;
    console.log(`[ok] ${slug} <- ${resolved.source}`);
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nok=${ok} fail=${fail}`);
}

main();
