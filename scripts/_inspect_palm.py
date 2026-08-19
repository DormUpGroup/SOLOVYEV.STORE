import re
import requests

html = requests.get(
    "https://www.palmangels.com/en-it/",
    timeout=30,
    headers={"User-Agent": "Mozilla/5.0"},
).text

matches = re.findall(r"[^\"'\s>]*logo\.svg[^\"'\s<]*", html, flags=re.I)
print("count", len(matches))
for m in sorted(set(matches)):
    print(m)
