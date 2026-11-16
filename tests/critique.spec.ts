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
  for (const path of ['/', '/?page=2']) {
    await page.goto(path)
    const cards = page.locator('.post-card')
    expect(await cards.count()).toBeGreaterThan(0)
    for (let index = 0; index < await cards.count(); index += 1) {
      const labels = (await cards.nth(index).locator('.post-card-tags a').allTextContents())
        .map((label) => label.trim().toLowerCase())
      expect(labels.length).toBeGreaterThan(0)
      expect(new Set(labels).size).toBe(labels.length)
      expect(labels.filter((label) => label === labels[0])).toEqual([labels[0]])
    }
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

test('mobile header discloses navigation from one row', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary navigation' })
    const toggle = nav.getByRole('button', { name: 'Menu' })
    const menu = nav.locator('#primary-menu')
    const projects = menu.getByRole('link', { name: 'Projects', exact: true })
    await expect(nav.locator('.brand-name')).toHaveText('Jorgeasaurus')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toHaveAttribute('aria-controls', 'primary-menu')
    await expect(menu).toBeHidden()
    expect(await menu.locator('a').first().evaluate((element) => element.closest('[hidden]') !== null)).toBe(true)
    await page.keyboard.press('Tab')
    await expect(nav.locator('.brand-link')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(toggle).toBeFocused()
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.closest('#primary-menu') == null)).toBe(true)
    const bar = await nav.boundingBox()
    expect(bar!.height).toBeLessThan(76)
    expect(await nav.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(menu.getByRole('link', { name: 'Home', exact: true })).toBeFocused()
    for (const name of ['Home', 'Projects', 'About', 'GitHub', 'LinkedIn', 'YouTube', 'RSS']) {
      const link = nav.getByRole('link', { name, exact: true })
      await expect(link).toBeVisible()
      const box = await link.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.x).toBeGreaterThanOrEqual(-1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
      expect(await link.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === element
          || element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2))
      })).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(projects).toBeHidden()

    await toggle.click()
    await projects.click()
    await expect(page).toHaveURL(/\/projects$/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await toggle.click()
    await menu.getByRole('link', { name: 'Home', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await page.goto('/?page=2')
    await toggle.click()
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await toggle.click()
    await page.locator('.post-card-link').first().click()
    await expect(page).not.toHaveURL(/\/$/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await toggle.click()
    await page.evaluate(() => {
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    })
    await expect(toggle).toBeFocused()
    await expect(projects).toBeHidden()

    await page.evaluate(() => { document.documentElement.style.fontSize = '22px' })
    expect(await nav.locator('.brand-name').evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  }

  await page.setViewportSize({ width: 667, height: 320 })
  await page.goto('/')
  const landscape = page.getByRole('navigation', { name: 'Primary navigation' })
  await landscape.getByRole('button', { name: 'Menu' }).click()
  const landscapeMenu = landscape.locator('#primary-menu')
  const bounds = await landscapeMenu.evaluate((element) => ({
    client: element.clientHeight,
    scroll: element.scrollHeight,
    bottom: element.getBoundingClientRect().bottom,
    view: window.innerHeight,
  }))
  expect(bounds.scroll).toBeGreaterThan(bounds.client)
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.view + 1)
  await landscapeMenu.getByRole('link', { name: 'RSS', exact: true }).focus()
  expect(await landscapeMenu.getByRole('link', { name: 'RSS', exact: true }).evaluate((element) => {
    const link = element.getBoundingClientRect()
    const menu = element.closest('#primary-menu')!.getBoundingClientRect()
    return link.bottom <= menu.bottom + 1 && link.top >= menu.top - 1
  })).toBe(true)

  await page.setViewportSize({ width: 1000, height: 800 })
  await page.goto('/')
  const wide = page.getByRole('navigation', { name: 'Primary navigation' })
  await wide.getByRole('link', { name: 'Projects', exact: true }).focus()
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(wide.getByRole('button', { name: 'Menu' })).toBeFocused()
  await page.setViewportSize({ width: 1000, height: 800 })
  await expect(wide.getByRole('link', { name: 'Home', exact: true })).toBeFocused()

  await wide.getByRole('link', { name: 'Projects', exact: true }).focus()
  const email = page.getByRole('textbox', { name: 'Email address', exact: true })
  await email.focus()
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(email).toBeFocused()

  await page.goto('/')
  const compact = page.getByRole('navigation', { name: 'Primary navigation' })
  const compactMenu = compact.getByRole('button', { name: 'Menu' })
  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await compactMenu.click()
  await compact.getByRole('link', { name: 'Home', exact: true }).focus()
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(compactMenu).toBeFocused()
  await expect(compactMenu).toHaveAttribute('aria-expanded', 'false')

  await compactMenu.click()
  await compact.getByRole('link', { name: 'Projects', exact: true }).click({ modifiers: ['Control'] })
  await expect(page).toHaveURL(/\/$/)
  await expect(compactMenu).toBeFocused()
  await expect(compactMenu).toHaveAttribute('aria-expanded', 'false')
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

  for (const selector of ['.post-card-date', '.post-card-tags a', '.category-pill']) {
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
