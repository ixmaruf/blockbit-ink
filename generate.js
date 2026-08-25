/**
 * Blockbit Ink — Batch NFT Generator
 * Generates 1,999 unique NFT images + OpenSea-compatible metadata
 * 
 * Usage: node generate.js
 * Requires: playwright (npm install playwright)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const TOTAL_SUPPLY = 1999;
const OUTPUT_DIR = path.join(__dirname, 'output');
const PAGE_URL = 'http://localhost:3456/?v=generate';
const CANVAS_SIZE = 2000;

// Rarity folder mapping
const RARITY_FOLDERS = {
  'Common': 'common',
  'Rare': 'rare',
  'Epic': 'epic',
  'Legendary': 'legendary'
};

async function main() {
  console.log('🚀 Starting Blockbit Ink NFT Generation...');
  console.log(`📦 Total NFTs: ${TOTAL_SUPPLY}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  // Create output directories
  for (const folder of Object.values(RARITY_FOLDERS)) {
    const dir = path.join(OUTPUT_DIR, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Launch browser
  console.log('🌐 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 2200, height: 2200 }
  });
  const page = await context.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => console.log('  [PAGE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('  [PAGE ERROR]', err.message));
  
  // Navigate to the page
  console.log('📄 Loading page...');
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check if page loaded correctly
  const debugInfo = await page.evaluate(() => {
    return {
      hasGenerateTraits: typeof generateTraits !== 'undefined',
      hasNFTRenderer: typeof NFTRenderer !== 'undefined',
      hasGenerateMetadata: typeof generateMetadata !== 'undefined',
      scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src),
      title: document.title
    };
  });
  console.log('🔍 Debug info:', JSON.stringify(debugInfo));
  
  if (!debugInfo.hasGenerateTraits || !debugInfo.hasNFTRenderer || !debugInfo.hasGenerateMetadata) {
    throw new Error(`Generator functions not found. Traits: ${debugInfo.hasGenerateTraits}, Renderer: ${debugInfo.hasNFTRenderer}, Metadata: ${debugInfo.hasGenerateMetadata}`);
  }
  
  console.log('✅ Page loaded successfully');
  
  // Create hidden canvas for rendering
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    canvas.id = '_genCanvas';
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    window._genRenderer = new NFTRenderer(canvas);
  });
  
  // Track statistics
  const stats = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    errors: []
  };
  
  // Generate each NFT
  const startTime = Date.now();
  
  for (let tokenId = 1; tokenId <= TOTAL_SUPPLY; tokenId++) {
    try {
      // Generate traits and render
      const result = await page.evaluate(async (id) => {
        const seed = id * 7919 + 31337;
        const nftData = generateTraits(seed);
        const metadata = generateMetadata(id, nftData);
        
        // Render to canvas
        window._genRenderer.render(nftData);
        
        // Get image data
        const canvas = document.getElementById('_genCanvas');
        const imageData = canvas.toDataURL('image/png');
        
        return {
          imageData,
          metadata,
          rarity: nftData.rarity.name,
          seed: seed
        };
      }, tokenId);
      
      // Determine output folder
      const rarityLower = result.rarity.toLowerCase();
      const folder = RARITY_FOLDERS[result.rarity] || 'common';
      
      // Save image
      const imageBuffer = Buffer.from(result.imageData.split(',')[1], 'base64');
      const imagePath = path.join(OUTPUT_DIR, folder, `${tokenId}.png`);
      fs.writeFileSync(imagePath, imageBuffer);
      
      // Update metadata image path
      result.metadata.image = `images/${folder}/${tokenId}.png`;
      
      // Save metadata
      const metadataPath = path.join(OUTPUT_DIR, folder, `${tokenId}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(result.metadata, null, 2));
      
      // Update stats
      stats[rarityLower]++;
      
      // Progress update
      if (tokenId % 100 === 0 || tokenId === TOTAL_SUPPLY) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = tokenId / elapsed;
        const eta = (TOTAL_SUPPLY - tokenId) / rate;
        console.log(`✨ Generated ${tokenId}/${TOTAL_SUPPLY} (${Math.round(tokenId/TOTAL_SUPPLY*100)}%) | Rate: ${rate.toFixed(1)}/sec | ETA: ${Math.round(eta)}s`);
      }
      
    } catch (error) {
      console.error(`❌ Error generating NFT #${tokenId}:`, error.message);
      stats.errors.push({ tokenId, error: error.message });
    }
  }
  
  // Close browser
  await browser.close();
  
  // Print final statistics
  const totalTime = (Date.now() - startTime) / 1000;
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Generation Complete!');
  console.log('='.repeat(50));
  console.log(`⏱️  Total time: ${totalTime.toFixed(1)} seconds`);
  console.log(`📊 Statistics:`);
  console.log(`   Common: ${stats.common}`);
  console.log(`   Rare: ${stats.rare}`);
  console.log(`   Epic: ${stats.epic}`);
  console.log(`   Legendary: ${stats.legendary}`);
  console.log(`   Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Failed tokens:');
    stats.errors.forEach(e => console.log(`   #${e.tokenId}: ${e.error}`));
  }
  
  // Save collection manifest
  const manifest = {
    name: "Blockbit Ink",
    description: "1,999 unique generative anime/pixel NFTs",
    totalSupply: TOTAL_SUPPLY,
    generatedAt: new Date().toISOString(),
    statistics: stats,
    rarityDistribution: {
      common: stats.common,
      rare: stats.rare,
      epic: stats.epic,
      legendary: stats.legendary
    }
  };
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('\n📄 Manifest saved to output/manifest.json');
}

// Run the generator
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

