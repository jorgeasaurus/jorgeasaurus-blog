import { serializeJsonLd } from '../src/lib/pageMetadata.mjs'
import { expect, test, type Page, type BrowserContext } from '@playwright/test'
import posts from '../src/content/posts'

const origin = 'https://www.jorgeasaur.us'
const [firstPost, secondPost] = posts

async function head(page: Page) {
  return page.evaluate(() => ({
    title: document.title,
    canonical: [...document.head.querySelectorAll('link[rel="canonical"]')]
      .map((node) => node.getAttribute('href')),
    meta: [...document.head.querySelectorAll<HTMLMetaElement>(
      'meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], meta[property^="article:"]',
    )].map((node) => [node.name || node.getAttribute('property'), node.content])
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    schema: [...document.head.querySelectorAll('script[type="application/ld+json"]')]
      .map((node) => JSON.parse(node.textContent || '{}')),
  }))
}

async function uniqueHead(page: Page) {
  const state = await head(page)
  expect(state.canonical.length).toBeLessThanOrEqual(1)
  expect(state.schema.length).toBeLessThanOrEqual(1)
  const singletons = state.meta.filter(([key]) => key !== 'article:tag').map(([key]) => key)
  expect(singletons.length).toBe(new Set(singletons).size)
  const tags = state.meta.filter(([key]) => key === 'article:tag').map(([, value]) => value)
  expect(tags.length).toBe(new Set(tags).size)
}

async function meta(page: Page, selector: string, value: string) {
  await expect(page.locator(`head meta[${selector}]`)).toHaveAttribute('content', value)
}

async function postHead(page: Page, post: typeof firstPost) {
  await expect(page.getByRole('heading', { level: 1, name: post.title, exact: true })).toBeVisible()
  await expect(page).toHaveTitle(`${post.title} | Jorgeasaurus`)
  await meta(page, 'name="description"', post.description || '')
  await meta(page, 'name="robots"', 'index,follow')
  await meta(page, 'property="og:type"', 'article')
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${origin}/${post.slug}`)
  await meta(page, 'property="og:image"', `${origin}${post.socialImage?.src || '/images/social-card.png'}`)
  await meta(page, 'name="twitter:image"', `${origin}${post.socialImage?.src || '/images/social-card.png'}`)
  expect(await page.locator('head meta[property="article:tag"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('content')))).toEqual(post.tags || [])
  expect((await head(page)).schema).toEqual([
    expect.objectContaining({ '@type': 'Article', headline: post.title, url: `${origin}/${post.slug}` }),
  ])
  await uniqueHead(page)
}

async function homeHead(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jorgeasaurus')
  await meta(page, 'name="robots"', 'index,follow')
  await meta(page, 'property="og:type"', 'website')
  await meta(page, 'property="og:image"', `${origin}/images/social-card.png`)
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${origin}/`)
  await expect(page.locator('head meta[property^="article:"]')).toHaveCount(0)
  const schema = JSON.stringify((await head(page)).schema)
  expect(schema).toContain('WebSite')
  expect(schema).toContain('WebPage')
  expect(schema).not.toContain('"@type":"Article"')
  await uniqueHead(page)
}

const navigation = (page: Page) => page.getByRole('navigation', { name: 'Primary navigation' })

async function blockExternalRequests(context: BrowserContext, baseURL: string) {
  const localOrigin = new URL(baseURL).origin
  await context.route((url) => url.origin !== localOrigin, (route) => route.abort())
}

test.beforeEach(async ({ page, context, baseURL }) => {
  await blockExternalRequests(context, baseURL!)
  await page.addInitScript(() => localStorage.setItem('newsletter-popup-subscribed', 'true'))
})

test('static HTML matches hydrated metadata on public and utility pages', async ({ browser, page, baseURL }) => {
  const crawler = await browser.newContext({ javaScriptEnabled: false, baseURL })
  await blockExternalRequests(crawler, baseURL!)
  const rawPage = await crawler.newPage()
  try {
    for (const path of ['/', '/about', '/projects', `/${firstPost.slug}`, '/social-card', '/404.html']) {
      // Vite preview uses the SPA fallback for extensionless URLs, unlike production.
      const htmlPath = path === '/' || path.endsWith('.html') ? path : `${path}/index.html`
      await rawPage.goto(htmlPath, { waitUntil: 'domcontentloaded' })
      const expected = await head(rawPage)
      await page.route((url) => url.pathname === path, async (route) => {
        const response = await page.request.get(htmlPath)
        await route.fulfill({ response })
      }, { times: 1 })
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#root')).not.toBeEmpty()
      await expect.poll(() => head(page)).toEqual(expected)
      await uniqueHead(page)
    }
  } finally {
    await crawler.close()
  }
})

