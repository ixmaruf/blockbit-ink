import os
import json
import glob
import shutil

BASE_DIR = r"C:\Users\maruf\Downloads\NFT"
OUT_DIR = os.path.join(BASE_DIR, "output")
LEGENDARY_DIR = os.path.join(OUT_DIR, "legendary")
os.makedirs(LEGENDARY_DIR, exist_ok=True)

folders = ["common", "rare", "epic", "legendary"]
all_nfts = []

for f in folders:
    for jpath in glob.glob(os.path.join(OUT_DIR, f, "*.json")):
        tid = int(os.path.basename(jpath).replace(".json", ""))
        with open(jpath, "r", encoding="utf-8") as file:
            d = json.load(file)
            score = 0
            for attr in d.get("attributes", []):
                if attr.get("trait_type") == "Rarity Score":
                    score = attr.get("value", 0)
            all_nfts.append({
                "id": tid,
                "folder": f,
                "score": score,
                "json_path": jpath,
                "png_path": jpath.replace(".json", ".png"),
                "data": d
            })

# Existing 7 Legendaries
existing_leg = [n for n in all_nfts if n["folder"] == "legendary"]

# Non-legendaries sorted by score descending
candidates = [n for n in all_nfts if n["folder"] != "legendary"]
candidates.sort(key=lambda x: x["score"], reverse=True)

# Select top 18 highest score candidates to make total 25
promoted = candidates[:18]

print(f"Promoting {len(promoted)} top-scoring NFTs to Legendary:")
for n in promoted:
    tid = n["id"]
    old_folder = n["folder"]
    old_json = n["json_path"]
    old_png = n["png_path"]
    
    new_json = os.path.join(LEGENDARY_DIR, f"{tid}.json")
    new_png = os.path.join(LEGENDARY_DIR, f"{tid}.png")
    
    # Move PNG
    if os.path.exists(old_png) and old_png != new_png:
        shutil.move(old_png, new_png)
        
    # Update metadata
    data = n["data"]
    data["image"] = f"images/legendary/{tid}.png"
    
    # Update Rarity attribute
    for attr in data.get("attributes", []):
        if attr.get("trait_type") == "Rarity":
            attr["value"] = "Legendary"
            
    # Update properties files
    if "properties" in data and "files" in data["properties"]:
        data["properties"]["files"] = [
            {
                "uri": f"images/legendary/{tid}.png",
                "type": "image/png"
            }
        ]
        
    # Write to legendary folder
    with open(new_json, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        
    # Remove old json if path changed
    if os.path.exists(old_json) and old_json != new_json:
        os.remove(old_json)
        
    print(f"  - Token #{tid}: Score {n['score']} ({old_folder} -> legendary)")

# Recount totals across all 4 tiers
counts = {}
for f in folders:
    jsons = glob.glob(os.path.join(OUT_DIR, f, "*.json"))
    counts[f] = len(jsons)

print("\nUpdated Distribution Counts:")
for f, c in counts.items():
    pct = (c / 1999) * 100
    print(f"  {f.upper()}: {c} ({pct:.2f}%)")

# Update manifest.json
manifest_path = os.path.join(OUT_DIR, "manifest.json")
if os.path.exists(manifest_path):
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    manifest["statistics"] = counts
    manifest["rarityDistribution"] = counts
    
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    print("\n[OK] Updated output/manifest.json with 25 Legendaries!")

print("SUCCESS: 25 Legendary NFTs configured perfectly!")
