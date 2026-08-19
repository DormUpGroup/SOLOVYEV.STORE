import re
import requests

PAGES = {
    "acne-studios": "https://seeklogo.com/vector-logo/404221/acne-studios",
    "jw-anderson": "https://seeklogo.com/vector-logo/532568/jw-anderson",
    "palm-angels": "https://seeklogo.com/vector-logo/405200/palm-angels",
    "amiri": "https://seeklogo.com/free-vector-logos/amiri",
    "maison-mihara-yasuhiro": "https://seeklogo.com/free-vector-logos/maison-mihara-yasuhiro",
    "c-p-company": "https://seeklogo.com/free-vector-logos/c-p-company",
}

for slug, url in PAGES.items():
    print(f"\n=== {slug} {url}")
    try:
        html = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"}).text
    except Exception as exc:
        print("ERR", exc)
        continue
    items = re.findall(r"https://images\.seeklogo\.com/logo-png/[^\"]+", html)
    print("count", len(items))
    for item in items[:10]:
        print(item)
