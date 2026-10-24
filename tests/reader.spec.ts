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
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('category chips and the keyword select filter without a category dropdown', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('input[type="search"]')).toHaveCount(0)
  await expect(page.getByRole('searchbox')).toHaveCount(0)
  await expect(page.locator('#field-note-category')).toHaveCount(0)
  await expect(page.locator('#field-note-tag')).toBeVisible()
  const all = page.getByRole('button', { name: /^All\b/ })
  await all.focus()
  expect(await all.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')

  const intune = page.getByRole('button', { name: /^Intune\b/ })
  await intune.click()
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).not.toHaveURL(/[?&]q=/)
  await expect(intune).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Category: Intune' })).toBeVisible()

  await page.goto('/?tag=windows')
  await page.getByRole('button', { name: /^Intune\b/ }).click()
  await expect(page).toHaveURL(/tag=windows/)
  await expect(page).toHaveURL(/category=intune/)
  await expect(page).not.toHaveURL(/[?&]page=/)

  await page.getByRole('button', { name: /^PowerShell\b/ }).click()
  await expect(page.getByRole('button', { name: /^PowerShell\b/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/tag=windows/)
  await page.getByRole('button', { name: /^All\b/ }).click()
  await expect(page.getByRole('button', { name: /^All\b/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/tag=windows/)
  await expect(page).not.toHaveURL(/category=/)
})

test('homepage keeps the name, tagline, and one sentence', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Jorgeasaurus' })).toBeVisible()
  await expect(page.locator('.hero-signal')).toHaveText('Learn. Build. Automate.')
  await expect(page.locator('.hero-panel .hero-copy')).toContainText('Practical engineering notes')
  await expect(page.locator('.hero-ledger')).toHaveCount(0)
  await expect(page.locator('.hero-latest')).toHaveCount(0)
  await expect(page.locator('.hero-panel .eyebrow')).toHaveCount(0)
  const card = page.locator('.post-card--featured')
  await expect(card).toContainText('Latest dispatch')
  await expect(card).toContainText(/No\. \d+/)
  await expect(card).toContainText('min read')
  await expect(card.locator('.post-card-cta')).toHaveText(/Read field note/)
  expect(await card.locator('.post-card-cta').evaluate((element) => getComputedStyle(element).textTransform)).toBe('none')
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

  await expect(page.locator('.post__header').getByRole('button', { name: 'Back to top' })).toHaveCount(0)
  await expect(page.locator('.post__header').getByRole('button', { name: 'Copy link' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to top' })).toHaveCount(1)
  await page.getByRole('button', { name: 'Back to top' }).click()
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

test('backdrop credit follows navigation and page content in tab order', async ({ page }) => {
  let releaseChunk = () => {}
  const chunkGate = new Promise<void>((resolve) => {
    releaseChunk = resolve
  })
  await page.route(/ai-agents-changed-how-i-build-things-[^/?#]+\.js/, async (route) => {
    await chunkGate
    await route.continue()
  })

  try {
    await page.goto('/ai-agents-changed-how-i-build-things', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.loading-inline')).toBeVisible()
    await expectCreditFollowsPage(page)
    releaseChunk()
    await expect(page.locator('.post-content')).toBeVisible()
    await expectCreditFollowsPage(page)

    for (const path of ['/', '/about', '/projects', '/missing/seo/route', '/missing-seo-regression-post']) {
      await page.goto(path)
      await expectCreditFollowsPage(page)
    }

    await page.goto('/social-card')
    await expect(page.locator('.backdrop-credit')).toHaveCount(0)
    await expect(page.locator('.wallpaper-stage')).toHaveCount(1)
  } finally {
    releaseChunk()
  }
})

async function expectCreditFollowsPage(page: Page) {
  await expect(page.locator('.backdrop-credit')).toHaveCount(1)
  await page.evaluate(() => {
    const probe = document.createElement('button')
    probe.type = 'button'
    probe.tabIndex = 0
    probe.dataset.tabProbe = 'true'
    probe.style.position = 'absolute'
    probe.style.left = '-9999px'
    document.body.insertBefore(probe, document.body.firstChild)
    probe.focus()
  })
  await page.keyboard.press('Tab')
  await expect(page.locator('nav[aria-label="Primary navigation"] .brand-link')).toBeFocused()
  await expect(page.locator('.backdrop-credit :focus')).toHaveCount(0)
  await page.evaluate(() => document.querySelector('[data-tab-probe]')?.remove())

  const order = await page.evaluate(() => {
    const credit = document.querySelector('.backdrop-credit')
    const nav = document.querySelector('nav[aria-label="Primary navigation"]')
    const main = document.querySelector('main.blog-shell')
    if (!credit || !nav || !main) return null
    const following = Node.DOCUMENT_POSITION_FOLLOWING
    const content = [...main.children].filter((child) =>
      child !== credit
      && !child.classList.contains('wallpaper-stage')
      && !child.classList.contains('topbar')
      && !child.classList.contains('reading-progress')
      && !child.classList.contains('reading-status')
    )
    const nodes = [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')]
    const visible = nodes.filter((element) => {
      if (element.tabIndex < 0) return false
      if ('disabled' in element && element.disabled) return false
      if (element.closest('[aria-hidden="true"]')) return false
      const style = getComputedStyle(element)
      return style.display !== 'none' && style.visibility !== 'hidden'
    })
    const positive = visible
      .map((element, index) => ({ element, index, tab: element.tabIndex }))
      .filter((item) => item.tab > 0)
      .sort((a, b) => a.tab - b.tab || a.index - b.index)
      .map((item) => item.element)
    const sequence = [...positive, ...visible.filter((element) => element.tabIndex === 0)]
    const label = (element: HTMLElement) => {
      const group = element.closest('.backdrop-credit')
        ? 'credit'
        : element.closest('nav[aria-label="Primary navigation"]')
          ? 'nav'
          : 'content'
      const name = (element.getAttribute('aria-label') || element.textContent || element.tagName).replace(/\s+/g, ' ').trim()
      return `${group}:${name}`
    }
    return {
      contentPrecedes: content.length > 0 && content.every((child) => Boolean(child.compareDocumentPosition(credit) & following)),
      navPrecedes: Boolean(nav.compareDocumentPosition(credit) & following),
      sequence: sequence.map(label),
    }
  })

  expect(order).not.toBeNull()
  expect(order!.navPrecedes).toBe(true)
  expect(order!.contentPrecedes).toBe(true)
  const creditAt = order!.sequence.findIndex((item) => item.startsWith('credit:'))
  const lastNavAt = order!.sequence.map((item, index) => (item.startsWith('nav:') ? index : -1)).filter((index) => index >= 0).at(-1) ?? -1
  const contentStops = order!.sequence
    .map((item, index) => (item.startsWith('content:') ? index : -1))
    .filter((index) => index >= 0)
  expect(creditAt).toBeGreaterThan(lastNavAt)
  expect(contentStops.length === 0 || Math.max(...contentStops) < creditAt).toBe(true)
  expect(order!.sequence.slice(creditAt)).toEqual([
    'credit:Colchuck Lake',
    'credit:Buidhe',
    'credit:CC BY-SA 4.0',
  ])

  await page.evaluate(() => {
    const creditLink = document.querySelector<HTMLElement>('.backdrop-credit a')
    const nodes = [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')]
    const visible = nodes.filter((element) => {
      if (element.tabIndex < 0) return false
      if ('disabled' in element && element.disabled) return false
      if (element.closest('[aria-hidden="true"]')) return false
      const style = getComputedStyle(element)
      return style.display !== 'none' && style.visibility !== 'hidden'
    })
    const sequence = [
      ...visible.filter((element) => element.tabIndex > 0),
      ...visible.filter((element) => element.tabIndex === 0),
    ]
    sequence[sequence.indexOf(creditLink!) - 1]?.focus()
  })
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Colchuck Lake', exact: true })).toBeFocused()
}

test('publishes the Colchuck Lake backdrop credit', async ({ page }) => {
  await page.goto('/')
  const credit = page.locator('.backdrop-credit')
  await expect(credit).toBeVisible()
  await expect(credit).toContainText('Backdrop:')
  await expect(credit).toContainText('(cropped to 16:9, WebP)')

  const links = [
    ['Colchuck Lake', 'https://commons.wikimedia.org/wiki/File:Colchuck_Lake_(11_October_2024)_10.jpg'],
    ['Buidhe', 'https://commons.wikimedia.org/wiki/User:Buidhe'],
    ['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ] as const

  for (const [name, href] of links) {
    const link = credit.getByRole('link', { name, exact: true })
    await expect(link).toHaveAttribute('href', href)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }

  await page.goto('/ai-agents-changed-how-i-build-things')
  await expect(page.locator('.reading-status')).toBeVisible()
  await credit.scrollIntoViewIfNeeded()
  const separated = await page.evaluate(() => {
    const creditBox = document.querySelector('.backdrop-credit')?.getBoundingClientRect()
    const statusBox = document.querySelector('.reading-status')?.getBoundingClientRect()
    if (!creditBox || !statusBox) return false
    const hits = (a: DOMRect, b: DOMRect) =>
      a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1
    const coversControl = [...document.querySelectorAll('.wayfinder a, .article-action, .pagination-link')]
      .some((element) => hits(creditBox, element.getBoundingClientRect()))
    return !hits(creditBox, statusBox) && !coversControl && getComputedStyle(document.querySelector('.backdrop-credit')!).position !== 'fixed'
  })
  expect(separated).toBe(true)
  await expectNoHorizontalOverflow(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.backdrop-credit')).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.goto('/social-card')
  await expect(page.locator('.backdrop-credit')).toHaveCount(0)
  await expect(page.locator('.wallpaper-stage')).toHaveCount(1)
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
