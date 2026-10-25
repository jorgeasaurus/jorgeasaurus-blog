import { expect, test, type Locator, type Page } from '@playwright/test'

async function sectionOffset(page: Page, id: string) {
  return page.evaluate((sectionId) => {
    const target = document.getElementById(sectionId)
    const header = document.querySelector('.topbar')
    if (!target || !header) return 'missing'
    const delta = target.getBoundingClientRect().top - header.getBoundingClientRect().bottom
    return delta >= 4 && delta <= 28 ? 'aligned' : `delta:${delta.toFixed(1)}`
  }, id)
}

async function expectSectionBelowHeader(page: Page, id: string) {
  await expect.poll(() => sectionOffset(page, id)).toBe('aligned')
}

async function expectOutline(locator: Locator, color: string) {
  await locator.evaluate((element) => {
    if (element instanceof HTMLElement) element.focus({ focusVisible: true })
  })
  await expect.poll(() => locator.evaluate((element) => getComputedStyle(element).outlineColor)).toBe(color)
}

test('an admin-center article renders its post body', async ({ page }) => {
  await page.goto('/learn-intune-powershell-automation?theme=admin')
  await expect(page.locator('.admin-center')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Learn Intune and PowerShell automation: field notes',
  )
  await expect(page.locator('.post-content')).toContainText('Use the Microsoft Graph PowerShell SDK')
  await expect(page.getByRole('heading', { name: 'Post Not Found' })).toHaveCount(0)
})

test('admin hash links scroll below the fixed header and home returns to the top', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?theme=admin')
  const rail = page.getByRole('navigation', { name: 'Admin center' })

  await rail.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page).toHaveURL(/\/#overview$/)
  await expectSectionBelowHeader(page, 'overview')

  await rail.getByRole('link', { name: 'All posts' }).click()
  await expect(page).toHaveURL(/\/#posts$/)
  await expectSectionBelowHeader(page, 'posts')

  await page.goto('/bitlocker-startup-pin-after-autopilot?theme=admin')
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Posts' }).click()
  await expect(page).toHaveURL(/\/#posts$/)
  await expectSectionBelowHeader(page, 'posts')

  await page.getByRole('link', { name: 'Older →' }).click()
  await expect(page).toHaveURL(/page=2/)
  await page.goBack()
  await expect(page).toHaveURL(/\/#posts$/)
  await expectSectionBelowHeader(page, 'posts')

  await rail.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL(/\/(\?theme=admin)?$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2)
})

test('the admin rail RSS entry loads the feed', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?theme=admin')
  const rss = page.getByRole('navigation', { name: 'Admin center' }).getByRole('link', { name: 'RSS' })
  await expect(rss).toHaveAttribute('href', '/rss.xml')
  await rss.click()
  await expect(page).toHaveURL(/\/rss\.xml$/)
  await expect(page.getByRole('heading', { name: 'Post Not Found' })).toHaveCount(0)
  await expect.poll(async () => page.content()).toMatch(/<rss[\s>]|<feed[\s>]/i)
})

test('widening the viewport closes the drawer and unblocks the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/?theme=admin')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.locator('.ac-overlay')).toBeVisible()
  await page.setViewportSize({ width: 1100, height: 800 })
  await expect(page.locator('.ac-overlay')).toHaveCount(0)
  await expect(page.locator('.ac-canvas')).not.toHaveAttribute('inert', '')
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.getByRole('heading', { name: 'Jorge Suarez', exact: true })).toBeVisible()
})

