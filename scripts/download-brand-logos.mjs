import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as simpleIcons from "simple-icons";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets", "brands");
const MANIFEST_PATH = path.join(ROOT, "data", "brand-logos.json");

const SIMPLE_ICON_MAP = {
  adidas: "siAdidas",
  nike: "siNike",
  jordan: "siJordan",
  "the-north-face": "siThenorthface",
};

/** Colored PNG logos (visible on dark backgrounds). */
const COLORED_PNG = {
  adidas:
    "https://logos-world.net/wp-content/uploads/2020/04/Adidas-Logo.png",
  nike: "https://logos-world.net/wp-content/uploads/2020/04/Nike-Logo.png",
  jordan:
    "https://logos-world.net/wp-content/uploads/2020/06/Jordan-Logo.png",
  "the-north-face":
    "https://logos-world.net/wp-content/uploads/2020/11/The-North-Face-Logo.png",
  gucci: "https://logos-world.net/wp-content/uploads/2020/04/Gucci-Logo.png",
  burberry:
    "https://logos-world.net/wp-content/uploads/2020/10/Burberry-Logo.png",
  bape: "https://logos-world.net/wp-content/uploads/2021/08/BAPE-Logo.png",
  moncler:
    "https://logos-world.net/wp-content/uploads/2022/01/Moncler-Logo.png",
  "off-white":
    "https://logos-world.net/wp-content/uploads/2021/09/Off-White-Logo.png",
  "dolce-and-gabbana":
    "https://logos-world.net/wp-content/uploads/2020/12/Dolce-Gabbana-Logo.png",
  prada: "https://logos-world.net/wp-content/uploads/2020/06/Prada-Logo.png",
};

/** SVG sources that need light-background stripping or recoloring. */
const REMOTE_SVG = {
  supreme:
    "https://upload.wikimedia.org/wikipedia/commons/2/28/Supreme_Logo.svg",
  converse:
    "https://upload.wikimedia.org/wikipedia/commons/3/30/Converse_logo.svg",
  stussy: "https://static.cdnlogo.com/logos/s/53/stussy.svg",
  ferragamo:
    "https://cdn.worldvectorlogo.com/logos/salvatore-ferragamo.svg",
  "chrome-hearts":
    "https://cdn.worldvectorlogo.com/logos/chrome-hearts-1.svg",
};

const ALL_SLUGS = [
  "adidas",
  "bape",
  "burberry",
  "chrome-hearts",
  "converse",
  "dolce-and-gabbana",
  "fear-of-god",
  "ferragamo",
  "gucci",
  "jordan",
  "moncler",
  "nike",
  "off-white",
  "prada",
  "represent",
  "stussy",
  "supreme",
  "the-north-face",
];

const BRAND_LABELS = {
  adidas: "Adidas",
  bape: "Bape",
  burberry: "Burberry",
  "chrome-hearts": "Chrome Hearts",
  converse: "Converse",
  "dolce-and-gabbana": "Dolce & Gabbana",
  "fear-of-god": "Fear of God",
  ferragamo: "Ferragamo",
  gucci: "Gucci",
  jordan: "Jordan",
  moncler: "Moncler",
  nike: "Nike",
  "off-white": "Off-White",
  prada: "Prada",
  represent: "Represent",
  stussy: "Stussy",
  supreme: "Supreme",
  "the-north-face": "The North Face",
};

const BRAND_ACCENT = {
  converse: "#ffffff",
  stussy: "#ffffff",
  ferragamo: "#ffffff",
  "chrome-hearts": "#ffffff",
};

function extFromUrl(url, contentType) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith(".svg")) return ".svg";
  if (pathname.endsWith(".png")) return ".png";
  if (pathname.endsWith(".webp")) return ".webp";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return ".jpg";
  if (contentType?.includes("svg")) return ".svg";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("jpeg")) return ".jpg";
  return ".png";
}

function writeSvg(slug, svgContent) {
  removeExisting(slug);
  const filename = `${slug}.svg`;
  fs.writeFileSync(path.join(OUT_DIR, filename), svgContent, "utf8");
  return `/assets/brands/${filename}`;
}

function writeBinary(slug, ext, buffer) {
  removeExisting(slug);
  const filename = `${slug}${ext}`;
  fs.writeFileSync(path.join(OUT_DIR, filename), buffer);
  return `/assets/brands/${filename}`;
}

