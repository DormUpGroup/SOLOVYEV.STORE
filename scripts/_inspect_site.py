import re
import requests
from urllib.parse import urljoin

URLS = [
    "https://projectgrr.com/",
    "https://fearofgod.com/",
]

for url in URLS:
    print("\n====", url)
    html = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"}).text
    print("len", len(html))
    metas = re.findall(
        r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]+content=["\']([^"\']+)["\']',
        html,
        flags=re.I,
    )
    print("meta", metas[:5])
    imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, flags=re.I)
    print("img-count", len(imgs))
    for src in imgs[:25]:
        print(" ", urljoin(url, src))
