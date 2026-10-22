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

test('search, category, and keyword filters combine, share, and restore with history', async ({ page }) => {
  await page.goto('/')
  const search = page.getByRole('searchbox', { name: 'Search posts' })
  await search.focus()
  await expect(search).toBeFocused()
  const outline = await search.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outline).not.toBe('none')

  await search.fill('PsJamfBackupRestore')
  await expect(page).toHaveURL(/[?&]q=PsJamfBackupRestore/)
  await expect(page.getByRole('heading', { name: 'Search results' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back Up or Restore Jamf Pro Objects with PowerShell' })).toBeVisible()
  await expect(resultStatus(page)).toHaveText('1 post')

  await page.getByLabel('Category', { exact: true }).selectOption('endpoint-management')
  await expect(page).toHaveURL(/category=endpoint-management/)
  await expect(page).toHaveURL(/q=PsJamfBackupRestore/)
  await expect(page.getByRole('link', { name: 'Back Up or Restore Jamf Pro Objects with PowerShell' })).toBeVisible()

  await page.getByLabel('Keyword', { exact: true }).selectOption('jamf')
  await expect(page).toHaveURL(/tag=jamf/)
  await expect(page.getByRole('heading', { name: 'Tagged: jamf' })).toBeVisible()
  await expect(resultStatus(page)).toHaveText('1 post')

  await page.goBack()
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('endpoint-management')
  await expect(search).toHaveValue('PsJamfBackupRestore')

  await page.goForward()
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('jamf')
  await expect(page.getByRole('heading', { name: 'Tagged: jamf' })).toBeVisible()

  await page.goto('/?category=intune&tag=reboot&q=toast')
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('intune')
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('reboot')
  await expect(search).toHaveValue('toast')
  await expect(page.getByRole('link', { name: 'Proactive Remediation to Remind Windows Users to Reboot' })).toBeVisible()
  await expect(resultStatus(page)).toHaveText('1 post')

  await page.goto('/?category=intune')
  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).toHaveURL(/page=2/)
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2')

  await page.goto('/?q=zzzz-no-such-field-note&category=career')
  await expect(resultStatus(page)).toHaveText('No posts match these filters.')
  await expect(page.locator('.post-card')).toHaveCount(0)
  await page.getByRole('link', { name: 'Clear filter ×' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Recent field notes' })).toBeVisible()
  await expect(search).toHaveValue('')
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Keyword', { exact: true })).toHaveValue('')
})

test('a later search edit keeps the previous combined filters in history', async ({ page }) => {
  await page.goto('/?q=toast&category=intune')
  const search = page.getByRole('searchbox', { name: 'Search posts' })
  await search.evaluate((element: HTMLInputElement) => {
    element.focus()
    element.setSelectionRange(element.value.length, element.value.length)
  })
  await search.press('x')
  await expect(search).toHaveValue('toastx')
  await expect(page).toHaveURL(/q=toastx/)
  await expect(page).toHaveURL(/category=intune/)
  await search.press('y')
  await expect(search).toHaveValue('toastxy')
  await expect(page).toHaveURL(/q=toastxy/)
  await page.goBack()
  await expect(search).toHaveValue('toast')
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('intune')
  await expect(page).not.toHaveURL(/toastx/)
})

test('filter edits keep the scroll position and pagination returns to the top', async ({ page }) => {
  await page.goto('/?category=intune&page=2')
  const form = page.getByRole('search', { name: 'Filter posts' })
  await form.scrollIntoViewIfNeeded()
  const filterScroll = await page.evaluate(() => window.scrollY)
  expect(filterScroll).toBeGreaterThan(40)
  await page.getByRole('searchbox', { name: 'Search posts' }).fill('windows')
  await expect(page).not.toHaveURL(/[?&]page=/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(filterScroll - 40)
  await page.getByLabel('Category', { exact: true }).selectOption('powershell')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(filterScroll - 40)
  await page.goto('/?category=intune')
  await page.evaluate(() => window.scrollTo(0, 700))
  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(20)
})

test('filtered search keeps the homepage canonical and noindex', async ({ page }) => {
  await page.goto('/?q=PsJamfBackupRestore')
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow')
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jorgeasaur.us/')
})

test('filters stay inside a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/?category=intune&q=bitlocker')
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
