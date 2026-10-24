import { expect, test } from '@playwright/test'
import { decodePng, maxChannelDelta, measureBrightestGlass } from './contrast.mjs'

const minimumContrast = 4.5

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
})

test('subscribe modal stays closed and the inline form remains', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-24T16:00:00Z') })
  await page.goto('/')
  await page.clock.fastForward(20_000)
  await expect(page.locator('dialog, .newsletter-popup')).toHaveCount(0)
  const signup = page.locator('.content-area .newsletter-signup')
  await expect(signup.getByRole('heading', { name: 'Get new field notes' })).toBeVisible()
  const belowTheCards = await signup.evaluate((form) => {
    const card = document.querySelector('.content-area .post-card:last-of-type')
    return Boolean(card && (card.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING))
  })
  expect(belowTheCards).toBe(true)

  await page.goto('/learn-intune-powershell-automation')
  await expect(page.locator('.post-content')).toBeVisible()
  const inline = page.locator('article .newsletter-signup--inline')
  await expect(inline.getByRole('heading', { name: 'Get new field notes' })).toBeVisible()
  const belowTheBody = await inline.evaluate((form) => {
    const body = document.querySelector('.post-content')
    return Boolean(body && (body.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING))
  })
  expect(belowTheBody).toBe(true)
  await expect(page.locator('dialog, .newsletter-popup')).toHaveCount(0)
})

test('card tags do not repeat the category', async ({ page }) => {
  await page.goto('/')
  for (const number of ['33', '34', '35']) {
    const card = page.locator('.post-card').filter({ hasText: `No. ${number}` })
    const labels = (await card.locator('.post-card-tags a').allTextContents()).map((label) => label.trim().toLowerCase())
    expect(labels.filter((label) => label === 'intune')).toEqual(['intune'])
    expect(new Set(labels).size).toBe(labels.length)
  }
})

test('rss is in the nav and the feed uses canonical urls', async ({ page }) => {
  await page.goto('/')
  const rss = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'RSS', exact: true })
  await expect(rss).toBeVisible()
  await expect(rss).toHaveAttribute('href', '/rss.xml')
  await expect(page.locator('head link[rel="alternate"]')).toHaveAttribute('type', 'application/rss+xml')
  await expect(page.locator('head link[rel="alternate"]')).toHaveAttribute('href', '/rss.xml')

  const response = await page.request.get('/rss.xml')
  expect(response.ok()).toBe(true)
  const xml = await response.text()
  const report = await page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, 'application/xml')
    return {
      error: doc.querySelector('parsererror')?.textContent ?? '',
      version: doc.querySelector('rss')?.getAttribute('version') ?? '',
      links: [...doc.querySelectorAll('item > link')].map((node) => node.textContent ?? ''),
    }
  }, xml)
  expect(report.error).toBe('')
  expect(report.version).toBe('2.0')
  expect(report.links.length).toBeGreaterThan(10)
  for (const link of report.links) {
    expect(link).toMatch(/^https:\/\/www\.jorgeasaur\.us\/[a-z0-9-]+$/)
  }
})

test('page 1 hides the disabled newer control', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('← Newer', { exact: true })).toHaveCount(0)
  await expect(page.locator('.pagination-link--disabled')).toHaveCount(0)
  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page.getByRole('link', { name: '← Newer', exact: true })).toBeVisible()
})

test('mobile nav keeps the social and rss links', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary navigation' })
    for (const name of ['GitHub', 'LinkedIn', 'YouTube', 'RSS']) {
      const link = nav.getByRole('link', { name, exact: true })
      await expect(link).toBeVisible()
      const box = await link.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(-1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
  }
})

test('small glass text clears WCAG AA on the brightest backdrop', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const image = getComputedStyle(document.querySelector('.wallpaper-stage')!).backgroundImage
    const match = image.match(/url\(["']?(.*?)["']?\)/)
    if (!match) return
    await new Promise<void>((resolve, reject) => {
      const loader = new Image()
      loader.onload = () => resolve()
      loader.onerror = () => reject(new Error('wallpaper failed'))
      loader.src = match[1]
    })
  })

  for (const selector of ['.post-card-date', '.post-card-tags a', '.post-card-cta', '.listing-tools .eyebrow', '.post-filters__field label']) {
    const metrics = await page.locator(selector).first().evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        fontSize: Number.parseFloat(style.fontSize),
        letterSpacing: style.letterSpacing === 'normal' ? 0 : Number.parseFloat(style.letterSpacing),
      }
    })
    expect(metrics.fontSize).toBeGreaterThanOrEqual(12)
    expect(metrics.fontSize).toBeLessThanOrEqual(13)
    expect(metrics.letterSpacing).toBeLessThanOrEqual(1)
  }
  expect(await page.locator('.post-card-cta').first().evaluate((element) => getComputedStyle(element).textTransform)).toBe('none')

  const reading = await measureBrightestGlass(page)
  const described = [...reading.card, ...reading.hero]
    .map((sample) => `${sample.name} ${sample.ratio.toFixed(2)}:1 on rgb(${sample.background.join(',')})`)
    .join('; ')
  test.info().annotations.push({
    type: 'contrast',
    description: `scrims card ${reading.scrims.card} hero ${reading.scrims.hero} nav ${reading.scrims.nav}; bright window ${reading.bright.x},${reading.bright.y} L=${reading.bright.luminance.toFixed(3)}; ${described}`,
  })
  console.log(test.info().annotations.at(-1)?.description)
  expect(reading.scrims.card).toBeLessThanOrEqual(0.85)
  expect(reading.scrims.card).toBeGreaterThan(0)
  expect(reading.scrims.hero).toBeLessThanOrEqual(0.85)
  for (const sample of reading.card) expect(sample.ratio).toBeGreaterThanOrEqual(minimumContrast)
  for (const sample of reading.hero) expect(sample.ratio).toBeGreaterThanOrEqual(minimumContrast)
})

test('sticky nav hides card text scrolling underneath', async ({ page }) => {
  await page.goto('/')
  await page.locator('.post-card--featured .post-card-title').scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    const title = document.querySelector('.post-card--featured .post-card-title')
    const nav = document.querySelector('.topbar')
    if (!title || !nav) return
    const titleBox = title.getBoundingClientRect()
    const navBox = nav.getBoundingClientRect()
    window.scrollBy(0, titleBox.top + titleBox.height / 2 - (navBox.top + navBox.height / 2))
  })
  const point = await page.evaluate(() => {
    const title = document.querySelector('.post-card--featured .post-card-title')
    const rect = title?.getBoundingClientRect()
    return rect ? { x: rect.left + Math.min(40, rect.width / 3), y: rect.top + rect.height / 2 } : { x: 0, y: 0 }
  })
  const covered = decodePng(await page.screenshot({ type: 'png' }))
  await page.locator('.post-card, .listing-tools, .hero-panel, .newsletter-signup').evaluateAll((nodes) => {
    nodes.forEach((node) => {
      if (node instanceof HTMLElement) node.style.visibility = 'hidden'
    })
  })
  const clear = decodePng(await page.screenshot({ type: 'png' }))
  const delta = maxChannelDelta(covered, clear, point, 8)
  console.log(`nav bleed channel delta ${delta} at ${point.x},${point.y}`)
  expect(delta).toBeLessThan(20)
})
