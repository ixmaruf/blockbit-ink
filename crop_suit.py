from PIL import Image
import numpy as np

img = Image.open('video-storyboard/ref-char-5-suit-tie.png').convert('RGBA')
cropped = img.crop((268, 8, 752, 948))
arr = np.array(cropped)

# Remove background outside character
# Background is teal: g > 80, b > 90, r < 60
r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
is_bg = (g > 60) & (b > 70) & (r < 65) & (g > r + 15)

arr[is_bg, 3] = 0
out = Image.fromarray(arr)
out.save('video-storyboard/c5_suit_perfect.png')
print("Saved perfect c5_suit_perfect.png:", out.size)
