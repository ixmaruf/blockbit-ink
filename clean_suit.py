from PIL import Image, ImageDraw, ImageFilter
import numpy as np

img = Image.open('video-storyboard/ref-char-5-suit-tie.png').convert('RGBA')
arr = np.array(img)
h, w, _ = arr.shape

# The character is centered in the canvas:
# Head: x ~ 280 to 740, y ~ 20 to 920
# Let's detect teal background: green > red + 15 and blue > red + 10
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
is_teal_bg = (g > (r.astype(int) + 10)) & (b > (r.astype(int) + 10))

mask = np.ones((h, w), dtype=np.uint8) * 255
mask[is_teal_bg] = 0

# Clean border
mask[:15, :] = 0
mask[-15:, :] = 0
mask[:, :15] = 0
mask[:, -15:] = 0

char_rgba = arr.copy()
char_rgba[:, :, 3] = mask

out = Image.fromarray(char_rgba)
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)
out.save('video-storyboard/c5_suit_perfect.png')
print("c5_suit_perfect.png cleaned successfully, bbox size:", out.size)
