import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { decodePng } from './contrast.mjs'

async function blockExternalRequests(context: BrowserContext, baseURL: string) {
  const localOrigin = new URL(baseURL).origin
  await context.route((url) => url.origin !== localOrigin, (route) => route.abort())
  await context.route('**/api/subscribe', (route) => route.abort())
}

test.beforeEach(async ({ context, baseURL }) => {
  await blockExternalRequests(context, baseURL!)
})

function resultStatus(page: Page) {
  return page.getByRole('search', { name: 'Filter posts' }).getByRole('status')
}

test('category and keyword filters combine, share, and restore with history', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('searchbox')).toHaveCount(0)
  await expect(page.locator('#field-note-category')).toHaveCount(0)
  const category = page.getByRole('button', { name: /^Endpoint management\b/ })
  await category.focus()
  await expect(category).toBeFocused()
  const outline = await category.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outline).not.toBe('none')

  await category.click()
  await expect(page).toHaveURL(/category=endpoint-management/)
  await expect(page.getByRole('heading', { name: 'Category: Endpoint management' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Back Up or Restore Jamf Pro Objects with PowerShell' })).toBeVisible()

  await page.getByLabel('Keyword', { exact: true }).selectOption('jamf')
  await expect(page).toHaveURL(/tag=jamf/)
  await expect(page).toHaveURL(/category=endpoint-management/)
  await expect(page.getByRole('heading', { name: 'Tagged: jamf' })).toHaveCount(0)
  await expect(resultStatus(page)).toHaveText('')
  await expect(resultStatus(page)).toHaveClass(/visually-hidden/)

  await page.goBack()
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('')
  await expect(category).toHaveAttribute('aria-pressed', 'true')

  await page.goForward()
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('jamf')
  await expect(page.getByRole('heading', { name: 'Tagged: jamf' })).toHaveCount(0)

  await page.goto('/?category=intune&tag=reboot')
  await expect(page.getByRole('button', { name: /^Intune\b/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('reboot')
  await expect(page.getByRole('link', { name: 'Proactive Remediation to Remind Windows Users to Reboot' })).toBeVisible()
  await expect(resultStatus(page)).toHaveText('')
  await expect(resultStatus(page)).toHaveClass(/visually-hidden/)

  await page.goto('/?category=intune')
  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).toHaveURL(/page=2/)
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2')

  await page.goto('/?category=career&tag=jamf')
  await expect(resultStatus(page)).toHaveText('No posts match these filters.')
  await expect(resultStatus(page)).not.toHaveClass(/visually-hidden/)
  await expect(page.locator('.post-card')).toHaveCount(0)
  await page.getByRole('link', { name: 'Clear filter ×' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Posts', exact: true })).toHaveCount(1)
  await expect(page.getByRole('button', { name: /^All\b/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('')
})

test('a category badge filters the listing and selects that category', async ({ page }) => {
  await page.goto('/')
  const cardCategory = page.locator('.post-card').first().locator('.post-card-tags a').first()
  const href = await cardCategory.getAttribute('href')
  const slug = new URL(href ?? '/', 'http://127.0.0.1').searchParams.get('category')
  const label = (await cardCategory.textContent())?.trim() ?? ''
  await cardCategory.click()
  await expect(page).toHaveURL(new RegExp(`category=${slug}`))
  await expect(page.getByRole('button', { name: new RegExp(`^${label}\\b`) })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).not.toHaveURL(/[?&]tag=/)

  await page.goto('/use-cpm-with-openrouter-models')
  await expect(page.getByRole('heading', { name: 'Use GitHub Copilot with Third-Party LLM Models' })).toBeVisible()
  await page.locator('article header').getByRole('link', { name: 'AI', exact: true }).click()
  await expect(page).toHaveURL(/\/\?category=ai$/)
  await expect(page.getByRole('button', { name: /^AI\b/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Category: AI' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Use GitHub Copilot with Third-Party LLM Models' })).toBeVisible()
  await expect(page.getByRole('link', { name: "Intune assignments: Do's and don'ts" })).toHaveCount(0)
  await expect(resultStatus(page)).toHaveText('')
  await expect(resultStatus(page)).toHaveClass(/visually-hidden/)
})

test('filter edits keep the scroll position and pagination returns to the top', async ({ page }) => {
  await page.goto('/?category=intune&page=2')
  await page.evaluate(() => document.fonts.ready)
  const clear = page.getByRole('link', { name: 'Clear filter ×' })
  await clear.evaluate((element) => {
    const navBottom = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0
    const rect = element.getBoundingClientRect()
    const center = rect.top + rect.height / 2 + window.scrollY
    window.scrollTo(0, Math.max(0, center - navBottom - 96))
  })
  const filterScroll = await page.evaluate(() => window.scrollY)
  expect(filterScroll).toBeGreaterThan(40)
  const keptScroll = () => page.evaluate(() => window.scrollY)
  // Playwright retries a covered or shifting control by scrolling it into view.
  // Drive the controls in the page so this assertion measures the listing, not that retry.
  await page.getByLabel('Keyword', { exact: true }).evaluate((element) => {
    const select = element as HTMLSelectElement
    select.value = 'windows'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page).not.toHaveURL(/[?&]page=/)
  await expect(page).toHaveURL(/category=intune/)
  await expect.poll(keptScroll).toBeGreaterThan(filterScroll - 40)
  await expect.poll(keptScroll).toBeLessThan(filterScroll + 40)
  await page.getByRole('button', { name: /^PowerShell\b/ }).evaluate((element) => {
    element.click()
  })
  await expect.poll(keptScroll).toBeGreaterThan(filterScroll - 40)
  await expect.poll(keptScroll).toBeLessThan(filterScroll + 40)
  await clear.evaluate((element) => {
    element.click()
  })
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(keptScroll).toBeGreaterThan(filterScroll - 40)
  await expect.poll(keptScroll).toBeLessThan(filterScroll + 40)
  await page.goto('/?category=intune')
  await page.evaluate(() => window.scrollTo(0, 700))
  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
})

test('a modified pagination click keeps the current tab in place', async ({ page }) => {
  await page.goto('/?category=intune')
  await page.evaluate(() => window.scrollTo(0, 700))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(40)
  const popup = page.context().waitForEvent('page', { timeout: 3000 }).catch(() => null)
  await page.getByRole('link', { name: 'Older →', exact: true }).click({ modifiers: ['Control'] })
  const opened = await popup
  if (opened) await opened.close()
  await expect(page).toHaveURL(/\/\?category=intune$/)
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(40)
})

test('back and forward between pages starts the restored page at the top', async ({ page }) => {
  await page.addInitScript(() => {
    history.scrollRestoration = 'auto'
  })
  await page.goto('/?category=intune')
  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await page.evaluate(() => window.scrollTo(0, 700))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(40)
  await page.goBack()
  await expect(page).not.toHaveURL(/page=2/)
  await page.goForward()
  await expect(page).toHaveURL(/page=2/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(20)
})

test('home and brand links return a scrolled listing to the top', async ({ page }) => {
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
  await page.goto('/?category=intune&page=2')
  await page.evaluate(() => window.scrollTo(0, 700))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(40)
  await navigation.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)

  await page.goto('/?category=intune&page=2')
  await page.evaluate(() => window.scrollTo(0, 700))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(40)
  await navigation.getByRole('link', { name: 'Jorgeasaurus', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
})

test('opening home from a scrolled article starts at the top', async ({ page }) => {
  await page.goto('/intune-deployments-schedule-the-rollout')
  await expect(page.getByRole('heading', { name: 'Intune deployments: Schedule the rollout and check the results' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(1400)
  await page.evaluate(() => window.scrollTo(0, 900))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(40)
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Posts', exact: true })).toHaveCount(1)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
})

test('filtered listing keeps the homepage canonical and noindex', async ({ page }) => {
  await page.goto('/?category=intune&tag=reboot')
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow')
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jorgeasaur.us/')
})

test('filter panel shares the post card glass surface', async ({ page }) => {
  async function readSurfaces() {
    return page.evaluate(() => {
      const read = (selector: string) => {
        const element = document.querySelector(selector)
        if (!element) throw new Error(`Missing ${selector}`)
        const style = getComputedStyle(element)
        const rim = getComputedStyle(element, '::before')
        return {
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          backgroundBlendMode: style.backgroundBlendMode,
          backdropFilter: style.backdropFilter,
          boxShadow: style.boxShadow,
          borderRadius: style.borderRadius,
          borderTopColor: style.borderTopColor,
          color: style.color,
          rimImage: rim.backgroundImage,
          rimPadding: rim.padding,
        }
      }
      return {
        panel: read('.listing-tools'),
        featured: read('.post-card--featured'),
        card: read('.post-card:not(.post-card--featured)'),
        tag: read('.post-card-tags a'),
        pill: read('.category-pill:not(.category-pill--active)'),
        active: read('.category-pill--active'),
        select: read('.post-filters__field select'),
        label: read('.post-filters__field label'),
      }
    })
  }

  function expectSharedSurface(panel: Awaited<ReturnType<typeof readSurfaces>>['panel'], card: Awaited<ReturnType<typeof readSurfaces>>['featured']) {
    expect(panel.backgroundColor).toBe(card.backgroundColor)
    expect(panel.backgroundImage).toBe(card.backgroundImage)
    expect(panel.backgroundBlendMode).toBe(card.backgroundBlendMode)
    expect(panel.backdropFilter).toBe(card.backdropFilter)
    expect(panel.boxShadow).toBe(card.boxShadow)
    expect(panel.color).toBe(card.color)
    expect(panel.rimImage).toBe(card.rimImage)
    expect(panel.rimPadding).toBe(card.rimPadding)
  }

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const panel = page.locator('.listing-tools')
  await expect(panel).toBeVisible()
  await expect(panel).not.toHaveClass(/frosted/)
  await expect(panel).toHaveClass(/liquid-glass-surface/)

  const desktop = await readSurfaces()
  expectSharedSurface(desktop.panel, desktop.featured)
  expectSharedSurface(desktop.panel, desktop.card)
  expect(desktop.panel.borderRadius).toBe(desktop.featured.borderRadius)
  expect(desktop.panel.backdropFilter).toContain('blur')
  expect(desktop.pill.backgroundColor).toBe(desktop.tag.backgroundColor)
  expect(desktop.pill.borderTopColor).toBe(desktop.tag.borderTopColor)
  expect(desktop.select.backgroundColor).toBe(desktop.tag.backgroundColor)
  expect(desktop.select.borderTopColor).toBe(desktop.tag.borderTopColor)
  expect(desktop.select.borderRadius).toBe(desktop.tag.borderRadius)
  expect(desktop.select.color).toBe('rgb(255, 255, 255)')
  expect(desktop.label.color).toBe('rgb(243, 255, 246)')
  expect(desktop.active.backgroundColor).not.toBe(desktop.pill.backgroundColor)
  expect(desktop.active.borderTopColor).not.toBe(desktop.pill.borderTopColor)

  const all = page.getByRole('button', { name: /^All\b/ })
  await all.focus()
  expect(await all.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
  const keyword = page.getByLabel('Keyword', { exact: true })
  await keyword.focus()
  expect(await keyword.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')

  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = await readSurfaces()
  expectSharedSurface(mobile.panel, mobile.featured)
  expect(mobile.panel.borderRadius).toBe(mobile.featured.borderRadius)
  const bounds = await panel.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const viewport = window.innerWidth
    const outside = [...element.querySelectorAll('.category-pill, select, label')].flatMap((control) => {
      const box = control.getBoundingClientRect()
      return box.width > 0 && (box.left < -1 || box.right > viewport + 1)
        ? [control.textContent?.trim() || control.tagName]
        : []
    })
    return {
      left: rect.left,
      right: rect.right,
      overflow: element.scrollWidth > element.clientWidth + 1,
      outside,
      viewport,
    }
  })
  expect(bounds.left).toBeGreaterThanOrEqual(-1)
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport + 1)
  expect(bounds.overflow).toBe(false)
  expect(bounds.outside).toEqual([])

  await page.emulateMedia({ reducedMotion: 'reduce', contrast: 'no-preference' })
  await page.reload()
  await expect(panel).toBeVisible()
  const reduced = await readSurfaces()
  expect(reduced.panel.backdropFilter).toBe('none')
  expectSharedSurface(reduced.panel, reduced.featured)
  expect(reduced.active.backgroundColor).not.toBe(reduced.pill.backgroundColor)

  await page.emulateMedia({ reducedMotion: 'no-preference', contrast: 'more' })
  await page.reload()
  await expect(panel).toBeVisible()
  const contrast = await readSurfaces()
  expect(contrast.panel.backdropFilter).toContain('blur')
  expectSharedSurface(contrast.panel, contrast.featured)
  expect(contrast.pill.borderTopColor).toBe('rgba(215, 255, 227, 0.9)')
  expect(contrast.select.borderTopColor).toBe('rgba(215, 255, 227, 0.9)')
  expect(contrast.active.backgroundColor).not.toBe(contrast.pill.backgroundColor)
})

test('filters stay inside a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/?category=intune&tag=bitlocker')
  const form = page.getByRole('search', { name: 'Filter posts' })
  await expect(form).toBeVisible()
  const bounds = await form.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      left: rect.left,
      right: rect.right,
      overflow: element.scrollWidth > element.clientWidth + 1,
      viewport: window.innerWidth,
    }
  })
  expect(bounds.left).toBeGreaterThanOrEqual(-1)
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport + 1)
  expect(bounds.overflow).toBe(false)
  await expect(page.getByRole('link', { name: 'Add a BitLocker startup PIN after Autopilot' })).toBeVisible()
})

function chevronRightGap(image: { width: number; height: number; pixels: Uint8Array | Buffer }) {
  const { width, height, pixels } = image
  const y0 = Math.floor(height * 0.3)
  const y1 = Math.floor(height * 0.7)
  let total = 0
  let count = 0
  for (let y = y0; y < y1; y += 2) {
    for (let x = Math.floor(width * 0.4); x < Math.floor(width * 0.62); x += 2) {
      const index = (y * width + x) * 4
      total += pixels[index] + pixels[index + 1] + pixels[index + 2]
      count += 1
    }
  }
  const base = total / Math.max(count, 1)
  let right = -1
  const innerRight = width - 4
  for (let y = y0; y < y1; y += 1) {
    for (let x = Math.floor(width * 0.62); x < innerRight; x += 1) {
      const index = (y * width + x) * 4
      const sum = pixels[index] + pixels[index + 1] + pixels[index + 2]
      if (sum > base + 90) right = Math.max(right, x)
    }
  }
  if (right < 0) return null
  return width - 1 - right
}

test('the keyword chevron sits inset from the pill edge', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const select = page.getByRole('combobox', { name: 'Keyword' })
    await expect(select).toHaveJSProperty('tagName', 'SELECT')
    await select.focus()
    expect(await select.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
    await select.blur()
    const metrics = await select.evaluate((element: HTMLSelectElement) => {
      const style = getComputedStyle(element)
      return {
        padLeft: Number.parseFloat(style.paddingLeft),
        padRight: Number.parseFloat(style.paddingRight),
        borderRight: Number.parseFloat(style.borderRightWidth),
        appearance: style.appearance,
        backgroundPosition: style.backgroundPosition,
        backgroundImage: style.backgroundImage,
      }
    })
    expect(metrics.appearance).toBe('none')
    expect(metrics.backgroundImage).toContain('data:image/svg+xml')
    expect(metrics.backgroundPosition).toBe(`calc(100% - ${metrics.padLeft}px) 50%`)
    expect(metrics.padRight).toBeGreaterThan(metrics.padLeft + 12)
    await select.evaluate((element) => {
      element.style.color = 'transparent'
      element.style.textShadow = 'none'
      element.style.backgroundColor = '#06100b'
    })
    const ratio = await page.evaluate(() => window.devicePixelRatio || 1)
    const rawGap = chevronRightGap(decodePng(await select.screenshot()))
    expect(rawGap, `${width}px chevron was not painted`).not.toBeNull()
    const gap = rawGap! / ratio
    expect(gap, `${width}px gap ${gap}`).toBeGreaterThan(8)
    expect(gap).toBeLessThan(metrics.padLeft + 20)
    await select.selectOption({ index: 1 })
    await expect(select).not.toHaveValue('')
  }
})

test('forced colors restores the native keyword arrow', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto('/')
  const select = page.getByRole('combobox', { name: 'Keyword' })
  const style = await select.evaluate((element: HTMLSelectElement) => {
    const computed = getComputedStyle(element)
    return { appearance: computed.appearance, backgroundImage: computed.backgroundImage }
  })
  expect(style.appearance).not.toBe('none')
  expect(style.backgroundImage).toBe('none')
  await select.selectOption({ index: 1 })
  await expect(select).not.toHaveValue('')
})
