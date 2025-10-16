const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImage = path.join(__dirname, '../public/amity-coding-club-logo.png');
const publicDir = path.join(__dirname, '../public');

// Icon sizes to generate
const iconSizes = [
  { name: 'icon-192.png', size: 192, radius: 42 },      // ~22% radius for rounded corners
  { name: 'icon-512.png', size: 512, radius: 112 },     // ~22% radius for rounded corners
  { name: 'apple-icon-180.png', size: 180, radius: 40 }, // Apple recommended
  { name: 'favicon.ico', size: 32, radius: 7 },         // Small favicon
];

// Maskable icons (with safe zone padding)
const maskableIconSizes = [
  { name: 'icon-maskable-192.png', size: 192, innerSize: 154, radius: 0 }, // 80% safe zone
  { name: 'icon-maskable-512.png', size: 512, innerSize: 410, radius: 0 }, // 80% safe zone
];

async function generateIcons() {
  try {
    // Check if sharp is installed
    console.log('📦 Checking dependencies...');
    
    // Generate regular icons with rounded corners
    console.log('\n🎨 Generating app icons...');
    for (const icon of iconSizes) {
      const { name, size, radius } = icon;
      
      // Create a rounded rectangle mask
      const roundedCorners = Buffer.from(
        `<svg width="${size}" height="${size}">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
        </svg>`
      );

      await sharp(inputImage)
        .resize(size, size, { 
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .composite([
          {
            input: roundedCorners,
            blend: 'dest-in'
          }
        ])
        .png()
        .toFile(path.join(publicDir, name));
      
      console.log(`  ✅ Generated ${name}`);
    }

    // Generate maskable icons (for Android adaptive icons)
    console.log('\n🎭 Generating maskable icons...');
    for (const icon of maskableIconSizes) {
      const { name, size, innerSize } = icon;
      const padding = (size - innerSize) / 2;

      // Create canvas with the logo centered
      await sharp(inputImage)
        .resize(innerSize, innerSize, { 
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 } // Match theme color
        })
        .extend({
          top: Math.floor(padding),
          bottom: Math.ceil(padding),
          left: Math.floor(padding),
          right: Math.ceil(padding),
          background: { r: 15, g: 23, b: 42, alpha: 1 } // Match theme color
        })
        .png()
        .toFile(path.join(publicDir, name));
      
      console.log(`  ✅ Generated ${name}`);
    }

    console.log('\n✨ All icons generated successfully!');
    console.log('\n📝 Generated files:');
    [...iconSizes, ...maskableIconSizes].forEach(icon => {
      console.log(`   - ${icon.name}`);
    });

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('sharp')) {
      console.error('\n❌ Error: sharp module not found');
      console.log('\n💡 Please install sharp by running:');
      console.log('   npm install sharp --save-dev');
      console.log('   or');
      console.log('   pnpm add -D sharp');
    } else {
      console.error('\n❌ Error generating icons:', error.message);
    }
    process.exit(1);
  }
}

generateIcons();
