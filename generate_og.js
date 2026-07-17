const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Paths relative to this script directory
const mainImagesDir = path.join(__dirname, '../../main/public/images');
const culinaryPath = path.join(mainImagesDir, 'culinary_experience.png');
const fallbackPath = path.join(mainImagesDir, 'warung_kaki_lima.png');

let imagePath = culinaryPath;
if (!fs.existsSync(imagePath)) {
  imagePath = fallbackPath;
}

if (!fs.existsSync(imagePath)) {
  console.error('Error: Source illustrations not found in main/public/images/');
  process.exit(1);
}

console.log(`Using illustration from: ${imagePath}`);

// Encode illustration to base64
const imageBase64 = fs.readFileSync(imagePath).toString('base64');

// Determine PNG mime type
const mimeType = 'image/png';

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient (Dark Slate & Warm Tone Theme) -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c0a09" />
      <stop offset="100%" stop-color="#1c1917" />
    </linearGradient>

    <!-- Fade Gradient (for blending image seamlessly from solid to transparent) -->
    <linearGradient id="fade-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0c0a09" stop-opacity="1" />
      <stop offset="30%" stop-color="#0c0a09" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0c0a09" stop-opacity="0" />
    </linearGradient>

    <!-- Primary Orange Gradient for Logo & Accents -->
    <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>

    <!-- Glow/Shadow Effect -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#f97316" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-grad)" />

  <!-- Illustration on Right -->
  <g transform="translate(580, 0)">
    <!-- Image -->
    <image width="620" height="630" href="data:${mimeType};base64,${imageBase64}" preserveAspectRatio="xMidYMid slice" />
    <!-- Gradient Fade Overlay to blend left edge -->
    <rect x="-1" y="0" width="280" height="630" fill="url(#fade-grad)" />
    <!-- Overall dark tint overlay to ensure text contrast and premium integration -->
    <rect width="620" height="630" fill="#0c0a09" opacity="0.12" />
  </g>

  <!-- Decorative Abstract Shapes on the left -->
  <circle cx="80" cy="80" r="300" fill="#f97316" opacity="0.04" />
  <circle cx="480" cy="550" r="220" fill="#ea580c" opacity="0.03" />

  <!-- =============================== -->
  <!-- KONTEN TEKS & BRANDING (KIRI)   -->
  <!-- =============================== -->

  <!-- Logo Sagansa -->
  <g transform="translate(80, 80)">
    <rect width="56" height="56" rx="14" fill="url(#primary-grad)" filter="url(#glow)" />
    <text x="28" y="39" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">S</text>
    <text x="74" y="39" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff">Sagansa</text>
    <!-- Badge Web Order -->
    <rect x="230" y="8" width="110" height="24" rx="12" fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.4)" stroke-width="1"/>
    <text x="285" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#fdba74" text-anchor="middle">WEB ORDER</text>
  </g>

  <!-- Headline Utama -->
  <text x="80" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="-1.5">
    Pesan Menu Praktis
  </text>
  <text x="80" y="305" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#f97316" letter-spacing="-1.5">
    Langsung dari Meja
  </text>

  <!-- Sub-headline / Copywriting -->
  <text x="80" y="375" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="500" fill="#d6d3d1">
    Sistem menu digital &amp; pemesanan cepat dari HP pelanggan.
  </text>
  <text x="80" y="415" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#f59e0b">
    Tanpa Antre, Terhubung Langsung ke Dapur &amp; Kasir!
  </text>

  <!-- Fitur Tags / Badges -->
  <g transform="translate(80, 470)">
    <!-- Tag 1: Scan QR -->
    <rect x="0" y="0" width="135" height="42" rx="21" fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.3)" stroke-width="1.5"/>
    <text x="67.5" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#ffedd5" text-anchor="middle">📱 Scan QR</text>
    
    <!-- Tag 2: Menu Digital -->
    <rect x="150" y="0" width="170" height="42" rx="21" fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.3)" stroke-width="1.5"/>
    <text x="235" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#ffedd5" text-anchor="middle">🍔 Menu Digital</text>
    
    <!-- Tag 3: Pesan & Bayar -->
    <rect x="335" y="0" width="180" height="42" rx="21" fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.3)" stroke-width="1.5"/>
    <text x="425" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#ffedd5" text-anchor="middle">⚡ Pesan &amp; Bayar</text>
  </g>

  <!-- URL Website / CTA -->
  <text x="80" y="565" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#78716c" letter-spacing="1.5">
    MENU.SAGANSA.ID
  </text>
</svg>
`;

const outputPath = path.join(__dirname, 'public/og-image.png');

sharp(Buffer.from(svg))
  .png({ palette: true, quality: 85 })
  .toFile(outputPath)
  .then(() => {
    console.log(`OG Image generated successfully at: ${outputPath}`);
  })
  .catch(err => {
    console.error('Error generating OG Image:', err);
    process.exit(1);
  });
