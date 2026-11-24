#!/usr/bin/env node
/**
 * Generate a static ordered-Bayer dithered Pacific Northwest wallpaper:
 * misty forest-green sky, Mount Rainier mass, pine silhouettes.
 *
 * Outputs:
 *   public/images/site/wallpaper.webp       (3840×2160)
 *   public/images/site/wallpaper-1920.webp  (1920×1080)
 *
 * Usage: node scripts/generate-pnw-wallpaper.mjs
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'images', 'site')

/** Forest tone ladder (dark → mist highlight), matching site tokens. */
const PALETTE = [
  [6, 16, 11], // --deep-forest
  [14, 36, 24], // shadow pine
  [28, 62, 42], // mid canopy
  [52, 98, 68], // moss ridge
  [122, 188, 142], // mist / snow catch
]

/** Classic 4×4 Bayer matrix, thresholds in [0, 1). */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16))

const CELL_W = 480
const CELL_H = 270
const SCALE_FULL = 8 // 3840×2160
const SCALE_SMALL = 4 // 1920×1080

function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function noise2(x, y) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  return lerp(lerp(a, b, u), lerp(c, d, u), v)
}

function fbm(x, y, octaves = 4) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * freq, y * freq)
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

/** Rainier-like volcanic cone with glacier shoulders. */
function mountainHeight(nx) {
  // Peak slightly right of center
  const peak = 0.58
  const dx = Math.abs(nx - peak)
  // Broad base + sharp summit
  const broad = Math.exp(-((dx * 2.4) ** 2) * 1.8)
  const shoulders = Math.exp(-((dx * 3.6) ** 2) * 0.55) * 0.55
  const ridgeNoise = (fbm(nx * 18, 2.1, 3) - 0.5) * 0.04
  return Math.max(0, broad * 0.42 + shoulders * 0.22 + ridgeNoise)
}

/** Soft snow-cap mask on the upper mountain (Rainier glaciers). */
function snowCap(nx, ny, mTop) {
  if (ny > mTop + 0.12) return 0
  const peak = 0.58
  const dx = Math.abs(nx - peak)
  const heightOnSlope = (mTop + 0.12 - ny) / Math.max(0.08, mTop + 0.12 - (mTop - 0.02))
  const cap = smoothstep(0.28, 0.04, dx) * smoothstep(0.05, 0.95, heightOnSlope)
  const crevasse = fbm(nx * 55, ny * 48, 3)
  return Math.min(1, cap * (0.55 + 0.55 * crevasse))
}

/** Pine silhouette: triangular layers stacked on a trunk. */
function pineMask(px, py, cx, baseY, height, width) {
  const tipY = baseY - height
  if (py < tipY || py > baseY) return 0
  const t = (py - tipY) / height
  // Three canopy tiers
  const tier = Math.min(2, Math.floor(t * 3))
  const tierT = t * 3 - tier
  const halfW = width * (0.18 + tier * 0.28 + tierT * 0.32)
  const dx = Math.abs(px - cx)
  if (dx > halfW) return 0
  // Soft jagged edge
  const edge = 1 - dx / halfW
  const jag = fbm(px * 0.35 + tier * 9, py * 0.5, 2)
  if (edge < 0.08 + jag * 0.1) return edge > 0.02 ? 0.4 : 0
  // Trunk near base
  if (t > 0.88 && dx < width * 0.06) return 1
  return 0.85 + edge * 0.15
}

function samplePines(nx, ny, layer) {
  // layer 0 = midground, 1 = foreground
  const density = layer === 0 ? 14 : 9
  const yBand = layer === 0 ? [0.58, 0.82] : [0.72, 1.05]
  const hScale = layer === 0 ? 0.18 : 0.32
  const wScale = layer === 0 ? 0.035 : 0.055
  const seed = layer * 97

  let cover = 0
  for (let i = 0; i < density; i++) {
    const cx = hash2(i + seed, 1.1) * 1.15 - 0.08
    const baseY = lerp(yBand[0], yBand[1], hash2(i + seed, 2.7))
    const h = hScale * (0.55 + hash2(i + seed, 3.3) * 0.55)
    const w = wScale * (0.7 + hash2(i + seed, 4.1) * 0.7)
    // Skip trees that would sit too high on the mountain face
    if (layer === 0 && baseY < 0.55 + mountainHeight(cx) * 0.35) continue
    cover = Math.max(cover, pineMask(nx, ny, cx, baseY, h, w))
  }
  // Extra dense grove left and right foreground
  if (layer === 1) {
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? hash2(i, 8) * 0.22 : 0.78 + hash2(i, 9) * 0.24
      const baseY = 0.85 + hash2(i, 10) * 0.2
      const h = 0.28 + hash2(i, 11) * 0.2
      const w = 0.05 + hash2(i, 12) * 0.04
      cover = Math.max(cover, pineMask(nx, ny, side, baseY, h, w))
    }
  }
  return cover
}

