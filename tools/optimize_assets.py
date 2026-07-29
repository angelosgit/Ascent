"""Shrink the extracted sprites.

The artwork is flat-shaded hatching over a gradient, so a 256 colour adaptive
palette is visually lossless here and cuts the bundle by roughly 80%.
Run after build_assets.py.
"""
import os

from PIL import Image

ART = os.path.join(os.path.dirname(__file__), "..", "assets", "art")
TARGETS = ["sky.png", "slope.png", "boulder.png"]


def optimize(path, colors=256):
    before = os.path.getsize(path)
    img = Image.open(path).convert("RGBA")
    # FASTOCTREE is the only Pillow quantiser that keeps the alpha channel.
    out = img.quantize(colors=colors, method=Image.Quantize.FASTOCTREE)
    out.save(path, optimize=True)
    after = os.path.getsize(path)
    print(f"{os.path.basename(path):14} {before/1024:8.0f} KB -> {after/1024:7.0f} KB"
          f"  ({100 - after / before * 100:.0f}% smaller)")
    return before, after


if __name__ == "__main__":
    total_before = total_after = 0
    for name in TARGETS:
        b, a = optimize(os.path.join(ART, name))
        total_before += b
        total_after += a
    for name in sorted(os.listdir(os.path.join(ART, "char"))):
        b, a = optimize(os.path.join(ART, "char", name))
        total_before += b
        total_after += a
    print(f"\ntotal {total_before/1024/1024:.2f} MB -> {total_after/1024/1024:.2f} MB")
