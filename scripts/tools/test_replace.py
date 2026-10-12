from PIL import Image, ImageDraw

bg_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/media__1779354160085.jpg'
bg = Image.open(bg_path).convert("RGBA")

draw = ImageDraw.Draw(bg)

# centers:
centers = [
    (495, 230),  # Col 3, Row 2
    (645, 430),  # Col 4, Row 4
    (790, 430)   # Col 5, Row 4
]

size = 110

for cx, cy in centers:
    draw.rectangle([cx - size//2, cy - size//2, cx + size//2, cy + size//2], outline="red", width=3)

out_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/test_boxes.png'
bg.save(out_path)
print("Saved to " + out_path)