function removeExisting(slug) {
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.startsWith(`${slug}.`)) {
      fs.unlinkSync(path.join(OUT_DIR, file));
    }
  }
}

function makeTextFallbackSvg(slug) {
  const label = (BRAND_LABELS[slug] || slug).toUpperCase();
  const size =
    label.length > 14 ? 11 : label.length > 10 ? 13 : label.length > 8 ? 15 : 18;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 56" role="img" aria-label="${BRAND_LABELS[slug] || slug}">
  <text x="120" y="36" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" letter-spacing="0.08em">${label}</text>
</svg>
`;
}

function prepareSvgForDarkBg(svg, slug) {
  const accent = BRAND_ACCENT[slug] || "#ffffff";
  let fixed = svg;

  fixed = fixed.replace(
    /<path[^>]*fill=["']#fff(?:fff)?["'][^>]*\/?>\s*/gi,
    "",
  );
  fixed = fixed.replace(
    /<rect[^>]*fill=["']#fff(?:fff)?["'][^>]*\/?>\s*/gi,
    "",
  );

  fixed = fixed.replace(/fill:\s*#?0{3,6}\b/gi, `fill:${accent}`);
  fixed = fixed.replace(/fill:\s*black\b/gi, `fill:${accent}`);
  fixed = fixed.replace(/fill=["']#000000?["']/gi, `fill="${accent}"`);
  fixed = fixed.replace(/fill=["']black["']/gi, `fill="${accent}"`);

  fixed = fixed.replace(/<path\s+(?!fill=)/gi, `<path fill="${accent}" `);

  if (!fixed.includes('xmlns="http://www.w3.org/2000/svg"')) {
    fixed = fixed.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return fixed;
}

function fromSimpleIcons(slug) {
  const key = SIMPLE_ICON_MAP[slug];
  if (!key || !simpleIcons[key]) return null;

  const icon = simpleIcons[key];
  const svg = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="${icon.title}">
  <path fill="#ffffff" d="${icon.path}"/>
</svg>`;
  return writeSvg(slug, svg);
}

async function downloadUrl(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SolovyevStore/1.0)",
      Accept: "image/*,*/*",
    },
    redirect: "follow",
  });

  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 200) return null;

  return { buffer, contentType, ext: extFromUrl(url, contentType) };
}

async function fromColoredPng(slug, url) {
  try {
    const result = await downloadUrl(url);
    if (!result || result.ext !== ".png") return null;
    return writeBinary(slug, ".png", result.buffer);
  } catch {
    return null;
  }
}

async function fromRemoteSvg(slug, url) {
  try {
    const result = await downloadUrl(url);
    if (!result) return null;

    const text = result.buffer.toString("utf8");
    if (!text.includes("<svg")) return null;

    const prepared = prepareSvgForDarkBg(text, slug);
    return writeSvg(slug, prepared);
  } catch {
    return null;
  }
}

async function resolveLogo(slug) {
  if (COLORED_PNG[slug]) {
    const logo = await fromColoredPng(slug, COLORED_PNG[slug]);
    if (logo) return { logo, source: "colored-png" };
  }

  if (REMOTE_SVG[slug]) {
    const logo = await fromRemoteSvg(slug, REMOTE_SVG[slug]);
    if (logo) return { logo, source: "remote-svg" };
  }

  if (SIMPLE_ICON_MAP[slug]) {
    const logo = fromSimpleIcons(slug);
    if (logo) return { logo, source: "simple-icons" };
  }

  const logo = writeSvg(slug, makeTextFallbackSvg(slug));
  return { logo, source: "fallback" };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

  const manifest = {};
  const summary = { downloaded: 0, fallback: 0 };

  for (const slug of ALL_SLUGS) {
    process.stdout.write(`[${slug}] `);
    const result = await resolveLogo(slug);
    manifest[slug] = result.logo;
    if (result.source === "fallback") {
      summary.fallback += 1;
      console.log("fallback text");
    } else {
      summary.downloaded += 1;
      console.log(`${result.source} -> ${result.logo}`);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nSaved ${Object.keys(manifest).length} logos to ${OUT_DIR}`);
  console.log(`Downloaded: ${summary.downloaded}, fallback: ${summary.fallback}`);
}

main();
