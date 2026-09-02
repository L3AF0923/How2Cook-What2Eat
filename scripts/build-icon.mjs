import { promises as fs } from 'node:fs'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const svg = await fs.readFile('build/icon.svg')
await fs.mkdir('public/icons', { recursive: true })
await sharp(svg).resize(512, 512).png().toFile('build/icon.png')
await sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png')
await sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png')
const sizes = [256, 128, 64, 48, 32, 16]
const layers = []
for (const size of sizes) {
  const file = `build/icon-${size}.png`
  await sharp(svg).resize(size, size).png().toFile(file)
  layers.push(file)
}
const ico = await pngToIco(layers)
await fs.writeFile('build/icon.ico', ico)
console.log('Generated desktop and PWA icons')
