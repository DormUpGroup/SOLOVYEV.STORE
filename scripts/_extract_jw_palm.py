import re
import requests

sites = {
    "jw": "https://jwanderson.com/",
    "palm": "https://www.palmangels.com/en-it/",
}

for name, url in sites.items():
    print("\n===", name, url)
    html = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"}).text
    urls = re.findall(r"https?://[^\"'\s>]+", html)
    seen = set()
    shown = 0
    for u in urls:
        if u in seen:
            continue
        seen.add(u)
        low = u.lower()
        if any(k in low for k in ["logo", "favicon", "icon", "brand", "wordmark"]):
            if any(skip in low for skip in ["googleapis", "font", "schema.org", "iconify"]):
                continue
            print(u)
            shown += 1
            if shown >= 80:
                break
    print("shown", shown)
