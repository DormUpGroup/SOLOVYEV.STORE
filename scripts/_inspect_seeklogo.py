import re
import requests

url = "https://seeklogo.com/vector-logo/251715/rockstone"
html = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"}).text
print("len", len(html))
for pattern in [
    r"https://seeklogo.com/images/[^\"]+",
    r"https://[^\"']+\.png",
    r"https://[^\"']+\.svg",
]:
    items = re.findall(pattern, html)
    print("\npattern:", pattern, "count:", len(items))
    for item in items[:20]:
        print(item)
