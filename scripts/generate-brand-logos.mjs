import fs from "node:fs";
import path from "node:path";

const brands = [
  "Adidas",
  "Bape",
  "Burberry",
  "Chrome Hearts",
  "Converse",
  "Dolce & Gabbana",
  "Fear of God",
  "Ferragamo",
  "Gucci",
  "Jordan",
  "Moncler",
  "Nike",
  "Off-White",
  "Prada",
  "Represent",
  "Stussy",
  "Supreme",
  "The North Face",
];

function brandToSlug(brand) {
  return brand
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const dir = path.join("public", "assets", "brands");
fs.mkdirSync(dir, { recursive: true });

for (const brand of brands) {
  const label = brand.toUpperCase();
  const size =
    label.length > 14 ? 11 : label.length > 10 ? 13 : label.length > 8 ? 15 : 18;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 56" role="img" aria-label="${brand}">
  <text x="120" y="36" text-anchor="middle" fill="#000000" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" letter-spacing="0.08em">${label}</text>
</svg>
`;
  fs.writeFileSync(path.join(dir, `${brandToSlug(brand)}.svg`), svg);
}

console.log(`Created ${brands.length} brand logos in ${dir}`);
