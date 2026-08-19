import re
import requests

url = "https://seeklogo.com/vector-logo/404221/acne-studios"
html = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"}).text
items = re.findall(r"https://images.seeklogo.com/logo-png/[^\"]+", html)
print("count", len(items))
for item in items[:20]:
    print(item)
