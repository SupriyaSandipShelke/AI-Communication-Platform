// Simple script to create placeholder icons for the PWA
// In production, you should use proper icon generation tools or design custom icons

import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = './client/public';

// Create a simple SVG icon
const createSVGIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <g transform="translate(${size * 0.25}, ${size * 0.25})">
    <circle cx="${size * 0.25}" cy="${size * 0.25}" r="${size * 0.2}" fill="white" opacity="0.9"/>
    <path d="M ${size * 0.15} ${size * 0.25} Q ${size * 0.25} ${size * 0.15}, ${size * 0.35} ${size * 0.25} T ${size * 0.35} ${size * 0.35}" 
          stroke="white" stroke-width="${size * 0.03}" fill="none" opacity="0.9"/>
  </g>
  <text x="50%" y="70%" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="middle">CH</text>
</svg>`;
};

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('🎨 Generating PWA icons...');

// Generate SVG icons for each size
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}.png`;
  const svgFilename = `icon-${size}.svg`;
  const filepath = path.join(publicDir, svgFilename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Created ${svgFilename}`);
});

console.log('\n📝 Note: SVG icons created. For production, convert these to PNG using:');
console.log('   - Online tools like CloudConvert or Convertio');
console.log('   - Command line tools like ImageMagick or Inkscape');
console.log('   - Or design custom icons in Figma/Photoshop');
console.log('\n💡 For now, you can use the SVG files or create simple PNG icons.');

// Create a simple HTML file to help convert SVGs to PNGs
const converterHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Converter</title>
  <style>
    body { font-family: Arial; padding: 20px; background: #f5f5f5; }
    .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; margin-top: 20px; }
    .icon-item { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .icon-item img { width: 100%; height: auto; }
    .icon-item p { margin: 10px 0 0 0; font-size: 14px; color: #666; }
    h1 { color: #333; }
    .instructions { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>🎨 CommHub PWA Icons</h1>
  <div class="instructions">
    <h3>Instructions:</h3>
    <ol>
      <li>Right-click on each icon below</li>
      <li>Select "Save image as..."</li>
      <li>Save as PNG with the corresponding filename (e.g., icon-192.png)</li>
      <li>Place all PNG files in the client/public directory</li>
    </ol>
  </div>
  <div class="icon-grid">
    ${sizes.map(size => `
      <div class="icon-item">
        <img src="icon-${size}.svg" alt="${size}x${size} icon">
        <p>icon-${size}.png<br>${size}x${size}</p>
      </div>
    `).join('')}
  </div>
  <script>
    // Convert SVG to PNG using canvas
    document.querySelectorAll('.icon-item').forEach(item => {
      const img = item.querySelector('img');
      const size = parseInt(img.alt.match(/\\d+/)[0]);
      
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        
        // Add download button
        const btn = document.createElement('button');
        btn.textContent = 'Download PNG';
        btn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;';
        btn.onclick = () => {
          canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`icon-\${size}.png\`;
            a.click();
            URL.revokeObjectURL(url);
          });
        };
        item.appendChild(btn);
      };
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'icon-converter.html'), converterHTML);
console.log('\n✅ Created icon-converter.html');
console.log('📂 Open client/public/icon-converter.html in your browser to download PNG icons');

console.log('\n✨ Icon generation complete!');
