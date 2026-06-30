const pages = {
  adidas: "https://logos-world.net/adidas-logo/",
  nike: "https://logos-world.net/nike-logo/",
  jordan: "https://logos-world.net/air-jordan-logo/",
  converse: "https://logos-world.net/converse-logo/",
  supreme: "https://logos-world.net/supreme-logo/",
  prada: "https://logos-world.net/prada-logo/",
  stussy: "https://logos-world.net/stussy-logo/",
  ferragamo: "https://logos-world.net/salvatore-ferragamo-logo/",
  "chrome-hearts": "https://logos-world.net/chrome-hearts-logo/",
  "the-north-face": "https://logos-world.net/the-north-face-logo/",
  gucci: "https://logos-world.net/gucci-logo/",
  burberry: "https://logos-world.net/burberry-logo/",
  bape: "https://logos-world.net/bape-logo/",
  moncler: "https://logos-world.net/moncler-logo/",
  "off-white": "https://logos-world.net/off-white-logo/",
  "dolce-and-gabbana": "https://logos-world.net/dolce-gabbana-logo/",
};

function pickBest(urls, slug) {
  const keyword = slug.replace(/-/g, " ").replace("and", "");
  const filtered = urls.filter((u) => {
    const lower = u.toLowerCase();
    if (/-\d+x\d+\./.test(lower)) return false;
    if (/120x67|500x281|700x394/.test(lower)) return false;
    return lower.includes(".png");
  });
  const scored = filtered.map((u) => {
    const lower = u.toLowerCase();
    let score = 0;
    if (lower.includes("logo") && !lower.includes("emblem")) score += 10;
    if (slug.split("-").some((part) => part.length > 2 && lower.includes(part)))
      score += 5;
    if (lower.endsWith(".png")) score += 2;
    score += lower.length / 100;
    return { u, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.u;
}

for (const [slug, url] of Object.entries(pages)) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await response.text();
    const urls = [
      ...html.matchAll(/https:\/\/logos-world\.net\/wp-content\/uploads\/[^"'\\s]+\.png/gi),
    ].map((m) => m[0]);
    const best = pickBest([...new Set(urls)], slug);
    console.log(`${slug}: ${best || "NONE"}`);
  } catch (e) {
    console.log(`${slug}: ERROR`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}
