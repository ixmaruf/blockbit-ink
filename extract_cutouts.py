import os
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import numpy as np

def extract_nft_character(img_path, tolerance=35):
    img = Image.open(img_path).convert('RGBA')
    arr = np.array(img)
    
    # Border removal (10px border around NFT)
    h, w, _ = arr.shape
    
    # Corner colors to determine background
    bg_color = arr[30, 30, :3].astype(float)
    
    # Calculate color distance to background
    diff = np.sqrt(np.sum((arr[:, :, :3].astype(float) - bg_color) ** 2, axis=2))
    
    # Mask: 255 where diff > tolerance
    mask = (diff > tolerance).astype(np.uint8) * 255
    
    # Clean inner rectangle area
    mask[:20, :] = 0
    mask[-20:, :] = 0
    mask[:, :20] = 0
    mask[:, -20:] = 0
    
    # Apply alpha mask
    char_rgba = arr.copy()
    char_rgba[:, :, 3] = mask
    
    return Image.fromarray(char_rgba)

# Extract all 5 characters
chars = {}
ref_files = [
    ('c1_visor', 'video-storyboard/ref-char-1-visor.png'),
    ('c2_gold', 'video-storyboard/ref-char-2-tophat-gold.png'),
    ('c3_beanie', 'video-storyboard/ref-char-3-beanie-gapteeth.png'),
    ('c4_halo', 'video-storyboard/ref-char-4-halo-headband.png'),
    ('c5_suit', 'video-storyboard/ref-char-5-suit-tie.png')
]

for name, path in ref_files:
    chars[name] = extract_nft_character(path)
    # Save transparent cutouts
    chars[name].save(f'video-storyboard/{name}_cutout.png')
    print(f"Saved {name}_cutout.png")

print("All NFT character cutouts created.")
