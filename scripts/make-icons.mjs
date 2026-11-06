import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const iconsDir = path.join(rootDir, 'public', 'icons')
const publicDir = path.join(rootDir, 'public')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 1. Favicon SVG (32x32 viewBox, vector favicon)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4338CA" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#tileGrad)" />
  <g transform="translate(4, 4) scale(1)">
    <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" fill="#FFFFFF" />
    <path d="M9 10.5l2 2 4-4" fill="none" stroke="#5EEAD4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M9 16h6" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" />
  </g>
</svg>`

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf-8')
console.log('Created public/favicon.svg')

// Helper to build SVG markup for rendering to PNG
function createIconSvg({ size, fullBleed = false, safeZoneRatio = 0.65, rxRatio = 0.22 }) {
  const tileSize = fullBleed ? size : Math.round(size * 0.9)
  const pad = fullBleed ? 0 : Math.round((size - tileSize) / 2)
  const rx = fullBleed ? 0 : Math.round(tileSize * rxRatio)

  // Scale 24-unit receipt to fit within safe zone
  const targetIconSize = Math.round(size * safeZoneRatio)
  const scale = targetIconSize / 24
  const iconOffset = Math.round((size - 24 * scale) / 2)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366F1" />
        <stop offset="100%" stop-color="#4338CA" />
      </linearGradient>
    </defs>
    <rect x="${pad}" y="${pad}" width="${tileSize}" height="${tileSize}" rx="${rx}" fill="url(#tileGrad)" />
    <g transform="translate(${iconOffset}, ${iconOffset}) scale(${scale})">
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" fill="#FFFFFF" />
      <path d="M9 10.5l2 2 4-4" fill="none" stroke="#5EEAD4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M9 16h6" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" />
    </g>
  </svg>`
}

async function generatePngs() {
  // 1. icon-192.png (standard app icon)
  const svg192 = createIconSvg({ size: 192, safeZoneRatio: 0.62 })
  await sharp(Buffer.from(svg192))
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'))
  console.log('Created public/icons/icon-192.png')

  // 2. icon-512.png (standard 512 app icon)
  const svg512 = createIconSvg({ size: 512, safeZoneRatio: 0.62 })
  await sharp(Buffer.from(svg512))
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'))
  console.log('Created public/icons/icon-512.png')

  // 3. maskable-512.png (full-bleed background, logo inside central 60% safe zone)
  const svgMaskable = createIconSvg({ size: 512, fullBleed: true, safeZoneRatio: 0.55 })
  await sharp(Buffer.from(svgMaskable))
    .png()
    .toFile(path.join(iconsDir, 'maskable-512.png'))
  console.log('Created public/icons/maskable-512.png')

  // 4. apple-touch-icon-180.png (180x180, full-bleed, no transparency)
  const svgApple = createIconSvg({ size: 180, fullBleed: true, safeZoneRatio: 0.62 })
  await sharp(Buffer.from(svgApple))
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon-180.png'))
  console.log('Created public/icons/apple-touch-icon-180.png')
}

generatePngs()
  .then(() => console.log('\nAll PWA icons generated successfully.'))
  .catch((err) => {
    console.error('Error generating icons:', err)
    process.exit(1)
  })

