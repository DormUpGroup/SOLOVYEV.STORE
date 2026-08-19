"""Download and normalize Stussy + Maison Mihara Yasuhiro logos."""
import json
import re
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(r"c:/MY LIFE/Work/ITALY/WEBSITES/Solovyev_Store")
BRANDS_DIR = ROOT / "public" / "assets" / "brands"
MANIFEST_PATH = ROOT / "data" / "brand-logos.json"

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

CANVAS_W = 960
CANVAS_H = 280
MAX_W = int(CANVAS_W * 0.92)
MAX_H = int(CANVAS_H * 0.78)


def content_bbox(img: Image.Image):
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    min_x, min_y = w, h
    max_x, max_y = -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            if r > 245 and g > 245 and b > 245:
                continue
            min_x, min_y, max_x, max_y = min(min_x, x), min(min_y, y), max(max_x, x), max(max_y, y)
    if max_x >= min_x and max_y >= min_y:
        return (min_x, min_y, max_x + 1, max_y + 1)
    alpha = rgba.split()[-1]
    return alpha.getbbox()


def normalize_logo(src: Image.Image, dst_path: Path):
    bbox = content_bbox(src)
    cropped = src.convert("RGBA").crop(bbox) if bbox else src.convert("RGBA")
    ratio = min(MAX_W / cropped.width, MAX_H / cropped.height)
    new_size = (max(1, int(cropped.width * ratio)), max(1, int(cropped.height * ratio)))
    resized = cropped.resize(new_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (255, 255, 255, 0))
    canvas.paste(resized, (0, (CANVAS_H - new_size[1]) // 2), resized)
    canvas.save(dst_path, format="PNG", optimize=True)
    return canvas


def download(url: str) -> bytes:
    r = requests.get(url, timeout=30, headers=HEADERS)
    r.raise_for_status()
    return r.content

def normalize_logo_fill_width(src: Image.Image, dst_path: Path):
    """Prefer filling canvas width — better for tall stacked wordmarks."""
    bbox = content_bbox(src)
    cropped = src.convert("RGBA").crop(bbox) if bbox else src.convert("RGBA")
    ratio = MAX_W / cropped.width
    new_size = (MAX_W, max(1, int(cropped.height * ratio)))
    resized = cropped.resize(new_size, Image.Resampling.LANCZOS)

    if new_size[1] > MAX_H:
        top = (new_size[1] - MAX_H) // 2
        resized = resized.crop((0, top, new_size[0], top + MAX_H))

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (255, 255, 255, 0))
    y = (CANVAS_H - resized.height) // 2
    canvas.paste(resized, (0, y), resized)
    canvas.save(dst_path, format="PNG", optimize=True)
    return canvas


def fix_stussy():
    url = "https://images.seeklogo.com/logo-png/35/1/stussy-logo-png_seeklogo-355576.png"
    data = download(url)
    img = Image.open(BytesIO(data))
    print("stussy source:", img.size, img.mode)
    dst = BRANDS_DIR / "stussy.png"
    out = normalize_logo(img, dst)
    # sanity: count non-transparent pixels
    px = out.load()
    visible = sum(1 for y in range(out.height) for x in range(out.width) if px[x, y][3] > 20)
    print("stussy visible pixels:", visible)
    if visible < 100:
        raise RuntimeError("Stussy logo appears empty after normalization")
    old_svg = BRANDS_DIR / "stussy.svg"
    if old_svg.exists():
        old_svg.unlink()
    return "/assets/brands/stussy.png"


def find_mihara_logo_url() -> str:
    candidates = [
        "https://miharayasuhiro.jp/html/template/mihara/assets/img/common/logo.svg",
        "https://miharayasuhiro.jp/html/template/mihara/assets/img/common/logo.png",
        "https://miharayasuhiro.jp/user_data/packages/mihara/images/logo.png",
        "https://miharayasuhiro.jp/user_data/packages/mihara/images/logo_w.png",
    ]
    for url in candidates:
        try:
            data = download(url)
            if len(data) > 500:
                img = Image.open(BytesIO(data))
                bbox = content_bbox(img)
                if bbox:
                    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
                    if w > 80 and h > 20:
                        print("mihara candidate ok:", url, img.size, "content", w, h)
                        return url
        except Exception as exc:
            print("skip", url, exc)

    # Scrape homepage for logo assets
    html = requests.get("https://miharayasuhiro.jp/", timeout=30, headers=HEADERS).text
    paths = set(re.findall(r"(?:https://miharayasuhiro\.jp)?(/[^\"'\s>]+\.(?:png|svg|jpg))", html, re.I))
    for path in sorted(paths):
        if "logo" not in path.lower():
            continue
        url = f"https://miharayasuhiro.jp{path}" if path.startswith("/") else path
        try:
            data = download(url)
            img = Image.open(BytesIO(data))
            bbox = content_bbox(img)
            if bbox:
                w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
                if w > 80 and h > 20:
                    print("mihara scraped ok:", url, img.size, "content", w, h)
                    return url
        except Exception as exc:
            print("skip scraped", url, exc)

    # Seeklogo fallback
    page = requests.get(
        "https://seeklogo.com/free-vector-logos/maison-mihara-yasuhiro",
        timeout=30,
        headers=HEADERS,
    ).text
    png_urls = re.findall(r"https://images\.seeklogo\.com/logo-png/[^\"']+mihara[^\"']+\.png", page, re.I)
    for url in sorted(set(png_urls), key=len, reverse=True):
        try:
            data = download(url)
            img = Image.open(BytesIO(data))
            bbox = content_bbox(img)
            if bbox:
                w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
                if w > 80 and h > 20:
                    print("mihara seeklogo ok:", url, img.size)
                    return url
        except Exception as exc:
            print("skip seeklogo", url, exc)

    raise RuntimeError("Could not find usable Maison Mihara logo")


def invert_light_logo(img: Image.Image) -> Image.Image:
    """Convert white/light marks to black for white card backgrounds."""
    out = img.convert("RGBA")
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            if r > 200 and g > 200 and b > 200:
                px[x, y] = (0, 0, 0, a)
    return out


def fix_mihara():
    primary_url = "https://1000logos.net/wp-content/uploads/2024/02/Maison-Mihara-Logo.png"
    try:
        data = download(primary_url)
        img = Image.open(BytesIO(data))
        bbox = content_bbox(img)
        if bbox:
            w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
            if w > 200 and h > 20:
                print("mihara source:", primary_url, img.size, "content", w, h)
            else:
                raise RuntimeError("primary logo too small")
        else:
            raise RuntimeError("primary logo has no visible content")
    except Exception as exc:
        print("primary mihara logo failed:", exc)
        url = find_mihara_logo_url()
        data = download(url)
        img = invert_light_logo(Image.open(BytesIO(data)))
        print("mihara fallback:", url, img.size)

    dst = BRANDS_DIR / "maison-mihara-yasuhiro.png"
    out = normalize_logo_fill_width(img, dst)
    px = out.load()
    visible = sum(1 for y in range(out.height) for x in range(out.width) if px[x, y][3] > 20)
    dark = sum(1 for y in range(out.height) for x in range(out.width) if px[x, y][3] > 20 and px[x, y][0] < 50)
    print("mihara visible pixels:", visible, "dark:", dark)
    if visible < 100 or dark < 100:
        raise RuntimeError("Maison Mihara logo appears empty after normalization")
    return "/assets/brands/maison-mihara-yasuhiro.png"


def main():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    manifest["stussy"] = fix_stussy()
    manifest["maison-mihara-yasuhiro"] = fix_mihara()
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("updated brand-logos.json")


if __name__ == "__main__":
    main()
