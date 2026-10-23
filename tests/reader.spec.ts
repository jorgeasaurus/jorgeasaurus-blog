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

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.45))
  await expect.poll(() => page.locator('.reading-progress').evaluate((element) => {
    const match = /scaleX\(([^)]+)\)/.exec(element.style.transform)
    return match ? Number(match[1]) : 0
  })).toBeGreaterThan(0.15)
  await expect(page.locator('.reading-status')).not.toHaveText('')

  await page.getByRole('button', { name: 'Back to top' }).first().click()
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
