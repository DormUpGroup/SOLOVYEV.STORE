import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets", "brands");
const MANIFEST_PATH = path.join(ROOT, "data", "brand-logos.json");
const USER_AGENT = "Mozilla/5.0 (compatible; SolovyevStore/1.0)";

/** Brand slug -> search terms and optional direct page slugs on logos-world */
const BRAND_SEARCH = {
  "c-p-company": { names: ["C.P. Company", "CP Company"], pages: ["cp-company-logo"] },
  "fear-of-god": { names: ["Fear of God"], pages: ["fear-of-god-logo"] },
  "jw-anderson": { names: ["JW Anderson"], pages: ["jw-anderson-logo"] },
  "palm-angels": { names: ["Palm Angels"], pages: ["palm-angels-logo"] },
  "project-g-r": { names: ["Project G/R", "Project GR"], pages: ["project-gr-logo"] },
  represent: { names: ["Represent", "Represent Clo"], pages: ["represent-logo"] },
  rockstone: { names: ["Rockstone"], pages: [] },
  "tom-ford": { names: ["Tom Ford"], pages: ["tom-ford-logo"] },
  dsquared: { names: ["Dsquared2", "Dsquared"], pages: ["dsquared2-logo", "dsquared-logo"] },
  pleasures: { names: ["Pleasures"], pages: ["pleasures-logo"] },
  "purple-brand": { names: ["Purple Brand"], pages: [] },
  "saint-laurent": { names: ["Saint Laurent", "YSL"], pages: ["saint-laurent-logo", "ysl-logo"] },
  "maison-mihara-yasuhiro": {
    names: ["Maison Mihara Yasuhiro", "Mihara Yasuhiro"],
    pages: ["maison-mihara-yasuhiro-logo"],
  },
  "ron-arad-by-pq": { names: ["Ron Arad", "PQ Swim"], pages: [] },
  diesel: { names: ["Diesel"], pages: ["diesel-logo"] },
  "polo-ralph-lauren": { names: ["Polo Ralph Lauren", "Ralph Lauren"], pages: ["polo-ralph-lauren-logo"] },
};

/** Known-good direct image URLs (verified brand logos) */
const DIRECT_URLS = {
  "project-g-r":
    "https://projectgrr.com/wp-content/uploads/2025/07/cropped-projectgrr-favicon-180x180.png",
  dsquared:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Dsquared2_logo.svg/512px-Dsquared2_logo.svg.png",
  "saint-laurent":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Yves_Saint_Laurent_Logo.svg/512px-Yves_Saint_Laurent_Logo.svg.png",
  "palm-angels":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Palm_Angels_logo.svg/512px-Palm_Angels_logo.svg.png",
  represent:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Represent_Logo.svg/512px-Represent_Logo.svg.png",
  "c-p-company":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/C.P._Company_logo.svg/512px-C.P._Company_logo.svg.png",
  "fear-of-god":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Fear_of_God_logo.svg/512px-Fear_of_God_logo.svg.png",
  "jw-anderson":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/JW_Anderson_logo.svg/512px-JW_Anderson_logo.svg.png",
  "tom-ford":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Tom_Ford_logo.svg/512px-Tom_Ford_logo.svg.png",
  pleasures:
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Pleasures_logo.png/440px-Pleasures_logo.png",
  diesel:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Diesel_logo.svg/512px-Diesel_logo.svg.png",
  "maison-mihara-yasuhiro":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Maison_Mihara_Yasuhiro_logo.svg/512px-Maison_Mihara_Yasuhiro_logo.svg.png",
  "polo-ralph-lauren":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Polo_Ralph_Lauren_logo.svg/512px-Polo_Ralph_Lauren_logo.svg.png",
};

const WORLDVECTOR = {
  dsquared: ["dsquared2", "dsquared"],
  "saint-laurent": ["saint-laurent", "ysl"],
  "palm-angels": ["palm-angels"],
  represent: ["represent"],
  "c-p-company": ["cp-company", "c-p-company"],
  "fear-of-god": ["fear-of-god"],
  "jw-anderson": ["jw-anderson"],
  "tom-ford": ["tom-ford"],
  pleasures: ["pleasures"],
  diesel: ["diesel-1", "diesel"],
  "maison-mihara-yasuhiro": ["maison-mihara-yasuhiro"],
  "polo-ralph-lauren": ["polo-ralph-lauren"],
  "purple-brand": ["purple-brand"],
  rockstone: ["rockstone"],
  "ron-arad-by-pq": ["ron-arad"],
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

async function fetchBytes(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 900) return null;
    if (contentType.includes("html")) return null;
    return { bytes, contentType, url };
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  return await res.text();
}

function isDuplicateBad(bytes, knownBadHashes) {
  const hash = md5(bytes);
  return knownBadHashes.has(hash);
}

