const fs = require('fs');

// Create OG image for social media
const ogImageContent = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="300" font-family="serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">
    Grand Palace Hotel
  </text>
  <text x="600" y="360" font-family="sans-serif" font-size="36" text-anchor="middle" fill="white" opacity="0.9">
    Luxury 5-Star Accommodation
  </text>
  <text x="600" y="420" font-family="sans-serif" font-size="24" text-anchor="middle" fill="white" opacity="0.8">
    Experience unparalleled luxury in the heart of the city
  </text>
</svg>`;

// Create favicon
const faviconContent = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#f59e0b"/>
  <text x="16" y="22" font-family="serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">GP</text>
</svg>`;

// Create browserconfig.xml
const browserconfigContent = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/mstile-150x150.png"/>
            <TileColor>#f59e0b</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;

async function createMissingAssets() {
  try {
    // Ensure public directory exists
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public', { recursive: true });
    }

    // Write files
    fs.writeFileSync('public/og-image.svg', ogImageContent);
    fs.writeFileSync('public/favicon.svg', faviconContent);
    fs.writeFileSync('public/browserconfig.xml', browserconfigContent);

    console.log('✅ Created missing assets:');
    console.log('  - public/og-image.svg');
    console.log('  - public/favicon.svg');
    console.log('  - public/browserconfig.xml');
  } catch (error) {
    console.error('❌ Error creating assets:', error);
    throw error;
  }
}

createMissingAssets().catch(console.error);