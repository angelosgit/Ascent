"""Generate the app icon and splash art from the extracted boulder sprite.

Expo wants a 1024x1024 icon. Android's adaptive icon crops to a circle on many
launchers and masks aggressively, so its foreground gets a much wider margin —
the safe zone is only the middle 66%.
"""
import os

from PIL import Image

ART = os.path.join(os.path.dirname(__file__), "..", "assets", "art")
ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")

CREAM = (251, 235, 210, 255)
INK = (27, 13, 7, 255)


def centred(sprite, canvas_px, fill_fraction, background):
    """Fit `sprite` into a square canvas, occupying `fill_fraction` of its width."""
    target = round(canvas_px * fill_fraction)
    scale = target / max(sprite.width, sprite.height)
    resized = sprite.resize(
        (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))),
        Image.LANCZOS,
    )
    canvas = Image.new("RGBA", (canvas_px, canvas_px), background)
    canvas.alpha_composite(
        resized,
        ((canvas_px - resized.width) // 2, (canvas_px - resized.height) // 2),
    )
    return canvas


def main():
    boulder = Image.open(os.path.join(ART, "boulder.png")).convert("RGBA")
    boulder = boulder.crop(boulder.getbbox())

    jobs = [
        # (filename, size, fill fraction, background)
        ("icon.png", 1024, 0.78, CREAM),
        ("splash-icon.png", 1024, 0.62, (0, 0, 0, 0)),
        ("favicon.png", 96, 0.82, CREAM),
        # Adaptive icon: Android masks hard, so keep well inside the safe zone.
        ("android-icon-foreground.png", 1024, 0.52, (0, 0, 0, 0)),
        ("android-icon-monochrome.png", 1024, 0.52, (0, 0, 0, 0)),
    ]
    for name, size, fill, bg in jobs:
        img = centred(boulder, size, fill, bg)
        if name == "android-icon-monochrome.png":
            # Monochrome layers are treated as a silhouette: alpha is all that
            # is read, so flatten the colour to ink.
            alpha = img.getchannel("A")
            img = Image.new("RGBA", img.size, INK)
            img.putalpha(alpha)
        img.save(os.path.join(ASSETS, name), optimize=True)
        print(f"{name:32} {size}x{size}")

    flat = Image.new("RGBA", (1024, 1024), CREAM)
    flat.save(os.path.join(ASSETS, "android-icon-background.png"), optimize=True)
    print(f"{'android-icon-background.png':32} 1024x1024 (flat)")


if __name__ == "__main__":
    main()
