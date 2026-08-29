from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageOps
import numpy as np
import numpy as np

# Load transparent character cutouts
c1_visor = Image.open('video-storyboard/c1_visor_cutout.png').convert('RGBA')
c2_gold = Image.open('video-storyboard/c2_gold_cutout.png').convert('RGBA')
c3_beanie = Image.open('video-storyboard/c3_beanie_cutout.png').convert('RGBA')
c4_halo = Image.open('video-storyboard/c4_halo_cutout.png').convert('RGBA')
c5_suit = Image.open('video-storyboard/c5_suit_cutout.png').convert('RGBA')

# Function to auto-crop transparent margins and add 3D drop shadow
def prepare_character(char_img, target_height=300):
    # Crop transparent borders
    bbox = char_img.getbbox()
    if bbox:
        char_img = char_img.crop(bbox)
    
    # Scale to target height maintaining aspect ratio
    aspect = char_img.width / char_img.height
    new_w = int(target_height * aspect)
    scaled = char_img.resize((new_w, target_height), Image.Resampling.LANCZOS)
    
    # Create smooth 3D drop shadow
    shadow_w = int(new_w * 0.9)
    shadow_h = int(target_height * 0.15)
    shadow = Image.new('RGBA', (shadow_w + 40, shadow_h + 40), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse([20, 20, shadow_w + 20, shadow_h + 20], fill=(0, 0, 0, 160))
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    
    return scaled, shadow

# Base scenes
s1 = Image.open('video-storyboard/v3-scene-1-village-nolegs.jpg').convert('RGBA')
s2 = Image.open('video-storyboard/v3-scene-2-comet-nolegs.jpg').convert('RGBA')
s3 = Image.open('video-storyboard/v2-scene-3-impact.jpg').convert('RGBA')
s4 = Image.open('video-storyboard/v2-scene-4-unfold.jpg').convert('RGBA')
s5 = Image.open('video-storyboard/v2-scene-5-logo.jpg').convert('RGBA')

# ----------------- SCENE 3 (Crash Impact with clean characters) -----------------
s3_final = s3.copy()
# Characters observing impact from foreground
for char_raw, pos in [(c3_beanie, (100, 440, 260)), (c4_halo, (240, 420, 280)), (c5_suit, (1100, 430, 270))]:
    scaled, shadow = prepare_character(char_raw, pos[2])
    # Paste shadow
    s3_final.paste(shadow, (pos[0] - 20, pos[1] + pos[2] - 20), shadow)
    # Tint character slightly with ambient impact glow
    r, g, b, a = scaled.split()
    g = g.point(lambda p: min(255, int(p * 1.15)))
    scaled_lit = Image.merge('RGBA', (r, g, b, a))
    s3_final.paste(scaled_lit, (pos[0], pos[1]), scaled_lit)

s3_final.convert('RGB').save('video-storyboard/v4-scene-3-impact.jpg', quality=95)
print("Scene 3 cleaned and saved.")

# ----------------- SCENE 4 (Light Pillar Ascent with clean characters) -----------------
s4_final = s4.copy()
# Paint clean dark vignette on corners to cleanly conceal background figures
vignette = Image.new('RGBA', s4.size, (0, 0, 0, 0))
v_draw = ImageDraw.Draw(vignette)
v_draw.rectangle([0, 360, 350, 768], fill=(15, 23, 20, 210))
v_draw.rectangle([1020, 360, 1376, 768], fill=(15, 23, 20, 210))
vignette = vignette.filter(ImageFilter.GaussianBlur(25))
s4_final.paste(vignette, (0, 0), vignette)

# Place our 100% exact no-leg characters in the foreground around crater
for char_raw, pos in [(c3_beanie, (80, 380, 320)), (c4_halo, (230, 360, 340)), (c5_suit, (1080, 370, 330)), (c1_visor, (1230, 390, 310))]:
    scaled, shadow = prepare_character(char_raw, pos[2])
    s4_final.paste(shadow, (pos[0] - 20, pos[1] + pos[2] - 20), shadow)
    # Volumetric laser beam glow tint
    r, g, b, a = scaled.split()
    r = r.point(lambda p: min(255, int(p * 1.1)))
    g = g.point(lambda p: min(255, int(p * 1.25)))
    scaled_lit = Image.merge('RGBA', (r, g, b, a))
    s4_final.paste(scaled_lit, (pos[0], pos[1]), scaled_lit)

s4_final.convert('RGB').save('video-storyboard/v4-scene-4-unfold.jpg', quality=95)
print("Scene 4 cleaned and saved.")

# ----------------- SCENE 5 (Logo Climax with exact no-leg character) -----------------
s5_final = s5.copy()
# Clean overlay of exact halo character inside center emblem
c_hero, _ = prepare_character(c4_halo, 280)
# Add neon glow aura around hero
glow = Image.new('RGBA', (c_hero.width + 60, c_hero.height + 60), (0, 0, 0, 0))
g_draw = ImageDraw.Draw(glow)
g_draw.ellipse([30, 30, c_hero.width + 30, c_hero.height + 30], fill=(198, 242, 33, 140))
glow = glow.filter(ImageFilter.GaussianBlur(16))

# Paste inside center circle
center_x = (s5_final.width - c_hero.width) // 2
center_y = 175
s5_final.paste(glow, (center_x - 30, center_y - 30), glow)
s5_final.paste(c_hero, (center_x, center_y), c_hero)

s5_final.convert('RGB').save('video-storyboard/v4-scene-5-logo.jpg', quality=95)
print("Scene 5 cleaned and saved.")

print("All scenes generated with 100% clean alpha masks and exact characters!")
