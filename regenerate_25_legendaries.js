const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const PREVIEW_DIR = path.join(__dirname, 'nft-preview');

// The 25 tokens with the highest authentic Legendary trait rolls:
const LEGENDARY_IDS = [
  1022, 1096, 1692, 1938, 581, 
  494, 1335, 1621, 748, 1005, 
  1644, 1722, 506, 1793, 1105, 
  1533, 459, 700, 1375, 1559, 
  145, 1603, 1573, 1851, 1830
].sort((a, b) => a - b);

console.log('Generating 25 authentic Legendary NFTs:', LEGENDARY_IDS);

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 2200, height: 2200 } });
  const page = await context.newPage();

  await page.goto('http://localhost:8000/?v=legendary_gen', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Setup canvas
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    canvas.id = '_legCanvas';
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    window._legRenderer = new NFTRenderer(canvas);
  });

  const legDir = path.join(OUTPUT_DIR, 'legendary');
  if (!fs.existsSync(legDir)) fs.mkdirSync(legDir, { recursive: true });

  // Clean legendary folder to contain ONLY these 25 tokens
  const existingFiles = fs.readdirSync(legDir);
  for (const file of existingFiles) {
    const tid = parseInt(file.split('.')[0]);
    if (!LEGENDARY_IDS.includes(tid)) {
      // Find where it belongs and move or remove
      const fpath = path.join(legDir, file);
      console.log(`Removing non-legendary ${file} from legendary dir`);
      fs.unlinkSync(fpath);
    }
  }

  for (const tid of LEGENDARY_IDS) {
    const seed = tid * 7919 + 31337;

    const result = await page.evaluate((args) => {
      const { tokenId, seed } = args;
      const rng = seededRandom(seed);
      
      // Determine traits
      const tempTraits = {};
      for (const [category, trait] of Object.entries(TRAITS)) {
        tempTraits[category] = weightedSelect(trait.options, rng);
      }

      // Assign unique background from generated pool
      const bgIndex = (seed % COLLECTION.totalSupply);
      const bgOption = GENERATED_BACKGROUNDS[bgIndex];

      // Use background index to seed color harmony with Legendary palette
      const colorRng = seededRandom(seed * 13 + 7);
      const harmoniousColors = generateHarmoniousColors(bgOption.value, "Legendary", colorRng);

      const traits = {};
      for (const [category, trait] of Object.entries(TRAITS)) {
        if (category === 'hairColor') {
          traits[category] = {
            name: "Harmonized",
            value: harmoniousColors.hairColor,
            rarity: "Legendary",
            weight: 1
          };
        } else if (category === 'outfitColor') {
          traits[category] = {
            name: "Harmonized",
            value: harmoniousColors.outfitColor,
            rarity: "Legendary",
            weight: 1
          };
        } else if (category === 'eyeColor') {
          traits[category] = {
            name: "Harmonized",
            value: harmoniousColors.eyeColor,
            rarity: "Legendary",
            weight: 1
          };
        } else if (category === 'background') {
          traits[category] = bgOption;
        } else {
          traits[category] = tempTraits[category];
        }
      }

      traits.skin = {
        name: "Harmonized",
        value: harmoniousColors.skinColor,
        rarity: "Legendary",
        weight: 1
      };

      const colorData = {
        bgHex: bgOption.value,
        bgHsl: hexToHsl(bgOption.value),
        hairHex: harmoniousColors.hairColor,
        hairHsl: hexToHsl(harmoniousColors.hairColor),
        skinHex: harmoniousColors.skinColor,
        outfitHex: harmoniousColors.outfitColor,
        eyeHex: harmoniousColors.eyeColor,
        contrastRatio: contrastRatio(harmoniousColors.hairColor, bgOption.value)
      };

      // Calculate score
      const score = Object.values(traits).reduce((sum, t) => sum + (1 / (t.weight / 100)), 0);

      const nftData = {
        traits,
        rarity: RARITY.LEGENDARY,
        rarityScore: Math.round(score * 100) / 100,
        seed,
        colorData
      };

      // Render on canvas with full Legendary visual multipliers
      window._legRenderer.clear();
      window._legRenderer.render(nftData);

      const canvas = document.getElementById('_legCanvas');
      const imageData = canvas.toDataURL('image/png');

      const metadata = generateMetadata(tokenId, nftData);
      metadata.image = `images/legendary/${tokenId}.png`;
      metadata.properties.files = [
        {
          uri: `images/legendary/${tokenId}.png`,
          type: "image/png"
        }
      ];

      return {
        imageData,
        metadata
      };
    }, { tokenId: tid, seed });

    // Save PNG
    const base64Data = result.imageData.replace(/^data:image\/png;base64,/, '');
    const pngPath = path.join(legDir, `${tid}.png`);
    fs.writeFileSync(pngPath, base64Data, 'base64');

    // Save JSON
    const jsonPath = path.join(legDir, `${tid}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result.metadata, null, 2));

    console.log(`[OK] Generated Legendary Dude #${tid} (PNG + JSON)`);
  }

  await browser.close();
  console.log('Finished generating all 25 Legendary NFTs with authentic designs!');
}

main().catch(console.error);
