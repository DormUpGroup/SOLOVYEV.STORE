import json
import os
from pathlib import Path

from PIL import Image

ROOT = Path(r"c:/MY LIFE/Work/ITALY/WEBSITES/Solovyev_Store")
MANIFEST_PATH = ROOT / "data" / "brand-logos.json"
BRANDS_DIR = ROOT / "public" / "assets" / "brands"

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
            # Treat near-white pixels as background to trim padded logos.
            if r > 245 and g > 245 and b > 245:
                continue
            if x < min_x:
                min_x = x
            if y < min_y:
                min_y = y
            if x > max_x:
                max_x = x
            if y > max_y:
                max_y = y

    if max_x >= min_x and max_y >= min_y:
        return (min_x, min_y, max_x + 1, max_y + 1)

    # Fallback to alpha bbox if white-threshold mask found nothing.
    alpha = rgba.split()[-1]
    return alpha.getbbox()


def normalize_logo(src_path: Path, dst_path: Path):
    with Image.open(src_path) as original:
        bbox = content_bbox(original)
        if bbox:
            cropped = original.convert("RGBA").crop(bbox)
        else:
            cropped = original.convert("RGBA")

        ratio = min(MAX_W / cropped.width, MAX_H / cropped.height)
        new_size = (
            max(1, int(cropped.width * ratio)),
            max(1, int(cropped.height * ratio)),
        )
        resized = cropped.resize(new_size, Image.Resampling.LANCZOS)

        canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (255, 255, 255, 0))
        # Left aligned for card layout, vertically centered.
        x = 0
        y = (CANVAS_H - new_size[1]) // 2
        canvas.paste(resized, (x, y), resized)
        canvas.save(dst_path, format="PNG", optimize=True)


def main():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    raster_ext = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    updates = 0

    for slug, rel_path in list(manifest.items()):
        src = ROOT / "public" / rel_path.lstrip("/")
        ext = src.suffix.lower()
        if ext not in raster_ext:
            continue
        if not src.exists():
            continue

        dst = BRANDS_DIR / f"{slug}.png"
        normalize_logo(src, dst)

        if src.resolve() != dst.resolve() and src.exists():
            src.unlink()

        manifest[slug] = f"/assets/brands/{slug}.png"
        updates += 1

    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"normalized raster logos: {updates}")


if __name__ == "__main__":
    main()