function buildKnownBadHashes() {
  const hashes = new Set();
  for (const file of fs.readdirSync(OUT_DIR)) {
    const fp = path.join(OUT_DIR, file);
    const size = fs.statSync(fp).size;
    if (size === 4718 || size === 535 || (file.endsWith(".png") && size <= 700)) {
      hashes.add(md5(fs.readFileSync(fp)));
    }
  }
  return hashes;
}

async function fromDirect(slug, badHashes) {
  const url = DIRECT_URLS[slug];
  if (!url) return null;
  const data = await fetchBytes(url);
  if (!data || isDuplicateBad(data.bytes, badHashes)) return null;
  return { ...data, source: "direct" };
}

async function fromWorldVector(slug, badHashes) {
  const names = WORLDVECTOR[slug] ?? [slug];
  for (const name of names) {
    const url = `https://cdn.worldvectorlogo.com/logos/${name}.svg`;
    const data = await fetchBytes(url);
    if (!data) continue;
    if (!data.bytes.toString("utf8", 0, 200).includes("<svg")) continue;
    if (isDuplicateBad(data.bytes, badHashes)) continue;
    return { ...data, source: `worldvector:${name}` };
  }
  return null;
}

function extractImages(html) {
  return [
    ...new Set(
      [...html.matchAll(/https:\/\/logos-world\.net\/wp-content\/uploads\/[^"')\s]+/g)]
        .map((m) => m[0])
        .filter((u) => /\.(png|webp|jpg|jpeg)$/i.test(u)),
    ),
  ];
}

async function fromLogosWorld(slug, badHashes) {
  const cfg = BRAND_SEARCH[slug];
  if (!cfg) return null;

  const pageUrls = (cfg.pages ?? []).map((p) => `https://logos-world.net/${p}/`);
  for (const name of cfg.names) {
    pageUrls.push(`https://logos-world.net/?s=${encodeURIComponent(name)}`);
  }

  for (const pageUrl of pageUrls) {
    const html = await fetchText(pageUrl);
    if (!html) continue;

    let pages = [pageUrl];
    if (pageUrl.includes("?s=")) {
      pages = [
        ...html.matchAll(/href="(https:\/\/logos-world\.net\/[^"]+-logo[^"]*)"/g),
      ].map((m) => m[1]);
    }

    for (const p of pages.slice(0, 5)) {
      const pageHtml = p === pageUrl && !pageUrl.includes("?s=") ? html : await fetchText(p);
      if (!pageHtml) continue;
      for (const imageUrl of extractImages(pageHtml)) {
        const data = await fetchBytes(imageUrl);
        if (!data || isDuplicateBad(data.bytes, badHashes)) continue;
        return { ...data, source: `logos-world:${imageUrl}` };
      }
    }
  }
  return null;
}

async function fromGoogleFavicon(slug, badHashes) {
  const domains = {
    "purple-brand": "purple-brand.com",
    rockstone: "rockstone.com",
    "ron-arad-by-pq": "pqswim.com",
    "maison-mihara-yasuhiro": "miharayasuhiro.jp",
    pleasures: "pleasuresnow.com",
    "project-g-r": "projectgrr.com",
  };
  const domain = domains[slug];
  if (!domain) return null;
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  const data = await fetchBytes(url);
  if (!data || isDuplicateBad(data.bytes, badHashes)) return null;
  if (data.bytes.length < 1500) return null;
  return { ...data, source: `favicon:${domain}` };
}

function needsFix(slug, manifestPath) {
  const fp = path.join(ROOT, "public", manifestPath.replace(/^\/+/, ""));
  if (!fs.existsSync(fp)) return true;
  const size = fs.statSync(fp).size;
  if (size === 4718 || size === 535) return true;
  if (fp.endsWith(".png") && size <= 1400) return true;
  if (fp.endsWith(".jpg") && size <= 5000) return true;
  if (BRAND_SEARCH[slug]) return true;
  return false;
}

async function resolveLogo(slug, badHashes) {
  return (
    (await fromDirect(slug, badHashes)) ??
    (await fromWorldVector(slug, badHashes)) ??
    (await fromLogosWorld(slug, badHashes)) ??
    (await fromGoogleFavicon(slug, badHashes))
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const badHashes = buildKnownBadHashes();
  const targets = Object.keys(BRAND_SEARCH).filter((slug) => needsFix(slug, manifest[slug]));

  let ok = 0;
  let fail = 0;

  for (const slug of targets) {
    const logo = await resolveLogo(slug, badHashes);
    if (!logo) {
      fail += 1;
      console.log(`[fail] ${slug}`);
      continue;
    }
    const ext = extFrom(logo.contentType, logo.url);
    removeExisting(slug);
    const fileName = `${slug}.${ext}`;
    fs.writeFileSync(path.join(OUT_DIR, fileName), logo.bytes);
    manifest[slug] = `/assets/brands/${fileName}`;
    ok += 1;
    console.log(`[ok] ${slug} <- ${logo.source}`);
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nok=${ok} fail=${fail}`);
}

main();