test('the mobile drawer traps focus and restores it when dismissed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/?theme=admin')
  const toggle = page.getByRole('button', { name: 'Open navigation' })
  await toggle.click()
  const rail = page.locator('#admin-rail')
  await expect(page.locator('.ac-canvas')).toHaveAttribute('inert', '')
  await expect(page.locator('.topbar-links')).toHaveAttribute('inert', '')
  await expect(page.locator('.ac-homage')).toHaveAttribute('inert', '')
  await expect.poll(() => rail.evaluate((node) => node.contains(document.activeElement))).toBe(true)

  for (let step = 0; step < 40; step += 1) await page.keyboard.press('Tab')
  await expect.poll(() => rail.evaluate((node) => node.contains(document.activeElement))).toBe(true)

  await rail.locator('a[href]').first().focus()
  await page.keyboard.press('Shift+Tab')
  await expect(rail.getByRole('button', { name: 'Close navigation' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(rail.locator('a[href]').first()).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()
  await expect(page.locator('.ac-overlay')).toHaveCount(0)
  await expect(page.locator('.ac-canvas')).not.toHaveAttribute('inert', '')

  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.locator('.ac-overlay').click({ position: { x: 360, y: 240 } })
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()

  await page.getByRole('button', { name: 'Open navigation' }).click()
  await rail.getByRole('button', { name: 'Close navigation' }).click()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()

  await page.getByRole('button', { name: 'Open navigation' }).click()
  await rail.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('.ac-overlay')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open navigation' })).not.toBeFocused()
})

test('admin focus rings and article navigation stay readable without changing classic', async ({ page }) => {
  await page.goto('/?theme=admin')
  const adminTag = page.locator('.post-card-tags a').first()
  const adminKeyword = page.getByRole('combobox', { name: 'Keyword' })
  await adminTag.evaluate((element) => {
    if (element instanceof HTMLElement) element.focus({ focusVisible: true })
  })
  await expect.poll(() => adminTag.evaluate((element) => getComputedStyle(element).outlineColor)).toBe('rgb(15, 108, 189)')
  await adminKeyword.evaluate((element) => {
    if (element instanceof HTMLElement) element.focus({ focusVisible: true })
  })
  await expect.poll(() => adminKeyword.evaluate((element) => getComputedStyle(element).outlineColor)).toBe('rgb(15, 108, 189)')

  await page.goto('/bitlocker-startup-pin-after-autopilot?theme=admin')
  const adminSpan = page.locator('.article-nav-link span').first()
  await expect(adminSpan).toHaveText('Previous field note')
  const adminContrast = await adminSpan.evaluate((element) => {
    const style = getComputedStyle(element)
    const parent = element.parentElement ? getComputedStyle(element.parentElement).backgroundColor : ''
    const parse = (value: string) => value.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0]
    const channel = (unit: number) => {
      const srgb = unit / 255
      return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
    }
    const luminance = (channels: number[]) =>
      0.2126 * channel(channels[0]) + 0.7152 * channel(channels[1]) + 0.0722 * channel(channels[2])
    const foreground = luminance(parse(style.color))
    const background = luminance(parse(parent))
    const lighter = Math.max(foreground, background)
    const darker = Math.min(foreground, background)
    return {
      color: style.color,
      background: parent,
      ratio: (lighter + 0.05) / (darker + 0.05),
    }
  })
  expect(adminContrast.color).toBe('rgb(36, 36, 36)')
  expect(adminContrast.background).toBe('rgb(255, 255, 255)')
  expect(adminContrast.ratio).toBeGreaterThanOrEqual(4.5)

  await page.goto('/?theme=classic')
  const classicTag = page.locator('.post-card-tags a').first()
  await classicTag.evaluate((element) => {
    if (element instanceof HTMLElement) element.focus({ focusVisible: true })
  })
  await expect.poll(() => classicTag.evaluate((element) => getComputedStyle(element).outlineColor)).toBe('rgb(215, 255, 227)')
  await expectOutline(page.locator('.hero-links a').first(), 'rgb(215, 255, 227)')

  await page.goto('/bitlocker-startup-pin-after-autopilot?theme=classic')
  await expect(page.locator('.admin-center')).toHaveCount(0)
  await expect(page.locator('.article-nav-link span').first()).toHaveCSS('color', 'rgb(215, 255, 227)')
  await expect(page.locator('.post-content')).toContainText('startup PIN')
  await expectOutline(page.locator('.wayfinder__list a').first(), 'rgb(215, 255, 227)')
  await expectOutline(page.locator('.related-notes a').first(), 'rgb(215, 255, 227)')
})

test('rail Home returns a scrolled listing to the top without following a modified click', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.addInitScript(() => localStorage.setItem('blog-theme', 'admin'))
  await page.goto('/')
  await expect(page.locator('.admin-center')).toBeVisible()
  const home = page.getByRole('navigation', { name: 'Admin center' }).getByRole('link', { name: 'Home', exact: true })
  await page.evaluate(() => window.scrollTo(0, 900))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400)
  await home.click({ modifiers: ['Control'] })
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400)
  await home.click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2)
  await expect(page).not.toHaveURL(/#/)
})

test('Dashboard keeps the overview available after the grid is sorted', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?theme=admin')
  await page.getByRole('columnheader', { name: 'Title' }).getByRole('button').click()
  await expect(page.locator('#overview')).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Admin center' }).getByRole('link', { name: 'Dashboard' }).click()
  await expect(page).toHaveURL(/#overview$/)
  await expect(page.locator('#overview')).toBeVisible()
  await expectSectionBelowHeader(page, 'overview')
  await expect(page.getByText('Latest dispatch')).toHaveCount(0)
  await expect(page.locator('#overview')).toContainText('Learn Intune and PowerShell automation: field notes')
})