/**
 * Continuous brightness in [0, 1] before dither.
 * 0 = deepest forest, 1 = mist highlight.
 */
function sceneValue(x, y, w, h) {
  const nx = x / (w - 1)
  const ny = y / (h - 1)

  // Sky wash: slightly brighter toward top-left dawn mist
  const sky = lerp(0.22, 0.48, 1 - ny) + fbm(nx * 3.5, ny * 2.2, 4) * 0.12
  const dawn = Math.exp(-((nx - 0.22) ** 2) / 0.18 - ((ny - 0.12) ** 2) / 0.08) * 0.18
  let v = Math.min(0.62, sky + dawn)

  // Fog bank mid-horizon
  const fog = smoothstep(0.42, 0.55, ny) * smoothstep(0.72, 0.58, ny)
  v = lerp(v, 0.38 + fbm(nx * 2, ny * 6, 3) * 0.08, fog * 0.55)

  // Mountain (Rainier mass — snowy summit over darker flanks)
  const mH = mountainHeight(nx)
  const mTop = 0.58 - mH
  if (ny > mTop - 0.01 && ny < 0.76) {
    const onFace = smoothstep(mTop - 0.015, mTop + 0.025, ny)
    const slopeShade = lerp(0.3, 0.1, smoothstep(mTop, 0.76, ny))
    const faceNoise = fbm(nx * 22, ny * 18, 3) * 0.05
    const snow = snowCap(nx, ny, mTop)
    const mountainTone = lerp(slopeShade + faceNoise, 0.72 + faceNoise * 0.4, snow)
    const fadeBase = ny < 0.7 ? 1 : smoothstep(0.76, 0.68, ny)
    v = lerp(v, mountainTone, onFace * fadeBase)
  }

  // Valley mist between mountain and forest
  const mistY = smoothstep(0.55, 0.64, ny) * smoothstep(0.78, 0.66, ny)
  v = lerp(v, 0.42 + fbm(nx * 3.5, ny * 5, 3) * 0.1, mistY * 0.45)

  // Distant tree line under mountain
  const treelineY = 0.66 + fbm(nx * 12, 0.5, 2) * 0.04
  if (ny > treelineY && ny < treelineY + 0.08) {
    const ridge = fbm(nx * 40, 1.2, 2)
    if (ridge > 0.35) v = Math.min(v, 0.14 + ridge * 0.05)
  }

  // Midground pines
  const mid = samplePines(nx, ny, 0)
  if (mid > 0) v = lerp(v, 0.08 + (1 - mid) * 0.06, Math.min(1, mid * 1.2))

  // Foreground pines (darkest)
  const fore = samplePines(nx, ny, 1)
  if (fore > 0) v = lerp(v, 0.02 + (1 - fore) * 0.04, Math.min(1, fore))

  // Ground strip
  if (ny > 0.92) {
    v = lerp(v, 0.04 + fbm(nx * 8, ny * 4, 2) * 0.03, smoothstep(0.92, 1, ny))
  }

  return Math.min(1, Math.max(0, v))
}

function ditherCell(value, x, y) {
  const threshold = BAYER_4[y % 4][x % 4]
  const levels = PALETTE.length - 1
  const scaled = value * levels
  const base = Math.floor(scaled)
  const frac = scaled - base
  const step = frac > threshold ? 1 : 0
  return Math.min(levels, base + step)
}

function renderCells(w, h) {
  const indices = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const value = sceneValue(x, y, w, h)
      indices[y * w + x] = ditherCell(value, x, y)
    }
  }
  return indices
}

function expandToRgb(indices, cellW, cellH, scale) {
  const w = cellW * scale
  const h = cellH * scale
  const rgb = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    const cy = Math.floor(y / scale)
    for (let x = 0; x < w; x++) {
      const cx = Math.floor(x / scale)
      const tone = PALETTE[indices[cy * cellW + cx]]
      const i = (y * w + x) * 3
      rgb[i] = tone[0]
      rgb[i + 1] = tone[1]
      rgb[i + 2] = tone[2]
    }
  }
  return { rgb, width: w, height: h }
}

async function writeWebp(rgb, width, height, path, quality) {
  await sharp(rgb, { raw: { width, height, channels: 3 } })
    .webp({ quality, effort: 5 })
    .toFile(path)
  console.log(`wrote ${path} (${width}×${height})`)
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  console.log(`composing ${CELL_W}×${CELL_H} dither cells…`)
  const indices = renderCells(CELL_W, CELL_H)

  const full = expandToRgb(indices, CELL_W, CELL_H, SCALE_FULL)
  const small = expandToRgb(indices, CELL_W, CELL_H, SCALE_SMALL)

  await writeWebp(full.rgb, full.width, full.height, join(OUT_DIR, 'wallpaper.webp'), 86)
  await writeWebp(small.rgb, small.width, small.height, join(OUT_DIR, 'wallpaper-1920.webp'), 84)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
