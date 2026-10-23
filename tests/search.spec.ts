import { expect, test, type BrowserContext, type Page } from '@playwright/test'

async function blockExternalRequests(context: BrowserContext, baseURL: string) {
  const localOrigin = new URL(baseURL).origin
  await context.route((url) => url.origin !== localOrigin, (route) => route.abort())
  await context.route('**/api/subscribe', (route) => route.abort())
}

test.beforeEach(async ({ page, context, baseURL }) => {
  await blockExternalRequests(context, baseURL!)
  await page.addInitScript(() => localStorage.setItem('newsletter-popup-subscribed', 'true'))
})

function resultStatus(page: Page) {
  return page.getByRole('search', { name: 'Filter posts' }).getByRole('status')
}

test('category and keyword filters combine, share, and restore with history', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('searchbox')).toHaveCount(0)
  const category = page.getByLabel('Category', { exact: true })
  await category.focus()
  await expect(category).toBeFocused()
  const outline = await category.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outline).not.toBe('none')

  await category.selectOption('endpoint-management')
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
  await expect(category).toHaveValue('endpoint-management')

  await page.goForward()
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('jamf')
  await expect(page.getByRole('heading', { name: 'Tagged: jamf' })).toBeVisible()

  await page.goto('/?category=intune&tag=reboot')
  await expect(category).toHaveValue('intune')
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
  await expect(category).toHaveValue('')
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('')
})

test('a category badge filters the listing and selects that category', async ({ page }) => {
  await page.goto('/')
  const cardCategory = page.locator('.post-card').first().locator('.post-card-tags a').first()
  const href = await cardCategory.getAttribute('href')
  const slug = new URL(href ?? '/', 'http://127.0.0.1').searchParams.get('category')
  await cardCategory.click()
  await expect(page).toHaveURL(new RegExp(`category=${slug}`))
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue(slug ?? '')
  await expect(page).not.toHaveURL(/[?&]tag=/)

  await page.goto('/use-cpm-with-openrouter-models')
  await expect(page.getByRole('heading', { name: 'Use GitHub Copilot with Third-Party LLM Models' })).toBeVisible()
  await page.locator('article header').getByRole('link', { name: 'AI', exact: true }).click()
  await expect(page).toHaveURL(/\/\?category=ai$/)
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('ai')
  await expect(page.getByRole('heading', { name: 'Category: AI' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Use GitHub Copilot with Third-Party LLM Models' })).toBeVisible()
  await expect(page.getByRole('link', { name: "Intune assignments: Do's and don'ts" })).toHaveCount(0)
  await expect(resultStatus(page)).not.toHaveText('No posts match these filters.')
})

test('filter edits keep the scroll position and pagination returns to the top', async ({ page }) => {
  await page.goto('/?category=intune&page=2')
  const form = page.getByRole('search', { name: 'Filter posts' })
  await form.scrollIntoViewIfNeeded()
  const filterScroll = await page.evaluate(() => window.scrollY)
  expect(filterScroll).toBeGreaterThan(40)
  await page.getByLabel('Keyword', { exact: true }).selectOption('windows')
  await expect(page).not.toHaveURL(/[?&]page=/)
  await expect(page).toHaveURL(/category=intune/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(filterScroll - 40)
  await page.getByLabel('Category', { exact: true }).selectOption('powershell')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(filterScroll - 40)
  await page.getByRole('link', { name: 'Clear filter ×' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(filterScroll - 40)
  await page.goto('/?category=intune')
  await page.evaluate(() => window.scrollTo(0, 700))
  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
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
