from PIL import Image, ImageDraw, ImageFilter
import numpy as np

def clean_extract_floodfill(img_path):
    img = Image.open(img_path).convert('RGBA')
    w, h = img.size
    arr = np.array(img)
    
    # Corner sampling
    corners = [
        arr[5, 5, :3].astype(float),
        arr[5, w-5, :3].astype(float),
        arr[h-5, 5, :3].astype(float),
        arr[h-5, w-5, :3].astype(float),
        arr[30, 30, :3].astype(float)
    ]
    
    # Calculate min distance to any corner background color
    min_diff = np.full((h, w), 9999.0)
    for c in corners:
        diff = np.sqrt(np.sum((arr[:, :, :3].astype(float) - c) ** 2, axis=2))
        min_diff = np.minimum(min_diff, diff)
    
    # Background threshold
    mask = (min_diff > 45).astype(np.uint8) * 255
    
    # Clean borders (15px outer border)
    mask[:15, :] = 0
    mask[-15:, :] = 0
    mask[:, :15] = 0
    mask[:, -15:] = 0
    
    # Smooth edges
    mask_img = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(1))
    
    char_rgba = arr.copy()
    char_rgba[:, :, 3] = np.array(mask_img)
    
    out = Image.fromarray(char_rgba)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    return out

ref_files = [
    ('c1_visor', 'video-storyboard/ref-char-1-visor.png'),
    ('c2_gold', 'video-storyboard/ref-char-2-tophat-gold.png'),
    ('c3_beanie', 'video-storyboard/ref-char-3-beanie-gapteeth.png'),
    ('c4_halo', 'video-storyboard/ref-char-4-halo-headband.png'),
    ('c5_suit', 'video-storyboard/ref-char-5-suit-tie.png')
]

for name, path in ref_files:
    cut = clean_extract_floodfill(path)
    cut.save(f'video-storyboard/{name}_perfect.png')
    print(f"Saved {name}_perfect.png size: {cut.size}")
