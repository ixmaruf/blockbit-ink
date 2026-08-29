from PIL import Image
import numpy as np

img = Image.open('video-storyboard/v3-scene-1-village-nolegs.jpg')
w, h = img.size
print(f"Image dimensions: {w}x{h}")

c1 = img.crop((300, 280, 520, 760))
c2 = img.crop((580, 220, 800, 760))
c3 = img.crop((880, 280, 1120, 760))

c1.save('video-storyboard/crop-c1.png')
c2.save('video-storyboard/crop-c2.png')
c3.save('video-storyboard/crop-c3.png')
print("Cropped sample character previews saved.")
