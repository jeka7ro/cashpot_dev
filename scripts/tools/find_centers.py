import cv2
import numpy as np
from PIL import Image

bg_path = '/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/media__1779354160085.jpg'
img = cv2.imread(bg_path)

# Crop what I think is the first symbol
# Col 3 is roughly x=420 to 560
# Row 2 is roughly y=170 to 280
template = img[170:270, 430:560]
cv2.imwrite('/Users/eugeniucazmal/.gemini/antigravity/brain/a008c7d9-fec5-4052-a416-4c7bf6a1a7a6/template.png', template)

# Match template
res = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
threshold = 0.8
loc = np.where(res >= threshold)

points = []
for pt in zip(*loc[::-1]):  # pt is (x, y)
    # Filter out duplicates
    if not points or all((abs(pt[0]-p[0]) > 20 or abs(pt[1]-p[1]) > 20) for p in points):
        points.append(pt)

h, w = template.shape[:2]
for pt in points:
    print(f"Found symbol at x={pt[0]}, y={pt[1]}, w={w}, h={h}. Center x={pt[0]+w//2}, y={pt[1]+h//2}")

