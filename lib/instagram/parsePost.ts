import type { Product, ProductCategory, ProductStatus } from "@/lib/types";
import { inferClothingType } from "@/lib/clothing-types";

const SELL_KEYWORDS =
  /₪|ILS|for sale|available|in stock|\bDM\b|whatsapp|למכירה|מידה|מחיר|size\s*[:.]|\bEU\s*\d|\bUS\s*\d|Price\s*:/i;

const EXCLUDE_KEYWORDS =
  /giveaway|Winner:|Условия|итоги|розыгрыш|repost this post/i;

const SNEAKER_KEYWORDS =
  /jordan|nike|yeezy|adidas|dunk|air max|new balance|asics|salomon|converse|slide|sneaker|trainer|high[\s-]?top|low[\s-]?top|bape sta|boost|кроссовк/i;
const CLOTHING_KEYWORDS =
  /hoodie|tee|t-shirt|jacket|crewneck|sweatshirt|pants|cargo|polo|shorts|parka|fear of god|essentials|stussy|chrome hearts|represent|cp company/i;
const ACCESSORY_KEYWORDS = /cap|hat|bag|backpack|wallet|belt|sunglasses|jewelry|ring|chain|glasses/i;

const BRAND_MAP: Array<[string, RegExp]> = [
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
  ["Chrome Hearts", /chrome hearts/i],
  ["Fear of God", /fear of god|essentials/i],
  ["Stussy", /stussy/i],
  ["Represent", /represent/i],
  ["New Balance", /new balance/i],
];

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) +
    "-" +
    Date.now().toString(36).slice(-4)
  );
}

export function isSellPost(caption: string): boolean {
  if (!caption || caption.trim().length < 8) return false;
  if (EXCLUDE_KEYWORDS.test(caption)) return false;
  if (/^\?+\.\?+\.\d{4}$/.test(caption.trim())) return false;
  return SELL_KEYWORDS.test(caption);
}

export function isSoldCaption(caption: string): boolean {
  return /^Sold\n/i.test(caption) || /Price:\s*(Sold|sold|\*\*\*)/i.test(caption);
}

export function parsePrice(caption: string): number {
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

export function parseSizes(caption: string): string[] {
  const found = new Set<string>();
  for (const m of caption.matchAll(/\b(3[6-9]|4[0-6])(?:\.5)?\b/g)) found.add(m[1]);
  for (const m of caption.matchAll(/\b(\d{1,2}(?:\.5)?)\s*US\b/gi))
    found.add(`US ${m[1]}`);
  for (const m of caption.matchAll(/\bUS\s*(\d{1,2}(?:\.5)?)\b/gi))
    found.add(`US ${m[1]}`);
  for (const m of caption.matchAll(/\b(XXS|XS|S|M|L|XL|XXL|One Size|O\/S)\b/gi)) {
    const s = m[1].toUpperCase() === "O/S" ? "One Size" : m[1].toUpperCase();
    found.add(s);
  }
  return [...found];
}

export function parseCategory(caption: string): ProductCategory {
  if (ACCESSORY_KEYWORDS.test(caption)) return "accessories";
  if (CLOTHING_KEYWORDS.test(caption)) return "clothing";
  if (SNEAKER_KEYWORDS.test(caption)) return "sneakers";
  return "clothing";
}

export function parseBrand(caption: string): string {
  for (const [brand, re] of BRAND_MAP) {
    if (re.test(caption)) return brand;
  }
  const firstLine = caption.split("\n")[0].trim();
  if (firstLine.length <= 40) return firstLine.split(" ")[0] || "Streetwear";
  return "Streetwear";
}

export function parseTitle(caption: string, shortcode: string): string {
  const lines = caption
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const titleLine = lines.find((l) => !/^sold$/i.test(l)) || "";
  const title = titleLine.replace(/[#@][\w.]+/g, "").trim();
  if (title.length >= 5) return title.slice(0, 80);
  return `Instagram Item ${shortcode}`;
}

export function parseCondition(caption: string): string {
  const cond = caption.match(/Condition:\s*([^\n]+)/i);
  if (cond) return cond[1].trim();
  if (/10\/10|DS|deadstock|brand new|חדש/i.test(caption)) {
    return "10/10 DS (Brand New)";
  }
  return "See description";
}

export function parseInstagramPost(input: {
  shortcode: string;
  caption: string;
  imageUrl: string;
}): Omit<Product, "id"> {
  const { shortcode, caption, imageUrl } = input;
  const title = parseTitle(caption, shortcode);
  const category = parseCategory(caption);
  const sold = isSoldCaption(caption);
  return {
    slug: slugify(title),
    title,
    category,
    clothingType: category === "clothing" ? inferClothingType(title, caption) : undefined,
    price: parsePrice(caption),
    condition: parseCondition(caption),
    brand: parseBrand(caption),
    badge: sold ? "classic" : "hot",
    sizes: parseSizes(caption),
    img: imageUrl,
    status: (sold ? "sold" : "draft") as ProductStatus,
    sold: sold || undefined,
    description: caption.trim(),
    instagramUrl: `https://www.instagram.com/p/${shortcode}/`,
    source: "instagram",
  };
}

export function extractShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/i);
  return m?.[1] ?? null;
}
