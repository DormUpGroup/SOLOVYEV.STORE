import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets", "brands");
const MANIFEST_PATH = path.join(ROOT, "data", "brand-logos.json");

const USER_AGENT = "SolovyevStoreBot/1.0 (logo refresh)";

const LABEL_OVERRIDES = {
  "c-p-company": "C.P. Company",
  dandg: "Dolce & Gabbana",
  "dolce-and-gabbana": "Dolce & Gabbana",
  "project-g-r": "Project G/R",
  "ron-arad-by-pq": "Ron Arad by PQ",
  "the-north-face": "The North Face",
  "off-white": "Off-White",
  "true-religion": "True Religion",
  "polo-ralph-lauren": "Polo Ralph Lauren",
  "carhartt-wip": "Carhartt WIP",
  "jw-anderson": "JW Anderson",
  "onitsuka-tiger": "Onitsuka Tiger",
  "maison-mihara-yasuhiro": "Maison Mihara Yasuhiro",
};

function titleFromSlug(slug) {
  if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug];
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function removeExisting(slug) {
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.startsWith(`${slug}.`)) {
      fs.unlinkSync(path.join(OUT_DIR, file));
    }
  }
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  return await res.json();
}

async function fetchBytes(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("image") && !contentType.includes("svg")) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 400) return null;
  return { bytes, contentType };
}

function selectEntity(searchResult) {
  if (!searchResult?.search?.length) return null;
  const scored = searchResult.search
    .map((item) => {
      const text = `${item.label ?? ""} ${item.description ?? ""}`.toLowerCase();
      let score = 0;
      if (text.includes("fashion")) score += 3;
      if (text.includes("brand")) score += 3;
      if (text.includes("clothing")) score += 2;
      if (text.includes("company")) score += 1;
      if (text.includes("footwear")) score += 2;
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? searchResult.search[0]?.id ?? null;
}

function readP154Filename(entityJson, entityId) {
  const entity = entityJson?.entities?.[entityId];
  const claim = entity?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
  return typeof claim === "string" ? claim : null;
}

async function resolveCommonsFileUrl(filename) {
  const title = `File:${filename}`;
  const url =
    "https://commons.wikimedia.org/w/api.php" +
    `?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(title)}`;
  const data = await fetchJson(url);
  const pages = data?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  const imageUrl = page?.imageinfo?.[0]?.url;
  return typeof imageUrl === "string" ? imageUrl : null;
}

function extensionFromUrlAndType(url, contentType) {
  const lower = url.toLowerCase();
  if (lower.endsWith(".svg") || contentType.includes("svg")) return "svg";
  if (lower.endsWith(".webp") || contentType.includes("webp")) return "webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || contentType.includes("jpeg")) return "jpg";
  return "png";
}

async function fetchLogoByName(name) {
  const searchUrl =
    "https://www.wikidata.org/w/api.php" +
    `?action=wbsearchentities&format=json&language=en&type=item&limit=8&search=${encodeURIComponent(name)}`;
  const search = await fetchJson(searchUrl);
  const entityId = selectEntity(search);
  if (!entityId) return null;

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
  const entity = await fetchJson(entityUrl);
  const fileName = readP154Filename(entity, entityId);
  if (!fileName) return null;

  const commonsUrl = await resolveCommonsFileUrl(fileName);
  if (!commonsUrl) return null;

  const file = await fetchBytes(commonsUrl);
  if (!file) return null;

  return { ...file, sourceFile: fileName, sourceUrl: commonsUrl };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const slugs = Object.keys(manifest);

  let updated = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const name = titleFromSlug(slug);
    try {
      const logo = await fetchLogoByName(name);
      if (!logo) {
        skipped += 1;
        console.log(`[skip] ${slug} (${name}) no P154 logo`);
        continue;
      }
      const ext = extensionFromUrlAndType(logo.sourceUrl, logo.contentType);
      removeExisting(slug);
      const fileName = `${slug}.${ext}`;
      fs.writeFileSync(path.join(OUT_DIR, fileName), logo.bytes);
      manifest[slug] = `/assets/brands/${fileName}`;
      updated += 1;
      console.log(`[ok] ${slug} <- ${logo.sourceFile}`);
    } catch {
      skipped += 1;
      console.log(`[skip] ${slug} (${name}) error`);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nupdated=${updated} skipped=${skipped}`);
}

main();
