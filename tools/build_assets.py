"""Extract game-ready sprites from the client's PSD into the RN project.

Use the PSD, never the loose PNGs that came alongside it — every one of those is
a Fiverr preview with the marketplace's watermark tiled across it, and the set is
missing an arm besides.
"""
import json, os
from psd_tools import PSDImage
from PIL import Image

# "SISIFO (1).psd" — the second hand-off. Licensed (the Adobe Stock watermark is
# gone) and mirrored, so the climb now runs up and to the right.
SRC = r"e:\Web Project\Minimalist\SISIFO (1).psd"
DEST = r"e:\Web Project\Minimalist\ascent\assets\art"
SCALE = 0.75

os.makedirs(os.path.join(DEST, "char"), exist_ok=True)
psd = PSDImage.open(SRC)
layers = {l.name: l for l in psd}


def scaled(img):
    return img.resize((max(1, round(img.width * SCALE)), max(1, round(img.height * SCALE))), Image.LANCZOS)


def save(img, path):
    img.save(path, optimize=True)
    return os.path.getsize(path)


# Measured off the mountain layer's alpha: 45.33 degrees. Negative because the
# ridge now rises to the right.
RIDGE_SLOPE = -1.0114


manifest = {"scale": SCALE, "doc": [psd.width, psd.height]}

# --- scenery -------------------------------------------------------------
for name, out in (("bg", "sky.png"), ("mountain", "slope.png"), ("stone", "boulder.png")):
    layer = layers[name]
    img = layer.composite().convert("RGBA")
    # The second hand-off trimmed the stray specks that used to hang below the
    # boulder, so every layer now crops honestly to its own content.
    box = img.getbbox()
    img = img.crop(box)
    off = (layer.bbox[0] + box[0], layer.bbox[1] + box[1])
    px = save(scaled(img), os.path.join(DEST, out))
    manifest[name] = {
        "file": out,
        "offset": [round(off[0] * SCALE), round(off[1] * SCALE)],
        "size": [round(img.width * SCALE), round(img.height * SCALE)],
    }
    print(f"{out:14} {img.width}x{img.height} @{off}  {px/1024:.0f} KB")

# --- character -----------------------------------------------------------
group = layers["character"]
gx, gy = group.bbox[0], group.bbox[1]
manifest["character"] = {
    "origin": [round(gx * SCALE), round(gy * SCALE)],
    "size": [round((group.bbox[2] - gx) * SCALE), round((group.bbox[3] - gy) * SCALE)],
    "parts": {},
}
for layer in group:
    img = layer.composite().convert("RGBA")
    box = img.getbbox()
    img = img.crop(box)
    off = (layer.bbox[0] + box[0] - gx, layer.bbox[1] + box[1] - gy)
    out = f"char/{layer.name.replace('+', '')}.png"
    px = save(scaled(img), os.path.join(DEST, out))
    manifest["character"]["parts"][layer.name.replace("+", "")] = {
        "file": out,
        "offset": [round(off[0] * SCALE), round(off[1] * SCALE)],
        "size": [round(img.width * SCALE), round(img.height * SCALE)],
    }
    print(f"{out:18} {img.width}x{img.height} @{off}  {px/1024:.0f} KB")

with open(os.path.join(DEST, "manifest.json"), "w") as fh:
    json.dump(manifest, fh, indent=2)
print("\nmanifest written")
