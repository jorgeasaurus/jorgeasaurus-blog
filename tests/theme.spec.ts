import { expect, test } from '@playwright/test'

function watchThemeErrors(page: import('@playwright/test').Page) {
  const messages: string[] = []
  page.on('pageerror', (error) => messages.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text())
  })
  return messages
}

async function expectReader(page: import('@playwright/test').Page) {
  await expect(page.locator('.admin-center')).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveCount(0)
  await expect(page.locator('.brand-name')).toHaveText('Jorgeasaurus')
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'admin')
}

test('the reader is the only interface', async ({ page }) => {
  const messages = watchThemeErrors(page)
  await page.goto('/')
  await expectReader(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Jorgeasaurus' })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jorgeasaur.us/')
  expect(await page.evaluate(() => localStorage.getItem('blog-theme'))).toBeNull()
  expect(await page.evaluate(() => document.cookie)).not.toContain('blog-theme')
  expect(messages.filter((message) => /hydrat/i.test(message))).toEqual([])
})

test('a legacy admin query renders the reader and keeps the canonical url', async ({ page }) => {
  await page.goto('/?theme=admin')
  await expect(page).toHaveURL(/[?&]theme=admin/)
  await expectReader(page)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jorgeasaur.us/')
  expect(await page.evaluate(() => localStorage.getItem('blog-theme'))).toBeNull()
  expect(await page.evaluate(() => document.cookie)).not.toContain('blog-theme')

  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page).not.toHaveURL(/theme=/)
  await expectReader(page)
})

test('a stored admin preference renders the reader', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('blog-theme', 'admin')
    document.cookie = 'blog-theme=admin; Path=/'
  })
  await page.goto('/')
  await expectReader(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Jorgeasaurus' })).toBeVisible()
})

test('blocked storage still renders the reader', async ({ page }) => {
  const messages = watchThemeErrors(page)
  await page.addInitScript(() => {
    const blocked = () => {
      throw new DOMException('storage blocked', 'SecurityError')
    }
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: blocked,
    })
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: blocked,
      set: blocked,
    })
  })

  await page.goto('/?theme=admin&category=intune')
  await expectReader(page)
  await expect(page.getByRole('button', { name: /^Intune\b/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'About', exact: true }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Jorge Suarez' })).toBeVisible()
  await expectReader(page)
  expect(messages.filter((message) => /hydrat|SecurityError|storage blocked/i.test(message))).toEqual([])
})

test('a classic theme query still filters on the reader', async ({ page }) => {
  await page.goto('/?theme=classic&category=intune')
  await expectReader(page)
  await expect(page.getByRole('button', { name: /^Intune\b/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jorgeasaur.us/')
})

test('the wordmark is fully visible on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/')
  const name = page.locator('.brand-name')
  await expect(name).toHaveText('Jorgeasaurus')
  expect(await name.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
})

test('primary navigation stays inside the pill from 901 to 1080px', async ({ page }) => {
  for (const width of [901, 960, 1000, 1040, 1080]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary navigation' })
    const navBox = await nav.boundingBox()
    expect(navBox, `nav at ${width}`).not.toBeNull()
    for (const name of ['Home', 'Projects', 'About', 'GitHub', 'LinkedIn', 'YouTube', 'RSS']) {
      const link = nav.getByRole('link', { name, exact: true })
      await expect(link).toBeVisible()
      const box = await link.boundingBox()
      expect(box, `${name} at ${width}`).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(navBox!.x - 1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(navBox!.x + navBox!.width + 1)
      expect(box!.y).toBeGreaterThanOrEqual(navBox!.y - 1)
      expect(box!.y + box!.height).toBeLessThanOrEqual(navBox!.y + navBox!.height + 1)
    }
    const brand = nav.locator('.brand-name')
    const brandBox = await brand.boundingBox()
    expect(brandBox, `brand at ${width}`).not.toBeNull()
    expect(brandBox!.x).toBeGreaterThanOrEqual(navBox!.x - 1)
    expect(brandBox!.x + brandBox!.width).toBeLessThanOrEqual(navBox!.x + navBox!.width + 1)
    expect(await nav.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
    await expect.poll(() => nav.getByRole('link', { name: 'GitHub', exact: true }).locator('span').evaluate((element) => getComputedStyle(element).position)).toBe('absolute')
  }
})