test('real links and browser history replace metadata and clear article-specific values', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await homeHead(page)
  const home = await head(page)
  await navigation(page).getByRole('link', { name: 'About', exact: true }).click()
  await expect(page).toHaveTitle('About | Jorgeasaurus')
  await meta(page, 'name="description"', 'About Jorgeasaurus — engineering notes on PowerShell, endpoint management, Microsoft Graph, and automation.')
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${origin}/about`)
  const about = await head(page)
  await navigation(page).getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page).toHaveTitle('Projects | Jorgeasaurus')
  await meta(page, 'name="description"', 'Projects by Jorgeasaurus: endpoint engineering tools, Microsoft Graph apps, PowerShell modules, and automation projects.')
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${origin}/projects`)
  const projects = await head(page)
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await expect.poll(() => head(page)).toEqual(about)
  await page.goForward({ waitUntil: 'domcontentloaded' })
  await expect.poll(() => head(page)).toEqual(projects)
  await navigation(page).getByRole('link', { name: 'Home', exact: true }).click()
  await page.getByRole('link', { name: firstPost.title, exact: true }).click()
  await postHead(page, firstPost)
  await page.getByRole('navigation', { name: 'Adjacent field notes' }).getByRole('link', { name: new RegExp(secondPost.title) }).click()
  await postHead(page, secondPost)
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await postHead(page, firstPost)
  await navigation(page).getByRole('link', { name: 'Home', exact: true }).click()
  await homeHead(page)
  await expect.poll(() => head(page)).toEqual(home)
})

test('filtered listing and utility noindex state do not leak to public pages', async ({ page }) => {
  await page.goto(`/?tag=${firstPost.tags![0]}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: `Tagged: ${firstPost.tags![0]}` })).toBeVisible()
  await meta(page, 'name="robots"', 'noindex,follow')
  await page.getByRole('link', { name: firstPost.title, exact: true }).click()
  await postHead(page, firstPost)
  await page.goto('/social-card', { waitUntil: 'domcontentloaded' })
  await meta(page, 'name="robots"', 'noindex,nofollow')
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0)
  await expect(page.locator('head script[type="application/ld+json"]')).toHaveCount(0)
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await postHead(page, firstPost)
})

test('missing posts and unmatched routes remove canonical and schema, then recover', async ({ page }) => {
  for (const [path, heading] of [['/missing-seo-regression-post', 'Post Not Found'], ['/missing/seo/route', 'Page Not Found']]) {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await meta(page, 'name="robots"', 'noindex,nofollow')
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0)
    await expect(page.locator('head script[type="application/ld+json"]')).toHaveCount(0)
    await expect(page.locator('head meta[property^="article:"]')).toHaveCount(0)
    await navigation(page).getByRole('link', { name: 'Home', exact: true }).click()
    await homeHead(page)
  }
})


test('a failed article download clears generated article metadata and recovers', async ({ page }) => {
  let blocked = false
  await page.route((url) => url.pathname === `/${firstPost.slug}`, async (route) => {
    const response = await page.request.get(`/${firstPost.slug}/index.html`)
    await route.fulfill({ response })
  }, { times: 1 })
  await page.route(`**/assets/${firstPost.slug}-*.js`, async (route) => {
    blocked = true
    await route.abort('failed')
  })
  await page.goto(`/${firstPost.slug}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1, name: 'Post Not Found' })).toBeVisible()
  expect(blocked).toBe(true)
  await meta(page, 'name="robots"', 'noindex,nofollow')
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0)
  await expect(page.locator('head script[type="application/ld+json"]')).toHaveCount(0)
  await expect(page.locator('head meta[property^="article:"]')).toHaveCount(0)
  await navigation(page).getByRole('link', { name: 'Home', exact: true }).click()
  await homeHead(page)
})


test('back navigation restores a loaded article after its adjacent article fails', async ({ page }) => {
  await page.goto(`/${firstPost.slug}`, { waitUntil: 'domcontentloaded' })
  await postHead(page, firstPost)
  let blocked = false
  await page.route(`**/assets/${secondPost.slug}-*.js`, async (route) => {
    blocked = true
    await route.abort('failed')
  })
  await page.getByRole('navigation', { name: 'Adjacent field notes' })
    .getByRole('link', { name: new RegExp(secondPost.title) }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Post Not Found' })).toBeVisible()
  expect(blocked).toBe(true)
  await meta(page, 'name="robots"', 'noindex,nofollow')
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0)
  await expect(page.locator('head script[type="application/ld+json"]')).toHaveCount(0)
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await postHead(page, firstPost)
})


test('JSON-LD survives HTML serialization without creating injected markup', async ({ page }) => {
  const text = '</script><script>window.injected = true</script><img id="injected"> < & " Unicode: café'
  const value = { '@context': 'https://schema.org', '@type': 'Article', headline: text, description: text, keywords: text }
  const serialized = serializeJsonLd(value)
  await page.setContent(`<script type="application/ld+json" id="ld-graph">${serialized}</script>`)
  await expect(page.locator('script')).toHaveCount(1)
  await expect(page.locator('#injected')).toHaveCount(0)
  expect(await page.evaluate(() => Reflect.has(window, 'injected'))).toBe(false)
  expect(await page.locator('#ld-graph').evaluate((node) => JSON.parse(node.textContent || '{}'))).toEqual(value)
})
