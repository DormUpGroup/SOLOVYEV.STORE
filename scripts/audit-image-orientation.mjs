import fs from "fs";
import path from "path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile(".env.local");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const outputDir = path.resolve("tmp", "orientation-audit");
const tileWidth = 220;
const tileHeight = 250;
const columns = 5;
const rowsPerSheet = 4;
const perSheet = columns * rowsPerSheet;

fs.mkdirSync(outputDir, { recursive: true });

const { data, error } = await supabase
  .from("product_images")
  .select("id, product_id, image_url, sort_order")
  .order("id", { ascending: true });
if (error) throw error;

async function inspect(row) {
  try {
    const url = new URL(row.image_url);
    const marker = "/storage/v1/object/public/";
    const markerIndex = url.pathname.indexOf(marker);
    let source;
    if (markerIndex >= 0) {
      const rest = url.pathname.slice(markerIndex + marker.length);
      const slash = rest.indexOf("/");
      const bucket = rest.slice(0, slash);
      const storagePath = decodeURIComponent(rest.slice(slash + 1));
      const { data: blob, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(storagePath);
      if (downloadError) throw downloadError;
      source = Buffer.from(await blob.arrayBuffer());
    } else {
      const response = await fetch(row.image_url, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      source = Buffer.from(await response.arrayBuffer());
    }
    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height) return null;
    return { ...row, source, width: metadata.width, height: metadata.height };
  } catch (err) {
    console.warn(`skip image ${row.id}: ${err.message}`);
    return null;
  }
}

const inspected = [];
const concurrency = 30;
for (let index = 0; index < data.length; index += concurrency) {
  const batch = await Promise.all(data.slice(index, index + concurrency).map(inspect));
  inspected.push(...batch.filter(Boolean));
  process.stdout.write(
    `\rInspected ${Math.min(index + concurrency, data.length)}/${data.length}`,
  );
}
console.log();

fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  JSON.stringify(
    inspected.map(({ source: _source, ...image }) => image),
    null,
    2,
  ),
);

for (let start = 0; start < inspected.length; start += perSheet) {
  const batch = inspected.slice(start, start + perSheet);
  const composites = [];
  for (let index = 0; index < batch.length; index += 1) {
    const image = batch[index];
    const thumb = await sharp(image.source)
      .resize(tileWidth - 16, tileHeight - 46, {
        fit: "contain",
        background: "#111111",
      })
      .png()
      .toBuffer();
    const x = (index % columns) * tileWidth + 8;
    const y = Math.floor(index / columns) * tileHeight + 34;
    composites.push({ input: thumb, left: x, top: y });
    composites.push({
      input: Buffer.from(
        `<svg width="${tileWidth}" height="30">
          <rect width="100%" height="100%" fill="#ffffff"/>
          <text x="8" y="20" font-family="Arial" font-size="15" fill="#000000">
            image ${image.id} · product ${image.product_id} · #${image.sort_order + 1}
          </text>
        </svg>`,
      ),
      left: (index % columns) * tileWidth,
      top: Math.floor(index / columns) * tileHeight,
    });
  }

  const sheetNumber = Math.floor(start / perSheet) + 1;
  await sharp({
    create: {
      width: columns * tileWidth,
      height: rowsPerSheet * tileHeight,
      channels: 3,
      background: "#111111",
    },
  })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(path.join(outputDir, `all-${String(sheetNumber).padStart(2, "0")}.jpg`));
}

console.log(
  `Created ${Math.ceil(inspected.length / perSheet)} sheet(s) for ${inspected.length} images.`,
);
