from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageOps
import numpy as np

# Load all clean character cutouts
c1_visor = Image.open('video-storyboard/c1_visor_perfect.png').convert('RGBA')
c2_gold = Image.open('video-storyboard/c2_gold_perfect.png').convert('RGBA')
c3_beanie = Image.open('video-storyboard/c3_beanie_perfect.png').convert('RGBA')
c4_halo = Image.open('video-storyboard/c4_halo_perfect.png').convert('RGBA')
c5_suit = Image.open('video-storyboard/c5_suit_perfect.png').convert('RGBA')

def scale_and_shadow(char_img, target_h):
    aspect = char_img.width / char_img.height
    target_w = int(target_h * aspect)
    scaled = char_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Soft ambient drop shadow
    shadow_w = int(target_w * 0.95)
    shadow_h = int(target_h * 0.12)
    shadow = Image.new('RGBA', (shadow_w + 30, shadow_h + 30), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.ellipse([15, 15, shadow_w + 15, shadow_h + 15], fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    
    return scaled, shadow

# ----------------- BASE SCENES -----------------
s1 = Image.open('video-storyboard/v3-scene-1-village-nolegs.jpg').convert('RGBA')
s2 = Image.open('video-storyboard/v3-scene-2-comet-nolegs.jpg').convert('RGBA')
s3 = Image.open('video-storyboard/v2-scene-3-impact.jpg').convert('RGBA')
s4 = Image.open('video-storyboard/v2-scene-4-unfold.jpg').convert('RGBA')
s5 = Image.open('video-storyboard/v2-scene-5-logo.jpg').convert('RGBA')

# SCENE 1
s1.convert('RGB').save('video-storyboard/v4-scene-1-meadow.jpg', quality=95)

# SCENE 2
s2.convert('RGB').save('video-storyboard/v4-scene-2-comet.jpg', quality=95)

# SCENE 3 (Impact with characters on left and right observing)
s3_comp = s3.copy()
# Left characters: Beanie & Halo
for char, (x, y, h) in [(c3_beanie, (90, 430, 290)), (c4_halo, (240, 410, 310)), (c5_suit, (1120, 420, 300))]:
    scaled, shadow = scale_and_shadow(char, h)
    s3_comp.paste(shadow, (x - 15, y + h - 18), shadow)
    # Lime tint
    r, g, b, a = scaled.split()
    g = g.point(lambda p: min(255, int(p * 1.15)))
    scaled_lit = Image.merge('RGBA', (r, g, b, a))
    s3_comp.paste(scaled_lit, (x, y), scaled_lit)

s3_comp.convert('RGB').save('video-storyboard/v4-scene-3-impact.jpg', quality=95)

# SCENE 4 (Crater rim gathering with exact characters)
s4_comp = s4.copy()

# Vignette out old background figures
vignette = Image.new('RGBA', s4.size, (0, 0, 0, 0))
v_draw = ImageDraw.Draw(vignette)
v_draw.rectangle([0, 350, 360, 768], fill=(12, 18, 15, 230))
v_draw.rectangle([1000, 350, 1376, 768], fill=(12, 18, 15, 230))
vignette = vignette.filter(ImageFilter.GaussianBlur(30))
s4_comp.paste(vignette, (0, 0), vignette)

# Paste our 4 exact characters around crater rim
char_placements_s4 = [
    (c3_beanie, (80, 370, 340)),
    (c4_halo, (230, 345, 365)),
    (c5_suit, (1060, 360, 350)),
    (c1_visor, (1210, 380, 330))
]

for char, (x, y, h) in char_placements_s4:
    scaled, shadow = scale_and_shadow(char, h)
    s4_comp.paste(shadow, (x - 15, y + h - 18), shadow)
    # Laser lighting glow
    r, g, b, a = scaled.split()
    r = r.point(lambda p: min(255, int(p * 1.08)))
    g = g.point(lambda p: min(255, int(p * 1.25)))
    scaled_lit = Image.merge('RGBA', (r, g, b, a))
    s4_comp.paste(scaled_lit, (x, y), scaled_lit)

s4_comp.convert('RGB').save('video-storyboard/v4-scene-4-unfold.jpg', quality=95)

# SCENE 5 (Emblem with exact halo hero character)
s5_comp = s5.copy()
c_hero, _ = scale_and_shadow(c4_halo, 285)

# Halo energy glow
glow = Image.new('RGBA', (c_hero.width + 70, c_hero.height + 70), (0, 0, 0, 0))
g_draw = ImageDraw.Draw(glow)
g_draw.ellipse([35, 35, c_hero.width + 35, c_hero.height + 35], fill=(198, 242, 33, 150))
glow = glow.filter(ImageFilter.GaussianBlur(18))

cx = (s5_comp.width - c_hero.width) // 2
cy = 170
s5_comp.paste(glow, (cx - 35, cy - 35), glow)
s5_comp.paste(c_hero, (cx, cy), c_hero)

s5_comp.convert('RGB').save('video-storyboard/v4-scene-5-logo.jpg', quality=95)

print("All 5 master scenes successfully assembled!")