test('the posts grid omits a partial aria-rowcount', async ({ page }) => {
  await page.goto('/?theme=admin')
  const table = page.getByRole('table', { name: 'Posts' })
  await expect(table).toBeVisible()
  expect(await table.getAttribute('aria-rowcount')).toBeNull()
  await expect(table.getByRole('row').first()).not.toHaveAttribute('aria-rowindex', /.*/)
  await page.goto('/?theme=admin&tag=zzzz-no-match')
  await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible()
  await expect(page.getByText('No posts match these filters.')).toBeVisible()
  expect(await page.getByRole('table', { name: 'Posts' }).getAttribute('aria-rowcount')).toBeNull()
})

test('admin link focus rings stay blue where classic rules are more specific', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?theme=admin')
  await expectOutline(page.locator('.hero-links a').first(), 'rgb(15, 108, 189)')
  const cardLink = page.locator('.post-card-link').first()
  await cardLink.evaluate((element) => {
    if (element instanceof HTMLElement) element.focus({ focusVisible: true })
  })
  await expect.poll(() => page.locator('.post-card').first().evaluate((element) => getComputedStyle(element).outlineColor)).toBe('rgb(15, 108, 189)')

  await page.goto('/about?theme=admin')
  await expectOutline(page.locator('.profile-links a').first(), 'rgb(15, 108, 189)')

  await page.goto('/learn-intune-powershell-automation?theme=admin')
  await expectOutline(page.locator('.wayfinder__list a').first(), 'rgb(15, 108, 189)')
  await expectOutline(page.locator('.related-notes a').first(), 'rgb(15, 108, 189)')

  await page.goto('/?theme=admin')
  const newsletter = page.locator('.newsletter-signup__field input')
  await expectOutline(newsletter, 'rgb(15, 108, 189)')
  await page.goto('/?theme=classic')
  const classicNewsletter = page.locator('.newsletter-signup__field input')
  await classicNewsletter.evaluate((element) => {
    if (element instanceof HTMLElement) element.focus({ focusVisible: true })
  })
  await expect.poll(() => classicNewsletter.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('none')
})

test('switching themes keeps the current hash and other query params', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?category=intune&theme=admin#posts')
  const theme = page.getByRole('combobox', { name: 'Theme' })
  await theme.selectOption('classic')
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).toHaveURL(/theme=classic/)
  await expect(page).toHaveURL(/#posts$/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic')
  await theme.selectOption('admin')
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).toHaveURL(/theme=admin/)
  await expect(page).toHaveURL(/#posts$/)
  await expect(page.locator('.admin-center')).toBeVisible()
})

test('a rail link to the current url closes the drawer', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('blog-theme', 'admin'))
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/?category=intune')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.locator('.ac-canvas')).toHaveAttribute('inert', '')
  const devices = page.getByRole('navigation', { name: 'Admin center' }).getByRole('link', { name: 'Devices' })
  await devices.evaluate((element) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }))
  })
  await expect(page.locator('.ac-overlay')).toBeVisible()
  await devices.click()
  await expect(page).toHaveURL(/category=intune/)
  await expect(page.locator('.ac-overlay')).toHaveCount(0)
  await expect(page.locator('.ac-canvas')).not.toHaveAttribute('inert', '')
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()
})

test('filters and clear filter keep the posts scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?theme=admin#posts')
  await expectSectionBelowHeader(page, 'posts')
  const scrolled = () => page.evaluate(() => window.scrollY)
  const heroTop = () => page.locator('#home-title').evaluate((element) => element.getBoundingClientRect().top)
  await expect.poll(scrolled).toBeGreaterThan(200)

  await page.getByRole('button', { name: /^Intune\b/ }).evaluate((element) => {
    if (element instanceof HTMLElement) element.click()
  })
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).not.toHaveURL(/#/)
  await expectSectionBelowHeader(page, 'posts')
  await expect.poll(heroTop).toBeLessThan(0)
  await expect.poll(scrolled).toBeGreaterThan(120)

  await page.getByRole('combobox', { name: 'Keyword' }).evaluate((element) => {
    if (!(element instanceof HTMLSelectElement)) return
    const option = element.options[1]
    element.value = option.value
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page).toHaveURL(/tag=/)
  await expectSectionBelowHeader(page, 'posts')
  await expect.poll(heroTop).toBeLessThan(0)

  await page.goto('/?theme=admin&category=intune#posts')
  await expectSectionBelowHeader(page, 'posts')
  await page.getByRole('link', { name: 'Clear filter ×' }).evaluate((element) => {
    if (element instanceof HTMLElement) element.click()
  })
  await expect(page).not.toHaveURL(/category=/)
  await expect(page).not.toHaveURL(/#/)
  await expectSectionBelowHeader(page, 'posts')
  await expect.poll(heroTop).toBeLessThan(0)
  await expect.poll(scrolled).toBeGreaterThan(120)

  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Home' }).evaluate((element) => {
    if (element instanceof HTMLElement) element.click()
  })
  await expect.poll(scrolled).toBeLessThan(2)
})

