import { inflateSync } from 'node:zlib'

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft
  const distanceLeft = Math.abs(estimate - left)
  const distanceUp = Math.abs(estimate - up)
  const distanceUpLeft = Math.abs(estimate - upLeft)
  if (distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft) return left
  if (distanceUp <= distanceUpLeft) return up
  return upLeft
}

export function decodePng(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error('Expected a PNG screenshot')
  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idat = []
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`Unsupported PNG ${bitDepth}/${colorType}`)
  }
  const channels = colorType === 6 ? 4 : 3
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const pixels = Buffer.alloc(width * height * 4)
  let source = 0
  let previous = Buffer.alloc(stride)
  for (let y = 0; y < height; y += 1) {
    const filter = raw[source]
    source += 1
    const row = Buffer.from(raw.subarray(source, source + stride))
    source += stride
    for (let index = 0; index < stride; index += 1) {
      const left = index >= channels ? row[index - channels] : 0
      const up = previous[index]
      const upLeft = index >= channels ? previous[index - channels] : 0
      if (filter === 1) row[index] = (row[index] + left) & 255
      else if (filter === 2) row[index] = (row[index] + up) & 255
      else if (filter === 3) row[index] = (row[index] + Math.floor((left + up) / 2)) & 255
      else if (filter === 4) row[index] = (row[index] + paeth(left, up, upLeft)) & 255
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`)
    }
    for (let x = 0; x < width; x += 1) {
      const from = x * channels
      const to = (y * width + x) * 4
      pixels[to] = row[from]
      pixels[to + 1] = row[from + 1]
      pixels[to + 2] = row[from + 2]
      pixels[to + 3] = channels === 4 ? row[from + 3] : 255
    }
    previous = row
  }
  return { width, height, pixels }
}

function channelLuminance(value) {
  const channel = value / 255
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(red, green, blue) {
  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  )
}

export function contrastRatio(foreground, background) {
  const lighter = Math.max(
    relativeLuminance(...foreground),
    relativeLuminance(...background),
  )
  const darker = Math.min(
    relativeLuminance(...foreground),
    relativeLuminance(...background),
  )
  return (lighter + 0.05) / (darker + 0.05)
}

export function parseCssColor(value) {
  const match = value.match(/rgba?\(([^)]+)\)/)
  if (!match) throw new Error(`Cannot parse color ${value}`)
  const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number)
  const [red, green, blue, alpha = 1] = parts
  return [red, green, blue, alpha]
}

function composite(foreground, background) {
  const alpha = foreground[3]
  return [
    Math.round(foreground[0] * alpha + background[0] * (1 - alpha)),
    Math.round(foreground[1] * alpha + background[1] * (1 - alpha)),
    Math.round(foreground[2] * alpha + background[2] * (1 - alpha)),
  ]
}

export function brightestWindow(image, windowWidth, windowHeight) {
  const { width, height, pixels } = image
  const integral = new Float64Array((width + 1) * (height + 1))
  for (let y = 0; y < height; y += 1) {
    let row = 0
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      row += relativeLuminance(pixels[index], pixels[index + 1], pixels[index + 2])
      integral[(y + 1) * (width + 1) + (x + 1)] = integral[y * (width + 1) + (x + 1)] + row
    }
  }
  const sum = (x, y, boxWidth, boxHeight) => {
    const x1 = x
    const y1 = y
    const x2 = x + boxWidth
    const y2 = y + boxHeight
    const stride = width + 1
    return (
      integral[y2 * stride + x2] -
      integral[y1 * stride + x2] -
      integral[y2 * stride + x1] +
      integral[y1 * stride + x1]
    )
  }
  let best = { x: 0, y: 0, luminance: -1 }
  const step = 8
  for (let y = 0; y + windowHeight <= height; y += step) {
    for (let x = 0; x + windowWidth <= width; x += step) {
      const luminance = sum(x, y, windowWidth, windowHeight) / (windowWidth * windowHeight)
      if (luminance > best.luminance) best = { x, y, luminance }
    }
  }
  return best
}

export function worstContrast(image, box, color) {
  const foreground = parseCssColor(color)
  const x0 = Math.max(0, Math.floor(box.x))
  const y0 = Math.max(0, Math.floor(box.y))
  const x1 = Math.min(image.width, Math.ceil(box.x + box.width))
  const y1 = Math.min(image.height, Math.ceil(box.y + box.height))
  let ratio = Infinity
  let background = [0, 0, 0]
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const index = (y * image.width + x) * 4
      const pixel = [image.pixels[index], image.pixels[index + 1], image.pixels[index + 2]]
      const ink = foreground[3] >= 0.999 ? foreground : composite(foreground, pixel)
      const next = contrastRatio(ink, pixel)
      if (next < ratio) {
        ratio = next
        background = pixel
      }
    }
  }
  if (!Number.isFinite(ratio)) throw new Error('Sample box was empty')
  return {
    ratio,
    background,
    foreground: foreground[3] >= 0.999 ? foreground.slice(0, 3) : composite(foreground, background),
  }
}

export function maxChannelDelta(before, after, point, radius) {
  let delta = 0
  const x0 = Math.max(0, Math.floor(point.x - radius))
  const y0 = Math.max(0, Math.floor(point.y - radius))
  const x1 = Math.min(before.width, Math.ceil(point.x + radius))
  const y1 = Math.min(before.height, Math.ceil(point.y + radius))
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const index = (y * before.width + x) * 4
      for (let channel = 0; channel < 3; channel += 1) {
        delta = Math.max(delta, Math.abs(before.pixels[index + channel] - after.pixels[index + channel]))
      }
    }
  }
  return delta
}

async function hideGlass(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.glass-panel, .backdrop-credit').forEach((element) => {
      if (element.id === 'contrast-probe') return
      element.setAttribute('data-contrast-hidden', 'true')
      element.style.setProperty('visibility', 'hidden', 'important')
    })
  })
}

async function showGlass(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-contrast-hidden]').forEach((element) => {
      element.removeAttribute('data-contrast-hidden')
      element.style.removeProperty('visibility')
    })
  })
}

const probeMarkup = {
  card: `
    <p class="post-card-date" data-sample="date"><time>October 22, 2026</time><span>5 min read</span></p>
    <div class="post-card-meta"><span data-sample="badge">Latest dispatch</span></div>
    <ul class="post-card-tags"><li><a data-sample="tag" href="/">Intune</a></li></ul>
    <span class="post-card-cta" data-sample="cta">Read field note</span>
    <p class="eyebrow" data-sample="eyebrow">Posts</p>
    <div class="post-filters__field"><label data-sample="keyword">Keyword</label></div>
  `,
  hero: `
    <p class="hero-signal" data-sample="tagline">Learn. Build. Automate.</p>
    <p class="hero-copy" data-sample="sentence">Practical engineering notes on PowerShell, endpoint management, Microsoft Graph, and building durable automation systems.</p>
  `,
}

export async function measureSurface(page, kind, bright) {
  const className = kind === 'hero'
    ? 'hero-panel glass-panel liquid-glass-surface'
    : 'post-card glass-panel liquid-glass-surface'
  await page.evaluate(({ className: surfaceClass, html, bright: origin }) => {
    document.getElementById('contrast-probe')?.remove()
    const probe = document.createElement('section')
    probe.id = 'contrast-probe'
    probe.className = surfaceClass
    probe.style.position = 'fixed'
    probe.style.left = `${origin.x}px`
    probe.style.top = `${origin.y}px`
    probe.style.width = '500px'
    probe.style.margin = '0'
    probe.style.zIndex = '80'
    probe.style.display = 'grid'
    probe.style.alignContent = 'start'
    probe.style.gap = '6px'
    probe.style.padding = '12px 14px'
    probe.innerHTML = html
    document.body.append(probe)
  }, { className, html: probeMarkup[kind], bright })
  await hideGlass(page)
  const samples = await page.locator('#contrast-probe [data-sample]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return {
        name: node.dataset.sample,
        color: style.color,
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      }
    }),
  )
  await page.locator('#contrast-probe').evaluate((probe) => {
    probe.querySelectorAll('[data-sample], [data-sample] *').forEach((node) => {
      node.style.color = 'transparent'
      node.style.textShadow = 'none'
      node.style.webkitTextStroke = '0'
    })
  })
  const image = decodePng(await page.screenshot({ type: 'png' }))
  await showGlass(page)
  await page.evaluate(() => document.getElementById('contrast-probe')?.remove())
  return samples.map((sample) => {
    const box = sample.box
    const inset = box.width > 8 && box.height > 8
      ? { x: box.x + 2, y: box.y + 2, width: box.width - 4, height: box.height - 4 }
      : box
    return {
      name: sample.name,
      ...worstContrast(image, inset, sample.color),
    }
  })
}

export async function measureBrightestGlass(page) {
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none !important;transition:none !important}',
  })
  await hideGlass(page)
  const backdrop = decodePng(await page.screenshot({ type: 'png' }))
  const bright = brightestWindow(backdrop, 520, 210)
  await showGlass(page)
  const card = await measureSurface(page, 'card', bright)
  const hero = await measureSurface(page, 'hero', bright)
  const scrims = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement)
    return {
      card: Number(style.getPropertyValue('--post-card-glass-scrim')),
      hero: Number(style.getPropertyValue('--hero-glass-scrim')),
      nav: Number(style.getPropertyValue('--topbar-glass-scrim')),
    }
  })
  return { bright, scrims, card, hero }
}
