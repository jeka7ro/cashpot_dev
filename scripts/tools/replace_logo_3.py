from PIL import Image, ImageDraw

bg_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/media__1779354160085.jpg'
bg = Image.open(bg_path).convert("RGBA")

logo_path = '/Users/eugeniucazmal/Downloads/dev_office/cashpot_online_new/app/public/logoMobile.webp'
logo = Image.open(logo_path).convert("RGBA")

size = 110
logo = logo.resize((size, size), Image.Resampling.LANCZOS)

draw = ImageDraw.Draw(bg)

# Reel background color estimate
bg_color = (6, 5, 27, 255)

centers = [
    (495, 215),  # Col 3, Row 2 (adjusted slightly up)
    (640, 420),  # Col 4, Row 4
    (785, 420)   # Col 5, Row 4
]

for cx, cy in centers:
    # draw a dark blue rectangle to hide the old symbol
    draw.rectangle([cx - size//2 - 5, cy - size//2 - 5, cx + size//2 + 5, cy + size//2 + 5], fill=bg_color)
    bg.paste(logo, (cx - size//2, cy - size//2), logo)

out_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/reels_modificate.png'
bg.save(out_path)
print("Saved to " + out_path)
