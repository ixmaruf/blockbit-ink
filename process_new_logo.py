import os
from PIL import Image

src_path = r"C:\Users\maruf\Downloads\NFT\photo_2026-08-29_21-23-51.jpg"
out_dir = r"C:\Users\maruf\Downloads\NFT"

img = Image.open(src_path).convert("RGBA")
print(f"Original image format: {img.format}, size: {img.size}, mode: {img.mode}")

# 1. logo.webp (512x512)
logo_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
logo_512.save(os.path.join(out_dir, "logo.webp"), "WEBP", quality=90, method=6)
print(f"Generated logo.webp: {os.path.getsize(os.path.join(out_dir, 'logo.webp'))} bytes")

# 2. favicon.webp (64x64)
fav_64 = img.resize((64, 64), Image.Resampling.LANCZOS)
fav_64.save(os.path.join(out_dir, "favicon.webp"), "WEBP", quality=90, method=6)
print(f"Generated favicon.webp: {os.path.getsize(os.path.join(out_dir, 'favicon.webp'))} bytes")

# 3. favicon-32.webp (32x32)
fav_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
fav_32.save(os.path.join(out_dir, "favicon-32.webp"), "WEBP", quality=90, method=6)
print(f"Generated favicon-32.webp: {os.path.getsize(os.path.join(out_dir, 'favicon-32.webp'))} bytes")

# 4. favicon.ico (16, 32, 48, 64)
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
img.save(os.path.join(out_dir, "favicon.ico"), format="ICO", sizes=ico_sizes)
print(f"Generated favicon.ico: {os.path.getsize(os.path.join(out_dir, 'favicon.ico'))} bytes")

# 5. favicon.png (64x64)
fav_64.save(os.path.join(out_dir, "favicon.png"), "PNG", optimize=True)
print(f"Generated favicon.png: {os.path.getsize(os.path.join(out_dir, 'favicon.png'))} bytes")

# 6. apple-touch-icon.png (180x180)
touch_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
touch_180.save(os.path.join(out_dir, "apple-touch-icon.png"), "PNG", optimize=True)
print(f"Generated apple-touch-icon.png: {os.path.getsize(os.path.join(out_dir, 'apple-touch-icon.png'))} bytes")

# Also copy to whitelist folder if present
wl_dir = os.path.join(out_dir, "whitelist")
if os.path.isdir(wl_dir):
    logo_512.save(os.path.join(wl_dir, "logo.webp"), "WEBP", quality=90, method=6)
    fav_64.save(os.path.join(wl_dir, "favicon.webp"), "WEBP", quality=90, method=6)
    fav_64.save(os.path.join(wl_dir, "favicon.png"), "PNG", optimize=True)
    img.save(os.path.join(wl_dir, "favicon.ico"), format="ICO", sizes=ico_sizes)
    print("Copied assets to whitelist/ subdirectory")
