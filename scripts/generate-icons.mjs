// Generates every PWA/app icon from the two SVG sources in this folder.
// Re-run after editing either SVG — or after a real Kodecoon logo replaces them.
// Run: node scripts/generate-icons.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const standard = await readFile(join(here, 'icon-source.svg'))
const maskable = await readFile(join(here, 'icon-source-maskable.svg'))

const targets = [
  // manifest icons — referenced by app/manifest.ts
  { src: standard, size: 192, out: 'public/icons/icon-192.png' },
  { src: standard, size: 512, out: 'public/icons/icon-512.png' },
  { src: maskable, size: 512, out: 'public/icons/icon-maskable-512.png' },
  // Next.js file conventions — auto-wired into <head>, no import needed
  { src: standard, size: 512, out: 'app/icon.png' },
  { src: standard, size: 180, out: 'app/apple-icon.png' },
]

for (const { src, size, out } of targets) {
  const dest = join(root, out)
  await mkdir(dirname(dest), { recursive: true })
  const buf = await sharp(src, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(dest, buf)
  console.log(`${out.padEnd(34)} ${size}x${size}  ${(buf.length / 1024).toFixed(1)} KB`)
}