test('the mobile drawer starts below the wrapped header', async ({ page }) => {
  for (const width of [320, 360, 414]) {
    await page.setViewportSize({ width, height: 720 })
    await page.goto('/?theme=admin')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const home = page.getByRole('navigation', { name: 'Admin center' }).getByRole('link', { name: 'Home', exact: true })
    await expect(home).toBeFocused()
    const clear = await page.evaluate(() => {
      const header = document.querySelector('.topbar')!.getBoundingClientRect()
      const link = document.querySelector<HTMLElement>('#admin-rail a')!
      const box = link.getBoundingClientRect()
      const canvas = document.querySelector('.ac-canvas')!.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + 20, box.top + box.height / 2)
      return {
        linkTop: box.top,
        headerBottom: header.bottom,
        canvasTop: canvas.top,
        ringTop: box.top - (Number.parseFloat(getComputedStyle(link).outlineOffset) || 0) - (Number.parseFloat(getComputedStyle(link).outlineWidth) || 0),
        scrollerTop: link.closest('.ac-rail-scroll')?.getBoundingClientRect().top ?? 0,
        hitHome: Boolean(hit && (hit === link || link.contains(hit))),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })
    expect(clear.linkTop, `${width}px home link`).toBeGreaterThanOrEqual(clear.headerBottom - 1)
    expect(clear.ringTop, `${width}px focus ring`).toBeGreaterThanOrEqual(clear.headerBottom - 1)
    expect(clear.ringTop, `${width}px ring clip`).toBeGreaterThanOrEqual(clear.scrollerTop - 1)
    expect(clear.canvasTop, `${width}px canvas`).toBeGreaterThanOrEqual(clear.headerBottom - 1)
    expect(clear.hitHome, `${width}px hit test`).toBe(true)
    expect(clear.overflow, `${width}px overflow`).toBeLessThanOrEqual(1)
    await page.keyboard.press('Escape')
  }
})

test('the desktop rail clears the measured header', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 800 })
  await page.goto('/?theme=admin')
  const gap = await page.evaluate(() => {
    const header = document.querySelector('.topbar')!.getBoundingClientRect()
    const rail = document.querySelector('#admin-rail')!.getBoundingClientRect()
    return rail.top - header.bottom
  })
  expect(gap).toBeGreaterThanOrEqual(-1)
  expect(gap).toBeLessThan(8)
})

test('wrapping drawer focus keeps Home in view', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 520 })
  await page.goto('/?theme=admin')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  const rail = page.locator('#admin-rail')
  const home = rail.getByRole('link', { name: 'Home', exact: true })
  const overflowed = await rail.locator('.ac-rail-scroll').evaluate((element) => {
    element.scrollTop = element.scrollHeight
    return element.scrollTop > 40
  })
  expect(overflowed).toBe(true)
  await rail.getByRole('button', { name: 'Close navigation' }).focus()
  await page.keyboard.press('Tab')
  await expect(home).toBeFocused()
  await expect.poll(() => home.evaluate((element) => {
    const scroller = element.closest('.ac-rail-scroll')
    if (!scroller) return 'missing'
    const link = element.getBoundingClientRect()
    const view = scroller.getBoundingClientRect()
    const header = document.querySelector('.topbar')!.getBoundingClientRect()
    const clear = link.top >= header.bottom - 1 && link.top >= view.top - 1 && link.bottom <= view.bottom + 1
    return clear ? 'visible' : `top:${link.top.toFixed(0)} header:${header.bottom.toFixed(0)} view:${view.top.toFixed(0)}-${view.bottom.toFixed(0)}`
  })).toBe('visible')
})

test('a wayfinder fragment survives the theme switch and history', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?theme=admin')
  await page.getByRole('link', { name: /Learn Intune and PowerShell automation/ }).first().click()
  await expect(page).toHaveURL(/learn-intune-powershell-automation/)
  const before = await page.evaluate(() => window.history.state as { idx?: number, key?: string } | null)
  expect(typeof before?.idx).toBe('number')
  expect(before?.key).toBeTruthy()

  const jump = page.locator('.wayfinder__list a').nth(1)
  const href = await jump.getAttribute('href')
  expect(href).toMatch(/^#/)
  await jump.click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  const after = await page.evaluate(() => window.history.state as { idx?: number, key?: string } | null)
  expect(after?.key).toBe(before?.key)
  expect(after?.idx).toBe(before?.idx)

  await page.getByRole('combobox', { name: 'Theme' }).selectOption('classic')
  await expect(page).toHaveURL(/theme=classic/)
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(page.locator('.admin-center')).toHaveCount(0)
  await expect(page.locator(href!)).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/\?theme=admin$/)
  await page.goForward()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(page).toHaveURL(/learn-intune-powershell-automation/)
})
