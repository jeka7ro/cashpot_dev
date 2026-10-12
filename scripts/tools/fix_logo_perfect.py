from PIL import Image, ImageDraw, ImageFilter

bg_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/media__1779354160085.jpg'
bg = Image.open(bg_path).convert("RGBA")

logo_path = '/Users/eugeniucazmal/Downloads/dev_office/cashpot_online_new/app/public/logoMobile.webp'
logo = Image.open(logo_path).convert("RGBA")
# Resize logo to 120x120
logo = logo.resize((120, 120), Image.Resampling.LANCZOS)

centers = [
    (495, 219),
    (639, 430),
    (786, 430)
]

# Base dark blue color of the reels
bg_color = (8, 6, 25, 255)

for cx, cy in centers:
    # 1. Create a soft radial/elliptical dark background to hide the old symbol
    # The old symbol is roughly 130x100.
    # We create a new image for the shadow/cover
    cover = Image.new('RGBA', (150, 130), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(cover)
    # Draw an ellipse that covers the old text
    cdraw.ellipse([10, 10, 140, 120], fill=bg_color)
    
    # Blur it to make it soft and blend
    cover = cover.filter(ImageFilter.GaussianBlur(10))
    
    # Paste the soft cover
    bg.paste(cover, (cx - 75, cy - 65), mask=cover)
    
    # 2. Paste the logo perfectly centered
    bg.paste(logo, (cx - 60, cy - 60), mask=logo)

out_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/reels_modificate_v3.png'
bg.save(out_path)
print("Saved to " + out_path)
