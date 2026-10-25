import { expect, test } from '@playwright/test'

function watchThemeErrors(page: import('@playwright/test').Page) {
  const messages: string[] = []
  page.on('pageerror', (error) => messages.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text())
  })
  return messages
}

test('classic is the default theme', async ({ page }) => {
  const messages = watchThemeErrors(page)
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic')
  await expect(page.locator('.admin-center')).toHaveCount(0)
  await expect(page.locator('.brand-prompt')).toHaveText('>')
  await expect(page.locator('.brand-name')).toHaveText('Jorgeasaurus')
  await expect(page.locator('.topbar.glass-panel')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('classic')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jorgeasaur.us/')
  expect(await page.evaluate(() => localStorage.getItem('blog-theme'))).toBeNull()
  expect(messages.filter((message) => /hydrat/i.test(message))).toEqual([])
})

test('the theme query selects admin or classic and keeps the canonical url', async ({ page }) => {
  await page.goto('/?theme=admin')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'admin')
  await expect(page.locator('.admin-center')).toBeVisible()
  await expect(page.locator('.brand-name')).toHaveText('jorgeasaurus admin center')
  await expect(page.getByRole('searchbox')).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible()
  await expect(page.locator('.ac-homage')).toContainText('Not affiliated with Microsoft')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jorgeasaur.us/')
  expect(await page.evaluate(() => localStorage.getItem('blog-theme'))).toBe('admin')
  expect(await page.evaluate(() => document.cookie)).toContain('blog-theme=admin')

  await page.goto('/?theme=classic&category=intune')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic')
  await expect(page.locator('.admin-center')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Category: Intune' })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.jorgeasaur.us/')
})

test('the header switcher persists across navigation and reloads', async ({ page }) => {
  await page.goto('/')
  const theme = page.getByRole('combobox', { name: 'Theme' })
  await theme.selectOption('admin')
  await expect(page).toHaveURL(/[?&]theme=admin/)
  await expect(page.locator('.admin-center')).toBeVisible()
  await page.getByRole('button', { name: /^PowerShell\b/ }).click()
  await expect(page.getByRole('heading', { name: 'Category: PowerShell' })).toBeVisible()
  await expect(page.locator('.admin-center')).toBeVisible()

  await page.goto('/about')
  await expect(page.locator('.admin-center')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Jorge Suarez', exact: true })).toBeVisible()

  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'admin')
  await expect(page.locator('.admin-center')).toBeVisible()
  await page.reload()
  await expect(page.locator('.brand-name')).toHaveText('jorgeasaurus admin center')

  await page.getByRole('combobox', { name: 'Theme' }).selectOption('classic')
  await expect(page).toHaveURL(/[?&]theme=classic/)
  await expect(page.locator('.brand-prompt')).toHaveText('>')
  await page.goto('/projects')
  await expect(page.locator('.admin-center')).toHaveCount(0)
  await expect(page.locator('.brand-name')).toHaveText('Jorgeasaurus')
})

test('a stored theme applies before the page renders and the query overrides it', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('blog-theme', 'admin'))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'admin')
  await expect(page.locator('.admin-center')).toBeVisible()
  await expect(page.locator('.brand-prompt')).toHaveCount(0)

  await page.goto('/?theme=classic')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic')
  await expect(page.locator('.brand-prompt')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('blog-theme'))).toBe('classic')
})

test('admin survives client navigation when storage and cookies are blocked', async ({ page }) => {
  const messages = watchThemeErrors(page)
  await page.addInitScript(() => {
    const blocked = () => {
      throw new DOMException('storage blocked', 'SecurityError')
    }
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: blocked,
    })
    const jar = ''
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => jar,
      set: () => {
        // Cookie writes are blocked. Reads stay empty.
      },
    })
  })

  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic')
  await expect(page.locator('.admin-center')).toHaveCount(0)

  await page.getByRole('combobox', { name: 'Theme' }).selectOption('admin')
  await expect(page).toHaveURL(/[?&]theme=admin/)
  await expect(page.locator('.admin-center')).toBeVisible()

  await page.getByRole('link', { name: 'Older →', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page).not.toHaveURL(/theme=/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'admin')
  await expect(page.locator('.admin-center')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('admin')

  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' })
  await primaryNav.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'admin')
  await expect(page.locator('.admin-center')).toBeVisible()

  await page.getByRole('combobox', { name: 'Theme' }).selectOption('classic')
  await expect(page).toHaveURL(/[?&]theme=classic/)
  await expect(page.locator('.admin-center')).toHaveCount(0)
  await primaryNav.getByRole('link', { name: 'About', exact: true }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page).not.toHaveURL(/theme=/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic')
  await expect(page.locator('.admin-center')).toHaveCount(0)
  await expect(page.locator('.brand-name')).toHaveText('Jorgeasaurus')

  const persisted = await page.evaluate(() => {
    let storage = 'blocked'
    try {
      storage = localStorage.getItem('blog-theme') ?? 'empty'
    } catch {
      // localStorage is blocked, so the initial value stands.
    }
    return { storage, cookie: document.cookie }
  })
  expect(persisted.storage).toBe('blocked')
  expect(persisted.cookie).not.toContain('blog-theme')
  expect(messages.filter((message) => /hydrat|storage blocked/i.test(message))).toEqual([])
})

test('a throwing cookie write still applies the selected theme', async ({ page }) => {
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

  await page.goto('/?theme=admin')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'admin')
  await expect(page.locator('.admin-center')).toBeVisible()

  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'About', exact: true }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page).not.toHaveURL(/theme=/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'admin')
  await expect(page.locator('.admin-center')).toBeVisible()

  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic')
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('admin')
  await expect(page).toHaveURL(/[?&]theme=admin/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'admin')
  await expect(page.locator('.admin-center')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('admin')
  expect(messages.filter((message) => /hydrat|SecurityError|storage blocked/i.test(message))).toEqual([])
})

test('the theme switcher is keyboard accessible on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/')
  const theme = page.getByRole('combobox', { name: 'Theme' })
  await theme.focus()
  await expect(theme).toBeFocused()
  await theme.selectOption('admin')
  await expect(page.locator('.admin-center')).toBeVisible()
  const toggle = page.getByRole('button', { name: 'Open navigation' })
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.getByRole('navigation', { name: 'Admin center' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
})
