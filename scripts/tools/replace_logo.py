from PIL import Image, ImageDraw

bg_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/media__1779353928420.png'
bg = Image.open(bg_path).convert("RGBA")

logo_path = '/Users/eugeniucazmal/Downloads/dev_office/cashpot_online_new/app/public/logoMobile.webp'
logo = Image.open(logo_path).convert("RGBA")

# Target bounding box for the red 7
# Left side column, under "WILD"
# Based on 1024x594, the popup is black. 
x_start = 240
y_start = 230
size = 140

logo = logo.resize((size, size), Image.Resampling.LANCZOS)

draw = ImageDraw.Draw(bg)
# Draw black box to hide the 7 perfectly
draw.rectangle([x_start-10, y_start-20, x_start+size+10, y_start+size+20], fill=(0,0,0,255))

bg.paste(logo, (x_start, y_start), logo)

out_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/edited_game_screenshot.png'
bg.save(out_path)
print("Saved to " + out_path)
