import { expect, test, type Page } from '@playwright/test'

async function loadFonts(page: Page) {
  const loaded = await page.evaluate(async () => {
    const faces = await Promise.all([
      document.fonts.load('700 16px "Instrument Sans"'),
      document.fonts.load('500 16px "IBM Plex Mono"'),
    ])
    await document.fonts.ready
    return faces.map((family) => family.filter((face) => face.status === 'loaded').length)
  })
  for (const count of loaded) expect(count).toBeGreaterThan(0)
}

for (const width of [320, 390]) {
  test.describe(`${width}px touch layout`, () => {
    test.use({ viewport: { width, height: 900 }, hasTouch: true, isMobile: true })

    test.beforeEach(async ({ context, page, baseURL }) => {
      const allowed = new Set([new URL(baseURL!).origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'])
      await context.route((url) => !allowed.has(url.origin), (route) => route.abort())
      await context.route('**/api/subscribe', (route) => route.abort())
      await page.addInitScript(() => localStorage.setItem('newsletter-popup-subscribed', 'true'))
    })

    test('hero text fits its content column', async ({ page }) => {
      await page.goto('/')
      await expect(page.locator('.hero-title-block h1')).toBeVisible()
      await loadFonts(page)
      const bounds = await page.locator('.hero-title-block h1').evaluate((heading) => {
        const column = heading.closest('.hero-title-block')!.getBoundingClientRect()
        const range = document.createRange()
        range.selectNodeContents(heading)
        return { column: { left: column.left, right: column.right }, text: [...range.getClientRects()].map(({ left, right }) => ({ left, right })) }
      })
      expect(bounds.text.length).toBeGreaterThan(0)
      for (const rect of bounds.text) {
        expect(rect.left).toBeGreaterThanOrEqual(bounds.column.left - 1)
        expect(rect.right).toBeLessThanOrEqual(bounds.column.right + 1)
      }
      expect(await page.locator('.hero-intro').evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
    })

    test('materialized inline code and tables remain inside article bounds', async ({ page }) => {
      for (const slug of ['intune-deployments-schedule-the-rollout', 'manage-vs-code-extensions-with-intune-remediations']) {
        await page.goto(`/${slug}`)
        await expect(page.locator('.post-content')).toBeVisible()
        await loadFonts(page)
        const code = page.locator('.post-content code')
        let checked = 0
        for (const node of await code.all()) {
          if (await node.evaluate((element) => Boolean(element.closest('pre, table')))) continue
          await node.scrollIntoViewIfNeeded()
          const fits = await node.evaluate((element) => {
            const bounds = element.closest('.post-content')!.getBoundingClientRect()
            const rects = [...element.getClientRects()]
            return rects.length > 0 && rects.every((rect) => rect.width > 0 && rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1)
          })
          expect(fits, await node.textContent() || 'inline code').toBe(true)
          checked++
        }
        expect(checked).toBeGreaterThan(0)
        const tables = page.getByRole('table')
        if (slug.startsWith('intune-deployments')) expect(await tables.count()).toBeGreaterThan(0)
        for (const table of await tables.all()) {
          expect(await table.getByRole('columnheader').count()).toBeGreaterThan(0)
          const region = table.locator('..')
          await expect(region).toHaveAttribute('role', 'group')
          await expect(region).toHaveAttribute('aria-label', 'Scrollable table')
          await region.scrollIntoViewIfNeeded()
          const state = await region.evaluate((element) => {
            const bounds = element.closest('.post-content')!.getBoundingClientRect()
            const rect = element.getBoundingClientRect()
            element.scrollLeft = 0
            return { left: rect.left, right: rect.right, contentLeft: bounds.left, contentRight: bounds.right, overflow: element.scrollWidth > element.clientWidth }
          })
          expect(state.left).toBeGreaterThanOrEqual(state.contentLeft - 1)
          expect(state.right).toBeLessThanOrEqual(state.contentRight + 1)
          if (state.overflow) {
            await region.focus()
            await page.keyboard.press('ArrowRight')
            await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
          }
        }
      }
    })

    test('touch navigation, filters, dialogs and invalid newsletter submission work', async ({ page }) => {
      let subscriptions = 0
      page.on('request', (request) => { if (new URL(request.url()).pathname === '/api/subscribe') subscriptions++ })
      await page.goto('/')
      const nav = page.getByRole('navigation', { name: 'Primary navigation' })
      await nav.getByRole('link', { name: 'Projects', exact: true }).tap()
      await expect(page).toHaveURL(/\/projects$/)
      await nav.getByRole('link', { name: 'About', exact: true }).tap()
      await expect(page).toHaveURL(/\/about$/)
      await page.getByRole('link', { name: 'Jorgeasaurus', exact: true }).tap()
      await page.getByRole('link', { name: 'Older →', exact: true }).tap()
      await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2')
      await page.getByRole('link', { name: '← Newer', exact: true }).tap()
      await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('1')
      await page.locator('a[href*="?tag="]').first().tap()
      await expect(page.locator('.content-heading h2')).toContainText('Tagged:')
      await page.getByRole('link', { name: 'Clear filter ×' }).tap()
      await expect(page.locator('.content-heading h2')).not.toContainText('Tagged:')
      const email = page.getByRole('textbox', { name: 'Email address', exact: true })
      await email.fill('invalid')
      await page.getByRole('button', { name: 'Notify me', exact: true }).tap()
      expect(await email.evaluate((element: HTMLInputElement) => element.validity.typeMismatch)).toBe(true)
      expect(subscriptions).toBe(0)
      await page.goto('/intune-deployments-schedule-the-rollout')
      const image = page.getByRole('button', { name: /Open image/ }).first()
      const dialog = page.getByRole('dialog', { name: 'Expanded image preview' })
      await image.scrollIntoViewIfNeeded()
      await expect.poll(async () => {
        await image.scrollIntoViewIfNeeded()
        return image.locator('img').evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)
      }).toBe(true)
      await image.tap()
      await expect(dialog).toBeVisible()
      await page.getByRole('button', { name: 'Close expanded image' }).tap()
      await expect(dialog).toHaveCount(0)
      await image.tap()
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
    })
  })
}
