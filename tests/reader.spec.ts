import { expect, test, type Page } from '@playwright/test'

async function expectNoHorizontalOverflow(page: Page) {
  const width = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(width.scrollWidth).toBeLessThanOrEqual(width.clientWidth + 1)
}

test.beforeEach(async ({ page, context, baseURL }) => {
  const localOrigin = new URL(baseURL!).origin
  await context.route((url) => url.origin !== localOrigin, (route) => route.abort())
  await context.route('**/api/subscribe', (route) => route.abort())
  await page.addInitScript(() => localStorage.setItem('newsletter-popup-subscribed', 'true'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('category quick pills stay aligned with the category and keyword selects', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('input[type="search"]')).toHaveCount(0)
  await expect(page.getByRole('searchbox')).toHaveCount(0)
  await expect(page.locator('#field-note-category')).toBeVisible()
  await expect(page.locator('#field-note-tag')).toBeVisible()
  const all = page.getByRole('button', { name: /^All\b/ })
  await all.focus()
  expect(await all.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')

  const intune = page.getByRole('button', { name: /^Intune\b/ })
  await intune.click()
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).not.toHaveURL(/[?&]q=/)
  await expect(page.locator('#field-note-category')).toHaveValue('intune')
  await expect(intune).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Category: Intune' })).toBeVisible()

  await page.goto('/?tag=windows')
  await page.getByRole('button', { name: /^Intune\b/ }).click()
  await expect(page).toHaveURL(/tag=windows/)
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).not.toHaveURL(/[?&]page=/)

  await page.locator('#field-note-category').selectOption('powershell')
  await expect(page.getByRole('button', { name: /^PowerShell\b/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/tag=windows/)
  await page.getByRole('button', { name: /^All\b/ }).click()
  await expect(page.locator('#field-note-category')).toHaveValue('')
  await expect(page).toHaveURL(/tag=windows/)
  await expect(page).not.toHaveURL(/category=/)
})

test('homepage signals the notebook and the latest dispatch', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.hero-ledger')).toContainText('field notes')
  await expect(page.locator('.hero-ledger')).toContainText('Intune')
  const latest = page.locator('.hero-latest')
  await expect(latest).toContainText('Latest dispatch')
  await latest.click()
  await expect(page).toHaveURL(/\/learn-intune-powershell-automation$/)
  await page.goto('/')
  const card = page.locator('.post-card--featured')
  await expect(card).toContainText('Latest dispatch')
  await expect(card).toContainText(/No\. \d+/)
  await expect(card).toContainText('min read')
  await expect(card).toContainText('Read field note')
  await expect(card.locator('.post-card__category')).toBeVisible()
})

test('article wayfinder, progress, code copy, and continuity controls', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/ai-agents-changed-how-i-build-things')
  await expect(page.locator('.reading-progress')).toHaveCount(1)
  await expect(page.locator('.reading-status')).toContainText(/min read|% read/)
  const toc = page.getByRole('navigation', { name: 'On this page' })
  const link = toc.getByRole('link', { name: 'The Real Change', exact: true })
  await expect(link).toBeVisible()
  await expect(page.locator('#the-real-change')).toHaveCount(1)
  await link.click()
  await expect(page).toHaveURL(/#the-real-change$/)
  await expect(page.locator('#the-real-change')).toBeFocused()
  const top = await page.locator('#the-real-change').evaluate((element) => element.getBoundingClientRect().top)
  expect(top).toBeGreaterThan(40)
  expect(top).toBeLessThan(220)
  await expect(link).toHaveAttribute('aria-current', 'location')

  await expect(page.locator('.reading-status')).not.toHaveAttribute('aria-hidden', 'true')
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.45))
  await expect.poll(() => page.locator('.reading-progress').evaluate((element) => {
    const match = /scaleX\(([^)]+)\)/.exec(element.style.transform)
    return match ? Number(match[1]) : 0
  })).toBeGreaterThan(0.15)
  await page.locator('.post-content').evaluate((element) => element.scrollIntoView({ block: 'end', behavior: 'auto' }))
  await expect(page.locator('.reading-status')).toHaveText('Complete')

  await page.getByRole('button', { name: 'Back to top' }).last().click()
  await expect(page.locator('.post__header h1')).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
  await page.getByRole('button', { name: 'Copy link' }).first().click()
  await expect(page.getByRole('button', { name: 'Copy link' }).first()).toContainText('Copied')

  await expect(page.getByRole('heading', { name: 'Related field notes' })).toBeVisible()
  await expect(page.locator('.related-notes a').first()).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Adjacent field notes' }).getByRole('link').first()).toContainText(/Previous field note|Next field note/)
})

test('code blocks name the language and copy the snippet', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/manage-vs-code-extensions-with-intune-remediations')
  await expect(page.locator('.code-block__language', { hasText: 'PowerShell' }).first()).toBeVisible()
  await expect(page.locator('.code-block__language', { hasText: 'JSON' }).first()).toBeVisible()
  await expect(page.locator('.code-block__language', { hasText: 'XML' }).first()).toBeVisible()
  const json = page.locator('.code-block').filter({
    has: page.locator('.code-block__language', { hasText: /^JSON$/ }),
  }).first()
  const copy = json.getByRole('button', { name: 'Copy code to clipboard' })
  await copy.scrollIntoViewIfNeeded()
  const box = await copy.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  await copy.click()
  await expect(copy).toContainText('Copied')
  await expect(json.locator('[aria-live="polite"]')).toHaveText('Copied')
  const pasted = await page.evaluate(() => navigator.clipboard.readText())
  expect(pasted.length).toBeGreaterThan(1)
})

