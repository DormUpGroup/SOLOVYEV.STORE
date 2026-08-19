import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "assets", "brands");
const MANIFEST_PATH = path.join(ROOT, "data", "brand-logos.json");
const USER_AGENT = "Mozilla/5.0 (compatible; SolovyevStore/1.0)";

/** slug -> direct logo URL (official site or verified vector/png) */
const LOGOS = {
  "acne-studios":
    "https://images.seeklogo.com/logo-png/40/1/acne-studios-logo-png_seeklogo-404221.png",
  amiri:
    "https://amiri.com/cdn/shop/files/AMIRI_Serif_Logo_07-22-24_Blk_copy.png?v=1721688687",
  "jw-anderson":
    "https://images.seeklogo.com/logo-png/53/1/jw-anderson-logo-png_seeklogo-532568.png",
  "c-p-company":
    "https://www.cpcompany.com/on/demandware.static/Sites-CP-IT-Site/-/default/dwe5f4ea9b/images/logo-black.png",
  "maison-mihara-yasuhiro":
    "https://miharayasuhiro.jp/user_data/packages/mihara/images/logo_l.png",
  "palm-angels":
    "https://images.seeklogo.com/logo-png/40/1/palm-angels-logo-png_seeklogo-405200.png",
  "ron-arad-by-pq":
    "https://pqswim.com/cdn/shop/files/PQ_Logo_Black.png?v=1678848000",
  "saint-laurent":
    "https://logos-world.net/wp-content/uploads/2021/11/YSL-Logo-700x394.png",
  "tom-ford":
    "https://logos-world.net/wp-content/uploads/2020/12/Tom-Ford-Logo-700x394.png",
};

function removeExisting(slug) {
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.startsWith(`${slug}.`)) fs.unlinkSync(path.join(OUT_DIR, file));
  }
}

function extFrom(contentType, url) {
  const lower = url.toLowerCase();
  if (contentType.includes("svg") || lower.endsWith(".svg")) return "svg";
  if (contentType.includes("webp") || lower.endsWith(".webp")) return "webp";
  if (contentType.includes("jpeg") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "jpg";
  }
  return "png";
}

async function fetchLogo(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/*,*/*" },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("html")) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 500) return null;
  return { bytes, contentType, url };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  let ok = 0;
  let fail = 0;

  for (const [slug, url] of Object.entries(LOGOS)) {
    let logo = await fetchLogo(url);
    if (!logo && slug === "ron-arad-by-pq") {
      logo = await fetchLogo(
        "https://www.google.com/s2/favicons?domain=pqswim.com&sz=256",
      );
    }
    if (!logo) {
      fail += 1;
      console.log(`[fail] ${slug} <- ${url}`);
      continue;
    }
    const ext = extFrom(logo.contentType, logo.url);
    removeExisting(slug);
    const fileName = `${slug}.${ext}`;
    fs.writeFileSync(path.join(OUT_DIR, fileName), logo.bytes);
    manifest[slug] = `/assets/brands/${fileName}`;
    ok += 1;
    console.log(`[ok] ${slug} -> ${fileName} (${logo.bytes.length} bytes)`);
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nok=${ok} fail=${fail}`);
}

main();
