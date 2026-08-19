import re
from urllib.parse import urljoin

import requests

SITES = {
    "acne-studios": "https://www.acnestudios.com/",
    "amiri": "https://www.amiri.com/",
    "c-p-company": "https://www.cpcompany.com/",
    "jw-anderson": "https://www.jwanderson.com/",
    "maison-mihara-yasuhiro": "https://miharayasuhiro.jp/",
    "palm-angels": "https://www.palmangels.com/",
}

patterns = [
    r"<meta[^>]+(?:property|name)=[\"'](?:og:image|twitter:image)[\"'][^>]+content=[\"']([^\"']+)",
    r"<img[^>]+src=[\"']([^\"']+)",
    r"<link[^>]+rel=[\"'][^\"']*icon[^\"']*[\"'][^>]+href=[\"']([^\"']+)",
]

for slug, url in SITES.items():
    print(f"\n=== {slug} {url}")
    try:
        html = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"}).text
    except Exception as exc:
        print("ERR", exc)
        continue

    found = []
    for p in patterns:
        found.extend(re.findall(p, html, flags=re.I))

    uniq = []
    for item in found:
        abs_url = urljoin(url, item.replace("&amp;", "&"))
        if abs_url not in uniq:
            uniq.append(abs_url)

    for item in uniq[:120]:
        lower = item.lower()
        if any(k in lower for k in ["logo", "brand", "symbol", "mark", "icon", "favicon"]):
            print(" ", item)
