from PIL import Image

bg_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/media__1779354160085.jpg'
bg = Image.open(bg_path).convert("RGBA")

logo_path = '/Users/eugeniucazmal/Downloads/dev_office/cashpot_online_new/app/public/logoMobile.webp'
logo = Image.open(logo_path).convert("RGBA")
# Make the logo a bit wider to cover well, but keep aspect ratio
size = 110
logo = logo.resize((size, size), Image.Resampling.LANCZOS)

# The symbols to hide are wide! Let's say 160 width, 120 height
hide_w = 150
hide_h = 100

centers = [
    (495, 215),  # Col 3
    (640, 420),  # Col 4
    (785, 420)   # Col 5
]

for cx, cy in centers:
    # We need to erase a box of size hide_w x hide_h at (cx, cy)
    # Let's grab a patch of clean background just ABOVE the symbol in the same column
    # For col 3, row 2, the clean background is between row 1 and row 2.
    # Let's take a thin strip of background and stretch it to fill the hole
    patch_x = cx - hide_w // 2
    patch_y = cy - hide_h // 2 - 40 # 40 pixels above the hole
    
    # Grab a 150x20 patch of clean background
    patch = bg.crop((patch_x, patch_y, patch_x + hide_w, patch_y + 20))
    # Resize it to cover the whole hole (this stretches the gradient, matching the column perfectly)
    patch_stretched = patch.resize((hide_w, hide_h), Image.Resampling.BICUBIC)
    
    # Paste stretched background to erase the old symbol seamlessly
    bg.paste(patch_stretched, (cx - hide_w//2, cy - hide_h//2))
    
    # Now paste the logo exactly on top
    # We use the logo itself as the mask to preserve transparency
    bg.paste(logo, (cx - size//2, cy - size//2), mask=logo)

out_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/reels_modificate_v2.png'
bg.save(out_path)
print("Saved to " + out_path)
