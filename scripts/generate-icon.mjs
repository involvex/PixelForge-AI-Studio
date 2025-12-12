import sharp from "sharp";

const size = 512;

// Create a simple but distinctive icon
// Dark slate background with a pixelated "P" and hammer design
const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#818cf8"/>
      <stop offset="100%" style="stop-color:#6366f1"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="64" fill="url(#bg)"/>
  
  <!-- Pixel grid pattern (subtle) -->
  <g opacity="0.1">
    ${Array.from({ length: 16 }, (_, i) =>
      Array.from({ length: 16 }, (_, j) =>
        (i + j) % 2 === 0
          ? `<rect x="${i * 32}" y="${j * 32}" width="32" height="32" fill="#334155"/>`
          : "",
      ).join(""),
    ).join("")}
  </g>
  
  <!-- Main "P" letter (pixelated style) -->
  <g filter="url(#glow)">
    <!-- Vertical bar of P -->
    <rect x="128" y="96" width="64" height="320" rx="8" fill="url(#accent)"/>
    
    <!-- Top curve of P -->
    <rect x="192" y="96" width="128" height="64" rx="8" fill="url(#accent)"/>
    <rect x="256" y="160" width="64" height="64" rx="8" fill="url(#accent)"/>
    <rect x="192" y="224" width="128" height="64" rx="8" fill="url(#accent)"/>
  </g>
  
  <!-- Hammer overlay (forge theme) -->
  <g transform="translate(280, 280) rotate(-45)" filter="url(#glow)">
    <rect x="0" y="0" width="96" height="48" rx="8" fill="#f59e0b"/>
    <rect x="32" y="48" width="32" height="80" rx="4" fill="#78350f"/>
  </g>
  
  <!-- Spark effects -->
  <circle cx="380" cy="340" r="6" fill="#fbbf24" opacity="0.9"/>
  <circle cx="350" cy="360" r="4" fill="#fbbf24" opacity="0.7"/>
  <circle cx="400" cy="320" r="5" fill="#fbbf24" opacity="0.8"/>
</svg>
`;

sharp(Buffer.from(svg))
  .resize(size, size)
  .png()
  .toFile("./build/icon-source.png")
  .then(() => console.log("Icon source created: ./build/icon-source.png"))
  .catch(err => console.error("Error:", err));
