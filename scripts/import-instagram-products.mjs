/**
 * Instagram product import utilities.
 *
 * Usage:
 *   node scripts/import-instagram-products.mjs merge
 *     — merges data/instagram-import.json into data/products.json (Instagram only)
 *
 *   node scripts/import-instagram-products.mjs from-raw data/instagram-raw.json
 *     — parses raw scrape → data/instagram-import.json + downloads images
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PRODUCTS_PATH = path.join(ROOT, "data", "products.json");
const IMPORT_PATH = path.join(ROOT, "data", "instagram-import.json");
const ASSETS_DIR = path.join(ROOT, "public", "assets", "products");

const SELL_KEYWORDS =
  /₪|ILS|for sale|available|in stock|\bDM\b|whatsapp|למכירה|מידה|מחיר|size\s*[:.]|\bEU\s*\d|\bUS\s*\d|Price\s*:/i;

const EXCLUDE_KEYWORDS =
  /giveaway|Winner:|Условия|итоги|розыгрыш|repost this post/i;

const SNEAKER_KEYWORDS =
  /jordan|nike|yeezy|adidas|dunk|air max|new balance|asics|salomon|converse|slide|sneaker|trainer|high[\s-]?top|low[\s-]?top|bape sta|boost|кроссовк/i;
const CLOTHING_KEYWORDS =
  /hoodie|tee|t-shirt|jacket|crewneck|sweatshirt|pants|cargo|polo|shorts|parka|fear of god|essentials|stussy|chrome hearts|represent|cp company/i;
const ACCESSORY_KEYWORDS = /cap|hat|bag|backpack|wallet|belt|sunglasses|jewelry|ring|chain|glasses/i;

const BRAND_MAP = [
  ["Jordan", /jordan/i],
  ["Nike", /nike|dunk|air max/i],
  ["Adidas", /adidas|yeezy/i],
  ["Gucci", /gucci/i],
  ["Supreme", /supreme/i],
  ["Bape", /bape|a bathing ape/i],
  ["Off-White", /off-white/i],
  ["Prada", /prada/i],
  ["Burberry", /burberry/i],
  ["Moncler", /moncler/i],
  ["Ferragamo", /ferragamo/i],
  ["The North Face", /thenorthface|the north face/i],
  ["Dolce & Gabbana", /dolce\s*&?\s*gabbana/i],
  ["Converse", /converse/i],
  ["Nike", /nike|dunk|air max/i],
  ["Adidas", /adidas|yeezy/i],
  ["Chrome Hearts", /chrome hearts/i],
  ["Fear of God", /fear of god|essentials/i],
  ["Stussy", /stussy/i],
  ["Represent", /represent/i],
  ["New Balance", /new balance/i],
];

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function isSellPost(caption) {
  if (!caption || caption.trim().length < 8) return false;
  if (EXCLUDE_KEYWORDS.test(caption)) return false;
  if (/^\?+\.\?+\.\d{4}$/.test(caption.trim())) return false;
  return SELL_KEYWORDS.test(caption);
}

export function isSoldCaption(caption) {
  return (
    /^Sold\n/i.test(caption) ||
    /Price:\s*(Sold|sold|\*\*\*)/i.test(caption)
  );
}

export function parsePrice(caption) {
  if (/Price:\s*DM/i.test(caption)) return 0;
  if (/Price:\s*(Sold|sold|\*\*\*)/i.test(caption)) return 0;
  const patterns = [
    /Price:\s*(\d[\d,]*)/i,
    /₪\s*([\d,]+)/,
    /([\d,]{3,5})\s*₪/,
    /price\s*[:.]?\s*₪?\s*([\d,]+)/i,
    /מחיר\s*[:.]?\s*₪?\s*([\d,]+)/,
  ];
  for (const re of patterns) {
    const m = caption.match(re);
    if (m) return parseInt(m[1].replace(/,/g, ""), 10);
  }
  return 0;
}

export function parseSizes(caption) {
  const found = new Set();
  const eu = caption.matchAll(/\b(3[6-9]|4[0-6])(?:\.5)?\b/g);
  for (const m of eu) found.add(m[1]);
  const us = caption.matchAll(/\b(\d{1,2}(?:\.5)?)\s*US\b/gi);
  for (const m of us) found.add(`US ${m[1]}`);
  const usPrefix = caption.matchAll(/\bUS\s*(\d{1,2}(?:\.5)?)\b/gi);
  for (const m of usPrefix) found.add(`US ${m[1]}`);
  const clothing = caption.matchAll(/\b(XXS|XS|S|M|L|XL|XXL|One Size|O\/S)\b/gi);
  for (const m of clothing) {
    const s = m[1].toUpperCase() === "O/S" ? "One Size" : m[1].toUpperCase();
    found.add(s);
  }
  return [...found];
}

export function parseCategory(caption) {
  if (ACCESSORY_KEYWORDS.test(caption)) return "accessories";
  if (CLOTHING_KEYWORDS.test(caption)) return "clothing";
  if (SNEAKER_KEYWORDS.test(caption)) return "sneakers";
  return "clothing";
}

export function parseBrand(caption) {
  for (const [brand, re] of BRAND_MAP) {
    if (re.test(caption)) return brand;
  }
  const firstLine = caption.split("\n")[0].trim();
  if (firstLine.length <= 40) return firstLine.split(" ")[0] || "Streetwear";
  return "Streetwear";
}

export function parseTitle(caption, shortcode) {
  const lines = caption.split("\n").map((l) => l.trim()).filter(Boolean);
  const titleLine = lines.find((l) => !/^sold$/i.test(l)) || "";
  const title = titleLine.replace(/[#@][\w.]+/g, "").trim();
  if (title.length >= 5) return title.slice(0, 80);
  return `Instagram Item ${shortcode}`;
}

export function parseCondition(caption) {
  const cond = caption.match(/Condition:\s*([^\n]+)/i);
  if (cond) return cond[1].trim();
  if (/10\/10|DS|deadstock|brand new|חדש/i.test(caption)) {
    return "10/10 DS (Brand New)";
  }
  if (/9\.?5\/10|VNDS|worn once/i.test(caption)) {
    return "9.5/10 (VNDS)";
  }
  if (/9\/10|excellent/i.test(caption)) return "9/10 (Excellent)";
  return "See description";
}

export function parseSizesFromCaption(caption) {
  const sizeLine = caption.match(/Size:\s*([^\n]+)/i);
  if (!sizeLine) return parseSizes(caption);
  const raw = sizeLine[1].trim();
  if (/^all$/i.test(raw)) return ["One Size"];
  if (/^(S|M|L|XL|XXL|Medium|Large|Small)(?:-(S|M|L|XL|XXL|Medium|Large|Small))?$/i.test(raw)) {
    if (raw.includes("-")) {
      const [a, b] = raw.split("-");
      return [`${a.toUpperCase()}-${b.toUpperCase()}`];
    }
    return [raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()];
  }
  return parseSizes(caption);
}

export function rawPostToProduct(post, id) {
  const { shortcode, caption, imageUrl } = post;
  const sold = isSoldCaption(caption);
  const slug = `${slugify(parseTitle(caption, shortcode))}-${shortcode}`.slice(0, 80);
  return {
    id,
    slug,
    title: parseTitle(caption, shortcode),
    category: parseCategory(caption),
    price: parsePrice(caption),
    condition: parseCondition(caption),
    brand: parseBrand(caption),
    badge: sold ? "classic" : "hot",
    sizes: parseSizesFromCaption(caption),
    img: `/assets/products/ig-${shortcode}.jpg`,
    status: sold ? "sold" : "available",
    sold: sold || undefined,
    description: caption.trim(),
    instagramUrl: `https://www.instagram.com/p/${shortcode}/`,
    source: "instagram",
    _imageUrl: imageUrl,
  };
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(dest);
          return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", reject);
  });
}

async function fromRaw(rawPath) {
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));
  const posts = Array.isArray(raw) ? raw : raw.posts || [];
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const sellPosts = posts.filter((p) => isSellPost(p.caption || ""));
  console.log(`Found ${posts.length} posts, ${sellPosts.length} sell posts`);

  const startId = 1;
  const products = [];

  for (let i = 0; i < sellPosts.length; i++) {
    const product = rawPostToProduct(sellPosts[i], startId + i);
    const dest = path.join(ROOT, "public", product.img);
    if (product._imageUrl) {
      try {
        await downloadFile(product._imageUrl, dest);
        console.log(`Downloaded ${product.img}`);
      } catch (e) {
        console.warn(`Failed image ${product.slug}:`, e.message);
        if (sellPosts[i].localImage) {
          const src = path.join(ROOT, sellPosts[i].localImage);
          if (fs.existsSync(src)) fs.copyFileSync(src, dest);
        }
      }
    } else if (sellPosts[i].localImage) {
      const src = path.join(ROOT, sellPosts[i].localImage);
      if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    }
    delete product._imageUrl;
    products.push(product);
  }

  fs.writeFileSync(IMPORT_PATH, JSON.stringify(products, null, 2));
  console.log(`Wrote ${products.length} products to ${IMPORT_PATH}`);
  return products;
}

function merge() {
  const imported = JSON.parse(fs.readFileSync(IMPORT_PATH, "utf8"));
  const catalog = imported
    .filter((p) => p.source === "instagram")
    .map((p, i) => ({ ...p, id: i + 1 }));
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`Catalog: ${catalog.length} Instagram products`);
}

const [,, cmd, arg] = process.argv;
if (cmd === "merge") {
  merge();
} else if (cmd === "from-raw" && arg) {
  fromRaw(path.resolve(arg)).catch(console.error);
} else {
  console.log("Commands: merge | from-raw <path>");
}
