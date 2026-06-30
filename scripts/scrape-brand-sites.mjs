const sites = {
  "fear-of-god": "https://fearofgod.com/",
  represent: "https://representclo.com/",
};

for (const [slug, url] of Object.entries(sites)) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  const html = await response.text();
  const matches = [
    ...html.matchAll(/https?:\/\/[^"'\\s]+\.(?:png|svg|webp)(?:\?[^"'\\s]*)?/gi),
  ].map((m) => m[0]);
  const logoish = [...new Set(matches)].filter((u) =>
    /logo|brand|header/i.test(u),
  );
  console.log(`\n${slug}:`);
  logoish.slice(0, 8).forEach((u) => console.log(" ", u));
}
