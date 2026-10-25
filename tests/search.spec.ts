import { expect, test, type BrowserContext, type Page } from '@playwright/test'

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
  await expect(page.getByRole('heading', { name: 'Category: Endpoint management' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back Up or Restore Jamf Pro Objects with PowerShell' })).toBeVisible()

  await page.getByLabel('Keyword', { exact: true }).selectOption('jamf')
  await expect(page).toHaveURL(/tag=jamf/)
  await expect(page).toHaveURL(/category=endpoint-management/)
  await expect(page.getByRole('heading', { name: 'Tagged: jamf' })).toBeVisible()
  await expect(resultStatus(page)).toHaveText('1 post')

  await page.goBack()
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('')
  await expect(category).toHaveAttribute('aria-pressed', 'true')

  await page.goForward()
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('jamf')
  await expect(page.getByRole('heading', { name: 'Tagged: jamf' })).toBeVisible()

  await page.goto('/?category=intune&tag=reboot')
  await expect(page.getByRole('button', { name: /^Intune\b/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('reboot')
  await expect(page.getByRole('link', { name: 'Proactive Remediation to Remind Windows Users to Reboot' })).toBeVisible()
  await expect(resultStatus(page)).toHaveText('1 post')

  await page.goto('/?category=intune')
  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).toHaveURL(/page=2/)
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2')

  await page.goto('/?category=career&tag=jamf')
  await expect(resultStatus(page)).toHaveText('No posts match these filters.')
  await expect(page.locator('.post-card')).toHaveCount(0)
  await page.getByRole('link', { name: 'Clear filter ×' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Recent field notes' })).toBeVisible()
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
  await expect(page.getByRole('heading', { name: 'Category: AI' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Use GitHub Copilot with Third-Party LLM Models' })).toBeVisible()
  await expect(page.getByRole('link', { name: "Intune assignments: Do's and don'ts" })).toHaveCount(0)
  await expect(resultStatus(page)).not.toHaveText('No posts match these filters.')
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
  await expect(page.getByRole('heading', { name: 'Recent field notes' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
})

test('filtered listing keeps the homepage canonical and noindex', async ({ page }) => {
  await page.goto('/?category=intune&tag=reboot')
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow')
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jorgeasaur.us/')
})

test('filter panel shares the admin center surface', async ({ page }) => {
  async function readSurfaces() {
    return page.evaluate(() => {
      const read = (selector: string) => {
        const element = document.querySelector(selector)
        if (!element) throw new Error(`Missing ${selector}`)
        const style = getComputedStyle(element)
        return {
          backgroundColor: style.backgroundColor,
          backdropFilter: style.backdropFilter,
          borderRadius: style.borderRadius,
          borderTopColor: style.borderTopColor,
          color: style.color,
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

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const panel = page.locator('.listing-tools')
  await expect(panel).toBeVisible()
  await expect(panel).not.toHaveClass(/frosted/)
  await expect(page.locator('.ac-grid')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible()

  const desktop = await readSurfaces()
  expect(desktop.panel.backgroundColor).toBe(desktop.featured.backgroundColor)
  expect(desktop.panel.backgroundColor).toBe('rgb(255, 255, 255)')
  expect(desktop.panel.backdropFilter).toBe('none')
  expect(desktop.featured.backdropFilter).toBe('none')
  expect(desktop.card.backdropFilter).toBe('none')
  expect(Number.parseFloat(desktop.panel.borderRadius)).toBeLessThanOrEqual(4)
  expect(desktop.active.backgroundColor).not.toBe(desktop.pill.backgroundColor)
  expect(desktop.label.color).not.toBe('rgb(255, 255, 255)')
  expect(desktop.select.color).not.toBe('rgb(255, 255, 255)')

  const all = page.getByRole('button', { name: /^All\b/ })
  await all.focus()
  expect(await all.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
  const keyword = page.getByLabel('Keyword', { exact: true })
  await keyword.focus()
  expect(await keyword.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')

  await page.setViewportSize({ width: 390, height: 844 })
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
  expect(reduced.panel.backgroundColor).toBe(reduced.featured.backgroundColor)
  expect(reduced.active.backgroundColor).not.toBe(reduced.pill.backgroundColor)

  await page.emulateMedia({ reducedMotion: 'no-preference', contrast: 'more' })
  await page.reload()
  await expect(panel).toBeVisible()
  const contrast = await readSurfaces()
  expect(contrast.panel.backdropFilter).toBe('none')
  expect(contrast.panel.backgroundColor).toBe('rgb(255, 255, 255)')
  expect(contrast.active.backgroundColor).not.toBe(contrast.pill.backgroundColor)
  expect(contrast.active.borderTopColor).not.toBe(contrast.pill.borderTopColor)
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
