import os
from PIL import Image

# Ensure output directory exists
out_dir = 'video-storyboard/png-scenes'
os.makedirs(out_dir, exist_ok=True)

# 1. Convert and save all 5 story scenes to high-quality PNG
scenes = [
    ('video-storyboard/v4-scene-1-meadow.jpg', os.path.join(out_dir, 'Scene-1-Serene-Meadow.png')),
    ('video-storyboard/v4-scene-2-comet.jpg', os.path.join(out_dir, 'Scene-2-Genesis-Comet-Box.png')),
    ('video-storyboard/v4-scene-3-impact.jpg', os.path.join(out_dir, 'Scene-3-Meadow-Impact-BOOM.png')),
    ('video-storyboard/v4-scene-4-unfold.jpg', os.path.join(out_dir, 'Scene-4-Light-Pillar-Unfold.png')),
    ('video-storyboard/v4-scene-5-logo.jpg', os.path.join(out_dir, 'Scene-5-DudesCraft-Logo-Climax.png')),
]

for src, dst in scenes:
    img = Image.open(src)
    img.save(dst, 'PNG', optimize=True)
    print(f"Saved {dst}")

# 2. Also copy transparent character PNGs into the folder
chars = [
    ('video-storyboard/c1_visor_perfect.png', os.path.join(out_dir, 'Character-1-TopHat-Visor.png')),
    ('video-storyboard/c2_gold_perfect.png', os.path.join(out_dir, 'Character-2-TopHat-GoldCoat.png')),
    ('video-storyboard/c3_beanie_perfect.png', os.path.join(out_dir, 'Character-3-OrangeBeanie-GapTeeth.png')),
    ('video-storyboard/c4_halo_perfect.png', os.path.join(out_dir, 'Character-4-Halo-RedHeadband.png')),
    ('video-storyboard/c5_suit_perfect.png', os.path.join(out_dir, 'Character-5-RedBeanie-SuitTie.png')),
]

for src, dst in chars:
    img = Image.open(src)
    img.save(dst, 'PNG', optimize=True)
    print(f"Saved {dst}")

print("All PNG files generated successfully.")