test('image lightbox shows the caption, locks scroll, and restores focus', async ({ page }) => {
  await page.goto('/ai-agents-changed-how-i-build-things')
  const trigger = page.getByRole('button', { name: /Open image/ }).first()
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Expanded image preview' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog.getByText(/AI in the loop/)).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')

  await trigger.click()
  await dialog.click({ position: { x: 4, y: 4 } })
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('wayfinder tracks the section reached by scrolling', async ({ page }) => {
  await page.goto('/ai-agents-changed-how-i-build-things')
  const current = page.locator('.wayfinder a[aria-current="location"]')
  await expect(current).toHaveText('The Problem Was Never Intelligence')
  await page.locator('#the-real-change').evaluate((element) => {
    const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0
    const top = element.getBoundingClientRect().top + window.scrollY - margin
    window.scrollTo(0, Math.max(0, top))
  })
  await expect(current).toHaveText('The Real Change')
  await page.locator('#the-real-change').evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY - 16
    window.scrollTo(0, Math.max(0, top))
  })
  await expect(current).toHaveText('The Real Change')
})

test('a malformed fragment still renders the article', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/hello-world#100%')
  await expect(page.locator('.post-content')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Post Not Found')
  expect(errors.join('\n')).not.toMatch(/URIError|URI malformed/)
})

test('continued ordered lists keep the authored start number', async ({ page }) => {
  await page.goto('/manage-vs-code-extensions-with-intune-remediations')
  const step = page.locator('.post-content > ol > li', { hasText: 'Before declaring retirement complete' })
  await step.scrollIntoViewIfNeeded()
  const marker = await step.evaluate((element) => {
    const list = element.closest('ol')
    return {
      start: list?.getAttribute('start'),
      reset: list instanceof HTMLElement ? list.style.counterReset : '',
      content: getComputedStyle(element, '::before').content,
    }
  })
  expect(marker).toEqual({ start: '6', reset: 'post-step 5', content: 'counter(post-step)' })
})

test('the narrow wayfinder paints above the wallpaper', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/ai-agents-changed-how-i-build-things')
  const toggle = page.getByRole('button', { name: /On this page/ })
  const hit = await toggle.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const target = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
    return Boolean(target && (target === element || element.contains(target)))
  })
  expect(hit).toBe(true)
})

test('a shared section link lands below the fixed navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/ai-agents-changed-how-i-build-things#the-real-change')
  await expect.poll(async () => page.locator('#the-real-change').evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThan(40)
  expect(await page.locator('#the-real-change').evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(220)
})

test('a narrow wayfinder jump keeps the heading below the navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/ai-agents-changed-how-i-build-things')
  await page.getByRole('button', { name: /On this page/ }).click()
  await page.getByRole('link', { name: 'The Real Change', exact: true }).click()
  await expect(page.locator('#the-real-change')).toBeFocused()
  await expect.poll(async () => page.evaluate(() => {
    const element = document.getElementById('the-real-change')
    if (!element) return false
    const top = element.getBoundingClientRect().top
    const y = window.scrollY
    return new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => {
        resolve(Math.abs(window.scrollY - y) < 0.5 && top > 40 && top < 220)
      })
    })
  })).toBe(true)
})

for (const width of [375, 1440]) {
  test(`heading prompt stays on the first line at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn-intune-powershell-automation')
    const heading = page.locator('.post-content h2', { hasText: 'Apps, remediations, and reporting' })
    await heading.scrollIntoViewIfNeeded()
    const alignment = await heading.evaluate((element) => {
      const style = getComputedStyle(element)
      const marker = getComputedStyle(element, '::before')
      const borderTop = Number.parseFloat(style.borderTopWidth) || 0
      const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0
      const bounds = element.getBoundingClientRect()
      const markerTop = bounds.top + borderTop + Number.parseFloat(marker.top)
      const markerHeight = Number.parseFloat(marker.height)
      const markerLeft = bounds.left + borderLeft + Number.parseFloat(marker.left)
      const markerRight = markerLeft + Number.parseFloat(marker.width)
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
        },
      })
      const text = walker.nextNode()
      if (!text) return null
      const range = document.createRange()
      range.setStart(text, 0)
      range.setEnd(text, 1)
      const line = range.getClientRects()[0]
      if (!line) return null
      return {
        content: marker.content,
        markerTop,
        markerBottom: markerTop + markerHeight,
        markerMid: markerTop + markerHeight / 2,
        markerRight,
        lineTop: line.top,
        lineBottom: line.bottom,
        lineLeft: line.left,
      }
    })
    expect(alignment).not.toBeNull()
    expect(alignment?.content).toBe('">"')
    expect(alignment!.markerMid).toBeGreaterThan(alignment!.lineTop)
    expect(alignment!.markerMid).toBeLessThan(alignment!.lineBottom)
    expect(alignment!.markerTop).toBeGreaterThanOrEqual(alignment!.lineTop - 2)
    expect(alignment!.markerRight).toBeLessThanOrEqual(alignment!.lineLeft + 1)
  })
}

test('wayfinder collapses on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/ai-agents-changed-how-i-build-things')
  const toggle = page.getByRole('button', { name: /On this page/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('link', { name: 'The Real Change', exact: true })).toBeHidden()
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const link = page.getByRole('link', { name: 'The Real Change', exact: true })
  await expect(link).toBeVisible()
  await link.click()
  await expect(page.locator('#the-real-change')).toBeFocused()
})

for (const width of [375, 768, 1024, 1440]) {
  test(`reader layout stays inside ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.category-pills')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.goto('/manage-vs-code-extensions-with-intune-remediations')
    await expect(page.locator('.post-content')).toBeVisible()
    await expect(page.locator('.code-block').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
    if (width >= 1040) {
      await expect(page.locator('.wayfinder--dock')).toBeVisible()
    }
  })
}
