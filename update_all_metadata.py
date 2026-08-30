import os
import json
import glob
from PIL import Image

out_dir = r"C:\Users\maruf\Downloads\NFT\output"
preview_dir = r"C:\Users\maruf\Downloads\NFT\nft-preview"
folders = ['common', 'rare', 'epic', 'legendary']

COLLECTION_NAME = "Dudes Craft"
COLLECTION_DESC = "1,999 unique generative 3D voxel warriors on the Robinhood Network. Each one is algorithmically generated and utterly unique."
COLLECTION_URL = "https://dudescraft.store"

updated_count = 0

for folder in folders:
    folder_path = os.path.join(out_dir, folder)
    if not os.path.exists(folder_path):
        continue
    
    json_files = glob.glob(os.path.join(folder_path, "*.json"))
    for jpath in json_files:
        token_id_str = os.path.basename(jpath).replace(".json", "")
        if not token_id_str.isdigit():
            continue
        token_id = int(token_id_str)
        
        with open(jpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        data["name"] = f"{COLLECTION_NAME} #{token_id}"
        data["description"] = COLLECTION_DESC
        data["image"] = f"images/{folder}/{token_id}.png"
        data["external_url"] = COLLECTION_URL
        
        # Standard OpenSea properties
        data["properties"] = {
            "category": "image",
            "files": [
                {
                    "uri": f"images/{folder}/{token_id}.png",
                    "type": "image/png"
                }
            ],
            "creators": [
                {
                    "address": "0x0000000000000000000000000000000000000000",
                    "share": 100
                }
            ]
        }
        
        with open(jpath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        updated_count += 1

print(f"[OK] Successfully updated {updated_count} metadata JSON files across all 4 tiers.")

# Update manifest.json
manifest_path = os.path.join(out_dir, "manifest.json")
if os.path.exists(manifest_path):
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    manifest["name"] = COLLECTION_NAME
    manifest["description"] = "1,999 unique generative 3D voxel warriors on the Robinhood Network."
    manifest["website"] = COLLECTION_URL
    manifest["totalSupply"] = 1999
    manifest["uniqueTokens"] = 1999
    
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    print("[OK] Successfully updated output/manifest.json.")

# Generate showcase WebP preview images for showcase tokens
os.makedirs(preview_dir, exist_ok=True)
showcase_tokens = [
    ('legendary', 459),
    ('legendary', 1105),
    ('legendary', 1375),
    ('legendary', 1533),
    ('epic', 85),
    ('epic', 1311),
    ('epic', 1691),
    ('epic', 1996),
    ('rare', 1),
    ('rare', 2),
    ('epic', 3),
    ('epic', 4),
    ('epic', 5),
    ('common', 6),
    ('common', 7),
    ('rare', 8),
    ('epic', 9),
    ('rare', 10),
    ('rare', 11),
    ('rare', 12)
]

for tier, tid in showcase_tokens:
    png_src = os.path.join(out_dir, tier, f"{tid}.png")
    webp_dst = os.path.join(preview_dir, f"{tid}.webp")
    if os.path.exists(png_src):
        try:
            im = Image.open(png_src)
            # Resize to crisp 600x600 for web showcase
            im_resized = im.resize((600, 600), Image.Resampling.LANCZOS)
            im_resized.save(webp_dst, "WEBP", quality=88, method=6)
            print(f"Generated preview {webp_dst} ({os.path.getsize(webp_dst)} bytes)")
        except Exception as e:
            print(f"Error generating preview for #{tid}: {e}")

print("SUCCESS: All metadata and preview updates finished cleanly!")
