import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");
const BRANDS_DIR = path.join(ROOT, "public", "assets", "brands");
const MANIFEST_PATH = path.join(ROOT, "data", "brand-logos.json");
const EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

const SIMPLE_ICON_ALIASES = {
  "polo-ralph-lauren": ["ralphlauren"],
  "the-north-face": ["thenorthface", "northface"],
  "dolce-and-gabbana": ["dolcegabbana"],
  "off-white": ["offwhite"],
  "c-p-company": ["cpcompany"],
  "comme-des-garcons": ["commedesgarcons"],
  "vivienne-westwood": ["viviennewestwood"],
  "stone-island": ["stoneisland"],
  "true-religion": ["truereligion"],
  "saint-laurent": ["ysl", "saintlaurent"],
};

function loadEnvFile(filepath) {
  const out = {};
  if (!fs.existsSync(filepath)) return out;
  const text = fs.readFileSync(filepath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function brandToSlug(brand) {
  return brand
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSimpleIconsSlug(slug) {
  return slug.replace(/-/g, "");
}

function logoFileExists(slug) {
  return EXTENSIONS.some((ext) => fs.existsSync(path.join(BRANDS_DIR, `${slug}${ext}`)));
}

function getExistingLogoPath(slug) {
  for (const ext of EXTENSIONS) {
    const fullPath = path.join(BRANDS_DIR, `${slug}${ext}`);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

function isTextFallbackLogo(logoPath) {
  if (!logoPath || path.extname(logoPath).toLowerCase() !== ".svg") return false;
  try {
    const content = fs.readFileSync(logoPath, "utf8");
    return content.includes("<text ") && content.includes("viewBox=\"0 0 320 80\"");
  } catch {
    return false;
  }
}

function removeExisting(slug) {
  for (const file of fs.readdirSync(BRANDS_DIR)) {
    if (file.startsWith(`${slug}.`)) {
      fs.unlinkSync(path.join(BRANDS_DIR, file));
    }
  }
}

function writeSvg(slug, svg) {
  removeExisting(slug);
  const filename = `${slug}.svg`;
  fs.writeFileSync(path.join(BRANDS_DIR, filename), svg, "utf8");
  return `/assets/brands/${filename}`;
}

function textFallbackSvg(label) {
  const upper = label.toUpperCase();
  const size =
    upper.length > 18 ? 10 : upper.length > 14 ? 11 : upper.length > 10 ? 13 : 15;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" role="img" aria-label="${label}">
  <rect width="320" height="80" fill="#ffffff"/>
  <text x="160" y="50" text-anchor="middle" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" letter-spacing="0.08em">${upper}</text>
</svg>
`;
}

function normalizeSimpleIconSvg(svgText) {
  // Force dark text/paths on white background.
  let out = svgText;
  out = out.replace(/fill="[^"]*"/gi, 'fill="#111111"');
  if (!out.includes("<rect")) {
    out = out.replace(
      /<svg([^>]*)>/i,
      '<svg$1><rect width="100%" height="100%" fill="#ffffff"/>',
    );
  }
  return out;
}

async function fetchPublicBrands({ url, key }) {
  const statuses = "available,reserved,sold,new_drop";
  const endpoint = `${url}/rest/v1/products?select=brand&status=in.(${statuses})&order=brand.asc`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase query failed: ${res.status} ${body.slice(0, 240)}`);
  }
  const rows = await res.json();
  const brands = [...new Set(rows.map((r) => String(r.brand || "").trim()).filter(Boolean))];
  brands.sort((a, b) => a.localeCompare(b));
  return brands;
}

async function tryDownloadSimpleIcons(slug) {
  const candidates = [
    ...(SIMPLE_ICON_ALIASES[slug] ?? []),
    toSimpleIconsSlug(slug),
    slug,
  ];
  for (const candidate of candidates) {
    const url = `https://cdn.simpleicons.org/${candidate}`;
    try {
      const res = await fetch(url, { headers: { Accept: "image/svg+xml" } });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.includes("<svg")) continue;
      return normalizeSimpleIconSvg(text);
    } catch {
      // continue
    }
  }
  return null;
}

async function main() {
  fs.mkdirSync(BRANDS_DIR, { recursive: true });
  const env = { ...loadEnvFile(ENV_PATH), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials are missing in .env.local");
  }

  const brands = await fetchPublicBrands({ url, key });
  const manifest = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
    : {};

  let downloaded = 0;
  let generated = 0;
  let reused = 0;
  let missingBefore = 0;
  let refreshed = 0;

  for (const brand of brands) {
    const slug = brandToSlug(brand);
    const existingPath = getExistingLogoPath(slug);
    if (existingPath) {
      const isFallback = isTextFallbackLogo(existingPath);
      if (!isFallback) {
        const ext = path.extname(existingPath).toLowerCase();
        manifest[slug] = `/assets/brands/${slug}${ext}`;
        reused++;
        continue;
      }

      // Try to replace previous text fallback with a real downloaded mark.
      const refreshedSvg = await tryDownloadSimpleIcons(slug);
      if (refreshedSvg) {
        manifest[slug] = writeSvg(slug, refreshedSvg);
        refreshed++;
        continue;
      }

      manifest[slug] = `/assets/brands/${path.basename(existingPath)}`;
      reused++;
      continue;
    }
    missingBefore++;
    const svg = await tryDownloadSimpleIcons(slug);
    if (svg) {
      manifest[slug] = writeSvg(slug, svg);
      downloaded++;
      continue;
    }
    manifest[slug] = writeSvg(slug, textFallbackSvg(brand));
    generated++;
  }

  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf8");

  console.log(`Brands in public catalog: ${brands.length}`);
  console.log(`Missing logos before sync: ${missingBefore}`);
  console.log(`Downloaded from Simple Icons: ${downloaded}`);
  console.log(`Replaced text fallbacks with logos: ${refreshed}`);
  console.log(`Generated text fallbacks: ${generated}`);
  console.log(`Already existed: ${reused}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
