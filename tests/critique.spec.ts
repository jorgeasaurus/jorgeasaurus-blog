import { expect, test } from '@playwright/test'
import { contrastRatio, decodePng, maxChannelDelta, parseCssColor } from './contrast.mjs'

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

test('social links stay inside the nav just above 840px', async ({ page }) => {
  await page.setViewportSize({ width: 841, height: 800 })
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Primary navigation' })
  const navBox = await nav.boundingBox()
  expect(navBox).not.toBeNull()
  for (const name of ['GitHub', 'LinkedIn', 'YouTube', 'RSS']) {
    const link = nav.getByRole('link', { name, exact: true })
    await expect(link).toBeVisible()
    const box = await link.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(navBox!.x - 1)
    expect(box!.x + box!.width).toBeLessThanOrEqual(navBox!.x + navBox!.width + 1)
  }
  expect(await nav.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
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

test('admin center text clears WCAG AA', async ({ page }) => {
  await page.goto('/')
  const selectors = [
    '.post-card-date',
    '.post-card-tags a',
    '.post-card-cta',
    '.listing-tools .eyebrow',
    '.post-filters__field label',
    '.hero-signal',
    '.hero-copy',
    '.ac-homage',
    '.brand-name',
  ]
  for (const selector of selectors) {
    const sample = await page.locator(selector).first().evaluate((element, name) => {
      const style = getComputedStyle(element)
      let node: Element | null = element
      let background = 'rgb(255, 255, 255)'
      while (node instanceof Element) {
        const color = getComputedStyle(node).backgroundColor
        const match = color.match(/rgba?\(([^)]+)\)/)
        const alpha = match ? Number(match[1].split(/[,\s/]+/).filter(Boolean)[3] ?? 1) : 1
        if (alpha >= 0.99 && color !== 'rgba(0, 0, 0, 0)') {
          background = color
          break
        }
        node = node.parentElement
      }
      return {
        fontSize: Number.parseFloat(style.fontSize),
        letterSpacing: style.letterSpacing === 'normal' ? 0 : Number.parseFloat(style.letterSpacing),
        color: style.color,
        background,
        name,
      }
    }, selector)
    if (['.post-card-date', '.post-card-tags a', '.post-card-cta', '.listing-tools .eyebrow', '.post-filters__field label'].includes(selector)) {
      expect(sample.fontSize).toBeGreaterThanOrEqual(12)
      expect(sample.fontSize).toBeLessThanOrEqual(13)
      expect(sample.letterSpacing).toBeLessThanOrEqual(1)
    }
    const ratio = contrastRatio(parseCssColor(sample.color), parseCssColor(sample.background))
    expect(ratio, `${selector} ${sample.color} on ${sample.background}`).toBeGreaterThanOrEqual(minimumContrast)
  }
  expect(await page.locator('.post-card-cta').first().evaluate((element) => getComputedStyle(element).textTransform)).toBe('none')
  await expect(page.getByRole('searchbox')).toHaveCount(0)
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
