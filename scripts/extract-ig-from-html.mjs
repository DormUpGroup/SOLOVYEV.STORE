import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(
  path.join(__dirname, "../data/ig-profile.html"),
  "utf8",
);

function extractPostsFromHtml(pageHtml) {
  const posts = [];
  const seen = new Set();

  // Pattern: shortcode + display_url nearby in JSON blobs
  const shortcodeRe = /"shortcode":"([A-Za-z0-9_-]+)"/g;
  const codes = [...pageHtml.matchAll(shortcodeRe)].map((m) => m[1]);

  for (const shortcode of codes) {
    if (seen.has(shortcode)) continue;
    seen.add(shortcode);

    const idx = pageHtml.indexOf(`"shortcode":"${shortcode}"`);
    const chunk = pageHtml.slice(idx, idx + 8000);

    const captionMatch =
      chunk.match(/"text":"((?:\\.|[^"\\])*)"/) ||
      chunk.match(/"caption":\{"text":"((?:\\.|[^"\\])*)"/);
    const imageMatch = chunk.match(/"display_url":"((?:\\.|[^"\\])*)"/);

    let caption = "";
    if (captionMatch) {
      try {
        caption = JSON.parse(`"${captionMatch[1]}"`);
      } catch {
        caption = captionMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      }
    }

    let imageUrl = "";
    if (imageMatch) {
      try {
        imageUrl = JSON.parse(`"${imageMatch[1]}"`);
      } catch {
        imageUrl = imageMatch[1];
      }
    }

    if (imageUrl || caption) {
      posts.push({ shortcode, caption, imageUrl });
    }
  }

  return posts;
}

const posts = extractPostsFromHtml(html);
console.log(`Extracted ${posts.length} posts`);
posts.slice(0, 3).forEach((p) => {
  console.log("---", p.shortcode);
  console.log(p.caption?.slice(0, 120));
  console.log(p.imageUrl?.slice(0, 80));
});

fs.writeFileSync(
  path.join(__dirname, "../data/instagram-raw.json"),
  JSON.stringify({ posts }, null, 2),
);
console.log("Wrote data/instagram-raw.json");
